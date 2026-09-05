const express = require('express');
const router = express.Router();

/**
 * Order Routes
 * GET /orders - List user orders
 * GET /orders/:id - Get order details
 * POST /orders - Create new order
 * PUT /orders/:id - Update order
 * DELETE /orders/:id - Cancel order
 */

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  req.userId = token;
  next();
}

const orders = [];

// GET /orders
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    let userOrders = orders.filter((o) => o.userId === req.userId);

    if (status) {
      userOrders = userOrders.filter((o) => o.status === status);
    }

    res.json({
      success: true,
      data: {
        orders: userOrders,
        count: userOrders.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /orders/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = orders.find(
      (o) => o.id === req.params.id && o.userId === req.userId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /orders
router.post('/', verifyToken, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress } = req.body;

    if (!items || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const newOrder = {
      id: `ord_${Date.now()}`,
      userId: req.userId,
      items,
      totalAmount,
      shippingAddress,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    orders.push(newOrder);

    res.status(201).json({
      success: true,
      data: newOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /orders/:id
router.put('/:id', verifyToken, async (req, res) => {
  try {
    let order = orders.find(
      (o) => o.id === req.params.id && o.userId === req.userId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Only allow status updates
    if (req.body.status) {
      order.status = req.body.status;
    }
    order.updatedAt = new Date();

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /orders/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const index = orders.findIndex(
      (o) => o.id === req.params.id && o.userId === req.userId
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    const deleted = orders.splice(index, 1)[0];

    res.json({
      success: true,
      data: deleted,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
