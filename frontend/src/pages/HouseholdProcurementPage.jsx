import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { strategicAPI } from '../services/api'
import { Home, ShoppingCart, Calendar, DollarSign, Users, Package } from 'lucide-react'

function HouseholdProcurementPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState('plans')

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['household-plans', user?.id],
    queryFn: () => strategicAPI.household.getProcurementPlans({ userId: user?.id }).then(r => r.data),
    enabled: !!user?.id,
  })

  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['household-subscriptions', user?.id],
    queryFn: () => strategicAPI.household.getSubscriptions({ userId: user?.id }).then(r => r.data),
    enabled: !!user?.id,
  })

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['household-dashboard', user?.id],
    queryFn: () => strategicAPI.household.getDashboard({ userId: user?.id }).then(r => r.data),
    enabled: !!user?.id,
  })

  const createPlanMutation = useMutation({
    mutationFn: (data) => strategicAPI.household.createProcurementPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['household-plans'])
      alert('Procurement plan created successfully!')
    },
    onError: (error) => {
      alert(`Failed to create plan: ${error.message}`)
    },
  })

  const handleCreatePlan = () => {
    const planData = {
      household_id: user?.id,
      family_size: 4,
      consumption_period_start: '2024-09-01',
      consumption_period_end: '2024-12-31',
      preferred_varieties: ['rice', 'wheat', 'vegetables'],
      dietary_restrictions: [],
      budget_limit: 15000,
      delivery_frequency: 'weekly',
      delivery_day_of_week: 1,
    }
    createPlanMutation.mutate(planData)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Home className="w-8 h-8" />
          Household Procurement
        </h1>
        <p className="text-gray-600 mt-2">
          Plan your household food procurement with budget optimization and convenient delivery
        </p>
      </div>

      {/* Dashboard Summary */}
      {!dashboardLoading && dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Plans</p>
                <p className="text-2xl font-bold">{dashboard.active_plans || 0}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Subscriptions</p>
                <p className="text-2xl font-bold">{dashboard.active_subscriptions || 0}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Monthly Budget</p>
                <p className="text-2xl font-bold">₹{dashboard.monthly_budget || 0}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Savings</p>
                <p className="text-2xl font-bold text-green-600">₹{dashboard.savings || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setSelectedTab('plans')}
          className={`px-4 py-2 font-medium ${selectedTab === 'plans' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Procurement Plans
        </button>
        <button
          onClick={() => setSelectedTab('subscriptions')}
          className={`px-4 py-2 font-medium ${selectedTab === 'subscriptions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Subscriptions
        </button>
      </div>

      {selectedTab === 'plans' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Procurement Plans</h2>
            <button
              onClick={handleCreatePlan}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Create New Plan
            </button>
          </div>
          {plansLoading ? (
            <div className="text-center py-8">Loading plans...</div>
          ) : plans?.items?.length > 0 ? (
            <div className="grid gap-4">
              {plans.items.map((plan) => (
                <div key={plan.id} className="bg-white rounded-lg shadow p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Plan #{plan.id?.slice(0, 8)}</h3>
                      <p className="text-gray-600">Family Size: {plan.family_size || 0} members</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {plan.status || 'Active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Budget</p>
                      <p className="font-semibold">₹{plan.budget_limit || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Delivery</p>
                      <p className="font-semibold">{plan.delivery_frequency || 'Weekly'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Period</p>
                      <p className="font-semibold">{plan.consumption_period_start || 'TBD'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Aggregation</p>
                      <p className="font-semibold">{plan.aggregation_group_id ? 'Joined' : 'Individual'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No procurement plans. Create your first plan to get started.</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'subscriptions' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Subscriptions</h2>
          {subscriptionsLoading ? (
            <div className="text-center py-8">Loading subscriptions...</div>
          ) : subscriptions?.items?.length > 0 ? (
            <div className="grid gap-4">
              {subscriptions.items.map((subscription) => (
                <div key={subscription.id} className="bg-white rounded-lg shadow p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{subscription.product_name || 'Product Subscription'}</h3>
                      <p className="text-gray-600">Variety: {subscription.variety_name || 'Standard'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {subscription.status || 'Active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Quantity</p>
                      <p className="font-semibold">{subscription.quantity || 0} kg/month</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Frequency</p>
                      <p className="font-semibold">{subscription.frequency || 'Monthly'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Next Delivery</p>
                      <p className="font-semibold">{subscription.next_delivery || 'TBD'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Auto Renew</p>
                      <p className="font-semibold">{subscription.auto_renew ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active subscriptions. Create a procurement plan first.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default HouseholdProcurementPage