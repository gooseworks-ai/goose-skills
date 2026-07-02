#!/usr/bin/env node
/**
 * render-end-card.js — render the static end-card PNG, then loop it into a
 * 3.5s MP4 ready for stitching.
 *
 * Visual style: handwritten scrapbook card. White polaroid-style card with a
 * slight tilt, sitting on a soft cream paper-textured background. Inside the
 * card: a hand-drawn marker headline with one number circled, the product
 * bottle in the middle, and 3 handwritten checklist rows at the bottom.
 *
 * Spec fields (under spec.end_card):
 *   - headline_pre    (string) — first hand-drawn line, e.g. "THE POWER OF"
 *   - headline_main   (string) — second line, e.g. "1 CAPSULE"
 *   - headline_underlined (string|null) — word in headline_pre to underline
 *   - headline_circled (string|null) — token in headline_main to circle
 *   - checklist[]     (array)  — `{ label: "PROBIOTIC", value: "BOOSTED" }`
 *   - background_color (string) — outer scene bg, default Bioma cream
 *   - ink_color       (string) — ink for typography
 *   - product_image   (string|null) — path to bottle PNG (relative to ad root
 *                                     under assets/, e.g. "assets/product-bottle.png").
 *                                     Falls back to assets/product-bottle.{png,webp,jpg}
 *                                     auto-detection.
 *
 * Usage:
 *   NODE_PATH=<repo>/skills/atoms/messaging/create-apple-notes-mockup/node_modules \
 *     node clips/render-end-card.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

// Match the recorder's canvas (1180×2100, 9:16-ish) so the typing master
// and the end-card MP4 share dimensions — the stitch crossfade requires it.
const VIEW_W = 1180;
const VIEW_H = 2100;
const HOLD_SEC = 3.5;
const FPS = 30;

function loadSpec() {
  const p = path.join(__dirname, '..', 'notes', 'note.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function loadProductImage(adRoot, specPath) {
  // Resolve `spec.end_card.product_image` against the ad root.
  if (specPath) {
    const abs = path.resolve(adRoot, specPath);
    if (fs.existsSync(abs)) return abs;
  }
  // Auto-detect under assets/.
  const candidates = ['product-bottle.png', 'product-bottle.webp', 'product-bottle.jpg'];
  for (const c of candidates) {
    const p = path.join(adRoot, 'assets', c);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function inlineImage(p) {
  if (!p) return '';
  const ext = path.extname(p).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const buf = fs.readFileSync(p);
  return `<img src="data:${mime};base64,${buf.toString('base64')}" alt="">`;
}

// Wrap the underline_token inside headline_pre with the .underline span.
function buildHeadlinePre(headlinePre, underlineToken) {
  const esc = escapeHtml(headlinePre || '');
  if (!underlineToken) return esc;
  const tk = escapeHtml(underlineToken);
  const re = new RegExp(`\\b(${tk.replace(/[.*+?^${}()|[\\\]\\\\]/g, '\\$&')})\\b`);
  return esc.replace(re, '<span class="underline">$1</span>');
}

// Render headline_main, replacing circled_token with a circled span.
function buildHeadlineMain(headlineMain, circledToken) {
  const main = String(headlineMain || '');
  if (!circledToken) return escapeHtml(main);
  const tk = String(circledToken);
  const idx = main.indexOf(tk);
  if (idx < 0) return escapeHtml(main);
  const before = main.slice(0, idx);
  const after = main.slice(idx + tk.length);
  let out = '';
  if (before) out += `<span>${escapeHtml(before.trimEnd())}</span>`;
  out += `<span class="circled">${escapeHtml(tk)}</span>`;
  if (after) out += `<span>${escapeHtml(after.trimStart())}</span>`;
  return out;
}

function buildChecklist(items) {
  if (!items || !items.length) return '';
  return items.map(it => `
    <div class="check-row">
      <div class="check-label">${escapeHtml(it.label || '')}</div>
      <div class="check-value">${escapeHtml(it.value || '')}</div>
      <div class="check-mark">✓</div>
    </div>
  `).join('');
}

async function main() {
  const spec = loadSpec();
  const ec = spec.end_card || {};
  const adRoot = path.join(__dirname, '..');
  const tpl = fs.readFileSync(path.join(__dirname, 'end-card.template.html'), 'utf-8');

  const productPath = loadProductImage(adRoot, ec.product_image);
  const productImg = inlineImage(productPath);

  const headlinePre = buildHeadlinePre(ec.headline_pre || 'THE POWER OF', ec.headline_underlined || 'POWER');
  const headlineMain = buildHeadlineMain(ec.headline_main || '1 CAPSULE', ec.headline_circled || null);
  const checklistRows = buildChecklist(ec.checklist || []);

  const html = tpl
    .replaceAll('{{BG_COLOR}}', ec.background_color || '#eee3d6')
    .replaceAll('{{INK_COLOR}}', ec.ink_color || '#1d3d39')
    .replace('{{HEADLINE_PRE_HTML}}', headlinePre)
    .replace('{{HEADLINE_MAIN_HTML}}', headlineMain)
    .replace('{{PRODUCT_IMG}}', productImg)
    .replace('{{CHECKLIST_ROWS}}', checklistRows);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: VIEW_W, height: VIEW_H },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  // Give Google Fonts a moment to load + apply.
  await page.waitForTimeout(600);
  const pngPath = path.join(__dirname, 'end-card.png');
  await page.screenshot({ path: pngPath, fullPage: false });
  await browser.close();
  console.log(`png  → ${path.relative(process.cwd(), pngPath)}`);

  // Loop the still into a static MP4 — no Ken-Burns drift, per the imessage
  // molecule's "End card stays static" learning.
  const outMp4 = path.join(__dirname, 'end-card.mp4');
  execSync(
    `ffmpeg -y -loop 1 -i "${pngPath}" -t ${HOLD_SEC} -r ${FPS} ` +
    `-vf "scale=${VIEW_W}:${VIEW_H},format=yuv420p" ` +
    `-c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outMp4}"`,
    { stdio: 'pipe' }
  );
  console.log(`mp4  → ${path.relative(process.cwd(), outMp4)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
