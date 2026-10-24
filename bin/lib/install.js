'use strict';

// Install logic for the goose-skills CLI. Network, home folder and output are
// passed in, so tests run it against a stubbed fetch with no network.

const fs = require('fs');
const path = require('path');
const { successorInstallCommand, placeForCodex, placeForCursor } = require('./targets');

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

// Every skill the install needs, dependencies before the skills that need them.
// The whole package resolves before anything is downloaded, so a missing
// dependency fails the install instead of leaving it half done.
function resolvePackages(index, slug, options = { target: 'claude', projectDir: null }) {
  const retired = (index.retired_skills || []).find((entry) => entry.slug === slug);
  if (retired) {
    if (!retired.replacement) throw new Error(`Skill "${slug}" was removed from the catalog. ${retired.reason}`);
    throw new Error(`Skill "${slug}" was retired. Use "${retired.replacement}" instead: ${successorInstallCommand(retired.replacement, options)}`);
  }
  const bySlug = new Map((index.skills || []).map((skill) => [skill.slug, skill]));
  if (!bySlug.has(slug)) return null;

  const result = [];
  const visiting = new Set();
  const done = new Set();
  function visit(name, from) {
    if (done.has(name) || visiting.has(name)) return;
    if (!SLUG.test(name)) throw new Error(`Invalid skill dependency "${name}" in ${from}`);
    const skill = bySlug.get(name);
    if (!skill) throw new Error(`Skill "${from}" requires "${name}", which is not in the catalog.`);
    if (!skill.path || skill.path.split('/').some((part) => !part || part === '.' || part === '..') || !skill.path.endsWith(`/${name}`)) {
      throw new Error(`Invalid package path for ${name}: ${skill.path}`);
    }
    visiting.add(name);
    for (const dep of skill.metadata?.requires_skills || []) visit(dep, name);
    visiting.delete(name);
    done.add(name);
    result.push(skill);
  }
  visit(slug, slug);
  return result;
}

// Downloads every file the index lists for one skill into installDir, as raw
// bytes (binaries stay intact). Returns how many files failed.
async function downloadSkillFiles(skill, installDir, { fetch, rawBase, log, error }) {
  let failed = 0;
  for (const filePath of skill.files || []) {
    if (!filePath.startsWith(`${skill.path}/`)) {
      error(`    [SKIPPED] ${filePath}: outside the skill folder ${skill.path}/`);
      failed++;
      continue;
    }
    const localPath = path.join(installDir, filePath.slice(skill.path.length + 1));
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    try {
      const content = await fetch(`${rawBase}/${filePath}`);
      fs.writeFileSync(localPath, content);
      log(`    ${path.relative(installDir, localPath)}`);
    } catch (err) {
      error(`    [FAILED] ${filePath}: ${err.message}`);
      failed++;
    }
  }
  return failed;
}

/**
 * Installs a skill and every skill it requires (recursively) to
 * <home>/.claude/skills/<slug>/, then places each for Codex or Cursor.
 * Returns { installed, skipped, failed } (slugs, slugs, file count),
 * or null when the slug is not in the catalog.
 */
async function installSkill(options, deps) {
  const { slug, target, projectDir } = options;
  const { fetch, rawBase, home, log = console.log, error = console.error } = deps;
  const index = JSON.parse((await fetch(`${rawBase}/skills-index.json`)).toString('utf8'));

  const packages = resolvePackages(index, slug, options);
  if (!packages) return null;

  const skillsRoot = path.join(home, '.claude', 'skills');
  const codexRoot = path.join(home, '.codex', 'skills');
  const skill = packages[packages.length - 1];
  const dependencies = packages.slice(0, -1);
  const installed = [];
  const skipped = [];
  let failed = 0;

  const place = (dir) => {
    if (target === 'codex') return placeForCodex(dir, codexRoot);
    if (target === 'cursor') return placeForCursor(dir, projectDir);
    return null;
  };

  if (dependencies.length) log(`\nInstalling ${dependencies.length} dependency skill(s) first...\n`);
  for (const dep of dependencies) {
    const depDir = path.join(skillsRoot, dep.slug);
    if (fs.existsSync(path.join(depDir, 'SKILL.md'))) {
      log(`  ${dep.slug} — already installed`);
      skipped.push(dep.slug);
      continue;
    }
    log(`  ${dep.slug} → ${depDir}`);
    fs.mkdirSync(depDir, { recursive: true });
    failed += await downloadSkillFiles(dep, depDir, { fetch, rawBase, log, error });
    installed.push(dep.slug);
    place(depDir);
  }
  if (dependencies.length) log('');

  const installDir = path.join(skillsRoot, slug);
  log(`Installing ${skill.name || slug} to ${installDir}...`);
  fs.mkdirSync(installDir, { recursive: true });
  const ownFailed = await downloadSkillFiles(skill, installDir, { fetch, rawBase, log, error });
  failed += ownFailed;
  installed.push(slug);

  const files = (skill.files || []).length;
  log(`\nInstalled ${files - ownFailed}/${files} files.`);
  const depNames = [...skipped, ...installed.slice(0, -1)];
  if (depNames.length) log(`Dependencies: ${depNames.join(', ')}`);
  // requires_tools names programs the skill runs; they are the user's to have.
  const programs = skill.metadata?.requires_tools || [];
  if (programs.length) log(`Programs it runs (install them if missing): ${programs.join(', ')}`);
  if (failed) error(`${failed} file(s) failed to download; run the install again.`);
  log(`Primary location: ${installDir}`);

  const placed = place(installDir);
  if (target === 'codex') {
    log(`Codex location: ${placed}`);
    log('\nNext step (Codex):');
    log('  Restart Codex to pick up the new skill.');
  } else if (target === 'cursor') {
    log(`Cursor rule: ${placed}`);
    log('\nNext step (Cursor):');
    log('  Open Cursor in that project so it can load the new rule.');
  } else {
    log('\nNext step (Claude Code):');
    log(`  Claude Code loads skills from ${skillsRoot}; start a new session to use ${slug}.`);
  }

  return { installed, skipped, failed };
}

module.exports = { resolvePackages, downloadSkillFiles, installSkill };
