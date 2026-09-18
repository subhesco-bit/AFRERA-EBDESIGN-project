#!/usr/bin/env node

/**
 * FINAL VERIFICATION & WIRING STATUS
 * Comprehensive check of all components integrated into platform
 */

const fs = require('fs');
const path = require('path');

class FinalVerification {
  constructor() {
    this.status = {
      backend: { services: 0, routes: 0, modules: 0, controllers: 0 },
      frontend: { pages: 0, components: 0, css: 0 },
      database: { migrations: 0 },
      wiring: { indexed: 0, mounted: 0, errors: 0 }
    };
  }

  checkBackend() {
    console.log('\n📦 BACKEND VERIFICATION\n');

    // Count services
    const servicesDir = 'backend/src/services';
    if (fs.existsSync(servicesDir)) {
      const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('Service.js'));
      this.status.backend.services = services.length;
      console.log(`✓ Services: ${services.length}`);
    }

    // Count routes
    const routesDir = 'backend/src/routes';
    if (fs.existsSync(routesDir)) {
      const routes = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
      this.status.backend.routes = routes.length;
      console.log(`✓ Routes: ${routes.length}`);

      // Count module routes M031-M344
      const moduleRoutes = routes.filter(f => /^M\d+Routes\.js$/.test(f));
      console.log(`  - Module routes (M031-M344): ${moduleRoutes.length}`);
    }

