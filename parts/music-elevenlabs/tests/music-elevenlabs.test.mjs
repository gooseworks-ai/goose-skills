import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadPart, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { sample } from './fixture.mjs';

const { dir, mod } = await loadPart('music-elevenlabs', '1.0.0');
const ffmpeg = await hasFfmpeg();

test("orders one bed of the style's length from its brief and the plan's mood", { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ ...sample.inputs(), trim_intro_s: 1 }, ctx);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].path, '/v1/music');
  assert.deepEqual(orders[0].body, {
    prompt: 'Instrumental bed for a calm browse, no vocals. Mood: warm lofi.',
    music_length_ms: 6000,
    force_instrumental: true,
    model_id: 'music_v1',
  });
  const info = await probe(out.audio.path);
  assert.ok(Math.abs(info.duration_s - 5) < 0.1, `bed is ${info.duration_s}s after a 1s intro trim`);
});

test('a plan with no mood gets no bed and orders nothing', async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  assert.deepEqual(await mod.run({ ...sample.inputs(), mood: null }, ctx), {});
  assert.equal(orders.length, 0);
});
