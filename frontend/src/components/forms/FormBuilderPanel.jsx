function FormBuilderPanel({ draft, onChange, onAddField, onRemoveField, onSave, onSubmit, selectedFormId, loading, saving }) {
  const fieldTypes = ['text', 'number', 'date', 'select', 'file', 'signature']

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Form Builder</h2>
          <p className="text-sm text-slate-600">Design a metadata-driven form with dynamic sections and workflow stages.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : selectedFormId ? 'Save Changes' : 'Create Form'}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Submit Draft
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          <span className="mb-1 block">Title</span>
          <input
            value={draft.title || ''}
            onChange={(event) => onChange('title', event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Form title"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          <span className="mb-1 block">Category</span>
          <input
            value={draft.category || ''}
            onChange={(event) => onChange('category', event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="operations"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          <span className="mb-1 block">Description</span>
          <textarea
            rows="3"
            value={draft.description || ''}
            onChange={(event) => onChange('description', event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Describe the purpose of the form"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          <span className="mb-1 block">Status</span>
          <select
            value={draft.status || 'draft'}
            onChange={(event) => onChange('status', event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          <span className="mb-1 block">Owner</span>
          <input
            value={draft.metadata?.owner || ''}
            onChange={(event) => onChange('metadata.owner', event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="operations"
          />
        </label>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Fields</h3>
          <div className="flex flex-wrap gap-2">
            {fieldTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onAddField(type)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
              >
                + {type}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {(draft.fields || []).map((field, index) => (
            <div key={field.id || index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{field.label || `Field ${index + 1}`}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{field.type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveField(index)}
                  className="text-sm text-rose-600 transition hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">Label</span>
                  <input
                    value={field.label || ''}
                    onChange={(event) => onChange(`fields.${index}.label`, event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">Type</span>
                  <select
                    value={field.type || 'text'}
                    onChange={(event) => onChange(`fields.${index}.type`, event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {fieldTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">Placeholder</span>
                  <input
                    value={field.placeholder || ''}
                    onChange={(event) => onChange(`fields.${index}.placeholder`, event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">Default Value</span>
                  <input
                    value={field.defaultValue || ''}
                    onChange={(event) => onChange(`fields.${index}.defaultValue`, event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  <span className="mb-1 block">Help text</span>
                  <textarea
                    rows="2"
                    value={field.helpText || ''}
                    onChange={(event) => onChange(`fields.${index}.helpText`, event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(field.required)}
                    onChange={(event) => onChange(`fields.${index}.required`, event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Required field
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FormBuilderPanel
