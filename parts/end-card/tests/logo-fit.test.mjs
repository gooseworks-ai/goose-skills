// end-card 1.1.1 (and brand-layer 1.0.2, which shares the renderer): the logo is fitted to the card.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { browserMissing, browserProviderOrNull, countColor, fileRef, framePixels, hasFfmpeg, loadNewest, makeCtx, makeLogo, run, sampleBrand } from '../../_tools/kit-harness.mjs';
import { KIT_CARD_LOGO_BOXES, kitCardColorsOn, kitCardContrast, kitCardLogoBackground, kitCardLogoSize } from '../../_lib/end-card.mjs';
import { cardLayoutColorsOn } from '../src/layouts.mjs';

const { dir, mod } = await loadNewest('end-card');
const ready = (await hasFfmpeg()) && browserProviderOrNull();
const skip = !ready && (browserMissing() || 'ffmpeg is not installed');

/** A JPEG logo: a red mark on an opaque white background, as many brand kits store it. */
async function whiteBackedJpeg(path, w = 400, h = 160) {
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=white:s=${w}x${h}:d=1`, '-vf', `drawbox=x=${w / 4}:y=${h / 4}:w=${w / 2}:h=${h / 2}:color=0xe01020:t=fill`, '-frames:v', '1', '-q:v', '2', path]);
  return path;
}

/** The bounding box of the pixels near `rgb` in a frame. */
function boxOf(px, rgb, tol = 24) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  for (let i = 0, p = 0; i < px.data.length; i += 3, p++) {
    if (Math.abs(px.data[i] - rgb[0]) <= tol && Math.abs(px.data[i + 1] - rgb[1]) <= tol && Math.abs(px.data[i + 2] - rgb[2]) <= tol) {
      const x = p % px.width;
      const y = (p - x) / px.width;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

test('logo size: a wide mark fills min(640 px, 0.58 W), any other min(320 px, 0.17 H), scaled up or down', () => {
  assert.deepEqual(kitCardLogoSize(130, 53, 1080, 1920), { w: 626, h: 255 }, 'a 130x53 wordmark is drawn 626 px wide');
  assert.deepEqual(kitCardLogoSize(4000, 1000, 1080, 1920), { w: 626, h: 157 }, 'a big file is scaled down to the same box');
  assert.deepEqual(kitCardLogoSize(100, 100, 1080, 1920), { w: 320, h: 320 }, 'a square mark is 320 px tall');
  assert.deepEqual(kitCardLogoSize(100, 100, 540, 960), { w: 160, h: 160 }, 'the box scales with the card');
  assert.deepEqual(kitCardLogoSize(190, 100, 1080, 1920), { w: 608, h: 320 }, 'a mark just under 2:1 stays inside the wide box');
  const stack = kitCardLogoSize(400, 100, 1080, 1920, KIT_CARD_LOGO_BOXES.stack);
  assert.ok(stack.w >= 0.4 * 1080 && stack.w <= Math.round(0.66 * 1080));
});

test('card colour: only a logo that does not read changes the card, to the colour that reads best', () => {
  const ink = { white: 1, red: 0.181, nearWhite: 0.9 };
  assert.equal(kitCardLogoBackground(ink.red, '#ffffff', {}), null, 'a red logo reads on white');
  assert.equal(kitCardLogoBackground(ink.white, '#ffffff', { primary: '#1a1a1d', background: '#ffffff' }), '#1a1a1d', 'the brand colour with the most contrast');
  assert.equal(kitCardLogoBackground(ink.white, '#ffffff', { background: '#ffffff', primary: '#ffd400' }), '#111111', 'no brand colour reads: near-black');
  assert.equal(kitCardLogoBackground(0.005, '#111111', { background: '#111111' }), '#f5f3ee', 'a dark logo on a dark card with no light brand colour: warm white');
  assert.equal(kitCardLogoBackground(0.005, '#111111', { primary: '#ff0000' }, '#ffffff'), '#ffffff', "the logo file's own background comes first");
});

test('colours on a forced card keep only what reads on it', () => {
  const brand = { colors: { primary: '#111111', text: '#111111', background: '#ffffff' } };
  const c = kitCardColorsOn(brand, {}, '#111111');
  assert.ok(kitCardContrast(c.fg, '#111111') >= 4.5, 'the text turns light');
  assert.ok(kitCardContrast(c.ctaBg, '#111111') >= 1.5, 'the pill does not vanish into the card');
  const l = cardLayoutColorsOn(brand, { foreground: '#111111', accent: '#111111' }, '#111111');
  assert.ok(kitCardContrast(l.fg, '#111111') >= 4.5);
  assert.ok(kitCardContrast(l.accent, '#111111') >= 3);
  assert.ok(kitCardContrast(l.ctaBg, '#111111') >= 1.5);
});

test('a small 130x53 wordmark is drawn at least 560 px wide on a 1080x1920 card, and its box is on the timeline', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const brand = await sampleBrand(ctx.workDir);
  brand.logo = await fileRef(await makeLogo(join(ctx.workDir, 'small.png'), '#e01020', 130, 53), 'image');
  const out = await mod.run({ brand, width: 1080, height: 1920, seconds: 1 }, ctx);
  const red = boxOf(await framePixels(out.video.path, 0.5, 1080, 1920), [224, 16, 32]);
  assert.ok(red && red.w >= 560, `the mark is ${red && red.w} px wide`);
  const zone = out.timeline.safe_zones.find((z) => z.use === 'logo');
  assert.ok(zone, 'the logo box is declared');
  assert.ok(zone.w >= red.w, 'the box covers the whole file, its trimmed margins included');
});

test('a white-backed JPEG logo loses its background: no box behind it on a coloured card', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const brand = await sampleBrand(ctx.workDir, { background: '#f5e6c8' });
  brand.logo = await fileRef(await whiteBackedJpeg(join(ctx.workDir, 'logo.jpg')), 'image');
  const out = await mod.run({ brand, width: 540, height: 960, seconds: 1 }, ctx);
  // Only the logo's rows: the CTA pill below has white text of its own.
  const px = await framePixels(out.video.path, 0.5, 540, 960);
  const red = boxOf(px, [224, 16, 32], 30);
  const rows = rowsOf(px, { y: red.y - 20, h: red.h + 40 });
  assert.ok(countColor(rows, [224, 16, 32], 30) > 2000, 'the red mark is drawn');
  assert.ok(countColor(rows, [255, 255, 255], 6) < 40, 'no white box around it');
  assert.ok(countColor(rows, [17, 17, 17], 6) < 40, 'no dark plate either');
  assert.ok(logs.some(([, m]) => /background made transparent/.test(m)));
});

test('a white logo on a white card turns the card dark and keeps the logo white', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const brand = await sampleBrand(ctx.workDir, { logoColor: '#ffffff', background: '#ffffff' });
  brand.colors.primary = '#ffd400';
  brand.colors.text = '#ffffff';
  const out = await mod.run({ brand, width: 540, height: 960, seconds: 1 }, ctx);
  const px = await framePixels(out.video.path, 0.5);
  assert.ok(countColor(px, [17, 17, 17], 6) > 270 * 480 * 0.5, 'the card is near-black');
  assert.ok(countColor(px, [255, 255, 255], 6) > 200, 'the logo keeps its own white');
});

test('layouts fit the logo too: statement draws a small mark large and says where', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const brand = await sampleBrand(ctx.workDir);
  brand.logo = await fileRef(await makeLogo(join(ctx.workDir, 'small.png'), '#e01020', 130, 53), 'image');
  const out = await mod.run({ brand, width: 1080, height: 1920, seconds: 1, layout: 'statement', rows: ['One line.'], background: '#141414' }, ctx);
  const red = boxOf(await framePixels(out.video.path, 0.5, 1080, 1920), [224, 16, 32]);
  assert.ok(red && red.w >= 0.4 * 1080, `the mark is ${red && red.w} px wide`);
  assert.ok(out.timeline.safe_zones.some((z) => z.use === 'logo'));
});

test('brand layer 1.0.2: the appended card fits the logo and declares its box', { skip }, async () => {
  const { dir: layerDir, mod: layer } = await loadNewest('brand-layer');
  const { layerInputsFor, makeVideo } = await import('../../_tools/kit-harness.mjs');
  const { ctx } = makeCtx({ partDir: layerDir });
  const video = await fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), 2, { width: 540, height: 960 }), 'video');
  const brand = await sampleBrand(ctx.workDir);
  brand.logo = await fileRef(await makeLogo(join(ctx.workDir, 'small.png'), '#e01020', 130, 53), 'image');
  const out = await layer.run(await layerInputsFor(video, { brand, expect: { end_card: true } }), ctx);
  const zone = out.timeline.safe_zones.find((z) => z.use === 'logo');
  assert.ok(zone && zone.w >= 0.5 * 540, 'the logo box is on the timeline, at the card size');
  const red = boxOf(await framePixels(out.video.path, 3.5, 540, 960), [224, 16, 32]);
  assert.ok(red && red.w >= 280, `the mark is ${red && red.w} px wide on a 540 px card`);
});

test('the final check finds the fitted logo in the box the card declares, and not another logo', { skip }, async () => {
  const check = await loadNewest('check-layer');
  const { layerInputsFor } = await import('../../_tools/kit-harness.mjs');
  const { ctx } = makeCtx({ partDir: check.dir });
  const w = ctx.workDir;
  const brand = await sampleBrand(w);
  const font = join(dir, 'assets', 'fonts', 'Montserrat-Bold.ttf');
  const logo = join(w, 'wordmark.png');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black@0.0:s=420x140:d=1,format=rgba', '-vf', `drawtext=fontfile=${font}:text='Sample':fontsize=96:fontcolor=0xe01020:x=(w-tw)/2:y=(h-th)/2,drawbox=x=10:y=118:w=400:h=10:color=0x1a1a1d:t=fill`, '-frames:v', '1', logo]);
  brand.logo = await fileRef(logo, 'image');
  const card = await mod.run({ brand, width: 720, height: 1280, seconds: 2 }, makeCtx({ partDir: dir }).ctx);
  const body = join(w, 'body.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=720x1280:rate=30:duration=3', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', body]);
  const cut = join(w, 'cut.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', body, '-i', card.video.path, '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]', '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', cut]);
  const video = await fileRef(cut, 'video');
  const timeline = { end_card: { start_s: 3, end_s: 5 }, safe_zones: card.timeline.safe_zones };
  const verdict = async (b) => (await check.mod.run(await layerInputsFor(video, { brand: b, expect: { end_card: true, qc_flags: [] }, timeline }), ctx)).verdict.checks.find((c) => c.code === 'logo').status;
  assert.equal(await verdict(brand), 'pass');
  const other = await fileRef(await makeLogo(join(w, 'other.png'), '#20a040', 300, 300), 'image');
  assert.equal(await verdict({ ...brand, logo: other }), 'fail');
});

/** A JPEG logo: `text` in `color` on an opaque `bg` canvas w x h, the bundled font, `size` px. */
async function textJpeg(path, { text, color, bg = 'white', w = 600, h = 200, size = 110, box = null }) {
  const font = join(dir, 'assets', 'fonts', 'Montserrat-Bold.ttf');
  const plate = box ? `drawbox=x=${box.x}:y=${box.y}:w=${box.w}:h=${box.h}:color=${box.color}:t=fill,` : '';
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${bg}:s=${w}x${h}:d=1`, '-vf', `${plate}drawtext=fontfile=${font}:text='${text}':fontsize=${size}:fontcolor=${color}:x=(w-tw)/2:y=(h-th)/2`, '-frames:v', '1', '-q:v', '2', path]);
  return path;
}

