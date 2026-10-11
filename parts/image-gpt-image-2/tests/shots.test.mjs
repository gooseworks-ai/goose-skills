// shots mode (1.1.0): locked-camera shots grouped by extra.group, every later
// frame an edit on [plate, previous frame, product photos], then the plate's own
// pixels put back (src/plate.mjs, a port of restore_plate.py).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, framePixels, hasFfmpeg, loadNewest, makeCtx, run } from '../../_tools/kit-harness.mjs';
import { giPlateBlend, giPlateBlur, giPlateFillHoles, giPlateGain, giPlateGrow, giPlateKeepLarge, giPlateMask, giPlateMedian, giPlateOpen } from '../src/plate.mjs';
import { QUALITY, REQUEST_FIELDS, REQUIRED, falAnswer, makeImage, sizeProblems, writeTemplate } from './fixture.mjs';

const { dir, mod } = await loadNewest('image-gpt-image-2');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const work = () => mkdtempSync(join(tmpdir(), 'gi-shots-'));
const W = 256;
const H = 448;

/** Every order fits the recorded fal request (as in image-gpt-image-2.test.mjs). */
function assertFitsContract(order) {
  assert.equal(order.provider, 'fal');
  const fields = REQUEST_FIELDS[order.path];
  assert.ok(fields, `${order.path} is a recorded model`);
  for (const k of Object.keys(order.body)) assert.ok(fields.includes(k), `${order.path} accepts ${k}`);
  for (const k of REQUIRED[order.path]) assert.ok(order.body[k] !== undefined, `${order.path} needs ${k}`);
  assert.deepEqual(sizeProblems(order.body.image_size), []);
  assert.ok(QUALITY.includes(order.body.quality));
  if (order.body.image_urls) {
    assert.ok(order.body.image_urls.length <= 10);
    for (const r of order.body.image_urls) assert.equal(r.kind, 'file');
  }
}

// ---- the pure restore steps ----

function grid(w, h, cells) {
  const m = new Uint8Array(w * h);
  for (const [x, y] of cells) m[y * w + x] = 1;
  return m;
}
function rect(w, h, x0, y0, x1, y1, m = new Uint8Array(w * h)) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y * w + x] = 1;
  return m;
}
const count = (m) => m.reduce((a, b) => a + b, 0);

test('restore steps: median, opening, small regions, holes and the grow match scipy', () => {
  assert.equal(giPlateMedian(Uint8Array.from([1, 0, 0, 2, 0, 0, 3, 0, 0, 4, 0, 0]), 0), 2.5, 'even count: the mean of the two middles');
  assert.equal(giPlateMedian(Uint8Array.from([9, 0, 0, 1, 0, 0, 5, 0, 0]), 0, Uint8Array.from([1, 0, 1])), 7, 'only masked pixels');

  // Opening with a 7x7 square: a speck goes, a 10x10 block stays whole, even against the frame's edge.
  const w = 40;
  const h = 30;
  const m = rect(w, h, 0, 0, 9, 9, grid(w, h, [[30, 20]]));
  const opened = giPlateOpen(m, w, h, 7);
  assert.equal(count(opened), 100);
  assert.equal(opened[20 * w + 30], 0);
  assert.equal(count(giPlateOpen(rect(w, h, 10, 10, 15, 15), w, h, 7)), 0, 'a 6x6 block is smaller than the square');

  // Regions under the area floor go; 4-connected only (a diagonal touch is two regions).
  const two = rect(w, h, 20, 0, 29, 9, rect(w, h, 0, 0, 2, 2));
  assert.equal(count(giPlateKeepLarge(two, w, h, 50)), 100);
  assert.equal(count(giPlateKeepLarge(grid(w, h, [[5, 5], [6, 6]]), w, h, 2)), 0);

  // Holes: a closed ring fills, an open C does not.
  const ring = rect(w, h, 5, 5, 15, 15);
  for (let y = 7; y <= 13; y++) for (let x = 7; x <= 13; x++) ring[y * w + x] = 0;
  assert.equal(count(giPlateFillHoles(ring, w, h)), 121);
  const c = Uint8Array.from(ring);
  for (let y = 9; y <= 11; y++) for (let x = 13; x <= 15; x++) c[y * w + x] = 0;
  assert.equal(count(giPlateFillHoles(c, w, h)), count(c));

  // Grow r: a diamond (city-block distance), clipped by the frame.
  assert.equal(count(giPlateGrow(grid(w, h, [[20, 15]]), w, h, 2)), 13);
  assert.equal(count(giPlateGrow(grid(w, h, [[0, 0]]), w, h, 2)), 6);
});

