// Built from overlay/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- overlay/src/windows.mjs ----
// overlay's pure planning: which picture shows when, where and how big. No
// ffmpeg here, so the tests check the arithmetic and the refusals directly.
// Bundled into part.mjs; every top-level name starts with `ovl` (the shared
// _lib modules use `kit`, parts/_tools/bundle.mjs).

/** The px values in an item are measured at a 1080-pixel short side and scaled to the video. */
const OVL_REFERENCE_SHORT_SIDE = 1080;
/** The most windows one step draws, so a long plan can never build an endless filter graph. */
const OVL_MAX_WINDOWS = 60;
/** A scale-in starts at this fraction of the full size and grows to it. */
const OVL_SCALE_FROM = 0.85;
/** The size rule (GOOSE-4015, critic #38): the final encode's bitrate cap and the largest output kept. */
const OVL_MAX_BYTES = 180 * 1024 * 1024;
const OVL_RATE_CAP = ['-maxrate', '16M', '-bufsize', '32M'];

// The product matcher of phone-chat 1.2.0 (src/threads.mjs chatNames) and _lib/scene-match.mjs
// kitProductMatch, so a scene names the same product here as in every other part: its id or whole
// name, or at least two of its name's words (all of a one-word name), ignoring case; a word also
// matches its stem when both are at least four letters.
const OVL_PLAIN_WORDS = new Set(['a', 'an', 'the', 'of', 'its', 'it', 'this', 'that', 'these', 'those', 'them', 'one', 'my', 'our', 'your', 'their', 'his', 'her', 'show', 'shows', 'showing', 'send', 'sends', 'here', 'look', 'see', 'new', 'product', 'products', 'item', 'photo', 'photos', 'picture', 'pictures', 'pic', 'pics', 'image', 'images', 'shot', 'shots', 'snap', 'snaps', 'and', 'with', 'in', 'on', 'at', 'is']);
// A leading tag in a picture ("Product: the jar on a table"), as _lib/scene-match.mjs reads it.
const OVL_TAG_RE = /^\s*([A-Za-z][A-Za-z0-9_-]*(?: [A-Za-z0-9_-]+)?)\s*:(?:\s+(?=\S)|\s*$)/;

function ovlWords(text) {
  return String(text || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}

function ovlSameWord(a, b) {
  return a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)));
}

/** How strongly `text` names `product`: 0, Infinity for its id or whole name, else the count of its name's words used. */
function ovlProductMatch(text, product) {
  if (!product || product.id == null) return 0;
  const want = String(text || '').trim().toLowerCase();
  if (!want) return 0;
  const id = String(product.id).toLowerCase();
  if (id === want || String(product.name || '').toLowerCase() === want) return Infinity;
  const said = ovlWords(want);
  if (said.includes(id)) return Infinity;
  const name = ovlWords(product.name).filter((w) => !OVL_PLAIN_WORDS.has(w) && (w.length >= 3 || /\d/.test(w)));
  const used = name.filter((w) => said.some((t) => ovlSameWord(t, w))).length;
  return name.length && used >= Math.min(2, name.length) ? used : 0;
}

/** The scene's tag, compared without case or spacing: extra.shot, else a leading "Tag:" of its picture text. */
function ovlSceneTagKey(scene) {
  const shot = scene && scene.extra && scene.extra.shot;
  let tag = typeof shot === 'string' && shot.trim() ? shot : null;
  if (!tag && scene && typeof scene.picture === 'string') {
    const m = OVL_TAG_RE.exec(scene.picture);
    if (m) tag = m[1];
  }
  return tag ? tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '';
}

/**
 * The product a scene names, or null: the strongest match in its picture text (on a tie the longest
 * name, then plan order). A scene tagged Product ("Product: ..." or extra.shot "product") that names
 * none shows the plan's only product, so "Product: the box on a pedestal" still gets the real box.
 */
function ovlSceneProduct(scene, products) {
  const list = Array.isArray(products) ? products.filter((p) => p && typeof p === 'object') : [];
  if (!scene || !list.length) return null;
  const text = typeof scene.picture === 'string' ? scene.picture : '';
  const named = list
    .map((p, i) => ({ p, i, n: ovlProductMatch(text, p), len: String(p.name || '').length }))
    .filter((m) => m.n > 0)
    .sort((a, b) => (b.n === a.n ? 0 : b.n > a.n ? 1 : -1) || b.len - a.len || a.i - b.i);
  if (named.length) return named[0].p;
  if (ovlSceneTagKey(scene) === 'product' && list.length === 1) return list[0];
  return null;
}

