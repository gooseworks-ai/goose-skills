// image-gpt-image-2: photoreal stills from OpenAI GPT Image 2 on fal, one paid
// piece per image. Built for realistic people (an AI creator, a spokesperson):
// openai/gpt-image-2 draws from the prompt alone, openai/gpt-image-2/edit draws
// with reference pictures (a cast anchor, a product photo). Every piece sends
// image_size {width, height} from `size` (the text model's own default is
// landscape) and `quality`. A result whose bytes are not PNG is re-encoded.
//
// Three modes (1.0.0):
//   images  a hand-built list [{id, prompt, references}];
//   scenes  one still per picked plan scene, its prompt filled from the style's
//           template and its references picked from the plan (_lib/scene-stills.mjs,
//           shared with image-nano-banana 1.1.0);
//   cast    only the cast portraits ("anchors"): a member with an image passes
//           through free, a member without one is drawn from its look.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitLoadTemplate } from '../../_lib/prompt.mjs';
import { kitStillAnchorMembers, kitStillAnchorPrompt, kitStillCastFiles, kitStillJobs, kitStillOutputs, kitStillPrompt, kitStillRefs, kitStillStrip, kitStillTemplate, kitStillWantsStrip } from '../../_lib/scene-stills.mjs';

const EDIT = 'openai/gpt-image-2/edit';
const TEXT = 'openai/gpt-image-2';
const GI_PROMPT_MAX = 32000;
const GI_STRIP_NOTE_MAX = 600;
const GI_AT_ONCE = 4;
const GI_DEFAULT_SIZE = '1088x1920';
const GI_DEFAULT_QUALITY = 'high';
const GI_SCENE_ONLY = ['scenes', 'products', 'pick', 'skip_first', 'skip_last', 'anchor', 'multi_ref'];
const GI_NOT_IN_IMAGES = [...GI_SCENE_ONLY, 'template', 'look', 'answers', 'brand', 'cast', 'cast_size', 'style_refs'];
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
async function giDraw(ctx, { piece, refs, prompt, size, quality }) {
  kitStopIfAborted(ctx);
  const model = refs && refs.length ? EDIT : TEXT;
  const body = { prompt, image_size: giSize(size), quality, num_images: 1, output_format: 'png' };
  if (model === EDIT) body.image_urls = refs;
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

function giCheckLength(ctx, texts) {
  for (const text of texts) {
    if (text.length > GI_PROMPT_MAX - GI_STRIP_NOTE_MAX) throw ctx.error('bad_input', `a prompt is over ${GI_PROMPT_MAX - GI_STRIP_NOTE_MAX} characters`);
  }
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
    jobs = kitStillJobs(tpl, inputs.scenes, { ...base, pick: inputs.pick, skip_first: inputs.skip_first, skip_last: inputs.skip_last, cast, products: inputs.products || [], multi_ref: inputs.multi_ref });
    if (model === EDIT && anchor === 'cast') {
      for (const m of kitStillAnchorMembers(jobs)) if (!m.image) anchorJobs.push({ member: m, prompt: kitStillAnchorPrompt(tpl, m, base) });
    }
  } catch (err) {
    giRefuseGap(ctx, err);
  }
  if (!jobs.length) throw ctx.error('bad_input', 'no scene is picked for a still');
  giCheckLength(ctx, [...jobs.map((j) => kitStillPrompt(j, {})), ...anchorJobs.map((a) => a.prompt)]);

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
  const drawJob = async (job, first) => {
    let refs = { files: [], strip_at: null, names: null };
    if (model === EDIT) {
      const castFiles = kitStillCastFiles(job, anchors);
      const castRefs = kitStillWantsStrip(job, castFiles) ? [await stripFor(castFiles)] : castFiles.slice(0, 3);
      refs = kitStillRefs(job, { cast: castRefs, first, style_refs: styleRefs });
    }
    stills.set(job.id, await giDraw(ctx, { piece: job.piece, refs: refs.files, prompt: kitStillPrompt(job, refs), size: opts.size, quality: opts.quality }));
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
  return kitCheckOutputs(ctx, manifest, { images: out.images, scenes: out.scenes, cast: out.cast, anchors: out.anchors });
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const mode = inputs.mode || (inputs.scenes ? 'scenes' : inputs.images ? 'images' : inputs.cast ? 'cast' : 'images');
  const size = inputs.size || GI_DEFAULT_SIZE;
  const opts = { model: inputs.model || EDIT, size, cast_size: inputs.cast_size || size, quality: inputs.quality || GI_DEFAULT_QUALITY };
  if (mode === 'scenes') return giScenes(inputs, ctx, manifest, opts);
  if (mode === 'cast') return giCast(inputs, ctx, manifest, opts);
  return giImages(inputs, ctx, manifest, opts);
}
