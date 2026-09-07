const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '../../modules');

// Dynamically discover and load all modules
function discoverModules() {
  if (!fs.existsSync(modulesDir)) {
    return [];
  }

  const moduleDirs = fs.readdirSync(modulesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const modules = [];
  
  for (const moduleName of moduleDirs) {
    const modulePath = path.join(modulesDir, moduleName);
    const moduleJsonPath = path.join(modulePath, 'module.json');
    
    if (fs.existsSync(moduleJsonPath)) {
      try {
        const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
        modules.push({
          name: moduleName,
          path: modulePath,
          config: moduleJson,
          hasService: fs.existsSync(path.join(modulePath, 'service.js')),
          hasRoutes: fs.existsSync(path.join(modulePath, 'routes.js')),
          hasController: fs.existsSync(path.join(modulePath, 'controller.js')),
          hasIndex: fs.existsSync(path.join(modulePath, 'index.js'))
        });
      } catch (error) {
        console.error(`Failed to load module.json for ${moduleName}:`, error.message);
      }
    }
  }

  return modules;
}

// GET /api/v1/backend-modules/status - Get bridge status
router.get('/status', (req, res) => {
  const modules = discoverModules();
  res.json({
    status: 'connected',
    modulesDiscovered: modules.length,
    modules: modules.map(m => ({
      name: m.name,
      hasService: m.hasService,
      hasRoutes: m.hasRoutes,
      hasController: m.hasController,
      hasIndex: m.hasIndex
    }))
  });
});

// GET /api/v1/backend-modules - List all modules
router.get('/', (req, res) => {
  const modules = discoverModules();
  res.json({
    modules: modules.map(m => ({
      name: m.name,
      description: m.config?.description || 'No description',
      version: m.config?.version || '1.0.0',
      hasService: m.hasService,
      hasRoutes: m.hasRoutes,
      hasController: m.hasController,
      hasIndex: m.hasIndex
    }))
  });
});

// GET /api/v1/backend-modules/:moduleName - Get specific module info
router.get('/:moduleName', (req, res) => {
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
        path: modulePath,
        config: moduleJson,
        hasService: fs.existsSync(path.join(modulePath, 'service.js')),
        hasRoutes: fs.existsSync(path.join(modulePath, 'routes.js')),
        hasController: fs.existsSync(path.join(modulePath, 'controller.js')),
        hasIndex: fs.existsSync(path.join(modulePath, 'index.js'))
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load module config' });
    }
  } else {
    res.json({
      name: moduleName,
      path: modulePath,
      config: null,
      hasService: fs.existsSync(path.join(modulePath, 'service.js')),
      hasRoutes: fs.existsSync(path.join(modulePath, 'routes.js')),
      hasController: fs.existsSync(path.join(modulePath, 'controller.js')),
      hasIndex: fs.existsSync(path.join(modulePath, 'index.js'))
    });
  }
});

module.exports = router;
