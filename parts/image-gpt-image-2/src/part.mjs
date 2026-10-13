// image-gpt-image-2: photoreal stills from OpenAI GPT Image 2 on fal, one paid
// piece per image. Built for realistic people (an AI creator, a spokesperson):
// openai/gpt-image-2 draws from the prompt alone, openai/gpt-image-2/edit draws
// with reference pictures (a cast anchor, a product photo). Every piece sends
// image_size {width, height} from `size` (the text model's own default is
// landscape) and `quality`. A result whose bytes are not PNG is re-encoded.
//
// Four modes:
//   images  a hand-built list [{id, prompt, references}];
//   scenes  one still per picked plan scene, its prompt filled from the style's
//           template and its references picked from the plan (_lib/scene-stills.mjs,
//           shared with image-nano-banana 1.1.0);
//   cast    only the cast portraits ("anchors"): a member with an image passes
//           through free, a member without one is drawn from its look;
//   shots   (1.1.0) locked-camera shots: scenes are grouped by extra.group; a
//           group's first scene is its plate, every later scene is an edit on
//           [plate, previous frame, product photos], then the plate's own
//           pixels are put back wherever a frame did not change (restore,
//           src/plate.mjs). A scene with extra.repeat_of reuses an earlier
//           scene's finished frame, free; with relight, a shot made only of
//           repeats is the first place again in another light: one paid light
//           picture, multiplied into the source frames (src/plate.mjs).
//
// 1.1.2: in scenes mode (borders: 'fix', the default) a still that came back
// letterboxed, padded or framed is cropped, or fails the step, never drawn again
// (_lib/scene-stills.mjs kitStillWithoutBorders), and product photos lose their
// flat margins before they are sent, except with require_product_refs, whose
// evidence names the exact photo sent.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitLoadTemplate, kitPromptJoin, kitScenePrompt } from '../../_lib/prompt.mjs';
import { kitNamedProducts, kitPickScenes } from '../../_lib/scene-match.mjs';
import { kitStillAnchorMembers, kitStillAnchorPrompt, kitStillCastFiles, kitStillJobs, kitStillOutputs, kitStillPrompt, kitStillRefs, kitStillStrip, kitStillTemplate, kitStillTrimJobs, kitStillTrimProducts, kitStillWantsStrip, kitStillWithoutBorders } from '../../_lib/scene-stills.mjs';
import { kitProductReferenceEvidence, kitProductScenePhotos, kitRequireProductRequest, kitRequireSceneTags } from '../../_lib/product-tag-contract.mjs';
import { giPlatePixels, giPlateRestore, giRelightFieldFor, giRelightFrame } from './plate.mjs';

const EDIT = 'openai/gpt-image-2/edit';
const TEXT = 'openai/gpt-image-2';
const GI_PROMPT_MIN = 2;
const GI_PROMPT_MAX = 32000;
const GI_AT_ONCE = 4;
const GI_DEFAULT_SIZE = '1088x1920';
const GI_DEFAULT_QUALITY = 'high';
const GI_SCENE_ONLY = ['scenes', 'products', 'pick', 'skip_first', 'skip_last', 'anchor', 'multi_ref', 'restore', 'relight', 'require_scene_tags', 'require_product_refs', 'borders'];
const GI_NOT_IN_SHOTS = ['images', 'cast', 'cast_size', 'anchor', 'multi_ref', 'require_scene_tags', 'require_product_refs', 'borders'];
const GI_MAX_REFS = 10;
const GI_NOT_IN_IMAGES = [...GI_SCENE_ONLY, 'template', 'look', 'answers', 'brand', 'cast', 'cast_size', 'style_refs'];
/** The light picture's text when the template has no templates.light: the shot's empty plate, only the light changed. */
const GI_DEFAULT_LIGHT = 'This is the same empty place, shot by the same locked camera, everything in exactly the same place. One thing has changed: {picture}. It is completely empty. A real photograph, fine film grain, true to life colour. No objects, no hands, no people, no text, no watermark';
/** The anchor text when the style's template has none: a plain photo of a real person, nothing that bakes into every scene. */
const GI_DEFAULT_ANCHOR = 'A real photo of one person: {look}. Chest up, looking into the lens, in front of a plain light wall, soft even daylight, hands empty, natural skin texture, shot on a phone, no text, no props';

