// Built from image-gpt-image-2/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
import { readFile, writeFile } from 'node:fs/promises';
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

// ---- image-gpt-image-2/src/plate.mjs ----
// Plate restore for shots mode (a port of the stop-motion recipe's
// restore_plate.py). Free: ffmpeg decodes and encodes, the rest is plain JS on
// raw RGB bytes, including Pillow's GaussianBlur (three box passes per axis,
// rounded to bytes after each), so the masks match the recipe's.
//
// An edit re-photographs the whole frame, so even with the shot's plate as the
// first reference the surface comes back as a close copy: the grain, the board
// seams and the edge of the window light move a little from frame to frame, and
// on hard cuts that reads as the table changing. giPlateRestore keeps the
// generated pixels only where the state really differs from the plate (the
// objects and their shadows, grown and feathered) and takes everything else from
// the plate itself, so the surface is the same pixels in every frame of a shot.
//
// Steps, as in restore_plate.py:
//   1. blur plate and state (sigma 6) so grain does not count as change;
//   2. take out an exposure drift: of three gains (none, the whole-frame median
//      ratio, the median ratio over pixels that already agree with the plate)
//      keep the one that leaves the least of the frame "changed";
//   3. changed = colour distance over 26; open with a 7x7 square; drop regions
//      under 0.15 % of the frame; fill holes; grow 36 px (a diamond, as scipy's
//      cross-structured dilation repeated); feather (blur sigma 18);
//   4. out = state x alpha + plate x (1 - alpha).
// Only for a locked camera and an EMPTY plate.

const GI_RESTORE = { thresh: 26, calm: 15, blur: 6, open: 7, min_area: 0.0015, grow: 36, feather: 18 };

/** Pillow's box radius for a Gaussian of `sigma` made of `passes` box blurs (_gaussian_blur_radius). */
function giPlateBoxRadius(sigma, passes = 3) {
  const sigma2 = (sigma * sigma) / passes;
  const L = Math.sqrt(12 * sigma2 + 1);
  const l = Math.floor((L - 1) / 2);
  const a = ((2 * l + 1) * (l * (l + 1) - 3 * sigma2)) / (6 * (sigma2 - (l + 1) * (l + 1)));
  return l + a;
}

/** One box pass along every line (Pillow's ImagingLineBoxBlur8: edges repeat, a fractional far pixel, rounded to a byte). */
function giPlateBoxPass(data, lines, len, lineStep, step, channels, fr) {
  const r = Math.floor(fr);
  const ww = Math.floor(2 ** 24 / (fr * 2 + 1));
  const fw = Math.floor((2 ** 24 - (r * 2 + 1) * ww) / 2);
  const line = new Int32Array(len);
  const last = len - 1;
  const at = (k) => line[k < 0 ? 0 : k > last ? last : k];
  for (let n = 0; n < lines; n++) {
    for (let c = 0; c < channels; c++) {
      const start = n * lineStep + c;
      for (let k = 0; k < len; k++) line[k] = data[start + k * step];
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += at(k);
      for (let x = 0; x < len; x++) {
        if (x > 0) acc += at(x + r) - at(x - r - 1);
        const bulk = acc * ww + (at(x - r - 1) + at(x + r + 1)) * fw;
        data[start + x * step] = Math.floor((bulk + 2 ** 23) / 2 ** 24);
      }
    }
  }
}

/** Pillow's ImageFilter.GaussianBlur(sigma) on raw bytes with `channels` per pixel: a new array. */
function giPlateBlur(src, w, h, channels, sigma) {
  const data = Uint8Array.from(src);
  if (!(sigma > 0)) return data;
  const fr = giPlateBoxRadius(sigma);
  for (let i = 0; i < 3; i++) giPlateBoxPass(data, h, w, w * channels, channels, channels, fr);
  for (let i = 0; i < 3; i++) giPlateBoxPass(data, w, h, channels, w * channels, channels, fr);
  return data;
}

/** Median of one channel (stride 3) over the pixels where `mask` is set (all when null), numpy's rule: the mean of the two middles. */
function giPlateMedian(rgb, channel, mask = null) {
  const hist = new Float64Array(256);
  let n = 0;
  for (let p = 0, i = channel; i < rgb.length; p++, i += 3) {
    if (mask && !mask[p]) continue;
    hist[rgb[i]]++;
    n++;
  }
  if (!n) return 0;
  const at = (k) => {
    let seen = 0;
    for (let v = 0; v < 256; v++) {
      seen += hist[v];
      if (seen > k) return v;
    }
    return 255;
  };
  return n % 2 ? at((n - 1) / 2) : (at(n / 2 - 1) + at(n / 2)) / 2;
}

