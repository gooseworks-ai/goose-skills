// Built from check-layer/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
import { readFile, rm } from 'node:fs/promises';
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
    'ebur128=peak=true:framelog=verbose',
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
  const ok = (n) => /^[a-z0-9][a-z0-9_-]{0,47}$/.test(n) && !(used && used.has(n));
  let name = base ? `${prefix}-${base}` : `${prefix}-${index + 1}`;
  if (!ok(name)) name = `${prefix}-${index + 1}`;
  // The fallback can collide too (ids "2" and none both give line-2): add a counter until it is unique.
  for (let n = 2; !ok(name); n++) name = `${prefix}-${index + 1}-${n}`;
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
// brand logo found by grayscale normalised correlation over a size search
// (review-finished-ad's logo check), on the whole frame or inside the box a
// step declared for it, picture motion (the logo-equation-card b-roll gate),
// and the sound rising where a message appears. ffmpeg decodes to raw files in
// tmpDir; the maths is plain JS. Every top-level name starts with `kit`.

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

/**
 * kitBestNcc over only the template pixels where `mask` is set: a badge's artwork is compared, not the
 * outline it shares with every other badge of its shape.
 */
function kitBestMaskedNcc(img, iw, ih, tpl, mask, tw, th) {
  const idx = [];
  for (let i = 0; i < tw * th; i++) if (mask[i] >= 128) idx.push(i);
  const n = idx.length;
  if (n < 16) return { score: 0, x: 0, y: 0 };
  let tMean = 0;
  for (const i of idx) tMean += tpl[i];
  tMean /= n;
  const t = new Float64Array(n);
  const off = new Int32Array(n);
  let tNorm = 0;
  idx.forEach((i, j) => {
    t[j] = tpl[i] - tMean;
    tNorm += t[j] * t[j];
    off[j] = Math.floor(i / tw) * iw + (i % tw);
  });
  if (tNorm < 1e-6) return { score: 0, x: 0, y: 0 };
  let best = { score: 0, x: 0, y: 0 };
  for (let y = 0; y + th <= ih; y++) {
    for (let x = 0; x + tw <= iw; x++) {
      const base = y * iw + x;
      let sum = 0;
      let sq = 0;
      let cross = 0;
      for (let j = 0; j < n; j++) {
        const v = img[base + off[j]];
        sum += v;
        sq += v * v;
        cross += v * t[j];
      }
      const varI = sq - (sum * sum) / n;
      if (varI < 1e-6) continue;
      const score = Math.abs(cross) / Math.sqrt(varI * tNorm);
      if (score > best.score) best = { score, x, y };
    }
  }
  return best;
}

/** The best absolute normalised correlation of `tpl` (tw x th) anywhere in `img` (iw x ih), and where. */
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
  if (tNorm < 1e-6) return { score: 0, x: 0, y: 0 };
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
  let best = { score: 0, x: 0, y: 0 };
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
      if (score > best.score) best = { score, x, y };
    }
  }
  return best;
}

/**
 * The logo file as a matching template, `lw` wide: a logo with transparency
 * is matched by its shape (alpha), so a white mark on a dark card counts; an
 * opaque logo by its whole image.
 */
async function kitLogoTemplate(ctx, logo, lw) {
  const rgba = await kitRaw(ctx, ['-i', logo.path, '-frames:v', '1', '-vf', `scale=${lw}:-2:flags=area,format=rgba`, '-pix_fmt', 'rgba'], `logo-${lw}.raw`);
  const lh = Math.floor(rgba.length / 4 / lw);
  if (lh < 2) return null;
  let transparent = 0;
  const gray = new Float64Array(lw * lh);
  const alpha = new Float64Array(lw * lh);
  const onWhite = new Float64Array(lw * lh);
  const onBlack = new Float64Array(lw * lh);
  for (let i = 0; i < lw * lh; i++) {
    const [r, g, b, a] = [rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], rgba[i * 4 + 3]];
    alpha[i] = a;
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    onBlack[i] = (gray[i] * a) / 255;
    onWhite[i] = onBlack[i] + 255 - a;
    if (a < 250) transparent++;
  }
  const mode = transparent > lw * lh * 0.05 ? 'mark' : 'image';
  // A logo with transparency is matched by its shape, and then by its picture laid on white and on black:
  // a shape alone misses a logo whose own drawing (a letter on a tile) is what shows. Whether the shape tells
  // is judged inside the drawn part, past any clear padding: a badge or a tile with round corners is mostly
  // opaque there, has no telling shape, and only its picture counts.
  let [bx0, by0, bx1, by1] = [lw, lh, -1, -1];
  for (let y = 0; y < lh; y++) {
    for (let x = 0; x < lw; x++) {
      if (alpha[y * lw + x] < 16) continue;
      [bx0, by0, bx1, by1] = [Math.min(bx0, x), Math.min(by0, y), Math.max(bx1, x), Math.max(by1, y)];
    }
  }
  let clear = 0;
  for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) if (alpha[y * lw + x] < 250) clear++;
  const drawn = Math.max(1, (bx1 - bx0 + 1) * (by1 - by0 + 1));
  const shaped = bx1 >= bx0 && clear > drawn * 0.25;
  // A mostly opaque logo (a badge, a tile) is matched on its artwork inside its own outline.
  const sources = mode === 'image' ? [{ tpl: gray }] : shaped ? [{ tpl: alpha }, { tpl: onWhite }, { tpl: onBlack }] : [{ tpl: gray, mask: alpha }];
  return { mode, src: sources[0].mask ? onWhite : sources[0].tpl, sources, lw, lh };
}

/**
 * How well the brand's logo file is found in the frames at `times`: the best
 * |NCC| over a size search (15 % to 60 % of the frame width) on a 120 px wide
 * copy of the whole frame. `box` is where the best match sits, in the video's
 * pixels.
 */
async function kitLogoScore(ctx, video, logo, times, frameW, frameH) {
  const template = await kitLogoTemplate(ctx, logo, 160);
  if (!template) return { score: 0, mode: 'image', box: null };
  const { mode, src: tplSrc, lw, lh } = template;
  const iw = KIT_LOGO_FRAME_W;
  const ih = Math.max(2, Math.round((iw * frameH) / frameW / 2) * 2);
  let best = { score: 0, box: null };
  const k = frameW / iw;
  for (const t of times) {
    const f = await kitGrayFrame(ctx, video, t, iw, ih);
    const img = Float64Array.from(f.data);
    for (let frac = 0.15; frac <= 0.6001; frac += 0.05) {
      const tw = Math.max(6, Math.round(frac * iw));
      const th = Math.max(4, Math.round((tw * lh) / lw));
      if (th >= ih) continue;
      const tpl = kitResize(tplSrc, lw, lh, tw, th);
      const m = kitBestNcc(img, iw, ih, tpl, tw, th);
      if (m.score > best.score) best = { score: m.score, t, box: { x: Math.round(m.x * k), y: Math.round(m.y * k), w: Math.round(tw * k), h: Math.round(th * k) } };
    }
  }
  return { score: +best.score.toFixed(3), mode, box: best.box, t: best.t };
}

/** `src` (w x h) turned by `deg` about its centre, same size; corners from outside take `fill`. */
function kitRotate(src, w, h, deg, fill) {
  const a = (deg * Math.PI) / 180;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  const [cx, cy] = [(w - 1) / 2, (h - 1) / 2];
  const out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = c * (x - cx) + s * (y - cy) + cx;
      const sy = -s * (x - cx) + c * (y - cy) + cy;
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      if (x0 < 0 || y0 < 0 || x0 + 1 >= w || y0 + 1 >= h) {
        out[y * w + x] = fill;
        continue;
      }
      const fx = sx - x0;
      const fy = sy - y0;
      const i = y0 * w + x0;
      out[y * w + x] = (src[i] * (1 - fx) + src[i + 1] * fx) * (1 - fy) + (src[i + w] * (1 - fx) + src[i + w + 1] * fx) * fy;
    }
  }
  return out;
}

// Inside a declared box the match runs on the box itself, its long side at most this many pixels.
const KIT_LOGO_BOX_LONG = 200;
// Template sizes against the logo fitted to the box, and the turns tried at the closest few
// (a card drawn at a slight angle carries its logo with it).
// The box is where a step drew the logo, so the logo spans most of it: at least 40 % of the box's long side.
// A smaller template (a few pixels) correlates with any corner of the picture, the wrong logo's included.
const KIT_LOGO_BOX_SCALES = [1.06, 1, 0.94, 0.88, 0.82, 0.76, 0.7, 0.62, 0.55, 0.48, 0.4, 0.33];
const KIT_LOGO_BOX_MIN_SPAN = 0.4;
const KIT_LOGO_BOX_MIN_PX = 12;
const KIT_LOGO_BOX_ANGLES = [-1.5, 1.5, -3, 3, -5, 5];
const KIT_LOGO_GOOD = 0.92;

/**
 * How well the brand's logo file is found inside `zone` (the box a step
 * declared for the logo it drew, in the video's pixels) in the frames at
 * `times`: the box plus a margin is cut from the full-resolution frame, and
 * the logo is matched there over sizes up to the box and small turns, so a
 * logo drawn small, in a badge or on a tilted card is still measured.
 */
async function kitLogoScoreInBox(ctx, video, logo, times, frameW, frameH, zone) {
  const template = await kitLogoTemplate(ctx, logo, 480);
  if (!template) return { score: 0, mode: 'image', box: null };
  const { mode, sources, lw, lh } = template;
  const margin = Math.max(6, Math.round(0.08 * Math.max(zone.w, zone.h)));
  const x0 = Math.max(0, Math.floor(zone.x - margin));
  const y0 = Math.max(0, Math.floor(zone.y - margin));
  const x1 = Math.min(frameW, Math.ceil(zone.x + zone.w + margin));
  const y1 = Math.min(frameH, Math.ceil(zone.y + zone.h + margin));
  if (x1 - x0 < 8 || y1 - y0 < 8) return { score: 0, mode, box: null };
  const k = Math.min(1, KIT_LOGO_BOX_LONG / Math.max(x1 - x0, y1 - y0));
  const iw = Math.max(8, Math.round((x1 - x0) * k));
  const ih = Math.max(8, Math.round((y1 - y0) * k));
  // The logo fitted inside the box (as object-fit: contain draws it), in the copy's pixels.
  const fit = Math.min(zone.w / lw, zone.h / lh) * k;
  const sizes = KIT_LOGO_BOX_SCALES.map((f) => [Math.round(lw * fit * f), Math.round(lh * fit * f)]).filter(([tw, th]) => Math.min(tw, th) >= KIT_LOGO_BOX_MIN_PX && Math.max(tw, th) >= KIT_LOGO_BOX_MIN_SPAN * Math.max(zone.w, zone.h) * k && tw <= iw && th <= ih);
  const frames = [];
  for (const t of times) {
    const raw = await kitRaw(ctx, ['-ss', kitNum(t), '-i', video, '-frames:v', '1', '-vf', `crop=${x1 - x0}:${y1 - y0}:${x0}:${y0},scale=${iw}:${ih}:flags=area,format=gray`, '-pix_fmt', 'gray'], `zone-${Math.round(t * 1000)}.raw`);
    frames.push({ t, img: Float64Array.from(raw) });
  }
  let best = { score: 0, box: null };
  for (const { tpl: tplSrc, mask: maskSrc } of sources) {
    // A turned template's corners take the template's own edge (nothing, for a shape), and no mask.
    let fill = 0;
    for (let x = 0; x < lw; x++) fill += tplSrc[x] + tplSrc[(lh - 1) * lw + x];
    fill /= 2 * lw;
    const templates = new Map();
    const tplAt = (tw, th, deg) => {
      const key = `${tw}x${th}@${deg}`;
      if (!templates.has(key)) {
        const tpl = kitRotate(kitResize(tplSrc, lw, lh, tw, th), tw, th, deg, fill);
        templates.set(key, { tpl, mask: maskSrc ? kitRotate(kitResize(maskSrc, lw, lh, tw, th), tw, th, deg, 0) : null });
      }
      return templates.get(key);
    };
    const at = (img, t, tw, th, deg) => {
      const { tpl, mask } = tplAt(tw, th, deg);
      const m = mask ? kitBestMaskedNcc(img, iw, ih, tpl, mask, tw, th) : kitBestNcc(img, iw, ih, tpl, tw, th);
      if (m.score > best.score) {
        best = { score: m.score, t, angle: deg, box: { x: Math.round(x0 + m.x / k), y: Math.round(y0 + m.y / k), w: Math.round(tw / k), h: Math.round(th / k) } };
      }
      return m.score;
    };
    for (const { t, img } of frames) {
      const scored = sizes.map(([tw, th]) => ({ tw, th, score: at(img, t, tw, th, 0) }));
      if (best.score >= KIT_LOGO_GOOD) break;
      // Small turns at the three sizes that came closest.
      for (const { tw, th } of scored.sort((a, b) => b.score - a.score).slice(0, 3)) for (const deg of KIT_LOGO_BOX_ANGLES) at(img, t, tw, th, deg);
      if (best.score >= KIT_LOGO_GOOD) break;
    }
    if (best.score >= KIT_LOGO_GOOD) break;
  }
  return { score: +best.score.toFixed(3), mode, box: best.box, t: best.t, angle: best.angle };
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

// ---- check-layer/src/flags.mjs ----
// The check layer's 1.3.0 style flags, measured on the finished cut and its
// timeline: text_led (blank frames, not dark ones, review-finished-ad's
// silent-text profile), read_rate, cuts_between_words, cut_rate and the
// window retained_body limits the content checks to. Pure maths apart from
// chkBlankFrames, which decodes small RGB frames into tmpDir. Every top-level
// name starts with `chk` (bundled modules share one namespace).

// review-finished-ad's silent-text bounds: one blank beat between two text beats, a blank opening or
// ending keeps the black-frame bound, and all blank time together stays under a quarter of the picture.
const CHK_BLANK_INTERIOR_MAX_S = 1.0;
const CHK_BLANK_EDGE_MAX_S = 0.3;
const CHK_BLANK_MAX_SHARE = 0.25;
const CHK_BLANK_FPS = 10;
// Frames are area-averaged to this width, so light grain does not read as text.
const CHK_BLANK_WIDTH = 270;
// A pixel this far (max RGB channel) from the dominant colour is content; a frame with text has content
// on at least 1.5 % of its rows (a thin progress bar or codec noise does not).
const CHK_BLANK_PIXEL_DELTA = 48;
const CHK_BLANK_MIN_CONTENT_ROWS = 0.015;
// Decoded in windows so a long cut never writes one large raw file.
const CHK_BLANK_CHUNK_S = 10;

const CHK_READ_MIN_WPS = 2.1;
const CHK_READ_MAX_WPS = 3.1;
const CHK_CUT_MIN_RATE = 0.5;
const CHK_CUT_MAX_RATE = 0.7;
// A cut this close to a word's edge is on the edge, not inside the word (word timings are not frame exact).
const CHK_WORD_EDGE_S = 0.01;
// Scene starts this close to 0 or to the end of the body are not cuts.
const CHK_CUT_EDGE_S = 0.05;

// sounds_match_messages (1.4.2): a message's sound is its loudest 50 ms from just before the message shows
// to 0.3 s after, set against the bed, the median 50 ms of the quiet before it. A short pop over a 0.25 s
// mean, or a mean before it that holds typing clicks, read under 4 dB once a limiter levelled the cut.
const CHK_MSG_SLICE_S = 0.05;
const CHK_MSG_HOP_S = 0.01;
const CHK_MSG_CUE = [-0.05, 0.3];
const CHK_MSG_BED = [-0.6, -0.05];
// The opening, or a message straight after others, has too little quiet before it: the quiet after its cue.
const CHK_MSG_BED_AFTER = [0.3, 0.85];
// 0.15 s of quiet: with fewer slices than this a stretch is no bed.
const CHK_MSG_BED_MIN = 11;
const CHK_MSG_RISE_DB = 8;

function chkSlices(from, to) {
  const out = [];
  const start = Math.max(0, from);
  for (let i = 0; start + i * CHK_MSG_HOP_S + CHK_MSG_SLICE_S <= to + 1e-9; i++) {
    const a = start + i * CHK_MSG_HOP_S;
    out.push([a, a + CHK_MSG_SLICE_S]);
  }
  return out;
}

/** The parts of [from, to] outside every span in `cuts`. */
function chkOutside(from, to, cuts) {
  let spans = from < to ? [[from, to]] : [];
  for (const [a, b] of cuts) spans = spans.flatMap(([s, e]) => (b <= s || a >= e ? [[s, e]] : [[s, Math.min(e, a)], [Math.max(s, b), e]].filter(([x, y]) => y > x)));
  return spans;
}

/**
 * The slices each message is judged on: `starts` are the message arrivals in order (distinct), `end` where
 * the judged content stops (the end card, or the kept body). A cue runs from just before its message to 0.3 s
 * after, but never into the next one's (two messages closer than 0.1 s split the time between them) and never
 * past `end`; one shorter than 50 ms is one slice. The bed is the quiet before the message, outside every
 * message's cue span (0.05 s before it to 0.3 s after), so an earlier sound never raises it; with too little
 * of that, the quiet after the cue; with too little of either, all the quiet before `end`.
 */
function chkMessageWindows(starts, end) {
  const cues = starts.map((t) => [t + CHK_MSG_CUE[0], t + CHK_MSG_CUE[1]]);
  const quiet = (from, to) => chkOutside(Math.max(0, from), Math.min(to, end), cues).flatMap(([a, b]) => chkSlices(a, b));
  const split = (i) => Math.max(starts[i + 1] + CHK_MSG_CUE[0], (starts[i] + starts[i + 1]) / 2);
  let whole = null;
  return starts.map((t, i) => {
    const from = Math.max(0, t + CHK_MSG_CUE[0], i > 0 ? split(i - 1) : 0);
    const to = Math.min(t + CHK_MSG_CUE[1], i + 1 < starts.length ? split(i) : Infinity, end);
    const cue = to - from >= CHK_MSG_SLICE_S - 1e-9 ? chkSlices(from, to) : to > from ? [[from, to]] : [];
    const before = quiet(t + CHK_MSG_BED[0], t + CHK_MSG_BED[1]);
    const after = before.length >= CHK_MSG_BED_MIN ? null : quiet(t + CHK_MSG_BED_AFTER[0], t + CHK_MSG_BED_AFTER[1]);
    const bed = !after ? before : after.length >= CHK_MSG_BED_MIN ? after : (whole ??= quiet(0, end));
    return { cue, bed };
  });
}

/** The cue's loudest slice, the bed's median slice (dBFS) and how far the cue rises over the bed. */
function chkMessageRise(cueLevels, bedLevels) {
  const cue = cueLevels.length ? Math.max(...cueLevels) : -Infinity;
  const sorted = [...bedLevels].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  const bed = !sorted.length ? -Infinity : sorted.length % 2 ? sorted[mid] : sorted[mid - 1] === sorted[mid] ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { cue, bed, rise: bed === -Infinity ? (cue === -Infinity ? -Infinity : Infinity) : cue - bed };
}

/** Share of a frame's rows that hold content: pixels clearly off the frame's dominant colour. */
function chkContentShare(rgb, w, h) {
  const counts = new Uint32Array(4096);
  const px = w * h;
  for (let i = 0; i < px; i++) counts[((rgb[3 * i] >> 4) << 8) | ((rgb[3 * i + 1] >> 4) << 4) | (rgb[3 * i + 2] >> 4)]++;
  let dominant = 0;
  for (let k = 1; k < 4096; k++) if (counts[k] > counts[dominant]) dominant = k;
  const bg = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < px; i++) {
    const key = ((rgb[3 * i] >> 4) << 8) | ((rgb[3 * i + 1] >> 4) << 4) | (rgb[3 * i + 2] >> 4);
    if (key !== dominant) continue;
    bg[0] += rgb[3 * i];
    bg[1] += rgb[3 * i + 1];
    bg[2] += rgb[3 * i + 2];
    n++;
  }
  for (let c = 0; c < 3; c++) bg[c] /= Math.max(1, n);
  let rows = 0;
  for (let y = 0; y < h; y++) {
    let off = 0;
    for (let x = 0; x < w && off < 2; x++) {
      const i = y * w + x;
      const d = Math.max(Math.abs(rgb[3 * i] - bg[0]), Math.abs(rgb[3 * i + 1] - bg[1]), Math.abs(rgb[3 * i + 2] - bg[2]));
      if (d > CHK_BLANK_PIXEL_DELTA) off++;
    }
    if (off >= 2) rows++;
  }
  return rows / h;
}

