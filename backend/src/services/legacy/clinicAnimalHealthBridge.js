/**
 * Clinic → Animal Health bridge — non-generic integration.
 *
 * Loads real examinations, outbreaks, and quarantines from animalHealthService
 * so advisory consults are grounded in recorded clinical data when available.
 */

'use strict';

const animalHealthService = require('./animalHealthService');
const { logger } = require('../../utils/logger');

const nowIso = () => new Date().toISOString();
const unavailable = (note) => ({ source: 'unavailable', verified: false, asOf: nowIso(), note: note || null });
const fromDb = (note) => ({ source: 'db', verified: true, asOf: nowIso(), note: note || null });

/** Map clinic species keys → animal_health animal_type filters (case-insensitive match). */
const SPECIES_TO_ANIMAL_TYPE = {
  cow: 'Cattle',
  buffalo: 'Cattle',
  goat: 'Goat',
  sheep: 'Sheep',
  pig: 'Pig',
  horse: 'Other',
  poultry: 'Poultry',
  fish: null,
  plant: null,
  tree: null,
  soil: null,
};

function mapAnimalType(speciesKey) {
  return SPECIES_TO_ANIMAL_TYPE[String(speciesKey || '').toLowerCase()] || null;
}

/**
 * Fetch health context for a species. Never invents exam findings.
 */
async function loadHealthContext(speciesKey, { limit = 8 } = {}) {
  const animalType = mapAnimalType(speciesKey);
  if (!animalType) {
    return {
      applicable: false,
      animalType: null,
      examinations: [],
      outbreaks: [],
      quarantines: [],
      summaryText: null,
      provenance: {
        'clinic.healthContext': unavailable(`Species ${speciesKey} has no animal_health mapping`),
      },
    };
  }

  const provenance = {};
  let examinations = [];
  let outbreaks = [];
  let quarantines = [];

  try {
    const examResult = await animalHealthService.listExaminations({
      page: 1,
      limit,
      animal_type: animalType,
    });
    examinations = examResult.rows || examResult.examinations || examResult.data || examResult || [];
    if (!Array.isArray(examinations)) examinations = [];
    provenance['clinic.healthContext.examinations'] = fromDb(`${examinations.length} examination(s)`);
  } catch (e) {
    logger.warn('clinic health exams load failed', { error: e.message });
    provenance['clinic.healthContext.examinations'] = unavailable(e.message);
  }

  try {
    const outbreakResult = await animalHealthService.listOutbreaks({
      page: 1,
      limit: 5,
      affected_animal_type: animalType,
    });
    outbreaks = outbreakResult.rows || outbreakResult.outbreaks || outbreakResult.data || outbreakResult || [];
    if (!Array.isArray(outbreaks)) outbreaks = [];
    // Prefer active-looking rows when status present
    outbreaks = outbreaks.filter((o) => {
      if (!o.status) return true;
      const s = String(o.status).toLowerCase();
      return !['closed', 'resolved', 'ended'].includes(s);
    });
    provenance['clinic.healthContext.outbreaks'] = fromDb(`${outbreaks.length} outbreak(s)`);
  } catch (e) {
    logger.warn('clinic outbreaks load failed', { error: e.message });
    provenance['clinic.healthContext.outbreaks'] = unavailable(e.message);
  }

  try {
    const qResult = await animalHealthService.listQuarantines({
      page: 1,
      limit: 5,
      animal_type: animalType,
      status: 'Active',
    });
    quarantines = qResult.rows || qResult.quarantines || qResult.data || qResult || [];
    if (!Array.isArray(quarantines)) quarantines = [];
    provenance['clinic.healthContext.quarantines'] = fromDb(`${quarantines.length} quarantine(s)`);
  } catch (e) {
    logger.warn('clinic quarantines load failed', { error: e.message });
    provenance['clinic.healthContext.quarantines'] = unavailable(e.message);
  }

  const summaryParts = [];
  if (examinations.length) {
    summaryParts.push(
      `Recent examinations (${examinations.length}): ` +
      examinations.slice(0, 5).map((ex) => {
        const date = ex.examination_date || ex.created_at || 'unknown date';
        const findings = ex.findings || ex.diagnosis || ex.notes || 'no findings text';
        const status = ex.health_status || '';
        return `[${date}] ${status} ${String(findings).slice(0, 120)}`;
      }).join(' | '),
    );
  }
  if (outbreaks.length) {
    summaryParts.push(
      `Active/open outbreaks (${outbreaks.length}): ` +
      outbreaks.slice(0, 3).map((o) =>
        `${o.disease_name || 'unnamed'} severity=${o.severity || 'n/a'} affected=${o.affected_count || '?'}`
      ).join(' | '),
    );
  }
  if (quarantines.length) {
    summaryParts.push(`Active quarantines: ${quarantines.length}`);
  }
  if (!summaryParts.length) {
    summaryParts.push(`No recorded examinations/outbreaks/quarantines for animal_type=${animalType} in animal_health tables.`);
  }

  return {
    applicable: true,
    animalType,
    examinations: examinations.slice(0, limit),
    outbreaks: outbreaks.slice(0, 5),
    quarantines: quarantines.slice(0, 5),
    summaryText: summaryParts.join('\n'),
    provenance,
    recordLinks: {
      animalHealthHref: '/animal-health',
      createExaminationHint: {
        species: animalType,
        examination_type: 'Follow-up',
      },
    },
  };
}

module.exports = {
  SPECIES_TO_ANIMAL_TYPE,
  mapAnimalType,
  loadHealthContext,
};
