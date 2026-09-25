'use strict';

const crypto = require('crypto');
const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const voice = require('../services/voice/farmerVoiceAgentStack');

const router = express.Router();

function secureEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
}

function requireChannelAuth(req, res, next) {
  if (req.user) return next();
  const configured = process.env.IVR_WEBHOOK_SECRET;
  const supplied = req.get('x-ivr-webhook-secret');
  if (configured && secureEqual(configured, supplied)) {
    req.channelAuth = { type: 'webhook_secret' };
    return next();
  }
  return res.status(401).json({
    success: false,
    code: 'VOICE_CHANNEL_AUTH_REQUIRED',
    error: 'Authenticated user or configured IVR webhook secret required',
  });
}

router.get('/health', (_req, res) => {
  res.json({ success: true, service: 'farmer-voice-agent', data: voice.capabilityStatus() });
});

router.get('/menu/:language?', (req, res) => {
  res.json({ success: true, data: voice.menuFor(req.params.language || 'hi') });
});
router.use(optionalAuth);
router.use(requireChannelAuth);

router.post('/sessions', async (req, res) => {
  try {
    const data = await voice.startSession({
      callId: req.body?.callId || null,
      phoneNumber: req.body?.phoneNumber || null,
      userId: req.user?.id || req.body?.userId || null,
      channel: req.body?.channel || 'ivr',
      language: req.body?.language || 'hi',
      consent: req.body?.consent === true,
      metadata: req.body?.metadata || {},
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
});

router.post('/sessions/:sessionId/turns', async (req, res) => {
  try {
    const data = await voice.processTurn({
      sessionId: req.params.sessionId,
      inputType: req.body?.inputType || 'dtmf',
      input: req.body?.input,
      speechProvider: req.body?.speechProvider || 'google',
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, error: error.message, code: error.code || null });
  }
});

router.post('/sessions/:sessionId/handoff', async (req, res) => {
  try {
    const data = await voice.requestHandoff(req.params.sessionId, req.body?.reason || 'user_requested');
    return res.status(202).json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
});

module.exports = router;
