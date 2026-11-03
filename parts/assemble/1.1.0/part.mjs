// Built from assemble/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- assemble/src/cuts.mjs ----
// assemble's pure helpers: where each cut starts and ends when the cut follows a voice or song
// (spans), how a safe zone moves when a picture is scaled onto the cut, the grade presets and the
// final-encode size rule. No ffmpeg here, so the tests can check the arithmetic directly.
// Every top-level name starts with `assemble` (bundled modules share one namespace).

/** The largest finished cut the part hands on: the line refuses uploads over 200 MB. */
const ASSEMBLE_MAX_BYTES = 180 * 1024 * 1024;

/** The shortest picture a voiced scene keeps when silent scenes take fixed time from it. */
const ASSEMBLE_MIN_VOICED_S = 0.4;

const assembleGrainGrades = new Set(['phone-grain', 'phonecam']);

/**
 * The bitrate cap for the final encode (GOOSE-4015 size rule): grain looks 8 Mbps, everything else
 * 16 Mbps. CRF 18 on temporal grain runs near 50 Mbps, which passes the upload limit in 30 s.
 */
function assembleRateCap(grade) {
  return assembleGrainGrades.has(grade) ? ['-maxrate', '8M', '-bufsize', '16M'] : ['-maxrate', '16M', '-bufsize', '32M'];
}

/**
 * The filter chain a grade adds to each body cut (never to the end card), or '' for none.
 * phone-grain: a slight contrast lift, a little less colour, light denoise, then fine moving grain.
 * phonecam: down to a 720 short side, moving grain, back up: a phone camera's softness.
 */
function assembleGradeChain(grade, w, h) {
  if (grade === 'phone-grain') return 'eq=contrast=1.06:saturation=0.93,hqdn3d=1.5:1.5:3:3,noise=alls=9:allf=t+u';
  if (grade === 'phonecam') {
    const short = Math.min(w, h);
    if (short <= 720) return 'noise=alls=8:allf=t';
    const k = 720 / short;
    const even = (v) => Math.max(2, Math.round((v * k) / 2) * 2);
    return `scale=${even(w)}:${even(h)}:flags=bicubic,noise=alls=8:allf=t,scale=${w}:${h}:flags=bicubic,setsar=1`;
  }
  return '';
}

/** Scales a picture to w x h: cover crops to fill, contain pads with `background`. Square pixels. */
function assembleFit(w, h, fit, background) {
  const square = "scale='trunc(iw*sar/2)*2':'trunc(ih/2)*2'";
  if (fit === 'contain') {
    return `${square},scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=${background},setsar=1`;
  }
  return `${square},scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1`;
}

/**
 * A still with a slow centred push from 1.0 to `to` over its `frames`: fitted at twice the size first,
 * so the zoom never resamples the edges and the steps stay under half a pixel.
 */
function assembleKenBurns(w, h, fps, frames, to, fit, background) {
  const last = Math.max(1, frames - 1);
  const step = (to - 1) / last;
  const z = `'min(1+${step.toFixed(8)}*on,${to})'`;
  return `fps=${fps},${assembleFit(w * 2, h * 2, fit, background)},zoompan=z=${z}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${w}x${h}:fps=${fps},setsar=1`;
}

/**
 * A safe zone drawn on a sw x sh picture, moved onto the w x h cut the way `fit` scales it (centred).
 * Null when less than 4 px of it is left on the cut.
 */
