import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersAPI } from '../services/api'
import { MapPin, CreditCard, Truck } from 'lucide-react'
import toast from 'react-hot-toast'

function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [shippingAddress, setShippingAddress] = useState({
    address_line1: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('cod')

  // NOTE: this page was calling useQuery/useMutation with the removed v3/v4
  // tuple signature (`useQuery('cart', fn)`) against an installed v5
  // @tanstack/react-query, which only supports the object form — the page
  // threw on render. Also `ordersAPI.getCart()` returns the axios response
  // object, not the cart directly; `.then(r => r.data)` was missing.
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => ordersAPI.getCart().then((r) => r.data),
  })

  const createOrderMutation = useMutation({
    mutationFn: ordersAPI.createOrder,
    onSuccess: (res) => {
      toast.success('Order created successfully')
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      navigate(`/orders/${res.data.id}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create order')
    },
  })

  const handleAddressSubmit = (e) => {
    e.preventDefault()
    setStep(2)
  }

  const handlePaymentSubmit = (e) => {
    e.preventDefault()
    createOrderMutation.mutate({
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
    })
  }

  const { items, total_amount } = cartData || { items: [], total_amount: 0 }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-600">Add items to your cart before checkout</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Shipping Address */}
          <div className={`bg-white rounded-lg shadow p-6 ${step !== 1 ? 'opacity-50' : ''}`}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Shipping Address
            </h2>
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.address_line1}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="House No, Street, Area"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="City"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.pincode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Pincode"
                  />
                </div>
              </div>
              {step === 1 && (
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Continue to Payment
                </button>
              )}
            </form>
          </div>

          {/* Step 2: Payment Method */}
          <div className={`bg-white rounded-lg shadow p-6 ${step !== 2 ? 'opacity-50' : ''}`}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Method
            </h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-800">Cash on Delivery</div>
                    <div className="text-sm text-gray-500">Pay when you receive your order</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-800">UPI Payment</div>
                    <div className="text-sm text-gray-500">Pay using any UPI app</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-800">Credit/Debit Card</div>
                    <div className="text-sm text-gray-500">Pay using your card</div>
                  </div>
                </label>
              </div>
              {step === 2 && (
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.product_name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800 line-clamp-2">
                      {item.product_name}
                    </div>
                    <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                    <div className="text-sm font-semibold text-gray-800">₹{item.total_price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>{total_amount > 1500 ? 'FREE' : '₹60.00'}</span>
              </div>
              <p className="text-xs text-gray-500 pt-1">
                GST is calculated per item (varies by product/HSN code) and shown on your order
                confirmation — not included in this subtotal preview.
              </p>
            </div>

            <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
              <Truck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Estimated delivery: 3-5 business days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
