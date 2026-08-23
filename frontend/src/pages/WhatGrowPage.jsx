import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { farmersAPI } from '../services/api'
import { Sprout, Search, TrendingUp, Droplets, Sun, MapPin, DollarSign, Info } from 'lucide-react'

function WhatGrowPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeason, setSelectedSeason] = useState('kharif')
  const [selectedSoil, setSelectedSoil] = useState('')
  const [selectedCrop, setSelectedCrop] = useState(null)

  // v5 react-query object syntax (see LoginPage.jsx); .then(r => r.data)
  // unwraps the axios response so cropSuggestions is the real array
  // (.filter below would otherwise call .filter on an axios response object).
  const { data: cropSuggestions } = useQuery({
    queryKey: ['crop-suggestions', selectedSeason, selectedSoil],
    queryFn: () => farmersAPI.getCropSuggestions(selectedSeason, selectedSoil).then(r => r.data),
  })

  const { data: marketPrices } = useQuery({
    queryKey: ['market-prices'],
    queryFn: () => farmersAPI.getMarketPrices().then(r => r.data),
  })

  const filteredCrops = cropSuggestions?.filter(crop =>
    crop.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">What to Grow</h1>
        <p className="text-gray-600">Get personalized crop recommendations based on your location, soil, and market conditions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="w-4 h-4 inline mr-1" />
              Search Crops
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by crop name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="kharif">Kharif (Monsoon)</option>
              <option value="rabi">Rabi (Winter)</option>
              <option value="zaid">Zaid (Summer)</option>
              <option value="perennial">Perennial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Soil Type
            </label>
            <select
              value={selectedSoil}
              onChange={(e) => setSelectedSoil(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Soil Types</option>
              <option value="alluvial">Alluvial</option>
              <option value="black">Black Soil</option>
              <option value="red">Red Soil</option>
              <option value="laterite">Laterite</option>
              <option value="mountain">Mountain Soil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Crop Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredCrops?.map((crop) => (
          <div
            key={crop.id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                // Enter and Space are what a native <button> responds to.
                // Without this the card is unreachable by keyboard entirely.
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click() }
              }}
            className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
            onClick={() => setSelectedCrop(crop)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">{crop.name}</h3>
                {crop.recommended && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Recommended
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                  <span>Profitability: <strong>{crop.profitability}%</strong></span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Droplets className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Water: {crop.water_requirement}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Sun className="w-4 h-4 mr-2 text-orange-600" />
                  <span>Duration: {crop.duration} days</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                  <span>Suitable for: {crop.suitable_regions.join(', ')}</span>
                </div>
              </div>

              {/* Suitability Score */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Suitability Score</span>
                  <span className="text-sm font-medium text-gray-800">{crop.suitability_score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      crop.suitability_score >= 80 ? 'bg-green-600' :
                      crop.suitability_score >= 60 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${crop.suitability_score}%` }}
                  />
                </div>
              </div>

              {/* Market Price */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">Current Market Price</div>
                <div className="font-semibold text-gray-800">₹{crop.current_price}/quintal</div>
              </div>
            </div>
          </div>
        )) || (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No crops found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Info className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">How Recommendations Work</h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Based on your soil type, location, and seasonal conditions</li>
              <li>• Takes into account current market prices and demand trends</li>
              <li>• Considers water requirements and climate suitability</li>
              <li>• Updated regularly with market data and agricultural research</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Crop Detail Modal */}
      {selectedCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-modal">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{selectedCrop.name}</h2>
                <button
                  onClick={() => setSelectedCrop(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Detailed Information */}
              <div className="space-y-6">
                {/* Overview */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Overview</h3>
                  <p className="text-sm text-green-700">{selectedCrop.description}</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold text-gray-800">{selectedCrop.duration} days</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Expected Yield</div>
                    <div className="font-semibold text-gray-800">{selectedCrop.expected_yield}/ha</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Water Need</div>
                    <div className="font-semibold text-gray-800">{selectedCrop.water_requirement}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Market Price</div>
                    <div className="font-semibold text-gray-800">₹{selectedCrop.current_price}/q</div>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Growing Requirements</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Droplets className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="text-gray-600">Irrigation: {selectedCrop.irrigation}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Sun className="w-4 h-4 mr-2 text-orange-600" />
                      <span className="text-gray-600">Sunlight: {selectedCrop.sunlight}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Sprout className="w-4 h-4 mr-2 text-green-600" />
                      <span className="text-gray-600">Fertilizer: {selectedCrop.fertilizer}</span>
                    </div>
                  </div>
                </div>

                {/* Market Analysis */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Market Analysis</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Current Demand</span>
                      <span className={`font-medium ${
                        selectedCrop.demand_level === 'High' ? 'text-green-600' :
                        selectedCrop.demand_level === 'Medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {selectedCrop.demand_level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Price Trend (6 months)</span>
                      <span className={`font-medium ${selectedCrop.price_trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedCrop.price_trend >= 0 ? '+' : ''}{selectedCrop.price_trend}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Profit Margin</span>
                      <span className="font-medium text-green-600">{selectedCrop.profit_margin}%</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                    <DollarSign className="w-5 h-5 inline mr-2" />
                    Plan This Crop
                  </button>
                  <button className="flex-1 px-4 py-3 border border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition">
                    View Growing Guide
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

export default WhatGrowPage