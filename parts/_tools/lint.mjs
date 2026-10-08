#!/usr/bin/env node
// The part lint (part-interface.md section 4, "Rules for parts"). It checks
// every published version folder under parts/ and every part source:
//   - part.json fits parts/_contract/part-manifest.schema.json, names its own
//     folder, lists exactly the files in the folder, and its cost basis points
//     at real inputs and models;
//   - JavaScript only: no Python, shell, packages or node_modules;
//   - no network but ctx.line, no processes but ctx.tools.exec, no
//     environment, home folder, wall clock, unseeded randomness, eval or
//     system fonts (timers are allowed: a watchdog never reaches an output,
//     and the frame renderer runs a page's timers on its own virtual clock);
//   - size limits (part.mjs 2 MB, a version folder 20 MB);
//   - index.json, layers.json and withdrawn.json agree with the folders.
//
//   node parts/_tools/lint.mjs     prints findings, exit 1 when there are any
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kitSchemaErrors } from '../_lib/schema.mjs';
import { buildIndex, versionFolders } from './index.mjs';

const PARTS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LAYER_ORDER = ['brand', 'captions', 'sound', 'check'];
const MAX_ENTRY = 2 * 1024 * 1024;
const MAX_FOLDER = 20 * 1024 * 1024;
const NOT_JS = new Set(['.py', '.pyc', '.sh', '.bash', '.rb', '.pl', '.exe', '.dylib', '.so', '.node']);
const NOT_JS_NAMES = new Set(['package.json', 'package-lock.json', 'requirements.txt', 'node_modules']);
const CODE_EXT = new Set(['.mjs', '.js', '.cjs', '.html', '.css']);
const BANNED_MODULES =
  /\bfrom\s+['"](?:node:)?(?:http|https|http2|net|tls|dns|dgram|child_process|worker_threads|cluster|vm|inspector|module|os|repl|process)(?:\/[^'"]*)?['"]/;

