const express = require("express");
const router = express.Router();
const infraMonitoringService = require("../services/infrastructureMonitoringService");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/datadog/config", async (req, res) => {
  try {
    const config = await infraMonitoringService.initializeDatadogIntegration();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/metrics", async (req, res) => {
  try {
    const metrics = await infraMonitoringService.collectMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/alerts", async (req, res) => {
  try {
    const alert = await infraMonitoringService.createAlert(req.body);
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const data = await infraMonitoringService.getDashboardData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
