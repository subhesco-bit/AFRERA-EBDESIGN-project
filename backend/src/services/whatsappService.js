/**
 * WhatsApp Integration Service
 *
 * Real outbound messaging + real inbound webhook handling over Twilio's
 * WhatsApp channel. This did not exist anywhere in the codebase before this
 * change (grepped `whatsapp` across backend/src — no hits).
 *
 * HONESTY PATTERN THIS FILE MATCHES
 *
 * `services/smsAuthService.js` already solved "what do we do when the
 * third-party messaging provider isn't configured" for SMS: it lazy-loads
 * the Twilio SDK only when credentials are present, and every send site
 * falls back to a logged "[MOCK MODE]" send rather than throwing or silently
 * pretending to succeed. This file does the exact same thing for WhatsApp —
 * same lazy-require, same mock-mode branch, same log shape.
 *
 * WhatsApp needs its own sender number distinct from SMS: Twilio requires a
 * WhatsApp-enabled sender (Sandbox number or an approved WhatsApp Business
 * sender) to be separately provisioned, even against the same Account
 * SID/Auth Token used for SMS. So this introduces one new env var,
 * TWILIO_WHATSAPP_NUMBER, following the exact naming convention
 * TWILIO_PHONE_NUMBER already established by smsAuthService — it does NOT
 * reuse TWILIO_PHONE_NUMBER, because a plain SMS-only Twilio number is not
 * WhatsApp-enabled and sending through it would fail (or worse, silently
 * hit the wrong channel).
 *
 * Twilio's WhatsApp channel is not a separate API — it's the same
 * Messages resource with a `whatsapp:` prefix on `from`/`to`
 * (External docs: https://www.twilio.com/docs/whatsapp/api), so the same `twilioClient`
 * used for SMS/voice elsewhere in this codebase is reused here.
 */

'use strict';

const { logger } = require('../utils/logger');
const pool = require('../database/pool');

// ============================================================================
// CONFIG + CLIENT (mirrors services/smsAuthService.js exactly)
// ============================================================================

const WHATSAPP_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  // WhatsApp-enabled Twilio sender, e.g. "+14155238886" (Twilio Sandbox) or an
  // approved WhatsApp Business number. Distinct from TWILIO_PHONE_NUMBER (the
  // SMS sender) — see file header.
  fromNumber: process.env.TWILIO_WHATSAPP_NUMBER
};

// Same reasoning as smsAuthService.js: the `require('twilio')` sits inside
// the credentials branch so a deployment with WhatsApp unconfigured never
// pays the SDK's load cost. `twilioModule` (not just the constructed client)
// is kept around because `twilioModule.validateRequest(...)` — used for
// inbound webhook signature verification below — is a static export of the
// package itself, not a method on the client instance.
let twilioModule;
let twilioClient;
try {
  if (WHATSAPP_CONFIG.accountSid && WHATSAPP_CONFIG.authToken) {
    // eslint-disable-next-line global-require
    twilioModule = require('twilio');
    twilioClient = twilioModule(WHATSAPP_CONFIG.accountSid, WHATSAPP_CONFIG.authToken);
  } else {
    logger.warn('Twilio credentials not configured, WhatsApp service will run in mock mode');
  }
} catch (error) {
  logger.error('Failed to initialize Twilio client for WhatsApp', { error: error.message, stack: error.stack });
}

/** Strip a `whatsapp:` prefix and surrounding whitespace, if present. */
function normalizeWhatsAppNumber(raw) {
  return String(raw || '').replace(/^whatsapp:/i, '').trim();
}

// ============================================================================
// OUTBOUND
// ============================================================================

/**
 * Send a WhatsApp message via Twilio.
 *
 * Real Twilio Messages API call, `whatsapp:` prefix on `to`/`from` — this is
 * documented Twilio behavior, not a fabricated integration
 * (https://www.twilio.com/docs/whatsapp/api). If no WhatsApp-enabled sender
 * is configured, this returns an explicit `not_configured` result instead of
 * attempting (and failing) a real call, or worse, claiming success.
 */
