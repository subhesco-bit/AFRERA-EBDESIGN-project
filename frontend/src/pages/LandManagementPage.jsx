import { useState } from 'react';
import { FileSignature, Map, FlaskConical, Droplets, Milestone, Ruler } from 'lucide-react';
import {
  landLeaseAPI,
  gisLandMappingAPI,
  soilMappingAPI,
  waterResourceMappingAPI,
  geoBoundaryAPI,
  surveyManagementAPI,
} from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

/**
 * Consolidated Land domain sub-modules: M033 (Lease), M035 (GIS Mapping),
 * M036 (Soil Mapping), M037 (Water Resource Mapping), M038 (Geo Boundary),
 * M039 (Survey Management).
 *
 * M032 (Land Ownership) is not a tab here — that capability already exists
 * in full at pages/LandRegistryPage.jsx (owner_name, ownership_type,
 * title_status per parcel), so M032's module stub points there directly.
 *
 * Built as one new tabbed page rather than 6 separate pages (avoiding
 * redundant proliferation, per the task note to prefer tabs over duplicate
 * pages), and as a new page rather than added tabs on LandRegistryPage.jsx
 * itself — LandRegistryPage.jsx is one of the already-built first-batch 15
 * pages this task was scoped not to touch.
 */
const TABS = [
  { id: 'leases', label: 'Lease Management', icon: FileSignature },
  { id: 'gis', label: 'GIS Mapping', icon: Map },
  { id: 'soil', label: 'Soil Mapping', icon: FlaskConical },
  { id: 'water', label: 'Water Resources', icon: Droplets },
  { id: 'boundaries', label: 'Geo Boundaries', icon: Milestone },
  { id: 'surveys', label: 'Surveys', icon: Ruler },
];

const LEASE_TYPES = ['Cash Lease', 'Share Cropping', 'Fixed Term', 'Seasonal'];
const LEASE_STATUS = ['Active', 'Expired', 'Terminated', 'Pending Renewal'];
const SOIL_TYPES = ['Alluvial', 'Black', 'Red', 'Laterite', 'Sandy', 'Clay', 'Loamy'];
const WATER_TYPES = ['Well', 'Borewell', 'Canal', 'Pond', 'River', 'Check Dam', 'Rainwater Harvesting'];
const BOUNDARY_TYPES = ['Village', 'Gram Panchayat', 'Block', 'District', 'Watershed'];
const SURVEY_STATUS = ['Scheduled', 'In Progress', 'Completed', 'Disputed'];

