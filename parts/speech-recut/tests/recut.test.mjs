// The speech-recut planner (../src/recut.mjs) on hand-made takes: dead air, joins on picture cuts,
// repeats and stutters inside a line only, the minimum shot, silent beats, frame-exact cut points,
// and the refusals. No ffmpeg; speech-recut.test.mjs renders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RECUT_EDGE_S, RECUT_LEVEL_RATE, RECUT_LEVEL_STEP_S, RecutRefusal, recutAlign, recutCheckSpeech, recutFragments, recutIsRepeat, recutLevels, recutMapper, recutPlan, recutQuietWindow, recutSpeechBusy } from '../src/recut.mjs';

const FPS = 24;
const w = (text, start, end) => ({ text, start_s: start, end_s: end });
const line = (scene_id, text, words, spoken) => ({ scene_id, text, ...(spoken === undefined ? {} : { spoken }), start_s: words[0].start_s, end_s: words.at(-1).end_s, words });
const near = (a, b, what, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);

/** Two lines of a street interview: a question, a pause, an answer. */
function twoLines() {
  return {
    duration: 4.5,
    fps: FPS,
    scenes: [
      { id: 'q', line: 'What is in the can?', speaker: 'interviewer' },
      { id: 'a', line: 'Beer obviously', speaker: 'man' },
    ],
    speech: [
      line('q', 'What is in the can?', [w('What', 0.5, 0.6), w('is', 0.62, 0.7), w('in', 0.72, 0.8), w('the', 0.82, 0.9), w('can?', 0.92, 1.0)], 'What is in the can?'),
      line('a', 'Beer obviously', [w('Beer', 3.0, 3.2), w('obviously', 3.25, 3.5)], 'Beer obviously'),
    ],
    timeline_scenes: [
      { id: 'q', start_s: 0, end_s: 2.0 },
      { id: 'a', start_s: 2.0, end_s: 4.5 },
    ],
  };
}

function wordsOut(plan) {
  return plan.speech.flatMap((e) => e.words);
}

/** Every removal edge is on the take's frame grid (or the take's end). */
function assertOnFrames(plan, duration) {
  for (const r of plan.removals) {
    for (const t of [r.start, r.end]) {
      if (Math.abs(t - duration) < 1e-9) continue;
      near(t * FPS, Math.round(t * FPS), `cut point ${t} on a ${FPS} fps frame`, 1e-6);
    }
  }
}

test('dead air: the head keeps max_gap_s, a long pause is cut down to max_gap_s, the tail keeps twice it', () => {
  const plan = recutPlan({ ...twoLines(), picture_cuts: [] });
  const kinds = plan.cuts.map((c) => c.kind);
  assert.deepEqual(kinds, ['head', 'dead_air', 'tail']);
  // head: 0.5 s before the first word -> 0.25 s kept
  near(plan.removals[0].start, 0, 'head start');
  near(plan.removals[0].end, 0.25, 'head end', 1 / FPS);
  // the 2.0 s pause between "can?" and "Beer" keeps 0.25 s (to a frame)
  const words = wordsOut(plan);
  const can = words.find((x) => x.text === 'can?');
  const beer = words.find((x) => x.text === 'Beer');
  near(beer.start_s - can.end_s, 0.25, 'kept pause', 1 / FPS + 1e-6);
  // tail: 1.0 s after "obviously" -> 0.5 s kept
  near(plan.seconds - words.at(-1).end_s, 0.5, 'tail hold', 1 / FPS + 1e-6);
  near(plan.seconds, 4.5 - 0.25 - 1.75 - 0.5, 'length', 2 / FPS);
  assertOnFrames(plan, 4.5);
});

test('every word survives the cut with its length, in order, re-timed by what was removed before it', () => {
  const take = twoLines();
  const plan = recutPlan({ ...take, picture_cuts: [] });
  const src = take.speech.flatMap((e) => e.words);
  const out = wordsOut(plan);
  assert.equal(out.length, src.length);
  const map = recutMapper(plan.keep);
  out.forEach((x, i) => {
    assert.equal(x.text, src[i].text);
    near(x.start_s, +map(src[i].start_s).toFixed(3), `${x.text} start`, 1e-3);
    near(x.end_s - x.start_s, src[i].end_s - src[i].start_s, `${x.text} length`, 2e-3);
    if (i) assert.ok(x.start_s >= out[i - 1].end_s, 'words stay in order');
  });
  // no removal comes within RECUT_EDGE_S of a word, less half a frame of snapping
  for (const r of plan.removals) {
    for (const x of src) assert.ok(r.end <= x.start_s - RECUT_EDGE_S + 0.5 / FPS + 1e-9 || r.start >= x.end_s + RECUT_EDGE_S - 0.5 / FPS - 1e-9, `removal ${r.start}-${r.end} clips ${x.text}`);
  }
});

