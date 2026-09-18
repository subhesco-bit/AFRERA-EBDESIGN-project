#!/usr/bin/env node

/**
 * SYNTAX VALIDATION & REPAIR
 * Identifies and fixes syntax errors by attempting to parse each file
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROUTES_DIR = path.join(__dirname, 'backend/src/routes');

class SyntaxValidator {
  constructor() {
    this.errors = [];
    this.fixed = 0;
  }

  getAllFiles(dir) {
    let results = [];
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        results = results.concat(this.getAllFiles(filePath));
      } else if (file.endsWith('.js')) {
        results.push(filePath);
      }
    });

    return results;
  }

  validateFile(filePath) {
    const filename = path.basename(filePath);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Try to parse as JavaScript (basic check)
      new vm.Script(content, { filename });
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: error.message, filename };
    }
  }

  fixFile(filePath, errorMsg) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;

      // Pattern 1: Missing closing brace on async function
      if (errorMsg.includes('Unexpected end of input')) {
        // Try adding closing braces at the end
        const braceCount = (content.match(/{/g) || []).length;
        const closeCount = (content.match(/}/g) || []).length;
        const missing = braceCount - closeCount;

        if (missing > 0) {
          for (let i = 0; i < missing; i++) {
            // Add before the last line if it's module.exports
            if (content.trim().endsWith('module.exports = router;')) {
              content = content.replace('module.exports = router;', '\n}\n\nmodule.exports = router;');
            } else {
              content += '\n}';
            }
          }
        }
      }

      if (content !== original) {
        fs.writeFileSync(filePath, content);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  async execute() {
    console.log('🔍 SYNTAX VALIDATION & REPAIR\n');

    const files = this.getAllFiles(ROUTES_DIR);
    console.log(`Validating ${files.length} route files...\n`);

    const errorFiles = [];

    for (const file of files) {
      const result = this.validateFile(file);
      if (!result.valid) {
        errorFiles.push(result);
      }
    }

    console.log(`Found ${errorFiles.length} files with syntax errors\n`);

    if (errorFiles.length > 0) {
      console.log('Attempting repairs...\n');
      errorFiles.forEach(err => {
        if (this.fixFile(path.join(ROUTES_DIR, err.filename), err.error)) {
          this.fixed++;
          console.log(`✅ Fixed: ${err.filename}`);
        } else {
          console.log(`❌ Failed: ${err.filename} - ${err.error.substring(0, 80)}`);
        }
      });
    }

    console.log(`\n✅ VALIDATION COMPLETE`);
    console.log(`   Files with errors: ${errorFiles.length}`);
    console.log(`   Fixed: ${this.fixed}`);
    console.log(`   Remaining issues: ${errorFiles.length - this.fixed}`);
  }
}

// Execute
const validator = new SyntaxValidator();
validator.execute().catch(console.error);
