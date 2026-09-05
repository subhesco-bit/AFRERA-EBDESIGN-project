/**
 * Biodiversity Intelligence Service
 * CAP-217 to CAP-223: Species Database, Native Crops Database, Traditional Varieties Database,
 * Medicinal Plants Database, Wild Foods Database, Conservation Tracking, AI Risk Prediction
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../utils\/logger');
const { authMiddleware, requireRole } = require('../../middleware\/auth');
const { PLATFORM_STAFF_ROLES } = require('../../middleware\/roleGroups');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../database\/pool');

// ============================================================================
// SPECIES DATABASE (CAP-217)
// ============================================================================

/**
 * Create species entry
 */
router.post('/species', authMiddleware, async (req, res) => {
  try {
    const {
      scientific_name,
      common_name,
      family,
      genus,
      species,
      subspecies,
      local_names,
      taxonomy,
      distribution,
      habitat,
      conservation_status,
      population_trend,
      threats,
      ecological_role,
      economic_importance,
      cultural_significance,
      media_files,
      verified_by
    } = req.body;

    const result = await pool.query(
      `INSERT INTO species_database 
       (scientific_name, common_name, family, genus, species, subspecies, 
        local_names, taxonomy, distribution, habitat, conservation_status, 
        population_trend, threats, ecological_role, economic_importance, 
        cultural_significance, media_files, verified_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
       RETURNING *`,
      [
        scientific_name, common_name, family, genus, species, subspecies,
        JSON.stringify(local_names), JSON.stringify(taxonomy),
        JSON.stringify(distribution), habitat, conservation_status,
        population_trend, JSON.stringify(threats), ecological_role,
        JSON.stringify(economic_importance), cultural_significance,
        JSON.stringify(media_files), verified_by
      ]
    );

    logger.info(`Species entry created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create species entry error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create species entry' });
  }
});

/**
 * Get species with filters
 */
router.get('/species', authMiddleware, async (req, res) => {
  try {
    const { family, genus, conservation_status, habitat, search } = req.query;
    
    let query = 'SELECT * FROM species_database WHERE is_verified = true';
    const params = [];
    let paramCount = 0;

    if (family) {
      paramCount++;
      query += ` AND family = $${paramCount}`;
      params.push(family);
    }

    if (genus) {
      paramCount++;
      query += ` AND genus = $${paramCount}`;
      params.push(genus);
    }

    if (conservation_status) {
      paramCount++;
      query += ` AND conservation_status = $${paramCount}`;
      params.push(conservation_status);
    }

    if (habitat) {
      paramCount++;
      query += ` AND habitat @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([habitat]));
    }

    if (search) {
      paramCount++;
      query += ` AND (scientific_name ILIKE $${paramCount} OR common_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get species error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get species' });
  }
});

/**
 * Get species by ID
 */
router.get('/species/:id', authMiddleware, async (req, res) => {
  try {
    let result = await pool.query(
      'SELECT * FROM species_database WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Species not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get species error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get species' });
  }
});

// ============================================================================
// NATIVE CROPS DATABASE (CAP-218)
// ============================================================================

/**
 * Create native crop entry
 */
router.post('/native-crops', authMiddleware, async (req, res) => {
  try {
    const {
      crop_name,
      scientific_name,
      indigenous_names,
      origin_region,
      growing_regions,
      climate_requirements,
      soil_requirements,
      growing_season,
      nutritional_profile,
      culinary_uses,
      cultural_significance,
      traditional_varieties,
      cultivation_practices,
      yield_data,
      pest_disease_profile,
      market_value,
      conservation_status,
      media_files,
      verified_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO native_crops_database 
       (crop_name, scientific_name, indigenous_names, origin_region, growing_regions, 
        climate_requirements, soil_requirements, growing_season, nutritional_profile, 
        culinary_uses, cultural_significance, traditional_varieties, cultivation_practices, 
        yield_data, pest_disease_profile, market_value, conservation_status, 
        media_files, verified_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
       RETURNING *`,
      [
        crop_name, scientific_name, JSON.stringify(indigenous_names),
        origin_region, JSON.stringify(growing_regions),
        JSON.stringify(climate_requirements), JSON.stringify(soil_requirements),
        growing_season, JSON.stringify(nutritional_profile),
        JSON.stringify(culinary_uses), cultural_significance,
        JSON.stringify(traditional_varieties), JSON.stringify(cultivation_practices),
        JSON.stringify(yield_data), JSON.stringify(pest_disease_profile),
        JSON.stringify(market_value), conservation_status,
        JSON.stringify(media_files), verified_by
      ]
    );

    logger.info(`Native crop entry created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create native crop entry error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create native crop entry' });
  }
});

/**
 * Get native crops with filters
 */
router.get('/native-crops', authMiddleware, async (req, res) => {
  try {
    const { region, climate, soil, conservation_status, search } = req.query;
    
    let query = 'SELECT * FROM native_crops_database WHERE is_verified = true';
    let params = [];
    let paramCount = 0;

    if (region) {
      paramCount++;
      query += ` AND growing_regions @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([region]));
    }

    if (climate) {
      paramCount++;
      query += ` AND climate_requirements @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([climate]));
    }

    if (soil) {
      paramCount++;
      query += ` AND soil_requirements @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([soil]));
    }

    if (conservation_status) {
      paramCount++;
      query += ` AND conservation_status = $${paramCount}`;
      params.push(conservation_status);
    }

    if (search) {
      paramCount++;
      query += ` AND (crop_name ILIKE $${paramCount} OR scientific_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get native crops error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get native crops' });
  }
});

// ============================================================================
// TRADITIONAL VARIETIES DATABASE (CAP-219)
// ============================================================================

/**
 * Create traditional variety entry
 */
router.post('/traditional-varieties', authMiddleware, async (req, res) => {
  try {
    const {
      variety_name,
      crop_id,
      scientific_name,
      indigenous_names,
      origin_community,
      region,
      characteristics,
      adaptation_traits,
      genetic_markers,
      cultivation_history,
      seed_saving_practices,
      culinary_properties,
      nutritional_profile,
      resistance_profile,
      yield_characteristics,
      cultural_significance,
      conservation_status,
      seed_availability,
      media_files,
      verified_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO traditional_varieties_database 
       (variety_name, crop_id, scientific_name, indigenous_names, origin_community, 
        region, characteristics, adaptation_traits, genetic_markers, cultivation_history, 
        seed_saving_practices, culinary_properties, nutritional_profile, resistance_profile, 
        yield_characteristics, cultural_significance, conservation_status, seed_availability, 
        media_files, verified_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
       RETURNING *`,
      [
        variety_name, crop_id, scientific_name, JSON.stringify(indigenous_names),
        origin_community, region, JSON.stringify(characteristics),
        JSON.stringify(adaptation_traits), JSON.stringify(genetic_markers),
        cultivation_history, seed_saving_practices,
        JSON.stringify(culinary_properties), JSON.stringify(nutritional_profile),
        JSON.stringify(resistance_profile), JSON.stringify(yield_characteristics),
        cultural_significance, conservation_status, seed_availability,
        JSON.stringify(media_files), verified_by
      ]
    );

    logger.info(`Traditional variety entry created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create traditional variety entry error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create traditional variety entry' });
  }
});

/**
 * Get traditional varieties with filters
 */
router.get('/traditional-varieties', authMiddleware, async (req, res) => {
  try {
    const { crop_id, region, community, conservation_status, search } = req.query;
    
    let query = 'SELECT * FROM traditional_varieties_database WHERE is_verified = true';
    let params = [];
    let paramCount = 0;

    if (crop_id) {
      paramCount++;
      query += ` AND crop_id = $${paramCount}`;
      params.push(crop_id);
    }

    if (region) {
      paramCount++;
      query += ` AND region = $${paramCount}`;
      params.push(region);
    }

    if (community) {
      paramCount++;
      query += ` AND origin_community = $${paramCount}`;
      params.push(community);
    }

    if (conservation_status) {
      paramCount++;
      query += ` AND conservation_status = $${paramCount}`;
      params.push(conservation_status);
    }

    if (search) {
      paramCount++;
      query += ` AND (variety_name ILIKE $${paramCount} OR scientific_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get traditional varieties error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get traditional varieties' });
  }
});

