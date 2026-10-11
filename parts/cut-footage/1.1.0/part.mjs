// Built from cut-footage/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
import { statSync } from 'node:fs';
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

// ---- _lib/screen-look.mjs ----
// The "filmed screen" look, ported from footage-cutlist `scripts/filmed.py`
// (ScreenLook): footage framed as a screen photographed at close range, with a
// thin bezel, the dark room around it, faint moire, a vignette, grain and a
// slow two-sine handheld drift. Pure builders: they return ffmpeg filter-graph
// text and numbers, and never run ffmpeg, read files or touch ctx. A part that
// uses the look (cut-footage 1.1.0 `look: "screen"`) probes its source, calls
// kitScreenGraph and runs the graph with kitFfmpeg.
//
// The geometry is CONSTRUCTED, not generated (filmed.py's header has the
// reasons). The style constants, in `screen`:
//   rot            degrees, -1.5 to 1.5. A flat 0 reads as a pasted screenshot;
//                  past about 1 degree it reads as a wonky camera.
//   alternate_rot  optional; used instead of `rot` on odd beats (index 1, 3, ...).
//   keystone       0 to 0.04: how much narrower the far (top) edge is. ~0.007 for
//                  an insert over a creator, ~0.024 for a full walkthrough.
//   fill           0.3 to 1: how much of the box the screen fills. Zoom out, never in.
//   fit            'width' fits a whole panel by width (room above and below);
//                  'height' fills the box height (up to 1.3x the box width).
//   drift          0 to 3: the handheld drift's strength (1 = filmed.py's).
//   bezel          0 to 0.05: the bezel's width as a fraction of the screen.
//   room           the room colour: [r, g, b] or '#rrggbb'.
//   moire          0 to 0.05: the moire's amplitude (filmed.py: 0.016).
//   vignette       0 to 0.5: how much darker the corners are (filmed.py: 0.30).
//   grain          0 to 20: ffmpeg noise strength of the per-frame grain.
// Per beat, beside the constants: `crop` [x0, y0, x1, y1] (fractions of the
// source) picks the region shown, and `masks` (the same boxes) are blurred in
// the SOURCE before the crop, so an email in a sidebar stays hidden whatever
// the crop does.
//
// The look is built in three passes of one graph:
//   1. page: masks, crop, scale to the fitted size, the bezel as a border, then
//      a transparent canvas and one `perspective` (sense=destination,
//      eval=frame) that places it on the keystoned, rotated quad. The drift is
//      a translation of the quad, so it is the same corners plus two sines of
//      the frame number.
//   2. room: the page laid over a solid room colour.
//   3. lens: vignette x moire is one static picture (computed once by geq on a
//      single frame, then looped) multiplied into the luma; then grain.
// Differences from filmed.py: the moire and vignette are applied over the whole
// frame (filmed.py masks the moire to the screen; on a room of (7,7,9) the
// difference is below one code value), they scale luma only, and the grain is
// ffmpeg's seeded noise rather than four numpy frames.
//
// Exports (every top-level name starts with `kitScreen` / `KIT_SCREEN_`):
//   KIT_SCREEN_DEFAULTS                       filmed.py's DEFAULTS plus moire/vignette/grain
//   kitScreenProblems(screen) -> string[]     unknown keys and out-of-range values
//   kitScreenParams(screen) -> params         defaults filled; throws KitScreenRefusal
//   kitScreenBoxProblems(box, what) -> string[]
//   kitScreenRot(params, index) -> degrees    alternate_rot on odd beats
//   kitScreenFit(box, page, params) -> {width, height}
//   kitScreenQuad(box, size, params, rot) -> [[x, y] x4]   TL, TR, BR, BL around the box centre, at t = 0
//   kitScreenDrift(box, params, seed) -> {ax, ay, fx, fy, px, py}   x(t) = ax*sin(2*PI*fx*t + px)
//   kitScreenDriftAt(drift, t) -> [dx, dy]
//   kitScreenHomography(src4, dst4) -> number[9]   maps src points onto dst points
//   kitScreenProject(h, [x, y]) -> [x, y]
//   kitScreenLensExpr(box, params) -> string      the geq luma expression of the static lens picture
//   kitScreenGraph(options) -> {graph, page, canvas, quad, rot, drift}
//   class KitScreenRefusal extends Error          bad params or sizes (code 'bad_input')

const KIT_SCREEN_DEFAULTS = Object.freeze({
  rot: -0.8,
  keystone: 0.012,
  fill: 0.86,
  fit: 'width',
  bezel: 0.012,
  drift: 1.0,
  room: [7, 7, 9],
  moire: 0.016,
  vignette: 0.3,
  grain: 4,
});

const KIT_SCREEN_RANGES = {
  rot: [-1.5, 1.5],
  alternate_rot: [-1.5, 1.5],
  keystone: [0, 0.04],
  fill: [0.3, 1],
  drift: [0, 3],
  bezel: [0, 0.05],
  moire: [0, 0.05],
  vignette: [0, 0.5],
  grain: [0, 20],
};

const KIT_SCREEN_KEYS = new Set([...Object.keys(KIT_SCREEN_RANGES), 'fit', 'room']);
const KIT_SCREEN_BEZEL_RGB = '0x0E0E11';
const KIT_SCREEN_HEX = /^#[0-9a-fA-F]{6}$/;

/** A screen-look input the builders refuse. `code` matches ctx.error's 'bad_input'. */
class KitScreenRefusal extends Error {
  constructor(message) {
    super(message);
    this.name = 'KitScreenRefusal';
    this.code = 'bad_input';
  }
}

function kitScreenIsNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Problems with a `screen` object: unknown keys and out-of-range values. Empty when it is fine. */
function kitScreenProblems(screen) {
  if (screen == null) return [];
  if (typeof screen !== 'object' || Array.isArray(screen)) return ['screen must be an object'];
  const out = [];
  for (const key of Object.keys(screen)) {
    if (!KIT_SCREEN_KEYS.has(key)) out.push(`screen.${key} is not a screen-look setting`);
  }
  for (const [key, [lo, hi]] of Object.entries(KIT_SCREEN_RANGES)) {
    const v = screen[key];
    if (v === undefined) continue;
    if (!kitScreenIsNum(v)) out.push(`screen.${key} must be a number`);
    else if (v < lo || v > hi) out.push(`screen.${key} ${v} is outside ${lo} to ${hi}`);
  }
  if (screen.fit !== undefined && screen.fit !== 'width' && screen.fit !== 'height') out.push(`screen.fit must be 'width' or 'height'`);
  const room = screen.room;
  if (room !== undefined) {
    const rgbOk = Array.isArray(room) && room.length === 3 && room.every((c) => Number.isInteger(c) && c >= 0 && c <= 255);
    if (!rgbOk && !(typeof room === 'string' && KIT_SCREEN_HEX.test(room))) out.push(`screen.room must be [r, g, b] (0-255) or '#rrggbb'`);
  }
  return out;
}

/** The screen settings with filmed.py's defaults filled in. Throws KitScreenRefusal listing every problem. */
function kitScreenParams(screen) {
  const problems = kitScreenProblems(screen);
  if (problems.length) throw new KitScreenRefusal(`the screen look is refused: ${problems.join('; ')}`);
  return { ...KIT_SCREEN_DEFAULTS, ...(screen || {}) };
}

/** Problems with a crop or mask box [x0, y0, x1, y1] in fractions of the source. */
function kitScreenBoxProblems(box, what = 'box') {
  if (!Array.isArray(box) || box.length !== 4 || !box.every(kitScreenIsNum)) return [`${what} must be [x0, y0, x1, y1]`];
  const [x0, y0, x1, y1] = box;
  if (Math.min(x0, y0, x1, y1) < 0 || Math.max(x0, y0, x1, y1) > 1) return [`${what} must be fractions from 0 to 1`];
  if (!(x1 > x0 && y1 > y0)) return [`${what} must have x1 > x0 and y1 > y0`];
  return [];
}

