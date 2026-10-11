// cut-footage's planner (src/plan.mjs): pure, no ffmpeg.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CutRefusal, cutCheckMode, cutCheckOrder, cutCheckProjectedSize, cutInsertRange, cutModeOf, cutPlaceInserts, cutPlanScenes, cutSceneSources, cutSpeedFor } from '../src/plan.mjs';

const vid = (sha = 'a'.repeat(64)) => ({ kind: 'file', path: '/x.mp4', sha256: sha, bytes: 1, mime: 'video/mp4', media: 'video' });
const img = { kind: 'file', path: '/x.png', sha256: 'b'.repeat(64), bytes: 1, mime: 'image/png', media: 'image' };
const refused = (re) => (e) => e instanceof CutRefusal && e.code === 'bad_input' && re.test(e.message);

test('the mode: band without scenes (1.0.2), inserts with a talking video, else scenes', () => {
  assert.equal(cutModeOf({ footage: [] }), 'band');
  assert.equal(cutModeOf({ scenes: [], video: vid() }), 'inserts');
  assert.equal(cutModeOf({ scenes: [] }), 'scenes');
  assert.equal(cutModeOf({ scenes: [], mode: 'scenes', video: vid() }), 'scenes');
  assert.throws(() => cutCheckMode('scenes', { scenes: [], footage: [], band: {} }), refused(/scenes mode does not use band/));
  assert.throws(() => cutCheckMode('inserts', { scenes: [], footage: [], video: vid() }), refused(/inserts mode needs timeline/));
  assert.throws(() => cutCheckMode('scenes', { scenes: [], footage: [], screen: { rot: 1 } }), refused(/look is not "screen"/));
});

test('each scene plays its own footage entry, else its image, else (scene 1) the lead; null lines are fine', () => {
  const scenes = [{ id: 'a', line: null }, { id: 'b', line: null }, { id: 'c', line: 'x', image: img }, { id: 'd', line: null }];
  const footage = [{ file: vid(), scene_id: 'b', start_ms: 0, end_ms: 1000 }, { file: img, kind: 'image', scene_id: 'd' }, { file: vid(), scene_id: null }];
  const src = cutSceneSources(scenes, footage, { lead: vid() });
  assert.deepEqual(src.map((s) => s.kind), ['lead', 'window', 'still', 'still']);
  assert.throws(() => cutSceneSources(scenes, footage), refused(/scene "a" has no footage window, image or lead/));
  assert.deepEqual(cutSceneSources(scenes, footage, { need: 'any' }).map((s) => s.kind), ['none', 'window', 'still', 'still']);
  assert.throws(() => cutSceneSources(scenes, [...footage, { file: vid(), scene_id: 'b' }]), refused(/more than one footage entry/));
  assert.throws(() => cutSceneSources(scenes, [{ file: vid(), scene_id: 'zz' }]), refused(/names scene "zz", which is not in the plan/));
  assert.throws(() => cutSceneSources(scenes, [{ file: vid(), kind: 'image', scene_id: 'b' }], { need: 'any' }), refused(/kind image but its file is a video/));
});

test('scene beats: windows clamped to scene_seconds within the speed limits, stills held, frame-exact times', () => {
  const sources = cutSceneSources([{ id: 'h' }, { id: 'a' }, { id: 'b' }, { id: 'c', image: img }], [
    { file: vid(), scene_id: 'a', start_ms: 0, end_ms: 4000 },
    { file: vid(), scene_id: 'b', start_ms: 5000, end_ms: 6000 },
  ], { lead: vid() });
  const lengths = new Map([[1, 30], [2, 30]]);
  const { beats, seconds } = cutPlanScenes(sources, { lengths, leadS: 2.31, fps: 30, scene_seconds: { min: 1.8, max: 2.5 }, dissolve_frames: 7 });
  assert.deepEqual(beats.map((b) => +b.seconds.toFixed(3)), [2.3, 2.5, 1.8, 2.5]);
  assert.deepEqual(beats.map((b) => +b.speed.toFixed(3)), [1, 1.6, 0.556, 1]);
  assert.ok(Math.abs(seconds - 9.1) < 1e-9);
  assert.equal(beats[1].start_s, 2.3);
  assert.throws(() => cutPlanScenes(sources, { lengths, leadS: 2.31, fps: 30, scene_seconds: { min: 1.8, max: 2.5 }, max_speed: 1.5 }), refused(/scene "a": 2.5s from a 4s window needs 1.6x, outside 0.5x to 1.5x/));
  assert.throws(() => cutPlanScenes(sources, { lengths: new Map([[1, 3], [2, 30]]), leadS: 2, fps: 30 }), refused(/not inside the 3s clip/));
  assert.throws(() => cutPlanScenes(sources, { lengths, leadS: 2, fps: 30, still_seconds: 0.1, dissolve_frames: 7 }), refused(/scene "c" lasts 0.1s, shorter than the 7-frame dissolve/));
});

