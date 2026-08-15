import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ecommerceBusinessSalesAPI } from '../services/api';
import { 
  Building2, 
  FileText, 
  HeartHandshake, 
  TrendingUp, 
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  Users,
  Truck
} from 'lucide-react';

/**
 * AFRERA B2B Marketplace
 * 
 * Business-to-business commerce platform:
 * - Bulk Order Management
 * - Contract Farming
 * - Quotation Management
 * - Sales Analytics
 * - Commission Management
 */

const B2BMarketplace = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Sales Analytics
  const { data: salesAnalytics, isLoading: salesLoading } = useQuery({
    queryKey: ['salesAnalytics'],
    queryFn: () => ecommerceBusinessSalesAPI.getSalesAnalytics({})
  });

  // B2B Conversion Metrics
  const { data: conversionMetrics, isLoading: conversionLoading } = useQuery({
    queryKey: ['conversionMetrics'],
    queryFn: () => ecommerceBusinessSalesAPI.getB2BConversionMetrics(30)
  });

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{salesAnalytics?.total_revenue?.toLocaleString() || 0}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bulk Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesAnalytics?.bulk_orders_count || 0}
              </p>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Contracts</p>
              <p className="text-2xl font-bold text-gray-900">
                {salesAnalytics?.active_contracts || 0}
              </p>
            </div>
            <HeartHandshake className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {conversionMetrics?.conversion_rate?.toFixed(1) || 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition flex items-center justify-center gap-2">
              <Package className="h-4 w-4" />
              Create Bulk Order
            </button>
            <button className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition flex items-center justify-center gap-2">
              <HeartHandshake className="h-4 w-4" />
              Create Contract Farming
            </button>
            <button className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              Submit Quotation
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Performance
          </h3>
          {salesLoading ? (
            <p className="text-gray-500">Loading analytics...</p>
          ) : salesAnalytics ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-semibold">{salesAnalytics.total_orders}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-gray-600">Average Order Value</span>
                <span className="font-semibold">₹{salesAnalytics.avg_order_value?.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span className="text-gray-600">Total Buyers</span>
                <span className="font-semibold">{salesAnalytics.total_buyers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                <span className="text-gray-600">Total Sellers</span>
                <span className="font-semibold">{salesAnalytics.total_sellers}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderBulkOrders = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Bulk Order Management
        </h3>
        
        <div className="p-4 bg-blue-50 rounded mb-4">
          <h4 className="font-medium mb-3">Create New Bulk Order</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
              <input
                type="text"
                id="bulkProductId"
                placeholder="Enter Product ID"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                id="bulkQuantity"
                placeholder="Enter bulk quantity"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
              <input
                type="date"
                id="bulkDeliveryDate"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <input
                type="number"
                id="bulkBudget"
                placeholder="Enter budget"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition">
            Submit Bulk Order Request
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Recent Bulk Orders</h4>
          {[1, 2, 3].map((order) => (
            <div key={order} className="p-4 border rounded hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-medium">Bulk Order #{order}</h5>
                  <p className="text-sm text-gray-500">Product: Rice (Basmati)</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${order === 1 ? 'bg-green-100 text-green-800' : order === 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                  {order === 1 ? 'Completed' : order === 2 ? 'In Progress' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Quantity: {order * 1000} kg</span>
                <span>Budget: ₹{(order * 50000).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContractFarming = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HeartHandshake className="h-5 w-5" />
          Contract Farming
        </h3>
        
        <div className="p-4 bg-green-50 rounded mb-4">
          <h4 className="font-medium mb-3">Create New Contract</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
              <select className="w-full p-2 border rounded">
                <option>Wheat</option>
                <option>Rice</option>
                <option>Cotton</option>
                <option>Sugarcane</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract Duration (months)</label>
              <input
                type="number"
                id="contractDuration"
                placeholder="Enter duration"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Production (tons)</label>
              <input
                type="number"
                id="targetProduction"
                placeholder="Enter target production"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per ton (₹)</label>
              <input
                type="number"
                id="pricePerTon"
                placeholder="Enter price"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition">
            Create Contract
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Active Contracts</h4>
          {[1, 2].map((contract) => (
            <div key={contract} className="p-4 border rounded hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-medium">Contract #{contract}</h5>
                  <p className="text-sm text-gray-500">Crop: {contract === 1 ? 'Wheat' : 'Rice'}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Active
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Duration: {contract * 6} months</span>
                <span>Target: {contract * 500} tons</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Progress: </span>
                <span className="font-semibold">{contract * 30}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuotations = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Quotation Management
        </h3>
        
        <div className="space-y-3">
          <h4 className="font-medium">Pending Quotations</h4>
          {[1, 2, 3].map((quote) => (
            <div key={quote} className="p-4 border rounded hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-medium">Quotation #{quote}</h5>
                  <p className="text-sm text-gray-500">Bulk Order: #{quote * 100}</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Pending
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Quantity: {quote * 2000} kg</span>
                <span>Quote: ₹{(quote * 80000).toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600 transition">
                  Accept
                </button>
                <button className="flex-1 bg-gray-500 text-white py-1 px-3 rounded text-sm hover:bg-gray-600 transition">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Sales Analytics
        </h3>
        
        {salesLoading ? (
          <p className="text-gray-500">Loading analytics...</p>
        ) : salesAnalytics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <h4 className="font-medium mb-2">Revenue Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bulk Orders</span>
                    <span className="font-semibold">₹{(salesAnalytics.bulk_revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contract Farming</span>
                    <span className="font-semibold">₹{(salesAnalytics.contract_revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Regular Orders</span>
                    <span className="font-semibold">₹{(salesAnalytics.regular_revenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded">
                <h4 className="font-medium mb-2">Order Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-semibold">{salesAnalytics.total_orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Order Value</span>
                    <span className="font-semibold">₹{salesAnalytics.avg_order_value?.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Success Rate</span>
                    <span className="font-semibold">{(salesAnalytics.success_rate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded">
                <h4 className="font-medium mb-2">Customer Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Buyers</span>
                    <span className="font-semibold">{salesAnalytics.total_buyers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Sellers</span>
                    <span className="font-semibold">{salesAnalytics.total_sellers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Contracts</span>
                    <span className="font-semibold">{salesAnalytics.active_contracts}</span>
                  </div>
                </div>
              </div>
            </div>

            {conversionMetrics && (
              <div className="p-4 bg-orange-50 rounded">
                <h4 className="font-medium mb-2">Conversion Metrics (30 Days)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Conversion Rate:</span>
                    <span className="font-semibold">{conversionMetrics.conversion_rate?.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quote to Order:</span>
                    <span className="font-semibold">{conversionMetrics.quote_to_order_rate?.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Response Time:</span>
                    <span className="font-semibold">{conversionMetrics.avg_response_time}h</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Repeat Buyers:</span>
                    <span className="font-semibold">{conversionMetrics.repeat_buyer_rate?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No data available</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            B2B Marketplace
          </h1>
          <p className="text-gray-600 mt-2">
            Business-to-business commerce platform with bulk orders and contract farming
          </p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('bulkorders')}
              className={`px-4 py-3 font-medium ${activeTab === 'bulkorders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Bulk Orders
            </button>
            <button
              onClick={() => setActiveTab('contractfarming')}
              className={`px-4 py-3 font-medium ${activeTab === 'contractfarming' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Contract Farming
            </button>
            <button
              onClick={() => setActiveTab('quotations')}
              className={`px-4 py-3 font-medium ${activeTab === 'quotations' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Quotations
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-3 font-medium ${activeTab === 'analytics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Analytics
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'bulkorders' && renderBulkOrders()}
          {activeTab === 'contractfarming' && renderContractFarming()}
          {activeTab === 'quotations' && renderQuotations()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
    </div>
  );
};

export default B2BMarketplace;
