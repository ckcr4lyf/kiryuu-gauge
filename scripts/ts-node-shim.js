#!/usr/bin/env node
// Shim that translates ts-node CLI args to tsx.
// Strips -O/--compiler-options (ts-node-specific; tsx reads tsconfig directly).
const { spawnSync } = require('child_process');
const path = require('path');

// When copied to node_modules/.bin/, __dirname is node_modules/.bin/
const tsx = path.join(__dirname, 'tsx');
const args = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '-O' || argv[i] === '--compiler-options') {
    i++; // skip the JSON value too
  } else {
    args.push(argv[i]);
  }
}

const result = spawnSync(tsx, args, { stdio: 'inherit', shell: false });
process.exit(result.status ?? 1);
