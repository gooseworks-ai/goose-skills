import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, loadNewest, hasFfmpeg, loadPart, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { EDIT_FIELDS, EDIT_POINTER, EDIT_REQUIRED, falReply, makeImage, pngLine, productsInputs, productsTemplate, sample, scenesInputs, template, writeTemplate } from './fixture.mjs';

const { dir, mod } = await loadNewest('image-nano-banana');
const ffmpeg = await hasFfmpeg();
const PNG = '89504e470d0a1a0a';

test('edits each still from its reference files and always hands back PNG', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const inputs = await sample.inputs(work);
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 2);
  for (const o of orders) {
    assert.equal(o.provider, 'fal');
    assert.equal(o.path, 'fal-ai/nano-banana/edit');
    assert.equal(o.body.image_urls[0].kind, 'file', 'references go to the core as files, never links');
    assert.equal(o.body.aspect_ratio, '9:16');
  }
  for (const img of out.images) assert.equal(readFileSync(img.image.path).subarray(0, 8).toString('hex'), PNG);
});

test('refuses references on the prompt-only model and none on the edit model, before ordering', async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const ref = { kind: 'file', path: join(work, 'x.png'), sha256: 'a'.repeat(64), bytes: 10, media: 'image', mime: 'image/png' };
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run({ model: 'fal-ai/nano-banana', images: [{ prompt: 'x', references: [ref] }] }, ctx), (e) => e.code === 'bad_input');
  await assert.rejects(mod.run({ model: 'fal-ai/nano-banana/edit', images: [{ prompt: 'x' }] }, ctx), (e) => e.code === 'bad_input');
  assert.equal(orders.length, 0);
});

// ---- 1.1.0 scenes mode ----

const skip = !ffmpeg && 'ffmpeg is not installed';
const byPiece = (orders) => Object.fromEntries(orders.map((o) => [o.piece, o]));

test('images mode is still the 1.0.1 behaviour in 1.0.1, 1.1.0 and 1.2.0', { skip }, async () => {
  for (const version of ['1.0.1', '1.1.0', '1.2.0']) {
    const part = await loadPart('image-nano-banana', version);
    const work = mkdtempSync(join(tmpdir(), 'nb-'));
    const { ctx, orders } = makeCtx({ partDir: part.dir, line: sample.line });
    const out = await part.mod.run(await sample.inputs(work), ctx);
    assert.deepEqual(orders.map((o) => o.piece), ['image-hero', 'image-2'], version);
    assert.deepEqual(out.images.map((i) => i.id), ['hero', '2'], version);
    assert.deepEqual(Object.keys(out), ['images'], `${version} adds no scenes-mode outputs in images mode`);
  }
});

