import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash, readFiles } from './files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const repo = path.resolve(root, '..');
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--base' || !/^[a-f0-9]{40}$/.test(args[1])) {
  throw new Error('Use verify.mjs --base FULL_GOSKILLS_BASE_COMMIT');
}
const changed = execFileSync('git', ['diff', '--name-status', args[1], '--'], {
  cwd: repo, encoding: 'utf8',
}).trim().split('\n').filter(Boolean);
for (const line of changed) {
  const [status, name] = line.split('\t');
  assert(['A', 'M', 'D'].includes(status), `Unexpected change: ${line}`);
  assert(name.startsWith('rebuild/') || name === '.github/workflows/rebuild-skills.yml',
    `Existing catalog or release file changed: ${name}`);
}
const json = async (name) => JSON.parse(await readFile(path.join(root, name), 'utf8'));
const lock = await json('source.lock.json');
assert.equal(lock.format, 1);
assert.equal(lock.repository, 'https://github.com/gooseworks-ai/gooseworks-app');
assert.match(lock.commit, /^[a-f0-9]{40}$/);
assert.equal(lock.target, 'team');
const generated = new Map();
for (const [name, bytes] of await readFiles(path.join(root, 'plugin'))) generated.set(`plugin/${name}`, bytes);
for (const [name, bytes] of await readFiles(path.join(root, 'downloads'))) generated.set(`downloads/${name}`, bytes);
for (const name of ['tool-contract.json', 'skills.json']) generated.set(name, await readFile(path.join(root, name)));
assert.deepEqual([...generated.keys()].sort(), Object.keys(lock.files).sort(), 'File inventory changed');
for (const [name, bytes] of generated) assert.equal(hash(bytes), lock.files[name], `Edited generated file: ${name}`);
const plugin = await json('plugin/plugin.json');
const claude = await json('plugin/.claude-plugin/plugin.json');
assert.equal(plugin.name, 'gooseworks-next');
for (const key of Object.keys(claude)) assert.deepEqual(plugin[key], claude[key], `Manifest disagreement: ${key}`);
assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
assert.equal(plugin.extensions['com.openai'].interface.displayName, 'GooseWorks Next');
for (const [name, type] of [['.mcp.json', 'http'], ['mcp.json', 'streamable-http']]) {
  const connector = await json(`plugin/${name}`);
  assert.deepEqual(connector.mcpServers, {
    gooseworks: { type, url: 'https://mcp.gooseworks.sh/mcp' },
  });
}
const index = await json('skills.json');
assert.equal(index.version, plugin.version);
const skillNames = new Set(index.skills.map((skill) => skill.folder));
assert.equal(skillNames.size, index.skills.length);
const contract = await json('tool-contract.json');
const toolNames = new Set(contract.tools.map((tool) => tool.name));
assert.equal(toolNames.size, contract.tools.length);
for (const tool of contract.tools) {
  assert.match(tool.name, /^[a-z]+(?:_[a-z]+)*$/);
  assert.equal(tool.input.type, 'object');
}
const rules = ['## Every time', ...contract.rules.map(({title, rules}) =>
  `### ${title}\n\n${rules.map((rule) => `- ${rule}`).join('\n')}`)].join('\n\n') + '\n';
const used = new Set();
for (const skill of index.skills) {
  const name = `plugin/skills/${skill.folder}/SKILL.md`;
  const bytes = generated.get(name);
  assert(bytes, `Missing skill: ${name}`);
  const text = bytes.toString('utf8');
  assert(text.startsWith(`---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n`),
    `Skill metadata disagrees with index: ${name}`);
  assert(text.endsWith(rules), `Shared connector rules disagree: ${name}`);
}
const diskSkills = [...generated.keys()].filter((name) => /^plugin\/skills\/[^/]+\/SKILL\.md$/.test(name));
assert.equal(diskSkills.length, skillNames.size, 'Unindexed skill');
for (const [name, bytes] of generated) {
  if (!name.startsWith('plugin/') || !name.endsWith('.md')) continue;
  const text = bytes.toString('utf8');
  for (const match of text.matchAll(/\bgooseworks:([a-z_]+)\b/g)) {
    assert(toolNames.has(match[1]), `Unknown connector tool ${match[1]} in ${name}`);
    used.add(match[1]);
  }
  for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(name), target));
    assert(resolved.startsWith('plugin/') && generated.has(resolved), `Broken packaged link ${target} in ${name}`);
  }
  for (const match of text.matchAll(/\bthe ([a-z]+(?:-[a-z]+)+) (?:skill|guide)\b/g)) {
    assert(skillNames.has(match[1]), `Missing sibling guide ${match[1]} in ${name}`);
  }
}
const png = generated.get('plugin/assets/goose.png');
assert(png && png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
console.log(`Verified ${skillNames.size} installable guides, ${used.size} used tools against ${toolNames.size} schemas, references, manifests, source hashes and unchanged legacy files.`);
console.log('Offline checks validate this export; sync.mjs --check against the pinned private source proves upstream agreement.');
