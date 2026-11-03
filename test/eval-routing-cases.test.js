// The marketing routing eval (evals/marketing/routing/cases.jsonl) may only
// expect or accept a skill that exists, or "none". A case that accepts a
// deleted skill (the old marketing-agent router, say) passes a wrong pick.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const index = require('../skills-index.json');

const CASES = path.join(__dirname, '..', 'evals', 'marketing', 'routing', 'cases.jsonl');

test('every routing case names a published skill or none', () => {
  const slugs = new Set(index.skills.map((s) => s.slug));
  const lines = fs.readFileSync(CASES, 'utf8').split('\n').filter((l) => l.trim());
  assert.ok(lines.length > 0);
  const ids = new Set();
  for (const line of lines) {
    const c = JSON.parse(line);
    assert.ok(!ids.has(c.id), `duplicate case ${c.id}`);
    ids.add(c.id);
    for (const name of [c.expected_playbook, ...(c.acceptable_alternatives || [])]) {
      assert.ok(name === 'none' || slugs.has(name), `${c.id}: "${name}" is not a published skill`);
    }
    if (c.acceptable_alternatives) assert.ok(c.acceptable_alternatives.length > 0, `${c.id}: drop an empty acceptable_alternatives`);
  }
});
