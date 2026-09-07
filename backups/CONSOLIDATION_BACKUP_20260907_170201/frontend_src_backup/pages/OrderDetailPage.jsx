import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Package, MapPin } from 'lucide-react'
import { ordersAPI } from '../services/api'

/**
 * Order confirmation / detail — real gap found while tracing the checkout
 * chain end-to-end (see docs/registry/ROUTE_RECONCILIATION.md): the backend
 * GET /orders/:id has existed all along, but no frontend route or page ever
 * called it. A customer completing checkout had nowhere to land and no way
 * to look up an order afterward.
 */
const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function OrderDetailPage() {
  const { id } = useParams()

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersAPI.getOrder(id).then((r) => r.data),
  })

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16 text-center text-gray-600">Loading order…</div>
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Order not found</h2>
        <p className="text-gray-600 mb-4">{error?.response?.data?.error || 'This order could not be loaded.'}</p>
        <Link to="/dashboard" className="text-green-700 underline">Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-2 text-green-700 mb-2">
        <CheckCircle2 className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
      </div>
      <p className="text-gray-600 mb-6">Status: <span className="font-medium">{STATUS_LABEL[order.status] || order.status}</span></p>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <Package className="w-5 h-5" /> Items
        </h2>
        <div className="space-y-3">
          {(order.items || []).map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.product_name} × {item.quantity}</span>
              <span className="font-medium">₹{Number(item.total_price).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax (GST)</span><span>₹{Number(order.tax_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span><span>₹{Number(order.shipping_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-gray-800 pt-1">
            <span>Total</span><span>₹{Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {order.shipping_line1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <MapPin className="w-5 h-5" /> Shipping to
          </h2>
          <p className="text-sm text-gray-600">
            {order.shipping_line1}, {order.shipping_city}, {order.shipping_state} {order.shipping_pincode}
          </p>
        </div>
      )}
    </div>
  )
}

export default OrderDetailPage
