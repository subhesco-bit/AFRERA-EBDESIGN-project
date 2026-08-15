import { useState } from 'react'
import { CloudDrizzle, Waves, Bug, Stethoscope, ShieldAlert, Thermometer } from 'lucide-react'
import {
  droughtMonitoringAPI,
  floodMonitoringAPI,
  pestForecastingAPI,
  diseaseForecastingAPI,
  climateRiskAPI,
  agroMeteorologyAPI,
} from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

/**
 * Consolidated Climate domain sub-modules, batch 4: M085 (Drought Monitoring),
 * M086 (Flood Monitoring), M087 (Pest Forecasting), M088 (Disease Forecasting),
 * M089 (Climate Risk Assessment), M090 (Agro-Meteorology).
 *
 * M081/M082/M084 are real (ClimateWeatherPage.jsx), M083 already built
 * (ClimateAdvisoryPage.jsx) — not touched here. Built as one tabbed page
 * rather than 6 standalone pages, matching LandManagementPage.jsx.
 *
 * M087 Pest Forecasting is the one tab with genuine backend support: the
 * D14 climate/weather migration (057) exposes GET /weather/pest-forecast
 * (weatherAPI.pestForecast, already surfaced as a read-only preview on
 * ClimateAdvisoryPage.jsx). There is no create/update/delete route for it,
 * so that tab is read-only here instead of a CRUD form. The other five tabs
 * have no backend route under any name — built against a conventional REST
 * shape, matching the rest of this batch.
 */
const TABS = [
  { id: 'drought', label: 'Drought Monitoring', icon: Thermometer },
  { id: 'flood', label: 'Flood Monitoring', icon: Waves },
  { id: 'pest', label: 'Pest Forecasting', icon: Bug },
  { id: 'disease', label: 'Disease Forecasting', icon: Stethoscope },
  { id: 'risk', label: 'Climate Risk', icon: ShieldAlert },
  { id: 'agromet', label: 'Agro-Meteorology', icon: CloudDrizzle },
]

const SEVERITY = ['Mild', 'Moderate', 'Severe', 'Extreme']
const RISK_TYPES = ['Drought', 'Flood', 'Heatwave', 'Cyclone', 'Frost', 'Hailstorm']
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical']

