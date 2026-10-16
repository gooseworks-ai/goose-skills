// Mode stills: one H3 Max clip per picked plan scene, starting on that scene's
// still from a picture step (step.<stills>.images), timed to the voice the way
// video-veo-3's scenes mode is (_lib/scene-clips.mjs). It is the H3 route for
// narrated styles that cut many short scenes: up to 40 clips, made a few at a
// time, each a whole number of seconds from 4 to 15. A still is fitted to the
// clip's canvas by cover (centre crop), so no black bars reach the cut. A clip
// the provider refuses can fall back to its still (fallback 'still').
// 1.2.0: every clip keeps the first frame's light and exposure (the light lock), and
// broll: true is silent creator B-roll: each scene names one physical action in
// extra.action, and "Nobody speaks, lips closed, while <action>." is added; still hands
// are refused.
// 1.4.0: end_on_start_tags lists scene tags whose clips end on their own first frame (end_image_url),
// so a held product cannot finish turned to its back (GOOSE-4034).
import { kitCheckOutputs, kitDuration, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { kitSceneTag, kitTagKey } from '../../_lib/scene-match.mjs';
import { KitPromptGap, kitLoadTemplate, kitPromptJoin } from '../../_lib/prompt.mjs';
import { kitProductScenePhotos, kitRequireProductFrame, kitRequireSceneTags } from '../../_lib/product-tag-contract.mjs';
import { kitClipEach, kitClipJobs, kitClipMayFallBack, kitClipSeconds, kitClipSlots, kitClipTemplate } from '../../_lib/scene-clips.mjs';
import { H3BROLL_STILL_HANDS, H3SCENE_MODEL, h3BrollActionProblem, h3BrollLine, h3SceneProviderBody, h3SceneProviderPrompt, h3SceneProviderVideo, h3SceneWithLightLock } from './provider.mjs';
import { h3SceneFitStills } from './frames.mjs';

/** H3's clip lengths: whole seconds, 4 to 15. */
export const H3STILLS_ALLOWED = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const H3STILLS_DEFAULT_SECONDS = 5;
const H3STILLS_MAX_CLIPS = 40;
const H3STILLS_PROMPT_MAX = 12000;
/** Inputs only mode stills reads. */
export const H3STILLS_ONLY = ['stills', 'spans', 'min_s', 'max_s', 'max_total_s', 'fallback', 'require_scene_tags', 'require_product_refs', 'product_reference_evidence', 'broll', 'end_on_start_tags'];

/** Whether a scene's clip must end on its first frame: its tag is one of end_on_start_tags. */
export function h3StillsEndsOnStart(scene, tags) {
  if (!Array.isArray(tags) || !tags.length) return false;
  const tag = kitSceneTag(scene);
  return tag != null && tags.some((t) => kitTagKey(t) === kitTagKey(tag));
}
// Anything left that looks like a placeholder after filling is a typo.
const H3STILLS_PLACEHOLDER_LIKE = /\{[A-Za-z][A-Za-z0-9_.-]*\??\}/;

/** Every clip, checked before the first order: [{id, index, who, still, prompt, seconds}]. */
export function h3StillsJobs(inputs, tpl, log = null) {
  if (inputs.require_scene_tags) kitRequireSceneTags(tpl, inputs.scenes || [], inputs);
  const jobs = kitClipJobs(tpl, {
    mode: 'scenes',
    stills: inputs.stills,
    scenes: inputs.scenes || [],
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
  if (jobs.length > H3STILLS_MAX_CLIPS) throw new Error(`${jobs.length} scenes are picked; mode stills makes at most ${H3STILLS_MAX_CLIPS} clips`);
  if (inputs.require_product_refs) {
    for (const job of jobs) kitRequireProductFrame(job.id, job.still, kitProductScenePhotos(tpl, job.scene, inputs.products || []), inputs.product_reference_evidence || []);
  }
  const bounds = { min_s: inputs.min_s ?? null, max_s: inputs.max_s ?? null };
  const slots = inputs.spans ? kitClipSlots(jobs, inputs.spans) : null;
  let total = 0;
  for (const job of jobs) {
    job.who = `scene ${job.id}`;
    if (slots) {
      const length = kitClipSeconds(slots.get(job.id), H3STILLS_ALLOWED, bounds);
      job.seconds = length.seconds;
      if (length.short && log) log.info(`scene ${job.id} is on screen ${slots.get(job.id).toFixed(2)} s; its clip is the longest allowed, ${job.seconds} s`);
    } else {
      const want = inputs.seconds ?? H3STILLS_DEFAULT_SECONDS;
      const length = kitClipSeconds(want, H3STILLS_ALLOWED, { ...bounds, exact: true });
      if (length.short) throw new Error(`seconds ${want} is longer than the longest clip allowed here (${length.seconds} s)`);
      job.seconds = length.seconds;
    }
    total += job.seconds;
    if (!job.prompt) throw new Error(`${job.who} has an empty prompt: give the scene a picture or the template a motion text`);
    // B-roll: one named physical action, and "nobody speaks, lips closed" paired with it.
    let motion = job.prompt;
    if (inputs.broll) {
      const action = job.scene && job.scene.extra && typeof job.scene.extra === 'object' ? job.scene.extra.action : undefined;
      const problem = h3BrollActionProblem(action);
      if (problem) throw new Error(`${job.who} is B-roll and ${problem}`);
      const still = H3BROLL_STILL_HANDS.exec(motion);
      if (still) throw new Error(`${job.who} is B-roll and its prompt says "${still[0]}"; B-roll pairs "nobody speaks, lips closed" with the named action, never with still hands`);
      motion = kitPromptJoin([motion, h3BrollLine(action)]);
    }
    // The still is the first frame: keep its light and exposure.
    motion = h3SceneWithLightLock(motion);
    const prompt = job.negative ? kitPromptJoin([motion, `Avoid: ${job.negative}`]) : motion;
    const left = H3STILLS_PLACEHOLDER_LIKE.exec(prompt);
    if (left) throw new KitPromptGap(`${job.who} has an unknown placeholder ${left[0]}`, { placeholder: left[0], scene_id: job.id });
    if (prompt.length > H3STILLS_PROMPT_MAX) throw new Error(`${job.who}'s prompt is ${prompt.length} characters, over ${H3STILLS_PROMPT_MAX}`);
    // The still is the first frame and the only reference, so the prompt may call it Image 1.
    job.prompt = h3SceneProviderPrompt(prompt, 1, job.who);
  }
  if (inputs.max_total_s != null && total > inputs.max_total_s + 1e-9) {
    throw new Error(`the ${jobs.length} clips come to ${total} s, over max_total_s ${inputs.max_total_s}`);
  }
  return jobs;
}

/** Mode stills: every clip refused or fitted before the first order, then made a few at a time. */
export async function h3StillsRun(inputs, ctx, manifest) {
  if (inputs.clips) throw ctx.error('bad_input', 'mode stills makes one clip per picked scene; clips are for modes reference and image_to_video');
  if (!inputs.stills) throw ctx.error('bad_input', 'mode stills needs stills (step.<stills>.images)');
  if (!inputs.scenes) throw ctx.error('bad_input', 'mode stills needs scenes');
  if (inputs.spans && inputs.seconds !== undefined) throw ctx.error('bad_input', 'give spans or seconds, not both');
  if (inputs.broll && inputs.generate_audio === true) throw ctx.error('bad_input', 'broll clips are silent: leave generate_audio out or set it to false');
  let jobs;
  try {
    const loaded = inputs.template ? await kitLoadTemplate(inputs.template) : null;
    jobs = h3StillsJobs(inputs, kitClipTemplate(loaded), ctx.log);
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', String((err && err.message) || err));
  }
  for (const job of jobs) job.start = job.still;
  await h3SceneFitStills(inputs, ctx, jobs);
  // A locked clip ends on the same fitted file it starts on.
  for (const job of jobs) if (h3StillsEndsOnStart(job.scene, inputs.end_on_start_tags)) job.end = job.start;

  const used = new Set();
  for (const job of jobs) job.piece = kitPieceName('clip', job.id, job.index, used);
  const fallback = inputs.fallback || 'fail';
  const lastAttempt = !(ctx.step && ctx.step.attempt < 1 + ((manifest.retry && manifest.retry.transient) || 0));
  const audio = inputs.generate_audio ?? !inputs.broll;
  let done = 0;

  const clips = await kitClipEach(jobs, async (job) => {
    kitStopIfAborted(ctx);
    const piece = job.piece;
    const body = h3SceneProviderBody(inputs, job, [job.start], ctx.seed(piece) % 2147483647);
    let ready;
    try {
      const result = await ctx.line.order({ piece, provider: 'fal', path: H3SCENE_MODEL, body, results: [{ pointer: '/json/video/url', name: `${piece}.mp4`, media: 'video' }] });
      const file = result && result.files && result.files[`${piece}.mp4`];
      if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
      ready = await h3SceneProviderVideo(ctx, file, piece, audio);
    } catch (err) {
      // A stop is never masked by a still, whatever the provider's error says.
      kitStopIfAborted(ctx);
      if (fallback !== 'still' || !kitClipMayFallBack(err, { last_attempt: lastAttempt })) throw err;
      ctx.log.warn(`${piece} became its still: ${err.code}`, { piece, code: err.code });
      ctx.progress({ done: ++done, total: jobs.length });
      return { id: job.id, image: job.still, seconds: job.seconds };
    }
    const length = await kitDuration(ctx, ready.file);
    ctx.progress({ done: ++done, total: jobs.length });
    return { id: job.id, video: ready.file, seconds: Number(length.toFixed(3)) };
  });

  const out = { clips };
  if (clips[0].video) out.video = clips[0].video;
  return kitCheckOutputs(ctx, manifest, out);
}
