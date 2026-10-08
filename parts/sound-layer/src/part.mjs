// sound-layer: levels the finished cut to -14 LUFS integrated with the true
// peak at or below -1 dBTP (D16: mix-master's finish mode, one loudness
// target for every video). Two-pass loudnorm in linear mode from a measured
// first pass, then an EBU R128 check of the result; one gain-and-limit
// correction if the first try lands outside the tolerance, else the step
// fails rather than hand on a cut the server's check would refuse.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitLoudness, kitNum } from '../../_lib/part.mjs';

const TARGET_LUFS = -14;
const TOLERANCE_LU = 1;
const TARGET_TP = -1;
const TP_SLACK = 0.2;

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
  return m.lufs !== null && Math.abs(m.lufs - TARGET_LUFS) <= TOLERANCE_LU && (m.true_peak_db === null || m.true_peak_db <= TARGET_TP + TP_SLACK);
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
    join(ctx.workDir, out),
  ]);
  return join(ctx.workDir, out);
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const info = await ctx.tools.probe(inputs.video.path);
  if (!info.has_audio) throw ctx.error('bad_input', 'the cut has no sound to level');
  const first = await kitLoudness(ctx, inputs.video.path);
  if (first.lufs === null || !Number.isFinite(first.lufs) || first.lufs <= -70) {
    throw ctx.error('bad_input', 'the cut is silent; there is no sound to level');
  }
  // Pass 1: measure for loudnorm. A target range at least the input's keeps it linear (a pure gain).
  const { stderr } = await kitFfmpeg(ctx, ['-i', inputs.video.path, '-map', '0:a:0', '-af', `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=11:print_format=json`, '-f', 'null', '-']);
  const m = loudnormJson(stderr);
  if (!m) throw ctx.error('tool_failed', 'loudnorm printed no measurement');
  const lra = Math.min(50, Math.max(11, Math.ceil(Number(m.input_lra) + 1)));
  const pass2 =
    `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=${lra}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:` +
    `measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
  let path = await encode(ctx, inputs.video.path, pass2, 'levelled.mp4');
  let after = await kitLoudness(ctx, path);
  if (!within(after)) {
    // One correction: the gain still missing, then a true-peak limiter at -1.5 dBFS (oversampled).
    const gain = TARGET_LUFS - after.lufs;
    ctx.log.info('sound layer correction pass', { lufs: after.lufs, true_peak_db: after.true_peak_db, gain_db: +gain.toFixed(2) });
    path = await encode(ctx, path, `volume=${kitNum(gain, 3)}dB,aresample=192000,alimiter=limit=0.841:level=0,aresample=48000`, 'levelled-2.mp4');
    after = await kitLoudness(ctx, path);
    if (!within(after)) {
      throw ctx.error('output_invalid', `levelled to ${after.lufs} LUFS, true peak ${after.true_peak_db} dBTP; the target is ${TARGET_LUFS} +/-${TOLERANCE_LU} LUFS at or below ${TARGET_TP} dBTP`);
    }
  }
  ctx.log.info('sound layer levelled', { lufs_before: first.lufs, lufs_after: after.lufs, true_peak_db: after.true_peak_db });
  const video = await ctx.file(path.slice(ctx.workDir.length + 1), 'video');
  return kitCheckOutputs(ctx, manifest, { video, timeline: inputs.timeline });
}