test('restore steps: the blur is Pillow\'s GaussianBlur, byte for byte', () => {
  // Image.fromarray(a).filter(ImageFilter.GaussianBlur(1.5)) with Pillow 11.1, for this 9x7 picture.
  const a = new Uint8Array(9 * 7);
  a[3 * 9 + 4] = 255;
  a[0] = 200;
  a[6 * 9 + 8] = 90;
  assert.deepEqual([...giPlateBlur(a, 9, 7, 1, 1.5)], [44,31,17,6,3,3,1,0,0,31,23,14,9,7,6,3,1,0,15,13,11,13,14,12,6,3,0,4,6,8,14,16,14,8,4,2,0,3,6,12,14,13,8,7,7,0,1,3,6,7,8,8,11,15,0,0,1,3,3,5,8,15,20]);
  // Three channels blur on their own.
  const rgb = new Uint8Array(9 * 7 * 3);
  for (let p = 0; p < a.length; p++) rgb[p * 3 + 1] = a[p];
  const out = giPlateBlur(rgb, 9, 7, 3, 1.5);
  assert.deepEqual([...out].filter((_, i) => i % 3 === 1), [44,31,17,6,3,3,1,0,0,31,23,14,9,7,6,3,1,0,15,13,11,13,14,12,6,3,0,4,6,8,14,16,14,8,4,2,0,3,6,12,14,13,8,7,7,0,1,3,6,7,8,8,11,15,0,0,1,3,3,5,8,15,20]);
  assert.ok(out.every((v, i) => i % 3 === 1 || v === 0));
  // A full-size parity run against the recipe's restore_plate.py (1024x1792, an exposure drift, two boxes and a speck)
  // matched every pixel on 2026-10-12; the part test below checks the same behaviour at a small size.
});

test('restore steps: an exposure drift over the whole frame is taken out before asking what changed', () => {
  const w = 60;
  const h = 60;
  const P = new Uint8Array(w * h * 3).fill(100);
  const S = new Uint8Array(w * h * 3).fill(130); // 1.3x everywhere: nothing really changed
  for (let y = 20; y < 40; y++) for (let x = 20; x < 40; x++) S.set([10, 200, 10], (y * w + x) * 3);
  const gain = giPlateGain(S, P);
  assert.deepEqual(gain.map((g) => g.toFixed(2)), ['1.30', '1.30', '1.30']);
  const { mask } = giPlateMask(S, P, w, h, { grow: 0, min_area: 0 });
  assert.equal(count(mask), 400, 'only the green square counts as changed');
  const out = giPlateBlend(S, P, Uint8Array.from(mask, (v) => v * 255));
  assert.deepEqual([...out.subarray(0, 3)], [100, 100, 100], 'outside: the plate');
  assert.deepEqual([...out.subarray((30 * w + 30) * 3, (30 * w + 30) * 3 + 3)], [10, 200, 10], 'inside: the edit');
});

// ---- the part ----

async function ff(args) {
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', ...args]);
}

/** A grained surface, and states of it: the grain re-rolled, a 4% exposure drift, and boxes put on it. */
async function makeShotImages(d) {
  const plate = join(d, 'plate.png');
  await ff(['-f', 'lavfi', '-i', `color=c=0x7a6a58:s=${W}x${H}:d=1`, '-vf', 'noise=alls=14:allf=u:all_seed=1', '-frames:v', '1', plate]);
  const state = async (name, boxes, seed) => {
    const draw = boxes.map(([x, y, c]) => `drawbox=x=${x}:y=${y}:w=60:h=60:color=${c}:t=fill`).join(',');
    const path = join(d, name);
    await ff(['-i', plate, '-vf', `noise=alls=8:allf=u:all_seed=${seed},lutrgb=r='clip(val*1.04,0,255)':g='clip(val*1.04,0,255)':b='clip(val*1.04,0,255)',${draw}`, '-frames:v', '1', path]);
    return path;
  };
  const other = join(d, 'other.png');
  await ff(['-f', 'lavfi', '-i', `color=c=0x304050:s=${W}x${H}:d=1`, '-frames:v', '1', other]);
  return {
    'image-a0': plate,
    'image-a1': await state('a1.png', [[150, 300, '0x2040c0']], 7),
    'image-a2': await state('a2.png', [[150, 300, '0x2040c0'], [40, 300, '0xc04020']], 9),
    'image-x': other,
  };
}