/** The beat's angle: `alternate_rot` on odd beats when it is set, else `rot`. */
function kitScreenRot(params, index = 0) {
  return params.alternate_rot !== undefined && index % 2 === 1 ? params.alternate_rot : params.rot;
}

function kitScreenEven(n) {
  return Math.max(2, 2 * Math.round(n / 2));
}

/**
 * The size the page is scaled to inside a box (filmed.py render's fit block), rounded to even pixels.
 * `page` is the source region after the crop.
 */
function kitScreenFit(box, page, params) {
  const { width: W, height: H } = box;
  const ar = page.height / page.width;
  let tw;
  let th;
  if (params.fit === 'width') {
    tw = W * params.fill;
    th = tw * ar;
    if (th > H * 0.98) {
      th = H * 0.98;
      tw = th / ar;
    }
  } else {
    th = H * params.fill;
    tw = th / ar;
    if (tw > W * 1.3) {
      tw = W * 1.3;
      th = tw * ar;
    }
  }
  return { width: kitScreenEven(tw), height: kitScreenEven(th) };
}

/**
 * The screen's corners at t = 0 in box pixels: TL, TR, BR, BL. The far edge is
 * narrowed by `keystone`, then the quad turns by `rot` degrees about the box centre.
 */
function kitScreenQuad(box, size, params, rot = params.rot) {
  const cx = box.width / 2;
  const cy = box.height / 2;
  const tw = size.width;
  const th = size.height;
  const kk = params.keystone * tw;
  const quad = [
    [cx - tw / 2 + kk, cy - th / 2],
    [cx + tw / 2, cy - th / 2 + kk * 0.35],
    [cx + tw / 2 - kk * 0.3, cy + th / 2],
    [cx - tw / 2, cy + th / 2 - kk * 0.25],
  ];
  const r = (rot * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return quad.map(([qx, qy]) => [(qx - cx) * cos - (qy - cy) * sin + cx, (qx - cx) * sin + (qy - cy) * cos + cy]);
}

/** The handheld drift: two slow sines, phased by the seed (filmed.py ph1, ph2). */
function kitScreenDrift(box, params, seed = 0) {
  const s = Math.abs(Math.trunc(seed));
  return {
    ax: params.drift * 0.006 * box.width,
    ay: params.drift * 0.004 * box.height,
    fx: 0.09,
    fy: 0.15,
    px: 1.1 + (s % 7) * 0.7,
    py: 2.3 + (s % 5) * 1.3,
  };
}

/** The drift's offset in pixels `t` seconds into the beat. */
function kitScreenDriftAt(drift, t) {
  return [drift.ax * Math.sin(2 * Math.PI * drift.fx * t + drift.px), drift.ay * Math.sin(2 * Math.PI * drift.fy * t + drift.py)];
}

/** The projective map taking the four `src` points onto the four `dst` points (filmed.py _coeffs, the other way). */
function kitScreenHomography(src, dst) {
  const rows = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  for (let c = 0; c < 8; c++) {
    let pivot = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(rows[r][c]) > Math.abs(rows[pivot][c])) pivot = r;
    if (Math.abs(rows[pivot][c]) < 1e-12) throw new KitScreenRefusal('the screen corners are degenerate');
    [rows[c], rows[pivot]] = [rows[pivot], rows[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = rows[r][c] / rows[c][c];
      for (let k = c; k < 9; k++) rows[r][k] -= f * rows[c][k];
    }
  }
  return [...rows.map((row, i) => row[8] / row[i]), 1];
}

/** A point through a homography. */
function kitScreenProject(h, [x, y]) {
  const w = h[6] * x + h[7] * y + h[8];
  return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
}

/**
 * The geq luma expression of the static lens picture, 255 x vignette x moire
 * (filmed.py's self.vig and self.moire), normalised so its brightest value is 255.
 */
function kitScreenLensExpr(box, params) {
  const { width: W, height: H } = box;
  const n = (v) => kitNum(v, 9);
  const A = params.moire;
  const period = 3.1;
  const ang = 0.3;
  const u = `(X*${n(Math.cos(ang))}+Y*${n(Math.sin(ang))}+${n(0.8 * period)}*sin(Y*${n((2 * Math.PI) / (H * 0.7))}))`;
  const env = `(0.5+0.5*abs(sin(Y*${n((2 * Math.PI) / (H * 0.9))})))`;
  const moire = A > 0 ? `(1+${n(A)}*${env}*sin(${u}*${n((2 * Math.PI) / period)}))/${n(1 + A)}` : '1';
  // filmed.py: clip(1 - 0.16 * rr^2.2, 0.70, 1), with 0.16 and 0.70 scaled from its 0.30 corner drop.
  const V = params.vignette;
  const rr = `hypot((X-${n(W / 2)})/${n(W / 2)},(Y-${n(H / 2)})/${n(H / 2)})`;
  const vig = V > 0 ? `clip(1-${n((0.16 * V) / 0.3)}*pow(${rr},2.2),${n(1 - V)},1)` : '1';
  return `255*${vig}*${moire}`;
}

function kitScreenRgb(room) {
  if (typeof room === 'string') return `0x${room.slice(1).toUpperCase()}`;
  return `0x${room.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function kitScreenLabel(s) {
  if (typeof s !== 'string' || !/^[A-Za-z0-9_:.-]+$/.test(s)) throw new KitScreenRefusal(`screen graph label ${JSON.stringify(s)} is not a plain name`);
  return s;
}

/**
 * The filter graph that turns the stream `[input]` (the source, PTS from 0, at
 * `fps`) into `[output]`: a box.width x box.height yuv444p picture of the source
 * filmed as a screen.
 *
 *   options = {
 *     input, output,           // pad labels, without brackets
 *     box: {width, height, fps},
 *     source: {width, height}, // the source's own size (probe it)
 *     screen,                  // the style's settings (checked by kitScreenParams)
 *     crop, masks,             // optional per-beat boxes (fractions of the source)
 *     index, seed,             // the beat's index (alternate_rot) and the drift's phase seed
 *     id,                      // prefix of internal labels, unique per graph (default: output)
 *   }
 * Returns {graph (';'-joined filter chains), page {width, height} (the scaled
 * screen), canvas {width, height} (the working canvas), quad (corners at t = 0
 * in box pixels), rot, drift}.
 */
function kitScreenGraph(options) {
  const { box, source, crop, masks = [], index = 0 } = options || {};
  const input = kitScreenLabel(options && options.input);
  const output = kitScreenLabel(options && options.output);
  const id = kitScreenLabel(options.id ?? output);
  const problems = [];
  for (const [what, o] of [['box', box], ['source', source]]) {
    if (!o || !Number.isInteger(o.width) || !Number.isInteger(o.height) || o.width < 16 || o.height < 16) problems.push(`${what} must have whole width and height of at least 16 pixels`);
  }
  if (box && box.width % 2 + box.height % 2) problems.push('box width and height must be even');
  if (!box || !kitScreenIsNum(box.fps) || box.fps <= 0 || box.fps > 120) problems.push('box.fps must be a number from 0 to 120');
  if (crop != null) problems.push(...kitScreenBoxProblems(crop, 'crop'));
  if (!Array.isArray(masks)) problems.push('masks must be a list of boxes');
  else masks.forEach((m, i) => problems.push(...kitScreenBoxProblems(m, `masks[${i}]`)));
  if (!Number.isInteger(index) || index < 0) problems.push('index must be a whole number from 0');
  if (options.seed !== undefined && !Number.isInteger(options.seed)) problems.push('seed must be a whole number');
  problems.push(...kitScreenProblems(options.screen));
  if (problems.length) throw new KitScreenRefusal(`the screen look is refused: ${problems.join('; ')}`);

  const params = kitScreenParams(options.screen);
  const seed = options.seed ?? index;
  const W = box.width;
  const H = box.height;
  const fps = kitNum(box.fps);
  const sw = source.width;
  const sh = source.height;
  const n = (v) => kitNum(v, 3);
  const chains = [];

  // 1. Masks in source pixels, before the crop.
  let head = `[${input}]format=yuva444p`;
  masks.forEach((m, i) => {
    const x = Math.floor(sw * m[0]);
    const y = Math.floor(sh * m[1]);
    const w = Math.max(2, Math.floor(sw * m[2]) - x);
    const h = Math.max(2, Math.floor(sh * m[3]) - y);
    chains.push(`${head},split=2[${id}_m${i}a][${id}_m${i}b]`);
    chains.push(`[${id}_m${i}b]crop=${w}:${h}:${x}:${y},gblur=sigma=14[${id}_m${i}c]`);
    // format=yuv444 keeps the page 4:4:4 (overlay's default is 4:2:0), so the crop below is exact.
    head = `[${id}_m${i}a][${id}_m${i}c]overlay=${x}:${y}:format=yuv444`;
  });
  const [x0, y0, x1, y1] = crop || [0, 0, 1, 1];
  const cx = Math.floor(sw * x0);
  const cy = Math.floor(sh * y0);
  const cw = Math.max(2, Math.floor(sw * x1) - cx);
  const ch = Math.max(2, Math.floor(sh * y1) - cy);
  const page = kitScreenFit(box, { width: cw, height: ch }, params);
  const bx = Math.round((params.bezel * page.width) / 2);
  const by = Math.round((params.bezel * page.height) / 2);
  // The working canvas holds the whole bezelled page (fit 'height' may be wider than
  // the box), centred on the box centre so the final crop is a whole-pixel centre crop.
  const CW = W + 2 * Math.max(0, Math.ceil((page.width + 2 * bx + 8 - W) / 2));
  const CH = H + 2 * Math.max(0, Math.ceil((page.height + 2 * by + 8 - H) / 2));
  const ox = Math.floor((CW - page.width) / 2);
  const oy = Math.floor((CH - page.height) / 2);
  const rot = kitScreenRot(params, index);
  const quad = kitScreenQuad(box, page, params, rot);
  const shift = [(CW - W) / 2, (CH - H) / 2];
  const dst = quad.map(([x, y]) => [x + shift[0], y + shift[1]]);
  const hom = kitScreenHomography(
    [
      [ox, oy],
      [ox + page.width, oy],
      [ox + page.width, oy + page.height],
      [ox, oy + page.height],
    ],
    dst,
  );
  // perspective's corners are the INPUT canvas's: top left, top right, bottom left, bottom right.
  const corners = [
    [0, 0],
    [CW, 0],
    [0, CH],
    [CW, CH],
  ].map((p) => kitScreenProject(hom, p));
  const drift = kitScreenDrift(box, params, seed);
  const sx = drift.ax > 0 ? `+${n(drift.ax)}*sin(in/${fps}*${kitNum(2 * Math.PI * drift.fx, 9)}+${kitNum(drift.px, 9)})` : '';
  const sy = drift.ay > 0 ? `+${n(drift.ay)}*sin(in/${fps}*${kitNum(2 * Math.PI * drift.fy, 9)}+${kitNum(drift.py, 9)})` : '';
  const persp = corners.map(([x, y], i) => `x${i}=${n(x)}${sx}:y${i}=${n(y)}${sy}`).join(':');
  let pageChain = `${head}`;
  if (crop) pageChain += `,crop=${cw}:${ch}:${cx}:${cy}`;
  pageChain += `,scale=${page.width}:${page.height}:flags=lanczos,setsar=1`;
  if (bx || by) pageChain += `,pad=${page.width + 2 * bx}:${page.height + 2 * by}:${bx}:${by}:color=${KIT_SCREEN_BEZEL_RGB}`;
  pageChain += `,pad=${CW}:${CH}:${ox - bx}:${oy - by}:color=black@0`;
  pageChain += `,perspective=${persp}:sense=destination:eval=frame:interpolation=cubic[${id}_page]`;
  chains.push(pageChain);

  // 2. The room.
  chains.push(`color=c=${kitScreenRgb(params.room)}:s=${CW}x${CH}:r=${fps},format=yuv444p[${id}_room]`);
  let lit = `[${id}_room][${id}_page]overlay=0:0:shortest=1:format=yuv444`;
  if (CW !== W || CH !== H) lit += `,crop=${W}:${H}:${shift[0]}:${shift[1]}`;

  // 3. The lens: one static vignette x moire picture multiplied into the luma, then grain.
  if (params.vignette > 0 || params.moire > 0) {
    chains.push(`${lit}[${id}_lit]`);
    chains.push(`color=c=black:s=${W}x${H}:r=${fps}:d=1,format=yuv444p,trim=end_frame=1,geq=lum='${kitScreenLensExpr(box, params)}':cb=128:cr=128,loop=loop=-1:size=1[${id}_lens]`);
    lit = `[${id}_lit][${id}_lens]blend=c0_mode=multiply:shortest=1`;
  }
  if (params.grain > 0) {
    const g = Math.round(params.grain);
    const c = Math.round(params.grain / 2);
    // noise's all_seed takes 0 to INT_MAX: fold any whole seed (negative or huge) into that range.
    const noiseSeed = ((Math.abs(seed) % 2147483647) * 7919 + 17) % 2147483647;
    lit += `,noise=c0s=${g}:c0f=t:c1s=${c}:c1f=t:c2s=${c}:c2f=t:all_seed=${noiseSeed}`;
  }
  chains.push(`${lit},setsar=1[${output}]`);
  return { graph: chains.join(';'), page, canvas: { width: CW, height: CH }, quad, rot, drift };
}

// ---- cut-footage/src/plan.mjs ----
// cut-footage's planning: which source each plan scene plays, how long each
// beat lasts and at what speed, which source ranges the beats use, and where
// the inserts sit over a talking track. Pure functions over plain objects:
// they never run ffmpeg or read files. A problem is a CutRefusal (code
// 'bad_input') with a plain message; part.mjs turns it into ctx.error.
//
// Top-level names start with `cut` (bundled modules share one namespace).

/** A plan the part refuses, in plain words. `code` matches ctx.error's 'bad_input'. */
class CutRefusal extends Error {
  constructor(message) {
    super(message);
    this.name = 'CutRefusal';
    this.code = 'bad_input';
  }
}

/** The largest finished video the part writes: the server refuses uploads over 200 MB (§4.12). */
const CUT_MAX_BYTES = 180 * 1024 * 1024;
/** The final encode's video bitrate cap, in bits per second (`-maxrate 16M`). */
const CUT_MAXRATE_BPS = 16e6;
/** An insert may stretch at most this far to cover a take join, and ends this long after it. */
const CUT_JOIN_STRETCH_S = 1.0;
const CUT_JOIN_AFTER_S = 0.15;

const CUT_EPS = 1e-6;

function cutFmt(v, digits = 2) {
  return Number(v).toFixed(digits).replace(/\.?0+$/, '') || '0';
}

/** The mode a call runs in: the explicit `mode`, else band without scenes, inserts with scenes and a talking video, else scenes. */
function cutModeOf(inputs) {
  if (inputs.mode) return inputs.mode;
  if (!inputs.scenes) return 'band';
  return inputs.video ? 'inserts' : 'scenes';
}

// The inputs each mode reads. Anything else given is refused, so a style that
// binds an input to the wrong mode hears about it instead of losing it quietly.
const CUT_MODE_INPUTS = {
  band: ['mode', 'video', 'footage', 'band', 'fit', 'speed', 'min_speed', 'max_speed', 'audio'],
  scenes: ['mode', 'scenes', 'footage', 'lead', 'look', 'screen', 'fit', 'transition', 'scene_seconds', 'still_seconds', 'speed', 'min_speed', 'max_speed', 'order', 'width', 'height', 'fps'],
  inserts: ['mode', 'video', 'timeline', 'scenes', 'footage', 'joins', 'look', 'screen', 'fit', 'speed', 'min_speed', 'max_speed', 'order'],
};
const CUT_MODE_NEEDS = { band: ['video', 'band'], scenes: ['scenes'], inserts: ['video', 'timeline', 'scenes'] };

/** Refuses inputs the mode does not read and missing inputs it needs. */
function cutCheckMode(mode, inputs) {
  const allowed = new Set(CUT_MODE_INPUTS[mode]);
  const extra = Object.keys(inputs).filter((k) => inputs[k] !== undefined && !allowed.has(k));
  if (extra.length) throw new CutRefusal(`${mode} mode does not use ${extra.join(', ')}`);
  const missing = CUT_MODE_NEEDS[mode].filter((k) => inputs[k] == null);
  if (missing.length) throw new CutRefusal(`${mode} mode needs ${missing.join(', ')}`);
  if (inputs.look !== 'screen' && inputs.screen != null) throw new CutRefusal('screen settings are given but look is not "screen"');
}

/** The clip file of a footage entry: `file`, else `video`. */
function cutEntryFile(entry) {
  return entry.file || entry.video || null;
}

/** True when the footage entry is a still picture (kind "image", or an image file). */
function cutEntryIsStill(entry) {
  const f = cutEntryFile(entry);
  if (entry.kind === 'image' && f && f.media !== 'image') throw new CutRefusal(`footage ${cutEntryName(entry)} is kind image but its file is a ${f.media}`);
  return !!f && f.media === 'image';
}

function cutEntryName(entry) {
  return entry.asset_id ? `"${entry.asset_id}"` : entry.scene_id ? `for scene "${entry.scene_id}"` : '(no asset id)';
}

/**
 * Each scene's source, in plan order: its footage entry (matched by
 * scene_id), else its image, else (the first scene only) the lead clip.
 * Returns [{scene, index, kind: 'window' | 'still' | 'lead' | 'none', entry?, image?}].
 * `need` = 'all' refuses a scene with no source (scenes mode); 'any' leaves it as 'none' (inserts mode).
 */
function cutSceneSources(scenes, footage, { lead = null, need = 'all' } = {}) {
  const ids = new Set();
  for (const s of scenes) {
    if (ids.has(s.id)) throw new CutRefusal(`scene "${s.id}" appears twice in the plan`);
    ids.add(s.id);
  }
  const byScene = new Map();
  for (const entry of footage || []) {
    if (!cutEntryFile(entry)) throw new CutRefusal(`footage ${cutEntryName(entry)} has no clip file`);
    if (entry.scene_id == null) continue;
    if (!ids.has(entry.scene_id)) throw new CutRefusal(`footage ${cutEntryName(entry)} names scene "${entry.scene_id}", which is not in the plan`);
    if (byScene.has(entry.scene_id)) throw new CutRefusal(`scene "${entry.scene_id}" has more than one footage entry; this version plays one per scene`);
    byScene.set(entry.scene_id, entry);
  }
  return scenes.map((scene, index) => {
    const entry = byScene.get(scene.id);
    if (entry) return { scene, index, kind: cutEntryIsStill(entry) ? 'still' : 'window', entry };
    if (scene.image) return { scene, index, kind: 'still', image: scene.image };
    if (index === 0 && lead) return { scene, index, kind: 'lead' };
    if (need === 'all') throw new CutRefusal(`scene "${scene.id}" has no footage window, image or lead clip to show`);
    return { scene, index, kind: 'none' };
  });
}

/** The window [from, to] in seconds of a video entry inside a clip `length` seconds long. */
function cutWindow(entry, length) {
  const from = (entry.start_ms ?? 0) / 1000;
  const to = entry.end_ms == null ? length : entry.end_ms / 1000;
  if (!(to > from) || to > length + 0.05) {
    throw new CutRefusal(`the footage window ${cutFmt(from)}-${cutFmt(to)}s of ${cutEntryName(entry)} is not inside the ${cutFmt(length)}s clip`);
  }
  return { from, to: Math.min(to, length) };
}

function cutSnap(seconds, fps) {
  return Math.max(1, Math.round(seconds * fps)) / fps;
}

/**
 * The speed a window of `windowS` source seconds plays at to last `slotS`,
 * under `speed` ('fill' or a number), refused outside min to max.
 */
function cutSpeedFor(windowS, slotS, { speed = 'fill', min_speed, max_speed }, what) {
  if (speed === 'fill') {
    const s = windowS / slotS;
    // 0.01 absorbs the frame snap of the slot. The exact ratio is kept so the window ends where the
    // plan says (no reuse of the next window); picture-only setpts plays any speed.
    if (s < min_speed - 0.01 || s > max_speed + 0.01) {
      throw new CutRefusal(`${what}: ${cutFmt(slotS)}s from a ${cutFmt(windowS)}s window needs ${cutFmt(s)}x, outside ${min_speed}x to ${max_speed}x`);
    }
    return s;
  }
  if (speed < min_speed - CUT_EPS || speed > max_speed + CUT_EPS) throw new CutRefusal(`${what}: the fixed speed ${speed}x is outside ${min_speed}x to ${max_speed}x`);
  if (windowS / speed + 0.05 < slotS) {
    throw new CutRefusal(`${what}: at ${speed}x the ${cutFmt(windowS)}s window lasts ${cutFmt(windowS / speed)}s, less than the ${cutFmt(slotS)}s it must fill`);
  }
  return speed;
}

/**
 * Scenes mode: each beat's length and speed. `lengths` maps a window beat's
 * index to its clip length; `leadS` is the lead clip's length.
 * A window's natural length (at 1x, or at a fixed speed) is clamped to
 * scene_seconds, and the speed that fits it there must be inside min to max.
 * A still lasts still_seconds (default: scene_seconds.max, else 2.5 s).
 * Returns beats [{...source, seconds, speed, from?, to?, start_s, end_s}] and the total.
 */
function cutPlanScenes(sources, { lengths, leadS, fps, scene_seconds, still_seconds, speed = 'fill', min_speed = 0.5, max_speed = 2, dissolve_frames = 0 }) {
  const lo = scene_seconds?.min ?? 0;
  const hi = scene_seconds?.max ?? Infinity;
  if (lo > hi) throw new CutRefusal(`scene_seconds.min ${lo} is above scene_seconds.max ${hi}`);
  const stillS = still_seconds ?? (Number.isFinite(hi) ? hi : 2.5);
  const dissolveS = dissolve_frames / fps;
  let t = 0;
  const beats = sources.map((src, i) => {
    const what = `scene "${src.scene.id}"`;
    let seconds;
    let sp = 1;
    let range = {};
    if (src.kind === 'window') {
      const { from, to } = cutWindow(src.entry, lengths.get(src.index));
      const natural = (to - from) / (speed === 'fill' ? 1 : speed);
      seconds = cutSnap(Math.min(hi, Math.max(lo, natural)), fps);
      sp = cutSpeedFor(to - from, seconds, { speed, min_speed, max_speed }, what);
      range = { from, to: from + seconds * sp };
    } else if (src.kind === 'still') {
      seconds = cutSnap(stillS, fps);
    } else if (src.kind === 'lead') {
      seconds = Math.floor(leadS * fps + 1e-6) / fps;
      if (seconds <= 0) throw new CutRefusal('the lead clip is shorter than one frame');
    } else {
      throw new CutRefusal(`${what} has no footage window, image or lead clip to show`);
    }
    // Every beat after the first fades in over the dissolve; a single beat has none.
    if (dissolveS > 0 && i > 0 && seconds < dissolveS - CUT_EPS) throw new CutRefusal(`${what} lasts ${cutFmt(seconds)}s, shorter than the ${dissolve_frames}-frame dissolve`);
    const beat = { ...src, ...range, seconds, speed: sp, start_s: t, end_s: t + seconds };
    t += seconds;
    return beat;
  });
  return { beats, seconds: t };
}

/**
 * Refuses windows that reuse source: two beats on the same clip may not
 * overlap, and with order 'forward' a later beat may not go back in the clip.
 * Stills are never checked (critic #14). `beats` carry {entry, from, to, scene}.
 */
function cutCheckOrder(beats, order = 'forward') {
  const last = new Map();
  for (const b of beats) {
    if (b.kind !== 'window') continue;
    const f = cutEntryFile(b.entry);
    const key = b.entry.asset_id || (f && f.sha256) || (f && f.path);
    const prev = last.get(key);
    if (prev) {
      for (const p of prev) {
        if (b.from < p.to - 0.02 && p.from < b.to - 0.02) {
          throw new CutRefusal(`scenes "${p.scene.id}" and "${b.scene.id}" show the same part of the recording (${cutFmt(Math.max(p.from, b.from))}-${cutFmt(Math.min(p.to, b.to))}s); it reads as a loop`);
        }
        if (order === 'forward' && b.from < p.from) {
          throw new CutRefusal(`scene "${b.scene.id}" goes back in the recording to ${cutFmt(b.from)}s, before scene "${p.scene.id}" at ${cutFmt(p.from)}s; the job must move forward`);
        }
      }
      prev.push(b);
    } else last.set(key, [b]);
  }
}

/**
 * Inserts mode: each insert's slot on the talking track. `inserts` are the
 * sources with a window or still; `spans` maps scene id -> {start_s, end_s}
 * from the talking track's timeline; `joins` are the take starts after the
 * first. Every join must sit under an insert, at least CUT_JOIN_AFTER_S after
 * its start and before its end:
 *   - an insert that ends at most CUT_JOIN_STRETCH_S before a join (or too
 *     close after it) is stretched to end CUT_JOIN_AFTER_S after the join,
 *     never into the next insert or past the end of the video;
 *   - else an insert that starts at most CUT_JOIN_STRETCH_S after a join (or
 *     too close before it) starts CUT_JOIN_AFTER_S before the join, never
 *     before 0 or into the previous insert. A creator step starts a new take's
 *     scene just before the join, but a timeline retimed from heard words
 *     often moves that scene's start after it.
 * Anything else is refused. Returns [{...source, start_s, end_s, stretched_s,
 * early_s}] in time order; stretched_s and early_s are the seconds added at
 * the end and at the start.
 */
function cutPlaceInserts(inserts, spans, { joins = [], duration, fps }) {
  const slots = inserts.map((src) => {
    const span = spans.get(src.scene.id);
    if (!span) throw new CutRefusal(`scene "${src.scene.id}" has footage but no time in the talking track's timeline`);
    const start = Math.max(0, span.start_s);
    const end = Math.min(duration, span.end_s);
    if (!(end - start > 1 / fps)) throw new CutRefusal(`scene "${src.scene.id}" lasts under one frame in the talking track, too short for an insert`);
    return { ...src, start_s: start, end_s: end, stretched_s: 0, early_s: 0 };
  });
  slots.sort((a, b) => a.start_s - b.start_s);
  for (let i = 1; i < slots.length; i++) {
    if (slots[i].start_s < slots[i - 1].end_s - CUT_EPS) throw new CutRefusal(`the inserts for scenes "${slots[i - 1].scene.id}" and "${slots[i].scene.id}" overlap in time`);
  }
  // Each returns null when the slot covers the join after the move, else why it cannot.
  const stretchEnd = (slot, j) => {
    const want = j + CUT_JOIN_AFTER_S;
    if (slot.end_s >= want - CUT_EPS) return null;
    const next = slots[slots.indexOf(slot) + 1];
    const limit = Math.min(duration, next ? next.start_s : Infinity);
    if (want > limit + CUT_EPS) return `the insert for scene "${slot.scene.id}" cannot stretch over the cut between takes at ${cutFmt(j)}s: it would run past ${next ? 'the next insert' : 'the end of the video'}`;
    slot.stretched_s += want - slot.end_s;
    slot.end_s = want;
    return null;
  };
  const startEarly = (slot, j) => {
    const want = Math.max(0, j - CUT_JOIN_AFTER_S);
    if (slot.start_s <= want + CUT_EPS) return null;
    const prev = slots[slots.indexOf(slot) - 1];
    if (prev && want < prev.end_s - CUT_EPS) return `the insert for scene "${slot.scene.id}" cannot start early over the cut between takes at ${cutFmt(j)}s: it would run into the previous insert`;
    slot.early_s += slot.start_s - want;
    slot.start_s = want;
    return null;
  };
  for (const j of [...joins].sort((a, b) => a - b)) {
    // An insert the join is inside: pad whichever side is too close.
    const inside = slots.find((s) => s.start_s <= j + CUT_EPS && j <= s.end_s + CUT_EPS);
    if (inside) {
      const why = stretchEnd(inside, j) || startEarly(inside, j);
      if (why) throw new CutRefusal(why);
      continue;
    }
    // Else stretch the insert just before it, or start the one just after it early.
    const before = slots.filter((s) => s.end_s < j && j - s.end_s <= CUT_JOIN_STRETCH_S + CUT_EPS).pop();
    const after = slots.find((s) => s.start_s > j && s.start_s - j <= CUT_JOIN_STRETCH_S + CUT_EPS);
    if (!before && !after) {
      throw new CutRefusal(`a cut between takes at ${cutFmt(j)}s would show: no insert covers it (give the scene before it footage, or let an insert end or start within ${CUT_JOIN_STRETCH_S}s of it)`);
    }
    const whyBefore = before ? stretchEnd(before, j) : 'no insert ends just before it';
    if (!whyBefore) continue;
    const whyAfter = after ? startEarly(after, j) : null;
    if (after && !whyAfter) continue;
    throw new CutRefusal(before ? whyBefore : whyAfter);
  }
  for (const s of slots) {
    // A start moved early rounds down to a frame, as a stretched end rounds up, so the 0.15 s stays.
    s.start_s = s.early_s > 0 ? Math.max(0, Math.floor(s.start_s * fps + 1e-6) / fps) : Math.round(s.start_s * fps) / fps;
    s.end_s = Math.max(s.start_s + 1 / fps, Math.round(s.end_s * fps + 0.499) / fps);
    s.end_s = Math.min(s.end_s, Math.floor(duration * fps + 1e-6) / fps);
  }
  // Snapping can push an end a frame past the next insert's (early) start. The
  // earlier insert ends where the next begins: the two meet with no gap, so a
  // join either one covered stays under an insert.
  for (let i = 1; i < slots.length; i++) {
    const prev = slots[i - 1];
    const cur = slots[i];
    if (prev.end_s > cur.start_s + CUT_EPS) {
      prev.end_s = cur.start_s;
      if (!(prev.end_s - prev.start_s > 1 / fps - CUT_EPS)) throw new CutRefusal(`the inserts for scenes "${prev.scene.id}" and "${cur.scene.id}" leave the first under one frame once moved over the cuts between takes`);
    }
  }
  return slots;
}

