import { useState } from 'react';
import { Waves, Egg, Fish, Droplet, HeartPulse, Anchor, Factory, Snowflake, BarChart3 } from 'lucide-react';
import {
  biofloccFarmAPI,
  hatcheryManagementAPI,
  fishFeedAPI,
  fisheriesWaterQualityAPI,
  fishHealthAPI,
  fisheriesHarvestAPI,
  fishProcessingAPI,
  coldFishChainAPI,
  aquacultureAnalyticsAPI,
} from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

/**
 * Consolidated Fisheries domain sub-modules, batch 4: M131 (Biofloc Farm
 * Management), M133 (Hatchery Management), M134 (Fish Feed Management), M135
 * (Water Quality Control), M136 (Fish Health Management), M137 (Harvest
 * Management), M138 (Fish Processing Management), M139 (Cold Fish Chain),
 * M140 (Aquaculture Analytics). M132 (Pond Management) already has a real
 * page (PondManagementPage.jsx) — not touched here. None of these nine have
 * a dedicated backend route under any name — all built against conventional
 * REST shapes.
 */
const TABS = [
  { id: 'biofloc', label: 'Biofloc Farms', icon: Waves },
  { id: 'hatchery', label: 'Hatchery', icon: Egg },
  { id: 'feed', label: 'Fish Feed', icon: Fish },
  { id: 'water', label: 'Water Quality', icon: Droplet },
  { id: 'health', label: 'Fish Health', icon: HeartPulse },
  { id: 'harvest', label: 'Harvest', icon: Anchor },
  { id: 'processing', label: 'Processing', icon: Factory },
  { id: 'coldchain', label: 'Cold Chain', icon: Snowflake },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const FEED_TYPES = ['Pellet', 'Natural', 'Supplementary'];
const PROCESSING_TYPES = ['Cleaning', 'Filleting', 'Freezing', 'Smoking', 'Drying'];
const SHIPMENT_STATUS = ['In Transit', 'Delivered', 'Delayed'];
const HATCHERY_STATUS = ['Incubating', 'Hatched', 'Failed'];

function FisheriesManagementPage() {
  const [activeTab, setActiveTab] = useState('biofloc');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Fisheries Management</h1>
        <p className="text-gray-600">Biofloc farms, hatcheries, feed, water quality, fish health, harvest, processing, cold chain and analytics</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-cyan-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'biofloc' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="biofloc-farms"
          idField="id"
          list={(params) => biofloccFarmAPI.getTanks(params)}
          create={(data) => biofloccFarmAPI.createTank(data)}
          update={(id, data) => biofloccFarmAPI.updateTank(id, data)}
          remove={(id) => biofloccFarmAPI.deleteTank(id)}
          searchPlaceholder="Search by tank or species..."
          emptyMessage="No biofloc tanks recorded yet."
          newLabel="Add Tank"
          backendNote="Backend endpoint /biofloc-farms has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ tank_id: '', species: '', stocking_density: '', floc_volume_index: '', water_temp_c: '', setup_date: '', notes: '' }}
          requiredFields={['tank_id', 'species']}
          columns={[
            { key: 'tank_id', label: 'Tank' },
            { key: 'species', label: 'Species' },
            { key: 'stocking_density', label: 'Stocking Density' },
            { key: 'water_temp_c', label: 'Temp (°C)' },
          ]}
          fields={[
            { name: 'tank_id', label: 'Tank ID', required: true },
            { name: 'species', label: 'Species', required: true },
            { name: 'stocking_density', label: 'Stocking density (per m³)', type: 'number' },
            { name: 'floc_volume_index', label: 'Floc volume index', type: 'number', step: '0.1' },
            { name: 'water_temp_c', label: 'Water temperature (°C)', type: 'number', step: '0.1' },
            { name: 'setup_date', label: 'Setup date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Tanks', value: items.length },
            { label: 'Species tracked', value: new Set(items.map((i) => i.species).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'hatchery' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="hatchery-management"
          idField="id"
          list={(params) => hatcheryManagementAPI.getBatches(params)}
          create={(data) => hatcheryManagementAPI.createBatch(data)}
          update={(id, data) => hatcheryManagementAPI.updateBatch(id, data)}
          remove={(id) => hatcheryManagementAPI.deleteBatch(id)}
          searchPlaceholder="Search by hatchery or species..."
          emptyMessage="No hatchery batches recorded yet."
          newLabel="Add Batch"
          backendNote="Backend endpoint /hatchery-management has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ hatchery_name: '', species: '', batch_size: '', spawning_date: '', hatch_rate_pct: '', status: 'Incubating' }}
          requiredFields={['hatchery_name', 'species']}
          columns={[
            { key: 'hatchery_name', label: 'Hatchery' },
            { key: 'species', label: 'Species' },
            { key: 'batch_size', label: 'Batch Size' },
            { key: 'hatch_rate_pct', label: 'Hatch Rate %' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'hatchery_name', label: 'Hatchery name', required: true },
            { name: 'species', label: 'Species', required: true },
            { name: 'batch_size', label: 'Batch size', type: 'number' },
            { name: 'spawning_date', label: 'Spawning date', type: 'date' },
            { name: 'hatch_rate_pct', label: 'Hatch rate (%)', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', options: HATCHERY_STATUS },
          ]}
          stats={(items) => [
            { label: 'Batches', value: items.length },
            { label: 'Total batch size', value: items.reduce((s, i) => s + (Number(i.batch_size) || 0), 0) },
          ]}
        />
      )}

      {activeTab === 'feed' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="fish-feed"
          idField="id"
          list={(params) => fishFeedAPI.getLogs(params)}
          create={(data) => fishFeedAPI.createLog(data)}
          update={(id, data) => fishFeedAPI.updateLog(id, data)}
          remove={(id) => fishFeedAPI.deleteLog(id)}
          searchPlaceholder="Search by feed or pond..."
          emptyMessage="No feed logs recorded yet."
          newLabel="Log Feeding"
          backendNote="Backend endpoint /fish-feed has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ feed_name: '', pond_tank: '', feed_type: 'Pellet', quantity_kg: '', feeding_date: '', cost: '' }}
          requiredFields={['feed_name', 'pond_tank']}
          columns={[
            { key: 'feed_name', label: 'Feed' },
            { key: 'pond_tank', label: 'Pond / Tank' },
            { key: 'feed_type', label: 'Type' },
            { key: 'quantity_kg', label: 'Quantity (kg)' },
            { key: 'feeding_date', label: 'Date' },
          ]}
          fields={[
            { name: 'feed_name', label: 'Feed name', required: true },
            { name: 'pond_tank', label: 'Pond / tank', required: true },
            { name: 'feed_type', label: 'Feed type', type: 'select', options: FEED_TYPES },
            { name: 'quantity_kg', label: 'Quantity (kg)', type: 'number' },
            { name: 'feeding_date', label: 'Feeding date', type: 'date' },
            { name: 'cost', label: 'Cost (₹)', type: 'number' },
          ]}
          stats={(items) => [
            { label: 'Feed logs', value: items.length },
            { label: 'Total quantity (kg)', value: items.reduce((s, i) => s + (Number(i.quantity_kg) || 0), 0).toFixed(1) },
          ]}
        />
      )}

      {activeTab === 'water' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="fisheries-water-quality"
          idField="id"
          list={(params) => fisheriesWaterQualityAPI.getReadings(params)}
          create={(data) => fisheriesWaterQualityAPI.createReading(data)}
          update={(id, data) => fisheriesWaterQualityAPI.updateReading(id, data)}
          remove={(id) => fisheriesWaterQualityAPI.deleteReading(id)}
          searchPlaceholder="Search by pond or tank..."
          emptyMessage="No water quality readings recorded yet."
          newLabel="Log Reading"
          backendNote="Backend endpoint /fisheries-water-quality has not been built yet — this tab is wired and ready to work once it is. Distinct from Water domain's water-quality module, this is pond/tank-specific."
          initialForm={{ pond_tank: '', ph_level: '', dissolved_oxygen: '', ammonia_level: '', temperature_c: '', tested_date: '' }}
          requiredFields={['pond_tank']}
          columns={[
            { key: 'pond_tank', label: 'Pond / Tank' },
            { key: 'ph_level', label: 'pH' },
            { key: 'dissolved_oxygen', label: 'DO (mg/L)' },
            { key: 'ammonia_level', label: 'Ammonia' },
            { key: 'tested_date', label: 'Tested' },
          ]}
          fields={[
            { name: 'pond_tank', label: 'Pond / tank', required: true },
            { name: 'ph_level', label: 'pH level', type: 'number', step: '0.1' },
            { name: 'dissolved_oxygen', label: 'Dissolved oxygen (mg/L)', type: 'number', step: '0.1' },
            { name: 'ammonia_level', label: 'Ammonia level (ppm)', type: 'number', step: '0.01' },
            { name: 'temperature_c', label: 'Temperature (°C)', type: 'number', step: '0.1' },
            { name: 'tested_date', label: 'Tested date', type: 'date' },
          ]}
          stats={(items) => [
            { label: 'Readings', value: items.length },
          ]}
        />
      )}

      {activeTab === 'health' && (
        <ResourceManager
          compact
          accent="rose"
          queryKey="fish-health"
          idField="id"
          list={(params) => fishHealthAPI.getRecords(params)}
          create={(data) => fishHealthAPI.createRecord(data)}
          update={(id, data) => fishHealthAPI.updateRecord(id, data)}
          remove={(id) => fishHealthAPI.deleteRecord(id)}
          searchPlaceholder="Search by pond or species..."
          emptyMessage="No health records yet."
          newLabel="Log Health Issue"
          backendNote="Backend endpoint /fish-health has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ pond_tank: '', species: '', issue_observed: '', treatment: '', mortality_count: '', recorded_date: '' }}
          requiredFields={['pond_tank', 'issue_observed']}
          columns={[
            { key: 'pond_tank', label: 'Pond / Tank' },
            { key: 'species', label: 'Species' },
            { key: 'issue_observed', label: 'Issue' },
            { key: 'mortality_count', label: 'Mortality' },
            { key: 'recorded_date', label: 'Date' },
          ]}
          fields={[
            { name: 'pond_tank', label: 'Pond / tank', required: true },
            { name: 'species', label: 'Species' },
            { name: 'issue_observed', label: 'Issue observed', required: true, span: 2 },
            { name: 'treatment', label: 'Treatment given', span: 2 },
            { name: 'mortality_count', label: 'Mortality count', type: 'number' },
            { name: 'recorded_date', label: 'Recorded date', type: 'date' },
          ]}
          stats={(items) => [
            { label: 'Records', value: items.length },
            { label: 'Total mortality', value: items.reduce((s, i) => s + (Number(i.mortality_count) || 0), 0) },
          ]}
        />
      )}

      {activeTab === 'harvest' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="fisheries-harvest"
          idField="id"
          list={(params) => fisheriesHarvestAPI.getHarvests(params)}
          create={(data) => fisheriesHarvestAPI.createHarvest(data)}
          update={(id, data) => fisheriesHarvestAPI.updateHarvest(id, data)}
          remove={(id) => fisheriesHarvestAPI.deleteHarvest(id)}
          searchPlaceholder="Search by pond or species..."
          emptyMessage="No harvests recorded yet."
          newLabel="Log Harvest"
          backendNote="Backend endpoint /fisheries-harvest has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ pond_tank: '', species: '', harvest_date: '', quantity_kg: '', average_weight_g: '', buyer: '', sale_price: '' }}
          requiredFields={['pond_tank', 'species']}
          columns={[
            { key: 'pond_tank', label: 'Pond / Tank' },
            { key: 'species', label: 'Species' },
            { key: 'harvest_date', label: 'Date' },
            { key: 'quantity_kg', label: 'Quantity (kg)' },
            { key: 'sale_price', label: 'Sale Price (₹)' },
          ]}
          fields={[
            { name: 'pond_tank', label: 'Pond / tank', required: true },
            { name: 'species', label: 'Species', required: true },
            { name: 'harvest_date', label: 'Harvest date', type: 'date' },
            { name: 'quantity_kg', label: 'Quantity (kg)', type: 'number' },
            { name: 'average_weight_g', label: 'Average weight (g)', type: 'number' },
            { name: 'buyer', label: 'Buyer' },
            { name: 'sale_price', label: 'Sale price (₹)', type: 'number' },
          ]}
          stats={(items) => [
            { label: 'Harvests', value: items.length },
            { label: 'Total quantity (kg)', value: items.reduce((s, i) => s + (Number(i.quantity_kg) || 0), 0).toFixed(1) },
          ]}
        />
      )}

      {activeTab === 'processing' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="fish-processing"
          idField="id"
          list={(params) => fishProcessingAPI.getBatches(params)}
          create={(data) => fishProcessingAPI.createBatch(data)}
          update={(id, data) => fishProcessingAPI.updateBatch(id, data)}
          remove={(id) => fishProcessingAPI.deleteBatch(id)}
          searchPlaceholder="Search by batch or species..."
          emptyMessage="No processing batches recorded yet."
          newLabel="Add Batch"
          backendNote="Backend endpoint /fish-processing has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ batch_id: '', species: '', processing_type: 'Cleaning', quantity_kg: '', processing_date: '', notes: '' }}
          requiredFields={['batch_id', 'species']}
          columns={[
            { key: 'batch_id', label: 'Batch' },
            { key: 'species', label: 'Species' },
            { key: 'processing_type', label: 'Type' },
            { key: 'quantity_kg', label: 'Quantity (kg)' },
            { key: 'processing_date', label: 'Date' },
          ]}
          fields={[
            { name: 'batch_id', label: 'Batch ID', required: true },
            { name: 'species', label: 'Species', required: true },
            { name: 'processing_type', label: 'Processing type', type: 'select', options: PROCESSING_TYPES },
            { name: 'quantity_kg', label: 'Quantity (kg)', type: 'number' },
            { name: 'processing_date', label: 'Processing date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Batches processed', value: items.length },
          ]}
        />
      )}

      {activeTab === 'coldchain' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="cold-fish-chain"
          idField="id"
          list={(params) => coldFishChainAPI.getShipments(params)}
          create={(data) => coldFishChainAPI.createShipment(data)}
          update={(id, data) => coldFishChainAPI.updateShipment(id, data)}
          remove={(id) => coldFishChainAPI.deleteShipment(id)}
          searchPlaceholder="Search by shipment or destination..."
          emptyMessage="No cold chain shipments recorded yet."
          newLabel="Add Shipment"
          backendNote="Backend endpoint /cold-fish-chain has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ shipment_id: '', origin: '', destination: '', temperature_c: '', dispatch_date: '', arrival_date: '', status: 'In Transit' }}
          requiredFields={['shipment_id', 'destination']}
          columns={[
            { key: 'shipment_id', label: 'Shipment' },
            { key: 'origin', label: 'Origin' },
            { key: 'destination', label: 'Destination' },
            { key: 'temperature_c', label: 'Temp (°C)' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'shipment_id', label: 'Shipment ID', required: true },
            { name: 'origin', label: 'Origin' },
            { name: 'destination', label: 'Destination', required: true },
            { name: 'temperature_c', label: 'Temperature (°C)', type: 'number', step: '0.1' },
            { name: 'dispatch_date', label: 'Dispatch date', type: 'date' },
            { name: 'arrival_date', label: 'Arrival date', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: SHIPMENT_STATUS },
          ]}
          stats={(items) => [
            { label: 'Shipments', value: items.length },
            { label: 'Delayed', value: items.filter((i) => i.status === 'Delayed').length },
          ]}
        />
      )}

      {activeTab === 'analytics' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="aquaculture-analytics"
          idField="id"
          list={(params) => aquacultureAnalyticsAPI.getMetrics(params)}
          create={(data) => aquacultureAnalyticsAPI.createMetric(data)}
          update={(id, data) => aquacultureAnalyticsAPI.updateMetric(id, data)}
          remove={(id) => aquacultureAnalyticsAPI.deleteMetric(id)}
          searchPlaceholder="Search by metric..."
          emptyMessage="No analytics metrics recorded yet."
          newLabel="Add Metric"
          backendNote="Backend endpoint /aquaculture-analytics has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ metric_name: '', pond_tank: '', value: '', unit: '', period: '', notes: '' }}
          requiredFields={['metric_name']}
          columns={[
            { key: 'metric_name', label: 'Metric' },
            { key: 'pond_tank', label: 'Pond / Tank' },
            { key: 'value', label: 'Value' },
            { key: 'period', label: 'Period' },
          ]}
          fields={[
            { name: 'metric_name', label: 'Metric name', required: true },
            { name: 'pond_tank', label: 'Pond / tank' },
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
  );
}

export default FisheriesManagementPage;