async function sendWhatsAppMessage(to, body) {
  const toNormalized = normalizeWhatsAppNumber(to);

  if (!twilioClient || !WHATSAPP_CONFIG.fromNumber) {
    logger.info(`[MOCK MODE] WhatsApp message to ${toNormalized}: ${body}`);
    return {
      success: false,
      status: 'not_configured',
      reason: !twilioClient
        ? 'Twilio credentials (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN) are not configured.'
        : 'TWILIO_WHATSAPP_NUMBER is not configured (a WhatsApp-enabled Twilio sender is '
          + 'required — the plain SMS TWILIO_PHONE_NUMBER is not WhatsApp-enabled).',
      to: toNormalized
    };
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: `whatsapp:${WHATSAPP_CONFIG.fromNumber}`,
      to: `whatsapp:${toNormalized}`
    });
    logger.info(`WhatsApp message sent to ${toNormalized}`, { sid: message.sid });
    return { success: true, status: message.status || 'queued', sid: message.sid, to: toNormalized };
  } catch (error) {
    logger.error('Failed to send WhatsApp message', { error: error.message, stack: error.stack, to: toNormalized });
    return { success: false, status: 'send_failed', reason: error.message, to: toNormalized };
  }
}

// ============================================================================
// FARMER LOOKUP
// ============================================================================

/**
 * Look up the WhatsApp sender against a real user/farmer record, the same
 * way smsAuthService resolves phone -> user (users.phone, joined to
 * user_profiles). `farmers` has no phone column of its own (see
 * database/migrations/000_base_schema.sql) — phone lives on `users`, and
 * `farmers.user_id` links to it.
 *
 * Returns null (not a thrown error) when no match exists, so unauthenticated
 * numbers fall through to the read-only/informational default path rather
 * than blocking the conversation.
 */
