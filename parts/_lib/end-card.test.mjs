import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kitCardDataUri } from './end-card.mjs';

const file = () => {
  const path = join(mkdtempSync(join(tmpdir(), 'end-card-')), 'logo.png');
  writeFileSync(path, Buffer.from('logo'));
  return path;
};

test('a plain MIME type goes into the data URI as it is', async () => {
  assert.equal(await kitCardDataUri({ path: file(), mime: 'image/png' }), `data:image/png;base64,${Buffer.from('logo').toString('base64')}`);
});

test('a MIME type that could break out of the markup is replaced, for the brand layer as for the end card', async () => {
  for (const mime of ['image/png" onerror="alert(1)', "font/ttf') }body{background:red", 'image/svg+xml;x=1', undefined]) {
    assert.match(await kitCardDataUri({ path: file(), mime }), /^data:application\/octet-stream;base64,/);
  }
});
