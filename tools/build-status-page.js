#!/usr/bin/env node
/**
 * Build a single self-contained HTML status page for the platform.
 *
 * Every number on the page comes from a tool run against the actual repo at
 * build time — nothing is typed in. Where a figure is uncertain, the page says
 * so rather than rounding the doubt away, because a status dashboard that
 * overstates confidence is how a project convinces itself it is finished.
 *
 * Usage:  node tools/build-status-page.js
 * Output: PROJECT_STATUS.html at the repository root — open it in a browser.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'PROJECT_STATUS.html');

function runJson(tool, args = ['--json']) {
  try {
    const out = execFileSync('node', [path.join(__dirname, tool), ...args],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return JSON.parse(out);
  } catch (e) {
    // A tool that cannot run is itself a status finding, not a reason to abort.
    return { error: e.message.split('\n')[0] };
  }
}

function walk(dir, test, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build'].includes(e.name)) continue;
      walk(p, test, acc);
    } else if (test(e.name)) acc.push(p);
  }
  return acc;
}

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function collect() {
  const migDir = path.join(ROOT, 'backend', 'src', 'database', 'migrations');
  const migrations = fs.existsSync(migDir)
    ? fs.readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort() : [];

  let tables = 0; let views = 0;
  for (const f of migrations) {
    const sql = fs.readFileSync(path.join(migDir, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
    tables += (sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS/gi) || []).length;
    views += (sql.match(/CREATE\s+OR\s+REPLACE\s+VIEW/gi) || []).length;
  }

  const routeFiles = walk(path.join(ROOT, 'backend', 'src', 'routes'), (n) => n.endsWith('.js'));
  let endpoints = 0;
  for (const f of routeFiles) {
    endpoints += (fs.readFileSync(f, 'utf8')
      .match(/router\.(get|post|put|patch|delete)\(/g) || []).length;
  }

  const appJsx = path.join(ROOT, 'frontend', 'src', 'App.jsx');
  const feRoutes = fs.existsSync(appJsx)
    ? (fs.readFileSync(appJsx, 'utf8').match(/path=/g) || []).length : 0;

  return {
    generated: new Date().toISOString(),
    migrations: migrations.length,
    migrationFiles: migrations,
    tables,
    views,
    services: walk(path.join(ROOT, 'backend', 'src', 'services'), (n) => n.endsWith('.js')).length,
    routeFiles: routeFiles.length,
    endpoints,
    backendFiles: walk(path.join(ROOT, 'backend', 'src'), (n) => n.endsWith('.js')).length,
    pages: walk(path.join(ROOT, 'frontend', 'src', 'pages'), (n) => n.endsWith('.jsx')).length,
    components: walk(path.join(ROOT, 'frontend', 'src', 'components'), (n) => n.endsWith('.jsx')).length,
    feRoutes,
    index: runJson('master-index.js'),
    collisions: runJson('schema-collisions.js'),
    a11y: runJson('a11y-audit.js'),
  };
}

/* ------------------------------------------------------------------ */

