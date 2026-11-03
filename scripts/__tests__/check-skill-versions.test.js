'use strict';

// check-skill-versions.js against throwaway git repos: every family, moves,
// tests/ changes and the entry plugin manifests.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { git, commitAll, run } = require('./atom-checks.helpers');

const SCRIPT = 'check-skill-versions.js';

function write(root, rel, content) {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), content);
}

function writeSkill(root, dir, { version = '1.0.0', category = 'playbooks', files = {} } = {}) {
  const slug = dir.split('/').pop();
  write(root, `${dir}/SKILL.md`, `---\nname: ${slug}\n---\n# ${slug}\n`);
  const meta = { slug, category, ...(version === null ? {} : { version }) };
  write(root, `${dir}/skill.meta.json`, `${JSON.stringify(meta, null, 2)}\n`);
  for (const [rel, content] of Object.entries(files)) write(root, `${dir}/${rel}`, content);
}

function manifest(version, extra = {}) {
  return `${JSON.stringify({ name: 'gooseworks', version, skills: './', ...extra }, null, 2)}\n`;
}

/** A repo whose first commit is built by `setup(root)`. Returns { root, base }. */
function repo(setup) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-skill-versions-'));
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 'fixture@example.com');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'commit.gpgsign', 'false');
  setup(root);
  commitAll(root, 'base');
  return { root, base: git(root, 'rev-parse', 'HEAD') };
}

function setVersion(root, dir, version) {
  const p = path.join(root, dir, 'skill.meta.json');
  const meta = JSON.parse(fs.readFileSync(p, 'utf8'));
  fs.writeFileSync(p, `${JSON.stringify({ ...meta, version }, null, 2)}\n`);
}

const PLAYBOOK = 'skills/marketing/plan-launch';

test('a changed marketing skill must raise its version', () => {
  const { root, base } = repo((r) => writeSkill(r, PLAYBOOK));
  fs.appendFileSync(path.join(root, PLAYBOOK, 'SKILL.md'), 'Ask for the launch date first.\n');
  commitAll(root);
  const res = run(SCRIPT, root, ['--base', base]);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /skills\/marketing\/plan-launch: changed on this branch, so its version must go above 1\.0\.0 \(it is 1\.0\.0\)/);

  setVersion(root, PLAYBOOK, '1.0.1');
  commitAll(root);
  assert.equal(run(SCRIPT, root, ['--base', base]).code, 0);
});

test('shared skills are checked too; a lower version fails', () => {
  const dir = 'skills/shared/brand-notes';
  const { root, base } = repo((r) => writeSkill(r, dir, { version: '2.0.0', category: 'capabilities' }));
  write(root, `${dir}/scripts/run.py`, 'print(1)\n');
  setVersion(root, dir, '1.9.9');
  commitAll(root);
  const res = run(SCRIPT, root, ['--base', base]);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /brand-notes: changed on this branch, so its version must go above 2\.0\.0/);
});

test('a change only inside tests/ needs no bump (tests are not installed)', () => {
  const { root, base } = repo((r) => writeSkill(r, PLAYBOOK, { files: { 'tests/test-by-hand.md': 'Step 1.\n' } }));
  write(root, `${PLAYBOOK}/tests/test-by-hand.md`, 'Step 1, reworded.\n');
  commitAll(root);
  const res = run(SCRIPT, root, ['--base', base]);
  assert.equal(res.code, 0, res.out);
});

test('a new skill needs a version', () => {
  const { root, base } = repo((r) => writeSkill(r, PLAYBOOK));
  writeSkill(root, 'skills/marketing/new-one', { version: null });
  commitAll(root);
  const res = run(SCRIPT, root, ['--base', base]);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /new-one: changed on this branch but has no version/);
});

test('a skill moved from an old layout passes when identical and fails when edited without a bump', () => {
  const { root, base } = repo((r) => writeSkill(r, 'marketing-agent/skills/plan-launch', { files: { 'references/a.md': 'A\n' } }));
  fs.mkdirSync(path.join(root, 'skills', 'marketing'), { recursive: true });
  fs.renameSync(path.join(root, 'marketing-agent', 'skills', 'plan-launch'), path.join(root, PLAYBOOK));
  commitAll(root, 'move');
  const moved = run(SCRIPT, root, ['--base', base]);
  assert.equal(moved.code, 0, moved.out);

  fs.appendFileSync(path.join(root, PLAYBOOK, 'references', 'a.md'), 'B\n');
  commitAll(root, 'edit');
  const edited = run(SCRIPT, root, ['--base', base]);
  assert.equal(edited.code, 1, edited.out);
  assert.match(edited.out, /skills\/marketing\/plan-launch: changed on this branch, so its version must go above 1\.0\.0/);
});

