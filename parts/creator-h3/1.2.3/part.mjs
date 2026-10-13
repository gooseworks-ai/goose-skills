// Built from creator-h3/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- creator-h3/src/prompt.mjs ----
// The H3 take prompt, copied word for word from create-creator-takes-h3's
// plan_takes.py (TEMPLATE, MANNERISM and DEFAULT_DELIVERY): the prompt that held
// identity and eyeline across the reference builds. {identity}, {environment},
// {mannerism}, {delivery} and {dialogue} are filled per take.

const H3_TEMPLATE = "A single continuous locked-off medium shot of <Subject 1>, with a natural front-camera recording look. The recording device and its support stay outside the frame.\n\n[Shot 1] The viewpoint is fixed at eye level, with the person facing the lens. No phone, camera, tripod or stand is visible. Chest-up framing, both shoulders in frame, head roughly centred with a little headroom, shot straight on. The hands are FREE and gesture while talking, one coming up and settling. Nobody holds the phone, there is no arm extended toward the camera. THE CAMERA DOES NOT MOVE: locked off, no handheld drift, no pan, no zoom, no reframing. One continuous unbroken shot.\n\nEYES STAY ON THE CAMERA LENS FOR THE WHOLE CLIP, from the very first frame to the very last, including the final word. Never glancing away, never looking down, never letting the gaze drift off the lens at the end of a sentence.\n\nTHE SUBJECT AND THE SET, unchanged from the first frame to the last, exactly as <Picture 1>: {identity}\n{environment}\nSKIN matches <Picture 1> exactly: visible pores, no smoothing, no plastic gloss, no over-sharpened edges. The light is the light in <Picture 1> and it does not change.\n{mannerism}\nHOW THEY SPEAK: {delivery}\nDIEGETIC SOUND: the voice and quiet room tone only.\nAUDIO RESTRICTIONS: no music, no beat, no sound design, no second voice, and no robotic, synthetic, text-to-speech, monotone or announcer-like delivery. The spoken audio contains ONLY the words inside the dialogue block. No stage directions and no markup is ever spoken aloud.\n\n<Subject 1> (S1) says, <d>[English] <inhale> {dialogue}</d>\n\nQuiet room around the voice. No music, no sound design, no second voice.\n";

const H3_MANNERISM = "\n<Video 1> is a filmed reference person recorded the same way. Take from it ONLY the rhythm of natural speech, where the pauses fall and where the pace speeds up, and the small involuntary movement while talking: the head settling, the blink rate, the eyebrow lifts, the hands coming up and dropping back. Do NOT take the face, hair, clothes, room, lighting, framing or eyeline. The person is <Subject 1> from <Picture 1> and nobody else.\n";

const H3_DEFAULT_DELIVERY = "natural and conversational, speaking directly to one viewer. Not presenting, not announcing, not reading. Sentences run together with almost no gap. Pitch falls on the last word of each sentence. Consonants relaxed, volume varying word to word.";

// 1.2.0 clips mode: the motion text used when the style gives no template. The
// keyframe is the first frame (image_url) and Image 1; nothing is said, and the
// clip's sound is dropped anyway.
const H3_CLIP_TEMPLATE = {
  version: 1,
  motion: 'The video opens exactly on its first frame and stays true to Image 1: the same person, wardrobe, place, light and framing. {picture}. One continuous shot with small, natural, real movement; the camera holds steady with a light handheld feel. Nobody talks: the mouth stays relaxed, no voice, no music, no captions or text on screen.',
  refs: [],
};

