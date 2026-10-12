// H3's first frame defines its canvas. Fit first/last frames without cropping
// products instead of assuming aspect_ratio can override a raw photo's shape.
import { kitFfmpeg, kitStopIfAborted } from '../../_lib/part.mjs';
import { join } from 'node:path';

const H3SCENE_FRAME_SHORT_SIDE = { '480P': 480, '768P': 768, '1080P': 1080 };

function h3SceneFrameKey(file, width, height) {
  return `${file.sha256}:${file.path}:${width}x${height}`;
}

/** Keep reference images within H3's 2:5..5:2 range without cropping their content. */
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
        const ratio = info.width / info.height;
        if (ratio >= 0.4 && ratio <= 2.5) prepared.set(key, image);
        else {
          const width = ratio < 0.4 ? Math.ceil(info.height * 0.4) : info.width;
          const height = ratio > 2.5 ? Math.ceil(info.width / 2.5) : info.height;
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
  const short = H3SCENE_FRAME_SHORT_SIDE[inputs.resolution ?? '1080P'];
  const scale = short / Math.min(w, h);
  return { width: Math.round(w * scale / 2) * 2, height: Math.round(h * scale / 2) * 2 };
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
