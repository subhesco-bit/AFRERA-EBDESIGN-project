'use strict';

const crypto = require('crypto');
const pool = require('../../database/pool');
const voiceIntent = require('../advancedVoiceAI');
const aiOrchestrator = require('../../core/aiOrchestrator');

const LANGUAGES = Object.freeze({
  en: { name: 'English', speechCode: 'en-IN', threshold: 0.72 },
  hi: { name: 'Hindi', speechCode: 'hi-IN', threshold: 0.68 },
  as: { name: 'Assamese', speechCode: 'as-IN', threshold: 0.62 },
  bn: { name: 'Bengali', speechCode: 'bn-IN', threshold: 0.64 },
});

const DTMF = Object.freeze({
  '1': 'price_inquiry',
  '2': 'weather_inquiry',
  '3': 'crop_advice',
  '4': 'subsidy_inquiry',
  '5': 'order_status',
  '6': 'payment_inquiry',
  '0': 'human_handoff',
  '9': 'repeat_menu',
});

const INTENT_ROUTE = Object.freeze({
  price_inquiry: { domain: 'market', capability: 'observed_market_price', mode: 'read_only' },
  weather_inquiry: { domain: 'weather', capability: 'weather_advisory', mode: 'read_only' },
  crop_advice: { domain: 'agro', capability: 'crop_advisory', mode: 'read_only' },
  soil_health: { domain: 'agro', capability: 'soil_health', mode: 'read_only' },
  selling_intent: { domain: 'commerce', capability: 'sell_flow', mode: 'human_confirmation' },
  buying_intent: { domain: 'commerce', capability: 'buy_flow', mode: 'human_confirmation' },
  order_status: { domain: 'commerce', capability: 'order_status', mode: 'read_only' },
  payment_inquiry: { domain: 'finance', capability: 'payment_status', mode: 'read_only' },
  account_inquiry: { domain: 'finance', capability: 'account_read', mode: 'read_only' },
  loan_inquiry: { domain: 'finance', capability: 'loan_information', mode: 'human_review' },
  subsidy_inquiry: { domain: 'schemes', capability: 'scheme_information', mode: 'human_review' },
  insurance_inquiry: { domain: 'insurance', capability: 'insurance_information', mode: 'human_review' },
  problem_report: { domain: 'support', capability: 'case_intake', mode: 'human_confirmation' },
  help_request: { domain: 'support', capability: 'guided_help', mode: 'read_only' },
  general: { domain: 'support', capability: 'clarify', mode: 'read_only' },
});

const HIGH_RISK = new Set(['loan_inquiry', 'subsidy_inquiry', 'insurance_inquiry']);

const MENU_TEXT = Object.freeze({
  en: 'Press 1 for crop price, 2 for weather, 3 for farming help, 4 for government schemes, 5 for order status, 6 for payment status, or 0 for a person.',
  hi: 'फसल भाव के लिए 1, मौसम के लिए 2, खेती सहायता के लिए 3, सरकारी योजना के लिए 4, ऑर्डर के लिए 5, भुगतान के लिए 6, और व्यक्ति से बात करने के लिए 0 दबाएँ।',
  as: 'শস্যৰ দামৰ বাবে 1, বতৰৰ বাবে 2, খেতিৰ সহায়ৰ বাবে 3, চৰকাৰী আঁচনিৰ বাবে 4, অর্ডাৰৰ বাবে 5, পেমেণ্টৰ বাবে 6, মানুহৰ লগত কথা পাতিবলৈ 0 টিপক।',
  bn: 'ফসলের দামের জন্য 1, আবহাওয়ার জন্য 2, চাষের সহায়তার জন্য 3, সরকারি প্রকল্পের জন্য 4, অর্ডারের জন্য 5, পেমেন্টের জন্য 6, মানুষের সাথে কথা বলতে 0 চাপুন।',
});

function languageConfig(language) {
  return LANGUAGES[language] || LANGUAGES.hi;
}

function menuFor(language = 'hi') {
  return { language: LANGUAGES[language] ? language : 'hi', text: MENU_TEXT[language] || MENU_TEXT.hi, dtmf: DTMF };
}

function safePhoneHash(phoneNumber) {
  if (!phoneNumber) return null;
  return crypto.createHash('sha256').update(String(phoneNumber)).digest('hex');
}

function routeForIntent(intent) {
  return INTENT_ROUTE[intent] || INTENT_ROUTE.general;
}
function classifyText(text, language = 'hi', history = []) {
  const result = voiceIntent.detectIntentWithContext(String(text || ''), language, history);
  const threshold = languageConfig(language).threshold;
  return {
    ...result,
    accepted: Number(result.confidence || 0) >= threshold,
    threshold,
  };
}

function buildDispatch(intent, entities = {}) {
  const route = routeForIntent(intent);
  return {
    ...route,
    intent,
    entities,
    autonomousMutationAllowed: false,
    requiresHumanReview: HIGH_RISK.has(intent) || route.mode !== 'read_only',
    authority: route.mode === 'read_only' ? 'CHANNEL_ROUTER_ONLY' : 'PROPOSAL_OR_CONFIRMATION_ONLY',
  };
}

function plainResponse(intent, language = 'hi') {
  const generic = {
    en: 'I understood your request. I will use the platform service for this. I will not make a payment, loan, insurance, or government-scheme decision for you.',
    hi: 'मैंने आपकी बात समझी। मैं इसके लिए प्लेटफॉर्म की सही सेवा का उपयोग करूंगा। आपकी अनुमति के बिना भुगतान, कर्ज, बीमा या सरकारी योजना का निर्णय नहीं होगा।',
    as: 'আপোনাৰ কথা বুজিছোঁ। সঠিক প্লেটফৰ্ম সেৱালৈ আগবঢ়াম। আপোনাৰ অনুমতি নোহোৱাকৈ পেমেণ্ট, ঋণ, বীমা বা আঁচনিৰ সিদ্ধান্ত নহয়।',
    bn: 'আপনার কথা বুঝেছি। সঠিক প্ল্যাটফর্ম সেবায় পাঠাব। আপনার অনুমতি ছাড়া পেমেন্ট, ঋণ, বীমা বা সরকারি প্রকল্পের সিদ্ধান্ত হবে না।',
  };
  if (intent === 'human_handoff') {
    return language === 'en' ? 'I will connect you to a person.' : 'मैं आपको किसी व्यक्ति से जोड़ रहा हूँ।';
  }
  return generic[language] || generic.hi;
}

async function persistSession(session) {
  await pool.query(
    `INSERT INTO voice_agent_sessions
       (session_id, call_id, phone_hash, user_id, channel, language, state, consent_at, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
     ON CONFLICT (session_id) DO NOTHING`,
    [session.sessionId, session.callId, session.phoneHash, session.userId, session.channel,
      session.language, session.state, session.consentAt, JSON.stringify(session.metadata || {})],
  );
  return session;
}
async function startSession({ callId = null, phoneNumber = null, userId = null, channel = 'ivr', language = 'hi', consent = false, metadata = {} } = {}) {
  const selectedLanguage = LANGUAGES[language] ? language : 'hi';
  const session = {
    sessionId: crypto.randomUUID(),
    callId,
    phoneHash: safePhoneHash(phoneNumber),
    userId,
    channel,
    language: selectedLanguage,
    state: consent ? 'menu' : 'consent_required',
    consentAt: consent ? new Date().toISOString() : null,
    metadata,
  };
  await persistSession(session);
  return {
    ...session,
    phoneHash: session.phoneHash ? session.phoneHash.slice(0, 12) + '…' : null,
    prompt: consent
      ? menuFor(selectedLanguage).text
      : (selectedLanguage === 'en' ? 'To continue, say yes or press 1. You can ask for a person at any time.'
        : 'जारी रखने के लिए हाँ कहें या 1 दबाएँ। आप कभी भी किसी व्यक्ति से बात करने के लिए कह सकते हैं।'),
  };
}

async function sessionRow(sessionId) {
  const result = await pool.query('SELECT * FROM voice_agent_sessions WHERE session_id=$1', [sessionId]);
  if (!result.rows.length) {
    const error = new Error('Voice session not found');
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
}

async function recordTurn(sessionId, turn) {
  await pool.query(
    `INSERT INTO voice_agent_turns
       (session_id,input_type,input_text,intent,confidence,response_text,dispatch,provider_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
    [sessionId, turn.inputType, turn.inputText || null, turn.intent || null, turn.confidence ?? null,
      turn.responseText, JSON.stringify(turn.dispatch || {}), turn.providerStatus || null],
  );
}

async function requestHandoff(sessionId, reason = 'user_requested') {
  await pool.query('UPDATE voice_agent_sessions SET state=$2,handoff_requested=TRUE,updated_at=NOW() WHERE session_id=$1', [sessionId, 'handoff']);
  await pool.query(
    `INSERT INTO voice_agent_handoffs(session_id,reason,status)
     VALUES ($1,$2,'queued')`,
    [sessionId, reason],
  );
  return { sessionId, handoff: true, status: 'queued', reason };
}
async function processTurn({ sessionId, inputType = 'dtmf', input, speechProvider = 'google' } = {}) {
  const session = await sessionRow(sessionId);
  const language = session.language || 'hi';
  let normalizedInput = input;
  let providerStatus = null;

  if (inputType === 'speech') {
    const speech = await aiOrchestrator.callSpeechProvider(
      speechProvider, 'transcribe', input, { language: languageConfig(language).speechCode },
    );
    providerStatus = speech.status;
    if (!speech.ok || !speech.text) {
      const responseText = (language === 'en'
        ? 'Voice recognition is not available right now. Please use the keypad, or press 0 for a person. '
        : 'अभी आवाज़ पहचान उपलब्ध नहीं है। कृपया फोन के बटन दबाएँ, या व्यक्ति से बात करने के लिए 0 दबाएँ। ') + menuFor(language).text;
      const turn = { inputType, inputText: null, intent: 'speech_unavailable', confidence: 0, responseText,
        dispatch: { mode: 'dtmf_fallback', autonomousMutationAllowed: false }, providerStatus };
      await recordTurn(sessionId, turn);
      return { ...turn, menu: menuFor(language), handoffAvailable: true };
    }
    normalizedInput = speech.text;
  }

  if (inputType === 'dtmf') {
    const intent = DTMF[String(normalizedInput || '')];
    if (!intent) {
      const responseText = menuFor(language).text;
      await recordTurn(sessionId, { inputType, inputText: String(normalizedInput || ''), intent: 'invalid_dtmf',
        confidence: 0, responseText, dispatch: { mode: 'repeat_menu' }, providerStatus });
      return { intent: 'invalid_dtmf', responseText, menu: menuFor(language), handoffAvailable: true };
    }
    if (intent === 'human_handoff') {
      const handoff = await requestHandoff(sessionId, 'dtmf_0');
      return { intent, responseText: plainResponse(intent, language), handoff };
    }
    if (intent === 'repeat_menu') return { intent, responseText: menuFor(language).text, menu: menuFor(language) };
    const dispatch = buildDispatch(intent);
    const responseText = plainResponse(intent, language);
    await recordTurn(sessionId, { inputType, inputText: String(normalizedInput), intent, confidence: 1, responseText, dispatch, providerStatus });
    return { intent, confidence: 1, responseText, dispatch, handoffAvailable: true };
  }

  const classified = classifyText(String(normalizedInput || ''), language);
  if (!classified.accepted) {
    const responseText = (language === 'en' ? 'I did not understand clearly. Please say it again, use the keypad, or ask for a person. '
      : 'मैं आपकी बात साफ़ नहीं समझ पाया। फिर से बोलें, फोन के बटन दबाएँ, या किसी व्यक्ति से बात करने को कहें। ') + menuFor(language).text;
    const dispatch = { mode: 'clarify', autonomousMutationAllowed: false };
    await recordTurn(sessionId, { inputType, inputText: String(normalizedInput || ''), intent: classified.intent,
      confidence: classified.confidence, responseText, dispatch, providerStatus });
    return { ...classified, responseText, dispatch, menu: menuFor(language), handoffAvailable: true };
  }
  const dispatch = buildDispatch(classified.intent, classified.entities);
  const responseText = plainResponse(classified.intent, language);
  await recordTurn(sessionId, { inputType, inputText: String(normalizedInput || ''), intent: classified.intent,
    confidence: classified.confidence, responseText, dispatch, providerStatus });
  return { ...classified, responseText, dispatch, handoffAvailable: true };
}

function capabilityStatus() {
  return {
    architecture: 'stackable_farmer_voice_channel',
    languages: Object.keys(LANGUAGES),
    inputModes: ['dtmf', 'text', 'speech'],
    dtmfOperational: true,
    textIntentOperational: true,
    speechProviders: aiOrchestrator.listSpeechProviders(),
    externalSpeechOperational: aiOrchestrator.listSpeechProviders().some(x => x.configured) ? 'adapter_requires_live_wiring' : false,
    highRiskAutonomousActions: false,
    audioStored: false,
    humanHandoff: true,
  };
}

module.exports = {
  LANGUAGES,
  DTMF,
  INTENT_ROUTE,
  menuFor,
  classifyText,
  buildDispatch,
  startSession,
  processTurn,
  requestHandoff,
  capabilityStatus,
};
