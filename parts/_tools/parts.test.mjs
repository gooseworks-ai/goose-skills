// Rules every published part keeps: a valid manifest, the part lint, input
// refusal, paid pieces only for listed models, bundles built from source, and
// index.json / layers.json / withdrawn.json in step with the folders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { kitSchemaErrors } from '../_lib/schema.mjs';
import { bundlePart, newestVersions } from './bundle.mjs';
import { buildIndex, versionFolders } from './index.mjs';
import { hasFfmpeg, makeCtx, orderedModel, PARTS_ROOT } from './kit-harness.mjs';
import { lintParts, scanSource } from './lint.mjs';
import { manifestText } from './manifest.mjs';

const schema = JSON.parse(readFileSync(join(PARTS_ROOT, '_contract', 'part-manifest.schema.json'), 'utf8'));
const folders = versionFolders();
const manifestOf = (f) => JSON.parse(readFileSync(join(f.dir, 'part.json'), 'utf8'));

test('there are published parts to check', () => {
  assert.ok(folders.length > 0);
});

for (const f of folders) {
  const manifest = manifestOf(f);

  test(`${f.id}@${f.version}: part.json fits the manifest schema`, () => {
    assert.deepEqual(kitSchemaErrors(schema, manifest, 'part.json'), []);
  });

  test(`${f.id}@${f.version}: part.mjs exports run and refuses inputs outside its schema`, async () => {
    const mod = await import(pathToFileURL(join(f.dir, 'part.mjs')).href);
    assert.equal(typeof mod.run, 'function');
    const { ctx, orders } = makeCtx({ partDir: f.dir, line: () => assert.fail('nothing may be ordered for a refused input'), browser: null });
    await assert.rejects(mod.run({ not_an_input: true }, ctx), (e) => e.code === 'bad_input', 'an unknown field is refused');
    await assert.rejects(mod.run({}, ctx), (e) => e.code === 'bad_input', 'a missing required input is refused');
    assert.equal(orders.length, 0);
  });

  test(`${f.id}@${f.version}: free parts list no models; paid parts list each model they order`, async () => {
    const models = manifest.needs.models;
    if (!models.length) {
      assert.equal(manifest.needs.network, false);
      assert.equal(manifest.cost.basis, 'free');
      return;
    }
    const fixture = join(PARTS_ROOT, f.id, 'tests', 'fixture.mjs');
    assert.ok(existsSync(fixture), `${f.id} needs tests/fixture.mjs with a sample run`);
    if (!(await hasFfmpeg())) return;
    const { sample } = await import(pathToFileURL(fixture).href);
    const { ctx, orders } = makeCtx({ partDir: f.dir, line: sample.line });
    await mod_run(f, await sample.inputs(ctx.workDir), ctx);
    assert.ok(orders.length > 0, 'the sample run orders at least one piece');
    const listed = new Set(models.map((m) => `${m.provider} ${m.model}`));
    for (const o of orders) {
      assert.ok(listed.has(`${o.provider} ${orderedModel(o)}`), `${o.piece} orders ${o.provider} ${orderedModel(o)}, which needs.models does not list`);
      assert.match(o.piece, /^[a-z0-9][a-z0-9_-]{0,47}$/);
    }
  });
}

async function mod_run(f, inputs, ctx) {
  const mod = await import(pathToFileURL(join(f.dir, 'part.mjs')).href);
  return mod.run(inputs, ctx);
}

test('the part lint finds nothing in parts/', () => {
  assert.deepEqual(lintParts(), []);
});

test('the newest version of every part is the build of its source', () => {
  for (const p of newestVersions()) assert.equal(readFileSync(p.out, 'utf8'), bundlePart(p.entry), `${p.id}@${p.version}`);
});

test('a part with src/manifest.mjs publishes exactly that manifest in its newest version', async () => {
  for (const p of newestVersions()) {
    const want = await manifestText(p.id);
    if (want) assert.equal(readFileSync(join(PARTS_ROOT, p.id, p.version, 'part.json'), 'utf8'), want, `${p.id}@${p.version}`);
  }
});

test('index.json lists every published version with its file hashes and models', () => {
  const index = JSON.parse(readFileSync(join(PARTS_ROOT, 'index.json'), 'utf8'));
  assert.deepEqual(index, buildIndex());
  assert.deepEqual(Object.keys(index), ['interface', 'parts']);
  for (const e of index.parts) {
    for (const key of ['id', 'version', 'kind', 'kit', 'files', 'models']) assert.ok(key in e, `${e.id}@${e.version} has ${key}`);
    assert.deepEqual(e.models, JSON.parse(readFileSync(join(PARTS_ROOT, e.id, e.version, 'part.json'), 'utf8')).needs.models);
  }
});

test('the lint catches a part that calls fetch(), a child process, the environment or the clock', () => {
  const root = mkdtempSync(join(tmpdir(), 'parts-lint-'));
  try {
    cpSync(join(PARTS_ROOT, '_contract'), join(root, '_contract'), { recursive: true });
    const src = folders[0];
    cpSync(src.dir, join(root, src.id, src.version), { recursive: true });
    writeFileSync(join(root, 'index.json'), JSON.stringify(buildIndex(root)));
    const clean = lintParts(root).filter((x) => !['layers', 'withdrawn'].includes(x.rule));
    assert.deepEqual(clean, [], 'a copied real part is clean');
    const entry = join(root, src.id, src.version, 'part.mjs');
    const original = readFileSync(entry, 'utf8');
    const cases = [
      ['network', 'const r = await fetch("https://api.example.com/x");'],
      ['modules', "import { spawn } from 'node:child_process';"],
      ['environment', 'const key = process.env.FAL_KEY;'],
      ['clock', 'const t = Date.now();'],
      ['random', 'const n = Math.random();'],
      ['system-fonts', 'const f = "/System/Library/Fonts/Helvetica.ttc";'],
    ];
    for (const [rule, line] of cases) {
      writeFileSync(entry, `${line}\n${original}`);
      const rules = lintParts(root).map((x) => x.rule);
      assert.ok(rules.includes(rule), `${rule} is caught for: ${line}`);
    }
    writeFileSync(entry, original);
    writeFileSync(join(root, src.id, src.version, 'helper.py'), 'print(1)\n');
    assert.ok(lintParts(root).some((x) => x.rule === 'javascript-only'), 'a Python file is caught');
    assert.ok(lintParts(root).some((x) => x.rule === 'files'), 'a file missing from part.json files is caught');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the source scan ignores rules that are only described in comments', () => {
  assert.deepEqual(scanSource('// never call fetch( here\n/* process.env */\nconst a = 1;\n'), []);
  assert.equal(scanSource('const a = fetch(url);').length, 1);
  assert.deepEqual(scanSource("define(window, 'fetch', function fetch(input) { return Promise.reject(new TypeError('no')); });"), [], 'a guard that refuses fetch is not a fetch');
});
