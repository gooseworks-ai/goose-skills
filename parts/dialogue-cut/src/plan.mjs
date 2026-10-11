// dialogue-cut planner: the free, seeded picture edit over a two-host dialogue
// whose audio is already fixed. A port of the podcast recipe's plan_cuts.py
// (one-shot-videos/create-podcast-skit-video-from-refs/scripts/plan_cuts.py)
// plus its cut-plan gates (gates.py gate_cutplan, gate_split_balance,
// gate_framing_variety). Pure functions: no files, no ffmpeg, no clock, no RNG.
// The compose (dialogue-cut 1.0.0, W1-12) renders the plan this returns.
//
// The audio never moves. What varies is the PICTURE, cut by cut, over lipsync
// clips that were already paid for, so every re-cut costs nothing.
//
// Three cut kinds:
//   single    the scene's own lipsync clip, trimmed to the cut's window. The
//             only kind that may show the speaking host full frame, because it
//             is the only one whose mouth tracks the audio.
//   reaction  the OTHER host full frame, sampled from that host's nearest own
//             clip at a seeded offset. This is what makes a cut inside a line
//             possible: another still of the speaker would show a mouth that
//             does not move.
//   split     the speaker on top, and below either the listener (their nearest
//             clip, or their idle clip) or a product still. A seam ratio per
//             cut; moving the seam is itself a framing change.
// The payoff beat (a scene marked extra.payoff, else the last) drops the split
// for one full-frame single, only when the piece was split earlier.
//
// Modes (a declared answer): plain = one full-frame picture per line;
// split = the speaker over the listener almost throughout, with the payoff
// single; dynamic = cut patterns inside each line, five reframes per host,
// splits on a cadence, seams 0.62 / 0.37 / 0.5, product or listener below.
//
// Pattern choice is a cursor walk over DIALOGUE_PATTERNS from seed % length,
// and the framing tie-break is arithmetic on the seed: the same seed and the
// same lines always give the same plan.
//
// Exports (W1-12 imports these):
//   DIALOGUE_MODES, DIALOGUE_CROPS, DIALOGUE_PATTERNS
//   dialogueSettings(mode, overrides)         -> settings for one mode
//   dialogueBeats(scenes, spans, hosts, opts) -> {beats, skipped}; throws bad_input
//   dialoguePlan(beats, hosts, settings, opts) -> the cut plan
//   dialoguePlanProblems(plan, beats, hosts, settings, opts) -> ['check_id: message', ...]
//   dialogueFramingStats(cuts, totalS)
// Thrown errors carry code 'bad_input'; the compose rethrows them through ctx.error.

/** The reference framings: a normalised crop rect on the source picture. */
export const DIALOGUE_CROPS = Object.freeze({
  wide: Object.freeze({ x: 0, y: 0, w: 1, h: 1 }),
  mid: Object.freeze({ x: 0.1, y: 0.05, w: 0.8, h: 0.8 }),
  tight: Object.freeze({ x: 0.21, y: 0.03, w: 0.58, h: 0.58 }),
  mid_left: Object.freeze({ x: 0.02, y: 0.08, w: 0.76, h: 0.76 }),
  tight_right: Object.freeze({ x: 0.4, y: 0.06, w: 0.56, h: 0.56 }),
});

// The recipe's cut patterns, in its order. A-I-A (an image-to-video insert) is
// never eligible here (inserts are paid and were never built), but it stays in
// the list because the cursor walk starts at seed % length: dropping it would
// change every plan the recipe ever approved.
export const DIALOGUE_PATTERNS = Object.freeze([
  { id: 'A', segments: ['speaker'], weights: [1.0] },
  { id: 'A-R', segments: ['speaker', 'listener'], weights: [0.68, 0.32] },
  { id: 'A-R-A', segments: ['speaker', 'listener', 'speaker'], weights: [0.42, 0.22, 0.36] },
  { id: 'R-A', segments: ['listener', 'speaker'], weights: [0.28, 0.72] },
  { id: 'S', segments: ['split'], weights: [1.0] },
  { id: 'A-S', segments: ['speaker', 'split'], weights: [0.55, 0.45] },
  { id: 'A-I-A', segments: ['speaker', 'insert', 'speaker'], weights: [0.4, 0.25, 0.35] },
]);

const FRAMING_BANDS = Object.freeze({ per_10s_min: 2.9, per_10s_max: 7.1, max_share: 0.17 });