class OvlRefusal extends Error {}

/** A refusal the part turns into bad_input. */
function ovlIsRefusal(err) {
  return err instanceof OvlRefusal;
}

function ovlRefuse(message) {
  return new OvlRefusal(message);
}

const ovlRound = (n) => +Number(n).toFixed(3);

/**
 * The windows to draw, as [{item, image, start_s, end_s}] in item order, then time order. Adjacent
 * windows of one item showing the same picture are merged, so a picture held across two scenes does
 * not scale in twice. Throws a refusal (bad_input) for an item that cannot be drawn; returns [] when
 * nothing applies (no scene names a product), and `notes` says why.
 *
 * duration_s: the video's length. timeline: its Timeline. scenes/products: plan.scenes, plan.products.
 */
function ovlWindows({ items, duration_s, timeline, scenes, products }) {
  const notes = [];
  const out = [];
  const end = duration_s;
  const cardStart = timeline && timeline.end_card ? timeline.end_card.start_s : null;
  const spans = new Map(((timeline && timeline.scenes) || []).map((s) => [String(s.id), s]));
  items.forEach((item, k) => {
    const who = `items[${k}]`;
    // A binding to an optional file (brand.logo for a brand with no logo) resolves to nothing; the kit
    // drops the field, so the item is skipped rather than refusing the whole video.
    if (item.image == null) {
      notes.push(`${who} has no picture (the brand may have no logo), so it is skipped`);
      return;
    }
    const stop = item.until === 'end_card' && cardStart != null ? Math.min(cardStart, end) : end;
    const fromProduct = item.image === 'product_of_scene';
    if (fromProduct && item.scenes !== 'naming_product') throw ovlRefuse(`${who}: image "product_of_scene" needs scenes "naming_product", so each window knows its product`);
    if (item.scenes && (item.from_s != null || item.to_s != null)) throw ovlRefuse(`${who}: give either scenes or from_s/to_s, not both`);
    const windows = [];
    if (item.scenes === 'naming_product') {
      if (!Array.isArray(scenes) || !scenes.length) throw ovlRefuse(`${who}: scenes "naming_product" needs the plan's scenes`);
      if (!Array.isArray(products) || !products.length) throw ovlRefuse(`${who}: scenes "naming_product" needs the plan's products`);
      scenes.forEach((scene, i) => {
        const product = ovlSceneProduct(scene, products);
        if (!product) return;
        const id = scene.id == null ? String(i + 1) : String(scene.id);
        const span = spans.get(id);
        if (!span) {
          notes.push(`scene ${id} names ${product.name || product.id} but has no span on the timeline, so nothing is drawn for it`);
          return;
        }
        let image = item.image;
        if (fromProduct) {
          image = (product.images || [])[0];
          if (!image) throw ovlRefuse(`${who}: scene ${id} names the product "${product.name || product.id}", which has no photo to lay over it`);
        }
        windows.push({ image, start_s: span.start_s, end_s: span.end_s, scene_id: id });
      });
      if (!windows.length) notes.push(`${who}: no scene names a product, so nothing is drawn`);
    } else {
      const a = item.from_s == null ? 0 : item.from_s;
      const b = item.to_s == null ? stop : item.to_s;
      if (a >= end) throw ovlRefuse(`${who}: from_s (${a}) is at or past the video's end (${ovlRound(end)} s)`);
      if (b <= a) throw ovlRefuse(`${who}: the window ends (${ovlRound(b)} s) before it starts (from_s ${a} s)`);
      windows.push({ image: item.image, start_s: a, end_s: b });
    }
    // Clip to the video (and the end card when asked), then merge touching windows of one picture.
    const kept = [];
    for (const w of windows.sort((x, y) => x.start_s - y.start_s)) {
      const a = Math.max(0, w.start_s);
      const b = Math.min(stop, w.end_s);
      if (b - a < 1e-3) continue;
      const last = kept[kept.length - 1];
      if (last && last.image.sha256 === w.image.sha256 && a - last.end_s <= 0.05) last.end_s = Math.max(last.end_s, b);
      else kept.push({ item: k, image: w.image, start_s: a, end_s: b });
    }
    out.push(...kept);
  });
  if (out.length > OVL_MAX_WINDOWS) throw ovlRefuse(`the items draw ${out.length} windows; at most ${OVL_MAX_WINDOWS} are allowed`);
  return { windows: out.map((w) => ({ ...w, start_s: ovlRound(w.start_s), end_s: ovlRound(w.end_s) })), notes };
}

