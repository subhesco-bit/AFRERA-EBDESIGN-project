import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, FileText, Users, DollarSign, AlertTriangle, CheckCircle, BarChart3, Activity } from 'lucide-react'
import { governmentAPI } from '../services/api'

function GovernmentDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const { data: schemeStats } = useQuery('government-schemes', () =>
    governmentAPI.getSchemeAnalytics().then(r => r.data)
  )

  const { data: complianceData } = useQuery('government-compliance', () =>
    governmentAPI.getComplianceStatus().then(r => r.data)
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Government Portal</h1>
        <p className="text-gray-600">AI-powered scheme administration, subsidy management, and compliance monitoring</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'schemes', label: 'Schemes', icon: Shield },
          { id: 'subsidies', label: 'Subsidies', icon: DollarSign },
          { id: 'beneficiaries', label: 'Beneficiaries', icon: Users },
          { id: 'compliance', label: 'Compliance', icon: CheckCircle },
          { id: 'reports', label: 'Reports', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
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
                <Shield className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-500">Active</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {schemeStats?.active_schemes || 0}
              </div>
              <div className="text-sm text-gray-600">Active Schemes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-500">YTD</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ₹{(schemeStats?.disbursed || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Disbursed (Cr)</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {schemeStats?.beneficiaries || 0}
              </div>
              <div className="text-sm text-gray-600">Beneficiaries</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-orange-600" />
                <span className="text-sm text-gray-500">Utilization</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(schemeStats?.utilization || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Budget Utilization</div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-600" />
              AI-Powered Scheme Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Underserved Regions</div>
                <div className="text-2xl font-bold text-purple-600">3</div>
                <div className="text-xs text-gray-500">Districts with low scheme uptake</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Optimization Opportunity</div>
                <div className="text-2xl font-bold text-green-600">₹15Cr</div>
                <div className="text-xs text-gray-500">Additional subsidy reach potential</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Fraud Detection</div>
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-xs text-gray-500">AI-detected anomalies this month</div>
              </div>
            </div>
          </div>

          {/* Scheme Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Scheme Performance</h3>
            <div className="space-y-3">
              {[
                { name: 'PMFBY', beneficiaries: 12500, disbursed: 45, utilization: 78, status: 'active' },
                { name: 'MIDH', beneficiaries: 8200, disbursed: 32, utilization: 65, status: 'active' },
                { name: 'AIF', beneficiaries: 3500, disbursed: 50, utilization: 85, status: 'active' },
                { name: 'PM-FME', beneficiaries: 2100, disbursed: 15, utilization: 45, status: 'active' }
              ].map((scheme) => (
                <div key={scheme.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{scheme.name}</div>
                    <div className="text-sm text-gray-500">{scheme.beneficiaries.toLocaleString()} beneficiaries</div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Disbursed</div>
                      <div className="font-bold text-gray-900">₹{scheme.disbursed}Cr</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Utilization</div>
                      <div className="font-bold text-gray-900">{scheme.utilization}%</div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {scheme.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schemes Tab */}
      {activeTab === 'schemes' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Scheme Management</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800">Scheme Verification Discipline</div>
                <div className="text-sm text-gray-600">
                  AHIDF lapsed 31 Mar 2026 and is excluded from all live financing/insurance workflows until revival is notified.
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { id: 'PMFBY', name: 'Pradhan Mantri Fasal Bima Yojana', ministry: 'Agriculture', budget: 5000, utilized: 3900, status: 'active', expiry: '2027-03-31' },
              { id: 'MIDH', name: 'Mission for Integrated Development of Horticulture', ministry: 'Agri & Farmers Welfare', budget: 2500, utilized: 1625, status: 'active', expiry: '2028-03-31' },
              { id: 'AIF', name: 'Agriculture Infrastructure Fund', ministry: 'Animal Husbandry', budget: 8000, utilized: 6800, status: 'active', expiry: '2028-03-31' },
              { id: 'OPGREENS', name: 'Operation Greens', ministry: 'Food Processing', budget: 3000, utilized: 2550, status: 'active', expiry: '2027-03-31' }
            ].map((scheme) => (
              <div key={scheme.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">{scheme.name}</div>
                    <div className="text-sm text-gray-500">{scheme.ministry}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    scheme.status === 'active' ? 'bg-green-100 text-green-800' :
                    scheme.status === 'expiring' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {scheme.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Budget</div>
                    <div className="font-medium">₹{scheme.budget}Cr</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Utilized</div>
                    <div className="font-medium">₹{scheme.utilized}Cr</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Utilization %</div>
                    <div className="font-medium">{((scheme.utilized / scheme.budget) * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Expiry</div>
                    <div className="font-medium">{scheme.expiry}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex justify-end space-x-2">
                  <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                    View Details
                  </button>
                  <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subsidies Tab */}
      {activeTab === 'subsidies' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Subsidy Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Pending Disbursements</div>
              <div className="text-2xl font-bold text-orange-600">156</div>
              <div className="text-xs text-gray-500">Awaiting processing</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">This Month</div>
              <div className="text-2xl font-bold text-green-600">₹2.3Cr</div>
              <div className="text-xs text-gray-500">Disbursed</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Fraud Alerts</div>
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-xs text-gray-500">AI-detected anomalies</div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full subsidy management interface would be implemented here
          </div>
        </div>
      )}

      {/* Beneficiaries Tab */}
      {activeTab === 'beneficiaries' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Beneficiary Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Total Beneficiaries</div>
              <div className="text-2xl font-bold text-gray-900">26,300</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Farmers</div>
              <div className="text-2xl font-bold text-green-600">18,500</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">FPOs</div>
              <div className="text-2xl font-bold text-blue-600">4,200</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Processors</div>
              <div className="text-2xl font-bold text-purple-600">3,600</div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full beneficiary management interface would be implemented here
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Compliance Monitoring</h3>
          <div className="space-y-4">
            {[
              { type: 'Scheme Eligibility', status: 'compliant', lastCheck: '2026-08-04', issues: 0 },
              { type: 'Disbursement Compliance', status: 'compliant', lastCheck: '2026-08-04', issues: 0 },
              { type: 'Document Verification', status: 'review', lastCheck: '2026-08-03', issues: 3 },
              { type: 'Audit Trail', status: 'compliant', lastCheck: '2026-08-04', issues: 0 }
            ].map((item) => (
              <div key={item.type} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{item.type}</div>
                  <div className="text-sm text-gray-500">Last checked: {item.lastCheck}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'compliant' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                  {item.issues > 0 && (
                    <span className="text-sm text-orange-600 font-medium">{item.issues} issues</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Government Reports</h3>
          <div className="space-y-3">
            {[
              { name: 'Scheme Performance Report', frequency: 'Monthly', status: 'ready' },
              { name: 'Beneficiary Impact Analysis', frequency: 'Quarterly', status: 'ready' },
              { name: 'Budget Utilization Report', frequency: 'Monthly', status: 'ready' },
              { name: 'Compliance Audit Report', frequency: 'Quarterly', status: 'pending' }
            ].map((report) => (
              <div key={report.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{report.name}</div>
                  <div className="text-sm text-gray-500">Frequency: {report.frequency}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    report.status === 'ready' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status === 'ready' ? 'Ready' : 'Pending'}
                  </span>
                  <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                    Generate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default GovernmentDashboardPage