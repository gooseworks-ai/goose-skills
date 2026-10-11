// Built from video-veo-3/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- video-veo-3/src/part.mjs ----
// video-veo-3: moves stills with Google Veo 3 / 3.1 image-to-video on fal, one
// paid piece per clip, always without sound. Two modes, as video-kling 1.0.0:
//   scenes  one clip per picked plan scene, its still found by scene id (from
//           image-gpt-image-2's or image-nano-banana's images), its length from
//           the voice's or song's spans (_lib/scene-clips.mjs), its prompt from
//           the style's template;
//   images  one clip per still (a keyframe, a cast anchor), at a fixed length.
// Veo's request (W0-62 contracts, replies/fal-ai--veo3.1--image-to-video.json):
// prompt, image_url, duration "4s" | "6s" | "8s" (a string with an s),
// resolution, aspect_ratio, negative_prompt, seed, and generate_audio, which
// defaults to true on fal and is always sent false here.
// Veo answers a prompt worded as a still shot ("she remains", "steady") with no
// video about a third of the time, so such words refuse the step before any
// piece is bought (static_words 'refuse', the default).
// A clip the provider refuses can fall back to its still (fallback 'still').

const VEO_31 = 'fal-ai/veo3.1/image-to-video';
const VEO_31_FAST = 'fal-ai/veo3.1/fast/image-to-video';
const VEO_3 = 'fal-ai/veo3/image-to-video';
const VEO_3_FAST = 'fal-ai/veo3/fast/image-to-video';
/** The clip lengths every Veo model makes (fal's duration enum is "4s" | "6s" | "8s"). */
const VEO_ALLOWED = [4, 6, 8];
const VEO_DEFAULT_S = 4;
const VEO_PROMPT_MAX = 20000;
const VEO_NEGATIVE_MAX = 5000;
const VEO_SCENE_ONLY = ['pick', 'skip_first', 'skip_last', 'spans'];
/** The motion text when the template has none: verb-led, with no still-shot words. */
const VEO_DEFAULT_MOTION = '{picture?}. The camera drifts a little handheld as the moment plays out. No text, no new objects';
/** Words that tell Veo the shot is still (W0-62 / the wardrobe-stitch run's L4). Whole words, any case. */
const VEO_STATIC_WORDS = ['remain', 'remains', 'stay', 'stays', 'rests', 'unchanged', 'steady', 'steadily', 'holds', 'subtle', 'subtly', 'slow', 'slowly', 'gentle', 'gently', 'smooth', 'smoothly', 'static', 'motionless'];

/** The first still-shot word in a prompt, or null. */
function veoStaticWord(prompt) {
  for (const word of VEO_STATIC_WORDS) if (kitWholeWordsRe(word).test(prompt)) return word;
  return null;
}

/** The model's request for one clip. */
function veoBody({ still, prompt, negative, seconds, resolution, aspect_ratio, seed }) {
  const body = { prompt, image_url: still, duration: `${seconds}s`, resolution, generate_audio: false };
  if (aspect_ratio) body.aspect_ratio = aspect_ratio;
  if (negative) body.negative_prompt = negative;
  if (seed != null) body.seed = seed;
  return body;
}

/** Orders one clip: each model's path is a listed constant. */
function veoOrder(ctx, model, order) {
  if (model === VEO_31_FAST) return ctx.line.order({ ...order, provider: 'fal', path: VEO_31_FAST });
  if (model === VEO_3) return ctx.line.order({ ...order, provider: 'fal', path: VEO_3 });
  if (model === VEO_3_FAST) return ctx.line.order({ ...order, provider: 'fal', path: VEO_3_FAST });
  return ctx.line.order({ ...order, provider: 'fal', path: VEO_31 });
}

