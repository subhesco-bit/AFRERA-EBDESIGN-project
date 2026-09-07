const router = require('express').Router();
const arService = require('../services/arService');
const auth = require('../middleware/auth');
router.post('/ar/:productId/create', auth, async (req, res) => {
  try { const result = await arService.createARExperience(req.params.productId, req.body); res.json(result); }
  catch (error) { res.status(500).json({ error: error.message }); }
});
module.exports = router;
