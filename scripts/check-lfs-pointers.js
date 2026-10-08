#!/usr/bin/env node
'use strict';

/**
 * Unresolved Git LFS pointers: no tracked file may be a pointer stub.
 *
 *   node scripts/check-lfs-pointers.js
 *
 * A file committed through Git LFS whose object was never pushed arrives in a
 * clone as a short text stub ("version https://git-lfs.github.com/spec/v1 ...")
 * instead of the image or font it stands for. The catalog release refuses a
 * skill that ships such a file, so this fails the build before it gets there.
 * The repository does not use LFS; a real binary belongs in git as-is.
 *
 * Exit 0 when every tracked file is clean, 1 with the offending paths listed,
 * 2 when the tracked files cannot be listed. GOOSE_SKILLS_ROOT overrides the
 * repository root (tests use it).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');

const POINTER_PREFIX = Buffer.from('version https://git-lfs.github.com/spec/v1');

function trackedFiles(root) {
  const out = execFileSync('git', ['ls-files', '-z', '--cached'], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
  return out.toString('utf8').split('\0').filter(Boolean);
}

/** True when the file on disk starts with the LFS pointer prefix. */
function isPointer(abs) {
  let fd;
  try {
    fd = fs.openSync(abs, 'r');
  } catch {
    return false; // deleted but still in the index, or a dangling symlink
  }
  try {
    const head = Buffer.alloc(POINTER_PREFIX.length);
    const read = fs.readSync(fd, head, 0, head.length, 0);
    return read === head.length && head.equals(POINTER_PREFIX);
  } catch {
    return false; // a directory symlink or an unreadable file is not a pointer
  } finally {
    fs.closeSync(fd);
  }
}

function run(root = ROOT) {
  const pointers = trackedFiles(root).filter((rel) => isPointer(path.join(root, rel)));
  return { pointers };
}

if (require.main === module) {
  let result;
  try {
    result = run();
  } catch (err) {
    console.error(`check-lfs-pointers: ${err.message}`);
    process.exit(2);
  }
  for (const p of result.pointers) {
    const msg = `${p} is an unresolved Git LFS pointer; commit the real file (the repository does not use LFS)`;
    console.error(`error ${msg}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error file=${p}::${msg}`);
  }
  console.log(`LFS pointers: ${result.pointers.length} found.`);
  process.exit(result.pointers.length ? 1 : 0);
}

module.exports = { run, isPointer };
