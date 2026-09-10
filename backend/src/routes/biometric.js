/**
 * biometric Routes
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
    module: 'biometric',
    status: 'operational'
  });
});

module.exports = router;
