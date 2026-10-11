// Built from dialogue-cut/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- _lib/length.mjs ----
// The length of a customer's media file, for parts that take one as it was uploaded. A streaming WebM or
// Matroska file (a browser or screen recording) plays but has no container duration, so the core's probe
// gives none: this falls back to the streams' own durations or DURATION tags, then the last packet's end.

// What ffprobe says at error level about a cut-off or damaged file. It still exits 0 and reports what it
// read, so a half-uploaded recording would otherwise measure as a complete, shorter one.
const kitDamaged = /ended prematurely|invalid data|truncat|corrupt|EBML|moov atom not found|error reading|end of file/i;

async function kitProbeClean(ctx, file, args) {
  const { stdout, stderr } = await ctx.tools.exec('ffprobe', ['-v', 'error', ...args, file.path]);
  const damage = String(stderr || '').split('\n').find((line) => kitDamaged.test(line));
  if (damage) throw ctx.error('bad_input', `the media file is damaged or incomplete (${damage.replace(/^\[[^\]]*\]\s*/, '').trim().slice(0, 120)})`);
  return stdout;
}

function kitClockSeconds(tag) {
  const m = /^(\d+):(\d{2}):(\d{2}(?:\.\d+)?)$/.exec(String(tag || '').trim());
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : NaN;
}

/**
 * Media length in seconds: kitDuration, else the streams' durations or tags, else the last packet's end.
 * A file ffprobe reports as cut off or damaged is refused (bad_input), never measured short.
 */
async function kitMediaLength(ctx, file) {
  try {
    return await kitDuration(ctx, file);
  } catch (e) {
    if (e.code !== 'tool_failed') throw e;
  }
  const streams = JSON.parse(await kitProbeClean(ctx, file, ['-print_format', 'json', '-show_entries', 'stream=duration:stream_tags=DURATION'])).streams || [];
  const declared = streams.map((s) => Math.max(Number(s.duration) || 0, kitClockSeconds(s.tags && (s.tags.DURATION || s.tags.duration)) || 0));
  if (Math.max(0, ...declared) > 0) return Math.max(...declared);
  const packets = await kitProbeClean(ctx, file, ['-show_entries', 'packet=pts_time,duration_time', '-of', 'csv=p=0']);
  let end = 0;
  for (const line of packets.split('\n')) {
    const [pts, d] = line.split(',').map(Number);
    if (Number.isFinite(pts)) end = Math.max(end, pts + (Number.isFinite(d) ? d : 0));
  }
  if (!(end > 0)) throw ctx.error('tool_failed', `no length for ${file.path}`);
  return end;
}

// ---- dialogue-cut/src/plan.mjs ----
// dialogue-cut planner: the free, seeded picture edit over a two-host dialogue
// whose audio is already fixed. A port of the podcast recipe's plan_cuts.py
// (one-shot-videos/create-podcast-skit-video-from-refs/scripts/plan_cuts.py)
// plus its cut-plan gates (gates.py gate_cutplan, gate_split_balance,
// gate_framing_variety). Pure functions: no files, no ffmpeg, no clock, no RNG.
// The compose (dialogue-cut 1.0.0, W1-12) renders the plan this returns.
//
// The audio never moves. What varies is the PICTURE, cut by cut, over lipsync
// clips that were already paid for, so every re-cut costs nothing.
//
// Three cut kinds:
//   single    the scene's own lipsync clip, trimmed to the cut's window. The
//             only kind that may show the speaking host full frame, because it
//             is the only one whose mouth tracks the audio.
//   reaction  the OTHER host full frame, sampled from that host's nearest own
//             clip at a seeded offset. This is what makes a cut inside a line
//             possible: another still of the speaker would show a mouth that
//             does not move.
//   split     the speaker on top, and below either the listener (their nearest
//             clip, or their idle clip) or a product still. A seam ratio per
//             cut; moving the seam is itself a framing change.
// The payoff beat (a scene marked extra.payoff, else the last) drops the split
// for one full-frame single, only when the piece was split earlier.
//
// Modes (a declared answer): plain = one full-frame picture per line;
// split = the speaker over the listener almost throughout, with the payoff
// single; dynamic = cut patterns inside each line, five reframes per host,
// splits on a cadence, seams 0.62 / 0.37 / 0.5, product or listener below.
//
// Pattern choice is a cursor walk over DIALOGUE_PATTERNS from seed % length,
// and the framing tie-break is arithmetic on the seed: the same seed and the
// same lines always give the same plan.
//
// Exports (W1-12 imports these):
//   DIALOGUE_MODES, DIALOGUE_CROPS, DIALOGUE_PATTERNS
//   dialogueSettings(mode, overrides)         -> settings for one mode
//   dialogueBeats(scenes, spans, hosts, opts) -> {beats, skipped}; throws bad_input
//   dialoguePlan(beats, hosts, settings, opts) -> the cut plan
//   dialoguePlanProblems(plan, beats, hosts, settings, opts) -> ['check_id: message', ...]
//   dialogueFramingStats(cuts, totalS)
// Thrown errors carry code 'bad_input'; the compose rethrows them through ctx.error.

/** The reference framings: a normalised crop rect on the source picture. */
const DIALOGUE_CROPS = Object.freeze({
  wide: Object.freeze({ x: 0, y: 0, w: 1, h: 1 }),
  mid: Object.freeze({ x: 0.1, y: 0.05, w: 0.8, h: 0.8 }),
  tight: Object.freeze({ x: 0.21, y: 0.03, w: 0.58, h: 0.58 }),
  mid_left: Object.freeze({ x: 0.02, y: 0.08, w: 0.76, h: 0.76 }),
  tight_right: Object.freeze({ x: 0.4, y: 0.06, w: 0.56, h: 0.56 }),
});

// The recipe's cut patterns, in its order. A-I-A (an image-to-video insert) is
// never eligible here (inserts are paid and were never built), but it stays in
// the list because the cursor walk starts at seed % length: dropping it would
// change every plan the recipe ever approved.
const DIALOGUE_PATTERNS = Object.freeze([
  { id: 'A', segments: ['speaker'], weights: [1.0] },
  { id: 'A-R', segments: ['speaker', 'listener'], weights: [0.68, 0.32] },
  { id: 'A-R-A', segments: ['speaker', 'listener', 'speaker'], weights: [0.42, 0.22, 0.36] },
  { id: 'R-A', segments: ['listener', 'speaker'], weights: [0.28, 0.72] },
  { id: 'S', segments: ['split'], weights: [1.0] },
  { id: 'A-S', segments: ['speaker', 'split'], weights: [0.55, 0.45] },
  { id: 'A-I-A', segments: ['speaker', 'insert', 'speaker'], weights: [0.4, 0.25, 0.35] },
]);

const FRAMING_BANDS = Object.freeze({ per_10s_min: 2.9, per_10s_max: 7.1, max_share: 0.17 });

/** The recipe's config.example.json `edit` block (dynamic) and its plain and split presets. */
const DIALOGUE_MODES = Object.freeze({
  dynamic: {
    seed: 4201,
    multicut: true,
    min_cut_s: 0.5,
    max_cut_s: 1.9,
    split: { enabled: true, auto_every: 4, max_consecutive: 1, min_beat_s: 0.8, seams: [0.62, 0.37, 0.5], bottom_sources: ['listener', 'product'], listener_source: 'clip', target_share: 1.0 },
    payoff: 'last',
    sizes: ['wide', 'mid', 'tight', 'mid_left', 'tight_right'],
  },
  split: {
    seed: 4201,
    multicut: false,
    min_cut_s: 0.5,
    max_cut_s: 6.0,
    split: { enabled: true, auto_every: 1, max_consecutive: 99, min_beat_s: 0.6, seams: [0.5], bottom_sources: ['listener'], listener_source: 'idle', target_share: 1.0 },
    payoff: 'last',
    sizes: ['wide'],
  },
  plain: {
    seed: 4201,
    multicut: false,
    min_cut_s: 0.5,
    max_cut_s: 1.9,
    split: { enabled: false, auto_every: 4, max_consecutive: 1, min_beat_s: 0.8, seams: [0.62, 0.37, 0.5], bottom_sources: ['listener', 'product'], listener_source: 'clip', target_share: 1.0 },
    payoff: 'none',
    sizes: ['wide'],
  },
});

const OVERRIDES = new Set(['seed', 'crops', 'seams', 'bottom_sources', 'payoff', 'listener_source', 'idle_seconds', 'min_cut_s', 'max_cut_s']);

function dialogueBadInput(message) {
  return Object.assign(new Error(message), { code: 'bad_input' });
}

/** Python's round(x, 6) closely enough for times in seconds. */
function dialogueRound(x, digits = 6) {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}

