/**
 * Automated Database Backup and Recovery System
 * Production-ready backup management with scheduling, encryption, and cloud storage
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { logger } = require('../../utils/logger');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

class BackupManager {
  constructor(config = {}) {
    this.config = {
      // Backup schedule
      backupInterval: config.backupInterval || 86400000, // 24 hours default
      retentionDays: config.retentionDays || 30,
      
      // Backup types
      enableFullBackup: config.enableFullBackup !== false,
      enableIncrementalBackup: config.enableIncrementalBackup !== false,
      fullBackupInterval: config.fullBackupInterval || 7, // Every 7 days
      
      // Storage configuration
      localBackupDir: config.localBackupDir || path.join(process.cwd(), 'backups', 'database'),
      enableCloudStorage: config.enableCloudStorage !== false,
      cloudProvider: config.cloudProvider || 's3',
      
      // S3 configuration
      s3Bucket: config.s3Bucket || process.env.AWS_S3_BUCKET,
      s3Region: config.s3Region || process.env.AWS_REGION || 'us-east-1',
      s3Prefix: config.s3Prefix || 'database-backups',
      
      // Encryption
      enableEncryption: config.enableEncryption !== false,
      encryptionKey: config.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY,
      
      // Compression
      enableCompression: config.enableCompression !== false,
      compressionLevel: config.compressionLevel || 6,
      
      // Database connection
      databaseUrl: config.databaseUrl || process.env.DATABASE_URL,
      databaseName: config.databaseName || process.env.PG_DATABASE || 'afrera_db',
      
      // Notification
      enableNotification: config.enableNotification !== false,
      notificationWebhook: config.notificationWebhook || process.env.BACKUP_NOTIFICATION_WEBHOOK,
      
      ...config
    };

    this.pool = null;
    this.backupTimer = null;
    this.cleanupTimer = null;
    this.s3Client = null;
    this.isRunning = false;

    // Initialize S3 client if cloud storage is enabled
    if (this.config.enableCloudStorage && this.config.cloudProvider === 's3') {
      this.initializeS3Client();
    }

    // Create backup directory
    this.ensureBackupDirectory();
  }

  /**
   * Initialize S3 client for cloud storage
   */
  initializeS3Client() {
    try {
      this.s3Client = new S3Client({
        region: this.config.s3Region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      logger.info('S3 client initialized');
    } catch (error) {
      logger.error('Failed to initialize S3 client', { error: error.message });
      this.config.enableCloudStorage = false;
    }
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.config.localBackupDir)) {
      fs.mkdirSync(this.config.localBackupDir, { recursive: true });
      logger.info('Created backup directory', { path: this.config.localBackupDir });
    }
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      this.pool = new Pool({
        connectionString: this.config.databaseUrl
      });
      
      // Test connection
      await this.pool.query('SELECT NOW()');
      logger.info('Backup manager initialized');
    } catch (error) {
      logger.error('Failed to initialize backup manager', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate backup filename
   */
  generateBackupFilename(type = 'full') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hash = crypto.randomBytes(4).toString('hex');
    return `${this.config.databaseName}_${type}_${timestamp}_${hash}.sql`;
  }

  /**
   * Perform full database backup using pg_dump
   */
  async performFullBackup() {
    const filename = this.generateBackupFilename('full');
    const filepath = path.join(this.config.localBackupDir, filename);
    const startTime = Date.now();

    logger.info('Starting full database backup', { filename });

    try {
      // Build pg_dump command
      const pgDumpArgs = [
        process.env.DATABASE_URL,
        '--format=plain',
        '--no-owner',
        '--no-acl',
        '--verbose',
        '--file=' + filepath
      ];

      if (this.config.enableCompression) {
        pgDumpArgs.push('--compress=' + this.config.compressionLevel);
      }

      // Execute pg_dump
      const command = `pg_dump ${pgDumpArgs.join(' ')}`;
      execSync(command, { stdio: 'inherit' });

      const duration = Date.now() - startTime;
      const fileSize = fs.statSync(filepath).size;

      logger.info('Full backup completed', {
        filename,
        duration: duration + 'ms',
        size: (fileSize / 1024 / 1024).toFixed(2) + 'MB'
      });

      // Encrypt if enabled
      let finalFilepath = filepath;
      if (this.config.enableEncryption) {
        finalFilepath = await this.encryptFile(filepath);
        fs.unlinkSync(filepath); // Remove unencrypted file
      }

      // Upload to cloud if enabled
      if (this.config.enableCloudStorage) {
        await this.uploadToCloud(finalFilepath, filename);
      }

      // Record backup metadata
      await this.recordBackupMetadata({
        filename: path.basename(finalFilepath),
        type: 'full',
        size: fs.statSync(finalFilepath).size,
        duration,
        location: this.config.enableCloudStorage ? 'cloud' : 'local'
      });

      // Send notification
      await this.sendNotification({
        type: 'backup_completed',
        backupType: 'full',
        filename: path.basename(finalFilepath),
        duration,
        size: fs.statSync(finalFilepath).size
      });

      return {
        success: true,
        filename: path.basename(finalFilepath),
        filepath: finalFilepath,
        duration,
        size: fs.statSync(finalFilepath).size
      };
    } catch (error) {
      logger.error('Full backup failed', { error: error.message });
      
      await this.sendNotification({
        type: 'backup_failed',
        backupType: 'full',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Perform incremental backup (using WAL archiving)
   */
  async performIncrementalBackup() {
    const filename = this.generateBackupFilename('incremental');
    const filepath = path.join(this.config.localBackupDir, filename);
    const startTime = Date.now();

    logger.info('Starting incremental database backup', { filename });

    try {
      // For incremental backups, we use pg_dump with --section=data
      // This is a simplified approach - true incremental requires WAL archiving
      const command = `pg_dump ${process.env.DATABASE_URL} --section=data --format=plain --no-owner --no-acl --file=${filepath}`;
      execSync(command, { stdio: 'inherit' });

      const duration = Date.now() - startTime;
      const fileSize = fs.statSync(filepath).size;

      logger.info('Incremental backup completed', {
        filename,
        duration: duration + 'ms',
        size: (fileSize / 1024 / 1024).toFixed(2) + 'MB'
      });

      // Encrypt if enabled
      let finalFilepath = filepath;
      if (this.config.enableEncryption) {
        finalFilepath = await this.encryptFile(filepath);
        fs.unlinkSync(filepath);
      }

      // Upload to cloud if enabled
      if (this.config.enableCloudStorage) {
        await this.uploadToCloud(finalFilepath, filename);
      }

      // Record backup metadata
      await this.recordBackupMetadata({
        filename: path.basename(finalFilepath),
        type: 'incremental',
        size: fs.statSync(finalFilepath).size,
        duration,
        location: this.config.enableCloudStorage ? 'cloud' : 'local'
      });

      return {
        success: true,
        filename: path.basename(finalFilepath),
        filepath: finalFilepath,
        duration,
        size: fs.statSync(finalFilepath).size
      };
    } catch (error) {
      logger.error('Incremental backup failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Encrypt backup file
   */
  async encryptFile(filepath) {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const encryptedPath = filepath + '.enc';
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(filepath);
    const output = fs.createWriteStream(encryptedPath);

    return new Promise((resolve, reject) => {
      input.pipe(cipher).pipe(output);
      
      output.on('finish', () => {
        // Append IV to the encrypted file for decryption
        fs.appendFileSync(encryptedPath, iv);
        resolve(encryptedPath);
      });
      
      output.on('error', reject);
      cipher.on('error', reject);
      input.on('error', reject);
    });
  }

  /**
   * Decrypt backup file
   */
  async decryptFile(encryptedPath) {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const decryptedPath = encryptedPath.replace('.enc', '');
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);

    // Read IV from the end of the file
    const fileBuffer = fs.readFileSync(encryptedPath);
    const iv = fileBuffer.slice(-16);
    const encryptedData = fileBuffer.slice(0, -16);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    fs.writeFileSync(decryptedPath, decipher.update(encryptedData));
    decipher.final();
    fs.appendFileSync(decryptedPath, decipher.final());

    return decryptedPath;
  }

  /**
   * Upload backup to cloud storage
   */
  async uploadToCloud(filepath, filename) {
    if (!this.s3Client || !this.config.s3Bucket) {
      logger.warn('Cloud storage not configured, skipping upload');
      return;
    }

    try {
      const key = `${this.config.s3Prefix}/${new Date().toISOString().split('T')[0]}/${filename}`;
      const fileStream = fs.createReadStream(filepath);
      const fileStats = fs.statSync(filepath);

      const command = new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
        Body: fileStream,
        ContentType: 'application/octet-stream',
        ContentLength: fileStats.size
      });

      await this.s3Client.send(command);
      logger.info('Backup uploaded to cloud', { key, size: fileStats.size });
    } catch (error) {
      logger.error('Failed to upload backup to cloud', { error: error.message });
      throw error;
    }
  }

  /**
   * Download backup from cloud storage
   */
  async downloadFromCloud(key, localPath) {
    if (!this.s3Client || !this.config.s3Bucket) {
      throw new Error('Cloud storage not configured');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key
      });

      const response = await this.s3Client.send(command);
      const fileStream = fs.createWriteStream(localPath);
      
      await new Promise((resolve, reject) => {
        response.Body.pipe(fileStream);
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });

      logger.info('Backup downloaded from cloud', { key, localPath });
      return localPath;
    } catch (error) {
      logger.error('Failed to download backup from cloud', { error: error.message });
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    const backups = [];

    // List local backups
    try {
      const files = fs.readdirSync(this.config.localBackupDir);
      for (const file of files) {
        const filepath = path.join(this.config.localBackupDir, file);
        const stats = fs.statSync(filepath);
        backups.push({
          filename: file,
          location: 'local',
          size: stats.size,
          created: stats.mtime,
          path: filepath
        });
      }
    } catch (error) {
      logger.error('Failed to list local backups', { error: error.message });
    }

    // List cloud backups
    if (this.s3Client && this.config.s3Bucket) {
      try {
        const command = new ListObjectsV2Command({
          Bucket: this.config.s3Bucket,
          Prefix: this.config.s3Prefix
        });

        const response = await this.s3Client.send(command);
        for (const object of response.Contents || []) {
          backups.push({
            filename: object.Key.split('/').pop(),
            location: 'cloud',
            size: object.Size,
            created: object.LastModified,
            key: object.Key
          });
        }
      } catch (error) {
        logger.error('Failed to list cloud backups', { error: error.message });
      }
    }

    return backups.sort((a, b) => b.created - a.created);
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupInfo) {
    const startTime = Date.now();
    let filepath;

    try {
      logger.info('Starting database restore', { backupInfo });

      // Download if cloud backup
      if (backupInfo.location === 'cloud') {
        const localPath = path.join(this.config.localBackupDir, backupInfo.filename);
        filepath = await this.downloadFromCloud(backupInfo.key, localPath);
      } else {
        filepath = backupInfo.path;
      }

      // Decrypt if encrypted
      if (filepath.endsWith('.enc')) {
        filepath = await this.decryptFile(filepath);
      }

      // Restore using psql
      const command = `psql ${process.env.DATABASE_URL} < ${filepath}`;
      execSync(command, { stdio: 'inherit' });

      const duration = Date.now() - startTime;
      logger.info('Database restore completed', { duration: duration + 'ms' });

      await this.sendNotification({
        type: 'restore_completed',
        filename: backupInfo.filename,
        duration
      });

      return { success: true, duration };
    } catch (error) {
      logger.error('Database restore failed', { error: error.message });
      
      await this.sendNotification({
        type: 'restore_failed',
        filename: backupInfo.filename,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Record backup metadata in database
   */
  async recordBackupMetadata(metadata) {
    try {
      await this.pool.query(`
        INSERT INTO backup_history (
          filename, type, size, duration, location, created_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [
        metadata.filename,
        metadata.type,
        metadata.size,
        metadata.duration,
        metadata.location
      ]);

      // Create backup_history table if it doesn't exist
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS backup_history (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          size BIGINT NOT NULL,
          duration INTEGER NOT NULL,
          location VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      logger.error('Failed to record backup metadata', { error: error.message });
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    logger.info('Starting backup cleanup', { cutoffDate: cutoffDate.toISOString() });

    try {
      const backups = await this.listBackups();
      let deletedCount = 0;

      for (const backup of backups) {
        if (new Date(backup.created) < cutoffDate) {
          try {
            // Delete local file
            if (backup.location === 'local' && fs.existsSync(backup.path)) {
              fs.unlinkSync(backup.path);
              deletedCount++;
            }

            // Delete from cloud
            if (backup.location === 'cloud' && this.s3Client) {
              const command = new DeleteObjectCommand({
                Bucket: this.config.s3Bucket,
                Key: backup.key
              });
              await this.s3Client.send(command);
              deletedCount++;
            }

            logger.info('Deleted old backup', { filename: backup.filename });
          } catch (error) {
            logger.error('Failed to delete backup', { 
              filename: backup.filename, 
              error: error.message 
            });
          }
        }
      }

      logger.info('Backup cleanup completed', { deletedCount });
    } catch (error) {
      logger.error('Backup cleanup failed', { error: error.message });
    }
  }

  /**
   * Send notification about backup operation
   */
  async sendNotification(data) {
    if (!this.config.enableNotification || !this.config.notificationWebhook) {
      return;
    }

    try {
      const axios = require('axios');
      await axios.post(this.config.notificationWebhook, data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      logger.debug('Notification sent', { type: data.type });
    } catch (error) {
      logger.error('Failed to send notification', { error: error.message });
    }
  }

  /**
   * Start automated backup schedule
   */
  startScheduledBackups() {
    if (this.isRunning) {
      logger.warn('Backup scheduler already running');
      return;
    }

    this.isRunning = true;

    // Perform initial backup
    this.performBackup();

    // Schedule regular backups
    this.backupTimer = setInterval(() => {
      this.performBackup();
    }, this.config.backupInterval);

    // Schedule cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldBackups();
    }, this.config.backupInterval * 2); // Run cleanup half as often

    logger.info('Automated backup scheduler started', {
      interval: this.config.backupInterval + 'ms',
      retention: this.config.retentionDays + 'days'
    });
  }

  /**
   * Perform backup (full or incremental based on schedule)
   */
  async performBackup() {
    try {
      // Determine if this should be a full backup
      const dayOfWeek = new Date().getDay();
      const shouldFullBackup = dayOfWeek === 0 && this.config.enableFullBackup; // Sunday

      if (shouldFullBackup) {
        await this.performFullBackup();
      } else if (this.config.enableIncrementalBackup) {
        await this.performIncrementalBackup();
      } else {
        await this.performFullBackup();
      }
    } catch (error) {
      logger.error('Scheduled backup failed', { error: error.message });
    }
  }

  /**
   * Stop automated backup schedule
   */
  stopScheduledBackups() {
    this.isRunning = false;

    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    logger.info('Automated backup scheduler stopped');
  }

  /**
   * Shutdown backup manager
   */
  async shutdown() {
    this.stopScheduledBackups();
    
    if (this.pool) {
      await this.pool.end();
    }

    logger.info('Backup manager shutdown complete');
  }
}

module.exports = BackupManager;
