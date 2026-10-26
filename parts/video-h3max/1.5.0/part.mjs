// Built from video-h3max/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
import { createHash } from 'node:crypto';
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

// ---- _lib/scene-match.mjs ----
// Which scenes a generation part makes, and what each scene names: its tag
// ("Product: ..." or extra.shot), the cast members it names and the products it
// names. Pure functions over plan scenes, cast and products. Bundled into
// parts; every top-level name starts with `kit` (parts/_tools/bundle.mjs).

// A leading tag in a picture: one or two words, a colon, then a space ("Product: the jar on a table"),
// or the tag alone ("Product:", whose picture is then empty and refuses a required {picture}).
// "10:30" and "https://" are not tags (a tag starts with a letter and the colon is followed by a space or the end).
const KIT_TAG_RE = /^\s*([A-Za-z][A-Za-z0-9_-]*(?: [A-Za-z0-9_-]+)?)\s*:(?:\s+(?=\S)|\s*$)/;

/** The picture text of a scene, or '' when the picture is a file or empty. */
function kitScenePictureText(scene) {
  return scene && typeof scene.picture === 'string' ? scene.picture : '';
}

/** A tag compared without case or spacing differences: "Close up" = "close-up" = "CLOSE_UP". */
function kitTagKey(tag) {
  return String(tag == null ? '' : tag)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The scene's tag: `scene.extra.shot` when it is a non-empty string, else the
 * leading "Tag:" of its picture text (without the colon), else null.
 */
function kitSceneTag(scene) {
  const shot = scene && scene.extra && scene.extra.shot;
  if (typeof shot === 'string' && shot.trim()) return shot.trim();
  const m = KIT_TAG_RE.exec(kitScenePictureText(scene));
  return m ? m[1] : null;
}

/**
 * The picture text with its leading "Tag:" removed, when that tag is one of
 * `tags` (compared with kitTagKey). Any other leading word with a colon stays,
 * because it may be a person ("Maya: holds the jar").
 */
function kitPictureWithoutTag(scene, tags) {
  const text = kitScenePictureText(scene);
  const m = KIT_TAG_RE.exec(text);
  if (!m) return text.trim();
  const keys = new Set((tags || []).map(kitTagKey));
  return keys.has(kitTagKey(m[1])) ? text.slice(m[0].length).trim() : text.trim();
}

/**
 * A case-insensitive pattern for `phrase` as whole words (any run of spaces
 * between its words), or null for an empty phrase.
 */
function kitWholeWordsRe(phrase) {
  const want = String(phrase == null ? '' : phrase).trim();
  if (!want) return null;
  const words = want.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}])${words}(?![\\p{L}\\p{N}])`, 'iu');
}

/** True when `name` appears in `text` as whole words, ignoring case ("Maya's" names Maya; "Mayan" does not). */
function kitNamesWord(text, name) {
  const re = kitWholeWordsRe(name);
  return Boolean(re && text && re.test(String(text)));
}

/**
 * The cast members a scene names: the speaker first (scene.speaker is a cast
 * key), then, in cast order, every other member whose name is a whole word in
 * the scene's picture or line. Members without a name are only found as the speaker.
 */
function kitNamedCast(scene, cast) {
  const members = Array.isArray(cast) ? cast.filter((m) => m && typeof m === 'object') : [];
  const out = [];
  const speaker = scene && scene.speaker != null ? members.find((m) => m.key === scene.speaker) : null;
  if (speaker) out.push(speaker);
  const text = [kitScenePictureText(scene), scene && typeof scene.line === 'string' ? scene.line : ''].join('\n');
  for (const m of members) {
    if (out.includes(m)) continue;
    if (kitNamesWord(text, m.name)) out.push(m);
  }
  return out;
}

// The product matcher of phone-chat 1.2.0 (src/threads.mjs chatNames), so a scene names the same
// product in every part: its id or whole name, or at least two of its name's words (all of a
// one-word name), ignoring case; a word also matches its stem when both are at least four letters.
const KIT_PLAIN_WORDS = new Set(['a', 'an', 'the', 'of', 'its', 'it', 'this', 'that', 'these', 'those', 'them', 'one', 'my', 'our', 'your', 'their', 'his', 'her', 'show', 'shows', 'showing', 'send', 'sends', 'here', 'look', 'see', 'new', 'product', 'products', 'item', 'photo', 'photos', 'picture', 'pictures', 'pic', 'pics', 'image', 'images', 'shot', 'shots', 'snap', 'snaps', 'and', 'with', 'in', 'on', 'at', 'is']);

function kitWords(text) {
  return String(text || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}

function kitSameWord(a, b) {
  return a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)));
}

/** How strongly `text` names `product`: 0, Infinity for its id or whole name, else the count of its name's words used. */
function kitProductMatch(text, product) {
  if (!product || product.id == null) return 0;
  const want = String(text || '').trim().toLowerCase();
  if (!want) return 0;
  const id = String(product.id).toLowerCase();
  if (id === want || String(product.name || '').toLowerCase() === want) return Infinity;
  const said = kitWords(want);
  if (said.includes(id)) return Infinity;
  const name = kitWords(product.name).filter((w) => !KIT_PLAIN_WORDS.has(w) && (w.length >= 3 || /\d/.test(w)));
  const used = name.filter((w) => said.some((t) => kitSameWord(t, w))).length;
  return name.length && used >= Math.min(2, name.length) ? used : 0;
}

/**
 * The products a scene's picture text names, strongest match first and, on a
 * tie, the longest name first (then plan order).
 */
function kitNamedProducts(scene, products) {
  const text = kitScenePictureText(scene);
  const list = Array.isArray(products) ? products : [];
  return list
    .map((p, i) => ({ p, i, n: kitProductMatch(text, p), len: String((p && p.name) || '').length }))
    .filter((m) => m.n > 0)
    .sort((a, b) => (b.n === a.n ? 0 : b.n > a.n ? 1 : -1) || b.len - a.len || a.i - b.i)
    .map((m) => m.p);
}

function kitHasPicture(scene) {
  if (!scene) return false;
  if (scene.image && typeof scene.image === 'object') return true;
  if (scene.picture && typeof scene.picture === 'object') return true;
  return typeof scene.picture === 'string' && scene.picture.trim().length > 0;
}

/**
 * The scenes a part makes, as [{scene, index}] where index is the scene's
 * place in the full plan. `skip_first` and `skip_last` drop scenes from the
 * ends of the plan first (an end card scene, a reused hook); then `pick` chooses:
 *   'all' (default) | 'first' | 'with_picture' (a picture text or file, or scene.image)
 *   | {tags: [...]} (kitSceneTag, compared with kitTagKey)
 * Throws on any other pick.
 */
function kitPickScenes(scenes, pick = 'all', options = {}) {
  const list = (Array.isArray(scenes) ? scenes : []).map((scene, index) => ({ scene, index }));
  const first = Math.max(0, Math.floor(Number(options.skip_first) || 0));
  const last = Math.max(0, Math.floor(Number(options.skip_last) || 0));
  const kept = list.slice(first, Math.max(first, list.length - last));
  const how = pick == null ? 'all' : pick;
  if (how === 'all') return kept;
  if (how === 'first') return kept.slice(0, 1);
  if (how === 'with_picture') return kept.filter((s) => kitHasPicture(s.scene));
  if (how && typeof how === 'object' && !Array.isArray(how) && Array.isArray(how.tags)) {
    const keys = new Set(how.tags.map(kitTagKey).filter(Boolean));
    return kept.filter((s) => keys.has(kitTagKey(kitSceneTag(s.scene))));
  }
  throw new Error(`pick must be 'all', 'first', 'with_picture' or {tags: [...]}, not ${JSON.stringify(pick)}`);
}

// ---- _lib/prompt.mjs ----
// Prompt templates for generation parts. A style ships a template as a frame
// file (frames/<name>.prompt.json); a part loads it with kitLoadTemplate and
// fills one prompt per scene with kitScenePrompts, which refuses the whole step
// before any piece is ordered when a scene lacks a placeholder's value.
// Bundled into parts; every top-level name starts with `kit`.
//
// Template (version 1; unknown keys are refused):
//   prefix, suffix         text put before and after every prompt
//   scene                  the per-scene text (default "{picture}")
//   motion                 the per-scene motion text for video parts
//   anchor                 a cast member's portrait text ({name}, {look} = the member's look)
//   negative               the negative prompt
//   looks                  {key: text}: the art styles; {look} is looks[ctx.look]
//   templates              {key: text}: more named texts a part may use ("hook", "take1", "later")
//   by_tag                 {Tag: {scene?, motion?, negative?, prefix?, suffix?, refs?}}: per-tag overrides
//   refs                   which references a scene sends, in order: "anchor" | "product" | "scene_image"
//   max_refs               the most references per scene (0-10, default 10)
//   banned                 phrases a filled prompt may not contain (case-insensitive, whole words)
//
// Placeholders: {picture} {line} {on_screen} {look} {style} {cast_looks}
//   {brand.FIELD} {product.name} {speaker.name} {speaker.look} {answers.KEY}
//   and, in `anchor` only, {name}. A trailing ? ({answers.mood?}) lets the value be empty;
//   without it an empty value refuses the scene ("scene s3 needs {answers.mood}").
//   {cast_looks} ("Maya: look; Theo: look" for the members the scene names) may always be empty.

const KIT_TEMPLATE_TEXT_KEYS = ['prefix', 'suffix', 'scene', 'motion', 'anchor', 'negative'];
const KIT_TEMPLATE_KEYS = new Set([...KIT_TEMPLATE_TEXT_KEYS, 'version', 'looks', 'templates', 'by_tag', 'refs', 'max_refs', 'banned']);
const KIT_BY_TAG_KEYS = new Set(['scene', 'motion', 'negative', 'prefix', 'suffix', 'refs']);
const KIT_REF_KINDS = new Set(['anchor', 'product', 'scene_image']);
const KIT_TEMPLATE_MAX_BYTES = 64 * 1024;
const KIT_TEXT_MAX = 8000;
const KIT_MAX_REFS = 10;
const KIT_MAX_ANCHOR_REFS = 3;
// {name}, {name?}, {a.b}, {answers.some_key?}: a placeholder. Other braces ("{ }", "{1,2}") are plain text.
const KIT_PLACEHOLDER_RE = /\{([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?)(\?)?\}/g;
// Anything that starts like a placeholder but is not one ({answers.a.b}, {answers.Mood}, {brand.}) is a typo the check refuses.
const KIT_PLACEHOLDER_LIKE_RE = /\{([a-z][A-Za-z0-9_.-]*)\??\}/g;
const KIT_PLACEHOLDER_NAME_RE = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?$/;
const KIT_SIMPLE_PLACEHOLDERS = new Set(['picture', 'line', 'on_screen', 'look', 'style', 'cast_looks', 'name']);
const KIT_DOTTED_PLACEHOLDERS = new Set(['product.name', 'speaker.name', 'speaker.look']);

/**
 * A scene the template cannot fill, or a filled prompt with a banned phrase.
 * kind: 'gap' (placeholder has no value), 'look' (the look is not in `looks`)
 * or 'banned' (phrase). Parts turn it into ctx.error('bad_input', err.message).
 */
class KitPromptGap extends Error {
  constructor(message, { kind = 'gap', placeholder = null, scene_id = null, phrase = null } = {}) {
    super(message);
    this.name = 'KitPromptGap';
    this.kind = kind;
    this.placeholder = placeholder;
    this.scene_id = scene_id;
    this.phrase = phrase;
  }
}

function kitIsPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function kitPlaceholderProblems(text, where, inAnchor) {
  const out = [];
  for (const m of String(text).matchAll(KIT_PLACEHOLDER_RE)) {
    const key = m[1];
    if (key === 'name' && !inAnchor) out.push(`${where}: {name} only works in anchor`);
    else if (KIT_SIMPLE_PLACEHOLDERS.has(key) || KIT_DOTTED_PLACEHOLDERS.has(key)) continue;
    else if (/^(answers|brand)\.[a-z][a-z0-9_]*$/.test(key)) continue;
    else out.push(`${where}: unknown placeholder {${key}${m[2] || ''}}`);
  }
  for (const m of String(text).matchAll(KIT_PLACEHOLDER_LIKE_RE)) {
    if (!KIT_PLACEHOLDER_NAME_RE.test(m[1])) out.push(`${where}: malformed placeholder ${m[0]}`);
  }
  return out;
}

function kitTextProblems(value, where, inAnchor) {
  if (typeof value !== 'string') return [`${where} must be text`];
  if (value.length > KIT_TEXT_MAX) return [`${where} is over ${KIT_TEXT_MAX} characters`];
  return kitPlaceholderProblems(value, where, inAnchor);
}

function kitRefsProblems(value, where) {
  if (!Array.isArray(value)) return [`${where} must be a list`];
  const bad = value.filter((r) => !KIT_REF_KINDS.has(r));
  return bad.length ? [`${where}: unknown reference ${JSON.stringify(bad[0])} (anchor, product, scene_image)`] : [];
}

/** Every problem with a parsed template object, as text; [] when it is a valid version 1 template. */
function kitTemplateProblems(tpl) {
  if (!kitIsPlainObject(tpl)) return ['the template must be a JSON object'];
  const out = [];
  if (tpl.version !== 1) out.push(`version must be 1, not ${JSON.stringify(tpl.version)}`);
  for (const key of Object.keys(tpl)) if (!KIT_TEMPLATE_KEYS.has(key)) out.push(`unknown key "${key}"`);
  for (const key of KIT_TEMPLATE_TEXT_KEYS) if (key in tpl) out.push(...kitTextProblems(tpl[key], key, key === 'anchor'));
  for (const key of ['looks', 'templates']) {
    if (!(key in tpl)) continue;
    if (!kitIsPlainObject(tpl[key])) out.push(`${key} must be an object of texts`);
    else for (const [k, v] of Object.entries(tpl[key])) out.push(...kitTextProblems(v, `${key}.${k}`, false));
  }
  if ('looks' in tpl && kitIsPlainObject(tpl.looks)) {
    const seen = new Map();
    for (const k of Object.keys(tpl.looks)) {
      const norm = kitTagKey(k);
      if (!norm) out.push(`looks: "${k}" is not a usable key`);
      else if (seen.has(norm)) out.push(`looks: "${k}" and "${seen.get(norm)}" are the same key`);
      else seen.set(norm, k);
    }
  }
  if ('templates' in tpl && kitIsPlainObject(tpl.templates)) {
    for (const k of Object.keys(tpl.templates)) if (['scene', 'motion', 'anchor'].includes(k)) out.push(`templates.${k}: use the top-level ${k} key`);
  }
  if ('by_tag' in tpl) {
    if (!kitIsPlainObject(tpl.by_tag)) out.push('by_tag must be an object');
    else {
      for (const [tag, rule] of Object.entries(tpl.by_tag)) {
        if (!kitTagKey(tag)) out.push(`by_tag: "${tag}" is not a usable tag`);
        if (!kitIsPlainObject(rule)) {
          out.push(`by_tag.${tag} must be an object`);
          continue;
        }
        for (const key of Object.keys(rule)) {
          if (!KIT_BY_TAG_KEYS.has(key)) out.push(`by_tag.${tag}: unknown key "${key}"`);
          else if (key === 'refs') out.push(...kitRefsProblems(rule.refs, `by_tag.${tag}.refs`));
          else out.push(...kitTextProblems(rule[key], `by_tag.${tag}.${key}`, false));
        }
      }
    }
  }
  if ('refs' in tpl) out.push(...kitRefsProblems(tpl.refs, 'refs'));
  if ('max_refs' in tpl && !(Number.isInteger(tpl.max_refs) && tpl.max_refs >= 0 && tpl.max_refs <= KIT_MAX_REFS)) {
    out.push(`max_refs must be a whole number from 0 to ${KIT_MAX_REFS}`);
  }
  if ('banned' in tpl) {
    if (!Array.isArray(tpl.banned) || tpl.banned.some((b) => typeof b !== 'string' || !b.trim() || b.length > 80)) {
      out.push('banned must be a list of phrases (1-80 characters each)');
    } else if (tpl.banned.length > 50) out.push('banned has more than 50 phrases');
  }
  return out;
}

/** A parsed template object checked and returned as is; throws when it is not a valid version 1 template. */
function kitTemplateFrom(tpl, where = 'template') {
  const problems = kitTemplateProblems(tpl);
  if (problems.length) throw new Error(`${where}: ${problems.slice(0, 6).join('; ')}`);
  return tpl;
}

/**
 * Reads and checks a template file: a FileRef ({path}) or a path. Throws
 * (with the file's name) when it is unreadable, over 64 KB, not JSON, or not
 * a valid version 1 template.
 */
async function kitLoadTemplate(file) {
  const path = typeof file === 'string' ? file : file && file.path;
  if (!path) throw new Error('template: no file');
  const name = String(path).split('/').at(-1);
  const text = await readFile(path, 'utf8');
  if (Buffer.byteLength(text) > KIT_TEMPLATE_MAX_BYTES) throw new Error(`template ${name}: over 64 KB`);
  let tpl;
  try {
    tpl = JSON.parse(text);
  } catch (err) {
    throw new Error(`template ${name}: not JSON (${err.message})`);
  }
  return kitTemplateFrom(tpl, `template ${name}`);
}

/** Tidies filled text: one space between words, no doubled punctuation left by empty values, no dangling separators. */
function kitPromptTidy(text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.,;:!?])(?:\s*[.,;:])+/g, '$1')
    .replace(/^[\s.,;:]+/, '')
    .replace(/[\s,;:]+$/, '')
    .trim();
}

function kitValueText(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

/**
 * Fills `text`'s placeholders from `values` ({placeholder key: value}). A key
 * whose value is empty refuses with KitPromptGap ("<who> needs {key}") unless
 * the placeholder ends with ? or the key is in `optional`. `who` is "scene s3"
 * or "cast a". The result is tidied with kitPromptTidy.
 */
function kitPromptFill(text, values, { who = 'the prompt', scene_id = null, optional = [] } = {}) {
  const soft = new Set(optional);
  const filled = String(text == null ? '' : text).replace(KIT_PLACEHOLDER_RE, (whole, key, q) => {
    const value = kitValueText(values ? values[key] : undefined);
    if (!value && !q && !soft.has(key)) {
      throw new KitPromptGap(`${who} needs {${key}}`, { kind: 'gap', placeholder: `{${key}}`, scene_id });
    }
    return value;
  });
  return kitPromptTidy(filled);
}

/** Joins prompt parts: trimmed, empty ones dropped, a full stop added between parts that lack an ending mark. */
function kitPromptJoin(parts) {
  const kept = parts.map((p) => kitPromptTidy(p || '')).filter(Boolean);
  let out = '';
  for (const p of kept) out = !out ? p : /[.!?;:,]$/.test(out) ? `${out} ${p}` : `${out}. ${p}`;
  return out;
}

function kitLookText(tpl, look, who, scene_id) {
  const raw = kitValueText(look);
  if (!raw) return '';
  const looks = kitIsPlainObject(tpl.looks) ? tpl.looks : null;
  if (!looks || !Object.keys(looks).length) return raw;
  const want = kitTagKey(raw);
  const hit = Object.keys(looks).find((k) => kitTagKey(k) === want);
  if (hit == null) {
    throw new KitPromptGap(`${who} needs {look}: "${raw}" is not one of ${Object.keys(looks).join(', ')}`, { kind: 'look', placeholder: '{look}', scene_id });
  }
  return looks[hit];
}

function kitTagRule(tpl, tag) {
  if (!tag || !kitIsPlainObject(tpl.by_tag)) return null;
  const want = kitTagKey(tag);
  const key = Object.keys(tpl.by_tag).find((k) => kitTagKey(k) === want);
  return key == null ? null : tpl.by_tag[key];
}

function kitBannedCheck(tpl, prompt, who, scene_id) {
  for (const phrase of Array.isArray(tpl.banned) ? tpl.banned : []) {
    const re = kitWholeWordsRe(phrase);
    if (re && re.test(prompt)) {
      throw new KitPromptGap(`${who} uses the banned phrase "${phrase.trim()}"`, { kind: 'banned', scene_id, phrase: phrase.trim() });
    }
  }
}

function kitBrandValues(brand) {
  const out = {};
  if (kitIsPlainObject(brand)) for (const [k, v] of Object.entries(brand)) out[`brand.${k}`] = v;
  return out;
}

function kitAnswerValues(answers) {
  const out = {};
  if (kitIsPlainObject(answers)) for (const [k, v] of Object.entries(answers)) out[`answers.${k}`] = v;
  return out;
}

function kitIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

/**
 * One scene's prompt. ctx = {scene, index, look, answers, cast, products, brand}.
 * `use` picks the text: 'scene' (default), 'motion', or a key of `templates`.
 * The scene's tag (kitSceneTag) picks a by_tag rule, whose texts and refs win;
 * {picture} then drops the "Tag:" lead. When the scene names no product and the
 * plan has exactly one, that product counts as named if the text uses
 * {product.name} or the refs ask for "product".
 *
 * Returns {prompt, negative, tag, refs: {cast, products, scene_image}}:
 * refs.cast are the named members (speaker first, at most 3) when refs has
 * "anchor"; refs.products the named products with a photo when refs has
 * "product"; refs.scene_image the scene's own picture file (scene.image, else a
 * file picture) when refs has "scene_image". Members and products come as the
 * plan gives them: the part reads member.image and product.images[0]. They are taken in the order of `refs` until max_refs is reached.
 * Throws KitPromptGap when a required placeholder is empty or a banned phrase appears.
 */
function kitScenePrompt(tpl, ctx, { use = 'scene' } = {}) {
  const scene = (ctx && ctx.scene) || {};
  const index = Number.isInteger(ctx && ctx.index) ? ctx.index : 0;
  const scene_id = scene.id != null && scene.id !== '' ? String(scene.id) : `#${index + 1}`;
  const who = `scene ${scene_id}`;
  const tag = kitSceneTag(scene);
  const rule = kitTagRule(tpl, tag);
  const pick = (key) => (rule && typeof rule[key] === 'string' ? rule[key] : tpl[key]);

  let body;
  if (use === 'scene') body = pick('scene') ?? '{picture}';
  else if (use === 'motion') body = pick('motion');
  else if (use === 'anchor') throw new Error('use kitAnchorPrompt for anchor prompts');
  else body = kitIsPlainObject(tpl.templates) ? tpl.templates[use] : undefined;
  if (typeof body !== 'string') throw new Error(`the template has no "${use}" text`);

  const refKinds = rule && Array.isArray(rule.refs) ? rule.refs : Array.isArray(tpl.refs) ? tpl.refs : ['anchor', 'product', 'scene_image'];
  const cast = kitNamedCast(scene, ctx && ctx.cast);
  const allProducts = Array.isArray(ctx && ctx.products) ? ctx.products.filter(Boolean) : [];
  let products = kitNamedProducts(scene, allProducts);
  const texts = [pick('prefix'), body, pick('suffix'), pick('negative')].filter((t) => typeof t === 'string').join('\n');
  if (!products.length && allProducts.length === 1 && (/\{product\.name\??\}/.test(texts) || refKinds.includes('product'))) products = allProducts;
  const speaker = scene.speaker != null ? cast.find((m) => m.key === scene.speaker) : null;
  const tags = rule ? Object.keys(tpl.by_tag) : [];

  const values = {
    picture: kitPictureWithoutTag(scene, tags),
    line: scene.line,
    on_screen: scene.on_screen,
    look: kitLookText(tpl, ctx && ctx.look, who, scene_id),
    cast_looks: cast.filter((m) => kitValueText(m.name) && kitValueText(m.look)).map((m) => `${kitValueText(m.name)}: ${kitValueText(m.look)}`).join('; '),
    'product.name': products[0] ? products[0].name : '',
    'speaker.name': speaker ? speaker.name : '',
    'speaker.look': speaker ? speaker.look : '',
    ...kitBrandValues(ctx && ctx.brand),
    ...kitAnswerValues(ctx && ctx.answers),
  };
  values.style = values.look;
  const opts = { who, scene_id, optional: ['cast_looks'] };
  const prompt = kitPromptJoin([pick('prefix'), body, pick('suffix')].map((t) => (typeof t === 'string' ? kitPromptFill(t, values, opts) : '')));
  const negative = typeof pick('negative') === 'string' ? kitPromptFill(pick('negative'), values, opts) : '';
  kitBannedCheck(tpl, prompt, who, scene_id);

  const max = Number.isInteger(tpl.max_refs) ? tpl.max_refs : KIT_MAX_REFS;
  const refs = { cast: [], products: [], scene_image: null };
  let room = max;
  for (const kind of refKinds) {
    if (room <= 0) break;
    if (kind === 'anchor') {
      refs.cast = cast.slice(0, Math.min(KIT_MAX_ANCHOR_REFS, room));
      room -= refs.cast.length;
    } else if (kind === 'product') {
      refs.products = products.filter((p) => Array.isArray(p.images) && p.images.length).slice(0, room);
      room -= refs.products.length;
    } else if (kind === 'scene_image' && (kitIsFile(scene.image) || kitIsFile(scene.picture))) {
      refs.scene_image = kitIsFile(scene.image) ? scene.image : scene.picture;
      room -= 1;
    }
  }
  return { prompt, negative, tag, refs };
}

