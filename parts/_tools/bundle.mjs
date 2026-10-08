#!/usr/bin/env node
// Builds a part's published part.mjs from its source: parts/<id>/src/part.mjs
// plus every relative module it imports (parts/_lib, the part's own src),
// inlined into one ES module that imports only Node built-ins.
//
//   node parts/_tools/bundle.mjs <part-id> <version>     write parts/<id>/<version>/part.mjs
//   node parts/_tools/bundle.mjs --check                 fail if any newest version differs
//
// Source rules (the bundler refuses anything else): single-line `import`
// statements; relative imports or `node:` built-ins only; inlined modules
// declare with `export function|const|async function|class` and never use
// `export default` or export lists. Top-level names must be unique across the
// inlined modules (the bundle fails to load otherwise, and the tests import it).
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PARTS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMPORT_LINE = /^import\s+(.+?)\s+from\s+['"]([^'"]+)['"];?\s*$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function parseClause(clause, where) {
  const named = [];
  let namespace = null;
  let defaultName = null;
  const braces = /\{([^}]*)\}/.exec(clause);
  if (braces) {
    for (const part of braces[1].split(',').map((s) => s.trim()).filter(Boolean)) named.push(part);
  }
  const rest = clause.replace(/\{[^}]*\}/, '').split(',').map((s) => s.trim()).filter(Boolean);
  for (const r of rest) {
    const ns = /^\*\s+as\s+([A-Za-z_$][\w$]*)$/.exec(r);
    if (ns) namespace = ns[1];
    else if (/^[A-Za-z_$][\w$]*$/.test(r)) defaultName = r;
    else throw new Error(`${where}: cannot read import clause "${clause}"`);
  }
  return { named, namespace, defaultName };
}

function stripExports(text, where) {
  if (/^export\s+default\b/m.test(text) || /^export\s*\{/m.test(text) || /^export\s*\*/m.test(text)) {
    throw new Error(`${where}: only "export function|const|class" declarations can be inlined`);
  }
  return text.replace(/^export\s+(?=(async\s+)?function\b|const\b|let\b|class\b)/gm, '');
}

/** The bundled module text for one part's source entry. */
export function bundlePart(entry) {
  const builtins = new Map(); // specifier -> { named:Set, namespaces:Set, defaults:Set }
  const order = [];
  const seen = new Set();

  function visit(file, isEntry) {
    if (seen.has(file)) return;
    seen.add(file);
    const where = relative(PARTS, file);
    const lines = readFileSync(file, 'utf8').split('\n');
    const body = [];
    for (const line of lines) {
      if (/^\s*import\s*\(/.test(line)) throw new Error(`${where}: dynamic import is not allowed`);
      if (!/^import\b/.test(line)) {
        body.push(line);
        continue;
      }
      const m = IMPORT_LINE.exec(line);
      if (!m) throw new Error(`${where}: imports must be one line: ${line}`);
      const [, clause, spec] = m;
      if (spec.startsWith('node:')) {
        const entryFor = builtins.get(spec) || { named: new Set(), namespaces: new Set(), defaults: new Set() };
        const c = parseClause(clause, where);
        c.named.forEach((n) => entryFor.named.add(n));
        if (c.namespace) entryFor.namespaces.add(c.namespace);
        if (c.defaultName) entryFor.defaults.add(c.defaultName);
        builtins.set(spec, entryFor);
      } else if (spec.startsWith('./') || spec.startsWith('../')) {
        visit(resolve(dirname(file), spec), false);
      } else {
        throw new Error(`${where}: only node: built-ins and relative modules may be imported (${spec})`);
      }
    }
    let text = body.join('\n').replace(/^\n+/, '');
    if (!isEntry) text = stripExports(text, where);
    order.push({ where, text, isEntry });
  }

  visit(resolve(entry), true);
  const head = [];
  for (const spec of [...builtins.keys()].sort()) {
    const b = builtins.get(spec);
    for (const ns of [...b.namespaces].sort()) head.push(`import * as ${ns} from '${spec}';`);
    for (const d of [...b.defaults].sort()) head.push(`import ${d} from '${spec}';`);
    if (b.named.size) head.push(`import { ${[...b.named].sort().join(', ')} } from '${spec}';`);
  }
  const out = [
    `// Built from ${order.at(-1).where} by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.`,
    ...head,
    '',
  ];
  for (const m of order) {
    out.push(`// ---- ${m.where} ----`);
    out.push(m.text.replace(/\s+$/, ''));
    out.push('');
  }
  return out.join('\n');
}

/** Every part id with a src/part.mjs and its newest published version. */
export function newestVersions(partsRoot = PARTS) {
  const out = [];
  for (const id of readdirSync(partsRoot)) {
    const dir = join(partsRoot, id);
    if (id.startsWith('_') || !statSync(dir).isDirectory() || !existsSync(join(dir, 'src', 'part.mjs'))) continue;
    const versions = readdirSync(dir).filter((v) => SEMVER.test(v));
    if (!versions.length) continue;
    versions.sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
    });
    out.push({ id, version: versions.at(-1), entry: join(dir, 'src', 'part.mjs'), out: join(dir, versions.at(-1), 'part.mjs') });
  }
  return out;
}

function main(argv) {
  if (argv[0] === '--check') {
    let bad = 0;
    for (const p of newestVersions()) {
      const want = bundlePart(p.entry);
      const have = existsSync(p.out) ? readFileSync(p.out, 'utf8') : null;
      if (want !== have) {
        bad++;
        console.error(`${p.id}@${p.version}: part.mjs is not the build of src/part.mjs`);
      }
    }
    process.exitCode = bad ? 1 : 0;
    return;
  }
  const [id, version] = argv;
  if (!id || !SEMVER.test(version || '')) {
    console.error('usage: bundle.mjs <part-id> <x.y.z> | --check');
    process.exitCode = 2;
    return;
  }
  const dir = join(PARTS, id);
  const target = join(dir, version, 'part.mjs');
  writeFileSync(target, bundlePart(join(dir, 'src', 'part.mjs')));
  console.log(`wrote ${relative(PARTS, target)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
