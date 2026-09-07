/**
 * Frontend Page Migration System
 * Migrates 124 frontend pages to modular system
 * Only processes independent Devin files - NO Claude AI or dual-use files
 */

const fs = require('fs');
const path = require('path');

class FrontendMigrationSystem {
  constructor() {
    this.sourceDir = 'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN';
    this.targetDir = 'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN\\modules';
    this.excludedDirs = ['.claude', '.ai', 'dual-use', 'claude'];
    this.migrationStats = {
      total: 0,
      completed: 0,
      matched: 0,
      unmatched: 0,
      failed: 0
    };
  }

  /**
   * Check if file is safe to migrate (independent Devin file only)
   */
  isSafeToMigrate(filePath) {
    // Normalize path for Windows
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Exclude Claude AI directories
    for (const excluded of this.excludedDirs) {
      if (normalizedPath.includes(excluded)) {
        return false;
      }
    }

    // Exclude dual-use files
    if (normalizedPath.includes('dual-use')) {
      return false;
    }

    return true;
  }

  /**
   * Match frontend page with backend module
   */
  matchWithBackend(pageName) {
    const pageMappings = {
      // Agricultural Pages
      'CropManagementPage.jsx': 'M100_CROP_MANAGEMENT',
      'LivestockManagementPage.jsx': 'M101_LIVESTOCK_MANAGEMENT',
      'DairyManagementPage.jsx': 'M102_DAIRY_MANAGEMENT',
      'FisheriesManagementPage.jsx': 'M103_FISHERIES_MANAGEMENT',
      'SoilManagementPage.jsx': 'M104_SOIL_MANAGEMENT',
      'ClimateWeatherPage.jsx': 'M105_WEATHER_INTELLIGENCE',
      'FertilizerInventoryPage.jsx': 'M108_FERTILIZER_MANAGEMENT',
      'SeedVaultPage.jsx': 'M109_SEED_MANAGEMENT',
      'IrrigationManagementPage.jsx': 'M106_IRRIGATION_SYSTEMS',
      'HorticultureManagementPage.jsx': 'M868100_HORTICULTUREMANAGEMENT',
      'PoultryManagementPage.jsx': 'M18100_POULTRY',
      'GoatFarmingPage.jsx': 'M82100_GOAT',
      'SheepFarmingPage.jsx': 'M499100_SHEEP',
      'PigFarmingPage.jsx': 'M858100_PIG',
      'AnimalHealthPage.jsx': 'M87100_ANIMALHEALTH',

      // Enterprise Pages
      'PlatformManagementPage.jsx': 'M200_ORGANIZATION_MANAGEMENT',
      'ProjectSystemsPage.jsx': 'M865100_PROJECTSYSTEMS',
      'OperationsManagementPage.jsx': 'M74100_OPERATIONSMANAGEMENT',
      'SystemAdministrationPage.jsx': 'M840100_SYSTEMADMINISTRATION',
      'IdentityManagementPage.jsx': 'M501100_IDENTITYMANAGEMENT',
      'CommunityManagementPage.jsx': 'M602100_COMMUNITYMANAGEMENT',
      'GovernmentDashboardPage.jsx': 'M652100_GOVERNMENTSCHEME',
      'SubsidyManagementPage.jsx': 'M386100_SUBSIDY',
      'VillageRegistryPage.jsx': 'M445100_VILLAGEPROFILE',

      // ERP Pages
      'ERPDashboard.jsx': 'M300_ERP_CORE',
      'AssetAccountingPage.jsx': 'M308_ASSET_MANAGEMENT',
      'CostControlPage.jsx': 'M771100_COSTCONTROL',
      'LogisticsPage.jsx': 'M615100_LOGISTICS',
      'LogisticsProviderPage.jsx': 'M100100_LOGISTICSENHANCEMENT',
      'MachineryManagementPage.jsx': 'M290100_MACHINERYACCESS',
      'InsurancePage.jsx': 'M359100_INSURANCE',
      'WaterManagementPage.jsx': 'M77100_WATERMANAGEMENT',
      'EnergyManagementPage.jsx': 'M39100_RENEWABLEENERGY',

      // AI Pages
      'AIBackbonePage.jsx': 'M400_AI_CORE',
      'AIDashboard.jsx': 'M401_AI_GATEWAY',
      'AnalyticsPage.jsx': 'M746100_ANALYTICS',
      'ClimateAdvisoryPage.jsx': 'M403_AGRICULTURAL_AI',
      'DecisionSupportPage.jsx': 'M404_DECISION_SUPPORT',
      'PredictiveAnalyticsPage.jsx': 'M405_PREDICTIVE_ANALYTICS',
      'FarmAdvisorPage.jsx': 'M407_CONVERSATIONAL_AI',
      'ResearchDashboardPage.jsx': 'M408_KNOWLEDGE_MANAGEMENT'
    };

    return pageMappings[pageName] || null;
  }

