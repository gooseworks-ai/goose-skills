// video-veo-3: moves stills with Google Veo 3 / 3.1 image-to-video on fal, one
// paid piece per clip, always without sound. Two modes, as video-kling 1.0.0:
//   scenes  one clip per picked plan scene, its still found by scene id (from
//           image-gpt-image-2's or image-nano-banana's images), its length from
//           the voice's or song's spans (_lib/scene-clips.mjs), its prompt from
//           the style's template;
//   images  one clip per still (a keyframe, a cast anchor), at a fixed length.
// Veo's request (W0-62 contracts, replies/fal-ai--veo3.1--image-to-video.json):
// prompt, image_url, duration "4s" | "6s" | "8s" (a string with an s),
// resolution, aspect_ratio, negative_prompt, seed, and generate_audio, which
// defaults to true on fal and is always sent false here.
// Veo answers a prompt worded as a still shot ("she remains", "steady") with no
// video about a third of the time, so such words refuse the step before any
// piece is bought (static_words 'refuse', the default).
// A clip the provider refuses can fall back to its still (fallback 'still').
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitLoadTemplate } from '../../_lib/prompt.mjs';
import { kitWholeWordsRe } from '../../_lib/scene-match.mjs';
import { kitClipEach, kitClipJobs, kitClipMayFallBack, kitClipSeconds, kitClipSlots, kitClipTemplate, kitClipTrim, kitClipWindow } from '../../_lib/scene-clips.mjs';

const VEO_31 = 'fal-ai/veo3.1/image-to-video';
const VEO_31_FAST = 'fal-ai/veo3.1/fast/image-to-video';
const VEO_3 = 'fal-ai/veo3/image-to-video';
const VEO_3_FAST = 'fal-ai/veo3/fast/image-to-video';
/** The clip lengths every Veo model makes (fal's duration enum is "4s" | "6s" | "8s"). */
const VEO_ALLOWED = [4, 6, 8];
const VEO_DEFAULT_S = 4;
const VEO_PROMPT_MAX = 20000;
const VEO_NEGATIVE_MAX = 5000;
const VEO_SCENE_ONLY = ['pick', 'skip_first', 'skip_last', 'spans'];
/** The motion text when the template has none: verb-led, with no still-shot words. */
const VEO_DEFAULT_MOTION = '{picture?}. The camera drifts a little handheld as the moment plays out. No text, no new objects';
/** Words that tell Veo the shot is still (W0-62 / the wardrobe-stitch run's L4). Whole words, any case. */
const VEO_STATIC_WORDS = ['remain', 'remains', 'stay', 'stays', 'rests', 'unchanged', 'steady', 'steadily', 'holds', 'subtle', 'subtly', 'slow', 'slowly', 'gentle', 'gently', 'smooth', 'smoothly', 'static', 'motionless'];

/** The first still-shot word in a prompt, or null. */
function veoStaticWord(prompt) {
  for (const word of VEO_STATIC_WORDS) if (kitWholeWordsRe(word).test(prompt)) return word;
  return null;
}

/** The model's request for one clip. */
function veoBody({ still, prompt, negative, seconds, resolution, aspect_ratio, seed }) {
  const body = { prompt, image_url: still, duration: `${seconds}s`, resolution, generate_audio: false };
  if (aspect_ratio) body.aspect_ratio = aspect_ratio;
  if (negative) body.negative_prompt = negative;
  if (seed != null) body.seed = seed;
  return body;
}

/** Orders one clip: each model's path is a listed constant. */
function veoOrder(ctx, model, order) {
  if (model === VEO_31_FAST) return ctx.line.order({ ...order, provider: 'fal', path: VEO_31_FAST });
  if (model === VEO_3) return ctx.line.order({ ...order, provider: 'fal', path: VEO_3 });
  if (model === VEO_3_FAST) return ctx.line.order({ ...order, provider: 'fal', path: VEO_3_FAST });
  return ctx.line.order({ ...order, provider: 'fal', path: VEO_31 });
}

