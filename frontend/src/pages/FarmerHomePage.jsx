import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { farmersAPI } from '../services/api'
import { 
  Sprout, 
  TrendingUp, 
  DollarSign, 
  CloudSun, 
  Tractor, 
  Store, 
  Users, 
  Bell,
  ArrowRight
} from 'lucide-react'

function FarmerHomePage() {
  const { data: farmerData } = useQuery('farmer-dashboard', () =>
    farmersAPI.getFarmerDashboard('current-farmer-id')
  )

  const { data: notifications } = useQuery('notifications', () =>
    farmersAPI.getNotifications('current-farmer-id')
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 mb-8 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {farmerData?.name || 'Farmer'}!
        </h1>
        <p className="text-green-100">
          Here's what's happening with your farm today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <Sprout className="w-6 h-6 text-green-600" />
            <span className="text-xs text-gray-500">This Season</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {farmerData?.active_crops || 0}
          </div>
          <div className="text-sm text-gray-600">Active Crops</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="text-xs text-gray-500">All Time</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {farmerData?.total_harvest || 0}t
          </div>
          <div className="text-sm text-gray-600">Total Harvest</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-orange-600" />
            <span className="text-xs text-gray-500">This Month</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            ₹{farmerData?.revenue || 0}
          </div>
          <div className="text-sm text-gray-600">Revenue</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span className="text-xs text-gray-500">Active</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {farmerData?.buyers || 0}
          </div>
          <div className="text-sm text-gray-600">Connected Buyers</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Link
          to="/farmersell"
          className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <Store className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="font-semibold text-gray-800 text-sm">Sell Produce</div>
        </Link>
        <Link
          to="/farmerfield"
          className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <Sprout className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <div className="font-semibold text-gray-800 text-sm">My Fields</div>
        </Link>
        <Link
          to="/harvestplan"
          className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <CloudSun className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="font-semibold text-gray-800 text-sm">Harvest Plan</div>
        </Link>
        <Link
          to="/harvestscore"
          className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="font-semibold text-gray-800 text-sm">Harvest Score</div>
        </Link>
        <Link
          to="/whatgrow"
          className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <Sprout className="w-8 h-8 text-lime-600 mx-auto mb-2" />
          <div className="font-semibold text-gray-800 text-sm">What to Grow</div>
        </Link>
        <Link
          to="/seedvault"
          className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <Tractor className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <div className="font-semibold text-gray-800 text-sm">Seed Vault</div>
        </Link>
      </div>

      {/* Weather & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <CloudSun className="w-5 h-5 mr-2 text-blue-600" />
            Weather Alert
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Bell className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <div className="font-medium text-blue-800">Heavy Rain Expected</div>
                <div className="text-sm text-blue-600 mt-1">
                  Expect heavy rainfall in your region in the next 48 hours. 
                  Consider delaying harvest or ensure proper storage.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-orange-600" />
            Notifications
          </h2>
          <div className="space-y-3">
            {notifications?.slice(0, 3).map((notification) => (
              <div key={notification.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">
                    {notification.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {notification.time}
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-4 text-gray-500 text-sm">
                No new notifications
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Market Prices */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Today's Market Prices
          </h2>
          <Link
            to="/pricecheck"
            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Rice', price: '₹2,450', trend: '+2.5%', up: true },
            { name: 'Wheat', price: '₹2,275', trend: '+1.8%', up: true },
            { name: 'Mustard', price: '₹5,200', trend: '-0.5%', up: false },
            { name: 'Potato', price: '₹1,800', trend: '+3.2%', up: true },
          ].map((crop) => (
            <div key={crop.name} className="border rounded-lg p-3">
              <div className="font-medium text-gray-800">{crop.name}</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{crop.price}</div>
              <div className={`text-sm mt-1 ${crop.up ? 'text-green-600' : 'text-red-600'}`}>
                {crop.trend}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
          <Link
            to="/dashboard"
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {farmerData?.recent_orders?.slice(0, 3).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">{order.product}</div>
                <div className="text-sm text-gray-500">{order.date}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-800">{order.amount}</div>
                <div className={`text-sm ${order.status === 'Completed' ? 'text-green-600' : 'text-orange-600'}`}>
                  {order.status}
                </div>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              No recent orders
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FarmerHomePage