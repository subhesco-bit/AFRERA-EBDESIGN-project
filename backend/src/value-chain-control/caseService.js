/** Value-chain case registry — orchestration envelope. */

'use strict';

const crypto = require('crypto');
const pool = require('../database/pool');

function genCode() {
  return `VC-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function createCase({
  templateId = 'VC-TPL-SPICE-PROCESSING',
  title,
  commodity,
  variety,
  state,
  district,
  season,
  fpoId,
  metadata,
}) {
  if (!title || !commodity) throw new Error('title and commodity are required');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tpl = await client.query(`SELECT * FROM vc_templates WHERE id = $1`, [templateId]);
    if (!tpl.rows[0]) throw new Error(`Unknown template ${templateId}`);

    const code = genCode();
    const { rows } = await client.query(
      `INSERT INTO vc_cases
         (case_code, template_id, title, commodity, variety, state, district, season, fpo_id, metadata, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft') RETURNING *`,
      [
        code, templateId, title, commodity, variety || null, state || null, district || null,
        season || null, fpoId || null, metadata ? JSON.stringify(metadata) : '{}',
      ],
    );
    const vcCase = rows[0];

    const nodes = tpl.rows[0].node_types || [];
    const nodeList = typeof nodes === 'string' ? JSON.parse(nodes) : nodes;
    let order = 0;
    for (const nodeType of nodeList) {
      await client.query(
        `INSERT INTO vc_case_nodes (case_id, node_type, sort_order, status)
         VALUES ($1,$2,$3,'pending')`,
        [vcCase.id, nodeType, order++],
      );
    }

    const gates = tpl.rows[0].default_gates || [];
    const gateList = typeof gates === 'string' ? JSON.parse(gates) : gates;
    for (const g of gateList) {
      await client.query(
        `INSERT INTO vc_gates (case_id, gate_code, label, status, requirements)
         VALUES ($1,$2,$3,'open','[]')`,
        [vcCase.id, g.code, g.label],
      );
    }

    await client.query('COMMIT');
    return vcCase;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function getCase(idOrCode) {
  const { rows } = await pool.query(
    `SELECT * FROM vc_cases WHERE id::text = $1 OR case_code = $1`,
    [String(idOrCode)],
  );
  return rows[0] || null;
}

async function listCases({ status, limit = 50 } = {}) {
  const params = [];
  let q = 'SELECT * FROM vc_cases WHERE 1=1';
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  params.push(Math.min(Number(limit) || 50, 200));
  q += ` ORDER BY created_at DESC LIMIT $${params.length}`;
  const { rows } = await pool.query(q, params);
  return rows;
}

async function listNodes(caseId) {
  const { rows } = await pool.query(
    `SELECT * FROM vc_case_nodes WHERE case_id = $1 ORDER BY sort_order`,
    [caseId],
  );
  return rows;
}

async function linkExternal(caseId, { linkType, externalId, externalSystem, metadata }) {
  if (!linkType || !externalId || !externalSystem) {
    throw new Error('linkType, externalId, externalSystem required');
  }
  const { rows } = await pool.query(
    `INSERT INTO vc_case_links (case_id, link_type, external_id, external_system, metadata)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [caseId, linkType, externalId, externalSystem, metadata ? JSON.stringify(metadata) : '{}'],
  );
  return rows[0];
}

async function listLinks(caseId) {
  const { rows } = await pool.query(
    `SELECT * FROM vc_case_links WHERE case_id = $1 ORDER BY created_at`,
    [caseId],
  );
  return rows;
}

async function createSnapshot(caseId, gateCode, payload) {
  const { rows } = await pool.query(
    `INSERT INTO vc_snapshots (case_id, gate_code, payload) VALUES ($1,$2,$3) RETURNING *`,
    [caseId, gateCode || null, JSON.stringify(payload)],
  );
  return rows[0];
}

module.exports = {
  createCase,
  getCase,
  listCases,
  listNodes,
  linkExternal,
  listLinks,
  createSnapshot,
};
