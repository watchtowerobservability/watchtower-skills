'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { install, loadSkills, BEGIN, END } = require('../src/install.js');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'wt-skills-'));

test('bundles the five skills with names matching their directories', () => {
  const names = loadSkills().map((s) => s.name);
  assert.deepStrictEqual(names, [
    'watchtower-activity', 'watchtower-debug-issue', 'watchtower-query', 'watchtower-setup', 'watchtower-write-alerts',
  ]);
  for (const s of loadSkills()) assert.match(s.raw, new RegExp(`^---\\nname: ${s.name}\\n`));
});

test('claude gets one SKILL.md per skill', () => {
  const d = tmp();
  const files = install('claude', d);
  assert.strictEqual(files.length, 5);
  assert.ok(fs.existsSync(path.join(d, '.claude/skills/watchtower-setup/SKILL.md')));
});

test('cursor gets .mdc rules with a description', () => {
  const d = tmp();
  install('cursor', d);
  const t = fs.readFileSync(path.join(d, '.cursor/rules/watchtower-query.mdc'), 'utf8');
  assert.match(t, /^---\ndescription: .+\nalwaysApply: false\n---/);
});

for (const [tool, file] of [['codex', 'AGENTS.md'], ['gemini', 'GEMINI.md']]) {
  test(`${tool} block is idempotent and keeps user text`, () => {
    const d = tmp();
    fs.writeFileSync(path.join(d, file), '# Mine\n\nkeep me\n');
    install(tool, d);
    const once = fs.readFileSync(path.join(d, file), 'utf8');
    install(tool, d);
    const twice = fs.readFileSync(path.join(d, file), 'utf8');
    assert.strictEqual(once, twice);
    assert.ok(twice.startsWith('# Mine\n\nkeep me'));
    assert.strictEqual(twice.split(BEGIN).length, 2);
    assert.ok(twice.includes(END));
  });
}

test('unknown tool is rejected', () => {
  assert.throws(() => install('vim', tmp()), /unknown tool/);
});

test('cli installs for all tools and rejects bad input', () => {
  const d = tmp();
  const bin = path.join(__dirname, '..', 'bin', 'watchtower-skills.js');
  assert.strictEqual(spawnSync('node', [bin, 'install', '--dir', d]).status, 0);
  assert.ok(fs.existsSync(path.join(d, 'AGENTS.md')));
  assert.strictEqual(spawnSync('node', [bin, 'install', 'vim']).status, 2);
});

test('skills never embed a key-looking value', () => {
  for (const s of loadSkills()) assert.doesNotMatch(s.raw, /wti_[A-Za-z0-9]{8,}/);
});
