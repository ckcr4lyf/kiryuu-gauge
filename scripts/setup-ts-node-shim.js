#!/usr/bin/env node
// Postinstall: wire scripts/ts-node-shim.js into node_modules/.bin/ts-node
// so gauge-ts launcher (which hardcodes that path) picks up tsx instead.
const fs = require('fs');
const path = require('path');

const shimSrc = path.join(__dirname, 'ts-node-shim.js');
const binDir = path.join(__dirname, '..', 'node_modules', '.bin');
const target = path.join(binDir, 'ts-node');

if (!fs.existsSync(binDir)) {
  console.log('setup-ts-node-shim: node_modules/.bin not found, skipping');
  process.exit(0);
}

// Remove existing ts-node symlink/file if present
try { fs.unlinkSync(target); } catch (_) {}

fs.copyFileSync(shimSrc, target);
fs.chmodSync(target, 0o755);
console.log('setup-ts-node-shim: ts-node -> tsx shim installed');
