function FormPreviewPanel({ draft, onSubmit }) {
  const renderInput = (field) => {
    const commonClassName = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

    switch (field.type) {
      case 'number':
        return <input aria-label="Number" type="number" className={commonClassName} placeholder={field.placeholder || ''} />;
      case 'date':
        return <input aria-label="Date" type="date" className={commonClassName} />;
      case 'select':
        return (
          <select aria-label="Select an option" className={commonClassName}>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'file':
        return <input aria-label="File" type="file" className={commonClassName} />;
      case 'signature':
        return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">Signature capture placeholder</div>;
      default:
        return <input aria-label="Text" type="text" className={commonClassName} placeholder={field.placeholder || ''} />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Live Preview</h2>
          <p className="text-sm text-slate-600">Test the experience and review AI guidance before deployment.</p>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
          {draft.aiInsights?.score || 0} / 100
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">AI readiness</p>
            <p className="text-sm text-slate-600">{draft.aiInsights?.summary?.[0] || 'Ready for pilot deployment.'}</p>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Review Submission
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 p-4">
        <h3 className="text-lg font-semibold text-slate-900">{draft.title || 'Untitled form'}</h3>
        <p className="mt-1 text-sm text-slate-600">{draft.description || 'Add a description to tell users what this form is for.'}</p>

        <div className="mt-4 space-y-4">
          {(draft.fields || []).map((field, index) => (
            <label key={field.id || index} className="block text-sm font-medium text-slate-700">
              <span className="mb-1 block">
                {field.label || `Field ${index + 1}`}
                {field.required ? ' *' : ''}
              </span>
              {renderInput(field)}
              {field.helpText ? <span className="mt-1 block text-xs font-normal text-slate-500">{field.helpText}</span> : null}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FormPreviewPanel;
