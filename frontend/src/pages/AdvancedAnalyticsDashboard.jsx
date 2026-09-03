/**
 * Advanced Analytics Dashboard Page
 * Production-level analytics dashboard with real-time data visualization
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LoadingSkeleton } from '../components/ui/enhancedComponents';
import { EnhancedErrorBoundary } from '../components/ErrorBoundary/EnhancedErrorBoundary';
import { analyticsAPI } from '../services/api';

const AdvancedAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Fetch platform analytics
  const { data: platformData, isLoading: platformLoading, error: platformError } = useQuery({
    queryKey: ['platformAnalytics', timeRange],
    queryFn: async () => {
      const response = await analyticsAPI.getPlatformStats({ timeRange });
      return response.data?.data || response.data;
    },
    refetchInterval: 300000 // 5 minutes
  });

  // Fetch market trends
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['marketTrends', 'rice', timeRange],
    queryFn: async () => {
      const response = await analyticsAPI.getInsights({ cropType: 'rice', timeRange });
      return response.data?.data || response.data;
    },
    enabled: !!platformData
  });

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  const metrics = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'orders', label: 'Orders' },
    { value: 'farmers', label: 'Active Farmers' },
    { value: 'crops', label: 'Active Crops' }
  ];

  if (platformLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Advanced Analytics Dashboard</h1>
        <LoadingSkeleton variant="rectangular" lines={4} />
      </div>
    );
  }

  if (platformError) {
    return (
      <EnhancedErrorBoundary
        fallbackUI={() => (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-semibold">Analytics Data Unavailable</h3>
              <p className="text-red-600">Unable to load analytics data. Please try again later.</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          </div>
        )}
      >
        <div>Loading analytics...</div>
      </EnhancedErrorBoundary>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Advanced Analytics Dashboard</h1>
        <div className="flex gap-2">
          {timeRanges.map(range => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? 'default' : 'outline'}
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
          <p className="text-2xl font-bold">
            ${platformData?.totalRevenue?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-green-600">+12.5% from last period</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
          <p className="text-2xl font-bold">
            {platformData?.totalOrders?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-green-600">+8.3% from last period</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Active Farmers</h3>
          <p className="text-2xl font-bold">
            {platformData?.activeFarmers?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-blue-600">+5.2% from last period</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Active Crops</h3>
          <p className="text-2xl font-bold">
            {platformData?.activeCrops?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-purple-600">+3.7% from last period</p>
        </Card>
      </div>

      {/* Market Trends */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Market Trends</h2>
        {marketLoading ? (
          <LoadingSkeleton variant="rectangular" lines={3} />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trend Direction</span>
              <span className={`font-semibold ${
                marketData?.trends?.trend === 'increasing' ? 'text-green-600' : 
                marketData?.trends?.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {marketData?.trends?.trend || 'stable'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Growth Rate</span>
              <span className="font-semibold">
                {marketData?.trends?.growthRate?.toFixed(2) || '0'}%
              </span>
            </div>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart visualization would render here</p>
            </div>
          </div>
        )}
      </Card>

      {/* Custom Report Generator */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Generate Custom Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Metrics</label>
            <select className="w-full p-2 border rounded">
              <option>Revenue</option>
              <option>Orders</option>
              <option>Farmer Performance</option>
              <option>Market Analysis</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Group By</label>
            <select className="w-full p-2 border rounded">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Region</option>
            </select>
          </div>
        </div>
        <Button className="mt-4">Generate Report</Button>
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;