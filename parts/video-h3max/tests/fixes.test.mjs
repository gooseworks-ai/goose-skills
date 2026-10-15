// fixes (1.2.0): the mirror check and the drawn-screen crop, on generated pictures, then through mode takes with a
// provider that returns one mirrored take and one take with a drawn phone screen. No paid calls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadNewest, makeCtx, run } from '../../_tools/kit-harness.mjs';
import { mirFlip, mirVerdict } from '../src/mirror.mjs';
import { scrCrop, scrMeasure } from '../src/screen.mjs';
import { photo, template } from './fixture.mjs';

const { dir, mod } = await loadNewest('video-h3max');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const work = () => mkdtempSync(join(tmpdir(), 'h3-fixes-'));

function random(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

/** A label-like product: dark blocks and bars of many sizes on white, nothing symmetric. */
function productPicture(w = 240, h = 360, seed = 5) {
  const rnd = random(seed);
  const px = new Float32Array(w * h).fill(245);
  for (let n = 0; n < 70; n++) {
    const bw = 4 + Math.floor(rnd() * 40);
    const bh = 4 + Math.floor(rnd() * 22);
    const x0 = Math.floor(rnd() * (w - bw));
    const y0 = Math.floor(rnd() * (h - bh));
    const v = 20 + Math.floor(rnd() * 120);
    for (let y = y0; y < y0 + bh; y++) for (let x = x0; x < x0 + bw; x++) px[y * w + x] = v;
  }
  return { w, h, px };
}

/** A 540x960 frame: soft grey noise with the product pasted at (x, y), scaled by s. */
function frameWith(product, { x = 150, y = 300, s = 1, seed = 9 } = {}) {
  const w = 540;
  const h = 960;
  const rnd = random(seed);
  const px = new Float32Array(w * h);
  for (let i = 0; i < px.length; i++) px[i] = 120 + rnd() * 30;
  if (product) {
    const pw = Math.round(product.w * s);
    const ph = Math.round(product.h * s);
    for (let yy = 0; yy < ph; yy++)
      for (let xx = 0; xx < pw; xx++) px[(y + yy) * w + x + xx] = product.px[Math.floor(yy / s) * product.w + Math.floor(xx / s)];
  }
  return { w, h, px };
}

/** Paints a phone screen over a frame: a dark band `band` wide on every edge, with rounded inner corners. */
function drawScreen(img, band = 15, radius = 44) {
  const { w, h, px } = img;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const inBand = x < band || y < band || x >= w - band || y >= h - band;
      const cx = x < band + radius ? band + radius : x >= w - band - radius ? w - band - radius - 1 : null;
      const cy = y < band + radius ? band + radius : y >= h - band - radius ? h - band - radius - 1 : null;
      const outCorner = cx != null && cy != null && Math.hypot(x - cx, y - cy) > radius;
      if (inBand || outCorner) px[y * w + x] = 6;
    }
  return img;
}

test('the mirror check reads a pasted label the right way, a flipped one as mirrored, and no label as unsure', () => {
  const product = productPicture();
  const frames = [frameWith(product), frameWith(product, { x: 120, y: 260, s: 1.3, seed: 3 })];
  assert.equal(mirVerdict(product, frames).verdict, 'ok');
  assert.equal(mirVerdict(product, frames.map(mirFlip)).verdict, 'mirrored');
  assert.equal(mirVerdict(product, [frameWith(null), frameWith(null, { seed: 4 })]).verdict, 'unsure');
});

