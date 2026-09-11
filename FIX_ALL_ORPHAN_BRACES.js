#!/usr/bin/env node

/**
 * FINAL ORPHAN BRACE & SYNTAX CLEANUP
 * Removes all orphan braces that cause SyntaxErrors
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, 'backend/src/routes');

class FinalSyntaxCleaner {
  constructor() {
    this.fixed = 0;
    this.issues = [];
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
      const filename = path.basename(filePath);
      let modified = false;

      // Fix 1: Remove orphan closing braces followed by router usage
      // Pattern: }; on its own line before router.use/get/post/etc
      const orphanBracePattern = /\n\s*};\s*\n(?=\s*router\s*=|router\.|const\s)/g;
      if (orphanBracePattern.test(content)) {
        content = content.replace(orphanBracePattern, '\n');
        modified = true;
        this.issues.push({ file: filename, issue: 'Removed orphan closing braces' });
      }

      // Fix 2: Remove standalone }; that come after const requireRole definitions
      // Pattern: }; followed by blank line(s) and then another brace
      const doubleCloseBracePattern = /^(\s*};)\s*\n(\s*};)/m;
      if (doubleCloseBracePattern.test(content)) {
        content = content.replace(doubleCloseBracePattern, '$1');
        modified = true;
        this.issues.push({ file: filename, issue: 'Removed duplicate closing braces' });
      }

      // Fix 3: Clean up broken router reassignments like "router = express.Router();" that appear after router is already declared
      const routerLines = content.split('\n');
      const firstRouterDeclaration = routerLines.findIndex(l => l.includes('const router = express.Router()'));
      if (firstRouterDeclaration > -1) {
        // Remove any subsequent "router = express.Router()" assignments
        content = routerLines.map((line, idx) => {
          if (idx > firstRouterDeclaration && /^\s*router\s*=\s*express\.Router/.test(line)) {
            return '';
          }
          return line;
        }).join('\n');
        modified = true;
        this.issues.push({ file: filename, issue: 'Removed redundant router reassignment' });
      }

      // Fix 4: Remove lines that are just }; with nothing else
      const orphanBraceLine = /^\s*};\s*$/gm;
      if (orphanBraceLine.test(content)) {
        const beforeRemoval = content;
        content = content.replace(orphanBraceLine, '');
        if (beforeRemoval !== content) {
          modified = true;
          this.issues.push({ file: filename, issue: 'Removed standalone closing brace line' });
        }
      }

      // Fix 5: Clean up multiple consecutive blank lines
      content = content.replace(/\n\n\n+/g, '\n\n');

      if (modified) {
        fs.writeFileSync(filePath, content);
        this.fixed++;
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error fixing ${path.basename(filePath)}: ${error.message}`);
      return false;
    }
  }

  async execute() {
    console.log('🧹 FINAL SYNTAX CLEANUP - Removing orphan braces\n');

    const files = this.getAllFiles(ROUTES_DIR);
    console.log(`Found ${files.length} route files\n`);

    files.forEach(file => this.fixFile(file));

    console.log(`\n✅ CLEANUP COMPLETE`);
    console.log(`   Fixed: ${this.fixed} files`);
    console.log(`   Issues resolved:`);
    this.issues.slice(0, 15).forEach(issue => {
      console.log(`   - ${issue.file}: ${issue.issue}`);
    });
    if (this.issues.length > 15) {
      console.log(`   ... and ${this.issues.length - 15} more`);
    }
  }
}

// Execute
const cleaner = new FinalSyntaxCleaner();
cleaner.execute().catch(console.error);
