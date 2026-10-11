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
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitLoadTemplate } from '../../_lib/prompt.mjs';
import { kitStillAnchorMembers, kitStillAnchorPrompt, kitStillCastFiles, kitStillJobs, kitStillOutputs, kitStillPrompt, kitStillRefs, kitStillStrip, kitStillTemplate, kitStillWantsStrip } from '../../_lib/scene-stills.mjs';

const EDIT = 'fal-ai/nano-banana/edit';
const TEXT = 'fal-ai/nano-banana';
const NB_PROMPT_MAX = 12000;
const NB_AT_ONCE = 4;
const NB_SCENE_ONLY = ['scenes', 'template', 'look', 'answers', 'cast', 'products', 'brand', 'pick', 'skip_first', 'skip_last', 'anchor', 'cast_aspect_ratio', 'style_refs', 'multi_ref'];

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
  const result = { images: out.images, scenes: out.scenes };
  if (inputs.cast) {
    result.cast = out.cast;
    result.anchors = out.anchors;
  }
  return kitCheckOutputs(ctx, manifest, result);
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const mode = inputs.mode || (inputs.scenes ? 'scenes' : 'images');
  return mode === 'scenes' ? nbScenes(inputs, ctx, manifest) : nbImages(inputs, ctx, manifest);
}