test('fixture: scenes mode draws the missing anchor, then one still per picked scene from the plan', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const inputs = await scenesInputs(work);
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'step'), line: pngLine });
  const out = await mod.run(inputs, ctx);
  const o = byPiece(orders);
  assert.deepEqual(Object.keys(o).sort(), ['anchor-b', 'image-s1', 'image-s2', 'image-s3'], 'Maya has a picture, so only Theo is drawn; the end card scene is skipped');
  assert.ok(orders.findIndex((x) => x.piece === 'anchor-b') < orders.findIndex((x) => x.piece === 'image-s2'), 'anchors come before the scenes that send them');

  // The anchor: prompt alone, square, the template's anchor text with the member's look.
  assert.equal(o['anchor-b'].path, 'fal-ai/nano-banana');
  assert.equal(o['anchor-b'].body.aspect_ratio, '1:1');
  assert.equal(o['anchor-b'].body.image_urls, undefined);
  assert.match(o['anchor-b'].body.prompt, /portrait of Theo: man, 41, grey beard, navy crewneck/);
  assert.match(o['anchor-b'].body.prompt, /stylised 3D/);

  // s1: the speaker's own picture, then the only product's photo.
  const maya = inputs.cast[0].image.sha256;
  const photo = inputs.products[0].images[0].sha256;
  assert.equal(o['image-s1'].path, 'fal-ai/nano-banana/edit');
  assert.deepEqual(o['image-s1'].body.image_urls.map((r) => r.sha256), [maya, photo]);
  assert.match(o['image-s1'].body.prompt, /glossy 3D, subsurface skin\. Maya at the stove, tired\. Maya: woman, 34/);
  assert.match(o['image-s1'].body.prompt, /Avoid: text, watermark, extra fingers/);
  assert.equal(o['image-s1'].body.aspect_ratio, '9:16');

  // s2 names two members: one strip of both anchors, said in the prompt.
  const s2 = o['image-s2'].body;
  assert.equal(s2.image_urls.length, 2, 'one strip and the product photo');
  const strip = s2.image_urls[0];
  assert.equal(strip.kind, 'file');
  assert.notEqual(strip.sha256, maya);
  const size = await probe(strip.path);
  assert.ok(size.width > size.height, 'the strip is wider than tall');
  assert.match(s2.prompt, /Reference image 1 shows the characters side by side \(Maya, Theo\)/);
  assert.match(s2.prompt, /no panels, no dividing lines/);

  // s3: the Product tag sends only the product photo and drops the tag from the prompt.
  assert.deepEqual(o['image-s3'].body.image_urls.map((r) => r.sha256), [photo]);
  assert.match(o['image-s3'].body.prompt, /^stylised 3D, soft light\. the Morning Mist Green Tea pouch on the counter\. The product exactly as in the reference photo/);

  // Outputs by scene id and member key.
  assert.deepEqual(out.images.map((i) => i.id), ['s1', 's2', 's3']);
  for (const img of out.images) assert.equal(readFileSync(img.image.path).subarray(0, 8).toString('hex'), PNG);
  assert.deepEqual(out.scenes.map((s) => [s.id, s.image ? s.image.sha256 : null]), [
    ['s1', out.images[0].image.sha256],
    ['s2', out.images[1].image.sha256],
    ['s3', out.images[2].image.sha256],
    ['s4', null],
  ]);
  assert.equal(out.cast[0].image.sha256, maya, 'a member with a picture passes through');
  assert.equal(out.cast[1].image.kind, 'file', 'the drawn anchor fills the member');
  assert.equal(out.cast[1].voice_id, 'TxGEqnHWrfWFTfGW9XjX', 'other member fields pass through');
  assert.deepEqual(out.anchors.map((a) => a.id), ['a', 'b']);
});

test('null line: a scene with no line, no on_screen and only a picture gets a still', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
  const out = await mod.run({ model: 'fal-ai/nano-banana', scenes: [{ id: 'quiet', line: null, on_screen: null, picture: 'an empty kitchen at dawn' }, { id: 'end', line: null }], pick: 'with_picture' }, ctx);
  assert.deepEqual(orders.map((o) => [o.piece, o.path, o.body.prompt]), [['image-quiet', 'fal-ai/nano-banana', 'an empty kitchen at dawn']]);
  assert.deepEqual(out.images.map((i) => i.id), ['quiet']);
  assert.equal(out.scenes[1].image, undefined, 'the scene without a picture is left as it was');
  assert.deepEqual([out.cast, out.anchors], [[], []], 'without a cast, cast and anchors are still there, empty, so a style can bind them');
  void work;
});

