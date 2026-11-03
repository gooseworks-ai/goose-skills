// assemble 1.2.0's pure helpers for shot recipes: which recipe a scene uses (by its tag), how a
// scene's time is split between its shots, where a cut moves to land between two words, how a
// montage's frames share its time, the zoom filter, and where the card span starts (card_from).
// No ffmpeg and no files here, so the tests check the arithmetic directly.
// Every top-level name starts with `assemble` (bundled modules share one namespace).
import { kitNamedProducts, kitSceneTag, kitTagKey } from '../../_lib/scene-match.mjs';
import { assembleNo } from './cuts.mjs';

/** The shortest time the fill shot keeps when a scene's fixed shots are squeezed. */
export const ASSEMBLE_MIN_FILL_S = 0.5;

/** The recipe key that catches scenes whose tag has no recipe of its own. */
export const ASSEMBLE_ANY_TAG = '*';

/**
 * The shot recipe for a scene: the one whose key is the scene's tag (compared without case or
 * spacing: "Close up" = "close-up"), else the `*` recipe, else null.
 * @returns {null | {key: string, tag: string | null, shots: object[]}}
 */
export function assembleRecipeFor(shots, scene) {
  const tag = kitSceneTag(scene);
  const want = tag ? kitTagKey(tag) : '';
  for (const [key, list] of Object.entries(shots || {})) {
    if (key !== ASSEMBLE_ANY_TAG && want && kitTagKey(key) === want) return { key, tag, shots: list };
  }
  if (shots && Array.isArray(shots[ASSEMBLE_ANY_TAG])) return { key: ASSEMBLE_ANY_TAG, tag, shots: shots[ASSEMBLE_ANY_TAG] };
  return null;
}

/**
 * How a scene's `frames` are split between its shots. Each spec is `{fixed: frames | null, fill}`.
 * The fill shot (the one with fill, else the last) takes what the others leave. When the fixed shots
 * leave the fill shot less than `min_fill` frames, they are all squeezed by the same factor; a scene
 * too short for one frame per shot is refused.
 * @returns {number[]} frames per shot, summing to `frames`
 */
export function assembleShotLengths(specs, frames, { min_fill, scene_id }) {
  const fills = specs.map((s, i) => (s.fill ? i : -1)).filter((i) => i >= 0);
  if (fills.length > 1) throw assembleNo(`scene "${scene_id}": only one shot in a recipe can fill`);
  const fillAt = fills.length ? fills[0] : specs.length - 1;
  const fixed = specs.map((s, i) => {
    if (i === fillAt) return 0;
    if (!(s.fixed >= 1)) throw assembleNo(`scene "${scene_id}": shot ${i + 1} needs seconds (only the fill shot takes the rest)`);
    return s.fixed;
  });
  const sum = fixed.reduce((a, b) => a + b, 0);
  if (frames < specs.length) throw assembleNo(`scene "${scene_id}" is ${frames} frame(s), too short for ${specs.length} shots`);
  const keep = Math.min(min_fill, frames - (specs.length - 1));
  let lengths = fixed;
  if (frames - sum < keep) {
    const k = (frames - keep) / sum;
    lengths = fixed.map((f, i) => (i === fillAt ? 0 : Math.max(1, Math.floor(f * k))));
  }
  const used = lengths.reduce((a, b) => a + b, 0);
  lengths[fillAt] = frames - used;
  if (lengths[fillAt] < 1) throw assembleNo(`scene "${scene_id}" is too short for its shots`);
  return lengths;
}

/**
 * A montage of `n` frames in `total` frames, each joined to the next by a `t`-frame transition:
 * the frames' lengths (sum(lengths) - (n - 1) * t = total) and the transition actually used
 * (0 when the pieces are too short to overlap).
 */
export function assembleMontageLengths(total, n, t) {
  let overlap = n > 1 ? Math.max(0, Math.round(t)) : 0;
  const share = (tt) => {
    const all = total + (n - 1) * tt;
    const base = Math.floor(all / n);
    const extra = all - base * n;
    return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
  };
  let lengths = share(overlap);
  if (overlap && lengths.some((l) => l <= overlap + 1)) {
    overlap = 0;
    lengths = share(0);
  }
  if (lengths.some((l) => l < 1)) throw assembleNo(`a montage of ${n} frames needs at least ${n} frames`);
  return { lengths, overlap };
}

/**
 * A clip shot's speed limits [slowest, fastest]. A missing limit is 1, unless the given one is on its
 * side of 1: min_speed 1.2 alone is [1.2, 1.2], max_speed 0.8 alone is [0.8, 0.8]. The caller refuses
 * slowest > fastest.
 */
