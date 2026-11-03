// cut-footage 1.2.0: split mode (creator zone, footage zone, caption zone,
// divider, photo push), the 2x2 grid in inserts mode, push-ins on creator
// stretches, the first scene's look, and 1.1.0's inserts kept when none of
// these is asked for. Small frames keep the renders fast.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, framePixels, hasFfmpeg, loadNewest, loadPart, makeCtx, makeVideo, probe, run } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('cut-footage');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';

async function solid(ctx, name, seconds, hex, { width = 320, height = 240, tone = 0 } = {}) {
  return fileRef(await makeVideo(join(ctx.workDir, name), seconds, { width, height, tone, pattern: `color=c=0x${hex}` }), 'video');
}

async function still(ctx, name, hex, width = 300, height = 200) {
  const path = join(ctx.workDir, name);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=0x${hex}:s=${width}x${height}:d=1`, '-frames:v', '1', path]);
  return fileRef(path, 'image');
}

/** A talking track: black with a white stripe down the left 10 % (so a push-in shows), and a tone. */
async function striped(ctx, name, seconds, { width = 270, height = 480 } = {}) {
  const path = join(ctx.workDir, name);
  await run('ffmpeg', [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', `color=c=black:s=${width}x${height}:r=30:d=${seconds}`,
    '-f', 'lavfi', '-i', `sine=frequency=440:duration=${seconds}:sample_rate=48000`,
    '-vf', `drawbox=x=0:y=0:w=${Math.round(width * 0.1)}:h=ih:color=white@1:t=fill`,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', path,
  ]);
  return fileRef(path, 'video');
}

/** The rgb at full-resolution pixel (x, y) of the frame at t. */
async function rgbAt(path, t, x, y, w = 270, h = 480) {
  const px = await framePixels(path, t, w, h);
  const i = (y * w + x) * 3;
  return [...px.data.subarray(i, i + 3)];
}

const near = (rgb, want, tol = 45) => rgb.every((c, i) => Math.abs(c - want[i]) <= tol);

function talkTimeline(spans, seconds = 6) {
  return { duration_s: seconds, width: 270, height: 480, fps: 30, scenes: spans.map(([id, start_s, end_s]) => ({ id, start_s, end_s })), speech: [{ scene_id: spans[0][0], text: 'hello there', start_s: 0.1, end_s: 1.5 }] };
}

test('split mode: footage above the seam, the creator below, a scene image pushed in on its corner colour, null lines, the caption zone in the creator zone', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const talk = await solid(ctx, 'talk.mp4', 6, '808080', { width: 270, height: 480, tone: 440 });
  const rec = await solid(ctx, 'rec.mp4', 8, 'ff0000');
  const tall = await still(ctx, 'tall.png', 'ff00ff', 100, 400);
  // A gap between s2 and s3 (2.9 to 3.1): the split beat runs on to s3's start, so no creator frame flashes.
  const timeline = talkTimeline([['hook', 0, 1.5], ['s2', 1.5, 2.9], ['s3', 3.1, 4.5], ['s4', 4.5, 6]]);
  const out = await mod.run(
    {
      mode: 'split',
      video: talk,
      timeline: { ...timeline, safe_zones: [{ use: 'logo', x: 10, y: 10, w: 40, h: 20 }] },
      scenes: [
        { id: 'hook', line: 'look at this' },
        { id: 's2', line: 'it does the thing', picture: null },
        { id: 's3', line: null, on_screen: null, picture: null, image: tall },
        { id: 's4', line: null },
      ],
      footage: [{ file: rec, asset_id: 'rec', start_ms: 0, end_ms: 2400, scene_id: 's2' }],
      layout: { side: 'bottom', seam: 192, bg: 'auto', head: 0.3, divider: '#00FF00', divider_px: 4 },
      fit: 'width',
    },
    ctx,
  );
  assert.deepEqual(out.windows.map((w) => w.scene_id), ['s2', 's3']);
  const [w2, w3] = out.windows;
  assert.ok(Math.abs(w2.start_s - 1.5) < 0.02 && Math.abs(w2.end_s - 3.1) < 0.02, `s2 runs to s3's start (${w2.start_s}-${w2.end_s})`);
  assert.ok(Math.abs(w2.speed - 1.5) < 0.01, `a 2.4 s window fills 1.6 s at 1.5x (${w2.speed})`);
  assert.ok(Math.abs(w3.start_s - 3.1) < 0.02 && Math.abs(w3.end_s - 4.5) < 0.02);
  assert.deepEqual(out.timeline.scenes, timeline.scenes, 'scene times pass through');
  assert.deepEqual(out.timeline.safe_zones, [{ use: 'logo', x: 10, y: 10, w: 40, h: 20 }, { use: 'captions', x: 0, y: 192, w: 270, h: 288 }], 'the caption zone is the creator zone; other zones are kept');
  const info = await probe(out.video.path);
  assert.ok(info.has_audio, 'the talking track keeps its sound');
  assert.equal(info.width, 270);
  assert.ok(Math.abs(info.duration_s - 6) < 0.1);
  // Hook: the creator full frame.
  assert.ok(near(await rgbAt(out.video.path, 0.7, 135, 60), [128, 128, 128], 20), 'the hook shows the creator full frame, top too');
  // s2: red above the seam, the creator below, the divider on the seam.
  assert.ok(near(await rgbAt(out.video.path, 2.2, 135, 90), [255, 0, 0], 60), 'footage above the seam');
  assert.ok(near(await rgbAt(out.video.path, 2.2, 135, 350), [128, 128, 128], 20), 'creator below the seam');
  assert.ok(near(await rgbAt(out.video.path, 2.2, 135, 192), [0, 255, 0], 70), 'the divider bar sits on the seam');
  assert.ok(near(await rgbAt(out.video.path, 3.0, 135, 90), [255, 0, 0], 60), 'still split in the gap before s3 (no creator flash)');
  // s3: the tall magenta picture fitted whole, with its own corner colour beside it (bg auto), no divider gap.
  assert.ok(near(await rgbAt(out.video.path, 3.8, 135, 90), [255, 0, 255], 60), 'the scene image above the seam');
  assert.ok(near(await rgbAt(out.video.path, 3.8, 6, 90), [255, 0, 255], 60), 'bg auto fills beside it with its corner colour, not black');
  // s4 (null line, no footage): the creator full frame again.
  assert.ok(near(await rgbAt(out.video.path, 5.3, 135, 60), [128, 128, 128], 20), 'the last scene is the creator full frame');
});

