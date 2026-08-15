import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Layers, FlaskConical, Leaf, TestTube2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { soilHealthAPI, nutrientManagementAPI, fertilityManagementAPI, soilTestingOpsAPI } from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

/**
 * Consolidated Soil domain sub-modules: M071 (Soil Health), M073 (Nutrient
 * Management), M074 (Fertility Management), M072 (Soil Test Management).
 *
 * M072 was originally out of scope for this batch (see prior header note
 * below) because soilTestingService.js's real backend is action-based
 * (submit sample, submit lab results, track, health-card, INM plan, organic
 * input plan) rather than a list+create+delete resource, so it doesn't fit
 * ResourceManager. Wired 2026-08-11 as its own tab with a purpose-built panel
 * instead — see SoilTestingTab below. This is the first of the four tabs
 * backed by a real, already-mounted route (backend/src/index.js calls
 * soilTestingService.setupRoutes(app)); the other three still target
 * conventional-but-unbuilt paths (see each backendNote).
 *
 * Built as one tabbed page (third batch, 2026-08-08), matching the
 * LandManagementPage.jsx pattern. M074 has an empty scaffold at
 * backend/src/modules/M074 (controller.js says "Add route handlers here",
 * not registered in backend/src/index.js) — not real backend support, so
 * treated the same as the other two: wired against a conventional REST
 * shape and flagged with a backendNote.
 */
const TABS = [
  { id: 'health', label: 'Soil Health', icon: Layers },
  { id: 'nutrient', label: 'Nutrient Management', icon: FlaskConical },
  { id: 'fertility', label: 'Fertility Management', icon: Leaf },
  { id: 'testing', label: 'Soil Testing (Lab)', icon: TestTube2 },
]

