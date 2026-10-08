// The brand end card, drawn in the kit's Chromium: the logo file as-is (never
// recoloured or redrawn; a low-contrast logo sits on a plate instead), the
// brand's colours and fonts, an optional proof row (stars only with approved
// proof text), up to three benefits, the call to action and the URL. Today's
// render-imessage-chat end card, made data-only. Shared by the end-card part
// and the brand layer. Every top-level name starts with `kit`.
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
.wordmark{width:${px(560)};max-width:${px(640)};max-height:${px(300)};margin-bottom:${px(90)};text-align:center;display:flex;justify-content:center;}
.wordmark.plate{background:var(--plate);padding:${px(36)} ${px(48)};border-radius:${px(32)};width:auto;}
.wordmark img{max-width:${px(560)};max-height:${px(300)};width:auto;height:auto;object-fit:contain;}
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
 * Renders the card to `<name>.png` and a `seconds`-long clip `<name>.mp4`
 * (H.264, silent stereo track) in workDir. Returns the clip's FileRef.
 */
export async function kitRenderEndCard(ctx, { brand, card, width, height, fps, seconds, name = 'end-card' }) {
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
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(html);
    const plate = await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode()));
      // A logo that barely contrasts with the card gets a plate behind it; the file itself is never changed.
      const img = document.getElementById('logo');
      if (!img) return null;
      const lum = (r, g, b) =>
        [r, g, b]
          .map((v) => {
            const x = v / 255;
            return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          })
          .reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0);
      const bgHex = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      const n = parseInt(bgHex.slice(1), 16);
      const bg = lum((n >> 16) & 255, (n >> 8) & 255, n & 255);
      const cv = document.createElement('canvas');
      cv.width = 200;
      cv.height = Math.max(1, Math.round((200 * img.naturalHeight) / Math.max(1, img.naturalWidth)));
      const cx = cv.getContext('2d');
      cx.drawImage(img, 0, 0, cv.width, cv.height);
      const d = cx.getImageData(0, 0, cv.width, cv.height).data;
      let sum = 0;
      let count = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 128) {
          sum += lum(d[i], d[i + 1], d[i + 2]);
          count++;
        }
      }
      if (!count) return null;
      const logo = sum / count;
      const ratio = (Math.max(logo, bg) + 0.05) / (Math.min(logo, bg) + 0.05);
      if (ratio >= 3) return null;
      const box = document.getElementById('wordmark');
      box.style.setProperty('--plate', logo > 0.5 ? '#111111' : '#ffffff');
      box.classList.add('plate');
      return +ratio.toFixed(2);
    });
    if (plate !== null) ctx.log.info('end card logo on a plate for contrast', { contrast: plate });
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
    join(ctx.workDir, `${name}.mp4`),
  ]);
  return ctx.file(`${name}.mp4`, 'video');
}
