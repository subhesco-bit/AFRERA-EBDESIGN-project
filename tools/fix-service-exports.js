#!/usr/bin/env node

/**
 * Fix Service Exports - Add module.exports to all 289 services
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class FixServiceExports {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.fixed = 0;
    this.failed = 0;
  }

  run() {
    console.log('🔧 FIXING SERVICE EXPORTS\n');

    const serviceFiles = glob.sync('backend/src/services/**/*.js', {
      cwd: this.rootDir,
      ignore: ['**/index.js', '**/*.test.js']
    });

    console.log(`Found ${serviceFiles.length} service files\n`);

    serviceFiles.forEach(serviceFile => {
      try {
        const fullPath = path.join(this.rootDir, serviceFile);
        let content = fs.readFileSync(fullPath, 'utf8');
        const serviceName = path.basename(serviceFile, '.js');

        // Check if already has export
        if (/module\.exports|export\s+(default|{|\w+)/.test(content)) {
          console.log(`✅ ${serviceName}: Already has export`);
          return;
        }

        // Extract class name or function name
        const classMatch = content.match(/class\s+(\w+)/);
        const functionMatch = content.match(/function\s+(\w+)/);
        const constMatch = content.match(/const\s+(\w+)\s*=/);

        let exportName = classMatch?.[1] || functionMatch?.[1] || constMatch?.[1] || serviceName;

        // Add export at end of file
        if (!content.trim().endsWith('}')) {
          content = content.trimEnd() + '\n';
        }

        content += `\nmodule.exports = ${exportName};\n`;

        fs.writeFileSync(fullPath, content);
        this.fixed++;
        console.log(`✅ ${serviceName}: Added export (${exportName})`);
      } catch (e) {
        this.failed++;
        console.log(`❌ ${path.basename(serviceFile)}: ${e.message}`);
      }
    });

    console.log(`\n✅ Fixed: ${this.fixed}/${serviceFiles.length}`);
    console.log(`❌ Failed: ${this.failed}\n`);

    // Update services/index.js
    this.updateServicesIndex(serviceFiles);
  }

  updateServicesIndex(serviceFiles) {
    console.log('📝 UPDATING services/index.js\n');

    const indexPath = path.join(this.rootDir, 'backend/src/services/index.js');

    let indexContent = '// Auto-generated services index\n\n';

    serviceFiles.forEach(serviceFile => {
      const serviceName = path.basename(serviceFile, '.js');
      const importPath = './' + serviceName;
      indexContent += `const ${serviceName} = require('${importPath}');\n`;
    });

    indexContent += '\n// Export all services\nmodule.exports = {\n';

    serviceFiles.forEach(serviceFile => {
      const serviceName = path.basename(serviceFile, '.js');
      indexContent += `  ${serviceName},\n`;
    });

    indexContent += '};\n';

    fs.writeFileSync(indexPath, indexContent);
    console.log(`✅ Updated services/index.js with ${serviceFiles.length} services\n`);
  }
}

if (require.main === module) {
  const fixer = new FixServiceExports(process.cwd());
  fixer.run();
}

module.exports = FixServiceExports;
