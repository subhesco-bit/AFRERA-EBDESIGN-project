const express = require('express');
const { buildModuleSystems } = require('../core/moduleSystemFactory');

const router = express.Router();

// Phase 1: expose existing modules as systems. This endpoint does not infer or create missing modules.
router.get('/', (req, res) => {
  try {
    const registry = buildModuleSystems();
    res.json({ success: true, ...registry });
  } catch (error) {
    res.status(500).json({ success: false, error: 'MODULE_SYSTEM_REGISTRY_FAILED', message: error.message });
  }
});

router.get('/:moduleId', (req, res) => {
  try {
    const registry = buildModuleSystems();
    const system = registry.systems.find(item => item.moduleId.toUpperCase() === String(req.params.moduleId).toUpperCase());
    if (!system) return res.status(404).json({ success: false, error: 'MODULE_SYSTEM_NOT_FOUND' });
    return res.json({ success: true, system });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'MODULE_SYSTEM_REGISTRY_FAILED', message: error.message });
  }
});

module.exports = router;