test('windows move forward through a recording and never reuse it; stills are not checked', () => {
  const beat = (id, from, to, asset = 'r') => ({ kind: 'window', scene: { id }, entry: { asset_id: asset, file: vid() }, from, to });
  cutCheckOrder([beat('a', 0, 2), beat('b', 2, 4), beat('c', 0, 2, 'other'), { kind: 'still', scene: { id: 's' }, entry: { asset_id: 'r' } }]);
  assert.throws(() => cutCheckOrder([beat('a', 4, 6), beat('b', 0, 2)]), refused(/scene "b" goes back in the recording to 0s, before scene "a" at 4s/));
  cutCheckOrder([beat('a', 4, 6), beat('b', 0, 2)], 'any');
  assert.throws(() => cutCheckOrder([beat('a', 0, 3), beat('b', 2, 4)], 'any'), refused(/show the same part of the recording \(2-3s\)/));
});

test('inserts cover every take join: an insert ending up to 1 s before a join is stretched 0.15 s past it', () => {
  const src = (id) => ({ scene: { id }, kind: 'window', entry: { file: vid() } });
  const spans = new Map([['a', { start_s: 2, end_s: 3.4 }], ['b', { start_s: 6, end_s: 7 }]]);
  const slots = cutPlaceInserts([src('b'), src('a')], spans, { joins: [3.6, 6.2], duration: 10, fps: 30 });
  assert.deepEqual(slots.map((s) => s.scene.id), ['a', 'b']);
  assert.ok(Math.abs(slots[0].end_s - 3.7667) < 1e-3, `stretched to a frame at or after 3.75 (${slots[0].end_s})`);
  assert.ok(Math.abs(slots[0].stretched_s - 0.35) < 1e-9);
  assert.equal(slots[1].end_s, 7, 'a join well inside an insert needs nothing');
  assert.throws(() => cutPlaceInserts([src('a')], spans, { joins: [4.6], duration: 10, fps: 30 }), refused(/cut between takes at 4.6s would show/));
  assert.throws(() => cutPlaceInserts([src('a')], spans, { joins: [0.8], duration: 10, fps: 30 }), refused(/would show/));
  const tight = new Map([['a', { start_s: 2, end_s: 3.4 }], ['b', { start_s: 3.5, end_s: 5 }]]);
  assert.throws(() => cutPlaceInserts([src('a'), src('b')], tight, { joins: [3.45], duration: 10, fps: 30 }), refused(/cannot stretch over the cut between takes at 3.45s: it would run past the next insert/));
  assert.throws(() => cutPlaceInserts([src('zz')], spans, { duration: 10, fps: 30 }), refused(/no time in the talking track's timeline/));
  const overlap = new Map([['a', { start_s: 2, end_s: 4 }], ['b', { start_s: 3, end_s: 5 }]]);
  assert.throws(() => cutPlaceInserts([src('a'), src('b')], overlap, { duration: 10, fps: 30 }), refused(/overlap in time/));
});

test('an insert that starts up to 1 s after a take join starts 0.15 s before it (a timeline retimed from heard words)', () => {
  const src = (id) => ({ scene: { id }, kind: 'window', entry: { file: vid() } });
  // creator-h3 starts take 2 on scene b at 4.0 s; retimed, b starts 0.4 s later.
  const spans = new Map([['a', { start_s: 1, end_s: 2 }], ['b', { start_s: 4.4, end_s: 6 }]]);
  const [a, b] = cutPlaceInserts([src('a'), src('b')], spans, { joins: [4], duration: 10, fps: 30 });
  assert.equal(a.early_s, 0);
  assert.ok(Math.abs(b.start_s - 3.8333) < 1e-3, `starts at a frame at or before 3.85 (${b.start_s})`);
  assert.ok(b.start_s <= 4 - 0.15 + 1e-9 && b.end_s === 6, 'the join sits under the insert, 0.15 s in');
  assert.ok(Math.abs(b.early_s - 0.55) < 1e-9);
  assert.equal(b.stretched_s, 0);
  // 1.2 s after the join is too far.
  const far = new Map([['b', { start_s: 5.2, end_s: 6 }]]);
  assert.throws(() => cutPlaceInserts([src('b')], far, { joins: [4], duration: 10, fps: 30 }), refused(/cut between takes at 4s would show: no insert covers it/));
  // A start inside the first 0.15 s after the join is padded too; never before 0.
  const close = cutPlaceInserts([src('b')], new Map([['b', { start_s: 4.05, end_s: 6 }]]), { joins: [4], duration: 10, fps: 30 });
  assert.ok(close[0].start_s <= 3.85 + 1e-9);
  const zero = cutPlaceInserts([src('b')], new Map([['b', { start_s: 0.5, end_s: 2 }]]), { joins: [0.1], duration: 10, fps: 30 });
  assert.equal(zero[0].start_s, 0);
  // Never into the previous insert.
  const tight = new Map([['a', { start_s: 1, end_s: 4.1 }], ['b', { start_s: 4.3, end_s: 6 }]]);
  assert.throws(() => cutPlaceInserts([src('a'), src('b')], tight, { joins: [4.2], duration: 10, fps: 30 }), refused(/insert for scene "a" cannot stretch over the cut between takes at 4.2s/));
  assert.throws(() => cutPlaceInserts([src('b')], new Map([['b', { start_s: 4.3, end_s: 6 }]]), { joins: [4.2], duration: 4.31, fps: 30 }), refused(/lasts under one frame/));
  const intoPrev = new Map([['a', { start_s: 1, end_s: 4.1 }], ['b', { start_s: 4.15, end_s: 6 }]]);
  assert.throws(() => cutPlaceInserts([src('a'), src('b')], intoPrev, { joins: [4.12], duration: 10, fps: 30 }), refused(/insert for scene "a" cannot stretch/));
  const startOnly = new Map([['b', { start_s: 4.4, end_s: 6 }], ['a', { start_s: 3.8, end_s: 4.3 }]]);
  assert.throws(() => cutPlaceInserts([src('a'), src('b')], startOnly, { joins: [4.42], duration: 10, fps: 30 }), refused(/insert for scene "b" cannot start early over the cut between takes at 4.42s: it would run into the previous insert/));
  // An insert ending just before the join is still stretched first (1.0.x-style behaviour kept).
  const both = cutPlaceInserts([src('a'), src('b')], new Map([['a', { start_s: 1, end_s: 3.9 }], ['b', { start_s: 4.4, end_s: 6 }]]), { joins: [4], duration: 10, fps: 30 });
  assert.ok(both[0].stretched_s > 0 && both[1].early_s === 0);
  // When the stretch would hit the next insert, the next one starts early instead.
  const swap = cutPlaceInserts([src('a'), src('b')], new Map([['a', { start_s: 1, end_s: 3.5 }], ['b', { start_s: 4.1, end_s: 6 }]]), { joins: [4], duration: 10, fps: 30 });
  assert.ok(swap[0].stretched_s === 0 && swap[1].early_s > 0 && swap[1].start_s <= 3.85 + 1e-9);
});

test('an insert started early slows within the speed band, else plays earlier footage; still refused outside the band', () => {
  const opts = { speed: 'fill', min_speed: 0.5, max_speed: 2 };
  // 2 s window, slot grew 1.6 -> 2.15 s: 0.93x, inside the band, window unchanged.
  const slow = cutInsertRange({ early_s: 0.55 }, { from: 3, to: 5 }, 2.15, opts, 'x');
  assert.equal(slow.from, 3);
  assert.equal(slow.extended_s, 0);
  assert.ok(Math.abs(slow.speed - 2 / 2.15) < 1e-9);
  // 1 s window in a 2.6 s slot (2 s before the early start): 0.38x is too slow, so the
  // window reaches 0.3 s earlier in the recording (0.6 s at its 0.5x) and plays at 0.5x.
  const ext = cutInsertRange({ early_s: 0.6 }, { from: 3, to: 4 }, 2.6, opts, 'x');
  assert.ok(Math.abs(ext.from - 2.7) < 1e-9 && Math.abs(ext.extended_s - 0.3) < 1e-9);
  assert.ok(ext.speed >= 0.5 - 0.01 && ext.speed <= 2);
  // At a fixed speed a window too short for the longer slot reaches earlier, never before 0.
  const fixed = cutInsertRange({ early_s: 0.5 }, { from: 0.3, to: 2.5 }, 2.5, { speed: 1, min_speed: 0.5, max_speed: 2 }, 'x');
  assert.equal(fixed.from, 0);
  assert.throws(() => cutInsertRange({ early_s: 0.5 }, { from: 0.1, to: 2.1 }, 2.5, { speed: 1 }, 'x'), refused(/at 1x the 2.1s window lasts 2.1s, less than the 2.5s/));
  // No early start: refused as before.
  assert.throws(() => cutInsertRange({ early_s: 0 }, { from: 3, to: 4 }, 2.6, opts, 'x'), refused(/needs 0.38x, outside 0.5x to 2x/));
});

test('a fixed speed refuses a window too short for its slot; the size projection refuses a long cut', () => {
  assert.equal(cutSpeedFor(4, 2, { speed: 'fill', min_speed: 0.5, max_speed: 2 }, 'x'), 2);
  assert.equal(cutSpeedFor(4, 2, { speed: 1, min_speed: 0.5, max_speed: 2 }, 'x'), 1);
  assert.throws(() => cutSpeedFor(1, 2, { speed: 1 }, 'x'), refused(/at 1x the 1s window lasts 1s, less than the 2s/));
  cutCheckProjectedSize(60);
  assert.throws(() => cutCheckProjectedSize(100), refused(/over the 180 MB limit/));
});

test('review fixes: snapped inserts never overlap, a fixed speed obeys the limits, a single beat needs no dissolve length', () => {
  const src = (id) => ({ scene: { id }, kind: 'window', entry: { file: vid() } });
  // a ends at 3.84; b starts early to 3.85 over the join at 4. Frame snapping would give a 3.8667 end and a 3.8333 start.
  const [a, b] = cutPlaceInserts([src('a'), src('b')], new Map([['a', { start_s: 1, end_s: 3.84 }], ['b', { start_s: 4.1, end_s: 6 }]]), { joins: [4], duration: 10, fps: 30 });
  assert.ok(a.end_s <= b.start_s + 1e-9, `no overlap (${a.end_s} > ${b.start_s})`);
  assert.ok(b.start_s <= 4 - 0.15 + 1e-9);
  assert.throws(() => cutSpeedFor(10, 2, { speed: 4, min_speed: 0.5, max_speed: 2 }, 'scene "x"'), refused(/fixed speed 4x is outside 0.5x to 2x/));
  assert.equal(cutSpeedFor(4, 2, { speed: 2, min_speed: 0.5, max_speed: 2 }, 'scene "x"'), 2);
  const one = cutSceneSources([{ id: 'only', image: img }], []);
  const { beats } = cutPlanScenes(one, { lengths: new Map(), leadS: 0, fps: 30, still_seconds: 0.2, dissolve_frames: 30 });
  assert.equal(beats.length, 1);
  const two = cutSceneSources([{ id: 'p', image: img }, { id: 'q', image: img }], []);
  cutPlanScenes(two, { lengths: new Map(), leadS: 0, fps: 30, still_seconds: 2, dissolve_frames: 7 });
});
