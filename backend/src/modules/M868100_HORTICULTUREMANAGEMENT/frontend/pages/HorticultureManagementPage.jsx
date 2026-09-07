import { useState } from 'react'
import { Carrot, Flower2, Warehouse, Tent, Droplets, Wind, Radar, ShieldCheck, BarChart3 } from 'lucide-react'
import {
  vegetableProductionAPI,
  floricultureAPI,
  greenhouseAPI,
  polyhouseAPI,
  hydroponicsAPI,
  aeroponicsAPI,
  precisionHorticultureAPI,
  protectedCultivationAPI,
  horticultureAnalyticsAPI,
} from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

/**
 * Consolidated Horticulture domain sub-modules, batch 4: M142 (Vegetable
 * Production), M143 (Floriculture Management), M144 (Greenhouse Management),
 * M145 (Polyhouse Management), M146 (Hydroponics Management), M147
 * (Aeroponics Management), M148 (Precision Horticulture), M149 (Protected
 * Cultivation), M150 (Horticulture Analytics). M141 (Orchard Management)
 * already has a real page (OrchardManagementPage.jsx) — not touched here.
 *
 * M148 Precision Horticulture is confirmed ABSENT in 19_HIDDEN_MODULES.md
 * (no trace anywhere in backend or frontend) — genuinely missing.
 *
 * Greenhouse Management (M144) has genuine backend support:
 * backend/src/services/greenhouseService.js is mounted directly in index.js
 * (not a router file) with action endpoints — POST /greenhouse/design,
 * POST /greenhouse/optimize, GET /greenhouse/:id/monitor,
 * POST /greenhouse/predict-yield, POST /greenhouse/dpr, POST
 * /greenhouse/cost-estimate — but no GET list route, so the registry table
 * here still targets a conventional (not yet built) path while a "Quick
 * Monitor" lookup uses the real GET /greenhouse/:id/monitor endpoint.
 */
