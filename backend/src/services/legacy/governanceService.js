/**
 * Governance Service
 * Handles village management, panchayat integration, CSR tracking, and compliance
 */

const { logger } = require('../../../utils/logger');

class GovernanceService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../../../database/pool');
  }

  // Village Management
  async createVillage(villageData) {
    try {
      const { name, district, state, population, households, coordinates, demographics } = villageData;

      const query = `
        INSERT INTO villages 
        (name, district, state, population, households, coordinates, demographics)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        name, district, state, population, households,
        JSON.stringify(coordinates), JSON.stringify(demographics)
      ]);

      logger.info(`Village created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating village', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getVillages(filters = {}) {
    try {
      let query = 'SELECT * FROM villages WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (filters.district) {
        paramCount++;
        query += ` AND district = $${paramCount}`;
        params.push(filters.district);
      }

      if (filters.state) {
        paramCount++;
        query += ` AND state = $${paramCount}`;
        params.push(filters.state);
      }

      query += ' ORDER BY name ASC';

      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting villages', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getVillage(villageId) {
    try {
      let query = 'SELECT * FROM villages WHERE id = $1';
      let result = await this.pool.query(query, [villageId]);

      if (result.rows.length === 0) {
        throw new Error('Village not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting village', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async updateVillage(villageId, updateData) {
    try {
      let query = `
        UPDATE villages
        SET 
          name = COALESCE($1, name),
          district = COALESCE($2, district),
          state = COALESCE($3, state),
          population = COALESCE($4, population),
          households = COALESCE($5, households),
          coordinates = COALESCE($6, coordinates),
          demographics = COALESCE($7, demographics),
          updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        updateData.name,
        updateData.district,
        updateData.state,
        updateData.population,
        updateData.households,
        updateData.coordinates ? JSON.stringify(updateData.coordinates) : null,
        updateData.demographics ? JSON.stringify(updateData.demographics) : null,
        villageId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Village not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating village', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // Panchayat Integration
  async createPanchayat(panchayatData) {
    try {
      const { name, district, state, block, villages, contactInfo, chairman } = panchayatData;

      let query = `
        INSERT INTO panchayats 
        (name, district, state, block, villages, contact_info, chairman)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        name, district, state, block,
        JSON.stringify(villages),
        JSON.stringify(contactInfo),
        chairman
      ]);

      logger.info(`Panchayat created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating panchayat', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getPanchayats(filters = {}) {
    try {
      let query = 'SELECT * FROM panchayats WHERE 1=1';
      let params = [];
      let paramCount = 0;

      if (filters.district) {
        paramCount++;
        query += ` AND district = $${paramCount}`;
        params.push(filters.district);
      }

      if (filters.state) {
        paramCount++;
        query += ` AND state = $${paramCount}`;
        params.push(filters.state);
      }

      query += ' ORDER BY name ASC';

      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting panchayats', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getPanchayat(panchayatId) {
    try {
      let query = 'SELECT * FROM panchayats WHERE id = $1';
      let result = await this.pool.query(query, [panchayatId]);

      if (result.rows.length === 0) {
        throw new Error('Panchayat not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting panchayat', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async addPanchayatScheme(panchayatId, schemeData) {
    try {
      const { name, description, budget, startDate, endDate, targetBeneficiaries } = schemeData;

      let query = `
        INSERT INTO panchayat_schemes 
        (panchayat_id, name, description, budget, start_date, end_date, target_beneficiaries)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        panchayatId, name, description, budget, startDate, endDate,
        JSON.stringify(targetBeneficiaries)
      ]);

      logger.info(`Scheme added to panchayat ${panchayatId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding panchayat scheme', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // CSR Tracking
  async createCSRProject(projectData) {
    try {
      const { name, description, organization, budget, startDate, endDate, location, impactAreas } = projectData;

      let query = `
        INSERT INTO csr_projects 
        (name, description, organization, budget, start_date, end_date, location, impact_areas, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        name, description, organization, budget, startDate, endDate, location,
        JSON.stringify(impactAreas)
      ]);

      logger.info(`CSR project created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating CSR project', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getCSRProjects(filters = {}) {
    try {
      let query = 'SELECT * FROM csr_projects WHERE 1=1';
      let params = [];
      let paramCount = 0;

      if (filters.organization) {
        paramCount++;
        query += ` AND organization = $${paramCount}`;
        params.push(filters.organization);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }

      query += ' ORDER BY created_at DESC';

      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting CSR projects', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getCSRProject(projectId) {
    try {
      let query = 'SELECT * FROM csr_projects WHERE id = $1';
      let result = await this.pool.query(query, [projectId]);

      if (result.rows.length === 0) {
        throw new Error('CSR project not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting CSR project', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async updateCSRProject(projectId, updateData) {
    try {
      let query = `
        UPDATE csr_projects
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          budget = COALESCE($3, budget),
          status = COALESCE($4, status),
          progress = COALESCE($5, progress),
          updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        updateData.name,
        updateData.description,
        updateData.budget,
        updateData.status,
        updateData.progress,
        projectId
      ]);

      if (result.rows.length === 0) {
        throw new Error('CSR project not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating CSR project', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async addCSRContribution(projectId, userId, contributionData) {
    try {
      const { amount, type, description } = contributionData;

      let query = `
        INSERT INTO csr_contributions 
        (project_id, contributor_id, amount, type, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      let result = await this.pool.query(query, [projectId, userId, amount, type, description]);

      logger.info(`CSR contribution added to project ${projectId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding CSR contribution', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getCSRStatistics(filters = {}) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
          SUM(budget) as total_budget,
          SUM(progress) as avg_progress,
          COUNT(DISTINCT organization) as total_organizations
        FROM csr_projects
        WHERE 1=1
      `;

      let result = await this.pool.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting CSR statistics', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // Compliance
  async createComplianceReport(reportData) {
    try {
      const { type, entity, entity_id, period, findings, recommendations, submittedBy } = reportData;

      let query = `
        INSERT INTO compliance_reports 
        (type, entity, entity_id, period, findings, recommendations, submitted_by, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_review')
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        type, entity, entity_id, period,
        JSON.stringify(findings),
        JSON.stringify(recommendations),
        submittedBy
      ]);

      logger.info(`Compliance report created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating compliance report', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getComplianceReports(filters = {}) {
    try {
      let query = 'SELECT * FROM compliance_reports WHERE 1=1';
      let params = [];
      let paramCount = 0;

      if (filters.type) {
        paramCount++;
        query += ` AND type = $${paramCount}`;
        params.push(filters.type);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }

      query += ' ORDER BY created_at DESC';

      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting compliance reports', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getComplianceReport(reportId) {
    try {
      let query = 'SELECT * FROM compliance_reports WHERE id = $1';
      let result = await this.pool.query(query, [reportId]);

      if (result.rows.length === 0) {
        throw new Error('Compliance report not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting compliance report', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async reviewComplianceReport(reportId, reviewerId, reviewData) {
    try {
      const { approved, comments, actionItems } = reviewData;

      let query = `
        UPDATE compliance_reports
        SET 
          status = $1,
          reviewed_by = $2,
          reviewed_at = NOW(),
          review_comments = $3,
          action_items = $4
        WHERE id = $5
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        approved ? 'approved' : 'rejected',
        reviewerId,
        comments,
        JSON.stringify(actionItems),
        reportId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Compliance report not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error reviewing compliance report', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getComplianceStatistics(filters = {}) {
    try {
      let query = `
        SELECT 
          type,
          COUNT(*) as total_reports,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending
        FROM compliance_reports
        GROUP BY type
        ORDER BY total_reports DESC
      `;

      let result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting compliance statistics', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * complianceGaps / complianceReady — platform intermediary-compliance
   * readiness (FSSAI licence, Grievance Officer, Nodal Officer under IT
   * Rules 2021, GSTIN).
   *
   * Ported from v42 (docs/MISSING_BUSINESS_LOGIC_EXTRACTION.md #8). The
   * original read an in-memory COMPLIANCE_RECORD object describing the
   * platform itself — a different concept from compliance_reports above,
   * which tracks per-village/CSR compliance reports. No table covered the
   * platform's own record, so migration 061 added a single-row
   * platform_compliance_record table. Same 6 required fields, same
   * "missing = filter of blank/whitespace values" logic.
   */
  async complianceGaps() {
    try {
      const { rows } = await this.pool.query(
        'SELECT * FROM platform_compliance_record WHERE id = 1'
      );
      const record = rows[0] || {};

      const need = [
        ['fssai_licence', 'FSSAI licence number'],
        ['grievance_officer', 'Grievance Officer name'],
        ['grievance_email', 'Grievance Officer e-mail'],
        ['grievance_phone', 'Grievance Officer phone'],
        ['nodal_officer', 'Nodal Officer (IT Rules 2021)'],
        ['gstin', 'GSTIN']
      ];

      const missing = need
        .filter(([field]) => !String(record[field] || '').trim())
        .map(([, label]) => label);

      return {
        missing,
        totalRequired: need.length,
        completed: need.length - missing.length,
        isReady: missing.length === 0,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error checking compliance gaps', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async complianceReady() {
    const gaps = await this.complianceGaps();
    return gaps.isReady;
  }

  // Cooperative Management
  async createCooperative(cooperativeData) {
    try {
      const { name, type, district, state, registrationNumber, members, bylaws } = cooperativeData;

      let query = `
        INSERT INTO cooperatives 
        (name, type, district, state, registration_number, members, bylaws, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        name, type, district, state, registrationNumber,
        JSON.stringify(members), JSON.stringify(bylaws)
      ]);

      logger.info(`Cooperative created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating cooperative', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getCooperatives(filters = {}) {
    try {
      let query = 'SELECT * FROM cooperatives WHERE 1=1';
      let params = [];
      let paramCount = 0;

      if (filters.type) {
        paramCount++;
        query += ` AND type = $${paramCount}`;
        params.push(filters.type);
      }

      if (filters.district) {
        paramCount++;
        query += ` AND district = $${paramCount}`;
        params.push(filters.district);
      }

      query += ' ORDER BY name ASC';

      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting cooperatives', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async addCooperativeMember(cooperativeId, userId, memberData) {
    try {
      const { role, shareHolding, joiningDate } = memberData;

      let query = `
        INSERT INTO cooperative_members 
        (cooperative_id, user_id, role, share_holding, joining_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        cooperativeId, userId, role, shareHolding, joiningDate
      ]);

      logger.info(`Member added to cooperative ${cooperativeId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding cooperative member', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new GovernanceService();