test('refuses before ordering: a scene the template cannot fill, an anchor without a look, bad mode mixes', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const base = await scenesInputs(work);
  const cases = [
    [{ ...base, template: await writeTemplate(work, { ...template, scene: '{picture}. {answers.room}' }, 'room.prompt.json') }, /scene s1 needs \{answers\.room\}/],
    [{ ...base, cast: [base.cast[0], { key: 'b', name: 'Theo', look: '' }] }, /cast b needs \{look\}/],
    [{ ...base, look: 'anime' }, /"anime" is not one of/],
    [{ ...base, model: 'fal-ai/nano-banana' }, /anchor cast needs fal-ai\/nano-banana\/edit/],
    [{ ...base, anchor: 'none', model: 'fal-ai/nano-banana', style_refs: [base.products[0].images[0]] }, /style_refs need/],
    [{ ...base, images: [{ prompt: 'x' }] }, /not both/],
    [{ ...base, scenes: [{ id: 's1', picture: 'a' }, { id: 's1', picture: 'b' }], skip_last: 0 }, /two scenes have the id s1/],
    [{ ...base, pick: 'first', skip_first: 4, skip_last: 0 }, /no scene is picked/],
    [{ model: 'fal-ai/nano-banana/edit', mode: 'images', images: [{ prompt: 'x', references: [base.products[0].images[0]] }], anchor: 'cast' }, /anchor works only in scenes mode/],
    [{ model: 'fal-ai/nano-banana/edit', mode: 'scenes' }, /scenes mode needs scenes/],
    [{ ...base, scenes: [{ id: 's1', line: 'hi', picture: null }], skip_last: 0, template: undefined }, /scene s1 needs \{picture\}/],
  ];
  for (const [inputs, why] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    for (const k of Object.keys(inputs)) if (inputs[k] === undefined) delete inputs[k];
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && why.test(e.message), String(why));
    assert.equal(orders.length, 0, `nothing is ordered for ${why}`);
  }
});

test('multi_ref list sends up to 3 separate anchors; first_scene makes the first still a reference for the rest', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const base = await scenesInputs(work);
  const style = await fileRef(await makeImage(join(work, 'line-style.png')), 'image');
  {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    await mod.run({ ...base, multi_ref: 'list' }, ctx);
    const s2 = byPiece(orders)['image-s2'].body;
    assert.equal(s2.image_urls.length, 3, 'Maya, Theo and the product photo');
    assert.doesNotMatch(s2.prompt, /side by side/);
  }
  {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    const out = await mod.run({ ...base, anchor: 'first_scene', style_refs: [style] }, ctx);
    assert.equal(orders[0].piece, 'image-s1', 'no anchor is drawn and the first scene goes first');
    assert.ok(!orders.some((o) => o.piece.startsWith('anchor-')));
    const first = out.images[0].image.sha256;
    const o = byPiece(orders);
    assert.equal(o['image-s1'].body.image_urls.at(-1).sha256, style.sha256, 'style references go last');
    for (const p of ['image-s2', 'image-s3']) {
      const shas = o[p].body.image_urls.map((r) => r.sha256);
      assert.deepEqual(shas.slice(-2), [first, style.sha256], `${p} sends the first still, then the style reference`);
    }
    assert.ok(!o['image-s2'].body.prompt.includes('side by side'), 'Theo has no picture, so there is no strip');
    assert.deepEqual(out.anchors.map((a) => a.id), ['a'], 'only members with a picture are anchors');
  }
});

test('the strip holds every named member, even past the 3-picture list', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const names = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];
  const cast = [];
  for (const [i, name] of names.entries()) cast.push({ key: `k${i}`, name, look: `${name} look`, image: await fileRef(await makeImage(join(work, `${name}.png`)), 'image') });
  const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
  await mod.run({ model: 'fal-ai/nano-banana/edit', cast, scenes: [{ id: 'lineup', picture: `${names.join(', ')} in a loose staggered group` }] }, ctx);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].body.image_urls.length, 1, 'one strip');
  const size = await probe(orders[0].body.image_urls[0].path);
  assert.ok(size.width >= size.height * 5 - 10, `five 4:3 pictures side by side (${size.width}x${size.height})`);
  assert.match(orders[0].body.prompt, /\(Ana, Bo, Cy, Dee, Eli\)/);
});

