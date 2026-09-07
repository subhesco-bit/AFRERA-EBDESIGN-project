import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sowingAPI } from '../services/api'
import { Sprout, Plus, Trash2, Edit, X, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/common/Modal'

const SEASONS = ['Kharif', 'Rabi', 'Zaid']
const METHODS = ['Broadcasting', 'Line Sowing', 'Dibbling', 'Transplanting', 'Drilling']

const emptyForm = {
  crop: '',
  variety: '',
  field_name: '',
  area_hectares: '',
  season: 'Kharif',
  method: 'Line Sowing',
  sowing_date: '',
  expected_germination_date: '',
  seed_rate_kg: '',
  notes: '',
}

function SowingManagementPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [seasonFilter, setSeasonFilter] = useState('')

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data, isLoading, error } = useQuery({
    queryKey: ['sowing-records', seasonFilter],
    queryFn: async () => {
      const res = await sowingAPI.getRecords(seasonFilter ? { season: seasonFilter } : {})
      return res.data?.data ?? []
    },
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? sowingAPI.updateRecord(editingId, payload) : sowingAPI.createRecord(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Sowing record updated' : 'Sowing record added')
      queryClient.invalidateQueries({ queryKey: ['sowing-records'] })
      closeForm()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save sowing record'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => sowingAPI.deleteRecord(id),
    onSuccess: () => {
      toast.success('Sowing record deleted')
      queryClient.invalidateQueries({ queryKey: ['sowing-records'] })
    },
    onError: () => toast.error('Failed to delete record'),
  })

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const openEdit = (record) => {
    setForm({
      crop: record.crop || '',
      variety: record.variety || '',
      field_name: record.field_name || '',
      area_hectares: record.area_hectares ?? '',
      season: record.season || 'Kharif',
      method: record.method || 'Line Sowing',
      sowing_date: record.sowing_date ? record.sowing_date.slice(0, 10) : '',
      expected_germination_date: record.expected_germination_date ? record.expected_germination_date.slice(0, 10) : '',
      seed_rate_kg: record.seed_rate_kg ?? '',
      notes: record.notes || '',
    })
    setEditingId(record.id)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.crop || !form.field_name || !form.sowing_date) {
      toast.error('Crop, field and sowing date are required')
      return
    }
    saveMutation.mutate({
      ...form,
      area_hectares: form.area_hectares === '' ? null : Number(form.area_hectares),
      seed_rate_kg: form.seed_rate_kg === '' ? null : Number(form.seed_rate_kg),
    })
  }

  const records = data || []
  const totalArea = records.reduce((sum, r) => sum + (Number(r.area_hectares) || 0), 0)
  const activeSeason = records.filter((r) => r.season === 'Kharif').length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Sprout className="w-6 h-6 mr-2 text-green-600" />
            Sowing Management
          </h1>
          <p className="text-gray-600">Log sowing operations by field, crop, season and method</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Log Sowing
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total sowing records</div>
          <div className="text-2xl font-bold text-gray-800">{records.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Area sown (ha)</div>
          <div className="text-2xl font-bold text-gray-800">{totalArea.toFixed(1)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Kharif season records</div>
          <div className="text-2xl font-bold text-gray-800">{activeSeason}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="value" className="text-sm font-medium text-gray-700">Season</label>
        <select id="value"
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All seasons</option>
          {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Error loading sowing records: {error.message}. Backend endpoint /sowing/records has not been built yet — this page is wired and ready to work once it is.
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop / Variety</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area (ha)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Season / Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sowing Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No sowing records yet. Click "Log Sowing" to add the first one.
                  </td>
                </tr>
              )}
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{r.crop}</div>
                    <div className="text-xs text-gray-500">{r.variety || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.field_name}</td>
                  <td className="px-4 py-3 text-gray-700">{r.area_hectares ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 mr-1">{r.season}</span>
                    <span className="text-xs text-gray-500">{r.method}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-1 text-gray-400" />{r.sowing_date ? r.sowing_date.slice(0, 10) : '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button
                      onClick={() => { if (confirm('Delete this sowing record?')) deleteMutation.mutate(r.id) }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Sowing Record' : 'Log Sowing'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border" className="block text-sm font-medium text-gray-700 mb-1">Crop *</label>
                    <input id="classname-w-full-px-3-py-2-border-border" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="e.g., Paddy" />
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-2" className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                    <input id="classname-w-full-px-3-py-2-border-border-2" value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="e.g., IR-64" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-3" className="block text-sm font-medium text-gray-700 mb-1">Field name *</label>
                    <input id="classname-w-full-px-3-py-2-border-border-3" value={form.field_name} onChange={(e) => setForm({ ...form, field_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="e.g., North Plot" />
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-4" className="block text-sm font-medium text-gray-700 mb-1">Area (hectares)</label>
                    <input id="classname-w-full-px-3-py-2-border-border-4" type="number" step="0.01" value={form.area_hectares} onChange={(e) => setForm({ ...form, area_hectares: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-5" className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                    <select id="classname-w-full-px-3-py-2-border-border-5" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-6" className="block text-sm font-medium text-gray-700 mb-1">Sowing method</label>
                    <select id="classname-w-full-px-3-py-2-border-border-6" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-7" className="block text-sm font-medium text-gray-700 mb-1">Sowing date *</label>
                    <input id="classname-w-full-px-3-py-2-border-border-7" type="date" value={form.sowing_date} onChange={(e) => setForm({ ...form, sowing_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-8" className="block text-sm font-medium text-gray-700 mb-1">Expected germination</label>
                    <input id="classname-w-full-px-3-py-2-border-border-8" type="date" value={form.expected_germination_date} onChange={(e) => setForm({ ...form, expected_germination_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-9" className="block text-sm font-medium text-gray-700 mb-1">Seed rate (kg)</label>
                  <input id="classname-w-full-px-3-py-2-border-border-9" type="number" step="0.1" value={form.seed_rate_kg} onChange={(e) => setForm({ ...form, seed_rate_kg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-10" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea id="classname-w-full-px-3-py-2-border-border-10" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Log Sowing'}
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

export default SowingManagementPage