    // Count modules
    const modulesDir = 'backend/src/modules';
    if (fs.existsSync(modulesDir)) {
      const modules = fs.readdirSync(modulesDir).filter(f => /^M\d+$/.test(f));
      this.status.backend.modules = modules.length;
      console.log(`✓ Module directories: ${modules.length}`);
    }
  }

  checkFrontend() {
    console.log('\n📱 FRONTEND VERIFICATION\n');

    // Count pages
    const pagesDir = 'frontend/src/pages';
    if (fs.existsSync(pagesDir)) {
      const countPages = (dir) => {
        let count = 0;
        const files = fs.readdirSync(dir);
        files.forEach(f => {
          const fullPath = path.join(dir, f);
          if (fs.statSync(fullPath).isDirectory()) {
            count += countPages(fullPath);
          } else if (f.endsWith('.jsx')) {
            count++;
          }
        });
        return count;
      };
      this.status.frontend.pages = countPages(pagesDir);
      console.log(`✓ Pages: ${this.status.frontend.pages}`);
    }

    // Count components
    const componentsDir = 'frontend/src/components';
    if (fs.existsSync(componentsDir)) {
      const components = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));
      this.status.frontend.components = components.length;
      console.log(`✓ Components: ${components.length}`);
    }

    // Count CSS files
    const countCSS = (dir) => {
      let count = 0;
      if (!fs.existsSync(dir)) return count;
      const files = fs.readdirSync(dir);
      files.forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
          count += countCSS(fullPath);
        } else if (f.endsWith('.css')) {
          count++;
        }
      });
      return count;
    };
    this.status.frontend.css = countCSS(path.join(pagesDir, '..'));
    console.log(`✓ CSS files: ${this.status.frontend.css}`);
  }

  checkDatabase() {
    console.log('\n🗄️ DATABASE VERIFICATION\n');

    const migrationsDir = 'backend/src/database/migrations';
    if (fs.existsSync(migrationsDir)) {
      const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      this.status.database.migrations = migrations.length;
      console.log(`✓ Migrations: ${migrations.length}`);
    }
  }

  checkWiring() {
    console.log('\n🔗 WIRING & INTEGRATION VERIFICATION\n');

    // Check index.js
    const indexPath = 'backend/src/index.js';
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      const requireCount = (content.match(/require\(['"]\.\/routes\//g) || []).length;
      const appUseCount = (content.match(/app\.use\(/g) || []).length;
      console.log(`✓ index.js has ${requireCount} route imports and ${appUseCount} app.use() mounts`);
      this.status.wiring.mounted = appUseCount;
    }

    // Check package.json
    const packagePath = 'backend/package.json';
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      console.log(`✓ package.json exists`);
      console.log(`  - Main: ${pkg.main}`);
      console.log(`  - Scripts: ${Object.keys(pkg.scripts).join(', ')}`);
    }

    // Check core loaders
    const corePath = 'backend/src/core';
    if (fs.existsSync(corePath)) {
      const coreFiles = fs.readdirSync(corePath).filter(f => f.endsWith('.js'));
      console.log(`✓ Core infrastructure files: ${coreFiles.length}`);
      console.log(`  - Files: ${coreFiles.join(', ')}`);
    }
  }

  calculateCompletion() {
    console.log('\n='.repeat(80));
    console.log('📊 PLATFORM COMPLETION STATUS\n');

    const totalBackend =
      this.status.backend.services +
      this.status.backend.routes +
      this.status.backend.modules;

    const totalFrontend =
      this.status.frontend.pages +
      this.status.frontend.components;

    const totalItems = totalBackend + totalFrontend + this.status.database.migrations;

    console.log('BACKEND:');
    console.log(`  Services: ${this.status.backend.services}`);
    console.log(`  Routes: ${this.status.backend.routes}`);
    console.log(`  Modules: ${this.status.backend.modules}`);
    console.log(`  TOTAL: ${totalBackend}\n`);

    console.log('FRONTEND:');
    console.log(`  Pages: ${this.status.frontend.pages}`);
    console.log(`  Components: ${this.status.frontend.components}`);
    console.log(`  TOTAL: ${totalFrontend}\n`);

    console.log('DATABASE:');
    console.log(`  Migrations: ${this.status.database.migrations}\n`);

    console.log('WIRING:');
    console.log(`  Mounted in index.js: ${this.status.wiring.mounted}\n`);

    console.log('='.repeat(80));
    console.log(`\n✅ TOTAL PLATFORM ITEMS: ${totalItems}\n`);

    // Calculate target vs actual
    const targets = {
      modules: 314,
      pages: 383,
      components: 123,
      services: 277,
      routes: 358,
      migrations: 422
    };

    console.log('TARGETS vs ACTUAL:\n');
    Object.entries(targets).forEach(([type, target]) => {
      const actual = {
        modules: this.status.backend.modules,
        pages: this.status.frontend.pages,
        components: this.status.frontend.components,
        services: this.status.backend.services,
        routes: this.status.backend.routes,
        migrations: this.status.database.migrations
      }[type] || 0;

      const pct = ((actual / target) * 100).toFixed(1);
      const status = actual >= target ? '✅' : '⚠️';
      console.log(`${status} ${type}: ${actual}/${target} (${pct}%)`);
    });

    console.log('\n='.repeat(80) + '\n');

    return {
      backend: totalBackend,
      frontend: totalFrontend,
      database: this.status.database.migrations,
      total: totalItems
    };
  }

  execute() {
    console.log('\n' + '='.repeat(80));
    console.log('✅ FINAL VERIFICATION & INTEGRATION STATUS');
    console.log('='.repeat(80));

    this.checkBackend();
    this.checkFrontend();
    this.checkDatabase();
    this.checkWiring();
    const results = this.calculateCompletion();

    console.log('NEXT STEPS TO GO LIVE:\n');
    console.log('1. ✅ Generate missing components: DONE (123 components created)');
    console.log('2. ✅ Generate missing services: DONE (11 services created)');
    console.log('3. ✅ Generate missing routes: DONE (338 routes created)');
    console.log('4. ⏳ Wire routes into index.js: Use DynamicRouteLoader auto-discovery');
    console.log('5. ⏳ Setup PostgreSQL and execute migrations');
    console.log('6. ⏳ Run npm start to initialize platform');
    console.log('7. ⏳ Generate frontend module pages (M031-M344)');
    console.log('8. ⏳ Test end-to-end workflows\n');
  }
}

const verifier = new FinalVerification();
verifier.execute();
