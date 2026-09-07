# Database Enhancements Documentation

## Overview

This directory contains production-ready database enhancements for the AFRERA platform. These enhancements provide enterprise-level features including advanced connection pooling, automated backups, monitoring, security, caching, transaction management, and query optimization.

## Architecture

```
src/database/
├── indexes/
│   └── comprehensive_indexes.sql    # Production-ready indexing strategy
├── migrations/
│   └── enhanced_migrate.js          # Enhanced migration system
├── backup/
│   └── backup_manager.js            # Automated backup and recovery
├── monitoring/
│   └── database_monitor.js          # Database monitoring and logging
├── security/
│   └── database_security.js         # Security enhancements
├── transactions/
│   └── transaction_manager.js       # Transaction management
├── cache/
│   └── redis_cache.js               # Redis caching layer
├── optimization/
│   └── query_optimizer.js           # Query optimization
├── advanced_pool.js                 # Advanced connection pooling
├── connection.js                    # Original connection management
├── pool.js                          # Original pool proxy
├── migrate.js                       # Original migration runner
├── schema.sql                       # Database schema
└── database_enhancements.js         # Integration module
```

## Components

### 1. Advanced Connection Pool (`advanced_pool.js`)

**Features:**
- Adaptive pool sizing based on utilization
- Health checks with configurable intervals
- Comprehensive metrics collection
- Automatic retry logic for failed queries
- Connection timeout management
- Graceful shutdown

**Configuration:**
```javascript
{
  min: 2,                          // Minimum pool size
  max: 20,                         // Maximum pool size
  idleTimeoutMillis: 30000,        // Idle connection timeout
  connectionTimeoutMillis: 2000,   // Connection timeout
  healthCheckInterval: 60000,      // Health check interval (1 min)
  enableAdaptiveSizing: true,      // Enable adaptive sizing
  enableMetrics: true              // Enable metrics collection
}
```

**Usage:**
```javascript
const { initializeConnectionPool } = require('./advanced_pool');

const pool = await initializeConnectionPool({
  max: 30,
  enableAdaptiveSizing: true
});

// Execute query with retry
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### 2. Enhanced Migration System (`migrations/enhanced_migrate.js`)

**Features:**
- Migration locking to prevent concurrent runs
- Checksum validation for integrity
- Dependency management
- Dry-run mode
- Rollback support
- Migration status tracking
- Automated repair heuristics

**CLI Commands:**
```bash
# Run pending migrations
node src/database/migrations/enhanced_migrate.js up

# Rollback last migration
node src/database/migrations/enhanced_migrate.js down

# Check migration status
node src/database/migrations/enhanced_migrate.js status

# Create new migration
node src/database/migrations/enhanced_migrate.js create add_user_preferences

# Dry run
node src/database/migrations/enhanced_migrate.js up --dry-run

# Force execution (ignore warnings)
node src/database/migrations/enhanced_migrate.js up --force
```

**Migration File Format:**
```sql
-- Migration: add_user_preferences
-- Description: Add user preferences table
-- Version: 1.0.0
-- Created: 2024-01-01T00:00:00Z
-- @depends: add_users_table
-- @description: Add user preferences table for storing user settings

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- For rollback, create: rollback_2024-01-01-00-00-00-000_add_user_preferences.sql
```

### 3. Backup Manager (`backup/backup_manager.js`)

**Features:**
- Automated scheduled backups
- Full and incremental backups
- Cloud storage (S3) support
- Encryption (AES-256-GCM)
- Compression
- Retention policy management
- Restore functionality
- Backup metadata tracking

**Configuration:**
```javascript
{
  backupInterval: 86400000,           // 24 hours
  retentionDays: 30,                 // Retain for 30 days
  enableFullBackup: true,            // Enable full backups
  enableIncrementalBackup: true,     // Enable incremental backups
  fullBackupInterval: 7,             // Full backup every 7 days
  enableCloudStorage: true,          // Enable S3 storage
  enableEncryption: true,            // Enable encryption
  enableCompression: true             // Enable compression
}
```

**Usage:**
```javascript
const BackupManager = require('./backup/backup_manager');

const backupManager = new BackupManager({
  s3Bucket: 'my-backup-bucket',
  retentionDays: 30
});

await backupManager.initialize();

// Start scheduled backups
backupManager.startScheduledBackups();

// Manual backup
const result = await backupManager.performFullBackup();

