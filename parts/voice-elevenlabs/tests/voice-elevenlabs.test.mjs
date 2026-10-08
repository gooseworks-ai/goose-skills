import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadPart, makeCtx } from '../../_tools/kit-harness.mjs';
import { sample } from './fixture.mjs';

const { dir, mod } = await loadPart('voice-elevenlabs', '1.0.0');
const ffmpeg = await hasFfmpeg();

test('orders one timestamped line per spoken scene, with the brand pronunciation swapped in', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(sample.inputs(), ctx);
  assert.equal(orders.length, 2, 'the empty line is not paid for');
  assert.deepEqual(
    orders.map((o) => [o.provider, o.path, o.body]),
    [
      ['elevenlabs', '/v1/text-to-speech/dMyQqiVXTU80dDl2eNK8/with-timestamps', { text: 'Meet drink A G one today.', model_id: 'eleven_v3' }],
      ['elevenlabs', '/v1/text-to-speech/dMyQqiVXTU80dDl2eNK8/with-timestamps', { text: 'It tastes great.', model_id: 'eleven_v3' }],
    ],
  );
  assert.deepEqual(orders.map((o) => o.piece), ['line-s1', 'line-s3']);
  // Captions keep the written name: the swapped words map back to "Drinkag1".
  assert.deepEqual(out.speech[0].words.map((w) => w.text), ['Meet', 'Drinkag1', 'today.']);
  assert.equal(out.speech[0].spoken, 'Meet drink A G one today.');
  // The second line starts after the first line's length plus the default gap.
  const first = out.speech[0].end_s - out.speech[0].start_s;
  assert.ok(Math.abs(out.speech[1].start_s - (first + 0.25)) < 0.01, `second line at ${out.speech[1].start_s}`);
  assert.ok(Math.abs(out.seconds - out.speech[1].end_s) < 0.01);
  const words = out.speech.flatMap((s) => s.words);
  for (let i = 1; i < words.length; i++) assert.ok(words[i].start_s >= words[i - 1].start_s, 'word timings run forward');
});

test('refuses to go on when a line comes back without character timings', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({
    partDir: dir,
    line: async (order, c) => ({ ...(await sample.line(order, c)), json: { alignment: { characters: ['a'], character_start_times_seconds: [] } } }),
  });
  await assert.rejects(mod.run(sample.inputs(), ctx), (e) => e.code === 'provider_failed');
});

test('refuses a plan with no line to speak, before ordering anything', async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run({ scenes: [{ id: 'a', line: '   ' }], voice_id: 'abc' }, ctx), (e) => e.code === 'bad_input');
  assert.equal(orders.length, 0);
});