/** The recipe's config.example.json `edit` block (dynamic) and its plain and split presets. */
export const DIALOGUE_MODES = Object.freeze({
  dynamic: {
    seed: 4201,
    multicut: true,
    min_cut_s: 0.5,
    max_cut_s: 1.9,
    split: { enabled: true, auto_every: 4, max_consecutive: 1, min_beat_s: 0.8, seams: [0.62, 0.37, 0.5], bottom_sources: ['listener', 'product'], listener_source: 'clip', target_share: 1.0 },
    payoff: 'last',
    sizes: ['wide', 'mid', 'tight', 'mid_left', 'tight_right'],
  },
  split: {
    seed: 4201,
    multicut: false,
    min_cut_s: 0.5,
    max_cut_s: 6.0,
    split: { enabled: true, auto_every: 1, max_consecutive: 99, min_beat_s: 0.6, seams: [0.5], bottom_sources: ['listener'], listener_source: 'idle', target_share: 1.0 },
    payoff: 'last',
    sizes: ['wide'],
  },
  plain: {
    seed: 4201,
    multicut: false,
    min_cut_s: 0.5,
    max_cut_s: 1.9,
    split: { enabled: false, auto_every: 4, max_consecutive: 1, min_beat_s: 0.8, seams: [0.62, 0.37, 0.5], bottom_sources: ['listener', 'product'], listener_source: 'clip', target_share: 1.0 },
    payoff: 'none',
    sizes: ['wide'],
  },
});

const OVERRIDES = new Set(['seed', 'crops', 'seams', 'bottom_sources', 'payoff', 'listener_source', 'idle_seconds', 'min_cut_s', 'max_cut_s']);

function dialogueBadInput(message) {
  return Object.assign(new Error(message), { code: 'bad_input' });
}

/** Python's round(x, 6) closely enough for times in seconds. */
function dialogueRound(x, digits = 6) {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}

