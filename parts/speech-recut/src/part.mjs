// speech-recut: re-cuts ONE take of on-camera speech into a tighter edit,
// free and local (render-street-interview's recut.py). Picture and sound are
// cut together, so lip sync survives. The take's own heard words
// (transcribe-whisper on that take) say where the speech is; the take's own
// picture cuts (ffmpeg scene detection) say where a join can hide.
//
// What it cuts (src/recut.mjs has the rules): dead air down to max_gap_s,
// with the join on a picture cut when one falls in the silence; repeats and
// stutters inside a line (never a whole line); shots under min_shot_s that
// hold no speech. Output at `fps` (30 by default; Seedance returns 24).
//
// Not built yet (W1-15b): the room-tone loop, the street-light grade and the
// output size cap. The schema already names them so the interface is fixed.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { RecutRefusal, recutPlan } from './recut.mjs';

/** ffmpeg's scene score above which a frame starts a new shot (recut.py measured at 0.30). */
export const RECUT_SCENE_THRESHOLD = 0.3;
const RECUT_FADE_S = 0.006;

/** The take's own shot changes, in seconds: ffmpeg scene detection on a small copy of the picture. */
export async function recutPictureCuts(ctx, video) {
  const { stderr } = await kitFfmpeg(ctx, [
    '-i',
    video.path,
    '-an',
    '-vf',
    `scale=192:-2,select='gt(scene\\,${RECUT_SCENE_THRESHOLD})',showinfo`,
    '-f',
    'null',
    '-',
  ]);
  const cuts = [];
  for (const m of stderr.matchAll(/\bpts_time:\s*(-?\d+(?:\.\d+)?)/g)) {
    const t = Number(m[1]);
    if (Number.isFinite(t) && t > 0) cuts.push(t);
  }
  return [...new Set(cuts)].sort((a, b) => a - b);
}

/** Channels in the take's first sound stream. A mono take is copied to both sides, not mixed down 3 dB. */
export async function recutChannels(ctx, video) {
  try {
    const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'csv=p=0', video.path]);
    const n = parseInt(String(stdout).trim(), 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  if (inputs.room_tone != null) throw ctx.error('bad_input', 'room_tone is not available in this build of speech-recut yet; leave it out');
  if ((inputs.grade ?? 'none') !== 'none') throw ctx.error('bad_input', `grade ${inputs.grade} is not available in this build of speech-recut yet; use none`);
  const info = await ctx.tools.probe(inputs.video.path);
  if (!info.has_audio) throw ctx.error('bad_input', 'the take has no sound; speech-recut cuts picture and speech together');
  if (!info.width || !info.height) throw ctx.error('bad_input', 'the take has no picture');
  const duration = await kitDuration(ctx, inputs.video);
  const srcFps = Number.isFinite(info.fps) && info.fps > 0 ? info.fps : inputs.timeline.fps;
  const fps = inputs.fps ?? 30;
  const pictureCuts = await recutPictureCuts(ctx, inputs.video);
  const mono = (await recutChannels(ctx, inputs.video)) === 1;
  ctx.progress({ done: 1, total: 3 });

  let plan;
  try {
    plan = recutPlan({
      duration,
      fps: srcFps,
      speech: inputs.speech,
      scenes: inputs.scenes,
      timeline_scenes: inputs.timeline.scenes,
      picture_cuts: pictureCuts,
      min_shot_s: inputs.min_shot_s ?? 0.4,
      max_gap_s: inputs.max_gap_s ?? 0.25,
      drop: inputs.drop ?? 'repeats',
    });
  } catch (err) {
    if (err instanceof RecutRefusal) throw ctx.error('bad_input', err.message);
    throw err;
  }
  for (const w of plan.warnings) ctx.log.warn(w);
  ctx.log.info('speech-recut plan', { picture_cuts: pictureCuts.length, removals: plan.removals.length, from_s: +duration.toFixed(3), to_s: plan.seconds });

  // One input per kept stretch, seeked a second early and trimmed exactly, so no stretch of the take is
  // buffered in memory while another is read. Each stretch's sound fades in and out over 6 ms: no clicks.
  const w = info.width - (info.width % 2);
  const h = info.height - (info.height % 2);
  const args = [];
  const graph = [];
  const half = 0.25 / srcFps;
  for (const [k, seg] of plan.keep.entries()) {
    const seek = Math.max(0, seg.start - 1);
    const off = seg.start - seek;
    const len = seg.end - seg.start;
    const frames = Math.max(1, Math.round(len * srcFps));
    if (seek > 0) args.push('-ss', kitNum(seek));
    args.push('-t', kitNum(off + len + 0.5), '-i', inputs.video.path);
    graph.push(
      `[${k}:v]trim=start=${kitNum(Math.max(0, off - half))},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${kitNum(2 / srcFps, 4)},` +
        `trim=end_frame=${frames},setpts=PTS-STARTPTS[v${k}]`,
    );
    const fade = Math.min(RECUT_FADE_S, len / 4);
    graph.push(
      `[${k}:a]atrim=start=${kitNum(off)}:end=${kitNum(off + len)},asetpts=PTS-STARTPTS,aresample=48000,${mono ? 'pan=stereo|c0=c0|c1=c0,' : ''}` +
        `aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,apad,atrim=0:${kitNum(len)},` +
        `afade=t=in:d=${kitNum(fade)},afade=t=out:st=${kitNum(len - fade)}:d=${kitNum(fade)}[a${k}]`,
    );
  }
  const n = plan.keep.length;
  graph.push(`${plan.keep.map((_, k) => `[v${k}][a${k}]`).join('')}concat=n=${n}:v=1:a=1[cv][aout]`);
  graph.push(`[cv]fps=${fps},scale=${w}:${h},setsar=1,format=yuv420p[vout]`);
  ctx.progress({ done: 2, total: 3 });
  await kitFfmpeg(ctx, [
    ...args,
    '-filter_complex',
    graph.join(';'),
    '-map',
    '[vout]',
    '-map',
    '[aout]',
    ...ctx.tools.encodeArgs('aac'),
    ...ctx.tools.encodeArgs('h264-master'),
    '-r',
    String(fps),
    join(ctx.workDir, 'recut.mp4'),
  ]);
  const video = await ctx.file('recut.mp4', 'video');
  const got = await ctx.tools.probe(video.path);
  if (!Number.isFinite(got.duration_s) || Math.abs(got.duration_s - plan.seconds) > 2 / fps + 0.05) {
    throw ctx.error('output_invalid', `the re-cut is ${got.duration_s}s, expected ${kitNum(plan.seconds, 3)}s`);
  }
  ctx.progress({ done: 3, total: 3 });

  const timeline = { duration_s: plan.seconds, width: w, height: h, fps, scenes: plan.scenes, speech: plan.speech };
  if (inputs.timeline.safe_zones) timeline.safe_zones = inputs.timeline.safe_zones;
  return kitCheckOutputs(ctx, manifest, { video, seconds: plan.seconds, timeline, cuts: plan.cuts });
}
