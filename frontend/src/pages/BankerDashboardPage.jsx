import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Shield, FileText, Users, DollarSign, AlertTriangle, BarChart3, PieChart, Activity, Download } from 'lucide-react';
import { bankerAPI } from '../services/api';

function BankerDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: portfolioStats } = useQuery({
    queryKey: ['banker-portfolio'],
    queryFn: () => bankerAPI.getPortfolio().then(r => r.data),
  });

  const { data: riskDashboard } = useQuery({
    queryKey: ['banker-risk'],
    queryFn: () => bankerAPI.getRiskDashboard().then(r => r.data),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Banker Dashboard</h1>
        <p className="text-gray-600">AI-powered credit assessment and portfolio management for agricultural lending</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'credit-scoring', label: 'Credit Scoring', icon: Shield },
          { id: 'loan-applications', label: 'Loan Applications', icon: FileText },
          { id: 'portfolio', label: 'Portfolio', icon: PieChart },
          { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle },
          { id: 'reports', label: 'Reports', icon: Download },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ?
                'bg-blue-600 text-white' :
                'bg-white text-gray-700 hover:bg-gray-100'
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
                <DollarSign className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-500">This Month</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ₹{(portfolioStats?.total_disbursed || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Disbursed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-500">Active</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {portfolioStats?.active_loans || 0}
              </div>
              <div className="text-sm text-gray-600">Active Loans</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-500">Rate</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(portfolioStats?.approval_rate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Approval Rate</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <span className="text-sm text-gray-500">NPA</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(portfolioStats?.npa_rate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">NPA Rate</div>
            </div>
          </div>

          {/* AI Insights - illustrative only. bankerAPI.getPortfolio() /
              getRiskDashboard() call /banker/portfolio and /banker/risk-dashboard,
              which have no matching backend route yet (see services/api.js
              comment above bankerAPI), so there is no live figure to show here.
              These numbers used to be hardcoded as if live; now labeled honestly. */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                AI-Powered Insights
              </h3>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
                Example — not live
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This is a sample of what AI-scored portfolio insights will look like once the credit-scoring engine is connected to real loan data.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">High-Potential Borrowers</div>
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-xs text-gray-500">Example: farmers with 750+ credit score</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Risk Alerts</div>
                <div className="text-2xl font-bold text-orange-600">3</div>
                <div className="text-xs text-gray-500">Example: loans requiring attention</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Portfolio Opportunity</div>
                <div className="text-2xl font-bold text-green-600">₹2.5Cr</div>
                <div className="text-xs text-gray-500">Example: additional lending capacity</div>
              </div>
            </div>
          </div>

          {/* Recent Applications - sample rows illustrating the workflow;
              no loan-application-list endpoint exists on the backend yet. */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Recent Loan Applications</h3>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
                Example — not live
              </span>
            </div>
            <div className="space-y-3">
              {[
                { id: 'APP-001', farmer: 'Bornali Gogoi', amount: 500000, score: 780, status: 'approved' },
                { id: 'APP-002', farmer: 'Rimon Lyngdoh', amount: 750000, score: 720, status: 'pending' },
                { id: 'APP-003', farmer: 'Ramcharan Naga', amount: 300000, score: 680, status: 'review' },
              ].map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{app.farmer}</div>
                    <div className="text-sm text-gray-500">Loan Amount: ₹{app.amount.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Credit Score</div>
                      <div className="font-bold text-gray-900">{app.score}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Credit Scoring Tab */}
      {activeTab === 'credit-scoring' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Credit Scoring Engine</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800">Multi-Factor Credit Assessment</div>
                <div className="text-sm text-gray-600">
                  Our AI engine considers FDI score, payment history, seasonal cash flow, collateral value, and vintage to generate comprehensive credit scores.
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Credit Score Factors</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">FDI Score</span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment History</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cash Flow Predictability</span>
                  <span className="font-medium">20%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Collateral Value</span>
                  <span className="font-medium">15%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vintage Score</span>
                  <span className="font-medium">10%</span>
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">Score Distribution</h4>
                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  Example
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-24 text-sm text-gray-600">750-850</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 ml-2">25%</div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm text-gray-600">650-749</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 ml-2">35%</div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm text-gray-600">550-649</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 ml-2">25%</div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm text-gray-600">300-549</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 ml-2">15%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loan Applications Tab */}
      {activeTab === 'loan-applications' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Loan Applications</h3>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
              Example data — no loan-application API is wired up yet
            </span>
          </div>
          <div className="space-y-4">
            {[
              { id: 'APP-001', farmer: 'Bornali Gogoi', type: 'Crop Loan', amount: 500000, purpose: 'Kharif sowing', score: 780, status: 'approved', date: '2026-08-01' },
              { id: 'APP-002', farmer: 'Rimon Lyngdoh', type: 'Equipment Loan', amount: 750000, purpose: 'Tractor purchase', score: 720, status: 'pending', date: '2026-08-02' },
              { id: 'APP-003', farmer: 'Ramcharan Naga', type: 'Working Capital', amount: 300000, purpose: 'Harvest expenses', score: 680, status: 'review', date: '2026-08-03' },
              { id: 'APP-004', farmer: 'Priya Sharma', type: 'Land Development', amount: 1200000, purpose: 'Irrigation system', score: 810, status: 'approved', date: '2026-08-04' },
            ].map((app) => (
              <div key={app.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">{app.farmer}</div>
                    <div className="text-sm text-gray-500">{app.type} • {app.purpose}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Amount</div>
                    <div className="font-medium">₹{app.amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Credit Score</div>
                    <div className="font-medium">{app.score}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Applied On</div>
                    <div className="font-medium">{app.date}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Risk Level</div>
                    <div className={`font-medium ${
                      app.score >= 750 ? 'text-green-600' :
                        app.score >= 650 ? 'text-blue-600' :
                          app.score >= 550 ? 'text-yellow-600' :
                            'text-red-600'
                    }`}>
                      {app.score >= 750 ? 'Low' : app.score >= 650 ? 'Medium' : app.score >= 550 ? 'High' : 'Very High'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex justify-end space-x-2">
                  <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                    View Details
                  </button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Process
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Portfolio Analytics</h3>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
              Example — /banker/portfolio isn't wired to real loan records yet
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Portfolio Composition</h4>
              <div className="space-y-2">
                {[
                  { type: 'Crop Loans', amount: 25000000, percentage: 45, color: 'bg-green-500' },
                  { type: 'Equipment Loans', amount: 15000000, percentage: 27, color: 'bg-blue-500' },
                  { type: 'Working Capital', amount: 10000000, percentage: 18, color: 'bg-purple-500' },
                  { type: 'Land Development', amount: 5000000, percentage: 10, color: 'bg-orange-500' },
                ].map((item) => (
                  <div key={item.type} className="flex items-center">
                    <div className="w-32 text-sm text-gray-600">{item.type}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 ml-2 text-right">{item.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Regional Distribution</h4>
              <div className="space-y-2">
                {[
                  { region: 'Assam', amount: 20000000, percentage: 36 },
                  { region: 'Meghalaya', amount: 15000000, percentage: 27 },
                  { region: 'Nagaland', amount: 12000000, percentage: 22 },
                  { region: 'Manipur', amount: 8000000, percentage: 15 },
                ].map((item) => (
                  <div key={item.region} className="flex items-center">
                    <div className="w-32 text-sm text-gray-600">{item.region}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 ml-2 text-right">{item.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment Tab */}
      {activeTab === 'risk' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Risk Dashboard</h3>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
              Example — riskDashboard has no live figures yet
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Overall Risk</div>
              <div className="text-2xl font-bold text-green-600">Low</div>
              <div className="text-xs text-gray-500">Portfolio health</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">High-Risk Loans</div>
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-xs text-gray-500">Requiring attention</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Stress Test Pass</div>
              <div className="text-2xl font-bold text-blue-600">92%</div>
              <div className="text-xs text-gray-500">Scenario analysis</div>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800">Risk Alerts</div>
                <div className="text-sm text-gray-600">
                  3 loans have shown irregular payment patterns. AI recommends increased monitoring and early intervention.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Regulatory Reports</h3>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
              Example status — report generation isn't wired up yet
            </span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'RBI Monthly Returns', frequency: 'Monthly', status: 'on_track', due: '2026-08-15' },
              { name: 'NABARD Portfolio Report', frequency: 'Quarterly', status: 'pending', due: '2026-09-30' },
              { name: 'Priority Sector Lending', frequency: 'Quarterly', status: 'on_track', due: '2026-09-30' },
              { name: 'NPA Classification Report', frequency: 'Monthly', status: 'on_track', due: '2026-08-15' },
            ].map((report) => (
              <div key={report.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{report.name}</div>
                  <div className="text-sm text-gray-500">Frequency: {report.frequency} • Due: {report.due}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    report.status === 'on_track' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status === 'on_track' ? 'On Track' : 'Pending'}
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
  );
}

export default BankerDashboardPage;
