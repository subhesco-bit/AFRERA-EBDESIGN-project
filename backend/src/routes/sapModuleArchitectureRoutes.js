/**
 * sap Module Architecture Routes
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'sapModuleArchitectureRoutes' });
});

module.exports = router;