test('split mode, creator on top with a ratio seam, cover fit, blur on the first scene and a push-in on a long creator stretch', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const talk = await striped(ctx, 'talk.mp4', 7);
  const rec = await solid(ctx, 'rec.mp4', 4, '0000ff');
  const timeline = talkTimeline([['hook', 0, 1.2], ['s2', 1.2, 2.4], ['s3', 2.4, 7]], 7);
  const out = await mod.run(
    {
      video: talk,
      timeline,
      scenes: [{ id: 'hook', line: 'hi' }, { id: 's2', line: 'see' }, { id: 's3', line: 'and the rest of it' }],
      footage: [{ file: rec, asset_id: 'rec', start_ms: 0, end_ms: 1200, scene_id: 's2', fit: 'cover' }],
      layout: { side: 'top', seam: 0.5 },
      push_in: { min_hold_s: 3, amount: 0.15 },
      first_scene_look: 'blur',
    },
    ctx,
  );
  assert.deepEqual(out.timeline.safe_zones, [{ use: 'captions', x: 0, y: 0, w: 270, h: 240 }], 'creator on top: the caption zone is the top half');
  assert.ok(near(await rgbAt(out.video.path, 1.8, 135, 360), [0, 0, 255], 40), 'footage below the seam');
  const hook = await rgbAt(out.video.path, 0.4, 27, 120);
  assert.ok(hook[0] > 20 && hook[0] < 200, `the first scene is blurred: the stripe's edge is soft (${hook})`);
  assert.ok(near(await rgbAt(out.video.path, 1.3, 27, 120), [0, 0, 0], 30), 'and sharp again after the first scene');
  assert.ok(near(await rgbAt(out.video.path, 2.6, 15, 120), [255, 255, 255], 40), 'the stripe is sharp and in frame when s3 starts');
  assert.ok(near(await rgbAt(out.video.path, 6.8, 15, 120), [0, 0, 0], 40), 'by the end of the 4.6 s stretch the push-in has moved the stripe out');

  const screen = await mod.run(
    {
      video: talk,
      timeline,
      scenes: [{ id: 'hook', line: 'hi' }, { id: 's2', line: 'see' }, { id: 's3', line: null }],
      footage: [{ file: rec, asset_id: 'rec', start_ms: 0, end_ms: 1200, scene_id: 's2' }],
      layout: { side: 'top', seam: 0.5 },
      look: 'screen',
      screen: { rot: -0.8, keystone: 0.007, fill: 0.8, fit: 'width', drift: 1 },
    },
    ctx,
  );
  assert.ok(near(await rgbAt(screen.video.path, 1.8, 135, 360), [0, 0, 255], 70), 'screen look: the footage screen in the footage zone');
  assert.ok((await rgbAt(screen.video.path, 1.8, 2, 245)).every((v) => v < 40), 'with the dark room around it');
  assert.ok(near(await rgbAt(screen.video.path, 1.8, 135, 120), [0, 0, 0], 30), 'and the creator above');
});

