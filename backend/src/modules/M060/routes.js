const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', authMiddleware, requireRole('fpo','admin'), controller.create);
router.put('/:id', authMiddleware, requireRole('fpo','admin'), controller.update);

module.exports = router;
