import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, Plus, X, Trash2, Edit, Users2, BarChart3, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import villageAPI from '../services/villageAPI';

const emptyForm = {
  name: '', village_code: '', district: '', state: '', block: '', tehsil: '', gram_panchayat: '', pincode: '',
  population: '', households: '', area_sq_km: '', elevation: '', climate_zone: '', soil_type: '',
  agricultural_land_area: '', avg_income: '', literacy_rate: '', irrigation_coverage: '',
  electrified_households: '', road_access: true, market_distance_km: '',
  financial_institutions_count: 0, schools_count: 0, health_centers_count: 0,
  cooperative_societies_count: 0, notes: '', status: 'active',
};

const emptyResource = { resource_type: '', resource_name: '', capacity: '', current_utilization: '', condition: 'good', responsible_person: '' };

function toNumberOrNull(value) {
  return value === '' || value === null || value === undefined ? null : Number(value);
}

function VillageRegistryPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [resource, setResource] = useState(emptyResource);
  const [showResourceForm, setShowResourceForm] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['villages', search],
    queryFn: async () => (await villageAPI.getVillages(search ? { search } : {})).data?.data ?? [],
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => editingId ? villageAPI.updateVillage(editingId, payload) : villageAPI.createVillage(payload),
    onSuccess: () => {
      toast.success(editingId ? 'Village updated' : 'Village registered');
      queryClient.invalidateQueries({ queryKey: ['villages'] });
      closeForm();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save village'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => villageAPI.deleteVillage(id),
    onSuccess: () => {
      toast.success('Village archived');
      queryClient.invalidateQueries({ queryKey: ['villages'] });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to archive village'),
  });

  const resourceMutation = useMutation({
    mutationFn: ({ id, payload }) => villageAPI.addVillageResource(id, payload),
    onSuccess: () => {
      toast.success('Village resource added');
      setResource(emptyResource);
      setShowResourceForm(false);
      if (selectedVillage) queryClient.invalidateQueries({ queryKey: ['village-analytics', selectedVillage.id] });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to add resource'),
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); };

  const openEdit = (village) => {
    setForm({ ...emptyForm, ...village, road_access: village.road_access ?? true });
    setEditingId(village.id);
    setShowForm(true);
  };

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };

  const villages = data || [];
  const totalPopulation = villages.reduce((sum, v) => sum + (Number(v.population) || 0), 0);
  const totalHouseholds = villages.reduce((sum, v) => sum + (Number(v.households) || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center"><Home className="w-6 h-6 mr-2 text-teal-600" />Village Registry</h1>
          <p className="text-gray-600 mt-2">Canonical village master data, community resources and development intelligence</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 flex items-center"><Plus className="w-5 h-5 mr-2" />Register Village</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Villages registered" value={villages.length} />
        <Stat label="Total population" value={totalPopulation.toLocaleString()} />
        <Stat label="Total households" value={totalHouseholds.toLocaleString()} />
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by village, code, block, district or state..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
      </div>

      {isLoading && <div className="h-40 animate-pulse bg-gray-200 rounded-lg" />}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">Unable to load villages: {error.message}</div>}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              {['Village','Location','Population','Households','Status','Actions'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {villages.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No villages registered yet.</td></tr>}
              {villages.map((v) => <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><div className="font-medium text-gray-800">{v.name}</div><div className="text-xs text-gray-500">{v.village_code || `VIL-${v.id}`}</div></td>
                <td className="px-4 py-3 text-gray-700">{[v.block, v.district, v.state].filter(Boolean).join(', ')}</td>
                <td className="px-4 py-3"><Users2 className="inline w-4 h-4 mr-1 text-gray-400" />{v.population ?? '—'}</td>
                <td className="px-4 py-3">{v.households ?? '—'}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">{v.status || 'active'}</span></td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button title="Analytics" onClick={() => setSelectedVillage(v)} className="p-2 text-teal-600 hover:bg-teal-50 rounded"><BarChart3 className="w-4 h-4 inline" /></button>
                  <button title="Resource" onClick={() => { setSelectedVillage(v); setShowResourceForm(true); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded"><Wrench className="w-4 h-4 inline" /></button>
                  <button title="Edit" onClick={() => openEdit(v)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4 inline" /></button>
                  <button title="Archive" onClick={() => window.confirm('Archive this village?') && deleteMutation.mutate(v.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <Modal title={editingId ? 'Edit Village' : 'Register Village'} onClose={closeForm}>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim() || !form.district.trim() || !form.state.trim()) { toast.error('Village name, district and state are required'); return; }
          const payload = { ...form };
          ['population','households','area_sq_km','elevation','agricultural_land_area','avg_income','literacy_rate','irrigation_coverage','electrified_households','market_distance_km','financial_institutions_count','schools_count','health_centers_count','cooperative_societies_count'].forEach((k) => { payload[k] = toNumberOrNull(payload[k]); });
          saveMutation.mutate(payload);
        }} className="space-y-4">
          <Section title="Identity & Geography">
            <Input label="Village name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Village code" value={form.village_code} onChange={(v) => setForm({ ...form, village_code: v })} />
            <Input label="State *" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
            <Input label="District *" value={form.district} onChange={(v) => setForm({ ...form, district: v })} />
            <Input label="Block" value={form.block} onChange={(v) => setForm({ ...form, block: v })} />
            <Input label="Tehsil" value={form.tehsil} onChange={(v) => setForm({ ...form, tehsil: v })} />
            <Input label="Gram Panchayat" value={form.gram_panchayat} onChange={(v) => setForm({ ...form, gram_panchayat: v })} />
            <Input label="Pincode" value={form.pincode} onChange={(v) => setForm({ ...form, pincode: v })} />
          </Section>
          <Section title="Demographics & Economy">
            <NumberInput label="Population" value={form.population} onChange={(v) => setForm({ ...form, population: v })} />
            <NumberInput label="Households" value={form.households} onChange={(v) => setForm({ ...form, households: v })} />
            <NumberInput label="Area (sq km)" value={form.area_sq_km} onChange={(v) => setForm({ ...form, area_sq_km: v })} />
            <NumberInput label="Average income" value={form.avg_income} onChange={(v) => setForm({ ...form, avg_income: v })} />
            <NumberInput label="Literacy (%)" value={form.literacy_rate} onChange={(v) => setForm({ ...form, literacy_rate: v })} />
            <NumberInput label="Irrigation (%)" value={form.irrigation_coverage} onChange={(v) => setForm({ ...form, irrigation_coverage: v })} />
            <NumberInput label="Market distance (km)" value={form.market_distance_km} onChange={(v) => setForm({ ...form, market_distance_km: v })} />
            <NumberInput label="Agricultural land (sq km)" value={form.agricultural_land_area} onChange={(v) => setForm({ ...form, agricultural_land_area: v })} />
          </Section>
          <Section title="Infrastructure & Services">
            <NumberInput label="Electrified households" value={form.electrified_households} onChange={(v) => setForm({ ...form, electrified_households: v })} />
            <NumberInput label="Financial institutions" value={form.financial_institutions_count} onChange={(v) => setForm({ ...form, financial_institutions_count: v })} />
            <NumberInput label="Schools" value={form.schools_count} onChange={(v) => setForm({ ...form, schools_count: v })} />
            <NumberInput label="Health centers" value={form.health_centers_count} onChange={(v) => setForm({ ...form, health_centers_count: v })} />
            <NumberInput label="Cooperatives" value={form.cooperative_societies_count} onChange={(v) => setForm({ ...form, cooperative_societies_count: v })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.road_access} onChange={(e) => setForm({ ...form, road_access: e.target.checked })} />Road access</label>
            <Input label="Climate zone" value={form.climate_zone} onChange={(v) => setForm({ ...form, climate_zone: v })} />
            <Input label="Soil type" value={form.soil_type} onChange={(v) => setForm({ ...form, soil_type: v })} />
          </Section>
          <Input label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} textarea />
          <div className="flex justify-end gap-3"><button type="button" onClick={closeForm} className="px-4 py-2 border rounded-lg">Cancel</button><button disabled={saveMutation.isPending} className="px-4 py-2 bg-teal-600 text-white rounded-lg">{saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Register Village'}</button></div>
        </form>
      </Modal>}

      {showResourceForm && selectedVillage && <Modal title={`Add Resource — ${selectedVillage.name}`} onClose={() => setShowResourceForm(false)}>
        <form onSubmit={(e) => { e.preventDefault(); if (!resource.resource_type || !resource.resource_name) { toast.error('Resource type and name are required'); return; } resourceMutation.mutate({ id: selectedVillage.id, payload: { ...resource, capacity: toNumberOrNull(resource.capacity), current_utilization: toNumberOrNull(resource.current_utilization) } }); }} className="space-y-4">
          <Input label="Resource type *" value={resource.resource_type} onChange={(v) => setResource({ ...resource, resource_type: v })} />
          <Input label="Resource name *" value={resource.resource_name} onChange={(v) => setResource({ ...resource, resource_name: v })} />
          <NumberInput label="Capacity" value={resource.capacity} onChange={(v) => setResource({ ...resource, capacity: v })} />
          <NumberInput label="Current utilization" value={resource.current_utilization} onChange={(v) => setResource({ ...resource, current_utilization: v })} />
          <Input label="Condition" value={resource.condition} onChange={(v) => setResource({ ...resource, condition: v })} />
          <Input label="Responsible person" value={resource.responsible_person} onChange={(v) => setResource({ ...resource, responsible_person: v })} />
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowResourceForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button><button disabled={resourceMutation.isPending} className="px-4 py-2 bg-amber-600 text-white rounded-lg">{resourceMutation.isPending ? 'Adding...' : 'Add Resource'}</button></div>
        </form>
      </Modal>}

      {selectedVillage && !showResourceForm && <AnalyticsPanel village={selectedVillage} onClose={() => setSelectedVillage(null)} />}
    </div>
  );
}

function Stat({ label, value }) { return <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-2xl font-bold text-gray-800">{value}</div></div>; }
function Modal({ title, onClose, children }) { return <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-modal"><div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"><div className="p-6"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose}><X className="w-5 h-5" /></button></div>{children}</div></div></div>; }
function Section({ title, children }) { return <fieldset className="border rounded-lg p-4"><legend className="px-2 text-sm font-semibold text-teal-700">{title}</legend><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div></fieldset>; }
function Input({ label, value, onChange, textarea = false }) { const C = textarea ? 'textarea' : 'input'; return <label className="block text-sm font-medium text-gray-700">{label}<C value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={textarea ? 3 : undefined} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" /></label>; }
function NumberInput({ label, value, onChange }) { return <Input label={label} value={value} onChange={onChange} />; }

function AnalyticsPanel({ village, onClose }) {
  const { data, isLoading, error } = useQuery({ queryKey: ['village-analytics', village.id], queryFn: async () => (await villageAPI.getVillageAnalytics(village.id)).data?.data });
  return <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center p-4 z-modal"><div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"><div className="flex justify-between mb-6"><div><h2 className="text-xl font-bold">{village.name} Analytics</h2><p className="text-sm text-gray-500">{[village.block, village.district, village.state].filter(Boolean).join(', ')}</p></div><button onClick={onClose}><X /></button></div>{isLoading && <div className="animate-pulse h-32 bg-gray-200 rounded" />}{error && <div className="text-red-600">{error.message}</div>}{data && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Metric label="Development index" value={data.development_metrics?.development_index ?? '—'} /><Metric label="Resources" value={data.resource_summary?.total_resources ?? 0} /><Metric label="Average utilization" value={`${data.resource_summary?.average_utilization ?? 0}%`} /><Metric label="Agricultural land" value={data.development_metrics?.agricultural_land_area ?? 0} /><Metric label="Schools" value={data.development_metrics?.schools ?? 0} /><Metric label="Health centers" value={data.development_metrics?.health_centers ?? 0} /></div>}</div></div>; }
function Metric({ label, value }) { return <div className="border rounded-lg p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-2xl font-bold mt-1">{value}</div></div>; }

export default VillageRegistryPage;
