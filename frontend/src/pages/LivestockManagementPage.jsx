import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Beef, Bird, Rabbit, PiggyBank, Stethoscope, Wheat, GitBranch, BarChart3, Milk } from 'lucide-react';
import {
  cattleRegistryAPI,
  poultryManagementAPI,
  goatFarmingAPI,
  sheepFarmingAPI,
  pigFarmingAPI,
  animalHealthAPI,
  livestockAnalyticsAPI,
  feedManagementAPI,
} from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

/**
 * Consolidated Livestock domain sub-modules: M122 (Cattle Registry),
 * M123 (Poultry), M124 (Goat Farming), M125 (Sheep Farming), M126 (Pig
 * Farming), M127 (Animal Health), M128 (Feed Management), M129 (Breeding),
 * M130 (Livestock Analytics).
 *
 * M121 (Dairy Management) is not a tab here — it already has its own full
 * page (pages/DairyManagementPage.jsx, mounted at /dairy-management,
 * recovered earlier this session) and is out of this batch's scope.
 *
 * Built as one tabbed page (third batch, 2026-08-08) rather than nine
 * near-identical standalone pages, matching the LandManagementPage.jsx /
 * InputSupplyManagementPage.jsx pattern. None of these nine have a matching
 * backend route — every tab is wired against a conventional REST shape and
 * flagged with a backendNote. M125 (Sheep Farming) is catalogued ABSENT —
 * no trace of the capability anywhere — so it's built the same way as the
 * others, just with no prior backend evidence at all.
 */
