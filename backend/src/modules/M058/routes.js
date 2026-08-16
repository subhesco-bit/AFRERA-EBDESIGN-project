const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.get('/:id', controller.get);
router.post('/', authMiddleware, requireRole('fpo','admin'), controller.create);
router.put('/:id/status', authMiddleware, requireRole('fpo','admin'), controller.updateStatus);

module.exports = router;
