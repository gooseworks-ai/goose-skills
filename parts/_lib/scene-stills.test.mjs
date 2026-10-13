import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, makeCtx, probe, run, PARTS_ROOT } from '../_tools/kit-harness.mjs';
import {
  KIT_STILL_DEFAULT_ANCHOR,
  kitStillAnchorMembers,
  kitStillAnchorPrompt,
  kitStillCastFiles,
  kitStillJobs,
  kitStillOutputs,
  kitStillPrompt,
  kitStillRefs,
  kitStillStrip,
  kitStillTemplate,
  kitStillWantsStrip,
  kitStillBordersIn,
  kitStillTrimBoxIn,
  kitStillTrimReference,
  kitStillWithoutBorders,
  kitStillFillBox,
} from './scene-stills.mjs';

const f = (name) => ({ kind: 'file', path: `/x/${name}.png`, sha256: name.padEnd(64, '0').slice(0, 64).replace(/[^a-f0-9]/g, 'a'), bytes: 1, media: 'image', mime: 'image/png' });
const maya = { key: 'a', name: 'Maya', look: 'curly hair', image: f('a1') };
const theo = { key: 'b', name: 'Theo', look: 'grey beard' };
const cast = [maya, theo, { key: 'c', name: 'Ines', look: 'red coat' }, { key: 'd', name: 'Dov', look: 'tall' }];
const products = [{ id: 'mist', name: 'Morning Mist Green Tea', images: [f('b1'), f('b2')] }];
const tpl = kitStillTemplate({ version: 1, scene: '{picture}', negative: 'text' });

test('the template gets the default anchor text only when it has none', () => {
  assert.equal(kitStillTemplate(null).anchor, KIT_STILL_DEFAULT_ANCHOR);
  assert.equal(kitStillTemplate({ version: 1, anchor: 'x {look}' }).anchor, 'x {look}');
  assert.match(kitStillAnchorPrompt(null, theo, {}), /^grey beard\. One character alone/);
  assert.throws(() => kitStillAnchorPrompt(null, { key: 'z', name: 'Zed', look: '' }), /cast z needs \{look\}/);
});

test('jobs: picked scenes, prompts filled, a strip only for more than one named member', () => {
  const scenes = [
    { id: 's1', line: null, picture: 'Maya alone', speaker: 'a' },
    { id: 's2', line: 'Theo and Maya and Ines and Dov wave', picture: 'the four friends' },
    { id: 's3', line: null, picture: null },
  ];
  const jobs = kitStillJobs(tpl, scenes, { cast, products, skip_last: 1 });
  assert.deepEqual(jobs.map((j) => [j.id, j.index, j.strip, j.cast.map((m) => m.key)]), [
    ['s1', 0, false, ['a']],
    ['s2', 1, true, ['a', 'b', 'c', 'd']],
  ]);
  assert.equal(jobs[0].prompt, 'Maya alone');
  assert.equal(jobs[0].negative, 'text');
  const list = kitStillJobs(tpl, scenes, { cast, products, skip_last: 1, multi_ref: 'list' });
  assert.deepEqual(list[1].cast.map((m) => m.key), ['a', 'b', 'c'], 'a list stops at 3 members');
  assert.equal(list[1].strip, false);
  assert.deepEqual(kitStillAnchorMembers(jobs).map((m) => m.key), ['a', 'b', 'c', 'd']);
});

test('jobs refuse a gap, a bad pick and two scenes with one id', () => {
  assert.throws(() => kitStillJobs(tpl, [{ id: 's1', picture: null }]), /scene s1 needs \{picture\}/);
  assert.throws(() => kitStillJobs(tpl, [{ id: 's1', picture: 'x' }], { pick: 'some' }), /pick must be/);
  assert.throws(() => kitStillJobs(tpl, [{ id: 's1', picture: 'x' }, { id: 's1', picture: 'y' }]), /two scenes have the id s1/);
});

test('cast files and the strip decision follow which members have a picture', () => {
  const [, job] = kitStillJobs(tpl, [{ id: 's1', picture: 'x', speaker: 'a' }, { id: 's2', picture: 'Maya and Theo' }], { cast });
  const onlyMaya = kitStillCastFiles(job, new Map([['a', maya.image]]));
  assert.deepEqual(onlyMaya.map((c) => c.key), ['a']);
  assert.equal(kitStillWantsStrip(job, onlyMaya), false, 'one picture is sent as is');
  const both = kitStillCastFiles(job, new Map([['a', maya.image], ['b', f('c1')]]));
  assert.equal(kitStillWantsStrip(job, both), true);
});

