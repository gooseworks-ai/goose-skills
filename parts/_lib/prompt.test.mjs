import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { KitPromptGap, kitAnchorPrompt, kitLoadTemplate, kitPromptFill, kitPromptJoin, kitPromptTidy, kitScenePrompt, kitScenePrompts, kitTemplateFrom, kitTemplateProblems } from './prompt.mjs';
import { kitPickScenes } from './scene-match.mjs';
import { bundlePart } from '../_tools/bundle.mjs';

// The template from the plan (GOOSE-4015 master plan, section 4.3).
const TEMPLATE = {
  version: 1,
  prefix: 'stylised cartoon, rounded forms, soft light, toy-like',
  looks: { 'pixar-3d': 'glossy 3D, subsurface skin', claymation: 'hand-made clay, thumbprints' },
  scene: '{look}. {picture}. {cast_looks}',
  anchor: 'portrait of {name}: {look}, neutral background, chest up, eyes to camera',
  suffix: 'vertical 9:16, no text, no signage, no logos',
  negative: 'text, watermark, extra fingers',
  by_tag: {
    Product: { scene: '{picture}. The product exactly as in the reference photo, label unchanged.', refs: ['product'] },
    Cutaway: { refs: [] },
  },
  refs: ['anchor', 'product', 'scene_image'],
  max_refs: 4,
  motion: '{picture}. Subtle handheld motion, no zoom, no morph.',
};

const img = (name) => ({ kind: 'file', path: `/tmp/${name}.png`, mime: 'image/png' });
const cast = [
  { key: 'a', name: 'Maya', look: 'woman, 34, curly dark hair', image: img('maya') },
  { key: 'b', name: 'Theo', look: 'man, 41, grey beard', image: img('theo') },
];
const products = [{ id: 'p1', name: 'Fernhill Earl Grey', images: [img('earl')] }];
const base = { look: 'Pixar 3D', answers: { room: 'sunlit kitchen', mood: '' }, cast, products, brand: { name: 'Fernhill Tea Co.' } };

test('the plan template is valid; unknown keys, versions and placeholders are refused', () => {
  assert.deepEqual(kitTemplateProblems(TEMPLATE), []);
  assert.equal(kitTemplateFrom(TEMPLATE), TEMPLATE);
  const bad = kitTemplateProblems({ version: 2, sceen: 'x', scene: '{pictur}', anchor: '{name}', motion: '{name}', refs: ['logo'], max_refs: 11, by_tag: { Product: { refs: 'product', colour: 'red' } }, banned: [''] });
  const text = bad.join(' | ');
  for (const want of ['version must be 1', 'unknown key "sceen"', 'unknown placeholder {pictur}', 'motion: {name} only works in anchor', 'unknown reference "logo"', 'max_refs must be', 'by_tag.Product.refs must be a list', 'by_tag.Product: unknown key "colour"', 'banned must be']) {
    assert.ok(text.includes(want), `missing "${want}" in: ${text}`);
  }
  assert.deepEqual(kitTemplateProblems([]), ['the template must be a JSON object']);
  assert.match(kitTemplateProblems({ version: 1, looks: { 'Pixar 3D': 'a', 'pixar-3d': 'b' } }).join(), /are the same key/);
  assert.throws(() => kitTemplateFrom({ version: 1, scene: 3 }, 'frames/x.prompt.json'), /frames\/x\.prompt\.json: scene must be text/);
  // Braces that are not placeholders are plain text.
  assert.deepEqual(kitTemplateProblems({ version: 1, scene: 'a { b } {1,2} {Upper}' }), []);
});

test('a template file loads from a FileRef or a path, and a bad one names the file', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-prompt-'));
  const good = join(dir, 'stills.prompt.json');
  writeFileSync(good, JSON.stringify(TEMPLATE));
  assert.deepEqual(await kitLoadTemplate({ kind: 'file', path: good }), TEMPLATE);
  assert.deepEqual(await kitLoadTemplate(good), TEMPLATE);
  const notJson = join(dir, 'broken.prompt.json');
  writeFileSync(notJson, '{"version": 1,');
  await assert.rejects(kitLoadTemplate(notJson), /template broken\.prompt\.json: not JSON/);
  const wrong = join(dir, 'wrong.prompt.json');
  writeFileSync(wrong, JSON.stringify({ version: 1, extra: true }));
  await assert.rejects(kitLoadTemplate(wrong), /template wrong\.prompt\.json: unknown key "extra"/);
  const big = join(dir, 'big.prompt.json');
  writeFileSync(big, JSON.stringify({ version: 1, scene: 'x'.repeat(70 * 1024) }));
  await assert.rejects(kitLoadTemplate(big), /over 64 KB/);
  await assert.rejects(kitLoadTemplate(null), /no file/);
});

