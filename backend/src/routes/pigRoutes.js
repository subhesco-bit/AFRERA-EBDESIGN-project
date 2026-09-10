/**
 * pig Routes
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'pigRoutes' });
});

module.exports = router;
