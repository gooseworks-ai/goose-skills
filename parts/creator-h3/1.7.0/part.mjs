// Built from creator-h3/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
import { createHash } from 'node:crypto';
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

// ---- _lib/tier.mjs ----
// Standard or Best, the price the customer picks at script approval (custom videos, 16 Oct 2026).
// The tier sets a paid part's default picture quality or resolution. An explicit quality or
// resolution input still wins, for the whole step. Without a tier the part uses Standard, the
// default price. No video above 768P unless the customer asks.
//
//   standard: GPT Image 2 medium, Fabric lip-sync 480p, H3 768P.
//   best:     GPT Image 2 high,   Fabric lip-sync 720p, H3 768P.
//
// H3 is 768P in both tiers: fal makes H3 "1080P" from a native 768P take plus a refinement pass,
// and the finished video is scaled to 1080x1920 with ffmpeg (lanczos) at no cost.
const KIT_TIERS = ['standard', 'best'];

const KIT_TIER_DEFAULTS = {
  standard: { image_quality: 'medium', lipsync_resolution: '480p', h3_resolution: '768P' },
  best: { image_quality: 'high', lipsync_resolution: '720p', h3_resolution: '768P' },
};

/** The tier's default for one setting: image_quality, lipsync_resolution or h3_resolution. */
function kitTierDefault(inputs, setting) {
  const tier = KIT_TIER_DEFAULTS[inputs?.quality_tier ?? 'standard'];
  if (!tier) throw new Error(`quality_tier must be one of ${KIT_TIERS.join(', ')}`);
  if (!(setting in tier)) throw new Error(`no tier default for ${setting}`);
  return tier[setting];
}

// ---- creator-h3/src/prompt.mjs ----
// Native creator directions follow the approved capture and reference. Phone capture,
// deep focus and real unretouched skin unless the brief explicitly chooses otherwise.
// Delivery stays outside spoken copy; prompt requests require actual review.
// 1.5.0: phone_counter is a propped phone nobody holds (a both-hands action uses it).
// 1.6.0: the light lock. H3 added gloss, HDR contrast and sharpening halos to clean stills
// (15 Oct test videos), so every take keeps the first frame's light and exposure.

const H3_CAPTURE = {
  "phone_counter": "An ordinary phone recording from a phone propped up outside the frame at eye level. Nobody holds the phone and no hand holding a phone is in the frame. Static chest-up shot, complete face and both shoulders visible with headroom. Both hands are free; gestures are small and serve the words. No automatic zoom or reframing. The room is the real, lived-in room from <Picture 1>, never a plain backdrop or a white void.",
  "phone_selfie": "An ordinary handheld phone selfie at eye level. One hand supports the phone outside the frame; only the other hand is free. Small movement follows the supporting arm, without artificial drift or automatic zoom. Keep the complete face visible. The room is the real, lived-in room from <Picture 1>, never a plain backdrop or a white void.",
  "studio": "An approved studio recording at eye level, matching the reference composition and motivated lighting. Static medium framing with the complete face visible. Natural posture and restrained gestures; no automatic zoom or reframing."
};

// 1.4.0: phone capture and deep focus are the defaults; studio capture and shallow focus
// only when the approved brief explicitly chooses them (fix-forward contract section 6).
const H3_FOCUS = {
  "deep": "Everything sharp, deep focus, as a phone records: the face and the room behind are both in focus. No bokeh, no portrait-mode blur, no shallow depth of field.",
  "shallow": "Shallow focus, chosen because the approved reference is shot that way: the face sharp and the background softly out of focus as in the reference, no stronger than it."
};

const H3_LIGHT_LOCK = "Keep the first frame's light and exposure, matte skin, no added shine or sharpening halos.";

const H3_TEMPLATE = "A single continuous live-action shot of <Subject 1>, matching the approved creator reference.\n\n[Shot 1] {capture}\nThe person looks toward the lens while addressing one viewer, with natural blinks and a relaxed face. Do not force a fixed grin or busy repeated gestures. Keep the same identity, wardrobe, setting, lighting and props throughout the take.\n\nTHE SUBJECT AND SET FROM <Picture 1>: {identity}\n{environment}\nReal skin as in the reference at this viewing distance: no retouching, no skin smoothing, no beauty filter, no cinematic grade, no waxy finish or sharpening halos.\nKeep the first frame's light and exposure, matte skin, no added shine or sharpening halos.\n{focus}\n{mannerism}\nDELIVERY: {delivery}\nDelivery and action directions are outside the dialogue block. Only the approved words inside it are spoken, once and in order. No added hook, filler or invented sentence. A wanted hesitation such as 'uh' is part of the approved spoken words, not an automatic effect.\n\n<Subject 1> (S1) says, <d>[English] {dialogue}</d>\n\noverall_soundscape: The creator's voice and quiet natural room tone. No second voice or additional speech.\nnon_diegetic_music: N/A\n";

const H3_MANNERISM = "\n<Video 1> is a filmed reference person recorded the same way. Take from it ONLY the rhythm of natural speech, where the pauses fall and where the pace speeds up, and the small involuntary movement while talking: the head settling, the blink rate, the eyebrow lifts, the hands coming up and dropping back. Do NOT take the face, hair, clothes, room, lighting, framing or eyeline. The person is <Subject 1> from <Picture 1> and nobody else.\n";

const H3_DEFAULT_DELIVERY = "natural and conversational, speaking directly to one viewer. Not presenting, not announcing, not reading. Connected sentences at a brisk comfortable pace, with short meaningful pauses. Clear complete word endings, modest pitch variation and restrained expression; do not rush or shout.";

// ---- _lib/media-qualification.mjs ----
// Content eligibility is separate from transport success. These helpers consume
// reviews of actual source bytes; they never invent a reviewer or a passing check.
const kitMediaSpeechModes = ['native_dialogue', 'audio_driven_lipsync', 'narration', 'singing', 'mixed', 'none'];
const kitMediaSoundtrackModes = ['source_ambience', 'music', 'sfx', 'intentional_silence'];
const kitMediaSourceReviewSchema = {
  type: 'object', additionalProperties: false,
  required: ['source_sha256', 'script_sha256', 'status', 'reviewer', 'coverage', 'checks'],
  properties: {
    source_sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    script_sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    status: { enum: ['pass', 'fail', 'incomplete'] },
    reviewer: { type: 'string', minLength: 1, maxLength: 200 },
    coverage: {
      type: 'object', additionalProperties: false,
      required: ['video_watched', 'audio_listened', 'start_s', 'end_s'],
      properties: {
        video_watched: { type: 'boolean' }, audio_listened: { type: 'boolean' },
        start_s: { type: 'number', minimum: 0 }, end_s: { type: 'number', exclusiveMinimum: 0 },
      },
    },
    checks: {
      type: 'object', additionalProperties: false,
      required: ['script', 'voice', 'lipsync', 'identity', 'framing', 'performance', 'product_action'],
      properties: Object.fromEntries(['script', 'voice', 'lipsync', 'identity', 'framing', 'performance', 'product_action'].map((key) => [key, { enum: ['pass', 'fail', 'incomplete', 'not_applicable'] }])),
    },
    evidence: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
  },
};

