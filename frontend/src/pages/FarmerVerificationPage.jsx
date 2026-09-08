import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, X as XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { farmerVerificationAPI } from '../services/api';
import ResourceManager from '../components/common/ResourceManager';

const VERIFICATION_TYPES = ['Land Ownership', 'Cropping Pattern', 'FPO Membership', 'Income Declaration', 'Address'];
const STATUS_COLOR = {
  Verified: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-800',
};

const initialForm = {
  farmer_name: '',
  verification_type: 'Land Ownership',
  claim_details: '',
  verifier_name: '',
  status: 'Pending',
};

/**
 * M025 — Farmer Verification. Distinct from M024 Farmer KYC (identity
 * document verification, kycAPI): this tracks field/peer verification of
 * claims a farmer's record makes (land, cropping, membership, income).
 * Uses ResourceManager for the base list/create/edit, plus two extra
 * verify/reject quick actions that the generic component doesn't cover.
 */
function FarmerVerificationPage() {
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: (id) => farmerVerificationAPI.verifyRequest(id, {}),
    onSuccess: () => { toast.success('Marked verified'); queryClient.invalidateQueries({ queryKey: ['farmer-verification'] }); },
    onError: () => toast.error('Failed to update — backend endpoint not available yet'),
  });
  const rejectMutation = useMutation({
    mutationFn: (id) => farmerVerificationAPI.rejectRequest(id, {}),
    onSuccess: () => { toast.success('Marked rejected'); queryClient.invalidateQueries({ queryKey: ['farmer-verification'] }); },
    onError: () => toast.error('Failed to update — backend endpoint not available yet'),
  });

  return (
    <ResourceManager
      accent="blue"
      icon={ShieldCheck}
      title="Farmer Verification"
      description="Field-verify land, cropping, membership and income claims on farmer records"
      queryKey="farmer-verification"
      idField="id"
      list={(params) => farmerVerificationAPI.getRequests(params)}
      create={(data) => farmerVerificationAPI.submitRequest(data)}
      searchPlaceholder="Search by farmer or verification type..."
      emptyMessage="No verification requests recorded yet."
      newLabel="Submit Request"
      backendNote="Backend endpoint /farmer-verification/requests has not been built yet — this page is wired and ready to work once it is."
      initialForm={initialForm}
      requiredFields={['farmer_name', 'verification_type']}
      columns={[
        { key: 'farmer_name', label: 'Farmer' },
        { key: 'verification_type', label: 'Type' },
        { key: 'claim_details', label: 'Claim' },
        { key: 'status', label: 'Status', render: (r) => (
          <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[r.status] || 'bg-gray-100 text-gray-700'}`}>{r.status || 'Pending'}</span>
        ) },
        { key: 'actions_extra', label: 'Verify / Reject', render: (r) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => verifyMutation.mutate(r.id)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark verified"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => rejectMutation.mutate(r.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        ) },
      ]}
      fields={[
        { name: 'farmer_name', label: 'Farmer name', required: true },
        { name: 'verification_type', label: 'Verification type', type: 'select', options: VERIFICATION_TYPES },
        { name: 'claim_details', label: 'Claim details', type: 'textarea', span: 2 },
        { name: 'verifier_name', label: 'Verifier name' },
        { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Verified', 'Rejected'] },
      ]}
      stats={(items) => [
        { label: 'Total requests', value: items.length },
        { label: 'Verified', value: items.filter((i) => i.status === 'Verified').length },
        { label: 'Pending', value: items.filter((i) => !i.status || i.status === 'Pending').length },
      ]}
    />
  );
}

export default FarmerVerificationPage;
