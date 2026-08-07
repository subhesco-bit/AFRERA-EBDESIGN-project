const fs = require('fs');
const path = require('path');
const serviceDir = path.join(__dirname, '..', 'src', 'services');
function getFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((ent) => {
    const res = path.join(dir, ent.name);
    if (ent.isDirectory()) return getFiles(res);
    if (ent.isFile() && ent.name.endsWith('.js')) return [res];
    return [];
  });
}
const services = getFiles(serviceDir).map((f) => path.basename(f));
const index = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
const imported = [];
const mounted = [];
index.split(/\r?\n/).forEach((line) => {
  const m = line.match(/const\s+(\w+)\s*=\s*require\(['\"]\.\/services\/(.+?)['\"]\)/);
  if (m) imported.push({ var: m[1], path: m[2] });
  const ma = line.match(/mountRoute\(['\"](.+?)['\"],\s*(\w+)\)/);
  if (ma) mounted.push({ path: ma[1], var: ma[2], type: 'mountRoute' });
  const sa = line.match(/(\w+)\.setupRoutes\(app\)/);
  if (sa) mounted.push({ path: null, var: sa[1], type: 'setupRoutes' });
});
const serviceNames = services.map((f) => f.replace(/\.js$/, ''));
const importedNames = imported.map((i) => i.path.replace(/\.js$/, ''));
const mountedNames = [...new Set(mounted.map((m) => m.var))];
console.log('SERVICES:' + serviceNames.join(','));
console.log('IMPORTED:' + importedNames.join(','));
console.log('MOUNTED:' + mountedNames.join(','));
console.log('MISSING_IMPORTS:' + serviceNames.filter((s) => !importedNames.includes(s)).join(','));
console.log('IMPORTED_NOT_MOUNTED:' + importedNames.filter((s) => !mountedNames.includes(s)).join(','));
