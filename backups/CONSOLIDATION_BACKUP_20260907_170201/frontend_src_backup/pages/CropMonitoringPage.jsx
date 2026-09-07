import { Eye } from 'lucide-react'
import { cropMonitoringAPI } from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

const OBSERVATION_TYPES = ['Growth Stage', 'Pest Incidence', 'Disease Incidence', 'Nutrient Deficiency', 'Weather Stress', 'General']
const SEVERITY = ['None', 'Low', 'Medium', 'High', 'Critical']

const initialForm = {
  crop_name: '',
  field_reference: '',
  observation_type: 'Growth Stage',
  severity: 'None',
  observed_date: '',
  observer_name: '',
  findings: '',
}

function CropMonitoringPage() {
  return (
    <ResourceManager
      accent="indigo"
      icon={Eye}
      title="Crop Monitoring"
      description="Log field scouting observations — growth stage, pest/disease incidence and stress signals"
      queryKey="crop-monitoring"
      idField="id"
      list={(params) => cropMonitoringAPI.getObservations(params)}
      create={(data) => cropMonitoringAPI.createObservation(data)}
      update={(id, data) => cropMonitoringAPI.updateObservation(id, data)}
      remove={(id) => cropMonitoringAPI.deleteObservation(id)}
      searchPlaceholder="Search by crop or field reference..."
      emptyMessage="No monitoring observations logged yet."
      newLabel="Log Observation"
      backendNote="Backend endpoint /crop-monitoring/observations has not been built yet — this page is wired and ready to work once it is."
      initialForm={initialForm}
      requiredFields={['crop_name', 'observation_type']}
      columns={[
        { key: 'crop_name', label: 'Crop' },
        { key: 'field_reference', label: 'Field' },
        { key: 'observation_type', label: 'Type' },
        { key: 'severity', label: 'Severity', render: (r) => {
          const color = { None: 'bg-gray-100 text-gray-700', Low: 'bg-green-100 text-green-800', Medium: 'bg-yellow-100 text-yellow-800', High: 'bg-orange-100 text-orange-800', Critical: 'bg-red-100 text-red-800' }[r.severity] || 'bg-gray-100 text-gray-700'
          return <span className={`text-xs px-2 py-1 rounded-full ${color}`}>{r.severity || 'None'}</span>
        } },
        { key: 'observed_date', label: 'Observed On' },
        { key: 'observer_name', label: 'Observer' },
      ]}
      fields={[
        { name: 'crop_name', label: 'Crop name', required: true },
        { name: 'field_reference', label: 'Field reference / parcel' },
        { name: 'observation_type', label: 'Observation type', type: 'select', options: OBSERVATION_TYPES },
        { name: 'severity', label: 'Severity', type: 'select', options: SEVERITY },
        { name: 'observed_date', label: 'Observed date', type: 'date' },
        { name: 'observer_name', label: 'Observer name' },
        { name: 'findings', label: 'Findings', type: 'textarea', span: 2 },
      ]}
      stats={(items) => [
        { label: 'Observations logged', value: items.length },
        { label: 'High/Critical severity', value: items.filter((i) => i.severity === 'High' || i.severity === 'Critical').length },
        { label: 'Fields monitored', value: new Set(items.map((i) => i.field_reference).filter(Boolean)).size },
      ]}
    />
  )
}

export default CropMonitoringPage
