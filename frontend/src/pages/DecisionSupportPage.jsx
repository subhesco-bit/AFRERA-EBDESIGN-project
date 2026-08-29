import { Gavel } from 'lucide-react'
import { decisionSupportAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

/**
 * Real backend: backend/src/routes/decisionSupportRoutes.js +
 * services/legacy/decisionSupportService.js. All 8 functions verified to
 * exist and resolve correctly (verified earlier this session, 2026-08-29).
 * Core business logic for pricing, logistics, finance and governance -
 * ActionCard pattern.
 */
function DecisionSupportPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Gavel className="w-6 h-6 mr-2 text-purple-600" />
          Decision Support
        </h1>
        <p className="text-gray-600">Core business logic functions for pricing, logistics, finance and governance decisions.</p>
      </div>

      <ActionCard
        title="Corporate Credit Eligibility"
        description="Check corporate credit eligibility from turnover and business vintage."
        fields={[{ name: 'turnoverCr', label: 'Turnover (Cr)', type: 'number' }, { name: 'vintageYrs', label: 'Vintage (Years)', type: 'number' }]}
        onRun={(v) => decisionSupportAPI.corpCreditEligible({ turnoverCr: Number(v.turnoverCr), vintageYrs: Number(v.vintageYrs) })}
      />
      <ActionCard
        title="Floor Price Benchmark"
        description="Get the floor price benchmark for a category or product name."
        fields={[{ name: 'categoryOrName', label: 'Category or Name' }]}
        hasJsonPayload
        jsonLabel="Catalog override (JSON, optional)"
        jsonPlaceholder='{"rice": 22}'
        onRun={(v, payload) => decisionSupportAPI.floorBenchmark({ categoryOrName: v.categoryOrName, catalog: Object.keys(payload).length ? payload : undefined })}
      />
      <ActionCard
        title="Eco Logistics Miles"
        description="ESG scoring for logistics based on context and lanes."
        hasJsonPayload
        jsonLabel="ctx and lanes (JSON)"
        jsonPlaceholder='{"ctx": {"kind": "road"}, "lanes": [{"distanceKm": 120}]}'
        onRun={(_, payload) => decisionSupportAPI.ecoLogisticsMiles(payload)}
      />
      <ActionCard
        title="Harvest Points"
        description="Calculate harvest loyalty points for a user."
        hasJsonPayload
        jsonLabel="user (JSON)"
        jsonPlaceholder='{"user": {"id": "U-1", "totalHarvestKg": 500}}'
        onRun={(_, payload) => decisionSupportAPI.harvestPoints(payload)}
      />
      <ActionCard
        title="Allocation Score"
        description="Compute allocation score for a lot against a destination."
        hasJsonPayload
        jsonLabel="lot, dest, regionDist (JSON)"
        jsonPlaceholder='{"lot": {"id": "L-1"}, "dest": {"id": "D-1"}}'
        onRun={(_, payload) => decisionSupportAPI.allocScore(payload)}
      />
      <ActionCard
        title="Compost Plan"
        description="Generate a compost plan for a crop and acreage."
        fields={[{ name: 'crop', label: 'Crop' }, { name: 'acres', label: 'Acres', type: 'number' }]}
        hasJsonPayload
        jsonLabel="soilCond (JSON, optional)"
        jsonPlaceholder='{"ph": 6.5}'
        onRun={(v, payload) => decisionSupportAPI.compostPlan({ crop: v.crop, acres: Number(v.acres), soilCond: Object.keys(payload).length ? payload : undefined })}
      />
      <ActionCard
        title="Scheme Expiry Status"
        description="Get scheme expiry status (admin only)."
        onRun={() => decisionSupportAPI.schemeExpiryStatus()}
      />
      <ActionCard
        title="Compliance Gaps"
        description="Check compliance gaps for a compliance record (admin only)."
        hasJsonPayload
        jsonLabel="complianceRecord (JSON)"
        jsonPlaceholder='{"licenses": [], "certifications": []}'
        onRun={(_, payload) => decisionSupportAPI.complianceGaps({ complianceRecord: payload })}
      />
    </div>
  )
}

export default DecisionSupportPage
