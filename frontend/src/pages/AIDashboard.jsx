import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ecommerceAIAPI } from '../services/api';
import { 
  Users, 
  TrendingUp, 
  Package, 
  DollarSign, 
  BarChart3, 
  Brain,
  Activity,
  Target,
  PieChart,
  LineChart
} from 'lucide-react';

/**
 * AFRERA AI Dashboard
 * 
 * Comprehensive AI-powered marketplace dashboard:
 * - Customer Segmentation (RFM, behavioral)
 * - Demand Forecasting
 * - Inventory Optimization
 * - Product Recommendations
 * - Sales Prediction
 * - Customer Lifetime Value
 * - Market Basket Analysis
 */

const AIDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  // 2026-08-31: every useQuery below was missing the .then(r => r.data) unwrap
  // (ecommerceAIAPI.* returns the raw axios response, not the payload, so
  // e.g. rfmSegments?.total_customers always read undefined) and every
  // "Run ..." button called .refetch() directly on the *data* variable
  // instead of the query result's own refetch function, which throws
  // (data has no .refetch method) - fixed by unwrapping .data in queryFn and
  // destructuring refetch separately from each useQuery call.

  // Customer Segmentation Data
  const { data: rfmSegments, isLoading: rfmLoading, refetch: refetchRfmSegments } = useQuery({
    queryKey: ['rfmSegments'],
    queryFn: () => ecommerceAIAPI.segmentCustomersRFM().then(r => r.data)
  });

  const { data: behavioralSegments, isLoading: behavioralLoading, refetch: refetchBehavioralSegments } = useQuery({
    queryKey: ['behavioralSegments'],
    queryFn: () => ecommerceAIAPI.segmentCustomersBehavioral().then(r => r.data)
  });

  // Demand Forecasting Data
  const { data: demandForecast, isLoading: demandLoading, refetch: refetchDemandForecast } = useQuery({
    queryKey: ['demandForecast', selectedProduct],
    queryFn: () => selectedProduct ? ecommerceAIAPI.forecastProductDemand(selectedProduct, 30).then(r => r.data) : null,
    enabled: !!selectedProduct
  });

  // Inventory Optimization Data
  const { data: inventoryOptimization, isLoading: inventoryLoading, refetch: refetchInventoryOptimization } = useQuery({
    queryKey: ['inventoryOptimization', selectedProduct],
    queryFn: () => selectedProduct ? ecommerceAIAPI.optimizeInventory(selectedProduct).then(r => r.data) : null,
    enabled: !!selectedProduct
  });

  // Personalized Recommendations Data
  const { data: recommendations, isLoading: recommendationsLoading, refetch: refetchRecommendations } = useQuery({
    queryKey: ['recommendations', selectedUser],
    queryFn: () => selectedUser ? ecommerceAIAPI.getPersonalizedRecommendations(selectedUser, 10).then(r => r.data) : null,
    enabled: !!selectedUser
  });

  // Sales Prediction Data
  const { data: salesPrediction, isLoading: salesLoading, refetch: refetchSalesPrediction } = useQuery({
    queryKey: ['salesPrediction'],
    queryFn: () => ecommerceAIAPI.predictSales(null, 30).then(r => r.data)
  });

  // Customer Lifetime Value Data
  const { data: clvData, isLoading: clvLoading, refetch: refetchClvData } = useQuery({
    queryKey: ['clv', selectedUser],
    queryFn: () => selectedUser ? ecommerceAIAPI.calculateCustomerLifetimeValue(selectedUser).then(r => r.data) : null,
    enabled: !!selectedUser
  });

  // Market Basket Analysis Data
  const { data: marketBasket, isLoading: basketLoading, refetch: refetchMarketBasket } = useQuery({
    queryKey: ['marketBasket'],
    queryFn: () => ecommerceAIAPI.analyzeMarketBasket().then(r => r.data)
  });

  const handleRunSegmentation = (type) => {
    if (type === 'rfm') {
      refetchRfmSegments();
    } else if (type === 'behavioral') {
      refetchBehavioralSegments();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {rfmSegments?.total_customers || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Champions</p>
              <p className="text-2xl font-bold text-gray-900">
                {rfmSegments?.segments?.filter(s => s.segment === 'Champions').length || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">At Risk</p>
              <p className="text-2xl font-bold text-gray-900">
                {rfmSegments?.segments?.filter(s => s.segment === 'At Risk').length || 0}
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lost Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {rfmSegments?.segments?.filter(s => s.segment === 'Lost').length || 0}
              </p>
            </div>
            <Target className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Customer Segmentation
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => handleRunSegmentation('rfm')}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
            >
              Run RFM Segmentation
            </button>
            <button
              onClick={() => handleRunSegmentation('behavioral')}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
            >
              Run Behavioral Segmentation
            </button>
          </div>
          
          {rfmSegments?.segments && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">RFM Segments</h4>
              <div className="space-y-2">
                {['Champions', 'Loyal Customers', 'New Customers', 'At Risk', 'Lost'].map(segment => {
                  const count = rfmSegments.segments.filter(s => s.segment === segment).length;
                  return (
                    <div key={segment} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{segment}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Prediction (30 Days)
          </h3>
          {salesLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : salesPrediction ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span>Predicted Revenue</span>
                <span className="font-bold text-blue-700">
                  ₹{salesPrediction.forecast?.reduce((sum, f) => sum + f.predicted_revenue, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span>Predicted Orders</span>
                <span className="font-bold text-green-700">
                  {salesPrediction.forecast?.reduce((sum, f) => sum + f.predicted_orders, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span>Trend</span>
                <span className="font-bold text-purple-700">
                  {salesPrediction.trend > 0 ? '+' : ''}{(salesPrediction.trend * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => refetchSalesPrediction()}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition"
            >
              Generate Sales Prediction
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderSegmentation = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Customer Segmentation Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">RFM Segmentation</h4>
            {rfmLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : rfmSegments?.segments ? (
              <div className="space-y-2">
                {rfmSegments.segments.map((segment, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{segment.segment}</span>
                      <span className="text-sm text-gray-500">Score: {segment.rfm_total}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Recency: {segment.recency_score} | Frequency: {segment.frequency_score} | Monetary: {segment.monetary_score}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={() => refetchRfmSegments()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded"
              >
                Generate RFM Segments
              </button>
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Behavioral Segmentation</h4>
            {behavioralLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : behavioralSegments?.segments ? (
              <div className="space-y-2">
                {behavioralSegments.segments.map((segment, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{segment.behavioral_segment}</span>
                      <span className="text-sm text-gray-500">{segment.total_orders} orders</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Categories: {segment.categories_purchased} | Avg Quantity: {segment.avg_quantity_per_order}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={() => refetchBehavioralSegments()}
                className="w-full bg-green-500 text-white py-2 px-4 rounded"
              >
                Generate Behavioral Segments
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderForecasting = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Demand Forecasting</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Product
          </label>
          <input
            type="text"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            placeholder="Enter Product ID"
            className="w-full p-2 border rounded"
          />
        </div>
        
        {selectedProduct && (
          <div>
            {demandLoading ? (
              <p className="text-gray-500">Loading forecast...</p>
            ) : demandForecast ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded">
                  <h4 className="font-medium mb-2">Forecast Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Historical Data Points:</span>
                      <span className="font-semibold">{demandForecast.historical_data_points}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Forecast Method:</span>
                      <span className="font-semibold">{demandForecast.forecast_method}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Trend:</span>
                      <span className="font-semibold">{(demandForecast.trend * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">30-Day Prediction:</span>
                      <span className="font-semibold">
                        {demandForecast.forecast?.reduce((sum, f) => sum + f.predicted_quantity, 0).toFixed(0)} units
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded">
                  <h4 className="font-medium mb-2">7-Day Forecast</h4>
                  <div className="space-y-2">
                    {demandForecast.forecast?.slice(0, 7).map((day, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{day.date}</span>
                        <span className="font-semibold">{day.predicted_quantity} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => refetchDemandForecast()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded"
              >
                Generate Forecast
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory Optimization</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Product
          </label>
          <input
            type="text"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            placeholder="Enter Product ID"
            className="w-full p-2 border rounded"
          />
        </div>
        
        {selectedProduct && (
          <div>
            {inventoryLoading ? (
              <p className="text-gray-500">Loading optimization...</p>
            ) : inventoryOptimization ? (
              <div className="space-y-4">
                <div className={`p-4 rounded ${inventoryOptimization.optimization.stock_health === 'HEALTHY' ? 'bg-green-50' : inventoryOptimization.optimization.stock_health === 'LOW' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Stock Health: {inventoryOptimization.optimization.stock_health}</h4>
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Current Stock:</span>
                      <span className="font-semibold">{inventoryOptimization.optimization.current_stock}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Predicted Demand:</span>
                      <span className="font-semibold">{inventoryOptimization.optimization.predicted_30_day_demand}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Safety Stock:</span>
                      <span className="font-semibold">{inventoryOptimization.optimization.safety_stock}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reorder Point:</span>
                      <span className="font-semibold">{inventoryOptimization.optimization.reorder_point}</span>
                    </div>
                  </div>
                </div>
                
                {inventoryOptimization.optimization.order_recommendation === 'ORDER NOW' && (
                  <div className="p-4 bg-orange-50 rounded border-2 border-orange-500">
                    <h4 className="font-medium mb-2 text-orange-800">⚠️ Action Required</h4>
                    <p className="text-sm text-orange-700 mb-2">
                      Recommended Order Quantity: {inventoryOptimization.optimization.recommended_order_quantity}
                    </p>
                    <button className="bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition">
                      Create Purchase Order
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => refetchInventoryOptimization()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded"
              >
                Optimize Inventory
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Personalized Recommendations</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select User ID
          </label>
          <input
            type="text"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            placeholder="Enter User ID"
            className="w-full p-2 border rounded"
          />
        </div>
        
        {selectedUser && (
          <div>
            {recommendationsLoading ? (
              <p className="text-gray-500">Loading recommendations...</p>
            ) : recommendations ? (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded">
                <h4 className="font-medium mb-2">User Segment: {recommendations.user_segment}</h4>
                <p className="text-sm text-gray-600">
                  {recommendations.recommendations.length} personalized recommendations
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.recommendations.map((product, index) => (
                  <div key={index} className="p-4 border rounded hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium">{product.product_name}</h5>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {product.recommendation_score.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.recommendation_reason}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Price: ₹{product.base_price}</span>
                      <span className="text-gray-500">Nutrition: {product.nutrition_grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => refetchRecommendations()}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded"
            >
              Get Recommendations
            </button>
          )}
        </div>
      )}
      </div>
    </div>
  );

  const renderCLV = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Customer Lifetime Value</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select User ID
          </label>
          <input
            type="text"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            placeholder="Enter User ID"
            className="w-full p-2 border rounded"
          />
        </div>
        
        {selectedUser && (
          <div>
            {clvLoading ? (
              <p className="text-gray-500">Loading CLV data...</p>
            ) : clvData ? (
              <div className="space-y-4">
                <div className={`p-4 rounded ${clvData.customer_tier === 'Platinum' ? 'bg-purple-100' : clvData.customer_tier === 'Gold' ? 'bg-yellow-100' : clvData.customer_tier === 'Silver' ? 'bg-gray-200' : 'bg-orange-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Customer Tier: {clvData.customer_tier}</h4>
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Revenue:</span>
                      <span className="font-semibold">₹{clvData.total_revenue.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Orders:</span>
                      <span className="font-semibold">{clvData.total_orders}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Order Value:</span>
                      <span className="font-semibold">₹{clvData.avg_order_value.toFixed(0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer Lifetime:</span>
                      <span className="font-semibold">{clvData.customer_lifetime_days} days</span>
                    </div>
                    <div>
                      <span className="text-gray-600">CLV:</span>
                      <span className="font-semibold text-lg">₹{clvData.clv.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Predicted 12-Month Value:</span>
                      <span className="font-semibold">₹{clvData.predicted_12_month_value.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Churn Risk:</span>
                      <span className={`font-semibold ${clvData.churn_risk === 'high' ? 'text-red-600' : clvData.churn_risk === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {clvData.churn_risk}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => refetchClvData()}
                className="w-full bg-green-500 text-white py-2 px-4 rounded"
              >
                Calculate CLV
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderMarketBasket = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Market Basket Analysis
        </h3>
        
        {basketLoading ? (
          <p className="text-gray-500">Loading market basket data...</p>
        ) : marketBasket?.recommendations ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {marketBasket.recommendations.length} cross-sell opportunities found
            </p>
            
            <div className="space-y-3">
              {marketBasket.recommendations.map((pair, index) => (
                <div key={index} className="p-4 border rounded hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium">{pair.product_a.name}</h5>
                      <p className="text-sm text-gray-500">₹{pair.product_a.price}</p>
                    </div>
                    <span className="text-lg">+</span>
                    <div>
                      <h5 className="font-medium">{pair.product_b.name}</h5>
                      <p className="text-sm text-gray-500">₹{pair.product_b.price}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                    <span className="text-gray-500">Co-occurrence: {pair.co_occurrence}</span>
                    <span className="text-gray-500">Lift Ratio: {pair.lift_ratio.toFixed(2)}</span>
                    <span className={`text-xs px-2 py-1 rounded ${pair.cross_sell_confidence === 'high' ? 'bg-green-100 text-green-800' : pair.cross_sell_confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {pair.cross_sell_confidence} confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => refetchMarketBasket()}
            className="w-full bg-purple-500 text-white py-2 px-4 rounded"
          >
            Analyze Market Basket
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            AI-powered marketplace intelligence and optimization
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
              onClick={() => setActiveTab('segmentation')}
              className={`px-4 py-3 font-medium ${activeTab === 'segmentation' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Segmentation
            </button>
            <button
              onClick={() => setActiveTab('forecasting')}
              className={`px-4 py-3 font-medium ${activeTab === 'forecasting' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Forecasting
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-3 font-medium ${activeTab === 'inventory' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-3 font-medium ${activeTab === 'recommendations' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Recommendations
            </button>
            <button
              onClick={() => setActiveTab('clv')}
              className={`px-4 py-3 font-medium ${activeTab === 'clv' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Customer Lifetime Value
            </button>
            <button
              onClick={() => setActiveTab('marketbasket')}
              className={`px-4 py-3 font-medium ${activeTab === 'marketbasket' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
            >
              Market Basket
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'segmentation' && renderSegmentation()}
          {activeTab === 'forecasting' && renderForecasting()}
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'recommendations' && renderRecommendations()}
          {activeTab === 'clv' && renderCLV()}
          {activeTab === 'marketbasket' && renderMarketBasket()}
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