test('the timeline scenes are re-timed by id and tile the cut', () => {
  const plan = recutPlan({ ...twoLines(), picture_cuts: [] });
  assert.deepEqual(plan.scenes.map((s) => s.id), ['q', 'a']);
  near(plan.scenes[0].start_s, 0, 'first scene starts at 0');
  near(plan.scenes[0].end_s, plan.scenes[1].start_s, 'scenes meet');
  near(plan.scenes[1].end_s, plan.seconds, 'last scene ends with the cut', 1e-3);
});

test('a dead-air join takes in a picture cut that falls in the silence', () => {
  // The cut to the answering man is at 2.0 s: the removal must contain it, so the join reads as that cut.
  const plan = recutPlan({ ...twoLines(), picture_cuts: [2.0] });
  const dead = plan.removals.find((r) => r.kind === 'dead_air');
  assert.ok(dead.start <= 2.0 && dead.end >= 2.0, `removal ${dead.start}-${dead.end} misses the picture cut`);
  // a cut near the edge of the silence still wins over the middle
  const edge = recutPlan({ ...twoLines(), picture_cuts: [1.1] });
  const d2 = edge.removals.find((r) => r.kind === 'dead_air');
  assert.ok(d2.start <= 1.1 + 1e-9 && d2.end >= 1.1, `removal ${d2.start}-${d2.end} misses the picture cut at 1.1`);
});

test('minimum shot: a silent sliver of a shot is dropped whole; no shot under min_shot_s is left', () => {
  // Picture cuts 1.5 and 1.7 make a 0.2 s shot inside a 0.4 s pause.
  const take = {
    duration: 2.6,
    fps: FPS,
    scenes: [
      { id: 's1', line: 'one two three' },
      { id: 's2', line: 'four five' },
    ],
    speech: [
      line('s1', 'one two three', [w('one', 0.2, 0.5), w('two', 0.55, 0.9), w('three', 0.95, 1.4)], 'one two three'),
      line('s2', 'four five', [w('four', 1.8, 2.1), w('five', 2.15, 2.4)], 'four five'),
    ],
    timeline_scenes: [
      { id: 's1', start_s: 0, end_s: 1.6 },
      { id: 's2', start_s: 1.6, end_s: 2.6 },
    ],
    picture_cuts: [1.5, 1.7],
  };
  const plan = recutPlan(take);
  const shots = recutFragments(plan.keep, take.picture_cuts).map((f) => f.end - f.start);
  assert.ok(shots.every((s) => s >= 0.4 - 1e-6), `shots ${shots.map((s) => s.toFixed(3))}`);
  assert.equal(wordsOut(plan).length, 5, 'no word lost');
  assert.deepEqual(plan.warnings, []);
  // and with a 0.1 s floor the sliver may stay
  const loose = recutPlan({ ...take, min_shot_s: 0.1 });
  assert.ok(loose.seconds >= plan.seconds - 1e-9);
});

test('a short shot that holds speech between two of the take\'s own cuts is covered by the shot before it, never cut', () => {
  const take = {
    duration: 2.0,
    fps: FPS,
    scenes: [{ id: 's1', line: 'hello there friend' }],
    speech: [line('s1', 'hello there friend', [w('hello', 0.1, 0.5), w('there', 0.55, 0.8), w('friend', 0.85, 1.6)], 'hello there friend')],
    timeline_scenes: [{ id: 's1', start_s: 0, end_s: 2.0 }],
    picture_cuts: [0.6, 0.8],
  };
  const plan = recutPlan(take);
  assert.equal(wordsOut(plan).length, 3);
  assert.deepEqual(plan.warnings, []);
  assert.deepEqual(plan.covers, [{ start: 0.6, end: 0.8, from: 'prev' }]);
  // The first shot of the edit has no shot before it: the one after covers it.
  const first = recutPlan({ ...take, picture_cuts: [0.25] });
  assert.equal(first.covers.length, 1);
  assert.equal(first.covers[0].from, 'next');
  assert.deepEqual(first.warnings, []);
});

