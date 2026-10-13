// Built from end-card/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- _lib/end-card.mjs ----
// The brand end card, drawn in the kit's Chromium: the logo, the brand's
// colours and fonts, an optional proof row (stars only with approved proof
// text), up to three benefits, the call to action and the URL. Today's
// render-imessage-chat end card, made data-only. Shared by the end-card part
// and the brand layer. Every top-level name starts with `kit`.
//
// The logo (end-card 1.1.1, brand-layer 1.0.2) is never recoloured or redrawn,
// but it is fitted: a flat white, grey or black background the file carries is
// made transparent (only the part touching the edge, never the mark), empty
// margins are trimmed, and the mark is scaled (up as well as down) into a box
// set by its shape: a wide mark (2:1 or wider) is min(640 px, 0.58 W) wide,
// any other min(320 px, 0.17 H) tall, at 1080x1920. When the mark still barely
// contrasts with the card (under 3:1), the whole card changes colour (the
// logo's own background, else the brand colour with the most contrast, else
// near-black or warm white) instead of putting the logo on a plate.

const kitCardIcons = {
  pencil: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
  heart: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  star: '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>',
  check: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
  gift: '<path d="M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-5.5-1.65l-.5.67-.5-.68A3 3 0 0 0 6 4c0 .35.07.69.18 1H4a2 2 0 0 0-2 2v2h20V7a2 2 0 0 0-2-1zM4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4z"/>',
  bolt: '<path d="M7 2v11h3v9l7-12h-4l4-8z"/>',
  shield: '<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>',
};

const KIT_CARD_ICON_NAMES = Object.keys(kitCardIcons);

function kitCardEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const kitCardHex = /^#([0-9a-fA-F]{6})$/;

function kitCardLum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Black or white, whichever reads better on `hex`. */
function kitCardContrastText(hex) {
  return kitCardLum(hex) > 0.4 ? '#111111' : '#ffffff';
}

function kitCardColor(value, fallback) {
  return typeof value === 'string' && kitCardHex.test(value) ? value : fallback;
}

async function kitCardDataUri(file) {
  const bytes = await readFile(file.path);
  return `data:${file.mime || 'application/octet-stream'};base64,${bytes.toString('base64')}`;
}

