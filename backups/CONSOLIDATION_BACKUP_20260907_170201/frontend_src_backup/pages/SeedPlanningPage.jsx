import { Wheat } from 'lucide-react'
import { seedPlanningAPI } from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Perennial']
const SOURCES = ['Certified Dealer', 'Government Scheme', 'Farm Saved', 'FPO Pooled', 'Research Institute']
const STATUS = ['Planned', 'Procured', 'Distributed']

const initialForm = {
  crop_name: '',
  season: 'Kharif',
  planned_area_ha: '',
  seed_rate_kg_per_ha: '',
  seed_source: 'Certified Dealer',
  status: 'Planned',
  notes: '',
}

function SeedPlanningPage() {
  return (
    <ResourceManager
      accent="amber"
      icon={Wheat}
      title="Seed Planning"
      description="Plan seed requirement, sourcing and distribution ahead of the sowing season"
      queryKey="seed-planning"
      idField="id"
      list={(params) => seedPlanningAPI.getPlans(params)}
      create={(data) => seedPlanningAPI.createPlan(data)}
      update={(id, data) => seedPlanningAPI.updatePlan(id, data)}
      remove={(id) => seedPlanningAPI.deletePlan(id)}
      searchPlaceholder="Search by crop or season..."
      emptyMessage="No seed plans recorded yet."
      newLabel="Add Seed Plan"
      backendNote="Backend endpoint /seed-planning/plans has not been built yet — this page is wired and ready to work once it is."
      initialForm={initialForm}
      requiredFields={['crop_name', 'season']}
      columns={[
        { key: 'crop_name', label: 'Crop' },
        { key: 'season', label: 'Season' },
        { key: 'planned_area_ha', label: 'Planned Area (ha)' },
        { key: 'seed_requirement', label: 'Seed Required (kg)', render: (r) => {
          const area = Number(r.planned_area_ha) || 0
          const rate = Number(r.seed_rate_kg_per_ha) || 0
          return (area * rate) ? (area * rate).toFixed(1) : '—'
        } },
        { key: 'seed_source', label: 'Source' },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'crop_name', label: 'Crop name', required: true },
        { name: 'season', label: 'Season', type: 'select', options: SEASONS },
        { name: 'planned_area_ha', label: 'Planned area (hectares)', type: 'number' },
        { name: 'seed_rate_kg_per_ha', label: 'Seed rate (kg/ha)', type: 'number' },
        { name: 'seed_source', label: 'Seed source', type: 'select', options: SOURCES },
        { name: 'status', label: 'Status', type: 'select', options: STATUS },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
      ]}
      stats={(items) => [
        { label: 'Seed plans', value: items.length },
        { label: 'Planned area (ha)', value: items.reduce((s, i) => s + (Number(i.planned_area_ha) || 0), 0).toFixed(1) },
        { label: 'Distributed', value: items.filter((i) => i.status === 'Distributed').length },
      ]}
    />
  )
}

export default SeedPlanningPage
