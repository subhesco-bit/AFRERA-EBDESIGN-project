const router = require('express').Router();
const greenhouseService = require('../services/greenhouseService');
const auth = require('../middleware/auth');

router.post('/greenhouses', auth, async (req, res) => {
  try {
    const result = await greenhouseService.createGreenhouse(req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
