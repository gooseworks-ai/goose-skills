// sound-layer: levels the finished cut to -14 LUFS integrated with the true
// peak at or below -1 dBTP (D16: mix-master's finish mode, one loudness
// target for every video). Two-pass loudnorm in linear mode from a measured
// first pass, then an EBU R128 check of the encoded result. Outside the target,
// up to three corrections re-level the source through an oversampled limiter
// whose ceiling drops by whatever the AAC encode added; a last pass cuts the
// gain to hold the ceiling at some loudness (within the check's +/-2 LU), else
// the step fails. A silent cut (at or below -50 LUFS) passes through untouched.
import { rename } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitLoudness, kitNum } from '../../_lib/part.mjs';

const TARGET_LUFS = -14;
const TOLERANCE_LU = 1;
// The check layer's loudness tolerance: the last-resort pass may land anywhere inside it.
const FALLBACK_TOLERANCE_LU = 2;
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

function within(m, tolerance = TOLERANCE_LU) {
  return m.lufs !== null && Math.abs(m.lufs - TARGET_LUFS) <= tolerance && m.true_peak_db !== null && m.true_peak_db <= TARGET_TP;
}

/** Gain, then a peak limiter at `limitDb` run at 192 kHz (it holds inter-sample peaks), back to 48 kHz stereo. */
function limited(gainDb, limitDb) {
  // alimiter takes a ceiling from 0.0625 (-24 dBFS) to 1.
  const ceiling = Math.min(1, Math.max(0.0625, 10 ** (limitDb / 20)));
  return `volume=${kitNum(gainDb, 3)}dB,aresample=192000,alimiter=limit=${kitNum(ceiling, 4)}:level=0:attack=1:release=50,${STEREO},aresample=48000,${FADE_IN}`;
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
  const tries = [{ path, ...after }];
  // Corrections re-level the source (never a pass's own AAC, so encodes do not stack) with the gain still
  // missing, through a limiter run oversampled so it holds inter-sample peaks. The AAC encode after it can
  // add peak again, so each pass lowers the ceiling by what the last one went over.
  // The limiter eats loudness from peaky content (a chat's pops), so the next gain follows the slope of
  // loudness over gain measured on the last two tries (the source at no gain being the first).
  let gain = TARGET_LUFS - first.lufs;
  let limit = LIMIT_DB;
  let prev = { gain: 0, lufs: first.lufs };
  for (let pass = 1; !within(after) && pass <= 3; pass++) {
    if (pass > 1 && after.lufs !== null) {
      const slope = Math.min(1, Math.max(0.1, (after.lufs - prev.lufs) / (gain - prev.gain || 1)));
      prev = { gain, lufs: after.lufs };
      // At most twice the shortfall: the slope steepens once the limiter lets go.
      gain += Math.sign(TARGET_LUFS - after.lufs) * Math.min(Math.abs(TARGET_LUFS - after.lufs) / slope, 2 * Math.abs(TARGET_LUFS - after.lufs));
    }
    if (pass > 1 && after.true_peak_db !== null && after.true_peak_db > TARGET_TP) limit -= after.true_peak_db - TARGET_TP + PEAK_MARGIN_DB;
    ctx.log.info('sound layer correction pass', { pass, lufs: after.lufs, true_peak_db: after.true_peak_db, gain_db: +gain.toFixed(2), limit_db: +limit.toFixed(2) });
    path = await encode(ctx, inputs.video.path, limited(gain, limit), `levelled-${pass + 1}.mp4`);
    after = await kitLoudness(ctx, path);
    tries.push({ path, ...after });
  }
  // Last resort: a plain gain cut after the same chain holds the ceiling, at some loudness (twice at most).
  for (let cut = 0, n = 0; n < 2 && !tries.some((t) => within(t)); n++) {
    const last = tries[tries.length - 1];
    if (last.true_peak_db === null || last.true_peak_db <= TARGET_TP || last.lufs === null) break;
    cut += last.true_peak_db - TARGET_TP + PEAK_MARGIN_DB;
    ctx.log.info('sound layer peak fallback', { lufs: last.lufs, true_peak_db: last.true_peak_db, cut_db: +cut.toFixed(2) });
    path = await encode(ctx, inputs.video.path, `${limited(gain, limit)},volume=${kitNum(-cut, 3)}dB`, `levelled-fallback-${n + 1}.mp4`);
    tries.push({ path, ...(await kitLoudness(ctx, path)) });
  }
  // The first try on target; else the closest one under the ceiling and inside the check's tolerance.
  const chosen =
    tries.find((t) => within(t)) ||
    tries.filter((t) => within(t, FALLBACK_TOLERANCE_LU)).sort((a, b) => Math.abs(a.lufs - TARGET_LUFS) - Math.abs(b.lufs - TARGET_LUFS))[0];
  if (!chosen) {
    const last = tries[tries.length - 1];
    throw ctx.error('output_invalid', `levelled to ${last.lufs} LUFS, true peak ${last.true_peak_db} dBTP; the target is ${TARGET_LUFS} +/-${TOLERANCE_LU} LUFS at or below ${TARGET_TP} dBTP`);
  }
  after = chosen;
  path = chosen.path;
  ctx.log.info('sound layer levelled', { lufs_before: first.lufs, lufs_after: after.lufs, true_peak_db: after.true_peak_db });
  // Only the chosen pass leaves scratch, as the step's one output.
  await rename(path, join(ctx.workDir, 'levelled.mp4'));
  const video = await ctx.file('levelled.mp4', 'video');
  return kitCheckOutputs(ctx, manifest, { video, timeline: inputs.timeline });
}
