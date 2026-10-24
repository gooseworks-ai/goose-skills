const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateRetirements, supersededOnDisk, readSupersededFrontmatter } = require('../scripts/lib/retirements');
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

// ── superseded video atoms ────────────────────────────────────────────────

const REPO = path.resolve(__dirname, '..');

test('every superseded atom is listed with its replacement parts, its users and when it can go', () => {
  const onDisk = supersededOnDisk(REPO, index.skills);
  assert.ok(onDisk.size > 0, 'superseded video atoms are found on disk');
  assert.doesNotThrow(() => validateRetirements(manifest, index.skills, { superseded: onDisk }));
  assert.deepEqual(manifest.superseded.map(e => e.slug).sort(), [...onDisk.keys()].sort());
  const parts = new Set(require('../parts/index.json').parts.map(p => `${p.id}@${p.version}`));
  for (const entry of manifest.superseded) {
    assert.ok(entry.reason && entry.remove_when, entry.slug);
    for (const ref of entry.replaced_by) assert.ok(parts.has(ref), `${entry.slug}: ${ref} is a published part version`);
  }
  // A superseded atom nothing uses is retired, not kept.
  assert.deepEqual(manifest.superseded.filter(e => e.used_by.length === 0).map(e => e.slug), []);
});

test('a superseded atom\'s users are real (recipes and files checked when a checkout is at hand)', () => {
  const bySlug = new Map(index.skills.map(s => [s.slug, s]));
  const recipes = new Set(require('./fixtures/entry-lint/video-recipe-slugs.json').recipes);
  for (const entry of manifest.superseded) {
    for (const user of entry.used_by) {
      if (user.skill) {
        assert.ok((bySlug.get(user.skill).metadata.requires_skills || []).includes(entry.slug), `${entry.slug}: ${user.skill} does not require it`);
      } else if (user.recipes) {
        assert.equal(user.repo, 'goose-studio');
        for (const r of user.recipes) {
          assert.ok(recipes.has(r), `${entry.slug}: ${r} is not a recipe in the snapshot`);
          if (process.env.GOOSE_STUDIO_DIR) {
            const text = fs.readFileSync(path.join(process.env.GOOSE_STUDIO_DIR, 'one-shot-videos', r, 'recipe.json'), 'utf8');
            assert.match(text, new RegExp(`(?<![\\w-])${entry.slug}(?![\\w-])`), `${entry.slug}: recipe ${r} does not name it`);
          }
        }
      } else {
        assert.ok(['gooseworks-app', 'goose-studio'].includes(user.repo), `${entry.slug}: unknown repo ${user.repo}`);
        const checkout = user.repo === 'gooseworks-app' ? process.env.GOOSEWORKS_APP_DIR : process.env.GOOSE_STUDIO_DIR;
        if (checkout) {
          assert.ok(fs.readFileSync(path.join(checkout, user.file), 'utf8').includes(entry.slug), `${entry.slug}: ${user.repo} ${user.file} does not mention it`);
        }
      }
    }
  }
});

test('rejects an unlisted superseded atom, a listed atom that is not superseded, and replacement parts that differ', () => {
  const atom = { slug: 'old-captions', path: 'skills/video/old-captions', metadata: {} };
  const entry = { slug: 'old-captions', replaced_by: ['captions-layer@1.1.0'], reason: 'Recipes use it.', remove_when: 'they move', used_by: [] };
  const superseded = new Map([['old-captions', ['captions-layer@1.1.0']]]);
  assert.doesNotThrow(() => validateRetirements({ superseded: [entry] }, [atom], { superseded }));
  assert.throws(() => validateRetirements({}, [atom], { superseded }), /add it to retired-skills\.json superseded/);
  assert.throws(() => validateRetirements({ superseded: [entry] }, [atom], { superseded: new Map() }), /does not say status: superseded/);
  assert.throws(
    () => validateRetirements({ superseded: [{ ...entry, replaced_by: ['captions-layer@1.0.0'] }] }, [atom], { superseded }),
    /must match the SKILL\.md superseded_by/,
  );
  assert.throws(() => validateRetirements({ superseded: [{ ...entry, remove_when: '' }] }, [atom], { superseded }), /reason and remove_when/);
  assert.throws(() => validateRetirements({ superseded: [{ ...entry, used_by: undefined }] }, [atom], { superseded }), /needs used_by/);
  assert.throws(
    () => validateRetirements({ superseded: [{ ...entry, used_by: [{ skill: 'render-x' }] }] }, [atom, { slug: 'render-x', metadata: {} }], { superseded }),
    /does not list it in requires_skills/,
  );
  assert.throws(() => validateRetirements({ superseded: [{ ...entry, used_by: [{ repo: 'goose-studio', recipes: [] }] }] }, [atom], { superseded }), /non-empty list of recipe slugs/);
  assert.doesNotThrow(() => validateRetirements(
    { superseded: [{ ...entry, used_by: [{ repo: 'goose-studio', recipes: ['create-demo-video-from-refs'] }, { repo: 'gooseworks-app', file: 'apps/api/x.ts' }] }] },
    [atom],
    { superseded },
  ));
});

test('superseded_by is read as one id, a comma list, a flow list or a block list', () => {
  assert.deepEqual(readSupersededFrontmatter('---\nname: a\nstatus: superseded\nsuperseded_by: phone-chat@1.2.0\n---\n'), ['phone-chat@1.2.0']);
  assert.deepEqual(readSupersededFrontmatter('---\nstatus: superseded\nsuperseded_by: audio-mix@1.0.1, sound-layer@1.0.4\n---\n'), ['audio-mix@1.0.1', 'sound-layer@1.0.4']);
  assert.deepEqual(readSupersededFrontmatter('---\nstatus: superseded\nsuperseded_by: [a@1.0.0, "b@2.0.0"]\n---\n'), ['a@1.0.0', 'b@2.0.0']);
  assert.deepEqual(readSupersededFrontmatter('---\nstatus: superseded\nsuperseded_by:\n  - a@1.0.0\n  - b@2.0.0\n---\n'), ['a@1.0.0', 'b@2.0.0']);
  assert.equal(readSupersededFrontmatter('---\nstatus: active\n---\n'), null);
});