test('inserts mode: a 2x2 grid of two clips and two pictures, a card on the first scene, a push-in after the grid', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const talk = await striped(ctx, 'talk.mp4', 8);
  const red = await solid(ctx, 'red.mp4', 6, 'ff0000');
  const green = await solid(ctx, 'green.mp4', 1, '00ff00');
  const blue = await still(ctx, 'blue.png', '0000ff');
  const yellow = await still(ctx, 'yellow.png', 'ffff00', 200, 300);
  const timeline = talkTimeline([['hook', 0, 1.5], ['grid', 1.5, 3.5], ['close', 3.5, 8]], 8);
  const out = await mod.run(
    {
      video: talk,
      timeline,
      scenes: [{ id: 'hook', line: 'why trust us?' }, { id: 'grid', line: 'still not sure?', extra: { shot: 'grid' } }, { id: 'close', line: 'try it' }],
      footage: [
        { file: red, asset_id: 'red', start_ms: 500, end_ms: 6000, scene_id: 'grid' },
        { file: green, asset_id: 'green', start_ms: 0, end_ms: 1000, scene_id: 'grid' },
        { file: blue, asset_id: 'blue', kind: 'image', scene_id: 'grid' },
        { file: yellow, asset_id: 'yellow', kind: 'image', scene_id: 'grid' },
      ],
      grid: { layout: '2x2', still_zoom: 0.04 },
      push_in: { min_hold_s: 3, amount: 0.15 },
      first_scene_look: 'card',
      card_color: '#FF00FF',
    },
    ctx,
  );
  assert.deepEqual(out.windows, [{ scene_id: 'grid', start_s: 1.5, end_s: 3.5, speed: 1 }]);
  assert.deepEqual(out.timeline, timeline, 'the timeline passes through');
  assert.ok(near(await rgbAt(out.video.path, 0.7, 135, 240), [255, 0, 255], 30), 'the first scene is the card');
  assert.ok(near(await rgbAt(out.video.path, 2.5, 60, 100), [255, 0, 0], 60), 'top-left cell: the red clip');
  assert.ok(near(await rgbAt(out.video.path, 2.5, 200, 100), [0, 255, 0], 60), 'top-right cell: the short green clip, slowed to fill');
  assert.ok(near(await rgbAt(out.video.path, 3.3, 200, 100), [0, 255, 0], 60), 'and still there at the end of the grid');
  assert.ok(near(await rgbAt(out.video.path, 2.5, 60, 360), [0, 0, 255], 60), 'bottom-left cell: the blue picture');
  assert.ok(near(await rgbAt(out.video.path, 2.5, 200, 360), [255, 255, 0], 60), 'bottom-right cell: the yellow picture, cover-cropped');
  assert.ok(near(await rgbAt(out.video.path, 3.7, 15, 240), [255, 255, 255], 40), 'the closer starts unzoomed');
  assert.ok(near(await rgbAt(out.video.path, 7.8, 15, 240), [0, 0, 0], 40), 'and is pushed in by its end');
  assert.ok((await probe(out.video.path)).has_audio);
});

