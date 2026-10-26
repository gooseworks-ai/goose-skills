// unmirror-take: puts a selfie take the right way round when the video model drew it mirrored (GOOSE-4034).
// H3 sometimes renders a whole creator take as a front-camera mirror: every letter on the held product reads right
// to left. In a selfie nothing else has a handedness a viewer can see, so flipping the whole frame fixes it with no
// other change. This step sends the real product photo and a few frames of the take to a vision model, which says
// for each frame whether the product is in it and whether its printed text is mirrored. When most frames that show
// the product are mirrored, the take is flipped left to right (sound untouched); otherwise it passes through as it
// is. The timeline passes through unchanged either way: a flip moves nothing in time.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg } from '../../_lib/part.mjs';

const ENDPOINT = 'openrouter/router/vision';
const MODEL = 'anthropic/claude-sonnet-5.5';
const DEFAULT_FRAMES = 4;

/** Frame times spread evenly over the take, never inside the end card: at (i + 0.5) / n of the usable span. */
export function unmirrorFrameTimes(duration, timeline, n = DEFAULT_FRAMES) {
  const card = timeline && timeline.end_card;
  const end = card && card.start_s > 0 && card.start_s < duration ? card.start_s : duration;
  return Array.from({ length: n }, (_, i) => Math.round(((i + 0.5) / n) * end * 1000) / 1000);
}

/** The instruction: image 1 is the real product, images 2 on are the frames in order. */
export function unmirrorPrompt(name, times) {
  const frames = times.map((t, i) => `image ${i + 2} is the frame at ${t} s`).join('; ');
  return [
    `Image 1 is a photo of the real product${name ? `, ${name}` : ''}, with its printed text reading normally, left to right. The other images are frames from a selfie video of a person holding it, in order: ${frames}.`,
    'For each frame, say whether the product is in it, and if it is, whether its printed text is mirrored: letters reversed and words reading right to left, as when a selfie camera flips the picture. Judge only from the product\'s own large printed words.',
    'Reply with JSON only, no other text, in this shape: {"frames": [{"image": 2, "product_seen": true, "mirrored": false}]}',
  ].join('\n');
}

/** The model's reply as [{image, product_seen, mirrored}], or null when it is not that JSON. */
export function parseUnmirrorReply(text) {
  if (typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let j;
  try {
    j = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!j || !Array.isArray(j.frames)) return null;
  return j.frames
    .filter((f) => f && Number.isInteger(f.image))
    .map((f) => ({ image: f.image, product_seen: f.product_seen === true, mirrored: f.product_seen === true && f.mirrored === true }));
}

/** Flip when more than half of the frames that show the product are mirrored. */
export function unmirrorDecide(frames) {
  const seen = frames.filter((f) => f.product_seen);
  const flipped = seen.filter((f) => f.mirrored).length;
  return { seen: seen.length, mirrored: flipped, flip: seen.length > 0 && flipped * 2 > seen.length };
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const product = (inputs.products || []).find((p) => Array.isArray(p.images) && p.images.length);
  if (!product) throw ctx.error('bad_input', 'unmirror-take needs a product with a photo to compare the take against');
  const duration = await kitDuration(ctx, inputs.video);
  const times = unmirrorFrameTimes(duration, inputs.timeline, inputs.frames ?? DEFAULT_FRAMES);

  const frames = [];
  for (const [i, t] of times.entries()) {
    const name = `look-${i + 1}.jpg`;
    // -ss after -i: the frame at exactly t, not the keyframe before it.
    await kitFfmpeg(ctx, ['-i', inputs.video.path, '-ss', String(t), '-frames:v', '1', '-q:v', '3', join(ctx.tmpDir, name)]);
    frames.push(await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/${name}`, 'image'));
  }
  const result = await ctx.line.order({
    piece: 'unmirror',
    provider: 'fal',
    path: ENDPOINT,
    body: {
      model: MODEL,
      system_prompt: 'You check whether a product\'s printed text is mirrored in frames from a selfie video. You answer with JSON only.',
      prompt: unmirrorPrompt(product.name || null, times),
      image_urls: [product.images[0], ...frames],
      // The endpoint refuses this model with reasoning off; with reasoning on the temperature stays default.
      reasoning: true,
      max_tokens: 1500,
    },
    results: [],
  });
  ctx.progress({ done: 1, total: 1 });
  const reply = parseUnmirrorReply(result && result.json && result.json.output);
  if (!reply) throw ctx.error('provider_failed', 'the mirror check did not answer in the JSON asked for');
  const read = times.map((t, i) => {
    const r = reply.find((x) => x.image === i + 2) || { product_seen: false, mirrored: false };
    return { t_s: t, product_seen: r.product_seen, mirrored: r.mirrored };
  });
  const decision = unmirrorDecide(read);
  let video = inputs.video;
  if (decision.flip) {
    const name = 'take-unmirrored.mp4';
    await kitFfmpeg(ctx, ['-i', inputs.video.path, '-map', '0:v:0', '-map', '0:a?', '-vf', 'hflip', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', join(ctx.workDir, name)]);
    video = await ctx.file(name, 'video');
    ctx.log.info(`the take was mirrored in ${decision.mirrored} of ${decision.seen} frames that show the product; flipped it`);
  }
  return kitCheckOutputs(ctx, manifest, { video, timeline: inputs.timeline, mirror: { model: MODEL, flipped: decision.flip, seen: decision.seen, mirrored: decision.mirrored, frames: read } });
}
