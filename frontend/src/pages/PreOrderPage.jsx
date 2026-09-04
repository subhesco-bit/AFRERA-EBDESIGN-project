import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preSeasonAPI } from '../services/api';
import { Package, Clock, Plus, Info, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';

const emptyForm = {
  productId: '', productCategory: '', quantityRequired: '', qualitySpecifications: '',
  deliveryLocation: '', deliveryDate: '', priceOffered: '', paymentTerms: '',
  contractDurationDays: '', buyerType: 'household', escrowRequired: false,
};

// Real backend: backend/src/services/legacy/preSeasonOrderService.js, mounted
// directly in backend/src/index.js (not via the dead ORPHANED_SERVICES_MOUNT.js
// snippet) at /api/v1/pre-season/*. Matches frontend/src/services/api.js's
// preSeasonAPI. The previous version of this page called
// farmersAPI.getPreOrders/getPreOrderProducts/createPreOrder, none of which
// exist on farmersAPI - a fully broken page whose "Your Pre-Orders" and
// "Available Opportunities" lists silently rendered as empty because the
// underlying calls threw, and whose "Submit Pre-Order" button had no
// onSubmit handler at all.
//
// getContractDashboard (GET /pre-season/dashboard) is the one real read
// endpoint here; its aggregate fields (active_contracts, upcoming_deliveries,
// contract_opportunities, etc.) are honest stubs in this service today - they
// return 0 / [] rather than invented numbers, and we render them as-is. There
// is no dedicated "browse open pre-season orders" endpoint, so the
// Opportunities section reflects contract_opportunities from the dashboard
// call rather than a fabricated marketplace feed.
//
// No authenticated "current user" store exists in this codebase's frontend
// yet (see BulkOrderPage.jsx's identical note), so the buyer ID is entered
// manually until real auth wiring exists.
function PreOrderPage() {
  const queryClient = useQueryClient();
  const [buyerId, setBuyerId] = useState('');
  const [buyerType, setBuyerType] = useState('household');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: dashboard, isLoading, error, refetch } = useQuery({
    queryKey: ['pre-season-dashboard', buyerId, buyerType],
    queryFn: async () => (await preSeasonAPI.getDashboard({ user_id: buyerId, user_type: buyerType })).data?.data ?? null,
    enabled: Boolean(buyerId),
  });

  const createOrderMutation = useMutation({
    mutationFn: (payload) => preSeasonAPI.createOrder(payload),
    onSuccess: () => {
      toast.success('Pre-season order submitted.');
      queryClient.invalidateQueries({ queryKey: ['pre-season-dashboard', buyerId, buyerType] });
      setShowOrderModal(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err?.response?.data?.error || err.message || 'Failed to submit pre-season order'),
  });

  const submitOrder = (e) => {
    e.preventDefault();
    if (!buyerId) { toast.error('Enter your buyer ID first'); return; }
    if (!form.productId || !form.quantityRequired || !form.deliveryDate || !form.priceOffered) {
      toast.error('Product, quantity, delivery date and offered price are required');
      return;
    }
    createOrderMutation.mutate({
      buyer_id: buyerId,
      buyer_type: form.buyerType,
      product_id: form.productId,
      product_category: form.productCategory || undefined,
      quantity_required: Number(form.quantityRequired),
      quality_specifications: form.qualitySpecifications || undefined,
      delivery_location: form.deliveryLocation || undefined,
      delivery_date: form.deliveryDate,
      price_offered: Number(form.priceOffered),
      payment_terms: form.paymentTerms || undefined,
      contract_duration: form.contractDurationDays ? Number(form.contractDurationDays) : undefined,
      escrow_required: form.escrowRequired,
    });
  };

  const opportunities = dashboard?.contract_opportunities || [];
  const deliveries = dashboard?.upcoming_deliveries || [];
  const alerts = dashboard?.contract_alerts || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Pre-Season Orders</h1>
        <p className="text-gray-600">Book future harvests in advance through contract-farming agreements with escrow-backed milestones.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <div className="font-medium text-blue-800 mb-1">How pre-season orders work</div>
            <p className="text-sm text-blue-700">
              A buyer (household, institutional, cooperative or government) places a pre-season order for a
              product, quantity and delivery date. Farmers submit bids against it; the buyer selects a bid and,
              if escrow is requested, funds are held against agreed delivery milestones.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Your buyer ID</label>
            <input
              type="text"
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              placeholder="Enter your buyer ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buyer type</label>
            <select
              value={buyerType}
              onChange={(e) => setBuyerType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="household">Household</option>
              <option value="institutional">Institutional / corporate</option>
              <option value="cooperative">Cooperative</option>
              <option value="government">Government</option>
            </select>
          </div>
          <div className="sm:col-span-1 flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={!buyerId}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              Load
            </button>
            <button
              onClick={() => setShowOrderModal(true)}
              disabled={!buyerId}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />New Order
            </button>
          </div>
        </div>
      </div>

      {!buyerId && (
        <div className="text-center py-10 text-gray-500">Enter a buyer ID above to see your pre-season order dashboard.</div>
      )}

      {buyerId && (
        <>
          {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg mb-6" />}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
              Error loading pre-season dashboard: {error.message}
            </div>
          )}

          {!isLoading && !error && dashboard && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">Active contracts</div>
                  <div className="text-2xl font-bold text-gray-900">{dashboard.active_contracts ?? 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">Pending milestones</div>
                  <div className="text-2xl font-bold text-gray-900">{dashboard.pending_milestones ?? 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">Total contract value</div>
                  <div className="text-2xl font-bold text-gray-900">₹{Number(dashboard.total_contract_value || 0).toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600">Upcoming deliveries</div>
                  <div className="text-2xl font-bold text-gray-900">{deliveries.length}</div>
                </div>
              </div>

              {alerts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-800 mb-1">Contract alerts</div>
                      <ul className="text-sm text-amber-700 list-disc pl-5">
                        {alerts.map((a, i) => <li key={i}>{typeof a === 'string' ? a : JSON.stringify(a)}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming deliveries</h2>
                {deliveries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No upcoming deliveries on active contracts.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deliveries.map((d, i) => (
                      <div key={d.id || i} className="border rounded-lg p-4 flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {JSON.stringify(d)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Contract-farming opportunities</h2>
                {opportunities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No open contract-farming opportunities to bid on right now. Check back after buyers place new pre-season orders.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {opportunities.map((o, i) => (
                      <div key={o.id || i} className="border rounded-lg p-4 text-sm text-gray-700">
                        {JSON.stringify(o)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {showOrderModal && (
        <Modal onClose={() => setShowOrderModal(false)}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">New Pre-Season Order</h2>
                <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <form onSubmit={submitOrder} className="space-y-4">
                <div>
                  <label htmlFor="buyer-type" className="block text-sm font-medium text-gray-700 mb-1">Buyer type *</label>
                  <select id="buyer-type" value={form.buyerType}
                    onChange={(e) => setForm({ ...form, buyerType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                    <option value="household">Household</option>
                    <option value="institutional">Institutional / corporate</option>
                    <option value="cooperative">Cooperative</option>
                    <option value="government">Government</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="product-id" className="block text-sm font-medium text-gray-700 mb-1">Product ID *</label>
                  <input id="product-id" value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                </div>

                <div>
                  <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 mb-1">Product category</label>
                  <input id="product-category" value={form.productCategory}
                    onChange={(e) => setForm({ ...form, productCategory: e.target.value })}
                    placeholder="e.g. rice, wheat, mustard"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity-required" className="block text-sm font-medium text-gray-700 mb-1">Quantity required *</label>
                    <input id="quantity-required" type="number" value={form.quantityRequired}
                      onChange={(e) => setForm({ ...form, quantityRequired: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                  </div>
                  <div>
                    <label htmlFor="price-offered" className="block text-sm font-medium text-gray-700 mb-1">Price offered (₹/unit) *</label>
                    <input id="price-offered" type="number" value={form.priceOffered}
                      onChange={(e) => setForm({ ...form, priceOffered: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="delivery-date" className="block text-sm font-medium text-gray-700 mb-1">Delivery date *</label>
                    <input id="delivery-date" type="date" value={form.deliveryDate}
                      onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                  </div>
                  <div>
                    <label htmlFor="contract-duration" className="block text-sm font-medium text-gray-700 mb-1">Contract duration (days)</label>
                    <input id="contract-duration" type="number" value={form.contractDurationDays}
                      onChange={(e) => setForm({ ...form, contractDurationDays: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>

                <div>
                  <label htmlFor="delivery-location" className="block text-sm font-medium text-gray-700 mb-1">Delivery location</label>
                  <input id="delivery-location" value={form.deliveryLocation}
                    onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                  <label htmlFor="payment-terms" className="block text-sm font-medium text-gray-700 mb-1">Payment terms</label>
                  <input id="payment-terms" value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    placeholder="e.g. 30% advance, balance on delivery"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                  <label htmlFor="quality-specifications" className="block text-sm font-medium text-gray-700 mb-1">Quality specifications</label>
                  <textarea id="quality-specifications" rows={3} value={form.qualitySpecifications}
                    onChange={(e) => setForm({ ...form, qualitySpecifications: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Describe expected quality, variety, etc." />
                </div>

                <label className="flex items-center text-sm text-gray-700">
                  <input type="checkbox" checked={form.escrowRequired}
                    onChange={(e) => setForm({ ...form, escrowRequired: e.target.checked })}
                    className="mr-2" />
                  Hold funds in escrow against delivery milestones
                </label>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={createOrderMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                    {createOrderMutation.isPending ? 'Submitting...' : 'Submit Pre-Season Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default PreOrderPage;
