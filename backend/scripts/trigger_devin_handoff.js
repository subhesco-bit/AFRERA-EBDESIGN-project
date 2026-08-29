/**
 * Fires the real Devin session for the module/interface-wiring handoff
 * documented at .ai/reviews/DEVIN_HANDOFF_2026-08-28.md (and the published
 * artifact from that same session).
 *
 * Requires DEVIN_ENABLED=true and a real DEVIN_API_KEY in backend/.env first
 * (get one from Devin's dashboard: Settings > API Keys, starts with apk_).
 * Does nothing destructive on its own - it only calls Devin's session-create
 * API, which is what actually starts real work on Devin's side.
 *
 * Usage:  node backend/scripts/trigger_devin_handoff.js
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const devinService = require('../src/services/devinService');

const PROMPT = `You're picking up a module/interface wiring handoff from a Claude session on the EBDESIGN/AFRERA repo. Full context and verification methodology: .ai/reviews/DEVIN_HANDOFF_2026-08-28.md - read that first.

Do these in order:

1. Fix 3 pages whose backend now exists but whose api.js client still calls old, never-built paths - just repoint them at /api/v1/backend-modules/:moduleId/:operation (the bridge is already built and working):
   - frontend/src/pages/OrchardManagementPage.jsx -> orchardAPI -> backend/src/modules/M141 (real CRUD: listOrchards, getOrchard, createOrchard, updateOrchard, deleteOrchard, getOrchardProduction, recordOrchardProduction)
   - frontend/src/pages/PondManagementPage.jsx -> pondAPI -> backend/src/modules/M132 (real CRUD: listPonds, getPond, createPond, updatePond, deletePond, plus sensor/AI-insight operations)
   - frontend/src/pages/FarmerHealthWelfarePage.jsx -> farmerWelfareAPI -> backend/src/modules/M029 (real CRUD: listHealthRecords, getHealthRecord, createHealthRecord, updateHealthRecord, deleteHealthRecord)

2. Rewrite 2 pages that assumed CRUD but the real backend doesn't have one - use frontend/src/pages/WaterManagementPage.jsx as the reference pattern (action cards, not a CRUD list):
   - frontend/src/pages/VillageRegistryPage.jsx -> backend/src/modules/M041 (only createVillage, addVillageResource, getVillageAnalytics exist - no list/update/delete)
   - frontend/src/pages/PoultryManagementPage.jsx -> backend/src/modules/M123 (only registerPoultryFlock, updateFlockHealth, trackFlockPerformance, generatePoultryReport exist)

3. CRITICAL - verify before wiring anything else: module IDs do not reliably match the domain the frontend comments claim. Confirmed mismatches this session (frontend claim -> actual file content): M052 "FPO Governance" is actually Product Catalog; M057 "FPO Marketing" is actually Shipping Management; M043/M044/M045 "Block/District/State Management" are actually Crop Registration/Crop Variety/Seed Planning; M073/M074 "Nutrient/Fertility Management" are actually Goat/Sheep Management; M085/M086 "Drought/Flood Monitoring" are actually Comparative Analytics/Real-time Monitoring; M014-M020 "Role/Permission/SSO/Identity/Consent/Session Management" are actually SSO/MFA/Identity Federation/Privacy Controls/Profile Management/Account Recovery; M007/M009/M010 "Feature Flag/Time Zone/Master Config" are actually Role&Permission (already merged into modules/M004_ROLE_MANAGEMENT this session)/Security&Access Control/Notification System. For each of these ~19: read the actual file header and exports before deciding whether to build new backend, re-point to wherever the real capability already lives, or relabel the frontend. Do not trust the comment/claim - verify by reading the file.

4. Lowest priority: ~50 modules (M063-M068, M113-M120, M124, M126, M129-M131, M133-M140, M142-M143, M145-M147, M149-M150, M048-M049, M088-M097, M099-M100, M106 - full list in the handoff doc) have genuinely empty backends (0-50 lines, boilerplate placeholders only) and need real implementation built, not just wiring.

Standing rules from this session, apply throughout:
- Verify by running the code, not by reading it - "it looks right" is not "it works."
- When two implementations of the same capability exist, merge all features into one; never just delete the smaller one. Copy -> merge -> verify it actually works -> only then remove/overwrite the original.
- If a merge introduces a same-named function that collides with something that already existed, check both real signatures - if they differ, keep both under distinct names rather than let one silently shadow the other.
- No fake completion: don't mark something done, wired, or production-ready without having actually run it.

Report back what you find for the ~19 mismatched modules and the ~50 empty ones before building anything substantial there - that scope needs a decision, not just execution.`;

async function main() {
  const status = devinService.getStatus();
  if (!status.configured) {
    console.error('Devin is not configured. Set DEVIN_ENABLED=true and a real DEVIN_API_KEY in backend/.env first.');
    process.exit(1);
  }

  console.log('Firing Devin session...');
  const session = await devinService.createSession(PROMPT, {
    title: 'EBDESIGN module/interface wiring handoff (2026-08-28)',
    tags: ['ebdesign', 'module-wiring', 'claude-handoff']
  });

  console.log('Session created:');
  console.log('  sessionId:', session.sessionId);
  console.log('  url:', session.url);
  console.log('');
  console.log('Poll status with: node -e "require(\'./src/services/devinService\').getSession(\'' + session.sessionId + '\').then(s => console.log(s))"');
}

main().catch((err) => {
  console.error('Failed to create Devin session:', err.message);
  process.exit(1);
});
