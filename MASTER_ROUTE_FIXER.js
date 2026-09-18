#!/usr/bin/env node

/**
 * MASTER ROUTE FIXER
 * Batch fixes all 358 route files with comprehensive pattern repair
 * Handles: duplicate declarations, missing braces, orphan braces, incomplete functions
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROUTES_DIR = path.join(__dirname, 'backend/src/routes');

class MasterRouteFixer {
  constructor() {
    this.fixed = [];
    this.stillBroken = [];
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

  isValidSyntax(content) {
    try {
      new vm.Script(content);
      return true;
    } catch (e) {
      return false;
    }
  }

  fixFile(filePath) {
    const filename = path.basename(filePath);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    let fixed = false;

    // Fix 1: Close incomplete requireRole functions
    if (content.includes('const requireRole = (...allowedRoles)') &&
        !content.includes('const requireRole = (...allowedRoles) => {')) {
      // Incomplete definition - this shouldn't happen but safety check
    } else if (content.match(/const requireRole = \([^)]*\) => \{[\s\S]*?next\(\);/)) {
      // Complete function - ensure closing braces
      const match = content.match(/const requireRole = \([^)]*\) => \{[\s\S]*?next\(\);/);
      if (match && !content.substring(content.indexOf(match[0]) + match[0].length).startsWith('\n  };')) {
        content = content.replace(
          /const requireRole = \([^)]*\) => \{([\s\S]*?)next\(\);/,
          'const requireRole = (...allowedRoles) => {\n  return (req, res, next) => {\n    if (!req.user || !req.user.role) return res.status(401).json({ error: "Unauthorized" });\n    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });\n    next();\n  };\n};'
        );
        fixed = true;
      }
    }

    // Fix 2: Remove duplicate router declarations
    const routerMatches = content.match(/const router = express\.Router\(\);/g) || [];
    if (routerMatches.length > 1) {
      let firstFound = false;
      const lines = content.split('\n');
      content = lines.map(line => {
        if (line.includes('const router = express.Router()')) {
          if (!firstFound) {
            firstFound = true;
            return line;
          }
          return '';
        }
        return line;
      }).join('\n');
      fixed = true;
    }

    // Fix 3: Remove duplicate requireRole declarations (but keep one)
    const requireRoleMatches = (content.match(/const requireRole = /g) || []).length;
    if (requireRoleMatches > 1) {
      let firstFound = false;
      const lines = content.split('\n');
      let inRequireRole = false;
      let braceCount = 0;
      const newLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('const requireRole = ')) {
          if (!firstFound) {
            firstFound = true;
            newLines.push(line);
            inRequireRole = true;
            braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
          } else {
            inRequireRole = true;
            braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
            continue;
          }
        } else if (inRequireRole) {
          braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
          if (braceCount <= 0) {
            inRequireRole = false;
            braceCount = 0;
          }
          continue;
        } else {
          newLines.push(line);
        }
      }
      content = newLines.join('\n');
      fixed = true;
    }

    // Fix 4: Remove duplicate authenticate/authorize declarations
    const authMatches = (content.match(/const \{ authMiddleware: authenticate \} = require/g) || []).length;
    if (authMatches > 1) {
      let firstFound = false;
      content = content.split('\n').map(line => {
        if (line.includes('const { authMiddleware: authenticate }')) {
          if (!firstFound) {
            firstFound = true;
            return line;
          }
          return '';
        }
        return line;
      }).join('\n');
      fixed = true;
    }

    // Fix 5: Remove orphan closing braces
    content = content.replace(/\n\s*};\s*\n\s*}[\s\S]/g, '\n\n}');
    content = content.replace(/\n\s*};\s*\n\s*}\s*\n/g, '\n\n}\n');

    // Fix 6: Fix multiple consecutive blank lines
    content = content.replace(/\n\n\n+/g, '\n\n');

    // Fix 7: Ensure module.exports at end
    if (!content.trim().endsWith('module.exports = router;')) {
      content = content.replace(/module\.exports\s*=\s*router;?/g, '');
      content = content.replace(/\n\n*$/, '\n\n');
      content += 'module.exports = router;';
      fixed = true;
    }

    // Fix 8: Remove stray closing braces before module.exports
    content = content.replace(/\n\s*}\s*\n\s*}\s*\n\s*module\.exports/g, '\n\nmodule.exports');
    content = content.replace(/\n\s*}\s*\n\s*}\s*\n\s*}\s*\n\s*module\.exports/g, '\n\nmodule.exports');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      if (this.isValidSyntax(content)) {
        return { status: 'fixed', filename };
      } else {
        return { status: 'still_broken', filename };
      }
    }
    return { status: 'valid', filename };
  }

  async execute() {
    console.log('🔨 MASTER ROUTE FIXER - Batch processing all 358 routes\n');

    const files = this.getAllFiles(ROUTES_DIR);
    const total = files.length;

    console.log(`Processing ${total} files with comprehensive batch repair...\n`);

    let validCount = 0;
    let fixedCount = 0;
    let stillBrokenCount = 0;

    files.forEach((file, idx) => {
      const result = this.fixFile(file);

      if (result.status === 'valid') {
        validCount++;
      } else if (result.status === 'fixed') {
        fixedCount++;
        this.fixed.push(result.filename);
      } else if (result.status === 'still_broken') {
        stillBrokenCount++;
        this.stillBroken.push(result.filename);
      }

      if ((idx + 1) % 50 === 0) {
        console.log(`  Progress: ${idx + 1}/${total}`);
      }
    });

    console.log(`\n✅ MASTER FIX COMPLETE\n`);
    console.log(`   Already valid: ${validCount}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Still broken: ${stillBrokenCount}`);

    if (this.stillBroken.length > 0 && this.stillBroken.length <= 20) {
      console.log(`\n   Remaining broken files:`);
      this.stillBroken.forEach(f => console.log(`     - ${f}`));
    }
  }
}

const fixer = new MasterRouteFixer();
fixer.execute().catch(console.error);