test('a move keeps the old version even when the old folder kept it only in the SKILL.md frontmatter', () => {
  const { root, base } = repo((r) => {
    write(r, 'skills/sales/composites/deal-notes/SKILL.md', '---\nname: deal-notes\nversion: 1.4.0\n---\n# deal-notes\n');
    write(r, 'skills/sales/composites/deal-notes/skill.meta.json', '{"slug":"deal-notes"}\n');
  });
  fs.rmSync(path.join(root, 'skills', 'sales'), { recursive: true });
  writeSkill(root, 'skills/shared/deal-notes', { version: '1.4.0', category: 'capabilities' });
  commitAll(root);
  const res = run(SCRIPT, root, ['--base', base]);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /deal-notes: changed on this branch, so its version must go above 1\.4\.0/);
});

test('video atoms are left to check-atom-versions.js; video formats are checked here', () => {
  const { root, base } = repo((r) => {
    writeSkill(r, 'skills/video/clip-maker', { category: 'capabilities' });
    writeSkill(r, 'skills/video/render-demo', { category: 'composites' });
  });
  fs.appendFileSync(path.join(root, 'skills/video/clip-maker/SKILL.md'), 'More.\n');
  fs.appendFileSync(path.join(root, 'skills/video/render-demo/SKILL.md'), 'More.\n');
  commitAll(root);
  const res = run(SCRIPT, root, ['--base', base]);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /render-demo: changed on this branch/);
  assert.doesNotMatch(res.out, /clip-maker/);
});

test('an entry skill change must raise the version in both plugin manifests', () => {
  const entry = 'skills/entry/goose-ads';
  const { root, base } = repo((r) => {
    writeSkill(r, entry, { category: 'entry' });
    write(r, 'skills/entry/.claude-plugin/plugin.json', manifest('1.1.0'));
    write(r, 'skills/entry/.codex-plugin/plugin.json', manifest('1.1.0', { interface: { displayName: 'GooseWorks' } }));
  });
  fs.appendFileSync(path.join(root, entry, 'SKILL.md'), 'Read the brand first.\n');
  setVersion(root, entry, '1.0.1');
  commitAll(root);
  const stale = run(SCRIPT, root, ['--base', base]);
  assert.equal(stale.code, 1, stale.out);
  assert.match(stale.out, /\.claude-plugin\/plugin\.json: entry skills changed \(goose-ads\), so the plugin version must go above 1\.1\.0/);
  assert.match(stale.out, /\.codex-plugin\/plugin\.json: entry skills changed/);

  write(root, 'skills/entry/.claude-plugin/plugin.json', manifest('1.2.0'));
  commitAll(root);
  const half = run(SCRIPT, root, ['--base', base]);
  assert.equal(half.code, 1, half.out);
  assert.match(half.out, /the entry plugin manifests disagree on version/);

  write(root, 'skills/entry/.codex-plugin/plugin.json', manifest('1.2.0', { interface: { displayName: 'GooseWorks' } }));
  commitAll(root);
  const bumped = run(SCRIPT, root, ['--base', base]);
  assert.equal(bumped.code, 0, bumped.out);
});

test('a manifest edited on its own must raise its version too', () => {
  const { root, base } = repo((r) => {
    write(r, 'skills/entry/.claude-plugin/plugin.json', manifest('1.1.0'));
  });
  write(root, 'skills/entry/.claude-plugin/plugin.json', manifest('1.1.0', { description: 'New words.' }));
  commitAll(root);
  const res = run(SCRIPT, root, ['--base', base]);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /the manifest changed, so the plugin version must go above 1\.1\.0/);
});

test('a push with no previous tip cannot pass as unchecked', () => {
  const { root } = repo((r) => writeSkill(r, PLAYBOOK));
  assert.equal(run(SCRIPT, root, ['--base', '0'.repeat(40), '--direct']).code, 2);
});
