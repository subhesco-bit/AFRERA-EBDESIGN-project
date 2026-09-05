/**
 * Wallet Routes
 */

const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(rateLimiter);

router.get('/balance/:userId', walletController.getWalletBalance);
router.post('/create', walletController.createWallet);
router.post('/add-funds/:walletId', walletController.addFunds);
router.get('/transactions/:walletId', walletController.getTransactionHistory);

module.exports = router;