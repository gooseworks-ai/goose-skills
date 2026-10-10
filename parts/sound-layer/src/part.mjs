// sound-layer: levels the finished cut to -14 LUFS integrated with the true
// peak at or below -1 dBTP (D16: mix-master's finish mode, one loudness
// target for every video). Two-pass loudnorm in linear mode from a measured
// first pass, then an EBU R128 check of the encoded result. Outside the target,
// corrections re-level the source through an oversampled limiter, searching
// the gain inside a bracket and lowering the limiter's ceiling by whatever the
// AAC encode added; still outside after them, the step fails. A silent cut (at
// or below -50 LUFS) passes through untouched.
import { rename } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitLoudness, kitNum } from '../../_lib/part.mjs';

const TARGET_LUFS = -14;
const TOLERANCE_LU = 1;
// Corrections are an audio-only encode and a meter pass each: cheap enough to search with.
const MAX_CORRECTIONS = 8;
const TARGET_TP = -1;
// loudnorm aims below the ceiling: the AAC encode after it can add a few tenths of a dB of peak.
const LOUDNORM_TP = -1.5;
// The corrections' first limiter ceiling, in dBFS; the AAC encode adds up to about 1 dB, and a pass that
// still goes over lowers it.
const LIMIT_DB = -2;
// A cut that starts at full level makes the AAC encoder's first frame overshoot by up to 4 dB: every
// chain fades the first 20 ms in.
const FADE_IN = 'afade=t=in:d=0.02';
// Kept between the measured peak and the ceiling when a pass lowers it.
const PEAK_MARGIN_DB = 0.3;
// At or below this a cut is near silence (faint UI sounds, no bed): lifting it to the target fails.
const SILENT_LUFS = -50;
// ffmpeg 6.0 leaves the channel layout unset after loudnorm and alimiter, and the AAC encode then
// cannot pick one ("Cannot select channel layout"): every chain names stereo before its last resample.
const STEREO = 'aformat=channel_layouts=stereo';

function loudnormJson(stderr) {
  const blocks = stderr.match(/\{[^{}]*\}/g);
  if (!blocks) return null;
  try {
    return JSON.parse(blocks.at(-1));
  } catch {
    return null;
  }
}

function within(m) {
  return m.lufs !== null && Math.abs(m.lufs - TARGET_LUFS) <= TOLERANCE_LU && m.true_peak_db !== null && m.true_peak_db <= TARGET_TP;
}

/** Gain, then a peak limiter at `limitDb` run at 192 kHz (it holds inter-sample peaks), back to 48 kHz stereo. */
function limited(gainDb, limitDb) {
  // alimiter takes a ceiling from 0.0625 (-24 dBFS) to 1.
  const ceiling = Math.min(1, Math.max(0.0625, 10 ** (limitDb / 20)));
  return `volume=${kitNum(gainDb, 3)}dB,aresample=192000,alimiter=limit=${kitNum(ceiling, 4)}:level=0:attack=1:release=50,${STEREO},aresample=48000,${FADE_IN}`;
}

/** The next gain to try: inside the bracket when there is one, else a step from the nearest side. */
function nextGain(under, over) {
  if (under && over) {
    const span = over.gain - under.gain;
    const t = (TARGET_LUFS - under.lufs) / (over.lufs - under.lufs || 1);
    // Interpolate, but never into the outer tenths of the bracket, where it stalls: halve instead.
    return under.gain + span * (t > 0.1 && t < 0.9 ? t : 0.5);
  }
  // One side only: at least the whole shortfall (loudness never rises faster than gain), at most twice it.
  if (under) return under.gain + 2 * (TARGET_LUFS - under.lufs);
  return over.gain - 2 * (over.lufs - TARGET_LUFS);
}

