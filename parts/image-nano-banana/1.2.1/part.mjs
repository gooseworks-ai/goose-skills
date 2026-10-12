// Built from image-nano-banana/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- _lib/scene-stills.mjs ----
// One still per plan scene, for image parts (image-nano-banana 1.1.0, then
// image-gpt-image-2): which scenes get a still, each scene's prompt and
// references, the cast portraits ("anchors") the scenes need, the anchor strip,
// and the part's scene-keyed outputs. The part itself orders the pieces (the
// lint reads every paid call from the part's own source), in this order:
//
//   const tpl = kitStillTemplate(await kitLoadTemplate(inputs.template))   // or kitStillTemplate(null)
//   const jobs = kitStillJobs(tpl, inputs.scenes, {pick, skip_first, skip_last, look, answers, cast, products, brand, multi_ref})
//   for each kitStillAnchorMembers(jobs) without an image: kitStillAnchorPrompt(tpl, member, ctx) -> draw it
//   per job: cast = kitStillCastFiles(job, anchors); one strip when kitStillWantsStrip(job, cast) (kitStillStrip)
//            refs = kitStillRefs(job, {cast, first, style_refs}); prompt = kitStillPrompt(job, refs)
//   return kitStillOutputs({scenes, cast, jobs, stills, anchors})
//
// Everything before the first order is pure, so a scene the template cannot
// fill refuses the whole step before any piece is bought.
//
// References per scene, in this order, at most 10 (KIT_STILL_MAX_REFS):
//   1. the named cast members' anchors: up to 3 separate pictures, or, when
//      the scene names more than one member and multi_ref is not 'list', one
//      strip of all of them (up to 10) side by side (nano-banana/edit flattens
//      several character references into one average shape; a strip keeps
//      each silhouette, measured 2026-10-01);
//   2. the first photo of each named product;
//   3. the scene's own picture file (scene.image, else a file picture);
//   4. the first scene's still (anchor: 'first_scene');
//   5. the style's reference pictures (style_refs).
// Which of 1-3 a scene sends follows the template's refs (and its by_tag
// rule), and the template's max_refs caps 1-3 only: 4 and 5 are the step's
// own inputs, not the plan's. When the list is too long, 1-3 give way so 4
// and 5 always fit.
//
// Bundled into parts; every top-level name starts with `kitStill` or `KIT_STILL`.

const KIT_STILL_MAX_REFS = 10;
const KIT_STILL_MAX_STRIP = 10;
/** The anchor text used when the style's template has none: no room and no lighting, so neither bakes into every scene. */
const KIT_STILL_DEFAULT_ANCHOR = '{look}. One character alone, chest up, facing the camera, on a plain light grey background, flat even light, no text, no room, no props';

function kitStillIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

function kitStillName(member) {
  const name = member && typeof member.name === 'string' ? member.name.trim() : '';
  return name || String((member && member.key) || 'one character');
}

/**
 * The template a part fills: the style's (already checked by kitLoadTemplate),
 * or an empty version 1 template whose scene text is "{picture}". A template
 * without an anchor text gets KIT_STILL_DEFAULT_ANCHOR.
 */
function kitStillTemplate(tpl) {
  const base = tpl && typeof tpl === 'object' ? tpl : { version: 1 };
  return typeof base.anchor === 'string' ? base : { ...base, anchor: KIT_STILL_DEFAULT_ANCHOR };
}

/**
 * The stills a step makes, one job per picked scene, prompts filled. `options`:
 * {pick, skip_first, skip_last, look, answers, cast, products, brand, multi_ref}.
 * A job is {id, index, scene, prompt, negative, tag, cast, strip, products, scene_image}:
 *   cast        the members whose anchors the scene sends (speaker first);
 *   strip       true when those go as one strip (more than one member, multi_ref not 'list');
 *   products    the named products whose first photo the scene sends;
 *   scene_image the scene's own picture file, or null.
 * Throws KitPromptGap (a scene the template cannot fill, a banned phrase) or an
 * Error (a bad pick, two scenes with one id) before anything is ordered.
 */