/** A fake line answering each piece with its prepared picture, under the requested name. */
function shotLine(images, { fail } = {}) {
  return async (order, ctx) => {
    if (fail && fail === order.piece) throw ctx.error('provider_failed', 'boom');
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    copyFileSync(images[order.piece], path);
    return { ...falAnswer(name), files: { [name]: await fileRef(path, 'image') }, reused: false };
  };
}

const shotsTemplate = {
  version: 1,
  prefix: 'A real photograph',
  scene: '{picture}',
  templates: { plate: 'The empty place: {picture}. Completely empty', state: 'The first image is {picture}, {answers.camera?}' },
  suffix: 'locked camera, no hands, no text',
  negative: 'people, watermark',
};

async function shotsInputs(d, extra = {}) {
  const photo = await fileRef(await makeImage(join(d, 'pot.png')), 'image');
  return {
    mode: 'shots',
    size: '1024x1792',
    quality: 'high',
    template: await writeTemplate(d, shotsTemplate, 'shots.prompt.json'),
    answers: { camera: 'seen from straight overhead' },
    products: [{ id: 'pot', name: 'Le Pot', images: [photo] }],
    scenes: [
      { id: 'a0', line: null, picture: 'a pale stone hob, window light', extra: { group: 'hob' } },
      { id: 'a1', line: 'I start with the pot,', picture: 'Le Pot on the front burner', extra: { group: 'hob' } },
      { id: 'a2', line: null, on_screen: null, picture: 'Le Pot on the front burner, a red tin beside it', extra: { group: 'hob' } },
      { id: 'x', line: 'and set the table.', picture: 'an oak table, nothing on it', extra: null },
      { id: 'r', line: null, picture: 'the hob again', extra: { group: 'night', repeat_of: 'a2' } },
    ],
    ...extra,
  };
}

const rgbAt = (px, x, y) => [...px.data.subarray((y * px.width + x) * 3, (y * px.width + x) * 3 + 3)];

