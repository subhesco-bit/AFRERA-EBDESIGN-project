import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Shield, Users, AlertTriangle, CheckCircle, BarChart3, PieChart, Activity, Search } from 'lucide-react'
import { subsidyAPI } from '../services/api'

function SubsidyManagementPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedScheme, setSelectedScheme] = useState(null)

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: subsidyStats } = useQuery({
    queryKey: ['subsidy-stats'],
    queryFn: () => subsidyAPI.getStats().then(r => r.data),
  })

  const { data: pendingDisbursements } = useQuery({
    queryKey: ['pending-disbursements'],
    queryFn: () => subsidyAPI.getPending().then(r => r.data),
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Subsidy Management</h1>
        <p className="text-gray-600">AI-powered subsidy eligibility, disbursement, and fraud detection</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'eligibility', label: 'Eligibility', icon: Shield },
          { id: 'disbursement', label: 'Disbursement', icon: DollarSign },
          { id: 'tracking', label: 'Tracking', icon: Activity },
          { id: 'fraud', label: 'Fraud Detection', icon: AlertTriangle },
          { id: 'impact', label: 'Impact', icon: PieChart }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white'
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
                <DollarSign className="w-8 h-8 text-emerald-600" />
                <span className="text-sm text-gray-500">YTD</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ₹{(subsidyStats?.disbursed || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Disbursed (Cr)</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {subsidyStats?.beneficiaries || 0}
              </div>
              <div className="text-sm text-gray-600">Beneficiaries</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-500">Pending</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {pendingDisbursements?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Pending Disbursements</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-500">Rate</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(subsidyStats?.disbursement_rate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Disbursement Rate</div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-emerald-600" />
              AI-Powered Subsidy Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Underserved Regions</div>
                <div className="text-2xl font-bold text-emerald-600">5</div>
                <div className="text-xs text-gray-500">Districts with low uptake</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Optimization Potential</div>
                <div className="text-2xl font-bold text-green-600">₹25Cr</div>
                <div className="text-xs text-gray-500">Additional reach capacity</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Fraud Attempts Blocked</div>
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-xs text-gray-500">This month</div>
              </div>
            </div>
          </div>

          {/* Scheme Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Subsidy Scheme Performance</h3>
            <div className="space-y-3">
              {[
                { id: 'PMFBY', name: 'PMFBY Premium Subsidy', budget: 500, utilized: 390, beneficiaries: 12500, status: 'active' },
                { id: 'MIDH', name: 'MIDH Infrastructure Grant', budget: 250, utilized: 162, beneficiaries: 8200, status: 'active' },
                { id: 'AIF', name: 'AIF Interest Subvention', budget: 800, utilized: 680, beneficiaries: 3500, status: 'active' },
                { id: 'PM-FME', name: 'PM-FME Processing Subsidy', budget: 150, utilized: 68, beneficiaries: 2100, status: 'active' }
              ].map((scheme) => (
                <div key={scheme.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{scheme.name}</div>
                    <div className="text-sm text-gray-500">{scheme.beneficiaries.toLocaleString()} beneficiaries</div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Utilized</div>
                      <div className="font-bold text-gray-900">₹{scheme.utilized}Cr</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Budget</div>
                      <div className="font-bold text-gray-900">₹{scheme.budget}Cr</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Utilization</div>
                      <div className="font-bold text-gray-900">{((scheme.utilized / scheme.budget) * 100).toFixed(1)}%</div>
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

      {/* Eligibility Tab */}
      {activeTab === 'eligibility' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Eligibility Engine</h3>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-emerald-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800">Multi-Scheme Eligibility Checking</div>
                <div className="text-sm text-gray-600">
                  Our AI engine checks eligibility across all schemes simultaneously, identifies cross-scheme optimization opportunities, and provides priority scoring for efficient resource allocation.
                </div>
              </div>
            </div>
          </div>
          <div className="mb-4 flex items-center space-x-4">
            <div className="flex-1">
              <Search className="w-5 h-5 text-gray-400 mb-2" />
              <input aria-label="Search beneficiary..."
                type="text"
                placeholder="Search beneficiary..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              Check Eligibility
            </button>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full eligibility checking interface would be implemented here
          </div>
        </div>
      )}

      {/* Disbursement Tab */}
      {activeTab === 'disbursement' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Disbursement Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Pending Today</div>
              <div className="text-2xl font-bold text-orange-600">156</div>
              <div className="text-xs text-gray-500">Awaiting processing</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">This Week</div>
              <div className="text-2xl font-bold text-green-600">₹2.3Cr</div>
              <div className="text-xs text-gray-500">Successfully disbursed</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Failed</div>
              <div className="text-2xl font-bold text-red-600">3</div>
              <div className="text-xs text-gray-500">Requiring retry</div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { id: 'DIS-001', beneficiary: 'Bornali Gogoi', scheme: 'PMFBY', amount: 15000, status: 'pending', date: '2026-08-04' },
              { id: 'DIS-002', beneficiary: 'Rimon Lyngdoh', scheme: 'MIDH', amount: 50000, status: 'processing', date: '2026-08-04' },
              { id: 'DIS-003', beneficiary: 'Ramcharan Naga', scheme: 'AIF', amount: 75000, status: 'completed', date: '2026-08-03' }
            ].map((disbursement) => (
              <div key={disbursement.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{disbursement.beneficiary}</div>
                  <div className="text-sm text-gray-500">{disbursement.scheme} • ₹{disbursement.amount.toLocaleString()}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">{disbursement.date}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    disbursement.status === 'completed' ? 'bg-green-100 text-green-800' :
                    disbursement.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {disbursement.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracking Tab */}
      {activeTab === 'tracking' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Subsidy Tracking</h3>
          <div className="space-y-4">
            {[
              { id: 'TRK-001', beneficiary: 'Brahmaputra FPC', scheme: 'PMFBY', stage: 'verification', progress: 25 },
              { id: 'TRK-002', beneficiary: 'Ri-Bhoi Honey', scheme: 'MIDH', stage: 'disbursement', progress: 75 },
              { id: 'TRK-003', beneficiary: 'Ukhrul Farmers', scheme: 'AIF', stage: 'completed', progress: 100 }
            ].map((track) => (
              <div key={track.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-800">{track.beneficiary}</div>
                    <div className="text-sm text-gray-500">{track.scheme}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    track.stage === 'completed' ? 'bg-green-100 text-green-800' :
                    track.stage === 'disbursement' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {track.stage}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${track.progress}%` }}></div>
                  </div>
                  <span className="text-sm text-gray-600">{track.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fraud Detection Tab */}
      {activeTab === 'fraud' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Fraud Detection</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800">AI-Powered Fraud Detection</div>
                <div className="text-sm text-gray-600">
                  Our AI engine uses pattern recognition, identity verification, and geographic analysis to detect and prevent subsidy fraud. This month, 12 fraud attempts were blocked.
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Duplicate Detection</div>
              <div className="text-2xl font-bold text-orange-600">5</div>
              <div className="text-xs text-gray-500">Blocked this month</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Identity Verification</div>
              <div className="text-2xl font-bold text-blue-600">4</div>
              <div className="text-xs text-gray-500">Failed verification</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Geographic Anomalies</div>
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-xs text-gray-500">Flagged for review</div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full fraud detection interface would be implemented here
          </div>
        </div>
      )}

      {/* Impact Tab */}
      {activeTab === 'impact' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Impact Measurement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Economic Impact</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Income Increase</span>
                  <span className="font-medium text-green-600">+35%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Productivity Gain</span>
                  <span className="font-medium text-green-600">+28%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ROI</span>
                  <span className="font-medium text-blue-600">4.2x</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Social Impact</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Livelihoods Created</span>
                  <span className="font-medium text-green-600">8,500</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rural Employment</span>
                  <span className="font-medium text-green-600">+15%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Women Beneficiaries</span>
                  <span className="font-medium text-blue-600">42%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubsidyManagementPage