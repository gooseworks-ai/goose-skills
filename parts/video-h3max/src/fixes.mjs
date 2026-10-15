// Free fixes on each paid take before anything uses it (modes take and takes, input `fixes`):
//   mirror: the take is flipped left to right when the product photo matches the flipped frames (mirror.mjs).
//   screen: a phone screen H3 drew over the picture is cropped away and the picture scaled back (screen.mjs).
// Both measure the same six frames, 540 pixels wide. A take that needs neither is passed on untouched.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { kitDuration, kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { mirGrey, mirVerdict } from './mirror.mjs';
import { scrCrop, scrMeasure } from './screen.mjs';

export const H3FIX_KINDS = ['mirror', 'screen'];
const H3FIX_FRAMES = 6;
const H3FIX_WIDTH = 540;
const H3FIX_PRODUCT_SIDE = 360;

async function h3FixGrey(ctx, path, at, w, h, name) {
  const out = join(ctx.tmpDir || ctx.workDir, name);
  const seek = at == null ? [] : ['-ss', kitNum(at)];
  await kitFfmpeg(ctx, [...seek, '-i', path, '-an', '-frames:v', '1', '-vf', `scale=${w}:${h}:flags=area,format=gray`, '-pix_fmt', 'gray', '-f', 'rawvideo', out]);
  const bytes = readFileSync(out);
  if (bytes.length !== w * h) throw ctx.error('tool_failed', `${name}: expected ${w * h} bytes of grey, got ${bytes.length}`);
  return mirGrey(w, h, bytes);
}

/** The first product photo in the plan, as a grey image at most 360 pixels on its long side; null when none. */
export async function h3FixProduct(ctx, products) {
  const photo = (products || []).map((p) => p && Array.isArray(p.images) && p.images[0]).find((f) => f && f.kind === 'file');
  if (!photo) return null;
  const info = await ctx.tools.probe(photo.path);
  if (!info.width || !info.height) return null;
  const s = H3FIX_PRODUCT_SIDE / Math.max(info.width, info.height);
  const w = Math.max(16, Math.round((info.width * s) / 2) * 2);
  const h = Math.max(16, Math.round((info.height * s) / 2) * 2);
  return h3FixGrey(ctx, photo.path, null, w, h, 'fix-product.gray');
}

/**
 * Checks one take and, when needed, writes `<piece>-fixed.mp4` (flipped and/or cropped, sound copied).
 * Returns { file, info, fixed: ['flipped'?, 'cropped'?], mirror?, screen? }.
 */
export async function h3FixTake(ctx, { file, info }, piece, fixes, product) {
  const want = new Set(fixes || []);
  if (!want.size) return { file, info, fixed: [] };
  const length = await kitDuration(ctx, file);
  const w = H3FIX_WIDTH;
  const h = Math.max(16, Math.round((info.height * w) / info.width / 2) * 2);
  const frames = [];
  for (let k = 0; k < H3FIX_FRAMES; k++) frames.push(await h3FixGrey(ctx, file.path, ((k + 0.5) * length) / H3FIX_FRAMES, w, h, `${piece}-fix-${k}.gray`));

  const vf = [];
  const fixed = [];
  const report = {};
  if (want.has('mirror')) {
    if (!product) {
      ctx.log.info(`${piece}: no product photo, so the mirror check is skipped`, { piece });
    } else {
      const m = mirVerdict(product, frames);
      report.mirror = m;
      ctx.log.info(`${piece}: label reads ${m.verdict} (as is ${m.normal}, flipped ${m.flipped})`, { piece, ...m });
      if (m.verdict === 'mirrored') {
        vf.push('hflip');
        fixed.push('flipped');
      }
    }
  }
  if (want.has('screen')) {
    const s = scrMeasure(frames);
    report.screen = s;
    if (s.drawn) {
      const c = scrCrop(s, info.width, info.height, info.width / w);
      report.screen = { ...s, crop: c };
      ctx.log.info(`${piece}: a drawn phone screen (band ${JSON.stringify(s.bands)}, corner ${Math.round(s.radius)}) is cropped to ${c.w}x${c.h} at ${c.x},${c.y}`, { piece, crop: c });
      vf.push(`crop=${c.w}:${c.h}:${c.x}:${c.y}`, `scale=${info.width}:${info.height}:flags=lanczos`, 'setsar=1');
      fixed.push('cropped');
    }
  }
  if (!vf.length) return { file, info, fixed, ...report };
  const name = `${piece}-fixed.mp4`;
  await kitFfmpeg(ctx, ['-i', file.path, '-map', '0:v:0', '-map', '0:a?', '-vf', vf.join(','), ...ctx.tools.encodeArgs('h264-master'), '-c:a', 'copy', join(ctx.workDir, name)]);
  const out = await ctx.file(name, 'video');
  return { file: out, info: await ctx.tools.probe(out.path), fixed, ...report };
}
