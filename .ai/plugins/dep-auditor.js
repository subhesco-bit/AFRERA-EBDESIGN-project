#!/usr/bin/env node
// Zero-token dependency/vulnerability audit plugin.
// Wraps npm audit/outdated/depcheck and writes a timestamped JSON artifact
// to .ai/plugins/results/ so agents can `require()`/read the result instead
// of re-running or narrating the analysis (see PLUGIN_TOKEN_OPTIMIZATION.md).
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function safeExec(cmd, cwd) {
  try {
    return JSON.parse(execSync(cmd, { encoding: 'utf8', cwd, stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch (err) {
    // npm audit/outdated exit non-zero when issues are found; stdout still has JSON
    if (err.stdout) {
      try { return JSON.parse(err.stdout); } catch (_) { /* fall through */ }
    }
    return { error: err.message };
  }
}

async function auditDependencies(targetDir) {
  const results = {
    target: targetDir,
    timestamp: new Date().toISOString(),
    vulnerabilities: safeExec('npm audit --json', targetDir),
    outdated: safeExec('npm outdated --json', targetDir),
  };

  const resultsDir = path.join(__dirname, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  const outFile = path.join(resultsDir, `dep-audit-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  results.artifact = outFile;
  return results;
}

if (require.main === module) {
  const target = process.argv[2] || 'backend';
  auditDependencies(target).then((r) => {
    console.log(JSON.stringify({ artifact: r.artifact, timestamp: r.timestamp }, null, 2));
    process.exit(0);
  });
}

module.exports = { auditDependencies };
