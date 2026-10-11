// The shot-recipe arithmetic of assemble 1.2.0 (src/shots.mjs), without ffmpeg.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleIsCutProblem } from '../src/cuts.mjs';
import { assembleCardScene, assembleMontageLengths, assembleSpeedBounds, assembleRecipeFor, assembleSceneProduct, assembleShotLengths, assembleSnapCuts, assembleWords, assembleZoom } from '../src/shots.mjs';

const fps = 30;
const refused = (fn, re) => assert.throws(fn, (e) => assembleIsCutProblem(e) && re.test(e.message));

test('a scene uses the recipe for its tag (any case or spacing), else "*", else none', () => {
  const shots = { 'Close up': [{ kind: 'still' }], Moment: [{ kind: 'clip' }], '*': [{ kind: 'video' }] };
  assert.equal(assembleRecipeFor(shots, { id: 'a', picture: 'close-up: the jar' }).key, 'Close up');
  assert.equal(assembleRecipeFor(shots, { id: 'b', picture: 'a beach', extra: { shot: 'MOMENT' } }).key, 'Moment');
  assert.equal(assembleRecipeFor(shots, { id: 'c', picture: 'Range: all of them' }).key, '*');
  assert.equal(assembleRecipeFor(shots, { id: 'd', picture: null, line: null }).key, '*');
  assert.equal(assembleRecipeFor({ Moment: [] }, { id: 'e', picture: 'Hook: x' }), null);
});

test('shots split a scene: fixed seconds first, the fill shot (else the last) takes the rest', () => {
  assert.deepEqual(assembleShotLengths([{ fixed: 30 }, { fixed: null, fill: true }], 90, { min_fill: 15, scene_id: 's' }), [30, 60]);
  assert.deepEqual(assembleShotLengths([{ fixed: null, fill: true }, { fixed: 20 }], 90, { min_fill: 15, scene_id: 's' }), [70, 20]);
  assert.deepEqual(assembleShotLengths([{ fixed: 30 }, { fixed: 30 }], 90, { min_fill: 15, scene_id: 's' }), [30, 60]);
  assert.deepEqual(assembleShotLengths([{ fixed: null, fill: true }], 7, { min_fill: 15, scene_id: 's' }), [7]);
  // 27 + 30 fixed frames in a 50-frame scene leave the fill under 15: both are squeezed by 35/57.
  assert.deepEqual(assembleShotLengths([{ fixed: 27 }, { fixed: 30 }, { fixed: null, fill: true }], 50, { min_fill: 15, scene_id: 's' }), [16, 18, 16]);
});

test('refuses two fill shots, a fixed shot with no seconds, and a scene shorter than its shots', () => {
  refused(() => assembleShotLengths([{ fixed: null, fill: true }, { fixed: null, fill: true }], 90, { min_fill: 15, scene_id: 'm1' }), /scene "m1": only one shot in a recipe can fill/);
  refused(() => assembleShotLengths([{ fixed: null }, { fixed: 10 }, { fixed: null, fill: true }], 90, { min_fill: 15, scene_id: 'm1' }), /shot 1 needs seconds/);
  refused(() => assembleShotLengths([{ fixed: 10 }, { fixed: 10 }, { fixed: null, fill: true }], 2, { min_fill: 15, scene_id: 'm1' }), /2 frame\(s\), too short for 3 shots/);
});

test('a montage shares its frames so the overlaps add back up; pieces too short to overlap are cut', () => {
  assert.deepEqual(assembleMontageLengths(27, 2, 3), { lengths: [15, 15], overlap: 3 });
  assert.deepEqual(assembleMontageLengths(41, 4, 3), { lengths: [13, 13, 12, 12], overlap: 3 });
  assert.deepEqual(assembleMontageLengths(8, 2, 6), { lengths: [4, 4], overlap: 0 });
  assert.deepEqual(assembleMontageLengths(10, 1, 3), { lengths: [10], overlap: 0 });
  refused(() => assembleMontageLengths(2, 3, 0), /needs at least 3 frames/);
});

