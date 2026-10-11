// cut-footage 1.1.0: scenes and inserts modes, image footage, the screen look,
// and 1.0.2's band behaviour kept. Small frames keep the renders fast.
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

/** The rgb of the pixel at (x, y) of a 54 x 96 thumbnail of the frame at t. */
async function rgbAt(path, t, x = 27, y = 48) {
  const px = await framePixels(path, t, 54, 96);
  const i = (y * 54 + x) * 3;
  return [...px.data.subarray(i, i + 3)];
}

const near = (rgb, want, tol = 45) => rgb.every((c, i) => Math.abs(c - want[i]) <= tol);

test('scenes mode: a lead clip, a sped window, image footage and a scene image, with dissolves and null lines', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const lead = await solid(ctx, 'lead.mp4', 1.2, '00ff00', { width: 270, height: 480 });
  const rec = await solid(ctx, 'rec.mp4', 10, 'ff0000');
  const blue = await still(ctx, 'blue.png', '0000ff');
  const yellow = await still(ctx, 'yellow.png', 'ffff00');
  const out = await mod.run(
    {
      mode: 'scenes',
      scenes: [
        { id: 'hook', line: null, on_screen: 'wait for it', picture: null },
        { id: 's2', line: null, on_screen: 'step one', picture: null },
        { id: 's3', line: null, on_screen: null, picture: null },
        { id: 's4', line: null, on_screen: null, picture: null, image: yellow },
      ],
      footage: [
        { file: rec, asset_id: 'rec', start_ms: 0, end_ms: 4000, audio: false, scene_id: 's2' },
        { file: blue, asset_id: 'shot', start_ms: null, end_ms: null, audio: false, scene_id: 's3', kind: 'image' },
      ],
      lead: { video: lead },
      transition: { dissolve_frames: 3 },
      scene_seconds: { min: 1.8, max: 2.5 },
      still_seconds: 2,
      width: 270,
      height: 480,
      fps: 30,
    },
    ctx,
  );
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['hook', 's2', 's3', 's4']);
  const [hook, s2, s3, s4] = out.timeline.scenes;
  assert.ok(Math.abs(hook.end_s - 1.2) < 0.04, 'the lead plays at its own length');
  assert.ok(Math.abs(s2.end_s - s2.start_s - 2.5) < 0.02, 'a 4 s window is clamped to 2.5 s');
  assert.ok(Math.abs(s3.end_s - s3.start_s - 2) < 0.02 && Math.abs(s4.end_s - s4.start_s - 2) < 0.02, 'stills hold still_seconds');
  assert.equal(out.windows.find((w) => w.scene_id === 's2').speed, 1.6);
  assert.ok(Math.abs(out.seconds - (1.2 + 2.5 + 2 + 2)) < 0.05, 'dissolves keep the total length');
  const info = await probe(out.video.path);
  assert.ok(Math.abs(info.duration_s - out.seconds) < 0.1);
  assert.equal(info.width, 270);
  assert.equal(info.has_audio, false, 'scenes mode is silent');
  assert.ok(near(await rgbAt(out.video.path, 0.5), [0, 255, 0]), 'the lead is green');
  assert.ok(near(await rgbAt(out.video.path, (s2.start_s + s2.end_s) / 2), [255, 0, 0]), 'scene 2 is the red window');
  assert.ok(near(await rgbAt(out.video.path, (s3.start_s + s3.end_s) / 2), [0, 0, 255]), 'scene 3 is the blue image footage');
  assert.ok(near(await rgbAt(out.video.path, (s4.start_s + s4.end_s) / 2), [255, 255, 0]), 'scene 4 is its yellow image');
  const mid = await rgbAt(out.video.path, s3.start_s + 0.04);
  assert.ok(mid[0] > 40 && mid[2] > 40, `the dissolve mixes red into blue (${mid})`);
});