test('inserts mode with none of the 1.2.0 options renders as 1.1.0 did', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const talk = await striped(ctx, 'talk.mp4', 4);
  const rec = await solid(ctx, 'rec.mp4', 6, 'ff0000');
  const timeline = talkTimeline([['s1', 0, 1.5], ['s2', 1.5, 2.8], ['s3', 2.8, 4]], 4);
  const inputs = { video: talk, timeline, scenes: [{ id: 's1', line: 'a' }, { id: 's2', line: 'b' }, { id: 's3', line: null }], footage: [{ file: rec, asset_id: 'rec', start_ms: 1000, end_ms: 2300, scene_id: 's2' }] };
  const now = await mod.run(inputs, ctx);
  const old = await (await loadPart('cut-footage', '1.1.0')).mod.run(inputs, makeCtx({ partDir: join(dir, '..', '1.1.0') }).ctx);
  assert.deepEqual(now.windows, old.windows);
  assert.deepEqual(now.timeline, old.timeline);
  for (const t of [0.5, 2, 3.5]) for (const [x, y] of [[13, 240], [135, 240]]) assert.ok(near(await rgbAt(now.video.path, t, x, y), await rgbAt(old.video.path, t, x, y), 6), `frame ${t}s at ${x},${y} matches 1.1.0`);
});

test('inserts mode on a retimed timeline: a window insert and a grid starting just after their take joins start early over them, as in 1.1.0; a push-in stops at the early start', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const talk = await striped(ctx, 'talk.mp4', 8);
  const red = await solid(ctx, 'red.mp4', 8, 'ff0000');
  const green = await solid(ctx, 'green.mp4', 4, '00ff00');
  const blue = await still(ctx, 'blue.png', '0000ff');
  const yellow = await still(ctx, 'yellow.png', 'ffff00', 200, 300);
  // creator-h3 starts takes 2 and 3 at 2.0 s and 5.0 s; heard words moved s2 to 2.4 s and the grid to 5.3 s.
  // s2 ends 1.2 s before the second join, too far to stretch over it, so the grid must start early.
  const timeline = talkTimeline([['s1', 0, 2.4], ['s2', 2.4, 3.8], ['s3', 3.8, 5.3], ['grid', 5.3, 7], ['s5', 7, 8]], 8);
  const scenes = [{ id: 's1', line: 'a' }, { id: 's2', line: 'b' }, { id: 's3', line: null }, { id: 'grid', line: 'd', extra: { shot: 'grid' } }, { id: 's5', line: 'e' }];
  const joins = [{ id: 't1', start_s: 0 }, { id: 't2', start_s: 2 }, { id: 't3', start_s: 5 }];
  const s2 = { file: red, asset_id: 'red', start_ms: 1000, end_ms: 2600, scene_id: 's2' };
  const cells = [
    { file: red, asset_id: 'red', start_ms: 4000, end_ms: 7000, scene_id: 'grid' },
    { file: green, asset_id: 'green', start_ms: 0, end_ms: 3000, scene_id: 'grid' },
    { file: blue, asset_id: 'blue', kind: 'image', scene_id: 'grid' },
    { file: yellow, asset_id: 'yellow', kind: 'image', scene_id: 'grid' },
  ];
  const out = await mod.run({ video: talk, timeline, scenes, footage: [s2, ...cells], joins, grid: { layout: '2x2' }, push_in: { min_hold_s: 1.5, amount: 0.15 } }, ctx);
  const w = out.windows.find((x) => x.scene_id === 's2');
  assert.ok(w.start_s <= 1.85 + 1e-6 && w.start_s > 1.8, `the insert starts 0.15 s before the join (${w.start_s})`);
  assert.ok(w.speed >= 0.5 && w.speed < 1, `its window slows inside the band (${w.speed})`);
  const g = out.windows.find((x) => x.scene_id === 'grid');
  assert.ok(g.start_s <= 4.85 + 1e-6 && g.start_s > 4.8, `the grid starts 0.15 s before its join (${g.start_s})`);
  assert.ok(Math.abs(g.end_s - 7) < 0.02, 'and still ends with its scene');
  for (const t of [1.9, 2.0, 2.1]) assert.ok(near(await rgbAt(out.video.path, t, 135, 240), [255, 0, 0], 70), `the insert covers the join at ${t}s`);
  for (const t of [4.9, 5.0, 5.1]) assert.ok(near(await rgbAt(out.video.path, t, 200, 100), [0, 255, 0], 70), `the grid covers the join at ${t}s`);
  assert.ok(near(await rgbAt(out.video.path, 0.1, 20, 240), [255, 255, 255], 40), 'the first creator stretch starts unzoomed');
  assert.ok(near(await rgbAt(out.video.path, 1.75, 20, 240), [0, 0, 0], 40), 'and is pushed in by the insert\'s early start');
  assert.deepEqual(out.timeline, timeline, 'the talking timeline is passed through');

  const plainInputs = { video: talk, timeline, scenes: scenes.map((s) => ({ id: s.id, line: s.line })), footage: [s2], joins: joins.slice(0, 2) };
  const now = await mod.run(plainInputs, makeCtx({ partDir: dir }).ctx);
  const old = await (await loadPart('cut-footage', '1.1.0')).mod.run(plainInputs, makeCtx({ partDir: join(dir, '..', '1.1.0') }).ctx);
  assert.deepEqual(now.windows, old.windows, 'without 1.2.0 options the early start matches 1.1.0');

  const late = makeCtx({ partDir: dir });
  const lateTimeline = talkTimeline([['s1', 0, 2.4], ['s2', 2.4, 3.8], ['s3', 3.8, 6.2], ['grid', 6.2, 7], ['s5', 7, 8]], 8);
  await assert.rejects(
    mod.run({ video: talk, timeline: lateTimeline, scenes, footage: [s2, ...cells], joins, grid: { layout: '2x2' } }, late.ctx),
    (e) => e.code === 'bad_input' && /cut between takes at 5s would show: no insert covers it/.test(e.message),
  );
  const rendered = readdirSync(late.ctx.workDir, { recursive: true }).filter((f) => /\.(mp4|mov|png)$/.test(String(f)));
  assert.deepEqual(rendered, [], 'nothing was rendered before the refusal');
});