/** Share of pixels whose colour distance between state/gain and plate is over `thresh`. */
function giPlateChangedShare(Sb, Pb, gain, thresh) {
  const t2 = thresh * thresh;
  let changed = 0;
  for (let i = 0; i < Sb.length; i += 3) {
    const r = Sb[i] / gain[0] - Pb[i];
    const g = Sb[i + 1] / gain[1] - Pb[i + 1];
    const b = Sb[i + 2] / gain[2] - Pb[i + 2];
    if (r * r + g * g + b * b > t2) changed++;
  }
  return changed / (Sb.length / 3);
}

/** The exposure gain [r, g, b] to divide the blurred state by (step 2). */
function giPlateGain(Sb, Pb, { calm = GI_RESTORE.calm, thresh = GI_RESTORE.thresh } = {}) {
  const px = Sb.length / 3;
  const ratio = (mask) => [0, 1, 2].map((c) => giPlateMedian(Sb, c, mask) / Math.max(giPlateMedian(Pb, c, mask), 1));
  const cands = [[1, 1, 1], ratio(null)];
  const still = new Uint8Array(px);
  let stillCount = 0;
  const c2 = calm * calm;
  for (let p = 0, i = 0; p < px; p++, i += 3) {
    const r = Sb[i] - Pb[i];
    const g = Sb[i + 1] - Pb[i + 1];
    const b = Sb[i + 2] - Pb[i + 2];
    if (r * r + g * g + b * b < c2) {
      still[p] = 1;
      stillCount++;
    }
  }
  if (stillCount / px > 0.05) cands.push(ratio(still));
  let best = cands[0];
  let bestShare = Infinity;
  for (const g of cands) {
    const safe = g.map((v) => (v > 0 ? v : 1));
    const share = giPlateChangedShare(Sb, Pb, safe, thresh);
    if (share < bestShare) {
      bestShare = share;
      best = safe;
    }
  }
  return best;
}

/** 1 where the colour distance between state/gain and plate is over `thresh`. */
function giPlateDiff(Sb, Pb, gain, thresh = GI_RESTORE.thresh) {
  const px = Sb.length / 3;
  const out = new Uint8Array(px);
  const t2 = thresh * thresh;
  for (let p = 0, i = 0; p < px; p++, i += 3) {
    const r = Sb[i] / gain[0] - Pb[i];
    const g = Sb[i + 1] / gain[1] - Pb[i + 1];
    const b = Sb[i + 2] / gain[2] - Pb[i + 2];
    if (r * r + g * g + b * b > t2) out[p] = 1;
  }
  return out;
}

/** One pass of a 1-D window of `size` along rows (axis 0) or columns (axis 1): erode (all set, the window inside the frame) or dilate (any set). */
function giPlateWindow(mask, w, h, size, axis, erode) {
  const out = new Uint8Array(mask.length);
  const r = Math.floor(size / 2);
  const len = axis === 0 ? w : h;
  const lines = axis === 0 ? h : w;
  const step = axis === 0 ? 1 : w;
  const sums = new Int32Array(len + 1);
  for (let line = 0; line < lines; line++) {
    const start = axis === 0 ? line * w : line;
    for (let k = 0; k < len; k++) sums[k + 1] = sums[k] + mask[start + k * step];
    for (let k = 0; k < len; k++) {
      const lo = k - r;
      const hi = k - r + size; // exclusive
      if (erode) {
        out[start + k * step] = lo >= 0 && hi <= len && sums[hi] - sums[lo] === size ? 1 : 0;
      } else {
        out[start + k * step] = sums[Math.min(hi, len)] - sums[Math.max(lo, 0)] > 0 ? 1 : 0;
      }
    }
  }
  return out;
}

/** Binary opening with a size x size square (scipy binary_opening: pixels whose window leaves the frame erode away). */
function giPlateOpen(mask, w, h, size = GI_RESTORE.open) {
  const eroded = giPlateWindow(giPlateWindow(mask, w, h, size, 0, true), w, h, size, 1, true);
  return giPlateWindow(giPlateWindow(eroded, w, h, size, 0, false), w, h, size, 1, false);
}

/** Flood fill (4-connected) from `seeds` over pixels where `inside(p)`; marks `label` into `labels`; returns the region's size. */
function giPlateFlood(labels, w, h, seed, label, inside) {
  const stack = [seed];
  labels[seed] = label;
  let size = 0;
  while (stack.length) {
    const p = stack.pop();
    size++;
    const x = p % w;
    const near = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p >= w ? p - w : -1, p + w < w * h ? p + w : -1];
    for (const q of near) {
      if (q >= 0 && !labels[q] && inside(q)) {
        labels[q] = label;
        stack.push(q);
      }
    }
  }
  return size;
}

