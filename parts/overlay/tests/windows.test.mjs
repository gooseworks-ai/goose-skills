import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OVL_SCALE_FROM, ovlBox, ovlFilterGraph, ovlIsRefusal, ovlSceneProduct, ovlWindows } from '../src/windows.mjs';

const pic = (sha, extra = {}) => ({ kind: 'file', path: `/tmp/${sha}.png`, sha256: sha.repeat(64).slice(0, 64), bytes: 10, media: 'image', mime: 'image/png', width: 400, height: 200, ...extra });
const logo = pic('a');
const box = pic('b');
const tl = (scenes, extra = {}) => ({ duration_s: 10, width: 1080, height: 1920, fps: 30, scenes, speech: [], ...extra });
const refused = (fn, re) => assert.throws(fn, (e) => ovlIsRefusal(e) && re.test(e.message));

const products = [
  { id: 'serum', name: 'Glow Serum', images: [box] },
  { id: 'cream', name: 'Night Cream Deluxe', images: [pic('c')] },
];

test('a scene names a product by the phone-chat rule, or by a Product tag when the plan has one product', () => {
  assert.equal(ovlSceneProduct({ picture: 'She holds the Glow Serum up' }, products).id, 'serum');
  assert.equal(ovlSceneProduct({ picture: 'a jar of night cream on the sink' }, products).id, 'cream');
  assert.equal(ovlSceneProduct({ picture: 'A woman waves' }, products), null);
  assert.equal(ovlSceneProduct({ picture: null, line: null }, products), null);
  // A Product tag picks the only product, never one of several.
  assert.equal(ovlSceneProduct({ picture: 'Product: the box on a glowing pedestal' }, products.slice(0, 1)).id, 'serum');
  assert.equal(ovlSceneProduct({ picture: 'a pedestal', extra: { shot: 'Product' } }, products.slice(0, 1)).id, 'serum');
  assert.equal(ovlSceneProduct({ picture: 'Product: the box on a glowing pedestal' }, products), null);
});

test('a corner logo runs the whole video, or stops at the end card', () => {
  const timeline = tl([], { end_card: { start_s: 8, end_s: 10 } });
  const whole = ovlWindows({ items: [{ image: logo, corner: 'top_right' }], duration_s: 10, timeline });
  assert.deepEqual(whole.windows.map((w) => [w.start_s, w.end_s]), [[0, 10]]);
  const card = ovlWindows({ items: [{ image: logo, until: 'end_card' }], duration_s: 10, timeline });
  assert.deepEqual(card.windows.map((w) => [w.start_s, w.end_s]), [[0, 8]]);
  // No end card on the timeline (the podcast's end_card answer "none"): runs to the end.
  const none = ovlWindows({ items: [{ image: logo, until: 'end_card' }], duration_s: 10, timeline: tl([]) });
  assert.deepEqual(none.windows.map((w) => [w.start_s, w.end_s]), [[0, 10]]);
  const span = ovlWindows({ items: [{ image: logo, from_s: 2, to_s: 30 }], duration_s: 10, timeline: tl([]) });
  assert.deepEqual(span.windows.map((w) => [w.start_s, w.end_s]), [[2, 10]]);
});

test('product_of_scene lays each named product over its scene, merging touching windows of one picture', () => {
  const scenes = [
    { id: 's1', line: 'Meet Maya.', picture: 'Maya waves' },
    { id: 's2', line: null, picture: 'Product: the Glow Serum on a pedestal' },
    { id: 's3', line: 'It glows.', picture: 'The Glow Serum, close' },
    { id: 's4', line: null, on_screen: null, picture: null },
    { id: 's5', line: 'And at night.', picture: 'Night Cream Deluxe on a shelf' },
    { id: 's6', line: 'Again.', picture: 'the glow serum once more' },
  ];
  const timeline = tl(['s1', 's2', 's3', 's4', 's5', 's6'].map((id, i) => ({ id, start_s: i, end_s: i + 1 })), { end_card: { start_s: 5.5, end_s: 6 } });
  const { windows } = ovlWindows({ items: [{ image: 'product_of_scene', scenes: 'naming_product', until: 'end_card' }], duration_s: 6, timeline, scenes, products });
  assert.deepEqual(windows.map((w) => [w.image.sha256[0], w.start_s, w.end_s]), [['b', 1, 3], ['c', 4, 5], ['b', 5, 5.5]]);
});

test('a scene with no span on the timeline is skipped with a note, and no named scene draws nothing', () => {
  const scenes = [{ id: 'x', line: null, picture: 'the Glow Serum' }];
  const out = ovlWindows({ items: [{ image: 'product_of_scene', scenes: 'naming_product' }], duration_s: 4, timeline: tl([]), scenes, products });
  assert.deepEqual(out.windows, []);
  assert.ok(out.notes.some((n) => /no span/.test(n)));
  const none = ovlWindows({ items: [{ image: logo, scenes: 'naming_product' }], duration_s: 4, timeline: tl([{ id: 'x', start_s: 0, end_s: 4 }]), scenes: [{ id: 'x', line: null, picture: 'a beach' }], products });
  assert.deepEqual(none.windows, []);
  assert.ok(none.notes.some((n) => /no scene names a product/.test(n)));
});

