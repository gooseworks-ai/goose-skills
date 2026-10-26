import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash, jsonBytes, readFiles } from './files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const argumentsLeft = process.argv.slice(2);
const isCheck = argumentsLeft.includes('--check');
const flags = argumentsLeft.filter((value) => value !== '--check');
if (flags.length !== 4 || flags[0] !== '--source' || flags[2] !== '--ref') {
  throw new Error('Use sync.mjs --source /absolute/new-app-checkout --ref FULL_COMMIT [--check]');
}
const source = flags[1];
const revision = flags[3];
if (!path.isAbsolute(source) || !/^[a-f0-9]{40}$/.test(revision)) {
  throw new Error('An absolute source path and full commit SHA are required.');
}
function git(...args) {
  return execFileSync('git', ['-C', source, ...args], { encoding: 'utf8' }).trim();
}
if (git('rev-parse', 'HEAD') !== revision) throw new Error('Source HEAD must equal --ref.');
if (!/gooseworks-ai\/gooseworks-app(?:\.git)?$/.test(git('remote', 'get-url', 'origin'))) {
  throw new Error('Source must be the gooseworks-ai/gooseworks-app repository.');
}
if (git('status', '--porcelain', '--untracked-files=normal')) {
  throw new Error('Commit or remove all source checkout changes before exporting.');
}
execFileSync('pnpm', ['--filter', '@gooseworks/plugin', 'build', 'team'], {
  cwd: source,
  stdio: 'inherit',
});
const output = path.join(source, 'apps/plugin/dist/team');
const expected = new Map();
for (const flavor of ['claude', 'agent-plugins']) {
  for (const [name, bytes] of await readFiles(path.join(output, `gooseworks-next-${flavor}`))) {
    const target = `plugin/${name}`;
    const previous = expected.get(target);
    if (previous && !previous.equals(bytes)) throw new Error(`Builds disagree on ${name}`);
    expected.set(target, bytes);
  }
}
for (const flavor of ['claude', 'agent-plugins']) {
  const name = `gooseworks-next-${flavor}.zip`;
  expected.set(`downloads/${name}`, await readFile(path.join(output, name)));
}
expected.set('tool-contract.json', await readFile(path.join(source, 'apps/plugin/skill-tools.json')));
expected.set('skills.json', await readFile(path.join(output, 'skills.json')));
const lock = {
  format: 1,
  repository: 'https://github.com/gooseworks-ai/gooseworks-app',
  commit: revision,
  target: 'team',
  files: Object.fromEntries([...expected].sort(([left], [right]) => left.localeCompare(right))
    .map(([name, bytes]) => [name, hash(bytes)])),
};
expected.set('source.lock.json', jsonBytes(lock));
if (isCheck) {
  const actual = new Map();
  for (const [name, bytes] of await readFiles(path.join(root, 'plugin'))) actual.set(`plugin/${name}`, bytes);
  for (const [name, bytes] of await readFiles(path.join(root, 'downloads'))) actual.set(`downloads/${name}`, bytes);
  for (const name of ['tool-contract.json', 'skills.json', 'source.lock.json']) {
    actual.set(name, await readFile(path.join(root, name)));
  }
  if (actual.size !== expected.size) throw new Error('Generated file inventory differs from source.');
  for (const [name, bytes] of expected) {
    if (!actual.get(name)?.equals(bytes)) throw new Error(`Source comparison failed: ${name}`);
  }
  console.log(`All ${expected.size} generated files match source commit ${revision}.`);
} else {
  for (const folder of ['plugin', 'downloads']) {
    await rm(path.join(root, folder), { recursive: true, force: true });
  }
  for (const [name, bytes] of expected) {
    const file = path.join(root, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
  }
  console.log(`Exported ${expected.size} files from ${revision}. Run verify.mjs before committing.`);
}
