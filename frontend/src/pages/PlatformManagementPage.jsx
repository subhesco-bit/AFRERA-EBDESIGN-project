/**
 * Platform Management Page
 * Comprehensive platform administration with AI-powered insights
 * M001 Platform Core Module Frontend
 */

import React, { useState, useEffect } from 'react';
import Dashboard from '../components/ui/Dashboard';
import AIInsightsPanel from '../components/ui/AIInsightsPanel';
import { Card, Button, Select, SearchInput, DataTable, Modal, Tabs } from '../components/ui/common';
import { aiBackboneAPI, platformTelemetryAPI } from '../services/api';

const PlatformManagementPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [platformStatus, setPlatformStatus] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);

  useEffect(() => {
    loadPlatformData();
    loadAIInsights();
  }, []);

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      // Mock API calls - replace with actual API calls
      const status = await fetchPlatformStatus();
      const analytics = await fetchPlatformAnalytics();

      setPlatformStatus(status);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error loading platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIInsights = async () => {
    // Real AI backbone provider status (backend/src/services/aiBackboneService.js) —
    // this used to be a hardcoded array including a fabricated "Memory Leak
    // Detected, 92% confidence" alarm with no telemetry behind it, which is
    // actively misleading on an admin dashboard, not just a placeholder.
    // Every insight below is derived from a real status response; there is
    // no `confidence` field unless it is one this session actually computed.
    try {
      const res = await aiBackboneAPI.getAIProviderStatus();
      const status = res.data?.data;
      const insights = [];
      const now = new Date().toISOString();

      const configuredCount = status?.availableProviders?.length || 0;
      if (configuredCount === 0) {
        insights.push({
          id: 'ai-backbone-unconfigured',
          title: 'No AI provider configured',
          description: 'The AI backbone (Claude, ChatGPT, Gemini, Azure OpenAI, Hugging Face) has no provider API key set, so AI-assisted features that depend on it will fail.',
          severity: 'warning',
          recommendations: [
            'Set at least one provider key in backend/.env (see backend/.env.example)',
            'Restart the backend after setting the key',
          ],
          timestamp: now,
        });
      } else {
        const stats = status.statistics;
        insights.push({
          id: 'ai-backbone-status',
          title: `${configuredCount} AI provider${configuredCount === 1 ? '' : 's'} configured`,
          description: `${status.availableProviders.join(', ')} ready to serve requests via /api/v1/ai-backbone.`,
          severity: 'success',
          data: {
            total_requests_this_session: stats?.totalRequests ?? 0,
            successful: stats?.successfulRequests ?? 0,
            failed: stats?.failedRequests ?? 0,
          },
          timestamp: now,
        });

        Object.entries(stats?.providerStats || {}).forEach(([name, s]) => {
          if (s.total > 0 && s.failed / s.total > 0.5) {
            insights.push({
              id: `ai-backbone-failures-${name}`,
              title: `${name} is failing most requests`,
              description: `${s.failed} of ${s.total} requests to ${name} failed this session — check the API key and quota.`,
              severity: 'critical',
              data: { total: s.total, failed: s.failed, succeeded: s.success },
              timestamp: now,
            });
          }
        });
      }

      setAiInsights(insights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      setAiInsights([]);
    }
  };

  // Real system/business metrics (backend/src/services/platformTelemetryService.js).
  // This used to be a hardcoded mock object claiming 15,420 users and a 1.25M
  // request count that never happened. There is no request-logging/APM store
  // anywhere in this codebase, so total_requests/error_rate/growth trends and
  // per-service latency are honestly absent below rather than invented.
  const fetchPlatformStatus = async () => {
    const res = await platformTelemetryAPI.getStatus();
    return res.data?.data;
  };

  const fetchPlatformAnalytics = async () => {
    const res = await platformTelemetryAPI.getAnalytics();
    return res.data?.data;
  };

  const handleOptimization = async () => {
    setShowOptimizationModal(true);
  };

  const handleApplyOptimization = async (insight) => {
    try {
      // Apply optimization - replace with actual API call
      console.log('Applying optimization:', insight);
      // Show success message
    } catch (error) {
      console.error('Error applying optimization:', error);
    }
  };

  // Every value below is real (DB counts or process/os readings) — no
  // change/trend field is shown unless this session actually computed one,
  // since there is no historical metrics store to derive a real trend from.
  const serviceHealthEntries = Object.entries(platformStatus?.services || {});
  const healthyServiceCount = serviceHealthEntries.filter(([, s]) => s.healthy).length;

  const dashboardWidgets = [
    {
      id: 'users',
      title: 'Total Users',
      type: 'metric',
      value: analyticsData?.total_users ?? 0,
      description: 'Real count from the users table',
    },
    {
      id: 'active-users',
      title: 'Active Users (30d)',
      type: 'metric',
      value: analyticsData?.active_users_30d ?? 0,
      description: 'Logged in within the last 30 days',
    },
    {
      id: 'orders',
      title: 'Total Orders',
      type: 'metric',
      value: analyticsData?.total_orders ?? 0,
      description: 'Real count from the orders table',
    },
    {
      id: 'memory',
      title: 'Memory Used',
      type: 'gauge',
      value: platformStatus?.system_metrics?.system?.memory_used_pct ?? 0,
      unit: '%',
      description: `${platformStatus?.system_metrics?.system?.memory_total_mb ?? '—'} MB total (real OS reading)`,
    },
    {
      id: 'services',
      title: 'Service Health',
      type: 'metric',
      value: serviceHealthEntries.length > 0 ? `${healthyServiceCount}/${serviceHealthEntries.length}` : '—',
      description: 'Real DB/provider-connectivity checks, not simulated latency',
    },
    {
      id: 'uptime',
      title: 'Process Uptime',
      type: 'metric',
      value: platformStatus?.system_metrics?.process?.uptime_seconds ?
        Math.floor(platformStatus.system_metrics.process.uptime_seconds / 3600) :
        0,
      suffix: 'h',
      description: 'Real backend process uptime',
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'configuration', label: 'Configuration', icon: '⚙️' },
    { id: 'monitoring', label: 'Monitoring', icon: '📈' },
    { id: 'analytics', label: 'Analytics', icon: '📉' },
    { id: 'optimization', label: 'Optimization', icon: '🚀' },
  ];

  return (
    <div className="platform-management-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Platform Management</h1>
        <p className="text-gray-600 mt-1">Monitor and optimize platform performance with AI-powered insights</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Platform Overview</h2>
                <p className="text-sm text-gray-600">Real-time platform status and metrics</p>
              </div>
              <Button onClick={handleOptimization}>Run Optimization</Button>
            </div>

            <Dashboard
              title="Platform Dashboard"
              widgets={dashboardWidgets}
              layout="grid"
              onRefresh={loadPlatformData}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIInsightsPanel
                insights={aiInsights}
                loading={loading}
                onRefresh={loadAIInsights}
                onApplyRecommendation={handleApplyOptimization}
              />

              <Card>
                <h3 className="text-lg font-semibold mb-4">System Status</h3>
                {platformStatus && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        platformStatus.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {platformStatus.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Uptime</span>
                      <span className="font-medium">{Math.floor((platformStatus.system_metrics?.process?.uptime_seconds || 0) / 3600)}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Node Version</span>
                      <span className="font-medium">{platformStatus.system_metrics?.process?.node_version}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Environment</span>
                      <span className="font-medium">{platformStatus.system_metrics?.process?.env}</span>
                    </div>
                    {serviceHealthEntries.map(([name, s]) => (
                      <div key={name} className="flex justify-between items-center">
                        <span className="text-gray-600 capitalize">{name.replace(/_/g, ' ')}</span>
                        <span className={`px-2 py-1 rounded text-xs ${s.healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {s.healthy ? 'healthy' : 'unhealthy'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'configuration' && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">Platform Configuration</h3>
            <p className="text-gray-600">Platform configuration management interface</p>
            {/* Configuration management UI would go here */}
          </Card>
        )}

        {activeTab === 'monitoring' && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">System Monitoring</h3>
            <p className="text-gray-600">Real-time system monitoring and alerting</p>
            {/* Monitoring UI would go here */}
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">Platform Analytics</h3>
            <p className="text-gray-600">Comprehensive platform analytics and reporting</p>
            {/* Analytics UI would go here */}
          </Card>
        )}

        {activeTab === 'optimization' && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">System Optimization</h3>
            <p className="text-gray-600">AI-powered system optimization recommendations</p>
            {/* Optimization UI would go here */}
          </Card>
        )}
      </div>

      <Modal
        isOpen={showOptimizationModal}
        onClose={() => setShowOptimizationModal(false)}
        title="Run Platform Optimization"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Not yet implemented</h4>
            <p className="text-sm text-yellow-700">
              There is no automated optimization action wired to the backend yet — this
              button previously closed the dialog as if something had run, with no real
              effect. Nothing will happen if you continue; this is left honestly disabled
              until a real optimization action exists to call.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowOptimizationModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlatformManagementPage;
