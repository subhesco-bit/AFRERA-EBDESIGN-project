#!/usr/bin/env node
'use strict';

/**
 * Guard audit for the route files the loader discards.
 *
 * WHY THIS EXISTS
 *
 * DynamicRouteLoader keys routes by basename and drops any file whose name is
 * already claimed (see tools/audit-route-collisions.js). Those dropped files
 * are not mounted at any path, so their endpoints are unreachable — which also
 * means nothing has ever checked whether they are guarded.
 *
 * The obvious repair is to path-qualify route names so every file mounts at the
 * distinct path _generateMountPath already computes. That is additive for
 * existing callers and would fix hundreds of frontend calls now hitting 404.
 * But it silently promotes every unguarded handler in those files into a live
 * endpoint. Measured on 2026-09-21: 113 unguarded POST/PUT/DELETE handlers
 * across 25 files, including unauthenticated tenant deletion, platform
 * configuration apply/rollback, and server provisioning.
 *
 * So this audit is the gate on that repair. It exits non-zero while any
 * discarded file that would become reachable still has an unguarded write
 * handler, and it names them so they can be hardened first.
 *
 * Exit codes:
 *   0  no discarded file has an unguarded write handler
 *   1  at least one does (or the loader could not be analysed)
 *
 * Read-only. It never mounts anything.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ROUTES_DIR = path.join(ROOT, 'backend/src/routes');

/**
 * Middleware names that count as a guard. Anything that authenticates,
 * authorizes, or gates by role/permission/key belongs here; a rate limiter
 * alone does not, since it throttles anonymous callers rather than rejecting
 * them.
 */
const GUARDS = [
  'authMiddleware',
  'requireRole',
  'requirePermission',
  'requireAuth',
  'optionalAuth',
  'protect',
  'adminMiddleware',
  'mfaMiddleware',
  'apiKeyAuth',
];
const GUARD_RE = new RegExp(`\\b(${GUARDS.join('|')})\\b`);

/**
 * Guards are frequently imported under a different local name, or wrapped in a
 * local helper:
 *
 *     const { authMiddleware: authenticate, requireRole } = require('../middleware/auth');
 *     const authorize = (roles) => requireRole(...roles);
 *
 *     router.post('/contracts', authenticate, authorize(['farmer']), handler);
 *
 * Matching only the canonical names reports those handlers as unguarded, which
 * is a false positive in the dangerous direction: it invents a security finding
 * that sends someone to "fix" already-correct code. Found 2026-09-22 against
 * strategic/contractFarmingRoutes.js, whose 8 handlers are all guarded and
 * which this audit had flagged 3 of.
 *
 * So resolve, per file, the local names that actually refer to a guard:
 *   - destructured renames from a middleware import
 *   - plain aliases  (const authenticate = authMiddleware)
 *   - local wrappers (const authorize = (r) => requireRole(...r))
 */
function localGuardNames(src) {
  const names = new Set(GUARDS);
  // const { authMiddleware: authenticate, requireRole } = require('...auth...')
  const destructure = /const\s*\{([^}]*)\}\s*=\s*require\([^)]*\)/g;
  let m;
  while ((m = destructure.exec(src))) {
    for (const part of m[1].split(',')) {
      const [orig, alias] = part.split(':').map((x) => x && x.trim());
      if (orig && GUARDS.includes(orig) && alias) names.add(alias);
    }
  }
  // const X = <something already known to be a guard> ... (alias or wrapper)
  // Repeat to a fixed point so a wrapper around an alias resolves too.
  for (let pass = 0; pass < 3; pass += 1) {
    const before = names.size;
    const assign = /const\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/g;
    let a;
    while ((a = assign.exec(src))) {
      const [, name, rhs] = a;
      if (names.has(name)) continue;
      for (const known of names) {
        if (new RegExp(`\\b${known}\\b`).test(rhs)) {
          names.add(name);
          break;
        }
      }
    }
    if (names.size === before) break;
  }
  return names;
}

/** Blank comments so a guard named only in prose is not mistaken for a real one. */
function maskComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
}

function loadLoader() {
  try {
    return require(path.join(ROOT, 'backend/src/core/dynamicRouteLoader'));
  } catch (err) {
    console.error(`FAIL: cannot load dynamicRouteLoader: ${err.message}`);
    process.exit(1);
  }
}

