/**
 * MEP → BOQ bridge — non-generic integration with engineeringProjectService.
 *
 * Maps facility MEP design packages to BOQ line templates. Rates come only from:
 *   1) caller-supplied unitRate, or
 *   2) material_prices / labor_rates / equipment_rates via createCostEstimate
 *
 * Never invents ₹ amounts. Unresolved rates → same failure contract as
 * engineeringProjectService (UNRESOLVED_RATES).
 */

'use strict';

const engineeringProjectService = require('./engineeringProjectService');
const { logger } = require('../../utils/logger');

const nowIso = () => new Date().toISOString();

/**
 * BOQ templates keyed by facilityType.
 * quantity defaults are planning placeholders; caller may override via quantityOverrides.
 * rateCode is optional — without unitRate/rateCode the dry-run lists the gap.
 */
const BOQ_TEMPLATES = {
  cold_storage: [
    {
      category: 'insulation',
      subcategory: 'envelope',
      description: 'Insulated sandwich panel system (walls/ceiling) — supply & fix',
      unit: 'm2',
      quantity: 400,
      rateSource: 'material',
      rateCode: 'INS_PANEL_PIR_80',
      itemCode: 'MEP-CS-INS-01',
    },
    {
      category: 'refrigeration',
      subcategory: 'plant',
      description: 'Refrigeration plant package (compressor/condenser/evaporator interface)',
      unit: 'lot',
      quantity: 1,
      rateSource: 'equipment',
      rateCode: 'REF_PLANT_COLD_PKG',
      itemCode: 'MEP-CS-REF-01',
    },
    {
      category: 'electrical',
      subcategory: 'power',
      description: 'Cold room power distribution, controls & sensor circuits',
      unit: 'lot',
      quantity: 1,
      rateSource: 'labor',
      rateCode: 'ELEC_INSTALL_INDUSTRIAL',
      itemCode: 'MEP-CS-EL-01',
    },
    {
      category: 'electrical',
      subcategory: 'standby',
      description: 'Standby power interface for refrigeration priority loads',
      unit: 'lot',
      quantity: 1,
      rateSource: 'equipment',
      rateCode: 'GEN_INTERFACE_COLD',
      itemCode: 'MEP-CS-EL-02',
    },
    {
      category: 'plumbing',
      subcategory: 'drains',
      description: 'Condensate / defrost drain piping and traps',
      unit: 'm',
      quantity: 60,
      rateSource: 'material',
      rateCode: 'PIPE_PVC_DRAIN_50',
      itemCode: 'MEP-CS-PL-01',
    },
  ],
  dairy: [
    {
      category: 'refrigeration',
      subcategory: 'milk_cooling',
      description: 'Milk cooling plant interface',
      unit: 'lot',
      quantity: 1,
      rateSource: 'equipment',
      rateCode: 'MILK_COOL_PKG',
      itemCode: 'MEP-DY-REF-01',
    },
    {
      category: 'plumbing',
      subcategory: 'cip',
      description: 'Hot/cold water and CIP piping for dairy hygiene',
      unit: 'lot',
      quantity: 1,
      rateSource: 'material',
      rateCode: 'CIP_PIPE_SS',
      itemCode: 'MEP-DY-PL-01',
    },
    {
      category: 'electrical',
      subcategory: 'process',
      description: 'Milking / process equipment power and isolation',
      unit: 'lot',
      quantity: 1,
      rateSource: 'labor',
      rateCode: 'ELEC_INSTALL_INDUSTRIAL',
      itemCode: 'MEP-DY-EL-01',
    },
  ],
  polyhouse: [
    {
      category: 'mechanical',
      subcategory: 'climate',
      description: 'Climate control / fan-pad package interface',
      unit: 'lot',
      quantity: 1,
      rateSource: 'equipment',
      rateCode: 'POLY_CLIMATE_PKG',
      itemCode: 'MEP-PH-M-01',
    },
    {
      category: 'plumbing',
      subcategory: 'irrigation',
      description: 'Irrigation manifold and drainage',
      unit: 'lot',
      quantity: 1,
      rateSource: 'material',
      rateCode: 'IRRIG_MANIFOLD',
      itemCode: 'MEP-PH-PL-01',
    },
    {
      category: 'electrical',
      subcategory: 'controls',
      description: 'Polyhouse controls and sensor power',
      unit: 'lot',
      quantity: 1,
      rateSource: 'labor',
      rateCode: 'ELEC_INSTALL_AGRI',
      itemCode: 'MEP-PH-EL-01',
    },
  ],
  warehouse: [
    {
      category: 'electrical',
      subcategory: 'lighting',
      description: 'Warehouse lighting and distribution',
      unit: 'lot',
      quantity: 1,
      rateSource: 'labor',
      rateCode: 'ELEC_INSTALL_INDUSTRIAL',
      itemCode: 'MEP-WH-EL-01',
    },
    {
      category: 'mechanical',
      subcategory: 'ventilation',
      description: 'Ambient ventilation / exhaust',
      unit: 'lot',
      quantity: 1,
      rateSource: 'equipment',
      rateCode: 'WH_VENT_PKG',
      itemCode: 'MEP-WH-M-01',
    },
  ],
};

