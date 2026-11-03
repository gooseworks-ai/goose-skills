import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadNewest, makeCtx, hasFfmpeg, fileRef } from '../../_tools/kit-harness.mjs';
import { makeImage, pngLine, scenesInputs, writeTemplate } from './fixture.mjs';
import { kitRequireProductFrame } from '../../_lib/product-tag-contract.mjs';
import { clipLine } from '../../video-veo-3/tests/fixture.mjs';

const { dir, mod } = await loadNewest('image-gpt-image-2');
const veo = await loadNewest('video-veo-3');
const skip = !(await hasFfmpeg()) && 'ffmpeg unavailable';
const work = () => mkdtempSync(join(tmpdir(), 'product-tag-contract-'));
const tpl = { version: 1, scene: '{picture}', motion: '{picture}. The camera moves right.', refs: ['anchor'], by_tag: {
  'Look 1': { refs: ['anchor'] }, 'Hold 1': { refs: ['anchor', 'product'], motion: '{picture}. {product.name} turns in hand.' },
  Product: { scene: '{product.name}: {picture}', motion: '{picture}. {product.name} rotates.', refs: ['product'] }, Cutaway: { refs: [] },
} };

async function inputsFor(w, picture = 'Product: ECU rotates the product on a tabletop.') {
  const inputs = await scenesInputs(w, {});
  inputs.scenes = [{ id: 's4', picture, speaker: 'a', extra: { shot: 'Product' } }];
  inputs.skip_last = 0;
  inputs.template = await writeTemplate(w, tpl);
  inputs.require_scene_tags = true;
  inputs.require_product_refs = true;
  return inputs;
}

test('guarded GPT actual request includes the photo, evidence binds its returned still, and Veo uses that exact frame', { skip }, async () => {
  const w = work();
  const inputs = await inputsFor(w);
  const producer = makeCtx({ partDir: dir, workDir: join(w, 'stills'), line: pngLine });
  const out = await mod.run(inputs, producer.ctx);
  assert.equal(producer.orders.length, 1);
  assert.equal(producer.orders[0].path, 'openai/gpt-image-2/edit');
  assert.deepEqual(producer.orders[0].body.image_urls.map((image) => image.sha256), [inputs.products[0].images[0].sha256]);
  const required = [{ id: inputs.products[0].id, sha256: inputs.products[0].images[0].sha256 }];
  kitRequireProductFrame('s4', out.images[0].image, required, out.product_reference_evidence);
  const consumer = makeCtx({ partDir: veo.dir, workDir: join(w, 'clips'), line: clipLine });
  await veo.mod.run({ model: 'fal-ai/veo3.1/fast/image-to-video', mode: 'scenes', stills: out.images,
    scenes: inputs.scenes, products: inputs.products, template: inputs.template, seconds: 4,
    require_scene_tags: true, require_product_refs: true,
    product_reference_evidence: out.product_reference_evidence }, consumer.ctx);
  assert.equal(consumer.orders.length, 1);
  assert.equal(consumer.orders[0].body.image_url.sha256, out.images[0].image.sha256);
  assert.equal(consumer.orders[0].body.image_urls, undefined, 'no unsupported Veo reference-list field');
});

test('malformed or wrong product tags refuse the whole GPT step before any paid anchor/order', { skip }, async () => {
  for (const picture of ['Product ECU rotates the product.', 'Hold 1 MCU lifts the product.', 'Prdouct: ECU rotates the product.']) {
    const w = work();
    const inputs = await inputsFor(w, picture);
    const made = makeCtx({ partDir: dir, workDir: join(w, 'stills'), line: pngLine });
    await assert.rejects(mod.run(inputs, made.ctx), /colon|unknown picture tag/);
    assert.equal(made.orders.length, 0);
  }
  const w = work();
  const inputs = await inputsFor(w, 'Look 1: MCU lifts Morning Mist Green Tea beside her face.');
  inputs.scenes[0].extra.shot = 'Look 1';
  const made = makeCtx({ partDir: dir, workDir: join(w, 'stills'), line: pngLine });
  await assert.rejects(mod.run(inputs, made.ctx), /actual still request omits/);
  assert.equal(made.orders.length, 0);
});

test('Veo refuses missing, changed and misbound producer evidence before a provider order', { skip }, async () => {
  const w = work();
  const inputs = await inputsFor(w);
  const producer = makeCtx({ partDir: dir, workDir: join(w, 'stills'), line: pngLine });
  const out = await mod.run(inputs, producer.ctx);
  for (const evidence of [[], [{ ...out.product_reference_evidence[0], scene_id: 's7' }],
    [{ ...out.product_reference_evidence[0], request_image_sha256: ['f'.repeat(64)] }]]) {
    const consumer = makeCtx({ partDir: veo.dir, workDir: join(w, `clips-${Math.random()}`), line: clipLine });
    await assert.rejects(veo.mod.run({ model: 'fal-ai/veo3.1/fast/image-to-video', mode: 'scenes', stills: out.images,
      scenes: inputs.scenes, products: inputs.products, template: inputs.template, seconds: 4,
      require_scene_tags: true, require_product_refs: true, product_reference_evidence: evidence }, consumer.ctx), /evidence/);
    assert.equal(consumer.orders.length, 0);
  }
});


test('product reference capping refuses before generating missing cast anchors', { skip }, async () => {
  const w = work();
  const inputs = await inputsFor(w, 'Hold 1: Maya Theo Luna arrange P1 P2 P3 P4.');
  inputs.scenes[0].extra.shot = 'Hold 1';
  inputs.scenes[0].speaker = 'maya';
  inputs.cast = ['Maya', 'Theo', 'Luna'].map((name) => ({ key: name.toLowerCase(), name, look: 'an adult wearing a plain shirt' }));
  inputs.anchor = 'cast';
  inputs.multi_ref = 'list';
  inputs.products = [];
  for (let i = 1; i <= 4; i++) inputs.products.push({ id: `p${i}`, name: `P${i}`, images: [await fileRef(await makeImage(join(w, `p${i}.png`), `320x${240 + i * 2}`), 'image')] });
  inputs.style_refs = inputs.products.map((product) => product.images[0]);
  // Four style refs occupy the tail. This fifth distinct photo would give way.
  inputs.style_refs = Array.from({ length: 4 }, () => inputs.products[0].images[0]);
  const made = makeCtx({ partDir: dir, workDir: join(w, 'stills'), line: pngLine });
  await assert.rejects(mod.run(inputs, made.ctx), /actual still request omits/);
  assert.equal(made.orders.length, 0);
});
