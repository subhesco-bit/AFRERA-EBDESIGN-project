/**
 * Backup and Disaster Recovery Service
 * 
 * Provides automated database backups, recovery, and disaster recovery
 * capabilities for production-ready data protection
 */

const { logger } = require('../utils/logger');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.backupSchedule = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // Daily at 2 AM
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
    this.backupTask = null;
    this.isBackupEnabled = process.env.BACKUP_ENABLED === 'true';
  }

  async initialize() {
    try {
      // Create backup directory if it doesn't exist
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Create subdirectories for different backup types
      await fs.mkdir(path.join(this.backupDir, 'database'), { recursive: true });
      await fs.mkdir(path.join(this.backupDir, 'uploads'), { recursive: true });
      await fs.mkdir(path.join(this.backupDir, 'logs'), { recursive: true });

      logger.info('Backup service initialized', { backupDir: this.backupDir });

      // Schedule automated backups if enabled
      if (this.isBackupEnabled) {
        this.scheduleBackups();
      }

      return true;
    } catch (error) {
      logger.error('Failed to initialize backup service', { error: error.message });
      return false;
    }
  }

  scheduleBackups() {
    try {
      // Schedule daily database backups
      this.backupTask = cron.schedule(this.backupSchedule, async () => {
        logger.info('Starting scheduled backup');
        await this.performFullBackup();
      });

      logger.info('Backup schedule configured', { schedule: this.backupSchedule });
    } catch (error) {
      logger.error('Failed to schedule backups', { error: error.message });
    }
  }

  async performFullBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `afrera-full-backup-${timestamp}.sql`;
      const backupPath = path.join(this.backupDir, 'database', backupFileName);

      // Get database connection details from environment
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Parse database URL
      const dbMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!dbMatch) {
        throw new Error('Invalid DATABASE_URL format');
      }

      const [, user, password, host, port, database] = dbMatch;

      // Use pg_dump to create backup
      const dumpCommand = `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F c -f ${backupPath}`;

      await new Promise((resolve, reject) => {
        exec(dumpCommand, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });

      // Compress the backup file
      await this.compressBackup(backupPath);

      // Clean up old backups
      await this.cleanOldBackups();

      logger.info('Full backup completed', { backupPath });
      
      return {
        success: true,
        backupPath,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Full backup failed', { error: error.message });
      throw error;
    }
  }

  async compressBackup(filePath) {
    try {
      const gzip = require('zlib').createGzip();
      const input = await fs.readFile(filePath);
      const compressed = await new Promise((resolve, reject) => {
        const chunks = [];
        gzip.on('data', chunk => chunks.push(chunk));
        gzip.on('end', () => resolve(Buffer.concat(chunks)));
        gzip.on('error', reject);
        gzip.end(input);
      });

      const compressedPath = `${filePath}.gz`;
      await fs.writeFile(compressedPath, compressed);
      
      // Delete uncompressed file
      await fs.unlink(filePath);

      logger.info('Backup compressed', { originalPath: filePath, compressedPath });
      return compressedPath;
    } catch (error) {
      logger.error('Backup compression failed', { error: error.message });
      throw error;
    }
  }

  async cleanOldBackups() {
    try {
      const databaseDir = path.join(this.backupDir, 'database');
      const files = await fs.readdir(databaseDir);
      const now = Date.now();
      const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(databaseDir, file);
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtime.getTime();

        if (fileAge > retentionMs) {
          await fs.unlink(filePath);
          logger.info('Deleted old backup', { file, ageDays: Math.floor(fileAge / (24 * 60 * 60 * 1000)) });
        }
      }

      logger.info('Old backups cleaned', { retentionDays: this.retentionDays });
    } catch (error) {
      logger.error('Failed to clean old backups', { error: error.message });
    }
  }

  async restoreBackup(backupFile) {
    try {
      const backupPath = path.join(this.backupDir, 'database', backupFile);
      
      // Check if backup file exists
      try {
        await fs.access(backupPath);
      } catch {
        throw new Error('Backup file not found');
      }

      // Get database connection details
      const dbUrl = process.env.DATABASE_URL;
      const dbMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!dbMatch) {
        throw new Error('Invalid DATABASE_URL format');
      }

      const [, user, password, host, port, database] = dbMatch;

      // Decompress if needed
      let restorePath = backupPath;
      if (backupFile.endsWith('.gz')) {
        restorePath = await this.decompressBackup(backupPath);
      }

      // Use pg_restore to restore backup
      const restoreCommand = `PGPASSWORD=${password} pg_restore -h ${host} -p ${port} -U ${user} -d ${database} -c ${restorePath}`;

      await new Promise((resolve, reject) => {
        exec(restoreCommand, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });

      // Clean up decompressed file if it was created
      if (backupFile.endsWith('.gz') && restorePath !== backupPath) {
        await fs.unlink(restorePath);
      }

      logger.info('Backup restored successfully', { backupFile });

      return {
        success: true,
        backupFile,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Backup restore failed', { error: error.message, backupFile });
      throw error;
    }
  }

  async decompressBackup(compressedPath) {
    try {
      const gunzip = require('zlib').createGunzip();
      const input = await fs.readFile(compressedPath);
      const decompressed = await new Promise((resolve, reject) => {
        const chunks = [];
        gunzip.on('data', chunk => chunks.push(chunk));
        gunzip.on('end', () => resolve(Buffer.concat(chunks)));
        gunzip.on('error', reject);
        gunzip.end(input);
      });

      const decompressedPath = compressedPath.replace('.gz', '');
      await fs.writeFile(decompressedPath, decompressed);

      return decompressedPath;
    } catch (error) {
      logger.error('Backup decompression failed', { error: error.message });
      throw error;
    }
  }

  async listBackups() {
    try {
      const databaseDir = path.join(this.backupDir, 'database');
      const files = await fs.readdir(databaseDir);
      
      const backups = [];
      for (const file of files) {
        const filePath = path.join(databaseDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          filename: file,
          size: stats.size,
          created: stats.mtime,
          compressed: file.endsWith('.gz')
        });
      }

      // Sort by creation date, newest first
      backups.sort((a, b) => b.created - a.created);

      return backups;
    } catch (error) {
      logger.error('Failed to list backups', { error: error.message });
      throw error;
    }
  }

  async backupUploads() {
    try {
      const uploadsDir = process.env.UPLOAD_DIR || './uploads';
      const backupUploadsDir = path.join(this.backupDir, 'uploads');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Create timestamped backup directory
      const backupPath = path.join(backupUploadsDir, `uploads-backup-${timestamp}`);
      await fs.mkdir(backupPath, { recursive: true });

      // Copy uploads directory
      await this.copyDirectory(uploadsDir, backupPath);

      logger.info('Uploads backup completed', { backupPath });

      return {
        success: true,
        backupPath,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Uploads backup failed', { error: error.message });
      throw error;
    }
  }

  async copyDirectory(source, destination) {
    await fs.mkdir(destination, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  getBackupStatus() {
    return {
      isBackupEnabled: this.isBackupEnabled,
      backupSchedule: this.backupSchedule,
      retentionDays: this.retentionDays,
      backupDir: this.backupDir,
      isScheduled: !!this.backupTask
    };
  }

  stopScheduledBackups() {
    if (this.backupTask) {
      this.backupTask.stop();
      this.backupTask = null;
      logger.info('Scheduled backups stopped');
    }
  }
}

// Export singleton instance
const backupService = new BackupService();

module.exports = backupService;
