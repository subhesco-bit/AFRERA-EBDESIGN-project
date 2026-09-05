const router = require('express').Router();
const vrService = require('../services/vrService');
const auth = require('../middleware/auth');
router.post('/vr/space/create', auth, async (req, res) => {
  try { const result = await vrService.createVRSpace(req.body); res.json(result); }
  catch (error) { res.status(500).json({ error: error.message }); }
});
module.exports = router;
