#!/usr/bin/env node

/**
 * Build skills-index.json from SKILL.md + skill.meta.json files.
 *
 * Layout (2026-10-23): one flat folder per skill, grouped by family:
 *   skills/marketing/<slug>/   marketing playbooks, their steps and foundations
 *   skills/video/<slug>/       video skills (atoms, formats, the production harness)
 *   skills/shared/<slug>/      older skills that a video skill, a playbook or
 *                              gooseworks-app still uses (see retired-skills.json)
 *   skills/entry/<slug>/       the skills `gooseworks install` puts in every agent
 *                              (the gooseworks router, goose-ads, goose-video…)
 *   packs/<pack>.json          install bundles of video skills, by slug
 * A reference to another skill is `../<slug>/SKILL.md` inside a family.
 *
 * `category` and `domain` come from skill.meta.json (a family can supply a
 * default domain), never from the folder, so moving a folder changes only
 * `path` and `files` in the index. The backend gates is_active on `category`.
 */

const fs = require('fs');
const path = require('path');

// ROOT defaults to the repo root, but tests can override via env var.
const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'skills-index.json');

// Only index git-TRACKED files, so build-index never bakes uncommitted or
// gitignored content into skills-index.json (e.g. a contributor's local
// `**/eval/fixtures/` captures, `.eval-runs/`, or SkillOpt outputs). Those files
// 404 when the backend DB sync fetches each listed path from raw.githubusercontent
// — the exact noise that motivated this. `null` = git unavailable (e.g. a no-.git
// CI tarball), in which case we don't filter (legacy behaviour).
let TRACKED = null;
try {
  const { execSync } = require('child_process');
  TRACKED = new Set(
    execSync('git ls-files', {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    })
      .split('\n')
      .filter(Boolean),
  );
} catch {
  TRACKED = null;
}

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
  // Legacy cards use YAML block descriptions too; never publish the marker as copy.
  const blocks = parseBlockFrontmatter(content);
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && /^[>|][-+]?$/.test(value)) result[key] = blocks[key];
  }
  return result;
}

// git ls-files always reports POSIX separators. path.relative() reports the
// platform's, so on Windows every lookup in TRACKED missed and `files` came
// back empty for every entry. Normalise once, here.
function relFromRoot(full) {
  return path.relative(ROOT, full).split(path.sep).join('/');
}

const SKIP_DIRS = new Set(['.tmp', '__pycache__', 'node_modules', '.git']);
const SKIP_EXTS = new Set(['.pyc', '.pyo']);
const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db']);

function collectFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...collectFiles(full));
    } else {
      if (SKIP_FILES.has(entry.name)) continue;
      if (SKIP_EXTS.has(path.extname(entry.name))) continue;
      // Skip uncommitted / gitignored files so the sync never 404s on them.
      if (TRACKED && !TRACKED.has(relFromRoot(full))) continue;
      files.push(full);
    }
  }
  return files;
}

// Each family's folder, and the domain its skills get when their meta names none.
const FAMILIES = [
  { dir: 'skills/marketing', domain: 'marketing-agent' },
  { dir: 'skills/video', domain: 'ads' },
  { dir: 'skills/shared', domain: null },
  { dir: 'skills/entry', domain: 'gooseworks' },
];
const PACKS_DIR = 'packs';
// Kept in a skill folder for the people who build it; never shipped with the skill.
const BUILDER_FILES = new Set(['critique.md', 'server-needs.md']);
// Marketing skills keep their hand-test notes in tests/; agents never read them.
const BUILDER_DIRS = { 'skills/marketing': ['tests/'] };

/** Frontmatter with folded/literal block scalars (`description: >-`), which parseFrontmatter reads as ">-". */
function parseBlockFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const result = {};
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^(\w[\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const rest = kv[2].trim();
    if (/^[>|][-+]?$/.test(rest)) {
      const block = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || lines[i + 1] === '')) {
        block.push(lines[++i].trim());
      }
      result[kv[1]] = rest.startsWith('|')
        ? block.join('\n').trim()
        : block.join(' ').replace(/\s+/g, ' ').trim();
    } else {
      result[kv[1]] = rest.replace(/^['"]|['"]$/g, '');
    }
  }
  return result;
}

/** Pack definitions: packs/<pack>.json, members named by slug. */
function readPacks() {
  const dir = path.join(ROOT, PACKS_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const meta = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (meta.slug !== f.slice(0, -5)) {
        throw new Error(`Pack slug mismatch: ${PACKS_DIR}/${f} says "${meta.slug}"`);
      }
      return meta;
    });
}

