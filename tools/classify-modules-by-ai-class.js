#!/usr/bin/env node
/**
 * classify-modules-by-ai-class.js — which AI class governs each module, and is
 * that AI actually wired yet?
 *
 * These are two different questions and an earlier version of this tool
 * collapsed them into one. It classified by the AI code present today and
 * declared 546 of 648 routes "not AI-bearing", which described the current
 * state of the code while contradicting the platform's design: process flow,
 * workflow, security, operations, decision-making, communications, accounting,
 * ERP and optimisation are all intended to be AI-driven. A warehouse module
 * with no AI in it today is not outside the AI architecture — it is inside it
 * and not yet wired.
 *
 * So every route now gets a GOVERNING CLASS, and separately an INTEGRATION
 * state:
 *
 *   WIRED    AI code is present and substantive behind this route
 *   PARTIAL  something is there, but thin
 *   PENDING  the class governs it; the AI is not written yet
 *
 * That distinction is the useful one. "546 not AI-bearing" reads as a
 * boundary; "546 pending, and here is which class owns each" reads as a
 * backlog, which is what it actually is.
 *
 * Usage:
 *   AUDIT_EMAIL=... AUDIT_PASSWORD=... node tools/classify-modules-by-ai-class.js
 *   node tools/classify-modules-by-ai-class.js --json .audit/ai-class-map.json
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'backend', 'src');
const PORT = Number(process.env.PORT_AUDIT || 5000);
const EMAIL = process.env.AUDIT_EMAIL || 'audit3@ebdesign.local';
const PASSWORD = process.env.AUDIT_PASSWORD || 'AuditPass123!';
const JSON_OUT = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;

/**
 * Governing class by the module's PRIMARY AI role. Ordered — first match wins,
 * so specific before general.
 *
 * The final entry is a catch-all to agentic, not a "none" bucket: a module
 * whose AI role is to run its own process flow, decisions and interactions
 * belongs to the agentic class whether or not that AI exists yet.
 */
const CLASSIFIERS = [
  // Trust boundary first: a fraud or consent route is a security concern
  // before it is anything else, even though it also drives action.
  ['security_trust', /fraud|security|threat|breach|consent|gdpr|privacy|complian|audit|kyc|verificat|authoriz|permission|mfa|two.?factor|encrypt|blockchain|trace|certif/i],

  // Anything that produces or interprets pictures, video or vernacular
  // explanation — different failure modes from text reasoning.
  ['generative_media', /image|photo|cartoon|avatar|vision|render|3d|media|illustrat|video|voice|speech|vernacular/i],

  // Goes OUT and gathers evidence: monitors government portals, extracts
  // structured data, tracks what universities publish, and makes predictions
  // that can later be scored against what happened. Placed before
  // frontier_models because the distinction is what the capability DOES, not
  // what it runs on — both use large models, but reasoning over a document you
  // are handed is a different job from discovering the document.
  ['artificial_scientists', /extract|scrap|crawl|harvest|data\.gov|public.?domain|gazette|univers|icar|kvk|price.?forecast|forecast.?price|price.?predict|market.?research|price.?research|mandi|agmarknet|trial|experiment|hypothes|study|benchmark|mrv|variety.?performance|research.?and.?development|crop.?value.?research/i],

  // Reasoning over documents, research and advice — where an external engine
  // and current outside information are required.
  ['frontier_models', /dpr|subsid|scheme|weather|agromet|climate|forecast|advisor|train|tutorial|educat|loan|credit|insur|nutri|dietit|therap|wellness|clinical|health|medic|engineer|knowledge|librar|translat|language|chat|copilot|assistant|document|report/i],

  // Problems where every choice constrains the others.
  ['quantum_optimisation', /optimi[sz]|allocat|routing|schedul|capacity|corridor|freight|fleet|warehouse|cold.?stor|cold.?chain|logistic|transport|inventory|supply.?chain|pricing|tariff/i],

  // Physical world in the loop.
  ['embodied', /robot|actuator|drone|iot|sensor|telemetr|device|machinery|equipment|irrigation|greenhouse/i],


  // Everything else: its AI role is to run its own workflow, decisions,
  // communications and accounting. That is the agentic class by definition.
  ['agentic', /.*/],
];

const CLASS_ORDER = ['agentic', 'frontier_models', 'quantum_optimisation', 'security_trust',
  'generative_media', 'embodied', 'artificial_scientists'];

function request(opts, body) {
  return new Promise((resolve) => {
    const req = http.request(opts, (res) => {
      let out = '';
      res.on('data', (c) => { out += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: out }));
    });
    req.on('error', (e) => resolve({ status: -1, body: e.message }));
    req.setTimeout(25000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    if (body) req.write(body);
    req.end();
  });
}

