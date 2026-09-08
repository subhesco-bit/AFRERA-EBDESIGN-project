import { useState } from 'react';
import { Droplets } from 'lucide-react';
import {
  waterBudgetRecordsAPI, waterQualityRecordsAPI, rainwaterStructuresAPI,
  watershedRecordsAPI, waterAnalyticsRecordsAPI,
} from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

/**
 * Real backend: backend/src/routes/waterManagementRoutes.js +
 * services/legacy/waterManagementService.js (water_budgets,
 * water_quality_readings, rainwater_harvesting_structures, watersheds,
 * water_analytics_records tables via resourceCrudFactory). Distinct from the
 * M076-M080 engineering-calculation bridge already covered by
 * WaterManagementPage.jsx - this is the simple structures/readings registry,
 * confirmed real and functional but with no frontend caller until now
 * (2026-08-29). Field lists come straight from waterManagementService.js's
 * own `fields`/`requiredFields` config, not invented.
 */
const TABS = [
  ['budgets', 'Water Budgets'],
  ['quality', 'Water Quality Readings'],
  ['structures', 'Rainwater Structures'],
  ['watersheds', 'Watersheds'],
  ['analytics', 'Analytics Records'],
];

function WaterRecordsPage() {
  const [tab, setTab] = useState('budgets');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Droplets className="w-6 h-6 mr-2 text-cyan-600" />
          Water Records
        </h1>
        <p className="text-gray-600">Registry of water budgets, quality readings, rainwater structures, watersheds and analytics records.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'budgets' && (
        <ResourceManager
          compact accent="teal" queryKey="water-budget-records"
          list={waterBudgetRecordsAPI.list} create={waterBudgetRecordsAPI.create}
          update={waterBudgetRecordsAPI.update} remove={waterBudgetRecordsAPI.remove}
          emptyMessage="No water budgets recorded yet." newLabel="Add Water Budget"
          initialForm={{ plot_name: '', source: '', demand_liters: '', supply_liters: '', season: '', notes: '' }}
          requiredFields={['plot_name']}
          columns={[
            { key: 'plot_name', label: 'Plot' }, { key: 'source', label: 'Source' },
            { key: 'demand_liters', label: 'Demand (L)' }, { key: 'supply_liters', label: 'Supply (L)' },
            { key: 'season', label: 'Season' },
          ]}
          fields={[
            { name: 'plot_name', label: 'Plot name', required: true },
            { name: 'source', label: 'Source' },
            { name: 'demand_liters', label: 'Demand (litres)', type: 'number' },
            { name: 'supply_liters', label: 'Supply (litres)', type: 'number' },
            { name: 'season', label: 'Season' },
            { name: 'notes', label: 'Notes' },
          ]}
        />
      )}

      {tab === 'quality' && (
        <ResourceManager
          compact accent="blue" queryKey="water-quality-records"
          list={waterQualityRecordsAPI.list} create={waterQualityRecordsAPI.create}
          update={waterQualityRecordsAPI.update} remove={waterQualityRecordsAPI.remove}
          emptyMessage="No water quality readings recorded yet." newLabel="Add Reading"
          initialForm={{ location: '', parameter: '', value: '', unit: '', reading_date: '', notes: '' }}
          requiredFields={['location', 'parameter']}
          columns={[
            { key: 'location', label: 'Location' }, { key: 'parameter', label: 'Parameter' },
            { key: 'value', label: 'Value' }, { key: 'unit', label: 'Unit' },
            { key: 'reading_date', label: 'Date' },
          ]}
          fields={[
            { name: 'location', label: 'Location', required: true },
            { name: 'parameter', label: 'Parameter', required: true },
            { name: 'value', label: 'Value', type: 'number' },
            { name: 'unit', label: 'Unit' },
            { name: 'reading_date', label: 'Reading date', type: 'date' },
            { name: 'notes', label: 'Notes' },
          ]}
        />
      )}

      {tab === 'structures' && (
        <ResourceManager
          compact accent="indigo" queryKey="rainwater-structure-records"
          list={rainwaterStructuresAPI.list} create={rainwaterStructuresAPI.create}
          update={rainwaterStructuresAPI.update} remove={rainwaterStructuresAPI.remove}
          emptyMessage="No rainwater harvesting structures recorded yet." newLabel="Add Structure"
          initialForm={{ structure_name: '', structure_type: '', village: '', capacity_liters: '', built_date: '', notes: '' }}
          requiredFields={['structure_name', 'structure_type']}
          columns={[
            { key: 'structure_name', label: 'Name' }, { key: 'structure_type', label: 'Type' },
            { key: 'village', label: 'Village' }, { key: 'capacity_liters', label: 'Capacity (L)' },
          ]}
          fields={[
            { name: 'structure_name', label: 'Structure name', required: true },
            { name: 'structure_type', label: 'Structure type', required: true },
            { name: 'village', label: 'Village' },
            { name: 'capacity_liters', label: 'Capacity (litres)', type: 'number' },
            { name: 'built_date', label: 'Built date', type: 'date' },
            { name: 'notes', label: 'Notes' },
          ]}
        />
      )}

      {tab === 'watersheds' && (
        <ResourceManager
          compact accent="green" queryKey="watershed-records"
          list={watershedRecordsAPI.list} create={watershedRecordsAPI.create}
          update={watershedRecordsAPI.update} remove={watershedRecordsAPI.remove}
          emptyMessage="No watersheds recorded yet." newLabel="Add Watershed"
          initialForm={{ name: '', area_hectares: '', status: '', villages_covered: '', notes: '' }}
          requiredFields={['name']}
          columns={[
            { key: 'name', label: 'Name' }, { key: 'area_hectares', label: 'Area (ha)' },
            { key: 'status', label: 'Status' }, { key: 'villages_covered', label: 'Villages Covered' },
          ]}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'area_hectares', label: 'Area (hectares)', type: 'number' },
            { name: 'status', label: 'Status' },
            { name: 'villages_covered', label: 'Villages covered' },
            { name: 'notes', label: 'Notes' },
          ]}
        />
      )}

      {tab === 'analytics' && (
        <ResourceManager
          compact accent="purple" queryKey="water-analytics-records"
          list={waterAnalyticsRecordsAPI.list} create={waterAnalyticsRecordsAPI.create}
          update={waterAnalyticsRecordsAPI.update} remove={waterAnalyticsRecordsAPI.remove}
          emptyMessage="No water analytics records yet." newLabel="Add Record"
          initialForm={{ metric: '', period: '', value: '', unit: '', notes: '' }}
          requiredFields={['metric', 'period']}
          columns={[
            { key: 'metric', label: 'Metric' }, { key: 'period', label: 'Period' },
            { key: 'value', label: 'Value' }, { key: 'unit', label: 'Unit' },
          ]}
          fields={[
            { name: 'metric', label: 'Metric', required: true },
            { name: 'period', label: 'Period', required: true },
            { name: 'value', label: 'Value', type: 'number' },
            { name: 'unit', label: 'Unit' },
            { name: 'notes', label: 'Notes' },
          ]}
        />
      )}
    </div>
  );
}

export default WaterRecordsPage;
