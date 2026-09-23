/**
 * The canonical ledger read API.
 *
 * Needs a real PostgreSQL with the migration set applied: every assertion here
 * is about SQL aggregation over real rows, which a mock cannot demonstrate.
 * The database probe is SYNCHRONOUS so Jest's collection pass sees the result —
 * an async probe would mark every test skipped and report green while asserting
 * nothing.
 *
 *   PG_HOST=127.0.0.1 PG_USER=postgres PG_PASSWORD=... PG_DATABASE=afrera_test
 */

'use strict';

const { execFileSync } = require('child_process');

const db = require('../../../database/connection');
const ledger = require('../ledgerService');
const engine = require('../../fulfillment/fulfillmentEngine');

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
  console.warn('\n  SKIPPING ledger tests: no PostgreSQL reachable.\n');
}
const describeIfDb = () => (DB_REACHABLE ? describe : describe.skip);

let pg = null;
let companyId = null;
let fixtures = null;

beforeAll(async () => {
  if (!DB_REACHABLE) return;
  try {
    await db.initialize();
  } catch (error) { /* falls through to the guards below */ }
  pg = db.getPostgreSQL();
  if (!pg) return;

  const required = ['journal_entries', 'journal_lines', 'chart_of_accounts', 'companies',
    'orders', 'order_items', 'products', 'warehouses', 'warehouse_inventory', 'users'];
  const present = await pg.query(
    "SELECT name FROM (SELECT unnest($1::text[]) AS name) t WHERE to_regclass('public.' || name) IS NOT NULL",
    [required],
  );
  if (present.rows.length !== required.length) { pg = null; return; }

  const company = (await pg.query('SELECT id FROM companies LIMIT 1')).rows[0];
  if (!company) { pg = null; return; }
  companyId = company.id;

  // Post real entries through the saga rather than hand-writing journal rows:
  // the read API is only meaningful against what the writers actually produce.
  const stamp = Date.now();
  const buyer = (await pg.query(
    "INSERT INTO users (email, password_hash, role, status) VALUES ($1, 'x', 'consumer', 'active') RETURNING id",
    [`ledger-buyer-${stamp}@example.com`],
  )).rows[0].id;
  const seller = (await pg.query(
    "INSERT INTO users (email, password_hash, role, status) VALUES ($1, 'x', 'farmer', 'active') RETURNING id",
    [`ledger-seller-${stamp}@example.com`],
  )).rows[0].id;
  let warehouse = (await pg.query('SELECT id FROM warehouses LIMIT 1')).rows[0];
  if (!warehouse) {
    warehouse = (await pg.query(
      'INSERT INTO warehouses (name, location, type) VALUES ($1, $2, $3) RETURNING id',
      ['Ledger Test Warehouse', JSON.stringify({ city: 'Guwahati' }), 'dry'],
    )).rows[0];
  }
  const product = (await pg.query(
    'INSERT INTO products (name, slug, sku, base_price) VALUES ($1, $2, $3, 25) RETURNING id',
    [`Ledger Product ${stamp}`, `ledger-${stamp}`, `LED${stamp}`],
  )).rows[0].id;
  await pg.query(
    'INSERT INTO warehouse_inventory (warehouse_id, product_id, quantity) VALUES ($1, $2, 500)',
    [warehouse.id, product],
  );

  const order = (await pg.query(
    `INSERT INTO orders (order_number, user_id, status, total_amount, currency, gst_amount)
     VALUES ($1, $2, 'confirmed', 250, 'INR', 12.50) RETURNING id`,
    [`LEDORD-${stamp}`, buyer],
  )).rows[0].id;
  await pg.query(
    `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
     VALUES ($1, $2, 'Ledger Product', 10, 25, 250)`,
    [order, product],
  );

  const saga = await engine.fulfillOrder(order, { sellerId: seller, companyId });
  fixtures = { orderId: order, saga };
}, 60000);

afterAll(async () => {
  if (pg) await db.close().catch(() => {});
});

