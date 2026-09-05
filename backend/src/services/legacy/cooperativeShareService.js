/**
 * Cooperative Share Service — FPO member share capital + patronage-based
 * profit distribution.
 *
 * Backs migration 3106_fpo_member_shares_schema.sql (already real, built
 * this session, but had zero consuming service until now).
 *
 * REAL BUSINESS RULE: PATRONAGE DIVIDEND
 * India's cooperative-law convention (documented in the migration header):
 * a surplus is distributed proportional to a member's ACTUAL transaction
 * volume with the FPO during the period, not proportional to shares held —
 * a legally distinct concept from a corporate dividend. Volume is the real
 * SUM of that farmer's fpo_ledger_entries credit amounts in the period
 * (migration 9995) — never invented; a farmer with zero ledger entries in
 * the period gets a zero line, not an estimated one.
 */

'use strict';

const { logger } = require('../../utils/logger');
const pool = require('../../database/pool');
const { withTransaction } = require('../../core/withTransaction');

class CooperativeShareService {
  constructor() {
    this.pool = pool;
  }

  // -------------------------------------------------------------------
  // Member share capital
  // -------------------------------------------------------------------

  async addMember(data) {
    const { fpoId, farmerId, sharesHeld, shareValueInr, joinDate } = data || {};
    if (!fpoId) throw new Error('fpoId is required');
    if (!farmerId) throw new Error('farmerId is required');
    if (!(Number(sharesHeld) >= 0)) throw new Error('sharesHeld must be >= 0');
    if (!(Number(shareValueInr) >= 0)) throw new Error('shareValueInr must be >= 0');
    try {
      const result = await this.pool.query(
        `INSERT INTO fpo_member_shares (fpo_id, farmer_id, shares_held, share_value_inr, join_date)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (fpo_id, farmer_id) DO UPDATE SET
           shares_held = EXCLUDED.shares_held,
           share_value_inr = EXCLUDED.share_value_inr,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [fpoId, farmerId, sharesHeld, shareValueInr, joinDate || new Date().toISOString().slice(0, 10)]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding cooperative member', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async listMembers(fpoId) {
    if (!fpoId) throw new Error('fpoId is required');
    let result = await this.pool.query(
      `SELECT fms.*, u.name AS farmer_name
         FROM fpo_member_shares fms
         LEFT JOIN farmers f ON f.id = fms.farmer_id
         LEFT JOIN users u ON u.id = f.user_id
        WHERE fms.fpo_id = $1
        ORDER BY fms.join_date ASC`,
      [fpoId]
    );
    return result.rows;
  }

  async getPaidUpCapital(fpoId) {
    if (!fpoId) throw new Error('fpoId is required');
    let result = await this.pool.query(
      `SELECT COALESCE(SUM(shares_held * share_value_inr), 0) AS total_paid_up_capital_inr,
              COUNT(*) FILTER (WHERE status = 'active') AS active_member_count
         FROM fpo_member_shares WHERE fpo_id = $1`,
      [fpoId]
    );
    return {
      fpoId,
      totalPaidUpCapitalInr: Number(result.rows[0].total_paid_up_capital_inr),
      activeMemberCount: Number(result.rows[0].active_member_count),
    };
  }

  // -------------------------------------------------------------------
  // Patronage-dividend distribution
  // -------------------------------------------------------------------

  /**
   * Computes (but does not persist) a patronage distribution preview — real
   * per-member split of totalSurplusInr, proportional to each active
   * member's real fpo_ledger_entries credit volume in [periodStart,
   * periodEnd]. Members with zero volume in the period get a zero line.
   */
  async computeDistribution({ fpoId, periodStart, periodEnd, totalSurplusInr }) {
    if (!fpoId) throw new Error('fpoId is required');
    if (!periodStart || !periodEnd) throw new Error('periodStart and periodEnd are required');
    if (!(Number(totalSurplusInr) >= 0)) throw new Error('totalSurplusInr must be >= 0');

    const members = await this.pool.query(
      `SELECT farmer_id FROM fpo_member_shares WHERE fpo_id = $1 AND status = 'active'`,
      [fpoId]
    );

    const volumeResult = await this.pool.query(
      `SELECT farmer_id, COALESCE(SUM(amount_inr), 0) AS volume
         FROM fpo_ledger_entries
        WHERE fpo_id = $1 AND entry_type = 'credit'
          AND entry_date BETWEEN $2 AND $3
        GROUP BY farmer_id`,
      [fpoId, periodStart, periodEnd]
    );
    const volumeByFarmer = Object.fromEntries(volumeResult.rows.map((r) => [r.farmer_id, Number(r.volume)]));

    const totalVolume = Object.values(volumeByFarmer).reduce((s, v) => s + v, 0);

    const lines = members.rows.map((m) => {
      const volume = volumeByFarmer[m.farmer_id] || 0;
      const sharePct = totalVolume > 0 ? (volume / totalVolume) * 100 : 0;
      const dividend = totalVolume > 0 ? (volume / totalVolume) * Number(totalSurplusInr) : 0;
      return {
        farmerId: m.farmer_id,
        patronageVolumeInr: Number(volume.toFixed(2)),
        patronageSharePct: Number(sharePct.toFixed(4)),
        dividendAmountInr: Number(dividend.toFixed(2)),
      };
    });

    return {
      fpoId,
      periodStart,
      periodEnd,
      totalSurplusInr: Number(totalSurplusInr),
      totalPatronageVolumeInr: Number(totalVolume.toFixed(2)),
      memberCount: members.rows.length,
      membersWithZeroVolume: lines.filter((l) => l.patronageVolumeInr === 0).length,
      lines,
    };
  }

  /** Persists a computeDistribution() result as an approved distribution run. */
  async createDistribution({ fpoId, periodStart, periodEnd, totalSurplusInr, computedBy, notes }) {
    const preview = await this.computeDistribution({ fpoId, periodStart, periodEnd, totalSurplusInr });

    return withTransaction(async (client) => {
      const distResult = await client.query(
        `INSERT INTO fpo_profit_distributions
           (fpo_id, period_start, period_end, total_surplus_inr, distribution_method, computed_by, notes)
         VALUES ($1, $2, $3, $4, 'patronage', $5, $6)
         RETURNING *`,
        [fpoId, periodStart, periodEnd, totalSurplusInr, computedBy || null, notes || null]
      );
      const distribution = distResult.rows[0];

      for (const line of preview.lines) {
        await client.query(
          `INSERT INTO fpo_profit_distribution_lines
             (distribution_id, farmer_id, patronage_volume_inr, patronage_share_pct, dividend_amount_inr)
           VALUES ($1, $2, $3, $4, $5)`,
          [distribution.id, line.farmerId, line.patronageVolumeInr, line.patronageSharePct, line.dividendAmountInr]
        );
      }

      logger.info(`Cooperative patronage distribution created: ${distribution.id}`, { fpoId, memberCount: preview.memberCount });
      return { ...distribution, lines: preview.lines };
    });
  }

  async getDistribution(distributionId) {
    let distResult = await this.pool.query(
      `SELECT * FROM fpo_profit_distributions WHERE id = $1`,
      [distributionId]
    );
    if (distResult.rows.length === 0) throw new Error('Distribution not found');

    const linesResult = await this.pool.query(
      `SELECT dl.*, u.name AS farmer_name
         FROM fpo_profit_distribution_lines dl
         LEFT JOIN farmers f ON f.id = dl.farmer_id
         LEFT JOIN users u ON u.id = f.user_id
        WHERE dl.distribution_id = $1
        ORDER BY dl.dividend_amount_inr DESC`,
      [distributionId]
    );

    return { ...distResult.rows[0], lines: linesResult.rows };
  }

  async listDistributions(fpoId) {
    if (!fpoId) throw new Error('fpoId is required');
    let result = await this.pool.query(
      `SELECT * FROM fpo_profit_distributions WHERE fpo_id = $1 ORDER BY period_end DESC`,
      [fpoId]
    );
    return result.rows;
  }
}

module.exports = new CooperativeShareService();