test('refuses, in plain words and before any render: a short grid, a seam outside the frame, inputs split does not use, a grid cell too short, a bad card colour', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const talk = await solid(ctx, 'talk.mp4', 4, '000000', { width: 270, height: 480, tone: 440 });
  const rec = await solid(ctx, 'rec.mp4', 6, 'ff0000');
  const timeline = talkTimeline([['a', 0, 2], ['g', 2, 4]], 4);
  const scenes = [{ id: 'a', line: 'a' }, { id: 'g', line: null, extra: { shot: 'grid' } }];
  const cell = (start, end) => ({ file: rec, asset_id: 'rec', start_ms: start, end_ms: end, scene_id: 'g' });
  await assert.rejects(
    mod.run({ video: talk, timeline, scenes, footage: [cell(0, 2000), cell(2000, 4000), cell(4000, 6000)], grid: { layout: '2x2' } }, ctx),
    (e) => e.code === 'bad_input' && /grid scene "g" has 3 footage entries; a 2x2 grid needs exactly 4/.test(e.message),
  );
  await assert.rejects(
    mod.run({ video: talk, timeline, scenes, footage: [cell(0, 1500), cell(1000, 2500), cell(3000, 4500), cell(4500, 6000)], grid: {} }, ctx),
    (e) => e.code === 'bad_input' && /show the same part of the recording/.test(e.message),
    'two grid cells on the same seconds of a recording',
  );
  await assert.rejects(
    mod.run({ video: talk, timeline, scenes, footage: [cell(0, 500), cell(1000, 2000), cell(2000, 3000), cell(3000, 4000)], grid: {} }, ctx),
    (e) => e.code === 'bad_input' && /cell 1: a 0.5s window fills the 2s grid only at 0.25x, below 0.5x/.test(e.message),
  );
  const plain = [{ id: 'a', line: 'a' }, { id: 'g', line: null }];
  await assert.rejects(
    mod.run({ video: talk, timeline, scenes: plain, footage: [cell(0, 2000)], layout: { seam: 600 } }, ctx),
    (e) => e.code === 'bad_input' && /seam row 600 is outside the 480 px frame/.test(e.message),
  );
  await assert.rejects(
    mod.run({ video: talk, timeline, scenes: plain, footage: [cell(0, 2000)], layout: {}, joins: [{ start_s: 0 }] }, ctx),
    (e) => e.code === 'bad_input' && /split mode does not use joins/.test(e.message),
  );
  await assert.rejects(
    mod.run({ video: talk, timeline, scenes: plain, footage: [cell(0, 2000)], layout: {}, grid: {} }, ctx),
    (e) => e.code === 'bad_input' && /split mode does not use grid/.test(e.message),
  );
  await assert.rejects(mod.run({ video: talk, timeline, scenes: plain, footage: [cell(0, 2000)], first_scene_look: 'card', card_color: 'purple' }, ctx), (e) => e.code === 'bad_input', 'a card colour that is not #RRGGBB');
  await assert.rejects(
    mod.run({ mode: 'scenes', scenes: plain, footage: [cell(0, 2000)], push_in: { amount: 0.05 } }, ctx),
    (e) => e.code === 'bad_input' && /scenes mode does not use push_in/.test(e.message),
  );  // An empty plan.footage passes the schema (split and scenes can run without it); band refuses it in plain words.
  await assert.rejects(
    mod.run({ video: talk, footage: [], band: { x: 0, y: 0, width: 100, height: 100 } }, ctx),
    (e) => e.code === 'bad_input' && /band mode needs a footage entry/.test(e.message),
  );
  // The screen block is checked by the schema with screen-look's own keys and ranges.
  await assert.rejects(mod.run({ mode: 'scenes', scenes: plain, footage: [cell(0, 2000)], look: 'screen', screen: { tilt: 1 } }, ctx), (e) => e.code === 'bad_input' && /screen/.test(e.message));
  await assert.rejects(mod.run({ mode: 'scenes', scenes: plain, footage: [cell(0, 2000)], look: 'screen', screen: { keystone: 0.2 } }, ctx), (e) => e.code === 'bad_input' && /screen\.keystone/.test(e.message));
});

