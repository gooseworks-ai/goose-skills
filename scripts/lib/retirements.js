const fs = require('fs');
const path = require('path');

/**
 * Checks retired-skills.json against the skills build-index found, and returns
 * its `retired` list for the index.
 *
 *   retired         old names: { slug, replacement (an active slug or null), reason }
 *   retained        older skills kept in skills/shared/ because something still uses
 *                   them: { slug, reason, used_by, remove_when }. A used_by item is
 *                   { skill } (an active skill whose requires_skills lists it) or
 *                   { repo, file } (a file in another repo that uses it).
 *   current_shared  current skills in skills/shared/: { slug, reason }
 *   superseded      video atoms whose SKILL.md says status: superseded (the video
 *                   kit's parts now do the job) but that something still uses:
 *                   { slug, replaced_by, reason, used_by, remove_when }. replaced_by
 *                   is the atom's superseded_by (part ids, id@x.y.z). A used_by item
 *                   is { skill }, { repo, file }, or { repo: 'goose-studio', recipes }
 *                   (recipe slugs under one-shot-videos/ that name the atom). An
 *                   empty used_by means nothing uses it any more: remove_when then
 *                   says to retire it.
 *
 * Every skills/shared/ skill is in exactly one of retained and current_shared.
 * Every superseded atom is in superseded, and only those. `superseded` is a Map
 * of slug -> superseded_by for the skills on disk (see supersededOnDisk); when
 * it is not given, the superseded list is not checked.
 */
function validateRetirements(manifest, skills, { superseded } = {}) {
  const active = new Map(skills.map((skill) => [skill.slug, skill]));
  const retired = new Set();
  for (const entry of manifest.retired || []) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.slug) || retired.has(entry.slug)) throw new Error('Invalid or duplicate retired skill');
    if (active.has(entry.slug)) throw new Error(`Retired skill is still active: ${entry.slug}`);
    // null = removed with no replacement; the reason says where the job went instead.
    if (entry.replacement !== null && (!active.has(entry.replacement) || entry.replacement === entry.slug)) throw new Error(`Missing active replacement for ${entry.slug}`);
    if (!entry.reason) throw new Error(`Missing retirement reason: ${entry.slug}`);
    retired.add(entry.slug);
  }
  for (const skill of skills) {
    for (const dependency of skill.metadata?.requires_skills || []) {
      if (retired.has(dependency)) throw new Error(`${skill.slug} requires retired skill ${dependency}`);
    }
  }

  const declared = new Map();
  for (const entry of manifest.retained || []) {
    if (!active.has(entry.slug) || retired.has(entry.slug)) throw new Error(`Retained skill missing: ${entry.slug}`);
    if (!entry.reason || !entry.remove_when) throw new Error(`Retained skill needs a reason and remove_when: ${entry.slug}`);
    if (!Array.isArray(entry.used_by) || entry.used_by.length === 0) throw new Error(`Retained skill needs used_by: ${entry.slug}`);
    for (const user of entry.used_by) {
      if (user && typeof user.skill === 'string') {
        const owner = active.get(user.skill);
        if (!owner) throw new Error(`${entry.slug}: used_by names unknown skill ${user.skill}`);
        if (!(owner.metadata?.requires_skills || []).includes(entry.slug)) {
          throw new Error(`${entry.slug}: used_by says ${user.skill} uses it, but ${user.skill} does not list it in requires_skills`);
        }
      } else if (!user || typeof user.repo !== 'string' || !user.repo || typeof user.file !== 'string' || !user.file) {
        throw new Error(`${entry.slug}: each used_by item is { skill } or { repo, file }`);
      }
    }
    if (declared.has(entry.slug)) throw new Error(`Shared skill listed twice: ${entry.slug}`);
    declared.set(entry.slug, 'retained');
  }
  for (const entry of manifest.current_shared || []) {
    if (!active.has(entry.slug)) throw new Error(`Current shared skill missing: ${entry.slug}`);
    if (!entry.reason) throw new Error(`Current shared skill needs a reason: ${entry.slug}`);
    if (declared.has(entry.slug)) throw new Error(`Shared skill listed twice: ${entry.slug}`);
    declared.set(entry.slug, 'current_shared');
  }
  for (const skill of skills) {
    const shared = typeof skill.path === 'string' && skill.path.startsWith('skills/shared/');
    if (shared && !declared.has(skill.slug)) {
      throw new Error(`${skill.path}: add it to retired-skills.json retained (an older skill still in use) or current_shared`);
    }
    if (!shared && typeof skill.path === 'string' && declared.has(skill.slug)) {
      throw new Error(`${skill.slug} is in retired-skills.json ${declared.get(skill.slug)} but lives in ${skill.path}, not skills/shared/`);
    }
  }
  if (superseded) validateSuperseded(manifest, active, retired, superseded);
  return manifest.retired || [];
}

