// The check layer's 1.3.0 style flags, measured on the finished cut and its
// timeline: text_led (blank frames, not dark ones, review-finished-ad's
// silent-text profile), read_rate, cuts_between_words, cut_rate and the
// window retained_body limits the content checks to. Pure maths apart from
// chkBlankFrames, which decodes small RGB frames into tmpDir. Every top-level
// name starts with `chk` (bundled modules share one namespace).
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { kitFfmpeg, kitNum } from '../../_lib/part.mjs';

// review-finished-ad's silent-text bounds: one blank beat between two text beats, a blank opening or
// ending keeps the black-frame bound, and all blank time together stays under a quarter of the picture.
export const CHK_BLANK_INTERIOR_MAX_S = 1.0;
export const CHK_BLANK_EDGE_MAX_S = 0.3;
export const CHK_BLANK_MAX_SHARE = 0.25;
export const CHK_BLANK_FPS = 10;
// Frames are area-averaged to this width, so light grain does not read as text.
const CHK_BLANK_WIDTH = 270;
// A pixel this far (max RGB channel) from the dominant colour is content; a frame with text has content
// on at least 1.5 % of its rows (a thin progress bar or codec noise does not).
const CHK_BLANK_PIXEL_DELTA = 48;
const CHK_BLANK_MIN_CONTENT_ROWS = 0.015;
// Decoded in windows so a long cut never writes one large raw file.
const CHK_BLANK_CHUNK_S = 10;

export const CHK_READ_MIN_WPS = 2.1;
export const CHK_READ_MAX_WPS = 3.1;
export const CHK_CUT_MIN_RATE = 0.5;
export const CHK_CUT_MAX_RATE = 0.7;
// A cut this close to a word's edge is on the edge, not inside the word (word timings are not frame exact).
export const CHK_WORD_EDGE_S = 0.01;
// Scene starts this close to 0 or to the end of the body are not cuts.
const CHK_CUT_EDGE_S = 0.05;

// sounds_match_messages (1.4.2): a message's sound is its loudest 50 ms from just before the message shows
// to 0.3 s after, set against the bed, the median 50 ms of the quiet before it. A short pop over a 0.25 s
// mean, or a mean before it that holds typing clicks, read under 4 dB once a limiter levelled the cut.
export const CHK_MSG_SLICE_S = 0.05;
export const CHK_MSG_HOP_S = 0.01;
export const CHK_MSG_CUE = [-0.05, 0.3];
export const CHK_MSG_BED = [-0.6, -0.05];
// The opening, or a message straight after others, has too little quiet before it: the quiet after its cue.
export const CHK_MSG_BED_AFTER = [0.3, 0.85];
// 0.15 s of quiet: with fewer slices than this a stretch is no bed.
export const CHK_MSG_BED_MIN = 11;
export const CHK_MSG_RISE_DB = 8;

function chkSlices(from, to) {
  const out = [];
  const start = Math.max(0, from);
  for (let i = 0; start + i * CHK_MSG_HOP_S + CHK_MSG_SLICE_S <= to + 1e-9; i++) {
    const a = start + i * CHK_MSG_HOP_S;
    out.push([a, a + CHK_MSG_SLICE_S]);
  }
  return out;
}

/** The parts of [from, to] outside every span in `cuts`. */
function chkOutside(from, to, cuts) {
  let spans = from < to ? [[from, to]] : [];
  for (const [a, b] of cuts) spans = spans.flatMap(([s, e]) => (b <= s || a >= e ? [[s, e]] : [[s, Math.min(e, a)], [Math.max(s, b), e]].filter(([x, y]) => y > x)));
  return spans;
}

/**
 * The slices each message is judged on: `starts` are the message arrivals in order (distinct), `end` where
 * the judged content stops (the end card, or the kept body). A cue runs from just before its message to 0.3 s
 * after, but never into the next one's (two messages closer than 0.1 s split the time between them) and never
 * past `end`; one shorter than 50 ms is one slice. The bed is the quiet before the message, outside every
 * message's cue span (0.05 s before it to 0.3 s after), so an earlier sound never raises it; with too little
 * of that, the quiet after the cue; with too little of either, all the quiet before `end`.
 */
