import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { strategicAPI } from '../services/api';
import { FileText, Sprout, CheckCircle, AlertCircle, TrendingUp, Leaf, ShieldCheck, CalendarDays, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

function ContractFarmingPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('contracts');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [application, setApplication] = useState({
    area_hectares: '',
    expected_yield_tons: '',
    contract_period_start: new Date().toISOString().slice(0, 10),
    contract_period_end: '',
    region: '',
  });

  const { data: contracts, isLoading: contractsLoading, error: contractsError } = useQuery({
    queryKey: ['contract-farming-contracts', user?.id],
    queryFn: () => strategicAPI.contractFarming.getFarmerContracts({ userId: user?.id }).then(r => r.data),
    enabled: Boolean(user?.id) && user?.role === 'farmer',
  });

  const { data: opportunities, isLoading: opportunitiesLoading, error: opportunitiesError } = useQuery({
    queryKey: ['contract-farming-opportunities'],
    queryFn: () => strategicAPI.contractFarming.getOpportunities().then(r => r.data),
  });

  const createContractMutation = useMutation({
    mutationFn: (data) => strategicAPI.contractFarming.createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-farming-contracts'] });
      setSelectedOpportunity(null);
      toast.success('Contract application submitted for review');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Contract application could not be submitted');
    },
  });

  const handleCreateContract = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setApplication((current) => ({
      ...current,
      area_hectares: opportunity.area_hectares || '',
      expected_yield_tons: opportunity.expected_yield_tons || '',
      contract_period_end: opportunity.contract_period_end || '',
      region: opportunity.region || '',
    }));
  };

  const submitContractApplication = (event) => {
    event.preventDefault();
    if (!selectedOpportunity || !application.area_hectares || !application.expected_yield_tons || !application.contract_period_end) {
      toast.error('Complete the area, expected yield, and contract period before submitting');
      return;
    }

    const contractData = {
      farmer_id: user?.id,
      buyer_id: selectedOpportunity.buyer_id,
      crop_variety: selectedOpportunity.crop_variety,
      area_hectares: Number(application.area_hectares),
      expected_yield_tons: Number(application.expected_yield_tons),
      contract_period_start: application.contract_period_start,
      contract_period_end: application.contract_period_end,
      base_price: selectedOpportunity.base_price,
      region: application.region,
      quality_standards: selectedOpportunity.quality_standards || {},
      payment_schedule: selectedOpportunity.payment_schedule || {},
    };
    createContractMutation.mutate(contractData);
  };

  const contractItems = contracts?.contracts || contracts?.items || [];
  const opportunityItems = opportunities?.opportunities || opportunities?.items || [];

  return (
    <div className="min-h-screen bg-v42-paddy2 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-2xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300"><ShieldCheck className="h-4 w-4" /> Verified production agreements</div>
              <h1 className="flex items-center gap-3 text-3xl font-bold sm:text-4xl">
                <FileText className="h-9 w-9 text-emerald-300" /> Contract farming
              </h1>
              <p className="mt-3 max-w-2xl text-slate-300">
              Convert a buyer commitment into a transparent production plan with agreed pricing, technical support, quality assurance, and milestone visibility.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[300px]">
              <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4"><div className="text-slate-400">Active agreements</div><div className="mt-1 text-2xl font-bold">{contractItems.length}</div></div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4"><div className="text-slate-400">Open opportunities</div><div className="mt-1 text-2xl font-bold">{opportunityItems.length}</div></div>
            </div>
          </div>
        </div>
        <div className="mb-8 flex flex-wrap gap-3 text-gray-800">
          <div className="rounded-xl border border-v42-line bg-white px-4 py-3 text-sm shadow-sm"><span className="font-semibold">Price protection</span><span className="ml-2 text-gray-500">Base price + quality bonus</span></div>
          <div className="rounded-xl border border-v42-line bg-white px-4 py-3 text-sm shadow-sm"><span className="font-semibold">Field support</span><span className="ml-2 text-gray-500">Inputs and technical package</span></div>
          <div className="rounded-xl border border-v42-line bg-white px-4 py-3 text-sm shadow-sm"><span className="font-semibold">Traceable delivery</span><span className="ml-2 text-gray-500">Quality milestones</span></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setSelectedTab('contracts')}
            className={`px-4 py-2 font-medium ${selectedTab === 'contracts' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
          My Contracts
          </button>
          <button
            onClick={() => setSelectedTab('opportunities')}
            className={`px-4 py-2 font-medium ${selectedTab === 'opportunities' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
          Available Contracts
          </button>
        </div>

        {selectedTab === 'contracts' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Farming Contracts</h2>
            {contractsLoading ? (
              <div className="text-center py-8">Loading contracts...</div>
            ) : contractsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">Unable to load your contracts: {contractsError.message}</div>
            ) : contractItems.length > 0 ? (
              <div className="grid gap-4">
                {contractItems.map((contract) => (
                  <div key={contract.id} className="bg-white rounded-lg shadow p-6 border">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{contract.crop_variety || 'Contract'}</h3>
                        <p className="text-gray-600">Buyer: {contract.buyer_name || 'TBD'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        contract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {contract.status || 'Active'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Area</p>
                        <p className="font-semibold">{contract.area_hectares || 0} hectares</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Expected Yield</p>
                        <p className="font-semibold">{contract.expected_yield_tons || 0} tons</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Base Price</p>
                        <p className="font-semibold">₹{contract.base_price || 0}/quintal</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Compliance</p>
                        <p className="font-semibold">{contract.compliance_score || 0}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Leaf className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No active contracts. Browse opportunities to get started.</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'opportunities' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Contract Opportunities</h2>
            {opportunitiesLoading ? (
              <div className="text-center py-8">Loading opportunities...</div>
            ) : opportunitiesError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">Unable to load opportunities: {opportunitiesError.message}</div>
            ) : opportunityItems.length > 0 ? (
              <div className="grid gap-4">
                {opportunityItems.map((opportunity) => (
                  <div key={opportunity.id} className="bg-white rounded-lg shadow p-6 border">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{opportunity.crop_variety || 'Crop Contract'}</h3>
                        <p className="text-gray-600">Buyer: {opportunity.buyer_name || 'Corporate Buyer'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">₹{opportunity.base_price || 0}</p>
                        <p className="text-sm text-gray-500">base price/quintal</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Area Required</p>
                        <p className="font-semibold">{opportunity.area_hectares || 0} hectares</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Technical Package</p>
                        <p className="font-semibold">{opportunity.technical_package || 'Included'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Quality Bonus</p>
                        <p className="font-semibold">{opportunity.quality_bonus || 'Available'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCreateContract(opportunity)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                    Apply for Contract
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Sprout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No contract opportunities available at this time.</p>
              </div>
            )}
          </div>
        )}

        {selectedOpportunity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="contract-application-title">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div><p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Application review</p><h2 id="contract-application-title" className="mt-1 text-2xl font-bold text-gray-900">{selectedOpportunity.crop_variety || 'Production contract'}</h2><p className="mt-1 text-sm text-gray-500">{selectedOpportunity.buyer_name || 'Verified buyer'} · ₹{selectedOpportunity.base_price || 0}/quintal base price</p></div>
                <button type="button" onClick={() => setSelectedOpportunity(null)} className="text-2xl text-gray-400 hover:text-gray-700" aria-label="Close application">×</button>
              </div>
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-emerald-50 p-3"><div className="text-xs text-emerald-700">Area requested</div><div className="font-semibold">{selectedOpportunity.area_hectares || 'Flexible'} ha</div></div>
                <div className="rounded-xl bg-amber-50 p-3"><div className="text-xs text-amber-700">Technical package</div><div className="font-semibold">{selectedOpportunity.technical_package || 'Included'}</div></div>
                <div className="rounded-xl bg-blue-50 p-3"><div className="text-xs text-blue-700">Quality bonus</div><div className="font-semibold">{selectedOpportunity.quality_bonus || 'Available'}</div></div>
              </div>
              <form onSubmit={submitContractApplication} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">Area to commit (hectares)<input type="number" min="0.1" step="0.1" required value={application.area_hectares} onChange={(event) => setApplication({ ...application, area_hectares: event.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
                  <label className="text-sm font-medium text-gray-700">Expected yield (tons)<input type="number" min="0.1" step="0.1" required value={application.expected_yield_tons} onChange={(event) => setApplication({ ...application, expected_yield_tons: event.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
                  <label className="text-sm font-medium text-gray-700">Production start<input type="date" required value={application.contract_period_start} onChange={(event) => setApplication({ ...application, contract_period_start: event.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
                  <label className="text-sm font-medium text-gray-700">Production end<input type="date" required value={application.contract_period_end} onChange={(event) => setApplication({ ...application, contract_period_end: event.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
                </div>
                <label className="text-sm font-medium text-gray-700">Production region<input type="text" value={application.region} onChange={(event) => setApplication({ ...application, region: event.target.value })} placeholder="District or state" className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
                <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => setSelectedOpportunity(null)} className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700">Review later</button><button type="submit" disabled={createContractMutation.isPending} className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{createContractMutation.isPending ? 'Submitting...' : 'Submit application'}</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContractFarmingPage;
