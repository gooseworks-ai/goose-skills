// audio-mix: lays the voice, the music bed and timed sound effects under the
// picture in one ffmpeg pass. The protocol is the one mix-master and
// stitch-videos-ffmpeg's montage mix landed on: the voice to -16 LUFS and the
// bed to -24 LUFS by static gains from a measured pass, the bed ducking under
// the voice (sidechain 20:1, threshold 0.02, attack 20 ms, release 400 ms), a
// 1 s fade at the bed's tail, effects at their own gains, summed without
// amix's normalising, then a true-peak limiter. The final level of the whole
// cut is the sound layer's (-14 LUFS); this step only balances the tracks.
// 1.1.0 adds a synthesized room tone (podcast skit's brown noise, 90-2600 Hz
// at -27 dB), sounds laid at the cut's marks (a snap click on every snap
// shot), and an outdoor mic chain with a street ambience bed (ugc-product's
// "outdoor mic realism"). No audio asset ships with the part: every bed is
// anoisesrc with a fixed seed, so a mix is the same on every run.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitLoudness, kitNum } from '../../_lib/part.mjs';

const FMT = 'aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
// ugc-product's outdoor mic: a phone mic's band, a little presence, less boxiness, a gentle 3:1 compressor.
const OUTDOOR_VOICE =
  'highpass=f=110,lowpass=f=7400,equalizer=f=2600:t=q:w=1:g=2.5,equalizer=f=300:t=q:w=1:g=-1.5,' +
  'acompressor=threshold=0.125:ratio=3:attack=10:release=200:makeup=1';
const STREET = { color: 'brown', gain_db: -27, highpass_hz: 40, lowpass_hz: 1500 };
const NOISE_SEED = 4201;

/** A seeded, band-limited noise bed of the picture's length, at an absolute level. */
function noiseBed(tone, dur, label, { moving = false } = {}) {
  const color = tone.color ?? 'brown';
  const hp = tone.highpass_hz ?? 90;
  const lp = tone.lowpass_hz ?? 2600;
  // Traffic and wind swell slowly; a room does not.
  const swell = moving ? ',tremolo=f=0.15:d=0.35' : '';
  return (
    `anoisesrc=d=${kitNum(dur)}:c=${color}:r=48000:a=1:s=${NOISE_SEED},highpass=f=${kitNum(hp, 1)},lowpass=f=${kitNum(lp, 1)}` +
    `${swell},volume=${kitNum(tone.gain_db, 2)}dB,${FMT},atrim=0:${kitNum(dur)}[${label}]`
  );
}

/**
 * The marks that have a sound and land inside the picture: [{ sound, at_s, skip_s }].
 * A negative offset can put a sound's start before 0: it then plays from skip_s into the sound at 0,
 * so it stays in time; a sound that would end before 0 is dropped.
 */