test('scenes mode, screen look: the footage sits on a dark room, tilted and masked', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const rec = await solid(ctx, 'rec.mp4', 6, 'ff0000', { width: 320, height: 640 });
  const out = await mod.run(
    {
      scenes: [{ id: 'a', line: null }, { id: 'b', line: 'second' }, { id: 'c', line: null }],
      footage: [
        { file: rec, asset_id: 'rec', start_ms: 0, end_ms: 2000, scene_id: 'a', crop: [0, 0, 1, 0.8], mask: [[0, 0, 0.5, 0.2]] },
        { file: rec, asset_id: 'rec', start_ms: 2500, end_ms: 4500, scene_id: 'b' },
        { file: await still(ctx, 'shot.png', '0000ff', 300, 600), asset_id: 'shot', kind: 'image', scene_id: 'c', fit: 'width' },
      ],
      look: 'screen',
      screen: { rot: -1, keystone: 0.024, fill: 0.8, fit: 'height', drift: 1 },
      width: 270,
      height: 480,
    },
    ctx,
  );
  assert.equal(out.timeline.scenes.length, 3);
  const c = out.timeline.scenes[2];
  assert.ok(near(await rgbAt(out.video.path, (c.start_s + c.end_s) / 2), [0, 0, 255], 70), 'a screenshot takes the screen look too');
  assert.ok((await rgbAt(out.video.path, (c.start_s + c.end_s) / 2, 1, 1)).every((v) => v < 30), 'with the room around it');
  const corner = await rgbAt(out.video.path, 1, 1, 1);
  assert.ok(corner.every((c) => c < 30), `the corner is the dark room (${corner})`);
  assert.ok(near(await rgbAt(out.video.path, 1), [255, 0, 0], 70), 'the middle is the red screen');
});

test('inserts mode: inserts at scene times over the talking track, stretched over a take join, sound kept', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const talk = await solid(ctx, 'talk.mp4', 6, '000000', { width: 270, height: 480, tone: 440 });
  const rec = await solid(ctx, 'rec.mp4', 8, 'ff0000');
  const shot = await still(ctx, 'shot.png', '0000ff');
  const timeline = {
    duration_s: 6,
    width: 270,
    height: 480,
    fps: 30,
    scenes: [
      { id: 's1', start_s: 0, end_s: 2 },
      { id: 's2', start_s: 2, end_s: 3.4 },
      { id: 's3', start_s: 3.4, end_s: 4.6 },
      { id: 's4', start_s: 4.6, end_s: 6 },
    ],
    speech: [{ scene_id: 's1', text: 'hello there', start_s: 0.1, end_s: 1.8 }],
  };
  const out = await mod.run(
    {
      video: talk,
      timeline,
      scenes: timeline.scenes.map((s) => ({ id: s.id, line: s.id === 's4' ? null : `line ${s.id}` })),
      footage: [{ file: rec, asset_id: 'rec', start_ms: 1000, end_ms: 2400, scene_id: 's2' }],
      joins: [{ id: 't1', start_s: 0 }, { id: 't2', start_s: 3.6 }],
      look: 'screen',
      screen: { rot: -0.8, alternate_rot: 0.6, keystone: 0.007, fill: 0.9, fit: 'width' },
    },
    ctx,
  );
  const w = out.windows.find((x) => x.scene_id === 's2');
  assert.ok(Math.abs(w.start_s - 2) < 0.02);
  assert.ok(w.end_s >= 3.75 - 1e-6 && w.end_s < 3.8, `the insert is stretched to end 0.15 s after the join (${w.end_s})`);
  assert.deepEqual(out.timeline, timeline, 'the talking timeline is passed through');
  const info = await probe(out.video.path);
  assert.ok(info.has_audio, 'the talking track keeps its sound');
  assert.ok(Math.abs(out.seconds - 6) < 0.05);
  assert.ok(near(await rgbAt(out.video.path, 2.7), [255, 0, 0], 70), 'the insert shows the red recording');
  assert.ok(near(await rgbAt(out.video.path, 3.7), [255, 0, 0], 70), 'the insert covers the join');
  assert.ok(near(await rgbAt(out.video.path, 1), [0, 0, 0], 20), 'before the insert, the creator');
  assert.ok(near(await rgbAt(out.video.path, 5), [0, 0, 0], 20), 'after the insert, the creator again');

  const two = await mod.run(
    {
      video: talk,
      timeline,
      scenes: [{ id: 's1', line: 'a' }, { id: 's2', line: 'b' }, { id: 's3', line: 'c', image: shot }, { id: 's4', line: null }],
      footage: [{ file: rec, asset_id: 'rec', start_ms: 1000, end_ms: 2400, scene_id: 's2' }],
    },
    ctx,
  );
  assert.deepEqual(two.windows.map((x) => x.scene_id), ['s2', 's3'], 'a scene image is an insert too');
  assert.ok(near(await rgbAt(two.video.path, 4), [0, 0, 255], 20), 'the screenshot insert, plain look, covers the frame');
});

