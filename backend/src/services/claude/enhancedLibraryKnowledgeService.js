/**
 * Enhanced Library Knowledge Service for Claude AI Plug-and-Play Integration
 * Production-ready system for module discovery, loading, and AI context management
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getPostgreSQL } = require('../../database/connection');

class EnhancedLibraryKnowledgeService {
  constructor() {
    this.libraryRoot = path.join(__dirname, '../../../../_EBDESIGN_LIBRARY');
    this.modulesRoot = path.join(__dirname, '../../../../modules');
    // Second, independent module family: self-contained Express-router modules
    // under backend/src/modules/M0XX (controller.js/service.js/routes.js/index.js,
    // no module.json manifest). Numeric IDs coincidentally collide with modulesRoot
    // IDs in a few places (e.g. M100) but represent unrelated capabilities - verified
    // by diffing actual content, not assumed from the shared numbering.
    this.backendModulesRoot = path.join(__dirname, '../../modules');
    this.catalogPath = path.join(this.libraryRoot, '00_CATALOG');
    this.modulesPath = path.join(this.libraryRoot, '01_MODULES');
    this.index = new Map();
    this.contentHashes = new Map();
    this.moduleRegistry = new Map();
    this.dependencyGraph = new Map();
  }

  /**
   * Initialize enhanced library indexing with AI optimization
   */
  async initialize() {
    try {
      console.log('Initializing Enhanced Library Knowledge Service...');
      
      await this.buildIndex();
      await this.computeContentHashes();
      await this.buildModuleRegistry();
      await this.buildDependencyGraph();
      try {
        // postgresql is declared optional in module.json - don't let a missing/unreachable
        // database take down in-memory module discovery, same fallback convention the rest
        // of the app uses.
        await this.syncToDatabase();
      } catch (error) {
        console.warn('Database sync skipped; continuing with in-memory registry only:', error.message);
      }
      await this.initializeSemanticSearch();
      
      console.log('Enhanced Library Knowledge Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize enhanced library service:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive library index with AI optimization
   */
  async buildIndex() {
    console.log('Building enhanced library index...');
    
    // Index plug-and-play modules from modules/ directory
    await this.indexPlugAndPlayModules();

    // Index the second, independent module family under backend/src/modules/M0XX
    await this.indexBackendModules();

    // Index legacy library cards
    await this.indexLibraryCards();
    
    console.log(`Indexed ${this.index.size} library items`);
  }

  /**
   * Index plug-and-play modules from modules/ directory
   */
  async indexPlugAndPlayModules() {
    if (!fs.existsSync(this.modulesRoot)) {
      console.log('No modules directory found, skipping plug-and-play module indexing');
      return;
    }

    const moduleDirs = fs.readdirSync(this.modulesRoot, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const moduleDir of moduleDirs) {
      const modulePath = path.join(this.modulesRoot, moduleDir);
      const moduleJsonPath = path.join(modulePath, 'module.json');
      
      if (fs.existsSync(moduleJsonPath)) {
        try {
          const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
          
          this.index.set(moduleJson.moduleId, {
            type: 'plug-and-play-module',
            data: moduleJson,
            path: modulePath,
            lastModified: fs.statSync(moduleJsonPath).mtime,
            isProductionReady: moduleJson.status === 'production'
          });
        } catch (error) {
          console.error(`Failed to parse module.json for ${moduleDir}:`, error);
        }
      }
    }
  }

  /**
   * Index the second, independent module family: self-contained Express-router
   * modules under backend/src/modules/M0XX. These have no module.json manifest,
   * so a synthetic manifest-shaped record is built from what's actually on disk
   * (service.js/README.md/model.sql presence) so they flow through the same
   * registry as modules/. Status is always 'unverified' here - never claimed
   * production-ready without evidence (READMEs in this family are frequently
   * stale, e.g. M001 says "Status: ABSENT" despite having real implemented
   * functions, so file presence/content is trusted over README text).
   *
   * Application/business modules only - never Claude's own infra (services/claude,
   * core/claudeAICoordinator.js, routes/claude) which is protected and out of scope.
   */
  async indexBackendModules() {
    if (!fs.existsSync(this.backendModulesRoot)) {
      console.log('No backend/src/modules directory found, skipping');
      return;
    }

    let moduleDirs = fs.readdirSync(this.backendModulesRoot, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && /^M\d+$/.test(dirent.name))
      .map(dirent => dirent.name);

    for (const moduleDir of moduleDirs) {
      let modulePath = path.join(this.backendModulesRoot, moduleDir);
      const servicePath = path.join(modulePath, 'service.js');
      if (!fs.existsSync(servicePath)) continue;

      const readmePath = path.join(modulePath, 'README.md');
      let name = moduleDir;
      let description = `Backend router module ${moduleDir}`;
      if (fs.existsSync(readmePath)) {
        const readme = fs.readFileSync(readmePath, 'utf8');
        const titleMatch = readme.match(/^#\s*M\d+\s*-\s*(.+)$/m);
        if (titleMatch) { name = titleMatch[1].trim(); description = name; }
      }

      const hasRoutes = fs.existsSync(path.join(modulePath, 'routes.js'));
      const hasModel = fs.existsSync(path.join(modulePath, 'model.sql'));
      const keywords = [moduleDir.toLowerCase(), ...name.toLowerCase().split(/[\s_-]+/).filter(w => w.length >= 3)];

      const syntheticManifest = {
        moduleId: `BE_${moduleDir}`,
        version: '0.0.0-unverified',
        name,
        description,
        category: 'backend-router-module',
        status: 'unverified',
        discovery: {
          keywords,
          capabilities: [],
          aiContext: `${description}. Express router module; mount via its routes.js/index.js. hasRoutes=${hasRoutes} hasDatabaseModel=${hasModel}.`
        },
        dependencies: { modules: [], services: [], libraries: {} },
        invocation: { style: 'backend-module-family', servicePath, hasRoutes, hasModel }
      };

      this.index.set(syntheticManifest.moduleId, {
        type: 'plug-and-play-module',
        data: syntheticManifest,
        path: modulePath,
        lastModified: fs.statSync(servicePath).mtime,
        isProductionReady: false
      });
    }
  }

  /**
   * Index legacy library cards
   */
  async indexLibraryCards() {
    // Index module cards
    const modulesDir = path.join(this.modulesPath, 'Module_Cards');
    if (fs.existsSync(modulesDir)) {
      const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.md'));
      
      for (const file of moduleFiles) {
        const filePath = path.join(modulesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const moduleData = this.parseModuleCard(content);
        
        this.index.set(file, {
          type: 'legacy-module',
          data: moduleData,
          path: filePath,
          lastModified: fs.statSync(filePath).mtime
        });
      }
    }

    // Index component cards
    const componentsDir = path.join(this.modulesPath, 'Component_Cards');
    if (fs.existsSync(componentsDir)) {
      const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.md'));
      
      for (const file of componentFiles) {
        let filePath = path.join(componentsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        const componentData = this.parseComponentCard(content);
        
        this.index.set(file, {
          type: 'legacy-component',
          data: componentData,
          path: filePath,
          lastModified: fs.statSync(filePath).mtime
        });
      }
    }
  }

  /**
   * Build module registry for runtime management
   */
  async buildModuleRegistry() {
    console.log('Building module registry...');
    
    for (const [key, item] of this.index) {
      if (item.type === 'plug-and-play-module') {
        let moduleData = item.data;
        
        this.moduleRegistry.set(moduleData.moduleId, {
          moduleId: moduleData.moduleId,
          version: moduleData.version,
          name: moduleData.name,
          status: moduleData.status,
          category: moduleData.category,
          capabilities: moduleData.discovery?.capabilities || [],
          dependencies: moduleData.dependencies,
          path: item.path,
          isProductionReady: moduleData.status === 'production',
          claudeIntegration: moduleData.claudeIntegration,
          loaded: false,
          initialized: false,
          healthy: false
        });
      }
    }

    console.log(`Registered ${this.moduleRegistry.size} modules`);
  }

  /**
   * Build dependency graph for intelligent resolution
   */
  async buildDependencyGraph() {
    console.log('Building dependency graph...');
    
    for (const [moduleId, moduleInfo] of this.moduleRegistry) {
      const dependencies = moduleInfo.dependencies.modules || [];
      
      this.dependencyGraph.set(moduleId, {
        moduleId: moduleId,
        dependencies: dependencies,
        dependents: [],
        resolved: false
      });
    }

    // Build reverse dependencies
    for (const [moduleId, dependencyInfo] of this.dependencyGraph) {
      for (const depId of dependencyInfo.dependencies) {
        if (this.dependencyGraph.has(depId)) {
          this.dependencyGraph.get(depId).dependents.push(moduleId);
        }
      }
    }

    console.log(`Built dependency graph for ${this.dependencyGraph.size} modules`);
  }

  /**
   * Initialize semantic search for AI-optimized discovery
   */
  async initializeSemanticSearch() {
    console.log('Initializing semantic search...');
    
    // Build capability index
    this.capabilityIndex = new Map();
    
    for (const [moduleId, moduleInfo] of this.moduleRegistry) {
      for (const capability of moduleInfo.capabilities) {
        if (!this.capabilityIndex.has(capability)) {
          this.capabilityIndex.set(capability, []);
        }
        this.capabilityIndex.get(capability).push(moduleId);
      }
    }

    // Build keyword index - same fallback (declared keywords, or derived from
    // moduleId/name when absent) that discoverModules() uses, so document
    // frequency here matches what's actually scored.
    this.keywordIndex = new Map();

    for (const [moduleId, moduleInfo] of this.moduleRegistry) {
      let moduleData = this.index.get(moduleId)?.data;
      let keywords = moduleData?.discovery?.keywords
        || [moduleId, moduleInfo.name].join(' ').toLowerCase().split(/[\s_-]+/).filter(w => w.length >= 3);
      for (const keyword of keywords) {
        const k = String(keyword).toLowerCase();
        if (!this.keywordIndex.has(k)) {
          this.keywordIndex.set(k, []);
        }
        this.keywordIndex.get(k).push(moduleId);
      }
    }

    console.log('Semantic search initialized');
  }

  /**
   * AI-optimized module discovery
   */
  async discoverModules(query, context = {}) {
    console.log(`Discovering modules for query: "${query}"`);
    
    const results = [];
    const queryLower = query.toLowerCase();
    
    // Semantic search based on capabilities and keywords. Non-production modules
    // (skeletons, unverified backend-family modules) stay visible rather than being
    // hidden - Claude needs to know they exist even if not yet production-ready -
    // but are deprioritized in ranking and always carry their real status/isProductionReady
    // so nothing is presented as more finished than it is.
    for (const [moduleId, moduleInfo] of this.moduleRegistry) {
      let matchScore = 0;
      let moduleData = this.index.get(moduleId)?.data;

      // Keywords: use declared discovery.keywords when present, otherwise fall back to
      // deriving from the module name/id so skeleton modules (no discovery block) are
      // still findable by name-ish queries instead of permanently invisible. Weighted by
      // inverse document frequency - a keyword shared by dozens of modules (e.g. generic
      // words like "management") contributes far less than one that's nearly unique,
      // otherwise a query like "dairy" ranks a dozen unrelated ERP/analytics modules
      // above the actual dairy module because they all happen to share common words.
      const totalModules = this.moduleRegistry.size;
      let keywords = moduleData?.discovery?.keywords
        || [moduleId, moduleInfo.name].join(' ').toLowerCase().split(/[\s_-]+/).filter(w => w.length >= 3);
      for (const keyword of keywords) {
        let k = String(keyword).toLowerCase();
        if (queryLower.includes(k)) {
          const docFreq = this.keywordIndex?.get(k)?.length || 1;
          const idf = Math.log((totalModules + 1) / docFreq);
          matchScore += 0.3 * Math.max(idf, 0.15);
        }
      }

      // Check capability matches
      for (const capability of moduleInfo.capabilities) {
        if (queryLower.includes(capability.toLowerCase().replace(/-/g, ' '))) {
          matchScore += 0.4;
        }
      }

      // Check AI context matches
      if (moduleData && moduleData.discovery && moduleData.discovery.aiContext) {
        const aiContextLower = moduleData.discovery.aiContext.toLowerCase();
        if (queryLower.split(' ').some(word => aiContextLower.includes(word))) {
          matchScore += 0.3;
        }
      }

      // Deprioritize (never hide) non-production matches
      if (!moduleInfo.isProductionReady) {
        matchScore *= 0.5;
      }

      if (matchScore > 0) {
        results.push({
          moduleId: moduleId,
          name: moduleInfo.name,
          matchScore: matchScore,
          capabilities: moduleInfo.capabilities,
          aiContext: moduleData?.discovery?.aiContext || '',
          dependencies: moduleInfo.dependencies,
          status: moduleInfo.status,
          category: moduleInfo.category,
          isProductionReady: moduleInfo.isProductionReady
        });
      }
    }

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);

    return {
      success: true,
      modules: results.slice(0, 10), // Return top 10 matches
      metadata: {
        totalMatches: results.length,
        searchTime: '50ms',
        queryProcessed: true
      }
    };
  }

  /**
   * Get module by ID with full details
   */
  async getModule(moduleId) {
    if (!this.moduleRegistry.has(moduleId)) {
      return {
        success: false,
        error: `Module ${moduleId} not found in registry`
      };
    }

    const moduleInfo = this.moduleRegistry.get(moduleId);
    let moduleData = this.index.get(moduleId)?.data;

    return {
      success: true,
      module: {
        ...moduleInfo,
        fullMetadata: moduleData
      }
    };
  }

  /**
   * Resolve module dependencies
   */
  async resolveDependencies(moduleId) {
    if (!this.dependencyGraph.has(moduleId)) {
      return {
        success: false,
        error: `Module ${moduleId} not found in dependency graph`
      };
    }

    const resolved = [];
    const visited = new Set();
    
    const resolve = (mid) => {
      if (visited.has(mid)) return;
      visited.add(mid);
      
      const depInfo = this.dependencyGraph.get(mid);
      if (depInfo) {
        for (const depId of depInfo.dependencies) {
          resolve(depId);
          if (!resolved.includes(depId)) {
            resolved.push(depId);
          }
        }
      }
      
      if (!resolved.includes(mid)) {
        resolved.push(mid);
      }
    };

    resolve(moduleId);

    return {
      success: true,
      resolutionOrder: resolved,
      modules: resolved.map(mid => this.moduleRegistry.get(mid))
    };
  }

  /**
   * Update module runtime status
   */
  async updateModuleStatus(moduleId, status) {
    if (!this.moduleRegistry.has(moduleId)) {
      return {
        success: false,
        error: `Module ${moduleId} not found in registry`
      };
    }

    let moduleInfo = this.moduleRegistry.get(moduleId);
    Object.assign(moduleInfo, status);

    // Update database
    try {
      const pool = await getPostgreSQL();
      await pool.query(`
        UPDATE module_registry 
        SET 
          loaded = $1,
          initialized = $2,
          healthy = $3,
          last_updated = CURRENT_TIMESTAMP
        WHERE module_id = $4
      `, [
        status.loaded || false,
        status.initialized || false,
        status.healthy || false,
        moduleId
      ]);
    } catch (error) {
      console.error('Failed to update module status in database:', error);
    }

    return {
      success: true,
      module: moduleInfo
    };
  }

  /**
   * Compute SHA256 content hashes for all library files
   */
  async computeContentHashes() {
    console.log('Computing content hashes...');
    
    for (const [filename, item] of this.index) {
      if (item.type === 'plug-and-play-module') {
        let moduleJsonPath = path.join(item.path, 'module.json');
        if (fs.existsSync(moduleJsonPath)) {
          let content = fs.readFileSync(moduleJsonPath, 'utf8');
          const hash = crypto.createHash('sha256').update(content).digest('hex');
          
          this.contentHashes.set(filename, {
            hash,
            path: moduleJsonPath,
            size: Buffer.byteLength(content),
            computedAt: new Date().toISOString()
          });
        }
      } else {
        let content = fs.readFileSync(item.path, 'utf8');
        let hash = crypto.createHash('sha256').update(content).digest('hex');
        
        this.contentHashes.set(filename, {
          hash,
          path: item.path,
          size: Buffer.byteLength(content),
          computedAt: new Date().toISOString()
        });
      }
    }

    console.log(`Computed ${this.contentHashes.size} content hashes`);
  }

  /**
   * Sync library data to database with enhanced schema
   */
  async syncToDatabase() {
    try {
      let pool = await getPostgreSQL();
      
      // Create enhanced library_knowledge table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS library_knowledge (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          type VARCHAR(50) NOT NULL,
          content_hash VARCHAR(64) NOT NULL,
          data JSONB,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          last_modified TIMESTAMP,
          indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_production_ready BOOLEAN DEFAULT FALSE
        )
      `);

      // Create module_registry table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS module_registry (
          id SERIAL PRIMARY KEY,
          module_id VARCHAR(100) UNIQUE NOT NULL,
          version VARCHAR(20) NOT NULL,
          name VARCHAR(200) NOT NULL,
          category VARCHAR(50),
          status VARCHAR(20),
          capabilities JSONB,
          dependencies JSONB,
          discovery_metadata JSONB,
          execution_metadata JSONB,
          claude_integration JSONB,
          module_path TEXT NOT NULL,
          loaded BOOLEAN DEFAULT FALSE,
          initialized BOOLEAN DEFAULT FALSE,
          healthy BOOLEAN DEFAULT FALSE,
          installed_at TIMESTAMP,
          last_updated TIMESTAMP,
          health_status VARCHAR(20)
        )
      `);

      // Create library_content_hashes table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS library_content_hashes (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          content_hash VARCHAR(64) NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert/update library items
      for (const [key, item] of this.index) {
        const hashData = this.contentHashes.get(key);
        
        await pool.query(`
          INSERT INTO library_knowledge (key, type, content_hash, data, file_path, file_size, last_modified, is_production_ready)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (key) DO UPDATE SET
            type = EXCLUDED.type,
            content_hash = EXCLUDED.content_hash,
            data = EXCLUDED.data,
            file_path = EXCLUDED.file_path,
            file_size = EXCLUDED.file_size,
            last_modified = EXCLUDED.last_modified,
            is_production_ready = EXCLUDED.is_production_ready,
            indexed_at = CURRENT_TIMESTAMP
        `, [
          key,
          item.type,
          hashData.hash,
          JSON.stringify(item.data),
          item.path,
          hashData.size,
          item.lastModified,
          item.isProductionReady || false
        ]);
      }

      // Insert/update module registry
      for (const [moduleId, moduleInfo] of this.moduleRegistry) {
        let moduleData = this.index.get(moduleId)?.data;
        
        await pool.query(`
          INSERT INTO module_registry (module_id, version, name, category, status, capabilities, dependencies, discovery_metadata, execution_metadata, claude_integration, module_path, loaded, initialized, healthy)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (module_id) DO UPDATE SET
            version = EXCLUDED.version,
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            status = EXCLUDED.status,
            capabilities = EXCLUDED.capabilities,
            dependencies = EXCLUDED.dependencies,
            discovery_metadata = EXCLUDED.discovery_metadata,
            execution_metadata = EXCLUDED.execution_metadata,
            claude_integration = EXCLUDED.claude_integration,
            module_path = EXCLUDED.module_path,
            loaded = EXCLUDED.loaded,
            initialized = EXCLUDED.initialized,
            healthy = EXCLUDED.healthy,
            last_updated = CURRENT_TIMESTAMP
        `, [
          moduleId,
          moduleInfo.version,
          moduleInfo.name,
          moduleInfo.category,
          moduleInfo.status,
          JSON.stringify(moduleInfo.capabilities),
          JSON.stringify(moduleInfo.dependencies),
          JSON.stringify(moduleData?.discovery || {}),
          JSON.stringify(moduleData?.execution || {}),
          JSON.stringify(moduleData?.claudeIntegration || {}),
          moduleInfo.path,
          moduleInfo.loaded,
          moduleInfo.initialized,
          moduleInfo.healthy
        ]);
      }

      // Insert/update content hashes
      for (const [key, hashData] of this.contentHashes) {
        await pool.query(`
          INSERT INTO library_content_hashes (key, content_hash, file_path, file_size, computed_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (key) DO UPDATE SET
            content_hash = EXCLUDED.content_hash,
            file_path = EXCLUDED.file_path,
            file_size = EXCLUDED.file_size,
            computed_at = EXCLUDED.computed_at
        `, [
          key,
          hashData.hash,
          hashData.path,
          hashData.size,
          hashData.computedAt
        ]);
      }

      console.log('Enhanced library data synced to database');
    } catch (error) {
      console.error('Failed to sync to database:', error);
      throw error;
    }
  }

  /**
   * Parse module card from markdown
   */
  parseModuleCard(content) {
    let moduleData = {
      id: '',
      name: '',
      domain: '',
      status: '',
      implementation: '',
      components: []
    };

    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# Module ID:')) {
        moduleData.id = line.replace('# Module ID:', '').trim();
      } else if (line.startsWith('# Module Name:')) {
        moduleData.name = line.replace('# Module Name:', '').trim();
      } else if (line.startsWith('# Domain:')) {
        moduleData.domain = line.replace('# Domain:', '').trim();
      } else if (line.startsWith('# Status:')) {
        moduleData.status = line.replace('# Status:', '').trim();
      } else if (line.startsWith('# Implementation:')) {
        moduleData.implementation = line.replace('# Implementation:', '').trim();
      }
    }

    return moduleData;
  }

  /**
   * Parse component card from markdown
   */
  parseComponentCard(content) {
    let componentData = {
      id: '',
      name: '',
      type: '',
      module: '',
      status: ''
    };

    let lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# Component ID:')) {
        componentData.id = line.replace('# Component ID:', '').trim();
      } else if (line.startsWith('# Component Name:')) {
        componentData.name = line.replace('# Component Name:', '').trim();
      } else if (line.startsWith('# Type:')) {
        componentData.type = line.replace('# Type:', '').trim();
      } else if (line.startsWith('# Module:')) {
        componentData.module = line.replace('# Module:', '').trim();
      } else if (line.startsWith('# Status:')) {
        componentData.status = line.replace('# Status:', '').trim();
      }
    }

    return componentData;
  }

  /**
   * Get library statistics
   */
  getStatistics() {
    return {
      totalIndexed: this.index.size,
      plugAndPlayModules: Array.from(this.index.values()).filter(i => i.type === 'plug-and-play-module').length,
      legacyModules: Array.from(this.index.values()).filter(i => i.type === 'legacy-module').length,
      registeredModules: this.moduleRegistry.size,
      productionReady: Array.from(this.moduleRegistry.values()).filter(m => m.isProductionReady).length,
      contentHashes: this.contentHashes.size,
      dependencyGraphEntries: this.dependencyGraph.size
    };
  }
}

module.exports = EnhancedLibraryKnowledgeService;