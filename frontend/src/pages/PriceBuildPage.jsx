import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmersAPI } from '../services/api';
import { Calculator, TrendingUp, Info, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function PriceBuildPage() {
  const [costs, setCosts] = useState({
    seeds: 0,
    fertilizers: 0,
    labor: 0,
    irrigation: 0,
    equipment: 0,
    transport: 0,
    other: 0,
  });
  const [expectedYield, setExpectedYield] = useState('');
  const [profitMargin, setProfitMargin] = useState(20);
  const queryClient = useQueryClient();

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: benchmarkPrices } = useQuery({
    queryKey: ['benchmark-prices'],
    queryFn: () => farmersAPI.getBenchmarkPrices().then(r => r.data),
  });

  const { data: marketConditions } = useQuery({
    queryKey: ['market-conditions'],
    queryFn: () => farmersAPI.getMarketConditions().then(r => r.data),
  });

  const savePricingMutation = useMutation({
    mutationFn: (data) => farmersAPI.savePricingModel(data),
    onSuccess: () => {
      toast.success('Pricing model saved successfully');
      queryClient.invalidateQueries({ queryKey: ['pricing-models'] });
    },
    onError: () => {
      toast.error('Failed to save pricing model');
    },
  });

  const totalCosts = Object.values(costs).reduce((sum, val) => sum + Number(val), 0);
  const costPerUnit = expectedYield ? totalCosts / Number(expectedYield) : 0;
  const sellingPrice = costPerUnit * (1 + profitMargin / 100);
  const profitAmount = sellingPrice - costPerUnit;

  const handleCostChange = (category, value) => {
    setCosts(prev => ({ ...prev, [category]: Number(value) || 0 }));
  };

  const handleSaveModel = () => {
    savePricingMutation.mutate({
      costs,
      expected_yield: expectedYield,
      profit_margin: profitMargin,
      calculated_price: sellingPrice,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Calculator className="w-8 h-8 mr-3 text-green-600" />
            Price Builder
          </h1>
          <p className="text-gray-600">Calculate optimal selling prices based on your costs and market conditions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Input */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Production Costs</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seeds (₹)
                </label>
                <input
                  type="number"
                  value={costs.seeds}
                  onChange={(e) => handleCostChange('seeds', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fertilizers (₹)
                </label>
                <input
                  type="number"
                  value={costs.fertilizers}
                  onChange={(e) => handleCostChange('fertilizers', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Labor (₹)
                </label>
                <input
                  type="number"
                  value={costs.labor}
                  onChange={(e) => handleCostChange('labor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Irrigation (₹)
                </label>
                <input
                  type="number"
                  value={costs.irrigation}
                  onChange={(e) => handleCostChange('irrigation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment (₹)
                </label>
                <input
                  type="number"
                  value={costs.equipment}
                  onChange={(e) => handleCostChange('equipment', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport (₹)
                </label>
                <input
                  type="number"
                  value={costs.transport}
                  onChange={(e) => handleCostChange('transport', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other (₹)
                </label>
                <input
                  type="number"
                  value={costs.other}
                  onChange={(e) => handleCostChange('other', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Total Costs</span>
                <span className="text-2xl font-bold text-gray-900">₹{totalCosts.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Price Calculation */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Price Calculation</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Yield (quintals)
                  </label>
                  <input
                    type="number"
                    value={expectedYield}
                    onChange={(e) => setExpectedYield(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profit Margin: {profitMargin}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost per Unit</span>
                    <span className="font-medium">₹{costPerUnit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit per Unit</span>
                    <span className="font-medium text-green-600">₹{profitAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-gray-800">Selling Price</span>
                    <span className="text-2xl font-bold text-green-600">₹{sellingPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Comparison */}
            {benchmarkPrices && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Market Comparison
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Your Price</span>
                    <span className="font-semibold text-gray-800">₹{sellingPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-600">Market Average</span>
                    <span className="font-semibold text-blue-600">₹{benchmarkPrices.average}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">Market High</span>
                    <span className="font-semibold text-green-600">₹{benchmarkPrices.high}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-gray-600">Market Low</span>
                    <span className="font-semibold text-red-600">₹{benchmarkPrices.low}</span>
                  </div>
                </div>

                {sellingPrice > benchmarkPrices.high && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        Your price is above market high. Consider competitive pricing for faster sales.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleSaveModel}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Save Pricing Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceBuildPage;
