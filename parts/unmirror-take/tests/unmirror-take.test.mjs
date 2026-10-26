// unmirror-take 1.0.0: a take mirrored in most frames that show the product is flipped; any other take passes through.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadPart, makeCtx, makeVideo, run } from '../../_tools/kit-harness.mjs';
import { parseUnmirrorReply, unmirrorDecide, unmirrorFrameTimes, unmirrorPrompt } from '../src/part.mjs';

const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';

test('frames spread evenly over the take and stop before the end card', () => {
  assert.deepEqual(unmirrorFrameTimes(8, null), [1, 3, 5, 7]);
  assert.deepEqual(unmirrorFrameTimes(10, { end_card: { start_s: 8, end_s: 10 } }), [1, 3, 5, 7]);
  assert.deepEqual(unmirrorFrameTimes(6, null, 2), [1.5, 4.5]);
});

test('the prompt names the frames; the reply is read from fenced JSON; mirrored needs the product seen', () => {
  assert.match(unmirrorPrompt('Dal Chawal', [1, 3]), /image 2 is the frame at 1 s; image 3 is the frame at 3 s/);
  const r = parseUnmirrorReply('```json\n{"frames":[{"image":2,"product_seen":true,"mirrored":true},{"image":3,"product_seen":false,"mirrored":true}]}\n```');
  assert.deepEqual(r, [{ image: 2, product_seen: true, mirrored: true }, { image: 3, product_seen: false, mirrored: false }]);
  assert.equal(parseUnmirrorReply('no'), null);
});

test('flip only when more than half of the frames that show the product are mirrored', () => {
  const f = (seen, mirrored) => ({ product_seen: seen, mirrored });
  assert.equal(unmirrorDecide([f(true, true), f(true, true), f(true, false)]).flip, true);
  assert.equal(unmirrorDecide([f(true, true), f(true, false)]).flip, false, 'a tie keeps the take');
  assert.equal(unmirrorDecide([f(false, false), f(false, false)]).flip, false, 'no product seen: nothing to judge');
});

async function setup(mirroredFrames) {
  const { dir, mod } = await loadPart('unmirror-take', '1.0.0');
  const reply = JSON.stringify({ frames: [2, 3, 4, 5].map((image, i) => ({ image, product_seen: true, mirrored: i < mirroredFrames })) });
  const { ctx, orders } = makeCtx({ partDir: dir, line: async () => ({ json: { output: reply }, files: {} }) });
  // A picture whose left and right halves differ, so a flip is measurable: red on the left, blue on the right.
  const src = join(ctx.workDir, 'take.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=red:size=180x640:rate=30:duration=4', '-f', 'lavfi', '-i', 'color=blue:size=180x640:rate=30:duration=4', '-f', 'lavfi', '-i', 'sine=frequency=300:duration=4:sample_rate=48000', '-filter_complex', '[0:v][1:v]hstack=inputs=2[v]', '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', src]);
  const video = await fileRef(src, 'video');
  const photo = await fileRef(await makeVideo(join(ctx.workDir, 'x.mp4'), 1, { width: 64, height: 64, tone: 0 }).then(async (p) => { const png = join(ctx.workDir, 'pack.png'); await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', p, '-frames:v', '1', png]); return png; }), 'image');
  const timeline = { duration_s: 4, width: 360, height: 640, fps: 30, scenes: [{ id: 's1', start_s: 0, end_s: 4 }], speech: [] };
  return { mod, ctx, orders, video, photo, timeline };
}

async function leftIsRed(path) {
  const out = await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-ss', '1', '-i', path, '-frames:v', '1', '-vf', 'crop=20:20:10:300,scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  const b = Buffer.from(out.stdoutBuffer || out.stdout, out.stdoutBuffer ? undefined : 'binary');
  return b[0] > b[2];
}

test('a take mirrored in 3 of 4 frames is flipped left to right, sound and timeline kept', { skip }, async () => {
  const { mod, ctx, orders, video, photo, timeline } = await setup(3);
  const out = await mod.run({ video, timeline, products: [{ id: 'p', name: 'Dal Chawal', images: [photo] }] }, ctx);
  assert.equal(out.mirror.flipped, true);
  assert.deepEqual([out.mirror.seen, out.mirror.mirrored], [4, 3]);
  assert.notEqual(out.video.sha256, video.sha256);
  assert.equal(await leftIsRed(video.path), true);
  assert.equal(await leftIsRed(out.video.path), false, 'the left half is now blue');
  assert.deepEqual(out.timeline, timeline);
  const info = await ctx.tools.probe(out.video.path);
  assert.equal(info.has_audio, true);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].body.reasoning, true);
  assert.equal(orders[0].body.image_urls.length, 5, 'the photo and 4 frames');
});

test('a take the right way round passes through untouched', { skip }, async () => {
  const { mod, ctx, video, photo, timeline } = await setup(1);
  const out = await mod.run({ video, timeline, products: [{ id: 'p', images: [photo] }] }, ctx);
  assert.equal(out.mirror.flipped, false);
  assert.equal(out.video, video);
});

test('no product photo is refused; a reply that is not the JSON asked for is a provider failure', { skip }, async () => {
  const { mod, ctx, video, photo, timeline } = await setup(0);
  await assert.rejects(mod.run({ video, timeline, products: [{ id: 'p', images: [] }] }, ctx), (e) => e.code === 'bad_input');
  const bad = makeCtx({ partDir: (await loadPart('unmirror-take', '1.0.0')).dir, line: async () => ({ json: { output: 'sorry' }, files: {} }) });
  await assert.rejects(mod.run({ video, timeline, products: [{ id: 'p', images: [photo] }] }, bad.ctx), (e) => e.code === 'provider_failed');
});
