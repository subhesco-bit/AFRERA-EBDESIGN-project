/**
 * Insurance Management Page
 * Production-level insurance policy management interface
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { LoadingSkeleton } from '../components/ui/enhancedComponents';

const InsuranceManagementPage = () => {
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [activeTab, setActiveTab] = useState('my-policies');

  // Get user's insurance policies
  const { data: policiesData, isLoading: policiesLoading } = useQuery({
    queryKey: ['userPolicies'],
    queryFn: () => fetch('/api/financial/insurance')
      .then(res => res.json())
      .then(res => res.data),
    refetchInterval: 180000 // 3 minutes
  });

  // Get insurance products
  const { data: insuranceProducts } = useQuery({
    queryKey: ['insuranceProducts'],
    queryFn: () => fetch('/api/financial/insurance-products')
      .then(res => res.json())
      .then(res => res.data)
  });

  const policies = policiesData?.policies || [];

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Insurance Type</label>
              <Select>
                <option value="crop">Crop Insurance</option>
                <option value="equipment">Equipment Insurance</option>
                <option value="livestock">Livestock Insurance</option>
                <option value="health">Health Insurance</option>
                <option value="property">Property Insurance</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Coverage Amount</label>
              <Input type="number" placeholder="Enter coverage amount" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Asset/Crop Details</label>
              <Input placeholder="Enter asset or crop details" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration (years)</label>
              <Input type="number" placeholder="Enter duration" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button>Purchase Policy</Button>
            <Button variant="outline" onClick={() => setShowPurchaseForm(false)}>
              Cancel
            </Button>
          </div>
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
                <div className="p-4 border rounded">
                  <h3 className="font-semibold">Crop Insurance</h3>
                  <p className="text-sm text-gray-600 mb-2">Protection against crop failure due to natural calamities</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">From ₹2,500/year</span>
                    <Button size="sm">Purchase</Button>
                  </div>
                </div>
                <div className="p-4 border rounded">
                  <h3 className="font-semibold">Equipment Insurance</h3>
                  <p className="text-sm text-gray-600 mb-2">Coverage for agricultural machinery and tools</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">From ₹1,800/year</span>
                    <Button size="sm">Purchase</Button>
                  </div>
                </div>
                <div className="p-4 border rounded">
                  <h3 className="font-semibold">Livestock Insurance</h3>
                  <p className="text-sm text-gray-600 mb-2">Protection for cattle, poultry, and other livestock</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">From ₹3,200/year</span>
                    <Button size="sm">Purchase</Button>
                  </div>
                </div>
                <div className="p-4 border rounded">
                  <h3 className="font-semibold">Health Insurance</h3>
                  <p className="text-sm text-gray-600 mb-2">Medical coverage for farmers and families</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">From ₹4,500/year</span>
                    <Button size="sm">Purchase</Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Claims Tab */}
          {activeTab === 'claims' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Insurance Claims</h2>
                <Button>File New Claim</Button>
              </div>
              <div className="space-y-3">
                <div className="p-4 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Crop Damage Claim</p>
                      <p className="text-sm text-gray-600">Claim ID: CLM-2024-001</p>
                    </div>
                    <Badge variant="outline">In Review</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Claim Amount</p>
                      <p className="font-medium">₹25,000</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Filed Date</p>
                      <p className="font-medium">20 August 2026</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-medium">Under Investigation</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Equipment Damage Claim</p>
                      <p className="text-sm text-gray-600">Claim ID: CLM-2024-002</p>
                    </div>
                    <Badge variant="default">Approved</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Claim Amount</p>
                      <p className="font-medium">₹15,000</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Filed Date</p>
                      <p className="font-medium">10 August 2026</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Settlement</p>
                      <p className="font-medium">₹12,750 paid</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Policy Documents</h2>
              <div className="space-y-3">
                <div className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium">Crop Insurance Policy</p>
                    <p className="text-sm text-gray-600">Policy ID: POL-2024-001</p>
                  </div>
                  <Button variant="outline" size="sm">Download</Button>
                </div>
                <div className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium">Equipment Insurance Policy</p>
                    <p className="text-sm text-gray-600">Policy ID: POL-2024-002</p>
                  </div>
                  <Button variant="outline" size="sm">Download</Button>
                </div>
                <Button className="w-full">Upload New Document</Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default InsuranceManagementPage;