test('fill: required values refuse when empty, ? values may be empty, the text is tidied', () => {
  const values = { picture: 'the jar', 'answers.room': 'kitchen', 'answers.mood': '', look: '' };
  assert.equal(kitPromptFill('{picture} in the {answers.room}. {answers.mood?}. {look?}.', values), 'the jar in the kitchen.');
  assert.throws(
    () => kitPromptFill('{picture}, {answers.mood}', values, { who: 'scene s3', scene_id: 's3' }),
    (err) => err instanceof KitPromptGap && err.message === 'scene s3 needs {answers.mood}' && err.placeholder === '{answers.mood}' && err.scene_id === 's3' && err.kind === 'gap',
  );
  assert.throws(() => kitPromptFill('{answers.missing}', values), /the prompt needs \{answers\.missing\}/);
  assert.equal(kitPromptFill('{cast_looks}', {}, { optional: ['cast_looks'] }), '');
  // Numbers and booleans fill as text; a value that looks like a placeholder is not filled again.
  assert.equal(kitPromptFill('{answers.n} {answers.b} {picture}', { 'answers.n': 3, 'answers.b': false, picture: 'a {line} sign' }), '3 false a {line} sign');
});

test('tidy and join keep prompts clean', () => {
  assert.equal(kitPromptTidy('  . glossy 3D .  .  the jar , ,  done ;  '), 'glossy 3D. the jar, done');
  assert.equal(kitPromptTidy('9:16 at 1.5 s'), '9:16 at 1.5 s');
  assert.equal(kitPromptJoin(['a style', '', 'the jar.', 'vertical']), 'a style. the jar. vertical');
  assert.equal(kitPromptJoin(['one,', 'two']), 'one. two', 'a trailing comma is dropped, then a full stop joins');
});

test('a scene prompt: prefix, look, picture, named cast looks, suffix; refs in template order', () => {
  const scene = { id: 's2', speaker: 'a', picture: 'Maya and Theo laugh at the counter', line: 'No way.', on_screen: null };
  const out = kitScenePrompt(TEMPLATE, { ...base, scene, index: 1 });
  assert.equal(
    out.prompt,
    'stylised cartoon, rounded forms, soft light, toy-like. glossy 3D, subsurface skin. Maya and Theo laugh at the counter. Maya: woman, 34, curly dark hair; Theo: man, 41, grey beard. vertical 9:16, no text, no signage, no logos',
  );
  assert.equal(out.negative, 'text, watermark, extra fingers');
  assert.equal(out.tag, null);
  assert.deepEqual(out.refs.cast.map((m) => m.key), ['a', 'b']);
  // The plan has one product and the refs ask for "product": it counts as named.
  assert.deepEqual(out.refs.products.map((p) => p.id), ['p1']);
  assert.equal(out.refs.scene_image, null);
});

test('a tag rule replaces the scene text and refs, and {picture} drops the tag', () => {
  const scene = { id: 's3', picture: 'Product: the tin on oak, steam rising', line: 'This one.' };
  const out = kitScenePrompt(TEMPLATE, { ...base, scene, index: 2 });
  assert.equal(out.tag, 'Product');
  assert.equal(
    out.prompt,
    'stylised cartoon, rounded forms, soft light, toy-like. the tin on oak, steam rising. The product exactly as in the reference photo, label unchanged. vertical 9:16, no text, no signage, no logos',
  );
  assert.deepEqual(out.refs, { cast: [], products: [products[0]], scene_image: null });
  // Cutaway: no references at all.
  const cut = kitScenePrompt(TEMPLATE, { ...base, scene: { id: 's4', picture: 'Cutaway: rain on glass, Maya outside', speaker: 'a' }, index: 3 });
  assert.deepEqual(cut.refs, { cast: [], products: [], scene_image: null });
  assert.match(cut.prompt, /glossy 3D, subsurface skin\. rain on glass, Maya outside\. Maya: woman/);
  // An unknown tag keeps the whole picture text.
  const other = kitScenePrompt(TEMPLATE, { ...base, scene: { id: 's5', picture: 'Wide: the shop' }, index: 4 });
  assert.match(other.prompt, /Wide: the shop/);
});

