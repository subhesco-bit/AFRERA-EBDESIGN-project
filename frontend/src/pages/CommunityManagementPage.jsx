import { useState } from 'react'
import { Landmark, Building2, MapPin, Flag, Users, Home, TreePine } from 'lucide-react'
import {
  panchayatAPI,
  blockManagementAPI,
  districtManagementAPI,
  stateManagementAPI,
  cooperativeAPI,
  producerGroupAPI,
  communityAssetAPI,
  ruralDevelopmentAPI,
} from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

/**
 * Consolidated Community domain sub-modules: M042 (Panchayat), M043 (Block),
 * M044 (District), M045 (State), M047 (Cooperative), M048 (Producer Group),
 * M049 (Community Asset), M050 (Rural Development).
 *
 * M041 (Village Registry) and M046 (SHG Management) are not tabs here — both
 * already have their own full pages (pages/VillageRegistryPage.jsx,
 * pages/ShgManagementPage.jsx) and are out of this batch's scope.
 *
 * Built as one tabbed page (third batch, 2026-08-08), matching the
 * LandManagementPage.jsx / InputSupplyManagementPage.jsx pattern.
 *
 * Panchayat and Cooperative are the two tabs with REAL backend support:
 * backend/src/routes/governanceModule.js (mounted at /api/v1/governance in
 * backend/src/index.js) exposes POST+GET /governance/panchayats and
 * POST+GET /governance/cooperatives — but no PUT/DELETE for either, so those
 * two tabs are create+list only (no `update`/`remove` passed to
 * ResourceManager, which hides the Actions column when both are absent).
 * The remaining six tabs (Block, District, State, Producer Group, Community
 * Asset, Rural Development) have no matching backend route anywhere in the
 * codebase and are wired against a conventional REST shape with a
 * backendNote. M050 is catalogued ABSENT — no trace of the capability
 * anywhere.
 */
const TABS = [
  { id: 'panchayat', label: 'Panchayat', icon: Landmark },
  { id: 'block', label: 'Block', icon: Building2 },
  { id: 'district', label: 'District', icon: MapPin },
  { id: 'state', label: 'State', icon: Flag },
  { id: 'cooperative', label: 'Cooperative', icon: Handshake },
  { id: 'producer-group', label: 'Producer Group', icon: Users },
  { id: 'community-asset', label: 'Community Asset', icon: Home },
  { id: 'rural-development', label: 'Rural Development', icon: TreePine },
]

const ASSET_TYPES = ['Community Hall', 'Water Tank', 'Godown/Warehouse', 'Grading Center', 'Playground', 'Other']
const PROJECT_STATUS = ['Proposed', 'Approved', 'In Progress', 'Completed']

function CommunityManagementPage() {
  const [activeTab, setActiveTab] = useState('panchayat')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Community Management</h1>
        <p className="text-gray-600">Panchayat, block, district, state, cooperative, producer group, community asset and rural development records</p>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'panchayat' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="panchayats"
          idField="id"
          list={(params) => panchayatAPI.getPanchayats(params)}
          create={(data) => panchayatAPI.createPanchayat(data)}
          searchPlaceholder="Search by panchayat name..."
          emptyMessage="No panchayats recorded yet."
          newLabel="Add Panchayat"
          backendNote="Backed by the real /governance/panchayats endpoint. Create requires admin access; there is no update/delete route yet, so this tab is create + list only."
          initialForm={{ name: '', state: '', district: '', block: '', sarpanch_name: '', population: '' }}
          requiredFields={['name']}
          columns={[
            { key: 'name', label: 'Panchayat' },
            { key: 'district', label: 'District' },
            { key: 'state', label: 'State' },
            { key: 'sarpanch_name', label: 'Sarpanch' },
            { key: 'population', label: 'Population' },
          ]}
          fields={[
            { name: 'name', label: 'Panchayat name', required: true },
            { name: 'state', label: 'State' },
            { name: 'district', label: 'District' },
            { name: 'block', label: 'Block' },
            { name: 'sarpanch_name', label: 'Sarpanch / head name' },
            { name: 'population', label: 'Population', type: 'number' },
          ]}
          stats={(items) => [
            { label: 'Panchayats', value: items.length },
            { label: 'States covered', value: new Set(items.map((i) => i.state).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'block' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="blocks"
          idField="id"
          list={(params) => blockManagementAPI.getBlocks(params)}
          create={(data) => blockManagementAPI.createBlock(data)}
          update={(id, data) => blockManagementAPI.updateBlock(id, data)}
          remove={(id) => blockManagementAPI.deleteBlock(id)}
          searchPlaceholder="Search by block name..."
          emptyMessage="No blocks recorded yet."
          newLabel="Add Block"
          backendNote="Backend endpoint /blocks has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ name: '', district: '', state: '', bdo_name: '', notes: '' }}
          requiredFields={['name']}
          columns={[
            { key: 'name', label: 'Block' },
            { key: 'district', label: 'District' },
            { key: 'state', label: 'State' },
            { key: 'bdo_name', label: 'BDO' },
          ]}
          fields={[
            { name: 'name', label: 'Block name', required: true },
            { name: 'district', label: 'District' },
            { name: 'state', label: 'State' },
            { name: 'bdo_name', label: 'Block Development Officer' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Blocks', value: items.length },
            { label: 'Districts covered', value: new Set(items.map((i) => i.district).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'district' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="districts"
          idField="id"
          list={(params) => districtManagementAPI.getDistricts(params)}
          create={(data) => districtManagementAPI.createDistrict(data)}
          update={(id, data) => districtManagementAPI.updateDistrict(id, data)}
          remove={(id) => districtManagementAPI.deleteDistrict(id)}
          searchPlaceholder="Search by district name..."
          emptyMessage="No districts recorded yet."
          newLabel="Add District"
          backendNote="Backend endpoint /districts has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ name: '', state: '', collector_name: '', notes: '' }}
          requiredFields={['name']}
          columns={[
            { key: 'name', label: 'District' },
            { key: 'state', label: 'State' },
            { key: 'collector_name', label: 'Collector' },
          ]}
          fields={[
            { name: 'name', label: 'District name', required: true },
            { name: 'state', label: 'State' },
            { name: 'collector_name', label: 'District Collector' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Districts', value: items.length },
            { label: 'States covered', value: new Set(items.map((i) => i.state).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'state' && (
        <ResourceManager
          compact
          accent="purple"
          queryKey="states"
          idField="id"
          list={(params) => stateManagementAPI.getStates(params)}
          create={(data) => stateManagementAPI.createState(data)}
          update={(id, data) => stateManagementAPI.updateState(id, data)}
          remove={(id) => stateManagementAPI.deleteState(id)}
          searchPlaceholder="Search by state name..."
          emptyMessage="No states recorded yet."
          newLabel="Add State"
          backendNote="Backend endpoint /states has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ name: '', region: '', capital: '', notes: '' }}
          requiredFields={['name']}
          columns={[
            { key: 'name', label: 'State' },
            { key: 'region', label: 'Region' },
            { key: 'capital', label: 'Capital' },
          ]}
          fields={[
            { name: 'name', label: 'State name', required: true },
            { name: 'region', label: 'Region' },
            { name: 'capital', label: 'Capital' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'States', value: items.length },
            { label: 'Regions covered', value: new Set(items.map((i) => i.region).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'cooperative' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="cooperatives"
          idField="id"
          list={(params) => cooperativeAPI.getCooperatives(params)}
          create={(data) => cooperativeAPI.createCooperative(data)}
          searchPlaceholder="Search by cooperative name..."
          emptyMessage="No cooperatives recorded yet."
          newLabel="Add Cooperative"
          backendNote="Backed by the real /governance/cooperatives endpoint. Create requires admin access; there is no update/delete route yet, so this tab is create + list only."
          initialForm={{ name: '', registration_number: '', sector: '', member_count: '', notes: '' }}
          requiredFields={['name']}
          columns={[
            { key: 'name', label: 'Cooperative' },
            { key: 'registration_number', label: 'Reg. No.' },
            { key: 'sector', label: 'Sector' },
            { key: 'member_count', label: 'Members' },
          ]}
          fields={[
            { name: 'name', label: 'Cooperative name', required: true },
            { name: 'registration_number', label: 'Registration number' },
            { name: 'sector', label: 'Sector (dairy, credit, marketing...)' },
            { name: 'member_count', label: 'Member count', type: 'number' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Cooperatives', value: items.length },
            { label: 'Total members', value: items.reduce((s, i) => s + (Number(i.member_count) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'producer-group' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="producer-groups"
          idField="id"
          list={(params) => producerGroupAPI.getGroups(params)}
          create={(data) => producerGroupAPI.createGroup(data)}
          update={(id, data) => producerGroupAPI.updateGroup(id, data)}
          remove={(id) => producerGroupAPI.deleteGroup(id)}
          searchPlaceholder="Search by group name..."
          emptyMessage="No producer groups recorded yet."
          newLabel="Add Producer Group"
          backendNote="Backend endpoint /producer-groups has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ name: '', commodity_focus: '', member_count: '', village: '', notes: '' }}
          requiredFields={['name']}
          columns={[
            { key: 'name', label: 'Group' },
            { key: 'commodity_focus', label: 'Commodity Focus' },
            { key: 'member_count', label: 'Members' },
            { key: 'village', label: 'Village' },
          ]}
          fields={[
            { name: 'name', label: 'Producer group name', required: true },
            { name: 'commodity_focus', label: 'Commodity focus' },
            { name: 'member_count', label: 'Member count', type: 'number' },
            { name: 'village', label: 'Village' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Producer groups', value: items.length },
            { label: 'Total members', value: items.reduce((s, i) => s + (Number(i.member_count) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'community-asset' && (
        <ResourceManager
          compact
          accent="rose"
          queryKey="community-assets"
          idField="id"
          list={(params) => communityAssetAPI.getAssets(params)}
          create={(data) => communityAssetAPI.createAsset(data)}
          update={(id, data) => communityAssetAPI.updateAsset(id, data)}
          remove={(id) => communityAssetAPI.deleteAsset(id)}
          searchPlaceholder="Search by asset name or village..."
          emptyMessage="No community assets recorded yet."
          newLabel="Add Community Asset"
          backendNote="Backend endpoint /community-assets has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ name: '', asset_type: 'Community Hall', village: '', condition: '', notes: '' }}
          requiredFields={['name', 'asset_type']}
          columns={[
            { key: 'name', label: 'Asset' },
            { key: 'asset_type', label: 'Type' },
            { key: 'village', label: 'Village' },
            { key: 'condition', label: 'Condition' },
          ]}
          fields={[
            { name: 'name', label: 'Asset name', required: true },
            { name: 'asset_type', label: 'Asset type', type: 'select', options: ASSET_TYPES },
            { name: 'village', label: 'Village' },
            { name: 'condition', label: 'Condition (Good/Fair/Poor)' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Assets tracked', value: items.length },
            { label: 'Villages covered', value: new Set(items.map((i) => i.village).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'rural-development' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="rural-development-projects"
          idField="id"
          list={(params) => ruralDevelopmentAPI.getProjects(params)}
          create={(data) => ruralDevelopmentAPI.createProject(data)}
          update={(id, data) => ruralDevelopmentAPI.updateProject(id, data)}
          remove={(id) => ruralDevelopmentAPI.deleteProject(id)}
          searchPlaceholder="Search by project name or village..."
          emptyMessage="No rural development projects recorded yet."
          newLabel="Add Project"
          backendNote="Backend endpoint /rural-development/projects has not been built yet — this tab is wired and ready to work once it is. No prior evidence of this capability anywhere in the codebase (catalogued ABSENT)."
          initialForm={{ project_name: '', village: '', budget: '', status: 'Proposed', start_date: '', notes: '' }}
          requiredFields={['project_name']}
          columns={[
            { key: 'project_name', label: 'Project' },
            { key: 'village', label: 'Village' },
            { key: 'budget', label: 'Budget (₹)' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'project_name', label: 'Project name', required: true },
            { name: 'village', label: 'Village' },
            { name: 'budget', label: 'Budget (₹)', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', options: PROJECT_STATUS },
            { name: 'start_date', label: 'Start date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Projects', value: items.length },
            { label: 'Completed', value: items.filter((i) => i.status === 'Completed').length },
          ]}
        />
      )}
    </div>
  )
}

export default CommunityManagementPage