export function chkMessageWindows(starts, end) {
  const cues = starts.map((t) => [t + CHK_MSG_CUE[0], t + CHK_MSG_CUE[1]]);
  const quiet = (from, to) => chkOutside(Math.max(0, from), Math.min(to, end), cues).flatMap(([a, b]) => chkSlices(a, b));
  const split = (i) => Math.max(starts[i + 1] + CHK_MSG_CUE[0], (starts[i] + starts[i + 1]) / 2);
  let whole = null;
  return starts.map((t, i) => {
    const from = Math.max(0, t + CHK_MSG_CUE[0], i > 0 ? split(i - 1) : 0);
    const to = Math.min(t + CHK_MSG_CUE[1], i + 1 < starts.length ? split(i) : Infinity, end);
    const cue = to - from >= CHK_MSG_SLICE_S - 1e-9 ? chkSlices(from, to) : to > from ? [[from, to]] : [];
    const before = quiet(t + CHK_MSG_BED[0], t + CHK_MSG_BED[1]);
    const after = before.length >= CHK_MSG_BED_MIN ? null : quiet(t + CHK_MSG_BED_AFTER[0], t + CHK_MSG_BED_AFTER[1]);
    const bed = !after ? before : after.length >= CHK_MSG_BED_MIN ? after : (whole ??= quiet(0, end));
    return { cue, bed };
  });
}

/** The cue's loudest slice, the bed's median slice (dBFS) and how far the cue rises over the bed. */
export function chkMessageRise(cueLevels, bedLevels) {
  const cue = cueLevels.length ? Math.max(...cueLevels) : -Infinity;
  const sorted = [...bedLevels].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  const bed = !sorted.length ? -Infinity : sorted.length % 2 ? sorted[mid] : sorted[mid - 1] === sorted[mid] ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { cue, bed, rise: bed === -Infinity ? (cue === -Infinity ? -Infinity : Infinity) : cue - bed };
}

/** Share of a frame's rows that hold content: pixels clearly off the frame's dominant colour. */
export function chkContentShare(rgb, w, h) {
  const counts = new Uint32Array(4096);
  const px = w * h;
  for (let i = 0; i < px; i++) counts[((rgb[3 * i] >> 4) << 8) | ((rgb[3 * i + 1] >> 4) << 4) | (rgb[3 * i + 2] >> 4)]++;
  let dominant = 0;
  for (let k = 1; k < 4096; k++) if (counts[k] > counts[dominant]) dominant = k;
  const bg = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < px; i++) {
    const key = ((rgb[3 * i] >> 4) << 8) | ((rgb[3 * i + 1] >> 4) << 4) | (rgb[3 * i + 2] >> 4);
    if (key !== dominant) continue;
    bg[0] += rgb[3 * i];
    bg[1] += rgb[3 * i + 1];
    bg[2] += rgb[3 * i + 2];
    n++;
  }
  for (let c = 0; c < 3; c++) bg[c] /= Math.max(1, n);
  let rows = 0;
  for (let y = 0; y < h; y++) {
    let off = 0;
    for (let x = 0; x < w && off < 2; x++) {
      const i = y * w + x;
      const d = Math.max(Math.abs(rgb[3 * i] - bg[0]), Math.abs(rgb[3 * i + 1] - bg[1]), Math.abs(rgb[3 * i + 2] - bg[2]));
      if (d > CHK_BLANK_PIXEL_DELTA) off++;
    }
    if (off >= 2) rows++;
  }
  return rows / h;
}

/** Whether each frame from 0 to `untilS`, sampled at CHK_BLANK_FPS, is blank (black or one flat colour, no text). */
export async function chkBlankFrames(ctx, video, width, height, untilS) {
  const w = CHK_BLANK_WIDTH;
  const h = Math.max(2, Math.round((w * height) / width / 2) * 2);
  const size = w * h * 3;
  const blank = [];
  for (let k = 0; k * CHK_BLANK_CHUNK_S < untilS - 1e-6; k++) {
    const from = k * CHK_BLANK_CHUNK_S;
    const want = Math.round(Math.min(CHK_BLANK_CHUNK_S, untilS - from) * CHK_BLANK_FPS);
    if (want < 1) break;
    const path = join(ctx.tmpDir, `blank-${k}.raw`);
    await kitFfmpeg(ctx, ['-ss', kitNum(from), '-i', video, '-an', '-vf', `fps=${CHK_BLANK_FPS},scale=${w}:${h}:flags=area,format=rgb24`, '-frames:v', String(want), '-pix_fmt', 'rgb24', '-f', 'rawvideo', path]);
    const raw = await readFile(path);
    await rm(path, { force: true });
    for (let i = 0; i + size <= raw.length; i += size) blank.push(chkContentShare(raw.subarray(i, i + size), w, h) < CHK_BLANK_MIN_CONTENT_ROWS);
  }
  return blank;
}

