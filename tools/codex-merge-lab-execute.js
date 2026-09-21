#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = process.cwd();
const planCsv = path.join(root, 'docs', 'codex-duplicate-rename-plan.csv');
const logCsv = path.join(root, '_MERGE_LAB', 'reports', 'execution-log.csv');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
      else if (ch === '"') { quoted = false; }
      else { cur += ch; }
    } else if (ch === '"') { quoted = true; }
    else if (ch === ',') { out.push(cur); cur = ''; }
    else { cur += ch; }
  }
  out.push(cur);
  return out;
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function fileHash(absPath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(absPath));
  return hash.digest('hex');
}

async function main() {
  if (!fs.existsSync(planCsv)) {
    console.error(`Missing ${planCsv}`);
    process.exit(1);
  }

  const rl = readline.createInterface({ input: fs.createReadStream(planCsv), crlfDelay: Infinity });
  let headerSeen = false;
  let copied = 0;
  let skippedMissing = 0;
  let skippedExists = 0;
  let hashMismatch = 0;
  let errors = 0;
  const log = [['feature', 'source', 'original_path', 'proposed_merge_lab_path', 'result']];

  for await (const line of rl) {
    if (!line.trim()) continue;
    if (!headerSeen) { headerSeen = true; continue; }
    const [feature, source, originalPath, sha256, proposedPath] = parseCsvLine(line);
    if (!originalPath || !proposedPath) continue;

    const absSrc = path.join(root, originalPath);
    const absDst = path.join(root, proposedPath);

    let result;
    if (!fs.existsSync(absSrc)) {
      skippedMissing += 1;
      result = 'skip-missing-source';
    } else if (fs.existsSync(absDst)) {
      skippedExists += 1;
      result = 'skip-already-copied';
    } else {
      try {
        const actualHash = fileHash(absSrc);
        if (sha256 && actualHash !== sha256) {
          hashMismatch += 1;
        }
        fs.mkdirSync(path.dirname(absDst), { recursive: true });
        fs.copyFileSync(absSrc, absDst);
        copied += 1;
        result = 'copied';
      } catch (error) {
        errors += 1;
        result = `error:${error.code || error.message}`;
      }
    }
    log.push([feature, source, originalPath, proposedPath, result]);
  }

  fs.mkdirSync(path.dirname(logCsv), { recursive: true });
  fs.writeFileSync(logCsv, log.map((row) => row.map(csvEscape).join(',')).join('\n') + '\n');

  console.log(JSON.stringify({
    copied,
    skippedMissing,
    skippedExists,
    hashMismatch,
    errors,
    log: path.relative(root, logCsv)
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
