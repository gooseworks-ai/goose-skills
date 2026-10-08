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
 * The commit to compare against. By default the merge base of `ref` and HEAD,
 * which suits a local branch whose base has moved on. With `direct`, `ref`
 * itself: CI compares a pull request with its base branch's tip and a push
 * with the exact tip it replaced, so a force push cannot hide a change behind
 * an older merge base. No ref means "no base" (the checks then only warn). A
 * ref that does not resolve, an all-zero sha included, is an error, so a
 * broken CI setup can never pass the gate silently.
 */
function resolveBase(root, ref, { direct = false } = {}) {
  if (!ref) return null;
  if (/^0+$/.test(ref)) {
    throw new Error('the base is an all-zero sha (a new branch has no previous tip to compare with)');
  }
  let sha;
  try {
    sha = git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).trim();
  } catch {
    throw new Error(`base ref "${ref}" does not resolve to a commit (fetch it, or check out with fetch-depth: 0)`);
  }
  if (direct) return sha;
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

/**
 * Where an atom lived on the base commit: its own folder when that held a
 * SKILL.md, else the folder of the same slug anywhere under capabilities/ or
 * packs/<pack>/ (an atom moved between the two trees). Null for a new atom.
 */
function baseAtomDir(root, base, atom) {
  const out = git(root, ['ls-tree', '-r', '-z', '--name-only', base, '--', CAPABILITIES_DIR, PACKS_DIR]);
  const dirs = new Set();
  for (const p of out.split('\0')) {
    const m = p.match(/^(skills\/ads\/capabilities\/[^/]+|skills\/ads\/packs\/[^/]+\/[^/]+)\/SKILL\.md$/);
    if (m) dirs.add(m[1]);
  }
  if (dirs.has(atom.dir)) return atom.dir;
  const moved = [...dirs].filter((d) => d.split('/').pop() === atom.slug);
  return moved.length === 1 ? moved[0] : null;
}

/** True when `dir` on the base holds exactly the same files (relative paths and bytes) as `atom.dir` now. */
function sameFiles(root, base, dir, atom) {
  const before = listFilesAt(root, base, dir).map((p) => p.slice(dir.length + 1));
  const now = listFiles(root, atom.dir).map((p) => p.slice(atom.dir.length + 1));
  if (before.length !== now.length || before.some((p, i) => p !== now[i])) return false;
  return before.every((rel) => {
    const old = readAt(root, base, `${dir}/${rel}`);
    return old !== null && old.equals(fs.readFileSync(path.join(root, atom.dir, rel)));
  });
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
  baseAtomDir,
  sameFiles,
  changedFiles,
  listFilesAt,
  readAt,
  parseSemver,
  compareSemver,
  toPosix,
};
