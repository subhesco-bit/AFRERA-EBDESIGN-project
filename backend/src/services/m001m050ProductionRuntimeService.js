'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assurance = require('./moduleProductionAssuranceService');

const MODULE_CODES = Array.from({ length: 50 }, (_, i) => `M${String(i + 1).padStart(3, '0')}`);
const PLACEHOLDER_PATTERNS = [
  /TODO\s*:\s*implement/i,
  /add business logic here/i,
  /add route handlers here/i,
  /define tables and indexes here/i,
  /page content goes here/i,
  /module\.exports\s*=\s*\{\s*\/\*.*functions.*\*\/\s*\}/i,
  /module\.exports\s*=\s*\{\s*\/\*.*handlers.*\*\/\s*\}/i,
];

function statFile(file) {
  if (!fs.existsSync(file)) return { exists: false, bytes: 0, placeholder: true };
  const content = fs.readFileSync(file, 'utf8');
  return {
    exists: true,
    bytes: Buffer.byteLength(content),
    placeholder: PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(content)),
  };
}

class M001M050ProductionRuntimeService {
  constructor(root = path.resolve(__dirname, '../../..')) {
    this.root = root;
  }

  modulePaths(code) {
    return {
      service: path.join(this.root, 'backend', 'src', 'modules', code, 'service.js'),
      controller: path.join(this.root, 'backend', 'src', 'modules', code, 'controller.js'),
      routes: path.join(this.root, 'backend', 'src', 'modules', code, 'routes.js'),
      model: path.join(this.root, 'backend', 'src', 'modules', code, 'model.sql'),
      index: path.join(this.root, 'backend', 'src', 'modules', code, 'index.js'),
      page: path.join(this.root, 'frontend', 'src', 'modules', code, `${code}Page.jsx`),
      component: path.join(this.root, 'frontend', 'src', 'modules', code, `${code}Component.jsx`),
      frontendIndex: path.join(this.root, 'frontend', 'src', 'modules', code, 'index.jsx'),
    };
  }

  inspect(code) {
    if (!MODULE_CODES.includes(code)) throw Object.assign(new Error(`Unsupported module ${code}`), { code: 'UNKNOWN_MODULE' });
    const contract = assurance.CONTRACTS[code];
    const paths = this.modulePaths(code);
    const assets = Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, statFile(value)]));
    const requiredBackend = ['service', 'controller', 'routes', 'model', 'index'];
    const requiredFrontend = ['page', 'frontendIndex'];
    const missing = [...requiredBackend, ...requiredFrontend].filter((key) => !assets[key].exists);
    const placeholders = Object.entries(assets).filter(([, value]) => value.exists && value.placeholder).map(([key]) => key);
    let exports = [];
    let loadError = null;
    if (assets.service.exists && !assets.service.placeholder) {
      try {
        delete require.cache[require.resolve(paths.service)];
        const loaded = require(paths.service);
        exports = Object.keys(loaded || {}).filter((key) => typeof loaded[key] === 'function');
      } catch (error) {
        loadError = error.message;
      }
    }
    const ready = missing.length === 0 && placeholders.length === 0 && !loadError && exports.length > 0;
    return {
      code,
      name: contract?.name || code,
      domain: contract?.domain || 'Unknown',
      assets,
      missing,
      placeholders,
      serviceExports: exports,
      loadError,
      ready,
      certificationState: ready ? 'RUNTIME_WIRED' : 'REQUIRES_REPAIR',
    };
  }

  inspectAll() {
    const modules = MODULE_CODES.map((code) => this.inspect(code));
    return {
      modules,
      summary: {
        total: modules.length,
        runtimeWired: modules.filter((item) => item.ready).length,
        requiresRepair: modules.filter((item) => !item.ready).length,
        missingAssets: modules.reduce((sum, item) => sum + item.missing.length, 0),
        placeholderAssets: modules.reduce((sum, item) => sum + item.placeholders.length, 0),
      },
    };
  }

  async verifyWorkflow(code, payload, options = {}) {
    const inspection = this.inspect(code);
    const assessment = await assurance.assess(code, payload);
    const blockers = [];
    if (!assessment.valid) blockers.push('domain_validation_failed');
    if (!inspection.ready) blockers.push('runtime_assets_not_ready');
    const result = {
      verificationId: crypto.randomUUID(),
      correlationId: options.correlationId || crypto.randomUUID(),
      actorId: options.actorId || null,
      module: inspection,
      assessment,
      blockers,
      verified: blockers.length === 0,
      verifiedAt: new Date().toISOString(),
    };
    return result;
  }
}

const service = new M001M050ProductionRuntimeService();
service.MODULE_CODES = MODULE_CODES;
module.exports = service;
module.exports.M001M050ProductionRuntimeService = M001M050ProductionRuntimeService;
