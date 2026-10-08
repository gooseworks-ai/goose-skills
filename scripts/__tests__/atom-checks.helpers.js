'use strict';

// Fixture repos for the atom lint and version tests: a throwaway git repo
// with video atoms, a base commit, and the branch's changes on top.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const SCRIPTS = path.resolve(__dirname, '..');

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function writeAtom(root, slug, { skill = `# ${slug}\n\nHow to drive the model well.\n`, meta = { slug, version: '1.0.0' }, files = {} } = {}) {
  const dir = path.join(root, 'skills', 'ads', 'capabilities', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), skill);
  if (meta) fs.writeFileSync(path.join(dir, 'skill.meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  }
  return dir;
}

/** A repo whose base commit holds the given atoms. Returns { root, base }. */
function makeRepo(atoms) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-atoms-'));
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 'fixture@example.com');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'commit.gpgsign', 'false');
  for (const [slug, opts] of Object.entries(atoms)) writeAtom(root, slug, opts);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'base');
  return { root, base: git(root, 'rev-parse', 'HEAD') };
}

function commitAll(root, message = 'change') {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', message);
}

function run(script, root, args) {
  const env = { ...process.env, GOOSE_SKILLS_ROOT: root };
  delete env.GITHUB_ACTIONS;
  delete env.GITHUB_STEP_SUMMARY;
  const res = spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], { env, encoding: 'utf8' });
  return { code: res.status, out: `${res.stdout}${res.stderr}` };
}

module.exports = { git, writeAtom, makeRepo, commitAll, run };
