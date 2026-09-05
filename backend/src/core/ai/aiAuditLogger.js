/**
 * AI Audit Logger
 * Component ID: EBD-CMP-00000007
 * Purpose: AI decision audit trail and provenance tracking
 * 
 * This module provides comprehensive audit logging for all AI decisions
 * including full provenance tracking, decision metadata, and audit trails.
 */

'use strict';

const { logger } = require('../../utils/logger');
const pool = require('../../database/pool');

/**
 * Audit log entry structure
 */
const AUDIT_SCHEMA = {
  id: 'UUID PRIMARY KEY',
  timestamp: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  actor_type: 'VARCHAR(50)', // user, agent, system
  actor_id: 'VARCHAR(255)',
  operation: 'VARCHAR(100)',
  engine_id: 'VARCHAR(50)',
  provider: 'VARCHAR(50)',
  model: 'VARCHAR(100)',
  prompt_version: 'VARCHAR(50)',
  input_summary: 'TEXT',
  output_summary: 'TEXT',
  confidence_score: 'DECIMAL(5,4)',
  confidence_dimensions: 'JSONB',
  data_sources: 'JSONB',
  tools_used: 'JSONB',
  rules_triggered: 'JSONB',
  decision_factors: 'JSONB',
  validation_status: 'VARCHAR(50)',
  human_approved: 'BOOLEAN',
  approver_id: 'VARCHAR(255)',
  cost_tokens: 'INTEGER',
  cost_usd: 'DECIMAL(10,4)',
  latency_ms: 'INTEGER',
  error: 'TEXT',
  trace_id: 'VARCHAR(100)',
};

/**
 * Log AI decision with full provenance
 */
