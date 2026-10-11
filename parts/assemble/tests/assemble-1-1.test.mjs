// assemble 1.1.0 on real media: pictures timed to a voice, silent scenes, Ken Burns, the end card over the
// last span or after the cut, a timeline passed through, refusals, the size rule and the grain bitrate cap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { countColor, fileRef, framePixels, hasFfmpeg, levelDb, loadNewest, makeCtx, makeVideo, probe, run } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('assemble');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const W = 360;
const H = 640;

async function still(path, source) {
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', source, '-frames:v', '1', path]);
  return fileRef(path, 'image');
}
const solid = (ctx, name, color, seconds, size = `${W}x${H}`) =>
  makeVideo(join(ctx.workDir, name), seconds, { width: +size.split('x')[0], height: +size.split('x')[1], tone: 0, pattern: `color=c=${color}` }).then((p) => fileRef(p, 'video'));
const isColor = async (path, at, rgb) => countColor(await framePixels(path, at, 36, 64), rgb, 40) > 36 * 64 * 0.9;
const meanDiff = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.data.length; i++) s += Math.abs(a.data[i] - b.data[i]);
  return s / a.data.length;
};
const spans = (rows) => rows.map(([id, start_s, end_s]) => ({ id, start_s, end_s }));
const scenesOf = (tl) => tl.scenes.map((s) => [s.id, s.start_s, s.end_s]);

test('times each picture to its line: frame-exact cuts, a silent still sharing time, Ken Burns, speech passed through', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const red = await solid(ctx, 'red.mp4', 'red', 2);
  const blue = await solid(ctx, 'blue.mp4', 'blue', 0.5); // shorter than its cut: it holds its last frame
  const pattern = await still(join(ctx.workDir, 'pattern.png'), 'testsrc2=size=360x640:duration=1');
  const speech = [
    { scene_id: 's1', text: 'Hello there.', start_s: 0.3, end_s: 1.1, words: [{ text: 'Hello', start_s: 0.3, end_s: 0.7 }, { text: 'there.', start_s: 0.75, end_s: 1.1 }] },
    { scene_id: 's3', text: 'Try it.', start_s: 1.5, end_s: 2.2 },
  ];
  const out = await mod.run({
    clips: [{ id: 's1', video: red }, { id: 's2', image: pattern }, { id: 's3', video: blue }],
    spans: spans([['s1', 0.3, 1.1], ['s3', 1.5, 2.2]]),
    silent: { mode: 'share_previous' },
    speech,
    motion: { stills: 'ken_burns', to: 1.1 },
    width: W, height: H, fps: 30,
  }, ctx);
  // s1 and the silent s2 share frames 0-45 (23 + 22); s3 runs from frame 45 to (2.2 + 0.25) s = frame 74 (73.5 rounded).
  assert.deepEqual(scenesOf(out.timeline), [['s1', 0, 0.767], ['s2', 0.767, 1.5], ['s3', 1.5, 2.467]]);
  assert.equal(out.seconds, 2.467);
  assert.deepEqual(out.timeline.speech, speech);
  assert.equal(out.timeline.end_card, undefined);
  const info = await probe(out.video.path);
  assert.ok(Math.abs(info.duration_s - 74 / 30) < 1.5 / 30, `cut is ${info.duration_s}s`);
  assert.ok(await isColor(out.video.path, 0.5, [255, 0, 0]));
  assert.ok(await isColor(out.video.path, 2.35, [0, 0, 255]), 'the short clip holds its last frame to the end of its cut');
  // The still moves: its first and last frames differ; the same still without motion does not.
  const a = await framePixels(out.video.path, 0.8);
  const b = await framePixels(out.video.path, 1.45);
  assert.ok(meanDiff(a, b) > 3, `Ken Burns frames differ by ${meanDiff(a, b)}`);
  const { ctx: ctx2 } = makeCtx({ partDir: dir });
  const flat = await mod.run({ clips: [{ id: 'p', image: pattern }], spans: spans([['p', 0, 1]]), width: W, height: H }, ctx2);
  assert.ok(meanDiff(await framePixels(flat.video.path, 0.1), await framePixels(flat.video.path, 1.0)) < 1, 'a still without motion holds');
});

