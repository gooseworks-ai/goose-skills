// H3 Max scene clips with native dialogue, or silent copies for later narration.
// The scene, template, and take planning follows video-seedance-2 1.2.0, but
// every paid piece uses H3 Max's own request contract. All prompts, references,
// modes, and limits are checked before the first order. Generic scenes may
// include multiple speakers; creator-h3 remains the single-creator talk part.
// Mode stills (stills.mjs) moves a picture step's scene stills, timed to the
// voice, the way video-veo-3 and video-kling do.
import { kitCheckInputs, kitCheckOutputs, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitLoadTemplate, kitPromptJoin, kitScenePrompt } from '../../_lib/prompt.mjs';
import { kitNamedProducts, kitPickScenes, kitTagKey } from '../../_lib/scene-match.mjs';
import { h3SceneRunTakes, h3SceneTakeJobs } from './takes.mjs';
import { H3SCENE_MODEL, h3SceneProviderBody, h3SceneProviderPrompt, h3SceneProviderVideo } from './provider.mjs';
import { h3ScenePrepareFrames, h3ScenePrepareReferences } from './frames.mjs';
import { H3STILLS_ONLY, h3StillsRun } from './stills.mjs';

const H3SCENE_PROMPT_MAX = 12000;
const H3SCENE_MAX_REFS = 9;
const H3SCENE_MAX_CLIPS = 12;
const H3SCENE_DEFAULT_SECONDS = 5;
const H3SCENE_SCENE_ONLY = ['pick', 'skip_first', 'skip_last', 'seconds'];
// Inputs that only the take modes read, and the modes each one needs.
const H3SCENE_TAKE_ONLY = {
  takes: ['takes'],
  chain: ['takes'],
  off_screen_lines: ['take'],
  off_screen_tags: ['take'],
  words_per_second: ['take', 'takes'],
  max_words: ['take', 'takes'],
  pronunciations: ['take', 'takes'],
};
// Context inputs make clip placeholders filled or refused. A plain clip list
// with no plan or template context keeps literal braces as authored.
const H3SCENE_NEW_INPUTS = ['mode', 'seed', 'template', 'look', 'answers', 'brand', 'cast', 'products', 'scenes'];
// The template key a clip's own prompt is filled under; templates keys are words, so it never collides.
const H3SCENE_OWN = ' clip prompt';
// Anything left that looks like a placeholder after filling ({Answers.x}, {answers.a.b}) is a typo.
const H3SCENE_PLACEHOLDER_LIKE = /\{[A-Za-z][A-Za-z0-9_.-]*\??\}/;

function h3SceneIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

function h3SceneFirstPhoto(products) {
  for (const p of products || []) {
    if (p && Array.isArray(p.images) && h3SceneIsFile(p.images[0])) return p.images[0];
  }
  return null;
}

/** The references the template's refs picked: named members' pictures, product photos, the scene's picture. */
function h3ScenePlanRefs(refs, kinds) {
  const out = [];
  for (const kind of kinds) {
    if (kind === 'anchor') for (const m of refs.cast) if (h3SceneIsFile(m.image)) out.push(m.image);
    if (kind === 'product') for (const p of refs.products) if (h3SceneIsFile(p.images[0])) out.push(p.images[0]);
    if (kind === 'scene_image' && refs.scene_image) out.push(refs.scene_image);
  }
  if (out.length > H3SCENE_MAX_REFS) throw new Error(`the template picked ${out.length} reference images; H3 Max accepts at most ${H3SCENE_MAX_REFS}`);
  return out;
}