test('a provider failure stops new pieces', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const scenes = Array.from({ length: 12 }, (_, i) => ({ id: `s${i + 1}`, picture: `shot ${i + 1}` }));
  let calls = 0;
  const line = async (order, ctx) => {
    calls++;
    if (order.piece === 'image-s1') throw ctx.error('provider_failed', 'boom');
    return pngLine(order, ctx);
  };
  const { ctx } = makeCtx({ partDir: dir, line });
  await assert.rejects(mod.run({ model: 'fal-ai/nano-banana', scenes }, ctx), (e) => e.code === 'provider_failed');
  assert.ok(calls <= 4, `only the pieces already running finish (${calls})`);
  void work;
});

test('falReply has the shape the line reads the picture from', () => {
  assert.equal(falReply('x.png').images[0].url.endsWith('x.png'), true);
});

// ---- 1.2.0 products mode ----

test('fixture: products mode edits each product photo once per kind, keyed <product>-<kind>', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const inputs = await productsInputs(work);
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'step'), line: pngLine });
  const out = await mod.run(inputs, ctx);
  const o = byPiece(orders);
  assert.deepEqual(Object.keys(o).sort(), ['angled-garden', 'angled-hearth', 'angled-mist', 'snap-garden', 'snap-hearth', 'snap-mist']);

  for (const [i, p] of inputs.products.entries()) {
    for (const kind of ['snap', 'angled']) {
      const order = o[`${kind}-${p.id}`];
      assert.equal(order.provider, 'fal');
      assert.equal(order.path, 'fal-ai/nano-banana/edit');
      assert.deepEqual(order.body.image_urls.map((r) => [r.kind, r.sha256]), [['file', p.images[0].sha256]], `${kind}-${p.id} sends only its own photo, as a file`);
      assert.equal(order.body.aspect_ratio, '9:16');
      // The body is the recorded NanoBananaEditInput shape, and the line reads the recorded result pointer.
      for (const key of Object.keys(order.body)) assert.ok(EDIT_FIELDS.includes(key), `${key} is a NanoBananaEditInput field`);
      for (const key of EDIT_REQUIRED) assert.ok(order.body[key] != null, `${key} is sent`);
      assert.equal(order.results[0].pointer, EDIT_POINTER);
      assert.match(order.body.prompt, new RegExp(`^The ${inputs.products[i].name} exactly as in the reference photo`));
      assert.match(order.body.prompt, /vertical 9:16, no text, no logos added/, 'the top-level suffix applies to every kind');
    }
  }
  assert.match(o['snap-mist'].body.prompt, /one complete product on a pale oak shelf, soft key light/);
  assert.match(o['snap-mist'].body.prompt, /Avoid: hands, extra products, changed label$/);
  assert.match(o['angled-mist'].body.prompt, /three-quarter view, floating over warm white/);
  assert.match(o['angled-mist'].body.prompt, /Avoid: hands, a second product$/, 'a by_tag negative replaces the top-level one');

  assert.deepEqual(Object.keys(out), ['images'], 'products mode returns images only');
  assert.deepEqual(out.images.map((i) => i.id), ['mist-snap', 'mist-angled', 'hearth-snap', 'hearth-angled', 'garden-snap', 'garden-angled']);
  for (const img of out.images) assert.equal(readFileSync(img.image.path).subarray(0, 8).toString('hex'), PNG);
});

