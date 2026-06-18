#!/usr/bin/env node

/**
 * Build skills-index.json from SKILL.md + skill.meta.json files.
 *
 * Layout (2026-06-17 reorg): skills are organized by DOMAIN first, then by
 * abstraction level:
 *   skills/<domain>/<level>/<slug>/{SKILL.md, skill.meta.json, …}
 *   skills/<domain>/packs/<pack>/<sub-skill>/…
 * where level ∈ { capabilities, composites, playbooks } and <domain> is one of
 * the folders directly under skills/ (ads, lead-generation, research-tools, …).
 *
 * `category` in the index = the LEVEL (backend gates is_active on it).
 * `domain` in the index = the top folder (the human-browsable grouping).
 */

const fs = require('fs');
const path = require('path');

// ROOT defaults to the repo root, but tests can override via env var.
const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');
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
const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db']);

function collectFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...collectFiles(full));
    } else {
      if (SKIP_FILES.has(entry.name)) continue;
      if (SKIP_EXTS.has(path.extname(entry.name))) continue;
      files.push(full);
    }
  }
  return files;
}

/** Domains = the directories directly under skills/. */
function listDomains() {
  const skillsRoot = path.join(ROOT, 'skills');
  if (!fs.existsSync(skillsRoot)) return [];
  return fs
    .readdirSync(skillsRoot)
    .filter((d) => fs.statSync(path.join(skillsRoot, d)).isDirectory())
    .sort();
}

/** Scan one level (capabilities|composites|playbooks) across every domain. */
function scanCategory(category) {
  const skills = [];

  for (const domain of listDomains()) {
    const categoryDir = path.join(ROOT, 'skills', domain, category);
    if (!fs.existsSync(categoryDir)) continue;

    const slugs = fs.readdirSync(categoryDir).filter((d) =>
      fs.statSync(path.join(categoryDir, d)).isDirectory(),
    );

    for (const slug of slugs) {
      const skillDir = path.join(categoryDir, slug);
      const skillMd = path.join(skillDir, 'SKILL.md');
      const metaPath = path.join(skillDir, 'skill.meta.json');

      if (!fs.existsSync(skillMd)) continue;
      if (!fs.existsSync(metaPath)) {
        throw new Error(`Missing skill.meta.json for skills/${domain}/${category}/${slug}`);
      }

      const content = fs.readFileSync(skillMd, 'utf8');
      const metaFromFrontmatter = parseFrontmatter(content);
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

      const allFiles = collectFiles(skillDir).map((f) => path.relative(ROOT, f));

      skills.push({
        slug,
        name: metaFromFrontmatter.name || slug,
        category,
        domain,
        description: metaFromFrontmatter.description || '',
        tags: Array.isArray(meta.tags) ? meta.tags.join(', ') : '',
        path: `skills/${domain}/${category}/${slug}`,
        files: allFiles,
        metadata: meta,
      });
    }
  }

  return skills;
}

/** Scan packs across every domain (skills/<domain>/packs/<pack>). */
function scanPacks(registrySkills) {
  const registryBySlug = {};
  for (const s of registrySkills) {
    registryBySlug[s.slug] = s;
  }

  const packs = [];

  for (const domain of listDomains()) {
    const packsDir = path.join(ROOT, 'skills', domain, 'packs');
    if (!fs.existsSync(packsDir)) continue;

    const slugs = fs.readdirSync(packsDir).filter((d) =>
      fs.statSync(path.join(packsDir, d)).isDirectory(),
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
          path: `skills/${domain}/packs/${slug}/${skillSlug}`,
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
        .map((f) => `skills/${domain}/packs/${slug}/${f}`)
        .filter((f) => fs.existsSync(path.join(ROOT, f)));

      packs.push({
        slug,
        name: meta.name || slug,
        type: 'pack',
        domain,
        description: meta.description || '',
        tags: Array.isArray(meta.tags) ? meta.tags.join(', ') : '',
        path: `skills/${domain}/packs/${slug}`,
        shared_files: sharedFiles,
        skills: subSkills,
        metadata: meta,
      });
    }
  }

  return packs;
}

const registrySkills = [
  ...scanCategory('capabilities'),
  ...scanCategory('composites'),
  ...scanCategory('playbooks'),
];

const packs = scanPacks(registrySkills).sort((a, b) => a.slug.localeCompare(b.slug));

// Promote pack-only sub-skills (source: 'pack') into the top-level skills[]
// so downstream consumers (DB sync, CMS push) that iterate idx.skills[] see them.
// Registry-source sub-skills are intentionally NOT promoted here — they already
// exist top-level via scanCategory and pack.skills[] just references them.
const promotedFromPacks = [];
const registrySlugs = new Set(registrySkills.map((s) => s.slug));
const promotedSlugs = new Map(); // slug -> originating pack slug
for (const pack of packs) {
  for (const sub of pack.skills) {
    if (sub.source !== 'pack') continue;

    if (registrySlugs.has(sub.slug)) {
      throw new Error(
        `Pack "${pack.slug}": sub-skill slug "${sub.slug}" collides with a top-level registry skill`,
      );
    }

    const existingPack = promotedSlugs.get(sub.slug);
    if (existingPack) {
      throw new Error(
        `Pack-only sub-skill slug "${sub.slug}" appears in multiple packs ` +
          `("${existingPack}" and "${pack.slug}"). ` +
          `Sub-skill slugs must be globally unique — downstream consumers upsert by slug.`,
      );
    }
    promotedSlugs.set(sub.slug, pack.slug);

    promotedFromPacks.push({
      slug: sub.slug,
      name: sub.name,
      // Treat pack sub-skills as capabilities for catalog purposes.
      // The backend's PredefinedSkillsSyncService gates is_active by category;
      // anything outside ACTIVE_REPO_CATEGORIES gets retired immediately.
      category: 'capabilities',
      domain: pack.domain,
      description: sub.description,
      tags: Array.isArray(pack.metadata && pack.metadata.tags) ? pack.metadata.tags.join(', ') : '',
      path: sub.path,
      files: sub.files,
      metadata: {
        slug: sub.slug,
        category: 'capabilities',
        pack: pack.slug,
        tags: Array.isArray(pack.metadata && pack.metadata.tags) ? pack.metadata.tags : [],
        // Pack sub-skills aren't installable standalone — install the parent pack.
        installation: {
          base_command: `npx goose-skills install ${pack.slug}`,
          supports: ['claude', 'cursor', 'codex'],
        },
      },
    });
  }
}

const skills = [
  ...registrySkills,
  ...promotedFromPacks,
].sort((a, b) => a.slug.localeCompare(b.slug));

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
    const newContent = JSON.stringify({ skills, packs });
    const oldContent = JSON.stringify({ skills: existing.skills, packs: existing.packs });
    if (newContent === oldContent && existing.generated) {
      generatedDate = existing.generated;
    }
  } catch {}
}

const index = {
  version: '1.2.0',
  generated: generatedDate,
  skills,
  packs,
};

fs.writeFileSync(OUTPUT, JSON.stringify(index, null, 2) + '\n');
console.log(`Generated ${OUTPUT} with ${skills.length} skills and ${packs.length} packs.`);
