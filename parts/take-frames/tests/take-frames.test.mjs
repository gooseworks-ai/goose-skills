// take-frames on a fake fal line (image-gpt-image-2's recorded GPT Image 2 edit contract): two paid
// pieces in order, the first drawn from the cast picture and the product photo, the last an edit of the
// first; the use scene's extra.after is the last frame's only change; refusals order nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadNewest, makeCtx } from '../../_tools/kit-harness.mjs';
import { REQUEST_FIELDS, REQUIRED, pngLine } from '../../image-gpt-image-2/tests/fixture.mjs';
import { inputsFor } from './fixture.mjs';
import { tfFill, tfUseScene } from '../src/part.mjs';

const { dir, mod } = await loadNewest('take-frames');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const work = () => mkdtempSync(join(tmpdir(), 'tf-'));


test('the use is the last scene with a use tag; placeholders fill, and one left over is an error', () => {
  const scenes = [{ id: 'a', extra: { shot: 'Use' } }, { id: 'b', picture: 'Selfie: smiles' }, { id: 'c', picture: 'USE: opens it' }];
  assert.equal(tfUseScene(scenes, ['use']).id, 'c');
  assert.equal(tfUseScene(scenes, ['hands']), null);
  assert.equal(tfFill('{name} holds {product.name}. {before} Then: {after}.', { name: 'Maya', 'product.name': 'Northleaf', before: '', after: 'open' }), 'Maya holds Northleaf. Then: open.');
  assert.throws(() => tfFill('{look} in {room}', { look: 'x' }), /does not fill: \{room\}/);
});

test('draws the first frame from the cast picture and product photo, then the last as an edit of the first', { skip }, async () => {
  const w = work();
  const inputs = await inputsFor(w);
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: pngLine });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(orders.map((o) => o.piece), ['frame-first', 'frame-last']);
  for (const o of orders) {
    assert.equal(o.path, 'openai/gpt-image-2/edit');
    for (const k of Object.keys(o.body)) assert.ok(REQUEST_FIELDS[o.path].includes(k), `fal accepts ${k}`);
    for (const k of REQUIRED[o.path]) assert.ok(o.body[k] !== undefined, `fal needs ${k}`);
    assert.deepEqual(o.body.image_size, { width: 1088, height: 1920 });
    assert.equal(o.body.quality, 'high');
  }
  const [first, last] = orders.map((o) => o.body);
  assert.deepEqual(first.image_urls, [inputs.cast[0].image, inputs.products[0].images[0]]);
  assert.equal(last.image_urls[0].path, out.first_frame.path, 'the last frame is an edit of the first');
  assert.deepEqual(last.image_urls[1], inputs.products[0].images[0], 'with the product photo again');
  assert.match(first.prompt, /a deep red knit sweater/);
  assert.match(first.prompt, /Northleaf Sizzle bottle/);
  assert.match(first.prompt, /bottom edge is no lower than the chin/);
  assert.match(first.prompt, /The lime green flip cap is closed\. The lips/);
  assert.match(last.prompt, /Only one change: the lime green flip cap is flipped open, the nozzle showing\. The product/);
  assert.doesNotMatch(first.prompt + last.prompt, /[{}]/);
  assert.deepEqual(out.frames.map((f) => f.id), ['first', 'last']);
  assert.equal(out.last_frame.path, out.frames[1].image.path);
});

test('a template replaces both prompts', { skip }, async () => {
  const w = work();
  const tpl = join(w, 'frames.prompt.json');
  writeFileSync(tpl, JSON.stringify({ first: '{name} holds {product.name} high.', last: 'Same photo; {after}.' }));
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: pngLine });
  await mod.run(await inputsFor(w, { template: await fileRef(tpl, 'json') }), ctx);
  assert.equal(orders[0].body.prompt, 'Maya holds Northleaf Sizzle bottle high.');
  assert.equal(orders[1].body.prompt, 'Same photo; the lime green flip cap is flipped open, the nozzle showing.');
});

test('refusals cost nothing: no use scene, no extra.after, no product photo, no cast picture, a bad template', { skip }, async () => {
  const w = work();
  const base = await inputsFor(w);
  const bad = join(w, 'bad.prompt.json');
  writeFileSync(bad, JSON.stringify({ first: 'x {room}', last: 'y' }));
  const cases = [
    [{ ...base, scenes: base.scenes.slice(0, 2) }, /no scene is tagged use/],
    [{ ...base, scenes: [...base.scenes.slice(0, 2), { id: 's2', extra: { shot: 'use' } }] }, /has no extra.after/],
    [{ ...base, products: [{ id: 'p', name: 'X', images: [] }] }, /no product has a photo/],
    [{ ...base, cast: [{ key: 'c1', image: null }] }, /no cast member has a picture/],
    [{ ...base, template: await fileRef(bad, 'json') }, /does not fill: \{room\}/],
  ];
  for (const [inputs, re] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    await assert.rejects(mod.run(inputs, ctx), (e) => /bad_input/.test(e.code || e.message) && re.test(e.message), String(re));
    assert.equal(orders.length, 0);
  }
});

test('the first frame is drawn in the take\'s own room when setting and settings are given', { skip }, async () => {
  const w = work();
  const looks = join(w, 'take.prompt.json');
  writeFileSync(looks, JSON.stringify({ version: 1, looks: { home: 'filmed at home in a lived-in, tidy kitchen, in bright direct sunlight from a big window.' } }));
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: pngLine });
  await mod.run(await inputsFor(w, { setting: 'home', settings: await fileRef(looks, 'json') }), ctx);
  assert.match(orders[0].body.prompt, /a deep red knit sweater\), filmed at home in a lived-in, tidy kitchen, in bright direct sunlight from a big window\. One hand/);
  assert.doesNotMatch(orders[0].body.prompt, /same room and light as that photo/);
  for (const [extra, re] of [[{ setting: 'home' }, /go together/], [{ setting: 'car', settings: await fileRef(looks, 'json') }, /no looks\.car/]]) {
    const c = makeCtx({ partDir: dir, line: pngLine });
    await assert.rejects(mod.run(await inputsFor(w, extra), c.ctx), (e) => re.test(e.message));
    assert.equal(c.orders.length, 0);
  }
});