function ClimateMonitoringPage() {
  const [activeTab, setActiveTab] = useState('drought')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Climate Monitoring</h1>
        <p className="text-gray-600">Drought, flood, pest and disease risk, overall climate risk assessment, and agro-meteorology readings</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-sky-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'drought' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="drought-monitoring"
          idField="id"
          list={(params) => droughtMonitoringAPI.getRecords(params)}
          create={(data) => droughtMonitoringAPI.createRecord(data)}
          update={(id, data) => droughtMonitoringAPI.updateRecord(id, data)}
          remove={(id) => droughtMonitoringAPI.deleteRecord(id)}
          searchPlaceholder="Search by region..."
          emptyMessage="No drought observations recorded yet."
          newLabel="Log Observation"
          backendNote="Backend endpoint /drought-monitoring has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ region: '', severity: 'Mild', spi_index: '', start_date: '', affected_area_hectares: '', notes: '' }}
          requiredFields={['region', 'severity']}
          columns={[
            { key: 'region', label: 'Region' },
            { key: 'severity', label: 'Severity' },
            { key: 'spi_index', label: 'SPI Index' },
            { key: 'start_date', label: 'Started' },
            { key: 'affected_area_hectares', label: 'Affected Area (ha)' },
          ]}
          fields={[
            { name: 'region', label: 'Region / district', required: true },
            { name: 'severity', label: 'Severity', type: 'select', options: SEVERITY },
            { name: 'spi_index', label: 'SPI index', type: 'number', step: '0.01' },
            { name: 'start_date', label: 'Start date', type: 'date' },
            { name: 'affected_area_hectares', label: 'Affected area (ha)', type: 'number' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Regions tracked', value: new Set(items.map((i) => i.region).filter(Boolean)).size },
            { label: 'Severe or worse', value: items.filter((i) => i.severity === 'Severe' || i.severity === 'Extreme').length },
          ]}
        />
      )}

      {activeTab === 'flood' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="flood-monitoring"
          idField="id"
          list={(params) => floodMonitoringAPI.getRecords(params)}
          create={(data) => floodMonitoringAPI.createRecord(data)}
          update={(id, data) => floodMonitoringAPI.updateRecord(id, data)}
          remove={(id) => floodMonitoringAPI.deleteRecord(id)}
          searchPlaceholder="Search by region..."
          emptyMessage="No flood observations recorded yet."
          newLabel="Log Observation"
          backendNote="Backend endpoint /flood-monitoring has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ region: '', severity: 'Mild', water_level_m: '', rainfall_mm: '', start_date: '', affected_area_hectares: '', notes: '' }}
          requiredFields={['region', 'severity']}
          columns={[
            { key: 'region', label: 'Region' },
            { key: 'severity', label: 'Severity' },
            { key: 'water_level_m', label: 'Water Level (m)' },
            { key: 'rainfall_mm', label: 'Rainfall (mm)' },
            { key: 'start_date', label: 'Started' },
          ]}
          fields={[
            { name: 'region', label: 'Region / district', required: true },
            { name: 'severity', label: 'Severity', type: 'select', options: SEVERITY },
            { name: 'water_level_m', label: 'Water level (m)', type: 'number', step: '0.01' },
            { name: 'rainfall_mm', label: 'Rainfall (mm)', type: 'number' },
            { name: 'start_date', label: 'Start date', type: 'date' },
            { name: 'affected_area_hectares', label: 'Affected area (ha)', type: 'number' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Regions tracked', value: new Set(items.map((i) => i.region).filter(Boolean)).size },
            { label: 'Severe or worse', value: items.filter((i) => i.severity === 'Severe' || i.severity === 'Extreme').length },
          ]}
        />
      )}

      {activeTab === 'pest' && (
        <ResourceManager
          compact
          accent="rose"
          queryKey="climate-pest-forecast-full"
          idField="id"
          list={(params) => pestForecastingAPI.getForecasts(params)}
          searchPlaceholder="Search by pest or region..."
          emptyMessage="No pest forecast data available."
          backendNote="Backend endpoint GET /weather/pest-forecast exists (migration 057) and is read from here — but there is no create/update/delete route for it, so this tab is read-only. The same feed is previewed on the Climate Advisory page."
          initialForm={{}}
          columns={[
            { key: 'pest', label: 'Pest', render: (r) => r.pest || r.risk || '—' },
            { key: 'region', label: 'Region' },
            { key: 'risk_level', label: 'Risk Level', render: (r) => r.risk_level || r.severity || '—' },
            { key: 'forecast_date', label: 'Forecast Date', render: (r) => r.forecast_date || r.date || '—' },
          ]}
          fields={[]}
        />
      )}

      {activeTab === 'disease' && (
        <ResourceManager
          compact
          accent="purple"
          queryKey="disease-forecasting"
          idField="id"
          list={(params) => diseaseForecastingAPI.getForecasts(params)}
          create={(data) => diseaseForecastingAPI.createForecast(data)}
          update={(id, data) => diseaseForecastingAPI.updateForecast(id, data)}
          remove={(id) => diseaseForecastingAPI.deleteForecast(id)}
          searchPlaceholder="Search by crop or disease..."
          emptyMessage="No disease forecasts recorded yet."
          newLabel="Add Forecast"
          backendNote="Backend endpoint /disease-forecasting has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ crop: '', disease_name: '', risk_level: 'Low', region: '', forecast_date: '', notes: '' }}
          requiredFields={['crop', 'disease_name']}
          columns={[
            { key: 'crop', label: 'Crop' },
            { key: 'disease_name', label: 'Disease' },
            { key: 'risk_level', label: 'Risk' },
            { key: 'region', label: 'Region' },
            { key: 'forecast_date', label: 'Forecast Date' },
          ]}
          fields={[
            { name: 'crop', label: 'Crop', required: true },
            { name: 'disease_name', label: 'Disease name', required: true },
            { name: 'risk_level', label: 'Risk level', type: 'select', options: RISK_LEVELS },
            { name: 'region', label: 'Region / district' },
            { name: 'forecast_date', label: 'Forecast date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Forecasts', value: items.length },
            { label: 'High or critical risk', value: items.filter((i) => i.risk_level === 'High' || i.risk_level === 'Critical').length },
          ]}
        />
      )}

      {activeTab === 'risk' && (
        <ResourceManager
          compact
          accent="red"
          queryKey="climate-risk-assessment"
          idField="id"
          list={(params) => climateRiskAPI.getAssessments(params)}
          create={(data) => climateRiskAPI.createAssessment(data)}
          update={(id, data) => climateRiskAPI.updateAssessment(id, data)}
          remove={(id) => climateRiskAPI.deleteAssessment(id)}
          searchPlaceholder="Search by region..."
          emptyMessage="No risk assessments recorded yet."
          newLabel="Add Assessment"
          backendNote="Backend endpoint /climate-risk has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ region: '', risk_type: 'Drought', risk_score: '', assessment_date: '', mitigation_plan: '' }}
          requiredFields={['region', 'risk_type']}
          columns={[
            { key: 'region', label: 'Region' },
            { key: 'risk_type', label: 'Risk Type' },
            { key: 'risk_score', label: 'Risk Score' },
            { key: 'assessment_date', label: 'Assessed' },
          ]}
          fields={[
            { name: 'region', label: 'Region / district', required: true },
            { name: 'risk_type', label: 'Risk type', type: 'select', options: RISK_TYPES },
            { name: 'risk_score', label: 'Risk score (0-100)', type: 'number' },
            { name: 'assessment_date', label: 'Assessment date', type: 'date' },
            { name: 'mitigation_plan', label: 'Mitigation plan', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Assessments', value: items.length },
            { label: 'Avg risk score', value: items.length ? (items.reduce((s, i) => s + (Number(i.risk_score) || 0), 0) / items.length).toFixed(1) : 0 },
          ]}
        />
      )}

      {activeTab === 'agromet' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="agro-meteorology"
          idField="id"
          list={(params) => agroMeteorologyAPI.getRecords(params)}
          create={(data) => agroMeteorologyAPI.createRecord(data)}
          update={(id, data) => agroMeteorologyAPI.updateRecord(id, data)}
          remove={(id) => agroMeteorologyAPI.deleteRecord(id)}
          searchPlaceholder="Search by station or region..."
          emptyMessage="No agro-meteorology readings recorded yet."
          newLabel="Log Reading"
          backendNote="Backend endpoint /agro-meteorology has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ station_name: '', region: '', temperature_c: '', humidity_pct: '', rainfall_mm: '', wind_speed_kmph: '', recorded_date: '' }}
          requiredFields={['station_name']}
          columns={[
            { key: 'station_name', label: 'Station' },
            { key: 'region', label: 'Region' },
            { key: 'temperature_c', label: 'Temp (°C)' },
            { key: 'humidity_pct', label: 'Humidity (%)' },
            { key: 'rainfall_mm', label: 'Rainfall (mm)' },
            { key: 'recorded_date', label: 'Recorded' },
          ]}
          fields={[
            { name: 'station_name', label: 'Weather station', required: true },
            { name: 'region', label: 'Region / district' },
            { name: 'temperature_c', label: 'Temperature (°C)', type: 'number', step: '0.1' },
            { name: 'humidity_pct', label: 'Humidity (%)', type: 'number' },
            { name: 'rainfall_mm', label: 'Rainfall (mm)', type: 'number' },
            { name: 'wind_speed_kmph', label: 'Wind speed (km/h)', type: 'number' },
            { name: 'recorded_date', label: 'Recorded date', type: 'date' },
          ]}
          stats={(items) => [
            { label: 'Readings', value: items.length },
            { label: 'Stations', value: new Set(items.map((i) => i.station_name).filter(Boolean)).size },
          ]}
        />
      )}
    </div>
  )
}

export default ClimateMonitoringPage