/** Keeps only 4-connected regions of at least `minPx` pixels. */
function giPlateKeepLarge(mask, w, h, minPx) {
  const labels = new Int32Array(mask.length);
  const sizes = [0];
  for (let p = 0; p < mask.length; p++) {
    if (mask[p] && !labels[p]) sizes.push(giPlateFlood(labels, w, h, p, sizes.length, (q) => mask[q] === 1));
  }
  const out = new Uint8Array(mask.length);
  for (let p = 0; p < mask.length; p++) if (labels[p] && sizes[labels[p]] >= minPx) out[p] = 1;
  return out;
}

/** Fills holes: every unset pixel the frame's edge cannot reach (4-connected) through unset pixels. */
function giPlateFillHoles(mask, w, h) {
  const outside = new Int32Array(mask.length);
  const open = (q) => mask[q] === 0;
  for (let x = 0; x < w; x++) {
    for (const p of [x, (h - 1) * w + x]) if (!mask[p] && !outside[p]) giPlateFlood(outside, w, h, p, 1, open);
  }
  for (let y = 0; y < h; y++) {
    for (const p of [y * w, y * w + w - 1]) if (!mask[p] && !outside[p]) giPlateFlood(outside, w, h, p, 1, open);
  }
  const out = new Uint8Array(mask.length);
  for (let p = 0; p < mask.length; p++) out[p] = mask[p] || !outside[p] ? 1 : 0;
  return out;
}

/** Grows the mask by `r` pixels in city-block distance (scipy binary_dilation with its cross, `r` iterations). */
function giPlateGrow(mask, w, h, r = GI_RESTORE.grow) {
  const far = w + h + 1;
  const d = new Int32Array(mask.length);
  for (let p = 0; p < mask.length; p++) d[p] = mask[p] ? 0 : far;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (x > 0 && d[p - 1] + 1 < d[p]) d[p] = d[p - 1] + 1;
      if (y > 0 && d[p - w] + 1 < d[p]) d[p] = d[p - w] + 1;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const p = y * w + x;
      if (x < w - 1 && d[p + 1] + 1 < d[p]) d[p] = d[p + 1] + 1;
      if (y < h - 1 && d[p + w] + 1 < d[p]) d[p] = d[p + w] + 1;
    }
  }
  const out = new Uint8Array(mask.length);
  for (let p = 0; p < mask.length; p++) out[p] = d[p] <= r ? 1 : 0;
  return out;
}

/** The changed region (steps 2-3, before feathering): {mask, gain}. All arrays are raw RGB bytes of one size. */
function giPlateMask(Sb, Pb, w, h, opts = GI_RESTORE) {
  const o = { ...GI_RESTORE, ...opts };
  const gain = giPlateGain(Sb, Pb, o);
  let m = giPlateOpen(giPlateDiff(Sb, Pb, gain, o.thresh), w, h, o.open);
  m = giPlateKeepLarge(m, w, h, o.min_area * w * h);
  m = giPlateFillHoles(m, w, h);
  m = giPlateGrow(m, w, h, o.grow);
  return { mask: m, gain };
}

/** state x alpha + plate x (1 - alpha), rounded; alpha is gray bytes (0-255). */
function giPlateBlend(S, P, alpha) {
  const out = new Uint8Array(S.length);
  for (let p = 0, i = 0; p < alpha.length; p++, i += 3) {
    const a = alpha[p] / 255;
    for (let c = 0; c < 3; c++) out[i + c] = Math.min(255, Math.max(0, Math.round(S[i + c] * a + P[i + c] * (1 - a))));
  }
  return out;
}

async function giPlateSize(ctx, file) {
  if (Number.isInteger(file.width) && Number.isInteger(file.height) && file.width > 0 && file.height > 0) return { w: file.width, h: file.height };
  const info = await ctx.tools.probe(file.path);
  if (!(info.width > 0 && info.height > 0)) throw ctx.error('tool_failed', `no size for ${String(file.path).split('/').at(-1)}`);
  return { w: info.width, h: info.height };
}

/** Decodes a picture to raw RGB bytes. */
async function giPlateRgb(ctx, path, out) {
  await kitFfmpeg(ctx, ['-i', path, '-frames:v', '1', '-vf', 'format=rgb24', '-f', 'rawvideo', '-pix_fmt', 'rgb24', out]);
  return new Uint8Array(await readFile(out));
}

/** A plate's raw and blurred pixels, read once per shot: {w, h, P, Pb}. */
async function giPlatePixels(ctx, plate, tag) {
  const dir = ctx.tmpDir || ctx.workDir;
  const { w, h } = await giPlateSize(ctx, plate);
  const P = await giPlateRgb(ctx, plate.path, join(dir, `${tag}-plate.rgb`));
  if (P.length !== w * h * 3) throw ctx.error('tool_failed', `the plate decoded to ${P.length} bytes, not ${w}x${h} RGB`);
  return { w, h, P, Pb: giPlateBlur(P, w, h, 3, GI_RESTORE.blur) };
}

