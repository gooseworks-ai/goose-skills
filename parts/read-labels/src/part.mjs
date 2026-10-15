// read-labels: is the product's label spelled right in the cut? A timeline step that runs before the layers
// (GOOSE-4034). Video models redraw a held pack's lettering and get it wrong ("Acne-Prone" came back as
// "Acce-Prone"), and nothing measured that: the check layer marks text_legible "needs eyes". This step sends
// the real product photo and frames of the cut to a vision model, which reads the large words on the pack in
// both and names any word that is clearly readable and spelled differently. A misspelled word stops the run
// with the frame time and both spellings, so the video is not called ready (on_misspelled "fail", the default);
// "report" returns what was read with a failing verdict. Like every check part it never changes the video: it
// returns a verdict (one check, flag:text_legible, in the check layer's shape) and what was read.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg } from '../../_lib/part.mjs';

const ENDPOINT = 'openrouter/router/vision';
const MODEL = 'anthropic/claude-sonnet-5.5';
// Frames read per cut: two per scene (a third and two thirds in), the end card left out, at most this many.
const MAX_FRAMES = 16;

/** The times to read: two per scene span, inside the span, never inside the end card. */
export function labelFrameTimes(timeline, duration) {
  const card = timeline && timeline.end_card;
  const inCard = (t) => card && t >= card.start_s && t < card.end_s;
  const spans = (timeline && timeline.scenes && timeline.scenes.length ? timeline.scenes : [{ id: null, start_s: 0, end_s: duration }])
    .filter((s) => s.end_s > s.start_s);
  const out = [];
  for (const s of spans) {
    for (const share of [1 / 3, 2 / 3]) {
      const t = Math.round((s.start_s + (s.end_s - s.start_s) * share) * 1000) / 1000;
      if (t < duration && !inCard(t)) out.push({ t_s: t, scene_id: s.id == null ? null : String(s.id) });
    }
  }
  if (out.length <= MAX_FRAMES) return out;
  // Too many: keep an even spread, first and last included.
  return Array.from({ length: MAX_FRAMES }, (_, i) => out[Math.round((i * (out.length - 1)) / (MAX_FRAMES - 1))]);
}

/** The instruction: image 1 is the real pack, images 2 on are the frames in order. */
export function labelPrompt(name, times) {
  const frames = times.map((f, i) => `image ${i + 2} is the frame at ${f.t_s} s`).join('; ');
  return [
    `Image 1 is a photo of the real product${name ? `, ${name}` : ''}. The other images are frames from a video of it, in order: ${frames}.`,
    'Step 1: list the large printed words on the real product in image 1: the brand name, the product name and any other line in large type. Leave out small print.',
    'Step 2: for each frame, say whether the product is in it, and read the same large words as printed on it in that frame. Read a word only when you can read every letter clearly. A word hidden by a hand, cut off by the frame edge, blurred, too small, or turned too far to read is not read.',
    'Step 3: a word read in a frame is misspelled when its letters differ from the same word on the real product: a missing, extra or changed letter. Different capitals, a word not read, or a word that is not on the real product at all are not misspellings.',
    'Reply with JSON only, no other text, in this shape: {"label_words": ["..."], "frames": [{"image": 2, "product_seen": true, "words_read": ["..."], "misspelled": [{"read": "...", "should_be": "..."}]}]}',
  ].join('\n');
}