// ---- creator-h3/src/part.mjs ----
// creator-h3: an AI creator talking to camera, saying the approved lines, as
// one continuous track (D6: the default for scripted lines). The
// create-creator-takes-h3 atom in JavaScript: takes split between lines under
// H3's 15 s cap, each 0.6 s past its last word; the atom's prompt word for word
// with the person and room from the approved character; every take sent to
// fal's minimax/h3-max/reference-to-video with the atom's payload
// (prompt_expansion_mode disabled, so the dialogue stays verbatim); the first
// take ordered alone and its own voice handed to every later take as reference
// audio, so the takes sound like one recording; then joined with 0.10 s
// dissolves. A policy refusal is final for that take (the line says so).
//
// 1.1.0: the creator can come from the plan cast (the speaker's member, else the
// first member with a picture), with the identity written from the member's
// age, gender and look; `delivery` sets how they speak; brand pronunciations are
// swapped into the spoken dialogue only (the timeline keeps the written words);
// and `split_before: cutaways` lets a take start only at a cutaway scene, so
// every join can hide under footage. Each later take reports `joins_s`, the
// reel second its dissolve starts. Take pieces stay `take-t<n>`: a take covers
// several scenes, so it is never reused as one scene's piece on a fix.
//
// 1.2.0: measured joins (the default, `join: measured`): each take's speech is
// measured with ffmpeg's silence detector (where the first word starts, where
// the trailing silence begins), and the next take is placed so its first word
// comes 0.25 s after the previous take's last word, never inside it; the reel
// ends 0.6 s after the last word. Line spans are spread over each take's
// measured speech. `join: planned` keeps 1.1.0's schedule (each take at its
// estimated start). And `mode: clips`: a silent clip per picked scene (5 s by
// default) that opens on that scene's keyframe from `images`, with the
// prompt from the style's template (its motion text); the clip's sound is
// dropped. Clip pieces are `clip-<scene id>`.
//
// 1.2.1: measured line spans. Inside each take, the boundary between two lines
// is placed on a silence the detector heard between them (the pause H3 makes
// at <pause>), so a scene starts on its first word and ends after its last;
// 1.2.0 spread the lines' estimated lengths over the take's speech, and an
// insert placed by scene could start mid-word. A boundary with no silence in
// reach keeps 1.2.0's estimate.

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
const GAP = 0.25;
const MAX_HOLD = 0.5;
// Measured line spans: a silence this long inside a take's speech is between words, and one is worth
// moving a line boundary for while its length beats this share of its distance from the estimate.
const LINE_GAP_MIN = 0.12;
const LINE_GAP_REACH = 0.25;
// Clips mode.
const CLIP_SECONDS = 5;
const CLIPS_AT_ONCE = 3;
const MAX_REFS = 12;
const PROMPT_MAX = 50000;
const TALK_ONLY = ['character', 'delivery', 'pronunciations', 'split_before', 'footage', 'mannerism', 'words_per_second', 'join'];
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
    const words = l.spoken.split(/\s+/).filter(Boolean).length;
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