/** Largest backing file, and whether it shows any sign of AI. */
function inspectBacking(routeName) {
  const stem = routeName.replace(/Routes?$/i, '');
  const candidates = [
    path.join(SRC, 'services', `${stem}Service.js`),
    path.join(SRC, 'services', `${stem}.js`),
    path.join(SRC, 'services', 'legacy', `${stem}Service.js`),
    path.join(SRC, 'routes', `${routeName}.js`),
  ];
  let bytes = 0;
  let aiSignal = false;
  for (const c of candidates) {
    let st;
    try { st = fs.statSync(c); } catch { continue; }
    bytes = Math.max(bytes, st.size);
    try {
      const src = fs.readFileSync(c, 'utf8');
      // Signs the module participates in the AI architecture at all.
      if (/signalBus|emitSignal|decisionEngine|mcda|aiOrchestrator|aiGateway|predict|recommend|classif|embedding|optimisation|erpAgents|reflexEngine/i.test(src)) {
        aiSignal = true;
      }
    } catch { /* unreadable */ }
  }
  return { bytes, aiSignal };
}

(async () => {
  const creds = JSON.stringify({ email: EMAIL, password: PASSWORD });
  const login = await request({
    host: '127.0.0.1', port: PORT, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(creds) },
  }, creds);
  if (login.status === 429) { console.error('\n  Login rate-limited (5 req/60s). Retry shortly.\n'); process.exit(1); }
  let token = '';
  try { const d = JSON.parse(login.body).data || {}; token = d.access_token || d.token || ''; } catch { /* below */ }
  if (!token) { console.error(`\n  Login failed (${login.status}).\n`); process.exit(1); }

  const table = await request({
    host: '127.0.0.1', port: PORT, path: '/api/v1/system/routes?limit=1000', method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const routes = (JSON.parse(table.body).data || {}).routes || [];

  const SUBSTANTIVE = 6000;
  const byClass = new Map(CLASS_ORDER.map((c) => [c, []]));

  for (const r of routes) {
    const subject = `${r.name} ${r.path}`;
    const cls = CLASSIFIERS.find(([, re]) => re.test(subject))[0];
    const { bytes, aiSignal } = inspectBacking(r.name);
    const integration = (aiSignal && bytes >= SUBSTANTIVE) ? 'WIRED'
      : (aiSignal || bytes >= SUBSTANTIVE) ? 'PARTIAL'
        : 'PENDING';
    byClass.get(cls).push({ name: r.name, path: r.path, bytes, aiSignal, integration });
  }

  const count = (list, s) => list.filter((x) => x.integration === s).length;

  console.log('\n══════════ EVERY MODULE, BY GOVERNING AI CLASS ══════════\n');
  console.log(`  mounted routes: ${routes.length}   — every one has a governing class\n`);
  console.log(`  ${'class'.padEnd(24)}${'total'.padStart(7)}${'wired'.padStart(8)}${'partial'.padStart(9)}${'pending'.padStart(9)}`);
  console.log('  ' + '─'.repeat(57));
  let tW = 0; let tP = 0; let tN = 0;
  for (const c of CLASS_ORDER) {
    const l = byClass.get(c);
    const w = count(l, 'WIRED'); const p = count(l, 'PARTIAL'); const n = count(l, 'PENDING');
    tW += w; tP += p; tN += n;
    console.log(`  ${c.padEnd(24)}${String(l.length).padStart(7)}${String(w).padStart(8)}${String(p).padStart(9)}${String(n).padStart(9)}`);
  }
  console.log('  ' + '─'.repeat(57));
  console.log(`  ${'TOTAL'.padEnd(24)}${String(routes.length).padStart(7)}${String(tW).padStart(8)}${String(tP).padStart(9)}${String(tN).padStart(9)}`);
  console.log(`\n  AI actually integrated: ${tW} wired, ${tP} partial, ${tN} pending`
    + `  (${Math.round((tW / routes.length) * 100)}% wired)`);

  console.log('\n\n  WIRED MODULES BY CLASS — AI is present and substantive\n');
  for (const c of CLASS_ORDER) {
    const l = byClass.get(c).filter((x) => x.integration === 'WIRED').sort((a, b) => b.bytes - a.bytes);
    if (!l.length) continue;
    console.log(`  ${c}  (${l.length})`);
    for (const m of l.slice(0, 8)) console.log(`      ${String(Math.round(m.bytes / 1024)).padStart(4)} KB  ${m.path}`);
    if (l.length > 8) console.log(`      … ${l.length - 8} more`);
    console.log('');
  }

  console.log('  LARGEST PENDING — governed by a class, AI not written yet\n');
  const pending = [];
  for (const c of CLASS_ORDER) {
    for (const m of byClass.get(c)) if (m.integration === 'PENDING') pending.push({ ...m, cls: c });
  }
  pending.sort((a, b) => b.bytes - a.bytes);
  for (const m of pending.slice(0, 15)) {
    console.log(`      ${String(Math.round(m.bytes / 1024)).padStart(4)} KB  ${m.cls.padEnd(22)} ${m.path}`);
  }
  console.log(`\n      … ${pending.length} pending in total\n`);

  if (JSON_OUT) {
    fs.mkdirSync(path.dirname(path.resolve(ROOT, JSON_OUT)), { recursive: true });
    fs.writeFileSync(path.resolve(ROOT, JSON_OUT), JSON.stringify(Object.fromEntries(byClass), null, 2));
    console.log(`  json -> ${JSON_OUT}\n`);
  }
})();