// Restore from backup
const backups = await backupManager.listBackups();
await backupManager.restoreFromBackup(backups[0]);
```

### 4. Database Monitor (`monitoring/database_monitor.js`)

**Features:**
- Query execution tracking
- Slow query detection and logging
- Error tracking and analysis
- Connection pool monitoring
- Performance metrics collection
- Alerting with configurable thresholds
- Query statistics from pg_stat_statements
- Event-driven architecture

**Configuration:**
```javascript
{
  enableQueryLogging: true,
  enableSlowQueryTracking: true,
  slowQueryThreshold: 1000,          // 1 second
  enableErrorTracking: true,
  enableMetrics: true,
  metricsInterval: 60000,            // 1 minute
  enableAlerting: true,
  alertThresholds: {
    slowQueryRate: 0.1,             // 10%
    errorRate: 0.05,                // 5%
    connectionPoolUtilization: 0.9   // 90%
  }
}
```

**Usage:**
```javascript
const { getDatabaseMonitor } = require('./monitoring/database_monitor');

const monitor = getDatabaseMonitor();
await monitor.initialize();
monitor.startMonitoring();

// Log query execution
monitor.logQuery(queryText, executionTime, success, error, { userId, sessionId });

// Get metrics
const metrics = monitor.getMetrics();

// Get slow queries
const slowQueries = await monitor.getSlowQueries(20);

// Get error statistics
const errorStats = await monitor.getErrorStatistics();

// Listen to events
monitor.on('slowQuery', (data) => {
  console.log('Slow query detected:', data);
});

monitor.on('alert', (alert) => {
  console.log('Alert triggered:', alert);
});
```

### 5. Database Security (`security/database_security.js`)

**Features:**
- Column-level encryption (AES-256-GCM)
- Row-level security (RLS)
- SQL injection detection
- Rate limiting
- IP whitelisting
- Data masking
- Audit logging
- Access control
- Security event tracking

**Configuration:**
```javascript
{
  enableColumnEncryption: true,
  encryptionKey: process.env.DB_ENCRYPTION_KEY,
  enableRowLevelSecurity: true,
  enableAuditLogging: true,
  enableSqlInjectionProtection: true,
  enableRateLimiting: true,
  maxQueriesPerMinute: 1000,
  enableDataMasking: true,
  requireSSL: true
}
```

**Usage:**
```javascript
const { getDatabaseSecurity } = require('./security/database_security');

const security = getDatabaseSecurity();
await security.initialize();

// Encrypt sensitive data
const encrypted = security.encrypt('sensitive-data');

// Decrypt data
const decrypted = security.decrypt(encrypted);

// Validate query
const validation = security.validateQuery(query, userId, ipAddress);

// Set user context for RLS
await security.setUserContext(userId, userRole);

// Log audit event
await security.logAuditEvent({
  operation: 'UPDATE',
  tableName: 'users',
  recordId: userId,
  oldValues: { status: 'active' },
  newValues: { status: 'inactive' },
  userId,
  ipAddress
});

// Get security statistics
const stats = await security.getSecurityStatistics();
```

### 6. Transaction Manager (`transactions/transaction_manager.js`)

**Features:**
- Multiple isolation levels
- Automatic retry logic
- Savepoint support
- Distributed transactions (two-phase commit)
- Transaction timeout management
- Stale transaction cleanup
- Read-only transactions
- Serializable transactions

**Configuration:**
```javascript
{
  defaultIsolationLevel: 'READ COMMITTED',
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  retryableErrors: ['40001', '40P01', '08006'],
  statementTimeout: 30000,
  enableSavepoints: true
}
```

**Usage:**
```javascript
const { getTransactionManager } = require('./transactions/transaction_manager');

const txManager = getTransactionManager();
await txManager.initialize();

// Begin transaction
const transaction = await txManager.beginTransaction({
  isolationLevel: 'SERIALIZABLE'
});

// Execute queries
await transaction.execute('INSERT INTO orders (user_id, total) VALUES ($1, $2)', [userId, total]);

// Create savepoint
await transaction.createSavepoint('before_payment');

// Rollback to savepoint
await transaction.rollbackToSavepoint('before_payment');

// Commit
await transaction.commit();

// Or rollback
await transaction.rollback();

// Execute with automatic retry
const result = await txManager.executeInTransactionWithRetry(async (tx) => {
  await tx.execute('UPDATE inventory SET quantity = quantity - $1', [quantity]);
  await tx.execute('INSERT INTO orders (user_id, total) VALUES ($1, $2)', [userId, total]);
  return { success: true };
});

// Execute read-only transaction
const data = await txManager.executeReadOnlyTransaction(async (tx) => {
  const result = await tx.execute('SELECT * FROM products WHERE id = $1', [productId]);
  return result.rows[0];
});
```

### 7. Redis Cache (`cache/redis_cache.js`)

**Features:**
- Automatic cache key generation
- TTL management
- Cache-aside pattern
- Multi-get/multi-set operations
- Pattern-based invalidation
- Cache warming
- Statistics tracking
- Compression and serialization

**Configuration:**
```javascript
{
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  defaultTTL: 3600,                  // 1 hour
  enableCacheWarming: true,
  enableAutomaticInvalidation: true,
  keyPrefix: 'afrera:',
  maxMemory: '256mb',
  maxMemoryPolicy: 'allkeys-lru',
  enableCompression: true
}
```

**Usage:**
```javascript
const { getRedisCache } = require('./cache/redis_cache');

