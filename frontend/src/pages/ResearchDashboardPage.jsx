import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, FileText, Users, Database, Activity, BookOpen, Flask, BarChart3 } from 'lucide-react'
import { researchAPI } from '../services/api'

function ResearchDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const { data: researchStats } = useQuery('research-stats', () =>
    researchAPI.getStats().then(r => r.data)
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Research Portal</h1>
        <p className="text-gray-600">Field trial management, data partnerships, and innovation research platform</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'trials', label: 'Field Trials', icon: Flask },
          { id: 'data', label: 'Data Partnerships', icon: Database },
          { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          { id: 'collaboration', label: 'Collaboration', icon: Users }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white'
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
                <Flask className="w-8 h-8 text-teal-600" />
                <span className="text-sm text-gray-500">Active</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {researchStats?.active_trials || 0}
              </div>
              <div className="text-sm text-gray-600">Field Trials</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Database className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {researchStats?.data_points || 0}
              </div>
              <div className="text-sm text-gray-600">Data Points</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-500">Partners</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {researchStats?.partners || 0}
              </div>
              <div className="text-sm text-gray-600">Data Partners</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-500">Published</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {researchStats?.publications || 0}
              </div>
              <div className="text-sm text-gray-600">Publications</div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-teal-600" />
              AI-Powered Research Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Trial Optimization</div>
                <div className="text-2xl font-bold text-teal-600">+35%</div>
                <div className="text-xs text-gray-500">Through AI design</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Data Quality</div>
                <div className="text-2xl font-bold text-green-600">92%</div>
                <div className="text-xs text-gray-500">Automated validation</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Discovery Rate</div>
                <div className="text-2xl font-bold text-blue-600">+28%</div>
                <div className="text-xs text-gray-500">Pattern recognition</div>
              </div>
            </div>
          </div>

          {/* Active Trials */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Field Trials</h3>
            <div className="space-y-3">
              {[
                { id: 'TRIAL-001', name: 'Chak-Hao Black Rice Variety', location: 'Imphal', phase: 'Phase 2', duration: '12 months', status: 'ongoing' },
                { id: 'TRIAL-002', name: 'Karbi Anglong Ginger Yield', location: 'Karbi Anglong', phase: 'Phase 1', duration: '6 months', status: 'ongoing' },
                { id: 'TRIAL-003', name: 'Organic Tea Cultivation', location: 'Assam', phase: 'Phase 3', duration: '18 months', status: 'completed' }
              ].map((trial) => (
                <div key={trial.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{trial.name}</div>
                    <div className="text-sm text-gray-500">{trial.location} • {trial.phase} • {trial.duration}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    trial.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {trial.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Field Trials Tab */}
      {activeTab === 'trials' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Field Trial Management</h3>
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Flask className="w-5 h-5 text-teal-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800">AI-Powered Trial Design</div>
                <div className="text-sm text-gray-600">
                  Our AI engine optimizes trial design, automates data collection, performs statistical analysis, and generates comprehensive reports.
                </div>
              </div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full field trial management interface would be implemented here
          </div>
        </div>
      )}

      {/* Data Partnerships Tab */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Partnerships</h3>
          <div className="space-y-3">
            {[
              { partner: 'Assam Agricultural University', type: 'Academic', data_points: 50000, status: 'active' },
              { partner: 'ICAR Research Complex', type: 'Government', data_points: 75000, status: 'active' },
              { partner: 'Meghalaya Bamboo Mission', type: 'Government', data_points: 35000, status: 'pending' }
            ].map((partner) => (
              <div key={partner.partner} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{partner.partner}</div>
                  <div className="text-sm text-gray-500">{partner.type} • {partner.data_points.toLocaleString()} data points</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  partner.status === 'active' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {partner.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'knowledge' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Knowledge Base</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Best Practices</h4>
              <div className="text-sm text-gray-600">125 documented practices</div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Technology Assessments</h4>
              <div className="text-sm text-gray-600">45 technology evaluations</div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Case Studies</h4>
              <div className="text-sm text-gray-600">30 detailed case studies</div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Research Papers</h4>
              <div className="text-sm text-gray-600">85 peer-reviewed papers</div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Analytics Platform</h3>
          <div className="text-center py-8 text-gray-500">
            Full analytics platform interface would be implemented here
          </div>
        </div>
      )}

      {/* Collaboration Tab */}
      {activeTab === 'collaboration' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Collaborative Research</h3>
          <div className="space-y-3">
            {[
              { id: 'COL-001', name: 'Climate-Resilient Crops', partners: 5, status: 'active', timeline: '24 months' },
              { id: 'COL-002', name: 'Organic Certification Framework', partners: 3, status: 'planning', timeline: '18 months' },
              { id: 'COL-003', name: 'Post-Harvest Technology', partners: 4, status: 'active', timeline: '12 months' }
            ].map((collab) => (
              <div key={collab.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">{collab.name}</div>
                    <div className="text-sm text-gray-500">{collab.partners} partners • {collab.timeline}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    collab.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {collab.status}
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

export default ResearchDashboardPage