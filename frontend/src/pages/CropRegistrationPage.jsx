import { Sprout } from 'lucide-react';
import { cropRegistrationAPI } from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

const CROP_TYPES = ['Cereal', 'Pulse', 'Oilseed', 'Vegetable', 'Fruit', 'Spice', 'Fibre', 'Plantation'];
const STATUS = ['Active', 'Under Review', 'Retired'];

const initialForm = {
  crop_name: '',
  crop_code: '',
  crop_type: 'Cereal',
  botanical_name: '',
  duration_days: '',
  status: 'Active',
  notes: '',
};

function CropRegistrationPage() {
  return (
    <ResourceManager
      accent="green"
      icon={Sprout}
      title="Crop Registration"
      description="Maintain the master registry of crops recognised across the platform"
      queryKey="crop-registration"
      idField="id"
      list={(params) => cropRegistrationAPI.getCrops(params)}
      create={(data) => cropRegistrationAPI.registerCrop(data)}
      update={(id, data) => cropRegistrationAPI.updateCrop(id, data)}
      remove={(id) => cropRegistrationAPI.deleteCrop(id)}
      searchPlaceholder="Search by crop name or code..."
      emptyMessage="No crops registered yet."
      newLabel="Register Crop"
      backendNote="Backend endpoint /crop-registration/crops has not been built yet — this page is wired and ready to work once it is."
      initialForm={initialForm}
      requiredFields={['crop_name', 'crop_type']}
      columns={[
        { key: 'crop_name', label: 'Crop' },
        { key: 'crop_code', label: 'Code' },
        { key: 'crop_type', label: 'Type' },
        { key: 'botanical_name', label: 'Botanical Name' },
        { key: 'duration_days', label: 'Duration (days)' },
        { key: 'status', label: 'Status' },
      ]}
      fields={[
        { name: 'crop_name', label: 'Crop name', required: true },
        { name: 'crop_code', label: 'Crop code', placeholder: 'Auto-generated if blank' },
        { name: 'crop_type', label: 'Crop type', type: 'select', options: CROP_TYPES },
        { name: 'botanical_name', label: 'Botanical name' },
        { name: 'duration_days', label: 'Duration (days)', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: STATUS },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
      ]}
      stats={(items) => [
        { label: 'Registered crops', value: items.length },
        { label: 'Active', value: items.filter((i) => i.status === 'Active').length },
        { label: 'Crop types', value: new Set(items.map((i) => i.crop_type).filter(Boolean)).size },
      ]}
    />
  );
}

export default CropRegistrationPage;