/** Python's round() to an integer: halves go to the even neighbour. */
function dialogueRoundHalfEven(x) {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

/**
 * Settings for one mode. `overrides` holds only the inputs a style may pass
 * (seed, crops, seams, bottom_sources, payoff 'last' | 'none', listener_source
 * 'clip' | 'idle', idle_seconds, min_cut_s, max_cut_s); each replaces the
 * mode's default. Anything else is refused, so a typo is an error and not a
 * setting nobody reads.
 */
export function dialogueSettings(mode, overrides = {}) {
  const base = DIALOGUE_MODES[mode];
  if (!base) throw dialogueBadInput(`dialogue-cut: mode ${JSON.stringify(mode)} is not one of ${Object.keys(DIALOGUE_MODES).join(', ')}`);
  for (const k of Object.keys(overrides || {})) {
    if (!OVERRIDES.has(k)) throw dialogueBadInput(`dialogue-cut: ${k} is not a planner setting`);
  }
  const o = overrides || {};
  const crops = { ...DIALOGUE_CROPS, ...(o.crops || {}) };
  for (const [name, c] of Object.entries(crops)) {
    if (!c || !(c.x >= 0 && c.y >= 0 && c.w > 0 && c.h > 0 && c.x + c.w <= 1 + 1e-9 && c.y + c.h <= 1 + 1e-9)) {
      throw dialogueBadInput(`dialogue-cut: crop ${name} ${JSON.stringify(c)} leaves the picture`);
    }
  }
  const split = { ...base.split, idle_seconds: 6.0 };
  if (o.seams !== undefined) split.seams = [...o.seams];
  if (o.bottom_sources !== undefined) split.bottom_sources = [...o.bottom_sources];
  if (o.listener_source !== undefined) split.listener_source = o.listener_source;
  if (o.idle_seconds !== undefined) split.idle_seconds = o.idle_seconds;
  for (const s of split.seams) if (!(s > 0.2 && s < 0.8)) throw dialogueBadInput(`dialogue-cut: seam ${s} is outside 0.2 to 0.8`);
  if (!split.seams.length) throw dialogueBadInput('dialogue-cut: seams is empty');
  for (const b of split.bottom_sources) if (b !== 'listener' && b !== 'product') throw dialogueBadInput(`dialogue-cut: bottom source ${JSON.stringify(b)} is not listener or product`);
  if (split.listener_source !== 'clip' && split.listener_source !== 'idle') throw dialogueBadInput(`dialogue-cut: listener_source ${JSON.stringify(split.listener_source)} is not clip or idle`);
  const payoff = o.payoff ?? base.payoff;
  if (payoff !== 'last' && payoff !== 'none') throw dialogueBadInput(`dialogue-cut: payoff ${JSON.stringify(payoff)} is not last or none`);
  const min_cut_s = o.min_cut_s ?? base.min_cut_s;
  const max_cut_s = o.max_cut_s ?? base.max_cut_s;
  if (!(min_cut_s > 0 && max_cut_s > min_cut_s)) throw dialogueBadInput(`dialogue-cut: cut bounds ${min_cut_s} to ${max_cut_s} are not a range`);
  const seed = o.seed ?? base.seed;
  if (!Number.isInteger(seed) || seed < 0) throw dialogueBadInput(`dialogue-cut: seed ${seed} is not a whole number`);
  return {
    mode,
    seed,
    multicut: base.multicut,
    min_cut_s,
    max_cut_s,
    split,
    payoff,
    sizes: base.sizes.filter((s) => crops[s]),
    crops,
    bands: { ...FRAMING_BANDS },
    patterns: DIALOGUE_PATTERNS,
  };
}

/**
 * The beats (one per spoken scene) the plan cuts over, from plan.scenes and a
 * timing producer's spans [{id, start_s, end_s}]. A beat runs from its line's
 * start to the next line's start, so the gap after a line belongs to it and the
 * beats tile the audio from 0 to `seconds` (the voice length; default: the last
 * span's end). A scene with no line and no span is skipped (critic #9); a line
 * with no span, a speaker outside `hosts`, or overlapping spans are refused.
 * `scene.extra.split` asks for a split on that line; `scene.extra.payoff`
 * marks the payoff line.
 */
export function dialogueBeats(scenes, spans, hosts, { seconds } = {}) {
  if (!Array.isArray(hosts) || hosts.length !== 2 || hosts[0] === hosts[1]) {
    throw dialogueBadInput(`dialogue-cut: needs exactly two hosts, got ${JSON.stringify(hosts)}`);
  }
  const byId = new Map((spans || []).map((s) => [s.id, s]));
  const beats = [];
  const skipped = [];
  for (const scene of scenes || []) {
    const span = byId.get(scene.id);
    const spoken = typeof scene.line === 'string' && scene.line.trim() !== '';
    if (!span) {
      if (spoken) throw dialogueBadInput(`dialogue-cut: scene ${scene.id} has a line but no span in the voice timing`);
      skipped.push(scene.id);
      continue;
    }
    if (!hosts.includes(scene.speaker)) {
      throw dialogueBadInput(`dialogue-cut: scene ${scene.id} speaker ${JSON.stringify(scene.speaker ?? null)} is not one of the hosts ${hosts.join(', ')}`);
    }
    if (!(span.end_s > span.start_s && span.start_s >= 0)) throw dialogueBadInput(`dialogue-cut: scene ${scene.id} span ${span.start_s} to ${span.end_s} is empty`);
    beats.push({ n: beats.length + 1, id: scene.id, who: scene.speaker, span_start_s: span.start_s, span_end_s: span.end_s, split: scene.extra?.split === true, payoff: scene.extra?.payoff === true });
  }
  if (!beats.length) throw dialogueBadInput('dialogue-cut: no scene has a spoken line with a span');
  for (let i = 1; i < beats.length; i++) {
    if (beats[i].span_start_s < beats[i - 1].span_end_s - 1e-6) {
      throw dialogueBadInput(`dialogue-cut: spans of ${beats[i - 1].id} and ${beats[i].id} overlap or are out of order`);
    }
  }
  const last = beats.at(-1);
  const end = Math.max(last.span_end_s, Number.isFinite(seconds) ? seconds : 0);
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    b.start_s = i === 0 ? 0 : beats[i - 1].end_s;
    b.end_s = i + 1 < beats.length ? beats[i + 1].span_start_s : end;
    b.dur_s = b.end_s - b.start_s;
  }
  return { beats, skipped };
}

function dialogueSplitWindow(beat, s, idx, prevSplit) {
  const ss = s.split;
  if (!ss.enabled) return false;
  const every = ss.auto_every;
  if (!(beat.split || (every > 0 && idx % every === 0))) return false;
  if (prevSplit >= ss.max_consecutive) return false;
  if (beat.dur_s < ss.min_beat_s) return false;
  return true;
}

function dialogueEligible(pat, beat, s, idx, prevSplit) {
  const segs = pat.segments;
  const dur = beat.dur_s;
  if (!s.multicut && segs.length > 1) return false;
  if (segs.includes('split') && !dialogueSplitWindow(beat, s, idx, prevSplit)) return false;
  if (segs.includes('insert')) return false;
  if (segs.length * s.min_cut_s > dur + 1e-9) return false;
  if (Math.max(...pat.weights.map((w) => w * dur)) > s.max_cut_s + 1e-9) return false;
  if (Math.min(...pat.weights.map((w) => w * dur)) < s.min_cut_s - 1e-9) return false;
  return true;
}

