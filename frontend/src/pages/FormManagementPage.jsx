import { useEffect, useMemo, useState } from 'react';
import FormBuilderPanel from '../components/forms/FormBuilderPanel';
import FormPreviewPanel from '../components/forms/FormPreviewPanel';
import { formsAPI } from '../services/api';

function createTemplateDraft(template = null) {
  const baseField = {
    id: 'field-1',
    label: 'Primary observation',
    type: 'text',
    required: true,
    placeholder: 'Enter details',
    defaultValue: '',
    helpText: 'Capture the main information for this record.',
  };

  return {
    id: '',
    title: template?.title || 'New Enterprise Form',
    description: template?.description || 'Build a metadata-driven form for operations, quality, or governance.',
    category: template?.category || 'operations',
    status: 'draft',
    fields: [baseField],
    workflow: {
      enabled: true,
      stages: [
        { name: 'Draft', role: 'submitter' },
        { name: 'Review', role: 'manager' },
        { name: 'Approval', role: 'approver' },
      ],
    },
    metadata: {
      owner: 'system',
      department: template?.category || 'operations',
      compliance: 'standard',
      tags: [],
    },
    aiInsights: {
      score: 74,
      summary: ['The form is ready for pilot deployment.'],
      generatedAt: new Date().toISOString(),
    },
  };
}

function FormManagementPage() {
  const [forms, setForms] = useState([]);
  const [draft, setDraft] = useState(createTemplateDraft());
  const [selectedFormId, setSelectedFormId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadForms = async () => {
    setLoading(true);
    try {
      const response = await formsAPI.getForms();
      const nextForms = response.data.forms || [];
      setForms(nextForms);
      if (nextForms.length && !selectedFormId) {
        setDraft(createTemplateDraft(nextForms[0]));
        setSelectedFormId(nextForms[0].id);
      }
    } catch (error) {
      setMessage('Unable to load forms right now. The form service is running locally with file-backed storage.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const stats = useMemo(() => ({
    total: forms.length,
    drafts: forms.filter((form) => form.status === 'draft').length,
    active: forms.filter((form) => form.status === 'active').length,
  }), [forms]);

  const updateDraftValue = (path, value) => {
    setDraft((current) => {
      const next = JSON.parse(JSON.stringify(current));
      if (path === 'title' || path === 'description' || path === 'category' || path === 'status') {
        next[path] = value;
        return next;
      }

      if (path.startsWith('metadata.')) {
        const [, key] = path.split('.');
        next.metadata[key] = value;
        return next;
      }

      if (path.startsWith('fields.')) {
        const [, fieldIndex, key] = path.split('.');
        const index = Number(fieldIndex);
        const fields = [...(next.fields || [])];
        fields[index] = { ...(fields[index] || {}), [key]: value };
        next.fields = fields;
        return next;
      }

      return next;
    });
  };

  const handleAddField = (type) => {
    setDraft((current) => ({
      ...current,
      fields: [
        ...(current.fields || []),
        {
          id: `field-${Date.now()}`,
          label: `${type[0].toUpperCase()}${type.slice(1)} field`,
          type,
          required: false,
          placeholder: '',
          defaultValue: '',
          helpText: '',
        },
      ],
    }));
  };

  const handleRemoveField = (index) => {
    setDraft((current) => ({
      ...current,
      fields: (current.fields || []).filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleLoadTemplate = async (template) => {
    const nextDraft = createTemplateDraft(template);
    setDraft(nextDraft);
    setSelectedFormId('');
    setMessage(`Loaded template: ${template.title}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...draft,
        fields: draft.fields || [],
        metadata: draft.metadata || {},
        workflow: draft.workflow || {},
      };

      const response = draft.id ?
        await formsAPI.updateForm(draft.id, payload) :
        await formsAPI.createForm(payload);

      const savedForm = response.data;
      setDraft(savedForm);
      setSelectedFormId(savedForm.id);
      setForms((current) => (draft.id ? current.map((form) => (form.id === savedForm.id ? savedForm : form)) : [savedForm, ...current]));
      setMessage(`Saved form “${savedForm.title}” successfully.`);
    } catch (error) {
      setMessage('Unable to save the form. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDraft = async () => {
    if (!draft.id) {
      setMessage('Save the form first so the submission can be recorded.');
      return;
    }

    try {
      const values = (draft.fields || []).reduce((accumulator, field) => ({
        ...accumulator,
        [field.label]: field.defaultValue || '',
      }), {});
      const response = await formsAPI.submitForm(draft.id, { submittedBy: 'demo-user', values });
      setMessage(`Submission recorded with id ${response.data.id}.`);
    } catch (error) {
      setMessage('Submission could not be recorded.');
    }
  };

  const templates = [
    {
      id: 'template-packhouse-dpr',
      title: 'Packhouse DPR',
      category: 'operations',
      description: 'Daily reporting process with approval workflow and operational checks.',
    },
    {
      id: 'template-inspection',
      title: 'Inspection Checklist',
      category: 'quality',
      description: 'Quality inspection flow with digital signature support.',
    },
    {
      id: 'template-shipment',
      title: 'Shipment Declaration',
      category: 'logistics',
      description: 'Shipment declaration with embedded GIS metadata.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Enterprise Form Studio</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Universal form engine for AFRERA operations</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Create reusable forms, capture structured submissions, and review AI-driven readiness insights from a single workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{stats.total}</p>
                <p>Forms</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{stats.drafts}</p>
                <p>Drafts</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{stats.active}</p>
                <p>Active</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleLoadTemplate(template)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
              >
                {template.title}
              </button>
            ))}
          </div>

          {message ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <FormBuilderPanel
            draft={draft}
            onChange={updateDraftValue}
            onAddField={handleAddField}
            onRemoveField={handleRemoveField}
            onSave={handleSave}
            onSubmit={handleSubmitDraft}
            selectedFormId={selectedFormId}
            loading={loading}
            saving={saving}
          />
          <div className="space-y-6">
            <FormPreviewPanel draft={draft} onSubmit={handleSubmitDraft} />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Saved Forms</h2>
                  <p className="text-sm text-slate-600">Switch between available form definitions.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {forms.length === 0 ? (
                  <p className="text-sm text-slate-600">No forms saved yet. Create one from the builder panel.</p>
                ) : (
                  forms.map((form) => (
                    <button
                      key={form.id}
                      type="button"
                      onClick={() => {
                        setDraft(form);
                        setSelectedFormId(form.id);
                        setMessage(`Loaded form “${form.title}”.`);
                      }}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${selectedFormId === form.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{form.title}</p>
                          <p className="text-sm text-slate-600">{form.category} • {form.status}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                          {form.version || 1}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormManagementPage;
