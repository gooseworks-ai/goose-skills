// Built from check-layer/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// ---- _lib/schema.mjs ----
// A small JSON Schema (draft 2020-12) checker for part inputs, outputs and
// manifests. It covers the keywords part manifests and part input schemas use
// and refuses nothing it does not understand silently: unknown keywords are
// annotations (title, description, x-*). `x-kit-file` marks a FileRef value.
//
// Bundled into every part.mjs by parts/_tools/bundle.mjs, so every top-level
// name starts with `kit`.

const kitSchemaSha256 = /^[a-f0-9]{64}$/;

function kitSchemaType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

function kitSchemaTypeOk(value, type) {
  const actual = kitSchemaType(value);
  if (type === 'number') return actual === 'number' || actual === 'integer';
  return actual === type;
}

function kitSchemaEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => kitSchemaEqual(v, b[i]));
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  return kitSchemaEqual(ka, kb) && ka.every((k) => kitSchemaEqual(a[k], b[k]));
}

function kitSchemaResolve(root, ref) {
  if (!ref.startsWith('#/')) throw new Error(`Only local $ref is supported: ${ref}`);
  let node = root;
  for (const raw of ref.slice(2).split('/')) {
    const key = raw.replace(/~1/g, '/').replace(/~0/g, '~');
    if (node == null || typeof node !== 'object' || !Object.hasOwn(node, key)) throw new Error(`Unresolved $ref ${ref}`);
    node = node[key];
  }
  return node;
}

function kitSchemaFileErrors(value, spec, at) {
  if (kitSchemaType(value) !== 'object') return [`${at}: expected a file reference`];
  const errors = [];
  if (value.kind !== 'file') errors.push(`${at}.kind: expected "file"`);
  if (typeof value.path !== 'string' || !value.path.startsWith('/')) errors.push(`${at}.path: expected an absolute path`);
  if (typeof value.sha256 !== 'string' || !kitSchemaSha256.test(value.sha256)) errors.push(`${at}.sha256: expected a sha256`);
  if (!Number.isInteger(value.bytes) || value.bytes < 1) errors.push(`${at}.bytes: expected a positive integer`);
  if (typeof value.mime !== 'string') errors.push(`${at}.mime: expected a string`);
  if (spec && spec.media && value.media !== spec.media) errors.push(`${at}.media: expected ${spec.media}, got ${value.media}`);
  if (spec && Array.isArray(spec.mime) && spec.mime.length && !spec.mime.includes(value.mime)) {
    errors.push(`${at}.mime: ${value.mime} is not one of ${spec.mime.join(', ')}`);
  }
  return errors;
}

function kitSchemaCheck(root, schema, value, at, errors) {
  if (schema === true || schema === undefined) return;
  if (schema === false) {
    errors.push(`${at}: not allowed`);
    return;
  }
  if (schema.$ref) kitSchemaCheck(root, kitSchemaResolve(root, schema.$ref), value, at, errors);
  if (schema['x-kit-file']) {
    errors.push(...kitSchemaFileErrors(value, schema['x-kit-file'], at));
    return;
  }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => kitSchemaTypeOk(value, t))) {
      errors.push(`${at}: expected ${types.join(' or ')}, got ${kitSchemaType(value)}`);
      return;
    }
  }
  if ('const' in schema && !kitSchemaEqual(value, schema.const)) errors.push(`${at}: must be ${JSON.stringify(schema.const)}`);
  if (Array.isArray(schema.enum) && !schema.enum.some((e) => kitSchemaEqual(e, value))) {
    errors.push(`${at}: must be one of ${schema.enum.map((e) => JSON.stringify(e)).join(', ')}`);
  }
  const t = kitSchemaType(value);
  if (t === 'string') {
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength) errors.push(`${at}: shorter than ${schema.minLength}`);
    if (schema.maxLength !== undefined && length > schema.maxLength) errors.push(`${at}: longer than ${schema.maxLength}`);
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, 'u').test(value)) errors.push(`${at}: does not match ${schema.pattern}`);
  }
  if (t === 'number' || t === 'integer') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${at}: below ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${at}: above ${schema.maximum}`);
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) errors.push(`${at}: must be above ${schema.exclusiveMinimum}`);
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) errors.push(`${at}: must be below ${schema.exclusiveMaximum}`);
    if (schema.multipleOf !== undefined) {
      const q = value / schema.multipleOf;
      if (Math.abs(q - Math.round(q)) > 1e-9) errors.push(`${at}: not a multiple of ${schema.multipleOf}`);
    }
  }
  if (t === 'array') {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${at}: fewer than ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${at}: more than ${schema.maxItems} items`);
    if (schema.uniqueItems) {
      for (let i = 0; i < value.length; i++) {
        for (let j = i + 1; j < value.length; j++) {
          if (kitSchemaEqual(value[i], value[j])) errors.push(`${at}: items ${i} and ${j} are the same`);
        }
      }
    }
    if (schema.items !== undefined) value.forEach((item, i) => kitSchemaCheck(root, schema.items, item, `${at}[${i}]`, errors));
    if (schema.contains !== undefined) {
      const hit = value.some((item) => {
        const inner = [];
        kitSchemaCheck(root, schema.contains, item, at, inner);
        return inner.length === 0;
      });
      if (!hit) errors.push(`${at}: no item matches the required item`);
    }
  }
  if (t === 'object') {
    const keys = Object.keys(value);
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) errors.push(`${at}: fewer than ${schema.minProperties} fields`);
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) errors.push(`${at}: more than ${schema.maxProperties} fields`);
    for (const key of schema.required || []) {
      if (!Object.hasOwn(value, key)) errors.push(`${at}.${key}: required`);
    }
    const props = schema.properties || {};
    const patterns = Object.entries(schema.patternProperties || {}).map(([p, s]) => [new RegExp(p, 'u'), s]);
    for (const key of keys) {
      if (schema.propertyNames !== undefined) {
        const inner = [];
        kitSchemaCheck(root, schema.propertyNames, key, `${at}.${key}`, inner);
        if (inner.length) errors.push(`${at}.${key}: field name not allowed`);
      }
      let matched = false;
      if (Object.hasOwn(props, key)) {
        matched = true;
        kitSchemaCheck(root, props[key], value[key], `${at}.${key}`, errors);
      }
      for (const [re, sub] of patterns) {
        if (re.test(key)) {
          matched = true;
          kitSchemaCheck(root, sub, value[key], `${at}.${key}`, errors);
        }
      }
      if (!matched && schema.additionalProperties !== undefined) {
        if (schema.additionalProperties === false) errors.push(`${at}.${key}: unknown field`);
        else kitSchemaCheck(root, schema.additionalProperties, value[key], `${at}.${key}`, errors);
      }
    }
  }
  for (const sub of schema.allOf || []) kitSchemaCheck(root, sub, value, at, errors);
  if (Array.isArray(schema.anyOf)) {
    const ok = schema.anyOf.some((sub) => {
      const inner = [];
      kitSchemaCheck(root, sub, value, at, inner);
      return inner.length === 0;
    });
    if (!ok) errors.push(`${at}: matches none of the allowed shapes`);
  }
  if (Array.isArray(schema.oneOf)) {
    const passing = schema.oneOf.filter((sub) => {
      const inner = [];
      kitSchemaCheck(root, sub, value, at, inner);
      return inner.length === 0;
    }).length;
    if (passing !== 1) errors.push(`${at}: must match exactly one allowed shape (matched ${passing})`);
  }
  if (schema.not !== undefined) {
    const inner = [];
    kitSchemaCheck(root, schema.not, value, at, inner);
    if (inner.length === 0) errors.push(`${at}: matches a shape that is not allowed`);
  }
  if (schema.if !== undefined) {
    const inner = [];
    kitSchemaCheck(root, schema.if, value, at, inner);
    if (inner.length === 0) {
      if (schema.then !== undefined) kitSchemaCheck(root, schema.then, value, at, errors);
    } else if (schema.else !== undefined) {
      kitSchemaCheck(root, schema.else, value, at, errors);
    }
  }
}

/** Every way `value` breaks `schema`, as short sentences. Empty when it fits. */
function kitSchemaErrors(schema, value, at = '$') {
  const errors = [];
  kitSchemaCheck(schema, schema, value, at, errors);
  return errors;
}

// ---- _lib/part.mjs ----
// What every part does at its edges: read its own manifest from its version
// folder, refuse inputs outside its schema, check its outputs, and run the
// kit's ffmpeg. Bundled into every part.mjs; every top-level name starts
// with `kit`.

/** The part's own part.json, read from its read-only version folder. */
async function kitManifest(ctx) {
  const text = await readFile(join(ctx.part.dir, 'part.json'), 'utf8');
  return JSON.parse(text);
}

/** Throws bad_input when `inputs` is outside the manifest's input schema. */
async function kitCheckInputs(ctx, inputs) {
  const manifest = await kitManifest(ctx);
  const errors = kitSchemaErrors(manifest.inputs, inputs, 'inputs');
  if (errors.length) throw ctx.error('bad_input', errors.slice(0, 8).join('; '));
  return manifest;
}

/** Throws output_invalid when `outputs` is outside the manifest's output schema. */
function kitCheckOutputs(ctx, manifest, outputs) {
  const errors = kitSchemaErrors(manifest.outputs, outputs, 'outputs');
  if (errors.length) throw ctx.error('output_invalid', errors.slice(0, 8).join('; '));
  return outputs;
}

/** Stops at the next safe point when the core aborted the step. */
function kitStopIfAborted(ctx) {
  if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
}

/** Runs the kit's ffmpeg with fixed flags; a failure is tool_failed. */
async function kitFfmpeg(ctx, args, options) {
  kitStopIfAborted(ctx);
  try {
    return await ctx.tools.exec('ffmpeg', ['-hide_banner', '-nostdin', '-y', ...args], options);
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    const tail = String((err && (err.stderr || err.message)) || err).slice(-600);
    throw ctx.error('tool_failed', `ffmpeg failed: ${tail}`);
  }
}

/** A time snapped up to the next whole frame. */
function kitSnap(seconds, fps) {
  return Math.ceil((seconds - 1e-8) * fps) / fps;
}

/** A number written with fixed precision for ffmpeg filter strings. */
function kitNum(value, digits = 6) {
  return Number(value).toFixed(digits).replace(/\.?0+$/, '') || '0';
}

/**
 * Integrated loudness, loudness range and true peak of the first audio
 * stream, read from ffmpeg's EBU R128 meter. Null fields when there is no
 * audio or the meter printed nothing.
 */
async function kitLoudness(ctx, path) {
  const { stderr } = await kitFfmpeg(ctx, [
    '-nostats',
    '-i',
    path,
    '-map',
    '0:a:0',
    '-af',
    'ebur128=peak=true',
    '-f',
    'null',
    '-',
  ]);
  const summary = stderr.slice(stderr.lastIndexOf('Summary:'));
  const pick = (re) => {
    const m = re.exec(summary);
    if (!m) return null;
    return m[1] === '-inf' ? -Infinity : Number(m[1]);
  };
  return {
    lufs: pick(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/),
    lra: pick(/LRA:\s*(-?\d+(?:\.\d+)?)\s*LU\b/),
    true_peak_db: pick(/True peak:\s*Peak:\s*(-?\d+(?:\.\d+)?|-inf)\s*dBFS/),
  };
}

