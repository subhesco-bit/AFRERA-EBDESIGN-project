/**
 * Loan Management Routes
 */

const express = require('express');
const router = express.Router();
const loanManagementService = require('../services/loanManagementService');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');

router.post('/loans/apply',
  authenticateToken,
  validateRequest({
    body: {
      amount: 'number|required',
      purpose: 'string|required',
      tenure_months: 'number',
      interest_rate: 'number'
    }
  }),
  async (req, res, next) => {
    try {
      const result = await loanManagementService.createLoanApplication(req.user.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error(`Create loan error: ${error.message}`);
      next(error);
    }
  }
);

router.get('/loans/:id', authenticateToken, async (req, res, next) => {
  try {
    let result = await loanManagementService.getLoanStatus(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Get loan error: ${error.message}`);
    next(error);
  }
});

router.post('/admin/loans/:id/approve',
  authenticateToken,
  authorize(['admin']),
  validateRequest({ body: { admin_notes: 'string' } }),
  async (req, res, next) => {
    try {
      let result = await loanManagementService.approveLoan(req.params.id, req.body.admin_notes);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error(`Approve loan error: ${error.message}`);
      next(error);
    }
  }
);

router.post('/loans/:id/disburse', authenticateToken, authorize(['admin']), async (req, res, next) => {
  try {
    let result = await loanManagementService.disburseLoan(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Disburse loan error: ${error.message}`);
    next(error);
  }
});

router.get('/loans/:id/payments', authenticateToken, async (req, res, next) => {
  try {
    let result = await loanManagementService.trackRepayment(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Track repayment error: ${error.message}`);
    next(error);
  }
});

module.exports = router;