// ============================================================================
// MEDICINAL PLANTS DATABASE (CAP-220)
// ============================================================================

/**
 * Create medicinal plant entry
 */
router.post('/medicinal-plants', authMiddleware, async (req, res) => {
  try {
    const {
      plant_name,
      scientific_name,
      family,
      common_names,
      indigenous_names,
      parts_used,
      active_compounds,
      traditional_uses,
      ailments_treated,
      preparation_methods,
      dosage_guidelines,
      contraindications,
      side_effects,
      scientific_validation,
      cultivation_requirements,
      conservation_status,
      habitat,
      distribution,
      harvest_practices,
      sustainability_status,
      media_files,
      verified_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO medicinal_plants_database 
       (plant_name, scientific_name, family, common_names, indigenous_names, 
        parts_used, active_compounds, traditional_uses, ailments_treated, 
        preparation_methods, dosage_guidelines, contraindications, side_effects, 
        scientific_validation, cultivation_requirements, conservation_status, 
        habitat, distribution, harvest_practices, sustainability_status, 
        media_files, verified_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())
       RETURNING *`,
      [
        plant_name, scientific_name, family, JSON.stringify(common_names),
        JSON.stringify(indigenous_names), JSON.stringify(parts_used),
        JSON.stringify(active_compounds), JSON.stringify(traditional_uses),
        JSON.stringify(ailments_treated), JSON.stringify(preparation_methods),
        dosage_guidelines, contraindications, side_effects,
        JSON.stringify(scientific_validation),
        JSON.stringify(cultivation_requirements), conservation_status,
        habitat, JSON.stringify(distribution), harvest_practices,
        sustainability_status, JSON.stringify(media_files), verified_by
      ]
    );

    logger.info(`Medicinal plant entry created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create medicinal plant entry error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create medicinal plant entry' });
  }
});

/**
 * Get medicinal plants with filters
 */
router.get('/medicinal-plants', authMiddleware, async (req, res) => {
  try {
    const { family, ailment, conservation_status, region, search } = req.query;
    
    let query = 'SELECT * FROM medicinal_plants_database WHERE is_verified = true';
    let params = [];
    let paramCount = 0;

    if (family) {
      paramCount++;
      query += ` AND family = $${paramCount}`;
      params.push(family);
    }

    if (ailment) {
      paramCount++;
      query += ` AND ailments_treated @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([ailment]));
    }

    if (conservation_status) {
      paramCount++;
      query += ` AND conservation_status = $${paramCount}`;
      params.push(conservation_status);
    }

    if (region) {
      paramCount++;
      query += ` AND distribution @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([region]));
    }

    if (search) {
      paramCount++;
      query += ` AND (plant_name ILIKE $${paramCount} OR scientific_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get medicinal plants error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get medicinal plants' });
  }
});

// ============================================================================
// WILD FOODS DATABASE (CAP-221)
// ============================================================================

/**
 * Create wild food entry
 */
router.post('/wild-foods', authMiddleware, async (req, res) => {
  try {
    const {
      food_name,
      scientific_name,
      food_type,
      common_names,
      indigenous_names,
      seasonality,
      habitat,
      distribution,
      harvesting_practices,
      preparation_methods,
      nutritional_profile,
      culinary_uses,
      cultural_significance,
      safety_considerations,
      sustainability_status,
      abundance_level,
      traditional_management,
      conservation_status,
      media_files,
      verified_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO wild_foods_database 
       (food_name, scientific_name, food_type, common_names, indigenous_names, 
        seasonality, habitat, distribution, harvesting_practices, preparation_methods, 
        nutritional_profile, culinary_uses, cultural_significance, safety_considerations, 
        sustainability_status, abundance_level, traditional_management, 
        conservation_status, media_files, verified_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
       RETURNING *`,
      [
        food_name, scientific_name, food_type, JSON.stringify(common_names),
        JSON.stringify(indigenous_names), JSON.stringify(seasonality),
        habitat, JSON.stringify(distribution), harvesting_practices,
        JSON.stringify(preparation_methods), JSON.stringify(nutritional_profile),
        JSON.stringify(culinary_uses), cultural_significance,
        safety_considerations, sustainability_status, abundance_level,
        traditional_management, conservation_status,
        JSON.stringify(media_files), verified_by
      ]
    );

    logger.info(`Wild food entry created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create wild food entry error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create wild food entry' });
  }
});

/**
 * Get wild foods with filters
 */
router.get('/wild-foods', authMiddleware, async (req, res) => {
  try {
    const { food_type, season, habitat, sustainability_status, search } = req.query;
    
    let query = 'SELECT * FROM wild_foods_database WHERE is_verified = true';
    let params = [];
    let paramCount = 0;

    if (food_type) {
      paramCount++;
      query += ` AND food_type = $${paramCount}`;
      params.push(food_type);
    }

    if (season) {
      paramCount++;
      query += ` AND seasonality @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([season]));
    }

    if (habitat) {
      paramCount++;
      query += ` AND habitat = $${paramCount}`;
      params.push(habitat);
    }

    if (sustainability_status) {
      paramCount++;
      query += ` AND sustainability_status = $${paramCount}`;
      params.push(sustainability_status);
    }

    if (search) {
      paramCount++;
      query += ` AND (food_name ILIKE $${paramCount} OR scientific_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get wild foods error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get wild foods' });
  }
});

// ============================================================================
// CONSERVATION TRACKING (CAP-222)
// ============================================================================

/**
 * Create conservation record
 */
router.post('/conservation', authMiddleware, async (req, res) => {
  try {
    const {
      species_id,
      species_type,
      conservation_status,
      population_data,
      threat_assessment,
      conservation_measures,
      protected_areas,
      breeding_programs,
      reintroduction_efforts,
      habitat_restoration,
      community_involvement,
      funding_sources,
      monitoring_methods,
      success_metrics,
      challenges,
      next_steps,
      reported_by,
      verified_by
    } = req.body;

    let result = await pool.query(
      `INSERT INTO conservation_tracking 
       (species_id, species_type, conservation_status, population_data, 
        threat_assessment, conservation_measures, protected_areas, breeding_programs, 
        reintroduction_efforts, habitat_restoration, community_involvement, 
        funding_sources, monitoring_methods, success_metrics, challenges, 
        next_steps, reported_by, verified_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
       RETURNING *`,
      [
        species_id, species_type, conservation_status,
        JSON.stringify(population_data), JSON.stringify(threat_assessment),
        JSON.stringify(conservation_measures), JSON.stringify(protected_areas),
        breeding_programs, reintroduction_efforts, habitat_restoration,
        JSON.stringify(community_involvement), JSON.stringify(funding_sources),
        JSON.stringify(monitoring_methods), JSON.stringify(success_metrics),
        JSON.stringify(challenges), next_steps, reported_by, verified_by
      ]
    );

    logger.info(`Conservation record created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create conservation record error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create conservation record' });
  }
});

/**
 * Get conservation records
 */
router.get('/conservation', authMiddleware, async (req, res) => {
  try {
    const { species_id, species_type, conservation_status, region } = req.query;
    
    let query = 'SELECT * FROM conservation_tracking WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (species_id) {
      paramCount++;
      query += ` AND species_id = $${paramCount}`;
      params.push(species_id);
    }

    if (species_type) {
      paramCount++;
      query += ` AND species_type = $${paramCount}`;
      params.push(species_type);
    }

    if (conservation_status) {
      paramCount++;
      query += ` AND conservation_status = $${paramCount}`;
      params.push(conservation_status);
    }

    if (region) {
      paramCount++;
      query += ` AND protected_areas @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([region]));
    }

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get conservation records error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get conservation records' });
  }
});

/**
 * Update conservation record
 */
router.put('/conservation/:id', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const {
      conservation_status, population_data, threat_assessment,
      conservation_measures, success_metrics, challenges, next_steps
    } = req.body;

    let result = await pool.query(
      `UPDATE conservation_tracking 
       SET conservation_status = COALESCE($1, conservation_status),
           population_data = COALESCE($2, population_data),
           threat_assessment = COALESCE($3, threat_assessment),
           conservation_measures = COALESCE($4, conservation_measures),
           success_metrics = COALESCE($5, success_metrics),
           challenges = COALESCE($6, challenges),
           next_steps = COALESCE($7, next_steps),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        conservation_status,
        population_data ? JSON.stringify(population_data) : null,
        threat_assessment ? JSON.stringify(threat_assessment) : null,
        conservation_measures ? JSON.stringify(conservation_measures) : null,
        success_metrics ? JSON.stringify(success_metrics) : null,
        challenges ? JSON.stringify(challenges) : null,
        next_steps,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conservation record not found' });
    }

    logger.info(`Conservation record updated: ${req.params.id}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update conservation record error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update conservation record' });
  }
});

// ============================================================================
// AI RISK PREDICTION (CAP-223)
// ============================================================================

/**
 * Run AI risk prediction for species
 */
router.post('/risk-prediction', authMiddleware, async (req, res) => {
  try {
    const { species_id, species_type, region, time_horizon, scenarios } = req.body;

    // Mock AI prediction - in production, this would use ML models
    const prediction = await runRiskPredictionModel({
      species_id,
      species_type,
      region,
      time_horizon,
      scenarios
    });

    // Store prediction result
    let result = await pool.query(
      `INSERT INTO biodiversity_risk_predictions 
       (species_id, species_type, region, time_horizon, scenarios, 
        prediction_result, confidence_score, model_version, requested_by, 
        created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [
        species_id, species_type, region, time_horizon,
        JSON.stringify(scenarios), JSON.stringify(prediction),
        prediction.confidence_score, 'v1.0', req.user.id
      ]
    );

    logger.info(`Risk prediction generated for species: ${species_id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Run risk prediction error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to run risk prediction' });
  }
});

/**
 * Mock AI risk prediction model
 */
async function runRiskPredictionModel(params) {
  // In production, this would integrate with ML models
  logger.info(`Running risk prediction for species ${params.species_id}`);
  
  return {
    extinction_risk: {
      current: 'Vulnerable',
      projected: params.time_horizon === '2030' ? 'Endangered' : 'Critically Endangered',
      probability: 0.75
    },
    habitat_loss_risk: {
      severity: 'High',
      drivers: ['deforestation', 'climate_change', 'urbanization'],
      projected_loss_percentage: 45
    },
    climate_impact: {
      adaptation_capacity: 'Low',
      temperature_sensitivity: 'High',
      precipitation_sensitivity: 'Medium'
    },
    intervention_recommendations: [
      'Establish protected corridors',
      'Implement ex-situ conservation programs',
      'Community-based habitat restoration',
      'Climate-resilient cultivation practices'
    ],
    confidence_score: 0.82,
    prediction_date: new Date().toISOString()
  };
}

/**
 * Get risk predictions
 */
router.get('/risk-predictions', authMiddleware, async (req, res) => {
  try {
    const { species_id, species_type, region } = req.query;
    
    let query = 'SELECT * FROM biodiversity_risk_predictions WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (species_id) {
      paramCount++;
      query += ` AND species_id = $${paramCount}`;
      params.push(species_id);
    }

    if (species_type) {
      paramCount++;
      query += ` AND species_type = $${paramCount}`;
      params.push(species_type);
    }

    if (region) {
      paramCount++;
      query += ` AND region = $${paramCount}`;
      params.push(region);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get risk predictions error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get risk predictions' });
  }
});

/**
 * Get biodiversity analytics dashboard data
 */
router.get('/analytics/dashboard', authMiddleware, async (req, res) => {
  try {
    const analytics = await pool.query(`
      SELECT 
        COUNT(DISTINCT species_id) as total_species_tracked,
        COUNT(CASE WHEN conservation_status = 'Critically Endangered' THEN 1 END) as critically_endangered,
        COUNT(CASE WHEN conservation_status = 'Endangered' THEN 1 END) as endangered,
        COUNT(CASE WHEN conservation_status = 'Vulnerable' THEN 1 END) as vulnerable,
        COUNT(CASE WHEN conservation_status = 'Near Threatened' THEN 1 END) as near_threatened,
        COUNT(CASE WHEN conservation_status = 'Least Concern' THEN 1 END) as least_concern
      FROM conservation_tracking
    `);

    const riskTrends = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        AVG((prediction_result->'extinction_risk'->>'probability')::float) as avg_risk_score
      FROM biodiversity_risk_predictions
      WHERE created_at > NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month DESC
    `);

    res.json({
      summary: analytics.rows[0],
      risk_trends: riskTrends.rows
    });
  } catch (error) {
    logger.error('Get biodiversity analytics error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get biodiversity analytics' });
  }
});

// Health check
function isHealthy() {
  return true;
}

module.exports = {
  router,
  isHealthy
};



