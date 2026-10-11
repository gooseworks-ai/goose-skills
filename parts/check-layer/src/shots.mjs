// The check layer's 1.4.0 style flags, measured per shot of the finished cut:
// captions_cross_cuts, min_shot, ambience_floor, cut_contrast and
// distinct_adjacent_shots. A shot is the stretch between two cuts, and a cut
// is a scene start in the timeline (the end card is not a shot). Pure maths
// apart from chkGrayAt, which decodes one small grayscale frame into tmpDir.
// Every top-level name starts with `chk` (bundled modules share one namespace).
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { chkCuts } from './flags.mjs';

// captions_cross_cuts: a cue may run this far past a cut on either side (cue timings are not frame exact).
export const CHK_CUE_GUARD_S = 0.15;
// min_shot: no shot shorter than this.
export const CHK_MIN_SHOT_S = 0.4;
// ambience_floor: the room tone under each shot stays in this band (dB full scale, RMS), and speech stays
// at least this far above it.
export const CHK_FLOOR_MIN_DB = -52;
export const CHK_FLOOR_MAX_DB = -32;
export const CHK_FLOOR_SPEECH_GAP_DB = 6;
// The floor is the 10th percentile of 50 ms windows, away from each shot's edges (a join may click or dip).
export const CHK_FLOOR_WINDOW_S = 0.05;
const CHK_FLOOR_PERCENTILE = 0.1;
const CHK_FLOOR_EDGE_S = 0.05;
// At least this many speech-free windows (0.2 s) before the floor is read from the speech-free ones only.
const CHK_FLOOR_MIN_QUIET_WINDOWS = 4;
// cut_contrast: mean absolute grayscale difference (0 to 255) between the frames this far either side of a cut.
export const CHK_CONTRAST_OFFSET_S = 0.08;
export const CHK_CONTRAST_MIN = 25;
export const CHK_CONTRAST_WARN = 32;
// distinct_adjacent_shots: the opening frames of two scenes in a row differ by at least this (the same
// clip shown twice differs by encoder noise only, around 1 on this scale).
export const CHK_DISTINCT_MIN = 6;
// A scene's opening frame is read this far in, so a frame-rounded cut never shows the scene before.
export const CHK_FIRST_FRAME_S = 0.05;
const CHK_CONTRAST_WIDTH = 160;
const CHK_DISTINCT_WIDTH = 64;
// A scene that starts this close to the end of the body opens no shot (as in flags.mjs chkCuts).
const CHK_SHOT_EDGE_S = 0.05;

/** The shots of the body: [start, end] between consecutive cuts, from 0 to `bodyEnd`. */
export function chkShots(scenes, bodyEnd) {
  if (!(bodyEnd > 0)) return [];
  const edges = [0, ...chkCuts(scenes, bodyEnd), bodyEnd];
  const out = [];
  for (let i = 1; i < edges.length; i++) out.push([edges[i - 1], edges[i]]);
  return out;
}

/** The first shot shorter than `min` ({start_s, end_s, seconds}), or null. */
export function chkShortShot(shots, min = CHK_MIN_SHOT_S) {
  const s = shots.find(([a, b]) => b - a < min - 1e-6);
  return s ? { start_s: s[0], end_s: s[1], seconds: s[1] - s[0] } : null;
}

/** The first caption cue that runs more than the guard past a cut on both sides ({cue, t}), or null. */
export function chkCueAcrossCut(cues, cuts, guard = CHK_CUE_GUARD_S) {
  for (const cue of cues || []) {
    const t = cuts.find((u) => cue.start_s < u - guard - 1e-6 && cue.end_s > u + guard + 1e-6);
    if (t !== undefined) return { cue, t };
  }
  return null;
}

/** The `p` quantile (0 to 1) of a list of numbers, nearest rank; null for an empty list. */
export function chkPercentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))];
}

/** The power-average of levels in dB (silence, -Infinity, counts as no power). */
export function chkMeanDb(levels) {
  if (!levels.length) return null;
  const power = levels.reduce((a, l) => a + (Number.isFinite(l) ? 10 ** (l / 10) : 0), 0) / levels.length;
  return power > 0 ? 10 * Math.log10(power) : -Infinity;
}

/** The 50 ms windows inside a shot, away from its edges: [[from, to]]. A shot too short for one gets none. */
export function chkFloorWindows([start, end]) {
  const out = [];
  for (let t = start + CHK_FLOOR_EDGE_S; t + CHK_FLOOR_WINDOW_S <= end - CHK_FLOOR_EDGE_S + 1e-9; t += CHK_FLOOR_WINDOW_S) out.push([t, t + CHK_FLOOR_WINDOW_S]);
  return out;
}

/** The spans where words are said: each entry's word timings when it has them, else the entry's own span. */
export function chkSpeechSpans(speech) {
  const out = [];
  for (const s of speech || []) {
    const words = (s.words || []).filter((w) => w.end_s > w.start_s);
    if (words.length) for (const w of words) out.push([w.start_s, w.end_s]);
    else if (s.end_s > s.start_s) out.push([s.start_s, s.end_s]);
  }
  return out;
}