async function logAIDecision(decision) {
  const auditId = generateAuditId();
  const timestamp = new Date().toISOString();
  
  const auditEntry = {
    id: auditId,
    timestamp,
    actor_type: decision.actorType || 'system',
    actor_id: decision.actorId || 'system',
    operation: decision.operation,
    engine_id: decision.engineId,
    provider: decision.provider,
    model: decision.model,
    prompt_version: decision.promptVersion,
    input_summary: summarizeInput(decision.input),
    output_summary: summarizeOutput(decision.output),
    confidence_score: decision.confidenceScore,
    confidence_dimensions: decision.confidenceDimensions || {},
    data_sources: decision.dataSources || [],
    tools_used: decision.toolsUsed || [],
    rules_triggered: decision.rulesTriggered || [],
    decision_factors: decision.decisionFactors || {},
    validation_status: decision.validationStatus || 'pending',
    human_approved: decision.humanApproved || false,
    approver_id: decision.approverId || null,
    cost_tokens: decision.costTokens || 0,
    cost_usd: decision.costUsd || 0,
    latency_ms: decision.latencyMs || 0,
    error: decision.error || null,
    trace_id: decision.traceId || generateTraceId(),
  };
  
  try {
    // Log to database
    await pool.query(
      `INSERT INTO ai_audit_logs (
        id, timestamp, actor_type, actor_id, operation, engine_id, provider, model,
        prompt_version, input_summary, output_summary, confidence_score,
        confidence_dimensions, data_sources, tools_used, rules_triggered,
        decision_factors, validation_status, human_approved, approver_id,
        cost_tokens, cost_usd, latency_ms, error, trace_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
      [
        auditEntry.id, auditEntry.timestamp, auditEntry.actor_type, auditEntry.actor_id,
        auditEntry.operation, auditEntry.engine_id, auditEntry.provider, auditEntry.model,
        auditEntry.prompt_version, auditEntry.input_summary, auditEntry.output_summary,
        auditEntry.confidence_score, JSON.stringify(auditEntry.confidence_dimensions),
        JSON.stringify(auditEntry.data_sources), JSON.stringify(auditEntry.tools_used),
        JSON.stringify(auditEntry.rules_triggered), JSON.stringify(auditEntry.decision_factors),
        auditEntry.validation_status, auditEntry.human_approved, auditEntry.approver_id,
        auditEntry.cost_tokens, auditEntry.cost_usd, auditEntry.latency_ms, auditEntry.error,
        auditEntry.trace_id,
      ]
    );
    
    logger.info(`AI decision logged: ${auditId} for operation ${decision.operation}`);
    
    return {
      auditId,
      success: true,
      traceId: auditEntry.trace_id,
    };
  } catch (error) {
    logger.error(`Failed to log AI decision: ${error.message}`);
    
    // Fallback to file logging
    logger.error(JSON.stringify(auditEntry));
    
    return {
      auditId,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Retrieve audit trail for a trace
 */
async function getAuditTrail(traceId) {
  try {
    const result = await pool.query(
      `SELECT * FROM ai_audit_logs WHERE trace_id = $1 ORDER BY timestamp ASC`,
      [traceId]
    );
    
    return {
      success: true,
      trail: result.rows,
    };
  } catch (error) {
    logger.error(`Failed to retrieve audit trail: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get audit logs for a specific actor
 */
async function getActorAuditLogs(actorId, options = {}) {
  const { limit = 100, offset = 0, startDate, endDate } = options;
  
  try {
    let query = `SELECT * FROM ai_audit_logs WHERE actor_id = $1`;
    const params = [actorId];
    
    if (startDate) {
      query += ` AND timestamp >= $2`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND timestamp <= $3`;
      params.push(endDate);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $4 OFFSET $5`;
    params.push(limit, offset);
    
    let result = await pool.query(query, params);
    
    return {
      success: true,
      logs: result.rows,
    };
  } catch (error) {
    logger.error(`Failed to retrieve actor audit logs: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get audit logs for a specific operation
 */
async function getOperationAuditLogs(operation, options = {}) {
  const { limit = 100, offset = 0, startDate, endDate } = options;
  
  try {
    let query = `SELECT * FROM ai_audit_logs WHERE operation = $1`;
    let params = [operation];
    
    if (startDate) {
      query += ` AND timestamp >= $2`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND timestamp <= $3`;
      params.push(endDate);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $4 OFFSET $5`;
    params.push(limit, offset);
    
    let result = await pool.query(query, params);
    
    return {
      success: true,
      logs: result.rows,
    };
  } catch (error) {
    logger.error(`Failed to retrieve operation audit logs: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate unique audit ID
 */
function generateAuditId() {
  return `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique trace ID
 */
function generateTraceId() {
  return `TRACE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Summarize input for audit logging
 */
function summarizeInput(input) {
  if (typeof input === 'string') {
    return input.substring(0, 500) + (input.length > 500 ? '...' : '');
  }
  if (typeof input === 'object') {
    return JSON.stringify(input).substring(0, 500) + '...';
  }
  return String(input).substring(0, 500);
}

/**
 * Summarize output for audit logging
 */
function summarizeOutput(output) {
  if (typeof output === 'string') {
    return output.substring(0, 500) + (output.length > 500 ? '...' : '');
  }
  if (typeof output === 'object') {
    return JSON.stringify(output).substring(0, 500) + '...';
  }
  return String(output).substring(0, 500);
}

/**
 * Get audit statistics
 */
async function getAuditStatistics(options = {}) {
  const { startDate, endDate } = options;
  
  try {
    let query = `SELECT 
      COUNT(*) as total_decisions,
      COUNT(*) FILTER (WHERE human_approved = true) as human_approved,
      COUNT(*) FILTER (WHERE validation_status = 'approved') as validation_approved,
      COUNT(*) FILTER (WHERE validation_status = 'rejected') as validation_rejected,
      AVG(confidence_score) as avg_confidence,
      SUM(cost_tokens) as total_tokens,
      SUM(cost_usd) as total_cost,
      AVG(latency_ms) as avg_latency
    FROM ai_audit_logs`;
    
    let params = [];
    
    if (startDate) {
      query += ` WHERE timestamp >= $1`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND timestamp <= $2`;
      params.push(endDate);
    }
    
    let result = await pool.query(query, params);
    
    return {
      success: true,
      statistics: result.rows[0],
    };
  } catch (error) {
    logger.error(`Failed to retrieve audit statistics: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  logAIDecision,
  getAuditTrail,
  getActorAuditLogs,
  getOperationAuditLogs,
  getAuditStatistics,
  generateAuditId,
  generateTraceId,
};