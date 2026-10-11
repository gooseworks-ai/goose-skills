import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, loadNewest, hasFfmpeg, loadPart, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { falReply, makeImage, pngLine, sample, scenesInputs, template, writeTemplate } from './fixture.mjs';

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

test('images mode is still the 1.0.1 behaviour in 1.0.1 and 1.1.0', { skip }, async () => {
  for (const version of ['1.0.1', '1.1.0']) {
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
