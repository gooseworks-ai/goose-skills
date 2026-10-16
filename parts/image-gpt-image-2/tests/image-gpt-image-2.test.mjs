import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadNewest, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { QUALITY, REQUEST_FIELDS, REQUIRED, falAnswer, jpegLine, makeImage, pngLine, scenesInputs, sizeProblems, template, writeTemplate } from './fixture.mjs';

const { dir, mod } = await loadNewest('image-gpt-image-2');
const manifest = JSON.parse(readFileSync(join(dir, 'part.json'), 'utf8'));
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const PNG = '89504e470d0a1a0a';
const byPiece = (orders) => Object.fromEntries(orders.map((o) => [o.piece, o]));
const work = () => mkdtempSync(join(tmpdir(), 'gi-'));

/** Every order fits the recorded fal request: known fields only, required ones present, a valid size and quality. */
function assertFitsContract(order) {
  assert.equal(order.provider, 'fal');
  const fields = REQUEST_FIELDS[order.path];
  assert.ok(fields, `${order.path} is a recorded model`);
  for (const k of Object.keys(order.body)) assert.ok(fields.includes(k), `${order.path} accepts ${k}`);
  for (const k of REQUIRED[order.path]) assert.ok(order.body[k] !== undefined, `${order.path} needs ${k}`);
  assert.deepEqual(sizeProblems(order.body.image_size), [], `${JSON.stringify(order.body.image_size)} is a valid image_size`);
  assert.ok(QUALITY.includes(order.body.quality));
  assert.equal(order.body.num_images, 1);
  assert.ok(order.body.prompt.length >= 2 && order.body.prompt.length <= 32000);
  if (order.body.image_urls) for (const r of order.body.image_urls) assert.equal(r.kind, 'file', 'references go to the core as files, never links');
  assert.deepEqual(order.results, [{ pointer: '/json/images/0/url', name: `${order.piece}-raw.png`, media: 'image' }]);
}

test('every size the part offers is one fal accepts', () => {
  for (const size of manifest.inputs.properties.size.enum) {
    const [width, height] = size.split('x').map(Number);
    assert.deepEqual(sizeProblems({ width, height }), [], size);
  }
  assert.deepEqual(manifest.needs.models.map((m) => m.model), ['openai/gpt-image-2', 'openai/gpt-image-2/edit']);
});

test('fixture: scenes mode draws the missing anchor, then one still per picked scene, every order the recorded fal shape', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w);
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: pngLine });
  const out = await mod.run(inputs, ctx);
  for (const o of orders) assertFitsContract(o);
  const o = byPiece(orders);
  assert.deepEqual(Object.keys(o).sort(), ['anchor-b', 'image-s1', 'image-s2', 'image-s3'], 'Maya has a picture, so only Theo is drawn; the end card scene is skipped');
  assert.ok(orders.findIndex((x) => x.piece === 'anchor-b') < orders.findIndex((x) => x.piece === 'image-s2'), 'anchors come before the scenes that send them');

  // The anchor: prompt alone, at the step's size and quality, the template's anchor text with the member's look.
  assert.equal(o['anchor-b'].path, 'openai/gpt-image-2');
  assert.deepEqual(o['anchor-b'].body.image_size, { width: 1088, height: 1920 });
  assert.equal(o['anchor-b'].body.quality, 'high');
  assert.equal(o['anchor-b'].body.image_urls, undefined);
  assert.match(o['anchor-b'].body.prompt, /portrait of Theo: man, 41, grey beard, navy crewneck/);

  // s1: the speaker's own picture, then the only product's photo.
  const maya = inputs.cast[0].image.sha256;
  const photo = inputs.products[0].images[0].sha256;
  assert.equal(o['image-s1'].path, 'openai/gpt-image-2/edit');
  assert.deepEqual(o['image-s1'].body.image_urls.map((r) => r.sha256), [maya, photo]);
  assert.match(o['image-s1'].body.prompt, /^candid iPhone photo, natural light, real skin texture\. Maya at the stove, tired\. Maya: woman, 34/);
  assert.match(o['image-s1'].body.prompt, /Avoid: text, watermark, extra fingers, plastic skin/);
  assert.deepEqual(o['image-s1'].body.image_size, { width: 1088, height: 1920 }, 'edit pieces send the size too (its default is auto)');

  // s2 names two members: one strip of both anchors, said in the prompt.
  const s2 = o['image-s2'].body;
  assert.equal(s2.image_urls.length, 2, 'one strip and the product photo');
  const size = await probe(s2.image_urls[0].path);
  assert.ok(size.width > size.height, 'the strip is wider than tall');
  assert.match(s2.prompt, /Reference image 1 shows the characters side by side \(Maya, Theo\)/);

  // s3: the Product tag sends only the product photo.
  assert.deepEqual(o['image-s3'].body.image_urls.map((r) => r.sha256), [photo]);

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
  assert.equal(falAnswer().json.images[0].url, 'https://v3b.fal.media/files/b/fixture/still.png', 'the fake answers as recorded');
});

