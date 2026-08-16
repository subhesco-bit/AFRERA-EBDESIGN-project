import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { farmersAPI } from '../services/api'
import { 
  Calendar, 
  Sprout, 
  CloudSun, 
  Droplets, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'

function HarvestPlanPage() {
  const [selectedSeason, setSelectedSeason] = useState('current')
  const [selectedCrop, setSelectedCrop] = useState(null)

  const { data: harvestPlans } = useQuery(
    ['harvest-plans', selectedSeason],
    () => farmersAPI.getHarvestPlans('current-farmer-id', selectedSeason)
  )

  const { data: weatherForecast } = useQuery(
    'weather-forecast',
    () => farmersAPI.getWeatherForecast('current-farmer-id')
  )

  const { data: cropRecommendations } = useQuery(
    'crop-recommendations',
    () => farmersAPI.getCropRecommendations('current-farmer-id')
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Harvest Planning</h1>
        <p className="text-gray-600">Plan your harvest schedule based on weather, market conditions, and crop cycles</p>
      </div>

      {/* Season Selector */}
      <div className="flex space-x-2 mb-6">
        {[
          { id: 'current', label: 'Current Season' },
          { id: 'next', label: 'Next Season' },
          { id: 'annual', label: 'Annual View' }
        ].map((season) => (
          <button
            key={season.id}
            onClick={() => setSelectedSeason(season.id)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedSeason === season.id
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {season.label}
          </button>
        ))}
      </div>

      {/* Weather Alert */}
      {weatherForecast?.alert && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-800">Weather Alert</div>
              <div className="text-sm text-yellow-700 mt-1">{weatherForecast.alert}</div>
            </div>
          </div>
        </div>
      )}

      {/* Harvest Timeline */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-green-600" />
          Harvest Timeline
        </h2>

        <div className="space-y-4">
          {harvestPlans?.map((plan) => (
            <div key={plan.id} className="border-l-4 border-green-500 pl-4 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{plan.crop}</div>
                  <div className="text-sm text-gray-600">
                    {plan.field} • {plan.area} hectares
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-800">{plan.harvest_date}</div>
                  <div className={`text-sm ${
                    plan.days_remaining <= 7 ? 'text-red-600' :
                    plan.days_remaining <= 14 ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    {plan.days_remaining} days remaining
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Growth Progress</span>
                  <span>{plan.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${plan.progress}%` }}
                  />
                </div>
              </div>

              {/* Weather Impact */}
              {plan.weather_impact && (
                <div className="mt-2 flex items-center text-sm">
                  <CloudSun className="w-4 h-4 text-blue-600 mr-1" />
                  <span className="text-gray-600">{plan.weather_impact}</span>
                </div>
              )}
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              No harvest plans for this season
            </div>
          )}
        </div>
      </div>

      {/* Crop Recommendations */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Sprout className="w-5 h-5 mr-2 text-green-600" />
          Recommended Crops for Next Season
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cropRecommendations?.map((crop) => (
            <div
              key={crop.id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                // Enter and Space are what a native <button> responds to.
                // Without this the card is unreachable by keyboard entirely.
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click() }
              }}
              className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedCrop(crop)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{crop.name}</h3>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">{crop.profitability}%</span>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <Droplets className="w-4 h-4 mr-2 text-blue-600" />
                  Water: {crop.water_requirement}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-orange-600" />
                  Duration: {crop.duration} days
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                  Expected Yield: {crop.expected_yield}/ha
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-gray-500 mb-1">Market Demand</div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      crop.demand === 'High' ? 'bg-green-600' :
                      crop.demand === 'Medium' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: crop.demand === 'High' ? '90%' : crop.demand === 'Medium' ? '60%' : '30%' }}
                  />
                </div>
              </div>
            </div>
          )) || (
            <div className="col-span-full text-center py-8 text-gray-500">
              No recommendations available
            </div>
          )}
        </div>
      </div>

      {/* Planning Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          Harvest Planning Tips
        </h2>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>Monitor weather forecasts 2 weeks before planned harvest</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>Arrange labor and transportation in advance</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>Ensure proper storage facilities are ready</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>Check market prices and time your harvest for optimal returns</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>Prepare necessary equipment and conduct maintenance</span>
          </li>
        </ul>
      </div>

      {/* Crop Detail Modal */}
      {selectedCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{selectedCrop.name}</h2>
                <button
                  onClick={() => setSelectedCrop(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Expected Yield</div>
                    <div className="font-semibold text-gray-800">{selectedCrop.expected_yield}/ha</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold text-gray-800">{selectedCrop.duration} days</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Water Requirement</div>
                    <div className="font-semibold text-gray-800">{selectedCrop.water_requirement}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Market Demand</div>
                    <div className="font-semibold text-gray-800">{selectedCrop.demand}</div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Profitability Score</div>
                  <div className="text-2xl font-bold text-green-600">{selectedCrop.profitability}%</div>
                </div>

                <div className="flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                    Add to Plan
                  </button>
                  <button className="flex-1 px-4 py-2 border border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HarvestPlanPage