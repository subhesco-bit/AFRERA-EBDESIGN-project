/**
 * AFRERA Complete ERP Integration Service
 * 
 * Comprehensive ERP integration with all agricultural modules:
 * - Farmer Module (crop planning, harvesting, field management)
 * - Crop Module (crop lifecycle, yield management, quality control)
 * - Livestock Module (animal health, breeding, production)
 * - All Inbuilt Modules (Dairy, Poultry, Goat, Sheep, Pig, etc.)
 * 
 * This service ensures that all agricultural operations are synchronized with:
 * - Financial ERP (GL posting, revenue tracking, cost allocation)
 * - Supply Chain ERP (inventory sync, procurement, logistics)
 * - Production ERP (production planning, resource allocation)
 * - Customer ERP (CRM integration, customer data sync)
 */

const { logger } = require('../../../utils/logger');
const { getPostgreSQL } = require('../../../database/connection');
const { signalBus } = require('../../../core/signalBus');

// ============================================================================
// FARMER MODULE ERP INTEGRATION
// ============================================================================

/**
 * Sync farmer crop planning with ERP production planning
 */
async function syncFarmerCropPlanningWithERP(farmerId, cropPlanData) {
  const pg = getPostgreSQL();
  
  try {
    // Get farmer's crop plan
    const cropPlan = await pg.query(`
      SELECT * FROM farmer_crop_plans
      WHERE farmer_id = $1 AND status = 'active'
    `, [farmerId]);
    
    if (cropPlan.rows.length === 0) {
      return { success: true, message: 'No active crop plans found' };
    }
    
    // Create ERP production orders for each crop plan
    for (const plan of cropPlan.rows) {
      const productionOrder = {
        farmer_id: farmerId,
        crop_type: plan.crop_type,
        planned_area: plan.planned_area,
        expected_yield: plan.expected_yield,
        planting_date: plan.planting_date,
        harvest_date: plan.harvest_date,
        resource_requirements: {
          seeds: plan.seed_quantity,
          fertilizers: plan.fertilizer_requirements,
          labor: plan.labor_requirements,
          equipment: plan.equipment_requirements
        },
        cost_allocations: {
          seed_cost: plan.seed_cost,
          fertilizer_cost: plan.fertilizer_cost,
          labor_cost: plan.labor_cost,
          equipment_cost: plan.equipment_cost,
          other_costs: plan.other_costs
        }
      };
      
      // Create production order in ERP
      await pg.query(`
        INSERT INTO erp_production_orders 
        (farmer_id, crop_type, planned_area, expected_yield, planting_date, harvest_date, 
         resource_requirements, cost_allocations, order_status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'planned', NOW())
      `, [farmerId, plan.crop_type, plan.planned_area, plan.expected_yield, 
          plan.planting_date, plan.harvest_date, JSON.stringify(productionOrder.resource_requirements),
          JSON.stringify(productionOrder.cost_allocations)]);
      
      // Post initial cost allocation to financial ERP
      await postCostAllocationToGL(farmerId, plan.crop_type, productionOrder.cost_allocations);
    }
    
    // Emit signal bus event
    await signalBus.emit('erp.farmer.crop_plan.synced', {
      farmer_id: farmerId,
      crop_plans_synced: cropPlan.rows.length,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Farmer crop planning synced with ERP', { farmerId, plansSynced: cropPlan.rows.length });
    
    return { success: true, plans_synced: cropPlan.rows.length };
  } catch (error) {
    logger.error('Error syncing farmer crop planning with ERP', { error: error.message, farmerId });
    throw error;
  }
}

/**
 * Sync farmer harvest data with ERP inventory and financial ERP
 */
async function syncFarmerHarvestWithERP(farmerId, harvestData) {
  let pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with harvest data
    await pg.query(`
      INSERT INTO erp_inventory 
      (farmer_id, product_type, quantity, quality_grade, harvest_date, location, source_type, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'harvest', NOW())
      ON CONFLICT (farmer_id, product_type, harvest_date) 
      DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
    `, [farmerId, harvestData.crop_type, harvestData.quantity, harvestData.quality_grade,
        harvestData.harvest_date, harvestData.location]);
    
    // Calculate revenue based on quality grade and market price
    const revenue = await calculateHarvestRevenue(harvestData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(farmerId, harvestData.crop_type, revenue, 'harvest');
    
    // Update farmer's financial records
    await pg.query(`
      INSERT INTO farmer_financial_records 
      (farmer_id, transaction_type, amount, description, related_crop, transaction_date, created_at)
      VALUES ($1, 'revenue', $2, 'Harvest revenue', $3, $4, NOW())
    `, [farmerId, revenue.total_value, harvestData.crop_type, harvestData.harvest_date]);
    
    // Emit signal bus event
    await signalBus.emit('erp.farmer.harvest.synced', {
      farmer_id: farmerId,
      harvest_data: harvestData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Farmer harvest synced with ERP', { farmerId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing farmer harvest with ERP', { error: error.message, farmerId });
    throw error;
  }
}

/**
 * Sync farmer field data with ERP asset management
 */
async function syncFarmerFieldWithERP(farmerId, fieldData) {
  let pg = getPostgreSQL();
  
  try {
    // Register field as asset in ERP
    await pg.query(`
      INSERT INTO erp_assets 
      (asset_type, owner_id, asset_name, location, area_size, soil_type, irrigation_type, 
       current_value, acquisition_date, asset_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW())
      ON CONFLICT (owner_id, asset_name, location) 
      DO UPDATE SET area_size = $5, current_value = $8, asset_status = 'active'
    `, ['land', farmerId, fieldData.field_name, fieldData.location, fieldData.area_size,
        fieldData.soil_type, fieldData.irrigation_type, fieldData.estimated_value,
        fieldData.acquisition_date]);
    
    // Calculate depreciation and post to financial ERP
    const depreciation = calculateLandDepreciation(fieldData.estimated_value, fieldData.acquisition_date);
    await postDepreciationToGL(farmerId, fieldData.field_name, depreciation);
    
    // Emit signal bus event
    await signalBus.emit('erp.farmer.field.synced', {
      farmer_id: farmerId,
      field_data: fieldData,
      asset_registered: true,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Farmer field synced with ERP', { farmerId, fieldName: fieldData.field_name });
    
    return { success: true, asset_registered: true };
  } catch (error) {
    logger.error('Error syncing farmer field with ERP', { error: error.message, farmerId });
    throw error;
  }
}

// ============================================================================
// CROP MODULE ERP INTEGRATION
// ============================================================================

/**
 * Sync crop lifecycle stages with ERP production tracking
 */
async function syncCropLifecycleWithERP(cropId, lifecycleData) {
  let pg = getPostgreSQL();
  
  try {
    // Get crop information
    const crop = await pg.query(`
      SELECT * FROM crop_lifecycle
      WHERE crop_id = $1
    `, [cropId]);
    
    if (crop.rows.length === 0) {
      return { success: true, message: 'Crop not found' };
    }
    
    const cropData = crop.rows[0];
    
    // Update ERP production tracking based on lifecycle stage
    await pg.query(`
      INSERT INTO erp_production_tracking 
      (crop_id, stage, stage_start_date, stage_end_date, resources_used, 
       costs_incurred, outputs_produced, quality_metrics, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (crop_id, stage) 
      DO UPDATE SET stage_end_date = $4, resources_used = $5, costs_incurred = $6, 
                   outputs_produced = $7, quality_metrics = $8
    `, [cropId, lifecycleData.stage, lifecycleData.start_date, lifecycleData.end_date,
        JSON.stringify(lifecycleData.resources_used), JSON.stringify(lifecycleData.costs_incurred),
        JSON.stringify(lifecycleData.outputs_produced), JSON.stringify(lifecycleData.quality_metrics)]);
    
    // Post stage costs to financial ERP
    if (lifecycleData.costs_incurred) {
      await postStageCostsToGL(cropId, lifecycleData.stage, lifecycleData.costs_incurred);
    }
    
    // Update inventory if stage produces outputs
    if (lifecycleData.outputs_produced) {
      for (const output of lifecycleData.outputs_produced) {
        await pg.query(`
          INSERT INTO erp_inventory 
          (crop_id, product_type, quantity, quality_grade, production_date, source_type, created_at)
          VALUES ($1, $2, $3, $4, $5, 'production', NOW())
          ON CONFLICT (crop_id, product_type, production_date) 
          DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
        `, [cropId, output.product_type, output.quantity, output.quality_grade, output.production_date]);
      }
    }
    
    // Emit signal bus event
    await signalBus.emit('erp.crop.lifecycle.synced', {
      crop_id: cropId,
      stage: lifecycleData.stage,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Crop lifecycle synced with ERP', { cropId, stage: lifecycleData.stage });
    
    return { success: true };
  } catch (error) {
    logger.error('Error syncing crop lifecycle with ERP', { error: error.message, cropId });
    throw error;
  }
}

/**
 * Sync crop yield data with ERP inventory and financial ERP
 */
async function syncCropYieldWithERP(cropId, yieldData) {
  let pg = getPostgreSQL();
  
  try {
    // Calculate yield metrics
    const yieldMetrics = {
      total_yield: yieldData.total_quantity,
      yield_per_hectare: yieldData.total_quantity / yieldData.area_hectares,
      quality_distribution: yieldData.quality_distribution,
      moisture_content: yieldData.moisture_content,
      protein_content: yieldData.protein_content
    };
    
    // Update ERP inventory with yield data
    for (const qualityGrade of Object.keys(yieldData.quality_distribution)) {
      const quantity = yieldData.quality_distribution[qualityGrade];
      
      await pg.query(`
        INSERT INTO erp_inventory 
        (crop_id, product_type, quantity, quality_grade, harvest_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'yield', NOW())
        ON CONFLICT (crop_id, product_type, harvest_date, quality_grade) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3
      `, [cropId, yieldData.crop_type, quantity, qualityGrade, yieldData.harvest_date, yieldData.location]);
    }
    
    // Calculate revenue based on quality and market prices
    let revenue = await calculateYieldRevenue(yieldData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(null, yieldData.crop_type, revenue, 'crop_yield');
    
    // Update crop financial records
    await pg.query(`
      INSERT INTO crop_financial_records 
      (crop_id, transaction_type, amount, description, quality_metrics, transaction_date, created_at)
      VALUES ($1, 'revenue', $2, 'Crop yield revenue', $3, $4, NOW())
    `, [cropId, revenue.total_value, JSON.stringify(yieldMetrics), yieldData.harvest_date]);
    
    // Emit signal bus event
    await signalBus.emit('erp.crop.yield.synced', {
      crop_id: cropId,
      yield_data: yieldData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Crop yield synced with ERP', { cropId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing crop yield with ERP', { error: error.message, cropId });
    throw error;
  }
}

// ============================================================================
// LIVESTOCK MODULE ERP INTEGRATION
// ============================================================================

/**
 * Sync livestock data with ERP asset management
 */
async function syncLivestockWithERP(livestockId, livestockData) {
  let pg = getPostgreSQL();
  
  try {
    // Register livestock as asset in ERP
    await pg.query(`
      INSERT INTO erp_assets 
      (asset_type, owner_id, asset_name, breed, age, location, current_value, 
       acquisition_date, asset_status, health_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, NOW())
      ON CONFLICT (owner_id, asset_name, breed) 
      DO UPDATE SET current_value = $7, health_status = $9, asset_status = 'active'
    `, ['livestock', livestockData.owner_id, livestockData.name, livestockData.breed,
        livestockData.age, livestockData.location, livestockData.current_value,
        livestockData.acquisition_date, livestockData.health_status]);
    
    // Calculate depreciation and post to financial ERP
    let depreciation = calculateLivestockDepreciation(livestockData.current_value, livestockData.age);
    await postDepreciationToGL(livestockData.owner_id, livestockData.name, depreciation);
    
    // Emit signal bus event
    await signalBus.emit('erp.livestock.synced', {
      livestock_id: livestockId,
      livestock_data: livestockData,
      asset_registered: true,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Livestock synced with ERP', { livestockId, livestockName: livestockData.name });
    
    return { success: true, asset_registered: true };
  } catch (error) {
    logger.error('Error syncing livestock with ERP', { error: error.message, livestockId });
    throw error;
  }
}

/**
 * Sync livestock production with ERP inventory and financial ERP
 */
async function syncLivestockProductionWithERP(livestockId, productionData) {
  let pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with production data
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (livestock_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'livestock_production', NOW())
        ON CONFLICT (livestock_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [livestockId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue based on production
    let revenue = await calculateLivestockProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, productionData.livestock_type, revenue, 'livestock_production');
    
    // Update livestock financial records
    await pg.query(`
      INSERT INTO livestock_financial_records 
      (livestock_id, transaction_type, amount, description, production_metrics, transaction_date, created_at)
      VALUES ($1, 'revenue', $2, 'Livestock production revenue', $3, $4, NOW())
    `, [livestockId, revenue.total_value, JSON.stringify(productionData.production_metrics), productionData.production_date]);
    
    // Emit signal bus event
    await signalBus.emit('erp.livestock.production.synced', {
      livestock_id: livestockId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Livestock production synced with ERP', { livestockId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing livestock production with ERP', { error: error.message, livestockId });
    throw error;
  }
}

/**
 * Sync livestock health events with ERP asset management and financial ERP
 */
async function syncLivestockHealthWithERP(livestockId, healthData) {
  let pg = getPostgreSQL();
  
  try {
    // Update asset health status in ERP
    await pg.query(`
      UPDATE erp_assets 
      SET health_status = $1, last_health_check = NOW()
      WHERE asset_type = 'livestock' AND asset_id = $2
    `, [healthData.health_status, livestockId]);
    
    // If health issue, calculate potential loss and post to financial ERP
    if (healthData.health_status === 'sick' || healthData.health_status === 'critical') {
      const potentialLoss = await calculateHealthEventCost(livestockId, healthData);
      await postProvisionToGL(healthData.owner_id, livestockId, potentialLoss, 'health_event');
    }
    
    // Emit signal bus event
    await signalBus.emit('erp.livestock.health.synced', {
      livestock_id: livestockId,
      health_data: healthData,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Livestock health synced with ERP', { livestockId, healthStatus: healthData.health_status });
    
    return { success: true };
  } catch (error) {
    logger.error('Error syncing livestock health with ERP', { error: error.message, livestockId });
    throw error;
  }
}

// ============================================================================
// INBUILT MODULES ERP INTEGRATION
// ============================================================================

/**
 * Sync dairy production with ERP
 */
async function syncDairyProductionWithERP(dairyId, productionData) {
  let pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with dairy production
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (dairy_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'dairy_production', NOW())
        ON CONFLICT (dairy_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [dairyId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue
    let revenue = await calculateDairyProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, 'dairy', revenue, 'dairy_production');
    
    // Emit signal bus event
    await signalBus.emit('erp.dairy.production.synced', {
      dairy_id: dairyId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Dairy production synced with ERP', { dairyId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing dairy production with ERP', { error: error.message, dairyId });
    throw error;
  }
}

/**
 * Sync poultry production with ERP
 */
async function syncPoultryProductionWithERP(poultryId, productionData) {
  let pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with poultry production
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (poultry_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'poultry_production', NOW())
        ON CONFLICT (poultry_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [poultryId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue
    let revenue = await calculatePoultryProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, 'poultry', revenue, 'poultry_production');
    
    // Emit signal bus event
    await signalBus.emit('erp.poultry.production.synced', {
      poultry_id: poultryId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Poultry production synced with ERP', { poultryId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing poultry production with ERP', { error: error.message, poultryId });
    throw error;
  }
}

/**
 * Sync goat production with ERP
 */
async function syncGoatProductionWithERP(goatId, productionData) {
  let pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with goat production
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (goat_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'goat_production', NOW())
        ON CONFLICT (goat_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [goatId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue
    let revenue = await calculateGoatProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, 'goat', revenue, 'goat_production');
    
    // Emit signal bus event
    await signalBus.emit('erp.goat.production.synced', {
      goat_id: goatId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Goat production synced with ERP', { goatId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing goat production with ERP', { error: error.message, goatId });
    throw error;
  }
}

/**
 * Sync sheep production with ERP
 */
async function syncSheepProductionWithERP(sheepId, productionData) {
  let pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with sheep production
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (sheep_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'sheep_production', NOW())
        ON CONFLICT (sheep_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [sheepId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue
    let revenue = await calculateSheepProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, 'sheep', revenue, 'sheep_production');
    
    // Emit signal bus event
    await signalBus.emit('erp.sheep.production.synced', {
      sheep_id: sheepId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Sheep production synced with ERP', { sheepId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing sheep production with ERP', { error: error.message, sheepId });
    throw error;
  }
}

/**
 * Sync pig production with ERP
 */
async function syncPigProductionWithERP(pigId, productionData) {
  let pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with pig production
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (pig_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'pig_production', NOW())
        ON CONFLICT (pig_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [pigId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue
    let revenue = await calculatePigProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, 'pig', revenue, 'pig_production');
    
    // Emit signal bus event
    await signalBus.emit('erp.pig.production.synced', {
      pig_id: pigId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Pig production synced with ERP', { pigId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing pig production with ERP', { error: error.message, pigId });
    throw error;
  }
}

// ============================================================================
// FINANCIAL ERP HELPER FUNCTIONS
// ============================================================================

async function postCostAllocationToGL(ownerId, cropType, costAllocations) {
  let pg = getPostgreSQL();
  
  const totalCost = Object.values(costAllocations).reduce((sum, cost) => sum + (cost || 0), 0);
  
  await pg.query(`
    INSERT INTO erp_gl_entries 
    (account_type, amount, description, reference_id, reference_type, transaction_date, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `, ['expense', totalCost, `Cost allocation for ${cropType}`, ownerId, 'cost_allocation']);
}

async function postRevenueToGL(ownerId, productType, revenue, source) {
  let pg = getPostgreSQL();
  
  await pg.query(`
    INSERT INTO erp_gl_entries 
    (account_type, amount, description, reference_id, reference_type, transaction_date, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `, ['revenue', revenue.total_value, `Revenue from ${source} - ${productType}`, ownerId, source]);
}

async function postDepreciationToGL(ownerId, assetName, depreciation) {
  let pg = getPostgreSQL();
  
  await pg.query(`
    INSERT INTO erp_gl_entries 
    (account_type, amount, description, reference_id, reference_type, transaction_date, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `, ['depreciation', depreciation.amount, `Depreciation for ${assetName}`, ownerId, 'depreciation']);
}

async function postProvisionToGL(ownerId, assetId, provision, source) {
  let pg = getPostgreSQL();
  
  await pg.query(`
    INSERT INTO erp_gl_entries 
    (account_type, amount, description, reference_id, reference_type, transaction_date, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `, ['provision', provision.amount, `Provision for ${source}`, assetId, source]);
}

async function postStageCostsToGL(cropId, stage, costs) {
  let pg = getPostgreSQL();
  
  let totalCost = Object.values(costs).reduce((sum, cost) => sum + (cost || 0), 0);
  
  await pg.query(`
    INSERT INTO erp_gl_entries 
    (account_type, amount, description, reference_id, reference_type, transaction_date, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `, ['expense', totalCost, `Stage costs for ${stage}`, cropId, 'crop_stage']);
}

// ============================================================================
// CALCULATION HELPER FUNCTIONS
// ============================================================================

async function calculateHarvestRevenue(harvestData) {
  // Calculate revenue based on quality grade and market price
  const marketPrices = {
    'premium': 50,
    'grade_a': 40,
    'grade_b': 30,
    'grade_c': 20
  };
  
  const pricePerKg = marketPrices[harvestData.quality_grade] || 30;
  const totalValue = harvestData.quantity * pricePerKg;
  
  return {
    total_value: totalValue,
    price_per_kg: pricePerKg,
    quantity: harvestData.quantity,
    quality_grade: harvestData.quality_grade
  };
}

async function calculateYieldRevenue(yieldData) {
  let totalValue = 0;
  
  for (const [qualityGrade, quantity] of Object.entries(yieldData.quality_distribution)) {
    let marketPrices = {
      'premium': 50,
      'grade_a': 40,
      'grade_b': 30,
      'grade_c': 20
    };
    
    let pricePerKg = marketPrices[qualityGrade] || 30;
    totalValue += quantity * pricePerKg;
  }
  
  return {
    total_value: totalValue,
    quality_distribution: yieldData.quality_distribution
  };
}

async function calculateLivestockProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    let marketPrices = {
      'milk': 30,
      'meat': 100,
      'eggs': 5,
      'wool': 50
    };
    
    const pricePerUnit = marketPrices[product.product_type] || 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

async function calculateDairyProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    let pricePerUnit = product.product_type === 'milk' ? 30 : 
                         product.product_type === 'cheese' ? 200 : 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

async function calculatePoultryProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    let pricePerUnit = product.product_type === 'eggs' ? 5 : 
                         product.product_type === 'meat' ? 100 : 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

async function calculateGoatProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    let pricePerUnit = product.product_type === 'milk' ? 35 : 
                         product.product_type === 'meat' ? 120 : 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

async function calculateSheepProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    let pricePerUnit = product.product_type === 'milk' ? 40 : 
                         product.product_type === 'meat' ? 110 : 
                         product.product_type === 'wool' ? 60 : 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

async function calculatePigProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    let pricePerUnit = product.product_type === 'meat' ? 90 : 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

function calculateLandDepreciation(value, acquisitionDate) {
  const acquisitionYear = new Date(acquisitionDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearsOwned = currentYear - acquisitionYear;
  const depreciationRate = 0.02; // 2% per year
  const depreciatedValue = value * (1 - (depreciationRate * yearsOwned));
  
  return {
    original_value: value,
    depreciated_value: depreciatedValue,
    depreciation_amount: value - depreciatedValue,
    years_owned: yearsOwned
  };
}

function calculateLivestockDepreciation(value, age) {
  let depreciationRate = 0.15; // 15% per year
  let depreciatedValue = value * (1 - (depreciationRate * age));
  
  return {
    original_value: value,
    depreciated_value: depreciatedValue,
    depreciation_amount: value - depreciatedValue,
    age: age
  };
}

async function calculateHealthEventCost(livestockId, healthData) {
  // Calculate potential loss based on health event
  const lossFactors = {
    'sick': 0.3,
    'critical': 0.7,
    'recovering': 0.1
  };
  
  const lossFactor = lossFactors[healthData.health_status] || 0.3;
  
  // Get current value of livestock
  let pg = getPostgreSQL();
  const asset = await pg.query(`
    SELECT current_value FROM erp_assets
    WHERE asset_id = $1
  `, [livestockId]);
  
  const currentValue = asset.rows[0]?.current_value || 0;
  let potentialLoss = currentValue * lossFactor;
  
  return {
    potential_loss: potentialLoss,
    loss_factor: lossFactor,
    current_value: currentValue
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Farmer Module Integration
  syncFarmerCropPlanningWithERP,
  syncFarmerHarvestWithERP,
  syncFarmerFieldWithERP,
  
  // Crop Module Integration
  syncCropLifecycleWithERP,
  syncCropYieldWithERP,
  
  // Livestock Module Integration
  syncLivestockWithERP,
  syncLivestockProductionWithERP,
  syncLivestockHealthWithERP,
  
  // Inbuilt Modules Integration
  syncDairyProductionWithERP,
  syncPoultryProductionWithERP,
  syncGoatProductionWithERP,
  syncSheepProductionWithERP,
  syncPigProductionWithERP
};

