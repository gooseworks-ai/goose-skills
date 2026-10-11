// Tests of _lib/screen-look.mjs: the pure builders (numbers checked against
// footage-cutlist filmed.py's maths), the refusals, and one small ffmpeg render
// of the graph (skipped when ffmpeg is missing).
//
//   KIT_FFMPEG=ffmpeg node --test parts/_lib/screen-look.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KIT_SCREEN_DEFAULTS,
  KitScreenRefusal,
  kitScreenBoxProblems,
  kitScreenDrift,
  kitScreenDriftAt,
  kitScreenFit,
  kitScreenGraph,
  kitScreenHomography,
  kitScreenLensExpr,
  kitScreenParams,
  kitScreenProblems,
  kitScreenProject,
  kitScreenQuad,
  kitScreenRot,
} from './screen-look.mjs';
import { hasFfmpeg, run } from '../_tools/kit-harness.mjs';

const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const BOX = { width: 1080, height: 1920, fps: 30 };
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} is not within ${eps} of ${b}`);
const nearPt = (a, b, eps = 1e-6) => {
  near(a[0], b[0], eps);
  near(a[1], b[1], eps);
};
const base = (extra = {}) => ({ input: 'in', output: 'out', box: BOX, source: { width: 1280, height: 720 }, ...extra });

test('defaults are filmed.py DEFAULTS', () => {
  const p = kitScreenParams(undefined);
  assert.deepEqual(
    { rot: p.rot, keystone: p.keystone, fill: p.fill, fit: p.fit, bezel: p.bezel, drift: p.drift, room: p.room },
    { rot: -0.8, keystone: 0.012, fill: 0.86, fit: 'width', bezel: 0.012, drift: 1.0, room: [7, 7, 9] },
  );
  assert.ok(Object.isFrozen(KIT_SCREEN_DEFAULTS));
  assert.equal(kitScreenParams({ rot: -1, fit: 'height' }).keystone, 0.012, 'a partial screen keeps the other defaults');
});

test('refusal: every bad setting is named, and the error is bad_input', () => {
  const bad = { rot: 4, fill: 1.2, fit: 'cover', keystone: 'x', room: [7, 7], zoom: 2 };
  const problems = kitScreenProblems(bad);
  for (const want of [/screen\.zoom is not a screen-look setting/, /screen\.rot 4 is outside -1\.5 to 1\.5/, /screen\.fill 1\.2 is outside 0\.3 to 1/, /screen\.fit must be/, /screen\.keystone must be a number/, /screen\.room must be/]) {
    assert.ok(problems.some((p) => want.test(p)), `missing ${want} in ${JSON.stringify(problems)}`);
  }
  assert.throws(
    () => kitScreenParams(bad),
    (e) => e instanceof KitScreenRefusal && e.code === 'bad_input' && /the screen look is refused: /.test(e.message) && /screen\.zoom/.test(e.message),
  );
  assert.deepEqual(kitScreenProblems([1]), ['screen must be an object']);
  assert.deepEqual(kitScreenProblems({ room: '#0a0b0c', rot: 0, alternate_rot: 0.6 }), []);
  assert.equal(kitScreenProblems({ room: [7, 7, 256] }).length, 1);
});

test('refusal: the graph refuses bad boxes, sizes, labels and indexes before building anything', () => {
  const cases = [
    [{ crop: [0.5, 0, 0.4, 1] }, /crop must have x1 > x0/],
    [{ crop: [0, 0, 1.2, 1] }, /crop must be fractions from 0 to 1/],
    [{ masks: [[0, 0, 0.1]] }, /masks\[0\] must be \[x0, y0, x1, y1\]/],
    [{ masks: 'none' }, /masks must be a list/],
    [{ box: { width: 1081, height: 1920, fps: 30 } }, /box width and height must be even/],
    [{ box: { width: 1080, height: 1920 } }, /box\.fps must be/],
    [{ source: { width: 8, height: 720 } }, /source must have whole width/],
    [{ index: -1 }, /index must be a whole number/],
    [{ seed: 1.5 }, /seed must be a whole number/],
    [{ screen: { fill: 2 } }, /screen\.fill 2 is outside/],
    [{ output: 'out];[x' }, /is not a plain name/],
  ];
  for (const [extra, want] of cases) {
    assert.throws(() => kitScreenGraph(base(extra)), (e) => e instanceof KitScreenRefusal && e.code === 'bad_input' && want.test(e.message), `${JSON.stringify(extra)} should be refused with ${want}`);
  }
  assert.deepEqual(kitScreenBoxProblems([0.1, 0.2, 0.3, 0.4]), []);
});

test('fit width: the screen fills fill x width, capped at 0.98 of the height (filmed.py)', () => {
  const p = kitScreenParams({ fit: 'width', fill: 0.9 });
  assert.deepEqual(kitScreenFit(BOX, { width: 1280, height: 720 }, p), { width: 972, height: 546 });
  // A tall page: width-fit would overflow, so the height caps at 0.98 H and the width follows.
  const tall = kitScreenFit(BOX, { width: 600, height: 2000 }, p);
  assert.equal(tall.height, 2 * Math.round((1920 * 0.98) / 2));
  near(tall.width, (1920 * 0.98 * 600) / 2000, 2);
});

test('fit height: the screen fills fill x height, capped at 1.3 x the width (filmed.py)', () => {
  const p = kitScreenParams({ fit: 'height', fill: 0.8 });
  assert.deepEqual(kitScreenFit(BOX, { width: 900, height: 1200 }, p), { width: 1152, height: 1536 });
  const wide = kitScreenFit(BOX, { width: 1280, height: 590 }, p);
  assert.equal(wide.width, 1404);
  near(wide.height, (1404 * 590) / 1280, 2);
  for (const v of Object.values(wide)) assert.equal(v % 2, 0, 'sizes are even');
});

test('quad: square with no keystone or rot; keystone narrows the far edge; rot turns about the centre', () => {
  const size = { width: 800, height: 600 };
  const flat = kitScreenQuad(BOX, size, kitScreenParams({ keystone: 0 }), 0);
  assert.deepEqual(flat, [
    [140, 660],
    [940, 660],
    [940, 1260],
    [140, 1260],
  ]);
  const ks = kitScreenQuad(BOX, size, kitScreenParams({ keystone: 0.024 }), 0);
  const kk = 0.024 * 800;
  nearPt(ks[0], [140 + kk, 660]);
  nearPt(ks[1], [940, 660 + kk * 0.35]);
  nearPt(ks[2], [940 - kk * 0.3, 1260]);
  nearPt(ks[3], [140, 1260 - kk * 0.25]);
  const turned = kitScreenQuad(BOX, size, kitScreenParams({ keystone: 0 }), -1);
  const r = (-1 * Math.PI) / 180;
  nearPt(turned[0], [(-400) * Math.cos(r) - (-300) * Math.sin(r) + 540, (-400) * Math.sin(r) + (-300) * Math.cos(r) + 960]);
  // Turned about the centre: the corner distances to it are unchanged.
  for (let i = 0; i < 4; i++) near(Math.hypot(turned[i][0] - 540, turned[i][1] - 960), 500, 1e-9);
});

test('rot: alternate_rot only on odd beats, and only when set', () => {
  const p = kitScreenParams({ rot: -0.8, alternate_rot: 0.6 });
  assert.deepEqual([0, 1, 2, 3].map((i) => kitScreenRot(p, i)), [-0.8, 0.6, -0.8, 0.6]);
  assert.equal(kitScreenRot(kitScreenParams({ rot: -1 }), 1), -1);
});

test('drift: two slow sines with filmed.py amplitudes and seed phases', () => {
  const d = kitScreenDrift(BOX, kitScreenParams({ drift: 1 }), 9);
  assert.deepEqual({ fx: d.fx, fy: d.fy }, { fx: 0.09, fy: 0.15 });
  near(d.ax, 0.006 * 1080);
  near(d.ay, 0.004 * 1920);
  near(d.px, 1.1 + (9 % 7) * 0.7);
  near(d.py, 2.3 + (9 % 5) * 1.3);
  const [dx, dy] = kitScreenDriftAt(d, 2.5);
  near(dx, d.ax * Math.sin(2 * Math.PI * 0.09 * 2.5 + d.px));
  near(dy, d.ay * Math.sin(2 * Math.PI * 0.15 * 2.5 + d.py));
  const still = kitScreenDrift(BOX, kitScreenParams({ drift: 0 }), 3);
  for (const v of kitScreenDriftAt(still, 4)) near(v, 0);
});

test('homography: maps the four source points exactly onto the four destination points', () => {
  const src = [
    [10, 20],
    [400, 20],
    [400, 300],
    [10, 300],
  ];
  const dst = [
    [30, 25],
    [420, 40],
    [395, 330],
    [5, 310],
  ];
  const h = kitScreenHomography(src, dst);
  for (let i = 0; i < 4; i++) nearPt(kitScreenProject(h, src[i]), dst[i], 1e-6);
  const id = kitScreenHomography(src, src);
  nearPt(kitScreenProject(id, [123, 45]), [123, 45], 1e-9);
  assert.throws(() => kitScreenHomography([[0, 0], [0, 0], [0, 0], [0, 0]], dst), KitScreenRefusal);
});

test('lens: vignette x moire is 255 at most, filmed.py corner drop at the corners', () => {
  const p = kitScreenParams({});
  const expr = kitScreenLensExpr(BOX, p);
  // Evaluate the geq expression in JS (sin, abs, hypot, pow, clip are geq's functions).
  const js = expr
    .replace(/\bclip\(/g, 'CLIP(')
    .replace(/\b(sin|abs|hypot|pow)\(/g, 'Math.$1(');
  // eslint-disable-next-line no-new-func
  const at = new Function('X', 'Y', 'CLIP', `return ${js};`);
  const clip = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  let max = 0;
  for (let y = 900; y < 1000; y++) for (let x = 500; x < 600; x++) max = Math.max(max, at(x, y, clip));
  assert.ok(max <= 255 + 1e-9 && max > 250, `centre max ${max}`);
  const corner = at(0, 0, clip);
  assert.ok(corner > 255 * 0.68 && corner < 255 * 0.71, `corner ${corner}`);
  assert.equal(kitScreenLensExpr(BOX, kitScreenParams({ moire: 0, vignette: 0 })), '255*1*1');
});

test('graph: the perspective corners put the page corners on the quad, plus the drift', () => {
  const g = kitScreenGraph(base({ screen: { rot: -1, keystone: 0.024, fill: 0.8, fit: 'width' }, seed: 2 }));
  assert.deepEqual(g.canvas, { width: 1080, height: 1920 });
  const m = /perspective=([^[]+)\[out_page\]/.exec(g.graph);
  assert.ok(m, g.graph);
  assert.match(m[1], /sense=destination:eval=frame:interpolation=cubic$/);
  // Corners at frame 0 (in = 0): evaluate each expression with in = 0.
  const val = (k) => {
    const e = new RegExp(`${k}=([^:]+)`).exec(m[1])[1];
    // eslint-disable-next-line no-new-func
    return new Function('in_', `return ${e.replace(/\bin\//g, 'in_/').replace(/\bsin\(/g, 'Math.sin(')};`)(0);
  };
  const corners = [0, 1, 2, 3].map((i) => [val(`x${i}`), val(`y${i}`)]);
  const { width: CW, height: CH } = g.canvas;
  const h = kitScreenHomography(
    [
      [0, 0],
      [CW, 0],
      [0, CH],
      [CW, CH],
    ],
    corners,
  );
  const ox = Math.floor((CW - g.page.width) / 2);
  const oy = Math.floor((CH - g.page.height) / 2);
  const [dx, dy] = kitScreenDriftAt(g.drift, 0);
  const pageCorners = [
    [ox, oy],
    [ox + g.page.width, oy],
    [ox + g.page.width, oy + g.page.height],
    [ox, oy + g.page.height],
  ];
  for (let i = 0; i < 4; i++) nearPt(kitScreenProject(h, pageCorners[i]), [g.quad[i][0] + dx, g.quad[i][1] + dy], 0.05);
  assert.equal(g.rot, -1);
});

