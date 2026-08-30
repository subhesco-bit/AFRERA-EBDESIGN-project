/**
 * IoT Monitoring Dashboard Page
 * Production-level IoT device monitoring and management interface
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSkeleton } from '../components/ui/enhancedComponents';
import { useAuthStore } from '../store/authStore';

const IoTMonitoringDashboard = () => {
  const { user } = useAuthStore();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');

  // Get farmer's devices
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['farmerDevices', user?.id],
    queryFn: () => fetch(`/api/iot/farmers/${user.id}/devices`)
      .then(res => res.json())
      .then(res => res.data),
    enabled: !!user?.id,
    refetchInterval: 60000 // 1 minute
  });

  // Get system status
  const { data: systemStatus } = useQuery({
    queryKey: ['iotSystemStatus'],
    queryFn: () => fetch('/api/iot/system/status')
      .then(res => res.json())
      .then(res => res.data),
    refetchInterval: 300000 // 5 minutes
  });

  // Get device details when selected
  const { data: deviceDetails } = useQuery({
    queryKey: ['deviceDetails', selectedDevice],
    queryFn: () => fetch(`/api/iot/devices/${selectedDevice}/status`)
      .then(res => res.json())
      .then(res => res.data),
    enabled: !!selectedDevice
  });

  if (devicesLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">IoT Monitoring Dashboard</h1>
        <LoadingSkeleton variant="rectangular" lines={4} />
      </div>
    );
  }

  const devices = devicesData?.devices || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">IoT Monitoring Dashboard</h1>
        <Button>Register New Device</Button>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Connected Devices</h3>
          <p className="text-2xl font-bold">{systemStatus?.connectedDevices || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Buffer Utilization</h3>
          <p className="text-2xl font-bold">
            {systemStatus?.bufferStatus?.utilizationPercent?.toFixed(0) || 0}%
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">System Health</h3>
          <Badge variant={systemStatus?.systemHealth === 'operational' ? 'default' : 'destructive'}>
            {systemStatus?.systemHealth || 'Unknown'}
          </Badge>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Active Farmers</h3>
          <p className="text-2xl font-bold">{devices.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Your Devices</h2>
          <div className="space-y-3">
            {devices.length === 0 ? (
              <p className="text-gray-500 text-sm">No devices registered</p>
            ) : (
              devices.map(device => (
                <div
                  key={device.device_id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedDevice === device.device_id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDevice(device.device_id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{device.device_type}</p>
                      <p className="text-sm text-gray-600">{device.device_id}</p>
                    </div>
                    <Badge variant={device.healthStatus === 'healthy' ? 'default' : 'destructive'}>
                      {device.healthStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Last active: {new Date(device.last_active).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Device Details */}
        <Card className="p-6 lg:col-span-2">
          {selectedDevice ? (
            deviceDetails ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Device Details</h2>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Device ID</p>
                    <p className="font-medium">{deviceDetails.deviceId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium">{deviceDetails.deviceType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={deviceDetails.status === 'active' ? 'default' : 'destructive'}>
                      {deviceDetails.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Active</p>
                    <p className="font-medium">{new Date(deviceDetails.lastActive).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Health Status</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        deviceDetails.healthStatus === 'healthy' ? 'bg-green-500' :
                        deviceDetails.healthStatus === 'degraded' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="font-medium">{deviceDetails.healthStatus}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Recent Data Points</h3>
                  <p className="text-gray-500">{deviceDetails.recentDataPoints || 0} readings in last 24 hours</p>
                </div>

                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Real-time sensor data chart</p>
                </div>
              </div>
            ) : (
              <LoadingSkeleton variant="rectangular" lines={4} />
            )
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Select a device to view details</p>
            </div>
          )}
        </Card>
      </div>

      {/* Aggregated Data */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Aggregated Sensor Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Sensor Type</label>
            <select className="w-full p-2 border rounded">
              <option>Temperature</option>
              <option>Humidity</option>
              <option>Soil Moisture</option>
              <option>pH Level</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Time Range</label>
            <select 
              className="w-full p-2 border rounded"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button className="w-full">View Data</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default IoTMonitoringDashboard;