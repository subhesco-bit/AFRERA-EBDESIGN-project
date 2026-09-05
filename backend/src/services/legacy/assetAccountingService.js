/**
 * Asset Accounting Service — AF-AA (SAP equivalent: AA).
 *
 * WHY THIS EXISTS
 * docs/registry/12_ERP_COVERAGE.md and AFRERA_CLAUDE_BUILD_DIRECTIVE.md §8.6
 * name AF-AA as one of three ERP domains with zero modules and zero
 * endpoints. The schema was never the gap: migration 996_enterprise_foundation
 * already carries a full fixed-asset register (`fixed_assets`,
 * `depreciation_schedule`, generated `net_book_value`, a CHECK-enforced
 * depreciation-method vocabulary) — built as part of the accounting spine but
 * never given a service or route layer. This fills that gap for the one
 * method the schema's own math supports without invention: straight-line.
 *
 * SCOPE, HONESTLY STATED
 * `depreciation_method` also allows 'declining_balance', 'units_of_production'
 * and 'wdv'. Those need real per-method formulas (declining balance needs a
 * rate; units-of-production needs a production/usage feed that does not exist
 * anywhere in this schema yet). Rather than fabricate a formula for methods
 * this codebase has no data to support, `generateDepreciationSchedule` computes
 * only 'straight_line' and throws a clear, named error for the rest — the same
 * discipline erpAgents.js uses ("an agent that always fires is noise").
 *
 * This does not post to the general ledger (no `journal_entries` row is
 * created). That linkage belongs to whichever service owns period-close and
 * GL posting; wiring it here would guess at a posting convention this file
 * has no authority to set. `depreciation_schedule.journal_entry_id` is left
 * for that integration.
 */

'use strict';

const { logger } = require('../../utils\/logger');
const { withTransaction } = require('../../core\/withTransaction');

const SUPPORTED_METHODS = ['straight_line'];
const ALL_SCHEMA_METHODS = ['straight_line', 'declining_balance', 'units_of_production', 'wdv'];

/** Round to 4 decimal places — matches the NUMERIC(20,4) columns. */
const r4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;

/** Add `n` whole months to an ISO date string, returning an ISO date string (day fixed at 1). */
function addMonthsFirstOfMonth(isoDate, n) {
  const d = new Date(`${String(isoDate).slice(0, 10)}T00:00:00Z`);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const total = month + n;
  const targetYear = year + Math.floor(total / 12);
  const targetMonth = ((total % 12) + 12) % 12;
  return new Date(Date.UTC(targetYear, targetMonth, 1)).toISOString().slice(0, 10);
}

class AssetAccountingService {
  constructor() {
    // Shared pool — see backend/src/database/pool.js for why this is a proxy
    // and not `new Pool()` per service.
    this.pool = require('../../database\/pool');
  }

  // -------------------------------------------------------------------
  // Fixed Asset Register
  // -------------------------------------------------------------------

