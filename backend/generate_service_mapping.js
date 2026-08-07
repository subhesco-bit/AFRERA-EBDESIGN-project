const fs = require('fs');
const path = require('path');
const index = fs.readFileSync('src/index.js','utf8');
const imports = [...index.matchAll(/const\s+(\w+)\s*=\s*require\('(?:\.\/services\/(.+?))'\)/g)].map(m => ({ var: m[1], file: `${m[2]}.js` }));
const mountRegex = /mountRoute\('(.+?)',\s*(\w+)\)|app\.use\('(.+?)',\s*(\w+)\)|([\w]+)\.setupRoutes\(app\)/g;
const mounted = [];
let m;
while ((m = mountRegex.exec(index))) {
  if (m[1] && m[2]) mounted.push({ path: m[1], var: m[2] });
  else if (m[3] && m[4]) mounted.push({ path: m[3], var: m[4] });
  else if (m[5]) mounted.push({ path: 'setupRoutes', var: m[5] });
}
const mapping = [];
for (const imp of imports) {
  const text = fs.readFileSync(path.join('src/services', imp.file), 'utf8');
  const routes = [];
  const routeRegex = /router\.(get|post|put|delete|patch)\('([^']+)'/g;
  let mm;
  while ((mm = routeRegex.exec(text))) {
    routes.push({ method: mm[1].toUpperCase(), path: mm[2] });
  }
  const hasSetup = /function\s+setupRoutes\(|setupRoutes\s*=/.test(text);
  const mount = mounted.find(x => x.var === imp.var);
  mapping.push({
    serviceFile: imp.file,
    serviceVar: imp.var,
    mountPath: mount ? mount.path : null,
    hasSetup,
    routeCount: routes.length,
    routes
  });
}
fs.writeFileSync('service_route_mapping.json', JSON.stringify(mapping.sort((a,b)=>a.serviceFile.localeCompare(b.serviceFile)), null,2));
console.log('Created service_route_mapping.json');
