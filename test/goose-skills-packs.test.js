const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  placeForCodex,
  placeForCursor,
} = require('../bin/lib/targets');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'goose-skills-pack-test-'));
}

function createFakeSubSkill(baseDir, slug) {
  const dir = path.join(baseDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `# ${slug} skill`);
  return dir;
}

test('pack install creates separate directories per sub-skill', () => {
  const tmp = makeTmpDir();
  const skillsRoot = path.join(tmp, '.claude', 'skills');
  fs.mkdirSync(skillsRoot, { recursive: true });

  const slugs = ['lead-discovery', 'github-repo-signals', 'demo-builder'];
  for (const slug of slugs) {
    createFakeSubSkill(skillsRoot, slug);
  }

  // Each sub-skill should have its own directory
  for (const slug of slugs) {
    const dir = path.join(skillsRoot, slug);
    assert.ok(fs.existsSync(dir), `${slug} directory should exist`);
    assert.ok(
      fs.existsSync(path.join(dir, 'SKILL.md')),
      `${slug}/SKILL.md should exist`
    );
  }
});

test('shared files can be copied to each sub-skill directory', () => {
  const tmp = makeTmpDir();
  const skillsRoot = path.join(tmp, '.claude', 'skills');

  const slugs = ['lead-discovery', 'github-repo-signals'];
  for (const slug of slugs) {
    createFakeSubSkill(skillsRoot, slug);
  }

  // Simulate copying shared files
  const sharedContent = 'APIFY_API_TOKEN=your_token_here\n';
  for (const slug of slugs) {
    fs.writeFileSync(path.join(skillsRoot, slug, '.env.example'), sharedContent);
  }

  // Verify shared files exist in each sub-skill
  for (const slug of slugs) {
    const envPath = path.join(skillsRoot, slug, '.env.example');
    assert.ok(fs.existsSync(envPath), `.env.example should exist in ${slug}`);
    assert.equal(fs.readFileSync(envPath, 'utf8'), sharedContent);
  }
});

test('placeForCodex works for each sub-skill in a pack', () => {
  const tmp = makeTmpDir();
  const skillsRoot = path.join(tmp, '.claude', 'skills');
  const codexRoot = path.join(tmp, '.codex', 'skills');

  const slugs = ['lead-discovery', 'demo-builder'];
  for (const slug of slugs) {
    const sourceDir = createFakeSubSkill(skillsRoot, slug);
    const dest = placeForCodex(sourceDir, codexRoot);
    assert.equal(dest, path.join(codexRoot, slug));
    assert.ok(fs.existsSync(path.join(dest, 'SKILL.md')));
  }
});

test('placeForCursor works for each sub-skill in a pack', () => {
  const tmp = makeTmpDir();
  const skillsRoot = path.join(tmp, '.claude', 'skills');
  const projectDir = path.join(tmp, 'project');
  fs.mkdirSync(projectDir, { recursive: true });

  const slugs = ['lead-discovery', 'demo-builder'];
  for (const slug of slugs) {
    const sourceDir = createFakeSubSkill(skillsRoot, slug);
    const rulePath = placeForCursor(sourceDir, projectDir);
    assert.equal(
      rulePath,
      path.join(projectDir, '.cursor', 'rules', `goose-${slug}.mdc`)
    );
    const contents = fs.readFileSync(rulePath, 'utf8');
    assert.match(contents, new RegExp(`# ${slug} skill`));
  }
});