/** Python's round() to an integer: halves go to the even neighbour. */
function dialogueRoundHalfEven(x) {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

/**
 * Settings for one mode. `overrides` holds only the inputs a style may pass
 * (seed, crops, seams, bottom_sources, payoff 'last' | 'none', listener_source
 * 'clip' | 'idle', idle_seconds, min_cut_s, max_cut_s); each replaces the
 * mode's default. Anything else is refused, so a typo is an error and not a
 * setting nobody reads.
 */
function dialogueSettings(mode, overrides = {}) {
  const base = DIALOGUE_MODES[mode];
  if (!base) throw dialogueBadInput(`dialogue-cut: mode ${JSON.stringify(mode)} is not one of ${Object.keys(DIALOGUE_MODES).join(', ')}`);
  for (const k of Object.keys(overrides || {})) {
    if (!OVERRIDES.has(k)) throw dialogueBadInput(`dialogue-cut: ${k} is not a planner setting`);
  }
  const o = overrides || {};
  const crops = { ...DIALOGUE_CROPS, ...(o.crops || {}) };
  for (const [name, c] of Object.entries(crops)) {
    if (!c || !(c.x >= 0 && c.y >= 0 && c.w > 0 && c.h > 0 && c.x + c.w <= 1 + 1e-9 && c.y + c.h <= 1 + 1e-9)) {
      throw dialogueBadInput(`dialogue-cut: crop ${name} ${JSON.stringify(c)} leaves the picture`);
    }
  }
  const split = { ...base.split, idle_seconds: 6.0 };
  if (o.seams !== undefined) split.seams = [...o.seams];
  if (o.bottom_sources !== undefined) split.bottom_sources = [...o.bottom_sources];
  if (o.listener_source !== undefined) split.listener_source = o.listener_source;
  if (o.idle_seconds !== undefined) split.idle_seconds = o.idle_seconds;
  for (const s of split.seams) if (!(s > 0.2 && s < 0.8)) throw dialogueBadInput(`dialogue-cut: seam ${s} is outside 0.2 to 0.8`);
  if (!split.seams.length) throw dialogueBadInput('dialogue-cut: seams is empty');
  for (const b of split.bottom_sources) if (b !== 'listener' && b !== 'product') throw dialogueBadInput(`dialogue-cut: bottom source ${JSON.stringify(b)} is not listener or product`);
  if (split.listener_source !== 'clip' && split.listener_source !== 'idle') throw dialogueBadInput(`dialogue-cut: listener_source ${JSON.stringify(split.listener_source)} is not clip or idle`);
  const payoff = o.payoff ?? base.payoff;
  if (payoff !== 'last' && payoff !== 'none') throw dialogueBadInput(`dialogue-cut: payoff ${JSON.stringify(payoff)} is not last or none`);
  const min_cut_s = o.min_cut_s ?? base.min_cut_s;
  const max_cut_s = o.max_cut_s ?? base.max_cut_s;
  if (!(min_cut_s > 0 && max_cut_s > min_cut_s)) throw dialogueBadInput(`dialogue-cut: cut bounds ${min_cut_s} to ${max_cut_s} are not a range`);
  const seed = o.seed ?? base.seed;
  if (!Number.isInteger(seed) || seed < 0) throw dialogueBadInput(`dialogue-cut: seed ${seed} is not a whole number`);
  return {
    mode,
    seed,
    multicut: base.multicut,
    min_cut_s,
    max_cut_s,
    split,
    payoff,
    sizes: base.sizes.filter((s) => crops[s]),
    crops,
    bands: { ...FRAMING_BANDS },
    patterns: DIALOGUE_PATTERNS,
  };
}

/**
 * The beats (one per spoken scene) the plan cuts over, from plan.scenes and a
 * timing producer's spans [{id, start_s, end_s}]. A beat runs from its line's
 * start to the next line's start, so the gap after a line belongs to it and the
 * beats tile the audio from 0 to `seconds` (the voice length; default: the last
 * span's end). A scene with no line and no span is skipped (critic #9); a line
 * with no span, a speaker outside `hosts`, or overlapping spans are refused.
 * `scene.extra.split` asks for a split on that line; `scene.extra.payoff`
 * marks the payoff line.
 */
function dialogueBeats(scenes, spans, hosts, { seconds } = {}) {
  if (!Array.isArray(hosts) || hosts.length !== 2 || hosts[0] === hosts[1]) {
    throw dialogueBadInput(`dialogue-cut: needs exactly two hosts, got ${JSON.stringify(hosts)}`);
  }
  const byId = new Map((spans || []).map((s) => [s.id, s]));
  const beats = [];
  const skipped = [];
  for (const scene of scenes || []) {
    const span = byId.get(scene.id);
    const spoken = typeof scene.line === 'string' && scene.line.trim() !== '';
    if (!span) {
      if (spoken) throw dialogueBadInput(`dialogue-cut: scene ${scene.id} has a line but no span in the voice timing`);
      skipped.push(scene.id);
      continue;
    }
    if (!hosts.includes(scene.speaker)) {
      throw dialogueBadInput(`dialogue-cut: scene ${scene.id} speaker ${JSON.stringify(scene.speaker ?? null)} is not one of the hosts ${hosts.join(', ')}`);
    }
    if (!(span.end_s > span.start_s && span.start_s >= 0)) throw dialogueBadInput(`dialogue-cut: scene ${scene.id} span ${span.start_s} to ${span.end_s} is empty`);
    beats.push({ n: beats.length + 1, id: scene.id, who: scene.speaker, span_start_s: span.start_s, span_end_s: span.end_s, split: scene.extra?.split === true, payoff: scene.extra?.payoff === true });
  }
  if (!beats.length) throw dialogueBadInput('dialogue-cut: no scene has a spoken line with a span');
  for (let i = 1; i < beats.length; i++) {
    if (beats[i].span_start_s < beats[i - 1].span_end_s - 1e-6) {
      throw dialogueBadInput(`dialogue-cut: spans of ${beats[i - 1].id} and ${beats[i].id} overlap or are out of order`);
    }
  }
  const last = beats.at(-1);
  const end = Math.max(last.span_end_s, Number.isFinite(seconds) ? seconds : 0);
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    b.start_s = i === 0 ? 0 : beats[i - 1].end_s;
    b.end_s = i + 1 < beats.length ? beats[i + 1].span_start_s : end;
    b.dur_s = b.end_s - b.start_s;
  }
  return { beats, skipped };
}

function dialogueSplitWindow(beat, s, idx, prevSplit) {
  const ss = s.split;
  if (!ss.enabled) return false;
  const every = ss.auto_every;
  if (!(beat.split || (every > 0 && idx % every === 0))) return false;
  if (prevSplit >= ss.max_consecutive) return false;
  if (beat.dur_s < ss.min_beat_s) return false;
  return true;
}

function dialogueEligible(pat, beat, s, idx, prevSplit) {
  const segs = pat.segments;
  const dur = beat.dur_s;
  if (!s.multicut && segs.length > 1) return false;
  if (segs.includes('split') && !dialogueSplitWindow(beat, s, idx, prevSplit)) return false;
  if (segs.includes('insert')) return false;
  if (segs.length * s.min_cut_s > dur + 1e-9) return false;
  if (Math.max(...pat.weights.map((w) => w * dur)) > s.max_cut_s + 1e-9) return false;
  if (Math.min(...pat.weights.map((w) => w * dur)) < s.min_cut_s - 1e-9) return false;
  return true;
}

/** Index of the beat nearest to i spoken by `who` (ties go to the earlier one), or null. */
function dialogueNearestClip(beats, i, who) {
  let best = null;
  let bd = Infinity;
  for (let j = 0; j < beats.length; j++) {
    if (beats[j].who !== who) continue;
    const d = Math.abs(j - i);
    if (d < bd) {
      best = j;
      bd = d;
    }
  }
  return best;
}

/**
 * One full-frame single on the payoff beat. A beat longer than the ceiling
 * becomes speaker cuts with the single as the last, so the emphasis still
 * lands at the end of the line. The head before the single is one speaker cut
 * when it fits under the ceiling (the recipe's P2), else it is shared evenly
 * across as many speaker cuts as the ceiling needs (P3, P4, ...). null when the
 * beat cannot carry it.
 */
function dialoguePayoffPattern(dur, s) {
  if (dur <= s.max_cut_s + 1e-9) return { id: 'P', segments: ['speaker'], weights: [1.0], payoff_idx: 1 };
  const tail = Math.min(s.max_cut_s, dur - s.min_cut_s);
  if (tail < s.min_cut_s - 1e-9) return null;
  const head = dur - tail;
  const n = Math.max(1, Math.ceil(head / s.max_cut_s - 1e-9));
  if (head / n < s.min_cut_s - 1e-9) return null;
  const heads = Array.from({ length: n }, () => dialogueRound(head / n / dur, 9));
  return { id: `P${n + 1}`, segments: Array(n + 1).fill('speaker'), weights: [...heads, dialogueRound(tail / dur, 9)], payoff_idx: n + 1 };
}

/**
 * The longest beat some pattern can lay out with every cut under the ceiling:
 * the ceiling itself when a line is one cut (plain and split), else the ceiling
 * over the smallest biggest-weight of the patterns that need no split window.
 */
function dialogueBeatCapacity(s) {
  let cap = s.max_cut_s;
  if (!s.multicut) return cap;
  for (const p of s.patterns) {
    if (p.segments.includes('split') || p.segments.includes('insert')) continue;
    cap = Math.max(cap, s.max_cut_s / Math.max(...p.weights));
  }
  return cap;
}

/**
 * The recipe cut a long line into several beats before the lipsync
 * (plan_beats.py, max_beat_sec), so its planner never saw a beat no pattern
 * could carry. Here a line is one lipsync clip, so a beat longer than the
 * capacity is shared into equal pieces the planner treats as beats. Each piece
 * keeps the scene id and its offset into the scene (`off_s`), so every cut
 * still reads its own scene's clip at the right point. Only the last piece of
 * a payoff line carries the payoff. Beats that fit are passed through as they
 * are, so a plan the recipe could make is unchanged.
 */
function dialogueExpandBeats(beats, s) {
  const cap = dialogueBeatCapacity(s);
  if (!beats.some((b) => b.dur_s > cap + 1e-9)) return beats.map((b) => ({ ...b, off_s: 0 }));
  const out = [];
  for (const b of beats) {
    const k = b.dur_s > cap + 1e-9 ? Math.ceil(b.dur_s / cap - 1e-9) : 1;
    for (let j = 0; j < k; j++) {
      const start = dialogueRound(b.start_s + (b.dur_s * j) / k);
      const end = j + 1 < k ? dialogueRound(b.start_s + (b.dur_s * (j + 1)) / k) : b.end_s;
      out.push({ ...b, n: out.length + 1, start_s: start, end_s: end, dur_s: end - start, off_s: start - b.start_s, payoff: b.payoff && j + 1 === k });
    }
  }
  return out;
}

/** Every framing a cut may take, in a fixed order. Two options share a label only when they look the same. */
function dialogueFramingOptions(cut, s, hasProduct) {
  if (cut.mode === 'split') {
    const spk = cut.show || cut.speaker || '?';
    const opts = [];
    for (const seam of s.split.seams) {
      for (const bottom of s.split.bottom_sources) {
        if (bottom === 'listener' && cut.listener_clip_scene === null) continue;
        if (bottom === 'product' && !hasProduct) continue;
        opts.push({ framing: `split:${spk}:${seam.toFixed(2)}:${bottom}`, seam, bottom, crop: { ...s.crops.wide } });
      }
    }
    if (!opts.length) opts.push({ framing: `split:${spk}:0.62:listener`, seam: 0.62, bottom: 'listener', crop: { ...DIALOGUE_CROPS.wide } });
    return opts;
  }
  const who = cut.show || cut.speaker;
  const sizes = s.sizes.length ? s.sizes : ['wide'];
  return sizes.map((size) => ({ framing: `${who}:${size}`, size, crop: { ...(s.crops[size] || DIALOGUE_CROPS.wide) } }));
}

/** Least-used framing wins; ties rotate on arithmetic of the seed, never an RNG. */
function dialoguePick(cands, use, seed, ordinal) {
  let best = null;
  let bestKey = null;
  cands.forEach((c, i) => {
    const key = [use.get(c.framing) || 0, (seed * 31 + ordinal * 7 + i * 13) % 997, i];
    if (!bestKey || key[0] < bestKey[0] || (key[0] === bestKey[0] && (key[1] < bestKey[1] || (key[1] === bestKey[1] && key[2] < bestKey[2])))) {
      best = c;
      bestKey = key;
    }
  });
  return best;
}

function dialogueApplyFraming(cut, opt) {
  cut.framing = opt.framing;
  cut.crop = opt.crop;
  if (opt.size) cut.size = opt.size;
  if (cut.mode === 'split') {
    cut.seam = opt.seam;
    cut.bottom = opt.bottom;
    if (opt.bottom !== 'listener') {
      // the lower panel is not a host any more, so the cut stops claiming one
      cut.listener = null;
      cut.listener_clip_scene = null;
    }
  }
}

