// Pixel and sample measures on the finished cut for the check layer: the
// brand logo found on the end card by grayscale normalised correlation over a
// size search (review-finished-ad's logo check), picture motion (the
// logo-equation-card b-roll gate), and the sound rising where a message
// appears. ffmpeg decodes to raw files in tmpDir; the maths is plain JS.
// Every top-level name starts with `kit`.
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
 * How well the brand's logo file is found in the frames at `times`: the best
 * |NCC| over a size search (15 % to 60 % of the frame width). A logo with
 * transparency is matched by its shape (alpha), so a white mark on a dark card
 * counts; an opaque logo by its whole image. `box` is where the best match
 * sits, in the video's pixels.
 */
export async function kitLogoScore(ctx, video, logo, times, frameW, frameH) {
  const lw = 160;
  const rgba = await kitRaw(ctx, ['-i', logo.path, '-frames:v', '1', '-vf', `scale=${lw}:-2:flags=area,format=rgba`, '-pix_fmt', 'rgba'], 'logo.raw');
  const lh = Math.floor(rgba.length / 4 / lw);
  if (lh < 2) return { score: 0, mode: 'image', box: null };
  let transparent = 0;
  const gray = new Float64Array(lw * lh);
  const alpha = new Float64Array(lw * lh);
  for (let i = 0; i < lw * lh; i++) {
    const [r, g, b, a] = [rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], rgba[i * 4 + 3]];
    alpha[i] = a;
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    if (a < 250) transparent++;
  }
  const mode = transparent > lw * lh * 0.05 ? 'mark' : 'image';
  const tplSrc = mode === 'mark' ? alpha : gray;
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
