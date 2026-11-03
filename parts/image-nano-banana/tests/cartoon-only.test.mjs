// image-nano-banana 2.0.0: cartoons and illustrated looks only. Real people and real products use
// image-gpt-image-2 edit; packaging comes from the real photo through overlay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hasFfmpeg, loadNewest, makeCtx } from '../../_tools/kit-harness.mjs';
import { productsInputs, sample, scenesInputs } from './fixture.mjs';

const { dir, mod, manifest } = await loadNewest('image-nano-banana');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const work = () => mkdtempSync(join(tmpdir(), 'nb-'));

test('2.0.0 needs subject: cartoon, refused before anything is ordered', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const inputs = await sample.inputs(work(), manifest.version);
  const { subject, ...without } = inputs;
  assert.equal(subject, 'cartoon');
  await assert.rejects(mod.run(without, ctx), (e) => e.code === 'bad_input');
  await assert.rejects(mod.run({ ...inputs, subject: 'real_person' }, ctx), (e) => e.code === 'bad_input');
  assert.equal(orders.length, 0);
  const ok = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(inputs, ok.ctx);
  assert.equal(out.images.length, 2, 'a declared cartoon still runs');
});

test('products mode is withdrawn: real product photos are never redrawn', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run({ ...(await productsInputs(work())), subject: 'cartoon' }, ctx), (e) => e.code === 'bad_input' && /image-gpt-image-2/.test(e.message));
  assert.equal(orders.length, 0);
});

test('a scene that would send a real product photo as a reference is refused before ordering', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run({ ...(await scenesInputs(work())), subject: 'cartoon' }, ctx), (e) => e.code === 'bad_input' && /real product photo/.test(e.message));
  assert.equal(orders.length, 0);
});

test('the manifest says what Nano Banana is for', () => {
  assert.match(manifest.summary, /Never for real people or real products/);
  assert.deepEqual([...manifest.inputs.required].sort(), ['model', 'subject']);
});
