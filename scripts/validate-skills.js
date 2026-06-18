#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ROOT defaults to the repo root, but tests can override via env var
// (matches the same convention used by build-index.js).
const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');
// Abstraction levels (the second path segment). Domain is the first segment.
const LEVELS = ['capabilities', 'composites', 'playbooks'];
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'skill-meta.schema.json');
const SKIP_DIRS = new Set(['.tmp', '__pycache__', 'node_modules', '.git']);

function fail(messages) {
  console.error('Skill validation failed:');
  for (const msg of messages) console.error(`- ${msg}`);
  process.exit(1);
}

function isValidSlug(slug) {
  return /^[a-z0-9-]+$/.test(slug);
}

function isDir(p) {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
const allowedTags = new Set(schema.properties.tags.items.enum);
// The set of valid domain folders comes from the schema's `domain` enum.
const allowedDomains = new Set(
  (schema.properties.domain && schema.properties.domain.enum) || [],
);

const errors = [];
const slugs = new Set();

// Walk the skills/ tree to find every SKILL.md location (skipping dependency
// dirs). Used at the end to assert every skill is represented in the index that
// build-index.js produces (catches drift where skills exist on disk but aren't
// visible to downstream consumers).
function collectSkillMdDirs(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectSkillMdDirs(path.join(dir, entry.name), results);
    } else if (entry.name === 'SKILL.md') {
      results.push(path.relative(ROOT, dir));
    }
  }
  return results;
}

const skillsRoot = path.join(ROOT, 'skills');
const domains = fs.existsSync(skillsRoot)
  ? fs.readdirSync(skillsRoot).filter((d) => isDir(path.join(skillsRoot, d)))
  : [];

for (const domain of domains) {
  if (allowedDomains.size && !allowedDomains.has(domain)) {
    errors.push(
      `Unknown domain folder skills/${domain} — allowed: ${[...allowedDomains].sort().join(', ')}`,
    );
  }

  for (const category of LEVELS) {
    const categoryPath = path.join(skillsRoot, domain, category);
    if (!isDir(categoryPath)) continue;

    for (const slug of fs.readdirSync(categoryPath)) {
      const skillDir = path.join(categoryPath, slug);
      if (!isDir(skillDir)) continue;

      const where = `${domain}/${category}/${slug}`;
      const skillMd = path.join(skillDir, 'SKILL.md');
      const metaPath = path.join(skillDir, 'skill.meta.json');

      if (!fs.existsSync(skillMd)) {
        errors.push(`Missing SKILL.md for ${where}`);
        continue;
      }
      if (!fs.existsSync(metaPath)) {
        errors.push(`Missing skill.meta.json for ${where}`);
        continue;
      }

      let meta;
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (err) {
        errors.push(`Invalid JSON in ${where}/skill.meta.json`);
        continue;
      }

      if (!isValidSlug(slug)) {
        errors.push(`Directory slug has invalid format: ${where}`);
      }
      if (meta.slug !== slug) {
        errors.push(`Slug mismatch in ${where}: meta.slug=${meta.slug}`);
      }
      if (meta.category !== category) {
        errors.push(`Category mismatch in ${where}: meta.category=${meta.category}`);
      }
      if (!Array.isArray(meta.tags)) {
        errors.push(`tags must be an array in ${where}`);
      } else {
        const invalidTags = meta.tags.filter((t) => !allowedTags.has(t));
        if (invalidTags.length) {
          errors.push(
            `invalid tag(s) in ${where}: ${invalidTags.join(', ')}. ` +
              `Allowed: ${[...allowedTags].sort().join(', ')}`,
          );
        }
      }
      if (!meta.installation || typeof meta.installation.base_command !== 'string' || !meta.installation.base_command.trim()) {
        errors.push(`installation.base_command required in ${where}`);
      }
      if (!meta.installation || !Array.isArray(meta.installation.supports) || meta.installation.supports.length === 0) {
        errors.push(`installation.supports required in ${where}`);
      }

      if (slugs.has(slug)) {
        errors.push(`Duplicate slug: ${slug}`);
      }
      slugs.add(slug);
    }
  }
}

// Tree ⊆ index check — every SKILL.md on disk must be representable in the
// index that build-index.js produces. Catches the class of bugs where skills
// exist on disk but the build script drops them (e.g., pack sub-skills missing
// from top-level skills[]).
const allSkillMdDirs = collectSkillMdDirs(skillsRoot);
const indexPath = path.join(ROOT, 'skills-index.json');
if (fs.existsSync(indexPath)) {
  let index;
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (err) {
    errors.push(`skills-index.json is not valid JSON: ${err.message}`);
  }

  if (index) {
    // STRICT: every SKILL.md on disk must appear in the TOP-LEVEL skills[].
    // Nested presence in packs[].skills[] does NOT satisfy this — that's the
    // exact regression the validator must catch. Downstream consumers (the
    // backend sync and the Payload CMS push) iterate idx.skills[] only.
    const topLevelPaths = new Set();
    for (const s of index.skills || []) {
      if (s.path) topLevelPaths.add(s.path);
    }

    const missing = allSkillMdDirs.filter((d) => !topLevelPaths.has(d));
    if (missing.length) {
      errors.push(
        `${missing.length} SKILL.md file(s) are missing from top-level idx.skills[]. ` +
          `Pack sub-skills must be promoted to top-level — nested presence in ` +
          `packs[].skills[] is invisible to the backend DB sync and Payload CMS push. ` +
          `Run \`npm run build:index\` to regenerate. Missing:\n  ${missing.join('\n  ')}`,
      );
    }
  }
} else {
  errors.push('skills-index.json missing — run `npm run build:index` first.');
}

if (errors.length) fail(errors);
console.log(`Skill validation passed for ${slugs.size} skills.`);
