const router = require('express').Router();
const financialAnalyticsService = require('../services/financialAnalyticsService');
const auth = require('../middleware/auth');

router.post('/users/:userId/financial/statement', auth, async (req, res) => {
  try {
    const result = await financialAnalyticsService.generateFinancialStatement(req.params.userId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
