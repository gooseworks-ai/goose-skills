// Built from speech-recut/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
import { readFileSync } from 'node:fs';
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
// Absolute on any system the kit runs on: /x on Linux and macOS, C:\x or C:/x on Windows.
// Requiring a leading '/' refused every real path on Windows.
const kitSchemaAbsolute = /^(?:\/|[A-Za-z]:[\\/])/;

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
  if (typeof value.path !== 'string' || !kitSchemaAbsolute.test(value.path)) errors.push(`${at}.path: expected an absolute path`);
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

// ---- speech-recut/src/recut.mjs ----
// The speech-recut planner: which stretches of one take to keep, as pure
// functions of the take's heard words, its picture cuts and its length. No
// ffmpeg here; src/part.mjs measures the take and renders the plan.
//
// The rules (render-street-interview's recut.py, CK 20 and CK 35):
//   - Dead air: a silence longer than max_gap_s is cut down to max_gap_s.
//     The removed stretch is placed so the join lands on one of the take's
//     own picture cuts when one falls inside the silence; otherwise it sits
//     in the middle. Nothing is cut closer than RECUT_EDGE_S to a word.
//   - Repeats and stutters: dropped INSIDE a line only, never a whole line
//     (critic #23: check-layer's speech_matches_script compares the whole
//     script). A repeat is a heard word, or run of words, that the written
//     line does not have and that repeats or starts a neighbouring word.
//     Other extra words inside a line ("invented" words) are speech and are
//     never cut.
//   - Speech in no line (1.0.2): heard words transcribe-whisper 1.1.2 gave to
//     no line (an entry with no scene_id and no text: a repeated line, a
//     filler between lines) are cut out with the silence around them, down to
//     max_gap_s, so the lines either side join across one pause. 1.0.1 kept
//     them, and with the transcript's old in-order placement a repeated
//     question made every later line look unheard.
//   - Minimum shot: after the cuts, a shot shorter than min_shot_s that holds
//     no speech is dropped (the shorter fragment goes; never a cross-fade).
//     A short shot that holds speech (1.0.1) first takes back the dead air
//     cut next to it, up to its shortfall (a little more pause, never past a
//     picture cut inside that dead air); when that cannot reach min_shot_s
//     (the take's own shot is that short), its picture is covered by the shot
//     before it (else after it), held on one frame, and its sound is kept, so
//     no word is lost and no flash of picture is seen. Only an edit with no
//     shot long enough to cover from keeps a short shot, with a warning.
//   - Scenes with no line that the timeline places are silent beats (a
//     reaction, a payoff): their spans are kept whole.
//
// Every top-level name starts with `recut` (bundled modules share one
// namespace, parts/_tools/bundle.mjs).

/** Nothing is cut closer than this to a heard word (Whisper's word edges drift by tens of ms). */
const RECUT_EDGE_S = 0.06;
/** A repeat is cut out up to this close to the words either side of it. */
const RECUT_REPEAT_PAD_S = 0.04;
/** How far ahead a written word is looked for among the heard ones (the same window as _lib/heard.mjs). */
const RECUT_LOOKAHEAD = 5;
/** The longest repeated run of words that counts as a repeat. */
const RECUT_MAX_REPEAT_WORDS = 4;

/** A take the cut cannot fix: bad_input, because the take (not the cut) is wrong. */
class RecutRefusal extends Error {}

const RECUT_EPS = 1e-6;

/** Whitespace tokens of `text` as {text, key}, key per _lib/heard.mjs (letters, digits, apostrophes). */
function recutTokens(text) {
  return String(text == null ? '' : text)
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => ({ text: t, key: kitHeardKey(t) }));
}

/**
 * Written keys placed on spoken keys the way _lib/heard.mjs places a line on heard words: each written
 * word is looked for among the next RECUT_LOOKAHEAD spoken words. Returns the spoken index per written
 * word, or -1 when it was not found.
 */
function recutAlign(written, spoken) {
  const match = [];
  let j = 0;
  for (const w of written) {
    let hit = -1;
    for (let x = j; x < Math.min(j + RECUT_LOOKAHEAD, spoken.length); x++) {
      if (spoken[x] === w) {
        hit = x;
        break;
      }
    }
    match.push(hit);
    if (hit >= 0) j = hit + 1;
  }
  return match;
}

