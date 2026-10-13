// The speech-recut planner: which stretches of one take to keep, as pure
// functions of the take's heard words, its picture cuts and its length. No
// ffmpeg here; src/part.mjs measures the take and renders the plan.
//
// The rules (render-street-interview's recut.py, CK 20 and CK 35):
//   - Dead air: a silence longer than max_gap_s is cut down to max_gap_s.
//     The removed stretch is placed so the join lands on one of the take's
//     own picture cuts when one falls inside the silence; otherwise it sits
//     in the middle. Nothing is cut closer than RECUT_EDGE_S to a word.
//   - Repeats and stutters: dropped INSIDE a line only, never a whole line
//     (critic #23: check-layer's speech_matches_script compares the whole
//     script). A repeat is a heard word, or run of words, that the written
//     line does not have and that repeats or starts a neighbouring word.
//     Other extra words ("invented" words) are speech and are never cut.
//   - Minimum shot: after the cuts, a shot shorter than min_shot_s that holds
//     no speech is dropped (the shorter fragment goes; never a cross-fade).
//     A short shot that holds speech (1.0.1) first takes back the dead air
//     cut next to it, up to its shortfall (a little more pause, never past a
//     picture cut inside that dead air); when that cannot reach min_shot_s
//     (the take's own shot is that short), its picture is covered by the shot
//     before it (else after it), held on one frame, and its sound is kept, so
//     no word is lost and no flash of picture is seen. Only an edit with no
//     shot long enough to cover from keeps a short shot, with a warning.
//   - Scenes with no line that the timeline places are silent beats (a
//     reaction, a payoff): their spans are kept whole.
//
// Every top-level name starts with `recut` (bundled modules share one
// namespace, parts/_tools/bundle.mjs).
import { kitHeardKey } from '../../_lib/heard.mjs';

/** Nothing is cut closer than this to a heard word (Whisper's word edges drift by tens of ms). */
export const RECUT_EDGE_S = 0.06;
/** A repeat is cut out up to this close to the words either side of it. */
export const RECUT_REPEAT_PAD_S = 0.04;
/** How far ahead a written word is looked for among the heard ones (the same window as _lib/heard.mjs). */
export const RECUT_LOOKAHEAD = 5;
/** The longest repeated run of words that counts as a repeat. */
export const RECUT_MAX_REPEAT_WORDS = 4;

/** A take the cut cannot fix: bad_input, because the take (not the cut) is wrong. */
export class RecutRefusal extends Error {}

const RECUT_EPS = 1e-6;

/** Whitespace tokens of `text` as {text, key}, key per _lib/heard.mjs (letters, digits, apostrophes). */
export function recutTokens(text) {
  return String(text == null ? '' : text)
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => ({ text: t, key: kitHeardKey(t) }));
}

/**
 * Written keys placed on spoken keys the way _lib/heard.mjs places a line on heard words: each written
 * word is looked for among the next RECUT_LOOKAHEAD spoken words. Returns the spoken index per written
 * word, or -1 when it was not found.
 */
export function recutAlign(written, spoken) {
  const match = [];
  let j = 0;
  for (const w of written) {
    let hit = -1;
    for (let x = j; x < Math.min(j + RECUT_LOOKAHEAD, spoken.length); x++) {
      if (spoken[x] === w) {
        hit = x;
        break;
      }
    }
    match.push(hit);
    if (hit >= 0) j = hit + 1;
  }
  return match;
}