/**
 * Where an item's picture sits on a W x H video at full size: {w, h, x, y} in video pixels.
 * The picture keeps its aspect. width_px and margin_px are measured at a 1080-pixel short side.
 * Default width: 60% of the video's width in the centre (and no taller than half its height),
 * 15% in a corner. Never wider or taller than the video less its margins.
 */
function ovlBox(item, picture, W, H) {
  const k = Math.min(W, H) / OVL_REFERENCE_SHORT_SIDE;
  const corner = item.corner || 'center';
  const margin = Math.round((item.margin_px == null ? 40 : item.margin_px) * k);
  const pw = picture.width;
  const ph = picture.height;
  if (!(pw > 0 && ph > 0)) throw ovlRefuse('a picture has no size; it may not be an image ffmpeg can read');
  const aspect = ph / pw;
  let w;
  if (item.width_px != null) w = item.width_px * k;
  else if (corner === 'center') w = Math.min(W * 0.6, (H * 0.5) / aspect);
  else w = W * 0.15;
  const maxW = Math.max(2, W - 2 * margin);
  const maxH = Math.max(2, H - 2 * margin);
  w = Math.min(w, maxW, maxH / aspect);
  w = Math.max(2, Math.round(w));
  const h = Math.max(2, Math.round(w * aspect));
  let x;
  let y;
  if (corner === 'center') {
    x = Math.round((W - w) / 2);
    y = Math.round((H - h) / 2);
  } else {
    x = corner.endsWith('left') ? margin : W - margin - w;
    y = corner.startsWith('top') ? margin : H - margin - h;
  }
  return { w, h, x, y };
}

function ovlNum(value) {
  return Number(value).toFixed(6).replace(/\.?0+$/, '') || '0';
}

/**
 * The filter graph that lays every window over input 0. `inputs` are the distinct pictures in the
 * order they are passed to ffmpeg after the video (input 1, 2, ...); each window names its picture by
 * `input`. A window with scale_in_s grows from OVL_SCALE_FROM to full size around its box's centre and
 * fades in over that time. Returns {graph, out} where out is the final video label.
 */
function ovlFilterGraph(windows, { fps }) {
  const byInput = new Map();
  for (const w of windows) {
    if (!byInput.has(w.input)) byInput.set(w.input, []);
    byInput.get(w.input).push(w);
  }
  const chains = [];
  const label = new Map();
  for (const [input, list] of byInput) {
    const names = list.map((_, j) => `p${input}_${j}`);
    list.forEach((w, j) => label.set(w, names[j]));
    const split = list.length > 1 ? `,split=${list.length}${names.map((n) => `[${n}]`).join('')}` : `[${names[0]}]`;
    chains.push(`[${input}:v]fps=${ovlNum(fps)},format=rgba${split}`);
  }
  let base = '0:v';
  windows.forEach((w, i) => {
    const { box } = w;
    const a = ovlNum(w.start_s);
    const b = ovlNum(w.end_s);
    const steps = [];
    let x = String(box.x);
    let y = String(box.y);
    const d = w.scale_in_s || 0;
    if (d > 0) {
      const s = `(${OVL_SCALE_FROM}+${ovlNum(1 - OVL_SCALE_FROM)}*clip((t-${a})/${ovlNum(d)}\\,0\\,1))`;
      const sw = `max(2\\,trunc(${box.w}*${s}))`;
      const sh = `max(2\\,trunc(${box.h}*${s}))`;
      steps.push(`scale=w=${sw}:h=${sh}:eval=frame`, `fade=t=in:st=${a}:d=${ovlNum(d)}:alpha=1`);
      // The box grows around its centre; the position is worked out from the same size formula, so it
      // does not depend on how a given ffmpeg build reports the overlay's size per frame.
      x = `${ovlNum(box.x + box.w / 2)}-trunc(${box.w}*${s})/2`;
      y = `${ovlNum(box.y + box.h / 2)}-trunc(${box.h}*${s})/2`;
    } else {
      steps.push(`scale=w=${box.w}:h=${box.h}`);
    }
    if (w.opacity < 1) steps.push(`colorchannelmixer=aa=${ovlNum(w.opacity)}`);
    chains.push(`[${label.get(w)}]${steps.join(',')}[o${i}]`);
    const next = `v${i}`;
    chains.push(`[${base}][o${i}]overlay=x=${x}:y=${y}:enable=between(t\\,${a}\\,${b}):eof_action=pass:format=auto[${next}]`);
    base = next;
  });
  chains.push(`[${base}]format=yuv420p[vout]`);
  return { graph: chains.join(';'), out: 'vout' };
}

