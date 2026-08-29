import { Sprout } from 'lucide-react'
import { agriculturalIntelligenceAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

/**
 * Real backend: backend/src/routes/agriculturalIntelligenceRoutes.js +
 * services/legacy/agriculturalIntelligenceService.js. All 9 methods
 * verified to exist (2026-08-29). Routes through aiGatewayService
 * underneath, which honestly returns implemented:false where no real model
 * is connected rather than fabricated values. ActionCard pattern.
 */
function AgriculturalIntelligencePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Sprout className="w-6 h-6 mr-2 text-green-600" />
          Agricultural Intelligence
        </h1>
        <p className="text-gray-600">Crop yield, soil, weather, pest and irrigation AI. Returns implemented:false honestly where no real model is connected.</p>
      </div>

      <ActionCard
        title="Predict Crop Yield"
        description="Predict crop yield from farming parameters."
        hasJsonPayload
        jsonLabel="Parameters (JSON)"
        jsonPlaceholder='{"crop": "rice", "areaAcres": 5, "soilType": "loamy"}'
        onRun={(_, payload) => agriculturalIntelligenceAPI.predictCropYield(payload)}
      />
      <ActionCard
        title="Analyze Soil"
        description="Analyze soil data for nutrient/health insights."
        hasJsonPayload
        jsonLabel="Soil data (JSON)"
        jsonPlaceholder='{"ph": 6.5, "nitrogen": 40, "phosphorus": 20}'
        onRun={(_, payload) => agriculturalIntelligenceAPI.analyzeSoil(payload)}
      />
      <ActionCard
        title="Weather Intelligence"
        description="Get weather intelligence for a location and timeframe."
        fields={[{ name: 'location', label: 'Location' }, { name: 'timeframe', label: 'Timeframe (e.g. 7d)', placeholder: '7d' }]}
        onRun={(v) => agriculturalIntelligenceAPI.getWeatherIntelligence(v.location, v.timeframe)}
      />
      <ActionCard
        title="Predict Pest Outbreak"
        description="Predict likelihood of a pest outbreak from field parameters."
        hasJsonPayload
        jsonLabel="Parameters (JSON)"
        jsonPlaceholder='{"crop": "rice", "region": "Assam", "season": "kharif"}'
        onRun={(_, payload) => agriculturalIntelligenceAPI.predictPestOutbreak(payload)}
      />
      <ActionCard
        title="Recommend Crops"
        description="Recommend crops suited to given conditions."
        hasJsonPayload
        jsonLabel="Parameters (JSON)"
        jsonPlaceholder='{"soilType": "loamy", "region": "Assam", "season": "kharif"}'
        onRun={(_, payload) => agriculturalIntelligenceAPI.recommendCrops(payload)}
      />
      <ActionCard
        title="Optimize Irrigation"
        description="Get an optimized irrigation plan."
        hasJsonPayload
        jsonLabel="Parameters (JSON)"
        jsonPlaceholder='{"crop": "rice", "areaAcres": 5, "soilMoisture": 30}'
        onRun={(_, payload) => agriculturalIntelligenceAPI.optimizeIrrigation(payload)}
      />
      <ActionCard
        title="Recommend Fertilizer"
        description="Get fertilizer recommendations."
        hasJsonPayload
        jsonLabel="Parameters (JSON)"
        jsonPlaceholder='{"crop": "rice", "soilNutrients": {"nitrogen": 40}}'
        onRun={(_, payload) => agriculturalIntelligenceAPI.recommendFertilizer(payload)}
      />
      <ActionCard
        title="Agricultural Analytics"
        description="Get aggregate agricultural analytics."
        fields={[{ name: 'region', label: 'Region (optional)' }]}
        onRun={(v) => agriculturalIntelligenceAPI.getAgriculturalAnalytics(v)}
      />
      <ActionCard
        title="Health Check"
        description="Check the health of the agricultural intelligence service."
        onRun={() => agriculturalIntelligenceAPI.healthCheck()}
      />
    </div>
  )
}

export default AgriculturalIntelligencePage
