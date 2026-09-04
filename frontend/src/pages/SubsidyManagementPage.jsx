import { Landmark, Shield, ClipboardList, Search, Calculator } from 'lucide-react';
import { subsidyOpsAPI } from '../services/api';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/services/legacy/subsidyService.js, mounted
 * directly in backend/src/index.js at /api/v1/subsidy/* (matches
 * frontend/src/services/api.js's subsidyOpsAPI). Every action below calls a
 * verified route: project/equipment/logistics eligibility checks, applicable
 * scheme lookup, application submission, application tracking, GST
 * applicability for logistics.
 *
 * This replaces a previous version of this page built as an "AI-powered"
 * admin dashboard (overview stats, scheme performance, disbursement queue,
 * tracking board, fraud detection, impact measurement) where every number
 * and every row - YTD disbursed, beneficiary counts, "12 fraud attempts
 * blocked this month", named beneficiaries like "Bornali Gogoi" and
 * "Rimon Lyngdoh", district-level income/productivity impact figures - was
 * invented in the component with no backing endpoint. The two calls it did
 * make (subsidyAPI.getStats/getPending -> GET /subsidy/stats, /subsidy/
 * pending) have no matching backend route at all (see the FE-01 comment on
 * subsidyAPI in services/api.js), so even the top-line "quick stats" were
 * dead calls silently defaulting to zero. None of that is reproduced here;
 * this page now only exposes the subsidy operations the backend actually
 * performs, using the same ActionCard pattern already established for
 * action-oriented (non-CRUD) modules in this codebase (see
 * CooperativeSharePage.jsx).
 *
 * checkProjectSubsidyEligibility/checkEquipmentSubsidyEligibility/
 * checkLogisticsSubsidyEligibility, submitSubsidyApplication and
 * calculateGSTApplicability call through to an AI recommendation service
 * and return whatever it produces - real requests, real responses, no
 * client-side fabrication. trackSubsidyApplication is itself a backend stub
 * that returns fixed demo values regardless of the ID given (see the
 * "In production, fetch from database" comment in subsidyService.js) - that
 * is a backend limitation, out of scope for this frontend audit, but is
 * flagged here rather than hidden.
 */
function SubsidyManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Landmark className="w-6 h-6 mr-2 text-emerald-600" />
          Subsidy Management
        </h1>
        <p className="text-gray-600">
          Check government subsidy eligibility for projects, equipment and logistics, browse applicable
          schemes, submit and track applications, and calculate GST applicability for logistics.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
        Application tracking currently returns fixed demonstration status data from the backend regardless of
        the application ID entered, pending a real applications database. Everything else on this page reflects
        a live request to the subsidy service.
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2 flex items-center">
        <Shield className="w-5 h-5 mr-2 text-emerald-600" />Eligibility checks
      </h2>
      <ActionCard
        title="Check Project Subsidy Eligibility"
        description="AI-matched government schemes for an infrastructure/processing/greenhouse project."
        hasJsonPayload
        jsonLabel="Project details (JSON)"
        jsonPlaceholder='{"project_type": "cold_storage", "location": "Guwahati", "state": "Assam", "district": "Kamrup", "estimated_cost": 2500000, "farmer_category": "FPO", "land_ownership": "owned", "crop_type": "vegetables", "scale_of_operation": "medium"}'
        onRun={(_, payload) => subsidyOpsAPI.checkProjectSubsidy(payload)}
      />
      <ActionCard
        title="Check Equipment Subsidy Eligibility"
        description="AI-matched government schemes for farm equipment purchase."
        hasJsonPayload
        jsonLabel="Equipment details (JSON)"
        jsonPlaceholder='{"equipment_type": "tractor", "equipment_category": "power_tiller", "quantity": 1, "unit_cost": 450000, "total_cost": 450000, "state": "Assam", "farmer_category": "individual", "intended_use": "tillage", "power_source": "diesel"}'
        onRun={(_, payload) => subsidyOpsAPI.checkEquipmentSubsidy(payload)}
      />
      <ActionCard
        title="Check Logistics Subsidy Eligibility"
        description="AI-matched government schemes for a freight route, with private-carrier + GST routing when no subsidy applies."
        hasJsonPayload
        jsonLabel="Logistics details (JSON)"
        jsonPlaceholder='{"logistics_type": "cold_chain", "origin": "Shillong", "destination": "Guwahati", "distance": 105, "cargo_type": "perishable", "cargo_value": 300000, "vehicle_type": "refrigerated_truck", "state": "Meghalaya", "is_northeast_route": true, "is_interstate": true}'
        onRun={(_, payload) => subsidyOpsAPI.checkLogisticsSubsidy(payload)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-8 mb-2 flex items-center">
        <Search className="w-5 h-5 mr-2 text-emerald-600" />Schemes
      </h2>
      <ActionCard
        title="Browse Applicable Schemes"
        description="List government schemes applicable to a state and category."
        fields={[
          { name: 'state', label: 'State', placeholder: 'Assam' },
          { name: 'district', label: 'District (optional)', placeholder: 'Kamrup' },
          { name: 'category', label: 'Category', placeholder: 'infrastructure / equipment / organic / processing' },
        ]}
        onRun={(v) => subsidyOpsAPI.getSchemes({ state: v.state, district: v.district, category: v.category })}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-8 mb-2 flex items-center">
        <ClipboardList className="w-5 h-5 mr-2 text-emerald-600" />Applications
      </h2>
      <ActionCard
        title="Submit Subsidy Application"
        description="Submit an application against a scheme code (from a scheme lookup above)."
        hasJsonPayload
        jsonLabel="Application data (JSON)"
        jsonPlaceholder='{"scheme_code": "MIDH", "applicant_type": "FPO", "applicant_id": "FPO-1", "project_details": {"project_type": "cold_storage", "estimated_cost": 2500000}, "documents": ["land_record", "id_proof"], "bank_details": {"account_number": "XXXXXXXXXXXX", "ifsc": "SBIN0001234"}, "declaration": true}'
        onRun={(_, payload) => subsidyOpsAPI.apply(payload)}
      />
      <ActionCard
        title="Track Application"
        description="Fetch current status for a submitted application by ID."
        fields={[{ name: 'id', label: 'Application ID' }]}
        onRun={(v) => subsidyOpsAPI.track(v.id)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-8 mb-2 flex items-center">
        <Calculator className="w-5 h-5 mr-2 text-emerald-600" />GST for logistics
      </h2>
      <ActionCard
        title="Calculate GST Applicability"
        description="CGST/SGST or IGST breakdown for a logistics move, with compliance requirements."
        hasJsonPayload
        jsonLabel="Logistics/cargo details (JSON)"
        jsonPlaceholder='{"service_type": "transport", "route": {"origin_state": "Assam", "destination_state": "Assam"}, "cargo_type": "perishable", "cargo_value": 300000, "distance": 105, "vehicle_type": "refrigerated_truck"}'
        onRun={(_, payload) => subsidyOpsAPI.calculateGst(payload)}
      />
    </div>
  );
}

export default SubsidyManagementPage;
