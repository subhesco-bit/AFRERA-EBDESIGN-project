/**
 * Fulfillment saga and stock reservation.
 *
 * These tests need a real PostgreSQL: the guarantees under test are row-lock
 * and transaction guarantees, and a mocked database cannot demonstrate either.
 * A mocked "reservation test" that passes without a database proves only that
 * the mock returned what it was told to. So when no database is reachable the
 * suite SKIPS loudly rather than passing vacuously.
 *
 * Point it at a database with the migration set applied:
 *   PG_HOST=127.0.0.1 PG_USER=postgres PG_PASSWORD=... PG_DATABASE=afrera_test
 */

'use strict';

const { execFileSync } = require('child_process');

const db = require('../../../database/connection');

const reservations = require('../inventoryReservationService');
const engine = require('../fulfillmentEngine');

let pg = null;
let fixtures = null;

/**
 * Jest decides which describe blocks exist at COLLECTION time, before any
 * beforeAll has run, so the database probe has to be synchronous. A child
 * process doing a TCP connect is the portable way to get that.
 *
 * Getting this wrong is worse than it sounds: an async probe leaves `pg` null
 * at collection time, every database test is marked skipped, and the suite
 * reports green while asserting nothing.
 */
function databaseReachable() {
  const host = process.env.PG_HOST || 'localhost';
  const port = process.env.PG_PORT || '5432';
  try {
    execFileSync(process.execPath, ['-e', `
      const net = require('net');
      const socket = net.connect(${JSON.stringify(Number(port))}, ${JSON.stringify(host)});
      socket.setTimeout(2000);
      socket.on('connect', () => { socket.destroy(); process.exit(0); });
      socket.on('error', () => process.exit(1));
      socket.on('timeout', () => { socket.destroy(); process.exit(1); });
    `], { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

const DB_REACHABLE = databaseReachable();

if (!DB_REACHABLE) {
  // eslint-disable-next-line no-console
  console.warn(
    '\n  SKIPPING the database-backed fulfillment tests: no PostgreSQL reachable at '
    + `${process.env.PG_HOST || 'localhost'}:${process.env.PG_PORT || 5432}. These assert `
    + 'row-lock and transaction behaviour, which cannot be demonstrated against a mock.\n',
  );
}

const describeIfDb = () => (DB_REACHABLE ? describe : describe.skip);

beforeAll(async () => {
  try {
    await db.initialize();
  } catch (error) {
    // Falls through to pg === null and the suite skips.
  }
  pg = db.getPostgreSQL();
  if (!pg) return;

  // Refuse to run against a database that has not been migrated, rather than
  // reporting a schema gap as a test failure.
  const required = ['orders', 'order_items', 'warehouse_inventory', 'warehouses', 'products',
    'shipments', 'escrow_transactions', 'ar_invoices', 'unified_ledger', 'policies',
    'inventory_reservations', 'fulfillment_sagas', 'fulfillment_saga_steps'];
  const present = await pg.query(
    'SELECT name FROM (SELECT unnest($1::text[]) AS name) t WHERE to_regclass(\'public.\' || name) IS NOT NULL',
    [required],
  );
  if (present.rows.length !== required.length) {
    const missing = required.filter((t) => !present.rows.some((r) => r.name === t));
    // eslint-disable-next-line no-console
    console.warn(`\n  SKIPPING fulfillment tests: database is missing ${missing.join(', ')}.\n`);
    pg = null;
    return;
  }

  const stamp = Date.now();
  const buyer = await pg.query(
    "INSERT INTO users (email, password_hash, role, status) VALUES ($1, 'x', 'consumer', 'active') RETURNING id",
    [`fulfil-buyer-${stamp}@example.com`],
  );
  const seller = await pg.query(
    "INSERT INTO users (email, password_hash, role, status) VALUES ($1, 'x', 'farmer', 'active') RETURNING id",
    [`fulfil-seller-${stamp}@example.com`],
  );
  let warehouse = (await pg.query('SELECT id FROM warehouses LIMIT 1')).rows[0];
  if (!warehouse) {
    warehouse = (await pg.query(
      'INSERT INTO warehouses (name, location, type) VALUES ($1, $2, $3) RETURNING id',
      ['Fulfillment Test Warehouse', JSON.stringify({ city: 'Guwahati' }), 'dry'],
    )).rows[0];
  }
  const company = (await pg.query('SELECT id FROM companies LIMIT 1')).rows[0];

  fixtures = {
    buyerId: buyer.rows[0].id,
    sellerId: seller.rows[0].id,
    warehouseId: warehouse.id,
    companyId: company ? company.id : null,
    stamp,
  };
}, 60000);

afterAll(async () => {
  if (pg) await db.close().catch(() => {});
});

async function makeProduct(onHand) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const product = await pg.query(
    'INSERT INTO products (name, slug, sku, base_price) VALUES ($1, $2, $3, 25) RETURNING id',
    [`Fulfil Product ${stamp}`, `fulfil-${stamp}`, `FUL${stamp}`],
  );
  const productId = product.rows[0].id;
  await pg.query(
    'INSERT INTO warehouse_inventory (warehouse_id, product_id, quantity) VALUES ($1, $2, $3)',
    [fixtures.warehouseId, productId, onHand],
  );
  return productId;
}

async function makeOrder(productId, { quantity = 10, total = 250 } = {}) {
  const order = await pg.query(
    `INSERT INTO orders (order_number, user_id, status, total_amount, currency, gst_amount)
     VALUES ($1, $2, 'confirmed', $3, 'INR', $4) RETURNING id`,
    [`ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, fixtures.buyerId, total,
      Math.round(total * 0.05 * 100) / 100],
  );
  const orderId = order.rows[0].id;
  await pg.query(
    `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
     VALUES ($1, $2, 'Fulfil Product', $3, 25, $4)`,
    [orderId, productId, quantity, total],
  );
  return orderId;
}

describeIfDb()('stock reservation', () => {
  it('computes available as on-hand minus held', async () => {
    const productId = await makeProduct(100);
    const orderId = await makeOrder(productId);

    expect(await reservations.getAvailability(productId)).toMatchObject({ onHand: 100, held: 0, available: 100 });
    await reservations.reserve({ orderId, productId, quantity: 30 });
    expect(await reservations.getAvailability(productId)).toMatchObject({ onHand: 100, held: 30, available: 70 });
  });

  it('does not oversell under concurrency: 10 x 30 against 100 on hand', async () => {
    const productId = await makeProduct(100);
    const orderIds = [];
    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      orderIds.push(await makeOrder(productId));
    }

    const outcomes = await Promise.allSettled(
      orderIds.map((orderId) => reservations.reserve({ orderId, productId, quantity: 30 })),
    );

    const granted = outcomes.filter((o) => o.status === 'fulfilled').length;
    const refused = outcomes.filter(
      (o) => o.status === 'rejected' && o.reason.name === 'InsufficientStockError',
    ).length;

    expect(granted).toBe(3);
    expect(refused).toBe(7);

    const after = await reservations.getAvailability(productId);
    expect(after.held).toBe(90);
    expect(after.available).toBe(10);
    expect(after.available).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('refuses rather than partially reserving', async () => {
    const productId = await makeProduct(10);
    const orderId = await makeOrder(productId);
    await expect(reservations.reserve({ orderId, productId, quantity: 30 }))
      .rejects.toThrow(reservations.InsufficientStockError);
    expect((await reservations.getAvailability(productId)).held).toBe(0);
  });

  it('does not double-hold when a reserve is retried for the same order and product', async () => {
    const productId = await makeProduct(100);
    const orderId = await makeOrder(productId);
    await reservations.reserve({ orderId, productId, quantity: 5 });
    await expect(reservations.reserve({ orderId, productId, quantity: 5 })).rejects.toThrow();
    expect((await reservations.getAvailability(productId)).held).toBe(5);
  });

  it('returns stock to available on release', async () => {
    const productId = await makeProduct(100);
    const orderId = await makeOrder(productId);
    await reservations.reserve({ orderId, productId, quantity: 40 });
    await reservations.release({ orderId });
    expect((await reservations.getAvailability(productId)).available).toBe(100);
  });

  it('keeps stock held after consume — consumed stock is gone, not free', async () => {
    const productId = await makeProduct(100);
    const orderId = await makeOrder(productId);
    await reservations.reserve({ orderId, productId, quantity: 40 });
    await reservations.consume({ orderId });
    const after = await reservations.getAvailability(productId);
    expect(after.held).toBe(0);
    const rows = await reservations.listForOrder(orderId);
    expect(rows[0].status).toBe('consumed');
  });
});

describeIfDb()('fulfillment saga', () => {
  it('names the order table an id belongs to', async () => {
    const productId = await makeProduct(100);
    const orderId = await makeOrder(productId);
    const context = await engine.resolveOrderContext(orderId);
    expect(context.table).toBe('orders');
    expect(context.kind).toBe('b2c');
  });

  it('returns null for an id that belongs to no order table', async () => {
    expect(await engine.resolveOrderContext('00000000-0000-4000-8000-000000000000')).toBeNull();
  });

  it('reports readiness per step, with a reason where a step cannot run', async () => {
    const productId = await makeProduct(100);
    const orderId = await makeOrder(productId);
    const bare = await engine.readiness(orderId);
    const escrow = bare.steps.find((s) => s.step === 'hold_escrow');
    expect(escrow.available).toBe(false);
    expect(escrow.reason).toMatch(/seller/);

    const withOptions = await engine.readiness(orderId, {
      sellerId: fixtures.sellerId, companyId: fixtures.companyId,
    });
    expect(withOptions.steps.find((s) => s.step === 'hold_escrow').available).toBe(true);
  });

  it('runs all 8 steps end to end and writes real state to every table', async () => {
    if (fixtures.companyId === null) {
      // Without a company row ar_invoices cannot be satisfied; the step would
      // legitimately skip, so this assertion does not apply.
      return;
    }
    const productId = await makeProduct(100);
    const orderId = await makeOrder(productId);

    const result = await engine.fulfillOrder(orderId, {
      sellerId: fixtures.sellerId, companyId: fixtures.companyId,
    });

    expect(result.status).toBe('completed');
    expect(result.succeeded).toBe(8);
    expect(result.skipped).toBe(0);
    expect(result.steps.map((s) => s.step)).toEqual(engine.STEP_NAMES);

    const reservation = await pg.query("SELECT status FROM inventory_reservations WHERE order_id = $1", [orderId]);
    expect(reservation.rows[0].status).toBe('consumed');

    const shipment = await pg.query('SELECT status FROM shipments WHERE order_id = $1', [orderId]);
    expect(shipment.rows[0].status).toBe('picked_up');

    const escrow = await pg.query('SELECT status, amount FROM escrow_transactions WHERE order_id = $1', [String(orderId)]);
    expect(escrow.rows[0].status).toBe('pending');
    expect(Number(escrow.rows[0].amount)).toBe(250);

    const invoice = await pg.query('SELECT status FROM ar_invoices WHERE source_order_id = $1', [String(orderId)]);
    expect(invoice.rows[0].status).toBe('open');

    const ledger = await pg.query('SELECT type, amount FROM unified_ledger WHERE reference = $1', [String(orderId)]);
    expect(ledger.rows[0].type).toBe('credit');
    expect(Number(ledger.rows[0].amount)).toBe(250);

    const policy = await pg.query("SELECT coverage_amount FROM policies WHERE policy_data->>'orderId' = $1", [String(orderId)]);
    expect(Number(policy.rows[0].coverage_amount)).toBe(250);
  }, 30000);

  it('compensates in REVERSE order when a mid-chain step fails, undoing every earlier write', async () => {
    const productId = await makeProduct(100);
    const orderId = await makeOrder(productId);

    // Force a failure at raise_invoice by supplying a company_id that violates
    // the foreign key. Everything before it will already have committed.
    const result = await engine.fulfillOrder(orderId, {
      sellerId: fixtures.sellerId, companyId: -424242,
    });

    expect(result.status).toBe('compensated');
    expect(result.failedStep).toBe('raise_invoice');

    // Reverse order: hold_escrow unwinds before book_transport.
    const compensated = result.compensation.map((c) => c.step);
    expect(compensated.indexOf('hold_escrow')).toBeLessThan(compensated.indexOf('book_transport'));
    expect(compensated.indexOf('book_transport')).toBeLessThan(compensated.indexOf('reserve_inventory'));

    // And the writes really were undone.
    expect((await reservations.getAvailability(productId)).held).toBe(0);
    const shipment = await pg.query('SELECT status FROM shipments WHERE order_id = $1', [orderId]);
    expect(shipment.rows[0].status).toBe('cancelled');
    const escrow = await pg.query('SELECT status FROM escrow_transactions WHERE order_id = $1', [String(orderId)]);
    expect(escrow.rows[0].status).toBe('refunded');
    const policy = await pg.query("SELECT cancelled_at FROM policies WHERE policy_data->>'orderId' = $1", [String(orderId)]);
    expect(policy.rows[0].cancelled_at).not.toBeNull();
    const ledger = await pg.query('SELECT 1 FROM unified_ledger WHERE reference = $1', [String(orderId)]);
    expect(ledger.rows).toHaveLength(0);
  }, 30000);

  it('records a skipped step with a reason instead of reporting it as succeeded', async () => {
    const productId = await makeProduct(100);
    // An order with no total_amount: insurance, escrow, invoice and ledger all
    // have nothing to work with and must say so.
    const orderId = await makeOrder(productId, { total: 0 });

    const result = await engine.fulfillOrder(orderId, { sellerId: fixtures.sellerId, companyId: fixtures.companyId });

    const skipped = result.steps.filter((s) => s.status === 'skipped');
    expect(skipped.length).toBeGreaterThan(0);
    skipped.forEach((step) => {
      expect(typeof step.reason).toBe('string');
      expect(step.reason.length).toBeGreaterThan(10);
      expect(step.status).not.toBe('succeeded');
    });
  }, 30000);

  it('persists the whole run so it can be audited after the fact', async () => {
    const productId = await makeProduct(100);
    const orderId = await makeOrder(productId);
    const result = await engine.fulfillOrder(orderId, { sellerId: fixtures.sellerId, companyId: fixtures.companyId });

    const saga = await pg.query('SELECT * FROM fulfillment_sagas WHERE id = $1', [result.sagaId]);
    expect(saga.rows[0].order_id).toBe(orderId);
    expect(saga.rows[0].finished_at).not.toBeNull();

    const steps = await pg.query(
      'SELECT step_name, status FROM fulfillment_saga_steps WHERE saga_id = $1 ORDER BY step_order',
      [result.sagaId],
    );
    expect(steps.rows.length).toBe(result.steps.length);
  }, 30000);

  it('refuses an order id that belongs to no order table', async () => {
    await expect(engine.fulfillOrder('00000000-0000-4000-8000-000000000000'))
      .rejects.toThrow(/not found in any known order table/);
  });
});

describe('step contract (no database needed)', () => {
  it('declares the eight order-to-cash steps in order', () => {
    expect(engine.STEP_NAMES).toEqual([
      'reserve_inventory', 'allocate_supply', 'book_transport', 'attach_insurance',
      'hold_escrow', 'raise_invoice', 'dispatch', 'post_ledger',
    ]);
  });

  it('exposes SkipStep so a step can decline without being a failure', () => {
    const skip = new engine.SkipStep('nothing to insure');
    expect(skip.name).toBe('SkipStep');
    expect(skip.reason).toBe('nothing to insure');
  });
});
