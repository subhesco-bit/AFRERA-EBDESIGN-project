// Express routes for Harvest Planning (M069)
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Public get/list endpoints, protected writes (mirrors M022's convention).
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', authMiddleware, requireRole('farmer', 'admin'), controller.create);
router.put('/:id', authMiddleware, requireRole('farmer', 'admin'), controller.update);
router.delete('/:id', authMiddleware, requireRole('farmer', 'admin'), controller.remove);

module.exports = router;
