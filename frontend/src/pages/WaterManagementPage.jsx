import { useState } from 'react'
import { Calculator, Beaker, CloudRain, Mountain, BarChart3 } from 'lucide-react'
import {
  waterBudgetingAPI,
  waterQualityAPI,
  rainwaterHarvestingAPI,
  watershedManagementAPI,
  waterAnalyticsAPI,
} from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

/**
 * Consolidated Water domain sub-modules: M076 (Water Budgeting), M077 (Water
 * Quality Monitoring), M078 (Rainwater Harvesting), M079 (Watershed
 * Management), M080 (Water Analytics).
 *
 * M075 (Irrigation Management) is not a tab here — it already has its own
 * full page (pages/IrrigationManagementPage.jsx) and is out of this batch's
 * scope.
 *
 * Built as one tabbed page (third batch, 2026-08-08), matching the
 * LandManagementPage.jsx pattern. M079 has an empty scaffold at
 * backend/src/modules/M079 (controller.js says "Add route handlers here",
 * not registered in backend/src/index.js) — not real backend support. None
 * of the five tabs have a matching backend route; every tab is wired
 * against a conventional REST shape and flagged with a backendNote.
 */
const TABS = [
  { id: 'budgeting', label: 'Water Budgeting', icon: Calculator },
  { id: 'quality', label: 'Water Quality', icon: Beaker },
  { id: 'harvesting', label: 'Rainwater Harvesting', icon: CloudRain },
  { id: 'watershed', label: 'Watershed', icon: Mountain },
  { id: 'analytics', label: 'Water Analytics', icon: BarChart3 },
]