test('a short shot that holds speech next to dead air takes back some of it, up to its shortfall', () => {
  // The take's own cut at 0.75 s, inside the line, leaves 0.29 s of that shot before the dead-air join.
  const take = {
    duration: 3.0,
    fps: FPS,
    scenes: [
      { id: 's1', line: 'one two' },
      { id: 's2', line: 'three four' },
    ],
    speech: [
      line('s1', 'one two', [w('one', 0.2, 0.5), w('two', 0.55, 0.9)], 'one two'),
      line('s2', 'three four', [w('three', 2.0, 2.3), w('four', 2.35, 2.6)], 'three four'),
    ],
    timeline_scenes: [
      { id: 's1', start_s: 0, end_s: 1.5 },
      { id: 's2', start_s: 1.5, end_s: 3.0 },
    ],
    picture_cuts: [0.75],
  };
  const before = recutPlan({ ...take, min_shot_s: 0.1 });
  const plan = recutPlan(take);
  const shots = recutFragments(plan.keep, take.picture_cuts).map((f) => f.end - f.start);
  assert.ok(shots.every((x) => x >= 0.4 - 1e-6), `shots ${shots.map((x) => x.toFixed(3))}`);
  assert.deepEqual(plan.covers, []);
  assert.deepEqual(plan.warnings, []);
  const dead = plan.removals.find((r) => r.kind === 'dead_air');
  const was = before.removals.find((r) => r.kind === 'dead_air');
  near(dead.end, was.end, 'the removal keeps its far edge');
  assert.ok(dead.start > was.start, 'the removal starts later: more pause after the line');
  assert.ok(dead.start - was.start <= 0.4 - 0.29 + 1 / FPS + 1e-6, `gave back ${(dead.start - was.start).toFixed(3)} s, about the shortfall`);
  assert.equal(wordsOut(plan).length, 4, 'no word lost');
  assertOnFrames(plan, take.duration);
});

test('repeats and stutters inside a line are dropped; the written words and the line stay', () => {
  const take = {
    duration: 2.6,
    fps: FPS,
    scenes: [{ id: 'a', line: "I think it's water" }],
    // Whisper heard "I I think it's it's wa- water"; transcribe-whisper timed the written words on the first copies.
    speech: [line('a', "I think it's water", [w('I', 0.3, 0.4), w('think', 0.7, 0.95), w("it's", 1.0, 1.15), w('water', 1.7, 2.0)], "I I think it's it's wa- water")],
    timeline_scenes: [{ id: 'a', start_s: 0, end_s: 2.6 }],
    picture_cuts: [],
  };
  const plan = recutPlan(take);
  const repeats = plan.removals.filter((r) => r.kind === 'repeat');
  assert.equal(repeats.length, 2, JSON.stringify(plan.removals));
  near(repeats[0].start, 0.44, 'first repeat starts after "I"', 0.5 / FPS);
  near(repeats[0].end, 0.66, 'first repeat ends before "think"', 0.5 / FPS);
  assert.equal(plan.speech[0].spoken, "I think it's water");
  assert.equal(plan.speech[0].text, "I think it's water");
  assert.deepEqual(plan.speech[0].words.map((x) => x.text), ['I', 'think', "it's", 'water']);
  // drop: none keeps them (and a 0.3 s gap with a repeat in it is never dead-air cut)
  const none = recutPlan({ ...take, drop: 'none' });
  assert.equal(none.removals.filter((r) => r.kind === 'repeat').length, 0);
  assert.equal(none.speech[0].spoken, "I I think it's it's wa- water");
});

test('a repeat of a whole line is never dropped: extra words between lines stay', () => {
  // The man says his line twice. transcribe-whisper gives the second copy to the next line as leading words.
  const take = {
    duration: 4.0,
    fps: FPS,
    scenes: [
      { id: 'a', line: 'Beer obviously' },
      { id: 'b', line: 'Wait that is water' },
    ],
    speech: [
      line('a', 'Beer obviously', [w('Beer', 0.3, 0.5), w('obviously', 0.55, 0.9)], 'Beer obviously'),
      line('b', 'Wait that is water', [w('Wait', 2.6, 2.8), w('that', 2.85, 3.0), w('is', 3.05, 3.15), w('water', 3.2, 3.5)], 'Beer obviously Wait that is water'),
    ],
    timeline_scenes: [
      { id: 'a', start_s: 0, end_s: 1.5 },
      { id: 'b', start_s: 1.5, end_s: 4.0 },
    ],
    picture_cuts: [],
  };
  const plan = recutPlan(take);
  // the pause before "Wait" holds the second "Beer obviously": nothing in it is cut
  for (const r of plan.removals) assert.ok(r.end <= 0.9 + 1e-9 || r.start >= 2.6 - 1e-9 || r.start < 0.3, `removal ${r.start}-${r.end} cuts heard speech`);
  assert.equal(plan.speech[1].spoken, 'Beer obviously Wait that is water');
});

