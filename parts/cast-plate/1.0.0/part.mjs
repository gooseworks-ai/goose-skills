// Built from cast-plate/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- cast-plate/src/plate.mjs ----
// cast-plate helpers: the seats, the size rule, the crop table and the plate
// prompt. Pure functions, no I/O. Bundled into part.mjs; every top-level name
// starts with `plate` (parts/_tools/bundle.mjs needs unique names).

/**
 * Where each person sits, left to right, as the centre of their face in
 * fractions of the plate's width. The prompt asks for these places and the
 * singles are cut at them, so no face detector is needed (the recipe's three
 * detectors found furniture). two_shot is fixed by MASTER-PLAN-v2 §4.4.
 */
const PLATE_SEATS = {
  two_shot: [
    { side: 'LEFT', at: 0.3 },
    { side: 'RIGHT', at: 0.7 },
  ],
  three_shot: [
    { side: 'LEFT', at: 0.2 },
    { side: 'CENTRE', at: 0.5 },
    { side: 'RIGHT', at: 0.8 },
  ],
};

const PLATE_DEFAULT_SIZE = '2304x1296';

/** {width, height} for "WxH", or {problem} when gpt-image-2 or a full-height single cannot use it. */
function plateSize(text) {
  const m = /^(\d{3,4})x(\d{3,4})$/.exec(String(text || ''));
  if (!m) return { problem: `size "${text}" is not WIDTHxHEIGHT` };
  const width = Number(m[1]);
  const height = Number(m[2]);
  if (width % 16 || height % 16) return { problem: `size ${text}: both sides must be multiples of 16` };
  if (Math.max(width, height) > 3840) return { problem: `size ${text}: the longest side may be at most 3840` };
  const pixels = width * height;
  if (pixels < 655360 || pixels > 8294400) return { problem: `size ${text}: the picture must hold 655,360 to 8,294,400 pixels` };
  if (width / height > 3) return { problem: `size ${text}: the aspect may be at most 3:1` };
  if (width <= height) return { problem: `size ${text}: a plate is landscape, so each single is a full-height slice` };
  return { width, height };
}

/**
 * One full-height 9:16 slice per seat, in pixels: centred on the seat,
 * moved inside the picture when it would cross an edge. The width is even.
 */
function plateCrops(width, height, layout) {
  const seats = PLATE_SEATS[layout];
  const w = Math.min(width - (width % 2), 2 * Math.floor((height * 9) / 32));
  return seats.map((seat) => {
    const x = Math.max(0, Math.min(width - w, Math.round(seat.at * width - w / 2)));
    return { x, y: 0, w, h: height };
  });
}

/**
 * The problem with cutting `layout`'s singles from a width x height plate, or
 * null. Every slice must fit around its seat without moving: three_shot needs
 * a plate at least 1.40625 times as wide as it is high (a 9:16 slice centred
 * at 20% would otherwise be pushed off its seat).
 */
function plateCropProblem(width, height, layout) {
  const crops = plateCrops(width, height, layout);
  for (const [i, seat] of PLATE_SEATS[layout].entries()) {
    const c = crops[i];
    if (Math.abs(c.x + c.w / 2 - seat.at * width) > 1) {
      return `size ${width}x${height} is too narrow for ${layout}: the ${seat.side} single cannot be centred on its seat at ${Math.round(seat.at * 100)}%`;
    }
  }
  return null;
}

