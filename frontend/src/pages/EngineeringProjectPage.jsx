import { HardHat } from 'lucide-react';
import { engineeringProjectAPI } from '../services/api';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/engineeringProjectRoutes.js +
 * services/legacy/engineeringProjectService.js. All 6 methods verified to
 * exist on the service export (2026-08-29). Project/phase management + cost
 * estimation - action-oriented, ActionCard pattern.
 *
 * 2026-09-17: that verification checked the real service, not this page's
 * own api.js client - engineeringProjectAPI never actually had these
 * methods added, so every action here threw "is not a function". Now
 * wired for real (createProject renamed to createEngineeringProject below
 * since the api.js key `createProject` was already taken by an older, dead
 * placeholder method - see api.js's comment). Also corrected "Create Cost
 * Estimate"'s example JSON, which used a `lines` key with `item`/no
 * `category` - the real endpoint requires `items` with
 * category/description/unit/quantity/unitRate per line and would have
 * 400'd on the example as originally written.
 */
function EngineeringProjectPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <HardHat className="w-6 h-6 mr-2 text-indigo-600" />
          Engineering Projects
        </h1>
        <p className="text-gray-600">Create and manage engineering projects, track phases, and generate cost estimates.</p>
      </div>

      <ActionCard
        title="Create Project"
        description="Create a new engineering project."
        hasJsonPayload
        jsonLabel="Project data (JSON)"
        jsonPlaceholder='{"name": "Cold Chain Expansion", "type": "infrastructure", "budgetInr": 5000000}'
        onRun={(_, payload) => engineeringProjectAPI.createEngineeringProject(payload)}
      />
      <ActionCard
        title="List Projects"
        description="List your engineering projects, optionally filtered by query params."
        fields={[{ name: 'status', label: 'Status (optional)' }]}
        onRun={(v) => engineeringProjectAPI.listProjects(v)}
      />
      <ActionCard
        title="Get Project"
        description="Fetch a single project by ID."
        fields={[{ name: 'id', label: 'Project ID' }]}
        onRun={(v) => engineeringProjectAPI.getProject(v.id)}
      />
      <ActionCard
        title="Update Project Phase"
        description="Advance or update a project's phase."
        fields={[{ name: 'id', label: 'Project ID' }]}
        hasJsonPayload
        jsonLabel="Phase update (JSON)"
        jsonPlaceholder='{"phase": "construction", "notes": "Foundation complete"}'
        onRun={(v, payload) => engineeringProjectAPI.updateProjectPhase(v.id, payload)}
      />
      <ActionCard
        title="Create Cost Estimate"
        description="Add a cost estimate to a project (line items must resolve to known rates)."
        fields={[{ name: 'id', label: 'Project ID' }]}
        hasJsonPayload
        jsonLabel="Estimate data (JSON)"
        jsonPlaceholder='{"items": [{"category": "civil", "description": "Cement OPC 53", "unit": "bag", "quantity": 100, "unitRate": 420}], "region": "Northeast", "contingencyPercentage": 10}'
        onRun={(v, payload) => engineeringProjectAPI.createCostEstimate(v.id, payload)}
      />
      <ActionCard
        title="Get Cost Estimates"
        description="List all cost estimates for a project."
        fields={[{ name: 'id', label: 'Project ID' }]}
        onRun={(v) => engineeringProjectAPI.getCostEstimates(v.id)}
      />
    </div>
  );
}

export default EngineeringProjectPage;