// ---- overlay/src/part.mjs ----
// overlay: lays pictures over a video at time windows. A corner logo for the
// whole video or until the end card; a product's real photo laid over each
// scene whose picture names it (the 3D explainer's box-free plate), with an
// optional scale-in. The video is re-encoded once with the size rule's
// bitrate cap; its sound is copied unchanged; the timeline passes through.
// When nothing applies (no scene names a product), the cut passes through.

const OVL_READABLE = new Set(['image/png', 'image/jpeg', 'image/webp']);

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { video, timeline, items } = inputs;
  const info = await ctx.tools.probe(video.path);
  const W = info.width || video.width || timeline.width;
  const H = info.height || video.height || timeline.height;
  const fps = info.fps || video.fps || timeline.fps || 30;
  const duration = await kitDuration(ctx, video);

  let planned;
  try {
    planned = ovlWindows({ items, duration_s: duration, timeline, scenes: inputs.scenes, products: inputs.products });
  } catch (err) {
    if (ovlIsRefusal(err)) throw ctx.error('bad_input', err.message);
    throw err;
  }
  for (const note of planned.notes) ctx.log.warn(note);
  if (!planned.windows.length) {
    ctx.log.info('overlay draws nothing, so the cut passes through');
    ovlCheckSize(ctx, video);
    return kitCheckOutputs(ctx, manifest, { video, timeline });
  }

  // One ffmpeg input per distinct picture, sized once.
  const pictures = new Map();
  for (const w of planned.windows) {
    const key = w.image.sha256;
    if (pictures.has(key)) continue;
    if (w.image.mime && !OVL_READABLE.has(w.image.mime)) {
      throw ctx.error('bad_input', `the picture ${w.image.path.split('/').pop()} is ${w.image.mime}; overlay draws PNG, JPEG or WebP files`);
    }
    let size = w.image.width > 0 && w.image.height > 0 ? w.image : null;
    if (!size) {
      try {
        size = await ctx.tools.probe(w.image.path);
      } catch {
        size = null;
      }
    }
    if (!size || !(size.width > 0 && size.height > 0)) throw ctx.error('bad_input', `the picture ${w.image.path.split('/').pop()} cannot be read as an image`);
    pictures.set(key, { input: pictures.size + 1, file: w.image, size });
  }
  const windows = planned.windows.map((w) => {
    const item = items[w.item];
    const pic = pictures.get(w.image.sha256);
    let box;
    try {
      box = ovlBox(item, pic.size, W, H);
    } catch (err) {
      if (ovlIsRefusal(err)) throw ctx.error('bad_input', `items[${w.item}]: ${err.message}`);
      throw err;
    }
    const scaleIn = Math.min(item.scale_in_s || 0, w.end_s - w.start_s);
    return { ...w, input: pic.input, box, scale_in_s: scaleIn, opacity: item.opacity == null ? 1 : item.opacity };
  });
  ctx.log.info('overlay windows', { windows: windows.map((w) => ({ item: w.item, start_s: w.start_s, end_s: w.end_s, box: w.box })) });

  const { graph, out } = ovlFilterGraph(windows, { fps });
  const args = ['-i', video.path];
  for (const pic of pictures.values()) args.push('-loop', '1', '-framerate', String(fps), '-t', String(duration), '-i', pic.file.path);
  args.push(
    '-filter_complex',
    graph,
    '-map',
    `[${out}]`,
    '-map',
    '0:a?',
    ...ctx.tools.encodeArgs('h264-master'),
    ...OVL_RATE_CAP,
    '-c:a',
    'copy',
    '-t',
    String(duration),
    join(ctx.workDir, 'overlaid.mp4'),
  );
  await kitFfmpeg(ctx, args);
  const result = await ctx.file('overlaid.mp4', 'video');
  ovlCheckSize(ctx, result);
  return kitCheckOutputs(ctx, manifest, { video: result, timeline });
}

// The size rule (critic #38): no output over 180 MB, whether overlay encoded it or passed it through.
function ovlCheckSize(ctx, file) {
  if (!(file && file.bytes > OVL_MAX_BYTES)) return;
  const mb = (n) => (n / (1024 * 1024)).toFixed(1);
  throw ctx.error('output_invalid', `the video is ${mb(file.bytes)} MB, over the ${mb(OVL_MAX_BYTES)} MB a finished video may be; make it shorter`);
}
