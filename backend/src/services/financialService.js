/**
 * Financial Service
 * Manages loans, advances, credit scoring, and financial transactions
 */

const { logger } = require('../utils/logger');
const { withTransaction } = require('../core/withTransaction');
const { getPostgreSQL } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');

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
  generateCreditScore
};
