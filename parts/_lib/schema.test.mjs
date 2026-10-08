import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kitSchemaErrors } from './schema.mjs';

const schema = { type: 'object', additionalProperties: false, required: ['name'], properties: { name: { type: 'string' } } };

test('names inherited from Object.prototype are neither declared properties nor present fields', () => {
  for (const key of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) {
    const value = JSON.parse(`{"name": "x", "${key}": 1}`);
    assert.ok(Object.hasOwn(value, key));
    assert.deepEqual(kitSchemaErrors(schema, value), [`$.${key}: unknown field`], key);
  }
  assert.deepEqual(kitSchemaErrors({ ...schema, required: ['toString'] }, { name: 'x' }), ['$.toString: required']);
});

test('a FileRef property is checked as a file, with its media', () => {
  const fileSchema = { type: 'object', additionalProperties: false, properties: { audio: { type: 'object', 'x-kit-file': { media: 'audio' } } } };
  const ref = { kind: 'file', path: '/a.mp3', sha256: 'a'.repeat(64), bytes: 1, media: 'audio', mime: 'audio/mpeg' };
  assert.deepEqual(kitSchemaErrors(fileSchema, { audio: ref }), []);
  assert.equal(kitSchemaErrors(fileSchema, { audio: { ...ref, media: 'video' } }).length, 1);
  assert.equal(kitSchemaErrors(fileSchema, { audio: { ...ref, path: 'relative.mp3' } }).length, 1);
});