test('references: cast, products, scene picture, first still, style refs; the tail always fits', () => {
  const scene = { id: 's1', picture: 'Maya with the Morning Mist Green Tea', image: f('d1') };
  const [job] = kitStillJobs(tpl, [scene], { cast, products });
  const style = [f('e1'), f('e2')];
  const first = f('f1');
  const strip = f('99');
  const refs = kitStillRefs(job, { cast: [{ key: 'strip', file: strip, strip: ['Maya', 'Theo'] }], first, style_refs: style });
  assert.deepEqual(refs.files.map((x) => x.sha256), [strip, products[0].images[0], scene.image, first, ...style].map((x) => x.sha256));
  assert.equal(refs.strip_at, 1);
  assert.deepEqual(refs.names, ['Maya', 'Theo']);
  const tight = kitStillRefs(job, { cast: [{ key: 'a', file: maya.image }], first, style_refs: style, max: 4 });
  assert.deepEqual(tight.files.map((x) => x.sha256), [maya.image, first, ...style].map((x) => x.sha256), 'the product photo and scene picture give way to the first still and style refs');
  assert.equal(tight.strip_at, null);
});

test('the prompt says where the strip is and folds the negative in', () => {
  const job = { prompt: 'Maya and Theo cook', negative: 'text, watermark' };
  assert.equal(kitStillPrompt(job, {}), 'Maya and Theo cook. Avoid: text, watermark');
  const text = kitStillPrompt(job, { strip_at: 2, names: ['Maya', 'Theo'] });
  assert.match(text, /^Maya and Theo cook\. Reference image 2 shows the characters side by side \(Maya, Theo\)/);
  assert.match(text, /one seamless continuous background, no panels, no dividing lines, no split screen\. Avoid: text, watermark$/);
});

test('outputs are keyed by scene id and member key; scenes without a still pass through', () => {
  const scenes = [{ id: 's1', picture: 'Maya', speaker: 'a', image_asset_id: 'x' }, { id: 's2', picture: 'Theo' }, { id: 's3', line: null }];
  const jobs = kitStillJobs(tpl, scenes, { cast, pick: 'with_picture' });
  const stills = new Map([['s1', f('11')], ['s2', f('12')]]);
  const anchors = new Map([['a', maya.image], ['b', f('13')]]);
  const out = kitStillOutputs({ scenes, cast, jobs, stills, anchors });
  assert.deepEqual(out.images.map((i) => [i.id, i.image.sha256]), [['s1', f('11').sha256], ['s2', f('12').sha256]]);
  assert.equal(out.scenes[0].image_asset_id, 'x');
  assert.equal(out.scenes[0].image.sha256, f('11').sha256);
  assert.equal(out.scenes[2].image, undefined);
  assert.deepEqual(out.cast.map((m) => (m.image ? m.image.sha256 : null)), [maya.image.sha256, f('13').sha256, null, null]);
  assert.deepEqual(out.anchors.map((a) => a.id), ['a', 'b']);
});

test('the strip tiles pictures of any shape at one height, side by side', { skip: !(await hasFfmpeg()) && 'ffmpeg is not installed' }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'strip-'));
  const files = [];
  for (const [name, size] of [['tall', '300x600'], ['wide', '600x300'], ['square', '400x400']]) {
    const path = join(work, `${name}.png`);
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `color=c=red:size=${size}:duration=1`, '-frames:v', '1', path]);
    files.push(await fileRef(path, 'image'));
  }
  const { ctx } = makeCtx({ partDir: join(PARTS_ROOT, 'image-nano-banana', '1.1.0'), workDir: work });
  const strip = await kitStillStrip(ctx, files, 'strip.png');
  const info = await probe(strip.path);
  assert.equal(info.height, 768);
  assert.equal(info.width, 384 + 1536 + 768);
  const capped = await kitStillStrip(ctx, [...files, ...files], 'capped.png', { max_width: 2048 });
  const wide = await probe(capped.path);
  assert.ok(wide.width <= 2048 && wide.height < 768, `kept under the width cap (${wide.width}x${wide.height})`);
  await assert.rejects(kitStillStrip(ctx, [files[0]], 'one.png'), (e) => e.code === 'bad_input');
});

// ---- borders (image-nano-banana 1.2.3, image-gpt-image-2 1.1.2) ----

