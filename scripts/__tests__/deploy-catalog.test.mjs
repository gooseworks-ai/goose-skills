import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deployCatalog } from '../deploy-catalog.mjs';
const revision = 'a'.repeat(40);
function fixture(statuses) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    const value = calls.length === 1 ? { sha: revision } : calls.length === 2 ? { id: 'run_abc123' } : statuses.shift();
    return { ok: true, json: async () => value };
  };
  return { calls, fetchImpl };
}
for (const ref of ['dev', 'main']) test(`publishes ${ref} at the exact merge revision and waits`, async () => {
  const { calls, fetchImpl } = fixture([{ status: 'EXECUTING' }, { status: 'COMPLETED', output: { failed: 0, updated: 2 } }]);
  const output = await deployCatalog({ key: 'test-key', ref, revision, fetchImpl, sleep: async () => {} });
  assert.equal(output.updated, 2);
  assert.deepEqual(JSON.parse(calls[1].options.body).payload, { force: true, sourceRef: ref, sourceRevision: revision });
  assert.equal(calls.length, 4);
});
for (const run of [{ status: 'FAILED' }, { status: 'COMPLETED', output: { failed: 2 } }, { status: 'COMPLETED' }]) test(`fails CI on ${JSON.stringify(run)}`, async () => {
  const { fetchImpl } = fixture([run]);
  await assert.rejects(deployCatalog({ key: 'test-key', ref: 'dev', revision, fetchImpl, sleep: async () => {} }));
});
test('rejects stale merges before starting a task', async () => {
  let calls = 0;
  await assert.rejects(deployCatalog({ key: 'test-key', ref: 'main', revision, fetchImpl: async () => { calls++; return { ok: true, json: async () => ({ sha: 'b'.repeat(40) }) }; } }), /superseded/);
  assert.equal(calls, 1);
});
test('rejects missing credentials and non-release branches', async () => {
  await assert.rejects(deployCatalog({ ref: 'main', revision }), /TRIGGER_SECRET_KEY/);
  await assert.rejects(deployCatalog({ key: 'test-key', ref: 'feature', revision }), /dev\/main/);
});
test('times out instead of silently accepting a pending release', async () => {
  const { fetchImpl } = fixture([{ status: 'QUEUED' }]);
  let time = 0;
  await assert.rejects(deployCatalog({ key: 'test-key', ref: 'dev', revision, fetchImpl, now: () => time, timeoutMs: 10, sleep: async () => { time = 11; } }), /timeout/);
});
