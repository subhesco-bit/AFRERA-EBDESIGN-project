/**
 * AI Orchestrator — AFRERA_CLAUDE_BUILD_DIRECTIVE.md PART 6 ("AI ARCHITECTURE
 * STANDARD"): "AI ≠ LLM... The AI Orchestrator selects the appropriate engine
 * per task."
 *
 * WHY THIS FILE HAD TO BE WRITTEN (2026-08-08 audit)
 *
 * Fourteen capabilities are named in PART 6. Grepping the codebase (not
 * trusting file names) found real implementations for some, honest stubs for
 * others, and nothing at all for a few — see ENGINES below, each entry cited.
 * The one piece that did not exist anywhere was the orchestrator itself:
 * `services/aiOrchestrationService.js` reads and writes `ai_model_registry`
 * (LLM *model slots* — which vendor, what it costs, whether it is enabled)
 * but never selects an engine for a task and never routes anything. The DB
 * schema for real routing already existed, unused, since migration
 * `058_sam_ai_orchestration.sql` (`ai_routing_rules`, `sam_agents`,
 * `ai_invocations`) — nothing in `src/` ever read or wrote those three
 * tables. This file is the first code that does task-type -> engine
 * dispatch, and it logs every dispatch to `ai_invocations` so routing
 * decisions are reviewable the same way migration 058 intended.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT DO
 *
 * It does not reimplement any engine's logic. Every `invoke` below is a thin
 * call into a module that already exists and was independently verified as
 * real. Where no real engine exists (speech-to-text, live LLM calls),
 * `invoke` is either absent or returns an explicit `not_configured` / `stub`
 * result — never a fabricated answer. That is the same discipline
 * `core/mcda.js` and `core/businessCell.js` already hold themselves to
 * ("absence must be visible"). (2026-08-09: vision_engine and ocr_engine
 * moved from "missing" to real, bounded dispatch — see their entries below —
 * once services/visionService.js (sharp) and services/ocrService.js
 * (tesseract.js) were built; crop-disease image *classification* specifically
 * remains an honest stub, see vision_engine's citation.)
 *
 * (2026-08-10: the remaining four partial/stub entries were resolved.
 * business_logic_engine now dispatches by name onto services/decisionSupportService.js's
 * 12 real, already-mounted business-rule functions — moved to "real". speech_engine got
 * the same real, switchable provider-adapter INTERFACE the LLM section below already
 * has (SPEECH_PROVIDER_ENV / callSpeechProvider), keyed off GOOGLE_SPEECH_API_KEY /
 * AZURE_SPEECH_KEY, honestly not_configured with no key present — no fabricated
 * transcript, ever. workflow_engine was checked against
 * services/enterpriseControlService.js's real migration-993 approval-chain workflow
 * engine for duplication: confirmed NOT a duplicate (that engine is generic multi-step
 * threshold-gated approval; this entry is migration 995's ai_proposals "AI proposes one
 * value, a human disposes" gate) — kept separate, wired to the already-real
 * core/erpAgents.js proposal generation, and made to say plainly that it does not persist
 * to ai_proposals (nothing in src/ does yet) or execute anything. simulation_engine's
 * previous delegate, services/advancedAIService.js advancedOptimizePrice(), was found
 * broken this session (wrong-shape args produced silent NaN economics behind a fabricated
 * confidence score) and has since been fixed and re-wired — see the capability's own
 * citation below for the fix details and its one remaining honest limitation.)
 *
 * THE LEARNING LOOP (directive §6.2)
 *
 * Deterministic dispatch (`route()` called with an exact, known task type) is
 * not a judgement — there is nothing to score. Classification (
 * `classifyAndRoute()`, given a free-text task description and asked which
 * engine fits) IS a judgement call, so every classification is scored through
 * `core/mcda.js gatedMcda()` (which itself calls `core/outcomeResolver.js`'s
 * calibration gate) and logged via `core/outcomeSink.js recordPrediction()`
 * under actor id `aiOrchestrator:classify`. An orchestrator that mis-routes
 * silently would be exactly the kind of unmeasured "intelligence" PART 6 and
 * the 990 migration exist to prevent.
 */

'use strict';

const { logger } = require('../utils/logger');
const pool = require('../database/pool');

// ============================================================================
// LLM PROVIDER ADAPTER INTERFACE
//
// User's stated vision: Claude, ChatGPT, Gemini and DeepSeek continuously
// monitoring the system. Audit finding: backend/package.json has zero LLM
// SDKs (no @anthropic-ai/sdk, openai, @google/generative-ai, or a
// DeepSeek-compatible client) and zero LLM API key env vars are referenced
// anywhere in backend/src. This is a real, switchable adapter INTERFACE —
// not a live integration. Ground rule for this task: no real API calls to
// external LLM providers even where a key happens to be present.
// ============================================================================

const PROVIDER_ENV = {
  claude: { primary: 'ANTHROPIC_API_KEY' },
  openai: { primary: 'OPENAI_API_KEY' },
  gemini: { primary: 'GEMINI_API_KEY', alt: 'GOOGLE_API_KEY' },
  deepseek: { primary: 'DEEPSEEK_API_KEY' },
};

