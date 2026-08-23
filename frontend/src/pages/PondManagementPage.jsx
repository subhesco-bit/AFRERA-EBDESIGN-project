import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pondAPI } from '../services/api'
import { Fish, Plus, X, Trash2, Edit, Droplet } from 'lucide-react'
import toast from 'react-hot-toast'

const SPECIES = ['Rohu', 'Catla', 'Mrigal', 'Common Carp', 'Tilapia', 'Magur (Catfish)', 'Prawn']

const emptyForm = { name: '', species: 'Rohu', area_sqm: '', stocking_date: '', stock_count: '', location: '' }

function PondManagementPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [wqTarget, setWqTarget] = useState(null)
  const [wqForm, setWqForm] = useState({ date: '', ph: '', dissolved_oxygen: '', temperature_c: '' })

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data, isLoading, error } = useQuery({
    queryKey: ['ponds'],
    queryFn: async () => (await pondAPI.getPonds()).data?.data ?? [],
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? pondAPI.updatePond(editingId, payload) : pondAPI.createPond(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Pond updated' : 'Pond registered')
      queryClient.invalidateQueries({ queryKey: ['ponds'] })
      closeForm()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save pond'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => pondAPI.deletePond(id),
    onSuccess: () => { toast.success('Pond removed'); queryClient.invalidateQueries({ queryKey: ['ponds'] }) },
    onError: () => toast.error('Failed to remove pond'),
  })

  const recordWqMutation = useMutation({
    mutationFn: ({ id, payload }) => pondAPI.recordWaterQuality(id, payload),
    onSuccess: () => {
      toast.success('Water quality logged')
      queryClient.invalidateQueries({ queryKey: ['ponds'] })
      setWqTarget(null)
      setWqForm({ date: '', ph: '', dissolved_oxygen: '', temperature_c: '' })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to log water quality'),
  })

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm) }

  const openEdit = (p) => {
    setForm({
      name: p.name || '', species: p.species || 'Rohu', area_sqm: p.area_sqm ?? '',
      stocking_date: p.stocking_date ? p.stocking_date.slice(0, 10) : '', stock_count: p.stock_count ?? '', location: p.location || '',
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  const ponds = data || []
  const totalArea = ponds.reduce((s, p) => s + (Number(p.area_sqm) || 0), 0)
  const totalStock = ponds.reduce((s, p) => s + (Number(p.stock_count) || 0), 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Fish className="w-6 h-6 mr-2 text-cyan-600" />
            Pond Management
          </h1>
          <p className="text-gray-600">Track fish ponds, stocking and water quality</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition flex items-center">
          <Plus className="w-5 h-5 mr-2" />Register Pond
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Ponds</div>
          <div className="text-2xl font-bold text-gray-800">{ponds.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total area (sqm)</div>
          <div className="text-2xl font-bold text-gray-800">{totalArea.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total stock</div>
          <div className="text-2xl font-bold text-gray-800">{totalStock.toLocaleString()}</div>
        </div>
      </div>

      {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Error loading ponds: {error.message}. Backend endpoint /ponds has not been built yet — this page is wired and ready once it is.
        </div>
      )}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pond</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Species</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area (sqm)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stocked on</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ponds.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No ponds registered yet.</td></tr>}
              {ponds.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.location || '—'}</div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-800">{p.species}</span></td>
                  <td className="px-4 py-3 text-gray-700">{p.area_sqm ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{p.stock_count ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{p.stocking_date ? p.stocking_date.slice(0, 10) : '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setWqTarget(p)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded" title="Log water quality"><Droplet className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm('Remove this pond?')) deleteMutation.mutate(p.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Pond' : 'Register Pond'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!form.name) { toast.error('Pond name is required'); return }
                  saveMutation.mutate({
                    ...form,
                    area_sqm: form.area_sqm === '' ? null : Number(form.area_sqm),
                    stock_count: form.stock_count === '' ? null : Number(form.stock_count),
                  })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pond name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
                    <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                      {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqm)</label>
                    <input type="number" value={form.area_sqm} onChange={(e) => setForm({ ...form, area_sqm: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock count</label>
                    <input type="number" value={form.stock_count} onChange={(e) => setForm({ ...form, stock_count: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stocking date</label>
                    <input type="date" value={form.stocking_date} onChange={(e) => setForm({ ...form, stocking_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition disabled:opacity-60">
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Register Pond'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {wqTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Water Quality — {wqTarget.name}</h2>
                <button onClick={() => setWqTarget(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!wqForm.date) { toast.error('Date is required'); return }
                  recordWqMutation.mutate({
                    id: wqTarget.id,
                    payload: {
                      ...wqForm,
                      ph: wqForm.ph === '' ? null : Number(wqForm.ph),
                      dissolved_oxygen: wqForm.dissolved_oxygen === '' ? null : Number(wqForm.dissolved_oxygen),
                      temperature_c: wqForm.temperature_c === '' ? null : Number(wqForm.temperature_c),
                    },
                  })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={wqForm.date} onChange={(e) => setWqForm({ ...wqForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
                    <input type="number" step="0.1" value={wqForm.ph} onChange={(e) => setWqForm({ ...wqForm, ph: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DO (mg/L)</label>
                    <input type="number" step="0.1" value={wqForm.dissolved_oxygen} onChange={(e) => setWqForm({ ...wqForm, dissolved_oxygen: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temp (°C)</label>
                    <input type="number" step="0.1" value={wqForm.temperature_c} onChange={(e) => setWqForm({ ...wqForm, temperature_c: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setWqTarget(null)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={recordWqMutation.isPending} className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition disabled:opacity-60">
                    {recordWqMutation.isPending ? 'Saving...' : 'Log Reading'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PondManagementPage
