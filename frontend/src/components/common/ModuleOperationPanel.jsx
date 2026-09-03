import { useEffect, useState } from 'react'
import api from '../../services/api'

/**
 * Generic UI for any backend/src/modules/M0XX module exposed through
 * /api/v1/backend-modules/:moduleId/:operation (backendModuleBridge.js).
 *
 * Introspects the module's real operations at load time (GET /:moduleId) and
 * renders one call-form per operation, rather than assuming a CRUD shape a
 * module may not have. This is the batch-scalable counterpart to the
 * hand-built forms on WaterManagementPage.jsx - use this for any module
 * where a bespoke UI hasn't been built yet, since it works for ANY module's
 * real function set without per-module field mapping.
 *
 * Usage: <ModuleOperationPanel moduleId="M073" title="Nutrient Management" />
 */
export default function ModuleOperationPanel({ moduleId, title, description }) {
  const [operations, setOperations] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    api.get(`/backend-modules/${moduleId}`)
      .then((res) => { if (!cancelled) setOperations(res.data?.operations || []) })
      .catch((e) => { if (!cancelled) setLoadError(e?.response?.data?.error || e.message || 'Failed to load module') })
    return () => { cancelled = true }
  }, [moduleId])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{title || moduleId}</h1>
        {description && <p className="text-gray-600">{description}</p>}
        <p className="text-xs text-gray-500 mt-1">Operational workspace</p>
      </div>

      {loadError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{loadError}</div>
      )}
      {!operations && !loadError && <p className="text-sm text-gray-500">Loading available operations…</p>}
      {operations && operations.length === 0 && (
        <p className="text-sm text-gray-500">This module has no callable operations.</p>
      )}

      {operations && operations.map((op) => (
        <OperationCard key={op} moduleId={moduleId} operation={op} />
      ))}
    </div>
  )
}

function OperationCard({ moduleId, operation }) {
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setError('')
    setResult(null)
    let payload = {}
    if (jsonText.trim()) {
      try {
        payload = JSON.parse(jsonText)
        setJsonError('')
      } catch {
        setJsonError('Not valid JSON')
        return
      }
    }
    setLoading(true)
    try {
      const res = await api.post(`/backend-modules/${moduleId}/${operation}`, payload)
      setResult(res.data?.data ?? res.data)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
      <h3 className="font-semibold text-gray-800 font-mono text-sm">{operation}</h3>
      <div className="mt-2 mb-3">
        <label htmlFor="arguments-json-passed-as-this-operation-" className="block text-xs font-medium text-gray-600 mb-1">
          Arguments (JSON - passed as this operation's single object parameter)
        </label>
        <textarea id="arguments-json-passed-as-this-operation-"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono"
          placeholder="{}"
        />
        {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
      </div>
      <button
        onClick={run}
        disabled={loading}
        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running…' : 'Run'}
      </button>
      {error && (
        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>
      )}
      {result && (
        <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-x-auto max-h-64">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