/** The frame rows `zone` covers. */
function rowsOf(px, zone) {
  return { width: px.width, height: zone.h, data: px.data.subarray(zone.y * px.width * 3, (zone.y + zone.h) * px.width * 3) };
}

test('every layout that draws the logo declares its box, so the final check always matches in it', { skip }, async () => {
  for (const [layout, extra] of [['classic', {}], ['brandkit', { rows: ['One line.'] }], ['stack', {}], ['statement', { rows: ['One line.'] }]]) {
    const { ctx } = makeCtx({ partDir: dir });
    const brand = await sampleBrand(ctx.workDir);
    const out = await mod.run({ brand, width: 540, height: 960, seconds: 1, layout, ...extra }, ctx);
    const zone = (out.timeline.safe_zones || []).find((z) => z.use === 'logo');
    assert.ok(zone && zone.x >= 0 && zone.y >= 0 && zone.x + zone.w <= 540 && zone.y + zone.h <= 960, `${layout}: ${JSON.stringify(zone)}`);
  }
});

test('the letters of a white-backed wordmark keep no white inside them on a dark card', { skip }, async () => {
  for (const layout of ['classic', 'statement']) {
    const { ctx, logs } = makeCtx({ partDir: dir });
    const brand = await sampleBrand(ctx.workDir);
    brand.logo = await fileRef(await textJpeg(join(ctx.workDir, 'bodega.jpg'), { text: 'Bodega', color: '0xe01020' }), 'image');
    const extra = layout === 'statement' ? { rows: ['One line.'] } : {};
    const out = await mod.run({ brand, width: 540, height: 960, seconds: 1, layout, background: '#141414', ...extra }, ctx);
    const zone = out.timeline.safe_zones.find((z) => z.use === 'logo');
    const rows = rowsOf(await framePixels(out.video.path, 0.5, 540, 960), zone);
    assert.ok(countColor(rows, [224, 16, 32], 40) > 1500, `${layout}: the red letters are drawn`);
    assert.ok(countColor(rows, [255, 255, 255], 40) < 60, `${layout}: no white inside the letters (${countColor(rows, [255, 255, 255], 40)})`);
    assert.ok(logs.some(([, m, f]) => /background made transparent/.test(m) && f && f.inside_letters === 'cleared'));
  }
});

