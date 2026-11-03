// screenshot.js — render a standalone HTML file to PNG via Playwright.
//
// Usage: const { screenshotHtml } = require('./screenshot.js');
//        await screenshotHtml({ html, outPath, htmlBasePath, viewport, dpr });
//
// `htmlBasePath` is the file path the HTML should be considered to live at,
// used to resolve relative URLs (images) in the page. If omitted, the HTML is
// loaded via setContent and relative URLs will fail.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

async function screenshotHtml({ html, outPath, htmlBasePath, viewport = { width: 1180, height: 2556 }, dpr = 2 }) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: dpr,
  });
  const page = await ctx.newPage();

  let cleanupTmp = null;
  if (htmlBasePath) {
    // Write HTML to disk so the browser resolves relative URLs against it.
    fs.mkdirSync(path.dirname(htmlBasePath), { recursive: true });
    fs.writeFileSync(htmlBasePath, html);
    await page.goto('file://' + htmlBasePath, { waitUntil: 'networkidle' });
  } else {
    // Fall back to setContent (relative URLs in HTML will fail).
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apple-notes-'));
    const tmpHtml = path.join(tmpDir, 'index.html');
    fs.writeFileSync(tmpHtml, html);
    cleanupTmp = tmpDir;
    await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(300);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await page.screenshot({ path: outPath, fullPage: false });
  await browser.close();
  if (cleanupTmp) {
    try { fs.rmSync(cleanupTmp, { recursive: true, force: true }); } catch {}
  }
}

module.exports = { screenshotHtml };
