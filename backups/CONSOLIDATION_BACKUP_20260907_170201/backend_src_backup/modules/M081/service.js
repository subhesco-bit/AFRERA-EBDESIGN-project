/**
 * Data Visualization Dashboard Service (M081)
 * Business Intelligence & Analytics - Dashboard management and visualization
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create a new dashboard
 */
async function createDashboard(dashboardData) {
  try {
    const {
      user_id,
      dashboard_name,
      dashboard_type,
      description,
      layout_config,
      is_default,
      is_public
    } = dashboardData;

    const dashboard = {
      dashboard_id: generateId(),
      user_id,
      dashboard_name,
      dashboard_type,
      description,
      layout_config: layout_config || {},
      is_default: is_default || false,
      is_public: is_public || false,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered dashboard layout optimization
    const aiRequest = {
      task: 'dashboard_layout_optimization',
      parameters: {
        dashboard_type: dashboard_type,
        user_preferences: await getUserPreferences(user_id),
        similar_dashboards: await getSimilarDashboards(dashboard_type),
        best_practices: await getDashboardBestPractices(dashboard_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    dashboard.ai_recommendations = aiResponse;

    // Insert into database
    const result = await pool.query(
      `INSERT INTO dashboards 
       (dashboard_id, user_id, dashboard_name, dashboard_type, description, 
        layout_config, is_default, is_public, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        dashboard.dashboard_id,
        dashboard.user_id,
        dashboard.dashboard_name,
        dashboard.dashboard_type,
        dashboard.description,
        JSON.stringify(dashboard.layout_config),
        dashboard.is_default,
        dashboard.is_public,
        dashboard.status,
        dashboard.created_at
      ]
    );

    logger.info(`Dashboard created: ${dashboard.dashboard_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating dashboard', { error: error.message, stack: error.stack });
    throw new Error('Failed to create dashboard');
  }
}

/**
 * Get dashboard by ID
 */
async function getDashboard(dashboardId) {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboards WHERE dashboard_id = $1',
      [dashboardId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error getting dashboard', { error: error.message });
    throw new Error('Failed to get dashboard');
  }
}

/**
 * List dashboards for a user
 */
async function listDashboards(userId, filters = {}) {
  try {
    const { dashboard_type, status } = filters;
    let query = 'SELECT * FROM dashboards WHERE user_id = $1';
    const params = [userId];
    let paramCount = 1;

    if (dashboard_type) {
      paramCount++;
      query += ` AND dashboard_type = $${paramCount}`;
      params.push(dashboard_type);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error listing dashboards', { error: error.message });
    throw new Error('Failed to list dashboards');
  }
}

/**
 * Update dashboard
 */
async function updateDashboard(dashboardId, updateData) {
  try {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (key !== 'dashboard_id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return await getDashboard(dashboardId);
    }

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());
    paramCount++;

    values.push(dashboardId);

    const query = `UPDATE dashboards SET ${fields.join(', ')} WHERE dashboard_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    logger.info(`Dashboard updated: ${dashboardId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating dashboard', { error: error.message });
    throw new Error('Failed to update dashboard');
  }
}

/**
 * Delete dashboard
 */
async function deleteDashboard(dashboardId) {
  try {
    const result = await pool.query(
      'DELETE FROM dashboards WHERE dashboard_id = $1 RETURNING dashboard_id',
      [dashboardId]
    );

    logger.info(`Dashboard deleted: ${dashboardId}`);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error deleting dashboard', { error: error.message });
    throw new Error('Failed to delete dashboard');
  }
}

/**
 * Add widget to dashboard
 */
async function addWidget(dashboardId, widgetData) {
  try {
    const {
      widget_type,
      widget_name,
      position_x,
      position_y,
      width,
      height,
      data_source,
      query_config,
      visualization_config,
      refresh_interval
    } = widgetData;

    const widget = {
      widget_id: generateId(),
      dashboard_id: dashboardId,
      widget_type,
      widget_name,
      position_x,
      position_y,
      width,
      height,
      data_source,
      query_config: query_config || {},
      visualization_config: visualization_config || {},
      refresh_interval: refresh_interval || 300,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered widget configuration
    const aiRequest = {
      task: 'widget_configuration_optimization',
      parameters: {
        widget_type: widget_type,
        data_source: data_source,
        visualization_best_practices: await getVisualizationBestPractices(widget_type),
        data_characteristics: await analyzeDataCharacteristics(data_source)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    widget.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO dashboard_widgets 
       (widget_id, dashboard_id, widget_type, widget_name, position_x, position_y, 
        width, height, data_source, query_config, visualization_config, 
        refresh_interval, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        widget.widget_id,
        widget.dashboard_id,
        widget.widget_type,
        widget.widget_name,
        widget.position_x,
        widget.position_y,
        widget.width,
        widget.height,
        widget.data_source,
        JSON.stringify(widget.query_config),
        JSON.stringify(widget.visualization_config),
        widget.refresh_interval,
        widget.status,
        widget.created_at
      ]
    );

    logger.info(`Widget added: ${widget.widget_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding widget', { error: error.message });
    throw new Error('Failed to add widget');
  }
}

/**
 * Get widgets for dashboard
 */
async function getDashboardWidgets(dashboardId) {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboard_widgets WHERE dashboard_id = $1 AND status = $2 ORDER BY position_y, position_x',
      [dashboardId, 'active']
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting dashboard widgets', { error: error.message });
    throw new Error('Failed to get dashboard widgets');
  }
}

/**
 * Update widget
 */
async function updateWidget(widgetId, updateData) {
  try {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (key !== 'widget_id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return await getWidget(widgetId);
    }

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());
    paramCount++;

    values.push(widgetId);

    const query = `UPDATE dashboard_widgets SET ${fields.join(', ')} WHERE widget_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    logger.info(`Widget updated: ${widgetId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating widget', { error: error.message });
    throw new Error('Failed to update widget');
  }
}

/**
 * Delete widget
 */
async function deleteWidget(widgetId) {
  try {
    const result = await pool.query(
      'DELETE FROM dashboard_widgets WHERE widget_id = $1 RETURNING widget_id',
      [widgetId]
    );

    logger.info(`Widget deleted: ${widgetId}`);
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error deleting widget', { error: error.message });
    throw new Error('Failed to delete widget');
  }
}

/**
 * Add data source to dashboard
 */
async function addDataSource(dashboardId, sourceData) {
  try {
    const {
      source_name,
      source_type,
      connection_config,
      query_template,
      refresh_schedule
    } = sourceData;

    const result = await pool.query(
      `INSERT INTO dashboard_data_sources 
       (source_id, dashboard_id, source_name, source_type, connection_config, 
        query_template, refresh_schedule, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        generateId(),
        dashboardId,
        source_name,
        source_type,
        JSON.stringify(connection_config),
        query_template,
        refresh_schedule,
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`Data source added: ${result.rows[0].source_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding data source', { error: error.message });
    throw new Error('Failed to add data source');
  }
}

/**
 * Get dashboard data sources
 */
async function getDataSources(dashboardId) {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboard_data_sources WHERE dashboard_id = $1 AND status = $2',
      [dashboardId, 'active']
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting data sources', { error: error.message });
    throw new Error('Failed to get data sources');
  }
}

/**
 * Add filter to dashboard
 */
async function addFilter(dashboardId, filterData) {
  try {
    const {
      filter_name,
      filter_type,
      field_name,
      default_value,
      filter_config,
      applies_to_widgets
    } = filterData;

    const result = await pool.query(
      `INSERT INTO dashboard_filters 
       (filter_id, dashboard_id, filter_name, filter_type, field_name, 
        default_value, filter_config, applies_to_widgets, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        generateId(),
        dashboardId,
        filter_name,
        filter_type,
        field_name,
        JSON.stringify(default_value),
        JSON.stringify(filter_config),
        applies_to_widgets,
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`Filter added: ${result.rows[0].filter_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding filter', { error: error.message });
    throw new Error('Failed to add filter');
  }
}

/**
 * Get dashboard filters
 */
async function getDashboardFilters(dashboardId) {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboard_filters WHERE dashboard_id = $1 AND status = $2',
      [dashboardId, 'active']
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting dashboard filters', { error: error.message });
    throw new Error('Failed to get dashboard filters');
  }
}

/**
 * Create dashboard snapshot
 */
async function createSnapshot(dashboardId, snapshotData) {
  try {
    const { snapshot_name, filters_applied, created_by } = snapshotData;

    const dashboard = await getDashboard(dashboardId);
    const widgets = await getDashboardWidgets(dashboardId);

    const snapshot = {
      snapshot_id: generateId(),
      dashboard_id: dashboardId,
      snapshot_name,
      snapshot_data: {
        dashboard: dashboard,
        widgets: widgets
      },
      filters_applied: filters_applied || {},
      created_by,
      created_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO dashboard_snapshots 
       (snapshot_id, dashboard_id, snapshot_name, snapshot_data, filters_applied, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        snapshot.snapshot_id,
        snapshot.dashboard_id,
        snapshot.snapshot_name,
        JSON.stringify(snapshot.snapshot_data),
        JSON.stringify(snapshot.filters_applied),
        snapshot.created_by,
        snapshot.created_at
      ]
    );

    logger.info(`Snapshot created: ${snapshot.snapshot_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating snapshot', { error: error.message });
    throw new Error('Failed to create snapshot');
  }
}

/**
 * Share dashboard
 */
async function shareDashboard(dashboardId, shareData) {
  try {
    const { shared_with, shared_by, permission_level, expires_at } = shareData;

    const result = await pool.query(
      `INSERT INTO dashboard_shares 
       (share_id, dashboard_id, shared_with, shared_by, permission_level, expires_at, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        generateId(),
        dashboardId,
        shared_with,
        shared_by,
        permission_level || 'view',
        expires_at,
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`Dashboard shared: ${result.rows[0].share_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error sharing dashboard', { error: error.message });
    throw new Error('Failed to share dashboard');
  }
}

/**
 * Log dashboard usage
 */
async function logUsage(dashboardId, userId, action, metadata = {}) {
  try {
    await pool.query(
      `INSERT INTO dashboard_usage_logs 
       (dashboard_id, user_id, action, metadata, accessed_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [dashboardId, userId, action, JSON.stringify(metadata)]
    );
  } catch (error) {
    logger.error('Error logging usage', { error: error.message });
  }
}

/**
 * Get dashboard analytics
 */
async function getDashboardAnalytics(dashboardId) {
  try {
    const usageResult = await pool.query(
      `SELECT action, COUNT(*) as count, 
              MIN(accessed_at) as first_access, 
              MAX(accessed_at) as last_access
       FROM dashboard_usage_logs 
       WHERE dashboard_id = $1 
       GROUP BY action`,
      [dashboardId]
    );

    const userResult = await pool.query(
      `SELECT user_id, COUNT(*) as access_count
       FROM dashboard_usage_logs 
       WHERE dashboard_id = $1 
       GROUP BY user_id
       ORDER BY access_count DESC
       LIMIT 10`,
      [dashboardId]
    );

    return {
      usage_stats: usageResult.rows,
      top_users: userResult.rows
    };
  } catch (error) {
    logger.error('Error getting dashboard analytics', { error: error.message });
    throw new Error('Failed to get dashboard analytics');
  }
}

// Helper functions
function generateId() {
  return `DASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getUserPreferences(userId) {
  try {
    const result = await pool.query(
      'SELECT preferences FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    return result.rows[0]?.preferences || {};
  } catch (error) {
    return {};
  }
}

async function getSimilarDashboards(dashboardType) {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboards WHERE dashboard_type = $1 AND status = $2 LIMIT 5',
      [dashboardType, 'active']
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getDashboardBestPractices(dashboardType) {
  return {
    layout: 'grid',
    widget_density: 'medium',
    color_scheme: 'professional',
    recommended_widgets: ['chart', 'kpi', 'table', 'filter']
  };
}

async function getVisualizationBestPractices(widgetType) {
  const practices = {
    chart: { max_data_points: 1000, color_palette: 'categorical' },
    kpi: { format: 'number', show_trend: true },
    table: { pagination: true, sortable: true },
    map: { clustering: true, zoom_level: 5 }
  };
  return practices[widgetType] || {};
}

async function analyzeDataCharacteristics(dataSource) {
  return {
    data_type: 'time_series',
    volume: 'medium',
    update_frequency: 'real-time',
    cardinality: 'high'
  };
}

async function getWidget(widgetId) {
  try {
    const result = await pool.query(
      'SELECT * FROM dashboard_widgets WHERE widget_id = $1',
      [widgetId]
    );
    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  createDashboard,
  getDashboard,
  listDashboards,
  updateDashboard,
  deleteDashboard,
  addWidget,
  getDashboardWidgets,
  updateWidget,
  deleteWidget,
  addDataSource,
  getDataSources,
  addFilter,
  getDashboardFilters,
  createSnapshot,
  shareDashboard,
  logUsage,
  getDashboardAnalytics
};
