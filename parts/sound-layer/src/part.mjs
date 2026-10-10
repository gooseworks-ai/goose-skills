// sound-layer: levels the finished cut to -14 LUFS integrated with the true
// peak at or below -1 dBTP (D16: mix-master's finish mode, one loudness
// target for every video). Two-pass loudnorm in linear mode from a measured
// first pass, then an EBU R128 check of the result; one gain-and-limit
// correction if the first try lands outside the tolerance, else the step
// fails rather than hand on a cut the server's check would refuse. A silent
// cut (at or below -50 LUFS) has nothing to level and passes through untouched.
import { rename } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitLoudness, kitNum } from '../../_lib/part.mjs';

const TARGET_LUFS = -14;
const TOLERANCE_LU = 1;
const TARGET_TP = -1;
// loudnorm aims below the ceiling: the AAC encode after it can add a few tenths of a dB of peak.
const LOUDNORM_TP = -1.5;
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
    `measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,${STEREO},aresample=48000`;
  let path = await encode(ctx, inputs.video.path, pass2, 'levelled.mp4');
  let after = await kitLoudness(ctx, path);
  // Corrections: the gain still missing, through a peak limiter at -2 dBFS run oversampled so it holds
  // inter-sample peaks. Content with sharp peaks (a chat's pops) loses a little loudness to the limiter on
  // each pass, so up to three passes close the gap; still outside, the step fails.
  for (let pass = 1; !within(after) && pass <= 3; pass++) {
    const gain = after.lufs === null ? 0 : TARGET_LUFS - after.lufs;
    ctx.log.info('sound layer correction pass', { pass, lufs: after.lufs, true_peak_db: after.true_peak_db, gain_db: +gain.toFixed(2) });
    path = await encode(ctx, path, `volume=${kitNum(gain, 3)}dB,aresample=192000,alimiter=limit=0.794:level=0:attack=1:release=50,${STEREO},aresample=48000`, `levelled-${pass + 1}.mp4`);
    after = await kitLoudness(ctx, path);
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
