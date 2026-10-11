// One still per plan scene, for image parts (image-nano-banana 1.1.0, then
// image-gpt-image-2): which scenes get a still, each scene's prompt and
// references, the cast portraits ("anchors") the scenes need, the anchor strip,
// and the part's scene-keyed outputs. The part itself orders the pieces (the
// lint reads every paid call from the part's own source), in this order:
//
//   const tpl = kitStillTemplate(await kitLoadTemplate(inputs.template))   // or kitStillTemplate(null)
//   const jobs = kitStillJobs(tpl, inputs.scenes, {pick, skip_first, skip_last, look, answers, cast, products, brand, multi_ref})
//   for each kitStillAnchorMembers(jobs) without an image: kitStillAnchorPrompt(tpl, member, ctx) -> draw it
//   per job: cast = kitStillCastFiles(job, anchors); one strip when kitStillWantsStrip(job, cast) (kitStillStrip)
//            refs = kitStillRefs(job, {cast, first, style_refs}); prompt = kitStillPrompt(job, refs)
//   return kitStillOutputs({scenes, cast, jobs, stills, anchors})
//
// Everything before the first order is pure, so a scene the template cannot
// fill refuses the whole step before any piece is bought.
//
// References per scene, in this order, at most 10 (KIT_STILL_MAX_REFS):
//   1. the named cast members' anchors: up to 3 separate pictures, or, when
//      the scene names more than one member and multi_ref is not 'list', one
//      strip of all of them (up to 10) side by side (nano-banana/edit flattens
//      several character references into one average shape; a strip keeps
//      each silhouette, measured 2026-10-01);
//   2. the first photo of each named product;
//   3. the scene's own picture file (scene.image, else a file picture);
//   4. the first scene's still (anchor: 'first_scene');
//   5. the style's reference pictures (style_refs).
// Which of 1-3 a scene sends follows the template's refs (and its by_tag
// rule); when the list is too long, 1-3 give way so 4 and 5 always fit.
//
// Bundled into parts; every top-level name starts with `kitStill` or `KIT_STILL`.
import { join } from 'node:path';
import { kitFfmpeg } from './part.mjs';
import { kitAnchorPrompt, kitPromptJoin, kitScenePrompts } from './prompt.mjs';
import { kitNamedCast, kitPickScenes } from './scene-match.mjs';

export const KIT_STILL_MAX_REFS = 10;
export const KIT_STILL_MAX_STRIP = 10;
/** The anchor text used when the style's template has none: no room and no lighting, so neither bakes into every scene. */
export const KIT_STILL_DEFAULT_ANCHOR = '{look}. One character alone, chest up, facing the camera, on a plain light grey background, flat even light, no text, no room, no props';

function kitStillIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

function kitStillName(member) {
  const name = member && typeof member.name === 'string' ? member.name.trim() : '';
  return name || String((member && member.key) || 'one character');
}

/**
 * The template a part fills: the style's (already checked by kitLoadTemplate),
 * or an empty version 1 template whose scene text is "{picture}". A template
 * without an anchor text gets KIT_STILL_DEFAULT_ANCHOR.
 */
export function kitStillTemplate(tpl) {
  const base = tpl && typeof tpl === 'object' ? tpl : { version: 1 };
  return typeof base.anchor === 'string' ? base : { ...base, anchor: KIT_STILL_DEFAULT_ANCHOR };
}

/**
 * The stills a step makes, one job per picked scene, prompts filled. `options`:
 * {pick, skip_first, skip_last, look, answers, cast, products, brand, multi_ref}.
 * A job is {id, index, scene, prompt, negative, tag, cast, strip, products, scene_image}:
 *   cast        the members whose anchors the scene sends (speaker first);
 *   strip       true when those go as one strip (more than one member, multi_ref not 'list');
 *   products    the named products whose first photo the scene sends;
 *   scene_image the scene's own picture file, or null.
 * Throws KitPromptGap (a scene the template cannot fill, a banned phrase) or an
 * Error (a bad pick, two scenes with one id) before anything is ordered.
 */
