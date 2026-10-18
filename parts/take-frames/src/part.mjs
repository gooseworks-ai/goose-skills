// take-frames: the first and last frame of a creator take, as two paid GPT Image 2 edits on fal.
//
// A generated creator take (video-h3max) ignores framing words: a tall product drifts down into the
// caption band, the label comes out mirrored, and a small part a hand covers (a cap) is redrawn or lost.
// Starting the take on a composed picture fixes where the creator and the product sit, and ending it on
// the same picture with the use done gives the model both states of the part (GOOSE-4034, Graza).
//
//   first  the cast picture and the real product photo: the product held high beside the face, its
//          bottom edge no lower than the chin, so the bottom third (the caption band) shows only the top;
//   last   an edit of `first` (plus the product photo again): the same photo, one change, the use's
//          extra.after ("the lime green flip cap is open").
//
// The room is the take's own (setting: a key of the take template's looks, the same text the take is
// filmed in), never the cast picture's: a frame in another room than the take's words made H3 cut to
// the words' room in the first 0.2 s and back to the frame's at the end (GOOSE-4034, 18 Oct).
//
// The use is the last plan scene tagged with one of use_tags. A plan with no use scene, or a use scene
// with no extra.after, is refused before anything is ordered.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitStopIfAborted } from '../../_lib/part.mjs';
import { kitSceneTag, kitTagKey } from '../../_lib/scene-match.mjs';

const EDIT = 'openai/gpt-image-2/edit';

export const TF_FIRST = [
  'A real, unedited vertical 9:16 selfie photo on the front camera of an iPhone, chest up, held at arm\'s length: the person in reference image 1 (the same face, hair, skin and outfit: {look}), {setting}.',
  'One hand holds the {product.name} in reference image 2 upright beside the face, its front label to the lens: the same product, shape, colours, cap and label as that photo, never redrawn or mirrored. The hand holds it by the middle of its body, below the name on the label.',
  'The product is held up high: its bottom edge is no lower than the chin, so all of it sits in the top two-thirds of the frame and nothing of it reaches the bottom third, which shows only the top they are wearing.',
  '{before} The lips are closed in a small smile. Real skin texture, natural shine, no retouching. No text, no captions, no watermark.',
].join(' ');

export const TF_LAST = 'The same photo as reference image 1: the same person, pose, hand, framing, light and background, nothing moved. Only one change: {after}. The product, its label and its colours stay exactly as in reference image 2, never mirrored. The lips are closed in a small smile. No text, no captions, no watermark.';

/** The last scene whose tag is one of `tags`, or null. */
export function tfUseScene(scenes, tags) {
  const keys = new Set(tags.map(kitTagKey));
  return [...(scenes || [])].reverse().find((s) => keys.has(kitTagKey(kitSceneTag(s)))) || null;
}

/** A prompt text with its placeholders filled; a placeholder left over is an error. */
export function tfFill(text, values) {
  const out = text.replace(/\{(look|name|product\.name|before|after|setting)\}/g, (_, k) => values[k] ?? '').replace(/\s{2,}/g, ' ').trim();
  const left = /\{[^{}]*\}/.exec(out);
  if (left) throw new Error(`the prompt has a placeholder this part does not fill: ${left[0]}`);
  return out;
}

async function tfIsPng(path) {
  const head = (await readFile(path)).subarray(0, 8);
  return head.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

/** One paid edit: `refs` are the reference pictures, in order. */
async function tfDraw(ctx, { piece, refs, prompt, size, quality }) {
  kitStopIfAborted(ctx);
  const [width, height] = String(size).split('x').map(Number);
  const body = { prompt, image_urls: refs, image_size: { width, height }, quality, num_images: 1, output_format: 'png' };
  const result = await ctx.line.order({ piece, provider: 'fal', path: EDIT, body, results: [{ pointer: '/json/images/0/url', name: `${piece}-raw.png`, media: 'image' }] });
  const raw = result && result.files && result.files[`${piece}-raw.png`];
  if (!raw) throw ctx.error('provider_failed', `no image for ${piece}`);
  if (await tfIsPng(raw.path)) return raw;
  await kitFfmpeg(ctx, ['-i', raw.path, '-frames:v', '1', join(ctx.workDir, `${piece}.png`)]);
  return ctx.file(`${piece}.png`, 'image');
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const member = inputs.cast.find((m) => m && m.image);
  if (!member) throw ctx.error('bad_input', 'no cast member has a picture: run the anchor step first');
  const product = inputs.products.find((p) => p && Array.isArray(p.images) && p.images.length);
  if (!product) throw ctx.error('bad_input', 'no product has a photo: the frames copy the real product, they never draw it from words');
  const tags = inputs.use_tags ?? ['use'];
  const use = tfUseScene(inputs.scenes, tags);
  if (!use) throw ctx.error('bad_input', `no scene is tagged ${tags.join(' or ')}: the last frame shows the use done`);
  const extra = use.extra || {};
  const after = typeof extra.after === 'string' ? extra.after.trim() : '';
  if (!after) throw ctx.error('bad_input', `scene ${use.id} is the use but has no extra.after (what the product looks like once used, e.g. "the cap is open")`);
  let texts = { first: TF_FIRST, last: TF_LAST };
  if (inputs.template) {
    let tpl = null;
    try {
      tpl = JSON.parse(await readFile(inputs.template.path, 'utf8'));
    } catch {
      tpl = null;
    }
    if (!tpl || typeof tpl.first !== 'string' || typeof tpl.last !== 'string') throw ctx.error('bad_input', 'template must be a JSON file with "first" and "last" prompt texts');
    texts = { first: tpl.first, last: tpl.last };
  }
  let setting = 'in the same room and light as that photo';
  if (inputs.setting != null || inputs.settings) {
    if (inputs.setting == null || !inputs.settings) throw ctx.error('bad_input', 'setting and settings go together: the key and the file whose looks hold its text');
    let looks = null;
    try {
      looks = JSON.parse(await readFile(inputs.settings.path, 'utf8')).looks;
    } catch {
      looks = null;
    }
    const text = looks && typeof looks[inputs.setting] === 'string' ? looks[inputs.setting].trim() : '';
    if (!text) throw ctx.error('bad_input', `settings has no looks.${inputs.setting}`);
    setting = text.replace(/[.\s]+$/, '');
  }
  const values = {
    setting,
    look: member.look || 'the person in the photo',
    name: member.name || 'the creator',
    'product.name': product.name || 'product',
    before: typeof extra.before === 'string' && extra.before.trim() ? `${extra.before.trim().replace(/[.\s]+$/, '')}.` : '',
    after: after.replace(/[.\s]+$/, ''),
  };
  let prompts;
  try {
    prompts = { first: tfFill(texts.first, values), last: tfFill(texts.last, values) };
  } catch (err) {
    throw ctx.error('bad_input', String(err.message || err));
  }
  const size = inputs.size ?? '1088x1920';
  const quality = inputs.quality ?? 'high';
  const photo = product.images[0];
  const first = await tfDraw(ctx, { piece: 'frame-first', refs: [member.image, photo], prompt: prompts.first, size, quality });
  ctx.progress({ done: 1, total: 2 });
  const last = await tfDraw(ctx, { piece: 'frame-last', refs: [first, photo], prompt: prompts.last, size, quality });
  ctx.progress({ done: 2, total: 2 });
  ctx.log.info('take frames', { use_scene: use.id, after: values.after });
  return kitCheckOutputs(ctx, manifest, { first_frame: first, last_frame: last, frames: [{ id: 'first', image: first }, { id: 'last', image: last }] });
}