export function assembleSpeedBounds(spec) {
  const lo = spec.min_speed ?? Math.min(1, spec.max_speed ?? 1);
  const hi = spec.max_speed ?? Math.max(1, lo);
  return [lo, hi];
}

/** Every word of the speech, in time order: `{start_s, end_s}`. Entries without words are skipped. */
export function assembleWords(speech) {
  const out = [];
  for (const s of speech || []) {
    for (const w of Array.isArray(s.words) ? s.words : []) {
      if (Number.isFinite(w.start_s) && Number.isFinite(w.end_s) && w.end_s > w.start_s) out.push({ start_s: w.start_s, end_s: w.end_s });
    }
  }
  return out.sort((a, b) => a.start_s - b.start_s);
}

/**
 * Cut points (frame numbers, in order, inside the body) moved out of words. A cut that lands inside a
 * word moves to the frame at or before the word starts, or at or after it ends, whichever is nearer,
 * when that is at most `max_shift_s` away and both shots either side keep `min_shot_s` (or what they
 * had, when they were shorter already). Otherwise it stays.
 * @returns {number[]} the cut points, same length and order
 */
export function assembleSnapCuts(cuts, words, { fps, max_shift_s, min_shot_s, end_f }) {
  const maxShift = max_shift_s * fps + 1e-6;
  const minShot = Math.round(min_shot_s * fps);
  const out = [];
  for (let i = 0; i < cuts.length; i++) {
    const b = cuts[i];
    const prev = i ? out[i - 1] : 0;
    const next = i + 1 < cuts.length ? cuts[i + 1] : end_f;
    const t = b / fps;
    const word = words.find((w) => w.start_s * fps < b - 1e-6 && b < w.end_s * fps - 1e-6 && t > w.start_s && t < w.end_s);
    if (!word) {
      out.push(b);
      continue;
    }
    const needLeft = Math.min(minShot, b - prev);
    const needRight = Math.min(minShot, next - b);
    const options = [Math.floor(word.start_s * fps + 1e-6), Math.ceil(word.end_s * fps - 1e-6)]
      .filter((c) => c !== b && Math.abs(c - b) <= maxShift && c - prev >= Math.max(1, needLeft) && next - c >= Math.max(1, needRight))
      .sort((x, y) => Math.abs(x - b) - Math.abs(y - b) || x - y);
    out.push(options.length ? options[0] : b);
  }
  return out;
}

/**
 * A picture fitted at twice the size, then zoomed centred from `from` to `to` over `frames` output
 * frames. `per_input` 1 (a looped still, one output frame per input frame) or `frames` (one frame
 * held for the whole shot).
 */
export function assembleZoom(w, h, fps, frames, from, to, fitChain, { per_input = 1 } = {}) {
  const last = Math.max(1, frames - 1);
  const step = Math.abs(to - from) / last;
  const z = from === to ? `'${from}'` : from < to ? `'min(${from}+${step.toFixed(8)}*on,${to})'` : `'max(${from}-${step.toFixed(8)}*on,${to})'`;
  return `${fitChain},zoompan=z=${z}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${per_input}:s=${w}x${h}:fps=${fps},setsar=1`;
}

/**
 * The scene a card span starts at: card_from {scene_id} names it; {tag} finds the first scene with
 * that tag. Null when a tag matches no scene (the plan has no such scene); a scene id that is not in
 * the plan is refused.
 */
export function assembleCardScene(cardFrom, scenes) {
  if (!cardFrom) return null;
  const list = scenes || [];
  if (cardFrom.scene_id != null) {
    const id = String(cardFrom.scene_id);
    if (!list.some((s) => String(s.id) === id)) throw assembleNo(`card_from names scene "${id}", which is not in the plan`);
    return id;
  }
  const want = kitTagKey(cardFrom.tag);
  const hit = list.find((s) => kitTagKey(kitSceneTag(s)) === want);
  return hit ? String(hit.id) : null;
}

/**
 * The product a scene shows: the first one its picture names, else the first its line names, else the
 * product at the scene's place among the scenes with its tag (the plan's "one per product, in order").
 */
export function assembleSceneProduct(scene, products, ordinal) {
  const list = Array.isArray(products) ? products : [];
  const named = kitNamedProducts(scene, list);
  if (named.length) return { product: named[0], how: 'picture' };
  if (scene && typeof scene.line === 'string') {
    const byLine = kitNamedProducts({ picture: scene.line }, list);
    if (byLine.length) return { product: byLine[0], how: 'line' };
  }
  if (ordinal >= 0 && ordinal < list.length) return { product: list[ordinal], how: 'order' };
  return null;
}
