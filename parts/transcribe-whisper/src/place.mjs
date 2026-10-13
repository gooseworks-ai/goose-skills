// Each approved line placed on what was heard (1.1.2). One alignment of the
// whole script on the whole transcript, in scene order, that may skip heard
// words: a repeated line, a filler or an invented word between two lines costs
// nothing to skip, so it can never push the next line off its words. 1.1.1 and
// older looked for each written word among the next five heard words from where
// the last line ended; one repeated question there failed every later line and
// gave all that was heard to the last one.
//
// The alignment is a best-scoring monotonic match of written keys on heard keys
// (both spelled the same way by retimeKeys: numbers as words, contractions
// opened, punctuation dropped). A match scores PLACE_MATCH. Skipping a heard
// word INSIDE one line (between two of its written words) costs
// PLACE_INSIDE_SKIP, so a line keeps its words together instead of borrowing one
// common word from far away; skipping one BETWEEN lines is free. Ties go to the
// earliest heard words.
//
// What each line owns: the heard words from its first matched word to its last,
// plus, at an edge where some of its written words were not heard, up to
// PLACE_CLAIM_PER_WORD heard words per unheard written word (a name Whisper
// writes as two words, say). Lines with no matched word claim the same way from
// the gap they sit in. Heard words no line owns are extra: speech the script
// does not have (a repeat, a filler, an invented line), returned as runs so a
// cut can drop them.
//
// Every top-level name starts with `place` (bundled modules share one namespace).
import { retimeKeys } from './retime.mjs';

/** What one matched written key scores. */
export const PLACE_MATCH = 10;
/** What skipping one heard key inside a line costs (a fifth of a match). */
export const PLACE_INSIDE_SKIP = 2;
/** Heard words a line may claim at an edge, per written word of it that was not heard there. */
export const PLACE_CLAIM_PER_WORD = 2;
/** A line is placed on its matched words when at least this share of its written words was heard. */
export const PLACE_MIN_SHARE = 2 / 3;

/**
 * The best monotonic match of `written` keys on `said` keys. `written` is [{line, key}], `said` is
 * [{word, key}]. Returns, per written key, the heard word index it matched or -1.
 */
export function placeMatch(written, said) {
  const n = written.length;
  const m = said.length;
  const W = m + 1;
  const best = new Int32Array((n + 1) * W);
  const inside = (i) => i > 0 && i < n && written[i - 1].line === written[i].line;
  // best[i][j]: the most the rest scores from written key i and said key j on. Rows past the script or the
  // transcript score 0 (the rest is skipped: heard words after the last line are between lines).
  for (let i = n - 1; i >= 0; i--) {
    const cost = inside(i) ? PLACE_INSIDE_SKIP : 0;
    for (let j = m - 1; j >= 0; j--) {
      let v = best[(i + 1) * W + j];
      const skipSaid = best[i * W + j + 1] - cost;
      if (skipSaid > v) v = skipSaid;
      if (written[i].key === said[j].key) {
        const hit = PLACE_MATCH + best[(i + 1) * W + j + 1];
        if (hit > v) v = hit;
      }
      best[i * W + j] = v;
    }
  }
  const match = new Array(n).fill(-1);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    const here = best[i * W + j];
    if (written[i].key === said[j].key && here === PLACE_MATCH + best[(i + 1) * W + j + 1]) {
      match[i] = said[j].word;
      i++;
      j++;
    } else if (here === best[i * W + j + 1] - (inside(i) ? PLACE_INSIDE_SKIP : 0)) j++;
    else i++;
  }
  return match;
}

function placeBy(lines, heard, bare) {
  const words = lines.map((l) => String(l.text).split(/\s+/).filter(Boolean));
  const written = [];
  words.forEach((ws, li) => ws.forEach((w, wi) => retimeKeys(w, { bare }).forEach((key) => written.push({ line: li, word: wi, key }))));
  const said = [];
  heard.forEach((h, hi) => retimeKeys(h.text, { bare }).forEach((key) => said.push({ word: hi, key })));
  const match = placeMatch(written, said);
  // Per written word: the heard word its first matched key landed on, or -1.
  const hits = words.map((ws) => ws.map(() => -1));
  written.forEach((w, k) => {
    if (match[k] >= 0 && hits[w.line][w.word] < 0) hits[w.line][w.word] = match[k];
  });
  return { words, hits, matched: match.filter((x) => x >= 0).length };
}

/** Splits `count` items among `caps` in proportion, in order; every item goes to someone when any cap is above 0. */
function placeShare(count, caps) {
  const total = caps.reduce((a, b) => a + b, 0);
  if (!total) return caps.map(() => 0);
  const out = [];
  let given = 0;
  let capSoFar = 0;
  for (const cap of caps) {
    capSoFar += cap;
    const upTo = Math.round((count * capSoFar) / total);
    out.push(upTo - given);
    given = upTo;
  }
  return out;
}

/**
 * Places `lines` ([{scene_id, text}], plan order) on `heard` (kitHeardWords' [{text, start, end}]).
 * Returns { lines: [{ words: [written word], hits: [heard index | -1], own: [first, last] | null, placed }],
 * extras: [[first, last]] } where `own` is the run of heard words the line owns and `extras` are the
 * runs no line owns, in order.
 */
