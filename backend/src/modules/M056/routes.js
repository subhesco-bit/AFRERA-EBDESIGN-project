const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.get('/:id', controller.get);
router.post('/', authMiddleware, requireRole('fpo','admin'), controller.create);
router.put('/:id/status', authMiddleware, requireRole('fpo','admin'), controller.updateStatus);
router.post('/:id/refund', authMiddleware, requireRole('fpo','admin'), controller.refund);
// F5 fix (2026-08-30): frontend calls bare PUT/DELETE /:id (updateOrder/
// deleteOrder-style generic CRUD) - only the status/refund sub-routes
// existed before. See controller.js update()/remove() and service.js
// updatePayment()/deletePayment().
router.put('/:id', authMiddleware, requireRole('fpo','admin'), controller.update);
router.delete('/:id', authMiddleware, requireRole('fpo','admin'), controller.remove);

module.exports = router;
