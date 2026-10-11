// Built from lipsync-veed/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- lipsync-veed/src/part.mjs ----
// lipsync-veed: approved audio drives a face, with Veed Fabric 1.0 on fal
// (veed/fabric-1.0). The create-lipsync-veed-fal atom and the podcast skit's
// gen_paid.py clips and idle steps in JavaScript: every spoken scene's own
// line audio (from the voice step) is sent with its speaker's still (from the
// plate step's singles) as {image_url, audio_url, resolution}, one piece per
// line, named by scene id so a fix can reuse the lines it did not touch. With
// idle_seconds > 0, each face is also driven by that much silence: the mouth
// stays shut and the head and eyes keep their own motion, which is the
// "listening" clip a split screen loops under the other speaker. Everything
// is checked and priced before the first piece is ordered: a spoken scene
// with no face or no audio is refused, and so is a line for a scene that
// is not in scenes (stale voice output) or more lipsync than max_seconds.

const MODEL = 'veed/fabric-1.0';
// Veed returns clips a few milliseconds short; a clip far from its audio is broken.
const DRIFT_S = 0.5;
const DRIFT_SHARE = 0.2;

function sceneId(scene, index) {
  return scene.id == null ? String(index + 1) : String(scene.id);
}

function lineText(scene) {
  return String(scene.line == null ? '' : scene.line).replace(/\s+/g, ' ').trim();
}

/** Spoken scenes with their face and audio, or a plain reason to refuse. */
function planLines(inputs) {
  const faces = new Map();
  for (const f of inputs.faces) {
    if (faces.has(f.key)) return { problem: `two faces have the key "${f.key}"` };
    faces.set(f.key, f);
  }
  const audio = new Map();
  for (const l of inputs.lines) {
    if (audio.has(l.scene_id)) return { problem: `two lines are for scene ${l.scene_id}` };
    audio.set(l.scene_id, l.audio);
  }
  const known = new Set();
  for (const [index, scene] of inputs.scenes.entries()) {
    const id = sceneId(scene, index);
    if (known.has(id)) return { problem: `two scenes have the id ${id}` };
    known.add(id);
  }
  for (const id of audio.keys()) {
    if (!known.has(id)) return { problem: `lines has audio for scene ${id}, which is not in scenes` };
  }
  const only = inputs.faces.length === 1 ? inputs.faces[0] : null;
  const spoken = [];
  for (const [index, scene] of inputs.scenes.entries()) {
    if (!lineText(scene)) continue;
    const id = sceneId(scene, index);
    const speaker = scene.speaker == null || scene.speaker === '' ? null : String(scene.speaker);
    const face = speaker ? faces.get(speaker) : only;
    if (!face) return { problem: speaker ? `scene ${id} is spoken by "${speaker}", who has no face` : `scene ${id} has a line but no speaker, and there is more than one face` };
    const file = audio.get(id);
    if (!file) return { problem: `scene ${id} has a line but no audio in lines` };
    spoken.push({ id, index, face, audio: file });
  }
  return { spoken };
}

/** A silent WAV of `seconds` in the work folder (bit-exact, so its hash and its piece stay stable). */
async function silence(ctx, seconds) {
  const name = `idle-silence-${kitNum(seconds, 3)}s.wav`;
  await kitFfmpeg(ctx, ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', kitNum(seconds, 3), '-c:a', 'pcm_s16le', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', join(ctx.workDir, name)]);
  return ctx.file(name, 'audio');
}

/** One Veed piece: the face, the audio, and a check that a picture came back about as long as the audio. */
async function lipsync(ctx, piece, face, audio, seconds, resolution) {
  kitStopIfAborted(ctx);
  const body = { image_url: face.image, audio_url: audio, resolution };
  const name = `${piece}.mp4`;
  const result = await ctx.line.order({ piece, provider: 'fal', path: MODEL, body, results: [{ pointer: '/json/video/url', name, media: 'video' }] });
  const video = result && result.files && result.files[name];
  if (!video) throw ctx.error('provider_failed', `no video for ${piece}`);
  const info = await ctx.tools.probe(video.path);
  if (!info.has_video) throw ctx.error('provider_failed', `${piece} came back with no picture`);
  const got = Number.isFinite(video.duration_s) && video.duration_s > 0 ? video.duration_s : info.duration_s;
  if (!Number.isFinite(got) || got <= 0) throw ctx.error('provider_failed', `${piece} came back with no length`);
  if (Math.abs(got - seconds) > Math.max(DRIFT_S, DRIFT_SHARE * seconds)) {
    throw ctx.error('provider_failed', `${piece} is ${got.toFixed(2)}s for ${seconds.toFixed(2)}s of audio`);
  }
  return { video, seconds: +got.toFixed(3) };
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { spoken, problem } = planLines(inputs);
  if (problem) throw ctx.error('bad_input', problem);
  const idleSeconds = inputs.idle_seconds ?? 0;
  if (!spoken.length && !idleSeconds) throw ctx.error('bad_input', 'no scene has a line to lipsync and idle_seconds is 0');
  for (const s of spoken) s.seconds = await kitDuration(ctx, s.audio);
  const lineSeconds = spoken.reduce((a, s) => a + s.seconds, 0);
  const total = lineSeconds + idleSeconds * inputs.faces.length;
  if (total > inputs.max_seconds + 1e-6) {
    throw ctx.error('bad_input', `the lines and idle clips need ${total.toFixed(2)}s of lipsync, more than max_seconds ${inputs.max_seconds}`);
  }

  const resolution = inputs.resolution ?? '720p';
  const jobs = spoken.length + (idleSeconds ? inputs.faces.length : 0);
  const used = new Set();
  const clips = [];
  for (const s of spoken) {
    const piece = kitPieceName('clip', s.id, s.index, used);
    const made = await lipsync(ctx, piece, s.face, s.audio, s.seconds, resolution);
    clips.push({ id: s.id, ...made });
    ctx.progress({ done: clips.length, total: jobs });
  }
  const idle = [];
  if (idleSeconds) {
    const quiet = await silence(ctx, idleSeconds);
    for (const [i, face] of inputs.faces.entries()) {
      const piece = kitPieceName('idle', face.key, i, used);
      const made = await lipsync(ctx, piece, face, quiet, idleSeconds, resolution);
      idle.push({ key: face.key, ...made });
      ctx.progress({ done: clips.length + idle.length, total: jobs });
    }
  }
  return kitCheckOutputs(ctx, manifest, { clips, idle });
}
