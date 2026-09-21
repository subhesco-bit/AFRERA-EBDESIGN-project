/**
 * Real backend route for GDPRConsent.jsx's
 * privacyAPI.recordConsent(consentType, consentGiven), backed by
 * services/dual-use/gdprService.js's recordConsent(userId, consentType,
 * consentGiven, ipAddress, userAgent). userId/ipAddress/userAgent are
 * server-derived rather than trusted from the client.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/dual-use/gdprService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/privacy-settings/consent', async (req, res) => {
  try {
    const { consentType, consentGiven } = req.body;
    const data = await svc.recordConsent(req.user.id, consentType, consentGiven, req.ip, req.get('user-agent'));
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
