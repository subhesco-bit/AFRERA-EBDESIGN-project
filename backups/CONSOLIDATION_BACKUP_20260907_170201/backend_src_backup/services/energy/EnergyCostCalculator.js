/**
 * Rural Energy Cost Intelligence Engine (RECIE)
 * Core business logic for energy cost calculation and optimization
 */

class EnergyCostCalculator {
  /**
   * Calculate lifetime energy cost for a location
   * @param {Object} params - Energy parameters
   * @returns {Object} Lifetime cost analysis
   */
  static calculateLifetimeCost(params) {
    const {
      gridTariffPerUnit,
      gridHoursPerDay,
      outageHoursPerYear,
      dieselCostPerLiter,
      dieselLitersPerYear,
      solarIrradiation,
      batteryReplacementCostPerYear,
      solarPanelDegradationRate,
      projectionYears = 25,
    } = params;

    const yearlyBreakdown = [];
    let totalGridCost = 0;
    let totalDieselCost = 0;
    let totalBatteryCost = 0;
    let totalMaintenanceCost = 0;

    for (let year = 1; year <= projectionYears; year++) {
      // Calculate year-specific costs
      const yearlyGridCost = gridTariffPerUnit * (gridHoursPerDay * 365) * 
        (outageHoursPerYear / 8760);
      
      const yearlyDieselCost = dieselCostPerLiter * dieselLitersPerYear * 
        (year <= 5 ? 1 : 1.05); // 5% inflation after year 5
      
      const yearlyBatteryCost = batteryReplacementCostPerYear * 
        (year % 5 === 0 ? 1 : 0); // Battery replacement every 5 years
      
      const yearlyMaintenanceCost = (gridTariffPerUnit * gridHoursPerDay * 365 * 0.02);

      const yearlyTotal = yearlyGridCost + yearlyDieselCost + 
        yearlyBatteryCost + yearlyMaintenanceCost;

      totalGridCost += yearlyGridCost;
      totalDieselCost += yearlyDieselCost;
      totalBatteryCost += yearlyBatteryCost;
      totalMaintenanceCost += yearlyMaintenanceCost;

      yearlyBreakdown.push({
        year,
        gridCost: yearlyGridCost,
        dieselCost: yearlyDieselCost,
        batteryCost: yearlyBatteryCost,
        maintenanceCost: yearlyMaintenanceCost,
        yearlyTotal,
      });
    }

    const lifetimeTotalCost = totalGridCost + totalDieselCost + 
      totalBatteryCost + totalMaintenanceCost;

    return {
      lifetimeTotalCost,
      projectionYears,
      annualAverageCost: lifetimeTotalCost / projectionYears,
      costBreakdown: {
        grid: totalGridCost,
        diesel: totalDieselCost,
        battery: totalBatteryCost,
        maintenance: totalMaintenanceCost,
      },
      yearlyBreakdown,
    };
  }

  /**
   * Calculate energy stack composition
   * @param {Object} params - Stack parameters
   * @returns {Object} Recommended stack configuration
   */
  static optimizeEnergyStack(params) {
    const {
      averageDailyDemandKwh,
      peakDemandKw,
      gridAvailability,
      solarIrradiation,
      biomassAvailable,
      biogasAvailable,   // was 'biogas Available' — a stray space made this a
                         // syntax error, so the whole module failed to load and
                         // every route in energyRoutes.js threw on require.
      villagePopulation,
      agriculturalArea,
      industrialDemand,
    } = params;

    // Stack recommendation logic
    let gridPercentage = 0;
    let solarPercentage = 0;
    let batteryCapacityKwh = 0;
    let biomassPotential = 0;
    let biogasPotential = 0;

    // Grid assessment
    if (gridAvailability >= 0.9) {
      gridPercentage = 60;
    } else if (gridAvailability >= 0.5) {
      gridPercentage = 40;
    } else {
      gridPercentage = 10;
    }

    // Solar assessment
    if (solarIrradiation >= 5) {
      solarPercentage = Math.min(100 - gridPercentage, 70);
    } else if (solarIrradiation >= 4) {
      solarPercentage = Math.min(100 - gridPercentage, 50);
    } else {
      solarPercentage = Math.min(100 - gridPercentage, 30);
    }

    // Battery sizing
    const demandVariability = peakDemandKw / (averageDailyDemandKwh / 24);
    batteryCapacityKwh = (demandVariability * averageDailyDemandKwh * 1.2) / 0.85;

    // Biomass & Biogas assessment
    if (biomassAvailable) {
      biomassPotential = Math.min(20, (agriculturalArea * 0.5));
    }
    if (biogasAvailable) {
      biogasPotential = Math.min(15, (villagePopulation * 0.05));
    }

    const renewablePercentage = 100 - gridPercentage;

    return {
      stackComposition: {
        grid: gridPercentage,
        solar: solarPercentage,
        battery: batteryCapacityKwh,
        biomass: biomassPotential,
        biogas: biogasPotential,
        other: Math.max(0, renewablePercentage - solarPercentage - biomassPotential - biogasPotential),
      },
      recommendation: this._generateStackRecommendation(
        gridPercentage, 
        solarPercentage, 
        gridAvailability
      ),
      reliabilityScore: this._calculateReliabilityScore(
        gridPercentage, 
        solarPercentage, 
        batteryCapacityKwh, 
        averageDailyDemandKwh
      ),
      scalability: {
        canAddSolar: solarPercentage < 60,
        canAddBattery: batteryCapacityKwh < (averageDailyDemandKwh * 2),
        canAddBiomass: biomassPotential < 20,
        canAddBiogas: biogasPotential < 15,
      },
    };
  }

