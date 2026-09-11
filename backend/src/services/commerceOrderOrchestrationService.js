const { getPostgreSQL } = require('../database/connection');

const ALLOWED_TRANSITIONS = {
  draft: ['placed', 'cancelled'],
  placed: ['confirmed', 'cancelled'],
  confirmed: ['allocated', 'cancelled'],
  allocated: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['closed'],
  cancelled: [],
  closed: [],
};

function db() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  return pg;
}

function orderNumber() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function createOrder({ buyerId, sellerId, shippingAddress, billingAddress, items = [] }) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('At least one order item is required');
  const pg = db();
  const client = await pg.connect();
  try {
    await client.query('BEGIN');
    let subtotal = 0;
    const normalized = items.map((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      if (!(quantity > 0) || unitPrice < 0) throw new Error('Invalid order item quantity or price');
      const lineTotal = Math.round(quantity * unitPrice * 100) / 100;
      subtotal += lineTotal;
      return { ...item, quantity, unitPrice, lineTotal };
    });
    const result = await client.query(
      `INSERT INTO marketplace_orders (order_number,buyer_id,seller_id,subtotal,total_amount,status,shipping_address,billing_address,placed_at)
       VALUES ($1,$2,$3,$4,$4,'placed',$5,$6,NOW()) RETURNING *`,
      [orderNumber(), buyerId || null, sellerId || null, subtotal, shippingAddress || {}, billingAddress || {}],
    );
    const order = result.rows[0];
    for (const item of normalized) {
      await client.query(
        `INSERT INTO marketplace_order_items (order_id,product_id,supply_lot_id,seller_id,quantity,unit,unit_price,line_total,metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [order.id, item.productId || null, item.supplyLotId || null, item.sellerId || sellerId || null, item.quantity, item.unit || 'kg', item.unitPrice, item.lineTotal, item.metadata || {}],
      );
    }
    await client.query(
      `INSERT INTO marketplace_order_status_events (order_id,to_status,actor_id,reason) VALUES ($1,'placed',$2,'order_created')`,
      [order.id, buyerId || null],
    );
    await client.query('COMMIT');
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function transitionOrder(id, toStatus, actorId, reason) {
  const pg = db();
  const client = await pg.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT * FROM marketplace_orders WHERE id=$1 FOR UPDATE', [id]);
    if (!current.rows[0]) throw new Error('Order not found');
    const fromStatus = current.rows[0].status;
    if (!(ALLOWED_TRANSITIONS[fromStatus] || []).includes(toStatus)) throw new Error(`Invalid order transition: ${fromStatus} -> ${toStatus}`);
    const updated = await client.query('UPDATE marketplace_orders SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *', [toStatus, id]);
    await client.query('INSERT INTO marketplace_order_status_events (order_id,from_status,to_status,actor_id,reason) VALUES ($1,$2,$3,$4,$5)', [id, fromStatus, toStatus, actorId || null, reason || null]);
    await client.query('COMMIT');
    return updated.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getOrder(id) {
  const pg = db();
  const order = await pg.query('SELECT * FROM marketplace_orders WHERE id=$1', [id]);
  if (!order.rows[0]) return null;
  const items = await pg.query('SELECT * FROM marketplace_order_items WHERE order_id=$1 ORDER BY created_at', [id]);
  const events = await pg.query('SELECT * FROM marketplace_order_status_events WHERE order_id=$1 ORDER BY created_at', [id]);
  return { ...order.rows[0], items: items.rows, events: events.rows };
}

module.exports = { createOrder, transitionOrder, getOrder, ALLOWED_TRANSITIONS };
