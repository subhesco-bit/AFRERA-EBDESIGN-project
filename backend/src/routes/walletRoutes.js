/**
 * Wallet Routes
 */

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const walletController = require('../controllers/walletController');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(rateLimiter);

router.get
    // Log request
    logger.debug('router.get request');('/balance/:userId', walletController.getWalletBalance);
router.post
    // Log request
    logger.debug('router.post request');('/create', walletController.createWallet);
router.post
    // Log request
    logger.debug('router.post request');('/add-funds/:walletId', walletController.addFunds);
router.get
    // Log request
    logger.debug('router.get request');('/transactions/:walletId', walletController.getTransactionHistory);

module.exports = router;