function SoilTestingTab() {
  const [sampleForm, setSampleForm] = useState({ plot_name: '', crop: '', sample_date: '' })
  const [lastSampleId, setLastSampleId] = useState(null)
  const [trackId, setTrackId] = useState('')

  const submitSampleMutation = useMutation({
    mutationFn: (data) => soilTestingOpsAPI.submitSample(data),
    onSuccess: (res) => {
      const id = res.data?.data?.id ?? res.data?.id
      setLastSampleId(id)
      toast.success(id ? `Sample submitted (ID ${id})` : 'Sample submitted')
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to submit sample'),
  })

  const { data: tracked, refetch: refetchTrack, isFetching: trackLoading } = useQuery({
    queryKey: ['soil-sample-track', trackId],
    queryFn: () => soilTestingOpsAPI.trackSample(trackId).then((r) => r.data?.data ?? r.data),
    enabled: false,
  })

  const { data: healthCard } = useQuery({
    queryKey: ['soil-testing-health-card'],
    queryFn: () => soilTestingOpsAPI.getHealthCard({}).then((r) => r.data?.data ?? r.data),
  })

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        Individual lab test samples (M072) — distinct from the plot-level Soil Health cards in the first
        tab. Backed by backend/src/services/soilTestingService.js.
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Submit a Soil Sample</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!sampleForm.plot_name) {
              toast.error('Plot / field name is required')
              return
            }
            submitSampleMutation.mutate(sampleForm)
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            value={sampleForm.plot_name}
            onChange={(e) => setSampleForm({ ...sampleForm, plot_name: e.target.value })}
            placeholder="Plot / field name *"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <input
            value={sampleForm.crop}
            onChange={(e) => setSampleForm({ ...sampleForm, crop: e.target.value })}
            placeholder="Crop"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <input
            type="date"
            value={sampleForm.sample_date}
            onChange={(e) => setSampleForm({ ...sampleForm, sample_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={submitSampleMutation.isPending}
            className="md:col-span-3 px-4 py-2 bg-amber-700 text-white rounded-lg font-medium hover:bg-amber-800 transition disabled:opacity-60"
          >
            {submitSampleMutation.isPending ? 'Submitting...' : 'Submit Sample'}
          </button>
        </form>
        {lastSampleId && (
          <p className="text-sm text-gray-500 mt-3">Last submitted sample ID: <span className="font-medium">{lastSampleId}</span> — use it below to track results.</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Track a Sample</h3>
        <div className="flex items-center space-x-3">
          <input
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            placeholder="Sample ID"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={() => trackId && refetchTrack()}
            disabled={!trackId || trackLoading}
            className="px-4 py-2 bg-amber-700 text-white rounded-lg font-medium hover:bg-amber-800 transition disabled:opacity-60"
          >
            {trackLoading ? 'Checking...' : 'Track'}
          </button>
        </div>
        {tracked && (
          <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto mt-4">{JSON.stringify(tracked, null, 2)}</pre>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Soil Health Card (aggregate)</h3>
        {healthCard ? (
          <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto">{JSON.stringify(healthCard, null, 2)}</pre>
        ) : (
          <p className="text-sm text-gray-500">No health card data yet.</p>
        )}
      </div>
    </div>
  )
}

const HEALTH_RATINGS = ['Excellent', 'Good', 'Moderate', 'Poor', 'Degraded']
const NUTRIENT_FOCUS = ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)', 'Balanced NPK', 'Secondary/Micronutrients']
const FERTILITY_STATUS = ['High', 'Medium', 'Low']

function SoilManagementPage() {
  const [activeTab, setActiveTab] = useState('health')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Soil Management</h1>
        <p className="text-gray-600">Soil health cards, nutrient management plans and fertility tracking</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-amber-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'health' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="soil-health-cards"
          idField="id"
          list={(params) => soilHealthAPI.getCards(params)}
          create={(data) => soilHealthAPI.createCard(data)}
          update={(id, data) => soilHealthAPI.updateCard(id, data)}
          remove={(id) => soilHealthAPI.deleteCard(id)}
          searchPlaceholder="Search by plot/field name..."
          emptyMessage="No soil health cards recorded yet."
          newLabel="Add Soil Health Card"
          backendNote="Backend endpoint /soil-health/cards has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ plot_name: '', ph_level: '', organic_matter_percent: '', rating: 'Moderate', recommendation: '', card_date: '' }}
          requiredFields={['plot_name']}
          columns={[
            { key: 'plot_name', label: 'Plot / Field' },
            { key: 'ph_level', label: 'pH' },
            { key: 'organic_matter_percent', label: 'Organic Matter %' },
            { key: 'rating', label: 'Rating' },
            { key: 'card_date', label: 'Date' },
          ]}
          fields={[
            { name: 'plot_name', label: 'Plot / field name', required: true },
            { name: 'ph_level', label: 'pH level', type: 'number', step: '0.1' },
            { name: 'organic_matter_percent', label: 'Organic matter (%)', type: 'number', step: '0.1' },
            { name: 'rating', label: 'Overall rating', type: 'select', options: HEALTH_RATINGS },
            { name: 'card_date', label: 'Card date', type: 'date' },
            { name: 'recommendation', label: 'Recommendation', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Health cards', value: items.length },
            { label: 'Avg. pH', value: items.length ? (items.reduce((s, i) => s + (Number(i.ph_level) || 0), 0) / items.length).toFixed(1) : '—' },
          ]}
        />
      )}

      {activeTab === 'nutrient' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="nutrient-management-plans"
          idField="id"
          list={(params) => nutrientManagementAPI.getPlans(params)}
          create={(data) => nutrientManagementAPI.createPlan(data)}
          update={(id, data) => nutrientManagementAPI.updatePlan(id, data)}
          remove={(id) => nutrientManagementAPI.deletePlan(id)}
          searchPlaceholder="Search by plot/field name..."
          emptyMessage="No nutrient management plans recorded yet."
          newLabel="Add Nutrient Plan"
          backendNote="Backend endpoint /nutrient-management/plans has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ plot_name: '', crop: '', focus: 'Balanced NPK', dose_recommendation: '', plan_date: '', notes: '' }}
          requiredFields={['plot_name']}
          columns={[
            { key: 'plot_name', label: 'Plot / Field' },
            { key: 'crop', label: 'Crop' },
            { key: 'focus', label: 'Focus' },
            { key: 'plan_date', label: 'Date' },
          ]}
          fields={[
            { name: 'plot_name', label: 'Plot / field name', required: true },
            { name: 'crop', label: 'Crop' },
            { name: 'focus', label: 'Nutrient focus', type: 'select', options: NUTRIENT_FOCUS },
            { name: 'dose_recommendation', label: 'Dose recommendation' },
            { name: 'plan_date', label: 'Plan date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Plans', value: items.length },
            { label: 'Crops covered', value: new Set(items.map((i) => i.crop).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'fertility' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="fertility-management-records"
          idField="id"
          list={(params) => fertilityManagementAPI.getRecords(params)}
          create={(data) => fertilityManagementAPI.createRecord(data)}
          update={(id, data) => fertilityManagementAPI.updateRecord(id, data)}
          remove={(id) => fertilityManagementAPI.deleteRecord(id)}
          searchPlaceholder="Search by plot/field name..."
          emptyMessage="No fertility records yet."
          newLabel="Add Fertility Record"
          backendNote="Backend endpoint /fertility-management/records has not been built yet — this tab is wired and ready to work once it is. (backend/src/modules/M074 is an empty scaffold — controller.js has no real handlers and is not registered in backend/src/index.js.)"
          initialForm={{ plot_name: '', nitrogen_status: 'Medium', phosphorus_status: 'Medium', potassium_status: 'Medium', assessed_date: '', notes: '' }}
          requiredFields={['plot_name']}
          columns={[
            { key: 'plot_name', label: 'Plot / Field' },
            { key: 'nitrogen_status', label: 'N' },
            { key: 'phosphorus_status', label: 'P' },
            { key: 'potassium_status', label: 'K' },
            { key: 'assessed_date', label: 'Assessed' },
          ]}
          fields={[
            { name: 'plot_name', label: 'Plot / field name', required: true },
            { name: 'nitrogen_status', label: 'Nitrogen status', type: 'select', options: FERTILITY_STATUS },
            { name: 'phosphorus_status', label: 'Phosphorus status', type: 'select', options: FERTILITY_STATUS },
            { name: 'potassium_status', label: 'Potassium status', type: 'select', options: FERTILITY_STATUS },
            { name: 'assessed_date', label: 'Assessed date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Records', value: items.length },
            { label: 'Low nitrogen plots', value: items.filter((i) => i.nitrogen_status === 'Low').length },
          ]}
        />
      )}

      {activeTab === 'testing' && <SoilTestingTab />}
    </div>
  )
}

export default SoilManagementPage
