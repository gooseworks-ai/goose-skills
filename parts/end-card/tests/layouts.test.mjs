// end-card 1.1.0: layouts, rows, layout none (no outputs) and refusals.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { browserMissing, browserProviderOrNull, countColor, framePixels, hasFfmpeg, loadNewest, makeCtx, probe, sampleBrand } from '../../_tools/kit-harness.mjs';
import { cardContrast, cardLayoutColors, cardLayoutCopy, cardLayoutHtml, cardRows } from '../src/layouts.mjs';

const { dir, mod } = await loadNewest('end-card');
const ready = (await hasFfmpeg()) && browserProviderOrNull();
const skip = !ready && (browserMissing() || 'ffmpeg is not installed');
const plainBrand = { name: 'Sample Goods', colors: { primary: '#1a1a1d', text: '#1a1a1d' }, fonts: {}, pronunciations: [], cta: { text: 'Shop now', url: 'samplegoods.example' } };

test('rows come from a list or a " | "-joined answer, trimmed, empty ones dropped', () => {
  assert.deepEqual(cardRows("Don't be scared. | It's just water."), ["Don't be scared.", "It's just water."]);
  assert.deepEqual(cardRows(['  One ', '', 'Two']), ['One', 'Two']);
  assert.deepEqual(cardRows(' | '), []);
  assert.deepEqual(cardRows(undefined), []);
});

test('the 1.1.0 colours never use a brand text colour that does not read on the card', () => {
  const dark = cardLayoutColors(plainBrand, { background: '#141414' });
  assert.equal(dark.fg, '#ffffff', 'dark brand text on a dark card falls back to white');
  assert.ok(cardContrast(dark.accent, '#141414') >= 3, 'the accent reads on the card');
  const light = cardLayoutColors(plainBrand, {});
  assert.equal(light.fg, '#1a1a1d', 'the brand text colour is kept when it reads');
  assert.equal(cardLayoutColors(plainBrand, { background: '#141414', foreground: '#f3ead3', accent: '#e8b547' }).accent, '#e8b547');
});

test('editorial and statement need no call to action; classic-only copy is refused elsewhere', () => {
  const noCta = { ...plainBrand, cta: undefined };
  assert.equal(cardLayoutCopy('editorial', noCta, { headline: 'Made slowly.' }).cta, '');
  assert.equal(cardLayoutCopy('statement', noCta, { rows: 'One | Two' }).cta, '');
  assert.match(cardLayoutCopy('brandkit', noCta, {}).message, /call to action/);
  assert.match(cardLayoutCopy('brandkit', plainBrand, { proof: { stars: 5, text: 'x' } }).message, /does not draw proof/);
  assert.match(cardLayoutCopy('stack', plainBrand, { rows: ['x'] }).message, /does not draw rows/);
  assert.match(cardLayoutCopy('statement', plainBrand, { rows: 'a | b | c | d' }).message, /at most 3 rows/);
  assert.match(cardLayoutCopy('statement', plainBrand, {}).message, /needs 1 to 3 rows/);
  assert.match(cardLayoutCopy('statement', plainBrand, { rows: ['a'], headline: 'b' }).message, /headline as the first row/);
  assert.deepEqual(cardLayoutCopy('statement', plainBrand, { headline: 'Only line.' }).rows, ['Only line.']);
  assert.equal(cardLayoutCopy('statement', plainBrand, { rows: ['a'] }).url, '', 'statement shows no URL unless asked');
});

test('the pages draw what each layout promises', () => {
  const page = (layout, card = {}) => cardLayoutHtml({ layout, brand: plainBrand, card, width: 540, height: 960, logoUri: 'data:image/png;base64,AA==' });
  const editorial = page('editorial', { headline: 'Made slowly.' });
  assert.ok(!editorial.includes('<img'), 'editorial draws no logo even when given one');
  assert.ok(!editorial.includes('cta-pill'), 'editorial draws no CTA pill');
  assert.ok(editorial.includes('samplegoods.example'));
  const brandkit = page('brandkit', { headline: 'Tagline', rows: ['A row'] });
  for (const piece of ['<img', 'class="name"', 'class="rule"', 'Tagline', 'A row', 'cta-pill', 'Shop now']) assert.ok(brandkit.includes(piece), piece);
  const stack = page('stack');
  assert.ok(stack.includes('<img') && stack.includes('samplegoods.example') && !stack.includes('Shop now'));
  const statement = page('statement', { rows: 'First & best | Second' });
  assert.ok(statement.includes('First &amp; best') && statement.includes('class="row r1"'));
  assert.ok(!statement.includes('samplegoods.example') && !statement.includes('Shop now'));
});

