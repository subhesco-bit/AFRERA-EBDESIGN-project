/**
 * Operational Dashboard Page
 * Production-level operational monitoring and management interface
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSkeleton } from '../components/ui/enhancedComponents';

const OperationalDashboard = () => {
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Operational data
  const { data: operationalData, isLoading: operationalLoading } = useQuery({
    queryKey: ['operationalData', selectedRegion],
    queryFn: () => fetch(`/api/operations/overview?region=${selectedRegion}`)
      .then(res => res.json())
      .then(res => res.data),
    refetchInterval: 120000 // 2 minutes
  });

  const regions = ['all', 'assam', 'meghalaya', 'manipur', 'nagaland', 'tripura'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Operational Dashboard</h1>
        <div className="flex gap-2">
          {regions.map(region => (
            <Button
              key={region}
              variant={selectedRegion === region ? 'default' : 'outline'}
              onClick={() => setSelectedRegion(region)}
              size="sm"
            >
              {region.charAt(0).toUpperCase() + region.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {operationalLoading ? (
        <LoadingSkeleton variant="rectangular" lines={4} />
      ) : (
        <>
          {/* Key Operational Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-600">Active Operations</h3>
              <p className="text-2xl font-bold">{operationalData?.activeOperations || 0}</p>
              <p className="text-sm text-green-600">+8.1% from last week</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-600">Pending Tasks</h3>
              <p className="text-2xl font-bold">{operationalData?.pendingTasks || 0}</p>
              <p className="text-sm text-yellow-600">Requires attention</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-600">Resource Utilization</h3>
              <p className="text-2xl font-bold">{operationalData?.resourceUtilization || 0}%</p>
              <p className="text-sm text-blue-600">Optimal range</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-600">Efficiency Score</h3>
              <p className="text-2xl font-bold">{operationalData?.efficiencyScore || 0}%</p>
              <p className="text-sm text-purple-600">Above target</p>
            </Card>
          </div>

          {/* Regional Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Regional Performance</h2>
              <div className="space-y-3">
                {['Assam', 'Meghalaya', 'Manipur', 'Nagaland', 'Tripura'].map((region, index) => (
                  <div key={region} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{region}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{85 + index * 2}%</p>
                      <Badge variant="default">On Track</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
              <div className="space-y-3">
                <div className="p-3 border rounded">
                  <p className="font-medium">New crop registration</p>
                  <p className="text-sm text-gray-600">Farmer: John Doe - 2 hours ago</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="font-medium">Order fulfillment completed</p>
                  <p className="text-sm text-gray-600">Order #12345 - 4 hours ago</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="font-medium">Quality inspection passed</p>
                  <p className="text-sm text-gray-600">Batch #67890 - 6 hours ago</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Task Management */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Task Management</h2>
              <Button>Create Task</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded">
                <h3 className="font-semibold text-red-800">Urgent</h3>
                <p className="text-2xl font-bold text-red-600">3 tasks</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <h3 className="font-semibold text-yellow-800">In Progress</h3>
                <p className="text-2xl font-bold text-yellow-600">12 tasks</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-semibold text-green-800">Completed</h3>
                <p className="text-2xl font-bold text-green-600">45 tasks</p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default OperationalDashboard;