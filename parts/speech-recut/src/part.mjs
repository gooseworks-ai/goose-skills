// speech-recut: re-cuts ONE take of on-camera speech into a tighter edit,
// free and local (render-street-interview's recut.py). Picture and sound are
// cut together, so lip sync survives. The take's own heard words
// (transcribe-whisper on that take) say where the speech is; the take's own
// picture cuts (ffmpeg scene detection) say where a join can hide.
//
// What it cuts (src/recut.mjs has the rules): dead air down to max_gap_s,
// with the join on a picture cut when one falls in the silence; repeats and
// stutters inside a line (never a whole line); shots under min_shot_s that
// hold no speech. Output at `fps` (30 by default; Seedance returns 24). A
// short shot that holds speech takes back some of the dead air beside it, or
// (1.0.1) has its picture covered by the shot before or after it while its
// sound plays on, so the cut never flashes a shot under min_shot_s.
//
// Finishing: `room_tone` loops the take's quietest speech-free window under
// the whole edit, so the street does not step at every join; `grade:
// street-light` is recut.py's phone_look_video.py default (a 0.03 black lift
// into the real-footage band, a 0.12 unsharp halo, no grain). The final encode
// caps its bitrate and an output over 180 MB is refused (size rule, critic #38).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { RECUT_LEVEL_RATE, RECUT_LEVEL_STEP_S, RECUT_ROOM_PAD_S, RecutRefusal, recutCheckSpeech, recutIsExtra, recutLevels, recutPlan, recutQuietWindow, recutSpeechBusy } from './recut.mjs';

/** ffmpeg's scene score above which a frame starts a new shot (recut.py measured at 0.30). */
export const RECUT_SCENE_THRESHOLD = 0.3;
const RECUT_FADE_S = 0.006;
/** A finished video over this is refused before upload (the server takes 200 MB; critic #38). */
export const RECUT_MAX_BYTES = 180 * 1024 * 1024;
/** The bitrate cap on the final encode (size rule §4.12; street-light has no grain). */
export const RECUT_RATE_CAP = ['-maxrate', '16M', '-bufsize', '32M'];
/** The room-tone bed's level against the window it is cut from, when room_tone gives no gain_db. */
export const RECUT_ROOM_GAIN_DB = -6;

/**
 * The video filters a grade adds after the frame rate and size, or '' for none. street-light is
 * phone_look_video.py at its shipped defaults: crushed generated blacks lifted 0.03 into the
 * real-footage band (measured 3.1 -> 9.7 on the 1st percentile), highlights eased to 0.98, a 0.12
 * unsharp halo (0.4 over-sharpened into an AI tell), no grain, no colour match (strength 0).
 */
export function recutGradeChain(grade) {
  if (grade === 'street-light') return 'curves=all=0/0.03 0.5/0.5 1/0.98,unsharp=5:5:0.12:5:5:0.0';
  return '';
}

/** Throws output_invalid for a finished video over `max` bytes, before it is handed on. */
export function recutCheckSize(ctx, video, max = RECUT_MAX_BYTES) {
  if (Number.isFinite(video.bytes) && video.bytes > max) {
    const mb = (b) => (b / 1024 / 1024).toFixed(1);
    throw ctx.error('output_invalid', `the re-cut is ${mb(video.bytes)} MB, over the ${mb(max)} MB a finished video may be; use a shorter take`);
  }
  return video;
}

/**
 * The take's quietest speech-free window, measured on its sound: {start_s, end_s, level_db, peak_db},
 * or null when no window of at least 0.4 s is free of speech and of digital silence. `heard` are
 * stretches that hold speech with no timed words (recutPlan's `heard`); they are never used.
 */
export async function recutFindRoomTone(ctx, video, speech, duration, heard = []) {
  const raw = join(ctx.tmpDir, 'levels.raw');
  await kitFfmpeg(ctx, ['-i', video.path, '-map', '0:a:0', '-vn', '-ac', '1', '-ar', String(RECUT_LEVEL_RATE), '-c:a', 'pcm_s16le', '-f', 's16le', raw]);
  const levels = recutLevels(readFileSync(raw));
  return recutQuietWindow({ levels, step_s: RECUT_LEVEL_STEP_S, busy: recutSpeechBusy(speech, RECUT_ROOM_PAD_S, heard), duration });
}

/**
 * The bed's loop: the window, then the window reversed, as a stereo 48 kHz wav. Played on a loop the
 * palindrome has no seam (each end meets the same sample), so no click repeats under the edit.
 */
export async function recutRoomLoop(ctx, video, win, mono) {
  const out = join(ctx.tmpDir, 'room.wav');
  const len = win.end_s - win.start_s;
  await kitFfmpeg(ctx, [
    '-ss',
    kitNum(win.start_s),
    '-t',
    kitNum(len),
    '-i',
    video.path,
    '-filter_complex',
    `[0:a]aresample=48000,${mono ? 'pan=stereo|c0=c0|c1=c0,' : ''}aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,` +
      `atrim=0:${kitNum(len)},asetpts=PTS-STARTPTS,asplit[f][r];[r]areverse[b];[f][b]concat=n=2:v=0:a=1[room]`,
    '-map',
    '[room]',
    '-c:a',
    'pcm_s16le',
    out,
  ]);
  return out;
}

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