/**
 * Inserts mode: the source range and speed of a window insert lasting `seconds`.
 * The window [from, to] plays at the speed that fills the slot (or the fixed
 * speed). When an insert that starts early over a take join would play too
 * slowly (or, at a fixed speed, run out of footage), its window is extended
 * earlier in the recording by what the early start added, at the speed it had
 * before, never before 0 s; the speed must still be inside min to max.
 * Returns {from, to, speed, extended_s}.
 */
function cutInsertRange(slot, { from, to }, seconds, opts, what) {
  let first;
  try {
    const speed = cutSpeedFor(to - from, seconds, opts, what);
    return { from, to: from + seconds * speed, speed, extended_s: 0 };
  } catch (e) {
    if (!(e instanceof CutRefusal) || !(slot.early_s > 0) || !(from > 0)) throw e;
    first = e;
  }
  let before;
  try {
    before = cutSpeedFor(to - from, Math.max(1e-3, seconds - slot.early_s), opts, what);
  } catch {
    throw first;
  }
  const extended = Math.min(from, slot.early_s * before);
  const start = from - extended;
  const speed = cutSpeedFor(to - start, seconds, opts, what);
  return { from: start, to: start + seconds * speed, speed, extended_s: extended };
}

/** Refuses an encode whose capped bitrate could pass the size limit (§4.12), before any work. */
function cutCheckProjectedSize(seconds, maxrateBps = CUT_MAXRATE_BPS) {
  const projected = (seconds * (maxrateBps + 256e3)) / 8;
  if (projected > CUT_MAX_BYTES) throw new CutRefusal(`a ${cutFmt(seconds, 1)}s video could reach ${Math.round(projected / 1048576)} MB, over the ${CUT_MAX_BYTES / 1048576} MB limit`);
}