test('layout none returns no outputs and makes no file, even with no browser', async () => {
  const { ctx, logs } = makeCtx({ partDir: dir, browser: null });
  const out = await mod.run({ brand: plainBrand, width: 540, height: 960, layout: 'none', seconds: 3.5 }, ctx);
  assert.deepEqual(out, {});
  assert.deepEqual(readdirSync(ctx.workDir).filter((f) => f !== 'tmp'), []);
  assert.ok(logs.some(([, m]) => /layout none/.test(m)));
});

test('refuses an unknown layout, copy a layout does not draw, too many rows and a statement with no rows', async () => {
  const { ctx } = makeCtx({ partDir: dir, browser: null });
  const base = { brand: plainBrand, width: 540, height: 960 };
  const refused = (inputs) => assert.rejects(mod.run({ ...base, ...inputs }, ctx), (e) => e.code === 'bad_input', JSON.stringify(inputs));
  await refused({ layout: 'poster' });
  await refused({ layout: 'classic', rows: ['a'] });
  await refused({ rows: 'a | b' });
  await refused({ layout: 'brandkit', benefits: [{ label: 'Free shipping' }] });
  await refused({ layout: 'stack', headline: 'x' });
  await refused({ layout: 'statement', rows: ['a', 'b', 'c', 'd'] });
  await refused({ layout: 'statement', rows: 'a | b | c | d' });
  await refused({ layout: 'statement', rows: ['x'.repeat(61)] });
  await refused({ layout: 'statement' });
  await refused({ layout: 'brandkit', brand: { ...plainBrand, cta: undefined } });
});

for (const [layout, card] of [
  ['brandkit', { headline: 'Tagline here' }],
  ['editorial', { headline: 'Made slowly.', rows: 'Line one | Line two' }],
  ['stack', {}],
  ['statement', { rows: "DON'T BE SCARED. | IT'S JUST WATER.", background: '#141414' }],
]) {
  test(`${layout}: a clip at the size asked with a silent track and timeline.end_card`, { skip }, async () => {
    const { ctx } = makeCtx({ partDir: dir });
    const brand = await sampleBrand(ctx.workDir);
    const out = await mod.run({ brand, width: 540, height: 960, seconds: 2, layout, ...card }, ctx);
    const info = await probe(out.video.path);
    assert.deepEqual([info.width, info.height, info.has_audio], [540, 960, true]);
    assert.ok(Math.abs(info.duration_s - 2) < 0.1);
    assert.deepEqual(out.timeline.end_card, { start_s: 0, end_s: 2 });
    const px = await framePixels(out.video.path, 1);
    const red = countColor(px, [224, 16, 32], 24);
    if (layout === 'editorial') assert.ok(red < 20, 'editorial draws no logo');
    else assert.ok(red > 200, 'the red logo is drawn in its own colour');
    if (layout === 'statement') assert.ok(countColor(px, [255, 255, 255], 12) > 100, 'the first row reads as white on the dark card, not the brand dark text');
    if (layout === 'brandkit') assert.ok(countColor(px, [26, 26, 29], 10) > 500, 'the CTA pill is drawn in the brand primary');
  });
}

test('statement: a logo that does not contrast with the dark card sits on a plate, never recoloured', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const brand = await sampleBrand(ctx.workDir, { logoColor: '#202020' });
  const out = await mod.run({ brand, width: 540, height: 960, seconds: 1, layout: 'statement', rows: ['One line.'], background: '#141414' }, ctx);
  const px = await framePixels(out.video.path, 0.5);
  assert.ok(countColor(px, [255, 255, 255], 6) > 500, 'a light plate is drawn behind the dark logo');
  assert.ok(countColor(px, [32, 32, 32], 4) > 200, 'the logo keeps its own dark colour');
});