const TABS = [
  { id: 'cattle', label: 'Cattle Registry', icon: Beef },
  { id: 'poultry', label: 'Poultry', icon: Bird },
  { id: 'goat', label: 'Goat Farming', icon: Rabbit },
  { id: 'sheep', label: 'Sheep Farming', icon: Rabbit },
  { id: 'pig', label: 'Pig Farming', icon: PiggyBank },
  { id: 'health', label: 'Animal Health', icon: Stethoscope },
  { id: 'feed', label: 'Feed Management', icon: Wheat },
  { id: 'breeding', label: 'Breeding', icon: GitBranch },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const CATTLE_BREEDS = ['Gir', 'Sahiwal', 'Red Sindhi', 'Jersey Cross', 'Holstein Friesian Cross', 'Local/Indigenous', 'Other'];
const CATTLE_PURPOSE = ['Dairy', 'Draught', 'Dual Purpose'];
// Matches the real poultry_flocks.flock_type CHECK constraint (migration 067) exactly.
const POULTRY_TYPES = ['broiler', 'layer', 'duck', 'quail', 'turkey'];
const POULTRY_STATUS = ['active', 'sold', 'culled', 'closed'];
const GOAT_BREEDS = ['Black Bengal', 'Beetal', 'Jamunapari', 'Sirohi', 'Local/Indigenous', 'Other'];
// Matches the real goat_herd.status CHECK constraint (migration 068) exactly.
const GOAT_STATUS = ['active', 'milking', 'dry', 'pregnant', 'sold', 'culled', 'dead'];
const SHEEP_BREEDS = ['Deccani', 'Nellore', 'Marwari', 'Local/Indigenous', 'Other'];
// Matches the real sheep_flock.status CHECK constraint (migration 069) exactly.
const SHEEP_STATUS = ['active', 'breeding', 'lactating', 'dry', 'market_ready', 'sold', 'culled', 'dead'];
const PIG_BREEDS = ['Large White Yorkshire', 'Landrace', 'Hampshire', 'Local/Indigenous', 'Other'];
// Matches the real pig_herd.status CHECK constraint (migration 070) exactly.
const PIG_STATUS = ['active', 'breeding', 'lactating', 'fattening', 'market_ready', 'sold', 'culled', 'dead'];
const HEALTH_TYPES = ['Vaccination', 'Deworming', 'Treatment', 'Checkup', 'Disease Outbreak'];
const HEALTH_STATUSES = ['Healthy', 'Under Observation', 'Sick', 'Critical', 'Recovered'];
const FEED_TYPES = ['Concentrate', 'Green Fodder', 'Dry Fodder', 'Mineral Mixture', 'Silage'];
const ANALYTICS_CATEGORIES = ['Herd Growth', 'Mortality Rate', 'Productivity', 'Cost per Animal', 'Revenue'];

function LivestockManagementPage() {
  const [activeTab, setActiveTab] = useState('cattle');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Livestock Management</h1>
        <p className="text-gray-600">Cattle, poultry, goat, sheep and pig registries, animal health, feed, breeding and analytics</p>
      </div>

      <Link
        to="/dairy-management"
        className="flex items-center gap-2 mb-6 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm hover:bg-amber-100 transition w-fit"
      >
        <Milk className="w-4 h-4" />
        Dairy herd (M121) lives on its own page with real milk-yield trends and vaccination/breeding due-date alerts &rarr;
      </Link>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'cattle' && (
        <ResourceManager
          compact
          accent="amber"
          queryKey="cattle-registry"
          idField="id"
          list={(params) => cattleRegistryAPI.getAnimals(params)}
          create={(data) => cattleRegistryAPI.createAnimal(data)}
          update={(id, data) => cattleRegistryAPI.updateAnimal(id, data)}
          remove={(id) => cattleRegistryAPI.deleteAnimal(id)}
          searchPlaceholder="Search by tag number or owner..."
          emptyMessage="No cattle recorded yet."
          newLabel="Register Cattle"
          backendNote="Backend endpoint /cattle-registry/animals has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ tag_number: '', breed: 'Local/Indigenous', purpose: 'Dairy', owner_name: '', date_of_birth: '', notes: '' }}
          requiredFields={['tag_number', 'owner_name']}
          columns={[
            { key: 'tag_number', label: 'Tag No.' },
            { key: 'breed', label: 'Breed' },
            { key: 'purpose', label: 'Purpose' },
            { key: 'owner_name', label: 'Owner' },
            { key: 'date_of_birth', label: 'DOB' },
          ]}
          fields={[
            { name: 'tag_number', label: 'Tag / ear-tag number', required: true },
            { name: 'breed', label: 'Breed', type: 'select', options: CATTLE_BREEDS },
            { name: 'purpose', label: 'Purpose', type: 'select', options: CATTLE_PURPOSE },
            { name: 'owner_name', label: 'Owner name', required: true },
            { name: 'date_of_birth', label: 'Date of birth', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Cattle registered', value: items.length },
            { label: 'Breeds recorded', value: new Set(items.map((i) => i.breed).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'poultry' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="poultry-flocks"
          idField="id"
          list={(params) => poultryManagementAPI.getBatches(params)}
          create={(data) => poultryManagementAPI.createBatch(data)}
          update={(id, data) => poultryManagementAPI.updateBatch(id, data)}
          remove={(id) => poultryManagementAPI.deleteBatch(id)}
          searchPlaceholder="Search by flock code..."
          emptyMessage="No poultry flocks recorded yet."
          newLabel="Add Flock"
          backendNote="Backed by the real /poultry/flocks endpoint (M123, migration 067) - fixed 2026-08-24. This tab previously called a nonexistent /poultry/batches path with fields (owner_name, bird_count, hatch_date) that don't exist on the real poultry_flocks table, which tracks flocks by code, not individually-owned batches. Now aligned to the real schema."
          initialForm={{ flock_code: '', flock_type: 'broiler', breed: '', placement_date: '', initial_bird_count: '', house_id: '', status: 'active', notes: '' }}
          requiredFields={['flock_code', 'flock_type', 'placement_date', 'initial_bird_count']}
          columns={[
            { key: 'flock_code', label: 'Flock' },
            { key: 'flock_type', label: 'Type' },
            { key: 'current_bird_count', label: 'Current Birds' },
            { key: 'house_id', label: 'House' },
            { key: 'status', label: 'Status' },
          ]}
          fields={[
            { name: 'flock_code', label: 'Flock code', required: true },
            { name: 'flock_type', label: 'Flock type', type: 'select', options: POULTRY_TYPES, required: true },
            { name: 'breed', label: 'Breed' },
            { name: 'placement_date', label: 'Placement date', type: 'date', required: true },
            { name: 'initial_bird_count', label: 'Initial bird count', type: 'number', required: true },
            { name: 'house_id', label: 'House / location' },
            { name: 'status', label: 'Status', type: 'select', options: POULTRY_STATUS },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Flocks', value: items.length },
            { label: 'Total current birds', value: items.reduce((s, i) => s + (Number(i.current_bird_count) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'goat' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="goat-herd"
          idField="id"
          list={(params) => goatFarmingAPI.getAnimals(params)}
          create={(data) => goatFarmingAPI.createAnimal(data)}
          update={(id, data) => goatFarmingAPI.updateAnimal(id, data)}
          remove={(id) => goatFarmingAPI.deleteAnimal(id)}
          searchPlaceholder="Search by tag ID..."
          emptyMessage="No goats recorded yet."
          newLabel="Register Goat"
          backendNote="Backed by the real /goat/herd endpoint (M124, migration 068) - fixed 2026-08-24. This tab previously called a nonexistent /goat-farming/animals path with an owner_name field that doesn't exist on the real goat_herd table. Now aligned to the real schema (tag_id/sex/dob/status/weight_kg)."
          initialForm={{ tag_id: '', breed: 'Local/Indigenous', sex: 'female', dob: '', status: 'active', weight_kg: '', house_id: '', notes: '' }}
          requiredFields={['tag_id', 'sex']}
          columns={[
            { key: 'tag_id', label: 'Tag ID' },
            { key: 'breed', label: 'Breed' },
            { key: 'sex', label: 'Sex' },
            { key: 'status', label: 'Status' },
            { key: 'dob', label: 'DOB' },
          ]}
          fields={[
            { name: 'tag_id', label: 'Tag / ear-tag ID', required: true },
            { name: 'breed', label: 'Breed', type: 'select', options: GOAT_BREEDS },
            { name: 'sex', label: 'Sex', type: 'select', options: ['male', 'female'], required: true },
            { name: 'dob', label: 'Date of birth', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: GOAT_STATUS },
            { name: 'weight_kg', label: 'Weight (kg)', type: 'number' },
            { name: 'house_id', label: 'House / location' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Goats registered', value: items.length },
            { label: 'Breeds recorded', value: new Set(items.map((i) => i.breed).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'sheep' && (
        <ResourceManager
          compact
          accent="indigo"
          queryKey="sheep-flock"
          idField="id"
          list={(params) => sheepFarmingAPI.getAnimals(params)}
          create={(data) => sheepFarmingAPI.createAnimal(data)}
          update={(id, data) => sheepFarmingAPI.updateAnimal(id, data)}
          remove={(id) => sheepFarmingAPI.deleteAnimal(id)}
          searchPlaceholder="Search by tag ID..."
          emptyMessage="No sheep recorded yet."
          newLabel="Register Sheep"
          backendNote="Backed by the real /sheep/flock endpoint (M125, migration 069) - fixed 2026-08-24. The earlier 'catalogued ABSENT' note was wrong (matching a mislabeling found elsewhere this session); the backend is real, just at a different path with an owner_name field that doesn't exist on the real sheep_flock table. Now aligned to the real schema."
          initialForm={{ tag_id: '', breed: 'Local/Indigenous', sex: 'female', dob: '', status: 'active', weight_kg: '', wool_type: '', pasture_id: '', notes: '' }}
          requiredFields={['tag_id', 'sex']}
          columns={[
            { key: 'tag_id', label: 'Tag ID' },
            { key: 'breed', label: 'Breed' },
            { key: 'sex', label: 'Sex' },
            { key: 'status', label: 'Status' },
            { key: 'dob', label: 'DOB' },
          ]}
          fields={[
            { name: 'tag_id', label: 'Tag / ear-tag ID', required: true },
            { name: 'breed', label: 'Breed', type: 'select', options: SHEEP_BREEDS },
            { name: 'sex', label: 'Sex', type: 'select', options: ['male', 'female'], required: true },
            { name: 'dob', label: 'Date of birth', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: SHEEP_STATUS },
            { name: 'weight_kg', label: 'Weight (kg)', type: 'number' },
            { name: 'wool_type', label: 'Wool type' },
            { name: 'pasture_id', label: 'Pasture / location' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Sheep registered', value: items.length },
            { label: 'Breeds recorded', value: new Set(items.map((i) => i.breed).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'pig' && (
        <ResourceManager
          compact
          accent="rose"
          queryKey="pig-herd"
          idField="id"
          list={(params) => pigFarmingAPI.getAnimals(params)}
          create={(data) => pigFarmingAPI.createAnimal(data)}
          update={(id, data) => pigFarmingAPI.updateAnimal(id, data)}
          remove={(id) => pigFarmingAPI.deleteAnimal(id)}
          searchPlaceholder="Search by tag ID..."
          emptyMessage="No pigs recorded yet."
          newLabel="Register Pig"
          backendNote="Backed by the real /pig/herd endpoint (M126, migration 070) - fixed 2026-08-24. This tab previously called a nonexistent /pig-farming/animals path with an owner_name field that doesn't exist on the real pig_herd table. Now aligned to the real schema."
          initialForm={{ tag_id: '', breed: 'Local/Indigenous', sex: 'female', dob: '', status: 'active', weight_kg: '', pen_id: '', notes: '' }}
          requiredFields={['tag_id', 'sex']}
          columns={[
            { key: 'tag_id', label: 'Tag ID' },
            { key: 'breed', label: 'Breed' },
            { key: 'sex', label: 'Sex' },
            { key: 'status', label: 'Status' },
            { key: 'dob', label: 'DOB' },
          ]}
          fields={[
            { name: 'tag_id', label: 'Tag / ear-tag ID', required: true },
            { name: 'breed', label: 'Breed', type: 'select', options: PIG_BREEDS },
            { name: 'sex', label: 'Sex', type: 'select', options: ['male', 'female'], required: true },
            { name: 'dob', label: 'Date of birth', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: PIG_STATUS },
            { name: 'weight_kg', label: 'Weight (kg)', type: 'number' },
            { name: 'pen_id', label: 'Pen / location' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Pigs registered', value: items.length },
            { label: 'Breeds recorded', value: new Set(items.map((i) => i.breed).filter(Boolean)).size },
          ]}
        />
      )}

      {activeTab === 'health' && (
        <ResourceManager
          compact
          accent="rose"
          queryKey="animal-health"
          idField="id"
          list={(params) => animalHealthAPI.listExaminations(params)}
          create={(data) => animalHealthAPI.createExamination(data)}
          update={(id, data) => animalHealthAPI.updateExamination(id, data)}
          searchPlaceholder="Search by animal tag or diagnosis..."
          emptyMessage="No health records yet."
          newLabel="Add Health Record"
          backendNote="Backed by the real /animal-health/examinations endpoint (M127) - fixed 2026-08-17. This tab previously called animalHealthAPI.getRecords()/.createRecord() (methods that don't exist on the real export) with a form shaped nothing like the real animal_health_examinations table, so it would have thrown on open and every create would have 400'd on the required fields below even once the method names were fixed. Both are now aligned to the real schema. There is no delete route for examinations yet, so this tab is create + list + update only."
          initialForm={{ animal_type: 'Cattle', animal_id: '', examination_date: '', examination_type: 'Checkup', health_status: 'Healthy', body_temperature_c: '', heart_rate_bpm: '', respiratory_rate_bpm: '', findings: '', examiner_name: '', notes: '' }}
          requiredFields={['animal_type', 'animal_id', 'examination_date', 'examination_type', 'health_status']}
          columns={[
            { key: 'animal_type', label: 'Species' },
            { key: 'animal_id', label: 'Animal ID/Tag' },
            { key: 'examination_type', label: 'Type' },
            { key: 'health_status', label: 'Health Status' },
            { key: 'examination_date', label: 'Date' },
          ]}
          fields={[
            { name: 'animal_type', label: 'Species', type: 'select', options: ['Cattle', 'Poultry', 'Goat', 'Sheep', 'Pig'], required: true },
            { name: 'animal_id', label: 'Animal ID / tag number', required: true },
            { name: 'examination_date', label: 'Examination date', type: 'date', required: true },
            { name: 'examination_type', label: 'Examination type', type: 'select', options: HEALTH_TYPES, required: true },
            { name: 'health_status', label: 'Health status', type: 'select', options: HEALTH_STATUSES, required: true },
            { name: 'body_temperature_c', label: 'Body temperature (°C)', type: 'number', step: '0.1' },
            { name: 'heart_rate_bpm', label: 'Heart rate (bpm)', type: 'number' },
            { name: 'respiratory_rate_bpm', label: 'Respiratory rate (bpm)', type: 'number' },
            { name: 'examiner_name', label: 'Examiner / vet name' },
            { name: 'findings', label: 'Findings', type: 'textarea', span: 2 },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Health records', value: items.length },
            { label: 'Critical', value: items.filter((i) => i.health_status === 'Critical').length },
          ]}
        />
      )}

      {activeTab === 'feed' && (
        <ResourceManager
          compact
          accent="green"
          queryKey="livestock-feed"
          idField="id"
          list={(params) => feedManagementAPI.getRecords(params)}
          create={(data) => feedManagementAPI.createRecord(data)}
          update={(id, data) => feedManagementAPI.updateRecord(id, data)}
          remove={(id) => feedManagementAPI.deleteRecord(id)}
          searchPlaceholder="Search by feed type or supplier..."
          emptyMessage="No feed records yet."
          newLabel="Add Feed Record"
          backendNote="Backend endpoint /livestock-feed/records has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ feed_type: 'Concentrate', supplier: '', quantity_kg: '', cost: '', purchase_date: '', notes: '' }}
          requiredFields={['feed_type']}
          columns={[
            { key: 'feed_type', label: 'Feed Type' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'quantity_kg', label: 'Qty (kg)' },
            { key: 'cost', label: 'Cost (₹)' },
            { key: 'purchase_date', label: 'Date' },
          ]}
          fields={[
            { name: 'feed_type', label: 'Feed type', type: 'select', options: FEED_TYPES },
            { name: 'supplier', label: 'Supplier' },
            { name: 'quantity_kg', label: 'Quantity (kg)', type: 'number' },
            { name: 'cost', label: 'Cost (₹)', type: 'number' },
            { name: 'purchase_date', label: 'Purchase date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Feed records', value: items.length },
            { label: 'Total spend (₹)', value: items.reduce((s, i) => s + (Number(i.cost) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'breeding' && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center gap-2 text-purple-700">
            <GitBranch className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Breeding is tracked per species, not here</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            This tab was going to be a single cross-species breeding log keyed by free-text dam/sire
            tags. That would have quietly diverged from the real data: Goat, Sheep and Pig already
            track breeding tied to each animal's actual registered ID (with working gestation-due
            reminders computed from it), so a second, disconnected log here would create two versions
            of the truth for the same animal. Cattle and Poultry have no breeding tracking in the
            backend at all yet — building one only for those two, alone, is future work, not a quick fix.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="border border-purple-200 bg-purple-50 rounded-lg p-3">
              <div className="font-medium text-purple-900">Goat / Sheep / Pig</div>
              <div className="text-purple-700 mt-1">Real backend, keyed to the registered animal (see each tab's real /herd or /flock endpoint). No UI here yet for the /breeding sub-resource — register the animal in its own tab first, then log breeding via its real endpoint.</div>
            </div>
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-800">Cattle / Poultry</div>
              <div className="text-gray-600 mt-1">No breeding tracking exists in the backend for these two species yet. Genuinely missing, not just unwired.</div>
            </div>
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-800">Why not build it anyway</div>
              <div className="text-gray-600 mt-1">A working-looking form that writes to nothing real, or that forks from the real per-species data, is worse than no tab.</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <ResourceManager
          compact
          accent="blue"
          queryKey="livestock-analytics"
          idField="id"
          list={(params) => livestockAnalyticsAPI.getRecords(params)}
          create={(data) => livestockAnalyticsAPI.createRecord(data)}
          update={(id, data) => livestockAnalyticsAPI.updateRecord(id, data)}
          remove={(id) => livestockAnalyticsAPI.deleteRecord(id)}
          searchPlaceholder="Search by category or period..."
          emptyMessage="No analytics entries recorded yet."
          newLabel="Add Analytics Entry"
          backendNote="Backend endpoint /livestock-analytics/records has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ category: 'Herd Growth', period: '', value: '', unit: '', notes: '' }}
          requiredFields={['category', 'period']}
          columns={[
            { key: 'category', label: 'Category' },
            { key: 'period', label: 'Period' },
            { key: 'value', label: 'Value' },
            { key: 'unit', label: 'Unit' },
          ]}
          fields={[
            { name: 'category', label: 'Category', type: 'select', options: ANALYTICS_CATEGORIES },
            { name: 'period', label: 'Period (e.g. 2026-Q3)', required: true },
            { name: 'value', label: 'Value', type: 'number' },
            { name: 'unit', label: 'Unit (e.g. %, ₹, count)' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Entries', value: items.length },
            { label: 'Categories tracked', value: new Set(items.map((i) => i.category).filter(Boolean)).size },
          ]}
        />
      )}
    </div>
  );
}

export default LivestockManagementPage;