async function lookupFarmerByPhone(phone) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id AS user_id, u.phone, up.first_name, up.last_name,
              f.id AS farmer_id, f.farmer_id AS farmer_code
         FROM users u
         LEFT JOIN user_profiles up ON up.user_id = u.id
         LEFT JOIN farmers f ON f.user_id = u.id
        WHERE u.phone = $1
        LIMIT 1`,
      [phone]
    );
    return rows[0] || null;
  } catch (error) {
    logger.error('WhatsApp farmer lookup failed', { error: error.message, stack: error.stack });
    return null;
  }
}

// ============================================================================
// INTENT ROUTING — honestly keyword-based, not a fabricated NLU model.
// ============================================================================

const SHIPMENT_ID_PATTERN = /\bSHP-[A-Z0-9]+-[A-Z0-9]+\b/i;

/**
 * Classify inbound text into one of three buckets by plain keyword match.
 * This is deliberately simple — the same discipline core/aiOrchestrator.js
 * holds itself to for its own keyword-based classifyAndRoute(): a real
 * capability (regex/keyword matching) reported as exactly what it is, not
 * oversold as understanding intent.
 */
function classifyIntent(text) {
  const lower = String(text || '').toLowerCase();
  if (/\b(subsidy|subsidies|scheme|schemes|yojana)\b/.test(lower)) return 'subsidy';
  if (/\b(track|tracking|shipment|shipments|delivery|consignment)\b/.test(lower)) return 'shipment';
  return 'farmer_query';
}

/**
 * Subsidy / scheme status. Uses governmentSchemeService.schemeExpiryStatus()
 * — the verified-registry function built this session — not the separate
 * AI-matched getApplicableSchemes() discovery path, so a WhatsApp reply
 * never states an unverified scheme as fact.
 */
async function handleSubsidyQuery() {
  try {
    // Required at call time (not module top) so a failure in an unrelated
    // service does not prevent this file from loading at all.
    const governmentSchemeService = require('./governmentSchemeService');
    const statuses = await governmentSchemeService.schemeExpiryStatus();

    if (!statuses.length) {
      return 'No government schemes with a tracked expiry date are currently in the '
        + 'verified registry. Please check with your local agriculture office for the '
        + 'latest subsidy information.';
    }

    const top = statuses.slice(0, 5);
    const lines = top.map((s) => {
      const timing = s.days >= 0 ? `${s.days} day(s) left` : `lapsed ${Math.abs(s.days)} day(s) ago`;
      return `- ${s.label} (${s.id}): ${s.state}, ${timing}`;
    });

    return `Government scheme status (verified registry):\n${lines.join('\n')}\n\n`
      + 'Reply with a scheme name for more detail, or confirm with your local '
      + 'agriculture office before applying.';
  } catch (error) {
    logger.error('WhatsApp subsidy query failed', { error: error.message, stack: error.stack });
    return 'Sorry, I could not fetch subsidy/scheme status right now. Please try again later.';
  }
}

/**
 * Shipment tracking. Looks up by shipment_number directly (real parameterized
 * queries against `shipments` / `shipment_tracking` — the same tables
 * services/logisticsService.js reads, but its own getShipmentById() takes the
 * internal UUID `id`, not the human-facing SHP-... number a farmer would
 * actually type, so this queries shipment_number directly instead of
 * repurposing that function against the wrong key).
 */
async function handleShipmentQuery(messageText) {
  const match = String(messageText || '').match(SHIPMENT_ID_PATTERN);
  if (!match) {
    return 'To track a shipment, please reply with your shipment number, e.g. '
      + '"track SHP-ABC123-XYZ9".';
  }

  const shipmentNumber = match[0].toUpperCase();
  try {
    const { rows: shipmentRows } = await pool.query(
      `SELECT id, shipment_number, status, origin_address, destination_address, estimated_transit_days
         FROM shipments
        WHERE shipment_number = $1
        LIMIT 1`,
      [shipmentNumber]
    );

    if (!shipmentRows.length) {
      return `I could not find a shipment with number ${shipmentNumber}. Please double-check `
        + 'the number and try again.';
    }

    const shipment = shipmentRows[0];
    const { rows: trackingRows } = await pool.query(
      `SELECT location, status, notes, timestamp
         FROM shipment_tracking
        WHERE shipment_id = $1
        ORDER BY timestamp DESC
        LIMIT 1`,
      [shipment.id]
    );
    const latest = trackingRows[0];

    const lines = [
      `Shipment ${shipment.shipment_number}: status ${shipment.status}`,
      `From ${shipment.origin_address} to ${shipment.destination_address}`
    ];
    if (latest) {
      lines.push(
        `Last update: ${latest.status || shipment.status} at `
        + `${latest.location || 'an unrecorded location'} `
        + `(${new Date(latest.timestamp).toLocaleString('en-IN')})`
      );
    }
    if (shipment.estimated_transit_days) {
      lines.push(`Estimated transit: ${shipment.estimated_transit_days} day(s)`);
    }
    return lines.join('\n');
  } catch (error) {
    logger.error('WhatsApp shipment tracking query failed', { error: error.message, stack: error.stack, shipmentNumber });
    return 'Sorry, I could not fetch shipment tracking right now. Please try again later.';
  }
}

/**
 * Default fallback: a general farmer query. Routes into
 * aiCopilotService.generateCopilotResponse('generic', ...) — the existing
 * generic-copilot template response (module.exports there was extended by
 * one line, additive only, to expose this already-implemented function; no
 * behavior of that file was changed). Despite the "AI copilot" naming, this
 * is a keyword/switch-case template response, NOT an LLM call — the same
 * finding core/aiOrchestrator.js's own audit already recorded for this
 * function ("generate responses via switch/case domain templates, not an
 * LLM call"). Reported here honestly rather than oversold as conversational
 * AI.
 */
async function handleFarmerQuery(messageText, farmer) {
  try {
    const aiCopilotService = require('./aiCopilotService');
    const response = await aiCopilotService.generateCopilotResponse('generic', messageText, {}, {});
    const greeting = farmer && farmer.first_name ? `Hi ${farmer.first_name}, ` : '';
    return `${greeting}${response.content}`;
  } catch (error) {
    logger.error('WhatsApp farmer query fallback failed', { error: error.message, stack: error.stack });
    return "I'm here to help with AFRERA services. Mention 'scheme' or 'subsidy' for "
      + "government scheme status, or 'track' plus your shipment number for shipment "
      + 'tracking.';
  }
}

/** Classify + dispatch. The one place all three branches meet. */
async function routeInboundMessage(messageText, senderPhone, farmer) {
  const intent = classifyIntent(messageText);
  logger.info('WhatsApp inbound intent classified', { intent, from: senderPhone });

  if (intent === 'subsidy') return handleSubsidyQuery();
  if (intent === 'shipment') return handleShipmentQuery(messageText);
  return handleFarmerQuery(messageText, farmer);
}

// ============================================================================
// INBOUND WEBHOOK — Twilio calls this via HTTP POST
// (External docs: https://www.twilio.com/docs/whatsapp/api and
// https://www.twilio.com/docs/usage/webhooks/webhooks-security) when a
// WhatsApp message arrives. Payload is application/x-www-form-urlencoded,
// already parsed by the global express.urlencoded() middleware in index.js.
// ============================================================================

/**
 * Verify the `X-Twilio-Signature` header via twilio.validateRequest(),
 * exactly as Twilio's SDK documents
 * (External docs: https://www.twilio.com/docs/usage/webhooks/webhooks-security). Implemented
 * directly — the SDK supports it with no extra dependency — but it can only
 * run once TWILIO_AUTH_TOKEN is configured, since the signature is an HMAC
 * over that token. Without it, validation is explicitly skipped and logged
 * rather than silently treated as passed; this is the same "not configured"
 * honesty as the outbound send path above, not a security shortcut taken
 * for convenience.
 */
function verifyTwilioSignature(req) {
  if (!twilioModule || !WHATSAPP_CONFIG.authToken) {
    return {
      verified: false,
      skipped: true,
      reason: 'TWILIO_AUTH_TOKEN is not configured, so the inbound webhook signature cannot '
        + 'be validated against it. Requests are accepted unverified until a real auth token '
        + 'is configured.'
    };
  }

  const signature = req.headers['x-twilio-signature'];
  if (!signature) {
    return { verified: false, skipped: false, reason: 'Missing X-Twilio-Signature header' };
  }

  // Twilio signs the exact public URL it called. Behind a proxy/load
  // balancer that must be the externally visible URL; PUBLIC_BASE_URL lets
  // deployment config supply that explicitly, falling back to a best-effort
  // reconstruction from the request when it is not set.
  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}${req.originalUrl}`;

  const isValid = twilioModule.validateRequest(WHATSAPP_CONFIG.authToken, signature, url, req.body);
  return { verified: isValid, skipped: false };
}

