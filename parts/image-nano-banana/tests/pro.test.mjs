// 1.3.0: Nano Banana Pro. A run names one model family; Pro sends its resolution with every piece.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hasFfmpeg, loadNewest, loadPart, makeCtx } from '../../_tools/kit-harness.mjs';
import { pngLine, productsInputs, sample, scenesInputs } from './fixture.mjs';

const { dir, mod, manifest } = await loadNewest('image-nano-banana');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const PRO = 'fal-ai/nano-banana-pro';
const PRO_EDIT = 'fal-ai/nano-banana-pro/edit';

test('the newest version is 1.3.0 and declares both Pro paths', () => {
  assert.equal(manifest.version, '1.3.0');
  const models = manifest.needs.models.map((m) => m.model);
  for (const m of ['fal-ai/nano-banana', 'fal-ai/nano-banana/edit', PRO, PRO_EDIT]) assert.ok(models.includes(m), m);
  assert.deepEqual(manifest.inputs.properties.resolution.enum, ['1K', '2K']);
});

test('scenes mode on Pro: anchors and stills go to Pro paths, each with the resolution', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-pro-'));
  const inputs = await scenesInputs(work, { model: PRO_EDIT, resolution: '2K' });
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'step'), line: pngLine });
  await mod.run(inputs, ctx);
  assert.ok(orders.length >= 3);
  for (const o of orders) {
    assert.ok(o.path === PRO || o.path === PRO_EDIT, `${o.piece} went to ${o.path}`);
    assert.equal(o.body.resolution, '2K', o.piece);
    assert.equal(o.path === PRO_EDIT, Array.isArray(o.body.image_urls) && o.body.image_urls.length > 0, `${o.piece}: /edit exactly when it sends references`);
  }
});

test('a scene with no references on Pro is drawn by the Pro prompt-only model, never the base one', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-pro-'));
  const inputs = await scenesInputs(work, { model: PRO_EDIT, resolution: '1K' });
  // The Cutaway rule sends no references.
  inputs.scenes[1].picture = 'Cutaway: the street outside';
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'step'), line: pngLine });
  await mod.run(inputs, ctx);
  const cut = orders.find((o) => o.piece === 'image-s2');
  assert.equal(cut.path, PRO);
  assert.equal(cut.body.image_urls, undefined);
  assert.equal(cut.body.resolution, '1K');
});

test('products and images mode on Pro use the Pro edit path', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-pro-'));
  const p = makeCtx({ partDir: dir, workDir: join(work, 'p'), line: pngLine });
  await mod.run(await productsInputs(work, { model: PRO_EDIT, resolution: '2K', kinds: ['snap'] }), p.ctx);
  assert.ok(p.orders.length === 3 && p.orders.every((o) => o.path === PRO_EDIT && o.body.resolution === '2K'));
  const i = makeCtx({ partDir: dir, workDir: join(work, 'i'), line: sample.line });
  await mod.run({ ...(await sample.inputs(work)), model: PRO_EDIT, resolution: '2K' }, i.ctx);
  assert.ok(i.orders.length === 2 && i.orders.every((o) => o.path === PRO_EDIT && o.body.resolution === '2K'));
});

test('without Pro nothing changes: base paths, no resolution in the body', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-pro-'));
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'step'), line: pngLine });
  await mod.run(await scenesInputs(work), ctx);
  for (const o of orders) {
    assert.ok(o.path === 'fal-ai/nano-banana' || o.path === 'fal-ai/nano-banana/edit', o.path);
    assert.equal('resolution' in o.body, false);
  }
});

test('resolution on the base model is refused before anything is ordered', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-pro-'));
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'step'), line: pngLine });
  await assert.rejects(mod.run(await scenesInputs(work, { resolution: '2K' }), ctx), (e) => e.code === 'bad_input' && /resolution works only with/.test(e.message));
  assert.equal(orders.length, 0);
});

test('1.2.3 is unchanged: it refuses the Pro model', { skip }, async () => {
  const old = await loadPart('image-nano-banana', '1.2.3');
  const work = mkdtempSync(join(tmpdir(), 'nb-pro-'));
  const { ctx, orders } = makeCtx({ partDir: old.dir, workDir: join(work, 'step'), line: pngLine });
  await assert.rejects(old.mod.run(await scenesInputs(work, { model: PRO_EDIT }), ctx), (e) => e.code === 'bad_input');
  assert.equal(orders.length, 0);
});

test('scene_stills false draws only the cast portraits: scenes come back without a picture', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-pro-'));
  const inputs = await scenesInputs(work, { model: PRO_EDIT, resolution: '2K', scene_stills: false });
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'step'), line: pngLine });
  const out = await mod.run(inputs, ctx);
  assert.ok(orders.length >= 1);
  assert.ok(orders.every((o) => o.piece.startsWith('anchor-')), orders.map((o) => o.piece).join(' '));
  assert.equal(out.images.length, 0);
  assert.ok(out.scenes.every((s, i) => s.image === inputs.scenes[i].image));
  assert.ok(out.cast.some((m) => m.image && m.image.path));
});

test('scene_stills false without anchor cast is refused before anything is ordered', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-pro-'));
  const inputs = await scenesInputs(work, { model: PRO_EDIT, scene_stills: false, anchor: 'none' });
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'step'), line: pngLine });
  await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && /needs anchor cast/.test(e.message));
  assert.equal(orders.length, 0);
});
