// Plate restore for shots mode (a port of the stop-motion recipe's
// restore_plate.py). Free: ffmpeg decodes and encodes, the rest is plain JS on
// raw RGB bytes, including Pillow's GaussianBlur (three box passes per axis,
// rounded to bytes after each), so the masks match the recipe's.
//
// An edit re-photographs the whole frame, so even with the shot's plate as the
// first reference the surface comes back as a close copy: the grain, the board
// seams and the edge of the window light move a little from frame to frame, and
// on hard cuts that reads as the table changing. giPlateRestore keeps the
// generated pixels only where the state really differs from the plate (the
// objects and their shadows, grown and feathered) and takes everything else from
// the plate itself, so the surface is the same pixels in every frame of a shot.
//
// Steps, as in restore_plate.py:
//   1. blur plate and state (sigma 6) so grain does not count as change;
//   2. take out an exposure drift: of three gains (none, the whole-frame median
//      ratio, the median ratio over pixels that already agree with the plate)
//      keep the one that leaves the least of the frame "changed";
//   3. changed = colour distance over 26; open with a 7x7 square; drop regions
//      under 0.15 % of the frame; fill holes; grow 36 px (a diamond, as scipy's
//      cross-structured dilation repeated); feather (blur sigma 18);
//   4. out = state x alpha + plate x (1 - alpha).
// Only for a locked camera and an EMPTY plate.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitFfmpeg } from '../../_lib/part.mjs';

export const GI_RESTORE = { thresh: 26, calm: 15, blur: 6, open: 7, min_area: 0.0015, grow: 36, feather: 18 };

/** Pillow's box radius for a Gaussian of `sigma` made of `passes` box blurs (_gaussian_blur_radius). */
export function giPlateBoxRadius(sigma, passes = 3) {
  const sigma2 = (sigma * sigma) / passes;
  const L = Math.sqrt(12 * sigma2 + 1);
  const l = Math.floor((L - 1) / 2);
  const a = ((2 * l + 1) * (l * (l + 1) - 3 * sigma2)) / (6 * (sigma2 - (l + 1) * (l + 1)));
  return l + a;
}

/** One box pass along every line (Pillow's ImagingLineBoxBlur8: edges repeat, a fractional far pixel, rounded to a byte). */
function giPlateBoxPass(data, lines, len, lineStep, step, channels, fr) {
  const r = Math.floor(fr);
  const ww = Math.floor(2 ** 24 / (fr * 2 + 1));
  const fw = Math.floor((2 ** 24 - (r * 2 + 1) * ww) / 2);
  const line = new Int32Array(len);
  const last = len - 1;
  const at = (k) => line[k < 0 ? 0 : k > last ? last : k];
  for (let n = 0; n < lines; n++) {
    for (let c = 0; c < channels; c++) {
      const start = n * lineStep + c;
      for (let k = 0; k < len; k++) line[k] = data[start + k * step];
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += at(k);
      for (let x = 0; x < len; x++) {
        if (x > 0) acc += at(x + r) - at(x - r - 1);
        const bulk = acc * ww + (at(x - r - 1) + at(x + r + 1)) * fw;
        data[start + x * step] = Math.floor((bulk + 2 ** 23) / 2 ** 24);
      }
    }
  }
}

/** Pillow's ImageFilter.GaussianBlur(sigma) on raw bytes with `channels` per pixel: a new array. */
export function giPlateBlur(src, w, h, channels, sigma) {
  const data = Uint8Array.from(src);
  if (!(sigma > 0)) return data;
  const fr = giPlateBoxRadius(sigma);
  for (let i = 0; i < 3; i++) giPlateBoxPass(data, h, w, w * channels, channels, channels, fr);
  for (let i = 0; i < 3; i++) giPlateBoxPass(data, w, h, channels, w * channels, channels, fr);
  return data;
}

/** Median of one channel (stride 3) over the pixels where `mask` is set (all when null), numpy's rule: the mean of the two middles. */
export function giPlateMedian(rgb, channel, mask = null) {
  const hist = new Float64Array(256);
  let n = 0;
  for (let p = 0, i = channel; i < rgb.length; p++, i += 3) {
    if (mask && !mask[p]) continue;
    hist[rgb[i]]++;
    n++;
  }
  if (!n) return 0;
  const at = (k) => {
    let seen = 0;
    for (let v = 0; v < 256; v++) {
      seen += hist[v];
      if (seen > k) return v;
    }
    return 255;
  };
  return n % 2 ? at((n - 1) / 2) : (at(n / 2 - 1) + at(n / 2)) / 2;
}

