// end-card 1.1.0 layouts beyond the 1.0.1 card ("classic", drawn by
// _lib/end-card.mjs and left unchanged):
//   brandkit   mark (logo) + wordmark + rule + tagline + rows + CTA pill + URL
//   editorial  type only, left aligned: wordmark, rule, tagline, rows, URL; no mark, CTA optional
//   stack      the logo (or wordmark) over the URL
//   statement  the logo over 1 to 3 rows (first in the text colour, the rest in the accent); CTA optional
// The logo rule is the same as 1.0.1: the file is drawn as-is, never
// recoloured, and a logo that barely contrasts with the card sits on a plate.
// Names here are the part's own (not kit-prefixed) and unique in the bundle.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { kitCardContrastText, kitCardFontCss } from '../../_lib/end-card.mjs';

export const CARD_LAYOUTS = ['classic', 'brandkit', 'editorial', 'stack', 'statement', 'none'];

const cardHexRe = /^#([0-9a-fA-F]{6})$/;

function cardEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cardLuminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** WCAG contrast ratio of two #rrggbb colours. */
export function cardContrast(a, b) {
  const x = cardLuminance(a);
  const y = cardLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function cardHex(value) {
  return typeof value === 'string' && cardHexRe.test(value) ? value : null;
}

/**
 * Colours for the 1.1.0 layouts. An explicit step colour always wins. A brand
 * colour is used only when it reads on the card (text 4.5:1, accent 3:1), so a
 * dark statement card never gets the brand's dark text colour.
 */
export function cardLayoutColors(brand, card = {}) {
  const c = brand.colors || {};
  const bg = cardHex(card.background) || cardHex(c.background) || '#ffffff';
  const reads = (hex, min) => (hex && cardContrast(hex, bg) >= min ? hex : null);
  const fg = cardHex(card.foreground) || reads(cardHex(c.text), 4.5) || kitCardContrastText(bg);
  const accent = cardHex(card.accent) || reads(cardHex(c.primary), 3) || reads(cardHex(c.secondary), 3) || fg;
  const ctaBg = cardHex(card.cta_background) || cardHex(c.primary) || fg;
  return { bg, fg, accent, ctaBg, ctaFg: kitCardContrastText(ctaBg) };
}

/** Rows from a list or a ' | '-joined answer: trimmed, empty ones dropped. */
export function cardRows(rows) {
  if (rows === undefined || rows === null) return [];
  const list = typeof rows === 'string' ? rows.split('|') : rows;
  return list.map((r) => String(r).trim()).filter(Boolean);
}

/**
 * The copy a layout draws, or an Error naming what is wrong. Inputs a layout
 * cannot show are refused rather than silently dropped.
 */
export function cardLayoutCopy(layout, brand, card = {}) {
  const ignored = [];
  if (card.proof) ignored.push('proof');
  if (card.benefits && card.benefits.length) ignored.push('benefits');
  if (card.image) ignored.push('image');
  if (layout === 'stack') {
    if (card.headline) ignored.push('headline');
    if (card.cta_text) ignored.push('cta_text');
  }
  const rows = cardRows(card.rows);
  if (card.rows !== undefined && layout === 'stack') ignored.push('rows');
  if (ignored.length) return new Error(`layout ${layout} does not draw ${ignored.join(', ')}`);
  if (rows.length > 3) return new Error(`at most 3 rows, got ${rows.length}`);
  for (const r of rows) if ([...r].length > 60) return new Error(`a row is longer than 60 characters: "${r.slice(0, 20)}…"`);
  const brandCta = brand.cta && brand.cta.text;
  const brandUrl = (brand.cta && brand.cta.url) || '';
  const copy = { headline: card.headline || '', rows, footnote: card.footnote || '' };
  if (layout === 'brandkit') {
    copy.cta = card.cta_text || brandCta;
    if (!copy.cta) return new Error('the brandkit card needs a call to action (cta_text or brand.cta.text)');
    copy.url = card.url_text ?? brandUrl;
  } else if (layout === 'editorial') {
    copy.cta = card.cta_text || '';
    copy.url = card.url_text ?? brandUrl;
  } else if (layout === 'stack') {
    copy.cta = '';
    copy.url = card.url_text ?? brandUrl;
  } else if (layout === 'statement') {
    if (rows.length && copy.headline) return new Error('the statement card draws rows; give the headline as the first row');
    if (!rows.length && !copy.headline) return new Error('the statement card needs 1 to 3 rows (rows, or a headline)');
    if (!rows.length) copy.rows = [copy.headline];
    copy.headline = '';
    copy.cta = card.cta_text || '';
    copy.url = card.url_text ?? '';
  } else {
    return new Error(`unknown layout ${layout}`);
  }
  return copy;
}

/** The page for a 1.1.0 layout at width x height. Throws Error on missing or unusable copy. */
export function cardLayoutHtml({ layout, brand, card = {}, width, height, fontCss = '', logoUri = null }) {
  const copy = cardLayoutCopy(layout, brand, card);
  if (copy instanceof Error) throw copy;
  const s = Math.min(width / 1080, height / 1920);
  const px = (v) => `${+(v * s).toFixed(2)}px`;
  const col = cardLayoutColors(brand, card);
  const name = `<div class="name">${cardEsc(brand.name)}</div>`;
  const logo = logoUri ? `<div class="mark" id="wordmark"><img id="logo" src="${logoUri}" alt=""></div>` : '';
  const rule = '<div class="rule"></div>';
  const headline = copy.headline ? `<div class="hl">${cardEsc(copy.headline)}</div>` : '';
  const rows = copy.rows.length ? `<div class="rows">${copy.rows.map((r, i) => `<div class="row r${i}">${cardEsc(r)}</div>`).join('')}</div>` : '';
  const url = copy.url ? `<div class="url">${cardEsc(copy.url)}</div>` : '';
  const footnote = copy.footnote ? `<div class="footnote">${cardEsc(copy.footnote)}</div>` : '';
  let body;
  let css;
  if (layout === 'brandkit') {
    body = `<div class="col">${logo}${name}${rule}${headline}${rows}<div class="cta-pill">${cardEsc(copy.cta)}</div>${url}</div>`;
    css = `.col{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 ${px(90)};}
.mark{margin-bottom:${px(48)};}.mark img{max-width:${px(420)};max-height:${px(360)};}
.name{font-family:KitHeading;font-size:${px(88)};font-weight:800;line-height:1.05;letter-spacing:-1px;}
.rule{width:${px(140)};height:${px(8)};background:var(--accent);margin:${px(56)} 0;border-radius:${px(4)};}
.hl{font-size:${px(56)};line-height:1.15;max-width:${px(900)};margin-bottom:${px(40)};}
.rows{margin-bottom:${px(40)};}.row{font-size:${px(40)};line-height:1.35;}
.cta-pill{margin-top:${px(60)};background:var(--cta-bg);color:var(--cta-fg);padding:${px(32)} ${px(80)};border-radius:${px(80)};font-family:KitHeading;font-weight:700;font-size:${px(48)};}
.url{margin-top:${px(40)};font-size:${px(34)};font-weight:600;opacity:.85;}`;
  } else if (layout === 'editorial') {
    const cta = copy.cta ? `<div class="cta">${cardEsc(copy.cta)}</div>` : '';
    body = `<div class="col">${name}${rule}${headline}${rows}${cta}${url}</div>`;
    css = `body{align-items:flex-start;}
.col{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:0 ${px(96)};max-width:100%;}
.name{font-family:KitHeading;font-size:${px(132)};font-weight:800;line-height:1;letter-spacing:-2px;}
.rule{width:${px(180)};height:${px(8)};background:var(--accent);margin:${px(56)} 0 ${px(48)};}
.hl{font-size:${px(60)};line-height:1.12;max-width:${px(860)};margin-bottom:${px(36)};}
.row{font-size:${px(44)};line-height:1.3;max-width:${px(860)};}
.rows{margin-bottom:${px(36)};}
.cta{margin-top:${px(24)};font-family:KitHeading;font-weight:700;font-size:${px(44)};color:var(--accent);}
.url{margin-top:${px(28)};font-size:${px(34)};font-weight:600;opacity:.8;}`;
  } else if (layout === 'stack') {
    const mark = logoUri ? logo : `<div id="wordmark">${name}</div>`;
    body = `<div class="col">${mark}${url}</div>`;
    css = `.col{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 ${px(90)};}
.mark img{max-width:${px(720)};max-height:${px(420)};}
.name{font-family:KitHeading;font-size:${px(112)};font-weight:800;line-height:1.05;letter-spacing:-1px;}
.url{margin-top:${px(72)};font-size:${px(44)};font-weight:600;}`;
  } else {
    const mark = logoUri ? logo : `<div id="wordmark">${name}</div>`;
    const cta = copy.cta ? `<div class="cta">${cardEsc(copy.cta)}</div>` : '';
    body = `<div class="col">${mark}${rows}${cta}${url}</div>`;
    css = `body{justify-content:flex-start;}
.col{display:flex;flex-direction:column;align-items:center;text-align:center;padding:${px(400)} ${px(80)} 0;}
.mark{margin-bottom:${px(110)};}.mark img{max-width:${px(720)};max-height:${px(300)};}
#wordmark{margin-bottom:${px(110)};}
.name{font-family:KitHeading;font-size:${px(110)};font-weight:800;line-height:1.05;}
.row{font-family:KitHeading;font-weight:800;font-size:${px(66)};line-height:${px(86)};color:var(--accent);-webkit-text-stroke:${px(5)} rgba(0,0,0,.6);paint-order:stroke fill;}
.row.r0{color:var(--fg);}
.cta{margin-top:${px(60)};font-family:KitHeading;font-weight:700;font-size:${px(44)};}
.url{margin-top:${px(28)};font-size:${px(34)};font-weight:600;opacity:.85;}`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
:root{--bg:${col.bg};--fg:${col.fg};--accent:${col.accent};--cta-bg:${col.ctaBg};--cta-fg:${col.ctaFg};}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${width}px;height:${height}px;background:var(--bg);color:var(--fg);font-family:KitBody;overflow:hidden;}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;}
.mark img{width:auto;height:auto;object-fit:contain;display:block;}
#wordmark.plate{background:var(--plate);padding:${px(36)} ${px(48)};border-radius:${px(32)};}
.footnote{position:absolute;left:${px(90)};right:${px(90)};bottom:${px(310)};font-size:${px(22)};line-height:1.35;text-align:center;opacity:.7;}
${css}
</style></head><body>${body}${footnote}</body></html>`;
}

async function cardDataUri(file) {
  const bytes = await readFile(file.path);
  return `data:${file.mime || 'application/octet-stream'};base64,${bytes.toString('base64')}`;
}

/** Renders a 1.1.0 layout to `<name>.mp4` in workDir (H.264, silent stereo track), as 1.0.1 does for its card. */
export async function cardRenderLayout(ctx, { layout, brand, card, width, height, fps, seconds, name = 'end-card' }) {
  const copy = cardLayoutCopy(layout, brand, card);
  if (copy instanceof Error) throw ctx.error('bad_input', copy.message);
  if (!ctx.browser) throw ctx.error('needs_missing', 'the end card needs the kit browser');
  const fontCss = await kitCardFontCss(brand, join(ctx.part.dir, 'assets', 'fonts', 'Montserrat-Bold.ttf'));
  const drawsLogo = layout !== 'editorial';
  const logoUri = drawsLogo && brand.logo ? await cardDataUri(brand.logo) : null;
  const html = cardLayoutHtml({ layout, brand, card, width, height, fontCss, logoUri });
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
  const out = join(ctx.workDir, `${name}.mp4`);
  await kitFfmpeg(ctx, [
    '-loop', '1', '-framerate', String(fps), '-t', kitNum(seconds), '-i', png,
    '-f', 'lavfi', '-t', kitNum(seconds), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-vf', `scale=${width}:${height},setsar=1,format=yuv420p`,
    '-map', '0:v', '-map', '1:a',
    ...ctx.tools.encodeArgs('h264-master'),
    ...ctx.tools.encodeArgs('aac'),
    '-r', String(fps), '-t', kitNum(seconds),
    out,
  ]);
  return ctx.file(`${name}.mp4`, 'video');
}
