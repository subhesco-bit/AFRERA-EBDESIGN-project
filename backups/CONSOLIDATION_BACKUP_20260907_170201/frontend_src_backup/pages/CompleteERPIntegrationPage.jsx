import { Link2 } from 'lucide-react'
import { completeERPIntegrationAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

/**
 * Real backend: backend/src/routes/completeERPIntegrationRoutes.js +
 * completeERPIntegrationController.js + services/legacy/completeERPIntegrationService.js.
 * All 13 sync methods verified to exist on the service (2026-08-29). Action-oriented
 * sync triggers between farmer/crop/livestock/inbuilt modules and the ERP system,
 * not a CRUD resource - ActionCard pattern.
 */
function CompleteERPIntegrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Link2 className="w-6 h-6 mr-2 text-indigo-600" />
          Complete ERP Integration
        </h1>
        <p className="text-gray-600">Sync farmer, crop, livestock and inbuilt-module data with the ERP system's financial, supply chain, production and customer modules.</p>
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Farmer Module</h2>
      <ActionCard
        title="Sync Crop Planning"
        description="Sync a farmer's crop planning data with ERP production planning."
        fields={[{ name: 'farmerId', label: 'Farmer ID' }]}
        hasJsonPayload
        jsonLabel="Crop plan data (JSON)"
        jsonPlaceholder='{"season": "kharif", "crops": ["rice"]}'
        onRun={(v, payload) => completeERPIntegrationAPI.syncFarmerCropPlanning(v.farmerId, payload)}
      />
      <ActionCard
        title="Sync Harvest"
        description="Sync a farmer's harvest data with ERP inventory and financial modules."
        fields={[{ name: 'farmerId', label: 'Farmer ID' }]}
        hasJsonPayload
        jsonLabel="Harvest data (JSON)"
        jsonPlaceholder='{"crop": "rice", "quantityKg": 1200}'
        onRun={(v, payload) => completeERPIntegrationAPI.syncFarmerHarvest(v.farmerId, payload)}
      />
      <ActionCard
        title="Sync Field Data"
        description="Sync a farmer's field data with ERP asset management."
        fields={[{ name: 'farmerId', label: 'Farmer ID' }]}
        hasJsonPayload
        jsonLabel="Field data (JSON)"
        jsonPlaceholder='{"fieldId": "F-1", "areaAcres": 5}'
        onRun={(v, payload) => completeERPIntegrationAPI.syncFarmerField(v.farmerId, payload)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Crop Module</h2>
      <ActionCard
        title="Sync Crop Lifecycle"
        description="Sync crop lifecycle stages with ERP production tracking."
        fields={[{ name: 'cropId', label: 'Crop ID' }]}
        hasJsonPayload
        jsonLabel="Lifecycle data (JSON)"
        jsonPlaceholder='{"stage": "flowering"}'
        onRun={(v, payload) => completeERPIntegrationAPI.syncCropLifecycle(v.cropId, payload)}
      />
      <ActionCard
        title="Sync Crop Yield"
        description="Sync crop yield data with ERP inventory and financial modules."
        fields={[{ name: 'cropId', label: 'Crop ID' }]}
        hasJsonPayload
        jsonLabel="Yield data (JSON)"
        jsonPlaceholder='{"yieldKg": 3000}'
        onRun={(v, payload) => completeERPIntegrationAPI.syncCropYield(v.cropId, payload)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Livestock Module</h2>
      <ActionCard
        title="Sync Livestock"
        description="Sync livestock data with ERP asset management."
        fields={[{ name: 'livestockId', label: 'Livestock ID' }]}
        hasJsonPayload
        jsonPlaceholder='{"breed": "Jersey"}'
        onRun={(v, payload) => completeERPIntegrationAPI.syncLivestock(v.livestockId, payload)}
      />
      <ActionCard
        title="Sync Livestock Production"
        description="Sync livestock production data with ERP inventory and financial modules."
        fields={[{ name: 'livestockId', label: 'Livestock ID' }]}
        hasJsonPayload
        jsonPlaceholder='{"milkLitres": 12}'
        onRun={(v, payload) => completeERPIntegrationAPI.syncLivestockProduction(v.livestockId, payload)}
      />
      <ActionCard
        title="Sync Livestock Health"
        description="Sync livestock health events with ERP asset management and financial modules."
        fields={[{ name: 'livestockId', label: 'Livestock ID' }]}
        hasJsonPayload
        jsonPlaceholder='{"event": "vaccination"}'
        onRun={(v, payload) => completeERPIntegrationAPI.syncLivestockHealth(v.livestockId, payload)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Inbuilt Modules</h2>
      <ActionCard title="Sync Dairy Production" description="Sync dairy production with ERP." fields={[{ name: 'dairyId', label: 'Dairy ID' }]} hasJsonPayload onRun={(v, payload) => completeERPIntegrationAPI.syncDairyProduction(v.dairyId, payload)} />
      <ActionCard title="Sync Poultry Production" description="Sync poultry production with ERP." fields={[{ name: 'poultryId', label: 'Poultry ID' }]} hasJsonPayload onRun={(v, payload) => completeERPIntegrationAPI.syncPoultryProduction(v.poultryId, payload)} />
      <ActionCard title="Sync Goat Production" description="Sync goat production with ERP." fields={[{ name: 'goatId', label: 'Goat ID' }]} hasJsonPayload onRun={(v, payload) => completeERPIntegrationAPI.syncGoatProduction(v.goatId, payload)} />
      <ActionCard title="Sync Sheep Production" description="Sync sheep production with ERP." fields={[{ name: 'sheepId', label: 'Sheep ID' }]} hasJsonPayload onRun={(v, payload) => completeERPIntegrationAPI.syncSheepProduction(v.sheepId, payload)} />
      <ActionCard title="Sync Pig Production" description="Sync pig production with ERP." fields={[{ name: 'pigId', label: 'Pig ID' }]} hasJsonPayload onRun={(v, payload) => completeERPIntegrationAPI.syncPigProduction(v.pigId, payload)} />

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Bulk Operations</h2>
      <ActionCard
        title="Integration Status"
        description="Get ERP integration status across all modules."
        fields={[{ name: 'farmerId', label: 'Farmer ID (optional)' }, { name: 'cropId', label: 'Crop ID (optional)' }, { name: 'livestockId', label: 'Livestock ID (optional)' }]}
        onRun={(v) => completeERPIntegrationAPI.getERPIntegrationStatus(v)}
      />
      <ActionCard
        title="Force Sync All"
        description="Force-sync all provided modules' ERP integrations at once."
        hasJsonPayload
        jsonLabel="Sync targets (JSON)"
        jsonPlaceholder='{"farmerId": "F-1", "cropId": "C-1", "livestockId": "L-1"}'
        onRun={(_, payload) => completeERPIntegrationAPI.forceSyncAllERPIntegrations(payload)}
      />
    </div>
  )
}

export default CompleteERPIntegrationPage
