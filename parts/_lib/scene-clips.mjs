// One moving clip per still, for image-to-video parts (video-kling 1.0.0, then
// video-veo-3): which stills move, each clip's prompt, how long each clip is,
// the keep window, and when a failed clip may fall back to its still. The part
// itself orders the pieces (the lint reads every paid call from the part's own
// source), in this order:
//
//   const tpl = kitClipTemplate(inputs.template ? await kitLoadTemplate(inputs.template) : null)
//   const jobs = kitClipJobs(tpl, {mode, stills, scenes, pick, skip_first, skip_last, look, answers, brand, cast, products, use})
//   const slots = kitClipSlots(jobs, spans)              // scenes mode with spans: seconds on screen per scene
//   per job: seconds = kitClipSeconds(slot or wanted, allowed, {min_s, max_s}).seconds
//   per job: order the piece; on an error, kitClipMayFallBack(err, {last_attempt}) says whether
//            the still stands in; a keep window is kitClipWindow(...) cut by kitClipTrim(...)
//
// Everything before the first order is pure, so a scene the template cannot
// fill, or a scene with no still, refuses the whole step before any piece is
// bought.
//
// Clip length (scenes mode with spans, from a voice or a song): each clip is on
// screen the way assemble 1.1.0 cuts it. A scene with a span runs from its
// span's start (the first from 0, unless a span this part does not make comes
// before it) to the next spanned scene's start (the last to its span's end
// plus KIT_CLIP_TAIL_S); a scene with no span (no line)
// shares the spanned scene before it evenly (share_previous; scenes before the
// first spanned one share with it). The clip is then ceil(on screen + 0.2) s,
// rounded up to the model's allowed lengths and kept inside min_s..max_s. A
// clip that cannot be long enough is the longest allowed; assemble holds its
// last frame.
//
// Bundled into parts; every top-level name starts with `kitClip` or `KIT_CLIP`.
import { join } from 'node:path';
import { kitFfmpeg, kitNum } from './part.mjs';
import { kitScenePrompt } from './prompt.mjs';
import { kitPickScenes } from './scene-match.mjs';

/** The margin added to a scene's time on screen before rounding up to a whole clip length. */
export const KIT_CLIP_MARGIN_S = 0.2;
/** The hold after the last span: assemble 1.1.0's default tail_s. */
export const KIT_CLIP_TAIL_S = 0.25;
/** The motion text used when the style gives no template, or a template without a motion text. */
export const KIT_CLIP_DEFAULT_MOTION = '{picture?}. Subtle, natural motion. Steady camera, no zoom, no morphing, no new objects, no text';
/** How many clips are made at once. */
export const KIT_CLIP_AT_ONCE = 4;

/**
 * The template a part fills: the style's (already checked by kitLoadTemplate),
 * or an empty version 1 template. A template without a motion text gets
 * KIT_CLIP_DEFAULT_MOTION.
 */
export function kitClipTemplate(tpl) {
  const base = tpl && typeof tpl === 'object' ? tpl : { version: 1 };
  return typeof base.motion === 'string' ? base : { ...base, motion: KIT_CLIP_DEFAULT_MOTION };
}

/**
 * The clips to make, in order, each with its still and prompt:
 * [{id, index, scene, still, prompt, negative, tag}].
 *
 * - scenes mode: the picked plan scenes (kitPickScenes with pick, skip_first,
 *   skip_last); each needs the still whose id is its scene id.
 * - images mode: one clip per still, id = the still's id. The prompt is filled
 *   for the plan scene with that id when `scenes` has one, else for a bare
 *   scene {id} (with speaker = id when a cast member has that key, so an
 *   anchor still fills {speaker.name}).
 *
 * `use` picks the text: 'motion' (default) or a key of the template's
 * `templates`. Throws KitPromptGap for a scene the template cannot fill, and
 * Error for anything else wrong (a missing still, two stills with one id).
 */
export function kitClipJobs(tpl, options = {}) {
  const { mode = 'scenes', stills = [], scenes = [], use = 'motion' } = options;
  const base = { look: options.look ?? null, answers: options.answers ?? null, brand: options.brand ?? null, cast: options.cast || [], products: options.products || [] };
  const byId = new Map();
  for (const s of stills) {
    const id = String(s.id);
    if (byId.has(id)) throw new Error(`two stills have the id ${id}`);
    byId.set(id, s.image);
  }
  let picked;
  if (mode === 'images') {
    const plan = new Map((scenes || []).filter((s) => s && s.id != null).map((s) => [String(s.id), s]));
    const keys = new Set((base.cast || []).map((m) => m && m.key));
    picked = stills.map((s, index) => {
      const id = String(s.id);
      const scene = plan.get(id) || (keys.has(id) ? { id, speaker: id } : { id });
      return { scene, index };
    });
  } else {
    picked = kitPickScenes(scenes, options.pick, { skip_first: options.skip_first, skip_last: options.skip_last });
    for (const { scene, index } of picked) {
      const id = scene && scene.id != null ? String(scene.id) : `#${index + 1}`;
      if (!byId.has(id)) {
        throw new Error(`scene ${id} has no still: the stills must be keyed by scene id and cover every picked scene (match pick, skip_first and skip_last with the stills step)`);
      }
    }
  }
  return picked.map(({ scene, index }) => {
    const id = String(scene.id);
    const out = kitScenePrompt(tpl, { ...base, scene, index }, { use });
    return { id, index, scene, still: byId.get(id), prompt: out.prompt, negative: out.negative, tag: out.tag };
  });
}