/** One clip's prompt, filled from the template and the plan. `own` is the clip's own prompt text, if any. */
function h3ScenePrompt(tpl, base, { scene, index, own, use, who, requirePlanProduct = true }) {
  const t = own == null ? tpl : { ...tpl, templates: { ...(tpl.templates || {}), [H3SCENE_OWN]: own } };
  let out;
  try {
    out = kitScenePrompt(t, { ...base, scene, index }, { use: own == null ? use : H3SCENE_OWN });
  } catch (err) {
    if (err instanceof KitPromptGap) throw new KitPromptGap(err.message.replace(/^scene \S+/, who), err);
    throw new Error(`${who}: ${err.message}`);
  }
  const prompt = out.negative ? kitPromptJoin([out.prompt, `Avoid: ${out.negative}`]) : out.prompt;
  const left = H3SCENE_PLACEHOLDER_LIKE.exec(prompt);
  if (left) throw new KitPromptGap(`${who} has an unknown placeholder ${left[0]}`, { placeholder: left[0], scene_id: scene.id });
  const ruleKey = out.tag && tpl.by_tag ? Object.keys(tpl.by_tag).find((key) => kitTagKey(key) === kitTagKey(out.tag)) : null;
  const rule = ruleKey ? tpl.by_tag[ruleKey] : null;
  const refKinds = Array.isArray(rule && rule.refs) ? rule.refs : Array.isArray(tpl.refs) ? tpl.refs : ['anchor', 'product', 'scene_image'];
  const explicitRefs = Array.isArray(rule && rule.refs) || Array.isArray(tpl.refs);
  if (requirePlanProduct && explicitRefs && refKinds.includes('product') && !out.refs.products.some((p) => h3SceneIsFile(p.images && p.images[0]))) {
    throw new Error(`${who} requests a product reference, but no matching product has a photo; name the product in its picture or line and supply its photo`);
  }
  return { prompt, refs: out.refs, refKinds };
}

/** The use for a clip with no prompt of its own: templates.<id>, else motion, else scene. */
function h3SceneUse(tpl, id) {
  if (id != null && tpl.templates && typeof tpl.templates[id] === 'string') return id;
  return typeof tpl.motion === 'string' ? 'motion' : 'scene';
}

/** Every job, refused here before any piece is ordered: [{id, index, prompt, seconds, audio, refs?, start?, end?}]. */
function h3SceneJobs(inputs, tpl, i2v) {
  const products = inputs.products || [];
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null, cast: inputs.cast || [], products };
  const fill = Boolean(inputs.template);
  const context = H3SCENE_NEW_INPUTS.some((key) => inputs[key] != null)
    || (inputs.clips || []).some((c) => c.start_image !== undefined || c.end_image !== undefined);
  const jobs = [];
  if (inputs.clips) {
    const byId = new Map((inputs.scenes || []).map((s) => [s.id, s]));
    for (const [i, clip] of inputs.clips.entries()) {
      const id = clip.id != null ? clip.id : null;
      const who = `clip ${id ?? i + 1}`;
      const scene = (id != null && byId.get(id)) || { id: id ?? String(i + 1) };
      const own = clip.prompt;
      if (own == null && !fill) throw new Error(`${who} needs a prompt (or give a template)`);
      if (i2v && clip.references) throw new Error(`${who}: references are for mode reference; image_to_video takes start_image`);
      if (!i2v && (clip.start_image !== undefined || clip.end_image !== undefined)) throw new Error(`${who}: start_image and end_image need mode image_to_video`);
      // A plain clip list can contain literal braces; plan-backed clips are filled.
      const filled = fill || (context && H3SCENE_PLACEHOLDER_LIKE.test(own))
        ? h3ScenePrompt(tpl, base, { scene, index: i, own, use: h3SceneUse(tpl, id), who, requirePlanProduct: !clip.references && clip.start_image === undefined })
        : { prompt: own, refs: null };
      jobs.push({ id, index: i, who, scene, prompt: filled.prompt, planRefs: filled.refs, refKinds: filled.refKinds, seconds: clip.seconds, audio: clip.generate_audio, clip });
    }
  } else {
    const picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
    if (!picked.length) throw new Error('no scene is picked for a clip');
    if (picked.length > H3SCENE_MAX_CLIPS) throw new Error(`${picked.length} scenes are picked; one run makes at most ${H3SCENE_MAX_CLIPS} clips`);
    const use = h3SceneUse(tpl, null);
    for (const { scene, index } of picked) {
      const who = `scene ${scene.id}`;
      const filled = h3ScenePrompt(tpl, base, { scene, index, own: null, use, who });
      jobs.push({ id: scene.id, index, who, scene, prompt: filled.prompt, planRefs: filled.refs, refKinds: filled.refKinds, seconds: inputs.seconds ?? H3SCENE_DEFAULT_SECONDS, audio: undefined, clip: {} });
    }
  }
  for (const j of jobs) {
    if (!j.prompt) throw new Error(`${j.who} has an empty prompt`);
    if (j.prompt.length > H3SCENE_PROMPT_MAX) throw new Error(`${j.who}'s prompt is ${j.prompt.length} characters, over ${H3SCENE_PROMPT_MAX}`);
    if (i2v) {
      const want = j.clip.start_image;
      if (want === 'product') {
        // The product the scene names (whatever the template's refs pick), else the first with a photo.
        j.start = h3SceneFirstPhoto(kitNamedProducts(j.scene, products)) || h3SceneFirstPhoto(products);
        if (!j.start) throw new Error(`${j.who} starts on the product, but no product has a photo`);
      } else if (h3SceneIsFile(want)) {
        j.start = want;
      } else {
        const r = j.planRefs;
        j.start = r ? r.scene_image || h3SceneFirstPhoto(r.products) || (r.cast.find((m) => h3SceneIsFile(m.image)) || {}).image || null : null;
        if (!j.start) throw new Error(`${j.who} needs a start_image: no scene picture, product photo or cast picture to start from`);
      }
      const end = j.clip.end_image;
      j.end = end === 'start' ? j.start : h3SceneIsFile(end) ? end : null;
    } else {
      j.refs = j.clip.references || (j.planRefs ? h3ScenePlanRefs(j.planRefs, j.refKinds) : []);
      if (!j.refs.length) throw new Error(`${j.who} has no reference image: give references, or products, cast or scene pictures the template's refs can use`);
    }
    j.prompt = h3SceneProviderPrompt(j.prompt, i2v ? 1 : j.refs.length, j.who);
  }
  return jobs;
}

