// QA-60: the newest chat row (the punchline) and any sheet must stay out of the
// TikTok/Reels bottom (400 px) and right (140 px) control bands at 1080×1920.
// Run: node --test tests/test_safe_area.js (Playwright Chromium; local fixture, no network or paid API).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { chromium } = require('node:module').createRequire(require.resolve('../scripts/record-chat'))('playwright');
const { buildDocument, checkLayout, record, phoneLayout, resolveSafeArea, PHONE, FPS } = require('../scripts/record-chat');

const FIXTURE = path.join(__dirname, 'fixtures', 'long-group-thread.json');
const CHECK_RENDER = path.join(__dirname, '..', 'scripts', 'check-render.py');
const LEGACY_ZOOM = Math.min(1080 / 514, 1920 / 914);
const fixture = (extra = {}) => ({ ...JSON.parse(fs.readFileSync(FIXTURE, 'utf8')), ...extra });
const newestId = cfg => cfg.thread.messages.filter(m => m.type === 'text').at(-1).id;

async function withPage(doc, fn) {
  const browser = await chromium.launch({ timeout: 15000 });
  try {
    const page = await browser.newPage({ viewport: { width: doc.width, height: doc.height }, deviceScaleFactor: 1 });
    await page.setContent(doc.html);
    return await fn(page);
  } finally { await browser.close(); }
}

test('the long-thread fixture is a 15+ message group thread ending on a wrapped punchline', () => {
  const cfg = fixture();
  assert.equal(cfg.thread.mode, 'group');
  assert.ok(cfg.thread.messages.filter(m => m.type === 'text').length >= 15);
  assert.ok(cfg.thread.messages.some(m => m.type === 'typing'));
  assert.ok(cfg.thread.messages.at(-1).text.length > 80);
});

test('safe_area defaults on for 9:16 canvases and off for other shapes', () => {
  assert.deepEqual(resolveSafeArea(undefined, 1080, 1920), { top: 220, bottom: 400, right: 140, left: 0 });
  assert.deepEqual(resolveSafeArea(true, 720, 1280), { top: 220 * 1280 / 1920, bottom: 400 * 1280 / 1920, right: 140 * 720 / 1080, left: 0 });
  assert.equal(resolveSafeArea(undefined, 750, 1624), null);
  assert.equal(resolveSafeArea(false, 1080, 1920), null);
  assert.deepEqual(resolveSafeArea({ bottom: 600 }, 1080, 1920), { top: 220, bottom: 600, right: 140, left: 0 });
  for (const bad of ['yes', [400], { middle: 3 }, { bottom: -1 }, { top: 1000, bottom: 1000 }])
    assert.throws(() => resolveSafeArea(bad, 1080, 1920), /safe_area/);
});

test('the default 1080x1920 layout is the largest safe phone that sits in the middle of the canvas', () => {
  const doc = buildDocument(fixture(), path.dirname(FIXTURE));
  const L = doc.layout;
  assert.deepEqual(L.zone, { left: 0, top: 220, right: 940, bottom: 1520 });
  assert.ok(L.zoom < LEGACY_ZOOM && L.zoom > 1.6 && L.zoom < 1.7, `zoom ${L.zoom}`);
  // Brightland clean run, 2026-10-07: the largest safe phone sat 16 px from the
  // top with 272 px under it, and read as a layout mistake.
  const above = L.top, below = 1920 - (L.top + PHONE.height * L.zoom);
  assert.ok(Math.abs(above - below) < 1, `phone must be vertically centred: ${above} above, ${below} below`);
  assert.ok(Math.abs(L.left - (1080 - (L.left + PHONE.width * L.zoom))) < 1, 'phone must be horizontally centred');
  assert.ok(L.top >= 16 && L.top + PHONE.height * L.zoom <= 1920 - 16);
  assert.ok(L.left >= 16 && L.left + PHONE.width * L.zoom <= 1080 - 16);
  assert.ok(L.top + PHONE.keep.bottom * L.zoom < 1520, 'conversation bottom must sit above the bottom band');
  assert.ok(L.left + PHONE.keep.right * L.zoom < 940, 'conversation right must sit left of the right band');
  assert.ok(doc.html.includes('body.framed .iphone-frame { position:absolute'));
});

test('phone_fit "largest" keeps the bigger phone pushed up against the top margin', () => {
  const dir = path.dirname(FIXTURE);
  const L = buildDocument(fixture({ phone_fit: 'largest' }), dir).layout;
  assert.ok(L.zoom > buildDocument(fixture(), dir).layout.zoom, `zoom ${L.zoom}`);
  assert.equal(L.top, 16);
  assert.ok(L.top + PHONE.keep.bottom * L.zoom < 1520, 'conversation bottom must sit above the bottom band');
  assert.throws(() => buildDocument(fixture({ phone_fit: 'top' }), dir), /phone_fit/);
});

test('an explicit zoom is a ceiling with safe_area on and exact with safe_area off', () => {
  const dir = path.dirname(FIXTURE), safeMax = buildDocument(fixture(), dir).layout.maxZoom;
  const small = buildDocument(fixture({ zoom: 1.5 }), dir).layout;
  assert.equal(small.zoom, 1.5); assert.equal(small.lowered, null);
  assert.ok(small.top + PHONE.keep.bottom * 1.5 < 1520);
  const recipe = buildDocument(fixture({ zoom: 2.1 }), dir).layout; // create-imessage recipe seed
  assert.equal(recipe.zoom, safeMax); assert.equal(recipe.lowered, 2.1);
  const exact = buildDocument(fixture({ zoom: 2.1, safe_area: false }), dir).layout;
  assert.equal(exact.zoom, 2.1); assert.equal(exact.zone, null);
  assert.throws(() => buildDocument(fixture({ zoom: 8 }), dir), /does not fit/);
  assert.equal(phoneLayout(750, 1624, undefined, null).zoom, Math.min(750 / 514, 1624 / 914));
});

