import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorsAPI } from '../services/api'
import { Building2, ShoppingCart, TrendingUp, CheckCircle, FileText, Truck, DollarSign, Users, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/common/Modal'

function CorporateBuyerPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const queryClient = useQueryClient()

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: buyerProfile } = useQuery({
    queryKey: ['buyer-profile'],
    queryFn: () => vendorsAPI.getBuyerProfile('current-buyer-id').then(r => r.data),
  })

  const { data: creditStatus } = useQuery({
    queryKey: ['credit-status'],
    queryFn: () => vendorsAPI.getCreditStatus('current-buyer-id').then(r => r.data),
  })

  const { data: activeOrders } = useQuery({
    queryKey: ['active-orders'],
    queryFn: () => vendorsAPI.getActiveOrders('current-buyer-id').then(r => r.data),
  })

  const createOrderMutation = useMutation({
    mutationFn: (data) => vendorsAPI.createCorporateOrder(data),
    onSuccess: () => {
      toast.success('Order created successfully')
      queryClient.invalidateQueries({ queryKey: ['active-orders'] })
      setShowOrderModal(false)
    },
    onError: () => {
      toast.error('Failed to create order')
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Corporate Buyer Portal</h1>
        <p className="text-gray-600">Bulk procurement with NET terms and credit facilities</p>
      </div>

      {/* Credit Status Banner */}
      {creditStatus && (
        <div className={`rounded-lg p-4 mb-6 ${
          creditStatus.term === 'net60' ? 'bg-green-50 border border-green-200' :
          creditStatus.term === 'net30' ? 'bg-blue-50 border border-blue-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className={`w-6 h-6 mr-3 ${
                creditStatus.term === 'net60' ? 'text-green-600' :
                creditStatus.term === 'net30' ? 'text-blue-600' :
                'text-gray-600'
              }`} />
              <div>
                <div className="font-semibold text-gray-800">Credit Status: {creditStatus.term.toUpperCase()}</div>
                <div className="text-sm text-gray-600">{creditStatus.why}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{creditStatus.days} days</div>
              <div className="text-sm text-gray-600">Payment terms</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'orders', label: 'Orders', icon: ShoppingCart },
          { id: 'catalog', label: 'Product Catalog', icon: Package },
          { id: 'logistics', label: 'Logistics', icon: Truck },
          { id: 'reports', label: 'Reports', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <ShoppingCart className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-500">This Month</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {activeOrders?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Active Orders</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-500">Q3 2026</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ₹{(buyerProfile?.total_spent || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-500">Suppliers</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {buyerProfile?.supplier_count || 0}
              </div>
              <div className="text-sm text-gray-600">Active Suppliers</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <span className="text-sm text-gray-500">YTD</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(buyerProfile?.ytd_savings || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Bulk Savings</div>
            </div>
          </div>

          {/* MOQ Tiers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Bulk Pricing Tiers</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { min: 0, max: 299, discount: 0, label: 'Starter' },
                { min: 300, max: 999, discount: 5, label: 'Bronze' },
                { min: 1000, max: 4999, discount: 10, label: 'Silver' },
                { min: 5000, max: 99999, discount: 15, label: 'Gold' }
              ].map((tier) => (
                <div key={tier.label} className="border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-800 mb-2">{tier.discount}%</div>
                  <div className="text-sm text-gray-600 mb-1">Discount</div>
                  <div className="text-xs text-gray-500">
                    {tier.min}-{tier.max === 99999 ? '+' : tier.max} kg
                  </div>
                  <div className="text-xs font-medium text-gray-700 mt-2">{tier.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Terms */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Credit Terms Available</h2>
            <div className="space-y-3">
              {[
                { term: 'NET 0', days: 0, desc: 'Pay on delivery - for new accounts' },
                { term: 'NET 30', days: 30, desc: '30 days credit - requires ₹1Cr+ turnover' },
                { term: 'NET 60', days: 60, desc: '60 days credit - requires ₹5Cr+ turnover & 3+ years vintage' }
              ].map((term) => (
                <div
                  key={term.term}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    creditStatus?.term === term.term.toLowerCase()
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-gray-800">{term.term}</div>
                    <div className="text-sm text-gray-600">{term.desc}</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{term.days} days</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Active Orders</h2>
            <button
              onClick={() => setShowOrderModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              Create New Order
            </button>
          </div>

          <div className="space-y-4">
            {activeOrders?.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{order.product}</h3>
                    <p className="text-sm text-gray-500">Order #{order.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Quantity</div>
                    <div className="font-medium">{order.quantity} kg</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Unit Price</div>
                    <div className="font-medium">₹{order.unit_price}/kg</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Total Value</div>
                    <div className="font-medium">₹{order.total_value.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Delivery By</div>
                    <div className="font-medium">{order.delivery_date}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-end space-x-3">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                    View Details
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    Track Order
                  </button>
                </div>
              </div>
            )) || (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Active Orders</h3>
                <p className="text-gray-600 mb-4">Create your first bulk order to get started</p>
                <button
                  onClick={() => setShowOrderModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Create Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showOrderModal && (
        <Modal onClose={() => setShowOrderModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Create Bulk Order</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select id="product" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select product</option>
                    <option value="rice">Rice</option>
                    <option value="wheat">Wheat</option>
                    <option value="mustard">Mustard</option>
                    <option value="turmeric">Turmeric</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity-kg" className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity (kg) *
                    </label>
                    <input id="quantity-kg"
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="delivery-date" className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Date *
                    </label>
                    <input id="delivery-date"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                    Destination *
                  </label>
                  <select id="destination" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select destination</option>
                    <option value="ncr">NCR (Delhi NCR)</option>
                    <option value="guwahati">Guwahati</option>
                    <option value="kolkata">Kolkata</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Create Order
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

export default CorporateBuyerPage