/** Configuration state only. Never logs or returns the key value itself. */
function providerStatus(providerKey) {
  const env = PROVIDER_ENV[providerKey];
  if (!env) return { provider: providerKey, known: false, configured: false };
  const configured = Boolean(process.env[env.primary] || (env.alt && process.env[env.alt]));
  return {
    provider: providerKey,
    known: true,
    envVar: env.alt ? `${env.primary} or ${env.alt}` : env.primary,
    configured,
  };
}

function listProviders() {
  return Object.keys(PROVIDER_ENV).map(providerStatus);
}

// ============================================================================
// SPEECH PROVIDER ADAPTER INTERFACE (2026-08-10)
//
// speech_engine's prior state: services/advancedVoiceAI.js transcribeAudio()
// returned a hardcoded English sentence for ANY audio input, commented "In
// production, use Google Speech-to-Text, Azure Speech, or similar" — a
// fabricated transcription, not a stub that says so. There is no free,
// realistic local STT/TTS equivalent for this environment, so — same as the
// LLM adapter above — this is a real, switchable adapter INTERFACE keyed off
// env var names, honest about being unconfigured, never a live call.
// ============================================================================

const SPEECH_PROVIDER_ENV = {
  google: { primary: 'GOOGLE_SPEECH_API_KEY' },
  azure: { primary: 'AZURE_SPEECH_KEY' },
};

/** Configuration state only. Never logs or returns the key value itself. */
function speechProviderStatus(providerKey) {
  const env = SPEECH_PROVIDER_ENV[providerKey];
  if (!env) return { provider: providerKey, known: false, configured: false };
  return {
    provider: providerKey,
    known: true,
    envVar: env.primary,
    configured: Boolean(process.env[env.primary]),
  };
}

function listSpeechProviders() {
  return Object.keys(SPEECH_PROVIDER_ENV).map(speechProviderStatus);
}

/**
 * The interface a real STT/TTS adapter would implement
 * (`callSpeechProvider(key, action, input, opts)` -> `{ ok, ... }`).
 * Deliberately never places a network call, even if `configured` is true —
 * same ground rule as callProvider() above: draft interface, no live call in
 * this change.
 */
async function callSpeechProvider(providerKey, action, _input, _opts = {}) {
  const status = speechProviderStatus(providerKey);
  if (!status.known) {
    return {
      ok: false,
      status: 'unknown_provider',
      provider: providerKey,
      knownProviders: Object.keys(SPEECH_PROVIDER_ENV),
    };
  }
  if (!['transcribe', 'synthesize'].includes(action)) {
    return { ok: false, status: 'unknown_action', action, knownActions: ['transcribe', 'synthesize'] };
  }
  if (!status.configured) {
    return {
      ok: false,
      status: 'not_configured',
      provider: providerKey,
      action,
      reason: `${status.envVar} is not set. No live call was attempted. `
        + 'services/advancedVoiceAI.js transcribeAudio() previously returned a fixed English '
        + 'sentence regardless of input — that fabrication is not reproduced here.',
    };
  }
  return {
    ok: false,
    status: 'call_intentionally_not_implemented',
    provider: providerKey,
    action,
    reason: 'A credential is present but this adapter is not wired to a live SDK call '
      + '(ground rule for this change: draft interface, no live external call). Implement '
      + 'the Google Speech-to-Text / Azure Speech SDK call here once a real key is '
      + 'provisioned and the data-residency question (same one gating the LLM adapter above) '
      + 'has been answered for voice audio specifically.',
  };
}

/**
 * The interface every provider adapter would implement (`callProvider(key,
 * prompt, opts)` -> `{ ok, text, ... }`). Deliberately never places a network
 * call in this drafting task, even if `configured` is true — that is a
 * ground rule for this change, not a technical limitation. Wiring a real SDK
 * call belongs here, gated behind the matching `ai_model_registry` slot
 * (migration 058) being explicitly enabled by a human who has answered the
 * data-residency question.
 */
async function callProvider(providerKey, _prompt, _opts = {}) {
  const status = providerStatus(providerKey);
  if (!status.known) {
    return { ok: false, status: 'unknown_provider', provider: providerKey, knownProviders: Object.keys(PROVIDER_ENV) };
  }
  if (!status.configured) {
    return {
      ok: false,
      status: 'not_configured',
      provider: providerKey,
      reason: `${status.envVar} is not set. No live call was attempted.`,
    };
  }
  // A credential is present, but this is a code-drafting task — no real call.
  return {
    ok: false,
    status: 'call_intentionally_not_implemented',
    provider: providerKey,
    reason: 'A credential is present but this adapter is not wired to a live SDK '
      + 'call (ground rule for this change: draft code, no live external calls). '
      + 'Implement the SDK call here, then enable the matching slot in '
      + 'ai_model_registry (migration 058) once data residency is answered.',
  };
}

// ============================================================================
// MODULE REGISTRY SINGLETON — lazily created/initialized once, reused across
// every module_dispatch invocation (mirrors routes/claude/moduleRegistryRoutes.js's
// own singleton pattern, kept separate rather than importing a route file from
// core/).
// ============================================================================

let moduleRegistryInstance = null;
let moduleRegistryInitPromise = null;

function getModuleRegistry() {
  if (!moduleRegistryInstance) {
    const ModuleRegistry = require('./moduleRegistry');
    moduleRegistryInstance = new ModuleRegistry();
  }
  return moduleRegistryInstance;
}

