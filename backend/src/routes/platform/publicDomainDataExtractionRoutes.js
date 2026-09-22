const express = require('express');
const router = express.Router();
const service = require('../../services/platform/publicDomainDataExtractionService');

router.get('/health', (_req, res) => res.json({ success: true, data: service.getHealthStatus() }));
router.get('/sources', (req, res) => res.json({ success: true, data: service.getDataSources(req.query) }));
router.get('/sources/:sourceId', (req, res) => {
  const source = service.getDataSource(req.params.sourceId);
  if (!source) return res.status(404).json({ success: false, error: 'Data source not found' });
  return res.json({ success: true, data: source });
});
router.post('/extractions', async (req, res, next) => {
  try {
    const job = service.createExtractionJob(req.body || {});
    await service.startExtractionJob(job.id);
    res.status(202).json({ success: true, data: service.getExtractionJob(job.id) });
  } catch (error) {
    next(error);
  }
});
router.get('/extractions', (req, res) => res.json({ success: true, data: service.getExtractionJobs(req.query) }));
router.get('/extractions/:jobId', (req, res) => {
  const job = service.getExtractionJob(req.params.jobId);
  if (!job) return res.status(404).json({ success: false, error: 'Extraction job not found' });
  return res.json({ success: true, data: job });
});
router.get('/statistics', (_req, res) => res.json({ success: true, data: service.getStatistics() }));

module.exports = router;