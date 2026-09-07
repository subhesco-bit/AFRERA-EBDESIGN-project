/**
 * Controller for Data Visualization Dashboard (M081)
 * Handles HTTP requests for dashboard operations
 */

const dashboardService = require('./service');

const createDashboard = async (req, res) => {
  try {
    const dashboard = await dashboardService.createDashboard(req.body);
    res.status(201).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const dashboard = await dashboardService.getDashboard(req.params.id);
    if (!dashboard) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const listDashboards = async (req, res) => {
  try {
    const dashboards = await dashboardService.listDashboards(req.query.user_id, req.query);
    res.status(200).json({ success: true, data: dashboards });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateDashboard = async (req, res) => {
  try {
    const dashboard = await dashboardService.updateDashboard(req.params.id, req.body);
    if (!dashboard) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteDashboard = async (req, res) => {
  try {
    const dashboard = await dashboardService.deleteDashboard(req.params.id);
    if (!dashboard) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }
    res.status(200).json({ success: true, message: 'Dashboard deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addWidget = async (req, res) => {
  try {
    const widget = await dashboardService.addWidget(req.params.id, req.body);
    res.status(201).json({ success: true, data: widget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDashboardWidgets = async (req, res) => {
  try {
    const widgets = await dashboardService.getDashboardWidgets(req.params.id);
    res.status(200).json({ success: true, data: widgets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateWidget = async (req, res) => {
  try {
    const widget = await dashboardService.updateWidget(req.params.widgetId, req.body);
    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' });
    }
    res.status(200).json({ success: true, data: widget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteWidget = async (req, res) => {
  try {
    const widget = await dashboardService.deleteWidget(req.params.widgetId);
    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' });
    }
    res.status(200).json({ success: true, message: 'Widget deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addDataSource = async (req, res) => {
  try {
    const dataSource = await dashboardService.addDataSource(req.params.id, req.body);
    res.status(201).json({ success: true, data: dataSource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDataSources = async (req, res) => {
  try {
    const dataSources = await dashboardService.getDataSources(req.params.id);
    res.status(200).json({ success: true, data: dataSources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addFilter = async (req, res) => {
  try {
    const filter = await dashboardService.addFilter(req.params.id, req.body);
    res.status(201).json({ success: true, data: filter });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDashboardFilters = async (req, res) => {
  try {
    const filters = await dashboardService.getDashboardFilters(req.params.id);
    res.status(200).json({ success: true, data: filters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createSnapshot = async (req, res) => {
  try {
    const snapshot = await dashboardService.createSnapshot(req.params.id, req.body);
    res.status(201).json({ success: true, data: snapshot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const shareDashboard = async (req, res) => {
  try {
    const share = await dashboardService.shareDashboard(req.params.id, req.body);
    res.status(201).json({ success: true, data: share });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDashboardAnalytics = async (req, res) => {
  try {
    const analytics = await dashboardService.getDashboardAnalytics(req.params.id);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

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
  getDashboardAnalytics
};