async function markCues(ctx, inputs, dur) {
  const marks = inputs.marks || [];
  const sounds = inputs.mark_sounds || [];
  if (!marks.length) return [];
  if (!sounds.length) throw ctx.error('bad_input', 'marks are set but mark_sounds is empty: give a sound for at least one mark kind');
  const byId = new Map();
  for (const s of sounds) {
    if (byId.has(s.id)) throw ctx.error('bad_input', `mark_sounds names "${s.id}" twice`);
    byId.set(s.id, s);
  }
  const offset = inputs.mark_offset_s ?? 0;
  const lengths = new Map();
  const cues = [];
  let late = 0;
  let early = 0;
  for (const m of marks) {
    const sound = byId.get(m.kind);
    if (!sound) continue;
    const start = m.at_s + offset;
    if (start >= dur - 0.02) {
      late++;
      continue;
    }
    const skip = start < 0 ? -start : 0;
    if (skip > 0) {
      if (!lengths.has(sound)) lengths.set(sound, await kitDuration(ctx, sound.audio));
      const heard = inputs.mark_max_s ? Math.min(lengths.get(sound), inputs.mark_max_s) : lengths.get(sound);
      if (skip >= heard - 0.02) {
        early++;
        continue;
      }
    }
    cues.push({ sound, at_s: +Math.max(0, start).toFixed(3), skip_s: +skip.toFixed(3) });
  }
  if (!cues.length && !marks.some((m) => byId.has(m.kind)))
    throw ctx.error('bad_input', `no mark kind (${[...new Set(marks.map((m) => m.kind))].join(', ')}) has a sound in mark_sounds (${[...byId.keys()].join(', ')})`);
  if (late) ctx.log.info(`${late} mark sound(s) would start past the end of the video and were dropped`);
  if (early) ctx.log.info(`${early} mark sound(s) would end before the video starts and were dropped`);
  return cues;
}

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
  const outdoor = inputs.outdoor === true;
  if (outdoor && !inputs.voice && !keepOwn) throw ctx.error('bad_input', "outdoor needs speech to treat: a voice, or a picture whose own sound is kept");
  const marked = await markCues(ctx, inputs, dur);
  if (!inputs.voice && !inputs.music && !(inputs.sfx || []).length && !inputs.effects && !keepOwn && !inputs.room_tone && !marked.length) {
    // Nothing to lay under the picture (a style whose music is optional, with none chosen): a silent track
    // of the picture's length, so every later step and layer gets a cut with sound to read.
    ctx.log.info('nothing to mix: a silent track');
    await kitFfmpeg(ctx, [
      '-i',
      inputs.video.path,
      '-f',
      'lavfi',
      '-t',
      kitNum(dur),
      '-i',
      'anullsrc=channel_layout=stereo:sample_rate=48000',
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-c:v',
      'copy',
      ...ctx.tools.encodeArgs('aac'),
      '-t',
      kitNum(dur),
      '-movflags',
      '+faststart',
      join(ctx.workDir, 'mixed.mp4'),
    ]);
    return kitCheckOutputs(ctx, manifest, { video: await ctx.file('mixed.mp4', 'video'), seconds: +dur.toFixed(3) });
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
      `[${n}:a]${FMT},volume=${db}dB,${outdoor ? `${OUTDOOR_VOICE},` : ''}adelay=${Math.round(start * 1000)}:all=1,apad,atrim=0:${kitNum(dur)},asetpts=PTS-STARTPTS` +
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

  // Sounds at the cut's marks: one input per sound, split to every mark that uses it.
  const bySound = new Map();
  for (const c of marked) bySound.set(c.sound, [...(bySound.get(c.sound) || []), c]);
  const markGain = inputs.mark_gain ?? 1;
  const markCut = inputs.mark_max_s
    ? `atrim=0:${kitNum(inputs.mark_max_s)},afade=t=out:st=${kitNum(Math.max(0, inputs.mark_max_s - 0.06))}:d=0.06,`
    : '';
  // A cue whose sound starts before 0 skips that much of the sound, then plays from 0.
  const place = (c) =>
    `${c.skip_s > 0 ? `atrim=start=${kitNum(c.skip_s)},asetpts=PTS-STARTPTS,` : ''}adelay=${Math.round(c.at_s * 1000)}:all=1,apad,atrim=0:${kitNum(dur)}`;
  for (const [k, [sound, cues]] of [...bySound.entries()].entries()) {
    args.push('-i', sound.audio.path);
    const head = `[${n}:a]${FMT},${markCut}volume=${markGain}`;
    if (cues.length === 1) {
      graph.push(`${head},${place(cues[0])}[mk${k}]`);
    } else {
      graph.push(`${head},asplit=${cues.length}${cues.map((_, j) => `[mk${k}s${j}]`).join('')}`);
      for (const [j, c] of cues.entries()) graph.push(`[mk${k}s${j}]${place(c)}[mk${k}d${j}]`);
      graph.push(`${cues.map((_, j) => `[mk${k}d${j}]`).join('')}amix=inputs=${cues.length}:duration=first:normalize=0[mk${k}]`);
    }
    labels.push(`[mk${k}]`);
    n++;
  }

  if (keepOwn) {
    const key = inputs.music && duck && duckBy === 'picture';
    const treat = outdoor && !inputs.voice ? `,${OUTDOOR_VOICE}` : '';
    graph.push(`[0:a]${FMT},volume=${inputs.video_audio_db ?? 0}dB${treat},apad,atrim=0:${kitNum(dur)}${key ? ',asplit=2[orig][key]' : '[orig]'}`);
    labels.push('[orig]');
  }

  // Beds at an absolute level, laid after the voice is levelled and never ducked.
  if (outdoor) {
    graph.push(noiseBed(inputs.room_tone ? { ...STREET, ...inputs.room_tone } : STREET, dur, 'street', { moving: true }));
    labels.push('[street]');
  } else if (inputs.room_tone) {
    graph.push(noiseBed(inputs.room_tone, dur, 'room'));
    labels.push('[room]');
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