test('graph: crop, masks, bezel, room, lens and grain appear only when asked', () => {
  const g = kitScreenGraph(base({ crop: [0.1, 0, 0.6, 1], masks: [[0, 0, 0.2, 0.3], [0.5, 0.5, 0.6, 0.6]], screen: { room: '#101112' } }));
  assert.match(g.graph, /^\[in\]format=yuva444p,split=2\[out_m0a\]\[out_m0b\];\[out_m0b\]crop=256:216:0:0,gblur=sigma=14\[out_m0c\];/);
  assert.match(g.graph, /\[out_m1b\]crop=128:72:640:360,gblur=sigma=14\[out_m1c\]/);
  assert.match(g.graph, /\[out_m1a\]\[out_m1c\]overlay=640:360,crop=640:720:128:0,scale=/);
  assert.match(g.graph, /pad=\d+:\d+:\d+:\d+:color=0x0E0E11,pad=1080:1920:/);
  assert.match(g.graph, /color=c=0x101112:s=1080x1920:r=30/);
  assert.match(g.graph, /blend=c0_mode=multiply:shortest=1,noise=c0s=4:c0f=t:c1s=2:c1f=t:c2s=2:c2f=t:all_seed=\d+,setsar=1\[out\]$/);
  const plain = kitScreenGraph(base({ screen: { bezel: 0, moire: 0, vignette: 0, grain: 0, drift: 0 }, id: 's3' }));
  assert.doesNotMatch(plain.graph, /split=|crop=|color=0x0E0E11|blend=|noise=|geq=|sin\(/);
  assert.match(plain.graph, /\[s3_room\]\[s3_page\]overlay=0:0:shortest=1:format=yuv444,setsar=1\[out\]$/);
});

test('graph: a fit-height page wider than the box gets a wider canvas and a centre crop back to the box', () => {
  const g = kitScreenGraph(base({ source: { width: 1280, height: 590 }, screen: { fit: 'height', fill: 0.8 } }));
  assert.equal(g.page.width, 1404);
  assert.ok(g.canvas.width >= g.page.width + 2 * Math.round((0.012 * g.page.width) / 2));
  assert.equal((g.canvas.width - 1080) % 2, 0);
  assert.match(g.graph, new RegExp(`overlay=0:0:shortest=1:format=yuv444,crop=1080:1920:${(g.canvas.width - 1080) / 2}:0\\[out_lit\\]`));
});

test('render: the graph runs in ffmpeg and frames a screen in a dark room that drifts', { skip }, async () => {
  const box = { width: 216, height: 384, fps: 30 };
  const g = kitScreenGraph({ input: '0:v', output: 'v', box, source: { width: 320, height: 240 }, screen: { drift: 3, grain: 0 }, masks: [[0, 0, 0.25, 0.25]], seed: 3 });
  const { stdoutBuffer } = await run('ffmpeg', [
    '-hide_banner', '-nostdin', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=30:duration=2',
    '-filter_complex', `${g.graph};[v]select='eq(n\\,0)+eq(n\\,45)',format=rgb24[o]`,
    '-map', '[o]', '-fps_mode', 'passthrough', '-f', 'rawvideo', 'pipe:1',
  ]);
  const frame = box.width * box.height * 3;
  assert.equal(stdoutBuffer.length, 2 * frame, 'two frames of the box size');
  const px = (f, x, y) => {
    const i = f * frame + (y * box.width + x) * 3;
    return [stdoutBuffer[i], stdoutBuffer[i + 1], stdoutBuffer[i + 2]];
  };
  // The room: the top-left corner is near (7, 7, 9), darkened by the vignette.
  for (const c of px(0, 2, 2)) assert.ok(c < 24, `room ${px(0, 2, 2)}`);
  // The screen keeps its colour: testsrc2's colour bars are saturated in the middle band.
  let chroma = 0;
  for (let x = 20; x < 196; x += 4) {
    const [r, gg, b] = px(0, x, 192);
    chroma = Math.max(chroma, Math.max(r, gg, b) - Math.min(r, gg, b));
  }
  assert.ok(chroma > 80, `the screen lost its colour (max channel spread ${chroma})`);
  // The drift moves the screen: with seed 3 the top edge (centre column) moves about 3.6 px by frame 45.
  const top = (f) => {
    for (let y = 0; y < box.height; y++) if (Math.max(...px(f, 108, y)) > 40) return y;
    return -1;
  };
  // Buffer frame 1 is source frame 45.
  assert.ok(top(0) > 0 && top(1) > 0, `screen top edges ${top(0)}, ${top(1)}`);
  assert.ok(Math.abs(top(0) - top(1)) >= 2, `the screen should drift (top edge ${top(0)} then ${top(1)})`);
});
