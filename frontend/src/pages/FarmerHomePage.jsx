import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { farmersAPI } from '../services/api';
import {
  Sprout,
  TrendingUp,
  DollarSign,
  CloudSun,
  Archive,
  Store,
  Users,
  Bell,
  ArrowRight,
} from 'lucide-react';

function FarmerHomePage() {
  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: farmerData } = useQuery({
    queryKey: ['farmer-dashboard'],
    queryFn: () => farmersAPI.getFarmerDashboard('current-farmer-id').then(r => r.data),
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => farmersAPI.getNotifications('current-farmer-id').then(r => r.data),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-v42-forest rounded-lg p-6 mb-8 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {farmerData?.name || 'Farmer'}!
        </h1>
        <p className="text-white/80">
          Here's what's happening with your farm today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-v42-paddy rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <Sprout className="w-6 h-6 text-v42-forest" />
            <span className="text-xs text-v42-mut">This Season</span>
          </div>
          <div className="text-2xl font-bold text-v42-ink">
            {farmerData?.active_crops || 0}
          </div>
          <div className="text-sm text-v42-mut">Active Crops</div>
        </div>
        <div className="bg-v42-paddy rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-v42-indigo" />
            <span className="text-xs text-v42-mut">All Time</span>
          </div>
          <div className="text-2xl font-bold text-v42-ink">
            {farmerData?.total_harvest || 0}t
          </div>
          <div className="text-sm text-v42-mut">Total Harvest</div>
        </div>
        <div className="bg-v42-paddy rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-v42-turmericink" />
            <span className="text-xs text-v42-mut">This Month</span>
          </div>
          <div className="text-2xl font-bold text-v42-ink">
            ₹{farmerData?.revenue || 0}
          </div>
          <div className="text-sm text-v42-mut">Revenue</div>
        </div>
        <div className="bg-v42-paddy rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-v42-indigo" />
            <span className="text-xs text-v42-mut">Active</span>
          </div>
          <div className="text-2xl font-bold text-v42-ink">
            {farmerData?.buyers || 0}
          </div>
          <div className="text-sm text-v42-mut">Connected Buyers</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Link
          to="/farmer-sell"
          className="bg-v42-paddy rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <Store className="w-8 h-8 text-v42-forest mx-auto mb-2" />
          <div className="font-semibold text-v42-ink text-sm">Sell Produce</div>
        </Link>
        <Link
          to="/farmer-field"
          className="bg-v42-paddy rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <Sprout className="w-8 h-8 text-v42-forest mx-auto mb-2" />
          <div className="font-semibold text-v42-ink text-sm">My Fields</div>
        </Link>
        <Link
          to="/harvest-plan"
          className="bg-v42-paddy rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <CloudSun className="w-8 h-8 text-v42-indigo mx-auto mb-2" />
          <div className="font-semibold text-v42-ink text-sm">Harvest Plan</div>
        </Link>
        <Link
          to="/harvest-score"
          className="bg-v42-paddy rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <TrendingUp className="w-8 h-8 text-v42-turmericink mx-auto mb-2" />
          <div className="font-semibold text-v42-ink text-sm">Harvest Score</div>
        </Link>
        <Link
          to="/what-grow"
          className="bg-v42-paddy rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <Sprout className="w-8 h-8 text-v42-forest mx-auto mb-2" />
          <div className="font-semibold text-v42-ink text-sm">What to Grow</div>
        </Link>
        <Link
          to="/seed-vault"
          className="bg-v42-paddy rounded-lg shadow p-4 hover:shadow-lg transition text-center"
        >
          <Archive className="w-8 h-8 text-v42-turmericink mx-auto mb-2" />
          <div className="font-semibold text-v42-ink text-sm">Seed Vault</div>
        </Link>
      </div>

      {/* Weather & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-v42-paddy rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-v42-ink mb-4 flex items-center">
            <CloudSun className="w-5 h-5 mr-2 text-v42-indigo" />
            Weather Alert
          </h2>
          <div className="bg-v42-indigo/10 border border-v42-indigo/30 rounded-lg p-4">
            <div className="flex items-start">
              <Bell className="w-5 h-5 text-v42-indigo mr-2 mt-0.5" />
              <div>
                <div className="font-medium text-v42-ink">Heavy Rain Expected</div>
                <div className="text-sm text-v42-mut mt-1">
                  Expect heavy rainfall in your region in the next 48 hours.
                  Consider delaying harvest or ensure proper storage.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-v42-paddy rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-v42-ink mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-v42-turmericink" />
            Notifications
          </h2>
          <div className="space-y-3">
            {notifications?.slice(0, 3).map((notification) => (
              <div key={notification.id} className="flex items-start p-3 bg-v42-paddy2 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-v42-ink text-sm">
                    {notification.title}
                  </div>
                  <div className="text-xs text-v42-mut mt-1">
                    {notification.time}
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-4 text-v42-mut text-sm">
                No new notifications
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Market Prices — no live-price feed is wired into this dashboard view.
          Rather than show numbers as if they were today's real quotes, this
          links out to the real price-check tool instead of fabricating a
          quote table. Same honesty convention as HomePage.jsx / MarketplacePage.jsx. */}
      <div className="bg-v42-paddy rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-v42-ink flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-v42-forest" />
            Market Prices
          </h2>
        </div>
        <div className="text-center py-6 text-v42-mut text-sm border border-dashed border-v42-line rounded-lg">
          Live price quotes are not shown here yet.
          <br />
          <Link
            to="/price-check"
            className="text-v42-forest hover:text-v42-forestd font-medium inline-flex items-center mt-2"
          >
            Open Price Check for current prices
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-v42-paddy rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-v42-ink">Recent Orders</h2>
          <Link
            to="/dashboard"
            className="text-v42-forest hover:text-v42-forestd text-sm font-medium"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {farmerData?.recent_orders?.slice(0, 3).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-v42-paddy2 rounded-lg">
              <div>
                <div className="font-medium text-v42-ink">{order.product}</div>
                <div className="text-sm text-v42-mut">{order.date}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-v42-ink">{order.amount}</div>
                <div className={`text-sm ${order.status === 'Completed' ? 'text-v42-forest' : 'text-v42-turmericink'}`}>
                  {order.status}
                </div>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-v42-mut">
              No recent orders
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FarmerHomePage;
