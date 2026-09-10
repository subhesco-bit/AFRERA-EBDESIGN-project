/**
 * ecommerce E R P Routes
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'ecommerceERPRoutes' });
});

module.exports = router;
