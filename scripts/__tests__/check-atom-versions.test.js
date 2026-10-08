'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeRepo, commitAll, run, writeAtom } = require('./atom-checks.helpers');

const DIR = path.join('skills', 'ads', 'capabilities', 'clip-maker');

function setVersion(root, version) {
  fs.writeFileSync(path.join(root, DIR, 'skill.meta.json'), JSON.stringify({ slug: 'clip-maker', version }));
}

test('fails when an atom changes without raising its version', () => {
  const { root, base } = makeRepo({ 'clip-maker': {} });
  fs.appendFileSync(path.join(root, DIR, 'SKILL.md'), 'Keep the subject centred.\n');
  commitAll(root);
  const res = run('check-atom-versions.js', root, ['--base', base]);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /clip-maker: changed on this branch, so its version must go above 1\.0\.0/);
});

test('passes when the change raises the version', () => {
  const { root, base } = makeRepo({ 'clip-maker': {} });
  fs.appendFileSync(path.join(root, DIR, 'SKILL.md'), 'Keep the subject centred.\n');
  setVersion(root, '1.0.1');
  commitAll(root);
  const res = run('check-atom-versions.js', root, ['--base', base]);
  assert.equal(res.code, 0, res.out);
});

test('fails when a script changes and the version goes down', () => {
  const { root, base } = makeRepo({ 'clip-maker': { meta: { slug: 'clip-maker', version: '1.2.0' }, files: { 'scripts/run.py': 'print(1)\n' } } });
  fs.writeFileSync(path.join(root, DIR, 'scripts', 'run.py'), 'print(2)\n');
  setVersion(root, '1.1.9');
  commitAll(root);
  const res = run('check-atom-versions.js', root, ['--base', base]);
  assert.equal(res.code, 1, res.out);
});

test('a new atom needs a version; an untouched atom without one only warns', () => {
  const { root, base } = makeRepo({ 'old-atom': { meta: { slug: 'old-atom' } } });
  writeAtom(root, 'new-atom', { meta: { slug: 'new-atom' } });
  commitAll(root);
  const res = run('check-atom-versions.js', root, ['--base', base]);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /error .*new-atom: changed on this branch but has no version/);
  assert.match(res.out, /warning .*old-atom: no version in skill\.meta\.json yet/);
});

test('a version that is not semver fails', () => {
  const { root } = makeRepo({ 'clip-maker': { meta: { slug: 'clip-maker', version: 2 } } });
  const res = run('check-atom-versions.js', root, []);
  assert.equal(res.code, 1, res.out);
});
