// creator-h3 1.2.1: inside a take, each boundary between two lines sits on a silence heard between them, so a
// scene starts on its first word; with no silence in reach the 1.2.0 estimate stays.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadPart, makeCtx, run } from '../../_tools/kit-harness.mjs';
import { lineSpans } from '../src/part.mjs';
import { H3_REPLY, still } from './fixture.mjs';

const { dir, mod } = await loadPart('creator-h3', '1.2.1');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} is not within ${tol} of ${b}`);

// A short line then a long one, estimated at 2.6 words a second with 0.3 s between them.
const LINES = [
  { start: 0, end: 3 / 2.6 },
  { start: 3 / 2.6 + 0.3, end: 3 / 2.6 + 0.3 + 12 / 2.6 },
];
// 1.2.0's spread: the estimate over the take's speech from 0.2 s to 3.0 s.
const spread = (x) => 0.2 + (x * (3.0 - 0.2)) / LINES[1].end;

test('the boundary goes on the pause heard between the lines, not the estimate', () => {
  const spans = lineSpans(LINES, [{ start: 0.45, end: 0.55 }, { start: 1.4, end: 1.8 }], 0.2, 3.0, spread);
  assert.deepEqual(spans, [
    { start: 0.2, end: 1.4 },
    { start: 1.8, end: 3.0 },
  ]);
  near(spread((LINES[0].end + LINES[1].start) / 2), 0.8, 0.05, 'the estimate alone puts the boundary near');
});

test('with no pause worth moving to, the estimate stays', () => {
  const none = lineSpans(LINES, [], 0.2, 3.0, spread);
  assert.deepEqual(none, [
    { start: 0.2, end: spread(LINES[0].end) },
    { start: spread(LINES[1].start), end: 3.0 },
  ]);
  const far = lineSpans(LINES, [{ start: 2.7, end: 2.82 }], 0.2, 3.0, spread);
  assert.deepEqual(far, none, 'a short pause far from the estimate is a pause inside the line');
});

test('three lines take two pauses in order; each pause is used once', () => {
  const three = [
    { start: 0, end: 1 },
    { start: 1.3, end: 2.3 },
    { start: 2.6, end: 3.6 },
  ];
  const est = (x) => 0.1 + x;
  const spans = lineSpans(three, [{ start: 1.0, end: 1.5 }, { start: 2.0, end: 2.15 }, { start: 2.5, end: 2.9 }], 0.1, 3.7, est);
  assert.deepEqual(spans.map((s) => [s.start, s.end]), [
    [0.1, 1.0],
    [1.5, 2.5],
    [2.9, 3.7],
  ]);
});

/** A fake line: every take speaks a 3-word line from 0.2 to 1.4 s and a 12-word line from 1.8 to 3.0 s. */
async function pausedLine(order, ctx) {
  const name = order.results[0].name;
  const path = join(ctx.workDir, name);
  const d = order.body.duration;
  await run('ffmpeg', [
    '-hide_banner', '-nostdin', '-y',
    '-f', 'lavfi', '-i', `testsrc2=size=360x640:rate=24:duration=${d}`,
    '-f', 'lavfi', '-i', `sine=frequency=300:duration=${d}:sample_rate=48000`,
    '-filter_complex', "[1:a]volume='if(between(t,0.2,1.4)+between(t,1.8,3.0),1,0)':eval=frame[a]",
    '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ac', '1', '-t', String(d), path,
  ]);
  return { json: structuredClone(H3_REPLY.answer.json), files: { [name]: await fileRef(path, 'video') }, reused: false };
}

test('on the reel, the second scene starts where its first word is heard', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: pausedLine });
  const inputs = {
    scenes: [
      { id: 's1', line: 'Okay, real talk.' },
      { id: 's2', line: 'This is the one snack I keep in my bag every single day now.' },
    ],
    character: { image: await still(ctx.workDir), identity: 'a woman in her early 30s, shoulder-length black hair, grey t-shirt', environment: 'a lived-in home office' },
    resolution: '768P',
    max_seconds: 40,
  };
  const out = await mod.run(inputs, ctx);
  assert.equal(out.takes.length, 1);
  const [s1, s2] = out.timeline.speech;
  near(s1.start_s, 0.2, 0.05, 's1 starts on its first word');
  near(s1.end_s, 1.4, 0.05, 's1 ends on its last word');
  near(s2.start_s, 1.8, 0.05, 's2 starts on its first word');
  near(out.timeline.scenes[1].start_s, 1.8, 0.05, 'the scene an insert is placed by starts with the line');
});
