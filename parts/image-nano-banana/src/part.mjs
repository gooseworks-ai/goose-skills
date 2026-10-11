// image-nano-banana: stills from Google's Nano Banana on fal, one paid piece
// per image. Replaces create-image-fal for this model family: the same fal
// model paths (fal-ai/nano-banana for a prompt alone, fal-ai/nano-banana/edit
// with reference images) and payload (prompt, image_urls, aspect_ratio), with
// references passed as FileRefs the core hosts. Like today's atom, a result
// whose bytes are not the PNG it is saved as is re-encoded to PNG.
//
// Two modes (1.1.0):
//   images  a hand-built list [{id, prompt, references}] (the 1.0.1 behaviour);
//   scenes  one still per picked plan scene, its prompt filled from the style's
//           template and its references picked from the plan (_lib/scene-stills.mjs):
//           cast anchors (drawn here when anchor is 'cast'), product photos, the
//           scene's own picture, the first scene's still, the style's references.
//
// 1.2.0 adds a third mode:
//   products one edit of each product's first photo per kind ("snap": the whole
//            product on a plain textured surface; "angled": a three-quarter view
//            floating over warm white), for range and grid cards. The photo is
//            the only reference: a product still is never drawn from text.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitLoadTemplate, kitPromptJoin, kitScenePrompt } from '../../_lib/prompt.mjs';
import { kitTagKey } from '../../_lib/scene-match.mjs';
import { kitStillAnchorMembers, kitStillAnchorPrompt, kitStillCastFiles, kitStillJobs, kitStillOutputs, kitStillPrompt, kitStillRefs, kitStillStrip, kitStillTemplate, kitStillWantsStrip } from '../../_lib/scene-stills.mjs';

const EDIT = 'fal-ai/nano-banana/edit';
const TEXT = 'fal-ai/nano-banana';
const NB_PROMPT_MAX = 12000;
const NB_AT_ONCE = 4;
const NB_SCENE_ONLY = ['scenes', 'template', 'look', 'answers', 'cast', 'products', 'brand', 'pick', 'skip_first', 'skip_last', 'anchor', 'cast_aspect_ratio', 'style_refs', 'multi_ref'];
// Inputs products mode refuses (they pick or draw scenes and cast).
const NB_NOT_PRODUCTS = ['images', 'scenes', 'cast', 'pick', 'skip_first', 'skip_last', 'anchor', 'cast_aspect_ratio', 'style_refs', 'multi_ref'];
// products mode: the built-in text per kind, used when the template has no by_tag rule for it
// (the day-in-the-life recipe's snap and 3D-angled stills, 2026-10).
const NB_KIND_TEXT = {
  snap: 'The {product.name} exactly as in the reference photo: the same shape, colours, pattern and label. One complete product resting on a neutral textured surface, soft key light from the upper left, the product slightly above centre, photoreal close-up product photo',
  angled: 'The {product.name} exactly as in the reference photo: the same shape, colours, pattern and label. The whole product turned 15 to 20 degrees to a three-quarter view, floating over a warm white background, a soft cast shadow to the lower right, photoreal studio product photo',
};
// The negative used when there is no template at all.
const NB_KIND_NEGATIVE = 'text, captions, hands, extra products, a changed label, a changed colour or pattern';

