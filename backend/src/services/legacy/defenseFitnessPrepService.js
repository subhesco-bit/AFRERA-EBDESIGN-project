/**
 * Defense/Police/Border-Security Recruitment Fitness Prep Service.
 *
 * Read migration 9999_zzzzzzzzzzzz_defense_fitness_prep_schema.sql first —
 * this is a self-prep comparison tool only. It has no connection to any
 * actual recruitment/selection system, and never will unless AFRERA enters
 * a real institutional partnership (out of scope for code). A user's
 * comparison here never leaves AFRERA.
 *
 * USP framing: ties together three things already built this session —
 * wearableIntegrationService (real activity data), nutritionIntelligenceService
 * (diet/recipe AI), and this real, sourced standards table — into "train and
 * eat toward a published, cited physical standard," not a vague fitness app.
 */

const { getPostgreSQL } = require('../../database/connection');
const { logger } = require('../../utils/logger');

async function getStandardCategories() {
  const pg = getPostgreSQL();
  const { rows } = await pg.query(
    `SELECT DISTINCT category, force_name FROM defense_fitness_standards ORDER BY force_name`
  );
  return rows;
}

async function getStandardsForCategory(category, gender) {
  const pg = getPostgreSQL();
  const { rows } = await pg.query(
    `SELECT test_component, threshold_value, threshold_type, unit, notes, source_url, last_verified_date
     FROM defense_fitness_standards
     WHERE category = $1 AND (gender = $2 OR gender = 'any')
     ORDER BY test_component`,
    [category, gender]
  );
  return rows;
}

/** Record a self-reported or wearable-derived test attempt. */
async function recordAttempt(userId, category, testComponent, recordedValue, source = 'manual') {
  const pg = getPostgreSQL();
  const { rows } = await pg.query(
    `INSERT INTO defense_fitness_prep_attempts (user_id, category, test_component, recorded_value, source)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, recorded_at`,
    [userId, category, testComponent, recordedValue, source]
  );
  return rows[0];
}

/**
 * Compare a user's most recent attempt per component against the real
 * published standard for that category/gender. Never fabricates a verdict
 * for a component the user hasn't attempted — returns null for those.
 */
async function getReadinessComparison(userId, category, gender) {
  const pg = getPostgreSQL();
  const standards = await getStandardsForCategory(category, gender);

  const { rows: attempts } = await pg.query(
    `SELECT DISTINCT ON (test_component) test_component, recorded_value, source, recorded_at
     FROM defense_fitness_prep_attempts
     WHERE user_id = $1 AND category = $2
     ORDER BY test_component, recorded_at DESC`,
    [userId, category]
  );
  const latestByComponent = Object.fromEntries(attempts.map((a) => [a.test_component, a]));

  return standards.map((s) => {
    const attempt = latestByComponent[s.test_component];
    if (!attempt) {
      return { ...s, your_value: null, meets_standard: null, latest_attempt_at: null };
    }
    const meets = s.threshold_type === 'max_time_seconds'
      ? Number(attempt.recorded_value) <= Number(s.threshold_value)
      : Number(attempt.recorded_value) >= Number(s.threshold_value);
    return {
      ...s,
      your_value: Number(attempt.recorded_value),
      meets_standard: s.threshold_value === null ? null : meets,
      recorded_via: attempt.source,
      latest_attempt_at: attempt.recorded_at,
    };
  });
}

module.exports = {
  getStandardCategories,
  getStandardsForCategory,
  recordAttempt,
  getReadinessComparison,
};
