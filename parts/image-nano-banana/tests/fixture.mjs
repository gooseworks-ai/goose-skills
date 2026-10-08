// A fake private line for image-nano-banana: the first image comes back as a
// JPEG (as some fal models answer), later ones as PNG.
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
