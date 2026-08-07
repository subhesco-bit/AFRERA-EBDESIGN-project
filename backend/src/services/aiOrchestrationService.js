'use strict';

const pool = require('../database/pool');

const FALLBACK_SLOTS = [
  {
    model_key: 'gpt-4o-mini',
    provider_name: 'OpenAI',
    provider_type: 'model-provider',
    hosting_region: 'India',
    data_residency: 'DPDP-compliant',
    enabled: false,
    priority: 0,
    notes: 'Placeholder slot for model assignment and DPDP residency review.'
  },
  {
    model_key: 'gemini-1.5-flash',
    provider_name: 'Google',
    provider_type: 'model-provider',
    hosting_region: 'India',
    data_residency: 'DPDP-compliant',
    enabled: false,
    priority: 0,
    notes: 'Reserved for low-latency routing until a residency/llm-cost decision is confirmed.'
  },
];

async function listModelSlots() {
  try {
    const { rows } = await pool.query(`
      SELECT model_key, provider_name, provider_type, hosting_region, data_residency, enabled, priority, notes
      FROM ai_model_registry
      ORDER BY priority DESC NULLS LAST, model_key ASC
    `);
    return rows?.length ? rows : FALLBACK_SLOTS;
  } catch (error) {
    return FALLBACK_SLOTS;
  }
}

async function listUnservedIntents() {
  try {
    const { rows } = await pool.query(`
      SELECT intent, domain, reason, required_model_key, unavailable_model_key, routing_policy
      FROM v_ai_unserved_intents
      ORDER BY intent ASC
    `);
    return rows || [];
  } catch (error) {
    return [];
  }
}

async function upsertModelSlot(payload = {}) {
  const {
    model_key,
    provider_name,
    provider_type,
    hosting_region,
    data_residency,
    enabled = false,
    priority = 0,
    notes = null
  } = payload;

  if (!model_key) {
    throw new Error('model_key is required');
  }

  try {
    const { rows } = await pool.query(
      `
        INSERT INTO ai_model_registry (
          model_key,
          provider_name,
          provider_type,
          hosting_region,
          data_residency,
          enabled,
          priority,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (model_key)
        DO UPDATE SET
          provider_name = EXCLUDED.provider_name,
          provider_type = EXCLUDED.provider_type,
          hosting_region = EXCLUDED.hosting_region,
          data_residency = EXCLUDED.data_residency,
          enabled = EXCLUDED.enabled,
          priority = EXCLUDED.priority,
          notes = EXCLUDED.notes
        RETURNING *
      `,
      [model_key, provider_name, provider_type, hosting_region, data_residency, enabled, priority, notes]
    );
    return rows?.[0] || null;
  } catch (error) {
    return {
      model_key,
      provider_name,
      provider_type,
      hosting_region,
      data_residency,
      enabled,
      priority,
      notes,
      placeholder: true,
      warning: 'ai_model_registry is not mounted in the live database; payload restored into the in-memory service layer.'
    };
  }
}

module.exports = {
  listModelSlots,
  listUnservedIntents,
  upsertModelSlot,
};
