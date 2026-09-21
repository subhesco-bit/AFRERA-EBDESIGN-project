#!/usr/bin/env node

/**
 * COMPREHENSIVE REPO AUDIT
 * Checks everything in repo vs what's needed
 * Creates inventory and missing items list
 */

const fs = require('fs');
const path = require('path');

class ComprehensiveRepoAudit {
  constructor() {
    this.inventory = {
      backend: { modules: {}, services: {}, routes: {}, controllers: {} },
      frontend: { pages: {}, components: {}, hooks: {}, utils: {} },
      database: { migrations: {}, schemas: {} },
      tests: { backend: {}, frontend: {} },
      docs: {}
    };
    this.missing = {};
    this.duplicates = [];
  }

  auditBackend() {
    console.log('\n📦 AUDITING BACKEND\n');

    const modulesDir = 'backend/src/modules';
    const servicesDir = 'backend/src/services';
    const routesDir = 'backend/src/routes';
    const controllersDir = 'backend/src/controllers';

    // Count module directories
    try {
      const modules = fs.readdirSync(modulesDir).filter(f => f.match(/^M\d+/));
      console.log(`✓ Module directories: ${modules.length}`);
      console.log(`  Range: M${modules[0]} to M${modules[modules.length-1]}`);

      modules.forEach(mod => {
        const files = fs.readdirSync(path.join(modulesDir, mod));
        this.inventory.backend.modules[mod] = {
          service: files.includes('service.js'),
          controller: files.includes('controller.js'),
          routes: files.includes('routes.js'),
          migration: files.some(f => f.includes('migration')),
          test: files.includes('test.js'),
          files: files
        };
      });

      const completeModules = modules.filter(m =>
        this.inventory.backend.modules[m].service &&
        this.inventory.backend.modules[m].controller &&
        this.inventory.backend.modules[m].routes
      );
      console.log(`✓ Modules with full structure (service/controller/routes): ${completeModules.length}\n`);
    } catch (e) {
      console.log(`✗ Modules audit failed: ${e.message}\n`);
    }

    // Count services
    try {
      const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('Service.js'));
      console.log(`✓ Backend services: ${services.length}`);
      this.inventory.backend.services = services;
    } catch (e) {
      console.log(`✗ Services audit failed: ${e.message}`);
    }

