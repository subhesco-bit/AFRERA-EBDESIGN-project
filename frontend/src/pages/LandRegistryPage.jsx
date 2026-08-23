import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { landAPI } from '../services/api'
import { MapPin, Plus, Trash2, Edit, X, FileCheck2 } from 'lucide-react'
import toast from 'react-hot-toast'

const OWNERSHIP_TYPES = ['Owned', 'Leased', 'Sharecropped', 'Government Allotted']
const TITLE_STATUS = ['Verified', 'Pending Verification', 'Disputed', 'Not Submitted']

const emptyForm = {
  parcel_code: '',
  owner_name: '',
  village: '',
  district: '',
  state: '',
  area_hectares: '',
  ownership_type: 'Owned',
  survey_number: '',
  title_status: 'Pending Verification',
  notes: '',
}

function LandRegistryPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data, isLoading, error } = useQuery({
    queryKey: ['land-parcels', search],
    queryFn: async () => {
      const res = await landAPI.getParcels(search ? { search } : {})
      return res.data?.data ?? []
    },
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? landAPI.updateParcel(editingId, payload) : landAPI.createParcel(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Parcel updated' : 'Parcel registered')
      queryClient.invalidateQueries({ queryKey: ['land-parcels'] })
      closeForm()
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save parcel'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => landAPI.deleteParcel(id),
    onSuccess: () => { toast.success('Parcel removed'); queryClient.invalidateQueries({ queryKey: ['land-parcels'] }) },
    onError: () => toast.error('Failed to remove parcel'),
  })

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm) }

  const openEdit = (p) => {
    setForm({
      parcel_code: p.parcel_code || '',
      owner_name: p.owner_name || '',
      village: p.village || '',
      district: p.district || '',
      state: p.state || '',
      area_hectares: p.area_hectares ?? '',
      ownership_type: p.ownership_type || 'Owned',
      survey_number: p.survey_number || '',
      title_status: p.title_status || 'Pending Verification',
      notes: p.notes || '',
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.owner_name || !form.village || !form.area_hectares) {
      toast.error('Owner, village and area are required')
      return
    }
    saveMutation.mutate({ ...form, area_hectares: Number(form.area_hectares) })
  }

  const parcels = data || []
  const totalArea = parcels.reduce((s, p) => s + (Number(p.area_hectares) || 0), 0)
  const verified = parcels.filter((p) => p.title_status === 'Verified').length

  const statusColor = (s) => ({
    Verified: 'bg-green-100 text-green-800',
    'Pending Verification': 'bg-yellow-100 text-yellow-800',
    Disputed: 'bg-red-100 text-red-800',
    'Not Submitted': 'bg-gray-100 text-gray-700',
  }[s] || 'bg-gray-100 text-gray-700')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <MapPin className="w-6 h-6 mr-2 text-green-600" />
            Land Registry
          </h1>
          <p className="text-gray-600">Register and track land parcels, ownership and title verification status</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Register Parcel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Registered parcels</div>
          <div className="text-2xl font-bold text-gray-800">{parcels.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total area (ha)</div>
          <div className="text-2xl font-bold text-gray-800">{totalArea.toFixed(1)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Title verified</div>
          <div className="text-2xl font-bold text-gray-800">{verified} / {parcels.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by owner, village or parcel code..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Error loading land parcels: {error.message}. Backend endpoint /land/parcels has not been built yet — this page is wired and ready to work once it is.
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parcel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area (ha)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ownership</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parcels.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No parcels registered yet.</td></tr>
              )}
              {parcels.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{p.parcel_code || `#${p.id}`}</div>
                    <div className="text-xs text-gray-500">Survey {p.survey_number || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.owner_name}</td>
                  <td className="px-4 py-3 text-gray-700">{[p.village, p.district, p.state].filter(Boolean).join(', ')}</td>
                  <td className="px-4 py-3 text-gray-700">{p.area_hectares}</td>
                  <td className="px-4 py-3 text-gray-700">{p.ownership_type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${statusColor(p.title_status)}`}>
                      <FileCheck2 className="w-3 h-3" />{p.title_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm('Remove this parcel?')) deleteMutation.mutate(p.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Parcel' : 'Register Parcel'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parcel code</label>
                    <input value={form.parcel_code} onChange={(e) => setForm({ ...form, parcel_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Auto-generated if blank" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner name *</label>
                    <input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Village *</label>
                    <input value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                    <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area (hectares) *</label>
                    <input type="number" step="0.01" value={form.area_hectares} onChange={(e) => setForm({ ...form, area_hectares: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Survey number</label>
                    <input value={form.survey_number} onChange={(e) => setForm({ ...form, survey_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ownership type</label>
                    <select value={form.ownership_type} onChange={(e) => setForm({ ...form, ownership_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      {OWNERSHIP_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title status</label>
                    <select value={form.title_status} onChange={(e) => setForm({ ...form, title_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      {TITLE_STATUS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Register Parcel'}
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

export default LandRegistryPage
