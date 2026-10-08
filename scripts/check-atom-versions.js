#!/usr/bin/env node
'use strict';

/**
 * Atom versions (GV-29): every video atom carries a semver `version` in its
 * skill.meta.json, and a branch that changes an atom raises it.
 *
 *   node scripts/check-atom-versions.js [--base <ref>]
 *
 * Errors:
 *   - a version that is not plain semver (x.y.z);
 *   - an atom the branch changes (any file in its folder) whose version is
 *     missing or not higher than on the base; a new atom needs a version;
 *   - a SKILL.md frontmatter `version` that differs from skill.meta.json.
 * Warnings:
 *   - an atom the branch does not touch that has no version yet.
 *
 * Recipes and styles pin these versions (atom_versions), so a changed atom
 * under an old number would change what a pinned recipe gets.
 * Patch: a fix with the same inputs and outputs. Minor: a new option, mode or
 * model, or an intended change in look or sound. Major: an input removed or
 * renamed, or a new requirement.
 */

const fs = require('fs');
const path = require('path');
const lib = require('./lib/atoms');

const { ROOT } = lib;

function frontmatterVersion(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return undefined;
  const line = m[1].split(/\r?\n/).find((l) => /^version:/.test(l));
  if (!line) return undefined;
  return line.replace(/^version:\s*/, '').trim().replace(/^['"]|['"]$/g, '');
}

function metaVersionAt(base, dir) {
  const raw = lib.readAt(ROOT, base, `${dir}/skill.meta.json`);
  if (raw === null) return { exists: lib.listFilesAt(ROOT, base, dir).length > 0, version: undefined };
  try {
    return { exists: true, version: JSON.parse(raw.toString('utf8')).version };
  } catch {
    return { exists: true, version: undefined };
  }
}

function parseArgs(argv) {
  const args = { base: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base') args.base = argv[++i];
    else if (a.startsWith('--base=')) args.base = a.slice(7);
    else throw new Error(`unknown argument ${a}`);
  }
  return args;
}

function run(argv) {
  const args = parseArgs(argv);
  const base = lib.resolveBase(ROOT, args.base);
  const changed = base ? lib.changedFiles(ROOT, base) : new Set();
  const errors = [];
  const warnings = [];

  for (const atom of lib.listAtoms(ROOT)) {
    const where = atom.dir;
    let meta = null;
    try {
      meta = lib.readMeta(ROOT, atom.dir);
    } catch (err) {
      errors.push(`${where}/skill.meta.json is not valid JSON: ${err.message}`);
      continue;
    }
    const version = meta ? meta.version : undefined;
    const touched = base !== null && [...changed].some((p) => p.startsWith(`${atom.dir}/`));

    if (version !== undefined && !lib.parseSemver(version)) {
      errors.push(`${where}: version ${JSON.stringify(version)} is not semver (x.y.z)`);
      continue;
    }

    const skillMd = fs.readFileSync(path.join(ROOT, atom.dir, 'SKILL.md'), 'utf8');
    const fmVersion = frontmatterVersion(skillMd);
    if (fmVersion !== undefined && fmVersion !== version) {
      (touched ? errors : warnings).push(
        `${where}: SKILL.md frontmatter version ${fmVersion} differs from skill.meta.json version ${version}; keep one number (remove the frontmatter line or match it)`,
      );
    }

    if (!touched) {
      if (version === undefined) warnings.push(`${where}: no version in skill.meta.json yet`);
      continue;
    }

    if (version === undefined) {
      errors.push(`${where}: changed on this branch but has no version; add "version": "x.y.z" to skill.meta.json`);
      continue;
    }
    const before = metaVersionAt(base, atom.dir);
    if (!before.exists || before.version === undefined || !lib.parseSemver(before.version)) continue;
    if (lib.compareSemver(version, before.version) <= 0) {
      errors.push(
        `${where}: changed on this branch, so its version must go above ${before.version} (it is ${version})`,
      );
    }
  }
  return { errors, warnings, base };
}

if (require.main === module) {
  let result;
  try {
    result = run(process.argv.slice(2));
  } catch (err) {
    console.error(`check-atom-versions: ${err.message}`);
    process.exit(2);
  }
  for (const w of result.warnings) console.log(`warning ${w}`);
  for (const e of result.errors) {
    console.error(`error ${e}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error::${e}`);
  }
  console.log(
    `Atom versions: ${result.errors.length} errors, ${result.warnings.length} warnings${
      result.base ? `, compared with ${result.base.slice(0, 9)}` : ', no base (bumps not checked)'
    }.`,
  );
  process.exit(result.errors.length ? 1 : 0);
}

module.exports = { run, frontmatterVersion };
