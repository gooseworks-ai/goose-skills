// H3's first frame defines its canvas. Fit first/last frames without cropping
// products instead of assuming aspect_ratio can override a raw photo's shape.
import { kitFfmpeg, kitStopIfAborted } from '../../_lib/part.mjs';
import { h3SceneResolution } from './provider.mjs';
import { join } from 'node:path';

const H3SCENE_FRAME_SHORT_SIDE = { '480P': 480, '768P': 768, '1080P': 1080 };

function h3SceneFrameKey(file, width, height) {
  return `${file.sha256}:${file.path}:${width}x${height}`;
}

const H3SCENE_PRICED_ASPECTS = [[1, 1], [4, 3], [3, 4], [16, 9], [9, 16], [5, 2], [2, 5]];

/** Use the nearest published image-token aspect, containing every original pixel. */
export function h3SceneReferenceCanvas({ width, height }) {
  const ratio = width / height;
  const [w, h] = H3SCENE_PRICED_ASPECTS.reduce((nearest, aspect) =>
    Math.abs(Math.log(ratio / (aspect[0] / aspect[1]))) < Math.abs(Math.log(ratio / (nearest[0] / nearest[1]))) ? aspect : nearest);
  const scale = Math.ceil(Math.max(width / w, height / h));
  return { width: w * scale, height: h * scale };
}

/** Fit reference images to documented token aspects without cropping or scaling their content. */
export async function h3ScenePrepareReferences(ctx, jobs) {
  const prepared = new Map();
  for (const job of jobs) {
    const refs = [];
    for (const image of job.refs) {
      kitStopIfAborted(ctx);
      const key = h3SceneFrameKey(image, 0, 0);
      if (!prepared.has(key)) {
        const info = await ctx.tools.probe(image.path);
        if (!Number.isInteger(info.width) || !Number.isInteger(info.height) || info.width < 1 || info.height < 1) {
          throw ctx.error('bad_input', `${job.who ?? job.id} has a reference without readable image dimensions`);
        }
        const { width, height } = h3SceneReferenceCanvas(info);
        if (width === info.width && height === info.height) prepared.set(key, image);
        else {
          const name = `reference-${image.sha256}.png`;
          await kitFfmpeg(ctx, ['-i', image.path, '-frames:v', '1', '-vf', `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`, join(ctx.workDir, name)]);
          prepared.set(key, await ctx.file(name, 'image'));
        }
      }
      refs.push(prepared.get(key));
    }
    job.refs = refs;
  }
}

/** Pixel canvas for an explicit ratio; adaptive follows the first frame. */
export function h3SceneFrameCanvas(inputs, source) {
  const aspect = inputs.aspect_ratio ?? '9:16';
  if (aspect === 'adaptive') return { width: source.width, height: source.height };
  const [w, h] = aspect.split(':').map(Number);
  const short = H3SCENE_FRAME_SHORT_SIDE[h3SceneResolution(inputs)];
  const scale = short / Math.min(w, h);
  return { width: Math.round(w * scale / 2) * 2, height: Math.round(h * scale / 2) * 2 };
}

/**
 * Mode stills' canvas: exactly the requested ratio (so the line can price both
 * image fields from a published token aspect) with the short side at least the
 * resolution's and both sides even. 9:16 is 1080x1920 at 1080P, 774x1376 at
 * 768P and 486x864 at 480P. adaptive keeps the still's own size.
 */
export function h3SceneStillCanvas(inputs, source) {
  const aspect = inputs.aspect_ratio ?? '9:16';
  if (aspect === 'adaptive') return { width: source.width, height: source.height };
  const [w, h] = aspect.split(':').map(Number);
  let k = Math.ceil(H3SCENE_FRAME_SHORT_SIDE[h3SceneResolution(inputs)] / Math.min(w, h));
  if ((w * k) % 2 || (h * k) % 2) k += 1;
  return { width: w * k, height: h * k };
}

/**
 * Mode stills: fit each scene still to the clip's canvas by cover (scale to fill,
 * centre crop). A still is a generated scene picture made for this shape, so a
 * few edge pixels are cut instead of adding black bars that H3 would animate.
 * Every probe and fit runs before any provider order.
 */
export async function h3SceneFitStills(inputs, ctx, jobs) {
  const fitted = new Map();
  let index = 0;
  for (const job of jobs) {
    kitStopIfAborted(ctx);
    const still = job.start;
    if (!fitted.has(h3SceneFrameKey(still, 0, 0))) {
      const info = await ctx.tools.probe(still.path);
      if (!Number.isInteger(info.width) || !Number.isInteger(info.height) || info.width < 1 || info.height < 1) {
        throw ctx.error('bad_input', `${job.who} has a still without readable image dimensions`);
      }
      const { width, height } = h3SceneStillCanvas(inputs, info);
      if (info.width === width && info.height === height) fitted.set(h3SceneFrameKey(still, 0, 0), still);
      else {
        const name = `still-${++index}.png`;
        await kitFfmpeg(ctx, ['-i', still.path, '-frames:v', '1', '-vf', `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`, join(ctx.workDir, name)]);
        fitted.set(h3SceneFrameKey(still, 0, 0), await ctx.file(name, 'image'));
      }
    }
    job.start = fitted.get(h3SceneFrameKey(still, 0, 0));
  }
}

/** Free preprocessing for every frame, completed before any provider order. */
export async function h3ScenePrepareFrames(inputs, ctx, jobs) {
  const probes = new Map();
  for (const job of jobs) {
    for (const frame of [job.start, job.end].filter(Boolean)) {
      kitStopIfAborted(ctx);
      const key = h3SceneFrameKey(frame, 0, 0);
      if (!probes.has(key)) {
        const info = await ctx.tools.probe(frame.path);
        if (!Number.isInteger(info.width) || !Number.isInteger(info.height) || info.width < 1 || info.height < 1) {
          throw ctx.error('bad_input', `${job.who} has a first or last frame without readable image dimensions`);
        }
        probes.set(key, info);
      }
    }
    job.canvas = h3SceneFrameCanvas(inputs, probes.get(h3SceneFrameKey(job.start, 0, 0)));
  }
  const fitted = new Map();
  let index = 0;
  for (const job of jobs) {
    const { width, height } = job.canvas;
    for (const key of ['start', 'end']) {
      const frame = job[key];
      if (!frame) continue;
      const cacheKey = h3SceneFrameKey(frame, width, height);
      if (!fitted.has(cacheKey)) {
        const info = probes.get(h3SceneFrameKey(frame, 0, 0));
        if (info.width === width && info.height === height) fitted.set(cacheKey, frame);
        else {
          const name = `frame-${++index}.png`;
          await kitFfmpeg(ctx, ['-i', frame.path, '-frames:v', '1', '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`, join(ctx.workDir, name)]);
          fitted.set(cacheKey, await ctx.file(name, 'image'));
        }
      }
      job[key] = fitted.get(cacheKey);
    }
  }
}
