import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';

/**
 * Shared list/create/edit/delete scaffold for the second-batch domain
 * modules (M022-M029, M062-M068, M032-M039, M051-M059).
 *
 * Mirrors the hand-written shape of pages/LandRegistryPage.jsx (Tailwind
 * table + modal form, react-query for data, react-hot-toast for feedback)
 * so every module in this batch looks and behaves the same way instead of
 * hand-rolling ~250 near-identical lines per module. Uses the @tanstack/
 * react-query v5 object-form API (`useQuery({ queryKey, queryFn })`),
 * matching what's actually installed (frontend/package.json pins ^5.0.0) —
 * v5 dropped the positional `useQuery(key, fn)` form some existing pages in
 * this codebase (e.g. LandRegistryPage.jsx, FPODashboardPage.jsx) still use,
 * which throws at runtime rather than fetching. Not fixed here — those files
 * are out of scope for this task — but not copied forward either.
 *
 * `compact`: omits the page-level title header, for use as a tab body inside
 * a page that already renders its own header (FPODashboardPage.jsx-style).
 */
const ACCENTS = {
  green: { btn: 'bg-green-600 hover:bg-green-700', ring: 'focus:ring-green-500', text: 'text-green-600', icon: 'text-green-600' },
  blue: { btn: 'bg-blue-600 hover:bg-blue-700', ring: 'focus:ring-blue-500', text: 'text-blue-600', icon: 'text-blue-600' },
  amber: { btn: 'bg-amber-600 hover:bg-amber-700', ring: 'focus:ring-amber-500', text: 'text-amber-600', icon: 'text-amber-600' },
  purple: { btn: 'bg-purple-600 hover:bg-purple-700', ring: 'focus:ring-purple-500', text: 'text-purple-600', icon: 'text-purple-600' },
  teal: { btn: 'bg-teal-600 hover:bg-teal-700', ring: 'focus:ring-teal-500', text: 'text-teal-600', icon: 'text-teal-600' },
  indigo: { btn: 'bg-indigo-600 hover:bg-indigo-700', ring: 'focus:ring-indigo-500', text: 'text-indigo-600', icon: 'text-indigo-600' },
  rose: { btn: 'bg-rose-600 hover:bg-rose-700', ring: 'focus:ring-rose-500', text: 'text-rose-600', icon: 'text-rose-600' },
};

function inputClass(ring) {
  return `w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${ring}`;
}

export default function ResourceManager({
  accent = 'green',
  icon: Icon,
  title,
  description,
  compact = false,
  queryKey,
  list,
  create,
  update,
  remove,
  idField = 'id',
  searchPlaceholder = 'Search...',
  emptyMessage = 'Nothing recorded yet.',
  newLabel = 'Add',
  initialForm,
  requiredFields = [],
  requiredMessage = 'Please fill in the required fields',
  fields = [],
  columns = [],
  stats,
  backendNote,
}) {
  const a = ACCENTS[accent] || ACCENTS.green;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: [queryKey, search],
    queryFn: async () => {
      const res = await list(search ? { search } : {});
      return res.data?.data ?? res.data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? update(editingId, payload) : create(payload)),
    onSuccess: () => {
      toast.success(editingId ? 'Saved changes' : 'Created successfully');
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      closeForm();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => remove(id),
    onSuccess: () => {
      toast.success('Removed');
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: () => toast.error('Failed to remove'),
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(initialForm); };

  const openEdit = (row) => {
    const next = { ...initialForm };
    Object.keys(next).forEach((k) => { next[k] = row[k] ?? next[k]; });
    setForm(next);
    setEditingId(row[idField]);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const missing = requiredFields.some((f) => form[f] === '' || form[f] === null || form[f] === undefined);
    if (missing) {
      toast.error(requiredMessage);
      return;
    }
    saveMutation.mutate(form);
  };

  const rows = data || [];

  return (
    <div className={compact ? '' : 'container mx-auto px-4 py-8'}>
      {!compact && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              {Icon && <Icon className={`w-6 h-6 mr-2 ${a.icon}`} />}
              {title}
            </h1>
            {description && <p className="text-gray-600">{description}</p>}
          </div>
          {create && (
            <button
              onClick={() => { setForm(initialForm); setEditingId(null); setShowForm(true); }}
              className={`px-4 py-2 text-white rounded-lg font-semibold transition flex items-center ${a.btn}`}
            >
              <Plus className="w-5 h-5 mr-2" />
              {newLabel}
            </button>
          )}
        </div>
      )}

      {compact && create && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setForm(initialForm); setEditingId(null); setShowForm(true); }}
            className={`px-4 py-2 text-white rounded-lg font-semibold transition flex items-center ${a.btn}`}
          >
            <Plus className="w-5 h-5 mr-2" />
            {newLabel}
          </button>
        </div>
      )}

      {stats && rows && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {stats(rows).map((s) => (
            <div key={s.label} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className={inputClass(a.ring)}
        />
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Error loading data: {error.message}. {backendNote || 'This page is wired and ready to work once the backend endpoint is available.'}
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{c.label}</th>
                ))}
                {(update || remove) && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-gray-500">{emptyMessage}</td></tr>
              )}
              {rows.map((row, i) => (
                <tr key={row[idField] ?? i} className="hover:bg-gray-50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-gray-700">{c.render ? c.render(row) : (row[c.key] ?? '—')}</td>
                  ))}
                  {(update || remove) && (
                    <td className="px-4 py-3 text-right space-x-2">
                      {update && (
                        <button onClick={() => openEdit(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                      )}
                      {remove && (
                        <button
                          onClick={() => { if (confirm('Remove this record?')) deleteMutation.mutate(row[idField]); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
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
                <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit' : newLabel}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {fields.map((f) => (
                    <div key={f.name} className={f.span === 2 ? 'col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {f.label}{requiredFields.includes(f.name) ? ' *' : ''}
                      </label>
                      {f.type === 'select' ? (
                        <select
                          value={form[f.name] ?? ''}
                          onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                          className={inputClass(a.ring)}
                        >
                          {/* Options may be plain strings (value === label, e.g. an
                              enum like a depreciation method) or {value, label}
                              objects (e.g. a fiscal year: id as value, code as a
                              readable label) — both forms are used across pages. */}
                          {(f.options || []).map((o) => {
                            const value = o && typeof o === 'object' ? o.value : o;
                            const label = o && typeof o === 'object' ? o.label : o;
                            return <option key={value} value={value}>{label}</option>;
                          })}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea
                          value={form[f.name] ?? ''}
                          onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                          rows={3}
                          placeholder={f.placeholder}
                          className={inputClass(a.ring)}
                        />
                      ) : (
                        <input
                          type={f.type || 'text'}
                          step={f.type === 'number' ? (f.step || 'any') : undefined}
                          value={form[f.name] ?? ''}
                          onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                          placeholder={f.placeholder}
                          className={inputClass(a.ring)}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className={`px-4 py-2 text-white rounded-lg transition disabled:opacity-60 ${a.btn}`}
                  >
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : newLabel}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