/** A w x h RGBA picture from `fn(x, y)` -> [r, g, b, a?]. */
function pixels(w, h, fn) {
  const data = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a = 255] = fn(x, y);
      data.set([r, g, b, a], (y * w + x) * 4);
    }
  }
  return { w, h, data };
}
/** A busy photo: a deterministic texture, never flat. */
const photo = (x, y) => {
  const v = (Math.sin(x * 0.37) * 43758.5453 + Math.cos(y * 0.71) * 12345.678) % 1;
  const n = Math.abs(v) * 200 + 30;
  return [n, (n * 0.8 + x) % 256, (n * 0.6 + y) % 256];
};
const W = 216;
const H = 384;

test('borders: 6 % black bands top and bottom are a letterbox, cropped to the picture between them', () => {
  const band = Math.round(H * 0.06);
  const b = kitStillBordersIn(pixels(W, H, (x, y) => (y < band || y >= H - band ? [0, 0, 0] : photo(x, y))));
  assert.equal(b.flagged, true);
  assert.equal(b.frame, false);
  assert.ok(Math.abs(b.bands.top - 0.06) < 0.01 && Math.abs(b.bands.bottom - 0.06) < 0.01, JSON.stringify(b.bands));
  assert.equal(b.bands.left, 0);
  assert.ok(Math.abs(b.box.h - 0.88) < 0.02);
});

test('borders: a white ring round a photo is a frame', () => {
  const r = Math.round(W * 0.04);
  const b = kitStillBordersIn(pixels(W, H, (x, y) => (x < r || y < r || x >= W - r || y >= H - r ? [250, 250, 250] : photo(x, y))));
  assert.equal(b.frame, true);
  assert.ok(b.box.w < 0.95 && b.box.h < 0.97);
});

test('borders: a product on a seamless white sweep, a plain photo and a sky over a horizon are not borders', () => {
  const sweep = pixels(W, H, (x, y) => (((x - W / 2) / (W * 0.3)) ** 2 + ((y - H * 0.45) / (H * 0.25)) ** 2 <= 1 ? photo(x, y) : [246, 246, 246]));
  assert.equal(kitStillBordersIn(sweep).flagged, false, 'the product touches the backdrop at a point, never along a straight edge');
  assert.equal(kitStillBordersIn(pixels(W, H, photo)).flagged, false);
  const sky = pixels(W, H, (x, y) => (y < H * 0.2 ? [90, 150, 230] : photo(x, y)));
  assert.equal(kitStillBordersIn(sky).flagged, false, 'a coloured strip on one side is the picture, not padding');
});

test('borders: a tall product on a plain studio backdrop is not a pillarbox, with or without a soft gradient', () => {
  const inProduct = (x, y) => x >= W * 0.35 && x < W * 0.65 && y >= H * 0.15 && y < H * 0.85;
  const flat = pixels(W, H, (x, y) => (inProduct(x, y) ? photo(x, y) : [250, 246, 238]));
  assert.equal(kitStillBordersIn(flat).flagged, false, JSON.stringify(kitStillBordersIn(flat).bands));
  const graded = pixels(W, H, (x, y) => (inProduct(x, y) ? photo(x, y) : [250 - Math.floor((8 * y) / H), 246 - Math.floor((8 * y) / H), 238 - Math.floor((8 * y) / H)]));
  assert.equal(kitStillBordersIn(graded).flagged, false);
  const white = pixels(W, H, (x, y) => (inProduct(x, y) ? photo(x, y) : [255, 255, 255]));
  assert.equal(kitStillBordersIn(white).flagged, false, 'pure white too: the product does not run the full height');
});

test('borders: a plain wall over a table edge is not a band; a pure white strip on one side is a lone band', () => {
  const wall = pixels(W, H, (x, y) => (y < H * 0.45 ? [244, 244, 242] : photo(x, y)));
  assert.equal(kitStillBordersIn(wall).flagged, false, 'a photographed wall is not pure white');
  const strip = kitStillBordersIn(pixels(W, H, (x, y) => (y < H * 0.3 ? [255, 255, 255] : photo(x, y))));
  assert.equal(strip.flagged, true);
  assert.equal(strip.lone, true);
  const box = kitStillBordersIn(pixels(W, H, (x, y) => (y < H * 0.06 || y >= H * 0.94 ? [0, 0, 0] : photo(x, y))));
  assert.equal(box.lone, false, 'a letterbox is paired');
});

test('fill box: the largest box of the still\'s own shape inside what is left, centred', () => {
  const f = kitStillFillBox({ x: 0, y: 0.06, w: 1, h: 0.88 }, 216, 384);
  assert.ok(Math.abs(f.h - 0.88) < 1e-9 && Math.abs(f.w - 0.88) < 1e-9 && Math.abs(f.x - 0.06) < 1e-9, JSON.stringify(f));
  assert.ok(Math.abs(f.kept - 0.7744) < 1e-6);
  const g = kitStillFillBox({ x: 0.1, y: 0, w: 0.8, h: 1 }, 216, 384);
  assert.ok(Math.abs(g.w - 0.8) < 1e-9 && Math.abs(g.h - 0.8) < 1e-9 && Math.abs(g.y - 0.1) < 1e-9, JSON.stringify(g));
});