test('inserts mode on a retimed timeline: a cutaway starting 0.4 s after a take join starts early over it; 1.2 s after is refused before any render', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const talk = await solid(ctx, 'talk.mp4', 6, '000000', { width: 270, height: 480, tone: 440 });
  const rec = await solid(ctx, 'rec.mp4', 8, 'ff0000');
  // creator-h3 starts take 2 (and scene s2) at 2.0 s; heard words moved s2's start to 2.4 s.
  const timeline = (s2Start) => ({
    duration_s: 6,
    width: 270,
    height: 480,
    fps: 30,
    scenes: [
      { id: 's1', start_s: 0, end_s: s2Start },
      { id: 's2', start_s: s2Start, end_s: 4 },
      { id: 's3', start_s: 4, end_s: 6 },
    ],
    speech: [],
  });
  const scenes = [{ id: 's1', line: 'a' }, { id: 's2', line: 'b' }, { id: 's3', line: 'c' }];
  const footage = [{ file: rec, asset_id: 'rec', start_ms: 1000, end_ms: 2600, scene_id: 's2' }];
  const joins = [{ id: 't1', start_s: 0 }, { id: 't2', start_s: 2 }];
  const out = await mod.run({ video: talk, timeline: timeline(2.4), scenes, footage, joins }, ctx);
  const w = out.windows.find((x) => x.scene_id === 's2');
  assert.ok(w.start_s <= 1.85 + 1e-6 && w.start_s > 1.8, `the insert starts 0.15 s before the join (${w.start_s})`);
  assert.ok(Math.abs(w.end_s - 4) < 0.02, 'and still ends with its scene');
  assert.ok(w.speed >= 0.5 && w.speed < 1, `the window slows inside the band (${w.speed})`);
  for (const t of [1.9, 2.0, 2.1]) assert.ok(near(await rgbAt(out.video.path, t), [255, 0, 0], 70), `the insert covers the join at ${t}s`);
  assert.ok(near(await rgbAt(out.video.path, 1.5), [0, 0, 0], 20), 'before the insert, the creator');
  assert.ok(near(await rgbAt(out.video.path, 5), [0, 0, 0], 20), 'after the insert, the creator again');
  assert.deepEqual(out.timeline, timeline(2.4), 'the talking timeline is passed through');

  const late = makeCtx({ partDir: dir });
  await assert.rejects(mod.run({ video: talk, timeline: timeline(3.2), scenes, footage, joins }, late.ctx), (e) => e.code === 'bad_input' && /cut between takes at 2s would show: no insert covers it/.test(e.message));
  const rendered = readdirSync(late.ctx.workDir, { recursive: true }).filter((f) => /\.(mp4|mov|png)$/.test(String(f)));
  assert.deepEqual(rendered, [], 'nothing was rendered before the refusal');
});

