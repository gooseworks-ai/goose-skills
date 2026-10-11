// Built from video-seedance-2/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- video-seedance-2/src/takes.mjs ----
// video-seedance-2 1.2.0: the take and takes modes. One take is one paid
// Seedance reference-to-video piece whose prompt holds several plan scenes as
// time-windowed beats ("Beat 2 (4-8s): ..."), so a creator says every line in
// one recording with native lip-synced audio.
//
//   take   one take of up to 4 picked scenes (a creator product review). A
//          beat whose picture keeps the face off screen (a rear-camera or
//          macro shot) may not carry a line: Seedance would fake a talking
//          mouth. off_screen_lines: 'voiceover' writes it as voice-over instead.
//   takes  takes.count takes (1 to 4) of up to 8 scenes each, split by
//          scene.extra.take or evenly in order. Take 1's text is the template's
//          templates[takes.first], later takes use templates[takes.later] (a
//          street interview asks its question once). chain {crop: 'bottom_45'}
//          hands a face-free still of take 1 (the bottom 45% of one frame) to
//          every later take as one more reference, so they share its street,
//          props and microphone; chained takes run in order.
//
// Takes are joined in order into one `video` with one `timeline` (critic #23):
// scenes are the plan scene ids at their beat windows, scaled to each take's
// real length; speech is empty (transcribe the joined video once). Every prompt
// is written, and every limit checked, before the first piece is ordered.

const SD_TAKE_REF = 'bytedance/seedance-2.0/reference-to-video';
// fal's schema for the reference model takes duration as a STRING enum ('auto', '4'..'15'); fal
// called directly answers 422 to an integer. The take modes send the string (the app line's fal
// proxy reads String(body.duration), so it is safe there too); modes reference and image_to_video
// keep their 1.0.1 and 1.1.0 bodies byte for byte.
const SD_TAKE_DURATIONS = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
const SD_TAKE_PROMPT_MAX = 12000;
const SD_TAKE_MAX_REFS = 9;
const SD_TAKE_MAX_BEATS = 4;
const SD_TAKES_MAX_BEATS = 8;
const SD_TAKE_DEFAULT_SECONDS = 15;
const SD_TAKE_DEFAULT_WPS = 2.5;
// A spoken beat needs its words at words_per_second plus a breath; a silent beat holds this long.
const SD_TAKE_BREATH_S = 0.5;
const SD_TAKE_SILENT_S = 1.5;
// Beat edges are written in half seconds ("8-11.5s"), as the shipped prompts were.
const SD_TAKE_STEP_S = 0.5;
const SD_TAKE_HEAD = ' take head';
const SD_TAKE_PLACEHOLDER_LIKE = /\{[A-Za-z][A-Za-z0-9_.-]*\??\}/;
// A beat keeps the face off screen when its tag (extra.shot or a leading "Tag:") is one of these, or its picture says so.
const SD_OFF_SCREEN_TAGS = ['rear', 'rear-camera', 'rear-cam', 'back-camera', 'macro', 'hands', 'off-screen', 'cutaway', 'b-roll', 'broll'];
const SD_OFF_SCREEN_RE =
  /\b(?:face\s+(?:is\s+|stays\s+|mostly\s+|fully\s+|kept\s+)?(?:off[- ]?screen|off[- ]?camera|out\s+of\s+(?:the\s+)?frame|not\s+(?:in\s+(?:the\s+)?frame|visible|shown))|rear[- ]camera|rear[- ]facing\s+camera|back\s+camera|no\s+face|faceless)\b/i;
// chain.crop -> the share of the frame's height kept at the bottom (below every face).
const SD_CHAIN_CROPS = { bottom_45: 0.45 };
const SD_CHAIN_DEFAULT_AT_S = 0.5;
// The size rule (MASTER-PLAN §4.12): the join caps its bitrate and refuses an output over 180 MB.
const SD_JOIN_RATE = ['-maxrate', '16M', '-bufsize', '32M'];
const SD_JOIN_MAX_BYTES = 180 * 1024 * 1024;

function sdTakeIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

/** Spoken words in a line (a token with a letter or digit). */
function sdTakeWords(text) {
  return String(text == null ? '' : text)
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Joins prompt parts with one space after an ending mark (a closing quote after one counts), else ". ". Never rewrites a part. */
function sdTakeJoinText(parts) {
  let out = '';
  for (const p of parts.map((x) => String(x == null ? '' : x).trim()).filter(Boolean)) {
    out = !out ? p : /[.!?;:,]["\u201d']?$/.test(out) ? `${out} ${p}` : `${out}. ${p}`;
  }
  return out;
}

function sdTakeSec(x) {
  return String(Number(x.toFixed(2)));
}

/** True when the beat keeps the face off screen: its tag is in `tags`, or its picture says so. */
function sdTakeFaceOffScreen(scene, tags) {
  const tag = kitSceneTag(scene);
  if (tag && new Set(tags.map(kitTagKey)).has(kitTagKey(tag))) return true;
  return typeof scene.picture === 'string' && SD_OFF_SCREEN_RE.test(scene.picture);
}

/**
 * Beat windows in seconds for one take: each spoken beat needs words / wps + a breath, each silent
 * beat SD_TAKE_SILENT_S; the needs are stretched to fill `seconds` and the edges put on half seconds.
 * Throws when the beats need more than the take holds.
 */
function sdTakeWindows(words, seconds, wps, who) {
  const need = words.map((w) => (w ? w / wps + SD_TAKE_BREATH_S : SD_TAKE_SILENT_S));
  const total = need.reduce((a, b) => a + b, 0);
  if (total > seconds + 1e-9) {
    throw new Error(`${who}'s beats need ${total.toFixed(1)} s at ${wps} words a second, more than its ${seconds} s; cut words or beats`);
  }
  const scale = seconds / total;
  const edges = [0];
  let acc = 0;
  for (let i = 0; i < need.length; i++) {
    acc += need[i] * scale;
    edges.push(i === need.length - 1 ? seconds : Math.round(acc / SD_TAKE_STEP_S) * SD_TAKE_STEP_S);
  }
  for (let i = 1; i < edges.length - 1; i++) edges[i] = Math.max(edges[i], edges[i - 1] + SD_TAKE_STEP_S);
  for (let i = edges.length - 2; i > 0; i--) edges[i] = Math.min(edges[i], edges[i + 1] - SD_TAKE_STEP_S);
  return need.map((_, i) => ({ start: edges[i], end: edges[i + 1] }));
}

/**
 * The picked scenes split into takes: by scene.extra.take (1-based, in order) when any scene sets it,
 * else evenly in order (earlier takes get the extra scene). Returns [[{scene, index}], ...].
 */
function sdTakeGroups(picked, count) {
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
function sdTakeWho(scene, cast) {
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
function sdTakeBeatText(tpl, scene) {
  if (tpl.templates && typeof tpl.templates.beat === 'string') return { use: 'beat', text: tpl.templates.beat };
  const tag = kitSceneTag(scene);
  if (tag && tpl.by_tag && typeof tpl.by_tag === 'object') {
    const key = Object.keys(tpl.by_tag).find((k) => kitTagKey(k) === kitTagKey(tag));
    const rule = key == null ? null : tpl.by_tag[key];
    if (rule && typeof rule.scene === 'string') return { use: 'scene', text: rule.scene };
  }
  return { use: 'scene', text: typeof tpl.scene === 'string' ? tpl.scene : '{picture}' };
}

function sdTakeLeftover(text, who, sceneId) {
  const left = SD_TAKE_PLACEHOLDER_LIKE.exec(text);
  if (left) throw new KitPromptGap(`${who} has an unknown placeholder ${left[0]}`, { placeholder: left[0], scene_id: sceneId });
}

/** Adds refs to the take's ordered lists without repeats. */
function sdTakeAddRefs(into, refs) {
  for (const m of refs.cast) if (!into.cast.some((c) => c.key === m.key)) into.cast.push(m);
  for (const p of refs.products) if (!into.products.some((q) => q.id === p.id)) into.products.push(p);
  if (refs.scene_image && !into.scenes.some((f) => f.sha256 === refs.scene_image.sha256 && f.path === refs.scene_image.path)) into.scenes.push(refs.scene_image);
}

/** The take's reference files in the template's refs order (anchor, product, scene_image), at most `max`. */
function sdTakeRefFiles(tpl, refs, max) {
  const kinds = Array.isArray(tpl.refs) ? tpl.refs : ['anchor', 'product', 'scene_image'];
  const out = [];
  for (const kind of kinds) {
    if (kind === 'anchor') for (const m of refs.cast) if (sdTakeIsFile(m.image)) out.push(m.image);
    if (kind === 'product') for (const p of refs.products) if (Array.isArray(p.images) && sdTakeIsFile(p.images[0])) out.push(p.images[0]);
    if (kind === 'scene_image') out.push(...refs.scenes);
  }
  return out.slice(0, max);
}

/**
 * One take's prompt and references: prefix and the take's own text (templates[head]), one line per
 * beat with its window and its dialogue, then suffix and "Avoid: <negative>". `beats` are
 * [{scene, index}] of this take. Throws (before any order) on every refusal.
 */
function sdTakePrompt(tpl, base, { id, index, beats, head, seconds, wps, pairs, offScreen }) {
  const who = `take ${id}`;
  const windows = sdTakeWindows(beats.map((b) => sdTakeWords(b.scene.line)), seconds, wps, who);
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
      if (sdTakeFaceOffScreen(scene, offScreen.tags)) {
        if (offScreen.lines === 'refuse') {
          throw new Error(`scene ${scene.id} has a line, but its picture keeps the face off screen; move the line to a beat that shows the face`);
        }
        voiceover = true;
      }
    }
    const spoken = line ? kitApplySayAs(line, pairs).spoken : null;
    const said = { ...scene, line: spoken };
    const pick = sdTakeBeatText(tpl, scene);
    const out = kitScenePrompt(beatTpl, { ...base, scene: said, index: at }, { use: pick.use });
    sdTakeLeftover(out.prompt, `scene ${scene.id}`, scene.id);
    if (out.negative) negatives.push(out.negative);
    sdTakeAddRefs(refs, out.refs);
    let dialogue = '';
    if (spoken && !/\{line\??\}/.test(pick.text)) {
      dialogue = voiceover ? `Voice-over from ${sdTakeWho(scene, base.cast)}, lips not on screen: "${spoken}"` : `${sdTakeWho(scene, base.cast)} says: "${spoken}"`;
    }
    const w = windows[n];
    texts.push(`Beat ${n + 1} (${sdTakeSec(w.start)}-${sdTakeSec(w.end)}s): ${sdTakeJoinText([out.prompt, dialogue])}`);
    if (spoken) lines.push(spoken);
    if (typeof scene.picture === 'string' && scene.picture.trim()) pictures.push(scene.picture.trim());
    if (speaker == null && line && scene.speaker != null) speaker = scene.speaker;
  }
  // The take as one scene, for the text around the beats ({product.name}, {cast_looks}, {answers.KEY}).
  const takeScene = { id, picture: pictures.join('. '), line: lines.join(' '), on_screen: null, speaker, extra: null };
  const headText = head != null && tpl.templates && typeof tpl.templates[head] === 'string' ? tpl.templates[head] : '';
  const headTpl = { ...tpl, by_tag: undefined, suffix: undefined, negative: undefined, templates: { ...(tpl.templates || {}), [SD_TAKE_HEAD]: headText } };
  const tailTpl = { ...tpl, by_tag: undefined, prefix: undefined, templates: { ...(tpl.templates || {}), [SD_TAKE_HEAD]: '' } };
  let headOut;
  let tailOut;
  try {
    headOut = kitScenePrompt(headTpl, { ...base, scene: takeScene, index }, { use: SD_TAKE_HEAD });
    tailOut = kitScenePrompt(tailTpl, { ...base, scene: takeScene, index }, { use: SD_TAKE_HEAD });
  } catch (err) {
    if (err instanceof KitPromptGap) throw new KitPromptGap(err.message.replace(/^scene \S+/, who), err);
    throw err;
  }
  sdTakeLeftover(headOut.prompt, who, null);
  sdTakeLeftover(tailOut.prompt, who, null);
  if (tailOut.negative) negatives.unshift(tailOut.negative);
  sdTakeAddRefs(refs, tailOut.refs);

  let prompt = sdTakeJoinText([headOut.prompt, ...texts, tailOut.prompt]);
  const avoid = [...new Set(negatives.filter(Boolean))];
  if (avoid.length) prompt = sdTakeJoinText([prompt, `Avoid: ${avoid.join(', ')}`]);
  for (const phrase of Array.isArray(tpl.banned) ? tpl.banned : []) {
    const re = kitWholeWordsRe(phrase);
    if (re && re.test(prompt)) throw new KitPromptGap(`${who} uses the banned phrase "${phrase.trim()}"`, { kind: 'banned', phrase: phrase.trim() });
  }
  if (prompt.length > SD_TAKE_PROMPT_MAX) throw new Error(`${who}'s prompt is ${prompt.length} characters, over ${SD_TAKE_PROMPT_MAX}`);
  const max = Math.min(SD_TAKE_MAX_REFS, Number.isInteger(tpl.max_refs) ? tpl.max_refs : SD_TAKE_MAX_REFS);
  const files = sdTakeRefFiles(tpl, refs, max);
  return { id, prompt, refs: files, windows, scene_ids: beats.map((b) => String(b.scene.id)) };
}

/** A take's whole seconds as fal's duration enum value ('4'..'15'); anything else is refused. */
function sdTakeDuration(seconds) {
  const value = Number.isInteger(seconds) ? String(seconds) : '';
  if (!SD_TAKE_DURATIONS.includes(value)) throw new Error(`a take lasts ${seconds} s; Seedance takes whole seconds from 4 to 15`);
  return value;
}

/** Every take job for mode take or takes, refused here before any piece is ordered. */
function sdTakeJobs(inputs, tpl) {
  const many = inputs.mode === 'takes';
  const picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
  if (!picked.length) throw new Error('no scene is picked for the take');
  const spec = inputs.takes || {};
  const count = many ? spec.count ?? 1 : 1;
  const groups = many ? sdTakeGroups(picked, count) : [picked];
  const limit = many ? SD_TAKES_MAX_BEATS : SD_TAKE_MAX_BEATS;
  const seconds = inputs.seconds ?? SD_TAKE_DEFAULT_SECONDS;
  const duration = sdTakeDuration(seconds);
  const wps = inputs.words_per_second ?? SD_TAKE_DEFAULT_WPS;
  const maxWords = inputs.max_words ?? Math.floor(seconds * wps);
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
  const offScreen = many ? null : { lines: inputs.off_screen_lines ?? 'refuse', tags: inputs.off_screen_tags ?? SD_OFF_SCREEN_TAGS };
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null, cast: inputs.cast || [], products: inputs.products || [] };
  const jobs = [];
  for (const [k, beats] of groups.entries()) {
    const id = `t${k + 1}`;
    if (beats.length > limit) throw new Error(`take ${id} has ${beats.length} scenes; a take holds at most ${limit} beats`);
    const words = beats.reduce((a, b) => a + sdTakeWords(b.scene.line), 0);
    if (words > maxWords) throw new Error(`take ${id} has ${words} spoken words, more than ${maxWords} for ${seconds} s`);
    const job = sdTakePrompt(tpl, base, { id, index: beats[0].index, beats, head: k === 0 ? first : later, seconds, wps, pairs, offScreen });
    if (!job.refs.length) throw new Error(`take ${id} has no reference image: give cast pictures, product photos or scene pictures the template's refs can use`);
    if (inputs.chain && k > 0 && job.refs.length >= SD_TAKE_MAX_REFS) throw new Error(`take ${id} already has ${SD_TAKE_MAX_REFS} references; the chain still needs one more`);
    jobs.push({ ...job, index: k, seconds, duration });
  }
  return jobs;
}

/** The chain still: one frame of take 1 at chain.at_s, keeping only the bottom share of its height (below every face). */
async function sdTakeChainStill(ctx, take, chain) {
  const keep = SD_CHAIN_CROPS[chain.crop];
  const length = await kitDuration(ctx, take);
  const at = Math.max(0, Math.min(chain.at_s ?? SD_CHAIN_DEFAULT_AT_S, length - 0.1));
  const crop = `crop=iw:trunc(ih*${keep}/2)*2:0:ih-trunc(ih*${keep}/2)*2`;
  await kitFfmpeg(ctx, ['-ss', kitNum(at), '-i', take.path, '-frames:v', '1', '-vf', crop, join(ctx.workDir, 'chain-still.png')]);
  return ctx.file('chain-still.png', 'image');
}

/** The takes joined in order with hard cuts, at the first take's size and frame rate. */
async function sdTakeJoin(ctx, made, audio) {
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
    ...SD_JOIN_RATE,
    ...(audio ? ctx.tools.encodeArgs('aac') : []),
    out,
  ]);
  const bytes = statSync(out).size;
  if (bytes > SD_JOIN_MAX_BYTES) throw ctx.error('output_invalid', `the joined takes are ${Math.round(bytes / 1048576)} MB, over 180 MB`);
  return ctx.file('takes.mp4', 'video');
}