test('the end card takes the last span, with its logo box moved onto the cut; a fixed silent scene', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const red = await still(join(ctx.workDir, 'red.png'), `color=c=red:s=${W}x${H}:d=1`);
  const green = await still(join(ctx.workDir, 'green.png'), `color=c=green:s=${W}x${H}:d=1`);
  const card = await solid(ctx, 'card.mp4', 'yellow', 1, '720x1280');
  const out = await mod.run({
    clips: [{ id: 's1', image: red }, { id: 's2', image: green }],
    spans: spans([['s1', 0.2, 1.0], ['s3', 1.2, 1.6]]),
    silent: { mode: 'fixed', seconds: 0.3 },
    ending: card,
    ending_timeline: { duration_s: 1, width: 720, height: 1280, fps: 30, scenes: [], speech: [], safe_zones: [{ use: 'logo', x: 200, y: 500, w: 320, h: 120 }] },
    ending_fills: 'last_span',
    width: W, height: H, fps: 30,
  }, ctx);
  // s1 group: frames 0-36, the silent s2 takes 9 of them. The card: from frame 36 for max((1.6 + 0.25) s - 1.2 s, 1 s) = 30 frames.
  assert.deepEqual(scenesOf(out.timeline), [['s1', 0, 0.9], ['s2', 0.9, 1.2], ['s3', 1.2, 2.2]]);
  assert.deepEqual(out.timeline.end_card, { start_s: 1.2, end_s: 2.2 });
  assert.deepEqual(out.timeline.safe_zones, [{ use: 'logo', x: 100, y: 250, w: 160, h: 60 }]);
  assert.ok(await isColor(out.video.path, 0.5, [255, 0, 0]));
  assert.ok(await isColor(out.video.path, 1.05, [0, 128, 0]));
  assert.ok(await isColor(out.video.path, 1.8, [255, 255, 0]));
});

test('passes a finished timeline through and appends the card after it, keeping the clip sound (street interview)', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const body = await fileRef(await makeVideo(join(ctx.workDir, 'body.mp4'), 1.5, { width: W, height: H, fps: 30, tone: 440 }), 'video');
  const card = await solid(ctx, 'card.mp4', 'yellow', 0.6);
  const timeline = {
    duration_s: 1.5, width: W, height: H, fps: 30,
    scenes: [{ id: 'q1', start_s: 0, end_s: 0.7 }, { id: 'a1', start_s: 0.7, end_s: 1.5 }],
    speech: [{ scene_id: 'q1', text: 'What is this?', start_s: 0.1, end_s: 0.6 }, { scene_id: 'a1', text: 'Water.', start_s: 0.8, end_s: 1.3 }],
    safe_zones: [{ use: 'captions', x: 20, y: 400, w: 320, h: 80 }],
  };
  const out = await mod.run({ clips: [{ video: body, seconds: 1.5 }], timeline, ending: card, ending_fills: 'after', clip_audio: 'keep', width: W, height: H, fps: 30 }, ctx);
  assert.deepEqual(out.timeline.scenes, timeline.scenes);
  assert.deepEqual(out.timeline.speech, timeline.speech);
  assert.deepEqual(out.timeline.safe_zones, timeline.safe_zones);
  assert.deepEqual(out.timeline.end_card, { start_s: 1.5, end_s: 2.1 });
  assert.equal(out.seconds, 2.1);
  assert.ok((await levelDb(out.video.path, 0.2, 1.2)) > -30, 'the interview keeps its own sound');
  assert.equal(await levelDb(out.video.path, 1.65, 2.05), -Infinity, 'the card is silent');
  assert.ok(await isColor(out.video.path, 1.8, [255, 255, 0]));
});

test('with no end card drawn, a last span with no clip is held by the cut before it', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const red = await still(join(ctx.workDir, 'red.png'), `color=c=red:s=${W}x${H}:d=1`);
  const out = await mod.run({ clips: [{ id: 's1', image: red }], spans: spans([['s1', 0, 0.8], ['card', 1.0, 1.5]]), ending_fills: 'last_span', width: W, height: H }, ctx);
  assert.deepEqual(scenesOf(out.timeline), [['s1', 0, 1.767]]);
  assert.equal(out.timeline.end_card, undefined);
});

test('refuses what it cannot cut, before any encode', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const red = await solid(ctx, 'red.mp4', 'red', 1);
  const card = await solid(ctx, 'card.mp4', 'yellow', 0.5);
  const base = { width: W, height: H };
  const bad = (inputs, re) => assert.rejects(mod.run({ ...base, ...inputs }, ctx), (e) => e.code === 'bad_input' && re.test(e.message));
  await bad({ clips: [{ id: 's1', video: red }], spans: spans([['s1', 0, 0.5], ['s2', 0.6, 1]]) }, /span "s2" has no clip/);
  await bad({ clips: [{ id: 's2', video: red }, { id: 's1', video: red }], spans: spans([['s1', 0, 0.5], ['s2', 0.6, 1]]) }, /spans' order/);
  await bad({ clips: [{ video: red }], ending: card, ending_fills: 'last_span' }, /last_span needs spans/);
  await bad({ clips: [{ id: 's1', video: red, in_s: 2 }], spans: spans([['s1', 0, 0.5]]) }, /starts at 2s of a 1s clip/);
  await bad({ clips: [{ id: 's1', video: red }], spans: spans([['s1', 0, 0.5]]), grade: 'sepia' }, /grade/);
  await bad({ clips: [{ id: 's1', video: red }], spans: spans([['s1', 0, 0.5]]), motion: { stills: 'ken_burns', to: 2 } }, /to/);
  assert.equal(statSync(ctx.workDir).isDirectory(), true);
  assert.throws(() => statSync(join(ctx.workDir, 'assembled.mp4')), 'nothing was encoded');
});

