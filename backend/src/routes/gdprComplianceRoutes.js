const express = require("express");
const router = express.Router();
const gdprService = require("../services/gdprComplianceService");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/data-inventory", async (req, res) => {
  try {
    const inventory = await gdprService.createDataInventory(req.user.id);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/consent", async (req, res) => {
  try {
    const consent = await gdprService.recordConsent(req.user.id, req.body);
    res.json(consent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/export", async (req, res) => {
  try {
    const data = await gdprService.exportUserData(req.user.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/delete", async (req, res) => {
  try {
    const result = await gdprService.rightToBeForgotten(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
