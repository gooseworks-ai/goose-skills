// Pixel and sample measures on the finished cut for the check layer: the
// brand logo found by grayscale normalised correlation over a size search
// (review-finished-ad's logo check), on the whole frame or inside the box a
// step declared for it, picture motion (the logo-equation-card b-roll gate),
// and the sound rising where a message appears. ffmpeg decodes to raw files in
// tmpDir; the maths is plain JS. Every top-level name starts with `kit`.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitFfmpeg, kitNum } from './part.mjs';

const KIT_LOGO_FRAME_W = 120;

async function kitRaw(ctx, args, name, format = 'rawvideo') {
  const path = join(ctx.tmpDir, name);
  await kitFfmpeg(ctx, [...args, '-f', format, path]);
  return readFile(path);
}

/** One frame at `t` as 8-bit gray, `w` wide. */
export async function kitGrayFrame(ctx, video, t, w, h) {
  const data = await kitRaw(ctx, ['-ss', kitNum(t), '-i', video, '-frames:v', '1', '-vf', `scale=${w}:${h}:flags=area,format=gray`, '-pix_fmt', 'gray'], `frame-${Math.round(t * 1000)}.raw`);
  return { w, h, data };
}

function kitResize(src, sw, sh, dw, dh) {
  const out = new Float64Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      // Area average of the source box this pixel covers.
      const x0 = (x * sw) / dw;
      const x1 = ((x + 1) * sw) / dw;
      const y0 = (y * sh) / dh;
      const y1 = ((y + 1) * sh) / dh;
      let sum = 0;
      let n = 0;
      for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++) {
        for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
          sum += src[yy * sw + xx];
          n++;
        }
      }
      out[y * dw + x] = n ? sum / n : 0;
    }
  }
  return out;
}

/**
 * kitBestNcc over only the template pixels where `mask` is set: a badge's artwork is compared, not the
 * outline it shares with every other badge of its shape.
 */
function kitBestMaskedNcc(img, iw, ih, tpl, mask, tw, th) {
  const idx = [];
  for (let i = 0; i < tw * th; i++) if (mask[i] >= 128) idx.push(i);
  const n = idx.length;
  if (n < 16) return { score: 0, x: 0, y: 0 };
  let tMean = 0;
  for (const i of idx) tMean += tpl[i];
  tMean /= n;
  const t = new Float64Array(n);
  const off = new Int32Array(n);
  let tNorm = 0;
  idx.forEach((i, j) => {
    t[j] = tpl[i] - tMean;
    tNorm += t[j] * t[j];
    off[j] = Math.floor(i / tw) * iw + (i % tw);
  });
  if (tNorm < 1e-6) return { score: 0, x: 0, y: 0 };
  let best = { score: 0, x: 0, y: 0 };
  for (let y = 0; y + th <= ih; y++) {
    for (let x = 0; x + tw <= iw; x++) {
      const base = y * iw + x;
      let sum = 0;
      let sq = 0;
      let cross = 0;
      for (let j = 0; j < n; j++) {
        const v = img[base + off[j]];
        sum += v;
        sq += v * v;
        cross += v * t[j];
      }
      const varI = sq - (sum * sum) / n;
      if (varI < 1e-6) continue;
      const score = Math.abs(cross) / Math.sqrt(varI * tNorm);
      if (score > best.score) best = { score, x, y };
    }
  }
  return best;
}

/** The best absolute normalised correlation of `tpl` (tw x th) anywhere in `img` (iw x ih), and where. */
function kitBestNcc(img, iw, ih, tpl, tw, th) {
  const n = tw * th;
  let tMean = 0;
  for (let i = 0; i < n; i++) tMean += tpl[i];
  tMean /= n;
  const t = new Float64Array(n);
  let tNorm = 0;
  for (let i = 0; i < n; i++) {
    t[i] = tpl[i] - tMean;
    tNorm += t[i] * t[i];
  }
  if (tNorm < 1e-6) return { score: 0, x: 0, y: 0 };
  // Integral images of the frame and its square for each window's mean and spread.
  const W = iw + 1;
  const s1 = new Float64Array(W * (ih + 1));
  const s2 = new Float64Array(W * (ih + 1));
  for (let y = 0; y < ih; y++) {
    let r1 = 0;
    let r2 = 0;
    for (let x = 0; x < iw; x++) {
      const v = img[y * iw + x];
      r1 += v;
      r2 += v * v;
      s1[(y + 1) * W + x + 1] = s1[y * W + x + 1] + r1;
      s2[(y + 1) * W + x + 1] = s2[y * W + x + 1] + r2;
    }
  }
  let best = { score: 0, x: 0, y: 0 };
  for (let y = 0; y + th <= ih; y++) {
    for (let x = 0; x + tw <= iw; x++) {
      const a = y * W + x;
      const b = y * W + x + tw;
      const c = (y + th) * W + x;
      const d = (y + th) * W + x + tw;
      const sum = s1[d] - s1[b] - s1[c] + s1[a];
      const sq = s2[d] - s2[b] - s2[c] + s2[a];
      const varI = sq - (sum * sum) / n;
      if (varI < 1e-6) continue;
      let cross = 0;
      for (let ty = 0; ty < th; ty++) {
        const row = (y + ty) * iw + x;
        const trow = ty * tw;
        for (let tx = 0; tx < tw; tx++) cross += img[row + tx] * t[trow + tx];
      }
      const score = Math.abs(cross) / Math.sqrt(varI * tNorm);
      if (score > best.score) best = { score, x, y };
    }
  }
  return best;
}

