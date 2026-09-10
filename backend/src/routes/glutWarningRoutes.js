/**
 * glut Warning Routes
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'glutWarningRoutes' });
});

module.exports = router;
