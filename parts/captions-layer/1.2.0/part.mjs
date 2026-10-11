// Built from captions-layer/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
import { readFile, stat, writeFile } from 'node:fs/promises';
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

// ---- captions-layer/src/part.mjs ----
// captions-layer: burns word-timed captions onto the cut and returns a WebVTT
// of exactly what it drew. The look comes from the style's caption look
// (expect.caption_look, copied there by the kit from style.traits.caption_look):
//   plate    caption-burn's rule: one or two words on a dark rounded plate
//            (the default, and what an unknown preset falls back to);
//   stroke   white bold type with a black outline, no plate, up to 5 words;
//   karaoke  groups of up to 5 outlined words, the spoken word in the
//            highlight colour.
// A look is never refused: an unknown preset (one a later version draws) or a
// bad parameter is dropped with a warning and the rest is drawn. Captions
// stop where the timeline's end card starts and are never drawn inside it;
// the last caption otherwise holds to the final frame (it is the call to
// action). Captions stay inside the 4:5 feed crop (y 0.148 to 0.852), the
// TikTok/Reels bands and the timeline's caption safe zone. Timings come from
// the timeline's speech words; only when there are none is the cut's own
// audio transcribed (fal Whisper, the layer's one paid call), and a spoken
// word the transcript writes differently is placed between its neighbours.
// Captions are drawn in the kit's Chromium with the brand's font (or the
// bundled one) and overlaid with ffmpeg, so no libass or system font is
// needed. The final encode is capped at 16 Mbit/s, and a result over 180 MB
// is refused before upload.

const CAP = 0.019;
const Y = 0.62;
const SAFE_TOP = 285 / 1920;
const SAFE_BOTTOM = 1635 / 1920;
const PLATE = 'rgba(58,58,60,0.839)';
const MAX_BYTES = 180 * 1000 * 1000;
const PRESETS = new Set(['plate', 'stroke', 'karaoke']);
const LATER_PRESETS = new Set(['pill', 'serif-word', 'sentence']);
const DEFAULT_WORDS = { plate: 2, stroke: 5, karaoke: 5 };
// Outlined presets show at most five words at a time; a larger max_words is cut to five.
const MAX_OUTLINED = 5;
const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * The caption look to draw, read from expect.caption_look. Never throws: every
 * value this version cannot use is dropped with a warning.
 */
function readLook(raw, brand, log) {
  const look = { preset: 'plate', max_words: null, y: Y, font: null, highlight: [], highlight_color: null, case: 'as_written', skip_first_scene: false };
  if (raw === undefined || raw === null) return finishLook(look, brand, log);
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    log.warn('caption look is not an object; drawing plate captions', { caption_look: raw });
    return finishLook(look, brand, log);
  }
  const drop = (key, why) => log.warn(`caption look ${key} ignored: ${why}`, { [key]: raw[key] });
  if (raw.preset !== undefined) {
    if (PRESETS.has(raw.preset)) look.preset = raw.preset;
    else if (LATER_PRESETS.has(raw.preset)) log.warn(`caption look preset ${raw.preset} needs a later captions layer; drawing plate captions`, { preset: raw.preset });
    else log.warn(`unknown caption look preset ${JSON.stringify(raw.preset)}; drawing plate captions`, { preset: raw.preset });
  }
  if (raw.max_words !== undefined) {
    if (Number.isInteger(raw.max_words) && raw.max_words >= 1 && raw.max_words <= 8) look.max_words = raw.max_words;
    else drop('max_words', 'not a whole number from 1 to 8');
  }
  if (raw.y !== undefined) {
    if (typeof raw.y === 'number' && Number.isFinite(raw.y)) {
      look.y = Math.min(0.82, Math.max(0.4, raw.y));
      if (look.y !== raw.y) log.warn('caption look y clamped to 0.40-0.82', { y: raw.y, used: look.y });
    } else drop('y', 'not a number');
  }
  if (raw.font !== undefined) {
    if (raw.font === 'sans_bold' || raw.font === 'brand') look.font = raw.font;
    else if (raw.font === 'serif' || raw.font === 'rounded') drop('font', `${raw.font} is bundled in a later captions layer; using the default font`);
    else drop('font', 'not sans_bold, serif, rounded or brand');
  }
  if (raw.highlight !== undefined) {
    if (Array.isArray(raw.highlight)) {
      for (const h of raw.highlight) {
        if ((h === 'brand' || h === 'cta') && !look.highlight.includes(h)) look.highlight.push(h);
        else if (h !== 'brand' && h !== 'cta') drop('highlight', `${JSON.stringify(h)} is not brand or cta`);
      }
    } else drop('highlight', 'not a list');
  }
  if (raw.highlight_color !== undefined) {
    if (typeof raw.highlight_color === 'string' && HEX.test(raw.highlight_color)) look.highlight_color = raw.highlight_color;
    else drop('highlight_color', 'not a #RRGGBB colour');
  }
  if (raw.case !== undefined) {
    if (['as_written', 'lower', 'upper'].includes(raw.case)) look.case = raw.case;
    else drop('case', 'not as_written, lower or upper');
  }
  if (raw.skip_first_scene !== undefined) {
    if (typeof raw.skip_first_scene === 'boolean') look.skip_first_scene = raw.skip_first_scene;
    else drop('skip_first_scene', 'not true or false');
  }
  return finishLook(look, brand, log);
}

