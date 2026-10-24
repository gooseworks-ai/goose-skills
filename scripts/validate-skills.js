#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { validate: validateSchema } = require('./lib/json-schema');

// ROOT defaults to the repo root, but tests can override via env var
// (matches the same convention used by build-index.js).
const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'skill-meta.schema.json');

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

// One metadata contract for every family: schemas/skill-meta.schema.json. The
// rules below are the ones a schema cannot say, because they depend on the
// folder or on SKILL.md.
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

const errors = [];
const slugs = new Set();

// Skill families: skills/<family>/<slug>/ (see build-index.js). Every folder in
// a family is published; work that is not ready to publish lives in drafts/.
const FAMILIES = ['marketing', 'video', 'shared', 'entry'];
// The domain a family's skills get when their meta names none. Shared skills must name one.
const FAMILY_DOMAIN = { marketing: 'marketing-agent', video: 'ads', shared: null, entry: 'gooseworks' };
// Domains that belong to one family only.
const OWN_DOMAIN = { 'marketing-agent': 'marketing', gooseworks: 'entry' };
const MA_TIERS = new Set(['playbook', 'atom', 'foundation']);
// Entry skills come with the GooseWorks CLI; every other skill installs alone, by slug.
const ENTRY_INSTALL = 'npx gooseworks@latest install --mcp';
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

const published = [];
for (const family of FAMILIES) {
  const familyDir = path.join(skillsRoot, family);
  if (!isDir(familyDir)) continue;
  for (const slug of fs.readdirSync(familyDir).sort()) {
    const skillDir = path.join(familyDir, slug);
    if (slug.startsWith('.') || !isDir(skillDir)) continue;
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
    // A generated package (release.json, published from goose-studio) is checked
    // byte for byte against its provenance, so its SKILL.md and meta are fixed in
    // the generator, not here; the version and frontmatter rules wait for that.
    const generated = fs.existsSync(path.join(skillDir, 'release.json'));

    if (!isValidSlug(slug)) errors.push(`Directory slug has invalid format: ${where}`);
    if (meta.slug !== slug) errors.push(`Slug mismatch in ${where}: meta.slug=${meta.slug}`);
    if (slugs.has(slug)) errors.push(`Duplicate slug: ${slug}`);
    slugs.add(slug);

    // The shared contract.
    for (const problem of validateSchema(schema, meta)) {
      if (generated && problem === '$: version is required') continue;
      const at = problem.replace(/^\$\.?/, '');
      errors.push(`${where}/skill.meta.json${at.startsWith(':') ? '' : ' '}${at}`);
    }

    // SKILL.md frontmatter repeats some fields; a copy must agree with the meta.
    if (fm.name !== slug) errors.push(`Frontmatter name must be the slug in ${where}: name=${fm.name}`);
    if (!generated && fm.version !== undefined && fm.version !== meta.version) {
      errors.push(`version in SKILL.md (${fm.version}) and skill.meta.json (${meta.version}) differ in ${where}`);
    }
    if (!generated && fm.category !== undefined && fm.category !== meta.category) {
      errors.push(`category in SKILL.md (${fm.category}) and skill.meta.json (${meta.category}) differ in ${where}: delete the SKILL.md line`);
    }
    if (!fm.description) errors.push(`description required in ${where}/SKILL.md`);
    else if (fm.description.length > DESCRIPTION_LIMIT) {
      errors.push(`description over ${DESCRIPTION_LIMIT} characters (${fm.description.length}) in ${where}`);
    }

    // Family rules.
    const domain = meta.domain || FAMILY_DOMAIN[family];
    if (!domain) errors.push(`domain required in ${where}/skill.meta.json`);
    else if (OWN_DOMAIN[domain] && OWN_DOMAIN[domain] !== family) {
      errors.push(`domain "${domain}" is only for skills/${OWN_DOMAIN[domain]}/ (${where})`);
    } else if (FAMILY_DOMAIN[family] && OWN_DOMAIN[FAMILY_DOMAIN[family]] && domain !== FAMILY_DOMAIN[family]) {
      errors.push(`skills/${family}/ skills have domain "${FAMILY_DOMAIN[family]}" (${where}: ${domain})`);
    }
    const install = meta.installation && meta.installation.base_command;
    const expectedInstall = family === 'entry' ? ENTRY_INSTALL : `npx goose-skills install ${slug}`;
    if (typeof install === 'string' && install !== expectedInstall) {
      errors.push(`installation.base_command must be "${expectedInstall}" in ${where}: ${JSON.stringify(install)}`);
    }
    if (family === 'marketing') {
      if (!MA_TIERS.has(meta.tier)) errors.push(`tier must be one of ${[...MA_TIERS].join(', ')} in ${where}`);
      if (fm.version === undefined) errors.push(`version required in ${where}/SKILL.md frontmatter (same as skill.meta.json)`);
      if (!Array.isArray(meta.tags) || meta.tags.length === 0) errors.push(`tags must be a non-empty array in ${where}`);
      if (!Array.isArray(meta.requires_skills)) errors.push(`requires_skills must be an array in ${where}`);
    } else if (family === 'entry') {
      // Entry skills are installed by `gooseworks install` and compared by version.
      if (meta.tier !== 'entry') errors.push(`tier must be "entry" in ${where}`);
      if (fm.version === undefined) errors.push(`version required in ${where}/SKILL.md frontmatter (same as skill.meta.json)`);
    } else if (meta.tier !== undefined) {
      errors.push(`tier is only for marketing and entry skills (${where})`);
    }
    published.push({ slug, where, meta });
  }
}
for (const { where, meta } of published) {
  for (const dep of meta.requires_skills || []) {
    if (!slugs.has(dep)) errors.push(`${where} requires unknown skill "${dep}"`);
  }
}

// Folder ⊆ index check: every skill folder must be a top-level entry in
// skills[]. Downstream consumers (the backend sync and the Payload CMS push)
// iterate idx.skills[] only.
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
