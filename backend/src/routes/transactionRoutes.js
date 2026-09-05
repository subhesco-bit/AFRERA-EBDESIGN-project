/**
 * Transaction Routes
 */

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(apiLimiter);

router.post
    // Log request
    logger.debug('router.post request');('/create', transactionController.createTransaction);
router.get
    // Log request
    logger.debug('router.get request');('/:transactionId', transactionController.getTransaction);
router.get
    // Log request
    logger.debug('router.get request');('/user/:userId', transactionController.getUserTransactions);
router.put
    // Log request
    logger.debug('router.put request');('/:transactionId/status', transactionController.updateTransactionStatus);

module.exports = router;