/** Mode take or takes: every take's prompt written before the first piece, then the takes in order. */
async function h3SceneRunTakeMode(inputs, ctx, manifest) {
  if (inputs.clips) throw ctx.error('bad_input', `mode ${inputs.mode} writes its own prompt from scenes; clips are for modes reference and image_to_video`);
  if (!inputs.scenes) throw ctx.error('bad_input', `mode ${inputs.mode} needs scenes`);
  let jobs;
  try {
    const tpl = inputs.template ? await kitLoadTemplate(inputs.template) : { version: 1 };
    jobs = h3SceneTakeJobs(inputs, tpl);
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', String((err && err.message) || err));
  }
  await h3ScenePrepareReferences(ctx, jobs);
  return kitCheckOutputs(ctx, manifest, await h3SceneRunTakes(inputs, ctx, jobs));
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const mode = inputs.mode ?? 'reference';
  for (const [key, modes] of Object.entries(H3SCENE_TAKE_ONLY)) {
    if (inputs[key] !== undefined && !modes.includes(mode)) throw ctx.error('bad_input', `${key} works only in mode ${modes.join(' or ')}`);
  }
  if (mode !== 'stills') {
    for (const key of H3STILLS_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in mode stills`);
  }
  if (mode === 'stills') return h3StillsRun(inputs, ctx, manifest);
  if (mode === 'take' || mode === 'takes') return h3SceneRunTakeMode(inputs, ctx, manifest);
  const i2v = mode === 'image_to_video';
  if (!inputs.clips && !inputs.scenes) throw ctx.error('bad_input', 'give clips, or scenes for one clip per scene');
  if (inputs.clips) {
    for (const key of H3SCENE_SCENE_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only without clips (one clip per scene)`);
  }

  let jobs;
  try {
    const tpl = inputs.template ? await kitLoadTemplate(inputs.template) : { version: 1 };
    jobs = h3SceneJobs(inputs, tpl, i2v);
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', String((err && err.message) || err));
  }

  if (i2v) await h3ScenePrepareFrames(inputs, ctx, jobs);
  else await h3ScenePrepareReferences(ctx, jobs);
  const used = new Set();
  for (const j of jobs) j.piece = kitPieceName('clip', j.id, j.index, used);
  const clips = [];
  for (const [n, j] of jobs.entries()) {
    kitStopIfAborted(ctx);
    const piece = j.piece;
    const audio = j.audio ?? inputs.generate_audio ?? true;
    const body = h3SceneProviderBody(inputs, j, i2v ? [j.start] : j.refs, ctx.seed(piece) % 2147483647);
    const result = await ctx.line.order({ piece, provider: 'fal', path: H3SCENE_MODEL, body, results: [{ pointer: '/json/video/url', name: `${piece}.mp4`, media: 'video' }] });
    const file = result && result.files && result.files[`${piece}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    const ready = await h3SceneProviderVideo(ctx, file, piece, audio);
    clips.push({ id: String(j.id ?? j.index + 1), video: ready.file, seconds: j.seconds });
    ctx.progress({ done: n + 1, total: jobs.length });
  }
  return kitCheckOutputs(ctx, manifest, { clips, video: clips[0].video });
}