function kitCardFontFormat(file) {
  const m = /\.(ttf|otf|woff2?)$/i.exec(file.path || '');
  return { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' }[(m ? m[1] : 'ttf').toLowerCase()];
}

/** @font-face rules for the card's two families, from brand fonts or the part's bundled font. */
async function kitCardFontCss(brand, fallbackFontPath) {
  const fallback = { path: fallbackFontPath, mime: 'font/ttf' };
  const heading = (brand.fonts && brand.fonts.heading) || (brand.fonts && brand.fonts.body) || fallback;
  const body = (brand.fonts && brand.fonts.body) || heading;
  const face = async (family, file) =>
    `@font-face{font-family:'${family}';src:url(${await kitCardDataUri({ ...file, mime: file.mime || 'font/ttf' })}) format('${kitCardFontFormat(file)}');font-display:block;}`;
  return `${await face('KitHeading', heading)}${await face('KitBody', body)}`;
}

/** The card's colours from the brand kit and the step's overrides. */
function kitCardColors(brand, card = {}) {
  const c = brand.colors || {};
  const bg = kitCardColor(card.background, kitCardColor(c.background, '#ffffff'));
  const fg = kitCardColor(card.foreground, kitCardColor(c.text, kitCardContrastText(bg)));
  const ctaBg = kitCardColor(card.cta_background, kitCardColor(c.primary, fg));
  return { bg, fg, ctaBg, ctaFg: kitCardContrastText(ctaBg), star: kitCardColor(card.star_color, '#ffc83d') };
}

/** WCAG contrast ratio of two #rrggbb colours. */
function kitCardContrast(a, b) {
  const x = kitCardLum(a);
  const y = kitCardLum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function kitCardInkContrast(ink, hex) {
  const l = kitCardLum(hex);
  return (Math.max(ink, l) + 0.05) / (Math.min(ink, l) + 0.05);
}

/** Under this contrast the logo does not read on the card, and the card changes colour. */
const KIT_CARD_LOGO_MIN_CONTRAST = 3;

/**
 * The logo box per card, at 1080x1920: a wide mark (aspect 2 or more) is `wide` px and at most `wide_share`
 * of the width wide; any other mark is `tall` px and at most `tall_share` of the height tall. Scaled with
 * the card (min(W/1080, H/1920)).
 */
const KIT_CARD_LOGO_BOXES = {
  classic: { wide: 640, wide_share: 0.58, tall: 320, tall_share: 0.17 },
  brandkit: { wide: 520, wide_share: 0.5, tall: 300, tall_share: 0.16 },
  stack: { wide: 720, wide_share: 0.66, tall: 420, tall_share: 0.22 },
  statement: { wide: 720, wide_share: 0.66, tall: 300, tall_share: 0.16 },
};

/** The drawn size of a logo whose visible mark is `w` x `h`, on a `width` x `height` card. Scales up as well as down. */
function kitCardLogoSize(w, h, width, height, box = KIT_CARD_LOGO_BOXES.classic) {
  const s = Math.min(width / 1080, height / 1920);
  const aspect = w / h;
  let dw;
  let dh;
  if (aspect >= 2) {
    dw = Math.min(box.wide * s, box.wide_share * width);
    dh = dw / aspect;
  } else {
    dh = Math.min(box.tall * s, box.tall_share * height);
    dw = dh * aspect;
  }
  // A mark just under 2:1 is never wider than a wide one.
  const maxW = Math.min(box.wide * s, box.wide_share * width);
  if (dw > maxW) {
    dw = maxW;
    dh = dw / aspect;
  }
  return { w: Math.max(1, Math.round(dw)), h: Math.max(1, Math.round(dh)) };
}

/**
 * The card colour to switch to when the logo's ink (its mean relative luminance) barely contrasts with the
 * card: the background the logo file carried (its counters then match the card), else the brand colour with
 * the most contrast, else #111111 or #F5F3EE, whichever reads better. Null when the logo already reads.
 */
function kitCardLogoBackground(ink, bg, colors = {}, logoBg = null) {
  if (!Number.isFinite(ink) || kitCardInkContrast(ink, bg) >= KIT_CARD_LOGO_MIN_CONTRAST) return null;
  const min = KIT_CARD_LOGO_MIN_CONTRAST;
  if (logoBg && kitCardHex.test(logoBg) && kitCardInkContrast(ink, logoBg) >= min) return logoBg.toLowerCase();
  const palette = [colors.background, colors.primary, colors.secondary, colors.text, ...(Array.isArray(colors.palette) ? colors.palette : [])].filter(
    (c) => typeof c === 'string' && kitCardHex.test(c),
  );
  let best = null;
  for (const c of palette) if (!best || kitCardInkContrast(ink, c) > kitCardInkContrast(ink, best)) best = c;
  if (best && kitCardInkContrast(ink, best) >= min) return best.toLowerCase();
  return kitCardInkContrast(ink, '#111111') >= kitCardInkContrast(ink, '#f5f3ee') ? '#111111' : '#f5f3ee';
}

/**
 * The classic card's colours on a background the logo forced: a step or brand colour is kept only when it
 * reads on it (text 4.5:1, the CTA pill 1.5:1 against the card), else black or white.
 */
function kitCardColorsOn(brand, card, bg) {
  const c = brand.colors || {};
  const reads = (hex, min) => (typeof hex === 'string' && kitCardHex.test(hex) && kitCardContrast(hex, bg) >= min ? hex : null);
  const fg = reads(card.foreground, 4.5) || reads(c.text, 4.5) || kitCardContrastText(bg);
  const ctaBg = reads(card.cta_background, 1.5) || reads(c.primary, 1.5) || fg;
  return { bg, fg, ctaBg, ctaFg: kitCardContrastText(ctaBg), star: kitCardColor(card.star_color, '#ffc83d') };
}

/**
 * In the page: makes the logo (img#logo) ready to size. A file whose whole edge is one opaque flat neutral
 * colour (white, grey or black) has that edge-connected background made transparent, the mark's own pixels
 * untouched and its anti-aliased rim feathered; empty margins are trimmed. The result replaces the image.
 * Returns the mark's size, its mean ink luminance and where the trimmed mark sat in the file (shares), or null.
 */
async function kitCardPrepareLogo() {
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => i.decode()));
  const img = document.getElementById('logo');
  if (!img || !img.naturalWidth || !img.naturalHeight) return null;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const k = Math.min(1, 2048 / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * k));
  const h = Math.max(1, Math.round(nh * k));
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0, w, h);
  const im = cx.getImageData(0, 0, w, h);
  const d = im.data;
  const lum = (r, g, b) =>
    [r, g, b]
      .map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      })
      .reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0);
  const TOL = 24;
  const edge = [];
  for (let x = 0; x < w; x++) edge.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) edge.push(y * w, y * w + w - 1);
  let opaque = 0;
  const rs = [];
  const gs = [];
  const bs = [];
  for (const p of edge) {
    if (d[p * 4 + 3] >= 250) opaque++;
    rs.push(d[p * 4]);
    gs.push(d[p * 4 + 1]);
    bs.push(d[p * 4 + 2]);
  }
  const median = (a) => a.sort((x, y) => x - y)[a.length >> 1];
  const bg = [median(rs), median(gs), median(bs)];
  const dist = (p) => Math.max(Math.abs(d[p * 4] - bg[0]), Math.abs(d[p * 4 + 1] - bg[1]), Math.abs(d[p * 4 + 2] - bg[2]));
  const flat = edge.filter((p) => dist(p) <= TOL).length;
  const neutral = Math.max(...bg) - Math.min(...bg) <= 20;
  let hadBackground = false;
  let logoBg = null;
  if (opaque >= edge.length * 0.98 && flat >= edge.length * 0.9 && neutral) {
    const gone = new Uint8Array(w * h);
    const queue = [];
    for (const p of edge) {
      if (!gone[p] && dist(p) <= TOL) {
        gone[p] = 1;
        queue.push(p);
      }
    }
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i];
      const x = p % w;
      const y = (p - x) / w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && !gone[q] && dist(q) <= TOL) {
          gone[q] = 1;
          queue.push(q);
        }
      }
    }
    // Only a background, never the mark: something has to be left.
    if (w * h - queue.length >= w * h * 0.01) {
      hadBackground = true;
      logoBg = `#${bg.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      for (let p = 0; p < w * h; p++) {
        if (gone[p]) {
          d[p * 4 + 3] = 0;
          continue;
        }
        const x = p % w;
        const y = (p - x) / w;
        const rim = (x > 0 && gone[p - 1]) || (x < w - 1 && gone[p + 1]) || (y > 0 && gone[p - w]) || (y < h - 1 && gone[p + w]);
        const dp = dist(p);
        if (!rim || dp >= 128) continue;
        // An anti-aliased rim pixel is part background: unmix it and keep only the mark's share.
        const a = Math.max(0.05, (dp - TOL) / (128 - TOL));
        for (let c = 0; c < 3; c++) d[p * 4 + c] = Math.max(0, Math.min(255, Math.round(bg[c] + (d[p * 4 + c] - bg[c]) / a)));
        d[p * 4 + 3] = Math.round(d[p * 4 + 3] * a);
      }
    }
  }
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  let sum = 0;
  let weight = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] <= 8) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (d[i + 3] > 128) {
        sum += lum(d[i], d[i + 1], d[i + 2]);
        weight++;
      }
    }
  }
  if (x1 < 0 || !weight) return null;
  const tw = x1 - x0 + 1;
  const th = y1 - y0 + 1;
  if (hadBackground || tw < w || th < h) {
    cx.putImageData(im, 0, 0);
    const out = document.createElement('canvas');
    out.width = tw;
    out.height = th;
    out.getContext('2d').drawImage(cv, x0, y0, tw, th, 0, 0, tw, th);
    img.src = out.toDataURL('image/png');
    await img.decode();
  }
  return {
    w: tw,
    h: th,
    natural_w: Math.round(tw / k),
    natural_h: Math.round(th / k),
    ink: sum / weight,
    had_background: hadBackground,
    logo_bg: logoBg,
    trim: { left: x0 / w, top: y0 / h, right: (w - 1 - x1) / w, bottom: (h - 1 - y1) / h },
  };
}

/** In the page: draws the prepared logo at `w` x `h` and sets the card's colour variables; returns the logo's box. */
async function kitCardPlaceLogo({ w, h, vars }) {
  for (const [name, value] of Object.entries(vars || {})) document.documentElement.style.setProperty(name, value);
  const img = document.getElementById('logo');
  img.style.width = `${w}px`;
  img.style.height = `${h}px`;
  img.style.maxWidth = 'none';
  img.style.maxHeight = 'none';
  await img.decode();
  const r = img.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
}

/**
 * Fits the page's logo (kitCardPrepareLogo, kitCardLogoSize, kitCardLogoBackground) and returns
 * {logo, background}: `logo` is the box the logo file covers on the card, in its pixels (the trimmed margins
 * added back, so the final check matches the file there), `background` the colour the card changed to, or
 * null. `recolor(bg)` gives the CSS variables for a card on `bg`. Logs what it changed.
 */
async function kitCardFitLogo(ctx, page, { width, height, box, bg, colors, recolor }) {
  const mark = await page.evaluate(kitCardPrepareLogo);
  if (!mark) return { logo: null, background: null };
  const size = kitCardLogoSize(mark.w, mark.h, width, height, box);
  const background = kitCardLogoBackground(mark.ink, bg, colors, mark.logo_bg);
  const drawn = await page.evaluate(kitCardPlaceLogo, { w: size.w, h: size.h, vars: background ? recolor(background) : {} });
  if (mark.had_background) ctx.log.info('end card logo background made transparent', { background: mark.logo_bg });
  if (background) ctx.log.info('end card colour changed so the logo reads', { from: bg, to: background });
  if (size.w > mark.natural_w * 1.5) ctx.log.warn('the logo file is small, so the end card shows it enlarged and it may look soft', { natural: `${mark.natural_w}x${mark.natural_h}`, drawn: `${size.w}x${size.h}` });
  const t = mark.trim;
  const fw = drawn.w / Math.max(1e-6, 1 - t.left - t.right);
  const fh = drawn.h / Math.max(1e-6, 1 - t.top - t.bottom);
  const x0 = Math.max(0, Math.floor(drawn.x - t.left * fw));
  const y0 = Math.max(0, Math.floor(drawn.y - t.top * fh));
  const x1 = Math.min(width, Math.ceil(drawn.x - t.left * fw + fw));
  const y1 = Math.min(height, Math.ceil(drawn.y - t.top * fh + fh));
  const logo = x1 - x0 >= 4 && y1 - y0 >= 4 ? { use: 'logo', x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  return { logo, background };
}

/** The end card page for `brand` at width x height (CSS px at scale 1). Throws Error on missing copy. */
function kitEndCardHtml({ brand, card = {}, width, height, fontCss, logoUri }) {
  const s = Math.min(width / 1080, height / 1920);
  const px = (v) => `${+(v * s).toFixed(2)}px`;
  const colors = kitCardColors(brand, card);
  const cta = card.cta_text || (brand.cta && brand.cta.text);
  if (!cta) throw new Error('the end card needs a call to action (brand.cta.text)');
  const url = card.url_text ?? (brand.cta && brand.cta.url) ?? '';
  const stars = card.proof ? card.proof.stars : 0;
  if (stars && !(card.proof.text || '').trim()) throw new Error('stars need approved proof text');
  const wordmark = logoUri
    ? `<img id="logo" src="${logoUri}" alt="">`
    : `<div class="text">${kitCardEsc(brand.name)}</div>`;
  const proof = stars
    ? `<div class="proof-row"><div class="stars">${'&#9733;'.repeat(stars)}</div><div class="families">${kitCardEsc(card.proof.text)}</div></div>`
    : '';
  const benefits = (card.benefits || []).length
    ? `<div class="trust-trio">${card.benefits
        .map(
          (b) =>
            `<div class="item"><div class="badge"><svg viewBox="0 0 24 24">${kitCardIcons[b.icon || 'check']}</svg></div><div class="label">${kitCardEsc(b.label)}</div></div>`,
        )
        .join('')}</div>`
    : '';
  const headline = card.headline ? `<div class="hl">${kitCardEsc(card.headline)}</div>` : '';
  const footnote = card.footnote ? `<div class="footnote">${kitCardEsc(card.footnote)}</div>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
:root{--bg:${colors.bg};--fg:${colors.fg};--cta-bg:${colors.ctaBg};--cta-fg:${colors.ctaFg};--star:${colors.star};}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${width}px;height:${height}px;background:var(--bg);color:var(--fg);font-family:KitBody;overflow:hidden;}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;}
.wordmark{margin-bottom:${px(90)};text-align:center;display:flex;justify-content:center;}
.wordmark img{display:block;max-width:${px(640)};max-height:${px(320)};width:auto;height:auto;object-fit:contain;}
.wordmark .text{font-family:KitHeading;font-size:${px(96)};font-weight:800;letter-spacing:-1px;line-height:1.05;}
.hl{font-family:KitHeading;font-size:${px(72)};line-height:1.08;text-align:center;max-width:${px(900)};margin-bottom:${px(70)};}
.proof-row{display:flex;flex-direction:column;align-items:center;gap:${px(18)};margin-bottom:${px(100)};}
.proof-row .stars{font-size:${px(60)};letter-spacing:${px(8)};color:var(--star);line-height:1;}
.proof-row .families{font-weight:700;font-size:${px(36)};}
.trust-trio{display:flex;gap:${px(80)};justify-content:center;align-items:flex-start;margin-bottom:${px(120)};}
.trust-trio .item{display:flex;flex-direction:column;align-items:center;width:${px(240)};}
.trust-trio .badge{width:${px(140)};height:${px(140)};border-radius:50%;background:var(--fg);display:flex;align-items:center;justify-content:center;margin-bottom:${px(24)};}
.trust-trio .badge svg{width:${px(70)};height:${px(70)};fill:var(--bg);}
.trust-trio .label{font-size:${px(32)};line-height:1.25;text-align:center;}
.cta-pill{background:var(--cta-bg);color:var(--cta-fg);padding:${px(32)} ${px(80)};border-radius:${px(80)};font-family:KitHeading;font-weight:700;font-size:${px(48)};}
.url{margin-top:${px(40)};font-size:${px(34)};font-weight:600;opacity:.85;}
.footnote{position:absolute;left:${px(90)};right:${px(90)};bottom:${px(310)};font-size:${px(22)};line-height:1.35;text-align:center;opacity:.7;}
</style></head><body>
<div class="wordmark" id="wordmark">${wordmark}</div>${headline}${proof}${benefits}
<div class="cta-pill">${kitCardEsc(cta)}</div>${url ? `<div class="url">${kitCardEsc(url)}</div>` : ''}${footnote}
</body></html>`;
}

/**
 * Renders the card to a `seconds`-long clip `<name>.mp4` (H.264, silent stereo
 * track) and returns {video, logo, background}. As a step's output the clip
 * goes in workDir and `video` is its FileRef; with `scratch` it goes in tmpDir
 * and `video` is only its path. `logo` is the safe zone the logo file covers
 * (null without a logo), `background` the colour the card changed to for it.
 */
async function kitRenderEndCard(ctx, { brand, card, width, height, fps, seconds, name = 'end-card', scratch = false }) {
  if (!ctx.browser) throw ctx.error('needs_missing', 'the end card needs the kit browser');
  const fontCss = await kitCardFontCss(brand, join(ctx.part.dir, 'assets', 'fonts', 'Montserrat-Bold.ttf'));
  let html;
  if (card && card.image) {
    html = `<!doctype html><html><head><style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:${kitCardColors(brand, card).bg};}img{width:100%;height:100%;object-fit:contain;}</style></head><body><img src="${await kitCardDataUri(card.image)}"></body></html>`;
  } else {
    const logoUri = brand.logo ? await kitCardDataUri(brand.logo) : null;
    try {
      html = kitEndCardHtml({ brand, card, width, height, fontCss, logoUri });
    } catch (e) {
      throw ctx.error('bad_input', e.message);
    }
  }
  const browser = await ctx.browser.launch();
  const png = join(ctx.tmpDir, `${name}.png`);
  let fitted = { logo: null, background: null };
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(html);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode()));
    });
    if (!(card && card.image) && brand.logo) {
      const colors = kitCardColors(brand, card || {});
      fitted = await kitCardFitLogo(ctx, page, {
        width,
        height,
        box: KIT_CARD_LOGO_BOXES.classic,
        bg: colors.bg,
        colors: brand.colors || {},
        recolor: (bg) => {
          const c = kitCardColorsOn(brand, card || {}, bg);
          return { '--bg': c.bg, '--fg': c.fg, '--cta-bg': c.ctaBg, '--cta-fg': c.ctaFg };
        },
      });
    }
    await page.screenshot({ path: png, type: 'png' });
  } finally {
    await browser.close();
  }
  await kitFfmpeg(ctx, [
    '-loop',
    '1',
    '-framerate',
    String(fps),
    '-t',
    kitNum(seconds),
    '-i',
    png,
    '-f',
    'lavfi',
    '-t',
    kitNum(seconds),
    '-i',
    'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-vf',
    `scale=${width}:${height},setsar=1,format=yuv420p`,
    '-map',
    '0:v',
    '-map',
    '1:a',
    ...ctx.tools.encodeArgs('h264-master'),
    ...ctx.tools.encodeArgs('aac'),
    '-r',
    String(fps),
    '-t',
    kitNum(seconds),
    join(scratch ? ctx.tmpDir : ctx.workDir, `${name}.mp4`),
  ]);
  const video = scratch ? { path: join(ctx.tmpDir, `${name}.mp4`) } : await ctx.file(`${name}.mp4`, 'video');
  return { video, logo: fitted.logo, background: fitted.background };
}

// ---- end-card/src/layouts.mjs ----
// end-card 1.1.0 layouts beyond the 1.0.1 card ("classic", drawn by
// _lib/end-card.mjs and left unchanged):
//   brandkit   mark (logo) + wordmark + rule + tagline + rows + CTA pill + URL
//   editorial  type only, left aligned: wordmark, rule, tagline, rows, URL; no mark, CTA optional
//   stack      the logo (or wordmark) over the URL
//   statement  the logo over 1 to 3 rows (first in the text colour, the rest in the accent); CTA optional
// The logo (1.1.1) is fitted as in the classic card (_lib/end-card.mjs
// kitCardFitLogo): never recoloured, a flat file background made transparent,
// scaled into the layout's box, and the card recoloured when it would not read.
// Names here are the part's own (not kit-prefixed) and unique in the bundle.

const CARD_LAYOUTS = ['classic', 'brandkit', 'editorial', 'stack', 'statement', 'none'];

const cardHexRe = /^#([0-9a-fA-F]{6})$/;

function cardEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cardLuminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** WCAG contrast ratio of two #rrggbb colours. */
function cardContrast(a, b) {
  const x = cardLuminance(a);
  const y = cardLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function cardHex(value) {
  return typeof value === 'string' && cardHexRe.test(value) ? value : null;
}

/**
 * Near-black or white, whichever has the higher contrast on `hex` (by the
 * actual ratio). On the few mid-greys where neither reaches 4.5:1, pure black
 * is tried too (#777777: white 4.48, #111111 4.2, black 4.69).
 */
function cardBestText(hex) {
  const pick = cardContrast('#111111', hex) >= cardContrast('#ffffff', hex) ? '#111111' : '#ffffff';
  if (cardContrast(pick, hex) >= 4.5) return pick;
  return cardContrast('#000000', hex) > cardContrast(pick, hex) ? '#000000' : pick;
}

const cardMimeRe = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/i;

/** A file's MIME type when it is a plain type/subtype, else application/octet-stream (it ends up in markup). */
function cardSafeMime(mime) {
  return typeof mime === 'string' && cardMimeRe.test(mime) ? mime : 'application/octet-stream';
}

function cardSafeFile(file) {
  return file && typeof file === 'object' && file.mime !== undefined ? { ...file, mime: cardSafeMime(file.mime) } : file;
}

/**
 * The brand with every file MIME type reduced to a plain type/subtype, so no
 * brand value can break out of a data: URI in the page (logo src, @font-face).
 * Used for every layout, classic included.
 */
function cardSafeBrand(brand) {
  const out = { ...brand };
  if (brand.logo) out.logo = cardSafeFile(brand.logo);
  if (brand.fonts) out.fonts = Object.fromEntries(Object.entries(brand.fonts).map(([k, f]) => [k, cardSafeFile(f)]));
  return out;
}

/**
 * Colours for the 1.1.0 layouts. An explicit step colour always wins. A brand
 * colour is used only when it reads on the card (text 4.5:1, accent 3:1), so a
 * dark statement card never gets the brand's dark text colour.
 */
function cardLayoutColors(brand, card = {}) {
  const c = brand.colors || {};
  const bg = cardHex(card.background) || cardHex(c.background) || '#ffffff';
  const reads = (hex, min) => (hex && cardContrast(hex, bg) >= min ? hex : null);
  const fg = cardHex(card.foreground) || reads(cardHex(c.text), 4.5) || cardBestText(bg);
  const accent = cardHex(card.accent) || reads(cardHex(c.primary), 3) || reads(cardHex(c.secondary), 3) || fg;
  const ctaBg = cardHex(card.cta_background) || cardHex(c.primary) || fg;
  return { bg, fg, accent, ctaBg, ctaFg: cardBestText(ctaBg) };
}

/**
 * The layout colours on a background the logo forced: a step colour is kept only when it reads on it (text
 * 4.5:1, accent 3:1, the CTA pill 1.5:1 against the card), so nothing vanishes into the new card.
 */
function cardLayoutColorsOn(brand, card, bg) {
  const keep = (hex, min) => (cardHex(hex) && cardContrast(hex, bg) >= min ? hex : undefined);
  const col = cardLayoutColors(brand, { ...card, background: bg, foreground: keep(card.foreground, 4.5), accent: keep(card.accent, 3), cta_background: keep(card.cta_background, 1.5) });
  if (cardContrast(col.ctaBg, bg) < 1.5) {
    col.ctaBg = col.fg;
    col.ctaFg = cardBestText(col.fg);
  }
  return col;
}

/** Rows from a list or a ' | '-joined answer: trimmed, empty ones dropped. */
function cardRows(rows) {
  if (rows === undefined || rows === null) return [];
  const list = typeof rows === 'string' ? rows.split('|') : rows;
  return list.map((r) => String(r).trim()).filter(Boolean);
}

/**
 * The copy a layout draws, or an Error naming what is wrong. Inputs a layout
 * cannot show are refused rather than silently dropped.
 */
function cardLayoutCopy(layout, brand, card = {}) {
  const ignored = [];
  if (card.proof) ignored.push('proof');
  if (card.benefits && card.benefits.length) ignored.push('benefits');
  if (card.image) ignored.push('image');
  if (layout === 'stack') {
    if (card.headline) ignored.push('headline');
    if (card.cta_text) ignored.push('cta_text');
  }
  const rows = cardRows(card.rows);
  if (card.rows !== undefined && layout === 'stack') ignored.push('rows');
  if (ignored.length) return new Error(`layout ${layout} does not draw ${ignored.join(', ')}`);
  const brandCta = brand.cta && brand.cta.text;
  const brandUrl = (brand.cta && brand.cta.url) || '';
  const copy = { headline: card.headline || '', rows, footnote: card.footnote || '' };
  if (layout === 'brandkit') {
    copy.cta = card.cta_text || brandCta;
    if (!copy.cta) return new Error('the brandkit card needs a call to action (cta_text or brand.cta.text)');
    copy.url = card.url_text ?? brandUrl;
  } else if (layout === 'editorial') {
    copy.cta = card.cta_text || '';
    copy.url = card.url_text ?? brandUrl;
  } else if (layout === 'stack') {
    copy.cta = '';
    copy.url = card.url_text ?? brandUrl;
  } else if (layout === 'statement') {
    if (rows.length && copy.headline) return new Error('the statement card draws rows; give the headline as the first row');
    if (!rows.length && !copy.headline) return new Error('the statement card needs 1 to 3 rows (rows, or a headline)');
    if (!rows.length) copy.rows = [copy.headline];
    copy.headline = '';
    copy.cta = card.cta_text || '';
    copy.url = card.url_text ?? '';
  } else {
    return new Error(`unknown layout ${layout}`);
  }
  // Checked on the rows the card draws, so a statement's headline-as-row obeys the same limits.
  if (copy.rows.length > 3) return new Error(`at most 3 rows, got ${copy.rows.length}`);
  for (const r of copy.rows) if ([...r].length > 60) return new Error(`a row is longer than 60 characters: "${r.slice(0, 20)}…"`);
  return copy;
}

/** The page for a 1.1.0 layout at width x height. Throws Error on missing or unusable copy. */
function cardLayoutHtml({ layout, brand, card = {}, width, height, fontCss = '', logoUri = null }) {
  const copy = cardLayoutCopy(layout, brand, card);
  if (copy instanceof Error) throw copy;
  const s = Math.min(width / 1080, height / 1920);
  const px = (v) => `${+(v * s).toFixed(2)}px`;
  const col = cardLayoutColors(brand, card);
  const name = `<div class="name">${cardEsc(brand.name)}</div>`;
  const logo = logoUri ? `<div class="mark" id="wordmark"><img id="logo" src="${logoUri}" alt=""></div>` : '';
  const rule = '<div class="rule"></div>';
  const headline = copy.headline ? `<div class="hl">${cardEsc(copy.headline)}</div>` : '';
  const rows = copy.rows.length ? `<div class="rows">${copy.rows.map((r, i) => `<div class="row r${i}">${cardEsc(r)}</div>`).join('')}</div>` : '';
  const url = copy.url ? `<div class="url">${cardEsc(copy.url)}</div>` : '';
  const footnote = copy.footnote ? `<div class="footnote">${cardEsc(copy.footnote)}</div>` : '';
  let body;
  let css;
  if (layout === 'brandkit') {
    body = `<div class="col">${logo}${name}${rule}${headline}${rows}<div class="cta-pill">${cardEsc(copy.cta)}</div>${url}</div>`;
    css = `.col{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 ${px(90)};}
