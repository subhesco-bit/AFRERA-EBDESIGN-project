import { useState } from 'react'
import { Calculator, Beaker, CloudRain, Mountain, BarChart3 } from 'lucide-react'
import {
  waterBudgetingAPI,
  waterQualityAPI,
  rainwaterHarvestingAPI,
  watershedManagementAPI,
  waterAnalyticsAPI,
} from '../services/api'

/**
 * Consolidated Water domain sub-modules: M076 (Water Budgeting), M077 (Water
 * Quality Monitoring), M078 (Rainwater Harvesting), M079 (Watershed
 * Management), M080 (Water Analytics) - backend/src/modules/M076-M080.
 *
 * Rebuilt (2026-08-28) around what the real backend functions actually are:
 * action-oriented operations (create a budget, monitor a system, generate a
 * report), not CRUD resources. The previous version of this page assumed a
 * list/create/update/delete shape none of these five modules ever had -
 * every call failed against a route that was never built. Routed through
 * /api/v1/backend-modules/:moduleId/:operation (backendModuleBridge.js),
 * which calls the real exported function by name.
 *
 * M075 (Irrigation Management) is not a tab here - it has its own page
 * (pages/IrrigationManagementPage.jsx).
 */
const TABS = [
  { id: 'budgeting', label: 'Water Budgeting', icon: Calculator },
  { id: 'quality', label: 'Water Quality', icon: Beaker },
  { id: 'harvesting', label: 'Rainwater Harvesting', icon: CloudRain },
  { id: 'watershed', label: 'Watershed', icon: Mountain },
  { id: 'analytics', label: 'Water Analytics', icon: BarChart3 },
]

/** One real backend operation: a small form of scalar fields plus an optional
 * JSON textarea for whatever nested payload shape the operation expects. */
