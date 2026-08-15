import { HeartPulse } from 'lucide-react'
import { farmerWelfareAPI } from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

const SCHEME_TYPES = ['Health Insurance', 'Pension', 'Accident Cover', 'Maternity Benefit', 'Disability Support', 'Nutrition Programme']
const STATUS = ['Enrolled', 'Applied', 'Not Enrolled', 'Lapsed']

const initialForm = {
  farmer_name: '',
  scheme_type: 'Health Insurance',
  scheme_name: '',
  status: 'Applied',
  enrollment_date: '',
  beneficiaries: '',
  notes: '',
}

function FarmerHealthWelfarePage() {
  return (
    <ResourceManager
      accent="rose"
      icon={HeartPulse}
      title="Farmer Health & Welfare"
      description="Track enrolment in health, pension and welfare schemes for farmers and their households"
      queryKey="farmer-welfare"
      idField="id"
      list={(params) => farmerWelfareAPI.getRecords(params)}
      create={(data) => farmerWelfareAPI.createRecord(data)}
      update={(id, data) => farmerWelfareAPI.updateRecord(id, data)}
      remove={(id) => farmerWelfareAPI.deleteRecord(id)}
      searchPlaceholder="Search by farmer or scheme..."
      emptyMessage="No welfare records yet."
      newLabel="Add Welfare Record"
      backendNote="Backend endpoint /farmer-welfare/records has not been built yet — this page is wired and ready to work once it is."
      initialForm={initialForm}
      requiredFields={['farmer_name', 'scheme_type']}
      columns={[
        { key: 'farmer_name', label: 'Farmer' },
        { key: 'scheme_type', label: 'Scheme Type' },
        { key: 'scheme_name', label: 'Scheme' },
        { key: 'status', label: 'Status' },
        { key: 'beneficiaries', label: 'Beneficiaries' },
        { key: 'enrollment_date', label: 'Enrolled On' },
      ]}
      fields={[
        { name: 'farmer_name', label: 'Farmer name', required: true },
        { name: 'scheme_type', label: 'Scheme type', type: 'select', options: SCHEME_TYPES },
        { name: 'scheme_name', label: 'Scheme name' },
        { name: 'status', label: 'Status', type: 'select', options: STATUS },
        { name: 'enrollment_date', label: 'Enrollment date', type: 'date' },
        { name: 'beneficiaries', label: 'Beneficiaries covered', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
      ]}
      stats={(items) => [
        { label: 'Welfare records', value: items.length },
        { label: 'Enrolled', value: items.filter((i) => i.status === 'Enrolled').length },
        { label: 'Beneficiaries', value: items.reduce((s, i) => s + (Number(i.beneficiaries) || 0), 0) },
      ]}
    />
  )
}

export default FarmerHealthWelfarePage