.mark{margin-bottom:${px(48)};}.mark img{max-width:${px(520)};max-height:${px(300)};}
.name{font-family:KitHeading;font-size:${px(88)};font-weight:800;line-height:1.05;letter-spacing:-1px;}
.rule{width:${px(140)};height:${px(8)};background:var(--accent);margin:${px(56)} 0;border-radius:${px(4)};}
.hl{font-size:${px(56)};line-height:1.15;max-width:${px(900)};margin-bottom:${px(40)};}
.rows{margin-bottom:${px(40)};}.row{font-size:${px(40)};line-height:1.35;}
.cta-pill{margin-top:${px(60)};background:var(--cta-bg);color:var(--cta-fg);padding:${px(32)} ${px(80)};border-radius:${px(80)};font-family:KitHeading;font-weight:700;font-size:${px(48)};}
.url{margin-top:${px(40)};font-size:${px(34)};font-weight:600;opacity:.85;}`;
  } else if (layout === 'editorial') {
    const cta = copy.cta ? `<div class="cta">${cardEsc(copy.cta)}</div>` : '';
    body = `<div class="col">${name}${rule}${headline}${rows}${cta}${url}</div>`;
    css = `body{align-items:flex-start;}
.col{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:0 ${px(96)};max-width:100%;}
.name{font-family:KitHeading;font-size:${px(132)};font-weight:800;line-height:1;letter-spacing:-2px;}
.rule{width:${px(180)};height:${px(8)};background:var(--accent);margin:${px(56)} 0 ${px(48)};}
.hl{font-size:${px(60)};line-height:1.12;max-width:${px(860)};margin-bottom:${px(36)};}
.row{font-size:${px(44)};line-height:1.3;max-width:${px(860)};}
.rows{margin-bottom:${px(36)};}
.cta{margin-top:${px(24)};font-family:KitHeading;font-weight:700;font-size:${px(44)};color:var(--accent);}
.url{margin-top:${px(28)};font-size:${px(34)};font-weight:600;opacity:.8;}`;
  } else if (layout === 'stack') {
    const mark = logoUri ? logo : `<div id="wordmark">${name}</div>`;
    body = `<div class="col">${mark}${url}</div>`;
    css = `.col{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 ${px(90)};}