test('extra words that are not repeats are speech: their gap is never cut', () => {
  const take = {
    duration: 3.0,
    fps: FPS,
    scenes: [{ id: 'a', line: 'it is cold' }],
    speech: [line('a', 'it is cold', [w('it', 0.2, 0.3), w('is', 0.35, 0.45), w('cold', 1.6, 1.9)], 'it is banana split cold')],
    timeline_scenes: [{ id: 'a', start_s: 0, end_s: 3.0 }],
    picture_cuts: [],
  };
  const plan = recutPlan(take);
  for (const r of plan.removals) assert.ok(r.end <= 0.45 || r.start >= 1.6, `removal ${r.start}-${r.end} cuts "banana split"`);
  assert.equal(plan.speech[0].spoken, 'it is banana split cold');
});

test('heard words as the words: the earlier copy of a repeat goes, a repeat the line has stays', () => {
  const heard = {
    duration: 2.0,
    fps: FPS,
    scenes: [{ id: 'a', line: 'the can is very very cold' }],
    speech: [
      {
        scene_id: 'a',
        text: 'the can is very very cold',
        start_s: 0.2,
        end_s: 1.6,
        words: [w('the', 0.2, 0.3), w('the', 0.4, 0.5), w('can', 0.55, 0.7), w('is', 0.75, 0.85), w('very', 0.9, 1.0), w('very', 1.05, 1.15), w('cold', 1.2, 1.6)],
      },
    ],
    timeline_scenes: [{ id: 'a', start_s: 0, end_s: 2.0 }],
    picture_cuts: [],
  };
  const plan = recutPlan(heard);
  assert.deepEqual(plan.speech[0].words.map((x) => x.text), ['the', 'can', 'is', 'very', 'very', 'cold']);
  assert.equal(plan.removals.filter((r) => r.kind === 'repeat').length, 1);
});

test('a scene with no line is a silent beat: its span is kept whole', () => {
  const take = {
    duration: 4.5,
    fps: FPS,
    scenes: [
      { id: 's1', line: 'Try this' },
      { id: 's2', line: null, picture: 'She sips and frowns' },
      { id: 's3', line: 'Oh that is good' },
    ],
    speech: [
      line('s1', 'Try this', [w('Try', 0.3, 0.6), w('this', 0.65, 1.2)], 'Try this'),
      line('s3', 'Oh that is good', [w('Oh', 3.3, 3.5), w('that', 3.55, 3.7), w('is', 3.75, 3.85), w('good', 3.9, 4.2)], 'Oh that is good'),
    ],
    timeline_scenes: [
      { id: 's1', start_s: 0, end_s: 1.5 },
      { id: 's2', start_s: 1.5, end_s: 3.0 },
      { id: 's3', start_s: 3.0, end_s: 4.5 },
    ],
    picture_cuts: [1.5, 3.0],
  };
  const plan = recutPlan(take);
  const s2 = plan.scenes.find((s) => s.id === 's2');
  assert.ok(s2, 'the silent beat is still in the timeline');
  near(s2.end_s - s2.start_s, 1.5, 'its span is whole', 1e-3);
});

