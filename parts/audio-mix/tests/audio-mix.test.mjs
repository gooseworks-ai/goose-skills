import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, levelDb, loadPart, makeCtx, makeTone, makeVideo, probe } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadPart('audio-mix', '1.0.0');
const ffmpeg = await hasFfmpeg();

async function fixture(ctx) {
  const w = ctx.workDir;
  return {
    video: await fileRef(await makeVideo(join(w, 'pic.mp4'), 4, { width: 320, height: 568, tone: 0 }), 'video'),
    voice: await fileRef(await makeTone(join(w, 'voice.wav'), 1, { freq: 1000 }), 'audio'),
    music: await fileRef(await makeTone(join(w, 'bed.wav'), 4, { freq: 220, volume: 0.5 }), 'audio'),
    pop: await fileRef(await makeTone(join(w, 'pop.wav'), 0.2, { freq: 3000 }), 'audio'),
  };
}

test('the bed ducks under the voice and comes back after it', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const f = await fixture(ctx);
  const out = await mod.run({ video: f.video, voice: f.voice, voice_start_s: 1, music: f.music }, ctx);
  const under = await levelDb(out.video.path, 1.3, 1.8, 220);
  const clear = await levelDb(out.video.path, 2.6, 2.9, 220);
  assert.ok(clear - under > 6, `bed under the voice ${under.toFixed(1)} dB, clear ${clear.toFixed(1)} dB`);
  const info = await probe(out.video.path);
  assert.ok(Math.abs(info.duration_s - 4) < 0.1, `mixed cut is ${info.duration_s}s`);
});

test('a sound effect lands at its time and not before', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const f = await fixture(ctx);
  const out = await mod.run({ video: f.video, sfx: [{ audio: f.pop, at_s: 3, gain: 0.8 }] }, ctx);
  const at = await levelDb(out.video.path, 3.02, 3.18, 3000);
  const before = await levelDb(out.video.path, 2.0, 2.9, 3000);
  assert.ok(at - before > 30, `effect at 3s ${at.toFixed(1)} dB, before ${before.toFixed(1)} dB`);
});

test('refuses a mix with nothing to lay under the picture', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const f = await fixture(ctx);
  await assert.rejects(mod.run({ video: f.video }, ctx), (e) => e.code === 'bad_input');
});

test("with no voice the bed ducks under the picture's own sound, which is kept", { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  const ui = await fileRef(await makeVideo(join(w, 'chat.mp4'), 4, { width: 320, height: 568, tone: 0 }), 'video');
  // A picture whose own sound is a 1000 Hz pop from 1.0 to 2.0 s.
  const withPop = join(w, 'chat-pop.mp4');
  await makeTone(join(w, 'pop.wav'), 1, { freq: 1000 });
  const { run } = await import('../../_tools/kit-harness.mjs');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-i', ui.path, '-i', join(w, 'pop.wav'), '-filter_complex', '[1:a]adelay=1000:all=1,apad[a]', '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-t', '4', withPop]);
  const f = await fixture(ctx);
  const out = await mod.run({ video: await fileRef(withPop, 'video'), music: f.music, duck: true, fade_out_seconds: 0.8 }, ctx);
  assert.ok((await levelDb(out.video.path, 1.3, 1.8, 1000)) > -30, 'the picture keeps its own sound');
  const under = await levelDb(out.video.path, 1.3, 1.8, 220);
  const clear = await levelDb(out.video.path, 2.6, 2.9, 220);
  assert.ok(clear - under > 6, `bed under the picture's sound ${under.toFixed(1)} dB, clear ${clear.toFixed(1)} dB`);
});
