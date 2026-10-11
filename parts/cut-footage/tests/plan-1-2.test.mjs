// cut-footage 1.2.0's planner additions (src/plan.mjs): split slots, creator
// stretches, grid sources and grid cell speeds. Pure, no ffmpeg.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CutRefusal, cutCheckMode, cutCreatorRuns, cutGridCellSpeed, cutModeOf, cutSceneSources, cutSplitSlots } from '../src/plan.mjs';

const vid = (sha = 'a'.repeat(64)) => ({ kind: 'file', path: '/x.mp4', sha256: sha, bytes: 1, mime: 'video/mp4', media: 'video' });
const img = { kind: 'file', path: '/x.png', sha256: 'b'.repeat(64), bytes: 1, mime: 'image/png', media: 'image' };
const refused = (re) => (e) => e instanceof CutRefusal && e.code === 'bad_input' && re.test(e.message);

test('a layout picks split mode; split reads its own inputs and needs the talking track', () => {
  assert.equal(cutModeOf({ scenes: [], video: vid(), layout: {} }), 'split');
  assert.equal(cutModeOf({ scenes: [], video: vid() }), 'inserts', 'without a layout, 1.1.0 inference');
  assert.throws(() => cutCheckMode('split', { scenes: [], footage: [], video: vid(), layout: {} }), refused(/split mode needs timeline/));
  assert.throws(() => cutCheckMode('split', { scenes: [], footage: [], video: vid(), timeline: {}, lead: {} }), refused(/split mode does not use lead/));
  assert.throws(() => cutCheckMode('scenes', { scenes: [], footage: [], first_scene_look: 'blur' }), refused(/scenes mode does not use first_scene_look/));
  assert.doesNotThrow(() => cutCheckMode('inserts', { scenes: [], footage: [], video: vid(), timeline: {}, grid: {}, push_in: {}, first_scene_look: 'card', card_color: '#000000' }));
});

test('grid scenes take exactly four entries in plan order, only when a grid is asked for', () => {
  const scenes = [{ id: 'a', line: null }, { id: 'g', line: 'still not sure?', extra: { shot: 'grid' } }];
  const cells = [0, 1, 2].map((k) => ({ file: vid(), asset_id: `c${k}`, scene_id: 'g' })).concat([{ file: img, kind: 'image', asset_id: 'p', scene_id: 'g' }]);
  const out = cutSceneSources(scenes, cells, { need: 'any', grid: '2x2' });
  assert.equal(out[1].kind, 'grid');
  assert.deepEqual(out[1].entries.map((e) => e.asset_id), ['c0', 'c1', 'c2', 'p']);
  assert.equal(out[0].kind, 'none');
  assert.throws(() => cutSceneSources(scenes, cells, { need: 'any' }), refused(/more than one footage entry/), 'without grid, 1.1.0 rules');
  assert.throws(() => cutSceneSources(scenes, cells.slice(0, 3), { need: 'any', grid: '2x2' }), refused(/has 3 footage entries; a 2x2 grid needs exactly 4/));
  assert.throws(() => cutSceneSources(scenes, [{ ...cells[0], kind: 'image' }, ...cells.slice(1)], { need: 'any', grid: '2x2' }), refused(/is kind image but its file is a video/));
});

test('split beats tile with the scenes around them, in whole frames', () => {
  const tl = [{ id: 'h', start_s: 0.2, end_s: 1.5 }, { id: 'a', start_s: 1.5, end_s: 2.9 }, { id: 'b', start_s: 3.1, end_s: 4.5 }, { id: 'c', start_s: 4.5, end_s: 6 }];
  const src = (id) => ({ scene: { id }, kind: 'window' });
  const slots = cutSplitSlots([src('b'), src('a')], tl, { duration: 6, fps: 30 });
  assert.deepEqual(slots.map((s) => [s.scene.id, s.start_s, s.end_s]), [['a', 1.5, 3.1], ['b', 3.1, 4.5]]);
  const first = cutSplitSlots([src('h'), src('c')], tl, { duration: 5.99, fps: 30 });
  assert.equal(first[0].start_s, 0, 'the earliest scene starts at 0');
  assert.equal(first[1].end_s, Math.floor(5.99 * 30) / 30, 'the last runs to the end of the track');
  assert.throws(() => cutSplitSlots([src('z')], tl, { duration: 6, fps: 30 }), refused(/scene "z" has footage but no time/));
});

test('creator stretches are the gaps between covering beats', () => {
  assert.deepEqual(cutCreatorRuns([{ start_s: 1, end_s: 2 }, { start_s: 4, end_s: 5 }], 8, 30), [
    { start_s: 0, end_s: 1 },
    { start_s: 2, end_s: 4 },
    { start_s: 5, end_s: 8 },
  ]);
  assert.deepEqual(cutCreatorRuns([{ start_s: 0, end_s: 3 }, { start_s: 3, end_s: 8 }], 8, 30), [], 'back-to-back beats leave no creator');
  assert.deepEqual(cutCreatorRuns([], 4, 30), [{ start_s: 0, end_s: 4 }]);
});

test('a grid cell plays at 1x, or slowed to fill, never below min_speed', () => {
  assert.equal(cutGridCellSpeed(5, 2, 0.5, 'cell'), 1);
  assert.equal(cutGridCellSpeed(1, 2, 0.5, 'cell'), 0.5);
  assert.throws(() => cutGridCellSpeed(0.5, 2, 0.5, 'cell 1'), refused(/cell 1: a 0.5s window fills the 2s grid only at 0.25x, below 0.5x/));
});
