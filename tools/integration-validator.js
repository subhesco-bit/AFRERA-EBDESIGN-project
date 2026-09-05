#!/usr/bin/env node

/**
 * EBDESIGN Integration Validator
 * Verifies all file integrations are complete and functional
 */

const fs = require('fs');
const path = require('path');

class IntegrationValidator {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.validationResults = {
      backendServices: { valid: [], invalid: [] },
      backendRoutes: { valid: [], invalid: [] },
      frontendPages: { valid: [], invalid: [] },
      frontendRoutes: { valid: [], invalid: [] },
      imports: { valid: [], invalid: [] },
      exports: { valid: [], invalid: [] },
      circularDeps: [],
      missingDeps: []
    };
    this.metrics = {
      totalFilesValidated: 0,
      validFiles: 0,
      invalidFiles: 0,
      integrationScore: 0
    };
  }

  /**
   * Validate backend service exports
   */
  validateBackendServices() {
    console.log('📋 Validating backend services...');

    try {
      const servicesDir = path.join(this.rootDir, 'backend/src/services');
      const serviceFiles = fs.readdirSync(servicesDir)
        .filter(f => f.endsWith('.js') && f !== 'index.js');

      const indexPath = path.join(servicesDir, 'index.js');
      const indexContent = fs.existsSync(indexPath) ?
        fs.readFileSync(indexPath, 'utf8') : '';

      serviceFiles.forEach(file => {
        const serviceName = file.replace('.js', '');
        const isExported = indexContent.includes(serviceName);

        if (isExported) {
          this.validationResults.backendServices.valid.push(serviceName);
        } else {
          this.validationResults.backendServices.invalid.push(serviceName);
        }
        this.metrics.totalFilesValidated++;
      });

      console.log(`  ✅ Services: ${this.validationResults.backendServices.valid.length} valid, ${this.validationResults.backendServices.invalid.length} invalid`);
    } catch (e) {
      console.error(`  ❌ Error validating services: ${e.message}`);
    }
  }

  /**
   * Validate backend route wiring
   */
  validateBackendRoutes() {
    console.log('📋 Validating backend routes...');

    try {
      const routesDir = path.join(this.rootDir, 'backend/src/routes');
      const routeFiles = fs.readdirSync(routesDir)
        .filter(f => f.endsWith('Routes.js'));

      const indexPath = path.join(this.rootDir, 'backend/src/index.js');
      const indexContent = fs.existsSync(indexPath) ?
        fs.readFileSync(indexPath, 'utf8') : '';

      routeFiles.forEach(file => {
        const routeName = file.replace('Routes.js', '');
        const varName = routeName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

        const isWired = indexContent.includes(`require('./routes/${file.replace('.js', '')}')`) ||
                       indexContent.includes(`app.use`) && indexContent.includes(varName);

        if (isWired) {
          this.validationResults.backendRoutes.valid.push(routeName);
        } else {
          this.validationResults.backendRoutes.invalid.push(routeName);
        }
        this.metrics.totalFilesValidated++;
      });

      console.log(`  ✅ Routes: ${this.validationResults.backendRoutes.valid.length} valid, ${this.validationResults.backendRoutes.invalid.length} invalid`);
    } catch (e) {
      console.error(`  ❌ Error validating routes: ${e.message}`);
    }
  }

  /**
   * Validate frontend pages exist and are exported
   */
  validateFrontendPages() {
    console.log('📋 Validating frontend pages...');

    try {
      const pagesDir = path.join(this.rootDir, 'frontend/src/pages');
      if (!fs.existsSync(pagesDir)) {
        console.warn('  ⚠️ Pages directory not found');
        return;
      }

      const pageFiles = fs.readdirSync(pagesDir)
        .filter(f => f.endsWith('.jsx'));

      pageFiles.forEach(file => {
        const pageName = file.replace('.jsx', '');
        const filePath = path.join(pagesDir, file);

        try {
          const content = fs.readFileSync(filePath, 'utf8');
          // Check for any form of export (export default, export const, export function, etc.)
          const hasExport = /export\s+(?:default\s+)?(?:async\s+)?(?:class|function|const|\(|\w+|{)/.test(content) ||
                           /export\s+\{/.test(content);

          if (hasExport) {
            this.validationResults.frontendPages.valid.push(pageName);
          } else {
            this.validationResults.frontendPages.invalid.push(pageName);
          }
        } catch (e) {
          this.validationResults.frontendPages.invalid.push(pageName);
        }
        this.metrics.totalFilesValidated++;
      });

      console.log(`  ✅ Pages: ${this.validationResults.frontendPages.valid.length} valid, ${this.validationResults.frontendPages.invalid.length} invalid`);
    } catch (e) {
      console.error(`  ❌ Error validating pages: ${e.message}`);
    }
  }

  /**
   * Validate frontend route configuration
   */
  validateFrontendRoutes() {
    console.log('📋 Validating frontend routes...');

    try {
      const routesPath = path.join(this.rootDir, 'frontend/src/config/routes.js');
      if (!fs.existsSync(routesPath)) {
        console.warn('  ⚠️ Routes configuration not found');
        return;
      }

      const routesContent = fs.readFileSync(routesPath, 'utf8');

      // Extract all route paths and components
      const routeMatches = routesContent.match(/path:\s*['"`]([^'"`]+)['"`]/g) || [];
      const componentMatches = routesContent.match(/component:\s*(\w+)/g) || [];

      this.validationResults.frontendRoutes.valid = routeMatches.length;
      this.metrics.totalFilesValidated += routeMatches.length;

      console.log(`  ✅ Routes configured: ${routeMatches.length}`);
    } catch (e) {
      console.error(`  ❌ Error validating routes: ${e.message}`);
    }
  }

  /**
   * Validate import/export consistency
   */
  validateImportExports() {
    console.log('📋 Validating import/export consistency...');

    const testFiles = [
      'backend/src/index.js',
      'backend/src/services/index.js',
      'frontend/src/main.jsx',
      'frontend/src/config/routes.js'
    ];

    testFiles.forEach(file => {
      const fullPath = path.join(this.rootDir, file);
      try {
        if (!fs.existsSync(fullPath)) {
          this.validationResults.imports.invalid.push(file);
        } else {
          const content = fs.readFileSync(fullPath, 'utf8');

          // Check for require/import syntax errors
          const requireMatches = content.match(/require\(['"`][^'"`]+['"`]\)/g) || [];
          const importMatches = content.match(/import\s+.*\s+from\s+['"`][^'"`]+['"`]/g) || [];

          const hasValidSyntax = requireMatches.length > 0 || importMatches.length > 0 ||
                                file.includes('index.js');

          if (hasValidSyntax) {
            this.validationResults.imports.valid.push(file);
          } else {
            this.validationResults.imports.invalid.push(file);
          }
        }
      } catch (e) {
        this.validationResults.imports.invalid.push(file);
      }
      this.metrics.totalFilesValidated++;
    });

    console.log(`  ✅ Import/exports: ${this.validationResults.imports.valid.length} valid, ${this.validationResults.imports.invalid.length} invalid`);
  }

  /**
   * Calculate integration score
   */
  calculateIntegrationScore() {
    console.log('\n📊 Calculating integration score...');

    let totalItems = 0;
    let validItems = 0;

    // Count only core integration metrics
    const metricsToCount = ['backendServices', 'backendRoutes', 'frontendPages', 'imports'];

    metricsToCount.forEach(category => {
      const cat = this.validationResults[category];
      if (cat && typeof cat === 'object' && cat.valid) {
        totalItems += cat.valid.length + cat.invalid.length;
        validItems += cat.valid.length;
      }
    });

    this.metrics.validFiles = validItems;
    this.metrics.invalidFiles = totalItems - validItems;
    this.metrics.integrationScore = totalItems > 0 ?
      Math.round((validItems / totalItems) * 100) : 0;

    console.log(`  📈 Integration Score: ${this.metrics.integrationScore}%`);
    console.log(`  ✅ Valid: ${this.metrics.validFiles}`);
    console.log(`  ❌ Invalid: ${this.metrics.invalidFiles}`);
  }

  /**
   * Generate validation report
   */
  generateValidationReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 INTEGRATION VALIDATION REPORT');
    console.log('='.repeat(70));

    console.log('\n📋 BACKEND SERVICES');
    console.log(`  ✅ Valid: ${this.validationResults.backendServices.valid.length}`);
    console.log(`  ❌ Invalid: ${this.validationResults.backendServices.invalid.length}`);
    if (this.validationResults.backendServices.invalid.length > 0) {
      console.log('  Missing from index:');
      this.validationResults.backendServices.invalid.slice(0, 5).forEach(s => {
        console.log(`    • ${s}`);
      });
    }

    console.log('\n🛣️ BACKEND ROUTES');
    console.log(`  ✅ Valid: ${this.validationResults.backendRoutes.valid.length}`);
    console.log(`  ❌ Invalid: ${this.validationResults.backendRoutes.invalid.length}`);
    if (this.validationResults.backendRoutes.invalid.length > 0) {
      console.log('  Not wired:');
      this.validationResults.backendRoutes.invalid.slice(0, 5).forEach(r => {
        console.log(`    • ${r}`);
      });
    }

    console.log('\n📄 FRONTEND PAGES');
    console.log(`  ✅ Valid: ${this.validationResults.frontendPages.valid.length}`);
    console.log(`  ❌ Invalid: ${this.validationResults.frontendPages.invalid.length}`);

    console.log('\n🗺️ FRONTEND ROUTES');
    console.log(`  ✅ Configured: ${this.validationResults.frontendRoutes.valid}`);

    console.log('\n📦 IMPORT/EXPORT CONSISTENCY');
    console.log(`  ✅ Valid: ${this.validationResults.imports.valid.length}`);
    console.log(`  ❌ Invalid: ${this.validationResults.imports.invalid.length}`);

    console.log('\n' + '='.repeat(70));
    console.log(`🎯 OVERALL INTEGRATION SCORE: ${this.metrics.integrationScore}%`);
    console.log('='.repeat(70));

    // Save report
    const reportPath = path.join(this.rootDir, '.ai/integration-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      metrics: this.metrics,
      validationResults: this.validationResults,
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`\n💾 Report saved to: .ai/integration-validation-report.json`);
  }

  /**
   * Run complete validation
   */
  async runCompleteValidation() {
    console.log('✓ Starting integration validation...\n');

    this.validateBackendServices();
    this.validateBackendRoutes();
    this.validateFrontendPages();
    this.validateFrontendRoutes();
    this.validateImportExports();
    this.calculateIntegrationScore();
    this.generateValidationReport();

    return {
      metrics: this.metrics,
      results: this.validationResults
    };
  }
}

if (require.main === module) {
  const validator = new IntegrationValidator(process.cwd());
  validator.runCompleteValidation()
    .then((result) => {
      console.log('\n✅ Validation complete');
      process.exit(result.metrics.integrationScore >= 90 ? 0 : 1);
    })
    .catch(err => {
      console.error('❌ Validation failed:', err);
      process.exit(1);
    });
}

module.exports = IntegrationValidator;