const WATER_SOURCES = ['Borewell', 'Canal', 'Pond', 'River', 'Rainwater', 'Municipal']
const QUALITY_PARAMS = ['pH', 'TDS', 'EC (Electrical Conductivity)', 'Nitrate', 'Fluoride', 'Hardness']
const HARVEST_TYPES = ['Farm Pond', 'Check Dam', 'Recharge Pit', 'Rooftop Harvesting', 'Percolation Tank']
const WATERSHED_STATUS = ['Planned', 'Under Treatment', 'Treated', 'Monitoring']
const ANALYTICS_METRICS = ['Water Table Level', 'Usage per Acre', 'Rainfall Recorded', 'Runoff Captured', 'Efficiency %']

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
        <ResourceManager
          compact
          accent="blue"
          queryKey="water-budgets"
          idField="id"
          list={(params) => waterBudgetingAPI.getBudgets(params)}
          create={(data) => waterBudgetingAPI.createBudget(data)}
          update={(id, data) => waterBudgetingAPI.updateBudget(id, data)}
          remove={(id) => waterBudgetingAPI.deleteBudget(id)}
          searchPlaceholder="Search by plot/field name..."
          emptyMessage="No water budgets recorded yet."
          newLabel="Add Water Budget"
          backendNote="Backend endpoint /water-budgeting/budgets has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ plot_name: '', source: 'Borewell', demand_liters: '', supply_liters: '', season: '', notes: '' }}
          requiredFields={['plot_name']}
          columns={[
            { key: 'plot_name', label: 'Plot / Field' },
            { key: 'source', label: 'Source' },
            { key: 'demand_liters', label: 'Demand (L)' },
            { key: 'supply_liters', label: 'Supply (L)' },
            { key: 'season', label: 'Season' },
          ]}
          fields={[
            { name: 'plot_name', label: 'Plot / field name', required: true },
            { name: 'source', label: 'Water source', type: 'select', options: WATER_SOURCES },
            { name: 'demand_liters', label: 'Demand (litres)', type: 'number' },
            { name: 'supply_liters', label: 'Supply (litres)', type: 'number' },
            { name: 'season', label: 'Season (Kharif/Rabi/Zaid)' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Budgets tracked', value: items.length },
            { label: 'Total demand (L)', value: items.reduce((s, i) => s + (Number(i.demand_liters) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'quality' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="water-quality-readings"
          idField="id"
          list={(params) => waterQualityAPI.getReadings(params)}
          create={(data) => waterQualityAPI.createReading(data)}
          update={(id, data) => waterQualityAPI.updateReading(id, data)}
          remove={(id) => waterQualityAPI.deleteReading(id)}
          searchPlaceholder="Search by source or location..."
          emptyMessage="No water quality readings recorded yet."
          newLabel="Add Reading"
          backendNote="Backend endpoint /water-quality/readings has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ location: '', parameter: 'pH', value: '', unit: '', reading_date: '', notes: '' }}
          requiredFields={['location', 'parameter']}
          columns={[
            { key: 'location', label: 'Location' },
            { key: 'parameter', label: 'Parameter' },
            { key: 'value', label: 'Value' },
            { key: 'unit', label: 'Unit' },
            { key: 'reading_date', label: 'Date' },
          ]}
          fields={[
            { name: 'location', label: 'Location / source', required: true },
            { name: 'parameter', label: 'Parameter tested', type: 'select', options: QUALITY_PARAMS },
            { name: 'value', label: 'Reading value', type: 'number', step: 'any' },
            { name: 'unit', label: 'Unit' },
            { name: 'reading_date', label: 'Reading date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Readings', value: items.length },
            { label: 'Locations covered', value: new Set(items.map((i) => i.location).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'harvesting' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="rainwater-harvesting-structures"
          idField="id"
          list={(params) => rainwaterHarvestingAPI.getStructures(params)}
          create={(data) => rainwaterHarvestingAPI.createStructure(data)}
          update={(id, data) => rainwaterHarvestingAPI.updateStructure(id, data)}
          remove={(id) => rainwaterHarvestingAPI.deleteStructure(id)}
          searchPlaceholder="Search by structure name or village..."
          emptyMessage="No rainwater harvesting structures recorded yet."
          newLabel="Add Structure"
          backendNote="Backend endpoint /rainwater-harvesting/structures has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ structure_name: '', structure_type: 'Farm Pond', village: '', capacity_liters: '', built_date: '', notes: '' }}
          requiredFields={['structure_name', 'structure_type']}
          columns={[
            { key: 'structure_name', label: 'Structure' },
            { key: 'structure_type', label: 'Type' },
            { key: 'village', label: 'Village' },
            { key: 'capacity_liters', label: 'Capacity (L)' },
          ]}
          fields={[
            { name: 'structure_name', label: 'Structure name', required: true },
            { name: 'structure_type', label: 'Structure type', type: 'select', options: HARVEST_TYPES },
            { name: 'village', label: 'Village' },
            { name: 'capacity_liters', label: 'Capacity (litres)', type: 'number' },
            { name: 'built_date', label: 'Built date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Structures', value: items.length },
            { label: 'Total capacity (L)', value: items.reduce((s, i) => s + (Number(i.capacity_liters) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'watershed' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="watersheds"
          idField="id"
          list={(params) => watershedManagementAPI.getWatersheds(params)}
          create={(data) => watershedManagementAPI.createWatershed(data)}
          update={(id, data) => watershedManagementAPI.updateWatershed(id, data)}
          remove={(id) => watershedManagementAPI.deleteWatershed(id)}
          searchPlaceholder="Search by watershed name..."
          emptyMessage="No watersheds recorded yet."
          newLabel="Add Watershed"
          backendNote="Backend endpoint /watersheds has not been built yet — this tab is wired and ready to work once it is. (backend/src/modules/M079 is an empty scaffold — controller.js has no real handlers and is not registered in backend/src/index.js.)"
          initialForm={{ name: '', area_hectares: '', status: 'Planned', villages_covered: '', notes: '' }}
          requiredFields={['name']}
          columns={[
            { key: 'name', label: 'Watershed' },
            { key: 'area_hectares', label: 'Area (ha)' },
            { key: 'status', label: 'Status' },
            { key: 'villages_covered', label: 'Villages Covered' },
          ]}
          fields={[
            { name: 'name', label: 'Watershed name', required: true },
            { name: 'area_hectares', label: 'Area (hectares)', type: 'number' },
            { name: 'status', label: 'Treatment status', type: 'select', options: WATERSHED_STATUS },
            { name: 'villages_covered', label: 'Villages covered' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Watersheds', value: items.length },
            { label: 'Total area (ha)', value: items.reduce((s, i) => s + (Number(i.area_hectares) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'analytics' && (
        <ResourceManager
          compact
          accent="purple"
          queryKey="water-analytics-records"
          idField="id"
          list={(params) => waterAnalyticsAPI.getRecords(params)}
          create={(data) => waterAnalyticsAPI.createRecord(data)}
          update={(id, data) => waterAnalyticsAPI.updateRecord(id, data)}
          remove={(id) => waterAnalyticsAPI.deleteRecord(id)}
          searchPlaceholder="Search by metric or period..."
          emptyMessage="No water analytics entries recorded yet."
          newLabel="Add Analytics Entry"
          backendNote="Backend endpoint /water-analytics/records has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ metric: 'Water Table Level', period: '', value: '', unit: '', notes: '' }}
          requiredFields={['metric', 'period']}
          columns={[
            { key: 'metric', label: 'Metric' },
            { key: 'period', label: 'Period' },
            { key: 'value', label: 'Value' },
            { key: 'unit', label: 'Unit' },
          ]}
          fields={[
            { name: 'metric', label: 'Metric', type: 'select', options: ANALYTICS_METRICS },
            { name: 'period', label: 'Period (e.g. 2026-Q3)', required: true },
            { name: 'value', label: 'Value', type: 'number' },
            { name: 'unit', label: 'Unit (e.g. m, %, mm)' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Entries', value: items.length },
            { label: 'Metrics tracked', value: new Set(items.map((i) => i.metric).filter(Boolean)).size },
          ]}
        />
      )}
    </div>
  )
}

export default WaterManagementPage