test('products mode without a template: snap only by default, the built-in texts and negative', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const base = await productsInputs(work);
  {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    const out = await mod.run({ model: base.model, mode: 'products', products: base.products, seed: 7 }, ctx);
    assert.deepEqual(orders.map((x) => x.piece), ['snap-mist', 'snap-hearth', 'snap-garden']);
    assert.deepEqual(out.images.map((i) => i.id), ['mist-snap', 'hearth-snap', 'garden-snap']);
    assert.match(orders[0].body.prompt, /^The Morning Mist Green Tea exactly as in the reference photo: the same shape, colours, pattern and label\. One complete product resting on a neutral textured surface/);
    assert.match(orders[0].body.prompt, /Avoid: text, captions, hands/);
    assert.equal(orders[0].body.seed, 7);
    assert.equal(orders[0].body.aspect_ratio, undefined, 'no aspect ratio unless one is given');
  }
  {
    // A template with only a lower-case snap rule: angled falls back to the built-in text; the scene text is not used.
    const tpl = await writeTemplate(work, { version: 1, scene: 'NOT USED {picture}', by_tag: { snap: { scene: 'Snap of {picture} on {answers.snap_surface}' } } }, 'snap-only.prompt.json');
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    await mod.run({ ...base, template: tpl, products: base.products.slice(0, 1) }, ctx);
    const o = byPiece(orders);
    assert.equal(o['snap-mist'].body.prompt, 'Snap of Morning Mist Green Tea on a pale oak shelf');
    assert.match(o['angled-mist'].body.prompt, /^The Morning Mist Green Tea exactly as in the reference photo: .*three-quarter view, floating over a warm white background/);
    assert.doesNotMatch(o['angled-mist'].body.prompt, /NOT USED|Avoid:/, 'a template without a negative adds none');
  }
});

test('products mode refuses before ordering: the prompt-only model, a product with no photo or name, a gap, scenes inputs, kinds elsewhere', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const base = await productsInputs(work);
  const [mist, hearth] = base.products;
  const cases = [
    [{ ...base, model: 'fal-ai/nano-banana' }, /products mode edits each product's photo, so it needs fal-ai\/nano-banana\/edit/],
    [{ ...base, products: [mist, { ...hearth, images: [] }] }, /product hearth has no photo to edit/],
    [{ ...base, products: [mist, { ...hearth, name: null }] }, /product hearth has no name/],
    [{ ...base, products: [mist, { ...hearth, id: 'mist' }] }, /two products have the id mist/],
    [{ ...base, answers: { range_reveal: 'one_by_one' } }, /the snap still of product mist needs \{answers\.snap_surface\}/],
    [{ ...base, template: await writeTemplate(work, { ...productsTemplate, by_tag: { Angled: { scene: '{line}' } } }, 'line.prompt.json') }, /the angled still of product mist needs \{line\}/],
    [{ ...base, products: [] }, /products mode needs products/],
    [{ ...base, scenes: [{ id: 's1', picture: 'x' }] }, /scenes does not work in products mode/],
    [{ ...base, anchor: 'cast' }, /anchor does not work in products mode/],
    [{ ...base, kinds: ['snap', 'snap'] }, /kinds/],
    [{ ...base, kinds: ['zoom'] }, /kinds/],
    [{ ...(await scenesInputs(work)), kinds: ['snap'] }, /kinds works only in products mode/],
    [{ ...(await sample.inputs(work)), kinds: ['snap'] }, /kinds works only in products mode/],
  ];
  for (const [inputs, why] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && why.test(e.message), String(why));
    assert.equal(orders.length, 0, `nothing is ordered for ${why}`);
  }
});

test('products mode: a provider failure stops new pieces', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const base = await productsInputs(work);
  const products = Array.from({ length: 6 }, (_, i) => ({ ...base.products[0], id: `p${i + 1}`, name: `Variant ${i + 1}` }));
  let calls = 0;
  const line = async (order, ctx) => {
    calls++;
    if (order.piece === 'snap-p1') throw ctx.error('provider_failed', 'boom');
    return pngLine(order, ctx);
  };
  const { ctx } = makeCtx({ partDir: dir, line });
  await assert.rejects(mod.run({ ...base, products }, ctx), (e) => e.code === 'provider_failed');
  assert.ok(calls <= 4, `only the pieces already running finish (${calls})`);
});

// ---- 1.3.0 cast mode ----

/** The cast of scenesInputs (Maya has a picture, Theo has none) as a style binds it for cast mode. */
async function castInputs(workDir, extra = {}) {
  const base = await scenesInputs(workDir);
  return { model: 'fal-ai/nano-banana', mode: 'cast', cast: base.cast, template: base.template, look: base.look, answers: base.answers, ...extra };
}

