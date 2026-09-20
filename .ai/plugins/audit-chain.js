#!/usr/bin/env node
// Runs the zero-token audit chain in parallel and writes one combined
// artifact, so an agent reads one file instead of re-deriving findings.
const fs = require('fs');
const path = require('path');
const { auditDependencies } = require('./dep-auditor');

async function runAuditChain(targets = ['backend', 'frontend']) {
  const timestamp = new Date().toISOString();
  const depResults = await Promise.all(targets.map((t) => auditDependencies(t).catch((e) => ({ target: t, error: e.message }))));

  const combined = { timestamp, dependencies: depResults };
  const resultsDir = path.join(__dirname, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  const outFile = path.join(resultsDir, `audit-chain-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(combined, null, 2));
  combined.artifact = outFile;
  return combined;
}

if (require.main === module) {
  runAuditChain(process.argv.slice(2).length ? process.argv.slice(2) : undefined).then((r) => {
    console.log(JSON.stringify({ artifact: r.artifact, timestamp: r.timestamp }, null, 2));
    process.exit(0);
  });
}

module.exports = { runAuditChain };
