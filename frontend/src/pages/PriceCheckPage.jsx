import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { farmersAPI } from '../services/api';
import { DollarSign, Search, TrendingUp, TrendingDown, MapPin, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function PriceCheckPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: marketPrices } = useQuery({
    queryKey: ['market-prices', selectedState, selectedCategory],
    queryFn: () => farmersAPI.getMarketPrices(selectedState, selectedCategory).then(r => r.data),
  });

  const { data: priceTrends } = useQuery({
    queryKey: ['price-trends'],
    queryFn: () => farmersAPI.getPriceTrends().then(r => r.data),
  });

  const { data: states } = useQuery({
    queryKey: ['states'],
    queryFn: () => farmersAPI.getStates().then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['price-categories'],
    queryFn: () => farmersAPI.getPriceCategories().then(r => r.data),
  });

  const filteredPrices = marketPrices?.filter(price =>
    price.commodity.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Price Check</h1>
        <p className="text-gray-600">Real-time agricultural commodity prices across markets</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input aria-label="Text"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commodities..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select aria-label="Select an option"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All States</option>
              {states?.map((state) => (
                <option key={state.id} value={state.id}>{state.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select aria-label="Select an option"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Price Trends Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-100 text-sm">Gainers Today</div>
              <div className="text-3xl font-bold mt-1">{priceTrends?.gainers || 0}</div>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-red-100 text-sm">Losers Today</div>
              <div className="text-3xl font-bold mt-1">{priceTrends?.losers || 0}</div>
            </div>
            <TrendingDown className="w-12 h-12 text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-100 text-sm">Markets Active</div>
              <div className="text-3xl font-bold mt-1">{priceTrends?.markets || 0}</div>
            </div>
            <MapPin className="w-12 h-12 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Price Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Commodity Prices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* A caption is the first thing a screen-reader user hears. Without
            it the table is announced only as "table with N columns". */}
            <caption className="sr-only">Price comparison across sources</caption>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commodity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price (₹/q)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPrices?.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{price.commodity}</div>
                    <div className="text-sm text-gray-500">{price.variety}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {price.market}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="font-semibold text-gray-900">₹{price.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`font-medium ${
                      price.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {price.change >= 0 ? '+' : ''}{price.change}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {price.trend === 'up' ? (
                      <ArrowUpRight className="w-5 h-5 text-green-600 mx-auto" />
                    ) : price.trend === 'down' ? (
                      <ArrowDownRight className="w-5 h-5 text-red-600 mx-auto" />
                    ) : (
                      <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {price.updated}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No price data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Alerts */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <div className="font-medium text-blue-800">Set Price Alerts</div>
              <div className="text-sm text-blue-700">Get notified when prices hit your target</div>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            Create Alert
          </button>
        </div>
      </div>
    </div>
  );
}

export default PriceCheckPage;
