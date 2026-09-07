import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Generic list + create (+ optional delete) panel used by the "management"
 * pages added 2026-08-24 to fix the frontend build (~40 pages referenced in
 * App.jsx but never created — see git history for the audit). Each of those
 * pages wires this to a real function from services/api.js; when the
 * matching backend route doesn't exist yet, the request fails and the error
 * banner below says so explicitly instead of crashing or silently rendering
 * nothing, exactly like the DairyManagementPage/ClimateAdvisoryPage
 * convention this mirrors.
 *
 * Props:
 *  - queryKey: string, unique react-query cache key
 *  - listFn: () => Promise<AxiosResponse> — expected shape { data: { data: [...] } } or { data: [...] }
 *  - createFn: (payload) => Promise<AxiosResponse> (optional — omit to hide the create form)
 *  - deleteFn: (id) => Promise<AxiosResponse> (optional — omit to hide delete actions)
 *  - fields: [{ name, label, type: 'text'|'number'|'date'|'select'|'textarea', options, required, placeholder }]
 *  - columns: [{ key, label, render?: (row) => node }]
 *  - idKey: string, default 'id'
 *  - entityLabel: string, e.g. "Examination" — used in button/dialog copy
 *  - accent: tailwind color name, e.g. 'indigo' | 'emerald' | 'sky' | 'amber' | 'rose'
 *  - notFoundHint: extra sentence appended to the error banner
 *  - emptyMessage: string shown when the list is empty
 */
function unwrap(res) {
  const body = res?.data
  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body?.data?.items)) return body.data.items
  if (Array.isArray(body?.items)) return body.items
  return []
}

const ACCENTS = {
  indigo: { btn: 'bg-indigo-600 hover:bg-indigo-700', ring: 'focus:ring-indigo-500', badge: 'bg-indigo-100 text-indigo-800', text: 'text-indigo-600', border: 'border-indigo-600 text-indigo-700' },
  emerald: { btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'focus:ring-emerald-500', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-600', border: 'border-emerald-600 text-emerald-700' },
  sky: { btn: 'bg-sky-600 hover:bg-sky-700', ring: 'focus:ring-sky-500', badge: 'bg-sky-100 text-sky-800', text: 'text-sky-600', border: 'border-sky-600 text-sky-700' },
  amber: { btn: 'bg-amber-600 hover:bg-amber-700', ring: 'focus:ring-amber-500', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-600', border: 'border-amber-600 text-amber-700' },
  rose: { btn: 'bg-rose-600 hover:bg-rose-700', ring: 'focus:ring-rose-500', badge: 'bg-rose-100 text-rose-800', text: 'text-rose-600', border: 'border-rose-600 text-rose-700' },
  teal: { btn: 'bg-teal-600 hover:bg-teal-700', ring: 'focus:ring-teal-500', badge: 'bg-teal-100 text-teal-800', text: 'text-teal-600', border: 'border-teal-600 text-teal-700' },
}

function emptyFromFields(fields) {
  const obj = {}
  for (const f of fields) obj[f.name] = f.default ?? ''
  return obj
}

export default function CrudSection({
  queryKey,
  listFn,
  createFn,
  deleteFn,
  fields = [],
  columns,
  idKey = 'id',
  entityLabel = 'Record',
  accent = 'indigo',
  notFoundHint,
  emptyMessage = 'No records yet.',
  listParams,
}) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(() => emptyFromFields(fields))
  const colors = ACCENTS[accent] || ACCENTS.indigo

  const { data, isLoading, error } = useQuery({
    queryKey: [queryKey, listParams],
    queryFn: async () => unwrap(await listFn(listParams)),
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createFn(payload),
    onSuccess: () => {
      toast.success(`${entityLabel} saved`)
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      setShowForm(false)
      setForm(emptyFromFields(fields))
    },
    onError: (err) => toast.error(err?.response?.data?.error || `Failed to save ${entityLabel.toLowerCase()}`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFn(id),
    onSuccess: () => {
      toast.success(`${entityLabel} removed`)
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    },
    onError: () => toast.error(`Failed to remove ${entityLabel.toLowerCase()}`),
  })

  const rows = data || []
  const cols = columns || fields.slice(0, 4).map((f) => ({ key: f.name, label: f.label }))

  return (
    <div>
      {createFn && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setForm(emptyFromFields(fields)); setShowForm(true) }}
            className={`px-4 py-2 text-white rounded-lg font-semibold transition flex items-center ${colors.btn}`}
          >
            <Plus className="w-5 h-5 mr-2" />Add {entityLabel}
          </button>
        </div>
      )}

      {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Error loading data: {error.message}.{notFoundHint ? ` ${notFoundHint}` : ' This page is wired and ready once the backend route exists.'}
        </div>
      )}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {cols.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{c.label}</th>
                ))}
                {deleteFn && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 && (
                <tr><td colSpan={cols.length + (deleteFn ? 1 : 0)} className="px-4 py-10 text-center text-gray-500">{emptyMessage}</td></tr>
              )}
              {rows.map((row, i) => (
                <tr key={row[idKey] ?? i} className="hover:bg-gray-50">
                  {cols.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-gray-700">
                      {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                    </td>
                  ))}
                  {deleteFn && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { if (confirm(`Remove this ${entityLabel.toLowerCase()}?`)) deleteMutation.mutate(row[idKey]) }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && createFn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add {entityLabel}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const missing = fields.filter((f) => f.required && !form[f.name])
                  if (missing.length) { toast.error(`${missing[0].label} is required`); return }
                  const payload = { ...form }
                  fields.forEach((f) => { if (f.type === 'number' && payload[f.name] !== '') payload[f.name] = Number(payload[f.name]) })
                  createMutation.mutate(payload)
                }}
                className="space-y-4"
              >
                {fields.map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required ? ' *' : ''}</label>
                    {f.type === 'select' ? (
                      <select
                        value={form[f.name] ?? ''}
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`}
                      >
                        <option value="">Select</option>
                        {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        value={form[f.name] ?? ''}
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                        rows={3}
                        placeholder={f.placeholder}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`}
                      />
                    ) : (
                      <input
                        type={f.type || 'text'}
                        step={f.type === 'number' ? 'any' : undefined}
                        value={form[f.name] ?? ''}
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                        placeholder={f.placeholder}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring}`}
                      />
                    )}
                  </div>
                ))}
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={createMutation.isPending} className={`px-4 py-2 text-white rounded-lg transition disabled:opacity-60 ${colors.btn}`}>
                    {createMutation.isPending ? 'Saving...' : `Save ${entityLabel}`}
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
