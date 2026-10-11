// audio-mix 1.1.0: room tone, sounds at the cut's marks, the outdoor mic chain.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, levelDb, loadPart, makeCtx, makeTone, makeVideo, probe, run } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadPart('audio-mix', '1.1.0');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';

const silentPicture = async (ctx, seconds = 4) =>
  fileRef(await makeVideo(join(ctx.workDir, 'pic.mp4'), seconds, { width: 320, height: 568, tone: 0 }), 'video');

/** A picture whose own sound is a tone of `freq` from `fromS` for `seconds`, silent elsewhere. */
async function pictureWithTone(ctx, freq, fromS, seconds, total = 4) {
  const w = ctx.workDir;
  const pic = await makeVideo(join(w, `pic-${freq}.mp4`), total, { width: 320, height: 568, tone: 0 });
  // m4a, not wav: ffmpeg's probe can mistake some raw sine wavs for MPEG-TS.
  const tone = await makeTone(join(w, `own-${freq}.m4a`), seconds, { freq, volume: 0.5 });
  const out = join(w, `pic-own-${freq}.mp4`);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', pic, '-i', tone, '-filter_complex',
    `[1:a]adelay=${Math.round(fromS * 1000)}:all=1,apad[a]`, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-t', String(total), out]);
  return fileRef(out, 'video');
}

async function audioSha(path) {
  const { stdout } = await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-i', path, '-vn', '-f', 's16le', '-']);
  return createHash('sha256').update(stdout).digest('hex');
}

test('room tone lays a quiet seeded bed under the whole cut, the same on every run', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await silentPicture(ctx);
  const room_tone = { color: 'brown', gain_db: -27, highpass_hz: 90, lowpass_hz: 2600 };
  const a = await mod.run({ video, room_tone }, ctx);
  const head = await levelDb(a.video.path, 0.2, 1.2);
  const tail = await levelDb(a.video.path, 3.0, 3.9);
  for (const db of [head, tail]) assert.ok(db > -60 && db < -35, `room tone RMS ${db.toFixed(1)} dB, want a quiet room (-60..-35)`);
  // Band-limited: nothing much above the low-pass.
  assert.ok((await levelDb(a.video.path, 0.2, 3.8, 8000)) < head - 20, 'no hiss above the low-pass');
  const info = await probe(a.video.path);
  assert.ok(Math.abs(info.duration_s - 4) < 0.1, `cut is ${info.duration_s}s`);
  const { ctx: ctx2 } = makeCtx({ partDir: dir });
  const b = await mod.run({ video: await silentPicture(ctx2), room_tone }, ctx2);
  assert.equal(await audioSha(a.video.path), await audioSha(b.video.path), 'the seeded bed is identical across runs');
});

test('room tone sits under the picture own sound, which keeps its level', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await pictureWithTone(ctx, 1100, 1, 1.4);
  const plain = await mod.run({ video, keep_video_audio: true }, ctx);
  const { ctx: ctx2 } = makeCtx({ partDir: dir });
  const toned = await mod.run({ video: await pictureWithTone(ctx2, 1100, 1, 1.4), keep_video_audio: true, room_tone: { gain_db: -27 } }, ctx2);
  const before = await levelDb(plain.video.path, 1.2, 2.3, 1100);
  const after = await levelDb(toned.video.path, 1.2, 2.3, 1100);
  assert.ok(Math.abs(before - after) < 1, `own sound ${before.toFixed(1)} dB alone, ${after.toFixed(1)} dB with room tone`);
  assert.equal(await levelDb(plain.video.path, 3.0, 3.9), -Infinity, 'without room tone the gap is silent');
  assert.ok((await levelDb(toned.video.path, 3.0, 3.9)) > -60, 'with room tone the gap has a room');
});

