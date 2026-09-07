/**
 * Database Management Routes
 * 
 * API endpoints for database management including:
 * - Database provisioning and management
 * - Cluster management
 * - Replication and sharding
 * - Backup and recovery
 * - Performance monitoring
 * - Query optimization
 * - Query caching
 */

const express = require('express');
const router = express.Router();
const databaseManagementService = require('../services/databaseManagementService');

/**
 * Provision database
 * POST /api/database-management/databases
 */
router.post('/databases', async (req, res) => {
  try {
    const { name, type, version, size, storage_type, username, password } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'name and type are required'
      });
    }
    
    const result = await databaseManagementService.provisionDatabase({
      name,
      type,
      version,
      size,
      storage_type,
      username,
      password
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error provisioning database:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all databases
 * GET /api/database-management/databases
 */
router.get('/databases', (req, res) => {
  try {
    const databases = databaseManagementService.getAllDatabases();
    
    res.json({
      success: true,
      databases: databases
    });
  } catch (error) {
    console.error('Error getting databases:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get database by ID
 * GET /api/database-management/databases/:dbId
 */
router.get('/databases/:dbId', (req, res) => {
  try {
    const { dbId } = req.params;
    const database = databaseManagementService.getDatabase(dbId);
    
    if (!database) {
      return res.status(404).json({
        success: false,
        error: `Database ${dbId} not found`
      });
    }
    
    res.json({
      success: true,
      database: database
    });
  } catch (error) {
    console.error('Error getting database:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get databases by type
 * GET /api/database-management/databases/type/:type
 */
router.get('/databases/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    const databases = databaseManagementService.getDatabasesByType(type);
    
    res.json({
      success: true,
      databases: databases
    });
  } catch (error) {
    console.error('Error getting databases by type:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update database
 * PUT /api/database-management/databases/:dbId
 */
router.put('/databases/:dbId', async (req, res) => {
  try {
    const { dbId } = req.params;
    const updates = req.body;
    
    const result = await databaseManagementService.updateDatabase(dbId, updates);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating database:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete database
 * DELETE /api/database-management/databases/:dbId
 */
router.delete('/databases/:dbId', async (req, res) => {
  try {
    const { dbId } = req.params;
    const result = await databaseManagementService.deleteDatabase(dbId);
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting database:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create cluster
 * POST /api/database-management/clusters
 */
router.post('/clusters', async (req, res) => {
  try {
    const { name, type, nodes, size } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'name and type are required'
      });
    }
    
    const result = await databaseManagementService.createCluster({
      name,
      type,
      nodes,
      size
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error creating cluster:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all clusters
 * GET /api/database-management/clusters
 */
router.get('/clusters', (req, res) => {
  try {
    const clusters = databaseManagementService.getAllClusters();
    
    res.json({
      success: true,
      clusters: clusters
    });
  } catch (error) {
    console.error('Error getting clusters:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get cluster by ID
 * GET /api/database-management/clusters/:clusterId
 */
router.get('/clusters/:clusterId', (req, res) => {
  try {
    const { clusterId } = req.params;
    const cluster = databaseManagementService.getCluster(clusterId);
    
    if (!cluster) {
      return res.status(404).json({
        success: false,
        error: `Cluster ${clusterId} not found`
      });
    }
    
    res.json({
      success: true,
      cluster: cluster
    });
  } catch (error) {
    console.error('Error getting cluster:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Setup replication
 * POST /api/database-management/replications
 */
router.post('/replications', async (req, res) => {
  try {
    const { name, primary_db, replica_dbs, mode } = req.body;
    
    if (!name || !primary_db) {
      return res.status(400).json({
        success: false,
        error: 'name and primary_db are required'
      });
    }
    
    const result = await databaseManagementService.setupReplication({
      name,
      primary_db,
      replica_dbs,
      mode
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error setting up replication:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all replications
 * GET /api/database-management/replications
 */
router.get('/replications', (req, res) => {
  try {
    const replications = databaseManagementService.getAllReplications();
    
    res.json({
      success: true,
      replications: replications
    });
  } catch (error) {
    console.error('Error getting replications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get replication by ID
 * GET /api/database-management/replications/:replicationId
 */
router.get('/replications/:replicationId', (req, res) => {
  try {
    const { replicationId } = req.params;
    const replication = databaseManagementService.getReplication(replicationId);
    
    if (!replication) {
      return res.status(404).json({
        success: false,
        error: `Replication ${replicationId} not found`
      });
    }
    
    res.json({
      success: true,
      replication: replication
    });
  } catch (error) {
    console.error('Error getting replication:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Setup sharding
 * POST /api/database-management/shards
 */
router.post('/shards', async (req, res) => {
  try {
    const { name, database, shard_key, shard_count } = req.body;
    
    if (!name || !database || !shard_key) {
      return res.status(400).json({
        success: false,
        error: 'name, database, and shard_key are required'
      });
    }
    
    const result = await databaseManagementService.setupSharding({
      name,
      database,
      shard_key,
      shard_count
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error setting up sharding:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all shards
 * GET /api/database-management/shards
 */
router.get('/shards', (req, res) => {
  try {
    const shards = databaseManagementService.getAllShards();
    
    res.json({
      success: true,
      shards: shards
    });
  } catch (error) {
    console.error('Error getting shards:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get shard by ID
 * GET /api/database-management/shards/:shardId
 */
router.get('/shards/:shardId', (req, res) => {
  try {
    const { shardId } = req.params;
    const shard = databaseManagementService.getShard(shardId);
    
    if (!shard) {
      return res.status(404).json({
        success: false,
        error: `Shard ${shardId} not found`
      });
    }
    
    res.json({
      success: true,
      shard: shard
    });
  } catch (error) {
    console.error('Error getting shard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create backup configuration
 * POST /api/database-management/backup-configs
 */
router.post('/backup-configs', (req, res) => {
  try {
    const { name, database, schedule, retention, backup_type, destination } = req.body;
    
    if (!name || !database) {
      return res.status(400).json({
        success: false,
        error: 'name and database are required'
      });
    }
    
    const result = databaseManagementService.createBackupConfig({
      name,
      database,
      schedule,
      retention,
      backup_type,
      destination
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error creating backup config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all backup configs
 * GET /api/database-management/backup-configs
 */
router.get('/backup-configs', (req, res) => {
  try {
    const configs = databaseManagementService.getAllBackupConfigs();
    
    res.json({
      success: true,
      backup_configs: configs
    });
  } catch (error) {
    console.error('Error getting backup configs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get backup config by ID
 * GET /api/database-management/backup-configs/:backupId
 */
router.get('/backup-configs/:backupId', (req, res) => {
  try {
    const { backupId } = req.params;
    const config = databaseManagementService.getBackupConfig(backupId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Backup config ${backupId} not found`
      });
    }
    
    res.json({
      success: true,
      backup_config: config
    });
  } catch (error) {
    console.error('Error getting backup config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute backup
 * POST /api/database-management/backup-configs/:backupId/execute
 */
router.post('/backup-configs/:backupId/execute', async (req, res) => {
  try {
    const { backupId } = req.params;
    const result = await databaseManagementService.executeBackup(backupId);
    
    res.json(result);
  } catch (error) {
    console.error('Error executing backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Restore database
 * POST /api/database-management/databases/:dbId/restore/:backupId
 */
router.post('/databases/:dbId/restore/:backupId', async (req, res) => {
  try {
    const { dbId, backupId } = req.params;
    const result = await databaseManagementService.restoreDatabase(dbId, backupId);
    
    res.json(result);
  } catch (error) {
    console.error('Error restoring database:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get database metrics
 * GET /api/database-management/databases/:dbId/metrics
 */
router.get('/databases/:dbId/metrics', (req, res) => {
  try {
    const { dbId } = req.params;
    const metrics = databaseManagementService.getDatabaseMetrics(dbId);
    
    res.json({
      success: true,
      metrics: metrics
    });
  } catch (error) {
    console.error('Error getting database metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all metrics
 * GET /api/database-management/metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = databaseManagementService.getAllMetrics();
    
    res.json({
      success: true,
      metrics: metrics
    });
  } catch (error) {
    console.error('Error getting all metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Optimize query
 * POST /api/database-management/query/optimize
 */
router.post('/query/optimize', (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query is required'
      });
    }
    
    const result = databaseManagementService.optimizeQuery(query);
    
    res.json(result);
  } catch (error) {
    console.error('Error optimizing query:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Cache query result
 * POST /api/database-management/query/cache
 */
router.post('/query/cache', (req, res) => {
  try {
    const { query, result, ttl } = req.body;
    
    if (!query || !result) {
      return res.status(400).json({
        success: false,
        error: 'query and result are required'
      });
    }
    
    databaseManagementService.cacheQuery(query, result, ttl);
    
    res.json({
      success: true,
      message: 'Query result cached successfully'
    });
  } catch (error) {
    console.error('Error caching query:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get cached query
 * POST /api/database-management/query/cache/get
 */
router.post('/query/cache/get', (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query is required'
      });
    }
    
    const result = databaseManagementService.getCachedQuery(query);
    
    res.json({
      success: true,
      cached: result !== null,
      result: result
    });
  } catch (error) {
    console.error('Error getting cached query:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clear query cache
 * DELETE /api/database-management/query/cache
 */
router.delete('/query/cache', (req, res) => {
  try {
    const result = databaseManagementService.clearQueryCache();
    
    res.json(result);
  } catch (error) {
    console.error('Error clearing query cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get database overview
 * GET /api/database-management/overview
 */
router.get('/overview', (req, res) => {
  try {
    const overview = databaseManagementService.getDatabaseOverview();
    
    res.json({
      success: true,
      overview: overview
    });
  } catch (error) {
    console.error('Error getting database overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check for Database Management service
 * GET /api/database-management/service-health
 */
router.get('/service-health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    databases_count: databaseManagementService.databases.size,
    clusters_count: databaseManagementService.clusters.size,
    replications_count: databaseManagementService.replications.size,
    shards_count: databaseManagementService.shards.size,
    backup_configs_count: databaseManagementService.backupConfigs.size,
    monitoring_data_count: databaseManagementService.metrics.size,
    query_cache_size: databaseManagementService.queryCache.size,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
