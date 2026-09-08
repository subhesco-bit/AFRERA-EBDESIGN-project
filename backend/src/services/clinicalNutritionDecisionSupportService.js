'use strict';

const express = require('express');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { getPostgreSQL } = require('../database/connection');
const claudeAICoordinator = require('../core/claudeAICoordinator');
const { NUTRITION_WELLNESS_DISCLAIMER } = require('../utils/disclaimers');

const router = express.Router();
const SERVICE_VERSION = '1.0.0';
const MAX_TEXT_LENGTH = 4000;

const RED_FLAG_RULES = [
  { key: 'chest_pain', terms: ['chest pain', 'pressure in chest', 'shortness of breath'], action: 'urgent medical evaluation' },
  { key: 'severe_allergic_reaction', terms: ['anaphylaxis', 'swollen tongue', 'swollen throat', 'difficulty breathing'], action: 'emergency evaluation' },
  { key: 'severe_dehydration', terms: ['fainting', 'unable to keep fluids', 'no urine'], action: 'urgent medical evaluation' },
  { key: 'eating_disorder_risk', terms: ['purging', 'bingeing', 'self induced vomiting', 'self-harm'], action: 'qualified mental-health and medical support' },
  { key: 'pregnancy_complication', terms: ['heavy bleeding', 'severe abdominal pain', 'severe headache in pregnancy'], action: 'urgent obstetric evaluation' },
];

const CONTRAINDICATION_RULES = [
  { key: 'pregnancy', fields: ['pregnant', 'pregnancy'], message: 'Pregnancy requires individualized clinician-reviewed nutrition guidance.' },
  { key: 'kidney_disease', fields: ['kidney disease', 'renal disease', 'dialysis'], message: 'Protein, potassium, phosphorus, fluid, and supplement advice requires renal clinician review.' },
  { key: 'liver_disease', fields: ['liver disease', 'cirrhosis', 'hepatitis'], message: 'Diet and supplement advice requires clinician review because liver disease changes safety.' },
  { key: 'diabetes', fields: ['diabetes', 'insulin', 'hypoglycemia'], message: 'Carbohydrate and medication timing changes require the treating clinician.' },
  { key: 'anticoagulant', fields: ['warfarin', 'blood thinner', 'anticoagulant'], message: 'Food and supplement interactions require pharmacist or clinician review.' },
];

function normalizeText(value) {
  return String(value || '').trim().toLowerCase().slice(0, MAX_TEXT_LENGTH);
}

function collectText(input) {
  return [input.reason, input.symptoms, input.conditions, input.medications, input.allergies, input.goals]
    .map(normalizeText)
    .join(' ');
}

function detectRedFlags(input) {
  const text = collectText(input);
  return RED_FLAG_RULES.filter((rule) => rule.terms.some((term) => text.includes(term)))
    .map(({ key, action }) => ({ key, action }));
}

function detectContraindications(input) {
  const text = collectText(input);
  return CONTRAINDICATION_RULES.filter((rule) => rule.fields.some((field) => text.includes(field)))
    .map(({ key, message }) => ({ key, message }));
}

function validateInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('A structured patient context object is required');
  }
  if (input.age != null && (!Number.isInteger(Number(input.age)) || Number(input.age) < 0 || Number(input.age) > 120)) {
    throw new Error('age must be an integer between 0 and 120');
  }
  if (input.reason && String(input.reason).length > MAX_TEXT_LENGTH) {
    throw new Error(`reason must be ${MAX_TEXT_LENGTH} characters or fewer`);
  }
}

function buildAssessment(input) {
  validateInput(input);
  const redFlags = detectRedFlags(input);
  const contraindications = detectContraindications(input);
  return {
    service_version: SERVICE_VERSION,
    status: redFlags.length ? 'urgent_escalation' : 'needs_clinician_review',
    decision_type: 'clinical_nutrition_decision_support',
    red_flags: redFlags,
    contraindications,
    nutrition_priorities: [
      'Collect a complete diet history, hydration pattern, allergies, medications, supplements, and relevant laboratory data.',
      'Use culturally appropriate whole-food options and confirm food access, affordability, and preferences.',
      'Set measurable goals with the treating clinician or registered dietitian and reassess response.',
    ],
    missing_information: [
      'clinician-confirmed diagnosis and care plan',
      'current medication and supplement list',
      'relevant laboratory values and date collected',
      'allergy/intolerance and dietary history',
    ],
    safety_constraints: [
      'This system does not diagnose, prescribe, calculate medication changes, or replace a clinician.',
      'Do not use generated content as an emergency triage substitute.',
      'Every recommendation requires qualified clinician approval before patient use.',
    ],
    requires_clinician_approval: true,
    disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
  };
}

function digestAssessment(input, assessment) {
  return crypto.createHash('sha256').update(JSON.stringify({ input, assessment })).digest('hex');
}

async function persistAssessment(userId, input, assessment, claudeDraft) {
  const pool = getPostgreSQL();
  if (!pool) throw new Error('Clinical decision support requires an initialized database');
  const result = await pool.query(
    `INSERT INTO clinical_nutrition_assessments
      (user_id, input_context, deterministic_assessment, claude_draft, assessment_hash, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, created_at, assessment_hash, status`,
    [userId, input, assessment, claudeDraft, digestAssessment(input, assessment), assessment.status]
  );
  return result.rows[0];
}

async function createClaudeDraft(input, assessment) {
  const response = await claudeAICoordinator.coordinateAIRequest({
    requestType: 'analytical',
    query: JSON.stringify({ task: 'Format a clinician-review draft from this deterministic assessment.', patient_context: input, deterministic_assessment: assessment, hard_rules: ['Do not diagnose.', 'Do not prescribe or recommend doses.', 'Do not invent facts or citations.', 'Repeat escalation and clinician approval requirements.'] }),
    context: { domain: 'clinical_nutrition', safety_mode: 'clinician_review_only' },
  });
  return { provider: 'claude', content: response.response, requires_clinician_approval: true };
}

router.post('/assess', authMiddleware, rateLimiter, async (req, res, next) => {
  try {
    const input = req.body?.patient_context || req.body;
    const assessment = buildAssessment(input);
    const claudeDraft = req.body?.include_claude_draft === true && assessment.status !== 'urgent_escalation'
      ? await createClaudeDraft(input, assessment)
      : null;
    const record = await persistAssessment(req.user.id, input, assessment, claudeDraft);
    res.status(201).json({ ...assessment, assessment_id: record.id, assessment_hash: record.assessment_hash, created_at: record.created_at, claude_draft: claudeDraft });
  } catch (error) {
    next(error);
  }
});

module.exports = { router, buildAssessment, detectRedFlags, detectContraindications };