function LandManagementPage() {
  const [activeTab, setActiveTab] = useState('leases');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Land Management</h1>
        <p className="text-gray-600">Lease terms, GIS parcel mapping, soil zones, water resources, administrative boundaries and land surveys</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'leases' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="land-leases"
          idField="id"
          list={(params) => landLeaseAPI.getLeases(params)}
          create={(data) => landLeaseAPI.createLease(data)}
          update={(id, data) => landLeaseAPI.updateLease(id, data)}
          remove={(id) => landLeaseAPI.deleteLease(id)}
          searchPlaceholder="Search by parcel, lessor or lessee..."
          emptyMessage="No leases recorded yet."
          newLabel="Add Lease"
          backendNote="Backend endpoint /land-leases has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ parcel_code: '', lessor_name: '', lessee_name: '', lease_type: 'Cash Lease', rent_amount: '', start_date: '', end_date: '', status: 'Active', notes: '' }}
          requiredFields={['parcel_code', 'lessor_name', 'lessee_name']}
          columns={[
            { key: 'parcel_code', label: 'Parcel' },
            { key: 'lessor_name', label: 'Lessor' },
            { key: 'lessee_name', label: 'Lessee' },
            { key: 'lease_type', label: 'Type' },
            { key: 'rent_amount', label: 'Rent (₹)' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'parcel_code', label: 'Parcel code / reference', required: true },
            { name: 'lessor_name', label: 'Lessor (owner)', required: true },
            { name: 'lessee_name', label: 'Lessee (tenant)', required: true },
            { name: 'lease_type', label: 'Lease type', type: 'select', options: LEASE_TYPES },
            { name: 'rent_amount', label: 'Rent amount (₹)', type: 'number' },
            { name: 'start_date', label: 'Start date', type: 'date' },
            { name: 'end_date', label: 'End date', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: LEASE_STATUS },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Leases', value: items.length },
            { label: 'Active', value: items.filter((i) => i.status === 'Active').length },
            { label: 'Total annual rent (₹)', value: items.reduce((s, i) => s + (Number(i.rent_amount) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'gis' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="gis-land-mapping"
          idField="id"
          list={(params) => gisLandMappingAPI.getMappings(params)}
          create={(data) => gisLandMappingAPI.createMapping(data)}
          update={(id, data) => gisLandMappingAPI.updateMapping(id, data)}
          remove={(id) => gisLandMappingAPI.deleteMapping(id)}
          searchPlaceholder="Search by parcel code..."
          emptyMessage="No parcels mapped yet."
          newLabel="Add Mapping"
          backendNote="Backend endpoint /gis-land-mapping/parcels has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ parcel_code: '', latitude: '', longitude: '', boundary_polygon: '', area_hectares: '', mapped_by: '', notes: '' }}
          requiredFields={['parcel_code', 'latitude', 'longitude']}
          columns={[
            { key: 'parcel_code', label: 'Parcel' },
            { key: 'latitude', label: 'Latitude' },
            { key: 'longitude', label: 'Longitude' },
            { key: 'area_hectares', label: 'Area (ha)' },
            { key: 'mapped_by', label: 'Mapped By' },
          ]}
          fields={[
            { name: 'parcel_code', label: 'Parcel code / reference', required: true },
            { name: 'latitude', label: 'Latitude', type: 'number', step: 'any' },
            { name: 'longitude', label: 'Longitude', type: 'number', step: 'any' },
            { name: 'area_hectares', label: 'Area (hectares)', type: 'number' },
            { name: 'mapped_by', label: 'Mapped by' },
            { name: 'boundary_polygon', label: 'Boundary polygon (GeoJSON / WKT)', type: 'textarea', span: 2 },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Parcels mapped', value: items.length },
            { label: 'Total mapped area (ha)', value: items.reduce((s, i) => s + (Number(i.area_hectares) || 0), 0).toFixed(1) },
          ]}
        />
      )}

      {activeTab === 'soil' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="soil-mapping"
          idField="id"
          list={(params) => soilMappingAPI.getZones(params)}
          create={(data) => soilMappingAPI.createZone(data)}
          update={(id, data) => soilMappingAPI.updateZone(id, data)}
          remove={(id) => soilMappingAPI.deleteZone(id)}
          searchPlaceholder="Search by zone or village..."
          emptyMessage="No soil zones mapped yet."
          newLabel="Add Soil Zone"
          backendNote="Backend endpoint /soil-mapping/zones has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ zone_name: '', village: '', soil_type: 'Alluvial', ph_level: '', organic_carbon_pct: '', nutrient_index: '', notes: '' }}
          requiredFields={['zone_name', 'soil_type']}
          columns={[
            { key: 'zone_name', label: 'Zone' },
            { key: 'village', label: 'Village' },
            { key: 'soil_type', label: 'Soil Type' },
            { key: 'ph_level', label: 'pH' },
            { key: 'organic_carbon_pct', label: 'Organic Carbon %' },
            { key: 'nutrient_index', label: 'Nutrient Index' },
          ]}
          fields={[
            { name: 'zone_name', label: 'Zone name / reference', required: true },
            { name: 'village', label: 'Village' },
            { name: 'soil_type', label: 'Soil type', type: 'select', options: SOIL_TYPES },
            { name: 'ph_level', label: 'pH level', type: 'number', step: '0.1' },
            { name: 'organic_carbon_pct', label: 'Organic carbon (%)', type: 'number', step: '0.01' },
            { name: 'nutrient_index', label: 'Nutrient index (N-P-K)' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Soil zones mapped', value: items.length },
            { label: 'Villages covered', value: new Set(items.map((i) => i.village).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'water' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="water-resource-mapping"
          idField="id"
          list={(params) => waterResourceMappingAPI.getResources(params)}
          create={(data) => waterResourceMappingAPI.createResource(data)}
          update={(id, data) => waterResourceMappingAPI.updateResource(id, data)}
          remove={(id) => waterResourceMappingAPI.deleteResource(id)}
          searchPlaceholder="Search by resource name or village..."
          emptyMessage="No water resources mapped yet."
          newLabel="Add Water Resource"
          backendNote="Backend endpoint /water-resource-mapping/resources has not been built yet — this tab is wired and ready to work once it is. Distinct from irrigation scheduling's water sources (irrigationAPI), this is the location registry of water bodies."
          initialForm={{ resource_name: '', resource_type: 'Well', village: '', latitude: '', longitude: '', capacity_liters: '', notes: '' }}
          requiredFields={['resource_name', 'resource_type']}
          columns={[
            { key: 'resource_name', label: 'Resource' },
            { key: 'resource_type', label: 'Type' },
            { key: 'village', label: 'Village' },
            { key: 'capacity_liters', label: 'Capacity (L)' },
            { key: 'coordinates', label: 'Coordinates', render: (r) => (r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : '—') },
          ]}
          fields={[
            { name: 'resource_name', label: 'Resource name', required: true },
            { name: 'resource_type', label: 'Resource type', type: 'select', options: WATER_TYPES },
            { name: 'village', label: 'Village' },
            { name: 'latitude', label: 'Latitude', type: 'number', step: 'any' },
            { name: 'longitude', label: 'Longitude', type: 'number', step: 'any' },
            { name: 'capacity_liters', label: 'Capacity (litres)', type: 'number' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Water resources mapped', value: items.length },
            { label: 'Villages covered', value: new Set(items.map((i) => i.village).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'boundaries' && (
        <ResourceManager
          compact
          accent="purple"
          queryKey="geo-boundaries"
          idField="id"
          list={(params) => geoBoundaryAPI.getBoundaries(params)}
          create={(data) => geoBoundaryAPI.createBoundary(data)}
          update={(id, data) => geoBoundaryAPI.updateBoundary(id, data)}
          remove={(id) => geoBoundaryAPI.deleteBoundary(id)}
          searchPlaceholder="Search by boundary name..."
          emptyMessage="No boundaries recorded yet."
          newLabel="Add Boundary"
          backendNote="Backend endpoint /geo-boundaries has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ boundary_name: '', boundary_type: 'Village', parent_boundary: '', area_hectares: '', notes: '' }}
          requiredFields={['boundary_name', 'boundary_type']}
          columns={[
            { key: 'boundary_name', label: 'Boundary' },
            { key: 'boundary_type', label: 'Type' },
            { key: 'parent_boundary', label: 'Parent' },
            { key: 'area_hectares', label: 'Area (ha)' },
          ]}
          fields={[
            { name: 'boundary_name', label: 'Boundary name', required: true },
            { name: 'boundary_type', label: 'Boundary type', type: 'select', options: BOUNDARY_TYPES },
            { name: 'parent_boundary', label: 'Parent boundary', placeholder: 'e.g. enclosing block/district' },
            { name: 'area_hectares', label: 'Area (hectares)', type: 'number' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Boundaries recorded', value: items.length },
            { label: 'Types in use', value: new Set(items.map((i) => i.boundary_type).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'surveys' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="land-surveys"
          idField="id"
          list={(params) => surveyManagementAPI.getSurveys(params)}
          create={(data) => surveyManagementAPI.createSurvey(data)}
          update={(id, data) => surveyManagementAPI.updateSurvey(id, data)}
          remove={(id) => surveyManagementAPI.deleteSurvey(id)}
          searchPlaceholder="Search by parcel or surveyor..."
          emptyMessage="No surveys recorded yet."
          newLabel="Schedule Survey"
          backendNote="Backend endpoint /land-surveys has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ parcel_code: '', surveyor_name: '', scheduled_date: '', completed_date: '', status: 'Scheduled', findings: '' }}
          requiredFields={['parcel_code', 'surveyor_name']}
          columns={[
            { key: 'parcel_code', label: 'Parcel' },
            { key: 'surveyor_name', label: 'Surveyor' },
            { key: 'scheduled_date', label: 'Scheduled' },
            { key: 'completed_date', label: 'Completed' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'parcel_code', label: 'Parcel code / reference', required: true },
            { name: 'surveyor_name', label: 'Surveyor name', required: true },
            { name: 'scheduled_date', label: 'Scheduled date', type: 'date' },
            { name: 'completed_date', label: 'Completed date', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: SURVEY_STATUS },
            { name: 'findings', label: 'Findings', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Surveys', value: items.length },
            { label: 'Completed', value: items.filter((i) => i.status === 'Completed').length },
            { label: 'Disputed', value: items.filter((i) => i.status === 'Disputed').length },
          ]}
        />
      )}
    </div>
  );
}

export default LandManagementPage;
