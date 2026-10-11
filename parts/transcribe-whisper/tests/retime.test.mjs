// transcribe-whisper 1.1.0: `retime_scenes` sets the timeline's scene spans
// from each line's heard words (the old align_beats.py).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadPart, makeCtx, makeVideo } from '../../_tools/kit-harness.mjs';
import { retimeCloseChunks, retimeHeardShare, retimeSceneSpans } from '../src/retime.mjs';
import { kitHeardWords } from '../../_lib/heard.mjs';
import { recordedWhisper } from './recorded-reply.mjs';

const { dir, mod } = await loadPart('transcribe-whisper', '1.1.0');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const reply = (json) => async () => ({ json, files: {}, reused: false });

/** Spans tile 0 to the end with no gap and never run backwards. */
function assertTiles(scenes, duration) {
  assert.equal(scenes[0].start_s, 0);
  assert.ok(Math.abs(scenes.at(-1).end_s - duration) < 1e-9, `${scenes.at(-1).end_s} != ${duration}`);
  scenes.forEach((s, i) => {
    assert.ok(s.end_s >= s.start_s, JSON.stringify(s));
    if (i) assert.equal(s.start_s, scenes[i - 1].end_s, 'no gap between scenes');
  });
}

async function cut(workDir, seconds = 4) {
  return fileRef(await makeVideo(join(workDir, 'take.mp4'), seconds, { width: 360, height: 640, tone: 300 }), 'video');
}

test('fixture: the recorded fal reply re-times the scenes onto the heard words', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: async () => recordedWhisper });
  const video = await cut(ctx.workDir);
  const given = { duration_s: 4, width: 360, height: 640, fps: 30, scenes: [{ id: 'a', start_s: 0, end_s: 2 }, { id: 'c', start_s: 2, end_s: 3.5 }, { id: 'd', start_s: 3.5, end_s: 4 }], speech: [], end_card: { start_s: 3.5, end_s: 4 } };
  const out = await mod.run(
    {
      video,
      timeline: given,
      retime_scenes: true,
      scenes: [
        { id: 'a', line: 'Meet the jacket' },
        { id: 'c', line: 'that packs into its own pocket.' },
        { id: 'd', line: null },
      ],
    },
    ctx,
  );
  assert.equal(orders.length, 1);
  assert.equal(orders[0].path, 'fal-ai/whisper');
  assert.deepEqual(orders[0].body.chunk_level, 'word');
  const d = out.timeline.duration_s;
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['a', 'c', 'd']);
  assertTiles(out.timeline.scenes, d);
  // "jacket" ends at 0.88 and "that" starts at 0.88: the boundary sits there.
  assert.equal(out.timeline.scenes[0].end_s, 0.88);
  // The silent last scene follows a 0.45 s hold after "pocket." (2.5 s).
  assert.equal(out.timeline.scenes[1].end_s, 2.95);
  assert.deepEqual(out.timeline.end_card, given.end_card, 'the rest of the given timeline is kept');
  assert.deepEqual(out.timeline.speech.map((s) => [s.scene_id, s.spoken]), [
    ['a', 'Meet the jacket'],
    ['c', 'that packs into its own pocket.'],
  ]);
});

test('without retime_scenes the given scene spans are kept (1.0.1 behaviour)', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: async () => recordedWhisper });
  const video = await cut(ctx.workDir);
  const scenes = [{ id: 'a', start_s: 0, end_s: 2 }, { id: 'c', start_s: 2, end_s: 4 }];
  const out = await mod.run({ video, timeline: { duration_s: 4, width: 360, height: 640, fps: 30, scenes, speech: [] }, scenes: [{ id: 'a', line: 'Meet the jacket' }, { id: 'c', line: 'that packs into its own pocket.' }] }, ctx);
  assert.deepEqual(out.timeline.scenes, scenes);
});

test('null-line scenes: skipped for speech, given time when re-timed, and a scene with no id takes its position', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: async () => recordedWhisper });
  const video = await cut(ctx.workDir);
  const out = await mod.run(
    { video, retime_scenes: true, scenes: [{ line: null }, { id: 'b', line: 'Meet the jacket that packs' }, { id: 'c' }, { id: 'd', line: 'into its own pocket.' }] },
    ctx,
  );
  assert.deepEqual(out.timeline.speech.map((s) => s.scene_id), ['b', 'd']);
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['1', 'b', 'c', 'd']);
  assertTiles(out.timeline.scenes, out.timeline.duration_s);
});

test('refused before anything is ordered: retime_scenes with no line to place', async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: () => assert.fail('nothing may be ordered for a refused input') });
  writeFileSync(join(ctx.workDir, 'none.mp4'), 'not a cut');
  const video = await fileRef(join(ctx.workDir, 'none.mp4'), 'video');
  await assert.rejects(mod.run({ video, retime_scenes: true, scenes: [{ id: 'a', line: null }, { id: 'b', line: '  ' }] }, ctx), (e) => e.code === 'bad_input' && /retime_scenes/.test(e.message + (e.detail || '')));
  await assert.rejects(mod.run({ video, retime_scenes: true }, ctx), (e) => e.code === 'bad_input');
  await assert.rejects(mod.run({ video, retime_scenes: 'yes', scenes: [{ id: 'a', line: 'Hi' }] }, ctx), (e) => e.code === 'bad_input', 'retime_scenes is a boolean');
  assert.equal(orders.length, 0);
});

