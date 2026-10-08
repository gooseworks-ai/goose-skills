'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { git, commitAll, run } = require('./atom-checks.helpers');

function writePart(root, id, version, code = 'export async function run() { return {}; }\n') {
  const dir = path.join(root, 'parts', id, version);
  fs.mkdirSync(dir, { recursive: true });
  const manifest = {
    interface: 1,
    id,
    version,
    kind: 'compose',
    kit: '>=1.0.0',
    needs: { ffmpeg: true, network: false, models: [] },
    cost: { basis: 'free' },
    determinism: 'pure',
    files: ['part.mjs'],
  };
  fs.writeFileSync(path.join(dir, 'part.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, 'part.mjs'), code);
}

/** A repo with clip-join@1.0.0 published and indexed on the base commit. */
function makePartsRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-parts-'));
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 'fixture@example.com');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'commit.gpgsign', 'false');
  writePart(root, 'clip-join', '1.0.0');
  fs.mkdirSync(path.join(root, 'parts', 'clip-join', 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'parts', 'clip-join', 'src', 'join.mjs'), '// v1\n');
  fs.writeFileSync(path.join(root, 'parts', 'withdrawn.json'), '[]\n');
  assert.equal(run('build-parts-index.js', root, []).code, 0);
  commitAll(root, 'base');
  return { root, base: git(root, 'rev-parse', 'HEAD') };
}

test('a published part version is frozen', () => {
  const { root, base } = makePartsRepo();
  fs.writeFileSync(path.join(root, 'parts', 'clip-join', '1.0.0', 'part.mjs'), 'export async function run() { return { changed: true }; }\n');
  run('build-parts-index.js', root, []);
  commitAll(root);
  const res = run('check-parts.js', root, ['--base', base]);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /clip-join@1\.0\.0 is published and frozen/);
});

test('a source change needs a new version folder', () => {
  const { root, base } = makePartsRepo();
  fs.writeFileSync(path.join(root, 'parts', 'clip-join', 'src', 'join.mjs'), '// v2\n');
  commitAll(root);
  const without = run('check-parts.js', root, ['--base', base]);
  assert.equal(without.code, 1, without.out);
  assert.match(without.out, /parts\/clip-join\/src changed without a new version folder/);

  writePart(root, 'clip-join', '1.1.0', 'export async function run() { return { v: 2 }; }\n');
  run('build-parts-index.js', root, []);
  commitAll(root);
  const withNew = run('check-parts.js', root, ['--base', base]);
  assert.equal(withNew.code, 0, withNew.out);
});

test('a stale index or a withdrawn version that was never published fails', () => {
  const { root } = makePartsRepo();
  writePart(root, 'clip-join', '1.0.1');
  const stale = run('check-parts.js', root, []);
  assert.equal(stale.code, 1, stale.out);
  assert.match(stale.out, /parts\/index\.json is out of date/);

  run('build-parts-index.js', root, []);
  fs.writeFileSync(
    path.join(root, 'parts', 'withdrawn.json'),
    JSON.stringify([{ id: 'clip-join', version: '9.0.0', reason: 'breaks captions' }]),
  );
  const unknown = run('check-parts.js', root, []);
  assert.equal(unknown.code, 1, unknown.out);
  assert.match(unknown.out, /clip-join@9\.0\.0 is not a published version/);
});

test('a part that imports or carries the billing helper fails', () => {
  const { root, base } = makePartsRepo();
  const src = path.join(root, 'parts', 'clip-join', 'src', 'join.mjs');
  fs.writeFileSync(src, "import { falGenerate } from '../../../skills/ads/capabilities/media-proxy/media_proxy.mjs';\n");
  writePart(root, 'clip-join', '1.1.0');
  run('build-parts-index.js', root, []);
  commitAll(root);
  const imported = run('check-parts.js', root, ['--base', base]);
  assert.equal(imported.code, 1, imported.out);
  assert.match(imported.out, /part\.no_billing_helper: parts\/clip-join\/src\/join\.mjs:1 uses the billing helper/);

  fs.writeFileSync(src, '// v2\n');
  fs.writeFileSync(path.join(root, 'parts', 'clip-join', 'src', 'media_proxy.py'), 'def fal_generate(): pass\n');
  const copied = run('check-parts.js', root, []);
  assert.equal(copied.code, 1, copied.out);
  assert.match(copied.out, /part\.no_billing_helper: parts\/clip-join\/src\/media_proxy\.py is a copy/);
});

