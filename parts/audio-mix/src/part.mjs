// audio-mix: lays the voice, the music bed and timed sound effects under the
// picture in one ffmpeg pass. The protocol is the one mix-master and
// stitch-videos-ffmpeg's montage mix landed on: the voice to -16 LUFS and the
// bed to -24 LUFS by static gains from a measured pass, the bed ducking under
// the voice (sidechain 20:1, threshold 0.02, attack 20 ms, release 400 ms), a
// 1 s fade at the bed's tail, effects at their own gains, summed without
// amix's normalising, then a true-peak limiter. The final level of the whole
// cut is the sound layer's (-14 LUFS); this step only balances the tracks.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitLoudness, kitNum } from '../../_lib/part.mjs';

const FMT = 'aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';

async function gainTo(ctx, file, target) {
  const { lufs } = await kitLoudness(ctx, file.path);
  if (lufs === null || !Number.isFinite(lufs) || lufs <= -70) return 0;
  return +(target - lufs).toFixed(3);
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const dur = await kitDuration(ctx, inputs.video);
  const picture = await ctx.tools.probe(inputs.video.path);
  // The picture's own sound (phone-chat's UI sounds, clips kept with their sound) is kept unless dropped.
  const keepOwn = inputs.keep_video_audio ?? picture.has_audio;
  if (inputs.keep_video_audio && !picture.has_audio) throw ctx.error('bad_input', 'keep_video_audio is set but the video has no sound');
  if (!inputs.voice && !inputs.music && !(inputs.sfx || []).length && !inputs.effects && !keepOwn) {
    throw ctx.error('bad_input', 'nothing to mix: give voice, music, sfx or effects, or a picture with its own sound');
  }
  const duck = inputs.duck === undefined ? !!inputs.voice : inputs.duck !== false;
  const duckBy = inputs.voice ? 'voice' : keepOwn ? 'picture' : null;
  const args = ['-i', inputs.video.path];
  const graph = [];
  const labels = [];
  let n = 1;

  if (inputs.voice) {
    const start = inputs.voice_start_s ?? 0;
    if (start >= dur) throw ctx.error('bad_input', 'voice_start_s is past the end of the video');
    const db = await gainTo(ctx, inputs.voice, inputs.voice_lufs ?? -16);
    args.push('-i', inputs.voice.path);
    graph.push(
      `[${n}:a]${FMT},volume=${db}dB,adelay=${Math.round(start * 1000)}:all=1,apad,atrim=0:${kitNum(dur)},asetpts=PTS-STARTPTS` +
        (inputs.music && duck ? ',asplit=2[vo][key]' : '[vo]'),
    );
    labels.push('[vo]');
    n++;
  }

  if (inputs.music) {
    const start = inputs.music_start_s ?? 0;
    const need = dur - start;
    if (need <= 0) throw ctx.error('bad_input', 'music_start_s is past the end of the video');
    const db = await gainTo(ctx, inputs.music, inputs.music_lufs ?? -24);
    const musicLength = await kitDuration(ctx, inputs.music);
    if (musicLength + 0.05 < need) args.push('-stream_loop', '-1');
    args.push('-i', inputs.music.path);
    let chain = `[${n}:a]${FMT},volume=${db}dB,atrim=0:${kitNum(need)},asetpts=PTS-STARTPTS`;
    const fadeIn = inputs.music_fade_in_s ?? 0;
    if (fadeIn > 0) chain += `,afade=t=in:d=${kitNum(fadeIn, 3)}`;
    chain += `,adelay=${Math.round(start * 1000)}:all=1,apad,atrim=0:${kitNum(dur)}`;
    const fadeOut = Math.min(inputs.fade_out_seconds ?? 1, dur);
    if (fadeOut > 0) chain += `,afade=t=out:st=${kitNum(dur - fadeOut)}:d=${kitNum(fadeOut, 3)}`;
    graph.push(`${chain}[bed]`);
    if (duck && duckBy) {
      const d = typeof inputs.duck === 'object' ? inputs.duck : {};
      graph.push(
        `[bed][key]sidechaincompress=threshold=${d.threshold ?? 0.02}:ratio=${Math.min(d.ratio ?? 20, 20)}:` +
          `attack=${d.attack_ms ?? 20}:release=${d.release_ms ?? 400}[music]`,
      );
    } else graph.push('[bed]anull[music]');
    labels.push('[music]');
    n++;
  }

  // A whole effects track from 0 (phone-chat's sfx) is one cue at 0 with its own gain.
  const cues = [...(inputs.effects ? [{ audio: inputs.effects, at_s: 0, gain: inputs.effects_gain ?? 1 }] : []), ...(inputs.sfx || [])];
  for (const [i, fx] of cues.entries()) {
    if (fx.at_s >= dur) throw ctx.error('bad_input', `a sound effect starts at ${fx.at_s}s, past the end of the video`);
    args.push('-i', fx.audio.path);
    const cut = fx.max_s ? `atrim=0:${kitNum(fx.max_s)},afade=t=out:st=${kitNum(Math.max(0, fx.max_s - 0.06))}:d=0.06,` : '';
    const ms = Math.round(fx.at_s * 1000);
    graph.push(`[${n}:a]${FMT},${cut}adelay=${ms}:all=1,volume=${fx.gain ?? 1},apad,atrim=0:${kitNum(dur)}[fx${i}]`);
    labels.push(`[fx${i}]`);
    n++;
  }

  if (keepOwn) {
    const key = inputs.music && duck && duckBy === 'picture';
    graph.push(`[0:a]${FMT},volume=${inputs.video_audio_db ?? 0}dB,apad,atrim=0:${kitNum(dur)}${key ? ',asplit=2[orig][key]' : '[orig]'}`);
    labels.push('[orig]');
  }

  const sum = labels.length > 1 ? `${labels.join('')}amix=inputs=${labels.length}:duration=first:normalize=0` : `${labels[0]}anull`;
  // Peak limiter at -1 dBTP, run oversampled so it also holds inter-sample peaks.
  graph.push(`${sum},aresample=192000,alimiter=limit=0.891:level=0,aresample=48000[mix]`);
  await kitFfmpeg(ctx, [
    ...args,
    '-filter_complex',
    graph.join(';'),
    '-map',
    '0:v:0',
    '-map',
    '[mix]',
    '-c:v',
    'copy',
    ...ctx.tools.encodeArgs('aac'),
    '-t',
    kitNum(dur),
    '-movflags',
    '+faststart',
    join(ctx.workDir, 'mixed.mp4'),
  ]);
  const video = await ctx.file('mixed.mp4', 'video');
  return kitCheckOutputs(ctx, manifest, { video, seconds: +dur.toFixed(3) });
}
