/**
 * Livestock Route Support
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'livestockRouteSupport' });
});

module.exports = router;
