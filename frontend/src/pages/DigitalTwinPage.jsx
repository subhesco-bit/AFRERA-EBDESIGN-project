/**
 * Digital Twin Page
 * Production-level digital twin management and simulation interface
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect as Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { LoadingSkeleton } from '../components/ui/enhancedComponents';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const DigitalTwinPage = () => {
  const { user } = useAuthStore();
  const [selectedTwin, setSelectedTwin] = useState(null);
  const [simulationType, setSimulationType] = useState('yield_prediction');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get farmer's digital twins
  const { data: twinsData, isLoading: twinsLoading, error: twinsError } = useQuery({
    queryKey: ['farmerTwins', user?.id],
    queryFn: () => api.get(`/digital-twin/farmers/${user.id}`).then(res => res.data.data),
    enabled: Boolean(user?.id),
    refetchInterval: 120000, // 2 minutes
  });

  // Get system status
  const { data: systemStatus } = useQuery({
    queryKey: ['digitalTwinSystemStatus'],
    queryFn: () => api.get('/digital-twin/system/status').then(res => res.data.data),
    refetchInterval: 300000, // 5 minutes
  });

  // Get twin details when selected
  const { data: twinDetails } = useQuery({
    queryKey: ['twinDetails', selectedTwin],
    queryFn: () => api.get(`/digital-twin/${selectedTwin}`).then(res => res.data.data),
    enabled: Boolean(selectedTwin),
  });

  const twins = twinsData?.twins || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Digital Twin Management</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create New Twin'}
        </Button>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Active Twins</h3>
          <p className="text-2xl font-bold">{systemStatus?.activeTwins || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">System Health</h3>
          <Badge variant="default">{systemStatus?.systemHealth || 'Unknown'}</Badge>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Sync Interval</h3>
          <p className="text-2xl font-bold">{systemStatus?.simulationInterval / 1000}s</p>
        </Card>
      </div>

      {/* Create Twin Form */}
      {showCreateForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create Digital Twin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Twin Type</label>
              <Select>
                <option value="farm">Farm</option>
                <option value="crop">Crop</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input placeholder="Enter twin name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Entity ID</label>
              <Input placeholder="Enter farm or crop ID" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input placeholder="Enter location" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button>Create Twin</Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Twin List */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Your Digital Twins</h2>
          <div className="space-y-3">
            {twinsLoading ? (
              <LoadingSkeleton variant="rectangular" lines={3} />
            ) : twinsError ? (
              <p className="text-red-600 text-sm">Unable to load digital twins: {twinsError.message}</p>
            ) : twins.length === 0 ? (
              <p className="text-gray-500 text-sm">No digital twins created</p>
            ) : (
              twins.map(twin => (
                <div
                  key={twin.twin_id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedTwin === twin.twin_id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTwin(twin.twin_id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{twin.name}</p>
                      <p className="text-sm text-gray-600">{twin.entity_type}</p>
                    </div>
                    <Badge variant={twin.status === 'active' ? 'default' : 'destructive'}>
                      {twin.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Last synced: {twin.last_synced ? new Date(twin.last_synced).toLocaleString() : 'Never'}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Twin Details */}
        <Card className="p-6 lg:col-span-2">
          {selectedTwin ? (
            twinDetails ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Twin Details</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Sync Now</Button>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Twin ID</p>
                    <p className="font-medium">{twinDetails.twin_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Entity Type</p>
                    <p className="font-medium">{twinDetails.entity_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Entity ID</p>
                    <p className="font-medium">{twinDetails.entity_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={twinDetails.status === 'active' ? 'default' : 'destructive'}>
                      {twinDetails.status}
                    </Badge>
                  </div>
                </div>

                {/* Current State */}
                {twinDetails.currentState && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">Current State</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Sync Status:</span>
                        <span className="ml-2 font-medium">{twinDetails.currentState.syncStatus}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="ml-2 font-medium">
                          {new Date(twinDetails.currentState.lastUpdated).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Simulation Controls */}
                <div>
                  <h3 className="font-semibold mb-2">Run Simulation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Simulation Type</label>
                      <Select
                        value={simulationType}
                        onChange={(e) => setSimulationType(e.target.value)}
                      >
                        <option value="yield_prediction">Yield Prediction</option>
                        <option value="resource_optimization">Resource Optimization</option>
                        <option value="climate_impact">Climate Impact</option>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button className="w-full">Run Simulation</Button>
                    </div>
                  </div>
                </div>

                {/* Simulation Results Placeholder */}
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Simulation results will appear here</p>
                </div>
              </div>
            ) : (
              <LoadingSkeleton variant="rectangular" lines={4} />
            )
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Select a digital twin to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DigitalTwinPage;
