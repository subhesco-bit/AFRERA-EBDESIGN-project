/**
 * Order-to-cash fulfillment saga.
 *
 * Eight steps across eight tables owned by different modules:
 *
 *   1 reserve_inventory   hold stock                 -> release it
 *   2 allocate_supply     pick the warehouse         -> (nothing to undo)
 *   3 book_transport      create the shipment        -> cancel it
 *   4 attach_insurance    issue a transit policy     -> cancel it
 *   5 hold_escrow         hold the buyer's money     -> refund it
 *   6 raise_invoice       raise the AR invoice       -> void it
 *   7 dispatch            shipment -> picked_up      -> back to pending
 *   8 post_ledger         write the ledger entry     -> write the reversal
 *
 * WHY A SAGA AND NOT A TRANSACTION
 * These eight writes cannot share one database transaction in any deployment
 * where the modules are separable, and holding a transaction open across a
 * carrier booking and a payment hold would be wrong even if they could. So each
 * step commits on its own and registers its compensation; on failure the engine
 * unwinds the steps that DID run, in reverse order.
 *
 * SKIPPED IS NOT FAILED
 * A step whose prerequisite cannot be satisfied for a given order -- no
 * insurable value, no escrow counterparty, an FK that this order's shape cannot
 * satisfy -- records `skipped` WITH A REASON and the chain continues. It is
 * never silently omitted, and `skipped` is never reported as `succeeded`. A
 * step that was supposed to work and did not is `failed`, and that triggers
 * compensation.
 */

'use strict';

const { getPostgreSQL } = require('../../database/connection');
const { logger } = require('../../utils/logger');
const reservations = require('./inventoryReservationService');

class SkipStep extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'SkipStep';
    this.reason = reason;
  }
}

function requirePg() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Fulfillment requires a database connection');
  return pg;
}

function shortId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- order context ----------------------------------------------------------

/**
 * Resolve which order table owns an id, and load what the steps need.
 *
 * The platform has more than one order concept. Rather than assume `orders`,
 * this looks the id up and reports which table matched, so a step whose foreign
 * key targets a different table can skip with an accurate reason instead of
 * failing on a constraint violation.
 */
async function resolveOrderContext(orderId) {
  const pg = requirePg();

  const candidates = [
    { table: 'orders', kind: 'b2c' },
    { table: 'marketplace_orders', kind: 'b2b' },
  ];

  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await pg.query(
      'SELECT to_regclass($1) IS NOT NULL AS present',
      [`public.${candidate.table}`],
    );
    if (!exists.rows[0].present) continue;

    // eslint-disable-next-line no-await-in-loop
    const row = await pg.query(
      `SELECT * FROM ${candidate.table} WHERE id = $1`,
      [orderId],
    );
    if (row.rows.length) {
      return { table: candidate.table, kind: candidate.kind, order: row.rows[0] };
    }
  }

  return null;
}

async function loadOrderItems(orderId) {
  const pg = requirePg();
  const result = await pg.query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at',
    [orderId],
  );
  return result.rows;
}

// --- saga bookkeeping -------------------------------------------------------

async function openSaga(orderId) {
  const pg = requirePg();
  const result = await pg.query(
    'INSERT INTO fulfillment_sagas (order_id) VALUES ($1) RETURNING *',
    [orderId],
  );
  return result.rows[0];
}

