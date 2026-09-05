/**
 * Cost Control Service — AF-CO (SAP equivalent: CO, "Controlling").
 *
 * WHY THIS EXISTS
 * docs/registry/12_ERP_COVERAGE.md and AFRERA_CLAUDE_BUILD_DIRECTIVE.md §8.6
 * name AF-CO as one of three ERP domains with zero modules and zero
 * endpoints. As with AF-AA, the schema was never the gap: migration
 * 996_enterprise_foundation already carries `cost_centers`, `profit_centers`,
 * `budgets` and `budget_lines`, wired into the same double-entry ledger every
 * other posted transaction uses — but nothing ever read or wrote them.
 *
 * NOT THE SAME THING AS costService.js / costRoutes.js
 * `/api/v1/costs` (costService.js) computes landed-cost breakup and the public
 * corridor pricing model for a shipment lane — a logistics/pricing concept.
 * Nor is it `fpo_cost_centres` (migration 056, served by rfqService.centrePnl)
 * — a simpler, FPO-scoped procurement/sale ledger with no chart-of-accounts
 * link. This service is the GL-integrated controlling layer: budget vs. actual
 * by cost centre, account and fiscal period, computed from posted
 * `journal_lines` — the actual accounting sense of "cost control."
 *
 * ACTUALS, NOT ASSERTIONS
 * "Actual" here always means SUM of posted journal lines for the account,
 * signed by the account's own `normal_balance` (debit-normal accounts:
 * debit − credit; credit-normal: credit − debit — this is the sign
 * convention the chart_of_accounts table itself documents; see 996's
 * comment on `normal_balance`). Draft or reversed journal entries are
 * excluded, so a budget line can never show an actual that has not actually
 * posted.
 */

'use strict';

const { logger } = require('../../../utils/logger');

class CostControlService {
  constructor() {
    this.pool = require('../../../database/pool');
  }

  // -------------------------------------------------------------------
  // Cost Centres
  // -------------------------------------------------------------------