function veoBad(ctx, err) {
  if (ctx.signal && ctx.signal.aborted) return ctx.error('stopped', 'the step was stopped');
  return ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const model = inputs.model;
  const mode = inputs.mode || (inputs.scenes ? 'scenes' : 'images');
  if (mode === 'scenes' && !inputs.scenes) throw ctx.error('bad_input', 'scenes mode needs scenes (or set mode images)');
  if (mode === 'images') {
    for (const key of VEO_SCENE_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in scenes mode`);
  }
  if (inputs.spans && inputs.seconds !== undefined) throw ctx.error('bad_input', 'give spans or seconds, not both');

  // Everything that can refuse happens before the first piece is ordered.
  let jobs;
  try {
    const loaded = inputs.template ? await kitLoadTemplate(inputs.template) : null;
    const tpl = kitClipTemplate(loaded && typeof loaded.motion === 'string' ? loaded : { ...(loaded || { version: 1 }), motion: VEO_DEFAULT_MOTION });
    jobs = kitClipJobs(tpl, {
      mode,
      stills: inputs.stills,
      scenes: inputs.scenes || [],
      use: inputs.use || 'motion',
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
    const bounds = { min_s: inputs.min_s ?? null, max_s: inputs.max_s ?? null };
    const slots = inputs.spans ? kitClipSlots(jobs, inputs.spans) : null;
    const staticCheck = (inputs.static_words || 'refuse') === 'refuse';
    let total = 0;
    for (const job of jobs) {
      if (slots) {
        const length = kitClipSeconds(slots.get(job.id), VEO_ALLOWED, bounds);
        job.seconds = length.seconds;
        if (length.short) ctx.log.info(`scene ${job.id} is on screen ${slots.get(job.id).toFixed(2)} s; its clip is the longest allowed, ${job.seconds} s`);
      } else {
        const want = inputs.seconds ?? VEO_DEFAULT_S;
        const length = kitClipSeconds(want, VEO_ALLOWED, { ...bounds, exact: true });
        if (length.short) throw new Error(`seconds ${want} is longer than the longest clip allowed here (${length.seconds} s)`);
        job.seconds = length.seconds;
      }
      total += job.seconds;
      if (inputs.keep && inputs.keep.seconds > job.seconds) throw new Error(`keep ${inputs.keep.seconds} s is longer than clip ${job.id} (${job.seconds} s)`);
      job.negative = inputs.negative_prompt || job.negative || '';
      if (!job.prompt) throw new Error(`clip ${job.id} has an empty prompt: give the scene a picture or the template a motion text`);
      if (job.prompt.length > VEO_PROMPT_MAX) throw new Error(`clip ${job.id}'s prompt is over ${VEO_PROMPT_MAX} characters`);
      if (job.negative.length > VEO_NEGATIVE_MAX) throw new Error(`clip ${job.id}'s negative prompt is over ${VEO_NEGATIVE_MAX} characters`);
      const word = staticCheck ? veoStaticWord(job.prompt) : null;
      if (word) throw new Error(`clip ${job.id}'s prompt says "${word}", which tells Veo the shot is still (it often makes no video then): describe the motion with an action verb, or set static_words allow`);
    }
    if (inputs.max_total_s != null && total > inputs.max_total_s + 1e-9) {
      throw new Error(`the ${jobs.length} clips come to ${total} s, over max_total_s ${inputs.max_total_s}`);
    }
  } catch (err) {
    throw veoBad(ctx, err);
  }

  const used = new Set();
  for (const job of jobs) job.piece = kitPieceName('clip', job.id, job.index, used);
  const fallback = inputs.fallback || 'fail';
  const lastAttempt = !(ctx.step && ctx.step.attempt < 1 + ((manifest.retry && manifest.retry.transient) || 0));
  const resolution = inputs.resolution || '1080p';
  let done = 0;

  const clips = await kitClipEach(jobs, async (job) => {
    kitStopIfAborted(ctx);
    const seed = inputs.seed != null ? inputs.seed + job.index : null;
    const body = veoBody({ still: job.still, prompt: job.prompt, negative: job.negative, seconds: job.seconds, resolution, aspect_ratio: inputs.aspect_ratio, seed });
    let file;
    try {
      const result = await veoOrder(ctx, model, { piece: job.piece, body, results: [{ pointer: '/json/video/url', name: `${job.piece}.mp4`, media: 'video' }] });
      file = result && result.files && result.files[`${job.piece}.mp4`];
      if (!file) throw ctx.error('provider_failed', `no video for ${job.piece}`);
      const info = await ctx.tools.probe(file.path);
      if (!info.has_video) throw ctx.error('provider_failed', `${job.piece} came back with no picture`);
    } catch (err) {
      // A stop is never masked by a still, whatever the provider's error says.
      kitStopIfAborted(ctx);
      if (fallback !== 'still' || !kitClipMayFallBack(err, { last_attempt: lastAttempt })) throw err;
      const seconds = inputs.keep ? inputs.keep.seconds : job.seconds;
      ctx.log.warn(`${job.piece} became its still: ${err.code}`, { piece: job.piece, code: err.code });
      ctx.progress({ done: ++done, total: jobs.length });
      return { id: job.id, image: job.still, seconds };
    }
    const length = await kitDuration(ctx, file);
    let clip = { id: job.id, video: file, seconds: Number(length.toFixed(3)) };
    if (inputs.keep) {
      const window = kitClipWindow(length, inputs.keep);
      if (window.seconds < length) clip = { id: job.id, video: await kitClipTrim(ctx, file, window, `${job.piece}-keep.mp4`), seconds: Number(window.seconds.toFixed(3)) };
    }
    ctx.progress({ done: ++done, total: jobs.length });
    return clip;
  });

  const out = { clips };
  if (clips[0].video) out.video = clips[0].video;
  return kitCheckOutputs(ctx, manifest, out);
}