/**
 * The logo file as a matching template, `lw` wide: a logo with transparency
 * is matched by its shape (alpha), so a white mark on a dark card counts; an
 * opaque logo by its whole image.
 */
async function kitLogoTemplate(ctx, logo, lw) {
  const rgba = await kitRaw(ctx, ['-i', logo.path, '-frames:v', '1', '-vf', `scale=${lw}:-2:flags=area,format=rgba`, '-pix_fmt', 'rgba'], `logo-${lw}.raw`);
  const lh = Math.floor(rgba.length / 4 / lw);
  if (lh < 2) return null;
  let transparent = 0;
  const gray = new Float64Array(lw * lh);
  const alpha = new Float64Array(lw * lh);
  const onWhite = new Float64Array(lw * lh);
  const onBlack = new Float64Array(lw * lh);
  for (let i = 0; i < lw * lh; i++) {
    const [r, g, b, a] = [rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], rgba[i * 4 + 3]];
    alpha[i] = a;
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    onBlack[i] = (gray[i] * a) / 255;
    onWhite[i] = onBlack[i] + 255 - a;
    if (a < 250) transparent++;
  }
  const mode = transparent > lw * lh * 0.05 ? 'mark' : 'image';
  // A logo with transparency is matched by its shape, and then by its picture laid on white and on black:
  // a shape alone misses a logo whose own drawing (a letter on a tile) is what shows. Whether the shape tells
  // is judged inside the drawn part, past any clear padding: a badge or a tile with round corners is mostly
  // opaque there, has no telling shape, and only its picture counts.
  let [bx0, by0, bx1, by1] = [lw, lh, -1, -1];
  for (let y = 0; y < lh; y++) {
    for (let x = 0; x < lw; x++) {
      if (alpha[y * lw + x] < 16) continue;
      [bx0, by0, bx1, by1] = [Math.min(bx0, x), Math.min(by0, y), Math.max(bx1, x), Math.max(by1, y)];
    }
  }
  let clear = 0;
  for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) if (alpha[y * lw + x] < 250) clear++;
  const drawn = Math.max(1, (bx1 - bx0 + 1) * (by1 - by0 + 1));
  const shaped = bx1 >= bx0 && clear > drawn * 0.25;
  // A mostly opaque logo (a badge, a tile) is matched on its artwork inside its own outline.
  const sources = mode === 'image' ? [{ tpl: gray }] : shaped ? [{ tpl: alpha }, { tpl: onWhite }, { tpl: onBlack }] : [{ tpl: gray, mask: alpha }];
  return { mode, src: sources[0].mask ? onWhite : sources[0].tpl, sources, lw, lh };
}

/**
 * How well the brand's logo file is found in the frames at `times`: the best
 * |NCC| over a size search (15 % to 60 % of the frame width) on a 120 px wide
 * copy of the whole frame. `box` is where the best match sits, in the video's
 * pixels.
 */
export async function kitLogoScore(ctx, video, logo, times, frameW, frameH) {
  const template = await kitLogoTemplate(ctx, logo, 160);
  if (!template) return { score: 0, mode: 'image', box: null };
  const { mode, src: tplSrc, lw, lh } = template;
  const iw = KIT_LOGO_FRAME_W;
  const ih = Math.max(2, Math.round((iw * frameH) / frameW / 2) * 2);
  let best = { score: 0, box: null };
  const k = frameW / iw;
  for (const t of times) {
    const f = await kitGrayFrame(ctx, video, t, iw, ih);
    const img = Float64Array.from(f.data);
    for (let frac = 0.15; frac <= 0.6001; frac += 0.05) {
      const tw = Math.max(6, Math.round(frac * iw));
      const th = Math.max(4, Math.round((tw * lh) / lw));
      if (th >= ih) continue;
      const tpl = kitResize(tplSrc, lw, lh, tw, th);
      const m = kitBestNcc(img, iw, ih, tpl, tw, th);
      if (m.score > best.score) best = { score: m.score, t, box: { x: Math.round(m.x * k), y: Math.round(m.y * k), w: Math.round(tw * k), h: Math.round(th * k) } };
    }
  }
  return { score: +best.score.toFixed(3), mode, box: best.box, t: best.t };
}