/**
 * Every picked scene's prompt, computed before any piece is ordered so one
 * scene's gap refuses the whole step. `picked` is kitPickScenes' [{scene, index}];
 * `base` = {look, answers, cast, products, brand}. Returns [{id, index, scene, prompt, negative, tag, refs}].
 */
function kitScenePrompts(tpl, picked, base = {}, options = {}) {
  return (picked || []).map(({ scene, index }) => {
    const out = kitScenePrompt(tpl, { ...base, scene, index }, options);
    const id = scene && scene.id != null && scene.id !== '' ? String(scene.id) : `#${index + 1}`;
    return { id, index, scene, ...out };
  });
}

/**
 * A cast member's portrait prompt from the template's `anchor` text: {name}
 * and {look} are the member's; {style} is looks[ctx.look]; answers and brand
 * fill as in scenes. prefix, suffix and negative are filled as for scenes
 * ({look} there is the art style). ctx = {look, answers, brand}. Returns {prompt, negative}.
 * Throws when the template has no anchor text, or KitPromptGap ("cast <key> needs {look}").
 */
function kitAnchorPrompt(tpl, member, ctx = {}) {
  if (typeof tpl.anchor !== 'string') throw new Error('the template has no "anchor" text');
  const key = member && member.key != null ? String(member.key) : '?';
  const who = `cast ${key}`;
  const style = kitLookText(tpl, ctx.look, who, null);
  // prefix, suffix and negative are shared with the scenes, so {look} there stays the art style.
  const shared = { style, look: style, ...kitBrandValues(ctx.brand), ...kitAnswerValues(ctx.answers) };
  const own = { ...shared, name: member && member.name, look: member && member.look };
  const opts = { who };
  const fill = (t, values) => (typeof t === 'string' ? kitPromptFill(t, values, opts) : '');
  const prompt = kitPromptJoin([fill(tpl.prefix, shared), fill(tpl.anchor, own), fill(tpl.suffix, shared)]);
  const negative = fill(tpl.negative, shared);
  kitBannedCheck(tpl, prompt, who, null);
  return { prompt, negative };
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

// ---- video-h3max/src/provider.mjs ----
// H3 Max's fal contract, recorded from the official queue OpenAPI on 2026-10-12.
// A scene part uses image references only. Native sound is kept by default;
// generate_audio: false drops that sound locally because H3 has no such flag.

const H3SCENE_MODEL = 'minimax/h3-max/reference-to-video';
// 1.2.0: the light lock, on every clip that starts on a first frame (modes stills and
// image_to_video). H3 added gloss, HDR contrast and sharpening halos to clean stills in two
// 15 Oct test videos. The same words as creator-h3 1.6.0's H3_LIGHT_LOCK.
const H3SCENE_LIGHT_LOCK = "Keep the first frame's light and exposure, matte skin, no added shine or sharpening halos.";

/** The prompt with the light lock added once, before any "Avoid:" list. */
function h3SceneWithLightLock(prompt) {
  const text = String(prompt || '');
  if (text.includes(H3SCENE_LIGHT_LOCK)) return text;
  const at = text.lastIndexOf('Avoid:');
  if (at < 0) return text ? `${text.replace(/\s+$/, '')}${/[.!?]$/.test(text.trim()) ? '' : '.'} ${H3SCENE_LIGHT_LOCK}` : H3SCENE_LIGHT_LOCK;
  const head = text.slice(0, at).replace(/\s+$/, '');
  return `${head}${head && !/[.!?]$/.test(head) ? '.' : ''}${head ? ' ' : ''}${H3SCENE_LIGHT_LOCK} ${text.slice(at)}`;
}

// 1.2.0: silent creator B-roll (mode stills, broll: true). Every picked scene names one
// physical action that changes the picture; "nobody speaks, lips closed" goes with that action,
// never with still hands. A 15 Oct test video's B-roll asked for "minimal body movement" and
// "no hand touches the face", and got faces that only turned and blinked.
const H3BROLL_HEAD_ONLY = /\b(look(s|ed|ing)?|glanc\w*|blink\w*|smil\w*|nod(s|ded|ding)?|star(e|es|ed|ing)|breath\w*|gaz\w*|turn(s|ed|ing)? (her|his|their) (head|face)|tilt\w* (her|his|their) head|stand(s|ing)?|sit(s|ting)?|wait\w*|paus\w*|listen\w*|think\w*)\b/i;
const H3BROLL_PHYSICAL = /\b(appl\w*|peel\w*|press\w*|lift\w*|pick\w*|put\w*|plac\w*|set(s|ting)? down|hold(s|ing)? up|open\w*|clos\w*|pour\w*|stir\w*|cut(s|ting)?|squeez\w*|smooth\w*|rub\w*|wip\w*|spray\w*|tear\w*|unwrap\w*|scoop\w*|pull\w*|push\w*|tak(e|es|ing)|drop\w*|wash\w*|brush\w*|dab\w*|pat(s|ted|ting)?|stick\w*|stretch\w*|reach\w*|hand(s|ed|ing)? (it|the|over)|shak\w*|tap(s|ped|ping)?|twist\w*|fold\w*|grab\w*|eat\w*|drink\w*|sip\w*|walk\w*|turn(s|ed|ing)? to)\b/i;
const H3BROLL_STILL_HANDS = /\b(keep(s|ing)? (the |her |his |their |both )?hands? still|hands? (stay|stays|remain|remains|are kept|kept|held) still|hands? still|no hand touches|hands? (do|does) not move|minimal (body )?movement|stationary (person|subject|body))\b/i;

/** Why a B-roll action is not a physical action, or null when it is one. */
function h3BrollActionProblem(action) {
  const text = typeof action === 'string' ? action.replace(/\s+/g, ' ').trim() : '';
  if (!text) return 'needs extra.action: one physical action that changes the picture (apply, peel, press, lift, pour, put down, turn to the mirror)';
  if (H3BROLL_STILL_HANDS.test(text)) return `extra.action "${text}" asks for still hands; name the action the hands do`;
  if (H3BROLL_HEAD_ONLY.test(text) && !H3BROLL_PHYSICAL.test(text)) return `extra.action "${text}" only moves the head or eyes; a clip where only the head turns or the eyes blink is a still, not B-roll`;
  return null;
}

/** The B-roll sentence: nobody speaks while the named action happens. */
function h3BrollLine(action) {
  return `Nobody speaks, lips closed, while ${action.replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '')}.`;
}
const H3SCENE_PROVIDER_PROMPT_MAX = 12000;

/** Translate a Seedance-style image token without changing ordinary handles or dialogue. */
function h3SceneProviderPrompt(prompt, refs, who) {
  const check = (n) => {
    const index = Number(n);
    if (!Number.isInteger(index) || index < 1 || index > refs) {
      throw new Error(`${who} names Image ${n}, but has ${refs} reference image${refs === 1 ? '' : 's'}`);
    }
    return `Image ${index}`;
  };
  const out = prompt.replace(/(?<![\w@])@(Image|Video|Audio)([A-Za-z0-9_-]*)(?![\w])/gi, (token, kind, n) => {
    if (kind.toLowerCase() !== 'image') throw new Error(`${who} names ${token}; this part accepts image references only`);
    if (!/^[0-9]+$/.test(n)) throw new Error(`${who} has an unknown image reference ${token}; use Image N with a supplied reference image`);
    return check(n);
  });
  for (const m of out.matchAll(/(?<![\w@])Image\s+([0-9]+)(?![\w])/gi)) check(m[1]);
  const unsupported = /(?<![\w@])@?(Video|Audio)\s*([0-9]+)(?![\w])/i.exec(out);
  if (unsupported) throw new Error(`${who} names ${unsupported[1]} ${unsupported[2]}; this part accepts image references only`);
  if (out.length > H3SCENE_PROVIDER_PROMPT_MAX) throw new Error(`${who}'s prompt is ${out.length} characters, over ${H3SCENE_PROVIDER_PROMPT_MAX}`);
  return out;
}

/** The clip resolution: the input's, else the tier's (768P in both tiers; 1080P only when the customer asks). */
function h3SceneResolution(inputs) {
  return inputs.resolution ?? kitTierDefault(inputs, 'h3_resolution');
}

/** H3 has one endpoint for reference clips and first/last-frame clips. */
function h3SceneProviderBody(inputs, job, refs, seed) {
  return {
    prompt: job.prompt,
    reference_image_urls: refs,
    ...(job.start ? { image_url: job.start } : {}),
    ...(job.end ? { end_image_url: job.end } : {}),
    duration: job.seconds,
    resolution: h3SceneResolution(inputs),
    aspect_ratio: inputs.aspect_ratio ?? '9:16',
    prompt_expansion_mode: 'disabled',
    seed,
  };
}

/** Keep a native dialogue clip; a requested silent clip gets a distinct audio-free file. */
async function h3SceneProviderVideo(ctx, file, piece, audio) {
  const info = await ctx.tools.probe(file.path);
  if (!info.width || !info.height) throw ctx.error('provider_failed', `${piece} came back without a picture`);
  if (audio && !info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its native audio`);
  if (audio || !info.has_audio) return { file, info };
  const name = `${piece}-silent.mp4`;
  await kitFfmpeg(ctx, ['-i', file.path, '-map', '0:v:0', '-c:v', 'copy', '-an', join(ctx.workDir, name)]);
  const silent = await ctx.file(name, 'video');
  return { file: silent, info: await ctx.tools.probe(silent.path) };
}

// ---- video-h3max/src/frames.mjs ----
// H3's first frame defines its canvas. Fit first/last frames without cropping
// products instead of assuming aspect_ratio can override a raw photo's shape.

const H3SCENE_FRAME_SHORT_SIDE = { '480P': 480, '768P': 768, '1080P': 1080 };

function h3SceneFrameKey(file, width, height) {
  return `${file.sha256}:${file.path}:${width}x${height}`;
}

const H3SCENE_PRICED_ASPECTS = [[1, 1], [4, 3], [3, 4], [16, 9], [9, 16], [5, 2], [2, 5]];

/** Use the nearest published image-token aspect, containing every original pixel. */
function h3SceneReferenceCanvas({ width, height }) {
  const ratio = width / height;
  const [w, h] = H3SCENE_PRICED_ASPECTS.reduce((nearest, aspect) =>
    Math.abs(Math.log(ratio / (aspect[0] / aspect[1]))) < Math.abs(Math.log(ratio / (nearest[0] / nearest[1]))) ? aspect : nearest);
  const scale = Math.ceil(Math.max(width / w, height / h));
  return { width: w * scale, height: h * scale };
}

/** Fit reference images to documented token aspects without cropping or scaling their content. */
async function h3ScenePrepareReferences(ctx, jobs) {
  const prepared = new Map();
  for (const job of jobs) {
    const refs = [];
    for (const image of job.refs) {
      kitStopIfAborted(ctx);
      const key = h3SceneFrameKey(image, 0, 0);
      if (!prepared.has(key)) {
        const info = await ctx.tools.probe(image.path);
        if (!Number.isInteger(info.width) || !Number.isInteger(info.height) || info.width < 1 || info.height < 1) {
          throw ctx.error('bad_input', `${job.who ?? job.id} has a reference without readable image dimensions`);
        }
        const { width, height } = h3SceneReferenceCanvas(info);
        if (width === info.width && height === info.height) prepared.set(key, image);
        else {
          const name = `reference-${image.sha256}.png`;
          await kitFfmpeg(ctx, ['-i', image.path, '-frames:v', '1', '-vf', `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`, join(ctx.workDir, name)]);
          prepared.set(key, await ctx.file(name, 'image'));
        }
      }
      refs.push(prepared.get(key));
    }
    job.refs = refs;
  }
}

/** Pixel canvas for an explicit ratio; adaptive follows the first frame. */
function h3SceneFrameCanvas(inputs, source) {
  const aspect = inputs.aspect_ratio ?? '9:16';
  if (aspect === 'adaptive') return { width: source.width, height: source.height };
  const [w, h] = aspect.split(':').map(Number);
  const short = H3SCENE_FRAME_SHORT_SIDE[h3SceneResolution(inputs)];
  const scale = short / Math.min(w, h);
  return { width: Math.round(w * scale / 2) * 2, height: Math.round(h * scale / 2) * 2 };
}

/**
 * Mode stills' canvas: exactly the requested ratio (so the line can price both
 * image fields from a published token aspect) with the short side at least the
 * resolution's and both sides even. 9:16 is 1080x1920 at 1080P, 774x1376 at
 * 768P and 486x864 at 480P. adaptive keeps the still's own size.
 */
function h3SceneStillCanvas(inputs, source) {
  const aspect = inputs.aspect_ratio ?? '9:16';
  if (aspect === 'adaptive') return { width: source.width, height: source.height };
  const [w, h] = aspect.split(':').map(Number);
  let k = Math.ceil(H3SCENE_FRAME_SHORT_SIDE[h3SceneResolution(inputs)] / Math.min(w, h));
  if ((w * k) % 2 || (h * k) % 2) k += 1;
  return { width: w * k, height: h * k };
}

/**
 * Mode stills: fit each scene still to the clip's canvas by cover (scale to fill,
 * centre crop). A still is a generated scene picture made for this shape, so a
 * few edge pixels are cut instead of adding black bars that H3 would animate.
 * Every probe and fit runs before any provider order.
 */
async function h3SceneFitStills(inputs, ctx, jobs) {
  const fitted = new Map();
  let index = 0;
  for (const job of jobs) {
    kitStopIfAborted(ctx);
    const still = job.start;
    if (!fitted.has(h3SceneFrameKey(still, 0, 0))) {
      const info = await ctx.tools.probe(still.path);
      if (!Number.isInteger(info.width) || !Number.isInteger(info.height) || info.width < 1 || info.height < 1) {
        throw ctx.error('bad_input', `${job.who} has a still without readable image dimensions`);
      }
      const { width, height } = h3SceneStillCanvas(inputs, info);
      if (info.width === width && info.height === height) fitted.set(h3SceneFrameKey(still, 0, 0), still);
      else {
        const name = `still-${++index}.png`;
        await kitFfmpeg(ctx, ['-i', still.path, '-frames:v', '1', '-vf', `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`, join(ctx.workDir, name)]);
        fitted.set(h3SceneFrameKey(still, 0, 0), await ctx.file(name, 'image'));
      }
    }
    job.start = fitted.get(h3SceneFrameKey(still, 0, 0));
  }
}

/** Free preprocessing for every frame, completed before any provider order. */
async function h3ScenePrepareFrames(inputs, ctx, jobs) {
  const probes = new Map();
  for (const job of jobs) {
    for (const frame of [job.start, job.end].filter(Boolean)) {
      kitStopIfAborted(ctx);
      const key = h3SceneFrameKey(frame, 0, 0);
      if (!probes.has(key)) {
        const info = await ctx.tools.probe(frame.path);
        if (!Number.isInteger(info.width) || !Number.isInteger(info.height) || info.width < 1 || info.height < 1) {
          throw ctx.error('bad_input', `${job.who} has a first or last frame without readable image dimensions`);
        }
        probes.set(key, info);
      }
    }
    job.canvas = h3SceneFrameCanvas(inputs, probes.get(h3SceneFrameKey(job.start, 0, 0)));
  }
  const fitted = new Map();
  let index = 0;
  for (const job of jobs) {
    const { width, height } = job.canvas;
    for (const key of ['start', 'end']) {
      const frame = job[key];
      if (!frame) continue;
      const cacheKey = h3SceneFrameKey(frame, width, height);
      if (!fitted.has(cacheKey)) {
        const info = probes.get(h3SceneFrameKey(frame, 0, 0));
        if (info.width === width && info.height === height) fitted.set(cacheKey, frame);
        else {
          const name = `frame-${++index}.png`;
          await kitFfmpeg(ctx, ['-i', frame.path, '-frames:v', '1', '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`, join(ctx.workDir, name)]);
          fitted.set(cacheKey, await ctx.file(name, 'image'));
        }
      }
      job[key] = fitted.get(cacheKey);
    }
  }
}