/** Whether each frame from 0 to `untilS`, sampled at CHK_BLANK_FPS, is blank (black or one flat colour, no text). */
async function chkBlankFrames(ctx, video, width, height, untilS) {
  const w = CHK_BLANK_WIDTH;
  const h = Math.max(2, Math.round((w * height) / width / 2) * 2);
  const size = w * h * 3;
  const blank = [];
  for (let k = 0; k * CHK_BLANK_CHUNK_S < untilS - 1e-6; k++) {
    const from = k * CHK_BLANK_CHUNK_S;
    const want = Math.round(Math.min(CHK_BLANK_CHUNK_S, untilS - from) * CHK_BLANK_FPS);
    if (want < 1) break;
    const path = join(ctx.tmpDir, `blank-${k}.raw`);
    await kitFfmpeg(ctx, ['-ss', kitNum(from), '-i', video, '-an', '-vf', `fps=${CHK_BLANK_FPS},scale=${w}:${h}:flags=area,format=rgb24`, '-frames:v', String(want), '-pix_fmt', 'rgb24', '-f', 'rawvideo', path]);
    const raw = await readFile(path);
    await rm(path, { force: true });
    for (let i = 0; i + size <= raw.length; i += size) blank.push(chkContentShare(raw.subarray(i, i + size), w, h) < CHK_BLANK_MIN_CONTENT_ROWS);
  }
  return blank;
}

/** Blank stretches [start, end] in seconds from per-frame blank flags. */
function chkBlankSpans(blank, fps = CHK_BLANK_FPS) {
  const out = [];
  let start = null;
  [...blank, false].forEach((b, i) => {
    if (b && start === null) start = i;
    else if (!b && start !== null) {
      out.push([start / fps, i / fps]);
      start = null;
    }
  });
  return out;
}

/**
 * The text-led judgement of blank stretches: `span` is the first one over its bound (a blank opening or
 * ending 0.3 s, one between text beats 1.0 s), `share` the blank share of the sampled picture, `whole`
 * whether every frame is blank.
 */
function chkJudgeBlank(spans, samples, fps = CHK_BLANK_FPS) {
  const end = samples / fps;
  let span = null;
  for (const [s, e] of spans) {
    const edge = s <= 1e-6 ? 'opening' : e >= end - 1e-6 ? 'ending' : null;
    const limit = edge ? CHK_BLANK_EDGE_MAX_S : CHK_BLANK_INTERIOR_MAX_S;
    if (e - s > limit + 1e-6) {
      span = { start_s: s, end_s: e, limit, where: edge ? `at the ${edge}` : 'between text beats' };
      break;
    }
  }
  const total = spans.reduce((a, [s, e]) => a + (e - s), 0);
  return { span, total_s: total, picture_s: end, share: end > 0 ? total / end : 0, whole: samples > 0 && Math.round(total * fps) >= samples };
}

/** Spans clipped to [0, until]; spans that start at or after `until` are dropped. */
function chkClipSpans(spans, until) {
  return spans.filter(([s]) => s < until).map(([s, e]) => [s, Math.min(e, until)]);
}

function chkCountWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/**
 * Spoken words per second over the timeline's speech entries that start before `until`: each entry's
 * word timings when it has them, else the words of what was said (`spoken`, else `text`), over the time
 * the entries cover (overlapping entries counted once). Null when there is no speech to measure.
 */
