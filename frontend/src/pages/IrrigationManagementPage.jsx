import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { irrigationAPI } from '../services/api';
import { Droplets, Plus, X, Waves, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';

const SOURCE_TYPES = ['Borewell', 'Canal', 'Tank/Pond', 'River Lift', 'Rainwater Harvesting'];
const METHODS = ['Drip', 'Sprinkler', 'Flood', 'Furrow'];

const emptySchedule = { field_name: '', crop: '', method: 'Drip', frequency_days: '', duration_minutes: '', water_source: '' };

function IrrigationManagementPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptySchedule);
  const [tab, setTab] = useState('schedules');

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: schedulesData, isLoading, error } = useQuery({
    queryKey: ['irrigation-schedules'],
    queryFn: async () => (await irrigationAPI.getSchedules()).data?.data ?? [],
  });

  const { data: sourcesData, isLoading: sourcesLoading, error: sourcesError } = useQuery({
    queryKey: ['irrigation-water-sources'],
    queryFn: async () => (await irrigationAPI.getWaterSources()).data?.data ?? [],
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? irrigationAPI.updateSchedule(editingId, payload) : irrigationAPI.createSchedule(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Schedule updated' : 'Schedule created');
      queryClient.invalidateQueries({ queryKey: ['irrigation-schedules'] });
      closeForm();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save schedule'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => irrigationAPI.deleteSchedule(id),
    onSuccess: () => { toast.success('Schedule removed'); queryClient.invalidateQueries({ queryKey: ['irrigation-schedules'] }); },
    onError: () => toast.error('Failed to remove schedule'),
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptySchedule); };

  const openEdit = (s) => {
    setForm({
      field_name: s.field_name || '', crop: s.crop || '', method: s.method || 'Drip',
      frequency_days: s.frequency_days ?? '', duration_minutes: s.duration_minutes ?? '', water_source: s.water_source || '',
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const schedules = schedulesData || [];
  const sources = sourcesData || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Droplets className="w-6 h-6 mr-2 text-blue-600" />
            Irrigation Management
          </h1>
          <p className="text-gray-600">Schedule field irrigation and track water sources</p>
        </div>
        {tab === 'schedules' && (
          <button onClick={() => { setForm(emptySchedule); setEditingId(null); setShowForm(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center">
            <Plus className="w-5 h-5 mr-2" />New Schedule
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Active schedules</div>
          <div className="text-2xl font-bold text-gray-800">{schedules.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Water sources</div>
          <div className="text-2xl font-bold text-gray-800">{sources.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Drip-irrigated fields</div>
          <div className="text-2xl font-bold text-gray-800">{schedules.filter((s) => s.method === 'Drip').length}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[['schedules', 'Schedules'], ['sources', 'Water Sources']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 font-medium border-b-2 transition ${tab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'schedules' && (
        <>
          {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading schedules: {error.message}. Backend endpoint /irrigation/schedules has not been built yet — this page is wired and ready once it is.
            </div>
          )}
          {!isLoading && !error && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field / Crop</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Water Source</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedules.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No irrigation schedules yet.</td></tr>}
                  {schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{s.field_name}</div>
                        <div className="text-xs text-gray-500">{s.crop || '—'}</div>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">{s.method}</span></td>
                      <td className="px-4 py-3 text-gray-700">Every {s.frequency_days} day(s)</td>
                      <td className="px-4 py-3 text-gray-700">{s.duration_minutes} min</td>
                      <td className="px-4 py-3 text-gray-700">{s.water_source || '—'}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => openEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm('Delete this schedule?')) deleteMutation.mutate(s.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'sources' && (
        <>
          {sourcesLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {sourcesError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading water sources: {sourcesError.message}. Backend endpoint /irrigation/water-sources has not been built yet.
            </div>
          )}
          {!sourcesLoading && !sourcesError && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sources.length === 0 && (
                <div className="col-span-full text-center py-10 bg-white rounded-lg shadow text-gray-500">No water sources registered yet.</div>
              )}
              {sources.map((src) => (
                <div key={src.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center mb-2">
                    <Waves className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="font-semibold text-gray-800">{src.name || src.type}</span>
                  </div>
                  <div className="text-sm text-gray-600">{src.type}</div>
                  <div className="text-sm text-gray-600">Capacity: {src.capacity_liters ? `${src.capacity_liters} L` : '—'}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Schedule' : 'New Irrigation Schedule'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.field_name || !form.frequency_days) { toast.error('Field and frequency are required'); return; }
                  saveMutation.mutate({
                    ...form,
                    frequency_days: Number(form.frequency_days),
                    duration_minutes: form.duration_minutes === '' ? null : Number(form.duration_minutes),
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border" className="block text-sm font-medium text-gray-700 mb-1">Field name *</label>
                  <input id="classname-w-full-px-3-py-2-border-border" value={form.field_name} onChange={(e) => setForm({ ...form, field_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-2" className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
                  <input id="classname-w-full-px-3-py-2-border-border-2" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-3" className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                    <select id="classname-w-full-px-3-py-2-border-border-3" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-4" className="block text-sm font-medium text-gray-700 mb-1">Water source</label>
                    <select id="classname-w-full-px-3-py-2-border-border-4" value={form.water_source} onChange={(e) => setForm({ ...form, water_source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Select source</option>
                      {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-5" className="block text-sm font-medium text-gray-700 mb-1">Frequency (days) *</label>
                    <input id="classname-w-full-px-3-py-2-border-border-5" type="number" value={form.frequency_days} onChange={(e) => setForm({ ...form, frequency_days: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-6" className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input id="classname-w-full-px-3-py-2-border-border-6" type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60">
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Create Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default IrrigationManagementPage;
