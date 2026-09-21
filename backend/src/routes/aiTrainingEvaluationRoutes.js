/**
 * AI Training and Evaluation Routes
 * Complete implementation of model training, evaluation, and continuous improvement
 * All 23 models fully supported with metrics and monitoring
 */

const express = require("express");
const router = express.Router();
const aiTrainingService = require("../services/aiTrainingService");
const aiEvaluationService = require("../services/aiEvaluationService");
const authMiddleware = require("../middleware/authMiddleware");

// Apply auth to all routes
router.use(authMiddleware);

// === TRAINING ROUTES ===

router.get("/training/collect-data", async (req, res) => {
  try {
    const data = await aiTrainingService.collectTrainingData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/training/accuracy", async (req, res) => {
  try {
    const accuracy = await aiTrainingService.calculateModelAccuracy();
    res.json({
      models: accuracy,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/training/train/:modelType", async (req, res) => {
  try {
    const { modelType } = req.params;
    const { trainingData } = req.body;

    const result = await aiTrainingService.trainPredictionModel(
      modelType,
      trainingData
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/training/optimize/:modelType", async (req, res) => {
  try {
    const { modelType } = req.params;
    const result = await aiTrainingService.optimizeHyperparameters(modelType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/training/report/:modelType", async (req, res) => {
  try {
    const { modelType } = req.params;
    const report = await aiTrainingService.generateTrainingReport(modelType);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/training/drift-detection", async (req, res) => {
  try {
    const driftReports = await aiTrainingService.detectModelDrift();
    res.json({
      driftDetected: driftReports.length > 0,
      affectedModels: driftReports,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/training/retrain/:modelType", async (req, res) => {
  try {
    const { modelType } = req.params;
    const result = await aiTrainingService.executeRetraining(modelType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/training/metrics/:modelType", async (req, res) => {
  try {
    const { modelType } = req.params;
    const metrics = await aiTrainingService.getModelMetrics(modelType);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/training/metrics-all", async (req, res) => {
  try {
    const metrics = await aiTrainingService.getAllModelMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === EVALUATION ROUTES ===

router.get("/evaluation/accuracy/:modelType", async (req, res) => {
  try {
    const { modelType } = req.params;
    const sampleSize = req.query.sampleSize || 100;
    const result = await aiEvaluationService.evaluateModelAccuracy(
      modelType,
      sampleSize
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/evaluation/optimization/:optimizationType", async (req, res) => {
  try {
    const { optimizationType } = req.params;
    const result = await aiEvaluationService.evaluateOptimizationQuality(
      optimizationType
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/evaluation/analysis/:analysisType", async (req, res) => {
  try {
    const { analysisType } = req.params;
    const result = await aiEvaluationService.evaluateAnalysisCompleteness(
      analysisType
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/evaluation/model-card/:modelType", async (req, res) => {
  try {
    const { modelType } = req.params;
    const report = await aiEvaluationService.generateModelCardReport(
      modelType
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/evaluation/benchmark/:modelType", async (req, res) => {
  try {
    const { modelType } = req.params;
    const { baselineMetrics } = req.body;

    const result = await aiEvaluationService.benchmarkAgainstBaseline(
      modelType,
      baselineMetrics
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/evaluation/end-to-end", async (req, res) => {
  try {
    const result = await aiEvaluationService.evaluateEndToEnd();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/evaluation/validate/:modelType", async (req, res) => {
  try {
    const { modelType } = req.params;
    const sampleSize = req.query.sampleSize || 50;
    const result = await aiEvaluationService.validateModelOutputs(
      modelType,
      sampleSize
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/evaluation/quality-report", async (req, res) => {
  try {
    const report = await aiEvaluationService.generateQualityReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === HEALTH & STATUS ===

router.get("/health", async (req, res) => {
  try {
    const status = await aiEvaluationService.evaluateEndToEnd();
    res.json({
      status: "healthy",
      modelsActive: 23,
      predictionsImplemented: status.predictionsImplemented,
      optimizationsImplemented: status.optimizationsImplemented,
      analysesImplemented: status.analysesImplemented,
      systemAccuracy: status.systemAccuracy,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