function veoBad(ctx, err) {
  if (ctx.signal && ctx.signal.aborted) return ctx.error('stopped', 'the step was stopped');
  return ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const model = inputs.model;
  const mode = inputs.mode || (inputs.scenes ? 'scenes' : 'images');
  if (mode === 'scenes' && !inputs.scenes) throw ctx.error('bad_input', 'scenes mode needs scenes (or set mode images)');
  if (mode === 'images') {
    for (const key of VEO_SCENE_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in scenes mode`);
  }
  if (inputs.spans && inputs.seconds !== undefined) throw ctx.error('bad_input', 'give spans or seconds, not both');

  // Everything that can refuse happens before the first piece is ordered.
  let jobs;
  try {
    const loaded = inputs.template ? await kitLoadTemplate(inputs.template) : null;
    const tpl = kitClipTemplate(loaded && typeof loaded.motion === 'string' ? loaded : { ...(loaded || { version: 1 }), motion: VEO_DEFAULT_MOTION });
    jobs = kitClipJobs(tpl, {
      mode,
      stills: inputs.stills,
      scenes: inputs.scenes || [],
      use: inputs.use || 'motion',
      pick: inputs.pick,
      skip_first: inputs.skip_first,
      skip_last: inputs.skip_last,
      look: inputs.look,
      answers: inputs.answers,
      brand: inputs.brand,
      cast: inputs.cast,
      products: inputs.products,
    });
    if (!jobs.length) throw new Error('no scene is picked for a clip');
    const bounds = { min_s: inputs.min_s ?? null, max_s: inputs.max_s ?? null };
    const slots = inputs.spans ? kitClipSlots(jobs, inputs.spans) : null;
    const staticCheck = (inputs.static_words || 'refuse') === 'refuse';
    let total = 0;
    for (const job of jobs) {
      if (slots) {
        const length = kitClipSeconds(slots.get(job.id), VEO_ALLOWED, bounds);
        job.seconds = length.seconds;
        if (length.short) ctx.log.info(`scene ${job.id} is on screen ${slots.get(job.id).toFixed(2)} s; its clip is the longest allowed, ${job.seconds} s`);
      } else {
        const want = inputs.seconds ?? VEO_DEFAULT_S;
        const length = kitClipSeconds(want, VEO_ALLOWED, { ...bounds, exact: true });
        if (length.short) throw new Error(`seconds ${want} is longer than the longest clip allowed here (${length.seconds} s)`);
        job.seconds = length.seconds;
      }
      total += job.seconds;
      if (inputs.keep && inputs.keep.seconds > job.seconds) throw new Error(`keep ${inputs.keep.seconds} s is longer than clip ${job.id} (${job.seconds} s)`);
      job.negative = inputs.negative_prompt || job.negative || '';
      if (!job.prompt) throw new Error(`clip ${job.id} has an empty prompt: give the scene a picture or the template a motion text`);
      if (job.prompt.length > VEO_PROMPT_MAX) throw new Error(`clip ${job.id}'s prompt is over ${VEO_PROMPT_MAX} characters`);
      if (job.negative.length > VEO_NEGATIVE_MAX) throw new Error(`clip ${job.id}'s negative prompt is over ${VEO_NEGATIVE_MAX} characters`);
      const word = staticCheck ? veoStaticWord(job.prompt) : null;
      if (word) throw new Error(`clip ${job.id}'s prompt says "${word}", which tells Veo the shot is still (it often makes no video then): describe the motion with an action verb, or set static_words allow`);
    }
    if (inputs.max_total_s != null && total > inputs.max_total_s + 1e-9) {
      throw new Error(`the ${jobs.length} clips come to ${total} s, over max_total_s ${inputs.max_total_s}`);
    }
  } catch (err) {
    throw veoBad(ctx, err);
  }

  const used = new Set();
  for (const job of jobs) job.piece = kitPieceName('clip', job.id, job.index, used);
  const fallback = inputs.fallback || 'fail';
  const lastAttempt = !(ctx.step && ctx.step.attempt < 1 + ((manifest.retry && manifest.retry.transient) || 0));
  const resolution = inputs.resolution || '1080p';
  let done = 0;

  const clips = await kitClipEach(jobs, async (job) => {
    kitStopIfAborted(ctx);
    const seed = inputs.seed != null ? inputs.seed + job.index : null;
    const body = veoBody({ still: job.still, prompt: job.prompt, negative: job.negative, seconds: job.seconds, resolution, aspect_ratio: inputs.aspect_ratio, seed });
    let file;
    try {
      const result = await veoOrder(ctx, model, { piece: job.piece, body, results: [{ pointer: '/json/video/url', name: `${job.piece}.mp4`, media: 'video' }] });
      file = result && result.files && result.files[`${job.piece}.mp4`];
      if (!file) throw ctx.error('provider_failed', `no video for ${job.piece}`);
      const info = await ctx.tools.probe(file.path);
      if (!info.has_video) throw ctx.error('provider_failed', `${job.piece} came back with no picture`);
    } catch (err) {
      // A stop is never masked by a still, whatever the provider's error says.
      kitStopIfAborted(ctx);
      if (fallback !== 'still' || !kitClipMayFallBack(err, { last_attempt: lastAttempt })) throw err;
      const seconds = inputs.keep ? inputs.keep.seconds : job.seconds;
      ctx.log.warn(`${job.piece} became its still: ${err.code}`, { piece: job.piece, code: err.code });
      ctx.progress({ done: ++done, total: jobs.length });
      return { id: job.id, image: job.still, seconds };
    }
    const length = await kitDuration(ctx, file);
    let clip = { id: job.id, video: file, seconds: Number(length.toFixed(3)) };
    if (inputs.keep) {
      const window = kitClipWindow(length, inputs.keep);
      if (window.seconds < length) clip = { id: job.id, video: await kitClipTrim(ctx, file, window, `${job.piece}-keep.mp4`), seconds: Number(window.seconds.toFixed(3)) };
    }
    ctx.progress({ done: ++done, total: jobs.length });
    return clip;
  });

  const out = { clips };
  if (clips[0].video) out.video = clips[0].video;
  return kitCheckOutputs(ctx, manifest, out);
}