.mark img{max-width:${px(720)};max-height:${px(420)};}
.name{font-family:KitHeading;font-size:${px(112)};font-weight:800;line-height:1.05;letter-spacing:-1px;}
.url{margin-top:${px(72)};font-size:${px(44)};font-weight:600;}`;
  } else {
    const mark = logoUri ? logo : `<div id="wordmark">${name}</div>`;
    const cta = copy.cta ? `<div class="cta">${cardEsc(copy.cta)}</div>` : '';
    body = `<div class="col">${mark}${rows}${cta}${url}</div>`;
    css = `body{justify-content:flex-start;}
.col{display:flex;flex-direction:column;align-items:center;text-align:center;padding:${px(400)} ${px(80)} 0;}
.mark{margin-bottom:${px(110)};}.mark img{max-width:${px(720)};max-height:${px(300)};}
#wordmark{margin-bottom:${px(110)};}
.name{font-family:KitHeading;font-size:${px(110)};font-weight:800;line-height:1.05;}
.row{font-family:KitHeading;font-weight:800;font-size:${px(66)};line-height:${px(86)};color:var(--accent);-webkit-text-stroke:${px(5)} rgba(0,0,0,.6);paint-order:stroke fill;}
.row.r0{color:var(--fg);}
.cta{margin-top:${px(60)};font-family:KitHeading;font-weight:700;font-size:${px(44)};}
.url{margin-top:${px(28)};font-size:${px(34)};font-weight:600;opacity:.85;}`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
:root{--bg:${col.bg};--fg:${col.fg};--accent:${col.accent};--cta-bg:${col.ctaBg};--cta-fg:${col.ctaFg};}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:${width}px;height:${height}px;background:var(--bg);color:var(--fg);font-family:KitBody;overflow:hidden;}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;}
.mark img{width:auto;height:auto;object-fit:contain;display:block;}
.footnote{position:absolute;left:${px(90)};right:${px(90)};bottom:${px(310)};font-size:${px(22)};line-height:1.35;text-align:center;opacity:.7;}
${css}
</style></head><body>${body}${footnote}</body></html>`;
}

