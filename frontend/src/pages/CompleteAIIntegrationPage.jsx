import { Brain } from 'lucide-react';
import { completeAIIntegrationAPI } from '../services/api';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/completeAIIntegrationRoutes.js +
 * completeAIIntegrationController.js + services/legacy/completeAIIntegrationService.js.
 * Same shape as CompleteERPIntegrationPage.jsx but AI-driven: predictive
 * analytics, disease detection, yield prediction, resource optimization
 * across farmer/crop/livestock/inbuilt modules.
 */
function CompleteAIIntegrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-violet-600" />
          Complete AI Integration
        </h1>
        <p className="text-gray-600">AI-driven predictions and optimization across farmer, crop, livestock and inbuilt modules.</p>
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Farmer Module</h2>
      <ActionCard
        title="Crop Planning Recommendation"
        description="AI recommendation for a farmer's crop planning."
        fields={[{ name: 'farmerId', label: 'Farmer ID' }]}
        hasJsonPayload
        jsonLabel="Context data (JSON)"
        jsonPlaceholder='{"soilType": "loamy", "season": "kharif"}'
        onRun={(v, payload) => completeAIIntegrationAPI.recommendCropPlanning(v.farmerId, payload)}
      />
      <ActionCard
        title="Harvest Timing Prediction"
        description="Predict optimal harvest timing for a farmer's crop."
        fields={[{ name: 'farmerId', label: 'Farmer ID' }]}
        hasJsonPayload
        jsonPlaceholder='{"crop": "rice", "sownOn": "2026-06-01"}'
        onRun={(v, payload) => completeAIIntegrationAPI.predictHarvestTiming(v.farmerId, payload)}
      />
      <ActionCard
        title="Resource Optimization"
        description="AI-optimize a farmer's resource allocation."
        fields={[{ name: 'farmerId', label: 'Farmer ID' }]}
        hasJsonPayload
        jsonPlaceholder='{"resources": ["water", "fertilizer"]}'
        onRun={(v, payload) => completeAIIntegrationAPI.optimizeFarmerResources(v.farmerId, payload)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Crop Module</h2>
      <ActionCard
        title="Disease Detection"
        description="AI-detect disease risk/presence for a crop."
        fields={[{ name: 'cropId', label: 'Crop ID' }]}
        hasJsonPayload
        jsonLabel="Symptoms / image metadata (JSON)"
        jsonPlaceholder='{"symptoms": ["yellow leaves"]}'
        onRun={(v, payload) => completeAIIntegrationAPI.detectCropDisease(v.cropId, payload)}
      />
      <ActionCard
        title="Yield Prediction"
        description="AI-predict expected crop yield."
        fields={[{ name: 'cropId', label: 'Crop ID' }]}
        hasJsonPayload
        jsonPlaceholder='{"areaAcres": 5}'
        onRun={(v, payload) => completeAIIntegrationAPI.predictCropYield(v.cropId, payload)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Livestock Module</h2>
      <ActionCard
        title="Health Monitoring"
        description="AI health-monitoring analysis for livestock."
        fields={[{ name: 'livestockId', label: 'Livestock ID' }]}
        hasJsonPayload
        jsonPlaceholder='{"vitals": {"tempC": 38.5}}'
        onRun={(v, payload) => completeAIIntegrationAPI.monitorLivestockHealth(v.livestockId, payload)}
      />
      <ActionCard
        title="Breeding Recommendation"
        description="AI breeding recommendation for livestock."
        fields={[{ name: 'livestockId', label: 'Livestock ID' }]}
        hasJsonPayload
        onRun={(v, payload) => completeAIIntegrationAPI.recommendLivestockBreeding(v.livestockId, payload)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Inbuilt Modules</h2>
      <ActionCard title="Optimize Dairy Production" description="AI-optimize dairy production." fields={[{ name: 'dairyId', label: 'Dairy ID' }]} hasJsonPayload onRun={(v, payload) => completeAIIntegrationAPI.optimizeDairyProduction(v.dairyId, payload)} />
      <ActionCard title="Monitor Poultry Health" description="AI poultry health monitoring." fields={[{ name: 'poultryId', label: 'Poultry ID' }]} hasJsonPayload onRun={(v, payload) => completeAIIntegrationAPI.monitorPoultryHealth(v.poultryId, payload)} />
      <ActionCard title="Optimize Goat Production" description="AI-optimize goat production." fields={[{ name: 'goatId', label: 'Goat ID' }]} hasJsonPayload onRun={(v, payload) => completeAIIntegrationAPI.optimizeGoatProduction(v.goatId, payload)} />
      <ActionCard title="Optimize Sheep Production" description="AI-optimize sheep production." fields={[{ name: 'sheepId', label: 'Sheep ID' }]} hasJsonPayload onRun={(v, payload) => completeAIIntegrationAPI.optimizeSheepProduction(v.sheepId, payload)} />
      <ActionCard title="Optimize Pig Production" description="AI-optimize pig production." fields={[{ name: 'pigId', label: 'Pig ID' }]} hasJsonPayload onRun={(v, payload) => completeAIIntegrationAPI.optimizePigProduction(v.pigId, payload)} />

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Bulk Operations</h2>
      <ActionCard
        title="AI Integration Status"
        description="Get AI integration status across all modules."
        fields={[{ name: 'farmerId', label: 'Farmer ID (optional)' }, { name: 'cropId', label: 'Crop ID (optional)' }, { name: 'livestockId', label: 'Livestock ID (optional)' }]}
        onRun={(v) => completeAIIntegrationAPI.getAIIntegrationStatus(v)}
      />
      <ActionCard
        title="Force Sync All AI Integrations"
        description="Force-sync all provided modules' AI integrations at once."
        hasJsonPayload
        jsonPlaceholder='{"farmerId": "F-1", "cropId": "C-1", "livestockId": "L-1"}'
        onRun={(_, payload) => completeAIIntegrationAPI.forceSyncAllAIIntegrations(payload)}
      />
      <ActionCard
        title="AI Model Info"
        description="Get information about the AI models backing this integration layer."
        onRun={() => completeAIIntegrationAPI.getAIModelInfo()}
      />
    </div>
  );
}

export default CompleteAIIntegrationPage;
