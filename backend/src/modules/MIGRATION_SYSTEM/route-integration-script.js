/**
 * Route Integration & Cable Connection System
 * Migrates 111 route files and creates UIP cable connections
 * Only processes independent Devin files - NO Claude AI or dual-use files
 */

const fs = require('fs');
const path = require('path');

class RouteIntegrationSystem {
  constructor() {
    this.sourceDir = 'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN';
    this.targetDir = 'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN\\modules';
    this.excludedDirs = ['.claude', '.ai', 'dual-use', 'claude'];
    this.migrationStats = {
      total: 0,
      completed: 0,
      matched: 0,
      unmatched: 0,
      cablesCreated: 0,
      failed: 0
    };
  }

  /**
   * Check if file is safe to migrate (independent Devin file only)
   */
  isSafeToMigrate(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    for (const excluded of this.excludedDirs) {
      if (normalizedPath.includes(excluded)) {
        return false;
      }
    }

    if (normalizedPath.includes('dual-use')) {
      return false;
    }

    return true;
  }

  /**
   * Match route file with backend module
   */
  matchWithModule(routeName) {
    const routeMappings = {
      // Agricultural Routes
      'cropRoutes.js': 'M100_CROP_MANAGEMENT',
      'livestockRoutes.js': 'M101_LIVESTOCK_MANAGEMENT',
      'dairyRoutes.js': 'M102_DAIRY_MANAGEMENT',
      'fisheriesRoutes.js': 'M103_FISHERIES_MANAGEMENT',
      'soilRoutes.js': 'M104_SOIL_MANAGEMENT',
      'weatherRoutes.js': 'M105_WEATHER_INTELLIGENCE',
      'fertilizerRoutes.js': 'M108_FERTILIZER_MANAGEMENT',
      'seedRoutes.js': 'M109_SEED_MANAGEMENT',
      'irrigationRoutes.js': 'M106_IRRIGATION_SYSTEMS',
      'horticultureRoutes.js': 'M868100_HORTICULTUREMANAGEMENT',
      'poultryRoutes.js': 'M18100_POULTRY',
      'goatRoutes.js': 'M82100_GOAT',
      'sheepRoutes.js': 'M499100_SHEEP',
      'pigRoutes.js': 'M858100_PIG',
      'animalHealthRoutes.js': 'M87100_ANIMALHEALTH',

      // Enterprise Routes
      'organizationRoutes.js': 'M200_ORGANIZATION_MANAGEMENT',
      'projectRoutes.js': 'M865100_PROJECTSYSTEMS',
      'operationsRoutes.js': 'M74100_OPERATIONSMANAGEMENT',
      'systemAdminRoutes.js': 'M840100_SYSTEMADMINISTRATION',
      'identityRoutes.js': 'M501100_IDENTITYMANAGEMENT',
      'communityRoutes.js': 'M602100_COMMUNITYMANAGEMENT',
      'governmentRoutes.js': 'M652100_GOVERNMENTSCHEME',
      'subsidyRoutes.js': 'M386100_SUBSIDY',
      'villageRoutes.js': 'M445100_VILLAGEPROFILE',

      // ERP Routes
      'erpRoutes.js': 'M300_ERP_CORE',
      'assetRoutes.js': 'M308_ASSET_MANAGEMENT',
      'costRoutes.js': 'M309_COST_MANAGEMENT',
      'logisticsRoutes.js': 'M615100_LOGISTICS',
      'machineryRoutes.js': 'M290100_MACHINERYACCESS',
      'insuranceRoutes.js': 'M359100_INSURANCE',
      'waterRoutes.js': 'M77100_WATERMANAGEMENT',
      'energyRoutes.js': 'M39100_RENEWABLEENERGY',

      // AI Routes
      'aiRoutes.js': 'M400_AI_CORE',
      'aiGatewayRoutes.js': 'M401_AI_GATEWAY',
      'analyticsRoutes.js': 'M746100_ANALYTICS',
      'agriculturalAIRoutes.js': 'M403_AGRICULTURAL_AI',
      'decisionSupportRoutes.js': 'M404_DECISION_SUPPORT',
      'predictiveRoutes.js': 'M405_PREDICTIVE_ANALYTICS',
      'conversationalAIRoutes.js': 'M407_CONVERSATIONAL_AI',
      'knowledgeRoutes.js': 'M408_KNOWLEDGE_MANAGEMENT'
    };

    return routeMappings[routeName] || null;
  }

