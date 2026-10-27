// Built from assemble/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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
// Absolute on any system the kit runs on: /x on Linux and macOS, C:\x or C:/x on Windows.
// Requiring a leading '/' refused every real path on Windows.
const kitSchemaAbsolute = /^(?:\/|[A-Za-z]:[\\/])/;

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
  if (typeof value.path !== 'string' || !kitSchemaAbsolute.test(value.path)) errors.push(`${at}.path: expected an absolute path`);
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

// ---- _lib/length.mjs ----
// The length of a customer's media file, for parts that take one as it was uploaded. A streaming WebM or
// Matroska file (a browser or screen recording) plays but has no container duration, so the core's probe
// gives none: this falls back to the streams' own durations or DURATION tags, then the last packet's end.

// What ffprobe says at error level about a cut-off or damaged file. It still exits 0 and reports what it
// read, so a half-uploaded recording would otherwise measure as a complete, shorter one.
const kitDamaged = /ended prematurely|invalid data|truncat|corrupt|EBML|moov atom not found|error reading|end of file/i;

async function kitProbeClean(ctx, file, args) {
  const { stdout, stderr } = await ctx.tools.exec('ffprobe', ['-v', 'error', ...args, file.path]);
  const damage = String(stderr || '').split('\n').find((line) => kitDamaged.test(line));
  if (damage) throw ctx.error('bad_input', `the media file is damaged or incomplete (${damage.replace(/^\[[^\]]*\]\s*/, '').trim().slice(0, 120)})`);
  return stdout;
}

function kitClockSeconds(tag) {
  const m = /^(\d+):(\d{2}):(\d{2}(?:\.\d+)?)$/.exec(String(tag || '').trim());
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : NaN;
}

/**
 * Media length in seconds: kitDuration, else the streams' durations or tags, else the last packet's end.
 * A file ffprobe reports as cut off or damaged is refused (bad_input), never measured short.
 */