function ActionCard({ title, description, fields = [], hasJsonPayload, jsonLabel, jsonPlaceholder, onRun }) {
  const [values, setValues] = useState({})
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    setError('')
    setResult(null)
    let payload
    if (hasJsonPayload) {
      try {
        payload = jsonText.trim() ? JSON.parse(jsonText) : {}
        setJsonError('')
      } catch {
        setJsonError('Not valid JSON')
        return
      }
    }
    setLoading(true)
    try {
      const res = await onRun(values, payload)
      setResult(res?.data ?? res)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{description}</p>

      {fields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label htmlFor="type" className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <input id="type"
                type={f.type || 'text'}
                value={values[f.name] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>
      )}

      {hasJsonPayload && (
        <div className="mb-3">
          <label htmlFor="value" className="block text-xs font-medium text-gray-600 mb-1">{jsonLabel}</label>
          <textarea id="value"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono"
            placeholder={jsonPlaceholder}
          />
          {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
        </div>
      )}

      <button
        onClick={handleRun}
        disabled={loading}
        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running…' : 'Run'}
      </button>

      {error && (
        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>
      )}
      {result && (
        <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-x-auto max-h-64">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}

function WaterManagementPage() {
  const [activeTab, setActiveTab] = useState('budgeting')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Water Management</h1>
        <p className="text-gray-600">Water budgeting, quality monitoring, rainwater harvesting, watershed and analytics</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'budgeting' && (
        <div>
          <ActionCard
            title="Create Water Budget"
            description="Register a new water budget for a plot/field."
            hasJsonPayload
            jsonLabel="Budget data (JSON)"
            jsonPlaceholder='{"plot_name": "North Field", "source": "Borewell", "demand_liters": 50000, "supply_liters": 42000, "season": "Kharif"}'
            onRun={(_, payload) => waterBudgetingAPI.createBudget(payload)}
          />
          <ActionCard
            title="Track Water Usage"
            description="Get usage tracking for an existing budget over a period."
            fields={[{ name: 'budgetId', label: 'Budget ID' }, { name: 'period', label: 'Period (e.g. 2026-Q3)' }]}
            onRun={(v) => waterBudgetingAPI.trackUsage(v.budgetId, v.period)}
          />
          <ActionCard
            title="Optimize Water Allocation"
            description="Get an optimized allocation plan for a budget given constraints."
            fields={[{ name: 'budgetId', label: 'Budget ID' }]}
            hasJsonPayload
            jsonLabel="Constraints (JSON)"
            jsonPlaceholder='{"maxDailyLiters": 5000, "priority": "crop"}'
            onRun={(v, payload) => waterBudgetingAPI.optimizeAllocation(v.budgetId, payload)}
          />
          <ActionCard
            title="Generate Budget Report"
            description="Generate a report for a budget."
            fields={[{ name: 'budgetId', label: 'Budget ID' }, { name: 'reportType', label: 'Report type', placeholder: 'summary' }]}
            onRun={(v) => waterBudgetingAPI.generateReport(v.budgetId, v.reportType)}
          />
        </div>
      )}

      {activeTab === 'quality' && (
        <div>
          <ActionCard
            title="Record Water Quality Measurement"
            description="Log a new water quality measurement."
            hasJsonPayload
            jsonLabel="Measurement data (JSON)"
            jsonPlaceholder='{"location": "Borewell 1", "parameter": "pH", "value": 7.2, "unit": "pH", "reading_date": "2026-08-28"}'
            onRun={(_, payload) => waterQualityAPI.recordMeasurement(payload)}
          />
          <ActionCard
            title="Get Compliance Report"
            description="Get a regulatory compliance report for a location."
            fields={[{ name: 'locationId', label: 'Location ID' }, { name: 'period', label: 'Period' }]}
            onRun={(v) => waterQualityAPI.getComplianceReport(v.locationId, v.period)}
          />
          <ActionCard
            title="Monitor Water Quality"
            description="Get the current quality monitoring snapshot for a location."
            fields={[{ name: 'locationId', label: 'Location ID' }]}
            onRun={(v) => waterQualityAPI.monitorQuality(v.locationId)}
          />
          <ActionCard
            title="Get Treatment Recommendations"
            description="Get treatment recommendations for known quality issues."
            fields={[{ name: 'locationId', label: 'Location ID' }]}
            hasJsonPayload
            jsonLabel="Quality issues (JSON array)"
            jsonPlaceholder='["high_fluoride", "high_tds"]'
            onRun={(v, payload) => waterQualityAPI.getTreatmentRecommendations(v.locationId, payload)}
          />
        </div>
      )}

      {activeTab === 'harvesting' && (
        <div>
          <ActionCard
            title="Design Harvesting System"
            description="Design a new rainwater harvesting structure."
            hasJsonPayload
            jsonLabel="Design data (JSON)"
            jsonPlaceholder='{"structure_name": "Pond A", "structure_type": "Farm Pond", "village": "Rampur", "capacity_liters": 100000}'
            onRun={(_, payload) => rainwaterHarvestingAPI.designSystem(payload)}
          />
          <ActionCard
            title="Monitor Collection"
            description="Get collection monitoring data for a system over a period."
            fields={[{ name: 'systemId', label: 'System ID' }, { name: 'period', label: 'Period' }]}
            onRun={(v) => rainwaterHarvestingAPI.monitorCollection(v.systemId, v.period)}
          />
          <ActionCard
            title="Calculate Water Budget"
            description="Calculate the water budget for a system over a time frame."
            fields={[{ name: 'systemId', label: 'System ID' }, { name: 'timeFrame', label: 'Time frame' }]}
            onRun={(v) => rainwaterHarvestingAPI.calculateBudget(v.systemId, v.timeFrame)}
          />
          <ActionCard
            title="Manage Storage Capacity"
            description="Update storage capacity management for a system."
            fields={[{ name: 'systemId', label: 'System ID' }]}
            hasJsonPayload
            jsonLabel="Management data (JSON)"
            jsonPlaceholder='{"action": "increase", "targetCapacityLiters": 150000}'
            onRun={(v, payload) => rainwaterHarvestingAPI.manageStorage(v.systemId, payload)}
          />
        </div>
      )}

      {activeTab === 'watershed' && (
        <div>
          <ActionCard
            title="Create Watershed Plan"
            description="Create a new watershed management plan."
            hasJsonPayload
            jsonLabel="Plan data (JSON)"
            jsonPlaceholder='{"name": "Hill Watershed 1", "area_hectares": 250, "villages_covered": "Rampur, Ganeshpur"}'
            onRun={(_, payload) => watershedManagementAPI.createPlan(payload)}
          />
          <ActionCard
            title="Monitor Watershed Health"
            description="Get the current health status of a watershed."
            fields={[{ name: 'watershedId', label: 'Watershed ID' }]}
            onRun={(v) => watershedManagementAPI.monitorHealth(v.watershedId)}
          />
          <ActionCard
            title="Implement Conservation Measures"
            description="Record conservation measures being implemented."
            fields={[{ name: 'watershedId', label: 'Watershed ID' }]}
            hasJsonPayload
            jsonLabel="Measures data (JSON)"
            jsonPlaceholder='{"measureType": "check_dam", "status": "Under Treatment"}'
            onRun={(v, payload) => watershedManagementAPI.implementConservation(v.watershedId, payload)}
          />
          <ActionCard
            title="Generate Watershed Report"
            description="Generate a report for a watershed."
            fields={[{ name: 'watershedId', label: 'Watershed ID' }, { name: 'reportType', label: 'Report type', placeholder: 'summary' }]}
            onRun={(v) => watershedManagementAPI.generateReport(v.watershedId, v.reportType)}
          />
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <ActionCard
            title="Generate Water Usage Analytics"
            description="Generate usage analytics for a location/period."
            hasJsonPayload
            jsonLabel="Params (JSON)"
            jsonPlaceholder='{"locationId": "loc-1", "period": "2026-Q3"}'
            onRun={(_, payload) => waterAnalyticsAPI.generateUsageAnalytics(payload)}
          />
          <ActionCard
            title="Create Water Dashboard"
            description="Create a configured analytics dashboard."
            hasJsonPayload
            jsonLabel="Dashboard config (JSON)"
            jsonPlaceholder='{"widgets": ["usage", "efficiency"], "locationId": "loc-1"}'
            onRun={(_, payload) => waterAnalyticsAPI.createDashboard(payload)}
          />
          <ActionCard
            title="Generate Predictive Analysis"
            description="Generate a predictive water-usage forecast."
            hasJsonPayload
            jsonLabel="Prediction params (JSON)"
            jsonPlaceholder='{"locationId": "loc-1", "horizon": "90d"}'
            onRun={(_, payload) => waterAnalyticsAPI.generatePrediction(payload)}
          />
          <ActionCard
            title="Compare Water Performance"
            description="Compare performance across locations."
            hasJsonPayload
            jsonLabel="Comparison params (JSON)"
            jsonPlaceholder='{"locationIds": ["loc-1", "loc-2"], "metrics": ["efficiency"]}'
            onRun={(_, payload) => waterAnalyticsAPI.comparePerformance(payload)}
          />
        </div>
      )}
    </div>
  )
}

export default WaterManagementPage
