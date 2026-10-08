#!/usr/bin/env node
'use strict';

/**
 * Unresolved Git LFS pointers: no tracked file may be a pointer stub.
 *
 *   node scripts/check-lfs-pointers.js
 *
 * A file committed through Git LFS whose object was never pushed arrives in a
 * clone as a short text stub ("version https://git-lfs.github.com/spec/v1",
 * an oid line and a size line) instead of the image or font it stands for.
 * The catalog release refuses a skill that ships such a file, so this fails
 * the build before it gets there. The repository does not use LFS; a real
 * binary belongs in git as-is.
 *
 * The check reads the blobs recorded in the index through git, not the
 * working tree, so a staged stub that was overwritten or deleted locally is
 * still caught. Only blobs under 1024 bytes are read in full (a pointer is
 * never larger); their sizes come from one `git cat-file --batch-check`.
 *
 * Exit 0 when every indexed blob is clean, 1 with the offending paths listed
 * or when a blob cannot be read, 2 when git itself fails. GOOSE_SKILLS_ROOT
 * overrides the repository root (tests use it).
 */

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');

const POINTER_MAX_BYTES = 1024;
const VERSION_LINE = 'version https://git-lfs.github.com/spec/v1';
const OID_LINE = /^oid sha256:[0-9a-f]{64}$/;
const SIZE_LINE = /^size \d+$/;

function git(root, args, input) {
  const res = spawnSync('git', args, { cwd: root, input, maxBuffer: 256 * 1024 * 1024 });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${res.stderr.toString('utf8').trim()}`);
  return res.stdout;
}

/** Regular-file blobs in the index: Map oid -> [path]. Symlinks and submodules are skipped. */
function indexedBlobs(root) {
  const byOid = new Map();
  for (const entry of git(root, ['ls-files', '-s', '-z']).toString('utf8').split('\0')) {
    if (!entry) continue;
    const tab = entry.indexOf('\t');
    const [mode, oid] = entry.slice(0, tab).split(' ');
    if (mode === '120000' || mode === '160000') continue;
    const file = entry.slice(tab + 1);
    if (!byOid.has(oid)) byOid.set(oid, []);
    byOid.get(oid).push(file);
  }
  return byOid;
}

/** `git cat-file --batch-check`: Map oid -> { size } or { missing: true }. */
function blobSizes(root, oids) {
  const out = new Map();
  if (oids.length === 0) return out;
  const text = git(root, ['cat-file', '--batch-check'], `${oids.join('\n')}\n`).toString('utf8');
  for (const line of text.split('\n')) {
    if (!line) continue;
    const [oid, typeOrMissing, size] = line.split(' ');
    if (typeOrMissing === 'missing' || typeOrMissing !== 'blob') out.set(oid, { missing: true, what: typeOrMissing });
    else out.set(oid, { size: Number(size) });
  }
  return out;
}

/** `git cat-file --batch`: Map oid -> Buffer (or { missing: true }). */
function blobContents(root, oids) {
  const out = new Map();
  if (oids.length === 0) return out;
  const buf = git(root, ['cat-file', '--batch'], `${oids.join('\n')}\n`);
  let pos = 0;
  while (pos < buf.length) {
    const eol = buf.indexOf(0x0a, pos);
    if (eol === -1) break;
    const [oid, typeOrMissing, size] = buf.slice(pos, eol).toString('utf8').split(' ');
    pos = eol + 1;
    if (typeOrMissing === 'missing') {
      out.set(oid, { missing: true });
      continue;
    }
    const n = Number(size);
    out.set(oid, buf.slice(pos, pos + n));
    pos += n + 1; // the content is followed by one newline
  }
  return out;
}

/** True when the bytes are a Git LFS pointer file (spec v1), not merely text that starts like one. */
function isPointer(buf) {
  if (buf.length === 0 || buf.length >= POINTER_MAX_BYTES) return false;
  const lines = buf.toString('utf8').split('\n').map((l) => l.replace(/\r$/, ''));
  if (lines[0] !== VERSION_LINE) return false;
  const rest = lines.slice(1).filter((l) => l !== '');
  return rest.some((l) => OID_LINE.test(l)) && rest.some((l) => SIZE_LINE.test(l));
}

function run(root = ROOT) {
  const byOid = indexedBlobs(root);
  const oids = [...byOid.keys()];
  const pointers = [];
  const errors = [];

  const sizes = blobSizes(root, oids);
  const small = [];
  for (const oid of oids) {
    const info = sizes.get(oid);
    if (!info) errors.push(...byOid.get(oid).map((p) => `${p}: git returned nothing for blob ${oid}`));
    else if (info.missing) errors.push(...byOid.get(oid).map((p) => `${p}: blob ${oid} is ${info.what || 'missing'} from the repository`));
    else if (info.size < POINTER_MAX_BYTES) small.push(oid);
  }

  const contents = blobContents(root, small);
  for (const oid of small) {
    const blob = contents.get(oid);
    if (!blob || blob.missing) errors.push(...byOid.get(oid).map((p) => `${p}: blob ${oid} could not be read`));
    else if (isPointer(blob)) pointers.push(...byOid.get(oid));
  }

  pointers.sort();
  errors.sort();
  return { pointers, errors };
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
  for (const e of result.errors) {
    console.error(`error ${e}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error::${e}`);
  }
  console.log(`LFS pointers: ${result.pointers.length} found, ${result.errors.length} blobs unreadable.`);
  process.exit(result.pointers.length || result.errors.length ? 1 : 0);
}

module.exports = { run, isPointer };
