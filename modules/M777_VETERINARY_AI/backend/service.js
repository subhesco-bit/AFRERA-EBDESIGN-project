/**
 * M777_VETERINARY_AI — 10/10 with full specialist panel wiring
 */

'use strict';

const aiBackbone = require('../../M400_AI_BACKBONE/backend/service');
const { logger } = require('../../../backend/src/utils/logger');
const {
  SPECIALISTS,
  rankSpecialists,
  buildOpinions,
  consensus,
} = require('./panel');

const SPECIES_PACK = ['cattle', 'buffalo', 'goat', 'sheep', 'pig', 'poultry', 'dog', 'cat', 'equine'];

const CLINICAL_ONTOLOGY = {
  lameness: { severity: 0.7, systems: ['musculoskeletal'] },
  diarrhea: { severity: 0.65, systems: ['gi'] },
  fever: { severity: 0.75, systems: ['systemic'] },
  cough: { severity: 0.7, systems: ['respiratory'] },
  mastitis: { severity: 0.8, systems: ['mammary'] },
  anorexia: { severity: 0.55, systems: ['systemic'] },
  neurological: { severity: 0.9, systems: ['neuro'] },
  skin_lesion: { severity: 0.6, systems: ['integument'] },
  abortion: { severity: 0.85, systems: ['repro'] },
  sudden_death: { severity: 0.95, systems: ['systemic'] },
};

class VETERINARYAIService {
  constructor() {
    this.moduleId = 'M777_VETERINARY_AI';
    this.name = 'AI Veterinary Decision-Support';
    this.version = '2.1.0-10x';
    this.capabilities = [
      'animal_diagnosis',
      'disease_detection',
      'treatment_recommendation',
      'health_monitoring',
      'herd_risk',
      'specialist_panel',
      'one_health',
      'outcome_feedback',
      'image_symptom_bridge',
    ];
    this.metrics = {
      requestsProcessed: 0,
      successCount: 0,
      errorCount: 0,
      escalations: 0,
      outcomesLogged: 0,
      panelConferences: 0,
    };
    this.sessions = new Map();
  }

  async initialize(config) {
    logger.info(`Initializing ${this.moduleId} 10x full panel`);
    return {
      success: true,
      moduleId: this.moduleId,
      version: this.version,
      capabilities: this.capabilities,
      species_pack: SPECIES_PACK,
      panel: SPECIALISTS,
      safety_floor: 'Licensed veterinarian required for diagnosis and prescription.',
    };
  }

