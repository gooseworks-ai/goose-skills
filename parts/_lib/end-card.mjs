// The brand end card, drawn in the kit's Chromium: the logo, the brand's
// colours and fonts, an optional proof row (stars only with approved proof
// text), up to three benefits, the call to action and the URL. Today's
// render-imessage-chat end card, made data-only. Shared by the end-card part
// and the brand layer. Every top-level name starts with `kit`.
//
// The logo (end-card 1.1.1, brand-layer 1.0.2) is never recoloured or redrawn,
// but it is fitted: a flat white, grey or black background the file carries is
// made transparent (only the part touching the edge, never the mark), empty
// margins are trimmed, and the mark is scaled (up as well as down) into a box
// set by its shape: a wide mark (2:1 or wider) is min(640 px, 0.58 W) wide,
// any other min(320 px, 0.17 H) tall, at 1080x1920. When the mark still barely
// contrasts with the card (under 3:1), the whole card changes colour (the
// logo's own background, else the brand colour with the most contrast, else
// near-black or warm white) instead of putting the logo on a plate. The file's
// background left inside the letters is cleared when the card is another colour.
// The logo's box goes on the timeline only when the whole file sits on the card.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitFfmpeg, kitNum } from './part.mjs';

const kitCardIcons = {
  pencil: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
  heart: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  star: '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>',
  check: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
  gift: '<path d="M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-5.5-1.65l-.5.67-.5-.68A3 3 0 0 0 6 4c0 .35.07.69.18 1H4a2 2 0 0 0-2 2v2h20V7a2 2 0 0 0-2-1zM4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4z"/>',
  bolt: '<path d="M7 2v11h3v9l7-12h-4l4-8z"/>',
  shield: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>',
};

export const KIT_CARD_ICON_NAMES = Object.keys(kitCardIcons);

function kitCardEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const kitCardHex = /^#([0-9a-fA-F]{6})$/;

function kitCardLum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Black or white, whichever reads better on `hex`. */
export function kitCardContrastText(hex) {
  return kitCardLum(hex) > 0.4 ? '#111111' : '#ffffff';
}

function kitCardSameColor(a, b, tol = 24) {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  return [16, 8, 0].every((sh) => Math.abs(((x >> sh) & 255) - ((y >> sh) & 255)) <= tol);
}

function kitCardColor(value, fallback) {
  return typeof value === 'string' && kitCardHex.test(value) ? value : fallback;
}

async function kitCardDataUri(file) {
  const bytes = await readFile(file.path);
  return `data:${file.mime || 'application/octet-stream'};base64,${bytes.toString('base64')}`;
}

