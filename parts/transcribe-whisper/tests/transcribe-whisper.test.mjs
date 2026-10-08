import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadNewest, makeCtx } from '../../_tools/kit-harness.mjs';
import { sample } from './fixture.mjs';

const { dir, mod } = await loadNewest('transcribe-whisper');
const ffmpeg = await hasFfmpeg();

test('each approved line keeps its written words and carries what was heard for it', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const inputs = await sample.inputs(ctx.workDir);
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].path, 'fal-ai/whisper');
  assert.equal(orders[0].body.audio_url.kind, 'file');
  assert.equal(out.video, inputs.video, 'the cut passes through');
  assert.deepEqual(out.timeline.speech.map((s) => [s.scene_id, s.text, s.spoken]), [
    ['s1', 'Meet two hundred happy customers.', 'Meet 200 happy customers.'],
    ['s3', 'Try it for thirty days.', 'Try it for 13 days.'],
  ]);
  assert.deepEqual(out.timeline.speech[0].words.map((w) => w.text), ['Meet', 'two', 'hundred', 'happy', 'customers.'], 'captions keep the written words');
  assert.ok(out.timeline.speech[0].words[1].start_s >= 0.5 && out.timeline.speech[0].words[2].end_s <= 1.3, 'a word written differently sits between its neighbours');
  assert.equal(out.transcript, 'Meet 200 happy customers. Try it for 13 days.');
});