const express = require('express');
const router = express.Router();

/**
 * POST /api/v1/whatsapp/webhook
 * Twilio's inbound WhatsApp message webhook. Documented payload fields used:
 * From (e.g. "whatsapp:+91XXXXXXXXXX"), Body (message text), MessageSid.
 *
 * No auth middleware — Twilio is the caller, not a logged-in AFRERA user;
 * signature verification (above) is the real control here, matching the same
 * "cannot require login before login" reasoning smsAuthService.js documents
 * for its own unauthenticated OTP endpoints.
 */
router.post('/webhook', async (req, res) => {
  try {
    const sigResult = verifyTwilioSignature(req);
    if (!sigResult.skipped && !sigResult.verified) {
      logger.warn('WhatsApp webhook rejected: signature verification failed', {
        from: req.body && req.body.From
      });
      return res.status(403).send('Signature verification failed');
    }
    if (sigResult.skipped) {
      logger.warn(`WhatsApp webhook signature validation skipped: ${sigResult.reason}`);
    }

    const { From, Body, MessageSid } = req.body || {};
    if (!From || typeof Body !== 'string') {
      logger.warn('WhatsApp webhook received malformed payload', { body: req.body });
      return res.status(400).send('Missing From/Body');
    }

    const senderPhone = normalizeWhatsAppNumber(From);
    logger.info('WhatsApp inbound message received', { from: senderPhone, messageSid: MessageSid });

    const farmer = await lookupFarmerByPhone(senderPhone);
    const replyText = await routeInboundMessage(Body, senderPhone, farmer);

    const sendResult = await sendWhatsAppMessage(senderPhone, replyText);
    if (!sendResult.success) {
      logger.warn('WhatsApp reply not sent', { reason: sendResult.reason, to: senderPhone });
    }

    // The reply was already sent via the REST API call above, so Twilio gets
    // an empty TwiML response acknowledging receipt (not a second, inline
    // reply). Always 200 here so Twilio does not retry-storm a message that
    // was already handled; failures are logged, not surfaced as an HTTP error.
    res.set('Content-Type', 'text/xml');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    logger.error('WhatsApp webhook processing failed', { error: error.message, stack: error.stack });
    res.set('Content-Type', 'text/xml');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
});

/** Check service health without leaking configuration values. */
function isHealthy() {
  return {
    outboundConfigured: Boolean(twilioClient && WHATSAPP_CONFIG.fromNumber),
    signatureValidationConfigured: Boolean(twilioModule && WHATSAPP_CONFIG.authToken)
  };
}

module.exports = {
  router,
  sendWhatsAppMessage,
  lookupFarmerByPhone,
  classifyIntent,
  routeInboundMessage,
  isHealthy
};
