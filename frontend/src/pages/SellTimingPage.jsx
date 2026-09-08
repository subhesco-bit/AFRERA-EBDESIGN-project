import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { farmersAPI } from '../services/api';
import { Clock, TrendingUp, Calendar, BarChart3, AlertCircle, Info } from 'lucide-react';

function SellTimingPage() {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [timeframe, setTimeframe] = useState('30');

  // v5 react-query object syntax (see LoginPage.jsx)
  const { data: timingRecommendations } = useQuery({
    queryKey: ['timing-recommendations', selectedCrop],
    queryFn: () => farmersAPI.getTimingRecommendations(selectedCrop).then(r => r.data),
  });

  const { data: priceSeasonality } = useQuery({
    queryKey: ['price-seasonality'],
    queryFn: () => farmersAPI.getPriceSeasonality().then(r => r.data),
  });

  const { data: marketEvents } = useQuery({
    queryKey: ['market-events'],
    queryFn: () => farmersAPI.getMarketEvents().then(r => r.data),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sell Timing</h1>
        <p className="text-gray-600">Optimize your sales timing based on seasonal price patterns and market events</p>
      </div>

      {/* Crop Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Crop
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Crops</option>
              <option value="rice">Rice</option>
              <option value="wheat">Wheat</option>
              <option value="mustard">Mustard</option>
              <option value="potato">Potato</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Analysis Period
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="7">Next 7 Days</option>
              <option value="30">Next 30 Days</option>
              <option value="90">Next 90 Days</option>
              <option value="180">Next 6 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timing Recommendations */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-green-600" />
          Recommended Selling Windows
        </h2>

        <div className="space-y-4">
          {timingRecommendations?.map((rec) => (
            <div key={rec.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{rec.crop}</h3>
                  <p className="text-sm text-gray-500">{rec.variety}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  rec.urgency === 'high' ? 'bg-red-100 text-red-800' :
                    rec.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                }`}>
                  {rec.urgency} priority
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Best Window</div>
                  <div className="font-semibold text-gray-800">{rec.best_window}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Expected Price</div>
                  <div className="font-semibold text-green-600">₹{rec.expected_price}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Price Premium</div>
                  <div className="font-semibold text-blue-600">+{rec.premium}%</div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Confidence</div>
                  <div className="font-semibold text-gray-800">{rec.confidence}%</div>
                </div>
              </div>

              <div className="flex items-start p-3 bg-blue-50 rounded">
                <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <p className="text-sm text-blue-800">{rec.reasoning}</p>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              Select a crop to see timing recommendations
            </div>
          )}
        </div>
      </div>

      {/* Seasonal Price Patterns */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          Seasonal Price Patterns
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {priceSeasonality?.map((pattern) => (
            <div key={pattern.crop} className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">{pattern.crop}</h3>

              <div className="space-y-2">
                {pattern.months.map((month) => (
                  <div key={month.name} className="flex items-center">
                    <div className="w-20 text-sm text-gray-600">{month.name}</div>
                    <div className="flex-1 mx-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            month.index >= 80 ? 'bg-green-600' :
                              month.index >= 60 ? 'bg-yellow-600' :
                                'bg-red-600'
                          }`}
                          style={{ width: `${month.index}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm font-medium">
                      {month.price}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Peak Season</span>
                  <span className="font-medium text-green-600">{pattern.peak_season}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Low Season</span>
                  <span className="font-medium text-red-600">{pattern.low_season}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Market Events */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-purple-600" />
          Upcoming Market Events
        </h2>

        <div className="space-y-3">
          {marketEvents?.map((event) => (
            <div key={event.id} className="flex items-start p-4 border rounded-lg">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                event.impact === 'positive' ? 'bg-green-100' :
                  event.impact === 'negative' ? 'bg-red-100' :
                    'bg-gray-100'
              }`}>
                {event.impact === 'positive' ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : event.impact === 'negative' ? (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                ) : (
                  <Info className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-800">{event.name}</h3>
                  <span className="text-sm text-gray-500">{event.date}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className={'text-gray-600'}>Affected: {event.affected_crops.join(', ')}</span>
                  <span className={`font-medium ${
                    event.impact === 'positive' ? 'text-green-600' :
                      event.impact === 'negative' ? 'text-red-600' :
                        'text-gray-600'
                  }`}>
                    {event.impact} impact
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SellTimingPage;
