const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateRetirements } = require('../scripts/lib/retirements');
const index = require('../skills-index.json');
const manifest = require('../retired-skills.json');

test('retirement map preserves retained jobs and every active dependency', () => {
  assert.deepEqual(validateRetirements(manifest, index.skills), index.retired_skills);
  // skills/shared/ holds the skills used across families: the current ones
  // (current_shared) and the older ones still needed (retained), never both.
  const shared = index.skills.filter(s => s.path.startsWith('skills/shared/')).map(s => s.slug).sort();
  const retained = manifest.retained.map(s => s.slug);
  const current = manifest.current_shared.map(s => s.slug);
  assert.deepEqual([...retained, ...current].sort(), shared);
  assert.deepEqual(retained.filter(slug => current.includes(slug)), []);
  for (const entry of manifest.retained) assert.ok(entry.reason && entry.remove_when && entry.used_by.length, entry.slug);
  for (const slug of ['meta-ad-manager', 'brand-research', 'remix-graphic-ad-from-reference']) {
    assert.ok(retained.includes(slug), `${slug} is still used and must stay`);
  }
  for (const slug of ['goose-graphics', 'goose-graphics-create-format', 'goose-graphics-create-style']) {
    assert.ok(current.includes(slug), `${slug} is a current skill, not a kept leftover`);
  }
  const removed = manifest.retired.find(s => s.slug === 'weather');
  assert.equal(removed.replacement, null, 'a removed utility may have no replacement');
  assert.ok(removed.reason);
});

test('every user a keep reason names really uses the skill', () => {
  const bySlug = new Map(index.skills.map(s => [s.slug, s]));
  for (const entry of manifest.retained) {
    const skillUsers = entry.used_by.filter(user => user.skill).map(user => user.skill);
    // In this repo: the user lists the kept skill in requires_skills.
    for (const user of skillUsers) {
      assert.ok(bySlug.has(user), `${entry.slug}: unknown user ${user}`);
      assert.ok((bySlug.get(user).metadata.requires_skills || []).includes(entry.slug), `${entry.slug}: ${user} does not require it`);
    }
    // Every skill the reason names is one of those users.
    for (const named of entry.reason.match(/[a-z0-9]+(?:-[a-z0-9]+)+/g) || []) {
      if (bySlug.has(named) && named !== entry.slug) assert.ok(skillUsers.includes(named), `${entry.slug}: the reason names ${named}; add it to used_by`);
    }
    // In another repo: a repo and a file. With a checkout at hand, the file must name the skill.
    for (const user of entry.used_by.filter(u => !u.skill)) {
      assert.ok(['gooseworks-app', 'goose-studio'].includes(user.repo), `${entry.slug}: unknown repo ${user.repo}`);
      assert.match(user.file, /^[\w.-]+(\/[\w.-]+)+$/, `${entry.slug}: used_by.file is a path in ${user.repo}`);
      const checkout = user.repo === 'gooseworks-app' ? process.env.GOOSEWORKS_APP_DIR : process.env.GOOSE_STUDIO_DIR;
      if (checkout) {
        const text = fs.readFileSync(path.join(checkout, user.file), 'utf8');
        assert.ok(text.includes(entry.slug), `${entry.slug}: ${user.repo} ${user.file} does not mention it`);
      }
    }
  }
});

test('rejects active old names, missing replacements, and required retired skills', () => {
  const retired = [{ slug: 'old', replacement: 'new', reason: 'Replaced' }];
  assert.throws(() => validateRetirements({ retired }, [{ slug: 'old' }, { slug: 'new' }]));
  assert.throws(() => validateRetirements({ retired }, []));
  assert.throws(() => validateRetirements({ retired }, [{ slug: 'new', metadata: { requires_skills: ['old'] } }]));
  assert.doesNotThrow(() => validateRetirements({ retired: [{ slug: 'old', replacement: null, reason: 'Removed' }] }, [{ slug: 'new' }]));
  assert.throws(() => validateRetirements({ retired: [{ slug: 'old', replacement: null }] }, [{ slug: 'new' }]));
  assert.throws(() => validateRetirements({ retained: [{ slug: 'new', reason: 'Used' }] }, [{ slug: 'new' }]), /remove_when/);
});

test('rejects a keep with no users, a user that does not require it, and an undeclared shared skill', () => {
  const kept = { slug: 'kept', reason: 'Used.', remove_when: 'unused' };
  const shared = { slug: 'kept', path: 'skills/shared/kept' };
  assert.throws(() => validateRetirements({ retained: [kept] }, [shared]), /needs used_by/);
  assert.throws(
    () => validateRetirements({ retained: [{ ...kept, used_by: [{ skill: 'user' }] }] }, [shared, { slug: 'user', metadata: {} }]),
    /does not list it in requires_skills/,
  );
  assert.doesNotThrow(() => validateRetirements(
    { retained: [{ ...kept, used_by: [{ skill: 'user' }, { repo: 'gooseworks-app', file: 'apps/api/x.ts' }] }] },
    [shared, { slug: 'user', metadata: { requires_skills: ['kept'] } }],
  ));
  assert.throws(() => validateRetirements({ retained: [{ ...kept, used_by: [{ repo: 'gooseworks-app' }] }] }, [shared]), /\{ skill \} or \{ repo, file \}/);
  assert.throws(() => validateRetirements({}, [shared]), /add it to retired-skills\.json/);
  assert.doesNotThrow(() => validateRetirements({ current_shared: [{ slug: 'kept', reason: 'Current.' }] }, [shared]));
  assert.throws(
    () => validateRetirements({ current_shared: [{ slug: 'kept', reason: 'x' }], retained: [{ ...kept, used_by: [{ repo: 'r', file: 'a/b' }] }] }, [shared]),
    /listed twice/,
  );
});

test('retired skill instructions are deleted rather than kept in an archive', () => {
  const root = path.resolve(__dirname, '..');
  const retired = new Set(manifest.retired.map(skill => skill.slug));
  const remaining = [];
  for (const relative of ['skills', 'archive']) {
    const folder = path.join(root, relative);
    if (!fs.existsSync(folder)) continue;
    for (const file of fs.readdirSync(folder, { recursive: true })) {
      const parts = file.split(path.sep);
      if (parts.at(-1) === 'SKILL.md' && parts.some(part => retired.has(part))) {
        remaining.push(path.join(relative, file));
      }
    }
  }
  assert.deepEqual(remaining, [], 'Git history preserves retired instructions; working copies must be removed');
});
