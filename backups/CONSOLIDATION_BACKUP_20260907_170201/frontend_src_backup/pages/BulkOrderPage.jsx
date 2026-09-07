import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, Plus, X, ArrowLeft, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { bulkOrderAPI } from '../services/api'
import Modal from '../components/common/Modal'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  quoted: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
}

const emptyForm = {
  productId: '', quantity: '', expectedDeliveryDate: '', deliveryLocation: '',
  specialRequirements: '', budgetPerUnit: '', contactPerson: '', contactPhone: '', contactEmail: '',
}

// This user's own id. The real backend accepts req.body.userId as a
// fallback when there's no authenticated req.user - see
// bulkOrderController.js createBulkOrderRequest/getUserBulkOrders. No
// dedicated "current user" store exists in this codebase's frontend yet
// (checked), so this is entered manually until real auth wiring exists.
function BulkOrderPage() {
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['bulk-orders', userId],
    // getUserBulkOrders returns {orders, pagination}, not a bare array.
    queryFn: async () => (await bulkOrderAPI.getUserBulkOrders(userId)).data?.data?.orders ?? [],
    enabled: !!userId,
  })

  const { data: selectedOrder } = useQuery({
    queryKey: ['bulk-order', selectedOrderId],
    queryFn: async () => (await bulkOrderAPI.getBulkOrder(selectedOrderId)).data?.data ?? null,
    enabled: !!selectedOrderId,
  })

  const { data: quotations } = useQuery({
    queryKey: ['bulk-order-quotations', selectedOrderId],
    queryFn: async () => (await bulkOrderAPI.getBulkOrderQuotations(selectedOrderId)).data?.data ?? [],
    enabled: !!selectedOrderId,
  })

  const createMutation = useMutation({
    mutationFn: (payload) => bulkOrderAPI.createBulkOrder({ ...payload, userId }),
    onSuccess: () => {
      toast.success('Bulk order request created')
      queryClient.invalidateQueries({ queryKey: ['bulk-orders', userId] })
      setShowForm(false)
      setForm(emptyForm)
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to create bulk order'),
  })

  const acceptMutation = useMutation({
    mutationFn: (quotationId) => bulkOrderAPI.acceptQuotation(quotationId, { userId }),
    onSuccess: () => {
      toast.success('Quotation accepted')
      queryClient.invalidateQueries({ queryKey: ['bulk-order-quotations', selectedOrderId] })
      queryClient.invalidateQueries({ queryKey: ['bulk-order', selectedOrderId] })
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to accept quotation'),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }) => bulkOrderAPI.cancelBulkOrder(orderId, { reason }),
    onSuccess: () => {
      toast.success('Bulk order cancelled')
      queryClient.invalidateQueries({ queryKey: ['bulk-orders', userId] })
      setSelectedOrderId(null)
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to cancel order'),
  })

  const orders = Array.isArray(ordersData) ? ordersData : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Package className="w-6 h-6 mr-2 text-teal-600" />
          Bulk Orders
        </h1>
        <p className="text-gray-600">Request wholesale quantities, review supplier quotations, and confirm orders.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Your user ID</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your user ID to view your bulk orders"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => refetch()}
            disabled={!userId}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            Load
          </button>
          <button
            onClick={() => setShowForm(true)}
            disabled={!userId}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition flex items-center disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />New Request
          </button>
        </div>
      </div>

      {!userId && (
        <div className="text-center py-10 text-gray-500">Enter a user ID above to see bulk order requests.</div>
      )}

      {userId && !selectedOrderId && (
        <>
          {isLoading && <div className="animate-pulse h-40 bg-gray-200 rounded-lg" />}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              Error loading bulk orders: {error.message}
            </div>
          )}
          {!isLoading && !error && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">No bulk order requests yet.</td></tr>}
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">#{o.id}</td>
                      <td className="px-4 py-3 text-gray-700">{o.quantity}</td>
                      <td className="px-4 py-3 text-gray-700">₹{Number(o.estimated_total || 0).toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelectedOrderId(o.id)} className="text-teal-600 hover:underline text-sm font-medium flex items-center ml-auto">
                          <FileText className="w-4 h-4 mr-1" />View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedOrderId && (
        <div>
          <button onClick={() => setSelectedOrderId(null)} className="inline-flex items-center text-sm text-gray-500 hover:text-teal-600 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to bulk orders
          </button>

          {selectedOrder && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Order #{selectedOrder.id}</h2>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[selectedOrder.status] || 'bg-gray-100 text-gray-700'}`}>{selectedOrder.status}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                <div><div className="text-gray-500">Quantity</div><div className="font-medium">{selectedOrder.quantity}</div></div>
                <div><div className="text-gray-500">Delivery Location</div><div className="font-medium">{selectedOrder.delivery_location || '—'}</div></div>
                <div><div className="text-gray-500">Expected Delivery</div><div className="font-medium">{selectedOrder.expected_delivery_date?.slice(0, 10) || '—'}</div></div>
                <div><div className="text-gray-500">Budget/Unit</div><div className="font-medium">₹{selectedOrder.budget_per_unit || '—'}</div></div>
                <div><div className="text-gray-500">Est. Total</div><div className="font-medium">₹{Number(selectedOrder.estimated_total || 0).toLocaleString()}</div></div>
                <div><div className="text-gray-500">Contact</div><div className="font-medium">{selectedOrder.contact_person || '—'}</div></div>
              </div>
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'confirmed' && (
                <button
                  onClick={() => { if (confirm('Cancel this bulk order?')) cancelMutation.mutate({ orderId: selectedOrder.id, reason: 'Cancelled by buyer' }) }}
                  className="text-sm text-red-600 hover:underline flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-1" />Cancel this order
                </button>
              )}
            </div>
          )}

          <h3 className="text-md font-semibold text-gray-800 mb-3">Supplier Quotations</h3>
          <div className="space-y-3">
            {(quotations || []).length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 flex items-center justify-center">
                <Clock className="w-5 h-5 mr-2" />No quotations submitted yet.
              </div>
            )}
            {(quotations || []).map((q) => (
              <div key={q.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-800">₹{q.price_per_unit}/unit — Total ₹{Number(q.total_price || 0).toLocaleString()}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[q.status] || 'bg-gray-100 text-gray-700'}`}>{q.status}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Valid until: {q.valid_until?.slice(0, 10) || '—'}</div>
                  {q.delivery_timeline && <div>Delivery: {q.delivery_timeline}</div>}
                  {q.payment_terms && <div>Payment terms: {q.payment_terms}</div>}
                  {q.terms && <div>Terms: {q.terms}</div>}
                </div>
                {q.status === 'sent' && (
                  <button
                    onClick={() => acceptMutation.mutate(q.id)}
                    disabled={acceptMutation.isPending}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />Accept Quotation
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">New Bulk Order Request</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!form.productId || !form.quantity) { toast.error('Product ID and quantity are required'); return }
                  createMutation.mutate({ ...form, quantity: Number(form.quantity), budgetPerUnit: form.budgetPerUnit ? Number(form.budgetPerUnit) : undefined })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product ID *</label>
                  <input value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget per unit</label>
                    <input type="number" value={form.budgetPerUnit} onChange={(e) => setForm({ ...form, budgetPerUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected delivery date</label>
                  <input type="date" value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery location</label>
                  <input value={form.deliveryLocation} onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special requirements</label>
                  <textarea value={form.specialRequirements} onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" rows="2" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact person</label>
                    <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-60">
                    {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default BulkOrderPage
