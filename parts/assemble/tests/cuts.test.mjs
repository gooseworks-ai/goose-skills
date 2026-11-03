// The cut arithmetic of assemble 1.1.0 (src/cuts.mjs), without ffmpeg.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleClampSpeech, assembleGradeChain, assembleIsCutProblem, assembleMapZone, assembleRateCap, assembleSpanCuts } from '../src/cuts.mjs';

const fps = 30;
const cutsOf = (r) => r.cuts.map((c) => [c.id, c.start_f, c.frames]);
const refused = (fn, re) => assert.throws(fn, (e) => assembleIsCutProblem(e) && re.test(e.message));

test('each voiced clip starts on the frame at or before its span and runs to the next; the last holds tail_s', () => {
  const r = assembleSpanCuts([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [
    { id: 'a', start_s: 0.31, end_s: 1.0 },
    { id: 'b', start_s: 1.2167, end_s: 2.0 },
    { id: 'c', start_s: 2.15, end_s: 3.0 },
  ], { fps, tail_s: 0.25, silent: null, card: null });
  // b: 1.2167 s is frame 36.5 -> 36 (never after the word starts); c: 2.15 s is frame 64.5 -> 64; end (3.0 + 0.25) s = frame 97.5 -> 98.
  assert.deepEqual(cutsOf(r), [['a', 0, 36], ['b', 36, 28], ['c', 64, 34]]);
  assert.equal(r.total_f, 98);
  assert.equal(r.card, null);
});

test('silent clips share the voiced clip before them evenly, or take fixed time from it', () => {
  const clips = [{ id: 'a' }, { id: 'quiet' }, { id: 'b' }];
  const spans = [{ id: 'a', start_s: 0, end_s: 0.9 }, { id: 'b', start_s: 1.0, end_s: 2.0 }];
  const shared = assembleSpanCuts(clips, spans, { fps, tail_s: 0, silent: { mode: 'share_previous' }, card: null });
  assert.deepEqual(cutsOf(shared), [['a', 0, 15], ['quiet', 15, 15], ['b', 30, 30]]);
  const fixed = assembleSpanCuts(clips, spans, { fps, tail_s: 0, silent: { mode: 'fixed', seconds: 0.2 }, card: null });
  assert.deepEqual(cutsOf(fixed), [['a', 0, 24], ['quiet', 24, 6], ['b', 30, 30]]);
  assert.deepEqual(fixed.cuts.map((c) => c.voiced), [true, false, true]);
  // Silent clips before the first voiced one go first in its time.
  const lead = assembleSpanCuts([{ id: 'x' }, { id: 'a' }], [{ id: 'a', start_s: 0.5, end_s: 1.0 }], { fps, tail_s: 0, silent: null, card: null });
  assert.deepEqual(cutsOf(lead), [['x', 0, 15], ['a', 15, 15]]);
});

test('the end card takes the last span (never shorter than the card), or follows the last cut', () => {
  const clips = [{ id: 'a' }, { id: 'b' }];
  const spans = [{ id: 'a', start_s: 0, end_s: 0.8 }, { id: 'b', start_s: 1.0, end_s: 1.8 }, { id: 'card', start_s: 2.0, end_s: 3.5 }];
  const over = assembleSpanCuts(clips, spans, { fps, tail_s: 0.25, silent: null, card: { fills: 'last_span', frames: 30 } });
  assert.deepEqual(cutsOf(over), [['a', 0, 30], ['b', 30, 30]]);
  // card: from frame 60 to (3.5 + 0.25) s = frame 112.5 -> 113, so 53 frames (longer than the 30-frame card: it holds).
  assert.deepEqual(over.card, { id: 'card', start_f: 60, frames: 53 });
  assert.equal(over.total_f, 113);
  const short = assembleSpanCuts(clips, spans, { fps, tail_s: 0, silent: null, card: { fills: 'last_span', frames: 90 } });
  assert.deepEqual(short.card, { id: 'card', start_f: 60, frames: 90 }, 'a span shorter than the card never cuts the card');
  // A clip with the card scene's id is not used.
  const named = assembleSpanCuts([...clips, { id: 'card' }], spans, { fps, tail_s: 0, silent: null, card: { fills: 'last_span', frames: 30 } });
  assert.deepEqual(cutsOf(named), [['a', 0, 30], ['b', 30, 30]]);
  const after = assembleSpanCuts([...clips, { id: 'card' }], spans, { fps, tail_s: 0.25, silent: null, card: { fills: 'after', frames: 30 } });
  assert.deepEqual(cutsOf(after), [['a', 0, 30], ['b', 30, 30], ['card', 60, 53]]);
  assert.deepEqual(after.card, { id: null, start_f: 113, frames: 30 });
  assert.equal(after.total_f, 143);
});

test('until_s holds the last cut over a dropped span', () => {
  const r = assembleSpanCuts([{ id: 'a' }], [{ id: 'a', start_s: 0, end_s: 1 }], { fps, tail_s: 0.25, silent: null, card: null, until_s: 2.25 });
  assert.deepEqual(cutsOf(r), [['a', 0, 68]]);
});

test('refuses spans the clips cannot follow', () => {
  const two = [{ id: 'a', start_s: 0, end_s: 1 }, { id: 'b', start_s: 1, end_s: 2 }];
  const opts = { fps, tail_s: 0, silent: null, card: null };
  refused(() => assembleSpanCuts([{ id: 'a' }], two, opts), /span "b" has no clip/);
  refused(() => assembleSpanCuts([{ id: 'b' }, { id: 'a' }], two, opts), /in the spans' order/);
  refused(() => assembleSpanCuts([{ video: {} }, { id: 'a' }], two, opts), /needs an id/);
  refused(() => assembleSpanCuts([{ id: 'a' }, { id: 'a' }], two, opts), /two clips/);
  refused(() => assembleSpanCuts([{ id: 'x' }], two, opts), /no clip matches a span/);
  refused(() => assembleSpanCuts([{ id: 'a' }, { id: 'b' }], [...two, { id: 'a', start_s: 3, end_s: 4 }], opts), /twice/);
  refused(() => assembleSpanCuts([{ id: 'a' }, { id: 'q' }, { id: 'b' }], two, { ...opts, silent: { mode: 'fixed', seconds: 0.8 } }), /needs at least 0.4 s/);
});

test('refuses clips after the end card scene', () => {
  const spans = [{ id: 'a', start_s: 0, end_s: 1 }, { id: 'card', start_s: 1, end_s: 2 }];
  refused(() => assembleSpanCuts([{ id: 'a' }, { id: 'card' }, { id: 'later' }], spans, { fps, tail_s: 0, silent: null, card: { fills: 'last_span', frames: 30 } }), /clips come after it/);
});

test('safe zones follow the cover or contain scale; speech is held to the cut', () => {
  assert.deepEqual(assembleMapZone({ use: 'logo', x: 200, y: 500, w: 320, h: 120 }, 720, 1280, 360, 640, 'cover'), { use: 'logo', x: 100, y: 250, w: 160, h: 60 });
  // A 1:1 card onto 9:16 cover: scaled up 1.6x and cropped at the sides.
  assert.deepEqual(assembleMapZone({ use: 'logo', x: 100, y: 300, w: 200, h: 100 }, 400, 400, 360, 640, 'cover'), { use: 'logo', x: 20, y: 480, w: 320, h: 160 });
  assert.equal(assembleMapZone({ use: 'logo', x: 0, y: 0, w: 2, h: 2 }, 720, 1280, 360, 640, 'cover'), null);
  const speech = assembleClampSpeech([
    { text: 'one two', start_s: 0, end_s: 1.2, words: [{ text: 'one', start_s: 0, end_s: 0.5 }, { text: 'two', start_s: 1.05, end_s: 1.2 }] },
    { text: 'late', start_s: 1.5, end_s: 2 },
  ], 1.1);
  assert.deepEqual(speech, [{ text: 'one two', start_s: 0, end_s: 1.1, words: [{ text: 'one', start_s: 0, end_s: 0.5 }, { text: 'two', start_s: 1.05, end_s: 1.1 }] }]);
});

test('grain grades cap the encode at 8 Mbps, everything else at 16 Mbps', () => {
  assert.deepEqual(assembleRateCap('none'), ['-maxrate', '16M', '-bufsize', '32M']);
  assert.deepEqual(assembleRateCap('phone-grain'), ['-maxrate', '8M', '-bufsize', '16M']);
  assert.deepEqual(assembleRateCap('phonecam'), ['-maxrate', '8M', '-bufsize', '16M']);
  assert.equal(assembleGradeChain('none', 1080, 1920), '');
  assert.match(assembleGradeChain('phonecam', 1080, 1920), /^scale=720:1280:.*noise=alls=8:allf=t,scale=1080:1920/);
  assert.equal(assembleGradeChain('phonecam', 360, 640), 'noise=alls=8:allf=t');
  assert.match(assembleGradeChain('phone-grain', 1080, 1920), /hqdn3d.*noise=alls=9/);
});