/** Share of pixels whose colour distance between state/gain and plate is over `thresh`. */
function giPlateChangedShare(Sb, Pb, gain, thresh) {
  const t2 = thresh * thresh;
  let changed = 0;
  for (let i = 0; i < Sb.length; i += 3) {
    const r = Sb[i] / gain[0] - Pb[i];
    const g = Sb[i + 1] / gain[1] - Pb[i + 1];
    const b = Sb[i + 2] / gain[2] - Pb[i + 2];
    if (r * r + g * g + b * b > t2) changed++;
  }
  return changed / (Sb.length / 3);
}

/** The exposure gain [r, g, b] to divide the blurred state by (step 2). */
export function giPlateGain(Sb, Pb, { calm = GI_RESTORE.calm, thresh = GI_RESTORE.thresh } = {}) {
  const px = Sb.length / 3;
  const ratio = (mask) => [0, 1, 2].map((c) => giPlateMedian(Sb, c, mask) / Math.max(giPlateMedian(Pb, c, mask), 1));
  const cands = [[1, 1, 1], ratio(null)];
  const still = new Uint8Array(px);
  let stillCount = 0;
  const c2 = calm * calm;
  for (let p = 0, i = 0; p < px; p++, i += 3) {
    const r = Sb[i] - Pb[i];
    const g = Sb[i + 1] - Pb[i + 1];
    const b = Sb[i + 2] - Pb[i + 2];
    if (r * r + g * g + b * b < c2) {
      still[p] = 1;
      stillCount++;
    }
  }
  if (stillCount / px > 0.05) cands.push(ratio(still));
  let best = cands[0];
  let bestShare = Infinity;
  for (const g of cands) {
    const safe = g.map((v) => (v > 0 ? v : 1));
    const share = giPlateChangedShare(Sb, Pb, safe, thresh);
    if (share < bestShare) {
      bestShare = share;
      best = safe;
    }
  }
  return best;
}

/** 1 where the colour distance between state/gain and plate is over `thresh`. */
export function giPlateDiff(Sb, Pb, gain, thresh = GI_RESTORE.thresh) {
  const px = Sb.length / 3;
  const out = new Uint8Array(px);
  const t2 = thresh * thresh;
  for (let p = 0, i = 0; p < px; p++, i += 3) {
    const r = Sb[i] / gain[0] - Pb[i];
    const g = Sb[i + 1] / gain[1] - Pb[i + 1];
    const b = Sb[i + 2] / gain[2] - Pb[i + 2];
    if (r * r + g * g + b * b > t2) out[p] = 1;
  }
  return out;
}

/** One pass of a 1-D window of `size` along rows (axis 0) or columns (axis 1): erode (all set, the window inside the frame) or dilate (any set). */
function giPlateWindow(mask, w, h, size, axis, erode) {
  const out = new Uint8Array(mask.length);
  const r = Math.floor(size / 2);
  const len = axis === 0 ? w : h;
  const lines = axis === 0 ? h : w;
  const step = axis === 0 ? 1 : w;
  const sums = new Int32Array(len + 1);
  for (let line = 0; line < lines; line++) {
    const start = axis === 0 ? line * w : line;
    for (let k = 0; k < len; k++) sums[k + 1] = sums[k] + mask[start + k * step];
    for (let k = 0; k < len; k++) {
      const lo = k - r;
      const hi = k - r + size; // exclusive
      if (erode) {
        out[start + k * step] = lo >= 0 && hi <= len && sums[hi] - sums[lo] === size ? 1 : 0;
      } else {
        out[start + k * step] = sums[Math.min(hi, len)] - sums[Math.max(lo, 0)] > 0 ? 1 : 0;
      }
    }
  }
  return out;
}

/** Binary opening with a size x size square (scipy binary_opening: pixels whose window leaves the frame erode away). */
export function giPlateOpen(mask, w, h, size = GI_RESTORE.open) {
  const eroded = giPlateWindow(giPlateWindow(mask, w, h, size, 0, true), w, h, size, 1, true);
  return giPlateWindow(giPlateWindow(eroded, w, h, size, 0, false), w, h, size, 1, false);
}