/** Blank stretches [start, end] in seconds from per-frame blank flags. */
export function chkBlankSpans(blank, fps = CHK_BLANK_FPS) {
  const out = [];
  let start = null;
  [...blank, false].forEach((b, i) => {
    if (b && start === null) start = i;
    else if (!b && start !== null) {
      out.push([start / fps, i / fps]);
      start = null;
    }
  });
  return out;
}

/**
 * The text-led judgement of blank stretches: `span` is the first one over its bound (a blank opening or
 * ending 0.3 s, one between text beats 1.0 s), `share` the blank share of the sampled picture, `whole`
 * whether every frame is blank.
 */
export function chkJudgeBlank(spans, samples, fps = CHK_BLANK_FPS) {
  const end = samples / fps;
  let span = null;
  for (const [s, e] of spans) {
    const edge = s <= 1e-6 ? 'opening' : e >= end - 1e-6 ? 'ending' : null;
    const limit = edge ? CHK_BLANK_EDGE_MAX_S : CHK_BLANK_INTERIOR_MAX_S;
    if (e - s > limit + 1e-6) {
      span = { start_s: s, end_s: e, limit, where: edge ? `at the ${edge}` : 'between text beats' };
      break;
    }
  }
  const total = spans.reduce((a, [s, e]) => a + (e - s), 0);
  return { span, total_s: total, picture_s: end, share: end > 0 ? total / end : 0, whole: samples > 0 && Math.round(total * fps) >= samples };
}

/** Spans clipped to [0, until]; spans that start at or after `until` are dropped. */
export function chkClipSpans(spans, until) {
  return spans.filter(([s]) => s < until).map(([s, e]) => [s, Math.min(e, until)]);
}

function chkCountWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/**
 * Spoken words per second over the timeline's speech entries that start before `until`: each entry's
 * word timings when it has them, else the words of what was said (`spoken`, else `text`), over the time
 * the entries cover (overlapping entries counted once). Null when there is no speech to measure.
 */
export function chkReadRate(speech, until = Infinity) {
  let words = 0;
  const spans = [];
  for (const s of speech || []) {
    if (!(s.start_s < until) || !(s.end_s > s.start_s)) continue;
    const n = (s.words || []).length || chkCountWords(typeof s.spoken === 'string' ? s.spoken : s.text);
    if (!n) continue;
    words += n;
    spans.push([s.start_s, Math.min(s.end_s, until)]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  let seconds = 0;
  let cur = null;
  for (const [a, b] of spans) {
    if (cur && a <= cur[1]) cur[1] = Math.max(cur[1], b);
    else {
      if (cur) seconds += cur[1] - cur[0];
      cur = [a, b];
    }
  }
  if (cur) seconds += cur[1] - cur[0];
  if (!words || !(seconds > 0)) return null;
  return { words, seconds, wps: words / seconds };
}

/**
 * The speech said before `until`: entries that end by then as they are; an entry running past it cut to
 * its timed words before `until` (what was said rebuilt from them). An entry running past it with no word
 * timings cannot be split: it is left out and `crossing` is set.
 */
export function chkSpeechBefore(speech, until) {
  const out = [];
  let crossing = false;
  for (const s of speech || []) {
    if (!(s.start_s < until)) continue;
    if (!(s.end_s > until)) out.push(s);
    else if ((s.words || []).length) {
      const words = s.words.filter((w) => w.start_s < until);
      if (!words.length) continue;
      const said = words.map((w) => w.text).join(' ');
      out.push({ ...s, text: said, spoken: said, end_s: until, words });
    } else crossing = true;
  }
  return { speech: out, crossing };
}

/** The scene cuts inside the body: every scene start after 0 and before `bodyEnd`, once each. */
export function chkCuts(scenes, bodyEnd) {
  const out = [];
  for (const sc of scenes || []) {
    const t = sc.start_s;
    if (t > CHK_CUT_EDGE_S && t < bodyEnd - CHK_CUT_EDGE_S && !out.some((u) => Math.abs(u - t) < 1e-3)) out.push(t);
  }
  return out.sort((a, b) => a - b);
}

/** The first cut that falls strictly inside a word ({t, word}), or null. */
export function chkCutInsideWord(cuts, words) {
  for (const t of cuts) {
    const word = (words || []).find((w) => w.start_s + CHK_WORD_EDGE_S < t && t < w.end_s - CHK_WORD_EDGE_S);
    if (word) return { t, word };
  }
  return null;
}