function kitStillJobs(tpl, scenes, options = {}) {
  const { pick = 'all', skip_first = 0, skip_last = 0, look = null, answers = null, cast = [], products = [], brand = null, multi_ref } = options;
  const picked = kitPickScenes(scenes, pick, { skip_first, skip_last });
  const prompts = kitScenePrompts(tpl, picked, { look, answers, cast: cast || [], products: products || [], brand });
  const seen = new Set();
  return prompts.map((p) => {
    if (seen.has(p.id)) throw new Error(`two scenes have the id ${p.id}`);
    seen.add(p.id);
    let members = p.refs.cast;
    let strip = false;
    if (members.length && multi_ref !== 'list') {
      const named = kitNamedCast(p.scene, cast || []);
      if (named.length > 1) {
        members = named.slice(0, KIT_STILL_MAX_STRIP);
        strip = true;
      }
    }
    return { id: p.id, index: p.index, scene: p.scene, prompt: p.prompt, negative: p.negative, tag: p.tag, cast: members, strip, products: p.refs.products, scene_image: p.refs.scene_image };
  });
}

/** Every cast member some job sends as a reference, once each, in first-use order. */
function kitStillAnchorMembers(jobs) {
  const out = [];
  const keys = new Set();
  for (const job of jobs || []) {
    for (const m of job.cast) {
      if (m == null || keys.has(m.key)) continue;
      keys.add(m.key);
      out.push(m);
    }
  }
  return out;
}

/**
 * A cast member's portrait prompt (kitAnchorPrompt with the template's anchor
 * text, else KIT_STILL_DEFAULT_ANCHOR), its negative folded in as for scenes.
 * ctx = {look, answers, brand}. Throws KitPromptGap when the member has no look.
 */
function kitStillAnchorPrompt(tpl, member, ctx = {}) {
  const { prompt, negative } = kitAnchorPrompt(kitStillTemplate(tpl), member, ctx);
  return kitPromptJoin([prompt, negative ? `Avoid: ${negative}` : '']);
}

/**
 * The anchor files a job can send: [{key, name, file}] for its members that
 * have a picture, from `anchors` (a Map of key -> FileRef: drawn anchors and
 * the members' own images).
 */
function kitStillCastFiles(job, anchors) {
  const out = [];
  for (const m of job.cast) {
    const file = anchors && anchors.get(m.key);
    if (kitStillIsFile(file)) out.push({ key: m.key, name: kitStillName(m), file });
  }
  return out;
}

/** True when the job sends its cast as one strip: it asked for one and more than one member has a picture. */
function kitStillWantsStrip(job, castFiles) {
  return Boolean(job.strip && castFiles.length > 1);
}

/**
 * The job's references in order (see the file header), at most `max`.
 * `cast` is kitStillCastFiles' list, or [{key, name, file: strip, strip: [names]}]
 * for a strip; `first` the first scene's still or null; `style_refs` FileRefs.
 * Returns {files, strip_at, names}: strip_at is the strip's 1-based place or null.
 */
function kitStillRefs(job, { cast = [], first = null, style_refs = [], max = KIT_STILL_MAX_REFS } = {}) {
  const lead = [];
  let stripEntry = null;
  for (const c of cast) {
    lead.push(c.file);
    if (c.strip) stripEntry = c;
  }
  for (const p of job.products || []) if (Array.isArray(p.images) && kitStillIsFile(p.images[0])) lead.push(p.images[0]);
  if (kitStillIsFile(job.scene_image)) lead.push(job.scene_image);
  const tail = [];
  if (kitStillIsFile(first)) tail.push(first);
  for (const f of style_refs || []) if (kitStillIsFile(f)) tail.push(f);
  const keep = Math.max(0, max - tail.length);
  const files = [...lead.slice(0, keep), ...tail].slice(0, max);
  const at = stripEntry ? files.indexOf(stripEntry.file) : -1;
  return { files, strip_at: at >= 0 ? at + 1 : null, names: stripEntry ? stripEntry.strip : null };
}

