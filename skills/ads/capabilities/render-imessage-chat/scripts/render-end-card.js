#!/usr/bin/env node
/**
 * render-end-card.js — render the data-driven end card to a PNG + a still MP4.
 *
 * Reads the recipe's `end_card` config (from config.json) and fills
 * end-card.template.html, then Playwright-screenshots it and makes a short MP4.
 * This is the "make the end card better" fix (QA GOOSE-2481): a designed card —
 * wordmark + ⭐ proof row + trust trio + CTA pill — not a bare logo.
 *
 * Output: <out-dir>/end-card.png  +  <out-dir>/scene-end-endcard.mp4
 *
 * Usage:
 *   node render-end-card.js --config config.json [--out-dir .]
 *
 * end_card config (see config.example.json — values below are placeholders; colours
 * and copy come from the brand kit, approved copy only):
 *   {
 *     "bg": "#ffffff", "fg": "#111111", "cta_bg": "#111111", "cta_fg": "#ffffff",
 *     "star_color": "#ffc83d",
 *     "logo_svg": "<svg …>…</svg>",   // preferred; else "wordmark_text": "BRAND"
 *     "stars": 5,                      // 0 hides the proof row
 *     "proof_text": "<approved proof line>",
 *     "trust_trio": [ {"label":"<benefit>","icon":"check"}, … ],
 *     "cta_text": "<approved CTA>",
 *     "dwell_sec": 2.5
 *   }
 * Missing colours fall back to a neutral white/black card (never a demo brand's palette).
 * Relative paths (logo_svg_path) resolve against the config's directory.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

function parseArgs(argv) {
  const a = { config: 'config.json', outDir: '.' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--config') a.config = argv[++i];
    else if (argv[i] === '--out-dir') a.outDir = argv[++i];
  }
  return a;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// A small default icon set (filled paths, currentColor via `fill` on the badge).
const ICONS = {
  pencil: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
  heart: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  palette: '<path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>',
  star: '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>',
  check: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
  gift: '<path d="M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-5.5-1.65l-.5.67-.5-.68A3 3 0 0 0 6 4c0 .35.07.69.18 1H4a2 2 0 0 0-2 2v2h20V7a2 2 0 0 0-2-1zM4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4z"/>',
  bolt: '<path d="M7 2v11h3v9l7-12h-4l4-8z"/>',
  shield: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>',
};

function iconSvg(name) {
  const p = ICONS[name] || ICONS.check;
  return `<svg viewBox="0 0 24 24">${p}</svg>`;
}

function main() {
  const args = parseArgs(process.argv);
  const configPath = path.resolve(args.config);
  const cfgDir = path.dirname(configPath);
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const ec = cfg.end_card || {};

  const tpl = fs.readFileSync(path.join(__dirname, 'end-card.template.html'), 'utf-8');

  // Wordmark: prefer an inline SVG (or a path to one), else a bold text fallback.
  let logoSvg = ec.logo_svg || '';
  if (!logoSvg && ec.logo_svg_path) logoSvg = fs.readFileSync(path.resolve(cfgDir, ec.logo_svg_path), 'utf-8');
  // A raster logo (PNG/JPG) is inlined as a data URI for brands with no official SVG.
  let logoImg = '';
  if (!logoSvg && ec.logo_image_path) {
    const f = path.resolve(cfgDir, ec.logo_image_path);
    const ext = path.extname(f).slice(1).toLowerCase();
    const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : `image/${ext}`;
    logoImg = `<img src="data:${mime};base64,${fs.readFileSync(f).toString('base64')}" alt="">`;
  }
  const wordmark = logoSvg || logoImg ||
    `<div class="text">${esc(ec.wordmark_text || cfg.brand_name || 'BRAND')}</div>`;

  // Proof row (⭐ + text) — omit entirely if stars is 0/absent.
  const starCount = ec.stars == null ? 5 : ec.stars;
  const proof = (starCount > 0)
    ? `<div class="proof-row"><div class="stars">${'★'.repeat(starCount)}</div>` +
      (ec.proof_text ? `<div class="families">${esc(ec.proof_text)}</div>` : '') + `</div>`
    : '';

  // Trust trio — up to a handful of {label, icon} items.
  const trio = Array.isArray(ec.trust_trio) && ec.trust_trio.length
    ? `<div class="trust-trio">` + ec.trust_trio.map(it =>
        `<div class="item"><div class="badge">${iconSvg(it.icon)}</div>` +
        `<div class="label">${esc(it.label || '').replace(/\n/g, '<br>')}</div></div>`
      ).join('') + `</div>`
    : '';

  // ── editorial layout: the brand's own type system instead of the generic badge card ──
  // fonts: { headline|body|mono: { family, weight, style, google } } where `google` is the
  // Google Fonts family spec used as a free stand-in when the brand's font is licensed.
  const F = ec.fonts || {};
  const face = (k, fb) => F[k] ? `font-family:'${F[k].family}',${fb};font-weight:${F[k].weight || 400};font-style:${F[k].style || 'normal'};` : `font-family:${fb};`;
  const gf = Object.values(F).filter(f => f.google).map(f => 'family=' + f.google).join('&');
  const fontCssUrl = gf ? `https://fonts.googleapis.com/css2?${gf}&display=block` : '';
  let fontLink = '';  // filled below with inlined @font-face (no network while rendering)
  let editorial = '';
  if (ec.layout === 'editorial') {
    const hl = (ec.headline || []).map((line, i) =>
      `<div class="hl" style="${face('headline', 'Georgia,serif')}color:${i && ec.accent ? ec.accent : 'var(--fg)'};text-transform:${ec.headline_case || 'none'}">${esc(line)}</div>`).join('');
    const pts = (ec.points || []).length
      ? `<div class="pts" style="${face('mono', 'monospace')}text-transform:${ec.points_case || 'none'}">${ec.points.map(x => `<span class="pt">${esc(x)}</span>`).join(`<span class="sep">${esc(ec.points_sep || ' / ')}</span>`)}</div>` : '';
    const cta = ec.cta_text ? `<div class="cta-pill" style="${face('body', "'Helvetica Neue',Arial,sans-serif")}">${esc(ec.cta_text)}</div>` : '';
    const url = ec.url_text ? `<div class="url" style="${face('mono', 'monospace')}">${esc(ec.url_text)}</div>` : '';
    editorial = `<div class="wordmark">${wordmark}</div><div class="hls">${hl}</div>${pts}${cta}${url}`;
  }

  const html = tpl
    .replace('{{BG}}', ec.bg || '#ffffff')
    .replace('{{FG}}', ec.fg || '#111111')
    .replace('{{CTA_BG}}', ec.cta_bg || '#111111')
    .replace('{{CTA_FG}}', ec.cta_fg || '#ffffff')
    .replace('{{STAR}}', ec.star_color || '#ffc83d')
    .replace('{{WORDMARK}}', wordmark)
    .replace('{{PROOF}}', proof)
    .replace('{{TRIO}}', trio)
    .replace('{{CTA}}', esc(ec.cta_text || 'Learn more'))
    .replace('{{WORDMARK_W}}', String(ec.wordmark_width || 560))
    .replace('{{URL}}', ec.url_text ? `<div class="url">${esc(ec.url_text)}</div>` : '')
    // Legal line (e.g. the FDA disclaimer every supplement benefit claim needs). Sits
    // above y=1635 so it stays inside the 4:5 safe zone.
    .replace('{{BODY}}', editorial)
    .replace('{{LAYOUT}}', ec.layout === 'editorial' ? 'editorial' : 'badges')
    .replace('{{BADGES_START}}', ec.layout === 'editorial' ? '<template>' : '')
    .replace('{{BADGES_END}}', ec.layout === 'editorial' ? '</template>' : '')
    .replace('{{FOOTNOTE}}', ec.footnote ? `<div class="footnote">${esc(ec.footnote)}</div>` : '');

  const outDir = path.resolve(args.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const htmlPath = path.join(outDir, 'end-card.html');
  const outPng = path.join(outDir, 'end-card.png');
  const outMp4 = path.join(outDir, 'scene-end-endcard.mp4');
  const dwell = ec.dwell_sec || 2.5;
  // No brand fonts requested: the placeholder must still go, or it prints on the card.
  fs.writeFileSync(htmlPath, html.replace('{{FONTLINK}}', ''));

  // Download the Google Fonts CSS + font files once, cache them, and inline them as data URIs,
  // so a slow or flaky network can never swap the brand type for a fallback mid-render.
  async function inlineFonts(url) {
    const crypto = require('crypto'), os = require('os');
    const dir = path.join(os.tmpdir(), 'imsg-fonts'); fs.mkdirSync(dir, { recursive: true });
    const cssFile = path.join(dir, crypto.createHash('sha1').update(url).digest('hex') + '.css');
    if (fs.existsSync(cssFile)) return fs.readFileSync(cssFile, 'utf-8');
    const get = async (u, asText) => {
      for (let i = 0; i < 4; i++) {
        try {
          const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' } });
          if (r.ok) return asText ? await r.text() : Buffer.from(await r.arrayBuffer());
        } catch (e) { /* retry */ }
        await new Promise(res => setTimeout(res, 800 * (i + 1)));
      }
      throw new Error('could not download ' + u);
    };
    let css = await get(url, true);
    for (const m of [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)'"]+/g) || [])]) {
      const buf = await get(m, false);
      css = css.split(m).join('data:font/woff2;base64,' + buf.toString('base64'));
    }
    fs.writeFileSync(cssFile, css);
    return css;
  }

  (async () => {
    if (fontCssUrl) {
      try { fontLink = `<style>${await inlineFonts(fontCssUrl)}</style>`; }
      catch (e) { console.error('END CARD FONT DOWNLOAD FAILED: ' + e.message); process.exit(5); }
      fs.writeFileSync(htmlPath, html.replace('{{FONTLINK}}', fontLink));
    }
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'load' });
    // Every requested font must actually load; a silent fallback to Times is a broken card.
    const missing = await page.evaluate(async fams => {
      await document.fonts.ready;
      return fams.filter(f => !document.fonts.check(`${f.style || 'normal'} ${f.weight || 400} 40px '${f.family}'`));
    }, Object.values(F));
    if (missing.length) { console.error('END CARD FONT NOT LOADED: ' + missing.map(f => f.family).join(', ')); process.exit(5); }
    await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 5000 });
    await page.waitForTimeout(400);
    // A logo that barely contrasts with the card (a black PNG on a black plate) is
    // recoloured to the card's text colour, so the brand never vanishes.
    const tint = await page.evaluate(() => {
      const lum = hex => { const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
        const c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
      const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const css = getComputedStyle(document.documentElement);
      const bg = lum(css.getPropertyValue('--bg').trim()), fg = lum(css.getPropertyValue('--fg').trim());
      const img = document.querySelector('.wordmark img');
      if (!img) return null;
      const cv = document.createElement('canvas'); cv.width = 200; cv.height = Math.max(1, Math.round(200 * img.naturalHeight / img.naturalWidth));
      const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, cv.width, cv.height);
      const d = cx.getImageData(0, 0, cv.width, cv.height).data; let sum = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) {
        const c = [d[i], d[i + 1], d[i + 2]].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
        sum += 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; n++; }
      if (!n) return null;
      const r = ratio(sum / n, bg);
      if (r >= 3) return `logo contrast ${r.toFixed(1)}:1, kept`;
      img.style.filter = fg > 0.5 ? 'brightness(0) invert(1)' : 'brightness(0)';
      return `logo contrast ${r.toFixed(1)}:1 on this card, recoloured to the text colour`;
    });
    if (tint) console.log(tint);
    await page.screenshot({ path: outPng });
    await browser.close();
    execSync(
      `ffmpeg -y -loop 1 -i "${outPng}" -t ${dwell} -r 30 ` +
      `-vf "scale=1080:1920,format=yuv420p" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outMp4}"`,
      { stdio: 'pipe' }
    );
    console.log(`png  → ${path.relative(process.cwd(), outPng)}`);
    console.log(`mp4  → ${path.relative(process.cwd(), outMp4)} (${dwell}s)`);
  })().catch(e => { console.error(e); process.exit(1); });
}

main();
