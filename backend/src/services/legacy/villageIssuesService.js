'use strict';

/**
 * Village Issues Service
 *
 * Operational layer for village-reported issues, unmet needs and service
 * delivery problems. village_profiles remains the single authoritative
 * village master; this service owns issue lifecycle and history only.
 */

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');

const CATEGORIES = [
  'infrastructure', 'water', 'electricity', 'roads', 'health', 'education',
  'agriculture', 'fisheries', 'livestock', 'market', 'finance', 'livelihood',
  'warehouse', 'logistics', 'digital_connectivity', 'governance', 'environment',
  'climate', 'emergency', 'other',
];

const STATUSES = ['open', 'acknowledged', 'in_progress', 'blocked', 'resolved', 'closed', 'rejected'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const ALLOWED_TRANSITIONS = {
  open: ['open', 'acknowledged', 'in_progress', 'rejected'],
  acknowledged: ['acknowledged', 'in_progress', 'blocked', 'rejected'],
  in_progress: ['in_progress', 'blocked', 'resolved', 'rejected'],
  blocked: ['blocked', 'in_progress', 'resolved', 'rejected'],
  resolved: ['resolved', 'closed', 'in_progress'],
  closed: ['closed'],
  rejected: ['rejected'],
};

function clean(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function optionalFiniteNumber(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${field} must be a valid number`);
  return number;
}

function validateIssueInput(input = {}, partial = false) {
  if (!partial && !input.village_id) throw new Error('village_id is required');
  if (!partial && !clean(input.title)) throw new Error('title is required');
  if (input.priority && !PRIORITIES.includes(input.priority)) throw new Error('Invalid priority');
  if (input.status && !STATUSES.includes(input.status)) throw new Error('Invalid status');
  if (input.category && !CATEGORIES.includes(input.category)) throw new Error('Invalid category');

  const numeric = [
    ['affected_households', input.affected_households],
    ['affected_people', input.affected_people],
    ['estimated_cost', input.estimated_cost],
    ['latitude', input.latitude],
    ['longitude', input.longitude],
  ];
  for (const [field, value] of numeric) {
    const number = optionalFiniteNumber(value, field);
    if (number === null) continue;
    if (['affected_households', 'affected_people', 'estimated_cost'].includes(field) && number < 0) {
      throw new Error(`${field} must be non-negative`);
    }
    if (field === 'latitude' && (number < -90 || number > 90)) throw new Error('latitude must be between -90 and 90');
    if (field === 'longitude' && (number < -180 || number > 180)) throw new Error('longitude must be between -180 and 180');
  }
}

function normalizeActor(actor = {}) {
  return {
    actor_id: actor.actor_id || actor.id || null,
    actor_role: actor.actor_role || actor.role || null,
  };
}

function issueError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertTransition(from, to) {
  if (!STATUSES.includes(to)) throw issueError('Invalid status', 400);
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw issueError(`Invalid village issue transition: ${from} -> ${to}`, 409);
  }
}

async function createIssue(input) {
  validateIssueInput(input);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const village = await client.query(
      'SELECT village_id FROM village_profiles WHERE village_id = $1 FOR SHARE',
      [input.village_id],
    );
    if (!village.rows.length) throw issueError(`Village not found: ${input.village_id}`, 404);

    const { rows } = await client.query(
      `INSERT INTO village_issues
        (village_id, category, title, description, priority, source, reported_by,
         owner_scope, location_description, latitude, longitude, affected_households,
         affected_people, estimated_cost, target_resolution_date, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        input.village_id, clean(input.category) || 'other', clean(input.title), clean(input.description) || null,
        input.priority || 'medium', clean(input.source) || 'village_user', clean(input.reported_by) || null,
        clean(input.owner_scope) || null, clean(input.location_description) || null,
        optionalFiniteNumber(input.latitude, 'latitude'), optionalFiniteNumber(input.longitude, 'longitude'),
        optionalFiniteNumber(input.affected_households, 'affected_households'),
        optionalFiniteNumber(input.affected_people, 'affected_people'),
        optionalFiniteNumber(input.estimated_cost, 'estimated_cost'), input.target_resolution_date || null,
        input.metadata || {},
      ],
    );

    await client.query(
      `INSERT INTO village_issue_updates
        (issue_id, status, note, actor_id, actor_role, attachment_refs, metadata)
       VALUES ($1,'open',$2,$3,$4,'[]'::jsonb,'{}'::jsonb)`,
      [rows[0].issue_id, 'Issue reported', input.reported_by || null, 'reporter'],
    );

    await client.query('COMMIT');
    logger.info(`Village issue created: ${rows[0].issue_id}`);
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getIssue(issueId) {
  const { rows } = await pool.query(
    `SELECT vi.*, vp.village_name, vp.name AS village_master_name, vp.district, vp.block, vp.state
       FROM village_issues vi
       JOIN village_profiles vp ON vp.village_id = vi.village_id
      WHERE vi.issue_id = $1`,
    [issueId],
  );
  if (!rows.length) throw issueError(`Village issue not found: ${issueId}`, 404);
  return rows[0];
}

async function getIssueUpdates(issueId) {
  await getIssue(issueId);
  const { rows } = await pool.query(
    `SELECT * FROM village_issue_updates
      WHERE issue_id = $1
      ORDER BY created_at ASC, update_id ASC`,
    [issueId],
  );
  return rows;
}

async function listIssues(filters = {}) {
  const params = [];
  const where = [];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replace('?', `$${params.length}`));
  };

  if (filters.village_id) add('vi.village_id = ?', filters.village_id);
  if (filters.category) add('vi.category = ?', filters.category);
  if (filters.status) add('vi.status = ?', filters.status);
  if (filters.priority) add('vi.priority = ?', filters.priority);
  if (filters.district) add('vp.district = ?', filters.district);
  if (filters.block) add('vp.block = ?', filters.block);
  if (filters.state) add('vp.state = ?', filters.state);

  const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 500);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT vi.*, vp.village_name, vp.name AS village_master_name, vp.district, vp.block, vp.state
       FROM village_issues vi
       JOIN village_profiles vp ON vp.village_id = vi.village_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY CASE vi.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
               vi.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return rows;
}