test('a mark sound plays at each mark of its kind, offset, and nowhere else', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await silentPicture(ctx);
  const click = await fileRef(await makeTone(join(ctx.workDir, 'click.wav'), 0.5, { freq: 3000 }), 'audio');
  const other = await fileRef(await makeTone(join(ctx.workDir, 'whoosh.wav'), 0.5, { freq: 6000 }), 'audio');
  const out = await mod.run(
    {
      video,
      marks: [
        { kind: 'snap', at_s: 1.0 },
        { kind: 'cut', at_s: 1.6 }, // no sound for this kind: ignored
        { kind: 'snap', at_s: 2.5 },
        { kind: 'snap', at_s: 3.95 }, // starts past the end once offset: dropped, not refused
      ],
      mark_sounds: [
        { id: 'snap', audio: click, seconds: 0.5 }, // sfx-elevenlabs effects bound whole carry seconds
        { id: 'whoosh', audio: other, seconds: 0.5 },
      ],
      mark_offset_s: 0.15,
      mark_gain: 0.85,
      mark_max_s: 0.2,
    },
    ctx,
  );
  const quiet = await levelDb(out.video.path, 0.2, 1.1, 3000);
  const first = await levelDb(out.video.path, 1.18, 1.32, 3000);
  const second = await levelDb(out.video.path, 2.68, 2.82, 3000);
  const cutShort = await levelDb(out.video.path, 1.4, 1.6, 3000);
  const ignored = await levelDb(out.video.path, 1.75, 2.1, 3000);
  assert.ok(first - quiet > 30, `click at 1.15 s ${first.toFixed(1)} dB, before ${quiet.toFixed(1)} dB`);
  assert.ok(second - quiet > 30, `click at 2.65 s ${second.toFixed(1)} dB`);
  assert.ok(first - cutShort > 30, `mark_max_s cut the click: ${cutShort.toFixed(1)} dB after it`);
  assert.ok(first - ignored > 30, `a mark kind with no sound stays silent: ${ignored.toFixed(1)} dB`);
  // The 6 kHz sound has no marks. Played once it would read about -17 dB over this window; only the
  // clicks' own edges reach that band (about -60 dB).
  const unused = await levelDb(out.video.path, 0.2, 3.9, 6000);
  assert.ok(unused < -45, `a sound with no marks never plays: ${unused.toFixed(1)} dB at 6 kHz`);
  const info = await probe(out.video.path);
  assert.ok(Math.abs(info.duration_s - 4) < 0.1, `cut is ${info.duration_s}s`);
});

test('a negative offset that starts a sound before 0 plays it from that point, still in time', { skip }, async () => {
  // The sound is 0.75 s of 3 kHz then 0.75 s of 5 kHz. A mark at 0.25 s with offset -1 s starts it at -0.75 s:
  // the video opens 0.75 s into the sound (5 kHz), never on its 3 kHz head.
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  const video = await silentPicture(ctx);
  const a = await makeTone(join(w, 'head.wav'), 0.75, { freq: 3000 });
  const b = await makeTone(join(w, 'tail.wav'), 0.75, { freq: 5000 });
  const both = join(w, 'two-part.m4a');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', a, '-i', b, '-filter_complex', '[0:a][1:a]concat=n=2:v=0:a=1[a]', '-map', '[a]', '-c:a', 'aac', both]);
  const sound = await fileRef(both, 'audio');
  const marks = [{ kind: 'snap', at_s: 0.25 }, { kind: 'snap', at_s: 3.0 }];
  const out = await mod.run({ video, marks, mark_sounds: [{ id: 'snap', audio: sound }], mark_offset_s: -1 }, ctx);
  const tail = await levelDb(out.video.path, 0.1, 0.6, 5000);
  const head = await levelDb(out.video.path, 0.1, 0.6, 3000);
  assert.ok(tail > -40 && tail - head > 20, `0-0.6 s plays the sound's tail (${tail.toFixed(1)} dB at 5 kHz), not its head (${head.toFixed(1)} dB at 3 kHz)`);
  // The second mark is not pulled before 0: it plays whole from 2.0 s, head first.
  assert.ok((await levelDb(out.video.path, 2.1, 2.6, 3000)) > -40, 'the in-range mark plays from its head');
  // With mark_max_s 0.5 the early cue would end before 0: it is dropped, not played from 0.
  const { ctx: ctx2 } = makeCtx({ partDir: dir });
  const cut = await mod.run({ video: await silentPicture(ctx2), marks, mark_sounds: [{ id: 'snap', audio: sound }], mark_offset_s: -1, mark_max_s: 0.5 }, ctx2);
  assert.ok((await levelDb(cut.video.path, 0.05, 0.9)) < -60, 'a cue that ends before 0 is dropped');
  assert.ok((await levelDb(cut.video.path, 2.05, 2.4, 3000)) > -40, 'the other cue still plays');
});

