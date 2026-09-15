const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validationMiddleware');

/**
 * M193 Routes
 * Base path: /api/m193
 */

// Middleware
router.use(authenticate);

/**
 * @route   GET /api/m193
 * @desc    Get all m193 with pagination and filtering
 * @query   page, limit, status, user_id, search, sort, order
 * @access  Private
 */
router.get('/', controller.getAll.bind(controller));

/**
 * @route   POST /api/m193/bulk
 * @desc    Create multiple records in bulk
 * @body    { records: [...] }
 * @access  Private
 */
router.post('/bulk', controller.createBulk.bind(controller));

/**
 * @route   GET /api/m193/search
 * @desc    Search m193 records
 * @query   q (search query), fields (comma-separated field names)
 * @access  Private
 */
router.get('/search', controller.search.bind(controller));

/**
 * @route   POST /api/m193
 * @desc    Create new m193
 * @body    { user_id, ...data }
 * @access  Private
 */
router.post('/', controller.create.bind(controller));

/**
 * @route   GET /api/m193/:id
 * @desc    Get m193 by ID
 * @access  Private
 */
router.get('/:id', controller.getById.bind(controller));

/**
 * @route   PUT /api/m193/:id
 * @desc    Update m193
 * @access  Private
 */
router.put('/:id', controller.update.bind(controller));

/**
 * @route   DELETE /api/m193/:id
 * @desc    Delete (soft delete) m193
 * @access  Private
 */
router.delete('/:id', controller.delete.bind(controller));

module.exports = router;