async function kitMediaLength(ctx, file) {
  try {
    return await kitDuration(ctx, file);
  } catch (e) {
    if (e.code !== 'tool_failed') throw e;
  }
  const streams = JSON.parse(await kitProbeClean(ctx, file, ['-print_format', 'json', '-show_entries', 'stream=duration:stream_tags=DURATION'])).streams || [];
  const declared = streams.map((s) => Math.max(Number(s.duration) || 0, kitClockSeconds(s.tags && (s.tags.DURATION || s.tags.duration)) || 0));
  if (Math.max(0, ...declared) > 0) return Math.max(...declared);
  const packets = await kitProbeClean(ctx, file, ['-show_entries', 'packet=pts_time,duration_time', '-of', 'csv=p=0']);
  let end = 0;
  for (const line of packets.split('\n')) {
    const [pts, d] = line.split(',').map(Number);
    if (Number.isFinite(pts)) end = Math.max(end, pts + (Number.isFinite(d) ? d : 0));
  }
  if (!(end > 0)) throw ctx.error('tool_failed', `no length for ${file.path}`);
  return end;
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

// ---- assemble/src/cuts.mjs ----
// assemble's pure helpers: where each cut starts and ends when the cut follows a voice or song
// (spans), how a safe zone moves when a picture is scaled onto the cut, the grade presets and the
// final-encode size rule. No ffmpeg here, so the tests can check the arithmetic directly.
// Every top-level name starts with `assemble` (bundled modules share one namespace).

/** The largest finished cut the part hands on: the line refuses uploads over 200 MB. */
const ASSEMBLE_MAX_BYTES = 180 * 1024 * 1024;

/** The shortest picture a voiced scene keeps when silent scenes take fixed time from it. */
const ASSEMBLE_MIN_VOICED_S = 0.4;

const assembleGrainGrades = new Set(['phone-grain', 'phonecam']);

/**
 * The bitrate cap for the final encode (GOOSE-4015 size rule): grain looks 8 Mbps, everything else
 * 16 Mbps. CRF 18 on temporal grain runs near 50 Mbps, which passes the upload limit in 30 s.
 */
function assembleRateCap(grade) {
  return assembleGrainGrades.has(grade) ? ['-maxrate', '8M', '-bufsize', '16M'] : ['-maxrate', '16M', '-bufsize', '32M'];
}

/**
 * The filter chain a grade adds to each body cut (never to the end card), or '' for none.
 * phone-grain: a slight contrast lift, a little less colour, light denoise, then fine moving grain.
 * phonecam: down to a 720 short side, moving grain, back up: a phone camera's softness.
 */
function assembleGradeChain(grade, w, h) {
  if (grade === 'phone-grain') return 'eq=contrast=1.06:saturation=0.93,hqdn3d=1.5:1.5:3:3,noise=alls=9:allf=t+u';
  if (grade === 'phonecam') {
    const short = Math.min(w, h);
    if (short <= 720) return 'noise=alls=8:allf=t';
    const k = 720 / short;
    const even = (v) => Math.max(2, Math.round((v * k) / 2) * 2);
    return `scale=${even(w)}:${even(h)}:flags=bicubic,noise=alls=8:allf=t,scale=${w}:${h}:flags=bicubic,setsar=1`;
  }
  return '';
}

/** Scales a picture to w x h: cover crops to fill, contain pads with `background`. Square pixels. */
function assembleFit(w, h, fit, background) {
  const square = "scale='trunc(iw*sar/2)*2':'trunc(ih/2)*2'";
  if (fit === 'contain') {
    return `${square},scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=${background},setsar=1`;
  }
  return `${square},scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1`;
}

/**
 * A still with a slow centred push from 1.0 to `to` over its `frames`: fitted at twice the size first,
 * so the zoom never resamples the edges and the steps stay under half a pixel.
 */
function assembleKenBurns(w, h, fps, frames, to, fit, background) {
  const last = Math.max(1, frames - 1);
  const step = (to - 1) / last;
  const z = `'min(1+${step.toFixed(8)}*on,${to})'`;
  return `fps=${fps},${assembleFit(w * 2, h * 2, fit, background)},zoompan=z=${z}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${w}x${h}:fps=${fps},setsar=1`;
}

/**
 * A safe zone drawn on a sw x sh picture, moved onto the w x h cut the way `fit` scales it (centred).
 * Null when less than 4 px of it is left on the cut.
 */
function assembleMapZone(zone, sw, sh, w, h, fit) {
  if (!zone || !(sw > 0 && sh > 0)) return null;
  const k = fit === 'contain' ? Math.min(w / sw, h / sh) : Math.max(w / sw, h / sh);
  const [ox, oy] = [(sw * k - w) / 2, (sh * k - h) / 2];
  const x0 = Math.max(0, Math.floor(zone.x * k - ox));
  const y0 = Math.max(0, Math.floor(zone.y * k - oy));
  const x1 = Math.min(w, Math.ceil((zone.x + zone.w) * k - ox));
  const y1 = Math.min(h, Math.ceil((zone.y + zone.h) * k - oy));
  return x1 - x0 >= 4 && y1 - y0 >= 4 ? { use: zone.use, x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

/**
 * 1.3.0: a box on a sw x sh still (shares of the picture) as it shows on the w x h cut: moved the way `fit`
 * places the still, then grown to cover where a centred push from 1 to `zoomTo` carries it, clamped to the
 * frame. Null when less than 4 px of it is on the cut.
 */
function assembleMapKeepClear(box, sw, sh, w, h, fit, zoomTo) {
  const z = assembleMapZone({ use: 'product', x: box.x * sw, y: box.y * sh, w: box.w * sw, h: box.h * sh }, sw, sh, w, h, fit);
  if (!z) return null;
  const k = Math.max(1, zoomTo || 1);
  const at = (v, c) => c + (v - c) * k;
  const x0 = Math.max(0, Math.min(z.x, at(z.x, w / 2)));
  const y0 = Math.max(0, Math.min(z.y, at(z.y, h / 2)));
  const x1 = Math.min(w, Math.max(z.x + z.w, at(z.x + z.w, w / 2)));
  const y1 = Math.min(h, Math.max(z.y + z.h, at(z.y + z.h, h / 2)));
  return { x: Math.floor(x0), y: Math.floor(y0), w: Math.ceil(x1) - Math.floor(x0), h: Math.ceil(y1) - Math.floor(y0) };
}

/** Speech entries and words that start before `total`, with ends held to it. */
function assembleClampSpeech(speech, total) {
  const end = (v) => Math.min(v, total);
  return (speech || [])
    .filter((s) => s.start_s < total)
    .map((s) => {
      const out = { ...s, end_s: end(s.end_s) };
      if (Array.isArray(s.words)) out.words = s.words.filter((wd) => wd.start_s < total).map((wd) => ({ ...wd, end_s: end(wd.end_s) }));
      return out;
    });
}

/** Scenes that start before `total`, with ends held to it. */
function assembleClampScenes(scenes, total) {
  return (scenes || []).filter((s) => s.start_s < total).map((s) => ({ ...s, end_s: Math.min(s.end_s, total) }));
}

class AssembleCutProblem extends Error {}

/** True when `e` is a refusal from assembleSpanCuts (the part turns it into bad_input). */
function assembleIsCutProblem(e) {
  return e instanceof AssembleCutProblem;
}

function assembleNo(message) {
  return new AssembleCutProblem(message);
}

/**
 * Where every cut goes when the pictures follow a voice or a song.
 *
 * - A clip whose id has a span starts on the frame at or before its span's start (so a cut never lands
 *   inside the line's first word) and runs to the next voiced clip's start. The first starts at 0; the last
 *   runs to its span's end plus `tail_s`.
 * - A clip with no span (a scene with no line) is silent. `share_previous` splits the voiced clip's
 *   time evenly with the silent clips after it (silent clips before the first voiced one share with it);
 *   `fixed` gives each silent clip `seconds`, taken from the voiced clip it shares with.
 * - `card.fills = 'last_span'`: the end card takes the last span's place, from its start to its end plus
 *   `tail_s`, and never shorter than the card itself. A clip with the card's id is not used.
 *   `'after'`: the card follows the last cut.
 *
 * @param {Array<{id?: string}>} clips  in plan order
 * @param {Array<{id: string, start_s: number, end_s: number}>} spans
 * `until_s` (optional) holds the last cut to at least that time (a dropped card span's end plus tail).
 *
 * @param {{fps: number, tail_s: number, silent: {mode: string, seconds?: number}, card: null | {fills: string, frames: number}, until_s?: number}} options
 * @returns {{cuts: Array<{index: number, id: string, start_f: number, frames: number, voiced: boolean}>,
 *            card: null | {id: string | null, start_f: number, frames: number}, total_f: number}}
 */
function assembleSpanCuts(clips, spans, { fps, tail_s, silent, card, until_s }) {
  const at = (s) => Math.floor(s * fps + 1e-6);
  const byId = new Map();
  for (const s of spans) {
    if (byId.has(s.id)) throw assembleNo(`spans name scene "${s.id}" twice`);
    if (s.end_s < s.start_s) throw assembleNo(`span "${s.id}" ends before it starts`);
    byId.set(s.id, s);
  }
  const seen = new Set();
  clips.forEach((c, k) => {
    if (typeof c.id !== 'string' || !c.id) throw assembleNo(`clips[${k}] needs an id to be matched to a span`);
    if (seen.has(c.id)) throw assembleNo(`two clips have the id "${c.id}"`);
    seen.add(c.id);
  });

  // The end card's span: the latest span, when the card fills it.
  let cardSpan = null;
  if (card && card.fills === 'last_span') {
    cardSpan = spans.reduce((a, b) => (b.start_s > a.start_s ? b : a));
    const k = clips.findIndex((c) => c.id === cardSpan.id);
    if (k >= 0 && k < clips.length - 1) {
      throw assembleNo(`scene "${cardSpan.id}" is the end card's (the last span), but clips come after it`);
    }
  }
  const body = clips.map((c, index) => ({ index, id: c.id, span: byId.get(c.id) })).filter((c) => !cardSpan || c.id !== cardSpan.id);
  const voiced = body.filter((c) => c.span);
  if (!voiced.length) throw assembleNo('no clip matches a span: the clip ids must be the scene ids the spans name');
  for (const s of spans) {
    if (s === cardSpan) continue;
    if (!body.some((c) => c.id === s.id)) throw assembleNo(`span "${s.id}" has no clip`);
  }
  for (let i = 1; i < voiced.length; i++) {
    if (at(voiced[i].span.start_s) <= at(voiced[i - 1].span.start_s)) {
      throw assembleNo(`scene "${voiced[i].id}" starts at or before scene "${voiced[i - 1].id}": the clips must be in the spans' order and at least a frame apart`);
    }
  }
  const lastVoiced = voiced[voiced.length - 1];
  let bodyEnd;
  if (cardSpan) {
    bodyEnd = at(cardSpan.start_s);
    if (bodyEnd <= at(lastVoiced.span.start_s)) throw assembleNo(`the end card's scene "${cardSpan.id}" starts before scene "${lastVoiced.id}"`);
  } else {
    bodyEnd = Math.round((Math.max(lastVoiced.span.end_s + tail_s, until_s || 0)) * fps);
    if (bodyEnd <= at(lastVoiced.span.start_s)) bodyEnd = at(lastVoiced.span.start_s) + 1;
  }

  // Groups: one voiced clip with the silent clips after it; silent clips before the first voiced one join it.
  const groups = [];
  const lead = [];
  for (const c of body) {
    if (c.span) groups.push({ voiced: c, members: groups.length ? [c] : [...lead, c] });
    else if (groups.length) groups[groups.length - 1].members.push(c);
    else lead.push(c);
  }
  const mode = (silent && silent.mode) || 'share_previous';
  const fixedFrames = Math.max(1, Math.round(((silent && silent.seconds) || 1) * fps));
  const cuts = [];
  groups.forEach((g, gi) => {
    const start = gi === 0 ? 0 : at(g.voiced.span.start_s);
    const end = gi + 1 < groups.length ? at(groups[gi + 1].voiced.span.start_s) : bodyEnd;
    const total = end - start;
    const n = g.members.length;
    let lengths;
    if (n === 1) lengths = [total];
    else if (mode === 'fixed') {
      const keep = total - fixedFrames * (n - 1);
      const floor = Math.round(ASSEMBLE_MIN_VOICED_S * fps);
      if (keep < floor) {
        throw assembleNo(`scene "${g.voiced.id}" would keep ${(keep / fps).toFixed(2)} s after ${n - 1} silent scene(s) take ${(fixedFrames / fps).toFixed(2)} s each; it needs at least ${ASSEMBLE_MIN_VOICED_S} s`);
      }
      lengths = g.members.map((m) => (m === g.voiced ? keep : fixedFrames));
    } else {
      if (total < n) throw assembleNo(`scene "${g.voiced.id}" is too short to share with ${n - 1} silent scene(s)`);
      const base = Math.floor(total / n);
      const extra = total - base * n;
      lengths = g.members.map((_, i) => base + (i < extra ? 1 : 0));
    }
    let f = start;
    g.members.forEach((m, i) => {
      cuts.push({ index: m.index, id: m.id, start_f: f, frames: lengths[i], voiced: m === g.voiced });
      f += lengths[i];
    });
  });

  let cardCut = null;
  if (card) {
    if (cardSpan) {
      const want = Math.round((cardSpan.end_s + tail_s) * fps) - bodyEnd;
      cardCut = { id: cardSpan.id, start_f: bodyEnd, frames: Math.max(want, card.frames) };
    } else cardCut = { id: null, start_f: bodyEnd, frames: card.frames };
  }
  return { cuts, card: cardCut, total_f: bodyEnd + (cardCut ? cardCut.frames : 0) };
}

// ---- assemble/src/shots.mjs ----
// assemble 1.2.0's pure helpers for shot recipes: which recipe a scene uses (by its tag), how a
// scene's time is split between its shots, where a cut moves to land between two words, how a
// montage's frames share its time, the zoom filter, and where the card span starts (card_from).
// No ffmpeg and no files here, so the tests check the arithmetic directly.
// Every top-level name starts with `assemble` (bundled modules share one namespace).

/** The shortest time the fill shot keeps when a scene's fixed shots are squeezed. */
const ASSEMBLE_MIN_FILL_S = 0.5;

/** The recipe key that catches scenes whose tag has no recipe of its own. */
const ASSEMBLE_ANY_TAG = '*';

/**
 * The shot recipe for a scene: the one whose key is the scene's tag (compared without case or
 * spacing: "Close up" = "close-up"), else the `*` recipe, else null.
 * @returns {null | {key: string, tag: string | null, shots: object[]}}
 */
function assembleRecipeFor(shots, scene) {
  const tag = kitSceneTag(scene);
  const want = tag ? kitTagKey(tag) : '';
  for (const [key, list] of Object.entries(shots || {})) {
    if (key !== ASSEMBLE_ANY_TAG && want && kitTagKey(key) === want) return { key, tag, shots: list };
  }
  if (shots && Array.isArray(shots[ASSEMBLE_ANY_TAG])) return { key: ASSEMBLE_ANY_TAG, tag, shots: shots[ASSEMBLE_ANY_TAG] };
  return null;
}

/**
 * How a scene's `frames` are split between its shots. Each spec is `{fixed: frames | null, fill}`.
 * The fill shot (the one with fill, else the last) takes what the others leave. When the fixed shots
 * leave the fill shot less than `min_fill` frames, they are all squeezed by the same factor; a scene
 * too short for one frame per shot is refused.
 * @returns {number[]} frames per shot, summing to `frames`
 */
function assembleShotLengths(specs, frames, { min_fill, scene_id }) {
  const fills = specs.map((s, i) => (s.fill ? i : -1)).filter((i) => i >= 0);
  if (fills.length > 1) throw assembleNo(`scene "${scene_id}": only one shot in a recipe can fill`);
  const fillAt = fills.length ? fills[0] : specs.length - 1;
  const fixed = specs.map((s, i) => {
    if (i === fillAt) return 0;
    if (!(s.fixed >= 1)) throw assembleNo(`scene "${scene_id}": shot ${i + 1} needs seconds (only the fill shot takes the rest)`);
    return s.fixed;
  });
  const sum = fixed.reduce((a, b) => a + b, 0);
  if (frames < specs.length) throw assembleNo(`scene "${scene_id}" is ${frames} frame(s), too short for ${specs.length} shots`);
  const keep = Math.min(min_fill, frames - (specs.length - 1));
  let lengths = fixed;
  if (frames - sum < keep) {
    const k = (frames - keep) / sum;
    lengths = fixed.map((f, i) => (i === fillAt ? 0 : Math.max(1, Math.floor(f * k))));
  }
  const used = lengths.reduce((a, b) => a + b, 0);
  lengths[fillAt] = frames - used;
  if (lengths[fillAt] < 1) throw assembleNo(`scene "${scene_id}" is too short for its shots`);
  return lengths;
}

/**
 * A montage of `n` frames in `total` frames, each joined to the next by a `t`-frame transition:
 * the frames' lengths (sum(lengths) - (n - 1) * t = total) and the transition actually used
 * (0 when the pieces are too short to overlap).
 */
function assembleMontageLengths(total, n, t) {
  let overlap = n > 1 ? Math.max(0, Math.round(t)) : 0;
  const share = (tt) => {
    const all = total + (n - 1) * tt;
    const base = Math.floor(all / n);
    const extra = all - base * n;
    return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
  };
  let lengths = share(overlap);
  if (overlap && lengths.some((l) => l <= overlap + 1)) {
    overlap = 0;
    lengths = share(0);
  }
  if (lengths.some((l) => l < 1)) throw assembleNo(`a montage of ${n} frames needs at least ${n} frames`);
  return { lengths, overlap };
}

/**
 * A clip shot's speed limits [slowest, fastest]. A missing limit is 1, unless the given one is on its
 * side of 1: min_speed 1.2 alone is [1.2, 1.2], max_speed 0.8 alone is [0.8, 0.8]. The caller refuses
 * slowest > fastest.
 */
function assembleSpeedBounds(spec) {
  const lo = spec.min_speed ?? Math.min(1, spec.max_speed ?? 1);
  const hi = spec.max_speed ?? Math.max(1, lo);
  return [lo, hi];
}

/** Every word of the speech, in time order: `{start_s, end_s}`. Entries without words are skipped. */
function assembleWords(speech) {
  const out = [];
  for (const s of speech || []) {
    for (const w of Array.isArray(s.words) ? s.words : []) {
      if (Number.isFinite(w.start_s) && Number.isFinite(w.end_s) && w.end_s > w.start_s) out.push({ start_s: w.start_s, end_s: w.end_s });
    }
  }
  return out.sort((a, b) => a.start_s - b.start_s);
}

/**
 * Cut points (frame numbers, in order, inside the body) moved out of words. A cut that lands inside a
 * word moves to the frame at or before the word starts, or at or after it ends, whichever is nearer,
 * when that is at most `max_shift_s` away and both shots either side keep `min_shot_s` (or what they
 * had, when they were shorter already). Otherwise it stays.
 * @returns {number[]} the cut points, same length and order
 */
function assembleSnapCuts(cuts, words, { fps, max_shift_s, min_shot_s, end_f }) {
  const maxShift = max_shift_s * fps + 1e-6;
  const minShot = Math.round(min_shot_s * fps);
  const out = [];
  for (let i = 0; i < cuts.length; i++) {
    const b = cuts[i];
    const prev = i ? out[i - 1] : 0;
    const next = i + 1 < cuts.length ? cuts[i + 1] : end_f;
    const t = b / fps;
    const word = words.find((w) => w.start_s * fps < b - 1e-6 && b < w.end_s * fps - 1e-6 && t > w.start_s && t < w.end_s);
    if (!word) {
      out.push(b);
      continue;
    }
    const needLeft = Math.min(minShot, b - prev);
    const needRight = Math.min(minShot, next - b);
    const options = [Math.floor(word.start_s * fps + 1e-6), Math.ceil(word.end_s * fps - 1e-6)]
      .filter((c) => c !== b && Math.abs(c - b) <= maxShift && c - prev >= Math.max(1, needLeft) && next - c >= Math.max(1, needRight))
      .sort((x, y) => Math.abs(x - b) - Math.abs(y - b) || x - y);
    out.push(options.length ? options[0] : b);
  }
  return out;
}

/**
 * A picture fitted at twice the size, then zoomed centred from `from` to `to` over `frames` output
 * frames. `per_input` 1 (a looped still, one output frame per input frame) or `frames` (one frame
 * held for the whole shot).
 */
function assembleZoom(w, h, fps, frames, from, to, fitChain, { per_input = 1 } = {}) {
  const last = Math.max(1, frames - 1);
  const step = Math.abs(to - from) / last;
  const z = from === to ? `'${from}'` : from < to ? `'min(${from}+${step.toFixed(8)}*on,${to})'` : `'max(${from}-${step.toFixed(8)}*on,${to})'`;
  return `${fitChain},zoompan=z=${z}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${per_input}:s=${w}x${h}:fps=${fps},setsar=1`;
}

/**
 * The scene a card span starts at: card_from {scene_id} names it; {tag} finds the first scene with
 * that tag. Null when a tag matches no scene (the plan has no such scene); a scene id that is not in
 * the plan is refused.
 */
function assembleCardScene(cardFrom, scenes) {
  if (!cardFrom) return null;
  const list = scenes || [];
  if (cardFrom.scene_id != null) {
    const id = String(cardFrom.scene_id);
    if (!list.some((s) => String(s.id) === id)) throw assembleNo(`card_from names scene "${id}", which is not in the plan`);
    return id;
  }
  const want = kitTagKey(cardFrom.tag);
  const hit = list.find((s) => kitTagKey(kitSceneTag(s)) === want);
  return hit ? String(hit.id) : null;
}

/**
 * The product a scene shows: the first one its picture names, else the first its line names, else the
 * product at the scene's place among the scenes with its tag (the plan's "one per product, in order").
 */
function assembleSceneProduct(scene, products, ordinal) {
  const list = Array.isArray(products) ? products : [];
  const named = kitNamedProducts(scene, list);
  if (named.length) return { product: named[0], how: 'picture' };
  if (scene && typeof scene.line === 'string') {
    const byLine = kitNamedProducts({ picture: scene.line }, list);
    if (byLine.length) return { product: byLine[0], how: 'line' };
  }
  if (ordinal >= 0 && ordinal < list.length) return { product: list[ordinal], how: 'order' };
  return null;
}

// ---- assemble/src/part.mjs ----
// assemble: joins scene clips and stills into one cut, in order. Today's
// stitch-videos-ffmpeg montage assembler: every cut is scaled to one size
// (cover crops to fill, contain pads), one frame rate, square pixels and
// yuv420p, held on its last frame when a hair short, cut to an exact frame
// count, and hard-cut through the concat filter (never the concat demuxer,
// which drops audio and adds black frames at joins). Captions and loudness
// are the layers' jobs, not this step's.
//
// 1.1.0 adds, all optional: pictures timed to a voice or song (spans, silent,
// tail_s), the voice's speech or a whole timeline passed through, an end card
// joined after the cut or over the last span, a slow push on stills, two grain
// looks, and the size rule: a bitrate cap on the final encode and a refusal
// of any cut over 180 MB.
//
// 1.2.0 adds, all optional: shot recipes per scene tag (shots + sources + scenes),
// marks where a shot asks for a sound, cuts moved into the gaps between words
// (snap), and card_from, which starts the card span (no captions) at a scene
// before the end card.
//
// 1.3.0 adds, optional: keep_clear on a still clip (where the product is, as
// shares of the picture), moved onto the cut through fit and the push and
// returned as timeline.keep_clear, so the captions layer keeps off it.

const SHORT_TOLERANCE_S = 0.1;

const t3 = (frames, fps) => +(frames / fps).toFixed(3);

/** The cuts as 1.0.2 makes them: each clip's own in_s and seconds, a still needing seconds. */
async function listedCuts(inputs, ctx, fps) {
  const cuts = [];
  let at = 0;
  for (const [k, clip] of inputs.clips.entries()) {
    const media = clip.video || clip.image;
    const start = clip.in_s ?? 0;
    let seconds;
    if (clip.image) {
      if (!clip.seconds) throw ctx.error('bad_input', `clips[${k}] is a still and needs seconds`);
      seconds = clip.seconds;
    } else {
      const length = await kitMediaLength(ctx, media);
      seconds = clip.seconds ?? length - start;
      if (start + seconds > length + SHORT_TOLERANCE_S) {
        throw ctx.error('bad_input', `clips[${k}] needs ${kitNum(start + seconds, 2)}s of a ${kitNum(length, 2)}s clip`);
      }
    }
    const frames = Math.round(seconds * fps);
    if (frames < 1) throw ctx.error('bad_input', `clips[${k}] is shorter than one frame`);
    cuts.push({ index: k, id: clip.id ?? String(k + 1), start_f: at, frames, hold_s: 0 });
    at += frames;
  }
  return { cuts, total_f: at };
}

/** Runs a pure planner, turning its refusals into bad_input. */
function planned(ctx, fn) {
  try {
    return fn();
  } catch (e) {
    if (assembleIsCutProblem(e)) throw ctx.error('bad_input', e.message);
    throw e;
  }
}

/**
 * With spans and an end card over the last span but no card drawn: the latest span is dropped when
 * nothing would show it (`hasPicture` says whether a clip or scene recipe covers it), and the cut
 * before it holds to its end.
 */
function dropUndrawnCard(ctx, spans, fills, ending, tail, hasPicture) {
  if (fills !== 'last_span' || ending) return { spans, until: 0 };
  const latest = spans.reduce((a, b) => (b.start_s > a.start_s ? b : a));
  if (hasPicture(latest.id)) return { spans, until: 0 };
  ctx.log.info('no end card: the last span is held by the cut before it', { scene: latest.id });
  return { spans: spans.filter((s) => s !== latest), until: latest.end_s + tail };
}

/** 1.1.0's pieces: one per clip, timed by spans or by each clip's own in_s and seconds. */
async function clipPieces(inputs, ctx, fps, { ending, endingFrames, fills, tail, kenBurns, zoomTo }) {
  for (const [k, clip] of inputs.clips.entries()) {
    if (!!clip.video === !!clip.image) throw ctx.error('bad_input', `clips[${k}] needs exactly one of video or image`);
  }
  let plan;
  if (inputs.spans) {
    const { spans, until } = dropUndrawnCard(ctx, inputs.spans, fills, ending, tail, (id) => inputs.clips.some((c) => c.id === id));
    plan = planned(ctx, () => assembleSpanCuts(inputs.clips, spans, { fps, tail_s: tail, silent: inputs.silent, card: ending ? { fills, frames: endingFrames } : null, until_s: until }));
  } else {
    plan = await listedCuts(inputs, ctx, fps);
    if (ending) plan.card = { id: null, start_f: plan.total_f, frames: endingFrames };
    if (ending) plan.total_f += endingFrames;
  }
  const pieces = [];
  for (const cut of plan.cuts) {
    const clip = inputs.clips[cut.index];
    const piece = { id: cut.id, scene_id: cut.id, start_f: cut.start_f, frames: cut.frames };
    if (clip.image) {
      Object.assign(piece, { kind: 'image', media: clip.image, zoom: kenBurns ? [1, zoomTo] : null, hold_s: 0 });
      if (clip.keep_clear && clip.keep_clear.length) piece.keep_clear = clip.keep_clear;
    } else {
      Object.assign(piece, { kind: 'video', media: clip.video, in_s: clip.in_s ?? 0, speed: 1, hold_s: 0 });
      if (inputs.spans) {
        // A clip shorter than its cut holds its last frame; one that starts past its own end is refused.
        const length = await kitMediaLength(ctx, clip.video);
        const avail = length - piece.in_s;
        if (avail <= 0) throw ctx.error('bad_input', `clips[${cut.index}] starts at ${kitNum(clip.in_s, 2)}s of a ${kitNum(length, 2)}s clip`);
        piece.hold_s = Math.max(0, cut.frames / fps - avail);
      }
    }
    pieces.push(piece);
  }
  return { pieces, card: plan.card || null, total_f: plan.total_f };
}

const isRef = (v) => v && typeof v === 'object' && !Array.isArray(v) && typeof v.path === 'string';

/** 1.2.0's pieces: each plan scene's slot (from spans) split into the shots its tag's recipe lists. */
async function shotPieces(inputs, ctx, fps, { ending, endingFrames, fills, tail, kenBurns, zoomTo }) {
  if (inputs.clips) throw ctx.error('bad_input', 'give clips or shots, not both');
  if (!inputs.scenes) throw ctx.error('bad_input', 'shots need scenes (plan.scenes): a scene\'s tag picks its recipe');
  if (!inputs.spans) throw ctx.error('bad_input', 'shots need spans: each scene\'s shots share its span');
  const scenes = inputs.scenes;
  const sources = inputs.sources || {};
  const products = inputs.products || [];
  const ids = new Set();
  for (const s of scenes) {
    if (ids.has(String(s.id))) throw ctx.error('bad_input', `two scenes have the id "${s.id}"`);
    ids.add(String(s.id));
  }
  const recipeOf = (scene) => assembleRecipeFor(inputs.shots, scene);
  const { spans, until } = dropUndrawnCard(ctx, inputs.spans, fills, ending, tail, (id) => {
    const scene = scenes.find((s) => String(s.id) === id);
    return !!scene && !!recipeOf(scene);
  });
  const dropped = new Set(inputs.spans.filter((s) => !spans.includes(s)).map((s) => s.id));
  const list = scenes.filter((s) => !dropped.has(String(s.id))).map((s) => ({ id: String(s.id), scene: s }));
  const slots = planned(ctx, () => assembleSpanCuts(list, spans, { fps, tail_s: tail, silent: inputs.silent, card: ending ? { fills, frames: endingFrames } : null, until_s: until }));

  const sourceList = (name, where) => {
    const v = sources[name];
    if (v === undefined) throw ctx.error('bad_input', `${where} uses source "${name}", which sources does not have`);
    if (Array.isArray(v)) return v;
    if (isRef(v)) return [{ id: name, ...(v.media === 'image' ? { image: v } : { video: v }) }];
    throw ctx.error('bad_input', `${where}: source "${name}" is not a list or a file`);
  };
  const lengths = new Map();
  const lengthOf = async (ref) => {
    if (!lengths.has(ref.path)) lengths.set(ref.path, await kitMediaLength(ctx, ref));
    return lengths.get(ref.path);
  };
  const used = new Map(); // source name -> pieces cut from its clips, in order
  const seenTags = new Map(); // tag key -> scenes seen
  const pieces = [];

  for (const slot of slots.cuts) {
    const scene = list[slot.index].scene;
    const recipe = recipeOf(scene);
    if (!recipe) {
      const tag = kitSceneTag(scene);
      throw ctx.error('bad_input', `scene "${slot.id}" ${tag ? `has the tag "${tag}"` : 'has no tag'} and shots has no recipe for it (recipes: ${Object.keys(inputs.shots).join(', ')})`);
    }
    const tagKey = recipe.tag ? kitTagKey(recipe.tag) : recipe.key;
    const ordinal = seenTags.get(tagKey) ?? 0;
    seenTags.set(tagKey, ordinal + 1);
    const specs = recipe.shots.filter((s) => !(s.skip_first && ordinal === 0));
    if (!specs.length) throw ctx.error('bad_input', `scene "${slot.id}": every shot in its recipe skips the first scene`);

    const shots = [];
    for (const [i, spec] of specs.entries()) {
      const where = `scene "${slot.id}" shot ${i + 1} (${spec.kind})`;
      const shot = { spec, fixed: spec.seconds ? Math.max(1, Math.round(spec.seconds * fps)) : null, fill: !!spec.fill };
      if (!spec.speed && (spec.min_speed || spec.max_speed)) {
        const [lo, hi] = assembleSpeedBounds(spec);
        if (lo > hi) throw ctx.error('bad_input', `${where}: min_speed ${kitNum(lo, 2)} is above max_speed ${kitNum(hi, 2)}`);
      }
      const items = spec.kind === 'video' ? null : sourceList(spec.source, where);
      if (spec.kind === 'still') {
        let item;
        const of = spec.of ?? (spec.variant ? 'named_product' : 'scene');
        if (of === 'named_product') {
          const hit = assembleSceneProduct(scene, products, ordinal);
          if (!hit) throw ctx.error('bad_input', `${where}: the scene names no product and products has none at its place`);
          if (hit.how === 'order') ctx.log.warn('a scene names no product: using the product at its place', { scene: slot.id, product: hit.product.id });
          const id = spec.variant ? `${hit.product.id}-${spec.variant}` : String(hit.product.id);
          item = items.find((it) => String(it.id) === id);
          if (!item) throw ctx.error('bad_input', `${where}: source "${spec.source}" has no picture "${id}" (it has ${items.slice(0, 8).map((it) => it.id).join(', ') || 'none'})`);
        } else if (of === 'first') item = items[0];
        else item = items.find((it) => String(it.id) === slot.id);
        if (!item || !(item.image || item.video)) throw ctx.error('bad_input', `${where}: source "${spec.source}" has no picture for this scene`);
        shot.make = item.image ? { kind: 'image', media: item.image } : { kind: 'frame', media: item.video, at_s: spec.in_s ?? 0 };
      } else if (spec.kind === 'clip') {
        const item = items.find((it) => String(it.id) === slot.id);
        if (!item || !(item.video || item.image)) throw ctx.error('bad_input', `${where}: source "${spec.source}" has no clip for this scene`);
        shot.make = item.video ? { kind: 'video', media: item.video, in_s: spec.in_s ?? 0 } : { kind: 'image', media: item.image };
        shot.uses = spec.source; // a picture in a clip list counts as used too: a montage or freeze can show it
      } else if (spec.kind === 'video') {
        const v = sources[spec.source];
        if (v === undefined) throw ctx.error('bad_input', `${where} uses source "${spec.source}", which sources does not have`);
        if (!isRef(v) || v.media !== 'video') throw ctx.error('bad_input', `${where}: source "${spec.source}" is not a video`);
        shot.make = { kind: 'video', media: v, in_s: spec.in_s ?? 0 };
        if (!shot.fixed && !shot.fill) shot.fixed = Math.max(1, Math.round((await lengthOf(v) - (spec.in_s ?? 0)) * fps));
      } else if (spec.kind === 'montage') {
        let picks = [...new Set((used.get(spec.source) || []).map((p) => p.media.path))].map((path) => (used.get(spec.source) || []).find((p) => p.media.path === path));
        if (!picks.length) picks = items.filter((it) => it.video || it.image).map((it) => ({ media: it.video || it.image, in_s: 0, whole: true }));
        if (spec.max) picks = picks.slice(0, spec.max);
        if (!picks.length) throw ctx.error('bad_input', `${where}: source "${spec.source}" has no clips to take frames from`);
        const per = Math.max(1, Math.round((spec.seconds ?? 0.75) * fps));
        const overlap = (spec.transition ?? 'cut') === 'cut' ? 0 : Math.round((spec.transition_s ?? 0.1) * fps);
        shot.picks = picks;
        shot.overlap = overlap < per ? overlap : 0;
        shot.fixed = picks.length * per - (picks.length - 1) * shot.overlap;
        shot.make = { kind: 'montage' };
      } else if (spec.kind === 'freeze') {
        const mine = used.get(spec.source) || [];
        const pick = spec.pick ?? 'last';
        let from = null;
        if (pick === 'scene') {
          const item = items.find((it) => String(it.id) === slot.id && (it.video || it.image));
          from = item ? { media: item.video || item.image, in_s: 0, whole: true } : null;
        } else if (mine.length) from = pick === 'first' ? mine[0] : mine[mine.length - 1];
        else {
          // No clip from this source is cut yet: the source's own first or last clip, as a montage does.
          const all = items.filter((it) => it.video || it.image);
          const item = pick === 'first' ? all[0] : all[all.length - 1];
          from = item ? { media: item.video || item.image, in_s: 0, whole: true } : null;
          if (item) ctx.log.warn('freeze: no clip from the source is used yet, so it freezes the source\'s own clip', { scene: slot.id, clip: item.id });
        }
        if (!from) throw ctx.error('bad_input', `${where}: source "${spec.source}" has no clip to freeze`);
        shot.from = from;
        shot.make = { kind: 'frame', media: from.media };
      }
      shots.push(shot);
      // Register clip pieces now so a later montage or freeze in this cut can find them.
      if (shot.uses) {
        shot.piece = { media: shot.make.media, in_s: shot.make.in_s, speed: 1, frames: 0 };
        used.set(shot.uses, [...(used.get(shot.uses) || []), shot.piece]);
      }
    }
    const minFill = Math.round(((inputs.snap && inputs.snap.min_shot_s) || ASSEMBLE_MIN_FILL_S) * fps);
    const frames = planned(ctx, () => assembleShotLengths(shots, slot.frames, { min_fill: minFill, scene_id: slot.id }));
    let at = slot.start_f;
    shots.forEach((shot, i) => {
      const spec = shot.spec;
      const zoom = spec.zoom ? [spec.zoom[0], spec.zoom[1]] : kenBurns && (shot.make.kind === 'image' || shot.make.kind === 'frame') && spec.kind === 'still' ? [1, zoomTo] : null;
      const piece = Object.assign(shot.piece || {}, { ...shot.make, id: `${slot.id}.${i + 1}`, scene_id: slot.id, start_f: at, frames: frames[i], zoom, spec, shot });
      if (spec.mark) piece.mark = spec.mark;
      pieces.push(piece);
      at += frames[i];
    });
  }
  return { pieces, card: slots.card || null, total_f: slots.total_f, scenes: list.map((l) => l.scene) };
}

/** Sets each piece's speed, hold and frame times once its length is final (after snapping). */
async function finishPieces(ctx, pieces, fps) {
  const lengthOf = async (ref) => kitMediaLength(ctx, ref);
  const frameAt = async (src, at) => {
    if (src.media.media === 'image') return 0; // a picture has one frame
    const length = await lengthOf(src.media);
    const window = src.whole ? length - (src.in_s ?? 0) : (src.frames / fps) * (src.speed ?? 1);
    const t = (src.in_s ?? 0) + at * Math.max(0, window);
    return Math.max(0, Math.min(t, length - 2 / fps));
  };
  // Clip speeds first: a montage or freeze reads the windows they settle.
  for (const p of pieces) {
    if (p.kind !== 'video') continue;
    const spec = p.spec || {};
    const length = await lengthOf(p.media);
    const avail = length - (p.in_s ?? 0);
    if (avail <= 0) throw ctx.error('bad_input', `scene "${p.scene_id}": the clip starts at ${kitNum(p.in_s, 2)}s of a ${kitNum(length, 2)}s clip`);
    const need = p.frames / fps;
    let speed = 1;
    if (spec.speed) speed = spec.speed;
    else if (spec.min_speed || spec.max_speed) {
      const [lo, hi] = assembleSpeedBounds(spec);
      speed = Math.min(hi, Math.max(lo, avail / need));
    }
    p.speed = +speed.toFixed(4);
    p.hold_s = Math.max(0, need - avail / p.speed);
  }
  for (const p of pieces) {
    const at = (p.spec && p.spec.at) ?? 0.5;
    if (p.kind === 'frame' && p.shot && p.shot.from) p.at_s = await frameAt(p.shot.from, at);
    else if (p.kind === 'frame') p.at_s = Math.max(0, Math.min(p.at_s ?? 0, (await lengthOf(p.media)) - 2 / fps));
    if (p.kind === 'montage') {
      const { lengths, overlap } = assembleMontageLengths(p.frames, p.shot.picks.length, p.shot.overlap);
      p.overlap = overlap;
      p.transition = overlap ? p.spec.transition : 'cut';
      p.parts = [];
      for (const [i, src] of p.shot.picks.entries()) p.parts.push({ media: src.media, at_s: await frameAt(src, at), frames: lengths[i] });
    }
    // A looped still and a zoomed frame make every frame they need; an unzoomed frame is held.
    if (p.kind === 'image' || p.kind === 'montage') p.hold_s = 0;
    if (p.kind === 'frame') p.hold_s = p.zoom ? 0 : p.frames / fps;
  }
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { width: w, height: h } = inputs;
  const fps = inputs.fps ?? 30;
  const fit = inputs.fit ?? 'cover';
  const background = inputs.background ?? 'black';
  if (w % 2 || h % 2) throw ctx.error('bad_input', 'width and height must be even');
  if (!inputs.clips && !inputs.shots) throw ctx.error('bad_input', 'give clips, or shots with sources');
  const keepAudio = inputs.clip_audio === 'keep';
  const grade = inputs.grade ?? 'none';
  const kenBurns = !!inputs.motion && inputs.motion.stills === 'ken_burns';
  const zoomTo = (inputs.motion && inputs.motion.to) ?? 1.05;
  const fills = inputs.ending_fills ?? 'after';
  const tail = inputs.tail_s ?? 0.25;
  if (fills === 'last_span' && inputs.ending && !inputs.spans) throw ctx.error('bad_input', 'ending_fills last_span needs spans: the card takes the last span\'s place');
  if (inputs.card_from && inputs.card_from.tag != null && !inputs.scenes) throw ctx.error('bad_input', 'card_from {tag} needs scenes (plan.scenes) to find the tag');

  const ending = inputs.ending || null;
  const endingSeconds = ending ? await kitMediaLength(ctx, ending) : 0;
  const endingFrames = ending ? Math.round(endingSeconds * fps) : 0;
  if (ending && endingFrames < 1) throw ctx.error('bad_input', 'the end card is shorter than one frame');

  // Where every cut goes.
  const opts = { ending, endingFrames, fills, tail, kenBurns, zoomTo };
  const plan = inputs.shots ? await shotPieces(inputs, ctx, fps, opts) : await clipPieces(inputs, ctx, fps, opts);
  const { pieces } = plan;
  const bodyEnd_f = plan.card ? plan.card.start_f : plan.total_f;

  // Cuts moved out of words.
  if (inputs.snap && !inputs.spans && inputs.timeline) throw ctx.error('bad_input', 'snap needs spans or shots: a timeline passed through keeps its scenes, so its cuts cannot move');
  if (inputs.snap && pieces.length > 1) {
    const words = assembleWords(inputs.speech ?? (inputs.timeline ? inputs.timeline.speech : []));
    if (!words.length) ctx.log.warn('snap: the speech has no word timings, so no cut moved');
    else {
      const cuts = pieces.slice(1).map((p) => p.start_f);
      const moved = assembleSnapCuts(cuts, words, { fps, max_shift_s: inputs.snap.max_shift_s ?? 0.4, min_shot_s: inputs.snap.min_shot_s ?? 0.55, end_f: bodyEnd_f });
      const bounds = [0, ...moved, bodyEnd_f];
      pieces.forEach((p, i) => {
        p.start_f = bounds[i];
        p.frames = bounds[i + 1] - bounds[i];
      });
      const n = moved.filter((m, i) => m !== cuts[i]).length;
      if (n) ctx.log.info('snap: cuts moved out of words', { moved: n });
    }
  }
  await finishPieces(ctx, pieces, fps);
  if (plan.card) plan.card.hold_s = Math.max(0, plan.card.frames / fps - endingSeconds);

  // The scene each cut belongs to, and where the card span starts (card_from).
  const sceneTimes = [];
  for (const p of pieces) {
    const last = sceneTimes[sceneTimes.length - 1];
    if (inputs.shots && last && last.id === p.scene_id) last.end_f = p.start_f + p.frames;
    else sceneTimes.push({ id: p.scene_id, start_f: p.start_f, end_f: p.start_f + p.frames });
  }
  let cardFrom_f = null;
  if (inputs.card_from) {
    const sceneList = inputs.scenes || sceneTimes.map((s) => ({ id: s.id }));
    const id = planned(ctx, () => assembleCardScene(inputs.card_from, sceneList));
    if (id == null) ctx.log.warn('card_from: no scene has that tag, so the card span starts at the end card', { tag: inputs.card_from.tag });
    else {
      const hit = sceneTimes.find((s) => s.id === id);
      if (hit) cardFrom_f = hit.start_f;
      else if (plan.card && plan.card.id === id) cardFrom_f = plan.card.start_f;
      else if (inputs.card_from.scene_id != null) throw ctx.error('bad_input', `card_from names scene "${id}", which has no cut`);
      else ctx.log.warn('card_from: the tagged scene has no cut', { scene: id });
    }
  }

  // One input (several for a montage) and one chain per piece, then the end card, joined by the concat filter.
  const gradeChain = assembleGradeChain(grade, w, h);
  const args = [];
  const graph = [];
  let inputCount = 0;
  const addInput = (...a) => {
    args.push(...a);
    return inputCount++;
  };
  const all = pieces.map((p) => ({ ...p, body: true, graded: cardFrom_f == null || p.start_f < cardFrom_f }));
  if (plan.card) all.push({ kind: 'video', media: ending, in_s: 0, speed: 1, start_f: plan.card.start_f, frames: plan.card.frames, hold_s: plan.card.hold_s, body: false, graded: false });
  const fitted = `fps=${fps},${assembleFit(w, h, fit, background)}`;
  const fitted2x = assembleFit(w * 2, h * 2, fit, background);
  const oneFrame = (k) => `[${k}:v]trim=end_frame=1,setpts=PTS-STARTPTS,`;
  for (const [k, p] of all.entries()) {
    const exact = p.frames / fps;
    let head;
    if (p.kind === 'image') {
      const i = addInput('-loop', '1', '-framerate', String(fps), '-t', kitNum(exact + 2 / fps), '-i', p.media.path);
      const [from, to] = p.zoom || [1, 1];
      head = `[${i}:v]` + (!p.zoom ? fitted : from === 1 ? assembleKenBurns(w, h, fps, p.frames, to, fit, background) : assembleZoom(w, h, fps, p.frames, from, to, `fps=${fps},${fitted2x}`));
    } else if (p.kind === 'frame') {
      const i = addInput('-ss', kitNum(p.at_s), '-t', kitNum(0.5), '-i', p.media.path);
      head = oneFrame(i) + (p.zoom ? assembleZoom(w, h, fps, p.frames, p.zoom[0], p.zoom[1], fitted2x, { per_input: p.frames }) : fitted);
    } else if (p.kind === 'montage') {
      const labels = p.parts.map((part, j) => {
        const i = addInput('-ss', kitNum(part.at_s), '-t', kitNum(0.5), '-i', part.media.path);
        const look = p.zoom ? assembleZoom(w, h, fps, part.frames, p.zoom[0], p.zoom[1], fitted2x, { per_input: part.frames }) : fitted;
        graph.push(`${oneFrame(i)}${look},tpad=stop_mode=clone:stop=${part.frames + 2},trim=end_frame=${part.frames},setpts=PTS-STARTPTS,settb=1/${fps}[m${k}_${j}]`);
        return `[m${k}_${j}]`;
      });
      if (labels.length === 1) graph.push(`${labels[0]}null[mj${k}]`);
      else if (!p.overlap) graph.push(`${labels.join('')}concat=n=${labels.length}:v=1:a=0[mj${k}]`);
      else {
        let acc = labels[0];
        let offset = 0;
        for (let j = 1; j < labels.length; j++) {
          offset += p.parts[j - 1].frames - p.overlap;
          const out = j === labels.length - 1 ? `[mj${k}]` : `[mx${k}_${j}]`;
          graph.push(`${acc}${labels[j]}xfade=transition=${p.transition}:duration=${kitNum(p.overlap / fps, 4)}:offset=${kitNum(offset / fps, 4)}${out}`);
          acc = out;
        }
      }
      head = `[mj${k}]null`;
    } else {
      const speed = p.speed ?? 1;
      const i = addInput('-ss', kitNum(p.in_s ?? 0), '-t', kitNum(exact * speed + 0.5), '-i', p.media.path);
      head = `[${i}:v]` + (speed !== 1 ? `setpts=(PTS-STARTPTS)/${kitNum(speed, 4)},` : '') + fitted;
      p.input = i;
    }
    const finish = p.body && p.graded && gradeChain ? `,${gradeChain}` : '';
    graph.push(
      `${head},tpad=stop_mode=clone:stop_duration=${kitNum((p.hold_s ?? 0) + SHORT_TOLERANCE_S + 2 / fps, 4)},` +
        `trim=end_frame=${p.frames},setpts=PTS-STARTPTS${finish},format=yuv420p[v${k}]`,
    );
    if (keepAudio) {
      // The end card is always silent (music and room tone are the mix layer's), even when its file has sound.
      const info = p.body && p.kind === 'video' ? await ctx.tools.probe(p.media.path) : { has_audio: false };
      const tempo = p.kind === 'video' && (p.speed ?? 1) !== 1 ? `,atempo=${kitNum(p.speed, 4)}` : '';
      graph.push(
        info.has_audio
          ? `[${p.input}:a]aresample=48000:async=1:first_pts=0${tempo},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,apad,atrim=0:${kitNum(exact)},asetpts=PTS-STARTPTS[a${k}]`
          : `anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${kitNum(exact)},asetpts=PTS-STARTPTS[a${k}]`,
      );
    }
  }
  const pads = all.map((_, k) => (keepAudio ? `[v${k}][a${k}]` : `[v${k}]`)).join('');
  graph.push(`${pads}concat=n=${all.length}:v=1:a=${keepAudio ? 1 : 0}${keepAudio ? '[vout][aout]' : '[vout]'}`);
  const out = ['-filter_complex', graph.join(';'), '-map', '[vout]'];
  if (keepAudio) out.push('-map', '[aout]', ...ctx.tools.encodeArgs('aac'));
  out.push(...ctx.tools.encodeArgs('h264-master'), ...assembleRateCap(grade), '-r', String(fps), join(ctx.workDir, 'assembled.mp4'));
  await kitFfmpeg(ctx, [...args, ...out]);
  const video = await ctx.file('assembled.mp4', 'video');
  if (video.bytes > ASSEMBLE_MAX_BYTES) {
    const mb = (n) => Math.round(n / (1024 * 1024));
    throw ctx.error('output_invalid', `the cut is ${mb(video.bytes)} MB, over the ${mb(ASSEMBLE_MAX_BYTES)} MB a finished video may be; make it shorter or drop the grain look`);
  }
  const total = plan.total_f / fps;
  const got = await ctx.tools.probe(video.path);
  if (!Number.isFinite(got.duration_s) || Math.abs(got.duration_s - total) > 1.5 / fps) {
    throw ctx.error('output_invalid', `the cut is ${got.duration_s}s, expected ${kitNum(total, 3)}s`);
  }

  // The timeline: scenes by cut (or the clips' own timeline), speech passed through, the card span and its logo box.
  const seconds = t3(plan.total_f, fps);
  const bodyEnd = t3(bodyEnd_f, fps);
  let scenes;
  let zones = [];
  if (!inputs.spans && inputs.timeline) {
    const tl = inputs.timeline;
    scenes = assembleClampScenes(tl.scenes, bodyEnd);
    const scale = (tl.width !== w || tl.height !== h) && tl.width > 0 && tl.height > 0;
    for (const z of tl.safe_zones || []) {
      const moved = scale ? assembleMapZone(z, tl.width, tl.height, w, h, fit) : { ...z };
      if (moved) zones.push(moved);
    }
  } else {
    scenes = sceneTimes.map((s) => ({ id: s.id, start_s: t3(s.start_f, fps), end_s: t3(s.end_f, fps) }));
  }
  if (plan.card && plan.card.id) scenes.push({ id: plan.card.id, start_s: bodyEnd, end_s: seconds });
  const speech = assembleClampSpeech(inputs.speech ?? (inputs.timeline ? inputs.timeline.speech : []), seconds);
  const timeline = { duration_s: seconds, width: w, height: h, fps, scenes, speech };
  if (plan.card || cardFrom_f != null) timeline.end_card = { start_s: cardFrom_f != null ? t3(cardFrom_f, fps) : bodyEnd, end_s: seconds };
  if (plan.card) {
    const et = inputs.ending_timeline;
    const logo = et && (et.safe_zones || []).find((z) => z.use === 'logo');
    const moved = logo ? assembleMapZone(logo, et.width, et.height, w, h, fit) : null;
    if (moved) zones = [...zones.filter((z) => z.use !== 'logo'), moved];
  }
  if (zones.length) timeline.safe_zones = zones;
  // 1.3.0: where each still holds the product, on the cut, for the time its piece shows.
  const keep = [];
  for (const p of pieces) {
    if (!p.keep_clear) continue;
    const info = await ctx.tools.probe(p.media.path);
    for (const b of p.keep_clear) {
      const box = assembleMapKeepClear(b, info.width, info.height, w, h, fit, p.zoom ? p.zoom[1] : 1);
      if (box) keep.push({ scene_id: String(p.scene_id), start_s: t3(p.start_f, fps), end_s: t3(Math.min(p.start_f + p.frames, bodyEnd_f), fps), use: 'product', box });
    }
  }
  if (keep.length) timeline.keep_clear = keep.slice(0, 200);
  const marks = pieces.filter((p) => p.mark).map((p) => ({ kind: p.mark, at_s: t3(p.start_f, fps) }));
  return kitCheckOutputs(ctx, manifest, { video, seconds, timeline, marks });
}
