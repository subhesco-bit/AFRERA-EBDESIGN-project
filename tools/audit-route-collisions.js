#!/usr/bin/env node
'use strict';

/**
 * Route-name collision audit.
 *
 * DynamicRouteLoader._extractRouteName() is the file's basename, and
 * _registerRoute() discards any file whose basename is already registered. The
 * discarded file is never mounted at any path, even though
 * _generateMountPath() would have given it a distinct one (it includes the
 * subfolder). Which file survives is decided by directory-walk order.
 *
 * This matters because the repository contains pairs like
 *
 *     routes/ecommerceRoutes.js            (real, database-backed)
 *     routes/commerce/ecommerceRoutes.js   (in-memory CRUD scaffold)
 *
 * and the walk reaches the scaffold first, so the platform serves the scaffold
 * while the real implementation is unreachable.
 *
 * Exit codes:
 *   0  no collision where a scaffold displaced a real implementation
 *   1  at least one such collision (or the loader could not be analysed)
 *
 * The 'neither is a scaffold' collisions are reported but do not fail the
 * audit: two real implementations shadowing each other needs a human decision
 * about which is canonical, not a build break.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ROUTES_DIR = path.join(ROOT, 'backend/src/routes');

function loadLoader() {
  try {
    return require(path.join(ROOT, 'backend/src/core/dynamicRouteLoader'));
  } catch (err) {
    console.error(`FAIL: cannot load dynamicRouteLoader: ${err.message}`);
    process.exit(1);
  }
}

/**
 * A scaffold is identified by its data layer, not by a naming convention: the
 * generated files all keep rows in a module-level array, so they lose every
 * write on restart and cannot be a real implementation of anything.
 */
function isScaffold(absPath) {
  try {
    return /let\s+_items\s*=\s*\[\]/.test(fs.readFileSync(absPath, 'utf8'));
  } catch {
    return false;
  }
}

function main() {
  const Loader = loadLoader();
  const loader = new Loader({ use() {}, locals: {} });

  const files = [];
  loader._walkDirectory(ROUTES_DIR, files);
  const mountable = files.filter((f) => loader._isMountableRouteFile(f));

  const claimed = new Map(); // routeName -> relative path
  const collisions = [];
  for (const abs of mountable) {
    const rel = path.relative(ROUTES_DIR, abs);
    const name = path.basename(rel, '.js');
    if (claimed.has(name)) {
      const keptRel = claimed.get(name);
      collisions.push({
        routeName: name,
        kept: keptRel,
        discarded: rel,
        keptIsScaffold: isScaffold(path.join(ROUTES_DIR, keptRel)),
        discardedIsScaffold: isScaffold(abs),
      });
    } else {
      claimed.set(name, rel);
    }
  }

  const scaffoldWins = collisions.filter((c) => c.keptIsScaffold && !c.discardedIsScaffold);
  const realWins = collisions.filter((c) => !c.keptIsScaffold && c.discardedIsScaffold);
  const ambiguous = collisions.filter((c) => !c.keptIsScaffold && !c.discardedIsScaffold);
  const bothScaffold = collisions.filter((c) => c.keptIsScaffold && c.discardedIsScaffold);

  console.log(`mountable route files : ${mountable.length}`);
  console.log(`unique route names    : ${claimed.size}`);
  console.log(`files discarded       : ${collisions.length}`);
  console.log('');
  console.log(`  scaffold kept, real implementation discarded : ${scaffoldWins.length}`);
  console.log(`  real implementation kept, scaffold discarded : ${realWins.length}`);
  console.log(`  neither is a scaffold (needs a decision)     : ${ambiguous.length}`);
  console.log(`  both are scaffolds                           : ${bothScaffold.length}`);

  if (scaffoldWins.length) {
    console.log('\nSERVING A SCAFFOLD, REAL IMPLEMENTATION UNREACHABLE:');
    for (const c of scaffoldWins) {
      console.log(`  ${c.routeName}`);
      console.log(`      serving   : ${c.kept}`);
      console.log(`      discarded : ${c.discarded}`);
    }
  }

  if (ambiguous.length) {
    console.log('\nTWO NON-SCAFFOLD FILES COLLIDE (reported, not failed):');
    for (const c of ambiguous) {
      console.log(`  ${c.routeName.padEnd(36)} serving ${c.kept}  |  discarded ${c.discarded}`);
    }
  }

  if (scaffoldWins.length) {
    console.log(
      `\nFAIL: ${scaffoldWins.length} route path(s) serve an in-memory scaffold while the real implementation is never mounted.`
    );
    process.exit(1);
  }

  console.log('\nPASS: no route path serves a scaffold in place of a real implementation.');
  process.exit(0);
}

main();
