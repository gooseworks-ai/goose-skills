// Built from song-elevenlabs/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- _lib/speech-map.mjs ----
// Pronunciation swaps and word timings for spoken lines. A brand name the
// voice gets wrong is sent as its phonetic spelling (the voice reads notes
// aloud, so never as a note); captions keep the written name. The swap is one
// pass, whole words, any case, longest term first, so a spoken form is never
// rewritten again by a shorter term (today's create-vo-elevenlabs rule).
// Every top-level name starts with `kit`.

const kitWordChar = '[\\p{L}\\p{N}_]';

function kitEscapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The spoken text for `text` after `pairs` ([{term, say_as}]), and a map from
 * every spoken character to the written character range it stands for.
 */
function kitApplySayAs(text, pairs) {
  const usable = (pairs || []).filter((p) => p && String(p.term || '').trim() && String(p.say_as || '').trim());
  const identity = () => {
    const chars = [...text];
    let at = 0;
    const map = chars.map((c) => {
      const r = [at, at + c.length];
      at += c.length;
      return r;
    });
    return { spoken: text, map };
  };
  if (!usable.length) return identity();
  const lookup = new Map();
  for (const p of usable) lookup.set(p.term.trim().toLowerCase(), p.say_as.trim());
  const alternation = [...lookup.keys()].sort((a, b) => b.length - a.length).map(kitEscapeRe).join('|');
  const re = new RegExp(`(?<!${kitWordChar})(${alternation})(?!${kitWordChar})`, 'giu');
  let spoken = '';
  const map = [];
  let last = 0;
  const pushIdentity = (from, to) => {
    let at = from;
    for (const c of text.slice(from, to)) {
      spoken += c;
      for (let i = 0; i < c.length; i++) map.push([at, at + c.length]);
      at += c.length;
    }
  };
  for (const m of text.matchAll(re)) {
    pushIdentity(last, m.index);
    const said = lookup.get(m[1].toLowerCase());
    for (const c of said) {
      spoken += c;
      for (let i = 0; i < c.length; i++) map.push([m.index, m.index + m[1].length]);
    }
    last = m.index + m[1].length;
  }
  pushIdentity(last, text.length);
  // map is per UTF-16 code unit of `spoken`; collapse to per code point like identity().
  const perPoint = [];
  let unit = 0;
  for (const c of spoken) {
    perPoint.push(map[unit]);
    unit += c.length;
  }
  return { spoken, map: perPoint };
}

/**
 * Word timings for the WRITTEN text from a character alignment of the
 * SPOKEN text ({characters, character_start_times_seconds,
 * character_end_times_seconds}), offset by `offset_s`.
 */
function kitWordsFromAlignment(text, sayAs, alignment, offsetS = 0) {
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const words = [];
  const re = /\S+/gu;
  const spans = [];
  for (const m of text.matchAll(re)) spans.push({ text: m[0], from: m.index, to: m.index + m[0].length, start: null, end: null });
  if (!spans.length) return words;
  // Walk spoken characters; each one belongs to the written range sayAs.map gives it.
  const n = Math.min(chars.length, sayAs.map.length);
  for (let i = 0; i < n; i++) {
    const [wFrom, wTo] = sayAs.map[i];
    if (/^\s+$/u.test(chars[i])) continue;
    for (const s of spans) {
      if (wFrom < s.to && wTo > s.from) {
        s.start = s.start === null ? starts[i] : Math.min(s.start, starts[i]);
        s.end = s.end === null ? ends[i] : Math.max(s.end, ends[i]);
      }
    }
  }
  let prevEnd = 0;
  for (const s of spans) {
    // A word the alignment never reached (rare) sits at the previous word's end.
    const start = s.start === null ? prevEnd : s.start;
    const end = s.end === null ? start : Math.max(s.end, start);
    words.push({ text: s.text, start_s: +(start + offsetS).toFixed(3), end_s: +(end + offsetS).toFixed(3) });
    prevEnd = end;
  }
  return words;
}

// ---- song-elevenlabs/src/lyric.mjs ----
// The lyric of a sung song, from the plan's scenes. A scene's `line` is the
// words sung while its picture holds; a scene with no line (null, missing or
// blank) is a silent picture. The lines, joined in scene order, are the lyric.
// Brand names the singer gets wrong are sent as their `say_as` spelling, and
// every sung word maps back to the written word captions show (the same swap
// voice-elevenlabs uses). Pure: no I/O. Every top-level name starts with `song`.

/** An error the part turns into ctx.error(code, message). */
function songFail(code, message) {
  const err = new Error(message);
  err.code = code;
  err.song = true;
  return err;
}

/** A scene's sung line with its whitespace collapsed, or '' for a silent scene. */
function songLineOf(scene) {
  if (!scene || typeof scene.line !== 'string') return '';
  return scene.line.replace(/\s+/gu, ' ').trim();
}

