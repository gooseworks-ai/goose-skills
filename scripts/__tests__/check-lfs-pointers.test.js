'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { git, commitAll, run } = require('./atom-checks.helpers');

const POINTER =
  'version https://git-lfs.github.com/spec/v1\n' +
  'oid sha256:55aad2cfb4ba28d886cec11ba33bea60d63d51f59103f3b940d294b08d7d4c45\n' +
  'size 56441\n';

/** A repo with one real (tiny) image and one text file committed. */
function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-lfs-'));
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 'fixture@example.com');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'commit.gpgsign', 'false');
  const dir = path.join(root, 'skills', 'ads', 'capabilities', 'mock', 'assets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'real.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  fs.writeFileSync(path.join(root, 'skills', 'ads', 'capabilities', 'mock', 'SKILL.md'), '# mock\n\nversion https://example.com is not a pointer.\n');
  commitAll(root, 'base');
  return { root, dir };
}

test('a tracked LFS pointer stub fails the check and is named', () => {
  const { root, dir } = makeRepo();
  fs.writeFileSync(path.join(dir, 'sample.jpg'), POINTER);
  commitAll(root, 'add pointer');
  const res = run('check-lfs-pointers.js', root, []);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /skills\/ads\/capabilities\/mock\/assets\/sample\.jpg is an unresolved Git LFS pointer/);
  assert.match(res.out, /LFS pointers: 1 found\./);
});

test('real binaries and text pass, and an untracked stub is not the repository\'s problem', () => {
  const { root, dir } = makeRepo();
  fs.writeFileSync(path.join(dir, 'untracked.jpg'), POINTER);
  const res = run('check-lfs-pointers.js', root, []);
  assert.equal(res.code, 0, res.out);
  assert.match(res.out, /LFS pointers: 0 found\./);
});

test('a stub staged in the index is caught before it is committed', () => {
  const { root, dir } = makeRepo();
  fs.writeFileSync(path.join(dir, 'staged.jpg'), POINTER);
  git(root, 'add', '-A');
  const res = run('check-lfs-pointers.js', root, []);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /staged\.jpg is an unresolved Git LFS pointer/);
});
