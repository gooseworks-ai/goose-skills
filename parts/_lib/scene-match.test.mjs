import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kitNamedCast, kitNamedProducts, kitNamesWord, kitPickScenes, kitPictureWithoutTag, kitProductMatch, kitSceneTag, kitTagKey } from './scene-match.mjs';

const cast = [
  { key: 'a', name: 'Maya', look: 'woman, 34, curly dark hair' },
  { key: 'b', name: 'Theo', look: 'man, 41, grey beard' },
  { key: 'c', name: 'Mary Jo', look: 'woman, 60, silver bob' },
  { key: 'd', name: '', look: 'narrator' },
];

test('a scene tag comes from extra.shot first, then a leading "Tag:" in the picture', () => {
  assert.equal(kitSceneTag({ picture: 'Product: the jar on oak', extra: { shot: 'creator' } }), 'creator');
  assert.equal(kitSceneTag({ picture: 'Product: the jar on oak' }), 'Product');
  assert.equal(kitSceneTag({ picture: 'Close up: steam rising' }), 'Close up');
  assert.equal(kitSceneTag({ picture: 'the jar on oak' }), null);
  // Times, links and colons with no space are not tags; neither is a file picture.
  assert.equal(kitSceneTag({ picture: '10:30 on the clock' }), null);
  assert.equal(kitSceneTag({ picture: 'https://example.com/a' }), null);
  assert.equal(kitSceneTag({ picture: 'Ratio:3' }), null);
  assert.equal(kitSceneTag({ picture: 'Product:' }), 'Product');
  assert.equal(kitSceneTag({ picture: 'Product:   ' }), 'Product');
  assert.equal(kitSceneTag({ picture: { kind: 'file', path: '/x.png' } }), null);
  assert.equal(kitSceneTag({ picture: 'Product: x', extra: { shot: 3 } }), 'Product', 'a non-text shot is ignored');
  assert.equal(kitSceneTag(null), null);
});

test('tags compare without case or spacing; a picture loses its tag only when the tag is known', () => {
  assert.equal(kitTagKey('Close Up'), 'close-up');
  assert.equal(kitTagKey('close_up'), 'close-up');
  assert.equal(kitPictureWithoutTag({ picture: 'Product: the jar on oak' }, ['product']), 'the jar on oak');
  assert.equal(kitPictureWithoutTag({ picture: 'Maya: holds the jar' }, ['Product']), 'Maya: holds the jar');
  assert.equal(kitPictureWithoutTag({ picture: null }, ['Product']), '');
  assert.equal(kitPictureWithoutTag({ picture: 'Product:  ' }, ['Product']), '');
});

test('names match as whole words, ignoring case', () => {
  assert.equal(kitNamesWord("Maya's kitchen", 'Maya'), true);
  assert.equal(kitNamesWord('a Mayan temple', 'Maya'), false);
  assert.equal(kitNamesWord('MARY  JO waves', 'Mary Jo'), true);
  assert.equal(kitNamesWord('anything', ''), false);
  assert.equal(kitNamesWord('Zoë laughs', 'zoë'), true);
});

test('the speaker comes first, then members named in the picture or line, in cast order', () => {
  const scene = { id: 's1', speaker: 'b', picture: 'Mary Jo and Maya at the counter', line: 'Theo, try this.' };
  assert.deepEqual(kitNamedCast(scene, cast).map((m) => m.key), ['b', 'a', 'c']);
  assert.deepEqual(kitNamedCast({ picture: 'Theo pours' }, cast).map((m) => m.key), ['b']);
  // A member with no name is found only as the speaker.
  assert.deepEqual(kitNamedCast({ speaker: 'd', line: 'Hello' }, cast).map((m) => m.key), ['d']);
  assert.deepEqual(kitNamedCast({ speaker: 'zz', picture: 'nobody' }, cast), []);
  assert.deepEqual(kitNamedCast({ picture: 'Maya' }, null), []);
});

const products = [
  { id: 'p1', name: 'Earl Grey Tin', images: [{ kind: 'file', path: '/earl.png' }] },
  { id: 'p2', name: 'Earl Grey Cream Tin', images: [{ kind: 'file', path: '/cream.png' }] },
  { id: 'p3', name: 'Matcha', images: [] },
];

test('products match like phone-chat 1.2.0: id, whole name, or two name words', () => {
  assert.equal(kitProductMatch('p2 on the table', products[1]), Infinity);
  assert.equal(kitProductMatch('earl grey cream tin', products[1]), Infinity);
  assert.equal(kitProductMatch('a matcha latte', products[2]), 1, 'all of a one-word name');
  assert.equal(kitProductMatch('grey skies', products[0]), 0, 'one word of a three-word name is not enough');
  assert.equal(kitProductMatch('', products[0]), 0);
});

test('named products: strongest match first, then the longest name', () => {
  const named = kitNamedProducts({ picture: 'Product: the Earl Grey Cream Tin on oak' }, products);
  assert.deepEqual(named.map((p) => p.id), ['p2', 'p1']);
  // Same strength (two words each): the longer name wins the tie.
  assert.deepEqual(kitNamedProducts({ picture: 'earl grey steam' }, products).map((p) => p.id), ['p2', 'p1']);
  assert.deepEqual(kitNamedProducts({ picture: 'a matcha whisk' }, products).map((p) => p.id), ['p3']);
  assert.deepEqual(kitNamedProducts({ picture: 'a beach' }, products), []);
  assert.deepEqual(kitNamedProducts({ picture: { kind: 'file' } }, products), []);
});

const scenes = [
  { id: 's1', picture: 'Hook: Maya stares', line: 'Wait.' },
  { id: 's2', picture: null, line: 'So.' },
  { id: 's3', picture: 'Product: the tin', line: 'This.' },
  { id: 's4', picture: 'b-roll', image: { kind: 'file', path: '/x.png' }, extra: { shot: 'still' } },
  { id: 's5', picture: 'End card', line: null },
];

test('pick chooses scenes after skip_first and skip_last, keeping plan indexes', () => {
  const ids = (list) => list.map((s) => `${s.scene.id}@${s.index}`);
  assert.deepEqual(ids(kitPickScenes(scenes)), ['s1@0', 's2@1', 's3@2', 's4@3', 's5@4']);
  assert.deepEqual(ids(kitPickScenes(scenes, 'all', { skip_last: 1 })), ['s1@0', 's2@1', 's3@2', 's4@3']);
  assert.deepEqual(ids(kitPickScenes(scenes, 'first', { skip_first: 1 })), ['s2@1']);
  assert.deepEqual(ids(kitPickScenes(scenes, 'with_picture', { skip_last: 1 })), ['s1@0', 's3@2', 's4@3']);
  assert.deepEqual(ids(kitPickScenes(scenes, { tags: ['product', 'STILL'] })), ['s3@2', 's4@3']);
  assert.deepEqual(ids(kitPickScenes(scenes, 'all', { skip_first: 3, skip_last: 3 })), []);
  assert.deepEqual(kitPickScenes(null, 'all'), []);
  assert.throws(() => kitPickScenes(scenes, 'some'), /pick must be/);
  assert.throws(() => kitPickScenes(scenes, ['product']), /pick must be/);
});
