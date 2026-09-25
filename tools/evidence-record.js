#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const logPath = path.join(root, '.audit', 'phase-program', 'evidence.jsonl');

function sha256File(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytes;
    while ((bytes = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) {
      hash.update(buffer.subarray(0, bytes));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

function usage() {
  console.error('Usage: node tools/evidence-record.js <phase:000-099> <type> <note> [file-or-dir]');
  process.exit(2);
}
const [phase, type, note, targetArg] = process.argv.slice(2);
if (!/^\d{3}$/.test(phase || '') || Number(phase) > 99 || !type || !note) usage();

fs.mkdirSync(path.dirname(logPath), { recursive: true });
let target = null;
let sha256 = null;
let kind = null;

if (targetArg) {
  const absolute = path.isAbsolute(targetArg) ? targetArg : path.join(root, targetArg);
  if (!fs.existsSync(absolute)) {
    console.error('Evidence target does not exist: ' + absolute);
    process.exit(1);
  }
  const stat = fs.statSync(absolute);
  kind = stat.isFile() ? 'file' : stat.isDirectory() ? 'directory' : 'other';
  target = path.relative(root, absolute).replace(/\\/g, '/');
  if (stat.isFile()) sha256 = sha256File(absolute);
}

const record = {
  timestamp: new Date().toISOString(),
  phase,
  type,
  note,
  target,
  kind,
  sha256
};
fs.appendFileSync(logPath, JSON.stringify(record) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify(record, null, 2));