test('white letters on a solid red box keep their white on a dark card: the box is the mark', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const brand = await sampleBrand(ctx.workDir);
  const box = { x: 40, y: 30, w: 520, h: 140, color: '0xe01020' };
  brand.logo = await fileRef(await textJpeg(join(ctx.workDir, 'boxed.jpg'), { text: 'Bodega', color: 'white', box, size: 96 }), 'image');
  const out = await mod.run({ brand, width: 540, height: 960, seconds: 1, background: '#141414' }, ctx);
  const zone = out.timeline.safe_zones.find((z) => z.use === 'logo');
  const rows = rowsOf(await framePixels(out.video.path, 0.5, 540, 960), zone);
  assert.ok(countColor(rows, [255, 255, 255], 40) > 400, 'the white letters stay white');
});

test('a logo file with wide margins declares no box it would not match in, and the final check does not fail it', { skip }, async () => {
  const check = await loadNewest('check-layer');
  const { layerInputsFor, makeVideo } = await import('../../_tools/kit-harness.mjs');
  const { dir: layerDir, mod: layer } = await loadNewest('brand-layer');
  // A 1000x1000 white JPEG with a wordmark about 500 px wide in the middle, and an og-style 1200x630 image with a small mark.
  for (const file of [{ w: 1000, h: 1000, size: 140 }, { w: 1200, h: 630, size: 70 }]) {
    const { ctx, logs } = makeCtx({ partDir: layerDir });
    const w = ctx.workDir;
    const brand = await sampleBrand(w);
    brand.logo = await fileRef(await textJpeg(join(w, 'padded.jpg'), { text: 'Sample', color: '0xe01020', ...file }), 'image');
    const video = await fileRef(await makeVideo(join(w, 'cut.mp4'), 2, { width: 540, height: 960 }), 'video');
    const out = await layer.run(await layerInputsFor(video, { brand, expect: { end_card: true } }), ctx);
    const about = `${file.w}x${file.h}`;
    assert.ok(!(out.timeline.safe_zones || []).some((z) => z.use === 'logo'), `${about}: no logo box is declared`);
    assert.ok(logs.some(([, m]) => /wide empty margins/.test(m)), about);
    const red = boxOf(await framePixels(out.video.path, 3.5, 540, 960), [224, 16, 32], 40);
    assert.ok(red && red.w >= 0.5 * 540, `${about}: the mark is still drawn large (${red && red.w} px)`);
    const { ctx: cctx } = makeCtx({ partDir: check.dir });
    const verdict = await check.mod.run(await layerInputsFor(out.video, { brand, expect: { end_card: true, qc_flags: [] }, timeline: out.timeline }), cctx);
    const logo = verdict.verdict.checks.find((c) => c.code === 'logo');
    assert.notEqual(logo.status, 'fail', `${about}: ${JSON.stringify(logo)}`);
  }
});