// [rule, pattern, applies to: 'code' (every scanned file) or 'entry' (part.mjs and part sources)]
const SOURCE_RULES = [
  ['network', /\bfetch\s*\(/, 'code'],
  ['network', /\bnew\s+XMLHttpRequest\s*\(/, 'code'],
  ['network', /\bnew\s+WebSocket\s*\(/, 'code'],
  ['network', /\bnew\s+EventSource\s*\(/, 'code'],
  ['network', /\bsendBeacon\b/, 'code'],
  ['network', /\bimportScripts\s*\(/, 'code'],
  ['modules', BANNED_MODULES, 'code'],
  ['modules', /\brequire\s*\(/, 'code'],
  ['modules', /\bimport\s*\(/, 'code'],
  ['environment', /\bprocess\s*\./, 'code'],
  ['environment', /\bhomedir\b/, 'code'],
  ['clock', /\bDate\s*\.\s*now\s*\(/, 'code'],
  ['clock', /\bnew\s+Date\s*\(/, 'code'],
  ['clock', /\bperformance\s*\.\s*now\s*\(/, 'code'],
  ['random', /\bMath\s*\.\s*random\s*\(/, 'code'],
  ['random', /\b(?:randomUUID|randomBytes|randomInt|getRandomValues)\s*\(/, 'code'],
  ['eval', /\beval\s*\(/, 'code'],
  ['eval', /\bnew\s+Function\s*\(/, 'code'],
  ['system-fonts', /\/System\/Library\/Fonts|\/Library\/Fonts|\/usr\/share\/fonts|Windows[\\/]+Fonts/i, 'code'],
  ['system-fonts', /\bsrc\s*:\s*local\s*\(/, 'code'],
  ['system-fonts', /-apple-system|BlinkMacSystemFont|\bsystem-ui\b|SF Pro|Segoe UI|Helvetica|\bArial\b/, 'entry'],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) {
      out.push(abs + '/');
      walk(abs, out);
    } else out.push(abs);
  }
  return out;
}

function stripComments(text) {
  // Line comments only at line start and block comments: enough to keep
  // explanations of the rules (like this file's) out of the scan.
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, '');
}

/** Findings for one file's text: [{ rule, message }]. */
export function scanSource(text, { entry = true } = {}) {
  const body = stripComments(text);
  const found = [];
  for (const [rule, re, scope] of SOURCE_RULES) {
    if (scope === 'entry' && !entry) continue;
    const m = re.exec(body);
    if (m) found.push({ rule, message: `uses ${JSON.stringify(m[0].trim())}` });
  }
  return found;
}

function pointerSchema(schema, pointer) {
  let node = schema;
  for (const seg of pointer.split('/').slice(1)) {
    if (!node || typeof node !== 'object') return null;
    node = seg === '*' ? node.items : node.properties && node.properties[seg];
  }
  return node || null;
}

/** Rules part.json needs beyond its JSON schema. */
export function manifestRules(manifest) {
  const out = [];
  const models = (manifest.needs && manifest.needs.models) || [];
  const ids = new Set(models.map((m) => m.model));
  const cost = manifest.cost || {};
  if (cost.basis === 'per_unit') {
    for (const key of Object.keys(cost.rates_usd || {})) {
      if (!ids.has(key)) out.push({ rule: 'cost', message: `rates_usd names ${key}, which needs.models does not list` });
    }
    for (const m of ids) {
      if (!(m in (cost.rates_usd || {}))) out.push({ rule: 'cost', message: `needs.models lists ${m} with no rate` });
    }
    for (const [what, pointer] of [
      ['measure.from', cost.measure && cost.measure.from],
      ['model_from', cost.model_from],
      ['only_if.from', cost.only_if && cost.only_if.from],
    ]) {
      if (pointer && !pointerSchema(manifest.inputs, pointer)) out.push({ rule: 'cost', message: `${what} ${pointer} is not an input` });
    }
    if (ids.size > 1 && !cost.model_from) out.push({ rule: 'cost', message: 'several models need cost.model_from' });
  }
  if (cost.basis === 'free' && models.length) out.push({ rule: 'cost', message: 'a free part lists models' });
  if (manifest.layer && manifest.inputs && manifest.inputs.properties) {
    for (const key of Object.keys(manifest.inputs.properties)) {
      if (!['video', 'timeline', 'brand', 'expect', 'words'].includes(key)) {
        out.push({ rule: 'layer', message: `a layer takes only the fixed layer inputs, not ${key}` });
      }
    }
  }
  return out;
}

/** Every finding under a parts/ root: [{ where, rule, message }]. */
export function lintParts(partsRoot = PARTS) {
  const findings = [];
  const add = (where, rule, message) => findings.push({ where: relative(partsRoot, where) || '.', rule, message });
  const schemaPath = join(partsRoot, '_contract', 'part-manifest.schema.json');
  const schema = JSON.parse(readFileSync(existsSync(schemaPath) ? schemaPath : join(PARTS, '_contract', 'part-manifest.schema.json'), 'utf8'));
  const manifests = new Map();

  for (const folder of versionFolders(partsRoot)) {
    const partJson = join(folder.dir, 'part.json');
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(partJson, 'utf8'));
    } catch (e) {
      add(partJson, 'manifest', `unreadable: ${e.message}`);
      continue;
    }
    manifests.set(`${folder.id}@${folder.version}`, manifest);
    for (const e of kitSchemaErrors(schema, manifest, 'part.json')) add(partJson, 'manifest', e);
    for (const f of manifestRules(manifest)) add(partJson, f.rule, f.message);
    if (manifest.id !== folder.id) add(partJson, 'manifest', `id ${manifest.id} is not its folder ${folder.id}`);
    if (manifest.version !== folder.version) add(partJson, 'manifest', `version ${manifest.version} is not its folder ${folder.version}`);

    const present = walk(folder.dir).map((p) => relative(folder.dir, p) + (p.endsWith('/') ? '/' : ''));
    const listed = new Set(manifest.files || []);
    let total = 0;
    for (const rel of present) {
      if (rel.endsWith('/')) {
        if (NOT_JS_NAMES.has(rel.slice(0, -1).split('/').at(-1))) add(join(folder.dir, rel), 'javascript-only', 'not allowed in a part');
        continue;
      }
      const abs = join(folder.dir, rel);
      total += statSync(abs).size;
      if (rel === 'part.json') continue;
      if (!listed.has(rel)) add(abs, 'files', 'in the folder but not in part.json files');
      if (NOT_JS.has(extname(rel).toLowerCase()) || NOT_JS_NAMES.has(rel.split('/').at(-1))) {
        add(abs, 'javascript-only', 'parts are JavaScript only');
      }
      if (CODE_EXT.has(extname(rel).toLowerCase())) {
        const isEntry = rel === 'part.mjs' || extname(rel) === '.html';
        for (const f of scanSource(readFileSync(abs, 'utf8'), { entry: isEntry })) add(abs, f.rule, f.message);
      }
    }
    for (const rel of listed) {
      if (!existsSync(join(folder.dir, rel))) add(join(folder.dir, rel), 'files', 'listed in part.json but missing');
    }
    const entry = join(folder.dir, 'part.mjs');
    if (existsSync(entry) && statSync(entry).size > MAX_ENTRY) add(entry, 'size', 'part.mjs is over 2 MB');
    if (total > MAX_FOLDER) add(folder.dir, 'size', 'the version folder is over 20 MB');
    if (existsSync(entry) && !/^export\s+(?:async\s+function\s+run\s*\(|(?:const|let|var)\s+run\b|\{[^}]*\brun\b[^}]*\})/m.test(readFileSync(entry, 'utf8'))) {
      add(entry, 'entry', 'part.mjs must export run(inputs, ctx)');
    }
  }

  // Sources: parts/<id>/src/** and parts/_lib (tests live in parts/<id>/tests).
  const sourceDirs = [join(partsRoot, '_lib')];
  for (const id of readdirSync(partsRoot)) {
    if (!id.startsWith('_') && existsSync(join(partsRoot, id, 'src'))) sourceDirs.push(join(partsRoot, id, 'src'));
  }
  for (const dir of sourceDirs.filter((d) => existsSync(d))) {
    for (const abs of walk(dir)) {
      if (abs.endsWith('/')) continue;
      const ext = extname(abs).toLowerCase();
      if (NOT_JS.has(ext) || NOT_JS_NAMES.has(abs.split('/').at(-1))) add(abs, 'javascript-only', 'parts are JavaScript only');
      if (/\.test\.m?js$/.test(abs) || !CODE_EXT.has(ext)) continue;
      for (const f of scanSource(readFileSync(abs, 'utf8'), { entry: ext !== '.css' })) add(abs, f.rule, f.message);
    }
  }

  // index.json, layers.json, withdrawn.json.
  const indexPath = join(partsRoot, 'index.json');
  if (!existsSync(indexPath)) add(indexPath, 'index', 'missing');
  else {
    const want = JSON.stringify(buildIndex(partsRoot));
    let have;
    try {
      have = JSON.stringify(JSON.parse(readFileSync(indexPath, 'utf8')));
    } catch (e) {
      have = `unreadable: ${e.message}`;
    }
    if (have !== want) add(indexPath, 'index', 'does not match the version folders: run node parts/_tools/index.mjs');
  }
  const layersPath = join(partsRoot, 'layers.json');
  const layerParts = [...manifests.values()].filter((m) => m.layer);
  if (!existsSync(layersPath)) {
    if (layerParts.length) add(layersPath, 'layers', 'missing, but layer parts are published');
  } else {
    const layers = JSON.parse(readFileSync(layersPath, 'utf8'));
    if (layers.interface !== 1) add(layersPath, 'layers', 'interface must be 1');
    if (JSON.stringify(layers.order) !== JSON.stringify(LAYER_ORDER)) add(layersPath, 'layers', `order must be ${LAYER_ORDER.join(', ')}`);
    const keys = Object.keys(layers.layers || {});
    if (JSON.stringify([...keys].sort()) !== JSON.stringify([...LAYER_ORDER].sort())) add(layersPath, 'layers', 'layers must name exactly the four slots');
    for (const slot of keys) {
      const ref = layers.layers[slot] || {};
      const m = manifests.get(`${ref.id}@${ref.version}`);
      if (!m) add(layersPath, 'layers', `${slot}: ${ref.id}@${ref.version} is not a published part`);
      else if (m.layer !== slot) add(layersPath, 'layers', `${slot}: ${ref.id}@${ref.version} fills slot ${m.layer || 'none'}`);
    }
  }
  const withdrawnPath = join(partsRoot, 'withdrawn.json');
  if (!existsSync(withdrawnPath)) add(withdrawnPath, 'withdrawn', 'missing');
  else {
    const w = JSON.parse(readFileSync(withdrawnPath, 'utf8'));
    if (!w || w.interface !== 1 || !Array.isArray(w.withdrawn) || Object.keys(w).length !== 2) {
      add(withdrawnPath, 'withdrawn', 'must be {"interface": 1, "withdrawn": [...]}');
    }
    for (const item of (w && w.withdrawn) || []) {
      if (!item || !item.id || !item.version || !item.reason || Object.keys(item).length !== 3) {
        add(withdrawnPath, 'withdrawn', 'each entry is {id, version, reason}');
      } else if (!manifests.has(`${item.id}@${item.version}`)) add(withdrawnPath, 'withdrawn', `${item.id}@${item.version} is not a published part`);
    }
    if (existsSync(layersPath)) {
      const layers = JSON.parse(readFileSync(layersPath, 'utf8'));
      for (const item of (w && w.withdrawn) || []) {
        for (const slot of Object.keys(layers.layers || {})) {
          const ref = layers.layers[slot];
          if (ref && ref.id === item.id && ref.version === item.version) add(layersPath, 'layers', `${slot} uses withdrawn ${item.id}@${item.version}`);
        }
      }
    }
  }
  return findings;
}

function main() {
  const findings = lintParts();
  for (const f of findings) console.error(`${f.where}: [${f.rule}] ${f.message}`);
  if (findings.length) process.exitCode = 1;
  else console.log('parts lint: no findings');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
