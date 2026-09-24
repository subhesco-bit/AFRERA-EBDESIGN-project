/**
 * Mount helper — call from app.js / server.js
 *
 *   const { mountThreeModules } = require('./bootstrap/mountThreeModules');
 *   mountThreeModules(app);
 */

const path = require('path');
const express = require('express');

function mountThreeModules(app) {
  const registry = require('../routes/threeModuleRegistry');
  app.use('/api/v1', registry);

  // Static SPA
  const uiRoot = path.join(__dirname, '../../../frontend/three-modules');
  app.use('/app', express.static(uiRoot));
  app.get('/app/*', (_req, res) => {
    res.sendFile(path.join(uiRoot, 'index.html'));
  });

  return {
    api: '/api/v1',
    ui: '/app/',
    catalogue: '/api/v1/three-modules/catalogue',
  };
}

module.exports = { mountThreeModules };
