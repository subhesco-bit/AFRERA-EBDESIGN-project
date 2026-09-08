/**
 * Vendor, Procurement & Supply Chain Operations Service
 * System 28 - Vendor, Procurement & Supply Chain Ops
 * 
 * This service provides dedicated functionality for vendor management, procurement operations,
 * and supply chain optimization, separate from marketplace operations.
 * 
 * Claude AI Compatible: All methods support AI decision integration and collaboration tracking
 * 
 * Database Tables:
 * - vendors
 * - vendor_profiles
 * - vendor_certifications
 * - vendor_performance
 * - procurement_requests
 * - procurement_approvals
 * - supply_chain_nodes
 * - supply_chain_optimization
 * 
 * API Routes: /api/v1/vendor-procurement/*
 */

const db = require('../database/pool');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const claudeAICoordinator = require('../core/claudeAICoordinator');
const aiCollaborationService = require('./aiCollaborationService');

class VendorProcurementService {
  /**
   * Register new vendor
   * @param {object} vendorData - Vendor registration data
   * @returns {object} Created vendor record
   * Database: vendors
   * TODO: Implement vendor registration with validation
   */
  async registerVendor(vendorData) {
    try {
      logger.info('VendorProcurementService.registerVendor called', { vendorData });
      
      // AI integration: Request vendor classification
      const aiDecision = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'analytical',
        query: 'Classify this vendor by category, risk level, and recommended terms',
        context: { vendorData },
        userId: vendorData.created_by,
        sessionId: null,
        agentPreference: 'business-analyst'
      });

      // Create vendor record
      const result = await db.query(
        `INSERT INTO vendors 
         (vendor_name, vendor_type, business_registration, contact_person, 
          email, phone, address, city, state, pincode, gstin, pan, 
          business_category, risk_level, ai_classification, status, 
          created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
         RETURNING *`,
        [
          vendorData.vendor_name,
          vendorData.vendor_type,
          vendorData.business_registration,
          vendorData.contact_person,
          vendorData.email,
          vendorData.phone,
          vendorData.address,
          vendorData.city,
          vendorData.state,
          vendorData.pincode,
          vendorData.gstin,
          vendorData.pan,
          vendorData.business_category,
          aiDecision?.decision?.risk_level || 'medium',
          JSON.stringify(aiDecision?.decision?.classification || {}),
          'pending_verification',
          vendorData.created_by
        ]
      );

      // Log AI collaboration
      await aiCollaborationService.logWork({
        agentType: 'devin',
        workType: 'vendor_registration',
        workDetails: { vendorId: result.rows[0].id, aiDecision: aiDecision.decisionId },
        status: 'completed'
      });

