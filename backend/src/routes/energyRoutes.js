/**
 * Rural Energy Cost Intelligence Engine (RECIE) API Routes
 * Energy cost calculation, optimization, and forecasting endpoints
 */

const express = require('express');
const EnergyCostCalculator = require('../services/energy/EnergyCostCalculator');

const router = express.Router();

/**
 * POST /api/v1/energy/calculator/lifetime-cost
 * Calculate lifetime energy cost for a location
 */
router.post('/calculator/lifetime-cost', async (req, res) => {
  try {
    const { village_id, grid_tariff_per_unit, grid_hours_per_day, outage_hours_per_year,
            diesel_cost_per_liter, diesel_liters_per_year, solar_irradiation,
            battery_replacement_cost_per_year, solar_panel_degradation_rate, projection_years } = req.body;

    if (!village_id) {
      return res.status(400).json({ error: 'village_id is required' });
    }

    const result = EnergyCostCalculator.calculateLifetimeCost({
      gridTariffPerUnit: grid_tariff_per_unit || 6.5,
      gridHoursPerDay: grid_hours_per_day || 20,
      outageHoursPerYear: outage_hours_per_year || 200,
      dieselCostPerLiter: diesel_cost_per_liter || 95,
      dieselLitersPerYear: diesel_liters_per_year || 5000,
      solarIrradiation: solar_irradiation || 5.2,
      batteryReplacementCostPerYear: battery_replacement_cost_per_year || 50000,
      solarPanelDegradationRate: solar_panel_degradation_rate || 0.7,
      projectionYears: projection_years || 25,
    });

    res.status(200).json({
      village_id,
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/energy/database/grid-tariffs/:region
 * Get grid tariff data by region
 */
router.get('/database/grid-tariffs/:region', async (req, res) => {
  try {
    const { region } = req.params;

    // Simplified grid tariff database
    const tariffs = {
      'MAHARASHTRA': {
        agricultural: 3.2,
        domestic: 6.5,
        commercial: 8.5,
        industrial: 7.2,
        lastUpdated: '2026-08-01',
      },
      'KARNATAKA': {
        agricultural: 3.0,
        domestic: 6.2,
        commercial: 8.2,
        industrial: 7.0,
        lastUpdated: '2026-08-01',
      },
      'TAMIL_NADU': {
        agricultural: 2.8,
        domestic: 5.8,
        commercial: 7.8,
        industrial: 6.8,
        lastUpdated: '2026-08-01',
      },
      'RAJASTHAN': {
        agricultural: 3.5,
        domestic: 6.8,
        commercial: 8.8,
        industrial: 7.5,
        lastUpdated: '2026-08-01',
      },
      'UTTAR_PRADESH': {
        agricultural: 3.3,
        domestic: 6.3,
        commercial: 8.3,
        industrial: 7.1,
        lastUpdated: '2026-08-01',
      },
    };

    const regionTariff = tariffs[region];
    if (!regionTariff) {
      return res.status(404).json({ error: `No tariff data for region: ${region}` });
    }

    res.status(200).json({
      region,
      tariffs: regionTariff,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/energy/optimizer/recommend-stack
 * Get recommended energy stack for a location
 */
router.post('/optimizer/recommend-stack', async (req, res) => {
  try {
    const {
      village_id,
      average_daily_demand_kwh,
      peak_demand_kw,
      grid_availability,
      solar_irradiation,
      biomass_available,
      biogas_available,
      village_population,
      agricultural_area,
      industrial_demand,
    } = req.body;

    if (!village_id || !average_daily_demand_kwh) {
      return res.status(400).json({ error: 'village_id and average_daily_demand_kwh are required' });
    }

    const result = EnergyCostCalculator.optimizeEnergyStack({
      averageDailyDemandKwh: average_daily_demand_kwh,
      peakDemandKw: peak_demand_kw || (average_daily_demand_kwh * 1.5),
      gridAvailability: grid_availability || 0.6,
      solarIrradiation: solar_irradiation || 5,
      biomassAvailable: biomass_available || false,
      biogasAvailable: biogas_available || false,
      villagePopulation: village_population || 5000,
      agricultureArea: agricultural_area || 1000,
      industrialDemand: industrial_demand || 0,
    });

    res.status(200).json({
      village_id,
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/energy/metrics/:village_id
 * Get energy metrics for a village
 */
router.get('/metrics/:village_id', async (req, res) => {
  try {
    const { village_id } = req.params;

    // Placeholder for actual database lookup
    const metrics = {
      village_id,
      current_grid_status: 'OPERATIONAL',
      grid_hours_today: 18,
      outage_incidents_month: 2,
      average_tariff: 6.5,
      solar_potential_mwp: 2.5,
      renewable_capacity_percentage: 15,
      biomass_potential_tonnes_year: 500,
      energy_demand_peak_kw: 150,
      energy_demand_average_kw: 75,
      population: 5000,
      agricultural_area_hectares: 1200,
    };

    res.status(200).json({
      village_id,
      metrics,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/energy/productive/demand-forecast
 * Forecast productive energy demand
 */
router.post('/productive/demand-forecast', async (req, res) => {
  try {
    const {
      village_id,
      farmer_count,
      avg_farm_size_hectares,
      irrigation_area,
      processing_units_count,
      cold_chain_facilities,
      ev_charging_demand,
    } = req.body;

    if (!village_id) {
      return res.status(400).json({ error: 'village_id is required' });
    }

    const result = EnergyCostCalculator.calculateProductiveEnergyDemand({
      farmerCount: farmer_count || 500,
      avgFarmSizeHectares: avg_farm_size_hectares || 2,
      irrigationArea: irrigation_area || 800,
      processingUnitsCount: processing_units_count || 5,
      coldChainFacilities: cold_chain_facilities || 2,
      evChargingDemand: ev_charging_demand || 0,
    });

    res.status(200).json({
      village_id,
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/energy/stack/compare
 * Compare multiple energy stack configurations
 */
router.post('/stack/compare', async (req, res) => {
  try {
    const { village_id, stacks } = req.body;

    if (!village_id || !stacks || stacks.length < 2) {
      return res.status(400).json({ 
        error: 'village_id and at least 2 stacks are required' 
      });
    }

    const result = EnergyCostCalculator.compareStackConfigurations(stacks);

    res.status(200).json({
      village_id,
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
