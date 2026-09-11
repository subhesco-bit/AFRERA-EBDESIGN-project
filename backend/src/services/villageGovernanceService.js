'use strict';

/**
 * Village Governance Service
 *
 * Cross-cutting operational layer for:
 * - existing Panchayats
 * - Panchayat <-> authoritative village relationships
 * - Village Councils (statutory/customary/indigenous/community)
 * - Village community groups, including links to M046/M047/M048
 *
 * This service deliberately does not create or replace the village master.
 */

const pool = require('../database/pool');

function json(value, fallback = {}) {
  return value === undefined || value === null ? JSON.stringify(fallback) : JSON.stringify(value);
}

async function linkVillageToPanchayat(panchayatId, villageId, data = {}) {
  const result = await pool.query(
    `INSERT INTO panchayat_village_links
      (panchayat_id, village_id, relationship_type, is_primary, effective_from, effective_to)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (panchayat_id, village_id, relationship_type)
     DO UPDATE SET is_primary=EXCLUDED.is_primary,
                   effective_from=EXCLUDED.effective_from,
                   effective_to=EXCLUDED.effective_to
     RETURNING *`,
    [
      panchayatId,
      villageId,
      data.relationship_type || 'jurisdiction',
      Boolean(data.is_primary),
      data.effective_from || null,
      data.effective_to || null,
    ],
  );
  return result.rows[0];
}

async function listVillagePanchayats(villageId) {
  const result = await pool.query(
    `SELECT p.*, l.relationship_type, l.is_primary, l.effective_from, l.effective_to
       FROM panchayat_village_links l
       JOIN panchayats p ON p.id = l.panchayat_id
      WHERE l.village_id = $1
      ORDER BY l.is_primary DESC, p.name`,
    [villageId],
  );
  return result.rows;
}

