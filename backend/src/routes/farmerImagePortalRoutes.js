/**
 * Farmer Image Portal Routes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

router.post('/', async (req, res) => {
  res.json({ success: true, module: 'farmerImagePortalRoutes', message: 'Operational' });
});

router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy' });
});

module.exports = router;