/**
 * One shot's sound: `floor` (dB, the 10th percentile of its windows, the speech-free ones when there are
 * enough of them) and `speech` (dB, the power-average of the windows whose middle is in a spoken span, or
 * null when nobody speaks in the shot). `windows` and `levels` line up; `spoken` are chkSpeechSpans.
 */
export function chkShotSound(windows, levels, spoken) {
  const isSpoken = ([a, b]) => spoken.some(([s, e]) => (a + b) / 2 >= s && (a + b) / 2 < e);
  const quiet = [];
  const voiced = [];
  windows.forEach((w, i) => (isSpoken(w) ? voiced : quiet).push(levels[i]));
  const floor = chkPercentile(quiet.length >= CHK_FLOOR_MIN_QUIET_WINDOWS ? quiet : levels, CHK_FLOOR_PERCENTILE);
  return { floor, speech: voiced.length ? chkMeanDb(voiced) : null };
}

/**
 * The first shot whose room tone is out of the band or too close to its speech, as {shot, floor, speech,
 * problem: 'silent' | 'low' | 'high' | 'speech'}; null when every measured shot is in. `sounds` are
 * chkShotSound results in shot order (a shot with no windows has floor null and is skipped).
 */
export function chkJudgeAmbience(shots, sounds) {
  for (let i = 0; i < shots.length; i++) {
    const { floor, speech } = sounds[i];
    if (floor === null) continue;
    const shot = shots[i];
    if (!Number.isFinite(floor)) return { shot, floor, speech, problem: 'silent' };
    if (floor < CHK_FLOOR_MIN_DB - 1e-9) return { shot, floor, speech, problem: 'low' };
    if (floor > CHK_FLOOR_MAX_DB + 1e-9) return { shot, floor, speech, problem: 'high' };
    if (speech !== null && speech - floor < CHK_FLOOR_SPEECH_GAP_DB - 1e-9) return { shot, floor, speech, problem: 'speech' };
  }
  return null;
}

/**
 * One frame at `t` as 8-bit gray, `w` wide (height to the picture's shape), or null when there is none.
 * The seek is exact: a coarse seek to a second before `t`, then a decoded one to `t`.
 */
export async function chkGrayAt(ctx, video, t, w, width, height) {
  const h = Math.max(2, Math.round((w * height) / width / 2) * 2);
  const coarse = Math.max(0, t - 1);
  const path = join(ctx.tmpDir, `gray-${w}-${Math.round(t * 1000)}.raw`);
  await kitFfmpeg(ctx, ['-ss', kitNum(coarse), '-i', video, '-ss', kitNum(t - coarse), '-an', '-frames:v', '1', '-vf', `scale=${w}:${h}:flags=area,format=gray`, '-pix_fmt', 'gray', '-f', 'rawvideo', path]);
  // No frame there (past the last one): ffmpeg may write nothing at all.
  const data = await readFile(path).catch(() => null);
  await rm(path, { force: true });
  return data && data.length >= w * h ? data.subarray(0, w * h) : null;
}

/** Mean absolute difference (0 to 255) between two gray frames of one size; null when either is missing. */
export function chkFrameDiff(a, b) {
  if (!a || !b || a.length !== b.length || !a.length) return null;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

/** The contrast across each cut: [{t, diff}], the frames CHK_CONTRAST_OFFSET_S either side. */
export async function chkCutContrast(ctx, video, cuts, width, height, duration) {
  const out = [];
  for (const t of cuts) {
    const before = await chkGrayAt(ctx, video, Math.max(0, t - CHK_CONTRAST_OFFSET_S), CHK_CONTRAST_WIDTH, width, height);
    const after = await chkGrayAt(ctx, video, Math.min(duration - 0.02, t + CHK_CONTRAST_OFFSET_S), CHK_CONTRAST_WIDTH, width, height);
    out.push({ t, diff: chkFrameDiff(before, after) });
  }
  return out;
}

/** The scenes inside the body, in order, with the time their opening frame is read at. */
export function chkSceneOpenings(scenes, bodyEnd) {
  return [...(scenes || [])]
    .filter((sc) => sc.end_s > sc.start_s && sc.start_s < bodyEnd - CHK_SHOT_EDGE_S)
    .sort((a, b) => a.start_s - b.start_s)
    .map((sc) => ({ id: sc.id, at: Math.min(sc.start_s + CHK_FIRST_FRAME_S, (sc.start_s + Math.min(sc.end_s, bodyEnd)) / 2) }));
}

/** The difference between the opening frames of each two scenes in a row: [{a, b, diff}]. */
export async function chkAdjacentDiffs(ctx, video, openings, width, height) {
  const frames = [];
  for (const o of openings) frames.push(await chkGrayAt(ctx, video, o.at, CHK_DISTINCT_WIDTH, width, height));
  const out = [];
  for (let i = 1; i < openings.length; i++) out.push({ a: openings[i - 1].id, b: openings[i].id, diff: chkFrameDiff(frames[i - 1], frames[i]) });
  return out;
}