/**
 * How long each job's scene is on screen, from the voice's or song's spans
 * ([{id, start_s, end_s}]), the way assemble 1.1.0 cuts it (see the header).
 * Returns a Map of job id -> seconds. Throws when a span is named twice or ends
 * before it starts, or when no job has a span.
 */
export function kitClipSlots(jobs, spans, { tail_s = KIT_CLIP_TAIL_S } = {}) {
  const byId = new Map();
  for (const s of spans || []) {
    const id = String(s.id);
    if (byId.has(id)) throw new Error(`spans name scene ${id} twice`);
    if (!(s.end_s >= s.start_s)) throw new Error(`span ${id} ends before it starts`);
    byId.set(id, s);
  }
  const groups = [];
  const lead = [];
  for (const j of jobs) {
    const span = byId.get(j.id);
    if (span) groups.push({ span, members: groups.length ? [j.id] : [...lead, j.id] });
    else if (groups.length) groups[groups.length - 1].members.push(j.id);
    else lead.push(j.id);
  }
  if (!groups.length) throw new Error('no picked scene has a span: the spans must name the scene ids');
  const starts = [...byId.values()].map((s) => s.start_s).sort((a, b) => a - b);
  const out = new Map();
  groups.forEach((g, gi) => {
    // The first group starts at 0 only when it is the cut's first: a span this
    // part does not make (a hook made by another step, left out with
    // skip_first) runs before it, and the group then starts at its own span.
    const start = gi === 0 && !starts.some((t) => t < g.span.start_s) ? 0 : g.span.start_s;
    let end;
    if (gi + 1 < groups.length) end = groups[gi + 1].span.start_s;
    else {
      // The last spanned scene runs to the next span (an end card scene this part does not make), else to its own end plus the tail.
      const next = starts.find((t) => t > g.span.start_s);
      end = next != null ? next : g.span.end_s + tail_s;
    }
    const each = Math.max(0, end - start) / g.members.length;
    for (const id of g.members) out.set(id, each);
  });
  return out;
}

/**
 * The allowed lengths inside min_s..max_s, smallest first. Throws when none is.
 */
export function kitClipAllowed(allowed, { min_s = null, max_s = null } = {}) {
  if (min_s != null && max_s != null && min_s > max_s) throw new Error(`min_s ${min_s} is over max_s ${max_s}`);
  const out = [...allowed]
    .filter((a) => (min_s == null || a >= min_s - 1e-9) && (max_s == null || a <= max_s + 1e-9))
    .sort((a, b) => a - b);
  if (!out.length) throw new Error(`no clip length between ${min_s ?? 'any'} and ${max_s ?? 'any'} s: the model makes ${[...allowed].join(', ')} s`);
  return out;
}

/**
 * A clip's length for a scene on screen `need_s` seconds: ceil(need_s +
 * margin) rounded up to an allowed length inside min_s..max_s. With
 * `exact: true` (a length the style asked for) no margin is added. Returns
 * {seconds, short}: short when even the longest allowed length is under what
 * was wanted (assemble then holds the clip's last frame).
 */
export function kitClipSeconds(need_s, allowed, { min_s = null, max_s = null, margin_s = KIT_CLIP_MARGIN_S, exact = false } = {}) {
  const ok = kitClipAllowed(allowed, { min_s, max_s });
  const want = Math.ceil(Math.max(0, Number(need_s) || 0) + (exact ? 0 : margin_s) - 1e-9);
  const hit = ok.find((a) => a >= want - 1e-9);
  return hit != null ? { seconds: hit, short: false } : { seconds: ok[ok.length - 1], short: true };
}

/**
 * The part of a clip to keep: `keep.seconds` from its start or its end
 * (anchor 'start' | 'end'). Returns {in_s, seconds}; the whole clip when it is
 * not longer than the window.
 */
export function kitClipWindow(clip_s, keep) {
  const want = Number(keep && keep.seconds);
  if (!(want > 0) || !(clip_s > want)) return { in_s: 0, seconds: clip_s };
  return keep.anchor === 'end' ? { in_s: clip_s - want, seconds: want } : { in_s: 0, seconds: want };
}

/** Cuts `window` ({in_s, seconds}) out of a clip, without sound, into workDir/`name`; returns its FileRef. */
export async function kitClipTrim(ctx, file, window, name) {
  await kitFfmpeg(ctx, ['-ss', kitNum(window.in_s, 3), '-i', file.path, '-t', kitNum(window.seconds, 3), '-map', '0:v:0', '-an', ...ctx.tools.encodeArgs('h264-intermediate'), join(ctx.workDir, name)]);
  return ctx.file(name, 'video');
}

/**
 * Whether a failed clip may become its still (fallback 'still'): a policy
 * refusal (provider_rejected) always; a provider failure or timeout only on the
 * step's last attempt, so the core's own retry runs first. Never a stop, a
 * refused input or an over-quote.
 */
export function kitClipMayFallBack(err, { last_attempt = true } = {}) {
  const code = err && err.code;
  if (code === 'provider_rejected') return true;
  if (code === 'provider_failed' || code === 'timeout') return Boolean(last_attempt);
  return false;
}

/** Runs `work` over `items`, a few at a time, keeping their order. After one failure no lane starts another item. */
export async function kitClipEach(items, work, at_once = KIT_CLIP_AT_ONCE) {
  const out = new Array(items.length);
  let next = 0;
  let failed = false;
  const lanes = Array.from({ length: Math.min(Math.max(1, at_once), items.length) }, async () => {
    while (next < items.length && !failed) {
      const i = next++;
      try {
        out[i] = await work(items[i], i);
      } catch (err) {
        failed = true;
        throw err;
      }
    }
  });
  await Promise.all(lanes);
  return out;
}
