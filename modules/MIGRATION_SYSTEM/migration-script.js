/**
 * Devin Module Migration System
 * Migrates legacy Devin files to modular system
 * Only processes independent Devin files - NO Claude AI or dual-use files
 */

const fs = require('fs');
const path = require('path');

class ModuleMigrationSystem {
  constructor() {
    this.sourceDir = 'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN';
    this.targetDir = 'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN\\modules';
    this.excludedDirs = ['.claude', '.ai', 'dual-use', 'claude'];
    this.migrationStats = {
      total: 0,
      completed: 0,
      backendOnly: 0,
      frontendOnly: 0,
      skeleton: 0,
      failed: 0
    };
  }

  /**
   * Check if file is safe to migrate (independent Devin file only)
   */
  isSafeToMigrate(filePath) {
    // Exclude Claude AI directories
    for (const excluded of this.excludedDirs) {
      if (filePath.includes(excluded)) {
        return false;
      }
    }

    // Exclude dual-use files
    if (filePath.includes('dual-use')) {
      return false;
    }

    // Only process legacy Devin files
    if (!filePath.includes('legacy')) {
      return false;
    }

    return true;
  }

  /**
   * Analyze service file completeness
   */
  analyzeServiceFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = {
        hasConstructor: content.includes('constructor()'),
        hasMethods: content.includes('async function') || content.includes('function'),
        hasDatabase: content.includes('getPostgreSQL') || content.includes('database'),
        hasAuth: content.includes('authMiddleware') || content.includes('auth'),
        hasErrorHandling: content.includes('try') && content.includes('catch'),
        lineCount: content.split('\n').length,
        isComplete: false,
        category: 'SKELETON'
      };

      // Determine completeness
      if (stats.hasConstructor && stats.hasMethods && stats.hasDatabase && stats.lineCount > 50) {
        stats.isComplete = true;
        stats.category = 'COMPLETE';
      } else if (stats.hasConstructor && stats.hasMethods) {
        stats.category = 'BACKEND_ONLY';
      } else if (stats.lineCount > 20) {
        stats.category = 'SKELETON';
      } else {
        stats.category = 'ROUTES_ONLY';
      }