test('refuses marks it cannot sound, outdoor with no speech, and bad settings', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await silentPicture(ctx);
  const click = await fileRef(await makeTone(join(ctx.workDir, 'click.wav'), 0.5, { freq: 3000 }), 'audio');
  const marks = [{ kind: 'snap', at_s: 1 }];
  await assert.rejects(mod.run({ video, marks }, ctx), (e) => e.code === 'bad_input' && /mark_sounds is empty/.test(e.message));
  await assert.rejects(mod.run({ video, marks, mark_sounds: [{ id: 'click', audio: click }] }, ctx), (e) => e.code === 'bad_input' && /no mark kind \(snap\)/.test(e.message));
  await assert.rejects(
    mod.run({ video, marks, mark_sounds: [{ id: 'snap', audio: click }, { id: 'snap', audio: click }] }, ctx),
    (e) => e.code === 'bad_input' && /twice/.test(e.message),
  );
  await assert.rejects(mod.run({ video, outdoor: true }, ctx), (e) => e.code === 'bad_input' && /outdoor needs speech/.test(e.message));
  await assert.rejects(mod.run({ video, room_tone: { color: 'brown' } }, ctx), (e) => e.code === 'bad_input', 'room_tone needs gain_db');
  await assert.rejects(mod.run({ video, room_tone: { color: 'white', gain_db: -27 } }, ctx), (e) => e.code === 'bad_input', 'white noise is not a room colour');
  await assert.rejects(mod.run({ video, marks: [{ at_s: 1 }], mark_sounds: [{ id: 'snap', audio: click }] }, ctx), (e) => e.code === 'bad_input', 'a mark needs a kind');
});

test('outdoor treats the picture own speech like a phone mic and lays a street bed', { skip }, async () => {
  // A 14 kHz tone stands in for the speech's air: the outdoor band (low-pass 7.4 kHz) takes most of it.
  const { ctx } = makeCtx({ partDir: dir });
  const indoor = await mod.run({ video: await pictureWithTone(ctx, 14000, 0.5, 1.5) }, ctx);
  const { ctx: ctx2 } = makeCtx({ partDir: dir });
  const outdoor = await mod.run({ video: await pictureWithTone(ctx2, 14000, 0.5, 1.5), outdoor: true }, ctx2);
  const dry = await levelDb(indoor.video.path, 0.7, 1.8, 14000);
  const treated = await levelDb(outdoor.video.path, 0.7, 1.8, 14000);
  assert.ok(dry - treated > 8, `the band took the top off: ${dry.toFixed(1)} dB dry, ${treated.toFixed(1)} dB outdoor`);
  assert.equal(await levelDb(indoor.video.path, 2.5, 3.9), -Infinity, 'indoors the gap is silent');
  const street = await levelDb(outdoor.video.path, 2.5, 3.9);
  assert.ok(street > -60 && street < -30, `outdoors the gap has a street bed: ${street.toFixed(1)} dB`);
});

test('outdoor treats the voice when there is one, and the music still ducks under it', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  const video = await silentPicture(ctx);
  const voice = await fileRef(await makeTone(join(w, 'voice.wav'), 1, { freq: 1000 }), 'audio');
  const music = await fileRef(await makeTone(join(w, 'bed.wav'), 4, { freq: 220, volume: 0.5 }), 'audio');
  const out = await mod.run({ video, voice, voice_start_s: 1, music, outdoor: true }, ctx);
  assert.ok((await levelDb(out.video.path, 1.2, 1.8, 1000)) > -30, 'the treated voice is there');
  const under = await levelDb(out.video.path, 1.3, 1.8, 220);
  const clear = await levelDb(out.video.path, 2.6, 2.9, 220);
  assert.ok(clear - under > 6, `bed under the voice ${under.toFixed(1)} dB, clear ${clear.toFixed(1)} dB`);
});
