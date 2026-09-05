'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const service = require('../services/aiApprovalService');

router.use(authMiddleware);

router.post('/proposals', async (req, res) => {
  try {
    const proposal = await service.createProposal({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/proposals', async (req, res) => {
  try {
    const proposals = await service.listProposals({ user: req.user, status: req.query.status, domain: req.query.domain });
    res.json({ success: true, data: proposals });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Unable to load AI proposals' });
  }
});

router.post('/proposals/:id/decision', async (req, res) => {
  try {
    let proposal = await service.decideProposal({ proposalId: req.params.id, user: req.user, ...req.body });
    res.json({ success: true, data: proposal });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/proposals/:id/execute', async (req, res) => {
  try {
    let proposal = await service.executeProposal({ proposalId: req.params.id, user: req.user });
    res.json({ success: true, data: proposal });
  } catch (error) {
    res.status(403).json({ success: false, error: error.message });
  }
});

module.exports = router;
