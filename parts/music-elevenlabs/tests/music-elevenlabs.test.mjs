import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadPart, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { sample } from './fixture.mjs';

const { dir, mod } = await loadPart('music-elevenlabs', '1.0.0');
const ffmpeg = await hasFfmpeg();

test('orders one bed of the needed length and cuts it to the picture', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ ...sample.inputs(), trim_intro_s: 1 }, ctx);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].path, '/v1/music');
  assert.deepEqual(orders[0].body, { prompt: 'warm nylon guitar, relaxed lo-fi', music_length_ms: 7500, force_instrumental: true, model_id: 'music_v1' });
  const info = await probe(out.audio.path);
  assert.ok(Math.abs(info.duration_s - 6) < 0.1, `bed is ${info.duration_s}s`);
});

test('refuses a bed longer than the price allows, before ordering', async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run({ ...sample.inputs(), seconds: 15.6, max_seconds: 16 }, ctx), (e) => e.code === 'bad_input');
  assert.equal(orders.length, 0);
});
