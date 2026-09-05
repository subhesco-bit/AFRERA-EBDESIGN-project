import React, { useState, useEffect } from 'react';
import { paymentGatewayAPI } from '../services/api';

export default function PaymentGatewayPage() {
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [supportedGateways, setSupportedGateways] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: 1000,
    currency: 'INR',
    gateway: 'razorpay',
    paymentMethod: 'card',
    description: 'Test payment'
  });

  useEffect(() => {
    loadSupportedGateways();
  }, []);

  const loadSupportedGateways = async () => {
    try {
      const result = await paymentGatewayAPI.getSupportedGateways();
      setSupportedGateways(result.data);
    } catch (error) {
      console.error('Failed to load gateways:', error);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setPaymentStatus(null);

    try {
      const result = await paymentGatewayAPI.processPayment(paymentData);
      setPaymentStatus(result.data);
    } catch (error) {
      setPaymentStatus({
        success: false,
        error: error.message
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRefund = async (paymentId) => {
    try {
      const result = await paymentGatewayAPI.refundPayment(paymentId, {
        amount: paymentData.amount,
        reason: 'Customer request'
      });
      setPaymentStatus({
        ...paymentStatus,
        refundResult: result.data
      });
    } catch (error) {
      console.error('Refund failed:', error);
    }
  };

  const handleCheckStatus = async (paymentId) => {
    try {
      const result = await paymentGatewayAPI.getPaymentStatus(paymentId);
      setPaymentStatus(result.data);
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Gateway</h1>
        <p className="text-gray-600 mt-2">Process secure payments through multiple payment gateways</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </span>
            Process Payment
          </h2>

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
              <input
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Gateway</label>
              <select
                value={paymentData.gateway}
                onChange={(e) => setPaymentData({ ...paymentData, gateway: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
                <option value="paytm">Paytm</option>
                <option value="phonepe">PhonePe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="upi">UPI</option>
                <option value="netbanking">Net Banking</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={paymentData.description}
                onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Payment description"
              />
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : `Pay ₹${paymentData.amount}`}
            </button>
          </form>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Payment Status
          </h2>

          {paymentStatus ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${paymentStatus.success !== false ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {paymentStatus.success !== false ? (
                    <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`font-semibold ${paymentStatus.success !== false ? 'text-green-800' : 'text-red-800'}`}>
                    {paymentStatus.success !== false ? 'Payment Successful' : 'Payment Failed'}
                  </span>
                </div>
              </div>

              {paymentStatus.paymentId && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Payment ID</span>
                    <span className="font-mono text-sm">{paymentStatus.paymentId}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCheckStatus(paymentStatus.paymentId)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Check Status
                    </button>
                    <button
                      onClick={() => handleRefund(paymentStatus.paymentId)}
                      className="flex-1 bg-orange-100 text-orange-700 py-2 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                    >
                      Refund
                    </button>
                  </div>
                </div>
              )}

              {paymentStatus.refundResult && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">Refund Status</h3>
                  <pre className="text-xs text-orange-700">{JSON.stringify(paymentStatus.refundResult, null, 2)}</pre>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  View Full Response
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(paymentStatus, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No payment processed yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Supported Gateways */}
      {supportedGateways && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Supported Payment Gateways</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {supportedGateways.gateways?.map((gateway) => (
              <div key={gateway} className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="font-semibold text-gray-800 capitalize">{gateway}</div>
                <div className="text-xs text-gray-500 mt-1">Available</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}