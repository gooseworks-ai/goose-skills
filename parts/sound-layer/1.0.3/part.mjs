// Built from sound-layer/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
import { readFile, rename } from 'node:fs/promises';
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

// ---- sound-layer/src/part.mjs ----
// sound-layer: levels the finished cut to -14 LUFS integrated with the true
// peak at or below -1 dBTP (D16: mix-master's finish mode, one loudness
// target for every video). Two-pass loudnorm in linear mode from a measured
// first pass, then an EBU R128 check of the encoded result. Outside the target,
// corrections re-level the source through an oversampled limiter, searching
// the gain inside a bracket and lowering the limiter's ceiling by whatever the
// AAC encode added; still outside after them, the step fails. A silent cut (at
// or below -50 LUFS) passes through untouched.

const TARGET_LUFS = -14;
const TOLERANCE_LU = 1;
// Corrections are an audio-only encode and a meter pass each: cheap enough to search with.
const MAX_CORRECTIONS = 8;
const TARGET_TP = -1;
// loudnorm aims below the ceiling: the AAC encode after it can add a few tenths of a dB of peak.
const LOUDNORM_TP = -1.5;
// The corrections' first limiter ceiling, in dBFS; the AAC encode adds up to about 1 dB, and a pass that
// still goes over lowers it.
const LIMIT_DB = -2;
// A cut that starts at full level makes the AAC encoder's first frame overshoot by up to 4 dB: every
// chain fades the first 20 ms in.
const FADE_IN = 'afade=t=in:d=0.02';
// Kept between the measured peak and the ceiling when a pass lowers it.
const PEAK_MARGIN_DB = 0.3;
// At or below this a cut is near silence (faint UI sounds, no bed): lifting it to the target fails.
const SILENT_LUFS = -50;
// ffmpeg 6.0 leaves the channel layout unset after loudnorm and alimiter, and the AAC encode then
// cannot pick one ("Cannot select channel layout"): every chain names stereo before its last resample.
const STEREO = 'aformat=channel_layouts=stereo';

function loudnormJson(stderr) {
  const blocks = stderr.match(/\{[^{}]*\}/g);
  if (!blocks) return null;
  try {
    return JSON.parse(blocks.at(-1));
  } catch {
    return null;
  }
}

function within(m) {
  return m.lufs !== null && Math.abs(m.lufs - TARGET_LUFS) <= TOLERANCE_LU && m.true_peak_db !== null && m.true_peak_db <= TARGET_TP;
}

/** Gain, then a peak limiter at `limitDb` run at 192 kHz (it holds inter-sample peaks), back to 48 kHz stereo. */
function limited(gainDb, limitDb) {
  // alimiter takes a ceiling from 0.0625 (-24 dBFS) to 1.
  const ceiling = Math.min(1, Math.max(0.0625, 10 ** (limitDb / 20)));
  return `volume=${kitNum(gainDb, 3)}dB,aresample=192000,alimiter=limit=${kitNum(ceiling, 4)}:level=0:attack=1:release=50,${STEREO},aresample=48000,${FADE_IN}`;
}

/** The next gain to try: inside the bracket when there is one, else a step from the nearest side. */
function nextGain(under, over) {
  if (under && over) {
    const span = over.gain - under.gain;
    const t = (TARGET_LUFS - under.lufs) / (over.lufs - under.lufs || 1);
    // Interpolate, but never into the outer tenths of the bracket, where it stalls: halve instead.
    return under.gain + span * (t > 0.1 && t < 0.9 ? t : 0.5);
  }
  // One side only: at least the whole shortfall (loudness never rises faster than gain), at most twice it.
  if (under) return under.gain + 2 * (TARGET_LUFS - under.lufs);
  return over.gain - 2 * (over.lufs - TARGET_LUFS);
}

async function encode(ctx, video, filter, out) {
  await kitFfmpeg(ctx, [
    '-i',
    video,
    '-map',
    '0:v:0',
    '-map',
    '0:a:0',
    '-c:v',
    'copy',
    '-af',
    filter,
    ...ctx.tools.encodeArgs('aac'),
    '-movflags',
    '+faststart',
    join(ctx.tmpDir, out),
  ]);
  return join(ctx.tmpDir, out);
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const info = await ctx.tools.probe(inputs.video.path);
  const first = info.has_audio ? await kitLoudness(ctx, inputs.video.path) : { lufs: null };
  if (first.lufs === null || !Number.isFinite(first.lufs) || first.lufs <= SILENT_LUFS) {
    // A silent cut (no music chosen, no voice) has nothing to level: it passes through untouched.
    ctx.log.info('sound layer passes a silent cut through', { has_audio: info.has_audio, lufs: first.lufs });
    return kitCheckOutputs(ctx, manifest, { video: inputs.video, timeline: inputs.timeline });
  }
  // Pass 1: measure for loudnorm. A target range at least the input's keeps it linear (a pure gain).
  const { stderr } = await kitFfmpeg(ctx, ['-i', inputs.video.path, '-map', '0:a:0', '-af', `loudnorm=I=${TARGET_LUFS}:TP=${LOUDNORM_TP}:LRA=11:print_format=json`, '-f', 'null', '-']);
  const m = loudnormJson(stderr);
  if (!m) throw ctx.error('tool_failed', 'loudnorm printed no measurement');
  const lra = Math.min(50, Math.max(11, Math.ceil(Number(m.input_lra) + 1)));
  const pass2 =
    `loudnorm=I=${TARGET_LUFS}:TP=${LOUDNORM_TP}:LRA=${lra}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:` +
    `measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,${STEREO},aresample=48000,${FADE_IN}`;
  let path = await encode(ctx, inputs.video.path, pass2, 'levelled.mp4');
  let after = await kitLoudness(ctx, path);
  // Corrections re-level the source (never a pass's own AAC, so encodes do not stack) through a limiter run
  // oversampled so it holds inter-sample peaks. Loudness rises with gain but not linearly (the limiter eats
  // more of a peaky cut the harder it is driven), so the gain is searched inside a bracket: the highest gain
  // that came out too quiet and the lowest that came out too loud, by interpolation, else halving. The AAC
  // encode can add peak again, so a pass over the ceiling lowers the limiter's ceiling and restarts the
  // bracket. Only a pass inside both targets is used.
  let limit = LIMIT_DB;
  let under = first.lufs < TARGET_LUFS ? { gain: 0, lufs: first.lufs } : null;
  let over = first.lufs > TARGET_LUFS ? { gain: 0, lufs: first.lufs } : null;
  let gain = TARGET_LUFS - first.lufs;
  for (let pass = 1; !within(after) && pass <= MAX_CORRECTIONS; pass++) {
    ctx.log.info('sound layer correction pass', { pass, lufs: after.lufs, true_peak_db: after.true_peak_db, gain_db: +gain.toFixed(2), limit_db: +limit.toFixed(2) });
    path = await encode(ctx, inputs.video.path, limited(gain, limit), `levelled-${pass + 1}.mp4`);
    after = await kitLoudness(ctx, path);
    if (after.lufs === null || after.true_peak_db === null) break;
    if (after.true_peak_db > TARGET_TP) {
      limit -= after.true_peak_db - TARGET_TP + PEAK_MARGIN_DB;
      under = null;
      over = null;
      continue;
    }
    if (after.lufs < TARGET_LUFS) under = { gain, lufs: after.lufs };
    else over = { gain, lufs: after.lufs };
    gain = nextGain(under, over);
  }
  if (!within(after)) {
    throw ctx.error('output_invalid', `levelled to ${after.lufs} LUFS, true peak ${after.true_peak_db} dBTP; the target is ${TARGET_LUFS} +/-${TOLERANCE_LU} LUFS at or below ${TARGET_TP} dBTP`);
  }
  ctx.log.info('sound layer levelled', { lufs_before: first.lufs, lufs_after: after.lufs, true_peak_db: after.true_peak_db });
  // Only the chosen pass leaves scratch, as the step's one output.
  await rename(path, join(ctx.workDir, 'levelled.mp4'));
  const video = await ctx.file('levelled.mp4', 'video');
  return kitCheckOutputs(ctx, manifest, { video, timeline: inputs.timeline });
}
