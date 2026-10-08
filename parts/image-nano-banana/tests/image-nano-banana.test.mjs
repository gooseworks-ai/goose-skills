import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hasFfmpeg, loadPart, makeCtx } from '../../_tools/kit-harness.mjs';
import { sample } from './fixture.mjs';

const { dir, mod } = await loadPart('image-nano-banana', '1.0.0');
const ffmpeg = await hasFfmpeg();
const PNG = '89504e470d0a1a0a';

test('edits each still from its reference files and always hands back PNG', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const inputs = await sample.inputs(work);
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 2);
  for (const o of orders) {
    assert.equal(o.provider, 'fal');
    assert.equal(o.path, '/fal-ai/nano-banana/edit');
    assert.equal(o.body.image_urls[0].kind, 'file', 'references go to the core as files, never links');
    assert.equal(o.body.aspect_ratio, '9:16');
  }
  for (const img of out.images) assert.equal(readFileSync(img.image.path).subarray(0, 8).toString('hex'), PNG);
});

test('refuses references on the prompt-only model and none on the edit model, before ordering', async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const ref = { kind: 'file', path: join(work, 'x.png'), sha256: 'a'.repeat(64), bytes: 10, media: 'image', mime: 'image/png' };
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run({ model: 'fal-ai/nano-banana', images: [{ prompt: 'x', references: [ref] }] }, ctx), (e) => e.code === 'bad_input');
  await assert.rejects(mod.run({ model: 'fal-ai/nano-banana/edit', images: [{ prompt: 'x' }] }, ctx), (e) => e.code === 'bad_input');
  assert.equal(orders.length, 0);
});
