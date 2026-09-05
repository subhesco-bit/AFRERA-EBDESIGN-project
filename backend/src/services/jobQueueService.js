/**
 * Job Queue Service
 * Handles job queue management and execution
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const { EventEmitter } = require('events');

class JobQueueService extends EventEmitter {
  constructor() {
    super();
    this.db = null;
    this.queues = new Map();
    this.workers = new Map();
    this.activeJobs = new Map();
    this.isProcessing = false;
  }

  async initialize() {
    try {
      this.db = getPostgreSQL();
      await this.loadExistingQueues();
      await this.startProcessing();
      logger.info('JobQueueService initialized');
    } catch (error) {
      logger.error('JobQueueService initialization failed', error);
    }
  }

  /**
   * Create a new queue
   */
  async createQueue(queueConfig) {
    const { name, concurrency = 1, priority = 'normal' } = queueConfig;

    try {
      if (this.queues.has(name)) {
        throw new Error(`Queue ${name} already exists`);
      }

      const query = `
        INSERT INTO job_queues (name, concurrency, priority, status, created_at)
        VALUES ($1, $2, $3, 'active', NOW())
        RETURNING *
      `;
      const result = await this.db.query(query, [name, concurrency, priority]);
      
      const queue = result.rows[0];
      this.queues.set(name, queue);
      
      logger.info(`Queue created: ${name}`);
      return queue;
    } catch (error) {
      logger.error('Create queue failed', error);
      throw error;
    }
  }

  /**
   * Add job to queue
   */
  async addJob(jobData) {
    const { 
      queueName, 
      type, 
      data, 
      options = {},
      priority = 'normal',
      delay = 0 
    } = jobData;

    try {
      let queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      let query = `
        INSERT INTO jobs (
          queue_id, type, data, options, priority, 
          status, delay, created_at, scheduled_for
        ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW(), NOW() + $6 * INTERVAL '1 second')
        RETURNING *
      `;
      let result = await this.db.query(query, [
        queue.queue_id,
        type,
        JSON.stringify(data),
        JSON.stringify(options),
        priority,
        delay
      ]);

      const job = result.rows[0];
      logger.info(`Job added to queue ${queueName}: ${job.job_id}`);
      
      this.emit('jobAdded', job);
      return job;
    } catch (error) {
      logger.error('Add job failed', error);
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId) {
    try {
      let query = `
        SELECT j.*, q.name as queue_name 
        FROM jobs j
        JOIN job_queues q ON j.queue_id = q.queue_id
        WHERE j.job_id = $1
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
   * Get jobs from queue
   */
  async getQueueJobs(queueName, filters = {}) {
    const { limit = 50, offset = 0, status } = filters;

    try {
      let query = `
        SELECT j.* FROM jobs j
        JOIN job_queues q ON j.queue_id = q.queue_id
        WHERE q.name = $1
      `;
      const params = [queueName];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND j.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY j.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      let result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Get queue jobs failed', error);
      throw error;
    }
  }

  /**
   * Remove job from queue
   */
  async removeJob(jobId) {
    try {
      let job = await this.getJob(jobId);
      
      if (job.status === 'processing') {
        throw new Error('Cannot remove job that is currently processing');
      }

      let query = `
        DELETE FROM jobs WHERE job_id = $1
      `;
      await this.db.query(query, [jobId]);

      logger.info(`Job removed: ${jobId}`);
      return true;
    } catch (error) {
      logger.error('Remove job failed', error);
      throw error;
    }
  }

  /**
   * Load existing queues from database
   */
  async loadExistingQueues() {
    try {
      let query = `
        SELECT * FROM job_queues WHERE status = 'active'
      `;
      let result = await this.db.query(query);
      
      for (const queue of result.rows) {
        this.queues.set(queue.name, queue);
      }

      logger.info(`Loaded ${result.rows.length} active queues`);
    } catch (error) {
      logger.error('Load existing queues failed', error);
    }
  }

  /**
   * Start job processing
   */
  async startProcessing() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    logger.info('Job queue processing started');

    // Process each queue
    for (const [queueName, queue] of this.queues) {
      this.startQueueWorker(queueName, queue);
    }
  }

  /**
   * Start worker for a specific queue
   */
  startQueueWorker(queueName, queue) {
    const worker = setInterval(async () => {
      await this.processNextJob(queueName, queue);
    }, 1000); // Check every second

    this.workers.set(queueName, worker);
  }

  /**
   * Process next job in queue
   */
  async processNextJob(queueName, queue) {
    try {
      // Check if queue is at capacity
      const activeCount = this.activeJobs.get(queueName) || 0;
      if (activeCount >= queue.concurrency) {
        return;
      }

      // Get next pending job
      let query = `
        SELECT * FROM jobs
        WHERE queue_id = $1 
          AND status = 'pending'
          AND scheduled_for <= NOW()
        ORDER BY priority, created_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;
      let result = await this.db.query(query, [queue.queue_id]);
      
      if (result.rows.length === 0) {
        return;
      }

      let job = result.rows[0];
      
      // Mark as processing
      await this.updateJobStatus(job.job_id, 'processing');
      
      // Track active job
      const currentActive = this.activeJobs.get(queueName) || 0;
      this.activeJobs.set(queueName, currentActive + 1);

      // Execute job
      try {
        const jobResult = await this.executeJob(job);
        await this.updateJobStatus(job.job_id, 'completed', { result: jobResult });
        this.emit('jobCompleted', job);
      } catch (error) {
        await this.updateJobStatus(job.job_id, 'failed', { error: error.message });
        this.emit('jobFailed', job, error);
      } finally {
        // Decrement active count
        const newActive = (this.activeJobs.get(queueName) || 0) - 1;
        this.activeJobs.set(queueName, Math.max(0, newActive));
      }
    } catch (error) {
      logger.error(`Process next job failed for queue ${queueName}`, error);
    }
  }

  /**
   * Execute job based on type
   */
  async executeJob(job) {
    const { type, data, options } = job;

    switch (type) {
      case 'email':
        return await this.executeEmailJob(data, options);
      case 'notification':
        return await this.executeNotificationJob(data, options);
      case 'data_processing':
        return await this.executeDataProcessingJob(data, options);
      case 'report':
        return await this.executeReportJob(data, options);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  /**
   * Execute email job
   */
  async executeEmailJob(data, options) {
    // Mock implementation - integrate with email service
    logger.info('Sending email', data);
    return { sent: true, messageId: `msg_${Date.now()}` };
  }

  /**
   * Execute notification job
   */
  async executeNotificationJob(data, options) {
    const notificationService = require('./notificationService');
    return await notificationService.sendNotification(data);
  }

  /**
   * Execute data processing job
   */
  async executeDataProcessingJob(data, options) {
    const batchProcessingService = require('./batchProcessingService');
    return await batchProcessingService.createJob(data);
  }

  /**
   * Execute report job
   */
  async executeReportJob(data, options) {
    // Mock implementation - integrate with reporting service
    logger.info('Generating report', data);
    return { reportId: `report_${Date.now()}`, status: 'generated' };
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId, status, metadata = {}) {
    try {
      let query = `
        UPDATE jobs 
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
   * Get queue statistics
   */
  async getQueueStatistics(queueName) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_jobs,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM jobs j
        JOIN job_queues q ON j.queue_id = q.queue_id
        WHERE q.name = $1
      `;
      let result = await this.db.query(query, [queueName]);
      return result.rows[0];
    } catch (error) {
      logger.error('Get queue statistics failed', error);
      throw error;
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName) {
    try {
      let query = `
        UPDATE job_queues 
        SET status = 'paused'
        WHERE name = $1
      `;
      await this.db.query(query, [queueName]);

      // Stop worker
      let worker = this.workers.get(queueName);
      if (worker) {
        clearInterval(worker);
        this.workers.delete(queueName);
      }

      logger.info(`Queue paused: ${queueName}`);
      return true;
    } catch (error) {
      logger.error('Pause queue failed', error);
      throw error;
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName) {
    try {
      let query = `
        UPDATE job_queues 
        SET status = 'active'
        WHERE name = $1
      `;
      await this.db.query(query, [queueName]);

      // Restart worker
      let queue = this.queues.get(queueName);
      if (queue) {
        this.startQueueWorker(queueName, queue);
      }

      logger.info(`Queue resumed: ${queueName}`);
      return true;
    } catch (error) {
      logger.error('Resume queue failed', error);
      throw error;
    }
  }

  /**
   * Stop all processing
   */
  async stopProcessing() {
    this.isProcessing = false;
    
    // Stop all workers
    for (const [queueName, worker] of this.workers) {
      clearInterval(worker);
    }
    this.workers.clear();

    logger.info('Job queue processing stopped');
  }
}

module.exports = new JobQueueService();
