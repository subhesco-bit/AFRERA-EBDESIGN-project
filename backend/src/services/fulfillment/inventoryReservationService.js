/**
 * Stock reservation.
 *
 * WHY THIS EXISTS
 * Nothing in this codebase reserved stock. `warehouse_inventory.quantity` is
 * on-hand only, with no column for committed-but-not-yet-shipped units, so two
 * concurrent orders for the same product both read the full quantity and both
 * succeed. The platform oversold and found out at the warehouse.
 *
 * HOW IT IS SAFE
 * Availability is computed inside a transaction with the inventory rows locked
 * `FOR UPDATE`. A second transaction asking for the same product blocks on that
 * lock until the first commits, then re-reads the held total and sees the new
 * reservation. Computing availability outside the lock -- reading, deciding,
 * then writing -- is the classic check-then-act race and would not fix
 * anything.
 */

'use strict';

const { getPostgreSQL } = require('../../database/connection');
const { logger } = require('../../utils/logger');

const DEFAULT_TTL_MINUTES = 60;

class InsufficientStockError extends Error {
  constructor(message, detail) {
    super(message);
    this.name = 'InsufficientStockError';
    this.detail = detail;
  }
}

function requirePg() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Stock reservation requires a database connection');
  return pg;
}

/**
 * On-hand, held and available for a product. Read-only; for a decision that
 * will be acted on, use reserve(), which recomputes this under lock.
 */
async function getAvailability(productId, { warehouseId = null } = {}) {
  const pg = requirePg();

  const onHand = await pg.query(
    `SELECT COALESCE(SUM(quantity), 0) AS on_hand
       FROM warehouse_inventory
      WHERE product_id = $1
        AND ($2::int IS NULL OR warehouse_id = $2::int)`,
    [productId, warehouseId],
  );

  const held = await pg.query(
    `SELECT COALESCE(SUM(quantity), 0) AS held
       FROM inventory_reservations
      WHERE product_id = $1
        AND status = 'held'
        AND (expires_at IS NULL OR expires_at > NOW())
        AND ($2::int IS NULL OR warehouse_id = $2::int)`,
    [productId, warehouseId],
  );

  const onHandQty = Number(onHand.rows[0].on_hand);
  const heldQty = Number(held.rows[0].held);

  return {
    productId,
    warehouseId,
    onHand: onHandQty,
    held: heldQty,
    available: onHandQty - heldQty,
  };
}

/**
 * Hold `quantity` of `productId` for `orderId`.
 *
 * Throws InsufficientStockError when availability does not cover the request.
 * Never partially reserves: a caller that asked for 30 gets 30 or nothing,
 * because a silent partial hold turns into a short shipment later.
 */
async function reserve({
  orderId, productId, quantity, warehouseId = null, reservedBy = null,
  ttlMinutes = DEFAULT_TTL_MINUTES,
}) {
  if (!orderId) throw new Error('orderId is required');
  if (!productId) throw new Error('productId is required');
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw new Error('quantity must be greater than zero');

  const pg = requirePg();
  const client = await pg.connect();

  try {
    await client.query('BEGIN');

    // Lock the inventory rows FIRST. Every concurrent reserve for this product
    // serialises here, which is what makes the availability read below a
    // decision rather than a guess.
    const inventory = await client.query(
      `SELECT id, warehouse_id, quantity
         FROM warehouse_inventory
        WHERE product_id = $1
          AND ($2::int IS NULL OR warehouse_id = $2::int)
        ORDER BY id
        FOR UPDATE`,
      [productId, warehouseId],
    );

    const onHand = inventory.rows.reduce((sum, row) => sum + Number(row.quantity), 0);

    const heldResult = await client.query(
      `SELECT COALESCE(SUM(quantity), 0) AS held
         FROM inventory_reservations
        WHERE product_id = $1
          AND status = 'held'
          AND (expires_at IS NULL OR expires_at > NOW())
          AND ($2::int IS NULL OR warehouse_id = $2::int)`,
      [productId, warehouseId],
    );
    const held = Number(heldResult.rows[0].held);
    const available = onHand - held;

    if (available < qty) {
      await client.query('ROLLBACK');
      throw new InsufficientStockError(
        `Insufficient stock for product ${productId}: requested ${qty}, available ${available}`,
        { productId, requested: qty, available, onHand, held },
      );
    }

    const expiresAt = ttlMinutes ? new Date(Date.now() + ttlMinutes * 60000) : null;
    const allocatedWarehouse = warehouseId
      || (inventory.rows.length ? inventory.rows[0].warehouse_id : null);

    const inserted = await client.query(
      `INSERT INTO inventory_reservations
         (order_id, product_id, warehouse_id, quantity, reserved_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, order_id, product_id, warehouse_id, quantity, status, expires_at`,
      [orderId, productId, allocatedWarehouse, qty, reservedBy, expiresAt],
    );

    await client.query('COMMIT');

    logger.info(`Reserved ${qty} of product ${productId} for order ${orderId}`);
    return {
      ...inserted.rows[0],
      quantity: Number(inserted.rows[0].quantity),
      availableBefore: available,
      availableAfter: available - qty,
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/** Release held stock. This is the compensation for reserve(). */
async function release({ orderId, productId = null }) {
  const pg = requirePg();
  const result = await pg.query(
    `UPDATE inventory_reservations
        SET status = 'released', released_at = NOW(), updated_at = NOW()
      WHERE order_id = $1
        AND status = 'held'
        AND ($2::uuid IS NULL OR product_id = $2::uuid)
      RETURNING id, product_id, quantity`,
    [orderId, productId],
  );
  logger.info(`Released ${result.rows.length} reservation(s) for order ${orderId}`);
  return { released: result.rows.length, reservations: result.rows };
}

/** Consume held stock at dispatch: the hold becomes a real outbound movement. */
async function consume({ orderId, productId = null }) {
  const pg = requirePg();
  const result = await pg.query(
    `UPDATE inventory_reservations
        SET status = 'consumed', consumed_at = NOW(), updated_at = NOW()
      WHERE order_id = $1
        AND status = 'held'
        AND ($2::uuid IS NULL OR product_id = $2::uuid)
      RETURNING id, product_id, quantity`,
    [orderId, productId],
  );
  return { consumed: result.rows.length, reservations: result.rows };
}

/**
 * Expire stale holds.
 *
 * A reservation whose TTL has passed is already excluded from the availability
 * sums above, so this does not free stock that was otherwise stuck -- it moves
 * the row to a terminal state so the table does not grow a permanent tail of
 * rows that every query has to filter past.
 */
async function expireStale() {
  const pg = requirePg();
  const result = await pg.query(
    `UPDATE inventory_reservations
        SET status = 'expired', updated_at = NOW()
      WHERE status = 'held' AND expires_at IS NOT NULL AND expires_at <= NOW()
      RETURNING id`,
  );
  return { expired: result.rows.length };
}

async function listForOrder(orderId) {
  const pg = requirePg();
  const result = await pg.query(
    'SELECT * FROM inventory_reservations WHERE order_id = $1 ORDER BY created_at',
    [orderId],
  );
  return result.rows;
}

module.exports = {
  reserve,
  release,
  consume,
  expireStale,
  getAvailability,
  listForOrder,
  InsufficientStockError,
  DEFAULT_TTL_MINUTES,
};
