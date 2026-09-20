import React, { useState, useEffect } from "react";
import { Zap, Users, Settings, BarChart3, AlertCircle, CheckCircle } from "lucide-react";

export default function PlatformCoreDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 2547,
    activeSubscriptions: 1892,
    monthlyRevenue: 524000,
    systemHealth: "operational",
  });

  const [services, setServices] = useState([
    { name: "AI Models", status: "active", endpoints: 23 },
    { name: "Digital Twin", status: "active", endpoints: 5 },
    { name: "Monitoring", status: "active", endpoints: 4 },
    { name: "GDPR Compliance", status: "active", endpoints: 4 },
  ]);

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="flex items-center gap-3 mb-8">
        <Zap className="w-8 h-8 text-indigo-600" />
        <h1 className="text-3xl font-bold">Platform Core Dashboard</h1>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
          <p className="text-green-600 text-sm mt-1">↑ 12% this month</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Active Subscriptions</p>
          <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions.toLocaleString()}</p>
          <p className="text-green-600 text-sm mt-1">74.3% conversion</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Monthly Revenue</p>
          <p className="text-3xl font-bold text-gray-900">₹{(stats.monthlyRevenue / 1000).toFixed(0)}K</p>
          <p className="text-green-600 text-sm mt-1">↑ 23% YoY</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">System Health</p>
              <p className="text-lg font-bold text-gray-900">{stats.systemHealth}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Active Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((svc, idx) => (
            <div key={idx} className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded">Active</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{svc.endpoints}</p>
              <p className="text-sm text-gray-600">API Endpoints</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Platform Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-6 border-2 border-blue-200 rounded-lg hover:bg-blue-50 text-left">
            <p className="font-semibold text-gray-900">View Analytics</p>
            <p className="text-sm text-gray-600 mt-1">Real-time platform metrics</p>
          </button>
          <button className="p-6 border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 text-left">
            <p className="font-semibold text-gray-900">Manage Services</p>
            <p className="text-sm text-gray-600 mt-1">Control 23 AI models</p>
          </button>
          <button className="p-6 border-2 border-purple-200 rounded-lg hover:bg-purple-50 text-left">
            <p className="font-semibold text-gray-900">Security Settings</p>
            <p className="text-sm text-gray-600 mt-1">Configure security</p>
          </button>
        </div>
      </div>
    </div>
  );
}