function prompt(character, delivery, mannerism, dialogue) {
  // Function replacers: a $ in a look or a line is never read as a replacement pattern.
  return H3_TEMPLATE.replace('{identity}', () => character.identity.trim())
    .replace('{environment}', () => String(character.environment || '').trim())
    .replace('{mannerism}', () => (mannerism ? H3_MANNERISM : ''))
    .replace('{delivery}', () => delivery)
    .replace('{dialogue}', () => dialogue);
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
  if ((inputs.mode || 'talk') === 'clips') return runClips(inputs, ctx, manifest);
  for (const key of CLIPS_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in clips mode`);
  const measured = (inputs.join || 'measured') === 'measured';
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
  for (const l of lines) if (/\[[^\]]*\]/.test(l.spoken)) throw ctx.error('bad_input', `scene ${l.scene_id} has square brackets, which H3 speaks aloud`);
  const creator = pickCreator(inputs, lines);
  if (creator.problem) throw ctx.error('bad_input', creator.problem);
  const problem = checkCharacter(creator.character, creator.who);
  if (problem) throw ctx.error('bad_input', problem);
  // The character's own delivery is trimmed only, as 1.0.2 did; a cast member's was cleaned in pickCreator.
  // A whitespace-only legacy delivery stays empty, exactly as 1.0.2 built the prompt.
  const delivery = cleanText(inputs.delivery) || String(creator.character.delivery || H3_DEFAULT_DELIVERY).trim();
  const takes = planTakes(lines, Math.min(inputs.words_per_second ?? 2.6, H3_PLAN_WPS));
  if (takes.problem) throw ctx.error('bad_input', takes.problem);
  const seconds = takes.reduce((a, t) => a + t.dur, 0);
  if (seconds > inputs.max_seconds) throw ctx.error('bad_input', `the lines need ${seconds}s of takes, more than max_seconds ${inputs.max_seconds}`);

  const resolution = inputs.resolution ?? '1080P';
  const aspect = inputs.aspect_ratio ?? '9:16';
  let voice = null;
  const made = [];
  for (const [k, t] of takes.entries()) {
    kitStopIfAborted(ctx);
    const piece = `take-${t.id}`;
    const dialogue = t.lines.map((l) => l.spoken).join(' <pause> ');
    const body = {
      prompt: prompt(creator.character, delivery, !!inputs.mannerism, dialogue),
      duration: t.dur,
      resolution,
      aspect_ratio: aspect,
      seed: 300000 + (ctx.seed(piece) % 600000),
      prompt_expansion_mode: 'disabled',
      reference_image_urls: [creator.character.image],
    };
    if (inputs.mannerism) body.reference_video_urls = [inputs.mannerism];
    if (voice) body.reference_audio_urls = [voice];
    const result = await ctx.line.order({ piece, provider: 'fal', path: MODEL, body, results: [{ pointer: '/json/video/url', name: `${t.id}.mp4`, media: 'video' }] });
    const file = result.files[`${t.id}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    const info = await ctx.tools.probe(file.path);
    if (!info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its voice`);
    const duration = await kitDuration(ctx, file);
    if (measured) {
      const heard = await measureSpeech(ctx, file.path, duration);
      if (!heard) throw ctx.error('provider_failed', `${piece} came back with no speech to hear`);
      const said = t.lines.reduce((n, l) => n + l.spoken.split(/\s+/).filter(Boolean).length, 0);
      ctx.log.info('take pace', { take: t.id, words: said, wps: +(said / Math.max(0.1, heard.end - heard.onset)).toFixed(2) });
      made.push({ ...t, file, path: file.path, duration, start: t.covers[0], onset: heard.onset, speech_end: heard.end, gaps: heard.gaps });
    } else {
      made.push({ ...t, file, path: file.path, duration, start: t.covers[0], onset: await plannedOnset(ctx, file.path), speech_end: duration });
    }
    if (k === 0 && takes.length > 1) {
      // The first take's own voice, handed to every later take (our generated voice, never a real person's).
      await kitFfmpeg(ctx, ['-i', file.path, ...VOICE_CLIP, join(ctx.tmpDir, 't1-voice.wav')]);
      voice = await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/t1-voice.wav`, 'audio');
    }
    ctx.progress({ done: k + 1, total: takes.length });
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
    const spans = measured ? lineSpans(t.lines, t.gaps || [], t.onset, t.speech_end, (x) => t.onset + (x - c0) * scale) : null;
    for (const [i, l] of t.lines.entries()) {
      const from = spans ? base + spans[i].start : at(l.start);
      const to = spans ? base + spans[i].end : at(l.end);
      const entry = { scene_id: l.scene_id, text: l.text, start_s: +Math.max(0, from).toFixed(3), end_s: +Math.min(plan.duration, to).toFixed(3) };
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
  return kitCheckOutputs(ctx, manifest, {
    video,
    seconds: timeline.duration_s,
    timeline,
    takes: plan.takes.map((t, k) => {
      const take = { id: t.id, video: t.file, start_s: +t.start.toFixed(3), scene_ids: t.lines.map((l) => l.scene_id) };
      if (k) take.joins_s = take.start_s;
      return take;
    }),
  });
}

/** Runs `work` over `items` a few at a time, keeping their order; after one failure no lane starts another. */
async function eachAtOnce(items, work, atOnce) {
  const out = new Array(items.length);
  let next = 0;
  let failed = false;
  const lanes = Array.from({ length: Math.min(Math.max(1, atOnce), items.length) }, async () => {
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

/**
 * The template for clips mode, with an empty by_tag rule for every tag the step
 * picks by, so {picture} drops that "Tag:" lead (a picked tag is a style tag,
 * never a person). The template's own rules are kept.
 */
function clipTemplate(tpl, pick) {
  const tags = pick && typeof pick === 'object' && Array.isArray(pick.tags) ? pick.tags : [];
  const byTag = { ...(tpl.by_tag && typeof tpl.by_tag === 'object' ? tpl.by_tag : {}) };
  const have = new Set(Object.keys(byTag).map(kitTagKey));
  for (const tag of tags) if (!have.has(kitTagKey(tag))) byTag[tag] = {};
  return Object.keys(byTag).length ? { ...tpl, by_tag: byTag } : tpl;
}

/** The reference pictures for one clip: the keyframe first, then the template's refs, each file once, at most MAX_REFS. */
function clipRefs(still, refs) {
  const list = [still];
  for (const m of refs.cast) if (m && m.image) list.push(m.image);
  for (const p of refs.products) if (p && Array.isArray(p.images) && p.images[0]) list.push(p.images[0]);
  if (refs.scene_image) list.push(refs.scene_image);
  const seen = new Set();
  return list.filter((f) => {
    const key = f && (f.path || f.sha256 || f.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_REFS);
}

/**
 * mode clips: one silent clip per picked scene. The clip opens on the scene's
 * keyframe (images, by scene id), the prompt is the template's motion text (or
 * the text `use` names), and the provider's sound is dropped. Everything that can
 * refuse happens before the first piece is ordered.
 */
async function runClips(inputs, ctx, manifest) {
  for (const key of TALK_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in talk mode`);
  if (!inputs.images) throw ctx.error('bad_input', 'clips mode needs images: the keyframes by scene id (step.<keyframes>.images)');
  const seconds = inputs.seconds ?? CLIP_SECONDS;
  let jobs;
  try {
    const base = inputs.template ? await kitLoadTemplate(inputs.template) : kitTemplateFrom(H3_CLIP_TEMPLATE, 'the default clip template');
    const tpl = kitTemplateFrom(clipTemplate(base, inputs.pick), 'the clip template');
    const picked = kitPickScenes(inputs.scenes, inputs.pick ?? 'all', { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
    if (!picked.length) throw new Error('no scene is picked for a clip');
    jobs = kitScenePrompts(tpl, picked, { look: inputs.look, answers: inputs.answers, cast: inputs.cast, products: inputs.products, brand: inputs.brand }, { use: inputs.use || 'motion' });
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
  }
  const stills = new Map(inputs.images.map((i) => [i.id, i.image]));
  const ids = new Set();
  for (const job of jobs) {
    if (ids.has(job.id)) throw ctx.error('bad_input', `two picked scenes share the id ${job.id}`);
    ids.add(job.id);
    job.still = stills.get(job.id);
    if (!job.still) throw ctx.error('bad_input', `scene ${job.id} has no keyframe in images`);
    if (!job.prompt) throw ctx.error('bad_input', `clip ${job.id} has an empty prompt: give the scene a picture or the template a motion text`);
    if (job.prompt.length > PROMPT_MAX) throw ctx.error('bad_input', `clip ${job.id}'s prompt is over ${PROMPT_MAX} characters`);
  }
  const total = jobs.length * seconds;
  if (total > inputs.max_seconds) throw ctx.error('bad_input', `${jobs.length} clips of ${seconds}s need ${total}s, more than max_seconds ${inputs.max_seconds}`);

  const used = new Set();
  for (const job of jobs) job.piece = kitPieceName('clip', job.id, job.index, used);
  const resolution = inputs.resolution ?? '1080P';
  const aspect = inputs.aspect_ratio ?? '9:16';
  let done = 0;
  const clips = await eachAtOnce(jobs, async (job) => {
    kitStopIfAborted(ctx);
    const body = {
      prompt: job.prompt,
      duration: seconds,
      resolution,
      aspect_ratio: aspect,
      seed: 300000 + (ctx.seed(job.piece) % 600000),
      prompt_expansion_mode: 'disabled',
      image_url: job.still,
      reference_image_urls: clipRefs(job.still, job.refs),
    };
    const result = await ctx.line.order({ piece: job.piece, provider: 'fal', path: MODEL, body, results: [{ pointer: '/json/video/url', name: `${job.piece}.mp4`, media: 'video' }] });
    const file = result && result.files && result.files[`${job.piece}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${job.piece}`);
    const info = await ctx.tools.probe(file.path);
    if (!info.has_video) throw ctx.error('provider_failed', `${job.piece} came back with no picture`);
    // The sound is dropped, and the clip is made exactly the seconds asked for: cut when H3 runs
    // over (it may run up to 0.7 s over), its last frame held when it comes back short.
    const name = `${job.piece}-silent.mp4`;
    const got = await kitDuration(ctx, file);
    const fit = got < seconds - 0.01
      ? ['-vf', `tpad=stop_mode=clone:stop_duration=${kitNum(seconds - got + 0.1, 3)}`, ...ctx.tools.encodeArgs('h264-intermediate')]
      : ['-c:v', 'copy'];
    await kitFfmpeg(ctx, ['-i', file.path, '-map', '0:v:0', '-an', '-t', kitNum(seconds, 3), ...fit, join(ctx.workDir, name)]);
    const video = await ctx.file(name, 'video');
    const length = await kitDuration(ctx, video);
    ctx.progress({ done: ++done, total: jobs.length });
    return { id: job.id, video, seconds: Number(length.toFixed(3)) };
  }, CLIPS_AT_ONCE);
  const reel = clips.reduce((a, c) => a + c.seconds, 0);
  return kitCheckOutputs(ctx, manifest, { video: clips[0].video, seconds: Number(reel.toFixed(3)), clips });
}