function recutSame(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/**
 * Whether `extra` (spoken keys heard between written words i and i + 1, none of them in the line)
 * is a repeat or a stutter: the last n written words said again, the next n said early, or every
 * extra word a copy of a neighbour or the start of the next word ("wa" before "water").
 */
export function recutIsRepeat(extra, written, i) {
  const n = extra.length;
  if (!n) return false;
  if (n <= RECUT_MAX_REPEAT_WORDS) {
    if (i - n + 1 >= 0 && recutSame(extra, written.slice(i - n + 1, i + 1))) return true;
    if (i + n < written.length && recutSame(extra, written.slice(i + 1, i + 1 + n))) return true;
  }
  const prev = written[i];
  const next = written[i + 1];
  return extra.every((t) => t && (t === prev || t === next || (next != null && next.length > t.length && next.startsWith(t))));
}

/** Overlapping or touching intervals merged, sorted by start. Each keeps the `kind` of its longest part. */
export function recutMerge(list) {
  const sorted = list.filter((x) => x.end - x.start > RECUT_EPS).sort((a, b) => a.start - b.start || a.end - b.end);
  const out = [];
  for (const x of sorted) {
    const last = out.at(-1);
    if (last && x.start <= last.end + RECUT_EPS) {
      if (x.end - x.start > last.longest) {
        last.kind = x.kind;
        last.longest = x.end - x.start;
      }
      last.end = Math.max(last.end, x.end);
    } else out.push({ ...x, longest: x.end - x.start });
  }
  return out.map(({ longest, ...x }) => x);
}

/** [0, duration] less the removals: the kept stretches of the source, in order. */
export function recutKeep(removals, duration) {
  const keep = [];
  let at = 0;
  for (const r of recutMerge(removals)) {
    if (r.start > at + RECUT_EPS) keep.push({ start: at, end: Math.min(r.start, duration) });
    at = Math.max(at, r.end);
  }
  if (duration > at + RECUT_EPS) keep.push({ start: at, end: duration });
  return keep;
}

/** Source time -> output time. A time inside a removed stretch maps to its join. */
export function recutMapper(keep) {
  return (t) => {
    let out = 0;
    for (const k of keep) {
      if (t <= k.start) return out;
      if (t < k.end) return out + (t - k.start);
      out += k.end - k.start;
    }
    return out;
  };
}

/**
 * The shots of the output, in source time: each kept stretch split at the picture cuts inside it.
 * A join is always a shot boundary, even inside one source shot (a jump cut).
 */
export function recutFragments(keep, pictureCuts) {
  const out = [];
  for (const k of keep) {
    let at = k.start;
    for (const c of pictureCuts) {
      if (c > at + RECUT_EPS && c < k.end - RECUT_EPS) {
        out.push({ start: at, end: c });
        at = c;
      }
    }
    out.push({ start: at, end: k.end });
  }
  return out;
}

function recutShortCount(removals, duration, pictureCuts, minShot) {
  return recutFragments(recutKeep(removals, duration), pictureCuts).filter((f) => f.end - f.start < minShot - RECUT_EPS).length;
}

/**
 * One short shot `f` lengthened by `need` seconds, from the dead-air removals that end where it starts or start
 * where it ends: each gives back up to the stretch after (or before) its last (or first) picture cut inside it,
 * one side alone when it can, edges on the take's frames. Returns the new removals when the shot holding f's
 * middle then reaches `minShot`, else null.
 */
function recutGrow(list, f, need, pictureCuts, minShot, duration, fps) {
  const left = list.findIndex((r) => r.kind === 'dead_air' && Math.abs(r.end - f.start) <= RECUT_EPS);
  const right = list.findIndex((r) => r.kind === 'dead_air' && Math.abs(r.start - f.end) <= RECUT_EPS);
  const inside = (r) => pictureCuts.filter((c) => c > r.start + RECUT_EPS && c < r.end - RECUT_EPS);
  const leftStop = left < 0 ? null : Math.max(list[left].start, ...inside(list[left]));
  const rightStop = right < 0 ? null : Math.min(list[right].end, ...inside(list[right]));
  const leftRoom = left < 0 ? 0 : list[left].end - leftStop;
  const rightRoom = right < 0 ? 0 : rightStop - list[right].start;
  if (leftRoom + rightRoom < RECUT_EPS) return null;
  let takeLeft = 0;
  if (leftRoom >= need - RECUT_EPS) takeLeft = need;
  else if (rightRoom < need - RECUT_EPS) takeLeft = leftRoom;
  const takeRight = Math.min(rightRoom, need - takeLeft);
  const out = list.map((r) => ({ ...r }));
  if (takeLeft > RECUT_EPS) out[left].end = Math.max(leftStop, Math.floor((out[left].end - takeLeft) * fps + 1e-6) / fps);
  if (takeRight > RECUT_EPS) out[right].start = Math.min(rightStop, Math.ceil((out[right].start + takeRight) * fps - 1e-6) / fps);
  const kept = out.filter((r) => r.end - r.start > RECUT_EPS);
  const mid = (f.start + f.end) / 2;
  const grown = recutFragments(recutKeep(kept, duration), pictureCuts).find((x) => x.start <= mid && x.end >= mid);
  return grown && grown.end - grown.start >= minShot - RECUT_EPS ? kept : null;
}

/**
 * Every short shot (under `minShot`) lengthened from the dead air cut next to it where that reaches the minimum
 * (recutGrow). `removals` are frame-exact; the result is too. Shots it cannot lengthen are left as they are.
 */
export function recutLengthen(removals, duration, pictureCuts, minShot, fps) {
  let list = removals.map((r) => ({ ...r }));
  const tried = new Set();
  for (let guard = 0; guard < 4 * (list.length + pictureCuts.length + 1); guard++) {
    const f = recutFragments(recutKeep(list, duration), pictureCuts).find((x) => x.end - x.start < minShot - RECUT_EPS && !tried.has(`${x.start.toFixed(6)}:${x.end.toFixed(6)}`));
    if (!f) break;
    tried.add(`${f.start.toFixed(6)}:${f.end.toFixed(6)}`);
    list = recutGrow(list, f, minShot - (f.end - f.start), pictureCuts, minShot, duration, fps) || list;
  }
  return list;
}

/**
 * The shots still under `minShot` once lengthened: each one's picture is covered by the shot before it
 * (`from: 'prev'`, its last frame held), or after it for the first shot (`'next'`, its first frame), and its
 * sound is kept. When no shot reaches the minimum there is nothing to cover from: those are warnings.
 */
export function recutCovers(keep, pictureCuts, minShot) {
  const frags = recutFragments(keep, pictureCuts);
  const short = frags.map((f) => f.end - f.start < minShot - RECUT_EPS);
  if (short.every(Boolean)) return { covers: [], uncovered: frags };
  const covers = [];
  frags.forEach((f, i) => {
    if (short[i]) covers.push({ start: f.start, end: f.end, from: i > 0 ? 'prev' : 'next' });
  });
  return { covers, uncovered: [] };
}

function recutTouches(list, start, end, pad) {
  return list.some((o) => o.start - pad < end && o.end + pad > start);
}

/** Free stretches of [a, b] once the fixed removals are taken out. */
function recutFree(a, b, fixed) {
  let pieces = [{ start: a, end: b }];
  for (const r of fixed) {
    const next = [];
    for (const p of pieces) {
      if (r.end <= p.start || r.start >= p.end) next.push(p);
      else {
        if (r.start > p.start) next.push({ start: p.start, end: r.start });
        if (r.end < p.end) next.push({ start: r.end, end: p.end });
      }
    }
    pieces = next;
  }
  return pieces.filter((p) => p.end - p.start > RECUT_EPS);
}

/**
 * Where the repeats and stutters of one speech entry are, and which of its words and spoken tokens
 * they take with them. Two shapes of entry:
 *   - words are the written line timed on heard words (transcribe-whisper): a repeat sits in the gap
 *     between two written words, and `spoken` says it is there;
 *   - words are the heard words themselves: a repeat is the earlier of two copies in `words`.
 * Returns {removals, held, droppedWords, droppedSpoken, leadingSpeech, trailingSpeech}: `held` are
 * gaps that hold heard speech the line does not have, which are never cut.
 */
export function recutEntryRepeats(entry, words, drop) {
  const out = { removals: [], held: [], droppedWords: new Set(), droppedSpoken: new Set(), leadingSpeech: false, trailingSpeech: false };
  const lineKeys = recutTokens(entry.text).map((t) => t.key);
  const wordKeys = words.map((w) => kitHeardKey(w.text));
  const wordsAreLine = recutSame(lineKeys, wordKeys);
  if (typeof entry.spoken === 'string' && wordsAreLine) {
    const spoken = recutTokens(entry.spoken);
    const match = recutAlign(wordKeys, spoken.map((t) => t.key));
    const found = match.map((m, i) => (m >= 0 ? i : -1)).filter((i) => i >= 0);
    const real = (from, to) => {
      const idx = [];
      for (let x = from; x < to; x++) if (spoken[x].key) idx.push(x);
      return idx;
    };
    if (found.length) {
      out.leadingSpeech = real(0, match[found[0]]).length > 0;
      out.trailingSpeech = real(match[found.at(-1)] + 1, spoken.length).length > 0;
    } else if (real(0, spoken.length).length) {
      // Nothing of the line was found: its words were spread over what was heard. All of it is speech.
      out.held.push({ start: words[0].start, end: words.at(-1).end });
    }
    for (let f = 0; f + 1 < found.length; f++) {
      const i = found[f];
      const k = found[f + 1];
      const extra = real(match[i] + 1, match[k]);
      const a = words[i].end;
      const b = words[k].start;
      if (k > i + 1) {
        // Written words the transcript did not have sit here on spread-out times: no real silence to cut.
        out.held.push({ start: a, end: b });
        continue;
      }
      if (!extra.length) continue;
      if (drop === 'repeats' && recutIsRepeat(extra.map((x) => spoken[x].key), wordKeys, i) && b - a > 2 * RECUT_REPEAT_PAD_S) {
        out.removals.push({ start: a + RECUT_REPEAT_PAD_S, end: b - RECUT_REPEAT_PAD_S, kind: 'repeat' });
        for (const x of extra) out.droppedSpoken.add(x);
      } else out.held.push({ start: a, end: b });
    }
    return out;
  }
  if (drop !== 'repeats' || wordsAreLine) return out;
  // Heard words: drop the earlier copy of a repeated run, unless the line itself repeats it.
  const lineText = ` ${lineKeys.join(' ')} `;
  for (let i = 0; i + 1 < words.length; i++) {
    if (out.droppedWords.has(i)) continue;
    let n = 0;
    for (let m = Math.min(RECUT_MAX_REPEAT_WORDS, i + 1); m >= 1; m--) {
      if (i + m >= words.length) continue;
      const first = wordKeys.slice(i - m + 1, i + 1);
      if (first.some((k) => !k) || !recutSame(first, wordKeys.slice(i + 1, i + 1 + m))) continue;
      if (lineText.includes(` ${[...first, ...first].join(' ')} `)) continue;
      n = m;
      break;
    }
    const stutter = !n && /[-‐-—…]$/.test(words[i].text) && wordKeys[i] && wordKeys[i + 1].startsWith(wordKeys[i]) && wordKeys[i + 1] !== wordKeys[i];
    if (!n && !stutter) continue;
    const from = i - Math.max(n, 1) + 1;
    const prevEnd = from > 0 ? words[from - 1].end : 0;
    const start = Math.max(prevEnd, words[from].start - RECUT_REPEAT_PAD_S / 2);
    const end = words[i + 1].start - RECUT_REPEAT_PAD_S;
    if (end - start <= RECUT_EPS) continue;
    out.removals.push({ start, end, kind: 'repeat' });
    for (let x = from; x <= i; x++) out.droppedWords.add(x);
  }
  return out;
}

/**
 * The plan for one take.
 *   duration     the take's length (s); fps its frame rate (cut points land on its frames)
 *   speech       Timeline.speech with words; scenes plan.scenes; timeline_scenes the take's timeline scenes
 *   picture_cuts the take's own shot changes (s)
 *   min_shot_s, max_gap_s, drop ('repeats' | 'none')
 * Returns {removals [{start, end, kind}], keep [{start, end}], speech (re-timed), scenes (re-timed),
 * cuts [{at_s, removed_s, kind}], seconds, warnings, heard [{start, end}] (source stretches holding
 * speech with no timed words), covers [{start, end, from}] (short shots whose picture a neighbour
 * covers, in take time)}. Throws RecutRefusal for a take the cut cannot fix.
 */
/**
 * The refusals that need no measuring: speech with no timed words, or a scene line with no heard words.
 * Pure, so the part runs it before any probe or ffmpeg work. Throws RecutRefusal.
 */
export function recutCheckSpeech(speech, scenes) {
  const entries = (speech || []).map((e) => ({ entry: e, words: e.words || [] }));
  if (!entries.some((e) => e.words.length)) throw new RecutRefusal('the speech has no timed words: transcribe the take with word timings first');
  for (const [i, s] of (scenes || []).entries()) {
    const line = String((s && s.line) || '').trim();
    if (!line) continue;
    const id = s.id == null ? String(i + 1) : String(s.id);
    const hit = entries.find((e) => e.entry.scene_id === id);
    const unheard = !hit || !hit.words.length || (typeof hit.entry.spoken === 'string' && !recutTokens(hit.entry.spoken).some((t) => t.key));
    if (unheard) throw new RecutRefusal(`scene ${id}'s line has no heard words in the take; the take needs a re-roll, the cut cannot add a line`);
  }
}

export function recutPlan({ duration, fps, speech, scenes, timeline_scenes: timelineScenes = [], picture_cuts: pictureCuts = [], min_shot_s: minShot = 0.4, max_gap_s: maxGap = 0.25, drop = 'repeats' }) {
  if (!(duration > 0)) throw new RecutRefusal('the take has no length');
  const clamp = (t) => Math.min(Math.max(Number(t) || 0, 0), duration);
  recutCheckSpeech(speech, scenes);
  const entries = (speech || []).map((e) => ({
    entry: e,
    words: (e.words || []).map((w) => {
      const start = clamp(w.start_s);
      return { text: String(w.text), start, end: Math.max(start, clamp(w.end_s)) };
    }),
  }));

  // What may never be cut: kept words, gaps holding speech the line lacks, and silent beats.
  const fixed = [];
  const occupied = [];
  const per = entries.map((e) => (e.words.length ? recutEntryRepeats(e.entry, e.words, drop) : null));
  entries.forEach((e, n) => {
    const r = per[n];
    if (!r) return;
    e.words.forEach((w, i) => {
      if (!r.droppedWords.has(i)) occupied.push({ start: w.start, end: w.end, kind: 'word' });
    });
    occupied.push(...r.held.map((h) => ({ ...h, kind: 'held' })));
    fixed.push(...r.removals);
  });
  const silent = new Set(
    (scenes || []).map((s, i) => [s, i]).filter(([s]) => !String((s && s.line) || '').trim()).map(([s, i]) => (s.id == null ? String(i + 1) : String(s.id))),
  );
  for (const s of timelineScenes) {
    if (silent.has(String(s.id)) && s.end_s > s.start_s) occupied.push({ start: clamp(s.start_s), end: clamp(s.end_s), kind: 'silent_scene' });
  }
  // A line whose leading or trailing heard words are not in the line: the silence next to it holds them.
  const firstWord = (n) => entries[n].words.find((_, i) => !per[n].droppedWords.has(i));
  const lastWord = (n) => entries[n].words.filter((_, i) => !per[n].droppedWords.has(i)).at(-1);
  const blocked = [];
  entries.forEach((e, n) => {
    if (!per[n]) return;
    if (per[n].leadingSpeech && firstWord(n)) blocked.push({ edge: 'before', at: firstWord(n).start });
    if (per[n].trailingSpeech && lastWord(n)) blocked.push({ edge: 'after', at: lastWord(n).end });
  });
  const solid = recutMerge(occupied);

  // The silences between them, less the repeats already cut.
  const removals = [...fixed];
  const cutsIn = (a, b) => pictureCuts.filter((c) => c >= a - RECUT_EPS && c <= b + RECUT_EPS);
  const gaps = [];
  let at = 0;
  for (const o of solid) {
    if (o.start > at + RECUT_EPS) gaps.push({ start: at, end: o.start });
    at = Math.max(at, o.end);
  }
  if (duration > at + RECUT_EPS) gaps.push({ start: at, end: duration });
  // Leading extras sit in the nearest silence before the line's first word; trailing ones in the nearest after.
  const heldGaps = new Set();
  for (const x of blocked) {
    const g = x.edge === 'before' ? gaps.filter((y) => y.end <= x.at + RECUT_EPS).at(-1) : gaps.find((y) => y.start >= x.at - RECUT_EPS);
    if (g) heldGaps.add(g);
  }
  for (const g of gaps) {
    const head = g.start <= RECUT_EPS;
    const tail = g.end >= duration - RECUT_EPS;
    if (heldGaps.has(g)) continue;
    for (const p of recutFree(g.start, g.end, fixed)) {
      const length = p.end - p.start;
      if (head && p.start <= RECUT_EPS) {
        // The take's head: keep max_gap_s before the first word. A trim, not a join.
        if (length > maxGap && !tail) removals.push({ start: 0, end: p.end - maxGap, kind: 'head' });
        continue;
      }
      if (tail && p.end >= duration - RECUT_EPS) {
        // The tail: hold twice max_gap_s after the last word, so the last reaction lands.
        if (length > 2 * maxGap) removals.push({ start: p.start + 2 * maxGap, end: duration, kind: 'tail' });
        continue;
      }
      if (length <= maxGap + RECUT_EPS) continue;
      const r = length - maxGap;
      const lo = p.start + RECUT_EDGE_S;
      const hi = p.end - RECUT_EDGE_S;
      const mid = p.start + (length - r) / 2;
      // A removal that takes in one of the take's own picture cuts joins two different shots, so the
      // join reads as that cut. Try the middle, and for each cut in reach the window nearest the
      // middle that takes it in, plus its two extremes (they can keep a neighbouring shot long enough).
      const starts = [mid];
      for (const c of cutsIn(lo, hi)) {
        const sMin = Math.max(lo, c - r);
        const sMax = Math.min(hi - r, c);
        if (sMin <= sMax + RECUT_EPS) starts.push(Math.min(Math.max(mid, sMin), sMax), sMin, sMax);
      }
      let best = null;
      for (const s of starts) {
        const o = { start: s, end: s + r };
        const onCut = pictureCuts.some((c) => c >= o.start - RECUT_EPS && c <= o.end + RECUT_EPS);
        const score = [recutShortCount([...removals, { ...o, kind: 'dead_air' }], duration, pictureCuts, minShot), onCut ? 0 : 1, Math.abs(o.start - mid)];
        if (!best || score[0] < best.score[0] || (score[0] === best.score[0] && (score[1] < best.score[1] || (score[1] === best.score[1] && score[2] < best.score[2])))) {
          best = { o, score };
        }
      }
      removals.push({ start: best.o.start, end: best.o.end, kind: 'dead_air' });
    }
  }

  // Minimum shot: a short shot with no speech in it (or within RECUT_EDGE_S of it) is dropped whole.
  let keep = recutKeep(removals, duration);
  for (const f of recutFragments(keep, pictureCuts)) {
    if (f.end - f.start >= minShot - RECUT_EPS) continue;
    if (!recutTouches(solid, f.start, f.end, RECUT_EDGE_S)) removals.push({ start: f.start, end: f.end, kind: 'short_shot' });
  }

  // Cut points land on the take's frames, so picture and sound cut together.
  const frame = (t) => Math.min(duration, Math.max(0, Math.round(t * fps) / fps));
  const snapped = recutMerge(removals.map((r) => ({ start: frame(r.start), end: r.end >= duration - RECUT_EPS ? duration : frame(r.end), kind: r.kind })));
  // A short shot that holds speech: more of the dead air beside it, else its picture covered by a neighbour.
  const merged = recutMerge(recutLengthen(snapped, duration, pictureCuts, minShot, fps));
  keep = recutKeep(merged, duration);
  if (!keep.length) throw new RecutRefusal('the cut removed the whole take');
  const warnings = [];
  const { covers, uncovered } = recutCovers(keep, pictureCuts, minShot);
  for (const f of uncovered) {
    if (f.end - f.start < minShot - RECUT_EPS) {
      warnings.push(`a ${(f.end - f.start).toFixed(2)}s shot at ${f.start.toFixed(2)}s of the take holds speech and is kept under the ${minShot}s minimum`);
    }
  }

  const map = recutMapper(keep);
  const t3 = (t) => +map(t).toFixed(3);
  const seconds = +keep.reduce((sum, k) => sum + (k.end - k.start), 0).toFixed(3);
  const outSpeech = entries.map((e, n) => {
    const r = per[n];
    const src = e.entry;
    const out = { ...src };
    if (e.words.length) {
      const kept = e.words.filter((_, i) => !(r && r.droppedWords.has(i)));
      out.words = kept.map((w) => ({ text: w.text, start_s: t3(w.start), end_s: Math.max(t3(w.start), t3(w.end)) }));
      if (r && typeof src.spoken === 'string') {
        if (r.droppedSpoken.size) {
          out.spoken = recutTokens(src.spoken).filter((_, x) => !r.droppedSpoken.has(x)).map((t) => t.text).join(' ');
        } else if (r.droppedWords.size && recutSame(recutTokens(src.spoken).map((t) => t.key), e.words.map((w) => kitHeardKey(w.text)))) {
          out.spoken = e.words.filter((_, i) => !r.droppedWords.has(i)).map((w) => w.text).join(' ');
        }
      }
    }
    out.start_s = out.words && out.words.length ? out.words[0].start_s : t3(clamp(src.start_s));
    out.end_s = out.words && out.words.length ? Math.max(out.start_s, out.words.at(-1).end_s) : Math.max(out.start_s, t3(clamp(src.end_s)));
    return out;
  });
  const outScenes = [];
  for (const s of timelineScenes) {
    const start = t3(clamp(s.start_s));
    const end = Math.min(seconds, t3(clamp(s.end_s)));
    if (end - start > 1e-3) outScenes.push({ id: String(s.id), start_s: start, end_s: end });
    else warnings.push(`scene ${s.id} had only dead air and is gone from the timeline`);
  }
  const cuts = merged.map((r) => ({ at_s: t3(r.start), removed_s: +(r.end - r.start).toFixed(3), kind: r.kind }));
  // Source stretches that hold heard speech with no timed words (untimed leading or trailing extras,
  // gaps inside a line the line lacks): never a room-tone window, or the bed would loop that speech.
  const heard = [...heldGaps, ...occupied.filter((o) => o.kind === 'held')].map((g) => ({ start: g.start, end: g.end }));
  return { removals: merged, keep, speech: outSpeech, scenes: outScenes, cuts, seconds, warnings, heard, covers };
}

// ---------------------------------------------------------------------------------------------
// Room tone (W1-15b). A re-cut puts stretches of the street from different moments end to end, so
// the background steps at every join (recut.py measured 2.2 to 6.4 dB). One bed of the take's own
// room tone, looped under the whole edit, bridges those steps. The bed is cut from the ORIGINAL
// take's quietest speech-free window, even when the cut drops that window, and never from a
// stretch that holds speech: a bed cut over a line loops that line under the video (recut.py,
// seed 4815, where Whisper then heard the question three times).

/** The analysis frame for room-tone levels, in seconds (800 samples at 16 kHz). */
export const RECUT_LEVEL_STEP_S = 0.05;
/** The analysis sample rate (mono, s16le) for room-tone levels. */
export const RECUT_LEVEL_RATE = 16000;
/** A frame quieter than this is digital silence or a fade, not room tone. */
export const RECUT_SILENCE_DB = -80;
/** Speech is kept this far clear of a room-tone window (Whisper's word edges drift). */
export const RECUT_ROOM_PAD_S = 0.12;
/** Window lengths tried for the bed, longest first: a longer loop repeats less often. */
export const RECUT_ROOM_LENGTHS = [1.0, 0.8, 0.6, 0.4];

/** dB per RECUT_LEVEL_STEP_S frame of mono s16le PCM at RECUT_LEVEL_RATE. -Infinity for a silent frame. */
export function recutLevels(pcm) {
  const step = Math.round(RECUT_LEVEL_STEP_S * RECUT_LEVEL_RATE);
  const n = Math.floor(pcm.length / 2);
  const out = [];
  for (let f = 0; (f + 1) * step <= n; f++) {
    let sum = 0;
    for (let i = f * step; i < (f + 1) * step; i++) {
      const v = pcm.readInt16LE(i * 2) / 32768;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / step);
    out.push(rms > 0 ? 20 * Math.log10(rms) : -Infinity);
  }
  return out;
}

/**
 * The stretches of the take that hold speech, padded: every heard word, every line's span, and the
 * planner's `heard` stretches (speech with no timed words, recutPlan's `heard`).
 */
export function recutSpeechBusy(speech, pad = RECUT_ROOM_PAD_S, heard = []) {
  const busy = heard.filter((h) => Number.isFinite(h.start) && Number.isFinite(h.end)).map((h) => ({ start: h.start - pad, end: h.end + pad }));
  for (const e of speech || []) {
    const words = (e.words || []).filter((w) => Number.isFinite(w.start_s) && Number.isFinite(w.end_s));
    for (const w of words) busy.push({ start: w.start_s - pad, end: Math.max(w.start_s, w.end_s) + pad });
    if (words.length) busy.push({ start: Math.min(...words.map((w) => w.start_s)) - pad, end: Math.max(...words.map((w) => w.end_s)) + pad });
    if (Number.isFinite(e.start_s) && Number.isFinite(e.end_s) && e.end_s > e.start_s) busy.push({ start: e.start_s - pad, end: e.end_s + pad });
  }
  return recutMerge(busy.map((b) => ({ ...b, kind: 'speech' }))).map(({ start, end }) => ({ start, end }));
}

/**
 * The quietest window of the take to loop as room tone. For each of RECUT_ROOM_LENGTHS, the
 * speech-free window whose loudest frame is quietest (so a footstep or a word onset never lands in
 * the bed), ties broken by the mean level then the earlier start. Across lengths the longest wins
 * (a longer loop repeats less often) unless a shorter one is more than 1 dB quieter at its peak.
 * Frames of digital silence (under RECUT_SILENCE_DB) disqualify a window: a fade is not room tone.
 *   levels  dB per `step_s` frame of the take (recutLevels); busy speech stretches (recutSpeechBusy)
 * Returns {start_s, end_s, level_db, peak_db}, or null when no window of min_s fits.
 */
export function recutQuietWindow({ levels, step_s: step = RECUT_LEVEL_STEP_S, busy = [], duration, lengths = RECUT_ROOM_LENGTHS }) {
  const total = Number.isFinite(duration) ? Math.min(duration, levels.length * step) : levels.length * step;
  let pick = null;
  for (const len of [...lengths].sort((a, b) => b - a)) {
    const frames = Math.round(len / step);
    let best = null;
    for (let f = 0; (f + frames) * step <= total + RECUT_EPS; f++) {
      const start = f * step;
      const end = start + frames * step;
      if (busy.some((b) => b.start < end && b.end > start)) continue;
      const win = levels.slice(f, f + frames);
      if (win.length < frames || win.some((v) => !(v >= RECUT_SILENCE_DB))) continue;
      const peak = Math.max(...win);
      const mean = 10 * Math.log10(win.reduce((s, v) => s + 10 ** (v / 10), 0) / win.length);
      if (!best || peak < best.peak_db - 1e-9 || (Math.abs(peak - best.peak_db) <= 1e-9 && mean < best.level_db - 1e-9)) {
        best = { start_s: +start.toFixed(3), end_s: +end.toFixed(3), level_db: +mean.toFixed(2), peak_db: peak };
      }
    }
    if (best && (!pick || best.peak_db < pick.peak_db - 1)) pick = best;
  }
  return pick && { ...pick, peak_db: +pick.peak_db.toFixed(2) };
}
