const express = require('express');
const router = express.Router();
const service = require('../../services/platform/startupEnvironmentService');

router.get('/health', (_req, res) => res.json({ success: true, data: service.getHealthStatus() }));
router.get('/startups', (req, res) => res.json({ success: true, data: service.getStartups(req.query) }));
router.get('/startups/:startupId', (req, res) => {
  const startup = service.getStartup(req.params.startupId);
  if (!startup) return res.status(404).json({ success: false, error: 'Startup not found' });
  return res.json({ success: true, data: startup });
});
router.post('/startups', (req, res) => res.status(201).json({ success: true, data: service.registerStartup(req.body || {}) }));
router.get('/incubation-programs', (req, res) => res.json({ success: true, data: service.getIncubationPrograms(req.query) }));
router.get('/mentors', (req, res) => res.json({ success: true, data: service.getMentors(req.query) }));
router.get('/funding-opportunities', (req, res) => res.json({ success: true, data: service.getFundingOpportunities(req.query) }));
router.get('/networking-events', (req, res) => res.json({ success: true, data: service.getNetworkingEvents(req.query) }));
router.get('/analytics', (_req, res) => res.json({ success: true, data: service.getAnalytics() }));

module.exports = router;