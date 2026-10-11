// overlay: lays pictures over a video at time windows. A corner logo for the
// whole video or until the end card; a product's real photo laid over each
// scene whose picture names it (the 3D explainer's box-free plate), with an
// optional scale-in. The video is re-encoded once with the size rule's
// bitrate cap; its sound is copied unchanged; the timeline passes through.
// When nothing applies (no scene names a product), the cut passes through.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg } from '../../_lib/part.mjs';
import { OVL_MAX_BYTES, OVL_RATE_CAP, ovlBox, ovlFilterGraph, ovlIsRefusal, ovlWindows } from './windows.mjs';

const OVL_READABLE = new Set(['image/png', 'image/jpeg', 'image/webp']);

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { video, timeline, items } = inputs;
  const info = await ctx.tools.probe(video.path);
  const W = info.width || video.width || timeline.width;
  const H = info.height || video.height || timeline.height;
  const fps = info.fps || video.fps || timeline.fps || 30;
  const duration = await kitDuration(ctx, video);

  let planned;
  try {
    planned = ovlWindows({ items, duration_s: duration, timeline, scenes: inputs.scenes, products: inputs.products });
  } catch (err) {
    if (ovlIsRefusal(err)) throw ctx.error('bad_input', err.message);
    throw err;
  }
  for (const note of planned.notes) ctx.log.warn(note);
  if (!planned.windows.length) {
    ctx.log.info('overlay draws nothing, so the cut passes through');
    return kitCheckOutputs(ctx, manifest, { video, timeline });
  }

  // One ffmpeg input per distinct picture, sized once.
  const pictures = new Map();
  for (const w of planned.windows) {
    const key = w.image.sha256;
    if (pictures.has(key)) continue;
    if (w.image.mime && !OVL_READABLE.has(w.image.mime)) {
      throw ctx.error('bad_input', `the picture ${w.image.path.split('/').pop()} is ${w.image.mime}; overlay draws PNG, JPEG or WebP files`);
    }
    let size = w.image.width > 0 && w.image.height > 0 ? w.image : null;
    if (!size) {
      try {
        size = await ctx.tools.probe(w.image.path);
      } catch {
        size = null;
      }
    }
    if (!size || !(size.width > 0 && size.height > 0)) throw ctx.error('bad_input', `the picture ${w.image.path.split('/').pop()} cannot be read as an image`);
    pictures.set(key, { input: pictures.size + 1, file: w.image, size });
  }
  const windows = planned.windows.map((w) => {
    const item = items[w.item];
    const pic = pictures.get(w.image.sha256);
    let box;
    try {
      box = ovlBox(item, pic.size, W, H);
    } catch (err) {
      if (ovlIsRefusal(err)) throw ctx.error('bad_input', `items[${w.item}]: ${err.message}`);
      throw err;
    }
    const scaleIn = Math.min(item.scale_in_s || 0, w.end_s - w.start_s);
    return { ...w, input: pic.input, box, scale_in_s: scaleIn, opacity: item.opacity == null ? 1 : item.opacity };
  });
  ctx.log.info('overlay windows', { windows: windows.map((w) => ({ item: w.item, start_s: w.start_s, end_s: w.end_s, box: w.box })) });

  const { graph, out } = ovlFilterGraph(windows, { fps });
  const args = ['-i', video.path];
  for (const pic of pictures.values()) args.push('-loop', '1', '-framerate', String(fps), '-t', String(duration), '-i', pic.file.path);
  args.push(
    '-filter_complex',
    graph,
    '-map',
    `[${out}]`,
    '-map',
    '0:a?',
    ...ctx.tools.encodeArgs('h264-master'),
    ...OVL_RATE_CAP,
    '-c:a',
    'copy',
    '-t',
    String(duration),
    join(ctx.workDir, 'overlaid.mp4'),
  );
  await kitFfmpeg(ctx, args);
  const result = await ctx.file('overlaid.mp4', 'video');
  if (result.bytes > OVL_MAX_BYTES) {
    const mb = (n) => (n / (1024 * 1024)).toFixed(1);
    throw ctx.error('output_invalid', `the video is ${mb(result.bytes)} MB, over the ${mb(OVL_MAX_BYTES)} MB a finished video may be; make it shorter`);
  }
  return kitCheckOutputs(ctx, manifest, { video: result, timeline });
}
