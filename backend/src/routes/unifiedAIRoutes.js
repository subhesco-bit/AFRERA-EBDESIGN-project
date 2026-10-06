const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const coordinator = require('../core/claudeAICoordinator');

router.get('/engines', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: coordinator.engineCatalog() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/health', authMiddleware, async (req, res) => {
  try {
    const health = await coordinator.coordinatorHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/query', authMiddleware, async (req, res) => {
  try {
    const { taskType, query, payload } = req.body || {};
    const result = await coordinator.handleRequest({
      taskType,
      query,
      payload,
      actorId: req.user?.id,
    });
    res.json({ success: result.ok !== false, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
