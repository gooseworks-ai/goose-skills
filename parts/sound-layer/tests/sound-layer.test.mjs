import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { loadNewest, fileRef, hasFfmpeg, layerInputsFor, loadPart, makeCtx, makeTone, measureR128, run } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('sound-layer');
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

for (const [name, volume] of [['a quiet', 0.08], ['a loud', 1.0]]) {
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
  const { readdirSync } = await import('node:fs');
  assert.deepEqual(readdirSync(ctx.workDir).filter((f) => f.startsWith('levelled')), ['levelled.mp4'], 'the correction passes stay in scratch');
});

// Peaky cuts where the limiter eats most of each gain step, so a plain step-by-shortfall swings under and over.
for (const [name, bed, decay] of [['a faint bed under hard 10 kHz clicks', 0.002, 1200], ['a quiet bed under slow 10 kHz clicks', 0.01, 100]]) {
  test(`${name} is searched to -14 LUFS +/-1 with the true peak at or below -1 dBTP`, { skip }, async () => {
    const { ctx } = makeCtx({ partDir: dir });
    const wav = join(ctx.workDir, 'peaky.wav');
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `aevalsrc='${bed}*sin(2*PI*220*t)+0.9*exp(-mod(t,1)*${decay})*sin(2*PI*10000*t)':s=48000:d=6`, wav]);
    const mp4 = join(ctx.workDir, 'peaky.mp4');
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=30:duration=6', '-i', wav, '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', mp4]);
    const out = await mod.run(await layerInputsFor(await fileRef(mp4, 'video')), ctx);
    const after = await measureR128(out.video.path);
    assert.ok(Math.abs(after.lufs + 14) <= 1, `levelled to ${after.lufs} LUFS`);
    assert.ok(after.true_peak_db <= -1, `true peak ${after.true_peak_db} dBTP`);
  });
}

// 1.1.0: the linked source edit (gooseworks-assembly-timeline/1).
const LINKED = {
  format: 'gooseworks-assembly-timeline/1', duration_ms: 6000, creative_contract_revision: 'c'.repeat(64), speech_mode: 'narration', soundtrack_modes: ['music'],
  segments: [{ id: 's1', scene_id: 's1', start_ms: 0, end_ms: 6000, video: { asset_id: 'clip', sha256: 'a'.repeat(64), in_ms: 0, out_ms: 6000, speed: 1 }, speech_mode: 'narration', depicts_speech: false, native_audio: 'muted' }],
  audio_cues: [{ id: 'vo', role: 'narration', source: { asset_id: 'vo', sha256: 'b'.repeat(64), in_ms: 0, out_ms: 6000, speed: 1 }, start_ms: 0, end_ms: 6000, gain_db: 0, loop: false }],
  pauses: [], required_cue_ids: ['vo'],
};

test('1.1.0 declares the linked assembly_timeline, so the kit passes it, and hands it back unchanged', { skip }, async () => {
  const { manifest } = await loadNewest('sound-layer');
  assert.ok(manifest.inputs.properties.timeline.properties.assembly_timeline, 'declared on the timeline input');
  assert.ok(manifest.outputs.properties.timeline.properties.assembly_timeline, 'and on the timeline output');
  const { ctx } = makeCtx({ partDir: dir });
  const video = await fixture(ctx, 0.08);
  const inputs = await layerInputsFor(video, { timeline: { assembly_timeline: structuredClone(LINKED) } });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(out.timeline.assembly_timeline, LINKED, 'the layer lays no music or sfx of its own, so it adds no cue');
});
