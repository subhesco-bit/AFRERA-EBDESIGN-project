/**
 * GDPR Compliance Service
 * Implements key GDPR principles: consent management, data localization, right to be forgotten, data portability
 */

const { getPostgreSQL } = require('../../database/connection');

class GDPRService {
  get pool() {
    return getPostgreSQL();
  }

  /**
   * Consent Management - Record user consent
   */
  async recordConsent(userId, consentType, consentGiven, ipAddress, userAgent) {
    try {
      const query = `
        INSERT INTO user_consent (user_id, consent_type, consent_given, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, consent_type) 
        DO UPDATE SET consent_given = $3, ip_address = $4, user_agent = $5, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [userId, consentType, consentGiven, ipAddress, userAgent]);
      return result.rows[0];
    } catch (error) {
      console.error('Error recording consent:', error);
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Get user consent status
   */
  async getUserConsent(userId) {
    try {
      let query = `
        SELECT consent_type, consent_given, created_at, updated_at
        FROM user_consent
        WHERE user_id = $1
        ORDER BY updated_at DESC
      `;
      
      let result = await this.pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user consent:', error);
      throw new Error('Failed to get user consent');
    }
  }

  /**
   * Right to be Forgotten - Anonymize user data
   */
  async rightToBeForgotten(userId, reason, requestId) {
    try {
      // Start transaction
      await this.pool.query('BEGIN');
      
      // Anonymize user personal data
      const anonymizedUser = await this.pool.query(`
        UPDATE users 
        SET 
          email = 'deleted_' || id || '@deleted.local',
          phone_number = NULL,
          first_name = 'Deleted',
          last_name = 'User',
          address = NULL,
          city = NULL,
          state = NULL,
          zip_code = NULL,
          deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [userId]);
      
      // Log the deletion request
      await this.pool.query(`
        INSERT INTO data_subject_requests (user_id, request_type, reason, status, created_at)
        VALUES ($1, 'RIGHT_TO_BE_FORGOTTEN', $2, 'COMPLETED', CURRENT_TIMESTAMP)
      `, [userId, reason]);
      
      await this.pool.query('COMMIT');
      
      return {
        success: true,
        message: 'User data anonymized successfully',
        requestId
      };
    } catch (error) {
      await this.pool.query('ROLLBACK');
      console.error('Error processing right to be forgotten:', error);
      throw new Error('Failed to process right to be forgotten');
    }
  }

  /**
   * Data Portability - Export user data in machine-readable format
   */
  async exportUserData(userId, format = 'json') {
    try {
      // Get user data
      const userData = await this.pool.query(`
        SELECT id, email, first_name, last_name, phone_number, created_at, updated_at
        FROM users
        WHERE id = $1
      `, [userId]);
      
      // Get user consent data
      const consentData = await this.getUserConsent(userId);
      
      // Get user activity data
      const activityData = await this.pool.query(`
        SELECT activity_type, description, created_at
        FROM user_activity
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 100
      `, [userId]);
      
      const exportData = {
        user: userData.rows[0],
        consent: consentData,
        activity: activityData.rows,
        exportDate: new Date().toISOString(),
        format: format
      };
      
      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else if (format === 'csv') {
        // Convert to CSV format
        return this.convertToCSV(exportData);
      }
      
      return exportData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  /**
   * Data Localization - Ensure data residency compliance
   */
  async checkDataResidency(userId, dataRegion) {
    try {
      // Check if user data is stored in the correct region
      let query = `
        SELECT id, data_region, created_at
        FROM user_data_residency
        WHERE user_id = $1
      `;
      
      let result = await this.pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        // Create residency record
        await this.pool.query(`
          INSERT INTO user_data_residency (user_id, data_region, created_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
        `, [userId, dataRegion]);
        
        return {
          compliant: true,
          message: 'Data residency record created'
        };
      }
      
      const existingResidency = result.rows[0];
      if (existingResidency.data_region !== dataRegion) {
        return {
          compliant: false,
          message: 'Data stored in incorrect region',
          currentRegion: existingResidency.data_region,
          requiredRegion: dataRegion
        };
      }
      
      return {
        compliant: true,
        message: 'Data residency compliant'
      };
    } catch (error) {
      console.error('Error checking data residency:', error);
      throw new Error('Failed to check data residency');
    }
  }

  /**
   * Privacy by Design - Privacy Impact Assessment
   */
  async conductPrivacyImpactAssessment(systemComponent, dataTypes, processingPurpose) {
    try {
      const assessment = {
        component: systemComponent,
        dataTypes: dataTypes,
        processingPurpose: processingPurpose,
        risks: [],
        mitigations: [],
        assessmentDate: new Date().toISOString()
      };
      
      // Analyze risks based on data types
      if (dataTypes.includes('personal_identifiable')) {
        assessment.risks.push({
          risk: 'Personal data exposure',
          severity: 'HIGH',
          mitigation: 'Implement encryption at rest and in transit'
        });
      }
      
      if (dataTypes.includes('financial')) {
        assessment.risks.push({
          risk: 'Financial data compromise',
          severity: 'CRITICAL',
          mitigation: 'Implement PCI DSS compliance, strict access controls'
        });
      }
      
      if (dataTypes.includes('health')) {
        assessment.risks.push({
          risk: 'Health data breach',
          severity: 'CRITICAL',
          mitigation: 'Implement HIPAA-level protections, audit logging'
        });
      }
      
      // Log the assessment
      await this.pool.query(`
        INSERT INTO privacy_impact_assessments (component, data_types, processing_purpose, risks, mitigations, assessment_date)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [systemComponent, dataTypes, processingPurpose, JSON.stringify(assessment.risks), JSON.stringify(assessment.mitigations), assessment.assessmentDate]);
      
      return assessment;
    } catch (error) {
      console.error('Error conducting privacy impact assessment:', error);
      throw new Error('Failed to conduct privacy impact assessment');
    }
  }

  /**
   * Helper function to convert data to CSV
   */
  convertToCSV(data) {
    // Simple CSV conversion - would be more sophisticated in production
    let csv = '';
    
    // Convert user data
    if (data.user) {
      csv += 'User Data\n';
      Object.keys(data.user).forEach(key => {
        csv += `${key},${data.user[key]}\n`;
      });
    }
    
    return csv;
  }
}

module.exports = new GDPRService();
