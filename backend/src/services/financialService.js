/**
 * Financial Service
 * Manages loans, advances, credit scoring, and financial transactions
 */

const { logger } = require('../utils/logger');
const { withTransaction } = require('../core/withTransaction');
const { getPostgreSQL } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');
const decisionSupportService = require('./decisionSupportService');
const { mcda } = require('../core/mcda');
const outcomeSink = require('../core/outcomeSink');

/**
 * Apply for loan
 */
async function applyForLoan(loanData) {
  try {
    const pg = getPostgreSQL();
    
    const loanNumber = generateLoanNumber();
    
    const query = `
      INSERT INTO loans (loan_number, farmer_id, amount, interest_rate, term_months,
                        purpose, collateral_type, collateral_value, guarantor_name,
                        guarantor_phone, status, application_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;
    
    const result = await pg.query(query, [
      loanNumber,
      loanData.farmer_id,
      loanData.amount,
      loanData.interest_rate,
      loanData.term_months,
      loanData.purpose,
      loanData.collateral_type || null,
      loanData.collateral_value || null,
      loanData.guarantor_name || null,
      loanData.guarantor_phone || null,
      'pending'
    ]);
    
    logger.info(`Loan application created: ${loanNumber}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating loan application', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get loans by farmer
 */
async function getFarmerLoans(farmerId, filters = {}) {
  try {
    const pg = getPostgreSQL();
    
    const { status } = filters;
    
    let query = `
      SELECT l.*, 
             (SELECT COUNT(*) FROM emi_schedule WHERE loan_id = l.id AND status = 'pending') as pending_emis
      FROM loans l
      WHERE l.farmer_id = $1
    `;
    
    const params = [farmerId];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      query += ` AND l.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY l.application_date DESC';
    
    const result = await pg.query(query, params);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching loans', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Approve loan
 */
async function approveLoan(loanId, approvalData) {
  try {
    const pg = getPostgreSQL();
    
    // Get loan details
    const loanQuery = 'SELECT * FROM loans WHERE id = $1';
    const loanResult = await pg.query(loanQuery, [loanId]);
    
    if (loanResult.rows.length === 0) {
      throw new Error('Loan not found');
    }
    
    const loan = loanResult.rows[0];
    
    // Update loan status
    await pg.query(
      `UPDATE loans 
       SET status = 'approved', approval_date = NOW()
       WHERE id = $1`,
      [loanId]
    );
    
    // Generate EMI schedule
    await generateEMISchedule(loan);
    
    logger.info(`Loan approved: ${loan.loan_number}`);
    
    return { success: true, message: 'Loan approved' };
  } catch (error) {
    logger.error('Error approving loan', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Generate EMI schedule
 */
async function generateEMISchedule(loan) {
  try {
    const pg = getPostgreSQL();
    
    const monthlyRate = loan.interest_rate / 12 / 100;
    const emi = (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, loan.term_months)) /
                (Math.pow(1 + monthlyRate, loan.term_months) - 1);
    
    const startDate = new Date();
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + loan.term_months);
    
    // ---- TRANSACTION BOUNDARY (BR-08) -----------------------------------
    //
    // The maturity date and EVERY instalment row are one unit.
    //
    // A partial schedule is the worst possible outcome here. If the loop fails
    // at instalment 7 of 24, the loan has a maturity date implying two years
    // and a schedule containing seven months. Nothing errors afterwards: the
    // borrower's next payment is due, the eighth is not, and the loan silently
    // appears to close early. Recovery is manual and the borrower is the one
    // who discovers it.
    //
    // The whole schedule is written or none of it is.
    const emiClient = await pg.connect();
    try {
      await emiClient.query('BEGIN');

      await emiClient.query(
        'UPDATE loans SET maturity_date = $1 WHERE id = $2',
        [maturityDate, loan.id]
      );

      for (let i = 1; i <= loan.term_months; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const principal = emi - (loan.amount * monthlyRate);
        const interest = emi - principal;

        await emiClient.query(
          `INSERT INTO emi_schedule (loan_id, installment_number, due_date, principal_amount,
                                     interest_amount, total_amount, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [loan.id, i, dueDate, principal, interest, emi]
        );
      }

      await emiClient.query('COMMIT');
    } catch (txErr) {
      await emiClient.query('ROLLBACK');
      throw txErr;
    } finally {
      emiClient.release();
    }
    // ---- end transaction -------------------------------------------------

    logger.info(`EMI schedule generated for loan: ${loan.loan_number}`);
  } catch (error) {
    logger.error('Error generating EMI schedule', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Request advance
 */
async function requestAdvance(advanceData) {
  try {
    const pg = getPostgreSQL();
    
    // Get farmer to check FDI
    const farmerQuery = 'SELECT fdi_score, max_advance_percentage FROM farmers WHERE id = $1';
    const farmerResult = await pg.query(farmerQuery, [advanceData.farmer_id]);
    
    if (farmerResult.rows.length === 0) {
      throw new Error('Farmer not found');
    }
    
    const farmer = farmerResult.rows[0];
    const maxAdvance = advanceData.amount * (farmer.max_advance_percentage / 100);
    
    if (advanceData.advance_amount > maxAdvance) {
      throw new Error(`Advance amount exceeds maximum allowed (${maxAdvance})`);
    }
    
    const advanceNumber = generateAdvanceNumber();
    
    const query = `
      INSERT INTO advances (advance_number, farmer_id, contract_id, amount, advance_percentage,
                           tranche_number, total_tranches, as_input_credit, input_items)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await pg.query(query, [
      advanceNumber,
      advanceData.farmer_id,
      advanceData.contract_id || null,
      advanceData.amount,
      advanceData.advance_percentage,
      1,
      3,
      advanceData.as_input_credit || false,
      JSON.stringify(advanceData.input_items || [])
    ]);
    
    logger.info(`Advance requested: ${advanceNumber}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error requesting advance', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get advances by farmer
 */
async function getFarmerAdvances(farmerId) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      SELECT a.*, c.contract_number
      FROM advances a
      LEFT JOIN contracts c ON a.contract_id = c.id
      WHERE a.farmer_id = $1
      ORDER BY a.created_at DESC
    `;
    
    const result = await pg.query(query, [farmerId]);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching advances', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get EMI schedule for loan
 */
async function getEMISchedule(loanId) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      SELECT * FROM emi_schedule
      WHERE loan_id = $1
      ORDER BY installment_number
    `;
    
    const result = await pg.query(query, [loanId]);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching EMI schedule', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Pay EMI
 */
async function payEMI(emiId, paymentData) {
  try {
    const pg = getPostgreSQL();
    
    // Get EMI details
    const emiQuery = 'SELECT * FROM emi_schedule WHERE id = $1';
    const emiResult = await pg.query(emiQuery, [emiId]);
    
    if (emiResult.rows.length === 0) {
      throw new Error('EMI not found');
    }
    
    const emi = emiResult.rows[0];
    
    if (emi.status === 'paid') {
      throw new Error('EMI already paid');
    }
    
    // ---- TRANSACTION BOUNDARY (BR-08) -----------------------------------
    //
    // Marking an instalment paid and closing the loan when it was the last one
    // are one decision. Split, a crash between them leaves the final EMI paid
    // and the loan still 'active' — the borrower has cleared their debt and the
    // system says they have not, which is the version of this failure that
    // damages someone's credit standing rather than merely the data.
    //
    // repeatable read is deliberate: the COUNT that decides whether this was
    // the last instalment must not see a concurrent payment land halfway
    // through, or two simultaneous final payments each conclude they were not
    // the last and the loan never closes.
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE emi_schedule
            SET status = 'paid', paid_date = NOW(), paid_amount = $1
          WHERE id = $2`,
        [paymentData.amount || emi.total_amount, emiId]
      );

      const { rows: stats } = await client.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'paid')::int AS paid
           FROM emi_schedule WHERE loan_id = $1`,
        [emi.loan_id]
      );

      if (stats[0].total === stats[0].paid) {
        // Single quotes. The original used "completed" — double quotes are an
        // IDENTIFIER in PostgreSQL, so this asked for a column called
        // completed and errored every time a loan was fully repaid.
        await client.query(
          "UPDATE loans SET status = 'completed' WHERE id = $1",
          [emi.loan_id]
        );
      }
    }, { name: 'payEMI', isolation: 'repeatable read' });
    // ---- end transaction -------------------------------------------------

    logger.info(`EMI paid: ${emiId}`);
    
    return { success: true, message: 'EMI paid successfully' };
  } catch (error) {
    logger.error('Error paying EMI', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get credit score
 */
async function getCreditScore(farmerId) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      SELECT * FROM credit_scores
      WHERE farmer_id = $1
      ORDER BY calculated_at DESC
      LIMIT 1
    `;
    
    const result = await pg.query(query, [farmerId]);
    
    if (result.rows.length === 0) {
      // Generate initial credit score
      return await generateCreditScore(farmerId);
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching credit score', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Generate credit score
 */
async function generateCreditScore(farmerId) {
  try {
    const pg = getPostgreSQL();
    
    // Get farmer data
    const farmerQuery = `
      SELECT f.*, 
             (SELECT COUNT(*) FROM loans WHERE farmer_id = f.id AND status = 'completed') as completed_loans,
             (SELECT COUNT(*) FROM loans WHERE farmer_id = f.id AND status = 'defaulted') as defaulted_loans
      FROM farmers f
      WHERE f.id = $1
    `;
    
    const farmerResult = await pg.query(farmerQuery, [farmerId]);
    const farmer = farmerResult.rows[0];
    
    if (!farmer) {
      throw new Error('Farmer not found');
    }
    
    // Calculate credit score (simplified)
    let score = 50; // Base score
    
    score += farmer.fdi_score * 0.3; // FDI contribution
    score += farmer.certification_count * 5; // Certifications
    score += farmer.completed_loans * 10; // Completed loans
    score -= farmer.defaulted_loans * 30; // Defaulted loans penalty
    score += Math.min(farmer.years_active * 2, 10); // Experience
    
    score = Math.max(0, Math.min(100, score));
    
    // Determine grade
    let grade;
    if (score >= 80) grade = 'Excellent';
    else if (score >= 60) grade = 'Good';
    else if (score >= 40) grade = 'Fair';
    else grade = 'Poor';
    
    const query = `
      INSERT INTO credit_scores (farmer_id, score, grade, factors, calculated_at, valid_until)
      VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '90 days')
      RETURNING *
    `;
    
    const result = await pg.query(query, [
      farmerId,
      score,
      grade,
      JSON.stringify({
        fdi: farmer.fdi_score,
        certifications: farmer.certification_count,
        completed_loans: farmer.completed_loans,
        defaulted_loans: farmer.defaulted_loans,
        years_active: farmer.years_active
      })
    ]);
    
    logger.info(`Credit score generated for farmer ${farmerId}: ${score} (${grade})`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error generating credit score', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * corpCreditEligible — B2B corporate credit gating.
 *
 * Ported from the v42 prototype (docs/MISSING_BUSINESS_LOGIC_EXTRACTION.md
 * #1). The original took turnoverCr/vintageYrs as plain arguments; this is
 * that gap closed with a real lookup — `buyers` (041_rural_life_os_schema.sql)
 * records buyer identity but had no turnover or vintage columns, so
 * migration 061 added `annual_turnover_cr` and `business_established_year`.
 * The gating thresholds themselves are NOT reimplemented here: they are
 * called straight from decisionSupportService.corpCreditEligible() so the
 * two callers (this real-data path, and the existing client-supplied
 * /api/v1/decision-support/corp-credit-eligible endpoint) can never drift
 * out of sync on the ₹5Cr/3yr and ₹1Cr/1yr thresholds.
 */
async function getBuyerCreditEligibility(buyerId) {
  try {
    const pg = getPostgreSQL();

    const { rows } = await pg.query(
      `SELECT id, name, buyer_type, annual_turnover_cr, business_established_year
         FROM buyers WHERE id = $1`,
      [buyerId]
    );

    if (rows.length === 0) {
      throw new Error('Buyer not found');
    }

    const buyer = rows[0];
    const turnoverCr = buyer.annual_turnover_cr !== null ? Number(buyer.annual_turnover_cr) : 0;
    const vintageYrs = buyer.business_established_year
      ? new Date().getFullYear() - buyer.business_established_year
      : 0;

    const eligibility = decisionSupportService.corpCreditEligible(turnoverCr, vintageYrs);

    return {
      buyerId: buyer.id,
      buyerName: buyer.name,
      buyerType: buyer.buyer_type,
      turnoverCr,
      vintageYrs,
      // A buyer with neither field on record is being scored as a brand-new
      // net0 account by default (correct fallback), but that is different
      // from an account genuinely verified as new — flag which one this is.
      dataComplete: buyer.annual_turnover_cr !== null && buyer.business_established_year !== null,
      ...eligibility
    };
  } catch (error) {
    logger.error('Error computing buyer credit eligibility', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * farmerCreditRiskScore — farmer-side credit-risk SCORE (0-100), NOT a binary
 * eligible/not-eligible gate like getBuyerCreditEligibility above.
 *
 * Routed through core/mcda.js's weighted-criteria framework rather than a
 * bespoke weighted sum — matching how allocScore (dynamicPricingService.js)
 * scores order-to-farmer lot allocation. generateCreditScore() above (the
 * existing farmer credit score) predates this pattern and is left as-is; this
 * is a separate, additive score, not a replacement.
 *
 * Real signals only, no invented columns:
 *   - FDI score              farmers.fdi_score / fdi_last_calculated
 *   - Loan/advance repayment loans + emi_schedule (on-time vs overdue vs defaulted)
 *   - Payment history        farmer_revenue (real settled transactions, trailing 12mo)
 *   - Order track record     farmers.fulfilled_orders / farmers.disputes
 *
 * The result is logged via core/outcomeSink.recordPrediction() against
 * prediction_type 'farmer_credit_risk' (resolution rule in migration 063,
 * resolved by core/outcomeResolver.js against real emi_schedule repayment
 * behaviour after the fact) — so this score's own accuracy becomes
 * measurable over time instead of being a number nobody ever checks.
 */
async function farmerCreditRiskScore(farmerId, opts = {}) {
  try {
    const pg = getPostgreSQL();
    const actorId = opts.actorId || 'financialService:farmerCreditRiskScore';

    const { rows: farmerRows } = await pg.query(
      `SELECT fdi_score, fdi_last_calculated, fulfilled_orders, disputes
         FROM farmers WHERE id = $1`,
      [farmerId]
    );
    if (farmerRows.length === 0) {
      throw new Error('Farmer not found');
    }
    const farmer = farmerRows[0];

    // Loan/advance repayment: EMIs actually due so far, on-time vs overdue,
    // plus any loan that has genuinely defaulted.
    const { rows: emiRows } = await pg.query(
      `SELECT
          COUNT(*) FILTER (WHERE e.due_date <= CURRENT_DATE)::int AS due_count,
          COUNT(*) FILTER (
            WHERE e.due_date <= CURRENT_DATE AND e.status = 'paid'
              AND e.paid_date IS NOT NULL AND e.paid_date::date <= e.due_date
          )::int AS on_time_count,
          COUNT(*) FILTER (WHERE l.status = 'defaulted')::int AS defaulted_loans
         FROM loans l
         LEFT JOIN emi_schedule e ON e.loan_id = l.id
        WHERE l.farmer_id = $1`,
      [farmerId]
    );
    const emi = emiRows[0] || {};

    // Payment history: real settled farmer_revenue transactions, trailing 12mo.
    const { rows: revRows } = await pg.query(
      `SELECT
          COUNT(*)::int AS total_count,
          COUNT(*) FILTER (WHERE payment_status = 'received')::int AS received_count,
          COUNT(*) FILTER (WHERE payment_status IN ('disputed', 'written_off'))::int AS bad_count
         FROM farmer_revenue
        WHERE farmer_id = $1 AND received_on >= CURRENT_DATE - INTERVAL '12 months'`,
      [farmerId]
    );
    const rev = revRows[0] || {};

    // ---- Criterion: FDI score ----------------------------------------------
    const fdiScore = farmer.fdi_score !== null && farmer.fdi_score !== undefined ? Number(farmer.fdi_score) : 50;
    const fdiQuality = farmer.fdi_last_calculated ? 'real' : 'assumed';

    // ---- Criterion: loan/advance repayment ---------------------------------
    const dueCount = Number(emi.due_count || 0);
    const defaultedLoans = Number(emi.defaulted_loans || 0);
    let repayScore;
    let repayQuality;
    if (dueCount === 0 && defaultedLoans === 0) {
      repayScore = 50; // no repayment history yet — neutral, not penalised
      repayQuality = 'assumed';
    } else {
      const onTimePct = dueCount > 0 ? (Number(emi.on_time_count || 0) / dueCount) * 100 : 100;
      repayScore = Math.max(0, onTimePct - defaultedLoans * 40);
      repayQuality = 'real';
    }

    // ---- Criterion: payment history (farmer_revenue) -----------------------
    const totalRev = Number(rev.total_count || 0);
    let payScore;
    let payQuality;
    if (totalRev === 0) {
      payScore = 50; // no settled transactions on record yet — neutral
      payQuality = 'assumed';
    } else {
      const receivedPct = (Number(rev.received_count || 0) / totalRev) * 100;
      const badPenalty = (Number(rev.bad_count || 0) / totalRev) * 100;
      payScore = Math.max(0, Math.min(100, receivedPct - badPenalty));
      payQuality = 'real';
    }

    // ---- Criterion: order fulfilment track record --------------------------
    const fulfilled = Number(farmer.fulfilled_orders || 0);
    const disputes = Number(farmer.disputes || 0);
    let trackScore;
    let trackQuality;
    if (fulfilled === 0) {
      trackScore = 50; // no order history yet — neutral, not penalised
      trackQuality = 'assumed';
    } else {
      const disputeRate = disputes / fulfilled;
      // Rewards a longer clean track record (capped) and penalises disputes.
      trackScore = Math.max(0, Math.min(100, 70 - disputeRate * 200 + Math.min(fulfilled, 20) * 1.5));
      trackQuality = 'real';
    }

    const criteria = [
      { name: 'FDI score', weight: 0.30, score: Math.max(0, Math.min(100, fdiScore)), dataQuality: fdiQuality },
      { name: 'Loan/advance repayment history', weight: 0.30, score: repayScore, dataQuality: repayQuality },
      { name: 'Payment history (settled transactions)', weight: 0.25, score: payScore, dataQuality: payQuality },
      { name: 'Order fulfilment track record', weight: 0.15, score: trackScore, dataQuality: trackQuality },
    ];

    const result = mcda(criteria);
    const riskBand = result.total >= 70 ? 'low_risk' : result.total >= 45 ? 'medium_risk' : 'high_risk';

    // Log the prediction so its accuracy is measurable later. Never blocks or
    // fails this response — recordPrediction swallows and logs its own errors.
    const realCount = criteria.filter((c) => c.dataQuality === 'real').length;
    const inputQuality = realCount === criteria.length ? 'real' : realCount === 0 ? 'assumed' : 'estimated';
    const predictionId = await outcomeSink.recordPrediction({
      actorId,
      predictionType: 'farmer_credit_risk',
      subjectType: 'farmer',
      subjectId: farmerId,
      predictedValue: result.total,
      predictedLabel: riskBand,
      statedConfidence: result.confidence,
      inputQuality,
      horizonDays: 180,
      resolvesOn: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });

    return {
      farmerId,
      score: result.total,
      riskBand,
      verdict: result.verdict,
      confidence: result.confidence,
      confidenceLabel: result.confidenceLabel,
      mostSensitiveTo: result.mostSensitiveTo,
      criteria: result.criteria,
      predictionId,
    };
  } catch (error) {
    logger.error('Error computing farmer credit risk score', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Helper functions
 */
function generateLoanNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `LOAN-${timestamp}`;
}

function generateAdvanceNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `ADV-${timestamp}`;
}

/**
 * Express router for financial service
 */
const express = require('express');
const router = express.Router();

// Apply for loan
router.post('/loans', authMiddleware, async (req, res) => {
  try {
    const loan = await applyForLoan(req.body);
    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get farmer loans
router.get('/loans/farmer/:farmerId', async (req, res) => {
  try {
    const filters = { status: req.query.status };
    const loans = await getFarmerLoans(req.params.farmerId, filters);
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve loan
router.post('/loans/:id/approve', authMiddleware, async (req, res) => {
  try {
    const result = await approveLoan(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get EMI schedule
router.get('/loans/:id/emi', async (req, res) => {
  try {
    const schedule = await getEMISchedule(req.params.id);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pay EMI
router.post('/emi/:id/pay', authMiddleware, async (req, res) => {
  try {
    const result = await payEMI(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request advance
router.post('/advances', authMiddleware, async (req, res) => {
  try {
    const advance = await requestAdvance(req.body);
    res.status(201).json(advance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get farmer advances
router.get('/advances/farmer/:farmerId', async (req, res) => {
  try {
    const advances = await getFarmerAdvances(req.params.farmerId);
    res.json(advances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get credit score
router.get('/credit-score/:farmerId', async (req, res) => {
  try {
    const creditScore = await getCreditScore(req.params.farmerId);
    res.json(creditScore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Corporate (B2B) buyer credit eligibility — NET0/NET30/NET60 gating
router.get('/buyers/:buyerId/credit-eligibility', authMiddleware, async (req, res) => {
  try {
    const eligibility = await getBuyerCreditEligibility(req.params.buyerId);
    res.json(eligibility);
  } catch (error) {
    res.status(error.message === 'Buyer not found' ? 404 : 500).json({ error: error.message });
  }
});

// Farmer-side credit-risk SCORE (0-100, MCDA-based) — distinct from
// /credit-score/:farmerId above, which is the pre-existing bespoke score.
router.get('/credit-risk-score/:farmerId', authMiddleware, async (req, res) => {
  try {
    const actorId = req.user?.id ? `user:${req.user.id}` : undefined;
    const result = await farmerCreditRiskScore(req.params.farmerId, { actorId });
    res.json(result);
  } catch (error) {
    res.status(error.message === 'Farmer not found' ? 404 : 500).json({ error: error.message });
  }
});

module.exports = {
  router,
  applyForLoan,
  getFarmerLoans,
  approveLoan,
  requestAdvance,
  getFarmerAdvances,
  getEMISchedule,
  payEMI,
  getCreditScore,
  generateCreditScore,
  getBuyerCreditEligibility,
  farmerCreditRiskScore
};
