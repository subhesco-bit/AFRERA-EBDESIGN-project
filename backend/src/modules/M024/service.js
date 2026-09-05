/**
 * Farmer Groups Service (M024)
 * Farmer producer groups and cooperatives management with AI-powered group health analysis
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create farmer group
 */
async function createFarmerGroup(groupData) {
  try {
    const {
      group_name,
      group_code,
      group_type,
      registration_number,
      registration_date,
      district,
      state,
      village,
      address,
      leader_id,
      contact_person,
      contact_phone,
      contact_email,
      established_date,
      objectives,
      bylaws,
      bank_account_details
    } = groupData;

    const group = {
      group_id: generateId(),
      group_name,
      group_code,
      group_type,
      registration_number,
      registration_date,
      district,
      state,
      village,
      address,
      leader_id,
      contact_person,
      contact_phone,
      contact_email,
      established_date,
      total_members: 0,
      objectives: objectives || [],
      bylaws: bylaws || {},
      bank_account_details: bank_account_details || {},
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered group health analysis
    const aiRequest = {
      task: 'farmer_group_health_analysis',
      parameters: {
        group_data: groupData,
        regional_groups: await getRegionalGroups(state, district),
        industry_benchmarks: await getGroupBenchmarks(group_type),
        success_factors: await getSuccessFactors(group_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    group.ai_group_health_score = aiResponse.health_score;

    const result = await pool.query(
      `INSERT INTO farmer_groups 
       (group_id, group_name, group_code, group_type, registration_number, registration_date, 
        district, state, village, address, leader_id, contact_person, contact_phone, contact_email, 
        established_date, total_members, objectives, bylaws, bank_account_details, ai_group_health_score, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING *`,
      [
        group.group_id, group.group_name, group.group_code, group.group_type,
        group.registration_number, group.registration_date, group.district, group.state,
        group.village, group.address, group.leader_id, group.contact_person,
        group.contact_phone, group.contact_email, group.established_date,
        group.total_members, JSON.stringify(group.objectives), JSON.stringify(group.bylaws),
        JSON.stringify(group.bank_account_details), group.ai_group_health_score,
        group.status, group.created_at
      ]
    );

    logger.info(`Farmer group created: ${group.group_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating farmer group', { error: error.message, stack: error.stack });
    throw new Error('Failed to create farmer group');
  }
}

/**
 * Add member to group
 */
async function addGroupMember(groupId, farmerId, membershipData) {
  try {
    const { membership_type, role, contribution_amount, share_percentage, voting_rights } = membershipData;

    const membership = {
      membership_id: generateId(),
      group_id: groupId,
      farmer_id: farmerId,
      membership_type,
      role,
      join_date: new Date().toISOString().split('T')[0],
      contribution_amount,
      share_percentage,
      voting_rights: voting_rights !== undefined ? voting_rights : true,
      status: 'active',
      created_at: new Date().toISOString()
    };

    let result = await pool.query(
      `INSERT INTO group_memberships 
       (membership_id, group_id, farmer_id, membership_type, role, join_date, 
        contribution_amount, share_percentage, voting_rights, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        membership.membership_id, membership.group_id, membership.farmer_id,
        membership.membership_type, membership.role, membership.join_date,
        membership.contribution_amount, membership.share_percentage,
        membership.voting_rights, membership.status, membership.created_at
      ]
    );

    // Update group member count
    await pool.query(
      'UPDATE farmer_groups SET total_members = total_members + 1 WHERE group_id = $1',
      [groupId]
    );

    logger.info(`Group member added: ${membership.membership_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding group member', { error: error.message, stack: error.stack });
    throw new Error('Failed to add group member');
  }
}

/**
 * Record group meeting
 */
async function recordGroupMeeting(groupId, meetingData) {
  try {
    const { meeting_type, meeting_date, meeting_time, location, agenda, attendees, minutes, decisions, action_items } = meetingData;

    const meeting = {
      meeting_id: generateId(),
      group_id: groupId,
      meeting_type,
      meeting_date,
      meeting_time,
      location,
      agenda: agenda || [],
      attendees: attendees || [],
      minutes,
      decisions: decisions || [],
      action_items: action_items || [],
      created_at: new Date().toISOString()
    };

    let result = await pool.query(
      `INSERT INTO group_meetings 
       (meeting_id, group_id, meeting_type, meeting_date, meeting_time, location, 
        agenda, attendees, minutes, decisions, action_items, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        meeting.meeting_id, meeting.group_id, meeting.meeting_type, meeting.meeting_date,
        meeting.meeting_time, meeting.location, JSON.stringify(meeting.agenda),
        JSON.stringify(meeting.attendees), meeting.minutes, JSON.stringify(meeting.decisions),
        JSON.stringify(meeting.action_items), meeting.created_at
      ]
    );

    logger.info(`Group meeting recorded: ${meeting.meeting_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error recording group meeting', { error: error.message, stack: error.stack });
    throw new Error('Failed to record group meeting');
  }
}

/**
 * Record group financial transaction
 */
async function recordGroupTransaction(groupId, transactionData) {
  try {
    const { transaction_type, amount, description, category, transaction_date, reference_number, created_by } = transactionData;

    const transaction = {
      finance_id: generateId(),
      group_id: groupId,
      transaction_type,
      amount,
      description,
      category,
      transaction_date,
      reference_number,
      created_by,
      created_at: new Date().toISOString()
    };

    let result = await pool.query(
      `INSERT INTO group_finances 
       (finance_id, group_id, transaction_type, amount, description, category, 
        transaction_date, reference_number, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        transaction.finance_id, transaction.group_id, transaction.transaction_type,
        transaction.amount, transaction.description, transaction.category,
        transaction.transaction_date, transaction.reference_number,
        transaction.created_by, transaction.created_at
      ]
    );

    logger.info(`Group transaction recorded: ${transaction.finance_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error recording group transaction', { error: error.message, stack: error.stack });
    throw new Error('Failed to record group transaction');
  }
}

/**
 * Get group analytics
 */
async function getGroupAnalytics(groupId) {
  try {
    let group = await pool.query('SELECT * FROM farmer_groups WHERE group_id = $1', [groupId]);
    if (group.rows.length === 0) {
      throw new Error('Group not found');
    }

    const members = await pool.query('SELECT * FROM group_memberships WHERE group_id = $1', [groupId]);
    const finances = await pool.query('SELECT * FROM group_finances WHERE group_id = $1', [groupId]);
    const meetings = await pool.query('SELECT * FROM group_meetings WHERE group_id = $1', [groupId]);

    const analytics = {
      group_id: groupId,
      group_info: group.rows[0],
      member_count: members.rows.length,
      active_members: members.rows.filter(m => m.status === 'active').length,
      total_contributions: members.rows.reduce((sum, m) => sum + (m.contribution_amount || 0), 0),
      financial_summary: {
        total_income: finances.rows.filter(f => f.transaction_type === 'income').reduce((sum, f) => sum + f.amount, 0),
        total_expenses: finances.rows.filter(f => f.transaction_type === 'expense').reduce((sum, f) => sum + f.amount, 0),
        balance: 0
      },
      meeting_count: meetings.rows.length,
      recent_meetings: meetings.rows.slice(0, 5),
      ai_insights: await generateGroupInsights(groupId, members.rows, finances.rows)
    };

    analytics.financial_summary.balance = analytics.financial_summary.total_income - analytics.financial_summary.total_expenses;

    return analytics;
  } catch (error) {
    logger.error('Error getting group analytics', { error: error.message, stack: error.stack });
    throw new Error('Failed to get group analytics');
  }
}

function generateId() {
  return `FG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getRegionalGroups(state, district) {
  try {
    let result = await pool.query(
      'SELECT * FROM farmer_groups WHERE state = $1 AND district = $2',
      [state, district]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getGroupBenchmarks(groupType) {
  return {
    average_members: 25,
    average_financial_health: 0.75,
    success_rate: 0.8
  };
}

async function getSuccessFactors(groupType) {
  return {
    leadership_quality: 'critical',
    member_participation: 'important',
    financial_transparency: 'critical',
    market_access: 'important'
  };
}

async function generateGroupInsights(groupId, members, finances) {
  let aiRequest = {
    task: 'group_analytics_insights',
    parameters: {
      group_id: groupId,
      member_data: members,
      financial_data: finances
    }
  };

  let aiResponse = await aiAPI.generateRecommendation(aiRequest);
  return aiResponse;
}

module.exports = {
  createFarmerGroup,
  addGroupMember,
  recordGroupMeeting,
  recordGroupTransaction,
  getGroupAnalytics
};
