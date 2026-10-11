// After the song is sung: match its word timings to the lyric, then time every
// scene's picture to the singing.
//
// - A scene with a line starts on its first sung word.
// - Silent scenes share the time between their neighbours evenly, and move onto
//   a sung word that starts within `snap_s` of their place.
// - The first scene of a new group (scene.extra.group) shows `shot_lead_s`
//   before the group's first sung word, but not while the line before it is
//   still being sung.
// - Every picture holds at least `min_hold_s` where the words allow it.
// - `first_word_s: [a, b]` trims or pads the head of the track so the first
//   sung word lands at `a` seconds when singing starts on the second scene or
//   earlier, and at `b` when silent pictures come first.
// - `card_after_s`: the end card comes in that long after the last word.
//
// Times are in seconds of the finished film (after the trim or pad). Pure: no
// I/O. Every top-level name starts with `song`.
import { songFail, songNorm } from './lyric.mjs';

export const SONG_HOOK_TOLERANCE_S = 0.35;
// A picture never holds for less than one frame at 30 fps, even with no min_hold_s.
const songFrameS = 0.034;
// Pace warnings (the stop-motion recipe's): too short to read, a freeze, too slow overall.
const songShortHoldS = 0.2;
const songLongHoldS = 2.5;
const songMinPace = 1.1;

function songRound(s) {
  return Math.round(s * 1000) / 1000;
}

/**
 * The reply's word timings (`words_timestamps: [{word, start_ms, end_ms}]`)
 * matched to the lyric's words, one for one and in order.
 *
 * Throws provider_failed when the reply has no timings or a different number
 * of words than the lyric. Returns {sent: [{start_s, end_s}], written:
 * [{text, scene_index, start_s, end_s}], mismatches: [{index, sung, lyric}]}
 * in the track's own time. A written word spans every sent word that stands for
 * it, so a brand name sung as three words is captioned once, as written.
 */
export function songAlignWords(wordPlan, words) {
  if (!Array.isArray(words) || !words.length) throw songFail('provider_failed', 'the song came back with no word timings');
  if (words.length !== wordPlan.sent.length) {
    throw songFail('provider_failed', `the song has ${words.length} sung words and the lyric has ${wordPlan.sent.length}; it was not sung as written`);
  }
  const sent = [];
  const mismatches = [];
  let floor = 0;
  words.forEach((w, i) => {
    const start = Number(w && w.start_ms);
    const end = Number(w && w.end_ms);
    if (!Number.isFinite(start) || !Number.isFinite(end)) throw songFail('provider_failed', `sung word ${i + 1} has no start or end time`);
    const s = Math.max(start, floor) / 1000;
    const e = Math.max(end / 1000, s);
    sent.push({ start_s: songRound(s), end_s: songRound(e) });
    floor = Math.max(start, floor);
    if (songNorm(w.word) !== songNorm(wordPlan.sent[i].text)) mismatches.push({ index: i, sung: String(w.word), lyric: wordPlan.sent[i].text });
  });
  let prevEnd = 0;
  const written = wordPlan.written.map((w) => {
    if (!w.sent.length) return { text: w.text, scene_index: w.scene_index, start_s: prevEnd, end_s: prevEnd };
    const start = Math.min(...w.sent.map((k) => sent[k].start_s));
    const end = Math.max(...w.sent.map((k) => sent[k].end_s));
    prevEnd = end;
    return { text: w.text, scene_index: w.scene_index, start_s: start, end_s: end };
  });
  return { sent, written, mismatches };
}

function songGroupOf(scene) {
  const g = scene && scene.extra && scene.extra.group != null ? scene.extra.group : null;
  return g == null || g === '' ? null : String(g);
}

/** Forward then backward pass: every movable time at least `hold` from its neighbours, inside (ta, tb). */
function songClamp(times, ta, tb, hold) {
  const m = times.length;
  if (!m) return { times, fits: true };
  if (tb - ta < (m + 1) * hold) {
    return { times: times.map((_, k) => ta + ((k + 1) * (tb - ta)) / (m + 1)), fits: false };
  }
  const out = times.slice();
  for (let k = 0; k < m; k++) out[k] = Math.max(out[k], (k ? out[k - 1] : ta) + hold);
  for (let k = m - 1; k >= 0; k--) out[k] = Math.min(out[k], (k < m - 1 ? out[k + 1] : tb) - hold);
  return { times: out, fits: true };
}

