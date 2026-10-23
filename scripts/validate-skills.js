#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ROOT defaults to the repo root, but tests can override via env var
// (matches the same convention used by build-index.js).
const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');
// Abstraction levels; skill.meta.json `category` must be one of these.
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

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
// Skill families: skills/<family>/<slug>/ (see build-index.js). Marketing skills
// carry a tier and stricter frontmatter rules.
const FAMILIES = ['marketing', 'video', 'shared'];
const FAMILY_DOMAIN = { marketing: 'marketing-agent', video: 'ads', shared: null };
const MA_TIERS = new Set(['playbook', 'atom', 'foundation']);
const DESCRIPTION_LIMIT = 1024;

function blockFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const lines = m[1].split('\n');
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^(\w[\w-]*):\s*(.*)$/);
    if (!kv) continue;
    if (/^[>|][-+]?$/.test(kv[2].trim())) {
      const block = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || lines[i + 1] === '')) block.push(lines[++i].trim());
      out[kv[1]] = block.join(' ').replace(/\s+/g, ' ').trim();
    } else {
      out[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return out;
}

const skillsRoot = path.join(ROOT, 'skills');
for (const entry of isDir(skillsRoot) ? fs.readdirSync(skillsRoot) : []) {
  if (isDir(path.join(skillsRoot, entry)) && !FAMILIES.includes(entry)) {
    errors.push(`Unknown folder skills/${entry}: skills live in skills/{${FAMILIES.join(',')}}/<slug>/`);
  }
}

// Pack members (packs/<pack>.json) publish as capabilities whatever their own meta says.
const packMembers = new Set();
const packsDir = path.join(ROOT, 'packs');
for (const file of isDir(packsDir) ? fs.readdirSync(packsDir).filter((f) => f.endsWith('.json')) : []) {
  for (const slug of JSON.parse(fs.readFileSync(path.join(packsDir, file), 'utf8')).skills || []) packMembers.add(slug);
}

const published = [];
for (const family of FAMILIES) {
  const familyDir = path.join(skillsRoot, family);
  if (!isDir(familyDir)) continue;
  for (const slug of fs.readdirSync(familyDir).sort()) {
    const skillDir = path.join(familyDir, slug);
    if (!isDir(skillDir)) continue;
    const where = `skills/${family}/${slug}`;
    const skillMd = path.join(skillDir, 'SKILL.md');
    const metaPath = path.join(skillDir, 'skill.meta.json');
    if (!fs.existsSync(skillMd)) { errors.push(`Missing SKILL.md for ${where}`); continue; }
    if (!fs.existsSync(metaPath)) { errors.push(`Missing skill.meta.json for ${where}`); continue; }
    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (err) {
      errors.push(`Invalid JSON in ${where}/skill.meta.json`);
      continue;
    }
    const fm = blockFrontmatter(fs.readFileSync(skillMd, 'utf8'));
    if (!fm) { errors.push(`${where}/SKILL.md has no frontmatter`); continue; }

    if (!isValidSlug(slug)) errors.push(`Directory slug has invalid format: ${where}`);
    if (meta.slug !== slug) errors.push(`Slug mismatch in ${where}: meta.slug=${meta.slug}`);
    if (slugs.has(slug)) errors.push(`Duplicate slug: ${slug}`);
    slugs.add(slug);

    if (family === 'marketing') {
      if (fm.name !== slug) errors.push(`Frontmatter name must be the slug in ${where}: name=${fm.name}`);
      if (!MA_TIERS.has(meta.tier)) errors.push(`tier must be one of ${[...MA_TIERS].join(', ')} in ${where}`);
      if (meta.catalog === false) continue; // kept for evals, never published
      if (!SEMVER.test(String(meta.version))) {
        errors.push(`version must be a semver string (x.y.z) in ${where}: ${JSON.stringify(meta.version)}`);
      } else if (fm.version !== meta.version) {
        errors.push(`version in SKILL.md (${fm.version}) and skill.meta.json (${meta.version}) differ in ${where}`);
      }
      if (!Array.isArray(meta.tags) || meta.tags.length === 0) errors.push(`tags must be a non-empty array in ${where}`);
      if (!Array.isArray(meta.requires_skills)) errors.push(`requires_skills must be an array in ${where}`);
    } else if (meta.version !== undefined && !SEMVER.test(String(meta.version))) {
      errors.push(`version must be a semver string (x.y.z) in ${where}: ${JSON.stringify(meta.version)}`);
    }
    if (meta.catalog === false) continue;

    if (!packMembers.has(slug) && !LEVELS.includes(meta.category)) {
      errors.push(`category must be one of ${LEVELS.join(', ')} in ${where}: ${meta.category}`);
    }
    const domain = meta.domain || FAMILY_DOMAIN[family];
    if (!domain) errors.push(`domain required in ${where}/skill.meta.json`);
    else if (family !== 'marketing' && allowedDomains.size && !allowedDomains.has(domain)) {
      errors.push(`Unknown domain "${domain}" in ${where}: allowed ${[...allowedDomains].sort().join(', ')}`);
    }
    if (!fm.description) errors.push(`description required in ${where}/SKILL.md`);
    else if (fm.description.length > DESCRIPTION_LIMIT) {
      errors.push(`description over ${DESCRIPTION_LIMIT} characters (${fm.description.length}) in ${where}`);
    }
    if (!Array.isArray(meta.tags)) {
      errors.push(`tags must be an array in ${where}`);
    } else {
      const invalidTags = meta.tags.filter((t) => !allowedTags.has(t));
      if (invalidTags.length) {
        errors.push(`invalid tag(s) in ${where}: ${invalidTags.join(', ')}. Allowed: ${[...allowedTags].sort().join(', ')}`);
      }
    }
    if (!meta.installation || typeof meta.installation.base_command !== 'string' || !meta.installation.base_command.trim()) {
      errors.push(`installation.base_command required in ${where}`);
    }
    if (!meta.installation || !Array.isArray(meta.installation.supports) || meta.installation.supports.length === 0) {
      errors.push(`installation.supports required in ${where}`);
    }
    published.push({ slug, where, meta });
  }
}
for (const { where, meta } of published) {
  for (const dep of meta.requires_skills || []) {
    if (!slugs.has(dep)) errors.push(`${where} requires unknown skill "${dep}"`);
  }
}

// Folder ⊆ index check: every published skill folder must be a TOP-LEVEL entry in
// skills[]. Downstream consumers (the backend sync and the Payload CMS push)
// iterate idx.skills[] only, so a skill seen only inside packs[] is invisible.
const indexPath = path.join(ROOT, 'skills-index.json');
if (fs.existsSync(indexPath)) {
  let index;
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (err) {
    errors.push(`skills-index.json is not valid JSON: ${err.message}`);
  }
  if (index) {
    const topLevelPaths = new Set((index.skills || []).map((s) => s.path));
    const missing = published.map(({ where }) => where).filter((d) => !topLevelPaths.has(d));
    if (missing.length) {
      errors.push(
        `${missing.length} skill folder(s) are missing from top-level idx.skills[]. ` +
          `Run \`npm run build:index\` to regenerate. Missing:\n  ${missing.join('\n  ')}`,
      );
    }
  }
} else {
  errors.push('skills-index.json missing — run `npm run build:index` first.');
}

if (errors.length) fail(errors);
console.log(`Skill validation passed for ${slugs.size} skills.`);
