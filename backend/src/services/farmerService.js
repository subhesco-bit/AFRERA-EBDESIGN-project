/**
 * Farmer & FPO Service
 * Manages farmer profiles, FPOs, certifications, FDI calculations, and Wallet
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');

/**
 * Get farmer by ID
 */
async function getFarmerById(farmerId) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      SELECT f.*, u.name, u.email, u.phone, u.status as user_status,
             fpo.name as fpo_name, fpo.registration_number as fpo_reg
      FROM farmers f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN fpos fpo ON f.fpo_id = fpo.id
      WHERE f.id = $1
    `;
    
    const result = await pg.query(query, [farmerId]);
    
    if (result.rows.length === 0) {
      throw new Error('Farmer not found');
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching farmer', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get farmers with filtering
 */
async function getFarmers(filters = {}, pagination = {}) {
  try {
    const pg = getPostgreSQL();
    
    const { fpo_id, min_fdi, max_fdi, certification_count_min, status } = filters;
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = pagination;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT f.*, u.name, u.email, u.phone, fpo.name as fpo_name
      FROM farmers f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN fpos fpo ON f.fpo_id = fpo.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (fpo_id) {
      paramCount++;
      query += ` AND f.fpo_id = $${paramCount}`;
      params.push(fpo_id);
    }
    
    if (min_fdi) {
      paramCount++;
      query += ` AND f.fdi_score >= $${paramCount}`;
      params.push(min_fdi);
    }
    
    if (max_fdi) {
      paramCount++;
      query += ` AND f.fdi_score <= $${paramCount}`;
      params.push(max_fdi);
    }
    
    if (certification_count_min) {
      paramCount++;
      query += ` AND f.certification_count >= $${paramCount}`;
      params.push(certification_count_min);
    }
    
    if (status) {
      paramCount++;
      query += ` AND f.status = $${paramCount}`;
      params.push(status);
    }
    
    const countQuery = query.replace(/SELECT f\.\*, u\.name, u\.email, u\.phone, fpo\.name as fpo_name/, 'SELECT COUNT(*)');
    const countResult = await pg.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    query += ` ORDER BY f.${sort_by} ${sort_order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await pg.query(query, params);
    
    return {
      farmers: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching farmers', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Calculate Farmer Development Index (FDI)
 */
async function calculateFDI(farmerId) {
  try {
    const pg = getPostgreSQL();
    
    // Get farmer data
    const farmerQuery = `
      SELECT f.*, 
             (SELECT COUNT(*) FROM farmer_certifications WHERE farmer_id = f.id) as cert_count,
             (SELECT COUNT(*) FROM training_records WHERE farmer_id = f.id) as training_count,
             (SELECT COUNT(*) FROM orders WHERE user_id = f.user_id AND status = 'delivered') as fulfilled_orders
      FROM farmers f
      WHERE f.id = $1
    `;
    
    const farmerResult = await pg.query(farmerQuery, [farmerId]);
    const farmer = farmerResult.rows[0];
    
    if (!farmer) {
      throw new Error('Farmer not found');
    }
    
    // FDI Calculation Factors
    const factors = {
      certifications: {
        weight: 0.25,
        score: Math.min(farmer.cert_count * 10, 25)
      },
      training: {
        weight: 0.15,
        score: Math.min(farmer.training_count * 5, 15)
      },
      fulfilledOrders: {
        weight: 0.20,
        score: Math.min(farmer.fulfilled_orders * 2, 20)
      },
      farmSize: {
        weight: 0.15,
        score: Math.min(farmer.farm_size_hectares * 3, 15)
      },
      yearsActive: {
        weight: 0.10,
        score: Math.min(farmer.years_active * 2, 10)
      },
      disputes: {
        weight: 0.15,
        score: Math.max(15 - (farmer.disputes * 5), 0)
      }
    };
    
    // Calculate weighted score
    const fdiScore = Object.values(factors).reduce((sum, factor) => sum + factor.score, 0);
    
    // Determine grade
    let grade;
    if (fdiScore >= 80) grade = 'A';
    else if (fdiScore >= 60) grade = 'B';
    else if (fdiScore >= 40) grade = 'C';
    else grade = 'D';
    
    // Calculate advance percentage based on FDI
    const advancePercentage = Math.round(fdiScore * 0.4);
    
    // Update farmer record
    await pg.query(
      `UPDATE farmers 
       SET fdi_score = $1, fdi_grade = $2, fdi_last_calculated = NOW(), 
           max_advance_percentage = $3, certification_count = $4
       WHERE id = $5`,
      [fdiScore, grade, advancePercentage, farmer.cert_count, farmerId]
    );
    
    logger.info(`FDI calculated for farmer ${farmerId}: ${fdiScore} (${grade})`);
    
    return {
      farmer_id: farmerId,
      fdi_score: fdiScore,
      fdi_grade: grade,
      advance_percentage: advancePercentage,
      factors: factors,
      calculated_at: new Date()
    };
  } catch (error) {
    logger.error('Error calculating FDI', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Add farmer certification
 */
async function addFarmerCertification(farmerId, certificationData) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      INSERT INTO farmer_certifications (farmer_id, certification_type, certificate_number,
                                         issuing_authority, issue_date, expiry_date, document_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await pg.query(query, [
      farmerId,
      certificationData.certification_type,
      certificationData.certificate_number,
      certificationData.issuing_authority,
      certificationData.issue_date,
      certificationData.expiry_date,
      certificationData.document_url || null
    ]);
    
    // Update farmer certification count
    await pg.query(
      'UPDATE farmers SET certification_count = certification_count + 1 WHERE id = $1',
      [farmerId]
    );
    
    // Recalculate FDI
    await calculateFDI(farmerId);
    
    logger.info(`Certification added for farmer ${farmerId}: ${certificationData.certification_type}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding certification', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get farmer certifications
 */
async function getFarmerCertifications(farmerId) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      SELECT * FROM farmer_certifications
      WHERE farmer_id = $1
      ORDER BY issue_date DESC
    `;
    
    const result = await pg.query(query, [farmerId]);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching certifications', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get FPOs
 */
async function getFPOs(filters = {}) {
  try {
    const pg = getPostgreSQL();
    
    const { state, min_members } = filters;
    
    let query = `
      SELECT fpo.*, 
             (SELECT COUNT(*) FROM farmers WHERE fpo_id = fpo.id) as member_count
      FROM fpos fpo
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (state) {
      paramCount++;
      query += ` AND fpo.state = $${paramCount}`;
      params.push(state);
    }
    
    if (min_members) {
      query += ` HAVING COUNT(*) >= $${paramCount + 1}`;
      params.push(min_members);
    }
    
    query += ' ORDER BY fpo.name';
    
    const result = await pg.query(query, params);
    
    return result.rows;
  } catch (error) {
    logger.error('Error fetching FPOs', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Wallet Functions
 */

async function getFarmerWallet(farmerId) {
  try {
    const pg = getPostgreSQL();
    const query = `
      SELECT fw.*,
             (SELECT COUNT(*) FROM wallet_transactions WHERE wallet_id = fw.id) as transaction_count
      FROM farmer_wallets fw
      WHERE fw.farmer_id = $1
    `;

    const result = await pg.query(query, [farmerId]);

    if (result.rows.length === 0) {
      // Create wallet if doesn't exist
      const createQuery = `
        INSERT INTO farmer_wallets (farmer_id, balance, currency, status)
        VALUES ($1, 0, 'INR', 'active')
        RETURNING *
      `;
      const createResult = await pg.query(createQuery, [farmerId]);
      return createResult.rows[0];
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting farmer wallet', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function getWalletTransactions(farmerId, filters = {}) {
  try {
    const pg = getPostgreSQL();
    const wallet = await getFarmerWallet(farmerId);
    const { type, status, page = 1, limit = 20 } = filters;

    let query = `
      SELECT wt.*,
             u.name as related_user_name
      FROM wallet_transactions wt
      LEFT JOIN users u ON wt.recipient_id = u.id
      WHERE wt.wallet_id = $1
    `;

    const params = [wallet.id];
    let paramCount = 1;

    if (type) {
      paramCount++;
      query += ` AND wt.type = $${paramCount}`;
      params.push(type);
    }

    if (status) {
      paramCount++;
      query += ` AND wt.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY wt.created_at DESC';

    const offset = (page - 1) * limit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pg.query(query, params);

    return {
      transactions: result.rows,
      pagination: { page, limit }
    };
  } catch (error) {
    logger.error('Error getting wallet transactions', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function depositToWallet(farmerId, amount, paymentMethod, reference) {
  try {
    const pg = getPostgreSQL();
    const wallet = await getFarmerWallet(farmerId);

    const query = `
      INSERT INTO wallet_transactions 
      (wallet_id, type, amount, balance_after, description, reference_id, payment_method, status)
      VALUES ($1, 'credit', $2, $3, $4, $5, $6, 'completed')
      RETURNING *
    `;

    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
    const result = await pg.query(query, [
      wallet.id,
      amount,
      newBalance,
      `Deposit via ${paymentMethod}`,
      reference,
      paymentMethod
    ]);

    logger.info(`Deposit of ${amount} to wallet ${wallet.id} successful`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error depositing to wallet', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function withdrawFromWallet(farmerId, amount, bankAccount, reference) {
  try {
    const pg = getPostgreSQL();
    const wallet = await getFarmerWallet(farmerId);

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      throw new Error('Insufficient balance');
    }

    const query = `
      INSERT INTO wallet_transactions 
      (wallet_id, type, amount, balance_after, description, reference_id, bank_account, status)
      VALUES ($1, 'debit', $2, $3, $4, $5, $6, 'completed')
      RETURNING *
    `;

    const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
    const result = await pg.query(query, [
      wallet.id,
      amount,
      newBalance,
      'Withdrawal to bank account',
      reference,
      bankAccount
    ]);

    logger.info(`Withdrawal of ${amount} from wallet ${wallet.id} successful`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error withdrawing from wallet', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function transferFromWallet(senderId, recipientId, amount, description) {
  try {
    const pg = getPostgreSQL();
    const senderWallet = await getFarmerWallet(senderId);

    if (parseFloat(senderWallet.balance) < parseFloat(amount)) {
      throw new Error('Insufficient balance');
    }

    // Get recipient wallet
    const recipientQuery = `
      SELECT id FROM farmer_wallets WHERE farmer_id = $1
    `;
    const recipientResult = await pg.query(recipientQuery, [recipientId]);

    if (recipientResult.rows.length === 0) {
      throw new Error('Recipient wallet not found');
    }

    const recipientWalletId = recipientResult.rows[0].id;

    // ---- TRANSACTION BOUNDARY (BR-08) -----------------------------------
    //
    // A wallet transfer is the textbook case: the debit and the credit are one
    // operation or money is created or destroyed.
    //
    // Without this, a failure between the two INSERTs leaves the sender debited
    // and the recipient uncredited — the platform has silently taken money from
    // a farmer. The reverse ordering would be worse: money appears from nowhere.
    //
    // SELECT ... FOR UPDATE on both wallets, ordered by id, is deliberate:
    //   * FOR UPDATE stops two concurrent transfers reading the same balance
    //     and both writing balance_after from a stale figure, which is how an
    //     account is overdrawn without any single transfer exceeding it.
    //   * Consistent lock ORDER prevents deadlock when two farmers transfer to
    //     each other at the same moment. Without it, transfer A holds wallet 1
    //     and wants 2 while B holds 2 and wants 1, and PostgreSQL kills one.
    const txClient = await pg.connect();
    let debitResult;
    try {
      await txClient.query('BEGIN');

      const lockIds = [senderWallet.id, recipientWalletId].sort();
      const { rows: locked } = await txClient.query(
        'SELECT id, balance FROM farmer_wallets WHERE id = ANY($1) ORDER BY id FOR UPDATE',
        [lockIds]
      );
      const byId = Object.fromEntries(locked.map((w) => [String(w.id), w]));
      const senderBal = parseFloat(byId[String(senderWallet.id)]?.balance ?? 0);
      const recipientBal = parseFloat(byId[String(recipientWalletId)]?.balance ?? 0);

      // Re-check under the lock. The balance read before the lock may be stale,
      // and that stale read is exactly what allows an overdraft.
      if (senderBal < parseFloat(amount)) {
        throw new Error(`Insufficient balance: ${senderBal} available, ${amount} requested`);
      }

      const senderNewBalance = senderBal - parseFloat(amount);
      const recipientNewBalance = recipientBal + parseFloat(amount);

      debitResult = await txClient.query(
        `INSERT INTO wallet_transactions
           (wallet_id, type, amount, balance_after, description, recipient_id, status)
         VALUES ($1, 'transfer', $2, $3, $4, $5, 'completed')
         RETURNING *`,
        [senderWallet.id, amount, senderNewBalance, description || 'Transfer', recipientId]
      );

      await txClient.query(
        `INSERT INTO wallet_transactions
           (wallet_id, type, amount, balance_after, description, reference_id, status)
         VALUES ($1, 'transfer', $2, $3, $4, $5, 'completed')
         RETURNING *`,
        [recipientWalletId, amount, recipientNewBalance,
          description || 'Transfer received', debitResult.rows[0].id]
      );

      // Balances themselves move inside the same boundary, or the ledger and
      // the wallet disagree about how much money exists.
      await txClient.query('UPDATE farmer_wallets SET balance = $1 WHERE id = $2',
        [senderNewBalance, senderWallet.id]);
      await txClient.query('UPDATE farmer_wallets SET balance = $1 WHERE id = $2',
        [recipientNewBalance, recipientWalletId]);

      await txClient.query('COMMIT');
    } catch (txErr) {
      await txClient.query('ROLLBACK');
      throw txErr;
    } finally {
      txClient.release();
    }
    // ---- end transaction -------------------------------------------------

    logger.info(`Transfer of ${amount} from ${senderId} to ${recipientId} successful`);
    return debitResult.rows[0];
  } catch (error) {
    logger.error('Error transferring from wallet', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function getWalletBalance(farmerId) {
  try {
    const pg = getPostgreSQL();
    const wallet = await getFarmerWallet(farmerId);
    return {
      balance: wallet.balance,
      currency: wallet.currency,
      status: wallet.status
    };
  } catch (error) {
    logger.error('Error getting wallet balance', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function linkBankAccount(farmerId, bankName, accountNumber, ifscCode, accountHolder) {
  try {
    const pg = getPostgreSQL();
    const query = `
      INSERT INTO farmer_bank_accounts 
      (farmer_id, bank_name, account_number, ifsc_code, account_holder, is_primary, verified)
      VALUES ($1, $2, $3, $4, $5, true, false)
      RETURNING *
    `;

    const result = await pg.query(query, [
      farmerId,
      bankName,
      accountNumber,
      ifscCode,
      accountHolder
    ]);

    logger.info(`Bank account linked for farmer ${farmerId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error linking bank account', { error: error.message, stack: error.stack });
    throw error;
  }
}

module.exports = {
  getFarmerById,
  getFarmers,
  calculateFDI,
  addFarmerCertification,
  getFarmerCertifications,
  getFPOs,
  getFarmerWallet,
  getWalletTransactions,
  depositToWallet,
  withdrawFromWallet,
  transferFromWallet,
  getWalletBalance,
  linkBankAccount
};
