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
// rule), and the template's max_refs caps 1-3 only: 4 and 5 are the step's
// own inputs, not the plan's. When the list is too long, 1-3 give way so 4
// and 5 always fit.
//
// Borders (image-nano-banana 1.2.3, image-gpt-image-2 1.1.2): an edit model
// fed a padded product photo often copies the padding, letterboxes the still
// or draws the product as a framed card. So a product photo's flat margins are
// trimmed before it is sent (kitStillTrimReference), and every finished still
// is measured (kitStillBorders): a still with a flat band or a frame is cropped
// when that keeps at least 90 % of it, else drawn once more with
// KIT_STILL_FULL_BLEED, then cropped when that keeps 75 %, else the step fails.
//
// Bundled into parts; every top-level name starts with `kitStill` or `KIT_STILL`.
import { readFile } from 'node:fs/promises';
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

/** Added to a still's prompt when it is drawn again because it came back with a border. */
export const KIT_STILL_FULL_BLEED = 'Full-bleed photograph filling the whole frame edge to edge; no border, frame, card, letterbox or padding.';
/** A border is cropped off without a second picture when the crop keeps this much of the still. */
export const KIT_STILL_FREE_CROP = 0.9;
/** After the second picture, the least a crop may keep before the step fails instead. */
export const KIT_STILL_MIN_CROP = 0.75;

let kitStillPixelReads = 0;

/**
 * The picture as RGBA bytes, scaled (area average) to fit `max` px on its long side: {w, h, data}.
 * Decoded by ffmpeg into tmpDir, so a PNG, JPEG or WebP all read the same way.
 */
export async function kitStillPixels(ctx, file, max = 384) {
  const { w: fw, h: fh } = await kitStillSize(ctx, file);
  const k = Math.min(1, max / Math.max(fw, fh));
  const w = Math.max(8, Math.round(fw * k));
  const h = Math.max(8, Math.round(fh * k));
  const out = join(ctx.tmpDir, `px-${++kitStillPixelReads}.raw`);
  await kitFfmpeg(ctx, ['-i', file.path, '-frames:v', '1', '-vf', `scale=${w}:${h}:flags=area,format=rgba`, '-f', 'rawvideo', '-pix_fmt', 'rgba', out]);
  return { w, h, data: await readFile(out) };
}

function kitStillLine(px, side, i) {
  const { w, h, data } = px;
  const n = side === 'top' || side === 'bottom' ? w : h;
  const at = (k) => {
    if (side === 'top') return (i * w + k) * 4;
    if (side === 'bottom') return ((h - 1 - i) * w + k) * 4;
    if (side === 'left') return (k * w + i) * 4;
    return (k * w + (w - 1 - i)) * 4;
  };
  return { n, at, data };
}

function kitStillLineStats(px, side, i) {
  const { n, at, data } = kitStillLine(px, side, i);
  const sum = [0, 0, 0];
  const sq = [0, 0, 0];
  for (let k = 0; k < n; k++) {
    const p = at(k);
    for (let c = 0; c < 3; c++) {
      sum[c] += data[p + c];
      sq[c] += data[p + c] * data[p + c];
    }
  }
  const mean = sum.map((v) => v / n);
  const std = Math.max(...sq.map((v, c) => Math.sqrt(Math.max(0, v / n - mean[c] * mean[c]))));
  return { mean, std };
}

/** Share of a line's pixels more than `tol` away from `rgb` in any channel. */
function kitStillLineOff(px, side, i, rgb, tol = 24) {
  const { n, at, data } = kitStillLine(px, side, i);
  let off = 0;
  for (let k = 0; k < n; k++) {
    const p = at(k);
    if (Math.abs(data[p] - rgb[0]) > tol || Math.abs(data[p + 1] - rgb[1]) > tol || Math.abs(data[p + 2] - rgb[2]) > tol) off++;
  }
  return off / n;
}

/**
 * A flat band on one side: the run of lines from the edge whose spread is under 3 and whose mean is within 6
 * of the edge line's, and whether it ends on a straight edge (one of the next two lines differs from the band
 * across at least 60 % of its length, which a product or a horizon touching a plain backdrop does not).
 */
function kitStillSide(px, side) {
  const len = side === 'top' || side === 'bottom' ? px.h : px.w;
  const edge = kitStillLineStats(px, side, 0);
  let n = 0;
  while (n < len) {
    const l = kitStillLineStats(px, side, n);
    if (l.std >= 3 || l.mean.some((v, c) => Math.abs(v - edge.mean[c]) > 6)) break;
    n++;
  }
  const sharp = n > 0 && n < len - 1 && [n, n + 1].some((i) => i < len && kitStillLineOff(px, side, i, edge.mean) >= 0.6);
  return { share: n / len, sharp, color: edge.mean };
}