const kitMediaQualificationSchema = {
  type: 'object', additionalProperties: false,
  required: ['provider', 'model', 'shot_type', 'configuration_sha256', 'status', 'accepted_source_sha256', 'reviewer', 'audio_listened', 'video_watched'],
  properties: {
    provider: { type: 'string', minLength: 1 }, model: { type: 'string', minLength: 1 },
    shot_type: { type: 'string', minLength: 1 }, status: { enum: ['qualified', 'experimental', 'suspended'] },
    accepted_source_sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    configuration_sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    reviewer: { type: 'string', minLength: 1 }, audio_listened: { type: 'boolean' }, video_watched: { type: 'boolean' },
    conditions: { type: 'string', minLength: 1 },
  },
};

function kitMediaReviewProblem(review, source, scriptSha256, seconds, { speech = true, productActionRequired = false } = {}) {
  if (!review || review.status !== 'pass') return 'the source has no passing content review';
  if (review.source_sha256 !== source.sha256) return 'the content review names different source bytes';
  if (review.script_sha256 !== scriptSha256) return 'the content review names a different approved script';
  if (!String(review.reviewer || '').trim()) return 'the actual reviewer is missing';
  const coverage = review.coverage || {};
  if (coverage.video_watched !== true || (speech && coverage.audio_listened !== true)) return 'full playback with actual listening is required; frames or transcription alone do not qualify a speaking source';
  if (!(coverage.start_s <= 0 && coverage.end_s >= seconds - 0.02)) return 'the content review does not cover the complete source';
  for (const key of ['identity', 'framing', 'performance', ...(speech ? ['script', 'voice', 'lipsync'] : [])]) {
    if (review.checks?.[key] !== 'pass') return `the source content check ${key} has not passed`;
  }
  if (!['pass', 'not_applicable'].includes(review.checks?.product_action)) return 'the product/action check is unresolved';
  if (productActionRequired && review.checks?.product_action !== 'pass') return 'a required product action cannot be marked not_applicable';
  return null;
}

function kitMediaConfigurationSha256(configuration) {
  const canonical = (value) => {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(canonical);
    if (value.kind === 'file') return { media: value.media, sha256: value.sha256 };
    return Object.fromEntries(Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => [key, canonical(value[key])]));
  };
  return createHash('sha256').update(JSON.stringify(canonical(configuration))).digest('hex');
}

