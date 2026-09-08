import { Users } from 'lucide-react';
import { cooperativeShareAPI } from '../services/api';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/cooperativeShareRoutes.js +
 * services/legacy/cooperativeShareService.js. All 7 methods verified to
 * exist (2026-08-29). FPO member share capital + patronage dividend
 * distribution - ActionCard pattern (mixed CRUD + calculation ops).
 */
function CooperativeSharePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Users className="w-6 h-6 mr-2 text-emerald-600" />
          Cooperative Shares
        </h1>
        <p className="text-gray-600">Manage FPO member share capital and patronage dividend distributions.</p>
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Members</h2>
      <ActionCard
        title="Add Member"
        description="Add a new FPO member (admin only)."
        hasJsonPayload
        jsonLabel="Member data (JSON)"
        jsonPlaceholder='{"fpoId": "FPO-1", "farmerId": "F-1", "sharesHeld": 10, "shareValueInr": 100}'
        onRun={(_, payload) => cooperativeShareAPI.addMember(payload)}
      />
      <ActionCard
        title="List Members"
        description="List members of an FPO."
        fields={[{ name: 'fpoId', label: 'FPO ID' }]}
        onRun={(v) => cooperativeShareAPI.listMembers(v.fpoId)}
      />
      <ActionCard
        title="Get Paid-Up Capital"
        description="Get total paid-up share capital for an FPO."
        fields={[{ name: 'fpoId', label: 'FPO ID' }]}
        onRun={(v) => cooperativeShareAPI.getPaidUpCapital(v.fpoId)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Distributions</h2>
      <ActionCard
        title="Preview Distribution"
        description="Compute a patronage dividend distribution preview (admin only), without saving it."
        hasJsonPayload
        jsonLabel="Distribution params (JSON)"
        jsonPlaceholder='{"fpoId": "FPO-1", "periodStart": "2026-01-01", "periodEnd": "2026-06-30", "totalSurplusInr": 500000}'
        onRun={(_, payload) => cooperativeShareAPI.previewDistribution(payload)}
      />
      <ActionCard
        title="Create Distribution"
        description="Compute and save a patronage dividend distribution (admin only)."
        hasJsonPayload
        jsonLabel="Distribution params (JSON)"
        jsonPlaceholder='{"fpoId": "FPO-1", "periodStart": "2026-01-01", "periodEnd": "2026-06-30", "totalSurplusInr": 500000}'
        onRun={(_, payload) => cooperativeShareAPI.createDistribution(payload)}
      />
      <ActionCard
        title="List Distributions"
        description="List distributions for an FPO."
        fields={[{ name: 'fpoId', label: 'FPO ID' }]}
        onRun={(v) => cooperativeShareAPI.listDistributions(v.fpoId)}
      />
      <ActionCard
        title="Get Distribution"
        description="Fetch a single distribution by ID."
        fields={[{ name: 'id', label: 'Distribution ID' }]}
        onRun={(v) => cooperativeShareAPI.getDistribution(v.id)}
      />
    </div>
  );
}

export default CooperativeSharePage;
