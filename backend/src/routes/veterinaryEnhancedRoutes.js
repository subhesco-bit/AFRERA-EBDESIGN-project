const express = require('express');
const { runVeterinaryEnhanced } = require('../modules/veterinary/VeterinaryEnhancedOperate');
const { logToUserHistory } = require('../utils/historyLog');
const dairyLog = require('../modules/M062/service');
const poultryLog = require('../modules/M063/service');
const livestockHealthLog = require('../modules/M061/service');
const router = express.Router();

// Same M0xx-scaffold-as-per-user-history-log pattern as M782 (disease
// analyzer) -> M052 (crop_diseases), applied here since the vet panel
// covers multiple species and each has its own history table.
function logForSpecies(species) {
  const s = String(species || '').toLowerCase();
  if (s.includes('dairy') || s === 'cow') return dairyLog;
  if (s.includes('poultry') || s === 'chicken') return poultryLog;
  return livestockHealthLog;
}

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'veterinary-enhanced',
    features: ['algorithms', 'workflow', 'evaluation', 'bus', 'viz', 'audio', 'confidence'],
  });
});

router.post('/enhanced', async (req, res) => {
  try {
    const input = req.body || {};
    const result = runVeterinaryEnhanced(input);

    const userId = req.user?.id || input.user_id;
    const { logged, id: historyId } = await logToUserHistory(logForSpecies(input.species), userId, {
      species: input.species,
      action: result.decision_quality?.action,
      urgency: result.analysis?.urgency,
      notifiable: result.analysis?.notifiable,
      confidence: result.decision_quality?.confidence?.value,
      case_id: result.case_id,
      recorded_at: new Date().toISOString(),
    });

    res.json({ success: true, data: { ...result, logged_to_history: logged, history_id: historyId } });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