/** A word compared without case, accents or punctuation ("Jacket," = "jacket"). */
function songNorm(word) {
  return String(word || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * The words of every sung scene.
 *
 * - `sung`: one entry per scene with a line, in order: `{index, id, text, spoken,
 *   written: [first, last], sent: [first, last]}` (indexes into the two lists below).
 * - `sent`: every word the singer is asked to sing (after `say_as`), in order:
 *   `{text, scene_index, written: [indexes of the written words it stands for]}`.
 * - `written`: every written word, in order: `{text, scene_index, sent: [indexes]}`.
 *
 * The lyric's word count is `sent.length`; the reply's word timings are matched to it.
 */
function songWordPlan(scenes, pronunciations) {
  const sung = [];
  const sent = [];
  const written = [];
  (scenes || []).forEach((scene, index) => {
    const text = songLineOf(scene);
    if (!text) return;
    const say = kitApplySayAs(text, pronunciations);
    const writtenSpans = [...text.matchAll(/\S+/gu)].map((m) => ({ text: m[0], from: m.index, to: m.index + m[0].length }));
    // Spoken words by code point, because say.map has one entry per code point of say.spoken.
    const sentSpans = [];
    let current = null;
    Array.from(say.spoken).forEach((c, i) => {
      if (/\s/u.test(c)) {
        current = null;
        return;
      }
      if (!current) {
        current = { text: '', from: i, to: i };
        sentSpans.push(current);
      }
      current.text += c;
      current.to = i + 1;
    });
    const firstWritten = written.length;
    for (const w of writtenSpans) written.push({ text: w.text, scene_index: index, sent: [] });
    const firstSent = sent.length;
    let lastHit = 0;
    for (const s of sentSpans) {
      const hits = new Set();
      for (let i = s.from; i < s.to; i++) {
        const range = say.map[i];
        if (!range) continue;
        writtenSpans.forEach((w, k) => {
          if (range[0] < w.to && range[1] > w.from) hits.add(k);
        });
      }
      // Every spoken character maps into a written word; the fallback only guards odd input.
      const local = hits.size ? [...hits].sort((a, b) => a - b) : [lastHit];
      lastHit = local.at(-1);
      const indexes = local.map((k) => firstWritten + k);
      sent.push({ text: s.text, scene_index: index, written: indexes });
      for (const k of indexes) written[k].sent.push(sent.length - 1);
    }
    sung.push({
      index,
      id: scene.id,
      text,
      spoken: say.spoken,
      written: [firstWritten, written.length - 1],
      sent: [firstSent, sent.length - 1],
    });
  });
  return { sung, sent, written };
}

/**
 * Lyric lines for one section: `text` split after each sentence end (. ! ? …,
 * with any closing quote or bracket), and any line longer than `maxChars` split
 * again at a comma, semicolon or space. Words are never changed or dropped, so
 * the lines hold exactly the words of `text`, in order.
 */
function songSplitLines(text, maxChars = 200) {
  const out = [];
  const clean = String(text || '').replace(/\s+/gu, ' ').trim();
  if (!clean) return out;
  for (const sentence of clean.split(/(?<=[.!?…]["'”’)\]]*) /u)) {
    let rest = sentence.trim();
    while (rest.length > maxChars) {
      let cut = rest.lastIndexOf(' ', maxChars);
      const soft = Math.max(rest.lastIndexOf(', ', maxChars - 1), rest.lastIndexOf('; ', maxChars - 1));
      if (soft >= Math.floor(maxChars / 3)) cut = soft + 1;
      if (cut <= 0) throw songFail('bad_input', `a sung word is longer than ${maxChars} characters: "${rest.slice(0, 40)}..."`);
      out.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) out.push(rest);
  }
  return out;
}

/** How many words a lyric text holds, counted the way the reply's timings are matched. */
function songCountWords(text) {
  return (String(text || '').match(/\S+/gu) || []).length;
}

// ---- song-elevenlabs/src/plan.mjs ----
// The composition plan song-elevenlabs sends to ElevenLabs `POST /v1/music/detailed`
// (model music_v1, the `sections` shape). Two ways to lay the song out:
//
// - `sections`: the style names each section, its length and which scenes it sings
//   ([from, to], 1-based scene numbers, in order). A section's lines are its
//   scenes' lines, split after each sentence.
// - `form`: the lyric is split into `groups` sections of whole sentences, each
//   `words x ms_per_word + 500 ms` long (at least `min_section_s`), between an
//   instrumental intro and outro.
//
// Everything here is checked before anything is paid for. Pure: no I/O.
// Every top-level name starts with `song`.

const SONG_MODEL = 'music_v1';
const SONG_SECTION_MIN_MS = 3000;
const SONG_SECTION_MAX_MS = 120000;
const SONG_MAX_SECTIONS = 30;
const SONG_MAX_LINES = 30;
const SONG_MAX_LINE_CHARS = 200;
const SONG_MAX_STYLES = 50;
const SONG_FORM_DEFAULTS = { intro_s: 3, outro_s: 3, groups: 3, ms_per_word: 330, min_section_s: 3 };
// Faster than this and the singer rushes the words (the old recipe planned 330 ms a word).
const songRushMsPerWord = 250;
const songInstrumentalAvoid = ['vocals', 'singing', 'humming'];

/**
 * Style phrases from strings and lists. A string is split at commas, semicolons
 * and new lines ("warm folk, soft piano; 100 bpm"); a list keeps its items.
 * Trimmed, empty ones dropped, repeats dropped (any case), at most 50.
 */
function songStyles(...sources) {
  const out = [];
  const seen = new Set();
  const add = (phrase) => {
    const p = String(phrase).replace(/\s+/gu, ' ').trim();
    if (!p || seen.has(p.toLowerCase())) return;
    seen.add(p.toLowerCase());
    out.push(p);
  };
  for (const s of sources) {
    if (s == null) continue;
    if (Array.isArray(s)) s.forEach((x) => x != null && add(x));
    else String(s).split(/[,;\n]/u).forEach(add);
  }
  return out.slice(0, SONG_MAX_STYLES);
}

function songMs(seconds, what) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) throw songFail('bad_input', `${what} needs a length in seconds`);
  const ms = Math.round(seconds * 1000);
  if (ms < SONG_SECTION_MIN_MS || ms > SONG_SECTION_MAX_MS) {
    throw songFail('bad_input', `${what} is ${seconds} s; a song section must last 3 to 120 s`);
  }
  return ms;
}

function songSectionName(name, where) {
  const n = typeof name === 'string' ? name.trim() : '';
  if (!n || n.length > 100) throw songFail('bad_input', `${where} needs a name of 1 to 100 characters`);
  return n;
}

/** The sent-word range [first, last] covered by some sung scenes, or null. */
function songSentRange(sungScenes) {
  if (!sungScenes.length) return null;
  return [sungScenes[0].sent[0], sungScenes.at(-1).sent[1]];
}

function songSectionsFromStyle(sections, words, sceneCount) {
  if (!Array.isArray(sections) || !sections.length) throw songFail('bad_input', 'sections must list at least one section');
  const out = [];
  let after = 0; // the last scene number a section has claimed
  sections.forEach((sec, k) => {
    const where = `section ${k + 1}`;
    const name = songSectionName(sec && sec.name, where);
    const durationMs = songMs(sec.seconds, `section "${name}"`);
    let range = null;
    if (sec.scenes != null) {
      const [from, to] = Array.isArray(sec.scenes) ? sec.scenes : [];
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
        throw songFail('bad_input', `section "${name}" scenes must be [from, to], scene numbers from 1`);
      }
      if (from <= after) throw songFail('bad_input', `section "${name}" starts at scene ${from}, which an earlier section already sings`);
      if (to > sceneCount) throw songFail('bad_input', `section "${name}" ends at scene ${to}, but the plan has ${sceneCount} scenes`);
      range = [from - 1, to - 1];
      after = to;
    }
    const sung = range ? words.sung.filter((s) => s.index >= range[0] && s.index <= range[1]) : [];
    const lines = songSplitLines(sung.map((s) => s.spoken).join(' '), SONG_MAX_LINE_CHARS);
    out.push({ name, duration_ms: durationMs, styles: songStyles(sec.styles), avoid: songStyles(sec.avoid), scenes: range, lines, sent: songSentRange(sung) });
  });
  const covered = new Set();
  for (const s of out) if (s.scenes) for (let i = s.scenes[0]; i <= s.scenes[1]; i++) covered.add(i);
  const loose = words.sung.find((s) => !covered.has(s.index));
  if (loose) throw songFail('bad_input', `scene ${loose.index + 1} has a line to sing but no section sings it`);
  return out;
}

function songSectionsFromForm(form, words) {
  const f = { ...SONG_FORM_DEFAULTS, ...(form || {}) };
  for (const key of ['intro_s', 'outro_s', 'ms_per_word', 'min_section_s']) {
    if (typeof f[key] !== 'number' || !Number.isFinite(f[key]) || f[key] < 0) throw songFail('bad_input', `form.${key} must be a number of 0 or more`);
  }
  if (!Number.isInteger(f.groups) || f.groups < 1) throw songFail('bad_input', 'form.groups must be a whole number of 1 or more');
  if (f.min_section_s * 1000 < SONG_SECTION_MIN_MS) throw songFail('bad_input', 'form.min_section_s must be at least 3');
  const sentences = songSplitLines(words.sung.map((s) => s.spoken).join(' '), SONG_MAX_LINE_CHARS);
  const g = Math.min(f.groups, sentences.length);
  const size = Math.max(1, Math.round(sentences.length / g));
  const groups = [];
  for (let k = 0; k < g; k++) {
    const part = k < g - 1 ? sentences.slice(k * size, (k + 1) * size) : sentences.slice(k * size);
    if (part.length) groups.push(part);
  }
  const out = [];
  if (f.intro_s > 0) {
    out.push({ name: 'Intro', duration_ms: songMs(f.intro_s, 'form.intro_s'), styles: ['instrumental intro, no vocals'], avoid: songInstrumentalAvoid, scenes: null, lines: [], sent: null });
  }
  let next = 0; // the next sent word
  groups.forEach((lines, k) => {
    const count = lines.reduce((n, l) => n + songCountWords(l), 0);
    const ms = Math.max(Math.round(f.min_section_s * 1000), Math.round(count * f.ms_per_word + 500));
    const last = k === groups.length - 1;
    const name = groups.length === 1 ? 'Verse' : last ? 'Close' : `Verse ${k + 1}`;
    if (ms > SONG_SECTION_MAX_MS) throw songFail('bad_input', `section "${name}" would last ${ms / 1000} s; a song section lasts at most 120 s`);
    const styles = k === 0 ? ['voice enters, closely miked'] : last ? ['the last line sung clearly', 'gentle resolve'] : ['same voice, steady'];
    out.push({ name, duration_ms: ms, styles, avoid: ['tempo increase'], scenes: null, lines, sent: [next, next + count - 1] });
    next += count;
  });
  if (f.outro_s > 0) {
    out.push({ name: 'Outro', duration_ms: songMs(f.outro_s, 'form.outro_s'), styles: ['instrumental outro', 'final chord rings out'], avoid: songInstrumentalAvoid, scenes: null, lines: [], sent: null });
  }
  return out;
}

/**
 * Everything song-elevenlabs decides before it pays: the request's
 * `composition_plan`, the sections with their start times, the lyric's words,
 * and where the hook must land.
 *
 * `inputs`: {scenes, mood?, singer?, brief?, avoid?, sections? | form?, hook?,
 * hook_scene?, ending_scenes?, pronunciations?, max_seconds?}.
 *
 * Returns {composition_plan, sections: [{name, start_ms, duration_ms, scenes, lines, sent}],
 * words (songWordPlan), lyric_words, total_ms, hook: {scene_index, section, target_ms} | null,
 * ending_scenes, warnings}. Throws songFail('bad_input', ...) for a plan it will not sing.
 */
function songCompositionPlan(inputs) {
  const scenes = Array.isArray(inputs && inputs.scenes) ? inputs.scenes : [];
  if (!scenes.length) throw songFail('bad_input', 'the plan has no scenes');
  const words = songWordPlan(scenes, inputs.pronunciations);
  if (!words.sent.length) throw songFail('bad_input', 'no scene has a line to sing');
  const hasSections = inputs.sections != null;
  const hasForm = inputs.form != null;
  if (hasSections === hasForm) throw songFail('bad_input', 'give the song either sections or form, not both and not neither');
  const laid = hasSections ? songSectionsFromStyle(inputs.sections, words, scenes.length) : songSectionsFromForm(inputs.form, words);
  if (laid.length > SONG_MAX_SECTIONS) throw songFail('bad_input', `the song has ${laid.length} sections; ElevenLabs takes at most ${SONG_MAX_SECTIONS}`);
  const warnings = [];
  let at = 0;
  const sections = laid.map((s) => {
    if (s.lines.length > SONG_MAX_LINES) throw songFail('bad_input', `section "${s.name}" has ${s.lines.length} lines; a section takes at most ${SONG_MAX_LINES}`);
    const count = s.sent ? s.sent[1] - s.sent[0] + 1 : 0;
    if (count && s.duration_ms < count * songRushMsPerWord) {
      warnings.push(`section "${s.name}" sings ${count} words in ${s.duration_ms / 1000} s; the singer will rush`);
    }
    const out = { ...s, start_ms: at };
    at += s.duration_ms;
    return out;
  });
  const totalMs = at;
  if (inputs.max_seconds != null && totalMs > inputs.max_seconds * 1000) {
    throw songFail('bad_input', `the song is planned at ${totalMs / 1000} s, longer than max_seconds ${inputs.max_seconds}`);
  }

  const endingScenes = inputs.ending_scenes == null ? 0 : inputs.ending_scenes;
  if (!Number.isInteger(endingScenes) || endingScenes < 0 || endingScenes >= scenes.length) {
    throw songFail('bad_input', `ending_scenes must be a whole number from 0 to ${scenes.length - 1}`);
  }

  let hook = null;
  if (inputs.hook != null && inputs.hook_scene == null) throw songFail('bad_input', 'hook needs hook_scene: the scene whose first sung word is the hook');
  if (inputs.hook_scene != null) {
    const n = inputs.hook_scene;
    if (!Number.isInteger(n) || n < 1 || n > scenes.length) throw songFail('bad_input', `hook_scene must be a scene number from 1 to ${scenes.length}`);
    const sung = words.sung.find((s) => s.index === n - 1);
    if (!sung) throw songFail('bad_input', `hook_scene ${n} has no line, so it cannot open on the hook`);
    if (inputs.hook != null) {
      const want = String(inputs.hook).match(/\S+/gu) || [];
      const have = words.written.slice(sung.written[0], sung.written[0] + want.length).map((w) => songNorm(w.text));
      if (!want.length || want.map(songNorm).join(' ') !== have.join(' ')) {
        throw songFail('bad_input', `scene ${n} must start with the hook "${inputs.hook}"; its line is "${sung.text}"`);
      }
    }
    const first = sung.sent[0];
    const section = sections.findIndex((s) => s.sent && first >= s.sent[0] && first <= s.sent[1]);
    if (section < 0 || sections[section].sent[0] !== first) {
      throw songFail('bad_input', `scene ${n} holds the hook, so its first word must open a section; move the section boundary to scene ${n}`);
    }
    hook = { scene_index: n - 1, section, target_ms: sections[section].start_ms };
  }

  const compositionPlan = {
    positive_global_styles: songStyles(inputs.mood, inputs.singer, inputs.brief),
    negative_global_styles: songStyles(inputs.avoid),
    sections: sections.map((s) => ({
      section_name: s.name,
      positive_local_styles: s.styles,
      negative_local_styles: s.avoid,
      duration_ms: s.duration_ms,
      lines: s.lines,
    })),
  };
  return { composition_plan: compositionPlan, sections, words, lyric_words: words.sent.length, total_ms: totalMs, hook, ending_scenes: endingScenes, warnings };
}

// ---- song-elevenlabs/src/snap.mjs ----
// After the song is sung: match its word timings to the lyric, then time every
// scene's picture to the singing.
//
// - A scene with a line starts on its first sung word.
// - Silent scenes share the time between their neighbours evenly, and move onto
//   a sung word that starts within `snap_s` of their place.
// - The first scene of a new group (scene.extra.group) shows `shot_lead_s`
//   before the group's first sung word, but not while the line before it is
//   still being sung.
// - Every picture holds at least `min_hold_s` where the words allow it.
// - `first_word_s: [a, b]` trims or pads the head of the track so the first
//   sung word lands at `a` seconds when singing starts on the second scene or
//   earlier, and at `b` when silent pictures come first.
// - `card_after_s`: the end card comes in that long after the last word.
//
// Times are in seconds of the finished film (after the trim or pad). Pure: no
// I/O. Every top-level name starts with `song`.

const SONG_HOOK_TOLERANCE_S = 0.35;
// A picture never holds for less than one frame at 30 fps, even with no min_hold_s.
const songFrameS = 0.034;
// Pace warnings (the stop-motion recipe's): too short to read, a freeze, too slow overall.
const songShortHoldS = 0.2;
const songLongHoldS = 2.5;
const songMinPace = 1.1;

function songRound(s) {
  return Math.round(s * 1000) / 1000;
}

/**
 * The reply's word timings (`words_timestamps: [{word, start_ms, end_ms}]`)
 * matched to the lyric's words, one for one and in order.
 *
 * Throws provider_failed when the reply has no timings or a different number
 * of words than the lyric. Returns {sent: [{start_s, end_s}], written:
 * [{text, scene_index, start_s, end_s}], mismatches: [{index, sung, lyric}]}
 * in the track's own time. A written word spans every sent word that stands for
 * it, so a brand name sung as three words is captioned once, as written.
 */
function songAlignWords(wordPlan, words) {
  if (!Array.isArray(words) || !words.length) throw songFail('provider_failed', 'the song came back with no word timings');
  if (words.length !== wordPlan.sent.length) {
    throw songFail('provider_failed', `the song has ${words.length} sung words and the lyric has ${wordPlan.sent.length}; it was not sung as written`);
  }
  const sent = [];
  const mismatches = [];
  let floor = 0;
  words.forEach((w, i) => {
    const start = Number(w && w.start_ms);
    const end = Number(w && w.end_ms);
    if (!Number.isFinite(start) || !Number.isFinite(end)) throw songFail('provider_failed', `sung word ${i + 1} has no start or end time`);
    const s = Math.max(start, floor) / 1000;
    const e = Math.max(end / 1000, s);
    sent.push({ start_s: songRound(s), end_s: songRound(e) });
    floor = Math.max(start, floor);
    if (songNorm(w.word) !== songNorm(wordPlan.sent[i].text)) mismatches.push({ index: i, sung: String(w.word), lyric: wordPlan.sent[i].text });
  });
  let prevEnd = 0;
  const written = wordPlan.written.map((w) => {
    if (!w.sent.length) return { text: w.text, scene_index: w.scene_index, start_s: prevEnd, end_s: prevEnd };
    const start = Math.min(...w.sent.map((k) => sent[k].start_s));
    const end = Math.max(...w.sent.map((k) => sent[k].end_s));
    prevEnd = end;
    return { text: w.text, scene_index: w.scene_index, start_s: start, end_s: end };
  });
  return { sent, written, mismatches };
}

function songGroupOf(scene) {
  const g = scene && scene.extra && scene.extra.group != null ? scene.extra.group : null;
  return g == null || g === '' ? null : String(g);
}

/** Forward then backward pass: every movable time at least `hold` from its neighbours, inside (ta, tb). */
function songClamp(times, ta, tb, hold) {
  const m = times.length;
  if (!m) return { times, fits: true };
  if (tb - ta < (m + 1) * hold) {
    return { times: times.map((_, k) => ta + ((k + 1) * (tb - ta)) / (m + 1)), fits: false };
  }
  const out = times.slice();
  for (let k = 0; k < m; k++) out[k] = Math.max(out[k], (k ? out[k - 1] : ta) + hold);
  for (let k = m - 1; k >= 0; k--) out[k] = Math.min(out[k], (k < m - 1 ? out[k + 1] : tb) - hold);
  return { times: out, fits: true };
}

/**
 * Picture windows, captions and the end card's place, from the song.
 *
 * `args`: {scenes, plan (songCompositionPlan's result), aligned (songAlignWords'
 * result), duration_s (the track's length before any trim), windows?:
 * {first_word_s: [a, b], shot_lead_s, snap_s, min_hold_s, card_after_s}}.
 *
 * Returns {trim_s, pad_s, seconds, scenes: [{id, start_s, end_s}] (every scene,
 * back to back from 0), speech (the Timeline speech shape: sung scenes outside
 * the ending), words (every written word), ending_seconds, card_at_s, hook_s,
 * hook: {target_s, off_s, ok} | null, warnings}.
 */
function songTimeline(args) {
  const { scenes, plan, aligned } = args;
  const windows = args.windows || {};
  const n = scenes.length;
  const warnings = [];
  const sungAt = new Map(plan.words.sung.map((s) => [s.index, s]));

  // ---- the head of the track ----
  let shift = 0;
  if (windows.first_word_s != null) {
    const fw = Array.isArray(windows.first_word_s) ? windows.first_word_s : [windows.first_word_s, windows.first_word_s];
    const firstSung = plan.words.sung[0].index;
    const lead = firstSung <= 1 ? fw[0] : fw[fw.length - 1];
    shift = songRound(lead - aligned.sent[0].start_s);
  }
  const t = (s) => songRound(s + shift);
  const seconds = songRound(args.duration_s + shift);
  const sent = aligned.sent.map((w) => ({ start_s: t(w.start_s), end_s: t(w.end_s) }));
  const written = aligned.written.map((w) => ({ ...w, start_s: t(w.start_s), end_s: t(w.end_s) }));
  if (sent.at(-1).end_s > seconds + 0.05) warnings.push(`the last word ends at ${sent.at(-1).end_s} s, after the track's end at ${seconds} s`);

  // ---- the ending and the right edge ----
  const k = plan.ending_scenes || 0;
  const endIdx = n - k; // first ending scene, or n when there is none
  const bodySung = plan.words.sung.filter((s) => s.index < endIdx);
  const lastBodyEnd = bodySung.length ? sent[bodySung.at(-1).sent[1]].end_s : null;
  const cardAfter = windows.card_after_s;
  let rightEdge = seconds;
  let cardAt = null;
  if (k === 0 && cardAfter != null && lastBodyEnd != null) {
    cardAt = songRound(Math.min(seconds, lastBodyEnd + cardAfter));
    rightEdge = cardAt;
  }

  // ---- fixed starts and soft targets ----
  const fixed = new Array(n).fill(null); // a sung scene's first word (scene 0 at 0)
  const soft = new Array(n).fill(null); // a lead plate or a silent ending card: a wanted time that may move
  fixed[0] = 0;
  for (let i = 1; i < n; i++) {
    const s = sungAt.get(i);
    if (s) fixed[i] = sent[s.sent[0]].start_s;
  }
  if (windows.shot_lead_s != null) {
    for (let i = 1; i < n; i++) {
      if (fixed[i] != null) continue;
      const g = songGroupOf(scenes[i]);
      if (g == null || g === songGroupOf(scenes[i - 1])) continue;
      let j = i + 1;
      while (j < n && songGroupOf(scenes[j]) === g && fixed[j] == null) j++;
      if (j >= n || songGroupOf(scenes[j]) !== g) continue; // the group sings nothing: an ordinary silent scene
      const T = fixed[j];
      const before = sent.filter((w) => w.start_s < T - 1e-6);
      const prevWordEnd = before.length ? before.at(-1).end_s : 0;
      soft[i] = Math.max(T - windows.shot_lead_s, prevWordEnd);
    }
  }
  if (k > 0 && fixed[endIdx] == null && cardAfter != null && lastBodyEnd != null) soft[endIdx] = lastBodyEnd + cardAfter;

  // ---- place the movable scenes between each pair of fixed starts ----
  const hold = Math.max(windows.min_hold_s || 0, songFrameS);
  const starts = fixed.slice();
  const anchors = [];
  for (let i = 0; i < n; i++) if (fixed[i] != null) anchors.push(i);
  anchors.push(n);
  const wordStarts = sent.map((w) => w.start_s);
  for (let a = 0; a < anchors.length - 1; a++) {
    const ia = anchors[a];
    let ib = anchors[a + 1];
    const ta = starts[ia];
    let tb = ib === n ? rightEdge : fixed[ib];
    if (tb <= ta) {
      // Two sung scenes start on the same instant (or a word lands at 0): keep the order, one frame apart.
      tb = ta + songFrameS;
      if (ib < n) {
        warnings.push(`scene ${ib + 1} starts on the same word time as scene ${ia + 1}; moved one frame later`);
        fixed[ib] = tb;
        starts[ib] = tb;
      }
    }
    const movable = [];
    for (let i = ia + 1; i < ib; i++) movable.push(i);
    if (!movable.length) continue;
    // Targets: soft scenes at their wanted time; runs of free scenes spread evenly between their neighbours.
    const target = new Map();
    let left = ta;
    let run = [];
    const flush = (right) => {
      run.forEach((i, m) => target.set(i, left + ((m + 1) * (right - left)) / (run.length + 1)));
      run = [];
    };
    for (const i of movable) {
      if (soft[i] != null) {
        const want = Math.min(Math.max(soft[i], ta), tb);
        flush(want);
        target.set(i, want);
        left = want;
      } else run.push(i);
    }
    flush(tb);
    // Snap free scenes onto a word start near their target, left to right.
    if (windows.snap_s != null) {
      let prev = ta;
      for (const [m, i] of movable.entries()) {
        let want = target.get(i);
        if (soft[i] == null) {
          // Never past the next plate or card that has a wanted time of its own.
          const nextSoft = movable.slice(m + 1).find((j) => soft[j] != null);
          const limit = nextSoft == null ? tb : target.get(nextSoft);
          let best = null;
          for (const w of wordStarts) {
            if (w <= prev + hold - 1e-9 || w > limit - hold + 1e-9) continue;
            if (Math.abs(w - want) > windows.snap_s + 1e-9) continue;
            if (best == null || Math.abs(w - want) < Math.abs(best - want)) best = w;
          }
          if (best != null) want = best;
          target.set(i, want);
        }
        prev = Math.max(prev, want);
      }
    }
    const clamped = songClamp(movable.map((i) => target.get(i)), ta, tb, hold);
    if (!clamped.fits) warnings.push(`scenes ${movable[0] + 1} to ${movable.at(-1) + 1} have less than ${hold} s each between two sung words`);
    movable.forEach((i, m) => {
      starts[i] = songRound(clamped.times[m]);
    });
  }

  // ---- spans, back to back ----
  const spans = scenes.map((scene, i) => ({
    id: scene.id,
    start_s: songRound(starts[i]),
    end_s: songRound(i < n - 1 ? starts[i + 1] : k > 0 ? seconds : rightEdge),
  }));
  if (k > 0) cardAt = spans[endIdx].start_s;
  const endingSeconds = cardAt == null ? 0 : songRound(Math.max(0, seconds - cardAt));

  // ---- captions: every sung scene outside the ending ----
  const speech = bodySung.map((s) => {
    const ws = written.slice(s.written[0], s.written[1] + 1).map((w) => ({ text: w.text, start_s: w.start_s, end_s: w.end_s }));
    const entry = { scene_id: s.id, text: s.text, start_s: ws[0].start_s, end_s: ws.at(-1).end_s, words: ws };
    if (s.spoken !== s.text) entry.spoken = s.spoken;
    return entry;
  });

  // ---- the hook gate ----
  let hookS = null;
  let hook = null;
  if (plan.hook) {
    const s = sungAt.get(plan.hook.scene_index);
    hookS = sent[s.sent[0]].start_s;
    const targetS = t(plan.hook.target_ms / 1000);
    const off = songRound(hookS - targetS);
    hook = { target_s: targetS, off_s: off, ok: Math.abs(off) <= SONG_HOOK_TOLERANCE_S + 1e-9 };
  }

  // ---- pace warnings (only when the style times pictures to words) ----
  if (args.windows) {
    const body = spans.slice(0, endIdx);
    for (const [i, sp] of body.entries()) {
      const held = songRound(sp.end_s - sp.start_s);
      if (held < songShortHoldS) warnings.push(`scene ${i + 1} holds ${held} s: too short to read`);
      if (held > songLongHoldS) warnings.push(`scene ${i + 1} holds ${held} s: it reads as a freeze`);
    }
    const bodyEnd = body.length ? body.at(-1).end_s : 0;
    const pace = bodyEnd > 0 ? body.length / bodyEnd : 0;
    if (body.length > 1 && pace < songMinPace) warnings.push(`${pace.toFixed(2)} picture changes a second; under ${songMinPace}`);
  }

  return {
    trim_s: shift < 0 ? songRound(-shift) : 0,
    pad_s: shift > 0 ? shift : 0,
    seconds,
    scenes: spans,
    speech,
    words: written.map((w) => ({ text: w.text, start_s: w.start_s, end_s: w.end_s })),
    ending_seconds: endingSeconds,
    card_at_s: cardAt,
    hook_s: hookS,
    hook,
    warnings,
  };
}

// ---- song-elevenlabs/src/part.mjs ----
// song-elevenlabs: the plan's scene lines, sung as one song by ElevenLabs Music,
// with every scene's picture and caption timed to the sung words.
//
// 1. Plan (pure, before any spend): the lyric from the scene lines, the
//    composition plan from the style's `sections` or `form`, the hook check
//    (src/plan.mjs). A plan it will not sing is refused here, for free.
// 2. One paid piece, `song`: POST /v1/music/detailed through ctx.line with
//    {composition_plan, model_id: music_v1, with_timestamps: true,
//    respect_sections_durations: true} (and `seed` when the style gives one).
//    The line answers {json, file_url}: the reply's JSON part verbatim and the
//    audio. Words are read from json.words_timestamps ([{word, start_ms, end_ms}]).
// 3. The piece fails (provider_failed) on empty word timings or a sung-word
//    count that differs from the lyric: captions are never timed from guesses.
// 4. Hook gate: with hook_scene, its first sung word must land within 0.35 s of
//    its section's start. A miss orders one more song (`song-reroll`, a new
//    seed); a second miss fails the step (output_invalid).
// 5. Scene spans, captions and the end card's place from the words
//    (src/snap.mjs); the audio is trimmed or padded at the head to match.

const SONG_PATH = '/v1/music/detailed';
// ElevenLabs seeds are 32-bit signed integers; keep a derived seed inside that range.
const songSeedRange = 2147483647;

/** A songFail from the pure modules as a ctx error; anything else unchanged. */
function songCtxError(ctx, e) {
  return e && e.song ? ctx.error(e.code, e.message) : e;
}

/** The word timings in the line's answer: result.json.words_timestamps. */
export function songReplyWords(json) {
  const words = json && typeof json === 'object' ? json.words_timestamps : null;
  return Array.isArray(words) ? words : null;
}

/** The seed for the re-roll: the style's seed + 1, else one derived from the step. Never the first seed. */
function songRerollSeed(ctx, first) {
  if (first != null) return (first + 1) % songSeedRange;
  return ctx.seed('song-reroll') % songSeedRange;
}

async function songOrder(ctx, plan, piece, seed) {
  const body = { composition_plan: plan.composition_plan, model_id: SONG_MODEL, with_timestamps: true, respect_sections_durations: true };
  if (seed != null) body.seed = seed;
  const result = await ctx.line.order({
    piece,
    provider: 'elevenlabs',
    path: SONG_PATH,
    body,
    results: [{ pointer: '/file_url', name: `${piece}.mp3`, media: 'audio' }],
  });
  const file = result.files[`${piece}.mp3`];
  if (!file) throw ctx.error('provider_failed', `no audio for ${piece}`);
  let aligned;
  try {
    aligned = songAlignWords(plan.words, songReplyWords(result.json));
  } catch (e) {
    throw songCtxError(ctx, e);
  }
  for (const m of aligned.mismatches) ctx.log.warn(`${piece}: sung word ${m.index + 1} reads "${m.sung}", the lyric says "${m.lyric}"`);
  return { piece, file, aligned, duration_s: await kitDuration(ctx, file) };
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  let plan;
  try {
    plan = songCompositionPlan(inputs);
  } catch (e) {
    throw songCtxError(ctx, e);
  }
  if (!plan.composition_plan.positive_global_styles.length) {
    throw ctx.error('bad_input', 'the song needs a mood, a singer or a brief to sing in');
  }
  for (const w of plan.warnings) ctx.log.warn(w);

  const timeOf = (sung) =>
    songTimeline({ scenes: inputs.scenes, plan, aligned: sung.aligned, duration_s: sung.duration_s, windows: inputs.windows });
  const total = plan.hook ? 2 : 1;
  let sung = await songOrder(ctx, plan, 'song', inputs.seed);
  let timeline = timeOf(sung);
  ctx.progress({ done: 1, total });
  if (timeline.hook && !timeline.hook.ok) {
    ctx.log.warn(`the hook is sung ${timeline.hook.off_s} s off its section's start (gate ${SONG_HOOK_TOLERANCE_S} s): making the song once more`);
    kitStopIfAborted(ctx);
    sung = await songOrder(ctx, plan, 'song-reroll', songRerollSeed(ctx, inputs.seed));
    timeline = timeOf(sung);
    ctx.progress({ done: 2, total });
    if (!timeline.hook.ok) {
      throw ctx.error('output_invalid', `the hook was sung ${timeline.hook.off_s} s off its section's start twice; the gate is ${SONG_HOOK_TOLERANCE_S} s`);
    }
  }
  for (const w of timeline.warnings) ctx.log.warn(w);

  // The track, trimmed or padded at the head so the words land where the spans say.
  const filters = [];
  if (timeline.pad_s > 0) filters.push(`adelay=${Math.round(timeline.pad_s * 1000)}:all=1`);
  filters.push('aresample=48000', 'aformat=sample_fmts=fltp:channel_layouts=stereo', `apad=whole_dur=${kitNum(timeline.seconds)}`);
  await kitFfmpeg(ctx, [
    ...(timeline.trim_s > 0 ? ['-ss', kitNum(timeline.trim_s)] : []),
    '-i',
    sung.file.path,
    '-af',
    filters.join(','),
    '-t',
    kitNum(timeline.seconds),
    ...ctx.tools.encodeArgs('aac'),
    join(ctx.workDir, 'song.m4a'),
  ]);
  const audio = await ctx.file('song.m4a', 'audio');
  const out = {
    audio,
    seconds: timeline.seconds,
    words: timeline.words,
    scenes: timeline.scenes,
    speech: timeline.speech,
    ending_seconds: timeline.ending_seconds,
  };
  if (timeline.hook_s != null) out.hook_s = timeline.hook_s;
  return kitCheckOutputs(ctx, manifest, out);
}
