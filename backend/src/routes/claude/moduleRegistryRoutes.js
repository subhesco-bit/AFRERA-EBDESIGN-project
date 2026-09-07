const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '../../modules');

// GET /api/v1/ai/modules - List all modules with AI capabilities
router.get('/modules', (req, res) => {
  if (!fs.existsSync(modulesDir)) {
    return res.json({ modules: [] });
  }

  const moduleDirs = fs.readdirSync(modulesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const modules = [];
  
  for (const moduleName of moduleDirs) {
    const modulePath = path.join(modulesDir, moduleName);
    const moduleJsonPath = path.join(modulePath, 'module.json');
    
    let moduleConfig = null;
    if (fs.existsSync(moduleJsonPath)) {
      try {
        moduleConfig = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
      } catch (error) {
        console.error(`Failed to load module.json for ${moduleName}:`, error.message);
      }
    }

    modules.push({
      name: moduleName,
      description: moduleConfig?.description || 'No description',
      version: moduleConfig?.version || '1.0.0',
      hasAI: moduleConfig?.ai?.enabled || false,
      aiCapabilities: moduleConfig?.ai?.capabilities || [],
      hasService: fs.existsSync(path.join(modulePath, 'service.js')),
      hasRoutes: fs.existsSync(path.join(modulePath, 'routes.js'))
    });
  }

  res.json({ modules });
});

// GET /api/v1/ai/modules/:moduleName - Get specific module AI info
router.get('/modules/:moduleName', (req, res) => {
  const { moduleName } = req.params;
  const modulePath = path.join(modulesDir, moduleName);
  
  if (!fs.existsSync(modulePath)) {
    return res.status(404).json({ error: 'Module not found' });
  }

  const moduleJsonPath = path.join(modulePath, 'module.json');
  if (fs.existsSync(moduleJsonPath)) {
    try {
      const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
      res.json({
        name: moduleName,
        description: moduleJson?.description || 'No description',
        version: moduleJson?.version || '1.0.0',
        ai: moduleJson?.ai || { enabled: false, capabilities: [] },
        backend: moduleJson?.backend || {},
        frontend: moduleJson?.frontend || {}
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load module config' });
    }
  } else {
    res.json({
      name: moduleName,
      description: 'No description',
      version: '1.0.0',
      ai: { enabled: false, capabilities: [] },
      backend: {},
      frontend: {}
    });
  }
});

module.exports = router;
