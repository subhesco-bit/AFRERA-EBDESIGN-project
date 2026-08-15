/**
 * Platform Management Page
 * Comprehensive platform administration with AI-powered insights
 * M001 Platform Core Module Frontend
 */

import React, { useState, useEffect } from 'react';
import Dashboard from '../components/ui/Dashboard';
import AIInsightsPanel from '../components/ui/AIInsightsPanel';
import { Card, Button, Select, SearchInput, DataTable, Modal, Tabs } from '../components/ui/common';

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
    try {
      // Mock AI insights - replace with actual API call
      const insights = [
        {
          id: 'insight_1',
          title: 'CPU Usage Optimization Opportunity',
          description: 'Current CPU usage patterns suggest optimization potential through load balancing and caching improvements.',
          severity: 'warning',
          confidence: 0.85,
          data: {
            current_usage: 78,
            projected_usage: 65,
            potential_savings: 15
          },
          recommendations: [
            'Implement Redis caching for frequently accessed data',
            'Optimize database queries with proper indexing',
            'Consider horizontal scaling for peak hours'
          ],
          timestamp: new Date().toISOString()
        },
        {
          id: 'insight_2',
          title: 'Memory Leak Detected',
          description: 'Memory usage patterns indicate potential memory leak in background processes.',
          severity: 'critical',
          confidence: 0.92,
          data: {
            current_usage: 89,
            trend: 'increasing',
            affected_processes: 3
          },
          recommendations: [
            'Investigate background process memory allocation',
            'Implement memory monitoring and alerts',
            'Restart affected services after investigation'
          ],
          timestamp: new Date().toISOString()
        },
        {
          id: 'insight_3',
          title: 'Database Performance Improvement',
          description: 'Database query performance can be improved through indexing and query optimization.',
          severity: 'info',
          confidence: 0.78,
          data: {
            avg_query_time: 245,
            target_query_time: 100,
            slow_queries: 12
          },
          recommendations: [
            'Add indexes to frequently queried columns',
            'Optimize complex queries with proper joins',
            'Implement query result caching'
          ],
          timestamp: new Date().toISOString()
        }
      ];
      
      setAiInsights(insights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  };

  const fetchPlatformStatus = async () => {
    // Mock data - replace with actual API call
    return {
      status: 'operational',
      uptime: 86400,
      version: '1.0.0',
      environment: 'production',
      system_metrics: {
        cpu_usage: 78,
        memory_usage: 65,
        uptime: 86400
      },
      services: {
        ai_gateway: { status: 'healthy', latency: 45 },
        analytics: { status: 'healthy', latency: 38 },
        monitoring: { status: 'healthy', latency: 52 }
      }
    };
  };

  const fetchPlatformAnalytics = async () => {
    // Mock data - replace with actual API call
    return {
      summary: {
        total_users: 15420,
        active_users: 8934,
        total_requests: 1250000,
        error_rate: 0.02
      },
      trends: {
        user_growth: 15,
        request_growth: 22,
        performance_trend: 'improving'
      }
    };
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

  const dashboardWidgets = [
    {
      id: 'users',
      title: 'Total Users',
      type: 'metric',
      prefix: '',
      suffix: '',
      value: analyticsData?.summary?.total_users || 0,
      change: analyticsData?.trends?.user_growth || 0,
      description: 'Active platform users'
    },
    {
      id: 'requests',
      title: 'Total Requests',
      type: 'metric',
      prefix: '',
      suffix: '',
      value: analyticsData?.summary?.total_requests || 0,
      change: analyticsData?.trends?.request_growth || 0,
      description: 'API requests this period'
    },
    {
      id: 'performance',
      title: 'Performance Score',
      type: 'gauge',
      value: platformStatus?.system_metrics?.cpu_usage || 0,
      unit: '%',
      description: 'Overall system performance'
    },
    {
      id: 'services',
      title: 'Service Health',
      type: 'chart',
      description: 'Service availability and performance'
    },
    {
      id: 'errors',
      title: 'Error Rate',
      type: 'metric',
      prefix: '',
      suffix: '%',
      value: (analyticsData?.summary?.error_rate || 0) * 100,
      change: -5,
      description: 'Platform error rate'
    },
    {
      id: 'uptime',
      title: 'System Uptime',
      type: 'metric',
      prefix: '',
      suffix: '%',
      value: 99.9,
      change: 0.1,
      description: 'Platform availability'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'configuration', label: 'Configuration', icon: '⚙️' },
    { id: 'monitoring', label: 'Monitoring', icon: '📈' },
    { id: 'analytics', label: 'Analytics', icon: '📉' },
    { id: 'optimization', label: 'Optimization', icon: '🚀' }
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
                      <span className="font-medium">{Math.floor(platformStatus.uptime / 3600)}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Version</span>
                      <span className="font-medium">{platformStatus.version}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Environment</span>
                      <span className="font-medium">{platformStatus.environment}</span>
                    </div>
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
          <p className="text-gray-600">
            This will run AI-powered optimization across all platform services.
            The process may take several minutes to complete.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Warning</h4>
            <p className="text-sm text-yellow-700">
              Optimization may temporarily affect service availability.
              Ensure you have a backup before proceeding.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowOptimizationModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              // Run optimization logic
              setShowOptimizationModal(false);
            }}>
              Start Optimization
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlatformManagementPage;