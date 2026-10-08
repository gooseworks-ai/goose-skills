// Built from brand-layer/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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
// The brand end card, drawn in the kit's Chromium: the logo file as-is (never
// recoloured or redrawn; a low-contrast logo sits on a plate instead), the
// brand's colours and fonts, an optional proof row (stars only with approved
// proof text), up to three benefits, the call to action and the URL. Today's
// render-imessage-chat end card, made data-only. Shared by the end-card part
// and the brand layer. Every top-level name starts with `kit`.

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
.wordmark{width:${px(560)};max-width:${px(640)};max-height:${px(300)};margin-bottom:${px(90)};text-align:center;display:flex;justify-content:center;}
.wordmark.plate{background:var(--plate);padding:${px(36)} ${px(48)};border-radius:${px(32)};width:auto;}
.wordmark img{max-width:${px(560)};max-height:${px(300)};width:auto;height:auto;object-fit:contain;}
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
 * track). As a step's output it goes in workDir and the FileRef comes back;
 * with `scratch` it goes in tmpDir and only its path comes back.
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
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(html);
    const plate = await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode()));
      // A logo that barely contrasts with the card gets a plate behind it; the file itself is never changed.
      const img = document.getElementById('logo');
      if (!img) return null;
      const lum = (r, g, b) =>
        [r, g, b]
          .map((v) => {
            const x = v / 255;
            return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          })
          .reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0);
      const bgHex = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      const n = parseInt(bgHex.slice(1), 16);
      const bg = lum((n >> 16) & 255, (n >> 8) & 255, n & 255);
      const cv = document.createElement('canvas');
      cv.width = 200;
      cv.height = Math.max(1, Math.round((200 * img.naturalHeight) / Math.max(1, img.naturalWidth)));
      const cx = cv.getContext('2d');
      cx.drawImage(img, 0, 0, cv.width, cv.height);
      const d = cx.getImageData(0, 0, cv.width, cv.height).data;
      let sum = 0;
      let count = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 128) {
          sum += lum(d[i], d[i + 1], d[i + 2]);
          count++;
        }
      }
      if (!count) return null;
      const logo = sum / count;
      const ratio = (Math.max(logo, bg) + 0.05) / (Math.min(logo, bg) + 0.05);
      if (ratio >= 3) return null;
      const box = document.getElementById('wordmark');
      box.style.setProperty('--plate', logo > 0.5 ? '#111111' : '#ffffff');
      box.classList.add('plate');
      return +ratio.toFixed(2);
    });
    if (plate !== null) ctx.log.info('end card logo on a plate for contrast', { contrast: plate });
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
  return scratch ? { path: join(ctx.tmpDir, `${name}.mp4`) } : ctx.file(`${name}.mp4`, 'video');
}

// ---- brand-layer/src/part.mjs ----
// brand-layer: ends the video on the brand. When the style says the video
// ends on an end card (expect.end_card) and no timeline step drew one
// (timeline.end_card), it appends the brand end card: the same renderer as
// the end-card part (logo as-is, brand colours and fonts, the call to
// action), crossfaded in over 0.3 s. The cut's own sound plays to its end and
// fades out over that crossfade; the card holds in silence (a style that wants
// the music under the card draws it with end-card before audio-mix).
// Otherwise the cut passes through untouched.

const CARD_S = 2.5;
const XFADE_S = 0.3;

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { video, timeline, expect } = inputs;
  if (!expect.end_card || timeline.end_card) {
    ctx.log.info('brand layer passes the cut through', { end_card_expected: expect.end_card, drawn_by_step: !!timeline.end_card });
    return kitCheckOutputs(ctx, manifest, { video, timeline });
  }
  const info = await ctx.tools.probe(video.path);
  const fps = info.fps || timeline.fps || 30;
  const dur = await kitDuration(ctx, video);
  if (dur <= XFADE_S) throw ctx.error('bad_input', 'the cut is too short to end on a card');
  const card = await kitRenderEndCard(ctx, { brand: inputs.brand, card: {}, width: info.width, height: info.height, fps, seconds: CARD_S, scratch: true });
  const offset = dur - XFADE_S;
  const total = dur + CARD_S - XFADE_S;
  const audio = info.has_audio
    ? `[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,afade=t=out:st=${kitNum(offset)}:d=${XFADE_S},apad,atrim=0:${kitNum(total)}[a]`
    : `anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${kitNum(total)}[a]`;
  await kitFfmpeg(ctx, [
    '-i',
    video.path,
    '-i',
    card.path,
    '-filter_complex',
    `[0:v]fps=${fps},settb=AVTB,setsar=1,format=yuv420p[c];[1:v]fps=${fps},settb=AVTB,setsar=1,format=yuv420p[e];` +
      `[c][e]xfade=transition=fade:duration=${XFADE_S}:offset=${kitNum(offset)}[v];${audio}`,
    '-map',
    '[v]',
    '-map',
    '[a]',
    ...ctx.tools.encodeArgs('h264-master'),
    ...ctx.tools.encodeArgs('aac'),
    '-t',
    kitNum(total),
    join(ctx.workDir, 'branded.mp4'),
  ]);
  const out = await ctx.file('branded.mp4', 'video');
  const next = {
    ...timeline,
    duration_s: +total.toFixed(3),
    scenes: [...timeline.scenes, { id: 'end-card', start_s: +offset.toFixed(3), end_s: +total.toFixed(3) }],
    end_card: { start_s: +offset.toFixed(3), end_s: +total.toFixed(3) },
  };
  return kitCheckOutputs(ctx, manifest, { video: out, timeline: next });
}