// ---- cut-footage/src/part.mjs ----
// cut-footage: lays the brand's own footage into a video, the cut from
// footage-cutlist's render (cut.py, filmed.py) and render-logo-equation-card's
// compose. Three modes:
//   band     (the 1.0.2 behaviour, the default without scenes): the plan's first
//            footage window, cover-fitted (or fitted by width) into one band of
//            the video, sped so the window fills it (speed "fill", refused
//            outside min_speed to max_speed) or played at a fixed speed.
//   scenes   one beat per plan scene, full frame: the scene's footage window
//            (footage entries matched by scene_id), else its image or image
//            footage held still, else (scene 1 only) the lead clip. Each window
//            is sped to fit scene_seconds; beats join with dissolves; output
//            timeline scenes carry the plan's scene ids at their real times.
//   inserts  a talking track (video + timeline) with full-frame inserts at the
//            times of the scenes that have footage or an image; the track's
//            sound runs under them. Every take join (joins) must sit under an
//            insert; an insert that ends just before one is stretched over it,
//            else one that starts just after it starts early over it.
// look "screen" frames every footage beat as a screen filmed by a phone
// (_lib/screen-look.mjs); "plain" fits it (cover, width or height). Crop and
// mask boxes from the footage entry apply in the source before the look.
// Every final encode caps its bitrate and a file over 180 MB is refused (§4.12).

