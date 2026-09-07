/**
 * SAP Module Architecture Service — this platform's OWN service registry
 * and dependency map, introspected at runtime.
 *
 * Strategy Card
 * Purpose:  Answer "what services does this platform actually have, and how
 *           big/interconnected are they" without maintaining a second,
 *           hand-written catalog that drifts from reality (unlike
 *           moduleCatalogService.js, which is a curated *product-feature*
 *           catalog for the frontend — this is a *codebase* introspection
 *           tool for engineers/ops, reading the real filesystem every call).
 * Actors:   engineers/ops (human, via the registry endpoint), architecture
 *           review tooling (system).
 * Decision: none — pure introspection/reporting.
 * Algorithm: walk backend/src/services/<domain>/*.js at request time,
 *           record file count and byte size per domain, and regex-scan each
 *           file's require() calls for intra-services cross-domain
 *           references to build a real (if approximate — static regex, not
 *           an AST) dependency edge list between domains.
 * Data:     none persisted — this is a live filesystem read every call, so
 *           it can never go stale the way a hand-maintained catalog would.
 * AI role:  none.
 * Status:   real. The name "SAP" is historical (inherited from the original
 *           scaffold's filename); this has no relationship to SAP the
 *           product — it is this codebase's own architecture map.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');

const SERVICES_ROOT = path.join(__dirname, '..'); // backend/src/services

/** Cross-domain require pattern: require('../<domain>/<file>') from a services/<domain>/ file. */
const REQUIRE_PATTERN = /require\(\s*['"]\.\.\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)['"]\s*\)/g;

function listJsFiles(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function listDomains() {
  try {
    return fs.readdirSync(SERVICES_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    logger.error('sapModuleArchitectureService: failed to list domains', { error: error.message });
    return [];
  }
}

/**
 * Build the registry: one entry per domain directory under services/, each
 * with its real file list and total byte size (a size proxy for "how much
 * logic lives here" — cheap and honest, unlike a fabricated complexity
 * score).
 */
function buildServiceRegistry() {
  const domains = listDomains();
  const registry = domains.map((domain) => {
    const domainDir = path.join(SERVICES_ROOT, domain);
    const files = listJsFiles(domainDir);
    let totalBytes = 0;
    const modules = files.map((file) => {
      let size = 0;
      try {
        size = fs.statSync(path.join(domainDir, file)).size;
      } catch { /* file vanished between readdir and stat — skip its size */ }
      totalBytes += size;
      return { module: file.replace(/\.js$/, ''), file, sizeBytes: size };
    });
    return { domain, moduleCount: modules.length, totalBytes, modules };
  });

  return {
    domainCount: registry.length,
    totalModules: registry.reduce((sum, d) => sum + d.moduleCount, 0),
    domains: registry,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Static, regex-based cross-domain dependency edges. Approximate by design
 * (a real AST parse would catch dynamic requires and aliasing this misses)
 * but every edge reported is a real require() found in a real file — this
 * never invents a relationship that isn't in the source.
 */
function buildDependencyMap() {
  const domains = listDomains();
  const edges = [];
  const domainSet = new Set(domains);

  domains.forEach((domain) => {
    const domainDir = path.join(SERVICES_ROOT, domain);
    listJsFiles(domainDir).forEach((file) => {
      let content;
      try {
        content = fs.readFileSync(path.join(domainDir, file), 'utf8');
      } catch {
        return;
      }
      let match;
      REQUIRE_PATTERN.lastIndex = 0;
      while ((match = REQUIRE_PATTERN.exec(content)) !== null) {
        const [, targetDomain, targetFile] = match;
        if (domainSet.has(targetDomain) && targetDomain !== domain) {
          edges.push({
            from: `${domain}/${file.replace(/\.js$/, '')}`,
            to: `${targetDomain}/${targetFile.replace(/\.js$/, '')}`,
            fromDomain: domain,
            toDomain: targetDomain
          });
        }
      }
    });
  });

  // Domain-level fan-out/fan-in, derived from the edges above.
  const domainStats = {};
  domains.forEach((d) => { domainStats[d] = { dependsOn: new Set(), dependedOnBy: new Set() }; });
  edges.forEach(({ fromDomain, toDomain }) => {
    domainStats[fromDomain].dependsOn.add(toDomain);
    domainStats[toDomain].dependedOnBy.add(fromDomain);
  });

  return {
    edgeCount: edges.length,
    edges,
    domainSummary: Object.fromEntries(
      Object.entries(domainStats).map(([d, s]) => [
        d,
        { dependsOn: [...s.dependsOn], dependedOnBy: [...s.dependedOnBy] }
      ])
    ),
    generatedAt: new Date().toISOString()
  };
}

router.get('/', (req, res) => {
  try {
    res.json({ success: true, data: buildServiceRegistry() });
  } catch (error) {
    logger.error('sapModuleArchitectureService: registry build failed', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dependencies', (req, res) => {
  try {
    res.json({ success: true, data: buildDependencyMap() });
  } catch (error) {
    logger.error('sapModuleArchitectureService: dependency map failed', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:domain', (req, res) => {
  try {
    const registry = buildServiceRegistry();
    const entry = registry.domains.find((d) => d.domain === req.params.domain);
    if (!entry) return res.status(404).json({ success: false, error: 'Domain not found' });
    res.json({ success: true, data: entry });
  } catch (error) {
    logger.error('sapModuleArchitectureService: domain detail failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = { router, buildServiceRegistry, buildDependencyMap };
