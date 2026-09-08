import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { poultryAPI, poultryAIAPI } from '../services/api';
import { Egg, Plus, X, Trash2, Edit, Syringe, AlertTriangle, TrendingDown, TrendingUp, Wheat, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ActionCard from '../components/common/ActionCard';

const BREEDS = ['Broiler', 'Layer', 'Dual Purpose', 'Native / Desi', 'Crossbred'];
const FLOCK_TYPES = ['Broiler', 'Layer', 'Breeder'];
const STATUSES = ['Active', 'Sold', 'Deceased', 'Quarantine'];

// Real backend fields (poultryService.js createFlock): flock_code, flock_type,
// breed, placement_date, initial_bird_count, house_id, notes - flock_type is
// required and was missing entirely; flock_id/initial_count were renamed.
const emptyFlock = {
  flock_code: '', flock_type: 'Layer', breed: 'Native / Desi', placement_date: '', house_id: '', initial_bird_count: '', status: 'Active', notes: '',
};

function PoultryManagementPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyFlock);
  // Real fields (recordEggProduction): flock_id, record_date, total_eggs,
  // good_eggs, damaged_eggs, average_weight_grams, notes - "session" has no
  // backend equivalent (removed rather than silently dropped on submit).
  const [eggForm, setEggForm] = useState({ flock_id: '', record_date: '', total_eggs: '', damaged_eggs: '' });
  const [feedForm, setFeedForm] = useState({ flock_id: '', record_date: '', feed_type: '', quantity_kg: '', cost_per_kg: '' });
  const [tab, setTab] = useState('flocks');
  const [aiFlockId, setAiFlockId] = useState('');

  const { data: flocksData, isLoading, error } = useQuery({
    queryKey: ['poultry-flocks'],
    // listFlocks returns { items, pagination }, not a bare array
    queryFn: async () => (await poultryAPI.listFlocks()).data?.data?.items ?? [],
  });

  const { data: eggData, isLoading: eggLoading, error: eggError } = useQuery({
    queryKey: ['poultry-egg-production'],
    queryFn: async () => (await poultryAPI.listEggProduction()).data?.data?.items ?? [],
  });

  const { data: performanceData, isLoading: performanceLoading, error: performanceError } = useQuery({
    queryKey: ['poultry-performance'],
    queryFn: async () => (await poultryAPI.getFlockPerformance()).data?.data ?? null,
    enabled: tab === 'insights',
  });

  const { data: vaccinationAlertsData, isLoading: vaccinationAlertsLoading, error: vaccinationAlertsError } = useQuery({
    queryKey: ['poultry-vaccination-alerts'],
    queryFn: async () => (await poultryAPI.getVaccinationAlerts()).data?.data ?? null,
    enabled: tab === 'insights',
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? poultryAPI.updateFlock(editingId, payload) : poultryAPI.createFlock(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Flock updated' : 'Flock registered');
      queryClient.invalidateQueries({ queryKey: ['poultry-flocks'] });
      closeForm();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save flock'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => poultryAPI.deleteFlock(id),
    onSuccess: () => { toast.success('Flock removed'); queryClient.invalidateQueries({ queryKey: ['poultry-flocks'] }); },
    onError: () => toast.error('Failed to remove flock'),
  });

  const recordEggMutation = useMutation({
    mutationFn: (payload) => poultryAPI.recordEggProduction(payload),
    onSuccess: () => {
      toast.success('Egg production recorded');
      queryClient.invalidateQueries({ queryKey: ['poultry-egg-production'] });
      setEggForm({ flock_id: '', record_date: '', total_eggs: '', damaged_eggs: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record egg production'),
  });

  const recordFeedMutation = useMutation({
    mutationFn: (payload) => poultryAPI.recordFeedConsumption(payload),
    onSuccess: () => {
      toast.success('Feed consumption recorded');
      queryClient.invalidateQueries({ queryKey: ['poultry-feed-consumption'] });
      setFeedForm({ flock_id: '', record_date: '', feed_type: '', quantity_kg: '', cost_per_kg: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record feed consumption'),
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyFlock); };

  const openEdit = (f) => {
    setForm({
      flock_code: f.flock_code || '', flock_type: f.flock_type || 'Layer', breed: f.breed || 'Native / Desi', placement_date: f.placement_date ? f.placement_date.slice(0, 10) : '',
      house_id: f.house_id || '', initial_bird_count: f.initial_bird_count || '', status: f.status || 'Active', notes: f.notes || '',
    });
    setEditingId(f.id);
    setShowForm(true);
  };

  const flocks = flocksData || [];
  const eggRecords = eggData || [];
  const activeFlocks = flocks.filter((f) => f.status === 'Active').length;
  const totalEggsToday = eggRecords.reduce((s, e) => s + (Number(e.total_eggs) || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Egg className="w-6 h-6 mr-2 text-orange-600" />
            Poultry Management
          </h1>
          <p className="text-gray-600">Track flock health, egg production, and feed consumption</p>
        </div>
        {tab === 'flocks' && (
          <button onClick={() => { setForm(emptyFlock); setEditingId(null); setShowForm(true); }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Add Flock
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {['flocks', 'production', 'feed', 'insights', 'ai_insights'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium ${tab === t ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-600'}`}>
            {t === 'ai_insights' ? 'AI Insights' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'flocks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Active Flocks</div>
            <div className="text-2xl font-bold text-gray-800">{activeFlocks}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Total Birds</div>
            <div className="text-2xl font-bold text-gray-800">{flocks.reduce((s, f) => s + (Number(f.initial_bird_count) || 0), 0)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-gray-500 text-sm">Eggs Today</div>
            <div className="text-2xl font-bold text-gray-800">{totalEggsToday}</div>
          </div>
        </div>
      )}

      {tab === 'flocks' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flock ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placement Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {flocks.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{f.flock_code}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{f.breed}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{f.placement_date ? f.placement_date.slice(0, 10) : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{f.initial_bird_count}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${f.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button onClick={() => openEdit(f)} className="text-blue-600 hover:text-blue-800 mr-2"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => deleteMutation.mutate(f.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'production' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><Egg className="w-5 h-5 mr-2" /> Record Egg Production</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input placeholder="Flock ID" value={eggForm.flock_id} onChange={(e) => setEggForm({...eggForm, flock_id: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" value={eggForm.record_date} onChange={(e) => setEggForm({...eggForm, record_date: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="number" placeholder="Total Eggs" value={eggForm.total_eggs} onChange={(e) => setEggForm({...eggForm, total_eggs: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="number" placeholder="Damaged Eggs" value={eggForm.damaged_eggs} onChange={(e) => setEggForm({...eggForm, damaged_eggs: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <button onClick={() => recordEggMutation.mutate(eggForm)} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Record Production</button>
        </div>
      )}

      {tab === 'feed' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center"><Wheat className="w-5 h-5 mr-2" /> Record Feed Consumption</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input placeholder="Flock ID" value={feedForm.flock_id} onChange={(e) => setFeedForm({...feedForm, flock_id: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="date" value={feedForm.record_date} onChange={(e) => setFeedForm({...feedForm, record_date: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Feed Type" value={feedForm.feed_type} onChange={(e) => setFeedForm({...feedForm, feed_type: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="number" placeholder="Quantity (kg)" value={feedForm.quantity_kg} onChange={(e) => setFeedForm({...feedForm, quantity_kg: e.target.value})} className="px-3 py-2 border rounded" />
            <input type="number" placeholder="Cost per kg" value={feedForm.cost_per_kg} onChange={(e) => setFeedForm({...feedForm, cost_per_kg: e.target.value})} className="px-3 py-2 border rounded" />
          </div>
          <button onClick={() => recordFeedMutation.mutate(feedForm)} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Record Feed</button>
        </div>
      )}

      {tab === 'ai_insights' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Flock</label>
            <select value={aiFlockId} onChange={(e) => setAiFlockId(e.target.value)} className="w-full md:w-72 px-3 py-2 border rounded">
              <option value="">Select a flock</option>
              {flocks.map((f) => <option key={f.id} value={f.id}>{f.flock_code}</option>)}
            </select>
          </div>
          {!aiFlockId && (
            <div className="text-sm text-gray-500 bg-white border rounded-lg p-4">Select a flock above to run AI actions against it.</div>
          )}
          {aiFlockId && (
            <>
              <ActionCard
                title="Optimize Egg Production"
                description="AI analysis of recent egg production trend, with recommendations."
                onRun={() => poultryAIAPI.optimizeEggProduction(aiFlockId)}
              />
              <ActionCard
                title="Monitor Flock Health"
                description="AI-powered health risk monitoring for this flock."
                onRun={() => poultryAIAPI.monitorFlockHealth(aiFlockId)}
              />
              <ActionCard
                title="Optimize Feed"
                description="AI-recommended feed composition for a given production goal."
                fields={[{ name: 'productionGoal', label: 'Production Goal', placeholder: 'e.g. increase egg yield' }]}
                onRun={(v) => poultryAIAPI.optimizePoultryFeed(aiFlockId, { productionGoal: v.productionGoal })}
              />
              <ActionCard
                title="Predict Mortality Risk"
                description="AI-powered mortality risk prediction for this flock."
                onRun={() => poultryAIAPI.predictMortalityRisk(aiFlockId)}
              />
            </>
          )}
        </div>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit Flock' : 'Add New Flock'}</h3>
              <button onClick={closeForm} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Flock code" value={form.flock_code} onChange={(e) => setForm({...form, flock_code: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <select value={form.flock_type} onChange={(e) => setForm({...form, flock_type: e.target.value})} className="w-full px-3 py-2 border rounded">
                {FLOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={form.breed} onChange={(e) => setForm({...form, breed: e.target.value})} className="w-full px-3 py-2 border rounded">
                {BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <input type="date" value={form.placement_date} onChange={(e) => setForm({...form, placement_date: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <input placeholder="House ID" value={form.house_id} onChange={(e) => setForm({...form, house_id: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <input type="number" placeholder="Initial bird count" value={form.initial_bird_count} onChange={(e) => setForm({...form, initial_bird_count: e.target.value})} className="w-full px-3 py-2 border rounded" />
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border rounded" rows="3" />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => saveMutation.mutate(form)} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Save</button>
              <button onClick={closeForm} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default PoultryManagementPage;
