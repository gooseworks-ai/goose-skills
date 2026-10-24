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
 *
 * Every skills/shared/ skill is in exactly one of retained and current_shared.
 */
function validateRetirements(manifest, skills) {
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
  return manifest.retired || [];
}

module.exports = { validateRetirements };