/** Index of the beat nearest to i spoken by `who` (ties go to the earlier one), or null. */
function dialogueNearestClip(beats, i, who) {
  let best = null;
  let bd = Infinity;
  for (let j = 0; j < beats.length; j++) {
    if (beats[j].who !== who) continue;
    const d = Math.abs(j - i);
    if (d < bd) {
      best = j;
      bd = d;
    }
  }
  return best;
}

/**
 * One full-frame single on the payoff beat. A beat longer than the ceiling
 * becomes two speaker cuts with the single as the second, so the emphasis
 * still lands at the end of the line. null when the beat cannot carry it.
 */
function dialoguePayoffPattern(dur, s) {
  if (dur <= s.max_cut_s + 1e-9) return { id: 'P', segments: ['speaker'], weights: [1.0], payoff_idx: 1 };
  const tail = Math.min(s.max_cut_s, dur - s.min_cut_s);
  if (tail < s.min_cut_s - 1e-9) return null;
  const head = dur - tail;
  return { id: 'P2', segments: ['speaker', 'speaker'], weights: [dialogueRound(head / dur, 9), dialogueRound(tail / dur, 9)], payoff_idx: 2 };
}

/** Every framing a cut may take, in a fixed order. Two options share a label only when they look the same. */
function dialogueFramingOptions(cut, s, hasProduct) {
  if (cut.mode === 'split') {
    const spk = cut.show || cut.speaker || '?';
    const opts = [];
    for (const seam of s.split.seams) {
      for (const bottom of s.split.bottom_sources) {
        if (bottom === 'listener' && cut.listener_clip_scene === null) continue;
        if (bottom === 'product' && !hasProduct) continue;
        opts.push({ framing: `split:${spk}:${seam.toFixed(2)}:${bottom}`, seam, bottom, crop: { ...s.crops.wide } });
      }
    }
    if (!opts.length) opts.push({ framing: `split:${spk}:0.62:listener`, seam: 0.62, bottom: 'listener', crop: { ...DIALOGUE_CROPS.wide } });
    return opts;
  }
  const who = cut.show || cut.speaker;
  const sizes = s.sizes.length ? s.sizes : ['wide'];
  return sizes.map((size) => ({ framing: `${who}:${size}`, size, crop: { ...(s.crops[size] || DIALOGUE_CROPS.wide) } }));
}

/** Least-used framing wins; ties rotate on arithmetic of the seed, never an RNG. */
function dialoguePick(cands, use, seed, ordinal) {
  let best = null;
  let bestKey = null;
  cands.forEach((c, i) => {
    const key = [use.get(c.framing) || 0, (seed * 31 + ordinal * 7 + i * 13) % 997, i];
    if (!bestKey || key[0] < bestKey[0] || (key[0] === bestKey[0] && (key[1] < bestKey[1] || (key[1] === bestKey[1] && key[2] < bestKey[2])))) {
      best = c;
      bestKey = key;
    }
  });
  return best;
}

function dialogueApplyFraming(cut, opt) {
  cut.framing = opt.framing;
  cut.crop = opt.crop;
  if (opt.size) cut.size = opt.size;
  if (cut.mode === 'split') {
    cut.seam = opt.seam;
    cut.bottom = opt.bottom;
    if (opt.bottom !== 'listener') {
      // the lower panel is not a host any more, so the cut stops claiming one
      cut.listener = null;
      cut.listener_clip_scene = null;
    }
  }
}

/** No two consecutive cuts share a framing, and the least-used framing is spent first. */
function dialogueAssignFramings(cuts, s, hasProduct) {
  const use = new Map();
  const picks = [];
  const bump = (f, d) => use.set(f, (use.get(f) || 0) + d);
  for (let i = 0; i < cuts.length; i++) {
    const c = cuts[i];
    let opts = dialogueFramingOptions(c, s, hasProduct);
    if (c.payoff) {
      const full = opts.filter((o) => o.framing.endsWith(':wide'));
      if (full.length) opts = full;
    }
    let prev = i ? picks[i - 1].framing : null;
    // A forced cut (the payoff) can collide with what the previous cut took.
    // The previous cut is the flexible one, so it moves.
    if (i && opts.every((o) => o.framing === prev)) {
      const pprev = i >= 2 ? picks[i - 2].framing : null;
      const alts = dialogueFramingOptions(cuts[i - 1], s, hasProduct).filter((o) => o.framing !== prev && o.framing !== pprev);
      if (alts.length) {
        bump(prev, -1);
        const alt = dialoguePick(alts, use, s.seed, i - 1);
        picks[i - 1] = alt;
        bump(alt.framing, 1);
        dialogueApplyFraming(cuts[i - 1], alt);
        prev = alt.framing;
      }
    }
    const cands = opts.filter((o) => o.framing !== prev);
    const chosen = dialoguePick(cands.length ? cands : opts, use, s.seed, i);
    picks.push(chosen);
    bump(chosen.framing, 1);
    dialogueApplyFraming(c, chosen);
  }
}