export function kitStillJobs(tpl, scenes, options = {}) {
  const { pick = 'all', skip_first = 0, skip_last = 0, look = null, answers = null, cast = [], products = [], brand = null, multi_ref } = options;
  const picked = kitPickScenes(scenes, pick, { skip_first, skip_last });
  const prompts = kitScenePrompts(tpl, picked, { look, answers, cast: cast || [], products: products || [], brand });
  const seen = new Set();
  return prompts.map((p) => {
    if (seen.has(p.id)) throw new Error(`two scenes have the id ${p.id}`);
    seen.add(p.id);
    let members = p.refs.cast;
    let strip = false;
    if (members.length && multi_ref !== 'list') {
      const named = kitNamedCast(p.scene, cast || []);
      if (named.length > 1) {
        members = named.slice(0, KIT_STILL_MAX_STRIP);
        strip = true;
      }
    }
    return { id: p.id, index: p.index, scene: p.scene, prompt: p.prompt, negative: p.negative, tag: p.tag, cast: members, strip, products: p.refs.products, scene_image: p.refs.scene_image };
  });
}

/** Every cast member some job sends as a reference, once each, in first-use order. */
export function kitStillAnchorMembers(jobs) {
  const out = [];
  const keys = new Set();
  for (const job of jobs || []) {
    for (const m of job.cast) {
      if (m == null || keys.has(m.key)) continue;
      keys.add(m.key);
      out.push(m);
    }
  }
  return out;
}

/**
 * A cast member's portrait prompt (kitAnchorPrompt with the template's anchor
 * text, else KIT_STILL_DEFAULT_ANCHOR), its negative folded in as for scenes.
 * ctx = {look, answers, brand}. Throws KitPromptGap when the member has no look.
 */
export function kitStillAnchorPrompt(tpl, member, ctx = {}) {
  const { prompt, negative } = kitAnchorPrompt(kitStillTemplate(tpl), member, ctx);
  return kitPromptJoin([prompt, negative ? `Avoid: ${negative}` : '']);
}

/**
 * The anchor files a job can send: [{key, name, file}] for its members that
 * have a picture, from `anchors` (a Map of key -> FileRef: drawn anchors and
 * the members' own images).
 */
export function kitStillCastFiles(job, anchors) {
  const out = [];
  for (const m of job.cast) {
    const file = anchors && anchors.get(m.key);
    if (kitStillIsFile(file)) out.push({ key: m.key, name: kitStillName(m), file });
  }
  return out;
}

/** True when the job sends its cast as one strip: it asked for one and more than one member has a picture. */
export function kitStillWantsStrip(job, castFiles) {
  return Boolean(job.strip && castFiles.length > 1);
}

/**
 * The job's references in order (see the file header), at most `max`.
 * `cast` is kitStillCastFiles' list, or [{key, name, file: strip, strip: [names]}]
 * for a strip; `first` the first scene's still or null; `style_refs` FileRefs.
 * Returns {files, strip_at, names}: strip_at is the strip's 1-based place or null.
 */
export function kitStillRefs(job, { cast = [], first = null, style_refs = [], max = KIT_STILL_MAX_REFS } = {}) {
  const lead = [];
  let stripEntry = null;
  for (const c of cast) {
    lead.push(c.file);
    if (c.strip) stripEntry = c;
  }
  for (const p of job.products || []) if (Array.isArray(p.images) && kitStillIsFile(p.images[0])) lead.push(p.images[0]);
  if (kitStillIsFile(job.scene_image)) lead.push(job.scene_image);
  const tail = [];
  if (kitStillIsFile(first)) tail.push(first);
  for (const f of style_refs || []) if (kitStillIsFile(f)) tail.push(f);
  const keep = Math.max(0, max - tail.length);
  const files = [...lead.slice(0, keep), ...tail].slice(0, max);
  const at = stripEntry ? files.indexOf(stripEntry.file) : -1;
  return { files, strip_at: at >= 0 ? at + 1 : null, names: stripEntry ? stripEntry.strip : null };
}