async function recordStep(sagaId, stepName, stepOrder, status, result, reason) {
  const pg = requirePg();
  const row = await pg.query(
    `INSERT INTO fulfillment_saga_steps
       (saga_id, step_name, step_order, status, reason, result, finished_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [sagaId, stepName, stepOrder, status, reason || null, JSON.stringify(result || {})],
  );
  return row.rows[0];
}

async function closeSaga(sagaId, status, failedStep, failureReason) {
  const pg = requirePg();
  await pg.query(
    `UPDATE fulfillment_sagas
        SET status = $2, failed_step = $3, failure_reason = $4, finished_at = NOW()
      WHERE id = $1`,
    [sagaId, status, failedStep || null, failureReason || null],
  );
}

// --- steps ------------------------------------------------------------------

async function stepReserveInventory(ctx) {
  const items = ctx.items.filter((item) => item.product_id);
  if (!items.length) {
    throw new SkipStep('Order has no line with a product_id, so there is nothing to reserve.');
  }

  const held = [];
  for (const item of items) {
    // Sequential on purpose: reserve() takes row locks, and issuing the lines
    // concurrently would have them contend for the same inventory rows.
    // eslint-disable-next-line no-await-in-loop
    const reservation = await reservations.reserve({
      orderId: ctx.orderId,
      productId: item.product_id,
      quantity: item.quantity,
    });
    held.push({ productId: item.product_id, quantity: reservation.quantity, reservationId: reservation.id });
  }
  return { reserved: held };
}

async function compensateReserveInventory(ctx) {
  return reservations.release({ orderId: ctx.orderId });
}

async function stepAllocateSupply(ctx) {
  const pg = requirePg();
  const rows = await reservations.listForOrder(ctx.orderId);
  const warehouseIds = [...new Set(rows.map((r) => r.warehouse_id).filter((id) => id !== null))];

  if (!warehouseIds.length) {
    throw new SkipStep('No reservation carries a warehouse, so no supply point can be allocated.');
  }

  const warehouses = await pg.query(
    'SELECT id, name FROM warehouses WHERE id = ANY($1::int[])',
    [warehouseIds],
  );

  return {
    warehouseIds,
    warehouses: warehouses.rows,
    splitShipment: warehouseIds.length > 1,
  };
}

async function stepBookTransport(ctx) {
  const pg = requirePg();
  const weightKg = ctx.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 1;

  const result = await pg.query(
    `INSERT INTO shipments
       (shipment_number, order_id, origin_address, destination_address, weight_kg, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING id, shipment_number, status`,
    [
      shortId('SHP'),
      ctx.orderId,
      ctx.originAddress || 'Origin warehouse (address not resolved)',
      ctx.destinationAddress || 'Destination (address not resolved)',
      weightKg,
    ],
  );
  return { shipmentId: result.rows[0].id, shipmentNumber: result.rows[0].shipment_number, status: result.rows[0].status };
}

async function compensateBookTransport(ctx, stepResult) {
  const pg = requirePg();
  await pg.query(
    "UPDATE shipments SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
    [stepResult.shipmentId],
  );
  return { cancelledShipment: stepResult.shipmentId };
}

async function stepAttachInsurance(ctx) {
  const pg = requirePg();
  const value = Number(ctx.order.total_amount || 0);
  if (!value) {
    throw new SkipStep('Order carries no total_amount, so there is no insurable value.');
  }
  if (!ctx.order.user_id) {
    throw new SkipStep('Order has no user_id; policies.user_id references users(id) and cannot be satisfied.');
  }

  const premium = Math.round(value * 0.005 * 100) / 100; // 0.5% of consignment value
  const result = await pg.query(
    `INSERT INTO policies
       (policy_number, user_id, coverage_amount, premium_amount,
        policy_start_date, policy_end_date, insurer_name, policy_data)
     VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $5, $6)
     RETURNING id, policy_number, coverage_amount, premium_amount`,
    [
      shortId('POL'),
      ctx.order.user_id,
      value,
      premium,
      'Transit cover (self-insured placeholder — no insurer integration in this deployment)',
      JSON.stringify({ kind: 'transit', orderId: ctx.orderId, premiumRate: 0.005 }),
    ],
  );
  return {
    policyId: result.rows[0].id,
    policyNumber: result.rows[0].policy_number,
    coverageAmount: Number(result.rows[0].coverage_amount),
    premiumAmount: Number(result.rows[0].premium_amount),
  };
}

async function compensateAttachInsurance(ctx, stepResult) {
  const pg = requirePg();
  await pg.query(
    `UPDATE policies
        SET cancelled_at = NOW(), cancellation_reason = $2, updated_at = NOW()
      WHERE id = $1`,
    [stepResult.policyId, 'Fulfillment saga compensated'],
  );
  return { cancelledPolicy: stepResult.policyId };
}

async function stepHoldEscrow(ctx) {
  const pg = requirePg();
  const amount = Number(ctx.order.total_amount || 0);
  if (!(amount > 0)) {
    throw new SkipStep('Order total is zero or missing; escrow_transactions requires amount > 0.');
  }
  if (!ctx.order.user_id) {
    throw new SkipStep('Order has no user_id, so there is no buyer to hold funds from.');
  }
  const sellerId = ctx.sellerId || ctx.order.seller_id || ctx.order.farmer_id;
  if (!sellerId) {
    throw new SkipStep('No seller/farmer on this order; escrow_transactions.farmer_id is NOT NULL.');
  }

  const result = await pg.query(
    `INSERT INTO escrow_transactions
       (order_id, buyer_id, farmer_id, amount, currency, status, release_conditions)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6)
     RETURNING escrow_id, amount, status`,
    [
      String(ctx.orderId),
      ctx.order.user_id,
      sellerId,
      amount,
      ctx.order.currency || 'INR',
      JSON.stringify({ releaseOn: 'delivery_confirmed' }),
    ],
  );
  return { escrowId: result.rows[0].escrow_id, amount: Number(result.rows[0].amount) };
}

async function compensateHoldEscrow(ctx, stepResult) {
  const pg = requirePg();
  await pg.query(
    `UPDATE escrow_transactions
        SET status = 'refunded', refunded_at = NOW(), refund_reason = $2, updated_at = NOW()
      WHERE escrow_id = $1`,
    [stepResult.escrowId, 'Fulfillment saga compensated'],
  );
  return { refundedEscrow: stepResult.escrowId };
}

async function stepRaiseInvoice(ctx) {
  const pg = requirePg();
  const total = Number(ctx.order.total_amount || 0);
  if (!total) throw new SkipStep('Order total is zero or missing; there is nothing to invoice.');

  const companyId = ctx.companyId ?? null;
  if (companyId === null) {
    throw new SkipStep('ar_invoices.company_id is NOT NULL and no selling company was supplied for this order.');
  }

  const tax = Number(ctx.order.gst_amount || ctx.order.tax_amount || 0);
  const subtotal = Math.round((total - tax) * 100) / 100;

  const result = await pg.query(
    // amount_due is GENERATED ALWAYS AS (total_amount - amount_received) and
    // must not appear in the column list -- PostgreSQL rejects the whole
    // statement if it does.
    `INSERT INTO ar_invoices
       (company_id, customer_id, invoice_number, invoice_date, due_date, currency,
        subtotal, tax_amount, total_amount, amount_received, status, source_order_id)
     VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $4,
             $5, $6, $7, 0, 'open', $8)
     RETURNING id, invoice_number, total_amount`,
    [
      companyId,
      String(ctx.order.user_id || ctx.orderId),
      shortId('INV'),
      (ctx.order.currency || 'INR').slice(0, 3),
      subtotal,
      tax,
      total,
      String(ctx.orderId),
    ],
  );
  return {
    invoiceId: result.rows[0].id,
    invoiceNumber: result.rows[0].invoice_number,
    totalAmount: Number(result.rows[0].total_amount),
  };
}

async function compensateRaiseInvoice(ctx, stepResult) {
  const pg = requirePg();
  // Voided, not deleted: an invoice number that was issued must remain
  // accounted for.
  // amount_due is a generated column; zeroing the balance means recording the
  // write-off against amount_received, which is what the generation expression
  // reads.
  await pg.query(
    "UPDATE ar_invoices SET status = 'void', amount_received = total_amount WHERE id = $1",
    [stepResult.invoiceId],
  );
  return { voidedInvoice: stepResult.invoiceId };
}

async function stepDispatch(ctx, previous) {
  const pg = requirePg();
  const transport = previous.book_transport;
  if (!transport || !transport.shipmentId) {
    throw new SkipStep('No shipment was booked, so there is nothing to dispatch.');
  }

  // shipment_status is: pending, picked_up, in_transit, out_for_delivery,
  // delivered, cancelled. pending -> picked_up is the legal first move.
  const result = await pg.query(
    `UPDATE shipments
        SET status = 'picked_up', updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING id, status`,
    [transport.shipmentId],
  );
  if (!result.rows.length) {
    throw new Error(`Shipment ${transport.shipmentId} was not in 'pending' and could not be dispatched`);
  }

  await reservations.consume({ orderId: ctx.orderId });

  return { shipmentId: result.rows[0].id, status: result.rows[0].status };
}

async function compensateDispatch(ctx, stepResult) {
  const pg = requirePg();
  await pg.query(
    "UPDATE shipments SET status = 'pending', updated_at = NOW() WHERE id = $1",
    [stepResult.shipmentId],
  );
  return { revertedShipment: stepResult.shipmentId };
}

async function stepPostLedger(ctx) {
  const pg = requirePg();
  const amount = Number(ctx.order.total_amount || 0);
  if (!amount) throw new SkipStep('Order total is zero or missing; there is nothing to post.');

  const transactionId = shortId('LED');
  const result = await pg.query(
    `INSERT INTO unified_ledger
       (transaction_id, economy, type, amount, currency, description, reference, account_id, category)
     VALUES ($1, $2, 'credit', $3, $4, $5, $6, $7, 'order_fulfillment')
     RETURNING transaction_id, amount, type`,
    [
      transactionId,
      ctx.economy || 'marketplace',
      amount,
      ctx.order.currency || 'INR',
      `Order ${ctx.orderId} fulfilled`,
      String(ctx.orderId),
      String(ctx.order.user_id || ''),
    ],
  );
  return { transactionId: result.rows[0].transaction_id, amount: Number(result.rows[0].amount) };
}

async function compensatePostLedger(ctx, stepResult) {
  const pg = requirePg();
  // A ledger is append-only: the compensation is an equal and opposite entry,
  // never an UPDATE or DELETE of the original.
  const reversalId = `${stepResult.transactionId}-REV`;
  await pg.query(
    `INSERT INTO unified_ledger
       (transaction_id, economy, type, amount, currency, description, reference, category)
     VALUES ($1, $2, 'debit', $3, $4, $5, $6, 'order_fulfillment_reversal')
     ON CONFLICT (transaction_id) DO NOTHING`,
    [
      reversalId,
      ctx.economy || 'marketplace',
      stepResult.amount,
      ctx.order.currency || 'INR',
      `Reversal of ${stepResult.transactionId} (saga compensated)`,
      String(ctx.orderId),
    ],
  );
  return { reversalTransactionId: reversalId };
}

const STEPS = [
  { name: 'reserve_inventory', run: stepReserveInventory, compensate: compensateReserveInventory },
  { name: 'allocate_supply', run: stepAllocateSupply, compensate: null },
  { name: 'book_transport', run: stepBookTransport, compensate: compensateBookTransport },
  { name: 'attach_insurance', run: stepAttachInsurance, compensate: compensateAttachInsurance },
  { name: 'hold_escrow', run: stepHoldEscrow, compensate: compensateHoldEscrow },
  { name: 'raise_invoice', run: stepRaiseInvoice, compensate: compensateRaiseInvoice },
  { name: 'dispatch', run: stepDispatch, compensate: compensateDispatch },
  { name: 'post_ledger', run: stepPostLedger, compensate: compensatePostLedger },
];

/**
 * Run the saga for an order.
 *
 * Returns the full step-by-step record either way -- a compensated run is a
 * reported outcome, not an exception thrown at the caller.
 */
async function fulfillOrder(orderId, options = {}) {
  const context = await resolveOrderContext(orderId);
  if (!context) {
    throw new Error(`Order ${orderId} was not found in any known order table`);
  }

  const ctx = {
    orderId,
    order: context.order,
    orderTable: context.table,
    orderKind: context.kind,
    items: await loadOrderItems(orderId),
    ...options,
  };

  const saga = await openSaga(orderId);
  const completed = [];
  const stepResults = {};
  const report = [];

  for (let index = 0; index < STEPS.length; index += 1) {
    const step = STEPS[index];
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await step.run(ctx, stepResults);
      stepResults[step.name] = result;
      completed.push({ step, result });
      // eslint-disable-next-line no-await-in-loop
      await recordStep(saga.id, step.name, index + 1, 'succeeded', result);
      report.push({ step: step.name, status: 'succeeded', result });
    } catch (error) {
      if (error instanceof SkipStep) {
        // eslint-disable-next-line no-await-in-loop
        await recordStep(saga.id, step.name, index + 1, 'skipped', {}, error.reason);
        report.push({ step: step.name, status: 'skipped', reason: error.reason });
        // eslint-disable-next-line no-continue
        continue;
      }

      logger.error(`Fulfillment step ${step.name} failed for order ${orderId}`, { error: error.message });
      // eslint-disable-next-line no-await-in-loop
      await recordStep(saga.id, step.name, index + 1, 'failed', {}, error.message);
      report.push({ step: step.name, status: 'failed', reason: error.message });

      // eslint-disable-next-line no-await-in-loop
      const compensation = await compensate(saga.id, ctx, completed);
      // eslint-disable-next-line no-await-in-loop
      await closeSaga(saga.id, 'compensated', step.name, error.message);

      return {
        sagaId: saga.id,
        orderId,
        orderTable: ctx.orderTable,
        status: 'compensated',
        failedStep: step.name,
        failureReason: error.message,
        steps: report,
        succeeded: report.filter((r) => r.status === 'succeeded').length,
        skipped: report.filter((r) => r.status === 'skipped').length,
        compensation,
      };
    }
  }

  await closeSaga(saga.id, 'completed');
  return {
    sagaId: saga.id,
    orderId,
    orderTable: ctx.orderTable,
    status: 'completed',
    steps: report,
    succeeded: report.filter((r) => r.status === 'succeeded').length,
    skipped: report.filter((r) => r.status === 'skipped').length,
  };
}

/** Unwind completed steps in REVERSE order. */
async function compensate(sagaId, ctx, completed) {
  const performed = [];

  for (let index = completed.length - 1; index >= 0; index -= 1) {
    const { step, result } = completed[index];
    if (!step.compensate) {
      performed.push({ step: step.name, status: 'no_compensation_needed' });
      // eslint-disable-next-line no-continue
      continue;
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      const outcome = await step.compensate(ctx, result);
      // eslint-disable-next-line no-await-in-loop
      await recordStep(sagaId, `compensate:${step.name}`, 100 + index, 'compensated', outcome);
      performed.push({ step: step.name, status: 'compensated', outcome });
    } catch (error) {
      // A compensation that fails is the worst case: state is now inconsistent
      // and a human has to look. Record it loudly and keep unwinding the rest
      // rather than abandoning the remaining compensations too.
      logger.error(`Compensation for ${step.name} FAILED on saga ${sagaId}`, { error: error.message });
      // eslint-disable-next-line no-await-in-loop
      await recordStep(sagaId, `compensate:${step.name}`, 100 + index, 'failed', {}, error.message);
      performed.push({ step: step.name, status: 'compensation_failed', reason: error.message });
    }
  }

  return performed;
}

/** Which steps could run for this order right now, and why not where not. */
async function readiness(orderId, options = {}) {
  const context = await resolveOrderContext(orderId);
  if (!context) {
    return { orderId, found: false, steps: [] };
  }

  const pg = requirePg();
  const items = await loadOrderItems(orderId);
  const order = context.order;

  const checks = [
    { step: 'reserve_inventory', ok: items.some((i) => i.product_id), why: 'needs at least one line with a product_id' },
    { step: 'allocate_supply', ok: items.some((i) => i.product_id), why: 'needs a reservation carrying a warehouse' },
    { step: 'book_transport', ok: true, why: null },
    { step: 'attach_insurance', ok: Boolean(Number(order.total_amount) && order.user_id), why: 'needs a total_amount and a user_id' },
    // These two depend on values supplied at call time as well as on the order
    // row, so readiness takes the same options the saga will be given.
    // Reporting a step unavailable that the saga would in fact run (or the
    // reverse) is worse than not reporting at all.
    { step: 'hold_escrow', ok: Boolean(Number(order.total_amount) > 0 && order.user_id && (options.sellerId || order.seller_id || order.farmer_id)), why: 'needs a buyer, a seller (order column or sellerId option) and a positive amount' },
    { step: 'raise_invoice', ok: Boolean(Number(order.total_amount) && (options.companyId ?? null) !== null), why: 'needs a total_amount and a companyId option (ar_invoices.company_id is NOT NULL)' },
    { step: 'dispatch', ok: true, why: null },
    { step: 'post_ledger', ok: Boolean(Number(order.total_amount)), why: 'needs a total_amount' },
  ];

  const tables = await pg.query(
    `SELECT unnest($1::text[]) AS name,
            to_regclass('public.' || unnest($1::text[])) IS NOT NULL AS present`,
    [['warehouse_inventory', 'inventory_reservations', 'shipments', 'policies',
      'escrow_transactions', 'ar_invoices', 'unified_ledger']],
  );

  return {
    orderId,
    found: true,
    orderTable: context.table,
    orderKind: context.kind,
    lineCount: items.length,
    steps: checks.map((check) => ({
      step: check.step,
      available: check.ok,
      reason: check.ok ? null : check.why,
    })),
    availableSteps: checks.filter((c) => c.ok).length,
    totalSteps: checks.length,
    tables: tables.rows,
  };
}

module.exports = {
  fulfillOrder,
  readiness,
  resolveOrderContext,
  STEP_NAMES: STEPS.map((s) => s.name),
  SkipStep,
};
