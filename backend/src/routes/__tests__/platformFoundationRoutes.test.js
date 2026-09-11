/**
 * platform Foundation.test Routes
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'platformFoundationRoutes.test' });
});

module.exports = router;