  /**
   * Analyze route file completeness
   */
  analyzeRouteFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = {
        hasRouter: content.includes('Router') || content.includes('express'),
        hasRoutes: content.includes('.get') || content.includes('.post'),
        hasMiddleware: content.includes('middleware') || content.includes('auth'),
        hasValidation: content.includes('validation') || content.includes('schema'),
        lineCount: content.split('\n').length,
        isComplete: false,
        category: 'SKELETON'
      };

      if (stats.hasRouter && stats.hasRoutes && stats.hasMiddleware && stats.lineCount > 30) {
        stats.isComplete = true;
        stats.category = 'COMPLETE';
      } else if (stats.hasRouter && stats.hasRoutes) {
        stats.category = 'ROUTES_ONLY';
      } else if (stats.lineCount > 10) {
        stats.category = 'BASIC';
      } else {
        stats.category = 'MINIMAL';
      }

      return stats;
    } catch (error) {
      return { error: error.message, category: 'ERROR' };
    }
  }

  /**
   * Create cable connections for module
   */
  createCableConnections(moduleId) {
    const cableDefinitions = this.generateCableDefinitions(moduleId);
    const cables = [];

    for (const cableDef of cableDefinitions) {
      const cableId = this.generateCableId(cableDef.source, cableDef.target, cableDef.type);
      cables.push({
        cableId: cableId,
        ...cableDef,
        status: 'pending',
        protocol: 'uip-v1',
        bandwidth: cableDef.type === 'data' ? 'high' : 'medium',
        latency: 'low',
        encryption: true,
        circuitBreaker: true
      });
    }

    return cables;
  }

  /**
   * Generate cable definitions for module
   */
  generateCableDefinitions(moduleId) {
    const definitions = [];

    // Common cable patterns based on module category
    if (moduleId.startsWith('M1')) {
      // Platform modules connect to all
      definitions.push(
        { source: moduleId, target: 'M001_PLATFORM_CORE', type: 'data' },
        { source: moduleId, target: 'M400_AI_CORE', type: 'ai' }
      );
    } else if (moduleId.startsWith('M2')) {
      // Domain modules connect to platform and AI
      definitions.push(
        { source: moduleId, target: 'M001_PLATFORM_CORE', type: 'data' },
        { source: moduleId, target: 'M403_AGRICULTURAL_AI', type: 'ai' }
      );
    } else if (moduleId.startsWith('M3')) {
      // ERP modules connect to platform and financial
      definitions.push(
        { source: moduleId, target: 'M001_PLATFORM_CORE', type: 'data' },
        { source: moduleId, target: 'M301_FINANCIAL_MANAGEMENT', type: 'data' }
      );
    } else if (moduleId.startsWith('M4')) {
      // AI modules connect to platform and provide AI services
      definitions.push(
        { source: 'M001_PLATFORM_CORE', target: moduleId, type: 'ai' },
        { source: moduleId, target: 'M400_AI_CORE', type: 'ai' }
      );
    }

    return definitions;
  }

  /**
   * Generate cable ID
   */
  generateCableId(source, target, type) {
    return `CABLE_${source}_TO_${target}_${type.toUpperCase()}`;
  }

  /**
   * Create route file for module
   */
  createRouteFile(moduleId, routeFile, analysis) {
    const moduleDir = path.join(this.targetDir, moduleId);
    
    if (!fs.existsSync(moduleDir)) {
      console.log(`Module directory not found: ${moduleId}`);
      return null;
    }

    // Create API directory
    const apiDir = path.join(moduleDir, 'api');
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }

    // Copy route file to module
    const targetRouteFile = path.join(apiDir, 'routes.js');
    fs.copyFileSync(routeFile, targetRouteFile);

    // Create OpenAPI specification
    const openApiSpec = this.createOpenApiSpec(moduleId, analysis);
    fs.writeFileSync(
      path.join(apiDir, 'openapi.json'),
      JSON.stringify(openApiSpec, null, 2)
    );

    // Create API client
    const apiClient = this.createApiClient(moduleId);
    fs.writeFileSync(
      path.join(apiDir, 'client.js'),
      apiClient
    );

    // Create cable connections
    const cables = this.createCableConnections(moduleId);
    this.saveCableConnections(moduleId, cables);

    // Update module.json with API info
    this.updateModuleJsonWithRoutes(moduleId, analysis, cables);

    return moduleDir;
  }

  /**
   * Create OpenAPI specification
   */
  createOpenApiSpec(moduleId, analysis) {
    return {
      openapi: '3.0.0',
      info: {
        title: moduleId,
        version: '1.0.0',
        description: `API for ${moduleId} module`
      },
      servers: [
        {
          url: `/api/v1/${moduleId.toLowerCase()}`,
          description: 'Production server'
        }
      ],
      paths: {
        '/': {
          get: {
            summary: 'List resources',
            tags: [moduleId],
            responses: {
              '200': {
                description: 'Successful response'
              }
            }
          },
          post: {
            summary: 'Create resource',
            tags: [moduleId],
            responses: {
              '201': {
                description: 'Resource created'
              }
            }
          }
        },
        '/{id}': {
          get: {
            summary: 'Get resource by ID',
            tags: [moduleId],
            responses: {
              '200': {
                description: 'Successful response'
              }
            }
          },
          put: {
            summary: 'Update resource',
            tags: [moduleId],
            responses: {
              '200': {
                description: 'Resource updated'
              }
            }
          },
          delete: {
            summary: 'Delete resource',
            tags: [moduleId],
            responses: {
              '204': {
                description: 'Resource deleted'
              }
            }
          }
        }
      }
    };
  }

  /**
   * Create API client
   */
  createApiClient(moduleId) {
    return `/**
 * API Client for ${moduleId}
 * Auto-generated by migration system
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class ${moduleId.replace(/[^a-zA-Z0-9]/g, '')}Client {
  constructor() {
    this.baseURL = \`\${API_BASE_URL}/api/v1/${moduleId.toLowerCase()}\`;
  }

  async list(params = {}) {
    const response = await axios.get(this.baseURL, { params });
    return response.data;
  }

  async getById(id) {
    const response = await axios.get(\`\${this.baseURL}/\${id}\`);
    return response.data;
  }

  async create(data) {
    const response = await axios.post(this.baseURL, data);
    return response.data;
  }

  async update(id, data) {
    const response = await axios.put(\`\${this.baseURL}/\${id}\`, data);
    return response.data;
  }

  async delete(id) {
    const response = await axios.delete(\`\${this.baseURL}/\${id}\`);
    return response.data;
  }

  // AI operations
  async analyze(data) {
    const response = await axios.post(\`\${this.baseURL}/analyze\`, data);
    return response.data;
  }

  async decide(data) {
    const response = await axios.post(\`\${this.baseURL}/decide\`, data);
    return response.data;
  }

  async strategize(data) {
    const response = await axios.post(\`\${this.baseURL}/strategize\`, data);
    return response.data;
  }
}

export default new ${moduleId.replace(/[^a-zA-Z0-9]/g, '')}Client();
`;
  }

  /**
   * Save cable connections
   */
  saveCableConnections(moduleId, cables) {
    const cablesFile = path.join(this.targetDir, moduleId, 'cables.json');
    fs.writeFileSync(cablesFile, JSON.stringify(cables, null, 2));
    this.migrationStats.cablesCreated += cables.length;
  }

  /**
   * Update module.json with route info
   */
  updateModuleJsonWithRoutes(moduleId, analysis, cables) {
    const moduleJsonPath = path.join(this.targetDir, moduleId, 'module.json');
    
    if (!fs.existsSync(moduleJsonPath)) {
      console.log(`Module.json not found: ${moduleId}, skipping update`);
      return;
    }

    try {
      const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
      
      if (!moduleJson.execution) {
        moduleJson.execution = {};
      }
      
      moduleJson.execution.api = {
        specification: 'api/openapi.json',
        baseEndpoint: `/api/v1/${moduleId.toLowerCase()}`,
        contracts: 'api/contracts.json',
        client: 'api/client.js',
        migrated: true,
        completeness: analysis.category
      };
      
      moduleJson.cables = {
        incoming: cables.filter(c => c.target === moduleId).map(c => c.cableId),
        outgoing: cables.filter(c => c.source === moduleId).map(c => c.cableId)
      };
      
      if (!moduleJson.completeness) {
        moduleJson.completeness = {};
      }
      
      moduleJson.completeness.routes = analysis.category === 'COMPLETE' || analysis.category === 'ROUTES_ONLY';
      
      fs.writeFileSync(moduleJsonPath, JSON.stringify(moduleJson, null, 2));
    } catch (error) {
      console.log(`Failed to update module.json for ${moduleId}: ${error.message}`);
    }
  }

  /**
   * Execute route integration
   */
  async executeIntegration() {
    console.log('Starting Route Integration & Cable Connection Creation...');
    console.log('Source:', this.sourceDir);
    console.log('Target:', this.targetDir);

    const routesDir = path.join(this.sourceDir, 'backend', 'src', 'routes');
    
    if (!fs.existsSync(routesDir)) {
      console.error('Routes directory not found:', routesDir);
      return;
    }

    const files = fs.readdirSync(routesDir);
    this.migrationStats.total = files.length;

    console.log(`Found ${files.length} route files`);

    for (const file of files) {
      const filePath = path.join(routesDir, file);
      
      if (fs.statSync(filePath).isDirectory()) {
        continue;
      }

      if (!this.isSafeToMigrate(filePath)) {
        console.log(`Skipping excluded file: ${file}`);
        continue;
      }

      console.log(`Processing: ${file}`);

      const analysis = this.analyzeRouteFile(filePath);
      const moduleId = this.matchWithModule(file);

      if (moduleId) {
        try {
          this.createRouteFile(moduleId, filePath, analysis);
          this.migrationStats.completed++;
          this.migrationStats.matched++;
          console.log(`✅ Integrated: ${file} -> ${moduleId} (${analysis.category})`);
        } catch (error) {
          this.migrationStats.failed++;
          console.error(`❌ Failed: ${file} - ${error.message}`);
        }
      } else {
        this.migrationStats.unmatched++;
        console.log(`⚠️ Unmatched: ${file} (no corresponding module)`);
      }
    }

    this.printIntegrationStats();
  }

  /**
   * Print integration statistics
   */
  printIntegrationStats() {
    console.log('\n=== ROUTE INTEGRATION STATISTICS ===');
    console.log(`Total Files Processed: ${this.migrationStats.total}`);
    console.log(`Successfully Integrated: ${this.migrationStats.completed}`);
    console.log(`Matched with Modules: ${this.migrationStats.matched}`);
    console.log(`Cable Connections Created: ${this.migrationStats.cablesCreated}`);
    console.log(`Unmatched: ${this.migrationStats.unmatched}`);
    console.log(`Failed: ${this.migrationStats.failed}`);
    console.log('=====================================\n');
  }
}

// Execute integration
const integration = new RouteIntegrationSystem();
integration.executeIntegration().catch(console.error);

module.exports = RouteIntegrationSystem;