import { UserCircle2 } from 'lucide-react';
import { farmerProfileAPI } from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

const GENDERS = ['Male', 'Female', 'Other'];
const EDUCATION = ['None', 'Primary', 'Secondary', 'Higher Secondary', 'Graduate', 'Post Graduate'];

const initialForm = {
  full_name: '',
  gender: 'Male',
  date_of_birth: '',
  phone: '',
  village: '',
  district: '',
  state: '',
  education: 'None',
  primary_occupation: '',
  years_farming: '',
  notes: '',
};

function FarmerProfilePage() {
  return (
    <ResourceManager
      accent="green"
      icon={UserCircle2}
      title="Farmer Profile"
      description="Maintain core farmer identity, contact and household demographic records"
      queryKey="farmer-profiles"
      idField="id"
      list={(params) => farmerProfileAPI.getProfiles(params)}
      create={(data) => farmerProfileAPI.createProfile(data)}
      update={(id, data) => farmerProfileAPI.updateProfile(id, data)}
      remove={(id) => farmerProfileAPI.deleteProfile(id)}
      searchPlaceholder="Search by name, village or phone..."
      emptyMessage="No farmer profiles recorded yet."
      newLabel="Add Profile"
      backendNote="Backend endpoint /farmer-profiles has not been built yet — this page is wired and ready to work once it is."
      initialForm={initialForm}
      requiredFields={['full_name', 'village']}
      columns={[
        { key: 'full_name', label: 'Name' },
        { key: 'gender', label: 'Gender' },
        { key: 'location', label: 'Location', render: (r) => [r.village, r.district, r.state].filter(Boolean).join(', ') },
        { key: 'phone', label: 'Phone' },
        { key: 'primary_occupation', label: 'Occupation' },
        { key: 'years_farming', label: 'Years Farming' },
      ]}
      fields={[
        { name: 'full_name', label: 'Full name', required: true },
        { name: 'gender', label: 'Gender', type: 'select', options: GENDERS },
        { name: 'date_of_birth', label: 'Date of birth', type: 'date' },
        { name: 'phone', label: 'Phone' },
        { name: 'village', label: 'Village', required: true },
        { name: 'district', label: 'District' },
        { name: 'state', label: 'State' },
        { name: 'education', label: 'Education', type: 'select', options: EDUCATION },
        { name: 'primary_occupation', label: 'Primary occupation' },
        { name: 'years_farming', label: 'Years farming', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
      ]}
      stats={(items) => [
        { label: 'Registered farmers', value: items.length },
        { label: 'Villages covered', value: new Set(items.map((i) => i.village).filter(Boolean)).size },
        { label: 'Avg. years farming', value: items.length ? (items.reduce((s, i) => s + (Number(i.years_farming) || 0), 0) / items.length).toFixed(1) : '0' },
      ]}
    />
  );
}

export default FarmerProfilePage;