/** atempo steps whose product is `speed`: ffmpeg 6.0's atempo takes 0.5 to 2 at a time. */
function cutTempoChain(speed) {
  const steps = [];
  let left = speed;
  while (left > 2) {
    steps.push(2);
    left /= 2;
  }
  while (left < 0.5) {
    steps.push(0.5);
    left /= 0.5;
  }
  steps.push(left);
  return steps.map((f) => `atempo=${kitNum(f, 6)}`).join(',');
}

/** The final encode: the kit's master preset with the §4.12 bitrate cap. */
function cutMasterArgs(ctx) {
  return [...ctx.tools.encodeArgs('h264-master'), '-maxrate', '16M', '-bufsize', '32M'];
}

/** Refuses a finished file over the size limit, before it is registered or uploaded. */
function cutCheckSize(ctx, path) {
  const bytes = statSync(path).size;
  if (bytes > CUT_MAX_BYTES) throw ctx.error('output_invalid', `the cut is ${Math.round(bytes / 1048576)} MB, over the ${CUT_MAX_BYTES / 1048576} MB limit`);
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  try {
    const mode = cutModeOf(inputs);
    cutCheckMode(mode, inputs);
    if (inputs.screen != null) {
      const problems = kitScreenProblems(inputs.screen);
      if (problems.length) throw new CutRefusal(`the screen look is refused: ${problems.join('; ')}`);
    }
    if (mode === 'band') return await cutBand(inputs, ctx, manifest);
    if (mode === 'scenes') return await cutScenes(inputs, ctx, manifest);
    return await cutInserts(inputs, ctx, manifest);
  } catch (err) {
    if (err instanceof CutRefusal || (err && err.name === 'KitScreenRefusal')) throw ctx.error('bad_input', err.message);
    throw err;
  }
}