async function cardDataUri(file) {
  const bytes = await readFile(file.path);
  return `data:${cardSafeMime(file.mime)};base64,${bytes.toString('base64')}`;
}

/**
 * Renders a 1.1.0 layout to `<name>.mp4` in workDir (H.264, silent stereo track), as 1.0.1 does for its card.
 * Returns {video, logo, background} as kitRenderEndCard does.
 */
async function cardRenderLayout(ctx, { layout, brand, card, width, height, fps, seconds, name = 'end-card' }) {
  const copy = cardLayoutCopy(layout, brand, card);
  if (copy instanceof Error) throw ctx.error('bad_input', copy.message);
  if (!ctx.browser) throw ctx.error('needs_missing', 'the end card needs the kit browser');
  const fontCss = await kitCardFontCss(brand, join(ctx.part.dir, 'assets', 'fonts', 'Montserrat-Bold.ttf'));
  const drawsLogo = layout !== 'editorial';
  const logoUri = drawsLogo && brand.logo ? await cardDataUri(brand.logo) : null;
  const html = cardLayoutHtml({ layout, brand, card, width, height, fontCss, logoUri });
  const browser = await ctx.browser.launch();
  const png = join(ctx.tmpDir, `${name}.png`);
  let fitted = { logo: null, background: null };
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(html);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode()));
    });
    if (logoUri) {
      fitted = await kitCardFitLogo(ctx, page, {
        width,
        height,
        box: KIT_CARD_LOGO_BOXES[layout],
        bg: cardLayoutColors(brand, card).bg,
        colors: brand.colors || {},
        recolor: (bg) => {
          const c = cardLayoutColorsOn(brand, card, bg);
          return { '--bg': c.bg, '--fg': c.fg, '--accent': c.accent, '--cta-bg': c.ctaBg, '--cta-fg': c.ctaFg };
        },
      });
    }
    await page.screenshot({ path: png, type: 'png' });
  } finally {
    await browser.close();
  }
  const out = join(ctx.workDir, `${name}.mp4`);
  await kitFfmpeg(ctx, [
    '-loop', '1', '-framerate', String(fps), '-t', kitNum(seconds), '-i', png,
    '-f', 'lavfi', '-t', kitNum(seconds), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-vf', `scale=${width}:${height},setsar=1,format=yuv420p`,
    '-map', '0:v', '-map', '1:a',
    ...ctx.tools.encodeArgs('h264-master'),
    ...ctx.tools.encodeArgs('aac'),
    '-r', String(fps), '-t', kitNum(seconds),
    out,
  ]);
  return { video: await ctx.file(`${name}.mp4`, 'video'), logo: fitted.logo, background: fitted.background };
}

