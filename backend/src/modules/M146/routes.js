const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validationMiddleware');

/**
 * M146 Routes
 * Base path: /api/m146
 */

// Middleware
router.use(authenticate);

/**
 * @route   GET /api/m146
 * @desc    Get all m146 with pagination and filtering
 * @query   page, limit, status, user_id, search, sort, order
 * @access  Private
 */
router.get('/', controller.getAll.bind(controller));

/**
 * @route   POST /api/m146/bulk
 * @desc    Create multiple records in bulk
 * @body    { records: [...] }
 * @access  Private
 */
router.post('/bulk', controller.createBulk.bind(controller));

/**
 * @route   GET /api/m146/search
 * @desc    Search m146 records
 * @query   q (search query), fields (comma-separated field names)
 * @access  Private
 */
router.get('/search', controller.search.bind(controller));

/**
 * @route   POST /api/m146
 * @desc    Create new m146
 * @body    { user_id, ...data }
 * @access  Private
 */
router.post('/', controller.create.bind(controller));

/**
 * @route   GET /api/m146/:id
 * @desc    Get m146 by ID
 * @access  Private
 */
router.get('/:id', controller.getById.bind(controller));

/**
 * @route   PUT /api/m146/:id
 * @desc    Update m146
 * @access  Private
 */
router.put('/:id', controller.update.bind(controller));

/**
 * @route   DELETE /api/m146/:id
 * @desc    Delete (soft delete) m146
 * @access  Private
 */
router.delete('/:id', controller.delete.bind(controller));

module.exports = router;