'use strict';

/**
 * Village Issues Service
 *
 * Operational layer for village-reported issues, unmet needs and service
 * delivery problems. The existing village_profiles table remains the
 * authoritative village master; this service adds issue lifecycle data.
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

function clean(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function validateIssueInput(input, partial = false) {
  if (!partial && !input.village_id) throw new Error('village_id is required');
  if (!partial && !clean(input.title)) throw new Error('title is required');
  if (input.priority && !PRIORITIES.includes(input.priority)) throw new Error('Invalid priority');
  if (input.status && !STATUSES.includes(input.status)) throw new Error('Invalid status');
  if (input.category && !CATEGORIES.includes(input.category)) throw new Error('Invalid category');
  if (input.affected_households != null && Number(input.affected_households) < 0) throw new Error('affected_households must be non-negative');
  if (input.affected_people != null && Number(input.affected_people) < 0) throw new Error('affected_people must be non-negative');
  if (input.estimated_cost != null && Number(input.estimated_cost) < 0) throw new Error('estimated_cost must be non-negative');
}

async function createIssue(input) {
  validateIssueInput(input);
  const village = await pool.query('SELECT village_id FROM village_profiles WHERE village_id = $1', [input.village_id]);
  if (!village.rows.length) throw new Error(`Village not found: ${input.village_id}`);

  const { rows } = await pool.query(
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
      input.latitude ?? null, input.longitude ?? null, input.affected_households ?? null,
      input.affected_people ?? null, input.estimated_cost ?? null, input.target_resolution_date || null,
      input.metadata || {},
    ],
  );

  await addIssueUpdate(rows[0].issue_id, {
    note: 'Issue reported', actor_id: input.reported_by, actor_role: 'reporter', status: 'open',
  });
  logger.info(`Village issue created: ${rows[0].issue_id}`);
  return rows[0];
}

async function getIssue(issueId) {
  const { rows } = await pool.query(
    `SELECT vi.*, vp.village_name, vp.district, vp.block, vp.state
       FROM village_issues vi
       JOIN village_profiles vp ON vp.village_id = vi.village_id
      WHERE vi.issue_id = $1`, [issueId],
  );
  if (!rows.length) throw new Error(`Village issue not found: ${issueId}`);
  return rows[0];
}

async function listIssues(filters = {}) {
  const params = [];
  const where = [];
  const add = (sql, value) => { params.push(value); where.push(sql.replace('?', `$${params.length}`)); };

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
    `SELECT vi.*, vp.village_name, vp.district, vp.block, vp.state
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
  const existing = await getIssue(issueId);
  const fields = ['category','title','description','priority','status','assigned_to','owner_scope',
    'location_description','latitude','longitude','affected_households','affected_people',
    'estimated_cost','target_resolution_date','metadata'];
  const sets = [];
  const params = [];
  for (const field of fields) {
    if (input[field] !== undefined) {
      params.push(field === 'title' || field === 'description' || field === 'owner_scope' || field === 'location_description'
        ? clean(input[field]) : input[field]);
      sets.push(`${field} = $${params.length}`);
    }
  }
  if (!sets.length) return existing;
  if (input.status === 'resolved') sets.push('resolved_at = COALESCE(resolved_at, now())');
  if (input.status === 'closed') sets.push('closed_at = COALESCE(closed_at, now())');
  params.push(issueId);
  const { rows } = await pool.query(
    `UPDATE village_issues SET ${sets.join(', ')} WHERE issue_id = $${params.length} RETURNING *`, params,
  );
  if (input.status || input.note) {
    await addIssueUpdate(issueId, { note: input.note || `Issue updated to ${input.status || 'updated'}`,
      status: input.status, actor_id: actor.actor_id, actor_role: actor.actor_role });
  }
  return rows[0];
}

async function addIssueUpdate(issueId, input) {
  await getIssue(issueId);
  if (!clean(input.note)) throw new Error('Update note is required');
  if (input.status && !STATUSES.includes(input.status)) throw new Error('Invalid status');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO village_issue_updates
        (issue_id, status, note, actor_id, actor_role, attachment_refs, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [issueId, input.status || null, clean(input.note), input.actor_id || null,
        input.actor_role || null, input.attachment_refs || [], input.metadata || {}],
    );
    if (input.status) {
      await client.query(
        `UPDATE village_issues SET status = $1,
          resolved_at = CASE WHEN $1 = 'resolved' THEN COALESCE(resolved_at, now()) ELSE resolved_at END,
          closed_at = CASE WHEN $1 = 'closed' THEN COALESCE(closed_at, now()) ELSE closed_at END
         WHERE issue_id = $2`, [input.status, issueId],
      );
    }
    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

async function getVillageIssueSummary(villageId) {
  await getVillageExists(villageId);
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status NOT IN ('resolved','closed','rejected'))::int AS open,
       COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('resolved','closed','rejected'))::int AS critical,
       COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
       COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
       COUNT(*) FILTER (WHERE status = 'closed')::int AS closed
     FROM village_issues WHERE village_id = $1`, [villageId],
  );
  return { village_id: Number(villageId), ...rows[0] };
}

async function getVillageExists(villageId) {
  const { rows } = await pool.query('SELECT village_id FROM village_profiles WHERE village_id = $1', [villageId]);
  if (!rows.length) throw new Error(`Village not found: ${villageId}`);
}

function setupRoutes(app) {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../../middleware/auth');
  router.use(authMiddleware);

  router.get('/', async (req, res) => {
    try { res.json({ success: true, data: await listIssues(req.query) }); }
    catch (e) { logger.error(e); res.status(500).json({ success: false, error: e.message }); }
  });
  router.get('/summary/:villageId', async (req, res) => {
    try { res.json({ success: true, data: await getVillageIssueSummary(req.params.villageId) }); }
    catch (e) { res.status(404).json({ success: false, error: e.message }); }
  });
  router.get('/:issueId', async (req, res) => {
    try { res.json({ success: true, data: await getIssue(req.params.issueId) }); }
    catch (e) { res.status(404).json({ success: false, error: e.message }); }
  });
  router.post('/', async (req, res) => {
    try { res.status(201).json({ success: true, data: await createIssue(req.body) }); }
    catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });
  router.patch('/:issueId', async (req, res) => {
    try { res.json({ success: true, data: await updateIssue(req.params.issueId, req.body, req.user || {}) }); }
    catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });
  router.post('/:issueId/updates', async (req, res) => {
    try { res.status(201).json({ success: true, data: await addIssueUpdate(req.params.issueId, { ...req.body, actor_id: req.user?.id || req.body.actor_id, actor_role: req.user?.role || req.body.actor_role }) }); }
    catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });
  app.use('/api/v1/village-issues', router);
  logger.info('Village issue routes mounted at /api/v1/village-issues');
}

module.exports = { CATEGORIES, STATUSES, PRIORITIES, createIssue, getIssue, listIssues, updateIssue, addIssueUpdate, getVillageIssueSummary, setupRoutes };