test('fixture: shots mode draws each shot in order on its plate and the frame before, then restores the plate pixels', { skip }, async () => {
  const d = work();
  const images = await makeShotImages(d);
  const inputs = await shotsInputs(d);
  const { ctx, orders, logs } = makeCtx({ partDir: dir, workDir: join(d, 'step'), line: shotLine(images) });
  const out = await mod.run(inputs, ctx);
  for (const o of orders) assertFitsContract(o);
  const pieces = orders.map((o) => o.piece);
  assert.deepEqual([...pieces].sort(), ['image-a0', 'image-a1', 'image-a2', 'image-x'], 'one piece per drawn scene; the repeat is free');
  assert.ok(pieces.indexOf('image-a0') < pieces.indexOf('image-a1') && pieces.indexOf('image-a1') < pieces.indexOf('image-a2'), "a shot's frames are made in order");
  const o = Object.fromEntries(orders.map((x) => [x.piece, x]));
  const photo = inputs.products[0].images[0].sha256;
  const rawSha = (piece) => fileRefSha(images[piece]);

  // The plate: drawn from its words alone (it does not name the product), with templates.plate.
  assert.equal(o['image-a0'].path, 'openai/gpt-image-2');
  assert.equal(o['image-a0'].body.image_urls, undefined);
  assert.equal(o['image-a0'].body.prompt, 'A real photograph. The empty place: a pale stone hob, window light. Completely empty. locked camera, no hands, no text. Avoid: people, watermark');
  assert.deepEqual(o['image-a0'].body.image_size, { width: 1024, height: 1792 });

  // The first state: [plate, product photo]; the previous frame is the plate, so it is not sent twice.
  assert.equal(o['image-a1'].path, 'openai/gpt-image-2/edit');
  assert.deepEqual(o['image-a1'].body.image_urls.map((r) => r.sha256), [await rawSha('image-a0'), photo]);
  assert.match(o['image-a1'].body.prompt, /^A real photograph\. The first image is Le Pot on the front burner, seen from straight overhead\. locked camera/);
  assert.match(o['image-a1'].body.prompt, /Reference image 1 is this shot's first picture, from a locked camera: keep its camera, framing, surface and light exactly\. Reference image 2 shows the product/);
  assert.match(o['image-a1'].body.prompt, /Avoid: people, watermark$/);

  // The second state: [plate, the frame before as drawn, product photo].
  assert.deepEqual(o['image-a2'].body.image_urls.map((r) => r.sha256), [await rawSha('image-a0'), await rawSha('image-a1'), photo]);
  assert.match(o['image-a2'].body.prompt, /Reference image 2 is the picture just before this one: everything in it stays exactly where it is unless this text changes it\. Reference image 3 shows the product/);

  // A scene with no group is a shot of its own.
  assert.equal(o['image-x'].path, 'openai/gpt-image-2');

  // Outputs by scene id, in plan order; the repeat reuses its source's finished frame.
  assert.deepEqual(out.images.map((i) => i.id), ['a0', 'a1', 'a2', 'x', 'r']);
  const img = Object.fromEntries(out.images.map((i) => [i.id, i.image]));
  assert.equal(img.r.sha256, img.a2.sha256);
  assert.equal(img.a0.sha256, await rawSha('image-a0'), 'the plate is its own frame');
  assert.notEqual(img.a1.sha256, await rawSha('image-a1'), 'a state is restored');
  assert.deepEqual(out.plates.map((p) => [p.group, p.image.sha256]), [['hob', img.a0.sha256], ['x', img.x.sha256]]);
  assert.deepEqual(out.scenes.map((s) => s.image && s.image.sha256), [img.a0.sha256, img.a1.sha256, img.a2.sha256, img.x.sha256, img.a2.sha256]);
  assert.deepEqual(out.scenes[4].extra, { group: 'night', repeat_of: 'a2' }, 'other scene fields pass through');

  // Restore: far from the boxes the frame is the plate's own pixels; inside a box it is the edit.
  const plate = await framePixels(images['image-a0'], 0, W, H);
  const drawn = await framePixels(images['image-a2'], 0, W, H);
  const fixed = await framePixels(img.a2.path, 0, W, H);
  for (const [x, y] of [[5, 5], [250, 10], [128, 120], [10, 200]]) assert.deepEqual(rgbAt(fixed, x, y), rgbAt(plate, x, y), `(${x},${y}) is the plate`);
  for (const [x, y] of [[180, 330], [70, 330]]) assert.deepEqual(rgbAt(fixed, x, y), rgbAt(drawn, x, y), `(${x},${y}) is the edit`);
  assert.notDeepEqual(rgbAt(drawn, 5, 5), rgbAt(plate, 5, 5), 'the drawn frame had re-rolled grain there');
  const said = logs.filter(([level]) => level === 'info').map(([, m]) => m).join('\n');
  assert.match(said, /scene a1: \d+\.\d% kept from the edit, \d+\.\d% is the plate's own pixels/);
});

async function fileRefSha(path) {
  return (await fileRef(path, 'image')).sha256;
}

test('restore: false keeps every frame as drawn', { skip }, async () => {
  const d = work();
  const images = await makeShotImages(d);
  const { ctx } = makeCtx({ partDir: dir, line: shotLine(images) });
  const out = await mod.run(await shotsInputs(d, { restore: false }), ctx);
  const img = Object.fromEntries(out.images.map((i) => [i.id, i.image]));
  assert.equal(img.a1.sha256, await fileRefSha(images['image-a1']));
  assert.equal(img.a2.sha256, await fileRefSha(images['image-a2']));
});

test('null line: shots of scenes with no line, no on_screen and no template', { skip }, async () => {
  const d = work();
  const images = await makeShotImages(d);
  const { ctx, orders } = makeCtx({ partDir: dir, line: shotLine(images) });
  const scenes = [
    { id: 'a0', line: null, on_screen: null, picture: 'an empty desk', extra: { group: 'desk' } },
    { id: 'a1', line: null, on_screen: null, picture: 'a mug on the desk', extra: { group: 'desk' } },
  ];
  const out = await mod.run({ mode: 'shots', scenes }, ctx);
  assert.deepEqual(orders.map((o) => [o.piece, o.path]), [['image-a0', 'openai/gpt-image-2'], ['image-a1', 'openai/gpt-image-2/edit']]);
  assert.equal(orders[0].body.prompt, 'an empty desk', 'without a template the prompt is the picture');
  assert.match(orders[1].body.prompt, /^a mug on the desk\. Reference image 1 is this shot's first picture/);
  assert.deepEqual(out.images.map((i) => i.id), ['a0', 'a1']);
  assert.deepEqual(out.plates.map((p) => p.group), ['desk']);
});

test('refuses before ordering: bad repeats and groups, inputs shots mode does not take, a frame the template cannot fill', { skip }, async () => {
  const d = work();
  const base = await shotsInputs(d);
  const withScene = (i, patch) => ({ ...base, scenes: base.scenes.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const cases = [
    [{ ...base, model: 'openai/gpt-image-2' }, /shots mode .* needs openai\/gpt-image-2\/edit/],
    [withScene(4, { extra: { repeat_of: 'zz' } }), /scene r repeats zz, which is not a picked scene/],
    [withScene(1, { extra: { group: 'hob', repeat_of: 'a2' } }), /scene a1 repeats a2, which does not come before it/],
    [withScene(4, { extra: { repeat_of: 'r' } }), /scene r repeats r, which does not come before it/],
    [withScene(4, { extra: { repeat_of: 7 } }), /extra\.repeat_of must be a scene id/],
    [withScene(1, { extra: { group: 3 } }), /scene a1: extra\.group must be text/],
    [withScene(3, { id: 'hob' }), /scene hob has no group, and a group is also called hob/],
    [withScene(3, { id: 'a1' }), /two scenes have the id a1/],
    [{ ...base, template: await writeTemplate(d, { ...shotsTemplate, templates: { ...shotsTemplate.templates, state: '{picture}. {answers.light}' } }, 'gap.prompt.json') }, /scene a1 needs \{answers\.light\}/],
    [{ ...base, cast: [{ key: 'a', name: 'Maya', look: 'x' }] }, /cast does not work in shots mode/],
    [{ ...base, anchor: 'none' }, /anchor does not work in shots mode/],
    [{ ...base, multi_ref: 'list' }, /multi_ref does not work in shots mode/],
    [{ ...base, images: [{ prompt: 'xy' }] }, /images does not work in shots mode/],
    [{ mode: 'shots' }, /shots mode needs scenes/],
    [{ ...base, mode: 'scenes', restore: true, anchor: 'none' }, /restore works only in shots mode/],
    [{ cast: [{ key: 'a', name: 'Maya', look: 'x' }], restore: true }, /restore does not work in cast mode/],
    [{ ...base, relight: true }, /relight/],
  ];
  for (const [inputs, why] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: shotLine({}) });
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && why.test(e.message), String(why));
    assert.equal(orders.length, 0, `nothing is ordered for ${why}`);
  }
});

test('a repeat of a scene that is skipped is refused; skip_first and skip_last shape the shots', { skip }, async () => {
  const d = work();
  const base = await shotsInputs(d);
  {
    const { ctx, orders } = makeCtx({ partDir: dir, line: shotLine({}) });
    await assert.rejects(mod.run({ ...base, skip_first: 3 }, ctx), (e) => e.code === 'bad_input' && /scene r repeats a2, which is not a picked scene/.test(e.message));
    assert.equal(orders.length, 0);
  }
  {
    const images = await makeShotImages(d);
    const { ctx, orders } = makeCtx({ partDir: dir, line: shotLine(images) });
    const out = await mod.run({ ...base, skip_last: 2 }, ctx);
    assert.deepEqual(orders.map((o) => o.piece), ['image-a0', 'image-a1', 'image-a2']);
    assert.deepEqual(out.images.map((i) => i.id), ['a0', 'a1', 'a2']);
    assert.equal(out.scenes[3].image, undefined);
  }
});

test('a provider failure inside a shot stops its later frames and new shots', { skip }, async () => {
  const d = work();
  const images = await makeShotImages(d);
  const { ctx, orders } = makeCtx({ partDir: dir, line: shotLine(images, { fail: 'image-a1' }) });
  await assert.rejects(mod.run(await shotsInputs(d), ctx), (e) => e.code === 'provider_failed');
  assert.ok(!orders.some((o) => o.piece === 'image-a2'), 'the frame after the failed one is never ordered');
});