      logger.info(`Vendor registered: ${result.rows[0].id}`);
      return {
        success: true,
        data: result.rows[0],
        ai_classification: aiDecision?.decision
      };
    } catch (error) {
      logger.error('VendorProcurementService.registerVendor error', error);
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Get vendor profile
   * @param {string} vendorId - Vendor ID
   * @returns {object} Vendor profile with performance metrics
   * Database: vendors, vendor_profiles, vendor_performance
   * TODO: Implement profile retrieval with performance metrics
   */
  async getVendorProfile(vendorId) {
    try {
      logger.info('VendorProcurementService.getVendorProfile called', { vendorId });

      const vendorResult = await db.query(
        'SELECT * FROM vendors WHERE id = $1',
        [vendorId]
      );

      if (vendorResult.rows.length === 0) {
        throw new AppError('Vendor not found', 404);
      }

      const profileResult = await db.query(
        'SELECT * FROM vendor_profiles WHERE vendor_id = $1',
        [vendorId]
      );

      const performanceResult = await db.query(
        'SELECT * FROM vendor_performance WHERE vendor_id = $1 ORDER BY assessment_date DESC LIMIT 10',
        [vendorId]
      );

      return {
        success: true,
        data: {
          vendor: vendorResult.rows[0],
          profile: profileResult.rows[0] || null,
          performance_history: performanceResult.rows
        }
      };
    } catch (error) {
      logger.error('VendorProcurementService.getVendorProfile error', error);
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Create procurement request
   * @param {object} procurementData - Procurement request data
   * @returns {object} Created procurement request
   * Database: procurement_requests
   * TODO: Implement procurement request creation with AI-powered optimization
   */
  async createProcurementRequest(procurementData) {
    try {
      logger.info('VendorProcurementService.createProcurementRequest called', { procurementData });

      // AI integration: Optimize vendor selection and pricing
      const aiDecision = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'analytical',
        query: 'Optimize vendor selection and pricing for this procurement request',
        context: { procurementData },
        userId: procurementData.requested_by,
        sessionId: null,
        agentPreference: 'business-analyst'
      });

      const result = await db.query(
        `INSERT INTO procurement_requests 
         (request_number, organization_id, request_type, priority, 
          requested_items, budget_estimate, required_by, delivery_location, 
          specifications, ai_optimization, status, requested_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         RETURNING *`,
        [
          procurementData.request_number,
          procurementData.organization_id,
          procurementData.request_type,
          procurementData.priority,
          JSON.stringify(procurementData.requested_items),
          procurementData.budget_estimate,
          procurementData.required_by,
          procurementData.delivery_location,
          JSON.stringify(procurementData.specifications),
          JSON.stringify(aiDecision?.decision?.optimization || {}),
          'pending_approval',
          procurementData.requested_by
        ]
      );

      // Log AI collaboration
      await aiCollaborationService.logWork({
        agentType: 'devin',
        workType: 'procurement_optimization',
        workDetails: { requestId: result.rows[0].id, aiDecision: aiDecision.decisionId },
        status: 'completed'
      });

      logger.info(`Procurement request created: ${result.rows[0].id}`);
      return {
        success: true,
        data: result.rows[0],
        ai_optimization: aiDecision?.decision
      };
    } catch (error) {
      logger.error('VendorProcurementService.createProcurementRequest error', error);
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Optimize supply chain
   * @param {object} supplyChainData - Supply chain data for optimization
   * @returns {object} Optimization recommendations
   * Database: supply_chain_optimization
   * TODO: Implement AI-powered supply chain optimization
   */
  async optimizeSupplyChain(supplyChainData) {
    try {
      logger.info('VendorProcurementService.optimizeSupplyChain called', { supplyChainData });

      // AI integration: Comprehensive supply chain optimization
      const aiDecision = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'analytical',
        query: 'Optimize supply chain routes, inventory levels, and vendor allocation',
        context: { supplyChainData },
        userId: supplyChainData.requested_by,
        sessionId: null,
        agentPreference: 'operations-manager'
      });

      const result = await db.query(
        `INSERT INTO supply_chain_optimization 
         (optimization_id, supply_chain_type, current_metrics, 
          optimization_recommendations, expected_savings, implementation_plan, 
          generated_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          require('uuid').v4(),
          supplyChainData.supply_chain_type,
          JSON.stringify(supplyChainData.current_metrics),
          JSON.stringify(aiDecision?.decision?.recommendations || {}),
          aiDecision?.decision?.expected_savings || 0,
          JSON.stringify(aiDecision?.decision?.implementation_plan || {}),
          supplyChainData.requested_by
        ]
      );

      // Log AI collaboration
      await aiCollaborationService.logWork({
        agentType: 'devin',
        workType: 'supply_chain_optimization',
        workDetails: { optimizationId: result.rows[0].id, aiDecision: aiDecision.decisionId },
        status: 'completed'
      });

      logger.info(`Supply chain optimization created: ${result.rows[0].id}`);
      return {
        success: true,
        data: result.rows[0],
        ai_recommendations: aiDecision?.decision
      };
    } catch (error) {
      logger.error('VendorProcurementService.optimizeSupplyChain error', error);
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Evaluate vendor performance
   * @param {string} vendorId - Vendor ID
   * @param {object} performanceData - Performance evaluation data
   * @returns {object} Performance evaluation record
   * Database: vendor_performance
   * TODO: Implement performance evaluation with AI insights
   */
  async evaluateVendorPerformance(vendorId, performanceData) {
    try {
      logger.info('VendorProcurementService.evaluateVendorPerformance called', { vendorId, performanceData });

      // AI integration: Performance analysis and recommendations
      const aiDecision = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'analytical',
        query: 'Analyze vendor performance and provide improvement recommendations',
        context: { vendorId, performanceData },
        userId: performanceData.assessed_by,
        sessionId: null,
        agentPreference: 'business-analyst'
      });

      const result = await db.query(
        `INSERT INTO vendor_performance 
         (vendor_id, assessment_date, quality_score, delivery_score, 
          pricing_score, responsiveness_score, compliance_score, overall_score, 
          strengths, weaknesses, ai_recommendations, assessed_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         RETURNING *`,
        [
          vendorId,
          performanceData.assessment_date,
          performanceData.quality_score,
          performanceData.delivery_score,
          performanceData.pricing_score,
          performanceData.responsiveness_score,
          performanceData.compliance_score,
          performanceData.overall_score,
          JSON.stringify(performanceData.strengths),
          JSON.stringify(performanceData.weaknesses),
          JSON.stringify(aiDecision?.decision?.recommendations || {}),
          performanceData.assessed_by
        ]
      );

      // Update vendor risk level based on performance
      await db.query(
        'UPDATE vendors SET risk_level = $1, updated_at = NOW() WHERE id = $2',
        [aiDecision?.decision?.updated_risk_level || 'medium', vendorId]
      );

      // Log AI collaboration
      await aiCollaborationService.logWork({
        agentType: 'devin',
        workType: 'vendor_performance_evaluation',
        workDetails: { performanceId: result.rows[0].id, aiDecision: aiDecision.decisionId },
        status: 'completed'
      });

      logger.info(`Vendor performance evaluated: ${result.rows[0].id}`);
      return {
        success: true,
        data: result.rows[0],
        ai_insights: aiDecision?.decision
      };
    } catch (error) {
      logger.error('VendorProcurementService.evaluateVendorPerformance error', error);
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Track supply chain node
   * @param {object} nodeData - Supply chain node data
   * @returns {object} Supply chain node record
   * Database: supply_chain_nodes
   * TODO: Implement real-time supply chain node tracking
   */
  async trackSupplyChainNode(nodeData) {
    try {
      logger.info('VendorProcurementService.trackSupplyChainNode called', { nodeData });

      const result = await db.query(
        `INSERT INTO supply_chain_nodes 
         (node_id, node_type, parent_node_id, location, capacity, 
          current_utilization, status, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [
          nodeData.node_id,
          nodeData.node_type,
          nodeData.parent_node_id,
          JSON.stringify(nodeData.location),
          nodeData.capacity,
          nodeData.current_utilization,
          nodeData.status,
          JSON.stringify(nodeData.metadata)
        ]
      );

      logger.info(`Supply chain node tracked: ${result.rows[0].id}`);
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      logger.error('VendorProcurementService.trackSupplyChainNode error', error);
      throw new AppError(error.message, 500);
    }
  }

  /**
   * Get procurement dashboard data
   * @param {object} filters - Dashboard filters
   * @returns {object} Dashboard metrics and analytics
   * Database: Multiple tables for aggregation
   * TODO: Implement comprehensive dashboard analytics
   */
  async getProcurementDashboard(filters) {
    try {
      logger.info('VendorProcurementService.getProcurementDashboard called', { filters });

      // Get vendor counts by status
      const vendorStatusResult = await db.query(
        `SELECT status, COUNT(*) as count FROM vendors 
         WHERE organization_id = $1 GROUP BY status`,
        [filters.organization_id]
      );

      // Get procurement request status
      const procurementStatusResult = await db.query(
        `SELECT status, COUNT(*) as count FROM procurement_requests 
         WHERE organization_id = $1 GROUP BY status`,
        [filters.organization_id]
      );

      // Get supply chain metrics
      const supplyChainResult = await db.query(
        `SELECT node_type, status, COUNT(*) as count FROM supply_chain_nodes 
         WHERE organization_id = $1 GROUP BY node_type, status`,
        [filters.organization_id]
      );

      return {
        success: true,
        data: {
          vendor_status: vendorStatusResult.rows,
          procurement_status: procurementStatusResult.rows,
          supply_chain_metrics: supplyChainResult.rows
        }
      };
    } catch (error) {
      logger.error('VendorProcurementService.getProcurementDashboard error', error);
      throw new AppError(error.message, 500);
    }
  }
}

// Export as singleton
module.exports = new VendorProcurementService();