async function encode(ctx, video, filter, out) {
  await kitFfmpeg(ctx, [
    '-i',
    video,
    '-map',
    '0:v:0',
    '-map',
    '0:a:0',
    '-c:v',
    'copy',
    '-af',
    filter,
    ...ctx.tools.encodeArgs('aac'),
    '-movflags',
    '+faststart',
    join(ctx.tmpDir, out),
  ]);
  return join(ctx.tmpDir, out);
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const info = await ctx.tools.probe(inputs.video.path);
  const first = info.has_audio ? await kitLoudness(ctx, inputs.video.path) : { lufs: null };
  if (first.lufs === null || !Number.isFinite(first.lufs) || first.lufs <= SILENT_LUFS) {
    // A silent cut (no music chosen, no voice) has nothing to level: it passes through untouched.
    ctx.log.info('sound layer passes a silent cut through', { has_audio: info.has_audio, lufs: first.lufs });
    return kitCheckOutputs(ctx, manifest, { video: inputs.video, timeline: inputs.timeline });
  }
  // Pass 1: measure for loudnorm. A target range at least the input's keeps it linear (a pure gain).
  const { stderr } = await kitFfmpeg(ctx, ['-i', inputs.video.path, '-map', '0:a:0', '-af', `loudnorm=I=${TARGET_LUFS}:TP=${LOUDNORM_TP}:LRA=11:print_format=json`, '-f', 'null', '-']);
  const m = loudnormJson(stderr);
  if (!m) throw ctx.error('tool_failed', 'loudnorm printed no measurement');
  const lra = Math.min(50, Math.max(11, Math.ceil(Number(m.input_lra) + 1)));
  const pass2 =
    `loudnorm=I=${TARGET_LUFS}:TP=${LOUDNORM_TP}:LRA=${lra}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:` +
    `measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,${STEREO},aresample=48000,${FADE_IN}`;
  let path = await encode(ctx, inputs.video.path, pass2, 'levelled.mp4');
  let after = await kitLoudness(ctx, path);
  // Corrections re-level the source (never a pass's own AAC, so encodes do not stack) through a limiter run
  // oversampled so it holds inter-sample peaks. Loudness rises with gain but not linearly (the limiter eats
  // more of a peaky cut the harder it is driven), so the gain is searched inside a bracket: the highest gain
  // that came out too quiet and the lowest that came out too loud, by interpolation, else halving. The AAC
  // encode can add peak again, so a pass over the ceiling lowers the limiter's ceiling and restarts the
  // bracket. Only a pass inside both targets is used.
  let limit = LIMIT_DB;
  let under = first.lufs < TARGET_LUFS ? { gain: 0, lufs: first.lufs } : null;
  let over = first.lufs > TARGET_LUFS ? { gain: 0, lufs: first.lufs } : null;
  let gain = TARGET_LUFS - first.lufs;
  for (let pass = 1; !within(after) && pass <= MAX_CORRECTIONS; pass++) {
    ctx.log.info('sound layer correction pass', { pass, lufs: after.lufs, true_peak_db: after.true_peak_db, gain_db: +gain.toFixed(2), limit_db: +limit.toFixed(2) });
    path = await encode(ctx, inputs.video.path, limited(gain, limit), `levelled-${pass + 1}.mp4`);
    after = await kitLoudness(ctx, path);
    if (after.lufs === null || after.true_peak_db === null) break;
    if (after.true_peak_db > TARGET_TP) {
      limit -= after.true_peak_db - TARGET_TP + PEAK_MARGIN_DB;
      under = null;
      over = null;
      continue;
    }
    if (after.lufs < TARGET_LUFS) under = { gain, lufs: after.lufs };
    else over = { gain, lufs: after.lufs };
    gain = nextGain(under, over);
  }
  if (!within(after)) {
    throw ctx.error('output_invalid', `levelled to ${after.lufs} LUFS, true peak ${after.true_peak_db} dBTP; the target is ${TARGET_LUFS} +/-${TOLERANCE_LU} LUFS at or below ${TARGET_TP} dBTP`);
  }
  ctx.log.info('sound layer levelled', { lufs_before: first.lufs, lufs_after: after.lufs, true_peak_db: after.true_peak_db });
  // Only the chosen pass leaves scratch, as the step's one output.
  await rename(path, join(ctx.workDir, 'levelled.mp4'));
  const video = await ctx.file('levelled.mp4', 'video');
  return kitCheckOutputs(ctx, manifest, { video, timeline: inputs.timeline });
}