function kitStillNeutral(rgb) {
  return Math.max(...rgb) - Math.min(...rgb) <= 16;
}

function kitStillSameColor(a, b, tol = 12) {
  return a.every((v, c) => Math.abs(v - b[c]) <= tol);
}

/**
 * Bands and frames in a still's pixels ({w, h, data} RGBA). A band is a flat strip of at least 2.5 % of the
 * side ending on a straight edge, in a neutral colour (white, grey, black) or matched by a band of the same
 * colour on the opposite side (a letterbox). A frame is a flat ring of at least 1.5 % on all four sides, one
 * colour, every side ending on a straight edge, around a picture that is not flat. Returns
 * {bands: {top, bottom, left, right} (shares, 0 when none), frame, flagged, box: {x, y, w, h} (shares of the
 * still that are left without them)}.
 */
export function kitStillBordersIn(px) {
  const sides = {};
  for (const side of ['top', 'bottom', 'left', 'right']) sides[side] = kitStillSide(px, side);
  const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const bands = { top: 0, bottom: 0, left: 0, right: 0 };
  for (const side of Object.keys(bands)) {
    const s = sides[side];
    if (!(s.share >= 0.025 && s.sharp)) continue;
    const o = sides[opposite[side]];
    const paired = o.share >= 0.025 && o.sharp && kitStillSameColor(o.color, s.color);
    if (kitStillNeutral(s.color) || paired) bands[side] = s.share;
  }
  const ring = Object.values(sides);
  let frame = ring.every((s) => s.share >= 0.015 && s.share < 0.4 && s.sharp) && ring.every((s) => kitStillSameColor(s.color, ring[0].color));
  if (frame) {
    const inner = { top: sides.top.share, bottom: sides.bottom.share, left: sides.left.share, right: sides.right.share };
    const x0 = Math.ceil(inner.left * px.w);
    const x1 = Math.floor((1 - inner.right) * px.w);
    const y0 = Math.ceil(inner.top * px.h);
    const y1 = Math.floor((1 - inner.bottom) * px.h);
    // The ring has to hold a picture, not a plain colour field.
    let sum = 0;
    let sq = 0;
    let n = 0;
    for (let y = y0; y < y1; y += 2) {
      for (let x = x0; x < x1; x += 2) {
        const p = (y * px.w + x) * 4;
        const v = (px.data[p] + px.data[p + 1] + px.data[p + 2]) / 3;
        sum += v;
        sq += v * v;
        n++;
      }
    }
    frame = n > 0 && Math.sqrt(Math.max(0, sq / n - (sum / n) ** 2)) > 8;
    if (frame) Object.assign(bands, inner);
  }
  const flagged = frame || Object.values(bands).some((v) => v > 0);
  const box = { x: bands.left, y: bands.top, w: Math.max(0, 1 - bands.left - bands.right), h: Math.max(0, 1 - bands.top - bands.bottom) };
  return { bands, frame, flagged, box };
}

/** kitStillBordersIn for a still file. */
export async function kitStillBorders(ctx, file) {
  return kitStillBordersIn(await kitStillPixels(ctx, file));
}

/**
 * The content box of a reference photo with flat margins (a product on a padded square canvas, or with
 * transparent padding): the edge's one colour (or transparency) is followed inward while a line is at least
 * 99.5 % that colour. {x, y, w, h} in shares, or null when there is nothing worth trimming (under 4 % of the
 * area) or the edge is not one colour.
 */
export function kitStillTrimBoxIn(px, tol = 16) {
  const { w, h, data } = px;
  const edge = [];
  for (let x = 0; x < w; x++) edge.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) edge.push(y * w, y * w + w - 1);
  const clear = (p) => data[p * 4 + 3] < 16;
  const opaqueEdge = edge.filter((p) => !clear(p));
  const median = (vals) => vals.sort((a, b) => a - b)[vals.length >> 1];
  const bg = opaqueEdge.length ? [0, 1, 2].map((c) => median(opaqueEdge.map((p) => data[p * 4 + c]))) : [0, 0, 0];
  const isBg = (p) => clear(p) || (Math.abs(data[p * 4] - bg[0]) <= tol && Math.abs(data[p * 4 + 1] - bg[1]) <= tol && Math.abs(data[p * 4 + 2] - bg[2]) <= tol);
  if (edge.filter(isBg).length < edge.length * 0.9) return null;
  const rowBg = (y) => {
    let n = 0;
    for (let x = 0; x < w; x++) if (isBg(y * w + x)) n++;
    return n >= w * 0.995;
  };
  const colBg = (x, y0, y1) => {
    let n = 0;
    for (let y = y0; y <= y1; y++) if (isBg(y * w + x)) n++;
    return n >= (y1 - y0 + 1) * 0.995;
  };
  let top = 0;
  while (top < h && rowBg(top)) top++;
  if (top === h) return null;
  let bottom = h - 1;
  while (bottom > top && rowBg(bottom)) bottom--;
  let left = 0;
  while (left < w && colBg(left, top, bottom)) left++;
  let right = w - 1;
  while (right > left && colBg(right, top, bottom)) right--;
  // One line of margin, so the product's own edge is never cut.
  const x0 = Math.max(0, left - 1);
  const y0 = Math.max(0, top - 1);
  const x1 = Math.min(w - 1, right + 1);
  const y1 = Math.min(h - 1, bottom + 1);
  const box = { x: x0 / w, y: y0 / h, w: (x1 - x0 + 1) / w, h: (y1 - y0 + 1) / h };
  return box.w * box.h > 0.96 ? null : box;
}

