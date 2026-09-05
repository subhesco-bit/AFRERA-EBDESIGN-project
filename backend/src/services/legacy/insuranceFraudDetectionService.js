/**
 * Insurance Fraud Detection Service
 * Advanced ML-based fraud detection for insurance claims and policies
 */

const { logger } = require('../../utils/logger');

class InsuranceFraudDetectionService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../../database/pool');
  }

  /**
   * Analyze claim for fraud indicators
   */
  async analyzeClaimForFraud(claimId) {
    try {
      // Get claim details
      const claimQuery = `
        SELECT 
          c.*,
          p.policy_number,
          p.policyholder_id,
          p.insurance_type,
          u.name as claimant_name,
          u.fdi_score as claimant_fdi,
          u.kyc_verified
        FROM claims c
        JOIN insurance_policies p ON c.policy_id = p.id
        JOIN users u ON p.policyholder_id = u.id
        WHERE c.id = $1
      `;

      const claimResult = await this.pool.query(claimQuery, [claimId]);
      const claim = claimResult.rows[0];

      if (!claim) {
        throw new Error('Claim not found');
      }

      // Run fraud detection checks
      const fraudIndicators = await this.runFraudChecks(claim);

      // Calculate overall fraud score
      const fraudScore = this.calculateFraudScore(fraudIndicators);

      // Determine risk level
      const riskLevel = this.determineRiskLevel(fraudScore);

      // Save analysis results
      await this.saveFraudAnalysis(claimId, fraudIndicators, fraudScore, riskLevel);

      return {
        claimId,
        fraudScore,
        riskLevel,
        indicators: fraudIndicators,
        recommendedAction: this.getRecommendedAction(riskLevel),
        analyzedAt: new Date()
      };
    } catch (error) {
      logger.error('Error analyzing claim for fraud', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Run comprehensive fraud checks
   */
  async runFraudChecks(claim) {
    try {
      const indicators = [];

      // Check 1: Claim frequency
      const frequencyCheck = await this.checkClaimFrequency(claim.policyholder_id);
      indicators.push(frequencyCheck);

      // Check 2: Claim amount anomaly
      const amountCheck = await this.checkClaimAmountAnomaly(claim);
      indicators.push(amountCheck);

      // Check 3: Timing patterns
      const timingCheck = await this.checkTimingPatterns(claim);
      indicators.push(timingCheck);

      // Check 4: Document consistency
      const documentCheck = await this.checkDocumentConsistency(claim);
      indicators.push(documentCheck);

      // Check 5: Location consistency
      const locationCheck = await this.checkLocationConsistency(claim);
      indicators.push(locationCheck);

      // Check 6: Policyholder behavior
      const behaviorCheck = await this.checkPolicyholderBehavior(claim);
      indicators.push(behaviorCheck);

      // Check 7: Network analysis
      const networkCheck = await this.checkNetworkAnalysis(claim);
      indicators.push(networkCheck);

      // Check 8: Historical patterns
      const historicalCheck = await this.checkHistoricalPatterns(claim);
      indicators.push(historicalCheck);

      return indicators;
    } catch (error) {
      logger.error('Error running fraud checks', { error: error.message, stack: error.stack });
      throw new Error(`Failed to run fraud checks: ${error.message}`);
    }
  }

  /**
   * Check claim frequency
   */
  async checkClaimFrequency(policyholderId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as claim_count,
          AVG(amount) as avg_claim_amount
        FROM claims
        WHERE policyholder_id = $1
          AND created_at >= NOW() - INTERVAL '12 months'
      `;

      const result = await this.pool.query(query, [policyholderId]);
      const data = result.rows[0];

      const claimCount = parseInt(data.claim_count);
      const avgAmount = parseFloat(data.avg_claim_amount) || 0;

      // High frequency is suspicious (> 3 claims in 12 months)
      const isSuspicious = claimCount > 3;
      const riskScore = isSuspicious ? Math.min(claimCount * 15, 75) : 0;

      return {
        check: 'claim_frequency',
        description: 'Number of claims in last 12 months',
        value: claimCount,
        averageAmount: avgAmount,
        threshold: 3,
        isSuspicious,
        riskScore,
        details: `${claimCount} claims in 12 months (threshold: 3)`
      };
    } catch (error) {
      logger.error('Error checking claim frequency', { error: error.message, stack: error.stack });
      return { check: 'claim_frequency', error: error.message, riskScore: 0 };
    }
  }

  /**
   * Check claim amount anomaly
   */
  async checkClaimAmountAnomaly(claim) {
    try {
      let query = `
        SELECT 
          AVG(amount) as avg_amount,
          STDDEV(amount) as std_dev,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY amount) as p75,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY amount) as p95
        FROM claims
        WHERE insurance_type = $1
          AND status = 'approved'
      `;

      let result = await this.pool.query(query, [claim.insurance_type]);
      const stats = result.rows[0];

      let avgAmount = parseFloat(stats.avg_amount) || 0;
      const stdDev = parseFloat(stats.std_dev) || 0;
      const p95 = parseFloat(stats.p95) || 0;

      // Calculate z-score
      const zScore = stdDev > 0 ? (claim.amount - avgAmount) / stdDev : 0;

      // Anomaly if > 2 standard deviations or > 95th percentile
      let isSuspicious = Math.abs(zScore) > 2 || claim.amount > p95;
      let riskScore = isSuspicious ? Math.min(Math.abs(zScore) * 20, 80) : 0;

      return {
        check: 'claim_amount_anomaly',
        description: 'Claim amount compared to historical averages',
        value: claim.amount,
        averageAmount: avgAmount,
        zScore: zScore.toFixed(2),
        percentile95: p95,
        isSuspicious,
        riskScore,
        details: `Amount ${claim.amount} vs avg ${avgAmount.toFixed(2)} (z-score: ${zScore.toFixed(2)})`
      };
    } catch (error) {
      logger.error('Error checking claim amount anomaly', { error: error.message, stack: error.stack });
      return { check: 'claim_amount_anomaly', error: error.message, riskScore: 0 };
    }
  }

  /**
   * Check timing patterns
   */
  async checkTimingPatterns(claim) {
    try {
      const incidentDate = new Date(claim.incident_date);
      const filingDate = new Date(claim.created_at);
      const daysToReport = Math.ceil((filingDate - incidentDate) / (1000 * 60 * 60 * 24));

      // Check if claim filed immediately (suspicious)
      const immediateFiling = daysToReport <= 1;

      // Check if claim filed very late (suspicious)
      const lateFiling = daysToReport > 30;

      // Check for weekend/holiday claims
      const isWeekend = [0, 6].includes(incidentDate.getDay());

      let isSuspicious = immediateFiling || lateFiling;
      let riskScore = immediateFiling ? 40 : lateFiling ? 30 : 0;

      return {
        check: 'timing_patterns',
        description: 'Timing of claim submission',
        daysToReport,
        immediateFiling,
        lateFiling,
        isWeekend,
        isSuspicious,
        riskScore,
        details: `Claim filed ${daysToReport} days after incident`
      };
    } catch (error) {
      logger.error('Error checking timing patterns', { error: error.message, stack: error.stack });
      return { check: 'timing_patterns', error: error.message, riskScore: 0 };
    }
  }

  /**
   * Check document consistency
   */
  async checkDocumentConsistency(claim) {
    try {
      let query = `
        SELECT 
          COUNT(*) as document_count,
          COUNT(CASE WHEN document_type = 'police_report' THEN 1 END) as has_police_report,
          COUNT(CASE WHEN document_type = 'medical_report' THEN 1 END) as has_medical_report,
          COUNT(CASE WHEN document_type = 'evidence' THEN 1 END) as has_evidence
        FROM claim_documents
        WHERE claim_id = $1
      `;

      let result = await this.pool.query(query, [claim.id]);
      const docs = result.rows[0];

      const documentCount = parseInt(docs.document_count);
      const hasRequiredDocs = docs.has_police_report > 0 || docs.has_medical_report > 0;

      // Suspicious if no documents or missing required docs
      let isSuspicious = documentCount === 0 || !hasRequiredDocs;
      let riskScore = documentCount === 0 ? 60 : !hasRequiredDocs ? 40 : 0;

      return {
        check: 'document_consistency',
        description: 'Completeness and validity of claim documents',
        documentCount,
        hasRequiredDocs,
        isSuspicious,
        riskScore,
        details: `${documentCount} documents uploaded, required docs: ${hasRequiredDocs ? 'yes' : 'no'}`
      };
    } catch (error) {
      logger.error('Error checking document consistency', { error: error.message, stack: error.stack });
      return { check: 'document_consistency', error: error.message, riskScore: 0 };
    }
  }

  /**
   * Check location consistency
   */
  async checkLocationConsistency(claim) {
    try {
      // Get policyholder's registered locations
      let query = `
        SELECT 
          address,
          district,
          state
        FROM users
        WHERE id = $1
      `;

      let result = await this.pool.query(query, [claim.policyholder_id]);
      const user = result.rows[0];

      const claimLocation = claim.incident_location.toLowerCase();
      const userLocation = `${user.district}, ${user.state}`.toLowerCase();

      // Check if claim location is far from registered location
      const locationMatch = claimLocation.includes(user.district.toLowerCase()) ||
                           claimLocation.includes(user.state.toLowerCase());

      let isSuspicious = !locationMatch;
      let riskScore = isSuspicious ? 35 : 0;

      return {
        check: 'location_consistency',
        description: 'Consistency of incident location with registered address',
        claimLocation,
        userLocation,
        locationMatch,
        isSuspicious,
        riskScore,
        details: `Claim location: ${claimLocation}, Registered: ${userLocation}`
      };
    } catch (error) {
      logger.error('Error checking location consistency', { error: error.message, stack: error.stack });
      return { check: 'location_consistency', error: error.message, riskScore: 0 };
    }
  }

  /**
   * Check policyholder behavior
   */
  async checkPolicyholderBehavior(claim) {
    try {
      const fdiScore = claim.claimant_fdi || 0;
      const kycVerified = claim.kyc_verified;

      // Low FDI score or unverified KYC is suspicious
      const lowFDI = fdiScore < 50;
      const unverifiedKYC = !kycVerified;

      let isSuspicious = lowFDI || unverifiedKYC;
      let riskScore = (lowFDI ? 25 : 0) + (unverifiedKYC ? 30 : 0);

      return {
        check: 'policyholder_behavior',
        description: 'Policyholder credibility and verification status',
        fdiScore,
        kycVerified,
        lowFDI,
        unverifiedKYC,
        isSuspicious,
        riskScore,
        details: `FDI: ${fdiScore}, KYC: ${kycVerified ? 'verified' : 'unverified'}`
      };
    } catch (error) {
      logger.error('Error checking policyholder behavior', { error: error.message, stack: error.stack });
      return { check: 'policyholder_behavior', error: error.message, riskScore: 0 };
    }
  }

  /**
   * Check network analysis (related entities)
   */
  async checkNetworkAnalysis(claim) {
    try {
      // Check for patterns with same phone, email, or address
      let query = `
        SELECT 
          COUNT(DISTINCT id) as related_policyholders
        FROM users
        WHERE phone = (SELECT phone FROM users WHERE id = $1)
           OR email = (SELECT email FROM users WHERE id = $1)
           OR address = (SELECT address FROM users WHERE id = $1)
           AND id != $1
      `;

      let result = await this.pool.query(query, [claim.policyholder_id]);
      const relatedCount = parseInt(result.rows[0].related_policyholders);

      // Multiple related policyholders could indicate fraud rings
      let isSuspicious = relatedCount > 2;
      let riskScore = isSuspicious ? relatedCount * 15 : 0;

      return {
        check: 'network_analysis',
        description: 'Analysis of related entities and potential fraud rings',
        relatedCount,
        isSuspicious,
        riskScore,
        details: `${relatedCount} related policyholders found`
      };
    } catch (error) {
      logger.error('Error checking network analysis', { error: error.message, stack: error.stack });
      return { check: 'network_analysis', error: error.message, riskScore: 0 };
    }
  }

  /**
   * Check historical patterns
   */
  async checkHistoricalPatterns(claim) {
    try {
      let query = `
        SELECT 
          COUNT(*) as previous_claims,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_claims,
          COUNT(CASE WHEN status = 'under_investigation' THEN 1 END) as investigated_claims
        FROM claims
        WHERE policyholder_id = $1
      `;

      let result = await this.pool.query(query, [claim.policyholder_id]);
      const history = result.rows[0];

      const previousClaims = parseInt(history.previous_claims);
      const rejectedClaims = parseInt(history.rejected_claims);
      const investigatedClaims = parseInt(history.investigated_claims);

      // History of rejected or investigated claims is suspicious
      let isSuspicious = rejectedClaims > 0 || investigatedClaims > 0;
      let riskScore = (rejectedClaims * 30) + (investigatedClaims * 20);

      return {
        check: 'historical_patterns',
        description: 'Historical claim patterns and outcomes',
        previousClaims,
        rejectedClaims,
        investigatedClaims,
        isSuspicious,
        riskScore,
        details: `${previousClaims} previous claims, ${rejectedClaims} rejected, ${investigatedClaims} investigated`
      };
    } catch (error) {
      logger.error('Error checking historical patterns', { error: error.message, stack: error.stack });
      return { check: 'historical_patterns', error: error.message, riskScore: 0 };
    }
  }

  /**
   * Calculate overall fraud score
   */
  calculateFraudScore(indicators) {
    let totalScore = 0;
    let suspiciousCount = 0;

    for (const indicator of indicators) {
      if (indicator.error) continue;

      totalScore += indicator.riskScore || 0;
      if (indicator.isSuspicious) suspiciousCount++;
    }

    // Normalize to 0-100 scale
    const normalizedScore = Math.min(totalScore, 100);

    return {
      totalScore: normalizedScore,
      suspiciousIndicators: suspiciousCount,
      totalIndicators: indicators.length,
      breakdown: indicators
    };
  }

  /**
   * Determine risk level based on fraud score
   */
  determineRiskLevel(fraudScore) {
    if (fraudScore.totalScore >= 70) return 'critical';
    if (fraudScore.totalScore >= 50) return 'high';
    if (fraudScore.totalScore >= 30) return 'medium';
    if (fraudScore.totalScore >= 15) return 'low';
    return 'minimal';
  }

  /**
   * Get recommended action based on risk level
   */
  getRecommendedAction(riskLevel) {
    const actions = {
      'critical': 'Immediate investigation, claim suspension, potential fraud report',
      'high': 'Detailed investigation, additional documentation required',
      'medium': 'Standard investigation, verification of key details',
      'low': ' expedited processing with minor verification',
      'minimal': 'Standard processing'
    };

    return actions[riskLevel] || 'Standard processing';
  }

  /**
   * Save fraud analysis results
   */
  async saveFraudAnalysis(claimId, indicators, fraudScore, riskLevel) {
    try {
      let query = `
        INSERT INTO fraud_analysis 
        (claim_id, indicators, fraud_score, risk_level, analyzed_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (claim_id) 
        DO UPDATE SET 
          indicators = $2,
          fraud_score = $3,
          risk_level = $4,
          analyzed_at = NOW()
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        claimId,
        JSON.stringify(indicators),
        JSON.stringify(fraudScore),
        riskLevel
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error saving fraud analysis', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get fraud analysis for a claim
   */
  async getFraudAnalysis(claimId) {
    try {
      let query = `
        SELECT * FROM fraud_analysis
        WHERE claim_id = $1
        ORDER BY analyzed_at DESC
        LIMIT 1
      `;

      let result = await this.pool.query(query, [claimId]);

      if (result.rows.length === 0) {
        throw new Error('Fraud analysis not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting fraud analysis', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get fraud statistics
   */
  async getFraudStatistics(filters = {}) {
    const { startDate, endDate, insuranceType } = filters;

    try {
      let query = `
        SELECT 
          COUNT(*) as total_analyzed,
          COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_count,
          COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_count,
          COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_count,
          COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_count,
          AVG(fraud_score->>'totalScore') as avg_fraud_score
        FROM fraud_analysis fa
        JOIN claims c ON fa.claim_id = c.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        query += ` AND fa.analyzed_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND fa.analyzed_at <= $${paramCount}`;
        params.push(endDate);
      }

      if (insuranceType) {
        paramCount++;
        query += ` AND c.insurance_type = $${paramCount}`;
        params.push(insuranceType);
      }

      let result = await this.pool.query(query, params);

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting fraud statistics', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new InsuranceFraudDetectionService();
