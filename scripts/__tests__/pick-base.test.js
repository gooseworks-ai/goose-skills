'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { git } = require('./atom-checks.helpers');

const SCRIPT = path.resolve(__dirname, '..', 'pick-base.js');

/** main at A, then a PR merge commit M = merge(A, feature) checked out; main later moves to C. */
function prRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-base-'));
  git(root, 'init', '-q', '-b', 'main');
  git(root, 'config', 'user.email', 'fixture@example.com');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'commit.gpgsign', 'false');
  const commit = (file, msg) => {
    fs.writeFileSync(path.join(root, file), `${msg}\n`);
    git(root, 'add', '-A');
    git(root, 'commit', '-q', '-m', msg);
    return git(root, 'rev-parse', 'HEAD');
  };
  const a = commit('a.txt', 'base');
  git(root, 'checkout', '-q', '-b', 'feature');
  commit('b.txt', 'feature');
  git(root, 'checkout', '-q', 'main');
  const c = commit('c.txt', 'main moved on');
  git(root, 'checkout', '-q', '--detach', a);
  git(root, 'merge', '-q', '--no-ff', '-m', 'merge', 'feature');
  return { root, a, c };
}

function pick(root, name, event) {
  const file = path.join(root, '..', `${path.basename(root)}-event.json`);
  fs.writeFileSync(file, JSON.stringify(event));
  const res = spawnSync(process.execPath, [SCRIPT], {
    cwd: root,
    env: { ...process.env, GITHUB_EVENT_NAME: name, GITHUB_EVENT_PATH: file, GOOSE_SKILLS_ROOT: root },
    encoding: 'utf8',
  });
  return { code: res.status, out: res.stdout.trim(), err: res.stderr };
}

test('a pull request compares with the sha its merge commit was made on, not the moved branch', () => {
  const { root, a, c } = prRepo();
  const res = pick(root, 'pull_request', { pull_request: { base: { ref: 'main', sha: a } } });
  assert.equal(res.code, 0, res.err);
  assert.equal(res.out, a);
  assert.notEqual(res.out, c);

  const mismatched = pick(root, 'pull_request', { pull_request: { base: { ref: 'main', sha: c } } });
  assert.equal(mismatched.code, 1, mismatched.out);
  assert.match(mismatched.err, /merge commit was made on/);
});

test('a push with no usable previous tip fails instead of running unchecked', () => {
  const { root, a } = prRepo();
  assert.equal(pick(root, 'push', { before: a }).out, a);
  assert.equal(pick(root, 'push', { before: '0'.repeat(40) }).code, 1);
  assert.equal(pick(root, 'push', { before: 'f'.repeat(40) }).code, 1);
});
