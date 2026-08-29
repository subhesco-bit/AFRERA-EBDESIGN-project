import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { climateAdvisoryAPI, weatherAPI } from '../services/api'
import { CloudSun, Plus, X, AlertTriangle, Bug } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/common/Modal'

const ADVISORY_TYPES = ['Sowing', 'Irrigation', 'Pest Management', 'Harvest Timing', 'General']

const emptyForm = { title: '', advisory: '', type: 'General', region: '', valid_until: '' }

function ClimateAdvisoryPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: advisoriesData, isLoading, error } = useQuery({
    queryKey: ['climate-advisories'],
    queryFn: async () => (await climateAdvisoryAPI.getAdvisories()).data?.data ?? [],
  })

  // These already have real backend support (migration 057_climate_weather_d14.sql,
  // routes in weatherRoutes.js) — surfaced alongside advisories for context.
  const { data: alertsData } = useQuery({
    queryKey: ['climate-active-alerts'],
    queryFn: async () => (await weatherAPI.activeAlerts()).data?.data ?? [],
    retry: false,
  })
  const { data: pestData } = useQuery({
    queryKey: ['climate-pest-forecast'],
    queryFn: async () => (await weatherAPI.pestForecast({})).data?.data ?? [],
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (payload) => climateAdvisoryAPI.createAdvisory(payload),
    onSuccess: () => {
      toast.success('Advisory published')
      queryClient.invalidateQueries({ queryKey: ['climate-advisories'] })
      setShowForm(false)
      setForm(emptyForm)
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to publish advisory'),
  })

  const advisories = advisoriesData || []
  const alerts = Array.isArray(alertsData) ? alertsData : []
  const pests = Array.isArray(pestData) ? pestData : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <CloudSun className="w-6 h-6 mr-2 text-sky-600" />
            Climate Advisory
          </h1>
          <p className="text-gray-600">Publish farmer-facing agromet advisories, alongside active dispatch alerts and pest forecasts</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition flex items-center">
          <Plus className="w-5 h-5 mr-2" />Publish Advisory
        </button>
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center font-medium text-red-800 mb-2"><AlertTriangle className="w-5 h-5 mr-2" />Active dispatch alerts</div>
          <ul className="text-sm text-red-700 space-y-1">
            {alerts.slice(0, 5).map((a, i) => <li key={a.id || i}>• {a.message || a.description || JSON.stringify(a)}</li>)}
          </ul>
        </div>
      )}

      {pests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center font-medium text-yellow-800 mb-2"><Bug className="w-5 h-5 mr-2" />Pest & disease forecast</div>
          <ul className="text-sm text-yellow-700 space-y-1">
            {pests.slice(0, 5).map((p, i) => <li key={p.id || i}>• {p.risk || p.pest || JSON.stringify(p)}</li>)}
          </ul>
        </div>
      )}

      {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Error loading advisories: {error.message}. Backend endpoint /climate-advisory/advisories has not been built yet — the underlying agromet_advisories table exists (migration 057) but no route reads or writes it. This page is wired and ready once one exists.
        </div>
      )}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advisories.length === 0 && (
            <div className="col-span-full text-center py-10 bg-white rounded-lg shadow text-gray-500">No advisories published yet.</div>
          )}
          {advisories.map((a) => (
            <div key={a.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{a.title}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-800">{a.type}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{a.advisory}</p>
              <div className="text-xs text-gray-500">{a.region || 'All regions'} {a.valid_until ? `• Valid until ${a.valid_until.slice(0, 10)}` : ''}</div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Publish Advisory</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!form.title || !form.advisory) { toast.error('Title and advisory text are required'); return }
                  createMutation.mutate(form)
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input id="classname-w-full-px-3-py-2-border-border" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-2" className="block text-sm font-medium text-gray-700 mb-1">Advisory text *</label>
                  <textarea id="classname-w-full-px-3-py-2-border-border-2" value={form.advisory} onChange={(e) => setForm({ ...form, advisory: e.target.value })} rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" placeholder="Farm operations to do or postpone based on the forecast" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-3" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select id="classname-w-full-px-3-py-2-border-border-3" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500">
                      {ADVISORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-4" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <input id="classname-w-full-px-3-py-2-border-border-4" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" placeholder="District / state, blank = all" />
                  </div>
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-5" className="block text-sm font-medium text-gray-700 mb-1">Valid until</label>
                  <input id="classname-w-full-px-3-py-2-border-border-5" type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition disabled:opacity-60">
                    {createMutation.isPending ? 'Publishing...' : 'Publish'}
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

export default ClimateAdvisoryPage
