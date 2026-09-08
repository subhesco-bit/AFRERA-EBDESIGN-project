import { CalendarRange } from 'lucide-react';
import { cropCalendarAPI } from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Perennial'];

const initialForm = {
  crop_name: '',
  season: 'Kharif',
  region: '',
  sowing_start: '',
  sowing_end: '',
  harvest_start: '',
  harvest_end: '',
  notes: '',
};

function CropCalendarPage() {
  return (
    <ResourceManager
      accent="green"
      icon={CalendarRange}
      title="Crop Calendar"
      description="Plan sowing, input and harvest windows across crops, seasons and regions"
      queryKey="crop-calendar"
      idField="id"
      list={(params) => cropCalendarAPI.getEntries(params)}
      create={(data) => cropCalendarAPI.createEntry(data)}
      update={(id, data) => cropCalendarAPI.updateEntry(id, data)}
      remove={(id) => cropCalendarAPI.deleteEntry(id)}
      searchPlaceholder="Search by crop, season or region..."
      emptyMessage="No crop calendar entries yet."
      newLabel="Add Calendar Entry"
      backendNote="Backend endpoint /crop-calendar/entries has not been built yet — this page is wired and ready to work once it is."
      initialForm={initialForm}
      requiredFields={['crop_name', 'season']}
      columns={[
        { key: 'crop_name', label: 'Crop' },
        { key: 'season', label: 'Season' },
        { key: 'region', label: 'Region' },
        { key: 'sowing_window', label: 'Sowing Window', render: (r) => `${r.sowing_start || '—'} to ${r.sowing_end || '—'}` },
        { key: 'harvest_window', label: 'Harvest Window', render: (r) => `${r.harvest_start || '—'} to ${r.harvest_end || '—'}` },
      ]}
      fields={[
        { name: 'crop_name', label: 'Crop name', required: true },
        { name: 'season', label: 'Season', type: 'select', options: SEASONS },
        { name: 'region', label: 'Region' },
        { name: 'sowing_start', label: 'Sowing window start', type: 'date' },
        { name: 'sowing_end', label: 'Sowing window end', type: 'date' },
        { name: 'harvest_start', label: 'Harvest window start', type: 'date' },
        { name: 'harvest_end', label: 'Harvest window end', type: 'date' },
        { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
      ]}
      stats={(items) => [
        { label: 'Calendar entries', value: items.length },
        { label: 'Crops covered', value: new Set(items.map((i) => i.crop_name).filter(Boolean)).size },
        { label: 'Seasons in use', value: new Set(items.map((i) => i.season).filter(Boolean)).size },
      ]}
    />
  );
}

export default CropCalendarPage;
