#!/usr/bin/env node
'use strict';

/**
 * Skill versions, every family: a branch that changes what a skill ships
 * raises its `version`.
 *
 *   node scripts/check-skill-versions.js [--base <ref>] [--direct]
 *
 * --base compares with the merge base of <ref> and HEAD; with --direct, with
 * <ref> itself (CI: a pull request's base tip, or the tip a push replaced).
 *
 * What it checks:
 *   - every skill in skills/{marketing,video,shared,entry}/<slug>/ whose
 *     published files changed (any file outside a tests/ folder: tests are
 *     not installed, see build-index.js) has a semver version in
 *     skill.meta.json that is higher than on the base. A new skill needs one.
 *   - video atoms are left to check-atom-versions.js (the same rule, plus the
 *     SKILL.md frontmatter copy), so a finding is reported once.
 *   - the entry plugin manifests (skills/entry/.claude-plugin/plugin.json and
 *     .codex-plugin/plugin.json) carry one version between them, and it goes
 *     up when any entry skill changes or the manifest itself changes.
 *
 * A skill that moved (the old layouts: marketing-agent/skills/<slug>,
 * skills/<area>/<tier>/<slug>, skills/<area>/packs/<pack>/<slug>) is compared
 * with its old folder by slug. Moved with every file byte for byte the same,
 * it passes without a bump; moved and edited, its version must go above the
 * old one, so a move can never reset a version.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const lib = require('./lib/atoms');

const { ROOT } = lib;
const FAMILIES = ['marketing', 'video', 'shared', 'entry'];
// Never installed, so a change there needs no bump (build-index.js BUILDER_DIRS).
const BUILDER_DIRS = new Set(['tests']);
const MANIFESTS = ['skills/entry/.claude-plugin/plugin.json', 'skills/entry/.codex-plugin/plugin.json'];

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

function published(rel) {
  return !rel.split('/').slice(0, -1).some((d) => BUILDER_DIRS.has(d));
}

/** Tracked and untracked (not ignored) files in the working tree, POSIX, sorted. */
function worktreeFiles() {
  return git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
    .split('\0')
    .filter((p) => p && fs.existsSync(path.join(ROOT, p)))
    .sort();
}

