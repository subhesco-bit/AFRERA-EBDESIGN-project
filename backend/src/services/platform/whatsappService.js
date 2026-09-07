/**
 * WhatsApp Service — outbound template/text sends + inbound webhook.
 *
 * Strategy Card
 * Purpose:  Give the platform a real WhatsApp send/receive interface with
 *           template management, mirroring smsAuthService.js's mock-mode
 *           convention exactly so behaviour is predictable across both
 *           channels: real Twilio calls when credentials are configured,
 *           an honestly-logged mock send otherwise.
 * Actors:   any service that needs to notify a farmer/buyer over WhatsApp
 *           (system, server-side callers), Twilio (inbound webhook, system).
 * Decision: none — this is a delivery channel, not a decision-maker. What to
 *           send and to whom is the caller's decision.
 * Algorithm: template lookup (DB row if it exists, else a small built-in
 *           default set) + placeholder substitution ({{1}}, {{2}}, ... —
 *           Twilio's own WhatsApp template variable syntax) before send.
 * Data:     whatsapp_templates (id, template_name, language, components,
 *           status) and whatsapp_ai_integration (id, user_id, phone_number,
 *           message_id, template_name, template_data, status) — both
 *           pre-existing tables from migration 037_omnichannel_ai_schema.sql,
 *           reused here rather than duplicated.
 * AI role:  none.
 * Status:   real when TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM
 *           are configured; honest mock mode (logged, not silently dropped)
 *           otherwise — see isHealthy() and the twilioClient guard below,
 *           same shape as smsAuthService.js.
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { authMiddleware } = require('../../middleware/auth');
const { rateLimiter } = require('../../middleware/rateLimiter');

const TWILIO_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  // Twilio's WhatsApp sender is a distinct "whatsapp:+1415..." address, not
  // the plain SMS `fromNumber` smsAuthService.js uses — kept as its own env
  // var so a deployment can run SMS and WhatsApp from different numbers.
  fromWhatsApp: process.env.TWILIO_WHATSAPP_FROM
};

// Lazy SDK load, same rationale as smsAuthService.js: the twilio package
// costs real load time and this module already knows it won't use it when
// no credentials are present.
let twilioClient;
try {
  if (TWILIO_CONFIG.accountSid && TWILIO_CONFIG.authToken) {
    // eslint-disable-next-line global-require
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_CONFIG.accountSid, TWILIO_CONFIG.authToken);
  } else {
    logger.warn('Twilio credentials not configured, WhatsApp service will run in mock mode');
  }
} catch (error) {
  logger.error('Failed to initialize Twilio WhatsApp client', { error: error.message, stack: error.stack });
}

// Built-in fallback templates so sendTemplateMessage() works even before an
// operator has created any row in whatsapp_templates. {{1}}, {{2}}... match
// Twilio's own WhatsApp template variable syntax so callers use one format
// whether the template came from the DB or from here.
const DEFAULT_TEMPLATES = {
  order_confirmation: {
    language: 'en',
    body: 'Your AFRERA order {{1}} is confirmed. Expected delivery: {{2}}.'
  },
  price_alert: {
    language: 'en',
    body: 'Mandi price alert: {{1}} is now trading at Rs {{2}}/quintal in {{3}}.'
  },
  otp_verification: {
    language: 'en',
    body: 'Your AFRERA verification code is {{1}}. Valid for 10 minutes. Do not share this code.'
  }
};

function substitutePlaceholders(body, params = []) {
  return params.reduce((text, value, idx) => text.split(`{{${idx + 1}}}`).join(String(value)), body);
}

/** DB template if one exists, else the built-in default, else null. */
async function resolveTemplate(templateName) {
  const pg = getPostgreSQL();
  if (pg) {
    try {
      const res = await pg.query(
        `SELECT template_name, language, components FROM whatsapp_templates
          WHERE template_name = $1 AND status = 'active' LIMIT 1`,
        [templateName]
      );
      if (res.rows[0]) {
        const row = res.rows[0];
        const body = row.components?.body || row.components?.text || null;
        if (body) return { language: row.language || 'en', body, source: 'database' };
      }
    } catch (error) {
      logger.warn('whatsappService: template lookup failed, falling back to defaults', { error: error.message, templateName });
    }
  }
  const fallback = DEFAULT_TEMPLATES[templateName];
  return fallback ? { ...fallback, source: 'built-in' } : null;
}

async function createOrUpdateTemplate(templateName, { language = 'en', body }) {
  if (!templateName || !body) throw new Error('templateName and body are required');
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(
    `INSERT INTO whatsapp_templates (template_name, language, components, status)
     VALUES ($1, $2, $3, 'active')
     ON CONFLICT (template_name) DO UPDATE
       SET language = EXCLUDED.language, components = EXCLUDED.components, updated_at = NOW()
     RETURNING *`,
    [templateName, language, JSON.stringify({ body })]
  );
  return res.rows[0];
}

async function listTemplates() {
  const pg = getPostgreSQL();
  const dbTemplates = pg
    ? (await pg.query(`SELECT template_name, language, components, status, updated_at FROM whatsapp_templates ORDER BY template_name`)).rows
    : [];
  const dbNames = new Set(dbTemplates.map((t) => t.template_name));
  const builtIns = Object.entries(DEFAULT_TEMPLATES)
    .filter(([name]) => !dbNames.has(name))
    .map(([name, t]) => ({ template_name: name, language: t.language, components: { body: t.body }, status: 'active', source: 'built-in' }));
  return [...dbTemplates.map((t) => ({ ...t, source: 'database' })), ...builtIns];
}

