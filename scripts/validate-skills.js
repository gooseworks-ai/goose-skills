#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CATEGORIES = ['capabilities', 'composites'];
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'skill-meta.schema.json');

function fail(messages) {
  console.error('Skill validation failed:');
  for (const msg of messages) console.error(`- ${msg}`);
  process.exit(1);
}

function isValidSlug(slug) {
  return /^[a-z0-9-]+$/.test(slug);
}

const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const allowedTags = new Set(schema.properties.tags.items.enum);

const errors = [];
const slugs = new Set();

for (const category of CATEGORIES) {
  const categoryPath = path.join(ROOT, 'skills', category);
  if (!fs.existsSync(categoryPath)) continue;

  for (const slug of fs.readdirSync(categoryPath)) {
    const skillDir = path.join(categoryPath, slug);
    if (!fs.statSync(skillDir).isDirectory()) continue;

    const skillMd = path.join(skillDir, 'SKILL.md');
    const metaPath = path.join(skillDir, 'skill.meta.json');

    if (!fs.existsSync(skillMd)) {
      errors.push(`Missing SKILL.md for ${category}/${slug}`);
      continue;
    }
    if (!fs.existsSync(metaPath)) {
      errors.push(`Missing skill.meta.json for ${category}/${slug}`);
      continue;
    }

    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (err) {
      errors.push(`Invalid JSON in ${category}/${slug}/skill.meta.json`);
      continue;
    }

    if (!isValidSlug(slug)) {
      errors.push(`Directory slug has invalid format: ${category}/${slug}`);
    }
    if (meta.slug !== slug) {
      errors.push(`Slug mismatch in ${category}/${slug}: meta.slug=${meta.slug}`);
    }
    if (meta.category !== category) {
      errors.push(`Category mismatch in ${category}/${slug}: meta.category=${meta.category}`);
    }
    if (!Array.isArray(meta.tags)) {
      errors.push(`tags must be an array in ${category}/${slug}`);
    } else {
      const invalidTags = meta.tags.filter((t) => !allowedTags.has(t));
      if (invalidTags.length) {
        errors.push(
          `invalid tag(s) in ${category}/${slug}: ${invalidTags.join(', ')}. ` +
            `Allowed: ${[...allowedTags].sort().join(', ')}`
        );
      }
    }
    if (!meta.installation || typeof meta.installation.base_command !== 'string' || !meta.installation.base_command.trim()) {
      errors.push(`installation.base_command required in ${category}/${slug}`);
    }
    if (!meta.installation || !Array.isArray(meta.installation.supports) || meta.installation.supports.length === 0) {
      errors.push(`installation.supports required in ${category}/${slug}`);
    }

    if (slugs.has(slug)) {
      errors.push(`Duplicate slug: ${slug}`);
    }
    slugs.add(slug);
  }
}

if (errors.length) fail(errors);
console.log(`Skill validation passed for ${slugs.size} skills.`);