/** `src` (w x h) turned by `deg` about its centre, same size; corners from outside take `fill`. */
function kitRotate(src, w, h, deg, fill) {
  const a = (deg * Math.PI) / 180;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  const [cx, cy] = [(w - 1) / 2, (h - 1) / 2];
  const out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = c * (x - cx) + s * (y - cy) + cx;
      const sy = -s * (x - cx) + c * (y - cy) + cy;
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      if (x0 < 0 || y0 < 0 || x0 + 1 >= w || y0 + 1 >= h) {
        out[y * w + x] = fill;
        continue;
      }
      const fx = sx - x0;
      const fy = sy - y0;
      const i = y0 * w + x0;
      out[y * w + x] = (src[i] * (1 - fx) + src[i + 1] * fx) * (1 - fy) + (src[i + w] * (1 - fx) + src[i + w + 1] * fx) * fy;
    }
  }
  return out;
}

// Inside a declared box the match runs on the box itself, its long side at most this many pixels.
const KIT_LOGO_BOX_LONG = 200;
// Template sizes against the logo fitted to the box, and the turns tried at the closest few
// (a card drawn at a slight angle carries its logo with it).
// The box is where a step drew the logo, so the logo spans most of it: at least 40 % of the box's long side.
// A smaller template (a few pixels) correlates with any corner of the picture, the wrong logo's included.
const KIT_LOGO_BOX_SCALES = [1.06, 1, 0.94, 0.88, 0.82, 0.76, 0.7, 0.62, 0.55, 0.48, 0.4, 0.33];
const KIT_LOGO_BOX_MIN_SPAN = 0.4;
const KIT_LOGO_BOX_MIN_PX = 12;
const KIT_LOGO_BOX_ANGLES = [-1.5, 1.5, -3, 3, -5, 5];
const KIT_LOGO_GOOD = 0.92;

/**
 * How well the brand's logo file is found inside `zone` (the box a step
 * declared for the logo it drew, in the video's pixels) in the frames at
 * `times`: the box plus a margin is cut from the full-resolution frame, and
 * the logo is matched there over sizes up to the box and small turns, so a
 * logo drawn small, in a badge or on a tilted card is still measured.
 */
