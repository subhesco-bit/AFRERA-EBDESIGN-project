/**
 * Real backend routes for MFASetup.jsx, backed by services/mfaService.js.
 * setup -> generateSecret(userId, accountLabel), verify -> verifyLogin
 * (name/shape differences).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/mfaService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.post('/mfa/setup', wrap((req) => svc.generateSecret(req.user.id, req.user.email)));
router.post('/mfa/verify', wrap((req) => svc.verifyLogin(req.body.userId, req.body.token)));

module.exports = router;
