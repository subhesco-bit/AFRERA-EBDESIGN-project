import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycAPI } from '../services/api';
import { ShieldCheck, Plus, X, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';

const ID_TYPES = ['Aadhaar', 'Voter ID', 'PAN', 'Ration Card', 'Kisan Credit Card'];
const STATUS_FILTERS = ['', 'pending', 'verified', 'rejected'];

const emptyForm = { farmer_name: '', phone: '', id_type: 'Aadhaar', id_number: '', village: '', land_holding_hectares: '' };

function statusBadge(status) {
  const map = {
    verified: { cls: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    pending: { cls: 'bg-yellow-100 text-yellow-800', icon: Clock },
    rejected: { cls: 'bg-red-100 text-red-800', icon: XCircle },
  };
  const cfg = map[status] || map.pending;
  const Icon = cfg.icon;
  return (
    <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${cfg.cls}`}>
      <Icon className="w-3 h-3" />{status || 'pending'}
    </span>
  );
}

function FarmerKycPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState('');

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data, isLoading, error } = useQuery({
    queryKey: ['kyc-applications', statusFilter],
    queryFn: async () => (await kycAPI.getApplications(statusFilter ? { status: statusFilter } : {})).data?.data ?? [],
  });

  const submitMutation = useMutation({
    mutationFn: (payload) => kycAPI.submitApplication(payload),
    onSuccess: () => {
      toast.success('KYC application submitted');
      queryClient.invalidateQueries({ queryKey: ['kyc-applications'] });
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to submit application'),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, notes }) => kycAPI.verifyApplication(id, { notes }),
    onSuccess: () => { toast.success('Application verified'); queryClient.invalidateQueries({ queryKey: ['kyc-applications'] }); },
    onError: () => toast.error('Failed to verify application'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => kycAPI.rejectApplication(id, { reason }),
    onSuccess: () => { toast.success('Application rejected'); queryClient.invalidateQueries({ queryKey: ['kyc-applications'] }); },
    onError: () => toast.error('Failed to reject application'),
  });

  const applications = data || [];
  const pending = applications.filter((a) => (a.status || 'pending') === 'pending').length;
  const verified = applications.filter((a) => a.status === 'verified').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <ShieldCheck className="w-6 h-6 mr-2 text-emerald-600" />
            Farmer KYC
          </h1>
          <p className="text-gray-600">Submit and verify farmer identity documentation for onboarding</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center">
          <Plus className="w-5 h-5 mr-2" />New Application
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Applications</div>
          <div className="text-2xl font-bold text-gray-800">{applications.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Pending review</div>
          <div className="text-2xl font-bold text-yellow-700">{pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Verified</div>
          <div className="text-2xl font-bold text-green-700">{verified}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="classname-px-3-py-2-border-border-gray-3" className="text-sm font-medium text-gray-700">Status</label>
        <select id="classname-px-3-py-2-border-border-gray-3" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === '' ? 'All statuses' : s}</option>)}
        </select>
      </div>

      {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Error loading applications: {error.message}. Backend endpoint /farmer-kyc/applications has not been built yet — this page is wired and ready once it is.
        </div>
      )}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Document</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Village</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Land (ha)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No KYC applications yet.</td></tr>}
              {applications.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{a.farmer_name}</div>
                    <div className="text-xs text-gray-500">{a.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{a.id_type}: {a.id_number}</td>
                  <td className="px-4 py-3 text-gray-700">{a.village || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{a.land_holding_hectares ?? '—'}</td>
                  <td className="px-4 py-3">{statusBadge(a.status)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {(a.status || 'pending') === 'pending' && (
                      <>
                        <button onClick={() => verifyMutation.mutate({ id: a.id })} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Verify"><CheckCircle2 className="w-4 h-4" /></button>
                        <button
                          onClick={() => { const reason = prompt('Reason for rejection?'); if (reason) rejectMutation.mutate({ id: a.id, reason }); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded" title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">New KYC Application</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.farmer_name || !form.id_number) { toast.error('Farmer name and ID number are required'); return; }
                  submitMutation.mutate({
                    ...form,
                    land_holding_hectares: form.land_holding_hectares === '' ? null : Number(form.land_holding_hectares),
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border" className="block text-sm font-medium text-gray-700 mb-1">Farmer name *</label>
                  <input id="classname-w-full-px-3-py-2-border-border" value={form.farmer_name} onChange={(e) => setForm({ ...form, farmer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label htmlFor="classname-w-full-px-3-py-2-border-border-2" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input id="classname-w-full-px-3-py-2-border-border-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-3" className="block text-sm font-medium text-gray-700 mb-1">ID type</label>
                    <select id="classname-w-full-px-3-py-2-border-border-3" value={form.id_type} onChange={(e) => setForm({ ...form, id_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                      {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-4" className="block text-sm font-medium text-gray-700 mb-1">ID number *</label>
                    <input id="classname-w-full-px-3-py-2-border-border-4" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-5" className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                    <input id="classname-w-full-px-3-py-2-border-border-5" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label htmlFor="classname-w-full-px-3-py-2-border-border-6" className="block text-sm font-medium text-gray-700 mb-1">Land holding (ha)</label>
                    <input id="classname-w-full-px-3-py-2-border-border-6" type="number" step="0.01" value={form.land_holding_hectares} onChange={(e) => setForm({ ...form, land_holding_hectares: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={submitMutation.isPending} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-60">
                    {submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
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

export default FarmerKycPage;
