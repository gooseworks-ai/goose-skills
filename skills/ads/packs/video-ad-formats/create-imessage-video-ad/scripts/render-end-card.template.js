#!/usr/bin/env node
/**
 * render-end-card.template.js — render end-card.html to a static PNG then
 * ffmpeg-convert to a 3.5s MP4. Handles two injection patterns:
 *
 *   {{BRAND_LOGO_SVG}}  — replaced with the contents of assets/<brand>-logo.svg
 *                         (XML prolog/doctype stripped). REQUIRED.
 *   {{HERO_IMG_DATA}}   — replaced with a data: URL of assets/<hero>.png if
 *                         the end-card uses a background or hero photo
 *                         (end-card-photo-bg.template.html). OPTIONAL.
 *
 * Adapt the LOGO_PATH and HERO_PATH constants below for your ad. No Ken-Burns
 * on the MP4 output — the brand slate should land hard.
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

// Adjust these for your ad. LOGO_PATH must exist; HERO_PATH is optional.
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'brand-logo.svg');
const HERO_PATH = path.join(__dirname, '..', 'assets', 'hero.png'); // optional

function readLogoSvg(p) {
  if (!fs.existsSync(p)) {
    throw new Error(`Missing brand logo SVG at ${p}. Drop the real wordmark there (Wikimedia / brandfetch).`);
  }
  let svg = fs.readFileSync(p, 'utf-8');
  // Strip XML prolog + doctype so the SVG can be inlined directly.
  return svg.replace(/<\?xml[\s\S]*?\?>/, '').replace(/<!DOCTYPE[\s\S]*?>/, '').trim();
}

function readImageDataUrl(p) {
  if (!fs.existsSync(p)) return null;
  const buf = fs.readFileSync(p);
  const ext = path.extname(p).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  return `data:${mime};base64,${buf.toString('base64')}`;
}

(async () => {
  const html = fs.readFileSync(path.join(__dirname, 'end-card.html'), 'utf-8');

  const logoSvg = readLogoSvg(LOGO_PATH);
  let inlinedHtml = html.replace('<!--{{BRAND_LOGO_SVG}}-->', logoSvg);

  const heroDataUrl = readImageDataUrl(HERO_PATH);
  if (heroDataUrl) {
    inlinedHtml = inlinedHtml.replace('<!--{{HERO_IMG_DATA}}-->', heroDataUrl);
  }

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(inlinedHtml, { waitUntil: 'load' });
  await page.waitForTimeout(150);
  const outPng = path.join(__dirname, 'end-card.png');
  await page.screenshot({ path: outPng });
  await browser.close();
  console.log('  png  →', path.relative(process.cwd(), outPng));

  // Static still — no Ken-Burns. The brand slate should land hard, not drift.
  const outMp4 = path.join(__dirname, 'scene-09-endcard.mp4');
  execSync(
    `ffmpeg -y -loop 1 -i "${outPng}" -t 3.5 -r 30 ` +
    `-vf "scale=720:1280,format=yuv420p" ` +
    `-c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outMp4}"`,
    { stdio: 'pipe' }
  );
  console.log('  mp4  →', path.relative(process.cwd(), outMp4));
})();
