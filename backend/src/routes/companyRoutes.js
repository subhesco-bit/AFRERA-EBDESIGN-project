/**
 * Company Routes — lookup endpoints for ERP accounting modules.
 *
 * Provides REST API access to companies, fiscal years, and chart of accounts
 * so that accounting UI pages (AF-AA, AF-CO, AF-PS) can offer dropdowns
 * instead of requiring manual ID entry.
 */

const express = require('express');
const { listCompanies, getCompanyById, getFiscalYears, getChartOfAccounts } = require('../services/companyService');
const { authMiddleware } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/v1/companies
 * List all active companies.
 */
router.get('/', async (req, res, next) => {
  try {
    const companies = await listCompanies();
    res.json({ success: true, data: companies });
  } catch (error) {
    logger.error('companyRoutes:listCompanies', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/companies/:id
 * Get a single company by ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const company = await getCompanyById(req.params.id);
    res.json({ success: true, data: company });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    logger.error('companyRoutes:getCompanyById', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/companies/:id/fiscal-years
 * Get fiscal years for a company.
 */
router.get('/:id/fiscal-years', async (req, res, next) => {
  try {
    const fiscalYears = await getFiscalYears(req.params.id);
    res.json({ success: true, data: fiscalYears });
  } catch (error) {
    logger.error('companyRoutes:getFiscalYears', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/companies/:id/chart-of-accounts
 * Get chart of accounts for a company (postable accounts only).
 */
router.get('/:id/chart-of-accounts', async (req, res, next) => {
  try {
    const chartOfAccounts = await getChartOfAccounts(req.params.id);
    res.json({ success: true, data: chartOfAccounts });
  } catch (error) {
    logger.error('companyRoutes:getChartOfAccounts', { error: error.message });
    next(error);
  }
});

module.exports = router;
