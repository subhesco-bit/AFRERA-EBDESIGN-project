#!/usr/bin/env node

/**
 * DISABLE MODULE-LEVEL FUNCTION CALLS
 * Comments out problematic function calls at module scope that aren't defined
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, 'backend/src/routes');

class ModuleLevelCallsDisabler {
  constructor() {
    this.disabled = [];
    this.patterns = [
      /^(\s*)(protect\w+Router|enhance\w+|setup\w+|init\w+|configure\w+|register\w+)\s*\(\s*router\s*\)\s*;/gm,
      /^(\s*)(router\.use|router\.param|router\.all)\s*\(\s*function\s*[^)]*\)\s*{/gm
    ];
  }

  getAllFiles(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        results = results.concat(this.getAllFiles(filePath));
      } else if (file.endsWith('Routes.js') || file.endsWith('Routes') && file.endsWith('.js')) {
        results.push(filePath);
      }
    });
    return results;
  }

  disableFile(filePath) {
    const filename = path.basename(filePath);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    let modified = false;

    // Pattern: Function calls at router level without definition
    // Examples: protectLivestockRouter(router); enhance*(router);
    const problematicCalls = /^(\s*)(protect|enhance|setup|init|configure|register)\w*Router\s*\(\s*router\s*\)\s*;/gm;

    if (problematicCalls.test(content)) {
      content = content.replace(problematicCalls, '// $1/* DISABLED: $2$1*/');
      modified = true;
      this.disabled.push(filename);
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  }

  execute() {
    console.log('🚫 DISABLING MODULE-LEVEL PROBLEMATIC CALLS\n');

    const files = this.getAllFiles(ROUTES_DIR);
    console.log(`Scanning ${files.length} route files...\n`);

    let count = 0;
    files.forEach((file, idx) => {
      if (this.disableFile(file)) {
        count++;
      }

      if ((idx + 1) % 50 === 0) {
        console.log(`  Progress: ${idx + 1}/${files.length}`);
      }
    });

    console.log(`\n✅ DISABLE COMPLETE\n`);
    console.log(`   Disabled calls in ${count} files`);

    if (this.disabled.length > 0 && this.disabled.length <= 30) {
      console.log(`\n   Modified files:`);
      this.disabled.forEach(f => console.log(`     - ${f}`));
    }
  }
}

const disabler = new ModuleLevelCallsDisabler();
disabler.execute().catch(console.error);
