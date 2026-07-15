// capture.js — deterministic frame-step of index.html via headless Chromium.
// Drives window.seek(tMs) and screenshots each frame. Free/deterministic (no paid calls).
//
// Usage: node capture.js --html index.html --out frames --fps 30 --duration 18000 \
//          [--exe /path/to/Chromium] [--width 1080] [--height 1920]
//
// Chromium: pass --exe, or it auto-discovers the newest cached Playwright chromium
// (~/Library/Caches/ms-playwright/chromium-*/chrome-mac/Chromium.app/.../Chromium on macOS).
const { chromium } = require('playwright-core');
const path = require('path'); const fs = require('fs'); const os = require('os');

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : def; }

function findChromium() {
  const explicit = arg('exe'); if (explicit) return explicit;
  const roots = [path.join(os.homedir(), 'Library/Caches/ms-playwright'), path.join(os.homedir(), '.cache/ms-playwright')];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    // prefer the full browser (chromium-<n>) over chromium_headless_shell-<n>
    const dirs = fs.readdirSync(root).filter(d => /^chromium-\d/.test(d)).sort().reverse();
    for (const d of dirs) {
      for (const rel of ['chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-linux/chrome', 'chrome-win/chrome.exe']) {
        const p = path.join(root, d, rel); if (fs.existsSync(p)) return p;
      }
    }
  }
  throw new Error('No Chromium found — pass --exe or `npx playwright install chromium`');
}

(async () => {
  const HTML = 'file://' + path.resolve(arg('html', 'index.html'));
  const OUT = path.resolve(arg('out', 'frames'));
  const FPS = parseInt(arg('fps', '30'), 10);
  const DUR = parseInt(arg('duration', '18000'), 10);
  const W = parseInt(arg('width', '1080'), 10), Hh = parseInt(arg('height', '1920'), 10);
  const TOTAL = Math.round(DUR / 1000 * FPS);
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: findChromium(), args: ['--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: W, height: Hh }, deviceScaleFactor: 1 });
  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.seek === 'function');
  await page.waitForTimeout(700);
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await page.waitForTimeout(200);
  for (let i = 0; i < TOTAL; i++) {
    await page.evaluate(t => window.seek(t), (i / FPS) * 1000);
    await page.screenshot({ path: path.join(OUT, 'f' + String(i).padStart(4, '0') + '.png'), clip: { x: 0, y: 0, width: W, height: Hh } });
  }
  await browser.close();
  console.log('captured', TOTAL, 'frames ->', OUT);
})();
