#!/usr/bin/env node

/**
 * FIX ALL SYNTAX ERRORS IN ROUTES
 * Removes duplicate requireRole declarations and fixes import statements
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, 'backend/src/routes');

class SyntaxFixer {
  constructor() {
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

  fixFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;

      // Fix 1: Remove duplicate requireRole declarations
      // Pattern: const requireRole = (...) => { } appearing before router declaration
      content = content.replace(
        /const\s+requireRole\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*?next\(\);[\s\S]*?};/,
        ''
      );

      // Fix 2: Fix broken require statements
      content = content.replace(
        /const\s+\n/g,
        'const router = express.Router();\n'
      );

      // Fix 3: Remove empty const declarations
      content = content.replace(/const\s*\n\s*const\s/g, 'const ');

      // Fix 4: Add missing router initialization if needed
      if (content.includes('router.use') || content.includes('router.get') || content.includes('router.post')) {
        if (!content.includes('const router = express.Router()')) {
          const insertPoint = content.indexOf('router.');
          if (insertPoint > -1) {
            // Find the line start
            let lineStart = insertPoint;
            while (lineStart > 0 && content[lineStart - 1] !== '\n') {
              lineStart--;
            }
            content = content.substring(0, lineStart) + 'const router = express.Router();\n\n' + content.substring(lineStart);
          }
        }
      }

      if (content !== original) {
        fs.writeFileSync(filePath, content);
        this.fixed++;
        console.log(`✅ Fixed: ${path.basename(filePath)}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error fixing ${path.basename(filePath)}: ${error.message}`);
      return false;
    }
  }

  async execute() {
    console.log('🔧 FIXING ALL SYNTAX ERRORS\n');

    const files = this.getAllFiles(ROUTES_DIR);
    files.forEach(file => this.fixFile(file));

    console.log(`\n✅ Fixed ${this.fixed} files`);
  }
}

// Execute
const fixer = new SyntaxFixer();
fixer.execute().catch(console.error);