test('size rule: a cut over 180 MB is refused as output_invalid', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const red = await solid(ctx, 'red.mp4', 'red', 0.5);
  const file = ctx.file.bind(ctx);
  ctx.file = async (rel, media) => ({ ...(await file(rel, media)), bytes: 190 * 1024 * 1024 });
  await assert.rejects(mod.run({ clips: [{ video: red }], width: W, height: H }, ctx), (e) => e.code === 'output_invalid' && /190 MB, over the 180 MB/.test(e.message));
});

test('grain grades cap the final encode at 8 Mbps; others at 16 Mbps', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const noisy = join(ctx.workDir, 'noisy.mp4');
  const T = 3;
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `testsrc2=size=540x960:rate=30:duration=${T},noise=alls=40:allf=t`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p', noisy]);
  const clip = await fileRef(noisy, 'video');
  const calls = [];
  const exec = ctx.tools.exec;
  ctx.tools.exec = (bin, args, options) => {
    if (bin === 'ffmpeg') calls.push(args);
    return exec(bin, args, options);
  };
  const out = await mod.run({ clips: [{ id: 'n', video: clip }], spans: spans([['n', 0, T - 0.25]]), grade: 'phone-grain', width: 540, height: 960 }, ctx);
  const encode = calls.find((a) => a.includes('-filter_complex'));
  assert.deepEqual(encode.slice(encode.indexOf('-maxrate'), encode.indexOf('-maxrate') + 4), ['-maxrate', '8M', '-bufsize', '16M']);
  assert.match(encode[encode.indexOf('-filter_complex') + 1], /noise=alls=9:allf=t\+u/);
  const bps = (out.video.bytes * 8) / out.seconds;
  // The VBV lets at most maxrate x length + one buffer through; CRF 18 on this grain runs near 70 Mbps uncapped.
  assert.ok(bps <= 8e6 + 16e6 / out.seconds, `grain cut runs at ${(bps / 1e6).toFixed(1)} Mbps`);
  calls.length = 0;
  const { ctx: ctx2 } = makeCtx({ partDir: dir });
  ctx2.tools.exec = ctx.tools.exec;
  await mod.run({ clips: [{ id: 'n', video: clip, seconds: 0.5 }], width: 540, height: 960 }, ctx2);
  const plain = calls.find((a) => a.includes('-filter_complex'));
  assert.deepEqual(plain.slice(plain.indexOf('-maxrate'), plain.indexOf('-maxrate') + 4), ['-maxrate', '16M', '-bufsize', '32M']);
  // phonecam: down to a 720 short side, grain, back up; also capped at 8 Mbps.
  calls.length = 0;
  const { ctx: ctx3 } = makeCtx({ partDir: dir });
  ctx3.tools.exec = ctx.tools.exec;
  const cam = await mod.run({ clips: [{ id: 'n', video: clip, seconds: 0.5 }], grade: 'phonecam', width: 900, height: 1600 }, ctx3);
  const camArgs = calls.find((a) => a.includes('-filter_complex'));
  assert.match(camArgs[camArgs.indexOf('-filter_complex') + 1], /scale=720:1280:flags=bicubic,noise=alls=8:allf=t,scale=900:1600/);
  assert.deepEqual(camArgs.slice(camArgs.indexOf('-maxrate'), camArgs.indexOf('-maxrate') + 4), ['-maxrate', '8M', '-bufsize', '16M']);
  const camInfo = await probe(cam.video.path);
  assert.deepEqual([camInfo.width, camInfo.height], [900, 1600]);
  console.log(`# phone-grain cut: ${(bps / 1e6).toFixed(2)} Mbps over ${out.seconds} s (bound ${((8e6 + 16e6 / out.seconds) / 1e6).toFixed(2)})`);
});

test('clip ids take the 64-character scene ids the image and clip parts emit', async () => {
  const { readFile } = await import('node:fs/promises');
  const pj = JSON.parse(await readFile(join(dir, 'part.json'), 'utf8'));
  assert.equal(pj.inputs.properties.clips.items.properties.id.maxLength, 64);
});