test('split mode with an empty plan.footage shows the creator full frame and still names the caption zone', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const talk = await striped(ctx, 'talk.mp4', 2);
  const timeline = talkTimeline([['a', 0, 1], ['b', 1, 2]], 2);
  const out = await mod.run({ video: talk, timeline, scenes: [{ id: 'a', line: 'a' }, { id: 'b', line: 'b' }], footage: [], layout: { seam: 0.4 } }, ctx);
  assert.deepEqual(out.windows, []);
  assert.ok(near(await rgbAt(out.video.path, 0.5, 5, 50), [255, 255, 255]), 'the creator stripe shows full frame');
  const zone = out.timeline.safe_zones.find((z) => z.use === 'captions');
  assert.ok(zone && zone.y > 0 && zone.y + zone.h === 480, 'the caption zone is the creator zone (bottom)');
});

test('scenes mode: a beat that dissolves holds its last frame, so nothing past end_ms shows in the fade', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  // A recording that is red for 1 s, then blue: the window is the red second only.
  const path = join(ctx.workDir, 'redblue.mp4');
  await run('ffmpeg', [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'color=c=red:s=320x240:r=30:d=1',
    '-f', 'lavfi', '-i', 'color=c=blue:s=320x240:r=30:d=2',
    '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v]', '-map', '[v]',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', path,
  ]);
  const rec = await fileRef(path, 'video');
  const green = await still(ctx, 'green.png', '00ff00');
  const out = await mod.run({
    mode: 'scenes',
    scenes: [{ id: 'a', line: null }, { id: 'b', line: null, image: green }],
    footage: [{ file: rec, asset_id: 'rec', scene_id: 'a', start_ms: 0, end_ms: 1000 }],
    transition: { dissolve_frames: 15 },
    still_seconds: 1,
    width: 270,
    height: 480,
  }, ctx);
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['a', 'b']);
  const rgb = await rgbAt(out.video.path, 1.07, 135, 240);
  assert.ok(rgb[0] > 140 && rgb[2] < 80, `the fade starts from the held red frame, not the blue past end_ms (got ${rgb})`);
});
