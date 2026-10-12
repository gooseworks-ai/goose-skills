// H3 Max's fal contract, recorded from the official queue OpenAPI on 2026-10-12.
// A scene part uses image references only. Native sound is kept by default;
// generate_audio: false drops that sound locally because H3 has no such flag.
import { kitFfmpeg } from '../../_lib/part.mjs';
import { join } from 'node:path';

export const H3SCENE_MODEL = 'minimax/h3-max/reference-to-video';
const H3SCENE_PROVIDER_PROMPT_MAX = 12000;

/** Translate a Seedance-style image token without changing ordinary handles or dialogue. */
export function h3SceneProviderPrompt(prompt, refs, who) {
  const check = (n) => {
    const index = Number(n);
    if (!Number.isInteger(index) || index < 1 || index > refs) {
      throw new Error(`${who} names Image ${n}, but has ${refs} reference image${refs === 1 ? '' : 's'}`);
    }
    return `Image ${index}`;
  };
  const out = prompt.replace(/(?<![\w@])@(Image|Video|Audio)([A-Za-z0-9_-]*)(?![\w])/gi, (token, kind, n) => {
    if (kind.toLowerCase() !== 'image') throw new Error(`${who} names ${token}; this part accepts image references only`);
    if (!/^[0-9]+$/.test(n)) throw new Error(`${who} has an unknown image reference ${token}; use Image N with a supplied reference image`);
    return check(n);
  });
  for (const m of out.matchAll(/(?<![\w@])Image\s+([0-9]+)(?![\w])/gi)) check(m[1]);
  const unsupported = /(?<![\w@])@?(Video|Audio)\s*([0-9]+)(?![\w])/i.exec(out);
  if (unsupported) throw new Error(`${who} names ${unsupported[1]} ${unsupported[2]}; this part accepts image references only`);
  if (out.length > H3SCENE_PROVIDER_PROMPT_MAX) throw new Error(`${who}'s prompt is ${out.length} characters, over ${H3SCENE_PROVIDER_PROMPT_MAX}`);
  return out;
}

/** H3 has one endpoint for reference clips and first/last-frame clips. */
export function h3SceneProviderBody(inputs, job, refs, seed) {
  return {
    prompt: job.prompt,
    reference_image_urls: refs,
    ...(job.start ? { image_url: job.start } : {}),
    ...(job.end ? { end_image_url: job.end } : {}),
    duration: job.seconds,
    resolution: inputs.resolution ?? '1080P',
    aspect_ratio: inputs.aspect_ratio ?? '9:16',
    prompt_expansion_mode: 'disabled',
    seed,
  };
}

/** Keep a native dialogue clip; a requested silent clip gets a distinct audio-free file. */
export async function h3SceneProviderVideo(ctx, file, piece, audio) {
  const info = await ctx.tools.probe(file.path);
  if (!info.width || !info.height) throw ctx.error('provider_failed', `${piece} came back without a picture`);
  if (audio && !info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its native audio`);
  if (audio || !info.has_audio) return { file, info };
  const name = `${piece}-silent.mp4`;
  await kitFfmpeg(ctx, ['-i', file.path, '-map', '0:v:0', '-c:v', 'copy', '-an', join(ctx.workDir, name)]);
  const silent = await ctx.file(name, 'video');
  return { file: silent, info: await ctx.tools.probe(silent.path) };
}