describeIfDb()('listEntries', () => {
  it('returns the entry the fulfillment saga posted, found by its order reference', async () => {
    const result = await ledger.listEntries({
      companyId, referenceType: 'order', referenceId: fixtures.orderId,
    });
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].lineCount).toBe(2);
  });

  it('aggregates debit and credit from the lines, not from a header column', async () => {
    const result = await ledger.listEntries({
      companyId, referenceType: 'order', referenceId: fixtures.orderId,
    });
    const entry = result.entries[0];
    // 250.00 order less 12.50 GST: the tax is gstService's to post, not the saga's.
    expect(entry.totalDebit).toBe(237.5);
    expect(entry.totalCredit).toBe(237.5);
    expect(entry.balanced).toBe(true);
  });

  it('states the basis and source of its numbers', async () => {
    const result = await ledger.listEntries({ companyId });
    expect(typeof result.basis).toBe('string');
    expect(result.source).toContain('journal_lines');
  });

  it('requires a companyId rather than returning every company\'s books', async () => {
    await expect(ledger.listEntries({})).rejects.toThrow(/companyId is required/);
  });

  it('caps the page size', async () => {
    await expect(ledger.listEntries({ companyId, limit: ledger.MAX_LIMIT + 1 }))
      .rejects.toThrow(/limit must be/);
  });
});

describeIfDb()('getEntry', () => {
  it('returns the lines with the account each one hits', async () => {
    const list = await ledger.listEntries({
      companyId, referenceType: 'order', referenceId: fixtures.orderId,
    });
    const detail = await ledger.getEntry(list.entries[0].id);

    expect(detail.lines).toHaveLength(2);
    const codes = detail.lines.map((l) => l.accountCode).sort();
    expect(codes).toEqual(['AR-TRADE', 'REV-SALES']);

    const ar = detail.lines.find((l) => l.accountCode === 'AR-TRADE');
    const rev = detail.lines.find((l) => l.accountCode === 'REV-SALES');
    expect(ar.debit).toBe(237.5);
    expect(ar.credit).toBe(0);
    expect(rev.credit).toBe(237.5);
    expect(rev.debit).toBe(0);
  });

  it('reports the entry totals and whether they balance', async () => {
    const list = await ledger.listEntries({
      companyId, referenceType: 'order', referenceId: fixtures.orderId,
    });
    const detail = await ledger.getEntry(list.entries[0].id);
    expect(detail.totals.balanced).toBe(true);
    expect(detail.totals.difference).toBe(0);
  });

  it('404s on an unknown entry', async () => {
    await expect(ledger.getEntry(999999999)).rejects.toMatchObject({ status: 404 });
  });
});

describeIfDb()('trialBalance', () => {
  it('balances, and reports the difference it measured', async () => {
    const tb = await ledger.trialBalance({ companyId });
    expect(tb.totals.debit).toBe(tb.totals.credit);
    expect(tb.totals.difference).toBe(0);
    expect(tb.totals.balanced).toBe(true);
  });

  it('signs each account by its normal side, so both sides read positive', async () => {
    const tb = await ledger.trialBalance({ companyId });
    const ar = tb.accounts.find((a) => a.accountCode === 'AR-TRADE');
    const rev = tb.accounts.find((a) => a.accountCode === 'REV-SALES');

    expect(ar.normalBalance).toBe('DR');
    expect(rev.normalBalance).toBe('CR');
    expect(ar.balance).toBeGreaterThan(0);
    expect(rev.balance).toBeGreaterThan(0);
  });

  it('says it covers posted entries only', async () => {
    const tb = await ledger.trialBalance({ companyId });
    expect(tb.scope).toMatch(/Posted entries only/);
  });
});

