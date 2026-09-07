/**
 * Project Systems Service — AF-PS (SAP equivalent: PS).
 *
 * WHY THIS EXISTS
 * docs/registry/12_ERP_COVERAGE.md and AFRERA_CLAUDE_BUILD_DIRECTIVE.md §8.6
 * name AF-PS as one of three ERP domains with zero modules and zero
 * endpoints. Unlike AF-AA and AF-CO, this domain had no schema anywhere in
 * this codebase — see database/migrations/9996_project_systems_schema.sql
 * (read its header first) for what was built and why it is numbered 9996,
 * not in the 060s sequence a naive read of the directive would suggest.
 *
 * SCOPE, HONESTLY STATED
 * Three tables: `projects`, `project_wbs` (self-referencing hierarchy) and
 * `project_milestones`. That is what a rural-economy ERP genuinely needs to
 * track an infrastructure build (packhouse construction, cold-storage
 * installation, FPO facility setup) — not a general contractor's PS module.
 * There is no resource/capacity planning, no network scheduling, no
 * change-order workflow here, because this schema carries no data to
 * support any of that honestly.
 *
 * ACTUALS, NOT ASSERTIONS (same discipline as costControlService.js)
 * Neither `projects` nor `project_wbs` has an actual-cost column. A
 * project's or WBS element's actual cost is always computed live from
 * posted `journal_lines` tagged with `project_id`/`wbs_id`, signed by the
 * account's own `normal_balance` — the identical sign convention
 * costControlService.js documents and uses. A WBS parent's actual cost is
 * its own direct postings PLUS the (recursively computed) actual cost of
 * its children — computed in JS after one flat fetch, not a recursive SQL
 * CTE, so the rollup logic is a pure, independently testable function
 * (`buildWbsRollup`) rather than buried in a query string.
 */

'use strict';

const { logger } = require('../utils/logger');

const PROJECT_TYPES = ['infrastructure', 'equipment', 'capacity_building', 'other'];
const PROJECT_STATUSES = ['planned', 'active', 'on_hold', 'completed', 'cancelled'];
const WBS_STATUSES = ['planned', 'active', 'on_hold', 'completed', 'cancelled'];
const MILESTONE_STATUSES = ['pending', 'completed', 'missed', 'cancelled'];

/** Round to 4 decimal places — matches the NUMERIC(20,4) columns. */
const r4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;

class ProjectSystemsService {
  constructor() {
    // Shared pool — see backend/src/database/pool.js for why this is a proxy
    // and not `new Pool()` per service.
    this.pool = require('../database/pool');
  }

  // -------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------