/** How many distinct framings, per 10 s of `totalS`, and the biggest one's share. */
export function dialogueFramingStats(cuts, totalS) {
  const use = new Map();
  for (const c of cuts) use.set(c.framing || '?', (use.get(c.framing || '?') || 0) + 1);
  let big = null;
  for (const [k, n] of use) if (!big || n > big[1] || (n === big[1] && k > big[0])) big = [k, n];
  return {
    n_framings: use.size,
    total_s: dialogueRound(totalS, 3),
    per_10s: totalS > 0 ? dialogueRound((use.size / totalS) * 10, 3) : 0,
    biggest: big ? big[0] : null,
    biggest_count: big ? big[1] : 0,
    biggest_share: cuts.length ? dialogueRound(big[1] / cuts.length, 4) : 0,
    use: Object.fromEntries([...use].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  };
}

/**
 * The cut plan. `beats` come from dialogueBeats, `hosts` are the two cast keys,
 * `settings` from dialogueSettings. Options: `products` (how many product
 * stills the split's lower panel may use; 0 drops the product bottom) and
 * `end_card_s` (counted in the runtime the framing rate is measured over, never
 * as a framing). Every cut covers [start_s, end_s) of the output; src_start_s
 * and src_end_s are its window inside the clip of scene `clip_scene`, measured
 * from that beat's start.
 */
export function dialoguePlan(beats, hosts, settings, { products = 0, end_card_s = 0 } = {}) {
  const s = settings;
  const pats = s.patterns;
  const seed = s.seed;
  let cursor = seed % pats.length;
  const hasProduct = products > 0;

  let payoffBeat = null;
  if (s.payoff === 'last' && beats.length) {
    const marked = beats.filter((b) => b.payoff);
    payoffBeat = marked.length ? marked.at(-1).n : beats.at(-1).n;
  }

  const cuts = [];
  const used = {};
  let prevPat = null;
  let prevSplit = 0;
  let nSplit = 0;
  let prevSingleWho = null;
  const splitByWho = new Map();

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const dur = b.dur_s;
    const who = b.who;
    const other = who === hosts[0] ? hosts[1] : hosts[0];

    let chosen = null;
    if (payoffBeat !== null && b.n === payoffBeat && nSplit > 0) chosen = dialoguePayoffPattern(dur, s);

    if (chosen === null) {
      let order = Array.from({ length: pats.length }, (_, k) => pats[(cursor + k) % pats.length]);
      // the beat before the payoff wants a split, so the payoff single reads as emphasis
      const beforePayoff = payoffBeat !== null && i + 1 < beats.length && beats[i + 1].n === payoffBeat;
      // the same host twice in a row as two plain singles is a freeze, not a cut
      const sameAsPrev = prevSingleWho !== null && who === prevSingleWho;
      // speaker and split alternation phase-lock; prefer a split for the host behind on them
      const behind = (splitByWho.get(who) || 0) < (splitByWho.get(other) || 0);
      const atCap = nSplit >= Math.max(1, dialogueRoundHalfEven(s.split.target_share * beats.length));
      const splitFirst = ((beforePayoff || sameAsPrev || behind) && !atCap) || dialogueSplitWindow(b, s, i, prevSplit);
      if (splitFirst) order = [...order.filter((p) => p.segments.includes('split')), ...order.filter((p) => !p.segments.includes('split'))];
      if (atCap && !(beforePayoff || sameAsPrev)) {
        const noSplit = order.filter((p) => !p.segments.includes('split'));
        if (noSplit.length) order = noSplit;
      }
      for (const p of order) {
        if (!dialogueEligible(p, b, s, i, prevSplit)) continue;
        // a pattern does not run twice in a row, unless the alternative is a freeze
        if (p.id === prevPat && !(beforePayoff || sameAsPrev || behind) && order.some((q) => q.id !== prevPat && dialogueEligible(q, b, s, i, prevSplit))) continue;
        chosen = p;
        break;
      }
    }
    if (chosen === null) chosen = { id: 'A', segments: ['speaker'], weights: [1.0] };
    cursor = (cursor + 1) % pats.length;
    used[chosen.id] = (used[chosen.id] || 0) + 1;
    const hasSplit = chosen.segments.includes('split');
    prevSplit = hasSplit ? prevSplit + 1 : 0;
    if (hasSplit) splitByWho.set(who, (splitByWho.get(who) || 0) + 1);
    prevSingleWho = hasSplit ? null : who;
    prevPat = chosen.id;
    nSplit += chosen.segments.filter((x) => x === 'split').length;

    // lay the segments across the beat, exactly filling it
    const raw = chosen.weights.map((w) => dur * w);
    raw[raw.length - 1] = dialogueRound(dur - raw.slice(0, -1).reduce((a, x) => a + x, 0));
    const lst = dialogueNearestClip(beats, i, other);
    const payIdx = chosen.payoff_idx;

    let off = 0;
    chosen.segments.forEach((kind, k) => {
      const seglen = raw[k];
      const cut = {
        beat: b.n,
        scene_id: b.id,
        idx: k + 1,
        pattern: chosen.id,
        start_s: dialogueRound(b.start_s + off),
        end_s: dialogueRound(b.start_s + off + seglen),
        speaker: who,
        src_start_s: dialogueRound(off),
        src_end_s: dialogueRound(off + seglen),
      };
      if (payIdx === k + 1) cut.payoff = true;
      if (kind === 'speaker') {
        Object.assign(cut, { mode: 'single', source: 'clip', show: who, clip_scene: b.id });
      } else if (kind === 'listener') {
        if (lst === null) {
          Object.assign(cut, { mode: 'reaction', source: 'still', show: other, clip_scene: null });
        } else {
          const lb = beats[lst];
          // a seeded point inside the listener's clip, kept off its edges
          const pick = ((seed + b.n * 7 + k) % 5) / 6.0 + 0.08;
          const ls = dialogueRound(Math.min(Math.max(0, lb.dur_s - seglen), pick * lb.dur_s));
          Object.assign(cut, { mode: 'reaction', source: 'clip_muted', show: other, clip_scene: lb.id, src_start_s: ls, src_end_s: dialogueRound(ls + seglen) });
        }
      } else if (kind === 'split') {
        Object.assign(cut, { mode: 'split', source: 'clip', show: who, clip_scene: b.id, listener: other, listener_clip_scene: lst === null ? null : beats[lst].id, layout: 'vstack' });
      }
      cuts.push(cut);
      off += seglen;
    });
  }

  dialogueAssignFramings(cuts, s, hasProduct);

  // What the lower panel plays: the listener's idle clip at a different window
  // each cut (deterministic on the cut ordinal), the listener's nearest clip
  // from its head, or the next product still in turn.
  let productTurn = 0;
  cuts.forEach((c, k) => {
    if (c.mode !== 'split') return;
    if (c.bottom === 'product') {
      c.product = productTurn % Math.max(1, products);
      productTurn += 1;
    } else if (s.split.listener_source === 'idle') {
      const seg = c.end_s - c.start_s;
      const span = Math.max(0, s.split.idle_seconds - seg);
      c.listener_source = 'idle';
      c.bottom_start_s = span > 0.05 ? dialogueRound((k * 1.73) % span, 3) : 0;
    } else {
      c.listener_source = 'clip';
      c.bottom_start_s = 0;
    }
  });

  const dialogue_s = beats.length ? beats.at(-1).end_s - beats[0].start_s : 0;
  return {
    mode: s.mode,
    seed,
    dialogue_s: dialogueRound(dialogue_s, 3),
    end_card_s,
    n_beats: beats.length,
    n_cuts: cuts.length,
    avg_cut_s: dialogueRound(dialogue_s / Math.max(1, cuts.length), 3),
    pattern_use: used,
    framing_stats: dialogueFramingStats(cuts, dialogue_s + end_card_s),
    cuts,
  };
}

