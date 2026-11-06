// Keeps references/coverage.md in step with the playbook index
// (playbooks/playbooks-index.json, built by scripts/build-playbooks.js).
// The skill reads the checks' text from the index at run time, but decides
// what can run from coverage.md, so the two must name the same checks and tools.
// Fix: edit coverage.md's table (or the worked-example counts) to match.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'playbooks', 'playbooks-index.json'), 'utf8'));
const coverage = fs.readFileSync(path.join(HERE, '..', 'references', 'coverage.md'), 'utf8');
const skill = fs.readFileSync(path.join(HERE, '..', 'SKILL.md'), 'utf8');

const keys = (cell) => [...cell.matchAll(/`([a-z0-9]+)`/g)].map((m) => m[1]);
const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim());

const checkSection = coverage.slice(coverage.indexOf('## The '), coverage.indexOf('## What a common setup'));
const rows = checkSection.split('\n').filter((l) => /^\| `[a-z0-9-]+` \|/.test(l)).map((l) => {
  const [slug, kind, needs, adds, cadence] = cells(l);
  return { slug: slug.replace(/`/g, ''), kind, needs, adds, cadence };
});
const toolRows = coverage.slice(0, coverage.indexOf('## The ')).split('\n')
  .filter((l) => /^\| `[a-z0-9]+` \|/.test(l)).map((l) => keys(cells(l)[0])[0]);

function canRun(row, available) {
  return row.needs.split(' + ').every((part) => {
    const t = keys(part);
    return part.startsWith('one of') ? t.some((k) => available.has(k)) : t.every((k) => available.has(k));
  });
}

test('coverage names every playbook in the index, once, with its kind and cadence', () => {
  const bySlug = new Map(index.playbooks.map((p) => [p.slug, p]));
  assert.equal(rows.length, index.playbooks.length);
  assert.equal(new Set(rows.map((r) => r.slug)).size, rows.length, 'a check is listed twice');
  for (const r of rows) {
    const p = bySlug.get(r.slug);
    assert.ok(p, `${r.slug} is not in the playbook index`);
    assert.equal(r.kind, p.kind, `${r.slug}: kind`);
    assert.equal(r.cadence, p.cadence, `${r.slug}: cadence`);
  }
});

test("each check's needs and adds are exactly its tools", () => {
  const bySlug = new Map(index.playbooks.map((p) => [p.slug, p]));
  for (const r of rows) {
    const listed = [...keys(r.needs), ...keys(r.adds)].sort();
    assert.deepEqual(listed, [...bySlug.get(r.slug).tools].sort(), `${r.slug}: Needs + Adds must equal its tools`);
    assert.ok(keys(r.needs).length > 0, `${r.slug}: needs at least one tool`);
  }
});

test('leaks come before plays', () => {
  const firstPlay = rows.findIndex((r) => r.kind === 'play');
  assert.ok(rows.slice(firstPlay).every((r) => r.kind === 'play'));
});

test('every tool in tools.yaml has a row saying when it counts as available', () => {
  assert.deepEqual([...toolRows].sort(), Object.keys(index.tools).sort());
});

test('the stated counts are true', () => {
  const n = index.playbooks.length;
  assert.match(coverage, new RegExp(`## The ${n} checks`));
  assert.match(coverage, new RegExp(`each of the ${n} checks|the ${n} checks needs|which tools each of the ${n} checks`));
  assert.match(skill, new RegExp(`all ${n}`), `SKILL.md should say "all ${n}"`);
  const pub = new Set(Object.entries(index.tools).filter(([, t]) => t.public).map(([k]) => k));
  const count = (extra) => rows.filter((r) => canRun(r, new Set([...pub, ...extra]))).length;
  assert.match(coverage, new RegExp(`No logins at all\\*\\* \\(the store's address only\\): \\*\\*${count([])}\\*\\*`));
  assert.match(coverage, new RegExp(`Store only\\*\\* .*: \\*\\*${count(['shopify'])}\\*\\*`));
  assert.match(coverage, new RegExp(`Store, Meta Ads and the email tool\\*\\* .*: \\*\\*${count(['shopify', 'meta', 'klaviyo'])}\\*\\*`));
});
