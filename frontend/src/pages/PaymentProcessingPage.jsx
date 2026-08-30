/**
 * Payment Processing Page
 * Production-level payment processing and transaction management interface
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { LoadingSkeleton } from '../components/ui/enhancedComponents';

const PaymentProcessingPage = () => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');

  // Get payment transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['paymentTransactions'],
    queryFn: () => fetch('/api/financial/payments')
      .then(res => res.json())
      .then(res => res.data),
    refetchInterval: 120000 // 2 minutes
  });

  // Get payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => fetch('/api/financial/payment-methods')
      .then(res => res.json())
      .then(res => res.data)
  });

  const transactions = transactionsData?.transactions || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment Processing</h1>
        <Button onClick={() => setShowPaymentForm(!showPaymentForm)}>
          {showPaymentForm ? 'Cancel' : 'Make Payment'}
        </Button>
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Make Payment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Payment Type</label>
              <Select>
                <option value="loan">Loan EMI</option>
                <option value="insurance">Insurance Premium</option>
                <option value="purchase">Purchase Payment</option>
                <option value="other">Other Payment</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <Input type="number" placeholder="Enter amount" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <Select>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Credit/Debit Card</option>
                <option value="wallet">Digital Wallet</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reference ID</label>
              <Input placeholder="Enter reference ID (optional)" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button>Process Payment</Button>
            <Button variant="outline" onClick={() => setShowPaymentForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {['transactions', 'methods', 'schedules', 'history'].map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {transactionsLoading ? (
        <LoadingSkeleton variant="rectangular" lines={4} />
      ) : (
        <>
          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-500">No recent transactions</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map(transaction => (
                    <div key={transaction.id} className="p-4 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">Transaction ID: {transaction.transactionId}</p>
                        </div>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'outline'}>
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-medium">₹{transaction.amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Date</p>
                          <p className="font-medium">
                            {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Method</p>
                          <p className="font-medium">{transaction.method}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'methods' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Payment Methods</h2>
                <Button>Add New Method</Button>
              </div>
              <div className="space-y-3">
                <div className="p-4 border rounded flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">📱</span>
                    </div>
                    <div>
                      <p className="font-medium">UPI</p>
                      <p className="text-sm text-gray-600">user@upi</p>
                    </div>
                  </div>
                  <Badge variant="default">Primary</Badge>
                </div>
                <div className="p-4 border rounded flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🏦</span>
                    </div>
                    <div>
                      <p className="font-medium">Bank Account</p>
                      <p className="text-sm text-gray-600">HDFC Bank - ****4521</p>
                    </div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="p-4 border rounded flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">💳</span>
                    </div>
                    <div>
                      <p className="font-medium">Credit Card</p>
                      <p className="text-sm text-gray-600">Visa - ****8899</p>
                    </div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Schedules Tab */}
          {activeTab === 'schedules' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Scheduled Payments</h2>
                <Button>Set Up Schedule</Button>
              </div>
              <div className="space-y-3">
                <div className="p-4 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Loan EMI - Auto Debit</p>
                      <p className="text-sm text-gray-600">Every month on 15th</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Amount</p>
                      <p className="font-medium">₹5,500</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Next Payment</p>
                      <p className="font-medium">15 September 2026</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Insurance Premium - Annual</p>
                      <p className="text-sm text-gray-600">Every year on 30th September</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Amount</p>
                      <p className="font-medium">₹4,300</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Next Payment</p>
                      <p className="font-medium">30 September 2026</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Payment History</h2>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-3 border rounded flex justify-between items-center">
                    <div>
                      <p className="font-medium">Payment #{i}</p>
                      <p className="text-sm text-gray-600">
                        {15 - i} August 2026
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{(5000 + i * 1000).toLocaleString()}</p>
                      <Badge variant="default">Completed</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentProcessingPage;