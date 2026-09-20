/**
 * water Soil Management.test Routes
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'waterSoilManagementRoutes.test' });
});

module.exports = router;
