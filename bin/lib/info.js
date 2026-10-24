'use strict';

// `npx goose-skills info <slug>`: what a skill is, what it needs, and, for a
// retired name, what replaced it. Pure: takes the index, returns lines.

const { successorInstallCommand } = require('./targets');

/**
 * Returns { ok, lines }. ok is false for an unknown slug; a retired slug is
 * answered (ok true) with its replacement or the reason it went, as install does.
 */
function describeSkill(index, slug, { repo, branch, options = { target: 'claude', projectDir: null } } = {}) {
  const skill = (index.skills || []).find((s) => s.slug === slug);
  if (!skill) {
    const retired = (index.retired_skills || []).find((entry) => entry.slug === slug);
    if (!retired) return { ok: false, lines: [`Skill "${slug}" not found.`, 'Run "npx goose-skills list" to see available skills.'] };
    if (!retired.replacement) {
      return { ok: true, lines: [`${slug} was removed from the catalog, with no replacement.`, `Why: ${retired.reason}`] };
    }
    return {
      ok: true,
      lines: [
        `${slug} was retired. Use ${retired.replacement} instead.`,
        `Why: ${retired.reason}`,
        `Install: ${successorInstallCommand(retired.replacement, options)}`,
      ],
    };
  }

  const name = skill.name || skill.slug;
  const lines = [name, '='.repeat(name.length)];
  if (skill.version) lines.push(`Version: ${skill.version}`);
  lines.push(`Category: ${skill.category}`);
  lines.push(`Description: ${skill.description}`);
  if (skill.tags) lines.push(`Tags: ${skill.tags}`);
  const requires = skill.metadata?.requires_skills || [];
  lines.push(`Requires skills: ${requires.length ? `${requires.join(', ')} (installed with it)` : 'none'}`);
  const programs = skill.metadata?.requires_tools || [];
  if (programs.length) lines.push(`Programs it runs: ${programs.join(', ')}`);
  lines.push(`Files: ${(skill.files || []).length}`);
  lines.push('');
  lines.push(`Install: npx goose-skills install ${skill.slug}`);
  if (repo) lines.push(`GitHub: https://github.com/${repo}/tree/${branch || 'main'}/${skill.path}`);
  return { ok: true, lines };
}

module.exports = { describeSkill };
