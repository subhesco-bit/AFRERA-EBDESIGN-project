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

router.post('/create', transactionController.createTransaction);
router.get('/:transactionId', transactionController.getTransaction);
router.get('/user/:userId', transactionController.getUserTransactions);
router.put('/:transactionId/status', transactionController.updateTransactionStatus);

module.exports = router;
