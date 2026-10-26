// Built from read-labels/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- read-labels/src/part.mjs ----
// read-labels: is the product's label spelled right in the cut? A timeline step that runs before the layers
// (GOOSE-4034). Video models redraw a held pack's lettering and get it wrong ("Acne-Prone" came back as
// "Acce-Prone"), and nothing measured that: the check layer marks text_legible "needs eyes". This step sends
// the real product photo and frames of the cut to a vision model, which reads the large words on the pack in
// both and names any word that is clearly readable and spelled differently. A misspelled word stops the run
// with the frame time and both spellings, so the video is not called ready (on_misspelled "fail", the default);
// "report" returns what was read with a failing verdict. Like every check part it never changes the video: it
// returns a verdict (one check, flag:text_legible, in the check layer's shape) and what was read.

const ENDPOINT = 'openrouter/router/vision';
const MODEL = 'anthropic/claude-sonnet-5.5';
// Frames read per cut: two per scene (a third and two thirds in), the end card left out, at most this many.
const MAX_FRAMES = 16;

/** The times to read: two per scene span, inside the span, never inside the end card. */
export function labelFrameTimes(timeline, duration) {
  const card = timeline && timeline.end_card;
  const inCard = (t) => card && t >= card.start_s && t < card.end_s;
  const spans = (timeline && timeline.scenes && timeline.scenes.length ? timeline.scenes : [{ id: null, start_s: 0, end_s: duration }])
    .filter((s) => s.end_s > s.start_s);
  const out = [];
  for (const s of spans) {
    for (const share of [1 / 3, 2 / 3]) {
      const t = Math.round((s.start_s + (s.end_s - s.start_s) * share) * 1000) / 1000;
      if (t < duration && !inCard(t)) out.push({ t_s: t, scene_id: s.id == null ? null : String(s.id) });
    }
  }
  if (out.length <= MAX_FRAMES) return out;
  // Too many: keep an even spread, first and last included.
  return Array.from({ length: MAX_FRAMES }, (_, i) => out[Math.round((i * (out.length - 1)) / (MAX_FRAMES - 1))]);
}

/** The instruction: image 1 is the real pack, images 2 on are the frames in order. */
export function labelPrompt(name, times) {
  const frames = times.map((f, i) => `image ${i + 2} is the frame at ${f.t_s} s`).join('; ');
  return [
    `Image 1 is a photo of the real product${name ? `, ${name}` : ''}. The other images are frames from a video of it, in order: ${frames}.`,
    'Step 1: list the large printed words on the real product in image 1: the brand name, the product name and any other line in large type. Leave out small print.',
    'Step 2: for each frame, say whether the product is in it, and read the same large words as printed on it in that frame. Read a word only when you can read every letter clearly. A word hidden by a hand, cut off by the frame edge, blurred, too small, or turned too far to read is not read.',
    'Step 3: a word read in a frame is misspelled when its letters differ from the same word on the real product: a missing, extra or changed letter. Different capitals, a word not read, or a word that is not on the real product at all are not misspellings.',
    'Step 4: for each frame with the product, say whether its printed text is mirrored: letters reversed and words reading right to left, as in a selfie camera that flips the picture. Compare with image 1, whose text reads normally.',
    'Reply with JSON only, no other text, in this shape: {"label_words": ["..."], "frames": [{"image": 2, "product_seen": true, "mirrored": false, "words_read": ["..."], "misspelled": [{"read": "...", "should_be": "..."}]}]}',
  ].join('\n');
}

