const express = require('express');
const router = express.Router();

/**
 * Wallet Routes
 * GET /wallet/balance - Get wallet balance
 * POST /wallet/add-funds - Add funds to wallet
 * GET /wallet/transactions - Get wallet transaction history
 * POST /wallet/transfer - Transfer funds to another user
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
  req.userId = token;
  next();
}

// Mock wallet data
const wallets = new Map();

function getWallet(userId) {
  if (!wallets.has(userId)) {
    wallets.set(userId, {
      balance: 5000,
      currency: 'INR',
      transactions: [],
    });
  }
  return wallets.get(userId);
}

// GET /wallet/balance
router.get('/balance', verifyToken, async (req, res) => {
  try {
    const wallet = getWallet(req.userId);

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /wallet/add-funds
router.post('/add-funds', verifyToken, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
      });
    }

    const wallet = getWallet(req.userId);
    wallet.balance += amount;

    const transaction = {
      id: `tx_${Date.now()}`,
      type: 'credit',
      amount,
      description: `Funds added via ${paymentMethod || 'payment method'}`,
      date: new Date(),
      status: 'completed',
    };
    wallet.transactions.push(transaction);

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        transaction,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /wallet/transactions
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const wallet = getWallet(req.userId);
    const limit = parseInt(req.query.limit) || 10;

    const transactions = wallet.transactions.slice(-limit).reverse();

    res.json({
      success: true,
      data: {
        transactions,
        count: transactions.length,
        balance: wallet.balance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /wallet/transfer
router.post('/transfer', verifyToken, async (req, res) => {
  try {
    const { recipientId, amount, description } = req.body;

    if (!recipientId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient or amount',
      });
    }

    const fromWallet = getWallet(req.userId);
    if (fromWallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
      });
    }

    const toWallet = getWallet(recipientId);

    // Debit from sender
    fromWallet.balance -= amount;
    const debitTx = {
      id: `tx_${Date.now()}_debit`,
      type: 'debit',
      amount,
      description: `Transfer to ${recipientId}: ${description}`,
      date: new Date(),
      status: 'completed',
    };
    fromWallet.transactions.push(debitTx);

    // Credit to recipient
    toWallet.balance += amount;
    const creditTx = {
      id: `tx_${Date.now()}_credit`,
      type: 'credit',
      amount,
      description: `Transfer from ${req.userId}: ${description}`,
      date: new Date(),
      status: 'completed',
    };
    toWallet.transactions.push(creditTx);

    res.json({
      success: true,
      data: {
        balance: fromWallet.balance,
        transaction: debitTx,
        message: 'Transfer completed successfully',
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