/** Persist one outbound send attempt, whether real or mock. */
async function logMessage({ phoneNumber, messageId, templateName, templateData, status }) {
  const pg = getPostgreSQL();
  if (!pg) return null;
  try {
    const res = await pg.query(
      `INSERT INTO whatsapp_ai_integration (phone_number, message_id, template_name, template_data, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [phoneNumber, messageId || null, templateName || null, JSON.stringify(templateData || {}), status]
    );
    return res.rows[0].id;
  } catch (error) {
    logger.warn('whatsappService: failed to log message', { error: error.message });
    return null;
  }
}

/** Send a templated WhatsApp message. Real Twilio call when configured, honest mock log otherwise. */
async function sendTemplateMessage(phoneNumber, templateName, params = []) {
  if (!phoneNumber) throw new Error('phoneNumber is required');
  const template = await resolveTemplate(templateName);
  if (!template) throw new Error(`Unknown WhatsApp template: ${templateName}`);

  const body = substitutePlaceholders(template.body, params);
  const to = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;

  if (twilioClient && TWILIO_CONFIG.fromWhatsApp) {
    try {
      const message = await twilioClient.messages.create({ body, from: TWILIO_CONFIG.fromWhatsApp, to });
      await logMessage({ phoneNumber, messageId: message.sid, templateName, templateData: { params }, status: 'sent' });
      logger.info('WhatsApp template message sent', { phoneNumber, templateName, sid: message.sid });
      return { success: true, mode: 'live', messageId: message.sid, body };
    } catch (error) {
      await logMessage({ phoneNumber, templateName, templateData: { params }, status: 'failed' });
      logger.error('WhatsApp send failed', { error: error.message, phoneNumber, templateName });
      throw new Error('Failed to send WhatsApp message');
    }
  }

  await logMessage({ phoneNumber, templateName, templateData: { params }, status: 'mocked' });
  logger.info(`[MOCK MODE] WhatsApp message to ${phoneNumber}: ${body}`);
  return { success: true, mode: 'mock', body };
}

/** Free-form text send — only valid within Twilio's 24h session window in production, same caveat as any WhatsApp integration. */
async function sendMessage(phoneNumber, body) {
  if (!phoneNumber || !body) throw new Error('phoneNumber and body are required');
  const to = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;

  if (twilioClient && TWILIO_CONFIG.fromWhatsApp) {
    try {
      const message = await twilioClient.messages.create({ body, from: TWILIO_CONFIG.fromWhatsApp, to });
      await logMessage({ phoneNumber, messageId: message.sid, status: 'sent' });
      return { success: true, mode: 'live', messageId: message.sid };
    } catch (error) {
      await logMessage({ phoneNumber, status: 'failed' });
      logger.error('WhatsApp free-form send failed', { error: error.message, phoneNumber });
      throw new Error('Failed to send WhatsApp message');
    }
  }

  await logMessage({ phoneNumber, status: 'mocked' });
  logger.info(`[MOCK MODE] WhatsApp message to ${phoneNumber}: ${body}`);
  return { success: true, mode: 'mock' };
}

async function getMessageHistory(phoneNumber, limit = 50) {
  const pg = getPostgreSQL();
  if (!pg) return [];
  const res = await pg.query(
    `SELECT * FROM whatsapp_ai_integration WHERE phone_number = $1 ORDER BY created_at DESC LIMIT $2`,
    [phoneNumber, limit]
  );
  return res.rows;
}

function isHealthy() {
  return twilioClient !== undefined && Boolean(TWILIO_CONFIG.fromWhatsApp);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

router.get('/', (req, res) => {
  res.json({ success: true, data: { mode: isHealthy() ? 'live' : 'mock', configured: isHealthy() } });
});

router.get('/templates', async (req, res) => {
  try {
    const templates = await listTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error('whatsappService: list templates failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/templates', authMiddleware, async (req, res) => {
  try {
    const { template_name, language, body } = req.body || {};
    const template = await createOrUpdateTemplate(template_name, { language, body });
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    logger.error('whatsappService: create template failed', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/send', authMiddleware, rateLimiter, async (req, res) => {
  try {
    const { phone_number, template_name, params, body } = req.body || {};
    const result = template_name
      ? await sendTemplateMessage(phone_number, template_name, params || [])
      : await sendMessage(phone_number, body);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('whatsappService: send failed', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/messages/:phoneNumber', authMiddleware, async (req, res) => {
  try {
    const history = await getMessageHistory(req.params.phoneNumber, Math.min(Number(req.query.limit) || 50, 200));
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('whatsappService: message history failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Twilio's inbound webhook — no user session exists yet (it's Twilio calling
// us, not a logged-in user), so this cannot sit behind authMiddleware. Rate
// limiting is the appropriate control, matching smsAuthService.js's
// reasoning for its own unauthenticated auth endpoints.
router.post('/webhook', rateLimiter, async (req, res) => {
  try {
    const { From, Body, MessageSid } = req.body || {};
    if (From) {
      await logMessage({
        phoneNumber: String(From).replace(/^whatsapp:/, ''),
        messageId: MessageSid,
        templateData: { direction: 'inbound', body: Body },
        status: 'received'
      });
    }
    res.status(200).send('<Response></Response>');
  } catch (error) {
    logger.error('whatsappService: webhook handling failed', { error: error.message });
    res.status(200).send('<Response></Response>');
  }
});

module.exports = {
  router,
  sendTemplateMessage,
  sendMessage,
  createOrUpdateTemplate,
  listTemplates,
  getMessageHistory,
  isHealthy
};