async function nbIsPng(path) {
  const head = (await readFile(path)).subarray(0, 8);
  return head.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

/** One paid still: `refs` go to /edit; without refs the prompt-only model draws it. */
async function nbDraw(ctx, { piece, refs, prompt, aspect, seed }) {
  kitStopIfAborted(ctx);
  const model = refs && refs.length ? EDIT : TEXT;
  const body = { prompt, num_images: 1, output_format: 'png' };
  if (model === EDIT) body.image_urls = refs;
  if (aspect) body.aspect_ratio = aspect;
  if (Number.isInteger(seed)) body.seed = seed;
  const result = await ctx.line.order({
    piece,
    provider: 'fal',
    path: model === EDIT ? EDIT : TEXT,
    body,
    results: [{ pointer: '/json/images/0/url', name: `${piece}-raw.png`, media: 'image' }],
  });
  const raw = result && result.files && result.files[`${piece}-raw.png`];
  if (!raw) throw ctx.error('provider_failed', `no image for ${piece}`);
  if (await nbIsPng(raw.path)) return raw;
  await kitFfmpeg(ctx, ['-i', raw.path, '-frames:v', '1', join(ctx.workDir, `${piece}.png`)]);
  return ctx.file(`${piece}.png`, 'image');
}

/** Runs `work` over `items`, a few at a time, keeping their order. */
async function nbEach(items, work) {
  const out = new Array(items.length);
  let next = 0;
  let failed = false;
  const lanes = Array.from({ length: Math.min(NB_AT_ONCE, items.length) }, async () => {
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

async function nbImages(inputs, ctx, manifest) {
  const model = inputs.model;
  if (!inputs.images) throw ctx.error('bad_input', 'images mode needs images (or give scenes for scenes mode)');
  for (const key of NB_SCENE_ONLY) {
    if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in scenes mode`);
  }
  if (inputs.kinds !== undefined) throw ctx.error('bad_input', 'kinds works only in products mode');
  for (const [i, img] of inputs.images.entries()) {
    const refs = img.references || [];
    if (model === EDIT && !refs.length) throw ctx.error('bad_input', `images[${i}] has no reference image for ${EDIT}`);
    if (model === TEXT && refs.length) throw ctx.error('bad_input', `images[${i}] has reference images; use ${EDIT}`);
  }
  const used = new Set();
  const images = [];
  for (const [i, img] of inputs.images.entries()) {
    const piece = kitPieceName('image', img.id, i, used);
    const file = await nbDraw(ctx, { piece, refs: model === EDIT ? img.references : null, prompt: img.prompt, aspect: inputs.aspect_ratio, seed: inputs.seed });
    images.push({ id: String(img.id ?? i + 1), image: file });
    ctx.progress({ done: i + 1, total: inputs.images.length });
  }
  return kitCheckOutputs(ctx, manifest, { images });
}

async function nbScenes(inputs, ctx, manifest) {
  const model = inputs.model;
  const anchor = inputs.anchor || 'none';
  if (inputs.images) throw ctx.error('bad_input', 'scenes mode makes its own images: give scenes or images, not both');
  if (inputs.kinds !== undefined) throw ctx.error('bad_input', 'kinds works only in products mode');
  if (!inputs.scenes) throw ctx.error('bad_input', 'scenes mode needs scenes');
  if (model === TEXT && anchor !== 'none') throw ctx.error('bad_input', `anchor ${anchor} needs ${EDIT}, which takes reference images`);
  if (model === TEXT && inputs.style_refs && inputs.style_refs.length) throw ctx.error('bad_input', `style_refs need ${EDIT}, which takes reference images`);
  const cast = inputs.cast || [];
  const keys = new Set();
  for (const m of cast) {
    if (keys.has(m.key)) throw ctx.error('bad_input', `two cast members have the key ${m.key}`);
    keys.add(m.key);
  }

  // Everything that can refuse happens before the first piece is ordered.
  let tpl;
  let jobs;
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null };
  const anchorJobs = [];
  try {
    tpl = kitStillTemplate(inputs.template ? await kitLoadTemplate(inputs.template) : null);
    jobs = kitStillJobs(tpl, inputs.scenes, { ...base, pick: inputs.pick, skip_first: inputs.skip_first, skip_last: inputs.skip_last, cast, products: inputs.products || [], multi_ref: inputs.multi_ref });
    if (model === EDIT && anchor === 'cast') {
      for (const m of kitStillAnchorMembers(jobs)) if (!m.image) anchorJobs.push({ member: m, prompt: kitStillAnchorPrompt(tpl, m, base) });
    }
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
  }
  if (!jobs.length) throw ctx.error('bad_input', 'no scene is picked for a still');
  // The strip note added later is under 600 characters.
  for (const text of [...jobs.map((j) => kitStillPrompt(j, {})), ...anchorJobs.map((a) => a.prompt)]) {
    if (text.length > NB_PROMPT_MAX - 600) throw ctx.error('bad_input', `a prompt is over ${NB_PROMPT_MAX - 600} characters`);
  }

  const used = new Set();
  for (const a of anchorJobs) a.piece = kitPieceName('anchor', a.member.key, cast.indexOf(a.member), used);
  for (const j of jobs) j.piece = kitPieceName('image', j.id, j.index, used);
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
  await nbEach(anchorJobs, async (a) => {
    const file = await nbDraw(ctx, { piece: a.piece, refs: styleRefs, prompt: a.prompt, aspect: inputs.cast_aspect_ratio || '1:1', seed: inputs.seed });
    anchors.set(a.member.key, file);
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
  const drawJob = async (job, first) => {
    let refs = { files: [], strip_at: null, names: null };
    if (model === EDIT) {
      const castFiles = kitStillCastFiles(job, anchors);
      const castRefs = kitStillWantsStrip(job, castFiles) ? [await stripFor(castFiles)] : castFiles.slice(0, 3);
      refs = kitStillRefs(job, { cast: castRefs, first, style_refs: styleRefs });
    }
    const file = await nbDraw(ctx, { piece: job.piece, refs: refs.files, prompt: kitStillPrompt(job, refs), aspect: inputs.aspect_ratio, seed: inputs.seed });
    stills.set(job.id, file);
    tick();
  };
  let rest = jobs;
  let first = null;
  if (anchor === 'first_scene') {
    await drawJob(jobs[0], null);
    first = stills.get(jobs[0].id);
    rest = jobs.slice(1);
  }
  await nbEach(rest, (job) => drawJob(job, first));

  const out = kitStillOutputs({ scenes: inputs.scenes, cast, jobs, stills, anchors });
  // All four outputs every time (empty lists without a cast), so a style can bind step.<id>.cast or .anchors.
  return kitCheckOutputs(ctx, manifest, { images: out.images, scenes: out.scenes, cast: out.cast, anchors: out.anchors });
}

/**
 * products mode: the template a kind is filled from. The style's by_tag rule
 * for the kind (matched as tags are: Snap, snap) keeps its texts; without a
 * scene text it gets the built-in one. The template's top-level scene text is
 * for scenes and is not used here. With no template the built-in negative is added.
 */
function nbKindTemplate(tpl, kind) {
  const base = tpl || { version: 1, negative: NB_KIND_NEGATIVE };
  const by = base.by_tag && typeof base.by_tag === 'object' ? base.by_tag : {};
  const key = Object.keys(by).find((k) => kitTagKey(k) === kitTagKey(kind));
  const rule = key == null ? {} : by[key];
  return { ...base, by_tag: { [kind]: { ...rule, scene: typeof rule.scene === 'string' ? rule.scene : NB_KIND_TEXT[kind] } } };
}

async function nbProducts(inputs, ctx, manifest) {
  if (inputs.model !== EDIT) throw ctx.error('bad_input', `products mode edits each product's photo, so it needs ${EDIT}`);
  for (const key of NB_NOT_PRODUCTS) {
    if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} does not work in products mode`);
  }
  const products = inputs.products || [];
  if (!products.length) throw ctx.error('bad_input', 'products mode needs products');
  const kinds = inputs.kinds || ['snap'];
  const ids = new Set();
  for (const p of products) {
    if (ids.has(p.id)) throw ctx.error('bad_input', `two products have the id ${p.id}`);
    ids.add(p.id);
    if (!Array.isArray(p.images) || !p.images.length) throw ctx.error('bad_input', `product ${p.id} has no photo to edit`);
    if (typeof p.name !== 'string' || !p.name.trim()) throw ctx.error('bad_input', `product ${p.id} has no name`);
  }

  // Every prompt is filled before the first piece is ordered.
  const jobs = [];
  try {
    const tpl = inputs.template ? await kitLoadTemplate(inputs.template) : null;
    const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null };
    for (const product of products) {
      for (const kind of kinds) {
        const id = `${product.id}-${kind}`;
        const scene = { id, line: null, on_screen: null, picture: product.name, extra: { shot: kind } };
        let filled;
        try {
          filled = kitScenePrompt(nbKindTemplate(tpl, kind), { ...base, scene, index: jobs.length, products: [product] });
        } catch (err) {
          // "scene mist-snap needs {answers.snap_surface}" reads as "the snap still of product mist needs ...".
          if (err instanceof KitPromptGap) throw new KitPromptGap(err.message.replace(`scene ${id}`, `the ${kind} still of product ${product.id}`), err);
          throw err;
        }
        const prompt = kitPromptJoin([filled.prompt, filled.negative ? `Avoid: ${filled.negative}` : '']);
        jobs.push({ id, kind, product, prompt });
      }
    }
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
  }
  for (const j of jobs) {
    if (j.prompt.length > NB_PROMPT_MAX) throw ctx.error('bad_input', `the ${j.kind} prompt for product ${j.product.id} is over ${NB_PROMPT_MAX} characters`);
  }

  const used = new Set();
  for (const [i, j] of jobs.entries()) j.piece = kitPieceName(j.kind, j.product.id, i, used);
  let done = 0;
  const files = await nbEach(jobs, async (j) => {
    const file = await nbDraw(ctx, { piece: j.piece, refs: [j.product.images[0]], prompt: j.prompt, aspect: inputs.aspect_ratio, seed: inputs.seed });
    ctx.progress({ done: ++done, total: jobs.length });
    return file;
  });
  return kitCheckOutputs(ctx, manifest, { images: jobs.map((j, i) => ({ id: j.id, image: files[i] })) });
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const mode = inputs.mode || (inputs.scenes ? 'scenes' : 'images');
  if (mode === 'products') return nbProducts(inputs, ctx, manifest);
  return mode === 'scenes' ? nbScenes(inputs, ctx, manifest) : nbImages(inputs, ctx, manifest);
}