  /**
   * Compare energy stack configurations
   * @param {Array<Object>} stacks - Stack configurations to compare
   * @returns {Object} Comparison analysis
   */
  static compareStackConfigurations(stacks) {
    const comparison = stacks.map((stack, index) => {
      const capexCost = this._calculateCapex(stack);
      const opexCost = this._calculateOpex(stack);
      const reliabilityScore = this._calculateReliabilityScore(
        stack.gridPercentage,
        stack.solarPercentage,
        stack.batteryCapacityKwh,
        stack.demandKwh
      );

      return {
        id: index,
        name: stack.name,
        capex: capexCost,
        annualOpex: opexCost,
        // Quoted: a JS property name cannot begin with a digit, so the
        // unquoted form was a syntax error. Line 197 already reads it as
        // a['25YearCost'], so the intended key was always the string.
        '25YearCost': capexCost + (opexCost * 25),
        reliabilityScore,
        roi25Year: ((capexCost + opexCost * 25) - stack.baselineEnergyCost * 25) / capexCost,
      };
    });

    return {
      comparison,
      recommended: comparison.reduce((a, b) => 
        a['25YearCost'] < b['25YearCost'] ? a : b
      ),
    };
  }

  /**
   * Calculate productive energy demand
   * @param {Object} params - Productive parameters
   * @returns {Object} Productive energy demand forecast
   */
  static calculateProductiveEnergyDemand(params) {
    const {
      farmerCount,
      avgFarmSizeHectares,
      irrigationArea,
      processingUnitsCount,
      coldChainFacilities,
      evChargingDemand = 0,
    } = params;

    // Calculate by use case
    const irrigationDemand = irrigationArea * 1.2; // 1.2 kWh/hectare/day
    const processingDemand = processingUnitsCount * 15; // 15 kWh per facility/day
    const coldChainDemand = coldChainFacilities * 20; // 20 kWh per facility/day
    const evChargingDemandKwh = evChargingDemand * 50; // 50 kWh per charging point/day

    const totalDailyDemand = irrigationDemand + processingDemand + 
      coldChainDemand + evChargingDemandKwh;

    const totalMonthlyDemand = totalDailyDemand * 30;
    const totalAnnualDemand = totalDailyDemand * 365;

    return {
      dailyDemandKwh: totalDailyDemand,
      monthlyDemandKwh: totalMonthlyDemand,
      annualDemandKwh: totalAnnualDemand,
      breakdown: {
        irrigation: { daily: irrigationDemand, percentage: (irrigationDemand / totalDailyDemand * 100) },
        processing: { daily: processingDemand, percentage: (processingDemand / totalDailyDemand * 100) },
        coldChain: { daily: coldChainDemand, percentage: (coldChainDemand / totalDailyDemand * 100) },
        evCharging: { daily: evChargingDemandKwh, percentage: (evChargingDemandKwh / totalDailyDemand * 100) },
      },
      recommendations: this._generateProductiveEnergyRecommendations(totalDailyDemand),
    };
  }

  // Helper methods
  static _generateStackRecommendation(gridPercentage, solarPercentage, gridAvailability) {
    if (gridAvailability < 0.5 && solarPercentage > 50) {
      return {
        type: 'COMMUNITY_MICROGRID',
        description: 'Invest in community microgrid with solar + battery storage',
        priority: 'HIGH',
      };
    }
    if (gridPercentage > 60) {
      return {
        type: 'GRID_DOMINANT',
        description: 'Maintain grid connection with rooftop solar backup',
        priority: 'MEDIUM',
      };
    }
    return {
      type: 'HYBRID',
      description: 'Balanced grid + solar + storage configuration',
      priority: 'MEDIUM',
    };
  }

  static _calculateReliabilityScore(gridPct, solarPct, batteryKwh, demandKwh) {
    let score = gridPct * 0.4; // Grid contributes 40% to reliability
    score += Math.min(solarPct, 30) * 0.4; // Solar capped at 30% contribution
    score += Math.min((batteryKwh / demandKwh) * 100, 30) * 0.2; // Battery contributes 20%
    return Math.min(score, 100);
  }

  static _calculateCapex(stack) {
    // Simplified capex calculation
    const solarCost = stack.solarPercentage * 2000000; // INR per unit
    const batteryCost = (stack.batteryCapacityKwh || 0) * 10000; // INR per kWh
    const gridCost = stack.gridPercentage * 500000;
    return solarCost + batteryCost + gridCost;
  }

  static _calculateOpex(stack) {
    return (stack.demandKwh || 100) * 50; // Simplified O&M cost
  }

  static _generateProductiveEnergyRecommendations(totalDemandKwh) {
    return [
      'Install dedicated solar for irrigation (1.5x demand capacity)',
      'Consider battery storage for evening processing operations',
      'Implement smart load management for peak shaving',
      'Explore demand response opportunities with local grid',
    ];
  }
}

module.exports = EnergyCostCalculator;