/** Runs mode take or takes: orders each take in order, then joins them. Returns the part's outputs. */
async function sdRunTakes(inputs, ctx, jobs) {
  const audio = inputs.generate_audio ?? true;
  const used = new Set();
  for (const j of jobs) j.piece = kitPieceName('take', j.id, j.index, used);
  const made = [];
  let still = null;
  for (const [k, j] of jobs.entries()) {
    kitStopIfAborted(ctx);
    const piece = j.piece;
    const refs = still ? [...j.refs, still] : j.refs;
    const body = {
      prompt: j.prompt,
      image_urls: refs,
      resolution: inputs.resolution ?? '1080p',
      duration: j.duration,
      aspect_ratio: inputs.aspect_ratio ?? '9:16',
      generate_audio: audio,
      seed: ctx.seed(piece) % 2147483647,
    };
    const result = await ctx.line.order({ piece, provider: 'fal', path: SD_TAKE_REF, body, results: [{ pointer: '/json/video/url', name: `${piece}.mp4`, media: 'video' }] });
    const file = result && result.files && result.files[`${piece}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    const info = await ctx.tools.probe(file.path);
    if (audio && !info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its native audio`);
    if (!info.width || !info.height) throw ctx.error('provider_failed', `${piece} came back without a picture`);
    made.push({ job: j, file, info, length: await kitDuration(ctx, file) });
    if (k === 0 && inputs.chain && jobs.length > 1) still = await sdTakeChainStill(ctx, file, inputs.chain);
    ctx.progress({ done: k + 1, total: jobs.length });
  }
  const video = made.length === 1 ? made[0].file : await sdTakeJoin(ctx, made, audio);
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

// ---- video-seedance-2/src/part.mjs ----
// video-seedance-2: short clips from ByteDance Seedance 2.0 on fal, one paid
// piece per clip (D6: short scenes with native audio; creator-h3 is the default
// for scripted lines). A policy refusal (likeness of a real person, partner
// validation) is final for that exact clip: the line says so and the kit never
// resubmits it.
//
// Two models (mode, 1.1.0):
//   reference       bytedance/seedance-2.0/reference-to-video: the
//                   create-video-seedance-2-fal atom's request {prompt,
//                   image_urls (1 to 9, the first is @Image1), resolution,
//                   duration (an integer, 4 to 15), aspect_ratio,
//                   generate_audio, seed}. Unchanged from 1.0.1, so a 1.0.1
//                   clip list orders byte-identical pieces.
//   image_to_video  bytedance/seedance-2.0/image-to-video: {prompt, image_url
//                   (the start frame), end_image_url?, resolution, duration
//                   (a string "4".."15", as fal's schema and the shipped
//                   hypermotion call send it), aspect_ratio, generate_audio,
//                   seed}. The street-interview runs send seed to Seedance and
//                   get it honoured, though fal's schemas do not list it.
//
// Two lists:
//   clips   a hand-built list (the 1.0.1 behaviour), with prompts that may use
//           template placeholders ({answers.KEY}, {product.name}, ...);
//   scenes  without clips, one clip per picked plan scene, its prompt filled
//           from the style's template (motion, else scene).
// Every prompt is filled, and every reference and start frame found, before the
// first piece is ordered, so a missing answer refuses the step for free.
//
// Two more modes (1.2.0, src/takes.mjs): take (one prompt of up to 4 scenes
// as time-windowed beats) and takes (count takes, optionally chained to a
// face-free still of the first), joined into one video with a timeline.

const REF = 'bytedance/seedance-2.0/reference-to-video';
const I2V = 'bytedance/seedance-2.0/image-to-video';
const SD_PROMPT_MAX = 12000;
const SD_MAX_REFS = 9;
const SD_MAX_CLIPS = 12;
const SD_DEFAULT_SECONDS = 5;
const SD_SCENE_ONLY = ['pick', 'skip_first', 'skip_last', 'seconds'];
// Inputs that only the take modes read, and the modes each one needs.
const SD_TAKE_ONLY = {
  takes: ['takes'],
  chain: ['takes'],
  off_screen_lines: ['take'],
  off_screen_tags: ['take'],
  words_per_second: ['take', 'takes'],
  max_words: ['take', 'takes'],
  pronunciations: ['take', 'takes'],
};
// Any 1.1.0-only input makes a 1.1.0 call, whose clip prompts have their placeholders filled (or refused).
// Only the exact 1.0.1 shape (clips, resolution, aspect_ratio, generate_audio) sends braces as written.
const SD_NEW_INPUTS = ['mode', 'seed', 'template', 'look', 'answers', 'brand', 'cast', 'products', 'scenes'];
// The template key a clip's own prompt is filled under; templates keys are words, so it never collides.
const SD_OWN = ' clip prompt';
// Anything left that looks like a placeholder after filling ({Answers.x}, {answers.a.b}) is a typo.
const SD_PLACEHOLDER_LIKE = /\{[A-Za-z][A-Za-z0-9_.-]*\??\}/;

function sdIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

function sdFirstPhoto(products) {
  for (const p of products || []) {
    if (p && Array.isArray(p.images) && sdIsFile(p.images[0])) return p.images[0];
  }
  return null;
}

/** The references the template's refs picked: named members' pictures, product photos, the scene's picture. */
function sdPlanRefs(refs) {
  const out = [];
  for (const m of refs.cast) if (sdIsFile(m.image)) out.push(m.image);
  for (const p of refs.products) if (sdIsFile(p.images[0])) out.push(p.images[0]);
  if (refs.scene_image) out.push(refs.scene_image);
  return out.slice(0, SD_MAX_REFS);
}

/** One clip's prompt, filled from the template and the plan. `own` is the clip's own prompt text, if any. */
function sdPrompt(tpl, base, { scene, index, own, use, who }) {
  const t = own == null ? tpl : { ...tpl, templates: { ...(tpl.templates || {}), [SD_OWN]: own } };
  let out;
  try {
    out = kitScenePrompt(t, { ...base, scene, index }, { use: own == null ? use : SD_OWN });
  } catch (err) {
    if (err instanceof KitPromptGap) throw new KitPromptGap(err.message.replace(/^scene \S+/, who), err);
    throw new Error(`${who}: ${err.message}`);
  }
  const prompt = out.negative ? kitPromptJoin([out.prompt, `Avoid: ${out.negative}`]) : out.prompt;
  const left = SD_PLACEHOLDER_LIKE.exec(prompt);
  if (left) throw new KitPromptGap(`${who} has an unknown placeholder ${left[0]}`, { placeholder: left[0], scene_id: scene.id });
  return { prompt, refs: out.refs };
}

/** The use for a clip with no prompt of its own: templates.<id>, else motion, else scene. */
function sdUse(tpl, id) {
  if (id != null && tpl.templates && typeof tpl.templates[id] === 'string') return id;
  return typeof tpl.motion === 'string' ? 'motion' : 'scene';
}

/** Every job, refused here before any piece is ordered: [{id, index, prompt, seconds, audio, refs?, start?, end?}]. */
function sdJobs(inputs, tpl, i2v) {
  const products = inputs.products || [];
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null, cast: inputs.cast || [], products };
  const fill = Boolean(inputs.template);
  const context = SD_NEW_INPUTS.some((key) => inputs[key] != null)
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
      // A 1.0.1-shaped call sends its prompt as written, braces and all, so its piece is unchanged.
      const filled = fill || (context && SD_PLACEHOLDER_LIKE.test(own))
        ? sdPrompt(tpl, base, { scene, index: i, own, use: sdUse(tpl, id), who })
        : { prompt: own, refs: null };
      jobs.push({ id, index: i, who, scene, prompt: filled.prompt, planRefs: filled.refs, seconds: clip.seconds, audio: clip.generate_audio, clip });
    }
  } else {
    const picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
    if (!picked.length) throw new Error('no scene is picked for a clip');
    if (picked.length > SD_MAX_CLIPS) throw new Error(`${picked.length} scenes are picked; one run makes at most ${SD_MAX_CLIPS} clips`);
    const use = sdUse(tpl, null);
    for (const { scene, index } of picked) {
      const who = `scene ${scene.id}`;
      const filled = sdPrompt(tpl, base, { scene, index, own: null, use, who });
      jobs.push({ id: scene.id, index, who, scene, prompt: filled.prompt, planRefs: filled.refs, seconds: inputs.seconds ?? SD_DEFAULT_SECONDS, audio: undefined, clip: {} });
    }
  }
  for (const j of jobs) {
    if (!j.prompt) throw new Error(`${j.who} has an empty prompt`);
    if (j.prompt.length > SD_PROMPT_MAX) throw new Error(`${j.who}'s prompt is ${j.prompt.length} characters, over ${SD_PROMPT_MAX}`);
    if (i2v) {
      const want = j.clip.start_image;
      if (want === 'product') {
        // The product the scene names (whatever the template's refs pick), else the first with a photo.
        j.start = sdFirstPhoto(kitNamedProducts(j.scene, products)) || sdFirstPhoto(products);
        if (!j.start) throw new Error(`${j.who} starts on the product, but no product has a photo`);
      } else if (sdIsFile(want)) {
        j.start = want;
      } else {
        const r = j.planRefs;
        j.start = r ? r.scene_image || sdFirstPhoto(r.products) || (r.cast.find((m) => sdIsFile(m.image)) || {}).image || null : null;
        if (!j.start) throw new Error(`${j.who} needs a start_image: no scene picture, product photo or cast picture to start from`);
      }
      const end = j.clip.end_image;
      j.end = end === 'start' ? j.start : sdIsFile(end) ? end : null;
    } else {
      j.refs = j.clip.references || (j.planRefs ? sdPlanRefs(j.planRefs) : []);
      if (!j.refs.length) throw new Error(`${j.who} has no reference image: give references, or products, cast or scene pictures the template's refs can use`);
    }
  }
  return jobs;
}

