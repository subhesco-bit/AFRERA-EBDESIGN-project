const express = require('express');
const { logger } = require('../utils/logger');
// SECURITY 2026-08-04: /assistant is a POST because it carries a prompt body,
// but it only READS the module catalog — it changes nothing. Requiring auth
// would break discovery for anonymous visitors, which is the point of the
// catalog. Throttling is the appropriate control for an unauthenticated POST.
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const moduleCatalog = [
  {
    id: 'commerce',
    title: 'AI Commerce & Marketplace',
    category: 'Commerce',
    summary: 'Connect farmers, buyers, and cooperatives through a trusted digital marketplace.',
    capabilities: ['GI certified catalog', 'dynamic pricing', 'cart and checkout'],
    status: 'ready',
    route: '/marketplace',
    technologies: ['React', 'Express', 'PostgreSQL', 'Redis']
  },
  {
    id: 'farmers',
    title: 'Farmer & FPO Operations',
    category: 'Agriculture',
    summary: 'Support onboarding, profile management, training, and growth planning across the value chain.',
    capabilities: ['farmer onboarding', 'FDI scoring', 'training records'],
    status: 'ready',
    route: '/farmer-portal',
    technologies: ['React', 'Node.js', 'MongoDB']
  },
  {
    id: 'logistics',
    title: 'Logistics & Cold Chain',
    category: 'Operations',
    summary: 'Offer multimodal shipment orchestration, route optimization, and real-time tracking.',
    capabilities: ['shipment booking', 'live tracking', 'fleet management'],
    status: 'ready',
    route: '/logistics',
    technologies: ['Socket.IO', 'Geo APIs', 'Redis']
  },
  {
    id: 'insurance',
    title: 'Insurance & Risk Protection',
    category: 'Financial',
    summary: 'Automate policy issuance, premium calculations, and claims workflows.',
    capabilities: ['policy issuance', 'claims workflows', 'premium automation'],
    status: 'ready',
    route: '/insurance',
    technologies: ['Express', 'PostgreSQL', 'Rule engine']
  },
  {
    id: 'forms',
    title: 'Forms & Workflow Studio',
    category: 'Operations',
    summary: 'Create digital forms, approval stages, and submission experiences for complex operations.',
    capabilities: ['form builder', 'workflow stages', 'submission tracking'],
    status: 'ready',
    route: '/forms',
    technologies: ['React', 'Express', 'JSON storage']
  },
  {
    id: 'analytics',
    title: 'Analytics & AI Insights',
    category: 'Intelligence',
    summary: 'Surface operational health, recommendations, and AI-driven productivity insights.',
    capabilities: ['pipeline analytics', 'recommendations', 'insight dashboard'],
    status: 'ready',
    route: '/analytics',
    technologies: ['React', 'Node.js', 'Charts']
  },
  {
    id: 'traceability',
    title: 'Blockchain Traceability',
    category: 'Trust',
    summary: 'Provide tamper-resistant tracking for products, events, custody, and certificates.',
    capabilities: ['transaction tracking', 'verification requests', 'certificate issuance'],
    status: 'beta',
    route: '/blockchain',
    technologies: ['Blockchain APIs', 'IPFS', 'Express']
  },
  {
    id: 'ai-assistant',
    title: 'AI Copilot & Assistant',
    category: 'AI',
    summary: 'Guide users through operations, workflows, and decisions with contextual recommendations.',
    capabilities: ['assistant prompts', 'module suggestions', 'action recommendations'],
    status: 'ready',
    route: '/modules',
    technologies: ['LLM-ready heuristics', 'React', 'Express']
  },
  {
    id: 'iot',
    title: 'IoT & Sensor Intelligence',
    category: 'Connected Devices',
    summary: 'Monitor farm and supply chain conditions with sensor-driven alerts and telemetry.',
    capabilities: ['sensor telemetry', 'threshold alerts', 'device monitoring'],
    status: 'beta',
    route: '/iot',
    technologies: ['IoT APIs', 'WebSockets', 'Redis']
  },
  {
    id: 'experience',
    title: 'AR/VR & Immersive Experiences',
    category: 'Experience',
    summary: 'Bring immersive buyer, training, and showroom experiences to the platform.',
    capabilities: ['immersive demos', 'product view', 'training experience'],
    status: 'beta',
    route: '/ar-vr',
    technologies: ['Three.js', 'WebGL', 'React']
  },
  {
    id: 'governance',
    title: 'Governance & Subsidy Engine',
    category: 'Governance',
    summary: 'Support digital schemes, compliance, subsidy tracking, and transparent audits.',
    capabilities: ['scheme tracking', 'compliance checks', 'audit dashboards'],
    status: 'ready',
    route: '/dashboard',
    technologies: ['Express', 'PostgreSQL', 'Charts']
  },
  {
    id: 'labs',
    title: 'Laboratory & Quality Management',
    category: 'Quality',
    summary: 'Coordinate test capture, lab registry, and quality reporting across the network.',
    capabilities: ['lab registration', 'quality reports', 'test lifecycle'],
    status: 'ready',
    route: '/dashboard',
    technologies: ['Express', 'PostgreSQL', 'Reporting']
  }
];