/** Replicate _registerRoute's first-wins basename claim to find what is dropped. */
function findDiscarded(loader) {
  const files = [];
  loader._walkDirectory(ROUTES_DIR, files);
  const claimed = new Map();
  const discarded = [];
  for (const abs of files.filter((f) => loader._isMountableRouteFile(f))) {
    const rel = path.relative(ROUTES_DIR, abs);
    const name = path.basename(rel, '.js');
    if (claimed.has(name)) discarded.push({ name, rel, keptRel: claimed.get(name) });
    else claimed.set(name, rel);
  }
  return discarded;
}

function auditFile(rel) {
  const src = maskComments(fs.readFileSync(path.join(ROUTES_DIR, rel), 'utf8'));
  // A blanket router.use(authMiddleware) guards everything declared after it.
  // Treated as covering the file, which is conservative in the safe direction:
  // it can only make this audit report fewer findings, never invent one.
  const guardNames = localGuardNames(src);
  const localGuardRe = new RegExp(`\\b(${[...guardNames].map((g) => g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`);
  const blanket = new RegExp(`router\\.use\\(\\s*(${[...guardNames].join('|')})\\b`).test(src);

  const handler = /router\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]*)\2\s*,/g;
  const unguardedWrites = [];
  let total = 0;
  let m;
  while ((m = handler.exec(src))) {
    total += 1;
    const method = m[1].toUpperCase();
    // Look only at the argument list between the path and the handler body.
    const tail = src.slice(m.index + m[0].length, m.index + m[0].length + 260);
    const guarded = blanket || localGuardRe.test(tail);
    if (!guarded && method !== 'GET') unguardedWrites.push(`${method} ${m[3] || '/'}`);
  }
  return { total, blanket, unguardedWrites };
}

function isScaffold(rel) {
  try {
    return /let\s+_items\s*=\s*\[\]/.test(fs.readFileSync(path.join(ROUTES_DIR, rel), 'utf8'));
  } catch {
    return false;
  }
}

function isDeprecationStub(rel) {
  try {
    return /status\(410\)/.test(maskComments(fs.readFileSync(path.join(ROUTES_DIR, rel), 'utf8')));
  } catch {
    return false;
  }
}

function main() {
  const loader = new (loadLoader())({ use() {}, locals: {} });
  const discarded = findDiscarded(loader);

  // Only files that a path-qualifying change would actually make reachable
  // matter here. A scaffold would not be mounted (nothing to expose that is
  // real), and a 410 stub exposes nothing either.
  const candidates = discarded.filter((d) => !isScaffold(d.rel) && !isDeprecationStub(d.rel));

  const findings = [];
  let totalHandlers = 0;
  for (const d of candidates) {
    const a = auditFile(d.rel);
    totalHandlers += a.total;
    if (a.unguardedWrites.length) findings.push({ ...d, ...a });
  }
  findings.sort((x, y) => y.unguardedWrites.length - x.unguardedWrites.length);
  const totalWrites = findings.reduce((n, f) => n + f.unguardedWrites.length, 0);

  console.log(`discarded route files              : ${discarded.length}`);
  console.log(`  of those, real and reachable-able : ${candidates.length}`);
  console.log(`  handlers across them              : ${totalHandlers}`);
  console.log(`  files with an unguarded write     : ${findings.length}`);
  console.log(`  unguarded write handlers          : ${totalWrites}`);

  if (findings.length) {
    console.log('\nUNGUARDED WRITE HANDLERS IN FILES A PATH-QUALIFYING CHANGE WOULD EXPOSE:');
    for (const f of findings) {
      console.log(`\n  ${f.rel}  (${f.unguardedWrites.length}/${f.total} handlers)`);
      for (const w of f.unguardedWrites.slice(0, 8)) console.log(`      ${w}`);
      if (f.unguardedWrites.length > 8) {
        console.log(`      ... +${f.unguardedWrites.length - 8} more`);
      }
    }
    console.log(
      `\nFAIL: ${totalWrites} unguarded write handler(s) would become reachable if route names were path-qualified. Guard them first.`
    );
    process.exit(1);
  }

  console.log('\nPASS: no discarded route file has an unguarded write handler.');
  process.exit(0);
}

main();