test('refuses items that cannot be drawn', () => {
  const timeline = tl([{ id: 's1', start_s: 0, end_s: 2 }]);
  const scenes = [{ id: 's1', line: null, picture: 'the Glow Serum' }];
  refused(() => ovlWindows({ items: [{ image: 'product_of_scene' }], duration_s: 2, timeline, scenes, products }), /needs scenes "naming_product"/);
  refused(() => ovlWindows({ items: [{ image: logo, scenes: 'naming_product', from_s: 1 }], duration_s: 2, timeline, scenes, products }), /either scenes or from_s/);
  refused(() => ovlWindows({ items: [{ image: logo, scenes: 'naming_product' }], duration_s: 2, timeline, products }), /needs the plan's scenes/);
  refused(() => ovlWindows({ items: [{ image: logo, scenes: 'naming_product' }], duration_s: 2, timeline, scenes }), /needs the plan's products/);
  refused(() => ovlWindows({ items: [{ image: 'product_of_scene', scenes: 'naming_product' }], duration_s: 2, timeline, scenes, products: [{ id: 'serum', name: 'Glow Serum', images: [] }] }), /has no photo/);
  refused(() => ovlWindows({ items: [{ image: logo, from_s: 3, to_s: 2 }], duration_s: 5, timeline }), /ends \(2 s\) before it starts/);
  refused(() => ovlWindows({ items: [{ image: logo, from_s: 6 }], duration_s: 5, timeline }), /past the video's end/);
  const many = Array.from({ length: 61 }, (_, i) => ({ id: `s${i}`, line: null, picture: i % 2 ? 'the Glow Serum' : 'Night Cream Deluxe' }));
  const spans = tl(many.map((s, i) => ({ id: s.id, start_s: i, end_s: i + 1 })));
  refused(() => ovlWindows({ items: [{ image: 'product_of_scene', scenes: 'naming_product' }], duration_s: 61, timeline: spans, scenes: many, products }), /at most 60/);
});

test('boxes keep the picture aspect, scale px from a 1080 short side and stay inside the margins', () => {
  // The podcast's mark: 165 px wide, 40 px margin, top right, on 1080x1920.
  assert.deepEqual(ovlBox({ image: logo, corner: 'top_right', width_px: 165, margin_px: 40 }, logo, 1080, 1920), { w: 165, h: 83, x: 875, y: 40 });
  // The same item on a 540x960 video is half the size.
  assert.deepEqual(ovlBox({ image: logo, corner: 'top_right', width_px: 165, margin_px: 40 }, logo, 540, 960), { w: 83, h: 42, x: 437, y: 20 });
  assert.deepEqual(ovlBox({ image: logo, corner: 'bottom_left' }, logo, 1080, 1920), { w: 162, h: 81, x: 40, y: 1799 });
  // Centre default: 60% of the width, no taller than half the height (a tall box is held to that).
  assert.deepEqual(ovlBox({ image: box }, box, 1080, 1920), { w: 648, h: 324, x: 216, y: 798 });
  const tall = { width: 300, height: 1000 };
  assert.deepEqual(ovlBox({ image: box }, tall, 1080, 1920), { w: 288, h: 960, x: 396, y: 480 });
  // Never wider than the video less its margins.
  assert.equal(ovlBox({ image: box, width_px: 4000 }, box, 1080, 1920).w, 1000);
  assert.throws(() => ovlBox({ image: box }, { width: 0, height: 0 }, 1080, 1920), (e) => ovlIsRefusal(e));
});

test('the filter graph splits a picture per window, animates only scale-ins and keeps every window to its time', () => {
  const base = { box: { w: 100, h: 50, x: 10, y: 20 }, opacity: 1 };
  const { graph, out } = ovlFilterGraph(
    [
      { ...base, input: 1, start_s: 0, end_s: 8, scale_in_s: 0, opacity: 0.9 },
      { ...base, input: 2, start_s: 1, end_s: 3, scale_in_s: 0.3 },
      { ...base, input: 2, start_s: 4, end_s: 5, scale_in_s: 0 },
    ],
    { fps: 30 },
  );
  assert.equal(out, 'vout');
  assert.match(graph, /\[1:v\]fps=30,format=rgba\[p1_0\]/);
  assert.match(graph, /\[2:v\]fps=30,format=rgba,split=2\[p2_0\]\[p2_1\]/);
  assert.match(graph, /\[p1_0\]scale=w=100:h=50,colorchannelmixer=aa=0\.9\[o0\]/);
  assert.match(graph, new RegExp(`scale=w=max\\(2\\\\,trunc\\(100\\*\\(${OVL_SCALE_FROM}`));
  assert.match(graph, /fade=t=in:st=1:d=0\.3:alpha=1/);
  assert.match(graph, /enable=between\(t\\,0\\,8\)/);
  assert.match(graph, /enable=between\(t\\,4\\,5\)/);
  assert.match(graph, /\[v2\]format=yuv420p\[vout\]$/);
});