function getModuleCatalog() {
  return moduleCatalog.map((module) => ({ ...module }));
}

function buildPlatformOverview() {
  const readyModules = moduleCatalog.filter((module) => module.status === 'ready').length;
  const betaModules = moduleCatalog.filter((module) => module.status === 'beta').length;
  const categories = [...new Set(moduleCatalog.map((module) => module.category))];

  return {
    totalModules: moduleCatalog.length,
    readyModules,
    betaModules,
    categories,
    highestPriority: 'AI-assisted operations',
    narrative: 'AFRERA now covers commerce, finance, logistics, governance, quality, analytics, and AI-native experiences for a complete rural enterprise platform.'
  };
}

function buildAssistantResponse(prompt = '') {
  const normalizedPrompt = (prompt || '').toLowerCase();
  const matchedModules = moduleCatalog.filter((module) => {
    const haystack = [module.title, module.summary, module.category, ...module.capabilities].join(' ').toLowerCase();
    return haystack.includes(normalizedPrompt) || normalizedPrompt.includes(module.category.toLowerCase()) || normalizedPrompt.includes(module.title.toLowerCase());
  });

  const suggestions = matchedModules.length > 0
    ? matchedModules.slice(0, 3)
    : moduleCatalog.slice(0, 3);

  let reply = 'I recommend launching the commerce, logistics, and analytics modules together for the fastest business impact.';

  if (normalizedPrompt.includes('forms') || normalizedPrompt.includes('workflow')) {
    reply = 'Start with the Forms & Workflow Studio and pair it with Analytics & AI Insights to create a measurable approval loop.';
  } else if (normalizedPrompt.includes('trace') || normalizedPrompt.includes('blockchain')) {
    reply = 'Use Blockchain Traceability to strengthen product trust and combine it with the quality and governance modules.';
  } else if (normalizedPrompt.includes('ai') || normalizedPrompt.includes('assistant')) {
    reply = 'Activate the AI Copilot & Assistant module and connect it with analytics, forms, and governance for hands-on guidance.';
  }

  return {
    reply,
    suggestedModules: suggestions.map((module) => module.title),
    confidence: 'high'
  };
}

router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      modules: getModuleCatalog(),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Unable to fetch module catalog', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.get('/overview', (req, res) => {
  try {
    res.json({
      success: true,
      overview: buildPlatformOverview(),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Unable to build module overview', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const module = getModuleCatalog().find((entry) => entry.id === req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json({ success: true, module });
  } catch (error) {
    logger.error('Unable to load module detail', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

router.post('/assistant', rateLimiter, (req, res) => {
  try {
    const response = buildAssistantResponse(req.body?.prompt || '');
    res.json({ success: true, assistant: response });
  } catch (error) {
    logger.error('Unable to build assistant response', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  getModuleCatalog,
  buildPlatformOverview,
  buildAssistantResponse
};