test('fixture: cast mode draws one portrait per member without a picture and no scene still', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const inputs = await castInputs(work, { cast_aspect_ratio: '9:16', seed: 11 });
  const maya = inputs.cast[0].image;
  const { ctx, orders, progress } = makeCtx({ partDir: dir, workDir: join(work, 'step'), line: pngLine });
  const out = await mod.run(inputs, ctx);

  // Only Theo is drawn: the prompt-only model, the template's anchor text with his look, at cast_aspect_ratio.
  assert.deepEqual(orders.map((o) => [o.piece, o.provider, o.path]), [['anchor-b', 'fal', 'fal-ai/nano-banana']]);
  const body = orders[0].body;
  assert.equal(body.image_urls, undefined, 'a portrait with no reference sends no pictures');
  assert.equal(body.aspect_ratio, '9:16');
  assert.equal(body.seed, 11);
  assert.match(body.prompt, /^stylised 3D, soft light\. portrait of Theo: man, 41, grey beard, navy crewneck, plain background, chest up\. vertical 9:16, no text, no logos\. Avoid: text, watermark, extra fingers$/);
  assert.equal(orders[0].results[0].pointer, EDIT_POINTER);
  assert.deepEqual(progress.at(-1), { done: 1, total: 1 });

  // The outputs a style binds: step.<id>.cast (every member, image filled) and step.<id>.anchors.
  assert.deepEqual(Object.keys(out), ['images', 'cast', 'anchors']);
  assert.deepEqual(out.images, [], 'cast mode draws no scene still');
  assert.deepEqual(out.cast.map((m) => m.key), ['a', 'b']);
  assert.deepEqual(out.cast[0], inputs.cast[0], 'a member with a picture passes through as it came');
  assert.equal(out.cast[1].image.kind, 'file', 'the drawn portrait fills the member');
  assert.equal(readFileSync(out.cast[1].image.path).subarray(0, 8).toString('hex'), PNG);
  assert.equal(out.cast[1].voice_id, 'TxGEqnHWrfWFTfGW9XjX', 'other member fields pass through');
  assert.equal(out.cast[1].look, inputs.cast[1].look);
  assert.deepEqual(out.anchors, [{ id: 'a', image: maya }, { id: 'b', image: out.cast[1].image }]);
});

test('cast mode is inferred from cast alone; defaults are 1:1 and the built-in anchor text; a full cast buys nothing', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const base = await castInputs(work);
  const [maya, theo] = base.cast;
  {
    // No mode, no template: square, the kit's default anchor text. The /edit model without style_refs still draws from the prompt alone.
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    const out = await mod.run({ model: 'fal-ai/nano-banana/edit', cast: [theo] }, ctx);
    assert.deepEqual(orders.map((o) => [o.piece, o.path]), [['anchor-b', 'fal-ai/nano-banana']]);
    assert.equal(orders[0].body.aspect_ratio, '1:1');
    assert.equal(orders[0].body.seed, undefined);
    assert.match(orders[0].body.prompt, /^man, 41, grey beard, navy crewneck\. One character alone, chest up, facing the camera/);
    assert.deepEqual(out.anchors.map((a) => a.id), ['b']);
  }
  {
    const { ctx, orders, logs } = makeCtx({ partDir: dir, line: pngLine });
    const out = await mod.run({ model: 'fal-ai/nano-banana', cast: [maya] }, ctx);
    assert.equal(orders.length, 0, 'every member has a picture: nothing is bought');
    assert.deepEqual(out, { images: [], cast: [maya], anchors: [{ id: 'a', image: maya.image }] });
    assert.ok(logs.some(([level, text]) => level === 'info' && /nothing is drawn/.test(text)));
  }
  {
    // style_refs go with every portrait, so those pieces are edits.
    const style = await fileRef(await makeImage(join(work, 'line-style.png')), 'image');
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    await mod.run({ ...base, model: 'fal-ai/nano-banana/edit', style_refs: [style] }, ctx);
    assert.deepEqual(orders.map((o) => [o.piece, o.path, o.body.image_urls.map((r) => r.sha256)]), [['anchor-b', 'fal-ai/nano-banana/edit', [style.sha256]]]);
  }
  {
    // Existing inputs resolve as before: images with a cast is still images mode, scenes with a cast still scenes mode.
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    await assert.rejects(mod.run({ model: 'fal-ai/nano-banana', images: [{ prompt: 'x' }], cast: [theo] }, ctx), (e) => e.code === 'bad_input' && /cast works only in scenes mode/.test(e.message));
    const out = await mod.run({ model: 'fal-ai/nano-banana', scenes: [{ id: 's1', picture: 'an empty kitchen' }], cast: [maya] }, ctx);
    assert.deepEqual(orders.map((o) => o.piece), ['image-s1']);
    assert.deepEqual(Object.keys(out), ['images', 'scenes', 'cast', 'anchors']);
  }
});

