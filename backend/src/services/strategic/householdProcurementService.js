/**
 * Household Procurement Service
 * Strategic implementation for household agricultural procurement planning
 * 
 * Business Concept: Household procurement involves pre-planned purchasing commitments
 * for domestic consumption, focusing on price stability, quality assurance, and 
 * delivery scheduling for individual families and households.
 */

const { Pool } = require('pg');
const logger = require('../../utils/logger');

class HouseholdProcurementService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  /**
   * Create a household procurement plan
   * @param {Object} planData - Procurement plan details
   * @returns {Object} Created procurement plan
   */
  async createProcurementPlan(planData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate household exists
      const householdResult = await client.query(
        `SELECT * FROM households WHERE id = $1`,
        [planData.household_id]
      );
      
      if (householdResult.rows.length === 0) {
        throw new Error('Household not found');
      }
      
      const household = householdResult.rows[0];
      
      // Analyze consumption patterns based on family size and preferences
      const consumptionAnalysis = await this.analyzeConsumptionPatterns(
        client,
        household,
        planData
      );
      
      // Calculate optimal budget allocation
      const budgetOptimization = await this.optimizeBudget(
        client,
        household,
        consumptionAnalysis,
        planData.budget_limit
      );
      
      // Create procurement plan
      const planResult = await client.query(
        `INSERT INTO household_procurement_plans 
         (household_id, family_size, consumption_period_start, consumption_period_end,
          preferred_varieties, dietary_restrictions, quality_requirements, budget_limit,
          delivery_frequency, delivery_day_of_week, delivery_time_slot, payment_method, payment_schedule)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, created_at`,
        [
          planData.household_id,
          household.family_size,
          planData.consumption_period_start,
          planData.consumption_period_end,
          JSON.stringify(planData.preferred_varieties || {}),
          JSON.stringify(planData.dietary_restrictions || {}),
          JSON.stringify(planData.quality_requirements || {}),
          planData.budget_limit || null,
          planData.delivery_frequency || 'monthly',
          planData.delivery_day_of_week || null,
          planData.delivery_time_slot || 'morning',
          planData.payment_method || 'card',
          planData.payment_schedule || 'monthly'
        ]
      );
      
      const planId = planResult.rows[0].id;
      
      // Generate delivery schedule
      const deliverySchedule = await this.generateDeliverySchedule(
        client,
        planId,
        planData
      );
      
      // Assign to aggregation group for efficiency
      const aggregationGroup = await this.assignToAggregationGroup(
        client,
        household,
        planData
      );
      
      await client.query(
        `UPDATE household_procurement_plans 
         SET aggregation_group_id = $1
         WHERE id = $2`,
        [aggregationGroup.id, planId]
      );
      
      await client.query('COMMIT');
      
      logger.info(`Household procurement plan created: ${planId}`);
      
      return {
        success: true,
        plan: {
          id: planId,
          household_id: planData.household_id,
          consumption_analysis: consumptionAnalysis,
          budget_optimization: budgetOptimization,
          delivery_schedule: deliverySchedule,
          aggregation_group: aggregationGroup,
          created_at: planResult.rows[0].created_at
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error creating procurement plan: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Analyze consumption patterns for household
   * @param {Object} client - Database client
   * @param {Object} household - Household data
   * @param {Object} planData - Plan data
   * @returns {Object} Consumption analysis
   */
  async analyzeConsumptionPatterns(client, household, planData) {
    try {
      // Calculate monthly consumption based on family size
      const baseConsumption = {
        rice: household.family_size * 15, // kg per month per person
        wheat: household.family_size * 10,
        pulses: household.family_size * 3,
        vegetables: household.family_size * 20,
        fruits: household.family_size * 8
      };
      
      // Adjust for dietary preferences
      if (planData.dietary_restrictions) {
        if (planData.dietary_restrictions.vegetarian) {
          // Reduce certain items, increase others
          baseConsumption.pulses *= 1.2;
          baseConsumption.vegetables *= 1.3;
        }
        
        if (planData.dietary_restrictions.gluten_free) {
          baseConsumption.wheat = 0;
          baseConsumption.rice *= 1.5;
        }
      }
      
      // Apply variety preferences
      if (planData.preferred_varieties) {
        Object.keys(baseConsumption).forEach(commodity => {
          if (planData.preferred_varieties[commodity]) {
            baseConsumption[`${commodity}_variety`] = planData.preferred_varieties[commodity];
          }
        });
      }
      
      // Calculate total estimated monthly consumption
      const totalMonthlyConsumption = Object.values(baseConsumption)
        .filter(value => typeof value === 'number')
        .reduce((sum, value) => sum + value, 0);
      
      return {
        monthly_consumption: baseConsumption,
        total_monthly_kg: Math.round(totalMonthlyConsumption),
        estimated_annual_kg: Math.round(totalMonthlyConsumption * 12),
        nutritional_analysis: await this.calculateNutritionalProfile(baseConsumption)
      };
      
    } catch (error) {
      logger.error(`Error analyzing consumption patterns: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate nutritional profile based on consumption
   * @param {Object} consumption - Consumption data
   * @returns {Object} Nutritional profile
   */
  async calculateNutritionalProfile(consumption) {
    // Simplified nutritional calculations (in production, use detailed food database)
    const nutritionalProfile = {
      calories_per_day: 0,
      protein_grams_per_day: 0,
      carbohydrates_grams_per_day: 0,
      fiber_grams_per_day: 0
    };
    
    // Approximate nutritional values per kg
    const nutritionalValues = {
      rice: { calories: 3500, protein: 70, carbs: 780, fiber: 30 },
      wheat: { calories: 3400, protein: 120, carbs: 720, fiber: 120 },
      pulses: { calories: 3400, protein: 200, carbs: 600, fiber: 150 },
      vegetables: { calories: 200, protein: 20, carbs: 40, fiber: 80 },
      fruits: { calories: 500, protein: 10, carbs: 120, fiber: 60 }
    };
    
    Object.keys(consumption).forEach(commodity => {
      if (nutritionalValues[commodity] && typeof consumption[commodity] === 'number') {
        const monthlyKg = consumption[commodity];
        const dailyKg = monthlyKg / 30;
        const values = nutritionalValues[commodity];
        
        nutritionalProfile.calories_per_day += values.calories * dailyKg;
        nutritionalProfile.protein_grams_per_day += values.protein * dailyKg;
        nutritionalProfile.carbohydrates_grams_per_day += values.carbs * dailyKg;
        nutritionalProfile.fiber_grams_per_day += values.fiber * dailyKg;
      }
    });
    
    return {
      daily: nutritionalProfile,
      meets_recommended_allowance: {
        calories: nutritionalProfile.calories_per_day >= 2000,
        protein: nutritionalProfile.protein_grams_per_day >= 50,
        fiber: nutritionalProfile.fiber_grams_per_day >= 25
      }
    };
  }

  /**
   * Optimize budget allocation
   * @param {Object} client - Database client
   * @param {Object} household - Household data
   * @param {Object} consumptionAnalysis - Consumption analysis
   * @param {number} budgetLimit - Budget limit
   * @returns {Object} Budget optimization
   */
  async optimizeBudget(client, household, consumptionAnalysis, budgetLimit) {
    try {
      // Get current market prices
      const priceResult = await client.query(
        `SELECT product_name, AVG(price_per_unit) as avg_price
         FROM market_prices 
         WHERE price_date >= NOW() - INTERVAL '30 days'
         GROUP BY product_name`
      );
      
      const prices = {};
      priceResult.rows.forEach(row => {
        prices[row.product_name] = row.avg_price;
      });
      
      // Calculate estimated monthly cost
      let estimatedMonthlyCost = 0;
      const costBreakdown = {};
      
      Object.keys(consumptionAnalysis.monthly_consumption).forEach(commodity => {
        if (typeof consumptionAnalysis.monthly_consumption[commodity] === 'number') {
          const price = prices[commodity] || 30; // Default price if not found
          const monthlyCost = consumptionAnalysis.monthly_consumption[commodity] * price;
          estimatedMonthlyCost += monthlyCost;
          costBreakdown[commodity] = {
            kg_per_month: consumptionAnalysis.monthly_consumption[commodity],
            price_per_kg: price,
            monthly_cost: monthlyCost
          };
        }
      });
      
      const estimatedAnnualCost = estimatedMonthlyCost * 12;
      
      // Budget recommendations
      const recommendations = [];
      
      if (budgetLimit && estimatedAnnualCost > budgetLimit) {
        const overBudget = estimatedAnnualCost - budgetLimit;
        recommendations.push({
          type: 'budget_exceeded',
          message: `Estimated annual cost ₹${estimatedAnnualCost} exceeds budget by ₹${overBudget}`,
          suggestions: [
            'Consider increasing budget limit',
            'Reduce consumption of premium varieties',
            'Opt for seasonal produce when available',
            'Join aggregation group for volume discounts'
          ]
        });
      } else if (budgetLimit) {
        const underBudget = budgetLimit - estimatedAnnualCost;
        recommendations.push({
          type: 'budget_optimization',
          message: `Estimated annual cost ₹${estimatedAnnualCost} is within budget (₹${underBudget} remaining)`,
          suggestions: [
            'Consider upgrading to premium varieties',
            'Add nutritional supplements',
            'Increase organic produce portion'
          ]
        });
      }
      
      return {
        estimated_monthly_cost: Math.round(estimatedMonthlyCost),
        estimated_annual_cost: Math.round(estimatedAnnualCost),
        cost_breakdown: costBreakdown,
        budget_utilization: budgetLimit ? (estimatedAnnualCost / budgetLimit * 100).toFixed(1) + '%' : null,
        recommendations
      };
      
    } catch (error) {
      logger.error(`Error optimizing budget: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate delivery schedule
   * @param {Object} client - Database client
   * @param {string} planId - Plan ID
   * @param {Object} planData - Plan data
   * @returns {Array} Delivery schedule
   */
  async generateDeliverySchedule(client, planId, planData) {
    try {
      const schedule = [];
      const startDate = new Date(planData.consumption_period_start);
      const endDate = new Date(planData.consumption_period_end);
      
      const frequency = planData.delivery_frequency || 'monthly';
      const deliveryDay = planData.delivery_day_of_week || 1; // Default to Monday
      
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // Adjust to delivery day of week
        const dayOfWeek = currentDate.getDay();
        const daysUntilDelivery = (deliveryDay - dayOfWeek + 7) % 7;
        currentDate.setDate(currentDate.getDate() + daysUntilDelivery);
        
        if (currentDate <= endDate) {
          schedule.push({
            delivery_date: new Date(currentDate),
            time_slot: planData.delivery_time_slot || 'morning',
            status: 'scheduled'
          });
        }
        
        // Move to next delivery based on frequency
        switch (frequency) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }
      
      return schedule;
      
    } catch (error) {
      logger.error(`Error generating delivery schedule: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign household to aggregation group
   * @param {Object} client - Database client
   * @param {Object} household - Household data
   * @param {Object} planData - Plan data
   * @returns {Object} Aggregation group
   */
  async assignToAggregationGroup(client, household, planData) {
    try {
      // Find existing aggregation group for same region and delivery preferences
      const existingGroupResult = await client.query(
        `SELECT * FROM household_aggregation_groups
         WHERE region = $1 
         AND delivery_time_slot = $2
         AND delivery_date >= NOW()
         AND status = 'planning'
         ORDER BY delivery_date ASC
         LIMIT 1`,
        [household.district, planData.delivery_time_slot]
      );
      
      if (existingGroupResult.rows.length > 0) {
        const group = existingGroupResult.rows[0];
        
        // Update group with new household
        await client.query(
          `UPDATE household_aggregation_groups
           SET total_households = total_households + 1,
               total_orders = total_orders + 1
           WHERE id = $1`,
          [group.id]
        );
        
        return group;
      }
      
      // Create new aggregation group
      const newGroupResult = await client.query(
        `INSERT INTO household_aggregation_groups
         (region, delivery_date, delivery_time_slot, pickup_location, 
          total_households, total_orders, status)
         VALUES ($1, $2, $3, $4, 1, 1, 'planning')
         RETURNING *`,
        [
          household.district,
          this.calculateNextDeliveryDate(planData.delivery_frequency, planData.delivery_day_of_week),
          planData.delivery_time_slot,
          `${household.district}, ${household.state} - Community Center`
        ]
      );
      
      return newGroupResult.rows[0];
      
    } catch (error) {
      logger.error(`Error assigning to aggregation group: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate next delivery date
   * @param {string} frequency - Delivery frequency
   * @param {number} preferredDay - Preferred day of week
   * @returns {Date} Next delivery date
   */
  calculateNextDeliveryDate(frequency, preferredDay) {
    const today = new Date();
    const deliveryDate = new Date(today);
    
    const dayOfWeek = today.getDay();
    const daysUntilPreferred = (preferredDay - dayOfWeek + 7) % 7;
    deliveryDate.setDate(today.getDate() + daysUntilPreferred);
    
    return deliveryDate;
  }

  /**
   * Aggregate household orders for efficiency
   * @param {string} region - Region
   * @param {Date} deliveryDate - Delivery date
   * @returns {Object} Aggregation result
   */
  async aggregateHouseholdOrders(region, deliveryDate) {
    try {
      const client = await this.pool.connect();
      
      try {
        // Get all households in aggregation group
        const result = await client.query(
          `SELECT hp.household_id, h.family_size, h.address, 
                  hp.preferred_varieties, hp.quality_requirements
           FROM household_procurement_plans hp
           JOIN households h ON hp.household_id = h.id
           JOIN household_aggregation_groups hag ON hp.aggregation_group_id = hag.id
           WHERE hag.region = $1 
           AND hag.delivery_date = $2
           AND hp.status = 'active'`,
          [region, deliveryDate]
        );
        
        const households = result.rows;
        
        // Calculate total quantities
        const totalQuantities = {
          rice: 0,
          wheat: 0,
          pulses: 0,
          vegetables: 0,
          fruits: 0
        };
        
        households.forEach(household => {
          const familySize = household.family_size;
          totalQuantities.rice += familySize * 15;
          totalQuantities.wheat += familySize * 10;
          totalQuantities.pulses += familySize * 3;
          totalQuantities.vegetables += familySize * 20;
          totalQuantities.fruits += familySize * 8;
        });
        
        // Calculate cost savings through aggregation
        const individualCost = await this.calculateIndividualCost(households);
        const aggregatedCost = await this.calculateAggregatedCost(totalQuantities);
        const savings = individualCost - aggregatedCost;
        
        client.release();
        
        return {
          region,
          delivery_date: deliveryDate,
          total_households: households.length,
          total_quantities: totalQuantities,
          cost_analysis: {
            individual_total: individualCost,
            aggregated_total: aggregatedCost,
            savings: savings,
            savings_percentage: ((savings / individualCost) * 100).toFixed(1) + '%'
          },
          households: households.map(h => ({
            household_id: h.household_id,
            family_size: h.family_size,
            address: h.address,
            preferences: h.preferred_varieties
          }))
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`Error aggregating household orders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate individual cost without aggregation
   * @param {Array} households - Households
   * @returns {number} Total individual cost
   */
  async calculateIndividualCost(households) {
    // Simplified calculation - in production, use actual market prices
    let totalCost = 0;
    
    households.forEach(household => {
      const familySize = household.family_size;
      // Assuming average prices
      totalCost += (familySize * 15 * 35) + // Rice
                  (familySize * 10 * 30) + // Wheat
                  (familySize * 3 * 80) +  // Pulses
                  (familySize * 20 * 25) + // Vegetables
                  (familySize * 8 * 60);    // Fruits
    });
    
    return totalCost;
  }

  /**
   * Calculate aggregated cost with volume discounts
   * @param {Object} totalQuantities - Total quantities
   * @returns {number} Aggregated cost
   */
  async calculateAggregatedCost(totalQuantities) {
    // Volume discounts for bulk purchases
    const volumeDiscounts = {
      rice: { threshold: 500, discount: 0.10 }, // 10% discount for >500kg
      wheat: { threshold: 300, discount: 0.08 },
      pulses: { threshold: 100, discount: 0.12 },
      vegetables: { threshold: 400, discount: 0.15 },
      fruits: { threshold: 200, discount: 0.10 }
    };
    
    let totalCost = 0;
    
    Object.keys(totalQuantities).forEach(commodity => {
      const quantity = totalQuantities[commodity];
      const basePrice = this.getBasePrice(commodity);
      const discount = volumeDiscounts[commodity] && quantity > volumeDiscounts[commodity].threshold
        ? volumeDiscounts[commodity].discount
        : 0;
      
      totalCost += quantity * basePrice * (1 - discount);
    });
    
    return totalCost;
  }

  /**
   * Get base price for commodity
   * @param {string} commodity - Commodity name
   * @returns {number} Base price
   */
  getBasePrice(commodity) {
    const prices = {
      rice: 35,
      wheat: 30,
      pulses: 80,
      vegetables: 25,
      fruits: 60
    };
    return prices[commodity] || 30;
  }

  /**
   * Create subscription for recurring orders
   * @param {Object} subscriptionData - Subscription data
   * @returns {Object} Created subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const result = await this.pool.query(
        `INSERT INTO household_subscriptions 
         (household_id, product_id, variety_id, quantity, frequency, 
          start_date, end_date, auto_renew)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          subscriptionData.household_id,
          subscriptionData.product_id,
          subscriptionData.variety_id || null,
          subscriptionData.quantity,
          subscriptionData.frequency,
          subscriptionData.start_date,
          subscriptionData.end_date || null,
          subscriptionData.auto_renew !== false
        ]
      );
      
      logger.info(`Household subscription created: ${result.rows[0].id}`);
      return result.rows[0];
      
    } catch (error) {
      logger.error(`Error creating subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Manage subscription (pause, resume, cancel)
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} managementData - Management data
   * @returns {Object} Updated subscription
   */
  async manageSubscription(subscriptionId, managementData) {
    try {
      const result = await this.pool.query(
        `UPDATE household_subscriptions 
         SET status = $1, end_date = $2, auto_renew = $3
         WHERE id = $4
         RETURNING *`,
        [
          managementData.status,
          managementData.end_date || null,
          managementData.auto_renew,
          subscriptionId
        ]
      );
      
      logger.info(`Subscription managed: ${subscriptionId} -> ${managementData.status}`);
      return result.rows[0];
      
    } catch (error) {
      logger.error(`Error managing subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get household procurement dashboard data
   * @param {string} householdId - Household ID
   * @returns {Object} Dashboard data
   */
  async getHouseholdDashboard(householdId) {
    try {
      const client = await this.pool.connect();
      
      try {
        // Get active plans
        const plansResult = await client.query(
          `SELECT * FROM household_procurement_plans 
           WHERE household_id = $1 AND status = 'active'
           ORDER BY consumption_period_start DESC`,
          [householdId]
        );
        
        // Get active subscriptions
        const subscriptionsResult = await client.query(
          `SELECT s.*, p.name as product_name, v.variety_name
           FROM household_subscriptions s
           LEFT JOIN products p ON s.product_id = p.id
           LEFT JOIN regional_variety_directory v ON s.variety_id = v.id
           WHERE s.household_id = $1 AND s.status = 'active'
           ORDER BY s.frequency, s.start_date`,
          [householdId]
        );
        
        // Get upcoming deliveries
        const deliveriesResult = await client.query(
          `SELECT hag.* FROM household_aggregation_groups hag
           JOIN household_procurement_plans hp ON hp.aggregation_group_id = hag.id
           WHERE hp.household_id = $1 
           AND hag.delivery_date >= NOW()
           AND hag.status IN ('planning', 'confirmed')
           ORDER BY hag.delivery_date ASC
           LIMIT 5`,
          [householdId]
        );
        
        client.release();
        
        return {
          active_plans: plansResult.rows,
          active_subscriptions: subscriptionsResult.rows,
          upcoming_deliveries: deliveriesResult.rows,
          summary: {
            total_active_plans: plansResult.rows.length,
            total_active_subscriptions: subscriptionsResult.rows.length,
            next_delivery: deliveriesResult.rows[0] || null
          }
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`Error getting household dashboard: ${error.message}`);
      throw error;
    }
  }
}

module.exports = HouseholdProcurementService;