/**
 * analyze_transaction_patterns.js
 *
 * For each file found with multi-statement writes, identify the specific
 * async functions that should be wrapped and their line numbers.
 */

const fs = require('fs');
const path = require('path');

const resultsFile = '.ai/workflows/scripts/unwrapped_transactions_scan.json';
const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

const ROOT = path.join(__dirname, '../../../backend');
const analysis = {
  byFile: {},
  needsWrapping: [],
  ambiguous: [],
  lowRisk: []
};

for (const [cat, files] of Object.entries(results.byCategory)) {
  for (const item of files) {
    const fullPath = path.join(ROOT, item.file);
    if (!fs.existsSync(fullPath)) continue;
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    
    // Find async functions with 2+ query/execute calls
    const asyncFuncRegex = /^async\s+(\w+)\s*\(/m;
    let funcMatches = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/async\s+\w+\s*\(/.test(line)) {
        // Found async function, count queries/execute until closing brace
        let queryCount = 0;
        let braceDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        
        const funcName = line.match(/async\s+(\w+)/)[1];
        let endLine = i;
        
        for (let j = i + 1; j < lines.length && endLine === i; j++) {
          queryCount += (lines[j].match(/\.query\(|\.execute\(|\.run\(/g) || []).length;
          braceDepth += (lines[j].match(/{/g) || []).length - (lines[j].match(/}/g) || []).length;
          
          if (braceDepth <= 0) {
            endLine = j;
          }
        }
        
        if (queryCount >= 2) {
          funcMatches.push({
            name: funcName,
            line: i + 1,
            endLine: endLine + 1,
            queryCount,
            category: cat
          });
        }
      }
    }
    
    const rel = path.relative(ROOT, fullPath);
    if (funcMatches.length > 0) {
      analysis.byFile[rel] = funcMatches;
      
      if (cat === 'money' || cat === 'identity' || cat === 'sync' || cat === 'lifecycle') {
        analysis.needsWrapping.push({ file: rel, category: cat, funcs: funcMatches });
      } else {
        analysis.lowRisk.push({ file: rel, funcs: funcMatches });
      }
    }
  }
}

console.log('High-priority needs wrapping: ' + analysis.needsWrapping.length + ' files');
console.log('Low-risk (other): ' + analysis.lowRisk.length + ' files');

fs.writeFileSync(
  '.ai/workflows/scripts/transaction_analysis.json',
  JSON.stringify(analysis, null, 2)
);

console.log('Analysis saved to transaction_analysis.json');