const cache = getRedisCache();
await cache.initialize();

// Get or set (cache-aside)
const data = await cache.getOrSet(
  'SELECT * FROM users WHERE id = $1',
  [userId],
  async () => {
    return await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  },
  3600  // TTL in seconds
);

// Manual set
await cache.set(query, params, data, ttl);

// Manual get
const cached = await cache.get(query, params);

// Invalidate by pattern
await cache.invalidatePattern('table:users:*');

// Invalidate by table
await cache.invalidateTable('users');

// Invalidate by entity
await cache.invalidateEntity('user', userId);

// Multi-get
const results = await cache.multiGet([
  { query: 'SELECT * FROM users WHERE id = $1', params: [userId1] },
  { query: 'SELECT * FROM users WHERE id = $1', params: [userId2] }
]);

// Cache warming
await cache.warmCache([
  { query: 'SELECT * FROM products WHERE featured = true', params: [], callback: () => db.query(...), ttl: 3600 }
]);

// Get statistics
const stats = cache.getStatistics();
console.log('Hit rate:', stats.hitRate);
```

### 8. Query Optimizer (`optimization/query_optimizer.js`)

**Features:**
- Automatic query rewriting
- Query performance analysis
- Execution plan analysis
- Slow query detection
- Missing index suggestions
- Unused index detection
- Table statistics analysis
- N+1 query pattern detection

**Configuration:**
```javascript
{
  enableQueryRewriting: true,
  enableQueryHints: true,
  enablePerformanceAnalysis: true,
  slowQueryThreshold: 1000,
  enableSelectStarOptimization: true,
  enableJoinOptimization: true,
  enableWhereOptimization: true
}
```

**Usage:**
```javascript
const { getQueryOptimizer } = require('./optimization/query_optimizer');

const optimizer = getQueryOptimizer();
await optimizer.initialize();

// Optimize query
const optimization = await optimizer.optimizeQuery('SELECT * FROM users WHERE email = $1', [email]);
console.log('Optimized:', optimization.optimized);
console.log('Suggestions:', optimization.suggestions);

// Analyze performance
const performance = await optimizer.analyzePerformance('SELECT * FROM orders WHERE user_id = $1', [userId]);
console.log('Duration:', performance.duration);
console.log('Plan:', performance.analysis);

// Get slow queries
const slowQueries = await optimizer.getSlowQueries(20);

// Get missing index suggestions
const missingIndexes = await optimizer.getMissingIndexSuggestions();

// Get unused indexes
const unusedIndexes = await optimizer.getUnusedIndexes();

// Analyze table
await optimizer.analyzeTable('users');

// Vacuum table
await optimizer.vacuumTable('users', { full: true, analyze: true });

// Reindex table
await optimizer.reindexTable('users');

// Get table bloat
const bloat = await optimizer.getTableBloat();
```

### 9. Integration Module (`database_enhancements.js`)

The integration module provides a unified interface to all database enhancements.

**Usage:**
```javascript
const { initializeDatabaseEnhancements, getDatabaseEnhancements } = require('./database_enhancements');

// Initialize all enhancements
await initializeDatabaseEnhancements({
  enableAdvancedPooling: true,
  enableCaching: true,
  enableTransactions: true,
  enableMonitoring: true,
  enableSecurity: true,
  enableBackup: true,
  enableOptimization: true,
  environment: 'production'
});

// Get the instance
const enhancements = getDatabaseEnhancements();

// Execute query with all enhancements
const result = await enhancements.executeQuery(
  'SELECT * FROM users WHERE id = $1',
  [userId],
  {
    userId: userId,
    ipAddress: req.ip,
    useCache: true,
    cacheTTL: 3600
  }
);

// Execute transaction
const txResult = await enhancements.executeTransaction(async (tx) => {
  await tx.execute('UPDATE inventory SET quantity = quantity - $1', [quantity]);
  await tx.execute('INSERT INTO orders (user_id, total) VALUES ($1, $2)', [userId, total]);
  return { success: true };
}, {
  isolationLevel: 'SERIALIZABLE',
  userId: userId,
  userRole: 'user'
});

// Get health status
const health = await enhancements.getHealthStatus();
console.log('Healthy:', health.healthy);

// Get metrics
const metrics = await enhancements.getMetrics();

// Run maintenance
await enhancements.runMaintenance();

// Shutdown
await enhancements.shutdown();
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/afrera_db
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=afrera_db
PG_USER=postgres
PG_PASSWORD=your_password
PG_SSL=true
PG_SSL_STRICT=false

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# AWS S3 (for backups)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=afrera-backups

