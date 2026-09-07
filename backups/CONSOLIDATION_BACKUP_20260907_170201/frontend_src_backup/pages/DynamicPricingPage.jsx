import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { farmersAPI } from '../services/api'
import { Activity, Zap, Target, BarChart3, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react'

function DynamicPricingPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  const [selectedCommodity, setSelectedCommodity] = useState('all')

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: priceDynamics } = useQuery({
    queryKey: ['price-dynamics', selectedTimeframe, selectedCommodity],
    queryFn: () => farmersAPI.getPriceDynamics(selectedTimeframe, selectedCommodity).then(r => r.data),
  })

  const { data: demandForecast } = useQuery({
    queryKey: ['demand-forecast'],
    queryFn: () => farmersAPI.getDemandForecast().then(r => r.data),
  })

  const { data: priceSignals } = useQuery({
    queryKey: ['price-signals'],
    queryFn: () => farmersAPI.getPriceSignals().then(r => r.data),
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dynamic Pricing</h1>
        <p className="text-gray-600">AI-powered price optimization based on market dynamics and demand patterns</p>
      </div>

      {/* Timeframe Selector */}
      <div className="flex space-x-2 mb-6">
        {[
          { id: '24h', label: '24 Hours' },
          { id: '7d', label: '7 Days' },
          { id: '30d', label: '30 Days' },
          { id: '90d', label: '90 Days' }
        ].map((timeframe) => (
          <button
            key={timeframe.id}
            onClick={() => setSelectedTimeframe(timeframe.id)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedTimeframe === timeframe.id
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {timeframe.label}
          </button>
        ))}
      </div>

      {/* Price Signals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {priceSignals?.map((signal) => (
          <div
            key={signal.id}
            className={`rounded-lg p-4 ${
              signal.signal === 'buy' ? 'bg-green-50 border border-green-200' :
              signal.signal === 'sell' ? 'bg-red-50 border border-red-200' :
              'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{signal.commodity}</span>
              {signal.signal === 'buy' ? (
                <ArrowUp className="w-5 h-5 text-green-600" />
              ) : signal.signal === 'sell' ? (
                <ArrowDown className="w-5 h-5 text-red-600" />
              ) : (
                <Minus className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{signal.current_price}</div>
            <div className={`text-sm mt-1 ${
              signal.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {signal.change >= 0 ? '+' : ''}{signal.change}%
            </div>
          </div>
        ))}
      </div>

      {/* Price Dynamics Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-600" />
            Price Dynamics
          </h2>
          <select aria-label="Select an option"
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Commodities</option>
            <option value="rice">Rice</option>
            <option value="wheat">Wheat</option>
            <option value="mustard">Mustard</option>
          </select>
        </div>

        {/* Chart Placeholder */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p>Price dynamics chart visualization</p>
            <p className="text-sm">Shows price trends over selected timeframe</p>
          </div>
        </div>
      </div>

      {/* Demand Forecast */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-600" />
          Demand Forecast
        </h2>

        <div className="space-y-4">
          {demandForecast?.map((forecast) => (
            <div key={forecast.commodity} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{forecast.commodity}</h3>
                  <p className="text-sm text-gray-500">{forecast.category}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{forecast.demand_level}</div>
                  <div className="text-sm text-gray-500">Expected demand</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Current Price</div>
                  <div className="font-medium">₹{forecast.current_price}</div>
                </div>
                <div>
                  <div className="text-gray-600">Forecasted Price</div>
                  <div className="font-medium text-green-600">₹{forecast.forecasted_price}</div>
                </div>
                <div>
                  <div className="text-gray-600">Confidence</div>
                  <div className="font-medium">{forecast.confidence}%</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price Impact</span>
                  <span className={`font-medium ${
                    forecast.price_impact >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {forecast.price_impact >= 0 ? '+' : ''}{forecast.price_impact}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-600" />
          AI Pricing Recommendations
        </h2>

        <div className="space-y-4">
          {[
            {
              commodity: 'Rice',
              action: 'Increase price by 5%',
              reason: 'High demand expected in next 2 weeks due to festival season',
              confidence: 85,
              urgency: 'high'
            },
            {
              commodity: 'Wheat',
              action: 'Hold current price',
              reason: 'Market stable, no significant demand changes expected',
              confidence: 72,
              urgency: 'low'
            },
            {
              commodity: 'Mustard',
              action: 'Consider discount of 3%',
              reason: 'Oversupply in regional markets, competitive pressure',
              confidence: 68,
              urgency: 'medium'
            }
          ].map((rec, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{rec.commodity}</h3>
                  <p className="text-sm text-gray-600">{rec.action}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  rec.urgency === 'high' ? 'bg-red-100 text-red-800' :
                  rec.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {rec.urgency} urgency
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  Valid for next 7 days
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium text-green-600 ml-1">{rec.confidence}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DynamicPricingPage