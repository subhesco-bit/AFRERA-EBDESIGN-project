/**
 * crop Management Routes
 * Placeholder route module
 */

const express = require('express');
const router = express.Router();

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    module: 'cropManagementRoutes',
    status: 'operational'
  });
});

module.exports = router;