test('trim: a product on a padded white square gives its content box; a full photo and a busy edge give none', () => {
  const padded = pixels(200, 200, (x, y) => (x >= 60 && x < 140 && y >= 40 && y < 170 ? photo(x, y) : [255, 255, 255]));
  const box = kitStillTrimBoxIn(padded);
  assert.ok(box, 'trimmed');
  assert.ok(Math.abs(box.x - 0.295) < 0.02 && Math.abs(box.w - 0.41) < 0.02, JSON.stringify(box));
  assert.ok(Math.abs(box.y - 0.195) < 0.02 && Math.abs(box.h - 0.66) < 0.02, JSON.stringify(box));
  assert.equal(kitStillTrimBoxIn(pixels(200, 200, photo)), null);
  const clear = pixels(200, 200, (x, y) => (x >= 50 && x < 150 && y >= 50 && y < 150 ? photo(x, y) : [0, 0, 0, 0]));
  assert.ok(kitStillTrimBoxIn(clear).w < 0.55, 'transparent padding trims too');
});

const ff = await hasFfmpeg();

test('a padded product photo is trimmed before it is sent; a full one is sent as it is', { skip: !ff && 'ffmpeg is not installed' }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'trim-'));
  const { ctx } = makeCtx({ partDir: join(PARTS_ROOT, 'image-nano-banana', '1.2.2'), workDir: work });
  const padded = join(work, 'padded.png');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=200x300:duration=1', '-vf', 'pad=600:600:200:150:white', '-frames:v', '1', padded]);
  const ref = await fileRef(padded, 'image');
  const out = await kitStillTrimReference(ctx, ref, 'ref-1.png');
  assert.notEqual(out.path, ref.path);
  const info = await probe(out.path);
  assert.ok(Math.abs(info.width - 200) <= 8 && Math.abs(info.height - 300) <= 8, `${info.width}x${info.height}`);
  const full = await fileRef(await (async () => {
    const p = join(work, 'full.png');
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=200x300:duration=1', '-frames:v', '1', p]);
    return p;
  })(), 'image');
  assert.equal(await kitStillTrimReference(ctx, full, 'ref-2.png'), full);
});

test('a still with a border is cropped to its own shape, or fails, and is never drawn again', { skip: !ff && 'ffmpeg is not installed' }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'border-'));
  const { ctx, logs } = makeCtx({ partDir: join(PARTS_ROOT, 'image-nano-banana', '1.2.2'), workDir: work });
  const still = async (name, pad, color = 'black', top = false) => {
    const p = join(work, name);
    const h = top ? 384 - pad : 384 - 2 * pad;
    const vf = pad ? `pad=216:384:0:${pad}:${color}` : 'null';
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `testsrc2=size=216x${h}:duration=1`, '-vf', vf, '-frames:v', '1', p]);
    return fileRef(p, 'image');
  };
  const thin = await kitStillWithoutBorders(ctx, { file: await still('s2.png', 12), name: 'image-s2', about: 'the still for scene 2', refusal: 'x' });
  assert.equal(thin.cropped, true, 'a 3 % letterbox is cropped');
  const info = await probe(thin.file.path);
  assert.deepEqual([info.width, info.height], [216, 384], 'scaled back to the frame it came in');

  await assert.rejects(
    kitStillWithoutBorders(ctx, { file: await still('s3.png', 40), name: 'image-s3', about: 'the still for scene 3', refusal: 'The picture for scene 3 came back with a border; change the scene picture and try again.' }),
    (e) => e.code === 'output_invalid' && /scene 3 came back with a border/.test(e.message || e.detail),
    'a 10 % letterbox would keep under 75 % in the frame shape',
  );
  const lone = await still('s5.png', 120, 'white', true);
  const kept = await kitStillWithoutBorders(ctx, { file: lone, name: 'image-s5', about: 'the still for scene 5', refusal: 'x' });
  assert.deepEqual([kept.file, kept.cropped], [lone, false], 'a wide lone white strip is kept');
  assert.ok(logs.some(([l, m]) => l === 'warn' && /plain strip/.test(m)));
  const clean = await kitStillWithoutBorders(ctx, { file: await still('s4.png', 0), name: 'image-s4', about: 'x', refusal: 'x' });
  assert.equal(clean.cropped, false);
});
