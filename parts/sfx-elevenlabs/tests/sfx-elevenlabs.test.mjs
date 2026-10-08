import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadPart, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { sample } from './fixture.mjs';

const { dir, mod } = await loadPart('sfx-elevenlabs', '1.0.0');
const ffmpeg = await hasFfmpeg();

test('orders one effect per entry at its fixed length and cuts each to it', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(sample.inputs(), ctx);
  assert.deepEqual(
    orders.map((o) => [o.piece, o.path, o.body]),
    [
      ['sfx-whoosh', '/v1/sound-generation', { text: 'a quick soft whoosh', duration_seconds: 1, model_id: 'eleven_text_to_sound_v2' }],
      ['sfx-2', '/v1/sound-generation', { text: 'a bright pop', duration_seconds: 0.5, model_id: 'eleven_text_to_sound_v2', prompt_influence: 0.6 }],
    ],
  );
  for (const fx of out.effects) {
    const info = await probe(fx.audio.path);
    assert.ok(info.duration_s <= fx.seconds + 0.06, `${fx.id} runs ${info.duration_s}s, asked ${fx.seconds}s`);
  }
});
