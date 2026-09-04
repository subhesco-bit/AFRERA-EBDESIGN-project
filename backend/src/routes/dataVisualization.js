const router = require('express').Router();
const vizService = require('../services/dataVisualizationService');
router.post('/viz/:dataId/chart/:type', async (req, res) => {
  try { const result = await vizService.generateChart(req.params.dataId, req.params.type); res.json(result); }
  catch (error) { res.status(500).json({ error: error.message }); }
});
module.exports = router;
