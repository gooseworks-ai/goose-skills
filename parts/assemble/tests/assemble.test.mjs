import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { loadNewest, fileRef, hasFfmpeg, levelDb, loadPart, makeCtx, makeVideo, probe, run } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('assemble');
const ffmpeg = await hasFfmpeg();

test('joins clips and a still at one size and frame rate, to the exact frame', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  const a = await fileRef(await makeVideo(join(w, 'a.mp4'), 2, { width: 640, height: 360, fps: 25, tone: 440 }), 'video');
  const b = await fileRef(await makeVideo(join(w, 'b.mp4'), 1.95, { width: 360, height: 640, fps: 30, tone: 0 }), 'video');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=400x400:duration=1', '-frames:v', '1', join(w, 'still.png')]);
  const still = await fileRef(join(w, 'still.png'), 'image');
  const out = await mod.run({
    clips: [{ id: 'hook', video: a, in_s: 0.5, seconds: 1.2 }, { video: b, seconds: 2 }, { image: still, seconds: 1 }],
    width: 360, height: 640, fps: 30, clip_audio: 'keep',
  }, ctx);
  const info = await probe(out.video.path);
  assert.equal(info.width, 360);
  assert.equal(info.height, 640);
  assert.ok(Math.abs(info.fps - 30) < 0.01);
  assert.ok(Math.abs(info.duration_s - 4.2) < 1.5 / 30, `cut is ${info.duration_s}s`);
  assert.deepEqual(out.timeline.scenes.map((s) => [s.id, s.start_s, s.end_s]), [['hook', 0, 1.2], ['2', 1.2, 3.2], ['3', 3.2, 4.2]]);
  // The first clip's own sound is kept; the still has silence under it.
  assert.ok((await levelDb(out.video.path, 0.2, 1.0)) > -30);
  assert.equal(await levelDb(out.video.path, 3.4, 4.0), -Infinity);
});

test('refuses a cut longer than its clip, and a still without a length', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const a = await fileRef(await makeVideo(join(ctx.workDir, 'a.mp4'), 1, { width: 320, height: 568 }), 'video');
  await assert.rejects(mod.run({ clips: [{ video: a, in_s: 0.5, seconds: 1 }], width: 320, height: 568 }, ctx), (e) => e.code === 'bad_input');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=200x200:duration=1', '-frames:v', '1', join(ctx.workDir, 's.png')]);
  const still = await fileRef(join(ctx.workDir, 's.png'), 'image');
  await assert.rejects(mod.run({ clips: [{ image: still }], width: 320, height: 568 }, ctx), (e) => e.code === 'bad_input' && /needs seconds/.test(e.message));
  await assert.rejects(mod.run({ clips: [{ video: a, image: still, seconds: 1 }], width: 320, height: 568 }, ctx), (e) => e.code === 'bad_input' && /exactly one/.test(e.message));
});
