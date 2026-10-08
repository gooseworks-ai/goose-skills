import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, layerInputsFor, loadPart, makeCtx, makeTone, measureR128, run } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadPart('sound-layer', '1.0.0');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed, so loudness cannot be measured';

// A fixture wav (speech-like: a tone with pauses) muxed under a still picture.
async function fixture(ctx, volume) {
  const wav = join(ctx.workDir, `fixture-${volume}.wav`);
  await makeTone(wav, 6, { freq: 330, volume });
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-i', wav, '-af', "volume='if(lt(mod(t,1.5),1.0),1,0.05)':eval=frame", join(ctx.workDir, `phrased-${volume}.wav`)]);
  const mp4 = join(ctx.workDir, `cut-${volume}.mp4`);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=30:duration=6', '-i', join(ctx.workDir, `phrased-${volume}.wav`), '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', mp4]);
  return fileRef(mp4, 'video');
}

for (const [name, volume] of [['a quiet', 0.02], ['a loud', 1.0]]) {
  test(`${name} cut is levelled to -14 LUFS +/-1 with the true peak at or below -1 dBTP`, { skip }, async () => {
    const { ctx } = makeCtx({ partDir: dir });
    const video = await fixture(ctx, volume);
    const before = await measureR128(video.path);
    assert.ok(Math.abs(before.lufs + 14) > 3, `the fixture starts away from the target (${before.lufs} LUFS)`);
    const inputs = await layerInputsFor(video);
    const out = await mod.run(inputs, ctx);
    const after = await measureR128(out.video.path);
    assert.ok(Math.abs(after.lufs + 14) <= 1, `levelled to ${after.lufs} LUFS`);
    assert.ok(after.true_peak_db <= -1, `true peak ${after.true_peak_db} dBTP, the ceiling is -1 dBTP`);
    assert.deepEqual(out.timeline, inputs.timeline);
  });
}

test('a silent cut, or one with no sound track, passes through untouched', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const mute = join(ctx.workDir, 'mute.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=30:duration=2', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', mute]);
  const silent = join(ctx.workDir, 'silent.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-i', mute, '-f', 'lavfi', '-t', '2', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-c:v', 'copy', '-c:a', 'aac', '-shortest', silent]);
  for (const path of [mute, silent]) {
    const video = await fileRef(path, 'video');
    const out = await mod.run(await layerInputsFor(video), ctx);
    assert.equal(out.video, video, `${path} is handed on as it is`);
  }
});

test('a cut with sharp peaks (a chat\'s pops over a quiet bed) reaches -14 LUFS with its true peak held at -1 dBTP', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const wav = join(ctx.workDir, 'clicks.wav');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', "aevalsrc='0.02*sin(2*PI*220*t)+0.9*exp(-mod(t,0.25)*400)*sin(2*PI*3000*t)':s=48000:d=6", wav]);
  const mp4 = join(ctx.workDir, 'clicks.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=30:duration=6', '-i', wav, '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', mp4]);
  const out = await mod.run(await layerInputsFor(await fileRef(mp4, 'video')), ctx);
  const after = await measureR128(out.video.path);
  assert.ok(Math.abs(after.lufs + 14) <= 1, `levelled to ${after.lufs} LUFS`);
  assert.ok(after.true_peak_db <= -1, `true peak ${after.true_peak_db} dBTP`);
});
