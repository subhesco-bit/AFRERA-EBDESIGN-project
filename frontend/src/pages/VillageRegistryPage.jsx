import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { villageAPI } from '../services/api'
import { Home, Plus, X, Trash2, Edit, Users2 } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { name: '', district: '', state: '', block: '', population: '', households: '', pincode: '', notes: '' }

function VillageRegistryPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useQuery(
    ['villages', search],
    async () => (await villageAPI.getVillages(search ? { search } : {})).data?.data ?? []
  )

  const saveMutation = useMutation(
    (payload) => (editingId ? villageAPI.updateVillage(editingId, payload) : villageAPI.createVillage(payload)),
    {
      onSuccess: () => {
        toast.success(editingId ? 'Village updated' : 'Village registered')
        queryClient.invalidateQueries(['villages'])
        closeForm()
      },
      onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save village'),
    }
  )

  const deleteMutation = useMutation((id) => villageAPI.deleteVillage(id), {
    onSuccess: () => { toast.success('Village removed'); queryClient.invalidateQueries(['villages']) },
    onError: () => toast.error('Failed to remove village'),
  })

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm) }

  const openEdit = (v) => {
    setForm({
      name: v.name || '', district: v.district || '', state: v.state || '', block: v.block || '',
      population: v.population ?? '', households: v.households ?? '', pincode: v.pincode || '', notes: v.notes || '',
    })
    setEditingId(v.id)
    setShowForm(true)
  }

  const villages = data || []
  const totalPopulation = villages.reduce((s, v) => s + (Number(v.population) || 0), 0)
  const totalHouseholds = villages.reduce((s, v) => s + (Number(v.households) || 0), 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Home className="w-6 h-6 mr-2 text-teal-600" />
            Village Registry
          </h1>
          <p className="text-gray-600">Maintain the catalogue of villages served by the platform</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition flex items-center">
          <Plus className="w-5 h-5 mr-2" />Register Village
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Villages registered</div>
          <div className="text-2xl font-bold text-gray-800">{villages.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total population</div>
          <div className="text-2xl font-bold text-gray-800">{totalPopulation.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total households</div>
          <div className="text-2xl font-bold text-gray-800">{totalHouseholds.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by village, block or district..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>

      {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Error loading villages: {error.message}. Backend endpoint /villages has not been built yet — this page is wired and ready once it is.
        </div>
      )}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Village</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Block / District / State</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Population</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Households</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {villages.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">No villages registered yet.</td></tr>}
              {villages.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{v.name}</div>
                    <div className="text-xs text-gray-500">{v.pincode || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{[v.block, v.district, v.state].filter(Boolean).join(', ')}</td>
                  <td className="px-4 py-3 text-gray-700 flex items-center"><Users2 className="w-4 h-4 mr-1 text-gray-400" />{v.population ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{v.households ?? '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(v)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm('Remove this village?')) deleteMutation.mutate(v.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Village' : 'Register Village'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!form.name || !form.district) { toast.error('Village name and district are required'); return }
                  saveMutation.mutate({
                    ...form,
                    population: form.population === '' ? null : Number(form.population),
                    households: form.households === '' ? null : Number(form.households),
                  })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Village name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                    <input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                    <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Population</label>
                    <input type="number" value={form.population} onChange={(e) => setForm({ ...form, population: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Households</label>
                    <input type="number" value={form.households} onChange={(e) => setForm({ ...form, households: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={saveMutation.isLoading} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-60">
                    {saveMutation.isLoading ? 'Saving...' : editingId ? 'Save Changes' : 'Register Village'}
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

export default VillageRegistryPage
