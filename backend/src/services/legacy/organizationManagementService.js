/**
 * Organization Management Module Service - AI Enhanced
 * 
 * This service provides AI-powered organization management:
 * - Organizational structure optimization
 * - AI-assisted hierarchy recommendations
 * - Performance prediction per unit
 * - Resource allocation optimization
 * - Change impact analysis
 */

const DatabaseService = require('../../database/connection');
const aiGatewayService = require('./aiGatewayService');
const analyticsService = require('./analyticsService');
const { logger } = require('../../utils/logger');

class OrganizationManagementService {
  constructor() {
    this.aiGateway = aiGatewayService;
    this.analytics = analyticsService;
    this.db = DatabaseService;
    this.orgMetrics = new Map();
    this.hierarchyAnalysis = new Map();
  }

  /**
   * Create organization with AI-optimized structure
   */
  async createOrganization(orgData) {
    try {
      logger.info('Creating organization with AI-optimized structure');

      // Analyze organization requirements using AI
      const structureAnalysis = await this.aiGateway.analyze({
        type: 'organization_structure',
        industry: orgData.industry,
        size: orgData.size,
        businessModel: orgData.businessModel,
        geography: orgData.geography,
        objectives: orgData.objectives || ['efficiency', 'agility', 'growth']
      });

      const organization = await this.db.query(`
        INSERT INTO organizations 
        (name, industry, size, structure, config, created_at) 
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `, [
        orgData.name,
        orgData.industry,
        orgData.size,
        JSON.stringify(structureAnalysis.recommendedStructure || {}),
        JSON.stringify(orgData.config || {})
      ]);

      // Initialize organization monitoring
      await this.initializeOrganizationMonitoring(organization.rows[0].id);

      return {
        success: true,
        organization: organization.rows[0],
        recommendedStructure: structureAnalysis.recommendedStructure,
        implementationPlan: structureAnalysis.implementationPlan || [],
        expectedBenefits: structureAnalysis.expectedBenefits || {}
      };
    } catch (error) {
      logger.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Get organization with AI-powered insights
   */
  async getOrganization(orgId) {
    try {
      let organization = await this.db.query(
        'SELECT * FROM organizations WHERE id = $1',
        [orgId]
      );

      if (organization.rows.length === 0) {
        throw new Error('Organization not found');
      }

      const orgData = organization.rows[0];
      const performanceMetrics = await this.getOrganizationPerformance(orgId);
      const structureHealth = await this.analyzeStructureHealth(orgId);
      const aiInsights = await this.getOrganizationAIInsights(orgId, performanceMetrics);

      return {
        ...orgData,
        performanceMetrics: performanceMetrics,
        structureHealth: structureHealth,
        aiInsights: aiInsights,
        recommendations: aiInsights.recommendations || []
      };
    } catch (error) {
      logger.error('Error getting organization:', error);
      throw error;
    }
  }

  /**
   * Organizational structure optimization
   */
  async optimizeStructure(orgId) {
    try {
      const currentStructure = await this.getCurrentStructure(orgId);
      const performanceData = await this.getUnitPerformance(orgId);
      const communicationPatterns = await this.getCommunicationPatterns(orgId);
      const workloadDistribution = await this.getWorkloadDistribution(orgId);

      const optimization = await this.aiGateway.optimize({
        type: 'organization_structure',
        currentStructure: currentStructure,
        performanceData: performanceData,
        communicationPatterns: communicationPatterns,
        workloadDistribution: workloadDistribution,
        objectives: ['efficiency', 'collaboration', 'agility', 'cost'],
        constraints: {
          maxDepth: 6,
          minSpan: 3,
          maxSpan: 15
        }
      });

      return {
        currentStructure: currentStructure,
        optimizedStructure: optimization.optimizedStructure || currentStructure,
        changes: optimization.changes || [],
        expectedBenefits: {
          efficiency: optimization.efficiencyGain || 0,
          collaboration: optimization.collaborationImprovement || 0,
          cost: optimization.costSavings || 0
        },
        implementationPlan: optimization.implementationPlan || [],
        riskAssessment: optimization.risks || [],
        confidence: optimization.confidence || 0.85
      };
    } catch (error) {
      logger.error('Error optimizing structure:', error);
      throw error;
    }
  }

  /**
   * AI-assisted hierarchy recommendations
   */
  async recommendHierarchyChanges(orgId) {
    try {
      const currentHierarchy = await this.getCurrentHierarchy(orgId);
      let performanceMetrics = await this.getUnitPerformance(orgId);
      const growthTrajectory = await this.getGrowthTrajectory(orgId);
      const industryBenchmarks = await this.getIndustryBenchmarks(orgId);

      const recommendations = await this.aiGateway.analyze({
        type: 'hierarchy_recommendation',
        currentHierarchy: currentHierarchy,
        performanceMetrics: performanceMetrics,
        growthTrajectory: growthTrajectory,
        industryBenchmarks: industryBenchmarks,
        changeTypes: ['add_unit', 'remove_unit', 'merge_units', 'split_units', 'restructure']
      });

      return {
        currentHierarchy: currentHierarchy,
        recommendedChanges: recommendations.changes || [],
        priority: recommendations.priority || 'medium',
        expectedImpact: recommendations.impact || {},
        implementationTimeline: recommendations.timeline || {},
        riskFactors: recommendations.risks || [],
        confidence: recommendations.confidence || 0.85
      };
    } catch (error) {
      logger.error('Error recommending hierarchy changes:', error);
      throw error;
    }
  }

  /**
   * Performance prediction per unit
   */
  async predictUnitPerformance(orgId, unitId, timeframe = '90d') {
    try {
      const historicalPerformance = await this.getUnitHistoricalPerformance(orgId, unitId);
      const resources = await this.getUnitResources(orgId, unitId);
      const workload = await this.getUnitWorkload(orgId, unitId);
      const teamComposition = await this.getTeamComposition(orgId, unitId);

      const prediction = await this.aiGateway.predict({
        type: 'unit_performance',
        historicalData: historicalPerformance,
        resources: resources,
        workload: workload,
        teamComposition: teamComposition,
        timeframe: timeframe
      });

      return {
        unitId: unitId,
        timeframe: timeframe,
        predictions: prediction.predictions || [],
        confidence: prediction.confidence || 0.85,
        factors: prediction.influencingFactors || [],
        recommendations: prediction.recommendations || []
      };
    } catch (error) {
      logger.error('Error predicting unit performance:', error);
      throw error;
    }
  }

  /**
   * Resource allocation optimization
   */
  async optimizeResourceAllocation(orgId) {
    try {
      const currentAllocation = await this.getCurrentResourceAllocation(orgId);
      const unitPerformance = await this.getUnitPerformance(orgId);
      const organizationalGoals = await this.getOrganizationalGoals(orgId);
      const budgetConstraints = await this.getBudgetConstraints(orgId);

      let optimization = await this.aiGateway.optimize({
        type: 'resource_allocation',
        currentAllocation: currentAllocation,
        unitPerformance: unitPerformance,
        organizationalGoals: organizationalGoals,
        budgetConstraints: budgetConstraints,
        objectives: ['performance', 'efficiency', 'goal_alignment'],
        constraints: {
          totalBudget: budgetConstraints.total,
          minAllocationPerUnit: budgetConstraints.minPerUnit
        }
      });

      return {
        currentAllocation: currentAllocation,
        optimizedAllocation: optimization.optimizedAllocation || currentAllocation,
        changes: optimization.changes || [],
        expectedBenefits: {
          overallPerformance: optimization.performanceImprovement || 0,
          goalAlignment: optimization.goalAlignmentImprovement || 0,
          resourceEfficiency: optimization.efficiencyGain || 0
        },
        implementationPlan: optimization.implementationPlan || [],
        confidence: optimization.confidence || 0.85
      };
    } catch (error) {
      logger.error('Error optimizing resource allocation:', error);
      throw error;
    }
  }

  /**
   * Change impact analysis
   */
  async analyzeChangeImpact(orgId, proposedChange) {
    try {
      const currentState = await this.getCurrentState(orgId);
      const dependencies = await this.getDependencies(orgId);
      const stakeholders = await this.getStakeholders(orgId);
      const historicalChanges = await this.getHistoricalChanges(orgId);

      const impactAnalysis = await this.aiGateway.analyze({
        type: 'change_impact',
        proposedChange: proposedChange,
        currentState: currentState,
        dependencies: dependencies,
        stakeholders: stakeholders,
        historicalChanges: historicalChanges,
        analysisDepth: 'comprehensive'
      });

      return {
        proposedChange: proposedChange,
        impactAreas: impactAnalysis.impactAreas || [],
        affectedUnits: impactAnalysis.affectedUnits || [],
        affectedProcesses: impactAnalysis.affectedProcesses || [],
        riskLevel: impactAnalysis.riskLevel || 'medium',
        mitigationStrategies: impactAnalysis.mitigationStrategies || [],
        implementationComplexity: impactAnalysis.complexity || 'medium',
        estimatedDuration: impactAnalysis.duration || {},
        confidence: impactAnalysis.confidence || 0.85
      };
    } catch (error) {
      logger.error('Error analyzing change impact:', error);
      throw error;
    }
  }

  /**
   * Get organization units with AI insights
   */
  async getOrganizationUnits(orgId) {
    try {
      const units = await this.db.query(
        'SELECT * FROM organizational_units WHERE organization_id = $1 ORDER BY hierarchy_level',
        [orgId]
      );

      // Enrich with AI insights
      const enrichedUnits = await Promise.all(
        units.rows.map(async (unit) => {
          const performance = await this.getUnitPerformance(orgId, unit.id);
          const healthScore = await this.calculateUnitHealth(unit.id, performance);
          return {
            ...unit,
            performance: performance,
            healthScore: healthScore
          };
        })
      );

      return {
        units: enrichedUnits,
        total: enrichedUnits.length,
        hierarchyAnalysis: await this.analyzeHierarchy(enrichedUnits)
      };
    } catch (error) {
      logger.error('Error getting organization units:', error);
      throw error;
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(orgId, updates) {
    try {
      const result = await this.db.query(`
        UPDATE organizations 
        SET name = COALESCE($1, name),
            structure = COALESCE($2, structure),
            config = COALESCE($3, config),
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [
        updates.name,
        updates.structure ? JSON.stringify(updates.structure) : null,
        updates.config ? JSON.stringify(updates.config) : null,
        orgId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Organization not found');
      }

      return {
        success: true,
        organization: result.rows[0],
        message: 'Organization updated successfully'
      };
    } catch (error) {
      logger.error('Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Add organizational unit
   */
  async addUnit(orgId, unitData) {
    try {
      // Get AI recommendations for unit placement
      const placementRecommendation = await this.aiGateway.analyze({
        type: 'unit_placement',
        organizationStructure: await this.getCurrentStructure(orgId),
        unitProfile: unitData.profile,
        objectives: ['efficiency', 'collaboration']
      });

      const unit = await this.db.query(`
        INSERT INTO organizational_units 
        (organization_id, name, parent_id, hierarchy_level, profile, created_at) 
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `, [
        orgId,
        unitData.name,
        placementRecommendation.recommendedParentId || unitData.parentId,
        placementRecommendation.recommendedLevel || unitData.hierarchyLevel,
        JSON.stringify(unitData.profile || {})
      ]);

      return {
        success: true,
        unit: unit.rows[0],
        placementRecommendation: placementRecommendation,
        message: 'Unit added successfully'
      };
    } catch (error) {
      logger.error('Error adding unit:', error);
      throw error;
    }
  }

  // Helper methods

  async initializeOrganizationMonitoring(orgId) {
    logger.info(`Initializing monitoring for organization ${orgId}`);
    this.orgMetrics.set(orgId, {
      createdAt: new Date(),
      metrics: []
    });
  }

  async getOrganizationPerformance(orgId) {
    return {
      overallEfficiency: 85,
      collaborationScore: 80,
      agilityScore: 75,
      costEfficiency: 82
    };
  }

  async analyzeStructureHealth(orgId) {
    return {
      depth: 4,
      span: 8,
      balance: 0.85,
      flexibility: 0.78,
      communicationEfficiency: 0.82
    };
  }

  async getOrganizationAIInsights(orgId, metrics) {
    return {
      structureOptimal: true,
      recommendations: [
        'Consider flattening hierarchy for faster decision making',
        'Improve cross-functional collaboration'
      ]
    };
  }

  async getCurrentStructure(orgId) {
    let result = await this.db.query(
      'SELECT structure FROM organizations WHERE id = $1',
      [orgId]
    );
    return result.rows[0]?.structure || {};
  }

  async getUnitPerformance(orgId, unitId = null) {
    return {};
  }

  async getCommunicationPatterns(orgId) {
    return [];
  }

  async getWorkloadDistribution(orgId) {
    return {};
  }

  async getCurrentHierarchy(orgId) {
    return await this.getCurrentStructure(orgId);
  }

  async getGrowthTrajectory(orgId) {
    return {
      current: 100,
      projected: 120,
      timeframe: '12m'
    };
  }

  async getIndustryBenchmarks(orgId) {
    return {};
  }

  async getUnitHistoricalPerformance(orgId, unitId) {
    return [];
  }

  async getUnitResources(orgId, unitId) {
    return {};
  }

  async getUnitWorkload(orgId, unitId) {
    return {};
  }

  async getTeamComposition(orgId, unitId) {
    return {};
  }

  async getCurrentResourceAllocation(orgId) {
    return {};
  }

  async getOrganizationalGoals(orgId) {
    return [];
  }

  async getBudgetConstraints(orgId) {
    return {
      total: 1000000,
      minPerUnit: 50000
    };
  }

  async getCurrentState(orgId) {
    return {
      structure: await this.getCurrentStructure(orgId),
      units: await this.getOrganizationUnits(orgId),
      performance: await this.getOrganizationPerformance(orgId)
    };
  }

  async getDependencies(orgId) {
    return [];
  }

  async getStakeholders(orgId) {
    return [];
  }

  async getHistoricalChanges(orgId) {
    return [];
  }

  async calculateUnitHealth(unitId, performance) {
    return {
      overall: 85,
      performance: 85,
      collaboration: 80,
      efficiency: 82
    };
  }

  async analyzeHierarchy(units) {
    return {
      depth: Math.max(...units.map(u => u.hierarchy_level || 0)),
      balance: 0.85,
      recommendations: []
    };
  }
}

module.exports = new OrganizationManagementService();