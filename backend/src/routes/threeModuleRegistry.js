/**
 * Single registry of all three-module API routes + UI page map
 * Mount this from app.js: app.use('/api/v1', threeModuleRegistry)
 */

const express = require('express');
const gw = require('../middleware/threeModuleGateway');

const router = express.Router();

router.use(gw.correlationMiddleware);
router.use(gw.safetyHeaders);
router.use(gw.jsonEnvelope);
router.use(gw.rateLimit({ max: 180 }));

// Lazy-load route modules so missing files don't crash registry listing
function safeUse(path, loader, moduleName) {
  router.use(path, gw.tagModule(moduleName), (req, res, next) => {
    try {
      const mod = loader();
      return mod(req, res, next);
    } catch (e) {
      // If loader returns router, mount once
      next(e);
    }
  });
}

function mount(path, requirePath, moduleName) {
  try {
    const r = require(requirePath);
    router.use(path, gw.tagModule(moduleName), r);
  } catch (e) {
    router.use(path, gw.tagModule(moduleName), (_req, res) => {
      res.status(503).json({ success: false, error: `route_unavailable: ${path}`, detail: e.message });
    });
  }
}

mount('/veterinary-enhanced', './veterinaryEnhancedRoutes', 'veterinary');
mount('/nutrition-enhanced', './nutritionEnhancedRoutes', 'nutrition');
mount('/agro-farming', './agroFarmingRoutes', 'agro');
mount('/unified-intelligence', './unifiedIntelligenceRoutes', 'unified');
mount('/ai-erp', './embeddedAiErpRoutes', 'unified');
// Image->symptoms->disease->discussion->treatment flow (M782). Lives under
// modules/, which server bootstrap does not auto-load, so it must be
// mounted explicitly here or it is unreachable despite being real code.
mount('/disease-analyzer', '../../../modules/M782_DISEASE_ANALYZER_AI/backend/routes', 'agro');

// Optional existing specialist routes
mount('/veterinary-specialist', './veterinarySpecialistRoutes', 'veterinary');
mount('/rituraj-nutrition', './riturajNutritionRoutes', 'nutrition');

/** Machine-readable API + UI catalogue for the frontend shell */
router.get('/three-modules/catalogue', (_req, res) => {
  res.json({
    success: true,
    data: {
      version: '2026.09.three-modules-ui-v1',
      modules: [
        {
          id: 'veterinary',
          title: 'Veterinary Intelligence',
          api_base: '/api/v1/veterinary-enhanced',
          enhanced: 'POST /api/v1/veterinary-enhanced/enhanced',
          ui_route: '/app/veterinary',
          color: '#0f766e',
          links_to: ['nutrition', 'unified', 'ai-erp'],
        },
        {
          id: 'nutrition',
          title: 'Rituraj Nutrition',
          api_base: '/api/v1/nutrition-enhanced',
          enhanced: 'POST /api/v1/nutrition-enhanced/enhanced',
          ui_route: '/app/nutrition',
          color: '#b45309',
          links_to: ['veterinary', 'agro', 'unified'],
        },
        {
          id: 'agro',
          title: 'Agro Farming',
          api_base: '/api/v1/agro-farming',
          enhanced: 'POST /api/v1/agro-farming/enhanced',
          ui_route: '/app/agro',
          color: '#166534',
          links_to: ['nutrition', 'unified', 'ai-erp'],
        },
      ],
      shared: {
        unified: '/api/v1/unified-intelligence',
        ai_erp: '/api/v1/ai-erp',
        catalogue: '/api/v1/three-modules/catalogue',
      },
      ui_pages: [
        '/app',
        '/app/veterinary',
        '/app/nutrition',
        '/app/agro',
        '/app/unified',
        '/app/erp',
        '/app/bus',
      ],
    },
  });
});

router.get('/three-modules/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      gateway: 'ok',
      modules: ['veterinary', 'nutrition', 'agro'],
      tier: 'grok-highest-industry',
    },
  });
});

router.use(gw.errorHandler);

module.exports = router;