// ---- band (1.0.2) ----

async function cutBand(inputs, ctx, manifest) {
  const first = inputs.footage[0];
  const clip = { ...first, video: cutEntryFile(first) };
  if (!clip.video) throw ctx.error('bad_input', 'the first footage entry has no clip file');
  if (clip.video.media !== 'video') throw ctx.error('bad_input', 'band mode lays a video clip; the first footage entry is a still');
  const info = await ctx.tools.probe(inputs.video.path);
  const W = info.width;
  const H = info.height;
  const fps = info.fps || 30;
  const dur = await kitDuration(ctx, inputs.video);
  const band = inputs.band;
  if (band.x + band.width > W || band.y + band.height > H) throw ctx.error('bad_input', `the band ${band.width}x${band.height} at ${band.x},${band.y} is outside the ${W}x${H} video`);
  if (inputs.fit === 'height') throw ctx.error('bad_input', 'band mode fits cover or width');
  cutCheckProjectedSize(dur);
  const length = await kitMediaLength(ctx, clip.video);
  const from = (clip.start_ms ?? 0) / 1000;
  const to = clip.end_ms == null ? length : clip.end_ms / 1000;
  if (!(to > from) || to > length + 0.05) throw ctx.error('bad_input', `the footage window ${kitNum(from, 2)}-${kitNum(to, 2)}s is not inside the ${kitNum(length, 2)}s clip`);
  let speed;
  if (inputs.speed === 'fill' || inputs.speed === undefined) {
    speed = (to - from) / dur;
    const min = inputs.min_speed ?? 1;
    const max = inputs.max_speed ?? 8;
    if (speed < min - 1e-6 || speed > max + 1e-6) {
      throw ctx.error('bad_input', `filling ${kitNum(dur, 2)}s from a ${kitNum(to - from, 2)}s window needs ${kitNum(speed, 2)}x, outside ${min}x to ${max}x`);
    }
  } else {
    speed = inputs.speed;
    if ((to - from) / speed + 0.05 < dur) throw ctx.error('bad_input', `at ${speed}x the ${kitNum(to - from, 2)}s window lasts ${kitNum((to - from) / speed, 2)}s, less than the ${kitNum(dur, 2)}s video`);
  }
  const fit =
    inputs.fit === 'width'
      ? `scale=${band.width}:-2:flags=lanczos,crop=${band.width}:min(ih\\,${band.height}):0:(ih-min(ih\\,${band.height}))/2,pad=${band.width}:${band.height}:0:(oh-ih)/2:color=black`
      : `scale=${band.width}:${band.height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${band.width}:${band.height}`;
  const need = dur * speed + 0.3;
  const graph = [
    `[1:v]setpts=(PTS-STARTPTS)/${kitNum(speed, 6)},fps=${fps},${fit},setsar=1,tpad=stop_mode=clone:stop_duration=0.2,trim=duration=${kitNum(dur)}[band]`,
    `[0:v][band]overlay=${band.x}:${band.y}:eof_action=pass,format=yuv420p[v]`,
  ];
  const map = ['-map', '[v]'];
  if (inputs.audio) {
    const fInfo = await ctx.tools.probe(clip.video.path);
    if (!fInfo.has_audio) throw ctx.error('bad_input', 'audio is on but the footage has no sound');
    graph.push(`[1:a]${cutTempoChain(speed)},atrim=0:${kitNum(dur)},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a]`);
    map.push('-map', '[a]', ...ctx.tools.encodeArgs('aac'));
  } else if (info.has_audio) map.push('-map', '0:a', '-c:a', 'copy');
  const out = join(ctx.workDir, 'footage.mp4');
  await kitFfmpeg(ctx, [
    '-i',
    inputs.video.path,
    '-ss',
    kitNum(from),
    '-t',
    kitNum(Math.min(need, to - from + 0.3)),
    '-i',
    clip.video.path,
    '-filter_complex',
    graph.join(';'),
    ...map,
    ...cutMasterArgs(ctx),
    '-t',
    kitNum(dur),
    out,
  ]);
  cutCheckSize(ctx, out);
  const video = await ctx.file('footage.mp4', 'video');
  ctx.log.info('footage laid into the band', { speed: +speed.toFixed(3), window_s: +(to - from).toFixed(3) });
  return kitCheckOutputs(ctx, manifest, { video, seconds: +dur.toFixed(3), speed: +speed.toFixed(4) });
}