/** No two consecutive cuts share a framing, and the least-used framing is spent first. */
function dialogueAssignFramings(cuts, s, hasProduct) {
  const use = new Map();
  const picks = [];
  const bump = (f, d) => use.set(f, (use.get(f) || 0) + d);
  for (let i = 0; i < cuts.length; i++) {
    const c = cuts[i];
    let opts = dialogueFramingOptions(c, s, hasProduct);
    if (c.payoff) {
      const full = opts.filter((o) => o.framing.endsWith(':wide'));
      if (full.length) opts = full;
    }
    let prev = i ? picks[i - 1].framing : null;
    // A forced cut (the payoff) can collide with what the previous cut took.
    // The previous cut is the flexible one, so it moves.
    if (i && opts.every((o) => o.framing === prev)) {
      const pprev = i >= 2 ? picks[i - 2].framing : null;
      const alts = dialogueFramingOptions(cuts[i - 1], s, hasProduct).filter((o) => o.framing !== prev && o.framing !== pprev);
      if (alts.length) {
        bump(prev, -1);
        const alt = dialoguePick(alts, use, s.seed, i - 1);
        picks[i - 1] = alt;
        bump(alt.framing, 1);
        dialogueApplyFraming(cuts[i - 1], alt);
        prev = alt.framing;
      }
    }
    const cands = opts.filter((o) => o.framing !== prev);
    const chosen = dialoguePick(cands.length ? cands : opts, use, s.seed, i);
    picks.push(chosen);
    bump(chosen.framing, 1);
    dialogueApplyFraming(c, chosen);
  }
}

/** How many distinct framings, per 10 s of `totalS`, and the biggest one's share. */
function dialogueFramingStats(cuts, totalS) {
  const use = new Map();
  for (const c of cuts) use.set(c.framing || '?', (use.get(c.framing || '?') || 0) + 1);
  let big = null;
  for (const [k, n] of use) if (!big || n > big[1] || (n === big[1] && k > big[0])) big = [k, n];
  return {
    n_framings: use.size,
    total_s: dialogueRound(totalS, 3),
    per_10s: totalS > 0 ? dialogueRound((use.size / totalS) * 10, 3) : 0,
    biggest: big ? big[0] : null,
    biggest_count: big ? big[1] : 0,
    biggest_share: cuts.length ? dialogueRound(big[1] / cuts.length, 4) : 0,
    use: Object.fromEntries([...use].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  };
}

/**
 * The cut plan. `beats` come from dialogueBeats, `hosts` are the two cast keys,
 * `settings` from dialogueSettings. Options: `products` (how many product
 * stills the split's lower panel may use; 0 drops the product bottom) and
 * `end_card_s` (counted in the runtime the framing rate is measured over, never
 * as a framing). Every cut covers [start_s, end_s) of the output; src_start_s
 * and src_end_s are its window inside the clip of scene `clip_scene`, measured
 * from that beat's start.
 */
function dialoguePlan(lines, hosts, settings, { products = 0, end_card_s = 0 } = {}) {
  const s = settings;
  const beats = s.multicut || s.split.enabled ? dialogueExpandBeats(lines, s) : lines.map((b) => ({ ...b, off_s: 0 }));
  const pats = s.patterns;
  const seed = s.seed;
  let cursor = seed % pats.length;
  const hasProduct = products > 0;

  let payoffBeat = null;
  if (s.payoff === 'last' && beats.length) {
    const marked = beats.filter((b) => b.payoff);
    payoffBeat = marked.length ? marked.at(-1).n : beats.at(-1).n;
  }

  const cuts = [];
  const used = {};
  let prevPat = null;
  let prevSplit = 0;
  let nSplit = 0;
  let prevSingleWho = null;
  const splitByWho = new Map();

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const dur = b.dur_s;
    const who = b.who;
    const other = who === hosts[0] ? hosts[1] : hosts[0];

    let chosen = null;
    if (payoffBeat !== null && b.n === payoffBeat && nSplit > 0) chosen = dialoguePayoffPattern(dur, s);

    if (chosen === null) {
      let order = Array.from({ length: pats.length }, (_, k) => pats[(cursor + k) % pats.length]);
      // the beat before the payoff wants a split, so the payoff single reads as emphasis
      const beforePayoff = payoffBeat !== null && i + 1 < beats.length && beats[i + 1].n === payoffBeat;
      // the same host twice in a row as two plain singles is a freeze, not a cut
      const sameAsPrev = prevSingleWho !== null && who === prevSingleWho;
      // speaker and split alternation phase-lock; prefer a split for the host behind on them
      const behind = (splitByWho.get(who) || 0) < (splitByWho.get(other) || 0);
      const atCap = nSplit >= Math.max(1, dialogueRoundHalfEven(s.split.target_share * beats.length));
      const splitFirst = ((beforePayoff || sameAsPrev || behind) && !atCap) || dialogueSplitWindow(b, s, i, prevSplit);
      if (splitFirst) order = [...order.filter((p) => p.segments.includes('split')), ...order.filter((p) => !p.segments.includes('split'))];
      if (atCap && !(beforePayoff || sameAsPrev)) {
        const noSplit = order.filter((p) => !p.segments.includes('split'));
        if (noSplit.length) order = noSplit;
      }
      for (const p of order) {
        if (!dialogueEligible(p, b, s, i, prevSplit)) continue;
        // a pattern does not run twice in a row, unless the alternative is a freeze
        if (p.id === prevPat && !(beforePayoff || sameAsPrev || behind) && order.some((q) => q.id !== prevPat && dialogueEligible(q, b, s, i, prevSplit))) continue;
        chosen = p;
        break;
      }
    }
    if (chosen === null) chosen = { id: 'A', segments: ['speaker'], weights: [1.0] };
    cursor = (cursor + 1) % pats.length;
    used[chosen.id] = (used[chosen.id] || 0) + 1;
    const hasSplit = chosen.segments.includes('split');
    prevSplit = hasSplit ? prevSplit + 1 : 0;
    if (hasSplit) splitByWho.set(who, (splitByWho.get(who) || 0) + 1);
    prevSingleWho = hasSplit ? null : who;
    prevPat = chosen.id;
    nSplit += chosen.segments.filter((x) => x === 'split').length;

    // lay the segments across the beat, exactly filling it
    const raw = chosen.weights.map((w) => dur * w);
    raw[raw.length - 1] = dialogueRound(dur - raw.slice(0, -1).reduce((a, x) => a + x, 0));
    const lst = dialogueNearestClip(beats, i, other);
    const payIdx = chosen.payoff_idx;

    let off = 0;
    chosen.segments.forEach((kind, k) => {
      const seglen = raw[k];
      const cut = {
        beat: b.n,
        scene_id: b.id,
        idx: k + 1,
        pattern: chosen.id,
        start_s: dialogueRound(b.start_s + off),
        end_s: dialogueRound(b.start_s + off + seglen),
        speaker: who,
        src_start_s: dialogueRound(b.off_s + off),
        src_end_s: dialogueRound(b.off_s + off + seglen),
      };
      if (payIdx === k + 1) cut.payoff = true;
      if (kind === 'speaker') {
        Object.assign(cut, { mode: 'single', source: 'clip', show: who, clip_scene: b.id });
      } else if (kind === 'listener') {
        if (lst === null) {
          Object.assign(cut, { mode: 'reaction', source: 'still', show: other, clip_scene: null });
        } else {
          const lb = beats[lst];
          // a seeded point inside the listener's clip, kept off its edges
          const pick = ((seed + b.n * 7 + k) % 5) / 6.0 + 0.08;
          const ls = dialogueRound(Math.min(Math.max(0, lb.dur_s - seglen), pick * lb.dur_s));
          Object.assign(cut, { mode: 'reaction', source: 'clip_muted', show: other, clip_scene: lb.id, src_start_s: dialogueRound(lb.off_s + ls), src_end_s: dialogueRound(lb.off_s + ls + seglen) });
        }
      } else if (kind === 'split') {
        Object.assign(cut, { mode: 'split', source: 'clip', show: who, clip_scene: b.id, listener: other, listener_clip_scene: lst === null ? null : beats[lst].id, layout: 'vstack' });
      }
      cuts.push(cut);
      off += seglen;
    });
  }

  dialogueAssignFramings(cuts, s, hasProduct);

  // What the lower panel plays: the listener's idle clip at a different window
  // each cut (deterministic on the cut ordinal), the listener's nearest clip
  // from its head, or the next product still in turn.
  let productTurn = 0;
  cuts.forEach((c, k) => {
    if (c.mode !== 'split') return;
    if (c.bottom === 'product') {
      c.product = productTurn % Math.max(1, products);
      productTurn += 1;
    } else if (s.split.listener_source === 'idle') {
      const seg = c.end_s - c.start_s;
      const span = Math.max(0, s.split.idle_seconds - seg);
      c.listener_source = 'idle';
      c.bottom_start_s = span > 0.05 ? dialogueRound((k * 1.73) % span, 3) : 0;
    } else {
      c.listener_source = 'clip';
      c.bottom_start_s = 0;
    }
  });

  const dialogue_s = beats.length ? beats.at(-1).end_s - beats[0].start_s : 0;
  return {
    mode: s.mode,
    seed,
    dialogue_s: dialogueRound(dialogue_s, 3),
    end_card_s,
    n_beats: lines.length,
    n_cuts: cuts.length,
    avg_cut_s: dialogueRound(dialogue_s / Math.max(1, cuts.length), 3),
    pattern_use: used,
    framing_stats: dialogueFramingStats(cuts, dialogue_s + end_card_s),
    cuts,
  };
}

/**
 * The plan's self-checks, each 'check_id: message'. An empty list is a pass.
 * Correctness checks always run: the picture covers each line's audio and tiles
 * the whole timeline, no cut under the floor, a split shows two different
 * hosts, the speaker is full frame only from its own clip, a reaction shows the
 * listener from the listener's own clip, and a split's lower panel has a picture
 * (a product still, or a clip of the listener when listener_source is clip).
 * Outside plain mode: the cut ceiling and no held picture across a cut. With a
 * split: the balance of who is on top. In dynamic mode: the framing band.
 * (Render drift is the compose's check, on the rendered file.)
 */
