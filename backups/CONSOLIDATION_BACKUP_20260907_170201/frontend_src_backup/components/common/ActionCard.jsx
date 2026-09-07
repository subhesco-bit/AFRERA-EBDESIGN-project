import { useState } from 'react'

/**
 * One real backend operation: scalar fields (for simple id/string/number
 * params) plus an optional JSON textarea (for whatever nested payload shape
 * the operation actually expects). Extracted from WaterManagementPage.jsx
 * (2026-08-28) since the same pattern is needed for any module whose real
 * functions are action-oriented rather than CRUD - don't force a fabricated
 * list/create/update/delete shape onto a module that doesn't have one.
 *
 * onRun(values, jsonPayload) is called with the scalar field values object
 * and the parsed JSON payload (or {} if hasJsonPayload is false/empty).
 */
export default function ActionCard({ title, description, fields = [], hasJsonPayload, jsonLabel, jsonPlaceholder, onRun }) {
  const [values, setValues] = useState({})
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    setError('')
    setResult(null)
    let payload
    if (hasJsonPayload) {
      try {
        payload = jsonText.trim() ? JSON.parse(jsonText) : {}
        setJsonError('')
      } catch {
        setJsonError('Not valid JSON')
        return
      }
    }
    setLoading(true)
    try {
      const res = await onRun(values, payload)
      setResult(res?.data ?? res)
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{description}</p>

      {fields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label htmlFor={`actioncard-${title}-${f.name}`} className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <input id={`actioncard-${title}-${f.name}`}
                type={f.type || 'text'}
                value={values[f.name] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>
      )}

      {hasJsonPayload && (
        <div className="mb-3">
          <label htmlFor="value" className="block text-xs font-medium text-gray-600 mb-1">{jsonLabel}</label>
          <textarea id="value"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono"
            placeholder={jsonPlaceholder}
          />
          {jsonError && <p className="text-xs text-red-600 mt-1">{jsonError}</p>}
        </div>
      )}

      <button
        onClick={handleRun}
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