test('every frame keeps the newest row inside the safe zone; final punchline above y 1520 and left of x 940', async () => {
  const cfg = fixture(), doc = buildDocument(cfg, path.dirname(FIXTURE));
  await withPage(doc, async page => {
    // Drift guard: PHONE.keep must match the real conversation viewport.
    const view = await page.evaluate(() => {
      const f = document.querySelector('.iphone-frame').getBoundingClientRect(), c = document.querySelector('.conversation').getBoundingClientRect();
      const s = f.height / 852;
      return { left: (c.left - f.left) / s, top: (c.top - f.top) / s, right: (c.left - f.left + c.width) / s, bottom: (c.top - f.top + c.height) / s };
    });
    for (const k of ['left', 'right', 'bottom']) assert.ok(Math.abs(view[k] - PHONE.keep[k]) < 0.6, `conversation ${k} ${view[k]} != ${PHONE.keep[k]}`);
    assert.ok(view.top >= PHONE.keep.top - 0.5);
    let worst = { bottom: 0, right: 0 }, frames = Math.round(doc.total * FPS);
    for (let frame = 0; frame <= frames; frame++) {
      const report = await page.evaluate(t => { window.__renderAt(t); return window.__safeAreaReport(); }, Math.min(frame / FPS, doc.total));
      assert.deepEqual(report.violations, [], `frame ${frame}`);
      for (const b of report.boxes) { worst.bottom = Math.max(worst.bottom, b.bottom); worst.right = Math.max(worst.right, b.right); }
    }
    assert.ok(worst.bottom < 1520 && worst.right < 940, JSON.stringify(worst));
    const final = await page.evaluate(t => { window.__renderAt(t); return window.__safeAreaReport(); }, doc.total);
    const newest = final.boxes.find(b => b.kind === 'newest');
    assert.equal(newest.id, newestId(cfg));
    assert.ok(newest.bottom < 1520, `newest bottom ${newest.bottom}`);
    assert.ok(newest.right < 940, `newest right ${newest.right}`);
    assert.ok(newest.top >= 220, `newest top ${newest.top}`);
    assert.deepEqual(await checkLayout(page), []);
  });
});

test('sheets and dialogs are checked too (a bottom sheet in the control band fails)', async () => {
  const doc = buildDocument(fixture(), path.dirname(FIXTURE));
  await withPage(doc, async page => {
    await page.evaluate(t => window.__renderAt(t), doc.total);
    const place = where => page.evaluate(where => {
      document.querySelector('[data-safe-keep]')?.remove();
      const sheet = document.createElement('div');
      sheet.dataset.safeKeep = 'permission-sheet';
      sheet.style.cssText = `position:absolute;left:12px;right:12px;height:120px;${where};background:#333`;
      document.querySelector('.screen').append(sheet);
      return window.__safeAreaReport();
    }, where);
    const low = await place('bottom:8px');
    assert.equal(low.violations.length, 1);
    assert.equal(low.violations[0].kind, 'sheet');
    assert.ok((await checkLayout(page)).some(e => /permission-sheet/.test(e)));
    const mid = await place('top:360px');
    assert.ok(mid.boxes.some(b => b.kind === 'sheet'));
    assert.deepEqual(mid.violations, []);
  });
});

test('safe_area:false keeps the legacy full-canvas phone (the QA-60 defect, now opt-in)', async () => {
  const cfg = fixture({ safe_area: false }), doc = buildDocument(cfg, path.dirname(FIXTURE));
  assert.equal(doc.layout.zoom, LEGACY_ZOOM);
  assert.ok(!doc.html.includes('body.framed .iphone-frame { position:absolute'));
  await withPage(doc, async page => {
    const report = await page.evaluate(t => { window.__renderAt(t); return window.__safeAreaReport(); }, doc.total);
    const phone = await page.evaluate(() => document.querySelector('.iphone-frame').getBoundingClientRect().toJSON());
    assert.ok(Math.abs(phone.top - (1920 - 852 * LEGACY_ZOOM) / 2) < 0.6, `legacy centred phone top ${phone.top}`);
    assert.equal(report.enabled, false);
    assert.deepEqual(report.violations, []);
    const newest = report.boxes.find(b => b.kind === 'newest');
    assert.equal(newest.id, newestId(cfg));
    assert.ok(newest.bottom > 1520, 'legacy layout puts the punchline in the bottom band');
  });
});

test('the recorder writes a safe-area report that check-render.py verifies and rejects when tampered', async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'imessage-safe-'));
  try {
    await record(FIXTURE, out, true);
    const sidecar = path.join(out, 'master-chat.safe-area.json');
    const report = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
    assert.equal(report.enabled, true);
    assert.ok(report.extent.newest.bottom < 1520 && report.extent.newest.right < 940);
    const check = file => spawnSync('python3', [CHECK_RENDER, '--safe-area', file], { encoding: 'utf8' });
    const ok = check(sidecar);
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /Checked safe area/);
    report.final.boxes[0].bottom = 1600;
    const bad = path.join(out, 'tampered.safe-area.json');
    fs.writeFileSync(bad, JSON.stringify(report));
    const failed = check(bad);
    assert.notEqual(failed.status, 0);
    assert.match(failed.stderr, /leaves the safe zone/);
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
});
