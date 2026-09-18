/**
 * M65: Module M65 Service Routes
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware } = require('../../middleware/auth');

router.use(authMiddleware);

router.post('/', controller.create.bind(controller));
router.get('/:id', controller.read.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));
router.get('/', controller.list.bind(controller));

module.exports = router;
