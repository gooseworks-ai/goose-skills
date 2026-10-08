'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { git, commitAll, run } = require('./atom-checks.helpers');
const { isPointer } = require('../check-lfs-pointers');

const VERSION = 'version https://git-lfs.github.com/spec/v1\n';
const POINTER =
  VERSION +
  'oid sha256:55aad2cfb4ba28d886cec11ba33bea60d63d51f59103f3b940d294b08d7d4c45\n' +
  'size 56441\n';
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** A repo with one real (tiny) image and one text file committed. */
function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-lfs-'));
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 'fixture@example.com');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'commit.gpgsign', 'false');
  const dir = path.join(root, 'skills', 'ads', 'capabilities', 'mock', 'assets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'real.png'), PNG);
  fs.writeFileSync(path.join(root, 'skills', 'ads', 'capabilities', 'mock', 'SKILL.md'), '# mock\n\nversion https://example.com is not a pointer.\n');
  commitAll(root, 'base');
  return { root, dir };
}

test('a committed LFS pointer stub fails the check and is named', () => {
  const { root, dir } = makeRepo();
  fs.writeFileSync(path.join(dir, 'sample.jpg'), POINTER);
  commitAll(root, 'add pointer');
  const res = run('check-lfs-pointers.js', root, []);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /skills\/ads\/capabilities\/mock\/assets\/sample\.jpg is an unresolved Git LFS pointer/);
  assert.match(res.out, /LFS pointers: 1 found, 0 blobs unreadable\./);
});

test('a stub staged in the index is caught even when the working copy was overwritten or deleted', () => {
  const { root, dir } = makeRepo();
  fs.writeFileSync(path.join(dir, 'staged.jpg'), POINTER);
  fs.writeFileSync(path.join(dir, 'gone.jpg'), POINTER);
  git(root, 'add', '-A');
  fs.writeFileSync(path.join(dir, 'staged.jpg'), PNG); // real bytes on disk, pointer in the index
  fs.unlinkSync(path.join(dir, 'gone.jpg'));
  const res = run('check-lfs-pointers.js', root, []);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /staged\.jpg is an unresolved Git LFS pointer/);
  assert.match(res.out, /gone\.jpg is an unresolved Git LFS pointer/);
  assert.match(res.out, /LFS pointers: 2 found/);
});

test('text that merely begins with the version sentence is not a pointer', () => {
  const { root, dir } = makeRepo();
  fs.writeFileSync(path.join(root, 'skills', 'ads', 'capabilities', 'mock', 'notes.md'), `${VERSION}is the header a Git LFS pointer file starts with.\n`);
  commitAll(root, 'add notes');
  fs.writeFileSync(path.join(dir, 'untracked.jpg'), POINTER); // never added: not the repository's problem
  const res = run('check-lfs-pointers.js', root, []);
  assert.equal(res.code, 0, res.out);
  assert.match(res.out, /LFS pointers: 0 found, 0 blobs unreadable\./);
});

test('isPointer wants the exact version line, an oid line, a size line and a small blob', () => {
  assert.equal(isPointer(Buffer.from(POINTER)), true);
  assert.equal(isPointer(Buffer.from(POINTER.replace(/\n/g, '\r\n'))), true);
  assert.equal(isPointer(Buffer.from(VERSION)), false);
  assert.equal(isPointer(Buffer.from(`${VERSION}size 1\n`)), false);
  assert.equal(isPointer(Buffer.from(`${VERSION}oid sha256:abc\nsize 1\n`)), false);
  assert.equal(isPointer(Buffer.from(` ${POINTER}`)), false);
  assert.equal(isPointer(Buffer.from(POINTER + 'x'.repeat(1024))), false);
  assert.equal(isPointer(PNG), false);
});

test('a blob git cannot produce fails the check with the path named', () => {
  const { root, dir } = makeRepo();
  fs.writeFileSync(path.join(dir, 'sample.jpg'), POINTER);
  commitAll(root, 'add pointer');
  const oid = git(root, 'rev-parse', 'HEAD:skills/ads/capabilities/mock/assets/sample.jpg');
  fs.unlinkSync(path.join(root, '.git', 'objects', oid.slice(0, 2), oid.slice(2)));
  const res = run('check-lfs-pointers.js', root, []);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, new RegExp(`sample\\.jpg: blob ${oid} is missing from the repository`));
  assert.match(res.out, /1 blobs unreadable\./);
});
