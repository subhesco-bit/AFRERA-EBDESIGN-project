import { Flower2 } from 'lucide-react';
import { nurseryAPI } from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

const NURSERY_TYPES = ['Seedling', 'Sapling', 'Tissue Culture', 'Poly-house'];
const STATUS = ['Active', 'Seasonal Closure', 'Closed'];

const initialForm = {
  nursery_name: '',
  nursery_type: 'Seedling',
  village: '',
  district: '',
  capacity: '',
  crops_raised: '',
  status: 'Active',
  notes: '',
};

function NurseryManagementPage() {
  return (
    <ResourceManager
      accent="teal"
      icon={Flower2}
      title="Nursery Management"
      description="Register and track seedling, sapling and tissue-culture nurseries and their capacity"
      queryKey="nurseries"
      idField="id"
      list={(params) => nurseryAPI.getNurseries(params)}
      create={(data) => nurseryAPI.createNursery(data)}
      update={(id, data) => nurseryAPI.updateNursery(id, data)}
      remove={(id) => nurseryAPI.deleteNursery(id)}
      searchPlaceholder="Search by nursery name or village..."
      emptyMessage="No nurseries registered yet."
      newLabel="Register Nursery"
      backendNote="Backend endpoint /nurseries has not been built yet — this page is wired and ready to work once it is."
      initialForm={initialForm}
      requiredFields={['nursery_name', 'village']}
      columns={[
        { key: 'nursery_name', label: 'Nursery' },
        { key: 'nursery_type', label: 'Type' },
        { key: 'location', label: 'Location', render: (r) => [r.village, r.district].filter(Boolean).join(', ') },
        { key: 'capacity', label: 'Capacity (units)' },
        { key: 'crops_raised', label: 'Crops Raised' },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'nursery_name', label: 'Nursery name', required: true },
        { name: 'nursery_type', label: 'Nursery type', type: 'select', options: NURSERY_TYPES },
        { name: 'village', label: 'Village', required: true },
        { name: 'district', label: 'District' },
        { name: 'capacity', label: 'Capacity (units)', type: 'number' },
        { name: 'crops_raised', label: 'Crops raised', placeholder: 'e.g. Tomato, Chilli, Papaya' },
        { name: 'status', label: 'Status', type: 'select', options: STATUS },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
      ]}
      stats={(items) => [
        { label: 'Nurseries', value: items.length },
        { label: 'Active', value: items.filter((i) => i.status === 'Active').length },
        { label: 'Total capacity', value: items.reduce((s, i) => s + (Number(i.capacity) || 0), 0) },
      ]}
    />
  );
}

export default NurseryManagementPage;