function assembleMapZone(zone, sw, sh, w, h, fit) {
  if (!zone || !(sw > 0 && sh > 0)) return null;
  const k = fit === 'contain' ? Math.min(w / sw, h / sh) : Math.max(w / sw, h / sh);
  const [ox, oy] = [(sw * k - w) / 2, (sh * k - h) / 2];
  const x0 = Math.max(0, Math.floor(zone.x * k - ox));
  const y0 = Math.max(0, Math.floor(zone.y * k - oy));
  const x1 = Math.min(w, Math.ceil((zone.x + zone.w) * k - ox));
  const y1 = Math.min(h, Math.ceil((zone.y + zone.h) * k - oy));
  return x1 - x0 >= 4 && y1 - y0 >= 4 ? { use: zone.use, x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

/** Speech entries and words that start before `total`, with ends held to it. */
function assembleClampSpeech(speech, total) {
  const end = (v) => Math.min(v, total);
  return (speech || [])
    .filter((s) => s.start_s < total)
    .map((s) => {
      const out = { ...s, end_s: end(s.end_s) };
      if (Array.isArray(s.words)) out.words = s.words.filter((wd) => wd.start_s < total).map((wd) => ({ ...wd, end_s: end(wd.end_s) }));
      return out;
    });
}

/** Scenes that start before `total`, with ends held to it. */
function assembleClampScenes(scenes, total) {
  return (scenes || []).filter((s) => s.start_s < total).map((s) => ({ ...s, end_s: Math.min(s.end_s, total) }));
}

class AssembleCutProblem extends Error {}

/** True when `e` is a refusal from assembleSpanCuts (the part turns it into bad_input). */
function assembleIsCutProblem(e) {
  return e instanceof AssembleCutProblem;
}

function assembleNo(message) {
  return new AssembleCutProblem(message);
}

/**
 * Where every cut goes when the pictures follow a voice or a song.
 *
 * - A clip whose id has a span starts on the frame at or before its span's start (so a cut never lands
 *   inside the line's first word) and runs to the next voiced clip's start. The first starts at 0; the last
 *   runs to its span's end plus `tail_s`.
 * - A clip with no span (a scene with no line) is silent. `share_previous` splits the voiced clip's
 *   time evenly with the silent clips after it (silent clips before the first voiced one share with it);
 *   `fixed` gives each silent clip `seconds`, taken from the voiced clip it shares with.
 * - `card.fills = 'last_span'`: the end card takes the last span's place, from its start to its end plus
 *   `tail_s`, and never shorter than the card itself. A clip with the card's id is not used.
 *   `'after'`: the card follows the last cut.
 *
 * @param {Array<{id?: string}>} clips  in plan order
 * @param {Array<{id: string, start_s: number, end_s: number}>} spans
 * `until_s` (optional) holds the last cut to at least that time (a dropped card span's end plus tail).
 *
 * @param {{fps: number, tail_s: number, silent: {mode: string, seconds?: number}, card: null | {fills: string, frames: number}, until_s?: number}} options
 * @returns {{cuts: Array<{index: number, id: string, start_f: number, frames: number, voiced: boolean}>,
 *            card: null | {id: string | null, start_f: number, frames: number}, total_f: number}}
 */
function assembleSpanCuts(clips, spans, { fps, tail_s, silent, card, until_s }) {
  const at = (s) => Math.floor(s * fps + 1e-6);
  const byId = new Map();
  for (const s of spans) {
    if (byId.has(s.id)) throw assembleNo(`spans name scene "${s.id}" twice`);
    if (s.end_s < s.start_s) throw assembleNo(`span "${s.id}" ends before it starts`);
    byId.set(s.id, s);
  }
  const seen = new Set();
  clips.forEach((c, k) => {
    if (typeof c.id !== 'string' || !c.id) throw assembleNo(`clips[${k}] needs an id to be matched to a span`);
    if (seen.has(c.id)) throw assembleNo(`two clips have the id "${c.id}"`);
    seen.add(c.id);
  });

  // The end card's span: the latest span, when the card fills it.
  let cardSpan = null;
  if (card && card.fills === 'last_span') {
    cardSpan = spans.reduce((a, b) => (b.start_s > a.start_s ? b : a));
    const k = clips.findIndex((c) => c.id === cardSpan.id);
    if (k >= 0 && k < clips.length - 1) {
      throw assembleNo(`scene "${cardSpan.id}" is the end card's (the last span), but clips come after it`);
    }
  }
  const body = clips.map((c, index) => ({ index, id: c.id, span: byId.get(c.id) })).filter((c) => !cardSpan || c.id !== cardSpan.id);
  const voiced = body.filter((c) => c.span);
  if (!voiced.length) throw assembleNo('no clip matches a span: the clip ids must be the scene ids the spans name');
  for (const s of spans) {
    if (s === cardSpan) continue;
    if (!body.some((c) => c.id === s.id)) throw assembleNo(`span "${s.id}" has no clip`);
  }
  for (let i = 1; i < voiced.length; i++) {
    if (at(voiced[i].span.start_s) <= at(voiced[i - 1].span.start_s)) {
      throw assembleNo(`scene "${voiced[i].id}" starts at or before scene "${voiced[i - 1].id}": the clips must be in the spans' order and at least a frame apart`);
    }
  }
  const lastVoiced = voiced[voiced.length - 1];
  let bodyEnd;
  if (cardSpan) {
    bodyEnd = at(cardSpan.start_s);
    if (bodyEnd <= at(lastVoiced.span.start_s)) throw assembleNo(`the end card's scene "${cardSpan.id}" starts before scene "${lastVoiced.id}"`);
  } else {
    bodyEnd = Math.round((Math.max(lastVoiced.span.end_s + tail_s, until_s || 0)) * fps);
    if (bodyEnd <= at(lastVoiced.span.start_s)) bodyEnd = at(lastVoiced.span.start_s) + 1;
  }

  // Groups: one voiced clip with the silent clips after it; silent clips before the first voiced one join it.
  const groups = [];
  const lead = [];
  for (const c of body) {
    if (c.span) groups.push({ voiced: c, members: groups.length ? [c] : [...lead, c] });
    else if (groups.length) groups[groups.length - 1].members.push(c);
    else lead.push(c);
  }
  const mode = (silent && silent.mode) || 'share_previous';
  const fixedFrames = Math.max(1, Math.round(((silent && silent.seconds) || 1) * fps));
  const cuts = [];
  groups.forEach((g, gi) => {
    const start = gi === 0 ? 0 : at(g.voiced.span.start_s);
    const end = gi + 1 < groups.length ? at(groups[gi + 1].voiced.span.start_s) : bodyEnd;
    const total = end - start;
    const n = g.members.length;
    let lengths;
    if (n === 1) lengths = [total];
    else if (mode === 'fixed') {
      const keep = total - fixedFrames * (n - 1);
      const floor = Math.round(ASSEMBLE_MIN_VOICED_S * fps);
      if (keep < floor) {
        throw assembleNo(`scene "${g.voiced.id}" would keep ${(keep / fps).toFixed(2)} s after ${n - 1} silent scene(s) take ${(fixedFrames / fps).toFixed(2)} s each; it needs at least ${ASSEMBLE_MIN_VOICED_S} s`);
      }
      lengths = g.members.map((m) => (m === g.voiced ? keep : fixedFrames));
    } else {
      if (total < n) throw assembleNo(`scene "${g.voiced.id}" is too short to share with ${n - 1} silent scene(s)`);
      const base = Math.floor(total / n);
      const extra = total - base * n;
      lengths = g.members.map((_, i) => base + (i < extra ? 1 : 0));
    }
    let f = start;
    g.members.forEach((m, i) => {
      cuts.push({ index: m.index, id: m.id, start_f: f, frames: lengths[i], voiced: m === g.voiced });
      f += lengths[i];
    });
  });

  let cardCut = null;
  if (card) {
    if (cardSpan) {
      const want = Math.round((cardSpan.end_s + tail_s) * fps) - bodyEnd;
      cardCut = { id: cardSpan.id, start_f: bodyEnd, frames: Math.max(want, card.frames) };
    } else cardCut = { id: null, start_f: bodyEnd, frames: card.frames };
  }
  return { cuts, card: cardCut, total_f: bodyEnd + (cardCut ? cardCut.frames : 0) };
}

// ---- assemble/src/part.mjs ----
// assemble: joins scene clips and stills into one cut, in order. Today's
// stitch-videos-ffmpeg montage assembler: every cut is scaled to one size
// (cover crops to fill, contain pads), one frame rate, square pixels and
// yuv420p, held on its last frame when a hair short, cut to an exact frame
// count, and hard-cut through the concat filter (never the concat demuxer,
// which drops audio and adds black frames at joins). Captions and loudness
// are the layers' jobs, not this step's.
//
// 1.1.0 adds, all optional: pictures timed to a voice or song (spans, silent,
// tail_s), the voice's speech or a whole timeline passed through, an end card
// joined after the cut or over the last span, a slow push on stills, two grain
// looks, and the size rule: a bitrate cap on the final encode and a refusal
// of any cut over 180 MB.

const SHORT_TOLERANCE_S = 0.1;

const t3 = (frames, fps) => +(frames / fps).toFixed(3);

/** The cuts as 1.0.2 makes them: each clip's own in_s and seconds, a still needing seconds. */
async function listedCuts(inputs, ctx, fps) {
  const cuts = [];
  let at = 0;
  for (const [k, clip] of inputs.clips.entries()) {
    const media = clip.video || clip.image;
    const start = clip.in_s ?? 0;
    let seconds;
    if (clip.image) {
      if (!clip.seconds) throw ctx.error('bad_input', `clips[${k}] is a still and needs seconds`);
      seconds = clip.seconds;
    } else {
      const length = await kitMediaLength(ctx, media);
      seconds = clip.seconds ?? length - start;
      if (start + seconds > length + SHORT_TOLERANCE_S) {
        throw ctx.error('bad_input', `clips[${k}] needs ${kitNum(start + seconds, 2)}s of a ${kitNum(length, 2)}s clip`);
      }
    }
    const frames = Math.round(seconds * fps);
    if (frames < 1) throw ctx.error('bad_input', `clips[${k}] is shorter than one frame`);
    cuts.push({ index: k, id: clip.id ?? String(k + 1), start_f: at, frames, hold_s: 0 });
    at += frames;
  }
  return { cuts, total_f: at };
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { width: w, height: h } = inputs;
  const fps = inputs.fps ?? 30;
  const fit = inputs.fit ?? 'cover';
  const background = inputs.background ?? 'black';
  if (w % 2 || h % 2) throw ctx.error('bad_input', 'width and height must be even');
  const keepAudio = inputs.clip_audio === 'keep';
  const grade = inputs.grade ?? 'none';
  const kenBurns = !!inputs.motion && inputs.motion.stills === 'ken_burns';
  const zoomTo = (inputs.motion && inputs.motion.to) ?? 1.05;
  const fills = inputs.ending_fills ?? 'after';
  const tail = inputs.tail_s ?? 0.25;
  for (const [k, clip] of inputs.clips.entries()) {
    if (!!clip.video === !!clip.image) throw ctx.error('bad_input', `clips[${k}] needs exactly one of video or image`);
  }
  if (fills === 'last_span' && inputs.ending && !inputs.spans) throw ctx.error('bad_input', 'ending_fills last_span needs spans: the card takes the last span\'s place');

  const ending = inputs.ending || null;
  const endingSeconds = ending ? await kitMediaLength(ctx, ending) : 0;
  const endingFrames = ending ? Math.round(endingSeconds * fps) : 0;
  if (ending && endingFrames < 1) throw ctx.error('bad_input', 'the end card is shorter than one frame');

  // Where every cut goes.
  let plan;
  if (inputs.spans) {
    let spans = inputs.spans;
    let until = 0;
    if (fills === 'last_span' && !ending) {
      // No card was drawn (an end-card step can return nothing): a card scene with no clip is held over by the cut before it.
      const latest = spans.reduce((a, b) => (b.start_s > a.start_s ? b : a));
      if (!inputs.clips.some((c) => c.id === latest.id)) {
        spans = spans.filter((s) => s !== latest);
        until = latest.end_s + tail;
        ctx.log.info('no end card: the last span is held by the cut before it', { scene: latest.id });
      }
    }
    try {
      plan = assembleSpanCuts(inputs.clips, spans, {
        fps,
        tail_s: tail,
        silent: inputs.silent,
        card: ending ? { fills, frames: endingFrames } : null,
        until_s: until,
      });
    } catch (e) {
      if (assembleIsCutProblem(e)) throw ctx.error('bad_input', e.message);
      throw e;
    }
    // A clip shorter than its cut holds its last frame; one that starts past its own end is refused.
    for (const cut of plan.cuts) {
      const clip = inputs.clips[cut.index];
      cut.hold_s = 0;
      if (clip.video) {
        const length = await kitMediaLength(ctx, clip.video);
        const avail = length - (clip.in_s ?? 0);
        if (avail <= 0) throw ctx.error('bad_input', `clips[${cut.index}] starts at ${kitNum(clip.in_s, 2)}s of a ${kitNum(length, 2)}s clip`);
        cut.hold_s = Math.max(0, cut.frames / fps - avail);
      }
    }
  } else {
    plan = await listedCuts(inputs, ctx, fps);
    if (ending) plan.card = { id: null, start_f: plan.total_f, frames: endingFrames };
    if (ending) plan.total_f += endingFrames;
  }
  if (plan.card) plan.card.hold_s = Math.max(0, plan.card.frames / fps - endingSeconds);

  // One input and one chain per cut, then the end card, joined by the concat filter.
  const gradeChain = assembleGradeChain(grade, w, h);
  const args = [];
  const graph = [];
  const pieces = plan.cuts.map((cut) => ({ ...cut, clip: inputs.clips[cut.index], body: true }));
  if (plan.card) pieces.push({ ...plan.card, clip: { video: ending }, body: false });
  for (const [k, p] of pieces.entries()) {
    const media = p.clip.video || p.clip.image;
    const exact = p.frames / fps;
    if (p.clip.image) args.push('-loop', '1', '-framerate', String(fps), '-t', kitNum(exact + 2 / fps), '-i', media.path);
    else args.push('-ss', kitNum(p.clip.in_s ?? 0), '-t', kitNum(exact + 0.5), '-i', media.path);
    const look = p.clip.image && kenBurns ? assembleKenBurns(w, h, fps, p.frames, zoomTo, fit, background) : `fps=${fps},${assembleFit(w, h, fit, background)}`;
    const finish = p.body && gradeChain ? `,${gradeChain}` : '';
    graph.push(
      `[${k}:v]${look},tpad=stop_mode=clone:stop_duration=${kitNum(p.hold_s + SHORT_TOLERANCE_S + 2 / fps, 4)},` +
        `trim=end_frame=${p.frames},setpts=PTS-STARTPTS${finish},format=yuv420p[v${k}]`,
    );
    if (keepAudio) {
      // The end card is always silent (music and room tone are the mix layer's), even when its file has sound.
      const info = p.body && p.clip.video ? await ctx.tools.probe(media.path) : { has_audio: false };
      graph.push(
        info.has_audio
          ? `[${k}:a]aresample=48000:async=1:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,apad,atrim=0:${kitNum(exact)},asetpts=PTS-STARTPTS[a${k}]`
          : `anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${kitNum(exact)},asetpts=PTS-STARTPTS[a${k}]`,
      );
    }
  }
  const pads = pieces.map((_, k) => (keepAudio ? `[v${k}][a${k}]` : `[v${k}]`)).join('');
  graph.push(`${pads}concat=n=${pieces.length}:v=1:a=${keepAudio ? 1 : 0}${keepAudio ? '[vout][aout]' : '[vout]'}`);
  const out = ['-filter_complex', graph.join(';'), '-map', '[vout]'];
  if (keepAudio) out.push('-map', '[aout]', ...ctx.tools.encodeArgs('aac'));
  out.push(...ctx.tools.encodeArgs('h264-master'), ...assembleRateCap(grade), '-r', String(fps), join(ctx.workDir, 'assembled.mp4'));
  await kitFfmpeg(ctx, [...args, ...out]);
  const video = await ctx.file('assembled.mp4', 'video');
  if (video.bytes > ASSEMBLE_MAX_BYTES) {
    const mb = (n) => Math.round(n / (1024 * 1024));
    throw ctx.error('output_invalid', `the cut is ${mb(video.bytes)} MB, over the ${mb(ASSEMBLE_MAX_BYTES)} MB a finished video may be; make it shorter or drop the grain look`);
  }
  const total = plan.total_f / fps;
  const got = await ctx.tools.probe(video.path);
  if (!Number.isFinite(got.duration_s) || Math.abs(got.duration_s - total) > 1.5 / fps) {
    throw ctx.error('output_invalid', `the cut is ${got.duration_s}s, expected ${kitNum(total, 3)}s`);
  }

  // The timeline: scenes by cut (or the clips' own timeline), speech passed through, the end card and its logo box.
  const seconds = t3(plan.total_f, fps);
  const bodyEnd = plan.card ? t3(plan.card.start_f, fps) : seconds;
  let scenes;
  let zones = [];
  if (!inputs.spans && inputs.timeline) {
    const tl = inputs.timeline;
    scenes = assembleClampScenes(tl.scenes, bodyEnd);
    const scale = (tl.width !== w || tl.height !== h) && tl.width > 0 && tl.height > 0;
    for (const z of tl.safe_zones || []) {
      const moved = scale ? assembleMapZone(z, tl.width, tl.height, w, h, fit) : { ...z };
      if (moved) zones.push(moved);
    }
  } else {
    scenes = plan.cuts.map((c) => ({ id: c.id, start_s: t3(c.start_f, fps), end_s: t3(c.start_f + c.frames, fps) }));
  }
  if (plan.card && plan.card.id) scenes.push({ id: plan.card.id, start_s: bodyEnd, end_s: seconds });
  const speech = assembleClampSpeech(inputs.speech ?? (inputs.timeline ? inputs.timeline.speech : []), seconds);
  const timeline = { duration_s: seconds, width: w, height: h, fps, scenes, speech };
  if (plan.card) {
    timeline.end_card = { start_s: bodyEnd, end_s: seconds };
    const et = inputs.ending_timeline;
    const logo = et && (et.safe_zones || []).find((z) => z.use === 'logo');
    const moved = logo ? assembleMapZone(logo, et.width, et.height, w, h, fit) : null;
    if (moved) zones = [...zones.filter((z) => z.use !== 'logo'), moved];
  }
  if (zones.length) timeline.safe_zones = zones;
  return kitCheckOutputs(ctx, manifest, { video, seconds, timeline });
}
