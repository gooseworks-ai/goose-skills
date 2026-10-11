import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, levelDb, loadNewest, makeCtx, makeVideo, probe, run } from '../../_tools/kit-harness.mjs';
import { spliceAudioStats } from '../src/checks.mjs';
import { spliceProjectedBytes, spliceSizeProblem } from '../src/size.mjs';
import { spliceSourceFacts } from '../src/source.mjs';

const { dir, mod } = await loadNewest('splice');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';

/**
 * A finished-ad stand-in: a moving test pattern with a keyframe every `gop` frames, B-frames, and a tone
 * (or no sound) at its own sample rate and layout, like a kit render.
 */
async function makeAd(path, { seconds = 4, width = 360, height = 640, fps = 30, gop = 30, rate = 44100, layout = 'mono', tone = 440, extra = [] } = {}) {
  const args = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `testsrc2=size=${width}x${height}:rate=${fps}:duration=${seconds}`];
  if (tone) args.push('-f', 'lavfi', '-i', `sine=frequency=${tone}:duration=${seconds}:sample_rate=${rate}`);
  args.push(...extra, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-g', String(gop), '-keyint_min', String(gop), '-sc_threshold', '0', '-pix_fmt', 'yuv420p');
  if (tone) args.push('-af', `aformat=channel_layouts=${layout}`, '-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push('-movflags', '+faststart', path);
  await run('ffmpeg', args);
  return fileRef(path, 'video');
}

/** A plain colour card with no sound, like an html-frames hook. */
async function makeCard(path, { seconds = 1.5, width = 1080, height = 1920, fps = 30, color = 'navy' } = {}) {
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${color}:s=${width}x${height}:r=${fps}:d=${seconds}`, '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', path]);
  return fileRef(path, 'video');
}

const body = (file, start_ms, extra = {}) => ({ asset_id: 'source-ad', kind: 'render', file, start_ms, end_ms: null, audio: true, ...extra });

test('stream-copies the body when the cut lands on a keyframe, and proves every kept frame and the sound', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  // Tagged BT.709 like a kit render, while the card is untagged: the opening takes the body's tags.
  const bt709 = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
  const ad = await makeAd(join(w, 'ad.mp4'), { seconds: 4, gop: 30, rate: 44100, layout: 'mono', extra: bt709 });
  const card = await makeCard(join(w, 'card.mp4'), { seconds: 1.5 });
  const out = await mod.run(
    {
      hook: card,
      hook_timeline: { duration_s: 1.5, width: 1080, height: 1920, fps: 30, scenes: [], speech: [{ text: 'New opening', start_s: 0.1, end_s: 1.4 }] },
      footage: [body(ad, 1000)],
      body_timeline: { duration_s: 4, width: 360, height: 640, fps: 30, scenes: [], speech: [], end_card: { start_s: 3, end_s: 4 } },
      match: 'body',
      keep: 'body',
    },
    ctx,
  );
  assert.equal(out.retained.copied, true);
  assert.equal(out.retained.frames, 90);
  assert.equal(out.retained.exact_frames, 90, 'a stream copy decodes bit-identical');
  assert.equal(out.retained.psnr_min, 100);
  assert.equal(out.retained.cut_s, 1);
  assert.ok(out.retained.audio_corr >= 0.99, `audio correlation ${out.retained.audio_corr}`);
  assert.ok(out.retained.audio_nrmse <= 0.08, `audio error ${out.retained.audio_nrmse}`);
  assert.equal(out.retained.source_sha256, ad.sha256);
  assert.deepEqual([out.retained.start_s, out.retained.end_s], [1.5, 4.5]);
  assert.deepEqual(out.timeline.scenes, [{ id: 'hook', start_s: 0, end_s: 1.5 }, { id: 'body', start_s: 1.5, end_s: 4.5 }]);
  assert.deepEqual(out.timeline.end_card, { start_s: 3.5, end_s: 4.5 }, 'the source end card moves with the body');
  assert.deepEqual(out.timeline.speech.map((s) => s.text), ['New opening']);
  assert.equal(out.seconds, 4.5);
  const info = await probe(out.video.path);
  assert.deepEqual([info.width, info.height], [360, 640], 'the opening is converted to the body size');
  assert.ok(Math.abs(info.fps - 30) < 0.01);
  assert.ok(Math.abs(info.duration_s - 4.5) < 1 / 30 + 0.002, `cut is ${info.duration_s}s`);
  const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate,channels', '-of', 'csv=p=0', out.video.path]);
  assert.equal(stdout.trim(), '44100,1', "the body's own sample rate and layout are kept");
  const tags = async (path) => (await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_frames', '-read_intervals', '%+#1', '-show_entries', 'frame=color_range,color_space,color_primaries,color_transfer', '-of', 'json', path])).stdout;
  const first = (text) => { const f = JSON.parse(text).frames[0]; return [f.color_range, f.color_space, f.color_primaries, f.color_transfer]; };
  const sourceTags = first(await tags(ad.path));
  assert.equal(sourceTags[1], 'bt709');
  assert.deepEqual(first(await tags(out.video.path)), sourceTags, 'the opening carries the body colour tags');
  // The card is silent; the body carries its tone.
  assert.equal(await levelDb(out.video.path, 0.1, 1.4), -Infinity);
  assert.ok((await levelDb(out.video.path, 2, 4)) > -30);
});

test('re-encodes when the cut is between keyframes, snaps it to the next frame, and keeps PSNR and sound within the checks', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  const ad = await makeAd(join(w, 'ad.mp4'), { seconds: 3, width: 400, height: 500, fps: 25, gop: 50, rate: 48000, layout: 'stereo', tone: 330 });
  const clip = await fileRef(await makeVideo(join(w, 'clip.mp4'), 3, { width: 640, height: 360, fps: 30, tone: 880 }), 'video');
  const out = await mod.run({ footage: [{ asset_id: 'my-hook', kind: 'video', file: clip, start_ms: 500, end_ms: 2100, audio: true }, body(ad, 1150)] }, ctx);
  assert.equal(out.retained.copied, false);
  assert.equal(out.retained.cut_s, 1.16, 'the first frame at or after 1.15 s');
  assert.equal(out.retained.frames, 46);
  assert.ok(out.retained.psnr_min >= 45, `PSNR ${out.retained.psnr_min}`);
  assert.ok(out.retained.audio_corr >= 0.99 && out.retained.audio_nrmse <= 0.08, JSON.stringify(out.retained));
  assert.equal(out.timeline.scenes[0].end_s, 1.6);
  assert.ok(Math.abs(out.seconds - 3.44) < 1e-6, `seconds ${out.seconds}`);
  const info = await probe(out.video.path);
  assert.deepEqual([info.width, info.height], [400, 500]);
  assert.ok(Math.abs(info.fps - 25) < 0.01);
  // The hook clip keeps its own 880 Hz sound; the body keeps its 330 Hz tone.
  assert.ok((await levelDb(out.video.path, 0.2, 1.4, 880)) > -30);
  assert.ok((await levelDb(out.video.path, 1.9, 3.3, 330)) > -30);
  assert.ok((await levelDb(out.video.path, 1.9, 3.3, 880)) < -40);
});

test('refuses a re-encode that cannot meet the PSNR floor, before anything is returned', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const ad = await makeAd(join(ctx.workDir, 'ad.mp4'), { seconds: 2, gop: 60 });
  const card = await makeCard(join(ctx.workDir, 'card.mp4'), { seconds: 1, width: 360, height: 640 });
  await assert.rejects(mod.run({ hook: card, footage: [body(ad, 500)], checks: { psnr_min: 100 } }, ctx), (e) => e.code === 'output_invalid' && /dB from the original/.test(e.message));
});

test('the sound check catches a level change, an offset and a different length', () => {
  const n = 48000;
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / 48000) + 0.2 * Math.sin((2 * Math.PI * 97 * i) / 48000);
  const same = spliceAudioStats(x, Float32Array.from(x, (v) => v + 1e-4));
  assert.ok(same.corr > 0.999 && same.nrmse < 0.01);
  const quieter = spliceAudioStats(x, Float32Array.from(x, (v) => v * 0.5));
  assert.ok(quieter.nrmse > 0.08, `a 6 dB drop is error ${quieter.nrmse}`);
  const late = spliceAudioStats(x, Float32Array.from(x, (_, i) => (i >= 240 ? x[i - 240] : 0)));
  assert.ok(late.corr < 0.99, `a 5 ms offset is correlation ${late.corr}`);
  assert.match(spliceAudioStats(x, x.subarray(1)).error, /different number of samples/);
  const silent = spliceAudioStats(new Float32Array(100), new Float32Array(100));
  assert.equal(silent.quiet, true);
  assert.equal(silent.mean_square_error, 0);
});

test('keeps a silent original silent, and lays silence under a silent card', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const ad = await makeAd(join(ctx.workDir, 'ad.mp4'), { seconds: 2, tone: 0 });
  const card = await makeCard(join(ctx.workDir, 'card.mp4'), { seconds: 1, width: 360, height: 640 });
  const out = await mod.run({ hook: card, footage: [body(ad, 1000)] }, ctx);
  assert.equal(out.retained.copied, true);
  assert.equal(out.retained.audio_corr, null);
  assert.equal(out.retained.audio_nrmse, null);
  assert.equal((await probe(out.video.path)).has_audio, false);
  // A sounding hook clip on a silent original: the body stays silent after it.
  const { ctx: ctx2 } = makeCtx({ partDir: dir });
  const ad2 = await makeAd(join(ctx2.workDir, 'ad.mp4'), { seconds: 2, tone: 0 });
  const clip = await fileRef(await makeVideo(join(ctx2.workDir, 'clip.mp4'), 1, { width: 360, height: 640, tone: 600 }), 'video');
  const out2 = await mod.run({ footage: [{ asset_id: 'clip', file: clip, start_ms: 0, end_ms: null, audio: true }, body(ad2, 1000)] }, ctx2);
  assert.ok((await levelDb(out2.video.path, 0.1, 0.9)) > -30);
  assert.equal(await levelDb(out2.video.path, 1.1, 1.9), -Infinity);
});

test('refuses a source it cannot keep untouched, and a footage list it cannot read, before writing any output', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  const ad = await makeAd(join(w, 'ad.mp4'), { seconds: 2 });
  const card = await makeCard(join(w, 'card.mp4'), { seconds: 1, width: 360, height: 640 });
  const vfr = await makeAd(join(w, 'vfr.mp4'), { seconds: 2, extra: ['-vf', "setpts='if(lt(N,20),N,N+6)/(30*TB)'", '-fps_mode', 'passthrough'] });
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=30:duration=2', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv444p', join(w, 'yuv444.mp4')]);
  const yuv444 = await fileRef(join(w, 'yuv444.mp4'), 'video');
  writeFileSync(join(w, 'pointer.mp4'), 'version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 12\n');
  const pointer = await fileRef(join(w, 'pointer.mp4'), 'video');
  const refused = async (inputs, re) => {
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && re.test(e.message), `expected ${re}`);
  };
  await refused({ hook: card, footage: [body(vfr, 500)] }, /variable frame rate/);
  await refused({ hook: card, footage: [body(ad, 500)].map((e) => ({ ...e, file: yuv444 })) }, /not 8-bit yuv420p/);
  await refused({ hook: card, footage: [body(ad, 1990)] }, /leaves no complete frame/);
  await refused({ hook: card, footage: [body(ad, 500, { end_ms: 1500 })] }, /kept to its end/);
  await refused({ hook: card, footage: [body(ad, 500, { kind: 'image' })] }, /not an image/);
  await refused({ hook: card, footage: [{ asset_id: 'c', file: card }, body(ad, 500)] }, /only one opening/);
  await refused({ footage: [body(ad, 500)] }, /needs a new opening/);
  await refused({ hook: card, footage: [{ asset_id: 'a', file: card }, { asset_id: 'b', file: card }, body(ad, 500)] }, /at most one opening clip/);
  await refused({ hook: card, footage: [body(pointer, 500)] }, /Git LFS pointer/);
  await refused({ footage: [{ asset_id: 'c', file: card, start_ms: 500, end_ms: 4000 }, body(ad, 500)] }, /window ends at 4s/);
  await refused({ hook: card, footage: [body(ad, 500)], match: 'last_footage' }, /must be "body"/);
  assert.equal(existsSync(join(w, 'spliced.mp4')), false);
});

test('size guard: refuses an output projected over max_mb before encoding, and measures the finished file', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const ad = await makeAd(join(ctx.workDir, 'ad.mp4'), { seconds: 3 });
  const card = await makeCard(join(ctx.workDir, 'card.mp4'), { seconds: 1, width: 360, height: 640 });
  await assert.rejects(
    mod.run({ hook: card, footage: [body(ad, 1000)], max_mb: 0.01 }, ctx),
    (e) => e.code === 'output_invalid' && /would be about [\d.]+ MB, over the 0.01 MB limit/.test(e.message),
  );
  assert.equal(existsSync(join(ctx.workDir, 'spliced.mp4')), false, 'nothing was encoded');
  await assert.rejects(mod.run({ hook: card, footage: [body(ad, 1000)], max_mb: 181 }, ctx), (e) => e.code === 'bad_input');
});

test('size projection: a copy counts the kept bytes, a re-encode is bounded by the 16 Mbit/s cap', () => {
  const copy = spliceProjectedBytes({ mode: 'copy', seconds: 32, hook_s: 2, kept_bytes: 50e6, body_s: 30 });
  assert.ok(copy > 50e6 + 4e6 && copy < 60e6, `copy ${copy}`);
  // A 50 Mbit/s grain body re-encoded is held to the cap: 62 s at ~16.3 Mbit/s is about 128 MB.
  const grain = spliceProjectedBytes({ mode: 'encode', seconds: 62, hook_s: 2, kept_bytes: (50e6 / 8) * 60, body_s: 60 });
  assert.ok(grain < 180e6 && grain > 120e6, `grain ${grain}`);
  assert.ok(spliceProjectedBytes({ mode: 'encode', seconds: 100, hook_s: 2, kept_bytes: (50e6 / 8) * 98, body_s: 98 }) > 180e6);
  // A low-rate body is projected at three times its rate, never under 4 Mbit/s.
  assert.ok(spliceProjectedBytes({ mode: 'encode', seconds: 10, hook_s: 1, kept_bytes: 1e6, body_s: 9 }) < 7e6);
  assert.equal(spliceSizeProblem(179e6, 180), null);
  assert.match(spliceSizeProblem(181e6, 180), /is 181.0 MB, over the 180 MB limit/);
  assert.match(spliceSizeProblem(200e6, 180, { projected: true }), /would be about 200.0 MB/);
});

test('source facts: the cut snaps to the next frame, and copying needs a keyframe there', () => {
  const info = {
    format_name: 'mov,mp4,m4a,3gp,3g2,mj2',
    duration_s: 1,
    video: { codec: 'h264', width: 360, height: 640, pix_fmt: 'yuv420p', sar: '1:1', rotation: 0, fps_text: '10/1', fps: 10, start_s: 0 },
    audio: { codec: 'aac', sample_rate: 48000, channels: 2, layout: 'stereo', start_s: 0, duration_s: 1.02 },
  };
  const packets = Array.from({ length: 10 }, (_, i) => ({ t: i / 10, key: i % 5 === 0, size: 1000 }));
  const onKey = spliceSourceFacts(info, packets, { cut_s: 0.5 });
  assert.deepEqual([onKey.k, onKey.t0, onKey.frames, onKey.copyable, onKey.kept_bytes], [5, 0.5, 5, true, 5000]);
  const between = spliceSourceFacts(info, packets, { cut_s: 0.55 });
  assert.deepEqual([between.k, between.t0, between.copyable], [6, 0.6, false]);
  assert.match(spliceSourceFacts({ ...info, video: { ...info.video, rotation: 90 } }, packets, { cut_s: 0.5 }).problem, /rotated/);
  assert.match(spliceSourceFacts({ ...info, audio: { ...info.audio, duration_s: 1.1 } }, packets, { cut_s: 0.5 }).problem, /past its last frame/);
  assert.match(spliceSourceFacts({ ...info, video: { ...info.video, start_s: 0.05 } }, packets, { cut_s: 0.5 }).problem, /start at zero/);
  assert.equal(spliceSourceFacts({ ...info, format_name: 'matroska,webm' }, packets, { cut_s: 0.5 }).copyable, false);
});