test('band mode keeps the 1.0.2 behaviour when no scenes are given', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const card = await fileRef(await makeVideo(join(ctx.workDir, 'card.mp4'), 4, { width: 270, height: 480, tone: 330, pattern: 'color=c=0x000000' }), 'video');
  const rec = await solid(ctx, 'rec.mp4', 20, 'ff0000');
  const inputs = { video: card, footage: [{ file: rec, asset_id: 'a1', start_ms: 0, end_ms: 16000, audio: false }], band: { x: 0, y: 120, width: 270, height: 240 }, speed: 'fill', min_speed: 3, max_speed: 8 };
  const now = await mod.run(inputs, ctx);
  const old = await (await loadPart('cut-footage', '1.0.2')).mod.run(inputs, makeCtx({ partDir: join(dir, '..', '1.0.2') }).ctx);
  assert.deepEqual(Object.keys(now).sort(), ['seconds', 'speed', 'video']);
  assert.equal(now.speed, old.speed);
  assert.equal(now.seconds, old.seconds);
  for (const t of [0.5, 2, 3.5]) {
    for (const y of [10, 48, 90]) assert.ok(near(await rgbAt(now.video.path, t, 27, y), await rgbAt(old.video.path, t, 27, y), 6), `frame ${t}s row ${y} matches 1.0.2`);
  }
  assert.ok((await probe(now.video.path)).has_audio, "the card's sound is kept");
});

test('refuses, in plain words and before any render: a join no insert covers, a scene with no source, and inputs from another mode', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const talk = await solid(ctx, 'talk.mp4', 6, '000000', { width: 270, height: 480, tone: 440 });
  const rec = await solid(ctx, 'rec.mp4', 12, 'ff0000');
  const timeline = { duration_s: 6, width: 270, height: 480, fps: 30, scenes: [{ id: 's1', start_s: 0, end_s: 2 }, { id: 's2', start_s: 2, end_s: 3 }, { id: 's3', start_s: 3, end_s: 6 }], speech: [] };
  const scenes = [{ id: 's1', line: 'a' }, { id: 's2', line: 'b' }, { id: 's3', line: null }];
  const footage = [{ file: rec, asset_id: 'rec', start_ms: 0, end_ms: 1000, scene_id: 's2' }];
  await assert.rejects(mod.run({ video: talk, timeline, scenes, footage, joins: [{ start_s: 0 }, { start_s: 5 }] }, ctx), (e) => e.code === 'bad_input' && /cut between takes at 5s would show/.test(e.message));
  await assert.rejects(mod.run({ mode: 'scenes', scenes, footage }, ctx), (e) => e.code === 'bad_input' && /scene "s1" has no footage window, image or lead/.test(e.message));
  await assert.rejects(mod.run({ video: talk, footage, band: { x: 0, y: 0, width: 100, height: 100 }, lead: { video: talk } }, ctx), (e) => e.code === 'bad_input' && /band mode does not use lead/.test(e.message));
  await assert.rejects(mod.run({ mode: 'scenes', scenes: [{ id: 's2' }], footage, look: 'screen', screen: { rot: 5 } }, ctx), (e) => e.code === 'bad_input' && /screen.rot 5 is outside/.test(e.message));
  await assert.rejects(
    mod.run({ mode: 'scenes', scenes: [{ id: 'a' }, { id: 'b' }], footage: [{ file: rec, asset_id: 'rec', start_ms: 4000, end_ms: 6000, scene_id: 'a' }, { file: rec, asset_id: 'rec', start_ms: 0, end_ms: 2000, scene_id: 'b' }] }, ctx),
    (e) => e.code === 'bad_input' && /goes back in the recording/.test(e.message),
  );
  await assert.rejects(
    mod.run({ mode: 'scenes', scenes: [{ id: 'a' }], footage: [{ file: rec, asset_id: 'rec', start_ms: 0, end_ms: 10000, scene_id: 'a' }], scene_seconds: { min: 1.8, max: 2.5 } }, ctx),
    (e) => e.code === 'bad_input' && /needs 4x, outside 0.5x to 2x/.test(e.message),
  );
  await assert.rejects(mod.run({ mode: 'scenes', scenes: [{ id: 'a' }], footage: Array.from({ length: 21 }, () => footage[0]) }, ctx), (e) => e.code === 'bad_input', 'more than 20 footage entries');
});