function dialoguePlanProblems(plan, beats, hosts, settings, { products = 0 } = {}) {
  const out = [];
  const fail = (id, msg) => out.push(`${id}: ${msg}`);
  const s = settings;
  const cuts = plan.cuts || [];
  if (!cuts.length) {
    fail('cutplan_nonempty', 'no cuts planned');
    return out;
  }
  const beatOf = new Map(beats.map((b) => [b.id, b]));

  // the picture covers each line's audio exactly
  for (const b of beats) {
    const got = cuts.filter((c) => c.scene_id === b.id).reduce((a, c) => a + (c.end_s - c.start_s), 0);
    if (Math.abs(got - b.dur_s) > 0.012) fail('cutplan_covers_vo', `scene ${b.id}: picture covers ${got.toFixed(3)} s of ${b.dur_s.toFixed(3)} s of audio`);
  }
  // cuts inside a line tile it, and the cuts tile the whole timeline in order
  for (const b of beats) {
    const bc = cuts.filter((c) => c.scene_id === b.id).sort((x, y) => x.start_s - y.start_s);
    for (let i = 1; i < bc.length; i++) {
      if (Math.abs(bc[i - 1].end_s - bc[i].start_s) > 1e-6) fail('cutplan_tiles_beat', `scene ${b.id}: gap or overlap at ${bc[i - 1].end_s.toFixed(3)} -> ${bc[i].start_s.toFixed(3)}`);
    }
  }
  if (Math.abs(cuts[0].start_s - beats[0].start_s) > 1e-6) fail('cutplan_tiles_timeline', `the first cut starts at ${cuts[0].start_s} s, not ${beats[0].start_s} s`);
  for (let i = 1; i < cuts.length; i++) {
    if (Math.abs(cuts[i - 1].end_s - cuts[i].start_s) > 1e-6) fail('cutplan_tiles_timeline', `cuts ${i} and ${i + 1}: gap or overlap at ${cuts[i - 1].end_s} -> ${cuts[i].start_s}`);
  }
  if (Math.abs(cuts.at(-1).end_s - beats.at(-1).end_s) > 1e-6) fail('cutplan_tiles_timeline', `the last cut ends at ${cuts.at(-1).end_s} s, not ${beats.at(-1).end_s} s`);

  // no cut under the floor: it reads as a flicker
  for (const c of cuts) {
    if (c.end_s - c.start_s < s.min_cut_s - 1e-6) fail('cutplan_min_cut', `scene ${c.scene_id} cut ${c.idx}: ${(c.end_s - c.start_s).toFixed(3)} s < ${s.min_cut_s} s floor`);
  }
  // a split shows two different hosts, unless its lower panel is a product
  for (const c of cuts) {
    if (c.mode !== 'split') continue;
    if (c.listener === c.speaker) fail('split_two_distinct_hosts', `scene ${c.scene_id}: the split shows ${c.speaker} twice`);
    else if ((c.bottom || 'listener') === 'listener') {
      if (!hosts.includes(c.listener)) fail('split_two_distinct_hosts', `scene ${c.scene_id}: listener ${JSON.stringify(c.listener)} is not a host`);
    } else if (c.listener !== null && c.listener !== undefined) {
      fail('split_two_distinct_hosts', `scene ${c.scene_id}: the lower panel is ${c.bottom} but the cut still names listener ${c.listener}`);
    }
    if (c.bottom === 'product' && !(products > 0)) fail('split_bottom_assets', `scene ${c.scene_id}: the lower panel is a product and there is no product still`);
    if ((c.bottom || 'listener') === 'listener' && s.split.listener_source === 'clip' && !c.listener_clip_scene) {
      fail('split_bottom_assets', `scene ${c.scene_id}: the lower panel is ${c.listener} from their own clip, and ${c.listener} speaks no line`);
    }
  }
  // the speaker full frame only from its own clip; a reaction shows the listener from the listener's clip
  for (const c of cuts) {
    if ((c.mode === 'single' || c.mode === 'split') && (c.source !== 'clip' || c.clip_scene !== c.scene_id || c.show !== c.speaker)) {
      fail('speaker_cut_is_lipsynced', `scene ${c.scene_id} cut ${c.idx}: shows ${c.show} from ${c.source} of scene ${c.clip_scene}, so the mouth would not track the audio`);
    }
    if (c.mode === 'reaction') {
      if (c.show === c.speaker) fail('reaction_cut_shows_listener', `scene ${c.scene_id} cut ${c.idx}: the reaction shows the speaker, not the listener`);
      else if (c.clip_scene !== null && beatOf.get(c.clip_scene)?.who !== c.show) fail('reaction_cut_shows_listener', `scene ${c.scene_id} cut ${c.idx}: the reaction of ${c.show} plays scene ${c.clip_scene}, which is not theirs`);
    }
  }

  const plain = !(s.multicut || s.split.enabled);
  if (!plain) {
    for (const c of cuts) {
      if (c.end_s - c.start_s > s.max_cut_s + 1e-6) fail('cutplan_max_cut', `scene ${c.scene_id} cut ${c.idx}: ${(c.end_s - c.start_s).toFixed(3)} s > ${s.max_cut_s} s ceiling`);
    }
    // the same host at the same framing on both sides of a cut reads as a freeze
    for (let i = 1; i < cuts.length; i++) {
      const a = cuts[i - 1];
      const b = cuts[i];
      if (a.mode === 'single' && b.mode === 'single' && a.show === b.show && a.framing === b.framing) {
        fail('cutplan_no_repeat_still', `cuts ${a.scene_id}.${a.idx} and ${b.scene_id}.${b.idx} both hold ${a.show} at ${a.framing}; that reads as a freeze, not a cut`);
      }
    }
  }

  // both hosts get the split: speaker and split alternation phase-lock otherwise
  if (s.split.enabled) {
    const splits = cuts.filter((c) => c.mode === 'split');
    if (splits.length >= 4) {
      const byHost = new Map();
      for (const c of splits) byHost.set(c.show || c.speaker, (byHost.get(c.show || c.speaker) || 0) + 1);
      if (byHost.size < 2) fail('split_balance', `all ${splits.length} split cuts put ${[...byHost.keys()][0]} on top; the other host is never the speaker in a split`);
      else {
        const [top, n] = [...byHost].sort((x, y) => y[1] - x[1])[0];
        if (n / splits.length > 0.75 + 1e-9) fail('split_balance', `host ${top} is on top in ${n} of ${splits.length} split cuts (${Math.round((n / splits.length) * 100)}%), over the 75% ceiling`);
      }
    }
  }

  // the framing band measures a dynamic edit; plain and split are declared calm edits
  if (s.multicut) {
    const naked = cuts.filter((c) => !c.framing);
    if (naked.length) {
      fail('framing_declared', `${naked.length} of ${cuts.length} cuts carry no framing`);
      return out;
    }
    for (const c of cuts) {
      const { x, y, w, h } = c.crop || {};
      if (!(x >= 0 && y >= 0 && w > 0 && w <= 1 && h > 0 && h <= 1 && x + w <= 1 + 1e-9 && y + h <= 1 + 1e-9)) {
        fail('framing_crop_in_frame', `cut ${c.scene_id}.${c.idx} framing ${c.framing} crops x=${x} y=${y} w=${w} h=${h}, which leaves the picture`);
      }
    }
    const total = (plan.dialogue_s || 0) + (plan.end_card_s || 0);
    if (!(total > 0)) {
      fail('framing_declared', 'the plan declares no runtime to measure over');
      return out;
    }
    const st = dialogueFramingStats(cuts, total);
    const { per_10s_min: lo, per_10s_max: hi, max_share: cap } = s.bands;
    const per10 = (st.n_framings / total) * 10;
    if (per10 < lo - 1e-9 || per10 > hi + 1e-9) fail('framing_variety_per_10s', `${st.n_framings} distinct framings over ${total.toFixed(2)} s is ${per10.toFixed(2)} per 10 s, outside ${lo} to ${hi}`);
    if (st.biggest_count / cuts.length > cap + 1e-9) fail('framing_biggest_share', `framing ${st.biggest} takes ${st.biggest_count} of ${cuts.length} cuts (${((st.biggest_count / cuts.length) * 100).toFixed(1)}%), over the ${cap * 100}% ceiling`);
    for (let i = 1; i < cuts.length; i++) {
      if (cuts[i - 1].framing === cuts[i].framing) fail('framing_no_repeat_adjacent', `cuts ${cuts[i - 1].scene_id}.${cuts[i - 1].idx} and ${cuts[i].scene_id}.${cuts[i].idx} both use ${cuts[i].framing}`);
    }
  }
  return out;
}

// ---- _lib/panels.mjs ----
// Panel layouts as ffmpeg filter-graph text: two pictures stacked on a seam
// (a split screen), a cover crop that keeps a head in frame, a crop rect per
// panel, a fit-inside with a letterbox, a divider bar on the seam, and the
// join between segments (a hard cut or a dissolve that keeps every cut on its
// span edge). Pure functions: they build strings and never run ffmpeg.
// Bundled into parts; every top-level name starts with `kit` (bundle.mjs).
//
// Used by cut-footage 1.2.0 (split mode, grid cells) and dialogue-cut 1.0.0
// (speaker over listener or product, reframes, seams per cut).
//
// Labels: builders take bare pad names ("top", "1:v", "seg3") and wrap them
// in [ ]. Every builder returns an array of filter chains; join a whole graph
// with ';' and pass it to -filter_complex.
//
// Sizes: every width, height and offset that reaches a crop, pad or vstack
// is even, because a yuv420p plane cut at an odd row is not chroma-aligned.
// Refusals throw KitPanelError (code 'bad_input'); a part turns it into
// ctx.error('bad_input', err.message).
//
// Exports:
//   KitPanelError                                  error with code 'bad_input'
//   kitPanelEven(n)                                nearest even integer, at least 2
//   kitPanelSeamRows(height, seam, {gap_px})       -> {top_h, gap_px, bottom_h, seam_y}
//   kitPanelRect(rect)                             {x,y,w,h} or [x0,y0,x1,y1] -> {x,y,w,h} (checked)
//   kitPanelCrop(rect)                             -> 'crop=...' or '' (full frame)
//   kitPanelCover({src,out,w,h,head,focus_x,zoom,crop})      -> [chain]
//   kitPanelFit({src,out,w,h,bg,crop})             -> [chains]  whole picture inside w x h, letterboxed
//   kitPanelDim({src,out,dim})                     -> [chain]   the dimmed listener look
//   kitPanelVstack({top,bottom,out,width,height,top_h,gap_px,gap_color})   -> [chains]
//   kitPanelSplit({top,bottom,out,width,height,seam,gap_px,gap_color,top_look,bottom_look})  -> {filters, rows}
//   kitPanelDivider({seam_y,px,color,enable})      -> 'drawbox=...' (append to a chain)
//   kitPanelEnable(windows)                        -> "between(t,a,b)+..." or '0'
//   kitPanelJoinLengths(spans, {fps, transition, dissolve_s})  -> {lengths, starts, dissolve_s, total_s}
//   kitPanelJoin({inputs,out,spans,fps,transition,dissolve_s}) -> {filters, lengths, total_s}

/** A refusal from a panel builder: the inputs describe a layout that cannot be drawn. */
class KitPanelError extends Error {
  constructor(message) {
    super(message);
    this.name = 'KitPanelError';
    this.code = 'bad_input';
  }
}

const kitPanelLabelRe = /^[A-Za-z0-9_:.]+$/;
const kitPanelHexRe = /^#[0-9A-Fa-f]{6}$/;

function kitPanelRefuse(message) {
  throw new KitPanelError(message);
}

function kitPanelLabel(name, what) {
  if (typeof name !== 'string' || !kitPanelLabelRe.test(name)) kitPanelRefuse(`${what}: "${name}" is not a pad label (letters, digits, _ : .)`);
  return `[${name}]`;
}

function kitPanelFinite(value, what, lo, hi) {
  if (typeof value !== 'number' || !Number.isFinite(value)) kitPanelRefuse(`${what} must be a number`);
  if (value < lo || value > hi) kitPanelRefuse(`${what} must be between ${lo} and ${hi} (got ${value})`);
  return value;
}

function kitPanelSize(value, what) {
  if (!Number.isInteger(value) || value < 2 || value % 2) kitPanelRefuse(`${what} must be an even whole number of pixels, 2 or more (got ${value})`);
  return value;
}

/** A number for a filter string: fixed precision, no trailing zeros. */
function kitPanelNum(value, digits = 6) {
  return Number(value).toFixed(digits).replace(/\.?0+$/, '') || '0';
}

