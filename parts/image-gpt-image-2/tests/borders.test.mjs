// image-gpt-image-2 1.1.2: scenes mode crops or redraws a still with a border, trims product photos before
// sending them, and keeps the strict product evidence bound to the still it hands on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadNewest, makeCtx, probe, run } from '../../_tools/kit-harness.mjs';
import { falAnswer, scenesInputs, writeTemplate } from './fixture.mjs';
import { kitRequireProductFrame } from '../../_lib/product-tag-contract.mjs';

const { dir, mod } = await loadNewest('image-gpt-image-2');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const work = () => mkdtempSync(join(tmpdir(), 'gi-borders-'));

/** Stills with black bands `pad` px high (216x384); redo pieces come back clean. */
function bandedLine(pad) {
  return async (order, ctx) => {
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    const p = order.piece.startsWith('redo') ? 0 : pad;
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `testsrc2=size=216x${384 - 2 * p}:duration=1`, '-vf', p ? `pad=216:384:0:${p}:black` : 'null', '-frames:v', '1', '-c:v', 'png', path]);
    return { ...falAnswer(name), files: { [name]: await fileRef(path, 'image') }, reused: false };
  };
}

async function productScene(w, extra = {}) {
  const inputs = await scenesInputs(w, {});
  const padded = join(w, 'padded.png');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=200x300:duration=1', '-vf', 'pad=600:600:200:150:white', '-frames:v', '1', padded]);
  inputs.products = [{ ...inputs.products[0], images: [await fileRef(padded, 'image')] }];
  inputs.scenes = [{ id: 's4', picture: 'Product: the product on a tabletop.', extra: { shot: 'Product' } }];
  inputs.skip_last = 0;
  inputs.anchor = 'none';
  inputs.template = await writeTemplate(w, { version: 1, scene: '{product.name}: {picture}', refs: ['product'], by_tag: { Product: { scene: '{product.name}: {picture}', refs: ['product'] } } });
  return { ...inputs, ...extra };
}

test('a letterboxed still is drawn once more with full-bleed words; the product photo goes out trimmed', { skip }, async () => {
  const w = work();
  const inputs = await productScene(w);
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: bandedLine(40) });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(orders.map((o) => o.piece), ['image-s4', 'redo-s4']);
  assert.match(orders[1].body.prompt, /Full-bleed photograph/);
  const sent = orders[0].body.image_urls[0];
  assert.notEqual(sent.sha256, inputs.products[0].images[0].sha256);
  const info = await probe(sent.path);
  assert.ok(Math.abs(info.width - 200) <= 8 && Math.abs(info.height - 300) <= 8, `${info.width}x${info.height}`);
  assert.equal((await probe(out.images[0].image.path)).height, 384);
});

test('with strict product refs the exact photo is sent and the evidence binds the still handed on', { skip }, async () => {
  const w = work();
  const inputs = await productScene(w, { require_scene_tags: true, require_product_refs: true });
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: bandedLine(12) });
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 1, 'thin bands are cropped, not redrawn');
  assert.equal(orders[0].body.image_urls[0].sha256, inputs.products[0].images[0].sha256, 'not trimmed: the evidence names this photo');
  const still = out.images[0].image;
  assert.ok(Math.abs((await probe(still.path)).height - 360) <= 4, 'cropped');
  kitRequireProductFrame('s4', still, [{ id: inputs.products[0].id, sha256: inputs.products[0].images[0].sha256 }], out.product_reference_evidence);
});

test('borders keep draws once and keeps the still; borders is refused outside scenes mode', { skip }, async () => {
  const w = work();
  const inputs = await productScene(w, { borders: 'keep' });
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: bandedLine(40) });
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].body.image_urls[0].sha256, inputs.products[0].images[0].sha256);
  assert.equal((await probe(out.images[0].image.path)).height, 384);
  const c = makeCtx({ partDir: dir, line: bandedLine(0) });
  await assert.rejects(mod.run({ images: [{ prompt: 'a cup' }], borders: 'fix' }, c.ctx), (e) => e.code === 'bad_input' && /borders/.test(e.message));
  assert.equal(c.orders.length, 0);
});
