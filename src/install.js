'use strict';
const fs = require('node:fs');
const path = require('node:path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const TOOLS = ['claude', 'cursor', 'codex', 'gemini'];
const BEGIN = '<!-- watchtower-skills:begin -->';
const END = '<!-- watchtower-skills:end -->';

/** Reads the bundled skills as [{name, description, body}]. */
function loadSkills(dir = SKILLS_DIR) {
  return fs.readdirSync(dir).sort().map((name) => {
    const raw = fs.readFileSync(path.join(dir, name, 'SKILL.md'), 'utf8');
    const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
    if (!m) throw new Error(`${name}/SKILL.md has no frontmatter`);
    const description = /^description:\s*(.+)$/m.exec(m[1])?.[1] ?? name;
    return { name, description, body: m[2].trim(), raw };
  });
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return file;
}

// Replaces our marked block in a shared file (AGENTS.md, GEMINI.md); user text outside it is kept.
function upsertBlock(file, block) {
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const wrapped = `${BEGIN}\n${block}\n${END}`;
  const i = cur.indexOf(BEGIN);
  const j = cur.indexOf(END);
  const next = i >= 0 && j > i
    ? cur.slice(0, i) + wrapped + cur.slice(j + END.length)
    : (cur ? cur.replace(/\n*$/, '\n\n') : '') + wrapped + '\n';
  return write(file, next);
}

const asSections = (skills) => skills
  .map((s) => `## ${s.name}\n\n${s.description}\n\n${s.body}`).join('\n\n');

/** Installs every skill for one tool under dir; returns the files written. Safe to re-run. */
function install(tool, dir = '.', skills = loadSkills()) {
  if (!TOOLS.includes(tool)) throw new Error(`unknown tool "${tool}"; use one of ${TOOLS.join(', ')}`);
  switch (tool) {
    case 'claude':
      return skills.map((s) => write(path.join(dir, '.claude', 'skills', s.name, 'SKILL.md'), s.raw));
    case 'cursor':
      return skills.map((s) => write(
        path.join(dir, '.cursor', 'rules', `${s.name}.mdc`),
        `---\ndescription: ${s.description}\nalwaysApply: false\n---\n\n${s.body}\n`,
      ));
    case 'codex':
      return [upsertBlock(path.join(dir, 'AGENTS.md'), `# Watchtower\n\n${asSections(skills)}`)];
    default:
      return [upsertBlock(path.join(dir, 'GEMINI.md'), `# Watchtower\n\n${asSections(skills)}`)];
  }
}

module.exports = { install, loadSkills, TOOLS, BEGIN, END };
