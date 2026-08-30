import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ecommerceBusinessSalesAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Building2,
  FileText,
  HeartHandshake,
  TrendingUp,
  Package,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

/**
 * AFRERA B2B Marketplace
 *
 * Business-to-business commerce: bulk orders, contract farming, quotations,
 * sales analytics. Backed by ecommerceBusinessSalesAPI (real backend at
 * backend/src/services/legacy/ecommerceBusinessSalesService.js).
 *
 * Honesty note: the API only exposes create/submit/accept/calculate actions
 * for bulk orders, contracts and quotations — there is no list/read endpoint
 * for "my bulk orders", "active contracts" or "pending quotations". Earlier
 * versions of this page filled those gaps with fabricated placeholder rows
 * ("Bulk Order #1", "Rice (Basmati)", made-up statuses/amounts) presented as
 * if real. That's been removed — each form now submits to the real endpoint
 * and shows an honest success/error state instead of a fake history list.
 */

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className={`bg-v42-paddy border border-v42-line rounded-lg shadow p-6 border-l-4 ${accent}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-v42-mut">{label}</p>
        <p className="text-2xl font-bold text-v42-ink">{value}</p>
      </div>
      <Icon className="h-8 w-8 text-v42-forest" />
    </div>
  </div>
);

const FieldLabel = ({ children }) => (
  <label className="block text-sm font-medium text-v42-ink2 mb-1">{children}</label>
);

const fieldClass = 'w-full p-2 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric';

const SuccessNote = ({ children }) => (
  <div className="flex items-start gap-2 rounded-lg border border-v42-forest/30 bg-v42-forest/10 p-3 text-sm text-v42-forestd">
    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
    <span>{children}</span>
  </div>
);

const B2BMarketplace = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: salesAnalytics, isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ['salesAnalytics'],
    queryFn: () => ecommerceBusinessSalesAPI.getSalesAnalytics({}).then((r) => r.data),
  });

  const { data: conversionMetrics } = useQuery({
    queryKey: ['conversionMetrics'],
    queryFn: () => ecommerceBusinessSalesAPI.getB2BConversionMetrics(30).then((r) => r.data),
  });

  // Bulk order form
  const [bulkForm, setBulkForm] = useState({ productId: '', quantity: '', deliveryDate: '', budget: '' });
  const bulkMutation = useMutation({
    mutationFn: () =>
      ecommerceBusinessSalesAPI.createBulkOrder({
        product_id: bulkForm.productId,
        quantity: Number(bulkForm.quantity),
        delivery_date: bulkForm.deliveryDate,
        budget: Number(bulkForm.budget),
      }),
    onSuccess: () => {
      toast.success('Bulk order request submitted');
      setBulkForm({ productId: '', quantity: '', deliveryDate: '', budget: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to submit bulk order'),
  });

  // Contract farming form
  const [contractForm, setContractForm] = useState({ cropType: 'Wheat', duration: '', targetProduction: '', pricePerTon: '' });
  const contractMutation = useMutation({
    mutationFn: () =>
      ecommerceBusinessSalesAPI.createContractFarming({
        crop_type: contractForm.cropType,
        duration_months: Number(contractForm.duration),
        target_production_tons: Number(contractForm.targetProduction),
        price_per_ton: Number(contractForm.pricePerTon),
      }),
    onSuccess: () => {
      toast.success('Contract farming request submitted');
      setContractForm({ cropType: 'Wheat', duration: '', targetProduction: '', pricePerTon: '' });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to create contract'),
  });

  // Accept quotation
  const [quotationId, setQuotationId] = useState('');
  const acceptMutation = useMutation({
    mutationFn: () => ecommerceBusinessSalesAPI.acceptQuotation(quotationId),
    onSuccess: () => {
      toast.success('Quotation accepted');
      setQuotationId('');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to accept quotation'),
  });

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={DollarSign} label="Total Revenue" accent="border-v42-forest"
          value={salesLoading ? '…' : `₹${Number(salesAnalytics?.total_revenue || 0).toLocaleString()}`} />
        <StatCard icon={Package} label="Bulk Orders" accent="border-v42-turmeric"
          value={salesLoading ? '…' : (salesAnalytics?.bulk_orders_count || 0)} />
        <StatCard icon={HeartHandshake} label="Active Contracts" accent="border-v42-indigo"
          value={salesLoading ? '…' : (salesAnalytics?.active_contracts || 0)} />
        <StatCard icon={TrendingUp} label="Conversion Rate" accent="border-v42-chilli"
          value={conversionMetrics?.conversion_rate != null ? `${conversionMetrics.conversion_rate.toFixed(1)}%` : '—'} />
      </div>

      {salesError && (
        <div className="rounded-lg border border-v42-chilli/30 bg-v42-chilli/10 p-4 text-sm text-v42-chilli">
          Couldn't load sales analytics: {salesError.message}. This section requires being signed in with a business account.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-v42-ink">
            <Building2 className="h-5 w-5" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button onClick={() => setActiveTab('bulkorders')}
              className="w-full bg-v42-forest text-v42-paddy py-2 px-4 rounded-lg hover:bg-v42-forestd transition flex items-center justify-center gap-2">
              <Package className="h-4 w-4" />
              Create Bulk Order
            </button>
            <button onClick={() => setActiveTab('contractfarming')}
              className="w-full bg-v42-indigo text-white py-2 px-4 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2">
              <HeartHandshake className="h-4 w-4" />
              Create Contract Farming
            </button>
            <button onClick={() => setActiveTab('quotations')}
              className="w-full border-2 border-v42-turmeric text-v42-turmericink py-2 px-4 rounded-lg hover:bg-v42-turmerictint transition flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              Manage Quotations
            </button>
          </div>
        </div>

        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-v42-ink">
            <TrendingUp className="h-5 w-5" />
            Sales Performance
          </h3>
          {salesLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-v42-paddy2 rounded" />)}
            </div>
          ) : salesAnalytics ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-v42-paddy2 rounded">
                <span className="text-v42-mut">Total Orders</span>
                <span className="font-semibold text-v42-ink">{salesAnalytics.total_orders}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-v42-paddy2 rounded">
                <span className="text-v42-mut">Average Order Value</span>
                <span className="font-semibold text-v42-ink">₹{salesAnalytics.avg_order_value?.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-v42-paddy2 rounded">
                <span className="text-v42-mut">Total Buyers</span>
                <span className="font-semibold text-v42-ink">{salesAnalytics.total_buyers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-v42-paddy2 rounded">
                <span className="text-v42-mut">Total Sellers</span>
                <span className="font-semibold text-v42-ink">{salesAnalytics.total_sellers}</span>
              </div>
            </div>
          ) : (
            <p className="text-v42-mut">No data available</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderBulkOrders = () => (
    <div className="space-y-6">
      <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-v42-ink">
          <Package className="h-5 w-5" />
          Bulk Order Management
        </h3>

        <form
          onSubmit={(e) => { e.preventDefault(); bulkMutation.mutate(); }}
          className="p-4 bg-v42-paddy2 rounded-lg mb-4"
        >
          <h4 className="font-medium mb-3 text-v42-ink">Create New Bulk Order</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <FieldLabel>Product ID</FieldLabel>
              <input required value={bulkForm.productId} onChange={(e) => setBulkForm({ ...bulkForm, productId: e.target.value })}
                placeholder="Enter Product ID" className={fieldClass} />
            </div>
            <div>
              <FieldLabel>Quantity (kg)</FieldLabel>
              <input required type="number" min="1" value={bulkForm.quantity} onChange={(e) => setBulkForm({ ...bulkForm, quantity: e.target.value })}
                placeholder="Enter bulk quantity" className={fieldClass} />
            </div>
            <div>
              <FieldLabel>Delivery Date</FieldLabel>
              <input required type="date" value={bulkForm.deliveryDate} onChange={(e) => setBulkForm({ ...bulkForm, deliveryDate: e.target.value })}
                className={fieldClass} />
            </div>
            <div>
              <FieldLabel>Budget (₹)</FieldLabel>
              <input required type="number" min="1" value={bulkForm.budget} onChange={(e) => setBulkForm({ ...bulkForm, budget: e.target.value })}
                placeholder="Enter budget" className={fieldClass} />
            </div>
          </div>
          <button type="submit" disabled={bulkMutation.isPending}
            className="w-full bg-v42-forest text-v42-paddy py-2 px-4 rounded-lg hover:bg-v42-forestd transition disabled:opacity-60">
            {bulkMutation.isPending ? 'Submitting…' : 'Submit Bulk Order Request'}
          </button>
        </form>

        {bulkMutation.isSuccess && (
          <SuccessNote>
            Your bulk order request was submitted. Sellers who can fulfil it will send quotations —
            check the Quotations tab to review and accept offers.
          </SuccessNote>
        )}
      </div>
    </div>
  );

  const renderContractFarming = () => (
    <div className="space-y-6">
      <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-v42-ink">
          <HeartHandshake className="h-5 w-5" />
          Contract Farming
        </h3>

        <form
          onSubmit={(e) => { e.preventDefault(); contractMutation.mutate(); }}
          className="p-4 bg-v42-paddy2 rounded-lg mb-4"
        >
          <h4 className="font-medium mb-3 text-v42-ink">Create New Contract</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <FieldLabel>Crop Type</FieldLabel>
              <select value={contractForm.cropType} onChange={(e) => setContractForm({ ...contractForm, cropType: e.target.value })} className={fieldClass}>
                <option>Wheat</option>
                <option>Rice</option>
                <option>Cotton</option>
                <option>Sugarcane</option>
              </select>
            </div>
            <div>
              <FieldLabel>Contract Duration (months)</FieldLabel>
              <input required type="number" min="1" value={contractForm.duration} onChange={(e) => setContractForm({ ...contractForm, duration: e.target.value })}
                placeholder="Enter duration" className={fieldClass} />
            </div>
            <div>
              <FieldLabel>Target Production (tons)</FieldLabel>
              <input required type="number" min="1" value={contractForm.targetProduction} onChange={(e) => setContractForm({ ...contractForm, targetProduction: e.target.value })}
                placeholder="Enter target production" className={fieldClass} />
            </div>
            <div>
              <FieldLabel>Price per ton (₹)</FieldLabel>
              <input required type="number" min="1" value={contractForm.pricePerTon} onChange={(e) => setContractForm({ ...contractForm, pricePerTon: e.target.value })}
                placeholder="Enter price" className={fieldClass} />
            </div>
          </div>
          <button type="submit" disabled={contractMutation.isPending}
            className="w-full bg-v42-indigo text-white py-2 px-4 rounded-lg hover:opacity-90 transition disabled:opacity-60">
            {contractMutation.isPending ? 'Submitting…' : 'Create Contract'}
          </button>
        </form>

        {contractMutation.isSuccess && (
          <SuccessNote>
            Contract farming request created. You'll be notified once a grower accepts the terms.
          </SuccessNote>
        )}
      </div>
    </div>
  );

  const renderQuotations = () => (
    <div className="space-y-6">
      <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-v42-ink">
          <FileText className="h-5 w-5" />
          Quotation Management
        </h3>

        <p className="text-sm text-v42-mut mb-4">
          Sellers submit quotations against your bulk order requests. When you have a quotation ID
          from a seller's offer, accept it here to convert it into an order.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); acceptMutation.mutate(); }}
          className="flex gap-2"
        >
          <input required value={quotationId} onChange={(e) => setQuotationId(e.target.value)}
            placeholder="Enter Quotation ID" className={fieldClass} />
          <button type="submit" disabled={acceptMutation.isPending}
            className="px-4 py-2 bg-v42-forest text-v42-paddy rounded-lg hover:bg-v42-forestd transition disabled:opacity-60 whitespace-nowrap">
            {acceptMutation.isPending ? 'Accepting…' : 'Accept Quotation'}
          </button>
        </form>

        {acceptMutation.isSuccess && (
          <div className="mt-4"><SuccessNote>Quotation accepted and converted into an order.</SuccessNote></div>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-v42-ink">
          <TrendingUp className="h-5 w-5" />
          Sales Analytics
        </h3>

        {salesLoading ? (
          <p className="text-v42-mut">Loading analytics...</p>
        ) : salesAnalytics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-v42-paddy2 rounded-lg">
                <h4 className="font-medium mb-2 text-v42-ink">Revenue Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-v42-mut">Bulk Orders</span><span className="font-semibold text-v42-ink">₹{(salesAnalytics.bulk_revenue || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-v42-mut">Contract Farming</span><span className="font-semibold text-v42-ink">₹{(salesAnalytics.contract_revenue || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-v42-mut">Regular Orders</span><span className="font-semibold text-v42-ink">₹{(salesAnalytics.regular_revenue || 0).toLocaleString()}</span></div>
                </div>
              </div>

              <div className="p-4 bg-v42-paddy2 rounded-lg">
                <h4 className="font-medium mb-2 text-v42-ink">Order Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-v42-mut">Total Orders</span><span className="font-semibold text-v42-ink">{salesAnalytics.total_orders}</span></div>
                  <div className="flex justify-between"><span className="text-v42-mut">Avg Order Value</span><span className="font-semibold text-v42-ink">₹{salesAnalytics.avg_order_value?.toFixed(0)}</span></div>
                  <div className="flex justify-between"><span className="text-v42-mut">Order Success Rate</span><span className="font-semibold text-v42-ink">{((salesAnalytics.success_rate || 0) * 100).toFixed(1)}%</span></div>
                </div>
              </div>

              <div className="p-4 bg-v42-paddy2 rounded-lg">
                <h4 className="font-medium mb-2 text-v42-ink">Customer Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-v42-mut">Total Buyers</span><span className="font-semibold text-v42-ink">{salesAnalytics.total_buyers}</span></div>
                  <div className="flex justify-between"><span className="text-v42-mut">Total Sellers</span><span className="font-semibold text-v42-ink">{salesAnalytics.total_sellers}</span></div>
                  <div className="flex justify-between"><span className="text-v42-mut">Active Contracts</span><span className="font-semibold text-v42-ink">{salesAnalytics.active_contracts}</span></div>
                </div>
              </div>
            </div>

            {conversionMetrics && (
              <div className="p-4 bg-v42-turmerictint/40 rounded-lg">
                <h4 className="font-medium mb-2 text-v42-ink">Conversion Metrics (30 Days)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-v42-mut">Conversion Rate:</span> <span className="font-semibold text-v42-ink">{conversionMetrics.conversion_rate?.toFixed(1)}%</span></div>
                  <div><span className="text-v42-mut">Quote to Order:</span> <span className="font-semibold text-v42-ink">{conversionMetrics.quote_to_order_rate?.toFixed(1)}%</span></div>
                  <div><span className="text-v42-mut">Avg Response Time:</span> <span className="font-semibold text-v42-ink">{conversionMetrics.avg_response_time}h</span></div>
                  <div><span className="text-v42-mut">Repeat Buyers:</span> <span className="font-semibold text-v42-ink">{conversionMetrics.repeat_buyer_rate?.toFixed(1)}%</span></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-v42-mut">No data available</p>
        )}
      </div>
    </div>
  );

  const tabs = [
    ['overview', 'Overview'],
    ['bulkorders', 'Bulk Orders'],
    ['contractfarming', 'Contract Farming'],
    ['quotations', 'Quotations'],
    ['analytics', 'Analytics'],
  ];

  return (
    <div className="min-h-screen bg-v42-paddy2 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-v42-ink flex items-center gap-3">
            <Building2 className="h-8 w-8 text-v42-forest" />
            B2B Marketplace
          </h1>
          <p className="text-v42-mut mt-2">
            Business-to-business commerce with bulk orders and contract farming
          </p>
        </div>

        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow mb-6">
          <div className="flex gap-4 border-b border-v42-line overflow-x-auto">
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`px-4 py-3 font-medium whitespace-nowrap ${activeTab === id ? 'border-b-2 border-v42-forest text-v42-forestd' : 'text-v42-mut hover:text-v42-ink'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'bulkorders' && renderBulkOrders()}
          {activeTab === 'contractfarming' && renderContractFarming()}
          {activeTab === 'quotations' && renderQuotations()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
    </div>
  );
};

export default B2BMarketplace;