function ensureModuleRegistryInitialized(registry) {
  if (!moduleRegistryInitPromise) {
    moduleRegistryInitPromise = registry.initialize().catch((error) => {
      moduleRegistryInitPromise = null;
      throw error;
    });
  }
  return moduleRegistryInitPromise;
}

// ============================================================================
// ENGINE REGISTRY — the 14 capabilities from PART 6, each grep-verified.
// Registry pattern: dispatch only, no engine logic is reimplemented here.
// ============================================================================

const ENGINES = {
  rule_engine: {
    label: 'Rule Engine',
    status: 'real',
    citation: 'core/decisionEngine.js — DecisionEngine class, signal-correlation '
      + 'rules registered via addRule(), synchronous process(signal).',
    invoke: async (payload = {}) => {
      const { signalBus } = require('./signalBus');
      const { decisionEngine } = require('./decisionEngine');
      const { type, data = {}, meta = {} } = payload;
      if (!type) throw new Error('rule_engine requires payload.type (a SIGNAL.* value from core/signalBus.js)');
      const signal = signalBus.emitSignal(type, data, meta);
      return { signal, decisions: decisionEngine.process(signal) };
    },
  },

  knowledge_graph: {
    label: 'Knowledge Graph',
    status: 'real',
    citation: 'services/knowledgeGraphService.js — Postgres-backed knowledge_nodes '
      + '/ knowledge_relationships, full-text search, find_related_nodes() SQL function.',
    invoke: async (payload = {}) => {
      const kg = require('../services/legacy/knowledgeGraphService');
      if (!payload.query) throw new Error('knowledge_graph requires payload.query');
      return kg.searchKnowledgeNodes(payload.query, payload.nodeType || null);
    },
  },

  enterprise_memory: {
    label: 'Enterprise Memory',
    status: 'real',
    citation: 'services/enterpriseMemoryService.js — Postgres-backed '
      + 'enterprise_memory_entries (migration 9997_enterprise_memory_schema.sql), '
      + 'real full-text case retrieval (to_tsvector/to_tsquery, same pattern as '
      + 'knowledgeGraphService), auto-recorded from core/signalBus.js TEMPERATURE_BREACH '
      + '/ RECALL_ISSUED / FRAUD_SUSPECTED with a best-effort link to the ai_outcomes row '
      + 'core/effectors.js writes for the same signal. Deliberately NOT a second copy of '
      + 'ai_outcomes/ai_prediction_log (migration 990) — it points at those rows via '
      + 'nullable FK and LEFT JOINs them at read time. Built 2026-08-09 to close the gap '
      + 'this entry originally reported ("missing", invoke: null).',
    invoke: async (payload = {}) => {
      const mem = require('../services/legacy/enterpriseMemoryService');
      const { action = 'recallSimilar' } = payload;

      if (action === 'recordMemory') {
        if (!payload.entry) throw new Error('enterprise_memory recordMemory requires payload.entry');
        return mem.recordMemory(payload.entry);
      }
      if (action === 'recallByEntity') {
        if (!payload.entityType || payload.entityId == null) {
          throw new Error('enterprise_memory recallByEntity requires payload.entityType and payload.entityId');
        }
        return mem.recallByEntity(payload.entityType, payload.entityId, { limit: payload.limit });
      }
      if (!payload.query) throw new Error('enterprise_memory recallSimilar requires payload.query (or set payload.action)');
      return mem.recallSimilar(payload.query, { category: payload.category, limit: payload.limit });
    },
  },

  business_logic_engine: {
    label: 'Business Logic Engine',
    status: 'real',
    citation: '(2026-08-10) services/decisionSupportService.js — 12 real business-rule '
      + 'functions (corpCreditEligible, buyVsRentDecision, farmerSelectionDecision, '
      + 'claimFraudScore, moqPrice, benchmarkVerdict, floorBenchmark, ecoLogisticsMiles, '
      + 'harvestPoints, allocScore, compostPlan, schemeExpiryStatus, complianceGaps), '
      + 'already mounted at /api/v1/decision-support (index.js: '
      + 'decisionSupportService.setupRoutes(app)). This closes the gap the entry originally '
      + 'reported ("no single generic run-this-business-rule entry point") by adding a '
      + 'named-rule dispatch onto that existing, live service — no new business logic was '
      + 'written. core/businessCell.js execute() (still abstract by design, per directive '
      + '§1.4 — each cell overrides its own) and core/erpAgents.js (ERP domain rules on '
      + 'decisionEngine, dispatched separately via workflow_engine below) are unrelated and '
      + 'untouched.',
    invoke: async (payload = {}) => {
      const decisionSupport = require('../services/legacy/decisionSupportService');
      const RULES = {
        corpCreditEligible: (p) => decisionSupport.corpCreditEligible(p.turnoverCr, p.vintageYrs),
        buyVsRentDecision: (p) => decisionSupport.buyVsRentDecision(p),
        farmerSelectionDecision: (p) => decisionSupport.farmerSelectionDecision(p),
        claimFraudScore: (p) => decisionSupport.claimFraudScore(p),
        moqPrice: (p) => decisionSupport.moqPrice(p),
        benchmarkVerdict: (p) => decisionSupport.benchmarkVerdict(p),
        floorBenchmark: (p) => decisionSupport.floorBenchmark(p.categoryOrName, p.catalog),
        ecoLogisticsMiles: (p) => decisionSupport.ecoLogisticsMiles(p.ctx, p.lanes),
        harvestPoints: (p) => decisionSupport.harvestPoints(p.user),
        allocScore: (p) => decisionSupport.allocScore(p.lot, p.dest, p.regionDist),
        compostPlan: (p) => decisionSupport.compostPlan(p.crop, p.acres, p.soilCond),
        schemeExpiryStatus: () => decisionSupport.schemeExpiryStatus(),
        complianceGaps: (p) => decisionSupport.complianceGaps(p.complianceRecord),
      };
      const { rule, params = {} } = payload;
      if (!rule || !RULES[rule]) {
        throw new Error(`business_logic_engine requires payload.rule to be one of: ${Object.keys(RULES).join(', ')}`);
      }
      return RULES[rule](params);
    },
  },

  decision_engine: {
    label: 'Decision Engine',
    status: 'real',
    citation: 'core/mcda.js gatedMcda(actorId, criteria) — MCDA score discounted by '
      + "the calling actor's measured accuracy via core/outcomeResolver.js.",
    invoke: async (payload = {}) => {
      const { gatedMcda } = require('./mcda');
      const { actorId = 'aiOrchestrator:decision_engine', criteria } = payload;
      if (!Array.isArray(criteria)) throw new Error('decision_engine requires payload.criteria[]');
      return gatedMcda(actorId, criteria);
    },
  },

  forecasting_engine: {
    label: 'Forecasting Engine',
    status: 'real',
    citation: 'services/advancedAIService.js advancedPredictDemand() — Holt linear '
      + 'forecast, seasonal indices, MAPE, confidence intervals, all from '
      + 'utils/statistics.js (unit-tested classical statistics, not Math.random()). '
      + 'services/predictiveAnalyticsService.js and services/demandService.js are '
      + 'real but store/read stored forecasts only — neither computes one.',
    invoke: async (payload = {}) => {
      const { advancedPredictDemand } = require('../services/legacy/advancedAIService');
      const { productId, timeHorizon = 30, includeExplanations = true } = payload;
      if (!productId) throw new Error('forecasting_engine requires payload.productId');
      return advancedPredictDemand(productId, timeHorizon, includeExplanations);
    },
  },

  optimization_engine: {
    label: 'Optimization Engine',
    status: 'real',
    citation: 'core/mcda.js rankOptions() — weighted multi-criteria ranking with a '
      + 'decisiveness margin. No general LP/MILP/numeric solver exists beyond this.',
    invoke: async (payload = {}) => {
      const { rankOptions } = require('./mcda');
      const { options } = payload;
      if (!Array.isArray(options)) throw new Error('optimization_engine requires payload.options[]');
      return rankOptions(options);
    },
  },

  simulation_engine: {
    label: 'Simulation Engine',
    status: 'partial',
    citation: '(2026-08-10 re-audit, fix applied same day) core/businessCell.js simulate() '
      + 'default remains an honest stub; core/mcda.js scores already-known options rather '
      + 'than projecting a scenario forward, so that job stays with optimization_engine. '
      + 'services/advancedAIService.js advancedOptimizePrice(productId, currentPrice, context) '
      + 'was found broken this session (wrong-shape args into simulatePriceOutcomes() produced '
      + 'silent NaN economics behind a fabricated "confidence: 0.91") and has since been fixed: '
      + 'the argument mismatch, the risk/strategy call-order bug, and the hardcoded confidence '
      + 'were all corrected, verified NaN-free by hand-trace on real sample values. It is '
      + 'wired here now that it is honest end-to-end. Known real limitation, not fabricated: '
      + 'because callers do not yet populate price_history/demand_history on currentState, the '
      + 'underlying RL elasticity model always takes its "insufficient data" branch today, so '
      + 'this will typically report confidence:0 and recommend holding the current price — an '
      + 'honest "not enough data" result, not a wrong one. It will start producing real varying '
      + 'recommendations once that history-wiring gap (a separate, already-flagged task) closes.',
    invoke: async (payload) => {
      const { productId, currentPrice, context } = payload || {};
      if (!productId || currentPrice == null) {
        throw new Error('simulation_engine requires payload.productId and payload.currentPrice');
      }
      const { advancedOptimizePrice } = require('../services/legacy/advancedAIService');
      return advancedOptimizePrice(productId, currentPrice, context || {});
    },
  },

  vision_engine: {
    label: 'Vision Engine',
    status: 'real',
    citation: '(2026-08-09) services/visionService.js — real sharp(buffer).stats() / '
      + '.metadata() / .resize() usage (sharp was previously a dead dependency: zero '
      + 'require("sharp") call sites). Grounded in products.images JSONB '
      + '(migrations/000_base_schema.sql) and user_profiles.profile_image_url. Bounded: '
      + 'analyzeImageQuality() is a simple pixel-statistics heuristic (sharp\'s own '
      + '"experimental" sharpness/entropy stats), NOT a deep-learning classifier — '
      + 'services/advancedAIService.js loadComputerVisionModel() (crop-disease '
      + 'classification) remains an honest {available:false} stub; this does not change '
      + 'that.',
    invoke: async (payload = {}) => {
      const vision = require('../services/legacy/visionService');
      const { buffer, imageBase64, operation = 'analyze_quality', width, height, fit, format } = payload;
      const imgBuffer = buffer || (imageBase64 ? Buffer.from(imageBase64, 'base64') : null);
      if (!imgBuffer) throw new Error('vision_engine requires payload.buffer (Buffer) or payload.imageBase64');
      if (operation === 'metadata') return vision.getImageMetadata(imgBuffer);
      if (operation === 'thumbnail') return vision.generateThumbnail(imgBuffer, { width, height, fit, format });
      return vision.analyzeImageQuality(imgBuffer);
    },
  },

  ocr_engine: {
    label: 'OCR Engine',
    status: 'real',
    citation: '(2026-08-09) services/ocrService.js — real tesseract.js '
      + 'createWorker/recognize usage, fully offline, no API key. tesseract.js was '
      + 'added as a NEW package.json dependency for this change; npm install was not '
      + 'run in this environment so installation is unverified end-to-end. Grounded in '
      + 'certifications/farmer_certifications.document_url and '
      + 'certification_reports.report_data (migrations/000 and 033) — '
      + 'extractAndStoreCertificateText() merges OCR output into the existing '
      + 'report_data JSONB column, no invented schema. Bounded: decent on clean printed '
      + 'text, weak on handwriting/skewed scans — a human-review draft, not ground truth.',
    invoke: async (payload = {}) => {
      const ocr = require('../services/legacy/ocrService');
      const { buffer, imageBase64, language = 'eng', reportNumber } = payload;
      const imgBuffer = buffer || (imageBase64 ? Buffer.from(imageBase64, 'base64') : null);
      if (!imgBuffer) throw new Error('ocr_engine requires payload.buffer (Buffer) or payload.imageBase64');
      if (reportNumber) return ocr.extractAndStoreCertificateText(reportNumber, imgBuffer, { language });
      return ocr.extractTextFromImage(imgBuffer, { language });
    },
  },

  speech_engine: {
    label: 'Speech Engine',
    status: 'partial',
    citation: '(2026-08-10) A real, switchable provider-adapter INTERFACE — same pattern as '
      + 'PROVIDER_ENV/callProvider above — keyed off GOOGLE_SPEECH_API_KEY / '
      + 'AZURE_SPEECH_KEY. Returns {ok:false, status:"not_configured"} honestly when no key '
      + 'is present, and {ok:false, status:"call_intentionally_not_implemented"} when a key '
      + 'is present but no live SDK call is wired — never a fabricated transcript. '
      + 'services/voiceAIService.js and services/advancedVoiceAI.js manage session/transcript '
      + 'rows and do keyword intent-matching on an ALREADY-PROVIDED transcript string; '
      + 'unchanged by this entry. services/advancedVoiceAI.js transcribeAudio() remains a '
      + 'hardcoded stub returning a fixed English sentence regardless of input (commented "In '
      + 'production, use Google Speech-to-Text, Azure Speech, or similar") — this adapter '
      + 'does not call it and should replace it once a real key is wired.',
    invoke: async (payload = {}) => {
      const { provider, action = 'transcribe', audioBase64, text } = payload;
      if (!provider) {
        return {
          ok: false,
          status: 'not_configured',
          providers: listSpeechProviders(),
          reason: 'No provider specified. Pass { provider: "google"|"azure", '
            + 'action: "transcribe"|"synthesize" } to check/attempt a real provider call.',
        };
      }
      if (action === 'transcribe' && !audioBase64) {
        throw new Error('speech_engine transcribe requires payload.audioBase64');
      }
      if (action === 'synthesize' && !text) {
        throw new Error('speech_engine synthesize requires payload.text');
      }
      return callSpeechProvider(provider, action, action === 'transcribe' ? audioBase64 : text, payload);
    },
  },

  recommendation_engine: {
    label: 'Recommendation Engine',
    status: 'real',
    citation: 'services/catalogIntelligenceService.js wellnessRecommendation() / '
      + 'productCalendar() / glutForecast() — real seasonality- and rule-driven '
      + 'recommendations. services/nutritionIntelligenceService.js (built earlier '
      + 'this session, not modified here) is the other real instance.',
    invoke: async (payload = {}) => {
      const catalog = require('../services/legacy/catalogIntelligenceService');
      const { concern, month } = payload;
      if (!concern) throw new Error('recommendation_engine requires payload.concern');
      return catalog.wellnessRecommendation({ concern, month });
    },
  },

  workflow_engine: {
    label: 'Workflow Engine (AI Proposal Gate)',
    status: 'partial',
    citation: '(2026-08-10) DUPLICATION CHECKED against services/enterpriseControlService.js, '
      + 'which backs migration 993 (workflow_definitions / workflow_steps / '
      + 'workflow_instances) with real startWorkflow()/actOnWorkflow() functions — a '
      + 'generic, multi-step, threshold-gated approval-chain engine already used for POs '
      + 'and other entities, and already given a frontend UI this session. CONFIRMED NOT A '
      + 'DUPLICATE: this entry is a different concept — migrations/995_erp_process_layer.sql '
      + 'ai_proposals table + CHECK constraints, a flat "AI proposes ONE value change with a '
      + 'rationale, a named human approves or rejects it" gate (see core/erpAgents.js '
      + 'proposal()), not a multi-step process. Kept separate rather than merged. Wired to '
      + 'core/erpAgents.js runAgent()/runDomain()/runAll(), which is real and already live '
      + '(index.js POST /.../:agentId). (2026-08-29) Persistence gap closed: '
      + 'core/erpAgents.js persistProposals() now does a real `INSERT INTO ai_proposals` '
      + '(migration 995) — pass payload.persist:true to write proposals there and get back '
      + 'real row ids a human can later approve/reject through whatever surface reads that '
      + 'table. Defaults to false (unchanged in-memory-only behavior) so this stays backward '
      + "compatible with any existing caller that relied on the old semantics. This entry "
      + 'still does not approve, reject, or execute anything — that stays a named human\'s job. '
      + 'If a multi-step, threshold-based approval chain is what is actually needed, call '
      + 'services/enterpriseControlService.js startWorkflow() directly — that is the real '
      + 'engine for that job, not this one.',
    invoke: async (payload = {}) => {
      const erpAgents = require('./erpAgents');
      const { agentId, domain, context = {}, persist = false } = payload;
      const note = persist
        ? 'Persisted to ai_proposals — see proposalIds. Still not approved, rejected, or '
          + 'executed; a named human must act on these through whatever surface reads that table.'
        : 'In-memory proposal(s) only — pass payload.persist:true to write these to '
          + 'ai_proposals. Not approved, rejected, or executed either way.';

      const proposals = agentId ? [erpAgents.runAgent(agentId, context)].filter(Boolean)
        : domain ? erpAgents.runDomain(domain, context)
        : erpAgents.runAll(context);

      const proposalIds = persist && proposals.length ? await erpAgents.persistProposals(proposals) : [];
      const result = { proposals, persisted: persist, proposalIds, note };
      if (agentId) result.proposal = proposals[0] ?? null; // preserve prior single-agent response shape
      return result;
    },
  },

  agent_orchestrator: {
    label: 'Agent Orchestrator',
    status: 'built_here',
    citation: 'Did not exist before this change. services/aiOrchestrationService.js '
      + 'only manages ai_model_registry (LLM model slot CRUD) and never selected an '
      + 'engine for a task. This file is the first code that reads a task type and '
      + 'dispatches it. The DB schema for routing already existed, unused, in '
      + 'migrations/058_sam_ai_orchestration.sql (ai_model_registry, '
      + 'ai_routing_rules, sam_agents, ai_invocations).',
    invoke: null,
  },

  module_dispatch: {
    label: 'Module Dispatch (Plug-and-Play Registry)',
    status: 'real',
    citation: '(2026-08-29) core/moduleRegistry.js — real discover()/discoverByCapabilities()/'
      + 'execute() pipeline over the 302 registered plug-and-play modules (111 in '
      + 'backend/src/modules/M0XX + 191 in root modules/, confirmed working earlier this '
      + 'session via routes/claude/moduleRegistryRoutes.js at /api/v1/ai/modules). That route '
      + "was previously the registry's ONLY caller — the orchestrator itself never queried it, "
      + "so a task type this file's own ENGINES above has no entry for could not fall through "
      + 'to any of the 302 modules even when one of them was the right tool. This entry closes '
      + 'that gap: pass { moduleId, operation, parameters } to execute a known module directly, '
      + 'or { query } / { requiredCapabilities, optionalCapabilities } to have the registry find '
      + 'one first, same as the HTTP route does. Reuses one lazily-initialized ModuleRegistry '
      + 'instance (mirrors moduleRegistryRoutes.js\'s own singleton pattern) rather than '
      + 're-initializing the library service on every call.',
    invoke: async (payload = {}) => {
      const registry = getModuleRegistry();
      await ensureModuleRegistryInitialized(registry);
      const {
        moduleId, operation, parameters = {}, context = {},
        query, requiredCapabilities, optionalCapabilities = [],
      } = payload;

      if (moduleId && operation) {
        return registry.execute(moduleId, operation, parameters, context);
      }
      if (Array.isArray(requiredCapabilities) && requiredCapabilities.length) {
        return registry.discoverByCapabilities({ requiredCapabilities, optionalCapabilities }, context);
      }
      if (query) {
        return registry.discover(query, context);
      }
      throw new Error(
        'module_dispatch requires either { moduleId, operation } to execute a known module, '
        + 'or { query } / { requiredCapabilities } to discover one first'
      );
    },
  },

  claude_coordinator: {
    label: 'Claude AI Coordinator',
    status: 'real',
    citation: '(2026-08-29) core/claudeAICoordinator.js — a separate, real, independently-live '
      + 'AI orchestration entry point (constructs an actual @anthropic-ai/sdk client,'
      + ' session-context tracking, library-knowledge enrichment, agent selection). Reachable '
      + 'today via routes/unifiedAIRoutes.js AND its duplicate routes/claude/unifiedAIRoutes.js '
      + "(both call coordinateAIRequest() directly) - this file's own ENGINES never routed to "
      + "it, so the orchestrator's audit trail (ai_invocations) and guardrail pipeline never "
      + "saw Claude-coordinator traffic even though it's real, live production code. This entry "
      + "closes that gap without touching the existing routes (still call it directly, unaffected) "
      + '- it just gives module_dispatch-style callers (and this file\'s own classifyAndRoute()) '
      + 'a path to the same coordinator.',
    invoke: async (payload = {}) => {
      const claudeAICoordinator = require('./claudeAICoordinator');
      const { requestType = 'general', query, context = {}, userId, sessionId, agentPreference } = payload;
      if (!query) throw new Error('claude_coordinator requires payload.query');
      return claudeAICoordinator.coordinateAIRequest({ requestType, query, context, userId, sessionId, agentPreference });
    },
  },

  model_registry: {
    label: 'AI Model Registry',
    status: 'real',
    citation: 'services/legacy/aiOrchestrationService.js — real Postgres-backed CRUD over '
      + 'ai_model_registry (migration 058: which LLM vendor slot, cost, whether enabled) and '
      + 'ai_routing_rules\' unserved-intent list. Config management, not task dispatch - this '
      + 'is what tells an operator or the `llm` engine above which providers are actually '
      + 'enabled before attempting a call, not a second competing orchestrator despite the '
      + 'name. Already live via routes/enterpriseAIRoutes.js; this entry adds the same '
      + 'orchestrator-reachable path the other real engines have.',
    invoke: async (payload = {}) => {
      const aiOrchestrationService = require('../services/legacy/aiOrchestrationService');
      const { action = 'listModelSlots', slotData } = payload;
      if (action === 'listUnservedIntents') return aiOrchestrationService.listUnservedIntents();
      if (action === 'upsertModelSlot') {
        if (!slotData) throw new Error('model_registry upsertModelSlot requires payload.slotData');
        return aiOrchestrationService.upsertModelSlot(slotData);
      }
      return aiOrchestrationService.listModelSlots();
    },
  },

  llm: {
    label: 'LLMs',
    status: 'not_configured',
    citation: 'Zero LLM SDKs in backend/package.json (no @anthropic-ai/sdk, openai, '
      + '@google/generative-ai, or a DeepSeek client); zero LLM API key env vars '
      + 'referenced anywhere in backend/src. services/aiCopilotService.js, '
      + 'conversationalAIService.js, advancedAIService.js and enterpriseAIService.js '
      + 'generate responses via switch/case domain templates, not an LLM call. '
      + "migrations/058 seeds ai_model_registry with 6 slots, all provider='UNASSIGNED', "
      + 'enabled=false — the absence is already visible in the schema, this file makes '
      + 'it visible in the routing layer too.',
    invoke: async (payload = {}) => {
      const { provider, prompt, allowTemplateFallback = false } = payload;
      if (provider) return callProvider(provider, prompt, payload);
      if (allowTemplateFallback) {
        const copilot = require('../services/legacy/aiCopilotService');
        const { copilotType = 'generic', message, context = {}, session = {} } = payload;
        if (!message) throw new Error('llm template fallback requires payload.message');
        const result = await copilot.generateCopilotResponse(copilotType, message, context, session);
        return { usedTemplateFallbackNotLLM: true, result };
      }
      return {
        ok: false,
        status: 'not_configured',
        providers: listProviders(),
        reason: 'No provider specified and no template fallback requested. Pass '
          + '{ provider: "claude"|"openai"|"gemini"|"deepseek" } to check/attempt a '
          + 'real provider call, or { allowTemplateFallback: true } to use the '
          + 'existing rule-based domain templates (NOT an LLM).',
      };
    },
  },
};