# Security
DB_ENCRYPTION_KEY=your_encryption_key_at_least_32_chars

# Monitoring
DB_ALERT_WEBHOOK=https://your-webhook-url.com/alerts

# Backup
BACKUP_ENCRYPTION_KEY=your_backup_encryption_key
BACKUP_NOTIFICATION_WEBHOOK=https://your-webhook-url.com/backups
```

## Indexing Strategy

Run the comprehensive indexing SQL file to add production-ready indexes:

```bash
psql $DATABASE_URL -f src/database/indexes/comprehensive_indexes.sql
```

The indexing strategy includes:
- Composite indexes for common query patterns
- Partial indexes for frequently filtered data
- Expression indexes for computed queries
- Covering indexes for frequently accessed columns
- BRIN indexes for time-series data
- Hash indexes for equality lookups
- Unique indexes for data integrity

## Migration Guide

### From Original System

1. **Backup existing database:**
   ```bash
   pg_dump $DATABASE_URL > backup_before_migration.sql
   ```

2. **Run comprehensive indexes:**
   ```bash
   psql $DATABASE_URL -f src/database/indexes/comprehensive_indexes.sql
   ```

3. **Update application code:**
   ```javascript
   // Replace existing connection initialization
   const { initializeDatabaseEnhancements } = require('./src/database/database_enhancements');
   
   await initializeDatabaseEnhancements({
     environment: process.env.NODE_ENV || 'development'
   });
   ```

4. **Test in development:**
   - Run all existing tests
   - Verify query performance
   - Check monitoring metrics
   - Test backup/restore

5. **Deploy to production:**
   - Enable all enhancements
   - Monitor health status
   - Review security logs
   - Verify backup schedules

## Maintenance Tasks

### Regular Maintenance (Daily)
- Monitor database health status
- Review slow query logs
- Check error rates
- Verify backup completion

### Weekly Maintenance
- Analyze table statistics
- Review index usage
- Check cache hit rates
- Review security events

### Monthly Maintenance
- Vacuum and analyze tables
- Review and optimize indexes
- Clean up old logs
- Review retention policies
- Update statistics

## Troubleshooting

### Connection Pool Issues
```javascript
// Check pool metrics
const pool = enhancements.getPool();
const metrics = pool.getMetrics();
console.log('Pool metrics:', metrics);

// Check health status
const health = await pool.getHealthStatus();
```

### Cache Issues
```javascript
// Check cache statistics
const cache = enhancements.getCache();
const stats = cache.getStatistics();
console.log('Cache stats:', stats);

// Flush cache if needed
await cache.flush();
```

### Slow Queries
```javascript
// Get slow queries
const optimizer = enhancements.getOptimizer();
const slowQueries = await optimizer.getSlowQueries(20);
console.log('Slow queries:', slowQueries);

// Analyze specific query
const analysis = await optimizer.analyzePerformance(query);
console.log('Performance analysis:', analysis);
```

### Backup Issues
```javascript
// List available backups
const backupManager = enhancements.getBackupManager();
const backups = await backupManager.listBackups();
console.log('Available backups:', backups);

// Check backup logs
// Logs are stored in backup_history table
```

## Performance Tuning

### Connection Pool Tuning
- Adjust `min` and `max` based on application load
- Monitor pool utilization metrics
- Enable adaptive sizing for dynamic adjustment

### Cache Tuning
- Adjust TTL based on data volatility
- Monitor cache hit rates
- Implement cache warming for frequently accessed data

### Query Optimization
- Review slow query logs regularly
- Add missing indexes based on optimizer suggestions
- Remove unused indexes to reduce write overhead

## Security Best Practices

1. **Always use SSL** for database connections in production
2. **Rotate encryption keys** regularly
3. **Review audit logs** for suspicious activity
4. **Implement IP whitelisting** for database access
5. **Use row-level security** for multi-tenant data
6. **Mask sensitive data** in logs and monitoring
7. **Enable rate limiting** to prevent abuse
8. **Regular security audits** of database access

## Monitoring Dashboard

Key metrics to monitor:

- **Connection Pool**: Utilization, wait time, active connections
- **Cache**: Hit rate, memory usage, key count
- **Queries**: Total queries, slow queries, error rate
- **Transactions**: Active transactions, rollback rate
- **Security**: Failed authentication attempts, SQL injection attempts
- **Backups**: Last backup time, backup size, restore success rate

## Support

For issues or questions:
1. Check the logs in the respective component directories
2. Review the health status using `getHealthStatus()`
3. Check metrics using `getMetrics()`
4. Review the troubleshooting section above

## License

Proprietary - Ethnoverde Dynamics Pvt. Ltd.