/** A stable piece name for list element `index` with id `id`: ^[a-z0-9][a-z0-9_-]{0,47}$. */
function kitPieceName(prefix, id, index, used) {
  let base = String(id == null ? '' : id)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 40);
  let name = base ? `${prefix}-${base}` : `${prefix}-${index + 1}`;
  if (!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(name) || (used && used.has(name))) name = `${prefix}-${index + 1}`;
  if (used) used.add(name);
  return name;
}

/** Media length in seconds: the FileRef's probe, else the kit's probe. */
async function kitDuration(ctx, file) {
  if (file && Number.isFinite(file.duration_s) && file.duration_s > 0) return file.duration_s;
  const info = await ctx.tools.probe(file.path);
  if (!Number.isFinite(info.duration_s) || info.duration_s <= 0) throw ctx.error('tool_failed', `no length for ${file.path}`);
  return info.duration_s;
}

// ---- _lib/speech.mjs ----
// Speech-vs-script gate: a port of the pure part of
// skills/ads/packs/ugc-video-formats/review-ugc-render/scripts/review_render.py
// (canonical spoken form, word diff, issue classification and the verdict).
// It mirrors the Python exactly, including difflib.SequenceMatcher and the
// Unicode behaviour of Python's str methods and re module, so the check layer
// reaches the same verdict as the skill's CLI. No I/O and no imports.
// Every top-level name starts with `speech` or `_speech`, because the bundler
// inlines this file next to other modules.

// ---- Tunables ----
const SPEECH_DEFAULT_MIN_RATIO = 0.9; // transcript to script token similarity to pass
// A substitution between two short, similarly spelled words is almost always a
// mis-voicing (vetted to witted, Hume to Hune), not a paraphrase. Flag it HIGH.
const _speechMisvoiceMaxLenDelta = 3;
const _speechMisvoiceMinCharSim = 0.5;
// A spoken form vs a brand spelling made only of declared brand-term words
// ("ak mee" vs "acme" = 0.67) must at least look this alike to be accepted.
const _speechBrandSwapMinCharSim = 0.6;

// ---- Python str and re semantics ----
// The characters Python's str.isspace() accepts (str.split() and str.strip() use them).
const _speechSpaceClass =
  '\\t\\n\\v\\f\\r\\x1c-\\x20\\x85\\xa0\\u{1680}\\u{2000}-\\u{200a}\\u{2028}\\u{2029}\\u{202f}\\u{205f}\\u{3000}';
// str.isdigit(): decimal digits plus the Numeric_Type=Digit characters (superscripts,
// circled digits and the like).
const _speechDigitClass =
  '\\p{Nd}\\u{b2}\\u{b3}\\u{b9}\\u{1369}-\\u{1371}\\u{19da}\\u{2070}\\u{2074}-\\u{2079}\\u{2080}-\\u{2089}' +
  '\\u{2460}-\\u{2468}\\u{2474}-\\u{247c}\\u{2488}-\\u{2490}\\u{24ea}\\u{24f5}-\\u{24fd}\\u{24ff}' +
  '\\u{2776}-\\u{277e}\\u{2780}-\\u{2788}\\u{278a}-\\u{2792}\\u{10a40}-\\u{10a43}\\u{10e60}-\\u{10e68}' +
  '\\u{11052}-\\u{1105a}\\u{1f100}-\\u{1f10a}';
const _speechSpaceRunRe = new RegExp(`[${_speechSpaceClass}]+`, 'u');
const _speechSpaceEdgeRe = new RegExp(`^[${_speechSpaceClass}]+|[${_speechSpaceClass}]+$`, 'gu');
const _speechDigitRe = new RegExp(`^[${_speechDigitClass}]+$`, 'u');
const _speechAlphaRe = /^\p{L}+$/u; // str.isalpha(): Lu, Ll, Lt, Lm, Lo
const _speechOneNdRe = /^\p{Nd}$/u; // re \d is Unicode Nd
const _speechNonPrintableRe = /^[\p{C}\p{Z}]$/u;

function _speechIsAlpha(s) {
  return _speechAlphaRe.test(s);
}

function _speechIsDigit(s) {
  return _speechDigitRe.test(s);
}

function _speechPySplit(s) {
  return s.split(_speechSpaceRunRe).filter((x) => x !== '');
}

function _speechPyStrip(s) {
  return s.replace(_speechSpaceEdgeRe, '');
}

// str.strip(chars) / str.lstrip(chars). Every char in `chars` is a single UTF-16 unit.
function _speechStripSet(s, chars, right = true) {
  let a = 0;
  let b = s.length;
  while (a < b && chars.includes(s[a])) a += 1;
  while (right && b > a && chars.includes(s[b - 1])) b -= 1;
  return s.slice(a, b);
}

// len() and indexing count code points, not UTF-16 units.
function _speechLen(s) {
  return Array.from(s).length;
}

function _speechFirst(s) {
  return s ? String.fromCodePoint(s.codePointAt(0)) : '';
}

function _speechLjust(s, width) {
  const n = _speechLen(s);
  return n >= width ? s : s + '0'.repeat(width - n);
}

// int() of a string of Unicode decimal digits. Decimal digits are encoded in
// contiguous runs of ten (0 to 9), so a digit's value is its distance from the
// start of its run, modulo ten.
function _speechInt(digits) {
  let ascii = '';
  for (const ch of digits) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x30 && cp <= 0x39) {
      ascii += ch;
      continue;
    }
    let first = cp;
    while (_speechOneNdRe.test(String.fromCodePoint(first - 1))) first -= 1;
    ascii += String((cp - first) % 10);
  }
  return BigInt(ascii);
}

// unicodedata.combining(ch) != 0, for a character already in decomposed form
// (the text is NFKD first). Such a character moves in front of U+0345 (class
// 240, the highest class) when the pair is put in canonical order.
function _speechIsCombining(ch) {
  const cp = ch.codePointAt(0);
  if (cp < 0x300) return false;
  return cp === 0x345 || ('\u{345}' + ch).normalize('NFD') !== '\u{345}' + ch.normalize('NFD');
}

// repr() of a str, for error messages.
function _speechRepr(s) {
  if (s === null || s === undefined) return 'None';
  if (typeof s !== 'string') return String(s);
  const q = s.includes("'") && !s.includes('"') ? '"' : "'";
  let out = q;
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (ch === q || ch === '\\') out += '\\' + ch;
    else if (ch === '\t') out += '\\t';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch !== ' ' && _speechNonPrintableRe.test(ch)) {
      const hex = cp.toString(16);
      if (cp < 0x100) out += '\\x' + hex.padStart(2, '0');
      else if (cp < 0x10000) out += '\\' + 'u' + hex.padStart(4, '0');
      else out += '\\U' + hex.padStart(8, '0');
    } else out += ch;
  }
  return out + q;
}

function _speechValueError(message) {
  const e = new Error(message);
  e.name = 'ValueError';
  return e;
}

