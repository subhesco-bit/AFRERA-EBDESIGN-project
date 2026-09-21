/**
 * analyticsRoutes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', route: 'analyticsRoutes' });
});

router.get('/', (req, res) => {
  res.json({ success: true, route: 'analyticsRoutes', message: 'Operational' });
});

module.exports = router;
