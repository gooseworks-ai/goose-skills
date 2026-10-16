// end-card 1.1.0 layouts beyond the 1.0.1 card ("classic", drawn by
// _lib/end-card.mjs and left unchanged):
//   brandkit   mark (logo) + wordmark + rule + tagline + rows + CTA pill + URL
//   editorial  type only, left aligned: wordmark, rule, tagline, rows, URL; no mark, CTA optional
//   stack      the logo (or wordmark) over the URL
//   statement  the logo over 1 to 3 rows (first in the text colour, the rest in the accent); CTA optional
// The logo (1.1.1) is fitted as in the classic card (_lib/end-card.mjs
// kitCardFitLogo): never recoloured, a flat file background made transparent,
// scaled into the layout's box, and the card recoloured when it would not read.
// Names here are the part's own (not kit-prefixed) and unique in the bundle.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { KIT_CARD_LOGO_BOXES, kitCardFitLogo, kitCardFontCss } from '../../_lib/end-card.mjs';

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
 * Near-black or white, whichever has the higher contrast on `hex` (by the
 * actual ratio). On the few mid-greys where neither reaches 4.5:1, pure black
 * is tried too (#777777: white 4.48, #111111 4.2, black 4.69).
 */
export function cardBestText(hex) {
  const pick = cardContrast('#111111', hex) >= cardContrast('#ffffff', hex) ? '#111111' : '#ffffff';
  if (cardContrast(pick, hex) >= 4.5) return pick;
  return cardContrast('#000000', hex) > cardContrast(pick, hex) ? '#000000' : pick;
}

const cardMimeRe = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/i;

/** A file's MIME type when it is a plain type/subtype, else application/octet-stream (it ends up in markup). */
export function cardSafeMime(mime) {
  return typeof mime === 'string' && cardMimeRe.test(mime) ? mime : 'application/octet-stream';
}

export function cardSafeFile(file) {
  return file && typeof file === 'object' && file.mime !== undefined ? { ...file, mime: cardSafeMime(file.mime) } : file;
}

/**
 * The brand with every file MIME type reduced to a plain type/subtype, so no
 * brand value can break out of a data: URI in the page (logo src, @font-face).
 * Used for every layout, classic included.
 */
export function cardSafeBrand(brand) {
  const out = { ...brand };
  if (brand.logo) out.logo = cardSafeFile(brand.logo);
  if (brand.fonts) out.fonts = Object.fromEntries(Object.entries(brand.fonts).map(([k, f]) => [k, cardSafeFile(f)]));
  return out;
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
  const fg = cardHex(card.foreground) || reads(cardHex(c.text), 4.5) || cardBestText(bg);
  const accent = cardHex(card.accent) || reads(cardHex(c.primary), 3) || reads(cardHex(c.secondary), 3) || fg;
  const ctaBg = cardHex(card.cta_background) || cardHex(c.primary) || fg;
  return { bg, fg, accent, ctaBg, ctaFg: cardBestText(ctaBg) };
}

/**
 * The layout colours on a background the logo forced: a step colour is kept only when it reads on it (text
 * 4.5:1, accent 3:1, the CTA pill 1.5:1 against the card), so nothing vanishes into the new card.
 */
export function cardLayoutColorsOn(brand, card, bg) {
  const keep = (hex, min) => (cardHex(hex) && cardContrast(hex, bg) >= min ? hex : undefined);
  const col = cardLayoutColors(brand, { ...card, background: bg, foreground: keep(card.foreground, 4.5), accent: keep(card.accent, 3), cta_background: keep(card.cta_background, 1.5) });
  if (cardContrast(col.ctaBg, bg) < 1.5) {
    col.ctaBg = col.fg;
    col.ctaFg = cardBestText(col.fg);
  }
  return col;
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
  // Checked on the rows the card draws, so a statement's headline-as-row obeys the same limits.
  if (copy.rows.length > 3) return new Error(`at most 3 rows, got ${copy.rows.length}`);
  for (const r of copy.rows) if ([...r].length > 60) return new Error(`a row is longer than 60 characters: "${r.slice(0, 20)}…"`);
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
.mark{margin-bottom:${px(48)};}.mark img{max-width:${px(520)};max-height:${px(300)};}
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
.footnote{position:absolute;left:${px(90)};right:${px(90)};bottom:${px(310)};font-size:${px(22)};line-height:1.35;text-align:center;opacity:.7;}
${css}
</style></head><body>${body}${footnote}</body></html>`;
}

async function cardDataUri(file) {
  const bytes = await readFile(file.path);
  return `data:${cardSafeMime(file.mime)};base64,${bytes.toString('base64')}`;
}

/**
 * Renders a 1.1.0 layout to `<name>.mp4` in workDir (H.264, silent stereo track), as 1.0.1 does for its card.
 * Returns {video, logo, background} as kitRenderEndCard does.
 */
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
  let fitted = { logo: null, background: null };
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(html);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode()));
    });
    if (logoUri) {
      fitted = await kitCardFitLogo(ctx, page, {
        width,
        height,
        box: KIT_CARD_LOGO_BOXES[layout],
        bg: cardLayoutColors(brand, card).bg,
        colors: brand.colors || {},
        recolor: (bg) => {
          const c = cardLayoutColorsOn(brand, card, bg);
          return { '--bg': c.bg, '--fg': c.fg, '--accent': c.accent, '--cta-bg': c.ctaBg, '--cta-fg': c.ctaFg };
        },
      });
    }
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
  return { video: await ctx.file(`${name}.mp4`, 'video'), logo: fitted.logo, background: fitted.background };
}