// ============================================================================
// INVOCATION LOG — ai_invocations (migration 058). Best-effort: a logging
// failure must never break the caller's request (same rule outcomeSink.js
// holds itself to).
// ============================================================================

async function logInvocation({ agentKey, intent, outcome, errorMessage = null, latencyMs = null }) {
  try {
    await pool.query(
      `INSERT INTO ai_invocations (agent_key, intent, outcome, error_message, latency_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [agentKey, intent, outcome, errorMessage, latencyMs]
    );
  } catch (err) {
    logger.error('aiOrchestrator:invocation_log_failed', { agentKey, intent, message: err.message });
  }
}

// ============================================================================
// DISPATCH
// ============================================================================

/** Everything the registry knows, for an introspection/health endpoint. */
function listEngines() {
  return Object.entries(ENGINES).map(([taskType, e]) => ({
    taskType,
    label: e.label,
    status: e.status,
    citation: e.citation,
    callable: typeof e.invoke === 'function',
  }));
}

/**
 * Deterministic dispatch. taskType must be an exact key in ENGINES — this is
 * NOT a judgement call, so nothing is scored through the learning loop here.
 * A task type that resolves to a real, callable engine is invoked directly;
 * anything else returns an explicit, honest status instead of a fabricated
 * result.
 */
async function route(taskType, payload = {}, opts = {}) {
  const startedAt = Date.now();
  const entry = ENGINES[taskType];
  const agentKey = opts.actorId || 'aiOrchestrator';

  if (!entry) {
    await logInvocation({ agentKey, intent: taskType, outcome: 'refused', errorMessage: `Unknown task type "${taskType}"` });
    return { ok: false, status: 'unknown_task_type', taskType, availableTaskTypes: Object.keys(ENGINES) };
  }

  if (typeof entry.invoke !== 'function') {
    await logInvocation({
      agentKey, intent: taskType, outcome: 'refused',
      errorMessage: `${entry.label} has no callable handler (status: ${entry.status})`,
    });
    return {
      ok: false,
      status: entry.status,
      engine: entry.label,
      citation: entry.citation,
      reason: `${entry.label} is "${entry.status}" — no safe, real handler exists yet. `
        + 'This is reported honestly rather than fabricating a result.',
    };
  }

  try {
    const result = await entry.invoke(payload, opts);
    await logInvocation({ agentKey, intent: taskType, outcome: 'success', latencyMs: Date.now() - startedAt });
    return { ok: true, status: entry.status, engine: entry.label, citation: entry.citation, result };
  } catch (err) {
    await logInvocation({
      agentKey, intent: taskType, outcome: 'error',
      errorMessage: err.message, latencyMs: Date.now() - startedAt,
    });
    return { ok: false, status: 'error', engine: entry.label, error: err.message };
  }
}

// ----------------------------------------------------------------------------
// Judgement-call classification. Given free text instead of an exact task
// type, the orchestrator has to GUESS which engine fits — that guess is
// scored through the same calibration gate every other judging agent in this
// codebase uses, per directive §6.2.
// ----------------------------------------------------------------------------

const CLASSIFY_KEYWORDS = {
  rule_engine: ['rule', 'trigger', 'correlate', 'signal', 'threshold'],
  knowledge_graph: ['knowledge', 'graph', 'relationship', 'related', 'node'],
  decision_engine: ['decide', 'decision', 'choose', 'weigh', 'criteria'],
  forecasting_engine: ['forecast', 'predict', 'demand', 'trend', 'projection'],
  optimization_engine: ['optimi', 'rank option', 'best option', 'maximi', 'minimi'],
  simulation_engine: ['simulate', 'scenario', 'what if', 'model outcome'],
  recommendation_engine: ['recommend', 'suggest', 'advice'],
  llm: ['chat', 'converse', 'write', 'summarize', 'draft', 'generate text'],
  vision_engine: ['image', 'photo', 'picture', 'crop disease', 'visual'],
  ocr_engine: ['ocr', 'scan document', 'extract text from image', 'receipt'],
  speech_engine: ['voice', 'speech', 'audio', 'transcribe', 'spoken'],
  workflow_engine: ['workflow', 'approval step', 'process step'],
  module_dispatch: ['module', 'plug-and-play', 'registry', 'discover module', 'run module'],
  claude_coordinator: ['coordinate', 'claude session', 'agent selection', 'library-enriched'],
  model_registry: ['model slot', 'model registry', 'llm provider config', 'unserved intent'],
};

function keywordScore(text, words) {
  const t = text.toLowerCase();
  const hits = words.filter((w) => t.includes(w)).length;
  return words.length ? Math.round((hits / words.length) * 100) : 0;
}

/**
 * Classify a free-text task description against the registry, route it, and
 * record the classification as a scoreable prediction (actor
 * "aiOrchestrator:classify"). Falls closed: if the calibration gate cannot be
 * read, mayAutoExecute is false and the discounted score is used, mirroring
 * core/mcda.js gatedMcda()'s own fail-closed behaviour.
 */
async function classifyAndRoute(taskDescription, payload = {}, opts = {}) {
  if (!taskDescription || typeof taskDescription !== 'string') {
    throw new Error('classifyAndRoute requires a taskDescription string');
  }

  const candidates = Object.entries(CLASSIFY_KEYWORDS)
    .map(([capability, words]) => ({
      name: capability,
      criteria: [{ name: 'keyword_match', weight: 1, score: keywordScore(taskDescription, words), dataQuality: 'estimated' }],
    }))
    .filter((c) => c.criteria[0].score > 0);

  if (!candidates.length) {
    return {
      ok: false,
      status: 'unclassified',
      taskDescription,
      reason: 'No registered capability keyword matched this description. Call route() '
        + 'directly with an exact task type instead, or extend CLASSIFY_KEYWORDS.',
      availableTaskTypes: Object.keys(ENGINES),
    };
  }

  const { rankOptions, gatedMcda } = require('./mcda');
  const ranked = rankOptions(candidates);
  const winner = ranked.ranked[0];
  const actorId = opts.actorId || 'aiOrchestrator:classify';
  const gated = await gatedMcda(actorId, winner.criteria);

  // This is the judgement call — register it in the learning loop.
  const outcomeSink = require('./outcomeSink');
  const predictionId = await outcomeSink.recordPrediction({
    actorId,
    predictionType: 'engine_routing_choice',
    subjectType: 'task_description',
    subjectId: taskDescription.slice(0, 100),
    predictedValue: gated.effectiveTotal,
    predictedLabel: winner.name,
    statedConfidence: gated.confidence,
    inputQuality: 'estimated',
  });

  const routed = await route(winner.name, payload, { ...opts, actorId });

  return {
    ...routed,
    classification: {
      chosen: winner.name,
      margin: ranked.margin,
      decisive: ranked.decisive,
      gate: gated.gate,
      authorityMultiplier: gated.authorityMultiplier ?? null,
      mayAutoExecute: gated.mayAutoExecute,
      gateNote: gated.gateNote ?? null,
      predictionId,
    },
  };
}

module.exports = {
  ENGINES,
  route,
  classifyAndRoute,
  listEngines,
  listProviders,
  callProvider,
  listSpeechProviders,
  callSpeechProvider,
};
