import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orchardAPI } from '../services/api'
import { TreeDeciduous, Plus, X, Trash2, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/common/Modal'

const FRUIT_TYPES = ['Orange', 'Pineapple', 'Litchi', 'Guava', 'Mango', 'Assam Lemon', 'Kiwi', 'Passion Fruit']

const emptyForm = { name: '', fruit_type: 'Orange', area_hectares: '', tree_count: '', planting_year: '', location: '' }

function OrchardManagementPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [harvestTarget, setHarvestTarget] = useState(null)
  const [harvestForm, setHarvestForm] = useState({ date: '', quantity_kg: '', grade: 'A' })

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data, isLoading, error } = useQuery({
    queryKey: ['orchards'],
    // listOrchards returns { items, pagination }, not a bare array
    queryFn: async () => (await orchardAPI.getOrchards()).data?.data?.items ?? [],
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? orchardAPI.updateOrchard(editingId, payload) : orchardAPI.createOrchard(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Orchard updated' : 'Orchard registered')
      queryClient.invalidateQueries({ queryKey: ['orchards'] })
      closeForm()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save orchard'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => orchardAPI.deleteOrchard(id),
    onSuccess: () => { toast.success('Orchard removed'); queryClient.invalidateQueries({ queryKey: ['orchards'] }) },
    onError: () => toast.error('Failed to remove orchard'),
  })

  const recordHarvestMutation = useMutation({
    mutationFn: ({ id, payload }) => orchardAPI.recordHarvest(id, payload),
    onSuccess: () => {
      toast.success('Harvest recorded')
      queryClient.invalidateQueries({ queryKey: ['orchards'] })
      setHarvestTarget(null)
      setHarvestForm({ date: '', quantity_kg: '', grade: 'A' })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to record harvest'),
  })

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm) }

  const openEdit = (o) => {
    // Real DB columns (see M141 createOrchard/updateOrchard): orchard_type,
    // area, planting_date - not this form's original field names.
    setForm({
      name: o.name || '', fruit_type: o.orchard_type || 'Orange', area_hectares: o.area ?? '',
      tree_count: o.tree_count ?? '', planting_year: o.planting_date ?? '', location: o.location || '',
    })
    setEditingId(o.id)
    setShowForm(true)
  }

  const orchards = data || []
  const totalTrees = orchards.reduce((s, o) => s + (Number(o.tree_count) || 0), 0)
  const totalArea = orchards.reduce((s, o) => s + (Number(o.area) || 0), 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <TreeDeciduous className="w-6 h-6 mr-2 text-lime-700" />
            Orchard Management
          </h1>
          <p className="text-gray-600">Track orchard plots, tree counts and fruit harvest records</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
          className="px-4 py-2 bg-lime-700 text-white rounded-lg font-semibold hover:bg-lime-800 transition flex items-center">
          <Plus className="w-5 h-5 mr-2" />Register Orchard
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Orchards</div>
          <div className="text-2xl font-bold text-gray-800">{orchards.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total trees</div>
          <div className="text-2xl font-bold text-gray-800">{totalTrees.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total area (ha)</div>
          <div className="text-2xl font-bold text-gray-800">{totalArea.toFixed(1)}</div>
        </div>
      </div>

      {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Error loading orchards: {error.message}
        </div>
      )}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orchard</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fruit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area (ha)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trees</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planted</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orchards.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No orchards registered yet.</td></tr>}
              {orchards.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{o.name}</div>
                    <div className="text-xs text-gray-500">{o.location || '—'}</div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-lime-100 text-lime-800">{o.orchard_type}</span></td>
                  <td className="px-4 py-3 text-gray-700">{o.area ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{o.tree_count ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{o.planting_date ?? '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setHarvestTarget(o)} className="px-2 py-1 text-xs text-lime-700 border border-lime-300 rounded hover:bg-lime-50">Log Harvest</button>
                    <button onClick={() => openEdit(o)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm('Remove this orchard?')) deleteMutation.mutate(o.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Orchard' : 'Register Orchard'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!form.name) { toast.error('Orchard name is required'); return }
                  // Real backend fields (M141 createOrchard/updateOrchard) don't match this
                  // form's names 1:1 - mapped explicitly rather than spreading form as-is.
                  saveMutation.mutate({
                    name: form.name,
                    location: form.location,
                    orchardType: form.fruit_type,
                    area: form.area_hectares === '' ? null : Number(form.area_hectares),
                    treeCount: form.tree_count === '' ? null : Number(form.tree_count),
                    plantingDate: form.planting_year === '' ? null : Number(form.planting_year),
                  })
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border" className="block text-sm font-medium text-gray-700 mb-1">Orchard name *</label>
                  <input id="classname-w-full-px-3-py-2-border-border" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-2" className="block text-sm font-medium text-gray-700 mb-1">Fruit type</label>
                    <select id="classname-w-full-px-3-py-2-border-border-2" value={form.fruit_type} onChange={(e) => setForm({ ...form, fruit_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-600">
                      {FRUIT_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-3" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input id="classname-w-full-px-3-py-2-border-border-3" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-600" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-4" className="block text-sm font-medium text-gray-700 mb-1">Area (ha)</label>
                    <input id="classname-w-full-px-3-py-2-border-border-4" type="number" step="0.01" value={form.area_hectares} onChange={(e) => setForm({ ...form, area_hectares: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-600" />
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-5" className="block text-sm font-medium text-gray-700 mb-1">Tree count</label>
                    <input id="classname-w-full-px-3-py-2-border-border-5" type="number" value={form.tree_count} onChange={(e) => setForm({ ...form, tree_count: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-600" />
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-6" className="block text-sm font-medium text-gray-700 mb-1">Planting year</label>
                    <input id="classname-w-full-px-3-py-2-border-border-6" type="number" value={form.planting_year} onChange={(e) => setForm({ ...form, planting_year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-600" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-lime-700 text-white rounded-lg hover:bg-lime-800 transition disabled:opacity-60">
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Register Orchard'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {harvestTarget && (
        <Modal onClose={() => setHarvestTarget(null)}>
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Log Harvest — {harvestTarget.name}</h2>
                <button onClick={() => setHarvestTarget(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!harvestForm.date || !harvestForm.quantity_kg) { toast.error('Date and quantity are required'); return }
                  // Real backend fields (M141 recordOrchardProduction) don't match this
                  // form's names - mapped explicitly. productionYear/variety aren't
                  // collected by this form; year is derived from the harvest date,
                  // variety is left unset rather than guessed.
                  recordHarvestMutation.mutate({
                    id: harvestTarget.id,
                    payload: {
                      harvestDate: harvestForm.date,
                      productionYear: new Date(harvestForm.date).getFullYear(),
                      quantity: Number(harvestForm.quantity_kg),
                      qualityGrade: harvestForm.grade,
                    },
                  })
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-7" className="block text-sm font-medium text-gray-700 mb-1">Harvest date *</label>
                  <input id="classname-w-full-px-3-py-2-border-border-7" type="date" value={harvestForm.date} onChange={(e) => setHarvestForm({ ...harvestForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-8" className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg) *</label>
                    <input id="classname-w-full-px-3-py-2-border-border-8" type="number" step="0.1" value={harvestForm.quantity_kg} onChange={(e) => setHarvestForm({ ...harvestForm, quantity_kg: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-600" />
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-9" className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <select id="classname-w-full-px-3-py-2-border-border-9" value={harvestForm.grade} onChange={(e) => setHarvestForm({ ...harvestForm, grade: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-600">
                      <option value="A">Grade A</option>
                      <option value="B">Grade B</option>
                      <option value="C">Grade C</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setHarvestTarget(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={recordHarvestMutation.isPending} className="px-4 py-2 bg-lime-700 text-white rounded-lg hover:bg-lime-800 transition disabled:opacity-60">
                    {recordHarvestMutation.isPending ? 'Saving...' : 'Log Harvest'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default OrchardManagementPage