function checkUser(slug, user, active) {
  if (user && typeof user.skill === 'string') {
    const owner = active.get(user.skill);
    if (!owner) throw new Error(`${slug}: used_by names unknown skill ${user.skill}`);
    if (!(owner.metadata?.requires_skills || []).includes(slug)) {
      throw new Error(`${slug}: used_by says ${user.skill} uses it, but ${user.skill} does not list it in requires_skills`);
    }
    return;
  }
  if (user && user.repo === 'goose-studio' && Array.isArray(user.recipes)) {
    if (!user.recipes.length || user.recipes.some((r) => typeof r !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(r))) {
      throw new Error(`${slug}: used_by recipes is a non-empty list of recipe slugs`);
    }
    return;
  }
  if (!user || typeof user.repo !== 'string' || !user.repo || typeof user.file !== 'string' || !user.file) {
    throw new Error(`${slug}: each used_by item is { skill }, { repo, file } or { repo: 'goose-studio', recipes }`);
  }
}

function validateSuperseded(manifest, active, retired, superseded) {
  const listed = new Set();
  for (const entry of manifest.superseded || []) {
    const where = `retired-skills.json superseded ${entry.slug}`;
    if (!active.has(entry.slug) || retired.has(entry.slug)) throw new Error(`Superseded skill missing: ${entry.slug}`);
    if (!superseded.has(entry.slug)) throw new Error(`${where}: its SKILL.md does not say status: superseded`);
    if (listed.has(entry.slug)) throw new Error(`Superseded skill listed twice: ${entry.slug}`);
    listed.add(entry.slug);
    if (!entry.reason || !entry.remove_when) throw new Error(`Superseded skill needs a reason and remove_when: ${entry.slug}`);
    const want = [...superseded.get(entry.slug)].sort();
    const got = Array.isArray(entry.replaced_by) ? [...entry.replaced_by].sort() : [];
    if (want.join(',') !== got.join(',')) {
      throw new Error(`${where}: replaced_by ${JSON.stringify(got)} must match the SKILL.md superseded_by ${JSON.stringify(want)}`);
    }
    if (!Array.isArray(entry.used_by)) throw new Error(`Superseded skill needs used_by (a list; empty when nothing uses it): ${entry.slug}`);
    for (const user of entry.used_by) checkUser(entry.slug, user, active);
  }
  for (const slug of superseded.keys()) {
    if (active.has(slug) && !listed.has(slug)) {
      throw new Error(`${slug} says status: superseded; add it to retired-skills.json superseded (its replacement parts, who still uses it and when it can go)`);
    }
  }
}

/** The SKILL.md frontmatter `status` and `superseded_by` (a list) of one skill. */
function readSupersededFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const lines = m[1].split(/\r?\n/);
  const status = (lines.find((l) => /^status:/.test(l)) || '').replace(/^status:\s*/, '').trim().replace(/^['"]|['"]$/g, '');
  if (status !== 'superseded') return null;
  const at = lines.findIndex((l) => /^superseded_by:/.test(l));
  if (at === -1) return [];
  let value = lines[at].replace(/^superseded_by:\s*/, '').trim();
  if (!value) {
    // A YAML block list: "  - id@x.y.z" lines.
    const items = [];
    for (let i = at + 1; i < lines.length && /^\s+-\s*/.test(lines[i]); i++) items.push(lines[i].replace(/^\s+-\s*/, ''));
    value = items.join(',');
  }
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/** Map of slug -> superseded_by for every listed skill whose SKILL.md says status: superseded. */
function supersededOnDisk(root, skills) {
  const out = new Map();
  for (const skill of skills) {
    if (typeof skill.path !== 'string') continue;
    const file = path.join(root, skill.path, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const parts = readSupersededFrontmatter(fs.readFileSync(file, 'utf8'));
    if (parts) out.set(skill.slug, parts);
  }
  return out;
}

module.exports = { validateRetirements, supersededOnDisk, readSupersededFrontmatter };
