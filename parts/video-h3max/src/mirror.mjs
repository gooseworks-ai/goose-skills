// Is the product in a take mirrored? H3 front-camera takes come back mirrored left to right about one time
// in three, even when the prompt says "never mirrored" (2026-10-15, Brightland: 3 of 8 takes), so the label
// reads backwards. This compares the product photo with frames of the take as they are and flipped, and says
// which way the label reads. Pure functions on grey pixel arrays; the part extracts the pixels with ffmpeg.
//
// Method (a small SIFT without scale detection): Harris corners on a few pyramid levels of each image, an
// upright 4x4x8 gradient histogram around each, Lowe's ratio test, then a RANSAC similarity fit so a match must
// sit in one consistent place on the label. Upright descriptors are deliberate: mirrored lettering is what must
// not match, and a held product is near upright in most frames. Plain multi-scale correlation could not tell
// the two apart on the same clips (scripts/mirror_check.py in goose-studio is the Python reference).

const MIR_PATCH = 16; // descriptor patch side, in pixels of its pyramid level
const MIR_CELLS = 4;
const MIR_BINS = 8;
const MIR_DESC = MIR_CELLS * MIR_CELLS * MIR_BINS;
const MIR_RATIO = 0.8;
const MIR_RANSAC_ITERS = 600;
const MIR_RANSAC_PX = 6;

/** A grey image: { w, h, px: Float32Array } with px in 0..255. */
export function mirGrey(w, h, bytes) {
  const px = new Float32Array(w * h);
  for (let i = 0; i < px.length; i++) px[i] = bytes[i];
  return { w, h, px };
}

export function mirFlip(img) {
  const { w, h, px } = img;
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = px[y * w + (w - 1 - x)];
  return { w, h, px: out };
}

/** Area-average downscale by a factor (0 < f <= 1). */
export function mirScale(img, f) {
  const w = Math.max(8, Math.round(img.w * f));
  const h = Math.max(8, Math.round(img.h * f));
  const px = new Float32Array(w * h);
  const sx = img.w / w;
  const sy = img.h / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * sy);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      let s = 0;
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) s += img.px[yy * img.w + xx];
      px[y * w + x] = s / ((y1 - y0) * (x1 - x0));
    }
  }
  return { w, h, px };
}

function mirBlur(img) {
  // 1-2-1 separable blur, enough to steady the gradients of compressed video.
  const { w, h, px } = img;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const l = px[y * w + Math.max(0, x - 1)];
      const r = px[y * w + Math.min(w - 1, x + 1)];
      tmp[y * w + x] = (l + 2 * px[y * w + x] + r) / 4;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const u = tmp[Math.max(0, y - 1) * w + x];
      const d = tmp[Math.min(h - 1, y + 1) * w + x];
      out[y * w + x] = (u + 2 * tmp[y * w + x] + d) / 4;
    }
  return { w, h, px: out };
}

function mirGradients(img) {
  const { w, h, px } = img;
  const gx = new Float32Array(w * h);
  const gy = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      gx[i] = (px[i + 1] - px[i - 1]) / 2;
      gy[i] = (px[i + w] - px[i - w]) / 2;
    }
  return { gx, gy };
}

/** Harris corners, 5x5 non-maximum suppression, the strongest `max`, away from the border by the patch. */
function mirCorners(w, h, gx, gy, max) {
  const r = new Float32Array(w * h);
  const m = MIR_PATCH / 2 + 1;
  for (let y = m; y < h - m; y++)
    for (let x = m; x < w - m; x++) {
      let a = 0;
      let b = 0;
      let c = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const i = (y + dy) * w + x + dx;
          a += gx[i] * gx[i];
          b += gy[i] * gy[i];
          c += gx[i] * gy[i];
        }
      r[y * w + x] = a * b - c * c - 0.04 * (a + b) * (a + b);
    }
  const pts = [];
  for (let y = m; y < h - m; y++)
    for (let x = m; x < w - m; x++) {
      const v = r[y * w + x];
      if (v <= 1e3) continue;
      let peak = true;
      for (let dy = -2; dy <= 2 && peak; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          if ((dx || dy) && r[(y + dy) * w + x + dx] > v) {
            peak = false;
            break;
          }
        }
      if (peak) pts.push([x, y, v]);
    }
  pts.sort((p, q) => q[2] - p[2]);
  return pts.slice(0, max);
}

/** Upright 4x4 cells x 8 orientation bins around a point, normalised, clipped at 0.2, renormalised. */
function mirDescribe(w, gx, gy, x, y, out, at) {
  const half = MIR_PATCH / 2;
  const cell = MIR_PATCH / MIR_CELLS;
  for (let k = 0; k < MIR_DESC; k++) out[at + k] = 0;
  for (let dy = -half; dy < half; dy++)
    for (let dx = -half; dx < half; dx++) {
      const i = (y + dy) * w + x + dx;
      const mag = Math.hypot(gx[i], gy[i]);
      if (!mag) continue;
      const ang = (Math.atan2(gy[i], gx[i]) + Math.PI) / (2 * Math.PI); // 0..1
      const fb = ang * MIR_BINS;
      const b0 = Math.floor(fb) % MIR_BINS;
      const b1 = (b0 + 1) % MIR_BINS;
      const t = fb - Math.floor(fb);
      const cx = Math.floor((dx + half) / cell);
      const cy = Math.floor((dy + half) / cell);
      const base = at + (cy * MIR_CELLS + cx) * MIR_BINS;
      out[base + b0] += mag * (1 - t);
      out[base + b1] += mag * t;
    }
  let n = 0;
  for (let k = 0; k < MIR_DESC; k++) n += out[at + k] * out[at + k];
  n = Math.sqrt(n) || 1;
  let n2 = 0;
  for (let k = 0; k < MIR_DESC; k++) {
    const v = Math.min(0.2, out[at + k] / n);
    out[at + k] = v;
    n2 += v * v;
  }
  n2 = Math.sqrt(n2) || 1;
  for (let k = 0; k < MIR_DESC; k++) out[at + k] /= n2;
}

