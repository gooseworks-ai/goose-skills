// The client-name guard (scripts/check-client-names.js), proved with the
// fictional canary names in scripts/lib/client-name-hashes.json, never a real one.
//
// The guard skips frozen part versions (parts/<id>/<x.y.z>/) and parts/_lib/,
// which is copied into every frozen version. That is an accepted risk (owner
// decision D4): those files are immutable and pinned by approved videos, so a
// name there leaves only when a new part version is cut from clean sources.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const { scanText, loadHashes, sha256 } = require('../scripts/check-client-names');

const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'check-client-names.js');
const WITH_CANARIES = loadHashes({ canaries: true });

test('the hash list holds digests only', () => {
  const doc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'lib', 'client-name-hashes.json'), 'utf8'));
  assert.deepEqual(Object.keys(doc).sort(), ['$comment', 'canaries', 'hashes']);
  assert.ok(doc.hashes.length >= 30);
  for (const h of [...doc.hashes, ...doc.canaries]) {
    assert.deepEqual(Object.keys(h).sort(), ['sha256', 'words']);
    assert.match(h.sha256, /^[0-9a-f]{64}$/);
    assert.ok(Number.isInteger(h.words) && h.words >= 1);
  }
  // The canaries are the two fictional names this file uses.
  assert.deepEqual(doc.canaries.map((h) => h.sha256).sort(), [sha256('gw canary client'), sha256('gwcanaryclient')].sort());
});

test('a name matches as whole words, in any case, across punctuation', () => {
  const text = [
    'Made for GwCanaryClient.',
    'see gw-canary-client and clients/gw/canary/client',
    'GW Canary Client, again',
  ].join('\n');
  const hits = scanText(text, WITH_CANARIES);
  assert.deepEqual(hits.map((h) => [h.line, h.text]), [
    [1, 'GwCanaryClient'],
    [2, 'gw-canary-client'],
    [2, 'gw/canary/client'],
    [3, 'GW Canary Client'],
  ]);
});

test('a name inside a longer word, or a partial phrase, does not match', () => {
  const text = 'xgwcanaryclient gwcanaryclients gw canary clientele gw canary';
  assert.deepEqual(scanText(text, WITH_CANARIES), []);
});

test('without canaries the fictional names pass', () => {
  assert.deepEqual(scanText('gwcanaryclient', loadHashes()), []);
});

test('the scan reads tracked text files and skips frozen part versions and parts/_lib', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-client-names-'));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  write('skills/marketing/plan-launch/tests/test-by-hand.md', 'Brand: GwCanaryClient\n');
  write('parts/check-layer/src/part.mjs', '// gw canary client\n');
  write('parts/check-layer/1.2.0/part.mjs', '// gw canary client (frozen)\n');
  write('parts/_lib/speech.mjs', '// gwcanaryclient (bundled)\n');
  write('assets/logo.bin', Buffer.from([0, 1, 2, ...Buffer.from('gwcanaryclient')]));
  write('notes/untracked.md', 'gwcanaryclient\n');
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['add', 'skills', 'parts', 'assets'], { cwd: root });

  const res = spawnSync(process.execPath, [SCRIPT, '--with-canaries'], {
    env: { ...process.env, GOOSE_SKILLS_ROOT: root, GITHUB_ACTIONS: '' },
    encoding: 'utf8',
  });
  assert.equal(res.status, 1, res.stdout + res.stderr);
  const files = res.stderr.split('\n').filter((l) => /a real client/.test(l)).map((l) => l.split(':').slice(0, 2).join(':'));
  assert.deepEqual(files.sort(), ['parts/check-layer/src/part.mjs:1', 'skills/marketing/plan-launch/tests/test-by-hand.md:1']);
});