test('refused when under 70% of the script is heard: the cut does not say the script', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: async () => recordedWhisper });
  const video = await cut(ctx.workDir);
  await assert.rejects(
    mod.run({ video, retime_scenes: true, scenes: [{ id: 'a', line: 'Meet the jacket' }, { id: 'b', line: 'that folds flat into a tiny travel cube for every trip you take.' }] }, ctx),
    (e) => e.code === 'bad_input' && /script/.test(e.message + (e.detail || '')),
  );
  assert.equal(orders.length, 1, 'the transcription was ordered once (and is reused on a retry)');
});

test('a Whisper chunk with a null end time still counts as heard', { skip }, async () => {
  const json = structuredClone(recordedWhisper.json);
  json.chunks.at(-1).timestamp[1] = null;
  const { ctx } = makeCtx({ partDir: dir, line: reply(json) });
  const video = await cut(ctx.workDir);
  const out = await mod.run({ video, retime_scenes: true, scenes: [{ id: 'a', line: 'Meet the jacket that packs into its own pocket.' }] }, ctx);
  assert.equal(out.transcript, 'Meet the jacket that packs into its own pocket.');
  assert.equal(out.timeline.speech[0].words.at(-1).text, 'pocket.');
  assert.ok(out.timeline.speech[0].words.at(-1).start_s >= 1.98 - 1e-9);
});

test('retimeCloseChunks closes a null end at the next start or the end of the cut', () => {
  const out = retimeCloseChunks({ chunks: [{ text: 'a', timestamp: [0, null] }, { text: 'b', timestamp: [0.5, 0.9] }, { text: 'c', timestamp: [1.0, null] }, null] }, 3);
  assert.deepEqual(out.chunks.slice(0, 3).map((c) => c.timestamp), [[0, 0.5], [0.5, 0.9], [1.0, 3]]);
  assert.deepEqual(kitHeardWords(out).map((w) => w.text), ['a', 'b', 'c']);
  assert.deepEqual(retimeCloseChunks({ chunks: null }, 3).chunks, []);
});

test('retimeHeardShare matches in order, so one dropped word does not shift the rest', () => {
  const heard = kitHeardWords({ chunks: 'one two four five'.split(' ').map((t, i) => ({ text: t, timestamp: [i, i + 1] })) });
  assert.equal(retimeHeardShare([{ text: 'One, two' }, { text: 'three four five.' }], heard), 0.8);
  assert.equal(retimeHeardShare([{ text: 'five four' }], heard), 0.5);
});

test('retimeSceneSpans: midway boundaries; silent scenes share their gap; leading and trailing silence', () => {
  const speech = [
    { scene_id: 'b', start_s: 1.0, end_s: 2.0 },
    { scene_id: 'd', start_s: 2.6, end_s: 3.4 },
    { scene_id: 'e', start_s: 3.6, end_s: 5.0 },
  ];
  const spans = retimeSceneSpans(['a', 'b', 'c', 'd', 'e', 'f', 'g'], speech, 8);
  assert.deepEqual(spans, [
    { id: 'a', start_s: 0, end_s: 0.5 }, // leading silence: the time before the first word, split in two
    { id: 'b', start_s: 0.5, end_s: 2.2 }, // one silent scene in a 0.6 s gap: three 0.2 s slots
    { id: 'c', start_s: 2.2, end_s: 2.4 },
    { id: 'd', start_s: 2.4, end_s: 3.5 }, // midway between 3.4 and 3.6
    { id: 'e', start_s: 3.5, end_s: 5.45 }, // a 0.45 s hold after the last word
    { id: 'f', start_s: 5.45, end_s: 6.725 },
    { id: 'g', start_s: 6.725, end_s: 8 },
  ]);
  assertTiles(spans, 8);
});

test('retimeSceneSpans: the last spoken scene runs to the end; overlapping lines never run backwards', () => {
  const spans = retimeSceneSpans(['a', 'b', 'c'], [{ scene_id: 'a', start_s: 0.3, end_s: 2.0 }, { scene_id: 'c', start_s: 1.8, end_s: 3.0 }], 3.2);
  assert.deepEqual(spans, [
    { id: 'a', start_s: 0, end_s: 1.9 },
    { id: 'b', start_s: 1.9, end_s: 1.9 },
    { id: 'c', start_s: 1.9, end_s: 3.2 },
  ]);
  // Little time after the last word: the hold shrinks so the silent scene still gets a share.
  const tail = retimeSceneSpans(['a', 'b'], [{ scene_id: 'a', start_s: 0, end_s: 2.9 }], 3.1);
  assert.deepEqual(tail, [{ id: 'a', start_s: 0, end_s: 3 }, { id: 'b', start_s: 3, end_s: 3.1 }]);
  assertTiles(tail, 3.1);
});
