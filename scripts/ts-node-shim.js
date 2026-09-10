#!/usr/bin/env node
// Shim that translates ts-node CLI args to tsx.
// Strips ts-node-only flags: -O/--compiler-options (tsx reads tsconfig)
// and --esm (gauge-ts 0.5.1 always passes this; tsx/node reject it).
const { spawnSync } = require('child_process');
const path = require('path');

// When copied to node_modules/.bin/, __dirname is node_modules/.bin/
const tsx = path.join(__dirname, 'tsx');
const args = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '-O' || argv[i] === '--compiler-options') {
    i++; // skip the JSON value too
  } else if (argv[i] === '--esm') {
    // tsx already loads TS/ESM; forwarding --esm is `node: bad option: --esm`
  } else {
    args.push(argv[i]);
  }
}

const result = spawnSync(tsx, args, { stdio: 'inherit', shell: false });
process.exit(result.status ?? 1);
