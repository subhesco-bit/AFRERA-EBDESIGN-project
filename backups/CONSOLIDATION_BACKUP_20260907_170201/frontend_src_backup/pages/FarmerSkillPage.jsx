import { GraduationCap } from 'lucide-react'
import { farmerSkillAPI } from '../services/api'
import ResourceManager from '../components/common/ResourceManager'

const SKILL_CATEGORIES = ['Crop Production', 'Livestock', 'Machinery Operation', 'Post-Harvest', 'Financial Literacy', 'Digital Literacy', 'Organic Farming']
const PROFICIENCY = ['Beginner', 'Intermediate', 'Advanced', 'Trainer']

const initialForm = {
  farmer_name: '',
  skill_name: '',
  category: 'Crop Production',
  proficiency: 'Beginner',
  training_provider: '',
  certified: 'No',
  acquired_date: '',
  notes: '',
}

function FarmerSkillPage() {
  return (
    <ResourceManager
      accent="purple"
      icon={GraduationCap}
      title="Farmer Skill Management"
      description="Record training, certifications and skill proficiency for farmers"
      queryKey="farmer-skills"
      idField="id"
      list={(params) => farmerSkillAPI.getSkills(params)}
      create={(data) => farmerSkillAPI.addSkill(data)}
      update={(id, data) => farmerSkillAPI.updateSkill(id, data)}
      remove={(id) => farmerSkillAPI.deleteSkill(id)}
      searchPlaceholder="Search by farmer or skill..."
      emptyMessage="No skill records yet."
      newLabel="Add Skill Record"
      backendNote="Backend endpoint /farmer-skills has not been built yet — this page is wired and ready to work once it is."
      initialForm={initialForm}
      requiredFields={['farmer_name', 'skill_name']}
      columns={[
        { key: 'farmer_name', label: 'Farmer' },
        { key: 'skill_name', label: 'Skill' },
        { key: 'category', label: 'Category' },
        { key: 'proficiency', label: 'Proficiency' },
        { key: 'training_provider', label: 'Provider' },
        { key: 'certified', label: 'Certified' },
      ]}
      fields={[
        { name: 'farmer_name', label: 'Farmer name', required: true },
        { name: 'skill_name', label: 'Skill name', required: true },
        { name: 'category', label: 'Category', type: 'select', options: SKILL_CATEGORIES },
        { name: 'proficiency', label: 'Proficiency', type: 'select', options: PROFICIENCY },
        { name: 'training_provider', label: 'Training provider' },
        { name: 'certified', label: 'Certified', type: 'select', options: ['Yes', 'No'] },
        { name: 'acquired_date', label: 'Acquired date', type: 'date' },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
      ]}
      stats={(items) => [
        { label: 'Skill records', value: items.length },
        { label: 'Certified', value: items.filter((i) => i.certified === 'Yes').length },
        { label: 'Farmers covered', value: new Set(items.map((i) => i.farmer_name).filter(Boolean)).size },
      ]}
    />
  )
}

export default FarmerSkillPage