function finishLook(look, brand, log) {
  if (!look.max_words) look.max_words = DEFAULT_WORDS[look.preset];
  if (look.preset !== 'plate' && look.max_words > MAX_OUTLINED) {
    if (log) log.warn(`caption look max_words cut to ${MAX_OUTLINED} for ${look.preset} captions`, { max_words: look.max_words });
    look.max_words = MAX_OUTLINED;
  }
  if (!look.highlight_color) {
    const primary = brand && brand.colors && brand.colors.primary;
    look.highlight_color = typeof primary === 'string' && HEX.test(primary) ? primary : '#FFD400';
  }
  return look;
}

function syllables(w) {
  const s = String(w).toLowerCase().replace(/[^a-z]/g, '');
  const n = s ? (s.match(/[aeiouy]+/g) || []).length : 1;
  return Math.max(1, n - (s.endsWith('e') && n > 1 ? 1 : 0));
}

/** Plate groups of 1 to `per` words, the way caption-burn groups them for a line spanning `span` seconds. */
function plateGroups(words, span, per) {
  const n = Math.max(1, Math.min(per, Math.round(words.length / Math.max(1, span / 0.6))));
  const groups = [];
  for (let i = 0; i < words.length; i += n) groups.push(words.slice(i, i + n));
  if (groups.length > 1 && groups.at(-1).length === 1 && groups.at(-2).length < per + 1) {
    const tail = groups.pop();
    groups[groups.length - 1] = groups.at(-1).concat(tail);
  }
  return groups;
}

/**
 * Stroke and karaoke groups: phrases end at punctuation or a pause over 0.6 s, and each phrase is cut into
 * the fewest groups of at most `per` words, of near-equal size.
 */
function phraseGroups(words, per) {
  const phrases = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    if (!next || /[.!?,;:]["')\]]*$/.test(w.text) || next.start_s - w.end_s > 0.6) {
      phrases.push(cur);
      cur = [];
    }
  });
  const groups = [];
  for (const p of phrases) {
    const n = Math.ceil(p.length / per);
    let at = 0;
    for (let g = 0; g < n; g++) {
      const size = Math.ceil((p.length - at) / (n - g));
      groups.push(p.slice(at, at + size));
      at += size;
    }
  }
  return groups;
}

/** Times from syllables inside the line, for a line the transcript could not place. */
function estimateWords(text, start, end) {
  const words = text.split(/\s+/).filter(Boolean);
  const total = words.reduce((a, w) => a + syllables(w), 0);
  let t = start;
  return words.map((w) => {
    const d = ((end - start) * syllables(w)) / total;
    const out = { text: w, start_s: t, end_s: Math.min(t + d, end) };
    t += d;
    return out;
  });
}

