// Express routes for Discount Management (M059)
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.get('/:id', controller.get);
router.post('/', authMiddleware, requireRole('fpo','admin'), controller.create);
router.put('/:id', authMiddleware, requireRole('fpo','admin'), controller.update);
router.delete('/:id', authMiddleware, requireRole('fpo','admin'), controller.remove);

module.exports = router;
