const fs = require('fs');
const path = require('path');
const index = fs.readFileSync('src/index.js','utf8');
const serviceFiles = fs.readdirSync('src/services').filter(f => f.endsWith('.js'));
const imports = [...index.matchAll(/const\s+(\w+)\s*=\s*require\('\.\/services\/(.+?)'\)/g)].map(m=>({var:m[1],file:m[2]+'.js'}));
const routerServices = serviceFiles.filter(f => {
  const text = fs.readFileSync(path.join('src/services', f), 'utf8');
  return /const\s+router\s*=\s*express\.Router\(\)/.test(text) || /function\s+setupRoutes\(/.test(text);
});
const mountedServiceVars = [...index.matchAll(/mountRoute\('.*?',\s*(\w+)\)|app\.use\('.*?',\s*(\w+)\)|([\w]+)\.setupRoutes\(app\)/g)].map(m => m[1]||m[2]||m[3]).filter(Boolean);
const missingMounts = routerServices.filter(f => {
  const svc = imports.find(i => i.file === f);
  return svc && !mountedServiceVars.includes(svc.var);
});
console.log('serviceFilesCount', serviceFiles.length);
console.log('routerServicesCount', routerServices.length);
console.log('routerServices', routerServices.join(', '));
console.log('mountedServiceVars', mountedServiceVars.sort().join(', '));
console.log('missingMounts', missingMounts.join(', '));
