#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const BACKEND_DIR = path.join(__dirname, '../backend/src');
const MIDDLEWARE_DIR = path.join(BACKEND_DIR, 'middleware');

// Get all exported middleware from each file
function getMiddlewareExports(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const exports = new Set();

    // Look for module.exports = { ... }
    const exportMatch = content.match(/module\.exports\s*=\s*\{([^}]*)\}/s);
    if (exportMatch) {
      const exportList = exportMatch[1];
      const names = exportList.match(/\w+/g) || [];
      names.forEach(name => exports.add(name));
    }

    // Look for module.exports.name =
    const namedExports = content.match(/module\.exports\.(\w+)/g) || [];
    namedExports.forEach(exp => {
      const name = exp.replace('module.exports.', '');
      exports.add(name);
    });

    return exports;
  } catch (e) {
    return new Set();
  }
}

// Build middleware export map
const middlewareMap = {};
fs.readdirSync(MIDDLEWARE_DIR).forEach(file => {
  if (file.endsWith('.js')) {
    const exports = getMiddlewareExports(path.join(MIDDLEWARE_DIR, file));
    middlewareMap[file.replace('.js', '')] = exports;
  }
});

const mapForLog = {};
Object.keys(middlewareMap).forEach(key => {
  mapForLog[key] = Array.from(middlewareMap[key]);
});
console.log('Available middleware exports:', JSON.stringify(mapForLog, null, 2));

// Check all route files for undefined imports
const routeFiles = glob.sync('src/routes/**/*.js', { cwd: BACKEND_DIR });
const issues = [];

routeFiles.forEach(routeFile => {
  const fullPath = path.join(BACKEND_DIR, routeFile);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');

    // Find all requires from middleware
    const middlewareReqs = content.match(/require\(['"]\.\.\/middleware\/\w+['"]\)/g) || [];
    middlewareReqs.forEach(req => {
      const match = req.match(/require\(['"]\.\.\/middleware\/(\w+)['"]\)/);
      if (match) {
        const middlewareModule = match[1];
        const exports = middlewareMap[middlewareModule];

        // Find what's being destructured
        const destructurePattern = new RegExp(`const\\s*\\{([^}]*)\\}\\s*=\\s*require\\(['"]\.\.\/middleware\\/${middlewareModule}['"]\\)`, 's');
        const destructMatch = content.match(destructurePattern);
        if (destructMatch) {
          const requested = destructMatch[1].split(',').map(s => {
            const parts = s.trim().split(':');
            return parts[parts.length - 1];
          });

          requested.forEach(name => {
            if (name && !exports.has(name.trim())) {
              issues.push({
                file: routeFile,
                middleware: middlewareModule,
                requested: name.trim(),
                available: Array.from(exports)
              });
            }
          });
        }
      }
    });
  } catch (e) {
    // Skip on error
  }
});

if (issues.length > 0) {
  console.log(`\n❌ Found ${issues.length} undefined middleware imports:\n`);
  issues.forEach(issue => {
    console.log(`${issue.file}:`);
    console.log(`  ✗ Requesting: ${issue.requested}`);
    console.log(`  ✓ Available: ${issue.available.join(', ')}`);
    console.log(`  From: ${issue.middleware}`);
    console.log();
  });
} else {
  console.log('\n✅ No undefined middleware imports found!');
}
