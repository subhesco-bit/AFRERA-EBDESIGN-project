// Routes for M029 - Farmer Health & Welfare
const express = require('express');
const router = express.Router();
const farmerHealthService = require('../modules/M029/service');

// Health Records Routes
router.get('/health-records', async (req, res) => {
  try {
    const { page, limit, farmerId } = req.query;
    const result = await farmerHealthService.listHealthRecords({ 
      page: parseInt(page), 
      limit: parseInt(limit), 
      farmerId: farmerId ? parseInt(farmerId) : null 
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/health-records/:id', async (req, res) => {
  try {
    const record = await farmerHealthService.getHealthRecord(parseInt(req.params.id));
    if (!record) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/health-records', async (req, res) => {
  try {
    const record = await farmerHealthService.createHealthRecord(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/health-records/:id', async (req, res) => {
  try {
    const record = await farmerHealthService.updateHealthRecord(parseInt(req.params.id), req.body);
    if (!record) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/health-records/:id', async (req, res) => {
  try {
    const deleted = await farmerHealthService.deleteHealthRecord(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Health record not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Farmer Health Summary
router.get('/farmers/:farmerId/health-summary', async (req, res) => {
  try {
    const summary = await farmerHealthService.getFarmerHealthSummary(parseInt(req.params.farmerId));
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Welfare Programs Routes
router.get('/welfare-programs', async (req, res) => {
  try {
    const { page, limit, eligibility } = req.query;
    const result = await farmerHealthService.getWelfarePrograms({ 
      page: parseInt(page), 
      limit: parseInt(limit), 
      eligibility 
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/welfare-enrollments', async (req, res) => {
  try {
    const { farmerId, programId } = req.body;
    const enrollment = await farmerHealthService.enrollWelfareProgram(
      parseInt(farmerId), 
      parseInt(programId)
    );
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;