/** The model's reply as {label_words, frames}, or null when it is not that JSON. */
export function parseLabelReply(text) {
  if (typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let j;
  try {
    j = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!j || !Array.isArray(j.frames)) return null;
  const words = (v) => (Array.isArray(v) ? v.filter((w) => typeof w === 'string' && w.trim()).map((w) => w.trim()) : []);
  return {
    label_words: words(j.label_words),
    frames: j.frames
      .filter((f) => f && Number.isInteger(f.image))
      .map((f) => ({
        image: f.image,
        product_seen: f.product_seen === true,
        mirrored: f.product_seen === true && f.mirrored === true,
        words_read: words(f.words_read),
        misspelled: (Array.isArray(f.misspelled) ? f.misspelled : [])
          .filter((m) => m && typeof m.read === 'string' && typeof m.should_be === 'string' && m.read.trim() && m.should_be.trim())
          // The same letters in other capitals is not a misspelling, whatever the model says.
          .filter((m) => m.read.trim().toLowerCase() !== m.should_be.trim().toLowerCase())
          .map((m) => ({ read: m.read.trim(), should_be: m.should_be.trim() })),
      })),
  };
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const product = (inputs.products || []).find((p) => Array.isArray(p.images) && p.images.length);
  if (!product) throw ctx.error('bad_input', 'read-labels needs a product with a photo to compare the label against');
  const duration = await kitDuration(ctx, inputs.video);
  const times = labelFrameTimes(inputs.timeline, duration);
  if (!times.length) throw ctx.error('bad_input', 'the cut has no frame outside the end card to read');

  const frames = [];
  for (const [i, f] of times.entries()) {
    const name = `label-${i + 1}.jpg`;
    // -ss after -i: the frame at exactly t, not the keyframe before it.
    await kitFfmpeg(ctx, ['-i', inputs.video.path, '-ss', String(f.t_s), '-frames:v', '1', '-q:v', '3', join(ctx.tmpDir, name)]);
    frames.push(await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/${name}`, 'image'));
  }
  const result = await ctx.line.order({
    piece: 'read-labels',
    provider: 'fal',
    path: ENDPOINT,
    body: {
      model: MODEL,
      system_prompt: 'You check the printed label of a product in frames from a generated video against a photo of the real product. You answer with JSON only.',
      prompt: labelPrompt(product.name || null, times),
      image_urls: [product.images[0], ...frames],
      // The model must reason (the endpoint refuses it off), and with reasoning on the temperature stays default.
      reasoning: true,
      max_tokens: 3000,
    },
    results: [],
  });
  ctx.progress({ done: 1, total: 1 });
  const reply = parseLabelReply(result && result.json && result.json.output);
  if (!reply) throw ctx.error('provider_failed', 'the label reader did not answer in the JSON asked for');

  const read = times.map((f, i) => {
    const r = reply.frames.find((x) => x.image === i + 2) || { product_seen: false, mirrored: false, words_read: [], misspelled: [] };
    return { t_s: f.t_s, scene_id: f.scene_id, product_seen: r.product_seen, mirrored: r.mirrored, words_read: r.words_read, misspelled: r.misspelled };
  });
  const wrong = read.filter((f) => f.misspelled.length);
  const flipped = read.filter((f) => f.mirrored);
  const labels = { model: MODEL, label_words: reply.label_words, frames: read, misspelled: wrong.length, mirrored: flipped.length };
  const seen = read.filter((f) => f.product_seen).length;
  const list = wrong
    .slice(0, 4)
    .map((f) => `${f.misspelled.map((m) => `"${m.read}" for "${m.should_be}"`).join(', ')} at ${f.t_s} s${f.scene_id ? ` (scene ${f.scene_id})` : ''}`)
    .join('; ');
  const flips = flipped.slice(0, 4).map((f) => `${f.t_s} s${f.scene_id ? ` (scene ${f.scene_id})` : ''}`).join(', ');
  const bad = wrong.length || flipped.length;
  const message = bad
    ? [wrong.length ? `The product label is misspelled in ${wrong.length} of ${read.length} frames read: ${list}.` : '', flipped.length ? `The product label is mirrored in ${flipped.length} of ${read.length} frames read, at ${flips}.` : ''].filter(Boolean).join(' ')
    : seen
      ? `The product label reads right in all ${seen} frames that show it.`
      : 'The product was not seen in any frame read.';
  const status = bad ? 'fail' : seen ? 'pass' : 'not_applicable';
  const verdict = {
    pass: !bad,
    checks: [{ code: 'flag:text_legible', status, message, found: bad ? [list, flips && `mirrored at ${flips}`].filter(Boolean).join('; ') : reply.label_words.join(', ') || null }],
    reasons: bad ? [{ check: 'flag:text_legible', message, expected: reply.label_words.join(', '), found: [list, flips && `mirrored at ${flips}`].filter(Boolean).join('; ') }] : [],
  };
  if (bad && (inputs.on_misspelled ?? 'fail') === 'fail') throw ctx.error('output_invalid', `${message} Make that scene again.`);
  if (bad) ctx.log.warn(message, { frames: [...wrong, ...flipped] });
  return kitCheckOutputs(ctx, manifest, { verdict, labels });
}
