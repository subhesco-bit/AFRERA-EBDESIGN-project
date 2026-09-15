const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validationMiddleware');

/**
 * M071 Routes
 * Base path: /api/m071
 */

// Middleware
router.use(authenticate);

/**
 * @route   GET /api/m071
 * @desc    Get all m071 with pagination and filtering
 * @query   page, limit, status, user_id, search, sort, order
 * @access  Private
 */
router.get('/', controller.getAll.bind(controller));

/**
 * @route   POST /api/m071/bulk
 * @desc    Create multiple records in bulk
 * @body    { records: [...] }
 * @access  Private
 */
router.post('/bulk', controller.createBulk.bind(controller));

/**
 * @route   GET /api/m071/search
 * @desc    Search m071 records
 * @query   q (search query), fields (comma-separated field names)
 * @access  Private
 */
router.get('/search', controller.search.bind(controller));

/**
 * @route   POST /api/m071
 * @desc    Create new m071
 * @body    { user_id, ...data }
 * @access  Private
 */
router.post('/', controller.create.bind(controller));

/**
 * @route   GET /api/m071/:id
 * @desc    Get m071 by ID
 * @access  Private
 */
router.get('/:id', controller.getById.bind(controller));

/**
 * @route   PUT /api/m071/:id
 * @desc    Update m071
 * @access  Private
 */
router.put('/:id', controller.update.bind(controller));

/**
 * @route   DELETE /api/m071/:id
 * @desc    Delete (soft delete) m071
 * @access  Private
 */
router.delete('/:id', controller.delete.bind(controller));

module.exports = router;