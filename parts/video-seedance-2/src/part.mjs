// video-seedance-2: short clips from ByteDance Seedance 2.0 on fal, one paid
// piece per clip (D6: short scenes with native audio; creator-h3 is the default
// for scripted lines). A policy refusal (likeness of a real person, partner
// validation) is final for that exact clip: the line says so and the kit never
// resubmits it.
//
// Two models (mode, 1.1.0):
//   reference       bytedance/seedance-2.0/reference-to-video: the
//                   create-video-seedance-2-fal atom's request {prompt,
//                   image_urls (1 to 9, the first is @Image1), resolution,
//                   duration (an integer, 4 to 15), aspect_ratio,
//                   generate_audio, seed}. Unchanged from 1.0.1, so a 1.0.1
//                   clip list orders byte-identical pieces.
//   image_to_video  bytedance/seedance-2.0/image-to-video: {prompt, image_url
//                   (the start frame), end_image_url?, resolution, duration
//                   (a string "4".."15", as fal's schema and the shipped
//                   hypermotion call send it), aspect_ratio, generate_audio,
//                   seed}. The street-interview runs send seed to Seedance and
//                   get it honoured, though fal's schemas do not list it.
//
// Two lists:
//   clips   a hand-built list (the 1.0.1 behaviour), with prompts that may use
//           template placeholders ({answers.KEY}, {product.name}, ...);
//   scenes  without clips, one clip per picked plan scene, its prompt filled
//           from the style's template (motion, else scene).
// Every prompt is filled, and every reference and start frame found, before the
// first piece is ordered, so a missing answer refuses the step for free.
import { kitCheckInputs, kitCheckOutputs, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitLoadTemplate, kitPromptJoin, kitScenePrompt } from '../../_lib/prompt.mjs';
import { kitPickScenes } from '../../_lib/scene-match.mjs';

const REF = 'bytedance/seedance-2.0/reference-to-video';
const I2V = 'bytedance/seedance-2.0/image-to-video';
const SD_PROMPT_MAX = 12000;
const SD_MAX_REFS = 9;
const SD_MAX_CLIPS = 12;
const SD_DEFAULT_SECONDS = 5;
const SD_SCENE_ONLY = ['pick', 'skip_first', 'skip_last', 'seconds'];
// The 1.1.0 inputs that turn on placeholder filling in a clip's own prompt (with template).
const SD_FILL_INPUTS = ['look', 'answers', 'brand', 'cast', 'products', 'scenes'];
// The template key a clip's own prompt is filled under; templates keys are words, so it never collides.
const SD_OWN = ' clip prompt';
// Anything left that looks like a placeholder after filling ({Answers.x}, {answers.a.b}) is a typo.
const SD_PLACEHOLDER_LIKE = /\{[A-Za-z][A-Za-z0-9_.-]*\??\}/;

function sdIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

function sdFirstPhoto(products) {
  for (const p of products || []) {
    if (p && Array.isArray(p.images) && sdIsFile(p.images[0])) return p.images[0];
  }
  return null;
}

/** The references the template's refs picked: named members' pictures, product photos, the scene's picture. */
function sdPlanRefs(refs) {
  const out = [];
  for (const m of refs.cast) if (sdIsFile(m.image)) out.push(m.image);
  for (const p of refs.products) if (sdIsFile(p.images[0])) out.push(p.images[0]);
  if (refs.scene_image) out.push(refs.scene_image);
  return out.slice(0, SD_MAX_REFS);
}

/** One clip's prompt, filled from the template and the plan. `own` is the clip's own prompt text, if any. */
function sdPrompt(tpl, base, { scene, index, own, use, who }) {
  const t = own == null ? tpl : { ...tpl, templates: { ...(tpl.templates || {}), [SD_OWN]: own } };
  let out;
  try {
    out = kitScenePrompt(t, { ...base, scene, index }, { use: own == null ? use : SD_OWN });
  } catch (err) {
    if (err instanceof KitPromptGap) throw new KitPromptGap(err.message.replace(/^scene \S+/, who), err);
    throw new Error(`${who}: ${err.message}`);
  }
  const prompt = out.negative ? kitPromptJoin([out.prompt, `Avoid: ${out.negative}`]) : out.prompt;
  const left = SD_PLACEHOLDER_LIKE.exec(prompt);
  if (left) throw new KitPromptGap(`${who} has an unknown placeholder ${left[0]}`, { placeholder: left[0], scene_id: scene.id });
  return { prompt, refs: out.refs };
}

/** The use for a clip with no prompt of its own: templates.<id>, else motion, else scene. */
function sdUse(tpl, id) {
  if (id != null && tpl.templates && typeof tpl.templates[id] === 'string') return id;
  return typeof tpl.motion === 'string' ? 'motion' : 'scene';
}