  /**
   * Analyze frontend page completeness
   */
  analyzeFrontendPage(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = {
        hasReactComponent: content.includes('export default') || content.includes('function'),
        hasHooks: content.includes('useState') || content.includes('useEffect'),
        hasStateManagement: content.includes('zustand') || content.includes('Redux'),
        hasAPI: content.includes('axios') || content.includes('fetch'),
        hasRouting: content.includes('useNavigate') || content.includes('Link'),
        lineCount: content.split('\n').length,
        isComplete: false,
        category: 'SKELETON'
      };

      // Determine completeness
      if (stats.hasReactComponent && stats.hasHooks && stats.hasAPI && stats.lineCount > 50) {
        stats.isComplete = true;
        stats.category = 'COMPLETE';
      } else if (stats.hasReactComponent && stats.hasHooks) {
        stats.category = 'FRONTEND_ONLY';
      } else if (stats.lineCount > 20) {
        stats.category = 'SKELETON';
      } else {
        stats.category = 'BASIC';
      }

      return stats;
    } catch (error) {
      return { error: error.message, category: 'ERROR' };
    }
  }

  /**
   * Create frontend module structure
   */
  createFrontendModule(moduleId, pageFile, analysis) {
    const moduleDir = path.join(this.targetDir, moduleId);
    
    // Check if module exists
    if (!fs.existsSync(moduleDir)) {
      console.log(`Module directory not found: ${moduleId}`);
      return null;
    }

    // Create frontend directories
    const frontendDir = path.join(moduleDir, 'frontend');
    const dirs = [
      frontendDir,
      path.join(frontendDir, 'components'),
      path.join(frontendDir, 'pages'),
      path.join(frontendDir, 'hooks'),
      path.join(frontendDir, 'stores')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Copy page file to module
    const targetPageFile = path.join(frontendDir, 'pages', path.basename(pageFile));
    fs.copyFileSync(pageFile, targetPageFile);

    // Create index.jsx entry point
    const indexContent = this.createIndexJsx(moduleId, path.basename(pageFile));
    fs.writeFileSync(
      path.join(frontendDir, 'index.jsx'),
      indexContent
    );

    // Update module.json with frontend info
    this.updateModuleJson(moduleId, analysis);

    return moduleDir;
  }

  /**
   * Create index.jsx entry point
   */
  createIndexJsx(moduleId, pageName) {
    const componentName = pageName.replace('.jsx', '').replace('Page', '');
    
    return `/**
 * ${moduleId} Frontend Entry Point
 * Migrated from ${pageName}
 */

import React from 'react';
import { create } from 'zustand';
import ${componentName} from './pages/${pageName}';

// Module-specific store
export const use${componentName}Store = create((set, get) => ({
  // State
  data: null,
  loading: false,
  error: null,
  
  // Actions
  fetchData: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(\`/api/v1/${moduleId.toLowerCase()}/read/\${id}\`);
      const result = await response.json();
      if (result.success) {
        set({ data: result.data, loading: false });
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  clearError: () => set({ error: null }),
  clearData: () => set({ data: null })
}));

// Module routes configuration
export const moduleRoutes = [
  {
    path: '/${moduleId.toLowerCase()}',
    component: ${componentName},
    exact: true
  },
  {
    path: '/${moduleId.toLowerCase()}/:id',
    component: ${componentName},
    exact: true
  }
];

// Main export
export default {
  Component: ${componentName},
  store: use${componentName}Store,
  routes: moduleRoutes
};
`;
  }

  /**
   * Update module.json with frontend info
   */
  updateModuleJson(moduleId, analysis) {
    const moduleJsonPath = path.join(this.targetDir, moduleId, 'module.json');
    
    if (!fs.existsSync(moduleJsonPath)) {
      console.log(`Module.json not found: ${moduleId}, skipping update`);
      return;
    }

    try {
      const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
      
      // Add frontend information if it doesn't exist
      if (!moduleJson.execution) {
        moduleJson.execution = {};
      }
      
      moduleJson.execution.frontend = {
        entryPoint: 'frontend/index.jsx',
        routes: 'frontend/routes.json',
        mainComponent: `frontend/pages/${path.basename(analysis.pageFile)}`,
        migrated: true,
        completeness: analysis.category
      };
      
      if (!moduleJson.completeness) {
        moduleJson.completeness = {};
      }
      
      moduleJson.completeness.frontend = analysis.category === 'COMPLETE' || analysis.category === 'FRONTEND_ONLY';
      
      fs.writeFileSync(moduleJsonPath, JSON.stringify(moduleJson, null, 2));
    } catch (error) {
      console.log(`Failed to update module.json for ${moduleId}: ${error.message}`);
    }
  }

  /**
   * Execute frontend migration
   */
  async executeMigration() {
    console.log('Starting Frontend Page Migration...');
    console.log('Source:', this.sourceDir);
    console.log('Target:', this.targetDir);

    const pagesDir = path.join(this.sourceDir, 'frontend', 'src', 'pages');
    
    if (!fs.existsSync(pagesDir)) {
      console.error('Pages directory not found:', pagesDir);
      return;
    }

    const files = fs.readdirSync(pagesDir);
    this.migrationStats.total = files.length;

    console.log(`Found ${files.length} frontend page files`);

    for (const file of files) {
      const filePath = path.join(pagesDir, file);
      
      // Skip directories
      if (fs.statSync(filePath).isDirectory()) {
        continue;
      }

      if (!this.isSafeToMigrate(filePath)) {
        console.log(`Skipping excluded file: ${file}`);
        continue;
      }

      console.log(`Processing: ${file}`);

      const analysis = this.analyzeFrontendPage(filePath);
      analysis.pageFile = file; // Add page file reference
      const moduleId = this.matchWithBackend(file);

      if (moduleId) {
        try {
          this.createFrontendModule(moduleId, filePath, analysis);
          this.migrationStats.completed++;
          this.migrationStats.matched++;
          console.log(`✅ Migrated: ${file} -> ${moduleId} (${analysis.category})`);
        } catch (error) {
          this.migrationStats.failed++;
          console.error(`❌ Failed: ${file} - ${error.message}`);
        }
      } else {
        this.migrationStats.unmatched++;
        console.log(`⚠️ Unmatched: ${file} (no corresponding backend module)`);
      }
    }

    this.printMigrationStats();
  }

  /**
   * Print migration statistics
   */
  printMigrationStats() {
    console.log('\n=== FRONTEND MIGRATION STATISTICS ===');
    console.log(`Total Files Processed: ${this.migrationStats.total}`);
    console.log(`Successfully Migrated: ${this.migrationStats.completed}`);
    console.log(`Matched with Backend: ${this.migrationStats.matched}`);
    console.log(`Unmatched: ${this.migrationStats.unmatched}`);
    console.log(`Failed: ${this.migrationStats.failed}`);
    console.log('=====================================\n');
  }
}

// Execute migration
const migration = new FrontendMigrationSystem();
migration.executeMigration().catch(console.error);

module.exports = FrontendMigrationSystem;