test('refs stop at max_refs and anchors at three; scene images are sent when listed', () => {
  const many = [...cast, { key: 'c', name: 'Ana', look: 'x' }, { key: 'd', name: 'Bo', look: 'y' }];
  const scene = { id: 's1', picture: 'Maya, Theo, Ana and Bo hold Fernhill Earl Grey', image: img('own') };
  const out = kitScenePrompt(TEMPLATE, { ...base, cast: many, scene });
  assert.deepEqual(out.refs.cast.map((m) => m.key), ['a', 'b', 'c']);
  assert.deepEqual(out.refs.products.map((p) => p.id), ['p1']);
  assert.equal(out.refs.scene_image, null, 'max_refs 4 is used up');
  const roomy = kitScenePrompt({ ...TEMPLATE, max_refs: 10 }, { ...base, cast: many, scene });
  assert.deepEqual(roomy.refs.scene_image, img('own'));
  const sceneFirst = kitScenePrompt({ ...TEMPLATE, refs: ['scene_image', 'anchor'], max_refs: 2 }, { ...base, cast: many, scene });
  assert.deepEqual(sceneFirst.refs, { cast: [cast[0]], products: [], scene_image: img('own') });
  // A picture given as a file is the scene image when scene.image is empty.
  const filePicture = kitScenePrompt({ version: 1, scene: '{picture?} a still', refs: ['scene_image'] }, { scene: { id: 's1', picture: img('upload') } });
  assert.deepEqual(filePicture.refs.scene_image, img('upload'));
  assert.equal(filePicture.prompt, 'a still');
  // A product without photos is never a reference.
  const noPhoto = kitScenePrompt(TEMPLATE, { ...base, products: [{ id: 'p9', name: 'Matcha', images: [] }], scene: { id: 's1', picture: 'Product: matcha' } });
  assert.deepEqual(noPhoto.refs.products, []);
});

