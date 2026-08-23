import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, Users, ShoppingCart, Shield, FileText, Settings, AlertTriangle, CheckCircle, Database, Truck, DollarSign, Activity } from 'lucide-react'
import { analyticsAPI, adminAPI, systemAPI } from '../services/api'

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')

  // v5 react-query object syntax (see LoginPage.jsx) — bare string-key form
  // is removed in the installed v5; this page threw on render.
  const { data: platformStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => analyticsAPI.getPlatformStats().then(r => r.data),
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => adminAPI.getRecentAudit().then(r => r.data),
  })

  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => systemAPI.getHealth().then(r => r.data),
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Platform administration and governance oversight</p>
      </div>

      {/* System Health Banner */}
      {systemHealth && (
        <div className={`rounded-lg p-4 mb-6 ${
          systemHealth.status === 'healthy' ? 'bg-green-50 border border-green-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {systemHealth.status === 'healthy' ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
              )}
              <div>
                <div className="font-semibold text-gray-800">System Status: {systemHealth.status}</div>
                <div className="text-sm text-gray-600">Uptime: {Math.floor(systemHealth.uptime / 3600)}h</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Last check</div>
              <div className="text-sm font-medium text-gray-800">
                {new Date(systemHealth.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'orders', label: 'Orders', icon: ShoppingCart },
          { id: 'finance', label: 'Finance', icon: DollarSign },
          { id: 'logistics', label: 'Logistics', icon: Truck },
          { id: 'audit', label: 'Audit Trail', icon: FileText },
          { id: 'schemes', label: 'Schemes', icon: Shield },
          { id: 'data', label: 'Data Console', icon: Database },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {platformStats?.total_users || 0}
              </div>
              <div className="text-sm text-gray-600">Registered Users</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <ShoppingCart className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-500">This Month</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {platformStats?.monthly_orders || 0}
              </div>
              <div className="text-sm text-gray-600">Orders</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-500">GMV</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ₹{(platformStats?.gmv || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Gross Merchandise Value</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-orange-600" />
                <span className="text-sm text-gray-500">24h</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {platformStats?.daily_active || 0}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </div>

          {/* User Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">User Distribution by Role</h2>
              <div className="space-y-3">
                {[
                  { role: 'Farmers', count: platformStats?.role_counts?.farmer || 0, color: 'bg-green-500' },
                  { role: 'Corporate Buyers', count: platformStats?.role_counts?.corporate || 0, color: 'bg-blue-500' },
                  { role: 'Logistics Providers', count: platformStats?.role_counts?.logistics || 0, color: 'bg-purple-500' },
                  { role: 'FPOs', count: platformStats?.role_counts?.fpo || 0, color: 'bg-orange-500' },
                  { role: 'Admins', count: platformStats?.role_counts?.admin || 0, color: 'bg-gray-500' }
                ].map((item) => (
                  <div key={item.role} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${item.color} mr-3`} />
                      <span className="text-gray-700">{item.role}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity?.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start text-sm">
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                      activity.type === 'order' ? 'bg-green-500' :
                      activity.type === 'registration' ? 'bg-blue-500' :
                      activity.type === 'audit' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className="text-gray-800">{activity.event}</div>
                      <div className="text-gray-500 text-xs">{activity.timestamp}</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-500">No recent activity</div>
                )}
              </div>
            </div>
          </div>

          {/* Service Health */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Service Health</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {systemHealth?.services && Object.entries(systemHealth.services).map(([service, health]) => (
                <div key={service} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {service.replace('_', ' ')}
                    </span>
                    {health.status === 'ok' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{health.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">User Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.role_counts?.farmer || 0}
              </div>
              <div className="text-sm text-gray-600">Farmers</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.role_counts?.corporate || 0}
              </div>
              <div className="text-sm text-gray-600">Corporate Buyers</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.role_counts?.logistics || 0}
              </div>
              <div className="text-sm text-gray-600">Logistics Providers</div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full user management interface would be implemented here
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.order_stats?.pending || 0}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.order_stats?.processing || 0}
              </div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.order_stats?.shipped || 0}
              </div>
              <div className="text-sm text-gray-600">Shipped</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.order_stats?.delivered || 0}
              </div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full order management interface would be implemented here
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                ₹{(platformStats?.financials?.revenue || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Revenue (YTD)</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                ₹{(platformStats?.financials?.pending || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Pending Payments</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {(platformStats?.financials?.margin || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Platform Margin</div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full financial management interface would be implemented here
          </div>
        </div>
      )}

      {/* Logistics Tab */}
      {activeTab === 'logistics' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Logistics Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.logistics?.active_shipments || 0}
              </div>
              <div className="text-sm text-gray-600">Active Shipments</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.logistics?.cold_chain_nodes || 0}
              </div>
              <div className="text-sm text-gray-600">Cold-Chain Nodes</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {(platformStats?.logistics?.on_time_rate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">On-Time Delivery</div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full logistics management interface would be implemented here
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Audit Trail</h2>
          <div className="space-y-3">
            {recentActivity?.map((activity) => (
              <div key={activity.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{activity.event}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      User: {activity.user} • {activity.type}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{activity.timestamp}</div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">No audit events recorded</div>
            )}
          </div>
        </div>
      )}

      {/* Schemes Tab */}
      {activeTab === 'schemes' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Government Scheme Monitor</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800">Verification Discipline</div>
                <div className="text-sm text-gray-600">
                  AHIDF lapsed 31 Mar 2026 and is excluded from all live financing/insurance workflows until revival is notified.
                </div>
              </div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full scheme monitoring interface would be implemented here
          </div>
        </div>
      )}

      {/* Data Console Tab */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Console</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.data_stats?.total_records || 0}
              </div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.data_stats?.drive_synced || 0}
              </div>
              <div className="text-sm text-gray-600">Synced to Drive</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.data_stats?.local_fallback || 0}
              </div>
              <div className="text-sm text-gray-600">Local Fallback</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {platformStats?.data_stats?.audit_events || 0}
              </div>
              <div className="text-sm text-gray-600">Audit Events</div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full data console interface would be implemented here
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Platform Settings</h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Platform Configuration</h3>
              <div className="text-sm text-gray-600">
                Configure platform-wide settings, feature flags, and system parameters
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">User Roles & Permissions</h3>
              <div className="text-sm text-gray-600">
                Manage user roles, access controls, and permission matrices
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Integration Settings</h3>
              <div className="text-sm text-gray-600">
                Configure third-party integrations (payment gateways, logistics, etc.)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage