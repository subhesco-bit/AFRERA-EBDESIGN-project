const express = require('express');
const router = express.Router();
const governance = require('../services/aiGovernanceService');
const events = require('../services/aiEventOrchestratorService');
const autonomy = require('../services/boundedAutonomyService');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware, requireRole('admin', 'superadmin'));

router.post('/evaluate', async (req, res) => {
  try { return res.json({ success: true, ...(await governance.authorize(req.body)) }); }
  catch (e) { return res.status(400).json({ success: false, error: e.message }); }
});

router.post('/events/publish', async (req, res) => {
  try { return res.json({ success: true, ...(await events.publish(req.body)) }); }
  catch (e) { return res.status(400).json({ success: false, error: e.message }); }
});

router.post('/events/replay/:eventId', async (req, res) => {
  try { return res.json({ success: true, ...(await events.replay(req.params.eventId)) }); }
  catch (e) { return res.status(400).json({ success: false, error: e.message }); }
});

router.get('/events/handlers', (req, res) => res.json({ success: true, handlers: events.listHandlers() }));

router.post('/autonomy/propose', async (req, res) => {
  try { return res.json({ success: true, ...(await autonomy.propose(req.body)) }); }
  catch (e) { return res.status(400).json({ success: false, error: e.message }); }
});

router.post('/autonomy/:actionId/approve', async (req, res) => {
  try { return res.json({ success: true, ...(await autonomy.approve(req.params.actionId, req.body.approvalId)) }); }
  catch (e) { return res.status(400).json({ success: false, error: e.message }); }
});

module.exports = router;
