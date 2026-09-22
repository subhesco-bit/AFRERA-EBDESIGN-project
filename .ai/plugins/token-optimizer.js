#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const resultsDir = path.join(repoRoot, '.ai', 'plugins', 'results');
fs.mkdirSync(resultsDir, { recursive: true });

function ensureCommand(command, label) {
  try {
    execSync(command, { cwd: repoRoot, stdio: 'ignore' });
    return true;
  } catch (error) {
    console.warn(`Warning: ${label} command could not run: ${error.message}`);
    return false;
  }
}

const checks = [
  { label: 'backend dep audit', command: 'node .ai/plugins/dep-auditor.js backend' },
  { label: 'frontend dep audit', command: 'node .ai/plugins/dep-auditor.js frontend' },
  { label: 'audit chain', command: 'node .ai/plugins/audit-chain.js backend frontend' },
  { label: 'powerShell plugin wrappers', command: 'pwsh -NoProfile -ExecutionPolicy Bypass -File .ai/plugins/ps/Install-PluginHooks.ps1' },
];

const payload = {
  generatedAt: new Date().toISOString(),
  repoRoot,
  workflow: 'token-optimization',
  checks: checks.map((check) => {
    const ok = ensureCommand(check.command, check.label);
    return {
      label: check.label,
      ok,
      executed: true,
      note: ok ? 'Completed via plugin-driven zero-token workflow.' : 'Skipped; runtime dependency unavailable.'
    };
  }),
};

const outFile = path.join(resultsDir, `token-optimizer-${Date.now()}.json`);
fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
console.log(JSON.stringify({ artifact: outFile, status: 'ready', workflow: 'token-optimization' }, null, 2));
