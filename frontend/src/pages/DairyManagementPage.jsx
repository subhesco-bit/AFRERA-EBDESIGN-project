import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dairyAPI, dairyAIAPI } from '../services/api';
import { Milk, Plus, X, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ActionCard from '../components/common/ActionCard';

const BREEDS = ['Jersey', 'Holstein Friesian', 'Sahiwal', 'Gir', 'Local / Desi', 'Crossbred'];
const STATUSES = ['Lactating', 'Dry', 'Pregnant', 'Calf', 'Sold'];

const emptyAnimal = { tag_id: '', breed: 'Local / Desi', dob: '', status: 'Lactating', notes: '' };

function DairyManagementPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyAnimal);
  const [milkForm, setMilkForm] = useState({ animal_id: '', date: '', session: 'morning', quantity_liters: '' });
  const [tab, setTab] = useState('animals');
  const [aiAnimalId, setAiAnimalId] = useState('');

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: animalsData, isLoading, error } = useQuery({
    queryKey: ['dairy-animals'],
    queryFn: async () => (await dairyAPI.getAnimals()).data?.data ?? [],
  });

  const { data: milkData, isLoading: milkLoading, error: milkError } = useQuery({
    queryKey: ['dairy-milk-records'],
    queryFn: async () => (await dairyAPI.getMilkRecords()).data?.data ?? [],
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? dairyAPI.updateAnimal(editingId, payload) : dairyAPI.createAnimal(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Animal updated' : 'Animal registered');
      queryClient.invalidateQueries({ queryKey: ['dairy-animals'] });
      closeForm();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save animal'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => dairyAPI.deleteAnimal(id),
    onSuccess: () => { toast.success('Animal removed'); queryClient.invalidateQueries({ queryKey: ['dairy-animals'] }); },
    onError: () => toast.error('Failed to remove animal'),
  });

  const recordMilkMutation = useMutation({
    mutationFn: (payload) => dairyAPI.recordMilk(payload),
    onSuccess: () => {
      toast.success('Milk record added');
      queryClient.invalidateQueries({ queryKey: ['dairy-milk-records'] });
      setMilkForm({ animal_id: '', date: '', session: 'morning', quantity_liters: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record milk yield'),
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyAnimal); };

  const openEdit = (a) => {
    setForm({ tag_id: a.tag_id || '', breed: a.breed || 'Local / Desi', dob: a.dob ? a.dob.slice(0, 10) : '', status: a.status || 'Lactating', notes: a.notes || '' });
    setEditingId(a.id);
    setShowForm(true);
  };

  const animals = animalsData || [];
  const milkRecords = milkData || [];
  const lactating = animals.filter((a) => a.status === 'Lactating').length;
  const totalMilkToday = milkRecords.reduce((s, m) => s + (Number(m.quantity_liters) || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Milk className="w-6 h-6 mr-2 text-indigo-600" />
            Dairy Management
          </h1>
          <p className="text-gray-600">Track herd health, lactation status and daily milk yield</p>
        </div>
        {tab === 'animals' && (
          <button onClick={() => { setForm(emptyAnimal); setEditingId(null); setShowForm(true); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center">
            <Plus className="w-5 h-5 mr-2" />Register Animal
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Herd size</div>
          <div className="text-2xl font-bold text-gray-800">{animals.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Lactating</div>
          <div className="text-2xl font-bold text-gray-800">{lactating}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Milk recorded (L)</div>
          <div className="text-2xl font-bold text-gray-800">{totalMilkToday.toFixed(1)}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[['animals', 'Herd'], ['milk', 'Milk Records'], ['ai', 'AI Insights']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 font-medium border-b-2 transition ${tab === id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'animals' && (
        <>
          {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading herd: {error.message}. Backend endpoint /dairy/animals has not been built yet — this page is wired and ready once it is.
            </div>
          )}
          {!isLoading && !error && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {animals.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">No animals registered yet.</td></tr>}
                  {animals.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{a.tag_id}</td>
                      <td className="px-4 py-3 text-gray-700">{a.breed}</td>
                      <td className="px-4 py-3 text-gray-700">{a.dob ? a.dob.slice(0, 10) : '—'}</td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">{a.status}</span></td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => openEdit(a)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm('Remove this animal?')) deleteMutation.mutate(a.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'milk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Record Milk Yield</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!milkForm.animal_id || !milkForm.date || !milkForm.quantity_liters) { toast.error('Animal, date and quantity are required'); return; }
                recordMilkMutation.mutate({ ...milkForm, quantity_liters: Number(milkForm.quantity_liters) });
              }}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
            >
              <div>
                <label htmlFor="classname-w-full-px-3-py-2-border-border" className="block text-sm font-medium text-gray-700 mb-1">Animal</label>
                <select id="classname-w-full-px-3-py-2-border-border" value={milkForm.animal_id} onChange={(e) => setMilkForm({ ...milkForm, animal_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select</option>
                  {animals.map((a) => <option key={a.id} value={a.id}>{a.tag_id}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="classname-w-full-px-3-py-2-border-border-2" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input id="classname-w-full-px-3-py-2-border-border-2" type="date" value={milkForm.date} onChange={(e) => setMilkForm({ ...milkForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="classname-w-full-px-3-py-2-border-border-3" className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                <select id="classname-w-full-px-3-py-2-border-border-3" value={milkForm.session} onChange={(e) => setMilkForm({ ...milkForm, session: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              <div>
                <label htmlFor="classname-w-full-px-3-py-2-border-border-4" className="block text-sm font-medium text-gray-700 mb-1">Quantity (L)</label>
                <input id="classname-w-full-px-3-py-2-border-border-4" type="number" step="0.1" value={milkForm.quantity_liters} onChange={(e) => setMilkForm({ ...milkForm, quantity_liters: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="submit" disabled={recordMilkMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-60">
                {recordMilkMutation.isPending ? 'Saving...' : 'Record'}
              </button>
            </form>
          </div>

          {milkLoading && <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />}
          {milkError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading milk records: {milkError.message}. Backend endpoint /dairy/milk-records has not been built yet.
            </div>
          )}
          {!milkLoading && !milkError && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Animal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity (L)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {milkRecords.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">No milk records yet.</td></tr>}
                  {milkRecords.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">{m.tag_id || m.animal_id}</td>
                      <td className="px-4 py-3 text-gray-700">{m.date}</td>
                      <td className="px-4 py-3 text-gray-700 capitalize">{m.session}</td>
                      <td className="px-4 py-3 text-gray-700">{m.quantity_liters}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'ai' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <label htmlFor="classname-w-full-md-w-72-px-3-py-2-borde" className="block text-sm font-medium text-gray-700 mb-1">Animal</label>
            <select id="classname-w-full-md-w-72-px-3-py-2-borde" value={aiAnimalId} onChange={(e) => setAiAnimalId(e.target.value)}
              className="w-full md:w-72 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">Select an animal</option>
              {animals.map((a) => <option key={a.id} value={a.id}>{a.tag_id}</option>)}
            </select>
          </div>
          {!aiAnimalId && (
            <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg p-4">
              Select an animal above to run AI actions against it.
            </div>
          )}
          {aiAnimalId && (
            <>
              <ActionCard
                title="Optimize Milk Production"
                description="AI analysis of recent yield trend and fat content, with recommendations."
                onRun={() => dairyAIAPI.optimizeMilkProduction(aiAnimalId)}
              />
              <ActionCard
                title="Predict Health Risks"
                description="AI-powered health risk prediction from recent records."
                onRun={() => dairyAIAPI.predictHealthRisks(aiAnimalId)}
              />
              <ActionCard
                title="Optimize Feed Composition"
                description="AI-recommended feed composition for a given production goal."
                fields={[{ name: 'productionGoal', label: 'Production Goal', placeholder: 'e.g. increase milk yield' }]}
                onRun={(v) => dairyAIAPI.optimizeFeedComposition(aiAnimalId, { productionGoal: v.productionGoal })}
              />
              <ActionCard
                title="Recommend Breeding"
                description="AI-powered breeding recommendations."
                onRun={() => dairyAIAPI.recommendBreeding(aiAnimalId)}
              />
            </>
          )}
        </div>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Animal' : 'Register Animal'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); if (!form.tag_id) { toast.error('Tag ID is required'); return; } saveMutation.mutate(form); }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-5" className="block text-sm font-medium text-gray-700 mb-1">Tag ID *</label>
                  <input id="classname-w-full-px-3-py-2-border-border-5" value={form.tag_id} onChange={(e) => setForm({ ...form, tag_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g., COW-014" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-6" className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                    <select id="classname-w-full-px-3-py-2-border-border-6" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      {BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-7" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select id="classname-w-full-px-3-py-2-border-border-7" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-8" className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
                  <input id="classname-w-full-px-3-py-2-border-border-8" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-9" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea id="classname-w-full-px-3-py-2-border-border-9" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-60">
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Register Animal'}
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

export default DairyManagementPage;
