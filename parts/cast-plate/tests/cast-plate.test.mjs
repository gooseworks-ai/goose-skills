import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { countColor, fileRef, framePixels, hasFfmpeg, loadNewest, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { plateCropProblem, plateCrops, plateSize } from '../src/plate.mjs';
import { fakeLine, personStill, RECORDED_ANSWER, RECORDED_POINTER, sample } from './fixture.mjs';

const { dir, mod } = await loadNewest('cast-plate');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const TEXT = 'openai/gpt-image-2';
const EDIT = 'openai/gpt-image-2/edit';

async function runWith(inputs, line = sample.line) {
  const h = makeCtx({ partDir: dir, line });
  const out = await mod.run(typeof inputs === 'function' ? await inputs(h.ctx) : inputs, h.ctx);
  return { ...h, out };
}

async function refused(inputs, pattern) {
  const h = makeCtx({ partDir: dir, line: () => assert.fail('nothing may be ordered for a refused plate') });
  const given = typeof inputs === 'function' ? await inputs(h.ctx) : inputs;
  await assert.rejects(mod.run(given, h.ctx), (e) => e.code === 'bad_input' && (!pattern || pattern.test(e.message)), `refused: ${pattern}`);
  assert.equal(h.orders.length, 0);
}

test('the fixture answers in the recorded gpt-image-2 shape, read at the recorded pointer', { skip }, async () => {
  const { orders, out } = await runWith(await sample.inputs());
  assert.equal(orders.length, 1);
  assert.equal(orders[0].results[0].pointer, RECORDED_POINTER);
  assert.deepEqual(Object.keys(RECORDED_ANSWER.json.images[0]).sort(), ['content_type', 'file_name', 'file_size', 'height', 'url', 'width']);
  assert.equal(out.plate.kind, 'file');
});

test('no cast image: one text-to-image piece with the recorded request fields and the seats in the prompt', { skip }, async () => {
  const { orders, out } = await runWith(await sample.inputs());
  const { piece, provider, path, body } = orders[0];
  assert.equal(piece, 'plate');
  assert.equal(provider, 'fal');
  assert.equal(path, TEXT);
  assert.deepEqual(Object.keys(body).sort(), ['image_size', 'num_images', 'output_format', 'prompt', 'quality']);
  assert.deepEqual(body.image_size, { width: 2304, height: 1296 });
  assert.equal(body.quality, 'high');
  assert.equal(body.num_images, 1);
  assert.match(body.prompt, /two podcast hosts/);
  assert.match(body.prompt, /LEFT, face centred about 30%[^.]*: Maya, woman, 34, curly dark hair, olive overshirt\./);
  assert.match(body.prompt, /RIGHT, face centred about 70%[^.]*: Theo, man, 41/);
  assert.match(body.prompt, /treated office corner with walnut slat panels/);
  assert.match(body.prompt, /unbranded/);
  assert.equal(out.prompt, body.prompt);
  assert.equal(out.layout, 'two_shot');
  assert.deepEqual(out.singles.map((s) => s.key), ['a', 'b']);
});

test('singles are full-height 9:16 slices cut at 30% and 70% of the plate', { skip }, async () => {
  const { out } = await runWith(await sample.inputs(), fakeLine({ paint: 'halves' }));
  assert.equal(out.plate.width, 2304);
  assert.equal(out.plate.height, 1296);
  for (const s of out.singles) {
    const info = await probe(s.image.path);
    assert.equal(info.width, 728);
    assert.equal(info.height, 1296);
  }
  const left = await framePixels(out.singles[0].image.path, 0, 91, 162);
  const right = await framePixels(out.singles[1].image.path, 0, 91, 162);
  assert.equal(countColor(left, [255, 0, 0], 40), 91 * 162, 'the left single is all left half');
  assert.equal(countColor(right, [0, 0, 255], 40), 91 * 162, 'the right single is all right half');
  assert.deepEqual(out.crops.map((c) => c.key), ['a', 'b']);
  assert.ok(Math.abs(out.crops[0].x + out.crops[0].w / 2 - 0.3) < 0.001);
  assert.ok(Math.abs(out.crops[1].x + out.crops[1].w / 2 - 0.7) < 0.001);
  assert.equal(out.crops[0].h, 1);
});

test('a cast image makes it an /edit piece with the images in seat order', { skip }, async () => {
  const { orders } = await runWith(async (ctx) => {
    const base = await sample.inputs();
    base.cast[1].image = await personStill(ctx.workDir);
    return base;
  });
  assert.equal(orders[0].path, EDIT);
  assert.equal(orders[0].body.image_urls.length, 1);
  assert.equal(orders[0].body.image_urls[0].kind, 'file');
  assert.deepEqual(orders[0].body.image_size, { width: 2304, height: 1296 }, '/edit defaults to auto, so the size is always sent');
  assert.match(orders[0].body.prompt, /RIGHT[^.]*: Theo, the person in reference image 1, with the same face, hair and clothes, man, 41/);
});

test('a cast picture the model cannot read (GIF) is turned into a PNG before it is sent', { skip }, async () => {
  const { orders } = await runWith(async (ctx) => {
    const base = await sample.inputs();
    const still = await personStill(ctx.workDir, 'person.gif');
    base.cast[0].image = { ...still, mime: 'image/gif' };
    base.cast[1].image = await personStill(ctx.workDir);
    return base;
  });
  const [first, second] = orders[0].body.image_urls;
  assert.equal(first.mime, 'image/png');
  assert.match(first.path, /ref-1\.png$/);
  assert.equal(second.mime, 'image/png');
  assert.match(second.path, /person\.png$/, 'a PNG is sent as given');
});

test('three_shot seats three people at 20%, 50% and 80%', { skip }, async () => {
  const { orders, out } = await runWith(async () => {
    const base = await sample.inputs();
    base.cast.push({ key: 'c', name: 'Ines', look: 'woman, 58, silver bob, red cardigan' });
    delete base.layout;
    return base;
  });
  assert.match(orders[0].body.prompt, /three podcast hosts/);
  assert.match(orders[0].body.prompt, /CENTRE, face centred about 50%[^.]*: Theo/);
  assert.equal(out.layout, 'three_shot');
  assert.deepEqual(out.singles.map((s) => s.key), ['a', 'b', 'c']);
  const centres = out.crops.map((c) => c.x + c.w / 2);
  assert.deepEqual(centres.map((c) => Math.round(c * 100)), [20, 50, 80]);
});

test('a plate that comes back at another size (the recorded 1088x1920 reply) is scaled to cover the asked size', { skip }, async () => {
  const size = { width: RECORDED_ANSWER.json.images[0].width, height: RECORDED_ANSWER.json.images[0].height };
  const { out, logs } = await runWith(await sample.inputs(), fakeLine({ size }));
  assert.equal(out.plate.width, 2304);
  assert.equal(out.plate.height, 1296);
  assert.ok(logs.some(([level, msg]) => level === 'warn' && /another size/.test(msg)));
});

test('a flat plate gives two identical singles and fails as output_invalid', { skip }, async () => {
  const h = makeCtx({ partDir: dir, line: fakeLine({ paint: 'flat' }) });
  await assert.rejects(mod.run(await sample.inputs(), h.ctx), (e) => e.code === 'output_invalid' && /same picture/.test(e.message));
});

test('a template replaces the body, fills the seating, room, answers and brand, and sends its negative as Avoid', { skip }, async () => {
  const { orders } = await runWith(async (ctx) => {
    const tpl = {
      version: 1,
      prefix: 'Photo for {brand.name}',
      templates: { plate: 'Two friends on a {answers.mood} afternoon in {answers.room}. {cast_looks}' },
      suffix: 'landscape, no text',
      negative: 'logos, watermark',
    };
    const path = join(ctx.workDir, 'plate.prompt.json');
    writeFileSync(path, JSON.stringify(tpl));
    return { ...(await sample.inputs()), template: await fileRef(path, 'json'), answers: { mood: 'rainy' }, brand: { name: 'Sample Goods' } };
  });
  const p = orders[0].body.prompt;
  assert.match(p, /^Photo for Sample Goods\. Two friends on a rainy afternoon in a treated office corner/);
  assert.match(p, /LEFT, face centred about 30%[^.]*: Maya/);
  assert.match(p, /landscape, no text\. Avoid: logos, watermark$/);
  assert.doesNotMatch(p, /podcast hosts/);
});

test('refusals: nothing is ordered for a cast, size, model or template the plate cannot use', { skip }, async () => {
  const base = await sample.inputs();
  await refused({}, /cast|room/);
  await refused({ ...base, not_an_input: 1 });
  await refused({ ...base, cast: [base.cast[0]] }, /cast/);
  await refused({ ...base, layout: 'three_shot' }, /three_shot seats 3 people; the cast has 2/);
  await refused({ ...base, cast: [base.cast[0], { key: 'b', name: 'Theo', look: '  ' }] }, /cast b needs a look/);
  await refused({ ...base, cast: [base.cast[0], { ...base.cast[0], key: 'b', look: 'Woman,  34, curly dark hair, olive overshirt' }] }, /twins/);
  await refused({ ...base, cast: [base.cast[0], { ...base.cast[1], key: 'a' }] }, /names a twice/);
  await refused({ ...base, room: '   ' }, /room is empty/);
  await refused({ ...base, size: '1296x2304' }, /landscape/);
  await refused({ ...base, size: '2300x1296' }, /multiples of 16/);
  await refused({ ...base, size: '3840x1024' }, /3:1/);
  await refused({ ...base, cast: [...base.cast, { key: 'c', name: 'Ines', look: 'woman, 58, silver bob' }], layout: 'three_shot', size: '1280x1024' }, /too narrow for three_shot/);
  await refused({ ...base, model: EDIT }, /needs at least one cast member with an image/);
  await refused(async (ctx) => ({ ...base, model: TEXT, cast: [{ ...base.cast[0], image: await personStill(ctx.workDir) }, base.cast[1]] }), /cannot take the cast's images/);
  const tplFile = async (ctx, tpl) => {
    const path = join(ctx.workDir, 't.prompt.json');
    writeFileSync(path, JSON.stringify(tpl));
    return fileRef(path, 'json');
  };
  await refused(async (ctx) => ({ ...base, template: await tplFile(ctx, { version: 1, templates: { plate: 'in {answers.mood} light. {cast_looks}' } }) }), /the plate needs \{answers\.mood\}/);
  await refused(async (ctx) => ({ ...base, template: await tplFile(ctx, { version: 1, banned: ['monstera'] }) }), /banned phrase "monstera"/);
  await refused(async (ctx) => ({ ...base, template: await tplFile(ctx, { version: 2 }) }), /version must be 1/);
});

test('plateSize and plateCrops keep gpt-image-2 limits and keep every slice inside the picture', () => {
  assert.deepEqual(plateSize('2304x1296'), { width: 2304, height: 1296 });
  assert.ok(plateSize('1024x1024').problem);
  assert.ok(plateSize('640x512').problem, 'under 655,360 pixels');
  assert.equal(plateCropProblem(2304, 1296, 'three_shot'), null);
  assert.equal(plateCropProblem(1536, 1024, 'three_shot'), null);
  assert.match(plateCropProblem(1280, 1024, 'three_shot'), /too narrow/);
  assert.equal(plateCropProblem(1280, 1024, 'two_shot'), null);
  for (const layout of ['two_shot', 'three_shot']) {
    for (const [w, h] of [[2304, 1296], [1536, 1024], [1280, 1024]]) {
      for (const c of plateCrops(w, h, layout)) {
        assert.ok(c.x >= 0 && c.x + c.w <= w, `${layout} ${w}x${h}`);
        assert.equal(c.w % 2, 0);
        assert.equal(c.h, h);
      }
    }
  }
});