/**
 * Puts the plate's own pixels back in `state` (a FileRef) and writes the result
 * as ctx.workDir/`name`. `plate` is giPlatePixels' result. Returns
 * {file, kept, same} (kept = share of the frame taken from the edit, same =
 * share now identical to the plate), or null when the state's size is not the
 * plate's (it is then left as drawn).
 */
async function giPlateRestore(ctx, plate, state, name) {
  const dir = ctx.tmpDir || ctx.workDir;
  const { w, h } = await giPlateSize(ctx, state);
  if (w !== plate.w || h !== plate.h) return null;
  const base = name.replace(/\.png$/, '');
  const S = await giPlateRgb(ctx, state.path, join(dir, `${base}.rgb`));
  if (S.length !== w * h * 3) throw ctx.error('tool_failed', `${name} decoded to ${S.length} bytes, not ${w}x${h} RGB`);
  const { mask } = giPlateMask(giPlateBlur(S, w, h, 3, GI_RESTORE.blur), plate.Pb, w, h);
  const gray = new Uint8Array(mask.length);
  let kept = 0;
  for (let p = 0; p < mask.length; p++) {
    gray[p] = mask[p] ? 255 : 0;
    kept += mask[p];
  }
  const alpha = giPlateBlur(gray, w, h, 1, GI_RESTORE.feather);
  const out = giPlateBlend(S, plate.P, alpha);
  let same = 0;
  for (let i = 0; i < out.length; i += 3) {
    if (out[i] === plate.P[i] && out[i + 1] === plate.P[i + 1] && out[i + 2] === plate.P[i + 2]) same++;
  }
  const outRaw = join(dir, `${base}-out.rgb`);
  await writeFile(outRaw, out);
  await kitFfmpeg(ctx, ['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-video_size', `${w}x${h}`, '-i', outRaw, '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, name)]);
  return { file: await ctx.file(name, 'image'), kept: kept / mask.length, same: same / mask.length };
}

// ---- image-gpt-image-2/src/part.mjs ----
// image-gpt-image-2: photoreal stills from OpenAI GPT Image 2 on fal, one paid
// piece per image. Built for realistic people (an AI creator, a spokesperson):
// openai/gpt-image-2 draws from the prompt alone, openai/gpt-image-2/edit draws
// with reference pictures (a cast anchor, a product photo). Every piece sends
// image_size {width, height} from `size` (the text model's own default is
// landscape) and `quality`. A result whose bytes are not PNG is re-encoded.
//
// Four modes:
//   images  a hand-built list [{id, prompt, references}];
//   scenes  one still per picked plan scene, its prompt filled from the style's
//           template and its references picked from the plan (_lib/scene-stills.mjs,
//           shared with image-nano-banana 1.1.0);
//   cast    only the cast portraits ("anchors"): a member with an image passes
//           through free, a member without one is drawn from its look;
//   shots   (1.1.0) locked-camera shots: scenes are grouped by extra.group; a
//           group's first scene is its plate, every later scene is an edit on
//           [plate, previous frame, product photos], then the plate's own
//           pixels are put back wherever a frame did not change (restore,
//           src/plate.mjs). A scene with extra.repeat_of reuses an earlier
//           scene's finished frame, free.

const EDIT = 'openai/gpt-image-2/edit';
const TEXT = 'openai/gpt-image-2';
const GI_PROMPT_MAX = 32000;
const GI_STRIP_NOTE_MAX = 600;
const GI_AT_ONCE = 4;
const GI_DEFAULT_SIZE = '1088x1920';
const GI_DEFAULT_QUALITY = 'high';
const GI_SCENE_ONLY = ['scenes', 'products', 'pick', 'skip_first', 'skip_last', 'anchor', 'multi_ref', 'restore'];
const GI_NOT_IN_SHOTS = ['images', 'cast', 'cast_size', 'anchor', 'multi_ref'];
const GI_MAX_REFS = 10;
const GI_NOT_IN_IMAGES = [...GI_SCENE_ONLY, 'template', 'look', 'answers', 'brand', 'cast', 'cast_size', 'style_refs'];
/** The anchor text when the style's template has none: a plain photo of a real person, nothing that bakes into every scene. */
const GI_DEFAULT_ANCHOR = 'A real photo of one person: {look}. Chest up, looking into the lens, in front of a plain light wall, soft even daylight, hands empty, natural skin texture, shot on a phone, no text, no props';

async function giIsPng(path) {
  const head = (await readFile(path)).subarray(0, 8);
  return head.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

/** '1088x1920' -> {width: 1088, height: 1920}, the image_size fal takes. */
function giSize(size) {
  const [width, height] = String(size).split('x').map(Number);
  return { width, height };
}

/** One paid still: `refs` go to /edit; without refs the prompt-only model draws it. */
async function giDraw(ctx, { piece, refs, prompt, size, quality }) {
  kitStopIfAborted(ctx);
  const model = refs && refs.length ? EDIT : TEXT;
  const body = { prompt, image_size: giSize(size), quality, num_images: 1, output_format: 'png' };
  if (model === EDIT) body.image_urls = refs;
  const result = await ctx.line.order({
    piece,
    provider: 'fal',
    path: model === EDIT ? EDIT : TEXT,
    body,
    results: [{ pointer: '/json/images/0/url', name: `${piece}-raw.png`, media: 'image' }],
  });
  const raw = result && result.files && result.files[`${piece}-raw.png`];
  if (!raw) throw ctx.error('provider_failed', `no image for ${piece}`);
  if (await giIsPng(raw.path)) return raw;
  await kitFfmpeg(ctx, ['-i', raw.path, '-frames:v', '1', join(ctx.workDir, `${piece}.png`)]);
  return ctx.file(`${piece}.png`, 'image');
}

/** Runs `work` over `items`, a few at a time, keeping their order. */
async function giEach(items, work) {
  const out = new Array(items.length);
  let next = 0;
  let failed = false;
  const lanes = Array.from({ length: Math.min(GI_AT_ONCE, items.length) }, async () => {
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

/** The step's template with the photo-portrait anchor text when it has none. */
async function giTemplate(inputs) {
  const tpl = inputs.template ? await kitLoadTemplate(inputs.template) : null;
  const base = tpl && typeof tpl === 'object' ? tpl : { version: 1 };
  return kitStillTemplate(typeof base.anchor === 'string' ? base : { ...base, anchor: GI_DEFAULT_ANCHOR });
}

function giCheckCast(ctx, cast) {
  const keys = new Set();
  for (const m of cast) {
    if (keys.has(m.key)) throw ctx.error('bad_input', `two cast members have the key ${m.key}`);
    keys.add(m.key);
  }
}

function giRefuseGap(ctx, err) {
  if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
  throw ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
}

function giCheckLength(ctx, texts) {
  for (const text of texts) {
    if (text.length > GI_PROMPT_MAX - GI_STRIP_NOTE_MAX) throw ctx.error('bad_input', `a prompt is over ${GI_PROMPT_MAX - GI_STRIP_NOTE_MAX} characters`);
  }
}

function giRefuseOutside(ctx, inputs, keys, mode) {
  for (const key of keys) {
    if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} does not work in ${mode} mode`);
  }
}

async function giImages(inputs, ctx, manifest, opts) {
  const model = opts.model;
  if (!inputs.images) throw ctx.error('bad_input', 'images mode needs images (or give scenes for scenes mode, or cast for cast mode)');
  giRefuseOutside(ctx, inputs, GI_NOT_IN_IMAGES, 'images');
  for (const [i, img] of inputs.images.entries()) {
    if (model === TEXT && (img.references || []).length) throw ctx.error('bad_input', `images[${i}] has reference images; use ${EDIT}`);
  }
  giCheckLength(ctx, inputs.images.map((img) => img.prompt));
  const used = new Set();
  const images = [];
  for (const [i, img] of inputs.images.entries()) {
    const piece = kitPieceName('image', img.id, i, used);
    const file = await giDraw(ctx, { piece, refs: img.references || [], prompt: img.prompt, size: opts.size, quality: opts.quality });
    images.push({ id: String(img.id ?? i + 1), image: file });
    ctx.progress({ done: i + 1, total: inputs.images.length });
  }
  return kitCheckOutputs(ctx, manifest, { images });
}

async function giCast(inputs, ctx, manifest, opts) {
  if (inputs.images) throw ctx.error('bad_input', 'cast mode draws only the cast: give cast or images, not both');
  giRefuseOutside(ctx, inputs, GI_SCENE_ONLY, 'cast');
  const cast = inputs.cast || [];
  if (!cast.length) throw ctx.error('bad_input', 'cast mode needs cast');
  giCheckCast(ctx, cast);
  const styleRefs = inputs.style_refs || [];
  if (opts.model === TEXT && styleRefs.length) throw ctx.error('bad_input', `style_refs need ${EDIT}, which takes reference images`);

  // Every prompt is filled before the first piece is ordered.
  const ctxValues = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null };
  const jobs = [];
  try {
    const tpl = await giTemplate(inputs);
    for (const m of cast) if (!m.image) jobs.push({ member: m, prompt: kitStillAnchorPrompt(tpl, m, ctxValues) });
  } catch (err) {
    giRefuseGap(ctx, err);
  }
  giCheckLength(ctx, jobs.map((j) => j.prompt));
  const used = new Set();
  for (const j of jobs) j.piece = kitPieceName('anchor', j.member.key, cast.indexOf(j.member), used);
  if (!jobs.length) ctx.log.info('every cast member has a picture, so nothing is drawn');

  const anchors = new Map();
  for (const m of cast) if (m.image) anchors.set(m.key, m.image);
  let done = 0;
  await giEach(jobs, async (j) => {
    anchors.set(j.member.key, await giDraw(ctx, { piece: j.piece, refs: styleRefs, prompt: j.prompt, size: opts.cast_size, quality: opts.quality }));
    ctx.progress({ done: ++done, total: jobs.length });
  });
  const outCast = cast.map((m) => (anchors.has(m.key) ? { ...m, image: anchors.get(m.key) } : { ...m }));
  const outAnchors = cast.filter((m) => anchors.has(m.key)).map((m) => ({ id: m.key, image: anchors.get(m.key) }));
  return kitCheckOutputs(ctx, manifest, { images: [], cast: outCast, anchors: outAnchors });
}

async function giScenes(inputs, ctx, manifest, opts) {
  const model = opts.model;
  const anchor = inputs.anchor || 'none';
  if (inputs.images) throw ctx.error('bad_input', 'scenes mode makes its own images: give scenes or images, not both');
  if (!inputs.scenes) throw ctx.error('bad_input', 'scenes mode needs scenes');
  if (inputs.restore !== undefined) throw ctx.error('bad_input', 'restore works only in shots mode');
  if (model === TEXT && anchor !== 'none') throw ctx.error('bad_input', `anchor ${anchor} needs ${EDIT}, which takes reference images`);
  if (model === TEXT && inputs.style_refs && inputs.style_refs.length) throw ctx.error('bad_input', `style_refs need ${EDIT}, which takes reference images`);
  const cast = inputs.cast || [];
  giCheckCast(ctx, cast);

  // Everything that can refuse happens before the first piece is ordered.
  let jobs;
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null };
  const anchorJobs = [];
  try {
    const tpl = await giTemplate(inputs);
    jobs = kitStillJobs(tpl, inputs.scenes, { ...base, pick: inputs.pick, skip_first: inputs.skip_first, skip_last: inputs.skip_last, cast, products: inputs.products || [], multi_ref: inputs.multi_ref });
    if (model === EDIT && anchor === 'cast') {
      for (const m of kitStillAnchorMembers(jobs)) if (!m.image) anchorJobs.push({ member: m, prompt: kitStillAnchorPrompt(tpl, m, base) });
    }
  } catch (err) {
    giRefuseGap(ctx, err);
  }
  if (!jobs.length) throw ctx.error('bad_input', 'no scene is picked for a still');
  giCheckLength(ctx, [...jobs.map((j) => kitStillPrompt(j, {})), ...anchorJobs.map((a) => a.prompt)]);

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
  await giEach(anchorJobs, async (a) => {
    anchors.set(a.member.key, await giDraw(ctx, { piece: a.piece, refs: styleRefs, prompt: a.prompt, size: opts.cast_size, quality: opts.quality }));
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
    let refs = { files: [], strip_at: null, names: null };
    if (model === EDIT) {
      const castFiles = kitStillCastFiles(job, anchors);
      const castRefs = kitStillWantsStrip(job, castFiles) ? [await stripFor(castFiles)] : castFiles.slice(0, 3);
      refs = kitStillRefs(job, { cast: castRefs, first, style_refs: styleRefs });
    }
    stills.set(job.id, await giDraw(ctx, { piece: job.piece, refs: refs.files, prompt: kitStillPrompt(job, refs), size: opts.size, quality: opts.quality }));
    tick();
  };
  let rest = jobs;
  let first = null;
  if (anchor === 'first_scene') {
    await drawJob(jobs[0], null);
    first = stills.get(jobs[0].id);
    rest = jobs.slice(1);
  }
  await giEach(rest, (job) => drawJob(job, first));

  const out = kitStillOutputs({ scenes: inputs.scenes, cast, jobs, stills, anchors });
  // All four outputs every time (empty lists without a cast), so a style can bind step.<id>.cast or .anchors.
  return kitCheckOutputs(ctx, manifest, { images: out.images, scenes: out.scenes, cast: out.cast, anchors: out.anchors });
}

function giExtra(scene, key) {
  const extra = scene && scene.extra;
  return extra && typeof extra === 'object' ? extra[key] : undefined;
}

function giSceneId(scene, index) {
  return scene && scene.id != null && scene.id !== '' ? String(scene.id) : `#${index + 1}`;
}

/**
 * Groups the picked scenes into shots, before anything is ordered. Returns
 * {groups: [{name, entries}], repeats: Map(scene id -> drawn scene id)}; an
 * entry is {id, index, scene}. A scene with extra.repeat_of is drawn by no
 * shot: it names an earlier picked scene, whose finished frame it reuses. A
 * scene with no extra.group is a shot of its own, named by its id.
 */
function giShotPlan(ctx, picked) {
  const at = new Map();
  for (const [k, { scene, index }] of picked.entries()) {
    const id = giSceneId(scene, index);
    if (at.has(id)) throw ctx.error('bad_input', `two scenes have the id ${id}`);
    at.set(id, k);
  }
  const groups = new Map();
  const repeats = new Map();
  const loose = new Set();
  for (const [k, { scene, index }] of picked.entries()) {
    const id = giSceneId(scene, index);
    const of = giExtra(scene, 'repeat_of');
    if (of != null && of !== '') {
      if (typeof of !== 'string') throw ctx.error('bad_input', `scene ${id}: extra.repeat_of must be a scene id`);
      if (!at.has(of)) throw ctx.error('bad_input', `scene ${id} repeats ${of}, which is not a picked scene`);
      if (at.get(of) >= k) throw ctx.error('bad_input', `scene ${id} repeats ${of}, which does not come before it`);
      repeats.set(id, repeats.get(of) || of);
      continue;
    }
    const group = giExtra(scene, 'group');
    if (group != null && typeof group !== 'string') throw ctx.error('bad_input', `scene ${id}: extra.group must be text`);
    const name = typeof group === 'string' && group.trim() ? group.trim() : null;
    if (!name) loose.add(id);
    const key = name ? `g:${name}` : `s:${id}`;
    if (!groups.has(key)) groups.set(key, { name: name || id, entries: [] });
    groups.get(key).entries.push({ id, index, scene });
  }
  for (const id of loose) {
    if (groups.has(`g:${id}`)) throw ctx.error('bad_input', `scene ${id} has no group, and a group is also called ${id}`);
  }
  return { groups: [...groups.values()], repeats };
}

/** "1", "2 and 3", "3, 4 and 5": reference numbers in words. */
function giNumbers(list) {
  return list.length < 2 ? String(list[0]) : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
}

/** What each reference of a shots piece is, said in the prompt. */
function giShotNote(roles) {
  const at = (role) => roles.map((r, i) => (r === role ? i + 1 : 0)).filter(Boolean);
  const out = [];
  const say = (role, one, many) => {
    const n = at(role);
    if (n.length) out.push(`${n.length > 1 ? 'Reference images' : 'Reference image'} ${giNumbers(n)} ${n.length > 1 ? many : one}`);
  };
  say('plate', "is this shot's first picture, from a locked camera: keep its camera, framing, surface and light exactly", '');
  say('previous', 'is the picture just before this one: everything in it stays exactly where it is unless this text changes it', '');
  say('product', 'shows the product: keep it exactly as in the photo, mark and colour unchanged', 'show the product: keep it exactly as in the photos, mark and colour unchanged');
  say('scene_image', "is this scene's own picture", "are this scene's own pictures");
  say('style', 'shows the style only', 'show the style only');
  return out.join('. ');
}

/**
 * One shots piece's references, at most 10: the plate and the previous frame
 * always fit, style_refs next, then product photos and the scene's own picture
 * as room allows. Returns {files, roles}.
 */
function giShotRefs({ plate = null, previous = null, products = [], scene_image = null, style_refs = [] }) {
  const lead = [];
  if (plate) lead.push([plate, 'plate']);
  if (previous) lead.push([previous, 'previous']);
  const tail = style_refs.map((f) => [f, 'style']);
  const middle = [...products.map((f) => [f, 'product']), ...(scene_image ? [[scene_image, 'scene_image']] : [])];
  const room = Math.max(0, GI_MAX_REFS - lead.length - tail.length);
  const all = [...lead, ...middle.slice(0, room), ...tail].slice(0, GI_MAX_REFS);
  return { files: all.map(([f]) => f), roles: all.map(([, r]) => r) };
}

function giIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

async function giShots(inputs, ctx, manifest, opts) {
  if (!inputs.scenes) throw ctx.error('bad_input', 'shots mode needs scenes');
  for (const key of GI_NOT_IN_SHOTS) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} does not work in shots mode`);
  if (opts.model === TEXT) throw ctx.error('bad_input', `shots mode edits every frame on its plate, so it needs ${EDIT}`);
  const restore = inputs.restore !== false;
  const products = inputs.products || [];
  const styleRefs = inputs.style_refs || [];

  // Everything that can refuse happens before the first piece is ordered.
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null, cast: [], products };
  let picked;
  let tpl;
  try {
    tpl = await giTemplate(inputs);
    picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
  } catch (err) {
    giRefuseGap(ctx, err);
  }
  if (!picked.length) throw ctx.error('bad_input', 'no scene is picked for a still');
  const { groups, repeats } = giShotPlan(ctx, picked);
  const named = (key) => Boolean(tpl.templates && typeof tpl.templates[key] === 'string');
  const used = new Set();
  try {
    for (const g of groups) {
      for (const [k, e] of g.entries.entries()) {
        const role = k === 0 ? 'plate' : 'state';
        const filled = kitScenePrompt(tpl, { ...base, scene: e.scene, index: e.index }, { use: named(role) ? role : 'scene' });
        let photos = filled.refs.products;
        // A plate is the empty place: it sends a product photo only when its own words name the product.
        if (role === 'plate') photos = photos.filter((p) => kitNamedProducts(e.scene, products).includes(p));
        e.prompt = filled.prompt;
        e.negative = filled.negative;
        e.photos = photos.map((p) => p.images[0]).filter(giIsFile);
        e.scene_image = giIsFile(filled.refs.scene_image) ? filled.refs.scene_image : null;
      }
    }
  } catch (err) {
    giRefuseGap(ctx, err);
  }
  const drawn = groups.flatMap((g) => g.entries);
  giCheckLength(ctx, drawn.map((e) => kitPromptJoin([e.prompt, e.negative ? `Avoid: ${e.negative}` : ''])));
  for (const e of drawn) e.piece = kitPieceName('image', e.id, e.index, used);

  // Shots run side by side (up to 4); the frames of one shot are made in order,
  // each on the plate and the frame before it (as drawn, before restore).
  const finals = new Map();
  const plates = [];
  let done = 0;
  let halted = false;
  const drawShot = async (g) => {
    const raws = [];
    for (const [k, e] of g.entries.entries()) {
      if (halted) return;
      const refs = k === 0
        ? giShotRefs({ products: e.photos, scene_image: e.scene_image, style_refs: styleRefs })
        : giShotRefs({ plate: raws[0], previous: k > 1 ? raws[k - 1] : null, products: e.photos, scene_image: e.scene_image, style_refs: styleRefs });
      const prompt = kitPromptJoin([e.prompt, refs.files.length ? giShotNote(refs.roles) : '', e.negative ? `Avoid: ${e.negative}` : '']);
      raws.push(await giDraw(ctx, { piece: e.piece, refs: refs.files, prompt, size: opts.size, quality: opts.quality }));
      ctx.progress({ done: ++done, total: drawn.length });
    }
    finals.set(g.entries[0].id, raws[0]);
    plates.push({ group: g.name, image: raws[0] });
    if (!restore || g.entries.length < 2) {
      for (const [k, e] of g.entries.entries()) finals.set(e.id, raws[k]);
      return;
    }
    const pixels = await giPlatePixels(ctx, raws[0], g.entries[0].piece);
    for (const [k, e] of g.entries.entries()) {
      if (k === 0) continue;
      const fixed = await giPlateRestore(ctx, pixels, raws[k], `${e.piece}-restored.png`);
      if (!fixed) {
        ctx.log.warn(`scene ${e.id} is not the size of its plate, so it is left as drawn`);
        finals.set(e.id, raws[k]);
        continue;
      }
      ctx.log.info(`scene ${e.id}: ${(fixed.kept * 100).toFixed(1)}% kept from the edit, ${(fixed.same * 100).toFixed(1)}% is the plate's own pixels`);
      finals.set(e.id, fixed.file);
    }
  };
  await giEach(groups, async (g) => {
    try {
      await drawShot(g);
    } catch (err) {
      halted = true;
      throw err;
    }
  });
  for (const [id, of] of repeats) finals.set(id, finals.get(of));

  const order = new Map(groups.map((g, i) => [g.name, i]));
  plates.sort((a, b) => order.get(a.group) - order.get(b.group));
  const pickedAt = new Map(picked.map(({ scene, index }) => [index, giSceneId(scene, index)]));
  const images = picked.map(({ scene, index }) => giSceneId(scene, index)).filter((id) => finals.has(id)).map((id) => ({ id, image: finals.get(id) }));
  const scenes = inputs.scenes.map((s, i) => (pickedAt.has(i) && finals.has(pickedAt.get(i)) ? { ...s, image: finals.get(pickedAt.get(i)) } : { ...s }));
  return kitCheckOutputs(ctx, manifest, { images, plates, scenes });
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const mode = inputs.mode || (inputs.scenes ? 'scenes' : inputs.images ? 'images' : inputs.cast ? 'cast' : 'images');
  const size = inputs.size || GI_DEFAULT_SIZE;
  const opts = { model: inputs.model || EDIT, size, cast_size: inputs.cast_size || size, quality: inputs.quality || GI_DEFAULT_QUALITY };
  if (mode === 'shots') return giShots(inputs, ctx, manifest, opts);
  if (mode === 'scenes') return giScenes(inputs, ctx, manifest, opts);
  if (mode === 'cast') return giCast(inputs, ctx, manifest, opts);
  return giImages(inputs, ctx, manifest, opts);
}