/**
 * Picture windows, captions and the end card's place, from the song.
 *
 * `args`: {scenes, plan (songCompositionPlan's result), aligned (songAlignWords'
 * result), duration_s (the track's length before any trim), windows?:
 * {first_word_s: [a, b], shot_lead_s, snap_s, min_hold_s, card_after_s}}.
 *
 * Returns {trim_s, pad_s, seconds, scenes: [{id, start_s, end_s}] (every scene,
 * back to back from 0), speech (the Timeline speech shape: sung scenes outside
 * the ending), words (every written word), ending_seconds, card_at_s, hook_s,
 * hook: {target_s, off_s, ok} | null, warnings}.
 */
export function songTimeline(args) {
  const { scenes, plan, aligned } = args;
  const windows = args.windows || {};
  const n = scenes.length;
  const warnings = [];
  const sungAt = new Map(plan.words.sung.map((s) => [s.index, s]));

  // ---- the head of the track ----
  let shift = 0;
  if (windows.first_word_s != null) {
    const fw = Array.isArray(windows.first_word_s) ? windows.first_word_s : [windows.first_word_s, windows.first_word_s];
    const firstSung = plan.words.sung[0].index;
    const lead = firstSung <= 1 ? fw[0] : fw[fw.length - 1];
    shift = songRound(lead - aligned.sent[0].start_s);
  }
  const t = (s) => songRound(s + shift);
  const seconds = songRound(args.duration_s + shift);
  const sent = aligned.sent.map((w) => ({ start_s: t(w.start_s), end_s: t(w.end_s) }));
  const written = aligned.written.map((w) => ({ ...w, start_s: t(w.start_s), end_s: t(w.end_s) }));
  if (sent.at(-1).end_s > seconds + 0.05) warnings.push(`the last word ends at ${sent.at(-1).end_s} s, after the track's end at ${seconds} s`);

  // ---- the ending and the right edge ----
  const k = plan.ending_scenes || 0;
  const endIdx = n - k; // first ending scene, or n when there is none
  const bodySung = plan.words.sung.filter((s) => s.index < endIdx);
  const lastBodyEnd = bodySung.length ? sent[bodySung.at(-1).sent[1]].end_s : null;
  const cardAfter = windows.card_after_s;
  let rightEdge = seconds;
  let cardAt = null;
  if (k === 0 && cardAfter != null && lastBodyEnd != null) {
    cardAt = songRound(Math.min(seconds, lastBodyEnd + cardAfter));
    rightEdge = cardAt;
  }

  // ---- fixed starts and soft targets ----
  const fixed = new Array(n).fill(null); // a sung scene's first word (scene 0 at 0)
  const soft = new Array(n).fill(null); // a lead plate or a silent ending card: a wanted time that may move
  fixed[0] = 0;
  for (let i = 1; i < n; i++) {
    const s = sungAt.get(i);
    if (s) fixed[i] = sent[s.sent[0]].start_s;
  }
  if (windows.shot_lead_s != null) {
    for (let i = 1; i < n; i++) {
      if (fixed[i] != null) continue;
      const g = songGroupOf(scenes[i]);
      if (g == null || g === songGroupOf(scenes[i - 1])) continue;
      let j = i + 1;
      while (j < n && songGroupOf(scenes[j]) === g && fixed[j] == null) j++;
      if (j >= n || songGroupOf(scenes[j]) !== g) continue; // the group sings nothing: an ordinary silent scene
      const T = fixed[j];
      const before = sent.filter((w) => w.start_s < T - 1e-6);
      const prevWordEnd = before.length ? before.at(-1).end_s : 0;
      soft[i] = Math.max(T - windows.shot_lead_s, prevWordEnd);
    }
  }
  if (k > 0 && fixed[endIdx] == null && cardAfter != null && lastBodyEnd != null) soft[endIdx] = lastBodyEnd + cardAfter;

  // ---- place the movable scenes between each pair of fixed starts ----
  const hold = Math.max(windows.min_hold_s || 0, songFrameS);
  const starts = fixed.slice();
  const anchors = [];
  for (let i = 0; i < n; i++) if (fixed[i] != null) anchors.push(i);
  anchors.push(n);
  const wordStarts = sent.map((w) => w.start_s);
  for (let a = 0; a < anchors.length - 1; a++) {
    const ia = anchors[a];
    let ib = anchors[a + 1];
    const ta = starts[ia];
    let tb = ib === n ? rightEdge : fixed[ib];
    if (tb <= ta) {
      // Two sung scenes start on the same instant (or a word lands at 0): keep the order, one frame apart.
      tb = ta + songFrameS;
      if (ib < n) {
        warnings.push(`scene ${ib + 1} starts on the same word time as scene ${ia + 1}; moved one frame later`);
        fixed[ib] = tb;
        starts[ib] = tb;
      }
    }
    const movable = [];
    for (let i = ia + 1; i < ib; i++) movable.push(i);
    if (!movable.length) continue;
    // Targets: soft scenes at their wanted time; runs of free scenes spread evenly between their neighbours.
    const target = new Map();
    let left = ta;
    let run = [];
    const flush = (right) => {
      run.forEach((i, m) => target.set(i, left + ((m + 1) * (right - left)) / (run.length + 1)));
      run = [];
    };
    for (const i of movable) {
      if (soft[i] != null) {
        const want = Math.min(Math.max(soft[i], ta), tb);
        flush(want);
        target.set(i, want);
        left = want;
      } else run.push(i);
    }
    flush(tb);
    // Snap free scenes onto a word start near their target, left to right.
    if (windows.snap_s != null) {
      let prev = ta;
      for (const [m, i] of movable.entries()) {
        let want = target.get(i);
        if (soft[i] == null) {
          // Never past the next plate or card that has a wanted time of its own.
          const nextSoft = movable.slice(m + 1).find((j) => soft[j] != null);
          const limit = nextSoft == null ? tb : target.get(nextSoft);
          let best = null;
          for (const w of wordStarts) {
            if (w <= prev + hold - 1e-9 || w > limit - hold + 1e-9) continue;
            if (Math.abs(w - want) > windows.snap_s + 1e-9) continue;
            if (best == null || Math.abs(w - want) < Math.abs(best - want)) best = w;
          }
          if (best != null) want = best;
          target.set(i, want);
        }
        prev = Math.max(prev, want);
      }
    }
    const clamped = songClamp(movable.map((i) => target.get(i)), ta, tb, hold);
    if (!clamped.fits) warnings.push(`scenes ${movable[0] + 1} to ${movable.at(-1) + 1} have less than ${hold} s each between two sung words`);
    movable.forEach((i, m) => {
      starts[i] = songRound(clamped.times[m]);
    });
  }

  // ---- spans, back to back ----
  const spans = scenes.map((scene, i) => ({
    id: scene.id,
    start_s: songRound(starts[i]),
    end_s: songRound(i < n - 1 ? starts[i + 1] : k > 0 ? seconds : rightEdge),
  }));
  if (k > 0) cardAt = spans[endIdx].start_s;
  const endingSeconds = cardAt == null ? 0 : songRound(Math.max(0, seconds - cardAt));

  // ---- captions: every sung scene outside the ending ----
  const speech = bodySung.map((s) => {
    const ws = written.slice(s.written[0], s.written[1] + 1).map((w) => ({ text: w.text, start_s: w.start_s, end_s: w.end_s }));
    const entry = { scene_id: s.id, text: s.text, start_s: ws[0].start_s, end_s: ws.at(-1).end_s, words: ws };
    if (s.spoken !== s.text) entry.spoken = s.spoken;
    return entry;
  });

  // ---- the hook gate ----
  let hookS = null;
  let hook = null;
  if (plan.hook) {
    const s = sungAt.get(plan.hook.scene_index);
    hookS = sent[s.sent[0]].start_s;
    const targetS = t(plan.hook.target_ms / 1000);
    const off = songRound(hookS - targetS);
    hook = { target_s: targetS, off_s: off, ok: Math.abs(off) <= SONG_HOOK_TOLERANCE_S + 1e-9 };
  }

  // ---- pace warnings (only when the style times pictures to words) ----
  if (args.windows) {
    const body = spans.slice(0, endIdx);
    for (const [i, sp] of body.entries()) {
      const held = songRound(sp.end_s - sp.start_s);
      if (held < songShortHoldS) warnings.push(`scene ${i + 1} holds ${held} s: too short to read`);
      if (held > songLongHoldS) warnings.push(`scene ${i + 1} holds ${held} s: it reads as a freeze`);
    }
    const bodyEnd = body.length ? body.at(-1).end_s : 0;
    const pace = bodyEnd > 0 ? body.length / bodyEnd : 0;
    if (body.length > 1 && pace < songMinPace) warnings.push(`${pace.toFixed(2)} picture changes a second; under ${songMinPace}`);
  }

  return {
    trim_s: shift < 0 ? songRound(-shift) : 0,
    pad_s: shift > 0 ? shift : 0,
    seconds,
    scenes: spans,
    speech,
    words: written.map((w) => ({ text: w.text, start_s: w.start_s, end_s: w.end_s })),
    ending_seconds: endingSeconds,
    card_at_s: cardAt,
    hook_s: hookS,
    hook,
    warnings,
  };
}