/** `file` cropped to `box` (shares) as a PNG in workDir named `name`; its FileRef. Alpha is kept. */
export async function kitStillCrop(ctx, file, box, name) {
  const { w: fw, h: fh } = await kitStillSize(ctx, file);
  const x = Math.max(0, Math.floor(box.x * fw));
  const y = Math.max(0, Math.floor(box.y * fh));
  const cw = Math.max(2, Math.min(fw - x, Math.round(box.w * fw)));
  const ch = Math.max(2, Math.min(fh - y, Math.round(box.h * fh)));
  await kitFfmpeg(ctx, ['-i', file.path, '-frames:v', '1', '-vf', `crop=${cw}:${ch}:${x}:${y}`, '-c:v', 'png', join(ctx.workDir, name)]);
  return ctx.file(name, 'image');
}

/**
 * A product photo ready to send as a reference: its flat (or transparent) margins trimmed, nothing padded
 * back, so the edit model sees the product and not a padded square. The same FileRef when there is nothing
 * to trim. Free.
 */
export async function kitStillTrimReference(ctx, file, name) {
  const box = kitStillTrimBoxIn(await kitStillPixels(ctx, file, 512));
  return box ? kitStillCrop(ctx, file, box, name) : file;
}

/**
 * Products with each first photo trimmed (kitStillTrimReference), once per photo: a Map from product id to
 * the product with its trimmed photo (the same object when nothing was trimmed). kitStillTrimJobs swaps them
 * into jobs before their references are picked.
 */
export async function kitStillTrimProducts(ctx, products) {
  const out = new Map();
  const byPath = new Map();
  for (const p of products || []) {
    const photo = Array.isArray(p.images) ? p.images[0] : null;
    if (!kitStillIsFile(photo) || out.has(String(p.id))) continue;
    if (!byPath.has(photo.path)) byPath.set(photo.path, kitStillTrimReference(ctx, photo, `ref-${byPath.size + 1}.png`));
    const trimmed = await byPath.get(photo.path);
    out.set(String(p.id), trimmed === photo ? p : { ...p, images: [trimmed, ...p.images.slice(1)] });
  }
  return out;
}

/** Each job's products swapped for their trimmed copies (kitStillTrimProducts). */
export function kitStillTrimJobs(jobs, trimmed) {
  for (const job of jobs || []) job.products = (job.products || []).map((p) => trimmed.get(String(p.id)) || p);
  return jobs;
}

/**
 * A finished still with no border: `draw(suffix)` makes a still (suffix '' first). A still with a band or a
 * frame is cropped when that keeps KIT_STILL_FREE_CROP of it; else it is drawn once more with
 * KIT_STILL_FULL_BLEED, and that one is cropped when it keeps KIT_STILL_MIN_CROP; else the step fails with
 * `refusal` (plain words for the customer). Returns {file, redrawn, cropped}.
 */
export async function kitStillWithoutBorders(ctx, { draw, name, about, refusal }) {
  let file = await draw('');
  let b = await kitStillBorders(ctx, file);
  if (!b.flagged) return { file, redrawn: false, cropped: false };
  const area = (x) => x.box.w * x.box.h;
  if (area(b) >= KIT_STILL_FREE_CROP) {
    ctx.log.info(`${about} had a border; cropped it off`, { bands: b.bands, frame: b.frame });
    return { file: await kitStillCrop(ctx, file, b.box, `${name}-crop.png`), redrawn: false, cropped: true };
  }
  ctx.log.warn(`${about} came back with a border; drawing it once more`, { bands: b.bands, frame: b.frame });
  file = await draw(KIT_STILL_FULL_BLEED);
  b = await kitStillBorders(ctx, file);
  if (!b.flagged) return { file, redrawn: true, cropped: false };
  if (area(b) >= KIT_STILL_MIN_CROP) {
    ctx.log.warn(`${about} came back with a border again; cropped it off`, { bands: b.bands, frame: b.frame });
    return { file: await kitStillCrop(ctx, file, b.box, `${name}-crop.png`), redrawn: true, cropped: true };
  }
  throw ctx.error('output_invalid', refusal);
}
