'use strict';
/**
 * Value-Chain Studio orchestrator — transport bootstrap.
 * Assembles p1+p2 at load time so the full deterministic plan builder is available.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const code =
  fs.readFileSync(path.join(__dirname, 'valueChainStudioService.p1.js'), 'utf8') +
  fs.readFileSync(path.join(__dirname, 'valueChainStudioService.p2.js'), 'utf8');

const m = new Module(path.join(__dirname, 'valueChainStudioService.assembled.js'));
m.filename = path.join(__dirname, 'valueChainStudioService.js');
m.paths = Module._nodeModulePaths(__dirname);
m._compile(code, m.filename);
module.exports = m.exports;