/** `#RRGGBB` as ffmpeg's 0xRRGGBB, or a refusal. */
function kitPanelColor(hex, what) {
  if (typeof hex !== 'string' || !kitPanelHexRe.test(hex)) kitPanelRefuse(`${what} must be a #RRGGBB colour (got ${JSON.stringify(hex)})`);
  return `0x${hex.slice(1).toUpperCase()}`;
}

/** The nearest even whole number, never below 2. */
function kitPanelEven(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) kitPanelRefuse('a size must be a number');
  return Math.max(2, Math.round(n / 2) * 2);
}

/**
 * The rows of a two-panel stack. `seam` is a ratio of the usable height
 * (0 < seam < 1: 0.62 makes a big top panel) or a pixel row (an integer of 2
 * or more: 768 puts the seam 768 px from the top). A pixel seam is honoured
 * exactly or refused: the gap centres on that row, so seam - gap_px/2 (the top
 * panel's height) must be even. Rows always add up: top_h + gap_px + bottom_h
 * = height. seam_y is the middle of the gap (where a divider bar centres).
 */
function kitPanelSeamRows(height, seam, { gap_px = 0 } = {}) {
  kitPanelSize(height, 'height');
  if (!Number.isInteger(gap_px) || gap_px < 0 || gap_px % 2) kitPanelRefuse(`gap_px must be an even whole number, 0 or more (got ${gap_px})`);
  const usable = height - gap_px;
  if (usable < 4) kitPanelRefuse(`gap_px ${gap_px} leaves no room for two panels in ${height} px`);
  if (typeof seam !== 'number' || !Number.isFinite(seam) || seam <= 0) kitPanelRefuse(`seam must be a ratio between 0 and 1 or a pixel row (got ${seam})`);
  let top;
  if (seam < 1) top = Math.round((usable * seam) / 2) * 2;
  else {
    if (!Number.isInteger(seam)) kitPanelRefuse(`a pixel seam must be a whole number (got ${seam})`);
    if (seam >= height) kitPanelRefuse(`seam row ${seam} is outside the ${height} px frame`);
    // Honoured exactly or refused: the gap centres on the seam row, so the top
    // panel is seam - gap/2 tall, and that height must be even (yuv420p).
    top = seam - gap_px / 2;
    if (top % 2) kitPanelRefuse(`seam row ${seam} with gap_px ${gap_px} makes an odd top panel (${top} px); use an even seam - gap_px/2`);
  }
  if (top < 2 || top > usable - 2) kitPanelRefuse(`seam ${seam} leaves a panel under 2 px (height ${height}, gap ${gap_px})`);
  return { top_h: top, gap_px, bottom_h: usable - top, seam_y: top + gap_px / 2 };
}

/**
 * A normalised crop rect, checked: {x, y, w, h} (fractions of the source) or
 * a box [x0, y0, x1, y1]. Refused when it leaves the frame or is empty.
 */