/** Every published skill folder: [{ slug, dir, family, meta, frontmatter, files }]. */
function scanFolders() {
  const found = [];
  const seen = new Map();
  for (const family of FAMILIES) {
    const root = path.join(ROOT, family.dir);
    if (!fs.existsSync(root)) continue;
    for (const slug of fs.readdirSync(root).sort()) {
      const skillDir = path.join(root, slug);
      // Dot folders hold plugin manifests (skills/entry/.claude-plugin), not skills.
      if (slug.startsWith('.') || !fs.statSync(skillDir).isDirectory()) continue;
      const relDir = `${family.dir}/${slug}`;
      if (!fs.existsSync(path.join(skillDir, 'SKILL.md'))) {
        throw new Error(`Missing SKILL.md in ${relDir}`);
      }
      const metaPath = path.join(skillDir, 'skill.meta.json');
      if (!fs.existsSync(metaPath)) throw new Error(`Missing skill.meta.json for ${relDir}`);
      if (seen.has(slug)) {
        throw new Error(`Skill slug "${slug}" is in both ${seen.get(slug)} and ${relDir}; slugs must be unique`);
      }
      seen.set(slug, relDir);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (meta.catalog === false) continue;
      found.push({
        slug,
        relDir,
        family,
        meta,
        frontmatter: parseFrontmatter(fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8')),
        files: collectFiles(skillDir)
          .map((f) => relFromRoot(f))
          .filter((f) => {
            const rel = f.slice(relDir.length + 1);
            return !BUILDER_FILES.has(rel) && !(BUILDER_DIRS[family.dir] || []).some((d) => rel.startsWith(d));
          }),
      });
    }
  }
  return found;
}

/** A skill folder as a catalog entry. */
function skillEntry(folder) {
  const { slug, relDir, family, meta, frontmatter, files } = folder;
  const domain = meta.domain || family.domain;
  if (!domain) throw new Error(`${relDir}: skill.meta.json needs a "domain"`);
  if (!meta.category) throw new Error(`${relDir}: skill.meta.json needs a "category"`);
  return {
    slug,
    name: frontmatter.name || slug,
    category: meta.category,
    domain,
    description: frontmatter.description || '',
    tags: Array.isArray(meta.tags) ? meta.tags.join(', ') : '',
    path: relDir,
    // Atom version (GV-29): recipes and styles pin it, so it is a top-level
    // field. Only skills that declare one carry it.
    ...(meta.version !== undefined ? { version: meta.version } : {}),
    files,
    metadata: meta,
  };
}

/**
 * A pack member as a catalog entry. Pack members are listed as capabilities
 * (the backend retires any other category) and install through their pack.
 */
function packMemberEntry(folder, pack) {
  const { slug, relDir, meta, frontmatter, files } = folder;
  const tags = Array.isArray(pack.tags) ? pack.tags : [];
  return {
    slug,
    name: frontmatter.name || slug,
    ...(meta.version !== undefined ? { version: meta.version } : {}),
    category: 'capabilities',
    domain: pack.domain,
    description: frontmatter.description || '',
    tags: tags.join(', '),
    path: relDir,
    files,
    metadata: {
      slug,
      category: 'capabilities',
      pack: pack.slug,
      ...(meta.version !== undefined ? { version: meta.version } : {}),
      tags,
      installation: {
        base_command: `npx goose-skills install ${pack.slug}`,
        supports: ['claude', 'cursor', 'codex'],
      },
    },
  };
}

function packEntry(pack, bySlug) {
  return {
    slug: pack.slug,
    name: pack.name || pack.slug,
    type: 'pack',
    domain: pack.domain,
    description: pack.description || '',
    tags: Array.isArray(pack.tags) ? pack.tags.join(', ') : '',
    path: `${PACKS_DIR}/${pack.slug}.json`,
    shared_files: [],
    skills: (pack.skills || []).map((slug) => {
      const folder = bySlug.get(slug);
      if (!folder) throw new Error(`Pack "${pack.slug}": no skill folder for "${slug}"`);
      return {
        slug,
        name: folder.frontmatter.name || slug,
        description: folder.frontmatter.description || '',
        path: folder.relDir,
        ...(folder.meta.version !== undefined ? { version: folder.meta.version } : {}),
        files: folder.files,
        source: 'pack',
      };
    }),
    metadata: pack,
  };
}


/**
 * Scan editorial collections from collections/<slug>/collection.meta.json.
 *
 * Collections are discovery metadata, not installable packs. Membership stays
 * on each skill's metadata.collections field so there is only one source of
 * truth for which skills belong to a collection.
 */
function scanCollections(skills) {
  const collectionsRoot = path.join(ROOT, 'collections');
  if (!fs.existsSync(collectionsRoot)) return [];

  const collections = [];
  const slugs = fs.readdirSync(collectionsRoot).filter((entry) =>
    fs.statSync(path.join(collectionsRoot, entry)).isDirectory(),
  );

  for (const slug of slugs) {
    const collectionDir = path.join(collectionsRoot, slug);
    const metaPath = path.join(collectionDir, 'collection.meta.json');
    if (!fs.existsSync(metaPath)) continue;

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (meta.slug !== slug) {
      throw new Error(`Collection slug mismatch: directory=${slug}, metadata=${meta.slug}`);
    }
    if (meta.installable !== false) {
      throw new Error(`Collection "${slug}" must set installable=false; collections are not packs`);
    }

    const validStages = new Set((meta.stages || []).map((stage) => stage.slug));
    if (validStages.size === 0) {
      throw new Error(`Collection "${slug}" must declare at least one stage`);
    }
    const members = skills
      .filter((skill) =>
        Array.isArray(skill.metadata && skill.metadata.collections) &&
        skill.metadata.collections.includes(slug),
      )
      .map((skill) => {
        const stage = skill.metadata.collection_stage;
        if (!stage || !validStages.has(stage)) {
          throw new Error(
            `Collection "${slug}": skill "${skill.slug}" has invalid collection_stage "${stage || ''}"`,
          );
        }

        return {
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          stage,
          path: skill.path,
        };
      });

    collections.push({
      slug,
      name: meta.name || slug,
      type: 'collection',
      headline: meta.headline || '',
      description: meta.description || '',
      path: `collections/${slug}`,
      files: collectFiles(collectionDir).map((file) => relFromRoot(file)),
      installable: false,
      skills: members,
      metadata: meta,
    });
  }

  return collections;
}

const folders = scanFolders();
const foldersBySlug = new Map(folders.map((f) => [f.slug, f]));
const packDefs = readPacks();
const packOf = new Map();
for (const pack of packDefs) {
  if (!pack.domain) throw new Error(`Pack "${pack.slug}" needs a "domain"`);
  for (const slug of pack.skills || []) {
    if (packOf.has(slug)) {
      throw new Error(`Skill "${slug}" is in packs "${packOf.get(slug).slug}" and "${pack.slug}"; one pack per skill`);
    }
    packOf.set(slug, pack);
  }
}

const skills = folders
  .map((folder) => (packOf.has(folder.slug) ? packMemberEntry(folder, packOf.get(folder.slug)) : skillEntry(folder)))
  .sort((a, b) => a.slug.localeCompare(b.slug));
const packs = packDefs.map((pack) => packEntry(pack, foldersBySlug)).sort((a, b) => a.slug.localeCompare(b.slug));

const collections = scanCollections(skills).sort((a, b) => a.slug.localeCompare(b.slug));
const collectionSlugs = new Set(collections.map((collection) => collection.slug));
for (const skill of skills) {
  for (const collectionSlug of skill.metadata?.collections || []) {
    if (!collectionSlugs.has(collectionSlug)) {
      throw new Error(
        `Skill "${skill.slug}" references unknown collection "${collectionSlug}"`,
      );
    }
  }
}

// Validate no slug collisions between packs and skills
const skillSlugs = new Set(skills.map((s) => s.slug));
for (const pack of packs) {
  if (skillSlugs.has(pack.slug)) {
    throw new Error(`Pack slug "${pack.slug}" collides with an existing skill slug`);
  }
}

// Preserve the existing generated date if only the date would change.
// This avoids spurious diffs in CI when no skills were actually modified.
let generatedDate = new Date().toISOString().split('T')[0];
if (fs.existsSync(OUTPUT)) {
  try {
    const existing = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
    const newContent = JSON.stringify({ skills, packs, collections });
    const oldContent = JSON.stringify({
      skills: existing.skills,
      packs: existing.packs,
      collections: existing.collections || [],
    });
    if (newContent === oldContent && existing.generated) {
      generatedDate = existing.generated;
    }
  } catch {}
}

const retirementFile = path.join(ROOT, 'retired-skills.json');
const retirementManifest = fs.existsSync(retirementFile) ? JSON.parse(fs.readFileSync(retirementFile, 'utf8')) : {};
const { validateRetirements } = require('./lib/retirements');
const retiredSkills = validateRetirements(retirementManifest, skills);

const index = {
  version: '1.4.0',
  generated: generatedDate,
  retired_skills: retiredSkills,
  skills,
  packs,
  collections,
};

fs.writeFileSync(OUTPUT, JSON.stringify(index, null, 2) + '\n');
console.log(
  `Generated ${OUTPUT} with ${skills.length} skills, ${packs.length} packs, ` +
    `and ${collections.length} collections.`,
);
