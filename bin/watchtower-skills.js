#!/usr/bin/env node
'use strict';
const { install, TOOLS } = require('../src/install.js');

const usage = `usage: watchtower-skills install [${TOOLS.join('|')}|all] [--dir <project dir>]`;
const args = process.argv.slice(2);
if (args[0] !== 'install') {
  console.error(usage);
  process.exit(2);
}
let tool = 'all';
let dir = '.';
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--dir') dir = args[++i] ?? '';
  else if (!args[i].startsWith('-')) tool = args[i];
  else { console.error(usage); process.exit(2); }
}
if (!dir || (tool !== 'all' && !TOOLS.includes(tool))) {
  console.error(usage);
  process.exit(2);
}
for (const t of tool === 'all' ? TOOLS : [tool]) {
  for (const f of install(t, dir)) console.log(`${t}: wrote ${f}`);
}