test('a drawn phone screen is found and cropped clear of its corners; a plain frame is left alone', () => {
  const product = productPicture();
  const plain = [frameWith(product), frameWith(product, { seed: 2 })];
  assert.equal(scrMeasure(plain).drawn, false);
  const drawn = plain.map((f) => drawScreen({ ...f, px: Float32Array.from(f.px) }));
  const m = scrMeasure(drawn);
  assert.equal(m.drawn, true);
  for (const side of ['top', 'right', 'bottom', 'left']) assert.ok(Math.abs(m.bands[side] - 15) <= 1, `${side} band ${m.bands[side]}`);
  assert.ok(Math.abs(m.radius - 44) <= 8, `radius ${m.radius}`);
  const c = scrCrop(m, 1080, 1920, 2);
  assert.ok(Math.abs(c.w / c.h - 1080 / 1920) < 0.01, 'the crop keeps the take aspect');
  // Every corner of the crop is inside the picture, past the band and the rounded corner.
  for (const [x, y] of [[c.x, c.y], [c.x + c.w - 1, c.y], [c.x, c.y + c.h - 1], [c.x + c.w - 1, c.y + c.h - 1]]) {
    const v = drawn[0].px[Math.floor(y / 2) * 540 + Math.floor(x / 2)];
    assert.ok(v > 24, `crop corner ${x},${y} is on the band`);
  }
  // Half the frames drawn (a 15 s take from its first cut on) still counts.
  assert.equal(scrMeasure([plain[0], drawn[1], plain[1], drawn[0], plain[0], drawn[1]]).drawn, true);
  assert.equal(scrMeasure([plain[0], drawn[1], plain[1], plain[0], plain[1], plain[0]]).drawn, false);
});

async function writeGrey(path, img) {
  const raw = `${path}.gray`;
  writeFileSync(raw, Buffer.from(Uint8Array.from(img.px, (v) => Math.max(0, Math.min(255, Math.round(v))))));
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', `${img.w}x${img.h}`, '-i', raw, '-frames:v', '1', path]);
}

test('mode takes flips a mirrored take and crops a drawn screen before the chain still is cut', { skip }, async () => {
  const workDir = work();
  const product = productPicture();
  const productPath = join(workDir, 'product.png');
  await writeGrey(productPath, product);
  const plain = join(workDir, 'plain.png');
  await writeGrey(plain, frameWith(product));
  const screen = join(workDir, 'screen.png');
  await writeGrey(screen, drawScreen(frameWith(product)));
  const answers = [
    { still: plain, vf: 'hflip' }, // take 1 comes back mirrored
    { still: screen, vf: 'null' }, // take 2 comes back with a drawn phone screen
  ];
  const line = async (order, ctx) => {
    const a = answers.shift();
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-loop', '1', '-i', a.still, '-f', 'lavfi', '-i', `sine=frequency=300:duration=${order.body.duration}`, '-t', String(order.body.duration), '-vf', `${a.vf},format=yuv420p`, '-r', '24', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-shortest', path]);
    return { json: { video: { url: 'https://fal.media/h3-fixture.mp4' }, seed: order.body.seed }, files: { [name]: await fileRef(path, 'video') }, reused: false };
  };
  const inputs = {
    mode: 'takes',
    takes: { count: 2 },
    chain: { crop: 'bottom_45' },
    fixes: ['mirror', 'screen'],
    template: await template(workDir, { version: 1, templates: { first: 'Use @Image1 as the product.', later: 'Use @Image1 as the product; @Image2 is an earlier frame.' }, scene: '{picture}', refs: ['product'] }),
    scenes: [
      { id: 's1', line: 'This label reads the right way round.', picture: 'She holds the bottle up' },
      { id: 's2', line: 'And nothing is drawn over the picture.', picture: 'She holds it closer' },
    ],
    products: [{ id: 'p', name: 'Bottle', images: [await fileRef(productPath, 'image')] }],
    seconds: 5,
    resolution: '768P',
    generate_audio: true,
  };
  const { ctx, logs } = makeCtx({ partDir: dir, line, seed: 1 });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(out.takes.map((t) => t.fixed || []), [['flipped'], ['cropped']]);
  const said = logs.map((l) => l[1]).join('\n');
  assert.match(said, /take-t1: label reads mirrored/);
  assert.match(said, /take-t2: a drawn phone screen/);
});

test('fixes are refused outside the take modes, before any order', { skip }, async () => {
  const workDir = work();
  const { ctx } = makeCtx({ partDir: dir, line: async () => assert.fail('no order'), seed: 1 });
  const clips = [{ id: 'c', prompt: 'Image 1 is the bottle.', references: [await photo(workDir)], seconds: 5 }];
  await assert.rejects(mod.run({ mode: 'reference', fixes: ['mirror'], clips }, ctx), (e) => e.code === 'bad_input' && /fixes works only in mode take or takes/.test(e.message));
});
