// Every skill that carries its own media_proxy.py (the billing helper) must carry
// the exact bytes of the one in skills/video/media-proxy. A copy that drifts bills
// differently, so CI fails until it is synced:
//   cp skills/video/media-proxy/scripts/media_proxy.py <the drifted copy>
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const HOME = 'skills/video/media-proxy/scripts/media_proxy.py';
const SEARCH = ['skills', 'drafts'];

function findCopies(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findCopies(full, out);
    else if (entry.name === 'media_proxy.py') out.push(path.relative(ROOT, full));
  }
  return out;
}

const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');

test('every media_proxy.py copy is byte-identical to the media-proxy skill', () => {
  const copies = SEARCH.filter((d) => fs.existsSync(path.join(ROOT, d)))
    .flatMap((d) => findCopies(path.join(ROOT, d)))
    .filter((f) => f !== HOME);
  assert.ok(fs.existsSync(path.join(ROOT, HOME)), `${HOME} is missing`);
  assert.ok(copies.length > 0, 'expected the skills that carry the billing helper');
  const want = sha(HOME);
  const drifted = copies.filter((f) => sha(f) !== want);
  assert.deepEqual(drifted, [], `out of sync with ${HOME}; copy it over: ${drifted.join(', ')}`);
});
