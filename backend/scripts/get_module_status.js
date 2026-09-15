/**
 * Analyze module service files to determine completion status
 * Usage: node scripts/get_module_status.js
 */

const fs = require('fs');
const path = require('path');

const modulesPath = path.join(__dirname, '../src/modules');
const results = [];

for (let i = 1; i <= 150; i++) {
    const moduleNum = String(i).padStart(3, '0');
    const modulePath = path.join(modulesPath, `M${moduleNum}`);
    
    if (fs.existsSync(modulePath)) {
        const servicePath = path.join(modulePath, 'service.js');
        
        if (fs.existsSync(servicePath)) {
            const content = fs.readFileSync(servicePath, 'utf8');
            const lines = content.split('\n').length;
            
            let status;
            if (lines < 10) {
                status = 'SKELETON';
            } else if (lines < 50) {
                status = 'PARTIAL';
            } else {
                status = 'COMPLETE';
            }
            
            results.push({
                module: `M${moduleNum}`,
                lines: lines,
                status: status
            });
        } else {
            results.push({
                module: `M${moduleNum}`,
                lines: 0,
                status: 'NO_SERVICE'
            });
        }
    }
}

// Count by status
const statusCounts = {};
results.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
});

console.log('Module Status Analysis:');
console.log('========================');
console.log('');

Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    console.log(`${status}: ${count} modules`);
});

console.log('');
console.log('Detailed Results:');
console.log('================');

results.forEach(r => {
    console.log(`${r.module}: ${r.lines} lines (${r.status})`);
});

// Save to file
fs.writeFileSync(
    path.join(__dirname, '../module_status.json'),
    JSON.stringify({ results, statusCounts }, null, 2)
);

console.log('');
console.log('Results saved to module_status.json');