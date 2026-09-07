import { Leaf } from 'lucide-react'
import { cropVarietyAPI } from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

const YIELD_POTENTIAL = ['Low', 'Medium', 'High']
const RESISTANCE = ['Susceptible', 'Moderate', 'Resistant']

const initialForm = {
  crop_name: '',
  variety_name: '',
  developer: '',
  yield_potential: 'Medium',
  disease_resistance: 'Moderate',
  maturity_days: '',
  notes: '',
}

function CropVarietyPage() {
  return (
    <ResourceManager
      accent="green"
      icon={Leaf}
      title="Crop Variety Management"
      description="Catalogue crop varieties/cultivars with yield potential and resistance traits"
      queryKey="crop-varieties"
      idField="id"
      list={(params) => cropVarietyAPI.getVarieties(params)}
      create={(data) => cropVarietyAPI.createVariety(data)}
      update={(id, data) => cropVarietyAPI.updateVariety(id, data)}
      remove={(id) => cropVarietyAPI.deleteVariety(id)}
      searchPlaceholder="Search by crop or variety name..."
      emptyMessage="No crop varieties recorded yet."
      newLabel="Add Variety"
      backendNote="Backend endpoint /crop-varieties has not been built yet — this page is wired and ready to work once it is."
      initialForm={initialForm}
      requiredFields={['crop_name', 'variety_name']}
      columns={[
        { key: 'crop_name', label: 'Crop' },
        { key: 'variety_name', label: 'Variety' },
        { key: 'developer', label: 'Developer/Source' },
        { key: 'yield_potential', label: 'Yield Potential' },
        { key: 'disease_resistance', label: 'Disease Resistance' },
        { key: 'maturity_days', label: 'Maturity (days)' },
      ]}
      fields={[
        { name: 'crop_name', label: 'Crop name', required: true },
        { name: 'variety_name', label: 'Variety name', required: true },
        { name: 'developer', label: 'Developer / source institute' },
        { name: 'yield_potential', label: 'Yield potential', type: 'select', options: YIELD_POTENTIAL },
        { name: 'disease_resistance', label: 'Disease resistance', type: 'select', options: RESISTANCE },
        { name: 'maturity_days', label: 'Maturity (days)', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
      ]}
      stats={(items) => [
        { label: 'Varieties catalogued', value: items.length },
        { label: 'Crops covered', value: new Set(items.map((i) => i.crop_name).filter(Boolean)).size },
        { label: 'High yield potential', value: items.filter((i) => i.yield_potential === 'High').length },
      ]}
    />
  )
}

export default CropVarietyPage
