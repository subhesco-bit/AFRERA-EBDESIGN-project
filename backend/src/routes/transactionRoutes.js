/**
 * Transaction Routes
 */

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(rateLimiter);

router.post('/create', transactionController.createTransaction);
router.get('/:transactionId', transactionController.getTransaction);
router.get('/user/:userId', transactionController.getUserTransactions);
router.put('/:transactionId/status', transactionController.updateTransactionStatus);

module.exports = router;