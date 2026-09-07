const router = require('express').Router();
const videoService = require('../services/videoAnalyticsService');

router.post('/video/:videoId/analyze/:type', async (req, res) => {
  try {
    const result = await videoService.analyzeVideo(req.params.videoId, req.params.type);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
