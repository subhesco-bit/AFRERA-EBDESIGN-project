/**
 * Credit risk assessment. Split out of the former monolithic
 * services/aiService.js (M11).
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

/**
 * Assess credit risk for a farmer
 */
async function assessCreditRisk(farmerId) {
  try {
    const pg = getPostgreSQL();

    // Get farmer data
    const farmerQuery = `
      SELECT f.*, u.name, u.phone
      FROM farmers f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = $1
    `;

    const farmerResult = await pg.query(farmerQuery, [farmerId]);
    const farmer = farmerResult.rows[0];

    // Get FDI score
    const fdiScore = await calculateFDI(farmerId);

    // Get repayment history
    const repaymentQuery = `
      SELECT
        COUNT(*) as total_loans,
        SUM(CASE WHEN status = 'fully_paid' THEN 1 ELSE 0 END) as paid_loans,
        SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END) as defaulted_loans,
        AVG(CASE WHEN due_date < payment_date THEN EXTRACT(DAY FROM (payment_date - due_date)) ELSE 0 END) as avg_days_late
      FROM loans
      WHERE farmer_id = $1
    `;

    const repaymentData = await pg.query(repaymentQuery, [farmerId]);
    const repayment = repaymentData.rows[0];

    // Calculate credit score (0-100)
    const creditScore = calculateCreditScore(fdiScore, repayment, farmer);

    // Determine risk level
    let riskLevel, maxAdvancePercentage, interestRate;
    if (creditScore >= 80) {
      riskLevel = 'low';
      maxAdvancePercentage = 50;
      interestRate = 8.5;
    } else if (creditScore >= 60) {
      riskLevel = 'medium';
      maxAdvancePercentage = 35;
      interestRate = 11.0;
    } else if (creditScore >= 40) {
      riskLevel = 'medium-high';
      maxAdvancePercentage = 20;
      interestRate = 14.5;
    } else {
      riskLevel = 'high';
      maxAdvancePercentage = 10;
      interestRate = 18.0;
    }

    logger.info(`Credit risk assessment for farmer ${farmerId}: ${riskLevel} (score: ${creditScore})`);

    return {
      farmer_id: farmerId,
      credit_score: creditScore,
      risk_level: riskLevel,
      confidence: 0.89,
      fdi_score: fdiScore.score,
      repayment_history: {
        total_loans: repayment.total_loans,
        repayment_rate: repayment.total_loans > 0
          ? (repayment.paid_loans / repayment.total_loans * 100).toFixed(1)
          : 0,
        default_rate: repayment.total_loans > 0
          ? (repayment.defaulted_loans / repayment.total_loans * 100).toFixed(1)
          : 0,
        avg_days_late: repayment.avg_days_late || 0
      },
      credit_parameters: {
        max_advance_percentage: maxAdvancePercentage,
        interest_rate: interestRate,
        loan_limit: calculateLoanLimit(creditScore, farmer.farm_size || 1)
      },
      factors: {
        fdi_contribution: fdiScore.score * 0.4,
        repayment_contribution: (repayment.total_loans > 0
          ? (repayment.paid_loans / repayment.total_loans) * 100 * 0.35
          : 50) * 0.35,
        certification_contribution: (farmer.certification_count || 0) * 5 * 0.15,
        experience_contribution: Math.min((farmer.years_active || 0) * 2, 10) * 0.1
      },
      recommendations: generateCreditRecommendations(riskLevel, creditScore)
    };
  } catch (error) {
    logger.error('Error assessing credit risk', { error: error.message, stack: error.stack });
    throw error;
  }
}

function calculateFDI(farmerId) {
  // This would call the FDI calculation service
  // For now, return a mock response
  return {
    score: 72,
    grade: 'B+',
    advance_percentage: 30
  };
}

function calculateCreditScore(fdiScore, repayment, farmer) {
  const fdiContribution = fdiScore.score * 0.4;
  const repaymentContribution = repayment.total_loans > 0
    ? (repayment.paid_loans / repayment.total_loans) * 100 * 0.35
    : 50 * 0.35;
  const certificationContribution = (farmer.certification_count || 0) * 5 * 0.15;
  const experienceContribution = Math.min((farmer.years_active || 0) * 2, 10) * 0.1;

  return Math.round(fdiContribution + repaymentContribution + certificationContribution + experienceContribution);
}

function calculateLoanLimit(creditScore, farmSize) {
  const baseLimit = 100000;
  const scoreMultiplier = creditScore / 100;
  const sizeMultiplier = Math.min(farmSize, 10);

  return Math.round(baseLimit * scoreMultiplier * sizeMultiplier);
}

function generateCreditRecommendations(riskLevel, creditScore) {
  const recommendations = [];
  if (riskLevel === 'low') {
    recommendations.push('Eligible for maximum advance percentage');
    recommendations.push('Consider offering premium interest rates');
  } else if (riskLevel === 'high') {
    recommendations.push('Require additional collateral');
    recommendations.push('Consider smaller advance amounts');
  }
  return recommendations;
}

module.exports = {
  assessCreditRisk,
  calculateFDI,
  calculateCreditScore,
  calculateLoanLimit,
  generateCreditRecommendations
};
