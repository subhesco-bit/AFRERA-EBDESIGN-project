/**
 * Batch Processing Service
 * Handles batch job processing and scheduling
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const { EventEmitter } = require('events');

class BatchProcessingService extends EventEmitter {
  constructor() {
    super();
    this.db = null;
    this.activeJobs = new Map();
    this.jobQueue = [];
    this.maxConcurrentJobs = 5;
    this.processingInterval = 1000; // 1 second
  }

  async initialize() {
    try {
      this.db = getPostgreSQL();
      // Start job processor
      this.startJobProcessor();
      logger.info('BatchProcessingService initialized');
    } catch (error) {
      logger.error('BatchProcessingService initialization failed', error);
    }
  }

  /**
   * Create a batch job
   */
  async createJob(jobData) {
    const { 
      name, 
      type, 
      config, 
      priority = 'normal',
      scheduledFor = null,
      userId = null 
    } = jobData;

    try {
      const query = `
        INSERT INTO batch_jobs (
          name, type, config, priority, status, 
          scheduled_for, user_id, created_at
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW())
        RETURNING *
      `;
      const result = await this.db.query(query, [
        name,
        type,
        JSON.stringify(config),
        priority,
        scheduledFor,
        userId
      ]);

      const job = result.rows[0];
      logger.info(`Batch job created: ${job.job_id}`);
      
      // Add to queue if not scheduled for future
      if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
        this.jobQueue.push(job);
      }

      return job;
    } catch (error) {
      logger.error('Create batch job failed', error);
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId) {
    try {
      let query = `
        SELECT * FROM batch_jobs WHERE job_id = $1
      `;
      let result = await this.db.query(query, [jobId]);
      
      if (result.rows.length === 0) {
        throw new Error('Job not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Get job failed', error);
      throw error;
    }
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId, filters = {}) {
    const { limit = 50, offset = 0, status, type } = filters;

    try {
      let query = `
        SELECT * FROM batch_jobs 
        WHERE user_id = $1
      `;
      const params = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (type) {
        paramCount++;
        query += ` AND type = $${paramCount}`;
        params.push(type);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      let result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Get user jobs failed', error);
      throw error;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId) {
    try {
      let job = await this.getJob(jobId);
      
      if (job.status !== 'pending' && job.status !== 'queued') {
        throw new Error('Cannot cancel job in current status');
      }

      // Remove from queue if present
      this.jobQueue = this.jobQueue.filter(j => j.job_id !== jobId);

      let query = `
        UPDATE batch_jobs 
        SET status = 'cancelled', updated_at = NOW()
        WHERE job_id = $1
        RETURNING *
      `;
      let result = await this.db.query(query, [jobId]);

      logger.info(`Job ${jobId} cancelled`);
      return result.rows[0];
    } catch (error) {
      logger.error('Cancel job failed', error);
      throw error;
    }
  }

  /**
   * Start job processor
   */
  startJobProcessor() {
    setInterval(async () => {
      await this.processNextJob();
    }, this.processingInterval);
  }

  /**
   * Process next job in queue
   */
  async processNextJob() {
    // Check if we can start a new job
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    // Get next job (sort by priority and creation time)
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.jobQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.created_at) - new Date(b.created_at);
    });

    let job = this.jobQueue.shift();
    if (!job) {
      return;
    }

    // Start processing
    this.activeJobs.set(job.job_id, job);
    await this.updateJobStatus(job.job_id, 'processing');

    try {
      let result = await this.executeJob(job);
      await this.updateJobStatus(job.job_id, 'completed', { result });
      this.emit('jobCompleted', job);
    } catch (error) {
      await this.updateJobStatus(job.job_id, 'failed', { error: error.message });
      this.emit('jobFailed', job, error);
    } finally {
      this.activeJobs.delete(job.job_id);
    }
  }

  /**
   * Execute job based on type
   */
  async executeJob(job) {
    const { type, config } = job;

    switch (type) {
      case 'data_import':
        return await this.executeDataImportJob(config);
      case 'data_export':
        return await this.executeDataExportJob(config);
      case 'report_generation':
        return await this.executeReportGenerationJob(config);
      case 'data_sync':
        return await this.executeDataSyncJob(config);
      case 'bulk_update':
        return await this.executeBulkUpdateJob(config);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Execute data import job
   */
  async executeDataImportJob(config) {
    const etlService = require('./etlService');
    return await etlService.runPipeline(config);
  }

  /**
   * Execute data export job
   */
  async executeDataExportJob(config) {
    let etlService = require('./etlService');
    return await etlService.runPipeline(config);
  }

  /**
   * Execute report generation job
   */
  async executeReportGenerationJob(config) {
    // Mock implementation - integrate with reporting service
    logger.info('Generating report', config);
    return { reportId: `report_${Date.now()}`, status: 'generated' };
  }

  /**
   * Execute data sync job
   */
  async executeDataSyncJob(config) {
    let etlService = require('./etlService');
    return await etlService.runPipeline(config);
  }

  /**
   * Execute bulk update job
   */
  async executeBulkUpdateJob(config) {
    const { table, updates, conditions } = config;
    
    let query = `UPDATE ${table} SET `;
    const setClauses = [];
    let params = [];
    let paramCount = 0;

    for (const [field, value] of Object.entries(updates)) {
      paramCount++;
      setClauses.push(`${field} = $${paramCount}`);
      params.push(value);
    }

    query += setClauses.join(', ');

    if (conditions && Object.keys(conditions).length > 0) {
      query += ' WHERE ';
      const whereClauses = [];
      for (const [field, value] of Object.entries(conditions)) {
        paramCount++;
        whereClauses.push(`${field} = $${paramCount}`);
        params.push(value);
      }
      query += whereClauses.join(' AND ');
    }

    let result = await this.db.query(query, params);
    return { updated: result.rowCount };
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId, status, metadata = {}) {
    try {
      let query = `
        UPDATE batch_jobs 
        SET status = $1, 
            metadata = COALESCE($2, metadata),
            updated_at = NOW()
        WHERE job_id = $3
      `;
      await this.db.query(query, [
        status,
        Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
        jobId
      ]);
    } catch (error) {
      logger.error('Update job status failed', error);
    }
  }

  /**
   * Get job statistics
   */
  async getJobStatistics(filters = {}) {
    const { userId, startDate, endDate } = filters;

    try {
      let query = `
        SELECT 
          COUNT(*) as total_jobs,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM batch_jobs
      `;
      let params = [];
      let paramCount = 0;

      if (userId) {
        paramCount++;
        query += ` WHERE user_id = $${paramCount}`;
        params.push(userId);
      }

      if (startDate) {
        paramCount++;
        query += paramCount === 1 ? ' WHERE' : ' AND';
        query += ` created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += paramCount === 1 ? ' WHERE' : ' AND';
        query += ` created_at <= $${paramCount}`;
        params.push(endDate);
      }

      let result = await this.db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Get job statistics failed', error);
      throw error;
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId) {
    try {
      let job = await this.getJob(jobId);
      
      if (job.status !== 'failed') {
        throw new Error('Can only retry failed jobs');
      }

      // Reset job to pending
      await this.updateJobStatus(jobId, 'pending');
      
      // Add to queue
      this.jobQueue.push(job);

      logger.info(`Job ${jobId} queued for retry`);
      return await this.getJob(jobId);
    } catch (error) {
      logger.error('Retry job failed', error);
      throw error;
    }
  }
}

module.exports = new BatchProcessingService();