/**
 * The prompt a job sends: its filled prompt, then, for a strip, which
 * reference holds the characters and that the scene has no panels, then its
 * negative as "Avoid: ...". `refs` is kitStillRefs' result.
 */
function kitStillPrompt(job, refs = {}) {
  let stripNote = '';
  if (refs.strip_at) {
    const names = (refs.names || []).join(', ');
    stripNote = `Reference image ${refs.strip_at} shows the characters side by side (${names}) only so you know each one's look: draw them together in this one scene with one seamless continuous background, no panels, no dividing lines, no split screen`;
  }
  return kitPromptJoin([job.prompt, stripNote, job.negative ? `Avoid: ${job.negative}` : '']);
}

async function kitStillSize(ctx, file) {
  if (Number.isInteger(file.width) && Number.isInteger(file.height) && file.width > 0 && file.height > 0) return { w: file.width, h: file.height };
  const info = await ctx.tools.probe(file.path);
  if (!(info.width > 0 && info.height > 0)) throw ctx.error('bad_input', `no size for the picture ${String(file.path).split('/').at(-1)}`);
  return { w: info.width, h: info.height };
}

/**
 * Tiles `files` side by side into one PNG in ctx.workDir named `name`: every
 * picture scaled to one height (at most `height`, lower when the strip would
 * pass `max_width`), aspect kept, no padding and no gaps. Returns its FileRef.
 */
