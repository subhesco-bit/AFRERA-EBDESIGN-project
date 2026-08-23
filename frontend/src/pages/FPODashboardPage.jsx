import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, DollarSign, BarChart3, PieChart, Activity, Building2, ShoppingCart } from 'lucide-react'
import { fpoAPI } from '../services/api'

function FPODashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: fpoStats } = useQuery({
    queryKey: ['fpo-stats'],
    queryFn: () => fpoAPI.getStats().then(r => r.data),
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">FPO Dashboard</h1>
        <p className="text-gray-600">Farmer Producer Organization management with collective bargaining and member analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'members', label: 'Members', icon: Users },
          { id: 'collective', label: 'Collective Orders', icon: ShoppingCart },
          { id: 'inventory', label: 'Inventory', icon: Building2 },
          { id: 'finance', label: 'Finance', icon: DollarSign },
          { id: 'distribution', label: 'Profit Distribution', icon: PieChart }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-600 text-white'
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
                <Users className="w-8 h-8 text-amber-600" />
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {fpoStats?.members || 0}
              </div>
              <div className="text-sm text-gray-600">Active Members</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-500">YTD</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ₹{(fpoStats?.turnover || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Turnover (Cr)</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-500">Rate</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(fpoStats?.profit_margin || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Profit Margin</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <ShoppingCart className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-500">Orders</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {fpoStats?.orders || 0}
              </div>
              <div className="text-sm text-gray-600">Collective Orders</div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-amber-600" />
              AI-Powered FPO Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Volume Aggregation</div>
                <div className="text-2xl font-bold text-amber-600">+45%</div>
                <div className="text-xs text-gray-500">Through collective buying</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Price Negotiation</div>
                <div className="text-2xl font-bold text-green-600">-18%</div>
                <div className="text-xs text-gray-500">Average cost reduction</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Credit Opportunity</div>
                <div className="text-2xl font-bold text-blue-600">₹1.5Cr</div>
                <div className="text-xs text-gray-500">Group loan capacity</div>
              </div>
            </div>
          </div>

          {/* Member Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Member Activity</h3>
            <div className="space-y-3">
              {[
                { name: 'Bornali Gogoi', contribution: 150000, share: 12, status: 'active' },
                { name: 'Rimon Lyngdoh', contribution: 120000, share: 10, status: 'active' },
                { name: 'Ramcharan Naga', contribution: 100000, share: 8, status: 'active' }
              ].map((member) => (
                <div key={member.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{member.name}</div>
                    <div className="text-sm text-gray-500">Contribution: ₹{member.contribution.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Share</div>
                      <div className="font-bold text-gray-900">{member.share}%</div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {member.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Member Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Total Members</div>
              <div className="text-2xl font-bold text-gray-900">450</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Active This Month</div>
              <div className="text-2xl font-bold text-green-600">412</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">New This Month</div>
              <div className="text-2xl font-bold text-blue-600">12</div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full member management interface would be implemented here
          </div>
        </div>
      )}

      {/* Collective Orders Tab */}
      {activeTab === 'collective' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Collective Bargaining</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <ShoppingCart className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800">Volume Aggregation & Price Negotiation</div>
                <div className="text-sm text-gray-600">
                  Aggregate member orders to achieve bulk pricing. AI analyzes market trends and negotiates better terms for the collective.
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { id: 'ORD-001', product: 'Joha Rice', volume: 5000, unit: 'kg', buyers: 45, savings: 45000, status: 'negotiating' },
              { id: 'ORD-002', product: 'Karbi Anglong Ginger', volume: 2000, unit: 'kg', buyers: 32, savings: 32000, status: 'confirmed' },
              { id: 'ORD-003', product: 'Khasi Mandarin', volume: 3000, unit: 'kg', buyers: 28, savings: 28000, status: 'completed' }
            ].map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">{order.product}</div>
                    <div className="text-sm text-gray-500">{order.volume.toLocaleString()} {order.unit} • {order.buyers} buyers</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Collective Savings</div>
                  <div className="font-bold text-green-600">₹{order.savings.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Collective Inventory</h3>
          <div className="space-y-3">
            {[
              { product: 'Joha Rice', quantity: 25000, unit: 'kg', quality: 'Grade A', location: 'Central Warehouse' },
              { product: 'Karbi Anglong Ginger', quantity: 8000, unit: 'kg', quality: 'Grade A', location: 'Cold Storage' },
              { product: 'Khasi Mandarin', quantity: 15000, unit: 'kg', quality: 'Grade A', location: 'Packhouse' }
            ].map((item) => (
              <div key={item.product} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{item.product}</div>
                  <div className="text-sm text-gray-500">{item.quality} • {item.location}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Quantity</div>
                  <div className="font-bold text-gray-900">{item.quantity.toLocaleString()} {item.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Group Loan Capacity</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Approved Limit</span>
                  <span className="font-medium text-green-600">₹1.5Cr</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Utilized</span>
                  <span className="font-medium text-blue-600">₹80L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available</span>
                  <span className="font-medium text-green-600">₹70L</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Working Capital</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Required</span>
                  <span className="font-medium text-orange-600">₹50L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Balance</span>
                  <span className="font-medium text-green-600">₹35L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gap</span>
                  <span className="font-medium text-red-600">₹15L</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Tab */}
      {activeTab === 'distribution' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit Distribution</h3>
          <div className="space-y-3">
            {[
              { member: 'Bornali Gogoi', share: 12, profit: 280000, status: 'pending' },
              { member: 'Rimon Lyngdoh', share: 10, profit: 233000, status: 'pending' },
              { member: 'Ramcharan Naga', share: 8, profit: 186000, status: 'distributed' }
            ].map((dist) => (
              <div key={dist.member} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{dist.member}</div>
                  <div className="text-sm text-gray-500">{dist.share}% share</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Profit</div>
                    <div className="font-bold text-gray-900">₹{dist.profit.toLocaleString()}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    dist.status === 'distributed' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {dist.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FPODashboardPage