async function updateIssue(issueId, input, actor = {}) {
  validateIssueInput(input, true);
  const normalizedActor = normalizeActor(actor);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingResult = await client.query(
      'SELECT * FROM village_issues WHERE issue_id = $1 FOR UPDATE',
      [issueId],
    );
    if (!existingResult.rows.length) throw issueError(`Village issue not found: ${issueId}`, 404);
    const existing = existingResult.rows[0];

    if (input.status) assertTransition(existing.status, input.status);

    const fields = [
      'category', 'title', 'description', 'priority', 'status', 'assigned_to', 'owner_scope',
      'location_description', 'latitude', 'longitude', 'affected_households', 'affected_people',
      'estimated_cost', 'target_resolution_date', 'metadata',
    ];
    const sets = [];
    const params = [];
    for (const field of fields) {
      if (input[field] === undefined) continue;
      let value = input[field];
      if (['title', 'description', 'assigned_to', 'owner_scope', 'location_description'].includes(field)) {
        value = clean(value) || null;
      }
      if (['latitude', 'longitude', 'affected_households', 'affected_people', 'estimated_cost'].includes(field)) {
        value = optionalFiniteNumber(value, field);
      }
      params.push(value);
      sets.push(`${field} = $${params.length}`);
    }

    if (!sets.length) {
      await client.query('COMMIT');
      return existing;
    }

    if (input.status === 'resolved') sets.push('resolved_at = COALESCE(resolved_at, now())');
    if (input.status === 'closed') sets.push('closed_at = COALESCE(closed_at, now())');
    if (input.status && !['resolved', 'closed'].includes(input.status)) {
      sets.push('resolved_at = NULL');
      sets.push('closed_at = NULL');
    }

    params.push(issueId);
    const { rows } = await client.query(
      `UPDATE village_issues SET ${sets.join(', ')} WHERE issue_id = $${params.length} RETURNING *`,
      params,
    );

    if (input.status || input.note) {
      await client.query(
        `INSERT INTO village_issue_updates
          (issue_id, status, note, actor_id, actor_role, attachment_refs, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          issueId, input.status || null,
          clean(input.note) || `Issue updated${input.status ? ` to ${input.status}` : ''}`,
          normalizedActor.actor_id, normalizedActor.actor_role,
          input.attachment_refs || [], input.metadata || {},
        ],
      );
    }

    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function addIssueUpdate(issueId, input = {}) {
  if (!clean(input.note)) throw issueError('Update note is required', 400);
  if (input.status && !STATUSES.includes(input.status)) throw issueError('Invalid status', 400);
  const normalizedActor = normalizeActor(input);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const issueResult = await client.query(
      'SELECT * FROM village_issues WHERE issue_id = $1 FOR UPDATE',
      [issueId],
    );
    if (!issueResult.rows.length) throw issueError(`Village issue not found: ${issueId}`, 404);
    const issue = issueResult.rows[0];

    if (input.status) assertTransition(issue.status, input.status);

    const { rows } = await client.query(
      `INSERT INTO village_issue_updates
        (issue_id, status, note, actor_id, actor_role, attachment_refs, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [issueId, input.status || null, clean(input.note), normalizedActor.actor_id, normalizedActor.actor_role,
        input.attachment_refs || [], input.metadata || {}],
    );

    if (input.status) {
      await client.query(
        `UPDATE village_issues SET status = $1,
          resolved_at = CASE WHEN $1 = 'resolved' THEN COALESCE(resolved_at, now()) ELSE NULL END,
          closed_at = CASE WHEN $1 = 'closed' THEN COALESCE(closed_at, now()) ELSE NULL END
         WHERE issue_id = $2`,
        [input.status, issueId],
      );
    }

    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getVillageIssueSummary(villageId) {
  const village = await pool.query('SELECT village_id FROM village_profiles WHERE village_id = $1', [villageId]);
  if (!village.rows.length) throw issueError(`Village not found: ${villageId}`, 404);

  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status NOT IN ('resolved','closed','rejected'))::int AS open,
       COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('resolved','closed','rejected'))::int AS critical,
       COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
       COUNT(*) FILTER (WHERE status = 'blocked')::int AS blocked,
       COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
       COUNT(*) FILTER (WHERE status = 'closed')::int AS closed,
       COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
       COUNT(*) FILTER (WHERE target_resolution_date < CURRENT_DATE
                         AND status NOT IN ('resolved','closed','rejected'))::int AS overdue
     FROM village_issues WHERE village_id = $1`,
    [villageId],
  );
  return { village_id: Number(villageId), ...rows[0] };
}

module.exports = {
  CATEGORIES,
  STATUSES,
  PRIORITIES,
  createIssue,
  getIssue,
  getIssueUpdates,
  listIssues,
  updateIssue,
  addIssueUpdate,
  getVillageIssueSummary,
};
