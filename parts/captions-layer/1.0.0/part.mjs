// Built from captions-layer/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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
    'ebur128=peak=true',
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
  let name = base ? `${prefix}-${base}` : `${prefix}-${index + 1}`;
  if (!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(name) || (used && used.has(name))) name = `${prefix}-${index + 1}`;
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

// ---- captions-layer/src/part.mjs ----
// captions-layer: burns word-timed captions onto the cut and returns a WebVTT
// of exactly what it drew. caption-burn's one caption rule, in JavaScript:
// one or two words at a time on a dark rounded plate, white bold type, the
// plate centred at 0.62 of the height and never outside the 4:5 feed crop
// (y 0.148 to 0.852) or the timeline's caption safe zone; the last caption
// holds to the final frame (it is the call to action). Timings come from the
// timeline's speech words; only when there are none is the cut's own audio
// transcribed (fal Whisper, the layer's one paid call), and a spoken word the
// transcript writes differently is placed between its neighbours. Plates are
// drawn in the kit's Chromium with the brand's font (or the bundled one) and
// overlaid with ffmpeg, so no libass or system font is needed.

const PER = 2;
const CAP = 0.019;
const Y = 0.62;
const SAFE_TOP = 285 / 1920;
const SAFE_BOTTOM = 1635 / 1920;
const PLATE = 'rgba(58,58,60,0.839)';

