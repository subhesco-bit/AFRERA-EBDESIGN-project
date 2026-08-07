const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware , requireRole } require('../../middleware/auth');

// Public get/list endpoints, protected writes by default
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', authMiddleware, requireRole('logistics','admin'), controller.create);
router.put('/:id', authMiddleware, requireRole('logistics','admin'), controller.update);
router.delete('/:id', authMiddleware, requireRole('logistics','admin'), controller.remove);

module.exports = router;

