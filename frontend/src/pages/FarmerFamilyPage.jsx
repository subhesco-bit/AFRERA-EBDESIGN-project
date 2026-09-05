import { Users } from 'lucide-react';
import { farmerFamilyAPI } from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

const RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Sibling', 'Other Dependent'];

const initialForm = {
  farmer_name: '',
  member_name: '',
  relation: 'Spouse',
  age: '',
  gender: 'Female',
  occupation: '',
  is_dependent: 'Yes',
  notes: '',
};

function FarmerFamilyPage() {
  return (
    <ResourceManager
      accent="teal"
      icon={Users}
      title="Farmer Family"
      description="Track household composition and dependents linked to each farmer record"
      queryKey="farmer-family"
      idField="id"
      list={(params) => farmerFamilyAPI.getMembers(params)}
      create={(data) => farmerFamilyAPI.createMember(data)}
      update={(id, data) => farmerFamilyAPI.updateMember(id, data)}
      remove={(id) => farmerFamilyAPI.deleteMember(id)}
      searchPlaceholder="Search by farmer or member name..."
      emptyMessage="No family members recorded yet."
      newLabel="Add Family Member"
      backendNote="Backend endpoint /farmer-family/members has not been built yet — this page is wired and ready to work once it is."
      initialForm={initialForm}
      requiredFields={['farmer_name', 'member_name']}
      columns={[
        { key: 'farmer_name', label: 'Farmer' },
        { key: 'member_name', label: 'Member' },
        { key: 'relation', label: 'Relation' },
        { key: 'age', label: 'Age' },
        { key: 'gender', label: 'Gender' },
        { key: 'is_dependent', label: 'Dependent' },
      ]}
      fields={[
        { name: 'farmer_name', label: 'Farmer name', required: true },
        { name: 'member_name', label: 'Member name', required: true },
        { name: 'relation', label: 'Relation', type: 'select', options: RELATIONS },
        { name: 'age', label: 'Age', type: 'number' },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { name: 'occupation', label: 'Occupation' },
        { name: 'is_dependent', label: 'Dependent', type: 'select', options: ['Yes', 'No'] },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
      ]}
      stats={(items) => [
        { label: 'Family members', value: items.length },
        { label: 'Dependents', value: items.filter((i) => i.is_dependent === 'Yes').length },
        { label: 'Households', value: new Set(items.map((i) => i.farmer_name).filter(Boolean)).size },
      ]}
    />
  );
}

export default FarmerFamilyPage;