function bare(w) {
  return String(w).replace(/[^\p{L}\p{N}']/gu, '').toLowerCase();
}

function syllables(w) {
  const s = String(w).toLowerCase().replace(/[^a-z]/g, '');
  const n = s ? (s.match(/[aeiouy]+/g) || []).length : 1;
  return Math.max(1, n - (s.endsWith('e') && n > 1 ? 1 : 0));
}

/** Groups of 1 to PER words, the way caption-burn groups them for a line spanning `span` seconds. */
function groupWords(words, span) {
  const n = Math.max(1, Math.min(PER, Math.round(words.length / Math.max(1, span / 0.6))));
  const groups = [];
  for (let i = 0; i < words.length; i += n) groups.push(words.slice(i, i + n));
  if (groups.length > 1 && groups.at(-1).length === 1 && groups.at(-2).length < PER + 1) {
    const tail = groups.pop();
    groups[groups.length - 1] = groups.at(-1).concat(tail);
  }
  return groups;
}

/** Written words with times for one line, from heard words (today's caption-burn matching), or null. */
function placeHeard(text, start, end, heard, from) {
  const words = text.split(/\s+/).filter(Boolean);
  let j = from;
  const spans = words.map((w) => {
    const k = bare(w);
    let hit = null;
    for (let x = j; x < Math.min(j + 5, heard.length); x++) {
      if (heard[x].key === k) {
        hit = x;
        break;
      }
    }
    if (hit === null) return null;
    j = hit + 1;
    return { start: heard[hit].start, end: heard[hit].end };
  });
  const known = spans.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
  if (known.length < Math.max(1, Math.floor((words.length * 2) / 3))) return null;
  for (let i = 0; i < spans.length; i++) {
    if (spans[i]) continue;
    const lo = Math.max(-1, ...known.filter((k) => k < i));
    const upList = known.filter((k) => k > i);
    const up = upList.length ? Math.min(...upList) : null;
    const t0 = lo >= 0 ? spans[lo].end : start;
    const t1 = up !== null ? spans[up].start : end;
    const gap = (up !== null ? up : words.length) - lo - 1;
    const step = (t1 - t0) / Math.max(gap, 1);
    const pos = i - lo;
    spans[i] = { start: t0 + step * (pos - 1), end: t0 + step * pos };
  }
  return { words: words.map((w, i) => ({ text: w, start_s: spans[i].start, end_s: spans[i].end })), next: j };
}

/** Times from syllables inside the line, for a line the transcript could not place. */
function estimateWords(text, start, end) {
  const words = text.split(/\s+/).filter(Boolean);
  const total = words.reduce((a, w) => a + syllables(w), 0);
  let t = start;
  return words.map((w) => {
    const d = ((end - start) * syllables(w)) / total;
    const out = { text: w, start_s: t, end_s: Math.min(t + d, end) };
    t += d;
    return out;
  });
}

function vttTime(s) {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const pad = (v, n = 2) => String(v).padStart(n, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}.${pad(ms % 1000, 3)}`;
}

async function transcribe(ctx, video) {
  if (!ctx.line) throw ctx.error('needs_missing', 'transcribing needs the private line');
  await kitFfmpeg(ctx, ['-i', video.path, '-map', '0:a:0', '-ac', '1', ...ctx.tools.encodeArgs('aac'), join(ctx.tmpDir, 'speech.m4a')]);
  const audio = await ctx.file(join(ctx.tmpDir.slice(ctx.workDir.length + 1), 'speech.m4a'), 'audio');
  const result = await ctx.line.order({
    piece: 'transcribe',
    provider: 'fal',
    path: 'fal-ai/whisper',
    body: { audio_url: audio, task: 'transcribe', language: 'en', chunk_level: 'word' },
    results: [],
  });
  const chunks = (result.json && result.json.chunks) || [];
  return chunks
    .map((c) => ({ text: String(c.text || '').trim(), start: c.timestamp && c.timestamp[0], end: c.timestamp && c.timestamp[1] }))
    .filter((w) => w.text && Number.isFinite(w.start) && Number.isFinite(w.end))
    .map((w) => ({ ...w, key: bare(w.text) }));
}

/** Every caption cue [{words, start_s, end_s}] for the cut, last one held to the end. */
async function buildCues(ctx, inputs, duration) {
  const speech = (inputs.timeline.speech || []).filter((s) => String(s.text || '').trim());
  let lines;
  if (speech.length && speech.every((s) => (s.words || []).length)) {
    lines = speech.map((s) => ({ start: s.start_s, end: s.end_s, words: s.words }));
  } else {
    const heard = await transcribe(ctx, inputs.video);
    if (speech.length) {
      let from = 0;
      lines = speech.map((s) => {
        const placed = (s.words || []).length ? { words: s.words, next: from } : placeHeard(s.text, s.start_s, s.end_s, heard, from);
        if (placed) {
          from = placed.next;
          return { start: s.start_s, end: s.end_s, words: placed.words };
        }
        ctx.log.warn('caption line timed from syllables', { scene_id: s.scene_id || null });
        return { start: s.start_s, end: s.end_s, words: estimateWords(s.text, s.start_s, s.end_s) };
      });
    } else {
      if (!heard.length) throw ctx.error('bad_input', 'nothing was said to caption');
      lines = [{ start: heard[0].start, end: heard.at(-1).end, words: heard.map((w) => ({ text: w.text, start_s: w.start, end_s: w.end })) }];
    }
  }
  const cues = [];
  for (const line of lines) {
    for (const g of groupWords(line.words, line.end - line.start)) {
      cues.push({ words: g.map((w) => w.text), start_s: g[0].start_s, end_s: g.at(-1).end_s });
    }
  }
  if (!cues.length) throw ctx.error('bad_input', 'nothing was said to caption');
  cues.sort((a, b) => a.start_s - b.start_s);
  for (let i = 0; i < cues.length - 1; i++) {
    // Close small gaps so captions do not flicker off, never overlapping the next.
    cues[i].end_s = Math.max(cues[i].end_s, Math.min(cues[i + 1].start_s, cues[i].end_s + 0.5));
    cues[i].end_s = Math.min(cues[i].end_s, cues[i + 1].start_s);
  }
  cues.at(-1).end_s = Math.max(cues.at(-1).end_s, duration);
  for (const c of cues) {
    c.start_s = Math.max(0, Math.min(c.start_s, duration));
    c.end_s = Math.max(c.start_s, Math.min(c.end_s, duration));
  }
  return { cues: cues.filter((c) => c.end_s - c.start_s > 1e-3), words: lines.flatMap((l) => l.words) };
}

function fontFormat(path) {
  const m = /\.(ttf|otf|woff2?)$/i.exec(path || '');
  return { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' }[(m ? m[1] : 'ttf').toLowerCase()];
}

/**
 * The caption band: inside the feed crop, clear of the TikTok/Reels controls (top 220, bottom 400 and
 * right 140 px at 1080x1920, kept symmetric so captions stay centred) and, when the timeline names one,
 * inside the caption safe zone.
 */
function band(timeline, W, H) {
  const side = (140 * W) / 1080;
  let top = Math.max(SAFE_TOP, 220 / 1920) * H;
  let bottom = Math.min(SAFE_BOTTOM, (1920 - 400) / 1920) * H;
  let left = side;
  let right = W - side;
  const zone = (timeline.safe_zones || []).find((z) => z.use === 'captions');
  if (zone) {
    top = Math.max(top, zone.y);
    bottom = Math.min(bottom, zone.y + zone.h);
    left = Math.max(left, zone.x);
    right = Math.min(right, zone.x + zone.w);
  }
  return { top, bottom, left, right };
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  if (!ctx.browser) throw ctx.error('needs_missing', 'captions are drawn in the kit browser');
  const info = await ctx.tools.probe(inputs.video.path);
  const W = info.width;
  const H = info.height;
  const fps = info.fps || inputs.timeline.fps || 30;
  const duration = await kitDuration(ctx, inputs.video);
  const { cues, words } = await buildCues(ctx, inputs, duration);
  const px = Math.round(CAP * H * 1.38);
  const zone = band(inputs.timeline, W, H);
  if (zone.bottom - zone.top < px * 1.5) throw ctx.error('bad_input', 'the caption safe zone is too small for a caption');
  const fonts = inputs.brand.fonts || {};
  const font = fonts.body || fonts.heading || { path: join(ctx.part.dir, 'assets', 'fonts', 'Montserrat-Bold.ttf') };
  const fontUri = `data:font/ttf;base64,${(await readFile(font.path)).toString('base64')}`;
  const maxWidth = zone.right - zone.left;
  const page = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:KitCaption;src:url(${fontUri}) format('${fontFormat(font.path)}');font-display:block;}
html,body{margin:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden;}
#cap{position:absolute;left:0;top:0;display:inline-block;white-space:nowrap;font-family:KitCaption;font-weight:700;font-size:${px}px;line-height:1.15;color:#fff;background:${PLATE};padding:${Math.round(px * 0.22)}px ${Math.round(px * 0.46)}px;border-radius:${Math.round(px * 0.3)}px;max-width:${Math.round(maxWidth)}px;}
#cap.off{display:none;}
</style></head><body><div id="cap" class="off"></div></body></html>`;

  const browser = await ctx.browser.launch();
  const drawn = new Map();
  const blank = join(ctx.tmpDir, 'blank.png');
  try {
    const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await p.setContent(page);
    await p.evaluate(async () => {
      await document.fonts.ready;
    });
    await p.screenshot({ path: blank, type: 'png', omitBackground: true });
    for (const c of cues) {
      const text = c.words.join(' ');
      if (drawn.has(text)) continue;
      const placed = await p.evaluate(
        ({ text, W, top, bottom, y, left, right }) => {
          const el = document.getElementById('cap');
          el.textContent = text;
          el.classList.remove('off');
          // A caption wider than the band shrinks to fit rather than wrapping or leaving the frame.
          el.style.transform = '';
          const r = el.getBoundingClientRect();
          const room = right - left;
          const scale = r.width > room ? room / r.width : 1;
          const w = r.width * scale;
          const h = r.height * scale;
          const t = Math.min(Math.max(y - h / 2, top), bottom - h);
          const l = left + (right - left - w) / 2;
          el.style.transformOrigin = '0 0';
          el.style.transform = `translate(${l}px, ${t}px) scale(${scale})`;
          return { x: l, y: t, w, h };
        },
        { text, W, top: zone.top, bottom: zone.bottom, y: Y * H, left: zone.left, right: zone.right },
      );
      const file = join(ctx.tmpDir, `cap-${drawn.size}.png`);
      await p.screenshot({ path: file, type: 'png', omitBackground: true });
      drawn.set(text, { file, box: placed });
    }
  } finally {
    await browser.close();
  }

  // One image per interval between cue edges, each held for its own length.
  const edges = [...new Set([0, duration, ...cues.flatMap((c) => [c.start_s, c.end_s])])].filter((t) => t >= 0 && t <= duration).sort((a, b) => a - b);
  const list = [];
  for (let i = 0; i + 1 < edges.length; i++) {
    const [t0, t1] = [edges[i], edges[i + 1]];
    if (t1 - t0 < 1e-3) continue;
    const mid = (t0 + t1) / 2;
    const cue = cues.find((c) => c.start_s <= mid && mid < c.end_s);
    const file = cue ? drawn.get(cue.words.join(' ')).file : blank;
    list.push(`file '${file.replace(/'/g, "'\\''")}'`, `duration ${kitNum(t1 - t0, 4)}`);
  }
  list.push(list.at(-2));
  await writeFile(join(ctx.tmpDir, 'cues.txt'), `${list.join('\n')}\n`);
  await kitFfmpeg(ctx, [
    '-i',
    inputs.video.path,
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    join(ctx.tmpDir, 'cues.txt'),
    '-filter_complex',
    `[1:v]fps=${fps},format=rgba[c];[0:v][c]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]`,
    '-map',
    '[v]',
    '-map',
    '0:a?',
    ...ctx.tools.encodeArgs('h264-master'),
    '-c:a',
    'copy',
    join(ctx.workDir, 'captioned.mp4'),
  ]);

  const vtt = ['WEBVTT', ''];
  cues.forEach((c, i) => vtt.push(String(i + 1), `${vttTime(c.start_s)} --> ${vttTime(c.end_s)}`, c.words.join(' '), ''));
  await writeFile(join(ctx.workDir, 'captions.vtt'), vtt.join('\n'));
  const record = {
    words: words.map((w) => ({ text: w.text, start_s: +w.start_s.toFixed(3), end_s: +w.end_s.toFixed(3) })),
    cues: cues.map((c) => ({ text: c.words.join(' '), start_s: +c.start_s.toFixed(3), end_s: +c.end_s.toFixed(3), box: drawn.get(c.words.join(' ')).box })),
  };
  await writeFile(join(ctx.workDir, 'words.json'), `${JSON.stringify(record, null, 1)}\n`);
  const timeline = { ...inputs.timeline };
  if (!(timeline.safe_zones || []).some((z) => z.use === 'captions')) {
    timeline.safe_zones = [...(timeline.safe_zones || []), { use: 'captions', x: Math.round(zone.left), y: Math.round(zone.top), w: Math.round(zone.right - zone.left), h: Math.round(zone.bottom - zone.top) }];
  }
  return kitCheckOutputs(ctx, manifest, {
    video: await ctx.file('captioned.mp4', 'video'),
    timeline,
    captions: await ctx.file('captions.vtt', 'subtitles'),
    words: await ctx.file('words.json', 'json'),
  });
}
