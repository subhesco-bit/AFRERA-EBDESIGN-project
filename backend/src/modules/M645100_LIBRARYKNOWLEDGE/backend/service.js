/**
 * Library Knowledge Service (M645100)
 *
 * Indexes the real _EBDESIGN_LIBRARY layout plus plug-and-play modules and
 * exposes a Claude-compatible execute() contract for module discovery.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MODULE_ID = 'M645100_LIBRARYKNOWLEDGE';
const MODULE_NAME = 'Library Knowledge';

function optionalDatabase() {
  try {
    return require('../../../backend/src/database/connection').getPostgreSQL();
  } catch (error) {
    return null;
  }
}

function stripBom(content) {
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

function readJson(filePath) {
  const content = stripBom(fs.readFileSync(filePath, 'utf8'));

  try {
    return JSON.parse(content);
  } catch (error) {
    return {
      name: path.basename(filePath),
      parseError: error.message,
      indexedWithWarning: true
    };
  }
}

function parseCsvHeaderLine(line) {
  const columns = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      columns.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }

  columns.push(value.trim());
  return columns;
}

function readCsvHeader(filePath) {
  const content = stripBom(fs.readFileSync(filePath, 'utf8'));
  const rows = content.split(/\r?\n/).filter(Boolean);
  const [header = ''] = rows;

  return {
    columns: parseCsvHeaderLine(header),
    rowCount: Math.max(rows.length - 1, 0)
  };
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (error) {
    return null;
  }
}

class LibraryKnowledgeService {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || path.resolve(__dirname, '../../..');
    this.libraryRoot = options.libraryRoot || path.join(this.projectRoot, '_EBDESIGN_LIBRARY');
    this.modulesRoot = options.modulesRoot || path.join(this.projectRoot, 'modules');
    this.backendModulesRoot = options.backendModulesRoot || path.join(this.projectRoot, 'backend', 'src', 'modules');
    this.index = new Map();
    this.contentHashes = new Map();
    this.indexingWarnings = [];
    this.initialized = false;
  }

  async initialize(options = {}) {
    await this.buildIndex();
    await this.computeContentHashes();

    if (options.syncDatabase === true) {
      await this.syncToDatabase();
    }

    this.initialized = true;
    return {
      success: true,
      moduleId: MODULE_ID,
      indexedItems: this.index.size,
      contentHashes: this.contentHashes.size,
      indexingWarnings: this.indexingWarnings.length
    };
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize({ syncDatabase: false });
    }
  }

  async buildIndex() {
    this.index.clear();
    this.indexingWarnings = [];
    this.indexLibraryCatalogues();
    this.indexLibraryModuleCards();
    this.indexModularSystems();
    this.indexRuntimeModules();
    this.indexBackendModules();
    return this.index;
  }

  indexFile(key, type, filePath, data = {}) {
    const stat = safeStat(filePath);
    if (!stat) return;

    if (data.parseError) {
      this.indexingWarnings.push({
        key,
        type,
        path: filePath,
        warning: 'invalid_json',
        message: data.parseError
      });
    }

    this.index.set(key, {
      key,
      type,
      path: filePath,
      data,
      lastModified: stat.mtime.toISOString(),
      fileSize: stat.size
    });
  }

  indexLibraryCatalogues() {
    const catalogueRoots = [
      path.join(this.libraryRoot, '00_CATALOG'),
      path.join(this.libraryRoot, '03_CATALOGUE')
    ];

    for (const root of catalogueRoots) {
      if (!fs.existsSync(root)) continue;
      for (const file of fs.readdirSync(root)) {
        const filePath = path.join(root, file);
        const stat = safeStat(filePath);
        if (!stat || !stat.isFile()) continue;

        const ext = path.extname(file).toLowerCase();
        const data = ext === '.json' ? readJson(filePath) : readCsvHeader(filePath);
        this.indexFile(`CATALOG:${file}`, 'catalogue', filePath, {
          name: file,
          extension: ext,
          ...data
        });
      }
    }
  }

  indexLibraryModuleCards() {
    const cardsRoot = path.join(this.libraryRoot, '01_MODULE_CARDS');
    if (!fs.existsSync(cardsRoot)) return;

    for (const file of fs.readdirSync(cardsRoot)) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(cardsRoot, file);
      const data = readJson(filePath);
      this.indexFile(data.moduleId || data.CardID || path.basename(file, '.json'), 'library-module-card', filePath, data);
    }
  }

  indexModularSystems() {
    const modularRoot = path.join(this.libraryRoot, '01_MODULES', 'MODULAR_SYSTEM');
    if (!fs.existsSync(modularRoot)) return;

    for (const file of fs.readdirSync(modularRoot)) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(modularRoot, file);
      const data = readJson(filePath);
      this.indexFile(data.systemId || data.moduleId || path.basename(file, '.json'), 'modular-system-card', filePath, data);
    }
  }

  indexRuntimeModules() {
    if (!fs.existsSync(this.modulesRoot)) return;

    for (const dir of fs.readdirSync(this.modulesRoot, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const moduleJsonPath = path.join(this.modulesRoot, dir.name, 'module.json');
      if (!fs.existsSync(moduleJsonPath)) continue;

      const data = readJson(moduleJsonPath);
      this.indexFile(data.moduleId || dir.name, 'runtime-module', moduleJsonPath, {
        ...data,
        runtimePath: path.dirname(moduleJsonPath),
        hasBackend: fs.existsSync(path.join(this.modulesRoot, dir.name, 'backend', 'service.js')),
        hasApi: fs.existsSync(path.join(this.modulesRoot, dir.name, 'api', 'routes.js')),
        hasFrontend: fs.existsSync(path.join(this.modulesRoot, dir.name, 'frontend', 'index.jsx'))
      });
    }
  }

  indexBackendModules() {
    if (!fs.existsSync(this.backendModulesRoot)) return;

    for (const dir of fs.readdirSync(this.backendModulesRoot, { withFileTypes: true })) {
      if (!dir.isDirectory() || !/^M\d{3}$/.test(dir.name)) continue;
      const modulePath = path.join(this.backendModulesRoot, dir.name);
      this.indexFile(`BACKEND:${dir.name}`, 'backend-module', modulePath, {
        moduleId: dir.name,
        name: this.inferBackendModuleName(dir.name),
        hasBackend: fs.existsSync(path.join(modulePath, 'service.js')),
        hasRoutes: fs.existsSync(path.join(modulePath, 'routes.js')),
        hasController: fs.existsSync(path.join(modulePath, 'controller.js')),
        hasModel: fs.existsSync(path.join(modulePath, 'model.sql')),
        hasDocs: fs.existsSync(path.join(modulePath, 'README.md')),
        apiBase: `/api/v1/modules/${dir.name.toLowerCase()}`
      });
    }
  }

  inferBackendModuleName(moduleId) {
    const names = {
      M026: 'Farmer Skill Management',
      M027: 'Farmer Certification',
      M028: 'Farmer Advisory',
      M029: 'Farmer Health & Welfare',
      M030: 'Farmer Performance'
    };
    return names[moduleId] || moduleId;
  }

  async computeContentHashes() {
    this.contentHashes.clear();

    for (const [key, item] of this.index) {
      const stat = safeStat(item.path);
      if (!stat || !stat.isFile()) continue;
      const content = fs.readFileSync(item.path);
      this.contentHashes.set(key, {
        key,
        hash: crypto.createHash('sha256').update(content).digest('hex'),
        path: item.path,
        size: content.length,
        computedAt: new Date().toISOString()
      });
    }

    return this.contentHashes;
  }

  async syncToDatabase() {
    const pool = optionalDatabase();
    if (!pool) {
      return { success: false, skipped: true, reason: 'Database connection is not available' };
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS library_knowledge (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(80) NOT NULL,
        content_hash VARCHAR(64),
        data JSONB,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        last_modified TIMESTAMP,
        indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const [key, item] of this.index) {
      const hashData = this.contentHashes.get(key);
      await pool.query(`
        INSERT INTO library_knowledge (key, type, content_hash, data, file_path, file_size, last_modified)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (key) DO UPDATE SET
          type = EXCLUDED.type,
          content_hash = EXCLUDED.content_hash,
          data = EXCLUDED.data,
          file_path = EXCLUDED.file_path,
          file_size = EXCLUDED.file_size,
          last_modified = EXCLUDED.last_modified,
          indexed_at = CURRENT_TIMESTAMP
      `, [
        key,
        item.type,
        hashData ? hashData.hash : null,
        JSON.stringify(item.data),
        item.path,
        item.fileSize,
        item.lastModified
      ]);
    }

    return { success: true, synced: this.index.size };
  }

  async searchLibrary(query = '', filters = {}) {
    await this.ensureInitialized();
    const terms = String(query).toLowerCase().split(/\s+/).filter(Boolean);
    const requestedType = filters.type;

    const results = [];
    for (const [key, item] of this.index) {
      if (requestedType && item.type !== requestedType) continue;
      const haystack = `${key} ${item.type} ${JSON.stringify(item.data)}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      if (terms.length === 0 || score > 0) {
        results.push({
          key,
          type: item.type,
          data: item.data,
          path: item.path,
          relevance: terms.length ? score / terms.length : 1
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance || a.key.localeCompare(b.key));
  }

  async listModules(filters = {}) {
    await this.ensureInitialized();
    const typeSet = new Set(['runtime-module', 'backend-module', 'library-module-card']);
    const modules = Array.from(this.index.values())
      .filter(item => typeSet.has(item.type))
      .filter(item => !filters.status || item.data.status === filters.status)
      .filter(item => !filters.category || item.data.category === filters.category)
      .map(item => ({
        moduleId: item.data.moduleId || item.data.module_id || item.key,
        name: item.data.name || item.data.ModuleName || item.key,
        type: item.type,
        status: item.data.status || item.data.Status || 'catalogued',
        category: item.data.category || item.data.domain || item.data.Domain || null,
        backend: Boolean(item.data.hasBackend),
        api: Boolean(item.data.hasApi || item.data.hasRoutes),
        frontend: Boolean(item.data.hasFrontend),
        path: item.path
      }));

    return modules;
  }

  async getModule(moduleId) {
    await this.ensureInitialized();
    const normalized = String(moduleId).toLowerCase();

    for (const item of this.index.values()) {
      const candidate = String(item.data.moduleId || item.data.module_id || item.key).toLowerCase();
      if (candidate === normalized || item.key.toLowerCase() === normalized) {
        return { success: true, module: item };
      }
    }

    return { success: false, error: `Module not found: ${moduleId}` };
  }

  async buildAIContext(query = '', context = {}) {
    const results = await this.searchLibrary(query, context);
    return {
      moduleId: MODULE_ID,
      query,
      context,
      matches: results.slice(0, Number(context.limit) || 12),
      guardrails: {
        claudeCompatible: true,
        sourceAuthority: '_EBDESIGN_LIBRARY and runtime module manifests',
        noFileMutation: true
      }
    };
  }

  async verifyCatalogIntegrity() {
    await this.ensureInitialized();
    const issues = [];

    for (const [key, item] of this.index) {
      if (!fs.existsSync(item.path)) {
        issues.push({ key, type: 'missing_file', path: item.path });
      }

      if (item.data?.parseError) {
        issues.push({
          key,
          type: 'invalid_json',
          path: item.path,
          message: item.data.parseError
        });
      }
    }

    return {
      verified: issues.length === 0,
      totalItems: this.index.size,
      hashedFiles: this.contentHashes.size,
      issues,
      warnings: this.indexingWarnings,
      verificationDate: new Date().toISOString()
    };
  }

  getStatistics() {
    const byType = {};
    for (const item of this.index.values()) {
      byType[item.type] = (byType[item.type] || 0) + 1;
    }

    return {
      moduleId: MODULE_ID,
      moduleName: MODULE_NAME,
      initialized: this.initialized,
      totalItems: this.index.size,
      contentHashes: this.contentHashes.size,
      indexingWarnings: this.indexingWarnings.length,
      byType,
      libraryRoot: this.libraryRoot,
      modulesRoot: this.modulesRoot,
      lastIndexed: new Date().toISOString()
    };
  }

  async healthCheck() {
    await this.ensureInitialized();
    return {
      status: 'healthy',
      moduleId: MODULE_ID,
      moduleName: MODULE_NAME,
      indexedItems: this.index.size,
      indexingWarnings: this.indexingWarnings.length,
      claudeCompatible: true
    };
  }

  async execute(operation, parameters = {}, context = {}) {
    try {
      switch (operation) {
        case 'initialize':
          return { success: true, data: await this.initialize(parameters) };
        case 'search':
        case 'discover':
          return { success: true, data: await this.searchLibrary(parameters.query || '', parameters) };
        case 'modules':
        case 'list':
          return { success: true, data: await this.listModules(parameters) };
        case 'getModule':
        case 'read':
          return await this.getModule(parameters.moduleId || parameters.id);
        case 'aiContext':
        case 'analyze':
          return { success: true, data: await this.buildAIContext(parameters.query || '', context) };
        case 'verify':
          return { success: true, data: await this.verifyCatalogIntegrity() };
        case 'statistics':
          await this.ensureInitialized();
          return { success: true, data: this.getStatistics() };
        case 'syncDatabase':
          await this.ensureInitialized();
          return { success: true, data: await this.syncToDatabase() };
        default:
          return { success: false, error: `Unsupported ${MODULE_ID} operation: ${operation}` };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIBRARY_MODULE_ERROR',
          message: error.message,
          operation,
          moduleId: MODULE_ID,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

module.exports = LibraryKnowledgeService;
module.exports.createService = (options) => new LibraryKnowledgeService(options);
module.exports.singleton = new LibraryKnowledgeService();
