/**
 * Financial Services Dashboard Page
 * Production-level financial services overview and management
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingSkeleton } from '../components/ui/enhancedComponents';

const FinancialServicesDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Financial overview data
  const { data: financialData, isLoading: financialLoading } = useQuery({
    queryKey: ['financialOverview', timeRange],
    queryFn: () => fetch(`/api/financial/overview?timeRange=${timeRange}`)
      .then(res => res.json())
      .then(res => res.data),
    refetchInterval: 300000 // 5 minutes
  });

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Services Dashboard</h1>
        <div className="flex gap-2">
          {timeRanges.map(range => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? 'default' : 'outline'}
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {['overview', 'loans', 'insurance', 'payments', 'analytics'].map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {financialLoading ? (
        <LoadingSkeleton variant="rectangular" lines={4} />
      ) : (
        <>
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <p className="text-2xl font-bold">₹{(financialData?.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-sm text-green-600">+15.2% from last period</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-600">Active Loans</h3>
              <p className="text-2xl font-bold">{financialData?.activeLoans || 0}</p>
              <p className="text-sm text-blue-600">₹{(financialData?.outstandingLoanAmount || 0).toLocaleString()} outstanding</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-600">Insurance Policies</h3>
              <p className="text-2xl font-bold">{financialData?.activePolicies || 0}</p>
              <p className="text-sm text-purple-600">₹{(financialData?.totalCoverage || 0).toLocaleString()} coverage</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-600">Pending Payments</h3>
              <p className="text-2xl font-bold">{financialData?.pendingPayments || 0}</p>
              <p className="text-sm text-yellow-600">₹{(financialData?.pendingAmount || 0).toLocaleString()} pending</p>
            </Card>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Revenue Trends</h2>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Revenue chart visualization</p>
                </div>
              </Card>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Expense Breakdown</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Operational Costs</span>
                    <span className="font-medium">₹{(financialData?.operationalCosts || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Loan Repayments</span>
                    <span className="font-medium">₹{(financialData?.loanRepayments || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Insurance Premiums</span>
                    <span className="font-medium">₹{(financialData?.insurancePremiums || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Other Expenses</span>
                    <span className="font-medium">₹{(financialData?.otherExpenses || 0).toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Loan Management</h2>
                <Button>Apply for Loan</Button>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 border rounded flex justify-between items-center">
                    <div>
                      <p className="font-medium">Agricultural Loan #{i}</p>
                      <p className="text-sm text-gray-600">Amount: ₹{(50000 * i).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Insurance Tab */}
          {activeTab === 'insurance' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Insurance Policies</h2>
                <Button>Get New Policy</Button>
              </div>
              <div className="space-y-3">
                <div className="p-4 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Crop Insurance</p>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Coverage: ₹5,00,000 | Premium: ₹2,500/year</p>
                </div>
                <div className="p-4 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Equipment Insurance</p>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Coverage: ₹2,00,000 | Premium: ₹1,800/year</p>
                </div>
              </div>
            </Card>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Payment Management</h2>
                <Button>Make Payment</Button>
              </div>
              <div className="space-y-3">
                <div className="p-4 border rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium">Loan EMI - August 2026</p>
                    <p className="text-sm text-gray-600">Due: 15 August 2026</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹5,500</p>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium">Insurance Premium - Annual</p>
                    <p className="text-sm text-gray-600">Due: 30 September 2026</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹4,300</p>
                    <Badge variant="outline">Upcoming</Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Financial Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Cash flow chart</p>
                </div>
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Expense breakdown chart</p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialServicesDashboard;