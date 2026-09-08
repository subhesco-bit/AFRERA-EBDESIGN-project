/**
 * Enterprise Integration Page
 * Production-level enterprise system integration management interface
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect as Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { LoadingSkeleton } from '../components/ui/enhancedComponents';
import { enterpriseIntegrationAPI } from '../services/api';

const EnterpriseIntegrationPage = () => {
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Get organization integrations
  const { data: integrationsData, isLoading: integrationsLoading, error: integrationsError } = useQuery({
    queryKey: ['organizationIntegrations'],
    queryFn: () => enterpriseIntegrationAPI.getCurrentOrganizationIntegrations()
      .then(res => res.data.data),
    refetchInterval: 180000, // 3 minutes
  });

  // Get system status
  const { data: systemStatus } = useQuery({
    queryKey: ['enterpriseSystemStatus'],
    queryFn: () => enterpriseIntegrationAPI.getSystemStatus()
      .then(res => res.data.data),
    refetchInterval: 300000, // 5 minutes
  });

  // Get integration health when selected
  const { data: integrationHealth } = useQuery({
    queryKey: ['integrationHealth', selectedIntegration],
    queryFn: () => enterpriseIntegrationAPI.getIntegrationHealth(selectedIntegration)
      .then(res => res.data.data),
    enabled: Boolean(selectedIntegration),
  });

  const integrations = integrationsData?.integrations || [];

  const integrationTypes = [
    { value: 'erp', label: 'ERP System', icon: '🏢' },
    { value: 'payment_gateway', label: 'Payment Gateway', icon: '💳' },
    { value: 'logistics', label: 'Logistics Provider', icon: '🚚' },
    { value: 'analytics', label: 'Analytics Platform', icon: '📊' },
    { value: 'communication', label: 'Communication Service', icon: '📧' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Enterprise Integration</h1>
        <Button onClick={() => setShowRegisterForm(!showRegisterForm)}>
          {showRegisterForm ? 'Cancel' : 'Register Integration'}
        </Button>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Active Integrations</h3>
          <p className="text-2xl font-bold">{systemStatus?.activeIntegrations || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">System Health</h3>
          <Badge variant="default">{systemStatus?.systemHealth || 'Unknown'}</Badge>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Supported Types</h3>
          <p className="text-2xl font-bold">{systemStatus?.supportedIntegrationTypes?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Cache Status</h3>
          <Badge variant="outline">Active</Badge>
        </Card>
      </div>

      {/* Register Integration Form */}
      {showRegisterForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Register New Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Integration Type</label>
              <Select>
                {integrationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Integration Name</label>
              <Input placeholder="Enter integration name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Endpoint URL</label>
              <Input placeholder="https://api.example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <Input type="password" placeholder="Enter API key" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button>Register Integration</Button>
            <Button variant="outline" onClick={() => setShowRegisterForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {['overview', 'sync', 'payments', 'logistics', 'analytics'].map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Integration List */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Your Integrations</h2>
          <div className="space-y-3">
            {integrationsLoading ? (
              <LoadingSkeleton variant="rectangular" lines={3} />
            ) : integrationsError ? (
              <p className="text-red-600 text-sm">Unable to load integrations: {integrationsError.message}</p>
            ) : integrations.length === 0 ? (
              <p className="text-gray-500 text-sm">No integrations registered</p>
            ) : (
              integrations.map(integration => {
                const typeInfo = integrationTypes.find(t => t.value === integration.integration_type);
                return (
                  <div
                    key={integration.integration_id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedIntegration === integration.integration_id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedIntegration(integration.integration_id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{typeInfo?.icon || '🔌'}</span>
                        <div>
                          <p className="font-medium">{integration.integration_name}</p>
                          <p className="text-sm text-gray-600">{typeInfo?.label || integration.integration_type}</p>
                        </div>
                      </div>
                      <Badge variant={integration.status === 'active' ? 'default' : 'destructive'}>
                        {integration.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Last tested: {integration.last_tested ? new Date(integration.last_tested).toLocaleString() : 'Never'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Integration Details */}
        <Card className="p-6 lg:col-span-2">
          {selectedIntegration ? (
            integrationHealth ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Integration Details</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Test Connection</Button>
                    <Button variant="outline" size="sm">Configure</Button>
                    <Button variant="destructive" size="sm">Deactivate</Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Integration ID</p>
                    <p className="font-medium">{integrationHealth.integrationId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium">{integrationHealth.integrationType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Connection Status</p>
                    <Badge variant={integrationHealth.connectionStatus === 'healthy' ? 'default' : 'destructive'}>
                      {integrationHealth.connectionStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Since</p>
                    <p className="font-medium">
                      {integrationHealth.activeSince ? new Date(integrationHealth.activeSince).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Health Status */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">Health Status</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      integrationHealth.connectionStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{integrationHealth.connectionStatus}</span>
                  </div>
                </div>

                {/* Recent Sync Activity */}
                {integrationHealth.recentSyncActivity && integrationHealth.recentSyncActivity.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Recent Sync Activity</h3>
                    <div className="space-y-2">
                      {integrationHealth.recentSyncActivity.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{activity.sync_type}</p>
                            <p className="text-xs text-gray-600">{activity.data_type}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={activity.status === 'success' ? 'default' : 'destructive'}>
                              {activity.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div>
                  <h3 className="font-semibold mb-2">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">Sync Now</Button>
                    <Button variant="outline" size="sm">View Logs</Button>
                    <Button variant="outline" size="sm">Test Payment</Button>
                    <Button variant="outline" size="sm">Test Logistics</Button>
                  </div>
                </div>
              </div>
            ) : (
              <LoadingSkeleton variant="rectangular" lines={4} />
            )
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Select an integration to view details</p>
            </div>
          )}
        </Card>
      </div>

      {/* Sync Management */}
      {activeTab === 'sync' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sync Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Integration</label>
              <Select>
                {integrations.map(integration => (
                  <option key={integration.integration_id} value={integration.integration_id}>
                    {integration.integration_name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data Type</label>
              <Select>
                <option value="orders">Orders</option>
                <option value="products">Products</option>
                <option value="customers">Customers</option>
                <option value="inventory">Inventory</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Direction</label>
              <Select>
                <option value="push">Push to ERP</option>
                <option value="pull">Pull from ERP</option>
                <option value="bidirectional">Bidirectional</option>
              </Select>
            </div>
          </div>
          <Button className="mt-4">Execute Sync</Button>
        </Card>
      )}
    </div>
  );
};

export default EnterpriseIntegrationPage;