    // Count routes
    try {
      const routes = fs.readdirSync(routesDir).filter(f => f.endsWith('Routes.js') || f.endsWith('.js'));
      console.log(`✓ Route files: ${routes.length}\n`);
      this.inventory.backend.routes = routes;
    } catch (e) {
      console.log(`✗ Routes audit failed: ${e.message}\n`);
    }
  }

  auditFrontend() {
    console.log('📱 AUDITING FRONTEND\n');

    const pagesDir = 'frontend/src/pages';
    const componentsDir = 'frontend/src/components';

    // Count pages
    try {
      const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx') || fs.statSync(path.join(pagesDir, f)).isDirectory());
      console.log(`✓ Frontend pages: ${pages.length}`);
      this.inventory.frontend.pages = pages;
    } catch (e) {
      console.log(`✗ Pages audit failed: ${e.message}`);
    }

    // Count components
    try {
      const components = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx') || fs.statSync(path.join(componentsDir, f)).isDirectory());
      console.log(`✓ Frontend components: ${components.length}\n`);
      this.inventory.frontend.components = components;
    } catch (e) {
      console.log(`✗ Components audit failed: ${e.message}\n`);
    }
  }

  auditDatabase() {
    console.log('🗄️ AUDITING DATABASE\n');

    try {
      const migrationsDir = 'backend/src/database/migrations';
      const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      console.log(`✓ Database migrations: ${migrations.length}\n`);
      this.inventory.database.migrations = migrations;
    } catch (e) {
      console.log(`✗ Migrations audit failed: ${e.message}\n`);
    }
  }

  auditTests() {
    console.log('🧪 AUDITING TESTS\n');

    try {
      const backenTestsDir = 'backend/src/__tests__';
      const backendTests = fs.readdirSync(backenTestsDir).filter(f => f.endsWith('.test.js'));
      console.log(`✓ Backend tests: ${backendTests.length}`);
      this.inventory.tests.backend = backendTests;
    } catch (e) {
      console.log(`✗ Backend tests audit: ${e.message}`);
    }

    try {
      const frontendTestsDir = 'frontend/src/__tests__';
      const frontendTests = fs.readdirSync(frontendTestsDir).filter(f => f.endsWith('.test.js'));
      console.log(`✓ Frontend tests: ${frontendTests.length}\n`);
      this.inventory.tests.frontend = frontendTests;
    } catch (e) {
      console.log(`✗ Frontend tests audit: ${e.message}\n`);
    }
  }

  calculateMissing() {
    console.log('='.repeat(80));
    console.log('📊 MISSING ITEMS ANALYSIS\n');

    // Module completeness
    const moduleCount = Object.keys(this.inventory.backend.modules).length;
    const targetModules = 314; // M031-M344
    const moduleMissing = Math.max(0, targetModules - moduleCount);

    console.log(`MODULES:`);
    console.log(`  Have: ${moduleCount}`);
    console.log(`  Target (M031-M344): ${targetModules}`);
    console.log(`  Missing: ${moduleMissing} modules\n`);

    // Frontend pages
    const pageCount = this.inventory.frontend.pages.length;
    const targetPages = 383;
    const pageMissing = Math.max(0, targetPages - pageCount);

    console.log(`FRONTEND PAGES:`);
    console.log(`  Have: ${pageCount}`);
    console.log(`  Target: ${targetPages}`);
    console.log(`  Missing: ${pageMissing} pages\n`);

    // Components
    const componentCount = this.inventory.frontend.components.length;
    const targetComponents = 123;
    const componentMissing = Math.max(0, targetComponents - componentCount);

    console.log(`COMPONENTS:`);
    console.log(`  Have: ${componentCount}`);
    console.log(`  Target: ${targetComponents}`);
    console.log(`  Missing: ${componentMissing} components\n`);

    // Services
    const serviceCount = this.inventory.backend.services.length;
    const targetServices = 277;
    const serviceMissing = Math.max(0, targetServices - serviceCount);

    console.log(`SERVICES:`);
    console.log(`  Have: ${serviceCount}`);
    console.log(`  Target: ${targetServices}`);
    console.log(`  Missing: ${serviceMissing} services\n`);

    // Routes
    const routeCount = this.inventory.backend.routes.length;
    const targetRoutes = 358;
    const routeMissing = Math.max(0, targetRoutes - routeCount);

    console.log(`ROUTES:`);
    console.log(`  Have: ${routeCount}`);
    console.log(`  Target: ${targetRoutes}`);
    console.log(`  Missing: ${routeMissing} routes\n`);

    // Tests
    const backendTestCount = this.inventory.tests.backend.length;
    const frontendTestCount = this.inventory.tests.frontend.length;
    const totalTestsMissing = moduleCount - backendTestCount + pageCount - frontendTestCount;

    console.log(`TESTS:`);
    console.log(`  Backend tests: ${backendTestCount}/${moduleCount} (${((backendTestCount/moduleCount)*100).toFixed(1)}%)`);
    console.log(`  Frontend tests: ${frontendTestCount}/${pageCount} (${((frontendTestCount/pageCount)*100).toFixed(1)}%)`);
    console.log(`  Missing tests: ${totalTestsMissing}\n`);

    // Migrations
    const migrationCount = this.inventory.database.migrations.length;
    const targetMigrations = 422;
    const migrationMissing = Math.max(0, targetMigrations - migrationCount);

    console.log(`MIGRATIONS:`);
    console.log(`  Have: ${migrationCount}`);
    console.log(`  Target: ${targetMigrations}`);
    console.log(`  Missing: ${migrationMissing} migrations\n`);

    // Overall completion
    const totalNeeded = targetModules + targetPages + targetComponents + targetServices + targetRoutes + targetMigrations;
    const totalHave = moduleCount + pageCount + componentCount + serviceCount + routeCount + migrationCount;
    const overallCompletion = ((totalHave / totalNeeded) * 100).toFixed(1);

    console.log('='.repeat(80));
    console.log(`\n📈 OVERALL COMPLETION: ${overallCompletion}%\n`);
    console.log(`Total Items Have: ${totalHave}`);
    console.log(`Total Items Need: ${totalNeeded}`);
    console.log(`Total Items Missing: ${totalNeeded - totalHave}\n`);

    return {
      modules: { have: moduleCount, target: targetModules, missing: moduleMissing },
      pages: { have: pageCount, target: targetPages, missing: pageMissing },
      components: { have: componentCount, target: targetComponents, missing: componentMissing },
      services: { have: serviceCount, target: targetServices, missing: serviceMissing },
      routes: { have: routeCount, target: targetRoutes, missing: routeMissing },
      migrations: { have: migrationCount, target: targetMigrations, missing: migrationMissing },
      totalMissing: totalNeeded - totalHave,
      overallCompletion
    };
  }

  async execute() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 COMPREHENSIVE REPO AUDIT');
    console.log('='.repeat(80));

    this.auditBackend();
    this.auditFrontend();
    this.auditDatabase();
    this.auditTests();

    const results = this.calculateMissing();

    console.log('NEXT STEPS:');
    console.log(`1. Generate ${results.modules.missing} missing modules`);
    console.log(`2. Create ${results.pages.missing} missing frontend pages`);
    console.log(`3. Build ${results.components.missing} missing components`);
    console.log(`4. Create ${results.services.missing} missing services`);
    console.log(`5. Setup ${results.routes.missing} missing routes`);
    console.log(`6. Add ${results.migrations.missing} missing migrations`);
    console.log(`7. Write ${results.modules.missing + results.pages.missing} missing tests\n`);
  }
}

const audit = new ComprehensiveRepoAudit();
audit.execute().catch(console.error);
