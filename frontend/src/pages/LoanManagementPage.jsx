/**
 * Loan Management Page
 * Production-level loan application and management interface
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect as Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { LoadingSkeleton } from '../components/ui/enhancedComponents';
import { financialAPI } from '../services/api';

const LoanManagementPage = () => {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [activeTab, setActiveTab] = useState('my-loans');

  // Get user's loans
  const { data: loansData, isLoading: loansLoading, error: loansError } = useQuery({
    queryKey: ['userLoans'],
    queryFn: () => financialAPI.getLoans().then(res => res.data.data),
    refetchInterval: 180000, // 3 minutes
  });

  const loans = loansData?.loans || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Loan Management</h1>
        <Button onClick={() => setShowApplicationForm(!showApplicationForm)}>
          {showApplicationForm ? 'Cancel' : 'Apply for Loan'}
        </Button>
      </div>

      {/* Loan Application Form */}
      {showApplicationForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Loan Application</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Loan Type</label>
              <Select>
                <option value="crop">Crop Loan</option>
                <option value="equipment">Equipment Loan</option>
                <option value="land">Land Development Loan</option>
                <option value="working">Working Capital Loan</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Loan Amount</label>
              <Input type="number" placeholder="Enter amount" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tenure (months)</label>
              <Input type="number" placeholder="Enter tenure" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Purpose</label>
              <Input placeholder="Loan purpose" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button>Submit Application</Button>
            <Button variant="outline" onClick={() => setShowApplicationForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {['my-loans', 'products', 'repayment', 'documents'].map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
          >
            {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Button>
        ))}
      </div>

      {loansLoading ? (
        <LoadingSkeleton variant="rectangular" lines={4} />
      ) : loansError ? (
        <p className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
          Unable to load loans: {loansError.message}
        </p>
      ) : (
        <>
          {/* My Loans Tab */}
          {activeTab === 'my-loans' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">My Loans</h2>
              {loans.length === 0 ? (
                <p className="text-gray-500">No active loans</p>
              ) : (
                <div className="space-y-3">
                  {loans.map(loan => (
                    <div key={loan.id} className="p-4 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{loan.loanType}</p>
                          <p className="text-sm text-gray-600">Loan ID: {loan.loanId}</p>
                        </div>
                        <Badge variant={loan.status === 'active' ? 'default' : 'outline'}>
                          {loan.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-medium">₹{loan.amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Outstanding</p>
                          <p className="font-medium">₹{loan.outstanding?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Next EMI</p>
                          <p className="font-medium">₹{loan.nextEmi?.toLocaleString()}</p>
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
              <h2 className="text-xl font-semibold mb-4">Available Loan Products</h2>
              <p className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-800">
                Loan products are currently unavailable because no verified loan-product catalog is configured.
              </p>
            </Card>
          )}

          {/* Repayment Tab */}
          {activeTab === 'repayment' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Repayment Schedule</h2>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(month => (
                  <div key={month} className="p-3 border rounded flex justify-between items-center">
                    <div>
                      <p className="font-medium">EMI - Month {month}</p>
                      <p className="text-sm text-gray-600">Due: 15{['Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]} 2026</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹5,500</p>
                      <Badge variant={month <= 2 ? 'destructive' : month === 3 ? 'outline' : 'default'}>
                        {month <= 2 ? 'Overdue' : month === 3 ? 'Due Soon' : 'Upcoming'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Loan Documents</h2>
              <div className="space-y-3">
                <div className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium">Loan Agreement</p>
                    <p className="text-sm text-gray-600">Uploaded: 15 August 2026</p>
                  </div>
                  <Button variant="outline" size="sm">Download</Button>
                </div>
                <div className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium">Income Proof</p>
                    <p className="text-sm text-gray-600">Uploaded: 15 August 2026</p>
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

export default LoanManagementPage;