function getBoqTemplate(facilityType) {
  return BOQ_TEMPLATES[facilityType] || BOQ_TEMPLATES.warehouse;
}

/**
 * Build draft BOQ lines for a facility. Applies quantityOverrides and unitRateOverrides by itemCode.
 */
function buildDraftBoqLines(facilityType, { quantityOverrides = {}, unitRateOverrides = {} } = {}) {
  const template = getBoqTemplate(facilityType);
  return template.map((line) => {
    const quantity = quantityOverrides[line.itemCode] != null
      ? Number(quantityOverrides[line.itemCode])
      : line.quantity;
    const unitRate = unitRateOverrides[line.itemCode] != null
      ? Number(unitRateOverrides[line.itemCode])
      : undefined;
    return {
      category: line.category,
      subcategory: line.subcategory,
      description: line.description,
      unit: line.unit,
      quantity,
      itemCode: line.itemCode,
      rateSource: line.rateSource,
      rateCode: line.rateCode,
      ...(unitRate !== undefined && Number.isFinite(unitRate) ? { unitRate } : {}),
      specifications: {
        source: 'mep_design_package',
        facilityType,
        generatedAt: nowIso(),
      },
    };
  });
}

/**
 * Dry-run: return lines that would be submitted, without DB writes.
 */
function previewBoqFromMep(facilityType, opts = {}) {
  const items = buildDraftBoqLines(facilityType, opts);
  return {
    facilityType,
    lineCount: items.length,
    items,
    note: 'Draft only. Persist via createEstimateFromMep with projectId and resolvable rates.',
    generatedAt: nowIso(),
  };
}

/**
 * Create a real cost estimate on an engineering project from MEP package.
 * Uses engineeringProjectService.createCostEstimate — same rate resolution rules.
 */
async function createEstimateFromMep({
  facilityType,
  projectId,
  userId,
  isAdmin = false,
  region = null,
  contingencyPercentage = 10,
  quantityOverrides = {},
  unitRateOverrides = {},
  estimateType = 'preliminary',
}) {
  if (!projectId) throw new Error('projectId is required to create a cost estimate');
  if (!userId && !isAdmin) throw new Error('userId is required');

  const items = buildDraftBoqLines(facilityType, { quantityOverrides, unitRateOverrides });

  try {
    const result = await engineeringProjectService.createCostEstimate(
      projectId,
      userId,
      isAdmin,
      { estimateType, region, items, contingencyPercentage },
    );
    logger.info('MEP→BOQ estimate created', {
      projectId,
      facilityType,
      estimateId: result.estimate && result.estimate.id,
    });
    return {
      ok: true,
      facilityType,
      projectId,
      estimate: result.estimate,
      boqItems: result.boqItems,
      draftItems: items,
      generatedAt: nowIso(),
    };
  } catch (error) {
    logger.warn('MEP→BOQ estimate failed', {
      projectId,
      facilityType,
      code: error.code,
      message: error.message,
    });
    return {
      ok: false,
      facilityType,
      projectId,
      error: error.message,
      code: error.code || 'ESTIMATE_FAILED',
      unresolvedLines: error.unresolvedLines || null,
      draftItems: items,
      generatedAt: nowIso(),
      note: error.code === 'UNRESOLVED_RATES'
        ? 'Supply unitRateOverrides for missing rateCodes or seed material_prices/labor_rates/equipment_rates'
        : null,
    };
  }
}

module.exports = {
  BOQ_TEMPLATES,
  getBoqTemplate,
  buildDraftBoqLines,
  previewBoqFromMep,
  createEstimateFromMep,
};