async function kitStillStrip(ctx, files, name, { height = 768, max_width = 4096 } = {}) {
  if (!Array.isArray(files) || files.length < 2) throw ctx.error('bad_input', 'a strip needs at least two pictures');
  const sizes = [];
  for (const f of files) sizes.push(await kitStillSize(ctx, f));
  const ratio = sizes.reduce((sum, s) => sum + s.w / s.h, 0);
  const h = Math.max(64, 2 * Math.floor(Math.min(height, max_width / ratio) / 2));
  const widths = sizes.map((s) => Math.max(2, 2 * Math.round((h * s.w) / s.h / 2)));
  const scaled = widths.map((w, i) => `[${i}:v]scale=${w}:${h}:flags=lanczos,setsar=1,format=rgba[p${i}]`);
  const graph = `${scaled.join(';')};${widths.map((_, i) => `[p${i}]`).join('')}hstack=inputs=${files.length}[out]`;
  const args = [];
  for (const f of files) args.push('-i', f.path);
  args.push('-filter_complex', graph, '-map', '[out]', '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, name));
  await kitFfmpeg(ctx, args);
  return ctx.file(name, 'image');
}

/**
 * The step's outputs: images [{id, image}] in job order; scenes (every input
 * scene, with image = its still when it got one); cast (every member, image =
 * its anchor when it has one); anchors [{id: key, image}] for the members some
 * scene sent. `stills` and `anchors` are Maps (scene id -> FileRef, key -> FileRef).
 */
function kitStillOutputs({ scenes = [], cast = [], jobs = [], stills, anchors }) {
  const images = jobs.filter((j) => stills.has(j.id)).map((j) => ({ id: j.id, image: stills.get(j.id) }));
  const byIndex = new Map(jobs.map((j) => [j.index, j.id]));
  const outScenes = (scenes || []).map((s, i) => (byIndex.has(i) && stills.has(byIndex.get(i)) ? { ...s, image: stills.get(byIndex.get(i)) } : { ...s }));
  const used = new Set(kitStillAnchorMembers(jobs).map((m) => m.key));
  const outCast = (cast || []).map((m) => (anchors && anchors.has(m.key) ? { ...m, image: anchors.get(m.key) } : { ...m }));
  const outAnchors = (cast || []).filter((m) => used.has(m.key) && anchors && anchors.has(m.key)).map((m) => ({ id: m.key, image: anchors.get(m.key) }));
  return { images, scenes: outScenes, cast: outCast, anchors: outAnchors };
}

// ---- image-nano-banana/src/part.mjs ----
// image-nano-banana: stills from Google's Nano Banana on fal, one paid piece
// per image. Replaces create-image-fal for this model family: the same fal
// model paths (fal-ai/nano-banana for a prompt alone, fal-ai/nano-banana/edit
// with reference images) and payload (prompt, image_urls, aspect_ratio), with
// references passed as FileRefs the core hosts. Like today's atom, a result
// whose bytes are not the PNG it is saved as is re-encoded to PNG.
//
// Two modes (1.1.0):
//   images  a hand-built list [{id, prompt, references}] (the 1.0.1 behaviour);
//   scenes  one still per picked plan scene, its prompt filled from the style's
//           template and its references picked from the plan (_lib/scene-stills.mjs):
//           cast anchors (drawn here when anchor is 'cast'), product photos, the
//           scene's own picture, the first scene's still, the style's references.
//
// 1.2.0 adds a third mode:
//   products one edit of each product's first photo per kind ("snap": the whole
//            product on a plain textured surface; "angled": a three-quarter view
//            floating over warm white), for range and grid cards. The photo is
//            the only reference: a product still is never drawn from text.
//
// 1.2.1: in scenes mode a scene with image_locked: true keeps its own image as
// its still, ordering nothing (a preview the customer already approved).

const EDIT = 'fal-ai/nano-banana/edit';
const TEXT = 'fal-ai/nano-banana';
const NB_PROMPT_MAX = 12000;
const NB_AT_ONCE = 4;
const NB_LOCKED_MIME = ['image/png', 'image/jpeg', 'image/webp'];
const NB_SCENE_ONLY = ['scenes', 'template', 'look', 'answers', 'cast', 'products', 'brand', 'pick', 'skip_first', 'skip_last', 'anchor', 'cast_aspect_ratio', 'style_refs', 'multi_ref'];
// Inputs products mode refuses (they pick or draw scenes and cast).
const NB_NOT_PRODUCTS = ['images', 'scenes', 'cast', 'pick', 'skip_first', 'skip_last', 'anchor', 'cast_aspect_ratio', 'style_refs', 'multi_ref'];
// products mode: the built-in text per kind, used when the template has no by_tag rule for it
// (the day-in-the-life recipe's snap and 3D-angled stills, 2026-10).
const NB_KIND_TEXT = {
  snap: 'The {product.name} exactly as in the reference photo: the same shape, colours, pattern and label. One complete product resting on a neutral textured surface, soft key light from the upper left, the product slightly above centre, photoreal close-up product photo',
  angled: 'The {product.name} exactly as in the reference photo: the same shape, colours, pattern and label. The whole product turned 15 to 20 degrees to a three-quarter view, floating over a warm white background, a soft cast shadow to the lower right, photoreal studio product photo',
};
// The negative used when there is no template at all.
const NB_KIND_NEGATIVE = 'text, captions, hands, extra products, a changed label, a changed colour or pattern';

async function nbIsPng(path) {
  const head = (await readFile(path)).subarray(0, 8);
  return head.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

/** One paid still: `refs` go to /edit; without refs the prompt-only model draws it. */
async function nbDraw(ctx, { piece, refs, prompt, aspect, seed }) {
  kitStopIfAborted(ctx);
  const model = refs && refs.length ? EDIT : TEXT;
  const body = { prompt, num_images: 1, output_format: 'png' };
  if (model === EDIT) body.image_urls = refs;
  if (aspect) body.aspect_ratio = aspect;
  if (Number.isInteger(seed)) body.seed = seed;
  const result = await ctx.line.order({
    piece,
    provider: 'fal',
    path: model === EDIT ? EDIT : TEXT,
    body,
    results: [{ pointer: '/json/images/0/url', name: `${piece}-raw.png`, media: 'image' }],
  });
  const raw = result && result.files && result.files[`${piece}-raw.png`];
  if (!raw) throw ctx.error('provider_failed', `no image for ${piece}`);
  if (await nbIsPng(raw.path)) return raw;
  await kitFfmpeg(ctx, ['-i', raw.path, '-frames:v', '1', join(ctx.workDir, `${piece}.png`)]);
  return ctx.file(`${piece}.png`, 'image');
}

/** Runs `work` over `items`, a few at a time, keeping their order. */
async function nbEach(items, work) {
  const out = new Array(items.length);
  let next = 0;
  let failed = false;
  const lanes = Array.from({ length: Math.min(NB_AT_ONCE, items.length) }, async () => {
    // After one failure no lane starts another paid piece.
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

async function nbImages(inputs, ctx, manifest) {
  const model = inputs.model;
  if (!inputs.images) throw ctx.error('bad_input', 'images mode needs images (or give scenes for scenes mode)');
  for (const key of NB_SCENE_ONLY) {
    if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in scenes mode`);
  }
  if (inputs.kinds !== undefined) throw ctx.error('bad_input', 'kinds works only in products mode');
  for (const [i, img] of inputs.images.entries()) {
    const refs = img.references || [];
    if (model === EDIT && !refs.length) throw ctx.error('bad_input', `images[${i}] has no reference image for ${EDIT}`);
    if (model === TEXT && refs.length) throw ctx.error('bad_input', `images[${i}] has reference images; use ${EDIT}`);
  }
  const used = new Set();
  const images = [];
  for (const [i, img] of inputs.images.entries()) {
    const piece = kitPieceName('image', img.id, i, used);
    const file = await nbDraw(ctx, { piece, refs: model === EDIT ? img.references : null, prompt: img.prompt, aspect: inputs.aspect_ratio, seed: inputs.seed });
    images.push({ id: String(img.id ?? i + 1), image: file });
    ctx.progress({ done: i + 1, total: inputs.images.length });
  }
  return kitCheckOutputs(ctx, manifest, { images });
}

async function nbScenes(inputs, ctx, manifest) {
  const model = inputs.model;
  const anchor = inputs.anchor || 'none';
  if (inputs.images) throw ctx.error('bad_input', 'scenes mode makes its own images: give scenes or images, not both');
  if (inputs.kinds !== undefined) throw ctx.error('bad_input', 'kinds works only in products mode');
  if (!inputs.scenes) throw ctx.error('bad_input', 'scenes mode needs scenes');
  if (model === TEXT && anchor !== 'none') throw ctx.error('bad_input', `anchor ${anchor} needs ${EDIT}, which takes reference images`);
  if (model === TEXT && inputs.style_refs && inputs.style_refs.length) throw ctx.error('bad_input', `style_refs need ${EDIT}, which takes reference images`);
  const cast = inputs.cast || [];
  const keys = new Set();
  for (const m of cast) {
    if (keys.has(m.key)) throw ctx.error('bad_input', `two cast members have the key ${m.key}`);
    keys.add(m.key);
  }
  for (const s of inputs.scenes) {
    if (s.image_locked === true && !s.image) throw ctx.error('bad_input', `scene ${s.id} is marked image_locked but has no image`);
  }
  const locked = (job) => job.scene.image_locked === true;

  // Everything that can refuse happens before the first piece is ordered.
  let tpl;
  let jobs;
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null };
  const anchorJobs = [];
  try {
    tpl = kitStillTemplate(inputs.template ? await kitLoadTemplate(inputs.template) : null);
    // A locked scene is never redrawn, so only the other picked scenes get a prompt (and can refuse).
    const picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
    const open = picked.filter((p) => p.scene.image_locked !== true);
    const filled = kitStillJobs(tpl, open.map((p) => p.scene), { ...base, cast, products: inputs.products || [], multi_ref: inputs.multi_ref });
    filled.forEach((j, i) => {
      j.index = open[i].index;
    });
    const byIndex = new Map(filled.map((j) => [j.index, j]));
    jobs = picked.map((p) => byIndex.get(p.index) || { id: String(p.scene.id), index: p.index, scene: p.scene, prompt: '', negative: '', tag: null, cast: [], strip: false, products: [], scene_image: null });
    const ids = new Set();
    for (const j of jobs) {
      if (ids.has(j.id)) throw new Error(`two scenes have the id ${j.id}`);
      ids.add(j.id);
    }
    if (model === EDIT && anchor === 'cast') {
      for (const m of kitStillAnchorMembers(jobs.filter((j) => !locked(j)))) if (!m.image) anchorJobs.push({ member: m, prompt: kitStillAnchorPrompt(tpl, m, base) });
    }
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
  }
  if (!jobs.length) throw ctx.error('bad_input', 'no scene is picked for a still');
  for (const s of inputs.scenes) {
    if (s.image_locked === true && !jobs.some((j) => j.id === s.id)) ctx.log.warn(`scene ${s.id} is image_locked but this step does not pick it`);
  }
  // The strip note added later is under 600 characters.
  for (const text of [...jobs.filter((j) => !locked(j)).map((j) => kitStillPrompt(j, {})), ...anchorJobs.map((a) => a.prompt)]) {
    if (text.length > NB_PROMPT_MAX - 600) throw ctx.error('bad_input', `a prompt is over ${NB_PROMPT_MAX - 600} characters`);
  }

  const used = new Set();
  for (const a of anchorJobs) a.piece = kitPieceName('anchor', a.member.key, cast.indexOf(a.member), used);
  for (const j of jobs) j.piece = kitPieceName('image', j.id, j.index, used);
  const total = anchorJobs.length + jobs.length;
  let done = 0;
  const tick = () => ctx.progress({ done: ++done, total });
  if (model === TEXT && jobs.some((j) => j.cast.length || j.products.length || j.scene_image)) {
    ctx.log.info(`${TEXT} draws from the prompt alone, so scene references are not sent`);
  }

  // 1. Cast anchors: members with an image pass through free.
  const anchors = new Map();
  for (const m of cast) if (m.image) anchors.set(m.key, m.image);
  const styleRefs = model === EDIT ? inputs.style_refs || [] : [];
  await nbEach(anchorJobs, async (a) => {
    const file = await nbDraw(ctx, { piece: a.piece, refs: styleRefs, prompt: a.prompt, aspect: inputs.cast_aspect_ratio || '1:1', seed: inputs.seed });
    anchors.set(a.member.key, file);
    tick();
  });

  // 2. Scene stills. With anchor 'first_scene' the first still is a reference for every later one.
  const strips = new Map();
  const stripFor = async (files) => {
    const set = files.map((c) => c.key).join(' ');
    // Lanes share one strip per member set (the promise, so it is made once).
    if (!strips.has(set)) strips.set(set, kitStillStrip(ctx, files.map((c) => c.file), `strip-${strips.size + 1}.png`));
    return { key: set, file: await strips.get(set), strip: files.map((c) => c.name) };
  };
  const stills = new Map();
  const drawJob = async (job, first) => {
    if (locked(job)) {
      kitStopIfAborted(ctx);
      // Kept pixel for pixel; a picture the motion parts cannot read (AVIF, HEIC, GIF) becomes a PNG, free.
      let file = job.scene.image;
      if (!NB_LOCKED_MIME.includes(file.mime)) {
        await kitFfmpeg(ctx, ['-i', file.path, '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, `${job.piece}.png`)]);
        file = await ctx.file(`${job.piece}.png`, 'image');
      }
      stills.set(job.id, file);
      tick();
      return;
    }
    let refs = { files: [], strip_at: null, names: null };
    if (model === EDIT) {
      const castFiles = kitStillCastFiles(job, anchors);
      const castRefs = kitStillWantsStrip(job, castFiles) ? [await stripFor(castFiles)] : castFiles.slice(0, 3);
      refs = kitStillRefs(job, { cast: castRefs, first, style_refs: styleRefs });
    }
    const file = await nbDraw(ctx, { piece: job.piece, refs: refs.files, prompt: kitStillPrompt(job, refs), aspect: inputs.aspect_ratio, seed: inputs.seed });
    stills.set(job.id, file);
    tick();
  };
  let rest = jobs;
  let first = null;
  if (anchor === 'first_scene') {
    await drawJob(jobs[0], null);
    first = stills.get(jobs[0].id);
    rest = jobs.slice(1);
  }
  await nbEach(rest, (job) => drawJob(job, first));

  const out = kitStillOutputs({ scenes: inputs.scenes, cast, jobs, stills, anchors });
  // All four outputs every time (empty lists without a cast), so a style can bind step.<id>.cast or .anchors.
  return kitCheckOutputs(ctx, manifest, { images: out.images, scenes: out.scenes, cast: out.cast, anchors: out.anchors });
}

/**
 * products mode: the template a kind is filled from. The style's by_tag rule
 * for the kind (matched as tags are: Snap, snap) keeps its texts; without a
 * scene text it gets the built-in one. The template's top-level scene text is
 * for scenes and is not used here. With no template the built-in negative is added.
 */
function nbKindTemplate(tpl, kind) {
  const base = tpl || { version: 1, negative: NB_KIND_NEGATIVE };
  const by = base.by_tag && typeof base.by_tag === 'object' ? base.by_tag : {};
  const key = Object.keys(by).find((k) => kitTagKey(k) === kitTagKey(kind));
  const rule = key == null ? {} : by[key];
  return { ...base, by_tag: { [kind]: { ...rule, scene: typeof rule.scene === 'string' ? rule.scene : NB_KIND_TEXT[kind] } } };
}

async function nbProducts(inputs, ctx, manifest) {
  if (inputs.model !== EDIT) throw ctx.error('bad_input', `products mode edits each product's photo, so it needs ${EDIT}`);
  for (const key of NB_NOT_PRODUCTS) {
    if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} does not work in products mode`);
  }
  const products = inputs.products || [];
  if (!products.length) throw ctx.error('bad_input', 'products mode needs products');
  const kinds = inputs.kinds || ['snap'];
  const ids = new Set();
  for (const p of products) {
    if (ids.has(p.id)) throw ctx.error('bad_input', `two products have the id ${p.id}`);
    ids.add(p.id);
    if (!Array.isArray(p.images) || !p.images.length) throw ctx.error('bad_input', `product ${p.id} has no photo to edit`);
    if (typeof p.name !== 'string' || !p.name.trim()) throw ctx.error('bad_input', `product ${p.id} has no name`);
  }

  // Every prompt is filled before the first piece is ordered.
  const jobs = [];
  try {
    const tpl = inputs.template ? await kitLoadTemplate(inputs.template) : null;
    const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null };
    for (const product of products) {
      for (const kind of kinds) {
        const id = `${product.id}-${kind}`;
        const scene = { id, line: null, on_screen: null, picture: product.name, extra: { shot: kind } };
        let filled;
        try {
          filled = kitScenePrompt(nbKindTemplate(tpl, kind), { ...base, scene, index: jobs.length, products: [product] });
        } catch (err) {
          // "scene mist-snap needs {answers.snap_surface}" reads as "the snap still of product mist needs ...".
          if (err instanceof KitPromptGap) throw new KitPromptGap(err.message.replace(`scene ${id}`, `the ${kind} still of product ${product.id}`), err);
          throw err;
        }
        const prompt = kitPromptJoin([filled.prompt, filled.negative ? `Avoid: ${filled.negative}` : '']);
        jobs.push({ id, kind, product, prompt });
      }
    }
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
  }
  for (const j of jobs) {
    if (j.prompt.length > NB_PROMPT_MAX) throw ctx.error('bad_input', `the ${j.kind} prompt for product ${j.product.id} is over ${NB_PROMPT_MAX} characters`);
  }

  const used = new Set();
  for (const [i, j] of jobs.entries()) j.piece = kitPieceName(j.kind, j.product.id, i, used);
  let done = 0;
  const files = await nbEach(jobs, async (j) => {
    const file = await nbDraw(ctx, { piece: j.piece, refs: [j.product.images[0]], prompt: j.prompt, aspect: inputs.aspect_ratio, seed: inputs.seed });
    ctx.progress({ done: ++done, total: jobs.length });
    return file;
  });
  return kitCheckOutputs(ctx, manifest, { images: jobs.map((j, i) => ({ id: j.id, image: files[i] })) });
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const mode = inputs.mode || (inputs.scenes ? 'scenes' : 'images');
  if (mode === 'products') return nbProducts(inputs, ctx, manifest);
  return mode === 'scenes' ? nbScenes(inputs, ctx, manifest) : nbImages(inputs, ctx, manifest);
}