/**
 * The plan's self-checks, each 'check_id: message'. An empty list is a pass.
 * Correctness checks always run: the picture covers each line's audio and tiles
 * the whole timeline, no cut under the floor, a split shows two different
 * hosts, the speaker is full frame only from its own clip, a reaction shows the
 * listener from the listener's own clip, and a split's lower panel has a picture
 * (a product still, or a clip of the listener when listener_source is clip).
 * Outside plain mode: the cut ceiling and no held picture across a cut. With a
 * split: the balance of who is on top. In dynamic mode: the framing band.
 * (Render drift is the compose's check, on the rendered file.)
 */
export function dialoguePlanProblems(plan, beats, hosts, settings, { products = 0 } = {}) {
  const out = [];
  const fail = (id, msg) => out.push(`${id}: ${msg}`);
  const s = settings;
  const cuts = plan.cuts || [];
  if (!cuts.length) {
    fail('cutplan_nonempty', 'no cuts planned');
    return out;
  }
  const beatOf = new Map(beats.map((b) => [b.id, b]));

  // the picture covers each line's audio exactly
  for (const b of beats) {
    const got = cuts.filter((c) => c.scene_id === b.id).reduce((a, c) => a + (c.end_s - c.start_s), 0);
    if (Math.abs(got - b.dur_s) > 0.012) fail('cutplan_covers_vo', `scene ${b.id}: picture covers ${got.toFixed(3)} s of ${b.dur_s.toFixed(3)} s of audio`);
  }
  // cuts inside a line tile it, and the cuts tile the whole timeline in order
  for (const b of beats) {
    const bc = cuts.filter((c) => c.scene_id === b.id).sort((x, y) => x.start_s - y.start_s);
    for (let i = 1; i < bc.length; i++) {
      if (Math.abs(bc[i - 1].end_s - bc[i].start_s) > 1e-6) fail('cutplan_tiles_beat', `scene ${b.id}: gap or overlap at ${bc[i - 1].end_s.toFixed(3)} -> ${bc[i].start_s.toFixed(3)}`);
    }
  }
  if (Math.abs(cuts[0].start_s - beats[0].start_s) > 1e-6) fail('cutplan_tiles_timeline', `the first cut starts at ${cuts[0].start_s} s, not ${beats[0].start_s} s`);
  for (let i = 1; i < cuts.length; i++) {
    if (Math.abs(cuts[i - 1].end_s - cuts[i].start_s) > 1e-6) fail('cutplan_tiles_timeline', `cuts ${i} and ${i + 1}: gap or overlap at ${cuts[i - 1].end_s} -> ${cuts[i].start_s}`);
  }
  if (Math.abs(cuts.at(-1).end_s - beats.at(-1).end_s) > 1e-6) fail('cutplan_tiles_timeline', `the last cut ends at ${cuts.at(-1).end_s} s, not ${beats.at(-1).end_s} s`);

  // no cut under the floor: it reads as a flicker
  for (const c of cuts) {
    if (c.end_s - c.start_s < s.min_cut_s - 1e-6) fail('cutplan_min_cut', `scene ${c.scene_id} cut ${c.idx}: ${(c.end_s - c.start_s).toFixed(3)} s < ${s.min_cut_s} s floor`);
  }
  // a split shows two different hosts, unless its lower panel is a product
  for (const c of cuts) {
    if (c.mode !== 'split') continue;
    if (c.listener === c.speaker) fail('split_two_distinct_hosts', `scene ${c.scene_id}: the split shows ${c.speaker} twice`);
    else if ((c.bottom || 'listener') === 'listener') {
      if (!hosts.includes(c.listener)) fail('split_two_distinct_hosts', `scene ${c.scene_id}: listener ${JSON.stringify(c.listener)} is not a host`);
    } else if (c.listener !== null && c.listener !== undefined) {
      fail('split_two_distinct_hosts', `scene ${c.scene_id}: the lower panel is ${c.bottom} but the cut still names listener ${c.listener}`);
    }
    if (c.bottom === 'product' && !(products > 0)) fail('split_bottom_assets', `scene ${c.scene_id}: the lower panel is a product and there is no product still`);
    if ((c.bottom || 'listener') === 'listener' && s.split.listener_source === 'clip' && !c.listener_clip_scene) {
      fail('split_bottom_assets', `scene ${c.scene_id}: the lower panel is ${c.listener} from their own clip, and ${c.listener} speaks no line`);
    }
  }
  // the speaker full frame only from its own clip; a reaction shows the listener from the listener's clip
  for (const c of cuts) {
    if ((c.mode === 'single' || c.mode === 'split') && (c.source !== 'clip' || c.clip_scene !== c.scene_id || c.show !== c.speaker)) {
      fail('speaker_cut_is_lipsynced', `scene ${c.scene_id} cut ${c.idx}: shows ${c.show} from ${c.source} of scene ${c.clip_scene}, so the mouth would not track the audio`);
    }
    if (c.mode === 'reaction') {
      if (c.show === c.speaker) fail('reaction_cut_shows_listener', `scene ${c.scene_id} cut ${c.idx}: the reaction shows the speaker, not the listener`);
      else if (c.clip_scene !== null && beatOf.get(c.clip_scene)?.who !== c.show) fail('reaction_cut_shows_listener', `scene ${c.scene_id} cut ${c.idx}: the reaction of ${c.show} plays scene ${c.clip_scene}, which is not theirs`);
    }
  }

  const plain = !(s.multicut || s.split.enabled);
  if (!plain) {
    for (const c of cuts) {
      if (c.end_s - c.start_s > s.max_cut_s + 1e-6) fail('cutplan_max_cut', `scene ${c.scene_id} cut ${c.idx}: ${(c.end_s - c.start_s).toFixed(3)} s > ${s.max_cut_s} s ceiling`);
    }
    // the same host at the same framing on both sides of a cut reads as a freeze
    for (let i = 1; i < cuts.length; i++) {
      const a = cuts[i - 1];
      const b = cuts[i];
      if (a.mode === 'single' && b.mode === 'single' && a.show === b.show && a.framing === b.framing) {
        fail('cutplan_no_repeat_still', `cuts ${a.scene_id}.${a.idx} and ${b.scene_id}.${b.idx} both hold ${a.show} at ${a.framing}; that reads as a freeze, not a cut`);
      }
    }
  }

  // both hosts get the split: speaker and split alternation phase-lock otherwise
  if (s.split.enabled) {
    const splits = cuts.filter((c) => c.mode === 'split');
    if (splits.length >= 4) {
      const byHost = new Map();
      for (const c of splits) byHost.set(c.show || c.speaker, (byHost.get(c.show || c.speaker) || 0) + 1);
      if (byHost.size < 2) fail('split_balance', `all ${splits.length} split cuts put ${[...byHost.keys()][0]} on top; the other host is never the speaker in a split`);
      else {
        const [top, n] = [...byHost].sort((x, y) => y[1] - x[1])[0];
        if (n / splits.length > 0.75 + 1e-9) fail('split_balance', `host ${top} is on top in ${n} of ${splits.length} split cuts (${Math.round((n / splits.length) * 100)}%), over the 75% ceiling`);
      }
    }
  }

  // the framing band measures a dynamic edit; plain and split are declared calm edits
  if (s.multicut) {
    const naked = cuts.filter((c) => !c.framing);
    if (naked.length) {
      fail('framing_declared', `${naked.length} of ${cuts.length} cuts carry no framing`);
      return out;
    }
    for (const c of cuts) {
      const { x, y, w, h } = c.crop || {};
      if (!(x >= 0 && y >= 0 && w > 0 && w <= 1 && h > 0 && h <= 1 && x + w <= 1 + 1e-9 && y + h <= 1 + 1e-9)) {
        fail('framing_crop_in_frame', `cut ${c.scene_id}.${c.idx} framing ${c.framing} crops x=${x} y=${y} w=${w} h=${h}, which leaves the picture`);
      }
    }
    const total = (plan.dialogue_s || 0) + (plan.end_card_s || 0);
    if (!(total > 0)) {
      fail('framing_declared', 'the plan declares no runtime to measure over');
      return out;
    }
    const st = dialogueFramingStats(cuts, total);
    const { per_10s_min: lo, per_10s_max: hi, max_share: cap } = s.bands;
    const per10 = (st.n_framings / total) * 10;
    if (per10 < lo - 1e-9 || per10 > hi + 1e-9) fail('framing_variety_per_10s', `${st.n_framings} distinct framings over ${total.toFixed(2)} s is ${per10.toFixed(2)} per 10 s, outside ${lo} to ${hi}`);
    if (st.biggest_count / cuts.length > cap + 1e-9) fail('framing_biggest_share', `framing ${st.biggest} takes ${st.biggest_count} of ${cuts.length} cuts (${((st.biggest_count / cuts.length) * 100).toFixed(1)}%), over the ${cap * 100}% ceiling`);
    for (let i = 1; i < cuts.length; i++) {
      if (cuts[i - 1].framing === cuts[i].framing) fail('framing_no_repeat_adjacent', `cuts ${cuts[i - 1].scene_id}.${cuts[i - 1].idx} and ${cuts[i].scene_id}.${cuts[i].idx} both use ${cuts[i].framing}`);
    }
  }
  return out;
}