export async function kitLogoScoreInBox(ctx, video, logo, times, frameW, frameH, zone) {
  const template = await kitLogoTemplate(ctx, logo, 480);
  if (!template) return { score: 0, mode: 'image', box: null };
  const { mode, sources, lw, lh } = template;
  const margin = Math.max(6, Math.round(0.08 * Math.max(zone.w, zone.h)));
  const x0 = Math.max(0, Math.floor(zone.x - margin));
  const y0 = Math.max(0, Math.floor(zone.y - margin));
  const x1 = Math.min(frameW, Math.ceil(zone.x + zone.w + margin));
  const y1 = Math.min(frameH, Math.ceil(zone.y + zone.h + margin));
  if (x1 - x0 < 8 || y1 - y0 < 8) return { score: 0, mode, box: null };
  const k = Math.min(1, KIT_LOGO_BOX_LONG / Math.max(x1 - x0, y1 - y0));
  const iw = Math.max(8, Math.round((x1 - x0) * k));
  const ih = Math.max(8, Math.round((y1 - y0) * k));
  // The logo fitted inside the box (as object-fit: contain draws it), in the copy's pixels.
  const fit = Math.min(zone.w / lw, zone.h / lh) * k;
  const sizes = KIT_LOGO_BOX_SCALES.map((f) => [Math.round(lw * fit * f), Math.round(lh * fit * f)]).filter(([tw, th]) => Math.min(tw, th) >= KIT_LOGO_BOX_MIN_PX && Math.max(tw, th) >= KIT_LOGO_BOX_MIN_SPAN * Math.max(zone.w, zone.h) * k && tw <= iw && th <= ih);
  const frames = [];
  for (const t of times) {
    const raw = await kitRaw(ctx, ['-ss', kitNum(t), '-i', video, '-frames:v', '1', '-vf', `crop=${x1 - x0}:${y1 - y0}:${x0}:${y0},scale=${iw}:${ih}:flags=area,format=gray`, '-pix_fmt', 'gray'], `zone-${Math.round(t * 1000)}.raw`);
    frames.push({ t, img: Float64Array.from(raw) });
  }
  let best = { score: 0, box: null };
  for (const { tpl: tplSrc, mask: maskSrc } of sources) {
    // A turned template's corners take the template's own edge (nothing, for a shape), and no mask.
    let fill = 0;
    for (let x = 0; x < lw; x++) fill += tplSrc[x] + tplSrc[(lh - 1) * lw + x];
    fill /= 2 * lw;
    const templates = new Map();
    const tplAt = (tw, th, deg) => {
      const key = `${tw}x${th}@${deg}`;
      if (!templates.has(key)) {
        const tpl = kitRotate(kitResize(tplSrc, lw, lh, tw, th), tw, th, deg, fill);
        templates.set(key, { tpl, mask: maskSrc ? kitRotate(kitResize(maskSrc, lw, lh, tw, th), tw, th, deg, 0) : null });
      }
      return templates.get(key);
    };
    const at = (img, t, tw, th, deg) => {
      const { tpl, mask } = tplAt(tw, th, deg);
      const m = mask ? kitBestMaskedNcc(img, iw, ih, tpl, mask, tw, th) : kitBestNcc(img, iw, ih, tpl, tw, th);
      if (m.score > best.score) {
        best = { score: m.score, t, angle: deg, box: { x: Math.round(x0 + m.x / k), y: Math.round(y0 + m.y / k), w: Math.round(tw / k), h: Math.round(th / k) } };
      }
      return m.score;
    };
    for (const { t, img } of frames) {
      const scored = sizes.map(([tw, th]) => ({ tw, th, score: at(img, t, tw, th, 0) }));
      if (best.score >= KIT_LOGO_GOOD) break;
      // Small turns at the three sizes that came closest.
      for (const { tw, th } of scored.sort((a, b) => b.score - a.score).slice(0, 3)) for (const deg of KIT_LOGO_BOX_ANGLES) at(img, t, tw, th, deg);
      if (best.score >= KIT_LOGO_GOOD) break;
    }
    if (best.score >= KIT_LOGO_GOOD) break;
  }
  return { score: +best.score.toFixed(3), mode, box: best.box, t: best.t, angle: best.angle };
}

/**
 * Picture motion from 0 to `untilS`: the mean absolute frame-to-frame
 * difference on a 160 x 160 grayscale copy, over the half of the rows that
 * move most (so a still card above a moving band does not dilute the band).
 */
export async function kitMotion(ctx, video, untilS) {
  const size = 160;
  const raw = await kitRaw(ctx, ['-i', video, '-t', kitNum(untilS), '-an', '-vf', `scale=${size}:${size}:flags=area,format=gray`, '-pix_fmt', 'gray'], 'motion.raw');
  const px = size * size;
  const frames = Math.floor(raw.length / px);
  if (frames < 2) return null;
  const rowTotals = new Float64Array(size);
  for (let f = 1; f < frames; f++) {
    for (let y = 0; y < size; y++) {
      let s = 0;
      for (let x = 0; x < size; x++) s += Math.abs(raw[f * px + y * size + x] - raw[(f - 1) * px + y * size + x]);
      rowTotals[y] += s;
    }
  }
  const sorted = [...rowTotals].sort((a, b) => b - a).slice(0, size / 2);
  const total = sorted.reduce((a, b) => a + b, 0);
  return +(total / ((size / 2) * size * (frames - 1))).toFixed(3);
}

/** RMS level (dB full scale) of the cut's sound in each [from, to] window. */
export async function kitWindowLevels(ctx, video, windows) {
  const rate = 8000;
  const raw = await kitRaw(ctx, ['-i', video, '-vn', '-ac', '1', '-ar', String(rate), '-c:a', 'pcm_s16le'], 'sound.raw', 's16le').catch(() => null);
  const samples = raw ? new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2)) : new Int16Array(0);
  return windows.map(([from, to]) => {
    const a = Math.max(0, Math.floor(from * rate));
    const b = Math.min(samples.length, Math.ceil(to * rate));
    if (b <= a) return -Infinity;
    let sum = 0;
    for (let i = a; i < b; i++) sum += (samples[i] / 32768) ** 2;
    const rms = Math.sqrt(sum / (b - a));
    return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  });
}
