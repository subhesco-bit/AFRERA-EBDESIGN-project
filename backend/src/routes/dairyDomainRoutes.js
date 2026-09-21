/**
 * Real backend routes for DairyManagementPage.jsx's animal/milk-record CRUD
 * and AI action cards, backed by services/legacy/dairyService.js.
 *
 * Paths match frontend/src/services/api.js's dairyAPI and dairyAIAPI
 * (verified against actual page usage in DairyManagementPage.jsx, whose
 * dairyAPI/dairyAIAPI calls didn't exist on the exported clients until this
 * change - added there to match what the page already expects).
 */
'use strict';

const express = require('express');
const router = express.Router();
const {
  listAnimals, createAnimal, updateAnimal, deleteAnimal,
  listMilkRecords, recordMilk,
  optimizeMilkProduction, predictHealthRisks, optimizeFeedComposition, recommendBreeding,
} = require('../services/legacy/dairyService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

router.get('/dairy/animals', async (req, res) => {
  try {
    const result = await listAnimals(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/dairy/animal', async (req, res) => {
  try {
    const item = await createAnimal(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.put('/dairy/animal/:id', async (req, res) => {
  try {
    const item = await updateAnimal(req.params.id, req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.delete('/dairy/animal/:id', async (req, res) => {
  try {
    await deleteAnimal(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/dairy/milk-records', async (req, res) => {
  try {
    const result = await listMilkRecords(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/dairy/milk-record', async (req, res) => {
  try {
    const item = await recordMilk(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/dairy-ai/optimize-milk-production/:animalId', async (req, res) => {
  try {
    const result = await optimizeMilkProduction(req.params.animalId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/dairy-ai/predict-health-risks/:animalId', async (req, res) => {
  try {
    const result = await predictHealthRisks(req.params.animalId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/dairy-ai/optimize-feed-composition/:animalId', async (req, res) => {
  try {
    const result = await optimizeFeedComposition(req.params.animalId, req.body?.productionGoal);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/dairy-ai/recommend-breeding/:animalId', async (req, res) => {
  try {
    const result = await recommendBreeding(req.params.animalId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
