// Built from transcribe-whisper/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- _lib/heard.mjs ----
// Written lines placed on heard words (caption-burn's matching): each written
// word is looked for among the next five heard words; a line is placed when at
// least two thirds of its words are found, and a word the transcript writes
// differently ("200" for "two hundred") sits between its found neighbours.
// Shared by the captions layer and the transcribe part.
// Every top-level name starts with `kitHeard`.

/** A word reduced for matching: letters, digits and apostrophes, lower case. */
function kitHeardKey(w) {
  return String(w).replace(/[^\p{L}\p{N}']/gu, '').toLowerCase();
}

/** fal Whisper's word chunks as [{text, start, end, key}], dropping untimed ones. */
function kitHeardWords(json) {
  const chunks = (json && json.chunks) || [];
  return chunks
    .map((c) => ({ text: String(c.text || '').trim(), start: c.timestamp && c.timestamp[0], end: c.timestamp && c.timestamp[1] }))
    .filter((w) => w.text && Number.isFinite(w.start) && Number.isFinite(w.end))
    .map((w) => ({ ...w, key: kitHeardKey(w.text) }));
}

/**
 * `text`'s written words with times from `heard`, searching from index `from`;
 * `start`/`end` bound the words found at neither edge. Returns
 * { words: [{text, start_s, end_s}], next } or null when too few words match.
 */
function kitHeardPlace(text, start, end, heard, from) {
  const words = String(text).split(/\s+/).filter(Boolean);
  let j = from;
  const spans = words.map((w) => {
    const k = kitHeardKey(w);
    let hit = null;
    for (let x = j; x < Math.min(j + 5, heard.length); x++) {
      if (heard[x].key === k) {
        hit = x;
        break;
      }
    }
    if (hit === null) return null;
    j = hit + 1;
    return { start: heard[hit].start, end: heard[hit].end };
  });
  const known = spans.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
  if (!words.length || known.length < Math.max(1, Math.floor((words.length * 2) / 3))) return null;
  for (let i = 0; i < spans.length; i++) {
    if (spans[i]) continue;
    const lo = Math.max(-1, ...known.filter((k) => k < i));
    const upList = known.filter((k) => k > i);
    const up = upList.length ? Math.min(...upList) : null;
    const t0 = lo >= 0 ? spans[lo].end : start;
    const t1 = up !== null ? spans[up].start : end;
    const gap = (up !== null ? up : words.length) - lo - 1;
    const step = (t1 - t0) / Math.max(gap, 1);
    const pos = i - lo;
    spans[i] = { start: t0 + step * (pos - 1), end: t0 + step * pos };
  }
  return { words: words.map((w, i) => ({ text: w, start_s: spans[i].start, end_s: spans[i].end })), next: j };
}

// ---- transcribe-whisper/src/retime.mjs ----
// Scene spans from what was heard (the old create-creator-takes-h3
// align_beats.py): a scene's span is set by its line's heard words, so a cut
// placed on the spans lands on the words the creator actually says, not on the
// script's estimate. Each boundary between two spoken scenes goes midway
// between the last word of one and the first word of the next; scenes still
// tile 0 to the end of the cut, and the last scene runs to the end.
//
// The heard words are found by one alignment of the whole script on the whole
// transcript (a longest common subsequence), after both are spelled the same
// way: numbers as words ("200" and "two hundred"), contractions opened ("don't"
// and "do not"), hyphens split, punctuation dropped. A line's anchors are its
// first and last heard words, never a guessed time for a word that was not
// heard.
//
// Scenes without a line (silent scenes) share the gap they sit in: a gap with
// k silent scenes is cut into k + 2 equal slots, so the spoken scene before it
// holds for one slot, each silent scene gets one, and the next spoken scene
// leads in for one. Silent scenes at the start split the time before the first
// word; silent scenes at the end follow a short hold after the last word.

/** How long the last spoken scene holds after its final word when silent scenes follow it. */
const RETIME_HOLD_S = 0.45;
/** Under this share of the script's words heard, the cut does not say the script. */
const RETIME_MIN_HEARD = 0.7;

const r3 = (n) => +Number(n).toFixed(3);

const RETIME_ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const RETIME_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const RETIME_SCALES = [
  [1e9, 'billion'],
  [1e6, 'million'],
  [1e3, 'thousand'],
];

/** A whole number under a trillion as words: 250 → ['two', 'hundred', 'fifty']. */
function retimeNumberWords(n) {
  if (n < 20) return [RETIME_ONES[n]];
  if (n < 100) return [RETIME_TENS[Math.floor(n / 10)], ...(n % 10 ? [RETIME_ONES[n % 10]] : [])];
  if (n < 1000) return [RETIME_ONES[Math.floor(n / 100)], 'hundred', ...(n % 100 ? retimeNumberWords(n % 100) : [])];
  for (const [size, name] of RETIME_SCALES) {
    if (n >= size) return [...retimeNumberWords(Math.floor(n / size)), name, ...(n % size ? retimeNumberWords(n % size) : [])];
  }
  return [String(n)];
}

/** Contractions Whisper may write without the apostrophe, opened the same way (never ones that are words: its, were, ill, lets, shell, wed). */
const RETIME_BARE = new Map(
  Object.entries({
    dont: 'do not', doesnt: 'does not', didnt: 'did not', cant: 'can not', wont: 'will not', isnt: 'is not', arent: 'are not',
    wasnt: 'was not', werent: 'were not', havent: 'have not', hasnt: 'has not', hadnt: 'had not', wouldnt: 'would not',
    shouldnt: 'should not', couldnt: 'could not', mustnt: 'must not', aint: 'ai not', im: 'i am', youre: 'you are',
    theyre: 'they are', ive: 'i have', youve: 'you have', weve: 'we have', theyve: 'they have', youll: 'you will',
    theyll: 'they will', itll: 'it will', thats: 'that is', whats: 'what is', theres: 'there is', heres: 'here is',
    hes: 'he is', shes: 'she is', youd: 'you would', theyd: 'they would', id: 'i would',
  }).map(([k, v]) => [k, v.split(' ')]),
);

const RETIME_OPEN = [
  [/^won't$/, ['will', 'not']],
  [/^can't$/, ['can', 'not']],
  [/^cannot$/, ['can', 'not']],
  [/^(.+)n't$/, (m) => [m[1], 'not']],
  [/^(.+)'re$/, (m) => [m[1], 'are']],
  [/^(.+)'m$/, (m) => [m[1], 'am']],
  [/^(.+)'ll$/, (m) => [m[1], 'will']],
  [/^(.+)'ve$/, (m) => [m[1], 'have']],
  [/^(.+)'d$/, (m) => [m[1], 'would']],
  [/^(.+)'s$/, (m) => [m[1], 'is']],
];

/**
 * One written or heard word as the keys it is compared by, so the script and
 * Whisper spell it the same way: lower case, contractions opened, numbers,
 * `%`, `$` and `&` as words, hyphens and slashes split, other punctuation
 * dropped. "$200" → ['two', 'hundred', 'dollars']; "Don't" → ['do', 'not'].
 */
function retimeKeys(word, { bare = false } = {}) {
  let w = String(word).toLowerCase().replace(/[‘’ʼ`]/g, "'");
  w = w.replace(/&/g, ' and ').replace(/%/g, ' percent ').replace(/\$(\d[\d,]*(?:\.\d+)?)/g, '$1 dollars ');
  const out = [];
  for (const raw of w.split(/[\s\-‐-―/]+/)) {
    const t = raw.replace(/[^\p{L}\p{N}'.,]/gu, '').replace(/^['.,]+|['.,]+$/g, '');
    if (!t) continue;
    const num = /^\d{1,3}(?:,\d{3})+$|^\d+$/.test(t) ? Number(t.replace(/,/g, '')) : null;
    if (num !== null && Number.isSafeInteger(num) && num < 1e12) {
      out.push(...retimeNumberWords(num));
      continue;
    }
    const dec = /^(\d+)\.(\d+)$/.exec(t);
    if (dec && Number(dec[1]) < 1e12) {
      out.push(...retimeNumberWords(Number(dec[1])), 'point', ...dec[2].split('').map((d) => RETIME_ONES[Number(d)]));
      continue;
    }
    // `bare`: contractions keep one key with the apostrophe dropped ("we're" → "were"), for a Whisper that
    // writes them without it where the bare form is also a word (were, ill, its, lets, well).
    const open = bare ? null : RETIME_OPEN.map(([re, to]) => [re.exec(t), to]).find(([m]) => m);
    const parts = bare ? [t] : open ? (typeof open[1] === 'function' ? open[1](open[0]) : open[1]) : RETIME_BARE.get(t) || [t];
    for (const p of parts) {
      const k = p.replace(/[^\p{L}\p{N}]/gu, '');
      if (k) out.push(k);
    }
  }
  return out;
}

/** The longest a word whose end time Whisper left out is taken to last. */
const RETIME_OPEN_WORD_S = 0.8;

/**
 * fal Whisper's chunks with a missing end time closed at the next chunk's
 * start (or the end of the cut), but never more than RETIME_OPEN_WORD_S after
 * the word starts, so a word whose end Whisper left null is still heard and a
 * final word does not swallow the silence after it. Returns a json with the
 * same shape for kitHeardWords.
 */
function retimeCloseChunks(json, duration) {
  const chunks = (json && Array.isArray(json.chunks) && json.chunks) || [];
  const closed = chunks.map((c, i) => {
    const ts = (c && c.timestamp) || [];
    const start = ts[0];
    let end = ts[1];
    if (Number.isFinite(start) && !Number.isFinite(end)) {
      const next = chunks.slice(i + 1).find((n) => n && n.timestamp && Number.isFinite(n.timestamp[0]));
      end = Math.max(start, Math.min(next ? next.timestamp[0] : duration, start + RETIME_OPEN_WORD_S));
    }
    return { ...c, timestamp: [start, end] };
  });
  return { ...(json || {}), chunks: closed };
}

/**
 * The script aligned on the transcript. `lines` are [{scene_id, text}] in
 * plan order; `heard` is kitHeardWords' [{text, start, end}]. Returns
 * { share, anchors }: `share` is the part (0 to 1) of the script's keys found,
 * in order, among the heard keys (one misheard or dropped word cannot shift
 * everything after it), and `anchors` is [{scene_id, start_s, end_s}] for each
 * line with at least one heard word, from its first and last heard words.
 * Unmatched heard words between two lines go to whichever line has unmatched
 * written words at that edge, in proportion.
 */
function retimeAlign(lines, heard) {
  // Contractions are compared opened ("don't" = "do not" = "dont") and, when that hears less, bare ("we're" =
  // "were"); the reading that hears more of the script wins.
  const opened = retimeAlignBy(lines, heard, false);
  if (opened.share >= 1) return opened;
  const bare = retimeAlignBy(lines, heard, true);
  return bare.share > opened.share ? bare : opened;
}

function retimeAlignBy(lines, heard, bare) {
  const written = []; // [{line, key}]
  lines.forEach((l, li) => {
    for (const w of String(l.text).split(/\s+/)) for (const key of retimeKeys(w, { bare })) written.push({ line: li, key });
  });
  const said = []; // [{word, key}]
  heard.forEach((h, hi) => {
    for (const key of retimeKeys(h.text, { bare })) said.push({ word: hi, key });
  });
  if (!written.length) return { share: 1, anchors: [] };
  const n = written.length;
  const m = said.length;
  const table = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      table[i][j] = written[i - 1].key === said[j - 1].key ? table[i - 1][j - 1] + 1 : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  // Walk back for the matched pairs: written key i ↔ heard word said[j].word.
  const match = new Array(n).fill(-1);
  for (let i = n, j = m; i > 0 && j > 0; ) {
    if (written[i - 1].key === said[j - 1].key && table[i][j] === table[i - 1][j - 1] + 1) {
      match[i - 1] = said[j - 1].word;
      i--;
      j--;
    } else if (table[i - 1][j] >= table[i][j - 1]) i--;
    else j--;
  }
  const share = table[n][m] / n;

  // Per line: first and last heard word, and how many written keys at each edge went unheard.
  const found = lines.map(() => ({ first: -1, last: -1, lead: 0, tail: 0, keys: 0 }));
  written.forEach((w, i) => {
    const f = found[w.line];
    f.keys++;
    if (match[i] < 0) {
      if (f.first < 0) f.lead++;
      else f.tail++;
      return;
    }
    if (f.first < 0) f.first = match[i];
    f.last = match[i];
    f.tail = 0;
  });
  const placed = found.map((f, li) => ({ ...f, li })).filter((f) => f.first >= 0);
  if (placed.length) {
    // Heard words before the first line or after the last belong to it only when it has unheard words there.
    const head = placed[0];
    if (head.lead > 0) head.first = Math.max(0, head.first - head.lead);
    const end = placed.at(-1);
    if (end.tail > 0) end.last = Math.min(heard.length - 1, end.last + end.tail);
  }
  for (let p = 0; p + 1 < placed.length; p++) {
    const a = placed[p];
    const b = placed[p + 1];
    const gap = b.first - a.last - 1;
    if (gap <= 0 || a.tail + b.lead === 0) continue;
    const toA = Math.round((gap * a.tail) / (a.tail + b.lead));
    a.last += toA;
    b.first -= gap - toA;
  }
  const anchors = placed.map((f) => ({
    scene_id: lines[f.li].scene_id,
    start_s: r3(Math.max(0, heard[f.first].start)),
    end_s: r3(Math.max(heard[f.first].start, heard[f.last].end)),
  }));
  return { share, anchors };
}

/** The share (0 to 1) of the written lines' keys found, in order, among the heard words. */
function retimeHeardShare(lines, heard) {
  return retimeAlign(lines, heard).share;
}

/**
 * Scene spans [{id, start_s, end_s}] for `ids` (every scene, in plan order),
 * from `anchors` (entries with scene_id, start_s, end_s for the scenes whose
 * line was heard) and the cut's `duration`. Spans tile 0 to `duration` with no
 * gaps.
 */
function retimeSceneSpans(ids, anchors, duration) {
  const said = new Map(anchors.filter((e) => e.scene_id != null).map((e) => [String(e.scene_id), e]));
  const spoken = ids.map((id, i) => (said.has(id) ? i : -1)).filter((i) => i >= 0);
  const bounds = new Array(ids.length + 1).fill(null);
  bounds[0] = 0;
  bounds[ids.length] = duration;
  if (!spoken.length) {
    ids.forEach((_, i) => (bounds[i] = (duration * i) / ids.length));
  } else {
    const first = spoken[0];
    const f = Math.max(0, said.get(ids[first]).start_s);
    for (let i = 1; i <= first; i++) bounds[i] = (f * i) / (first + 1);
    for (let n = 0; n + 1 < spoken.length; n++) {
      const a = spoken[n];
      const b = spoken[n + 1];
      const last = said.get(ids[a]).end_s;
      const next = said.get(ids[b]).start_s;
      const k = b - a - 1;
      if (next <= last) {
        for (let i = a + 1; i <= b; i++) bounds[i] = (last + next) / 2;
        continue;
      }
      for (let j = 1; j <= k + 1; j++) bounds[a + j] = last + ((next - last) * j) / (k + 2);
    }
    const lastIdx = spoken.at(-1);
    const k = ids.length - 1 - lastIdx;
    if (k > 0) {
      const l = Math.min(said.get(ids[lastIdx]).end_s, duration);
      const hold = Math.min(RETIME_HOLD_S, (duration - l) / (k + 1));
      const from = l + hold;
      for (let j = 0; j < k; j++) bounds[lastIdx + 1 + j] = from + ((duration - from) * j) / k;
    }
  }
  // Never backwards, never past the cut.
  for (let i = 1; i <= ids.length; i++) bounds[i] = Math.min(duration, Math.max(bounds[i - 1], bounds[i]));
  bounds[ids.length] = duration;
  return ids.map((id, i) => ({ id, start_s: r3(bounds[i]), end_s: r3(bounds[i + 1]) }));
}

// ---- transcribe-whisper/src/place.mjs ----
// Each approved line placed on what was heard (1.1.2). One alignment of the
// whole script on the whole transcript, in scene order, that may skip heard
// words: a repeated line, a filler or an invented word between two lines costs
// nothing to skip, so it can never push the next line off its words. 1.1.1 and
// older looked for each written word among the next five heard words from where
// the last line ended; one repeated question there failed every later line and
// gave all that was heard to the last one.
//
// The alignment is a best-scoring monotonic match of written keys on heard keys
// (both spelled the same way by retimeKeys: numbers as words, contractions
// opened, punctuation dropped). A match scores PLACE_MATCH. Skipping a heard
// word INSIDE one line (between two of its written words) costs
// PLACE_INSIDE_SKIP, so a line keeps its words together instead of borrowing one
// common word from far away; skipping one BETWEEN lines is free. Ties go to the
// earliest heard words.
//
// What each line owns: the heard words from its first matched word to its last
// (a written word heard as several, "50%" as "50 percent", owns all of them),
// plus, at an edge where some of its written words were not heard, up to
// PLACE_CLAIM_PER_WORD heard words per unheard written word (a name Whisper
// writes as two words, say). Only a placed line owns words: one under
// PLACE_MIN_SHARE heard was not said, so the words it matched or claimed from
// its gap only time it and stay extra. Heard words no placed line owns are
// extra: speech the script does not have (a repeat, a filler, an invented
// line), returned as runs so a cut can drop them.
//
// Every top-level name starts with `place` (bundled modules share one namespace).

/** What one matched written key scores. */
const PLACE_MATCH = 10;
/** What skipping one heard key inside a line costs (a fifth of a match). */
const PLACE_INSIDE_SKIP = 2;
/** Heard words a line may claim at an edge, per written word of it that was not heard there. */
const PLACE_CLAIM_PER_WORD = 2;
/** A line is placed on its matched words when at least this share of its written words was heard. */
const PLACE_MIN_SHARE = 2 / 3;

/**
 * The best monotonic match of `written` keys on `said` keys. `written` is [{line, key}], `said` is
 * [{word, key}]. Returns, per written key, the heard word index it matched or -1.
 */
function placeMatch(written, said) {
  const n = written.length;
  const m = said.length;
  const W = m + 1;
  const best = new Int32Array((n + 1) * W);
  const inside = (i) => i > 0 && i < n && written[i - 1].line === written[i].line;
  // best[i][j]: the most the rest scores from written key i and said key j on. Rows past the script or the
  // transcript score 0 (the rest is skipped: heard words after the last line are between lines).
  for (let i = n - 1; i >= 0; i--) {
    const cost = inside(i) ? PLACE_INSIDE_SKIP : 0;
    for (let j = m - 1; j >= 0; j--) {
      let v = best[(i + 1) * W + j];
      const skipSaid = best[i * W + j + 1] - cost;
      if (skipSaid > v) v = skipSaid;
      if (written[i].key === said[j].key) {
        const hit = PLACE_MATCH + best[(i + 1) * W + j + 1];
        if (hit > v) v = hit;
      }
      best[i * W + j] = v;
    }
  }
  const match = new Array(n).fill(-1);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    const here = best[i * W + j];
    if (written[i].key === said[j].key && here === PLACE_MATCH + best[(i + 1) * W + j + 1]) {
      match[i] = said[j].word;
      i++;
      j++;
    } else if (here === best[i * W + j + 1] - (inside(i) ? PLACE_INSIDE_SKIP : 0)) j++;
    else i++;
  }
  return match;
}

function placeBy(lines, heard, bare) {
  const words = lines.map((l) => String(l.text).split(/\s+/).filter(Boolean));
  const written = [];
  words.forEach((ws, li) => ws.forEach((w, wi) => retimeKeys(w, { bare }).forEach((key) => written.push({ line: li, word: wi, key }))));
  const said = [];
  heard.forEach((h, hi) => retimeKeys(h.text, { bare }).forEach((key) => said.push({ word: hi, key })));
  const match = placeMatch(written, said);
  // Per written word: the heard words its first and last matched keys landed on, or -1.
  const hits = words.map((ws) => ws.map(() => -1));
  const ends = words.map((ws) => ws.map(() => -1));
  written.forEach((w, k) => {
    if (match[k] < 0) return;
    if (hits[w.line][w.word] < 0) hits[w.line][w.word] = match[k];
    ends[w.line][w.word] = match[k];
  });
  return { words, hits, ends, matched: match.filter((x) => x >= 0).length };
}

/** Splits `count` items among `caps` in proportion, in order; every item goes to someone when any cap is above 0. */
function placeShare(count, caps) {
  const total = caps.reduce((a, b) => a + b, 0);
  if (!total) return caps.map(() => 0);
  const out = [];
  let given = 0;
  let capSoFar = 0;
  for (const cap of caps) {
    capSoFar += cap;
    const upTo = Math.round((count * capSoFar) / total);
    out.push(upTo - given);
    given = upTo;
  }
  return out;
}

/** Whether a line with `found` of its `count` written words heard was said: at least PLACE_MIN_SHARE of them. */
function placeSaid(found, count) {
  return count > 0 && found >= Math.max(1, Math.ceil(count * PLACE_MIN_SHARE - 1e-9));
}

/**
 * Places `lines` ([{scene_id, text}], plan order) on `heard` (kitHeardWords' [{text, start, end}]).
 * Returns { lines: [{ words: [written word], hits: [first heard index | -1], ends: [last heard index | -1],
 * own: [first, last] | null, span: [first, last] | null, placed }], extras: [[first, last]] } where `span`
 * is the run of heard words that times the line, `own` is that run when the line is placed (null when it
 * was not said) and `extras` are the runs no placed line owns, in order.
 */
function placeLines(lines, heard) {
  // Contractions compared opened ("don't" = "do not") and, when that hears less, bare ("we're" = "were").
  const opened = placeBy(lines, heard, false);
  const bare = opened.matched === opened.words.reduce((a, ws) => a + ws.length, 0) ? opened : placeBy(lines, heard, true);
  const { words, hits, ends } = bare.matched > opened.matched ? bare : opened;

  const out = words.map((ws, li) => {
    const found = hits[li].filter((h) => h >= 0);
    const first = found.length ? Math.min(...found) : -1;
    const last = found.length ? Math.max(...ends[li].filter((h) => h >= 0)) : -1;
    const firstHit = hits[li].findIndex((h) => h >= 0);
    const lastHit = hits[li].length - 1 - [...hits[li]].reverse().findIndex((h) => h >= 0);
    return {
      words: ws,
      hits: hits[li],
      first,
      last,
      // Written words not heard before the first heard one and after the last: what the line may claim.
      lead: found.length ? firstHit : ws.length,
      tail: found.length ? ws.length - 1 - lastHit : 0,
      placed: placeSaid(found.length, ws.length),
    };
  });
  // Monotonic by construction; a heard word two lines share (one heard "200" for "two" ending one line and
  // "hundred" starting the next) stays with the earlier line.
  let lastOwned = -1;
  for (const l of out) {
    if (l.first < 0) continue;
    if (l.first <= lastOwned) l.first = lastOwned + 1;
    if (l.first > l.last) {
      l.first = l.last = -1;
      l.lead = l.words.length;
      l.tail = 0;
      continue;
    }
    lastOwned = l.last;
  }
  const own = out.map((l) => (l.first >= 0 ? [l.first, l.last] : null));

  // The gaps between lines with heard words: each line next to one claims from its side.
  const ranged = out.map((l, i) => (l.first >= 0 ? i : -1)).filter((i) => i >= 0);
  const bounds = [-1, ...ranged, out.length];
  const owned = new Array(heard.length).fill(false);
  for (let b = 0; b + 1 < bounds.length; b++) {
    const a = bounds[b];
    const z = bounds[b + 1];
    const g0 = a >= 0 ? out[a].last + 1 : 0;
    const g1 = z < out.length ? out[z].first - 1 : heard.length - 1;
    const len = g1 - g0 + 1;
    if (len <= 0) continue;
    const mids = [];
    for (let k = a + 1; k < z; k++) mids.push(k);
    const caps = [a >= 0 ? out[a].tail : 0, ...mids.map((k) => out[k].words.length), z < out.length ? out[z].lead : 0].map((c) => c * PLACE_CLAIM_PER_WORD);
    const total = caps.reduce((x, y) => x + y, 0);
    if (!total) continue;
    // Enough claims for the whole gap: it is shared in proportion. Otherwise each takes its cap, the line
    // before from the left, lines inside after it, the line after from the right; the rest is extra.
    const take = total >= len ? placeShare(len, caps) : caps;
    let at = g0;
    const give = (k, from, to) => {
      if (to < from) return;
      own[k] = own[k] ? [Math.min(own[k][0], from), Math.max(own[k][1], to)] : [from, to];
    };
    if (a >= 0) give(a, at, at + take[0] - 1);
    at += take[0];
    mids.forEach((k, n) => {
      give(k, at, at + take[n + 1] - 1);
      at += take[n + 1];
    });
    if (z < out.length) give(z, g1 - take.at(-1) + 1, g1);
  }
  // Only a placed line owns its run; a line that was not said leaves its words extra.
  out.forEach((l, i) => {
    if (l.placed && own[i]) for (let x = own[i][0]; x <= own[i][1]; x++) owned[x] = true;
  });
  const extras = [];
  for (let x = 0; x < heard.length; x++) {
    if (owned[x]) continue;
    if (extras.length && extras.at(-1)[1] === x - 1) extras.at(-1)[1] = x;
    else extras.push([x, x]);
  }
  return { lines: out.map((l, i) => ({ words: l.words, hits: l.hits, ends: ends[i], own: l.placed ? own[i] : null, span: own[i], placed: l.placed })), extras };
}

/**
 * Times for a placed line's written words: the heard words a written word landed on give its span
 * (shared evenly by written words that landed on the same ones); a word not heard sits evenly between its
 * timed neighbours, or between the line's own edge and its first or last timed word. Returns
 * [{text, start_s, end_s}].
 */
function placeTimes(line, heard) {
  const { words, hits, own } = line;
  const ends = line.ends || hits;
  const spans = words.map(() => null);
  for (let i = 0; i < words.length; ) {
    if (hits[i] < 0) {
      i++;
      continue;
    }
    let k = i;
    while (k + 1 < words.length && hits[k + 1] === hits[i]) k++;
    const h0 = heard[hits[i]].start;
    const h1 = Math.max(heard[Math.max(...ends.slice(i, k + 1))].end, h0);
    const step = (h1 - h0) / (k - i + 1);
    for (let x = i; x <= k; x++) spans[x] = { start: h0 + step * (x - i), end: h0 + step * (x - i + 1) };
    i = k + 1;
  }
  const lo = own ? heard[own[0]].start : 0;
  const hi = own ? heard[own[1]].end : lo;
  const known = spans.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
  for (let i = 0; i < spans.length; i++) {
    if (spans[i]) continue;
    const before = known.filter((k) => k < i);
    const after = known.filter((k) => k > i);
    const p = before.length ? before.at(-1) : -1;
    const q = after.length ? after[0] : words.length;
    const t0 = p >= 0 ? spans[p].end : lo;
    const t1 = q < words.length ? spans[q].start : Math.max(hi, t0);
    const step = (Math.max(t1, t0) - t0) / (q - p - 1);
    spans[i] = { start: t0 + step * (i - p - 1), end: t0 + step * (i - p) };
  }
  return words.map((text, i) => ({ text, start_s: spans[i].start, end_s: spans[i].end }));
}

// ---- transcribe-whisper/src/part.mjs ----
// transcribe-whisper: what is actually said in a cut, from fal Whisper with
// word timings (caption-burn's transcription), as a timeline step that runs
// before the layers. Each approved scene line is placed on the heard words:
// a speech entry keeps the written line as `text` (so captions show the
// approved words), carries what was heard for it as `spoken`, and its written
// words timed by the heard ones. The check layer compares `spoken` with the
// approved script; the captions layer uses the timings and never transcribes
// again. Heard words no line has (a repeated line, a filler) come out as their
// own entries with no scene_id and empty text (1.1.2), so a cut can drop them
// and the captions never show them; the check layer still hears them. The cut passes through unchanged. With `retime_scenes`, the
// timeline's scene spans are set from each line's heard words as well (see
// retime.mjs), so a later cut lands on what was said.

const MODEL = 'fal-ai/whisper';

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const sceneIds = (inputs.scenes || []).map((s, i) => (s.id == null ? String(i + 1) : String(s.id)));
  const lines = (inputs.scenes || [])
    .map((s, i) => ({ scene_id: sceneIds[i], text: String(s.line || '').replace(/\s+/g, ' ').trim() }))
    .filter((l) => l.text);
  if (inputs.retime_scenes && !lines.length) throw ctx.error('bad_input', 'retime_scenes needs scenes with at least one line to place');
  if (inputs.retime_scenes) {
    // Later steps key the re-timed spans by scene id, so two scenes may not share one (a scene with no id
    // is named by its position, which may collide with another scene's id).
    const twice = sceneIds.filter((id, i) => sceneIds.indexOf(id) !== i);
    if (twice.length) throw ctx.error('bad_input', `retime_scenes needs a different id for every scene; repeated: ${[...new Set(twice)].join(', ')}`);
  }
  const info = await ctx.tools.probe(inputs.video.path);
  if (!info.has_audio) throw ctx.error('bad_input', 'the cut has no sound to transcribe');
  const duration = await kitDuration(ctx, inputs.video);
  // The speech goes out as 16 kHz mono 16-bit WAV (audio/wav): a type the kit and the server host for the
  // line (audio/mp4 is not), at the rate Whisper listens at.
  await kitFfmpeg(ctx, ['-i', inputs.video.path, '-map', '0:a:0', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', join(ctx.tmpDir, 'speech.wav')]);
  const audio = await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/speech.wav`, 'audio');
  const result = await ctx.line.order({
    piece: 'transcribe',
    provider: 'fal',
    path: MODEL,
    body: { audio_url: audio, task: 'transcribe', language: inputs.language ?? 'en', chunk_level: 'word' },
    results: [],
  });
  const heard = kitHeardWords(retimeCloseChunks(result.json, duration));
  ctx.progress({ done: 1, total: 1 });
  const transcript = heard.map((w) => w.text).join(' ');

  // Each line is placed by one alignment of the whole script on the whole transcript (place.mjs): heard
  // words between lines that no line has (a repeated line, a filler) are skipped and come back as entries
  // with no scene and no written text, so a cut can drop them and captions never show them.
  const speech = [];
  if (!lines.length) {
    if (heard.length) {
      speech.push({ text: transcript, spoken: transcript, start_s: heard[0].start, end_s: heard.at(-1).end, words: heard.map((w) => ({ text: w.text, start_s: w.start, end_s: w.end })) });
    }
  } else {
    const r3 = (t) => +Math.min(Math.max(0, t), duration).toFixed(3);
    const placed = placeLines(lines, heard);
    const extras = placed.extras.map(([f, t]) => {
      const run = heard.slice(f, t + 1);
      const spoken = run.map((w) => w.text).join(' ');
      ctx.log.info('heard speech that is in no line', { spoken, start_s: r3(run[0].start), end_s: r3(run.at(-1).end) });
      return { at: f, entry: { text: '', spoken, start_s: r3(run[0].start), end_s: r3(Math.max(run.at(-1).end, run[0].start)), words: run.map((w) => ({ text: w.text, start_s: r3(w.start), end_s: r3(Math.max(w.end, w.start)) })) } };
    });
    let prevEnd = 0;
    placed.lines.forEach((p, k) => {
      const l = lines[k];
      if (p.span) while (extras.length && extras[0].at < p.span[0]) speech.push(extras.shift().entry);
      const share = p.span ? heard.slice(p.span[0], p.span[1] + 1) : [];
      // Only a placed line was said: one that was not keeps an empty `spoken` (its words, if any, stay
      // extra), so the cut refuses the take instead of passing a line that is not in it.
      const entry = { scene_id: l.scene_id, text: l.text, spoken: p.placed ? share.map((w) => w.text).join(' ') : '' };
      if (p.placed) {
        entry.words = placeTimes(p, heard).map((w) => ({ text: w.text, start_s: r3(w.start_s), end_s: r3(Math.max(w.end_s, w.start_s)) }));
      } else {
        // A line the transcript does not match keeps word timings, spread evenly across what was heard for
        // it (or a short slot where nothing was), so the captions layer never has to buy a transcript again.
        const start = share.length ? share[0].start : Math.min(prevEnd, duration);
        const end = share.length ? Math.max(share.at(-1).end, start) : Math.min(duration, start + 0.4 * l.text.split(/\s+/).length);
        const written = l.text.split(/\s+/).filter(Boolean);
        const step = (end - start) / written.length;
        entry.words = written.map((text, i) => ({ text, start_s: r3(start + step * i), end_s: r3(start + step * (i + 1)) }));
        ctx.log.warn('a line could not be placed on what was heard; its words are spread evenly', { scene_id: l.scene_id });
      }
      entry.start_s = entry.words[0].start_s;
      entry.end_s = Math.max(entry.words.at(-1).end_s, entry.start_s);
      prevEnd = Math.max(prevEnd, entry.end_s);
      speech.push(entry);
    });
    for (const x of extras) speech.push(x.entry);
  }
  const base = inputs.timeline || { duration_s: duration, width: info.width, height: info.height, fps: info.fps || 30, scenes: [] };
  const timeline = { ...base, duration_s: +duration.toFixed(3), speech };
  if (inputs.retime_scenes) {
    // Scene spans only move onto heard words when the cut says the script; otherwise a later cut would
    // land on the wrong words, so stop here (the transcription is reused on a retry).
    // The anchors are each line's first and last heard words, never a guessed time for an unheard word.
    const { share, anchors } = retimeAlign(lines, heard);
    ctx.log.info('script words heard', { share: +share.toFixed(3) });
    if (share < RETIME_MIN_HEARD) {
      throw ctx.error('bad_input', `only ${Math.round(share * 100)}% of the script was heard (at least ${RETIME_MIN_HEARD * 100}% needed): the cut does not say the script`);
    }
    timeline.scenes = retimeSceneSpans(sceneIds, anchors, timeline.duration_s);
    const empty = timeline.scenes.filter((s) => s.end_s <= s.start_s).map((s) => s.id);
    if (empty.length) ctx.log.warn('scenes left with no time between the heard words', { scene_ids: empty });
  }
  return kitCheckOutputs(ctx, manifest, { video: inputs.video, timeline, transcript });
}
