import { useAuthStore } from '../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI, ordersAPI, farmersAPI, financialAPI } from '../services/api'
import { ShoppingCart, Package, TrendingUp, DollarSign, Leaf, Award, Sparkles } from 'lucide-react'

function DashboardPage() {
  const { user } = useAuthStore()

  const { data: orders } = useQuery('user-orders', () =>
    ordersAPI.getOrders({}, { page: 1, limit: 5 })
  )

  const { data: creditScore } = useQuery(
    ['credit-score', user?.id],
    () => financialAPI.getCreditScore(user?.id),
    { enabled: !!user?.id && user?.role === 'farmer' }
  )

  const { data: farmerData } = useQuery(
    ['farmer', user?.id],
    () => farmersAPI.getFarmer(user?.id),
    { enabled: !!user?.id && user?.role === 'farmer' }
  )

  const { data: analyticsData } = useQuery('dashboard-analytics', analyticsAPI.getOverview)
  const analytics = analyticsData?.data?.analytics || {
    totals: { forms: 0, submissions: 0, activeForms: 0, draftForms: 0, approvalReady: 0 },
    recommendations: []
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.firstName || user?.email}!
        </h1>
        <p className="text-gray-600">Here's an overview of your account</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <ShoppingCart className="w-8 h-8 text-green-600" />
            <span className="text-sm text-gray-500">Total Orders</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {orders?.pagination?.total || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-blue-600" />
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {orders?.orders?.filter(o => o.status === 'pending').length || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-sm text-gray-500">Completed</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {orders?.orders?.filter(o => o.status === 'delivered').length || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-orange-600" />
            <span className="text-sm text-gray-500">Total Spent</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            ₹{orders?.orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0).toFixed(0) || 0}
          </div>
        </div>
      </div>

      {/* Farmer-specific content */}
      {user?.role === 'farmer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* FDI Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Leaf className="w-5 h-5 mr-2 text-green-600" />
              Farmer Development Index
            </h2>
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl font-bold text-green-600">
                {farmerData?.fdi_score || 0}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Grade</div>
                <div className="text-xl font-semibold text-gray-800">
                  {farmerData?.fdi_grade || 'N/A'}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${farmerData?.fdi_score || 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Advance eligibility: {farmerData?.max_advance_percentage || 0}%
            </p>
          </div>

          {/* Credit Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-blue-600" />
              Credit Score
            </h2>
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl font-bold text-blue-600">
                {creditScore?.score || 0}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Rating</div>
                <div className="text-xl font-semibold text-gray-800">
                  {creditScore?.grade || 'N/A'}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${creditScore?.score || 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Valid until: {creditScore?.valid_until ? new Date(creditScore.valid_until).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-emerald-600" />
              AI Command Center
            </h2>
            <p className="text-sm text-gray-600">Live operational insights and next-best actions.</p>
          </div>
          <div className="text-sm font-medium text-emerald-700">{analytics.totals.forms} forms • {analytics.totals.submissions} submissions</div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Active workflows</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{analytics.totals.activeForms}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Drafts</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{analytics.totals.draftForms}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Approval ready</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{analytics.totals.approvalReady}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {(analytics.recommendations || []).slice(0, 2).map((recommendation, index) => (
            <div key={`${recommendation.title}-${index}`} className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{recommendation.title}</p>
              <p className="mt-1">{recommendation.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h2>
        {orders?.orders && orders.orders.length > 0 ? (
          <div className="space-y-4">
            {orders.orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <div className="font-semibold text-gray-800">{order.order_number}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()} • {order.item_count} items
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">₹{order.total_amount}</div>
                  <div className="text-sm text-gray-500 capitalize">{order.status}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No orders yet</div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
