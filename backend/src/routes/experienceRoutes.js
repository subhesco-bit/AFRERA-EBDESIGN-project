/**
 * Experience Layer / DXP routes.
 *
 * `/resolve` is public and unauthenticated by design: it must answer before a
 * user logs in, or the login screen itself renders with the wrong theme, the
 * wrong motion setting and the wrong font scale — which is precisely the screen
 * a user with low vision needs to get right first.
 */
const express = require('express');
const router = express.Router();
const xp = require('../services/experienceLayerService');
const { authMiddleware } = require('../middleware/auth');
const fail = (res, e) => res.status(/required|cannot|must/i.test(e.message) ? 400 : 500)
  .json({ success: false, error: e.message });

// The one call a client needs to render.
router.get('/resolve', async (req, res) => {
  try {
    res.json({ success: true, data: await xp.resolveExperience({
      userId: req.query.userId || req.user?.id,
      viewportWidthPx: Number(req.query.width) || undefined,
      prefersReducedMotion: req.query.reducedMotion === 'true',
      prefersDark: req.query.dark === 'true',
    }) });
  } catch (e) { fail(res, e); }
});

router.get('/tokens', async (req, res) => {
  try { res.json({ success: true, data: await xp.getTokens(req.query.theme || 'base') }); } catch (e) { fail(res, e); }
});
router.post('/tokens', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await xp.upsertToken(req.body) }); } catch (e) { fail(res, e); }
});
router.get('/themes', async (req, res) => {
  try { res.json({ success: true, data: await xp.listThemes() }); } catch (e) { fail(res, e); }
});
router.get('/contrast', async (req, res) => {
  try {
    const { fg, bg, large } = req.query;
    if (!fg || !bg) throw new Error('fg and bg are required');
    res.json({ success: true, data: xp.checkContrast(fg, bg, { largeText: large === 'true' }) });
  } catch (e) { fail(res, e); }
});
router.get('/motion', async (req, res) => {
  try {
    res.json({ success: true, data: await xp.getMotion({ reducedMotion: req.query.reduced === 'true' }) });
  } catch (e) { fail(res, e); }
});
router.get('/breakpoint', async (req, res) => {
  try { res.json({ success: true, data: await xp.breakpointFor(req.query.width) }); } catch (e) { fail(res, e); }
});
router.get('/components', async (req, res) => {
  try { res.json({ success: true, data: await xp.listComponents(req.query) }); } catch (e) { fail(res, e); }
});
router.post('/components', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await xp.registerComponent(req.body) }); } catch (e) { fail(res, e); }
});
router.get('/accessibility', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await xp.conformanceSummary() }); } catch (e) { fail(res, e); }
});
router.post('/accessibility', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await xp.recordConformance(req.body) }); } catch (e) { fail(res, e); }
});
router.get('/preferences', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await xp.getPreferences(req.user?.id) }); } catch (e) { fail(res, e); }
});
router.put('/preferences', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await xp.savePreferences(req.user?.id, req.body) }); } catch (e) { fail(res, e); }
});
router.get('/feedback/:eventKey', async (req, res) => {
  try { res.json({ success: true, data: await xp.feedbackFor(req.params.eventKey) }); } catch (e) { fail(res, e); }
});

module.exports = router;
