import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { villageAPI } from '../../../../frontend/src/services/villageAPI';
import { Home, Plus, X, Trash2, Edit, Users2 } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', village_code: '', district: '', state: '', block: '', tehsil: '', gram_panchayat: '', pincode: '', population: '', households: '', notes: '', status: 'active' };

export default function VillageRegistryPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['villages', search],
    queryFn: async () => (await villageAPI.getVillages(search ? { search } : {})).data?.data ?? [],
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => editingId ? villageAPI.updateVillage(editingId, payload) : villageAPI.createVillage(payload),
    onSuccess: () => { toast.success(editingId ? 'Village updated' : 'Village registered'); queryClient.invalidateQueries({ queryKey: ['villages'] }); closeForm(); },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save village'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => villageAPI.deleteVillage(id),
    onSuccess: () => { toast.success('Village archived'); queryClient.invalidateQueries({ queryKey: ['villages'] }); },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to archive village'),
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); };
  const villages = data || [];

  return <div className="container mx-auto px-4 py-8">
    <div className="flex justify-between items-center mb-8">
      <div><h1 className="text-2xl font-bold flex items-center"><Home className="w-6 h-6 mr-2 text-teal-600" />Village Registry</h1><p className="text-gray-600 mt-2">Canonical village master-data registry</p></div>
      <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center"><Plus className="w-5 h-5 mr-2" />Register Village</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Stat label="Villages" value={villages.length} />
      <Stat label="Population" value={villages.reduce((s, v) => s + (Number(v.population) || 0), 0).toLocaleString()} />
      <Stat label="Households" value={villages.reduce((s, v) => s + (Number(v.households) || 0), 0).toLocaleString()} />
    </div>
    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search village, code, block, district or state..." className="w-full mb-6 px-3 py-2 border rounded-lg" />
    {isLoading && <div className="h-40 animate-pulse bg-gray-200 rounded-lg" />}
    {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg">Unable to load villages: {error.message}</div>}
    {!isLoading && !error && <div className="bg-white rounded-lg shadow overflow-x-auto"><table className="min-w-full"><thead className="bg-gray-50"><tr>{['Village','Location','Population','Households','Actions'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y">
      {villages.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">No villages registered yet.</td></tr>}
      {villages.map((v) => <tr key={v.id}><td className="px-4 py-3"><div className="font-medium">{v.name}</div><div className="text-xs text-gray-500">{v.village_code || `VIL-${v.id}`}</div></td><td className="px-4 py-3">{[v.block, v.district, v.state].filter(Boolean).join(', ')}</td><td className="px-4 py-3"><Users2 className="inline w-4 h-4 mr-1" />{v.population ?? '—'}</td><td className="px-4 py-3">{v.households ?? '—'}</td><td className="px-4 py-3 text-right"><button onClick={() => { setForm({ ...emptyForm, ...v }); setEditingId(v.id); setShowForm(true); }} className="p-2 text-blue-600"><Edit className="w-4 h-4" /></button><button onClick={() => window.confirm('Archive this village?') && deleteMutation.mutate(v.id)} className="p-2 text-red-600"><Trash2 className="w-4 h-4" /></button></td></tr>)}
    </tbody></table></div>}
    {showForm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-modal"><div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"><div className="flex justify-between mb-6"><h2 className="text-xl font-bold">{editingId ? 'Edit Village' : 'Register Village'}</h2><button onClick={closeForm}><X /></button></div><form onSubmit={(e) => { e.preventDefault(); if (!form.name.trim() || !form.district.trim() || !form.state.trim()) { toast.error('Village name, district and state are required'); return; } saveMutation.mutate({ ...form, population: form.population === '' ? null : Number(form.population), households: form.households === '' ? null : Number(form.households) }); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">{['name','village_code','state','district','block','tehsil','gram_panchayat','pincode','population','households'].map((key) => <label key={key} className="text-sm font-medium text-gray-700 capitalize">{key.replaceAll('_',' ')}{['name','district','state'].includes(key) ? ' *' : ''}<input type={['population','households'].includes(key) ? 'number' : 'text'} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg" /></label>)}<label className="md:col-span-2 text-sm font-medium">Notes<textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg" rows={3} /></label><div className="md:col-span-2 flex justify-end gap-3"><button type="button" onClick={closeForm} className="px-4 py-2 border rounded-lg">Cancel</button><button disabled={saveMutation.isPending} className="px-4 py-2 bg-teal-600 text-white rounded-lg">{saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Register Village'}</button></div></form></div></div>}
  </div>;
}

function Stat({ label, value }) { return <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-2xl font-bold">{value}</div></div>; }