test('an SVG logo with a small nominal size is drawn from its vector, so it is not called soft', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const brand = await sampleBrand(ctx.workDir);
  const svg = join(ctx.workDir, 'mark.svg');
  writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" width="130" height="53" viewBox="0 0 130 53"><rect x="0" y="0" width="130" height="53" fill="#e01020"/><rect x="40.4" y="10" width="49.2" height="33" fill="#ffffff"/></svg>');
  brand.logo = { ...(await fileRef(svg, 'image')), mime: 'image/svg+xml' };
  const out = await mod.run({ brand, width: 1080, height: 1920, seconds: 1 }, ctx);
  const px = await framePixels(out.video.path, 0.5, 1080, 1920);
  const red = boxOf(px, [224, 16, 32]);
  assert.ok(red && red.w >= 560, `the mark is ${red && red.w} px wide`);
  assert.ok(!logs.some(([, m]) => /may look soft/.test(m)), 'no soft-logo warning for a vector');
  // Sharp: the white window's left edge (off the old pixel grid) goes from red to white within a couple of pixels.
  const row = Math.round(red.y + red.h / 2);
  const edge = Math.round(red.x + (40.4 / 130) * red.w);
  let ramp = 0;
  for (let x = edge - 12; x < edge + 12; x++) {
    const i = (row * px.width + x) * 3;
    if (px.data[i + 1] > 40 && px.data[i + 1] < 215) ramp++;
  }
  assert.ok(ramp <= 2, `edge ramp ${ramp} px`);
});
