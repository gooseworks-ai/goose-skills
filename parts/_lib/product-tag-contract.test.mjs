import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kitProductReferenceEvidence, kitProductScenePhotos, kitRequireProductFrame, kitRequireProductRequest, kitRequireSceneTags } from './product-tag-contract.mjs';
import { kitScenePrompt } from './prompt.mjs';

const photo = { kind: 'file', sha256: 'a'.repeat(64) };
const face = { kind: 'file', sha256: 'b'.repeat(64) };
const still = { kind: 'file', sha256: 'c'.repeat(64) };
const product = { id: 'blackout', name: 'Blackout', images: [photo] };
const tpl = { version: 1, scene: 'Creator fallback: {picture}', refs: ['anchor'], by_tag: {
  'Look 1': { refs: ['anchor'] }, 'Hold 1': { refs: ['anchor', 'product'] }, Product: { scene: 'The exact {product.name}: {picture}', refs: ['product'] }, Cutaway: { refs: [] },
} };
const scene = (picture, shot) => ({ id: 's4', picture, ...(shot ? { extra: { shot } } : {}) });

test('matching Braxley malformed Product ECU drops the photo on the old opt-out route; opted-in route refuses it', () => {
  const bad = scene('Product ECU rotates Blackout on an off-white tabletop.');
  assert.deepEqual(kitScenePrompt(tpl, { scene: bad, products: [product] }).refs.products, []);
  assert.throws(() => kitRequireSceneTags(tpl, [bad]), /colon after "Product"/);
  const valid = scene('Product: ECU rotates Blackout on an off-white tabletop.');
  kitRequireSceneTags(tpl, [valid]);
  assert.deepEqual(kitScenePrompt(tpl, { scene: valid, products: [product] }).refs.products, [product]);
});

test('strict routing rejects missing Look/Hold colons, unknown and contradictory tags; structured tags allow plain picture prose', () => {
  for (const picture of ['Look 1 MCU points toward her wrist.', 'Hold 1 CU gestures toward the slide.']) assert.throws(() => kitRequireSceneTags(tpl, [scene(picture)]), /colon/);
  assert.throws(() => kitRequireSceneTags(tpl, [scene('Prdouct: ECU rotates Blackout')]), /unknown picture tag/);
  assert.throws(() => kitRequireSceneTags(tpl, [scene('Product: ECU rotates Blackout', 'Look 1')]), /disagrees/);
  assert.throws(() => kitRequireSceneTags(tpl, [scene('ECU rotates Blackout', 'unknown')]), /unknown extra.shot/);
  kitRequireSceneTags(tpl, [scene('ECU rotates Blackout', 'Product')]);
});

test('a wrong Look tag cannot hide a product named in the picture', () => {
  const wrong = scene('Look 1: MCU lifts Blackout beside her face.', 'Look 1');
  const required = kitProductScenePhotos(tpl, wrong, [product]);
  assert.deepEqual(required, [{ id: 'blackout', sha256: photo.sha256 }]);
  assert.throws(() => kitRequireProductRequest('s4', required, [face], 'openai/gpt-image-2/edit'), /actual still request omits/);
});

test('actual request evidence requires the real photo; truncation or prompt-only orders cannot pass', () => {
  const required = kitProductScenePhotos(tpl, scene('Product: ECU rotates the band.'), [product]);
  assert.throws(() => kitRequireProductRequest('s4', required, [face], 'openai/gpt-image-2/edit'), /omits/);
  assert.throws(() => kitRequireProductRequest('s4', required, [photo], 'openai/gpt-image-2'), /omits/);
  assert.deepEqual(kitRequireProductRequest('s4', required, [photo], 'openai/gpt-image-2/edit'), [photo.sha256]);
});

test('Veo requires current-photo request evidence bound to the exact scene and start frame', () => {
  const required = [{ id: 'blackout', sha256: photo.sha256 }];
  const row = kitProductReferenceEvidence('s4', still, required, [photo], 'openai/gpt-image-2/edit', 'image-s4');
  kitRequireProductFrame('s4', still, required, [row]);
  assert.throws(() => kitRequireProductFrame('s4', still, required, []), /needs one/);
  assert.throws(() => kitRequireProductFrame('s7', still, required, [row]), /needs one/);
  assert.throws(() => kitRequireProductFrame('s4', face, required, [row]), /not bound/);
  assert.throws(() => kitRequireProductFrame('s4', still, required, [{ ...row, request_image_sha256: [face.sha256] }]), /altered/);
  const forged = kitProductReferenceEvidence('s4', still, [], [face], 'openai/gpt-image-2/edit', 'image-s4');
  assert.throws(() => kitRequireProductFrame('s4', still, required, [forged]), /did not include/);
  assert.throws(() => kitRequireProductFrame('s4', still, [{ id: 'blackout', sha256: face.sha256 }], [row]), /current real product/);
});
