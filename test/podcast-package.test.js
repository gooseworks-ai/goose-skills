const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '..');
const index = JSON.parse(fs.readFileSync(path.join(root, 'skills-index.json'), 'utf8'));
const renderer = index.skills.find(skill => skill.slug === 'render-podcast-skit');

test('podcast install ships every canonical runtime file with its exact source hash', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, renderer.path, 'source-manifest.json'), 'utf8'));
  for (const [relative, expected] of Object.entries(manifest.sha256)) {
    const file = `${renderer.path}/${relative}`;
    assert.ok(renderer.files.includes(file), `missing from install index: ${file}`);
    const data = fs.readFileSync(path.join(root, file));
    assert.equal(createHash('sha256').update(data).digest('hex'), expected, file);
  }
  for (const relative of ['recipe.json', 'scripts/one_shot.py', 'scripts/gen_paid.py', 'scripts/gates.py', 'scripts/selftest.py', 'scripts/provider_commands.py', 'scripts/test_distribution.py', 'scripts/config.example.json', 'scripts/script.example.json', 'scripts/README.md']) {
    assert.ok(renderer.files.includes(`${renderer.path}/${relative}`), relative);
  }
});

test('podcast paid providers are real indexed dependencies with their executable scripts', () => {
  const required = renderer.metadata.requires_skills;
  for (const [slug, executable] of Object.entries({
    'create-vo-elevenlabs': 'scripts/gen_vo.py',
    'create-image-gpt-image-fal': 'scripts/generate.py',
    'create-video-fal': 'scripts/gen_video.py',
  })) {
    assert.ok(required.includes(slug), `missing install dependency: ${slug}`);
    const skill = index.skills.find(item => item.slug === slug);
    assert.ok(skill, slug);
    assert.ok(skill.files.includes(`${skill.path}/${executable}`), executable);
    assert.ok(skill.files.includes(`${skill.path}/scripts/media_proxy.py`), 'provider transport');
  }
  const recipe = JSON.parse(fs.readFileSync(path.join(root, renderer.path, 'recipe.json'), 'utf8'));
  for (const slug of recipe.atoms) assert.ok(index.skills.some(skill => skill.slug === slug), slug);
  assert.equal(recipe.version, 8);
  assert.equal(recipe.execution, 'client');
  assert.ok(recipe.card.description);
});
