const router = require('express').Router();
const iotService = require('../services/iotSensorsService');
const auth = require('../middleware/auth');

router.post('/iot/sensors/:sensorId/reading', auth, async (req, res) => {
  try {
    const result = await iotService.recordSensorData(req.params.sensorId, req.body.reading);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
