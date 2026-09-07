/**
 * Land Records Service
 * Manages farmer land records, integration with government land databases
 */

const { logger } = require('../utils/logger');

class LandRecordsService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../database/pool');
  }

  /**
   * Add land record for a farmer
   */
  async addLandRecord(farmerId, landData) {
    const {
      surveyNumber,
      village,
      district,
      state,
      areaInHectares,
      areaInAcres,
      soilType,
      irrigationType,
      ownershipType,
      landUseType,
      khasraNumber,
      boundaryDetails,
      gpsCoordinates,
      documents
    } = landData;

    try {
      const query = `
        INSERT INTO land_records 
        (farmer_id, survey_number, village, district, state, area_in_hectares,
         area_in_acres, soil_type, irrigation_type, ownership_type, land_use_type,
         khasra_number, boundary_details, gps_coordinates, documents, verification_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending')
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        farmerId,
        surveyNumber,
        village,
        district,
        state,
        areaInHectares,
        areaInAcres,
        soilType,
        irrigationType,
        ownershipType,
        landUseType,
        khasraNumber,
        JSON.stringify(boundaryDetails),
        JSON.stringify(gpsCoordinates),
        JSON.stringify(documents || [])
      ]);

      logger.info(`Land record added for farmer ${farmerId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding land record', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get land records for a farmer
   */
  async getFarmerLandRecords(farmerId, filters = {}) {
    const { district, verificationStatus, page = 1, limit = 20 } = filters;

    try {
      let query = `
        SELECT lr.*
        FROM land_records lr
        WHERE lr.farmer_id = $1
      `;

      const params = [farmerId];
      let paramCount = 1;

      if (district) {
        paramCount++;
        query += ` AND lr.district = $${paramCount}`;
        params.push(district);
      }

      if (verificationStatus) {
        paramCount++;
        query += ` AND lr.verification_status = $${paramCount}`;
        params.push(verificationStatus);
      }

      query += ' ORDER BY lr.created_at DESC';

      const offset = (page - 1) * limit;
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await this.pool.query(query, params);

      // Calculate total land area
      const totalQuery = `
        SELECT 
          SUM(area_in_hectares) as total_hectares,
          SUM(area_in_acres) as total_acres,
          COUNT(*) as total_plots
        FROM land_records
        WHERE farmer_id = $1 AND verification_status = 'verified'
      `;

      const totalResult = await this.pool.query(totalQuery, [farmerId]);

      return {
        records: result.rows,
        totals: totalResult.rows[0],
        pagination: { page, limit }
      };
    } catch (error) {
      logger.error('Error getting farmer land records', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get land record by ID
   */
  async getLandRecord(recordId, farmerId, isAdmin = false) {
    try {
      let query = `
        SELECT 
          lr.*,
          f.name as farmer_name,
          f.fdi_score as farmer_fdi
        FROM land_records lr
        JOIN farmers f ON lr.farmer_id = f.id
        WHERE lr.id = $1
      `;

      const params = [recordId];

      if (!isAdmin) {
        query += ' AND lr.farmer_id = $2';
        params.push(farmerId);
      }

      const result = await this.pool.query(query, params);

      if (result.rows.length === 0) {
        throw new Error('Land record not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting land record', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Update land record
   */
  async updateLandRecord(recordId, farmerId, updateData) {
    try {
      const currentRecord = await this.getLandRecord(recordId, farmerId);

      const query = `
        UPDATE land_records
        SET 
          survey_number = COALESCE($1, survey_number),
          village = COALESCE($2, village),
          district = COALESCE($3, district),
          state = COALESCE($4, state),
          area_in_hectares = COALESCE($5, area_in_hectares),
          area_in_acres = COALESCE($6, area_in_acres),
          soil_type = COALESCE($7, soil_type),
          irrigation_type = COALESCE($8, irrigation_type),
          ownership_type = COALESCE($9, ownership_type),
          land_use_type = COALESCE($10, land_use_type),
          khasra_number = COALESCE($11, khasra_number),
          boundary_details = COALESCE($12, boundary_details),
          gps_coordinates = COALESCE($13, gps_coordinates),
          documents = COALESCE($14, documents),
          verification_status = 'pending',
          updated_at = NOW()
        WHERE id = $15 AND farmer_id = $16
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        updateData.surveyNumber,
        updateData.village,
        updateData.district,
        updateData.state,
        updateData.areaInHectares,
        updateData.areaInAcres,
        updateData.soilType,
        updateData.irrigationType,
        updateData.ownershipType,
        updateData.landUseType,
        updateData.khasraNumber,
        updateData.boundaryDetails ? JSON.stringify(updateData.boundaryDetails) : null,
        updateData.gpsCoordinates ? JSON.stringify(updateData.gpsCoordinates) : null,
        updateData.documents ? JSON.stringify(updateData.documents) : null,
        recordId,
        farmerId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Land record not found or unauthorized');
      }

      logger.info(`Land record ${recordId} updated`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating land record', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Verify land record (admin)
   */
  async verifyLandRecord(recordId, adminId, verificationData) {
    const { verified, governmentReference, notes } = verificationData;

    try {
      const query = `
        UPDATE land_records
        SET 
          verification_status = $1,
          verified_by = $2,
          verified_at = NOW(),
          government_reference = $3,
          verification_notes = $4
        WHERE id = $5
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        verified ? 'verified' : 'rejected',
        adminId,
        governmentReference,
        notes,
        recordId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Land record not found');
      }

      // Update farmer FDI score if verified
      if (verified) {
        await this.updateFarmerFDIForLand(result.rows[0].farmer_id);
      }

      logger.info(`Land record ${recordId} ${verified ? 'verified' : 'rejected'}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error verifying land record', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Sync with government land records
   */
  async syncWithGovernmentLandRecords(farmerId) {
    try {
      // In production, this would call government APIs
      // For now, simulate the sync process

      const farmerQuery = `
        SELECT * FROM farmers WHERE id = $1
      `;
      const farmerResult = await this.pool.query(farmerQuery, [farmerId]);
      const farmer = farmerResult.rows[0];

      // Simulate government API response
      const governmentRecords = await this.fetchGovernmentLandRecords(farmer.aadhar_number);

      let syncedCount = 0;
      const newRecords = [];

      for (const govRecord of governmentRecords) {
        // Check if record already exists
        const existingQuery = `
          SELECT id FROM land_records
          WHERE farmer_id = $1 AND khasra_number = $2
        `;
        const existingResult = await this.pool.query(existingQuery, [farmerId, govRecord.khasraNumber]);

        if (existingResult.rows.length === 0) {
          // Create new record from government data
          const newRecord = await this.addLandRecord(farmerId, {
            surveyNumber: govRecord.surveyNumber,
            village: govRecord.village,
            district: govRecord.district,
            state: govRecord.state,
            areaInHectares: govRecord.areaInHectares,
            areaInAcres: govRecord.areaInAcres,
            soilType: govRecord.soilType,
            irrigationType: govRecord.irrigationType,
            ownershipType: govRecord.ownershipType,
            landUseType: govRecord.landUseType,
            khasraNumber: govRecord.khasraNumber,
            boundaryDetails: govRecord.boundaryDetails,
            gpsCoordinates: govRecord.gpsCoordinates,
            documents: []
          });

          // Auto-verify government records
          await this.verifyLandRecord(newRecord.id, null, {
            verified: true,
            governmentReference: govRecord.referenceNumber,
            notes: 'Auto-verified from government records'
          });

          syncedCount++;
          newRecords.push(newRecord);
        }
      }

      return {
        farmerId,
        syncedCount,
        newRecords,
        syncedAt: new Date()
      };
    } catch (error) {
      logger.error('Error syncing with government land records', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Fetch government land records (simulated)
   */
  async fetchGovernmentLandRecords(aadharNumber) {
    // In production, this would call actual government APIs
    // For now, return simulated data
    return [];
  }

  /**
   * Update farmer FDI score for land ownership
   */
  async updateFarmerFDIForLand(farmerId) {
    try {
      const query = `
        UPDATE farmers
        SET 
          fdi_score = fdi_score + 5,
          updated_at = NOW()
        WHERE id = $1
        RETURNING fdi_score
      `;

      const result = await this.pool.query(query, [farmerId]);
      return result.rows[0].fdi_score;
    } catch (error) {
      logger.error('Error updating farmer FDI', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get land statistics for a region
   */
  async getRegionalLandStatistics(filters = {}) {
    const { state, district, village } = filters;

    try {
      let query = `
        SELECT 
          state,
          district,
          village,
          COUNT(*) as total_farmers,
          COUNT(DISTINCT farmer_id) as unique_farmers,
          SUM(area_in_hectares) as total_hectares,
          SUM(area_in_acres) as total_acres,
          AVG(area_in_hectares) as avg_holding_size,
          COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_records,
          COUNT(CASE WHEN irrigation_type = 'canal' THEN 1 END) as canal_irrigated,
          COUNT(CASE WHEN irrigation_type = 'tubewell' THEN 1 END) as tubewell_irrigated,
          COUNT(CASE WHEN irrigation_type = 'rainfed' THEN 1 END) as rainfed
        FROM land_records
        WHERE verification_status = 'verified'
      `;

      const params = [];
      let paramCount = 0;

      if (state) {
        paramCount++;
        query += ` AND state = $${paramCount}`;
        params.push(state);
      }

      if (district) {
        paramCount++;
        query += ` AND district = $${paramCount}`;
        params.push(district);
      }

      if (village) {
        paramCount++;
        query += ` AND village = $${paramCount}`;
        params.push(village);
      }

      query += ' GROUP BY state, district, village ORDER BY total_hectares DESC';

      const result = await this.pool.query(query, params);

      return result.rows;
    } catch (error) {
      logger.error('Error getting regional land statistics', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Delete land record
   */
  async deleteLandRecord(recordId, farmerId) {
    try {
      const query = `
        DELETE FROM land_records
        WHERE id = $1 AND farmer_id = $2 AND verification_status = 'pending'
        RETURNING *
      `;

      const result = await this.pool.query(query, [recordId, farmerId]);

      if (result.rows.length === 0) {
        throw new Error('Land record not found or cannot be deleted');
      }

      logger.info(`Land record ${recordId} deleted`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting land record', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new LandRecordsService();
