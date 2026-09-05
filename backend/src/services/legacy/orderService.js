/**
 * Order & Cart Service
 * Manages shopping cart, order processing, and payment integration
 */

const crypto = require('crypto');
const { logger } = require('../../utils\/logger');
const { getPostgreSQL } = require('../../database\/connection');
const { authMiddleware } = require('../../middleware\/auth');
const { adminMiddleware } = require('../../middleware\/admin');
const { signalBus, SIGNAL, SEVERITY } = require('../../core\/signalBus');
const gstService = require('./gstService');

/**
 * Get user's cart
 */
async function getCart(userId) {
  try {
    const pg = getPostgreSQL();
    
    // Validate database connection
    if (!pg) {
      throw new Error('Database connection not available');
    }
    
    // Validate user ID
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const query = `
      SELECT c.*, p.name as product_name, p.base_price, p.images, p.slug,
             u.symbol as unit_symbol
      FROM cart c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;
    
    const result = await pg.query(query, [userId]);
    
    const cartItems = result.rows.map(item => ({
      ...item,
      total_price: item.base_price * item.quantity
    }));
    
    const total = cartItems.reduce((sum, item) => sum + item.total_price, 0);
    
    return {
      items: cartItems,
      total_items: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      total_amount: total
    };
  } catch (error) {
    logger.error('Error fetching cart', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Add item to cart
 */
async function addToCart(userId, productId, quantity = 1, attributes = {}) {
  try {
    let pg = getPostgreSQL();
    
    // Check if product exists
    const productQuery = 'SELECT id, base_price, is_active FROM products WHERE id = $1';
    const productResult = await pg.query(productQuery, [productId]);
    
    if (productResult.rows.length === 0) {
      throw new Error('Product not found');
    }
    
    const product = productResult.rows[0];
    
    if (!product.is_active) {
      throw new Error('Product is not available');
    }
    
    // Check if item already exists in cart
    const existingQuery = 'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2';
    const existingResult = await pg.query(existingQuery, [userId, productId]);
    
    if (existingResult.rows.length > 0) {
      // Update quantity
      const updateQuery = `
        UPDATE cart
        SET quantity = quantity + $1, attributes = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
      
      const updateResult = await pg.query(updateQuery, [
        quantity,
        JSON.stringify(attributes),
        existingResult.rows[0].id
      ]);
      
      logger.info(`Cart item updated: user ${userId}, product ${productId}`);
      return updateResult.rows[0];
    } else {
      // Add new item
      const insertQuery = `
        INSERT INTO cart (user_id, product_id, quantity, attributes)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const insertResult = await pg.query(insertQuery, [userId, productId, quantity, JSON.stringify(attributes)]);
      
      logger.info(`Item added to cart: user ${userId}, product ${productId}`);
      return insertResult.rows[0];
    }
  } catch (error) {
    logger.error('Error adding to cart', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Update cart item quantity
 */
async function updateCartItem(userId, cartItemId, quantity) {
  try {
    let pg = getPostgreSQL();
    
    if (quantity <= 0) {
      // Remove item
      const deleteQuery = 'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *';
      const deleteResult = await pg.query(deleteQuery, [cartItemId, userId]);
      
      if (deleteResult.rows.length === 0) {
        throw new Error('Cart item not found');
      }
      
      logger.info(`Cart item removed: ${cartItemId}`);
      return deleteResult.rows[0];
    } else {
      // Update quantity
      let updateQuery = `
        UPDATE cart
        SET quantity = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `;
      
      let updateResult = await pg.query(updateQuery, [quantity, cartItemId, userId]);
      
      if (updateResult.rows.length === 0) {
        throw new Error('Cart item not found');
      }
      
      logger.info(`Cart item updated: ${cartItemId}`);
      return updateResult.rows[0];
    }
  } catch (error) {
    logger.error('Error updating cart item', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Remove item from cart
 */
async function removeFromCart(userId, cartItemId) {
  try {
    let pg = getPostgreSQL();
    
    let query = 'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *';
    let result = await pg.query(query, [cartItemId, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Cart item not found');
    }
    
    logger.info(`Cart item removed: ${cartItemId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error removing from cart', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Clear cart
 */
async function clearCart(userId) {
  try {
    let pg = getPostgreSQL();
    
    let query = 'DELETE FROM cart WHERE user_id = $1';
    await pg.query(query, [userId]);
    
    logger.info(`Cart cleared for user: ${userId}`);
    return { success: true };
  } catch (error) {
    logger.error('Error clearing cart', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Create order from cart
 */
async function createOrder(userId, orderData) {
  try {
    let pg = getPostgreSQL();
    
    // Get cart items — pulls the same HSN/branding columns gstService.calculateOrderGST
    // uses, so tax can be computed for real per item instead of guessed as a flat rate.
    const cartQuery = `
      SELECT c.*, p.base_price, p.name as product_name, p.slug, p.stock_quantity,
             p.hsn_code, p.gst_applicable, p.is_branded_packaged, p.registered_brand_name,
             cat.name AS category_name
      FROM cart c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN categories cat ON cat.id = p.category_id
      WHERE c.user_id = $1
    `;

    const cartResult = await pg.query(cartQuery, [userId]);

    if (cartResult.rows.length === 0) {
      throw new Error('Cart is empty');
    }

    let cartItems = cartResult.rows;

    // Real stock check — nothing here previously verified availability before
    // creating an order, so two buyers could both "successfully" order the
    // last unit of something.
    const outOfStock = cartItems.filter((item) => item.stock_quantity != null && item.stock_quantity < item.quantity);
    if (outOfStock.length > 0) {
      const err = new Error(`Not enough stock for: ${outOfStock.map((i) => i.product_name).join(', ')}`);
      err.code = 'insufficient_stock';
      throw err;
    }

    // Calculate totals — real per-item GST via gstService (HSN + branding-aware),
    // not a flat guessed rate. Falls back to 0 tax for an item only if gstService
    // itself reports it isn't GST-applicable, matching its own real classification.
    const subtotal = cartItems.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);
    let taxAmount = 0;
    for (const item of cartItems) {
      if (item.gst_applicable === false) continue;
      const itemGST = await gstService.calculateProductGST({
        id: item.product_id,
        name: item.product_name,
        price: item.base_price,
        category_name: item.category_name,
        hsn_code: item.hsn_code,
        is_branded_packaged: item.is_branded_packaged,
        registered_brand_name: item.registered_brand_name,
      });
      taxAmount += Number(itemGST.gstAmount) * item.quantity;
    }
    taxAmount = Math.round(taxAmount * 100) / 100;
    const shippingAmount = subtotal > 1500 ? 0 : 60;
    const discountAmount = orderData.coupon_code ? await calculateDiscount(orderData.coupon_code, subtotal) : 0;
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;
    
    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // ---- TRANSACTION BOUNDARY (BR-08) -----------------------------------
    //
    // The order header, its line items and the cart clear are ONE unit.
    //
    // Without this, a failure between the header INSERT and the item INSERTs
    // leaves an order row whose total is a real number and whose contents are
    // empty. It shows in the customer's history, it is counted in revenue, and
    // nothing in it can be picked or shipped. Worse, the cart has usually been
    // cleared by then, so the buyer cannot even retry — they have paid
    // attention to a checkout that produced nothing.
    //
    // The boundary deliberately STOPS before the WebSocket emit. Notifying a
    // client is not part of the order's consistency, and holding a database
    // transaction open across a socket write couples row locks to network
    // latency.
    const client = await pg.connect();
    let order;
    try {
      await client.query('BEGIN');

      const orderQuery = `
        INSERT INTO orders (order_number, user_id, status, total_amount, subtotal,
                           tax_amount, shipping_amount, discount_amount, currency,
                           payment_status, shipping_address_id, billing_address_id,
                           expected_delivery_date, notes, coupon_code)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const orderResult = await client.query(orderQuery, [
        orderNumber, userId, 'pending', totalAmount, subtotal, taxAmount,
        shippingAmount, discountAmount, 'INR', 'pending',
        orderData.shipping_address_id || null,
        orderData.billing_address_id || null,
        orderData.expected_delivery_date || null,
        orderData.notes || null,
        orderData.coupon_code || null
      ]);

      order = orderResult.rows[0];

      for (const cartItem of cartItems) {
        // Real, race-safe stock decrement: the pre-transaction check above
        // catches the common case cheaply, but two concurrent checkouts can
        // both pass it before either commits. This conditional UPDATE is the
        // actual guard — it only succeeds if stock is still sufficient at
        // the moment of the write, inside the same transaction as the order.
        const stockResult = await client.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1
           WHERE id = $2 AND (stock_quantity IS NULL OR stock_quantity >= $1)
           RETURNING stock_quantity`,
          [cartItem.quantity, cartItem.product_id]
        );
        if (stockResult.rows.length === 0) {
          let err = new Error(`Not enough stock for ${cartItem.product_name}`);
          err.code = 'insufficient_stock';
          throw err;
        }

        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_sku,
                                    quantity, unit_price, total_price, attributes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [order.id, cartItem.product_id, cartItem.product_name, null,
            cartItem.quantity, cartItem.base_price,
            cartItem.base_price * cartItem.quantity,
            JSON.stringify(cartItem.attributes || {})]
        );
      }

      // Inside the boundary: an order that exists while its cart still holds
      // the same items invites a double submission on refresh.
      await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
    // ---- end transaction -------------------------------------------------

    // Emit WebSocket event
    const io = require('../../../index').app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('order_created', {
        order_id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount
      });
    }
    
    logger.info(`Order created: ${orderNumber} for user ${userId}`);
    
    return order;
  } catch (error) {
    logger.error('Error creating order', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get order by ID
 */
async function getOrderById(orderId, userId = null) {
  try {
    let pg = getPostgreSQL();
    
    let query = `
      SELECT o.*, u.name as customer_name, u.email as customer_email,
             sa.address_line1 as shipping_line1, sa.city as shipping_city,
             sa.state as shipping_state, sa.pincode as shipping_pincode,
             ba.address_line1 as billing_line1, ba.city as billing_city,
             ba.state as billing_state, ba.pincode as billing_pincode
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
      LEFT JOIN addresses ba ON o.billing_address_id = ba.id
      WHERE o.id = $1
    `;
    
    const params = [orderId];
    
    // If userId provided, add user filter
    if (userId) {
      query += ' AND o.user_id = $2';
      params.push(userId);
    }
    
    let result = await pg.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    const order = result.rows[0];
    
    // Get order items
    const itemsQuery = `
      SELECT oi.*, p.slug, p.images
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    
    const itemsResult = await pg.query(itemsQuery, [orderId]);
    
    order.items = itemsResult.rows;
    
    return order;
  } catch (error) {
    logger.error('Error fetching order', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get user's orders
 */
async function getUserOrders(userId, filters = {}, pagination = {}) {
  try {
    let pg = getPostgreSQL();
    
    const { status, search } = filters;
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = pagination;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
    `;
    
    let params = [userId];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (o.order_number ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY o.id ORDER BY o.${sort_by} ${sort_order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    let result = await pg.query(query, params);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM orders WHERE user_id = $1
      ${status ? `AND status = $2` : ''}
      ${search ? `AND order_number ILIKE $${status ? 3 : 2}` : ''}
    `;
    
    const countParams = [userId];
    if (status) countParams.push(status);
    if (search) countParams.push(`%${search}%`);
    
    const countResult = await pg.query(countQuery, countParams);
    let total = parseInt(countResult.rows[0].count);
    
    return {
      orders: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching user orders', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status, notes = null) {
  try {
    let pg = getPostgreSQL();
    
    let query = `
      UPDATE orders
      SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    let result = await pg.query(query, [status, notes, orderId]);
    
    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    let order = result.rows[0];
    
    // Emit WebSocket event
    let io = require('../../../index').app.get('io');
    if (io) {
      io.to(`order:${orderId}`).emit('order_status_updated', {
        order_id: orderId,
        status: status,
        notes: notes
      });
      
      io.to(`user:${order.user_id}`).emit('order_updated', {
        order_id: orderId,
        status: status
      });
    }
    
    logger.info(`Order status updated: ${orderId} to ${status}`);
    
    return order;
  } catch (error) {
    logger.error('Error updating order status', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Process payment
 */
async function processPayment(orderId, paymentData, userId = null) {
  try {
    let pg = getPostgreSQL();
    
    // Get order with optional ownership check
    let orderQuery = 'SELECT * FROM orders WHERE id = $1';
    const queryParams = [orderId];
    
    if (userId) {
      orderQuery += ' AND user_id = $2';
      queryParams.push(userId);
    }
    
    let orderResult = await pg.query(orderQuery, queryParams);
    
    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    let order = orderResult.rows[0];
    
    if (order.payment_status === 'completed') {
      throw new Error('Payment already completed');
    }
    
    // Process payment (in production, integrate with payment gateway)
    const paymentResult = await processPaymentGateway(paymentData, order.total_amount);
    
    // ---- TRANSACTION BOUNDARY (BR-08) -----------------------------------
    //
    // The payment record and the order's payment_status must commit together.
    //
    // Note where the boundary STARTS: after the gateway call, not before. The
    // gateway is an external system that has already taken the customer's
    // money by this point; wrapping it in a database transaction would not
    // make it reversible, and holding locks across a network call to a payment
    // provider is how a slow gateway becomes a database-wide stall.
    //
    // What must be atomic is what happens AFTER money moved: if the payment row
    // is written and the order status update fails, the customer has paid and
    // the order still reads "pending" — support will refund a payment that
    // already succeeded, or ship nothing at all.
    const payClient = await pg.connect();
    let paymentRecord;
    try {
      await payClient.query('BEGIN');

      paymentRecord = await payClient.query(
        `INSERT INTO payments (order_id, user_id, amount, currency, payment_method,
                               payment_status, transaction_id, gateway_response, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [orderId, order.user_id, order.total_amount, 'INR',
          paymentData.payment_method, 'completed', paymentResult.transaction_id,
          JSON.stringify(paymentResult)]
      );

      await payClient.query(
        'UPDATE orders SET payment_status = $1, status = $2 WHERE id = $3',
        ['completed', 'confirmed', orderId]
      );

      await payClient.query('COMMIT');
    } catch (txErr) {
      await payClient.query('ROLLBACK');
      // The money HAS moved. A rollback here restores database consistency but
      // does not reverse the charge, so this must be loud enough to reconcile.
      logger.error('PAYMENT RECORDED AT GATEWAY BUT NOT IN LEDGER — needs manual reconciliation', {
        orderId, transactionId: paymentResult?.transaction_id, error: txErr.message,
      });
      throw txErr;
    } finally {
      payClient.release();
    }
    // ---- end transaction -------------------------------------------------

    
    logger.info(`Payment processed: order ${orderId}, amount ${order.total_amount}`);

    // Afferent signal: this is what gives the fraud rule its financial context.
    // A fraud score alone can only block a transaction; correlated with a
    // payment in flight for the same user, the engine can also freeze the payout.
    signalBus.emitSignal(
      SIGNAL.PAYMENT_RECEIVED,
      {
        order_id: orderId,
        amount: Number(order.total_amount) || 0,
        method: paymentData.payment_method,
        transaction_id: paymentResult.transaction_id
      },
      { severity: SEVERITY.INFO, source: 'orderService', entityId: order.user_id }
    );

    return paymentRecord.rows[0];
  } catch (error) {
    logger.error('Error processing payment', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Calculate discount from coupon
 */
async function calculateDiscount(couponCode, orderAmount) {
  try {
    let pg = getPostgreSQL();
    
    let query = `
      SELECT * FROM coupons
      WHERE code = $1
        AND is_active = TRUE
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
    `;
    
    let result = await pg.query(query, [couponCode.toUpperCase()]);
    
    if (result.rows.length === 0) {
      return 0;
    }
    
    const coupon = result.rows[0];
    
    // Check minimum order value
    if (coupon.minimum_order_value && orderAmount < coupon.minimum_order_value) {
      return 0;
    }
    
    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return 0;
    }
    
    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = orderAmount * (coupon.discount_value / 100);
    } else {
      discount = coupon.discount_value;
    }
    
    // Apply maximum discount limit
    if (coupon.maximum_discount_amount && discount > coupon.maximum_discount_amount) {
      discount = coupon.maximum_discount_amount;
    }
    
    // Update used count
    await pg.query(
      'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
      [coupon.id]
    );
    
    return Math.round(discount);
  } catch (error) {
    logger.error('Error calculating discount', { error: error.message, stack: error.stack });
    return 0;
  }
}

/**
 * Helper function to generate order number
 */
function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').substring(0, 6).toUpperCase();
  return `AFR-${timestamp}-${random}`;
}

/**
 * Mock payment gateway processing
 */
async function processPaymentGateway(paymentData, amount) {
  // In production, integrate with actual payment gateway (Razorpay, Stripe, etc.)
  return {
    success: true,
    transaction_id: `TXN-${Date.now()}`,
    amount: amount,
    currency: 'INR',
    payment_method: paymentData.payment_method
  };
}

/**
 * Express router for order service
 */
const express = require('express');
const router = express.Router();

// NOTE: every route below reads req.user.id, which is populated by
// authMiddleware. These routes previously had NO auth middleware applied at
// all, so req.user was always undefined -> every cart/order request threw
// "Cannot read properties of undefined (reading 'id')" AND the endpoints were
// publicly reachable without a token.

// Get cart
router.get('/cart', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const cart = await getCart(userId);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to cart
router.post('/cart', authMiddleware, async (req, res) => {
  try {
    let userId = req.user.id;
    const { product_id, quantity, attributes } = req.body;
    const cartItem = await addToCart(userId, product_id, quantity, attributes);
    res.json(cartItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update cart item
router.put('/cart/:id', authMiddleware, async (req, res) => {
  try {
    let userId = req.user.id;
    const { quantity } = req.body;
    let cartItem = await updateCartItem(userId, req.params.id, quantity);
    res.json(cartItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove from cart
router.delete('/cart/:id', authMiddleware, async (req, res) => {
  try {
    let userId = req.user.id;
    let cartItem = await removeFromCart(userId, req.params.id);
    res.json(cartItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Clear cart
router.delete('/cart', authMiddleware, async (req, res) => {
  try {
    let userId = req.user.id;
    let result = await clearCart(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
router.post('/', authMiddleware, async (req, res) => {
  try {
    let userId = req.user.id;
    let order = await createOrder(userId, req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get order by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    let userId = req.user.id;
    let order = await getOrderById(req.params.id, userId);
    res.json(order);
  } catch (error) {
    if (error.message === 'Order not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get user orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    let userId = req.user.id;
    const filters = {
      status: req.query.status,
      search: req.query.search
    };
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order
    };
    let result = await getUserOrders(userId, filters, pagination);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
// Admin-only: updateOrderStatus() takes an orderId with no ownership check, so
// any authenticated user could otherwise change the status of ANY order
// (including other customers' orders, e.g. marking them paid/delivered).
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;
    let order = await updateOrderStatus(req.params.id, status, notes);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Process payment — ownership enforced: only the order's owner or an admin
// may submit a payment for it (was previously any authenticated user, any order).
router.post('/:id/payment', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const payment = await processPayment(req.params.id, req.body, isAdmin ? null : req.user.id);
    res.json(payment);
  } catch (error) {
    if (error.message === 'Order not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

module.exports = {
  router,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  processPayment
};



