const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const VALIDATE = path.resolve(__dirname, '..', 'validate-skills.js');
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Post-reorg layout is skills/<domain>/<level>/<slug>. Fixtures live under one
// real domain folder so the validator's domain-enum check passes.
const DOMAIN = 'monitoring';

function makeFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-validate-'));
  fs.mkdirSync(path.join(root, 'skills', DOMAIN, 'capabilities'), { recursive: true });
  // Schemas are looked up under ROOT — symlink the real schemas dir so we
  // don't have to copy/maintain a fixture schema.
  fs.symlinkSync(path.join(REPO_ROOT, 'schemas'), path.join(root, 'schemas'));
  return root;
}

function writeSkill(root, slug, frontmatter, meta) {
  const dir = path.join(root, 'skills', DOMAIN, 'capabilities', slug);
  fs.mkdirSync(dir, { recursive: true });
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('\n');
  fs.writeFileSync(
    path.join(dir, 'SKILL.md'),
    `---\n${fm}\n---\n\n# ${slug}\nBody.\n`,
  );
  fs.writeFileSync(path.join(dir, 'skill.meta.json'), JSON.stringify(meta, null, 2));
}

function runValidate(root) {
  return execFileSync('node', [VALIDATE], {
    env: { ...process.env, GOOSE_SKILLS_ROOT: root },
    encoding: 'utf8',
  });
}

const baseMeta = (slug) => ({
  slug,
  category: 'capabilities',
  tags: ['monitoring'],
  installation: {
    base_command: `npx goose-skills install ${slug}`,
    supports: ['claude', 'cursor', 'codex'],
  },
});

test('FAILS when a SKILL.md exists nested-only in packs[].skills[] (regression guard for RC1)', () => {
  const root = makeFixtureRoot();
  // One regular capability so the index isn't empty.
  writeSkill(root, 'twitter-scraper', { name: 'twitter-scraper', description: 'x' }, baseMeta('twitter-scraper'));

  // Add a pack sub-skill on disk.
  fs.mkdirSync(path.join(root, 'skills', DOMAIN, 'packs', 'lead-pack', 'lead-discovery'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'skills', DOMAIN, 'packs', 'lead-pack', 'lead-discovery', 'SKILL.md'),
    '---\nname: lead-discovery\ndescription: Pack-only.\n---\n\n# lead-discovery\n',
  );

  // Hand-craft a stale skills-index.json that mimics the broken pre-fix shape:
  // pack sub-skill present in packs[].skills[] only, NOT in top-level skills[].
  const staleIndex = {
    version: '1.2.0',
    generated: '2026-04-28',
    skills: [
      {
        slug: 'twitter-scraper',
        name: 'twitter-scraper',
        category: 'capabilities',
        path: 'skills/monitoring/capabilities/twitter-scraper',
        files: ['skills/monitoring/capabilities/twitter-scraper/SKILL.md'],
      },
    ],
    packs: [
      {
        slug: 'lead-pack',
        skills: [
          {
            slug: 'lead-discovery',
            path: 'skills/monitoring/packs/lead-pack/lead-discovery',
            source: 'pack',
          },
        ],
      },
    ],
  };
  fs.writeFileSync(path.join(root, 'skills-index.json'), JSON.stringify(staleIndex, null, 2));

  // The regression: previous validator would PASS this because the path
  // existed under packs[].skills[]. Top-level-only check must REJECT it.
  assert.throws(
    () => runValidate(root),
    /missing from top-level idx\.skills\[\]/,
    'validator must fail when a SKILL.md is only nested under packs[].skills[]',
  );

  fs.rmSync(root, { recursive: true, force: true });
});

test('PASSES when every SKILL.md is in top-level skills[]', () => {
  const root = makeFixtureRoot();
  writeSkill(root, 'twitter-scraper', { name: 'twitter-scraper', description: 'x' }, baseMeta('twitter-scraper'));

  // Add a pack sub-skill BOTH on disk AND in top-level (mimics the fix shape).
  fs.mkdirSync(path.join(root, 'skills', DOMAIN, 'packs', 'lead-pack', 'lead-discovery'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'skills', DOMAIN, 'packs', 'lead-pack', 'lead-discovery', 'SKILL.md'),
    '---\nname: lead-discovery\ndescription: Pack-only.\n---\n\n# lead-discovery\n',
  );

  const goodIndex = {
    version: '1.2.0',
    generated: '2026-04-28',
    skills: [
      {
        slug: 'twitter-scraper',
        category: 'capabilities',
        path: 'skills/monitoring/capabilities/twitter-scraper',
        files: ['skills/monitoring/capabilities/twitter-scraper/SKILL.md'],
      },
      {
        slug: 'lead-discovery',
        category: 'capabilities',
        path: 'skills/monitoring/packs/lead-pack/lead-discovery',
        files: ['skills/monitoring/packs/lead-pack/lead-discovery/SKILL.md'],
        metadata: { pack: 'lead-pack' },
      },
    ],
    packs: [
      {
        slug: 'lead-pack',
        skills: [
          {
            slug: 'lead-discovery',
            path: 'skills/monitoring/packs/lead-pack/lead-discovery',
            source: 'pack',
          },
        ],
      },
    ],
  };
  fs.writeFileSync(path.join(root, 'skills-index.json'), JSON.stringify(goodIndex, null, 2));

  const out = runValidate(root);
  assert.match(out, /Skill validation passed/);

  fs.rmSync(root, { recursive: true, force: true });
});