/** The model's reply as {label_words, frames}, or null when it is not that JSON. */
export function parseLabelReply(text) {
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
  const words = (v) => (Array.isArray(v) ? v.filter((w) => typeof w === 'string' && w.trim()).map((w) => w.trim()) : []);
  return {
    label_words: words(j.label_words),
    frames: j.frames
      .filter((f) => f && Number.isInteger(f.image))
      .map((f) => ({
        image: f.image,
        product_seen: f.product_seen === true,
        words_read: words(f.words_read),
        misspelled: (Array.isArray(f.misspelled) ? f.misspelled : [])
          .filter((m) => m && typeof m.read === 'string' && typeof m.should_be === 'string' && m.read.trim() && m.should_be.trim())
          // The same letters in other capitals is not a misspelling, whatever the model says.
          .filter((m) => m.read.trim().toLowerCase() !== m.should_be.trim().toLowerCase())
          .map((m) => ({ read: m.read.trim(), should_be: m.should_be.trim() })),
      })),
  };
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const product = (inputs.products || []).find((p) => Array.isArray(p.images) && p.images.length);
  if (!product) throw ctx.error('bad_input', 'read-labels needs a product with a photo to compare the label against');
  const duration = await kitDuration(ctx, inputs.video);
  const times = labelFrameTimes(inputs.timeline, duration);
  if (!times.length) throw ctx.error('bad_input', 'the cut has no frame outside the end card to read');

  const frames = [];
  for (const [i, f] of times.entries()) {
    const name = `label-${i + 1}.jpg`;
    // -ss after -i: the frame at exactly t, not the keyframe before it.
    await kitFfmpeg(ctx, ['-i', inputs.video.path, '-ss', String(f.t_s), '-frames:v', '1', '-q:v', '3', join(ctx.tmpDir, name)]);
    frames.push(await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/${name}`, 'image'));
  }
  const result = await ctx.line.order({
    piece: 'read-labels',
    provider: 'fal',
    path: ENDPOINT,
    body: {
      model: MODEL,
      system_prompt: 'You check the printed label of a product in frames from a generated video against a photo of the real product. You answer with JSON only.',
      prompt: labelPrompt(product.name || null, times),
      image_urls: [product.images[0], ...frames],
      // The model must reason (the endpoint refuses it off), and with reasoning on the temperature stays default.
      reasoning: true,
      max_tokens: 3000,
    },
    results: [],
  });
  ctx.progress({ done: 1, total: 1 });
  const reply = parseLabelReply(result && result.json && result.json.output);
  if (!reply) throw ctx.error('provider_failed', 'the label reader did not answer in the JSON asked for');

  const read = times.map((f, i) => {
    const r = reply.frames.find((x) => x.image === i + 2) || { product_seen: false, words_read: [], misspelled: [] };
    return { t_s: f.t_s, scene_id: f.scene_id, product_seen: r.product_seen, words_read: r.words_read, misspelled: r.misspelled };
  });
  const wrong = read.filter((f) => f.misspelled.length);
  const labels = { model: MODEL, label_words: reply.label_words, frames: read, misspelled: wrong.length };
  const seen = read.filter((f) => f.product_seen).length;
  const list = wrong
    .slice(0, 4)
    .map((f) => `${f.misspelled.map((m) => `"${m.read}" for "${m.should_be}"`).join(', ')} at ${f.t_s} s${f.scene_id ? ` (scene ${f.scene_id})` : ''}`)
    .join('; ');
  const message = wrong.length
    ? `The product label is misspelled in ${wrong.length} of ${read.length} frames read: ${list}.`
    : seen
      ? `The product label reads right in all ${seen} frames that show it.`
      : 'The product was not seen in any frame read.';
  const status = wrong.length ? 'fail' : seen ? 'pass' : 'not_applicable';
  const verdict = {
    pass: !wrong.length,
    checks: [{ code: 'flag:text_legible', status, message, found: wrong.length ? list : reply.label_words.join(', ') || null }],
    reasons: wrong.length ? [{ check: 'flag:text_legible', message, expected: reply.label_words.join(', '), found: list }] : [],
  };
  if (wrong.length && (inputs.on_misspelled ?? 'fail') === 'fail') throw ctx.error('output_invalid', `${message} Make that scene again.`);
  if (wrong.length) ctx.log.warn(message, { frames: wrong });
  return kitCheckOutputs(ctx, manifest, { verdict, labels });
}
