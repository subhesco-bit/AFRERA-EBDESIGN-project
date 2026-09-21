#!/usr/bin/env node

/**
 * CREATE MISSING ROUTES
 * Creates all missing route files referenced in index.js
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, 'backend/src/routes');
const INDEX_FILE = path.join(ROUTES_DIR, 'index.js');

class MissingRoutesCreator {
  constructor() {
    this.created = [];
    this.already_exist = [];
  }

  createMinimalRoute(filename) {
    const baseName = filename
      .replace(/Routes|routes|Merged|merged|\.js|_/g, '')
      .replace(/([A-Z])/g, ' $1')
      .trim();

    return `/**
 * ${baseName} Routes
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: '${filename.replace('.js', '')}' });
});

module.exports = router;
`;
  }

  execute() {
    console.log('📝 CREATING MISSING ROUTE FILES\n');

    const indexContent = fs.readFileSync(INDEX_FILE, 'utf8');
    const requireMatches = indexContent.match(/require\('\.\/([^']+)'\)/g) || [];

    const requiredFiles = new Set(
      requireMatches.map(m => m.match(/require\('\.\/([^']+)'\)/)[1] + '.js')
    );

    console.log(`Found ${requiredFiles.size} required route files\n`);

    let count = 0;
    requiredFiles.forEach(filename => {
      const filePath = path.join(ROUTES_DIR, filename);

      if (fs.existsSync(filePath)) {
        this.already_exist.push(filename);
      } else {
        // Create the file
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, this.createMinimalRoute(filename));
        this.created.push(filename);
        count++;
      }
    });

    console.log(`✅ CREATION COMPLETE\n`);
    console.log(`   Already exist: ${this.already_exist.length}`);
    console.log(`   Created: ${this.created.length}`);

    if (this.created.length > 0 && this.created.length <= 50) {
      console.log(`\n   Created files:`);
      this.created.forEach(f => console.log(`     - ${f}`));
    }
  }
}

const creator = new MissingRoutesCreator();
creator.execute();