/** Flood fill (4-connected) from `seeds` over pixels where `inside(p)`; marks `label` into `labels`; returns the region's size. */
function giPlateFlood(labels, w, h, seed, label, inside) {
  const stack = [seed];
  labels[seed] = label;
  let size = 0;
  while (stack.length) {
    const p = stack.pop();
    size++;
    const x = p % w;
    const near = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p >= w ? p - w : -1, p + w < w * h ? p + w : -1];
    for (const q of near) {
      if (q >= 0 && !labels[q] && inside(q)) {
        labels[q] = label;
        stack.push(q);
      }
    }
  }
  return size;
}

/** Keeps only 4-connected regions of at least `minPx` pixels. */
export function giPlateKeepLarge(mask, w, h, minPx) {
  const labels = new Int32Array(mask.length);
  const sizes = [0];
  for (let p = 0; p < mask.length; p++) {
    if (mask[p] && !labels[p]) sizes.push(giPlateFlood(labels, w, h, p, sizes.length, (q) => mask[q] === 1));
  }
  const out = new Uint8Array(mask.length);
  for (let p = 0; p < mask.length; p++) if (labels[p] && sizes[labels[p]] >= minPx) out[p] = 1;
  return out;
}

/** Fills holes: every unset pixel the frame's edge cannot reach (4-connected) through unset pixels. */
export function giPlateFillHoles(mask, w, h) {
  const outside = new Int32Array(mask.length);
  const open = (q) => mask[q] === 0;
  for (let x = 0; x < w; x++) {
    for (const p of [x, (h - 1) * w + x]) if (!mask[p] && !outside[p]) giPlateFlood(outside, w, h, p, 1, open);
  }
  for (let y = 0; y < h; y++) {
    for (const p of [y * w, y * w + w - 1]) if (!mask[p] && !outside[p]) giPlateFlood(outside, w, h, p, 1, open);
  }
  const out = new Uint8Array(mask.length);
  for (let p = 0; p < mask.length; p++) out[p] = mask[p] || !outside[p] ? 1 : 0;
  return out;
}

/** Grows the mask by `r` pixels in city-block distance (scipy binary_dilation with its cross, `r` iterations). */
export function giPlateGrow(mask, w, h, r = GI_RESTORE.grow) {
  const far = w + h + 1;
  const d = new Int32Array(mask.length);
  for (let p = 0; p < mask.length; p++) d[p] = mask[p] ? 0 : far;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (x > 0 && d[p - 1] + 1 < d[p]) d[p] = d[p - 1] + 1;
      if (y > 0 && d[p - w] + 1 < d[p]) d[p] = d[p - w] + 1;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const p = y * w + x;
      if (x < w - 1 && d[p + 1] + 1 < d[p]) d[p] = d[p + 1] + 1;
      if (y < h - 1 && d[p + w] + 1 < d[p]) d[p] = d[p + w] + 1;
    }
  }
  const out = new Uint8Array(mask.length);
  for (let p = 0; p < mask.length; p++) out[p] = d[p] <= r ? 1 : 0;
  return out;
}

/** The changed region (steps 2-3, before feathering): {mask, gain}. All arrays are raw RGB bytes of one size. */
export function giPlateMask(Sb, Pb, w, h, opts = GI_RESTORE) {
  const o = { ...GI_RESTORE, ...opts };
  const gain = giPlateGain(Sb, Pb, o);
  let m = giPlateOpen(giPlateDiff(Sb, Pb, gain, o.thresh), w, h, o.open);
  m = giPlateKeepLarge(m, w, h, o.min_area * w * h);
  m = giPlateFillHoles(m, w, h);
  m = giPlateGrow(m, w, h, o.grow);
  return { mask: m, gain };
}

/** state x alpha + plate x (1 - alpha), rounded; alpha is gray bytes (0-255). */
export function giPlateBlend(S, P, alpha) {
  const out = new Uint8Array(S.length);
  for (let p = 0, i = 0; p < alpha.length; p++, i += 3) {
    const a = alpha[p] / 255;
    for (let c = 0; c < 3; c++) out[i + c] = Math.min(255, Math.max(0, Math.round(S[i + c] * a + P[i + c] * (1 - a))));
  }
  return out;
}

