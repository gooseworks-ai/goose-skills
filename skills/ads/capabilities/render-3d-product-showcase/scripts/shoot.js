#!/usr/bin/env node
/*
 * Deterministic HTML -> PNG screenshot for the end-card hyperframe.
 *   node shoot.js <file-url> <out.png> <width> <height> [waitMs]
 *
 * Uses Playwright's Chromium. If the resolvable Playwright package wants a
 * browser build that isn't installed (a common npx-version skew), set
 * PW_CHROME to an installed Chromium binary and this launches that instead —
 * so the end card never fails on a browser-version mismatch.
 */
const { chromium } = require('playwright');

(async () => {
  const [url, out, w, h, waitMs] = process.argv.slice(2);
  const launchOpts = process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {};
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage({
    viewport: { width: +w, height: +h },
    deviceScaleFactor: 1,
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  try { await page.evaluate(() => document.fonts.ready); } catch (e) { /* fonts optional */ }
  await page.waitForTimeout(+waitMs || 1500);
  await page.screenshot({ path: out });
  await browser.close();
  console.log('shot', out);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
