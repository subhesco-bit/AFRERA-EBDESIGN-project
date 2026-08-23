import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Beef, Bird, Rabbit, PiggyBank, Stethoscope, Wheat, GitBranch, BarChart3, Milk } from 'lucide-react'
import {
  cattleRegistryAPI,
  poultryManagementAPI,
  goatFarmingAPI,
  sheepFarmingAPI,
  pigFarmingAPI,
  animalHealthAPI,
  breedingManagementAPI,
  livestockAnalyticsAPI,
  feedManagementAPI,
} from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

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
]

const CATTLE_BREEDS = ['Gir', 'Sahiwal', 'Red Sindhi', 'Jersey Cross', 'Holstein Friesian Cross', 'Local/Indigenous', 'Other']
const CATTLE_PURPOSE = ['Dairy', 'Draught', 'Dual Purpose']
const POULTRY_TYPES = ['Broiler', 'Layer', 'Backyard/Desi', 'Duck', 'Turkey']
const GOAT_BREEDS = ['Black Bengal', 'Beetal', 'Jamunapari', 'Sirohi', 'Local/Indigenous', 'Other']
const SHEEP_BREEDS = ['Deccani', 'Nellore', 'Marwari', 'Local/Indigenous', 'Other']
const PIG_BREEDS = ['Large White Yorkshire', 'Landrace', 'Hampshire', 'Local/Indigenous', 'Other']
const HEALTH_TYPES = ['Vaccination', 'Deworming', 'Treatment', 'Checkup', 'Disease Outbreak']
const HEALTH_STATUSES = ['Healthy', 'Under Observation', 'Sick', 'Critical', 'Recovered']
const FEED_TYPES = ['Concentrate', 'Green Fodder', 'Dry Fodder', 'Mineral Mixture', 'Silage']
const BREEDING_METHODS = ['Natural', 'Artificial Insemination', 'Embryo Transfer']
const ANALYTICS_CATEGORIES = ['Herd Growth', 'Mortality Rate', 'Productivity', 'Cost per Animal', 'Revenue']