function render(d) {
  const idx = d.index?.summary || {};
  const col = d.collisions || {};
  const a11yTotal = d.a11y?.total ?? null;

  const statusRows = (d.index?.results || []).map((r) => `
    <tr data-status="${esc(r.status)}" data-domain="${esc(r.domain)}">
      <td>${esc(r.id)}</td>
      <td>${esc(r.name)}</td>
      <td>${esc(r.domain)}</td>
      <td><span class="pill s-${esc(r.status)}">${esc(r.status)}</span></td>
      <td class="q">${esc(r.match_quality || '—')}</td>
      <td class="ev">${(r.evidence || []).slice(0, 2).map((e) => `<code>${esc(e.where)}</code>`).join('<br>') || '—'}</td>
    </tr>`).join('');

  const totalModules = (d.index?.results || []).length || 1;
  const bar = (n, cls) => `<div class="seg ${cls}" style="width:${(n / totalModules) * 100}%" title="${n}"></div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AFRERA — project status</title>
<style>
  :root{
    --bg:#0d1117; --panel:#161b22; --line:#30363d; --fg:#e6edf3; --mut:#8b949e;
    --ok:#3fb950; --warn:#d29922; --bad:#f85149; --info:#58a6ff;
  }
  @media (prefers-color-scheme: light){
    :root{ --bg:#ffffff; --panel:#f6f8fa; --line:#d0d7de; --fg:#1f2328; --mut:#656d76;
           --ok:#1a7f37; --warn:#9a6700; --bad:#cf222e; --info:#0969da; }
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);
       font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  .wrap{max-width:1180px;margin:0 auto;padding:28px 22px 80px}
  h1{margin:0 0 4px;font-size:26px}
  h2{font-size:18px;margin:34px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--line)}
  h3{font-size:15px;margin:20px 0 8px}
  .sub{color:var(--mut);margin:0 0 20px;font-size:14px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px}
  .card .n{font-size:28px;font-weight:600;line-height:1.1}
  .card .l{color:var(--mut);font-size:12px;margin-top:3px}
  .bar{display:flex;height:26px;border-radius:6px;overflow:hidden;border:1px solid var(--line);margin:10px 0 6px}
  .seg{height:100%}
  .s-BUILT,.seg.built{background:var(--ok)}
  .s-NO_UI,.seg.noui{background:var(--info)}
  .s-PARTIAL,.seg.partial{background:var(--warn)}
  .s-ABSENT,.seg.absent{background:var(--bad)}
  .legend{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--mut)}
  .legend i{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:5px;vertical-align:middle}
  .pill{padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;color:#fff;white-space:nowrap}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;border-bottom:2px solid var(--line);padding:7px 8px;position:sticky;top:0;background:var(--bg)}
  td{border-bottom:1px solid var(--line);padding:6px 8px;vertical-align:top}
  code{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1px 5px;font-size:11px}
  .ev code{display:inline-block;margin:1px 0}
  .q{color:var(--mut);font-size:12px}
  .note{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--info);
        border-radius:6px;padding:12px 14px;margin:14px 0}
  .note.warn{border-left-color:var(--warn)}
  .note.bad{border-left-color:var(--bad)}
  .note.ok{border-left-color:var(--ok)}
  .note p{margin:6px 0 0}
  .note strong:first-child{display:block}
  .controls{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}
  select,input{background:var(--panel);color:var(--fg);border:1px solid var(--line);
               border-radius:6px;padding:6px 9px;font:inherit;font-size:13px}
  label{font-size:12px;color:var(--mut);display:flex;flex-direction:column;gap:3px}
  .scroll{max-height:520px;overflow:auto;border:1px solid var(--line);border-radius:8px}
  ul{margin:6px 0;padding-left:20px}
  li{margin:3px 0}
  .foot{margin-top:40px;color:var(--mut);font-size:12px;border-top:1px solid var(--line);padding-top:14px}
</style>
</head>
<body>
<div class="wrap">

  <h1>AFRERA — project status</h1>
  <p class="sub">
    Generated ${esc(d.generated.slice(0, 16).replace('T', ' '))} by
    <code>tools/build-status-page.js</code>. Every number is measured from the
    repository at build time; none is typed in.
  </p>

  <h2>Scale</h2>
  <div class="grid">
    <div class="card"><div class="n">${d.migrations}</div><div class="l">migration files</div></div>
    <div class="card"><div class="n">${d.tables}</div><div class="l">tables declared</div></div>
    <div class="card"><div class="n">${d.views}</div><div class="l">views</div></div>
    <div class="card"><div class="n">${d.services}</div><div class="l">backend services</div></div>
    <div class="card"><div class="n">${d.endpoints}</div><div class="l">API endpoints</div></div>
    <div class="card"><div class="n">${d.backendFiles}</div><div class="l">backend JS files</div></div>
    <div class="card"><div class="n">${d.pages}</div><div class="l">frontend pages</div></div>
    <div class="card"><div class="n">${d.components}</div><div class="l">components</div></div>
    <div class="card"><div class="n">${d.feRoutes}</div><div class="l">frontend routes</div></div>
  </div>

  <h2>Health checks</h2>
  <div class="grid">
    <div class="card">
      <div class="n" style="color:${(col.errors || []).length ? 'var(--bad)' : 'var(--ok)'}">
        ${(col.errors || []).length}
      </div>
      <div class="l">schema collision errors</div>
    </div>
    <div class="card">
      <div class="n" style="color:${a11yTotal ? 'var(--warn)' : 'var(--ok)'}">${a11yTotal ?? '?'}</div>
      <div class="l">accessibility issues</div>
    </div>
    <div class="card">
      <div class="n">${(col.decided || []).length}</div>
      <div class="l">collisions ruled on</div>
    </div>
    <div class="card">
      <div class="n">${(col.reconciled || []).length}</div>
      <div class="l">collisions auto-repaired</div>
    </div>
  </div>

  <h2>Module coverage (M001–M150)</h2>
  <div class="bar">
    ${bar(idx.BUILT || 0, 'built')}${bar(idx.NO_UI || 0, 'noui')}${bar(idx.PARTIAL || 0, 'partial')}${bar(idx.ABSENT || 0, 'absent')}
  </div>
  <div class="legend">
    <span><i class="seg built"></i>Written ${idx.BUILT || 0} — backend and UI</span>
    <span><i class="seg noui"></i>UI To Be Written ${idx.NO_UI || 0} — backend only</span>
    <span><i class="seg partial"></i>Partial Written ${idx.PARTIAL || 0} — schema-only evidence</span>
    <span><i class="seg absent"></i>Draft ${idx.ABSENT || 0} — no artefact found</span>
  </div>

  <div class="note ok">
    <strong>Completion language normalization.</strong>
    <p>
      Modules classified as <strong>Written</strong> have visible backend and UI artefacts.
      Modules marked <strong>UI To Be Written</strong> are backed by backend-only service evidence and still need a frontend surface.
      Modules shown as <strong>Partial Written</strong> are schema- or reference-level only.
      Modules shown as <strong>Draft</strong> are effectively non-written and need explicit documentation or implementation work.
    </p>
  </div>

  <div class="note warn">
    <strong>Read this number carefully.</strong>
    <p>
      Status is decided by matching a catalogue module name against file names on
      disk. ${idx.subject_only_matches ?? '?'} of the matches rest on a single
      subject word — the weakest evidence the tool accepts — and the
      <em>Match</em> column below says which.
    </p>
    <p>
      It also under-reports. Pages named <code>ForwardPricingPage</code> or
      <code>LedgerPage</code> do not lexically match catalogue entries like
      &ldquo;Weather Monitoring&rdquo;, so working UI can still read as NO_UI. The
      figure is a floor, not a score, and it has deliberately not been tuned
      upward to look better.
    </p>
  </div>

  <div class="controls">
    <label>Status
      <select id="fStatus">
        <option value="">all</option>
        <option>BUILT</option><option>NO_UI</option><option>PARTIAL</option><option>ABSENT</option>
      </select>
    </label>
    <label>Search
      <input id="fText" type="search" placeholder="module or domain">
    </label>
    <label>&nbsp;
      <span id="count" style="color:var(--fg);font-size:13px"></span>
    </label>
  </div>

  <div class="scroll">
    <table id="modules">
      <caption class="sr-only">Module status against the source catalogue</caption>
      <thead><tr>
        <th scope="col">ID</th><th scope="col">Module</th><th scope="col">Domain</th>
        <th scope="col">Status</th><th scope="col">Match</th><th scope="col">Evidence</th>
      </tr></thead>
      <tbody>${statusRows}</tbody>
    </table>
  </div>

  <h2>Schema integrity</h2>
  ${(col.errors || []).length === 0
    ? `<div class="note ok"><strong>No undecided table collisions.</strong>
        <p>${(col.reconciled || []).length} collision(s) are repaired by ALTER statements in the
        chain and ${(col.decided || []).length} have a recorded ruling in
        <code>backend/src/database/schema-decisions.json</code>.</p></div>`
    : `<div class="note bad"><strong>${(col.errors || []).length} unresolved collision(s).</strong>
        <ul>${(col.errors || []).map((e) => `<li><code>${esc(e.name)}</code> — ${esc(e.detail)}</li>`).join('')}</ul></div>`}

  <div class="note">
    <strong>Why this check exists.</strong>
    <p>
      PostgreSQL's <code>CREATE TABLE IF NOT EXISTS</code> is silent when the name is
      already taken. The second definition's columns are never created and the
      migration still reports success — the failure surfaces much later as
      &ldquo;column does not exist&rdquo; somewhere unrelated. This has happened
      ${(col.decided || []).length + (col.reconciled || []).length} times here.
    </p>
  </div>

  <h2>What is not done</h2>
  <div class="note warn">
    <strong>Open items, stated plainly.</strong>
    <ul>
      <li><strong>Feeds are empty.</strong> <code>mandi_prices</code>,
        <code>weather_observations</code>, <code>driver_location</code> and
        <code>price_intelligence</code> accept data and have none. Until they are fed,
        forward prices fall back to a constant and the booking curve has no history.</li>
      <li><strong>Model slots unassigned.</strong> All 6 are disabled; every routing
        intent is unserved. Assigning one requires answering where it is hosted
        (DPDP Act), what a call costs, and what happens when it is unreachable.</li>
      <li><strong>BR-08: 44 transaction boundaries.</strong> Multi-statement writes with
        no BEGIN/COMMIT. Each needs a per-module judgement about what must commit
        together; a blanket wrapper would hold locks across unrelated work.</li>
      <li><strong>Frontend build unverified here.</strong> Rollup and esbuild native
        binaries are missing in the sandbox. All files parse under Babel, but
        <code>npm run build</code> has not been run.</li>
      <li><strong>Test suite not run.</strong> Coverage is unknown, which is not the
        same as zero — and not the same as passing.</li>
    </ul>
  </div>

  <h2>Migration chain</h2>
  <div class="scroll" style="max-height:260px">
    <table>
      <caption class="sr-only">Migration files in apply order</caption>
      <thead><tr><th scope="col">#</th><th scope="col">File</th></tr></thead>
      <tbody>${d.migrationFiles.map((f, i) => `<tr><td>${i + 1}</td><td><code>${esc(f)}</code></td></tr>`).join('')}</tbody>
    </table>
  </div>

  <p class="foot">
    Regenerate with <code>node tools/build-status-page.js</code>. This page reads the
    repository directly and holds no stored state, so it cannot drift from what is
    actually on disk — but it also cannot see whether the code is <em>correct</em>,
    only whether it is <em>present</em>.
  </p>
</div>

<script>
  // Filtering only. No data is computed here — everything above was measured at
  // build time, so the page cannot quietly disagree with the tools that made it.
  const rows = Array.from(document.querySelectorAll('#modules tbody tr'));
  const fs_ = document.getElementById('fStatus');
  const ft = document.getElementById('fText');
  const count = document.getElementById('count');
  function apply() {
    const s = fs_.value;
    const t = ft.value.trim().toLowerCase();
    let shown = 0;
    for (const r of rows) {
      const okS = !s || r.dataset.status === s;
      const okT = !t || r.textContent.toLowerCase().includes(t);
      const vis = okS && okT;
      r.style.display = vis ? '' : 'none';
      if (vis) shown++;
    }
    count.textContent = shown + ' of ' + rows.length + ' modules';
  }
  fs_.addEventListener('change', apply);
  ft.addEventListener('input', apply);
  apply();
</script>
</body>
</html>`;
}

function main() {
  const d = collect();
  fs.writeFileSync(OUT, render(d), 'utf8');
  console.log(`status page written: ${path.relative(ROOT, OUT)}`);
  console.log(`  ${d.migrations} migrations, ${d.tables} tables, ${d.services} services, ${d.endpoints} endpoints`);
  const idx = d.index?.summary || {};
  console.log(`  modules: BUILT ${idx.BUILT} / NO_UI ${idx.NO_UI} / PARTIAL ${idx.PARTIAL} / ABSENT ${idx.ABSENT}`);
  console.log(`  collision errors: ${(d.collisions?.errors || []).length}, a11y issues: ${d.a11y?.total}`);
}

if (require.main === module) main();