  async createProject(data) {
    try {
      const {
        companyId, projectCode, projectName, reuId,
        projectType = 'infrastructure',
        plannedStartDate, plannedEndDate,
        budgetAmount = 0, currency = 'INR', description
      } = data || {};

      if (!companyId) throw new Error('companyId is required');
      if (!projectCode) throw new Error('projectCode is required');
      if (!projectName) throw new Error('projectName is required');
      if (!PROJECT_TYPES.includes(projectType)) {
        throw new Error(`Unknown projectType "${projectType}". Expected one of ${PROJECT_TYPES.join(', ')}`);
      }
      if (!(Number(budgetAmount) >= 0)) throw new Error('budgetAmount must be >= 0');
      if (plannedStartDate && plannedEndDate && plannedEndDate < plannedStartDate) {
        throw new Error('plannedEndDate cannot be before plannedStartDate');
      }

      const result = await this.pool.query(
        `INSERT INTO projects
           (company_id, project_code, project_name, reu_id, project_type,
            planned_start_date, planned_end_date, budget_amount, currency, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          companyId, projectCode, projectName, reuId || null, projectType,
          plannedStartDate || null, plannedEndDate || null, budgetAmount, currency, description || null
        ]
      );

      logger.info(`Project created: ${result.rows[0].id} (${projectCode})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating project', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getProjects(companyId, filters = {}) {
    try {
      if (!companyId) throw new Error('companyId is required');

      let query = 'SELECT * FROM projects WHERE company_id = $1';
      const params = [companyId];
      let paramCount = 1;

      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }
      if (filters.projectType) {
        paramCount++;
        query += ` AND project_type = $${paramCount}`;
        params.push(filters.projectType);
      }
      if (filters.reuId) {
        paramCount++;
        query += ` AND reu_id = $${paramCount}`;
        params.push(filters.reuId);
      }

      query += ' ORDER BY project_code ASC';

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting projects', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getProject(projectId) {
    try {
      const result = await this.pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
      if (result.rows.length === 0) throw new Error('Project not found');
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting project', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Status transitions only (planned -> active -> completed, or -> on_hold /
   * cancelled). Actual start/end dates are set here rather than inferred, so
   * a project can be marked active without yet claiming an actual_start_date
   * unless the caller supplies one.
   */
  async updateProjectStatus(projectId, status, dates = {}) {
    try {
      if (!PROJECT_STATUSES.includes(status)) {
        throw new Error(`Unknown status "${status}". Expected one of ${PROJECT_STATUSES.join(', ')}`);
      }
      const { actualStartDate, actualEndDate } = dates;

      const result = await this.pool.query(
        `UPDATE projects
         SET status = $1,
             actual_start_date = COALESCE($2, actual_start_date),
             actual_end_date = COALESCE($3, actual_end_date),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [status, actualStartDate || null, actualEndDate || null, projectId]
      );
      if (result.rows.length === 0) throw new Error('Project not found');

      logger.info(`Project ${projectId} status -> ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating project status', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Work Breakdown Structure
  // -------------------------------------------------------------------

  async createWbsElement(projectId, data) {
    try {
      await this.getProject(projectId);

      const {
        parentId, wbsCode, wbsName, sequenceNumber = 0,
        plannedStartDate, plannedEndDate, plannedCost = 0
      } = data || {};

      if (!wbsCode) throw new Error('wbsCode is required');
      if (!wbsName) throw new Error('wbsName is required');
      if (!(Number(plannedCost) >= 0)) throw new Error('plannedCost must be >= 0');
      if (plannedStartDate && plannedEndDate && plannedEndDate < plannedStartDate) {
        throw new Error('plannedEndDate cannot be before plannedStartDate');
      }

      if (parentId) {
        const parent = await this.getWbsElement(parentId);
        if (String(parent.project_id) !== String(projectId)) {
          throw new Error(`Parent WBS element ${parentId} belongs to a different project`);
        }
      }

      const result = await this.pool.query(
        `INSERT INTO project_wbs
           (project_id, parent_id, wbs_code, wbs_name, sequence_number,
            planned_start_date, planned_end_date, planned_cost)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          projectId, parentId || null, wbsCode, wbsName, sequenceNumber,
          plannedStartDate || null, plannedEndDate || null, plannedCost
        ]
      );

      logger.info(`WBS element created: ${result.rows[0].id} (${wbsCode}) for project ${projectId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating WBS element', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getProjectWbs(projectId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM project_wbs WHERE project_id = $1 ORDER BY sequence_number ASC, id ASC',
        [projectId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting project WBS', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getWbsElement(wbsId) {
    try {
      const result = await this.pool.query('SELECT * FROM project_wbs WHERE id = $1', [wbsId]);
      if (result.rows.length === 0) throw new Error('WBS element not found');
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting WBS element', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async updateWbsStatus(wbsId, status, dates = {}) {
    try {
      if (!WBS_STATUSES.includes(status)) {
        throw new Error(`Unknown status "${status}". Expected one of ${WBS_STATUSES.join(', ')}`);
      }
      const { actualStartDate, actualEndDate } = dates;

      const result = await this.pool.query(
        `UPDATE project_wbs
         SET status = $1,
             actual_start_date = COALESCE($2, actual_start_date),
             actual_end_date = COALESCE($3, actual_end_date)
         WHERE id = $4
         RETURNING *`,
        [status, actualStartDate || null, actualEndDate || null, wbsId]
      );
      if (result.rows.length === 0) throw new Error('WBS element not found');

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating WBS status', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Pure hierarchy + rollup builder — no I/O, so it can be (and is)
   * unit-tested directly with synthetic rows.
   *
   * `wbsRows`: flat array of project_wbs rows (id, parent_id, planned_cost, ...).
   * `actualsByWbsId`: Map or plain object of wbs_id -> signed ledger actual
   * for postings made DIRECTLY to that element (not yet rolled up).
   *
   * Returns an array of root nodes, each annotated with:
   *   ownActual      - direct postings to this element only
   *   rollupActual    - ownActual + sum(children rollupActual), recursively
   *   rollupPlanned   - own planned_cost + sum(children rollupPlanned)
   *   variance        - rollupActual - rollupPlanned
   *   children        - nested child nodes, same shape
   *
   * Guards against cycles (a WBS graph corrupted by direct DB edits into
   * A -> B -> A) by refusing to revisit a node id already on the current
   * path, rather than recursing forever.
   */
  buildWbsRollup(wbsRows, actualsByWbsId) {
    const actuals = actualsByWbsId instanceof Map
      ? actualsByWbsId
      : new Map(Object.entries(actualsByWbsId || {}));

    const byId = new Map();
    for (const row of wbsRows) {
      byId.set(row.id, {
        ...row,
        children: [],
        ownActual: r4(Number(actuals.get(row.id) ?? actuals.get(String(row.id)) ?? 0))
      });
    }

    const roots = [];
    for (const node of byId.values()) {
      if (node.parent_id != null && byId.has(node.parent_id)) {
        byId.get(node.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    }

    const compute = (node, path) => {
      if (path.has(node.id)) {
        throw new Error(`Cycle detected in project_wbs hierarchy at element ${node.id}`);
      }
      path.add(node.id);

      let rollupActual = node.ownActual;
      let rollupPlanned = r4(Number(node.planned_cost) || 0);
      for (const child of node.children) {
        const computed = compute(child, path);
        rollupActual = r4(rollupActual + computed.rollupActual);
        rollupPlanned = r4(rollupPlanned + computed.rollupPlanned);
      }
      path.delete(node.id);

      node.rollupActual = rollupActual;
      node.rollupPlanned = rollupPlanned;
      node.variance = r4(rollupActual - rollupPlanned);
      return node;
    };

    return roots.map((root) => compute(root, new Set()));
  }

  /**
   * Fetches the project's WBS tree and its direct ledger actuals, then
   * applies `buildWbsRollup`. This is the DB-backed counterpart to the pure
   * function above.
   */
  async getWbsCostRollup(projectId) {
    try {
      await this.getProject(projectId);

      const wbsRows = await this.getProjectWbs(projectId);

      const actualsResult = await this.pool.query(
        `SELECT jl.wbs_id,
                SUM(CASE WHEN coa.normal_balance = 'DR' THEN jl.debit - jl.credit ELSE jl.credit - jl.debit END) AS amount
         FROM journal_lines jl
         JOIN journal_entries je ON je.id = jl.journal_entry_id
         JOIN chart_of_accounts coa ON coa.id = jl.account_id
         WHERE jl.project_id = $1 AND je.status = 'posted' AND jl.wbs_id IS NOT NULL
         GROUP BY jl.wbs_id`,
        [projectId]
      );
      const actualsByWbsId = new Map(actualsResult.rows.map((r) => [r.wbs_id, r.amount]));

      return this.buildWbsRollup(wbsRows, actualsByWbsId);
    } catch (error) {
      logger.error('Error computing WBS cost rollup', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Milestones
  // -------------------------------------------------------------------

  async createMilestone(projectId, data) {
    try {
      await this.getProject(projectId);

      const { wbsId, milestoneName, targetDate, notes } = data || {};
      if (!milestoneName) throw new Error('milestoneName is required');
      if (!targetDate) throw new Error('targetDate is required');

      if (wbsId) {
        const wbs = await this.getWbsElement(wbsId);
        if (String(wbs.project_id) !== String(projectId)) {
          throw new Error(`WBS element ${wbsId} belongs to a different project`);
        }
      }

      const result = await this.pool.query(
        `INSERT INTO project_milestones (project_id, wbs_id, milestone_name, target_date, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [projectId, wbsId || null, milestoneName, targetDate, notes || null]
      );

      logger.info(`Milestone created: ${result.rows[0].id} (${milestoneName}) for project ${projectId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating milestone', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getProjectMilestones(projectId, filters = {}) {
    try {
      let query = 'SELECT * FROM project_milestones WHERE project_id = $1';
      const params = [projectId];

      if (filters.status) {
        if (!MILESTONE_STATUSES.includes(filters.status)) {
          throw new Error(`Unknown status "${filters.status}". Expected one of ${MILESTONE_STATUSES.join(', ')}`);
        }
        query += ' AND status = $2';
        params.push(filters.status);
      }

      query += ' ORDER BY target_date ASC';

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting project milestones', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async completeMilestone(milestoneId, actualCompletionDate) {
    try {
      if (!actualCompletionDate) throw new Error('actualCompletionDate is required');

      const result = await this.pool.query(
        `UPDATE project_milestones
         SET status = 'completed', actual_completion_date = $1
         WHERE id = $2 AND status NOT IN ('completed', 'cancelled')
         RETURNING *`,
        [actualCompletionDate, milestoneId]
      );
      if (result.rows.length === 0) {
        throw new Error(`Milestone ${milestoneId} not found, or already completed/cancelled`);
      }

      logger.info(`Milestone ${milestoneId} completed on ${actualCompletionDate}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error completing milestone', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Pure classifier — no I/O. A milestone is:
   *   completed  - status is 'completed' (or an actual_completion_date is set)
   *   cancelled  - status is 'cancelled'
   *   overdue    - target_date is before asOfDate and it is neither of the above
   *   upcoming   - everything else
   */
  classifyMilestone(milestone, asOfDate) {
    if (milestone.status === 'cancelled') return 'cancelled';
    if (milestone.status === 'completed' || milestone.actual_completion_date) return 'completed';

    const asOf = new Date(`${String(asOfDate).slice(0, 10)}T00:00:00Z`).getTime();
    const target = new Date(`${String(milestone.target_date).slice(0, 10)}T00:00:00Z`).getTime();
    return target < asOf ? 'overdue' : 'upcoming';
  }

  /** Upcoming/overdue/completed/cancelled buckets for a project, as of `asOfDate` (defaults to today, UTC). */
  async getMilestoneStatusSummary(projectId, asOfDate) {
    try {
      const effectiveAsOf = asOfDate || new Date().toISOString().slice(0, 10);
      const milestones = await this.getProjectMilestones(projectId);

      const buckets = { upcoming: [], overdue: [], completed: [], cancelled: [] };
      for (const milestone of milestones) {
        buckets[this.classifyMilestone(milestone, effectiveAsOf)].push(milestone);
      }

      return {
        projectId,
        asOfDate: effectiveAsOf,
        counts: {
          upcoming: buckets.upcoming.length,
          overdue: buckets.overdue.length,
          completed: buckets.completed.length,
          cancelled: buckets.cancelled.length
        },
        buckets
      };
    } catch (error) {
      logger.error('Error getting milestone status summary', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Budget vs. Actual (project level)
  // -------------------------------------------------------------------

  /**
   * Project-level budget vs. actual, computed live from posted
   * `journal_lines` tagged with this project_id — WBS-tagged or not. Never
   * stored, same discipline as costControlService.getBudgetVsActual.
   */
  async getProjectBudgetVsActual(projectId) {
    try {
      const project = await this.getProject(projectId);

      const result = await this.pool.query(
        `SELECT SUM(CASE WHEN coa.normal_balance = 'DR' THEN jl.debit - jl.credit ELSE jl.credit - jl.debit END) AS amount
         FROM journal_lines jl
         JOIN journal_entries je ON je.id = jl.journal_entry_id
         JOIN chart_of_accounts coa ON coa.id = jl.account_id
         WHERE jl.project_id = $1 AND je.status = 'posted'`,
        [projectId]
      );

      const actualAmount = r4(Number(result.rows[0]?.amount || 0));
      const budgetAmount = r4(Number(project.budget_amount));
      const variance = r4(actualAmount - budgetAmount);
      const variancePct = budgetAmount === 0 ? null : Math.round((variance / budgetAmount) * 10000) / 100;

      return { projectId, budgetAmount, actualAmount, variance, variancePct };
    } catch (error) {
      logger.error('Error getting project budget vs actual', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new ProjectSystemsService();