function kitCardFontFormat(file) {
  const m = /\.(ttf|otf|woff2?)$/i.exec(file.path || '');
  return { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' }[(m ? m[1] : 'ttf').toLowerCase()];
}

/** @font-face rules for the card's two families, from brand fonts or the part's bundled font. */
export async function kitCardFontCss(brand, fallbackFontPath) {
  const fallback = { path: fallbackFontPath, mime: 'font/ttf' };
  const heading = (brand.fonts && brand.fonts.heading) || (brand.fonts && brand.fonts.body) || fallback;
  const body = (brand.fonts && brand.fonts.body) || heading;
  const face = async (family, file) =>
    `@font-face{font-family:'${family}';src:url(${await kitCardDataUri({ ...file, mime: file.mime || 'font/ttf' })}) format('${kitCardFontFormat(file)}');font-display:block;}`;
  return `${await face('KitHeading', heading)}${await face('KitBody', body)}`;
}

/** The card's colours from the brand kit and the step's overrides. */
export function kitCardColors(brand, card = {}) {
  const c = brand.colors || {};
  const bg = kitCardColor(card.background, kitCardColor(c.background, '#ffffff'));
  const fg = kitCardColor(card.foreground, kitCardColor(c.text, kitCardContrastText(bg)));
  const ctaBg = kitCardColor(card.cta_background, kitCardColor(c.primary, fg));
  return { bg, fg, ctaBg, ctaFg: kitCardContrastText(ctaBg), star: kitCardColor(card.star_color, '#ffc83d') };
}

/** WCAG contrast ratio of two #rrggbb colours. */
export function kitCardContrast(a, b) {
  const x = kitCardLum(a);
  const y = kitCardLum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function kitCardInkContrast(ink, hex) {
  const l = kitCardLum(hex);
  return (Math.max(ink, l) + 0.05) / (Math.min(ink, l) + 0.05);
}

/** Under this contrast the logo does not read on the card, and the card changes colour. */
export const KIT_CARD_LOGO_MIN_CONTRAST = 3;

/**
 * The logo box per card, at 1080x1920: a wide mark (aspect 2 or more) is `wide` px and at most `wide_share`
 * of the width wide; any other mark is `tall` px and at most `tall_share` of the height tall. Scaled with
 * the card (min(W/1080, H/1920)).
 */
export const KIT_CARD_LOGO_BOXES = {
  classic: { wide: 640, wide_share: 0.58, tall: 320, tall_share: 0.17 },
  brandkit: { wide: 520, wide_share: 0.5, tall: 300, tall_share: 0.16 },
  stack: { wide: 720, wide_share: 0.66, tall: 420, tall_share: 0.22 },
  statement: { wide: 720, wide_share: 0.66, tall: 300, tall_share: 0.16 },
};

/** The drawn size of a logo whose visible mark is `w` x `h`, on a `width` x `height` card. Scales up as well as down. */
export function kitCardLogoSize(w, h, width, height, box = KIT_CARD_LOGO_BOXES.classic) {
  const s = Math.min(width / 1080, height / 1920);
  const aspect = w / h;
  let dw;
  let dh;
  if (aspect >= 2) {
    dw = Math.min(box.wide * s, box.wide_share * width);
    dh = dw / aspect;
  } else {
    dh = Math.min(box.tall * s, box.tall_share * height);
    dw = dh * aspect;
  }
  // A mark just under 2:1 is never wider than a wide one.
  const maxW = Math.min(box.wide * s, box.wide_share * width);
  if (dw > maxW) {
    dw = maxW;
    dh = dw / aspect;
  }
  return { w: Math.max(1, Math.round(dw)), h: Math.max(1, Math.round(dh)) };
}

/**
 * The card colour to switch to when the logo's ink (its mean relative luminance) barely contrasts with the
 * card: the background the logo file carried (its counters then match the card), else the brand colour with
 * the most contrast, else #111111 or #F5F3EE, whichever reads better. Null when the logo already reads.
 */
export function kitCardLogoBackground(ink, bg, colors = {}, logoBg = null) {
  if (!Number.isFinite(ink) || kitCardInkContrast(ink, bg) >= KIT_CARD_LOGO_MIN_CONTRAST) return null;
  const min = KIT_CARD_LOGO_MIN_CONTRAST;
  if (logoBg && kitCardHex.test(logoBg) && kitCardInkContrast(ink, logoBg) >= min) return logoBg.toLowerCase();
  const palette = [colors.background, colors.primary, colors.secondary, colors.text, ...(Array.isArray(colors.palette) ? colors.palette : [])].filter(
    (c) => typeof c === 'string' && kitCardHex.test(c),
  );
  let best = null;
  for (const c of palette) if (!best || kitCardInkContrast(ink, c) > kitCardInkContrast(ink, best)) best = c;
  if (best && kitCardInkContrast(ink, best) >= min) return best.toLowerCase();
  return kitCardInkContrast(ink, '#111111') >= kitCardInkContrast(ink, '#f5f3ee') ? '#111111' : '#f5f3ee';
}

/**
 * The classic card's colours on a background the logo forced: a step or brand colour is kept only when it
 * reads on it (text 4.5:1, the CTA pill 1.5:1 against the card), else black or white.
 */
export function kitCardColorsOn(brand, card, bg) {
  const c = brand.colors || {};
  const reads = (hex, min) => (typeof hex === 'string' && kitCardHex.test(hex) && kitCardContrast(hex, bg) >= min ? hex : null);
  const fg = reads(card.foreground, 4.5) || reads(c.text, 4.5) || kitCardContrastText(bg);
  const ctaBg = reads(card.cta_background, 1.5) || reads(c.primary, 1.5) || fg;
  return { bg, fg, ctaBg, ctaFg: kitCardContrastText(ctaBg), star: kitCardColor(card.star_color, '#ffc83d') };
}

/**
 * In the page: makes the logo (img#logo) ready to size. A file whose whole edge is one opaque flat neutral
 * colour (white, grey or black) has that edge-connected background made transparent, the mark's own pixels
 * untouched and its anti-aliased rim feathered; empty margins are trimmed. The result replaces the image.
 * Returns the mark's size, its mean ink luminance and where the trimmed mark sat in the file (shares), or null.
 */
export async function kitCardPrepareLogo() {
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => i.decode()));
  const img = document.getElementById('logo');
  if (!img || !img.naturalWidth || !img.naturalHeight) return null;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  // A vector logo is drawn at full size here, so it stays sharp when the card enlarges it.
  const vector = /^data:image\/svg\+xml/.test(img.currentSrc || img.src);
  const k = vector ? 2048 / Math.max(nw, nh) : Math.min(1, 2048 / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * k));
  const h = Math.max(1, Math.round(nh * k));
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0, w, h);
  const im = cx.getImageData(0, 0, w, h);
  const d = im.data;
  const lum = (r, g, b) =>
    [r, g, b]
      .map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      })
      .reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0);
  const TOL = 24;
  const edge = [];
  for (let x = 0; x < w; x++) edge.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) edge.push(y * w, y * w + w - 1);
  let opaque = 0;
  const rs = [];
  const gs = [];
  const bs = [];
  for (const p of edge) {
    if (d[p * 4 + 3] >= 250) opaque++;
    rs.push(d[p * 4]);
    gs.push(d[p * 4 + 1]);
    bs.push(d[p * 4 + 2]);
  }
  const median = (a) => a.sort((x, y) => x - y)[a.length >> 1];
  const bg = [median(rs), median(gs), median(bs)];
  const dist = (p) => Math.max(Math.abs(d[p * 4] - bg[0]), Math.abs(d[p * 4 + 1] - bg[1]), Math.abs(d[p * 4 + 2] - bg[2]));
  const flat = edge.filter((p) => dist(p) <= TOL).length;
  const neutral = Math.max(...bg) - Math.min(...bg) <= 20;
  let hadBackground = false;
  let logoBg = null;
  if (opaque >= edge.length * 0.98 && flat >= edge.length * 0.9 && neutral) {
    const gone = new Uint8Array(w * h);
    const queue = [];
    for (const p of edge) {
      if (!gone[p] && dist(p) <= TOL) {
        gone[p] = 1;
        queue.push(p);
      }
    }
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i];
      const x = p % w;
      const y = (p - x) / w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && !gone[q] && dist(q) <= TOL) {
          gone[q] = 1;
          queue.push(q);
        }
      }
    }
    // Only a background, never the mark: something has to be left (a thin wordmark in a big og image is little).
    if (w * h - queue.length >= Math.max(64, w * h * 0.001)) {
      hadBackground = true;
      logoBg = `#${bg.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      for (let p = 0; p < w * h; p++) {
        if (gone[p]) {
          d[p * 4 + 3] = 0;
          continue;
        }
        const x = p % w;
        const y = (p - x) / w;
        const rim = (x > 0 && gone[p - 1]) || (x < w - 1 && gone[p + 1]) || (y > 0 && gone[p - w]) || (y < h - 1 && gone[p + w]);
        const dp = dist(p);
        if (!rim || dp >= 128) continue;
        // An anti-aliased rim pixel is part background: unmix it and keep only the mark's share.
        const a = Math.max(0.05, (dp - TOL) / (128 - TOL));
        for (let c = 0; c < 3; c++) d[p * 4 + c] = Math.max(0, Math.min(255, Math.round(bg[c] + (d[p * 4 + c] - bg[c]) / a)));
        d[p * 4 + 3] = Math.round(d[p * 4 + 3] * a);
      }
    }
  }
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  let sum = 0;
  let weight = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] <= 8) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (d[i + 3] > 128) {
        sum += lum(d[i], d[i + 1], d[i + 2]);
        weight++;
      }
    }
  }
  if (x1 < 0 || !weight) return null;
  const tw = x1 - x0 + 1;
  const th = y1 - y0 + 1;
  // Background enclosed by the mark (the counters of o, e, a): small patches of the removed colour that the
  // edge fill cannot reach. They are cleared only when the card ends up another colour (kitCardPlaceLogo
  // holeless). A large patch, or any patch in a solid mark (a badge or a tile whose outline fills 70 % of its
  // box, like white letters on a red box), is the mark's own artwork and kept.
  const holes = [];
  let solid = 0;
  if (hadBackground) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (d[(y * w + x) * 4 + 3] !== 0) solid++;
  if (hadBackground && solid < tw * th * 0.7) {
    const seen = new Uint8Array(w * h);
    const maxHole = tw * th * 0.04;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const s = y * w + x;
        if (seen[s] || d[s * 4 + 3] === 0 || dist(s) > TOL) continue;
        seen[s] = 1;
        const part = [s];
        for (let i = 0; i < part.length; i++) {
          const p = part[i];
          const px = p % w;
          const py = (p - px) / w;
          for (const q of [px > 0 ? p - 1 : -1, px < w - 1 ? p + 1 : -1, py > 0 ? p - w : -1, py < h - 1 ? p + w : -1]) {
            if (q >= 0 && !seen[q] && d[q * 4 + 3] !== 0 && dist(q) <= TOL) {
              seen[q] = 1;
              part.push(q);
            }
          }
        }
        if (part.length <= maxHole) holes.push(...part);
      }
    }
    // The ink is the mark's, not its counters'.
    for (const p of holes) {
      if (d[p * 4 + 3] <= 128) continue;
      sum -= lum(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]);
      weight--;
    }
  }
  const crop = (data) => {
    cx.putImageData(new ImageData(data, w, h), 0, 0);
    const out = document.createElement('canvas');
    out.width = tw;
    out.height = th;
    out.getContext('2d').drawImage(cv, x0, y0, tw, th, 0, 0, tw, th);
    return out.toDataURL('image/png');
  };
  window.kitCardHoleless = null;
  if (holes.length) {
    const d2 = new Uint8ClampedArray(d);
    const hole = new Uint8Array(w * h);
    for (const p of holes) {
      hole[p] = 1;
      d2[p * 4 + 3] = 0;
    }
    for (let y = Math.max(0, y0 - 1); y <= Math.min(h - 1, y1 + 1); y++) {
      for (let x = Math.max(0, x0 - 1); x <= Math.min(w - 1, x1 + 1); x++) {
        const p = y * w + x;
        if (hole[p] || d[p * 4 + 3] === 0) continue;
        const rim = (x > 0 && hole[p - 1]) || (x < w - 1 && hole[p + 1]) || (y > 0 && hole[p - w]) || (y < h - 1 && hole[p + w]);
        const dp = dist(p);
        if (!rim || dp >= 128) continue;
        const a = Math.max(0.05, (dp - TOL) / (128 - TOL));
        for (let c = 0; c < 3; c++) d2[p * 4 + c] = Math.max(0, Math.min(255, Math.round(bg[c] + (d[p * 4 + c] - bg[c]) / a)));
        d2[p * 4 + 3] = Math.round(d[p * 4 + 3] * a);
      }
    }
    window.kitCardHoleless = crop(d2);
  }
  if (hadBackground || tw < w || th < h || vector) {
    img.src = crop(d);
    await img.decode();
  }
  return {
    w: tw,
    h: th,
    natural_w: Math.round(tw / k),
    natural_h: Math.round(th / k),
    vector,
    ink: sum / Math.max(1, weight),
    had_background: hadBackground,
    logo_bg: logoBg,
    holes: holes.length,
    trim: { left: x0 / w, top: y0 / h, right: (w - 1 - x1) / w, bottom: (h - 1 - y1) / h },
  };
}

/**
 * In the page: draws the prepared logo at `w` x `h` (with its counters cleared when `holeless`) and sets the
 * card's colour variables; returns the logo's box.
 */
export async function kitCardPlaceLogo({ w, h, vars, holeless }) {
  for (const [name, value] of Object.entries(vars || {})) document.documentElement.style.setProperty(name, value);
  const img = document.getElementById('logo');
  if (holeless && window.kitCardHoleless) img.src = window.kitCardHoleless;
  img.style.width = `${w}px`;
  img.style.height = `${h}px`;
  img.style.maxWidth = 'none';
  img.style.maxHeight = 'none';
  await img.decode();
  const r = img.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
}

/**
 * In the page: the share of `box` that the card's other drawing (text, a filled box, a picture) covers. A few
 * rows of text grazing a logo file's empty margin are fine; a call to action inside it is not.
 */
export function kitCardCrowds(box) {
  const logo = document.getElementById('logo');
  let covered = 0;
  const meets = (r) => {
    const w = Math.min(r.x + r.width, box.x + box.w) - Math.max(r.x, box.x);
    const h = Math.min(r.y + r.height, box.y + box.h) - Math.max(r.y, box.y);
    if (w > 0 && h > 0) covered += w * h;
  };
  for (const el of document.body.querySelectorAll('*')) {
    if (el === logo || el.contains(logo)) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const filled = /^(img|svg|canvas|video)$/i.test(el.tagName) || (cs.backgroundColor && !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor)) || cs.backgroundImage !== 'none';
    if (filled) meets(el.getBoundingClientRect());
    for (const node of el.childNodes) {
      if (node.nodeType !== 3 || !node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) meets(r);
    }
  }
  return covered / Math.max(1, box.w * box.h);
}

/**
 * Fits the page's logo (kitCardPrepareLogo, kitCardLogoSize, kitCardLogoBackground) and returns
 * {logo, background}: `logo` is the box the logo file covers on the card, in its pixels (the trimmed margins
 * added back, so the final check matches the file there), `background` the colour the card changed to, or
 * null. `recolor(bg)` gives the CSS variables for a card on `bg`. Logs what it changed.
 */
export async function kitCardFitLogo(ctx, page, { width, height, box, bg, colors, recolor }) {
  const mark = await page.evaluate(kitCardPrepareLogo);
  if (!mark) return { logo: null, background: null };
  const size = kitCardLogoSize(mark.w, mark.h, width, height, box);
  const background = kitCardLogoBackground(mark.ink, bg, colors, mark.logo_bg);
  const card = background || bg;
  // On a card of another colour the file's background left inside the letters would show as holes.
  const holeless = mark.holes > 0 && !!mark.logo_bg && kitCardHex.test(card) && !kitCardSameColor(card, mark.logo_bg);
  const drawn = await page.evaluate(kitCardPlaceLogo, { w: size.w, h: size.h, vars: background ? recolor(background) : {}, holeless });
  if (mark.had_background) ctx.log.info('end card logo background made transparent', { background: mark.logo_bg, inside_letters: holeless ? 'cleared' : 'kept' });
  if (background) ctx.log.info('end card colour changed so the logo reads', { from: bg, to: background });
  if (!mark.vector && size.w > mark.natural_w * 1.5) ctx.log.warn('the logo file is small, so the end card shows it enlarged and it may look soft', { natural: `${mark.natural_w}x${mark.natural_h}`, drawn: `${size.w}x${size.h}` });
  // The declared box is the whole file's footprint: the final check matches the whole file there, margins
  // included. When wide margins put that footprint past the card's edge or over the card's other text, no box
  // is declared (the check then searches the whole frame): a cut or crowded box would fail a logo that is
  // plainly there.
  const t = mark.trim;
  const fw = drawn.w / Math.max(1e-6, 1 - t.left - t.right);
  const fh = drawn.h / Math.max(1e-6, 1 - t.top - t.bottom);
  // A pixel or two over the edge is rounding, not a cut.
  const fx = drawn.x - t.left * fw;
  const fy = drawn.y - t.top * fh;
  const footprint = { x: Math.round(fx), y: Math.round(fy), w: Math.round(fw), h: Math.round(fh) };
  if (fx < -2 || fy < -2 || fx + fw > width + 2 || fy + fh > height + 2 || (await page.evaluate(kitCardCrowds, footprint)) > 0.04) {
    ctx.log.warn('the logo file has wide empty margins, so its box is not declared for the final check', { mark: `${size.w}x${size.h}`, footprint: `${footprint.w}x${footprint.h}@${footprint.x},${footprint.y}` });
    return { logo: null, background };
  }
  const x0 = Math.max(0, Math.floor(fx));
  const y0 = Math.max(0, Math.floor(fy));
  const x1 = Math.min(width, Math.ceil(fx + fw));
  const y1 = Math.min(height, Math.ceil(fy + fh));
  const logo = x1 - x0 >= 4 && y1 - y0 >= 4 ? { use: 'logo', x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  return { logo, background };
}

/** The end card page for `brand` at width x height (CSS px at scale 1). Throws Error on missing copy. */
export function kitEndCardHtml({ brand, card = {}, width, height, fontCss, logoUri }) {
  const s = Math.min(width / 1080, height / 1920);
  const px = (v) => `${+(v * s).toFixed(2)}px`;
  const colors = kitCardColors(brand, card);
  const cta = card.cta_text || (brand.cta && brand.cta.text);
  if (!cta) throw new Error('the end card needs a call to action (brand.cta.text)');
  const url = card.url_text ?? (brand.cta && brand.cta.url) ?? '';
  const stars = card.proof ? card.proof.stars : 0;
  if (stars && !(card.proof.text || '').trim()) throw new Error('stars need approved proof text');
  const wordmark = logoUri
    ? `<img id="logo" src="${logoUri}" alt="">`
    : `<div class="text">${kitCardEsc(brand.name)}</div>`;
  const proof = stars
    ? `<div class="proof-row"><div class="stars">${'&#9733;'.repeat(stars)}</div><div class="families">${kitCardEsc(card.proof.text)}</div></div>`
    : '';
  const benefits = (card.benefits || []).length
    ? `<div class="trust-trio">${card.benefits
        .map(
          (b) =>
            `<div class="item"><div class="badge"><svg viewBox="0 0 24 24">${kitCardIcons[b.icon || 'check']}</svg></div><div class="label">${kitCardEsc(b.label)}</div></div>`,
        )
        .join('')}</div>`
    : '';
  const headline = card.headline ? `<div class="hl">${kitCardEsc(card.headline)}</div>` : '';
  const footnote = card.footnote ? `<div class="footnote">${kitCardEsc(card.footnote)}</div>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
:root{--bg:${colors.bg};--fg:${colors.fg};--cta-bg:${colors.ctaBg};--cta-fg:${colors.ctaFg};--star:${colors.star};}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${width}px;height:${height}px;background:var(--bg);color:var(--fg);font-family:KitBody;overflow:hidden;}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;}
.wordmark{margin-bottom:${px(90)};text-align:center;display:flex;justify-content:center;}
.wordmark img{display:block;max-width:${px(640)};max-height:${px(320)};width:auto;height:auto;object-fit:contain;}
.wordmark .text{font-family:KitHeading;font-size:${px(96)};font-weight:800;letter-spacing:-1px;line-height:1.05;}
.hl{font-family:KitHeading;font-size:${px(72)};line-height:1.08;text-align:center;max-width:${px(900)};margin-bottom:${px(70)};}
.proof-row{display:flex;flex-direction:column;align-items:center;gap:${px(18)};margin-bottom:${px(100)};}
.proof-row .stars{font-size:${px(60)};letter-spacing:${px(8)};color:var(--star);line-height:1;}
.proof-row .families{font-weight:700;font-size:${px(36)};}
.trust-trio{display:flex;gap:${px(80)};justify-content:center;align-items:flex-start;margin-bottom:${px(120)};}
.trust-trio .item{display:flex;flex-direction:column;align-items:center;width:${px(240)};}
.trust-trio .badge{width:${px(140)};height:${px(140)};border-radius:50%;background:var(--fg);display:flex;align-items:center;justify-content:center;margin-bottom:${px(24)};}
.trust-trio .badge svg{width:${px(70)};height:${px(70)};fill:var(--bg);}
.trust-trio .label{font-size:${px(32)};line-height:1.25;text-align:center;}
.cta-pill{background:var(--cta-bg);color:var(--cta-fg);padding:${px(32)} ${px(80)};border-radius:${px(80)};font-family:KitHeading;font-weight:700;font-size:${px(48)};}
.url{margin-top:${px(40)};font-size:${px(34)};font-weight:600;opacity:.85;}
.footnote{position:absolute;left:${px(90)};right:${px(90)};bottom:${px(310)};font-size:${px(22)};line-height:1.35;text-align:center;opacity:.7;}
</style></head><body>
<div class="wordmark" id="wordmark">${wordmark}</div>${headline}${proof}${benefits}
<div class="cta-pill">${kitCardEsc(cta)}</div>${url ? `<div class="url">${kitCardEsc(url)}</div>` : ''}${footnote}
</body></html>`;
}

/**
 * Renders the card to a `seconds`-long clip `<name>.mp4` (H.264, silent stereo
 * track) and returns {video, logo, background}. As a step's output the clip
 * goes in workDir and `video` is its FileRef; with `scratch` it goes in tmpDir
 * and `video` is only its path. `logo` is the safe zone the logo file covers
 * (null without a logo), `background` the colour the card changed to for it.
 */
export async function kitRenderEndCard(ctx, { brand, card, width, height, fps, seconds, name = 'end-card', scratch = false }) {
  if (!ctx.browser) throw ctx.error('needs_missing', 'the end card needs the kit browser');
  const fontCss = await kitCardFontCss(brand, join(ctx.part.dir, 'assets', 'fonts', 'Montserrat-Bold.ttf'));
  let html;
  if (card && card.image) {
    html = `<!doctype html><html><head><style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:${kitCardColors(brand, card).bg};}img{width:100%;height:100%;object-fit:contain;}</style></head><body><img src="${await kitCardDataUri(card.image)}"></body></html>`;
  } else {
    const logoUri = brand.logo ? await kitCardDataUri(brand.logo) : null;
    try {
      html = kitEndCardHtml({ brand, card, width, height, fontCss, logoUri });
    } catch (e) {
      throw ctx.error('bad_input', e.message);
    }
  }
  const browser = await ctx.browser.launch();
  const png = join(ctx.tmpDir, `${name}.png`);
  let fitted = { logo: null, background: null };
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(html);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode()));
    });
    if (!(card && card.image) && brand.logo) {
      const colors = kitCardColors(brand, card || {});
      fitted = await kitCardFitLogo(ctx, page, {
        width,
        height,
        box: KIT_CARD_LOGO_BOXES.classic,
        bg: colors.bg,
        colors: brand.colors || {},
        recolor: (bg) => {
          const c = kitCardColorsOn(brand, card || {}, bg);
          return { '--bg': c.bg, '--fg': c.fg, '--cta-bg': c.ctaBg, '--cta-fg': c.ctaFg };
        },
      });
    }
    await page.screenshot({ path: png, type: 'png' });
  } finally {
    await browser.close();
  }
  await kitFfmpeg(ctx, [
    '-loop',
    '1',
    '-framerate',
    String(fps),
    '-t',
    kitNum(seconds),
    '-i',
    png,
    '-f',
    'lavfi',
    '-t',
    kitNum(seconds),
    '-i',
    'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-vf',
    `scale=${width}:${height},setsar=1,format=yuv420p`,
    '-map',
    '0:v',
    '-map',
    '1:a',
    ...ctx.tools.encodeArgs('h264-master'),
    ...ctx.tools.encodeArgs('aac'),
    '-r',
    String(fps),
    '-t',
    kitNum(seconds),
    join(scratch ? ctx.tmpDir : ctx.workDir, `${name}.mp4`),
  ]);
  const video = scratch ? { path: join(ctx.tmpDir, `${name}.mp4`) } : await ctx.file(`${name}.mp4`, 'video');
  return { video, logo: fitted.logo, background: fitted.background };
}