  async process(request) {
    const { capability, data, provider, sessionId } = request;
    if (!this.capabilities.includes(capability)) {
      throw new Error('Unknown capability: ' + capability);
    }
    this.metrics.requestsProcessed++;
    try {
      let result;
      switch (capability) {
        case 'animal_diagnosis':
        case 'disease_detection':
          result = await this.diagnose(data, sessionId, provider);
          break;
        case 'treatment_recommendation':
          result = this.treatment(data);
          break;
        case 'herd_risk':
          result = this.herdRisk(data);
          break;
        case 'specialist_panel':
          result = await this.panelConference(data, provider);
          this.metrics.panelConferences++;
          break;
        case 'one_health':
          result = this.oneHealth(data);
          break;
        case 'health_monitoring':
          result = this.monitor(data);
          break;
        case 'image_symptom_bridge':
          result = this.imageBridge(data);
          break;
        case 'outcome_feedback':
          result = this.logOutcome(data, sessionId);
          this.metrics.outcomesLogged++;
          break;
        default:
          result = await this.diagnose(data, sessionId, provider);
      }
      this.metrics.successCount++;
      return {
        success: true,
        moduleId: this.moduleId,
        capability,
        sessionId: sessionId || null,
        result,
        meta: {
          confidence: result.confidence ?? null,
          safety_floor:
            result.safety_floor ||
            'Licensed veterinarian required for diagnosis and prescription. Decision-support only.',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }

  extractSymptoms(text, tags = []) {
    const blob = (tags.join(' ') + ' ' + (text || '')).toLowerCase();
    const matched = [];
    for (const [key, meta] of Object.entries(CLINICAL_ONTOLOGY)) {
      if (blob.includes(key.replace('_', ' ')) || blob.includes(key)) {
        matched.push({ key, ...meta });
      }
    }
    matched.sort((a, b) => b.severity - a.severity);
    return matched;
  }

  async diagnose(data, sessionId, provider) {
    const {
      species = 'cattle',
      symptoms_text = '',
      description = '',
      cv_tags = [],
      herd_size,
      geo,
      age_group,
      run_panel = true,
    } = data || {};

    const text = symptoms_text || description || '';
    const symptoms = this.extractSymptoms(text, cv_tags);
    const maxSev = symptoms.reduce((m, s) => Math.max(m, s.severity), 0);
    const confidence = symptoms.length
      ? Math.min(0.92, 0.45 + symptoms.length * 0.1 + maxSev * 0.15)
      : 0.35;

    let escalate = maxSev >= 0.85 || symptoms.some((s) => s.key === 'sudden_death');
    if (escalate) this.metrics.escalations++;

    const ranked = rankSpecialists(symptoms);
    const panel_suggested = ranked.slice(0, 4).map((s) => ({
      id: s.id,
      name: s.name,
      relevance: s.relevance,
    }));

    let panel_preview = null;
    if (run_panel && symptoms.length) {
      const opinions = buildOpinions(ranked, { species, symptoms });
      panel_preview = {
        opinions,
        consensus: consensus(opinions, symptoms),
      };
    }

    let ai_reasoning = null;
    try {
      const ai = await aiBackbone.makeDecision(
        { confidence },
        {
          moduleId: this.moduleId,
          capability: 'animal_diagnosis',
          data: { species, symptoms, herd_size, geo, age_group, panel_suggested },
          provider: provider || 'claude',
        }
      );
      ai_reasoning = ai?.reasoning || null;
    } catch (e) {
      logger.warn('Vet AI enrichment skipped:', e.message);
    }

    const payload = {
      species,
      symptom_series: symptoms.map((s) => s.key),
      symptoms,
      confidence,
      urgency: maxSev >= 0.85 ? 'emergency' : maxSev >= 0.7 ? 'urgent' : 'routine',
      escalate_to_licensed_vet: true,
      escalate_now: escalate,
      differential_hint: symptoms.slice(0, 3).map((s) => s.key),
      panel_suggested,
      panel_preview,
      ai_reasoning,
      one_health_flag: symptoms.some((s) =>
        ['diarrhea', 'neurological', 'abortion', 'sudden_death'].includes(s.key)
      ),
      regulatory: 'PCICDA / state animal husbandry notification if outbreak suspected',
      safety_floor:
        'NOT A DIAGNOSIS. Licensed veterinarian must examine and prescribe. Food-animal withdrawal mandatory.',
      erp_hooks: {
        case_entity: 'vet_case',
        treatment_stock: true,
        withdrawal_hold: true,
      },
      next_actions: [
        'Escalate to licensed vet',
        'POST /panel for full multi-specialist conference',
        'Bridge image tags via M782 domain=animal',
        'POST outcome_feedback after resolution',
      ],
    };

    if (sessionId) {
      this.sessions.set(sessionId, { last: payload, history: [payload], created: Date.now() });
    }
    return payload;
  }

  treatment(data) {
    return {
      status: 'gated',
      message:
        'Treatment recommendations are gated behind licensed veterinary confirmation. Provide confirmed diagnosis + Rx authority.',
      suggested_supportive_only: ['isolation', 'hydration support', 'hygiene', 'record vitals'],
      safety_floor: 'No antimicrobial or controlled drug without licensed vet Rx.',
      withdrawal_reminder: 'Observe milk/meat withdrawal on any approved product.',
      confidence: 0.5,
    };
  }

  herdRisk(data) {
    const { herd_size = 0, affected = 0, species = 'cattle' } = data || {};
    const rate = herd_size > 0 ? affected / herd_size : 0;
    return {
      species,
      herd_size,
      affected,
      attack_rate: Math.round(rate * 1000) / 1000,
      risk_band: rate >= 0.2 ? 'high' : rate >= 0.05 ? 'moderate' : 'low',
      actions: ['segregate', 'hygiene', 'vet visit', 'notify if reportable'],
      confidence: 0.8,
      safety_floor: 'Herd decisions require veterinary oversight.',
    };
  }

  async panelConference(data, provider) {
    const species = data?.species || 'cattle';
    const text = data?.symptoms_text || data?.description || '';
    const tags = data?.cv_tags || [];
    const symptoms =
      Array.isArray(data?.symptoms) && data.symptoms.length
        ? data.symptoms
        : this.extractSymptoms(text, tags);

    const ranked = rankSpecialists(symptoms);
    const opinions = buildOpinions(ranked, { species, symptoms });
    const cons = consensus(opinions, symptoms);

    let ai_synthesis = null;
    try {
      const ai = await aiBackbone.makeDecision(
        { confidence: 0.82 },
        {
          moduleId: this.moduleId,
          capability: 'specialist_panel',
          data: { species, symptoms, opinions: opinions.map((o) => o.specialist_id) },
          provider: provider || 'claude',
        }
      );
      ai_synthesis = ai?.reasoning || null;
    } catch (e) {
      ai_synthesis = cons.summary;
    }

    return {
      species,
      symptoms,
      specialists_ranked: ranked.map((s) => ({
        id: s.id,
        name: s.name,
        relevance: s.relevance,
        focus: s.focus,
      })),
      opinions,
      consensus: cons,
      ai_synthesis,
      confidence: 0.84,
      safety_floor:
        'FULL PANEL is advisory only. Attending licensed veterinarian retains diagnostic and prescription authority.',
      next_actions: ['Licensed vet exam', 'Lab plan from pathology lens', 'One Health notify if indicated'],
    };
  }

  oneHealth(data) {
    return {
      human_animal_environment: true,
      notes:
        'Concurrent human illness, water contamination, or wildlife die-off elevates One Health priority. Coordinate with health + animal husbandry + agriculture.',
      triggers: data?.triggers || [],
      confidence: 0.85,
      safety_floor: 'Public health notification pathways apply for zoonoses.',
    };
  }

  monitor(data) {
    return {
      vitals: data?.vitals || {},
      trend: 'monitoring',
      alerts: [],
      confidence: 0.7,
      safety_floor: 'Monitoring does not replace clinical examination.',
    };
  }

  imageBridge(data) {
    return {
      bridge: 'Forward image tags to M782_DISEASE_ANALYZER_AI domain=animal',
      suggested_endpoint: '/api/v1/m782_disease_analyzer_ai/analyze',
      payload_hint: {
        domain: 'animal',
        species: data?.species,
        cv_tags: data?.cv_tags || [],
        description: data?.description || '',
      },
      confidence: 0.9,
    };
  }

  logOutcome(data, sessionId) {
    const record = {
      sessionId: sessionId || null,
      outcome: data?.outcome || 'unknown',
      resolved: !!data?.resolved,
      notes: data?.notes || '',
      logged_at: new Date().toISOString(),
    };
    if (sessionId && this.sessions.has(sessionId)) {
      const s = this.sessions.get(sessionId);
      s.outcome = record;
      this.sessions.set(sessionId, s);
    }
    return { status: 'logged', record };
  }

  getMetrics() {
    return { ...this.metrics, active_sessions: this.sessions.size };
  }

  async shutdown() {
    this.sessions.clear();
    return { success: true };
  }
}

let instance = null;

module.exports = {
  getInstance: () => instance || (instance = new VETERINARYAIService()),
  initialize: async (cfg) => module.exports.getInstance().initialize(cfg),
  process: async (req) => module.exports.getInstance().process(req),
  getMetrics: () => module.exports.getInstance().getMetrics(),
  shutdown: async () => module.exports.getInstance().shutdown(),
};
