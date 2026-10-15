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
//
// 1.2.2: in scenes mode a scene with image_locked: true keeps its own image as
// its still, ordering nothing (a preview the customer already approved).
//
// 1.2.3: in scenes and products mode (borders: 'fix', the default) each product
// photo's flat margins are trimmed before it is sent, and a finished still that
// came back letterboxed, padded or framed is cropped, or fails the step, never
// drawn again (_lib/scene-stills.mjs kitStillWithoutBorders). borders: 'keep'
// turns both off.
//
// 1.3.0: model may be Nano Banana Pro (fal-ai/nano-banana-pro, /edit with
// references), which renders at 1K or 2K (resolution). The base model's stills
// are about 768 px wide, too small for real skin on a person; Pro at 2K showed
// pores, acne scars and real texture where the base model stayed smooth
// (recipe audit, 2026-10-14). A run uses one family: the prompt-only and /edit
// paths of the model it names. Everything else is unchanged.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitLoadTemplate, kitPromptJoin, kitScenePrompt } from '../../_lib/prompt.mjs';
import { kitPickScenes, kitTagKey } from '../../_lib/scene-match.mjs';
import { kitStillAnchorMembers, kitStillAnchorPrompt, kitStillCastFiles, kitStillJobs, kitStillOutputs, kitStillPrompt, kitStillRefs, kitStillStrip, kitStillTemplate, kitStillTrimJobs, kitStillTrimProducts, kitStillWantsStrip, kitStillWithoutBorders } from '../../_lib/scene-stills.mjs';

const EDIT = 'fal-ai/nano-banana/edit';
const TEXT = 'fal-ai/nano-banana';
const PRO_EDIT = 'fal-ai/nano-banana-pro/edit';
const PRO_TEXT = 'fal-ai/nano-banana-pro';

/** The run's model family from inputs.model: its prompt-only and /edit paths, and Pro's resolution. */
function nbLine(inputs) {
  const pro = inputs.model === PRO_TEXT || inputs.model === PRO_EDIT;
  return { pro, text: pro ? PRO_TEXT : TEXT, edit: pro ? PRO_EDIT : EDIT, resolution: pro ? inputs.resolution || null : null };
}
const nbIsEdit = (model) => model === EDIT || model === PRO_EDIT;
const NB_PROMPT_MAX = 12000;
const NB_AT_ONCE = 4;
const NB_LOCKED_MIME = ['image/png', 'image/jpeg', 'image/webp'];
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