// ---- one beat, rendered full frame ----

/** The plain look's fit of a w x h page into W x H: cover, width (black above and below) or height (black at the sides). */
function cutPlainFit(fit, W, H) {
  if (fit === 'width') return `scale=${W}:-2:flags=lanczos,crop=${W}:min(ih\\,${H}):0:(ih-min(ih\\,${H}))/2,pad=${W}:${H}:0:(oh-ih)/2:color=black`;
  if (fit === 'height') return `scale=-2:${H}:flags=lanczos,crop=min(iw\\,${W}):${H}:(iw-min(iw\\,${W}))/2:0,pad=${W}:${H}:(ow-iw)/2:0:color=black`;
  return `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H}`;
}

/** Masks blurred in the source, then the crop: the plain look's head, in source pixels. */
function cutPlainHead(input, sw, sh, crop, masks) {
  const chains = [];
  let head = `[${input}]format=yuv420p`;
  masks.forEach((m, i) => {
    const x = Math.floor(sw * m[0]);
    const y = Math.floor(sh * m[1]);
    const w = Math.max(2, Math.floor(sw * m[2]) - x);
    const h = Math.max(2, Math.floor(sh * m[3]) - y);
    chains.push(`${head},split=2[pm${i}a][pm${i}b]`);
    chains.push(`[pm${i}b]crop=${w}:${h}:${x}:${y},gblur=sigma=14[pm${i}c]`);
    head = `[pm${i}a][pm${i}c]overlay=${x}:${y}`;
  });
  if (crop) {
    const cx = Math.floor(sw * crop[0]);
    const cy = Math.floor(sh * crop[1]);
    head += `,crop=${Math.max(2, Math.floor(sw * crop[2]) - cx)}:${Math.max(2, Math.floor(sh * crop[3]) - cy)}:${cx}:${cy}`;
  }
  return { chains, head };
}

/**
 * Renders one beat to an intermediate W x H clip `seconds` long (plus `extraS`
 * for the dissolve into the next beat). `beat.kind` is window, still or lead.
 */
async function cutRenderBeat(ctx, beat, { W, H, fps, look, screen, fit, lookIndex, seconds, extraS, name, lead }) {
  const len = seconds + extraS;
  const args = [];
  let pre;
  let sourceFile;
  if (beat.kind === 'lead') {
    args.push('-i', lead.path);
    const graph = `[0:v]setpts=PTS-STARTPTS,fps=${fps},${cutPlainFit('cover', W, H)},setsar=1,tpad=stop_mode=clone:stop_duration=${kitNum(len + 0.2)},trim=duration=${kitNum(len)},format=yuv420p[v]`;
    return cutEncodeBeat(ctx, args, graph, name);
  }
  const entry = beat.entry || {};
  if (beat.kind === 'window') {
    sourceFile = cutEntryFile(entry);
    args.push('-ss', kitNum(beat.from), '-t', kitNum(len * beat.speed + 0.5), '-i', sourceFile.path);
    pre = `[0:v]setpts=(PTS-STARTPTS)/${kitNum(beat.speed, 6)},fps=${fps},tpad=stop_mode=clone:stop_duration=${kitNum(len + 0.2)}[src]`;
  } else {
    sourceFile = beat.image || cutEntryFile(entry);
    args.push('-loop', '1', '-framerate', String(fps), '-t', kitNum(len + 0.2), '-i', sourceFile.path);
    pre = `[0:v]setpts=PTS-STARTPTS,fps=${fps}[src]`;
  }
  const info = await ctx.tools.probe(sourceFile.path);
  const sw = info.width;
  const sh = info.height;
  if (!Number.isInteger(sw) || !Number.isInteger(sh)) throw ctx.error('bad_input', `scene "${beat.scene.id}": the footage has no picture size`);
  const crop = entry.crop || null;
  const masks = entry.mask || [];
  const boxProblems = [...(crop ? kitScreenBoxProblems(crop, 'crop') : []), ...masks.flatMap((m, i) => kitScreenBoxProblems(m, `mask[${i}]`))];
  if (boxProblems.length) throw ctx.error('bad_input', `scene "${beat.scene.id}": ${boxProblems.join('; ')}`);
  const entryFit = entry.fit || fit;
  let body;
  if (look === 'screen') {
    const settings = { ...(screen || {}) };
    if (entryFit === 'width' || entryFit === 'height') settings.fit = entryFit;
    const g = kitScreenGraph({ input: 'src', output: 'look', id: 'sl', box: { width: W, height: H, fps }, source: { width: sw, height: sh }, screen: settings, crop, masks, index: lookIndex, seed: lookIndex });
    body = `${g.graph};[look]trim=duration=${kitNum(len)},setpts=PTS-STARTPTS,format=yuv420p,setsar=1[v]`;
  } else {
    const { chains, head } = cutPlainHead('src', sw, sh, crop, masks);
    body = [...chains, `${head},${cutPlainFit(entryFit || 'cover', W, H)},setsar=1,trim=duration=${kitNum(len)},setpts=PTS-STARTPTS,format=yuv420p[v]`].join(';');
  }
  return cutEncodeBeat(ctx, args, `${pre};${body}`, name);
}

async function cutEncodeBeat(ctx, args, graph, name) {
  const path = join(ctx.tmpDir, `${name}.mp4`);
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph, '-map', '[v]', '-an', ...ctx.tools.encodeArgs('h264-intermediate'), path]);
  return path;
}

/** The clip lengths of every window beat, by scene index. */
async function cutWindowLengths(ctx, sources) {
  const lengths = new Map();
  for (const s of sources) if (s.kind === 'window') lengths.set(s.index, await kitMediaLength(ctx, cutEntryFile(s.entry)));
  return lengths;
}

function cutWindowsOut(beats) {
  return beats
    .filter((b) => b.kind === 'window' || b.kind === 'still')
    .map((b) => ({ scene_id: b.scene.id, start_s: +b.start_s.toFixed(3), end_s: +b.end_s.toFixed(3), speed: +b.speed.toFixed(4) }));
}

