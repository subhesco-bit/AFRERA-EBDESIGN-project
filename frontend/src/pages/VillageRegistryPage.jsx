import { Building2 } from 'lucide-react'
import { villageAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

/**
 * M041 (backend/src/modules/M041, real functions verified). Rebuilt
 * (2026-08-28) as action cards - the real backend has exactly 3
 * action-oriented operations (create/addResource/getAnalytics), no
 * list/get/update/delete, so the previous CRUD-list assumption never had
 * anywhere to call. Checked for an alternative already-mounted backend
 * first (villageProfileService.js's setupRoutes() at /api/v1/village-profiles)
 * - it only exposes 4 read-only district/block lookups, not these 3
 * operations, so the generic backend-module bridge is genuinely the only
 * real path for create/addResource/getAnalytics.
 */
function VillageRegistryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Building2 className="w-6 h-6 mr-2 text-emerald-700" />
          Village Registry
        </h1>
        <p className="text-gray-600">Register villages, log community resources, and view village analytics</p>
      </div>

      <ActionCard
        title="Register Village"
        description="Create a new village record."
        hasJsonPayload
        jsonLabel="Village data (JSON)"
        jsonPlaceholder='{"name": "Rampur", "district": "Kamrup", "block": "Chandrapur", "population": 4200}'
        onRun={(_, payload) => villageAPI.createVillage(payload)}
      />
      <ActionCard
        title="Add Village Resource"
        description="Log a community resource (well, school, health center, etc.) for a village."
        fields={[{ name: 'villageId', label: 'Village ID' }]}
        hasJsonPayload
        jsonLabel="Resource data (JSON)"
        jsonPlaceholder='{"type": "water_source", "name": "Community Well", "condition": "good"}'
        onRun={(v, payload) => villageAPI.addVillageResource(v.villageId, payload)}
      />
      <ActionCard
        title="Get Village Analytics"
        description="Get the development/analytics summary for a village."
        fields={[{ name: 'villageId', label: 'Village ID' }]}
        onRun={(v) => villageAPI.getVillageAnalytics(v.villageId)}
      />
    </div>
  )
}

export default VillageRegistryPage