/** Mode take or takes: every take's prompt written before the first piece, then the takes in order. */
async function sdRunTakeMode(inputs, ctx, manifest) {
  if (inputs.clips) throw ctx.error('bad_input', `mode ${inputs.mode} writes its own prompt from scenes; clips are for modes reference and image_to_video`);
  if (!inputs.scenes) throw ctx.error('bad_input', `mode ${inputs.mode} needs scenes`);
  let jobs;
  try {
    const tpl = inputs.template ? await kitLoadTemplate(inputs.template) : { version: 1 };
    jobs = sdTakeJobs(inputs, tpl);
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', String((err && err.message) || err));
  }
  return kitCheckOutputs(ctx, manifest, await sdRunTakes(inputs, ctx, jobs));
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const mode = inputs.mode ?? 'reference';
  for (const [key, modes] of Object.entries(SD_TAKE_ONLY)) {
    if (inputs[key] !== undefined && !modes.includes(mode)) throw ctx.error('bad_input', `${key} works only in mode ${modes.join(' or ')}`);
  }
  if (mode === 'take' || mode === 'takes') return sdRunTakeMode(inputs, ctx, manifest);
  const i2v = mode === 'image_to_video';
  if (!inputs.clips && !inputs.scenes) throw ctx.error('bad_input', 'give clips, or scenes for one clip per scene');
  if (inputs.clips) {
    for (const key of SD_SCENE_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only without clips (one clip per scene)`);
  }

  let jobs;
  try {
    const tpl = inputs.template ? await kitLoadTemplate(inputs.template) : { version: 1 };
    jobs = sdJobs(inputs, tpl, i2v);
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', String((err && err.message) || err));
  }

  const used = new Set();
  for (const j of jobs) j.piece = kitPieceName('clip', j.id, j.index, used);
  const clips = [];
  for (const [n, j] of jobs.entries()) {
    kitStopIfAborted(ctx);
    const piece = j.piece;
    const audio = j.audio ?? inputs.generate_audio ?? true;
    const body = i2v
      ? {
          prompt: j.prompt,
          image_url: j.start,
          ...(j.end ? { end_image_url: j.end } : {}),
          resolution: inputs.resolution ?? '1080p',
          duration: String(j.seconds),
          aspect_ratio: inputs.aspect_ratio ?? '9:16',
          generate_audio: audio,
          seed: ctx.seed(piece) % 2147483647,
        }
      : {
          prompt: j.prompt,
          image_urls: j.refs,
          resolution: inputs.resolution ?? '1080p',
          duration: j.seconds,
          aspect_ratio: inputs.aspect_ratio ?? '9:16',
          generate_audio: audio,
          seed: ctx.seed(piece) % 2147483647,
        };
    const result = await ctx.line.order({ piece, provider: 'fal', path: i2v ? I2V : REF, body, results: [{ pointer: '/json/video/url', name: `${piece}.mp4`, media: 'video' }] });
    const file = result && result.files && result.files[`${piece}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    if (audio) {
      const info = await ctx.tools.probe(file.path);
      if (!info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its native audio`);
    }
    clips.push({ id: String(j.id ?? j.index + 1), video: file, seconds: j.seconds });
    ctx.progress({ done: n + 1, total: jobs.length });
  }
  return kitCheckOutputs(ctx, manifest, { clips, video: clips[0].video });
}
