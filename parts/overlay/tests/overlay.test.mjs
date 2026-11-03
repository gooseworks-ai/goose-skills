import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileRef, framePixels, hasFfmpeg, levelDb, loadNewest, makeCtx, makeLogo, makeVideo, probe, run } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('overlay');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';

// Pixels inside a box that read as the given colour family, on a full-size frame.
async function countIn(path, atS, W, H, { x0, y0, x1, y1 }, want) {
  const px = await framePixels(path, atS, W, H);
  let n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 3;
      if (want(px.data[i], px.data[i + 1], px.data[i + 2])) n++;
    }
  }
  return n;
}
const red = (r, g, b) => r > 150 && g < 90 && b < 110;
const green = (r, g, b) => g > 120 && g > r + 60 && g > b + 30;

async function blueCut(ctx, seconds, W = 540, H = 960) {
  return fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), seconds, { width: W, height: H, fps: 30, tone: 440, pattern: 'color=c=0x2040a0' }), 'video');
}
const timelineOf = (seconds, extra = {}) => ({ duration_s: seconds, width: 540, height: 960, fps: 30, scenes: [], speech: [], ...extra });

test('a corner logo stays top right until the end card, the sound and timeline pass through, and the encode is capped', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const execArgs = [];
  const exec = ctx.tools.exec;
  ctx.tools.exec = (bin, args, options) => {
    execArgs.push([bin, args]);
    return exec(bin, args, options);
  };
  const video = await blueCut(ctx, 3);
  const logo = await fileRef(await makeLogo(join(ctx.workDir, 'logo.png'), '#e01020'), 'image');
  const timeline = timelineOf(3, { scenes: [{ id: 'a', start_s: 0, end_s: 2 }, { id: 'card', start_s: 2, end_s: 3 }], end_card: { start_s: 2, end_s: 3 } });
  const out = await mod.run({ video, timeline, items: [{ image: logo, corner: 'top_right', width_px: 165, margin_px: 40, opacity: 0.9, until: 'end_card' }] }, ctx);
  assert.deepEqual(out.timeline, timeline);
  const info = await probe(out.video.path);
  assert.deepEqual([info.width, info.height, info.has_audio, info.audio_codec], [540, 960, true, 'aac']);
  assert.ok(Math.abs(info.duration_s - 3) < 0.1, `the video is ${info.duration_s}s`);
  assert.ok((await levelDb(out.video.path, 0.5, 1.5)) > -30, 'the sound is kept');
  // 165 px at a 1080 short side = 83 px here, 20 px from the top and right edges.
  const corner = { x0: 437, y0: 20, x1: 520, y1: 62 };
  assert.ok((await countIn(out.video.path, 1, 540, 960, corner, red)) > 1500, 'the logo is drawn in the corner');
  assert.equal(await countIn(out.video.path, 1, 540, 960, { x0: 0, y0: 100, x1: 540, y1: 960 }, red), 0, 'nothing is drawn elsewhere');
  assert.equal(await countIn(out.video.path, 2.5, 540, 960, corner, red), 0, 'the logo is gone under the end card');
  const encode = execArgs.find(([bin, args]) => bin === 'ffmpeg' && args.includes('-filter_complex'))[1];
  const at = encode.indexOf('-maxrate');
  assert.deepEqual(encode.slice(at, at + 4), ['-maxrate', '16M', '-bufsize', '32M']);
});

test('product_of_scene lays the named product over its scenes (null lines included), scaling in once across touching scenes', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const video = await blueCut(ctx, 4);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=#10d040:s=300x600:d=1', '-frames:v', '1', join(ctx.workDir, 'box.png')]);
  const boxPhoto = await fileRef(join(ctx.workDir, 'box.png'), 'image');
  const scenes = [
    { id: 's1', line: 'Meet Maya.', on_screen: null, picture: 'Maya waves at the camera' },
    { id: 's2', line: null, on_screen: null, picture: 'Product: the Glow Serum on a glowing pedestal' },
    { id: 's3', line: 'It glows.', picture: 'The Glow Serum, close' },
    { id: 's4', line: null, on_screen: null, picture: null },
  ];
  const timeline = timelineOf(4, { scenes: scenes.map((s, i) => ({ id: s.id, start_s: i, end_s: i + 1 })) });
  const out = await mod.run(
    { video, timeline, scenes, products: [{ id: 'serum', name: 'Glow Serum', images: [boxPhoto] }], items: [{ image: 'product_of_scene', scenes: 'naming_product', scale_in_s: 0.3 }] },
    ctx,
  );
  const whole = { x0: 0, y0: 0, x1: 540, y1: 960 };
  const at = async (t) => countIn(out.video.path, t, 540, 960, whole, green);
  assert.equal(await at(0.5), 0, 'nothing over the first scene');
  const early = await at(1.2);
  const full = await at(1.6);
  // Centre default: no taller than half of 960 -> 240 x 480 = 115200 px.
  assert.ok(full > 100000 && full < 120000, `the box fills its full size (${full} px)`);
  assert.ok(early > 0 && early < full * 0.95, `the box scales in (${early} px at 1.2 s)`);
  const next = await at(2.05);
  assert.ok(Math.abs(next - full) < full * 0.02, `the box does not scale in again on the next scene (${next} px)`);
  assert.equal(await at(3.5), 0, 'nothing over the last scene');
  const windows = logs.find(([, m]) => m === 'overlay windows')[2].windows;
  assert.deepEqual(windows.map((w) => [w.start_s, w.end_s]), [[1, 3]]);
});