const TABS = [
  { id: 'vegetable', label: 'Vegetable Production', icon: Carrot },
  { id: 'floriculture', label: 'Floriculture', icon: Flower2 },
  { id: 'greenhouse', label: 'Greenhouse', icon: Warehouse },
  { id: 'polyhouse', label: 'Polyhouse', icon: Tent },
  { id: 'hydroponics', label: 'Hydroponics', icon: Droplets },
  { id: 'aeroponics', label: 'Aeroponics', icon: Wind },
  { id: 'precision', label: 'Precision Horticulture', icon: Radar },
  { id: 'protected', label: 'Protected Cultivation', icon: ShieldCheck },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

const BLOOM_STAGES = ['Bud', 'Bloom', 'Post-Bloom']
const MEDIUMS = ['NFT', 'DWC', 'Aeroponic', 'Ebb-Flow', 'Drip']
const STRUCTURE_TYPES = ['Shade Net', 'Poly Tunnel', 'Greenhouse', 'Mulching']
const STRUCTURE_STATUS = ['Active', 'Under Maintenance', 'Idle']

function HorticultureManagementPage() {
  const [activeTab, setActiveTab] = useState('vegetable')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Horticulture Management</h1>
        <p className="text-gray-600">Vegetables, flowers, controlled-environment structures, hydroponics/aeroponics, precision monitoring and analytics</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'vegetable' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="vegetable-production"
          idField="id"
          list={(params) => vegetableProductionAPI.getRecords(params)}
          create={(data) => vegetableProductionAPI.createRecord(data)}
          update={(id, data) => vegetableProductionAPI.updateRecord(id, data)}
          remove={(id) => vegetableProductionAPI.deleteRecord(id)}
          searchPlaceholder="Search by crop or plot..."
          emptyMessage="No vegetable production records yet."
          newLabel="Add Record"
          backendNote="Backend endpoint /vegetable-production has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ crop_name: '', variety: '', plot: '', area_hectares: '', sowing_date: '', expected_harvest_date: '', yield_kg: '', notes: '' }}
          requiredFields={['crop_name']}
          columns={[
            { key: 'crop_name', label: 'Crop' },
            { key: 'variety', label: 'Variety' },
            { key: 'plot', label: 'Plot' },
            { key: 'area_hectares', label: 'Area (ha)' },
            { key: 'yield_kg', label: 'Yield (kg)' },
          ]}
          fields={[
            { name: 'crop_name', label: 'Crop name', required: true },
            { name: 'variety', label: 'Variety' },
            { name: 'plot', label: 'Plot / field' },
            { name: 'area_hectares', label: 'Area (hectares)', type: 'number' },
            { name: 'sowing_date', label: 'Sowing date', type: 'date' },
            { name: 'expected_harvest_date', label: 'Expected harvest', type: 'date' },
            { name: 'yield_kg', label: 'Yield (kg)', type: 'number' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Crops tracked', value: items.length },
            { label: 'Total area (ha)', value: items.reduce((s, i) => s + (Number(i.area_hectares) || 0), 0).toFixed(1) },
          ]}
        />
      )}

      {activeTab === 'floriculture' && (
        <ResourceManager
          compact
          accent="rose"
          queryKey="floriculture"
          idField="id"
          list={(params) => floricultureAPI.getRecords(params)}
          create={(data) => floricultureAPI.createRecord(data)}
          update={(id, data) => floricultureAPI.updateRecord(id, data)}
          remove={(id) => floricultureAPI.deleteRecord(id)}
          searchPlaceholder="Search by flower or plot..."
          emptyMessage="No floriculture records yet."
          newLabel="Add Record"
          backendNote="Backend endpoint /floriculture has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ flower_name: '', variety: '', plot: '', area_hectares: '', planting_date: '', bloom_stage: 'Bud', notes: '' }}
          requiredFields={['flower_name']}
          columns={[
            { key: 'flower_name', label: 'Flower' },
            { key: 'variety', label: 'Variety' },
            { key: 'plot', label: 'Plot' },
            { key: 'bloom_stage', label: 'Bloom Stage' },
          ]}
          fields={[
            { name: 'flower_name', label: 'Flower name', required: true },
            { name: 'variety', label: 'Variety' },
            { name: 'plot', label: 'Plot / field' },
            { name: 'area_hectares', label: 'Area (hectares)', type: 'number' },
            { name: 'planting_date', label: 'Planting date', type: 'date' },
            { name: 'bloom_stage', label: 'Bloom stage', type: 'select', options: BLOOM_STAGES },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Plots tracked', value: items.length },
            { label: 'In bloom', value: items.filter((i) => i.bloom_stage === 'Bloom').length },
          ]}
        />
      )}

      {activeTab === 'greenhouse' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="greenhouse-registry"
          idField="id"
          list={(params) => greenhouseAPI.getRegistry(params)}
          create={(data) => greenhouseAPI.createEntry(data)}
          update={(id, data) => greenhouseAPI.updateEntry(id, data)}
          remove={(id) => greenhouseAPI.deleteEntry(id)}
          searchPlaceholder="Search by greenhouse name..."
          emptyMessage="No greenhouses registered yet."
          newLabel="Register Greenhouse"
          backendNote="No GET /greenhouse list route exists yet, so this registry tab is wired to a conventional (not-yet-built) /greenhouse-registry path. The real backend (backend/src/services/greenhouseService.js) instead exposes design/optimize/monitor/predict-yield/cost-estimate actions per greenhouse ID — call greenhouseAPI.monitor(id), .design(data), .predictYield(data) or .costEstimate(data) directly once a greenhouse ID is known."
          initialForm={{ greenhouse_name: '', location: '', area_sqm: '', crop: '', structure_type: '', status: 'Active', notes: '' }}
          requiredFields={['greenhouse_name']}
          columns={[
            { key: 'greenhouse_name', label: 'Greenhouse' },
            { key: 'location', label: 'Location' },
            { key: 'crop', label: 'Crop' },
            { key: 'area_sqm', label: 'Area (sqm)' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'greenhouse_name', label: 'Greenhouse name', required: true },
            { name: 'location', label: 'Location' },
            { name: 'area_sqm', label: 'Area (sqm)', type: 'number' },
            { name: 'crop', label: 'Crop grown' },
            { name: 'structure_type', label: 'Structure type' },
            { name: 'status', label: 'Status', type: 'select', options: STRUCTURE_STATUS },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Greenhouses', value: items.length },
            { label: 'Active', value: items.filter((i) => i.status === 'Active').length },
          ]}
        />
      )}

      {activeTab === 'polyhouse' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="polyhouse-management"
          idField="id"
          list={(params) => polyhouseAPI.getRecords(params)}
          create={(data) => polyhouseAPI.createRecord(data)}
          update={(id, data) => polyhouseAPI.updateRecord(id, data)}
          remove={(id) => polyhouseAPI.deleteRecord(id)}
          searchPlaceholder="Search by polyhouse name..."
          emptyMessage="No polyhouses recorded yet."
          newLabel="Add Polyhouse"
          backendNote="Backend endpoint /polyhouse-management has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ polyhouse_name: '', location: '', area_sqm: '', crop: '', construction_date: '', status: 'Active' }}
          requiredFields={['polyhouse_name']}
          columns={[
            { key: 'polyhouse_name', label: 'Polyhouse' },
            { key: 'location', label: 'Location' },
            { key: 'crop', label: 'Crop' },
            { key: 'area_sqm', label: 'Area (sqm)' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'polyhouse_name', label: 'Polyhouse name', required: true },
            { name: 'location', label: 'Location' },
            { name: 'area_sqm', label: 'Area (sqm)', type: 'number' },
            { name: 'crop', label: 'Crop grown' },
            { name: 'construction_date', label: 'Construction date', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: STRUCTURE_STATUS },
          ]}
          stats={(items) => [
            { label: 'Polyhouses', value: items.length },
            { label: 'Active', value: items.filter((i) => i.status === 'Active').length },
          ]}
        />
      )}

      {activeTab === 'hydroponics' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="hydroponics"
          idField="id"
          list={(params) => hydroponicsAPI.getSystems(params)}
          create={(data) => hydroponicsAPI.createSystem(data)}
          update={(id, data) => hydroponicsAPI.updateSystem(id, data)}
          remove={(id) => hydroponicsAPI.deleteSystem(id)}
          searchPlaceholder="Search by system name..."
          emptyMessage="No hydroponic systems recorded yet."
          newLabel="Add System"
          backendNote="Backend endpoint /hydroponics has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ system_name: '', crop: '', medium: 'NFT', ph_level: '', ec_level: '', setup_date: '', notes: '' }}
          requiredFields={['system_name']}
          columns={[
            { key: 'system_name', label: 'System' },
            { key: 'crop', label: 'Crop' },
            { key: 'medium', label: 'Medium' },
            { key: 'ph_level', label: 'pH' },
            { key: 'ec_level', label: 'EC' },
          ]}
          fields={[
            { name: 'system_name', label: 'System name', required: true },
            { name: 'crop', label: 'Crop grown' },
            { name: 'medium', label: 'Growing medium', type: 'select', options: MEDIUMS },
            { name: 'ph_level', label: 'pH level', type: 'number', step: '0.1' },
            { name: 'ec_level', label: 'EC level (mS/cm)', type: 'number', step: '0.1' },
            { name: 'setup_date', label: 'Setup date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Systems', value: items.length },
          ]}
        />
      )}

      {activeTab === 'aeroponics' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="aeroponics"
          idField="id"
          list={(params) => aeroponicsAPI.getSystems(params)}
          create={(data) => aeroponicsAPI.createSystem(data)}
          update={(id, data) => aeroponicsAPI.updateSystem(id, data)}
          remove={(id) => aeroponicsAPI.deleteSystem(id)}
          searchPlaceholder="Search by system name..."
          emptyMessage="No aeroponic systems recorded yet."
          newLabel="Add System"
          backendNote="Backend endpoint /aeroponics has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ system_name: '', crop: '', mist_interval_min: '', nutrient_solution: '', setup_date: '', notes: '' }}
          requiredFields={['system_name']}
          columns={[
            { key: 'system_name', label: 'System' },
            { key: 'crop', label: 'Crop' },
            { key: 'mist_interval_min', label: 'Mist Interval (min)' },
            { key: 'setup_date', label: 'Setup' },
          ]}
          fields={[
            { name: 'system_name', label: 'System name', required: true },
            { name: 'crop', label: 'Crop grown' },
            { name: 'mist_interval_min', label: 'Mist interval (minutes)', type: 'number' },
            { name: 'nutrient_solution', label: 'Nutrient solution' },
            { name: 'setup_date', label: 'Setup date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Systems', value: items.length },
          ]}
        />
      )}

      {activeTab === 'precision' && (
        <ResourceManager
          compact
          accent="purple"
          queryKey="precision-horticulture"
          idField="id"
          list={(params) => precisionHorticultureAPI.getReadings(params)}
          create={(data) => precisionHorticultureAPI.createReading(data)}
          update={(id, data) => precisionHorticultureAPI.updateReading(id, data)}
          remove={(id) => precisionHorticultureAPI.deleteReading(id)}
          searchPlaceholder="Search by plot or sensor..."
          emptyMessage="No precision horticulture readings recorded yet."
          newLabel="Log Reading"
          backendNote="M148 is confirmed absent from the codebase (no trace under any name) — genuinely new. Backend endpoint /precision-horticulture has not been built yet; this tab is wired and ready to work once it is."
          initialForm={{ field_plot: '', sensor_type: '', metric_tracked: '', target_range: '', current_reading: '', recorded_date: '' }}
          requiredFields={['field_plot']}
          columns={[
            { key: 'field_plot', label: 'Plot' },
            { key: 'sensor_type', label: 'Sensor' },
            { key: 'metric_tracked', label: 'Metric' },
            { key: 'current_reading', label: 'Reading' },
            { key: 'recorded_date', label: 'Date' },
          ]}
          fields={[
            { name: 'field_plot', label: 'Field / plot', required: true },
            { name: 'sensor_type', label: 'Sensor type' },
            { name: 'metric_tracked', label: 'Metric tracked' },
            { name: 'target_range', label: 'Target range' },
            { name: 'current_reading', label: 'Current reading' },
            { name: 'recorded_date', label: 'Recorded date', type: 'date' },
          ]}
          stats={(items) => [
            { label: 'Readings', value: items.length },
            { label: 'Plots monitored', value: new Set(items.map((i) => i.field_plot).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'protected' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="protected-cultivation"
          idField="id"
          list={(params) => protectedCultivationAPI.getStructures(params)}
          create={(data) => protectedCultivationAPI.createStructure(data)}
          update={(id, data) => protectedCultivationAPI.updateStructure(id, data)}
          remove={(id) => protectedCultivationAPI.deleteStructure(id)}
          searchPlaceholder="Search by structure or crop..."
          emptyMessage="No protected cultivation structures recorded yet."
          newLabel="Add Structure"
          backendNote="Backend endpoint /protected-cultivation has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ structure_type: 'Shade Net', crop: '', area_sqm: '', setup_date: '', status: 'Active' }}
          requiredFields={['structure_type']}
          columns={[
            { key: 'structure_type', label: 'Structure' },
            { key: 'crop', label: 'Crop' },
            { key: 'area_sqm', label: 'Area (sqm)' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'structure_type', label: 'Structure type', type: 'select', options: STRUCTURE_TYPES },
            { name: 'crop', label: 'Crop grown' },
            { name: 'area_sqm', label: 'Area (sqm)', type: 'number' },
            { name: 'setup_date', label: 'Setup date', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: STRUCTURE_STATUS },
          ]}
          stats={(items) => [
            { label: 'Structures', value: items.length },
          ]}
        />
      )}

      {activeTab === 'analytics' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="horticulture-analytics"
          idField="id"
          list={(params) => horticultureAnalyticsAPI.getMetrics(params)}
          create={(data) => horticultureAnalyticsAPI.createMetric(data)}
          update={(id, data) => horticultureAnalyticsAPI.updateMetric(id, data)}
          remove={(id) => horticultureAnalyticsAPI.deleteMetric(id)}
          searchPlaceholder="Search by metric..."
          emptyMessage="No analytics metrics recorded yet."
          newLabel="Add Metric"
          backendNote="Backend endpoint /horticulture-analytics has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ metric_name: '', crop_category: '', value: '', unit: '', period: '', notes: '' }}
          requiredFields={['metric_name']}
          columns={[
            { key: 'metric_name', label: 'Metric' },
            { key: 'crop_category', label: 'Category' },
            { key: 'value', label: 'Value' },
            { key: 'period', label: 'Period' },
          ]}
          fields={[
            { name: 'metric_name', label: 'Metric name', required: true },
            { name: 'crop_category', label: 'Crop category' },
            { name: 'value', label: 'Value', type: 'number' },
            { name: 'unit', label: 'Unit' },
            { name: 'period', label: 'Period' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Metrics tracked', value: items.length },
          ]}
        />
      )}
    </div>
  )
}

export default HorticultureManagementPage
