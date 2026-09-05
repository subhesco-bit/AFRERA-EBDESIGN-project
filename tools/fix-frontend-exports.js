#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../frontend/src/pages');

console.log('Checking frontend pages for missing exports...\n');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

let fixed = 0;
let withExports = 0;
let errors = 0;

files.forEach((file, idx) => {
  if (idx % 50 === 0) console.log(`Processing ${idx}/${files.length}...`);

  const filePath = path.join(pagesDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasExport = /export\s+(default\s+)?(class|function|const|\(\)|async)/.test(content);

    if (!hasExport) {
      // Check if it's a component-like content
      const isComponent = /function\s+\w+|const\s+\w+\s*=|class\s+\w+|=>/.test(content);

      if (isComponent) {
        // Extract component name from file
        const componentName = file.replace('.jsx', '');

        // Add export default to the file
        let fixed_content = content;

        // For function declarations
        if (/^function\s+\w+/.test(content)) {
          fixed_content = content.replace(/^function/, 'export default function');
        }
        // For const function components
        else if (/^const\s+\w+\s*=\s*(async\s*)?\(/.test(content) || /^const\s+\w+\s*=\s*(async\s*)?\w+\s*=>/.test(content)) {
          fixed_content = 'export default ' + content;
        }
        // For arrow functions assigned to const
        else if (/^const\s+\w+/.test(content)) {
          fixed_content = content.replace(/^const/, 'export default const');
        }
        // Fallback: wrap it
        else {
          fixed_content = 'export default ' + content;
        }

        fs.writeFileSync(filePath, fixed_content);
        fixed++;
      }
    } else {
      withExports++;
    }
  } catch (e) {
    console.error(`Error processing ${file}: ${e.message}`);
    errors++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('FRONTEND EXPORT FIX SUMMARY');
console.log('='.repeat(60));
console.log(`Total pages checked: ${files.length}`);
console.log(`With exports: ${withExports}`);
console.log(`Fixed: ${fixed}`);
console.log(`Errors: ${errors}`);
console.log(`\nRemaining invalid: ${files.length - withExports - fixed}`);