/** Every job, refused here before any piece is ordered: [{id, index, prompt, seconds, audio, refs?, start?, end?}]. */
function sdJobs(inputs, tpl, i2v) {
  const products = inputs.products || [];
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null, cast: inputs.cast || [], products };
  const fill = Boolean(inputs.template);
  const context = SD_FILL_INPUTS.some((key) => inputs[key] != null);
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
      // A 1.0.1 call (no template and none of the fill inputs) sends its prompt as written, braces and
      // all, so its piece is unchanged; placeholders are filled only once the caller gives a fill input.
      const filled = fill || (context && SD_PLACEHOLDER_LIKE.test(own))
        ? sdPrompt(tpl, base, { scene, index: i, own, use: sdUse(tpl, id), who })
        : { prompt: own, refs: null };
      jobs.push({ id, index: i, who, prompt: filled.prompt, planRefs: filled.refs, seconds: clip.seconds, audio: clip.generate_audio, clip });
    }
  } else {
    const picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
    if (!picked.length) throw new Error('no scene is picked for a clip');
    if (picked.length > SD_MAX_CLIPS) throw new Error(`${picked.length} scenes are picked; one run makes at most ${SD_MAX_CLIPS} clips`);
    const use = sdUse(tpl, null);
    for (const { scene, index } of picked) {
      const who = `scene ${scene.id}`;
      const filled = sdPrompt(tpl, base, { scene, index, own: null, use, who });
      jobs.push({ id: scene.id, index, who, prompt: filled.prompt, planRefs: filled.refs, seconds: inputs.seconds ?? SD_DEFAULT_SECONDS, audio: undefined, clip: {} });
    }
  }
  for (const j of jobs) {
    if (!j.prompt) throw new Error(`${j.who} has an empty prompt`);
    if (j.prompt.length > SD_PROMPT_MAX) throw new Error(`${j.who}'s prompt is ${j.prompt.length} characters, over ${SD_PROMPT_MAX}`);
    if (i2v) {
      const want = j.clip.start_image;
      if (want === 'product') {
        j.start = (j.planRefs && sdFirstPhoto(j.planRefs.products)) || sdFirstPhoto(products);
        if (!j.start) throw new Error(`${j.who} starts on the product, but no product has a photo`);
      } else if (sdIsFile(want)) {
        j.start = want;
      } else {
        const r = j.planRefs;
        j.start = r ? r.scene_image || sdFirstPhoto(r.products) || (r.cast.find((m) => sdIsFile(m.image)) || {}).image || null : null;
        if (!j.start) throw new Error(`${j.who} needs a start_image: no scene picture, product photo or cast picture to start from`);
      }
      const end = j.clip.end_image;
      j.end = end === 'start' ? j.start : sdIsFile(end) ? end : null;
    } else {
      j.refs = j.clip.references || (j.planRefs ? sdPlanRefs(j.planRefs) : []);
      if (!j.refs.length) throw new Error(`${j.who} has no reference image: give references, or products, cast or scene pictures the template's refs can use`);
    }
  }
  return jobs;
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const i2v = inputs.mode === 'image_to_video';
  if (!inputs.clips && !inputs.scenes) throw ctx.error('bad_input', 'give clips, or scenes for one clip per scene');
  if (inputs.clips) {
    for (const key of SD_SCENE_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only without clips (one clip per scene)`);
  }

  let jobs;
  try {
    const tpl = inputs.template ? await kitLoadTemplate(inputs.template) : { version: 1 };
    jobs = sdJobs(inputs, tpl, i2v);
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', String((err && err.message) || err));
  }

  const used = new Set();
  for (const j of jobs) j.piece = kitPieceName('clip', j.id, j.index, used);
  const clips = [];
  for (const [n, j] of jobs.entries()) {
    kitStopIfAborted(ctx);
    const piece = j.piece;
    const audio = j.audio ?? inputs.generate_audio ?? true;
    const body = i2v
      ? {
          prompt: j.prompt,
          image_url: j.start,
          ...(j.end ? { end_image_url: j.end } : {}),
          resolution: inputs.resolution ?? '1080p',
          duration: String(j.seconds),
          aspect_ratio: inputs.aspect_ratio ?? '9:16',
          generate_audio: audio,
          seed: ctx.seed(piece) % 2147483647,
        }
      : {
          prompt: j.prompt,
          image_urls: j.refs,
          resolution: inputs.resolution ?? '1080p',
          duration: j.seconds,
          aspect_ratio: inputs.aspect_ratio ?? '9:16',
          generate_audio: audio,
          seed: ctx.seed(piece) % 2147483647,
        };
    const result = await ctx.line.order({ piece, provider: 'fal', path: i2v ? I2V : REF, body, results: [{ pointer: '/json/video/url', name: `${piece}.mp4`, media: 'video' }] });
    const file = result && result.files && result.files[`${piece}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    if (audio) {
      const info = await ctx.tools.probe(file.path);
      if (!info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its native audio`);
    }
    clips.push({ id: String(j.id ?? j.index + 1), video: file, seconds: j.seconds });
    ctx.progress({ done: n + 1, total: jobs.length });
  }
  return kitCheckOutputs(ctx, manifest, { clips, video: clips[0].video });
}