      return stats;
    } catch (error) {
      return { error: error.message, category: 'ERROR' };
    }
  }

  /**
   * Map legacy service to module ID
   */
  mapServiceToModule(serviceName) {
    const serviceMappings = {
      // ERP Services
      'erpService.js': 'M300_ERP_CORE',
      'financialService.js': 'M301_FINANCIAL_MANAGEMENT',
      'accountingService.js': 'M302_ACCOUNTING',
      'inventoryService.js': 'M303_INVENTORY_MANAGEMENT',
      'procurementService.js': 'M304_PROCUREMENT',
      'supplyChainService.js': 'M305_SUPPLY_CHAIN',
      'hrService.js': 'M306_HUMAN_RESOURCES',
      'payrollService.js': 'M307_PAYROLL',
      'assetAccountingService.js': 'M308_ASSET_MANAGEMENT',
      'costService.js': 'M309_COST_MANAGEMENT',

      // AI Services
      'aiService.js': 'M400_AI_CORE',
      'aiGatewayService.js': 'M401_AI_GATEWAY',
      'aiOrchestrationService.js': 'M402_AI_ORCHESTRATION',
      'agriculturalIntelligenceService.js': 'M403_AGRICULTURAL_AI',
      'decisionSupportService.js': 'M404_DECISION_SUPPORT',
      'predictiveAnalyticsService.js': 'M405_PREDICTIVE_ANALYTICS',
      'machineLearningService.js': 'M406_MACHINE_LEARNING',
      'conversationalAIService.js': 'M407_CONVERSATIONAL_AI',
      'knowledgeService.js': 'M408_KNOWLEDGE_MANAGEMENT',
      'recommendationService.js': 'M409_RECOMMENDATION_ENGINE',

      // Agricultural Services
      'cropManagementService.js': 'M100_CROP_MANAGEMENT',
      'livestockManagementService.js': 'M101_LIVESTOCK_MANAGEMENT',
      'dairyService.js': 'M102_DAIRY_MANAGEMENT',
      'fisheriesService.js': 'M103_FISHERIES_MANAGEMENT',
      'soilManagementService.js': 'M104_SOIL_MANAGEMENT',
      'weatherService.js': 'M105_WEATHER_INTELLIGENCE',
      'irrigationService.js': 'M106_IRRIGATION_SYSTEMS',
      'pestManagementService.js': 'M107_PEST_MANAGEMENT',
      'fertilizerInventoryService.js': 'M108_FERTILIZER_MANAGEMENT',
      'seedVaultService.js': 'M109_SEED_MANAGEMENT',

      // Enterprise Services
      'organizationManagementService.js': 'M200_ORGANIZATION_MANAGEMENT',
      'projectManagementService.js': 'M201_PROJECT_MANAGEMENT',
      'resourceManagementService.js': 'M202_RESOURCE_MANAGEMENT',
      'workflowService.js': 'M203_WORKFLOW_AUTOMATION',
      'documentManagementService.js': 'M204_DOCUMENT_MANAGEMENT',
      'complianceService.js': 'M205_COMPLIANCE_MANAGEMENT',
      'auditService.js': 'M206_AUDIT_MANAGEMENT',
      'riskManagementService.js': 'M207_RISK_MANAGEMENT',
      'governanceService.js': 'M208_GOVERNANCE',
      'reportingService.js': 'M209_REPORTING_ANALYTICS'
    };

    return serviceMappings[serviceName] || this.generateModuleId(serviceName);
  }

  /**
   * Generate module ID from service name
   */
  generateModuleId(serviceName) {
    // Remove 'Service.js' suffix
    const baseName = serviceName.replace('Service.js', '').replace('.js', '');
    // Convert to module ID format
    const moduleId = 'M' + Math.floor(Math.random() * 900) + 100 + '_' + baseName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    return moduleId;
  }

  /**
   * Create module structure
   */
  createModuleStructure(moduleId, serviceFile, analysis) {
    const moduleDir = path.join(this.targetDir, moduleId);
    
    // Create directory structure
    const dirs = [
      moduleDir,
      path.join(moduleDir, 'backend'),
      path.join(moduleDir, 'frontend'),
      path.join(moduleDir, 'api'),
      path.join(moduleDir, 'docs'),
      path.join(moduleDir, 'tests')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Copy service file to module
    const targetServiceFile = path.join(moduleDir, 'backend', 'service.js');
    fs.copyFileSync(serviceFile, targetServiceFile);

    // Create module.json
    const moduleJson = this.createModuleJson(moduleId, serviceFile, analysis);
    fs.writeFileSync(
      path.join(moduleDir, 'module.json'),
      JSON.stringify(moduleJson, null, 2)
    );

    return moduleDir;
  }

  /**
   * Create module.json
   */
  createModuleJson(moduleId, serviceFile, analysis) {
    const serviceName = path.basename(serviceFile);
    const displayName = serviceName.replace('Service.js', '').replace('.js', '')
      .replace(/([A-Z])/g, ' $1').trim()
      .replace(/^./, str => str.toUpperCase());

    return {
      moduleId: moduleId,
      version: "1.0.0",
      name: displayName,
      description: `Migrated from legacy service: ${serviceName}`,
      category: this.determineCategory(moduleId),
      status: analysis.category,
      migration: {
        sourceFile: serviceFile,
        migratedAt: new Date().toISOString(),
        analysis: analysis
      },
      dependencies: {
        modules: [],
        services: analysis.hasDatabase ? ["postgresql"] : [],
        libraries: {
          backend: ["express", "winston"],
          frontend: ["react", "zustand"]
        }
      },
      completeness: {
        backend: analysis.category === 'COMPLETE' || analysis.category === 'BACKEND_ONLY',
        frontend: false,
        routes: false,
        tests: false
      }
    };
  }

  /**
   * Determine module category from ID
   */
  determineCategory(moduleId) {
    if (moduleId.startsWith('M1')) return 'platform';
    if (moduleId.startsWith('M2')) return 'domain';
    if (moduleId.startsWith('M3')) return 'erp';
    if (moduleId.startsWith('M4')) return 'ai';
    return 'enterprise';
  }

  /**
   * Execute migration
   */
  async executeMigration() {
    console.log('Starting Devin file migration...');
    console.log('Source:', this.sourceDir);
    console.log('Target:', this.targetDir);

    const legacyDir = path.join(this.sourceDir, 'backend', 'src', 'services', 'legacy');
    
    if (!fs.existsSync(legacyDir)) {
      console.error('Legacy directory not found:', legacyDir);
      return;
    }

    const files = fs.readdirSync(legacyDir);
    this.migrationStats.total = files.length;

    console.log(`Found ${files.length} legacy service files`);

    for (const file of files) {
      const filePath = path.join(legacyDir, file);
      
      if (!this.isSafeToMigrate(filePath)) {
        console.log(`Skipping excluded file: ${file}`);
        continue;
      }

      console.log(`Processing: ${file}`);

      const analysis = this.analyzeServiceFile(filePath);
      const moduleId = this.mapServiceToModule(file);

      try {
        this.createModuleStructure(moduleId, filePath, analysis);
        this.migrationStats.completed++;
        
        if (analysis.category === 'BACKEND_ONLY') this.migrationStats.backendOnly++;
        if (analysis.category === 'SKELETON') this.migrationStats.skeleton++;
        
        console.log(`✅ Migrated: ${file} -> ${moduleId} (${analysis.category})`);
      } catch (error) {
        this.migrationStats.failed++;
        console.error(`❌ Failed: ${file} - ${error.message}`);
      }
    }

    this.printMigrationStats();
  }

  /**
   * Print migration statistics
   */
  printMigrationStats() {
    console.log('\n=== MIGRATION STATISTICS ===');
    console.log(`Total Files Processed: ${this.migrationStats.total}`);
    console.log(`Successfully Migrated: ${this.migrationStats.completed}`);
    console.log(`Backend Only: ${this.migrationStats.backendOnly}`);
    console.log(`Skeleton: ${this.migrationStats.skeleton}`);
    console.log(`Failed: ${this.migrationStats.failed}`);
    console.log('=============================\n');
  }
}

// Execute migration
const migration = new ModuleMigrationSystem();
migration.executeMigration().catch(console.error);

module.exports = ModuleMigrationSystem;