// ---- video-h3max/src/takes.mjs ----
// H3 Max take planning, adapted from video-seedance-2 1.2.0. Each take holds
// timed scene beats and their speakers. Chained takes share a cropped still,
// then join into one video. Timeline scene windows scale to the measured
// provider durations; speech is left to a single downstream transcription.

const H3SCENE_TAKE_PROMPT_MAX = 12000;
const H3SCENE_TAKE_MAX_REFS = 9;
const H3SCENE_TAKE_MAX_BEATS = 4;
const H3SCENE_TAKES_MAX_BEATS = 8;
const H3SCENE_TAKE_DEFAULT_SECONDS = 15;
const H3SCENE_TAKE_DEFAULT_WPS = 2.5;
// A spoken beat needs its words at words_per_second plus a breath; a silent beat holds this long.
const H3SCENE_TAKE_BREATH_S = 0.5;
const H3SCENE_TAKE_SILENT_S = 1.5;
// Beat edges are written in half seconds ("8-11.5s"), as the shipped prompts were.
const H3SCENE_TAKE_STEP_S = 0.5;
const H3SCENE_TAKE_HEAD = ' take head';
const H3SCENE_TAKE_PLACEHOLDER_LIKE = /\{[A-Za-z][A-Za-z0-9_.-]*\??\}/;
// A beat keeps the face off screen when its tag (extra.shot or a leading "Tag:") is one of these, or its picture says so.
const H3SCENE_OFF_SCREEN_TAGS = ['rear', 'rear-camera', 'rear-cam', 'back-camera', 'macro', 'hands', 'off-screen', 'cutaway', 'b-roll', 'broll'];
const H3SCENE_OFF_SCREEN_RE =
  /\b(?:face\s+(?:is\s+|stays\s+|mostly\s+|fully\s+|kept\s+)?(?:off[- ]?screen|off[- ]?camera|out\s+of\s+(?:the\s+)?frame|not\s+(?:in\s+(?:the\s+)?frame|visible|shown))|rear[- ]camera|rear[- ]facing\s+camera|back\s+camera|no\s+face|faceless)\b/i;