async function giPlateSize(ctx, file) {
  if (Number.isInteger(file.width) && Number.isInteger(file.height) && file.width > 0 && file.height > 0) return { w: file.width, h: file.height };
  const info = await ctx.tools.probe(file.path);
  if (!(info.width > 0 && info.height > 0)) throw ctx.error('tool_failed', `no size for ${String(file.path).split('/').at(-1)}`);
  return { w: info.width, h: info.height };
}

/** Decodes a picture to raw RGB bytes. */
async function giPlateRgb(ctx, path, out) {
  await kitFfmpeg(ctx, ['-i', path, '-frames:v', '1', '-vf', 'format=rgb24', '-f', 'rawvideo', '-pix_fmt', 'rgb24', out]);
  return new Uint8Array(await readFile(out));
}

/** A plate's raw and blurred pixels, read once per shot: {w, h, P, Pb}. */
export async function giPlatePixels(ctx, plate, tag) {
  const dir = ctx.tmpDir || ctx.workDir;
  const { w, h } = await giPlateSize(ctx, plate);
  const P = await giPlateRgb(ctx, plate.path, join(dir, `${tag}-plate.rgb`));
  if (P.length !== w * h * 3) throw ctx.error('tool_failed', `the plate decoded to ${P.length} bytes, not ${w}x${h} RGB`);
  return { w, h, P, Pb: giPlateBlur(P, w, h, 3, GI_RESTORE.blur) };
}

/**
 * Puts the plate's own pixels back in `state` (a FileRef) and writes the result
 * as ctx.workDir/`name`. `plate` is giPlatePixels' result. Returns
 * {file, kept, same} (kept = share of the frame taken from the edit, same =
 * share now identical to the plate), or null when the state's size is not the
 * plate's (it is then left as drawn).
 */