test('null line: a scene with no line, no on_screen and only a picture gets a still', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
  const out = await mod.run({ scenes: [{ id: 'quiet', line: null, on_screen: null, picture: 'an empty kitchen at dawn' }, { id: 'end', line: null }], pick: 'with_picture', size: '1024x1792', quality: 'medium' }, ctx);
  assert.deepEqual(orders.map((o) => [o.piece, o.path, o.body.prompt]), [['image-quiet', 'openai/gpt-image-2', 'an empty kitchen at dawn']], 'no references, so the prompt-only model draws it');
  assertFitsContract(orders[0]);
  assert.deepEqual([orders[0].body.image_size, orders[0].body.quality], [{ width: 1024, height: 1792 }, 'medium']);
  assert.deepEqual(out.images.map((i) => i.id), ['quiet']);
  assert.equal(out.scenes[1].image, undefined, 'the scene without a picture is left as it was');
  assert.deepEqual([out.cast, out.anchors], [[], []], 'without a cast, cast and anchors are still there, empty');
});

test('cast mode: members with a picture pass through free, the rest are drawn as plain photo portraits', { skip }, async () => {
  const w = work();
  const maya = await fileRef(await makeImage(join(w, 'maya.png')), 'image');
  const cast = [
    { key: 'creator', name: 'Jess', look: 'woman, 28, freckles, messy bun, grey hoodie' },
    { key: 'friend', name: 'Maya', look: 'curly hair', image: maya },
  ];
  {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    const out = await mod.run({ cast }, ctx);
    assert.deepEqual(orders.map((o) => [o.piece, o.path]), [['anchor-creator', 'openai/gpt-image-2']]);
    assertFitsContract(orders[0]);
    assert.deepEqual(orders[0].body.image_size, { width: 1088, height: 1920 }, 'default size: vertical 9:16');
    assert.equal(orders[0].body.quality, 'high', 'default quality: high');
    // 1.2.0: the server's phone-camera creator recipe, never a plain wall.
    assert.match(orders[0].body.prompt, /^A single frame of a candid vertical iPhone front-camera selfie video, not a commercial, not a studio shoot, of one person: woman, 28, freckles, messy bun, grey hoodie\. Chest-up/);
    assert.match(orders[0].body.prompt, /lived-in room/);
    assert.match(orders[0].body.prompt, /deep focus, no bokeh/);
    assert.match(orders[0].body.prompt, /no skin smoothing, no beauty filter, no cinematic grade/);
    assert.doesNotMatch(orders[0].body.prompt, /in front of a plain light wall|soft even daylight/);
    assert.deepEqual(out.images, []);
    assert.deepEqual(out.anchors.map((a) => a.id), ['creator', 'friend']);
    assert.equal(out.cast[1].image.sha256, maya.sha256);
    assert.equal(out.cast[0].image.kind, 'file');
  }
  {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    const out = await mod.run({ cast: [cast[1]] }, ctx);
    assert.equal(orders.length, 0, 'every member has a picture: nothing is bought');
    assert.deepEqual(out.anchors, [{ id: 'friend', image: maya }]);
  }
  {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    await mod.run({ mode: 'cast', cast: [cast[0]], size: '2304x1296', cast_size: '1024x1024', template: await writeTemplate(w) }, ctx);
    assert.deepEqual(orders[0].body.image_size, { width: 1024, height: 1024 }, 'cast_size wins for anchors');
    assert.match(orders[0].body.prompt, /^candid iPhone photo.*portrait of Jess: woman, 28/);
  }
});

test('images mode: references go to /edit, none to the prompt-only model, and JPEG bytes come back as PNG', { skip }, async () => {
  const w = work();
  const ref = await fileRef(await makeImage(join(w, 'product.png')), 'image');
  const { ctx, orders } = makeCtx({ partDir: dir, line: jpegLine });
  const out = await mod.run({ size: '2304x1296', quality: 'low', images: [{ id: 'hero', prompt: 'the product on a sunlit counter', references: [ref] }, { prompt: 'a sunlit kitchen, nobody in it' }] }, ctx);
  assert.deepEqual(orders.map((o) => [o.piece, o.path]), [['image-hero', 'openai/gpt-image-2/edit'], ['image-2', 'openai/gpt-image-2']]);
  for (const o of orders) assertFitsContract(o);
  assert.deepEqual(orders[0].body.image_size, { width: 2304, height: 1296 });
  assert.deepEqual(out.images.map((i) => i.id), ['hero', '2']);
  for (const img of out.images) assert.equal(readFileSync(img.image.path).subarray(0, 8).toString('hex'), PNG);
  assert.deepEqual(Object.keys(out), ['images']);
});

