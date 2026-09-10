/**
 * climate.test Routes
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'climateRoutes.test' });
});

module.exports = router;
