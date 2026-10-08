'use strict';

/**
 * Shared helpers for the atom checks (atom-lint.js, check-atom-versions.js):
 * which folders are video atoms, how to read a file as it was on the base
 * branch, and semver.
 *
 * A video atom is a skill folder with a SKILL.md directly under
 * skills/ads/capabilities/ or under skills/ads/packs/<pack>/. The few
 * non-video skills that live there are listed in atom-lint/config.json.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..', '..');

const CONFIG = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'atom-lint', 'config.json'), 'utf8'),
);

const CAPABILITIES_DIR = 'skills/ads/capabilities';
const PACKS_DIR = 'skills/ads/packs';
const SKIP_DIRS = new Set(['node_modules', '.git', '__pycache__', '.tmp', '.pytest_cache']);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** Every video atom on disk: [{ slug, dir }] with dir relative to ROOT, POSIX. */
function listAtoms(root = ROOT) {
  const notVideo = new Set(CONFIG.not_video);
  const atoms = [];
  const add = (dir, slug) => {
    if (notVideo.has(slug)) return;
    if (!fs.existsSync(path.join(root, dir, 'SKILL.md'))) return;
    atoms.push({ slug, dir });
  };

  const caps = path.join(root, CAPABILITIES_DIR);
  if (isDir(caps)) {
    for (const slug of fs.readdirSync(caps).sort()) {
      if (isDir(path.join(caps, slug))) add(`${CAPABILITIES_DIR}/${slug}`, slug);
    }
  }
  const packs = path.join(root, PACKS_DIR);
  if (isDir(packs)) {
    for (const pack of fs.readdirSync(packs).sort()) {
      const packDir = path.join(packs, pack);
      if (!isDir(packDir)) continue;
      for (const slug of fs.readdirSync(packDir).sort()) {
        if (isDir(path.join(packDir, slug))) add(`${PACKS_DIR}/${pack}/${slug}`, slug);
      }
    }
  }
  return atoms.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** The atom folder a repo path belongs to, or null. */
function atomDirOf(filePath, atoms) {
  for (const atom of atoms) {
    if (filePath === atom.dir || filePath.startsWith(`${atom.dir}/`)) return atom.dir;
  }
  return null;
}

/** Files under an atom folder on disk, relative to ROOT, POSIX, sorted. */
function listFiles(root, dir) {
  const out = [];
  const walk = (rel) => {
    const abs = path.join(root, rel);
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const childRel = `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(childRel);
      } else if (entry.isFile()) {
        out.push(childRel);
      }
    }
  };
  if (isDir(path.join(root, dir))) walk(dir);
  return out.sort();
}

function readMeta(root, dir) {
  const metaPath = path.join(root, dir, 'skill.meta.json');
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
}

// ── git ───────────────────────────────────────────────────────────────────

function git(root, args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/**
 * The commit to compare against: the merge base of `ref` and HEAD. No ref, or
 * an all-zero sha (a push that created the branch), means "no base": the
 * checks then only warn. A ref that does not resolve is an error, so a broken
 * CI setup can never pass the gate silently.
 */
function resolveBase(root, ref) {
  if (!ref || /^0+$/.test(ref)) return null;
  let sha;
  try {
    sha = git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).trim();
  } catch {
    throw new Error(`base ref "${ref}" does not resolve to a commit (fetch it, or check out with fetch-depth: 0)`);
  }
  try {
    return git(root, ['merge-base', sha, 'HEAD']).trim();
  } catch {
    throw new Error(`base ref "${ref}" has no merge base with HEAD`);
  }
}

/** Paths changed between the base commit and the working tree, plus untracked files. */
function changedFiles(root, base) {
  const changed = new Set();
  const diff = git(root, ['diff', '--name-only', '--no-renames', '-z', base, '--']);
  for (const p of diff.split('\0')) if (p) changed.add(p);
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard', '-z']);
  for (const p of untracked.split('\0')) if (p) changed.add(p);
  return changed;
}

/** Files under `dir` at the base commit. */
function listFilesAt(root, base, dir) {
  const out = git(root, ['ls-tree', '-r', '-z', '--name-only', base, '--', dir]);
  return out.split('\0').filter(Boolean).sort();
}

/** A file's bytes at the base commit, or null when it did not exist there. */
function readAt(root, base, filePath) {
  try {
    return execFileSync('git', ['show', `${base}:${filePath}`], {
      cwd: root,
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

// ── semver ────────────────────────────────────────────────────────────────

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function parseSemver(value) {
  if (typeof value !== 'string') return null;
  const m = value.match(SEMVER);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** -1, 0 or 1. Both must be valid. */
function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}

module.exports = {
  ROOT,
  CONFIG,
  listAtoms,
  atomDirOf,
  listFiles,
  readMeta,
  resolveBase,
  changedFiles,
  listFilesAt,
  readAt,
  parseSemver,
  compareSemver,
  toPosix,
};
