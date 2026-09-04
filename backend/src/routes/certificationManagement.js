const router = require('express').Router();
const certService = require('../services/certificationManagementService');
const auth = require('../middleware/auth');

router.post('/certifications/issue/:entityId/:type', auth, async (req, res) => {
  try {
    const result = await certService.issueCertificate(req.params.entityId, req.params.type);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