test('nothing to draw passes the cut through with a warning', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const video = await blueCut(ctx, 1);
  const timeline = timelineOf(1, { scenes: [{ id: 's1', start_s: 0, end_s: 1 }] });
  const out = await mod.run(
    { video, timeline, scenes: [{ id: 's1', line: null, picture: 'a beach at dusk' }], products: [{ id: 'serum', name: 'Glow Serum', images: [] }], items: [{ image: 'product_of_scene', scenes: 'naming_product' }] },
    ctx,
  );
  assert.equal(out.video, video);
  assert.ok(logs.some(([level, m]) => level === 'warn' && /no scene names a product/.test(m)));
});

test('an item whose picture binding resolved to nothing (a brand with no logo) is skipped, not refused', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const video = await blueCut(ctx, 1);
  const timeline = timelineOf(1, { scenes: [{ id: 's1', start_s: 0, end_s: 1 }] });
  const out = await mod.run({ video, timeline, items: [{ corner: 'top_right', width_px: 165, margin_px: 40, opacity: 0.9, until: 'end_card' }] }, ctx);
  assert.equal(out.video, video);
  assert.deepEqual(out.timeline, timeline);
  assert.ok(logs.some(([level, m]) => level === 'warn' && /no picture/.test(m)));
  const nulled = await mod.run({ video, timeline, items: [{ image: null, corner: 'top_right' }] }, ctx);
  assert.equal(nulled.video, video);
});

test('a picture ffmpeg cannot draw (an SVG logo) is skipped with a warning, and the others still draw', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const video = await blueCut(ctx, 1);
  const logo = await fileRef(await makeLogo(join(ctx.workDir, 'logo.png'), '#e01020'), 'image');
  const svg = { ...logo, sha256: 'f'.repeat(64), mime: 'image/svg+xml' };
  const timeline = timelineOf(1);
  const only = await mod.run({ video, timeline, items: [{ image: svg, corner: 'top_right' }] }, ctx);
  assert.equal(only.video, video);
  assert.ok(logs.some(([level, m]) => level === 'warn' && /image\/svg\+xml; overlay draws PNG, JPEG or WebP/.test(m)));
  const both = await mod.run({ video, timeline, items: [{ image: svg, corner: 'top_left' }, { image: logo, corner: 'top_right', width_px: 165 }] }, ctx);
  assert.notEqual(both.video, video);
  assert.ok((await countIn(both.video.path, 0.5, 540, 960, { x0: 437, y0: 20, x1: 520, y1: 62 }, red)) > 1500, 'the PNG logo is drawn');
  assert.equal(await countIn(both.video.path, 0.5, 540, 960, { x0: 0, y0: 0, x1: 120, y1: 120 }, red), 0, 'the SVG is not');
});

test('empty scenes or products lists draw nothing instead of refusing', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await blueCut(ctx, 1);
  const timeline = timelineOf(1);
  const items = [{ image: 'product_of_scene', scenes: 'naming_product' }];
  assert.equal((await mod.run({ video, timeline, scenes: [], products: [], items }, ctx)).video, video);
  assert.equal((await mod.run({ video, timeline, scenes: [{ id: 's1', picture: 'the Glow Serum' }], products: [], items }, ctx)).video, video);
});

test('a pass-through over 180 MB is refused too', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = { ...(await blueCut(ctx, 1)), bytes: 181 * 1024 * 1024 };
  await assert.rejects(mod.run({ video, timeline: timelineOf(1), items: [{ corner: 'top_right' }] }, ctx), (e) => e.code === 'output_invalid' && /180/.test(e.message));
});

test('refuses what it cannot draw, before any encode', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await blueCut(ctx, 2);
  const logo = await fileRef(await makeLogo(join(ctx.workDir, 'logo.png'), '#e01020'), 'image');
  const timeline = timelineOf(2, { scenes: [{ id: 's1', start_s: 0, end_s: 2 }] });
  const scenes = [{ id: 's1', line: null, picture: 'the Glow Serum' }];
  const bad = (inputs, re) => assert.rejects(mod.run({ video, timeline, ...inputs }, ctx), (e) => e.code === 'bad_input' && re.test(e.message));
  await bad({ items: [{ image: 'product_of_scene' }] }, /needs scenes "naming_product"/);
  await bad({ scenes, products: [{ id: 'serum', name: 'Glow Serum' }], items: [{ image: 'product_of_scene', scenes: 'naming_product' }] }, /has no photo/);
  await bad({ items: [{ image: logo, from_s: 1.5, to_s: 1 }] }, /before it starts/);
  await bad({ items: [{ image: logo, corner: 'middle' }] }, /corner/);
  await bad({ items: [] }, /items/);
});

test('refuses an output over 180 MB', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await blueCut(ctx, 1);
  const logo = await fileRef(await makeLogo(join(ctx.workDir, 'logo.png'), '#e01020'), 'image');
  const file = ctx.file;
  ctx.file = async (rel, media) => ({ ...(await file(rel, media)), bytes: 181 * 1024 * 1024 });
  await assert.rejects(mod.run({ video, timeline: timelineOf(1), items: [{ image: logo, corner: 'bottom_left' }] }, ctx), (e) => e.code === 'output_invalid' && /180/.test(e.message));
});