export function placeLines(lines, heard) {
  // Contractions compared opened ("don't" = "do not") and, when that hears less, bare ("we're" = "were").
  const opened = placeBy(lines, heard, false);
  const bare = opened.matched === opened.words.reduce((a, ws) => a + ws.length, 0) ? opened : placeBy(lines, heard, true);
  const { words, hits } = bare.matched > opened.matched ? bare : opened;

  const out = words.map((ws, li) => {
    const found = hits[li].filter((h) => h >= 0);
    const first = found.length ? Math.min(...found) : -1;
    const last = found.length ? Math.max(...found) : -1;
    const firstHit = hits[li].findIndex((h) => h >= 0);
    const lastHit = hits[li].length - 1 - [...hits[li]].reverse().findIndex((h) => h >= 0);
    return {
      words: ws,
      hits: hits[li],
      first,
      last,
      // Written words not heard before the first heard one and after the last: what the line may claim.
      lead: found.length ? firstHit : ws.length,
      tail: found.length ? ws.length - 1 - lastHit : 0,
      placed: ws.length > 0 && found.length >= Math.max(1, Math.floor(ws.length * PLACE_MIN_SHARE)),
    };
  });
  // Monotonic by construction; a heard word two lines share (one heard "200" for "two" ending one line and
  // "hundred" starting the next) stays with the earlier line.
  let lastOwned = -1;
  for (const l of out) {
    if (l.first < 0) continue;
    if (l.first <= lastOwned) l.first = lastOwned + 1;
    if (l.first > l.last) {
      l.first = l.last = -1;
      l.lead = l.words.length;
      l.tail = 0;
      continue;
    }
    lastOwned = l.last;
  }
  const own = out.map((l) => (l.first >= 0 ? [l.first, l.last] : null));

  // The gaps between lines with heard words: each line next to one claims from its side.
  const ranged = out.map((l, i) => (l.first >= 0 ? i : -1)).filter((i) => i >= 0);
  const bounds = [-1, ...ranged, out.length];
  const owned = new Array(heard.length).fill(false);
  for (const [f, t] of own.filter(Boolean)) for (let x = f; x <= t; x++) owned[x] = true;
  for (let b = 0; b + 1 < bounds.length; b++) {
    const a = bounds[b];
    const z = bounds[b + 1];
    const g0 = a >= 0 ? out[a].last + 1 : 0;
    const g1 = z < out.length ? out[z].first - 1 : heard.length - 1;
    const len = g1 - g0 + 1;
    if (len <= 0) continue;
    const mids = [];
    for (let k = a + 1; k < z; k++) mids.push(k);
    const caps = [a >= 0 ? out[a].tail : 0, ...mids.map((k) => out[k].words.length), z < out.length ? out[z].lead : 0].map((c) => c * PLACE_CLAIM_PER_WORD);
    const total = caps.reduce((x, y) => x + y, 0);
    if (!total) continue;
    // Enough claims for the whole gap: it is shared in proportion. Otherwise each takes its cap, the line
    // before from the left, lines inside after it, the line after from the right; the rest is extra.
    const take = total >= len ? placeShare(len, caps) : caps;
    let at = g0;
    const give = (k, from, to) => {
      if (to < from) return;
      own[k] = own[k] ? [Math.min(own[k][0], from), Math.max(own[k][1], to)] : [from, to];
      for (let x = from; x <= to; x++) owned[x] = true;
    };
    if (a >= 0) give(a, at, at + take[0] - 1);
    at += take[0];
    mids.forEach((k, n) => {
      give(k, at, at + take[n + 1] - 1);
      at += take[n + 1];
    });
    if (z < out.length) give(z, g1 - take.at(-1) + 1, g1);
  }
  const extras = [];
  for (let x = 0; x < heard.length; x++) {
    if (owned[x]) continue;
    if (extras.length && extras.at(-1)[1] === x - 1) extras.at(-1)[1] = x;
    else extras.push([x, x]);
  }
  return { lines: out.map((l, i) => ({ words: l.words, hits: l.hits, own: own[i], placed: l.placed })), extras };
}

/**
 * Times for a placed line's written words: a heard word gives its span (shared evenly by the written
 * words that landed on it); a word not heard sits evenly between its timed neighbours, or between the
 * line's own edge and its first or last timed word. Returns [{text, start_s, end_s}].
 */
export function placeTimes(line, heard) {
  const { words, hits, own } = line;
  const spans = words.map(() => null);
  for (let i = 0; i < words.length; ) {
    if (hits[i] < 0) {
      i++;
      continue;
    }
    let k = i;
    while (k + 1 < words.length && hits[k + 1] === hits[i]) k++;
    const h = heard[hits[i]];
    const step = (h.end - h.start) / (k - i + 1);
    for (let x = i; x <= k; x++) spans[x] = { start: h.start + step * (x - i), end: h.start + step * (x - i + 1) };
    i = k + 1;
  }
  const lo = own ? heard[own[0]].start : 0;
  const hi = own ? heard[own[1]].end : lo;
  const known = spans.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
  for (let i = 0; i < spans.length; i++) {
    if (spans[i]) continue;
    const before = known.filter((k) => k < i);
    const after = known.filter((k) => k > i);
    const p = before.length ? before.at(-1) : -1;
    const q = after.length ? after[0] : words.length;
    const t0 = p >= 0 ? spans[p].end : lo;
    const t1 = q < words.length ? spans[q].start : Math.max(hi, t0);
    const step = (Math.max(t1, t0) - t0) / (q - p - 1);
    spans[i] = { start: t0 + step * (i - p - 1), end: t0 + step * (i - p) };
  }
  return words.map((text, i) => ({ text, start_s: spans[i].start, end_s: spans[i].end }));
}