/**
 * The prompt a job sends: its filled prompt, then, for a strip, which
 * reference holds the characters and that the scene has no panels, then its
 * negative as "Avoid: ...". `refs` is kitStillRefs' result.
 */
export function kitStillPrompt(job, refs = {}) {
  let stripNote = '';
  if (refs.strip_at) {
    const names = (refs.names || []).join(', ');
    stripNote = `Reference image ${refs.strip_at} shows the characters side by side (${names}) only so you know each one's look: draw them together in this one scene with one seamless continuous background, no panels, no dividing lines, no split screen`;
  }
  return kitPromptJoin([job.prompt, stripNote, job.negative ? `Avoid: ${job.negative}` : '']);
}

async function kitStillSize(ctx, file) {
  if (Number.isInteger(file.width) && Number.isInteger(file.height) && file.width > 0 && file.height > 0) return { w: file.width, h: file.height };
  const info = await ctx.tools.probe(file.path);
  if (!(info.width > 0 && info.height > 0)) throw ctx.error('bad_input', `no size for the picture ${String(file.path).split('/').at(-1)}`);
  return { w: info.width, h: info.height };
}

/**
 * Tiles `files` side by side into one PNG in ctx.workDir named `name`: every
 * picture scaled to one height (at most `height`, lower when the strip would
 * pass `max_width`), aspect kept, no padding and no gaps. Returns its FileRef.
 */
export async function kitStillStrip(ctx, files, name, { height = 768, max_width = 4096 } = {}) {
  if (!Array.isArray(files) || files.length < 2) throw ctx.error('bad_input', 'a strip needs at least two pictures');
  const sizes = [];
  for (const f of files) sizes.push(await kitStillSize(ctx, f));
  const ratio = sizes.reduce((sum, s) => sum + s.w / s.h, 0);
  const h = Math.max(64, 2 * Math.floor(Math.min(height, max_width / ratio) / 2));
  const widths = sizes.map((s) => Math.max(2, 2 * Math.round((h * s.w) / s.h / 2)));
  const scaled = widths.map((w, i) => `[${i}:v]scale=${w}:${h}:flags=lanczos,setsar=1,format=rgba[p${i}]`);
  const graph = `${scaled.join(';')};${widths.map((_, i) => `[p${i}]`).join('')}hstack=inputs=${files.length}[out]`;
  const args = [];
  for (const f of files) args.push('-i', f.path);
  args.push('-filter_complex', graph, '-map', '[out]', '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, name));
  await kitFfmpeg(ctx, args);
  return ctx.file(name, 'image');
}

/**
 * The step's outputs: images [{id, image}] in job order; scenes (every input
 * scene, with image = its still when it got one); cast (every member, image =
 * its anchor when it has one); anchors [{id: key, image}] for the members some
 * scene sent. `stills` and `anchors` are Maps (scene id -> FileRef, key -> FileRef).
 */
export function kitStillOutputs({ scenes = [], cast = [], jobs = [], stills, anchors }) {
  const images = jobs.filter((j) => stills.has(j.id)).map((j) => ({ id: j.id, image: stills.get(j.id) }));
  const byIndex = new Map(jobs.map((j) => [j.index, j.id]));
  const outScenes = (scenes || []).map((s, i) => (byIndex.has(i) && stills.has(byIndex.get(i)) ? { ...s, image: stills.get(byIndex.get(i)) } : { ...s }));
  const used = new Set(kitStillAnchorMembers(jobs).map((m) => m.key));
  const outCast = (cast || []).map((m) => (anchors && anchors.has(m.key) ? { ...m, image: anchors.get(m.key) } : { ...m }));
  const outAnchors = (cast || []).filter((m) => used.has(m.key) && anchors && anchors.has(m.key)).map((m) => ({ id: m.key, image: anchors.get(m.key) }));
  return { images, scenes: outScenes, cast: outCast, anchors: outAnchors };
}
