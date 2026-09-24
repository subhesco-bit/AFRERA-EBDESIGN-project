/**
 * M779_NUTRITION_AI — 10/10 Rituraj Human Nutrition Decision-Support
 * BMR/TDEE, life-stage, culture calendars, clinical flags, pharmacy interactions, safety
 */

'use strict';

const aiBackbone = require('../../M400_AI_BACKBONE/backend/service');
const { logger } = require('../../../backend/src/utils/logger');

const LIFE_STAGES = ['pediatric', 'adolescent', 'adult', 'pregnancy', 'lactation', 'geriatric'];
const RITU = ['vasanta', 'grishma', 'varsha', 'sharad', 'hemanta', 'shishira'];

function mifflinStJeor({ sex = 'm', weight_kg = 70, height_cm = 170, age = 30 }) {
  const s = String(sex).toLowerCase().startsWith('f') ? -161 : 5;
  return 10 * weight_kg + 6.25 * height_cm - 5 * age + s;
}

const ACTIVITY = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

class NUTRITIONAIService {
  constructor() {
    this.moduleId = 'M779_NUTRITION_AI';
    this.name = 'AI Nutritionist (Rituraj)';
    this.version = '2.0.0-10x';
    this.capabilities = [
      'nutrition_planning',
      'dietary_recommendation',
      'health_assessment',
      'calorie_calculation',
      'life_stage',
      'ritu_conference',
      'drug_food_flags',
      'outcome_feedback',
    ];
    this.metrics = {
      requestsProcessed: 0,
      successCount: 0,
      errorCount: 0,
      outcomesLogged: 0,
    };
    this.sessions = new Map();
  }

  async initialize(config) {
    logger.info(`Initializing ${this.moduleId} 10x`);
    return {
      success: true,
      moduleId: this.moduleId,
      version: this.version,
      capabilities: this.capabilities,
      life_stages: LIFE_STAGES,
      ritu: RITU,
      safety_floor: 'Not a substitute for clinical medical nutrition therapy by a qualified professional.',
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
        case 'calorie_calculation':
        case 'health_assessment':
          result = this.assess(data);
          break;
        case 'nutrition_planning':
        case 'dietary_recommendation':
          result = await this.plan(data, sessionId, provider);
          break;
        case 'life_stage':
          result = this.lifeStageFlags(data);
          break;
        case 'ritu_conference':
          result = await this.rituConference(data, provider);
          break;
        case 'drug_food_flags':
          result = this.drugFood(data);
          break;
        case 'outcome_feedback':
          result = this.logOutcome(data, sessionId);
          this.metrics.outcomesLogged++;
          break;
        default:
          result = await this.plan(data, sessionId, provider);
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
            'Advisory. Clinical MNT and medical decisions require qualified professionals.',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }

  assess(data) {
    const profile = data?.profile || data || {};
    const bmr = mifflinStJeor(profile);
    const factor = ACTIVITY[profile.activity || 'moderate'] || 1.55;
    const tdee = Math.round(bmr * factor);
    return {
      bmr: Math.round(bmr),
      tdee,
      activity: profile.activity || 'moderate',
      macros_hint: {
        protein_g: Math.round((tdee * 0.2) / 4),
        carb_g: Math.round((tdee * 0.5) / 4),
        fat_g: Math.round((tdee * 0.3) / 9),
      },
      confidence: 0.85,
      safety_floor: 'Estimates only; adjust for clinical conditions.',
      erp_hooks: { consult_billing: true, gst_service: true },
    };
  }

  lifeStageFlags(data) {
    const stage = (data?.life_stage || 'adult').toLowerCase();
    const flags = [];
    if (stage === 'pregnancy' || stage === 'lactation') {
      flags.push('iron', 'folate', 'calcium', 'avoid_high_mercury_fish', 'limit_caffeine');
    }
    if (stage === 'pediatric') flags.push('growth_monitoring', 'no_honey_under_1yr', 'age_appropriate_texture');
    if (stage === 'geriatric') flags.push('protein_priority', 'b12', 'calcium_d', 'hydration', 'polypharmacy_check');
    return {
      life_stage: stage,
      flags,
      confidence: 0.88,
      safety_floor: 'Medical conditions override general flags — refer clinician.',
    };
  }

  drugFood(data) {
    const meds = (data?.medications || []).map((m) => String(m).toLowerCase());
    const flags = [];
    if (meds.some((m) => m.includes('warfarin'))) flags.push('vitamin_k_consistency');
    if (meds.some((m) => m.includes('metformin'))) flags.push('b12_monitor', 'gi_tolerance');
    if (meds.some((m) => m.includes('statin'))) flags.push('grapefruit_caution');
    if (meds.some((m) => m.includes('maoi'))) flags.push('tyramine_restriction');
    return {
      medications: meds,
      interaction_flags: flags,
      confidence: flags.length ? 0.8 : 0.6,
      safety_floor: 'Not a full monograph DB. Pharmacist/physician confirmation required.',
    };
  }

  async plan(data, sessionId, provider) {
    const assessment = this.assess(data);
    const stage = this.lifeStageFlags(data);
    const drug = this.drugFood(data);

    let ai_reasoning = null;
    try {
      const ai = await aiBackbone.makeDecision(
        { confidence: 0.82 },
        {
          moduleId: this.moduleId,
          capability: 'nutrition_planning',
          data: { assessment, stage, drug, goals: data?.goals, culture: data?.culture, ritu: data?.ritu },
          provider: provider || 'claude',
        }
      );
      ai_reasoning = ai?.reasoning || null;
    } catch (e) {
      logger.warn('Nutrition AI enrichment skipped:', e.message);
    }

    const payload = {
      assessment,
      life_stage: stage,
      drug_food: drug,
      ritu: data?.ritu || null,
      culture_notes: data?.culture || null,
      plan_summary: ai_reasoning || 'Balanced plate aligned to TDEE and life-stage flags.',
      confidence: 0.82,
      safety_floor:
        'Not a substitute for RD/MD medical nutrition therapy. Disease-specific protocols need clinical content packs.',
      erp_hooks: {
        consult_invoice: true,
        gst: true,
      },
      next_actions: ['Refine goals', 'POST drug_food_flags with full med list', 'POST outcome_feedback'],
    };

    if (sessionId) {
      this.sessions.set(sessionId, { last: payload, history: [payload], created: Date.now() });
    }
    return payload;
  }

  async rituConference(data, provider) {
    const ritu = data?.ritu || RITU[0];
    let ai_reasoning = null;
    try {
      const ai = await aiBackbone.makeDecision(
        { confidence: 0.8 },
        {
          moduleId: this.moduleId,
          capability: 'ritu_conference',
          data: { ritu, profile: data?.profile, goals: data?.goals },
          provider: provider || 'claude',
        }
      );
      ai_reasoning = ai?.reasoning || null;
    } catch (e) {
      ai_reasoning = `Seasonal guidance for ${ritu}: prefer local, digestible, season-appropriate foods.`;
    }
    return {
      ritu,
      conference: ai_reasoning,
      confidence: 0.8,
      safety_floor: 'Cultural guidance is complementary to clinical nutrition.',
    };
  }

  logOutcome(data, sessionId) {
    const record = {
      sessionId: sessionId || null,
      outcome: data?.outcome || 'unknown',
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
  getInstance: () => instance || (instance = new NUTRITIONAIService()),
  initialize: async (cfg) => module.exports.getInstance().initialize(cfg),
  process: async (req) => module.exports.getInstance().process(req),
  getMetrics: () => module.exports.getInstance().getMetrics(),
  shutdown: async () => module.exports.getInstance().shutdown(),
};
