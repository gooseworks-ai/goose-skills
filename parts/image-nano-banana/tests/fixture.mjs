// A fake private line for image-nano-banana: the first image comes back as a
// JPEG (as some fal models answer), later ones as PNG.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, run } from '../../_tools/kit-harness.mjs';

export async function makeImage(path) {
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x240:duration=1', '-frames:v', '1', '-f', path.endsWith('.jpg') ? 'mjpeg' : 'image2', path]);
  return path;
}

export const sample = {
  async inputs(workDir) {
    const ref = await fileRef(await makeImage(join(workDir, 'product.png')), 'image');
    return {
      model: 'fal-ai/nano-banana/edit',
      aspect_ratio: '9:16',
      images: [
        { id: 'hero', prompt: 'the product on a sunlit kitchen counter', references: [ref] },
        { prompt: 'the product held in one hand', references: [ref] },
      ],
    };
  },
  async line(order, ctx) {
    const name = order.results[0].name;
    // Saved under the requested name, but the bytes of the first are JPEG.
    const path = join(ctx.workDir, name);
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x568:duration=1', '-frames:v', '1', '-f', order.piece === 'image-hero' ? 'mjpeg' : 'image2', '-c:v', order.piece === 'image-hero' ? 'mjpeg' : 'png', path]);
    return { json: { images: [{ url: 'https://fal.media/x.png' }] }, files: { [name]: await fileRef(path, 'image') }, reused: false };
  },
};

// Scenes mode (1.1.0): the reply is the shape fal-ai/nano-banana/edit returns
// (NanoBananaEditOutput: {images: [{url, content_type, file_name, width, height}], description}).
export function falReply(name) {
  return { images: [{ url: `https://v3b.fal.media/files/test/${name}`, content_type: 'image/png', file_name: name, width: 768, height: 1344 }], description: '' };
}

/** A fake line that answers every order with a small PNG, as the kit hands a done piece to a part. */
export async function pngLine(order, ctx) {
  const name = order.results[0].name;
  const path = join(ctx.workDir, name);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=96x160:duration=1', '-frames:v', '1', '-c:v', 'png', path]);
  return { json: falReply(name), files: { [name]: await fileRef(path, 'image') }, reused: false };
}

/** A template like a 3D explainer's frames/stills.prompt.json. */
export const template = {
  version: 1,
  prefix: 'stylised 3D, soft light',
  looks: { 'pixar-3d': 'glossy 3D, subsurface skin', claymation: 'hand-made clay, thumbprints' },
  scene: '{look}. {picture}. {cast_looks}',
  anchor: 'portrait of {name}: {look}, plain background, chest up',
  suffix: 'vertical 9:16, no text, no logos',
  negative: 'text, watermark, extra fingers',
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
    model: 'fal-ai/nano-banana/edit',
    mode: 'scenes',
    aspect_ratio: '9:16',
    template: await writeTemplate(workDir),
    look: 'pixar-3d',
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

// ---- 1.2.0 products mode ----

// The request fields and the result pointer recorded for fal-ai/nano-banana/edit
// (fal OpenAPI NanoBananaEditInput, fetched 2026-10-12; GOOSE-4015 contracts/replies).
export const EDIT_FIELDS = ['limit_generations', 'safety_tolerance', 'seed', 'prompt', 'sync_mode', 'num_images', 'aspect_ratio', 'output_format', 'image_urls'];
export const EDIT_REQUIRED = ['prompt', 'image_urls'];
export const EDIT_POINTER = '/json/images/0/url';

/** A day-in-the-life style's frames/product-stills.prompt.json. */
export const productsTemplate = {
  version: 1,
  suffix: 'vertical 9:16, no text, no logos added',
  negative: 'hands, extra products, changed label',
  by_tag: {
    Snap: { scene: 'The {product.name} exactly as in the reference photo, one complete product on {answers.snap_surface}, soft key light from the upper left' },
    Angled: { scene: 'The {product.name} exactly as in the reference photo, turned 15-20 degrees to a three-quarter view, floating over warm white', negative: 'hands, a second product' },
  },
};

/** Three variants of one product line, each with its own photo, as plan.products gives them. */
export async function productsInputs(workDir, extra = {}) {
  const products = [];
  for (const [id, name] of [['mist', 'Morning Mist Green Tea'], ['hearth', 'Hearth Breakfast Black Tea'], ['garden', 'Night Garden Chamomile']]) {
    products.push({ id, name, images: [await fileRef(await makeImage(join(workDir, `${id}.png`)), 'image')] });
  }
  return {
    model: 'fal-ai/nano-banana/edit',
    mode: 'products',
    kinds: ['snap', 'angled'],
    aspect_ratio: '9:16',
    template: await writeTemplate(workDir, productsTemplate, 'product-stills.prompt.json'),
    answers: { snap_surface: 'a pale oak shelf', range_reveal: 'one_by_one' },
    products,
    ...extra,
  };
}