async function createVillageCouncil(data) {
  if (!data.village_id || !data.name) throw new Error('village_id and name are required');
  const result = await pool.query(
    `INSERT INTO village_councils
      (village_id,name,council_type,recognition_status,jurisdiction,registration_number,
       contact_info,chairperson_user_id,secretary_user_id,established_date,status,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      data.village_id, data.name,
      data.council_type || 'village_council',
      data.recognition_status || 'community_recognized',
      data.jurisdiction || null,
      data.registration_number || null,
      json(data.contact_info),
      data.chairperson_user_id || null,
      data.secretary_user_id || null,
      data.established_date || null,
      data.status || 'active',
      json(data.metadata),
    ],
  );
  return result.rows[0];
}

async function listVillageCouncils(villageId, status) {
  const params = [villageId];
  let sql = `SELECT * FROM village_councils WHERE village_id = $1`;
  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }
  sql += ' ORDER BY name';
  const result = await pool.query(sql, params);
  return result.rows;
}

async function addCouncilMember(councilId, data) {
  if (!data.user_id) throw new Error('user_id is required');
  const result = await pool.query(
    `INSERT INTO village_council_members
      (council_id,user_id,role,membership_status,appointed_from,appointed_to,responsibilities)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (council_id,user_id)
     DO UPDATE SET role=EXCLUDED.role,
                   membership_status=EXCLUDED.membership_status,
                   appointed_from=EXCLUDED.appointed_from,
                   appointed_to=EXCLUDED.appointed_to,
                   responsibilities=EXCLUDED.responsibilities
     RETURNING *`,
    [
      councilId, data.user_id, data.role || 'member',
      data.membership_status || 'active',
      data.appointed_from || null, data.appointed_to || null,
      data.responsibilities || null,
    ],
  );
  return result.rows[0];
}

async function listCouncilMembers(councilId) {
  const result = await pool.query(
    `SELECT m.*, u.email
       FROM village_council_members m
       LEFT JOIN users u ON u.id = m.user_id
      WHERE m.council_id = $1
      ORDER BY m.role, m.created_at`,
    [councilId],
  );
  return result.rows;
}

async function createVillageGroup(data) {
  if (!data.village_id || !data.name || !data.group_type) {
    throw new Error('village_id, name and group_type are required');
  }
  const result = await pool.query(
    `INSERT INTO village_group_registry
      (village_id,panchayat_id,name,group_type,source_module,source_id,registration_number,
       purpose,leader_user_id,member_count,status,formed_date,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (village_id,name,group_type)
     DO UPDATE SET panchayat_id=EXCLUDED.panchayat_id,
                   source_module=EXCLUDED.source_module,
                   source_id=EXCLUDED.source_id,
                   registration_number=EXCLUDED.registration_number,
                   purpose=EXCLUDED.purpose,
                   leader_user_id=EXCLUDED.leader_user_id,
                   member_count=EXCLUDED.member_count,
                   status=EXCLUDED.status,
                   formed_date=EXCLUDED.formed_date,
                   metadata=EXCLUDED.metadata,
                   updated_at=NOW()
     RETURNING *`,
    [
      data.village_id, data.panchayat_id || null, data.name, data.group_type,
      data.source_module || null, data.source_id || null,
      data.registration_number || null, data.purpose || null,
      data.leader_user_id || null, Number.isInteger(data.member_count) ? data.member_count : 0,
      data.status || 'active', data.formed_date || null, json(data.metadata),
    ],
  );
  return result.rows[0];
}

async function listVillageGroups(villageId, groupType) {
  const params = [villageId];
  let sql = `SELECT g.*, p.name AS panchayat_name
               FROM village_group_registry g
               LEFT JOIN panchayats p ON p.id = g.panchayat_id
              WHERE g.village_id = $1`;
  if (groupType) {
    params.push(groupType);
    sql += ` AND g.group_type = $${params.length}`;
  }
  sql += ' ORDER BY g.name';
  const result = await pool.query(sql, params);
  return result.rows;
}

async function addGroupMember(groupId, data) {
  if (!data.user_id) throw new Error('user_id is required');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const membership = await client.query(
      `INSERT INTO village_group_members
        (group_id,user_id,role,membership_status,joining_date,leaving_date,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (group_id,user_id)
       DO UPDATE SET role=EXCLUDED.role,
                     membership_status=EXCLUDED.membership_status,
                     joining_date=EXCLUDED.joining_date,
                     leaving_date=EXCLUDED.leaving_date,
                     metadata=EXCLUDED.metadata
       RETURNING *`,
      [
        groupId, data.user_id, data.role || 'member',
        data.membership_status || 'active', data.joining_date || null,
        data.leaving_date || null, json(data.metadata),
      ],
    );
    await client.query(
      `UPDATE village_group_registry
          SET member_count = (
            SELECT COUNT(*) FROM village_group_members
             WHERE group_id = $1 AND membership_status = 'active'
          ), updated_at = NOW()
        WHERE id = $1`,
      [groupId],
    );
    await client.query('COMMIT');
    return membership.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listGroupMembers(groupId) {
  const result = await pool.query(
    `SELECT m.*, u.email
       FROM village_group_members m
       LEFT JOIN users u ON u.id = m.user_id
      WHERE m.group_id = $1
      ORDER BY m.role, m.created_at`,
    [groupId],
  );
  return result.rows;
}

async function getVillageGovernanceSummary(villageId) {
  const [panchayats, councils, groups] = await Promise.all([
    listVillagePanchayats(villageId),
    listVillageCouncils(villageId),
    listVillageGroups(villageId),
  ]);
  return {
    village_id: villageId,
    panchayat_count: panchayats.length,
    primary_panchayat_count: panchayats.filter(p => p.is_primary).length,
    council_count: councils.length,
    group_count: groups.length,
    groups_by_type: groups.reduce((acc, g) => {
      acc[g.group_type] = (acc[g.group_type] || 0) + 1;
      return acc;
    }, {}),
    panchayats,
    councils,
    groups,
  };
}

module.exports = {
  linkVillageToPanchayat,
  listVillagePanchayats,
  createVillageCouncil,
  listVillageCouncils,
  addCouncilMember,
  listCouncilMembers,
  createVillageGroup,
  listVillageGroups,
  addGroupMember,
  listGroupMembers,
  getVillageGovernanceSummary,
};