/**
 * Feature points of an image over pyramid `scales` (each a factor of the given image). Points are in the
 * given image's pixels. Returns { n, xy: Float32Array(2n), desc: Float32Array(n*128) }.
 */
export function mirFeatures(img, scales, perLevel) {
  const xy = [];
  const descs = [];
  for (const s of scales) {
    const lvl = mirBlur(s === 1 ? img : mirScale(img, s));
    const { gx, gy } = mirGradients(lvl);
    const pts = mirCorners(lvl.w, lvl.h, gx, gy, perLevel);
    const d = new Float32Array(pts.length * MIR_DESC);
    pts.forEach(([x, y], k) => mirDescribe(lvl.w, gx, gy, x, y, d, k * MIR_DESC));
    for (const [x, y] of pts) xy.push(x / s, y / s);
    descs.push(d);
  }
  const n = xy.length / 2;
  const desc = new Float32Array(n * MIR_DESC);
  let at = 0;
  for (const d of descs) {
    desc.set(d, at);
    at += d.length;
  }
  return { n, xy: Float32Array.from(xy), desc };
}

/** Ratio-test matches from a (the product) to b (a frame): [[ia, ib], ...]. */
export function mirMatch(a, b) {
  const out = [];
  for (let i = 0; i < a.n; i++) {
    let best = Infinity;
    let second = Infinity;
    let bj = -1;
    const ai = i * MIR_DESC;
    for (let j = 0; j < b.n; j++) {
      const bjAt = j * MIR_DESC;
      let dot = 0;
      for (let k = 0; k < MIR_DESC; k++) dot += a.desc[ai + k] * b.desc[bjAt + k];
      const d = 2 - 2 * dot; // squared distance of unit vectors
      if (d < best) {
        second = best;
        best = d;
        bj = j;
      } else if (d < second) second = d;
    }
    if (bj >= 0 && Math.sqrt(best) < MIR_RATIO * Math.sqrt(second)) out.push([i, bj]);
  }
  return out;
}

/** A seeded generator, so the same take always gets the same verdict. */
function mirRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/**
 * The most matches one similarity transform (scale, rotation, shift) explains, within MIR_RANSAC_PX in
 * the frame. Transforms that shrink or grow the product past [0.05, 8] or turn it past 60 degrees are ignored.
 */
export function mirInliers(a, b, matches, seed = 7) {
  if (matches.length < 4) return 0;
  const rnd = mirRandom(seed);
  const P = matches.map(([i, j]) => [a.xy[2 * i], a.xy[2 * i + 1], b.xy[2 * j], b.xy[2 * j + 1]]);
  let best = 0;
  for (let it = 0; it < MIR_RANSAC_ITERS; it++) {
    const p = P[Math.floor(rnd() * P.length)];
    const q = P[Math.floor(rnd() * P.length)];
    const ux = q[0] - p[0];
    const uy = q[1] - p[1];
    const vx = q[2] - p[2];
    const vy = q[3] - p[3];
    const uu = ux * ux + uy * uy;
    if (uu < 25) continue;
    // [c -s; s c] * u = v
    const c = (ux * vx + uy * vy) / uu;
    const s = (ux * vy - uy * vx) / uu;
    const scale = Math.hypot(c, s);
    if (scale < 0.05 || scale > 8 || Math.abs(Math.atan2(s, c)) > Math.PI / 3) continue;
    const tx = p[2] - (c * p[0] - s * p[1]);
    const ty = p[3] - (s * p[0] + c * p[1]);
    let n = 0;
    for (const m of P) {
      const ex = c * m[0] - s * m[1] + tx - m[2];
      const ey = s * m[0] + c * m[1] + ty - m[3];
      if (ex * ex + ey * ey <= MIR_RANSAC_PX * MIR_RANSAC_PX) n++;
    }
    if (n > best) best = n;
  }
  // Two points always fit; count only what agrees beyond the pair.
  return best >= 4 ? best : 0;
}

export const MIR_PRODUCT_SCALES = [1, 0.75, 0.56, 0.42, 0.32];
export const MIR_FRAME_SCALES = [1, 0.7];

/**
 * Verdict over frames: 'mirrored' when the flipped frames match at least twice as well (and at least 8),
 * 'ok' when the frames as they are do, else 'unsure'. `product` and each frame are mirGrey images.
 */
export function mirVerdict(product, frames, { productPoints = 300, framePoints = 700 } = {}) {
  const pf = mirFeatures(product, MIR_PRODUCT_SCALES, productPoints);
  let normal = 0;
  let flipped = 0;
  for (const [k, f] of frames.entries()) {
    const nf = mirFeatures(f, MIR_FRAME_SCALES, framePoints);
    normal += mirInliers(pf, nf, mirMatch(pf, nf), 11 + k);
    const ff = mirFeatures(mirFlip(f), MIR_FRAME_SCALES, framePoints);
    flipped += mirInliers(pf, ff, mirMatch(pf, ff), 11 + k);
  }
  const verdict = flipped >= 2 * Math.max(normal, 4) ? 'mirrored' : normal >= 2 * Math.max(flipped, 4) ? 'ok' : 'unsure';
  return { verdict, normal, flipped, frames: frames.length };
}
