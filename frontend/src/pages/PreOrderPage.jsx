import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { farmersAPI } from '../services/api'
import { Package, Clock, Plus, Info } from 'lucide-react'
import toast from 'react-hot-toast'

function PreOrderPage() {
  const [selectedPreOrder, setSelectedPreOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const queryClient = useQueryClient()

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: preOrders } = useQuery({
    queryKey: ['pre-orders'],
    queryFn: () => farmersAPI.getPreOrders('current-farmer-id').then(r => r.data),
  })

  const { data: availableProducts } = useQuery({
    queryKey: ['preorder-products'],
    queryFn: () => farmersAPI.getPreOrderProducts().then(r => r.data),
  })

  const createPreOrderMutation = useMutation({
    mutationFn: (data) => farmersAPI.createPreOrder(data),
    onSuccess: () => {
      toast.success('Pre-order created successfully!')
      queryClient.invalidateQueries({ queryKey: ['pre-orders'] })
      setShowOrderModal(false)
    },
    onError: () => {
      toast.error('Failed to create pre-order')
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Pre-Orders</h1>
        <p className="text-gray-600">Secure future harvests with advance bookings and guaranteed prices</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <div className="font-medium text-blue-800 mb-1">How Pre-Orders Work</div>
            <p className="text-sm text-blue-700">
              Book your harvest in advance with guaranteed pricing. Secure buyers before planting and reduce market risk.
            </p>
          </div>
        </div>
      </div>

      {/* Active Pre-Orders */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Your Pre-Orders</h2>
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Pre-Order
          </button>
        </div>

        <div className="space-y-4">
          {preOrders?.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{order.crop}</h3>
                  <p className="text-sm text-gray-500">{order.variety}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Quantity</div>
                  <div className="font-medium">{order.quantity} quintals</div>
                </div>
                <div>
                  <div className="text-gray-600">Guaranteed Price</div>
                  <div className="font-medium text-green-600">₹{order.price}/q</div>
                </div>
                <div>
                  <div className="text-gray-600">Expected Harvest</div>
                  <div className="font-medium">{order.harvest_date}</div>
                </div>
                <div>
                  <div className="text-gray-600">Buyer</div>
                  <div className="font-medium">{order.buyer}</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {order.days_remaining} days to harvest
                </div>
                <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No active pre-orders. Create your first pre-order to secure buyers.</p>
            </div>
          )}
        </div>
      </div>

      {/* Available Pre-Order Opportunities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Opportunities</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableProducts?.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{product.crop}</h3>
                  <p className="text-sm text-gray-500">{product.buyer_type}</p>
                </div>
                {product.urgent && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    Urgent
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Required Qty</span>
                  <span className="font-medium">{product.required_quantity}q</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Offer Price</span>
                  <span className="font-medium text-green-600">₹{product.offer_price}/q</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery By</span>
                  <span className="font-medium">{product.delivery_date}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPreOrder(product)
                  setShowOrderModal(true)
                }}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                Apply for Pre-Order
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Pre-Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedPreOrder ? 'Apply for Pre-Order' : 'Create Pre-Order'}
                </h2>
                <button
                  onClick={() => {
                    setShowOrderModal(false)
                    setSelectedPreOrder(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crop *
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select crop</option>
                    <option value="rice">Rice</option>
                    <option value="wheat">Wheat</option>
                    <option value="mustard">Mustard</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity (quintals) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Harvest Date *
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Price (₹/quintal) *
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality Specifications
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Describe expected quality, variety, etc."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrderModal(false)
                      setSelectedPreOrder(null)
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Submit Pre-Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PreOrderPage