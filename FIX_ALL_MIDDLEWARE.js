#!/usr/bin/env node

/**
 * FIX ALL MIDDLEWARE ISSUES COMPREHENSIVELY
 * Adds missing middleware definitions to all routes that use them
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, 'backend/src/routes');

const MIDDLEWARE_DEFINITIONS = {
  requireRole: `const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
};`,

  authenticate: `const { authMiddleware: authenticate } = require('../middleware/auth');`,

  authorize: `const authorize = (roles) => requireRole(...roles);`
};

class MiddlewareFixer {
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

      // Check if file uses requireRole
      if (content.includes('requireRole') && !content.includes('const requireRole =')) {
        // Add requireRole definition after router declaration
        const routerMatch = content.match(/const router = express\.Router\(\);/);
        if (routerMatch) {
          const insertPoint = content.indexOf(routerMatch[0]) + routerMatch[0].length;
          content = content.substring(0, insertPoint) + '\n\n' + MIDDLEWARE_DEFINITIONS.requireRole + '\n' + content.substring(insertPoint);
          modified = true;
          this.issues.push({ file: filename, issue: 'Added requireRole definition' });
        }
      }

      // Check if file uses authenticate but doesn't import it
      if (content.includes('authenticate') && !content.includes('const { authMiddleware: authenticate }') && !content.includes('const authenticate =')) {
        // Find last require statement
        const requires = content.match(/const\s+\{?\s*[\w:,\s]+\s*\}?\s*=\s*require\([^)]+\);?/g);
        if (requires && requires.length > 0) {
          const lastRequire = requires[requires.length - 1];
          const insertPoint = content.indexOf(lastRequire) + lastRequire.length;
          content = content.substring(0, insertPoint) + '\n' + MIDDLEWARE_DEFINITIONS.authenticate + '\n' + content.substring(insertPoint);
          modified = true;
          this.issues.push({ file: filename, issue: 'Added authenticate import' });
        }
      }

      // Check if file uses authorize but doesn't define it
      if (content.includes('authorize(') && !content.includes('const authorize =')) {
        // Add after requireRole
        if (content.includes('const requireRole =')) {
          const match = content.match(/const requireRole = [\s\S]*?};/);
          if (match) {
            const insertPoint = content.indexOf(match[0]) + match[0].length;
            content = content.substring(0, insertPoint) + '\n' + MIDDLEWARE_DEFINITIONS.authorize + '\n' + content.substring(insertPoint);
            modified = true;
            this.issues.push({ file: filename, issue: 'Added authorize wrapper' });
          }
        }
      }

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
    console.log('🔧 MIDDLEWARE BATCH FIXER\n');

    const files = this.getAllFiles(ROUTES_DIR);
    console.log(`Found ${files.length} route files\n`);

    files.forEach(file => this.fixFile(file));

    console.log(`\n✅ MIDDLEWARE FIX COMPLETE`);
    console.log(`   Fixed: ${this.fixed} files`);
    console.log(`   Issues resolved:`);
    this.issues.slice(0, 10).forEach(issue => {
      console.log(`   - ${issue.file}: ${issue.issue}`);
    });
    if (this.issues.length > 10) {
      console.log(`   ... and ${this.issues.length - 10} more`);
    }
  }
}

// Execute
const fixer = new MiddlewareFixer();
fixer.execute().catch(console.error);