function vttTime(s) {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const pad = (v, n = 2) => String(v).padStart(n, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}.${pad(ms % 1000, 3)}`;
}

async function transcribe(ctx, video) {
  if (!ctx.line) throw ctx.error('needs_missing', 'transcribing needs the private line');
  await kitFfmpeg(ctx, ['-i', video.path, '-map', '0:a:0', '-ac', '1', ...ctx.tools.encodeArgs('aac'), join(ctx.tmpDir, 'speech.m4a')]);
  const audio = await ctx.file(join(ctx.tmpDir.slice(ctx.workDir.length + 1), 'speech.m4a'), 'audio');
  const result = await ctx.line.order({
    piece: 'transcribe',
    provider: 'fal',
    path: 'fal-ai/whisper',
    body: { audio_url: audio, task: 'transcribe', language: 'en', chunk_level: 'word' },
    results: [],
  });
  return kitHeardWords(result.json);
}

/** A word reduced to what a highlight phrase is matched on. */
function matchKey(text) {
  return String(text)
    .toLowerCase()
    .replace(/['’]s$/, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

/** The phrases a look highlights: the brand name and the call to action, as match keys joined. */
function highlightPhrases(look, brand) {
  const out = [];
  if (look.highlight.includes('brand') && brand.name) out.push(brand.name);
  if (look.highlight.includes('cta') && brand.cta && brand.cta.text) out.push(brand.cta.text);
  return out.map((p) => p.split(/\s+/).map(matchKey).join('')).filter(Boolean);
}

/** Marks words (in order) that spell a highlight phrase, across up to 6 words ("Drink AG1" or "DrinkAG1"). */
function markHighlights(words, phrases) {
  if (!phrases.length) return;
  const keys = words.map((w) => matchKey(w.text));
  for (let i = 0; i < words.length; i++) {
    if (!keys[i]) continue;
    let joined = '';
    for (let j = i; j < Math.min(words.length, i + 6); j++) {
      joined += keys[j];
      if (phrases.includes(joined)) for (let k = i; k <= j; k++) words[k].hi = true;
      if (!phrases.some((p) => p.startsWith(joined))) break;
    }
  }
}

/** The span the layer must leave clear: the timeline's end card, when it has one. */
function endCardOf(timeline, duration) {
  const ec = timeline.end_card;
  if (!ec || !Number.isFinite(ec.start_s) || !Number.isFinite(ec.end_s) || ec.end_s <= ec.start_s) return null;
  return { start_s: Math.max(0, ec.start_s), end_s: Math.min(duration, ec.end_s) };
}

/** The timed lines to caption, before grouping: [{start, end, words, scene_id}]. */
async function timedLines(ctx, inputs) {
  const speech = (inputs.timeline.speech || []).filter((s) => String(s.text || '').trim());
  if (speech.length && speech.every((s) => (s.words || []).length)) {
    return speech.map((s) => ({ start: s.start_s, end: s.end_s, words: s.words, scene_id: s.scene_id }));
  }
  const heard = await transcribe(ctx, inputs.video);
  if (speech.length) {
    let from = 0;
    return speech.map((s) => {
      const placed = (s.words || []).length ? { words: s.words, next: from } : kitHeardPlace(s.text, s.start_s, s.end_s, heard, from);
      if (placed) {
        from = placed.next;
        return { start: s.start_s, end: s.end_s, words: placed.words, scene_id: s.scene_id };
      }
      ctx.log.warn('caption line timed from syllables', { scene_id: s.scene_id || null });
      return { start: s.start_s, end: s.end_s, words: estimateWords(s.text, s.start_s, s.end_s), scene_id: s.scene_id };
    });
  }
  if (!heard.length) throw ctx.error('bad_input', 'nothing was said to caption');
  return [{ start: heard[0].start, end: heard.at(-1).end, words: heard.map((w) => ({ text: w.text, start_s: w.start, end_s: w.end })) }];
}

/**
 * Drops the first scene's words when the look asks: every line tagged with the first scene's id and, when the
 * scene has an end time, every word mostly inside it. Returns the lines left and the time no caption may start
 * before (the first scene's end, else 0).
 */
function skipFirstScene(lines, timeline) {
  const first = (timeline.scenes || [])[0];
  if (!first) return { lines: lines.slice(1), floor: 0 };
  let left = lines.filter((l) => l.scene_id === undefined || l.scene_id === null || l.scene_id !== first.id);
  const end = Number.isFinite(first.end_s) ? first.end_s : null;
  if (end !== null) {
    left = left.map((l) => ({ ...l, words: l.words.filter((w) => (w.start_s + w.end_s) / 2 >= end) })).filter((l) => l.words.length);
  }
  return { lines: left, floor: end || 0 };
}

/**
 * Every caption cue [{words, start_s, end_s, states}] for the cut. A cue's states are the images it shows:
 * one for plate and stroke, one per spoken word for karaoke. No cue reaches into the end card; the last
 * one before it holds to its start, else to the end of the cut.
 */
async function buildCues(ctx, inputs, duration, look) {
  let lines = await timedLines(ctx, inputs);
  const endCard = endCardOf(inputs.timeline, duration);
  let floor = 0;
  if (look.skip_first_scene) ({ lines, floor } = skipFirstScene(lines, inputs.timeline));
  // The caption track stops for good where the end card starts: nothing is captioned from there on.
  const inCard = (t) => endCard && t >= endCard.start_s - 1e-6;
  const phrases = highlightPhrases(look, inputs.brand);
  const cues = [];
  const kept = [];
  for (const line of lines) {
    const words = line.words.filter((w) => !inCard(w.start_s)).map((w) => ({ text: w.text, start_s: w.start_s, end_s: w.end_s, hi: false }));
    if (!words.length) continue;
    markHighlights(words, phrases);
    kept.push(...words);
    const groups = look.preset === 'plate' ? plateGroups(words, line.end - line.start, look.max_words) : phraseGroups(words, look.max_words);
    for (const g of groups) cues.push({ words: g, start_s: g[0].start_s, end_s: g.at(-1).end_s });
  }
  if (!cues.length) {
    throw ctx.error('bad_input', endCard || look.skip_first_scene ? 'nothing was said to caption outside the end card and skipped scene' : 'nothing was said to caption');
  }
  cues.sort((a, b) => a.start_s - b.start_s);
  for (let i = 0; i < cues.length - 1; i++) {
    // Close small gaps so captions do not flicker off, never overlapping the next.
    cues[i].end_s = Math.max(cues[i].end_s, Math.min(cues[i + 1].start_s, cues[i].end_s + 0.5));
    cues[i].end_s = Math.min(cues[i].end_s, cues[i + 1].start_s);
  }
  cues.at(-1).end_s = Math.max(cues.at(-1).end_s, duration);
  for (const c of cues) {
    c.start_s = Math.max(0, floor, Math.min(c.start_s, duration));
    c.end_s = Math.max(c.start_s, Math.min(c.end_s, duration));
    // The held caption (or any cue running on) stops where the end card starts.
    if (endCard) c.end_s = Math.max(c.start_s, Math.min(c.end_s, endCard.start_s));
  }
  const live = cues.filter((c) => c.end_s - c.start_s > 1e-3);
  for (const c of live) {
    if (look.preset !== 'karaoke') {
      c.states = [{ start_s: c.start_s, end_s: c.end_s, active: -1 }];
      continue;
    }
    c.states = [];
    let t = c.start_s;
    c.words.forEach((w, k) => {
      const next = k + 1 < c.words.length ? Math.max(t, Math.min(c.end_s, c.words[k + 1].start_s)) : c.end_s;
      if (next - t > 1e-3) c.states.push({ start_s: t, end_s: next, active: k });
      t = next;
    });
  }
  return { cues: live, words: kept };
}

function fontFormat(path) {
  const m = /\.(ttf|otf|woff2?)$/i.exec(path || '');
  return { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' }[(m ? m[1] : 'ttf').toLowerCase()];
}

/** The font file to draw with: `sans_bold` is the bundled face; otherwise the brand's body or heading face, else the bundled one. */
function fontFile(look, brand, partDir, log) {
  const bundled = { path: join(partDir, 'assets', 'fonts', 'Montserrat-Bold.ttf') };
  if (look.font === 'sans_bold') return bundled;
  const fonts = brand.fonts || {};
  const own = fonts.body || fonts.heading;
  if (!own && look.font === 'brand') log.warn('caption look asks for the brand font but the brand has none; using the bundled font');
  return own || bundled;
}

/**
 * The caption band: inside the feed crop, clear of the TikTok/Reels controls (top 220, bottom 400 and
 * right 140 px at 1080x1920, kept symmetric so captions stay centred) and, when the timeline names one,
 * inside the caption safe zone.
 */
function band(timeline, W, H) {
  const side = (140 * W) / 1080;
  let top = Math.max(SAFE_TOP, 220 / 1920) * H;
  let bottom = Math.min(SAFE_BOTTOM, (1920 - 400) / 1920) * H;
  let left = side;
  let right = W - side;
  const zone = (timeline.safe_zones || []).find((z) => z.use === 'captions');
  if (zone) {
    top = Math.max(top, zone.y);
    bottom = Math.min(bottom, zone.y + zone.h);
    left = Math.max(left, zone.x);
    right = Math.min(right, zone.x + zone.w);
  }
  return { top, bottom, left, right };
}

function caseOf(text, look) {
  if (look.case === 'upper') return text.toUpperCase();
  if (look.case === 'lower') return text.toLowerCase();
  return text;
}

/** The caption page: one #cap box of word spans; .hi words and the .on (spoken) word take the highlight colour. */
function pageHtml(W, H, px, look, fontUri, fontPath) {
  const outline = Math.max(2, Math.round(px * 0.12));
  const box =
    look.preset === 'plate'
      ? `white-space:nowrap;width:max-content;background:${PLATE};padding:${Math.round(px * 0.22)}px ${Math.round(px * 0.46)}px;border-radius:${Math.round(px * 0.3)}px;`
      : `white-space:normal;width:max-content;text-align:center;text-wrap:balance;padding:${outline}px ${outline * 2}px;-webkit-text-stroke:${outline * 2}px #000;paint-order:stroke fill;`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:KitCaption;src:url(${fontUri}) format('${fontFormat(fontPath)}');font-display:block;}
html,body{margin:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden;}
#cap{position:absolute;left:0;top:0;display:inline-block;box-sizing:border-box;font-family:KitCaption;font-weight:700;font-size:${px}px;line-height:1.15;color:#fff;${box}}
#cap.off{display:none;}
#cap .hi,#cap .on{color:${look.highlight_color};}
</style></head><body><div id="cap" class="off"></div></body></html>`;
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  if (!ctx.browser) throw ctx.error('needs_missing', 'captions are drawn in the kit browser');
  const look = readLook(inputs.expect.caption_look, inputs.brand, ctx.log);
  const info = await ctx.tools.probe(inputs.video.path);
  const W = info.width;
  const H = info.height;
  const fps = info.fps || inputs.timeline.fps || 30;
  const duration = await kitDuration(ctx, inputs.video);
  const { cues, words } = await buildCues(ctx, inputs, duration, look);
  // Outlined captions have no plate to carry them, so they are set 15 % larger.
  const px = Math.round(CAP * H * 1.38 * (look.preset === 'plate' ? 1 : 1.15));
  const zone = band(inputs.timeline, W, H);
  if (zone.bottom - zone.top < px * 1.5) throw ctx.error('bad_input', 'the caption safe zone is too small for a caption');
  const font = fontFile(look, inputs.brand, ctx.part.dir, ctx.log);
  const fontUri = `data:font/ttf;base64,${(await readFile(font.path)).toString('base64')}`;
  const page = pageHtml(W, H, px, look, fontUri, font.path);

  const browser = await ctx.browser.launch();
  const drawn = new Map();
  const blank = join(ctx.tmpDir, 'blank.png');
  const keyOf = (c, active) => JSON.stringify([c.words.map((w) => [w.text, w.hi]), active]);
  try {
    const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await p.setContent(page);
    // Fonts load only when text uses them, so load the caption face before anything is measured.
    const loaded = await p.evaluate(async (size) => {
      const faces = await document.fonts.load(`700 ${size}px KitCaption`);
      await document.fonts.ready;
      return faces.length;
    }, px);
    if (!loaded) throw ctx.error('tool_failed', 'the caption font did not load');
    await p.screenshot({ path: blank, type: 'png', omitBackground: true });
    for (const c of cues) {
      if (c.states.every((s) => drawn.has(keyOf(c, s.active)))) continue;
      const placed = await p.evaluate(
        async ({ words, plate, px, top, bottom, y, left, right }) => {
          const el = document.getElementById('cap');
          await document.fonts.load(`700 ${px}px KitCaption`, words.map((w) => w.text).join(' '));
          el.replaceChildren();
          words.forEach((w, i) => {
            if (i) el.appendChild(document.createTextNode(' '));
            const s = document.createElement('span');
            s.textContent = w.text;
            if (w.hi) s.className = 'hi';
            el.appendChild(s);
          });
          el.classList.remove('off');
          const room = right - left;
          el.style.fontSize = '';
          el.style.padding = '';
          el.style.borderRadius = '';
          el.style.maxWidth = '';
          el.style.webkitTextStrokeWidth = '';
          const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
          const padY = parseFloat(getComputedStyle(el).paddingTop) || 0;
          const stroke = parseFloat(getComputedStyle(el).webkitTextStrokeWidth) || 0;
          const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
          let r = el.getBoundingClientRect();
          if (plate) {
            // A plate caption is one line; one wider than the band is set smaller to fit rather than
            // wrapping or leaving the frame. Its natural width is measured and it is resized, not
            // transformed, so the drawn plate is exactly the measured box.
            if (r.width > room) {
              const k = Math.floor((room / r.width) * 1000) / 1000;
              el.style.fontSize = `${px * k}px`;
              el.style.padding = `${Math.round(padY * k)}px ${Math.round(pad * k)}px`;
              el.style.borderRadius = `${Math.round(radius * k)}px`;
              r = el.getBoundingClientRect();
            }
          } else {
            // Outlined captions wrap to at most two lines inside the band, then shrink until they fit.
            el.style.maxWidth = `${room}px`;
            let size = px;
            const fits = () => {
              const lineH = size * 1.15;
              return el.scrollWidth <= room + 0.5 && el.getBoundingClientRect().height <= lineH * 2 + padY * 2 + 1;
            };
            for (let i = 0; i < 40 && !fits(); i++) {
              size *= 0.94;
              const k = size / px;
              el.style.fontSize = `${size}px`;
              el.style.padding = `${Math.round(padY * k)}px ${Math.round(pad * k)}px`;
              el.style.webkitTextStrokeWidth = `${Math.max(1, stroke * k)}px`;
            }
            r = el.getBoundingClientRect();
          }
          const w = r.width;
          const h = r.height;
          const t = Math.min(Math.max(y - h / 2, top), bottom - h);
          const l = left + (right - left - w) / 2;
          el.style.left = `${l}px`;
          el.style.top = `${t}px`;
          return { x: l, y: t, w, h };
        },
        {
          words: c.words.map((w) => ({ text: caseOf(w.text, look), hi: w.hi })),
          plate: look.preset === 'plate',
          px,
          top: zone.top,
          bottom: zone.bottom,
          y: look.y * H,
          left: zone.left,
          right: zone.right,
        },
      );
      c.box = placed;
      for (const s of c.states) {
        const key = keyOf(c, s.active);
        if (drawn.has(key)) continue;
        await p.evaluate((active) => {
          [...document.querySelectorAll('#cap span')].forEach((el, i) => el.classList.toggle('on', i === active));
        }, s.active);
        const file = join(ctx.tmpDir, `cap-${drawn.size}.png`);
        await p.screenshot({ path: file, type: 'png', omitBackground: true });
        drawn.set(key, { file, box: placed });
      }
    }
  } finally {
    await browser.close();
  }
  for (const c of cues) if (!c.box) c.box = drawn.get(keyOf(c, c.states[0].active)).box;

  // One image per interval between state edges, each held for its own length.
  const states = cues.flatMap((c) => c.states.map((s) => ({ ...s, file: drawn.get(keyOf(c, s.active)).file })));
  const edges = [...new Set([0, duration, ...states.flatMap((s) => [s.start_s, s.end_s])])].filter((t) => t >= 0 && t <= duration).sort((a, b) => a - b);
  const list = [];
  for (let i = 0; i + 1 < edges.length; i++) {
    const [t0, t1] = [edges[i], edges[i + 1]];
    if (t1 - t0 < 1e-3) continue;
    const mid = (t0 + t1) / 2;
    const state = states.find((s) => s.start_s <= mid && mid < s.end_s);
    const file = state ? state.file : blank;
    list.push(`file '${file.replace(/'/g, "'\\''")}'`, `duration ${kitNum(t1 - t0, 4)}`);
  }
  list.push(list.at(-2));
  await writeFile(join(ctx.tmpDir, 'cues.txt'), `${list.join('\n')}\n`);
  const out = join(ctx.workDir, 'captioned.mp4');
  await kitFfmpeg(ctx, [
    '-i',
    inputs.video.path,
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    join(ctx.tmpDir, 'cues.txt'),
    '-filter_complex',
    `[1:v]fps=${fps},format=rgba[c];[0:v][c]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]`,
    '-map',
    '[v]',
    '-map',
    '0:a?',
    ...ctx.tools.encodeArgs('h264-master'),
    '-maxrate',
    '16M',
    '-bufsize',
    '32M',
    '-c:a',
    'copy',
    out,
  ]);
  const bytes = (await stat(out)).size;
  if (bytes > MAX_BYTES) {
    throw ctx.error('output_invalid', `the captioned video is ${Math.round(bytes / 1e6)} MB, over the 180 MB limit for an upload`);
  }

  const shown = (c) => c.words.map((w) => caseOf(w.text, look)).join(' ');
  const vtt = ['WEBVTT', ''];
  cues.forEach((c, i) => vtt.push(String(i + 1), `${vttTime(c.start_s)} --> ${vttTime(c.end_s)}`, shown(c), ''));
  await writeFile(join(ctx.workDir, 'captions.vtt'), vtt.join('\n'));
  const record = {
    look: { preset: look.preset, max_words: look.max_words, y: look.y, case: look.case, highlight_color: look.highlight_color },
    words: words.map((w) => ({ text: w.text, start_s: +w.start_s.toFixed(3), end_s: +w.end_s.toFixed(3) })),
    cues: cues.map((c) => ({ text: shown(c), start_s: +c.start_s.toFixed(3), end_s: +c.end_s.toFixed(3), box: c.box })),
  };
  await writeFile(join(ctx.workDir, 'words.json'), `${JSON.stringify(record, null, 1)}\n`);
  const timeline = { ...inputs.timeline };
  if (!(timeline.safe_zones || []).some((z) => z.use === 'captions')) {
    timeline.safe_zones = [...(timeline.safe_zones || []), { use: 'captions', x: Math.round(zone.left), y: Math.round(zone.top), w: Math.round(zone.right - zone.left), h: Math.round(zone.bottom - zone.top) }];
  }
  return kitCheckOutputs(ctx, manifest, {
    video: await ctx.file('captioned.mp4', 'video'),
    timeline,
    captions: await ctx.file('captions.vtt', 'subtitles'),
    words: await ctx.file('words.json', 'json'),
  });
}
