#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../frontend/src/pages');

console.log('Fixing frontend page exports (v2)...\n');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

let fixed = 0;
let alreadyCorrect = 0;
let errors = 0;

files.forEach((file, idx) => {
  if (idx % 50 === 0) console.log(`Processing ${idx}/${files.length}...`);

  const filePath = path.join(pagesDir, file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if it has proper export
    const hasProperExport = /^export\s+(default\s+)?(class|function|const)/m.test(content) ||
                            /^export\s+default\s+/m.test(content);

    if (hasProperExport) {
      alreadyCorrect++;
      return;
    }

    // Split imports from component code
    const lines = content.split('\n');
    let importEndIdx = -1;

    // Find where imports end
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('import ') || trimmed === '') {
        importEndIdx = i;
      } else if (importEndIdx >= 0 && !trimmed.startsWith('import')) {
        break;
      }
    }

    if (importEndIdx >= 0) {
      // Separate imports and code
      const imports = lines.slice(0, importEndIdx + 1).join('\n');
      const code = lines.slice(importEndIdx + 1).join('\n');

      // Find the first significant line after imports
      const codeLines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));

      if (codeLines.length > 0) {
        const firstCodeLine = codeLines[0];

        if (firstCodeLine.startsWith('function ') ||
            firstCodeLine.startsWith('class ') ||
            firstCodeLine.match(/^const\s+\w+\s*=/)) {
          // Add export default before the component
          const fixedCode = imports + '\n\nexport default ' + code.trim();
          fs.writeFileSync(filePath, fixedCode);
          fixed++;
        } else {
          // Wrap everything after imports with export default
          const fixedCode = imports + '\n\nexport default ' + code.trim();
          fs.writeFileSync(filePath, fixedCode);
          fixed++;
        }
      }
    } else {
      // No imports, just add export default
      content = 'export default ' + content;
      fs.writeFileSync(filePath, content);
      fixed++;
    }
  } catch (e) {
    console.error(`Error processing ${file}: ${e.message}`);
    errors++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('FRONTEND EXPORT FIX (V2) SUMMARY');
console.log('='.repeat(60));
console.log(`Total pages checked: ${files.length}`);
console.log(`Already correct: ${alreadyCorrect}`);
console.log(`Fixed: ${fixed}`);
console.log(`Errors: ${errors}`);
console.log(`Total valid: ${alreadyCorrect + fixed}`);

if (files.length - alreadyCorrect - fixed > 0) {
  console.log(`\n⚠️ Warning: ${files.length - alreadyCorrect - fixed} pages may still have issues`);
}