// The kit's log redactor misses structured secrets and signed links, so a refusal's logged values pass here first.
const NB_SECRET_NAME = /key|token|secret|signature|authori[sz]ation|password|passwd|credential|cookie/i;
const NB_LINK = /\b[a-z][a-z0-9+.-]*:\/\/[^\s"'<>`]+/gi;
const NB_LOG_TEXT_MAX = 600;

/** Text for the run log: links keep only their origin and path; auth headers, bearer tokens and name=secret pairs are blanked. */
function nbSafeText(text) {
  return String(text)
    .replace(NB_LINK, (link) => {
      try {
        const u = new URL(link);
        return `${u.protocol}//${u.host}${u.pathname}`;
      } catch {
        return '[link]';
      }
    })
    .replace(/\b((?:proxy-)?authori[sz]ation["']?\s*[:=]\s*["']?)(?:(?:Bearer|Basic|Key|Token)\s+)?[^\s"',;}]+/gi, '$1[redacted]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/g, 'Bearer [redacted]')
    .replace(/\b([A-Za-z0-9_-]*?(?:key|token|secret|signature|password|passwd|credentials?)(?:[_-][A-Za-z0-9]+)*["']?\s*[:=]\s*["']?)[^\s"'&,;}]+/gi, '$1[redacted]')
    .slice(0, NB_LOG_TEXT_MAX);
}

/** A JSON value for the run log: secret-named fields blanked, every string through nbSafeText, size bounded. */
function nbSafeValue(value, depth = 0) {
  if (typeof value === 'string') return nbSafeText(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value === null || typeof value !== 'object') return null;
  if (depth >= 4) return '[nested]';
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => nbSafeValue(v, depth + 1));
  const out = {};
  for (const [name, v] of Object.entries(value).slice(0, 20)) out[name] = NB_SECRET_NAME.test(name) ? '[redacted]' : nbSafeValue(v, depth + 1);
  return out;
}

/**
 * Logs a refused still: what it was for, the piece, the model, the reference count, the reason and the
 * prompt's start. The reason is the line's own words (the provider's, when the line passes them on), else
 * the error's detail or message, else null. Never throws, so the refusal itself is what the step fails with.
 */
function nbLogRefusal(ctx, err, { piece, about, model, refs, prompt }) {
  try {
    const line = err.line && typeof err.line === 'object' ? err.line : {};
    const message = err.message !== err.code ? err.message : null;
    const said = [line.error, err.detail, message].find((s) => typeof s === 'string' && s.trim());
    const fields = {
      piece,
      model,
      references: Array.isArray(refs) ? refs.length : 0,
      reason: said ? nbSafeText(said.trim()) : null,
      prompt: nbSafeText(prompt ?? ''),
    };
    if (line.details && typeof line.details === 'object' && !Array.isArray(line.details)) fields.details = nbSafeValue(line.details);
    ctx.log.warn(`the image maker refused ${about || piece}`, fields);
  } catch {
    // A log that can't be written must not hide the refusal.
  }
}

/**
 * One paid still: `refs` go to /edit; without refs the prompt-only model draws it. `about` says in plain
 * words what the still is for (a cast member, a scene, a product); a refused still is logged with it, so
 * the log names the piece the plan has to change.
 */
async function nbDraw(ctx, { line, piece, refs, prompt, aspect, seed, about }) {
  kitStopIfAborted(ctx);
  const withRefs = Boolean(refs && refs.length);
  const model = withRefs ? line.edit : line.text;
  const body = { prompt, num_images: 1, output_format: 'png' };
  if (withRefs) body.image_urls = refs;
  if (aspect) body.aspect_ratio = aspect;
  if (line.resolution) body.resolution = line.resolution;
  if (Number.isInteger(seed)) body.seed = seed;
  let result;
  try {
    const results = [{ pointer: '/json/images/0/url', name: `${piece}-raw.png`, media: 'image' }];
    // One order per model family, each naming its own two paths, so every paid path is a listed constant.
    result = line.pro
      ? await ctx.line.order({ piece, provider: 'fal', path: withRefs ? PRO_EDIT : PRO_TEXT, body, results })
      : await ctx.line.order({ piece, provider: 'fal', path: withRefs ? EDIT : TEXT, body, results });
  } catch (err) {
    if (err && err.code === 'provider_rejected') nbLogRefusal(ctx, err, { piece, about, model, refs, prompt });
    throw err;
  }
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
  const line = nbLine(inputs);
  if (!inputs.images) throw ctx.error('bad_input', 'images mode needs images (or give scenes for scenes mode)');
  for (const key of NB_SCENE_ONLY) {
    if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in scenes mode`);
  }
  if (inputs.kinds !== undefined) throw ctx.error('bad_input', 'kinds works only in products mode');
  if (inputs.borders !== undefined) throw ctx.error('bad_input', 'borders works only in scenes and products mode');
  for (const [i, img] of inputs.images.entries()) {
    const refs = img.references || [];
    if (nbIsEdit(model) && !refs.length) throw ctx.error('bad_input', `images[${i}] has no reference image for ${line.edit}`);
    if (!nbIsEdit(model) && refs.length) throw ctx.error('bad_input', `images[${i}] has reference images; use ${line.edit}`);
  }
  const used = new Set();
  const images = [];
  for (const [i, img] of inputs.images.entries()) {
    const piece = kitPieceName('image', img.id, i, used);
    const file = await nbDraw(ctx, { line, piece, refs: nbIsEdit(model) ? img.references : null, prompt: img.prompt, aspect: inputs.aspect_ratio, seed: inputs.seed, about: `image ${img.id ?? i + 1}` });
    images.push({ id: String(img.id ?? i + 1), image: file });
    ctx.progress({ done: i + 1, total: inputs.images.length });
  }
  return kitCheckOutputs(ctx, manifest, { images });
}

async function nbScenes(inputs, ctx, manifest) {
  const model = inputs.model;
  const line = nbLine(inputs);
  const anchor = inputs.anchor || 'none';
  if (inputs.images) throw ctx.error('bad_input', 'scenes mode makes its own images: give scenes or images, not both');
  if (inputs.kinds !== undefined) throw ctx.error('bad_input', 'kinds works only in products mode');
  if (!inputs.scenes) throw ctx.error('bad_input', 'scenes mode needs scenes');
  if (!nbIsEdit(model) && anchor !== 'none') throw ctx.error('bad_input', `anchor ${anchor} needs ${line.edit}, which takes reference images`);
  if (!nbIsEdit(model) && inputs.style_refs && inputs.style_refs.length) throw ctx.error('bad_input', `style_refs need ${line.edit}, which takes reference images`);
  const cast = inputs.cast || [];
  const keys = new Set();
  for (const m of cast) {
    if (keys.has(m.key)) throw ctx.error('bad_input', `two cast members have the key ${m.key}`);
    keys.add(m.key);
  }
  for (const s of inputs.scenes) {
    if (s.image_locked === true && !s.image) throw ctx.error('bad_input', `scene ${s.id} is marked image_locked but has no image`);
  }
  const locked = (job) => job.scene.image_locked === true;
  const fix = (inputs.borders || 'fix') === 'fix';
  // scene_stills false draws the cast anchors only. A second picture drawn from a drawn portrait came back worse
  // each time (sharper, the product dropped, coarse fabric), and a take that reads references needs none.
  const sceneStills = inputs.scene_stills !== false;
  if (!sceneStills && anchor !== 'cast') throw ctx.error('bad_input', 'scene_stills false needs anchor cast: it draws only the cast portraits');

  // Everything that can refuse happens before the first piece is ordered.
  let tpl;
  let jobs;
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null };
  const anchorJobs = [];
  try {
    tpl = kitStillTemplate(inputs.template ? await kitLoadTemplate(inputs.template) : null);
    // A locked scene is never redrawn, so only the other picked scenes get a prompt (and can refuse).
    const picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
    const open = picked.filter((p) => p.scene.image_locked !== true);
    const filled = kitStillJobs(tpl, open.map((p) => p.scene), { ...base, cast, products: inputs.products || [], multi_ref: inputs.multi_ref });
    filled.forEach((j, i) => {
      j.index = open[i].index;
    });
    const byIndex = new Map(filled.map((j) => [j.index, j]));
    jobs = picked.map((p) => byIndex.get(p.index) || { id: String(p.scene.id), index: p.index, scene: p.scene, prompt: '', negative: '', tag: null, cast: [], strip: false, products: [], scene_image: null });
    const ids = new Set();
    for (const j of jobs) {
      if (ids.has(j.id)) throw new Error(`two scenes have the id ${j.id}`);
      ids.add(j.id);
    }
    if (nbIsEdit(model) && anchor === 'cast') {
      for (const m of kitStillAnchorMembers(jobs.filter((j) => !locked(j)))) if (!m.image) anchorJobs.push({ member: m, prompt: kitStillAnchorPrompt(tpl, m, base) });
    }
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
  }
  if (!jobs.length) throw ctx.error('bad_input', 'no scene is picked for a still');
  for (const s of inputs.scenes) {
    if (s.image_locked === true && !jobs.some((j) => j.id === s.id)) ctx.log.warn(`scene ${s.id} is image_locked but this step does not pick it`);
  }
  // The strip note added later is under 600 characters.
  for (const text of [...jobs.filter((j) => !locked(j)).map((j) => kitStillPrompt(j, {})), ...anchorJobs.map((a) => a.prompt)]) {
    if (text.length > NB_PROMPT_MAX - 600) throw ctx.error('bad_input', `a prompt is over ${NB_PROMPT_MAX - 600} characters`);
  }

  const used = new Set();
  for (const a of anchorJobs) a.piece = kitPieceName('anchor', a.member.key, cast.indexOf(a.member), used);
  for (const j of jobs) j.piece = kitPieceName('image', j.id, j.index, used);
  if (!sceneStills && !anchorJobs.length) throw ctx.error('bad_input', 'scene_stills is false but no picked scene names a cast member without a picture, so there is nothing to draw');
  const total = anchorJobs.length + (sceneStills ? jobs.length : 0);
  let done = 0;
  const tick = () => ctx.progress({ done: ++done, total });
  if (!nbIsEdit(model) && jobs.some((j) => j.cast.length || j.products.length || j.scene_image)) {
    ctx.log.info(`${line.text} draws from the prompt alone, so scene references are not sent`);
  }

  // Product photos lose their flat margins before any still sends them (free).
  if (sceneStills && fix && nbIsEdit(model)) kitStillTrimJobs(jobs, await kitStillTrimProducts(ctx, inputs.products || []));

  // 1. Cast anchors: members with an image pass through free.
  const anchors = new Map();
  for (const m of cast) if (m.image) anchors.set(m.key, m.image);
  const styleRefs = nbIsEdit(model) ? inputs.style_refs || [] : [];
  await nbEach(anchorJobs, async (a) => {
    const file = await nbDraw(ctx, { line, piece: a.piece, refs: styleRefs, prompt: a.prompt, aspect: inputs.cast_aspect_ratio || '1:1', seed: inputs.seed, about: `the character picture of ${a.member.name || a.member.key} (cast)` });
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
    if (locked(job)) {
      kitStopIfAborted(ctx);
      // Kept pixel for pixel; a picture the motion parts cannot read (AVIF, HEIC, GIF) becomes a PNG, free.
      let file = job.scene.image;
      if (!NB_LOCKED_MIME.includes(file.mime)) {
        await kitFfmpeg(ctx, ['-i', file.path, '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, `${job.piece}.png`)]);
        file = await ctx.file(`${job.piece}.png`, 'image');
      }
      stills.set(job.id, file);
      tick();
      return;
    }
    let refs = { files: [], strip_at: null, names: null };
    if (nbIsEdit(model)) {
      const castFiles = kitStillCastFiles(job, anchors);
      const castRefs = kitStillWantsStrip(job, castFiles) ? [await stripFor(castFiles)] : castFiles.slice(0, 3);
      refs = kitStillRefs(job, { cast: castRefs, first, style_refs: styleRefs });
    }
    const about = `the still for scene ${job.id}`;
    const drawn = await nbDraw(ctx, { line, piece: job.piece, refs: refs.files, prompt: kitStillPrompt(job, refs), aspect: inputs.aspect_ratio, seed: inputs.seed, about });
    const file = fix
      ? (await kitStillWithoutBorders(ctx, { file: drawn, name: job.piece, about, refusal: `The picture for scene ${job.index + 1} came back with a border; change the scene picture and try again.` })).file
      : drawn;
    stills.set(job.id, file);
    tick();
  };
  let rest = jobs;
  let first = null;
  if (!sceneStills) rest = [];
  else if (anchor === 'first_scene') {
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
  const line = nbLine(inputs);
  if (!nbIsEdit(inputs.model)) throw ctx.error('bad_input', `products mode edits each product's photo, so it needs ${line.edit}`);
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
  const fix = (inputs.borders || 'fix') === 'fix';
  for (const j of jobs) {
    if (j.prompt.length > NB_PROMPT_MAX) throw ctx.error('bad_input', `the ${j.kind} prompt for product ${j.product.id} is over ${NB_PROMPT_MAX} characters`);
  }

  const used = new Set();
  for (const [i, j] of jobs.entries()) j.piece = kitPieceName(j.kind, j.product.id, i, used);
  // Each photo loses its flat margins once before any still sends it (free).
  const trimmed = fix ? await kitStillTrimProducts(ctx, products) : new Map();
  let done = 0;
  const files = await nbEach(jobs, async (j) => {
    const photo = (trimmed.get(String(j.product.id)) || j.product).images[0];
    const about = `the ${j.kind} still of ${j.product.name}`;
    const drawn = await nbDraw(ctx, { line, piece: j.piece, refs: [photo], prompt: j.prompt, aspect: inputs.aspect_ratio, seed: inputs.seed, about });
    const file = fix
      ? (await kitStillWithoutBorders(ctx, { file: drawn, name: j.piece, about, refusal: `The picture of ${j.product.name} came back with a border; change its photo and try again.` })).file
      : drawn;
    ctx.progress({ done: ++done, total: jobs.length });
    return file;
  });
  return kitCheckOutputs(ctx, manifest, { images: jobs.map((j, i) => ({ id: j.id, image: files[i] })) });
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  if (inputs.resolution !== undefined && nbLine(inputs).resolution === null) {
    throw ctx.error('bad_input', `resolution works only with ${PRO_TEXT} and ${PRO_EDIT}; ${inputs.model} has one size`);
  }
  const mode = inputs.mode || (inputs.scenes ? 'scenes' : 'images');
  if (mode === 'products') return nbProducts(inputs, ctx, manifest);
  return mode === 'scenes' ? nbScenes(inputs, ctx, manifest) : nbImages(inputs, ctx, manifest);
}
