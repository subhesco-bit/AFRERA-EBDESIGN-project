const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validationMiddleware');

/**
 * M126 Routes
 * Base path: /api/m126
 */

// Middleware
router.use(authenticate);

/**
 * @route   GET /api/m126
 * @desc    Get all m126 with pagination and filtering
 * @query   page, limit, status, user_id, search, sort, order
 * @access  Private
 */
router.get('/', controller.getAll.bind(controller));

/**
 * @route   POST /api/m126/bulk
 * @desc    Create multiple records in bulk
 * @body    { records: [...] }
 * @access  Private
 */
router.post('/bulk', controller.createBulk.bind(controller));

/**
 * @route   GET /api/m126/search
 * @desc    Search m126 records
 * @query   q (search query), fields (comma-separated field names)
 * @access  Private
 */
router.get('/search', controller.search.bind(controller));

/**
 * @route   POST /api/m126
 * @desc    Create new m126
 * @body    { user_id, ...data }
 * @access  Private
 */
router.post('/', controller.create.bind(controller));

/**
 * @route   GET /api/m126/:id
 * @desc    Get m126 by ID
 * @access  Private
 */
router.get('/:id', controller.getById.bind(controller));

/**
 * @route   PUT /api/m126/:id
 * @desc    Update m126
 * @access  Private
 */
router.put('/:id', controller.update.bind(controller));

/**
 * @route   DELETE /api/m126/:id
 * @desc    Delete (soft delete) m126
 * @access  Private
 */
router.delete('/:id', controller.delete.bind(controller));

module.exports = router;