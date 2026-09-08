import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calculator, FileText, Shield, Users, CheckCircle, BarChart3, Activity, Building2, AlertTriangle } from 'lucide-react';
import { caAPI, complianceAPI } from '../services/api';

function CADashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: auditStats } = useQuery({
    queryKey: ['ca-audit'],
    queryFn: () => caAPI.getAuditStats().then(r => r.data),
  });

  // Real, working backend endpoints (backend/src/routes/complianceRoutes.js +
  // services/legacy/complianceService.js) - unlike caAPI.getAuditStats() above
  // (/ca/audit-stats has no backend route), these are genuinely wired up and
  // read from the tds_deductions table.
  const { data: tdsSummary, isLoading: tdsLoading, isError: tdsError } = useQuery({
    queryKey: ['tds-summary'],
    queryFn: () => complianceAPI.tdsSummary({}).then(r => r.data?.data),
    enabled: activeTab === 'tax',
    retry: false,
  });

  const { data: tdsRates } = useQuery({
    queryKey: ['tds-rates'],
    queryFn: () => complianceAPI.tdsRates().then(r => r.data?.data),
    enabled: activeTab === 'tax',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">CA Portal</h1>
        <p className="text-gray-600">AI-powered financial auditing, tax compliance, and FPO accounting services</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'auditing', label: 'Auditing', icon: Shield },
          { id: 'tax', label: 'Tax Compliance', icon: Calculator },
          { id: 'fpo', label: 'FPO Accounting', icon: Building2 },
          { id: 'reports', label: 'Reports', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ?
                'bg-indigo-600 text-white' :
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
                <FileText className="w-8 h-8 text-indigo-600" />
                <span className="text-sm text-gray-500">Active</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {auditStats?.active_audits || 0}
              </div>
              <div className="text-sm text-gray-600">Active Audits</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-500">Clients</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {auditStats?.clients || 0}
              </div>
              <div className="text-sm text-gray-600">FPOs & Farmers</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-500">This Month</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(auditStats?.completion_rate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-500">Compliance</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(auditStats?.compliance_rate || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Compliance Rate</div>
            </div>
          </div>

          {/* AI Insights - illustrative only. caAPI.getAuditStats() calls
              /ca/audit-stats, which has no matching backend route yet (see
              services/api.js comment above caAPI), so there's no live audit
              data to summarize. Numbers below are examples, not live figures. */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                AI-Powered Audit Insights
              </h3>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
                Example — not live
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Anomalies Detected</div>
                <div className="text-2xl font-bold text-orange-600">5</div>
                <div className="text-xs text-gray-500">Example: requiring review this month</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Tax Savings Identified</div>
                <div className="text-2xl font-bold text-green-600">₹8.5L</div>
                <div className="text-xs text-gray-500">Example: through optimization</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Compliance Gaps</div>
                <div className="text-2xl font-bold text-blue-600">2</div>
                <div className="text-xs text-gray-500">Example: need attention</div>
              </div>
            </div>
          </div>

          {/* Recent Audits - sample rows; no audit-list endpoint exists yet. */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Recent Audits</h3>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
                Example — not live
              </span>
            </div>
            <div className="space-y-3">
              {[
                { id: 'AUD-001', client: 'Brahmaputra FPC', type: 'Financial Audit', status: 'completed', date: '2026-08-01' },
                { id: 'AUD-002', client: 'Ri-Bhoi Honey Cluster', type: 'GST Compliance', status: 'in_progress', date: '2026-08-02' },
                { id: 'AUD-003', client: 'Ukhrul Farmers Group', type: 'Tax Audit', status: 'pending', date: '2026-08-03' },
              ].map((audit) => (
                <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{audit.client}</div>
                    <div className="text-sm text-gray-500">{audit.type}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">{audit.date}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      audit.status === 'completed' ? 'bg-green-100 text-green-800' :
                        audit.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                    }`}>
                      {audit.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Auditing Tab */}
      {activeTab === 'auditing' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Auditing Engine</h3>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-indigo-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800">Automated Transaction Reconciliation</div>
                <div className="text-sm text-gray-600">
                  Our AI engine automatically reconciles transactions, detects anomalies, and generates audit trails with 95% accuracy.
                </div>
              </div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            Full auditing interface would be implemented here
          </div>
        </div>
      )}

      {/* Tax Tab - TDS section now uses the real complianceAPI (backend
          tds_deductions table). GST/GSTR figures below it are still examples:
          the backend has real /compliance/gstr/draft and /compliance/rcm
          endpoints but they operate per-invoice/per-period rather than
          exposing a summary stat, so there's no single "GST compliance %" to
          fetch - shown honestly as illustrative rather than invented as if live. */}
      {activeTab === 'tax' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tax Compliance</h3>

          <div className="border rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-3">TDS Summary (live)</h4>
            {tdsLoading && <div className="text-sm text-gray-500">Loading TDS summary...</div>}
            {tdsError && (
              <div className="text-sm text-gray-500">
                Couldn't load the live TDS summary right now (the compliance database may not be reachable). Try again shortly.
              </div>
            )}
            {!tdsLoading && !tdsError && tdsSummary && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Period</span>
                  <span className="font-medium">{tdsSummary.financialYear} {tdsSummary.quarter}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total TDS Deducted</span>
                  <span className="font-medium text-blue-600">₹{(tdsSummary.totalTdsInr || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Undeposited Cases</span>
                  <span className={`font-medium ${tdsSummary.undepositedCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {tdsSummary.undepositedCount || 0}
                  </span>
                </div>
                {tdsSummary.warning && (
                  <div className="flex items-start bg-orange-50 border border-orange-200 rounded p-3 mt-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-700">{tdsSummary.warning}</span>
                  </div>
                )}
                {(!tdsSummary.bySection || tdsSummary.bySection.length === 0) && (
                  <div className="text-sm text-gray-500 pt-2">No TDS deductions recorded for this period yet.</div>
                )}
              </div>
            )}
          </div>

          {tdsRates && (
            <div className="border rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-800 mb-3">TDS Rates by Deductee Type (live)</h4>
              <div className="space-y-2">
                {Object.entries(tdsRates).map(([type, cfg]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{type.replace(/_/g, ' ')} ({cfg.section})</span>
                    <span className="font-medium">{cfg.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800">GST Compliance</h4>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                Example
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST Registered</span>
                <span className="font-medium text-green-600">95%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Filing Compliance</span>
                <span className="font-medium text-green-600">92%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Input Tax Credit</span>
                <span className="font-medium text-blue-600">₹2.3Cr</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FPO Tab */}
      {activeTab === 'fpo' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">FPO Accounting</h3>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
              Example — no per-FPO accounting API is wired up yet
            </span>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Brahmaputra FPC', members: 450, turnover: 12, profit: 2.3, status: 'compliant' },
              { name: 'Ri-Bhoi Honey Cluster', members: 120, turnover: 8, profit: 1.8, status: 'review' },
              { name: 'Ukhrul Farmers Group', members: 85, turnover: 5, profit: 0.9, status: 'compliant' },
            ].map((fpo) => (
              <div key={fpo.name} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">{fpo.name}</div>
                    <div className="text-sm text-gray-500">{fpo.members} members</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    fpo.status === 'compliant' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                  }`}>
                    {fpo.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Turnover</div>
                    <div className="font-medium">₹{fpo.turnover}Cr</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Profit</div>
                    <div className="font-medium">₹{fpo.profit}Cr</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Per Member</div>
                    <div className="font-medium">₹{(fpo.profit * 10000000 / fpo.members).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Audit Status</div>
                    <div className="font-medium text-green-600">Current</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Reports</h3>
          <div className="space-y-3">
            {[
              { name: 'Profit & Loss Statement', type: 'Financial', frequency: 'Quarterly' },
              { name: 'Balance Sheet', type: 'Financial', frequency: 'Quarterly' },
              { name: 'Cash Flow Statement', type: 'Financial', frequency: 'Monthly' },
              { name: 'GST Compliance Report', type: 'Tax', frequency: 'Monthly' },
              { name: 'TDS Reconciliation', type: 'Tax', frequency: 'Quarterly' },
            ].map((report) => (
              <div key={report.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{report.name}</div>
                  <div className="text-sm text-gray-500">{report.type} • {report.frequency}</div>
                </div>
                <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                  Generate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CADashboardPage;