function frontmatterVersion(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return undefined;
  const line = m[1].split(/\r?\n/).find((l) => /^version:/.test(l));
  return line ? line.replace(/^version:\s*/, '').trim().replace(/^['"]|['"]$/g, '') : undefined;
}

/** Every skill folder on disk with its published files (relative to the folder). */
function listSkills(files) {
  const bySkill = new Map();
  for (const p of files) {
    const m = p.match(/^skills\/(marketing|video|shared|entry)\/([^/.][^/]*)\/(.+)$/);
    if (!m) continue;
    const dir = `skills/${m[1]}/${m[2]}`;
    if (!bySkill.has(dir)) bySkill.set(dir, { slug: m[2], family: m[1], dir, files: [] });
    if (published(m[3])) bySkill.get(dir).files.push(m[3]);
  }
  return [...bySkill.values()].filter((s) => fs.existsSync(path.join(ROOT, s.dir, 'SKILL.md')));
}

/** Folders holding a SKILL.md on the base, by slug (the folder's last segment). */
function baseSkillDirs(base) {
  const bySlug = new Map();
  for (const p of git(['ls-tree', '-r', '-z', '--name-only', base]).split('\0')) {
    if (!p.endsWith('/SKILL.md') || p.startsWith('drafts/')) continue;
    const dir = p.slice(0, -'/SKILL.md'.length);
    const slug = dir.split('/').pop();
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(dir);
  }
  return bySlug;
}

function baseFiles(base, dir) {
  return lib
    .listFilesAt(ROOT, base, dir)
    .map((p) => p.slice(dir.length + 1))
    .filter(published)
    .sort();
}

/** True when `dir` on the base ships exactly the files (paths and bytes) the skill ships now. */
function sameAsBase(base, dir, skill) {
  const before = baseFiles(base, dir);
  const now = [...skill.files].sort();
  if (before.length !== now.length || before.some((p, i) => p !== now[i])) return false;
  return before.every((rel) => {
    const old = lib.readAt(ROOT, base, `${dir}/${rel}`);
    return old !== null && old.equals(fs.readFileSync(path.join(ROOT, skill.dir, rel)));
  });
}

function versionAt(base, dir) {
  const raw = lib.readAt(ROOT, base, `${dir}/skill.meta.json`);
  if (raw !== null) {
    try {
      const v = JSON.parse(raw.toString('utf8')).version;
      if (v !== undefined) return v;
    } catch {
      /* fall through to the frontmatter */
    }
  }
  const md = lib.readAt(ROOT, base, `${dir}/SKILL.md`);
  return md === null ? undefined : frontmatterVersion(md.toString('utf8'));
}

function highest(versions) {
  const valid = versions.filter((v) => lib.parseSemver(v));
  return valid.sort(lib.compareSemver).pop();
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function parseArgs(argv) {
  const args = { base: null, direct: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--direct') args.direct = true;
    else if (a === '--base') args.base = argv[++i];
    else if (a.startsWith('--base=')) args.base = a.slice(7);
    else throw new Error(`unknown argument ${a}`);
  }
  return args;
}

function run(argv) {
  const args = parseArgs(argv);
  const base = lib.resolveBase(ROOT, args.base, { direct: args.direct });
  const errors = [];
  const warnings = [];
  const atoms = new Set(lib.listAtoms(ROOT).map((a) => a.dir));
  const skills = listSkills(worktreeFiles());
  const changed = base ? lib.changedFiles(ROOT, base) : new Set();
  const baseDirs = base ? baseSkillDirs(base) : new Map();
  let entryTouched = [];
  let checked = 0;

  for (const skill of skills) {
    const where = skill.dir;
    let meta;
    try {
      meta = readJson(`${skill.dir}/skill.meta.json`);
    } catch (err) {
      errors.push(`${where}/skill.meta.json is missing or not valid JSON: ${err.message}`);
      continue;
    }
    const version = meta.version;
    if (version !== undefined && !lib.parseSemver(version)) {
      errors.push(`${where}: version ${JSON.stringify(version)} is not semver (x.y.z)`);
      continue;
    }
    if (!base) {
      if (version === undefined) warnings.push(`${where}: no version in skill.meta.json`);
      continue;
    }

    const candidates = baseDirs.get(skill.slug) || [];
    let touched;
    let before;
    if (candidates.includes(skill.dir)) {
      touched = [...changed].some((p) => p.startsWith(`${skill.dir}/`) && published(p.slice(skill.dir.length + 1)));
      before = versionAt(base, skill.dir);
    } else if (candidates.length) {
      // Moved: unchanged only when some old folder ships the same bytes.
      touched = !candidates.some((dir) => sameAsBase(base, dir, skill));
      before = highest(candidates.map((dir) => versionAt(base, dir)));
    } else {
      touched = true; // a new skill
      before = undefined;
    }
    if (!touched) continue;
    if (skill.family === 'entry') entryTouched.push(skill.slug);
    if (atoms.has(skill.dir)) continue; // check-atom-versions.js
    checked++;

    if (version === undefined) {
      errors.push(`${where}: changed on this branch but has no version; add "version": "x.y.z" to skill.meta.json`);
      continue;
    }
    if (before !== undefined && lib.parseSemver(before) && lib.compareSemver(version, before) <= 0) {
      errors.push(`${where}: changed on this branch, so its version must go above ${before} (it is ${version})`);
    }
  }

  // The entry plugin manifests: one version, raised with any entry change.
  const present = MANIFESTS.filter((m) => fs.existsSync(path.join(ROOT, m)));
  const versions = new Map();
  for (const m of present) {
    try {
      versions.set(m, readJson(m).version);
    } catch (err) {
      errors.push(`${m} is not valid JSON: ${err.message}`);
    }
  }
  const distinct = new Set(versions.values());
  if (distinct.size > 1) {
    errors.push(`the entry plugin manifests disagree on version (${[...versions].map(([m, v]) => `${m} ${v}`).join(', ')}); keep one number`);
  }
  for (const [m, v] of versions) {
    if (!lib.parseSemver(v)) {
      errors.push(`${m}: version ${JSON.stringify(v)} is not semver (x.y.z)`);
      continue;
    }
    if (!base) continue;
    const raw = lib.readAt(ROOT, base, m);
    if (raw === null) continue; // a new manifest
    let old;
    try {
      old = JSON.parse(raw.toString('utf8'));
    } catch {
      continue;
    }
    const strip = (o) => JSON.stringify({ ...o, version: undefined });
    const ownChange = strip(old) !== strip(readJson(m));
    if ((entryTouched.length || ownChange) && lib.parseSemver(old.version) && lib.compareSemver(v, old.version) <= 0) {
      const why = entryTouched.length ? `entry skills changed (${entryTouched.join(', ')})` : 'the manifest changed';
      errors.push(`${m}: ${why}, so the plugin version must go above ${old.version} (it is ${v})`);
    }
  }

  return { errors, warnings, base, checked, skills: skills.length };
}

if (require.main === module) {
  let result;
  try {
    result = run(process.argv.slice(2));
  } catch (err) {
    console.error(`check-skill-versions: ${err.message}`);
    process.exit(2);
  }
  for (const w of result.warnings) console.log(`warning ${w}`);
  for (const e of result.errors) {
    console.error(`error ${e}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error::${e}`);
  }
  console.log(
    `Skill versions: ${result.skills} skills, ${result.checked} changed (atoms are check-atom-versions.js), ${result.errors.length} errors${
      result.base ? `, compared with ${result.base.slice(0, 9)}` : ', no base (bumps not checked)'
    }.`,
  );
  process.exit(result.errors.length ? 1 : 0);
}

module.exports = { run };