function kitPanelRect(rect) {
  let r = rect;
  if (Array.isArray(rect)) {
    if (rect.length !== 4) kitPanelRefuse('a crop box is [x0, y0, x1, y1]');
    const [x0, y0, x1, y1] = rect;
    r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  if (!r || typeof r !== 'object') kitPanelRefuse('a crop rect is {x, y, w, h} or [x0, y0, x1, y1]');
  const x = r.x ?? 0;
  const y = r.y ?? 0;
  const w = r.w ?? 1;
  const h = r.h ?? 1;
  for (const [k, v] of Object.entries({ x, y, w, h })) {
    if (typeof v !== 'number' || !Number.isFinite(v)) kitPanelRefuse(`crop ${k} must be a number`);
  }
  if (w <= 0 || h <= 0) kitPanelRefuse(`crop rect is empty (w ${w}, h ${h})`);
  if (x < 0 || y < 0 || x + w > 1 + 1e-6 || y + h > 1 + 1e-6) kitPanelRefuse(`crop rect ${JSON.stringify({ x, y, w, h })} leaves the frame`);
  return { x, y, w: Math.min(w, 1 - x), h: Math.min(h, 1 - y) };
}

/**
 * The crop filter for a normalised rect on the source, every term even, or ''
 * when the rect is the whole frame (or absent).
 */
function kitPanelCrop(rect) {
  if (rect == null) return '';
  const { x, y, w, h } = kitPanelRect(rect);
  if (w >= 0.9999 && h >= 0.9999 && x <= 1e-9 && y <= 1e-9) return '';
  const e = (dim, v) => `2*floor(${dim}*${kitPanelNum(v)}/2)`;
  return `crop=${e('iw', w)}:${e('ih', h)}:${e('iw', x)}:${e('ih', y)}`;
}

/**
 * Scale `src` to cover w x h (times zoom, to push in) and crop it to w x h.
 * `head` is where the crop sits vertically (0 keeps the top, 0.5 centres,
 * 0.30 keeps a talking head in the upper third); `focus_x` the same across.
 * The crop is computed from the source's real size inside ffmpeg (iw, ih),
 * never a hard-coded height. `crop` is an optional source rect applied first
 * (a reframe).
 */
function kitPanelCover({ src, out, w, h, head = 0.5, focus_x = 0.5, zoom = 1, crop = null }) {
  kitPanelSize(w, 'w');
  kitPanelSize(h, 'h');
  kitPanelFinite(head, 'head', 0, 1);
  kitPanelFinite(focus_x, 'focus_x', 0, 1);
  kitPanelFinite(zoom, 'zoom', 1, 2);
  const pre = kitPanelCrop(crop);
  const sw = kitPanelEven(w * zoom);
  const sh = kitPanelEven(h * zoom);
  return [
    `${kitPanelLabel(src, 'src')}${pre ? `${pre},` : ''}scale=${sw}:${sh}:force_original_aspect_ratio=increase:flags=lanczos,` +
      `crop=${w}:${h}:(iw-${w})*${kitPanelNum(focus_x, 4)}:(ih-${h})*${kitPanelNum(head, 4)},setsar=1${kitPanelLabel(out, 'out')}`,
  ];
}

/**
 * The whole picture inside w x h, never cropped (footage with copy in it),
 * on a letterbox: bg '#RRGGBB' pads with that colour; bg 'blur' fills with a
 * darkened, blurred cover of the same frame. `crop` is an optional source
 * rect applied first. (A part that wants 'auto' samples the corner colour and
 * passes it as a hex.)
 */
function kitPanelFit({ src, out, w, h, bg = '#000000', crop = null }) {
  kitPanelSize(w, 'w');
  kitPanelSize(h, 'h');
  const pre = kitPanelCrop(crop);
  const inL = kitPanelLabel(src, 'src');
  const outL = kitPanelLabel(out, 'out');
  const contain = `scale=${w}:${h}:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos`;
  if (bg === 'blur') {
    const base = String(out).replace(/[^A-Za-z0-9_]/g, '_');
    return [
      `${inL}${pre ? `${pre},` : ''}split=2[${base}_bgsrc][${base}_fgsrc]`,
      `[${base}_bgsrc]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},gblur=sigma=30,eq=brightness=-0.15,setsar=1[${base}_bg]`,
      `[${base}_fgsrc]${contain},setsar=1[${base}_fg]`,
      `[${base}_bg][${base}_fg]overlay=(W-w)/2:(H-h)/2,setsar=1${outL}`,
    ];
  }
  const color = kitPanelColor(bg, 'bg');
  return [`${inL}${pre ? `${pre},` : ''}${contain},pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:${color},setsar=1${outL}`];
}

/** The listener look: saturation and brightness pulled down by `dim` (1 = unchanged). */
function kitPanelDim({ src, out, dim }) {
  kitPanelFinite(dim, 'dim', 0, 1);
  if (dim === 1) return [`${kitPanelLabel(src, 'src')}null${kitPanelLabel(out, 'out')}`];
  return [`${kitPanelLabel(src, 'src')}eq=saturation=${kitPanelNum(dim, 3)}:brightness=${kitPanelNum(-(1 - dim) * 0.25, 3)}${kitPanelLabel(out, 'out')}`];
}

/**
 * Stack two panels already sized to width x top_h and width x bottom_h. The
 * gap (gap_color, default black) pads the top panel, and the result is padded
 * or cut to the full frame, so a rounding difference can never change the
 * frame size. The stack ends with the shorter panel.
 */
function kitPanelVstack({ top, bottom, out, width, height, top_h, gap_px = 0, gap_color = '#000000' }) {
  kitPanelSize(width, 'width');
  kitPanelSize(height, 'height');
  kitPanelSize(top_h, 'top_h');
  if (!Number.isInteger(gap_px) || gap_px < 0 || gap_px % 2) kitPanelRefuse(`gap_px must be an even whole number, 0 or more (got ${gap_px})`);
  if (top_h + gap_px > height - 2) kitPanelRefuse(`top_h ${top_h} + gap ${gap_px} leaves no bottom panel in ${height} px`);
  const color = kitPanelColor(gap_color, 'gap_color');
  const base = String(out).replace(/[^A-Za-z0-9_]/g, '_');
  const chains = [];
  let topL = kitPanelLabel(top, 'top');
  if (gap_px) {
    chains.push(`${topL}pad=${width}:${top_h + gap_px}:0:0:${color}[${base}_topg]`);
    topL = `[${base}_topg]`;
  }
  // shortest=1: vstack otherwise runs as long as its LONGER panel, and a panel one
  // frame over pushes every later cut late (the podcast compose measured 0.1 s).
  chains.push(
    `${topL}${kitPanelLabel(bottom, 'bottom')}vstack=inputs=2:shortest=1,` +
      `pad=w=${width}:h='max(ih,${height})':x=0:y=0:color=black,crop=${width}:${height}:0:0,setsar=1${kitPanelLabel(out, 'out')}`,
  );
  return chains;
}

/**
 * A whole split: each source sized into its panel by its own look, then
 * stacked on the seam. A look is {fit: 'cover', head, focus_x, zoom, crop}
 * (the default) or {fit: 'contain', bg, crop}, plus an optional dim (0-1).
 * Returns the chains and the rows (kitPanelSeamRows) so a part can place a
 * divider bar or a caption zone on the seam.
 */
function kitPanelSplit({ top, bottom, out, width, height, seam, gap_px = 0, gap_color = '#000000', top_look = {}, bottom_look = {} }) {
  kitPanelSize(width, 'width');
  const rows = kitPanelSeamRows(height, seam, { gap_px });
  const base = String(out).replace(/[^A-Za-z0-9_]/g, '_');
  const filters = [];
  const panel = (src, look, h, name) => {
    const fit = look.fit ?? 'cover';
    const sized = look.dim != null && look.dim !== 1 ? `${base}_${name}_s` : `${base}_${name}`;
    if (fit === 'cover') {
      filters.push(...kitPanelCover({ src, out: sized, w: width, h, head: look.head ?? 0.5, focus_x: look.focus_x ?? 0.5, zoom: look.zoom ?? 1, crop: look.crop ?? null }));
    } else if (fit === 'contain' || fit === 'width') {
      filters.push(...kitPanelFit({ src, out: sized, w: width, h, bg: look.bg ?? '#000000', crop: look.crop ?? null }));
    } else kitPanelRefuse(`${name} look fit must be cover or contain (got ${JSON.stringify(fit)})`);
    if (sized !== `${base}_${name}`) filters.push(...kitPanelDim({ src: sized, out: `${base}_${name}`, dim: look.dim }));
    return `${base}_${name}`;
  };
  const t = panel(top, top_look, rows.top_h, 'top');
  const b = panel(bottom, bottom_look, rows.bottom_h, 'bottom');
  filters.push(...kitPanelVstack({ top: t, bottom: b, out, width, height, top_h: rows.top_h, gap_px, gap_color }));
  return { filters, rows };
}

/** The ffmpeg enable expression for a list of [start_s, end_s] windows ('0' when there are none). */
function kitPanelEnable(windows) {
  if (!Array.isArray(windows)) kitPanelRefuse('windows must be a list of [start_s, end_s]');
  const parts = [];
  for (const win of windows) {
    if (!Array.isArray(win) || win.length !== 2 || !win.every((v) => typeof v === 'number' && Number.isFinite(v))) kitPanelRefuse('a window is [start_s, end_s]');
    const [s, e] = win;
    if (e <= s) kitPanelRefuse(`window [${s}, ${e}] ends before it starts`);
    parts.push(`between(t,${kitPanelNum(s, 3)},${kitPanelNum(Math.max(s, e - 0.001), 3)})`);
  }
  return parts.join('+') || '0';
}

/**
 * A brand-colour bar centred on the seam row, `px` tall (even), drawn only
 * while `enable` is true (an expression from kitPanelEnable; omit for always).
 * Append it to a chain: `${chain},${kitPanelDivider(...)}`.
 */
function kitPanelDivider({ seam_y, px = 4, color, enable = null }) {
  if (!Number.isInteger(px) || px < 2 || px % 2) kitPanelRefuse(`divider px must be an even whole number, 2 or more (got ${px})`);
  if (!Number.isInteger(seam_y) || seam_y < px / 2) kitPanelRefuse(`divider seam_y must be a whole pixel row of at least ${px / 2} (got ${seam_y})`);
  const c = kitPanelColor(color, 'divider color');
  const when = enable == null ? '' : `:enable='${enable}'`;
  return `drawbox=x=0:y=${seam_y - px / 2}:w=iw:h=${px}:color=${c}@1:t=fill${when}`;
}

/**
 * Frame-exact segment lengths for a join. `spans` are the seconds each
 * segment shows on the timeline; the boundaries are rounded to whole frames
 * from the running total, so rounding never drifts. A dissolve rides on the
 * outgoing segment's tail: every segment but the last is trimmed one dissolve
 * longer, and the incoming segment starts fading in exactly on its span edge,
 * so cut times and the total length match a hard cut.
 */
function kitPanelJoinLengths(spans, { fps = 30, transition = 'cut', dissolve_s = 0 } = {}) {
  if (!Array.isArray(spans) || !spans.length) kitPanelRefuse('a join needs at least one span');
  if (!Number.isInteger(fps) || fps < 1 || fps > 120) kitPanelRefuse(`fps must be a whole number from 1 to 120 (got ${fps})`);
  if (transition !== 'cut' && transition !== 'dissolve') kitPanelRefuse(`transition must be cut or dissolve (got ${JSON.stringify(transition)})`);
  const edges = [0];
  let run = 0;
  for (const [i, s] of spans.entries()) {
    if (typeof s !== 'number' || !Number.isFinite(s) || s <= 0) kitPanelRefuse(`span ${i} must be a positive number of seconds (got ${s})`);
    run += s;
    edges.push(Math.round(run * fps));
  }
  const frames = spans.map((_, i) => edges[i + 1] - edges[i]);
  frames.forEach((f, i) => {
    if (f < 1) kitPanelRefuse(`span ${i} (${spans[i]} s) is shorter than one frame at ${fps} fps`);
  });
  let d = 0;
  if (transition === 'dissolve' && spans.length > 1) {
    if (typeof dissolve_s !== 'number' || !Number.isFinite(dissolve_s) || dissolve_s <= 0) kitPanelRefuse(`a dissolve needs dissolve_s > 0 (got ${dissolve_s})`);
    d = Math.max(1, Math.round(dissolve_s * fps));
    frames.forEach((f, i) => {
      if (f < d) kitPanelRefuse(`span ${i} (${f} frames) is shorter than the ${d}-frame dissolve`);
    });
  }
  const lengths = frames.map((f, i) => (f + (i < frames.length - 1 ? d : 0)) / fps);
  const starts = edges.slice(0, -1).map((e) => e / fps);
  return { lengths, starts, frames, dissolve_s: d / fps, total_s: edges.at(-1) / fps };
}

/**
 * Join segments in order. Each input is set to `fps`, then trimmed to its
 * frame count (kitPanelJoinLengths) and normalised (timebase, yuv420p), so inputs
 * must run at least that long; they must share one frame size. 'cut' is one
 * concat; 'dissolve' is a chain of xfade, each starting on its span edge.
 * Video only: the audio of a compose follows its own timeline.
 */
function kitPanelJoin({ inputs, out, spans, fps = 30, transition = 'cut', dissolve_s = 0 }) {
  if (!Array.isArray(inputs) || !inputs.length) kitPanelRefuse('a join needs at least one input');
  if (!Array.isArray(spans) || spans.length !== inputs.length) kitPanelRefuse(`a join needs one span per input (${inputs.length} inputs, ${Array.isArray(spans) ? spans.length : 0} spans)`);
  const plan = kitPanelJoinLengths(spans, { fps, transition, dissolve_s });
  const base = String(out).replace(/[^A-Za-z0-9_]/g, '_');
  const outL = kitPanelLabel(out, 'out');
  const filters = inputs.map(
    // fps first, then trim by frame count: trimming by seconds before the fps
    // conversion is a frame long or short whenever the source runs at another rate.
    (name, i) =>
      `${kitPanelLabel(name, `inputs[${i}]`)}setpts=PTS-STARTPTS,fps=${fps},trim=end_frame=${Math.round(plan.lengths[i] * fps)},setpts=PTS-STARTPTS,settb=AVTB,format=yuv420p,setsar=1[${base}_j${i}]`,
  );
  if (inputs.length === 1) filters.push(`[${base}_j0]null${outL}`);
  else if (transition === 'cut' || plan.dissolve_s === 0) {
    filters.push(`${inputs.map((_, i) => `[${base}_j${i}]`).join('')}concat=n=${inputs.length}:v=1:a=0${outL}`);
  } else {
    let acc = `[${base}_j0]`;
    for (let i = 1; i < inputs.length; i++) {
      const to = i === inputs.length - 1 ? outL : `[${base}_x${i}]`;
      filters.push(`${acc}[${base}_j${i}]xfade=transition=fade:duration=${kitPanelNum(plan.dissolve_s)}:offset=${kitPanelNum(plan.starts[i])}${to}`);
      acc = to;
    }
  }
  return { filters, lengths: plan.lengths, starts: plan.starts, total_s: plan.total_s };
}

// ---- dialogue-cut/src/render.mjs ----
// dialogue-cut render helpers: the ffmpeg graph for a cut plan from ./plan.mjs,
// the grade, the size rule, the plan choice with its self-checks, and the drift
// check on the rendered file. Pure functions except where named; the part
// (./part.mjs) runs ffmpeg. Top-level names start with `dcut` (bundle.mjs needs
// names unique across the inlined modules).
//
// Time model. The voice track is the clock: the picture is cut over it and the
// audio never moves. A beat runs from its line's start to the next line's start
// (plan.mjs dialogueBeats). A lipsync clip was driven by its line's own audio,
// so its frame 0 sits where that line starts in the voice track (the speech
// entry's start_s, else the span's). Each clip is stretched to its line's
// length when it is within 5% (Veed returns clips 2 to 35 ms short; padding
// them froze the picture at every cut in the recipe), placed at that start, and
// held on its first or last frame for any part of the beat it does not cover
// (the gap after a line). A cut then reads its window of that placed clip.

/** The podcast recipe's operator-approved look: blacks lifted off zero, colour pushed, fine moving grain. */
const DCUT_GRADES = Object.freeze({
  none: null,
  'warm-lift-grain': "curves=all='0/0.055 0.5/0.5 1/0.97',eq=saturation=1.60,noise=alls=5:allf=t+u",
});

/** A finished video may not pass this (the server refuses uploads over 200 MB; §4.12). */
const DCUT_MAX_BYTES = 180 * 1024 * 1024;

/** How far a clip may be stretched to its line before it is left alone (a real mismatch, not rounding). */
const DCUT_MAX_STRETCH = 0.05;

/** How far a speaker change in the render may land from the plan (three frames at 30 fps). */
const DCUT_DRIFT_S = 0.1;

// Self-check ids that the inputs cause (a missing picture), not the edit: no other seed fixes them.
const DCUT_INPUT_CHECKS = new Set(['split_bottom_assets']);

/** The final-encode bitrate cap (§4.12): grain looks 8 Mbps, everything else 16 Mbps. */
function dcutRateCap(grade) {
  return grade && grade !== 'none' ? ['-maxrate', '8M', '-bufsize', '16M'] : ['-maxrate', '16M', '-bufsize', '32M'];
}

/** Bytes the capped encode can reach over `seconds` (video cap plus the AAC track), for the refusal before encoding. */
function dcutProjectedBytes(seconds, grade) {
  const videoBits = grade && grade !== 'none' ? 8e6 : 16e6;
  return Math.ceil((seconds * (videoBits + 256e3)) / 8);
}

/**
 * The setpts factor that stretches a clip of `clipS` to its line of `lineS`,
 * or 1 when they differ by more than DCUT_MAX_STRETCH (left alone and reported).
 */
function dcutClipRatio(clipS, lineS) {
  if (!(clipS > 0) || !(lineS > 0)) return { ratio: 1, stretched: false };
  const r = lineS / clipS;
  if (Math.abs(r - 1) > DCUT_MAX_STRETCH) return { ratio: 1, stretched: false };
  return { ratio: r, stretched: Math.abs(r - 1) > 1e-6 };
}

/**
 * The plan, checked. Tries `seed`, then seed+1 ... seed+tries-1, and keeps the
 * first plan with no self-check problem: a framing band or a balance check
 * that one seed misses is free to fix, and the walk is deterministic, so the
 * same inputs always give the same edit. A problem the inputs cause (no
 * picture for the lower panel) is returned at once, since no seed fixes it.
 * Returns {plan, settings, seed, problems}; problems is [] on a pass, else the
 * first seed's list.
 */
function dcutChoosePlan(beats, hosts, mode, overrides, { products = 0, end_card_s = 0, tries = 12 } = {}) {
  const seed0 = overrides.seed ?? dialogueSettings(mode).seed;
  let first = null;
  for (let k = 0; k < tries; k++) {
    const settings = dialogueSettings(mode, { ...overrides, seed: seed0 + k });
    const plan = dialoguePlan(beats, hosts, settings, { products, end_card_s });
    const problems = dialoguePlanProblems(plan, beats, hosts, settings, { products });
    if (!problems.length) return { plan, settings, seed: seed0 + k, problems: [], tried: k + 1 };
    if (!first) first = { plan, settings, seed: seed0, problems, tried: k + 1 };
    if (problems.some((p) => DCUT_INPUT_CHECKS.has(p.split(':')[0]))) return { ...first, input: true };
  }
  return { ...first, tried: tries };
}

/** The output times of every cut: frame-exact from the running total, so rounding never drifts. */
function dcutCutTimes(cuts, fps) {
  const j = kitPanelJoinLengths(
    cuts.map((c) => c.end_s - c.start_s),
    { fps },
  );
  return { starts: j.starts, lengths: j.lengths, total_s: j.total_s, frames: j.frames };
}

/** Output times where the picture changes from one host to the other (the cut's `show`). */
function dcutSpeakerChanges(cuts, starts) {
  const out = [];
  for (let i = 1; i < cuts.length; i++) if (cuts[i].show !== cuts[i - 1].show) out.push(starts[i]);
  return out;
}

/**
 * Drift: every planned speaker change matched to the nearest change the
 * scene detector saw. A change seen within `window_s` that lands more than
 * `tol_s` away is drift. One not seen at all is not judged (a detector miss on
 * one plate is not drift); the count is returned so the part can log it.
 */
function dcutDrift(planned, seen, { tol_s = DCUT_DRIFT_S, window_s = 0.5 } = {}) {
  let worst = 0;
  let judged = 0;
  const bad = [];
  for (const want of planned) {
    if (!seen.length) break;
    const got = seen.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
    const off = got - want;
    if (Math.abs(off) > window_s) continue;
    judged += 1;
    if (Math.abs(off) > Math.abs(worst)) worst = off;
    if (Math.abs(off) > tol_s + 1e-9) bad.push(`planned ${want.toFixed(2)} s, the picture changed at ${got.toFixed(2)} s (${off >= 0 ? '+' : ''}${off.toFixed(2)} s)`);
  }
  return { judged, unseen: planned.length - judged, worst_s: +worst.toFixed(3), bad };
}

/** Scene-change times from ffmpeg's `select=gt(scene,x),metadata=print` output. */
function dcutSceneTimes(text) {
  const out = [];
  let cur = null;
  for (const line of String(text || '').split('\n')) {
    const t = /pts_time:([0-9.]+)/.exec(line);
    if (t) cur = Number(t[1]);
    else if (cur !== null && /scene_score=/.test(line)) {
      out.push(cur);
      cur = null;
    }
  }
  return out;
}

/** Speech held to the dialogue: entries that start inside it, their ends and words clamped. */
function dcutClampSpeech(speech, untilS) {
  const out = [];
  for (const e of speech || []) {
    if (!(e.start_s < untilS)) continue;
    const x = { ...e, end_s: Math.min(e.end_s, untilS) };
    if (e.words) x.words = e.words.filter((w) => w.start_s < untilS).map((w) => ({ ...w, end_s: Math.min(w.end_s, untilS) }));
    out.push(x);
  }
  return out;
}

/** A safe zone from a picture of ew x eh moved onto w x h the way a cover scale moves it; null when it leaves the frame. */
function dcutMapZone(z, ew, eh, w, h) {
  if (!(ew > 0 && eh > 0)) return null;
  const s = Math.max(w / ew, h / eh);
  const ox = (ew * s - w) / 2;
  const oy = (eh * s - h) / 2;
  const x0 = Math.max(0, z.x * s - ox);
  const y0 = Math.max(0, z.y * s - oy);
  const x1 = Math.min(w, (z.x + z.w) * s - ox);
  const y1 = Math.min(h, (z.y + z.h) * s - oy);
  if (x1 <= x0 || y1 <= y0) return null;
  const r = (v) => Math.round(v);
  return { use: z.use, x: r(x0), y: r(y0), w: r(x1 - x0), h: r(y1 - y0) };
}

/**
 * The whole ffmpeg job for a plan. `src` describes the files:
 *   clips:    Map scene id -> {path, length_s, ratio, line_start_s}
 *   beats:    Map scene id -> beat (start_s, ...)
 *   idle:     Map host -> {path, length_s}
 *   stills:   Map host -> {path}          (a cast picture, for a listener with no clip)
 *   products: [{path}]
 *   voice:    {path}
 *   ending:   {path, frames, has_audio} | null
 * Options: width, height, fps, head (vertical crop bias), grade (a DCUT_GRADES key).
 * Returns {args, graph, times}; args are the input arguments, graph the filter
 * graph whose outputs are [vout] and [aout].
 */
function dcutGraph(plan, src, { width, height, fps, head = 0.25, grade = 'none' }) {
  const cuts = plan.cuts;
  const times = dcutCutTimes(cuts, fps);
  const args = [];
  const graph = [];
  let n = 0;
  const input = (...a) => {
    args.push(...a);
    return n++;
  };
  const margin = 0.5;

  // A clip placed on its beat and read from `start` (beat-local seconds) for `len` seconds.
  const placed = (sceneId, start, len, out) => {
    const c = src.clips.get(sceneId);
    const beat = src.beats.get(sceneId);
    const i = input('-i', c.path);
    const pre = c.line_start_s - beat.start_s;
    const from = pre >= 0 ? start : start - pre;
    const shown = Math.max(0, pre) + c.length_s * c.ratio;
    const tail = Math.max(0, from + len - shown) + 1;
    const pad = `tpad=${pre > 1e-6 ? `start_mode=clone:start_duration=${kitNum(pre)}:` : ''}stop_mode=clone:stop_duration=${kitNum(tail)}`;
    graph.push(
      `[${i}:v]setpts=${kitNum(c.ratio)}*(PTS-STARTPTS),fps=${fps},${pad},` + `trim=start=${kitNum(from)}:duration=${kitNum(len + margin)},setpts=PTS-STARTPTS[${out}]`,
    );
  };
  // A host's idle (listening) clip from `start`, looped as long as it needs.
  const idle = (host, start, len, out) => {
    const c = src.idle.get(host);
    const i = input('-stream_loop', '-1', '-t', kitNum(start + len + 1), '-i', c.path);
    graph.push(`[${i}:v]setpts=PTS-STARTPTS,fps=${fps},trim=start=${kitNum(start)}:duration=${kitNum(len + margin)},setpts=PTS-STARTPTS[${out}]`);
  };
  const still = (path, len, out) => {
    const i = input('-loop', '1', '-framerate', String(fps), '-t', kitNum(len + 1), '-i', path);
    graph.push(`[${i}:v]setpts=PTS-STARTPTS,fps=${fps},format=yuv420p[${out}]`);
  };
  // The listener on their own, for a reaction with no clip of theirs: the idle clip, else their picture.
  const listenerAlone = (host, k, len, out) => {
    const c = src.idle.get(host);
    if (c) {
      const span = Math.max(0, c.length_s - len);
      return idle(host, span > 0.05 ? +((k * 1.73) % span).toFixed(3) : 0, len, out);
    }
    return still(src.stills.get(host).path, len, out);
  };

  const segs = [];
  cuts.forEach((c, k) => {
    const len = times.lengths[k];
    const beat = src.beats.get(c.scene_id);
    // The speaker reads the window that lines up with the voice: the cut's real output start, not the planned one.
    const own = times.starts[k] - beat.start_s;
    const raw = `c${k}`;
    if (c.mode === 'single') placed(c.clip_scene, own, len, raw);
    else if (c.mode === 'reaction') {
      if (c.clip_scene) placed(c.clip_scene, c.src_start_s, len, raw);
      else listenerAlone(c.show, k, len, raw);
    } else if (c.mode === 'split') {
      placed(c.clip_scene, own, len, `${raw}t`);
      const low = `${raw}b`;
      let lowHead = head;
      if (c.bottom === 'product') {
        still(src.products[c.product].path, len, low);
        lowHead = 0.5;
      } else if (c.listener_source === 'idle') idle(c.listener, c.bottom_start_s || 0, len, low);
      else placed(c.listener_clip_scene, c.bottom_start_s || 0, len, low);
      const { filters } = kitPanelSplit({ top: `${raw}t`, bottom: low, out: `s${k}`, width, height, seam: c.seam, top_look: { head, crop: c.crop }, bottom_look: { head: lowHead } });
      graph.push(...filters);
      segs.push(`s${k}`);
      return;
    } else throw new Error(`dialogue-cut: cut ${k} has no mode a render knows (${c.mode})`);
    graph.push(...kitPanelCover({ src: raw, out: `s${k}`, w: width, h: height, head, crop: c.crop }));
    segs.push(`s${k}`);
  });

  const join = kitPanelJoin({ inputs: segs, out: 'body', spans: cuts.map((c) => c.end_s - c.start_s), fps });
  graph.push(...join.filters);
  const look = DCUT_GRADES[grade] || null;
  graph.push(`[body]${look ? `${look},` : ''}format=yuv420p,setsar=1[bodyg]`);

  const dialogue = times.total_s;
  const vi = input('-i', src.voice.path);
  const aformat = 'aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
  graph.push(`[${vi}:a]${aformat},apad,atrim=0:${kitNum(dialogue)},asetpts=PTS-STARTPTS[adlg]`);

  let total = dialogue;
  if (src.ending) {
    const e = src.ending;
    const ei = input('-i', e.path);
    const es = e.frames / fps;
    total += es;
    graph.push(
      `[${ei}:v]setpts=PTS-STARTPTS,fps=${fps},scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,` +
        `tpad=stop_mode=clone:stop_duration=1,trim=end_frame=${e.frames},setpts=PTS-STARTPTS,settb=AVTB,format=yuv420p[endv]`,
    );
    graph.push(
      e.has_audio
        ? `[${ei}:a]${aformat},apad,atrim=0:${kitNum(es)},asetpts=PTS-STARTPTS[aend]`
        : `anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${kitNum(es)},asetpts=PTS-STARTPTS[aend]`,
    );
    graph.push('[bodyg][endv]concat=n=2:v=1:a=0[vout]');
    graph.push('[adlg][aend]concat=n=2:v=0:a=1[aout]');
  } else {
    graph.push('[bodyg]null[vout]');
    graph.push('[adlg]anull[aout]');
  }
  return { args, graph, times, dialogue_s: dialogue, total_s: total };
}

// ---- dialogue-cut/src/part.mjs ----
// dialogue-cut: the free, seeded picture edit over a two-host dialogue whose
// audio is already made. A port of the podcast recipe's plan_cuts.py (the
// planner, ./plan.mjs) and compose_master.py (this file and ./render.mjs):
// one lipsync clip per line, re-cut over the fixed voice track as plain (one
// picture per line), split (the speaker over the idle listener, with a
// full-frame payoff) or dynamic (cuts inside a line, listener reactions,
// reframes, splits with moving seams and a product panel). Then an optional
// grade, the end card, and the size rule.
//
// The edit is checked twice: the plan's self-checks before anything is drawn
// (tiling, cut floor and ceiling, the speaker full frame only from its own
// clip, two hosts per split, split balance, the framing band), and drift on
// the rendered file (every speaker change within 0.10 s of the plan).

const dcutMb = (n) => Math.round(n / (1024 * 1024));

/** A scene's id the way the voice and lipsync parts name it. */
function dcutSceneId(scene, index) {
  return scene.id == null ? String(index + 1) : String(scene.id);
}

/** The two hosts: the cast's keys when a cast is given, else the speakers in the order they first speak. */
function dcutHosts(inputs, scenes, ctx) {
  if (inputs.cast && inputs.cast.length) {
    if (inputs.cast.length !== 2) throw ctx.error('bad_input', `dialogue-cut cuts between exactly two hosts; the cast has ${inputs.cast.length}`);
    return inputs.cast.map((m) => m.key);
  }
  const seen = [];
  for (const s of scenes) if (typeof s.line === 'string' && s.line.trim() && s.speaker != null && !seen.includes(String(s.speaker))) seen.push(String(s.speaker));
  if (seen.length !== 2) throw ctx.error('bad_input', `dialogue-cut cuts between exactly two hosts; the lines have ${seen.length} speaker${seen.length === 1 ? '' : 's'} (${seen.join(', ') || 'none'}). Pass the cast to name a host who does not speak.`);
  return seen;
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const width = inputs.width ?? 1080;
  const height = inputs.height ?? 1920;
  const fps = inputs.fps ?? 30;
  const head = inputs.head ?? 0.25;
  const grade = inputs.grade ?? 'none';
  const mode = inputs.mode ?? 'plain';
  if (width % 2 || height % 2) throw ctx.error('bad_input', 'width and height must be even');

  const scenes = inputs.scenes.map((s, i) => ({ ...s, id: dcutSceneId(s, i), speaker: s.speaker == null ? s.speaker : String(s.speaker) }));
  const hosts = dcutHosts(inputs, scenes, ctx);
  const voiceS = await kitMediaLength(ctx, inputs.voice);

  let beats;
  try {
    ({ beats } = dialogueBeats(scenes, inputs.spans, hosts, { seconds: voiceS }));
  } catch (e) {
    if (e.code === 'bad_input') throw ctx.error('bad_input', e.message);
    throw e;
  }

  // Every spoken line needs its own lipsync clip.
  const clipById = new Map(inputs.clips.map((c) => [c.id, c]));
  for (const b of beats) if (!clipById.has(b.id)) throw ctx.error('bad_input', `scene ${b.id} has a line but no clip in clips (the lipsync step's clips, matched by scene id)`);
  const idleByKey = new Map((inputs.idle || []).map((c) => [c.key, c]));
  const castByKey = new Map((inputs.cast || []).map((m) => [m.key, m]));
  const products = (inputs.products || []).filter((p) => p.images && p.images.length);

  // Planner settings from the inputs a style may pass; the rest are the mode's.
  const overrides = {};
  for (const k of ['seed', 'seams', 'bottom_sources', 'payoff', 'listener_source']) if (inputs[k] !== undefined) overrides[k] = inputs[k];
  if (inputs.crops) overrides.crops = inputs.crops;
  const idleLengths = [];
  for (const h of hosts) {
    const c = idleByKey.get(h);
    if (c) idleLengths.push(await kitMediaLength(ctx, c.video));
  }
  if (idleLengths.length) overrides.idle_seconds = Math.min(...idleLengths);

  // The end card's length counts in the runtime the framing rate is measured over.
  const ending = inputs.ending || null;
  let endingFrames = 0;
  let endingAudio = false;
  if (ending) {
    endingFrames = Math.round((await kitMediaLength(ctx, ending)) * fps);
    if (endingFrames < 1) throw ctx.error('bad_input', 'the end card is shorter than one frame');
    endingAudio = !!(await ctx.tools.probe(ending.path)).has_audio;
  }

  let chosen;
  try {
    chosen = dcutChoosePlan(beats, hosts, mode, overrides, { products: products.length, end_card_s: endingFrames / fps });
  } catch (e) {
    if (e.code === 'bad_input') throw ctx.error('bad_input', e.message);
    throw e;
  }
  if (chosen.problems.length) {
    const list = chosen.problems.slice(0, 4).join('; ');
    if (chosen.input) throw ctx.error('bad_input', `the ${mode} edit needs a picture it was not given: ${list}`);
    throw ctx.error('output_invalid', `no ${mode} edit of these lines passes the cut checks (seeds ${chosen.seed} to ${chosen.seed + chosen.tried - 1}): ${list}`);
  }
  const { plan, seed } = chosen;
  if (chosen.tried > 1) ctx.log.info('the first seed missed a cut check; a later seed passed', { seed, tried: chosen.tried });

  // What each cut needs, refused before anything is drawn.
  for (const c of plan.cuts) {
    const lonely = (c.mode === 'reaction' && !c.clip_scene) || (c.mode === 'split' && c.bottom !== 'product' && c.listener_source === 'idle');
    const who = c.mode === 'split' ? c.listener : c.show;
    if (lonely && !idleByKey.has(who) && !(c.mode === 'reaction' && castByKey.get(who)?.image)) {
      throw ctx.error(
        'bad_input',
        c.mode === 'split'
          ? `the ${mode} edit shows ${who} listening under the speaker, which needs ${who}'s idle clip (the lipsync step's idle, idle_seconds > 0) or listener_source clip`
          : `the ${mode} edit cuts to ${who} listening, and ${who} speaks no line: pass ${who}'s idle clip or a cast picture`,
      );
    }
  }

  // Clips placed on the voice: each stretched to its line when it is a hair off, never more than 5%.
  const lineOf = new Map((inputs.speech || []).filter((e) => e.scene_id != null).map((e) => [e.scene_id, e]));
  const spanOf = new Map(inputs.spans.map((s) => [s.id, s]));
  const clips = new Map();
  for (const b of beats) {
    const c = clipById.get(b.id);
    const length = await kitMediaLength(ctx, c.video);
    const line = lineOf.get(b.id);
    const lineStart = line ? line.start_s : spanOf.get(b.id).start_s;
    const { ratio, stretched } = dcutClipRatio(length, line ? line.end_s - line.start_s : length);
    if (line && !stretched && ratio === 1 && Math.abs(length - (line.end_s - line.start_s)) > 0.05 * length) {
      ctx.log.warn('a lipsync clip is too far from its line to retime; it plays at its own speed', { scene: b.id, clip_s: length, line_s: line.end_s - line.start_s });
    }
    clips.set(b.id, { path: c.video.path, length_s: length, ratio, line_start_s: lineStart });
  }
  const idle = new Map();
  for (const [k, c] of idleByKey) idle.set(k, { path: c.video.path, length_s: await kitMediaLength(ctx, c.video) });
  const stills = new Map([...castByKey].filter(([, m]) => m.image).map(([k, m]) => [k, { path: m.image.path }]));

  const job = dcutGraph(
    plan,
    {
      clips,
      beats: new Map(beats.map((b) => [b.id, b])),
      idle,
      stills,
      products: products.map((p) => ({ path: p.images[0].path })),
      voice: { path: inputs.voice.path },
      ending: ending ? { path: ending.path, frames: endingFrames, has_audio: endingAudio } : null,
    },
    { width, height, fps, head, grade },
  );
  // The rate cap bounds the file, but CRF usually lands far under it: only the encoded size decides (below).
  if (dcutProjectedBytes(job.total_s, grade) > DCUT_MAX_BYTES) {
    ctx.log.warn('at the rate cap this cut could pass the size limit; the encoded file is checked', { seconds: kitNum(job.total_s, 1), cap_mb: dcutMb(dcutProjectedBytes(job.total_s, grade)), limit_mb: dcutMb(DCUT_MAX_BYTES) });
  }

  await kitFfmpeg(ctx, [
    ...job.args,
    '-filter_complex',
    job.graph.join(';'),
    '-map',
    '[vout]',
    '-map',
    '[aout]',
    ...ctx.tools.encodeArgs('aac'),
    ...ctx.tools.encodeArgs('h264-master'),
    ...dcutRateCap(grade),
    '-r',
    String(fps),
    join(ctx.workDir, 'dialogue.mp4'),
  ]);
  const video = await ctx.file('dialogue.mp4', 'video');
  if (video.bytes > DCUT_MAX_BYTES) {
    throw ctx.error('output_invalid', `the cut is ${dcutMb(video.bytes)} MB, over the ${dcutMb(DCUT_MAX_BYTES)} MB a finished video may be; shorten the dialogue or drop the grain look`);
  }

  // Drift: the file is as long as the plan, and every speaker change lands where the plan put it.
  const got = await ctx.tools.probe(video.path);
  if (!Number.isFinite(got.duration_s) || Math.abs(got.duration_s - job.total_s) > DCUT_DRIFT_S) {
    throw ctx.error('output_invalid', `the cut is ${got.duration_s} s, the plan ${kitNum(job.total_s, 3)} s`);
  }
  const planned = dcutSpeakerChanges(plan.cuts, job.times.starts);
  if (planned.length) {
    const { stdout, stderr } = await kitFfmpeg(ctx, ['-i', video.path, '-t', kitNum(job.dialogue_s), '-an', '-vf', "scale=180:320,select='gt(scene,0.2)',metadata=print:file=-", '-f', 'null', '-']);
    const drift = dcutDrift(planned, dcutSceneTimes(`${stdout || ''}\n${stderr || ''}`));
    ctx.log.info('speaker changes checked against the render', { planned: planned.length, judged: drift.judged, unseen: drift.unseen, worst_s: drift.worst_s });
    if (drift.bad.length) throw ctx.error('output_invalid', `the picture does not land where the plan put it: ${drift.bad.slice(0, 4).join('; ')}`);
  }

  // The timeline: one scene per spoken line on its real cut times, the speech, the end card and its logo box.
  const seconds = +job.total_s.toFixed(3);
  const dlg = +job.dialogue_s.toFixed(3);
  const firstCut = new Map();
  plan.cuts.forEach((c, k) => {
    if (!firstCut.has(c.scene_id)) firstCut.set(c.scene_id, k);
  });
  const sceneRows = beats.map((b, i) => ({
    id: b.id,
    start_s: +job.times.starts[firstCut.get(b.id)].toFixed(3),
    end_s: i + 1 < beats.length ? +job.times.starts[firstCut.get(beats[i + 1].id)].toFixed(3) : dlg,
  }));
  const timeline = { duration_s: seconds, width, height, fps, scenes: sceneRows, speech: dcutClampSpeech(inputs.speech, dlg) };
  if (ending) {
    timeline.end_card = { start_s: dlg, end_s: seconds };
    const et = inputs.ending_timeline;
    const logo = et && (et.safe_zones || []).find((z) => z.use === 'logo');
    const moved = logo ? dcutMapZone(logo, et.width, et.height, width, height) : null;
    if (moved) timeline.safe_zones = [moved];
  }
  const cuts = plan.cuts.map((c, k) => ({
    scene_id: c.scene_id,
    start_s: +job.times.starts[k].toFixed(3),
    end_s: +(job.times.starts[k] + job.times.lengths[k]).toFixed(3),
    mode: c.mode,
    show: c.show,
    framing: c.framing ?? null,
  }));
  return kitCheckOutputs(ctx, manifest, { video, seconds, timeline, cuts, seed });
}
