// assemble 1.2.0 on real media: shot recipes per scene tag (a day-in-the-life cut with snap stills, sped-up
// clips, a montage, a freeze, a card video and an end card), marks, cuts snapped out of words, card_from,
// a silent scene with a null line, and refusals before any encode.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { countColor, fileRef, framePixels, hasFfmpeg, loadNewest, makeCtx, makeVideo, probe, run } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('assemble');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const W = 360;
const H = 640;

async function still(ctx, name, color) {
  const path = join(ctx.workDir, name);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${color}:s=${W}x${H}:d=1`, '-frames:v', '1', path]);
  return fileRef(path, 'image');
}
const solid = (ctx, name, color, seconds) =>
  makeVideo(join(ctx.workDir, name), seconds, { width: W, height: H, tone: 0, pattern: `color=c=${color}` }).then((p) => fileRef(p, 'video'));
const colorAt = async (path, at, rgb) => countColor(await framePixels(path, at, 36, 64), rgb, 40) > 36 * 64 * 0.9;
const spans = (rows) => rows.map(([id, start_s, end_s]) => ({ id, start_s, end_s }));
const scenesOf = (tl) => tl.scenes.map((s) => [s.id, s.start_s, s.end_s]);
const RED = [255, 0, 0];
const GREEN = [0, 128, 0];
const BLUE = [0, 0, 255];
const YELLOW = [255, 255, 0];
const WHITE = [255, 255, 255];
const CYAN = [0, 255, 255];

const products = [{ id: 'amber', name: 'Amber Frames' }, { id: 'ocean', name: 'Ocean Frames' }];
const scenes = [
  { id: 'h', picture: 'Hook: Amber Frames on slate', line: 'Meet my week.' },
  { id: 'm1', picture: 'Moment: morning coffee in Amber Frames', line: 'Amber for coffee.' },
  { id: 'm2', picture: 'Moment: the beach', line: 'Ocean frames for the sea.' },
  { id: 'pay', picture: 'Payoff: the whole day', line: 'One for every hour.' },
  { id: 'grid', picture: 'Grid: every pair with the offer', line: 'Two for one today.' },
];
const recipes = {
  Hook: [{ kind: 'still', source: 'stills', of: 'named_product', variant: 'snap', zoom: [1.0, 1.1], fill: true, mark: 'snap' }],
  Moment: [
    { kind: 'still', source: 'stills', of: 'named_product', variant: 'snap', seconds: 1.0, zoom: [1.0, 1.06], mark: 'snap', skip_first: true },
    { kind: 'clip', source: 'clips', fill: true, min_speed: 1.2, max_speed: 1.5 },
  ],
  Payoff: [
    { kind: 'montage', source: 'clips', seconds: 0.5, zoom: [1.0, 1.08], transition: 'hlslice', transition_s: 0.1 },
    { kind: 'freeze', source: 'clips', pick: 'last', zoom: [1.0, 1.03], fill: true },
  ],
  Grid: [{ kind: 'video', source: 'grid', fill: true }],
};

async function dayInTheLife(ctx, extra = {}) {
  const sources = {
    stills: [{ id: 'amber-snap', image: await still(ctx, 'amber.png', 'red') }, { id: 'ocean-snap', image: await still(ctx, 'ocean.png', 'green') }],
    clips: [{ id: 'm1', video: await solid(ctx, 'm1.mp4', 'blue', 3), seconds: 3 }, { id: 'm2', video: await solid(ctx, 'm2.mp4', 'yellow', 3), seconds: 3 }],
    grid: await solid(ctx, 'grid.mp4', 'white', 1),
  };
  return {
    scenes, products, sources, shots: recipes,
    spans: spans([['h', 0, 0.9], ['m1', 1.0, 2.9], ['m2', 3.0, 4.9], ['pay', 5.0, 7.4], ['grid', 7.5, 8.3]]),
    ending: await solid(ctx, 'end.mp4', 'cyan', 0.6),
    card_from: { tag: 'Grid' },
    width: W, height: H, fps: 30,
    ...extra,
  };
}

test('a day-in-the-life cut from shot recipes: snap stills, sped clips, a montage, a freeze, the grid card, marks and card_from', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const out = await mod.run(await dayInTheLife(ctx), ctx);
  // Scene slots: h 0-30, m1 30-90, m2 90-150, pay 150-225, grid 225-257 ((8.3 + 0.25) s), then the 18-frame end card.
  assert.deepEqual(scenesOf(out.timeline), [['h', 0, 1], ['m1', 1, 3], ['m2', 3, 5], ['pay', 5, 7.5], ['grid', 7.5, 8.567]]);
  assert.equal(out.seconds, 9.167);
  // card_from Grid: the card span (no captions) starts at the grid card, not at the end card.
  assert.deepEqual(out.timeline.end_card, { start_s: 7.5, end_s: 9.167 });
  // The hook still marks a snap; the first Moment skips its still (the hook was its snap); the second marks one.
  assert.deepEqual(out.marks, [{ kind: 'snap', at_s: 0 }, { kind: 'snap', at_s: 3 }]);
  const info = await probe(out.video.path);
  assert.ok(Math.abs(info.duration_s - 275 / 30) < 1.5 / 30, `cut is ${info.duration_s}s`);
  const p = out.video.path;
  assert.ok(await colorAt(p, 0.5, RED), 'the hook is the named product\'s snap still');
  assert.ok(await colorAt(p, 2.0, BLUE), 'moment 1 is its clip only');
  assert.ok(await colorAt(p, 3.5, GREEN), 'moment 2 opens on its product\'s snap still');
  assert.ok(await colorAt(p, 4.5, YELLOW), 'then its clip');
  assert.ok(await colorAt(p, 5.15, BLUE), 'the montage starts on a frame of the first clip used');
  assert.ok(await colorAt(p, 5.7, YELLOW), 'and moves to the second');
  assert.ok(await colorAt(p, 7.0, YELLOW), 'the freeze holds a frame of the last clip used');
  assert.ok(await colorAt(p, 8.0, WHITE), 'the grid card fills its scene');
  assert.ok(await colorAt(p, 9.0, CYAN), 'the end card follows');
});

test('snap moves a cut inside a word to the gap before it; the clips speed up within their limits', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const calls = [];
  const exec = ctx.tools.exec;
  ctx.tools.exec = (bin, args, options) => {
    if (bin === 'ffmpeg') calls.push(args);
    return exec(bin, args, options);
  };
  // The cut from moment 2's still to its clip is at 4.0 s, inside "sunglasses" (3.9-4.2 s): it moves to 3.9 s.
  const speech = [{ scene_id: 'm2', text: 'Ocean sunglasses.', start_s: 3.0, end_s: 4.2, words: [{ text: 'Ocean', start_s: 3.0, end_s: 3.5 }, { text: 'sunglasses.', start_s: 3.9, end_s: 4.2 }] }];
  const out = await mod.run(await dayInTheLife(ctx, { speech, snap: { max_shift_s: 0.4, min_shot_s: 0.55 }, grade: 'phone-grain' }), ctx);
  assert.deepEqual(out.timeline.speech, speech);
  assert.deepEqual(scenesOf(out.timeline).slice(2, 3), [['m2', 3, 5]]);
  assert.ok(await colorAt(out.video.path, 3.85, GREEN));
  assert.ok(await colorAt(out.video.path, 3.95, YELLOW), 'the clip starts at 3.9 s, not 4.0 s');
  const graph = calls.find((a) => a.includes('-filter_complex'));
  const chains = graph[graph.indexOf('-filter_complex') + 1].split(';');
  // Moment 1's clip: 3 s into 2 s wants 1.5x (inside 1.2-1.5); moment 2's: 3 s into 1.1 s is held to 1.5x.
  assert.equal(chains.filter((c) => c.includes('setpts=(PTS-STARTPTS)/1.5,')).length, 2);
  // Grain on the body before the card span only: hook, m1 clip, m2 still + clip, montage, freeze = 6 cuts; never the grid or the end card.
  assert.equal(chains.filter((c) => c.includes('noise=alls=9')).length, 6);
  assert.ok(chains.some((c) => c.includes('xfade=transition=hlslice:duration=0.1')), 'the montage frames are joined by hlslice');
  // Each piece is cut to its frames: 117 - 90 = 27 for the still, 150 - 117 = 33 for the clip.
  assert.ok(chains.some((c) => c.includes('trim=end_frame=27,')) && chains.some((c) => c.includes('trim=end_frame=33,')));
});

test('card_from with clips by scene id and no end card drawn; a tag no scene has leaves the card span alone', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const red = await solid(ctx, 'red.mp4', 'red', 2);
  const white = await solid(ctx, 'white.mp4', 'white', 2);
  const base = { clips: [{ id: 'a', video: red }, { id: 'offer', video: white }], spans: spans([['a', 0, 0.9], ['offer', 1.0, 1.5]]), width: W, height: H, fps: 30 };
  const out = await mod.run({ ...base, card_from: { scene_id: 'offer' } }, ctx);
  // The offer runs to (1.5 + 0.25) s = frame 52.5, rounded to 53.
  assert.deepEqual(out.timeline.end_card, { start_s: 1, end_s: 1.767 });
  assert.deepEqual(out.marks, []);
  const { ctx: ctx2 } = makeCtx({ partDir: dir });
  const none = await mod.run({ ...base, scenes: [{ id: 'a', picture: 'Hook: x' }, { id: 'offer', picture: 'Offer: y' }], card_from: { tag: 'Grid' } }, ctx2);
  assert.equal(none.timeline.end_card, undefined);
});

test('a scene with a null line shares its time with the voiced scene before it', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const out = await mod.run({
    scenes: [{ id: 'a', picture: 'Product: Amber Frames', line: 'Here they are.' }, { id: 'b', picture: null, line: null, on_screen: null, extra: { shot: 'Product' } }],
    products,
    sources: { stills: [{ id: 'a', image: await still(ctx, 'a.png', 'red') }, { id: 'b', image: await still(ctx, 'b.png', 'blue') }] },
    shots: { Product: [{ kind: 'still', source: 'stills' }] },
    spans: spans([['a', 0, 1.0]]),
    tail_s: 0,
    width: W, height: H,
  }, ctx);
  assert.deepEqual(scenesOf(out.timeline), [['a', 0, 0.5], ['b', 0.5, 1]]);
  assert.ok(await colorAt(out.video.path, 0.25, RED));
  assert.ok(await colorAt(out.video.path, 0.75, BLUE));
});

test('refuses shots it cannot cut, before any encode', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const inputs = await dayInTheLife(ctx);
  const omit = (obj, key) => Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));
  const bad = (change, re) => assert.rejects(mod.run({ ...inputs, ...change }, ctx), (e) => e.code === 'bad_input' && re.test(e.message));
  await bad({ shots: omit(recipes, 'Grid') }, /scene "grid" has the tag "Grid" and shots has no recipe for it/);
  await bad({ sources: omit(inputs.sources, 'grid') }, /uses source "grid", which sources does not have/);
  await bad({ sources: { ...inputs.sources, stills: [inputs.sources.stills[0]] } }, /scene "m2" shot 1 \(still\): source "stills" has no picture "ocean-snap"/);
  await bad({ sources: { ...inputs.sources, clips: [inputs.sources.clips[0]] } }, /scene "m2" shot 2 \(clip\): source "clips" has no clip for this scene/);
  await bad({ shots: { ...recipes, Hook: [{ kind: 'still', source: 'stills', of: 'first', fill: true }, { kind: 'video', source: 'grid', fill: true }] } }, /scene "h": only one shot in a recipe can fill/);
  await bad({ shots: { ...recipes, Grid: [{ kind: 'video', source: 'stills', fill: true }] } }, /source "stills" is not a video/);
  await assert.rejects(mod.run(omit(inputs, 'spans'), ctx), (e) => e.code === 'bad_input' && /shots need spans/.test(e.message));
  await bad({ clips: [{ id: 'h', video: inputs.sources.grid }] }, /give clips or shots, not both/);
  await bad({ card_from: { scene_id: 'nope' } }, /card_from names scene "nope", which is not in the plan/);
  await bad({ shots: { ...recipes, Hook: [{ kind: 'tilt', source: 'stills' }] } }, /kind/);
  await assert.rejects(mod.run({ width: W, height: H }, ctx), (e) => e.code === 'bad_input' && /give clips, or shots with sources/.test(e.message));
  await bad({ shots: { ...recipes, Grid: [{ kind: 'video', source: 'grid', fill: true, min_speed: 1.5, max_speed: 1.2 }] } }, /scene "grid" shot 1 \(video\): min_speed 1.5 is above max_speed 1.2/);
  const passed = { clips: [{ id: 'a', video: inputs.sources.grid }, { id: 'b', video: inputs.sources.grid }], timeline: { duration_s: 1, width: W, height: H, fps: 30, scenes: [], speech: [] }, snap: {}, width: W, height: H };
  await assert.rejects(mod.run(passed, ctx), (e) => e.code === 'bad_input' && /snap needs spans or shots/.test(e.message));
  assert.throws(() => statSync(join(ctx.workDir, 'assembled.mp4')), 'nothing was encoded');
});
