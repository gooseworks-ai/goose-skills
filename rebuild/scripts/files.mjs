import { createHash } from 'node:crypto';
import { readdir, readFile, lstat } from 'node:fs/promises';
import path from 'node:path';

export async function readFiles(folder, prefix = '') {
  const files = new Map();
  for (const entry of (await readdir(folder)).sort()) {
    const name = prefix + entry;
    const file = path.join(folder, entry);
    const stat = await lstat(file);
    if (stat.isSymbolicLink()) throw new Error(`Symlink refused: ${file}`);
    if (stat.isDirectory()) {
      for (const [child, bytes] of await readFiles(file, name + '/')) files.set(child, bytes);
    } else if (stat.isFile()) files.set(name, await readFile(file));
    else throw new Error(`Not a regular file: ${file}`);
  }
  return files;
}

export function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function jsonBytes(value) {
  return Buffer.from(JSON.stringify(value, null, 2) + '\n');
}