describeIfDb()('accountLedger', () => {
  it('produces a running balance that ends where the trial balance says', async () => {
    const tb = await ledger.trialBalance({ companyId });
    const ar = tb.accounts.find((a) => a.accountCode === 'AR-TRADE');
    const detail = await ledger.accountLedger({ companyId, accountCode: 'AR-TRADE' });

    expect(detail.closingBalance).toBe(ar.balance);
    expect(detail.movements.length).toBeGreaterThan(0);
  });

  it('carries the business reference on each movement', async () => {
    const detail = await ledger.accountLedger({ companyId, accountCode: 'AR-TRADE' });
    expect(detail.movements.some((m) => m.referenceType === 'order')).toBe(true);
  });

  it('404s on an account that does not exist for the company', async () => {
    await expect(ledger.accountLedger({ companyId, accountCode: 'NO-SUCH-ACCOUNT' }))
      .rejects.toMatchObject({ status: 404 });
  });
});

describeIfDb()('integrityCheck', () => {
  it('reports clean when the three checks find nothing', async () => {
    const result = await ledger.integrityCheck({ companyId });
    expect(result.findingCount).toBe(0);
    expect(result.clean).toBe(true);
  });

  it('bounds its own claim rather than implying the ledger is correct', async () => {
    const result = await ledger.integrityCheck({ companyId });
    expect(result.checks).toHaveLength(3);
    expect(result.scopeNote).toMatch(/not a claim that the ledger is correct/);
  });

  it('detects an entry with no lines — which the balance trigger cannot', async () => {
    // trg_journal_lines_balanced fires FOR EACH ROW on journal_lines, so an
    // entry with zero lines never fires it and commits happily. This check is
    // the only thing that finds it.
    const orphan = (await pg.query(
      `INSERT INTO journal_entries
         (company_id, entry_number, entry_date, journal_type, description, status, posted_at)
       VALUES ($1, $2, CURRENT_DATE, 'sales', 'empty-entry probe', 'posted', NOW())
       RETURNING id`,
      [companyId, `EMPTY-PROBE-${Date.now()}`],
    )).rows[0].id;

    try {
      const result = await ledger.integrityCheck({ companyId });
      expect(result.clean).toBe(false);
      expect(result.findings.emptyEntries.map((e) => e.id)).toContain(orphan);
    } finally {
      await pg.query('DELETE FROM journal_entries WHERE id = $1', [orphan]);
    }

    const after = await ledger.integrityCheck({ companyId });
    expect(after.clean).toBe(true);
  });

  it('the database refuses to commit an unbalanced entry at all', async () => {
    // Stronger than the integrity endpoint: journal_lines carries
    // trg_journal_lines_balanced, DEFERRABLE INITIALLY DEFERRED, so the bad
    // entry is rejected at COMMIT and never reaches the table.
    const client = await pg.connect();
    let refused = false;
    try {
      await client.query('BEGIN');
      const bad = (await client.query(
        `INSERT INTO journal_entries
           (company_id, entry_number, entry_date, journal_type, description, status, posted_at)
         VALUES ($1, $2, CURRENT_DATE, 'sales', 'unbalanced probe', 'posted', NOW())
         RETURNING id`,
        [companyId, `BAL-PROBE-${Date.now()}`],
      )).rows[0].id;
      const account = (await client.query(
        'SELECT id FROM chart_of_accounts WHERE company_id = $1 LIMIT 1', [companyId],
      )).rows[0].id;
      await client.query(
        `INSERT INTO journal_lines
           (journal_entry_id, line_number, account_id, debit, credit, base_debit, base_credit)
         VALUES ($1, 1, $2, 100, 0, 100, 0)`,
        [bad, account],
      );
      await client.query('COMMIT');
    } catch (error) {
      refused = /unbalanced/i.test(error.message);
      await client.query('ROLLBACK').catch(() => {});
    } finally {
      client.release();
    }

    expect(refused).toBe(true);
    const tb = await ledger.trialBalance({ companyId });
    expect(tb.totals.balanced).toBe(true);
  });
});

describe('ledger contract (no database needed)', () => {
  it('exposes read operations only — no post, update or delete', () => {
    const writeVerbs = Object.keys(ledger).filter((k) => /^(post|create|update|delete|insert)/i.test(k));
    expect(writeVerbs).toEqual([]);
  });

  it('caps page size so one request cannot pull the whole ledger', () => {
    expect(ledger.MAX_LIMIT).toBeLessThanOrEqual(500);
  });
});
