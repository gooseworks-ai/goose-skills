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
