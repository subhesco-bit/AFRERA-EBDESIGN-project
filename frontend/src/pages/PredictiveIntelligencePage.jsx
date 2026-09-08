/**
 * Predictive Intelligence Page
 * Production-level AI predictions and forecasting interface
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect as Select } from '../components/ui/select';
import { LoadingSkeleton } from '../components/ui/enhancedComponents';
import { predictiveAnalyticsAPI } from '../services/api';

const PredictiveIntelligencePage = () => {
  const [cropType, setCropType] = useState('rice');
  const [region, setRegion] = useState('');
  const [forecastDays, setForecastDays] = useState(30);
  const [activeTab, setActiveTab] = useState('demand');

  // Demand forecast
  const { data: demandData, isLoading: demandLoading, error: demandError } = useQuery({
    queryKey: ['demandForecast', cropType, region, forecastDays],
    queryFn: () => predictiveAnalyticsAPI.getDemandForecast(cropType, { region, forecastDays }).then(res => res.data.data),
    enabled: activeTab === 'demand',
  });

  // Pricing prediction
  const { data: pricingData, isLoading: pricingLoading, error: pricingError } = useQuery({
    queryKey: ['pricingPrediction', cropType, region],
    queryFn: () => predictiveAnalyticsAPI.getPricingPrediction(cropType, { region }).then(res => res.data.data),
    enabled: activeTab === 'pricing',
  });

  const cropTypes = ['rice', 'wheat', 'maize', 'vegetables', 'fruits'];
  const regions = ['assam', 'meghalaya', 'manipur', 'nagaland', 'tripura'];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Predictive Intelligence</h1>

      {/* Input Controls */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Crop Type</label>
            <Select value={cropType} onChange={(e) => setCropType(e.target.value)}>
              {cropTypes.map(crop => (
                <option key={crop} value={crop}>{crop.charAt(0).toUpperCase() + crop.slice(1)}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Region</label>
            <Select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">All Regions</option>
              {regions.map(reg => (
                <option key={reg} value={reg}>{reg.charAt(0).toUpperCase() + reg.slice(1)}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Forecast Days</label>
            <Input
              type="number"
              value={forecastDays}
              onChange={(e) => setForecastDays(parseInt(e.target.value))}
              min="7"
              max="90"
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full">Run Prediction</Button>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {['demand', 'pricing', 'yield', 'seasonal'].map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Demand Forecast */}
      {activeTab === 'demand' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Demand Forecast</h2>
          {demandLoading ? (
            <LoadingSkeleton variant="rectangular" lines={4} />
          ) : demandError ? (
            <p className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
              Unable to load demand forecast: {demandError.message}
            </p>
          ) : demandData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Confidence Level</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(demandData.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Forecast Period</p>
                  <p className="text-2xl font-bold text-green-600">
                    {demandData.forecastDays} days
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Data Points</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {demandData.forecast?.length || 0}
                  </p>
                </div>
              </div>

              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Demand forecast chart would render here</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Forecast Summary</h3>
                {demandData.forecast?.slice(0, 5).map((day, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{day.date}</span>
                    <span className="font-medium">{Math.round(day.predictedDemand)} units</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      day.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                        day.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                      {day.trend}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Run a prediction to see results</p>
          )}
        </Card>
      )}

      {/* Pricing Prediction */}
      {activeTab === 'pricing' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Optimal Pricing Prediction</h2>
          {pricingLoading ? (
            <LoadingSkeleton variant="rectangular" lines={4} />
          ) : pricingError ? (
            <p className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
              Unable to load pricing prediction: {pricingError.message}
            </p>
          ) : pricingData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Predicted Price</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{pricingData.predictedPrice?.toFixed(2) || '0.00'}/kg
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {(pricingData.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Price Range</h3>
                <div className="flex justify-between">
                  <span className="text-red-600">Min: ₹{pricingData.priceRange?.min?.toFixed(2) || '0.00'}</span>
                  <span className="text-green-600">Max: ₹{pricingData.priceRange?.max?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Market Factors</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Market Average</span>
                    <span className="font-medium">₹{pricingData.marketFactors?.marketAverage?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Quality Adjustment</span>
                    <span className="font-medium">x{pricingData.marketFactors?.qualityAdjustment || '1.0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Market Volatility</span>
                    <span className="font-medium">₹{pricingData.marketFactors?.marketVolatility?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Run a prediction to see results</p>
          )}
        </Card>
      )}

      {/* Yield Prediction */}
      {activeTab === 'yield' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Crop Yield Prediction</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Farmer ID</label>
                <Input type="text" placeholder="Enter farmer ID" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Crop ID</label>
                <Input type="text" placeholder="Enter crop ID" />
              </div>
            </div>
            <Button>Predict Yield</Button>
            <p className="text-gray-500 text-sm">Select a farmer and crop to generate yield predictions</p>
          </div>
        </Card>
      )}

      {/* Seasonal Recommendations */}
      {activeTab === 'seasonal' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Seasonal Recommendations</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Region</label>
                <Select>
                  {regions.map(reg => (
                    <option key={reg} value={reg}>{reg.charAt(0).toUpperCase() + reg.slice(1)}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Season</label>
                <Select>
                  <option value="kharif">Kharif (Monsoon)</option>
                  <option value="rabi">Rabi (Winter)</option>
                  <option value="summer">Summer</option>
                </Select>
              </div>
            </div>
            <Button>Get Recommendations</Button>
            <p className="text-gray-500 text-sm">Select region and season for crop recommendations</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PredictiveIntelligencePage;