function plateText(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/** The problem with a cast for `layout`, or null. Members sit in cast order, left to right. */
function plateCastProblem(cast, layout) {
  const seats = PLATE_SEATS[layout];
  if (cast.length !== seats.length) return `${layout} seats ${seats.length} people; the cast has ${cast.length}`;
  const keys = new Set();
  for (const m of cast) {
    if (keys.has(m.key)) return `the cast names ${m.key} twice`;
    keys.add(m.key);
    if (!m.image && !plateText(m.look)) return `cast ${m.key} needs a look (age, gender, hair, clothes) or an image: the plate cannot tell the people apart without it`;
  }
  const drawn = cast.filter((m) => !m.image).map((m) => plateText(m.look).toLowerCase().replace(/\s+/g, ' '));
  if (new Set(drawn).size !== drawn.length) return 'two cast members have the same look, so the plate would come back as twins';
  return null;
}

/** The text that places each member: "LEFT, face about 30% in from the left edge: Maya, the person in reference image 1, woman, 34". */
function plateSeating(cast, layout) {
  const seats = PLATE_SEATS[layout];
  let ref = 0;
  return cast
    .map((m, i) => {
      const seat = seats[i];
      const where = `${seat.side}, face centred about ${Math.round(seat.at * 100)}% of the way across from the left edge`;
      const who = [plateText(m.name)];
      if (m.image) {
        ref += 1;
        who.push(`the person in reference image ${ref}, with the same face, hair and clothes`);
      }
      who.push(plateText(m.look));
      return `${where}: ${who.filter(Boolean).join(', ')}.`;
    })
    .join(' ');
}

const PLATE_COUNT_WORD = { 2: 'two', 3: 'three' };

/** The recipe's two-shot plate prompt (create-podcast-skit-video-from-refs plate_rules and realism_suffix), for 2 or 3 people. */
function plateDefaultBody(cast, layout, room) {
  const n = PLATE_COUNT_WORD[cast.length] || String(cast.length);
  const all = cast.length === 2 ? 'Both people' : `All ${n} people`;
  return kitPromptJoin([
    `Candid documentary photograph of ${n} podcast hosts recording together in ONE room, one wide landscape frame.`,
    `Shot on a phone in available light, not lit and not styled. ${all} seated well apart side by side, facing the camera and turned slightly toward each other, mid-conversation.`,
    'Each wears over-ear headphones and speaks into a broadcast microphone on its own boom arm.',
    'Camera at seated eye level, every person framed from the chest up and in sharp focus, generous space above every head, nobody cut by the frame edge.',
    'All mouths closed and neutral.',
    `Seating, left to right: ${plateSeating(cast, layout)}`,
    `The room: ${plateText(room)}. One room with one continuous back wall a metre or two behind them, in focus.`,
    'No manufacturer names, model names, maker decals or sponsor logos anywhere: not on the equipment, the furniture, the tools, the packaging or their clothes. Every object is unbranded and plain. No printed text, no signage.',
    'Real candid documentary photograph of real people, visible skin texture and pores, slight facial asymmetry, one coherent hairstyle each with no stray long lock, natural hands with five fingers, unmodified ears. Lips closed naturally, no open mouth, no teeth.',
  ]);
}

function plateValues(cast, layout, room, answers, brand) {
  const values = { picture: '', line: '', on_screen: '', look: '', style: '', 'product.name': '', 'speaker.name': '', 'speaker.look': '' };
  if (brand && typeof brand === 'object') for (const [k, v] of Object.entries(brand)) values[`brand.${k}`] = v;
  if (answers && typeof answers === 'object') for (const [k, v] of Object.entries(answers)) values[`answers.${k}`] = v;
  values['answers.room'] = plateText(room);
  values.cast_looks = plateSeating(cast, layout);
  return values;
}

/**
 * The plate prompt. Without a template it is the recipe's. With one (a style
 * frame, version 1), `templates.plate` replaces the body; prefix and suffix
 * wrap it; `negative` becomes an "Avoid:" sentence (gpt-image-2 has no
 * negative prompt); `banned` phrases refuse. Placeholders: {cast_looks} is the
 * seating text, {answers.room} the room, {answers.KEY} and {brand.FIELD} as in
 * scenes. Throws KitPromptGap (from kitPromptFill) or an Error naming the problem.
 */
function platePrompt({ cast, layout, room, template, answers, brand }) {
  if (!template) return plateDefaultBody(cast, layout, room);
  const values = plateValues(cast, layout, room, answers, brand);
  const opts = { who: 'the plate' };
  const fill = (t) => (typeof t === 'string' ? kitPromptFill(t, values, opts) : '');
  const own = template.templates && typeof template.templates.plate === 'string' ? template.templates.plate : null;
  const body = own != null ? fill(own) : plateDefaultBody(cast, layout, room);
  const negative = fill(template.negative);
  const prompt = kitPromptJoin([fill(template.prefix), body, fill(template.suffix), negative ? `Avoid: ${negative}` : '']);
  for (const phrase of Array.isArray(template.banned) ? template.banned : []) {
    const re = kitWholeWordsRe(phrase);
    if (re && re.test(prompt)) throw new Error(`the plate prompt uses the banned phrase "${kitPromptTidy(phrase)}"`);
  }
  return prompt;
}

// ---- cast-plate/src/part.mjs ----
// cast-plate: one wide picture of the whole cast in one room (a "plate"), and
// one full-height single per person cut out of it for free. From the podcast
// recipe (create-podcast-skit-video-from-refs gen_paid.py plate +
// crop_singles.py): a set description holds a room only inside one
// generation, so a still per person puts them in different rooms; one plate is
// the only way the set holds. The model is openai/gpt-image-2 on fal (the
// recipe rejects Nano Banana faces as stock); cast members with an image go to
// /edit as references, in seat order. The model takes no seed, so a re-roll is
// a new cast: the kit's piece reuse is what keeps a plate.
//
// Seats are fixed (src/plate.mjs PLATE_SEATS): the prompt asks for each face
// at its seat and the singles are cut there, so no face detector is needed.

const TEXT = 'openai/gpt-image-2';
const EDIT = 'openai/gpt-image-2/edit';
const PLATE_REF_MIME = ['image/png', 'image/jpeg', 'image/webp'];

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const cast = inputs.cast;
  const layout = inputs.layout ?? (cast.length === 3 ? 'three_shot' : 'two_shot');
  const castProblem = plateCastProblem(cast, layout);
  if (castProblem) throw ctx.error('bad_input', castProblem);
  if (!String(inputs.room).trim()) throw ctx.error('bad_input', 'room is empty: the plate needs the room the cast sits in');
  const size = plateSize(inputs.size ?? PLATE_DEFAULT_SIZE);
  if (size.problem) throw ctx.error('bad_input', size.problem);
  const cropProblem = plateCropProblem(size.width, size.height, layout);
  if (cropProblem) throw ctx.error('bad_input', cropProblem);

  const given = cast.filter((m) => m.image).map((m) => m.image);
  const model = inputs.model ?? (given.length ? EDIT : TEXT);
  if (model === TEXT && given.length) throw ctx.error('bad_input', `${TEXT} cannot take the cast's images; use ${EDIT}`);
  if (model === EDIT && !given.length) throw ctx.error('bad_input', `${EDIT} needs at least one cast member with an image`);

  let template = null;
  if (inputs.template) {
    try {
      template = await kitLoadTemplate(inputs.template);
    } catch (err) {
      throw ctx.error('bad_input', err.message);
    }
  }
  let prompt;
  try {
    prompt = platePrompt({ cast, layout, room: inputs.room, template, answers: inputs.answers, brand: inputs.brand });
  } catch (err) {
    // A placeholder with no value (KitPromptGap) or a banned phrase: refused before anything is ordered.
    throw ctx.error('bad_input', err.message);
  }
  if (prompt.length > 32000) throw ctx.error('bad_input', `the plate prompt is ${prompt.length} characters; the model takes 32,000`);

  kitStopIfAborted(ctx);
  // gpt-image-2/edit reads PNG, JPEG and WebP; any other picture (AVIF, HEIC,
  // GIF from a brand library) is turned into a PNG first, for free.
  const refs = [];
  for (const [i, ref] of given.entries()) refs.push(PLATE_REF_MIME.includes(ref.mime) ? ref : await plateRefAsPng(ctx, ref, i));
  const piece = 'plate';
  const body = {
    prompt,
    image_size: { width: size.width, height: size.height },
    quality: inputs.quality ?? 'high',
    num_images: 1,
    output_format: 'png',
  };
  if (model === EDIT) body.image_urls = refs;
  const result = await ctx.line.order({
    piece,
    provider: 'fal',
    path: model === EDIT ? EDIT : TEXT,
    body,
    results: [{ pointer: '/json/images/0/url', name: `${piece}.png`, media: 'image' }],
  });
  const got = result.files[`${piece}.png`];
  if (!got) throw ctx.error('provider_failed', 'the plate came back with no picture');
  ctx.progress({ done: 1, total: 2 });

  const plate = await plateAtSize(ctx, got, size);
  const crops = plateCrops(size.width, size.height, layout);
  const singles = [];
  const seen = new Map();
  for (const [i, member] of cast.entries()) {
    kitStopIfAborted(ctx);
    const c = crops[i];
    const name = `single-${i + 1}.png`;
    await kitFfmpeg(ctx, ['-i', plate.path, '-vf', `crop=${c.w}:${c.h}:${c.x}:${c.y}`, '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, name)]);
    const image = await ctx.file(name, 'image');
    if (seen.has(image.sha256)) {
      throw ctx.error('output_invalid', `the ${PLATE_SEATS[layout][i].side} and ${seen.get(image.sha256)} seats of the plate are the same picture`);
    }
    seen.set(image.sha256, PLATE_SEATS[layout][i].side);
    singles.push({ key: member.key, image });
  }
  ctx.progress({ done: 2, total: 2 });
  return kitCheckOutputs(ctx, manifest, {
    plate,
    singles,
    crops: cast.map((m, i) => ({
      key: m.key,
      x: crops[i].x / size.width,
      y: 0,
      w: crops[i].w / size.width,
      h: 1,
    })),
    layout,
    prompt,
  });
}

/** A cast picture the model cannot read, as a PNG (first frame only). */
async function plateRefAsPng(ctx, file, i) {
  const name = `ref-${i + 1}.png`;
  await kitFfmpeg(ctx, ['-i', file.path, '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, name)]);
  return ctx.file(name, 'image');
}

/** The plate at exactly the asked size: as returned when it matches, else scaled to cover and centre-cropped. */
async function plateAtSize(ctx, file, size) {
  let { width, height } = file;
  if (!width || !height) ({ width, height } = await ctx.tools.probe(file.path));
  if (width === size.width && height === size.height) return file;
  if (!width || !height) throw ctx.error('provider_failed', 'the plate is not a readable picture');
  ctx.log.warn('the plate came back at another size; scaled to cover', { width, height, want: size });
  const name = `plate-${size.width}x${size.height}.png`;
  await kitFfmpeg(ctx, [
    '-i',
    file.path,
    '-vf',
    `scale=${size.width}:${size.height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${size.width}:${size.height},setsar=1`,
    '-frames:v',
    '1',
    '-c:v',
    'png',
    join(ctx.workDir, name),
  ]);
  return ctx.file(name, 'image');
}