  async createCostCenter(data) {
    try {
      const { companyId, code, name, parentCostCenterId, businessUnitId, departmentId, responsibleUserId } = data;
      if (!companyId) throw new Error('companyId is required');
      if (!code) throw new Error('code is required');
      if (!name) throw new Error('name is required');

      const result = await this.pool.query(
        `INSERT INTO cost_centers
           (company_id, code, name, parent_cost_center_id, business_unit_id, department_id, responsible_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [companyId, code, name, parentCostCenterId || null, businessUnitId || null, departmentId || null, responsibleUserId || null]
      );

      logger.info(`Cost centre created: ${result.rows[0].id} (${code})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating cost centre', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getCostCenters(companyId, filters = {}) {
    try {
      if (!companyId) throw new Error('companyId is required');
      let query = 'SELECT * FROM cost_centers WHERE company_id = $1';
      const params = [companyId];
      let paramCount = 1;

      if (filters.isActive !== undefined) {
        paramCount++;
        query += ` AND is_active = $${paramCount}`;
        params.push(filters.isActive === true || filters.isActive === 'true');
      }
      if (filters.businessUnitId) {
        paramCount++;
        query += ` AND business_unit_id = $${paramCount}`;
        params.push(filters.businessUnitId);
      }

      query += ' ORDER BY code ASC';
      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting cost centres', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getCostCenter(costCenterId) {
    try {
      let result = await this.pool.query('SELECT * FROM cost_centers WHERE id = $1', [costCenterId]);
      if (result.rows.length === 0) throw new Error('Cost centre not found');
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting cost centre', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Actual spend/earn at a cost centre, grouped by account type, from posted
   * journal lines only. `fiscalPeriodId` narrows to one period; omitted, this
   * covers every posted line ever recorded against the cost centre.
   */
  async getCostCenterActuals(costCenterId, filters = {}) {
    try {
      let query = `
        SELECT
          coa.account_type,
          SUM(CASE WHEN coa.normal_balance = 'DR' THEN jl.debit - jl.credit ELSE jl.credit - jl.debit END) AS amount
        FROM journal_lines jl
        JOIN journal_entries je ON je.id = jl.journal_entry_id
        JOIN chart_of_accounts coa ON coa.id = jl.account_id
        WHERE jl.cost_center_id = $1 AND je.status = 'posted'
      `;
      let params = [costCenterId];
      let paramCount = 1;

      if (filters.fiscalPeriodId) {
        paramCount++;
        query += ` AND je.fiscal_period_id = $${paramCount}`;
        params.push(filters.fiscalPeriodId);
      }

      query += ' GROUP BY coa.account_type ORDER BY coa.account_type';
      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting cost centre actuals', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Profit Centres
  // -------------------------------------------------------------------

  async createProfitCenter(data) {
    try {
      const { companyId, code, name, parentProfitCenterId, businessUnitId, responsibleUserId } = data;
      if (!companyId) throw new Error('companyId is required');
      if (!code) throw new Error('code is required');
      if (!name) throw new Error('name is required');

      let result = await this.pool.query(
        `INSERT INTO profit_centers
           (company_id, code, name, parent_profit_center_id, business_unit_id, responsible_user_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [companyId, code, name, parentProfitCenterId || null, businessUnitId || null, responsibleUserId || null]
      );

      logger.info(`Profit centre created: ${result.rows[0].id} (${code})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating profit centre', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getProfitCenters(companyId, filters = {}) {
    try {
      if (!companyId) throw new Error('companyId is required');
      let query = 'SELECT * FROM profit_centers WHERE company_id = $1';
      let params = [companyId];

      if (filters.isActive !== undefined) {
        query += ' AND is_active = $2';
        params.push(filters.isActive === true || filters.isActive === 'true');
      }

      query += ' ORDER BY code ASC';
      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting profit centres', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Budgets
  // -------------------------------------------------------------------

  async createBudget(data) {
    try {
      const { companyId, fiscalYearId, code, name, budgetType = 'operating' } = data;
      if (!companyId) throw new Error('companyId is required');
      if (!fiscalYearId) throw new Error('fiscalYearId is required');
      if (!code) throw new Error('code is required');
      if (!name) throw new Error('name is required');

      let result = await this.pool.query(
        `INSERT INTO budgets (company_id, fiscal_year_id, code, name, budget_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [companyId, fiscalYearId, code, name, budgetType]
      );

      logger.info(`Budget created: ${result.rows[0].id} (${code})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating budget', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getBudgets(companyId, filters = {}) {
    try {
      if (!companyId) throw new Error('companyId is required');
      let query = 'SELECT * FROM budgets WHERE company_id = $1';
      let params = [companyId];
      let paramCount = 1;

      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }
      if (filters.fiscalYearId) {
        paramCount++;
        query += ` AND fiscal_year_id = $${paramCount}`;
        params.push(filters.fiscalYearId);
      }

      query += ' ORDER BY code ASC';
      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting budgets', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getBudget(budgetId) {
    try {
      let result = await this.pool.query('SELECT * FROM budgets WHERE id = $1', [budgetId]);
      if (result.rows.length === 0) throw new Error('Budget not found');
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting budget', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /** Draft -> submitted -> approved/rejected, matching the budgets.status CHECK constraint. */
  async submitBudget(budgetId) {
    try {
      let result = await this.pool.query(
        `UPDATE budgets SET status = 'submitted' WHERE id = $1 AND status = 'draft' RETURNING *`,
        [budgetId]
      );
      if (result.rows.length === 0) {
        throw new Error('Budget not found or not in draft status');
      }
      return result.rows[0];
    } catch (error) {
      logger.error('Error submitting budget', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async approveBudget(budgetId, approverId, approved = true) {
    try {
      let result = await this.pool.query(
        `UPDATE budgets
         SET status = $1, approved_by = $2, approved_at = NOW()
         WHERE id = $3 AND status = 'submitted'
         RETURNING *`,
        [approved ? 'approved' : 'rejected', approverId, budgetId]
      );
      if (result.rows.length === 0) {
        throw new Error('Budget not found or not in submitted status');
      }
      logger.info(`Budget ${budgetId} ${approved ? 'approved' : 'rejected'} by ${approverId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error approving budget', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async addBudgetLine(budgetId, lineData) {
    try {
      const { accountId, costCenterId, profitCenterId, fiscalPeriodId, budgetedAmount, notes } = lineData;
      if (!accountId) throw new Error('accountId is required');
      if (!(Number(budgetedAmount) >= 0)) throw new Error('budgetedAmount must be >= 0');

      // Belt-and-braces: the budget must exist before a line can reference it.
      await this.getBudget(budgetId);

      let result = await this.pool.query(
        `INSERT INTO budget_lines
           (budget_id, account_id, cost_center_id, profit_center_id, fiscal_period_id, budgeted_amount, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [budgetId, accountId, costCenterId || null, profitCenterId || null, fiscalPeriodId || null, budgetedAmount, notes || null]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error adding budget line', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getBudgetLines(budgetId) {
    try {
      let result = await this.pool.query(
        `SELECT bl.*, coa.account_code, coa.account_name
         FROM budget_lines bl
         JOIN chart_of_accounts coa ON coa.id = bl.account_id
         WHERE bl.budget_id = $1
         ORDER BY coa.account_code`,
        [budgetId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting budget lines', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Budget vs. actual, per line. Actuals are derived live from posted
   * `journal_lines` (never stored — see 996's own comment on budget_lines:
   * "Actuals are derived from the ledger, not stored, to avoid drift"), so
   * this can never disagree with the general ledger.
   */
  async getBudgetVsActual(budgetId) {
    try {
      await this.getBudget(budgetId);

      const query = `
        SELECT
          bl.id AS budget_line_id,
          bl.account_id,
          coa.account_code,
          coa.account_name,
          bl.cost_center_id,
          cc.code AS cost_center_code,
          bl.fiscal_period_id,
          bl.budgeted_amount,
          COALESCE(actuals.actual_amount, 0) AS actual_amount,
          (COALESCE(actuals.actual_amount, 0) - bl.budgeted_amount) AS variance,
          CASE WHEN bl.budgeted_amount = 0 THEN NULL
               ELSE ROUND(((COALESCE(actuals.actual_amount, 0) - bl.budgeted_amount) / bl.budgeted_amount) * 100, 2)
          END AS variance_pct
        FROM budget_lines bl
        JOIN chart_of_accounts coa ON coa.id = bl.account_id
        LEFT JOIN cost_centers cc ON cc.id = bl.cost_center_id
        LEFT JOIN LATERAL (
          SELECT SUM(
            CASE WHEN coa2.normal_balance = 'DR' THEN jl.debit - jl.credit ELSE jl.credit - jl.debit END
          ) AS actual_amount
          FROM journal_lines jl
          JOIN journal_entries je ON je.id = jl.journal_entry_id
          JOIN chart_of_accounts coa2 ON coa2.id = jl.account_id
          WHERE je.status = 'posted'
            AND jl.account_id = bl.account_id
            AND (bl.cost_center_id IS NULL OR jl.cost_center_id = bl.cost_center_id)
            AND (bl.fiscal_period_id IS NULL OR je.fiscal_period_id = bl.fiscal_period_id)
        ) actuals ON TRUE
        WHERE bl.budget_id = $1
        ORDER BY coa.account_code
      `;

      let result = await this.pool.query(query, [budgetId]);
      const totalBudgeted = result.rows.reduce((s, r) => s + Number(r.budgeted_amount), 0);
      const totalActual = result.rows.reduce((s, r) => s + Number(r.actual_amount), 0);

      return {
        budgetId,
        lines: result.rows,
        totalBudgeted,
        totalActual,
        totalVariance: totalActual - totalBudgeted
      };
    } catch (error) {
      logger.error('Error getting budget vs actual', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Real cost-reduction recommendations, computed from getBudgetVsActual()'s
   * own real budget/actual data — no new data source, no fabricated advice.
   * Flags a line as a recommendation candidate when it is over budget by
   * more than OVER_BUDGET_THRESHOLD_PCT (an assumed, labeled constant — no
   * such threshold is stored anywhere in the schema), ranked by absolute
   * overrun amount so the largest real cost problem surfaces first.
   */
  async getCostReductionRecommendations(budgetId) {
    const OVER_BUDGET_THRESHOLD_PCT = 15; // ASSUMED — not stored in schema
    try {
      const { lines, totalBudgeted, totalActual, totalVariance } = await this.getBudgetVsActual(budgetId);

      const recommendations = lines
        .filter((l) => l.variance_pct !== null && Number(l.variance_pct) > OVER_BUDGET_THRESHOLD_PCT)
        .map((l) => ({
          budget_line_id: l.budget_line_id,
          account_code: l.account_code,
          account_name: l.account_name,
          cost_center_code: l.cost_center_code,
          budgeted_amount: Number(l.budgeted_amount),
          actual_amount: Number(l.actual_amount),
          overrun_amount: Number(l.variance),
          overrun_pct: Number(l.variance_pct),
          recommendation: `${l.account_name}${l.cost_center_code ? ` (${l.cost_center_code})` : ''} is ${Number(l.variance_pct).toFixed(1)}% over budget — review this line for real cost-reduction opportunities.`,
        }))
        .sort((a, b) => b.overrun_amount - a.overrun_amount);

      return {
        budgetId,
        threshold_pct_assumed: OVER_BUDGET_THRESHOLD_PCT,
        totalBudgeted,
        totalActual,
        totalVariance,
        recommendations,
        note: recommendations.length === 0
          ? 'No budget lines currently exceed the over-budget threshold — nothing to recommend.'
          : undefined,
      };
    } catch (error) {
      logger.error('Error getting cost reduction recommendations', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new CostControlService();

