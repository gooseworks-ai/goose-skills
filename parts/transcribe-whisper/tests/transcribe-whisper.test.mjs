import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadNewest, makeCtx, run } from '../../_tools/kit-harness.mjs';
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

test('the speech goes to Whisper as a 16 kHz mono WAV file (a type the line hosts)', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  let sent;
  const { ctx, orders } = makeCtx({
    partDir: dir,
    line: async (order) => {
      // Probe what would be uploaded while it is still in the step's tmp folder.
      const { stdout } = await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', order.body.audio_url.path]);
      sent = JSON.parse(stdout).streams.find((s) => s.codec_type === 'audio');
      return sample.line();
    },
  });
  assert.equal(dir.split(/[\\/]/).pop(), '1.1.1', 'the newest version is under test');
  await mod.run(await sample.inputs(ctx.workDir), ctx);
  assert.equal(orders.length, 1);
  const ref = orders[0].body.audio_url;
  assert.equal(ref.kind, 'file');
  assert.equal(ref.media, 'audio');
  assert.equal(ref.mime, 'audio/wav');
  assert.match(ref.path, /\.wav$/);
  assert.ok(ref.duration_s > 4.5 && ref.duration_s < 5.5, `the whole cut's sound (${ref.duration_s} s)`);
  assert.equal(sent.codec_name, 'pcm_s16le');
  assert.equal(Number(sent.sample_rate), 16000);
  assert.equal(sent.channels, 1);
  assert.deepEqual(Object.keys(orders[0].body).sort(), ['audio_url', 'chunk_level', 'language', 'task'], 'nothing else in the request changes');
});

test('a line the transcript does not match still gets word timings, so captions never transcribe again', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: async () => ({ json: { chunks: [{ text: 'mumble', timestamp: [0.4, 0.9] }, { text: 'grumble', timestamp: [1.0, 1.6] }] }, files: {}, reused: false }) });
  const inputs = await sample.inputs(ctx.workDir);
  const out = await mod.run({ ...inputs, scenes: [{ id: 's1', line: 'Nothing like what was said here.' }] }, ctx);
  assert.equal(orders.length, 1);
  const [entry] = out.timeline.speech;
  assert.deepEqual(entry.words.map((w) => w.text), ['Nothing', 'like', 'what', 'was', 'said', 'here.']);
  assert.ok(entry.words.every((w, i) => w.end_s > w.start_s && (i === 0 || w.start_s >= entry.words[i - 1].end_s - 1e-9)), JSON.stringify(entry.words));
  assert.ok(Math.abs(entry.words[0].start_s - 0.4) < 1e-6 && Math.abs(entry.words.at(-1).end_s - 1.6) < 1e-6, 'spread across what was heard');
  // The captions layer uses these timings and orders nothing.
  const { loadNewest: newest, browserMissing, layerInputsFor } = await import('../../_tools/kit-harness.mjs');
  if (browserMissing()) return;
  const cap = await newest('captions-layer');
  const c = makeCtx({ partDir: cap.dir, line: () => assert.fail('the captions layer must not transcribe again') });
  const li = await layerInputsFor(inputs.video, { expect: { speech: 'on_camera', captions: true }, timeline: out.timeline });
  await cap.mod.run(li, c.ctx);
  assert.equal(c.orders.length, 0);
});
