const d = require('./scaffold_triage_data.json');
const svcOnly = d.results.filter((r) => !r.mountedRouteRequirer && r.requirers.length > 0);
console.log('=== ' + svcOnly.length + ' service-layer-only referenced scaffold modules ===');
for (const r of svcOnly) {
  const short = r.requirers.map((f) => f.replace(/^.*backend[\\/]src[\\/]/, ''));
  console.log(r.id, '->', short.join(', '));
}
