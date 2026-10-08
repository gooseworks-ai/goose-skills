import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadPart, makeCtx } from '../../_tools/kit-harness.mjs';
import { sample } from './fixture.mjs';

const { dir, mod } = await loadPart('video-seedance-2', '1.0.0');
const ffmpeg = await hasFfmpeg();

test("sends the atom's payload with an integer duration and the references as files", { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(await sample.inputs(ctx.workDir), ctx);
  assert.equal(orders.length, 1);
  const { path, body } = orders[0];
  assert.equal(path, 'bytedance/seedance-2.0/reference-to-video');
  assert.deepEqual(Object.keys(body).sort(), ['aspect_ratio', 'duration', 'generate_audio', 'image_urls', 'prompt', 'resolution', 'seed']);
  assert.equal(body.duration, 5);
  assert.ok(Number.isInteger(body.duration), 'a string duration is refused by the model');
  assert.equal(body.image_urls[0].kind, 'file');
  assert.equal(body.generate_audio, true);
  assert.equal(out.clips[0].id, 'hook');
});

test('a clip that should have native audio and comes back silent fails', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: (o, c) => sample.line({ ...o, body: { ...o.body, generate_audio: false } }, c) });
  await assert.rejects(mod.run(await sample.inputs(ctx.workDir), ctx), (e) => e.code === 'provider_failed');
});
