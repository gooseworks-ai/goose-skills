// image-gpt-image-2 1.4.0 same_look: a Hold N scene is drawn with the still of the first Look N scene, so the
// outfit, hair and room match (GOOSE-4034: two Hold 1 shots of one montage came out in different tops and kitchens).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadNewest, makeCtx } from '../../_tools/kit-harness.mjs';
import { makeImage, pngLine, writeTemplate } from './fixture.mjs';
import { giLookSource, giLookTag } from '../src/part.mjs';

const { dir, mod } = await loadNewest('image-gpt-image-2');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const work = () => mkdtempSync(join(tmpdir(), 'gi-look-'));

test('look tags: Look N and Hold N in any case or spacing; a Hold finds the first Look with its number', () => {
  const s = (shot) => ({ id: shot, picture: 'x', extra: { shot } });
  assert.deepEqual(giLookTag(s('Look 2')), { kind: 'look', n: 2 });
  assert.deepEqual(giLookTag(s('hold1')), { kind: 'hold', n: 1 });
  assert.equal(giLookTag(s('Product')), null);
  const jobs = [s('Look 1'), s('Hold 1'), s('Hold 2'), s('Look 2'), s('Look 1')].map((scene, i) => ({ id: `j${i}`, scene }));
  assert.equal(giLookSource(jobs, jobs[1]), 'j0', 'the first Look 1');
  assert.equal(giLookSource(jobs, jobs[2]), 'j3', 'a Look later in the plan still counts');
  assert.equal(giLookSource(jobs, jobs[0]), null, 'a Look copies nothing');
});

async function inputs(w, extra = {}) {
  const maya = await fileRef(await makeImage(join(w, 'maya.png')), 'image');
  const scene = (id, shot, picture) => ({ id, line: null, on_screen: null, picture, speaker: 'a', extra: { shot } });
  return {
    model: 'openai/gpt-image-2/edit',
    mode: 'scenes',
    size: '1088x1920',
    quality: 'high',
    template: await writeTemplate(w, { version: 1, scene: '{picture}', refs: ['anchor'] }),
    cast: [{ key: 'a', name: 'Maya', look: 'woman, 34, curly dark hair', image: maya }],
    scenes: [
      scene('s1', 'Look 1', 'Maya leans on the kitchen counter'),
      scene('s2', 'Hold 1', 'Maya shows the tea tin'),
      scene('s3', 'Hold 2', 'Maya lifts the tea tin on the sofa'),
      scene('s4', 'Look 2', 'Maya curls up on the sofa'),
      scene('s5', 'Hold 3', 'Maya shows the tea tin outside'),
    ],
    same_look: true,
    ...extra,
  };
}

test('same_look: the looks a Hold copies are drawn first, and each Hold sends its look still, named in the prompt', { skip }, async () => {
  const w = work();
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: pngLine });
  const out = await mod.run(await inputs(w), ctx);
  const at = (piece) => orders.findIndex((o) => o.piece === piece);
  for (const look of ['image-s1', 'image-s4']) for (const hold of ['image-s2', 'image-s3']) assert.ok(at(look) < at(hold), `${look} before ${hold}`);
  const still = (id) => out.images.find((i) => i.id === id).image.sha256;
  const o = Object.fromEntries(orders.map((x) => [x.piece, x.body]));
  assert.deepEqual(o['image-s2'].image_urls.map((r) => r.sha256).slice(-1), [still('s1')], 'Hold 1 sends Look 1');
  assert.deepEqual(o['image-s3'].image_urls.map((r) => r.sha256).slice(-1), [still('s4')], 'Hold 2 sends Look 2, drawn first');
  assert.match(o['image-s2'].prompt, /Reference image 2 is this same person in this same look: the same outfit, hair, room and light/);
  assert.equal(o['image-s5'].image_urls.length, 1, 'Hold 3 has no Look 3: only the cast picture');
  assert.doesNotMatch(o['image-s5'].prompt, /same look/);
  assert.equal(o['image-s1'].image_urls.length, 1, 'a Look sends only the cast picture');
});

test('same_look is refused with anchor first_scene and with the prompt-only model', { skip }, async () => {
  const w = work();
  const { ctx } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: pngLine });
  await assert.rejects(mod.run(await inputs(w, { anchor: 'first_scene' }), ctx), (e) => e.code === 'bad_input' && /same_look and anchor first_scene/.test(e.message));
  await assert.rejects(mod.run(await inputs(w, { model: 'openai/gpt-image-2' }), ctx), (e) => e.code === 'bad_input' && /same_look needs/.test(e.message));
});