function chkReadRate(speech, until = Infinity) {
  let words = 0;
  const spans = [];
  for (const s of speech || []) {
    if (!(s.start_s < until) || !(s.end_s > s.start_s)) continue;
    const n = (s.words || []).length || chkCountWords(typeof s.spoken === 'string' ? s.spoken : s.text);
    if (!n) continue;
    words += n;
    spans.push([s.start_s, Math.min(s.end_s, until)]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  let seconds = 0;
  let cur = null;
  for (const [a, b] of spans) {
    if (cur && a <= cur[1]) cur[1] = Math.max(cur[1], b);
    else {
      if (cur) seconds += cur[1] - cur[0];
      cur = [a, b];
    }
  }
  if (cur) seconds += cur[1] - cur[0];
  if (!words || !(seconds > 0)) return null;
  return { words, seconds, wps: words / seconds };
}

/**
 * The speech said before `until`: entries that end by then as they are; an entry running past it cut to
 * its timed words before `until` (what was said rebuilt from them). An entry running past it with no word
 * timings cannot be split: it is left out and `crossing` is set.
 */
function chkSpeechBefore(speech, until) {
  const out = [];
  let crossing = false;
  for (const s of speech || []) {
    if (!(s.start_s < until)) continue;
    if (!(s.end_s > until)) out.push(s);
    else if ((s.words || []).length) {
      const words = s.words.filter((w) => w.start_s < until);
      if (!words.length) continue;
      const said = words.map((w) => w.text).join(' ');
      out.push({ ...s, text: said, spoken: said, end_s: until, words });
    } else crossing = true;
  }
  return { speech: out, crossing };
}

/** The scene cuts inside the body: every scene start after 0 and before `bodyEnd`, once each. */
function chkCuts(scenes, bodyEnd) {
  const out = [];
  for (const sc of scenes || []) {
    const t = sc.start_s;
    if (t > CHK_CUT_EDGE_S && t < bodyEnd - CHK_CUT_EDGE_S && !out.some((u) => Math.abs(u - t) < 1e-3)) out.push(t);
  }
  return out.sort((a, b) => a - b);
}

/** The first cut that falls strictly inside a word ({t, word}), or null. */
function chkCutInsideWord(cuts, words) {
  for (const t of cuts) {
    const word = (words || []).find((w) => w.start_s + CHK_WORD_EDGE_S < t && t < w.end_s - CHK_WORD_EDGE_S);
    if (word) return { t, word };
  }
  return null;
}

// ---- check-layer/src/lines.mjs ----
// The speech check line by line (1.4.3). The whole script can clear its 0.90 bar with a clause lost
// where two takes join (about one word in ten), because a dropped run of words only counts through the
// ratio. So each spoken line is also compared with its own written words, and a phrase the whole script
// lost fails however long the script is. Pure: no I/O. Every top-level name starts with `chk` (bundled
// modules share one namespace).

// A line that loses this many words in a row, or this many more than it heard at its end, fails.
const CHK_LINE_LOST_WORDS = 2;
// The whole script losing this many words in a row fails, whatever its ratio.
const CHK_SCRIPT_LOST_WORDS = 3;

/** Whether `run` sits in `words` as a contiguous run of whole tokens. */
function chkHasRun(words, run) {
  for (let i = 0; i + run.length <= words.length; i++) {
    if (run.every((t, k) => words[i + k] === t)) return true;
  }
  return false;
}

function chkStartsWith(words, run) {
  return run.length <= words.length && run.every((t, k) => words[k] === t);
}

function chkEndsWith(words, run) {
  return run.length <= words.length && run.every((t, k) => words[words.length - run.length + k] === t);
}

/** The run of a review's issues that lost words: {words, text} for each, in order. */
function chkLostRuns(verdict, scriptWords, min) {
  const out = [];
  const withScript = verdict.issues.filter((i) => i.script_words.length);
  const last = withScript.at(-1);
  for (const i of withScript) {
    if (i.kind === 'dropped' && i.script_words.length >= min) out.push({ words: i.script_words, text: i.script_text });
    else if (i === last && i.kind === 'substitution' && i.script_words.length - i.heard_words.length >= min && chkEndsWith(scriptWords, i.script_words)) {
      // The line's end was said as fewer, different words: its last words are lost.
      out.push({ words: i.script_words, text: i.script_text });
    }
  }
  return out;
}

/**
 * The first spoken line that lost words: {index, scene_id, line, text, occurrence} or null, `index` its place
 * among the lines that name a scene and `occurrence` how many lines before it have the same words. A line is compared with what was heard for it (`spoken`) when it names its scene
 * and words were placed with it; a line with none placed (the transcriber could not match it, so its words
 * went to a later line) is left to the whole-script checks. A run lost from a line's start that the nearest
 * heard line before it ends with, or from its end that the nearest heard line after it starts with, was only
 * placed with the wrong line, so it does not count; a run lost from the middle always counts.
 */
function chkLineLoss(speech, aliases) {
  const named = (speech || []).filter((s) => s && s.scene_id != null && String(s.text || '').trim());
  const heard = named.map((s) => (typeof s.spoken === 'string' ? speechTokenize(s.spoken, aliases) : null));
  const near = (n, step) => {
    for (let k = n + step; k >= 0 && k < named.length; k += step) if (heard[k] && heard[k].length) return heard[k];
    return [];
  };
  for (const [n, e] of named.entries()) {
    if (!heard[n] || !heard[n].length) continue;
    const words = speechTokenize(e.text, aliases);
    const verdict = speechReview(e.text, e.spoken, { aliases });
    for (const lost of chkLostRuns(verdict, words, CHK_LINE_LOST_WORDS)) {
      const reach = lost.words.length + 2;
      if (chkStartsWith(words, lost.words) && chkHasRun(near(n, -1).slice(-reach), lost.words)) continue;
      if (chkEndsWith(words, lost.words) && chkHasRun(near(n, 1).slice(0, reach), lost.words)) continue;
      // Which of the lines with these same words it is, so a repeated line is numbered as the one that lost them.
      const occurrence = named.slice(0, n).filter((o) => speechTokenize(o.text, aliases).join(' ') === words.join(' ')).length;
      return { index: n, scene_id: String(e.scene_id), line: String(e.text), text: lost.text, occurrence };
    }
  }
  return null;
}

/**
 * The first phrase the whole script lost (CHK_SCRIPT_LOST_WORDS words or more in a row): {text} or null.
 * `scriptWords` is the reviewed script, tokenized: its end said as fewer words counts as lost.
 */
function chkScriptLoss(verdict, scriptWords) {
  const lost = chkLostRuns(verdict, scriptWords, CHK_SCRIPT_LOST_WORDS).find((r) => r.words.length >= CHK_SCRIPT_LOST_WORDS);
  return lost ? { text: lost.text } : null;
}

// ---- check-layer/src/final-measure.mjs ----
// check-layer 1.6.0 (1.8.0: approved callbacks only): the final measurements (gooseworks-final-measure/1, fix-forward
// contract section 1, with its 15 Oct amendments and calibration). The server runs
// the same checks on the uploaded bytes and is the authority; here they give the kit
// the same answer before upload. Measured from the file, never from a declaration:
//   digital_silence    whole-track peak under -60 dBFS, or exact-zero samples over 1.0 s
//   tone_only          over 80 % of the 80 Hz-8 kHz energy in 3 or fewer narrow peaks,
//                      holding for over half the video (sine "music", drones)
//   unplanned_silence  quieter than -45 dBFS (100 ms RMS) for over 1.0 s, no allowed pause
//   frozen_picture     a freezedetect run (noise 0.003) over 2.0 s mid-video that no planned
//                      freeze covers, or frozen time over max(40 %, reference + 15 points)
//   repeated_shot      two shots over 1 s, not next to each other, whose middle frames' 64-bit
//                      dHash differ by 6 bits or fewer, unless the later one's intent is
//                      callback: <name> and <name> is in expect.approved_callbacks (1.8.0: a
//                      callback: intent alone never clears a repeat; a 15 Oct run relabelled five
//                      repeats as callbacks after the check failed, with no change to the cut)
//   planned_pause_too_long / planned_freeze_too_long  the linked timeline's own pauses and freezes
// Silence and frozen picture are allowed for 1.5 s at the start and 3.0 s at the end (the end
// card). An approved intentional_silence contract makes the two silence checks not_applicable.
// Every top-level name starts with `fm` (the bundle inlines this module beside the others).

const FM_FORMAT = 'gooseworks-final-measure/1';
const FM_THRESHOLDS = {
  allowance_s: { start: 1.5, end: 3.0 },
  digital_silence: { peak_dbfs: -60, zero_run_s: 1.0 },
  tone_only: { fft_points: 4096, window_s: 0.5, band_hz: [80, 8000], max_peaks: 3, peak_half_width_bins: 2, energy_share: 0.8, steady_share: 0.5 },
  unplanned_silence: { rms_dbfs: -45, window_s: 0.1, run_s: 1.0 },
  planned_pause_too_long: { pause_s: 1.5, total_share: 0.1 },
  frozen_picture: { noise: 0.003, mid_run_s: 2.0, share: 0.4, share_over_reference: 0.15 },
  planned_freeze_too_long: { freeze_s: 1.5, end_freeze_s: 3.0 },
  repeated_shot: { min_shot_s: 1.0, max_hamming: 6, flat_stddev: 4 },
};
// 16 kHz mono: 8 kHz is the top of the tone band, and a minute is under 4 MB of samples.
const FM_RATE = 16000;
const FM_EDGE_S = 0.05;
const FM_COVER_S = 0.1;
const FM_NUM = '-?\\d+(?:\\.\\d+)?(?:e-?\\d+)?';

const fmDb = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
const fmRound = (x) => Math.round(x * 1000);

/** The cut's audio as 16 kHz mono floats, or null when it has no audio track. */
async function fmSamples(ctx, video, hasAudio) {
  if (!hasAudio) return null;
  const path = join(ctx.tmpDir, 'final-measure.f32');
  await kitFfmpeg(ctx, ['-nostats', '-i', video, '-map', '0:a:0', '-ac', '1', '-ar', String(FM_RATE), '-c:a', 'pcm_f32le', '-f', 'f32le', path]);
  const buf = await readFile(path);
  return new Float32Array(new Uint8Array(buf).buffer, 0, Math.floor(buf.length / 4));
}

/** Runs of exactly zero samples at least `minS` long: [[start_s, end_s]]. */
function fmZeroRuns(samples, rate, minS) {
  const out = [];
  let start = -1;
  for (let i = 0; i <= samples.length; i++) {
    const zero = i < samples.length && samples[i] === 0;
    if (zero && start < 0) start = i;
    if (!zero && start >= 0) {
      if ((i - start) / rate >= minS) out.push([start / rate, i / rate]);
      start = -1;
    }
  }
  return out;
}

/** Runs of `winS` windows whose RMS is under `dbfs`, at least `minS` long: [[start_s, end_s]]. */
function fmQuietRuns(samples, rate, winS, dbfs, minS) {
  const step = Math.max(1, Math.round(winS * rate));
  const out = [];
  let start = -1;
  const windows = Math.ceil(samples.length / step);
  for (let w = 0; w <= windows; w++) {
    let quiet = false;
    if (w < windows) {
      let sum = 0;
      const from = w * step;
      const to = Math.min(samples.length, from + step);
      for (let i = from; i < to; i++) sum += samples[i] * samples[i];
      quiet = fmDb(Math.sqrt(sum / Math.max(1, to - from))) < dbfs;
    }
    if (quiet && start < 0) start = w;
    if (!quiet && start >= 0) {
      const s = (start * step) / rate;
      const e = Math.min(samples.length, w * step) / rate;
      if (e - s > minS) out.push([s, e]);
      start = -1;
    }
  }
  return out;
}

/**
 * Whether a measured span is allowed by its place: one touching the start may last the start allowance
 * (1.5 s), one touching the end the end allowance (3.0 s, the end card), any other `midMax`.
 */
function fmAllowed([s, e], duration, midMax, allowance = FM_THRESHOLDS.allowance_s) {
  const len = e - s;
  const atStart = s <= FM_EDGE_S;
  const atEnd = e >= duration - FM_EDGE_S;
  if (atStart && len <= allowance.start) return true;
  if (atEnd && len <= allowance.end) return true;
  return !atStart && !atEnd && len <= midMax;
}

/** True when `[s, e]` lies inside one of `planned` ([[start_s, end_s]]), within 0.1 s. */
function fmCovered([s, e], planned) {
  return planned.some(([ps, pe]) => s >= ps - FM_COVER_S && e <= pe + FM_COVER_S);
}

/** In-place iterative radix-2 FFT over re/im (length a power of two). */
function fmFft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

/**
 * tone_only: each 0.5 s window's 4096-point spectrum (Hann), 80 Hz to 8 kHz only. A window is tonal when its
 * 3 strongest narrow peaks (each +/-2 bins) hold over 80 % of its band energy. The video fails when tonal
 * windows sharing one dominant peak (+/-2 bins) cover over half its length. Near-silent windows are skipped.
 */
function fmTone(samples, rate, th = FM_THRESHOLDS.tone_only) {
  const n = th.fft_points;
  const hop = Math.round(th.window_s * rate);
  const lo = Math.ceil((th.band_hz[0] * n) / rate);
  const hi = Math.min(n / 2 - 1, Math.floor((th.band_hz[1] * n) / rate));
  const hann = new Float64Array(n).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
  const windows = [];
  for (let from = 0; from + Math.min(n, hop) <= samples.length; from += hop) {
    const center = Math.max(0, Math.min(samples.length - n, from + Math.floor((hop - n) / 2)));
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    let sumSq = 0;
    for (let i = 0; i < n && center + i < samples.length; i++) {
      const v = samples[center + i];
      sumSq += v * v;
      re[i] = v * hann[i];
    }
    if (fmDb(Math.sqrt(sumSq / n)) < -60) {
      windows.push(null);
      continue;
    }
    fmFft(re, im);
    const power = new Float64Array(hi + 1);
    let total = 0;
    for (let k = lo; k <= hi; k++) {
      power[k] = re[k] * re[k] + im[k] * im[k];
      total += power[k];
    }
    if (!(total > 0)) {
      windows.push(null);
      continue;
    }
    const peaks = [];
    let held = 0;
    for (let p = 0; p < th.max_peaks; p++) {
      let best = -1;
      for (let k = lo; k <= hi; k++) if (power[k] > 0 && (best < 0 || power[k] > power[best])) best = k;
      if (best < 0) break;
      for (let k = Math.max(lo, best - th.peak_half_width_bins); k <= Math.min(hi, best + th.peak_half_width_bins); k++) {
        held += power[k];
        power[k] = 0;
      }
      peaks.push(best);
    }
    windows.push({ tonal: held / total > th.energy_share, share: held / total, top: peaks[0] });
  }
  if (!windows.length) return { steady_share: 0, hz: null, windows: 0 };
  const counts = new Map();
  for (const w of windows) if (w && w.tonal) counts.set(w.top, (counts.get(w.top) || 0) + 1);
  let bestBin = null;
  let bestCount = 0;
  for (const bin of counts.keys()) {
    let c = 0;
    for (const [other, k] of counts) if (Math.abs(other - bin) <= th.peak_half_width_bins) c += k;
    if (c > bestCount) {
      bestCount = c;
      bestBin = bin;
    }
  }
  return { steady_share: bestCount / windows.length, hz: bestBin === null ? null : +((bestBin * rate) / n).toFixed(1), windows: windows.length };
}

/** freezedetect (noise 0.003, 1.0 s) spans of the picture, from one decode of a small copy. */
async function fmFreezes(ctx, video, duration, th = FM_THRESHOLDS.frozen_picture) {
  const { stderr } = await kitFfmpeg(ctx, ['-nostats', '-i', video, '-an', '-vf', `scale=270:-2,freezedetect=n=${th.noise}:d=1.0`, '-f', 'null', '-']);
  const out = [];
  let start = null;
  for (const line of String(stderr).split('\n')) {
    const s = new RegExp(`freeze_start:\\s*(${FM_NUM})`).exec(line);
    if (s) start = Number(s[1]);
    const e = new RegExp(`freeze_end:\\s*(${FM_NUM})`).exec(line);
    if (e && start !== null) {
      out.push([start, Number(e[1])]);
      start = null;
    }
  }
  if (start !== null) out.push([start, duration]);
  return out;
}

/** A 64-bit dHash of a 9x8 gray frame, as a bit string, and the frame's spread (stddev). */
function fmDhash(frame) {
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += frame.data[y * 9 + x] > frame.data[y * 9 + x + 1] ? '1' : '0';
  const values = [...frame.data];
  const mean = values.reduce((a, v) => a + v, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
  return { bits, sd };
}

function fmHamming(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

/**
 * The shots to compare: the linked timeline's segments, consecutive segments of one source merged into one
 * shot, else the timeline's scenes. A shot that depicts speech is a new performance, not a reused shot, and
 * is not compared.
 */
function fmShots(assembly, timeline) {
  if (assembly && Array.isArray(assembly.segments) && assembly.segments.length) {
    const shots = [];
    for (const seg of [...assembly.segments].sort((a, b) => a.start_ms - b.start_ms)) {
      const last = shots.at(-1);
      const source = seg.video && seg.video.asset_id;
      if (last && last.source === source && Math.abs(last.end_s - seg.start_ms / 1000) < 0.05) {
        last.end_s = seg.end_ms / 1000;
        last.speech = last.speech && seg.depicts_speech === true;
        continue;
      }
      shots.push({ id: seg.id, source, start_s: seg.start_ms / 1000, end_s: seg.end_ms / 1000, intent: typeof seg.intent === 'string' ? seg.intent : '', speech: seg.depicts_speech === true });
    }
    return shots;
  }
  return (timeline.scenes || []).map((sc) => ({ id: sc.id, source: null, start_s: sc.start_s, end_s: sc.end_s, intent: '', speech: false }));
}

/**
 * Is a shot's intent an approved callback? `callback: <name>` where <name> is one of `approved`
 * (expect.approved_callbacks, from the approved creative contract), matched case-insensitively as the
 * whole name or its first words. A callback: intent with no approved list, or a name not on it, is not.
 */
function fmApprovedCallback(intent, approved) {
  const text = typeof intent === 'string' ? intent.trim() : '';
  if (!text.toLowerCase().startsWith('callback:') || !Array.isArray(approved)) return false;
  const name = text.slice('callback:'.length).trim().toLowerCase().replace(/\s+/g, ' ');
  if (!name) return false;
  return approved.some((a) => {
    const want = typeof a === 'string' ? a.trim().toLowerCase().replace(/\s+/g, ' ') : '';
    return want !== '' && (name === want || (name.startsWith(want) && /^\W/.test(name.slice(want.length))));
  });
}

/** [[start_s, end_s]] of the linked timeline's planned freezes and pauses, with their lengths judged. */
function fmPlanned(assembly) {
  const freezes = [];
  const pauses = [];
  if (!assembly) return { freezes, pauses, duration_s: null };
  for (const o of assembly.visual_overrides || []) if (o && o.kind === 'freeze') freezes.push([o.start_ms / 1000, o.end_ms / 1000]);
  for (const p of assembly.pauses || []) if (p) pauses.push([p.start_ms / 1000, p.end_ms / 1000]);
  return { freezes, pauses, duration_s: Number.isFinite(assembly.duration_ms) ? assembly.duration_ms / 1000 : null };
}

/** The approved contract chose silence: speech_mode none with only intentional_silence. */
function fmSilentByChoice(assembly, expect) {
  if (assembly) return assembly.speech_mode === 'none' && Array.isArray(assembly.soundtrack_modes) && assembly.soundtrack_modes.length === 1 && assembly.soundtrack_modes[0] === 'intentional_silence';
  return expect.speech === 'none' && expect.music !== true && expect.voice !== true;
}

const fmIntervals = (spans) => spans.map(([s, e]) => [fmRound(s), fmRound(e)]);

/**
 * Every final measurement: [{ id, result, detail, intervals_ms }]. `media` has the measured duration,
 * whether there is an audio track, the cut's path and size. `opts.referenceFrozenShare` (0 to 1) widens the
 * still-image share when the reference is known.
 */
async function fmMeasure(ctx, media, { timeline, expect, assembly }) {
  const th = FM_THRESHOLDS;
  const d = media.duration_s;
  const results = [];
  const put = (id, result, detail, spans = []) => results.push({ id, result, detail, intervals_ms: fmIntervals(spans) });
  const planned = fmPlanned(assembly);
  const silentByChoice = fmSilentByChoice(assembly, expect);
  const samples = await fmSamples(ctx, media.path, media.has_audio);

  // digital_silence
  if (silentByChoice) put('digital_silence', 'not_applicable', 'the approved contract is intentional silence');
  else if (!samples || !samples.length) put('digital_silence', 'fail', 'the video has no sound track', [[0, d]]);
  else {
    let peak = 0;
    for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
    const zeros = fmZeroRuns(samples, FM_RATE, th.digital_silence.zero_run_s).filter((span) => !fmAllowed(span, d, th.digital_silence.zero_run_s) && !fmCovered(span, planned.pauses));
    if (fmDb(peak) < th.digital_silence.peak_dbfs) put('digital_silence', 'fail', `the whole track peaks at ${fmDb(peak) === -Infinity ? 'digital zero' : `${fmDb(peak).toFixed(1)} dBFS`}`, [[0, d]]);
    else if (zeros.length) put('digital_silence', 'fail', `exact digital silence for ${(zeros[0][1] - zeros[0][0]).toFixed(1)} s from ${zeros[0][0].toFixed(1)} s`, zeros);
    else put('digital_silence', 'pass', `peak ${fmDb(peak).toFixed(1)} dBFS`);
  }

  // tone_only
  if (!samples || !samples.length) put('tone_only', 'not_applicable', 'no sound track');
  else {
    const tone = fmTone(samples, FM_RATE);
    if (tone.steady_share > th.tone_only.steady_share) put('tone_only', 'fail', `a steady tone near ${tone.hz} Hz holds ${(tone.steady_share * 100).toFixed(0)} % of the video: sine or drone "music", not a soundtrack`, [[0, d]]);
    else put('tone_only', 'pass', `steady-tone share ${(tone.steady_share * 100).toFixed(0)} %`);
  }

  // unplanned_silence
  if (silentByChoice) put('unplanned_silence', 'not_applicable', 'the approved contract is intentional silence');
  else if (!samples || !samples.length) put('unplanned_silence', 'not_applicable', 'no sound track (see digital_silence)');
  else {
    const allowedPauses = planned.pauses.filter(([s, e]) => e - s <= th.planned_pause_too_long.pause_s);
    const quiet = fmQuietRuns(samples, FM_RATE, th.unplanned_silence.window_s, th.unplanned_silence.rms_dbfs, th.unplanned_silence.run_s).filter((span) => !fmAllowed(span, d, th.unplanned_silence.run_s) && !fmCovered(span, allowedPauses));
    if (quiet.length) put('unplanned_silence', 'fail', `the sound drops below ${th.unplanned_silence.rms_dbfs} dBFS for ${(quiet[0][1] - quiet[0][0]).toFixed(1)} s from ${quiet[0][0].toFixed(1)} s with no planned pause`, quiet);
    else put('unplanned_silence', 'pass', 'no unplanned silence over 1.0 s');
  }

  // planned_pause_too_long
  if (!assembly) put('planned_pause_too_long', 'not_applicable', 'no linked timeline');
  else {
    const long = planned.pauses.filter(([s, e]) => e - s > th.planned_pause_too_long.pause_s);
    const total = planned.pauses.reduce((a, [s, e]) => a + Math.max(0, e - s), 0);
    if (long.length) put('planned_pause_too_long', 'fail', `a planned pause of ${(long[0][1] - long[0][0]).toFixed(1)} s (at most ${th.planned_pause_too_long.pause_s} s)`, long);
    else if (d > 0 && total / d > th.planned_pause_too_long.total_share) put('planned_pause_too_long', 'fail', `planned pauses add up to ${((total / d) * 100).toFixed(0)} % of the video (at most 10 %)`, planned.pauses);
    else put('planned_pause_too_long', 'pass', `${total.toFixed(2)} s of planned pauses`);
  }

  // planned_freeze_too_long: a freeze ending at the end (the end card) may last 3.0 s.
  if (!assembly) put('planned_freeze_too_long', 'not_applicable', 'no linked timeline');
  else {
    const end = planned.duration_s ?? d;
    const long = planned.freezes.filter(([s, e]) => e - s > (e >= end - 0.001 ? th.planned_freeze_too_long.end_freeze_s : th.planned_freeze_too_long.freeze_s));
    if (long.length) put('planned_freeze_too_long', 'fail', `a planned freeze of ${(long[0][1] - long[0][0]).toFixed(1)} s`, long);
    else put('planned_freeze_too_long', 'pass', `${planned.freezes.length} planned freezes within their caps`);
  }

  // frozen_picture
  const freezes = await fmFreezes(ctx, media.path, d);
  const allowedFreezes = planned.freezes.filter(([s, e]) => e - s <= (e >= (planned.duration_s ?? d) - 0.001 ? th.planned_freeze_too_long.end_freeze_s : th.planned_freeze_too_long.freeze_s));
  const unplanned = freezes.filter((span) => !fmAllowed(span, d, th.frozen_picture.mid_run_s) && !fmCovered(span, allowedFreezes));
  const frozen = freezes.reduce((a, [s, e]) => a + Math.max(0, e - s), 0);
  const ref = Number.isFinite(expect.reference_frozen_share) ? expect.reference_frozen_share : null;
  const shareLimit = ref === null ? th.frozen_picture.share : Math.max(th.frozen_picture.share, ref + th.frozen_picture.share_over_reference);
  if (unplanned.length) {
    const [s, e] = unplanned[0];
    put('frozen_picture', 'fail', `the picture is frozen for ${(e - s).toFixed(1)} s from ${s.toFixed(1)} s with no planned freeze`, unplanned);
  } else if (d > 0 && frozen / d > shareLimit) put('frozen_picture', 'fail', `the picture is still for ${((frozen / d) * 100).toFixed(0)} % of the video (at most ${(shareLimit * 100).toFixed(0)} %)`, freezes);
  else put('frozen_picture', 'pass', `${frozen.toFixed(1)} s frozen in all`);

  // repeated_shot
  const shots = fmShots(assembly, timeline).filter((s) => s.end_s - s.start_s > th.repeated_shot.min_shot_s && !s.speech);
  const hashed = [];
  for (const shot of shots) {
    const frame = await kitGrayFrame(ctx, media.path, Math.min(d - 0.05, (shot.start_s + shot.end_s) / 2), 9, 8);
    const h = fmDhash(frame);
    // A flat card (black, one colour) has no picture to repeat; black frames are checked on their own.
    if (h.sd >= th.repeated_shot.flat_stddev) hashed.push({ ...shot, bits: h.bits });
  }
  const order = shots.map((s) => s.id);
  let repeat = null;
  for (let j = 0; j < hashed.length && !repeat; j++) {
    for (let i = 0; i < j && !repeat; i++) {
      if (Math.abs(order.indexOf(hashed[j].id) - order.indexOf(hashed[i].id)) <= 1) continue;
      if (fmApprovedCallback(hashed[j].intent, expect.approved_callbacks)) continue;
      const dist = fmHamming(hashed[i].bits, hashed[j].bits);
      if (dist <= th.repeated_shot.max_hamming) repeat = { a: hashed[i], b: hashed[j], dist };
    }
  }
  if (!shots.length) put('repeated_shot', 'not_applicable', 'no shot over 1 s to compare');
  else if (repeat) {
    const marked = repeat.b.intent.trim().toLowerCase().startsWith('callback:');
    const why = marked
      ? `its intent "${repeat.b.intent.trim().slice(0, 80)}" names no callback in the approved creative contract (expect.approved_callbacks); a repeat the check finds is fixed with new coverage, never by adding callback: after it fails`
      : 'make new coverage, or name a callback the approved creative contract lists (intent callback: <name>)';
    put('repeated_shot', 'fail', `the shot at ${repeat.b.start_s.toFixed(1)} s repeats the one at ${repeat.a.start_s.toFixed(1)} s (dHash distance ${repeat.dist}); ${why}`, [[repeat.a.start_s, repeat.a.end_s], [repeat.b.start_s, repeat.b.end_s]]);
  }
  else put('repeated_shot', 'pass', `${hashed.length} shots compared`);

  return results;
}

/** The stored shape (quality_report.final_measure). */
function fmRecord(video, durationS, checks) {
  return { format: FM_FORMAT, output_sha256: video.sha256, measured_duration_ms: fmRound(durationS), checks, thresholds: FM_THRESHOLDS };
}

/** Plain words for a failed or warned measurement. */
function fmMessage(c, block) {
  const what = {
    digital_silence: 'The sound goes digitally silent',
    tone_only: 'The soundtrack is a steady tone',
    unplanned_silence: 'The sound drops out',
    planned_pause_too_long: 'A planned pause is too long',
    frozen_picture: 'The picture freezes',
    planned_freeze_too_long: 'A planned freeze is too long',
    repeated_shot: 'A shot is repeated',
  }[c.id] || 'A final measurement failed';
  return `${what}: ${c.detail}.${block ? '' : ' (A warning for template videos in this release.)'}`;
}

// ---- check-layer/src/speech-rate.mjs ----
// speech_rate_vs_reference (check-layer 1.7.0): the final cut's speaking rate against the
// reference's, from two timed word lists. Words are counted as goose-studio's reference_rate.py
// counts them: whisper's sub-word tokens joined (a token not starting with a space belongs to the
// word before it, as " black" + "head"), markers such as [_BEG_] dropped, and a word with no letter
// or digit (a lone full stop or dash) not counted. A list's rate is its words over the first word's
// start to the last word's end. Every top-level name starts with `chkRate`.

const CHK_RATE_MIN_RATIO = 0.85;
const chkRateCounted = /[\p{L}\p{N}_]/u;
const chkRateMarker = /^\s*\[.*\]\s*$/u;

function chkRateNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** The real words of a timed list: [{text, start_s, end_s}], tokens joined, markers and punctuation dropped. */
function chkRateWords(list) {
  const items = (Array.isArray(list) ? list : []).map((w) => ({
    text: String((w && (w.text ?? w.word)) ?? ''),
    start: chkRateNum(w && (w.start_s ?? w.start)),
    end: chkRateNum(w && (w.end_s ?? w.end)),
  })).filter((w) => w.start !== null && w.end !== null && w.text.trim() && !chkRateMarker.test(w.text));
  // A token stream (whisper.cpp tokens keep their leading space) joins a token without one onto the word before.
  const tokens = items.some((w) => /^\s/u.test(w.text));
  const found = [];
  for (const w of items) {
    const pieces = w.text.split(/\s+/u).filter(Boolean);
    if (tokens && found.length && !/^\s/u.test(w.text) && pieces.length) {
      const last = found.at(-1);
      last.text += pieces.shift();
      last.end = w.end;
    }
    for (const p of pieces) found.push({ text: p, start: w.start, end: w.end });
  }
  return found.filter((w) => chkRateCounted.test(w.text));
}

/** {words, span_s, wps} for one list; wps is null under two words or with no span. */
function chkRate(list) {
  const words = chkRateWords(list);
  if (words.length < 2) return { words: words.length, span_s: 0, wps: null };
  const span = words.at(-1).end - words[0].start;
  return { words: words.length, span_s: +span.toFixed(3), wps: span > 0 ? +(words.length / span).toFixed(3) : null };
}

/** The check: not_applicable unless both lists measure; fail when the final is more than 15 % slower. */
function chkSpeechRateVsReference(reference, final) {
  if (!Array.isArray(reference) || !Array.isArray(final)) return { status: 'not_applicable', found: 'needs both the reference and the final word lists' };
  const ref = chkRate(reference);
  const fin = chkRate(final);
  if (!ref.wps || !fin.wps) return { status: 'not_applicable', found: 'fewer than two timed words in a list' };
  const ratio = fin.wps / ref.wps;
  const expected = `at least ${Math.round(CHK_RATE_MIN_RATIO * 100)} % of the reference's ${ref.wps.toFixed(2)} words a second`;
  const found = `${fin.wps.toFixed(2)} words a second (${(ratio * 100).toFixed(0)} % of the reference)`;
  if (ratio < CHK_RATE_MIN_RATIO - 1e-9) {
    return { status: 'fail', expected, found, message: `The voice speaks at ${fin.wps.toFixed(2)} words a second, more than 15 % slower than the reference's ${ref.wps.toFixed(2)}.` };
  }
  return { status: 'pass', expected, found };
}

// ---- check-layer/src/setups.mjs ----
// setup_count_vs_reference (check-layer 1.8.0): how many distinct setups the final cut has,
// against the reference's. A setup is a new person, room, framing or action from a separately
// made take; cuts inside one take, punch-ins and repeats are the same setup. A 15 Oct test video
// had 4 setups in 47.6 s against about 10 in the reference: two faces cut back and forth.
//
// Counted from shot keyframes, the way the harness's planned check counts them: each shot of the
// linked timeline (consecutive segments of one source merged, else the timeline's scenes) that
// lasts at least 0.5 s gives one keyframe at its middle; a flat frame (a black or one-colour card)
// is skipped. Each keyframe is a 64-bit dHash of a 9x8 gray frame (final-measure's fmDhash), and
// keyframes within 10 bits of each other join one setup (single linkage). The check fails when
// the final has more than 30 % fewer setups than expect.reference_setups, the reference's count
// made the same way; without it the check is not_applicable.
// Every top-level name starts with `chkSetup` (the bundle inlines this module beside the others).

const CHK_SETUP_THRESHOLDS = { min_shot_s: 0.5, max_hamming: 10, flat_stddev: 4, max_shortfall: 0.3 };

/** The number of setups in a list of dHash bit strings: single-linkage clusters within `maxHamming` bits. */
function chkSetupClusters(bits, maxHamming = CHK_SETUP_THRESHOLDS.max_hamming) {
  const parent = bits.map((_, i) => i);
  const root = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  for (let j = 0; j < bits.length; j++) {
    for (let i = 0; i < j; i++) {
      if (fmHamming(bits[i], bits[j]) <= maxHamming) parent[root(j)] = root(i);
    }
  }
  return new Set(bits.map((_, i) => root(i))).size;
}

/** The verdict for a final count against the reference's: {status, expected, found, message?}. */
function chkSetupVerdict(finalSetups, referenceSetups, shots, th = CHK_SETUP_THRESHOLDS) {
  const floor = referenceSetups * (1 - th.max_shortfall);
  const expected = `at least ${Math.ceil(floor - 1e-9)} setups (no more than ${Math.round(th.max_shortfall * 100)} % below the reference's ${referenceSetups})`;
  const found = `${finalSetups} setups from ${shots} shots`;
  if (finalSetups + 1e-9 >= floor) return { status: 'pass', expected, found };
  return {
    status: 'fail',
    expected,
    found,
    message: `The video has ${finalSetups} distinct setups against the reference's ${referenceSetups}: it cuts between too few people, rooms or framings. Plan the shots from the reference's cut list and make new coverage; punch-ins and repeats of one take are not new setups.`,
  };
}

/** setup_count_vs_reference for the cut at `path` (duration `d`). */
async function chkSetupCount(ctx, path, d, { assembly, timeline, expect }, th = CHK_SETUP_THRESHOLDS) {
  const reference = expect && Number.isInteger(expect.reference_setups) ? expect.reference_setups : null;
  if (reference === null) return { status: 'not_applicable', found: 'no reference setup count (expect.reference_setups)' };
  const shots = fmShots(assembly, timeline || {}).filter((s) => s.end_s - s.start_s >= th.min_shot_s);
  const bits = [];
  for (const shot of shots) {
    const frame = await kitGrayFrame(ctx, path, Math.min(d - 0.05, (shot.start_s + shot.end_s) / 2), 9, 8);
    const h = fmDhash(frame);
    if (h.sd >= th.flat_stddev) bits.push(h.bits);
  }
  if (!bits.length) return { status: 'not_applicable', found: 'no shot of at least 0.5 s with a picture to compare' };
  return chkSetupVerdict(chkSetupClusters(bits, th.max_hamming), reference, bits.length, th);
}

// ---- check-layer/src/speech-gaps.mjs ----
// check-layer 1.9.0: speech the script does not have (GOOSE-4034). Two ways a generated take says more
// than its lines, both passed by speech_matches_script, whose similarity bar a few extra words barely move:
//   speech_extra_words     the transcript has words the script does not: a line or word said twice, or
//                          made-up words the transcriber wrote down. Fillers (um, uh) and Whisper's own
//                          "thank you" at the very end of a clip do not count.
//   no_unscripted_speech   (a style flag) a voice where no scripted word is timed. Whisper drops sounds
//                          that are not words, so babble never reaches the transcript; it is heard here as
//                          voice-band loudness (300 Hz to 3.4 kHz, 50 ms windows) between the timed words
//                          that rises 3 dB over the median inside them for at least 0.15 s of one gap.
// Calibrated on the Graza stand-in take (ugc-product, H3, 15 Oct): its second "glugging" sits in the gap
// between lines 2 and 3 with 6 windows over the bar, alone and under three real music beds mixed by
// audio-mix 1.0.1 and levelled by the sound layer; the beds alone reach +0.3 dB at most. Six clean H3
// takes had no gap over the bar (one 50 ms spike, below the 0.15 s needed).
// Every top-level name starts with `chk` (bundled modules share one namespace).

const CHK_GAP_RATE = 16000;
const CHK_GAP_WINDOW_S = 0.05;
// A window this close to a timed word belongs to the word (Whisper's word edges are loose).
const CHK_GAP_GUARD_S = 0.15;
// Louder than the median inside the words by this much counts as a voice.
const CHK_GAP_RISE_DB = 3;
// This many such windows in one gap (0.15 s) fail it; a single click or plosive does not.
const CHK_GAP_MIN_WINDOWS = 3;
// Fewer timed-word windows than this give no reliable voice level.
const CHK_GAP_MIN_WORD_WINDOWS = 5;
const CHK_GAP_BAND = 'highpass=f=300,lowpass=f=3400';

// Heard words that are never a defect on their own.
const CHK_FILLERS = new Set(['um', 'umm', 'uh', 'uhm', 'er', 'erm', 'ah', 'hmm', 'mm', 'mhm']);
// What Whisper writes over the quiet or music at the end of a clip when nobody speaks.
const CHK_TAIL_HALLUCINATIONS = ['thank you', 'thanks for watching', 'thank you for watching', 'you'];

/** The cut's voice-band level in dB, one value per CHK_GAP_WINDOW_S window up to `untilS`. */
async function chkVoiceBandLevels(ctx, video, untilS) {
  const path = join(ctx.tmpDir, 'voice-band.f32');
  await kitFfmpeg(ctx, ['-nostats', '-i', video, '-map', '0:a:0', '-t', String(untilS), '-ac', '1', '-ar', String(CHK_GAP_RATE), '-af', CHK_GAP_BAND, '-c:a', 'pcm_f32le', '-f', 'f32le', path]);
  const buf = await readFile(path);
  const samples = new Float32Array(new Uint8Array(buf).buffer, 0, Math.floor(buf.length / 4));
  const step = Math.round(CHK_GAP_WINDOW_S * CHK_GAP_RATE);
  const levels = [];
  for (let from = 0; from + step <= samples.length; from += step) {
    let sum = 0;
    for (let i = from; i < from + step; i++) sum += samples[i] * samples[i];
    const rms = Math.sqrt(sum / step);
    levels.push(rms > 0 ? 20 * Math.log10(rms) : -Infinity);
  }
  return levels;
}

function chkMedian(values) {
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/**
 * Voice outside the timed words. `levels` are dB per `step` seconds from 0, `words` the timed scripted
 * words ({start_s, end_s}), `untilS` where the speech may end (the end card's start). Returns null when
 * there is too little timed speech to set a voice level, else {voice_db, gaps, loud}: every gap
 * ({start_s, end_s, loud_windows}) and the ones with at least CHK_GAP_MIN_WINDOWS loud windows.
 */
function chkUnscriptedVoice(levels, step, words, untilS) {
  const spans = (words || []).filter((w) => w && Number.isFinite(w.start_s) && Number.isFinite(w.end_s) && w.end_s > w.start_s);
  if (!spans.length) return null;
  const centre = (i) => (i + 0.5) * step;
  const inside = (t, guard) => spans.some((w) => t >= w.start_s - guard && t <= w.end_s + guard);
  const voiced = [];
  for (let i = 0; i < levels.length; i++) if (Number.isFinite(levels[i]) && inside(centre(i), 0)) voiced.push(levels[i]);
  if (voiced.length < CHK_GAP_MIN_WORD_WINDOWS) return null;
  const voice = chkMedian(voiced);
  const bar = voice + CHK_GAP_RISE_DB;
  const gaps = [];
  let open = null;
  for (let i = 0; i <= levels.length; i++) {
    const t = centre(i);
    const gap = i < levels.length && t < untilS && !inside(t, CHK_GAP_GUARD_S);
    if (gap) {
      if (!open) open = { start_s: i * step, end_s: (i + 1) * step, loud_windows: 0 };
      open.end_s = (i + 1) * step;
      if (levels[i] >= bar) open.loud_windows += 1;
    } else if (open) {
      gaps.push(open);
      open = null;
    }
  }
  const round = (g) => ({ start_s: +g.start_s.toFixed(2), end_s: +g.end_s.toFixed(2), loud_windows: g.loud_windows });
  return { voice_db: +voice.toFixed(1), gaps: gaps.map(round), loud: gaps.filter((g) => g.loud_windows >= CHK_GAP_MIN_WINDOWS).map(round) };
}

function chkHasRunIn(words, run) {
  for (let i = 0; i + run.length <= words.length; i++) if (run.every((t, k) => words[i + k] === t)) return true;
  return false;
}

/**
 * The first run of heard words the script does not have: {words, text, repeat} or null. `verdict` is
 * speechReview(script, heard); `scriptWords` and `heardWords` the same texts tokenized. A run that is
 * part of the script is a repeat. Fillers alone, and a Whisper sign-off that ends the transcript, are
 * not counted.
 */
function chkExtraWords(verdict, scriptWords, heardWords) {
  for (const issue of verdict.issues || []) {
    const grew = issue.kind === 'substitution' && issue.heard_words.length - issue.script_words.length >= 2;
    if (issue.kind !== 'inserted' && !grew) continue;
    const extra = issue.heard_words;
    if (!extra.some((w) => !CHK_FILLERS.has(w))) continue;
    const said = extra.join(' ');
    const atEnd = extra.length <= heardWords.length && extra.every((t, k) => heardWords[heardWords.length - extra.length + k] === t);
    if (issue.kind === 'inserted' && atEnd && CHK_TAIL_HALLUCINATIONS.includes(said)) continue;
    return { words: extra, text: issue.heard_text || said, repeat: issue.kind === 'inserted' && chkHasRunIn(scriptWords, extra) };
  }
  return null;
}

// ---- check-layer/src/shots.mjs ----
// The check layer's 1.4.0 style flags, measured per shot of the finished cut:
// captions_cross_cuts, min_shot, ambience_floor, cut_contrast and
// distinct_adjacent_shots. A shot is the stretch between two cuts, and a cut
// is a scene start in the timeline (the end card is not a shot). Pure maths
// apart from chkGrayAt, which decodes one small grayscale frame into tmpDir.
// Every top-level name starts with `chk` (bundled modules share one namespace).

// captions_cross_cuts: a cue may run this far past a cut on either side (cue timings are not frame exact).
const CHK_CUE_GUARD_S = 0.15;
// min_shot: no shot shorter than this.
const CHK_MIN_SHOT_S = 0.4;
// ambience_floor: the room tone under each shot stays in this band (dB full scale, RMS), and speech stays
// at least this far above it.
const CHK_FLOOR_MIN_DB = -52;
const CHK_FLOOR_MAX_DB = -32;
const CHK_FLOOR_SPEECH_GAP_DB = 6;
// The floor is the 10th percentile of 50 ms windows, away from each shot's edges (a join may click or dip).
const CHK_FLOOR_WINDOW_S = 0.05;
const CHK_FLOOR_PERCENTILE = 0.1;
const CHK_FLOOR_EDGE_S = 0.05;
// At least this many speech-free windows (0.2 s) before the floor is read from the speech-free ones only.
const CHK_FLOOR_MIN_QUIET_WINDOWS = 4;
// cut_contrast: mean absolute grayscale difference (0 to 255) between the frames this far either side of a cut.
const CHK_CONTRAST_OFFSET_S = 0.08;
const CHK_CONTRAST_MIN = 25;
const CHK_CONTRAST_WARN = 32;
// distinct_adjacent_shots: the opening frames of two scenes in a row differ by at least this (the same
// clip shown twice differs by encoder noise only, around 1 on this scale).
const CHK_DISTINCT_MIN = 6;
// A scene's opening frame is read this far in, so a frame-rounded cut never shows the scene before.
const CHK_FIRST_FRAME_S = 0.05;
const CHK_CONTRAST_WIDTH = 160;
const CHK_DISTINCT_WIDTH = 64;
// A scene that starts this close to the end of the body opens no shot (as in flags.mjs chkCuts).
const CHK_SHOT_EDGE_S = 0.05;
// min_shot and ambience_floor: a scene start within this of the body's start or end is that edge (frame
// rounding); any later one opens a shot, however short (a one-frame flash before the end card is a shot).
const CHK_SHOT_ROUND_S = 0.02;

/** The shots of the body: [start, end] between consecutive scene starts, from 0 to `bodyEnd`. */
function chkShots(scenes, bodyEnd) {
  if (!(bodyEnd > 0)) return [];
  const starts = [];
  for (const sc of scenes || []) {
    const t = sc.start_s;
    if (Number.isFinite(t) && t > CHK_SHOT_ROUND_S && t < bodyEnd - CHK_SHOT_ROUND_S && !starts.some((u) => Math.abs(u - t) < 1e-3)) starts.push(t);
  }
  const edges = [0, ...starts.sort((a, b) => a - b), bodyEnd];
  const out = [];
  for (let i = 1; i < edges.length; i++) out.push([edges[i - 1], edges[i]]);
  return out;
}

/** The first shot shorter than `min` ({start_s, end_s, seconds}), or null. */
function chkShortShot(shots, min = CHK_MIN_SHOT_S) {
  const s = shots.find(([a, b]) => b - a < min - 1e-6);
  return s ? { start_s: s[0], end_s: s[1], seconds: s[1] - s[0] } : null;
}

/** The first caption cue that runs more than the guard past a cut on both sides ({cue, t}), or null. */
function chkCueAcrossCut(cues, cuts, guard = CHK_CUE_GUARD_S) {
  for (const cue of cues || []) {
    const t = cuts.find((u) => cue.start_s < u - guard - 1e-6 && cue.end_s > u + guard + 1e-6);
    if (t !== undefined) return { cue, t };
  }
  return null;
}

/** The `p` quantile (0 to 1) of a list of numbers, nearest rank; null for an empty list. */
function chkPercentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))];
}

/** The power-average of levels in dB (silence, -Infinity, counts as no power). */
function chkMeanDb(levels) {
  if (!levels.length) return null;
  const power = levels.reduce((a, l) => a + (Number.isFinite(l) ? 10 ** (l / 10) : 0), 0) / levels.length;
  return power > 0 ? 10 * Math.log10(power) : -Infinity;
}

/** A shot too short for one 50 ms window away from its edges (it is measured whole, and only for silence). */
function chkShortForFloor([start, end]) {
  return end - start < 2 * CHK_FLOOR_EDGE_S + CHK_FLOOR_WINDOW_S - 1e-9;
}

/** The 50 ms windows inside a shot, away from its edges: [[from, to]]. A shot too short for one is one window. */
function chkFloorWindows([start, end]) {
  if (!(end > start)) return [];
  if (chkShortForFloor([start, end])) return [[start, end]];
  const out = [];
  for (let t = start + CHK_FLOOR_EDGE_S; t + CHK_FLOOR_WINDOW_S <= end - CHK_FLOOR_EDGE_S + 1e-9; t += CHK_FLOOR_WINDOW_S) out.push([t, t + CHK_FLOOR_WINDOW_S]);
  return out;
}

/** The spans where words are said: each entry's word timings when it has them, else the entry's own span. */
function chkSpeechSpans(speech) {
  const out = [];
  for (const s of speech || []) {
    const words = (s.words || []).filter((w) => w.end_s > w.start_s);
    if (words.length) for (const w of words) out.push([w.start_s, w.end_s]);
    else if (s.end_s > s.start_s) out.push([s.start_s, s.end_s]);
  }
  return out;
}

/**
 * One shot's sound: `floor` (dB, the 10th percentile of its windows, the speech-free ones when there are
 * enough of them) and `speech` (dB, the power-average of the windows whose middle is in a spoken span, or
 * null when nobody speaks in the shot). `windows` and `levels` line up; `spoken` are chkSpeechSpans.
 */
function chkShotSound(windows, levels, spoken) {
  const isSpoken = ([a, b]) => spoken.some(([s, e]) => (a + b) / 2 >= s && (a + b) / 2 < e);
  const quiet = [];
  const voiced = [];
  windows.forEach((w, i) => (isSpoken(w) ? voiced : quiet).push(levels[i]));
  const floor = chkPercentile(quiet.length >= CHK_FLOOR_MIN_QUIET_WINDOWS ? quiet : levels, CHK_FLOOR_PERCENTILE);
  return { floor, speech: voiced.length ? chkMeanDb(voiced) : null };
}

/**
 * The first shot whose room tone is out of the band or too close to its speech, as {shot, floor, speech,
 * problem: 'silent' | 'low' | 'high' | 'speech'}; null when every measured shot is in. `sounds` are
 * chkShotSound results in shot order (a shot with no windows has floor null and is skipped). A shot too
 * short to read its room tone apart from its speech (chkShortForFloor) is judged only for silence.
 */
function chkJudgeAmbience(shots, sounds) {
  for (let i = 0; i < shots.length; i++) {
    const { floor, speech } = sounds[i];
    if (floor === null) continue;
    const shot = shots[i];
    if (!Number.isFinite(floor)) return { shot, floor, speech, problem: 'silent' };
    if (chkShortForFloor(shot)) continue;
    if (floor < CHK_FLOOR_MIN_DB - 1e-9) return { shot, floor, speech, problem: 'low' };
    if (floor > CHK_FLOOR_MAX_DB + 1e-9) return { shot, floor, speech, problem: 'high' };
    if (speech !== null && speech - floor < CHK_FLOOR_SPEECH_GAP_DB - 1e-9) return { shot, floor, speech, problem: 'speech' };
  }
  return null;
}

/**
 * One frame at `t` as 8-bit gray, `w` wide (height to the picture's shape), or null when there is none.
 * The seek is exact: a coarse seek to a second before `t`, then a decoded one to `t`.
 */
async function chkGrayAt(ctx, video, t, w, width, height) {
  const h = Math.max(2, Math.round((w * height) / width / 2) * 2);
  const coarse = Math.max(0, t - 1);
  const path = join(ctx.tmpDir, `gray-${w}-${Math.round(t * 1000)}.raw`);
  await kitFfmpeg(ctx, ['-ss', kitNum(coarse), '-i', video, '-ss', kitNum(t - coarse), '-an', '-frames:v', '1', '-vf', `scale=${w}:${h}:flags=area,format=gray`, '-pix_fmt', 'gray', '-f', 'rawvideo', path]);
  // No frame there (past the last one): ffmpeg may write nothing at all.
  const data = await readFile(path).catch(() => null);
  await rm(path, { force: true });
  return data && data.length >= w * h ? data.subarray(0, w * h) : null;
}

/** Mean absolute difference (0 to 255) between two gray frames of one size; null when either is missing. */
function chkFrameDiff(a, b) {
  if (!a || !b || a.length !== b.length || !a.length) return null;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

/** The contrast across each cut: [{t, diff}], the frames CHK_CONTRAST_OFFSET_S either side. */
async function chkCutContrast(ctx, video, cuts, width, height, duration) {
  const out = [];
  for (const t of cuts) {
    const before = await chkGrayAt(ctx, video, Math.max(0, t - CHK_CONTRAST_OFFSET_S), CHK_CONTRAST_WIDTH, width, height);
    const after = await chkGrayAt(ctx, video, Math.min(duration - 0.02, t + CHK_CONTRAST_OFFSET_S), CHK_CONTRAST_WIDTH, width, height);
    out.push({ t, diff: chkFrameDiff(before, after) });
  }
  return out;
}

/** The scenes inside the body, in order, with the time their opening frame is read at. */
function chkSceneOpenings(scenes, bodyEnd) {
  return [...(scenes || [])]
    .filter((sc) => sc.end_s > sc.start_s && sc.start_s < bodyEnd - CHK_SHOT_EDGE_S)
    .sort((a, b) => a.start_s - b.start_s)
    .map((sc) => ({ id: sc.id, at: Math.min(sc.start_s + CHK_FIRST_FRAME_S, (sc.start_s + Math.min(sc.end_s, bodyEnd)) / 2) }));
}

/** The difference between the opening frames of each two scenes in a row: [{a, b, diff}]. */
async function chkAdjacentDiffs(ctx, video, openings, width, height) {
  const frames = [];
  for (const o of openings) frames.push(await chkGrayAt(ctx, video, o.at, CHK_DISTINCT_WIDTH, width, height));
  const out = [];
  for (let i = 1; i < openings.length; i++) out.push({ a: openings[i - 1].id, b: openings[i].id, diff: chkFrameDiff(frames[i - 1], frames[i]) });
  return out;
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
// matches the approved script (as the timeline's speech carries it: a transcribe step's heard words for
// on-camera speech, the voice's spoken lines for a voiceover). It orders nothing.
// It returns the server's reasons shape too, for the one local fix.
// 1.3.0 adds the style flags text_led (blank frames judged instead of dark
// ones), read_rate, cuts_between_words, cut_rate and retained_body (the
// content checks run only inside the first scene, a new opening spliced onto
// a kept body; the rest is not checked).
// 1.4.0 adds per-shot flags (a shot runs from one scene start to the next):
// captions_cross_cuts, min_shot, ambience_floor, cut_contrast and
// distinct_adjacent_shots. 1.4.2 hears a message's sound by its loudest
// 50 ms over the bed before it, so a levelled cut's short pops still count,
// and a measured taste check outside its range (length, loudness, pacing,
// stills, shots, cuts, captions across cuts, room tone, motion, a sparse
// text-led cut) warns instead of failing. What could not be measured, and
// what is broken or missing, still fails. 1.4.3 checks the speech line by
// line too (src/lines.mjs): a line that lost two words in a row, or a script
// that lost three, fails and names the scene, whatever the whole script's
// similarity. 1.5.0 fails a measured miss that breaks an earlier part's
// promise instead of warning: loudness off -14 LUFS on a cut the sound layer
// levelled, and a caption across a scene cut or into the end card when the
// captions layer stopped its captions there. A taste range still warns.
// 1.6.0 adds the final measurements (src/final-measure.mjs, the contract's
// gooseworks-final-measure/1): digital silence, steady tones, unplanned
// silence, planned pause and freeze caps, frozen picture and repeated shots.
// They fail on a custom, source-linked edit (the timeline links an
// assembly_timeline, or expect.final_measure is block) and warn on template
// videos for one release. The result is also returned as final_measure.
// 1.7.0 adds speech_rate_vs_reference (src/speech-rate.mjs): when the kit supplies both
// expect.reference_words and expect.final_words, the final cut's real words per second
// (reference_rate.py's count) fails more than 15 % below the reference's; otherwise it is
// not_applicable.
// 1.8.0 adds setup_count_vs_reference (src/setups.mjs): with expect.reference_setups, the
// final cut's distinct setups (shot keyframes clustered by dHash) fail more than 30 % below
// the reference's. And repeated_shot no longer lets a callback: intent clear a repeat on its
// own: the callback's name must be in expect.approved_callbacks.
// 1.9.0 adds speech the script does not have (src/speech-gaps.mjs, GOOSE-4034): speech_extra_words
// fails a transcript with words the script lacks (a repeated word or line, or made-up words), and the
// style flag no_unscripted_speech fails a voice between the timed scripted words, which the transcript
// never shows because Whisper drops sounds that are not words.

const TARGET_LUFS = -14;
const LUFS_TOLERANCE = 2;
const LENGTH_SLACK_S = 0.5;
// The server's limits for any finished video, with no slack: outside them the length fails, whatever the style.
const ANY_MIN_S = 1;
const ANY_MAX_S = 600;
const ASPECT_TOLERANCE = 0.02;
const MIN_SHORT_SIDE_PX = 720;
const BLACK_MAX_S = 0.3;
const OPENING_STILL_MAX_S = 1.5;
const HELD_PICTURE_MAX_S = 4.0;
// A held picture inside one scene is that scene's own still; one that runs this far past a scene start
// means the next scene never showed.
const SCENE_EDGE_S = 0.2;
// The server's line: at or below this a track is silence (ffmpeg reads digital silence as -70 LUFS).
const SILENT_LUFS = -60;
// The sound layer's line: above it every cut is levelled to -14 LUFS within 1 (the layer fails otherwise);
// at or below it the cut passes through as it was.
const LEVELLED_LUFS = -50;
const SERVER = new Set(['plays', 'length', 'size', 'sound', 'captions']);
// review-finished-ad: the platform bands at 1080x1920, the logo match floors and the favicon guard.
const PLATFORM_TOP = 220;
const PLATFORM_BOTTOM = 400;
const PLATFORM_RIGHT = 140;
const LOGO_MARK_MIN = 0.75;
const LOGO_IMAGE_MIN = 0.7;
const MIN_LOGO_LONG_SIDE = 256;
// logo-equation-card's measure_motion gate.
const FOOTAGE_MIN_MOTION = 1.5;
const NUM = '-?\\d+(?:\\.\\d+)?(?:e-?\\d+)?';
// Flags a machine measures here; any other flag is reported not_applicable (one that needs eyes, or one a
// later check layer measures: a style may declare a flag before its layer version is pinned).
const MEASURED_FLAGS = new Set(['logo_visible', 'footage_moves', 'sounds_match_messages', 'text_led', 'read_rate', 'cuts_between_words', 'cut_rate', 'retained_body', 'captions_cross_cuts', 'min_shot', 'ambience_floor', 'cut_contrast', 'distinct_adjacent_shots', 'no_unscripted_speech']);
const EYES_FLAGS = new Set(['text_legible', 'products_visible']);
// retained_body: the new opening starts the video (within this) and leaves at least this much kept body.
const RETAINED_START_MAX_S = 0.05;
const RETAINED_BODY_MIN_S = 0.05;

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
    const { stderr } = await ctx.tools.exec('ffmpeg', ['-hide_banner', '-nostats', '-nostdin', '-i', path, '-map', '0:a:0', '-af', 'ebur128=framelog=verbose', '-f', 'null', '-']);
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

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { video, timeline, expect } = inputs;
  const checks = [];
  const reasons = [];
  const add = (code, status, { message, expected, found, fix } = {}) => {
    const c = { code, status };
    // A failed or warned check carries its own plain words: the kit reports the first failed check's message.
    if (status === 'fail' || status === 'warn') c.message = message || 'The video did not pass one of the final checks.';
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
  if (d === null) add('length', 'fail', { message: "The video's length could not be measured.", expected: `${min} to ${max} seconds`, found: 'unknown' });
  else if (d < ANY_MIN_S || d > ANY_MAX_S) {
    add('length', 'fail', { message: d < ANY_MIN_S ? 'The video is too short.' : 'The video is too long.', expected: `${ANY_MIN_S} to ${ANY_MAX_S} seconds`, found: `${d.toFixed(1)} seconds` });
  } else if (d < min - LENGTH_SLACK_S || d > max + LENGTH_SLACK_S) {
    add('length', 'warn', { message: d < min ? 'The video is too short.' : 'The video is too long.', expected: `${min} to ${max} seconds`, found: `${d.toFixed(1)} seconds` });
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

  // Sound, as the server judges it: silence (no track, or one at or below -60 LUFS) passes only when nothing
  // is planned to sound: no speech, and no music or voice in the plan (expect.music and expect.voice, read when
  // the kit passes them). A track whose loudness cannot be read fails.
  const soundPlanned = expect.speech !== 'none' || expect.music === true || expect.voice === true;
  const read = m.has_audio ? await loudness(ctx, video.path) : null;
  const lufs = read !== null && Number.isFinite(read) ? read : null;
  const silent = !m.has_audio || (lufs !== null && lufs <= SILENT_LUFS);
  if (silent && !soundPlanned) add('sound', 'not_applicable', { found: m.has_audio ? 'silent' : 'no sound track' });
  else if (silent) {
    add('sound', 'fail', { message: 'The video has no sound.', expected: `${TARGET_LUFS} LUFS`, found: 'no sound', fix: { slot: 'sound' } });
  } else if (lufs === null) {
    add('sound', 'fail', { message: "The sound's loudness could not be measured.", expected: `${TARGET_LUFS} LUFS`, found: 'no reading', fix: { slot: 'sound' } });
  } else if (Math.abs(lufs - TARGET_LUFS) > LUFS_TOLERANCE) {
    // Off the mark after the sound layer levelled it is that layer's broken promise, not a taste call. Only
    // a kit that names the layer switches says the sound layer ran; without them it stays a taste warning.
    const levelled = !!(expect.layers && typeof expect.layers === 'object' && expect.layers.sound === true) && lufs > LEVELLED_LUFS;
    const said = { message: lufs < TARGET_LUFS ? 'The sound is too quiet.' : 'The sound is too loud.', expected: `${TARGET_LUFS} LUFS`, found: `${lufs.toFixed(1)} LUFS` };
    if (levelled) add('sound', 'fail', { ...said, fix: { slot: 'sound' } });
    else add('sound', 'warn', said);
  } else add('sound', 'pass', { found: `${lufs.toFixed(1)} LUFS` });

  if (!expect.captions) add('captions', 'not_applicable');
  else if ((await cueCount(ctx, inputs.words, d)) === 0) {
    add('captions', 'fail', { message: 'The captions are missing.', expected: 'captions for the spoken lines', found: 'none', fix: { slot: 'captions' } });
  } else add('captions', 'pass');

  const flags = expect.qc_flags || [];
  // retained_body: a new opening (the first scene) spliced onto a body kept as it was. The content checks
  // (black and frozen frames, captions placement, logo, speech against the script, the measured flags) run
  // only inside the opening; the kept body is not judged. With no first scene marked, nothing is checked
  // and the flag fails: the opening cannot be told from the body.
  // The opening counts as marked only when the first scene starts the video and ends inside it, with a
  // kept body after it; anything else (no scene, one that starts later or covers the whole cut) fails the flag.
  const retained = flags.includes('retained_body');
  const hook = retained ? (timeline.scenes || [])[0] : null;
  const hookMarked = !!hook && hook.start_s <= RETAINED_START_MAX_S && hook.end_s > hook.start_s && hook.end_s < d - RETAINED_BODY_MIN_S;
  const contentEnd = !retained ? d : hookMarked ? hook.end_s : 0;
  const notChecked = 'kept body; only the new opening is checked';

  const { freezes: allFreezes, blacks: allBlacks } = await analyse(ctx, video.path, d);
  const freezes = retained ? chkClipSpans(allFreezes, contentEnd) : allFreezes;
  const blacks = retained ? chkClipSpans(allBlacks, contentEnd) : allBlacks;
  // text_led: a text-on-colour style (kinetic text) judges blank frames (black or one flat colour, no
  // text) instead of dark ones, so a dark beat with a little text on it is not black.
  const textLed = flags.includes('text_led');
  let blank = null;
  if (textLed && contentEnd > 0) {
    const samples = await chkBlankFrames(ctx, video.path, m.width, m.height, contentEnd);
    blank = { samples: samples.length, ...chkJudgeBlank(chkBlankSpans(samples), samples.length) };
  }
  if (retained && contentEnd <= 0) add('black_frames', 'not_applicable', { found: notChecked });
  else if (blank) {
    const s = blank.span;
    if (s) add('black_frames', 'fail', { message: `Blank frames from ${s.start_s.toFixed(1)} to ${s.end_s.toFixed(1)} seconds ${s.where}.`, expected: `no blank stretch over ${s.limit} s ${s.where}`, found: +(s.end_s - s.start_s).toFixed(2) });
    else add('black_frames', 'pass', { found: +blank.total_s.toFixed(2) });
  } else {
    const black = blacks.find(([s, e]) => e - s > BLACK_MAX_S);
    if (black) add('black_frames', 'fail', { message: `Black frames from ${black[0].toFixed(1)} to ${black[1].toFixed(1)} seconds.`, expected: `no black stretch over ${BLACK_MAX_S} s`, found: +(black[1] - black[0]).toFixed(2) });
    else add('black_frames', 'pass');
  }

  const bodyEnd = Math.min(timeline.end_card ? timeline.end_card.start_s : d, contentEnd);
  const opening = freezes.find(([s, e]) => s <= 0.3 && e - s > OPENING_STILL_MAX_S);
  // A still scene may hold as long as it lasts, unless the style asks for moving footage or the timeline
  // names no scenes: then any hold over the limit fails, as does one that runs on past a scene start.
  const strictHold = flags.includes('footage_moves') || !(timeline.scenes || []).length;
  const sceneStarts = (timeline.scenes || []).map((sc) => sc.start_s).filter((t) => t < contentEnd);
  const held = freezes.find(([s, e]) => {
    const end = Math.min(e, bodyEnd);
    if (!(s < bodyEnd && end - s > HELD_PICTURE_MAX_S)) return false;
    return strictHold || sceneStarts.some((t) => s < t - SCENE_EDGE_S && end > t + SCENE_EDGE_S);
  });
  if (retained && contentEnd <= 0) add('frozen_frames', 'not_applicable', { found: notChecked });
  else if (opening) add('frozen_frames', 'warn', { message: `The opening picture is still for ${(opening[1] - opening[0]).toFixed(1)} seconds.`, expected: `the opening moves within ${OPENING_STILL_MAX_S} s`, found: +(opening[1] - opening[0]).toFixed(2) });
  else if (held) add('frozen_frames', 'warn', { message: `The picture is frozen from ${held[0].toFixed(1)} to ${held[1].toFixed(1)} seconds.`, expected: `no held picture over ${HELD_PICTURE_MAX_S} s before the end card`, found: +(Math.min(held[1], bodyEnd) - held[0]).toFixed(2) });
  else add('frozen_frames', 'pass');

  // The brand layer and the end-card and phone-chat parts mark the card they add; a frame page that
  // draws its own ending does not, and then there is nothing to measure here.
  const card = timeline.end_card;
  if (!expect.end_card) add('end_card', 'not_applicable');
  else if (!card) {
    // The style ends on an end card, but no step marked one in the timeline: it cannot be shown to be there.
    add('end_card', 'fail', { message: 'The video does not end on the brand end card.', expected: 'an end card marked in the timeline', found: 'not marked by any step', fix: { slot: 'brand' } });
  } else if (card.end_s - card.start_s >= 0.5 && Math.abs(card.end_s - d) <= 0.2) add('end_card', 'pass');
  else add('end_card', 'fail', { message: 'The video does not end on the brand end card.', expected: 'an end card of at least 0.5 s at the end', found: `${card.start_s}-${card.end_s} s`, fix: { slot: 'brand' } });

  // Captions inside the caption safe zone and clear of the platform controls (TikTok/Reels bands).
  const record = await wordsRecord(inputs.words);
  const boxes = record ? (record.cues || []).filter((c) => c.box && (!retained || c.start_s < contentEnd)) : [];
  if (!boxes.length) add('captions_safe_zone', 'not_applicable');
  else {
    const zone = safeZone(timeline, m.width, m.height);
    const out = boxes.find((c) => c.box.x < zone.left - 0.5 || c.box.y < zone.top - 0.5 || c.box.x + c.box.w > zone.right + 0.5 || c.box.y + c.box.h > zone.bottom + 0.5);
    if (out) add('captions_safe_zone', 'fail', { message: `The caption "${out.text}" leaves the safe zone.`, expected: `inside x ${Math.round(zone.left)}-${Math.round(zone.right)}, y ${Math.round(zone.top)}-${Math.round(zone.bottom)}`, found: `${Math.round(out.box.x)},${Math.round(out.box.y)} ${Math.round(out.box.w)}x${Math.round(out.box.h)}`, fix: { slot: 'captions' } });
    else add('captions_safe_zone', 'pass');
  }

  // The brand's real logo file (review-finished-ad's logo and favicon checks), measured two ways that never
  // share an answer: `logo` on the end card when the style ends on one, and `flag:logo_visible` anywhere in
  // the video (the card included) when the style asks for it. When a step declared the box it drew the logo
  // in, the match runs in that box at full resolution. Without one the whole frame is searched at low
  // resolution, which misses a small, badged or tilted logo: then a miss is a warning unless the brand layer,
  // the one fix it could name, is on (the kit does not say yet, so expect.layers is read when it comes).
  const wantsLogo = flags.includes('logo_visible');
  const logo = inputs.brand.logo;
  const logoZone = (timeline.safe_zones || []).find((z) => z.use === 'logo' && z.w > 0 && z.h > 0);
  const brandSlotOn = !!(expect.layers && typeof expect.layers === 'object' && expect.layers.brand === true);
  let logoSize = null;
  let logoResolutionChecked = false;
  const logoCheck = async (times) => {
    const at = times.filter((t) => t > 0 && t < d && (!retained || t < contentEnd));
    // retained_body: the logo is looked for only inside the new opening.
    if (retained && !at.length) return { status: 'not_applicable', found: notChecked };
    if (!logo) return { status: 'fail', message: 'The style asks for the logo, but the brand has no logo file.', expected: 'a logo file', found: 'none' };
    logoSize = logoSize || (logo.width && logo.height ? logo : await ctx.tools.probe(logo.path));
    const long = Math.max(logoSize.width || 0, logoSize.height || 0);
    // Resolution is advice, never a reason to repair or block a visible logo.
    // Wide wordmarks can have a small area while meeting the long-side recommendation.
    if (!logoResolutionChecked && long < MIN_LOGO_LONG_SIDE) {
      add('logo_resolution', 'warn', { message: 'The logo file is small and may look blurry.', expected: `at least ${MIN_LOGO_LONG_SIDE} px on the long side recommended`, found: `${logoSize.width}x${logoSize.height}` });
    }
    logoResolutionChecked = true;
    if (logoZone) {
      const z = logoZone;
      const match = await kitLogoScoreInBox(ctx, video.path, logo, at, m.width, m.height, z);
      const floor = match.mode === 'mark' ? LOGO_MARK_MIN : LOGO_IMAGE_MIN;
      if (match.score < floor) {
        return { status: 'fail', message: "The brand's logo is not clear where the video draws it.", expected: `a match of at least ${floor} inside x ${z.x}-${z.x + z.w}, y ${z.y}-${z.y + z.h}`, found: match.score };
      }
      return { status: 'pass', found: match.score };
    }
    const match = await kitLogoScore(ctx, video.path, logo, at, m.width, m.height);
    const floor = match.mode === 'mark' ? LOGO_MARK_MIN : LOGO_IMAGE_MIN;
    if (match.score < floor) {
      return { status: brandSlotOn ? 'fail' : 'warn', message: "The brand's logo is not found.", expected: `a match of at least ${floor}`, found: match.score };
    }
    return { status: 'pass', found: match.score };
  };
  const logoAdd = (code, result) => {
    const { status, ...rest } = result;
    if (status === 'fail') return add(code, status, { ...rest, fix: { slot: 'brand' } });
    if (status === 'warn') return add(code, status, rest);
    return add(code, status, { found: rest.found });
  };
  if (expect.end_card && logo) {
    const card = timeline.end_card;
    logoAdd('logo', await logoCheck(card ? [card.start_s + (card.end_s - card.start_s) * 0.5, card.end_s - 0.2] : [d - 1.2, d - 0.6, d - 0.2]));
  } else add('logo', 'not_applicable');
  // Spread over the whole video (the new opening only, for retained_body), and the end card's middle when
  // there is one.
  const visibleTimes = [0.05, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 0.98].map((f) => f * contentEnd);
  if (timeline.end_card) visibleTimes.push((timeline.end_card.start_s + timeline.end_card.end_s) / 2);
  const logoVisible = wantsLogo ? await logoCheck(visibleTimes) : null;

  // The speech the content checks see: every entry, or for retained_body what was said inside the opening
  // (an entry running on into the kept body is cut to its timed words; one with no word timings cannot be
  // cut, so the speech checks are not run).
  const hookSpeech = retained ? chkSpeechBefore(timeline.speech, contentEnd) : null;
  const speech = hookSpeech ? hookSpeech.speech : timeline.speech || [];
  const speechCrosses = !!hookSpeech && hookSpeech.crossing;
  const crossNote = 'speech runs on past the new opening with no word timings';

  // The style's own checks (qc_flags). The ones a machine can measure are measured and count toward the
  // verdict; the rest (text legible, products visible, or a flag a later check layer measures) are reported
  // as not checked here.
  for (const flag of flags) {
    const code = `flag:${flag}`;
    if (!MEASURED_FLAGS.has(flag)) add(code, 'not_applicable', { found: EYES_FLAGS.has(flag) ? 'needs eyes; not checked by machine' : 'not measured by this check layer' });
    else if (flag === 'logo_visible') logoAdd(code, logoVisible);
    else if (retained && contentEnd <= 0 && flag !== 'retained_body') add(code, 'not_applicable', { found: notChecked });
    else if (flag === 'footage_moves') {
      const motion = await kitMotion(ctx, video.path, bodyEnd);
      if (motion === null) add(code, 'fail', { message: 'The footage could not be measured.', expected: `motion of at least ${FOOTAGE_MIN_MOTION}`, found: 'no frames' });
      else if (motion >= FOOTAGE_MIN_MOTION) add(code, 'pass', { found: motion });
      else add(code, 'warn', { message: 'The footage reads as a still photo.', expected: `motion of at least ${FOOTAGE_MIN_MOTION}`, found: motion });
    } else if (flag === 'sounds_match_messages') {
      // Every message arrival before the end card (or the kept body), the opening's included.
      const starts = [];
      for (const t of (timeline.scenes || []).map((sc) => sc.start_s).sort((a, b) => a - b)) if (t >= 0 && t < bodyEnd - 1e-3 && !starts.some((u) => Math.abs(u - t) < 1e-3)) starts.push(t);
      if (!starts.length) add(code, 'not_applicable');
      else {
        const windows = chkMessageWindows(starts, bodyEnd);
        const levels = await kitWindowLevels(ctx, video.path, windows.flatMap((w) => [...w.cue, ...w.bed]));
        let at = 0;
        const rises = windows.map((w) => chkMessageRise(levels.slice(at, (at += w.cue.length)), levels.slice(at, (at += w.bed.length))));
        const silentAt = starts.find((t, i) => !(rises[i].cue > -50 && rises[i].rise >= CHK_MSG_RISE_DB));
        if (silentAt === undefined) add(code, 'pass', { found: starts.length });
        else add(code, 'fail', { message: `No sound when the message at ${silentAt.toFixed(2)} s appears.`, expected: 'a sound with every message', found: `${silentAt.toFixed(2)} s` });
      }
    } else if (flag === 'no_unscripted_speech') {
      // A voice where no scripted word is timed: babble the transcript cannot show (GOOSE-4034).
      const timed = speech.flatMap((s) => s.words || []);
      const untimed = speech.some((s) => !(s.words || []).length && /[\p{L}\p{N}]/u.test(typeof s.spoken === 'string' ? s.spoken : s.text || ''));
      if (expect.speech !== 'on_camera') add(code, 'not_applicable', { found: 'no on-camera speech' });
      else if (speechCrosses) add(code, 'not_applicable', { found: crossNote });
      else if (!m.has_audio) add(code, 'not_applicable', { found: 'no audio track' });
      else if (!timed.length || untimed) add(code, 'not_applicable', { found: 'no word timings for every line' });
      else {
        const found = chkUnscriptedVoice(await chkVoiceBandLevels(ctx, video.path, bodyEnd), CHK_GAP_WINDOW_S, timed, bodyEnd);
        if (!found) add(code, 'not_applicable', { found: 'too little timed speech to set a voice level' });
        else if (found.loud.length) {
          const g = found.loud[0];
          add(code, 'fail', {
            message: `Someone speaks from ${g.start_s.toFixed(1)} to ${g.end_s.toFixed(1)} seconds, where the script has no words: the take adds words of its own.`,
            expected: 'no voice outside the scripted words',
            found: found.loud.map((l) => `${l.start_s.toFixed(1)}-${l.end_s.toFixed(1)} s`).join(', '),
          });
        } else add(code, 'pass', { found: found.gaps.length });
      }
    } else if (flag === 'text_led') {
      // The blank stretches themselves are judged in black_frames; here, how much of the video is blank.
      if (!blank) {
        add(code, 'not_applicable', { found: 'no picture to sample' });
        continue;
      }
      const share = `under ${Math.round(CHK_BLANK_MAX_SHARE * 100)} % of the video blank, with text on screen`;
      if (blank.whole) add(code, 'fail', { message: 'The whole video is blank: no text on screen.', expected: share, found: 1 });
      else if (blank.share >= CHK_BLANK_MAX_SHARE - 1e-9) add(code, 'warn', { message: `The video is blank for ${blank.total_s.toFixed(1)} of ${blank.picture_s.toFixed(1)} seconds.`, expected: share, found: +blank.share.toFixed(3) });
      else add(code, 'pass', { found: +blank.share.toFixed(3) });
    } else if (flag === 'read_rate') {
      const rate = chkReadRate(speech, contentEnd);
      const expected = `${CHK_READ_MIN_WPS} to ${CHK_READ_MAX_WPS} words a second`;
      if (speechCrosses) add(code, 'not_applicable', { found: crossNote });
      else if (!rate) add(code, 'not_applicable', { found: 'no speech' });
      else if (rate.wps < CHK_READ_MIN_WPS - 1e-9) add(code, 'warn', { message: `The voice reads too slowly: ${rate.wps.toFixed(2)} words a second.`, expected, found: +rate.wps.toFixed(3) });
      else if (rate.wps > CHK_READ_MAX_WPS + 1e-9) add(code, 'warn', { message: `The voice reads too fast: ${rate.wps.toFixed(2)} words a second.`, expected, found: +rate.wps.toFixed(3) });
      else add(code, 'pass', { found: +rate.wps.toFixed(3) });
    } else if (flag === 'cuts_between_words') {
      // Word timings from the speech entries, else the captions layer's words.
      // Word timings from the speech entries when every entry has them, else the captions layer's words
      // (a full record of what was said), else whatever partial timings the speech carries.
      const spoken = speech.filter((s) => (s.words || []).length || /[\p{L}\p{N}]/u.test(typeof s.spoken === 'string' ? s.spoken : s.text || ''));
      const fromSpeech = spoken.flatMap((s) => s.words || []);
      const fromCaptions = record && Array.isArray(record.words) ? record.words.filter((w) => w && Number.isFinite(w.start_s) && Number.isFinite(w.end_s) && (!retained || w.start_s < contentEnd)) : [];
      const words = !speechCrosses && spoken.every((s) => (s.words || []).length) && fromSpeech.length ? fromSpeech : fromCaptions.length ? fromCaptions : fromSpeech;
      const cuts = chkCuts(timeline.scenes, contentEnd);
      if (timeline.end_card && timeline.end_card.start_s < contentEnd && !cuts.some((t) => Math.abs(t - timeline.end_card.start_s) < 1e-3)) cuts.push(timeline.end_card.start_s);
      if (!words.length) add(code, 'not_applicable', { found: 'no word timings' });
      else if (!cuts.length) add(code, 'not_applicable', { found: 'no cuts' });
      else {
        const inside = chkCutInsideWord(cuts, words);
        if (inside) add(code, 'warn', { message: `A cut at ${inside.t.toFixed(2)} seconds falls inside the word "${inside.word.text}".`, expected: 'every cut between two words', found: `${inside.t.toFixed(2)} s` });
        else add(code, 'pass', { found: cuts.length });
      }
    } else if (flag === 'cut_rate') {
      // Cuts per second of the body: the end card is not counted.
      const expected = `${CHK_CUT_MIN_RATE} to ${CHK_CUT_MAX_RATE} cuts a second, the end card not counted`;
      if (!(timeline.scenes || []).length) add(code, 'not_applicable', { found: 'no scenes in the timeline' });
      else if (!(bodyEnd > 0)) add(code, 'not_applicable', { found: 'no body before the end card' });
      else {
        const rate = chkCuts(timeline.scenes, bodyEnd).length / bodyEnd;
        if (rate < CHK_CUT_MIN_RATE - 1e-9) add(code, 'warn', { message: `The cuts come too slowly: ${rate.toFixed(2)} a second.`, expected, found: +rate.toFixed(3) });
        else if (rate > CHK_CUT_MAX_RATE + 1e-9) add(code, 'warn', { message: `The cuts come too fast: ${rate.toFixed(2)} a second.`, expected, found: +rate.toFixed(3) });
        else add(code, 'pass', { found: +rate.toFixed(3) });
      }
    } else if (flag === 'retained_body') {
      if (contentEnd <= 0) {
        const found = !hook ? 'no first scene' : `first scene ${hook.start_s.toFixed(2)}-${hook.end_s.toFixed(2)} s in a ${d.toFixed(2)} s video`;
        add(code, 'fail', { message: 'The new opening is not marked, so it cannot be told from the kept video.', expected: 'the new opening as the first scene, starting the video and followed by the kept video', found });
      }
      else add(code, 'pass', { found: `checked 0-${contentEnd.toFixed(2)} s; ${contentEnd.toFixed(2)}-${d.toFixed(2)} s kept, not checked` });
    } else if (flag === 'captions_cross_cuts') {
      // A cue may run 0.15 s past a cut either side; one that runs further on both sides spans the cut. The
      // end card's start counts as a cut (no caption runs on into the card), and for retained_body so does
      // the join between the new opening and the kept video.
      const cues = record ? (record.cues || []).filter((c) => String(c.text || '').trim() && Number.isFinite(c.start_s) && Number.isFinite(c.end_s) && c.end_s > c.start_s && c.start_s < contentEnd) : [];
      const cuts = chkCuts(timeline.scenes, d).filter((t) => t <= contentEnd + 1e-6);
      const card = timeline.end_card && timeline.end_card.start_s > 0 && timeline.end_card.start_s < contentEnd ? timeline.end_card.start_s : null;
      if (card !== null && !cuts.some((t) => Math.abs(t - card) < 1e-3)) cuts.push(card);
      // The captions layer stops every caption at a scene cut and at the end card when the style lists this
      // flag; the join into a retained body is not a cut it knows, so a caption across it only warns.
      const promised = [...cuts];
      const join = retained && contentEnd < d ? contentEnd : null;
      if (join !== null && !cuts.some((t) => Math.abs(t - join) < 1e-3)) cuts.push(join);
      if (!cues.length) add(code, 'not_applicable', { found: 'no captions' });
      else if (!cuts.length) add(code, 'not_applicable', { found: 'no cuts' });
      else {
        const broken = chkCueAcrossCut(cues, promised);
        const across = broken || chkCueAcrossCut(cues, cuts);
        const said = across && { message: `The caption "${across.cue.text}" runs on across the cut at ${across.t.toFixed(2)} seconds.`, expected: `every caption inside one shot (${CHK_CUE_GUARD_S} s allowed either side of a cut)`, found: `${across.cue.start_s.toFixed(2)}-${across.cue.end_s.toFixed(2)} s` };
        if (broken) add(code, 'fail', { ...said, fix: { slot: 'captions' } });
        else if (across) add(code, 'warn', said);
        else add(code, 'pass', { found: cues.length });
      }
    } else if (flag === 'min_shot') {
      const shots = chkShots(timeline.scenes, bodyEnd);
      if (!(timeline.scenes || []).length) add(code, 'not_applicable', { found: 'no scenes in the timeline' });
      else if (!shots.length) add(code, 'not_applicable', { found: 'no body before the end card' });
      else {
        const short = chkShortShot(shots);
        if (short) add(code, 'warn', { message: `A shot from ${short.start_s.toFixed(2)} to ${short.end_s.toFixed(2)} seconds is too short to read.`, expected: `every shot at least ${CHK_MIN_SHOT_S} s`, found: +short.seconds.toFixed(3) });
        else add(code, 'pass', { found: +Math.min(...shots.map(([a, b]) => b - a)).toFixed(3) });
      }
    } else if (flag === 'ambience_floor') {
      // The room tone under each shot (its quietest windows) sits in the band, and the speech over it stays
      // clear of it. No scenes: the body is one shot.
      const shots = chkShots(timeline.scenes, bodyEnd);
      const windows = shots.map(chkFloorWindows);
      if (!windows.some((w) => w.length)) add(code, 'not_applicable', { found: 'no shot long enough to measure' });
      else {
        const levels = m.has_audio ? await kitWindowLevels(ctx, video.path, windows.flat()) : windows.flat().map(() => -Infinity);
        const spoken = chkSpeechSpans(speech);
        let k = 0;
        const sounds = windows.map((w) => {
          const own = levels.slice(k, k + w.length);
          k += w.length;
          return w.length ? chkShotSound(w, own, spoken) : { floor: null, speech: null };
        });
        const bad = chkJudgeAmbience(shots, sounds);
        const band = `room tone from ${CHK_FLOOR_MIN_DB} to ${CHK_FLOOR_MAX_DB} dB under every shot, speech at least ${CHK_FLOOR_SPEECH_GAP_DB} dB above it`;
        const where = bad ? `from ${bad.shot[0].toFixed(1)} to ${bad.shot[1].toFixed(1)} seconds` : '';
        if (!bad) add(code, 'pass', { found: +Math.min(...sounds.filter((x) => x.floor !== null).map((x) => x.floor)).toFixed(1) });
        else if (bad.problem === 'silent') add(code, 'warn', { message: `There is no room tone ${where}: the sound drops to silence.`, expected: band, found: 'silent' });
        else if (bad.problem === 'low') add(code, 'warn', { message: `The room tone is too quiet ${where}.`, expected: band, found: +bad.floor.toFixed(1) });
        else if (bad.problem === 'high') add(code, 'warn', { message: `The background noise is too loud ${where}.`, expected: band, found: +bad.floor.toFixed(1) });
        else add(code, 'warn', { message: `The speech does not stand out from the background noise ${where}.`, expected: band, found: +(bad.speech - bad.floor).toFixed(1) });
      }
    } else if (flag === 'cut_contrast') {
      // Each cut must read as a cut: the frames 80 ms either side differ enough (a reframe of the same
      // shot, or two dark shots, reads as a jump). The end card's start is not judged.
      const cuts = chkCuts(timeline.scenes, bodyEnd);
      if (!cuts.length) add(code, 'not_applicable', { found: 'no cuts' });
      else {
        const all = await chkCutContrast(ctx, video.path, cuts, m.width, m.height, d);
        const measured = all.filter((c) => c.diff !== null);
        const unread = all.find((c) => c.diff === null);
        const worst = measured.reduce((a, c) => (!a || c.diff < a.diff ? c : a), null);
        const expected = `a frame difference of at least ${CHK_CONTRAST_MIN} (${CHK_CONTRAST_WARN} to be safe) ${CHK_CONTRAST_OFFSET_S} s either side of every cut`;
        if (!worst) add(code, 'fail', { message: 'The frames either side of the cuts could not be read.', expected, found: 'no frames' });
        else if (worst.diff < CHK_CONTRAST_MIN - 1e-9) add(code, 'warn', { message: `The cut at ${worst.t.toFixed(2)} seconds barely changes the picture, so it reads as a jump.`, expected, found: +worst.diff.toFixed(2) });
        else if (worst.diff < CHK_CONTRAST_WARN - 1e-9) add(code, 'warn', { message: `The cut at ${worst.t.toFixed(2)} seconds changes the picture only a little.`, expected, found: +worst.diff.toFixed(2) });
        // Every cut must be judged before the flag passes; a cut whose frames could not be read is a warning.
        else if (unread) add(code, 'warn', { message: `The frames either side of the cut at ${unread.t.toFixed(2)} seconds could not be read, so it was not checked.`, expected, found: `${measured.length} of ${all.length} cuts checked` });
        else add(code, 'pass', { found: +worst.diff.toFixed(2) });
      }
    } else if (flag === 'distinct_adjacent_shots') {
      // Two scenes in a row must not open on the same picture (the same clip shown twice).
      const openings = chkSceneOpenings(timeline.scenes, bodyEnd);
      if (openings.length < 2) add(code, 'not_applicable', { found: 'fewer than two scenes' });
      else {
        const all = await chkAdjacentDiffs(ctx, video.path, openings, m.width, m.height);
        const diffs = all.filter((p) => p.diff !== null);
        const unread = all.find((p) => p.diff === null);
        const same = diffs.find((p) => p.diff < CHK_DISTINCT_MIN - 1e-9);
        const expected = `the opening frames of two scenes in a row differ by at least ${CHK_DISTINCT_MIN}`;
        if (!diffs.length) add(code, 'fail', { message: 'The opening frames of the scenes could not be read.', expected, found: 'no frames' });
        else if (same) add(code, 'warn', { message: `Scenes ${same.a} and ${same.b} open on the same picture.`, expected, found: +same.diff.toFixed(2) });
        // Every pair must be judged before the flag passes; a pair whose frames could not be read is a warning.
        else if (unread) add(code, 'warn', { message: `The opening frames of scenes ${unread.a} and ${unread.b} could not be read, so they were not compared.`, expected, found: `${diffs.length} of ${all.length} pairs checked` });
        else add(code, 'pass', { found: +Math.min(...diffs.map((p) => p.diff)).toFixed(2) });
      }
    }
  }

  const script = (expect.script || []).map((s) => String(s).trim()).filter(Boolean);
  // What was said: each speech entry's `spoken` (a transcribe step's heard words, or the voice's spoken
  // form), else its text for a voice that said exactly its line. On-camera speech must have been
  // transcribed by a step before the layers: this layer orders nothing.
  const untranscribed = expect.speech === 'on_camera' && (!speech.length || speech.some((s) => typeof s.spoken !== 'string'));
  // The review speech_extra_words reads after the speech check, when that check compared anything.
  let extraReview = null;
  if (!script.length || expect.speech === 'none') add('speech_matches_script', 'not_applicable');
  else if (speechCrosses) add('speech_matches_script', 'not_applicable', { found: crossNote });
  else if (retained && !speech.length) add('speech_matches_script', 'not_applicable', { found: notChecked });
  else if (untranscribed) {
    add('speech_matches_script', 'fail', { message: 'The on-camera speech was not transcribed, so it cannot be checked against the script.', expected: 'a transcribe step before the layers', found: 'no transcript' });
  } else {
    const heard = speech.map((s) => (typeof s.spoken === 'string' ? s.spoken : s.text)).join(' ');
    const aliases = usableAliases(ctx, inputs.brand.pronunciations);
    // retained_body: only the opening is heard here, so only its line (the plan's first) is compared.
    const reviewed = (retained ? script.slice(0, 1) : script).join(' ');
    const verdict = speechReview(reviewed, heard, { aliases });
    const worst = verdict.issues.find((i) => i.severity === 'high') || verdict.issues.find((i) => i.severity !== 'low');
    // A lost phrase fails even when the whole script clears its bar: it was cut where two takes join, or never said.
    const lineLoss = chkLineLoss(speech, aliases);
    const scriptLoss = lineLoss ? null : chkScriptLoss(verdict, speechTokenize(reviewed, aliases));
    const why = 'they were cut where two recordings join, or never said.';
    // Numbered as the approved script's lines, which the customer saw; scenes can be dropped or added by the cut.
    const quote = (text) => {
      const words = String(text).replace(/[.!?]+/g, '').split(/\s+/).filter(Boolean);
      return words.length > 6 ? `${words.slice(0, 6).join(' ')}…` : words.join(' ');
    };
    extraReview = { verdict, scriptWords: speechTokenize(reviewed, aliases), heardWords: speechTokenize(heard, aliases), quote };
    if (lineLoss) {
      const want = speechTokenize(lineLoss.line, aliases).join(' ');
      const same = script.flatMap((l, i) => (speechTokenize(l, aliases).join(' ') === want ? [i] : []));
      const at = same.length ? same[Math.min(lineLoss.occurrence, same.length - 1)] : -1;
      add('speech_matches_script', 'fail', { message: `Line ${at >= 0 ? at + 1 : lineLoss.index + 1} of the script is missing the words "${quote(lineLoss.text)}": ${why}`, expected: 'every approved word of every line', found: +verdict.ratio.toFixed(3) });
    } else if (scriptLoss) {
      add('speech_matches_script', 'fail', { message: `The speech is missing the words "${quote(scriptLoss.text)}": ${why}`, expected: 'every approved word of every line', found: +verdict.ratio.toFixed(3) });
    } else if (verdict.passed) add('speech_matches_script', 'pass', { found: +verdict.ratio.toFixed(3) });
    else {
      add('speech_matches_script', 'fail', {
        message: worst ? `The speech differs from the approved script: ${worst.note}` : 'The speech differs from the approved script.',
        expected: 'the approved lines, as written',
        found: +verdict.ratio.toFixed(3),
      });
    }
  }

  // Words heard that the script does not have (1.9.0, GOOSE-4034). The similarity bar lets a few through:
  // a take that said "glugging" twice scored 0.984 and passed.
  if (!extraReview) add('speech_extra_words', 'not_applicable', { found: untranscribed ? 'no transcript' : 'no speech checked against a script' });
  else {
    const { verdict, scriptWords, heardWords, quote } = extraReview;
    const extra = chkExtraWords(verdict, scriptWords, heardWords);
    if (!extra) add('speech_extra_words', 'pass');
    else {
      add('speech_extra_words', 'fail', {
        message: extra.repeat
          ? `The speech says "${quote(extra.text)}" again: the take repeats words the script says once.`
          : `The speech has words that are not in the script: "${quote(extra.text)}".`,
        expected: 'only the approved lines, each said once',
        found: extra.text,
      });
    }
  }

  // The final cut's speaking rate against the reference's, when both word lists are supplied.
  const rate = chkSpeechRateVsReference(expect.reference_words, expect.final_words);
  add('speech_rate_vs_reference', rate.status, { message: rate.message, expected: rate.expected, found: rate.found });

  // The final measurements: blocking on a custom, source-linked edit, warnings on a template video.
  const assembly = timeline.assembly_timeline && typeof timeline.assembly_timeline === 'object' ? timeline.assembly_timeline : null;
  const block = expect.final_measure ? expect.final_measure === 'block' : !!assembly;
  let finalMeasure = null;
  if (retained) {
    for (const id of ['digital_silence', 'tone_only', 'unplanned_silence', 'planned_pause_too_long', 'frozen_picture', 'planned_freeze_too_long', 'repeated_shot']) add(id, 'not_applicable', { found: notChecked });
  } else if (d !== null) {
    const measured = await fmMeasure(ctx, { duration_s: d, has_audio: m.has_audio, path: video.path }, { timeline, expect, assembly });
    for (const c of measured) {
      if (c.result === 'fail') add(c.id, block ? 'fail' : 'warn', { message: fmMessage(c, block), found: c.detail });
      else add(c.id, c.result, { found: c.detail });
    }
    finalMeasure = fmRecord(video, d, measured);
  }

  // Distinct setups against the reference's, when the kit supplies the reference's count.
  if (retained || d === null) add('setup_count_vs_reference', 'not_applicable', { found: retained ? notChecked : 'no measured length' });
  else {
    const setups = await chkSetupCount(ctx, video.path, d, { assembly, timeline, expect });
    add('setup_count_vs_reference', setups.status, { message: setups.message, expected: setups.expected, found: setups.found });
  }

  const pass = checks.every((c) => c.status !== 'fail');
  ctx.log.info('check layer verdict', {
    pass,
    failed: checks.filter((c) => c.status === 'fail').map((c) => c.code),
    warned: checks.filter((c) => c.status === 'warn').map((c) => c.code),
    server_failed: reasons.filter((r) => SERVER.has(r.check)).length,
  });
  return kitCheckOutputs(ctx, manifest, { verdict: { pass, checks, reasons }, ...(finalMeasure ? { final_measure: finalMeasure } : {}) });
}