test('refuses before ordering: a scene the template cannot fill, an anchor without a look, bad mode mixes, unknown inputs', { skip }, async () => {
  const w = work();
  const base = await scenesInputs(w);
  const ref = base.products[0].images[0];
  const cases = [
    [{ ...base, template: await writeTemplate(w, { ...template, scene: '{picture}. {answers.room}' }, 'room.prompt.json') }, /scene s1 needs \{answers\.room\}/],
    [{ ...base, cast: [base.cast[0], { key: 'b', name: 'Theo', look: '' }] }, /cast b needs \{look\}/],
    [{ ...base, model: 'openai/gpt-image-2' }, /anchor cast needs openai\/gpt-image-2\/edit/],
    [{ ...base, anchor: 'none', model: 'openai/gpt-image-2', style_refs: [ref] }, /style_refs need/],
    [{ ...base, images: [{ prompt: 'xy' }] }, /not both/],
    [{ ...base, scenes: [{ id: 's1', picture: 'a' }, { id: 's1', picture: 'b' }], skip_last: 0 }, /two scenes have the id s1/],
    [{ ...base, pick: 'first', skip_first: 4, skip_last: 0 }, /no scene is picked/],
    [{ ...base, size: '1080x1920' }, /size/],
    [{ ...base, quality: 'auto' }, /quality/],
    [{ ...base, seed: 7 }, /seed/],
    [{ ...base, aspect_ratio: '9:16' }, /aspect_ratio/],
    [{ mode: 'images', images: [{ prompt: 'xy', references: [ref] }], anchor: 'cast' }, /anchor does not work in images mode/],
    [{ model: 'openai/gpt-image-2', images: [{ prompt: 'xy', references: [ref] }] }, /has reference images/],
    [{ mode: 'scenes' }, /scenes mode needs scenes/],
    [{ mode: 'cast' }, /cast mode needs cast/],
    [{ cast: [{ key: 'c', name: 'Jess', look: null }] }, /cast c needs \{look\}/],
    [{ cast: base.cast, scenes_hint: 1 }, /scenes_hint/],
    [{ mode: 'cast', cast: base.cast, skip_last: 1 }, /skip_last does not work in cast mode/],
    [{ cast: [base.cast[1], { ...base.cast[1] }] }, /two cast members have the key b/],
    [{ ...base, scenes: [{ id: 's1', line: 'hi', picture: null }], skip_last: 0, template: undefined }, /scene s1 needs \{picture\}/],
  ];
  for (const [inputs, why] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    for (const k of Object.keys(inputs)) if (inputs[k] === undefined) delete inputs[k];
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && why.test(e.message), String(why));
    assert.equal(orders.length, 0, `nothing is ordered for ${why}`);
  }
});

test('refuses a prompt fal would reject before ordering: under 2 characters, or over 32,000 once the strip note is added', { skip }, async () => {
  const w = work();
  const base = await scenesInputs(w);
  // Without a template a scene's prompt is its picture text alone.
  const short = { mode: 'scenes', scenes: [{ id: 's1', picture: 'x' }] };
  // The template alone fits, but the scene naming both members gets a strip note that would pass 32,000.
  const scene = base.scenes[1];
  const filled = (await import('../../_lib/prompt.mjs')).kitPromptJoin([`${template.prefix}`, `${scene.picture}. Maya: ${base.cast[0].look}; Theo: ${base.cast[1].look}`, template.suffix, `Avoid: ${template.negative}`]);
  // Template fields stop at 8,000 characters each, so the padding is shared by four of them.
  const pad = Math.floor((32000 - filled.length - 120) / 4) - 1;
  const fill = (text) => `${'p'.repeat(pad)} ${text}`;
  const long = { ...template, prefix: fill(template.prefix), scene: fill(template.scene), suffix: fill(template.suffix), negative: fill(template.negative) };
  const strip = { ...base, anchor: 'none', scenes: [scene], skip_last: 0, template: await writeTemplate(w, long, 'long.prompt.json') };
  for (const [inputs, why] of [[short, /under 2 characters/], [strip, /over 32000 characters/]]) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && why.test(e.message), String(why));
    assert.equal(orders.length, 0, `nothing is ordered for ${why}`);
  }
  // The same scene sent as a list (no strip note) fits and is drawn.
  const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
  await mod.run({ ...strip, multi_ref: 'list' }, ctx);
  assert.equal(orders.length, 1);
  assert.ok(orders[0].body.prompt.length <= 32000);
});

test('a provider failure stops new pieces', { skip }, async () => {
  const scenes = Array.from({ length: 12 }, (_, i) => ({ id: `s${i + 1}`, picture: `shot ${i + 1}` }));
  let calls = 0;
  const line = async (order, ctx) => {
    calls++;
    if (order.piece === 'image-s1') throw ctx.error('provider_failed', 'boom');
    return pngLine(order, ctx);
  };
  const { ctx } = makeCtx({ partDir: dir, line });
  await assert.rejects(mod.run({ scenes }, ctx), (e) => e.code === 'provider_failed');
  assert.ok(calls <= 4, `only the pieces already running finish (${calls})`);
});