// chain.crop -> the share of the frame's height kept at the bottom (below every face).
const H3SCENE_CHAIN_CROPS = { bottom_45: 0.45 };
const H3SCENE_CHAIN_DEFAULT_AT_S = 0.5;
// The size rule (MASTER-PLAN §4.12): the join caps its bitrate and refuses an output over 180 MB.
const H3SCENE_JOIN_RATE = ['-maxrate', '16M', '-bufsize', '32M'];
const H3SCENE_JOIN_MAX_BYTES = 180 * 1024 * 1024;

function h3SceneTakeIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

/** Spoken words in a line (a token with a letter or digit). */
function h3SceneTakeWords(text) {
  return String(text == null ? '' : text)
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Joins prompt parts with one space after an ending mark (a closing quote after one counts), else ". ". Never rewrites a part. */
function h3SceneTakeJoinText(parts) {
  let out = '';
  for (const p of parts.map((x) => String(x == null ? '' : x).trim()).filter(Boolean)) {
    out = !out ? p : /[.!?;:,]["\u201d']?$/.test(out) ? `${out} ${p}` : `${out}. ${p}`;
  }
  return out;
}

/** A scene's line as it will be said (whitespace tidied, brand respellings applied), else null. */
function h3SceneTakeSpokenLine(scene, pairs) {
  const line = typeof scene.line === 'string' && scene.line.trim() ? scene.line.replace(/\s+/g, ' ').trim() : null;
  return line ? kitApplySayAs(line, pairs).spoken : null;
}

function h3SceneTakeSec(x) {
  return String(Number(x.toFixed(2)));
}

/** True when the beat keeps the face off screen: its tag is in `tags`, or its picture says so. */
function h3SceneTakeFaceOffScreen(scene, tags) {
  const tag = kitSceneTag(scene);
  if (tag && new Set(tags.map(kitTagKey)).has(kitTagKey(tag))) return true;
  return typeof scene.picture === 'string' && H3SCENE_OFF_SCREEN_RE.test(scene.picture);
}

/**
 * Beat windows in seconds for one take: each spoken beat needs words / wps + a breath, each silent
 * beat H3SCENE_TAKE_SILENT_S; the needs are stretched to fill `seconds` and the edges put on half seconds.
 * Throws when the beats need more than the take holds.
 */
function h3SceneTakeWindows(words, seconds, wps, who) {
  const need = words.map((w) => (w ? w / wps + H3SCENE_TAKE_BREATH_S : H3SCENE_TAKE_SILENT_S));
  const total = need.reduce((a, b) => a + b, 0);
  if (total > seconds + 1e-9) {
    throw new Error(`${who}'s beats need ${total.toFixed(1)} s at ${wps} words a second, more than its ${seconds} s; cut words or beats`);
  }
  const scale = seconds / total;
  const edges = [0];
  let acc = 0;
  for (let i = 0; i < need.length; i++) {
    acc += need[i] * scale;
    edges.push(i === need.length - 1 ? seconds : Math.round(acc / H3SCENE_TAKE_STEP_S) * H3SCENE_TAKE_STEP_S);
  }
  for (let i = 1; i < edges.length - 1; i++) edges[i] = Math.max(edges[i], edges[i - 1] + H3SCENE_TAKE_STEP_S);
  for (let i = edges.length - 2; i > 0; i--) edges[i] = Math.min(edges[i], edges[i + 1] - H3SCENE_TAKE_STEP_S);
  return need.map((_, i) => ({ start: edges[i], end: edges[i + 1] }));
}

/**
 * The picked scenes split into takes: by scene.extra.take (1-based, in order) when any scene sets it,
 * else evenly in order (earlier takes get the extra scene). Returns [[{scene, index}], ...].
 */
function h3SceneTakeGroups(picked, count) {
  if (count > picked.length) throw new Error(`${count} takes need at least ${count} scenes; ${picked.length} are picked`);
  const marked = picked.filter((p) => p.scene.extra && p.scene.extra.take != null);
  if (marked.length) {
    if (marked.length !== picked.length) throw new Error('set extra.take on every picked scene, or on none');
    const groups = Array.from({ length: count }, () => []);
    let last = 1;
    for (const p of picked) {
      const t = p.scene.extra.take;
      if (!Number.isInteger(t) || t < 1 || t > count) throw new Error(`scene ${p.scene.id}: extra.take must be a whole number from 1 to ${count}`);
      if (t < last) throw new Error(`scene ${p.scene.id}: extra.take goes back to take ${t}; takes run in plan order`);
      last = t;
      groups[t - 1].push(p);
    }
    const empty = groups.findIndex((g) => !g.length);
    if (empty >= 0) throw new Error(`take ${empty + 1} has no scene`);
    return groups;
  }
  const groups = [];
  let at = 0;
  for (let k = 0; k < count; k++) {
    const size = Math.floor(picked.length / count) + (k < picked.length % count ? 1 : 0);
    groups.push(picked.slice(at, at + size));
    at += size;
  }
  return groups;
}

/** The name a dialogue clause gives the speaker: the cast member's name, the speaker key, the only member, else "They". */
function h3SceneTakeWho(scene, cast) {
  const members = (cast || []).filter(Boolean);
  if (scene.speaker != null) {
    const m = members.find((c) => c.key === scene.speaker);
    if (m && m.name) return String(m.name).trim();
    const key = String(scene.speaker).replace(/_/g, ' ').trim();
    if (key) return `The ${key}`;
  }
  if (members.length === 1 && members[0].name) return String(members[0].name).trim();
  return 'They';
}

/** The raw text a beat is written from: templates.beat, else the scene's by_tag scene, else scene, else "{picture}". */
function h3SceneTakeBeatText(tpl, scene) {
  if (tpl.templates && typeof tpl.templates.beat === 'string') return { use: 'beat', text: tpl.templates.beat };
  const tag = kitSceneTag(scene);
  if (tag && tpl.by_tag && typeof tpl.by_tag === 'object') {
    const key = Object.keys(tpl.by_tag).find((k) => kitTagKey(k) === kitTagKey(tag));
    const rule = key == null ? null : tpl.by_tag[key];
    if (rule && typeof rule.scene === 'string') return { use: 'scene', text: rule.scene };
  }
  return { use: 'scene', text: typeof tpl.scene === 'string' ? tpl.scene : '{picture}' };
}

function h3SceneTakeLeftover(text, who, sceneId) {
  const left = H3SCENE_TAKE_PLACEHOLDER_LIKE.exec(text);
  if (left) throw new KitPromptGap(`${who} has an unknown placeholder ${left[0]}`, { placeholder: left[0], scene_id: sceneId });
}

/** Adds refs to the take's ordered lists without repeats. */
function h3SceneTakeAddRefs(into, refs) {
  for (const m of refs.cast) if (!into.cast.some((c) => c.key === m.key)) into.cast.push(m);
  for (const p of refs.products) if (!into.products.some((q) => q.id === p.id)) into.products.push(p);
  if (refs.scene_image && !into.scenes.some((f) => f.sha256 === refs.scene_image.sha256 && f.path === refs.scene_image.path)) into.scenes.push(refs.scene_image);
}

/** The take's reference files in the template's refs order (anchor, product, scene_image), at most `max`. */
function h3SceneTakeRefFiles(tpl, refs, max) {
  const kinds = Array.isArray(tpl.refs) ? tpl.refs : ['anchor', 'product', 'scene_image'];
  const out = [];
  for (const kind of kinds) {
    if (kind === 'anchor') for (const m of refs.cast) if (h3SceneTakeIsFile(m.image)) out.push(m.image);
    if (kind === 'product') for (const p of refs.products) if (Array.isArray(p.images) && h3SceneTakeIsFile(p.images[0])) out.push(p.images[0]);
    if (kind === 'scene_image') out.push(...refs.scenes);
  }
  if (out.length > max) throw new Error(`the take picked ${out.length} reference images; the template allows at most ${max}`);
  return out;
}

/**
 * One take's prompt and references: prefix and the take's own text (templates[head]), one line per
 * beat with its window and its dialogue, then suffix and "Avoid: <negative>". `beats` are
 * [{scene, index}] of this take. Throws (before any order) on every refusal.
 */
function h3SceneTakePrompt(tpl, base, { id, index, beats, head, seconds, wps, pairs, offScreen }) {
  const who = `take ${id}`;
  // Windows and word limits count the words as said, after the respellings (a term can say as several words).
  const windows = h3SceneTakeWindows(beats.map((b) => h3SceneTakeWords(h3SceneTakeSpokenLine(b.scene, pairs))), seconds, wps, who);
  const beatTpl = { ...tpl, prefix: undefined, suffix: undefined, negative: undefined };
  const refs = { cast: [], products: [], scenes: [] };
  const negatives = [];
  const lines = [];
  const pictures = [];
  let speaker = null;
  const texts = [];
  for (const [n, { scene, index: at }] of beats.entries()) {
    const line = typeof scene.line === 'string' && scene.line.trim() ? scene.line.replace(/\s+/g, ' ').trim() : null;
    let voiceover = false;
    if (line && offScreen) {
      if (h3SceneTakeFaceOffScreen(scene, offScreen.tags)) {
        if (offScreen.lines === 'refuse') {
          throw new Error(`scene ${scene.id} has a line, but its picture keeps the face off screen; move the line to a beat that shows the face`);
        }
        voiceover = true;
      }
    }
    const spoken = h3SceneTakeSpokenLine(scene, pairs);
    const said = { ...scene, line: spoken };
    const pick = h3SceneTakeBeatText(tpl, scene);
    const out = kitScenePrompt(beatTpl, { ...base, scene: said, index: at }, { use: pick.use });
    h3SceneTakeLeftover(out.prompt, `scene ${scene.id}`, scene.id);
    if (out.negative) negatives.push(out.negative);
    h3SceneTakeAddRefs(refs, out.refs);
    let dialogue = '';
    if (spoken && !/\{line\??\}/.test(pick.text)) {
      dialogue = voiceover ? `Voice-over from ${h3SceneTakeWho(scene, base.cast)}, lips not on screen: "${spoken}"` : `${h3SceneTakeWho(scene, base.cast)} says: "${spoken}"`;
    } else if (spoken && voiceover) {
      // The template placed the words itself; still say they are voice-over, so no mouth is faked on this beat.
      dialogue = `The line is voice-over from ${h3SceneTakeWho(scene, base.cast)}, lips not on screen`;
    }
    const w = windows[n];
    texts.push(`Beat ${n + 1} (${h3SceneTakeSec(w.start)}-${h3SceneTakeSec(w.end)}s): ${h3SceneTakeJoinText([out.prompt, dialogue])}`);
    if (spoken) lines.push(spoken);
    if (typeof scene.picture === 'string' && scene.picture.trim()) pictures.push(scene.picture.trim());
    if (speaker == null && line && scene.speaker != null) speaker = scene.speaker;
  }
  // The take as one scene, for the text around the beats ({product.name}, {cast_looks}, {answers.KEY}).
  const takeScene = { id, picture: pictures.join('. '), line: lines.join(' '), on_screen: null, speaker, extra: null };
  const headText = head != null && tpl.templates && typeof tpl.templates[head] === 'string' ? tpl.templates[head] : '';
  const headTpl = { ...tpl, by_tag: undefined, suffix: undefined, negative: undefined, templates: { ...(tpl.templates || {}), [H3SCENE_TAKE_HEAD]: headText } };
  const tailTpl = { ...tpl, by_tag: undefined, prefix: undefined, templates: { ...(tpl.templates || {}), [H3SCENE_TAKE_HEAD]: '' } };
  let headOut;
  let tailOut;
  try {
    headOut = kitScenePrompt(headTpl, { ...base, scene: takeScene, index }, { use: H3SCENE_TAKE_HEAD });
    tailOut = kitScenePrompt(tailTpl, { ...base, scene: takeScene, index }, { use: H3SCENE_TAKE_HEAD });
  } catch (err) {
    if (err instanceof KitPromptGap) throw new KitPromptGap(err.message.replace(/^scene \S+/, who), err);
    throw err;
  }
  h3SceneTakeLeftover(headOut.prompt, who, null);
  h3SceneTakeLeftover(tailOut.prompt, who, null);
  if (tailOut.negative) negatives.unshift(tailOut.negative);
  h3SceneTakeAddRefs(refs, headOut.refs);
  h3SceneTakeAddRefs(refs, tailOut.refs);

  let prompt = h3SceneTakeJoinText([headOut.prompt, ...texts, tailOut.prompt]);
  const avoid = [...new Set(negatives.filter(Boolean))];
  if (avoid.length) prompt = h3SceneTakeJoinText([prompt, `Avoid: ${avoid.join(', ')}`]);
  for (const phrase of Array.isArray(tpl.banned) ? tpl.banned : []) {
    const re = kitWholeWordsRe(phrase);
    if (re && re.test(prompt)) throw new KitPromptGap(`${who} uses the banned phrase "${phrase.trim()}"`, { kind: 'banned', phrase: phrase.trim() });
  }
  if (prompt.length > H3SCENE_TAKE_PROMPT_MAX) throw new Error(`${who}'s prompt is ${prompt.length} characters, over ${H3SCENE_TAKE_PROMPT_MAX}`);
  const max = Math.min(H3SCENE_TAKE_MAX_REFS, Number.isInteger(tpl.max_refs) ? tpl.max_refs : H3SCENE_TAKE_MAX_REFS);
  if (Array.isArray(tpl.refs) && tpl.refs.includes('product') && !refs.products.some((p) => Array.isArray(p.images) && h3SceneTakeIsFile(p.images[0]))) {
    throw new Error(`${who} requests a product reference, but no matching product has a photo; name the product in its picture or line and supply its photo`);
  }
  const files = h3SceneTakeRefFiles(tpl, refs, max);
  return { id, prompt, refs: files, windows, scene_ids: beats.map((b) => String(b.scene.id)) };
}

/** Whole-second takes keep the authored beat contract; H3 receives a number. */
/**
 * 1.5.0 takes.pad_s: one take's length fitted to its beats, in whole seconds from 4 to 15. Each spoken beat needs
 * its words at wps plus a breath, each silent beat H3SCENE_TAKE_SILENT_S, and the take gets `pad` more; rounded up.
 * Spare seconds are where H3 invents words or wanders off the framing, so a take is no longer than its lines need.
 */
function h3SceneTakeFitSeconds(words, wps, pad, who) {
  const need = words.reduce((a, w) => a + (w ? w / wps + H3SCENE_TAKE_BREATH_S : H3SCENE_TAKE_SILENT_S), 0) + pad;
  const seconds = Math.max(4, Math.ceil(need - 1e-9));
  if (seconds > 15) throw new Error(`${who}'s beats need ${need.toFixed(1)} s with its pad, more than 15 s; cut words, beats or pad_s`);
  return seconds;
}

function h3SceneTakeDuration(seconds) {
  if (!Number.isInteger(seconds) || seconds < 4 || seconds > 15) throw new Error(`a take lasts ${seconds} s; this part takes whole seconds from 4 to 15`);
  return seconds;
}

/** Every take job for mode take or takes, refused here before any piece is ordered. */
function h3SceneTakeJobs(inputs, tpl) {
  const many = inputs.mode === 'takes';
  const picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
  if (!picked.length) throw new Error('no scene is picked for the take');
  const spec = inputs.takes || {};
  const count = many ? spec.count ?? 1 : 1;
  if (inputs.chain && count < 2) throw new Error('chain needs at least two takes');
  const groups = many ? h3SceneTakeGroups(picked, count) : [picked];
  const pads = spec.pad_s == null ? null : Array.isArray(spec.pad_s) ? spec.pad_s : groups.map(() => spec.pad_s);
  if (pads && pads.length !== groups.length) throw new Error(`takes.pad_s has ${pads.length} entries for ${groups.length} takes`);
  const limit = many ? H3SCENE_TAKES_MAX_BEATS : H3SCENE_TAKE_MAX_BEATS;
  if (pads && inputs.seconds != null) throw new Error('takes.pad_s fits each take to its lines; give seconds or takes.pad_s, not both');
  const wps = inputs.words_per_second ?? H3SCENE_TAKE_DEFAULT_WPS;
  const named = (key) => tpl.templates && typeof tpl.templates[key] === 'string';
  let first = null;
  let later = null;
  if (many) {
    first = spec.first ?? 'first';
    later = spec.later ?? 'later';
    if (spec.first != null && !named(spec.first)) throw new Error(`takes.first names templates.${spec.first}, which the template does not have`);
    if (spec.later != null && !named(spec.later)) throw new Error(`takes.later names templates.${spec.later}, which the template does not have`);
    if (!named(later)) later = first;
  } else if (named('take')) {
    first = 'take';
  }
  const pairs = inputs.pronunciations ?? (inputs.brand && Array.isArray(inputs.brand.pronunciations) ? inputs.brand.pronunciations : []);
  const offScreen = many ? null : { lines: inputs.off_screen_lines ?? 'refuse', tags: inputs.off_screen_tags ?? H3SCENE_OFF_SCREEN_TAGS };
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null, cast: inputs.cast || [], products: inputs.products || [] };
  const jobs = [];
  for (const [k, beats] of groups.entries()) {
    const id = `t${k + 1}`;
    if (beats.length > limit) throw new Error(`take ${id} has ${beats.length} scenes; a take holds at most ${limit} beats`);
    const beatWords = beats.map((b) => h3SceneTakeWords(h3SceneTakeSpokenLine(b.scene, pairs)));
    const words = beatWords.reduce((a, w) => a + w, 0);
    const seconds = pads ? h3SceneTakeFitSeconds(beatWords, wps, pads[k], `take ${id}`) : inputs.seconds ?? H3SCENE_TAKE_DEFAULT_SECONDS;
    const duration = h3SceneTakeDuration(seconds);
    const maxWords = inputs.max_words ?? Math.floor(seconds * wps);
    if (words > maxWords) throw new Error(`take ${id} has ${words} spoken words, more than ${maxWords} for ${seconds} s`);
    const job = h3SceneTakePrompt(tpl, base, { id, index: beats[0].index, beats, head: k === 0 ? first : later, seconds, wps, pairs, offScreen });
    if (!job.refs.length) throw new Error(`take ${id} has no reference image: give cast pictures, product photos or scene pictures the template's refs can use`);
    if (inputs.chain && k > 0 && job.refs.length >= H3SCENE_TAKE_MAX_REFS) throw new Error(`take ${id} already has ${H3SCENE_TAKE_MAX_REFS} references; the chain still needs one more`);
    job.prompt = h3SceneProviderPrompt(job.prompt, job.refs.length + (inputs.chain && k > 0 ? 1 : 0), `take ${id}`);
    jobs.push({ ...job, index: k, seconds, duration });
  }
  return jobs;
}

/** The chain still: one frame of take 1 at chain.at_s, keeping only the bottom share of its height (below every face). */
async function h3SceneTakeChainStill(ctx, take, chain) {
  const keep = H3SCENE_CHAIN_CROPS[chain.crop];
  const length = await kitDuration(ctx, take);
  const at = Math.max(0, Math.min(chain.at_s ?? H3SCENE_CHAIN_DEFAULT_AT_S, length - 0.1));
  const crop = `crop=iw:trunc(ih*${keep}/2)*2:0:ih-trunc(ih*${keep}/2)*2`;
  await kitFfmpeg(ctx, ['-ss', kitNum(at), '-i', take.path, '-frames:v', '1', '-vf', crop, join(ctx.workDir, 'chain-still.png')]);
  const job = { id: 'chain still', refs: [await ctx.file('chain-still.png', 'image')] };
  await h3ScenePrepareReferences(ctx, [job]);
  return job.refs[0];
}

/** The takes joined in order with hard cuts, at the first take's size and frame rate. */
async function h3SceneTakeJoin(ctx, made, audio) {
  const first = made[0].info;
  const w = first.width;
  const h = first.height;
  const fps = first.fps || 24;
  const args = [];
  const fc = [];
  const pieces = [];
  for (const [k, t] of made.entries()) {
    args.push('-i', t.file.path);
    fc.push(
      `[${k}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${kitNum(fps)},` +
        `trim=duration=${kitNum(t.length)},setpts=PTS-STARTPTS,format=yuv420p[v${k}]`,
    );
    pieces.push(`[v${k}]`);
    if (audio) {
      fc.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:${kitNum(t.length)},asetpts=PTS-STARTPTS[a${k}]`);
      pieces.push(`[a${k}]`);
    }
  }
  fc.push(`${pieces.join('')}concat=n=${made.length}:v=1:a=${audio ? 1 : 0}${audio ? '[v][a]' : '[v]'}`);
  const out = join(ctx.workDir, 'takes.mp4');
  await kitFfmpeg(ctx, [
    ...args,
    '-filter_complex',
    fc.join(';'),
    '-map',
    '[v]',
    ...(audio ? ['-map', '[a]'] : []),
    ...ctx.tools.encodeArgs('h264-master'),
    ...H3SCENE_JOIN_RATE,
    ...(audio ? ctx.tools.encodeArgs('aac') : []),
    out,
  ]);
  const bytes = statSync(out).size;
  if (bytes > H3SCENE_JOIN_MAX_BYTES) throw ctx.error('output_invalid', `the joined takes are ${Math.round(bytes / 1048576)} MB, over 180 MB`);
  return ctx.file('takes.mp4', 'video');
}

/** Runs mode take or takes: orders each take in order, then joins them. Returns the part's outputs. */
async function h3SceneRunTakes(inputs, ctx, jobs) {
  const audio = inputs.generate_audio ?? true;
  const used = new Set();
  for (const j of jobs) j.piece = kitPieceName('take', j.id, j.index, used);
  const made = [];
  let still = null;
  for (const [k, j] of jobs.entries()) {
    kitStopIfAborted(ctx);
    const piece = j.piece;
    const refs = still ? [...j.refs, still] : j.refs;
    const body = h3SceneProviderBody(inputs, j, refs, ctx.seed(piece) % 2147483647);
    const result = await ctx.line.order({ piece, provider: 'fal', path: H3SCENE_MODEL, body, results: [{ pointer: '/json/video/url', name: `${piece}.mp4`, media: 'video' }] });
    const file = result && result.files && result.files[`${piece}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    const ready = await h3SceneProviderVideo(ctx, file, piece, audio);
    made.push({ job: j, file: ready.file, info: ready.info, length: await kitDuration(ctx, ready.file) });
    if (k === 0 && inputs.chain && jobs.length > 1) still = await h3SceneTakeChainStill(ctx, ready.file, inputs.chain);
    ctx.progress({ done: k + 1, total: jobs.length });
  }
  const video = made.length === 1 ? made[0].file : await h3SceneTakeJoin(ctx, made, audio);
  const info = made.length === 1 ? made[0].info : await ctx.tools.probe(video.path);
  const duration = made.length === 1 ? made[0].length : await kitDuration(ctx, video);
  // Beat windows were written for j.seconds; each take's real length stretches them.
  const scenes = [];
  let offset = 0;
  for (const t of made) {
    const k = t.length / t.job.seconds;
    for (const [n, w] of t.job.windows.entries()) {
      const last = n === t.job.windows.length - 1;
      scenes.push({ id: t.job.scene_ids[n], start_s: +Math.min(duration, offset + w.start * k).toFixed(3), end_s: +Math.min(duration, last ? offset + t.length : offset + w.end * k).toFixed(3) });
    }
    offset += t.length;
  }
  if (scenes.length) scenes[scenes.length - 1].end_s = +duration.toFixed(3);
  const timeline = { duration_s: +duration.toFixed(3), width: info.width, height: info.height, fps: info.fps || made[0].info.fps || 24, scenes, speech: [] };
  const takes = made.map((t) => ({ id: t.job.id, video: t.file, seconds: t.job.seconds }));
  return { clips: takes, takes, video, seconds: timeline.duration_s, timeline };
}

// ---- _lib/product-tag-contract.mjs ----
// Opt-in scene routing and request evidence for product stills and their motion.
// Evidence comes from the producer part's actual request and returned file hash;
// the locked style binds this output to the motion step, never to plan prose.

const KIT_PRODUCT_SHA = /^[0-9a-f]{64}$/;
const KIT_PRODUCT_EDIT = 'openai/gpt-image-2/edit';

/** Validate only styles that explicitly opt into strict by_tag routing. */
function kitRequireSceneTags(tpl, scenes, options = {}) {
  const tags = Object.keys(tpl.by_tag || {});
  if (!tags.length) throw new Error('required scene tags need a template with by_tag rules');
  const keys = new Map(tags.map((tag) => [kitTagKey(tag), tag]));
  for (const { scene, index } of kitPickScenes(scenes, options.pick, options)) {
    const who = `scene ${scene.id ?? index + 1}`;
    const picture = typeof scene.picture === 'string' ? scene.picture.trim() : '';
    const prefix = kitSceneTag({ picture });
    const shot = scene.extra && scene.extra.shot;
    const structured = typeof shot === 'string' && shot.trim() ? shot.trim() : null;
    if (structured && !keys.has(kitTagKey(structured))) throw new Error(`${who} has unknown extra.shot "${structured}"; choose ${tags.join(', ')}`);
    if (prefix && !keys.has(kitTagKey(prefix))) throw new Error(`${who} has unknown picture tag "${prefix}"; choose ${tags.map((tag) => `${tag}:`).join(', ')}`);
    if (prefix && structured && kitTagKey(prefix) !== kitTagKey(structured)) throw new Error(`${who}'s picture tag "${prefix}" disagrees with extra.shot "${structured}"`);
    if (!prefix) {
      const missingColon = tags.find((tag) => {
        const re = kitWholeWordsRe(tag);
        const match = re && re.exec(picture);
        return match && match.index === 0;
      });
      if (missingColon) throw new Error(`${who}'s picture needs a colon after "${missingColon}": use "${missingColon}: ..."`);
    }
    if (!prefix && !structured) throw new Error(`${who} needs a scene tag: start the picture with ${tags.map((tag) => `${tag}:`).join(', ')} or set extra.shot`);
  }
}

/** Products the picture names, or the selected product for a product-reference rule. */
function kitProductScenePhotos(tpl, scene, products = []) {
  const tag = kitSceneTag(scene);
  const key = Object.keys(tpl.by_tag || {}).find((value) => kitTagKey(value) === kitTagKey(tag));
  const rule = key == null ? null : tpl.by_tag[key];
  const refs = Array.isArray(rule && rule.refs) ? rule.refs : Array.isArray(tpl.refs) ? tpl.refs : [];
  const selectedText = ['scene', 'motion', 'prefix', 'suffix'].map((key) => rule && typeof rule[key] === 'string' ? rule[key] : tpl[key]).filter((value) => typeof value === 'string').join('\n');
  const picture = typeof scene.picture === 'string' ? scene.picture : '';
  const productPrefix = /^\s*(?:Product|Hold\s+[1-5])(?:\s|:)/i.test(picture);
  const needsProduct = refs.includes('product') || /\{product\.name\??\}/.test(selectedText) || productPrefix;
  let named = kitNamedProducts(scene, products);
  if (!named.length && needsProduct && products.length === 1) named = products;
  if (needsProduct && !named.length) throw new Error(`scene ${scene.id} needs a named product with a real photo`);
  return named.map((product) => {
    const photo = Array.isArray(product.images) && product.images[0];
    if (!photo || !KIT_PRODUCT_SHA.test(photo.sha256 || '')) throw new Error(`scene ${scene.id} needs the real photo of ${product.name || product.id}`);
    return { id: String(product.id), sha256: photo.sha256 };
  });
}

/** Check the files in the actual provider request, after reference selection/capping. */
function kitRequireProductRequest(sceneId, required, refs, model) {
  const actual = (refs || []).map((file) => file && file.sha256).filter((sha) => KIT_PRODUCT_SHA.test(sha || ''));
  for (const photo of required || []) {
    if (model !== KIT_PRODUCT_EDIT || !actual.includes(photo.sha256)) throw new Error(`scene ${sceneId}'s actual still request omits its real product photo (${photo.id})`);
  }
  return actual;
}

function kitProductEvidenceDigest(row) {
  return createHash('sha256').update(JSON.stringify([row.version, row.scene_id, row.image_sha256,
    row.product_photos, row.request_image_sha256, row.model, row.piece])).digest('hex');
}

/** Bind a successful still's hash to the real product photos in its actual request. */
function kitProductReferenceEvidence(sceneId, image, required, refs, model, piece) {
  if (!KIT_PRODUCT_SHA.test(image && image.sha256 || '')) throw new Error(`scene ${sceneId}'s generated still has no verified hash`);
  const row = { version: 1, scene_id: String(sceneId), image_sha256: image.sha256,
    product_photos: (required || []).map((photo) => ({ ...photo })),
    request_image_sha256: kitRequireProductRequest(sceneId, required, refs, model), model, piece };
  return { ...row, digest: kitProductEvidenceDigest(row) };
}

/** Refuse missing, altered or misbound evidence before any motion clip is ordered. */
function kitRequireProductFrame(sceneId, still, required, evidence = []) {
  if (!(required || []).length) return;
  const found = evidence.filter((row) => row.scene_id === String(sceneId));
  if (found.length !== 1) throw new Error(`scene ${sceneId} needs one product-reference evidence record from its still step`);
  const row = found[0];
  if (row.version !== 1 || row.model !== KIT_PRODUCT_EDIT || row.image_sha256 !== (still && still.sha256)) throw new Error(`scene ${sceneId}'s product-reference evidence is not bound to this Veo start frame`);
  if (row.digest !== kitProductEvidenceDigest(row)) throw new Error(`scene ${sceneId}'s product-reference evidence was altered`);
  for (const photo of required) {
    const matched = row.product_photos.some((source) => source.id === photo.id && source.sha256 === photo.sha256);
    if (!matched || !row.request_image_sha256.includes(photo.sha256)) throw new Error(`scene ${sceneId}'s still request did not include its current real product photo (${photo.id})`);
  }
}

// ---- _lib/scene-clips.mjs ----
// One moving clip per still, for image-to-video parts (video-kling 1.0.0, then
// video-veo-3): which stills move, each clip's prompt, how long each clip is,
// the keep window, and when a failed clip may fall back to its still. The part
// itself orders the pieces (the lint reads every paid call from the part's own
// source), in this order:
//
//   const tpl = kitClipTemplate(inputs.template ? await kitLoadTemplate(inputs.template) : null)
//   const jobs = kitClipJobs(tpl, {mode, stills, scenes, pick, skip_first, skip_last, look, answers, brand, cast, products, use})
//   const slots = kitClipSlots(jobs, spans)              // scenes mode with spans: seconds on screen per scene
//   per job: seconds = kitClipSeconds(slot or wanted, allowed, {min_s, max_s}).seconds
//   per job: order the piece; on an error, kitClipMayFallBack(err, {last_attempt}) says whether
//            the still stands in; a keep window is kitClipWindow(...) cut by kitClipTrim(...)
//
// Everything before the first order is pure, so a scene the template cannot
// fill, or a scene with no still, refuses the whole step before any piece is
// bought.
//
// Clip length (scenes mode with spans, from a voice or a song): each clip is on
// screen the way assemble 1.1.0 cuts it. A scene with a span runs from its
// span's start (the first from 0, unless a span this part does not make comes
// before it) to the next span's start, made here or not (the last to its
// span's end plus KIT_CLIP_TAIL_S); a scene with no span (no line)
// shares the spanned scene before it evenly (share_previous; scenes before the
// first spanned one share with it). The clip is then ceil(on screen + 0.2) s,
// rounded up to the model's allowed lengths and kept inside min_s..max_s. A
// clip that cannot be long enough is the longest allowed; assemble holds its
// last frame.
//
// Bundled into parts; every top-level name starts with `kitClip` or `KIT_CLIP`.

/** The margin added to a scene's time on screen before rounding up to a whole clip length. */
const KIT_CLIP_MARGIN_S = 0.2;
/** The hold after the last span: assemble 1.1.0's default tail_s. */
const KIT_CLIP_TAIL_S = 0.25;
/** The motion text used when the style gives no template, or a template without a motion text. */
const KIT_CLIP_DEFAULT_MOTION = '{picture?}. Subtle, natural motion. Steady camera, no zoom, no morphing, no new objects, no text';
/** How many clips are made at once. */
const KIT_CLIP_AT_ONCE = 4;

/**
 * The template a part fills: the style's (already checked by kitLoadTemplate),
 * or an empty version 1 template. A template without a motion text gets
 * KIT_CLIP_DEFAULT_MOTION.
 */
function kitClipTemplate(tpl) {
  const base = tpl && typeof tpl === 'object' ? tpl : { version: 1 };
  return typeof base.motion === 'string' ? base : { ...base, motion: KIT_CLIP_DEFAULT_MOTION };
}

/**
 * The clips to make, in order, each with its still and prompt:
 * [{id, index, scene, still, prompt, negative, tag}].
 *
 * - scenes mode: the picked plan scenes (kitPickScenes with pick, skip_first,
 *   skip_last); each needs the still whose id is its scene id.
 * - images mode: one clip per still, id = the still's id. The prompt is filled
 *   for the plan scene with that id when `scenes` has one, else for a bare
 *   scene {id} (with speaker = id when a cast member has that key, so an
 *   anchor still fills {speaker.name}).
 *
 * `use` picks the text: 'motion' (default) or a key of the template's
 * `templates`. Throws KitPromptGap for a scene the template cannot fill, and
 * Error for anything else wrong (a missing still, two stills with one id).
 */
function kitClipJobs(tpl, options = {}) {
  const { mode = 'scenes', stills = [], scenes = [], use = 'motion' } = options;
  const base = { look: options.look ?? null, answers: options.answers ?? null, brand: options.brand ?? null, cast: options.cast || [], products: options.products || [] };
  const byId = new Map();
  for (const s of stills) {
    const id = String(s.id);
    if (byId.has(id)) throw new Error(`two stills have the id ${id}`);
    byId.set(id, s.image);
  }
  let picked;
  if (mode === 'images') {
    const plan = new Map((scenes || []).filter((s) => s && s.id != null).map((s) => [String(s.id), s]));
    const keys = new Set((base.cast || []).map((m) => m && m.key));
    picked = stills.map((s, index) => {
      const id = String(s.id);
      const scene = plan.get(id) || (keys.has(id) ? { id, speaker: id } : { id });
      return { scene, index };
    });
  } else {
    picked = kitPickScenes(scenes, options.pick, { skip_first: options.skip_first, skip_last: options.skip_last });
    const seen = new Set();
    for (const { scene, index } of picked) {
      const id = scene && scene.id != null ? String(scene.id) : `#${index + 1}`;
      if (seen.has(id)) throw new Error(`two scenes have the id ${id}: each clip is named and matched by its scene id`);
      seen.add(id);
      if (!byId.has(id)) {
        throw new Error(`scene ${id} has no still: the stills must be keyed by scene id and cover every picked scene (match pick, skip_first and skip_last with the stills step)`);
      }
    }
  }
  return picked.map(({ scene, index }) => {
    const id = String(scene.id);
    const out = kitScenePrompt(tpl, { ...base, scene, index }, { use });
    return { id, index, scene, still: byId.get(id), prompt: out.prompt, negative: out.negative, tag: out.tag };
  });
}

/**
 * How long each job's scene is on screen, from the voice's or song's spans
 * ([{id, start_s, end_s}]), the way assemble 1.1.0 cuts it (see the header).
 * Returns a Map of job id -> seconds. Throws when a span is named twice or ends
 * before it starts, when the spanned jobs are not in the spans' order (assemble
 * would refuse the cut), or when no job has a span.
 */
function kitClipSlots(jobs, spans, { tail_s = KIT_CLIP_TAIL_S } = {}) {
  const byId = new Map();
  for (const s of spans || []) {
    const id = String(s.id);
    if (byId.has(id)) throw new Error(`spans name scene ${id} twice`);
    if (!(s.end_s >= s.start_s)) throw new Error(`span ${id} ends before it starts`);
    byId.set(id, s);
  }
  const groups = [];
  const lead = [];
  for (const j of jobs) {
    const span = byId.get(j.id);
    if (span) {
      const before = groups[groups.length - 1];
      if (before && !(span.start_s > before.span.start_s)) {
        throw new Error(`scene ${j.id} starts at or before scene ${before.id}: the scenes must be in the spans' order`);
      }
      groups.push({ id: j.id, span, members: [j.id] });
    } else if (groups.length) groups[groups.length - 1].members.push(j.id);
    else lead.push(j.id);
  }
  if (!groups.length) throw new Error('no picked scene has a span: the spans must name the scene ids');
  const starts = [...byId.values()].map((s) => s.start_s).sort((a, b) => a - b);
  const out = new Map();
  // Scenes with no span before the first spanned one: in the cut they share the
  // span before them. That is the first spanned scene's own, unless a span this
  // part does not make (a hook made by another step, left out with skip_first)
  // comes first: then they share that one's time with it.
  const first = groups[0];
  const earlier = starts.filter((t) => t < first.span.start_s);
  if (!earlier.length) first.members.unshift(...lead);
  else if (lead.length) {
    const each = (first.span.start_s - earlier[earlier.length - 1]) / (lead.length + 1);
    for (const id of lead) out.set(id, each);
  }
  groups.forEach((g, gi) => {
    // The first group starts at 0 only when it is the cut's first; after a span
    // this part does not make, it starts at its own span.
    const start = gi === 0 && !earlier.length ? 0 : g.span.start_s;
    // A group runs to the next span, whether this part makes that scene or not
    // (one left out by pick, an end card scene), else to its own end plus the tail.
    const next = starts.find((t) => t > g.span.start_s);
    const end = next != null ? next : g.span.end_s + tail_s;
    const each = Math.max(0, end - start) / g.members.length;
    for (const id of g.members) out.set(id, each);
  });
  return out;
}

/**
 * The allowed lengths inside min_s..max_s, smallest first. Throws when none is.
 */
function kitClipAllowed(allowed, { min_s = null, max_s = null } = {}) {
  if (min_s != null && max_s != null && min_s > max_s) throw new Error(`min_s ${min_s} is over max_s ${max_s}`);
  const out = [...allowed]
    .filter((a) => (min_s == null || a >= min_s - 1e-9) && (max_s == null || a <= max_s + 1e-9))
    .sort((a, b) => a - b);
  if (!out.length) throw new Error(`no clip length between ${min_s ?? 'any'} and ${max_s ?? 'any'} s: the model makes ${[...allowed].join(', ')} s`);
  return out;
}

/**
 * A clip's length for a scene on screen `need_s` seconds: ceil(need_s +
 * margin) rounded up to an allowed length inside min_s..max_s. With
 * `exact: true` (a length the style asked for) no margin is added. Returns
 * {seconds, short}: short when even the longest allowed length is under what
 * was wanted (assemble then holds the clip's last frame).
 */
function kitClipSeconds(need_s, allowed, { min_s = null, max_s = null, margin_s = KIT_CLIP_MARGIN_S, exact = false } = {}) {
  const ok = kitClipAllowed(allowed, { min_s, max_s });
  const want = Math.ceil(Math.max(0, Number(need_s) || 0) + (exact ? 0 : margin_s) - 1e-9);
  const hit = ok.find((a) => a >= want - 1e-9);
  return hit != null ? { seconds: hit, short: false } : { seconds: ok[ok.length - 1], short: true };
}

/**
 * The part of a clip to keep: `keep.seconds` from its start or its end
 * (anchor 'start' | 'end'). Returns {in_s, seconds}; the whole clip when it is
 * not longer than the window.
 */
function kitClipWindow(clip_s, keep) {
  const want = Number(keep && keep.seconds);
  if (!(want > 0) || !(clip_s > want)) return { in_s: 0, seconds: clip_s };
  return keep.anchor === 'end' ? { in_s: clip_s - want, seconds: want } : { in_s: 0, seconds: want };
}

/** Cuts `window` ({in_s, seconds}) out of a clip, without sound, into workDir/`name`; returns its FileRef. */
async function kitClipTrim(ctx, file, window, name) {
  await kitFfmpeg(ctx, ['-ss', kitNum(window.in_s, 3), '-i', file.path, '-t', kitNum(window.seconds, 3), '-map', '0:v:0', '-an', ...ctx.tools.encodeArgs('h264-intermediate'), join(ctx.workDir, name)]);
  return ctx.file(name, 'video');
}

/**
 * Whether a failed clip may become its still (fallback 'still'): a policy
 * refusal (provider_rejected) always; a provider failure or timeout only on the
 * step's last attempt, so the core's own retry runs first. Never a stop, a
 * refused input or an over-quote.
 */
function kitClipMayFallBack(err, { last_attempt = true } = {}) {
  const code = err && err.code;
  if (code === 'provider_rejected') return true;
  if (code === 'provider_failed' || code === 'timeout') return Boolean(last_attempt);
  return false;
}

/** Runs `work` over `items`, a few at a time, keeping their order. After one failure no lane starts another item. */
async function kitClipEach(items, work, at_once = KIT_CLIP_AT_ONCE) {
  const out = new Array(items.length);
  let next = 0;
  let failed = false;
  const lanes = Array.from({ length: Math.min(Math.max(1, at_once), items.length) }, async () => {
    while (next < items.length && !failed) {
      const i = next++;
      try {
        out[i] = await work(items[i], i);
      } catch (err) {
        failed = true;
        throw err;
      }
    }
  });
  await Promise.all(lanes);
  return out;
}

// ---- video-h3max/src/stills.mjs ----
// Mode stills: one H3 Max clip per picked plan scene, starting on that scene's
// still from a picture step (step.<stills>.images), timed to the voice the way
// video-veo-3's scenes mode is (_lib/scene-clips.mjs). It is the H3 route for
// narrated styles that cut many short scenes: up to 40 clips, made a few at a
// time, each a whole number of seconds from 4 to 15. A still is fitted to the
// clip's canvas by cover (centre crop), so no black bars reach the cut. A clip
// the provider refuses can fall back to its still (fallback 'still').
// 1.2.0: every clip keeps the first frame's light and exposure (the light lock), and
// broll: true is silent creator B-roll: each scene names one physical action in
// extra.action, and "Nobody speaks, lips closed, while <action>." is added; still hands
// are refused.
// 1.4.0: end_on_start_tags lists scene tags whose clips end on their own first frame (end_image_url),
// so a held product cannot finish turned to its back (GOOSE-4034).

/** H3's clip lengths: whole seconds, 4 to 15. */
const H3STILLS_ALLOWED = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const H3STILLS_DEFAULT_SECONDS = 5;
const H3STILLS_MAX_CLIPS = 40;
const H3STILLS_PROMPT_MAX = 12000;
/** Inputs only mode stills reads. */
const H3STILLS_ONLY = ['stills', 'spans', 'min_s', 'max_s', 'max_total_s', 'fallback', 'require_scene_tags', 'require_product_refs', 'product_reference_evidence', 'broll', 'end_on_start_tags'];

/** Whether a scene's clip must end on its first frame: its tag is one of end_on_start_tags. */
function h3StillsEndsOnStart(scene, tags) {
  if (!Array.isArray(tags) || !tags.length) return false;
  const tag = kitSceneTag(scene);
  return tag != null && tags.some((t) => kitTagKey(t) === kitTagKey(tag));
}
// Anything left that looks like a placeholder after filling is a typo.
const H3STILLS_PLACEHOLDER_LIKE = /\{[A-Za-z][A-Za-z0-9_.-]*\??\}/;

/** Every clip, checked before the first order: [{id, index, who, still, prompt, seconds}]. */
function h3StillsJobs(inputs, tpl, log = null) {
  if (inputs.require_scene_tags) kitRequireSceneTags(tpl, inputs.scenes || [], inputs);
  const jobs = kitClipJobs(tpl, {
    mode: 'scenes',
    stills: inputs.stills,
    scenes: inputs.scenes || [],
    pick: inputs.pick,
    skip_first: inputs.skip_first,
    skip_last: inputs.skip_last,
    look: inputs.look,
    answers: inputs.answers,
    brand: inputs.brand,
    cast: inputs.cast,
    products: inputs.products,
  });
  if (!jobs.length) throw new Error('no scene is picked for a clip');
  if (jobs.length > H3STILLS_MAX_CLIPS) throw new Error(`${jobs.length} scenes are picked; mode stills makes at most ${H3STILLS_MAX_CLIPS} clips`);
  if (inputs.require_product_refs) {
    for (const job of jobs) kitRequireProductFrame(job.id, job.still, kitProductScenePhotos(tpl, job.scene, inputs.products || []), inputs.product_reference_evidence || []);
  }
  const bounds = { min_s: inputs.min_s ?? null, max_s: inputs.max_s ?? null };
  const slots = inputs.spans ? kitClipSlots(jobs, inputs.spans) : null;
  let total = 0;
  for (const job of jobs) {
    job.who = `scene ${job.id}`;
    if (slots) {
      const length = kitClipSeconds(slots.get(job.id), H3STILLS_ALLOWED, bounds);
      job.seconds = length.seconds;
      if (length.short && log) log.info(`scene ${job.id} is on screen ${slots.get(job.id).toFixed(2)} s; its clip is the longest allowed, ${job.seconds} s`);
    } else {
      const want = inputs.seconds ?? H3STILLS_DEFAULT_SECONDS;
      const length = kitClipSeconds(want, H3STILLS_ALLOWED, { ...bounds, exact: true });
      if (length.short) throw new Error(`seconds ${want} is longer than the longest clip allowed here (${length.seconds} s)`);
      job.seconds = length.seconds;
    }
    total += job.seconds;
    if (!job.prompt) throw new Error(`${job.who} has an empty prompt: give the scene a picture or the template a motion text`);
    // B-roll: one named physical action, and "nobody speaks, lips closed" paired with it.
    let motion = job.prompt;
    if (inputs.broll) {
      const action = job.scene && job.scene.extra && typeof job.scene.extra === 'object' ? job.scene.extra.action : undefined;
      const problem = h3BrollActionProblem(action);
      if (problem) throw new Error(`${job.who} is B-roll and ${problem}`);
      const still = H3BROLL_STILL_HANDS.exec(motion);
      if (still) throw new Error(`${job.who} is B-roll and its prompt says "${still[0]}"; B-roll pairs "nobody speaks, lips closed" with the named action, never with still hands`);
      motion = kitPromptJoin([motion, h3BrollLine(action)]);
    }
    // The still is the first frame: keep its light and exposure.
    motion = h3SceneWithLightLock(motion);
    const prompt = job.negative ? kitPromptJoin([motion, `Avoid: ${job.negative}`]) : motion;
    const left = H3STILLS_PLACEHOLDER_LIKE.exec(prompt);
    if (left) throw new KitPromptGap(`${job.who} has an unknown placeholder ${left[0]}`, { placeholder: left[0], scene_id: job.id });
    if (prompt.length > H3STILLS_PROMPT_MAX) throw new Error(`${job.who}'s prompt is ${prompt.length} characters, over ${H3STILLS_PROMPT_MAX}`);
    // The still is the first frame and the only reference, so the prompt may call it Image 1.
    job.prompt = h3SceneProviderPrompt(prompt, 1, job.who);
  }
  if (inputs.max_total_s != null && total > inputs.max_total_s + 1e-9) {
    throw new Error(`the ${jobs.length} clips come to ${total} s, over max_total_s ${inputs.max_total_s}`);
  }
  return jobs;
}

/** Mode stills: every clip refused or fitted before the first order, then made a few at a time. */
async function h3StillsRun(inputs, ctx, manifest) {
  if (inputs.clips) throw ctx.error('bad_input', 'mode stills makes one clip per picked scene; clips are for modes reference and image_to_video');
  if (!inputs.stills) throw ctx.error('bad_input', 'mode stills needs stills (step.<stills>.images)');
  if (!inputs.scenes) throw ctx.error('bad_input', 'mode stills needs scenes');
  if (inputs.spans && inputs.seconds !== undefined) throw ctx.error('bad_input', 'give spans or seconds, not both');
  if (inputs.broll && inputs.generate_audio === true) throw ctx.error('bad_input', 'broll clips are silent: leave generate_audio out or set it to false');
  let jobs;
  try {
    const loaded = inputs.template ? await kitLoadTemplate(inputs.template) : null;
    jobs = h3StillsJobs(inputs, kitClipTemplate(loaded), ctx.log);
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', String((err && err.message) || err));
  }
  for (const job of jobs) job.start = job.still;
  await h3SceneFitStills(inputs, ctx, jobs);
  // A locked clip ends on the same fitted file it starts on.
  for (const job of jobs) if (h3StillsEndsOnStart(job.scene, inputs.end_on_start_tags)) job.end = job.start;

  const used = new Set();
  for (const job of jobs) job.piece = kitPieceName('clip', job.id, job.index, used);
  const fallback = inputs.fallback || 'fail';
  const lastAttempt = !(ctx.step && ctx.step.attempt < 1 + ((manifest.retry && manifest.retry.transient) || 0));
  const audio = inputs.generate_audio ?? !inputs.broll;
  let done = 0;

  const clips = await kitClipEach(jobs, async (job) => {
    kitStopIfAborted(ctx);
    const piece = job.piece;
    const body = h3SceneProviderBody(inputs, job, [job.start], ctx.seed(piece) % 2147483647);
    let ready;
    try {
      const result = await ctx.line.order({ piece, provider: 'fal', path: H3SCENE_MODEL, body, results: [{ pointer: '/json/video/url', name: `${piece}.mp4`, media: 'video' }] });
      const file = result && result.files && result.files[`${piece}.mp4`];
      if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
      ready = await h3SceneProviderVideo(ctx, file, piece, audio);
    } catch (err) {
      // A stop is never masked by a still, whatever the provider's error says.
      kitStopIfAborted(ctx);
      if (fallback !== 'still' || !kitClipMayFallBack(err, { last_attempt: lastAttempt })) throw err;
      ctx.log.warn(`${piece} became its still: ${err.code}`, { piece, code: err.code });
      ctx.progress({ done: ++done, total: jobs.length });
      return { id: job.id, image: job.still, seconds: job.seconds };
    }
    const length = await kitDuration(ctx, ready.file);
    ctx.progress({ done: ++done, total: jobs.length });
    return { id: job.id, video: ready.file, seconds: Number(length.toFixed(3)) };
  });

  const out = { clips };
  if (clips[0].video) out.video = clips[0].video;
  return kitCheckOutputs(ctx, manifest, out);
}

// ---- video-h3max/src/part.mjs ----
// H3 Max scene clips with native dialogue, or silent copies for later narration.
// The scene, template, and take planning follows video-seedance-2 1.2.0, but
// every paid piece uses H3 Max's own request contract. All prompts, references,
// modes, and limits are checked before the first order. Generic scenes may
// include multiple speakers; creator-h3 remains the single-creator talk part.
// Mode stills (stills.mjs) moves a picture step's scene stills, timed to the
// voice, the way video-veo-3 and video-kling do.
// 1.2.0: modes stills and image_to_video add the light lock ("Keep the first frame's light
// and exposure, matte skin, no added shine or sharpening halos."); mode stills' broll: true
// is silent creator B-roll with one named physical action per scene.

const H3SCENE_PROMPT_MAX = 12000;
const H3SCENE_MAX_REFS = 9;
const H3SCENE_MAX_CLIPS = 12;
const H3SCENE_DEFAULT_SECONDS = 5;
const H3SCENE_SCENE_ONLY = ['pick', 'skip_first', 'skip_last', 'seconds'];
// Inputs that only the take modes read, and the modes each one needs.
const H3SCENE_TAKE_ONLY = {
  takes: ['takes'],
  chain: ['takes'],
  off_screen_lines: ['take'],
  off_screen_tags: ['take'],
  words_per_second: ['take', 'takes'],
  max_words: ['take', 'takes'],
  pronunciations: ['take', 'takes'],
  first_frame: ['take', 'takes'],
  last_frame: ['take', 'takes'],
};
// Context inputs make clip placeholders filled or refused. A plain clip list
// with no plan or template context keeps literal braces as authored.
const H3SCENE_NEW_INPUTS = ['mode', 'seed', 'template', 'look', 'answers', 'brand', 'cast', 'products', 'scenes'];
// The template key a clip's own prompt is filled under; templates keys are words, so it never collides.
const H3SCENE_OWN = ' clip prompt';
// Anything left that looks like a placeholder after filling ({Answers.x}, {answers.a.b}) is a typo.
const H3SCENE_PLACEHOLDER_LIKE = /\{[A-Za-z][A-Za-z0-9_.-]*\??\}/;

function h3SceneIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

function h3SceneFirstPhoto(products) {
  for (const p of products || []) {
    if (p && Array.isArray(p.images) && h3SceneIsFile(p.images[0])) return p.images[0];
  }
  return null;
}

/** The references the template's refs picked: named members' pictures, product photos, the scene's picture. */
function h3ScenePlanRefs(refs, kinds) {
  const out = [];
  for (const kind of kinds) {
    if (kind === 'anchor') for (const m of refs.cast) if (h3SceneIsFile(m.image)) out.push(m.image);
    if (kind === 'product') for (const p of refs.products) if (h3SceneIsFile(p.images[0])) out.push(p.images[0]);
    if (kind === 'scene_image' && refs.scene_image) out.push(refs.scene_image);
  }
  if (out.length > H3SCENE_MAX_REFS) throw new Error(`the template picked ${out.length} reference images; H3 Max accepts at most ${H3SCENE_MAX_REFS}`);
  return out;
}

/** One clip's prompt, filled from the template and the plan. `own` is the clip's own prompt text, if any. */
function h3ScenePrompt(tpl, base, { scene, index, own, use, who, requirePlanProduct = true }) {
  const t = own == null ? tpl : { ...tpl, templates: { ...(tpl.templates || {}), [H3SCENE_OWN]: own } };
  let out;
  try {
    out = kitScenePrompt(t, { ...base, scene, index }, { use: own == null ? use : H3SCENE_OWN });
  } catch (err) {
    if (err instanceof KitPromptGap) throw new KitPromptGap(err.message.replace(/^scene \S+/, who), err);
    throw new Error(`${who}: ${err.message}`);
  }
  const prompt = out.negative ? kitPromptJoin([out.prompt, `Avoid: ${out.negative}`]) : out.prompt;
  const left = H3SCENE_PLACEHOLDER_LIKE.exec(prompt);
  if (left) throw new KitPromptGap(`${who} has an unknown placeholder ${left[0]}`, { placeholder: left[0], scene_id: scene.id });
  const ruleKey = out.tag && tpl.by_tag ? Object.keys(tpl.by_tag).find((key) => kitTagKey(key) === kitTagKey(out.tag)) : null;
  const rule = ruleKey ? tpl.by_tag[ruleKey] : null;
  const refKinds = Array.isArray(rule && rule.refs) ? rule.refs : Array.isArray(tpl.refs) ? tpl.refs : ['anchor', 'product', 'scene_image'];
  const explicitRefs = Array.isArray(rule && rule.refs) || Array.isArray(tpl.refs);
  if (requirePlanProduct && explicitRefs && refKinds.includes('product') && !out.refs.products.some((p) => h3SceneIsFile(p.images && p.images[0]))) {
    throw new Error(`${who} requests a product reference, but no matching product has a photo; name the product in its picture or line and supply its photo`);
  }
  return { prompt, refs: out.refs, refKinds };
}

/** The use for a clip with no prompt of its own: templates.<id>, else motion, else scene. */
function h3SceneUse(tpl, id) {
  if (id != null && tpl.templates && typeof tpl.templates[id] === 'string') return id;
  return typeof tpl.motion === 'string' ? 'motion' : 'scene';
}

/** Every job, refused here before any piece is ordered: [{id, index, prompt, seconds, audio, refs?, start?, end?}]. */
function h3SceneJobs(inputs, tpl, i2v) {
  const products = inputs.products || [];
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null, cast: inputs.cast || [], products };
  const fill = Boolean(inputs.template);
  const context = H3SCENE_NEW_INPUTS.some((key) => inputs[key] != null)
    || (inputs.clips || []).some((c) => c.start_image !== undefined || c.end_image !== undefined);
  const jobs = [];
  if (inputs.clips) {
    const byId = new Map((inputs.scenes || []).map((s) => [s.id, s]));
    for (const [i, clip] of inputs.clips.entries()) {
      const id = clip.id != null ? clip.id : null;
      const who = `clip ${id ?? i + 1}`;
      const scene = (id != null && byId.get(id)) || { id: id ?? String(i + 1) };
      const own = clip.prompt;
      if (own == null && !fill) throw new Error(`${who} needs a prompt (or give a template)`);
      if (i2v && clip.references) throw new Error(`${who}: references are for mode reference; image_to_video takes start_image`);
      if (!i2v && (clip.start_image !== undefined || clip.end_image !== undefined)) throw new Error(`${who}: start_image and end_image need mode image_to_video`);
      // A plain clip list can contain literal braces; plan-backed clips are filled.
      const filled = fill || (context && H3SCENE_PLACEHOLDER_LIKE.test(own))
        ? h3ScenePrompt(tpl, base, { scene, index: i, own, use: h3SceneUse(tpl, id), who, requirePlanProduct: !clip.references && clip.start_image === undefined })
        : { prompt: own, refs: null };
      jobs.push({ id, index: i, who, scene, prompt: filled.prompt, planRefs: filled.refs, refKinds: filled.refKinds, seconds: clip.seconds, audio: clip.generate_audio, clip });
    }
  } else {
    const picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
    if (!picked.length) throw new Error('no scene is picked for a clip');
    if (picked.length > H3SCENE_MAX_CLIPS) throw new Error(`${picked.length} scenes are picked; one run makes at most ${H3SCENE_MAX_CLIPS} clips`);
    const use = h3SceneUse(tpl, null);
    for (const { scene, index } of picked) {
      const who = `scene ${scene.id}`;
      const filled = h3ScenePrompt(tpl, base, { scene, index, own: null, use, who });
      jobs.push({ id: scene.id, index, who, scene, prompt: filled.prompt, planRefs: filled.refs, refKinds: filled.refKinds, seconds: inputs.seconds ?? H3SCENE_DEFAULT_SECONDS, audio: undefined, clip: {} });
    }
  }
  for (const j of jobs) {
    if (!j.prompt) throw new Error(`${j.who} has an empty prompt`);
    if (j.prompt.length > H3SCENE_PROMPT_MAX) throw new Error(`${j.who}'s prompt is ${j.prompt.length} characters, over ${H3SCENE_PROMPT_MAX}`);
    if (i2v) {
      const want = j.clip.start_image;
      if (want === 'product') {
        // The product the scene names (whatever the template's refs pick), else the first with a photo.
        j.start = h3SceneFirstPhoto(kitNamedProducts(j.scene, products)) || h3SceneFirstPhoto(products);
        if (!j.start) throw new Error(`${j.who} starts on the product, but no product has a photo`);
      } else if (h3SceneIsFile(want)) {
        j.start = want;
      } else {
        const r = j.planRefs;
        j.start = r ? r.scene_image || h3SceneFirstPhoto(r.products) || (r.cast.find((m) => h3SceneIsFile(m.image)) || {}).image || null : null;
        if (!j.start) throw new Error(`${j.who} needs a start_image: no scene picture, product photo or cast picture to start from`);
      }
      const end = j.clip.end_image;
      j.end = end === 'start' ? j.start : h3SceneIsFile(end) ? end : null;
    } else {
      j.refs = j.clip.references || (j.planRefs ? h3ScenePlanRefs(j.planRefs, j.refKinds) : []);
      if (!j.refs.length) throw new Error(`${j.who} has no reference image: give references, or products, cast or scene pictures the template's refs can use`);
    }
    // 1.2.0: a clip that starts on a first frame keeps its light and exposure.
    if (i2v) j.prompt = h3SceneWithLightLock(j.prompt);
    j.prompt = h3SceneProviderPrompt(j.prompt, i2v ? 1 : j.refs.length, j.who);
  }
  return jobs;
}

/** Mode take or takes: every take's prompt written before the first piece, then the takes in order. */
async function h3SceneRunTakeMode(inputs, ctx, manifest) {
  if (inputs.clips) throw ctx.error('bad_input', `mode ${inputs.mode} writes its own prompt from scenes; clips are for modes reference and image_to_video`);
  if (!inputs.scenes) throw ctx.error('bad_input', `mode ${inputs.mode} needs scenes`);
  let jobs;
  try {
    const tpl = inputs.template ? await kitLoadTemplate(inputs.template) : { version: 1 };
    jobs = h3SceneTakeJobs(inputs, tpl);
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', String((err && err.message) || err));
  }
  await h3ScenePrepareReferences(ctx, jobs);
  // 1.5.0: modes take and takes may start on a composed first frame and end on a last one (both fitted by cover,
  // as mode stills fits its stills). A first frame fixes where the creator and the product sit; a last frame showing
  // the use done (a cap open) gives H3 both states of a small part a hand covers, so it does not redraw it. With
  // several takes, every take starts on the first frame, every take but the last ends on it too, and the last ends on
  // the last frame: the joins are the same picture on both sides, and the use gets a short take of its own.
  if (inputs.last_frame && !inputs.first_frame) throw ctx.error('bad_input', 'last_frame needs first_frame');
  if (inputs.first_frame && inputs.chain) throw ctx.error('bad_input', 'first_frame and chain both join the takes; use one');
  if (inputs.first_frame) {
    const fit = { start: inputs.first_frame, who: 'first_frame' };
    const fitEnd = inputs.last_frame ? { start: inputs.last_frame, who: 'last_frame' } : null;
    await h3SceneFitStills(inputs, ctx, fitEnd ? [fit, fitEnd] : [fit]);
    for (const [k, j] of jobs.entries()) {
      j.start = fit.start;
      const last = k === jobs.length - 1;
      if (!last) j.end = fit.start;
      else if (fitEnd) j.end = fitEnd.start;
    }
  }
  return kitCheckOutputs(ctx, manifest, await h3SceneRunTakes(inputs, ctx, jobs));
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const mode = inputs.mode ?? 'reference';
  for (const [key, modes] of Object.entries(H3SCENE_TAKE_ONLY)) {
    if (inputs[key] !== undefined && !modes.includes(mode)) throw ctx.error('bad_input', `${key} works only in mode ${modes.join(' or ')}`);
  }
  if (mode !== 'stills') {
    for (const key of H3STILLS_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in mode stills`);
  }
  if (mode === 'stills') return h3StillsRun(inputs, ctx, manifest);
  if (mode === 'take' || mode === 'takes') return h3SceneRunTakeMode(inputs, ctx, manifest);
  const i2v = mode === 'image_to_video';
  if (!inputs.clips && !inputs.scenes) throw ctx.error('bad_input', 'give clips, or scenes for one clip per scene');
  if (inputs.clips) {
    for (const key of H3SCENE_SCENE_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only without clips (one clip per scene)`);
  }

  let jobs;
  try {
    const tpl = inputs.template ? await kitLoadTemplate(inputs.template) : { version: 1 };
    jobs = h3SceneJobs(inputs, tpl, i2v);
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', String((err && err.message) || err));
  }

  if (i2v) await h3ScenePrepareFrames(inputs, ctx, jobs);
  else await h3ScenePrepareReferences(ctx, jobs);
  const used = new Set();
  for (const j of jobs) j.piece = kitPieceName('clip', j.id, j.index, used);
  const clips = [];
  for (const [n, j] of jobs.entries()) {
    kitStopIfAborted(ctx);
    const piece = j.piece;
    const audio = j.audio ?? inputs.generate_audio ?? true;
    const body = h3SceneProviderBody(inputs, j, i2v ? [j.start] : j.refs, ctx.seed(piece) % 2147483647);
    const result = await ctx.line.order({ piece, provider: 'fal', path: H3SCENE_MODEL, body, results: [{ pointer: '/json/video/url', name: `${piece}.mp4`, media: 'video' }] });
    const file = result && result.files && result.files[`${piece}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    const ready = await h3SceneProviderVideo(ctx, file, piece, audio);
    clips.push({ id: String(j.id ?? j.index + 1), video: ready.file, seconds: j.seconds });
    ctx.progress({ done: n + 1, total: jobs.length });
  }
  return kitCheckOutputs(ctx, manifest, { clips, video: clips[0].video });
}
