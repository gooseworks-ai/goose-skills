// video-kling: moves stills with Kling image-to-video on fal, one paid piece
// per clip, always without sound. Two modes:
//   scenes  one clip per picked plan scene, its still found by scene id (from
//           image-nano-banana's images), its length from the voice's or song's
//           spans (_lib/scene-clips.mjs), its prompt from the style's template;
//   images  one clip per still (a keyframe, a cast anchor), at a fixed length.
// The three models name their inputs differently: v2.1 and v2.5 take
// image_url and "5" | "10" seconds; v3 takes start_image_url, "3" to "15"
// seconds and makes sound unless generate_audio is false (W0-62 contracts).
// A clip the provider refuses can fall back to its still (fallback 'still').
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitLoadTemplate } from '../../_lib/prompt.mjs';
import { kitClipEach, kitClipJobs, kitClipMayFallBack, kitClipSeconds, kitClipSlots, kitClipTemplate, kitClipTrim, kitClipWindow } from '../../_lib/scene-clips.mjs';

const V21 = 'fal-ai/kling-video/v2.1/standard/image-to-video';
const V25 = 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video';
const V3 = 'fal-ai/kling-video/v3/standard/image-to-video';
const KL_PROMPT_MAX = 2500;
const KL_DEFAULT_S = 5;
const KL_SCENE_ONLY = ['pick', 'skip_first', 'skip_last', 'spans'];

/** The clip lengths each model makes (fal's duration enum, sent as a string). */
function klAllowed(model) {
  return model === V3 ? [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] : [5, 10];
}

/** The model's request for one clip. */
function klBody(model, { still, prompt, negative, seconds, cfg_scale }) {
  const body = { prompt, duration: String(seconds) };
  if (model === V3) {
    body.start_image_url = still;
    body.generate_audio = false;
  } else body.image_url = still;
  if (negative) body.negative_prompt = negative;
  if (cfg_scale != null) body.cfg_scale = cfg_scale;
  return body;
}

/** Orders one clip: each model's path is a listed constant. */
function klOrder(ctx, model, order) {
  if (model === V3) return ctx.line.order({ ...order, provider: 'fal', path: V3 });
  if (model === V25) return ctx.line.order({ ...order, provider: 'fal', path: V25 });
  return ctx.line.order({ ...order, provider: 'fal', path: V21 });
}

function klBad(ctx, err) {
  if (ctx.signal && ctx.signal.aborted) return ctx.error('stopped', 'the step was stopped');
  return ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const model = inputs.model;
  const mode = inputs.mode || (inputs.scenes ? 'scenes' : 'images');
  if (mode === 'scenes' && !inputs.scenes) throw ctx.error('bad_input', 'scenes mode needs scenes (or set mode images)');
  if (mode === 'images') {
    for (const key of KL_SCENE_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in scenes mode`);
  }
  if (inputs.spans && inputs.seconds !== undefined) throw ctx.error('bad_input', 'give spans or seconds, not both');

  // Everything that can refuse happens before the first piece is ordered.
  let jobs;
  try {
    const tpl = kitClipTemplate(inputs.template ? await kitLoadTemplate(inputs.template) : null);
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
    for (const job of jobs) {
      if (slots) {
        const length = kitClipSeconds(slots.get(job.id), klAllowed(model), bounds);
        job.seconds = length.seconds;
        if (length.short) ctx.log.info(`scene ${job.id} is on screen ${slots.get(job.id).toFixed(2)} s; its clip is the longest allowed, ${job.seconds} s`);
      } else {
        const want = inputs.seconds ?? KL_DEFAULT_S;
        const length = kitClipSeconds(want, klAllowed(model), { ...bounds, exact: true });
        if (length.short) throw new Error(`seconds ${want} is longer than the longest clip allowed here (${length.seconds} s)`);
        job.seconds = length.seconds;
      }
      if (inputs.keep && inputs.keep.seconds > job.seconds) throw new Error(`keep ${inputs.keep.seconds} s is longer than clip ${job.id} (${job.seconds} s)`);
      job.negative = inputs.negative_prompt || job.negative || '';
      if (!job.prompt) throw new Error(`clip ${job.id} has an empty prompt: give the scene a picture or the template a motion text`);
      if (job.prompt.length > KL_PROMPT_MAX) throw new Error(`clip ${job.id}'s prompt is over ${KL_PROMPT_MAX} characters`);
      if (job.negative.length > KL_PROMPT_MAX) throw new Error(`clip ${job.id}'s negative prompt is over ${KL_PROMPT_MAX} characters`);
    }
  } catch (err) {
    throw klBad(ctx, err);
  }

  const used = new Set();
  for (const job of jobs) job.piece = kitPieceName('clip', job.id, job.index, used);
  const fallback = inputs.fallback || 'fail';
  const lastAttempt = !(ctx.step && ctx.step.attempt < 1 + ((manifest.retry && manifest.retry.transient) || 0));
  let done = 0;

  const clips = await kitClipEach(jobs, async (job) => {
    kitStopIfAborted(ctx);
    const body = klBody(model, { still: job.still, prompt: job.prompt, negative: job.negative, seconds: job.seconds, cfg_scale: inputs.cfg_scale });
    let file;
    try {
      const result = await klOrder(ctx, model, { piece: job.piece, body, results: [{ pointer: '/json/video/url', name: `${job.piece}.mp4`, media: 'video' }] });
      file = result && result.files && result.files[`${job.piece}.mp4`];
      if (!file) throw ctx.error('provider_failed', `no video for ${job.piece}`);
    } catch (err) {
      if (fallback !== 'still' || !kitClipMayFallBack(err, { last_attempt: lastAttempt })) throw err;
      const seconds = inputs.keep ? inputs.keep.seconds : job.seconds;
      ctx.log.warn(`${job.piece} became its still: ${err.code}`, { piece: job.piece, code: err.code });
      ctx.progress({ done: ++done, total: jobs.length });
      return { id: job.id, image: job.still, seconds };
    }
    const info = await ctx.tools.probe(file.path);
    if (!info.has_video) throw ctx.error('provider_failed', `${job.piece} came back with no picture`);
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
