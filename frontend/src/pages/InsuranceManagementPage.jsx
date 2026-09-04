/**
 * Insurance Management Page
 * Production-level insurance policy management interface
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { insuranceAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect as Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { LoadingSkeleton } from '../components/ui/enhancedComponents';

const InsuranceManagementPage = () => {
  const queryClient = useQueryClient();
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [activeTab, setActiveTab] = useState('my-policies');
  const [policyForm, setPolicyForm] = useState({ insurance_type: 'crop', coverage_amount: '', asset_details: '', duration_years: 1 });
  const [claimForm, setClaimForm] = useState({ policy_id: '', claim_amount: '', incident_date: '', description: '' });

  // Get user's insurance policies
  const { data: policiesData, isLoading: policiesLoading, error: policiesError } = useQuery({
    queryKey: ['userPolicies'],
    queryFn: () => insuranceAPI.getPolicies({ scope: 'mine' }, { page: 1, limit: 50 })
      .then(res => res.data),
    refetchInterval: 180000, // 3 minutes
  });

  const { data: insuranceProducts } = useQuery({
    queryKey: ['insuranceProducts'],
    queryFn: () => insuranceAPI.getInsuranceProducts()
      .then(res => res.data),
  });

  const { data: claimsData } = useQuery({
    queryKey: ['insuranceClaims'],
    queryFn: () => insuranceAPI.getClaims({ scope: 'mine' }, { page: 1, limit: 50 }).then(res => res.data),
  });

  const policies = policiesData?.policies || policiesData?.items || [];
  const products = insuranceProducts?.products || insuranceProducts?.items || [];
  const claims = claimsData?.claims || claimsData?.items || [];

  const createPolicyMutation = useMutation({
    mutationFn: (data) => insuranceAPI.createPolicy(data),
    onSuccess: () => {
      toast.success('Policy application submitted');
      setShowPurchaseForm(false);
      queryClient.invalidateQueries({ queryKey: ['userPolicies'] });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Policy application failed'),
  });

  const submitClaimMutation = useMutation({
    mutationFn: (data) => insuranceAPI.submitClaim(data),
    onSuccess: () => {
      toast.success('Claim submitted for assessment');
      setShowClaimForm(false);
      queryClient.invalidateQueries({ queryKey: ['insuranceClaims'] });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Claim submission failed'),
  });

  const submitPolicy = (event) => {
    event.preventDefault();
    createPolicyMutation.mutate(policyForm);
  };

  const submitClaim = (event) => {
    event.preventDefault();
    submitClaimMutation.mutate(claimForm);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Insurance Management</h1>
        <Button onClick={() => setShowPurchaseForm(!showPurchaseForm)}>
          {showPurchaseForm ? 'Cancel' : 'Purchase Policy'}
        </Button>
      </div>

      {/* Insurance Purchase Form */}
      {showPurchaseForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Purchase Insurance Policy</h2>
          <form onSubmit={submitPolicy} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Insurance Type</label>
              <Select value={policyForm.insurance_type} onChange={(event) => setPolicyForm({ ...policyForm, insurance_type: event.target.value })}>
                <option value="crop">Crop Insurance</option>
                <option value="equipment">Equipment Insurance</option>
                <option value="livestock">Livestock Insurance</option>
                <option value="health">Health Insurance</option>
                <option value="property">Property Insurance</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Coverage Amount</label>
              <Input type="number" min="1" required value={policyForm.coverage_amount} onChange={(event) => setPolicyForm({ ...policyForm, coverage_amount: event.target.value })} placeholder="Enter coverage amount" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Asset/Crop Details</label>
              <Input required value={policyForm.asset_details} onChange={(event) => setPolicyForm({ ...policyForm, asset_details: event.target.value })} placeholder="Enter asset or crop details" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration (years)</label>
              <Input type="number" min="1" required value={policyForm.duration_years} onChange={(event) => setPolicyForm({ ...policyForm, duration_years: event.target.value })} placeholder="Enter duration" />
            </div>
            <div className="mt-4 flex gap-2 md:col-span-2">
              <Button type="submit" disabled={createPolicyMutation.isPending}>{createPolicyMutation.isPending ? 'Submitting...' : 'Submit policy application'}</Button>
              <Button type="button" variant="outline" onClick={() => setShowPurchaseForm(false)}>
              Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {['my-policies', 'products', 'claims', 'documents'].map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
          >
            {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Button>
        ))}
      </div>

      {policiesLoading ? (
        <LoadingSkeleton variant="rectangular" lines={4} />
      ) : policiesError ? (
        <Card className="p-6"><p className="text-red-700">Unable to load insurance records: {policiesError.message}</p></Card>
      ) : (
        <>
          {/* My Policies Tab */}
          {activeTab === 'my-policies' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">My Insurance Policies</h2>
              {policies.length === 0 ? (
                <p className="text-gray-500">No active insurance policies</p>
              ) : (
                <div className="space-y-3">
                  {policies.map(policy => (
                    <div key={policy.id} className="p-4 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{policy.insuranceType}</p>
                          <p className="text-sm text-gray-600">Policy ID: {policy.policyId}</p>
                        </div>
                        <Badge variant={policy.status === 'active' ? 'default' : 'outline'}>
                          {policy.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Coverage</p>
                          <p className="font-medium">₹{policy.coverage?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Premium</p>
                          <p className="font-medium">₹{policy.premium?.toLocaleString()}/year</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expiry</p>
                          <p className="font-medium">
                            {policy.expiryDate ? new Date(policy.expiryDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Available Insurance Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.length === 0 ? <p className="text-sm text-gray-500">No insurance products are currently available.</p> : products.map((product) => (
                  <div key={product.id} className="p-4 border rounded">
                    <h3 className="font-semibold">{product.name || product.product_name || product.type || 'Insurance product'}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.description || 'Coverage details are provided in the policy terms.'}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{product.premium ? `From ₹${Number(product.premium).toLocaleString('en-IN')}` : 'Quote required'}</span>
                      <Button size="sm" onClick={() => { setPolicyForm({ ...policyForm, insurance_type: product.type || product.product_type || 'crop' }); setShowPurchaseForm(true); }}>Request quote</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Claims Tab */}
          {activeTab === 'claims' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Insurance Claims</h2>
                <Button onClick={() => setShowClaimForm(!showClaimForm)}>{showClaimForm ? 'Close claim form' : 'File New Claim'}</Button>
              </div>
              {showClaimForm && (
                <form onSubmit={submitClaim} className="mb-5 grid gap-4 rounded-lg border border-v42-line bg-v42-paddy2 p-4 md:grid-cols-2">
                  <div><label className="block text-sm font-medium mb-2">Policy</label><Select required value={claimForm.policy_id} onChange={(event) => setClaimForm({ ...claimForm, policy_id: event.target.value })}><option value="">Select policy</option>{policies.map((policy) => <option key={policy.id} value={policy.id}>{policy.policy_number || policy.policyId || policy.id}</option>)}</Select></div>
                  <div><label className="block text-sm font-medium mb-2">Claim amount</label><Input type="number" min="1" required value={claimForm.claim_amount} onChange={(event) => setClaimForm({ ...claimForm, claim_amount: event.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-2">Incident date</label><Input type="date" required value={claimForm.incident_date} onChange={(event) => setClaimForm({ ...claimForm, incident_date: event.target.value })} /></div>
                  <div><label className="block text-sm font-medium mb-2">Description</label><Input required value={claimForm.description} onChange={(event) => setClaimForm({ ...claimForm, description: event.target.value })} /></div>
                  <div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={submitClaimMutation.isPending}>{submitClaimMutation.isPending ? 'Submitting...' : 'Submit claim'}</Button><Button type="button" variant="outline" onClick={() => setShowClaimForm(false)}>Cancel</Button></div>
                </form>
              )}
              <div className="space-y-3">
                {claims.length === 0 ? <p className="text-sm text-gray-500">No claims filed for this account.</p> : claims.map((claim) => <div key={claim.id} className="p-4 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{claim.claim_type || claim.type || 'Insurance claim'}</p>
                      <p className="text-sm text-gray-600">Claim ID: {claim.claim_number || claim.claimId || claim.id}</p>
                    </div>
                    <Badge variant="outline">{claim.status || 'Under review'}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Claim Amount</p>
                      <p className="font-medium">₹{Number(claim.claim_amount || claim.amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Filed Date</p>
                      <p className="font-medium">{claim.filed_date ? new Date(claim.filed_date).toLocaleDateString('en-IN') : 'Date unavailable'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-medium">{claim.status || 'Under review'}</p>
                    </div>
                  </div>
                </div>) }
              </div>
            </Card>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Policy Documents</h2>
              {policies.length === 0 ? (
                <p className="text-sm text-gray-500">No active policies to attach documents to yet.</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {policies.map((policy) => (
                    <div key={policy.id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <p className="font-medium">{policy.insuranceType || 'Insurance policy'}</p>
                        <p className="text-sm text-gray-600">Policy ID: {policy.policyId || policy.id}</p>
                      </div>
                      <span className="text-xs text-gray-500">No document on file</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500">
                Document upload and download is not available yet — this account has no policy document
                storage wired up on the backend. Contact support for a copy of your policy documents.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default InsuranceManagementPage;
