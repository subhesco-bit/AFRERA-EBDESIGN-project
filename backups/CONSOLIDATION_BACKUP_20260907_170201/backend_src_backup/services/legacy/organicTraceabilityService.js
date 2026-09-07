/**
 * Organic Traceability Service
 * Manages end-to-end organic traceability from seed to consumer
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../database/pool');

// ============================================================================
// ORGANIC FARM REGISTRY
// ============================================================================

/**
 * Register organic farm
 */
async function registerOrganicFarm(data) {
  const {
    farmer_id,
    farm_name,
    certification_standard_id,
    total_area_hectares,
    organic_area_hectares,
    location_id,
    gps_coordinates
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO organic_farms 
       (farm_id, farmer_id, farm_name, certification_standard_id, total_area_hectares, 
        organic_area_hectares, location_id, gps_coordinates, certification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [
        `ORG-${Date.now()}`,
        farmer_id,
        farm_name,
        certification_standard_id,
        total_area_hectares,
        organic_area_hectares,
        location_id,
        JSON.stringify(gps_coordinates)
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Register organic farm error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to register organic farm
 */
router.post('/farms', authMiddleware, async (req, res) => {
  try {
    const result = await registerOrganicFarm(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Register farm API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to register organic farm' });
  }
});

/**
 * Get organic farms for a farmer
 */
async function getOrganicFarms(farmerId) {
  try {
    const result = await pool.query(
      `SELECT of.*, os.name as standard_name, os.code as standard_code,
       a.city, a.state, a.pincode
       FROM organic_farms of
       LEFT JOIN organic_standards os ON of.certification_standard_id = os.id
       LEFT JOIN addresses a ON of.location_id = a.id
       WHERE of.farmer_id = $1
       ORDER BY of.created_at DESC`,
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Get organic farms error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get organic farms
 */
router.get('/farms', authMiddleware, async (req, res) => {
  try {
    const result = await getOrganicFarms(req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('Get farms API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get organic farms' });
  }
});

// ============================================================================
// ORGANIC PLOTS
// ============================================================================

/**
 * Add organic plot
 */
async function addOrganicPlot(data) {
  const {
    organic_farm_id,
    plot_number,
    plot_name,
    area_hectares,
    certification_status,
    gps_boundary,
    soil_type,
    irrigation_type
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO organic_plots 
       (organic_farm_id, plot_number, plot_name, area_hectares, certification_status, 
        gps_boundary, soil_type, irrigation_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        organic_farm_id,
        plot_number,
        plot_name,
        area_hectares,
        certification_status,
        JSON.stringify(gps_boundary),
        soil_type,
        irrigation_type
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Add organic plot error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to add organic plot
 */
router.post('/plots', authMiddleware, async (req, res) => {
  try {
    const result = await addOrganicPlot(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Add plot API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to add organic plot' });
  }
});

/**
 * Get plots for a farm
 */
async function getOrganicPlots(farmId) {
  try {
    const result = await pool.query(
      'SELECT * FROM organic_plots WHERE organic_farm_id = $1 ORDER BY plot_number',
      [farmId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Get organic plots error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get plots
 */
router.get('/farms/:farmId/plots', authMiddleware, async (req, res) => {
  try {
    const result = await getOrganicPlots(req.params.farmId);
    res.json(result);
  } catch (error) {
    logger.error('Get plots API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get organic plots' });
  }
});

// ============================================================================
// ORGANIC CROP PRODUCTION
// ============================================================================

/**
 * Record organic crop
 */
async function recordOrganicCrop(data) {
  const {
    organic_plot_id,
    crop_name,
    variety,
    planting_date,
    expected_harvest_date,
    area_hectares,
    expected_yield_kg_per_hectare,
    seed_source,
    seed_lot_number,
    cultivation_practices,
    pest_management_practices,
    soil_management_practices,
    water_management_practices
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO organic_crops 
       (organic_plot_id, crop_name, variety, planting_date, expected_harvest_date, 
        area_hectares, expected_yield_kg_per_hectare, seed_source, seed_lot_number,
        cultivation_practices, pest_management_practices, soil_management_practices, 
        water_management_practices, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'growing')
       RETURNING *`,
      [
        organic_plot_id,
        crop_name,
        variety,
        planting_date,
        expected_harvest_date,
        area_hectares,
        expected_yield_kg_per_hectare,
        seed_source,
        seed_lot_number,
        JSON.stringify(cultivation_practices),
        JSON.stringify(pest_management_practices),
        JSON.stringify(soil_management_practices),
        JSON.stringify(water_management_practices)
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Record organic crop error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to record organic crop
 */
router.post('/crops', authMiddleware, async (req, res) => {
  try {
    const result = await recordOrganicCrop(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Record crop API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record organic crop' });
  }
});

/**
 * Record harvest
 */
async function recordHarvest(data) {
  const {
    organic_crop_id,
    harvest_date,
    total_quantity_kg,
    grade,
    moisture_content,
    quality_parameters,
    harvested_by,
    storage_location
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO organic_harvests 
       (organic_crop_id, harvest_number, harvest_date, total_quantity_kg, grade,
        moisture_content, quality_parameters, harvested_by, storage_location, batch_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        organic_crop_id,
        `HVST-${Date.now()}`,
        harvest_date,
        total_quantity_kg,
        grade,
        moisture_content,
        JSON.stringify(quality_parameters),
        harvested_by,
        storage_location,
        `BATCH-${Date.now()}`
      ]
    );

    // Update crop status
    await pool.query(
      'UPDATE organic_crops SET actual_harvest_date = $1, actual_yield_kg = $2, status = $3 WHERE id = $4',
      [harvest_date, total_quantity_kg, 'harvested', organic_crop_id]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Record harvest error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to record harvest
 */
router.post('/harvests', authMiddleware, async (req, res) => {
  try {
    const result = await recordHarvest(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Record harvest API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record harvest' });
  }
});

// ============================================================================
// CHAIN OF CUSTODY
// ============================================================================

/**
 * Record chain of custody transfer
 */
async function recordChainOfCustody(data) {
  const {
    product_id,
    lot_number,
    current_holder_type,
    current_holder_id,
    custody_transfer_date,
    transfer_from_type,
    transfer_from_id,
    quantity_kg,
    document_reference
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO organic_chain_of_custody 
       (product_id, lot_number, current_holder_type, current_holder_id, 
        custody_transfer_date, transfer_from_type, transfer_from_id, quantity_kg, document_reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        product_id,
        lot_number,
        current_holder_type,
        current_holder_id,
        custody_transfer_date,
        transfer_from_type,
        transfer_from_id,
        quantity_kg,
        document_reference
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Record chain of custody error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to record chain of custody
 */
router.post('/chain-of-custody', authMiddleware, async (req, res) => {
  try {
    const result = await recordChainOfCustody(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Record chain of custody API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record chain of custody' });
  }
});

/**
 * Get chain of custody for a product
 */
async function getChainOfCustody(productId, lotNumber) {
  try {
    const result = await pool.query(
      `SELECT * FROM organic_chain_of_custody 
       WHERE product_id = $1 OR lot_number = $2
       ORDER BY custody_transfer_date ASC`,
      [productId, lotNumber]
    );
    return result.rows;
  } catch (error) {
    logger.error('Get chain of custody error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get chain of custody
 */
router.get('/chain-of-custody/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { lot_number } = req.query;
    const result = await getChainOfCustody(productId, lot_number);
    res.json(result);
  } catch (error) {
    logger.error('Get chain of custody API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get chain of custody' });
  }
});

// ============================================================================
// CONSUMER TRANSPARENCY (QR CODE)
// ============================================================================

/**
 * Generate QR code data for consumer transparency
 */
async function generateQRCodeData(productId, lotNumber) {
  try {
    const result = await pool.query(
      'SELECT generate_organic_qr_data($1, $2) as qr_data',
      [productId, lotNumber]
    );

    if (result.rows.length === 0 || !result.rows[0].qr_data) {
      throw new Error('No organic traceability data found');
    }

    return result.rows[0].qr_data;
  } catch (error) {
    logger.error('Generate QR code data error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to generate QR code data
 */
router.get('/qr-data/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { lot_number } = req.query;
    const result = await generateQRCodeData(productId, lot_number);
    res.json(result);
  } catch (error) {
    logger.error('Generate QR data API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate QR code data' });
  }
});

/**
 * Save consumer transparency record
 */
async function saveConsumerTransparency(data) {
  const {
    product_id,
    lot_number,
    qr_code,
    farmer_name,
    farm_location,
    farm_certification_number,
    harvest_date,
    processing_facility,
    processing_date,
    packaging_date,
    ingredients,
    nutritional_info,
    organic_certification_details,
    chain_of_custody_summary,
    quality_test_results
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO organic_consumer_transparency 
       (product_id, lot_number, qr_code, farmer_name, farm_location, 
        farm_certification_number, harvest_date, processing_facility, processing_date,
        packaging_date, ingredients, nutritional_info, organic_certification_details,
        chain_of_custody_summary, quality_test_results)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        product_id,
        lot_number,
        qr_code,
        farmer_name,
        farm_location,
        farm_certification_number,
        harvest_date,
        processing_facility,
        processing_date,
        packaging_date,
        JSON.stringify(ingredients),
        JSON.stringify(nutritional_info),
        JSON.stringify(organic_certification_details),
        JSON.stringify(chain_of_custody_summary),
        JSON.stringify(quality_test_results)
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Save consumer transparency error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to save consumer transparency
 */
router.post('/consumer-transparency', authMiddleware, async (req, res) => {
  try {
    const result = await saveConsumerTransparency(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Save consumer transparency API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to save consumer transparency data' });
  }
});

/**
 * Get consumer transparency by QR code
 */
async function getConsumerTransparencyByQR(qrCode) {
  try {
    const result = await pool.query(
      'SELECT * FROM organic_consumer_transparency WHERE qr_code = $1',
      [qrCode]
    );

    if (result.rows.length === 0) {
      throw new Error('QR code not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get consumer transparency error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get consumer transparency by QR code (public endpoint)
 */
router.get('/consumer-transparency/qr/:qrCode', async (req, res) => {
  try {
    const result = await getConsumerTransparencyByQR(req.params.qrCode);
    res.json(result);
  } catch (error) {
    logger.error('Get consumer transparency API error', { error: error.message, stack: error.stack });
    res.status(404).json({ error: 'QR code not found' });
  }
});

// ============================================================================
// ORGANIC STANDARDS
// ============================================================================

/**
 * Get all organic standards
 */
async function getOrganicStandards() {
  try {
    const result = await pool.query(
      'SELECT * FROM organic_standards WHERE is_active = true ORDER BY name'
    );
    return result.rows;
  } catch (error) {
    logger.error('Get organic standards error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get organic standards
 */
router.get('/standards', async (req, res) => {
  try {
    const result = await getOrganicStandards();
    res.json(result);
  } catch (error) {
    logger.error('Get standards API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get organic standards' });
  }
});

// ============================================================================
// ORGANIC FRAUD ALERTS
// ============================================================================

/**
 * Report organic fraud
 */
async function reportFraud(data) {
  const {
    alert_type,
    severity,
    entity_type,
    entity_id,
    description,
    evidence
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO organic_fraud_alerts 
       (alert_type, severity, entity_type, entity_id, description, evidence)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        alert_type,
        severity,
        entity_type,
        entity_id,
        description,
        JSON.stringify(evidence)
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Report fraud error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to report fraud
 */
router.post('/fraud-alerts', authMiddleware, async (req, res) => {
  try {
    const result = await reportFraud(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Report fraud API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to report fraud' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

function isHealthy() {
  return pool.connect().then(() => true).catch(() => false);
}


// ===========================================================================
// FOLU (Forest, Land and Use) + NE organic schemes — migration 991.
//
// EXTENDED HERE RATHER THAN IN A NEW SERVICE. The FOLU tables describe land use
// and its carbon consequences for the same parcels this service already
// certifies as organic; a separate foluService would end up re-reading
// organic_plots, re-deriving certification state, and drifting from it. One
// subject, one owner.
// ===========================================================================

/**
 * Register a land parcel for land-use tracking.
 *
 * `jhum_cycle_years` is the North East specific part. Jhum (shifting
 * cultivation) is not deforestation — it is a rotation, and the fallow is part
 * of the system. A model that counts every jhum clearing as forest loss will
 * report the North East as catastrophically deforesting while describing a
 * practice that has been carbon-neutral over its cycle for centuries. The
 * cycle length is what separates the two: a shortening cycle IS degradation.
 */
async function registerLandParcel(p) {
  const { rows } = await pool.query(
    `INSERT INTO folu_land_parcels
       (parcel_code, farmer_id, village, district, state, area_hectares,
        land_use_class, jhum_cycle_years, forest_cover_pct, slope_pct,
        data_provenance)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (parcel_code) DO UPDATE SET
       land_use_class = EXCLUDED.land_use_class,
       forest_cover_pct = EXCLUDED.forest_cover_pct
     RETURNING *`,
    [p.parcelCode, p.farmerId ?? null, p.village ?? null, p.district ?? null,
      p.state ?? null, p.areaHectares, p.landUseClass, p.jhumCycleYears ?? null,
      p.forestCoverPct ?? null, p.slopePct ?? null, p.dataProvenance ?? 'estimated']
  );
  return rows[0];
}

/**
 * Record a land-use transition.
 *
 * `is_deforestation` is a GENERATED column in the schema, not a flag a caller
 * sets — the classification must follow from the transition itself, or the
 * number becomes whatever the person entering it wanted it to be.
 */
async function recordLandUseChange(c) {
  const { rows } = await pool.query(
    `INSERT INTO folu_land_use_change
       (parcel_id, from_class, to_class, changed_on, area_affected_ha,
        driver, evidence_source, data_provenance)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [c.parcelId, c.fromClass, c.toClass, c.changedOn ?? new Date(),
      c.areaAffectedHa, c.driver ?? null, c.evidenceSource ?? null,
      c.dataProvenance ?? 'estimated']
  );
  return rows[0];
}

/**
 * Carbon estimate for a parcel.
 *
 * IPCC tier is required and is the honest part of this. Tier 1 uses global
 * default factors and can be wrong by a factor of two for a specific NE hill
 * soil; Tier 3 uses measured local data. Reporting a Tier 1 estimate without
 * saying so invites it into a carbon credit claim it cannot support.
 */
async function estimateCarbon(e) {
  const { rows } = await pool.query(
    `INSERT INTO folu_carbon_estimates
       (parcel_id, assessment_year, above_ground_biomass_tco2e,
        below_ground_biomass_tco2e, soil_organic_carbon_tco2e,
        ipcc_tier, method, uncertainty_pct, data_provenance)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [e.parcelId, e.assessmentYear, e.aboveGroundTco2e ?? null,
      e.belowGroundTco2e ?? null, e.soilCarbonTco2e ?? null,
      e.ipccTier, e.method ?? null, e.uncertaintyPct ?? null,
      e.dataProvenance ?? 'assumed']
  );
  return {
    ...rows[0],
    caveat: Number(e.ipccTier) === 1
      ? 'IPCC Tier 1 uses global default factors. For a specific North East hill '
      + 'soil these can be wrong by a factor of two. Not sufficient evidence for a '
      + 'carbon credit claim.'
      : null,
  };
}

/** Land-use summary for a district, with the jhum distinction preserved. */
async function landUseSummary({ state, district }) {
  const { rows } = await pool.query(
    `SELECT land_use_class,
            COUNT(*)                    AS parcels,
            SUM(area_hectares)          AS area_ha,
            AVG(forest_cover_pct)       AS mean_forest_cover_pct,
            AVG(jhum_cycle_years)       AS mean_jhum_cycle_years
       FROM folu_land_parcels
      WHERE ($1::text IS NULL OR state = $1)
        AND ($2::text IS NULL OR district = $2)
      GROUP BY land_use_class`,
    [state ?? null, district ?? null]
  );
  const { rows: changes } = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE is_deforestation) AS deforestation_events,
            COUNT(*)                                 AS total_changes,
            SUM(area_affected_ha) FILTER (WHERE is_deforestation) AS deforested_ha
       FROM folu_land_use_change c
       JOIN folu_land_parcels p ON p.id = c.parcel_id
      WHERE ($1::text IS NULL OR p.state = $1)
        AND ($2::text IS NULL OR p.district = $2)`,
    [state ?? null, district ?? null]
  );
  const jhum = rows.filter((r) => /jhum|shifting/i.test(r.land_use_class || ''));
  const shortCycle = jhum.some((r) => r.mean_jhum_cycle_years !== null
                                   && Number(r.mean_jhum_cycle_years) < 7);
  return {
    state: state ?? null,
    district: district ?? null,
    byLandUse: rows,
    changes: changes[0],
    jhumNote: jhum.length
      ? (shortCycle
        ? 'Mean jhum cycle is under 7 years. A SHORTENING cycle is genuine degradation — '
        + 'the fallow no longer restores what the clearing removed. This is the signal '
        + 'worth acting on, not the clearing itself.'
        : 'Jhum parcels present with a cycle length that allows fallow recovery. Counting '
        + 'these clearings as deforestation would misreport a rotation as permanent loss.')
      : null,
  };
}

/** NE organic scheme enrolment for a farmer, with the scheme's own rules. */
async function organicSchemeStatus(farmerId) {
  const { rows } = await pool.query(
    `SELECT e.*, s.scheme_code, s.scheme_name, s.conversion_years_required,
            s.certification_body, s.subsidy_per_ha_inr
       FROM ne_organic_enrolment e
       JOIN ne_organic_schemes s ON s.id = e.scheme_id
      WHERE e.farmer_id = $1
      ORDER BY e.enrolled_on DESC`,
    [farmerId]
  );
  return {
    farmerId,
    enrolments: rows.map((r) => {
      const started = r.conversion_started_on ? new Date(r.conversion_started_on) : null;
      const yearsIn = started ? (Date.now() - started) / (365.25 * 86400000) : null;
      const required = Number(r.conversion_years_required || 3);
      return {
        ...r,
        yearsIntoConversion: yearsIn === null ? null : Math.round(yearsIn * 100) / 100,
        conversionComplete: yearsIn !== null && yearsIn >= required,
        // The conversion period is the whole point of organic certification and
        // the hardest part for a farmer: reduced yield without the price premium.
        note: yearsIn !== null && yearsIn < required
          ? `${Math.round((required - yearsIn) * 10) / 10} years of conversion remaining. `
          + 'Produce cannot be sold as certified organic until then — this is the period '
          + 'where a farmer carries the cost without the premium.'
          : null,
      };
    }),
    count: rows.length,
  };
}

module.exports = {
  router,
  registerOrganicFarm,
  getOrganicFarms,
  addOrganicPlot,
  getOrganicPlots,
  recordOrganicCrop,
  recordHarvest,
  recordChainOfCustody,
  getChainOfCustody,
  generateQRCodeData,
  saveConsumerTransparency,
  getConsumerTransparencyByQR,
  getOrganicStandards,
  reportFraud,
  isHealthy,
  // FOLU + NE organic schemes (991). Extended into this service rather than
  // split into a parallel one — same parcels, same certification state.
  registerLandParcel,
  recordLandUseChange,
  estimateCarbon,
  landUseSummary,
  organicSchemeStatus
};
