/**
 * Background Job Processing Service
 * Handles async operations: emails, exports, reports, payment processing
 * Uses Bull queue with Redis backend
 * CRITICAL SERVICE: Enables scalable async operations
 */

const Queue = require('bull');
const redis = require('redis');

class JobService {
  constructor() {
    this.queues = {};
    this.workers = {};
    this.redisClient = null;
  }

  async init() {
    try {
      // Initialize Redis connection for Bull queues
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
        password: process.env.REDIS_PASSWORD || undefined,
      });

      await this.redisClient.connect();

      // Create job queues for different job types
      this.queues = {
        emailNotifications: new Queue('email-notifications', {
          redis: process.env.REDIS_URL || undefined,
          defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
        }),
        smsAlerts: new Queue('sms-alerts', {
          redis: process.env.REDIS_URL || undefined,
          defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
        }),
        dataExports: new Queue('data-exports', {
          redis: process.env.REDIS_URL || undefined,
          defaultJobOptions: { timeout: 30000, attempts: 2 },
        }),
        reportGeneration: new Queue('report-generation', {
          redis: process.env.REDIS_URL || undefined,
          defaultJobOptions: { timeout: 60000, attempts: 2 },
        }),
        paymentProcessing: new Queue('payment-processing', {
          redis: process.env.REDIS_URL || undefined,
          defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 1000 } },
        }),
        dataSync: new Queue('data-sync', {
          redis: process.env.REDIS_URL || undefined,
          defaultJobOptions: { timeout: 120000, attempts: 3 },
        }),
        analyticsAggregation: new Queue('analytics-aggregation', {
          redis: process.env.REDIS_URL || undefined,
          defaultJobOptions: { timeout: 60000, attempts: 2 },
        }),
      };

      // Setup job processors
      this.setupProcessors();

      // Setup event listeners
      this.setupListeners();

      console.log('✅ Job service initialized');
    } catch (error) {
      console.error('Job service init error:', error);
      throw error;
    }
  }

  setupProcessors() {
    // Email notification processor
    this.queues.emailNotifications.process(async (job) => {
      console.log(`Processing email job: ${job.id}`);
      const { to, subject, template, data } = job.data;

      try {
        // TODO: Integrate with Sendgrid
        console.log(`Email to ${to}: ${subject}`);
        return { success: true, messageId: job.id };
      } catch (error) {
        console.error(`Email job ${job.id} failed:`, error);
        throw error;
      }
    });

    // SMS alert processor
    this.queues.smsAlerts.process(async (job) => {
      console.log(`Processing SMS job: ${job.id}`);
      const { phone, message } = job.data;

      try {
        // TODO: Integrate with Twilio
        console.log(`SMS to ${phone}: ${message}`);
        return { success: true, messageId: job.id };
      } catch (error) {
        console.error(`SMS job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Data export processor
    this.queues.dataExports.process(async (job) => {
      console.log(`Processing export job: ${job.id}`);
      const { userId, format, dataType } = job.data;

      try {
        // TODO: Generate export file (CSV/Excel/PDF)
        console.log(`Exporting ${dataType} for user ${userId} as ${format}`);
        return { success: true, fileUrl: `/exports/${job.id}.${format}` };
      } catch (error) {
        console.error(`Export job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Report generation processor
    this.queues.reportGeneration.process(async (job) => {
      console.log(`Processing report job: ${job.id}`);
      const { reportType, dateRange, userId } = job.data;

      try {
        // TODO: Generate report (business intelligence)
        console.log(`Generating ${reportType} report for user ${userId}`);
        return { success: true, reportUrl: `/reports/${job.id}.pdf` };
      } catch (error) {
        console.error(`Report job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Payment processing processor
    this.queues.paymentProcessing.process(async (job) => {
      console.log(`Processing payment job: ${job.id}`);
      const { userId, amount, method } = job.data;

      try {
        // TODO: Process payment via Stripe/Razorpay
        console.log(`Processing ${method} payment of ${amount} for user ${userId}`);
        return { success: true, transactionId: job.id };
      } catch (error) {
        console.error(`Payment job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Data sync processor
    this.queues.dataSync.process(async (job) => {
      console.log(`Processing sync job: ${job.id}`);
      const { source, destination, dataType } = job.data;

      try {
        // TODO: Sync data between systems
        console.log(`Syncing ${dataType} from ${source} to ${destination}`);
        return { success: true, recordsSynced: 0 };
      } catch (error) {
        console.error(`Sync job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Analytics aggregation processor
    this.queues.analyticsAggregation.process(async (job) => {
      console.log(`Processing analytics job: ${job.id}`);
      const { period, metrics } = job.data;

      try {
        // TODO: Aggregate analytics data
        console.log(`Aggregating ${metrics.join(', ')} for period ${period}`);
        return { success: true, recordsProcessed: 0 };
      } catch (error) {
        console.error(`Analytics job ${job.id} failed:`, error);
        throw error;
      }
    });
  }

  setupListeners() {
    Object.entries(this.queues).forEach(([queueName, queue]) => {
      queue.on('completed', (job) => {
        console.log(`✅ Job ${queueName}:${job.id} completed`);
      });

      queue.on('failed', (job, err) => {
        console.error(`❌ Job ${queueName}:${job.id} failed: ${err.message}`);
      });

      queue.on('error', (error) => {
        console.error(`Queue error for ${queueName}:`, error);
      });
    });
  }

  // Enqueue a job
  async enqueue(jobType, data) {
  // Validate inputs
  if (!jobType) throw new Error('Missing required parameter');

    try {
      const queue = this.queues[jobType];
      if (!queue) {
        throw new Error(`Unknown job type: ${jobType}`);
      }

      const job = await queue.add(data, {
        removeOnComplete: true,
        removeOnFail: false,
      });

      console.log(`📨 Job enqueued: ${jobType}:${job.id}`);
      return job;
    } catch (error) {
      console.error(`Enqueue error for ${jobType}:`, error);
      throw error;
    }
  }

  // Get job status
  async getJobStatus(jobType, jobId) {
    try {
      const queue = this.queues[jobType];
      if (!queue) {
        throw new Error(`Unknown job type: ${jobType}`);
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress();

      return {
        id: job.id,
        state,
        progress,
        data: job.data,
        result: job.returnvalue,
        failedReason: job.failedReason,
      };
    } catch (error) {
      console.error(`Get status error for ${jobType}:${jobId}:`, error);
      return null;
    }
  }

  // Retry a failed job
  async retryJob(jobType, jobId) {
    try {
      const queue = this.queues[jobType];
      if (!queue) {
        throw new Error(`Unknown job type: ${jobType}`);
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      await job.retry();
      console.log(`🔄 Job retried: ${jobType}:${jobId}`);
      return job;
    } catch (error) {
      console.error(`Retry error for ${jobType}:${jobId}:`, error);
      throw error;
    }
  }

  // Get queue stats
  async getQueueStats(jobType) {
    try {
      const queue = this.queues[jobType];
      if (!queue) {
        throw new Error(`Unknown job type: ${jobType}`);
      }

      const counts = await queue.getJobCounts();
      return {
        jobType,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
        waiting: counts.waiting,
      };
    } catch (error) {
      console.error(`Queue stats error for ${jobType}:`, error);
      return null;
    }
  }

  // Get all queue stats
  async getAllQueueStats() {
    const stats = {};
    for (const jobType of Object.keys(this.queues)) {
      stats[jobType] = await this.getQueueStats(jobType);
    }
    return stats;
  }

  // Clean up completed jobs
  async cleanupCompletedJobs(jobType, count = 1000) {
    try {
      const queue = this.queues[jobType];
      if (!queue) {
        throw new Error(`Unknown job type: ${jobType}`);
      }

      await queue.clean(0, 'completed', count);
      console.log(`🧹 Cleaned ${count} completed jobs from ${jobType}`);
    } catch (error) {
      console.error(`Cleanup error for ${jobType}:`, error);
    }
  }

  async close() {
    try {
      for (const queue of Object.values(this.queues)) {
        await queue.close();
      }
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      console.log('Job service closed');
    } catch (error) {
      console.error('Close error:', error);
    }
  }
}

module.exports = new JobService();