  async createAsset(assetData) {
    try {
      const {
        companyId, assetCode, assetName, assetClass,
        acquisitionDate, acquisitionCost, salvageValue = 0,
        usefulLifeMonths, depreciationMethod = 'straight_line',
        costCenterId, branchId
      } = assetData;

      if (!companyId) throw new Error('companyId is required');
      if (!assetCode) throw new Error('assetCode is required');
      if (!assetName) throw new Error('assetName is required');
      if (!acquisitionDate) throw new Error('acquisitionDate is required');
      if (!(Number(acquisitionCost) >= 0)) throw new Error('acquisitionCost must be >= 0');
      if (!(Number(usefulLifeMonths) > 0)) throw new Error('usefulLifeMonths must be > 0');
      if (!ALL_SCHEMA_METHODS.includes(depreciationMethod)) {
        throw new Error(`Unknown depreciationMethod "${depreciationMethod}". Expected one of ${ALL_SCHEMA_METHODS.join(', ')}`);
      }
      if (Number(salvageValue) > Number(acquisitionCost)) {
        throw new Error('salvageValue cannot exceed acquisitionCost');
      }

      const query = `
        INSERT INTO fixed_assets
          (company_id, asset_code, asset_name, asset_class, acquisition_date,
           acquisition_cost, salvage_value, useful_life_months, depreciation_method,
           cost_center_id, branch_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        companyId, assetCode, assetName, assetClass || null, acquisitionDate,
        acquisitionCost, salvageValue, usefulLifeMonths, depreciationMethod,
        costCenterId || null, branchId || null
      ]);

      logger.info(`Fixed asset created: ${result.rows[0].id} (${assetCode})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating fixed asset', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getAssets(companyId, filters = {}) {
    try {
      if (!companyId) throw new Error('companyId is required');

      let query = 'SELECT * FROM fixed_assets WHERE company_id = $1';
      const params = [companyId];
      let paramCount = 1;

      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.assetClass) {
        paramCount++;
        query += ` AND asset_class = $${paramCount}`;
        params.push(filters.assetClass);
      }

      if (filters.costCenterId) {
        paramCount++;
        query += ` AND cost_center_id = $${paramCount}`;
        params.push(filters.costCenterId);
      }

      query += ' ORDER BY asset_code ASC';

      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting fixed assets', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getAsset(assetId) {
    try {
      let result = await this.pool.query('SELECT * FROM fixed_assets WHERE id = $1', [assetId]);
      if (result.rows.length === 0) throw new Error('Fixed asset not found');
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting fixed asset', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Depreciation
  // -------------------------------------------------------------------

  /**
   * Generate the full straight-line depreciation schedule for an asset, one
   * row per month of its useful life. Refuses to run twice (idempotent by
   * error, not by silent no-op — a caller re-running this by accident should
   * see why nothing new happened) and refuses methods it cannot compute
   * honestly.
   */
  async generateDepreciationSchedule(assetId) {
    try {
      const asset = await this.getAsset(assetId);

      if (!SUPPORTED_METHODS.includes(asset.depreciation_method)) {
        throw new Error(
          `generateDepreciationSchedule does not yet compute "${asset.depreciation_method}" — ` +
          `only ${SUPPORTED_METHODS.join(', ')} is implemented. Declining-balance and ` +
          'units-of-production need a rate/usage input this schema does not yet carry.'
        );
      }

      const existing = await this.pool.query(
        'SELECT COUNT(*)::int AS n FROM depreciation_schedule WHERE fixed_asset_id = $1',
        [assetId]
      );
      if ((existing.rows[0]?.n || 0) > 0) {
        throw new Error(
          `Asset ${assetId} already has a depreciation schedule (${existing.rows[0].n} period(s)). ` +
          'Use getDepreciationSchedule to view it.'
        );
      }

      const base = r4(Number(asset.acquisition_cost) - Number(asset.salvage_value));
      const months = Number(asset.useful_life_months);
      const perPeriod = r4(base / months);

      const rows = await withTransaction(async (client) => {
        let accumulated = 0;
        const inserted = [];
        for (let n = 1; n <= months; n += 1) {
          // Last period absorbs the rounding remainder so the schedule sums
          // to exactly (acquisition_cost - salvage_value), never a cent off.
          const amount = n === months ? r4(base - r4(perPeriod * (months - 1))) : perPeriod;
          accumulated = r4(accumulated + amount);
          const periodDate = addMonthsFirstOfMonth(asset.acquisition_date, n);

          const { rows: insertedRows } = await client.query(
            `INSERT INTO depreciation_schedule
               (fixed_asset_id, period_date, depreciation_amount, accumulated_after)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (fixed_asset_id, period_date) DO NOTHING
             RETURNING *`,
            [assetId, periodDate, amount, accumulated]
          );
          if (insertedRows[0]) inserted.push(insertedRows[0]);
        }
        return inserted;
      }, { name: 'assetAccounting.generateDepreciationSchedule' });

      logger.info(`Depreciation schedule generated for asset ${assetId}: ${rows.length} period(s)`);
      return { asset, periods: rows.length, monthlyDepreciation: perPeriod, totalDepreciable: base, schedule: rows };
    } catch (error) {
      logger.error('Error generating depreciation schedule', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getDepreciationSchedule(assetId) {
    try {
      let result = await this.pool.query(
        'SELECT * FROM depreciation_schedule WHERE fixed_asset_id = $1 ORDER BY period_date ASC',
        [assetId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting depreciation schedule', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Post one due period: marks the schedule row posted and rolls
   * `fixed_assets.accumulated_depreciation` forward to match. Both writes
   * happen in one transaction — an asset whose accumulated total disagrees
   * with its own posted schedule is a books error, not a formatting one.
   */
  async postDepreciationPeriod(assetId, periodDate) {
    try {
      let result = await withTransaction(async (client) => {
        const { rows: due } = await client.query(
          `SELECT * FROM depreciation_schedule
           WHERE fixed_asset_id = $1 AND period_date = $2 AND is_posted = FALSE
           FOR UPDATE`,
          [assetId, periodDate]
        );
        if (due.length === 0) {
          throw new Error(`No unposted depreciation period ${periodDate} for asset ${assetId}`);
        }
        const period = due[0];

        const { rows: postedRows } = await client.query(
          'UPDATE depreciation_schedule SET is_posted = TRUE WHERE id = $1 RETURNING *',
          [period.id]
        );

        const { rows: assetRows } = await client.query(
          `UPDATE fixed_assets SET accumulated_depreciation = $1 WHERE id = $2 RETURNING *`,
          [period.accumulated_after, assetId]
        );
        if (assetRows.length === 0) throw new Error('Fixed asset not found during posting');

        return { period: postedRows[0], asset: assetRows[0] };
      }, { name: 'assetAccounting.postDepreciationPeriod' });

      logger.info(`Depreciation posted: asset ${assetId}, period ${periodDate}`);
      return result;
    } catch (error) {
      logger.error('Error posting depreciation period', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Batch runner: for every active asset in the company with an unposted
   * schedule row due on or before `asOfDate`, post it. Posts strictly in
   * period order per asset — an asset cannot be caught up out of sequence,
   * since a later accumulated_after depends on the ones before it.
   */
  async runDepreciationForPeriod(companyId, asOfDate) {
    try {
      if (!companyId) throw new Error('companyId is required');
      if (!asOfDate) throw new Error('asOfDate is required');

      const { rows: dueRows } = await this.pool.query(
        `SELECT ds.fixed_asset_id, ds.period_date
         FROM depreciation_schedule ds
         JOIN fixed_assets fa ON fa.id = ds.fixed_asset_id
         WHERE fa.company_id = $1 AND fa.status = 'active'
           AND ds.is_posted = FALSE AND ds.period_date <= $2
         ORDER BY ds.fixed_asset_id, ds.period_date ASC`,
        [companyId, asOfDate]
      );

      const results = [];
      const failures = [];
      for (const row of dueRows) {
        try {
          const posted = await this.postDepreciationPeriod(row.fixed_asset_id, row.period_date);
          results.push(posted);
        } catch (err) {
          // One asset's failure (e.g. a concurrent post) must not abort the
          // whole batch — the rest of the run is still valid work.
          failures.push({ fixedAssetId: row.fixed_asset_id, periodDate: row.period_date, error: err.message });
        }
      }

      const totalDepreciation = results.reduce((s, r) => s + Number(r.period.depreciation_amount), 0);
      logger.info(`Depreciation run for company ${companyId} as of ${asOfDate}: ${results.length} posted, ${failures.length} failed`);
      return { postedCount: results.length, totalDepreciation: r4(totalDepreciation), failures, posted: results };
    } catch (error) {
      logger.error('Error running depreciation batch', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Disposal
  // -------------------------------------------------------------------

  async disposeAsset(assetId, disposalData) {
    try {
      const { disposalDate, disposalAmount } = disposalData;
      if (!disposalDate) throw new Error('disposalDate is required');
      if (!(Number(disposalAmount) >= 0)) throw new Error('disposalAmount must be >= 0');

      let asset = await this.getAsset(assetId);
      if (asset.status === 'disposed') throw new Error('Asset is already disposed');

      // net_book_value is a GENERATED column (acquisition_cost -
      // accumulated_depreciation); computed here too rather than trusted
      // blindly, so this is correct even against a row fetched from
      // somewhere that does not evaluate generated columns.
      const netBookValue = asset.net_book_value !== undefined && asset.net_book_value !== null
        ? Number(asset.net_book_value)
        : r4(Number(asset.acquisition_cost) - Number(asset.accumulated_depreciation || 0));
      const gainLoss = r4(Number(disposalAmount) - netBookValue);

      let result = await this.pool.query(
        `UPDATE fixed_assets
         SET status = 'disposed', disposal_date = $1, disposal_amount = $2
         WHERE id = $3
         RETURNING *`,
        [disposalDate, disposalAmount, assetId]
      );

      logger.info(`Asset ${assetId} disposed: NBV ${netBookValue}, proceeds ${disposalAmount}, ${gainLoss >= 0 ? 'gain' : 'loss'} ${Math.abs(gainLoss)}`);
      return { asset: result.rows[0], netBookValueAtDisposal: netBookValue, gainLoss };
    } catch (error) {
      logger.error('Error disposing asset', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Reporting
  // -------------------------------------------------------------------

  async getAssetRegisterSummary(companyId) {
    try {
      if (!companyId) throw new Error('companyId is required');
      let result = await this.pool.query(
        `SELECT
           asset_class,
           status,
           COUNT(*)::int AS asset_count,
           SUM(acquisition_cost) AS total_acquisition_cost,
           SUM(accumulated_depreciation) AS total_accumulated_depreciation,
           SUM(net_book_value) AS total_net_book_value
         FROM fixed_assets
         WHERE company_id = $1
         GROUP BY asset_class, status
         ORDER BY asset_class, status`,
        [companyId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting asset register summary', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new AssetAccountingService();

// Merged from backend/src/modules/M110 - 1 name(s) collided and were aliased
{
  const m110 = require("../../modules/M110/service");
  const { getAsset: getAssetFromBE110, ...rest } = m110;
  Object.assign(module.exports, rest, { getAssetFromBE110 });
}