function recutSame(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/**
 * Whether `extra` (spoken keys heard between written words i and i + 1, none of them in the line)
 * is a repeat or a stutter: the last n written words said again, the next n said early, or every
 * extra word a copy of a neighbour or the start of the next word ("wa" before "water").
 */
function recutIsRepeat(extra, written, i) {
  const n = extra.length;
  if (!n) return false;
  if (n <= RECUT_MAX_REPEAT_WORDS) {
    if (i - n + 1 >= 0 && recutSame(extra, written.slice(i - n + 1, i + 1))) return true;
    if (i + n < written.length && recutSame(extra, written.slice(i + 1, i + 1 + n))) return true;
  }
  const prev = written[i];
  const next = written[i + 1];
  return extra.every((t) => t && (t === prev || t === next || (next != null && next.length > t.length && next.startsWith(t))));
}

/** Overlapping or touching intervals merged, sorted by start. Each keeps the `kind` of its longest part. */
function recutMerge(list) {
  const sorted = list.filter((x) => x.end - x.start > RECUT_EPS).sort((a, b) => a.start - b.start || a.end - b.end);
  const out = [];
  for (const x of sorted) {
    const last = out.at(-1);
    if (last && x.start <= last.end + RECUT_EPS) {
      if (x.end - x.start > last.longest) {
        last.kind = x.kind;
        last.longest = x.end - x.start;
      }
      last.end = Math.max(last.end, x.end);
    } else out.push({ ...x, longest: x.end - x.start });
  }
  return out.map(({ longest, ...x }) => x);
}

/** [0, duration] less the removals: the kept stretches of the source, in order. */
function recutKeep(removals, duration) {
  const keep = [];
  let at = 0;
  for (const r of recutMerge(removals)) {
    if (r.start > at + RECUT_EPS) keep.push({ start: at, end: Math.min(r.start, duration) });
    at = Math.max(at, r.end);
  }
  if (duration > at + RECUT_EPS) keep.push({ start: at, end: duration });
  return keep;
}

/** Source time -> output time. A time inside a removed stretch maps to its join. */
function recutMapper(keep) {
  return (t) => {
    let out = 0;
    for (const k of keep) {
      if (t <= k.start) return out;
      if (t < k.end) return out + (t - k.start);
      out += k.end - k.start;
    }
    return out;
  };
}

/**
 * The shots of the output, in source time: each kept stretch split at the picture cuts inside it.
 * A join is always a shot boundary, even inside one source shot (a jump cut).
 */
function recutFragments(keep, pictureCuts) {
  const out = [];
  for (const k of keep) {
    let at = k.start;
    for (const c of pictureCuts) {
      if (c > at + RECUT_EPS && c < k.end - RECUT_EPS) {
        out.push({ start: at, end: c });
        at = c;
      }
    }
    out.push({ start: at, end: k.end });
  }
  return out;
}

function recutShortCount(removals, duration, pictureCuts, minShot) {
  return recutFragments(recutKeep(removals, duration), pictureCuts).filter((f) => f.end - f.start < minShot - RECUT_EPS).length;
}

/**
 * One short shot `f` lengthened by `need` seconds, from the dead-air removals that end where it starts or start
 * where it ends: each gives back up to the stretch after (or before) its last (or first) picture cut inside it,
 * one side alone when it can, edges on the take's frames. Returns the new removals when the shot holding f's
 * middle then reaches `minShot`, else null.
 */
function recutGrow(list, f, need, pictureCuts, minShot, duration, fps) {
  const left = list.findIndex((r) => r.kind === 'dead_air' && Math.abs(r.end - f.start) <= RECUT_EPS);
  const right = list.findIndex((r) => r.kind === 'dead_air' && Math.abs(r.start - f.end) <= RECUT_EPS);
  const inside = (r) => pictureCuts.filter((c) => c > r.start + RECUT_EPS && c < r.end - RECUT_EPS);
  const leftStop = left < 0 ? null : Math.max(list[left].start, ...inside(list[left]));
  const rightStop = right < 0 ? null : Math.min(list[right].end, ...inside(list[right]));
  // A removal whose edge on the shot is itself a picture cut gives its time to the shot beyond that cut.
  const onCut = (t) => pictureCuts.some((c) => Math.abs(c - t) <= RECUT_EPS);
  const leftRoom = left < 0 || onCut(list[left].end) ? 0 : list[left].end - leftStop;
  const rightRoom = right < 0 || onCut(list[right].start) ? 0 : rightStop - list[right].start;
  if (leftRoom + rightRoom < RECUT_EPS) return null;
  let takeLeft = 0;
  if (leftRoom >= need - RECUT_EPS) takeLeft = need;
  else if (rightRoom < need - RECUT_EPS) takeLeft = leftRoom;
  const takeRight = Math.min(rightRoom, need - takeLeft);
  const out = list.map((r) => ({ ...r }));
  if (takeLeft > RECUT_EPS) out[left].end = Math.max(leftStop, Math.floor((out[left].end - takeLeft) * fps + 1e-6) / fps);
  if (takeRight > RECUT_EPS) out[right].start = Math.min(rightStop, Math.ceil((out[right].start + takeRight) * fps - 1e-6) / fps);
  const kept = out.filter((r) => r.end - r.start > RECUT_EPS);
  const mid = (f.start + f.end) / 2;
  const grown = recutFragments(recutKeep(kept, duration), pictureCuts).find((x) => x.start <= mid && x.end >= mid);
  return grown && grown.end - grown.start >= minShot - RECUT_EPS ? kept : null;
}

/**
 * Every short shot (under `minShot`) lengthened from the dead air cut next to it where that reaches the minimum
 * (recutGrow). `removals` are frame-exact; the result is too. Shots it cannot lengthen are left as they are.
 */
function recutLengthen(removals, duration, pictureCuts, minShot, fps) {
  let list = removals.map((r) => ({ ...r }));
  const tried = new Set();
  for (let guard = 0; guard < 4 * (list.length + pictureCuts.length + 1); guard++) {
    const f = recutFragments(recutKeep(list, duration), pictureCuts).find((x) => x.end - x.start < minShot - RECUT_EPS && !tried.has(`${x.start.toFixed(6)}:${x.end.toFixed(6)}`));
    if (!f) break;
    tried.add(`${f.start.toFixed(6)}:${f.end.toFixed(6)}`);
    list = recutGrow(list, f, minShot - (f.end - f.start), pictureCuts, minShot, duration, fps) || list;
  }
  return list;
}

/**
 * The shots still under `minShot` once lengthened: each one's picture is covered by the shot before it
 * (`from: 'prev'`, its last frame held), or after it for the first shot (`'next'`, its first frame), and its
 * sound is kept. When no shot reaches the minimum there is nothing to cover from: those are warnings.
 */
function recutCovers(keep, pictureCuts, minShot) {
  const frags = recutFragments(keep, pictureCuts);
  const short = frags.map((f) => f.end - f.start < minShot - RECUT_EPS);
  if (short.every(Boolean)) return { covers: [], uncovered: frags };
  const covers = [];
  frags.forEach((f, i) => {
    if (short[i]) covers.push({ start: f.start, end: f.end, from: i > 0 ? 'prev' : 'next' });
  });
  return { covers, uncovered: [] };
}

function recutTouches(list, start, end, pad) {
  return list.some((o) => o.start - pad < end && o.end + pad > start);
}

/** Free stretches of [a, b] once the fixed removals are taken out. */
function recutFree(a, b, fixed) {
  let pieces = [{ start: a, end: b }];
  for (const r of fixed) {
    const next = [];
    for (const p of pieces) {
      if (r.end <= p.start || r.start >= p.end) next.push(p);
      else {
        if (r.start > p.start) next.push({ start: p.start, end: r.start });
        if (r.end < p.end) next.push({ start: r.end, end: p.end });
      }
    }
    pieces = next;
  }
  return pieces.filter((p) => p.end - p.start > RECUT_EPS);
}

/**
 * Where the repeats and stutters of one speech entry are, and which of its words and spoken tokens
 * they take with them. Two shapes of entry:
 *   - words are the written line timed on heard words (transcribe-whisper): a repeat sits in the gap
 *     between two written words, and `spoken` says it is there;
 *   - words are the heard words themselves: a repeat is the earlier of two copies in `words`.
 * Returns {removals, held, droppedWords, droppedSpoken, leadingSpeech, trailingSpeech}: `held` are
 * gaps that hold heard speech the line does not have, which are never cut.
 */
function recutEntryRepeats(entry, words, drop) {
  const out = { removals: [], held: [], droppedWords: new Set(), droppedSpoken: new Set(), leadingSpeech: false, trailingSpeech: false };
  const lineKeys = recutTokens(entry.text).map((t) => t.key);
  const wordKeys = words.map((w) => kitHeardKey(w.text));
  const wordsAreLine = recutSame(lineKeys, wordKeys);
  if (typeof entry.spoken === 'string' && wordsAreLine) {
    const spoken = recutTokens(entry.spoken);
    const match = recutAlign(wordKeys, spoken.map((t) => t.key));
    const found = match.map((m, i) => (m >= 0 ? i : -1)).filter((i) => i >= 0);
    const real = (from, to) => {
      const idx = [];
      for (let x = from; x < to; x++) if (spoken[x].key) idx.push(x);
      return idx;
    };
    if (found.length) {
      out.leadingSpeech = real(0, match[found[0]]).length > 0;
      out.trailingSpeech = real(match[found.at(-1)] + 1, spoken.length).length > 0;
    } else if (real(0, spoken.length).length) {
      // Nothing of the line was found: its words were spread over what was heard. All of it is speech.
      out.held.push({ start: words[0].start, end: words.at(-1).end });
    }
    for (let f = 0; f + 1 < found.length; f++) {
      const i = found[f];
      const k = found[f + 1];
      const extra = real(match[i] + 1, match[k]);
      const a = words[i].end;
      const b = words[k].start;
      if (k > i + 1) {
        // Written words the transcript did not have sit here on spread-out times: no real silence to cut.
        out.held.push({ start: a, end: b });
        continue;
      }
      if (!extra.length) continue;
      if (drop === 'repeats' && recutIsRepeat(extra.map((x) => spoken[x].key), wordKeys, i) && b - a > 2 * RECUT_REPEAT_PAD_S) {
        out.removals.push({ start: a + RECUT_REPEAT_PAD_S, end: b - RECUT_REPEAT_PAD_S, kind: 'repeat' });
        for (const x of extra) out.droppedSpoken.add(x);
      } else out.held.push({ start: a, end: b });
    }
    return out;
  }
  if (drop !== 'repeats' || wordsAreLine) return out;
  // Heard words: drop the earlier copy of a repeated run, unless the line itself repeats it.
  const lineText = ` ${lineKeys.join(' ')} `;
  for (let i = 0; i + 1 < words.length; i++) {
    if (out.droppedWords.has(i)) continue;
    let n = 0;
    for (let m = Math.min(RECUT_MAX_REPEAT_WORDS, i + 1); m >= 1; m--) {
      if (i + m >= words.length) continue;
      const first = wordKeys.slice(i - m + 1, i + 1);
      if (first.some((k) => !k) || !recutSame(first, wordKeys.slice(i + 1, i + 1 + m))) continue;
      if (lineText.includes(` ${[...first, ...first].join(' ')} `)) continue;
      n = m;
      break;
    }
    const stutter = !n && /[-‐-—…]$/.test(words[i].text) && wordKeys[i] && wordKeys[i + 1].startsWith(wordKeys[i]) && wordKeys[i + 1] !== wordKeys[i];
    if (!n && !stutter) continue;
    const from = i - Math.max(n, 1) + 1;
    const prevEnd = from > 0 ? words[from - 1].end : 0;
    const start = Math.max(prevEnd, words[from].start - RECUT_REPEAT_PAD_S / 2);
    const end = words[i + 1].start - RECUT_REPEAT_PAD_S;
    if (end - start <= RECUT_EPS) continue;
    out.removals.push({ start, end, kind: 'repeat' });
    for (let x = from; x <= i; x++) out.droppedWords.add(x);
  }
  return out;
}

/**
 * The plan for one take.
 *   duration     the take's length (s); fps its frame rate (cut points land on its frames)
 *   speech       Timeline.speech with words; scenes plan.scenes; timeline_scenes the take's timeline scenes
 *   picture_cuts the take's own shot changes (s)
 *   min_shot_s, max_gap_s, drop ('repeats' | 'none')
 * Returns {removals [{start, end, kind}], keep [{start, end}], speech (re-timed), scenes (re-timed),
 * cuts [{at_s, removed_s, kind}], seconds, warnings, heard [{start, end}] (source stretches holding
 * speech with no timed words), covers [{start, end, from}] (short shots whose picture a neighbour
 * covers, in take time)}. Throws RecutRefusal for a take the cut cannot fix.
 */
/**
 * The refusals that need no measuring: speech with no timed words, or a scene line with no heard words.
 * Pure, so the part runs it before any probe or ffmpeg work. Throws RecutRefusal.
 */
/** An entry of heard speech in no line: no scene_id and no written text (transcribe-whisper 1.1.2). */
function recutIsExtra(entry) {
  return !!entry && entry.scene_id == null && !String(entry.text || '').trim();
}

function recutCheckSpeech(speech, scenes) {
  const entries = (speech || []).map((e) => ({ entry: e, words: e.words || [] }));
  if (!entries.some((e) => e.words.length)) throw new RecutRefusal('the speech has no timed words: transcribe the take with word timings first');
  for (const [i, s] of (scenes || []).entries()) {
    const line = String((s && s.line) || '').trim();
    if (!line) continue;
    const id = s.id == null ? String(i + 1) : String(s.id);
    const hit = entries.find((e) => e.entry.scene_id === id);
    const unheard = !hit || !hit.words.length || (typeof hit.entry.spoken === 'string' && !recutTokens(hit.entry.spoken).some((t) => t.key));
    if (unheard) throw new RecutRefusal(`scene ${id}'s line has no heard words in the take; the take needs a re-roll, the cut cannot add a line`);
  }
}

function recutPlan({ duration, fps, speech, scenes, timeline_scenes: timelineScenes = [], picture_cuts: pictureCuts = [], min_shot_s: minShot = 0.4, max_gap_s: maxGap = 0.25, drop = 'repeats' }) {
  if (!(duration > 0)) throw new RecutRefusal('the take has no length');
  const clamp = (t) => Math.min(Math.max(Number(t) || 0, 0), duration);
  recutCheckSpeech(speech, scenes);
  const entries = (speech || []).map((e) => ({
    entry: e,
    words: (e.words || []).map((w) => {
      const start = clamp(w.start_s);
      return { text: String(w.text), start, end: Math.max(start, clamp(w.end_s)) };
    }),
  }));

  // Heard speech in no line (transcribe-whisper 1.1.2's entries with no scene_id and no written text: a
  // repeated line, a filler) is cut out with drop 'repeats'; with 'none' it is kept as speech.
  const hasLines = (scenes || []).some((s) => String((s && s.line) || '').trim());
  const extra = entries.map((e) => drop === 'repeats' && hasLines && recutIsExtra(e.entry) && e.words.length > 0);

  // What may never be cut: kept words, gaps holding speech the line lacks, and silent beats.
  const fixed = [];
  const occupied = [];
  const per = entries.map((e, n) => (e.words.length && !extra[n] ? recutEntryRepeats(e.entry, e.words, drop) : null));
  entries.forEach((e, n) => {
    const r = per[n];
    if (!r) return;
    e.words.forEach((w, i) => {
      if (!r.droppedWords.has(i)) occupied.push({ start: w.start, end: w.end, kind: 'word' });
    });
    occupied.push(...r.held.map((h) => ({ ...h, kind: 'held' })));
    fixed.push(...r.removals);
  });
  const silent = new Set(
    (scenes || []).map((s, i) => [s, i]).filter(([s]) => !String((s && s.line) || '').trim()).map(([s, i]) => (s.id == null ? String(i + 1) : String(s.id))),
  );
  for (const s of timelineScenes) {
    if (silent.has(String(s.id)) && s.end_s > s.start_s) occupied.push({ start: clamp(s.start_s), end: clamp(s.end_s), kind: 'silent_scene' });
  }
  // A line whose leading or trailing heard words are not in the line: the silence next to it holds them.
  const firstWord = (n) => entries[n].words.find((_, i) => !per[n].droppedWords.has(i));
  const lastWord = (n) => entries[n].words.filter((_, i) => !per[n].droppedWords.has(i)).at(-1);
  const blocked = [];
  entries.forEach((e, n) => {
    if (!per[n]) return;
    if (per[n].leadingSpeech && firstWord(n)) blocked.push({ edge: 'before', at: firstWord(n).start });
    if (per[n].trailingSpeech && lastWord(n)) blocked.push({ edge: 'after', at: lastWord(n).end });
  });
  const solid = recutMerge(occupied);

  // The silences between them, less the repeats already cut.
  const cutsIn = (a, b) => pictureCuts.filter((c) => c >= a - RECUT_EPS && c <= b + RECUT_EPS);
  const gaps = [];
  let at = 0;
  for (const o of solid) {
    if (o.start > at + RECUT_EPS) gaps.push({ start: at, end: o.start });
    at = Math.max(at, o.end);
  }
  if (duration > at + RECUT_EPS) gaps.push({ start: at, end: duration });
  // Leading extras sit in the nearest silence before the line's first word; trailing ones in the nearest after.
  const heldGaps = new Set();
  for (const x of blocked) {
    const g = x.edge === 'before' ? gaps.filter((y) => y.end <= x.at + RECUT_EPS).at(-1) : gaps.find((y) => y.start >= x.at - RECUT_EPS);
    if (g) heldGaps.add(g);
  }
  // Extra speech sits in a silence (no kept word inside it): that silence goes with it, down to max_gap_s,
  // so the line before and the line after join across one pause. Extra speech inside a stretch kept whole
  // (a silent beat) takes only its own words.
  const extraIn = new Map();
  const wordsAt = occupied.filter((o) => o.kind === 'word');
  for (const x of recutMerge(entries.filter((_, n) => extra[n]).map((e) => ({ start: Math.min(...e.words.map((w) => w.start)), end: Math.max(...e.words.map((w) => w.end)), kind: 'extra' })))) {
    const g = gaps.find((y) => y.start <= x.start + RECUT_EPS && x.end <= y.end + RECUT_EPS);
    if (g) {
      const has = extraIn.get(g);
      extraIn.set(g, has ? { start: Math.min(has.start, x.start), end: Math.max(has.end, x.end) } : { start: x.start, end: x.end });
      continue;
    }
    const lo = Math.max(0, ...wordsAt.filter((o) => o.end <= x.start + RECUT_EPS).map((o) => o.end));
    const hi = Math.min(duration, ...wordsAt.filter((o) => o.start >= x.end - RECUT_EPS).map((o) => o.start));
    fixed.push({ start: x.start - Math.min(RECUT_EDGE_S, (x.start - lo) / 2), end: x.end + Math.min(RECUT_EDGE_S, (hi - x.end) / 2), kind: 'extra' });
  }
  const removals = [...fixed];
  // The window of length r starting in [sMin, sMax] that leaves the fewest short shots, then lands on a
  // picture cut (the join reads as that cut), then sits nearest `mid`.
  const pickWindow = (r, sMin, sMax, mid, kind) => {
    const clampS = (t, a, b) => Math.min(Math.max(t, a), b);
    const starts = [clampS(mid, sMin, sMax)];
    for (const c of cutsIn(sMin, sMax + r)) {
      const a = Math.max(sMin, c - r);
      const b = Math.min(sMax, c);
      if (a <= b + RECUT_EPS) starts.push(clampS(mid, a, b), a, b);
    }
    let best = null;
    for (const s of starts) {
      const o = { start: s, end: s + r };
      const onCut = pictureCuts.some((c) => c >= o.start - RECUT_EPS && c <= o.end + RECUT_EPS);
      const score = [recutShortCount([...removals, { ...o, kind }], duration, pictureCuts, minShot), onCut ? 0 : 1, Math.abs(o.start - mid)];
      if (!best || score[0] < best.score[0] || (score[0] === best.score[0] && (score[1] < best.score[1] || (score[1] === best.score[1] && score[2] < best.score[2])))) {
        best = { o, score };
      }
    }
    return best.o;
  };
  for (const g of gaps) {
    const head = g.start <= RECUT_EPS;
    const tail = g.end >= duration - RECUT_EPS;
    const x = extraIn.get(g);
    if (x) {
      // What must go: the extra words and up to RECUT_EDGE_S either side (half the way to a kept word).
      const need = { start: x.start - Math.min(RECUT_EDGE_S, (x.start - g.start) / 2), end: x.end + Math.min(RECUT_EDGE_S, (g.end - x.end) / 2) };
      let cut;
      if (heldGaps.has(g) || (head && tail)) cut = need;
      else if (head) cut = { start: 0, end: Math.max(need.end, g.end - maxGap) };
      else if (tail) cut = { start: Math.min(need.start, g.start + 2 * maxGap), end: duration };
      else {
        const length = g.end - g.start;
        const r = Math.max(length - maxGap, need.end - need.start);
        const sMin = Math.max(need.end - r, g.start);
        const sMax = Math.min(need.start, g.end - r);
        // Keep RECUT_EDGE_S from the kept words when the window allows it.
        const a = Math.min(sMax, Math.max(sMin, g.start + RECUT_EDGE_S));
        const b = Math.max(a, Math.min(sMax, g.end - RECUT_EDGE_S - r));
        cut = pickWindow(r, a, b, g.start + (length - r) / 2, 'extra');
      }
      removals.push({ start: cut.start, end: cut.end, kind: 'extra' });
      continue;
    }
    if (heldGaps.has(g)) continue;
    for (const p of recutFree(g.start, g.end, fixed)) {
      const length = p.end - p.start;
      if (head && p.start <= RECUT_EPS) {
        // The take's head: keep max_gap_s before the first word. A trim, not a join.
        if (length > maxGap && !tail) removals.push({ start: 0, end: p.end - maxGap, kind: 'head' });
        continue;
      }
      if (tail && p.end >= duration - RECUT_EPS) {
        // The tail: hold twice max_gap_s after the last word, so the last reaction lands.
        if (length > 2 * maxGap) removals.push({ start: p.start + 2 * maxGap, end: duration, kind: 'tail' });
        continue;
      }
      if (length <= maxGap + RECUT_EPS) continue;
      const r = length - maxGap;
      // A removal that takes in one of the take's own picture cuts joins two different shots, so the
      // join reads as that cut. Try the middle, and for each cut in reach the window nearest the
      // middle that takes it in, plus its two extremes (they can keep a neighbouring shot long enough).
      const o = pickWindow(r, p.start + RECUT_EDGE_S, p.end - RECUT_EDGE_S - r, p.start + (length - r) / 2, 'dead_air');
      removals.push({ start: o.start, end: o.end, kind: 'dead_air' });
    }
  }

  // Minimum shot: a short shot with no speech in it (or within RECUT_EDGE_S of it) is dropped whole.
  let keep = recutKeep(removals, duration);
  for (const f of recutFragments(keep, pictureCuts)) {
    if (f.end - f.start >= minShot - RECUT_EPS) continue;
    if (!recutTouches(solid, f.start, f.end, RECUT_EDGE_S)) removals.push({ start: f.start, end: f.end, kind: 'short_shot' });
  }

  // Cut points land on the take's frames, so picture and sound cut together.
  const frame = (t) => Math.min(duration, Math.max(0, Math.round(t * fps) / fps));
  const snapped = recutMerge(removals.map((r) => ({ start: frame(r.start), end: r.end >= duration - RECUT_EPS ? duration : frame(r.end), kind: r.kind })));
  // A short shot that holds speech: more of the dead air beside it, else its picture covered by a neighbour.
  const merged = recutMerge(recutLengthen(snapped, duration, pictureCuts, minShot, fps));
  keep = recutKeep(merged, duration);
  if (!keep.length) throw new RecutRefusal('the cut removed the whole take');
  const warnings = [];
  const { covers, uncovered } = recutCovers(keep, pictureCuts, minShot);
  for (const f of uncovered) {
    if (f.end - f.start < minShot - RECUT_EPS) {
      warnings.push(`a ${(f.end - f.start).toFixed(2)}s shot at ${f.start.toFixed(2)}s of the take holds speech and is kept under the ${minShot}s minimum`);
    }
  }

  const map = recutMapper(keep);
  const t3 = (t) => +map(t).toFixed(3);
  const seconds = +keep.reduce((sum, k) => sum + (k.end - k.start), 0).toFixed(3);
  const outSpeech = entries.flatMap((e, n) => (extra[n] ? [] : [n])).map((n) => {
    const e = entries[n];
    const r = per[n];
    const src = e.entry;
    const out = { ...src };
    if (e.words.length) {
      const kept = e.words.filter((_, i) => !(r && r.droppedWords.has(i)));
      out.words = kept.map((w) => ({ text: w.text, start_s: t3(w.start), end_s: Math.max(t3(w.start), t3(w.end)) }));
      if (r && typeof src.spoken === 'string') {
        if (r.droppedSpoken.size) {
          out.spoken = recutTokens(src.spoken).filter((_, x) => !r.droppedSpoken.has(x)).map((t) => t.text).join(' ');
        } else if (r.droppedWords.size && recutSame(recutTokens(src.spoken).map((t) => t.key), e.words.map((w) => kitHeardKey(w.text)))) {
          out.spoken = e.words.filter((_, i) => !r.droppedWords.has(i)).map((w) => w.text).join(' ');
        }
      }
    }
    out.start_s = out.words && out.words.length ? out.words[0].start_s : t3(clamp(src.start_s));
    out.end_s = out.words && out.words.length ? Math.max(out.start_s, out.words.at(-1).end_s) : Math.max(out.start_s, t3(clamp(src.end_s)));
    return out;
  });
  const outScenes = [];
  for (const s of timelineScenes) {
    const start = t3(clamp(s.start_s));
    const end = Math.min(seconds, t3(clamp(s.end_s)));
    if (end - start > 1e-3) outScenes.push({ id: String(s.id), start_s: start, end_s: end });
    else warnings.push(`scene ${s.id} had only dead air and is gone from the timeline`);
  }
  const cuts = merged.map((r) => ({ at_s: t3(r.start), removed_s: +(r.end - r.start).toFixed(3), kind: r.kind }));
  // Source stretches that hold heard speech with no timed words (untimed leading or trailing extras,
  // gaps inside a line the line lacks): never a room-tone window, or the bed would loop that speech.
  const heard = [...heldGaps, ...occupied.filter((o) => o.kind === 'held')].map((g) => ({ start: g.start, end: g.end }));
  return { removals: merged, keep, speech: outSpeech, scenes: outScenes, cuts, seconds, warnings, heard, covers };
}

// ---------------------------------------------------------------------------------------------
// Room tone (W1-15b). A re-cut puts stretches of the street from different moments end to end, so
// the background steps at every join (recut.py measured 2.2 to 6.4 dB). One bed of the take's own
// room tone, looped under the whole edit, bridges those steps. The bed is cut from the ORIGINAL
// take's quietest speech-free window, even when the cut drops that window, and never from a
// stretch that holds speech: a bed cut over a line loops that line under the video (recut.py,
// seed 4815, where Whisper then heard the question three times).

/** The analysis frame for room-tone levels, in seconds (800 samples at 16 kHz). */
const RECUT_LEVEL_STEP_S = 0.05;
/** The analysis sample rate (mono, s16le) for room-tone levels. */
const RECUT_LEVEL_RATE = 16000;
/** A frame quieter than this is digital silence or a fade, not room tone. */
const RECUT_SILENCE_DB = -80;
/** Speech is kept this far clear of a room-tone window (Whisper's word edges drift). */
const RECUT_ROOM_PAD_S = 0.12;
/** Window lengths tried for the bed, longest first: a longer loop repeats less often. */
const RECUT_ROOM_LENGTHS = [1.0, 0.8, 0.6, 0.4];

/** dB per RECUT_LEVEL_STEP_S frame of mono s16le PCM at RECUT_LEVEL_RATE. -Infinity for a silent frame. */
function recutLevels(pcm) {
  const step = Math.round(RECUT_LEVEL_STEP_S * RECUT_LEVEL_RATE);
  const n = Math.floor(pcm.length / 2);
  const out = [];
  for (let f = 0; (f + 1) * step <= n; f++) {
    let sum = 0;
    for (let i = f * step; i < (f + 1) * step; i++) {
      const v = pcm.readInt16LE(i * 2) / 32768;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / step);
    out.push(rms > 0 ? 20 * Math.log10(rms) : -Infinity);
  }
  return out;
}

/**
 * The stretches of the take that hold speech, padded: every heard word, every line's span, and the
 * planner's `heard` stretches (speech with no timed words, recutPlan's `heard`).
 */
function recutSpeechBusy(speech, pad = RECUT_ROOM_PAD_S, heard = []) {
  const busy = heard.filter((h) => Number.isFinite(h.start) && Number.isFinite(h.end)).map((h) => ({ start: h.start - pad, end: h.end + pad }));
  for (const e of speech || []) {
    const words = (e.words || []).filter((w) => Number.isFinite(w.start_s) && Number.isFinite(w.end_s));
    for (const w of words) busy.push({ start: w.start_s - pad, end: Math.max(w.start_s, w.end_s) + pad });
    if (words.length) busy.push({ start: Math.min(...words.map((w) => w.start_s)) - pad, end: Math.max(...words.map((w) => w.end_s)) + pad });
    if (Number.isFinite(e.start_s) && Number.isFinite(e.end_s) && e.end_s > e.start_s) busy.push({ start: e.start_s - pad, end: e.end_s + pad });
  }
  return recutMerge(busy.map((b) => ({ ...b, kind: 'speech' }))).map(({ start, end }) => ({ start, end }));
}

/**
 * The quietest window of the take to loop as room tone. For each of RECUT_ROOM_LENGTHS, the
 * speech-free window whose loudest frame is quietest (so a footstep or a word onset never lands in
 * the bed), ties broken by the mean level then the earlier start. Across lengths the longest wins
 * (a longer loop repeats less often) unless a shorter one is more than 1 dB quieter at its peak.
 * Frames of digital silence (under RECUT_SILENCE_DB) disqualify a window: a fade is not room tone.
 *   levels  dB per `step_s` frame of the take (recutLevels); busy speech stretches (recutSpeechBusy)
 * Returns {start_s, end_s, level_db, peak_db}, or null when no window of min_s fits.
 */
function recutQuietWindow({ levels, step_s: step = RECUT_LEVEL_STEP_S, busy = [], duration, lengths = RECUT_ROOM_LENGTHS }) {
  const total = Number.isFinite(duration) ? Math.min(duration, levels.length * step) : levels.length * step;
  let pick = null;
  for (const len of [...lengths].sort((a, b) => b - a)) {
    const frames = Math.round(len / step);
    let best = null;
    for (let f = 0; (f + frames) * step <= total + RECUT_EPS; f++) {
      const start = f * step;
      const end = start + frames * step;
      if (busy.some((b) => b.start < end && b.end > start)) continue;
      const win = levels.slice(f, f + frames);
      if (win.length < frames || win.some((v) => !(v >= RECUT_SILENCE_DB))) continue;
      const peak = Math.max(...win);
      const mean = 10 * Math.log10(win.reduce((s, v) => s + 10 ** (v / 10), 0) / win.length);
      if (!best || peak < best.peak_db - 1e-9 || (Math.abs(peak - best.peak_db) <= 1e-9 && mean < best.level_db - 1e-9)) {
        best = { start_s: +start.toFixed(3), end_s: +end.toFixed(3), level_db: +mean.toFixed(2), peak_db: peak };
      }
    }
    if (best && (!pick || best.peak_db < pick.peak_db - 1)) pick = best;
  }
  return pick && { ...pick, peak_db: +pick.peak_db.toFixed(2) };
}

// ---- speech-recut/src/part.mjs ----
// speech-recut: re-cuts ONE take of on-camera speech into a tighter edit,
// free and local (render-street-interview's recut.py). Picture and sound are
// cut together, so lip sync survives. The take's own heard words
// (transcribe-whisper on that take) say where the speech is; the take's own
// picture cuts (ffmpeg scene detection) say where a join can hide.
//
// What it cuts (src/recut.mjs has the rules): dead air down to max_gap_s,
// with the join on a picture cut when one falls in the silence; repeats and
// stutters inside a line (never a whole line); shots under min_shot_s that
// hold no speech. Output at `fps` (30 by default; Seedance returns 24). A
// short shot that holds speech takes back some of the dead air beside it, or
// (1.0.1) has its picture covered by the shot before or after it while its
// sound plays on, so the cut never flashes a shot under min_shot_s.
//
// Finishing: `room_tone` loops the take's quietest speech-free window under
// the whole edit, so the street does not step at every join; `grade:
// street-light` is recut.py's phone_look_video.py default (a 0.03 black lift
// into the real-footage band, a 0.12 unsharp halo, no grain). The final encode
// caps its bitrate and an output over 180 MB is refused (size rule, critic #38).

/** ffmpeg's scene score above which a frame starts a new shot (recut.py measured at 0.30). */
export const RECUT_SCENE_THRESHOLD = 0.3;
const RECUT_FADE_S = 0.006;
/** A finished video over this is refused before upload (the server takes 200 MB; critic #38). */
export const RECUT_MAX_BYTES = 180 * 1024 * 1024;
/** The bitrate cap on the final encode (size rule §4.12; street-light has no grain). */
export const RECUT_RATE_CAP = ['-maxrate', '16M', '-bufsize', '32M'];
/** The room-tone bed's level against the window it is cut from, when room_tone gives no gain_db. */
export const RECUT_ROOM_GAIN_DB = -6;

/**
 * The video filters a grade adds after the frame rate and size, or '' for none. street-light is
 * phone_look_video.py at its shipped defaults: crushed generated blacks lifted 0.03 into the
 * real-footage band (measured 3.1 -> 9.7 on the 1st percentile), highlights eased to 0.98, a 0.12
 * unsharp halo (0.4 over-sharpened into an AI tell), no grain, no colour match (strength 0).
 */
export function recutGradeChain(grade) {
  if (grade === 'street-light') return 'curves=all=0/0.03 0.5/0.5 1/0.98,unsharp=5:5:0.12:5:5:0.0';
  return '';
}

/** Throws output_invalid for a finished video over `max` bytes, before it is handed on. */
export function recutCheckSize(ctx, video, max = RECUT_MAX_BYTES) {
  if (Number.isFinite(video.bytes) && video.bytes > max) {
    const mb = (b) => (b / 1024 / 1024).toFixed(1);
    throw ctx.error('output_invalid', `the re-cut is ${mb(video.bytes)} MB, over the ${mb(max)} MB a finished video may be; use a shorter take`);
  }
  return video;
}

/**
 * The take's quietest speech-free window, measured on its sound: {start_s, end_s, level_db, peak_db},
 * or null when no window of at least 0.4 s is free of speech and of digital silence. `heard` are
 * stretches that hold speech with no timed words (recutPlan's `heard`); they are never used.
 */
export async function recutFindRoomTone(ctx, video, speech, duration, heard = []) {
  const raw = join(ctx.tmpDir, 'levels.raw');
  await kitFfmpeg(ctx, ['-i', video.path, '-map', '0:a:0', '-vn', '-ac', '1', '-ar', String(RECUT_LEVEL_RATE), '-c:a', 'pcm_s16le', '-f', 's16le', raw]);
  const levels = recutLevels(readFileSync(raw));
  return recutQuietWindow({ levels, step_s: RECUT_LEVEL_STEP_S, busy: recutSpeechBusy(speech, RECUT_ROOM_PAD_S, heard), duration });
}

/**
 * The bed's loop: the window, then the window reversed, as a stereo 48 kHz wav. Played on a loop the
 * palindrome has no seam (each end meets the same sample), so no click repeats under the edit.
 */
export async function recutRoomLoop(ctx, video, win, mono) {
  const out = join(ctx.tmpDir, 'room.wav');
  const len = win.end_s - win.start_s;
  await kitFfmpeg(ctx, [
    '-ss',
    kitNum(win.start_s),
    '-t',
    kitNum(len),
    '-i',
    video.path,
    '-filter_complex',
    `[0:a]aresample=48000,${mono ? 'pan=stereo|c0=c0|c1=c0,' : ''}aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,` +
      `atrim=0:${kitNum(len)},asetpts=PTS-STARTPTS,asplit[f][r];[r]areverse[b];[f][b]concat=n=2:v=0:a=1[room]`,
    '-map',
    '[room]',
    '-c:a',
    'pcm_s16le',
    out,
  ]);
  return out;
}

/** The take's own shot changes, in seconds: ffmpeg scene detection on a small copy of the picture. */
export async function recutPictureCuts(ctx, video) {
  const { stderr } = await kitFfmpeg(ctx, [
    '-i',
    video.path,
    '-an',
    '-vf',
    `scale=192:-2,select='gt(scene\\,${RECUT_SCENE_THRESHOLD})',showinfo`,
    '-f',
    'null',
    '-',
  ]);
  const cuts = [];
  for (const m of stderr.matchAll(/\bpts_time:\s*(-?\d+(?:\.\d+)?)/g)) {
    const t = Number(m[1]);
    if (Number.isFinite(t) && t > 0) cuts.push(t);
  }
  return [...new Set(cuts)].sort((a, b) => a - b);
}

/**
 * The filters that cover short shots on the joined picture `input` (at the take's frame rate, `total` frames):
 * each cover [a, b) of frame numbers shows the frame before it (`prev`) or after it (`next`) instead, by
 * cutting the picture around the covers and padding the pieces either side with a held frame. Returns the
 * filter strings, ending in `[out]`; the frame count is unchanged.
 */
export function recutCoverGraph(input, covers, total, out) {
  const sorted = [...covers].sort((x, y) => x.a - y.a);
  const pieces = [];
  let at = 0;
  for (const c of sorted) {
    pieces.push({ s: at, e: c.a, start: 0, stop: 0 });
    at = c.b;
  }
  pieces.push({ s: at, e: total, start: 0, stop: 0 });
  const real = (j) => pieces[j].e > pieces[j].s;
  sorted.forEach((c, i) => {
    const len = c.b - c.a;
    const before = () => [...pieces.keys()].filter((j) => j <= i && real(j)).at(-1);
    const after = () => [...pieces.keys()].find((j) => j > i && real(j));
    const j = c.from === 'prev' ? (before() ?? after()) : (after() ?? before());
    if (j === undefined) throw new Error('every shot is covered; there is no picture to hold');
    if (j <= i) pieces[j].stop += len;
    else pieces[j].start += len;
  });
  const used = pieces.filter((p) => p.e > p.s);
  const chain = (p) =>
    `trim=start_frame=${p.s}:end_frame=${p.e},setpts=PTS-STARTPTS` +
    (p.start ? `,tpad=start=${p.start}:start_mode=clone` : '') +
    (p.stop ? `,tpad=stop=${p.stop}:stop_mode=clone` : '');
  if (used.length === 1) return [`[${input}]${chain(used[0])}[${out}]`];
  return [
    `[${input}]split=${used.length}${used.map((_, k) => `[cs${k}]`).join('')}`,
    ...used.map((p, k) => `[cs${k}]${chain(p)}[cp${k}]`),
    `${used.map((_, k) => `[cp${k}]`).join('')}concat=n=${used.length}:v=1:a=0[${out}]`,
  ];
}

/** Channels in the take's first sound stream. A mono take is copied to both sides, not mixed down 3 dB. */
export async function recutChannels(ctx, video) {
  try {
    const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'csv=p=0', video.path]);
    const n = parseInt(String(stdout).trim(), 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  // `speech` is optional: a style can only bind step.<id>.<output>, one level, so the street-interview
  // chain passes transcribe-whisper's timeline and its speech is used. The refusals below still apply.
  if (inputs.speech == null) inputs = { ...inputs, speech: inputs.timeline.speech };
  // The refusals that need no measuring run before any probe or ffmpeg work.
  try {
    recutCheckSpeech(inputs.speech, inputs.scenes);
  } catch (err) {
    if (err instanceof RecutRefusal) throw ctx.error('bad_input', err.message);
    throw err;
  }
  const info = await ctx.tools.probe(inputs.video.path);
  if (!info.has_audio) throw ctx.error('bad_input', 'the take has no sound; speech-recut cuts picture and speech together');
  if (!info.width || !info.height) throw ctx.error('bad_input', 'the take has no picture');
  const duration = await kitDuration(ctx, inputs.video);
  const srcFps = Number.isFinite(info.fps) && info.fps > 0 ? info.fps : inputs.timeline.fps;
  const fps = inputs.fps ?? 30;
  const pictureCuts = await recutPictureCuts(ctx, inputs.video);
  const mono = (await recutChannels(ctx, inputs.video)) === 1;
  const grade = inputs.grade ?? 'none';
  ctx.progress({ done: 1, total: 3 });

  let plan;
  try {
    plan = recutPlan({
      duration,
      fps: srcFps,
      speech: inputs.speech,
      scenes: inputs.scenes,
      timeline_scenes: inputs.timeline.scenes,
      picture_cuts: pictureCuts,
      min_shot_s: inputs.min_shot_s ?? 0.4,
      max_gap_s: inputs.max_gap_s ?? 0.25,
      drop: inputs.drop ?? 'repeats',
    });
  } catch (err) {
    if (err instanceof RecutRefusal) throw ctx.error('bad_input', err.message);
    throw err;
  }
  for (const w of plan.warnings) ctx.log.warn(w);
  ctx.log.info('speech-recut plan', { picture_cuts: pictureCuts.length, removals: plan.removals.length, covers: plan.covers.length, from_s: +duration.toFixed(3), to_s: plan.seconds });
  const dropped = (inputs.speech || []).filter((e) => recutIsExtra(e) && (e.words || []).length && (inputs.drop ?? 'repeats') === 'repeats');
  if (dropped.length) ctx.log.info('speech-recut dropped heard speech that is in no line', { spoken: dropped.map((e) => e.spoken ?? '').filter(Boolean) });

  // Room tone: measured on the ORIGINAL take, before the cut, so a window the cut drops still serves.
  let room = null;
  if (inputs.room_tone) {
    const win = await recutFindRoomTone(ctx, inputs.video, inputs.speech, duration, plan.heard);
    if (!win) ctx.log.warn('speech-recut found no speech-free window of 0.4 s or more with room tone in it; the edit has no room-tone bed');
    else {
      const gain = inputs.room_tone.gain_db ?? RECUT_ROOM_GAIN_DB;
      room = { ...win, gain_db: gain, path: await recutRoomLoop(ctx, inputs.video, win, mono) };
      ctx.log.info('speech-recut room tone', { start_s: win.start_s, end_s: win.end_s, level_db: win.level_db, gain_db: gain });
    }
  }

  // One input per kept stretch, seeked a second early and trimmed exactly, so no stretch of the take is
  // buffered in memory while another is read. Each stretch's sound fades in and out over 6 ms: no clicks.
  const w = info.width - (info.width % 2);
  const h = info.height - (info.height % 2);
  const args = [];
  const graph = [];
  const half = 0.25 / srcFps;
  const firstFrame = [];
  let joined = 0;
  for (const [k, seg] of plan.keep.entries()) {
    const seek = Math.max(0, seg.start - 1);
    const off = seg.start - seek;
    const len = seg.end - seg.start;
    const frames = Math.max(1, Math.round(len * srcFps));
    firstFrame.push(joined);
    joined += frames;
    if (seek > 0) args.push('-ss', kitNum(seek));
    args.push('-t', kitNum(off + len + 0.5), '-i', inputs.video.path);
    graph.push(
      `[${k}:v]trim=start=${kitNum(Math.max(0, off - half))},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${kitNum(2 / srcFps, 4)},` +
        `trim=end_frame=${frames},setpts=PTS-STARTPTS[v${k}]`,
    );
    const fade = Math.min(RECUT_FADE_S, len / 4);
    graph.push(
      `[${k}:a]atrim=start=${kitNum(off)}:end=${kitNum(off + len)},asetpts=PTS-STARTPTS,aresample=48000,${mono ? 'pan=stereo|c0=c0|c1=c0,' : ''}` +
        `aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,apad,atrim=0:${kitNum(len)},` +
        `afade=t=in:d=${kitNum(fade)},afade=t=out:st=${kitNum(len - fade)}:d=${kitNum(fade)}[a${k}]`,
    );
  }
  const n = plan.keep.length;
  // The output is a whole number of output frames: picture and sound are both cut to it, and the
  // timeline and `seconds` carry the same length, so a downstream layer sees the file's true length.
  // Rounded UP from the exact kept length (not the plan's 3-decimal `seconds`), so the last kept frame of
  // sound is never trimmed; the pad is under one frame (the last picture held, silence under it).
  const kept = plan.keep.reduce((sum, k) => sum + (k.end - k.start), 0);
  const outFrames = Math.max(1, Math.ceil(kept * fps - 1e-6));
  const seconds = outFrames / fps;
  // A covered short shot: its frames on the joined picture, by the stretch it sits in.
  const covers = plan.covers
    .map((c) => {
      const k = plan.keep.findIndex((seg) => c.start >= seg.start - 1e-6 && c.end <= seg.end + 1e-6);
      if (k < 0) return null;
      const a = firstFrame[k] + Math.round((c.start - plan.keep[k].start) * srcFps);
      const b = Math.min(joined, firstFrame[k] + Math.round((c.end - plan.keep[k].start) * srcFps));
      return b > a ? { a, b, from: c.from } : null;
    })
    .filter(Boolean);
  graph.push(`${plan.keep.map((_, k) => `[v${k}][a${k}]`).join('')}concat=n=${n}:v=1:a=1[${covers.length ? 'joined' : 'cv'}][${room ? 'cut' : 'speech'}]`);
  if (covers.length) graph.push(...recutCoverGraph('joined', covers, joined, 'cv'));
  if (room) {
    // The bed under the whole edit, at gain_db against its window; the speech is untouched.
    // The loop is the aloop filter on one read of the file, not -stream_loop on the input: with
    // -stream_loop (any count) the kit's ffmpeg 6.1 writes the whole edit and then never exits, so the
    // step timed out on every take with a room-tone window. ffmpeg 7 and later finish either way. The
    // bed file is the window forward then reversed at 48 kHz (recutRoomLoop), twice the window long.
    const loopSamples = Math.ceil(2 * (room.end_s - room.start_s) * 48000);
    args.push('-i', room.path);
    graph.push(`[${n}:a]aloop=loop=-1:size=${loopSamples},volume=${kitNum(room.gain_db, 3)}dB,atrim=0:${kitNum(seconds)},asetpts=PTS-STARTPTS[bed]`);
    graph.push('[cut][bed]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[speech]');
  }
  graph.push(`[speech]apad,atrim=0:${kitNum(seconds)},asetpts=PTS-STARTPTS[aout]`);
  const gradeChain = recutGradeChain(grade);
  graph.push(
    `[cv]fps=${fps},tpad=stop_mode=clone:stop_duration=${kitNum(2 / fps, 4)},trim=end_frame=${outFrames},setpts=PTS-STARTPTS,` +
      `scale=${w}:${h}${gradeChain ? `,${gradeChain}` : ''},setsar=1,format=yuv420p[vout]`,
  );
  ctx.progress({ done: 2, total: 3 });
  await kitFfmpeg(ctx, [
    ...args,
    '-filter_complex',
    graph.join(';'),
    '-map',
    '[vout]',
    '-map',
    '[aout]',
    ...ctx.tools.encodeArgs('aac'),
    ...ctx.tools.encodeArgs('h264-master'),
    ...RECUT_RATE_CAP,
    '-r',
    String(fps),
    join(ctx.workDir, 'recut.mp4'),
  ]);
  const video = recutCheckSize(ctx, await ctx.file('recut.mp4', 'video'));
  const got = await ctx.tools.probe(video.path);
  if (!Number.isFinite(got.duration_s) || Math.abs(got.duration_s - seconds) > 1 / fps + 0.05) {
    throw ctx.error('output_invalid', `the re-cut is ${got.duration_s}s, expected ${kitNum(seconds, 3)}s`);
  }
  ctx.progress({ done: 3, total: 3 });

  // Scenes that ran to the plan's end run to the file's end (it differs by under one output frame).
  const outSeconds = +seconds.toFixed(3);
  const scenes = plan.scenes
    .map((sc) => ({ ...sc, end_s: sc.end_s >= plan.seconds - 1e-3 ? outSeconds : Math.min(sc.end_s, outSeconds) }))
    .filter((sc) => sc.end_s - sc.start_s > 1e-3);
  const cap = (t) => Math.min(t, outSeconds);
  const speech = plan.speech.map((e) => ({
    ...e,
    start_s: cap(e.start_s),
    end_s: cap(e.end_s),
    ...(e.words ? { words: e.words.map((wd) => ({ ...wd, start_s: cap(wd.start_s), end_s: cap(wd.end_s) })) } : {}),
  }));
  const timeline = { duration_s: outSeconds, width: w, height: h, fps, scenes, speech };
  if (inputs.timeline.safe_zones) timeline.safe_zones = inputs.timeline.safe_zones;
  return kitCheckOutputs(ctx, manifest, { video, seconds: outSeconds, timeline, cuts: plan.cuts });
}