test('cast mode refuses before ordering: an empty cast, scenes-only inputs, a member with no look, two members with one key', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const base = await castInputs(work);
  const [maya, theo] = base.cast;
  const scenes = (await scenesInputs(work)).scenes;
  const photo = (await scenesInputs(work)).products[0];
  const cases = [
    [{ model: base.model, mode: 'cast' }, /cast mode needs cast/],
    [{ ...base, cast: [] }, /cast mode needs cast/],
    [{ ...base, scenes }, /scenes does not work in cast mode/],
    [{ ...base, products: [photo] }, /products does not work in cast mode/],
    [{ ...base, pick: 'first' }, /pick does not work in cast mode/],
    [{ ...base, skip_last: 1 }, /skip_last does not work in cast mode/],
    [{ ...base, anchor: 'cast' }, /anchor does not work in cast mode/],
    [{ ...base, multi_ref: 'list' }, /multi_ref does not work in cast mode/],
    [{ ...base, aspect_ratio: '9:16' }, /aspect_ratio does not work in cast mode/],
    [{ ...base, kinds: ['snap'] }, /kinds works only in products mode/],
    [{ ...base, borders: 'keep' }, /borders works only in scenes and products mode/],
    [{ ...base, images: [{ prompt: 'x' }] }, /give cast or images, not both/],
    [{ ...base, style_refs: [maya.image] }, /style_refs need fal-ai\/nano-banana\/edit/],
    [{ ...base, cast: [maya, { key: 'b', name: 'Theo', look: '' }] }, /cast b needs \{look\}/],
    [{ ...base, cast: [theo, { ...theo }] }, /two cast members have the key b/],
    [{ ...base, look: 'anime' }, /"anime" is not one of/],
    [{ ...base, cast_aspect_ratio: '7:3' }, /cast_aspect_ratio/],
    [{ mode: 'cast', cast: base.cast }, /model/],
  ];
  for (const [inputs, why] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && why.test(e.message), String(why));
    assert.equal(orders.length, 0, `nothing is ordered for ${why}`);
  }
});

test('cast mode: a provider failure stops new pieces', { skip }, async () => {
  const cast = Array.from({ length: 10 }, (_, i) => ({ key: `m${i + 1}`, name: `Member ${i + 1}`, look: `look ${i + 1}` }));
  let calls = 0;
  const line = async (order, ctx) => {
    calls++;
    if (order.piece === 'anchor-m1') throw ctx.error('provider_failed', 'boom');
    return pngLine(order, ctx);
  };
  const { ctx } = makeCtx({ partDir: dir, line });
  await assert.rejects(mod.run({ model: 'fal-ai/nano-banana', mode: 'cast', cast }, ctx), (e) => e.code === 'provider_failed');
  assert.ok(calls <= 4, `only the pieces already running finish (${calls})`);
});