async function giIsPng(path) {
  const head = (await readFile(path)).subarray(0, 8);
  return head.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

/** '1088x1920' -> {width: 1088, height: 1920}, the image_size fal takes. */
function giSize(size) {
  const [width, height] = String(size).split('x').map(Number);
  return { width, height };
}

/** One paid still: `refs` go to /edit; without refs the prompt-only model draws it. */
async function giDraw(ctx, { piece, refs, prompt, size, quality, product_scene = null }) {
  kitStopIfAborted(ctx);
  const model = refs && refs.length ? EDIT : TEXT;
  const body = { prompt, image_size: giSize(size), quality, num_images: 1, output_format: 'png' };
  if (model === EDIT) body.image_urls = refs;
  if (product_scene) kitRequireProductRequest(product_scene.id, product_scene.required, body.image_urls || [], model);
  const result = await ctx.line.order({
    piece,
    provider: 'fal',
    path: model === EDIT ? EDIT : TEXT,
    body,
    results: [{ pointer: '/json/images/0/url', name: `${piece}-raw.png`, media: 'image' }],
  });
  const raw = result && result.files && result.files[`${piece}-raw.png`];
  if (!raw) throw ctx.error('provider_failed', `no image for ${piece}`);
  if (await giIsPng(raw.path)) return raw;
  await kitFfmpeg(ctx, ['-i', raw.path, '-frames:v', '1', join(ctx.workDir, `${piece}.png`)]);
  return ctx.file(`${piece}.png`, 'image');
}

/** Runs `work` over `items`, a few at a time, keeping their order. */
async function giEach(items, work) {
  const out = new Array(items.length);
  let next = 0;
  let failed = false;
  const lanes = Array.from({ length: Math.min(GI_AT_ONCE, items.length) }, async () => {
    // After one failure no lane starts another paid piece.
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

/** The step's template with the photo-portrait anchor text when it has none. */
async function giTemplate(inputs) {
  const tpl = inputs.template ? await kitLoadTemplate(inputs.template) : null;
  const base = tpl && typeof tpl === 'object' ? tpl : { version: 1 };
  return kitStillTemplate(typeof base.anchor === 'string' ? base : { ...base, anchor: GI_DEFAULT_ANCHOR });
}

function giCheckCast(ctx, cast) {
  const keys = new Set();
  for (const m of cast) {
    if (keys.has(m.key)) throw ctx.error('bad_input', `two cast members have the key ${m.key}`);
    keys.add(m.key);
  }
}

function giRefuseGap(ctx, err) {
  if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
  throw ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
}

/** fal takes 2 to 32,000 characters: every prompt is checked at its longest before the first piece is ordered. */
function giCheckLength(ctx, texts) {
  for (const text of texts) {
    if (text.length < GI_PROMPT_MIN) throw ctx.error('bad_input', `a prompt is under ${GI_PROMPT_MIN} characters`);
    if (text.length > GI_PROMPT_MAX) throw ctx.error('bad_input', `a prompt is over ${GI_PROMPT_MAX} characters`);
  }
}

/** A cast member's name as a strip note lists it (kitStillName in _lib/scene-stills.mjs). */
function giMemberName(m) {
  const name = m && typeof m.name === 'string' ? m.name.trim() : '';
  return name || String((m && m.key) || 'one character');
}

/**
 * The longest prompt a job can send: a strip job's note is counted with every
 * member it may tile (only members with a picture are tiled, a subset) and the
 * last reference place, so the real prompt is never longer.
 */
function giLongestPrompt(job) {
  if (!job.strip) return kitStillPrompt(job, {});
  return kitStillPrompt(job, { strip_at: 10, names: job.cast.map(giMemberName) });
}

function giRefuseOutside(ctx, inputs, keys, mode) {
  for (const key of keys) {
    if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} does not work in ${mode} mode`);
  }
}

async function giImages(inputs, ctx, manifest, opts) {
  const model = opts.model;
  if (!inputs.images) throw ctx.error('bad_input', 'images mode needs images (or give scenes for scenes mode, or cast for cast mode)');
  giRefuseOutside(ctx, inputs, GI_NOT_IN_IMAGES, 'images');
  for (const [i, img] of inputs.images.entries()) {
    if (model === TEXT && (img.references || []).length) throw ctx.error('bad_input', `images[${i}] has reference images; use ${EDIT}`);
  }
  giCheckLength(ctx, inputs.images.map((img) => img.prompt));
  const used = new Set();
  const images = [];
  for (const [i, img] of inputs.images.entries()) {
    const piece = kitPieceName('image', img.id, i, used);
    const file = await giDraw(ctx, { piece, refs: img.references || [], prompt: img.prompt, size: opts.size, quality: opts.quality });
    images.push({ id: String(img.id ?? i + 1), image: file });
    ctx.progress({ done: i + 1, total: inputs.images.length });
  }
  return kitCheckOutputs(ctx, manifest, { images });
}

async function giCast(inputs, ctx, manifest, opts) {
  if (inputs.images) throw ctx.error('bad_input', 'cast mode draws only the cast: give cast or images, not both');
  giRefuseOutside(ctx, inputs, GI_SCENE_ONLY, 'cast');
  const cast = inputs.cast || [];
  if (!cast.length) throw ctx.error('bad_input', 'cast mode needs cast');
  giCheckCast(ctx, cast);
  const styleRefs = inputs.style_refs || [];
  if (opts.model === TEXT && styleRefs.length) throw ctx.error('bad_input', `style_refs need ${EDIT}, which takes reference images`);

  // Every prompt is filled before the first piece is ordered.
  const ctxValues = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null };
  const jobs = [];
  try {
    const tpl = await giTemplate(inputs);
    for (const m of cast) if (!m.image) jobs.push({ member: m, prompt: kitStillAnchorPrompt(tpl, m, ctxValues) });
  } catch (err) {
    giRefuseGap(ctx, err);
  }
  giCheckLength(ctx, jobs.map((j) => j.prompt));
  const used = new Set();
  for (const j of jobs) j.piece = kitPieceName('anchor', j.member.key, cast.indexOf(j.member), used);
  if (!jobs.length) ctx.log.info('every cast member has a picture, so nothing is drawn');

  const anchors = new Map();
  for (const m of cast) if (m.image) anchors.set(m.key, m.image);
  let done = 0;
  await giEach(jobs, async (j) => {
    anchors.set(j.member.key, await giDraw(ctx, { piece: j.piece, refs: styleRefs, prompt: j.prompt, size: opts.cast_size, quality: opts.quality }));
    ctx.progress({ done: ++done, total: jobs.length });
  });
  const outCast = cast.map((m) => (anchors.has(m.key) ? { ...m, image: anchors.get(m.key) } : { ...m }));
  const outAnchors = cast.filter((m) => anchors.has(m.key)).map((m) => ({ id: m.key, image: anchors.get(m.key) }));
  return kitCheckOutputs(ctx, manifest, { images: [], cast: outCast, anchors: outAnchors });
}

async function giScenes(inputs, ctx, manifest, opts) {
  const model = opts.model;
  const anchor = inputs.anchor || 'none';
  if (inputs.images) throw ctx.error('bad_input', 'scenes mode makes its own images: give scenes or images, not both');
  if (!inputs.scenes) throw ctx.error('bad_input', 'scenes mode needs scenes');
  if (inputs.restore !== undefined) throw ctx.error('bad_input', 'restore works only in shots mode');
  if (inputs.relight !== undefined) throw ctx.error('bad_input', 'relight works only in shots mode');
  if (model === TEXT && anchor !== 'none') throw ctx.error('bad_input', `anchor ${anchor} needs ${EDIT}, which takes reference images`);
  if (model === TEXT && inputs.style_refs && inputs.style_refs.length) throw ctx.error('bad_input', `style_refs need ${EDIT}, which takes reference images`);
  const cast = inputs.cast || [];
  giCheckCast(ctx, cast);

  // Everything that can refuse happens before the first piece is ordered.
  let jobs;
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null };
  const anchorJobs = [];
  try {
    const tpl = await giTemplate(inputs);
    if (inputs.require_scene_tags) kitRequireSceneTags(tpl, inputs.scenes, inputs);
    jobs = kitStillJobs(tpl, inputs.scenes, { ...base, pick: inputs.pick, skip_first: inputs.skip_first, skip_last: inputs.skip_last, cast, products: inputs.products || [], multi_ref: inputs.multi_ref });
    if (inputs.require_product_refs) {
      for (const job of jobs) {
        job.required_products = kitProductScenePhotos(tpl, job.scene, inputs.products || []);
        const selected = (job.products || []).flatMap((product) => product.images || []);
        kitRequireProductRequest(job.id, job.required_products, selected, model);
        // Reserve the exact reference slots before buying missing cast anchors.
        const members = job.cast.filter((member) => member.image || anchor === 'cast');
        const castSlots = job.strip && members.length > 1 ? [{ file: null }] : members.slice(0, 3).map(() => ({ file: null }));
        const firstSlot = anchor === 'first_scene' && job !== jobs[0] ? { kind: 'file' } : null;
        const preview = kitStillRefs(job, { cast: castSlots, first: firstSlot, style_refs: inputs.style_refs || [] });
        kitRequireProductRequest(job.id, job.required_products, preview.files, model);
      }
    }
    if (model === EDIT && anchor === 'cast') {
      for (const m of kitStillAnchorMembers(jobs)) if (!m.image) anchorJobs.push({ member: m, prompt: kitStillAnchorPrompt(tpl, m, base) });
    }
  } catch (err) {
    giRefuseGap(ctx, err);
  }
  if (!jobs.length) throw ctx.error('bad_input', 'no scene is picked for a still');
  const fix = (inputs.borders || 'fix') === 'fix';
  giCheckLength(ctx, [...jobs.map(giLongestPrompt), ...anchorJobs.map((a) => a.prompt)]);

  const used = new Set();
  for (const a of anchorJobs) a.piece = kitPieceName('anchor', a.member.key, cast.indexOf(a.member), used);
  for (const j of jobs) j.piece = kitPieceName('image', j.id, j.index, used);
  // Product photos lose their flat margins before any still sends them (free); the strict evidence binds the exact photo, so it keeps it.
  if (fix && model === EDIT && !inputs.require_product_refs) kitStillTrimJobs(jobs, await kitStillTrimProducts(ctx, inputs.products || []));
  const total = anchorJobs.length + jobs.length;
  let done = 0;
  const tick = () => ctx.progress({ done: ++done, total });
  if (model === TEXT && jobs.some((j) => j.cast.length || j.products.length || j.scene_image)) {
    ctx.log.info(`${TEXT} draws from the prompt alone, so scene references are not sent`);
  }

  // 1. Cast anchors: members with an image pass through free.
  const anchors = new Map();
  for (const m of cast) if (m.image) anchors.set(m.key, m.image);
  const styleRefs = model === EDIT ? inputs.style_refs || [] : [];
  await giEach(anchorJobs, async (a) => {
    anchors.set(a.member.key, await giDraw(ctx, { piece: a.piece, refs: styleRefs, prompt: a.prompt, size: opts.cast_size, quality: opts.quality }));
    tick();
  });

  // 2. Scene stills. With anchor 'first_scene' the first still is a reference for every later one.
  const strips = new Map();
  const stripFor = async (files) => {
    const set = files.map((c) => c.key).join(' ');
    // Lanes share one strip per member set (the promise, so it is made once).
    if (!strips.has(set)) strips.set(set, kitStillStrip(ctx, files.map((c) => c.file), `strip-${strips.size + 1}.png`));
    return { key: set, file: await strips.get(set), strip: files.map((c) => c.name) };
  };
  const stills = new Map();
  const productEvidence = [];
  const drawJob = async (job, first) => {
    let refs = { files: [], strip_at: null, names: null };
    if (model === EDIT) {
      const castFiles = kitStillCastFiles(job, anchors);
      const castRefs = kitStillWantsStrip(job, castFiles) ? [await stripFor(castFiles)] : castFiles.slice(0, 3);
      refs = kitStillRefs(job, { cast: castRefs, first, style_refs: styleRefs });
    }
    const drawn = await giDraw(ctx, { piece: job.piece, refs: refs.files, prompt: kitStillPrompt(job, refs), size: opts.size, quality: opts.quality,
      product_scene: inputs.require_product_refs ? { id: job.id, required: job.required_products } : null });
    const image = fix
      ? (await kitStillWithoutBorders(ctx, { file: drawn, name: job.piece, about: `the still for scene ${job.id}`, refusal: `The picture for scene ${job.index + 1} came back with a border; change the scene picture and try again.` })).file
      : drawn;
    stills.set(job.id, image);
    // The evidence binds the still as it is handed on (cropped or not) to the request that drew it.
    if (inputs.require_product_refs) productEvidence.push(kitProductReferenceEvidence(job.id, image, job.required_products, refs.files, refs.files.length ? EDIT : TEXT, job.piece));
    tick();
  };
  let rest = jobs;
  let first = null;
  if (anchor === 'first_scene') {
    await drawJob(jobs[0], null);
    first = stills.get(jobs[0].id);
    rest = jobs.slice(1);
  }
  await giEach(rest, (job) => drawJob(job, first));

  const out = kitStillOutputs({ scenes: inputs.scenes, cast, jobs, stills, anchors });
  // All four outputs every time (empty lists without a cast), so a style can bind step.<id>.cast or .anchors.
  return kitCheckOutputs(ctx, manifest, { images: out.images, scenes: out.scenes, cast: out.cast, anchors: out.anchors,
    ...(inputs.require_product_refs ? { product_reference_evidence: productEvidence.sort((a, b) => a.scene_id.localeCompare(b.scene_id)) } : {}) });
}

function giExtra(scene, key) {
  const extra = scene && scene.extra;
  return extra && typeof extra === 'object' ? extra[key] : undefined;
}

function giSceneId(scene, index) {
  return scene && scene.id != null && scene.id !== '' ? String(scene.id) : `#${index + 1}`;
}

/**
 * Groups the picked scenes into shots, before anything is ordered. Returns
 * {groups: [{key, name, entries}], repeats: Map(scene id -> drawn scene id),
 * repeatList: [{id, index, scene, of, root, group}] in plan order}; an entry is
 * {id, index, scene}. A scene with extra.repeat_of is drawn by no shot: it
 * names an earlier picked scene (`of`), whose finished frame it reuses; `root`
 * is the drawn scene a chain of repeats ends on. A scene with no extra.group
 * is a shot of its own, named by its id.
 */
function giShotPlan(ctx, picked) {
  const at = new Map();
  for (const [k, { scene, index }] of picked.entries()) {
    const id = giSceneId(scene, index);
    if (at.has(id)) throw ctx.error('bad_input', `two scenes have the id ${id}`);
    at.set(id, k);
  }
  const groups = new Map();
  const repeats = new Map();
  const repeatList = [];
  const loose = new Set();
  for (const [k, { scene, index }] of picked.entries()) {
    const id = giSceneId(scene, index);
    const of = giExtra(scene, 'repeat_of');
    if (of != null && of !== '') {
      if (typeof of !== 'string') throw ctx.error('bad_input', `scene ${id}: extra.repeat_of must be a scene id`);
      if (!at.has(of)) throw ctx.error('bad_input', `scene ${id} repeats ${of}, which is not a picked scene`);
      if (at.get(of) >= k) throw ctx.error('bad_input', `scene ${id} repeats ${of}, which does not come before it`);
      const group = giExtra(scene, 'group');
      if (group != null && typeof group !== 'string') throw ctx.error('bad_input', `scene ${id}: extra.group must be text`);
      repeats.set(id, repeats.get(of) || of);
      repeatList.push({ id, index, scene, of, root: repeats.get(id), group: typeof group === 'string' && group.trim() ? group.trim() : null });
      continue;
    }
    const group = giExtra(scene, 'group');
    if (group != null && typeof group !== 'string') throw ctx.error('bad_input', `scene ${id}: extra.group must be text`);
    const name = typeof group === 'string' && group.trim() ? group.trim() : null;
    if (!name) loose.add(id);
    const key = name ? `g:${name}` : `s:${id}`;
    if (!groups.has(key)) groups.set(key, { key, name: name || id, entries: [] });
    groups.get(key).entries.push({ id, index, scene });
  }
  for (const id of loose) {
    if (groups.has(`g:${id}`)) throw ctx.error('bad_input', `scene ${id} has no group, and a group is also called ${id}`);
  }
  return { groups: [...groups.values()], repeats, repeatList };
}

/**
 * The shots relight re-lights, before anything is ordered. A shot made only of
 * repeats (its scenes share an extra.group that no drawn scene has, or a
 * repeat with no group, alone) is the first place again in another light: its
 * first scene's picture text says the light. A repeat inside a drawn shot (a
 * callback) and a repeat shot whose first picture has no words stay plain
 * repeats. Every scene of a relit shot repeats frames of ONE drawn shot, whose
 * plate the light is measured against. Returns [{name, entries, source, first}].
 */
function giRelitShots(ctx, plan) {
  const drawnAt = new Map();
  for (const g of plan.groups) for (const e of g.entries) drawnAt.set(e.id, g);
  const named = new Set(plan.groups.filter((g) => g.key.startsWith('g:')).map((g) => g.name));
  const loose = new Set(plan.groups.filter((g) => g.key.startsWith('s:')).map((g) => g.name));
  const shots = new Map();
  for (const r of plan.repeatList) {
    if (r.group && named.has(r.group)) continue;
    if (r.group && loose.has(r.group)) throw ctx.error('bad_input', `scene ${r.group} has no group, and a group is also called ${r.group}`);
    const key = r.group ? `g:${r.group}` : `s:${r.id}`;
    if (!shots.has(key)) shots.set(key, { name: r.group || r.id, entries: [] });
    shots.get(key).entries.push(r);
  }
  const out = [];
  for (const shot of shots.values()) {
    const first = shot.entries[0];
    const words = typeof first.scene.picture === 'string' ? first.scene.picture.trim() : '';
    if (!words) {
      ctx.log.info(`shot ${shot.name} has no picture words for its light, so its scenes repeat their frames as they are`);
      continue;
    }
    const sources = [...new Set(shot.entries.map((e) => drawnAt.get(e.root)))];
    if (sources.length > 1) {
      throw ctx.error('bad_input', `shot ${shot.name} repeats frames of ${sources.length} shots (${sources.map((g) => g.name).join(', ')}); a re-lit shot repeats one shot, whose plate its light is measured against`);
    }
    out.push({ name: shot.name, entries: shot.entries, source: sources[0], first });
  }
  return out;
}

/** "1", "2 and 3", "3, 4 and 5": reference numbers in words. */
function giNumbers(list) {
  return list.length < 2 ? String(list[0]) : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
}

/** What each reference of a shots piece is, said in the prompt. */
function giShotNote(roles) {
  const at = (role) => roles.map((r, i) => (r === role ? i + 1 : 0)).filter(Boolean);
  const out = [];
  const say = (role, one, many) => {
    const n = at(role);
    if (n.length) out.push(`${n.length > 1 ? 'Reference images' : 'Reference image'} ${giNumbers(n)} ${n.length > 1 ? many : one}`);
  };
  say('plate', "is this shot's first picture, from a locked camera: keep its camera, framing, surface and light exactly", '');
  say('previous', 'is the picture just before this one: everything in it stays exactly where it is unless this text changes it', '');
  say('day', 'is this same place in its first light, from the same locked camera: keep its camera, framing, surface and everything in it exactly; change only the light', '');
  say('product', 'shows the product: keep it exactly as in the photo, mark and colour unchanged', 'show the product: keep it exactly as in the photos, mark and colour unchanged');
  say('scene_image', "is this scene's own picture", "are this scene's own pictures");
  say('style', 'shows the style only', 'show the style only');
  return out.join('. ');
}

/**
 * One shots piece's references, at most 10: the plate and the previous frame
 * always fit, style_refs next, then product photos and the scene's own picture
 * as room allows. Returns {files, roles}.
 */
function giShotRefs({ plate = null, previous = null, products = [], scene_image = null, style_refs = [] }) {
  const lead = [];
  if (plate) lead.push([plate, 'plate']);
  if (previous) lead.push([previous, 'previous']);
  const tail = style_refs.map((f) => [f, 'style']);
  const middle = [...products.map((f) => [f, 'product']), ...(scene_image ? [[scene_image, 'scene_image']] : [])];
  const room = Math.max(0, GI_MAX_REFS - lead.length - tail.length);
  const all = [...lead, ...middle.slice(0, room), ...tail].slice(0, GI_MAX_REFS);
  return { files: all.map(([f]) => f), roles: all.map(([, r]) => r) };
}

function giIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

async function giShots(inputs, ctx, manifest, opts) {
  if (!inputs.scenes) throw ctx.error('bad_input', 'shots mode needs scenes');
  for (const key of GI_NOT_IN_SHOTS) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} does not work in shots mode`);
  if (opts.model === TEXT) throw ctx.error('bad_input', `shots mode edits every frame on its plate, so it needs ${EDIT}`);
  const restore = inputs.restore !== false;
  const relight = inputs.relight === true;
  const products = inputs.products || [];
  const styleRefs = inputs.style_refs || [];

  // Everything that can refuse happens before the first piece is ordered.
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null, cast: [], products };
  let picked;
  let tpl;
  try {
    tpl = await giTemplate(inputs);
    picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
  } catch (err) {
    giRefuseGap(ctx, err);
  }
  if (!picked.length) throw ctx.error('bad_input', 'no scene is picked for a still');
  const plan = giShotPlan(ctx, picked);
  const { groups } = plan;
  const relit = relight ? giRelitShots(ctx, plan) : [];
  if (relight && !relit.length) ctx.log.info('relight: no shot is made only of repeats with words for its light, so nothing is re-lit');
  const named = (key) => Boolean(tpl.templates && typeof tpl.templates[key] === 'string');
  const used = new Set();
  try {
    for (const g of groups) {
      for (const [k, e] of g.entries.entries()) {
        const role = k === 0 ? 'plate' : 'state';
        const filled = kitScenePrompt(tpl, { ...base, scene: e.scene, index: e.index }, { use: named(role) ? role : 'scene' });
        let photos = filled.refs.products;
        // A plate is the empty place: it sends a product photo only when its own words name the product.
        if (role === 'plate') photos = photos.filter((p) => kitNamedProducts(e.scene, products).includes(p));
        e.prompt = filled.prompt;
        e.negative = filled.negative;
        e.photos = photos.map((p) => p.images[0]).filter(giIsFile);
        e.scene_image = giIsFile(filled.refs.scene_image) ? filled.refs.scene_image : null;
      }
    }
    // A relit shot's light picture: templates.light, else the default text; {picture} = its first scene's words.
    for (const rg of relit) {
      const at = { ...base, scene: rg.first.scene, index: rg.first.index };
      const filled = named('light') ? kitScenePrompt(tpl, at, { use: 'light' }) : kitScenePrompt({ version: 1, scene: GI_DEFAULT_LIGHT }, at);
      rg.prompt = filled.prompt;
      rg.negative = filled.negative;
    }
  } catch (err) {
    giRefuseGap(ctx, err);
  }
  const drawn = groups.flatMap((g) => g.entries);
  giCheckLength(ctx, [...drawn, ...relit].map((e) => kitPromptJoin([e.prompt, e.negative ? `Avoid: ${e.negative}` : ''])));
  for (const e of drawn) e.piece = kitPieceName('image', e.id, e.index, used);
  for (const rg of relit) rg.piece = kitPieceName('light', rg.first.id, rg.first.index, used);
  const total = drawn.length + relit.length;

  // Shots run side by side (up to 4); the frames of one shot are made in order,
  // each on the plate and the frame before it (as drawn, before restore).
  const finals = new Map();
  const plates = [];
  let done = 0;
  let halted = false;
  const drawShot = async (g) => {
    const raws = [];
    for (const [k, e] of g.entries.entries()) {
      if (halted) return;
      const refs = k === 0
        ? giShotRefs({ products: e.photos, scene_image: e.scene_image, style_refs: styleRefs })
        : giShotRefs({ plate: raws[0], previous: k > 1 ? raws[k - 1] : null, products: e.photos, scene_image: e.scene_image, style_refs: styleRefs });
      const prompt = kitPromptJoin([e.prompt, refs.files.length ? giShotNote(refs.roles) : '', e.negative ? `Avoid: ${e.negative}` : '']);
      raws.push(await giDraw(ctx, { piece: e.piece, refs: refs.files, prompt, size: opts.size, quality: opts.quality }));
      ctx.progress({ done: ++done, total });
    }
    finals.set(g.entries[0].id, raws[0]);
    plates.push({ group: g.name, image: raws[0] });
    if (!restore || g.entries.length < 2) {
      for (const [k, e] of g.entries.entries()) finals.set(e.id, raws[k]);
      return;
    }
    const pixels = await giPlatePixels(ctx, raws[0], g.entries[0].piece);
    for (const [k, e] of g.entries.entries()) {
      if (k === 0) continue;
      const fixed = await giPlateRestore(ctx, pixels, raws[k], `${e.piece}-restored.png`);
      if (!fixed) {
        ctx.log.warn(`scene ${e.id} is not the size of its plate, so it is left as drawn`);
        finals.set(e.id, raws[k]);
        continue;
      }
      ctx.log.info(`scene ${e.id}: ${(fixed.kept * 100).toFixed(1)}% kept from the edit, ${(fixed.same * 100).toFixed(1)}% is the plate's own pixels`);
      finals.set(e.id, fixed.file);
    }
  };
  await giEach(groups, async (g) => {
    try {
      await drawShot(g);
    } catch (err) {
      halted = true;
      throw err;
    }
  });

  // Relight: one paid light picture per relit shot (an edit on its source
  // shot's plate), used only for its light; every scene of the shot is its
  // source frame (as finished) times the light field (src/plate.mjs).
  const dayPlates = new Map(plates.map((p) => [p.group, p.image]));
  const relitFrames = new Map();
  const names = new Set();
  await giEach(relit, async (rg) => {
    const day = dayPlates.get(rg.source.name);
    const roles = ['day'];
    const prompt = kitPromptJoin([rg.prompt, giShotNote(roles), rg.negative ? `Avoid: ${rg.negative}` : '']);
    const light = await giDraw(ctx, { piece: rg.piece, refs: [day], prompt, size: opts.size, quality: opts.quality });
    ctx.progress({ done: ++done, total });
    const fields = new Map();
    const fieldFor = (w, h) => {
      const key = `${w}x${h}`;
      if (!fields.has(key)) fields.set(key, giRelightFieldFor(ctx, { light, day, w, h, tag: rg.piece }));
      return fields.get(key);
    };
    for (const e of rg.entries) {
      const lit = await giRelightFrame(ctx, finals.get(e.root), fieldFor, `${kitPieceName('relit', e.id, e.index, names)}.png`);
      relitFrames.set(e.id, lit.file);
      ctx.log.info(`scene ${e.id}: ${e.root} re-lit for shot ${rg.name}, mean brightness ${Math.round(lit.mean)} (day frame ${Math.round(lit.day_mean)})`);
    }
  });
  // Repeats in plan order: a relit scene takes its relit frame, any other the
  // finished frame of the scene it names (itself perhaps relit).
  for (const r of plan.repeatList) finals.set(r.id, relitFrames.get(r.id) || finals.get(r.of));

  const order = new Map(groups.map((g, i) => [g.name, i]));
  plates.sort((a, b) => order.get(a.group) - order.get(b.group));
  const pickedAt = new Map(picked.map(({ scene, index }) => [index, giSceneId(scene, index)]));
  const images = picked.map(({ scene, index }) => giSceneId(scene, index)).filter((id) => finals.has(id)).map((id) => ({ id, image: finals.get(id) }));
  const scenes = inputs.scenes.map((s, i) => (pickedAt.has(i) && finals.has(pickedAt.get(i)) ? { ...s, image: finals.get(pickedAt.get(i)) } : { ...s }));
  return kitCheckOutputs(ctx, manifest, { images, plates, scenes });
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const mode = inputs.mode || (inputs.scenes ? 'scenes' : inputs.images ? 'images' : inputs.cast ? 'cast' : 'images');
  const size = inputs.size || GI_DEFAULT_SIZE;
  const opts = { model: inputs.model || EDIT, size, cast_size: inputs.cast_size || size, quality: inputs.quality || GI_DEFAULT_QUALITY };
  if (mode === 'shots') return giShots(inputs, ctx, manifest, opts);
  if (mode === 'scenes') return giScenes(inputs, ctx, manifest, opts);
  if (mode === 'cast') return giCast(inputs, ctx, manifest, opts);
  return giImages(inputs, ctx, manifest, opts);
}