/**
 * The filters that cover short shots on the joined picture `input` (at the take's frame rate, `total` frames):
 * each cover [a, b) of frame numbers shows the frame before it (`prev`) or after it (`next`) instead, by
 * cutting the picture around the covers and padding the pieces either side with a held frame. Returns the
 * filter strings, ending in `[out]`; the frame count is unchanged.
 */
export function recutCoverGraph(input, covers, total, out) {
  const sorted = [...covers].sort((x, y) => x.a - y.a);
  const pieces = [];
  let at = 0;
  for (const c of sorted) {
    pieces.push({ s: at, e: c.a, start: 0, stop: 0 });
    at = c.b;
  }
  pieces.push({ s: at, e: total, start: 0, stop: 0 });
  const real = (j) => pieces[j].e > pieces[j].s;
  sorted.forEach((c, i) => {
    const len = c.b - c.a;
    const before = () => [...pieces.keys()].filter((j) => j <= i && real(j)).at(-1);
    const after = () => [...pieces.keys()].find((j) => j > i && real(j));
    const j = c.from === 'prev' ? (before() ?? after()) : (after() ?? before());
    if (j === undefined) throw new Error('every shot is covered; there is no picture to hold');
    if (j <= i) pieces[j].stop += len;
    else pieces[j].start += len;
  });
  const used = pieces.filter((p) => p.e > p.s);
  const chain = (p) =>
    `trim=start_frame=${p.s}:end_frame=${p.e},setpts=PTS-STARTPTS` +
    (p.start ? `,tpad=start=${p.start}:start_mode=clone` : '') +
    (p.stop ? `,tpad=stop=${p.stop}:stop_mode=clone` : '');
  if (used.length === 1) return [`[${input}]${chain(used[0])}[${out}]`];
  return [
    `[${input}]split=${used.length}${used.map((_, k) => `[cs${k}]`).join('')}`,
    ...used.map((p, k) => `[cs${k}]${chain(p)}[cp${k}]`),
    `${used.map((_, k) => `[cp${k}]`).join('')}concat=n=${used.length}:v=1:a=0[${out}]`,
  ];
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
  // `speech` is optional: a style can only bind step.<id>.<output>, one level, so the street-interview
  // chain passes transcribe-whisper's timeline and its speech is used. The refusals below still apply.
  if (inputs.speech == null) inputs = { ...inputs, speech: inputs.timeline.speech };
  // The refusals that need no measuring run before any probe or ffmpeg work.
  try {
    recutCheckSpeech(inputs.speech, inputs.scenes);
  } catch (err) {
    if (err instanceof RecutRefusal) throw ctx.error('bad_input', err.message);
    throw err;
  }
  const info = await ctx.tools.probe(inputs.video.path);
  if (!info.has_audio) throw ctx.error('bad_input', 'the take has no sound; speech-recut cuts picture and speech together');
  if (!info.width || !info.height) throw ctx.error('bad_input', 'the take has no picture');
  const duration = await kitDuration(ctx, inputs.video);
  const srcFps = Number.isFinite(info.fps) && info.fps > 0 ? info.fps : inputs.timeline.fps;
  const fps = inputs.fps ?? 30;
  const pictureCuts = await recutPictureCuts(ctx, inputs.video);
  const mono = (await recutChannels(ctx, inputs.video)) === 1;
  const grade = inputs.grade ?? 'none';
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
  ctx.log.info('speech-recut plan', { picture_cuts: pictureCuts.length, removals: plan.removals.length, covers: plan.covers.length, from_s: +duration.toFixed(3), to_s: plan.seconds });
  const dropped = (inputs.speech || []).filter((e) => recutIsExtra(e) && (e.words || []).length && (inputs.drop ?? 'repeats') === 'repeats');
  if (dropped.length) ctx.log.info('speech-recut dropped heard speech that is in no line', { spoken: dropped.map((e) => e.spoken ?? '').filter(Boolean) });

  // Room tone: measured on the ORIGINAL take, before the cut, so a window the cut drops still serves.
  let room = null;
  if (inputs.room_tone) {
    const win = await recutFindRoomTone(ctx, inputs.video, inputs.speech, duration, plan.heard);
    if (!win) ctx.log.warn('speech-recut found no speech-free window of 0.4 s or more with room tone in it; the edit has no room-tone bed');
    else {
      const gain = inputs.room_tone.gain_db ?? RECUT_ROOM_GAIN_DB;
      room = { ...win, gain_db: gain, path: await recutRoomLoop(ctx, inputs.video, win, mono) };
      ctx.log.info('speech-recut room tone', { start_s: win.start_s, end_s: win.end_s, level_db: win.level_db, gain_db: gain });
    }
  }

  // One input per kept stretch, seeked a second early and trimmed exactly, so no stretch of the take is
  // buffered in memory while another is read. Each stretch's sound fades in and out over 6 ms: no clicks.
  const w = info.width - (info.width % 2);
  const h = info.height - (info.height % 2);
  const args = [];
  const graph = [];
  const half = 0.25 / srcFps;
  const firstFrame = [];
  let joined = 0;
  for (const [k, seg] of plan.keep.entries()) {
    const seek = Math.max(0, seg.start - 1);
    const off = seg.start - seek;
    const len = seg.end - seg.start;
    const frames = Math.max(1, Math.round(len * srcFps));
    firstFrame.push(joined);
    joined += frames;
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
  // The output is a whole number of output frames: picture and sound are both cut to it, and the
  // timeline and `seconds` carry the same length, so a downstream layer sees the file's true length.
  // Rounded UP from the exact kept length (not the plan's 3-decimal `seconds`), so the last kept frame of
  // sound is never trimmed; the pad is under one frame (the last picture held, silence under it).
  const kept = plan.keep.reduce((sum, k) => sum + (k.end - k.start), 0);
  const outFrames = Math.max(1, Math.ceil(kept * fps - 1e-6));
  const seconds = outFrames / fps;
  // A covered short shot: its frames on the joined picture, by the stretch it sits in.
  const covers = plan.covers
    .map((c) => {
      const k = plan.keep.findIndex((seg) => c.start >= seg.start - 1e-6 && c.end <= seg.end + 1e-6);
      if (k < 0) return null;
      const a = firstFrame[k] + Math.round((c.start - plan.keep[k].start) * srcFps);
      const b = Math.min(joined, firstFrame[k] + Math.round((c.end - plan.keep[k].start) * srcFps));
      return b > a ? { a, b, from: c.from } : null;
    })
    .filter(Boolean);
  graph.push(`${plan.keep.map((_, k) => `[v${k}][a${k}]`).join('')}concat=n=${n}:v=1:a=1[${covers.length ? 'joined' : 'cv'}][${room ? 'cut' : 'speech'}]`);
  if (covers.length) graph.push(...recutCoverGraph('joined', covers, joined, 'cv'));
  if (room) {
    // The bed under the whole edit, at gain_db against its window; the speech is untouched.
    // The loop is the aloop filter on one read of the file, not -stream_loop on the input: with
    // -stream_loop (any count) the kit's ffmpeg 6.1 writes the whole edit and then never exits, so the
    // step timed out on every take with a room-tone window. ffmpeg 7 and later finish either way. The
    // bed file is the window forward then reversed at 48 kHz (recutRoomLoop), twice the window long.
    const loopSamples = Math.ceil(2 * (room.end_s - room.start_s) * 48000);
    args.push('-i', room.path);
    graph.push(`[${n}:a]aloop=loop=-1:size=${loopSamples},volume=${kitNum(room.gain_db, 3)}dB,atrim=0:${kitNum(seconds)},asetpts=PTS-STARTPTS[bed]`);
    graph.push('[cut][bed]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[speech]');
  }
  graph.push(`[speech]apad,atrim=0:${kitNum(seconds)},asetpts=PTS-STARTPTS[aout]`);
  const gradeChain = recutGradeChain(grade);
  graph.push(
    `[cv]fps=${fps},tpad=stop_mode=clone:stop_duration=${kitNum(2 / fps, 4)},trim=end_frame=${outFrames},setpts=PTS-STARTPTS,` +
      `scale=${w}:${h}${gradeChain ? `,${gradeChain}` : ''},setsar=1,format=yuv420p[vout]`,
  );
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
    ...RECUT_RATE_CAP,
    '-r',
    String(fps),
    join(ctx.workDir, 'recut.mp4'),
  ]);
  const video = recutCheckSize(ctx, await ctx.file('recut.mp4', 'video'));
  const got = await ctx.tools.probe(video.path);
  if (!Number.isFinite(got.duration_s) || Math.abs(got.duration_s - seconds) > 1 / fps + 0.05) {
    throw ctx.error('output_invalid', `the re-cut is ${got.duration_s}s, expected ${kitNum(seconds, 3)}s`);
  }
  ctx.progress({ done: 3, total: 3 });

  // Scenes that ran to the plan's end run to the file's end (it differs by under one output frame).
  const outSeconds = +seconds.toFixed(3);
  const scenes = plan.scenes
    .map((sc) => ({ ...sc, end_s: sc.end_s >= plan.seconds - 1e-3 ? outSeconds : Math.min(sc.end_s, outSeconds) }))
    .filter((sc) => sc.end_s - sc.start_s > 1e-3);
  const cap = (t) => Math.min(t, outSeconds);
  const speech = plan.speech.map((e) => ({
    ...e,
    start_s: cap(e.start_s),
    end_s: cap(e.end_s),
    ...(e.words ? { words: e.words.map((wd) => ({ ...wd, start_s: cap(wd.start_s), end_s: cap(wd.end_s) })) } : {}),
  }));
  const timeline = { duration_s: outSeconds, width: w, height: h, fps, scenes, speech };
  if (inputs.timeline.safe_zones) timeline.safe_zones = inputs.timeline.safe_zones;
  return kitCheckOutputs(ctx, manifest, { video, seconds: outSeconds, timeline, cuts: plan.cuts });
}
