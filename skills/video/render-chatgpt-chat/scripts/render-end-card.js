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
 * end_card config (see config.example.json):
 *   {
 *     "bg": "#fbf4e8", "fg": "#1e5751", "cta_bg": "#9fe778", "cta_fg": "#1e5751",
 *     "star_color": "#ffd15a",
 *     "logo_svg": "<svg …>…</svg>",   // preferred; else "wordmark_text": "BRAND"
 *     "stars": 5,                      // 0 hides the proof row
 *     "proof_text": "69,000 families",
 *     "trust_trio": [ {"label":"Easy to\npersonalize","icon":"pencil"}, … ],
 *     "cta_text": "Personalize his book",
 *     "dwell_sec": 2.5
 *   }
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
  const wordmark = logoSvg
    ? logoSvg
    : `<div class="text">${esc(ec.wordmark_text || cfg.brand_name || 'BRAND')}</div>`;

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

  const html = tpl
    .replace('{{BG}}', ec.bg || '#fbf4e8')
    .replace('{{FG}}', ec.fg || '#1e5751')
    .replace('{{CTA_BG}}', ec.cta_bg || '#9fe778')
    .replace('{{CTA_FG}}', ec.cta_fg || '#1e5751')
    .replace('{{STAR}}', ec.star_color || '#ffd15a')
    .replace('{{WORDMARK}}', wordmark)
    .replace('{{PROOF}}', proof)
    .replace('{{TRIO}}', trio)
    .replace('{{CTA}}', esc(ec.cta_text || 'Learn more'));

  const outDir = path.resolve(args.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const htmlPath = path.join(outDir, 'end-card.html');
  const outPng = path.join(outDir, 'end-card.png');
  const outMp4 = path.join(outDir, 'scene-end-endcard.mp4');
  const dwell = ec.dwell_sec || 2.5;
  fs.writeFileSync(htmlPath, html);

  (async () => {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'load' });
    await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 5000 });
    await page.waitForTimeout(400);
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