export async function giPlateRestore(ctx, plate, state, name) {
  const dir = ctx.tmpDir || ctx.workDir;
  const { w, h } = await giPlateSize(ctx, state);
  if (w !== plate.w || h !== plate.h) return null;
  const base = name.replace(/\.png$/, '');
  const S = await giPlateRgb(ctx, state.path, join(dir, `${base}.rgb`));
  if (S.length !== w * h * 3) throw ctx.error('tool_failed', `${name} decoded to ${S.length} bytes, not ${w}x${h} RGB`);
  const { mask } = giPlateMask(giPlateBlur(S, w, h, 3, GI_RESTORE.blur), plate.Pb, w, h);
  const gray = new Uint8Array(mask.length);
  let kept = 0;
  for (let p = 0; p < mask.length; p++) {
    gray[p] = mask[p] ? 255 : 0;
    kept += mask[p];
  }
  const alpha = giPlateBlur(gray, w, h, 1, GI_RESTORE.feather);
  const out = giPlateBlend(S, plate.P, alpha);
  let same = 0;
  for (let i = 0; i < out.length; i += 3) {
    if (out[i] === plate.P[i] && out[i + 1] === plate.P[i + 1] && out[i + 2] === plate.P[i + 2]) same++;
  }
  const outRaw = join(dir, `${base}-out.rgb`);
  await writeFile(outRaw, out);
  await kitFfmpeg(ctx, ['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-video_size', `${w}x${h}`, '-i', outRaw, '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, name)]);
  return { file: await ctx.file(name, 'image'), kept: kept / mask.length, same: same / mask.length };
}

// ---- relight (a port of the stop-motion recipe's relight.py) ----
//
// The closing shot of a stop-motion film is the first place again, at night.
// A generated night plate never lines up with the day one, so it is used only
// for its light: the night picture divided by the day plate, both blurred very
// wide (sigma 90, so no detail crosses over), split into a brightness and a
// colour tint that cannot run away. Every day frame is multiplied by that
// field, so the geometry cannot drift and the product is the same pixels. It
// dims and tints; it cannot add a lamp that casts new shadows.
//
// The arithmetic follows numpy's float32 in relight.py step by step (each
// operation rounded to float32, the channel mean as numpy sums three values,
// round half to even), so the result matches the script byte for byte.

export const GI_RELIGHT = { blur: 90, min: 0.05, max: 2.0, tint_min: 0.8, tint_max: 1.3 };

/** numpy's rint: round half to even. */
export function giRint(v) {
  const r = Math.round(v);
  return r - v === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

/**
 * The light field (relight.py's F) from the blurred light picture `Lb` and the
 * blurred day plate `Db` (raw RGB bytes of one size): a Float32Array with one
 * factor per byte.
 */
export function giRelightField(Lb, Db, opts = GI_RELIGHT) {
  const o = { ...GI_RELIGHT, ...opts };
  const f = Math.fround;
  const lo = f(o.min);
  const hi = f(o.max);
  const tlo = f(o.tint_min);
  const thi = f(o.tint_max);
  const eps = f(1e-3);
  const F = new Float32Array(Lb.length);
  for (let i = 0; i < Lb.length; i += 3) {
    const r = f(Lb[i] / Math.max(Db[i], 1));
    const g = f(Lb[i + 1] / Math.max(Db[i + 1], 1));
    const b = f(Lb[i + 2] / Math.max(Db[i + 2], 1));
    const mean = f(f(f(r + g) + b) / 3);
    const bright = Math.min(Math.max(mean, lo), hi);
    const den = Math.max(mean, eps);
    F[i] = f(bright * Math.min(Math.max(f(r / den), tlo), thi));
    F[i + 1] = f(bright * Math.min(Math.max(f(g / den), tlo), thi));
    F[i + 2] = f(bright * Math.min(Math.max(f(b / den), tlo), thi));
  }
  return F;
}

/** A day frame (raw RGB bytes) times the field, rounded half to even and clipped: new bytes. */
export function giRelightApply(S, F) {
  const out = new Uint8Array(S.length);
  for (let i = 0; i < S.length; i++) {
    const v = giRint(Math.fround(S[i] * F[i]));
    out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return out;
}

/** Mean of raw bytes (relight.py's "mean brightness" of the RGB result). */
function giRelightMean(bytes) {
  let sum = 0;
  for (let i = 0; i < bytes.length; i++) sum += bytes[i];
  return bytes.length ? sum / bytes.length : 0;
}

/**
 * The light field for a relit shot: `light` (the generated light picture) and
 * `day` (the source shot's plate) are FileRefs, decoded at `w`x`h` (scaled when
 * a picture is another size) and blurred. Returns a Float32Array.
 */
export async function giRelightFieldFor(ctx, { light, day, w, h, tag, blur = GI_RELIGHT.blur }) {
  const dir = ctx.tmpDir || ctx.workDir;
  const decode = async (file, name) => {
    const size = await giPlateSize(ctx, file);
    const scale = size.w === w && size.h === h ? [] : [`scale=${w}:${h}:flags=bicubic`];
    const out = join(dir, `${tag}-${name}-${w}x${h}.rgb`);
    await kitFfmpeg(ctx, ['-i', file.path, '-frames:v', '1', '-vf', [...scale, 'format=rgb24'].join(','), '-f', 'rawvideo', '-pix_fmt', 'rgb24', out]);
    const px = new Uint8Array(await readFile(out));
    if (px.length !== w * h * 3) throw ctx.error('tool_failed', `the ${name} picture decoded to ${px.length} bytes, not ${w}x${h} RGB`);
    return giPlateBlur(px, w, h, 3, blur);
  };
  return giRelightField(await decode(light, 'light'), await decode(day, 'day'));
}

/**
 * One day frame (`frame`, a FileRef) re-lit by `fieldFor(w, h)` and written as
 * ctx.workDir/`name`. Returns {file, mean, day_mean}.
 */
export async function giRelightFrame(ctx, frame, fieldFor, name) {
  const dir = ctx.tmpDir || ctx.workDir;
  const { w, h } = await giPlateSize(ctx, frame);
  const base = name.replace(/\.png$/, '');
  const S = await giPlateRgb(ctx, frame.path, join(dir, `${base}-day.rgb`));
  if (S.length !== w * h * 3) throw ctx.error('tool_failed', `${name} decoded to ${S.length} bytes, not ${w}x${h} RGB`);
  const out = giRelightApply(S, await fieldFor(w, h));
  const outRaw = join(dir, `${base}-out.rgb`);
  await writeFile(outRaw, out);
  await kitFfmpeg(ctx, ['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-video_size', `${w}x${h}`, '-i', outRaw, '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, name)]);
  return { file: await ctx.file(name, 'image'), mean: giRelightMean(out), day_mean: giRelightMean(S) };
}