function _speechSameList(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function _speechIsDict(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function _speechDictEntries(x) {
  return x instanceof Map ? [...x.entries()] : Object.entries(x);
}

function _speechDictGet(x, key) {
  if (x instanceof Map) return x.get(key);
  return Object.prototype.hasOwnProperty.call(x, key) ? x[key] : undefined;
}

// list(x) for the iterables a caller may pass (a str iterates its characters).
function _speechToList(x, what) {
  if (typeof x === 'string') return Array.from(x);
  if (x !== null && x !== undefined && typeof x[Symbol.iterator] === 'function') return Array.from(x);
  throw new TypeError(`${what} is not iterable`);
}

function _speechTruthy(x) {
  if (Array.isArray(x)) return x.length > 0;
  if (x instanceof Map || x instanceof Set) return x.size > 0;
  if (_speechIsDict(x)) return Object.keys(x).length > 0;
  return Boolean(x);
}

// ---- difflib.SequenceMatcher ----
// The two ways review_render uses it: isjunk is always None, so the junk set is
// empty and only the "popular" purge applies (autojunk on and 200+ items in b).

function _speechMatchingBlocks(a, b, autojunk) {
  const b2j = new Map();
  for (let i = 0; i < b.length; i++) {
    let indices = b2j.get(b[i]);
    if (!indices) {
      indices = [];
      b2j.set(b[i], indices);
    }
    indices.push(i);
  }
  const n = b.length;
  if (autojunk && n >= 200) {
    const ntest = (n - (n % 100)) / 100 + 1;
    const popular = [];
    for (const [elt, idxs] of b2j) if (idxs.length > ntest) popular.push(elt);
    for (const elt of popular) b2j.delete(elt);
  }

  const findLongestMatch = (alo, ahi, blo, bhi) => {
    let besti = alo;
    let bestj = blo;
    let bestsize = 0;
    let j2len = new Map();
    for (let i = alo; i < ahi; i++) {
      const newj2len = new Map();
      const idxs = b2j.get(a[i]);
      if (idxs) {
        for (const j of idxs) {
          if (j < blo) continue;
          if (j >= bhi) break;
          const k = (j2len.get(j - 1) || 0) + 1;
          newj2len.set(j, k);
          if (k > bestsize) {
            besti = i - k + 1;
            bestj = j - k + 1;
            bestsize = k;
          }
        }
      }
      j2len = newj2len;
    }
    // Extend by non-junk (here: any) equal elements on each end; this picks up
    // popular elements. The junk-only extension that follows in difflib never
    // fires with an empty junk set.
    while (besti > alo && bestj > blo && a[besti - 1] === b[bestj - 1]) {
      besti -= 1;
      bestj -= 1;
      bestsize += 1;
    }
    while (besti + bestsize < ahi && bestj + bestsize < bhi && a[besti + bestsize] === b[bestj + bestsize]) {
      bestsize += 1;
    }
    return [besti, bestj, bestsize];
  };

  const la = a.length;
  const lb = b.length;
  const queue = [[0, la, 0, lb]];
  const blocks = [];
  while (queue.length) {
    const [alo, ahi, blo, bhi] = queue.pop();
    const x = findLongestMatch(alo, ahi, blo, bhi);
    const [i, j, k] = x;
    if (k) {
      blocks.push(x);
      if (alo < i && blo < j) queue.push([alo, i, blo, j]);
      if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
    }
  }
  blocks.sort((p, q) => p[0] - q[0] || p[1] - q[1] || p[2] - q[2]);
  let i1 = 0;
  let j1 = 0;
  let k1 = 0;
  const nonAdjacent = [];
  for (const [i2, j2, k2] of blocks) {
    if (i1 + k1 === i2 && j1 + k1 === j2) k1 += k2;
    else {
      if (k1) nonAdjacent.push([i1, j1, k1]);
      i1 = i2;
      j1 = j2;
      k1 = k2;
    }
  }
  if (k1) nonAdjacent.push([i1, j1, k1]);
  nonAdjacent.push([la, lb, 0]);
  return nonAdjacent;
}

function _speechOpcodes(blocks) {
  let i = 0;
  let j = 0;
  const answer = [];
  for (const [ai, bj, size] of blocks) {
    let tag = '';
    if (i < ai && j < bj) tag = 'replace';
    else if (i < ai) tag = 'delete';
    else if (j < bj) tag = 'insert';
    if (tag) answer.push([tag, i, ai, j, bj]);
    i = ai + size;
    j = bj + size;
    if (size) answer.push(['equal', ai, i, bj, j]);
  }
  return answer;
}

// SequenceMatcher(None, a, b).ratio() over the code points of two strings.
function _speechCharSim(a, b) {
  const ca = Array.from(a);
  const cb = Array.from(b);
  let matches = 0;
  for (const block of _speechMatchingBlocks(ca, cb, true)) matches += block[2];
  const length = ca.length + cb.length;
  return length ? (2.0 * matches) / length : 1.0;
}

// ---- Canonical spoken form ----
// Every rule below is bounded and deterministic. Each canonical token remembers
// the original words it came from, so the report can quote what was written or heard.
// A token is { text, orig, src, unit }: canonical text, original wording, the
// identity of the source word (dedupes the report) and whether it is a unit word
// that follows a quantity ("5 [milligrams]").

function _speechTok(text, orig, src, unit = false) {
  return { text, orig, src, unit };
}

// "one" for a 1 that was written as the word "one" (lets "every one" equal "everyone").
function _speechSpelled(tok) {
  const w = tok.orig.toLowerCase();
  return _speechIsAlpha(w) && _speechNumberWords.has(w) && tok.text !== w ? w : null;
}

function _speechMerge(toks, text) {
  return _speechTok(text, _speechOrigText(toks), {});
}

function _speechOrigText(toks) {
  const parts = [];
  let last;
  for (const t of toks) {
    if (t.src !== last) {
      parts.push(t.orig);
      last = t.src;
    }
  }
  return parts.join(' ');
}

const _speechSmall = new Map(
  'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'
    .split(' ')
    .map((w, i) => [w, i]),
);
const _speechTens = new Map('twenty thirty forty fifty sixty seventy eighty ninety'.split(' ').map((w, i) => [w, 10 * (i + 2)]));
// "second" is left out on purpose: "one second" is a duration far more often than an ordinal.
const _speechOrdSmall = new Map([
  ['first', 1], ['third', 3], ['fourth', 4], ['fifth', 5], ['sixth', 6], ['seventh', 7],
  ['eighth', 8], ['ninth', 9], ['tenth', 10], ['eleventh', 11], ['twelfth', 12],
  ['thirteenth', 13], ['fourteenth', 14], ['fifteenth', 15], ['sixteenth', 16],
  ['seventeenth', 17], ['eighteenth', 18], ['nineteenth', 19],
]);
const _speechOrdTens = new Map(
  'twentieth thirtieth fortieth fiftieth sixtieth seventieth eightieth ninetieth'.split(' ').map((w, i) => [w, 10 * (i + 2)]),
);
const _speechNumberWords = new Set([
  ..._speechSmall.keys(),
  ..._speechTens.keys(),
  ..._speechOrdSmall.keys(),
  ..._speechOrdTens.keys(),
  'hundred',
  'thousand',
]);
const _speechACounts = new Set(['hundred', 'thousand', 'million', 'billion']); // "a million" is "one million"
const _speechMultipliers = new Map([
  ['hundred', 100n],
  ['thousand', 1000n],
  ['k', 1000n],
  ['million', 1000000n],
  ['billion', 1000000000n],
]);

// Unit spellings to one canonical word. Applied ONLY right after a quantity.
const _speechUnitWords = new Map(
  Object.entries({
    mg: 'milligrams', milligram: 'milligrams', milligrams: 'milligrams',
    mcg: 'micrograms', '\u{b5}g': 'micrograms', ug: 'micrograms',
    microgram: 'micrograms', micrograms: 'micrograms',
    g: 'grams', gram: 'grams', grams: 'grams',
    kg: 'kilograms', kgs: 'kilograms', kilo: 'kilograms', kilos: 'kilograms',
    kilogram: 'kilograms', kilograms: 'kilograms',
    ml: 'milliliters', milliliter: 'milliliters', milliliters: 'milliliters',
    millilitre: 'milliliters', millilitres: 'milliliters',
    l: 'liters', liter: 'liters', liters: 'liters', litre: 'liters', litres: 'liters',
    oz: 'ounces', ounce: 'ounces', ounces: 'ounces',
    lb: 'pounds', lbs: 'pounds', pound: 'pounds', pounds: 'pounds',
    percent: 'percent', pct: 'percent',
    dollar: 'dollars', dollars: 'dollars', usd: 'dollars',
    cent: 'cents', cents: 'cents', euro: 'euros', euros: 'euros',
    hr: 'hours', hrs: 'hours', hour: 'hours', hours: 'hours',
    min: 'minutes', mins: 'minutes', minute: 'minutes', minutes: 'minutes',
    sec: 'seconds', secs: 'seconds', second: 'seconds', seconds: 'seconds',
    cal: 'calories', calorie: 'calories', calories: 'calories',
    day: 'days', days: 'days', week: 'weeks', weeks: 'weeks',
    month: 'months', months: 'months', year: 'years', years: 'years',
    x: 'times', times: 'times',
  }),
);
const _speechCurrency = new Map([
  ['$', 'dollars'],
  ['\u{a3}', 'pounds'],
  ['\u{20ac}', 'euros'],
]);

// Negations an alias's spoken form may not add ("no" and "nor" are allowed as syllables: "no-mad").
const _speechAliasForbidden = new Set(['not', 'never', 'without', 'none', 'nothing', 'nobody']);
const _speechNegations = new Set(['not', 'no', 'never', 'nothing', 'nobody', 'none', 'nowhere', 'neither', 'nor', 'without']);

// Contractions. Ambiguous apostrophe-less spellings (cant, wont, ill, well, were,
// shell, hell, id, shed) are deliberately NOT expanded.
const _speechAposContractions = new Map([
  ["can't", ['can', 'not']],
  ["won't", ['will', 'not']],
  ["shan't", ['shall', 'not']],
  ["i'm", ['i', 'am']],
  ["let's", ['let', 'us']],
]);
const _speechBareContractions = new Map(
  Object.entries({
    dont: ['do', 'not'], doesnt: ['does', 'not'], didnt: ['did', 'not'],
    isnt: ['is', 'not'], arent: ['are', 'not'], wasnt: ['was', 'not'],
    werent: ['were', 'not'], havent: ['have', 'not'], hasnt: ['has', 'not'],
    hadnt: ['had', 'not'], wouldnt: ['would', 'not'], shouldnt: ['should', 'not'],
    couldnt: ['could', 'not'], mustnt: ['must', 'not'], neednt: ['need', 'not'],
    cannot: ['can', 'not'], im: ['i', 'am'], youre: ['you', 'are'],
    theyre: ['they', 'are'], ive: ['i', 'have'], youve: ['you', 'have'],
    weve: ['we', 'have'], theyve: ['they', 'have'], youll: ['you', 'will'],
    theyll: ['they', 'will'], itll: ['it', 'will'], thatll: ['that', 'will'],
    youd: ['you', 'would'], theyd: ['they', 'would'],
    // "its" and "it's" sound the same; Whisper and script writers swap them.
    its: ['it', 'is'], thats: ['that', 'is'], whats: ['what', 'is'],
    theres: ['there', 'is'], heres: ['here', 'is'],
  }),
);
const _speechSIs = new Set([
  'it', 'that', 'there', 'here', 'what', 'who', 'where', 'when', 'why', 'how',
  'he', 'she', 'everyone', 'everything', 'nothing', 'someone', 'something', 'this',
]);
const _speechAposSuffix = [
  ["n't", 'not'],
  ["'re", 'are'],
  ["'ve", 'have'],
  ["'ll", 'will'],
  ["'d", 'would'],
  ["'m", 'am'],
];

const _speechApostropheRe = /[\u{2019}\u{2018}\u{2bc}`]/gu;
const _speechDashesRe = /[\u{2010}-\u{2015}\u{2212}]/gu;
const _speechEdgeChars = '"\'()[]{}<>\u{ab}\u{bb},;:!?\u{2026}.*_~|';
const _speechEdgeCharsNoDots = '"\'()[]{}<>\u{ab}\u{bb},;:!?*_~|';
const _speechDomainRe = new RegExp(`^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,}(?:/[^${_speechSpaceClass}]*)?$`, 'u');
const _speechInitialismRe = /^[a-z](?:\.[a-z])+$/u; // a.g  p.m  u.s.a
const _speechOrdinalRe = /^(\p{Nd}+)(?:st|nd|rd|th)$/u;
const _speechCurrencyRe = /^([$\u{a3}\u{20ac}])(\p{Nd}{1,3}(?:,\p{Nd}{3})+|\p{Nd}+)(?:\.(\p{Nd}{1,2}))?(k)?$/u;
const _speechRunRe = /\p{Nd}+(?:[.,]\p{Nd}+)*|[\p{L}\p{Nl}\p{No}]+/gu; // re [^\W\d_] is L, Nl and No
const _speechIntRe = /^\p{Nd}+$/u;
const _speechQuantityRe = /^\p{Nd}+(?:st|nd|rd|th)?$/u;
const _speechGroupedRe = /^\p{Nd}{1,3}(?:,\p{Nd}{3})+(?:\.\p{Nd}+)?$/u;
const _speechNoDotNumberRe = /^[Nn][Oo]\.(\p{Nd}[\p{Nd},]*)$/u;
const _speechNoDotRe = /^[Nn][Oo]\.$/u;
const _speechSchemeRe = /^https?:\/\//u;
const _speechYearHeadRe = /^[1-9]\p{Nd}?$/u;
const _speechYearTailRe = /^[1-9]\p{Nd}$/u;

function _speechOrdinal(n) {
  const v = BigInt(n);
  const r100 = v % 100n;
  if (r100 >= 10n && r100 <= 20n) return `${v}th`;
  const r10 = v % 10n;
  return `${v}${r10 === 1n ? 'st' : r10 === 2n ? 'nd' : r10 === 3n ? 'rd' : 'th'}`;
}

function _speechIsInt(text) {
  return _speechIntRe.test(text);
}

// '1,000' gives ['1000']; '2.5' gives ['2', 'point', '5']; '1,2' gives ['1', '2'].
function _speechDigitRun(run) {
  if (run.includes(',')) {
    if (_speechGroupedRe.test(run)) run = run.replaceAll(',', '');
    else return run.split(',').flatMap((part) => _speechDigitRun(part).filter((x) => x));
  }
  if (run.includes('.')) {
    const out = [];
    run.split('.').forEach((part, k) => {
      if (k) out.push('point');
      out.push(part);
    });
    return out;
  }
  return [run];
}

function _speechRuns(piece) {
  const out = [];
  for (const run of piece.match(_speechRunRe) || []) {
    if (_speechIsDigit(_speechFirst(run))) out.push(..._speechDigitRun(run));
    else out.push(run);
  }
  return out;
}

// Canonical words for one hyphen-free piece of a written word (lowercase).
function _speechPieceWords(p) {
  p = _speechStripSet(p, _speechEdgeChars + '.');
  if (!p) return [];
  const m = _speechCurrencyRe.exec(p);
  if (m) {
    const [, sym, rawWhole, cents, k] = m;
    const whole = rawWhole.replaceAll(',', '');
    const unit = _speechCurrency.get(sym);
    if (k) return [String(_speechInt(whole) * 1000n + (cents ? _speechInt(_speechLjust(cents, 3)) : 0n)), unit];
    if (cents && _speechInt(whole) === 0n && sym === '$') return [String(_speechInt(_speechLjust(cents, 2))), 'cents'];
    const words = [whole, unit];
    if (cents && _speechInt(_speechLjust(cents, 2)) !== 0n) words.push(_speechLjust(cents, 2));
    return words;
  }
  const head = _speechFirst(p);
  if (_speechCurrency.has(head)) {
    const rest = _speechPieceWords(p.slice(head.length));
    // the currency word follows the amount, as spoken: "$29/month" is 29 dollars month
    let j = 0;
    while (j < rest.length && (_speechIsDigit(rest[j]) || ['point', 'k', 'm', 'million', 'billion'].includes(rest[j]))) j += 1;
    return [...rest.slice(0, j), _speechCurrency.get(head), ...rest.slice(j)];
  }
  if (p.endsWith('\u{a2}')) return [..._speechPieceWords(p.slice(0, -1)), 'cents'];
  if (p.endsWith('%')) return [..._speechPieceWords(p.slice(0, -1)), 'percent'];
  if (head === '@') return ['at', ..._speechPieceWords(p.slice(1))];
  if (head === '#') {
    const rest = _speechPieceWords(p.slice(1));
    return [rest.length && _speechIsDigit(_speechFirst(rest[0])) ? 'number' : 'hashtag', ...rest];
  }
  const ord = _speechOrdinalRe.exec(p);
  if (ord) return [_speechOrdinal(_speechInt(ord[1]))];
  if (_speechInitialismRe.test(p)) return [p.replaceAll('.', '')];
  if (p.includes("'")) {
    if (_speechAposContractions.has(p)) return [..._speechAposContractions.get(p)];
    for (const [suffix, word] of _speechAposSuffix) {
      if (p.endsWith(suffix) && p.length > suffix.length) return [..._speechRuns(p.slice(0, p.length - suffix.length)), word];
    }
    if (p.endsWith("'s") && _speechSIs.has(p.slice(0, -2))) return [p.slice(0, -2), 'is'];
    // possessive, plural possessive, o'clock, y'all: the apostrophe is silent
    p = p.replaceAll("'", '');
  }
  if (_speechBareContractions.has(p)) return [..._speechBareContractions.get(p)];
  return _speechRuns(p);
}

// Split written text into canonical word tokens (before the cross-word rules).
function _speechRawTokens(text) {
  if (text === null || text === undefined) text = '';
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  let norm = '';
  for (const ch of text.normalize('NFKD')) if (!_speechIsCombining(ch)) norm += ch;
  norm = norm.replace(_speechApostropheRe, "'").replace(_speechDashesRe, '-');
  norm = norm.replaceAll('&', ' and ').replaceAll('+', ' plus ');
  const out = [];
  const chunks = _speechPySplit(norm);
  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    // "No. 1" and "No.1" are "number one", not a negation
    const bare = _speechStripSet(chunk, _speechEdgeChars);
    const no = _speechNoDotNumberRe.exec(bare);
    if (no) {
      const src = {};
      for (const w of ['number', ..._speechPieceWords(no[1])]) out.push(_speechTok(w, bare, src));
      continue;
    }
    if (
      _speechNoDotRe.test(_speechStripSet(chunk, _speechEdgeCharsNoDots)) &&
      ci + 1 < chunks.length &&
      _speechIsDigit(_speechFirst(_speechStripSet(chunks[ci + 1], _speechEdgeChars, false)))
    ) {
      out.push(_speechTok('number', bare, {}));
      continue;
    }
    const orig = _speechStripSet(chunk, _speechEdgeChars + '.');
    if (!orig) continue;
    const low = orig.toLowerCase();
    const lowUrl = low.replace(_speechSchemeRe, '');
    if (_speechDomainRe.test(lowUrl)) {
      const src = {};
      const slash = lowUrl.indexOf('/');
      const host = slash < 0 ? lowUrl : lowUrl.slice(0, slash);
      const path = slash < 0 ? '' : lowUrl.slice(slash + 1);
      let labels = host.split('.');
      if (labels[0] === 'www' && labels.length > 2) labels = labels.slice(1);
      const words = [];
      labels.forEach((label, k) => {
        if (k) words.push('dot');
        words.push(..._speechRuns(label));
      });
      for (const seg of path ? path.split('/') : []) {
        if (seg) {
          words.push('slash');
          words.push(..._speechRuns(seg));
        }
      }
      for (const w of words) out.push(_speechTok(w, orig, src));
      continue;
    }
    if (_speechCurrencyRe.test(low)) {
      const src = {};
      for (const w of _speechPieceWords(low)) out.push(_speechTok(w, orig, src));
      continue;
    }
    for (const piece of orig.split('-')) {
      const src = {};
      for (const w of _speechPieceWords(piece.toLowerCase())) out.push(_speechTok(w, piece, src));
    }
  }
  return out;
}

// [value, nextIndex, isOrdinal] or null, for the parsers below.
function _speechParseBelow100(w, i) {
  const x = w[i];
  const n = w.length;
  if (_speechSmall.has(x)) return [_speechSmall.get(x), i + 1, false];
  if (_speechOrdSmall.has(x)) return [_speechOrdSmall.get(x), i + 1, true];
  if (_speechOrdTens.has(x)) return [_speechOrdTens.get(x), i + 1, true];
  if (_speechTens.has(x)) {
    const v = _speechTens.get(x);
    if (i + 1 < n) {
      const y = w[i + 1];
      if (_speechSmall.has(y) && _speechSmall.get(y) >= 1 && _speechSmall.get(y) <= 9) return [v + _speechSmall.get(y), i + 2, false];
      if (_speechOrdSmall.has(y) && _speechOrdSmall.get(y) <= 9) return [v + _speechOrdSmall.get(y), i + 2, true];
    }
    return [v, i + 1, false];
  }
  return null;
}

function _speechParseBelow1000(w, i) {
  const n = w.length;
  let v;
  let j;
  let o;
  if (w[i] === 'a' && i + 1 < n && _speechACounts.has(w[i + 1])) [v, j, o] = [1, i + 1, false];
  else if (w[i] === 'hundred') [v, j, o] = [1, i, false];
  else {
    const r = _speechParseBelow100(w, i);
    if (r === null) return null;
    [v, j, o] = r;
  }
  if (!o && j < n && w[j] === 'hundred' && v >= 1 && v < 100) {
    v *= 100;
    j += 1;
    const k = j + 1 < n && w[j] === 'and' && _speechParseBelow100(w, j + 1) ? j + 1 : j;
    const r = k < n ? _speechParseBelow100(w, k) : null;
    if (r) [v, j, o] = [v + r[0], r[1], r[2]];
  }
  return [v, j, o];
}

// [value, nextIndex, isOrdinal] for a spelled number starting at w[i], else null.
function _speechParseNumber(w, i) {
  const n = w.length;
  let v;
  let j;
  let o;
  if (w[i] === 'thousand') [v, j, o] = [1, i, false];
  else {
    const r = _speechParseBelow1000(w, i);
    if (r === null) return null;
    [v, j, o] = r;
  }
  if (!o && j < n && w[j] === 'thousand' && v < 1000) {
    v *= 1000;
    j += 1;
    const k = j + 1 < n && w[j] === 'and' && _speechParseBelow1000(w, j + 1) ? j + 1 : j;
    const r = k < n ? _speechParseBelow1000(w, k) : null;
    if (r) [v, j, o] = [v + r[0], r[1], r[2]];
  }
  return [v, j, o];
}

function _speechSpellNumbers(toks) {
  const w = toks.map((t) => t.text);
  const out = [];
  let i = 0;
  while (i < toks.length) {
    const x = w[i];
    let start = _speechNumberWords.has(x) || (x === 'a' && i + 1 < w.length && _speechACounts.has(w[i + 1]));
    // "5 hundred": the multiplier pass makes 500
    if ((x === 'hundred' || x === 'thousand') && out.length && _speechIsInt(out[out.length - 1].text)) start = false;
    const r = start ? _speechParseNumber(w, i) : null;
    if (r) {
      const [v, j, o] = r;
      out.push(_speechMerge(toks.slice(i, j), o ? _speechOrdinal(v) : String(v)));
      i = j;
    } else {
      out.push(toks[i]);
      i += 1;
    }
  }
  return out;
}

function _speechDecimalsAndMultipliers(toks) {
  const out = [];
  const n = toks.length;
  let i = 0;
  while (i < n) {
    const t = toks[i];
    const prev = out.length ? out[out.length - 1].text : '';
    // "nine point nine nine" is 9 point 99 (fraction digits read one by one)
    if (t.text === 'point' && _speechIsInt(prev)) {
      let j = i + 1;
      while (j < n && _speechOneNdRe.test(toks[j].text)) j += 1;
      out.push(t);
      if (j - (i + 1) >= 2) {
        const digits = toks.slice(i + 1, j);
        out.push(_speechMerge(digits, digits.map((x) => x.text).join('')));
        i = j;
      } else i += 1;
      continue;
    }
    const nxt = i + 1 < n ? toks[i + 1].text : '';
    if (_speechIsInt(t.text) && prev !== 'point') {
      // "one and a half" is 1 point 5
      if (_speechSameList(toks.slice(i + 1, i + 4).map((x) => x.text), ['and', 'a', 'half'])) {
        const src = {};
        const orig = _speechOrigText(toks.slice(i, i + 4));
        out.push(_speechTok(t.text, orig, src), _speechTok('point', orig, src), _speechTok('5', orig, src));
        i += 4;
        continue;
      }
      // "5 hundred", "10k", "ten thousand", "1 million" are one integer
      if (_speechMultipliers.has(nxt)) {
        out.push(_speechMerge(toks.slice(i, i + 2), String(_speechInt(t.text) * _speechMultipliers.get(nxt))));
        i += 2;
        continue;
      }
    }
    out.push(t);
    i += 1;
  }
  return out;
}

function _speechUnits(toks) {
  const out = [];
  for (let t of toks) {
    if (_speechUnitWords.has(t.text) && out.length && _speechIsInt(out[out.length - 1].text)) {
      t = _speechTok(_speechUnitWords.get(t.text), t.orig, t.src, true);
    }
    out.push(t);
  }
  // money: "N dollars (and) M cents" is N dollars M (matches "$N.MM")
  const res = [];
  let i = 0;
  while (i < out.length) {
    const t = out[i];
    res.push(t);
    if (t.text === 'dollars' && res.length > 1 && _speechIsInt(res[res.length - 2].text)) {
      const rest = out.slice(i + 1, i + 4).map((x) => x.text);
      if (rest.length >= 3 && rest[0] === 'and' && _speechIsInt(rest[1]) && rest[2] === 'cents') {
        res.push(_speechMerge(out.slice(i + 1, i + 4), rest[1]));
        i += 4;
        continue;
      }
      if (rest.length >= 2 && _speechIsInt(rest[0]) && rest[1] === 'cents') {
        res.push(_speechMerge(out.slice(i + 1, i + 3), rest[0]));
        i += 3;
        continue;
      }
    }
    i += 1;
  }
  return res;
}

function _speechIsLetter(text) {
  return _speechLen(text) === 1 && _speechIsAlpha(text);
}

function _speechContextFixes(toks) {
  const out = [];
  const n = toks.length;
  let i = 0;
  while (i < n) {
    let t = toks[i];
    // "it's been" is it HAS been
    if (
      t.text === 'is' &&
      t.orig.replace(_speechApostropheRe, "'").toLowerCase().endsWith("'s") &&
      i + 1 < n &&
      ['been', 'got', 'gotten'].includes(toks[i + 1].text)
    ) {
      t = _speechTok('has', t.orig, t.src);
    }
    // spelled letters next to "dot": "w w w dot" is www dot, "dot a i" is dot ai
    if (_speechIsLetter(t.text)) {
      let j = i;
      while (j < n && _speechIsLetter(toks[j].text)) j += 1;
      const before = out.length ? out[out.length - 1].text : '';
      const after = j < n ? toks[j].text : '';
      if (j - i >= 2 && (before === 'dot' || after === 'dot')) {
        const letters = toks.slice(i, j);
        out.push(_speechMerge(letters, letters.map((x) => x.text).join('')));
        i = j;
        continue;
      }
    }
    out.push(t);
    i += 1;
  }
  // a leading "www dot" in front of a domain ("www dot example dot com") is optional
  const res = [];
  i = 0;
  while (i < out.length) {
    if (out[i].text === 'www' && i + 3 < out.length && out[i + 1].text === 'dot' && out[i + 3].text === 'dot') {
      i += 2;
      continue;
    }
    res.push(out[i]);
    i += 1;
  }
  return res;
}

function _speechBaseTokens(text) {
  let toks = _speechRawTokens(text);
  toks = _speechSpellNumbers(toks);
  toks = _speechDecimalsAndMultipliers(toks);
  toks = _speechUnits(toks);
  return _speechContextFixes(toks);
}

// Quantities, units (after a quantity) and negations: what an alias may never rewrite.
function _speechProtected(toks) {
  return toks.filter((t) => _speechQuantityRe.test(t.text) || t.unit || _speechNegations.has(t.text)).map((t) => t.text);
}

function _speechAliasPairs(aliases) {
  if (!_speechTruthy(aliases)) return [];
  if (_speechIsDict(aliases) && !(aliases instanceof Set)) {
    const pairs = [];
    for (const [term, forms] of _speechDictEntries(aliases)) {
      const list = typeof forms === 'string' ? [forms] : _speechTruthy(forms) ? _speechToList(forms, 'alias forms') : [];
      for (const form of list) pairs.push([term, form]);
    }
    return pairs;
  }
  const pairs = [];
  for (const item of _speechToList(aliases, 'aliases')) {
    if (_speechIsDict(item) && !(item instanceof Set)) pairs.push([_speechDictGet(item, 'term'), _speechDictGet(item, 'say_as')]);
    else {
      const pair = _speechToList(item, 'an alias');
      if (pair.length !== 2) throw _speechValueError(`each alias must be a (term, spoken form) pair, got ${pair.length} values`);
      pairs.push([pair[0], pair[1]]);
    }
  }
  return pairs;
}

/**
 * Validate confirmed spoken aliases and compile them to [spokenForm, term] token
 * rules (arrays of canonical words), longest spoken form first.
 *
 * `aliases`: {term: say_as | [say_as, ...]}, [[term, say_as], ...] or
 * [{term, say_as}, ...] (the read_pronunciations.py `pronunciations` list).
 * An alias may respell a name, digits and number-like syllables included ("AG1"
 * said "A G one", "Tenzing" said "ten-zing"). It is refused when the written term
 * has a number, unit or negation the spoken form changes ("AG1" = "A G two"), when
 * the spoken form adds a strong negation, or when the spoken form is nothing but
 * numbers, units or negations ("Decagon" = "five"). Throws an Error named
 * ValueError on a bad alias.
 */
function speechBuildAliases(aliases) {
  const rules = new Map();
  for (const [term, form] of _speechAliasPairs(aliases)) {
    if (typeof term !== 'string' || typeof form !== 'string' || !_speechPyStrip(term) || !_speechPyStrip(form)) {
      throw _speechValueError('each alias needs a written term and a confirmed spoken form');
    }
    const termT = _speechBaseTokens(term);
    const formT = _speechBaseTokens(form);
    const termW = termT.map((t) => t.text);
    const formW = formT.map((t) => t.text);
    if (!termW.length || !formW.length) throw _speechValueError(`alias "${term}" = "${form}" has no words to match`);
    const termP = _speechProtected(termT);
    const formP = _speechProtected(formT);
    if (termP.length && !_speechSameList(termP, formP)) {
      throw _speechValueError(`alias "${term}" = "${form}" would change a number, unit or negation; an alias may only respell a name`);
    }
    if (!termP.length && formW.some((w) => _speechAliasForbidden.has(w))) {
      throw _speechValueError(`alias "${term}" = "${form}": the spoken form adds a negation; an alias may only respell a name`);
    }
    if (!termP.length && formP.length === formW.length) {
      throw _speechValueError(
        `alias "${term}" = "${form}": the spoken form is only numbers, units or negations; an alias may only respell a name`,
      );
    }
    const candidates = [formW];
    // "goose works" is also heard as "gooseworks"
    if (formW.length > 1 && formW.every((w) => _speechIsAlpha(w))) candidates.push([formW.join('')]);
    for (const cand of candidates) {
      if (_speechSameList(cand, termW)) continue;
      const key = JSON.stringify(cand);
      if (rules.has(key) && !_speechSameList(rules.get(key)[1], termW)) {
        throw _speechValueError(`spoken form "${cand.join(' ')}" is confirmed for two different terms`);
      }
      rules.set(key, [cand, termW]);
    }
  }
  return [...rules.values()].sort((a, b) => b[0].length - a[0].length);
}

function _speechApplyAliases(toks, rules) {
  if (!rules.length) return toks;
  const texts = toks.map((t) => t.text);
  const out = [];
  let i = 0;
  while (i < toks.length) {
    let hit = null;
    for (const rule of rules) {
      if (_speechSameList(texts.slice(i, i + rule[0].length), rule[0])) {
        hit = rule;
        break;
      }
    }
    if (hit) {
      const [form, term] = hit;
      const orig = _speechOrigText(toks.slice(i, i + form.length));
      const src = {};
      for (const w of term) out.push(_speechTok(w, orig, src));
      i += form.length;
    } else {
      out.push(toks[i]);
      i += 1;
    }
  }
  return out;
}

/** Canonical spoken-form tokens ({text, orig, src, unit}) for `text`. */
function speechCanonicalTokens(text, aliases) {
  return _speechApplyAliases(_speechBaseTokens(text), speechBuildAliases(aliases));
}

/** Canonical spoken-form words. 'human-vetted!' gives [human, vetted]; '5mg' gives [5, milligrams]. */
function speechTokenize(text, aliases) {
  return speechCanonicalTokens(text, aliases).map((t) => t.text);
}

function _speechFusable(parts, whole) {
  if (parts.every((p) => _speechIsAlpha(p))) {
    // Letters spelled one by one ("a g") are NOT a fused word; that needs a confirmed alias.
    // A join may not swallow a negation: "no table" is not "notable" ("no thing" is "nothing").
    const negs = parts.filter((p) => _speechNegations.has(p)).length;
    return !parts.every((p) => _speechLen(p) === 1) && negs === (_speechNegations.has(whole) ? 1 : 0);
  }
  if (parts.length === 2 && parts.every((p) => _speechIsDigit(p))) {
    // years and prices read in pairs: "twenty twenty six" is 2026, "two forty-nine" is 249
    return _speechYearHeadRe.test(parts[0]) && _speechYearTailRe.test(parts[1]);
  }
  return false;
}

// Join 2-3 consecutive tokens whose exact concatenation is a token on the other side.
// A number written as a word joins by its spelling: "every one" is "everyone".
function _speechFuse(toks, other) {
  const out = [];
  let i = 0;
  while (i < toks.length) {
    let fused = false;
    for (const k of [3, 2]) {
      if (i + k > toks.length) continue;
      const win = toks.slice(i, i + k);
      let joined = null;
      const canon = win.map((t) => t.text);
      const spelled = win.map((t) => _speechSpelled(t) || t.text);
      for (const [pass, parts] of [canon, spelled].entries()) {
        const whole = parts.join('');
        if (!other.has(whole) || !_speechFusable(parts, whole)) continue;
        // "two forty-nine" is 249, but written digits never join: "2 20-minute" is not 220
        if (parts.every((p) => _speechIsDigit(p)) && !win.every((t) => _speechIsAlpha(_speechFirst(t.orig)))) continue;
        // a number word joins a word only with parts of 2+ letters: "g one" is not "gone"
        if (pass === 1 && !_speechSameList(parts, canon) && parts.some((p) => _speechLen(p) < 2)) continue;
        joined = whole;
        break;
      }
      if (joined) {
        out.push(_speechMerge(win, joined));
        i += k;
        fused = true;
        break;
      }
    }
    if (!fused) {
      out.push(toks[i]);
      i += 1;
    }
  }
  return out;
}

function _speechBrandPositions(sTexts, brandSeqs) {
  const pos = new Set();
  const mark = (from, to) => {
    for (let x = from; x < to; x++) pos.add(x);
  };
  for (const seq of brandSeqs) {
    const L = seq.length;
    for (let i = 0; i < sTexts.length - L + 1; i++) {
      if (_speechSameList(sTexts.slice(i, i + L), seq)) mark(i, i + L);
    }
    if (L === 1 && _speechIsAlpha(seq[0])) {
      // brand written split in the script: "Braxley Bands" for brand term Braxleybands
      for (const k of [2, 3]) {
        for (let i = 0; i < sTexts.length - k + 1; i++) {
          if (sTexts.slice(i, i + k).join('') === seq[0]) mark(i, i + k);
        }
      }
    }
  }
  return pos;
}

// "$9.99" read "nine ninety-nine" drops the currency word; cents still count.
const _speechCurrencyWords = new Set(['dollars', 'euros', 'pounds']);

// [severity, note, equivalent] for one differing span of the alignment.
function _speechClassify(tag, swT, hwT, brandHit, declared) {
  const sw = swT.map((x) => x.text);
  const hw = hwT.map((x) => x.text);
  const negs = (ws) => ws.filter((w) => _speechNegations.has(w)).length;
  if (negs(sw) !== negs(hw)) {
    return ['high', 'negation changed (not/never/no/without added or lost) \u{2014} the claim flips', false];
  }
  const sq = sw.filter((w) => _speechQuantityRe.test(w));
  const hq = hw.filter((w) => _speechQuantityRe.test(w));
  if (!_speechSameList(sq, hq)) {
    return ['high', 'number differs from the approved script \u{2014} a number is never a benign paraphrase', false];
  }
  // Units count only right after a quantity. Any unit added, dropped or changed is HIGH,
  // except a dropped or added dollars/euros/pounds alone ("$9.99" read "nine ninety-nine").
  const su = swT.filter((x) => x.unit).map((x) => x.text);
  const hu = hwT.filter((x) => x.unit).map((x) => x.text);
  if (!_speechSameList(su, hu) && ((su.length && hu.length) || [...su, ...hu].some((u) => !_speechCurrencyWords.has(u)))) {
    return ['high', 'unit differs from the approved script (added, dropped or changed)', false];
  }
  // Backward compatibility with callers that pass a brand term for the brand AND for each
  // word of its spoken form: a span of ONLY declared, alphabetic brand-term words on BOTH
  // sides that also sound alike (script "ak mee" vs heard "Acme") is the same brand.
  // Different declared names ("Hims" vs "Hers", "Body Pod" vs "Band") still fail.
  if (
    tag === 'replace' &&
    declared.size &&
    [...sw, ...hw].every((w) => declared.has(w) && _speechIsAlpha(w)) &&
    _speechCharSim(sw.join(''), hw.join('')) >= _speechBrandSwapMinCharSim
  ) {
    return ['low', 'declared brand terms on both sides (spoken form vs brand spelling) \u{2014} accepted', true];
  }
  if (brandHit) {
    return [
      'high',
      'brand name not heard as approved (mis-voiced or dropped) \u{2014} re-roll; if the audio is ' +
        'right and only the spelling differs, confirm the spoken form and pass it as an alias',
      false,
    ];
  }
  if (tag === 'replace') {
    if (sw.length === 1 && hw.length === 1) {
      const [a] = sw;
      const [b] = hw;
      const delta = _speechLen(a) - _speechLen(b);
      if ((delta < 0 ? -delta : delta) <= _speechMisvoiceMaxLenDelta && _speechCharSim(a, b) >= _speechMisvoiceMinCharSim) {
        return [
          'high',
          `audio likely mis-voices "${a}" as "${b}" (re-roll a new seed; if it is a ` +
            'brand token, spell it phonetically in the SPOKEN LINE)',
          false,
        ];
      }
    }
    return ['medium', 'spoken word differs from the approved script', false];
  }
  if (tag === 'delete') return ['medium', 'approved words not heard in the render', false];
  // Extra heard words are often benign (filler, a whisper tail); low severity.
  return ['low', 'extra words heard that are not in the script', false];
}

function _speechTermSeqs(terms, rules) {
  const seqs = [];
  for (const term of terms) {
    const seq = _speechApplyAliases(_speechBaseTokens(term), rules).map((x) => x.text);
    if (seq.length) {
      seqs.push(seq);
      if (seq.length > 1 && seq.every((w) => _speechIsAlpha(w))) seqs.push([seq.join('')]);
    }
  }
  return seqs;
}

function _speechIssue(kind, severity, scriptWords, heardWords, note, scriptText, heardText) {
  return {
    kind, // substitution | dropped | inserted | no_script
    severity, // high | medium | low
    script_words: scriptWords, // canonical tokens
    heard_words: heardWords, // canonical tokens
    note,
    script_text: scriptText, // original wording in the approved script
    heard_text: heardText, // original wording in the transcript
  };
}

/**
 * The verdict for an approved script vs the heard transcript. No I/O.
 *
 * options.min_ratio (or minRatio): similarity needed to pass (default 0.90).
 * options.brand_terms (or brandTerms): brand names. They are NEVER removed from the
 *   diff; a brand word not heard as approved is a HIGH failure. Fused/split spellings
 *   are equal, and a span made only of declared brand-term tokens on both sides is accepted.
 * options.aliases: confirmed spoken forms, e.g. {AG1: 'A G one'} or the
 *   read_pronunciations `pronunciations` list. Throws on a bad alias (see speechBuildAliases).
 *
 * Returns the Python Verdict as a plain object: {passed, ratio, issues, silent,
 * music_present, script_tokens, transcript_tokens, brand_terms, aliases}; each issue is
 * {kind, severity, script_words, heard_words, note, script_text, heard_text}.
 */
function speechReview(script, transcript, options) {
  const opts = options || {};
  const minRatio = opts.min_ratio ?? opts.minRatio ?? SPEECH_DEFAULT_MIN_RATIO;
  const brandOpt = opts.brand_terms ?? opts.brandTerms;
  const terms = _speechTruthy(brandOpt) ? _speechToList(brandOpt, 'brand_terms') : [];
  const aliases = opts.aliases;

  const rules = speechBuildAliases(aliases);
  const pairs = _speechAliasPairs(aliases);
  let sToks = _speechApplyAliases(_speechBaseTokens(script), rules);
  let tToks = _speechApplyAliases(_speechBaseTokens(transcript), rules);
  if (sToks.some((x) => x.text === '2nd')) {
    // the script writes the ordinal "2nd", so a plain "second" is that ordinal
    const second = (toks) => toks.map((x) => (x.text === 'second' ? _speechTok('2nd', x.orig, x.src) : x));
    sToks = second(sToks);
    tToks = second(tToks);
  }
  const sSet = new Set(sToks.map((x) => x.text));
  const tSet = new Set(tToks.map((x) => x.text));
  sToks = _speechFuse(sToks, tSet);
  tToks = _speechFuse(tToks, sSet);
  const s = sToks.map((x) => x.text);
  const t = tToks.map((x) => x.text);

  const brandPos = _speechBrandPositions(s, _speechTermSeqs([...terms, ...pairs.map((p) => p[0])], rules));
  const declared = new Set(_speechTermSeqs(terms, rules).flat());

  const v = {
    passed: false,
    ratio: 0.0,
    issues: [],
    silent: false,
    music_present: null,
    script_tokens: s.length,
    transcript_tokens: t.length,
    brand_terms: [...terms],
    aliases: pairs.map(([a, b]) => ({ term: a, say_as: b })),
  };

  if (!s.length) {
    // No script to compare against: cannot gate on drift, treat as an advisory pass.
    v.passed = true;
    v.ratio = 1.0;
    v.issues.push(_speechIssue('no_script', 'low', [], [], 'no approved script supplied; drift check skipped', '', ''));
    return v;
  }

  const blocks = _speechMatchingBlocks(s, t, false);
  let matched = 0;
  for (const block of blocks) matched += block[2];
  matched *= 2;

  const kinds = { replace: 'substitution', delete: 'dropped', insert: 'inserted' };
  for (const [tag, i1, i2, j1, j2] of _speechOpcodes(blocks)) {
    if (tag === 'equal') continue;
    let brandHit = false;
    for (let x = i1; x < i2; x++) if (brandPos.has(x)) brandHit = true;
    const [severity, note, equivalent] = _speechClassify(tag, sToks.slice(i1, i2), tToks.slice(j1, j2), brandHit, declared);
    if (equivalent) matched += i2 - i1 + (j2 - j1);
    v.issues.push(
      _speechIssue(
        kinds[tag],
        severity,
        s.slice(i1, i2),
        t.slice(j1, j2),
        note,
        _speechOrigText(sToks.slice(i1, i2)),
        _speechOrigText(tToks.slice(j1, j2)),
      ),
    );
  }

  v.ratio = matched / (s.length + t.length);
  const hasHigh = v.issues.some((i) => i.severity === 'high');
  v.passed = v.ratio >= minRatio && !hasHigh;
  return v;
}

// ---- Confirmed pronunciations ----

/** 'AG1=A G one' gives ['AG1', 'A G one']. Throws an Error named ValueError otherwise. */
function speechParseAlias(arg) {
  const s = arg || '';
  if (typeof s !== 'string') throw new TypeError('an alias argument must be a string');
  const at = s.indexOf('=');
  const term = at < 0 ? s : s.slice(0, at);
  const form = at < 0 ? '' : s.slice(at + 1);
  if (at < 0 || !_speechPyStrip(term) || !_speechPyStrip(form)) {
    throw _speechValueError(`--alias must look like "TERM=SPOKEN FORM", got: ${_speechRepr(arg)}`);
  }
  return [_speechPyStrip(term), _speechPyStrip(form)];
}

/**
 * The [term, say_as] pairs in already-parsed read_pronunciations.py output
 * ({brand_id, basis, pronunciations: [{term, say_as, fact_id}]}) or a
 * create-vo-elevenlabs brand-rules.json; a bare list also works.
 * Throws an Error named ValueError when the shape is wrong.
 */
function speechPronunciationPairs(json) {
  const rows = _speechIsDict(json) ? _speechDictGet(json, 'pronunciations') : json;
  if (!Array.isArray(rows)) throw _speechValueError("expected a JSON object with a 'pronunciations' list");
  const pairs = [];
  for (const row of rows) {
    const term = _speechIsDict(row) ? _speechDictGet(row, 'term') : undefined;
    const sayAs = _speechIsDict(row) ? _speechDictGet(row, 'say_as') : undefined;
    if (typeof term !== 'string' || typeof sayAs !== 'string') {
      throw _speechValueError("every pronunciation needs a 'term' and a 'say_as'");
    }
    pairs.push([term, sayAs]);
  }
  return pairs;
}

// ---- _lib/frames.mjs ----
// Pixel and sample measures on the finished cut for the check layer: the
// brand logo found on the end card by grayscale normalised correlation over a
// size search (review-finished-ad's logo check), picture motion (the
// logo-equation-card b-roll gate), and the sound rising where a message
// appears. ffmpeg decodes to raw files in tmpDir; the maths is plain JS.
// Every top-level name starts with `kit`.

const KIT_LOGO_FRAME_W = 120;

async function kitRaw(ctx, args, name, format = 'rawvideo') {
  const path = join(ctx.tmpDir, name);
  await kitFfmpeg(ctx, [...args, '-f', format, path]);
  return readFile(path);
}

/** One frame at `t` as 8-bit gray, `w` wide. */
async function kitGrayFrame(ctx, video, t, w, h) {
  const data = await kitRaw(ctx, ['-ss', kitNum(t), '-i', video, '-frames:v', '1', '-vf', `scale=${w}:${h}:flags=area,format=gray`, '-pix_fmt', 'gray'], `frame-${Math.round(t * 1000)}.raw`);
  return { w, h, data };
}

function kitResize(src, sw, sh, dw, dh) {
  const out = new Float64Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      // Area average of the source box this pixel covers.
      const x0 = (x * sw) / dw;
      const x1 = ((x + 1) * sw) / dw;
      const y0 = (y * sh) / dh;
      const y1 = ((y + 1) * sh) / dh;
      let sum = 0;
      let n = 0;
      for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++) {
        for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
          sum += src[yy * sw + xx];
          n++;
        }
      }
      out[y * dw + x] = n ? sum / n : 0;
    }
  }
  return out;
}

/** The best absolute normalised correlation of `tpl` (tw x th) anywhere in `img` (iw x ih). */
function kitBestNcc(img, iw, ih, tpl, tw, th) {
  const n = tw * th;
  let tMean = 0;
  for (let i = 0; i < n; i++) tMean += tpl[i];
  tMean /= n;
  const t = new Float64Array(n);
  let tNorm = 0;
  for (let i = 0; i < n; i++) {
    t[i] = tpl[i] - tMean;
    tNorm += t[i] * t[i];
  }
  if (tNorm < 1e-6) return 0;
  // Integral images of the frame and its square for each window's mean and spread.
  const W = iw + 1;
  const s1 = new Float64Array(W * (ih + 1));
  const s2 = new Float64Array(W * (ih + 1));
  for (let y = 0; y < ih; y++) {
    let r1 = 0;
    let r2 = 0;
    for (let x = 0; x < iw; x++) {
      const v = img[y * iw + x];
      r1 += v;
      r2 += v * v;
      s1[(y + 1) * W + x + 1] = s1[y * W + x + 1] + r1;
      s2[(y + 1) * W + x + 1] = s2[y * W + x + 1] + r2;
    }
  }
  let best = 0;
  for (let y = 0; y + th <= ih; y++) {
    for (let x = 0; x + tw <= iw; x++) {
      const a = y * W + x;
      const b = y * W + x + tw;
      const c = (y + th) * W + x;
      const d = (y + th) * W + x + tw;
      const sum = s1[d] - s1[b] - s1[c] + s1[a];
      const sq = s2[d] - s2[b] - s2[c] + s2[a];
      const varI = sq - (sum * sum) / n;
      if (varI < 1e-6) continue;
      let cross = 0;
      for (let ty = 0; ty < th; ty++) {
        const row = (y + ty) * iw + x;
        const trow = ty * tw;
        for (let tx = 0; tx < tw; tx++) cross += img[row + tx] * t[trow + tx];
      }
      const score = Math.abs(cross) / Math.sqrt(varI * tNorm);
      if (score > best) best = score;
    }
  }
  return best;
}

/**
 * How well the brand's logo file is found in the frames at `times`: the best
 * |NCC| over a size search (15 % to 60 % of the frame width). A logo with
 * transparency is matched by its shape (alpha), so a white mark on a dark card
 * counts; an opaque logo by its whole image.
 */
async function kitLogoScore(ctx, video, logo, times, frameW, frameH) {
  const lw = 160;
  const rgba = await kitRaw(ctx, ['-i', logo.path, '-frames:v', '1', '-vf', `scale=${lw}:-2:flags=area,format=rgba`, '-pix_fmt', 'rgba'], 'logo.raw');
  const lh = Math.floor(rgba.length / 4 / lw);
  if (lh < 2) return { score: 0, mode: 'image' };
  let transparent = 0;
  const gray = new Float64Array(lw * lh);
  const alpha = new Float64Array(lw * lh);
  for (let i = 0; i < lw * lh; i++) {
    const [r, g, b, a] = [rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], rgba[i * 4 + 3]];
    alpha[i] = a;
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    if (a < 250) transparent++;
  }
  const mode = transparent > lw * lh * 0.05 ? 'mark' : 'image';
  const tplSrc = mode === 'mark' ? alpha : gray;
  const iw = KIT_LOGO_FRAME_W;
  const ih = Math.max(2, Math.round((iw * frameH) / frameW / 2) * 2);
  let best = 0;
  for (const t of times) {
    const f = await kitGrayFrame(ctx, video, t, iw, ih);
    const img = Float64Array.from(f.data);
    for (let frac = 0.15; frac <= 0.6001; frac += 0.05) {
      const tw = Math.max(6, Math.round(frac * iw));
      const th = Math.max(4, Math.round((tw * lh) / lw));
      if (th >= ih) continue;
      const tpl = kitResize(tplSrc, lw, lh, tw, th);
      best = Math.max(best, kitBestNcc(img, iw, ih, tpl, tw, th));
    }
  }
  return { score: +best.toFixed(3), mode };
}

/**
 * Picture motion from 0 to `untilS`: the mean absolute frame-to-frame
 * difference on a 160 x 160 grayscale copy, over the half of the rows that
 * move most (so a still card above a moving band does not dilute the band).
 */
async function kitMotion(ctx, video, untilS) {
  const size = 160;
  const raw = await kitRaw(ctx, ['-i', video, '-t', kitNum(untilS), '-an', '-vf', `scale=${size}:${size}:flags=area,format=gray`, '-pix_fmt', 'gray'], 'motion.raw');
  const px = size * size;
  const frames = Math.floor(raw.length / px);
  if (frames < 2) return null;
  const rowTotals = new Float64Array(size);
  for (let f = 1; f < frames; f++) {
    for (let y = 0; y < size; y++) {
      let s = 0;
      for (let x = 0; x < size; x++) s += Math.abs(raw[f * px + y * size + x] - raw[(f - 1) * px + y * size + x]);
      rowTotals[y] += s;
    }
  }
  const sorted = [...rowTotals].sort((a, b) => b - a).slice(0, size / 2);
  const total = sorted.reduce((a, b) => a + b, 0);
  return +(total / ((size / 2) * size * (frames - 1))).toFixed(3);
}

/** RMS level (dB full scale) of the cut's sound in each [from, to] window. */
async function kitWindowLevels(ctx, video, windows) {
  const rate = 8000;
  const raw = await kitRaw(ctx, ['-i', video, '-vn', '-ac', '1', '-ar', String(rate), '-c:a', 'pcm_s16le'], 'sound.raw', 's16le').catch(() => null);
  const samples = raw ? new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2)) : new Int16Array(0);
  return windows.map(([from, to]) => {
    const a = Math.max(0, Math.floor(from * rate));
    const b = Math.min(samples.length, Math.ceil(to * rate));
    if (b <= a) return -Infinity;
    let sum = 0;
    for (let i = a; i < b; i++) sum += (samples[i] / 32768) ** 2;
    const rms = Math.sqrt(sum / (b - a));
    return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  });
}

// ---- check-layer/src/part.mjs ----
// check-layer: checks the finished cut and never changes it. One quality
// path for every video (review-finished-ad and review-ugc-render in
// JavaScript). The five checks our server runs on upload, with the same
// limits, so a local pass predicts the server's: plays (decodes end to end),
// length (inside the style's range, 0.5 s slack), size (the plan's aspect
// within 2 %, at least 720 px on the short side), sound (-14 LUFS within 2,
// when the cut must have sound) and captions (at least one timed caption with
// text inside the video). Then the local ones: black frames (over 0.3 s),
// frozen frames (an opening still over 1.5 s, or a held picture over 4 s
// before the end card), the end card the style ends on, and speech that
// matches the approved script (the cut's audio transcribed by fal Whisper
// for on-camera speech, the spoken lines compared for a voiceover).
// It returns the server's reasons shape too, for the one local fix.

const TARGET_LUFS = -14;
const LUFS_TOLERANCE = 2;
const LENGTH_SLACK_S = 0.5;
const ASPECT_TOLERANCE = 0.02;
const MIN_SHORT_SIDE_PX = 720;
const BLACK_MAX_S = 0.3;
const OPENING_STILL_MAX_S = 1.5;
const HELD_PICTURE_MAX_S = 4.0;
const SERVER = new Set(['plays', 'length', 'size', 'sound', 'captions']);
// review-finished-ad: the platform bands at 1080x1920, the logo match floors and the favicon guard.
const PLATFORM_TOP = 220;
const PLATFORM_BOTTOM = 400;
const PLATFORM_RIGHT = 140;
const LOGO_MARK_MIN = 0.75;
const LOGO_IMAGE_MIN = 0.7;
const MIN_LOGO_LONG_SIDE = 256;
const MIN_LOGO_AREA = 40000;
// logo-equation-card's measure_motion gate, and the rise a message's sound makes over the moment before it.
const FOOTAGE_MIN_MOTION = 1.5;
const SOUND_RISE_DB = 4;
const NUM = '-?\\d+(?:\\.\\d+)?(?:e-?\\d+)?';

function ratioOf(aspect) {
  const [w, h] = aspect.split(':').map(Number);
  return w / h;
}

function spans(log, key, duration) {
  const out = [];
  let start = null;
  for (const line of log.split('\n')) {
    const s = new RegExp(`${key}_start:\\s*(${NUM})`).exec(line);
    if (s) start = Number(s[1]);
    const e = new RegExp(`${key}_end:\\s*(${NUM})`).exec(line);
    if (e && start !== null) {
      out.push([start, Number(e[1])]);
      start = null;
    }
  }
  if (start !== null) out.push([start, duration]);
  return out;
}

async function measure(ctx, path) {
  let info;
  try {
    const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', path]);
    info = JSON.parse(stdout);
  } catch {
    return { plays: false, duration_s: null, width: null, height: null, has_audio: false };
  }
  const video = (info.streams || []).find((s) => s.codec_type === 'video');
  const hasAudio = (info.streams || []).some((s) => s.codec_type === 'audio');
  const duration = Number(info.format && info.format.duration);
  let plays = !!video;
  if (plays) {
    try {
      const { stderr } = await ctx.tools.exec('ffmpeg', ['-v', 'error', '-nostdin', '-i', path, '-f', 'null', '-']);
      plays = !stderr.trim();
    } catch {
      plays = false;
    }
  }
  return {
    plays,
    duration_s: Number.isFinite(duration) ? duration : null,
    width: video ? video.width : null,
    height: video ? video.height : null,
    has_audio: hasAudio,
  };
}

async function loudness(ctx, path) {
  try {
    const { stderr } = await ctx.tools.exec('ffmpeg', ['-hide_banner', '-nostats', '-nostdin', '-i', path, '-map', '0:a:0', '-af', 'ebur128', '-f', 'null', '-']);
    const m = /I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/.exec(stderr.slice(stderr.lastIndexOf('Summary:')));
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

/** Freeze and black spans from one decode of a small copy of the picture. */
async function analyse(ctx, path, duration) {
  const { stderr } = await kitFfmpeg(ctx, ['-nostats', '-i', path, '-an', '-vf', 'scale=270:-2,freezedetect=n=-60dB:d=1.0,blackdetect=d=0.2:pix_th=0.10', '-f', 'null', '-']);
  return { freezes: spans(stderr, 'freeze', duration), blacks: spans(stderr, 'black', duration) };
}

async function wordsRecord(words) {
  if (!words) return null;
  try {
    return JSON.parse(await readFile(words.path, 'utf8'));
  } catch {
    return null;
  }
}

/** Where captions may be: the timeline's caption zone, clear of the platform bands (scaled from 1080x1920). */
function safeZone(timeline, W, H) {
  const zone = { left: 0, top: (PLATFORM_TOP * H) / 1920, right: W - (PLATFORM_RIGHT * W) / 1080, bottom: H - (PLATFORM_BOTTOM * H) / 1920 };
  const c = (timeline.safe_zones || []).find((z) => z.use === 'captions');
  if (c) {
    zone.left = Math.max(zone.left, c.x);
    zone.top = Math.max(zone.top, c.y);
    zone.right = Math.min(zone.right, c.x + c.w);
    zone.bottom = Math.min(zone.bottom, c.y + c.h);
  }
  return zone;
}

async function cueCount(ctx, words, duration) {
  const record = await wordsRecord(words);
  if (!record) return 0;
  return (record.cues || []).filter(
    (c) => String(c.text || '').trim() && Number.isFinite(c.start_s) && Number.isFinite(c.end_s) && c.end_s > c.start_s && c.start_s < duration && c.end_s > 0,
  ).length;
}

function usableAliases(ctx, pronunciations) {
  const out = [];
  for (const p of pronunciations || []) {
    try {
      speechBuildAliases([[p.term, p.say_as]]);
      out.push([p.term, p.say_as]);
    } catch (e) {
      ctx.log.warn('pronunciation not used by the speech check', { term: p.term, reason: e.message });
    }
  }
  return out;
}

async function heardSpeech(ctx, video) {
  if (!ctx.line) throw ctx.error('needs_missing', 'the speech check needs the private line');
  await kitFfmpeg(ctx, ['-i', video.path, '-map', '0:a:0', '-ac', '1', ...ctx.tools.encodeArgs('aac'), join(ctx.tmpDir, 'speech.m4a')]);
  const audio = await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/speech.m4a`, 'audio');
  const result = await ctx.line.order({
    piece: 'transcribe',
    provider: 'fal',
    path: 'fal-ai/whisper',
    body: { audio_url: audio, task: 'transcribe', language: 'en', chunk_level: 'word' },
    results: [],
  });
  const json = result.json || {};
  if (typeof json.text === 'string' && json.text.trim()) return json.text;
  return (json.chunks || []).map((c) => String(c.text || '').trim()).filter(Boolean).join(' ');
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { video, timeline, expect } = inputs;
  const checks = [];
  const reasons = [];
  const add = (code, status, { message, expected, found, fix } = {}) => {
    const c = { code, status };
    if (found !== undefined) c.found = found;
    if (expected !== undefined) c.expected = expected;
    if (fix) c.fix = fix;
    checks.push(c);
    if (status === 'fail') {
      const r = { check: code, message };
      if (expected !== undefined) r.expected = expected;
      if (found !== undefined) r.found = String(found);
      reasons.push(r);
    }
  };

  const m = await measure(ctx, video.path);
  if (!m.plays) {
    add('plays', 'fail', { message: "The video doesn't play all the way through." });
    return kitCheckOutputs(ctx, manifest, { verdict: { pass: false, checks, reasons } });
  }
  add('plays', 'pass');
  const d = m.duration_s;

  const { min, max } = expect.duration_s;
  if (d === null || d < min - LENGTH_SLACK_S || d > max + LENGTH_SLACK_S) {
    add('length', 'fail', {
      message: d !== null && d < min ? 'The video is too short.' : 'The video is too long.',
      expected: `${min} to ${max} seconds`,
      found: d === null ? 'unknown' : `${d.toFixed(1)} seconds`,
    });
  } else add('length', 'pass', { found: `${d.toFixed(1)} seconds` });

  const ratio = ratioOf(expect.aspect);
  const shapeOk = m.width && m.height && Math.min(m.width, m.height) >= MIN_SHORT_SIDE_PX && Math.abs(m.width / m.height - ratio) / ratio <= ASPECT_TOLERANCE;
  if (!shapeOk) {
    add('size', 'fail', {
      message: "The picture isn't the shape or size this style makes.",
      expected: `${expect.aspect}, at least ${MIN_SHORT_SIDE_PX} pixels on the short side`,
      found: m.width && m.height ? `${m.width}x${m.height}` : 'no picture',
    });
  } else add('size', 'pass', { found: `${m.width}x${m.height}` });

  // Sound: a cut with speech must have it at -14 LUFS within 2. A silent cut with no speech planned is a
  // style whose music is optional with none chosen (audio-mix gives it a silent track): nothing to measure.
  const lufs = m.has_audio ? await loudness(ctx, video.path) : null;
  const silent = lufs === null || lufs <= -70;
  if (silent && expect.speech === 'none') add('sound', 'not_applicable', { found: m.has_audio ? 'silent' : 'no sound track' });
  else if (silent) {
    add('sound', 'fail', { message: 'The video has no sound.', expected: `${TARGET_LUFS} LUFS`, found: 'no sound', fix: { slot: 'sound' } });
  } else if (Math.abs(lufs - TARGET_LUFS) > LUFS_TOLERANCE) {
    add('sound', 'fail', {
      message: lufs < TARGET_LUFS ? 'The sound is too quiet.' : 'The sound is too loud.',
      expected: `${TARGET_LUFS} LUFS`,
      found: `${lufs.toFixed(1)} LUFS`,
      fix: { slot: 'sound' },
    });
  } else add('sound', 'pass', { found: `${lufs.toFixed(1)} LUFS` });

  if (!expect.captions) add('captions', 'not_applicable');
  else if ((await cueCount(ctx, inputs.words, d)) === 0) {
    add('captions', 'fail', { message: 'The captions are missing.', expected: 'captions for the spoken lines', found: 'none', fix: { slot: 'captions' } });
  } else add('captions', 'pass');

  const { freezes, blacks } = await analyse(ctx, video.path, d);
  const black = blacks.find(([s, e]) => e - s > BLACK_MAX_S);
  if (black) add('black_frames', 'fail', { message: `Black frames from ${black[0].toFixed(1)} to ${black[1].toFixed(1)} seconds.`, expected: `no black stretch over ${BLACK_MAX_S} s`, found: +(black[1] - black[0]).toFixed(2) });
  else add('black_frames', 'pass');

  const bodyEnd = timeline.end_card ? timeline.end_card.start_s : d;
  const opening = freezes.find(([s, e]) => s <= 0.3 && e - s > OPENING_STILL_MAX_S);
  const held = freezes.find(([s, e]) => s < bodyEnd && Math.min(e, bodyEnd) - s > HELD_PICTURE_MAX_S);
  if (opening) add('frozen_frames', 'fail', { message: `The opening picture is still for ${(opening[1] - opening[0]).toFixed(1)} seconds.`, expected: `the opening moves within ${OPENING_STILL_MAX_S} s`, found: +(opening[1] - opening[0]).toFixed(2) });
  else if (held) add('frozen_frames', 'fail', { message: `The picture is frozen from ${held[0].toFixed(1)} to ${held[1].toFixed(1)} seconds.`, expected: `no held picture over ${HELD_PICTURE_MAX_S} s before the end card`, found: +(Math.min(held[1], bodyEnd) - held[0]).toFixed(2) });
  else add('frozen_frames', 'pass');

  // The brand layer and the end-card and phone-chat parts mark the card they add; a frame page that
  // draws its own ending does not, and then there is nothing to measure here.
  const card = timeline.end_card;
  if (!expect.end_card || !card) add('end_card', 'not_applicable', card ? undefined : { found: expect.end_card ? 'not marked by any step' : undefined });
  else if (card.end_s - card.start_s >= 0.5 && Math.abs(card.end_s - d) <= 0.2) add('end_card', 'pass');
  else add('end_card', 'fail', { message: 'The video does not end on the brand end card.', expected: 'an end card of at least 0.5 s at the end', found: `${card.start_s}-${card.end_s} s`, fix: { slot: 'brand' } });

  // Captions inside the caption safe zone and clear of the platform controls (TikTok/Reels bands).
  const record = await wordsRecord(inputs.words);
  const boxes = record ? (record.cues || []).filter((c) => c.box) : [];
  if (!boxes.length) add('captions_safe_zone', 'not_applicable');
  else {
    const zone = safeZone(timeline, m.width, m.height);
    const out = boxes.find((c) => c.box.x < zone.left - 0.5 || c.box.y < zone.top - 0.5 || c.box.x + c.box.w > zone.right + 0.5 || c.box.y + c.box.h > zone.bottom + 0.5);
    if (out) add('captions_safe_zone', 'fail', { message: `The caption "${out.text}" leaves the safe zone.`, expected: `inside x ${Math.round(zone.left)}-${Math.round(zone.right)}, y ${Math.round(zone.top)}-${Math.round(zone.bottom)}`, found: `${Math.round(out.box.x)},${Math.round(out.box.y)} ${Math.round(out.box.w)}x${Math.round(out.box.h)}`, fix: { slot: 'captions' } });
    else add('captions_safe_zone', 'pass');
  }

  // The brand's real logo file on the end card (review-finished-ad's logo and favicon checks).
  let logoStatus = 'not_applicable';
  const logo = inputs.brand.logo;
  if (!logo || !expect.end_card) add('logo', 'not_applicable');
  else {
    const size = logo.width && logo.height ? logo : await ctx.tools.probe(logo.path);
    const long = Math.max(size.width || 0, size.height || 0);
    if (long < MIN_LOGO_LONG_SIDE || (size.width || 0) * (size.height || 0) < MIN_LOGO_AREA) {
      logoStatus = 'fail';
      add('logo', 'fail', { message: 'The logo file is favicon-sized and will be blurry.', expected: `at least ${MIN_LOGO_LONG_SIDE} px on the long side`, found: `${size.width}x${size.height}` });
    } else {
      const card = timeline.end_card;
      const times = card ? [card.start_s + (card.end_s - card.start_s) * 0.5, card.end_s - 0.2] : [d - 1.2, d - 0.6, d - 0.2];
      const { score, mode } = await kitLogoScore(ctx, video.path, logo, times.filter((t) => t > 0 && t < d), m.width, m.height);
      const floor = mode === 'mark' ? LOGO_MARK_MIN : LOGO_IMAGE_MIN;
      logoStatus = score >= floor ? 'pass' : 'fail';
      if (logoStatus === 'pass') add('logo', 'pass', { found: score });
      else add('logo', 'fail', { message: "The brand's logo is not found on the end card.", expected: `a match of at least ${floor}`, found: score, fix: { slot: 'brand' } });
    }
  }

  // The style's own checks (qc_flags). The ones a machine can measure are measured and count toward the
  // verdict; the rest (text legible, products visible) need eyes and are reported as not checked here.
  for (const flag of expect.qc_flags || []) {
    const code = `flag:${flag}`;
    if (flag === 'logo_visible') add(code, logoStatus, logoStatus === 'fail' ? { message: "The brand's logo is not visible.", expected: 'the logo on the end card', found: 'not found', fix: { slot: 'brand' } } : {});
    else if (flag === 'footage_moves') {
      const motion = await kitMotion(ctx, video.path, timeline.end_card ? timeline.end_card.start_s : d);
      if (motion === null) add(code, 'fail', { message: 'The footage could not be measured.', expected: `motion of at least ${FOOTAGE_MIN_MOTION}`, found: 'no frames' });
      else if (motion >= FOOTAGE_MIN_MOTION) add(code, 'pass', { found: motion });
      else add(code, 'fail', { message: 'The footage reads as a still photo.', expected: `motion of at least ${FOOTAGE_MIN_MOTION}`, found: motion });
    } else if (flag === 'sounds_match_messages') {
      const cardStart = timeline.end_card ? timeline.end_card.start_s : Infinity;
      const starts = (timeline.scenes || []).map((sc) => sc.start_s).filter((t) => t > 0.4 && t < cardStart - 0.1);
      if (!starts.length) add(code, 'not_applicable');
      else {
        const levels = await kitWindowLevels(ctx, video.path, starts.flatMap((t) => [[t, t + 0.25], [t - 0.35, t - 0.05]]));
        const silentAt = starts.find((t, i) => !(levels[2 * i] > -50 && levels[2 * i] - levels[2 * i + 1] >= SOUND_RISE_DB));
        if (silentAt === undefined) add(code, 'pass', { found: starts.length });
        else add(code, 'fail', { message: `No sound when the message at ${silentAt.toFixed(2)} s appears.`, expected: 'a sound with every message', found: `${silentAt.toFixed(2)} s` });
      }
    } else add(code, 'not_applicable', { found: 'needs eyes; not checked by machine' });
  }

  const script = (expect.script || []).map((s) => String(s).trim()).filter(Boolean);
  if (!script.length || expect.speech === 'none') add('speech_matches_script', 'not_applicable');
  else {
    const heard = expect.speech === 'on_camera' ? await heardSpeech(ctx, video) : (timeline.speech || []).map((s) => s.text).join(' ');
    const verdict = speechReview(script.join(' '), heard, { aliases: usableAliases(ctx, inputs.brand.pronunciations) });
    const worst = verdict.issues.find((i) => i.severity === 'high') || verdict.issues.find((i) => i.severity !== 'low');
    if (verdict.passed) add('speech_matches_script', 'pass', { found: +verdict.ratio.toFixed(3) });
    else {
      add('speech_matches_script', 'fail', {
        message: worst ? `The speech differs from the approved script: ${worst.note}` : 'The speech differs from the approved script.',
        expected: 'the approved lines, as written',
        found: +verdict.ratio.toFixed(3),
      });
    }
  }

  const pass = checks.every((c) => c.status !== 'fail');
  ctx.log.info('check layer verdict', { pass, failed: checks.filter((c) => c.status === 'fail').map((c) => c.code), server_failed: reasons.filter((r) => SERVER.has(r.check)).length });
  return kitCheckOutputs(ctx, manifest, { verdict: { pass, checks, reasons } });
}