// ---- scenes ----

async function cutScenes(inputs, ctx, manifest) {
  const W = inputs.width ?? 1080;
  const H = inputs.height ?? 1920;
  const fps = inputs.fps ?? 30;
  if (W % 2 || H % 2) throw ctx.error('bad_input', `the frame ${W}x${H} must have even sides`);
  if (inputs.audio) throw ctx.error('bad_input', 'scenes mode makes a silent cut');
  const lead = inputs.lead ? inputs.lead.video : null;
  const sources = cutSceneSources(inputs.scenes, inputs.footage, { lead, need: 'all' });
  if (lead && !sources.some((s) => s.kind === 'lead')) ctx.log.warn('the lead clip is not used: the first scene has its own footage or image');
  const dissolve = inputs.transition?.dissolve_frames ?? 0;
  const { beats, seconds } = cutPlanScenes(sources, {
    lengths: await cutWindowLengths(ctx, sources),
    leadS: lead ? await kitDuration(ctx, lead) : 0,
    fps,
    scene_seconds: inputs.scene_seconds,
    still_seconds: inputs.still_seconds,
    speed: inputs.speed ?? 'fill',
    min_speed: inputs.min_speed ?? 0.5,
    max_speed: inputs.max_speed ?? 2,
    dissolve_frames: dissolve,
  });
  cutCheckOrder(beats, inputs.order ?? 'forward');
  cutCheckProjectedSize(seconds);
  const extraS = dissolve / fps;
  const paths = [];
  let lookIndex = 0;
  for (const [i, b] of beats.entries()) {
    const usesLook = b.kind !== 'lead';
    paths.push(
      await cutRenderBeat(ctx, b, {
        W,
        H,
        fps,
        look: inputs.look ?? 'plain',
        screen: inputs.screen,
        fit: inputs.fit,
        lookIndex: usesLook ? lookIndex : 0,
        seconds: b.seconds,
        extraS: i + 1 < beats.length ? extraS : 0,
        name: `beat-${i + 1}`,
        lead,
      }),
    );
    if (usesLook) lookIndex++;
    ctx.progress({ done: i + 1, total: beats.length + 1 });
  }
  const args = paths.flatMap((p) => ['-i', p]);
  const norm = paths.map((_, i) => `[${i}:v]fps=${fps},settb=AVTB,setsar=1,format=yuv420p[n${i}]`);
  let graph;
  if (paths.length === 1) graph = [...norm, `[n0]null[v]`];
  else if (dissolve > 0) {
    graph = [...norm];
    let prev = 'n0';
    for (let i = 1; i < paths.length; i++) {
      const outLabel = i + 1 < paths.length ? `x${i}` : 'v';
      graph.push(`[${prev}][n${i}]xfade=transition=fade:duration=${kitNum(extraS)}:offset=${kitNum(beats[i].start_s)}[${outLabel}]`);
      prev = outLabel;
    }
  } else graph = [...norm, `${paths.map((_, i) => `[n${i}]`).join('')}concat=n=${paths.length}:v=1:a=0[v]`];
  const out = join(ctx.workDir, 'scenes.mp4');
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph.join(';'), '-map', '[v]', '-an', ...cutMasterArgs(ctx), '-t', kitNum(seconds), out]);
  cutCheckSize(ctx, out);
  const video = await ctx.file('scenes.mp4', 'video');
  const timeline = {
    duration_s: +seconds.toFixed(3),
    width: W,
    height: H,
    fps,
    scenes: beats.map((b) => ({ id: String(b.scene.id), start_s: +b.start_s.toFixed(3), end_s: +b.end_s.toFixed(3) })),
    speech: [],
  };
  ctx.log.info('scenes cut', { beats: beats.length, seconds: +seconds.toFixed(3), dissolve_frames: dissolve });
  return kitCheckOutputs(ctx, manifest, { video, seconds: +seconds.toFixed(3), timeline, windows: cutWindowsOut(beats) });
}

// ---- inserts ----

async function cutInserts(inputs, ctx, manifest) {
  const info = await ctx.tools.probe(inputs.video.path);
  const W = info.width;
  const H = info.height;
  const fps = info.fps || inputs.timeline.fps || 30;
  if (W % 2 || H % 2) throw ctx.error('bad_input', `the talking track ${W}x${H} must have even sides`);
  const dur = await kitDuration(ctx, inputs.video);
  cutCheckProjectedSize(dur);
  const sources = cutSceneSources(inputs.scenes, inputs.footage, { need: 'any' }).filter((s) => s.kind === 'window' || s.kind === 'still');
  if (!sources.length) throw ctx.error('bad_input', 'no scene has footage or an image to insert');
  const spans = new Map(inputs.timeline.scenes.map((s) => [String(s.id), s]));
  const joins = (inputs.joins || []).map((t) => t.start_s).filter((s) => s > 0.05);
  const slots = cutPlaceInserts(sources, spans, { joins, duration: dur, fps });
  const lengths = await cutWindowLengths(ctx, slots);
  const opts = { speed: inputs.speed ?? 'fill', min_speed: inputs.min_speed ?? 0.5, max_speed: inputs.max_speed ?? 2 };
  const beats = slots.map((s) => {
    const seconds = s.end_s - s.start_s;
    if (s.kind !== 'window') return { ...s, seconds, speed: 1 };
    const range = cutInsertRange(s, cutWindow(s.entry, lengths.get(s.index)), seconds, opts, `the insert for scene "${s.scene.id}"`);
    return { ...s, seconds, ...range };
  });
  cutCheckOrder(beats, inputs.order ?? 'forward');
  const paths = [];
  for (const [i, b] of beats.entries()) {
    paths.push(await cutRenderBeat(ctx, b, { W, H, fps, look: inputs.look ?? 'plain', screen: inputs.screen, fit: inputs.fit, lookIndex: i, seconds: b.seconds, extraS: 0, name: `insert-${i + 1}` }));
    if (b.stretched_s > 0) ctx.log.info('insert stretched over a take join', { scene_id: b.scene.id, stretched_s: +b.stretched_s.toFixed(3) });
    if (b.early_s > 0) ctx.log.info('insert started early over a take join', { scene_id: b.scene.id, early_s: +b.early_s.toFixed(3), window_extended_s: +(b.extended_s || 0).toFixed(3) });
  }
  const args = ['-i', inputs.video.path, ...paths.flatMap((p) => ['-i', p])];
  const graph = [`[0:v]fps=${fps},setsar=1,format=yuv420p[b0]`];
  beats.forEach((b, i) => {
    graph.push(`[${i + 1}:v]fps=${fps},setsar=1,format=yuv420p,setpts=PTS-STARTPTS+${kitNum(b.start_s)}/TB[i${i}]`);
    const outLabel = i + 1 < beats.length ? `b${i + 1}` : 'v';
    graph.push(`[b${i}][i${i}]overlay=0:0:eof_action=pass:enable='between(t,${kitNum(b.start_s)},${kitNum(b.end_s - 0.5 / fps)})'[${outLabel}]`);
  });
  const map = ['-map', '[v]'];
  if (info.has_audio) map.push('-map', '0:a', '-c:a', 'copy');
  const out = join(ctx.workDir, 'inserts.mp4');
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph.join(';'), ...map, ...cutMasterArgs(ctx), '-t', kitNum(dur), out]);
  cutCheckSize(ctx, out);
  const video = await ctx.file('inserts.mp4', 'video');
  const timeline = { ...inputs.timeline };
  ctx.log.info('inserts laid over the talking track', { inserts: beats.length, joins: joins.length });
  return kitCheckOutputs(ctx, manifest, { video, seconds: +dur.toFixed(3), timeline, windows: cutWindowsOut(beats) });
}