test('refusals: no timed words; a line with no heard words (the take is wrong, not the cut)', () => {
  const take = twoLines();
  assert.throws(() => recutPlan({ ...take, speech: [] }), RecutRefusal);
  assert.throws(() => recutPlan({ ...take, speech: take.speech.map((e) => ({ ...e, words: [] })) }), /no timed words/);
  assert.throws(() => recutPlan({ ...take, speech: [take.speech[0]] }), (e) => e instanceof RecutRefusal && /scene a's line has no heard words/.test(e.message));
  const unheard = { ...take.speech[1], spoken: '' };
  assert.throws(() => recutPlan({ ...take, speech: [take.speech[0], unheard] }), /scene a's line has no heard words/);
});

test('null and empty lines need no speech and are not refused', () => {
  const take = twoLines();
  const plan = recutPlan({ ...take, scenes: [...take.scenes, { id: 'c', line: null }, { id: 'd', line: '' }, { id: 'e' }] });
  assert.ok(plan.seconds > 0);
});

test('repeat rules: back and forward runs, stutters; a different word is not a repeat', () => {
  const written = ['i', 'think', 'its', 'water'];
  assert.ok(recutIsRepeat(['i'], written, 0));
  assert.ok(recutIsRepeat(['i', 'think'], written, 1));
  assert.ok(recutIsRepeat(['wa'], written, 2));
  assert.ok(recutIsRepeat(['its', 'its'], written, 2));
  assert.ok(!recutIsRepeat(['banana'], written, 2));
  assert.ok(!recutIsRepeat(['wa', 'banana'], written, 2));
  assert.ok(!recutIsRepeat([], written, 2));
  assert.deepEqual(recutAlign(['a', 'b', 'c'], ['a', 'a', 'b', 'x', 'c']), [0, 2, 4]);
  assert.deepEqual(recutAlign(['a', 'z'], ['a', 'b']), [0, -1]);
});

test('the same take always gives the same plan', () => {
  const a = recutPlan({ ...twoLines(), picture_cuts: [1.3, 2.4] });
  const b = recutPlan({ ...twoLines(), picture_cuts: [1.3, 2.4] });
  assert.deepEqual(a, b);
});

// ---- room tone (W1-15b) ----

/** dB levels per 50 ms frame for `seconds`, at `floor` dB, with `at(t)` overriding a frame. */
function levelsFor(seconds, floor, at = () => null) {
  const n = Math.round(seconds / RECUT_LEVEL_STEP_S);
  return Array.from({ length: n }, (_, f) => at(+(f * RECUT_LEVEL_STEP_S).toFixed(3)) ?? floor);
}

test('levels: dB per 50 ms frame of 16 kHz s16le; a silent frame is -Infinity', () => {
  const step = RECUT_LEVEL_STEP_S * RECUT_LEVEL_RATE;
  const pcm = Buffer.alloc(step * 2 * 2 + 10);
  for (let i = 0; i < step; i++) pcm.writeInt16LE(i % 2 ? 16384 : -16384, i * 2);
  const out = recutLevels(pcm);
  assert.equal(out.length, 2, 'the part frame at the end is not measured');
  near(out[0], 20 * Math.log10(0.5), 'a half-scale square wave', 1e-6);
  assert.equal(out[1], -Infinity);
});

test('speech busy: every word and line span, padded and merged', () => {
  const take = twoLines();
  const busy = recutSpeechBusy(take.speech, 0.1);
  assert.equal(busy.length, 2);
  near(busy[0].start, 0.4, 'first line start');
  near(busy[0].end, 1.1, 'first line end');
  near(busy[1].start, 2.9, 'second line start');
  near(busy[1].end, 3.6, 'second line end');
});

test('room tone: the quietest speech-free window, never over speech, longest first', () => {
  const take = twoLines();
  const busy = recutSpeechBusy(take.speech);
  // A -40 dB street with a -55 dB lull at 1.6-2.8 s, and louder "speech" frames where the lines are.
  const levels = levelsFor(4.5, -40, (t) => (t >= 1.6 && t < 2.8 ? -55 : t >= 0.5 && t < 1.0 ? -12 : t >= 3.0 && t < 3.5 ? -12 : null));
  const win = recutQuietWindow({ levels, busy, duration: 4.5 });
  assert.ok(win, 'a window is found');
  near(win.end_s - win.start_s, 1.0, 'the longest window that fits');
  assert.ok(win.start_s >= 1.6 - 1e-9 && win.end_s <= 2.8 + 1e-9, `inside the lull: ${JSON.stringify(win)}`);
  near(win.peak_db, -55, 'its loudest frame', 1e-6);
  for (const b of busy) assert.ok(win.end_s <= b.start || win.start_s >= b.end, `clear of speech ${JSON.stringify(b)}`);
});

test('room tone: a click in the lull moves the window; a shorter window wins when it is quieter', () => {
  const take = twoLines();
  const busy = recutSpeechBusy(take.speech);
  const levels = levelsFor(4.5, -40, (t) => (t >= 2.05 && t < 2.1 ? -20 : t >= 1.5 && t < 2.6 ? -55 : null));
  const win = recutQuietWindow({ levels, busy, duration: 4.5 });
  // No 1.0, 0.8 or 0.6 s window of the lull avoids the click; a 0.4 s one does, 15 dB quieter.
  near(win.end_s - win.start_s, 0.4, 'the shorter, quieter window');
  assert.ok(win.start_s >= 1.5 - 1e-9 && win.end_s <= 2.6 + 1e-9, JSON.stringify(win));
  assert.ok(win.end_s <= 2.05 + 1e-9 || win.start_s >= 2.1 - 1e-9, `clear of the click: ${JSON.stringify(win)}`);
  near(win.peak_db, -55, 'clear of the click', 1e-6);
});

test('room tone: digital silence and speech leave no window; the result is null, not a guess', () => {
  const take = twoLines();
  const busy = recutSpeechBusy(take.speech);
  assert.equal(recutQuietWindow({ levels: levelsFor(4.5, -Infinity), busy, duration: 4.5 }), null);
  assert.equal(recutQuietWindow({ levels: levelsFor(4.5, -40), busy: [{ start: 0, end: 4.5 }], duration: 4.5 }), null);
  // A fade to silence disqualifies only the windows it touches.
  const levels = levelsFor(4.5, -45, (t) => (t < 0.3 ? -Infinity : null));
  const win = recutQuietWindow({ levels, busy: [], duration: 4.5, lengths: [0.4] });
  assert.ok(win.start_s >= 0.3 - 1e-9, JSON.stringify(win));
});

test('room tone: the same levels always give the same window', () => {
  const take = twoLines();
  const levels = levelsFor(4.5, -40, (t) => (t >= 1.6 && t < 2.8 ? -50 : null));
  const busy = recutSpeechBusy(take.speech);
  assert.deepEqual(recutQuietWindow({ levels, busy, duration: 4.5 }), recutQuietWindow({ levels, busy, duration: 4.5 }));
});

test('room tone: untimed heard speech (a repeated line before the next line) is never a room-tone window', () => {
  // The man says his line twice; the second copy is only in the next line's `spoken`, with no timings,
  // so it sits in the 0.9-2.6 s gap. The planner holds that gap; the room-tone search must too.
  const take = {
    duration: 4.0,
    fps: FPS,
    scenes: [
      { id: 'a', line: 'Beer obviously' },
      { id: 'b', line: 'Wait that is water' },
    ],
    speech: [
      line('a', 'Beer obviously', [w('Beer', 0.3, 0.5), w('obviously', 0.55, 0.9)], 'Beer obviously'),
      line('b', 'Wait that is water', [w('Wait', 2.6, 2.8), w('that', 2.85, 3.0), w('is', 3.05, 3.15), w('water', 3.2, 3.5)], 'Beer obviously Wait that is water'),
    ],
    timeline_scenes: [
      { id: 'a', start_s: 0, end_s: 1.5 },
      { id: 'b', start_s: 1.5, end_s: 4.0 },
    ],
    picture_cuts: [],
  };
  const plan = recutPlan(take);
  assert.ok(plan.heard.some((g) => g.start <= 0.9 + 1e-9 && g.end >= 2.6 - 1e-9), `the gap is heard: ${JSON.stringify(plan.heard)}`);
  // The quietest stretch of the take is that gap (the repeat is said softly); the rest is a -40 dB street.
  const levels = levelsFor(4.0, -40, (t) => (t >= 1.0 && t < 2.5 ? -50 : null));
  const withHeard = recutQuietWindow({ levels, busy: recutSpeechBusy(take.speech, undefined, plan.heard), duration: 4.0 });
  if (withHeard) assert.ok(withHeard.end_s <= 0.9 || withHeard.start_s >= 2.6, `the bed is clear of the repeat: ${JSON.stringify(withHeard)}`);
  // Without it, the search would have picked the repeat (the bug this guards against).
  const without = recutQuietWindow({ levels, busy: recutSpeechBusy(take.speech), duration: 4.0 });
  assert.ok(without && without.start_s >= 0.9 && without.end_s <= 2.6, `control: ${JSON.stringify(without)}`);
});

test('recutCheckSpeech: the pure refusals, the same as the plan\'s', () => {
  const take = twoLines();
  assert.throws(() => recutCheckSpeech([], take.scenes), /no timed words/);
  assert.throws(() => recutCheckSpeech([take.speech[0]], take.scenes), /scene a's line has no heard words/);
  assert.doesNotThrow(() => recutCheckSpeech(take.speech, [...take.scenes, { id: 'c', line: null }]));
});
