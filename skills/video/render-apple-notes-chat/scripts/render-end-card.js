#!/usr/bin/env node
// render-end-card.js — the checklist end card: the note's picks as ticked rows,
// real product photos, the brand logo and CTA, in the brand's colours and fonts.
//
// usage: node render-end-card.js --config config.json --out-dir <work> [--still-only]
//   config.end_card = { head1, head2, underline, rows:[{label,value}], products:[{src,h,wide}],
//                       logo | wordmark, cta, fine_print, theme:{bg,bg2,paper,ink,accent,label},
//                       fonts:{heading,label}, seconds }
// writes: <work>/endcard.png (+ <work>/endcard.mp4, `seconds` long @30fps)

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
function toData(p, base) {
  if (!p || /^(data:|https?:)/.test(p)) return p;
  const abs = path.resolve(base, p);
  const mime = MIME[path.extname(abs).toLowerCase()] || 'image/png';
  return `data:${mime};base64,${fs.readFileSync(abs).toString('base64')}`;
}

(async () => {
  const cfgPath = arg('--config');
  const outArg = arg('--out-dir');
  if (!cfgPath || !outArg) {
    console.error('usage: node render-end-card.js --config config.json --out-dir <work> [--still-only]');
    process.exit(2);
  }
  const base = path.dirname(path.resolve(cfgPath));
  const outDir = path.resolve(outArg);
  const stillOnly = process.argv.includes('--still-only');
  const cfg = JSON.parse(fs.readFileSync(path.resolve(cfgPath), 'utf8')).end_card;
  if (!cfg || !cfg.head2 || !Array.isArray(cfg.rows) || !cfg.rows.length) {
    console.error('config.end_card needs head2 and at least one row');
    process.exit(1);
  }
  if (!cfg.logo && !cfg.wordmark) {
    console.error('config.end_card needs a logo file (preferred) or a wordmark');
    process.exit(1);
  }
  if (cfg.rows.length > 4) console.warn('warning: more than 4 rows will run into the logo; keep it to 4');
  cfg.logo = toData(cfg.logo, base);
  cfg.products = (cfg.products || []).map(p => ({ ...p, src: toData(p.src, base) }));

  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1080, height: 1920 } })).newPage();
  await page.goto('file://' + path.join(__dirname, 'end-card.template.html'), { waitUntil: 'load' });
  await page.evaluate(c => window.setup(c), cfg);
  await page.waitForLoadState('networkidle');
  const fontsOk = await page.evaluate(async () => {
    await document.fonts.ready;
    const want = [getComputedStyle(document.documentElement).getPropertyValue('--head-font'),
                  getComputedStyle(document.documentElement).getPropertyValue('--label-font')];
    return want.map(f => f.split(',')[0].trim()).filter(f => !document.fonts.check(`40px ${f}`));
  });
  if (fontsOk.length) {
    console.error(`fonts did not load: ${fontsOk.join(', ')}. Use a Google Fonts family name, or check the network.`);
    await browser.close();
    process.exit(1);
  }
  await page.evaluate(() => window.setT(10));
  fs.mkdirSync(outDir, { recursive: true });
  await page.screenshot({ path: path.join(outDir, 'endcard.png') });
  if (!stillOnly) {
    const fd = path.join(outDir, 'ec_frames');
    fs.rmSync(fd, { recursive: true, force: true });
    fs.mkdirSync(fd);
    const N = Math.round((cfg.seconds || 4.2) * 30);
    for (let i = 0; i < N; i++) {
      await page.evaluate(t => window.setT(t), i / 30);
      await page.screenshot({ path: path.join(fd, `e${String(i).padStart(4, '0')}.png`) });
    }
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '30', '-i', path.join(fd, 'e%04d.png'),
      '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', path.join(outDir, 'endcard.mp4')]);
  }
  await browser.close();
  console.log(JSON.stringify({ still: path.join(outDir, 'endcard.png'), video: stillOnly ? null : path.join(outDir, 'endcard.mp4') }));
})().catch(e => { console.error(e); process.exit(1); });
