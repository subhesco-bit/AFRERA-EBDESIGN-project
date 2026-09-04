import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ecommerceMarketingAPI } from '../services/api';
import {
  Megaphone,
  Target,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  BarChart3,
  Calendar,
  Users,
  Sparkles,
  Tag,
  Zap,
} from 'lucide-react';

/**
 * AFRERA Marketing Center
 *
 * Marketing and advertising platform:
 * - Campaign Management
 * - Sponsored Products
 * - Promotion Management
 * - Retargeting Campaigns
 * - Performance Analytics
 */

const MarketingCenter = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Marketing Analytics
  const { data: marketingAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['marketingAnalytics'],
    queryFn: () => ecommerceMarketingAPI.getMarketingAnalytics({}),
  });

  // Sponsored Products
  const { data: sponsoredProducts, isLoading: sponsoredLoading } = useQuery({
    queryKey: ['sponsoredProducts'],
    queryFn: () => ecommerceMarketingAPI.getSponsoredProducts({}),
  });

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">
                {marketingAnalytics?.active_campaigns || 0}
              </p>
            </div>
            <Megaphone className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spend</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{marketingAnalytics?.total_spend?.toLocaleString() || 0}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Impressions</p>
              <p className="text-2xl font-bold text-gray-900">
                {marketingAnalytics?.total_impressions?.toLocaleString() || 0}
              </p>
            </div>
            <Eye className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversions</p>
              <p className="text-2xl font-bold text-gray-900">
                {marketingAnalytics?.total_conversions || 0}
              </p>
            </div>
            <Target className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition flex items-center justify-center gap-2">
              <Megaphone className="h-4 w-4" />
              Create Campaign
            </button>
            <button className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              Sponsor Product
            </button>
            <button className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition flex items-center justify-center gap-2">
              <Tag className="h-4 w-4" />
              Create Promotion
            </button>
            <button className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition flex items-center justify-center gap-2">
              <Zap className="h-4 w-4" />
              Setup Retargeting
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </h3>
          {analyticsLoading ? (
            <p className="text-gray-500">Loading analytics...</p>
          ) : marketingAnalytics ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="text-gray-600">Click-Through Rate</span>
                <span className="font-semibold">{(marketingAnalytics.avg_ctr * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold">{(marketingAnalytics.avg_conversion_rate * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span className="text-gray-600">Cost Per Click</span>
                <span className="font-semibold">₹{marketingAnalytics.avg_cpc?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                <span className="text-gray-600">Return on Ad Spend</span>
                <span className="font-semibold">{marketingAnalytics.roas?.toFixed(2)}x</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCampaigns = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Campaign Management
        </h3>

        <div className="p-4 bg-blue-50 rounded mb-4">
          <h4 className="font-medium mb-3">Create New Campaign</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                type="text"
                id="campaignName"
                placeholder="Enter campaign name"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
              <select className="w-full p-2 border rounded">
                <option>Brand Awareness</option>
                <option>Lead Generation</option>
                <option>Sales Conversion</option>
                <option>Product Launch</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹)</label>
              <input
                type="number"
                id="campaignBudget"
                placeholder="Enter budget"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
              <input
                type="number"
                id="campaignDuration"
                placeholder="Enter duration"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition">
            Create Campaign
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Active Campaigns</h4>
          {[1, 2, 3].map((campaign) => (
            <div key={campaign} className="p-4 border rounded hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-medium">Campaign #{campaign}</h5>
                  <p className="text-sm text-gray-500">Type: {campaign === 1 ? 'Brand Awareness' : campaign === 2 ? 'Lead Generation' : 'Sales Conversion'}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Active
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Budget: ₹{(campaign * 50000).toLocaleString()}</span>
                <span>Duration: {campaign * 14} days</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Spent: </span>
                <span className="font-semibold">₹{(campaign * 25000).toLocaleString()}</span>
                <span className="text-gray-500 ml-2">Progress: </span>
                <span className="font-semibold">{campaign * 33}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSponsoredProducts = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Sponsored Products
        </h3>

        <div className="p-4 bg-green-50 rounded mb-4">
          <h4 className="font-medium mb-3">Sponsor Product</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
              <input
                type="text"
                id="sponsoredProductId"
                placeholder="Enter Product ID"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount (₹)</label>
              <input
                type="number"
                id="bidAmount"
                placeholder="Enter bid amount"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select className="w-full p-2 border rounded">
                <option>All Users</option>
                <option>Vegetarians</option>
                <option>Health Conscious</option>
                <option>Premium Buyers</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sponsorship Duration</label>
              <input
                type="number"
                id="sponsorshipDuration"
                placeholder="Enter days"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition">
            Start Sponsorship
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Currently Sponsored</h4>
          {sponsoredLoading ? (
            <p className="text-gray-500">Loading sponsored products...</p>
          ) : sponsoredProducts?.products ? (
            sponsoredProducts.products.map((product, index) => (
              <div key={index} className="p-4 border rounded hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium">{product.product_name}</h5>
                    <p className="text-sm text-gray-500">Bid: ₹{product.bid_amount}</p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {product.tier}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Impressions: {product.impressions}</span>
                  <span>Clicks: {product.clicks}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No sponsored products</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPromotions = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Promotion Management
        </h3>

        <div className="p-4 bg-purple-50 rounded mb-4">
          <h4 className="font-medium mb-3">Create Promotion</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Code</label>
              <input
                type="text"
                id="promoCode"
                placeholder="Enter code (e.g., SAVE20)"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select className="w-full p-2 border rounded">
                <option>Percentage</option>
                <option>Fixed Amount</option>
                <option>Buy X Get Y</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <input
                type="number"
                id="discountValue"
                placeholder="Enter discount value"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input
                type="date"
                id="validUntil"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition">
            Create Promotion
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Active Promotions</h4>
          {[1, 2, 3].map((promo) => (
            <div key={promo} className="p-4 border rounded hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h5 className="font-medium">PROMO{promo * 10}</h5>
                  <p className="text-sm text-gray-500">Type: {promo === 1 ? 'Percentage' : promo === 2 ? 'Fixed Amount' : 'Buy X Get Y'}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Active
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Discount: {promo * 15}%</span>
                <span>Used: {promo * 42} times</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRetargeting = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Retargeting Campaigns
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-orange-50 rounded">
            <h4 className="font-medium mb-3">Cart Abandonment</h4>
            <p className="text-sm text-gray-600 mb-3">Recover lost sales by targeting users who abandoned their cart</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Targeted Users:</span>
                <span className="font-semibold">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recoveries:</span>
                <span className="font-semibold">234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recovery Rate:</span>
                <span className="font-semibold">19.0%</span>
              </div>
            </div>
            <button className="w-full mt-3 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition">
              View Abandoned Carts
            </button>
          </div>

          <div className="p-4 bg-blue-50 rounded">
            <h4 className="font-medium mb-3">Product View Retargeting</h4>
            <p className="text-sm text-gray-600 mb-3">Show ads to users who viewed specific products</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Targeted Products:</span>
                <span className="font-semibold">45</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Views:</span>
                <span className="font-semibold">5,678</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conversion Rate:</span>
                <span className="font-semibold">12.5%</span>
              </div>
            </div>
            <button className="w-full mt-3 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition">
              View Product Views
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Marketing Analytics
        </h3>

        {analyticsLoading ? (
          <p className="text-gray-500">Loading analytics...</p>
        ) : marketingAnalytics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <h4 className="font-medium mb-2">Campaign Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Campaigns:</span>
                    <span className="font-semibold">{marketingAnalytics.total_campaigns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Campaigns:</span>
                    <span className="font-semibold">{marketingAnalytics.active_campaigns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg CTR:</span>
                    <span className="font-semibold">{(marketingAnalytics.avg_ctr * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded">
                <h4 className="font-medium mb-2">Budget & Spend</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Budget:</span>
                    <span className="font-semibold">₹{marketingAnalytics.total_budget?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Spend:</span>
                    <span className="font-semibold">₹{marketingAnalytics.total_spend?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget Utilization:</span>
                    <span className="font-semibold">{((marketingAnalytics.total_spend / marketingAnalytics.total_budget) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded">
                <h4 className="font-medium mb-2">Engagement Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Impressions:</span>
                    <span className="font-semibold">{marketingAnalytics.total_impressions?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Clicks:</span>
                    <span className="font-semibold">{marketingAnalytics.total_clicks?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg CPC:</span>
                    <span className="font-semibold">₹{marketingAnalytics.avg_cpc?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded">
                <h4 className="font-medium mb-2">Conversion Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Conversions:</span>
                    <span className="font-semibold">{marketingAnalytics.total_conversions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion Rate:</span>
                    <span className="font-semibold">{(marketingAnalytics.avg_conversion_rate * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ROAS:</span>
                    <span className="font-semibold">{marketingAnalytics.roas?.toFixed(2)}x</span>
                  </div>
                </div>
              </div>
            </div>
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
            <Megaphone className="h-8 w-8 text-purple-600" />
            Marketing Center
          </h1>
          <p className="text-gray-600 mt-2">
            Campaign management, sponsored products, promotions, and retargeting
          </p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium ${activeTab === 'overview' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-3 font-medium ${activeTab === 'campaigns' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Campaigns
            </button>
            <button
              onClick={() => setActiveTab('sponsored')}
              className={`px-4 py-3 font-medium ${activeTab === 'sponsored' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Sponsored Products
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`px-4 py-3 font-medium ${activeTab === 'promotions' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Promotions
            </button>
            <button
              onClick={() => setActiveTab('retargeting')}
              className={`px-4 py-3 font-medium ${activeTab === 'retargeting' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Retargeting
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-3 font-medium ${activeTab === 'analytics' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Analytics
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'campaigns' && renderCampaigns()}
          {activeTab === 'sponsored' && renderSponsoredProducts()}
          {activeTab === 'promotions' && renderPromotions()}
          {activeTab === 'retargeting' && renderRetargeting()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
    </div>
  );
};

export default MarketingCenter;
