import { useState } from 'react';
import { HeartPulse, Gift } from 'lucide-react';
import { farmerHealthRecordsAPI, farmerWelfareAPI } from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

/**
 * M029 (backend/src/modules/M029). The real backend has two genuinely
 * separate capabilities that this page's original single form conflated
 * into one "welfare record" (scheme_name/status/beneficiaries) shape that
 * matched neither:
 *  - Health records: real CRUD (listHealthRecords/createHealthRecord/...),
 *    fields are healthType/description/severity/date - medical issue
 *    tracking, not scheme enrollment.
 *  - Welfare programs: a program catalog (getWelfarePrograms) plus a thin
 *    enroll action (enrollWelfareProgram(farmerId, programId)) - no
 *    scheme_name/beneficiaries/notes fields exist on the real function.
 * Rebuilt (2026-08-28) as two real sections instead of one fabricated form.
 */

const HEALTH_TYPES = ['Injury', 'Illness', 'Chronic Condition', 'Maternity', 'Mental Health', 'Checkup'];
const SEVERITY = ['Low', 'Medium', 'High', 'Critical'];

function WelfareProgramsSection() {
  const [programs, setPrograms] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [farmerId, setFarmerId] = useState('');
  const [programId, setProgramId] = useState('');
  const [enrollResult, setEnrollResult] = useState(null);
  const [enrollError, setEnrollError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPrograms = async () => {
    setLoadError('');
    try {
      const res = await farmerWelfareAPI.getPrograms();
      setPrograms(res.data?.data?.items ?? []);
    } catch (e) {
      setLoadError(e?.response?.data?.error || e.message || 'Failed to load programs');
    }
  };

  const enroll = async () => {
    setEnrollError('');
    setEnrollResult(null);
    if (!farmerId || !programId) { setEnrollError('Farmer ID and Program ID are both required'); return; }
    setLoading(true);
    try {
      const res = await farmerWelfareAPI.enroll(farmerId, programId);
      setEnrollResult(res.data?.data);
    } catch (e) {
      setEnrollError(e?.response?.data?.error || e.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center mb-1">
        <Gift className="w-5 h-5 mr-2 text-rose-600" />
        <h2 className="text-lg font-semibold text-gray-800">Welfare Programs</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">Browse available welfare programs and enroll a farmer. This is an action, not a record you fill in — the real backend only tracks the enrollment itself (status starts at PENDING).</p>

      <button onClick={loadPrograms} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 mb-3">
        Load available programs
      </button>
      {loadError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 mb-3">{loadError}</div>}
      {programs && programs.length === 0 && <p className="text-sm text-gray-500 mb-3">No welfare programs found.</p>}
      {programs && programs.length > 0 && (
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 uppercase"><th className="py-1 pr-4">ID</th><th className="py-1 pr-4">Name</th><th className="py-1">Eligibility</th></tr></thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="py-1.5 pr-4 font-mono text-xs">{p.id}</td>
                  <td className="py-1.5 pr-4">{p.name}</td>
                  <td className="py-1.5">{p.eligibility ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Farmer ID</label>
          <input value={farmerId} onChange={(e) => setFarmerId(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Program ID</label>
          <input value={programId} onChange={(e) => setProgramId(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" placeholder="from the table above" />
        </div>
      </div>
      <button onClick={enroll} disabled={loading} className="px-4 py-1.5 bg-rose-600 text-white text-sm rounded font-medium hover:bg-rose-700 disabled:opacity-50">
        {loading ? 'Enrolling…' : 'Enroll'}
      </button>
      {enrollError && <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{enrollError}</div>}
      {enrollResult && <pre className="mt-3 text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-x-auto">{JSON.stringify(enrollResult, null, 2)}</pre>}
    </div>
  );
}

function FarmerHealthWelfarePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <HeartPulse className="w-6 h-6 mr-2 text-rose-600" />
          Farmer Health &amp; Welfare
        </h1>
        <p className="text-gray-600">Health issue tracking and welfare program enrollment</p>
      </div>

      <ResourceManager
        accent="rose"
        title="Health Records"
        description="Track health issues reported for farmers"
        queryKey="farmer-health-records"
        idField="id"
        list={(params) => farmerHealthRecordsAPI.getRecords(params)}
        create={(data) => farmerHealthRecordsAPI.createRecord(data)}
        update={(id, data) => farmerHealthRecordsAPI.updateRecord(id, data)}
        remove={(id) => farmerHealthRecordsAPI.deleteRecord(id)}
        searchPlaceholder="Search health records..."
        emptyMessage="No health records yet."
        newLabel="Add Health Record"
        initialForm={{ farmerId: '', healthType: 'Checkup', description: '', severity: 'Low', date: '' }}
        requiredFields={['farmerId', 'healthType']}
        columns={[
          { key: 'farmer_id', label: 'Farmer ID' },
          { key: 'health_type', label: 'Type' },
          { key: 'severity', label: 'Severity' },
          { key: 'date', label: 'Date' },
          { key: 'description', label: 'Description' },
        ]}
        fields={[
          { name: 'farmerId', label: 'Farmer ID', required: true },
          { name: 'healthType', label: 'Health type', type: 'select', options: HEALTH_TYPES },
          { name: 'severity', label: 'Severity', type: 'select', options: SEVERITY },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'description', label: 'Description', type: 'textarea', span: 2 },
        ]}
        stats={(items) => [
          { label: 'Records', value: items.length },
          { label: 'High/Critical', value: items.filter((i) => i.severity === 'High' || i.severity === 'Critical').length },
        ]}
      />

      <WelfareProgramsSection />
    </div>
  );
}

export default FarmerHealthWelfarePage;
