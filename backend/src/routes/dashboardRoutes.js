const express = require('express');
const router = express.Router();

/**
 * Dashboard Routes
 * GET /dashboard/stats - User dashboard statistics
 * GET /dashboard/balance - Account balance
 * GET /dashboard/recent-transactions - Recent transaction history
 */

// Middleware: Verify token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }
  req.userId = token; // In production: verify and decode JWT
  next();
}

// GET /dashboard/stats
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = {
      balance: 5250.5,
      activeOrders: 3,
      totalTransactions: 47,
      loyaltyPoints: 1250,
      recentTransactions: [
        {
          description: 'Product Purchase - Organic Rice',
          amount: 450,
          date: new Date(Date.now() - 86400000),
        },
        {
          description: 'Wallet Refund',
          amount: -100,
          date: new Date(Date.now() - 172800000),
        },
        {
          description: 'Product Purchase - Coffee Beans',
          amount: 320,
          date: new Date(Date.now() - 259200000),
        },
      ],
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /dashboard/balance
router.get('/balance', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        balance: 5250.5,
        currency: 'INR',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /dashboard/recent-transactions
router.get('/recent-transactions', verifyToken, async (req, res) => {
  try {
    const transactions = [
      {
        id: 'tx_001',
        description: 'Product Purchase - Organic Rice',
        amount: 450,
        type: 'debit',
        date: new Date(Date.now() - 86400000),
        status: 'completed',
      },
      {
        id: 'tx_002',
        description: 'Wallet Refund',
        amount: 100,
        type: 'credit',
        date: new Date(Date.now() - 172800000),
        status: 'completed',
      },
      {
        id: 'tx_003',
        description: 'Product Purchase - Coffee Beans',
        amount: 320,
        type: 'debit',
        date: new Date(Date.now() - 259200000),
        status: 'completed',
      },
      {
        id: 'tx_004',
        description: 'Loyalty Points Converted',
        amount: 250,
        type: 'credit',
        date: new Date(Date.now() - 345600000),
        status: 'completed',
      },
      {
        id: 'tx_005',
        description: 'Insurance Claim Payout',
        amount: 5000,
        type: 'credit',
        date: new Date(Date.now() - 432000000),
        status: 'completed',
      },
    ];

    res.json({
      success: true,
      data: {
        transactions,
        count: transactions.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
