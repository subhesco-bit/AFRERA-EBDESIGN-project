/**
 * farmer Training Routes
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'farmerTrainingRoutes' });
});

module.exports = router;