function LivestockManagementPage() {
  const [activeTab, setActiveTab] = useState('cattle')

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
          queryKey="poultry-batches"
          idField="id"
          list={(params) => poultryManagementAPI.getBatches(params)}
          create={(data) => poultryManagementAPI.createBatch(data)}
          update={(id, data) => poultryManagementAPI.updateBatch(id, data)}
          remove={(id) => poultryManagementAPI.deleteBatch(id)}
          searchPlaceholder="Search by batch code or owner..."
          emptyMessage="No poultry batches recorded yet."
          newLabel="Add Batch"
          backendNote="Backend endpoint /poultry/batches has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ batch_code: '', poultry_type: 'Broiler', bird_count: '', owner_name: '', hatch_date: '', notes: '' }}
          requiredFields={['batch_code', 'owner_name']}
          columns={[
            { key: 'batch_code', label: 'Batch' },
            { key: 'poultry_type', label: 'Type' },
            { key: 'bird_count', label: 'Bird Count' },
            { key: 'owner_name', label: 'Owner' },
            { key: 'hatch_date', label: 'Hatch Date' },
          ]}
          fields={[
            { name: 'batch_code', label: 'Batch code', required: true },
            { name: 'poultry_type', label: 'Poultry type', type: 'select', options: POULTRY_TYPES },
            { name: 'bird_count', label: 'Bird count', type: 'number' },
            { name: 'owner_name', label: 'Owner name', required: true },
            { name: 'hatch_date', label: 'Hatch date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Batches', value: items.length },
            { label: 'Total birds', value: items.reduce((s, i) => s + (Number(i.bird_count) || 0), 0).toLocaleString() },
          ]}
        />
      )}

      {activeTab === 'goat' && (
        <ResourceManager
          compact
          accent="teal"
          queryKey="goat-farming"
          idField="id"
          list={(params) => goatFarmingAPI.getAnimals(params)}
          create={(data) => goatFarmingAPI.createAnimal(data)}
          update={(id, data) => goatFarmingAPI.updateAnimal(id, data)}
          remove={(id) => goatFarmingAPI.deleteAnimal(id)}
          searchPlaceholder="Search by tag number or owner..."
          emptyMessage="No goats recorded yet."
          newLabel="Register Goat"
          backendNote="Backend endpoint /goat-farming/animals has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ tag_number: '', breed: 'Local/Indigenous', owner_name: '', date_of_birth: '', notes: '' }}
          requiredFields={['tag_number', 'owner_name']}
          columns={[
            { key: 'tag_number', label: 'Tag No.' },
            { key: 'breed', label: 'Breed' },
            { key: 'owner_name', label: 'Owner' },
            { key: 'date_of_birth', label: 'DOB' },
          ]}
          fields={[
            { name: 'tag_number', label: 'Tag / ear-tag number', required: true },
            { name: 'breed', label: 'Breed', type: 'select', options: GOAT_BREEDS },
            { name: 'owner_name', label: 'Owner name', required: true },
            { name: 'date_of_birth', label: 'Date of birth', type: 'date' },
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
          queryKey="sheep-farming"
          idField="id"
          list={(params) => sheepFarmingAPI.getAnimals(params)}
          create={(data) => sheepFarmingAPI.createAnimal(data)}
          update={(id, data) => sheepFarmingAPI.updateAnimal(id, data)}
          remove={(id) => sheepFarmingAPI.deleteAnimal(id)}
          searchPlaceholder="Search by tag number or owner..."
          emptyMessage="No sheep recorded yet."
          newLabel="Register Sheep"
          backendNote="Backend endpoint /sheep-farming/animals has not been built yet — this tab is wired and ready to work once it is. No prior evidence of this capability anywhere in the codebase (catalogued ABSENT)."
          initialForm={{ tag_number: '', breed: 'Local/Indigenous', owner_name: '', date_of_birth: '', notes: '' }}
          requiredFields={['tag_number', 'owner_name']}
          columns={[
            { key: 'tag_number', label: 'Tag No.' },
            { key: 'breed', label: 'Breed' },
            { key: 'owner_name', label: 'Owner' },
            { key: 'date_of_birth', label: 'DOB' },
          ]}
          fields={[
            { name: 'tag_number', label: 'Tag / ear-tag number', required: true },
            { name: 'breed', label: 'Breed', type: 'select', options: SHEEP_BREEDS },
            { name: 'owner_name', label: 'Owner name', required: true },
            { name: 'date_of_birth', label: 'Date of birth', type: 'date' },
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
          queryKey="pig-farming"
          idField="id"
          list={(params) => pigFarmingAPI.getAnimals(params)}
          create={(data) => pigFarmingAPI.createAnimal(data)}
          update={(id, data) => pigFarmingAPI.updateAnimal(id, data)}
          remove={(id) => pigFarmingAPI.deleteAnimal(id)}
          searchPlaceholder="Search by tag number or owner..."
          emptyMessage="No pigs recorded yet."
          newLabel="Register Pig"
          backendNote="Backend endpoint /pig-farming/animals has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ tag_number: '', breed: 'Local/Indigenous', owner_name: '', date_of_birth: '', notes: '' }}
          requiredFields={['tag_number', 'owner_name']}
          columns={[
            { key: 'tag_number', label: 'Tag No.' },
            { key: 'breed', label: 'Breed' },
            { key: 'owner_name', label: 'Owner' },
            { key: 'date_of_birth', label: 'DOB' },
          ]}
          fields={[
            { name: 'tag_number', label: 'Tag / ear-tag number', required: true },
            { name: 'breed', label: 'Breed', type: 'select', options: PIG_BREEDS },
            { name: 'owner_name', label: 'Owner name', required: true },
            { name: 'date_of_birth', label: 'Date of birth', type: 'date' },
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
        <ResourceManager
          compact
          accent="purple"
          queryKey="breeding-records"
          idField="id"
          list={(params) => breedingManagementAPI.getRecords(params)}
          create={(data) => breedingManagementAPI.createRecord(data)}
          update={(id, data) => breedingManagementAPI.updateRecord(id, data)}
          remove={(id) => breedingManagementAPI.deleteRecord(id)}
          searchPlaceholder="Search by dam or sire tag..."
          emptyMessage="No breeding records yet."
          newLabel="Add Breeding Record"
          backendNote="Backend endpoint /breeding/records has not been built yet — this tab is wired and ready to work once it is."
          initialForm={{ dam_tag: '', sire_tag: '', method: 'Natural', breeding_date: '', expected_date: '', notes: '' }}
          requiredFields={['dam_tag']}
          columns={[
            { key: 'dam_tag', label: 'Dam Tag' },
            { key: 'sire_tag', label: 'Sire Tag' },
            { key: 'method', label: 'Method' },
            { key: 'breeding_date', label: 'Breeding Date' },
            { key: 'expected_date', label: 'Expected Date' },
          ]}
          fields={[
            { name: 'dam_tag', label: 'Dam (female) tag', required: true },
            { name: 'sire_tag', label: 'Sire (male) tag' },
            { name: 'method', label: 'Breeding method', type: 'select', options: BREEDING_METHODS },
            { name: 'breeding_date', label: 'Breeding date', type: 'date' },
            { name: 'expected_date', label: 'Expected delivery date', type: 'date' },
            { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
          ]}
          stats={(items) => [
            { label: 'Breeding records', value: items.length },
            { label: 'AI records', value: items.filter((i) => i.method === 'Artificial Insemination').length },
          ]}
        />
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
  )
}

export default LivestockManagementPage
