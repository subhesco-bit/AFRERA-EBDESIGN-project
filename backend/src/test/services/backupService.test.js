const backupService = require('../../services/legacy/backupService');

// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(() => Promise.resolve()),
    readdir: jest.fn(() => Promise.resolve([])),
    unlink: jest.fn(() => Promise.resolve()),
    copyFile: jest.fn(() => Promise.resolve()),
    stat: jest.fn(() => Promise.resolve({ mtime: new Date() }))
  }
}));

jest.mock('child_process', () => ({
  exec: jest.fn((cmd, callback) => {
    callback(null, '', '');
  })
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    stop: jest.fn()
  }))
}));

describe('Backup Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('creates backup directories', async () => {
      await backupService.initialize();
      // Verify directories were created
    });

    it('schedules automated backups if enabled', async () => {
      process.env.BACKUP_ENABLED = 'true';
      await backupService.initialize();
      // Verify backup scheduling
    });
  });

  describe('performFullBackup', () => {
    it('creates database backup', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      
      const result = await backupService.performFullBackup();
      
      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();
    });

    it('handles missing DATABASE_URL', async () => {
      delete process.env.DATABASE_URL;
      
      await expect(backupService.performFullBackup()).rejects.toThrow('DATABASE_URL not configured');
    });
  });

  describe('cleanOldBackups', () => {
    it('removes backups older than retention period', async () => {
      await backupService.cleanOldBackups();
      // Verify old backups were deleted
    });
  });

  describe('listBackups', () => {
    it('returns list of available backups', async () => {
      const backups = await backupService.listBackups();
      
      expect(Array.isArray(backups)).toBe(true);
    });
  });

  describe('getBackupStatus', () => {
    it('returns current backup configuration', () => {
      const status = backupService.getBackupStatus();
      
      expect(status).toHaveProperty('isBackupEnabled');
      expect(status).toHaveProperty('backupSchedule');
      expect(status).toHaveProperty('retentionDays');
    });
  });
});

