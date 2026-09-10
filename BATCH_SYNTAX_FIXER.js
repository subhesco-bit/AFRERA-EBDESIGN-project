#!/usr/bin/env node

/**
 * BATCH SYNTAX FIXER
 * Identifies and fixes all similar syntax error patterns across ALL routes
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, 'backend/src/routes');

class BatchSyntaxFixer {
  constructor() {
    this.issues = {
      orphan_closing_brace: [],
      orphan_const: [],
      duplicate_requireRole: [],
      broken_imports: [],
      total_fixed: 0
    };
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

  // Identify issues in a file
  identifyIssues(filePath, content) {
    const filename = path.basename(filePath);
    const issues = [];

    // Issue 1: Orphan closing braces
    if (content.includes('\n};\nconst') || /^\s*};\s*$/.test(content.split('\n')[9])) {
      issues.push({ type: 'orphan_closing_brace', file: filename });
    }

    // Issue 2: Orphan const declarations
    if (/const\s*\n\s*const\s/.test(content)) {
      issues.push({ type: 'orphan_const', file: filename });
    }

    // Issue 3: Duplicate requireRole
    if ((content.match(/requireRole/g) || []).length > 2) {
      issues.push({ type: 'duplicate_requireRole', file: filename });
    }

    return issues;
  }

  // Fix a file comprehensively
  fixFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;
      const issues = this.identifyIssues(filePath, content);

      // Issue 1: Fix orphan closing braces
      content = content.replace(/^\s*};\s*\n(?=const\s)/m, '');
      content = content.replace(/\n\s*};\s*\nconst/g, '\nconst');

      // Issue 2: Fix orphan const
      content = content.replace(/const\s*\n\s*const\s/g, 'const ');

      // Issue 3: Remove duplicate requireRole declarations but keep usage
      const requireRoleMatches = content.match(/const requireRole = \([^)]*\) => {[\s\S]*?next\(\);[\s\S]*?};/g);
      if (requireRoleMatches && requireRoleMatches.length > 1) {
        // Keep first one, remove others
        let removed = false;
        for (let i = 1; i < requireRoleMatches.length; i++) {
          if (!removed) {
            content = content.replace(requireRoleMatches[i], '');
            removed = true;
          }
        }
      }

      // Issue 4: Ensure router is declared
      if (!content.includes('const router = express.Router()')) {
        if (content.includes('const express = require(\'express\')')) {
          content = content.replace(
            /const express = require\('express'\);/,
            `const express = require('express');\nconst router = express.Router();`
          );
        }
      }

      // Issue 5: Remove stray closing braces
      content = content.replace(/^\s*};?\s*\n(?=const|router\.)/gm, '');

      if (content !== original) {
        fs.writeFileSync(filePath, content);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error fixing ${path.basename(filePath)}: ${error.message}`);
      return false;
    }
  }

  async execute() {
    console.log('🔧 BATCH SYNTAX FIXER - Fixing all routes\n');

    const files = this.getAllFiles(ROUTES_DIR);
    let fixed = 0;

    console.log(`Found ${files.length} route files. Scanning for issues...\n`);

    // Identify all issues first
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const issues = this.identifyIssues(file, content);
      issues.forEach(issue => {
        if (!this.issues[issue.type]) this.issues[issue.type] = [];
        this.issues[issue.type].push(issue.file);
      });
    });

    // Report issues found
    console.log('📋 ISSUES FOUND:');
    console.log(`  Orphan closing braces: ${this.issues.orphan_closing_brace.length}`);
    console.log(`  Orphan const declarations: ${this.issues.orphan_const.length}`);
    console.log(`  Duplicate requireRole: ${this.issues.duplicate_requireRole.length}`);
    console.log(`\n🔨 FIXING ALL...\n`);

    // Fix all files in batch
    files.forEach(file => {
      if (this.fixFile(file)) {
        fixed++;
      }
    });

    console.log(`\n✅ BATCH FIX COMPLETE`);
    console.log(`   Fixed: ${fixed} files`);
    console.log(`   Remaining issues should be 0`);
  }
}

// Execute
const fixer = new BatchSyntaxFixer();
fixer.execute().catch(console.error);