test('snap moves a cut out of a word to the nearer edge, within max_shift_s and min_shot_s', () => {
  const words = assembleWords([{ text: 'x', start_s: 0, end_s: 9, words: [{ text: 'sunglasses', start_s: 3.9, end_s: 4.2 }, { text: 'today', start_s: 6.0, end_s: 7.0 }, { text: 'bad', start_s: 8, end_s: 8 }] }, { text: 'no words', start_s: 1, end_s: 2 }]);
  assert.deepEqual(words, [{ start_s: 3.9, end_s: 4.2 }, { start_s: 6.0, end_s: 7.0 }]);
  const opts = { fps, max_shift_s: 0.4, min_shot_s: 0.55, end_f: 300 };
  // 120 (4.0 s) is inside "sunglasses": 117 (3.9 s) is nearer than 126. 60 is in no word. 195 (6.5 s) is 15 frames
  // from either edge of "today", over the 12-frame max shift, so it stays.
  assert.deepEqual(assembleSnapCuts([60, 120, 195], words, opts), [60, 117, 195]);
  // A move that would leave the shot before it under min_shot_s is not made; the other edge is used instead.
  assert.deepEqual(assembleSnapCuts([105, 120], words, opts), [105, 126]);
  // Neither edge works: the cut stays.
  assert.deepEqual(assembleSnapCuts([110, 120, 130], words, opts), [110, 120, 130]);
  // A cut exactly on a word edge is not inside it.
  assert.deepEqual(assembleSnapCuts([117], words, opts), [117]);
});

test('zoom filters push in, pull out or hold', () => {
  assert.match(assembleZoom(360, 640, 30, 31, 1, 1.1, 'F'), /^F,zoompan=z='min\(1\+0\.00333333\*on,1\.1\)'.*:d=1:s=360x640:fps=30,setsar=1$/);
  assert.match(assembleZoom(360, 640, 30, 31, 1.1, 1, 'F', { per_input: 31 }), /z='max\(1\.1-0\.00333333\*on,1\)'.*:d=31:/);
  assert.match(assembleZoom(360, 640, 30, 31, 1.05, 1.05, 'F'), /z='1\.05'/);
});

test('card_from finds its scene by tag or id; a tag no scene has is null, an unknown id is refused', () => {
  const scenes = [{ id: 'h', picture: 'Hook: x' }, { id: 'g', picture: 'Grid: all', line: null }, { id: 'g2', picture: 'Grid: again' }];
  assert.equal(assembleCardScene({ tag: 'grid' }, scenes), 'g');
  assert.equal(assembleCardScene({ scene_id: 'g2' }, scenes), 'g2');
  assert.equal(assembleCardScene({ tag: 'Offer' }, scenes), null);
  assert.equal(assembleCardScene(null, scenes), null);
  refused(() => assembleCardScene({ scene_id: 'zz' }, scenes), /card_from names scene "zz", which is not in the plan/);
});

test("a scene's product: named in its picture, else its line, else by its place among scenes with its tag", () => {
  const products = [{ id: 'amber', name: 'Amber Frames' }, { id: 'ocean', name: 'Ocean Frames' }];
  assert.equal(assembleSceneProduct({ picture: 'Moment: beach in Ocean Frames' }, products, 0).product.id, 'ocean');
  assert.deepEqual(assembleSceneProduct({ picture: 'Moment: beach', line: 'Ocean frames for the sea.' }, products, 0), { product: products[1], how: 'line' });
  assert.deepEqual(assembleSceneProduct({ picture: 'Moment: a desk', line: null }, products, 1), { product: products[1], how: 'order' });
  assert.equal(assembleSceneProduct({ picture: 'Moment: a desk' }, products, 5), null);
});

test('speed limits: a missing one is 1, unless the given one is on its side of 1', () => {
  assert.deepEqual(assembleSpeedBounds({ min_speed: 1.2 }), [1.2, 1.2]);
  assert.deepEqual(assembleSpeedBounds({ max_speed: 1.5 }), [1, 1.5]);
  assert.deepEqual(assembleSpeedBounds({ max_speed: 0.8 }), [0.8, 0.8]);
  assert.deepEqual(assembleSpeedBounds({ min_speed: 0.7 }), [0.7, 1]);
  assert.deepEqual(assembleSpeedBounds({ min_speed: 1.2, max_speed: 1.5 }), [1.2, 1.5]);
});
