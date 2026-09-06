/**
 * Wallet Routes
 */

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const walletController = require('../controllers/walletController');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(apiLimiter);

router.get('/balance/:userId', walletController.getWalletBalance);
router.post('/create', walletController.createWallet);
router.post('/add-funds/:walletId', walletController.addFunds);
router.get('/transactions/:walletId', walletController.getTransactionHistory);

module.exports = router;
