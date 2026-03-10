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

function collectFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else {
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

const skills = [
  ...scanCategory('capabilities'),
  ...scanCategory('composites'),
  ...scanCategory('playbooks'),
].sort((a, b) => a.slug.localeCompare(b.slug));

const index = {
  version: '1.1.0',
  generated: new Date().toISOString().split('T')[0],
  skills,
};

fs.writeFileSync(OUTPUT, JSON.stringify(index, null, 2) + '\n');
console.log(`Generated ${OUTPUT} with ${skills.length} skills.`);
