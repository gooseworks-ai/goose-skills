// image-nano-banana: stills from Google's Nano Banana on fal, one paid piece
// per image. Replaces create-image-fal for this model family: the same fal
// model paths (fal-ai/nano-banana for a prompt alone, fal-ai/nano-banana/edit
// with reference images) and payload (prompt, image_urls, aspect_ratio), with
// references passed as FileRefs the core hosts. Like today's atom, a result
// whose bytes are not the PNG it is saved as is re-encoded to PNG.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';

const EDIT = 'fal-ai/nano-banana/edit';
const TEXT = 'fal-ai/nano-banana';

async function isPng(path) {
  const head = (await readFile(path)).subarray(0, 8);
  return head.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const model = inputs.model;
  for (const [i, img] of inputs.images.entries()) {
    const refs = img.references || [];
    if (model === EDIT && !refs.length) throw ctx.error('bad_input', `images[${i}] has no reference image for ${EDIT}`);
    if (model === TEXT && refs.length) throw ctx.error('bad_input', `images[${i}] has reference images; use ${EDIT}`);
  }
  const used = new Set();
  const images = [];
  for (const [i, img] of inputs.images.entries()) {
    kitStopIfAborted(ctx);
    const piece = kitPieceName('image', img.id, i, used);
    const body = { prompt: img.prompt, num_images: 1, output_format: 'png' };
    if (model === EDIT) body.image_urls = img.references;
    if (inputs.aspect_ratio) body.aspect_ratio = inputs.aspect_ratio;
    const result = await ctx.line.order({
      piece,
      provider: 'fal',
      path: `/${model}`,
      body,
      results: [{ pointer: '/json/images/0/url', name: `${piece}-raw.png`, media: 'image' }],
    });
    const raw = result.files[`${piece}-raw.png`];
    if (!raw) throw ctx.error('provider_failed', `no image for ${piece}`);
    let file;
    if (await isPng(raw.path)) file = raw;
    else {
      await kitFfmpeg(ctx, ['-i', raw.path, '-frames:v', '1', join(ctx.workDir, `${piece}.png`)]);
      file = await ctx.file(`${piece}.png`, 'image');
    }
    images.push({ id: String(img.id ?? i + 1), image: file });
    ctx.progress({ done: i + 1, total: inputs.images.length });
  }
  return kitCheckOutputs(ctx, manifest, { images });
}
