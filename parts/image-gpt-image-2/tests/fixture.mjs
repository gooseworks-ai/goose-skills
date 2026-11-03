// Fakes for image-gpt-image-2, from the recorded fal contract for
// openai/gpt-image-2 and openai/gpt-image-2/edit (GOOSE-4015 W0-62,
// fal OpenAPI fetched 2026-10-12): the request fields fal accepts and the
// answer the private line hands a part ({json: <fal's output>}).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, run } from '../../_tools/kit-harness.mjs';

/** The request fields fal's GptImage2Input / GptImage2EditInput accept. */
export const REQUEST_FIELDS = {
  'openai/gpt-image-2': ['prompt', 'image_size', 'quality', 'num_images', 'output_format', 'sync_mode', 'enable_safety_checker', 'background'],
  'openai/gpt-image-2/edit': ['prompt', 'image_urls', 'mask_url', 'image_size', 'quality', 'num_images', 'output_format', 'sync_mode', 'enable_safety_checker', 'background'],
};
export const REQUIRED = { 'openai/gpt-image-2': ['prompt'], 'openai/gpt-image-2/edit': ['prompt', 'image_urls'] };
export const QUALITY = ['auto', 'low', 'medium', 'high'];

/** fal's rule for a concrete image_size: multiples of 16, edge <= 3840, ratio <= 3:1, 655,360..8,294,400 px. */
export function sizeProblems({ width, height } = {}) {
  const out = [];
  if (!Number.isInteger(width) || !Number.isInteger(height)) return ['width and height must be integers'];
  if (width % 16 || height % 16) out.push('not a multiple of 16');
  if (Math.max(width, height) > 3840) out.push('an edge over 3840');
  if (Math.max(width, height) / Math.min(width, height) > 3) out.push('a ratio over 3:1');
  if (width * height < 655360 || width * height > 8294400) out.push('pixels out of range');
  return out;
}

/** The recorded answer (contracts/replies/openai--gpt-image-2--edit.json `answer`), with the file name made per piece. */
export function falAnswer(name = 'still.png') {
  return { json: { images: [{ url: `https://v3b.fal.media/files/b/fixture/${name}`, content_type: 'image/png', file_name: name, file_size: 1834512, width: 1088, height: 1920 }] } };
}

export async function makeImage(path, size = '320x240') {
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=${size}:duration=1`, '-frames:v', '1', '-f', path.endsWith('.jpg') ? 'mjpeg' : 'image2', path]);
  return path;
}

/** A fake line that answers every order as fal does, with a small PNG saved under the requested name. */
export async function pngLine(order, ctx) {
  const name = order.results[0].name;
  const path = join(ctx.workDir, name);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=108x192:duration=1', '-frames:v', '1', '-c:v', 'png', path]);
  return { ...falAnswer(name), files: { [name]: await fileRef(path, 'image') }, reused: false };
}

/** Like pngLine, but answers JPEG bytes under the .png name (as some fal replies do). */
export async function jpegLine(order, ctx) {
  const name = order.results[0].name;
  const path = join(ctx.workDir, name);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=108x192:duration=1', '-frames:v', '1', '-f', 'mjpeg', '-c:v', 'mjpeg', path]);
  return { ...falAnswer(name), files: { [name]: await fileRef(path, 'image') }, reused: false };
}

/** A template like narrated-ugc-wardrobe-stitch's frames/stills.prompt.json (Look / Product / Cutaway tags). */
export const template = {
  version: 1,
  prefix: 'candid iPhone photo, natural light, real skin texture',
  scene: '{picture}. {cast_looks}',
  anchor: 'portrait of {name}: {look}, plain wall, chest up, looking into the lens',
  suffix: 'vertical 9:16, no text, no logos',
  negative: 'text, watermark, extra fingers, plastic skin',
  by_tag: { Product: { scene: '{picture}. The product exactly as in the reference photo, label unchanged.', refs: ['product'] }, Cutaway: { refs: [] } },
  refs: ['anchor', 'product', 'scene_image'],
};

export async function writeTemplate(workDir, tpl = template, name = 'stills.prompt.json') {
  const path = join(workDir, name);
  writeFileSync(path, JSON.stringify(tpl));
  return fileRef(path, 'json');
}

/** A plan with two named cast members (one with a picture), a product and an end card scene with no line. */
export async function scenesInputs(workDir, extra = {}) {
  const photo = await fileRef(await makeImage(join(workDir, 'product.png')), 'image');
  const maya = await fileRef(await makeImage(join(workDir, 'maya.png')), 'image');
  return {
    model: 'openai/gpt-image-2/edit',
    mode: 'scenes',
    size: '1088x1920',
    quality: 'high',
    template: await writeTemplate(workDir),
    answers: { mood: 'cosy' },
    cast: [
      { key: 'a', name: 'Maya', look: 'woman, 34, curly dark hair, olive overshirt', image: maya },
      { key: 'b', name: 'Theo', look: 'man, 41, grey beard, navy crewneck', image: null, voice_id: 'TxGEqnHWrfWFTfGW9XjX' },
    ],
    products: [{ id: 'mist', name: 'Morning Mist Green Tea', images: [photo] }],
    scenes: [
      { id: 's1', line: 'So I stopped cooking on weeknights.', on_screen: null, picture: 'Maya at the stove, tired', speaker: 'a' },
      { id: 's2', line: null, on_screen: null, picture: 'Maya and Theo laugh at the table' },
      { id: 's3', line: 'Then this showed up.', on_screen: null, picture: 'Product: the Morning Mist Green Tea pouch on the counter' },
      { id: 's4', line: null, on_screen: 'Brew yours', picture: null },
    ],
    skip_last: 1,
    anchor: 'cast',
    ...extra,
  };
}

/** The sample run parts.test.mjs makes: one still from a reference (/edit), one from the prompt alone. */
export const sample = {
  async inputs(workDir) {
    const ref = await fileRef(await makeImage(join(workDir, 'product.png')), 'image');
    return {
      size: '1088x1920',
      quality: 'high',
      images: [
        { id: 'hero', prompt: 'a woman holds the product to the camera in a sunlit kitchen', references: [ref] },
        { prompt: 'an empty sunlit kitchen counter' },
      ],
    };
  },
  line: pngLine,
};
