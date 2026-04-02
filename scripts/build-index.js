#!/usr/bin/env node

/**
 * Build skills-index.json from SKILL.md + skill.meta.json files.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'skills-index.json');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result = {};
  for (const line of yaml.split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (!kvMatch) continue;
    let value = kvMatch[2].trim().replace(/^['"]|['"]$/g, '');
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((s) => s.trim());
    }
    result[kvMatch[1]] = value;
  }
  return result;
}

const SKIP_DIRS = new Set(['.tmp', '__pycache__', 'node_modules', '.git']);
const SKIP_EXTS = new Set(['.pyc', '.pyo']);

function collectFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...collectFiles(full));
    } else {
      if (SKIP_EXTS.has(path.extname(entry.name))) continue;
      files.push(full);
    }
  }
  return files;
}

function scanCategory(category) {
  const categoryDir = path.join(ROOT, 'skills', category);
  if (!fs.existsSync(categoryDir)) return [];

  const skills = [];
  const slugs = fs.readdirSync(categoryDir).filter((d) =>
    fs.statSync(path.join(categoryDir, d)).isDirectory()
  );

  for (const slug of slugs) {
    const skillDir = path.join(categoryDir, slug);
    const skillMd = path.join(skillDir, 'SKILL.md');
    const metaPath = path.join(skillDir, 'skill.meta.json');

    if (!fs.existsSync(skillMd)) continue;
    if (!fs.existsSync(metaPath)) {
      throw new Error(`Missing skill.meta.json for skills/${category}/${slug}`);
    }

    const content = fs.readFileSync(skillMd, 'utf8');
    const metaFromFrontmatter = parseFrontmatter(content);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    const allFiles = collectFiles(skillDir).map((f) => path.relative(ROOT, f));

    skills.push({
      slug,
      name: metaFromFrontmatter.name || slug,
      category,
      description: metaFromFrontmatter.description || '',
      tags: Array.isArray(meta.tags) ? meta.tags.join(', ') : '',
      path: `skills/${category}/${slug}`,
      files: allFiles,
      metadata: meta,
    });
  }

  return skills;
}

function scanPacks(registrySkills) {
  const packsDir = path.join(ROOT, 'skills', 'packs');
  if (!fs.existsSync(packsDir)) return [];

  const registryBySlug = {};
  for (const s of registrySkills) {
    registryBySlug[s.slug] = s;
  }

  const packs = [];
  const slugs = fs.readdirSync(packsDir).filter((d) =>
    fs.statSync(path.join(packsDir, d)).isDirectory()
  );

  for (const slug of slugs) {
    const packDir = path.join(packsDir, slug);
    const metaPath = path.join(packDir, 'pack.meta.json');

    if (!fs.existsSync(metaPath)) continue;

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    // Build pack-local sub-skill entries
    const subSkills = [];
    for (const skillSlug of (meta.skills || [])) {
      const skillDir = path.join(packDir, skillSlug);
      const skillMd = path.join(skillDir, 'SKILL.md');

      if (!fs.existsSync(skillMd)) {
        throw new Error(`Pack "${slug}": missing SKILL.md in ${skillSlug}/`);
      }

      const content = fs.readFileSync(skillMd, 'utf8');
      const frontmatter = parseFrontmatter(content);
      const allFiles = collectFiles(skillDir).map((f) => path.relative(ROOT, f));

      subSkills.push({
        slug: skillSlug,
        name: frontmatter.name || skillSlug,
        description: frontmatter.description || '',
        path: `skills/packs/${slug}/${skillSlug}`,
        files: allFiles,
        source: 'pack',
      });
    }

    // Resolve registry skill references
    for (const regSlug of (meta.registry_skills || [])) {
      const regSkill = registryBySlug[regSlug];
      if (!regSkill) {
        throw new Error(`Pack "${slug}": registry_skills references unknown skill "${regSlug}"`);
      }
      subSkills.push({
        slug: regSkill.slug,
        name: regSkill.name,
        description: regSkill.description,
        path: regSkill.path,
        files: regSkill.files,
        source: 'registry',
      });
    }

    // Collect shared files
    const sharedFiles = (meta.shared_files || [])
      .map((f) => `skills/packs/${slug}/${f}`)
      .filter((f) => fs.existsSync(path.join(ROOT, f)));

    packs.push({
      slug,
      name: meta.name || slug,
      type: 'pack',
      description: meta.description || '',
      tags: Array.isArray(meta.tags) ? meta.tags.join(', ') : '',
      path: `skills/packs/${slug}`,
      shared_files: sharedFiles,
      skills: subSkills,
      metadata: meta,
    });
  }

  return packs;
}

const skills = [
  ...scanCategory('capabilities'),
  ...scanCategory('composites'),
  ...scanCategory('playbooks'),
].sort((a, b) => a.slug.localeCompare(b.slug));

const packs = scanPacks(skills).sort((a, b) => a.slug.localeCompare(b.slug));

// Validate no slug collisions between packs and skills
const skillSlugs = new Set(skills.map((s) => s.slug));
for (const pack of packs) {
  if (skillSlugs.has(pack.slug)) {
    throw new Error(`Pack slug "${pack.slug}" collides with an existing skill slug`);
  }
}

const index = {
  version: '1.2.0',
  generated: new Date().toISOString().split('T')[0],
  skills,
  packs,
};

fs.writeFileSync(OUTPUT, JSON.stringify(index, null, 2) + '\n');
console.log(`Generated ${OUTPUT} with ${skills.length} skills and ${packs.length} packs.`);