test('a missing value refuses the scene with its id; looks must be known', () => {
  const tpl = { version: 1, scene: '{picture} in the {answers.room}, {answers.mood}' };
  assert.throws(() => kitScenePrompt(tpl, { ...base, scene: { id: 's7', picture: 'the jar' } }), (e) => e instanceof KitPromptGap && e.message === 'scene s7 needs {answers.mood}');
  assert.throws(() => kitScenePrompt(TEMPLATE, { ...base, scene: { id: 's1', picture: null } }), /scene s1 needs \{picture\}/);
  assert.throws(() => kitScenePrompt(TEMPLATE, { ...base, look: 'anime', scene: { id: 's1', picture: 'x' } }), (e) => e.kind === 'look' && /scene s1 needs \{look\}: "anime" is not one of pixar-3d, claymation/.test(e.message));
  // No looks table: the answer text is the look. A scene without an id is named by its place.
  const plain = kitScenePrompt({ version: 1, scene: '{look}: {picture}' }, { look: 'watercolour', scene: { picture: 'a jar' }, index: 4 });
  assert.equal(plain.prompt, 'watercolour: a jar');
  assert.throws(() => kitScenePrompt({ version: 1, scene: '{line}' }, { scene: { line: null }, index: 4 }), /scene #5 needs \{line\}/);
});

test('speaker, product and brand placeholders', () => {
  const tpl = { version: 1, scene: '{speaker.name} ({speaker.look}) holds {product.name} for {brand.name}' };
  const out = kitScenePrompt(tpl, { ...base, scene: { id: 's1', speaker: 'b', picture: 'close' } });
  assert.equal(out.prompt, 'Theo (man, 41, grey beard) holds Fernhill Earl Grey for Fernhill Tea Co.');
  assert.throws(() => kitScenePrompt(tpl, { ...base, scene: { id: 's2', picture: 'close' } }), /scene s2 needs \{speaker\.name\}/);
  // Two products and none named: {product.name} has no value.
  const two = [...products, { id: 'p2', name: 'Matcha', images: [img('m')] }];
  assert.throws(() => kitScenePrompt(tpl, { ...base, products: two, scene: { id: 's3', speaker: 'a', picture: 'close' } }), /scene s3 needs \{product\.name\}/);
});

test('motion and named templates; a missing text is a template error', () => {
  const scene = { id: 's1', picture: 'Product: the tin', line: 'x' };
  assert.match(kitScenePrompt(TEMPLATE, { ...base, scene }, { use: 'motion' }).prompt, /the tin\. Subtle handheld motion, no zoom, no morph\./);
  const tpl = { ...TEMPLATE, templates: { hook: 'reacts: {answers.reaction}' } };
  assert.match(kitScenePrompt(tpl, { ...base, answers: { reaction: 'jaw drop' }, scene }, { use: 'hook' }).prompt, /reacts: jaw drop/);
  assert.throws(() => kitScenePrompt(TEMPLATE, { ...base, scene }, { use: 'hook' }), /the template has no "hook" text/);
  assert.throws(() => kitScenePrompt({ version: 1 }, { scene }, { use: 'motion' }), /no "motion" text/);
  assert.throws(() => kitScenePrompt(TEMPLATE, { scene }, { use: 'anchor' }), /kitAnchorPrompt/);
  // The default scene text is the picture.
  assert.equal(kitScenePrompt({ version: 1 }, { scene: { id: 's1', picture: 'a jar' } }).prompt, 'a jar');
});

test('banned phrases refuse a filled prompt, whole words and any case', () => {
  const tpl = { version: 1, scene: '{picture}', banned: ['subtitles', 'one continuous breath'] };
  assert.throws(
    () => kitScenePrompt(tpl, { scene: { id: 's2', picture: 'She speaks in One  Continuous Breath' } }),
    (e) => e instanceof KitPromptGap && e.kind === 'banned' && e.phrase === 'one continuous breath' && e.message === 'scene s2 uses the banned phrase "one continuous breath"',
  );
  assert.equal(kitScenePrompt(tpl, { scene: { id: 's3', picture: 'subtitlesque' } }).prompt, 'subtitlesque');
});

test('kitScenePrompts fills every picked scene first, so one gap refuses the step', () => {
  const scenes = [
    { id: 's1', picture: 'Maya waves', speaker: 'a' },
    { id: 's2', picture: 'Product: the tin' },
    { id: 's3', picture: 'End card' },
  ];
  const all = kitScenePrompts(TEMPLATE, kitPickScenes(scenes, 'all', { skip_last: 1 }), base);
  assert.deepEqual(all.map((p) => [p.id, p.index, p.tag]), [['s1', 0, null], ['s2', 1, 'Product']]);
  const broken = [...scenes.slice(0, 2), { id: 's9', picture: '' }];
  assert.throws(() => kitScenePrompts(TEMPLATE, kitPickScenes(broken), base), /scene s9 needs \{picture\}/);
});

test('an anchor prompt uses the member name and look; prefix keeps the art style', () => {
  const tpl = { ...TEMPLATE, prefix: '{look} cartoon' };
  const out = kitAnchorPrompt(tpl, cast[0], base);
  assert.equal(out.prompt, 'glossy 3D, subsurface skin cartoon. portrait of Maya: woman, 34, curly dark hair, neutral background, chest up, eyes to camera. vertical 9:16, no text, no signage, no logos');
  assert.equal(out.negative, 'text, watermark, extra fingers');
  assert.match(kitAnchorPrompt({ version: 1, anchor: '{name}, {style}' }, cast[1], { look: 'claymation' }).prompt, /^Theo, claymation$/);
  assert.throws(() => kitAnchorPrompt(TEMPLATE, { key: 'z', name: 'Zed', look: '' }, base), /cast z needs \{look\}/);
  assert.throws(() => kitAnchorPrompt({ version: 1 }, cast[0]), /no "anchor" text/);
});

test('every _lib module bundles into one part and loads (kit-prefixed names do not collide)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-bundle-'));
  const libDir = fileURLToPath(new URL('.', import.meta.url));
  const libs = readdirSync(libDir).filter((f) => f.endsWith('.mjs') && !f.endsWith('.test.mjs'));
  const entry = join(dir, 'part.mjs');
  const imports = libs.map((f, i) => `import * as lib${i} from './${relative(dir, join(libDir, f))}';`);
  writeFileSync(entry, [...imports, 'export async function run() { return {}; }', 'export const used = [kitScenePrompts, kitPickScenes, kitPieceName].map((f) => f.name);', ''].join('\n'));
  const out = join(dir, 'bundled.mjs');
  writeFileSync(out, bundlePart(entry));
  const mod = await import(pathToFileURL(out).href);
  assert.deepEqual(mod.used, ['kitScenePrompts', 'kitPickScenes', 'kitPieceName']);
});
