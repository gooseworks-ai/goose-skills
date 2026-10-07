import { pathToFileURL } from 'node:url';

export async function deployCatalog({ key, ref, revision, fetchImpl = fetch, sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now, timeoutMs = 65 * 60 * 1000 }) {
  if (!key) throw new Error('Set TRIGGER_SECRET_KEY in the staging and production GitHub environments');
  if (!['dev', 'main'].includes(ref) || !/^[a-f0-9]{40}$/.test(revision || '')) throw new Error('Expected a dev/main branch and full commit SHA');
  const headResponse = await fetchImpl(`https://api.github.com/repos/gooseworks-ai/goose-skills/commits/${ref}`, { signal: AbortSignal.timeout(30000) });
  if (!headResponse.ok) throw new Error(`Cannot verify release branch (HTTP ${headResponse.status})`);
  if ((await headResponse.json()).sha !== revision) throw new Error('Release was superseded by a newer merge; deploy the newest CI run');
  const request = async (path, body) => {
    const response = await fetchImpl(`https://api.trigger.dev${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Trigger request failed (HTTP ${response.status})`);
    return response.json();
  };
  const handle = await request('/api/v1/tasks/sync-predefined-skills-catalog/trigger', {
    payload: { force: true, sourceRef: ref, sourceRevision: revision },
  });
  if (!/^run_[a-zA-Z0-9]+$/.test(handle.id || '')) throw new Error('Trigger did not return a valid run ID');
  console.log(`Catalog release ${ref}@${revision}: ${handle.id}`);
  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    const run = await request(`/api/v3/runs/${handle.id}`);
    if (run.status === 'COMPLETED') {
      if (!run.output || typeof run.output.failed !== 'number' || run.output.failed !== 0) throw new Error('Catalog run completed without a successful sync result');
      console.log(`Catalog published: ${JSON.stringify(run.output)}`);
      return run.output;
    }
    if (['FAILED', 'CRASHED', 'CANCELED', 'SYSTEM_FAILURE', 'TIMED_OUT', 'EXPIRED'].includes(run.status)) throw new Error(`Catalog run ${handle.id} ended with ${run.status}`);
    await sleep(10000);
  }
  throw new Error(`Catalog run ${handle.id} exceeded the CI wait timeout; inspect it before retrying`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  deployCatalog({ key: process.env.TRIGGER_SECRET_KEY, ref: process.env.SOURCE_REF, revision: process.env.SOURCE_REVISION }).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