// ---- end-card/src/part.mjs ----
// end-card: the brand end card as a clip, for styles that draw the card in
// their own timeline (so the music can run under it). The same renderer sits
// inside the brand layer, which appends the card when no step drew one.
// 1.1.1: the logo is fitted to the card (_lib/end-card.mjs kitCardFitLogo) in
// every layout that draws it, and its box goes on the timeline as safe_zones logo.

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { width, height } = inputs;
  const fps = inputs.fps ?? 30;
  const seconds = inputs.seconds ?? 2.5;
  if (width % 2 || height % 2) throw ctx.error('bad_input', 'width and height must be even');
  const layout = inputs.layout ?? 'classic';
  // layout none (a style's "no card" answer): no card and no outputs, so the
  // kit leaves out every step input bound to them (the skip-blank pattern).
  if (layout === 'none') {
    ctx.log.info('layout none: no end card');
    ctx.progress({ done: 1, total: 1 });
    return kitCheckOutputs(ctx, manifest, {});
  }
  if (layout === 'classic') {
    const extra = ['rows', 'accent'].filter((k) => inputs[k] !== undefined);
    if (extra.length) throw ctx.error('bad_input', `layout classic does not draw ${extra.join(', ')}`);
  }
  const card = {
    background: inputs.background,
    foreground: inputs.foreground,
    cta_background: inputs.cta_background,
    cta_text: inputs.cta_text,
    url_text: inputs.url_text,
    headline: inputs.headline,
    proof: inputs.proof,
    benefits: inputs.benefits,
    footnote: inputs.footnote,
    image: cardSafeFile(inputs.image),
    rows: inputs.rows,
    accent: inputs.accent,
  };
  // File MIME types reach the page inside data: URIs; keep them to a plain type/subtype for every layout.
  const brand = cardSafeBrand(inputs.brand);
  const drawn =
    layout === 'classic'
      ? await kitRenderEndCard(ctx, { brand, card, width, height, fps, seconds })
      : await cardRenderLayout(ctx, { layout, brand, card, width, height, fps, seconds });
  const video = drawn.video;
  ctx.progress({ done: 1, total: 1 });
  const timeline = { duration_s: seconds, width, height, fps, scenes: [{ id: 'end-card', start_s: 0, end_s: seconds }], speech: [], end_card: { start_s: 0, end_s: seconds } };
  // Where the logo is, so the final check looks for it there (assemble carries it onto the cut).
  if (drawn.logo) timeline.safe_zones = [drawn.logo];
  return kitCheckOutputs(ctx, manifest, { video, seconds, timeline });
}
