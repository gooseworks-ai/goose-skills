// video-seedance-2: short clips from ByteDance Seedance 2.0 reference-to-video
// on fal, with native lip-synced voice and room sound (D6: short scenes with
// native audio; creator-h3 is the default for scripted lines). The
// create-video-seedance-2-fal atom's request: bytedance/seedance-2.0/
// reference-to-video with prompt, image_urls (1 to 9 references, the first is
// @Image1), resolution, duration (an integer, 4 to 15), aspect_ratio,
// generate_audio and seed. References go to the core as files. A policy
// refusal (likeness of a real person, partner validation) is final for that
// exact clip: the line says so and the kit never resubmits it.
import { kitCheckInputs, kitCheckOutputs, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';

const MODEL = 'bytedance/seedance-2.0/reference-to-video';

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const used = new Set();
  const clips = [];
  for (const [i, clip] of inputs.clips.entries()) {
    kitStopIfAborted(ctx);
    const piece = kitPieceName('clip', clip.id, i, used);
    const body = {
      prompt: clip.prompt,
      image_urls: clip.references,
      resolution: inputs.resolution ?? '1080p',
      duration: clip.seconds,
      aspect_ratio: inputs.aspect_ratio ?? '9:16',
      generate_audio: clip.generate_audio ?? inputs.generate_audio ?? true,
      seed: ctx.seed(piece) % 2147483647,
    };
    const result = await ctx.line.order({ piece, provider: 'fal', path: `/${MODEL}`, body, results: [{ pointer: '/json/video/url', name: `${piece}.mp4`, media: 'video' }] });
    const file = result.files[`${piece}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    if (body.generate_audio) {
      const info = await ctx.tools.probe(file.path);
      if (!info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its native audio`);
    }
    clips.push({ id: String(clip.id ?? i + 1), video: file, seconds: clip.seconds });
    ctx.progress({ done: i + 1, total: inputs.clips.length });
  }
  return kitCheckOutputs(ctx, manifest, { clips });
}