// Restrictions concern the audited use, not a provider-wide ban. A newer model
// is a candidate until its actual endpoint, shot and reviewed conditions qualify.
function kitMediaRouteProblem({ provider, model, shot_type, configuration_sha256, accepted_source_sha256, speech_mode, required_features = [], qualification, model_support, trial = false }) {
  if (!kitMediaSpeechModes.includes(speech_mode)) return 'choose an explicit speech_mode';
  const exactAction = ['precise_product_action', 'dispensing', 'application', 'stateful_demo'].includes(shot_type);
  if (model === 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video' && exactAction) return 'Kling 2.5 Turbo is excluded from exact product-action routes; select a qualified action route';
  const omni = model === 'gemini-omni-1.1-flash' || model === 'google/gemini-omni-flash';
  const seedanceCandidate = /seedance-2\.5/.test(model);
  if ((omni || seedanceCandidate) && (!model_support || model_support.status !== 'verified' || model_support.provider !== provider || model_support.model !== model || !model_support.schema_sha256 || !model_support.evidence || !model_support.quote_id)) return 'a candidate route needs the actual managed endpoint schema, evidence and quote before even a qualification trial';
  if (omni && required_features.some((feature) => ['audio_reference', 'exact_audio_reuse', 'voice_editing'].includes(feature))) return 'this Omni API does not support uploaded audio references, exact audio reuse or voice editing';
  if (seedanceCandidate && required_features.includes('exact_audio_reuse')) return 'Seedance audio-reference guidance is not a documented exact-audio-reuse contract';
  if (trial) return null;
  const q = qualification;
  if (!q || q.status !== 'qualified' || q.provider !== provider || q.model !== model || q.shot_type !== shot_type) return 'the exact provider, endpoint and shot type need a qualified source example; API success alone is insufficient';
  if (!configuration_sha256 || q.configuration_sha256 !== configuration_sha256) return 'qualification names different capture, references, delivery or model settings';
  if (accepted_source_sha256 && q.accepted_source_sha256 !== accepted_source_sha256) return 'qualification names an unrelated first take';
  if (!/^[a-f0-9]{64}$/.test(q.accepted_source_sha256 || '') || !String(q.reviewer || '').trim() || q.video_watched !== true || (speech_mode !== 'none' && q.audio_listened !== true)) return 'qualification needs the actual accepted source checksum and audiovisual reviewer coverage';
  return null;
}

// Extend existing cast / voice / music / SFX stores with these fields. This is
// an asset contract, not a second catalog and not permission to clone a person.
function kitMediaLibraryAssetProblem(asset, kind) {
  if (!['character', 'voice', 'music', 'sfx'].includes(kind)) return 'unknown library asset kind';
  if (!asset || !String(asset.id || asset.key || '').trim()) return 'reuse the existing library asset ID';
  if (asset.status !== 'approved' || !String(asset.provenance || '').trim() || !String(asset.rights || '').trim()) return 'the library choice needs approval, provenance and usage rights';
  if (kind === 'voice' && (!asset.voice_id || !asset.model || !asset.audition_sha256)) return 'a voice needs its stable voice_id, model and approved audition checksum';
  if (kind === 'character' && (!asset.image?.sha256 || !asset.capture || !asset.framing || !(asset.image.width > 0 && asset.image.height > 0))) return 'a character needs its approved anchor checksum, capture/framing brief and actual source geometry';
  if ((kind === 'music' || kind === 'sfx') && !asset.audio?.sha256) return 'a soundtrack asset needs its actual audio checksum';
  return null;
}

// ---- creator-h3/src/part.mjs ----
// creator-h3 1.6.0: every take keeps the first frame's light and exposure, matte
// skin, no added shine or sharpening halos (H3_LIGHT_LOCK): H3 added gloss, HDR
// contrast and halos to clean stills in two 15 Oct test videos. character.json's
// shot and skin_condition (make_character.py 2.5.0) are accepted and recorded.
// creator-h3 1.5.0: a scene action that uses both hands (apply, smooth, press,
// peel, squeeze, hold with both hands, or required_features application) refuses
// phone_selfie and uses phone_counter, a propped phone, and says so in
// capture_decision: a selfie with both hands busy grew a third hand holding the
// phone. Takes can be sized from the reference's measured rate
// (reference_words_per_second), capped at 3.2 words a second. character.json's
// voice_pair passes through. creator-h3 1.4.0: controlled native creator production. Generate a first
// source, request actual AV review, generate remaining candidates, then assemble
// only accepted sources with reviewed word timings and linked picture/audio.
// Energy measurements are planning diagnostics, never word or content proof.
// 1.4.0: phone capture and deep focus by default (studio and shallow focus only
// when explicitly chosen), and the shared required_features vocabulary: any
// product action (application, dispensing, pour, physical_demo, hands) forces a
// passing product_action review. Old feature names are read as aliases.

const MODEL = 'minimax/h3-max/reference-to-video';
const MAX_TAKE = 15;
const MIN_TAKE = 5;
const MAX_SPEECH = 14.2;
const TAIL = 0.6;
const XF = 0.1;
const LEAD = 0.11;
/** H3 says about 3.2 words a second at most (measured takes); a faster plan packs takes it then rushes or cuts. */
const H3_PLAN_WPS = 3.2;
const PAD = 0.03;
const VOICE_CLIP = ['-vn', '-t', '12', '-ac', '1', '-ar', '24000'];
const COVER_LEAD = 0.15;
const MIN_SPAN = 0.05;
const GENDER_WORD = { female: 'woman', male: 'man', nonbinary: 'non-binary person' };
// Measured joins: the silence from one take's last word to the next take's first,
// and the most a take's last frame may be held to reach its join (a take whose voice
// runs to its very end).
const GAP = 0.12;
const MAX_HOLD = 0.5;
// Measured line spans: a silence this long inside a take's speech is between words, and one is worth
// moving a line boundary for while its length beats this share of its distance from the estimate.
const LINE_GAP_MIN = 0.12;
const LINE_GAP_REACH = 0.25;
// Clips mode.
// The shared required_features vocabulary (fix-forward contract section 3), with the
// names creator-h3 1.3.x read, kept as aliases.
export const H3_FEATURES = ['speaking_face', 'product', 'scale', 'hands', 'application', 'dispensing', 'pour', 'physical_demo', 'readable_text'];
export const H3_FEATURE_ALIASES = { product_action: 'physical_demo', physical_action: 'physical_demo', precise_product_action: 'application', stateful_demo: 'physical_demo' };
export const H3_PRODUCT_ACTIONS = ['application', 'dispensing', 'pour', 'physical_demo', 'hands'];

/** The approved features in the shared vocabulary: aliases mapped, repeats dropped, order kept. */
export function h3Features(list) {
  const out = [];
  for (const raw of list || []) {
    const name = H3_FEATURE_ALIASES[raw] || raw;
    if (!out.includes(name)) out.push(name);
  }
  return out;
}

// An action that needs both hands, so nobody can hold the phone (plan_takes.py BOTH_HANDS, word for word).
export const H3_BOTH_HANDS = "\\b(appl(?:y|ies|ied|ying)|smooth(?:s|ed|ing)?|press(?:es|ed|ing)?|peel(?:s|ed|ing)?|squeez(?:e|es|ed|ing)|rub(?:s|bed|bing)?|massag(?:e|es|ed|ing)|spread(?:s|ing)?|both hands|two hands|hands together)\\b";
export const H3_BOTH_HANDS_FEATURES = ['application'];
const ACTION_FIELDS = ['action', 'picture', 'visual', 'shot', 'description'];

/** Why the plan's action needs both hands (the first matching words or feature), or null. */
export function h3BothHands(texts, features) {
  for (const name of features || []) if (H3_BOTH_HANDS_FEATURES.includes(H3_FEATURE_ALIASES[name] || name)) return `required feature ${H3_FEATURE_ALIASES[name] || name}`;
  const re = new RegExp(H3_BOTH_HANDS, 'i');
  for (const text of texts || []) {
    const m = typeof text === 'string' ? re.exec(text) : null;
    if (m) return `the action says "${m[0]}"`;
  }
  return null;
}

/** Every action-like text in the plan: each scene's picture and extra fields, and the character's actions. */
function actionTexts(inputs, character) {
  const out = [];
  for (const s of inputs.scenes || []) {
    if (typeof s.picture === 'string') out.push(s.picture);
    if (s.extra && typeof s.extra === 'object') for (const k of ACTION_FIELDS) if (typeof s.extra[k] === 'string') out.push(s.extra[k]);
  }
  for (const a of (character && character.actions) || []) if (typeof a === 'string') out.push(a);
  return out;
}

const CLIPS_ONLY = ['images', 'template', 'use', 'look', 'answers', 'brand', 'products', 'pick', 'skip_first', 'skip_last', 'seconds'];

/** The atom's identity guards: a person nobody was asked about reads as an AI composite. */
function checkCharacter(ch, who = 'the character') {
  const ident = String(ch.identity || '').trim();
  const low = ident.toLowerCase();
  if (!ident) return `${who} needs an identity: the person, in the words that made the image`;
  if (ident.includes('...') || low.startsWith('<') || low.includes('ask the user') || low.includes('user chose')) return `${who} identity is still a placeholder; there is no default person`;
  if (!/\b(\d{2}s?|teen|twenties|thirties|forties|fifties|sixties|year[- ]old)\b/.test(low)) return `${who} identity states no age`;
  if (!/\b(man|woman|male|female|non[- ]binary|guy|girl|boy|lady)\b/.test(low)) return `${who} identity states no gender`;
  return null;
}

const cleanText = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');

/** A cast member's identity in the atom's words: "a 34-year-old woman, <look>". */
function memberIdentity(member) {
  const gender = GENDER_WORD[member.gender] || '';
  const age = Number.isInteger(member.age) ? member.age : null;
  let who = '';
  if (age != null && gender) who = `a ${age}-year-old ${gender}`;
  else if (gender) who = `a ${gender}`;
  else if (age != null) who = `${age} years old`;
  return [who, cleanText(member.look)].filter(Boolean).join(', ');
}

/**
 * The creator for this step: {character, who}. From the cast, the member the spoken
 * scenes name as speaker, else the first member with a picture; else `character`.
 * Returns {problem} when there is none, or the choice is unclear.
 */
function pickCreator(inputs, lines) {
  const cast = Array.isArray(inputs.cast) ? inputs.cast : [];
  if (cast.length && inputs.character) return { problem: 'give cast or character, not both' };
  if (!cast.length) {
    if (!inputs.character) return { problem: 'there is no creator: give the plan cast or a character' };
    return { character: inputs.character, who: 'the character' };
  }
  const byKey = new Map(cast.map((m) => [m.key, m]));
  const speakers = [];
  for (const l of lines) {
    if (!l.speaker) continue;
    if (!byKey.has(l.speaker)) return { problem: `scene ${l.scene_id}'s speaker "${l.speaker}" is not in the cast` };
    if (!speakers.includes(l.speaker)) speakers.push(l.speaker);
  }
  if (speakers.length > 1) return { problem: `one creator says every line, but the scenes name ${speakers.length} speakers (${speakers.join(', ')})` };
  const member = speakers.length ? byKey.get(speakers[0]) : cast.find((m) => m.image);
  if (!member) return { problem: 'no cast member has a picture; draw the creator first (an anchor step)' };
  if (!member.image) return { problem: `cast member ${member.key} has no picture; draw the creator first (an anchor step)` };
  return {
    character: { image: member.image, identity: memberIdentity(member), environment: cleanText(member.environment), delivery: cleanText(member.delivery) },
    who: `cast member ${member.key}`,
  };
}

/** Is this scene a cutaway (something other than the creator fills the screen)? */
function isCutaway(scene, id, footageScenes) {
  const shot = scene.extra && typeof scene.extra === 'object' ? scene.extra.shot : null;
  if (typeof shot === 'string' && shot.trim() && shot.trim().toLowerCase() !== 'creator') return true;
  if (footageScenes.has(id)) return true;
  return !!(scene.image && typeof scene.image === 'object');
}

/**
 * Lines with estimated spans (spoken words at `wps`, a short pause between lines),
 * split greedily into takes under MAX_SPEECH. A take may start only at a line whose
 * `split` is true (every line when nothing restricts it); the lines from one such
 * start to the next are a run that must fit one take, or {problem} is returned.
 */
function planTakes(lines, wps) {
  let t = 0;
  const timed = lines.map((l) => {
    // Real words, as reference_rate.py counts them: a token with no letter or digit (a lone dash) is not one.
    const words = l.spoken.split(/\s+/).filter((w) => /[\p{L}\p{N}_]/u.test(w)).length;
    const span = { ...l, start: t, end: t + words / wps };
    t = span.end + 0.3;
    return span;
  });
  const runs = [];
  for (const [i, l] of timed.entries()) {
    if (i === 0 || l.split) runs.push([]);
    runs.at(-1).push(l);
  }
  for (const r of runs) {
    const span = r.at(-1).end - r[0].start;
    if (span <= MAX_SPEECH) continue;
    if (r.length === 1) return { problem: `scene ${r[0].scene_id} alone runs past one take; shorten it` };
    return {
      problem: `scenes ${r[0].scene_id} to ${r.at(-1).scene_id} are one on-camera run of about ${span.toFixed(1)}s with no cutaway to hide a take join (one take holds ${MAX_SPEECH}s); make a spoken scene between them a cutaway or cut words`,
    };
  }
  const takes = [];
  let cur = [];
  for (const r of runs) {
    if (cur.length && r.at(-1).end - cur[0].start > MAX_SPEECH) {
      takes.push(cur);
      cur = [];
    }
    cur.push(...r);
  }
  if (cur.length) takes.push(cur);
  return takes.map((group, i) => {
    const start = group[0].start;
    const end = group.at(-1).end;
    return { id: `t${i + 1}`, lines: group, covers: [start, end], dur: Math.max(MIN_TAKE, Math.min(MAX_TAKE, Math.ceil(end - start + TAIL))) };
  });
}

function prompt(character, delivery, mannerism, dialogue, capture, focus, voiceReference = false) {
  // Function replacers: a $ in a look or a line is never read as a replacement pattern.
  const text = H3_TEMPLATE.replace('{identity}', () => character.identity.trim())
    .replace('{environment}', () => String(character.environment || '').trim())
    .replace('{mannerism}', () => (mannerism ? H3_MANNERISM : ''))
    .replace('{delivery}', () => delivery)
    .replace('{capture}', () => H3_CAPTURE[capture])
    .replace('{focus}', () => H3_FOCUS[focus])
    .replace('{dialogue}', () => dialogue);
  return voiceReference ? `${text}\n<Audio 1> is a voice-timbre and delivery reference for <Subject 1> (S1). Reference its voice, not its old words or soundtrack. Speak only this take's dialogue. This is audio reference, not exact audio reuse.\n` : text;
}

function takeScriptSha256(take) {
  return createHash('sha256').update(JSON.stringify(take.lines.map(({ scene_id, text, spoken }) => ({ scene_id, text, spoken })))).digest('hex');
}

const creatorWordKey = (text) => String(text).replace(/[^\p{L}\p{N}']/gu, '').toLowerCase();

// Word timing is supplied from the reviewed source, never inferred from a
// silence envelope. An energy detector cannot identify a phoneme or a word.
function sourceWordTiming(source, take, duration, ctx) {
  if (!['reviewed_transcription', 'forced_alignment'].includes(source.timing_method)) throw ctx.error('bad_input', `take ${take.id} needs reviewed transcription or forced-alignment timings`);
  const words = source.words || [];
  if (!words.length) throw ctx.error('bad_input', `take ${take.id} has no actual word timings`);
  let previous = -1;
  for (const word of words) {
    if (!Number.isFinite(word.start_s) || !Number.isFinite(word.end_s) || !(word.start_s >= previous && word.end_s > word.start_s && word.end_s <= duration + 0.02)) throw ctx.error('bad_input', `take ${take.id} has unordered or out-of-source word timings`);
    previous = word.end_s;
  }
  for (const line of take.lines) {
    const got = words.filter((word) => word.scene_id === line.scene_id);
    const expected = line.spoken.split(/\s+/).map(creatorWordKey).filter(Boolean);
    const actual = got.map((word) => creatorWordKey(word.text)).filter(Boolean);
    if (!got.length || JSON.stringify(expected) !== JSON.stringify(actual)) throw ctx.error('bad_input', `take ${take.id}, scene ${line.scene_id}: reviewed words do not match the approved spoken line; resolve missing or extra speech before assembly`);
  }
  if (words.some((word) => !take.lines.some((line) => line.scene_id === word.scene_id))) throw ctx.error('bad_input', `take ${take.id} has words outside its approved scenes`);
  const sceneOrder = words.map((word) => word.scene_id).filter((id, index, all) => !index || all[index - 1] !== id);
  if (JSON.stringify(sceneOrder) !== JSON.stringify(take.lines.map((line) => line.scene_id))) throw ctx.error('bad_input', `take ${take.id} word timings reorder or repeat approved scenes`);
  return { onset: words[0].start_s, speech_end: words.at(-1).end_s, words, timing_method: source.timing_method };
}

/**
 * Where speech starts and ends in a take, from ffmpeg's silence detector:
 * {onset, end}. onset is the end of a silence that opens the take (0 when the
 * voice starts at once); end is the start of the silence that runs to the end
 * of the take (the take's length when there is none). Null when no speech is heard.
 */
function speechBounds(stderr, duration) {
  const starts = [...stderr.matchAll(/silence_start: (-?[0-9.]+)/g)].map((m) => Number(m[1]));
  const ends = [...stderr.matchAll(/silence_end: ([0-9.]+)/g)].map((m) => Number(m[1]));
  const onset = starts.length && starts[0] <= 0.02 && ends.length ? ends[0] : 0;
  const last = starts.length - 1;
  const end = last >= 0 && (ends.length <= last || ends[last] >= duration - 0.05) ? Math.max(0, starts[last]) : duration;
  return end > onset + 0.05 ? { onset, end } : null;
}

/** planned: where speech starts in a take, read from its first 3 s exactly as 1.1.0 did (so the schedule is 1.1.0's). */
async function plannedOnset(ctx, path) {
  const { stderr } = await kitFfmpeg(ctx, ['-v', 'info', '-t', '3', '-i', path, '-af', 'silencedetect=noise=-35dB:d=0.03', '-f', 'null', '-']);
  const m = /silence_start: (-?[0-9.]+)[\s\S]*?silence_end: ([0-9.]+)/.exec(stderr);
  return m && Number(m[1]) <= 0.02 ? Number(m[2]) : 0;
}

/** The silences inside a take's speech (between its first word and its last), at least LINE_GAP_MIN long. */
export function speechGaps(stderr, bounds, duration) {
  const starts = [...stderr.matchAll(/silence_start: (-?[0-9.]+)/g)].map((m) => Number(m[1]));
  const ends = [...stderr.matchAll(/silence_end: ([0-9.]+)/g)].map((m) => Number(m[1]));
  return starts
    .map((start, i) => ({ start, end: i < ends.length ? ends[i] : duration }))
    .filter((g) => g.start > bounds.onset + 0.02 && g.end < bounds.end - 0.02 && g.end - g.start >= LINE_GAP_MIN);
}

async function measureSpeech(ctx, path, duration) {
  const { stderr } = await kitFfmpeg(ctx, ['-v', 'info', '-i', path, '-af', 'silencedetect=noise=-35dB:d=0.03', '-f', 'null', '-']);
  const bounds = speechBounds(String(stderr), duration);
  return bounds && { ...bounds, gaps: speechGaps(String(stderr), bounds, duration) };
}

/**
 * Where each line of one take is spoken, in take seconds: [{start, end}] per line. `estimate(x)` maps a line's
 * estimated time onto the take (1.2.0's spread); `gaps` are the silences heard inside the speech. Each boundary
 * between two lines goes on the silence that best trades its length against its distance from the estimated
 * boundary (in order, each silence used once); a boundary with no silence worth it keeps the estimate.
 */
export function lineSpans(lines, gaps, onset, end, estimate) {
  const m = lines.length;
  const est = [];
  for (let i = 0; i + 1 < m; i++) est.push(estimate((lines[i].end + lines[i + 1].start) / 2));
  const n = gaps.length;
  // best[i][j]: the most gain placing boundaries i.. on silences j..; each boundary takes one silence or none.
  const best = Array.from({ length: est.length + 1 }, () => new Array(n + 1).fill(0));
  const move = Array.from({ length: est.length + 1 }, () => new Array(n + 1).fill('boundary'));
  for (let i = est.length - 1; i >= 0; i--) {
    for (let j = n; j >= 0; j--) {
      let v = best[i + 1][j];
      let how = 'boundary';
      if (j < n && best[i][j + 1] > v + 1e-9) {
        v = best[i][j + 1];
        how = 'silence';
      }
      if (j < n) {
        const g = gaps[j];
        const gain = g.end - g.start - LINE_GAP_REACH * Math.abs((g.start + g.end) / 2 - est[i]);
        if (gain > 0 && gain + best[i + 1][j + 1] > v + 1e-9) {
          v = gain + best[i + 1][j + 1];
          how = 'use';
        }
      }
      best[i][j] = v;
      move[i][j] = how;
    }
  }
  const chosen = new Array(est.length).fill(null);
  for (let i = 0, j = 0; i < est.length; ) {
    const how = move[i][j];
    if (how === 'use') chosen[i++] = gaps[j++];
    else if (how === 'silence') j++;
    else i++;
  }
  const out = lines.map((l, i) => ({
    start: i === 0 ? onset : chosen[i - 1] ? chosen[i - 1].end : estimate(l.start),
    end: i === m - 1 ? end : chosen[i] ? chosen[i].start : estimate(l.end),
  }));
  for (let i = 0; i < m; i++) {
    if (i) out[i].start = Math.max(out[i].start, out[i - 1].end);
    out[i].end = Math.min(end, Math.max(out[i].end, out[i].start));
  }
  // A heard boundary that leaves a line with next to no time (an estimate on its other side runs past it) is
  // not trusted: the whole take keeps the estimates.
  if (out.some((x) => x.end - x.start < MIN_SPAN)) return lines.map((l) => ({ start: estimate(l.start), end: estimate(l.end) }));
  return out;
}

/**
 * The join schedule, from join_takes.py. planned: each take at its estimated
 * start (speech onset measured). measured: each later take placed so its first
 * word comes GAP after the previous take's measured last word (never sooner than
 * PAD after it), and the reel ends TAIL after the last word. Every later take
 * starts with a 0.10 s dissolve.
 */
function schedule(takes, fps, measured) {
  const xf = Math.round(XF * fps) / fps;
  const snap = (s) => Math.ceil((s - 1e-8) * fps) / fps;
  let before = 0;
  let spoken = 0;
  const out = [];
  for (const [k, t] of takes.entries()) {
    const first = measured ? t.onset : t.onset || LEAD;
    const pad = k ? Math.max(0, xf + PAD - first) : 0;
    let start = 0;
    if (k) {
      const prev = out[k - 1];
      // A late speech onset can pull a join back to the reel start or into the previous take's words.
      // Keep every join at least two dissolves after the previous take's start, MIN_SPAN per earlier line
      // from the reel start (every earlier scene keeps a span before the join), and (planned) late enough
      // that the previous take's estimated speech ends by the end of the dissolve (its audio is cut there).
      // measured places the join from the previous take's heard last word instead.
      const floor = Math.max(prev.start + 2 * xf, MIN_SPAN * before + COVER_LEAD, measured ? 0 : spoken - xf);
      let desired = t.start - first - pad;
      if (measured) {
        const said = prev.start + prev.head_pad + prev.speech_end;
        desired = Math.max(said + PAD, said + GAP - first - pad);
      }
      start = snap(Math.max(floor, desired));
    }
    before += t.lines ? t.lines.length : 0;
    // planned: this take's estimated last word on the reel (the speech entries' shift), never past its own footage.
    const words = t.covers ? t.covers[1] - t.covers[0] : 0;
    spoken = start + pad + Math.min(first + words, t.duration);
    out.push({ ...t, start, head_pad: pad });
  }
  // The reel runs to the end of the last take (measured: TAIL after its last word, within the take).
  const lastTake = out.at(-1);
  let actualEnd = Math.floor((lastTake.start + lastTake.head_pad + lastTake.duration + 1e-8) * fps) / fps;
  if (measured) actualEnd = Math.min(actualEnd, snap(lastTake.start + lastTake.head_pad + lastTake.speech_end + TAIL));
  if (out.length === 1) actualEnd = Math.min(actualEnd, Math.floor((takes[0].duration + 1e-8) * fps) / fps);
  const hold = measured ? MAX_HOLD : 0.02;
  out.forEach((t, k) => {
    t.body_end = (k + 1 < out.length ? out[k + 1].start : actualEnd) - t.start;
    t.need = t.body_end + (k + 1 < out.length ? xf : 0);
    if (t.body_end <= (k ? xf : 0)) throw new Error('takes overlap too closely to join');
    const short = t.need - t.duration - t.head_pad;
    if (short > hold) throw new Error(`take ${t.id} is ${t.duration.toFixed(2)}s but must run ${(t.need - t.head_pad).toFixed(2)}s to reach its join`);
    t.tail_pad = Math.max(0, short);
  });
  return { fps, xf, duration: actualEnd, takes: out };
}

async function joinTakes(ctx, plan, out) {
  const { fps, xf } = plan;
  const fc = [];
  const pieces = [];
  const audio = [];
  const n = plan.takes.length;
  const args = [];
  for (const [k, t] of plan.takes.entries()) {
    args.push('-i', t.path);
    const video = (i, start, end, label) =>
      `[${i}:v]tpad=start_duration=${kitNum(t.head_pad)}:start_mode=clone:stop_duration=${kitNum(t.tail_pad + 0.05)}:stop_mode=clone,` +
      `trim=start=${kitNum(start)}:end=${kitNum(end)},setpts=PTS-STARTPTS,fps=${fps},settb=AVTB,setsar=1,format=yuv420p[${label}]`;
    fc.push(video(k, k ? xf : 0, t.body_end, `body${k}`));
    pieces.push(`[body${k}]`);
    if (k + 1 < n) {
      fc.push(video(k, t.body_end, t.body_end + xf, `xa${k}`));
      const next = plan.takes[k + 1];
      fc.push(`[${k + 1}:v]tpad=start_duration=${kitNum(next.head_pad)}:start_mode=clone,trim=0:${kitNum(xf)},setpts=PTS-STARTPTS,fps=${fps},settb=AVTB,setsar=1,format=yuv420p[xb${k}]`);
      fc.push(`[xa${k}][xb${k}]xfade=duration=${kitNum(xf)}:offset=0[x${k}]`);
      pieces.push(`[x${k}]`);
    }
    const stereo = t.channels === 1 ? 'pan=stereo|c0=c0|c1=c0' : 'aformat=channel_layouts=stereo';
    fc.push(`[${k}:a]aresample=48000,${stereo},adelay=${kitNum(t.head_pad * 1000)}:all=1,apad,atrim=0:${kitNum(t.need)},asetpts=PTS-STARTPTS[a${k}]`);
    audio.push(`[a${k}]`);
  }
  fc.push(`${pieces.join('')}concat=n=${pieces.length}:v=1:a=0,fps=${fps},trim=duration=${kitNum(plan.duration)},setpts=PTS-STARTPTS[v]`);
  let prev = audio[0];
  for (let k = 1; k < n; k++) {
    fc.push(`${prev}${audio[k]}acrossfade=d=${kitNum(xf)}:c1=tri:c2=tri[ac${k}]`);
    prev = `[ac${k}]`;
  }
  await kitFfmpeg(ctx, [...args, '-filter_complex', fc.join(';'), '-map', '[v]', '-map', prev, '-t', kitNum(plan.duration), ...ctx.tools.encodeArgs('h264-master'), ...ctx.tools.encodeArgs('aac'), out]);
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  if ((inputs.mode || 'talk') !== 'talk') throw ctx.error('bad_input', 'creator-h3 1.6.0 controls native talking creators only; use a separately qualified non-speaking clip route with its own source content reviews');
  for (const key of CLIPS_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in clips mode`);
  const requestedStage = inputs.generation_stage || 'reviewed_pipeline';
  let stage = requestedStage;
  if (inputs.join === 'planned') throw ctx.error('bad_input', 'planned timing is not eligible for native-speech assembly; supply reviewed source word timings');
  const measured = true;
  const footageScenes = new Set((inputs.footage || []).map((f) => (f && f.scene_id != null ? String(f.scene_id) : null)).filter(Boolean));
  const cutaways = inputs.split_before === 'cutaways';
  const lines = [];
  for (const [i, s] of inputs.scenes.entries()) {
    const scene_id = s.id == null ? String(i + 1) : String(s.id);
    const written = cleanText(s.line);
    if (!written) continue;
    const spoken = cleanText(kitApplySayAs(written, inputs.pronunciations).spoken);
    // A take may start only at a spoken cutaway: a silent scene has no span on the timeline, so nothing
    // placed by scene could cover a join on the creator scene after it.
    lines.push({ scene_id, text: written, spoken, speaker: cleanText(s.speaker), split: !cutaways || isCutaway(s, scene_id, footageScenes) });
  }
  if (!lines.length) throw ctx.error('bad_input', 'no scene has a line to say');
  for (const l of lines) if (/[<>]|\[[^\]]*\]/.test(l.spoken)) throw ctx.error('bad_input', `scene ${l.scene_id} has performance markup in spoken copy; put delivery outside the dialogue, and write wanted 'uh' as an approved spoken word`);
  const creator = pickCreator(inputs, lines);
  if (creator.problem) throw ctx.error('bad_input', creator.problem);
  const problem = checkCharacter(creator.character, creator.who);
  if (problem) throw ctx.error('bad_input', problem);
  // The character's own delivery is trimmed only, as 1.0.2 did; a cast member's was cleaned in pickCreator.
  // A whitespace-only legacy delivery stays empty, exactly as 1.0.2 built the prompt.
  const delivery = cleanText(inputs.delivery) || String(creator.character.delivery || H3_DEFAULT_DELIVERY).trim();
  // Pace: words_per_second as given, else the reference's measured rate, else 2.6; never past 3.2.
  const askedWps = inputs.words_per_second ?? inputs.reference_words_per_second ?? 2.6;
  const plannedWps = Math.min(askedWps, H3_PLAN_WPS);
  const pace = {
    reference_wps: inputs.reference_words_per_second ?? null, planned_wps: plannedWps, capped: askedWps > H3_PLAN_WPS,
    sized_from: inputs.words_per_second !== undefined ? 'words_per_second' : inputs.reference_words_per_second !== undefined ? 'reference_wps' : 'default',
  };
  const takes = planTakes(lines, plannedWps);
  if (takes.problem) throw ctx.error('bad_input', takes.problem);
  const seconds = takes.reduce((a, t) => a + t.dur, 0);
  if (seconds > inputs.max_seconds) throw ctx.error('bad_input', `the lines need ${seconds}s of takes, more than max_seconds ${inputs.max_seconds}`);
  // Phone capture and deep focus unless the approved brief explicitly chose studio or shallow focus.
  const ch = creator.character || {};
  const requestedCapture = inputs.capture ?? (ch.capture === 'studio' ? 'studio' : ch.recording === 'selfie' ? 'phone_selfie' : 'phone_counter');
  if (!H3_CAPTURE[requestedCapture]) throw ctx.error('bad_input', 'choose capture: phone_counter, phone_selfie or studio from the approved recording brief');
  const focus = inputs.focus ?? (ch.focus === 'shallow' ? 'shallow' : 'deep');
  const features = h3Features(inputs.required_features);
  // Both hands busy and a handheld selfie: the model adds a third hand holding the phone.
  const hands = h3BothHands(actionTexts(inputs, inputs.character), features);
  const captureDecision = { requested: requestedCapture, used: requestedCapture, reason: null };
  if (hands && requestedCapture === 'phone_selfie') {
    captureDecision.used = 'phone_counter';
    captureDecision.reason = `${hands}: both hands are busy, so nobody can hold the phone (a handheld selfie adds a third hand). Using phone_counter, a propped phone. If the anchor still shows an arm reaching out to hold the phone, remake it with the phone propped (recording counter).`;
    ctx.log.warn('refused phone_selfie', { reason: captureDecision.reason });
  }
  const capture = captureDecision.used;
  const voicePair = inputs.character && inputs.character.voice_pair ? inputs.character.voice_pair : null;
  const extras = { capture_decision: captureDecision, pace, ...(voicePair ? { voice_pair: voicePair } : {}) };
  const accepted = new Map((inputs.accepted_sources || []).map((source) => [source.id, source]));
  if (accepted.size !== (inputs.accepted_sources || []).length) throw ctx.error('bad_input', 'accepted_sources repeats a take ID');
  if ([...accepted.keys()].some((id) => !takes.some((take) => take.id === id))) throw ctx.error('bad_input', 'accepted_sources contains a take outside this script');
  if (requestedStage === 'reviewed_pipeline') stage = takes.every((take) => accepted.has(take.id)) ? 'assemble' : accepted.has(takes[0].id) ? 'remaining_takes' : 'first_take';
  if (stage === 'first_take' && accepted.size) throw ctx.error('bad_input', 'first_take starts a trial; use remaining_takes or assemble to reuse accepted sources');
  if (stage === 'remaining_takes' && !accepted.has(takes[0].id)) throw ctx.error('bad_input', 'review the first take with sound before ordering the remaining takes');
  if (stage === 'assemble' && takes.some((take) => !accepted.has(take.id))) throw ctx.error('bad_input', 'every take needs a hash-bound passing content review before assembly');
  const configuration = (firstSourceSha256) => ({
    provider: 'fal', model: MODEL, shot_type: 'talking_creator', creative_contract_revision: inputs.creative_contract_revision,
    capture, identity: creator.character.identity, environment: creator.character.environment || '',
    anchor: creator.character.image, mannerism: inputs.mannerism || null, delivery,
    resolution: inputs.resolution ?? kitTierDefault(inputs, 'h3_resolution'), aspect_ratio: inputs.aspect_ratio ?? '9:16',
    words_per_second: plannedWps, required_features: features,
    prompt_template: H3_TEMPLATE, capture_template: H3_CAPTURE[capture], focus, focus_template: H3_FOCUS[focus], mannerism_template: inputs.mannerism ? H3_MANNERISM : null,
    voice_reference_source_sha256: firstSourceSha256, voice_reference_extract: VOICE_CLIP,
    takes: takes.map((take) => ({ id: take.id, duration: take.dur, script_sha256: takeScriptSha256(take), seed: 300000 + (ctx.seed(`take-${take.id}`) % 600000) })),
  });
  const configurationSha256 = kitMediaConfigurationSha256(configuration(accepted.get(takes[0].id)?.video.sha256 || null));
  const routeProblem = kitMediaRouteProblem({ provider: 'fal', model: MODEL, shot_type: 'talking_creator', configuration_sha256: configurationSha256, accepted_source_sha256: accepted.get(takes[0].id)?.video.sha256, speech_mode: 'native_dialogue', required_features: features, qualification: inputs.qualification, trial: stage === 'first_take' });
  if (routeProblem) throw ctx.error('bad_input', routeProblem);
  const actionRequired = features.some((feature) => H3_PRODUCT_ACTIONS.includes(feature));

  const resolution = inputs.resolution ?? kitTierDefault(inputs, 'h3_resolution');
  const aspect = inputs.aspect_ratio ?? '9:16';
  let voice = null;
  const made = [];
  for (const [k, t] of takes.entries()) {
    if (stage === 'first_take' && k > 0) break;
    kitStopIfAborted(ctx);
    const piece = `take-${t.id}`;
    const dialogue = t.lines.map((l) => l.spoken).join(' ');
    const body = {
      prompt: prompt(creator.character, delivery, !!inputs.mannerism, dialogue, capture, focus, !!voice),
      duration: t.dur,
      resolution,
      aspect_ratio: aspect,
      seed: 300000 + (ctx.seed(piece) % 600000),
      prompt_expansion_mode: 'disabled',
      image_url: creator.character.image,
      reference_image_urls: [creator.character.image],
    };
    if (inputs.mannerism) body.reference_video_urls = [inputs.mannerism];
    if (voice) body.reference_audio_urls = [voice];
    const source = accepted.get(t.id);
    const result = source ? null : await ctx.line.order({ piece, provider: 'fal', path: MODEL, body, results: [{ pointer: '/json/video/url', name: `${t.id}.mp4`, media: 'video' }] });
    const file = source ? source.video : result.files[`${t.id}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    const info = await ctx.tools.probe(file.path);
    if (!info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its voice`);
    const duration = await kitDuration(ctx, file);
    if (source) {
      const problem = kitMediaReviewProblem(source.review, file, takeScriptSha256(t), duration, { productActionRequired: actionRequired });
      if (problem) throw ctx.error('bad_input', `take ${t.id}: ${problem}`);
      const timing = sourceWordTiming(source, t, duration, ctx);
      made.push({ ...t, ...timing, file, path: file.path, duration, start: t.covers[0], review: source.review });
    } else {
      const heard = await measureSpeech(ctx, file.path, duration);
      if (!heard) throw ctx.error('provider_failed', `${piece} came back with no speech to hear`);
      const said = t.lines.reduce((n, l) => n + l.spoken.split(/\s+/).filter(Boolean).length, 0);
      ctx.log.info('take pace', { take: t.id, words: said, wps: +(said / Math.max(0.1, heard.end - heard.onset)).toFixed(2) });
      made.push({ ...t, file, path: file.path, duration, start: t.covers[0], onset: heard.onset, speech_end: heard.end, timing_method: 'energy_estimate', review: null });
    }
    if (k === 0 && takes.length > 1) {
      // Conditioning follows a reviewed first performance. It is not a promise
      // that later takes reproduce the same voice; each needs its own listening.
      await kitFfmpeg(ctx, ['-i', file.path, ...VOICE_CLIP, join(ctx.tmpDir, 't1-voice.wav')]);
      voice = await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/t1-voice.wav`, 'audio');
    }
    ctx.progress({ done: k + 1, total: takes.length });
  }
  if (stage !== 'assemble') {
    const pending = made.find((take) => !take.review) || made[0];
    return kitCheckOutputs(ctx, manifest, {
      video: pending.file, seconds: pending.duration, content_review_status: 'pending', ...extras,
      source_files: made.map((take) => take.file),
      configuration_sha256: kitMediaConfigurationSha256(configuration(made[0].file.sha256)),
      review_request: {
        kind: 'creator_source_content', generation_stage: stage,
        creative_contract_revision: inputs.creative_contract_revision,
        configuration_sha256: kitMediaConfigurationSha256(configuration(made[0].file.sha256)),
        provider: 'fal', model: MODEL, shot_type: 'talking_creator',
        checks: ['script', 'voice', 'lipsync', 'identity', 'framing', 'performance', 'product_action'],
        product_action_required: actionRequired,
        sources: made.filter((take) => !take.review).map((take) => ({ id: take.id, video: take.file, source_sha256: take.file.sha256, script_sha256: takeScriptSha256(take), coverage_required: { start_s: 0, end_s: take.duration, video_watched: true, audio_listened: true }, expected_lines: take.lines.map((line) => ({ scene_id: line.scene_id, written: line.text, spoken: line.spoken })) })),
      },
      takes: made.map((take) => ({ id: take.id, video: take.file, start_s: 0, scene_ids: take.lines.map((line) => line.scene_id), script_sha256: takeScriptSha256(take), content_review_status: take.review ? 'pass' : 'pending', timing_method: take.timing_method })),
    });
  }
  for (const t of made) {
    const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'csv=p=0', t.path]);
    t.channels = Number(String(stdout).trim().split(',')[0]) || 2;
  }
  let plan;
  try {
    plan = schedule(made, 30, measured);
  } catch (e) {
    throw ctx.error('output_invalid', e.message);
  }
  await joinTakes(ctx, plan, join(ctx.workDir, 'creator.mp4'));
  const video = await ctx.file('creator.mp4', 'video');
  const info = await ctx.tools.probe(video.path);
  // Line spans on the reel (captions and the check transcribe the real speech). planned: the
  // estimates shifted to the take's onset. measured: each boundary between two lines on a silence heard
  // between them, else the estimates spread over the take's measured speech, from its first word to its last.
  const speech = [];
  for (const t of plan.takes) {
    const base = t.start + t.head_pad;
    const [c0, c1] = t.covers;
    const scale = measured && c1 > c0 ? (t.speech_end - t.onset) / (c1 - c0) : 1;
    const at = (x) => (measured ? base + t.onset + (x - c0) * scale : x + base + (t.onset || LEAD) - c0);
    const spans = t.lines.map((line) => {
      const words = t.words.filter((word) => word.scene_id === line.scene_id);
      return { start: words[0].start_s, end: words.at(-1).end_s, words };
    });
    for (const [i, l] of t.lines.entries()) {
      const from = spans ? base + spans[i].start : at(l.start);
      const to = spans ? base + spans[i].end : at(l.end);
      const entry = { scene_id: l.scene_id, text: l.text, start_s: +Math.max(0, from).toFixed(3), end_s: +Math.min(plan.duration, to).toFixed(3) };
      entry.words = spans[i].words.map((word) => ({ text: word.text, start_s: +(base + word.start_s).toFixed(3), end_s: +(base + word.end_s).toFixed(3) }));
      if (l.spoken !== l.text) entry.spoken = l.spoken;
      speech.push(entry);
    }
  }
  // Scene spans tile the reel from each line's start. With split_before cutaways, the scene a later
  // take starts on begins COVER_LEAD before its join, so an insert on that scene covers the whole dissolve.
  const starts = speech.map((s) => s.start_s);
  if (cutaways) {
    let at = 0;
    for (const t of plan.takes.slice(1)) {
      at = speech.findIndex((s, i) => i >= at && s.scene_id === t.lines[0].scene_id);
      if (at <= 0) continue;
      // Never later than the line itself or the join. Earlier scenes give way (each keeps MIN_SPAN) so the
      // spans stay positive and in order; an earlier line's estimated end may then run past its scene's
      // end, which the heard timing retimes. schedule() keeps every join at least MIN_SPAN per earlier
      // line plus COVER_LEAD from the reel start, so the floor here never passes the join.
      starts[at] = +Math.max(MIN_SPAN * at, Math.min(starts[at], t.start - COVER_LEAD)).toFixed(3);
      for (let i = at - 1; i >= 0 && starts[i] > starts[i + 1] - MIN_SPAN; i--) starts[i] = +Math.max(MIN_SPAN * i, starts[i + 1] - MIN_SPAN).toFixed(3);
    }
  }
  const timeline = {
    duration_s: +plan.duration.toFixed(3),
    width: info.width,
    height: info.height,
    fps: 30,
    scenes: speech.map((s, i) => ({ id: s.scene_id, start_s: starts[i], end_s: i + 1 < speech.length ? starts[i + 1] : +plan.duration.toFixed(3) })),
    speech,
  };
  const assemblyTimeline = {
    format: 'gooseworks-assembly-timeline/1', duration_ms: Math.round(plan.duration * 1000),
    creative_contract_revision: inputs.creative_contract_revision, speech_mode: 'native_dialogue',
    soundtrack_modes: [], pauses: [], required_cue_ids: plan.takes.map((take) => `${take.id}-native`),
    segments: plan.takes.flatMap((take) => {
      const base = take.start + take.head_pad;
      const sourceEnd = Math.min(take.duration, take.need - take.head_pad);
      return take.lines.map((line, index) => {
        const sourceStart = index ? Math.min(sourceEnd, Math.max(0, take.words.find((word) => word.scene_id === line.scene_id).start_s)) : 0;
        const nextLine = take.lines[index + 1];
        const end = nextLine ? Math.min(sourceEnd, Math.max(sourceStart, take.words.find((word) => word.scene_id === nextLine.scene_id).start_s)) : sourceEnd;
        return { id: `${take.id}-${line.scene_id}`, scene_id: line.scene_id, start_ms: Math.round((base + sourceStart) * 1000), end_ms: Math.round((base + end) * 1000),
          video: { asset_id: take.id, sha256: take.file.sha256, path: take.file.path, in_ms: Math.round(sourceStart * 1000), out_ms: Math.round(end * 1000), speed: 1 },
          speech_mode: 'native_dialogue', depicts_speech: true, native_audio: 'preserve', intent: 'Scene span uses reviewed source words; native picture and audio share the same clock.' };
      }).filter((segment) => segment.end_ms > segment.start_ms);
    }),
    audio_cues: plan.takes.map((take) => ({
      id: `${take.id}-native`, role: 'native_dialogue', source: { asset_id: take.id, sha256: take.file.sha256, path: take.file.path, in_ms: 0, out_ms: Math.round(Math.min(take.duration, take.need - take.head_pad) * 1000), speed: 1 },
      start_ms: Math.round((take.start + take.head_pad) * 1000), end_ms: Math.round(Math.min(plan.duration, take.start + take.head_pad + Math.min(take.duration, take.need - take.head_pad)) * 1000), gain_db: 0, loop: false,
    })),
    visual_overrides: plan.takes.flatMap((take, index) => {
      const overrides = [];
      if (take.head_pad > 0) overrides.push({ start_ms: Math.round(take.start * 1000), end_ms: Math.round((take.start + take.head_pad) * 1000), kind: 'freeze', scene_id: take.lines[0].scene_id, source_kind: 'video', reason: 'Declared silent head padding before the same source audio and picture start.', source: { asset_id: take.id, sha256: take.file.sha256, path: take.file.path, in_ms: 0, out_ms: Math.min(Math.round(1000 / 30), Math.round(take.duration * 1000)), speed: 1 } });
      if (take.tail_pad > 0) overrides.push({ start_ms: Math.round((take.start + take.head_pad + take.duration) * 1000), end_ms: Math.round(Math.min(plan.duration, take.start + take.need) * 1000), kind: 'freeze', scene_id: take.lines.at(-1).scene_id, source_kind: 'video', reason: 'Short declared hold after the complete reviewed source speech.', source: { asset_id: take.id, sha256: take.file.sha256, path: take.file.path, in_ms: Math.max(0, Math.round((take.duration - 1 / 30) * 1000)), out_ms: Math.round(take.duration * 1000), speed: 1 } });
      if (index) overrides.push({ start_ms: Math.round(take.start * 1000), end_ms: Math.round((take.start + plan.xf) * 1000), kind: 'transition', reason: 'Matched 0.10-second picture and audio dissolve after reviewed outgoing speech.', segment_ids: [`${plan.takes[index - 1].id}-${plan.takes[index - 1].lines.at(-1).scene_id}`, `${take.id}-${take.lines[0].scene_id}`] });
      return overrides;
    }).filter((override) => override.end_ms > override.start_ms),
  };
  assemblyTimeline.pauses = plan.takes.flatMap((take) => {
    const pauses = [];
    if (take.head_pad > 0) pauses.push({ start_ms: Math.round(take.start * 1000), end_ms: Math.round((take.start + take.head_pad) * 1000), scope: 'speech', reason: 'Matched native source head padding.' });
    if (take.tail_pad > 0) pauses.push({ start_ms: Math.round((take.start + take.head_pad + take.duration) * 1000), end_ms: Math.round(Math.min(plan.duration, take.start + take.need) * 1000), scope: 'speech', reason: 'Short source hold after reviewed word endings.' });
    return pauses;
  }).filter((pause) => pause.end_ms > pause.start_ms);
  for (let index = 1; index < plan.takes.length; index++) {
    const previous = plan.takes[index - 1];
    const incoming = plan.takes[index];
    const start = previous.start + previous.head_pad + previous.speech_end;
    const end = incoming.start + incoming.head_pad + incoming.onset;
    if (end > start) assemblyTimeline.pauses.push({ start_ms: Math.round(start * 1000), end_ms: Math.round(end * 1000), scope: 'speech', reason: 'Short declared take-boundary pause after complete reviewed word endings.' });
  }
  return kitCheckOutputs(ctx, manifest, {
    video,
    seconds: timeline.duration_s,
    timeline,
    assembly_timeline: assemblyTimeline,
    content_review_status: 'pending',
    ...extras,
    configuration_sha256: configurationSha256,
    source_files: plan.takes.map((take) => take.file),
    provenance: { speech_mode: 'native_dialogue', source_content_review: 'pass', final_content_review: 'pending', timing_method: 'reviewed_source_words', sources: plan.takes.map((take) => ({ id: take.id, sha256: take.file.sha256, script_sha256: takeScriptSha256(take), head_pad_s: take.head_pad, tail_pad_s: take.tail_pad, source_start_s: 0, source_end_s: Math.min(take.duration, take.need - take.head_pad), picture_speed: 1, audio_speed: 1, review: take.review })) },
    takes: plan.takes.map((t, k) => {
      const take = { id: t.id, video: t.file, start_s: +t.start.toFixed(3), scene_ids: t.lines.map((l) => l.scene_id), script_sha256: takeScriptSha256(t), content_review_status: 'pass', timing_method: t.timing_method };
      if (k) take.joins_s = take.start_s;
      return take;
    }),
  });
}
