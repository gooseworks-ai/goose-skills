// Built from phone-chat/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

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

// ---- phone-chat/src/skins/imessage.mjs ----
// The iMessage skin: render-imessage-chat (and the create-imessage-mockup page it
// bundles) as one frame-stepped page. A DM or group thread inside a framed
// iPhone with an inset Dynamic Island, the original send/receive sounds, typed
// composer text equal to the sent text, reactions, attachments anywhere, and the
// newest row kept clear of the TikTok/Reels controls (QA-60). Movie time drives
// everything: the page draws the state at `seek(ms)` from one event timeline,
// so browser start-up or machine speed never changes a frame.
// Pure: no imports; every top-level name starts with `im`/`IM_`.

const IM_TIMING = {
  start: 0.4,
  received_gap: 0.75,
  emoji_gap: 0.55,
  typing_dwell: 1,
  self_pre: 0.3,
  send_hold: 0.1,
  attach_dwell: 3.6,
  tail_hold: 1,
  char_per_sec: 15,
  min_type: 0.5,
  max_type: 2,
  scroll_ms: 300,
};
// Phone geometry in unzoomed CSS px. `keep` is the conversation viewport.
const IM_PHONE = { width: 393, height: 852, keep: { left: 11, top: 131, right: 382, bottom: 781 } };
const IM_MARGIN = 16;
const IM_SAFE_GAP = 8;
const IM_AVATAR_COLORS = ['#FF9500', '#34C759', '#5AC8FA', '#AF52DE', '#FF2D55', '#5856D6'];
const IM_CUE_GAIN = 0.81;
const IM_SOFT_GAIN = 0.47;

const IM_COLOR = { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' };
const IM_ID = { type: 'string', pattern: '^[A-Za-z0-9_-]{1,40}$' };

const IMESSAGE_THREAD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['mode', 'participants', 'messages'],
  properties: {
    mode: { enum: ['dm', 'group'] },
    title: { type: 'string', maxLength: 40 },
    clock: { type: 'string', pattern: '^[0-9]{1,2}:[0-9]{2}$' },
    dynamic_island: { type: 'boolean' },
    background_image: { type: 'string', pattern: '^[a-z0-9][a-z0-9_-]{0,39}$' },
    zoom: { type: 'number', exclusiveMinimum: 0, maximum: 4 },
    header: {
      type: 'object',
      additionalProperties: false,
      properties: { style: { enum: ['conversation'] }, unread: { type: 'integer', minimum: 0, maximum: 999 } },
    },
    participants: {
      type: 'array',
      minItems: 2,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: {
          id: IM_ID,
          name: { type: 'string', maxLength: 40 },
          self: { type: 'boolean' },
          color: IM_COLOR,
          initials: { type: 'string', maxLength: 3 },
        },
      },
    },
    messages: {
      type: 'array',
      minItems: 1,
      maxItems: 60,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type'],
        properties: {
          id: IM_ID,
          type: { enum: ['text', 'typing', 'attachment', 'timestamp', 'tapback'] },
          from: IM_ID,
          text: { type: 'string', maxLength: 400 },
          delivered: { type: 'boolean' },
          read: { type: 'boolean' },
          image: { type: 'string', pattern: '^[a-z0-9][a-z0-9_-]{0,39}$' },
          presentation: { enum: ['photo', 'rich-link'] },
          title: { type: 'string', maxLength: 80 },
          subtitle: { type: 'string', maxLength: 80 },
          dwell_sec: { type: 'number', minimum: 0.3, maximum: 10 },
          target: IM_ID,
          emoji: { type: 'string', minLength: 1, maxLength: 16 },
          label: { type: 'string', maxLength: 80 },
          bold: { type: 'string', maxLength: 60 },
          light: { type: 'string', maxLength: 60 },
        },
      },
    },
  },
};

const imEmojiOnly = (s) => /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\u{FE0F}|\u{200D}|\s)+$/u.test(s || '');

function imGraphemes(text) {
  return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
}

/** Words as a reader counts them: whitespace-separated tokens. */
function imWords(text) {
  return String(text || '').trim().split(/\s+/u).filter(Boolean).length;
}

function imEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function imIcons(text) {
  if (typeof text !== 'string') throw new Error('The iMessage skin needs its icons.js asset.');
  const icons = {};
  for (const m of text.matchAll(/^\s*([A-Za-z0-9_]+):\s*`([^`]*)`/gm)) icons[m[1]] = m[2];
  for (const name of ['plus', 'mic', 'signal', 'wifi', 'battery', 'backArrow', 'chevron', 'facetime', 'sendArrow']) {
    if (!icons[name]) throw new Error(`The iMessage icons.js asset has no ${name} icon.`);
  }
  return icons;
}

function imValidate(thread, images) {
  const people = thread.participants;
  if (people.filter((p) => p.self).length !== 1) throw new Error('Supply exactly one self participant.');
  const ids = new Set();
  for (const p of people) {
    if (ids.has(p.id)) throw new Error('Participant ids must be unique.');
    ids.add(p.id);
    if (!p.self && !String(p.name || '').trim()) throw new Error(`Set a name for participant ${p.id}; there is no demo-name fallback.`);
  }
  if (thread.mode === 'dm' && people.length !== 2) throw new Error('A DM has two participants; use group for more.');
  if (thread.mode === 'group' && !String(thread.title || '').trim()) throw new Error('A group needs a title.');
  const messages = thread.messages;
  if (!messages.some((m) => m.type === 'text' || m.type === 'attachment')) throw new Error('Supply a conversation with at least one text or attachment.');
  const seen = new Set();
  messages.forEach((m, i) => {
    if (m.type === 'timestamp') return;
    if (!m.id || seen.has(m.id)) throw new Error('Every text, typing, attachment and tapback needs a unique id.');
    seen.add(m.id);
    if (!ids.has(m.from)) throw new Error(`Unknown participant ${m.from} in ${m.id}.`);
    if (m.type === 'text' && !String(m.text || '').trim()) throw new Error(`Message ${m.id} is empty.`);
    if (m.type === 'attachment') {
      if (!m.image) throw new Error(`Attachment ${m.id} needs an image.`);
      if (!images[m.image]) throw new Error(`Attachment ${m.id} names image ${m.image}, which was not supplied.`);
    }
    if (m.type === 'tapback') {
      if (!String(m.emoji || '').trim() || !messages.slice(0, i).some((x) => x.id === m.target && (x.type === 'text' || x.type === 'attachment'))) {
        throw new Error(`Tapback ${m.id} needs an emoji and an earlier message to react to.`);
      }
    }
    if (m.type === 'typing') {
      const next = messages[i + 1];
      if (people.find((p) => p.id === m.from).self || !next || !['text', 'attachment'].includes(next.type) || next.from !== m.from) {
        throw new Error(`Typing ${m.id} must come right before a received message from the same person.`);
      }
    }
  });
  if (thread.background_image && !images[thread.background_image]) throw new Error(`The background image ${thread.background_image} was not supplied.`);
}

function imTimeline(thread, overrides, fps) {
  const T = { ...IM_TIMING };
  for (const [key, value] of Object.entries(overrides || {})) {
    if (!(key in IM_TIMING)) throw new Error(`Unknown iMessage timing ${key}.`);
    T[key] = value;
  }
  for (const [key, value] of Object.entries(T)) if (!Number.isFinite(value) || value < 0) throw new Error(`Timing ${key} must be a finite number, at least 0.`);
  if (!T.char_per_sec || !T.scroll_ms || T.max_type < T.min_type || T.tail_hold < 0.5) {
    throw new Error('Typing and scroll speeds must be positive and the ending hold at least 0.5 s.');
  }
  const snap = (t) => Math.ceil((t - 1e-8) * fps) / fps;
  const self = thread.participants.find((p) => p.self).id;
  const events = [];
  const add = (time, event) => events.push({ t: snap(time), ...event });
  let t = T.start;
  let typing = null;
  for (const m of thread.messages) {
    if (m.type === 'timestamp') continue;
    if (m.type === 'tapback') {
      add(t, { kind: 'tapback', id: m.id, target: m.target, emoji: m.emoji, self: m.from === self, sfx: 'receive', soft: true });
      t += T.emoji_gap;
      continue;
    }
    if (m.type === 'typing') {
      add(t, { kind: 'typing-pop', id: m.id });
      typing = m.id;
      t += T.typing_dwell;
      continue;
    }
    const sent = m.from === self;
    if (sent && m.type === 'text') {
      t += T.self_pre;
      const chars = imGraphemes(m.text).length;
      const dur = Math.min(T.max_type, Math.max(T.min_type, chars / T.char_per_sec));
      add(t, { kind: 'composer', text: m.text, dur });
      t += dur + T.send_hold;
    }
    add(t, { kind: typing ? 'typing-swap' : 'pop', id: m.id, typingId: typing, sfx: sent ? 'send' : 'receive', scroll_ms: T.scroll_ms });
    typing = null;
    if (sent) add(t, { kind: 'composer-clear' });
    t += m.type === 'attachment' ? m.dwell_sec ?? T.attach_dwell : imEmojiOnly(m.text) ? T.emoji_gap : T.received_gap;
  }
  const total = snap(Math.max(t + T.tail_hold, events.at(-1).t + T.scroll_ms / 1000 + 0.5));
  return { events, total };
}

/** The largest phone whose conversation viewport sits inside the safe zone (render-imessage-chat's phoneLayout). */
function imLayout(width, height, userZoom, safe) {
  const P = IM_PHONE;
  const K = IM_PHONE.keep;
  const m = IM_MARGIN;
  const fitZoom = Math.min(width / 514, height / 914);
  if (!safe) {
    const zoom = userZoom || fitZoom;
    return { zoom, left: (width - P.width * zoom) / 2, top: (height - P.height * zoom) / 2, zone: null };
  }
  const zone = { left: safe.left, top: safe.top, right: width - safe.right, bottom: height - safe.bottom };
  const g = IM_SAFE_GAP;
  const z = { left: zone.left ? zone.left + g : 0, top: zone.top + g, right: zone.right - g, bottom: zone.bottom - g };
  const limits = [
    (width - 2 * m) / P.width,
    (height - 2 * m) / P.height,
    (z.bottom - m) / K.bottom,
    (z.right - m) / K.right,
    (z.bottom - z.top) / (K.bottom - K.top),
    (height - m - z.top) / (P.height - K.top),
  ];
  if (z.left) limits.push((width - m - z.left) / (P.width - K.left), (z.right - z.left) / (K.right - K.left));
  const maxZoom = Math.min(...limits);
  if (!(maxZoom > 0)) throw new Error('The safe area leaves no room for the phone.');
  const zoom = Math.min(userZoom || fitZoom, maxZoom);
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const top = clamp((height - P.height * zoom) / 2, Math.max(m, z.top - K.top * zoom), Math.min(height - m - P.height * zoom, z.bottom - K.bottom * zoom));
  const left = clamp((width - P.width * zoom) / 2, Math.max(m, z.left - K.left * zoom), Math.min(width - m - P.width * zoom, z.right - K.right * zoom));
  return { zoom, left, top, zone };
}

function imParticipants(participants) {
  const map = new Map();
  let i = 0;
  for (const p of participants) {
    const color = p.color || IM_AVATAR_COLORS[i++ % IM_AVATAR_COLORS.length];
    const initials = p.initials || String(p.name || '?').trim().slice(0, 1).toUpperCase();
    map.set(p.id, { ...p, color, initials });
  }
  return map;
}

function imText(s) {
  return imEsc(s).replace(/\n/g, '<br>').replace(/\[\[link:([^\]]+)\]\]/g, '<span class="link-detector">$1</span>');
}

function imAvatar(p) {
  return p ? `<div class="avatar-slot"><div class="avatar" style="background:${p.color}">${imEsc(p.initials)}</div></div>` : '<div class="avatar-slot"></div>';
}

function imConversation(thread, people, images) {
  const isGroup = thread.mode === 'group';
  const real = thread.messages.filter((m) => m.type === 'text' || m.type === 'attachment');
  const out = [];
  for (const m of thread.messages) {
    const p = people.get(m.from);
    const idx = real.indexOf(m);
    const first = idx >= 0 && !(real[idx - 1] && real[idx - 1].from === m.from);
    const last = idx >= 0 && !(real[idx + 1] && real[idx + 1].from === m.from);
    const anim = m.id ? ` data-anim-id="${imEsc(m.id)}" data-pending="1"` : '';
    if (m.type === 'timestamp') {
      let bold = m.bold;
      let light = m.light;
      if (m.label && !bold && !light) {
        const lines = m.label.split('\n');
        bold = lines[0];
        light = lines.slice(1).join(' ');
      }
      out.push(`<div class="timestamp">${bold ? `<span class="label-bold">${imEsc(bold)}</span>` : ''}${light ? `<br><span class="label-light">${imEsc(light)}</span>` : ''}</div>`);
    } else if (m.type === 'text') {
      const sent = p.self;
      const side = sent ? 'sent' : 'received';
      let html = '';
      if (!sent && isGroup && first) html += `<div class="sender-name" data-label-id="${imEsc(m.id)}" data-pending="1">${imEsc(p.name)}</div>`;
      html += `<div class="row ${side}${first ? ' first-of-run' : ' tight'}"${anim}>`;
      if (!sent && isGroup) html += last ? imAvatar(p) : '<div class="avatar-slot"></div>';
      html += `<div class="bubble ${side} ${last ? 'has-tail' : ''} ${imEmojiOnly(m.text) ? 'emoji-only' : ''} pop-pending">${imText(m.text)}</div></div>`;
      if (sent && m.delivered !== false && last) {
        html += `<div class="delivered-caption pop-pending" data-pending="1" data-cap-id="${imEsc(m.id)}">${m.read ? '<span class="read">Read</span>' : 'Delivered'}</div>`;
      }
      out.push(html);
    } else if (m.type === 'attachment') {
      const side = p.self ? 'sent' : 'received';
      const label = !p.self && isGroup && first ? `<div class="sender-name" data-label-id="${imEsc(m.id)}" data-pending="1">${imEsc(p.name)}</div>` : '';
      const meta = m.title || m.subtitle ? `<div class="attachment-meta">${m.title ? `<div class="title">${imEsc(m.title)}</div>` : ''}${m.subtitle ? `<div class="subtitle">${imEsc(m.subtitle)}</div>` : ''}</div>` : '';
      out.push(`${label}<div class="row attachment ${side} pop-pending ${m.presentation === 'photo' ? 'photo' : 'rich-link'}"${anim}><div class="attachment-card"><img src="${images[m.image]}" alt=""></div>${meta}</div>`);
    } else if (m.type === 'typing') {
      out.push(`<div class="row received first-of-run"${anim}>${isGroup ? imAvatar(p) : ''}<div class="bubble received has-tail typing pop-pending"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>`);
    }
  }
  return `<div class="conversation"><div class="message-list">${out.join('\n')}</div></div>`;
}

function imHeader(thread, people, icons) {
  if (thread.mode === 'group') {
    const tiles = thread.participants.filter((p) => !p.self).slice(0, 4).map((p) => {
      const meta = people.get(p.id);
      return `<div class="avatar-tile" style="background:${meta.color}">${imEsc(meta.initials)}</div>`;
    });
    return `<div class="group-header"><div class="avatars">${tiles.join('')}</div><div class="group-title">${imEsc(thread.title)}<span class="chevron">${icons.chevron}</span></div></div>`;
  }
  const h = thread.header || { style: 'conversation' };
  const peer = people.get(thread.participants.find((p) => !p.self).id);
  return `<div class="conv-header"><div class="left"><div class="back-btn">${icons.backArrow}</div>${h.unread > 0 ? `<div class="badge-pill">${imEsc(String(h.unread))}</div>` : ''}</div>` +
    `<div class="center"><div class="avatar" style="background:${peer.color}">${imEsc(peer.initials)}</div><div class="name-pill">${imEsc(peer.name)} <span class="chev">${icons.chevron}</span></div></div>` +
    `<div class="right"><div class="facetime-btn">${icons.facetime}</div></div></div>`;
}

// The in-page driver: render-imessage-chat's chat-driver, with seek(ms) on top.
// Serialised into the page as source text, so it stays self-contained.
const IM_DRIVER = String.raw`(() => {
  const rows = [...document.querySelectorAll('[data-anim-id]')];
  const labels = [...document.querySelectorAll('[data-label-id], [data-cap-id]')];
  const find = (id) => rows.find((r) => r.dataset.animId === id);
  const input = document.querySelector('.keyboard .input');
  const emptyInput = input.innerHTML;
  const sc = document.querySelector('.conversation');
  const graphemes = (text) => [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
  const ease = (p) => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
  const reveal = (id, time, now) => {
    const row = find(id);
    row.removeAttribute('data-pending');
    row.style.display = '';
    if (row.classList.contains('sent')) for (const label of labels.filter((l) => l.dataset.capId)) label.setAttribute('data-pending', '1');
    for (const label of labels) if ((label.dataset.labelId || label.dataset.capId) === id) { label.removeAttribute('data-pending'); label.classList.remove('pop-pending'); }
    const bubble = row.querySelector('.bubble') || row;
    bubble.classList.remove('pop-pending');
    row.classList.remove('pop-pending');
    const p = Math.max(0, Math.min(1, (now - time) / 0.24));
    const scale = p < 0.6 ? 0.6 + 0.44 * ease(p / 0.6) : 1.04 - 0.04 * ease((p - 0.6) / 0.4);
    bubble.style.opacity = Math.min(1, p / 0.12);
    bubble.style.transform = 'scale(' + scale + ') translateY(' + 8 * (1 - ease(p)) + 'px)';
    bubble.style.transformOrigin = row.classList.contains('sent') ? 'bottom right' : 'bottom left';
  };
  const renderAt = (now) => {
    document.querySelectorAll('.tapback').forEach((e) => e.remove());
    for (const row of rows) {
      row.style.marginTop = '';
      row.style.position = '';
      row.setAttribute('data-pending', '1');
      row.style.display = '';
      const b = row.querySelector('.bubble') || row;
      b.style.opacity = '';
      b.style.transform = '';
    }
    for (const label of labels) label.setAttribute('data-pending', '1');
    input.classList.remove('has-text');
    input.innerHTML = emptyInput;
    let scroll = null;
    let previousTarget = 0;
    for (const ev of CHAT_TIMELINE) {
      if (ev.t > now + 1e-8) break;
      if (ev.kind === 'pop' || ev.kind === 'typing-pop' || ev.kind === 'typing-swap') {
        if (ev.typingId) find(ev.typingId).style.display = 'none';
        reveal(ev.id, ev.t, now);
        const target = Math.max(0, sc.scrollHeight - sc.clientHeight);
        const current = scroll ? scroll.start + (scroll.target - scroll.start) * ease((ev.t - scroll.t) / scroll.dur) : previousTarget;
        scroll = { t: ev.t, start: current, target, dur: (ev.scroll_ms || 300) / 1000 };
        previousTarget = target;
      } else if (ev.kind === 'tapback') {
        const row = find(ev.target);
        const bubble = row.querySelector('.bubble') || row;
        row.style.marginTop = '32px';
        const badge = document.createElement('span');
        badge.className = 'tapback ' + (row.classList.contains('sent') ? 'on-sent' : 'on-received') + ' ' + (ev.self ? 'mine' : 'theirs');
        badge.textContent = ev.emoji;
        const card = row.querySelector('.bubble') ? null : row.querySelector('.attachment-card');
        if (card) {
          // An attachment clips its own corners, so its reaction hangs off the card from the row.
          row.style.position = 'relative';
          badge.style.top = card.offsetTop - 34 + 'px';
          badge.style.left = (row.classList.contains('sent') ? card.offsetLeft - 24 : card.offsetLeft + card.offsetWidth - 14) + 'px';
          badge.style.right = 'auto';
          row.append(badge);
        } else bubble.append(badge);
        const target = Math.max(0, sc.scrollHeight - sc.clientHeight);
        scroll = { t: ev.t, start: previousTarget, target, dur: 0.3 };
        previousTarget = target;
      } else if (ev.kind === 'composer') {
        input.classList.add('has-text');
        input.innerHTML = '<span class="composer-text" data-composer-text></span><span class="caret"></span><span class="send-btn">' + CHAT_SEND + '</span>';
        const chars = graphemes(ev.text);
        const count = Math.min(chars.length, Math.floor((chars.length * Math.max(0, now - ev.t)) / (ev.dur * 0.9)));
        input.querySelector('[data-composer-text]').textContent = chars.slice(0, count).join('');
        input.querySelector('.caret').style.opacity = Math.floor(now * 2) % 2 ? 0 : 1;
      } else if (ev.kind === 'composer-clear') {
        input.classList.remove('has-text');
        input.innerHTML = emptyInput;
      }
    }
    sc.scrollTop = scroll ? scroll.start + (scroll.target - scroll.start) * ease((now - scroll.t) / scroll.dur) : 0;
    document.querySelectorAll('.typing .dot').forEach((d, i) => { d.style.opacity = 0.45 + (0.5 * (1 + Math.sin(now * 7 - i * 1.5))) / 2; });
  };
  window.__renderAt = renderAt;
  window.seek = (ms) => renderAt(ms / 1000);
  window.__composerText = () => [...input.querySelectorAll('[data-composer-text]')].map((n) => n.textContent).join('');
  window.__safeAreaReport = () => {
    const zone = CHAT_LAYOUT.zone;
    const boxes = [];
    const view = sc.getBoundingClientRect();
    const newest = rows.filter((r) => !r.hasAttribute('data-pending') && r.style.display !== 'none').at(-1);
    if (newest) {
      const r = newest.getBoundingClientRect();
      const b = { left: Math.max(r.left, view.left), top: Math.max(r.top, view.top), right: Math.min(r.right, view.right), bottom: Math.min(r.bottom, view.bottom) };
      if (b.right > b.left && b.bottom > b.top) boxes.push({ kind: 'newest', id: newest.dataset.animId, ...b });
    }
    const outside = (b) => b.left < zone.left - 0.5 || b.top < zone.top - 0.5 || b.right > zone.right + 0.5 || b.bottom > zone.bottom + 0.5;
    return { enabled: !!zone, zone, boxes, violations: zone ? boxes.filter(outside) : [] };
  };
  renderAt(0);
})();`;

/**
 * The iMessage page for `thread`: { html, events, total_s, cues }.
 * `env` = { width, height, fps, theme, safe_area, assets, font_css, images, timing }.
 */
function imessageBuild(thread, env) {
  const { width, height, fps } = env;
  const images = env.images || {};
  imValidate(thread, images);
  const css = env.assets && env.assets['chat.css'];
  if (typeof css !== 'string') throw new Error('The iMessage skin needs its chat.css asset.');
  const icons = imIcons(env.assets['icons.js']);
  const theme = env.theme === 'light' ? 'light' : 'dark';
  const requested = thread.zoom || Math.min(width / 514, height / 914);
  if (IM_PHONE.width * requested > width - 32 || IM_PHONE.height * requested > height - 32) {
    throw new Error('The phone does not fit the canvas at this zoom; lower it (a margin stays on every edge).');
  }
  const layout = imLayout(width, height, thread.zoom, env.safe_area || null);
  const zoom = layout.zoom;
  const people = imParticipants(thread.participants);
  const { events, total } = imTimeline(thread, env.timing, fps);
  const dark = theme === 'dark';
  const bg = thread.background_image
    ? `url('${images[thread.background_image]}') center/cover no-repeat`
    : dark ? 'radial-gradient(ellipse at top,#2a2a2e,#0d0d0f)' : 'radial-gradient(ellipse at top,#f3efe9,#d8cfc2)';
  const safeCss = layout.zone
    ? `body.framed { display:block; position:relative; } body.framed .iphone-frame { position:absolute; left:${layout.left / zoom}px; top:${layout.top / zoom}px; }`
    : '';
  const kitCss = css.replace(/font-family:[^;]*;/g, 'font-family: KitText, KitEmoji, sans-serif;');
  const style = `<style>${env.font_css || ''}
    html { zoom:${zoom}; height:${height / zoom}px; overflow:hidden; }
    body.framed { padding:0; margin:0; height:${height / zoom}px; min-height:0; background:${bg}; overflow:hidden; font-family: KitText, KitEmoji, sans-serif; }
    .iphone-frame { flex-shrink:0; }
    body.framed .stage { height:100%; min-height:0; }
    .status-bar,.conv-header,.group-header,.keyboard { flex-shrink:0; }
    .status-bar { color:var(--text-primary); }
    .conv-header { min-height:66px; }
    .conv-header .center { transform:translate(-50%,-50%); max-width:60%; }
    .conv-header .center .avatar { width:42px; height:42px; font-size:17px; }
    .conv-header .center .name-pill { font-size:13px; max-width:100%; white-space:nowrap; }
    .conv-header .left,.conv-header .right,.conv-header .left .back-btn,.conv-header .right .facetime-btn { color:var(--text-primary); }
    .conv-header .left .badge-pill,.conv-header .center .name-pill { background:${dark ? '#1c1c1e' : '#e9e9eb'}; color:var(--text-primary); }
    body.framed .conversation { flex:1; min-height:0; display:block; overflow:hidden; padding:6px 14px 10px; }
    .message-list { display:flex; flex-direction:column; justify-content:flex-start; min-height:100%; gap:2px; }
    .message-list > * { flex-shrink:0; }
    .bubble { overflow-wrap:anywhere; position:relative; }
    .sender-name { margin-left:38px; }
    .row.attachment { gap:0; }
    .row.attachment .attachment-card { width:62%; max-width:62%; border-radius:16px 16px 0 0; }
    .row.attachment .attachment-card img { display:block; width:100%; max-height:300px; object-fit:cover; }
    .row.attachment .attachment-meta { width:62%; max-width:62%; background:${dark ? '#2c2c2e' : '#e9e9eb'}; border-radius:0 0 16px 16px; padding:10px 32px 10px 12px; margin:0; text-align:left; position:relative; line-height:1.25; }
    .attachment-meta .title { font-size:13px; font-weight:600; color:var(--text-primary); }
    .attachment-meta .subtitle { font-size:11px; font-weight:400; color:var(--text-meta); margin-top:3px; }
    .row.rich-link .attachment-meta::after { content:'\\203A'; position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:22px; color:var(--text-meta); }
    .row.photo .attachment-card { border-radius:16px; }
    .row.photo .attachment-meta { background:transparent; padding:6px 0; }
    .tapback { position:absolute; top:-34px; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:3; box-shadow:0 0 0 2.5px ${dark ? '#000' : '#fff'}; font-size:21px; }
    .tapback.on-sent { left:-24px; } .tapback.on-received { right:-24px; }
    .tapback.theirs { background:${dark ? '#3a3a3c' : '#e9e9eb'}; } .tapback.mine { background:#0a84ff; }
    .tapback::after { content:''; position:absolute; bottom:-5px; width:8px; height:8px; border-radius:50%; background:inherit; }
    .tapback.on-sent::after { right:0; } .tapback.on-received::after { left:0; }
    .bubble.pop-now,.delivered-caption.pop-now,.caret,.pop-pending { animation:none !important; transition:none !important; }
    ${safeCss}
  </style>`;
  const keyboard = `<div class="keyboard"><div class="left-btn">${icons.plus}</div><div class="input"><span class="placeholder">iMessage</span><span class="mic">${icons.mic}</span></div></div>`;
  const statusBar = `<div class="status-bar"><div class="time">${imEsc(thread.clock || '9:41')}</div><div class="right-cluster">${icons.signal}${icons.wifi}${icons.battery}</div></div>`;
  const island = thread.dynamic_island === false ? '' : '<div class="dynamic-island"></div>';
  const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html${dark ? ' class="theme-dark"' : ''}><head><meta charset="utf-8"><style>${kitCss}</style>${style}</head>
<body class="framed${dark ? ' theme-dark' : ''}">
  <div class="iphone-frame"><div class="screen">${island}<div class="stage">${statusBar}${imHeader(thread, people, icons)}${imConversation(thread, people, images)}${keyboard}</div></div></div>
<script>const CHAT_TIMELINE=${json(events)};
const CHAT_LAYOUT=${json({ zone: layout.zone })};
const CHAT_SEND=${json(icons.sendArrow)};
${IM_DRIVER}</script>
</body></html>`;

  // One cue per real text, attachment or reaction, on the first visible frame
  // after its reveal; a receive chime followed quickly by another message is
  // shortened so its second note cannot mask the next one (stitch.sh).
  const snapCue = (t) => Math.ceil((t + 1 / fps - 1e-8) * fps) / fps;
  const sounding = events.filter((e) => e.sfx);
  const cues = sounding.map((e, n) => {
    const cue = { t: snapCue(e.t), sound: `imessage-${e.sfx}.mp3`, gain: e.soft ? IM_SOFT_GAIN : IM_CUE_GAIN };
    if (n + 1 < sounding.length) {
      let room = snapCue(sounding[n + 1].t) - cue.t - 0.005;
      if (e.sfx === 'receive' && room < 1.3) room = Math.min(room, 0.2);
      if (room > 0.05) cue.max_s = +room.toFixed(3);
    }
    return cue;
  });
  const shown = thread.messages.filter((m) => m.type === 'text' || m.type === 'attachment');
  const stats = {
    messages: shown.length,
    words: shown.reduce((n, m) => n + (m.type === 'text' ? imWords(m.text) : 0), 0),
    photos: shown.filter((m) => m.type === 'attachment').length,
  };
  return { html, events: events.map((e) => ({ t: e.t, kind: e.kind, ...(e.id ? { id: e.id } : {}), ...(e.kind === 'composer' ? { text: e.text, dur: e.dur } : {}) })), total_s: total, cues, stats };
}

// ---- phone-chat/src/skins/chatgpt.mjs ----
// phone-chat skin: chatgpt (prefix cg).
//
// Ports render-chatgpt-chat (its in-page driver and deriveSFX cue rules) and the
// create-chatgpt-mockup page it bundles (generate.js, templates/chat.css,
// templates/icons.js) into one frame-stepped page. The old recorder played a
// hand-written timeline live and screen-recorded it; here the timeline is derived
// from the thread, and window.seek(ms) rebuilds the whole picture from movie time:
// typing, the one-beat send tap (bubble pops, keyboard slides down, header icons
// swap), the single gray loading dot, the word-by-word answer and the auto-scroll.
//
// Light mode only, like the mockup. Pure module: no imports, no clocks, no I/O.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CG_STAGE_W = 750; // the mockup's screen width in CSS px (chat.css .stage)
const CG_MIN_STAGE_H = 1100; // shortest screen that still shows keyboard, composer and some chat
const CG_CONV_TOP = 118; // status bar (56) + header (62): only for build-time fit checks
const CG_KB_LIFT = 498; // composer offset while the keyboard is up (chat.css)
const CG_MIN_CHAT_H = 160; // chat that must stay visible above the composer while typing
const CG_SAFE_GAP = 8; // output px between the newest content and a platform band
const CG_MAX_TOTAL_S = 120;
const CG_TICK_EVERY = 12; // deriveSFX: one stream-tick every 12 streamed words
const CG_ICON_KEYS = ['personPlus', 'dottedCircle', 'edit', 'more'];
const CG_ICON_NAMES = [
  'hamburger', 'chevronDown', 'chevronRight', 'personPlus', 'dottedCircle', 'editPencil', 'moreDots',
  'plus', 'mic', 'sendArrow', 'thumbsUp', 'thumbsDown', 'signal', 'wifi', 'battery', 'moonDND',
  'stopSquare', 'kbdShift', 'kbdBackspace', 'kbdReturn', 'kbdGlobe', 'kbdMic', 'kbdEmoji',
];

// Pacing, in seconds unless named otherwise. Defaults reproduce the atom's
// config.example.json timeline: keyboard up at 0, typing from 0.5 (47 chars in
// 2.6 s), send at 3.3, dot 3.65 to 4.2, answer from 4.25 at 7 words a second.
const CG_TIMING = {
  start: 0, // first keyboard-show
  keyboard_lead: 0.5, // keyboard-show to typing start
  type_cps: 18, // composer typing speed, characters per second
  min_type: 1,
  max_type: 4,
  send_hold: 0.2, // full question rests in the composer before the tap
  dot_delay: 0.35, // send tap to loading dot (or to the answer when there is no dot)
  dot_hold: 0.55, // the dot is on screen this long, then the answer replaces it
  stream_delay: 0.05, // answer row appears, then its first word
  stream_wps: 7, // streamed words per second
  done_delay: 0.05, // last word to response-done
  next_turn_gap: 1, // answer finished to the next keyboard-show
  scroll_ms: 300, // auto-scroll glide
  tail_hold: 1.5, // the last state holds this long (at least 0.5)
};

// deriveSFX cue rules and stitch.sh gains (subliminal by design; never a cue on the dot).
const CG_CUES = {
  key: ['key-tap.wav', 0.04],
  send: ['send-tap.wav', 0.1],
  'stream-tick': ['stream-tick.wav', 0.025],
  'stream-done': ['response-done.wav', 0.079],
};

// ---------------------------------------------------------------------------
// Thread schema
// ---------------------------------------------------------------------------

const CG_ID_SCHEMA = { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$' };
const CG_ICON_LIST_SCHEMA = { type: 'array', items: { type: 'string', enum: CG_ICON_KEYS }, maxItems: 3 };

const CHATGPT_THREAD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['messages'],
  properties: {
    status_bar: {
      type: 'object',
      additionalProperties: false,
      properties: {
        time: { type: 'string', pattern: '^[0-9]{1,2}:[0-9]{2}$' },
        dnd: { type: 'boolean' },
      },
    },
    header: {
      type: 'object',
      additionalProperties: false,
      properties: {
        style: { type: 'string', enum: ['model-tag', 'title-only', 'plain-title'] },
        title: { type: 'string', minLength: 1, maxLength: 32 },
        model: { type: 'string', minLength: 1, maxLength: 8 },
        right_icons: CG_ICON_LIST_SCHEMA,
        right_icons_alt: CG_ICON_LIST_SCHEMA,
      },
    },
    keyboard: {
      type: 'object',
      additionalProperties: false,
      properties: {
        suggestions: {
          type: 'array',
          items: { type: 'string', minLength: 1, maxLength: 14 },
          minItems: 3,
          maxItems: 3,
        },
        shift: { type: 'string', enum: ['lower', 'upper'] },
        letters_row1: { type: 'string', pattern: '^[a-z]{1,12}$' },
        letters_row2: { type: 'string', pattern: '^[a-z]{1,11}$' },
        letters_row3: { type: 'string', pattern: '^[a-z]{1,9}$' },
      },
    },
    messages: {
      type: 'array',
      minItems: 1,
      maxItems: 24,
      items: {
        oneOf: [
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'id', 'text'],
            properties: {
              type: { const: 'user-text' },
              id: CG_ID_SCHEMA,
              text: { type: 'string', minLength: 1, maxLength: 280, pattern: '^[^\\r\\n]+$' },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'id', 'image'],
            properties: {
              type: { const: 'user-image' },
              id: CG_ID_SCHEMA,
              image: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$' },
              aspect: { type: 'string', enum: ['square', 'natural'] },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'id'],
            properties: {
              type: { const: 'loading-dot' },
              id: CG_ID_SCHEMA,
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'id', 'text'],
            properties: {
              type: { const: 'assistant' },
              id: CG_ID_SCHEMA,
              text: { type: 'string', minLength: 1, maxLength: 2400 },
              title: { type: 'string', minLength: 1, maxLength: 60 },
              feedback: { type: 'boolean' },
              stream: { type: 'boolean' },
            },
          },
        ],
      },
    },
    composer: {
      type: 'object',
      additionalProperties: false,
      properties: {
        placeholder: { type: 'string', minLength: 1, maxLength: 40 },
        chip: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          properties: { name: { type: 'string', minLength: 1, maxLength: 24 } },
        },
      },
    },
    sfx: { type: 'boolean' },
  },
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function cgEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cgGraphemes(text) {
  return [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(String(text))].map((s) => s.segment);
}

// Index of the first grapheme of every word (one key-tap per word, as deriveSFX).
function cgWordStarts(g) {
  const starts = [];
  for (let i = 0; i < g.length; i++) {
    if (/\S/u.test(g[i]) && (i === 0 || !/\S/u.test(g[i - 1]))) starts.push(i);
  }
  return starts;
}

// Characters shown in the composer `elapsed` seconds after typing starts.
// Serialized into the page, so the page and the build share one rule.
function cgTypedCount(n, dur, elapsed) {
  if (!(elapsed > 0)) return 0;
  return Math.min(n, Math.floor((elapsed * n) / dur + 1e-6));
}

function cgClamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

function cgAsset(env, name) {
  const text = env.assets && env.assets[name];
  if (typeof text !== 'string' || !text.length) {
    throw new Error(`The chatgpt skin needs its ${name} asset in env.assets.`);
  }
  return text;
}

// icons.js is the atom's CommonJS icon table, shipped byte for byte. Read the
// backtick strings out of it instead of running it.
function cgIcons(src) {
  const icons = {};
  const re = /^\s*([A-Za-z][A-Za-z0-9]*)\s*:\s*`([^`]*)`/gm;
  let m;
  while ((m = re.exec(src))) icons[m[1]] = m[2];
  for (const name of CG_ICON_NAMES) {
    if (!icons[name]) throw new Error(`The chatgpt icons.js asset has no ${name} icon.`);
  }
  return icons;
}

// The copied chat.css names system fonts and runs CSS animations. Drop its
// comments and point every font stack at the kit fonts; animations are switched
// off by a later rule because seek() draws every frame itself.
function cgStyles(raw) {
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/font-family\s*:[^;}]*/g, 'font-family: KitText, KitEmoji, sans-serif');
}

// ---------------------------------------------------------------------------
// Assistant markdown (ported from generate.js)
// ---------------------------------------------------------------------------

function cgInline(s) {
  let out = cgEscape(s);
  out = out.replace(/\[\[icon:(.+?)\]\]/g, (_, ico) => `<span class="icon-prefix">${ico}</span>`);
  out = out.replace(/\[\[cite:(.+?)\]\]/g, (_, c) => `<span class="cite">${c}</span>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  return out;
}

function cgMarkdown(src) {
  const lines = String(src).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let buf = [];
  let inList = false;
  let inOrdered = false;
  const flushParagraph = () => {
    if (!buf.length) return;
    const joined = buf
      .map((l) => cgInline(l))
      .join('<br>')
      .replace(/^(<br>)+|(<br>)+$/g, '');
    if (joined) out.push(`<p>${joined}</p>`);
    buf = [];
  };
  const flushList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    if (inOrdered) {
      out.push('</ol>');
      inOrdered = false;
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    if (/^---+\s*$/.test(line)) {
      flushParagraph();
      flushList();
      out.push('<hr>');
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushParagraph();
      flushList();
      out.push(`<h${h[1].length}>${cgInline(h[2])}</h${h[1].length}>`);
      continue;
    }
    const li = /^[*-]\s+(.*)$/.exec(line);
    if (li) {
      flushParagraph();
      if (inOrdered) {
        out.push('</ol>');
        inOrdered = false;
      }
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${cgInline(li[1])}</li>`);
      continue;
    }
    const oli = /^(\d+)\.\s+(.*)$/.exec(line);
    if (oli) {
      flushParagraph();
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      if (!inOrdered) {
        out.push('<ol>');
        inOrdered = true;
      }
      out.push(`<li>${cgInline(oli[2])}</li>`);
      continue;
    }
    const sec = /^\*\*(.+?)\*\*:?\s*$/.exec(line);
    if (sec) {
      flushParagraph();
      flushList();
      out.push(`<p class="section-title">${cgInline(sec[1])}</p>`);
      continue;
    }
    buf.push(line);
  }
  flushParagraph();
  flushList();
  return out.join('\n');
}

// List markers are painted by the browser and cannot be hidden word by word, so a
// streamed answer turns lists into divs whose items start with a literal "• ".
function cgInlineBullets(html) {
  return html
    .replace(/<ul[^>]*>/g, '<div class="md-list">')
    .replace(/<\/ul>/g, '</div>')
    .replace(/<ol[^>]*>/g, '<div class="md-list ordered">')
    .replace(/<\/ol>/g, '</div>')
    .replace(/<li>/g, '<div class="md-li">• ')
    .replace(/<\/li>/g, '</div>');
}

// Wrap every visible word in <span class="word">. A citation pill or a rule has
// its own paint, so it gets data-f = the index of the word it arrives with.
function cgWrapWords(html, counter) {
  const out = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) {
        out.push(html.slice(i));
        break;
      }
      let tag = html.slice(i, end + 1);
      if (/^<hr\b/.test(tag) || /^<span class="cite"/.test(tag)) tag = tag.replace(/^<(\w+)/, `<$1 data-f="${counter.n}"`);
      out.push(tag);
      i = end + 1;
      continue;
    }
    const next = html.indexOf('<', i);
    const run = next === -1 ? html.slice(i) : html.slice(i, next);
    for (const tok of run.split(/(\s+)/)) {
      if (!tok) continue;
      if (/^\s+$/.test(tok)) out.push(tok);
      else {
        out.push(`<span class="word">${tok}</span>`);
        counter.n += 1;
      }
    }
    i = next === -1 ? html.length : next;
  }
  return out.join('');
}

// ---------------------------------------------------------------------------
// Screen parts (ported from generate.js)
// ---------------------------------------------------------------------------

function cgStatusBar(thread, I) {
  const sb = thread.status_bar || {};
  return `<div class="status-bar"><div class="time">${cgEscape(sb.time || '9:41')} ${sb.dnd === true ? I.moonDND : ''}</div><div class="right-cluster">${I.signal}${I.wifi}${I.battery}</div></div>`;
}

function cgHeaderParts(thread) {
  const h = thread.header || {};
  const style = h.style || 'model-tag';
  return {
    style,
    title: h.title || 'ChatGPT',
    model: h.model || '',
    right: h.right_icons || (style === 'title-only' ? ['edit'] : ['personPlus', 'dottedCircle']),
    alt: h.right_icons_alt || null,
  };
}

function cgHeader(thread, I) {
  const h = cgHeaderParts(thread);
  let center;
  if (h.style === 'title-only') {
    center = `<div class="center"><span>${cgEscape(h.title)}</span><span class="chev-right">${I.chevronRight}</span></div>`;
  } else if (h.style === 'plain-title') {
    center = `<div class="center"><span>${cgEscape(h.title)}</span></div>`;
  } else {
    const tag = h.model ? `<span class="model-tag">${cgEscape(h.model)}</span>` : '';
    center = `<div class="center"><span>${cgEscape(h.title)}</span>${tag}<span class="chev-down">${I.chevronDown}</span></div>`;
  }
  const map = { personPlus: I.personPlus, dottedCircle: I.dottedCircle, edit: I.editPencil, more: I.moreDots };
  const cluster = (keys) => keys.map((k) => map[k] || '').join('');
  const right = h.alt
    ? `<div class="right" data-active="primary"><div class="cluster primary" data-cluster="primary">${cluster(h.right)}</div><div class="cluster alt" data-cluster="alt">${cluster(h.alt)}</div></div>`
    : `<div class="right">${cluster(h.right)}</div>`;
  return `<div class="gpt-header ${h.style === 'title-only' ? 'title-center' : ''}"><div class="left"><div class="hamburger">${I.hamburger}</div></div>${center}${right}</div>`;
}

function cgComposer(thread, I) {
  const c = thread.composer || {};
  const placeholder = c.placeholder || 'Ask anything';
  const input = `<div class="input"><span class="placeholder">${cgEscape(placeholder)}</span><span class="composer-text" style="display:none"></span><span class="caret" style="display:none"></span></div>`;
  const sendBtn = `<div class="send-btn"><span class="cg-arrow">${I.sendArrow}</span><span class="cg-stop" style="display:none">${I.stopSquare}</span></div>`;
  if (c.chip) {
    return `<div class="composer-wrap"><div class="composer with-chip"><div class="gpt-chip"><span>${cgEscape(c.chip.name)}</span><span class="x">×</span></div><div class="input-row"><div class="plus-btn">${I.plus}</div>${input}<div class="mic-btn">${I.mic}</div>${sendBtn}</div></div></div>`;
  }
  return `<div class="composer-wrap"><div class="composer"><div class="plus-btn">${I.plus}</div>${input}<div class="mic-btn">${I.mic}</div>${sendBtn}</div></div>`;
}

function cgKeyboard(thread, I) {
  const kb = thread.keyboard || {};
  const upper = kb.shift === 'upper';
  const key = (c) => `<div class="kbd-key">${cgEscape(upper ? c.toUpperCase() : c)}</div>`;
  const r1 = (kb.letters_row1 || 'qwertyuiop').split('').map(key).join('');
  const r2 = (kb.letters_row2 || 'asdfghjkl').split('').map(key).join('');
  const r3 = (kb.letters_row3 || 'zxcvbnm').split('').map(key).join('');
  const sug = (kb.suggestions || ['I', 'The', "I'm"]).map((s) => `<div class="kbd-suggestion">${cgEscape(s)}</div>`).join('');
  return `<div class="kbd" data-state="hidden"><div class="kbd-suggestions">${sug}</div><div class="kbd-row">${r1}</div><div class="kbd-row kbd-row--abc">${r2}</div><div class="kbd-row kbd-row--zxc"><div class="kbd-key kbd-key--wide">${I.kbdShift}</div>${r3}<div class="kbd-key kbd-key--wide">${I.kbdBackspace}</div></div><div class="kbd-bottom"><div class="kbd-key kbd-key--num">123</div><div class="kbd-key kbd-key--emoji">${I.kbdEmoji}</div><div class="kbd-key kbd-key--space">space</div><div class="kbd-key kbd-key--return">${I.kbdReturn}</div></div><div class="kbd-footer">${I.kbdGlobe}${I.kbdMic}</div></div>`;
}

// One assistant row. A loading dot that precedes it is drawn inside it, at the
// spot the first line will take, so the answer replaces the dot in place.
function cgAssistant(m, dot, I) {
  const stream = m.stream !== false;
  const counter = { n: 0 };
  let title = m.title ? `<div class="title-row"><span class="title-text">${cgEscape(m.title)}</span></div>` : '';
  let body = cgMarkdown(m.text);
  if (stream) {
    if (title) title = cgWrapWords(title, counter);
    body = cgWrapWords(cgInlineBullets(body), counter);
  } else {
    cgWrapWords(title + body, counter);
  }
  const dotHTML = dot ? `<div class="row loading-dot cg-dot" data-anim-id="${cgEscape(dot.id)}"><div class="dot"></div></div>` : '';
  const feedback = m.feedback === false ? '' : `<div class="feedback">${I.thumbsUp}${I.thumbsDown}</div>`;
  const html = `<div class="row assistant" data-anim-id="${cgEscape(m.id)}">${dotHTML}${title}<div class="assistant-body${stream ? ' streaming-body' : ''}">${body}</div>${feedback}</div>`;
  return { html, words: counter.n, stream };
}

// ---------------------------------------------------------------------------
// Checks the schema cannot express
// ---------------------------------------------------------------------------

function cgCheckEnv(env) {
  if (!env || typeof env !== 'object') throw new Error('The chatgpt skin needs an env object.');
  const { width, height, fps } = env;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width % 2 || height % 2 || width < 320 || height < 568) {
    throw new Error('env.width and env.height must be even whole numbers, at least 320 by 568.');
  }
  if (!Number.isInteger(fps) || fps < 1 || fps > 120) throw new Error('env.fps must be a whole number from 1 to 120.');
}

function cgTimingFrom(overrides) {
  const T = { ...CG_TIMING };
  if (overrides != null) {
    if (typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('env.timing must be an object of named pacing values.');
    for (const [key, value] of Object.entries(overrides)) {
      if (!(key in CG_TIMING)) throw new Error(`env.timing.${key} is not a chatgpt pacing value; use one of ${Object.keys(CG_TIMING).join(', ')}.`);
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`env.timing.${key} must be a finite number of zero or more.`);
      T[key] = value;
    }
  }
  if (!(T.type_cps > 0) || !(T.stream_wps > 0) || !(T.scroll_ms > 0) || !(T.min_type > 0)) {
    throw new Error('env.timing.type_cps, stream_wps, scroll_ms and min_type must be above zero.');
  }
  if (T.max_type < T.min_type) throw new Error('env.timing.max_type must not be below min_type.');
  if (T.tail_hold < 0.5) throw new Error('env.timing.tail_hold must be at least 0.5 seconds so the last state holds.');
  return T;
}

// Fill the canvas width-wise with the 750 px wide screen, scaled uniformly; the
// screen gets as tall as the canvas allows. A canvas too short for that keeps a
// 1100 px tall screen and pads the sides with the chat's white.
function cgLayout(env) {
  const W = env.width;
  const H = env.height;
  const z = Math.min(W / CG_STAGE_W, H / CG_MIN_STAGE_H);
  const sh = H / z;
  const left = (W - CG_STAGE_W * z) / 2;
  const pad = { left: 32, right: 32 };
  let safe = null;
  const sa = env.safe_area;
  if (sa != null) {
    if (typeof sa !== 'object' || Array.isArray(sa)) throw new Error('env.safe_area must be null or {top, bottom, left, right} in output pixels.');
    for (const k of ['top', 'bottom', 'left', 'right']) {
      if (typeof sa[k] !== 'number' || !Number.isFinite(sa[k]) || sa[k] < 0) throw new Error(`env.safe_area.${k} must be a number of zero or more output pixels.`);
    }
    const gap = CG_SAFE_GAP / z;
    safe = { top: sa.top / z, bottom: (H - sa.bottom) / z, gap };
    pad.left = Math.max(32, (sa.left - left) / z + gap);
    pad.right = Math.max(32, CG_STAGE_W - (W - sa.right - left) / z + gap);
    if (CG_STAGE_W - pad.left - pad.right < 360) throw new Error('env.safe_area leaves the chat too narrow; the side bands must leave at least half the screen.');
    const top = CG_CONV_TOP + Math.max(10, safe.top + gap - CG_CONV_TOP);
    if (safe.bottom - gap - top < 240) throw new Error('env.safe_area leaves too little height for the chat between the top and bottom bands.');
  }
  return { z, sh, left, pad, safe };
}

function cgCheckThread(thread, env, layout) {
  const msgs = thread.messages;
  const seen = new Set();
  for (const m of msgs) {
    if (seen.has(m.id)) throw new Error(`Message id "${m.id}" is used twice; every message needs its own id.`);
    seen.add(m.id);
  }
  if (msgs[0].type !== 'user-text' && msgs[0].type !== 'user-image') {
    throw new Error('The chat must open with the user: make the first message a user-text or user-image.');
  }
  if (!msgs.some((m) => m.type === 'user-text')) throw new Error('Supply at least one user-text message to type and send.');
  msgs.forEach((m, i) => {
    const prev = msgs[i - 1];
    const next = msgs[i + 1];
    if (m.type === 'user-image') {
      if (!next || next.type !== 'user-text') throw new Error(`User image "${m.id}" must be followed by the user-text message it is sent with.`);
      const src = env.images && env.images[m.image];
      if (typeof src !== 'string' || !src.startsWith('data:image/')) throw new Error(`Image key "${m.image}" in message "${m.id}" is missing from env.images.`);
    }
    if (m.type === 'user-text') {
      if (!/\S/u.test(m.text)) throw new Error(`User message "${m.id}" has no visible text.`);
      if (next && next.type !== 'assistant' && next.type !== 'loading-dot') {
        throw new Error(`User message "${m.id}" must be answered before the user sends again; put an assistant message after it.`);
      }
    }
    if (m.type === 'loading-dot' && (!next || next.type !== 'assistant')) {
      throw new Error(`Loading dot "${m.id}" must come right before the assistant message it stands in for.`);
    }
    if (m.type === 'assistant') {
      const askedBy = prev && prev.type === 'loading-dot' ? msgs[i - 2] : prev;
      if (!askedBy || askedBy.type !== 'user-text') throw new Error(`Assistant message "${m.id}" must answer a user-text message (optionally after one loading dot).`);
    }
  });

  // Header: the centre label sits between the hamburger and the right icons.
  const h = cgHeaderParts(thread);
  const em = 22 * 0.6;
  const chevron = h.style === 'model-tag' ? 22 : h.style === 'title-only' ? 17 : 0;
  const label = cgGraphemes(h.title).length * em + (h.style === 'model-tag' && h.model ? 10 + cgGraphemes(h.model).length * em : 0) + chevron;
  const icons = Math.max(h.right.length, h.alt ? h.alt.length : 0);
  const room = CG_STAGE_W - 64 - 30 - (icons ? icons * 30 + (icons - 1) * 18 : 0) - 32;
  if (label > room) throw new Error('header.title is too long to fit between the header icons; shorten it, drop header.model or use fewer right icons.');

  // Composer: the typed question grows the pill upward over the chat while the keyboard is up.
  const perLine = 472 / (28 * 0.55);
  const chip = thread.composer && thread.composer.chip ? 46 : 0;
  const room2 = layout.sh - CG_KB_LIFT - CG_CONV_TOP - CG_MIN_CHAT_H - 44 - chip;
  const maxLines = Math.max(1, Math.floor((room2 - 30) / 36.4));
  for (const m of msgs) {
    if (m.type !== 'user-text') continue;
    const lines = Math.ceil(cgGraphemes(m.text).length / perLine);
    if (lines > maxLines) {
      throw new Error(`User message "${m.id}" is too long to type in the composer on a ${env.width}x${env.height} canvas; keep it under about ${Math.floor(maxLines * perLine)} characters.`);
    }
  }
}

// ---------------------------------------------------------------------------
// The page runtime. Serialized into the document; it may only use the DOM and
// the plan handed to it. Everything on screen is a function of seek(ms).
// ---------------------------------------------------------------------------

function cgRuntime(P) {
  var Z = P.z;
  var EPS = 0.0005; // an integer-millisecond seek still lands on its frame's events
  var D = P.scroll_ms / 1000;
  function q(sel, root) {
    return (root || document).querySelector(sel);
  }
  var stage = q('.stage');
  var conv = q('.conversation');
  var content = q('.cg-content');
  var wrap = q('.composer-wrap');
  var kb = q('.kbd');
  var input = q('.composer .input');
  var ph = q('.placeholder', input);
  var ct = q('.composer-text', input);
  var caret = q('.caret', input);
  var send = q('.composer .send-btn');
  var arrow = q('.cg-arrow', send);
  var stop = q('.cg-stop', send);
  var right = q('.gpt-header .right');
  var cPri = q('.cluster.primary', right);
  var cAlt = q('.cluster.alt', right);
  var el = {};
  var tagged = document.querySelectorAll('[data-anim-id]');
  for (var a = 0; a < tagged.length; a++) el[tagged[a].getAttribute('data-anim-id')] = tagged[a];
  var rows = document.querySelectorAll('.cg-content > .row');
  var dots = document.querySelectorAll('.cg-dot');
  var answers = [];
  for (var b = 0; b < P.items.length; b++) {
    var item = P.items[b];
    if (item.k !== 'answer') continue;
    var row = el[item.id];
    answers.push({ it: item, row: row, words: row.querySelectorAll('.word'), follow: row.querySelectorAll('[data-f]'), fb: q('.feedback', row) });
  }

  function bezier(x1, y1, x2, y2) {
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var lo = 0;
      var hi = 1;
      var s = x;
      for (var i = 0; i < 32; i++) {
        s = (lo + hi) / 2;
        var xs = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s;
        if (xs < x) lo = s;
        else hi = s;
      }
      return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
    };
  }
  var KB = bezier(0.3, 0, 0.2, 1); // .kbd transition
  var POP = bezier(0.2, 0.7, 0.2, 1); // gpt-pop and the send-tap pulse
  var OUT = bezier(0, 0, 0.58, 1); // ease-out: word fade, header cross-fade
  var INOUT = bezier(0.42, 0, 0.58, 1); // dot pulse
  function c01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }
  function glide(p) {
    p = c01(p);
    return 0.5 - 0.5 * Math.cos(Math.PI * p);
  }
  function kbAt(seg, time) {
    return seg ? seg.from + (seg.to - seg.from) * KB(c01((time - seg.t) / 0.28)) : 0;
  }
  function scrollAt(seg, time) {
    return seg ? seg.from + (seg.to - seg.from) * glide((time - seg.t) / D) : 0;
  }
  // gpt-pop: 0% {opacity 0; scale .92; translateY 6px} 60% {opacity 1} 100% {scale 1}
  function pop(node, p, origin) {
    node.style.visibility = 'visible';
    if (p >= 1) {
      node.style.opacity = '';
      node.style.transform = '';
      return;
    }
    var e = POP(c01(p));
    node.style.opacity = String(POP(c01(p / 0.6)));
    node.style.transform = 'scale(' + (0.92 + 0.08 * e) + ') translateY(' + 6 * (1 - e) + 'px)';
    node.style.transformOrigin = origin;
  }
  // Moving parts land on whole output pixels, so their edges raster the same way
  // whichever frame came before.
  function px(v) {
    return Math.round(v * Z) / Z;
  }
  function fade(now, at) {
    return now < at ? 0 : OUT(c01((now - at) / 0.22));
  }
  // Steady states are written the same way whatever the seek order: hidden at 0,
  // no inline opacity at 1.
  function alpha(node, o) {
    node.style.visibility = o <= 0 ? 'hidden' : '';
    node.style.opacity = o > 0 && o < 1 ? String(o) : '';
  }

  function draw(ms) {
    var now = ms / 1000 + EPS;
    var i;
    // Repaint the whole screen on every frame (an invisible background swap by
    // frame parity), so no frame reuses raster tiles left by the frame before.
    stage.style.backgroundImage = Math.round((ms * P.fps) / 1000) % 2 ? 'linear-gradient(transparent, transparent)' : 'none';
    for (i = 0; i < rows.length; i++) {
      rows[i].style.visibility = 'hidden';
      rows[i].style.opacity = '';
      rows[i].style.transform = '';
    }
    for (i = 0; i < dots.length; i++) {
      dots[i].style.visibility = 'hidden';
      dots[i].style.transform = '';
    }

    var kseg = null;
    var text = '';
    var caretAt = 0;
    var pulseAt = null;
    var swapAt = null;
    var lastSend = null;
    var answered = false;
    var shown = [];
    var steps = [];
    for (i = 0; i < P.items.length; i++) {
      var it = P.items[i];
      if (it.t > now) continue;
      if (it.k === 'kb') {
        kseg = { t: it.t, from: kbAt(kseg, it.t), to: it.v };
      } else if (it.k === 'type') {
        text = it.g.slice(0, cgTypedCount(it.g.length, it.dur, now - it.t)).join('');
        caretAt = it.t + it.dur / it.g.length;
      } else if (it.k === 'send') {
        text = '';
        pulseAt = it.t;
        lastSend = it;
        if (it.swap && swapAt === null) swapAt = it.t;
        if (it.img) shown.push([el[it.img], it.t, 0.22, '100% 100%']);
        shown.push([el[it.id], it.t, 0.22, '100% 100%']);
        steps.push([it.t, el[it.id]]);
      } else if (it.k === 'dot') {
        if (now < it.until) shown.push([el[it.id], it.t, 0.22, '0% 0%', 1]);
        steps.push([it.t, el[it.id]]);
      } else if (it.k === 'answer') {
        if (now >= it.done) answered = true;
      }
    }

    // Layout first: keyboard, composer, chat window. Then measure, then paint.
    var kbp = kbAt(kseg, now);
    wrap.style.bottom = px(P.kb_lift * kbp) + 'px';
    ph.style.display = text ? 'none' : '';
    ct.style.display = text ? '' : 'none';
    ct.textContent = text;
    caret.style.display = text ? '' : 'none';
    caret.style.opacity = Math.floor((now - caretAt) / 0.525) % 2 ? '0' : '1';

    var convTop = conv.offsetTop;
    if (P.safe) content.style.paddingTop = Math.max(10, P.safe.top + P.safe.gap - convTop) + 'px';
    var visBottom = wrap.offsetTop;
    if (P.safe) visBottom = Math.min(visBottom, P.safe.bottom - P.safe.gap);
    var visH = Math.max(0, visBottom - convTop);
    conv.style.height = visH + 'px';
    // The keyboard slides by layout, not by a transform: Chromium rasters a
    // transformed layer differently after it has moved, which breaks seek order.
    kb.style.bottom = px(-(1 - kbp) * kb.offsetHeight) + 'px';

    for (var n = 0; n < answers.length; n++) {
      var A = answers[n];
      if (A.it.t > now) continue;
      if (!A.it.stream) {
        steps.push([A.it.t, A.row]);
        continue;
      }
      for (var w = 0; w < A.words.length; w++) {
        var tw = A.it.s + w / A.it.wps;
        if (tw > now) break;
        steps.push([tw, A.words[w]]);
      }
      if (A.it.done <= now) steps.push([A.it.done, A.row]);
    }
    steps.sort(function (x, y) {
      return x[0] - y[0];
    });
    var base = content.getBoundingClientRect().top;
    var seg = null;
    var reach = 0;
    for (i = 0; i < steps.length; i++) {
      var bottom = (steps[i][1].getBoundingClientRect().bottom - base) / Z;
      if (bottom <= reach + 0.5) continue;
      seg = { t: steps[i][0], from: scrollAt(seg, steps[i][0]), to: bottom };
      reach = bottom;
    }
    var scroll = Math.max(0, scrollAt(seg, now) + P.pad_bottom - visH);
    scroll = px(scroll);
    content.style.transform = scroll ? 'translateY(' + -scroll + 'px)' : '';

    for (i = 0; i < shown.length; i++) {
      var s = shown[i];
      pop(s[0], (now - s[1]) / s[2], s[3]);
      if (s[4]) {
        var ph2 = ((now - s[1]) % 1.1) / 1.1;
        var u = ph2 < 0.5 ? INOUT(ph2 / 0.5) : 1 - INOUT((ph2 - 0.5) / 0.5);
        var dotEl = s[0].firstChild;
        dotEl.style.opacity = String(0.45 + 0.55 * u);
        dotEl.style.transform = 'scale(' + (0.92 + 0.12 * u) + ')';
      }
    }
    for (n = 0; n < answers.length; n++) {
      var R = answers[n];
      var on = R.it.t <= now;
      if (on) pop(R.row, (now - R.it.t) / 0.28, '0% 0%');
      if (!R.it.stream) continue;
      var op = [];
      for (w = 0; w < R.words.length; w++) {
        var o = on ? fade(now, R.it.s + w / R.it.wps) : 0;
        op.push(o);
        alpha(R.words[w], o);
        R.words[w].style.filter = o > 0 && o < 1 ? 'blur(' + 2 * (1 - o) + 'px)' : '';
      }
      for (w = 0; w < R.follow.length; w++) {
        var f = +R.follow[w].getAttribute('data-f');
        alpha(R.follow[w], f < op.length ? op[f] : on ? fade(now, R.it.done) : 0);
      }
      if (R.fb) alpha(R.fb, on ? fade(now, R.it.done) : 0);
    }

    if (cAlt) {
      var x = swapAt === null ? 0 : OUT(c01((now - swapAt) / 0.22));
      right.setAttribute('data-active', x >= 1 ? 'alt' : 'primary');
      alpha(cPri, x <= 0 ? 1 : 1 - x);
      alpha(cAlt, x >= 1 ? 1 : x);
      if (x <= 0) cAlt.style.visibility = 'hidden';
      if (x >= 1) cPri.style.visibility = 'hidden';
    }
    var state = text ? 'active' : lastSend && now < lastSend.busy ? 'streaming' : answered ? 'active' : '';
    send.classList.toggle('active', state === 'active');
    send.classList.toggle('streaming', state === 'streaming');
    arrow.style.display = state === 'streaming' ? 'none' : '';
    stop.style.display = state === 'streaming' ? '' : 'none';
    var press = pulseAt === null ? 1 : 0.86 + 0.14 * POP(c01((now - pulseAt) / 0.14));
    send.style.transform = press >= 1 ? '' : 'scale(' + press + ')';
  }

  window.seek = function (ms) {
    draw(Number(ms) || 0);
  };
  window.seek(0);
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function chatgptBuild(thread, env) {
  cgCheckEnv(env);
  const T = cgTimingFrom(env.timing);
  const I = cgIcons(cgAsset(env, 'icons.js'));
  const css = cgStyles(cgAsset(env, 'chat.css'));
  const layout = cgLayout(env);
  cgCheckThread(thread, env, layout);

  const fps = env.fps;
  const snap = (t) => Math.ceil((t - 1e-8) * fps) / fps;
  const msgs = thread.messages;
  const header = cgHeaderParts(thread);

  // Rows, in thread order. A loading dot renders inside the answer after it.
  const rowsHTML = [];
  const words = {};
  msgs.forEach((m, i) => {
    if (m.type === 'user-text') {
      rowsHTML.push(`<div class="row user" data-anim-id="${cgEscape(m.id)}"><div class="bubble">${cgEscape(m.text)}</div></div>`);
    } else if (m.type === 'user-image') {
      const cls = m.aspect === 'square' ? 'attachment square' : 'attachment';
      rowsHTML.push(`<div class="row user-image" data-anim-id="${cgEscape(m.id)}"><div class="${cls}"><img src="${cgEscape(env.images[m.image])}" alt=""></div></div>`);
    } else if (m.type === 'assistant') {
      const prev = msgs[i - 1];
      const a = cgAssistant(m, prev && prev.type === 'loading-dot' ? prev : null, I);
      if (a.words < 1) throw new Error(`Assistant message "${m.id}" has no words to show.`);
      words[m.id] = a;
      rowsHTML.push(a.html);
    }
  });

  // Timeline: the in-page plan (items) and the reported events, from one walk.
  const items = [];
  const events = [];
  const ev = (t, kind, id) => events.push(id == null ? { t, kind } : { t, kind, id });
  let t = T.start;
  let swapped = false;
  let lastSend = null;
  msgs.forEach((m, i) => {
    if (m.type === 'user-text') {
      const img = i > 0 && msgs[i - 1].type === 'user-image' ? msgs[i - 1].id : null;
      const kbShow = snap(t);
      items.push({ k: 'kb', t: kbShow, v: 1 });
      ev(kbShow, 'keyboard-show');
      const g = cgGraphemes(m.text);
      const dur = cgClamp(g.length / T.type_cps, T.min_type, T.max_type);
      const typeAt = snap(kbShow + T.keyboard_lead);
      items.push({ k: 'type', t: typeAt, dur, g });
      ev(typeAt, 'type-start', m.id);
      for (const c of cgWordStarts(g)) ev(snap(typeAt + ((c + 1) * dur) / g.length), 'key', m.id);
      const sendAt = snap(typeAt + dur + T.send_hold);
      const swap = !swapped && !!header.alt;
      swapped = swapped || swap;
      lastSend = { k: 'send', t: sendAt, id: m.id, img, swap, busy: sendAt };
      items.push(lastSend);
      items.push({ k: 'kb', t: sendAt, v: 0 });
      ev(sendAt, 'send', m.id);
      if (img) ev(sendAt, 'pop', img);
      ev(sendAt, 'pop', m.id);
      ev(sendAt, 'keyboard-hide');
      if (swap) ev(sendAt, 'header-swap');
      t = sendAt + T.dot_delay;
    } else if (m.type === 'loading-dot') {
      const show = snap(t);
      const hide = snap(show + T.dot_hold);
      items.push({ k: 'dot', t: show, until: hide, id: m.id });
      ev(show, 'dot-show', m.id);
      ev(hide, 'dot-hide', m.id);
      t = hide;
    } else if (m.type === 'assistant') {
      const a = words[m.id];
      const popAt = snap(t);
      const s = a.stream ? snap(popAt + T.stream_delay) : popAt;
      const done = snap(s + a.words / T.stream_wps + (a.stream ? T.done_delay : 0));
      items.push({ k: 'answer', t: popAt, id: m.id, stream: a.stream, s, wps: T.stream_wps, n: a.words, done });
      lastSend.busy = a.stream ? done : popAt;
      ev(popAt, 'pop', m.id);
      if (a.stream) {
        ev(s, 'stream-start', m.id);
        for (let w = CG_TICK_EVERY; w < a.words; w += CG_TICK_EVERY) ev(snap(s + w / T.stream_wps), 'stream-tick', m.id);
        ev(done, 'stream-done', m.id);
      } else {
        ev(done, 'answer-done', m.id);
      }
      t = done + T.next_turn_gap;
    }
  });
  events.sort((x, y) => x.t - y.t);
  const total_s = snap(events[events.length - 1].t + T.tail_hold);
  const stats = {
    messages: msgs.filter((m) => m.type === 'user-text' || m.type === 'user-image' || m.type === 'assistant').length,
    // The answers' words as the page streams them (they set the answer's time). The question is not
    // counted: it is typed by its characters.
    words: msgs.reduce((n, m) => n + (m.type === 'assistant' ? words[m.id].words : 0), 0),
    photos: msgs.filter((m) => m.type === 'user-image').length,
  };
  if (total_s > CG_MAX_TOTAL_S) {
    throw new Error(`The chat runs ${total_s.toFixed(1)} s; keep it under ${CG_MAX_TOTAL_S} s by shortening the answers or raising timing.stream_wps.`);
  }

  const cues =
    thread.sfx === false
      ? []
      : events.filter((e) => CG_CUES[e.kind]).map((e) => ({ t: e.t, sound: CG_CUES[e.kind][0], gain: CG_CUES[e.kind][1] }));

  const plan = {
    z: layout.z,
    fps,
    kb_lift: CG_KB_LIFT,
    pad_bottom: 32,
    scroll_ms: T.scroll_ms,
    safe: layout.safe,
    items,
  };
  const W = env.width;
  const H = env.height;
  const page = `
html, body { margin: 0; padding: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #FFFFFF; }
body { position: relative; }
.stage { position: absolute; left: ${layout.left / layout.z}px; top: 0; margin: 0; width: ${CG_STAGE_W}px; height: ${layout.sh}px; zoom: ${layout.z}; }
.stage, .stage * { animation: none !important; transition: none !important; }
.status-bar, .gpt-header { flex: 0 0 auto; }
.conversation { flex: 0 0 auto; display: block; padding: 0; gap: 0; height: 0; overflow: hidden; }
.cg-content { display: flex; flex-direction: column; gap: 22px; padding: 10px ${layout.pad.right}px 32px ${layout.pad.left}px; }
.composer-wrap { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; }
.kbd[data-state] { transform: none; bottom: -100%; }
.row.assistant { position: relative; }
.row.user .bubble, .row.assistant .assistant-body { overflow-wrap: anywhere; }
.row.user-image .attachment img { max-height: 560px; object-fit: cover; }
.row.loading-dot.cg-dot { position: absolute; left: 0; top: 6px; margin: 0; }
.cg-arrow, .cg-stop { display: inline-flex; }
.gpt-header .right[data-active] .cluster.alt { top: 0; transform: none; }
`;
  const planJSON = JSON.stringify(plan).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=${W}, height=${H}">
<style>${env.font_css || ''}</style>
<style>${css}</style>
<style>${page}</style>
</head>
<body>
<div class="stage">${cgStatusBar(thread, I)}${cgHeader(thread, I)}<div class="conversation"><div class="cg-content">${rowsHTML.join('')}</div></div>${cgComposer(thread, I)}${cgKeyboard(thread, I)}</div>
<script type="application/json" id="cg-plan">${planJSON}</script>
<script>
${String(cgTypedCount)}
(${String(cgRuntime)})(JSON.parse(document.getElementById('cg-plan').textContent));
</script>
</body></html>
`;
  return { html, events, total_s, cues, stats };
}

// ---- phone-chat/src/skins/apple-notes.mjs ----
// apple-notes skin for the phone-chat part.
//
// Port of render-apple-notes-chat (record-notes.js) and create-apple-notes-mockup
// (generate.js, templates/note.css, templates/icons.js). The note opens on its
// title with a blinking caret and the keyboard up; each line types one
// character at a time with a key pop, a darker space and return key and a human
// rhythm; between lines the return key goes down, then the caret blinks for the
// line's pre-pause; the note eases up so the caret never sits under the
// keyboard; it ends on the finished list. Checklist rows, images and dividers
// from the mockup can be part of the note too.
//
// Today's recorder screenshotted one PNG per state. This page instead derives
// the whole picture from movie time in window.seek(ms). Layout is the
// mockup's own: a 1180 px wide phone screen, scaled uniformly onto the canvas.
// Apple Notes is silent, so there are no cues.

const NOTES_BASE_W = 1180;
const NOTES_BASE_H = 2098;
const NOTES_KBD_H = 1100;
const NOTES_PILL_OVERLAP = 40;
const NOTES_CARET_MARGIN = 70;
const NOTES_SCROLL_EXTRA = 40;
const NOTES_TOOLBAR_BOTTOM = 298;
const NOTES_NOTE_TOP = 360;
const NOTES_NOTE_SIDE = 66;
const NOTES_BODY_LINE = 80;
const NOTES_SAFE_GAP = 8;
const NOTES_FONT = 'KitText, KitEmoji, sans-serif';

const notesTextSchema = { type: 'string', minLength: 1, maxLength: 80, pattern: '^[^\\u2013\\u2014\\r\\n]*$' };
const notesTypeSeconds = { type: 'number', minimum: 0.05, maximum: 20 };
const notesPauseSeconds = { type: 'number', minimum: 0, maximum: 10 };
const notesLettersRow = { type: 'string', pattern: '^[a-z]{1,12}$' };

// The keyboard's emoji key, drawn as an inline SVG (a smiley glyph would need an emoji font).
const NOTES_EMOJI_KEY =
  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"/><circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none"/><path d="M8 14.2c1.1 1.5 2.4 2.2 4 2.2s2.9-.7 4-2.2"/></svg>';

const NOTES_THREAD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'lines'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 60, pattern: '^[^\\r\\n]*$' },
    lines: {
      type: 'array',
      minItems: 1,
      maxItems: 30,
      items: {
        oneOf: [
          {
            type: 'object',
            additionalProperties: false,
            required: ['text', 'type_seconds'],
            properties: {
              type: { const: 'paragraph' },
              text: notesTextSchema,
              type_seconds: notesTypeSeconds,
              pre_pause_seconds: notesPauseSeconds,
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'text', 'type_seconds'],
            properties: {
              type: { const: 'check' },
              text: notesTextSchema,
              type_seconds: notesTypeSeconds,
              pre_pause_seconds: notesPauseSeconds,
              checked: { type: 'boolean' },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'image'],
            properties: {
              type: { const: 'image' },
              image: { type: 'string', minLength: 1, maxLength: 64, pattern: '^[A-Za-z0-9][A-Za-z0-9_.-]*$' },
              caption: notesTextSchema,
              pre_pause_seconds: notesPauseSeconds,
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type'],
            properties: {
              type: { const: 'divider' },
              pre_pause_seconds: notesPauseSeconds,
            },
          },
        ],
      },
    },
    post_hold_seconds: { type: 'number', minimum: 0.5, maximum: 10 },
    status_bar: {
      type: 'object',
      additionalProperties: false,
      properties: {
        time: { type: 'string', pattern: '^[0-9]{1,2}:[0-9]{2}$' },
        battery_pct: { type: 'integer', minimum: 0, maximum: 100 },
        battery_low: { type: 'boolean' },
        show_focus_glyph: { type: 'boolean' },
      },
    },
    keyboard_state: {
      type: 'object',
      additionalProperties: false,
      properties: {
        suggestions: { type: 'array', maxItems: 3, items: { type: 'string', minLength: 1, maxLength: 16 } },
        shift: { enum: ['lower', 'upper'] },
        letters_row1: notesLettersRow,
        letters_row2: notesLettersRow,
        letters_row3: notesLettersRow,
      },
    },
  },
};

// Pacing constants, all overridable through env.timing.
const notesTimingDefaults = {
  // Blink before the first line, when thread.lines[0].pre_pause_seconds is unset.
  first_pre_pause_s: 1.0,
  // Blink before every later line, when its pre_pause_seconds is unset.
  pre_pause_s: 0.6,
  // How long the return key shows pressed.
  return_s: 0.08,
  // Final hold, when thread.post_hold_seconds is unset (never under 0.5 s).
  post_hold_s: 1.4,
  // iOS caret blink half-period.
  blink_s: 0.53,
  // The ease that lifts the note above the keyboard (7 frames at 30 fps).
  scroll_s: 7 / 30,
  // Beat after a checklist row ticks itself.
  tick_hold_s: 0.4,
  // Slower keystroke after a space or punctuation.
  pause_factor: 1.35,
};

const notesIconNames = [
  'backChevron', 'undo', 'share', 'more', 'done', 'signal', 'wifi', 'focusBed',
  'formatAa', 'formatChecklist', 'formatTable', 'formatAttach', 'formatPen', 'formatAi',
  'globe', 'mic', 'shift', 'backspace', 'returnArrow',
];

const notesCheckSvg =
  '<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 L10 17 L19 7"/></svg>';

function notesEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// iOS Smart Punctuation as generate.js applies it to the title and suggestions.
function notesSmartFull(s) {
  return String(s)
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/\.\.\./g, '…')
    .replace(/(^|[\s(\[{<—–])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s(\[{<—–])'/g, '$1‘')
    .replace(/'/g, '’');
}

function notesSnap(t, fps) {
  const v = Math.ceil((t - 1e-8) * fps) / fps;
  return v === 0 ? 0 : v;
}

function notesGraphemes(text) {
  return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
}

function notesTiming(overrides) {
  const out = { ...notesTimingDefaults };
  if (overrides === undefined || overrides === null) return out;
  if (typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error('The timing overrides must be an object of named pacing constants.');
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (!Object.prototype.hasOwnProperty.call(notesTimingDefaults, key)) {
      throw new Error(`The Apple Notes skin has no pacing constant named ${key}.`);
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error(`The pacing constant ${key} must be a finite number, zero or more.`);
    }
    out[key] = value;
  }
  return out;
}

function notesCanvas(env) {
  for (const key of ['width', 'height', 'fps']) {
    const v = env[key];
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      throw new Error(`The canvas ${key} must be a positive number.`);
    }
  }
  const { width, height } = env;
  let scale = width / NOTES_BASE_W;
  if (height / scale < NOTES_BASE_H - 1) scale = height / NOTES_BASE_H;
  const W = width / scale;
  const H = height / scale;
  let left = NOTES_NOTE_SIDE;
  let right = NOTES_NOTE_SIDE;
  let top = NOTES_NOTE_TOP;
  let limit = H - NOTES_KBD_H - NOTES_PILL_OVERLAP - NOTES_CARET_MARGIN;
  let zoneTop = 0;
  const safe = env.safe_area;
  if (safe !== undefined && safe !== null) {
    if (typeof safe !== 'object' || Array.isArray(safe)) {
      throw new Error('The safe area must be null or an object of top, bottom, left and right bands.');
    }
    const band = {};
    for (const key of Object.keys(safe)) {
      if (!['top', 'bottom', 'left', 'right'].includes(key)) {
        throw new Error(`The safe area has an unknown band ${key}; use top, bottom, left or right.`);
      }
    }
    for (const key of ['top', 'bottom', 'left', 'right']) {
      const v = safe[key] === undefined ? 0 : safe[key];
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
        throw new Error(`The safe area band ${key} must be a non-negative number of output pixels.`);
      }
      band[key] = v;
    }
    const gap = NOTES_SAFE_GAP / scale;
    zoneTop = band.top / scale + gap;
    left = Math.max(left, band.left / scale + gap);
    right = Math.max(right, band.right / scale + gap);
    top = Math.max(top, zoneTop);
    limit = Math.min(limit, (height - band.bottom) / scale - gap);
  }
  if (W - left - right < W / 2) {
    throw new Error('The safe area leaves the note too narrow a column for its text.');
  }
  if (limit - NOTES_SCROLL_EXTRA - NOTES_BODY_LINE < Math.max(NOTES_TOOLBAR_BOTTOM, zoneTop)) {
    throw new Error('The canvas and safe area leave no room for the newest note line between the toolbar and the keyboard.');
  }
  return { width, height, scale, W, H, left, right, top, limit };
}

function notesIcons(text) {
  if (typeof text !== 'string') throw new Error('The Apple Notes skin needs its icons.js asset.');
  const icons = {};
  const re = /^\s*([A-Za-z][A-Za-z0-9]*):\s*`([^`]*)`/gm;
  let m;
  while ((m = re.exec(text))) icons[m[1]] = m[2];
  for (const name of notesIconNames) {
    if (!icons[name]) throw new Error(`The Apple Notes icons asset has no ${name} icon.`);
  }
  const battery = /battery:[\s\S]*?return\s*`([^`]*)`/.exec(text);
  if (!battery || !battery[1].includes('${innerW}') || !battery[1].includes('${fillColor}')) {
    throw new Error('The Apple Notes icons asset has no battery icon template.');
  }
  icons.formatAa = icons.formatAa.replace(/font-family="[^"]*"/g, 'font-family="KitText, sans-serif"');
  return { icons, battery: battery[1] };
}

function notesBattery(template, pct, low) {
  const innerW = Math.max(2, Math.round((pct / 100) * 46));
  return template.split('${innerW}').join(String(innerW)).split('${fillColor}').join(low ? '#FF3B30' : '#000');
}

function notesCss(text) {
  if (typeof text !== 'string') throw new Error('The Apple Notes skin needs its note.css asset.');
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/font-family\s*:[^;}]*/g, `font-family: ${NOTES_FONT}`)
    .replace(/url\(\s*"data:image\/svg\+xml[^"]*"\s*\)/g, 'none')
    .replace(/url\(\s*'data:image\/svg\+xml[^']*'\s*\)/g, 'none');
}

// Pixel size from the image header; the page also lays out with the loaded size.
function notesImageSize(uri, key) {
  const m = /^data:image\/[A-Za-z0-9.+-]+;base64,([A-Za-z0-9+/=\s]+)$/.exec(typeof uri === 'string' ? uri : '');
  if (!m) throw new Error(`The image ${key} must be a base64 image data URI.`);
  let bin;
  try {
    bin = atob(m[1].replace(/\s+/g, ''));
  } catch {
    throw new Error(`The image ${key} is not valid base64.`);
  }
  const b = (i) => bin.charCodeAt(i) & 0xff;
  const be16 = (i) => (b(i) << 8) | b(i + 1);
  const le16 = (i) => b(i) | (b(i + 1) << 8);
  const be32 = (i) => b(i) * 16777216 + (b(i + 1) << 16) + (b(i + 2) << 8) + b(i + 3);
  const le24 = (i) => b(i) | (b(i + 1) << 8) | (b(i + 2) << 16);
  let size = null;
  if (bin.length >= 24 && bin.startsWith('\x89PNG\r\n\x1a\n') && bin.slice(12, 16) === 'IHDR') {
    size = { w: be32(16), h: be32(20) };
  } else if (bin.length >= 10 && /^GIF8[79]a/.test(bin.slice(0, 6))) {
    size = { w: le16(6), h: le16(8) };
  } else if (bin.length >= 30 && bin.slice(0, 4) === 'RIFF' && bin.slice(8, 12) === 'WEBP') {
    const chunk = bin.slice(12, 16);
    if (chunk === 'VP8X') size = { w: le24(24) + 1, h: le24(27) + 1 };
    else if (chunk === 'VP8 ') size = { w: le16(26) & 0x3fff, h: le16(28) & 0x3fff };
    else if (chunk === 'VP8L') {
      const n = (b(21) | (b(22) << 8) | (b(23) << 16) | (b(24) << 24)) >>> 0;
      size = { w: (n & 0x3fff) + 1, h: ((n >>> 14) & 0x3fff) + 1 };
    }
  } else if (bin.length >= 4 && b(0) === 0xff && b(1) === 0xd8) {
    let i = 2;
    while (i + 9 < bin.length) {
      if (b(i) !== 0xff) break;
      const marker = b(i + 1);
      if (marker === 0xff) { i += 1; continue; }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) { i += 2; continue; }
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        size = { w: be16(i + 7), h: be16(i + 5) };
        break;
      }
      i += 2 + be16(i + 2);
    }
  }
  if (!size || !(size.w > 0) || !(size.h > 0)) {
    throw new Error(`The image ${key} must be a PNG, JPEG, GIF or WebP picture.`);
  }
  return size;
}

function notesKind(line) {
  if (!line) return null;
  if (line.type === 'check' || line.type === 'image' || line.type === 'divider') return line.type;
  return 'p';
}

function notesIsText(line) {
  const k = notesKind(line);
  return k === 'p' || k === 'check';
}

// The whole movie as blocks with show/hide times, keystrokes, blink holds and
// events, in raw seconds (snapped later). Mirrors record-notes.js step by step.
function notesPlan(thread, timing) {
  const lines = thread.lines;
  const blocks = [];
  const presses = [];
  const holds = [];
  const events = [{ t: 0, kind: 'open' }];
  const add = (kind, show, extra) => {
    const block = { kind, show, hide: null, chars: [], times: [], tick: null, ...extra };
    blocks.push(block);
    return block;
  };
  const caretKind = (line) => (notesIsText(line) ? notesKind(line) : 'p');
  let t = 0;
  let cur = null;
  lines.forEach((line, li) => {
    const id = `line-${li + 1}`;
    const kind = notesKind(line);
    if (li === 0) cur = add(caretKind(line), 0);
    else if (notesIsText(lines[li - 1])) {
      cur = add(caretKind(line), t);
      presses.push({ t, end: t + timing.return_s, key: '\n' });
      events.push({ t, kind: 'return', id });
      t += timing.return_s;
    }
    const pre = line.pre_pause_seconds ?? (li === 0 ? timing.first_pre_pause_s : timing.pre_pause_s);
    holds.push({ t, end: t + pre });
    t += pre;
    if (kind === 'p' || kind === 'check') {
      const chars = notesGraphemes(line.text);
      const per = line.type_seconds / chars.length;
      chars.forEach((c, ci) => {
        const jitter = /[\s.,→]/.test(c) ? timing.pause_factor : 0.8 + ((ci * 37) % 10) / 25;
        const d = per * jitter;
        cur.chars.push(c);
        cur.times.push(t);
        presses.push({ t, end: t + d, key: c });
        if (ci === 0) events.push({ t, kind: 'type', id });
        if (ci === chars.length - 1) events.push({ t, kind: 'typed', id });
        t += d;
      });
      if (kind === 'check' && line.checked) {
        cur.tick = t;
        events.push({ t, kind: 'tick', id });
        holds.push({ t, end: t + timing.tick_hold_s });
        t += timing.tick_hold_s;
      }
    } else {
      cur.hide = t;
      add(kind, t, kind === 'image' ? { image: line.image, caption: line.caption ?? null } : {});
      cur = add(caretKind(lines[li + 1]), t);
      events.push({ t, kind: 'insert', id });
    }
  });
  return { blocks, presses, holds, events, end: t };
}

function notesStatusBar(sb, icons, batteryTemplate) {
  const time = sb.time || '9:41';
  const pct = sb.battery_pct ?? 87;
  const focus = sb.show_focus_glyph ?? false;
  return `
    <div class="status-bar">
      <div class="status-time">
        <span>${notesEsc(time)}</span>
        ${focus ? `<span class="focus-glyph">${icons.focusBed}</span>` : ''}
      </div>
      <div class="status-right">
        ${icons.signal}
        ${icons.wifi}
        ${notesBattery(batteryTemplate, pct, !!sb.battery_low)}
      </div>
    </div>`;
}

function notesToolbar(icons) {
  return `
    <div class="toolbar">
      <div class="toolbar-pill toolbar-back">${icons.backChevron}</div>
      <div class="toolbar-right">
        <div class="toolbar-actions">
          ${icons.undo}
          ${icons.share}
          ${icons.more}
        </div>
        <div class="toolbar-done">${icons.done}</div>
      </div>
    </div>`;
}

function notesKeyboard(kb, icons) {
  const sug = kb.suggestions || ['see', 'go', 'do'];
  const r1 = (kb.letters_row1 || 'qwertyuiop').split('');
  const r2 = (kb.letters_row2 || 'asdfghjkl').split('');
  const r3 = (kb.letters_row3 || 'zxcvbnm').split('');
  const ltr = (c) => (kb.shift === 'upper' ? c.toUpperCase() : c);
  const keys = (row) => row.map((c) => `<div class="kbd-key">${ltr(c)}</div>`).join('');
  return `
    <div class="kbd">
      <div class="kbd-format">
        <div>${icons.formatAa}</div>
        <div>${icons.formatChecklist}</div>
        <div>${icons.formatTable}</div>
        <div>${icons.formatAttach}</div>
        <div>${icons.formatPen}</div>
        <div>${icons.formatAi}</div>
      </div>
      <div class="kbd-base">
        <div class="kbd-suggestions">
          ${sug.map((s) => `<div class="kbd-suggestion">${notesEsc(notesSmartFull(s))}</div>`).join('')}
        </div>
        <div class="kbd-row">${keys(r1)}</div>
        <div class="kbd-row kbd-row--abc">${keys(r2)}</div>
        <div class="kbd-row kbd-row--zxc">
          <div class="kbd-key kbd-key--wide">${icons.shift}</div>
          ${keys(r3)}
          <div class="kbd-key kbd-key--wide">${icons.backspace}</div>
        </div>
        <div class="kbd-bottom">
          <div class="kbd-key kbd-key--num">123</div>
          <div class="kbd-key kbd-key--emoji">${NOTES_EMOJI_KEY}</div>
          <div class="kbd-key kbd-key--space">space</div>
          <div class="kbd-key kbd-key--return">${icons.returnArrow}</div>
        </div>
        <div class="kbd-footer">
          ${icons.globe}
          ${icons.mic}
        </div>
      </div>
    </div>`;
}

function notesBodyHtml(blocks, images, sizes) {
  const out = [];
  let group = -1;
  let inGroup = false;
  blocks.forEach((b, i) => {
    if (b.kind !== 'check' && inGroup) {
      out.push('</div>');
      inGroup = false;
    }
    if (b.kind === 'p') out.push(`<p class="note-paragraph" data-nb="${i}" style="display:none"></p>`);
    else if (b.kind === 'check') {
      if (!inGroup) {
        group += 1;
        out.push(`<div class="note-checklist" data-ng="${group}" style="display:none">`);
        inGroup = true;
      }
      out.push(`<div class="note-check" data-nb="${i}" style="display:none"><div class="note-check-box">${notesCheckSvg}</div><div class="note-check-text"></div></div>`);
    } else if (b.kind === 'image') {
      const size = sizes[b.image];
      const cap = b.caption ? `<div class="note-image-caption">${notesEsc(b.caption)}</div>` : '';
      out.push(`<div data-nb="${i}" style="display:none"><img class="note-image" src="${notesEsc(images[b.image])}" width="${size.w}" height="${size.h}" decoding="sync" alt="">${cap}</div>`);
    } else if (b.kind === 'divider') out.push(`<hr class="note-divider" data-nb="${i}" style="display:none">`);
  });
  if (inGroup) out.push('</div>');
  return out.join('\n');
}

// Runs in the page, never in Node. Everything on screen is a pure function of
// the movie time passed to window.seek; the only layout-dependent part (when
// the note scrolls) is measured from the page's own layout and cached until
// the fonts or images it was measured with change.
function notesPageScript() {
  const D = JSON.parse(document.getElementById('notes-data').textContent);
  const EPS = 1e-6;
  const screen = document.querySelector('.screen');
  const note = document.querySelector('.note');
  const els = D.blocks.map((b, i) => document.querySelector('[data-nb="' + i + '"]'));
  const holders = D.blocks.map((b, i) => (b.kind === 'check' ? els[i].querySelector('.note-check-text') : els[i]));
  const groups = [...document.querySelectorAll('[data-ng]')].map((g) => ({ el: g, kids: [...g.querySelectorAll('[data-nb]')] }));
  const letters = [...document.querySelectorAll('.kbd-row .kbd-key')].filter((k) => !k.children.length && k.textContent.length === 1);
  const base = letters.map((k) => k.textContent.toLowerCase());
  const space = document.querySelector('.kbd-key--space');
  const ret = document.querySelector('.kbd-key--return');
  const probe = document.querySelector('.notes-probe');
  const pop = document.createElement('div');
  pop.className = 'key-pop';
  pop.style.display = 'none';
  screen.appendChild(pop);
  const smart = (s) => s.replace(/(^|[\s(\[{<])"/g, '$1“').replace(/"/g, '”')
    .replace(/(^|[\s(\[{<])'/g, '$1‘').replace(/'/g, '’');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ease = (p) => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
  const reached = (t, now) => t !== null && t <= now + EPS;
  const isText = (b) => b.kind === 'p' || b.kind === 'check';

  const layout = (now, caretOn) => {
    let caret = -1;
    D.blocks.forEach((b, i) => {
      const shown = reached(b.show, now) && !reached(b.hide, now);
      els[i].style.display = shown ? '' : 'none';
      if (shown && isText(b)) caret = i;
    });
    for (const g of groups) g.el.style.display = g.kids.some((k) => k.style.display !== 'none') ? '' : 'none';
    D.blocks.forEach((b, i) => {
      if (!isText(b)) return;
      let n = 0;
      while (n < b.times.length && reached(b.times[n], now)) n++;
      const cursor = i === caret ? '<span class="cursor' + (caretOn ? '' : ' off') + '"></span>' : '';
      holders[i].innerHTML = esc(smart(b.chars.slice(0, n).join(''))) + cursor;
      if (b.kind === 'check') {
        const done = reached(b.tick, now);
        els[i].querySelector('.note-check-box').classList.toggle('note-check-box--checked', done);
        holders[i].classList.toggle('note-check-text--done', done);
      }
    });
    return caret;
  };

  let sched = null;
  let keyRects = [];
  let stamp = '';
  const fingerprint = () => {
    const r = probe.getBoundingClientRect();
    const imgs = [...document.images].map((im) => (im.complete ? 1 : 0) + ':' + im.naturalWidth + 'x' + im.naturalHeight).join(',');
    return [document.fonts ? document.fonts.status : '', r.width, r.height, imgs].join('|');
  };
  const schedule = () => {
    const fp = fingerprint();
    if (sched && fp === stamp) return sched;
    note.style.transform = 'none';
    const sr = screen.getBoundingClientRect();
    keyRects = letters.map((k) => {
      const r = k.getBoundingClientRect();
      return { left: (r.left - sr.left) / D.scale, bottom: (r.bottom - sr.top) / D.scale, width: r.width / D.scale, height: r.height / D.scale };
    });
    const times = new Set([0]);
    for (const b of D.blocks) {
      times.add(b.show);
      if (b.hide !== null) times.add(b.hide);
      for (const t of b.times) times.add(t);
    }
    const out = [];
    let target = 0;
    for (const t of [...times].sort((a, b) => a - b)) {
      const ci = layout(t, true);
      if (ci < 0) continue;
      const cur = holders[ci].querySelector('.cursor');
      const bottom = (cur.getBoundingClientRect().bottom - sr.top) / D.scale;
      if (bottom - target > D.limit + EPS) {
        target = bottom - D.limit + D.extra;
        out.push({ t, to: target, dur: t === 0 ? 0 : D.scroll_s });
      }
    }
    sched = out;
    stamp = fingerprint();
    return out;
  };
  const scrollAt = (now) => {
    const at = (s, time) => (s.dur > 0 ? s.from + (s.to - s.from) * ease((time - s.t) / s.dur) : s.to);
    let seg = { t: 0, from: 0, to: 0, dur: 0 };
    for (const s of schedule()) {
      if (s.t > now + EPS) break;
      seg = { t: s.t, from: at(seg, s.t), to: s.to, dur: s.dur };
    }
    return at(seg, now);
  };

  let last = 0;
  window.seek = (ms) => {
    last = ms;
    const now = Math.max(0, Number(ms) || 0) / 1000;
    const y = scrollAt(now);
    let hold = null;
    for (const h of D.holds) if (reached(h.t, now) && !reached(h.end, now)) hold = h;
    const caretOn = !hold || !(D.blink > 0) || Math.floor((now - hold.t + EPS) / D.blink) % 2 === 0;
    layout(now, caretOn);
    note.style.transform = 'translateY(' + -y + 'px)';
    let press = null;
    for (const p of D.presses) if (reached(p.t, now) && !reached(p.end, now)) press = p;
    const key = press ? press.key : null;
    const upper = D.shift === 'upper' || (key !== null && /^[A-Z]$/.test(key));
    letters.forEach((k, i) => {
      const c = upper ? base[i].toUpperCase() : base[i];
      if (k.textContent !== c) k.textContent = c;
    });
    if (space) space.classList.toggle('down', key === ' ');
    if (ret) ret.classList.toggle('down', key === '\n');
    const hit = key !== null && /^[a-z]$/i.test(key) ? base.indexOf(key.toLowerCase()) : -1;
    if (hit >= 0) {
      const r = keyRects[hit];
      const pw = r.width * 1.55;
      const ph = r.height * 1.9;
      pop.style.left = r.left + r.width / 2 - pw / 2 + 'px';
      pop.style.top = r.bottom - ph + 'px';
      pop.style.width = pw + 'px';
      pop.style.height = ph + 'px';
      pop.textContent = key;
      pop.style.display = '';
    } else pop.style.display = 'none';
  };
  window.seek(0);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => window.seek(last));
}

/**
 * Builds the Apple Notes page for one thread.
 * thread: valid against NOTES_THREAD_SCHEMA.
 * env: { width, height, fps, theme, safe_area, assets, font_css, images, timing }.
 * Returns { html, events, total_s, cues }.
 */
function notesBuild(thread, env) {
  if (!env || typeof env !== 'object') throw new Error('The Apple Notes skin needs a render environment.');
  const timing = notesTiming(env.timing);
  const canvas = notesCanvas(env);
  const fps = env.fps;
  const assets = env.assets || {};
  const { icons, battery } = notesIcons(assets['icons.js']);
  const css = notesCss(assets['note.css']);
  const fontCss = typeof env.font_css === 'string' ? env.font_css : '';
  if (/<\/style/i.test(fontCss)) throw new Error('The font CSS must not close its style element.');

  const images = env.images || {};
  const sizes = {};
  thread.lines.forEach((line, li) => {
    if (notesKind(line) !== 'image') return;
    if (!Object.prototype.hasOwnProperty.call(images, line.image)) {
      throw new Error(`Line ${li + 1} shows the image ${line.image}, which is not among the provided images.`);
    }
    sizes[line.image] = notesImageSize(images[line.image], line.image);
  });

  const plan = notesPlan(thread, timing);
  const snap = (t) => (t === null ? null : notesSnap(t, fps));
  const postHold = Math.max(0.5, thread.post_hold_seconds ?? timing.post_hold_s);
  const doneAt = snap(plan.end);
  const total = notesSnap(doneAt + postHold, fps);
  const events = plan.events.map((e) => ({ ...e, t: snap(e.t) }));
  events.push({ t: doneAt, kind: 'done' });
  events.sort((a, b) => a.t - b.t);
  const holds = plan.holds.map((h) => ({ t: snap(h.t), end: snap(h.end) }));
  holds.push({ t: doneAt, end: null });

  const kb = thread.keyboard_state || { suggestions: ['I', 'The', 'My'], shift: 'lower' };
  const sb = thread.status_bar || { time: '9:41', battery_pct: 72 };
  const data = {
    scale: canvas.scale,
    limit: canvas.limit,
    extra: NOTES_SCROLL_EXTRA,
    blink: timing.blink_s,
    scroll_s: timing.scroll_s,
    shift: kb.shift === 'upper' ? 'upper' : 'lower',
    blocks: plan.blocks.map((b) => ({
      kind: b.kind,
      show: snap(b.show),
      hide: snap(b.hide),
      chars: b.chars,
      times: b.times.map(snap),
      tick: snap(b.tick),
    })),
    presses: plan.presses.map((p) => ({ t: snap(p.t), end: snap(p.end), key: p.key })),
    holds,
  };

  const probeText = [thread.title, ...thread.lines.map((l) => l.text || l.caption || '')].join(' ');
  const overrides = `
html, body { width: ${canvas.width}px !important; height: ${canvas.height}px !important; overflow: hidden !important; margin: 0; background: #ffffff; }
.screen { width: ${canvas.W}px !important; height: ${canvas.H}px !important; transform: scale(${canvas.scale}); transform-origin: 0 0; }
.note { top: ${canvas.top}px; left: ${canvas.left}px; right: ${canvas.right}px; transition: none; will-change: transform; }
.note-body .cursor.off { opacity: 0; }
.key-pop { position: absolute; z-index: 30; background: #fff; border-radius: 22px;
  box-shadow: 0 4px 14px rgba(0,0,0,.28); display: flex; align-items: flex-start;
  justify-content: center; font: 400 96px ${NOTES_FONT}; color: #1c1c1e; padding-top: 26px; }
.kbd-key.down { background: #abafb8 !important; }
.note-check-box > svg { display: none; position: absolute; inset: 0; margin: auto; width: 60%; height: 60%; }
.note-check-box--checked > svg { display: block; }
.notes-probe { position: absolute; left: 0; top: 0; visibility: hidden; white-space: pre; pointer-events: none; z-index: -1; }
.notes-probe .t { font-weight: 700; font-size: 104px; }
.notes-probe .b { font-weight: 400; font-size: 58px; }
`;
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Apple Notes</title>
<style>${fontCss}</style>
<style>${css}${overrides}</style>
</head>
<body>
<div class="screen">
  ${notesStatusBar(sb, icons, battery)}
  ${notesToolbar(icons)}
  <div class="note">
    <h1 class="note-title">${notesEsc(notesSmartFull(thread.title))}</h1>
    <div class="note-body">
${notesBodyHtml(plan.blocks, images, sizes)}
    </div>
  </div>
  ${notesKeyboard(kb, icons)}
  <div class="notes-probe" aria-hidden="true"><span class="t">${notesEsc(notesSmartFull(thread.title))}</span><span class="b">${notesEsc(probeText)} “”‘’</span></div>
</div>
<script type="application/json" id="notes-data">${json}</script>
<script>(${notesPageScript.toString()})();</script>
</body>
</html>
`;
  const tokens = (t) => String(t || '').trim().split(/\s+/u).filter(Boolean).length;
  const typed = thread.lines.filter((l) => notesIsText(l));
  const stats = {
    messages: typed.length,
    words: tokens(thread.title) + typed.reduce((n, l) => n + tokens(l.text), 0),
    photos: thread.lines.filter((l) => notesKind(l) === 'image').length,
  };
  return { html, events, total_s: total, cues: [], stats };
}

// ---- phone-chat/src/skins/notification-cascade.mjs ----
// The notification-cascade skin: render-imessage-cascade as one frame-stepped
// page. A phone lies face-up on a desk (the plate photo, cover-fitted, with the
// atom's slow Ken-Burns push-in) while authentic iMessage notification banners
// (green Messages icon, warm translucent greige fill, soft dark shadow, title,
// body, "now" and the brand handle) spring in at the BOTTOM, one per
// notification, and push the stack UP; the grouped "Show less / X" pill rides
// above the stack; the X clears it (swipe up and fade); an optional resolution
// banner then holds. The end card is another part.
// Geometry is the atom's contract at 1080x1920 (banner 810 wide at SIDE 135,
// 176 tall for one body line, row pitch 214, the newest banner's bottom at
// 1436), scaled uniformly to the canvas. Bodies wrap to two lines at most,
// measured with the supplied KitText font; copy that cannot fit is refused,
// never shrunk. Movie time drives every pixel: seek(ms) draws the state at that
// time from one event timeline.
// Pure: no imports; every top-level name starts with `nc`/`NC_`.

const NC_PACING = {
  first_arrival_seconds: 1.6,
  arrival_every_seconds: 2,
  clear_after_seconds: 1.6,
  resolution_hold_seconds: 1.5,
  ending_after_seconds: 0.7,
};
// layout.py's timing rules: arrivals at least 0.7 s apart, the last one held a
// second before the clear, the resolution held at least 1.5 s; the ending hold
// keeps the last state on screen at least 0.5 s.
const NC_PACING_MIN = {
  first_arrival_seconds: 0,
  arrival_every_seconds: 0.7,
  clear_after_seconds: 1,
  resolution_hold_seconds: 1.5,
  ending_after_seconds: 0.5,
};
const NC_PACING_MAX = {
  first_arrival_seconds: 10,
  arrival_every_seconds: 10,
  clear_after_seconds: 10,
  resolution_hold_seconds: 10,
  ending_after_seconds: 5,
};
const NC_RESOLUTION_AFTER = 0.7; // layout.py: the resolution arrives 0.7 s after the clear

// build_assets.py + compose.py geometry, in 1080x1920 px.
const NC_GEO = {
  W: 1080,
  H: 1920,
  BODY_W: 810,
  BANNER_H: 176, // one body line; each extra line adds LINE_STEP
  LINE_STEP: 44,
  ROW_GAP: 38, // pitch = banner height + 38 (214 for one line)
  BOTTOM: 1436, // the newest banner's bottom edge, just above the phone
  RADIUS: 40,
  ICON: 100,
  ICON_INSET: 24,
  TEXT_X: 148, // icon inset + icon + 24
  TEXT_RIGHT: 26, // the text column ends 26 px inside the banner (TEXT_RIGHT 919)
  NOW_ROOM: 95, // the title stops short of "now"
  TITLE_Y: 34,
  BODY_Y: 84,
  NOW_Y: 30,
  HANDLE_UP: 42, // the handle's top, up from the banner's bottom
  TITLE_PX: 38,
  BODY_PX: 36,
  META_PX: 25,
  PILL_H: 72,
  PILL_ABOVE: 24, // the pill's bottom sits 24 px above the top banner
  PILL_PX: 31,
  X_SIZE: 72,
  X_GAP: 18,
  TOP_ROOM: 34, // the pill's top stays this far below the top band (layout.py: 220 + 34)
};
// compose.py's motion: push = 1 - e^(-7 dt), spring = 60 e^(-9 dt), clear = 560 (1 - e^(-12 dt)),
// fades 0.35 s in and 0.4 s out (0.3 s for the resolution), the plate's 0.5 s fade from
// black and its zoompan push-in of 0.00026 per frame at 30 fps, capped at 1.13.
const NC_MOTION = {
  push_rate: 7,
  spring_px: 60,
  spring_rate: 9,
  clear_px: 560,
  clear_rate: 12,
  fade_in: 0.35,
  fade_out: 0.4,
  res_fade: 0.3,
  plate_fade: 0.5,
  zoom_per_s: 0.0078,
  zoom_max: 1.13,
};
const NC_POP = 'pop.wav';
const NC_SWOOSH = 'swoosh.wav';
const NC_POP_GAIN = 0.8;
const NC_SWOOSH_GAIN = 0.5;

const NC_ID = { type: 'string', pattern: '^[A-Za-z0-9_-]{1,40}$' };
const NC_BANNER = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'title', 'body'],
  properties: {
    id: NC_ID,
    title: { type: 'string', minLength: 1, maxLength: 40, pattern: '\\S' },
    body: { type: 'string', minLength: 1, maxLength: 400, pattern: '\\S' },
  },
};

const NC_THREAD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['handle', 'notifications', 'plate'],
  properties: {
    handle: { type: 'string', minLength: 1, maxLength: 30, pattern: '\\S' },
    notifications: { type: 'array', minItems: 1, maxItems: 6, items: NC_BANNER },
    resolution: { oneOf: [{ type: 'null' }, NC_BANNER] },
    plate: { type: 'string', pattern: '^[a-z0-9][a-z0-9_-]{0,39}$' },
    pacing: {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(
        Object.keys(NC_PACING).map((k) => [k, { type: 'number', minimum: NC_PACING_MIN[k], maximum: NC_PACING_MAX[k] }]),
      ),
    },
  },
};

// Fallback advance widths in em, used only when the KitText font cannot be read
// from env.font_css: the widest of Inter and Montserrat Light/Bold (regular,
// semibold, italic) as Chromium lays them out, rounded up.
const NC_EM_GROUPS = [
  [' ', 0.29],
  ['il.,:;\'!’j', 0.31],
  ['frtI()[]{}/\\-1|', 0.45],
  ['"*“”J?zs_', 0.57],
  ['m', 1.07],
  ['w', 0.93],
  ['W', 1.17],
  ['M', 0.96],
  ['@', 1.04],
  ['%', 0.91],
  ['—', 1],
  ['…', 0.8],
];
const NC_EMOJI_EM = 1.3;
const NC_BOLD_WIDEN = 1.06; // a semibold title against the font's default (regular) advances
const NC_FIT_SLACK = 1.02;

function ncEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function ncFallbackEm(ch) {
  for (const [chars, em] of NC_EM_GROUPS) if (chars.includes(ch)) return em;
  const cp = ch.codePointAt(0);
  if (/[A-Z]/.test(ch)) return 0.85;
  if (cp < 0x80) return 0.72;
  if ((cp >= 0x2e80 && cp <= 0x9fff) || (cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xff00 && cp <= 0xffef)) return 1;
  return 0.8;
}

/** The base64 bytes of the KitText face in env.font_css, or null. */
function ncKitTextData(css) {
  for (const block of String(css || '').match(/@font-face\s*\{[^}]*\}/g) || []) {
    if (!/font-family\s*:\s*['"]?KitText['"]?\s*[;}]/.test(block)) continue;
    const m = /url\(\s*['"]?data:[^,'")]*;base64,([A-Za-z0-9+/=\s]+)['"]?\s*\)/.exec(block);
    return m ? m[1] : null;
  }
  return null;
}

/**
 * Advance widths (em) from a TrueType/OpenType font: cp -> em, or null when the
 * font has no glyph for cp. Reads head, hhea, hmtx and a Unicode cmap (format
 * 12 or 4). Returns null for anything it cannot read (woff, woff2, a collection).
 */
function ncFontAdvances(b64) {
  const bin = atob(b64.replace(/\s+/g, ''));
  const size = bin.length;
  const u16 = (i) => {
    if (i < 0 || i + 2 > size) throw new Error('font out of range');
    return (bin.charCodeAt(i) << 8) | bin.charCodeAt(i + 1);
  };
  const i16 = (i) => {
    const v = u16(i);
    return v & 0x8000 ? v - 0x10000 : v;
  };
  const u32 = (i) => u16(i) * 65536 + u16(i + 2);
  const tag = u32(0);
  if (tag !== 0x00010000 && tag !== 0x74727565 && tag !== 0x4f54544f) return null;
  const tables = {};
  for (let i = 0, n = u16(4); i < n; i++) tables[bin.slice(12 + 16 * i, 16 + 16 * i)] = u32(12 + 16 * i + 8);
  for (const t of ['head', 'hhea', 'hmtx', 'cmap']) if (!(t in tables)) return null;
  const upm = u16(tables.head + 18);
  const metrics = u16(tables.hhea + 34);
  if (!upm || !metrics) return null;
  const cmap = tables.cmap;
  let f4 = null;
  let f12 = null;
  for (let i = 0, n = u16(cmap + 2); i < n; i++) {
    const rec = cmap + 4 + 8 * i;
    const platform = u16(rec);
    const encoding = u16(rec + 2);
    if (!(platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10)))) continue;
    const at = cmap + u32(rec + 4);
    const format = u16(at);
    if (format === 12 && f12 === null) f12 = at;
    if (format === 4 && f4 === null) f4 = at;
  }
  if (f12 === null && f4 === null) return null;
  const glyph = (cp) => {
    if (f12 !== null) {
      for (let g = 0, n = u32(f12 + 12); g < n; g++) {
        const at = f12 + 16 + 12 * g;
        const start = u32(at);
        if (cp < start) return 0;
        if (cp <= u32(at + 4)) return u32(at + 8) + (cp - start);
      }
      return 0;
    }
    if (cp > 0xffff) return 0;
    const segs = u16(f4 + 6) / 2;
    const ends = f4 + 14;
    const starts = ends + 2 * segs + 2;
    const deltas = starts + 2 * segs;
    const ranges = deltas + 2 * segs;
    for (let s = 0; s < segs; s++) {
      if (cp > u16(ends + 2 * s)) continue;
      const start = u16(starts + 2 * s);
      if (cp < start) return 0;
      const ro = u16(ranges + 2 * s);
      if (!ro) return (cp + i16(deltas + 2 * s)) & 0xffff;
      const g = u16(ranges + 2 * s + ro + 2 * (cp - start));
      return g ? (g + i16(deltas + 2 * s)) & 0xffff : 0;
    }
    return 0;
  };
  const cache = new Map();
  return (cp) => {
    if (!cache.has(cp)) {
      const g = glyph(cp);
      cache.set(cp, g ? u16(tables.hmtx + 4 * Math.min(g, metrics - 1)) / upm : null);
    }
    return cache.get(cp);
  };
}

/** measure(text, px, weight) -> px: the supplied font's advances, else the fallback table. */
function ncMeasurer(fontCss) {
  let advance = null;
  const data = ncKitTextData(fontCss);
  if (data) {
    try {
      advance = ncFontAdvances(data);
    } catch {
      advance = null;
    }
  }
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return (text, px, weight) => {
    let em = 0;
    for (const { segment } of segmenter.segment(text)) {
      const cp = segment.codePointAt(0);
      const own = advance && [...segment].length === 1 ? advance(cp) : null;
      if (own !== null) em += own * (weight >= 600 ? NC_BOLD_WIDEN : 1);
      else if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(segment)) em += NC_EMOJI_EM;
      else em += (advance && advance(cp)) || ncFallbackEm(String.fromCodePoint(cp));
    }
    return em * px * NC_FIT_SLACK;
  };
}

/** layout.py's wrap: whole words, at most maxLines lines, a plain Error when the copy cannot fit. */
function ncWrap(text, width, maxLines, measure, what) {
  const words = String(text).trim().split(/\s+/);
  const lines = [''];
  for (const word of words) {
    if (measure(word) > width) throw new Error(`${what}: the word "${word}" is wider than the banner; shorten it (the type never shrinks).`);
    const last = lines[lines.length - 1];
    const candidate = last ? `${last} ${word}` : word;
    if (measure(candidate) <= width) lines[lines.length - 1] = candidate;
    else lines.push(word);
  }
  if (lines.length > maxLines) {
    throw new Error(`${what} needs ${lines.length} lines; ${maxLines === 1 ? 'it must fit on one line' : `the most is ${maxLines}`}. Shorten the copy (the type never shrinks).`);
  }
  return lines;
}

function ncValidate(thread, env) {
  const { width, height, fps } = env;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width % 2 || height % 2 || width < 320 || height < 320) {
    throw new Error('env.width and env.height must be even whole numbers, at least 320.');
  }
  if (!Number.isInteger(fps) || fps < 1) throw new Error('env.fps must be a positive whole number.');
  if (env.timing != null && (typeof env.timing !== 'object' || Object.keys(env.timing).length)) {
    throw new Error('The notification cascade takes its pacing from thread.pacing; leave env.timing empty.');
  }
  const ids = new Set();
  for (const n of [...thread.notifications, ...(thread.resolution ? [thread.resolution] : [])]) {
    if (ids.has(n.id)) throw new Error(`Every notification and the resolution need a unique id; ${n.id} is used twice.`);
    ids.add(n.id);
  }
  if (!(env.images || {})[thread.plate]) throw new Error(`The plate image ${thread.plate} was not supplied.`);
}

function ncPacing(thread) {
  const P = { ...NC_PACING };
  for (const [key, value] of Object.entries(thread.pacing || {})) {
    if (!(key in NC_PACING)) throw new Error(`Unknown notification-cascade pacing ${key}.`);
    if (!Number.isFinite(value) || value < NC_PACING_MIN[key] || value > NC_PACING_MAX[key]) {
      throw new Error(`pacing.${key} must be a number from ${NC_PACING_MIN[key]} to ${NC_PACING_MAX[key]} seconds.`);
    }
    P[key] = value;
  }
  return P;
}

function ncTimeline(thread, P, fps) {
  const snap = (t) => Math.ceil((t - 1e-8) * fps) / fps;
  const arrivals = thread.notifications.map((_, i) => snap(P.first_arrival_seconds + i * P.arrival_every_seconds));
  const clear = snap(arrivals[arrivals.length - 1] + P.clear_after_seconds);
  const events = thread.notifications.map((n, i) => ({ t: arrivals[i], kind: 'arrive', id: n.id }));
  events.push({ t: clear, kind: 'clear' });
  let resolution = null;
  let last = clear;
  if (thread.resolution) {
    resolution = snap(clear + NC_RESOLUTION_AFTER);
    events.push({ t: resolution, kind: 'resolve', id: thread.resolution.id });
    last = snap(resolution + P.resolution_hold_seconds);
  }
  return { events, arrivals, clear, resolution, total: snap(last + P.ending_after_seconds) };
}

/** The banners' measured lines and the stack's place on the canvas (layout.py's geometry). */
function ncLayout(thread, env) {
  const G = NC_GEO;
  const { width: W, height: H } = env;
  const u = Math.min(W / G.W, H / G.H);
  const measure = ncMeasurer(env.font_css);
  const column = G.BODY_W - G.TEXT_X - G.TEXT_RIGHT;
  if (measure(thread.handle.trim(), G.META_PX, 400) > column) throw new Error('The handle does not fit on one line of the banner; shorten it.');
  const all = [...thread.notifications, ...(thread.resolution ? [thread.resolution] : [])];
  const banners = all.map((n) => {
    const title = n.title.trim();
    if (measure(title, G.TITLE_PX, 600) > column - G.NOW_ROOM) {
      throw new Error(`The title of ${n.id} does not fit on one line beside "now"; shorten it (the type never shrinks).`);
    }
    return { id: n.id, title, lines: ncWrap(n.body, column, 2, (s) => measure(s, G.BODY_PX, 400), `The body of ${n.id}`) };
  });
  const lines = Math.max(...banners.map((b) => b.lines.length));
  const bannerH = G.BANNER_H + G.LINE_STEP * (lines - 1);
  const pitch = bannerH + G.ROW_GAP;
  const bottom = (H * G.BOTTOM) / G.H;
  const yb = bottom - bannerH * u;
  let left = W / 2 - (G.BODY_W / 2) * u;
  const safe = env.safe_area || null;
  if (safe) {
    const right = W - (safe.right || 0);
    if (left + G.BODY_W * u > right) left = right - G.BODY_W * u;
    if (left < (safe.left || 0)) throw new Error('The banners do not fit between the safe area\'s side bands.');
    if (bottom > H - (safe.bottom || 0)) throw new Error('The newest banner would sit in the safe area\'s bottom band.');
  }
  const n = thread.notifications.length;
  const pillTop = yb - pitch * u * (n - 1) - (G.PILL_ABOVE + G.PILL_H) * u;
  if (pillTop < ((safe && safe.top) || 0) + G.TOP_ROOM * u) {
    throw new Error(
      `${n} notification${n === 1 ? '' : 's'} with ${lines === 1 ? 'one-line' : 'two-line'} bodies do not fit above the phone${safe ? ' below the safe area\'s top band' : ''}; use fewer notifications or one-line copy.`,
    );
  }
  return { u, left, yb, pitch: pitch * u, bannerH: bannerH * u, banners };
}

function ncIcon(id) {
  return (
    `<svg class="nc-icon" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    '<stop offset="0" stop-color="#63E85C"/><stop offset="1" stop-color="#1CC73E"/></linearGradient></defs>' +
    `<rect width="100" height="100" rx="23.5" fill="url(#${id})"/>` +
    '<ellipse cx="50" cy="47" rx="31" ry="26" fill="#fff"/><path d="M30.5 60.5C30 67 27 72.5 21.5 76.5C29.5 77 37 74 42.5 69.5Z" fill="#fff"/></svg>'
  );
}

function ncBannerHtml(b, i, handle, L, cls) {
  const G = NC_GEO;
  const lines = b.lines.map((line, k) => `<div class="nc-t nc-line" style="top:${ncPx((G.BODY_Y + G.LINE_STEP * k + 0.1 * G.BODY_PX) * L.u)}">${ncEsc(line)}</div>`).join('');
  return (
    `<div class="nc-row ${cls}" data-nc="${ncEsc(b.id)}"><i class="nc-sh"></i><i class="nc-fill"></i>${ncIcon(`nc-g${i}`)}` +
    `<div class="nc-t nc-title">${ncEsc(b.title)}</div><div class="nc-t nc-now">now</div>${lines}<div class="nc-t nc-handle">${ncEsc(handle)}</div></div>`
  );
}

function ncPx(v) {
  return `${+v.toFixed(3)}px`;
}

function ncCss(env, L) {
  const G = NC_GEO;
  const { width: W, height: H } = env;
  const s = (v) => ncPx(v * L.u);
  const shadow = 'rgba(30,22,16,0.47)';
  return `${env.font_css || ''}
html, body { margin: 0; padding: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
body { position: relative; font-family: KitText, KitEmoji, sans-serif; font-optical-sizing: none; -webkit-font-smoothing: antialiased; }
i { font-style: normal; }
.nc-plate { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; object-fit: cover; object-position: 50% 50%; transform-origin: 50% 50%; opacity: 0; }
.nc-row, .nc-pill-row { position: absolute; left: ${ncPx(L.left)}; top: 0; width: ${s(G.BODY_W)}; visibility: hidden; opacity: 0; }
.nc-row { height: ${ncPx(L.bannerH)}; }
.nc-sh { position: absolute; display: block; }
.nc-fill { position: absolute; display: block; left: 0; top: 0; width: 100%; height: 100%; }
.nc-row > .nc-sh { left: ${s(-4)}; top: ${s(-2)}; width: ${s(G.BODY_W + 8)}; height: ${ncPx(L.bannerH + 12 * L.u)}; border-radius: ${s(G.RADIUS + 4)}; background: ${shadow}; filter: blur(${s(26)}); }
.nc-row > .nc-fill { border-radius: ${s(G.RADIUS)}; background: rgba(246,228,219,0.804); }
.nc-icon { position: absolute; display: block; left: ${s(G.ICON_INSET)}; top: ${ncPx((L.bannerH - G.ICON * L.u) / 2)}; width: ${s(G.ICON)}; height: ${s(G.ICON)}; }
.nc-t { position: absolute; white-space: nowrap; line-height: 1; }
.nc-title { left: ${s(G.TEXT_X)}; top: ${s(G.TITLE_Y + 0.1 * G.TITLE_PX)}; font-size: ${s(G.TITLE_PX)}; font-weight: 600; color: rgb(20,20,22); }
.nc-now { right: ${s(G.TEXT_RIGHT)}; top: ${s(G.NOW_Y + 0.1 * G.META_PX)}; font-size: ${s(G.META_PX)}; color: rgb(140,138,140); }
.nc-line { left: ${s(G.TEXT_X)}; font-size: ${s(G.BODY_PX)}; color: rgb(70,68,72); }
.nc-handle { right: ${s(G.TEXT_RIGHT)}; top: ${ncPx(L.bannerH - (G.HANDLE_UP - 0.1 * G.META_PX) * L.u)}; font-size: ${s(G.META_PX)}; font-style: italic; color: rgb(150,146,146); }
.nc-pill-row { height: ${s(G.PILL_H)}; display: flex; justify-content: flex-end; gap: ${s(G.X_GAP)}; }
.nc-pill, .nc-x { position: relative; flex: none; height: ${s(G.PILL_H)}; }
.nc-pill { box-sizing: border-box; padding: 0 ${s(56)} 0 ${s(52)}; display: flex; align-items: center; }
.nc-x { width: ${s(G.X_SIZE)}; }
.nc-pill > .nc-sh, .nc-x > .nc-sh { left: ${s(-2)}; top: 0; right: ${s(-2)}; bottom: ${s(-8)}; background: rgba(30,22,16,0.43); filter: blur(${s(20)}); }
.nc-pill > .nc-sh, .nc-pill > .nc-fill { border-radius: ${s(G.PILL_H / 2 + 2)}; }
.nc-x > .nc-sh, .nc-x > .nc-fill, .nc-press { border-radius: 50%; }
.nc-pill > .nc-fill, .nc-x > .nc-fill { background: rgba(247,244,240,0.824); }
.nc-chev { position: absolute; display: block; left: ${s(18)}; top: ${s(27)}; width: ${s(28)}; height: ${s(18)}; }
.nc-label { position: relative; font-size: ${s(G.PILL_PX)}; line-height: 1; white-space: nowrap; color: rgb(70,68,72); }
.nc-press { position: absolute; display: block; left: 0; top: 0; width: 100%; height: 100%; background: rgba(60,54,48,0.2); opacity: 0; }
.nc-xmark { position: absolute; display: block; left: 0; top: 0; width: 100%; height: 100%; }
`;
}

// The in-page driver: compose.py's overlay expressions, evaluated at seek time.
const NC_DRIVER = String.raw`(() => {
  const D = NC_PAGE;
  const M = D.motion;
  const plate = document.querySelector('.nc-plate');
  const rows = [...document.querySelectorAll('.nc-row.nc-stack')];
  const res = document.querySelector('.nc-row.nc-resolution');
  const pill = document.querySelector('.nc-pill-row');
  const xbtn = document.querySelector('.nc-x');
  const press = document.querySelector('.nc-press');
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const push = (t, a) => 1 - Math.exp(-M.push_rate * Math.max(0, t - a));
  const spring = (t, a) => M.spring_px * Math.exp(-M.spring_rate * Math.max(0, t - a));
  const lift = (t) => M.clear_px * (1 - Math.exp(-M.clear_rate * Math.max(0, t - D.clear)));
  const fadeIn = (t, a, d) => (t < a ? 0 : clamp((t - a) / d));
  const place = (el, y, alpha) => {
    el.style.visibility = alpha > 0 ? 'visible' : 'hidden';
    el.style.opacity = String(alpha);
    el.style.transform = 'translate3d(0,' + y.toFixed(3) + 'px,0)';
  };
  const draw = (t) => {
    const a = D.arrivals;
    plate.style.opacity = String(clamp(t / M.plate_fade));
    plate.style.transform = 'scale(' + Math.min(1 + M.zoom_per_s * t, M.zoom_max).toFixed(6) + ')';
    const out = t < D.clear ? 1 : 1 - clamp((t - D.clear) / M.fade_out);
    const up = lift(t) * D.u;
    rows.forEach((row, k) => {
      let pushed = 0;
      for (let j = k + 1; j < a.length; j++) pushed += push(t, a[j]);
      place(row, D.yb - D.pitch * pushed + spring(t, a[k]) * D.u - up, fadeIn(t, a[k], M.fade_in) * out);
    });
    let above = 0;
    for (let j = 1; j < a.length; j++) above += push(t, a[j]);
    place(pill, D.yb - D.pitch * above - D.pill_gap - up, fadeIn(t, a[0], M.fade_in) * out);
    // The X is pressed just before the stack swipes away.
    const p = clamp((t - (D.clear - 0.2)) / 0.3);
    const bump = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
    xbtn.style.transform = 'scale(' + (1 - 0.08 * bump).toFixed(4) + ')';
    press.style.opacity = bump.toFixed(4);
    if (res) place(res, D.yb + spring(t, D.resolution) * D.u, fadeIn(t, D.resolution, M.res_fade));
  };
  window.seek = (ms) => draw(ms / 1000);
  draw(0);
})();`;

/**
 * The notification-cascade page for `thread`: { html, events, total_s, cues }.
 * `env` = { width, height, fps, theme, safe_area, assets, font_css, images, timing }.
 */
function ncBuild(thread, env) {
  ncValidate(thread, env);
  const P = ncPacing(thread);
  const L = ncLayout(thread, env);
  const { events, arrivals, clear, resolution, total } = ncTimeline(thread, P, env.fps);
  const G = NC_GEO;
  const n = thread.notifications.length;
  const handle = thread.handle.trim();
  const stack = L.banners.slice(0, n).map((b, i) => ncBannerHtml(b, i, handle, L, 'nc-stack')).join('\n');
  const res = thread.resolution ? ncBannerHtml(L.banners[n], n, handle, L, 'nc-resolution') : '';
  const pill =
    '<div class="nc-pill-row"><div class="nc-pill"><i class="nc-sh"></i><i class="nc-fill"></i>' +
    '<svg class="nc-chev" viewBox="-14 -9 28 18" aria-hidden="true"><polyline points="-11,-6 0,6 11,-6" fill="none" stroke="rgb(90,88,90)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '<span class="nc-label">Show less</span></div>' +
    '<div class="nc-x"><i class="nc-sh"></i><i class="nc-fill"></i><i class="nc-press"></i>' +
    '<svg class="nc-xmark" viewBox="0 0 72 72" aria-hidden="true"><path d="M20 20L52 52M20 52L52 20" stroke="rgb(90,88,90)" stroke-width="6" stroke-linecap="round"/></svg></div></div>';
  const page = {
    u: L.u,
    yb: L.yb,
    pitch: L.pitch,
    pill_gap: (G.PILL_ABOVE + G.PILL_H) * L.u,
    arrivals,
    clear,
    resolution,
    motion: NC_MOTION,
  };
  const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=${env.width}, height=${env.height}"><style>${ncCss(env, L)}</style></head>
<body>
<img class="nc-plate" src="${ncEsc(env.images[thread.plate])}" alt="" decoding="sync">
${stack}
${pill}
${res}
<script>const NC_PAGE=${json(page)};
${NC_DRIVER}</script>
</body></html>`;

  // One pop per arrival and one for the resolution, on the first frame that shows
  // the banner; one swoosh on the first frame of the clear (compose.py's cues).
  const onFrame = (t) => Math.ceil((t + 1 / env.fps - 1e-8) * env.fps) / env.fps;
  const cues = events.map((e) =>
    e.kind === 'clear' ? { t: onFrame(e.t), sound: NC_SWOOSH, gain: NC_SWOOSH_GAIN } : { t: onFrame(e.t), sound: NC_POP, gain: NC_POP_GAIN },
  );
  const banners = [...thread.notifications, ...(thread.resolution ? [thread.resolution] : [])];
  const stats = {
    messages: banners.length,
    words: banners.reduce((n, b) => n + String(b.body || '').trim().split(/\s+/u).filter(Boolean).length, 0),
    photos: 0,
  };
  return { html, events, total_s: total, cues, stats };
}

// ---- phone-chat/src/threads.mjs ----
// The plan's scenes, as each skin's thread. The plan writes a phone chat as
// scenes (the style's plan note says how): "Name: text" messages for iMessage
// and the notification cascade, question then answer for ChatGPT, a title
// then one list line per scene for Apple Notes. The style's answers set the
// theme, the phone's clock, a group's name and the resolution message.
// Every top-level name starts with `chat`.

const chatSenderRe = /^\s*([^:\n]{1,40}?)\s*:\s*([\s\S]*)$/;

/** What a scene shows: its on-screen text, else its line. */
function chatSceneText(scene) {
  const shown = typeof scene.on_screen === 'string' ? scene.on_screen.trim() : '';
  return shown || (typeof scene.line === 'string' ? scene.line.trim() : '');
}

function chatSlug(s, used) {
  let id = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'p';
  let n = 2;
  const base = id;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

function chatSceneId(scene, i) {
  const raw = scene.id == null ? '' : String(scene.id);
  return /^[A-Za-z0-9_-]{1,40}$/.test(raw) ? raw : `s${i + 1}`;
}

function chatClock(answers) {
  const m = /([0-9]{1,2}:[0-9]{2})/.exec(String((answers && answers.clock) || ''));
  return m ? m[1] : undefined;
}

function chatTruthy(v) {
  return v === true || /^(true|yes|on|1)$/i.test(String(v == null ? '' : v).trim());
}

/**
 * The photo a scene shows: the picture the customer uploaded for it (scene.image),
 * else its picture file, else the chosen product its picture names.
 */
function chatPicture(scene, products) {
  if (scene.image && typeof scene.image === 'object' && scene.image.kind === 'file') return scene.image;
  const p = scene.picture;
  if (p && typeof p === 'object' && p.kind === 'file') return p;
  if (typeof p !== 'string' || !p.trim()) return null;
  const want = p.trim().toLowerCase();
  const withPhoto = (products || []).filter((x) => (x.images || []).length);
  const match = withPhoto.find((x) => String(x.id).toLowerCase() === want || String(x.name || '').toLowerCase() === want);
  const product = match || (withPhoto.length === 1 ? withPhoto[0] : null);
  if (!product) throw new Error(`A scene asks for the photo "${p}", but no chosen product with a photo matches it.`);
  return product.images[0];
}

function chatSenderLines(scenes, what) {
  return scenes.map((scene, i) => {
    const text = chatSceneText(scene);
    const m = chatSenderRe.exec(text);
    if (!m || !m[1].trim()) throw new Error(`Scene ${i + 1} must start with who sends it and a colon (Riya: ${what}).`);
    return { scene, index: i, id: chatSceneId(scene, i), sender: m[1].trim(), text: m[2].trim() };
  });
}

/**
 * The thread for `skin` from the plan. Returns { thread, images: [{key, file}], scene_ids }
 * where scene_ids maps each chat scene to the event id that reveals it.
 */
function chatThreadFor(skin, { scenes, products, answers, brand_name, plate, pacing }) {
  const a = answers || {};
  if (!scenes.length) throw new Error('The chat needs at least one scene before the end card.');
  if (skin === 'imessage') {
    const lines = chatSenderLines(scenes, 'did you see this?');
    const used = new Set(['me']);
    const people = new Map();
    for (const l of lines) {
      if (l.sender.toLowerCase() === 'me') continue;
      const key = l.sender.toLowerCase();
      if (!people.has(key)) people.set(key, { id: chatSlug(l.sender, used), name: l.sender });
    }
    if (!people.size) throw new Error('The chat needs at least one message from someone other than Me.');
    const group = typeof a.group === 'string' && a.group.trim() ? a.group.trim() : '';
    if (!group && people.size > 1) throw new Error('More than one contact writes in this chat: set the answer group to the group\'s name.');
    const images = [];
    const messages = [];
    const sceneIds = [];
    for (const l of lines) {
      const from = l.sender.toLowerCase() === 'me' ? 'me' : people.get(l.sender.toLowerCase()).id;
      const picture = chatPicture(l.scene, products);
      if (!l.text && !picture) throw new Error(`Scene ${l.index + 1} has no message after "${l.sender}:".`);
      if (from !== 'me') messages.push({ id: `${l.id}-typing`, type: 'typing', from });
      if (l.text) messages.push({ id: l.id, type: 'text', from, text: l.text });
      if (picture) {
        const key = `scene-${images.length + 1}`;
        images.push({ key, file: picture });
        messages.push({ id: l.text ? `${l.id}-photo` : l.id, type: 'attachment', from, image: key, presentation: 'photo' });
      }
      sceneIds.push({ scene: l.id, event: l.id });
    }
    // Typing only before a received message that follows it directly.
    const thread = {
      mode: group ? 'group' : 'dm',
      participants: [{ id: 'me', name: 'Me', self: true }, ...people.values()],
      messages: messages.filter((m, i) => m.type !== 'typing' || (messages[i + 1] && messages[i + 1].from === m.from)),
    };
    if (group) thread.title = group;
    const clock = chatClock(a);
    if (clock) thread.clock = clock;
    return { thread, images, scene_ids: sceneIds, theme: a.theme === 'light' ? 'light' : 'dark' };
  }
  if (skin === 'chatgpt') {
    const messages = [];
    const sceneIds = [];
    scenes.forEach((scene, i) => {
      const id = chatSceneId(scene, i);
      const text = chatSceneText(scene);
      if (!text) throw new Error(`Scene ${i + 1} has no words.`);
      if (i % 2 === 0) messages.push({ id, type: 'user-text', text: text.replace(/\s*\n\s*/g, ' ') });
      else messages.push({ id: `${id}-dot`, type: 'loading-dot' }, { id, type: 'assistant', text });
      sceneIds.push({ scene: id, event: id });
    });
    const thread = { messages };
    const clock = chatClock(a);
    if (clock) thread.status_bar = { time: clock };
    return { thread, images: [], scene_ids: sceneIds };
  }
  if (skin === 'apple-notes') {
    const p = pacing || {};
    const cps = p.chars_per_second ?? 18;
    const minType = p.min_type_seconds ?? 1.4;
    if (!(Number.isFinite(cps) && cps > 0)) throw new Error('pacing chars_per_second must be a number above 0.');
    for (const [k, v] of Object.entries(p)) if (!Number.isFinite(v)) throw new Error(`pacing ${k} must be a finite number.`);
    const [first, ...rest] = scenes;
    const title = chatSceneText(first);
    if (!title) throw new Error('Scene 1 is the note\'s title and has no words.');
    if (!rest.length) throw new Error('The note needs at least one line after its title.');
    const lines = rest.map((scene, i) => {
      const text = chatSceneText(scene);
      if (!text) throw new Error(`Scene ${i + 2} has no words.`);
      const pause = i === 0 ? p.first_pause_seconds ?? 1.0 : i === rest.length - 1 ? p.last_pause_seconds ?? 0.9 : p.between_pause_seconds ?? 0.55;
      return { text, type_seconds: +Math.max(minType, [...text].length / cps).toFixed(3), pre_pause_seconds: pause };
    });
    const thread = { title, lines, post_hold_seconds: p.hold_seconds ?? 1.4 };
    const clock = chatClock(a);
    if (clock) thread.status_bar = { time: clock };
    return { thread, images: [], scene_ids: [] };
  }
  if (skin === 'notification-cascade') {
    if (!plate) throw new Error('The notification cascade needs its desk plate image.');
    if (!String(brand_name || '').trim()) throw new Error('The notification cascade shows the brand name on every banner.');
    const lines = chatSenderLines(scenes, 'can you send pricing?');
    const resolution = chatTruthy(a.resolution) && lines.length > 1 ? lines.pop() : null;
    const banner = (l) => ({ id: l.id, title: l.sender, body: l.text });
    const thread = {
      handle: String(brand_name).trim(),
      notifications: lines.map(banner),
      resolution: resolution ? banner(resolution) : null,
      plate: 'plate',
    };
    if (pacing && Object.keys(pacing).length) thread.pacing = { ...pacing };
    const sceneIds = [...lines, ...(resolution ? [resolution] : [])].map((l) => ({ scene: l.id, event: l.id }));
    return { thread, images: [{ key: 'plate', file: plate }], scene_ids: sceneIds };
  }
  throw new Error(`Unknown skin ${skin}.`);
}

// The events that show a scene's message: the first of these for an id is when its scene starts.
const chatRevealKinds = new Set(['pop', 'typing-swap', 'arrive', 'resolve', 'type', 'insert']);

/**
 * Where each chat scene starts: the first reveal event of the message it maps to (never a later event of
 * the same id, like an answer's stream-done), else an even share of the chat.
 */
function chatSceneTimes(chatScenes, sceneIds, events, chatDur, endAt) {
  const reveal = new Map();
  for (const e of events) {
    if (!e.id || !chatRevealKinds.has(e.kind)) continue;
    const id = String(e.id);
    if (!reveal.has(id) || e.t < reveal.get(id)) reveal.set(id, e.t);
  }
  const starts = chatScenes.map((s, i) => {
    const id = chatSceneId(s, i);
    const hit = sceneIds.find((x) => x.scene === id);
    return { id, start_s: hit && reveal.has(hit.event) ? reveal.get(hit.event) : (chatDur * i) / chatScenes.length };
  });
  starts.sort((a, b) => a.start_s - b.start_s);
  return starts.map((s, i) => ({ id: s.id, start_s: +s.start_s.toFixed(3), end_s: +(i + 1 < starts.length ? starts[i + 1].start_s : endAt).toFixed(3) }));
}

/**
 * How the chat joins its end card: the crossfade in whole frames (under one frame is a straight cut,
 * no overlap), the total length and where the card starts.
 */
function chatJoin(chatDur, endLen, crossfadeMs, fps) {
  const frames = Math.round(((crossfadeMs ?? 300) / 1000) * fps);
  const overlap = frames / fps;
  if (!(endLen > overlap)) throw new Error('the end card clip is shorter than the crossfade');
  if (!(chatDur > overlap)) throw new Error('the chat is shorter than the crossfade');
  const total = chatDur + endLen - overlap;
  return { frames, overlap, total, ending: { start_s: +(chatDur - overlap).toFixed(3), end_s: +total.toFixed(3) } };
}

// ---- phone-chat/src/fonts.mjs ----
// Which characters a font file draws, from its cmap table, so a chat never
// falls back to a system font: text the bundled and given fonts cannot draw
// is refused instead. Reads TrueType/OpenType (sfnt) and WOFF files.
// Every top-level name starts with `pcFont`.

function pcFontTables(buf) {
  const tag = buf.toString('latin1', 0, 4);
  const tables = new Map();
  if (tag === 'wOFF') {
    const count = buf.readUInt16BE(12);
    for (let i = 0; i < count; i++) {
      const at = 44 + i * 20;
      const name = buf.toString('latin1', at, at + 4);
      const offset = buf.readUInt32BE(at + 4);
      const compLength = buf.readUInt32BE(at + 8);
      const origLength = buf.readUInt32BE(at + 12);
      const raw = buf.subarray(offset, offset + compLength);
      tables.set(name, compLength < origLength ? inflateSync(raw) : raw);
    }
    return tables;
  }
  if (tag === 'wOF2') throw new Error('give the font as TTF, OTF or WOFF (a WOFF2 file cannot be checked for the characters it draws)');
  const version = buf.readUInt32BE(0);
  if (version !== 0x00010000 && tag !== 'OTTO' && tag !== 'true') throw new Error('the font file is not a TrueType or OpenType font');
  const count = buf.readUInt16BE(4);
  for (let i = 0; i < count; i++) {
    const at = 12 + i * 16;
    tables.set(buf.toString('latin1', at, at + 4), buf.subarray(buf.readUInt32BE(at + 8), buf.readUInt32BE(at + 8) + buf.readUInt32BE(at + 12)));
  }
  return tables;
}

/** The code point ranges [[from, to], ...] a font's best Unicode cmap subtable maps to a glyph. */
function pcFontCoverage(buf) {
  const cmap = pcFontTables(buf).get('cmap');
  if (!cmap) throw new Error('the font has no character map');
  const n = cmap.readUInt16BE(2);
  let best = null;
  for (let i = 0; i < n; i++) {
    const platform = cmap.readUInt16BE(4 + i * 8);
    const encoding = cmap.readUInt16BE(6 + i * 8);
    const offset = cmap.readUInt32BE(8 + i * 8);
    const format = cmap.readUInt16BE(offset);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (!unicode || (format !== 4 && format !== 12)) continue;
    if (!best || (format === 12 && best.format !== 12)) best = { format, offset };
  }
  if (!best) throw new Error('the font has no Unicode character map');
  const ranges = [];
  const t = cmap.subarray(best.offset);
  if (best.format === 12) {
    const groups = t.readUInt32BE(12);
    for (let g = 0; g < groups; g++) ranges.push([t.readUInt32BE(16 + g * 12), t.readUInt32BE(20 + g * 12)]);
  } else {
    const segX2 = t.readUInt16BE(6);
    const segs = segX2 / 2;
    const ends = 14;
    const starts = ends + segX2 + 2;
    const deltas = starts + segX2;
    const rangeOffsets = deltas + segX2;
    for (let s = 0; s < segs; s++) {
      const end = t.readUInt16BE(ends + s * 2);
      const start = t.readUInt16BE(starts + s * 2);
      const delta = t.readUInt16BE(deltas + s * 2);
      const ro = t.readUInt16BE(rangeOffsets + s * 2);
      if (start === 0xffff) continue;
      // A code point maps to a glyph unless it lands on glyph 0 (.notdef).
      let runStart = null;
      for (let c = start; c <= end; c++) {
        let glyph;
        if (ro === 0) glyph = (c + delta) & 0xffff;
        else {
          const at = rangeOffsets + s * 2 + ro + (c - start) * 2;
          glyph = at + 1 < t.length ? t.readUInt16BE(at) : 0;
          if (glyph) glyph = (glyph + delta) & 0xffff;
        }
        if (glyph && runStart === null) runStart = c;
        if (!glyph && runStart !== null) {
          ranges.push([runStart, c - 1]);
          runStart = null;
        }
      }
      if (runStart !== null) ranges.push([runStart, end]);
    }
  }
  return ranges;
}

// Characters that draw nothing themselves: spaces, joiners, variation selectors, keycap and tag marks.
const pcFontInvisible = /^[\s\u{200B}-\u{200F}\u{2060}\u{FE00}-\u{FE0F}\u{20E3}\u{E0020}-\u{E007F}]$/u;
// A grapheme the browser draws as an emoji: default emoji presentation, an emoji variation selector, or a joined sequence.
const pcFontEmojiLike = /\p{Emoji_Presentation}|\u{FE0F}|\u{200D}/u;

function pcFontCovered(cp, coverages) {
  return coverages.some((ranges) => ranges.some(([a, b]) => cp >= a && cp <= b));
}

/**
 * The distinct graphemes in `texts` the fonts cannot draw. Plain text may come from
 * any font; an emoji (which the browser would draw from a colour emoji font) only
 * from the emoji font, so with none given every emoji is missing.
 */
function pcFontMissing(texts, textCoverages, emojiCoverages = []) {
  const missing = new Set();
  const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  for (const text of texts) {
    for (const { segment } of seg.segment(String(text || ''))) {
      const emoji = pcFontEmojiLike.test(segment);
      const pool = emoji ? emojiCoverages : [...textCoverages, ...emojiCoverages];
      for (const ch of segment) {
        if (pcFontInvisible.test(ch)) continue;
        if (!pcFontCovered(ch.codePointAt(0), pool)) {
          missing.add(segment);
          break;
        }
      }
    }
  }
  return [...missing];
}

// ---- phone-chat/src/part.mjs ----
// phone-chat: one phone screen with skins (iMessage, ChatGPT, Apple Notes,
// the iMessage notification cascade), folded from the render-*-chat,
// render-imessage-cascade and create-*-mockup atoms. The plan's scenes become
// the skin's thread; the skin writes one frame page whose window.seek(ms) draws
// the screen at any movie time; the part steps it frame by frame in the kit's
// Chromium (fixed output frames, so browser start-up or machine speed never
// changes a frame), lays the skin's original sounds on their reveal frames,
// and crossfades into the style's end card clip.

const BUILD = { imessage: imessageBuild, chatgpt: chatgptBuild, 'apple-notes': notesBuild, 'notification-cascade': ncBuild };
const SIZE = { '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350], '16:9': [1920, 1080] };
// The TikTok/Reels bands at 1080x1920 (review-finished-ad's), scaled to the canvas.
const SAFE_BANDS = { top: 220, bottom: 400, right: 140, left: 0 };
const CHUNK_FRAMES = 150;
// The longest chat any skin may run, so a plan or pacing that makes it endless is refused, never rendered.
const MAX_CHAT_S = 300;

function safeArea(width, height) {
  if (width * 16 !== height * 9) return null;
  return { top: (SAFE_BANDS.top * height) / 1920, bottom: (SAFE_BANDS.bottom * height) / 1920, right: (SAFE_BANDS.right * width) / 1080, left: SAFE_BANDS.left };
}

async function dataUri(file, mime) {
  return `data:${mime || file.mime};base64,${(await readFile(file.path)).toString('base64')}`;
}

function fontFormat(path) {
  const m = /\.(ttf|otf|woff2?)$/i.exec(path || '');
  return { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' }[(m ? m[1] : 'ttf').toLowerCase()];
}

async function skinAssets(dir) {
  const out = {};
  for (const name of (await readdir(dir)).sort()) if (/\.(css|js)$/.test(name)) out[name] = await readFile(join(dir, name), 'utf8');
  return out;
}

async function peakDb(ctx, path) {
  const { stderr } = await kitFfmpeg(ctx, ['-i', path, '-af', 'volumedetect', '-f', 'null', '-']);
  const m = [...stderr.matchAll(/max_volume:\s*(-?inf|-?\d+(?:\.\d+)?) dB/g)].at(-1);
  return m && !m[1].includes('inf') ? Number(m[1]) : null;
}

/**
 * The skin's sounds as one track the length of the chat: every cue at its time
 * and gain, its leading silence stripped (the audible onset lands on the reveal
 * frame), cut to max_s with a short fade, summed without normalising, limited.
 */
async function effectsTrack(ctx, soundDir, cues, total) {
  const peaks = new Map();
  for (const c of cues) {
    if (!peaks.has(c.sound)) {
      const peak = await peakDb(ctx, join(soundDir, c.sound));
      if (peak === null || peak < -60) throw ctx.error('output_invalid', `the sound ${c.sound} is silent`);
      peaks.set(c.sound, peak);
    }
  }
  const args = ['-f', 'lavfi', '-t', kitNum(total), '-i', 'anullsrc=r=48000:cl=stereo'];
  const graph = [];
  const labels = ['[0:a]'];
  cues.forEach((c, i) => {
    if (!(c.t >= 0 && c.t < total)) throw ctx.error('output_invalid', `a sound cue at ${c.t}s is outside the ${total}s chat`);
    args.push('-i', join(soundDir, c.sound));
    const threshold = (peaks.get(c.sound) + 20 * Math.log10(0.05)).toFixed(2);
    const cut = c.max_s ? `atrim=duration=${kitNum(c.max_s, 3)},afade=t=out:st=${kitNum(Math.max(0, c.max_s - 0.06), 3)}:d=0.06,` : '';
    const ms = Math.round(c.t * 1000);
    graph.push(
      `[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,silenceremove=start_periods=1:start_threshold=${threshold}dB:start_mode=any,asetpts=PTS-STARTPTS,` +
        `${cut}adelay=${ms}|${ms},volume=${c.gain}[s${i}]`,
    );
    labels.push(`[s${i}]`);
  });
  graph.push(`${labels.join('')}amix=inputs=${labels.length}:duration=first:dropout_transition=0:normalize=0,aresample=176400,alimiter=limit=0.794:level=0,aresample=48000[out]`);
  const out = join(ctx.tmpDir, 'sounds.wav');
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph.join(';'), '-map', '[out]', '-t', kitNum(total), '-c:a', 'pcm_s16le', out]);
  return out;
}

/** Steps the page frame by frame and encodes it, in chunks so the frames never pile up on disk. */
async function renderPage(ctx, html, { width, height, fps, total, skin, events }) {
  if (!ctx.browser) throw ctx.error('needs_missing', 'the phone chat is drawn in the kit browser');
  const frames = Math.round(total * fps);
  const chunks = [];
  const browser = await ctx.browser.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(html);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode()));
    });
    if (skin === 'imessage') {
      // render-imessage-chat's guards: typed text equals sent text, the newest row stays in the safe zone.
      for (const ev of events) {
        const at = ev.t + (ev.kind === 'composer' ? ev.dur * 0.95 : 0.3);
        const state = await page.evaluate((ms) => {
          window.seek(ms);
          return { typed: window.__composerText(), report: window.__safeAreaReport() };
        }, at * 1000);
        if (ev.kind === 'composer' && state.typed !== ev.text) throw ctx.error('output_invalid', `typed "${state.typed}" but sends "${ev.text}"`);
        if (state.report.violations.length) throw ctx.error('output_invalid', `the newest message leaves the platform safe area at ${at.toFixed(2)}s`);
      }
    }
    for (let start = 0; start < frames; start += CHUNK_FRAMES) {
      kitStopIfAborted(ctx);
      const count = Math.min(CHUNK_FRAMES, frames - start);
      for (let k = 0; k < count; k++) {
        const f = start + k;
        await page.evaluate((ms) => window.seek(ms), (f * 1000) / fps);
        await page.screenshot({ path: join(ctx.tmpDir, `f${String(k).padStart(5, '0')}.png`), type: 'png' });
      }
      const chunk = join(ctx.tmpDir, `chunk-${String(chunks.length).padStart(4, '0')}.mp4`);
      await kitFfmpeg(ctx, ['-framerate', String(fps), '-i', join(ctx.tmpDir, 'f%05d.png'), '-frames:v', String(count), '-vf', 'format=yuv420p', ...ctx.tools.encodeArgs('h264-intermediate'), '-r', String(fps), chunk]);
      for (let k = 0; k < count; k++) await rm(join(ctx.tmpDir, `f${String(k).padStart(5, '0')}.png`), { force: true });
      chunks.push(chunk);
      ctx.progress({ done: start + count, total: frames });
    }
  } finally {
    await browser.close();
  }
  const list = join(ctx.tmpDir, 'chunks.txt');
  await writeFile(list, `${chunks.map((c) => `file '${c.replace(/'/g, "'\\''")}'`).join('\n')}\n`);
  const silent = join(ctx.tmpDir, 'chat.mp4');
  await kitFfmpeg(ctx, ['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);
  return silent;
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const [width, height] = SIZE[inputs.aspect ?? '9:16'];
  const fps = inputs.fps ?? 30;
  const endingScenes = inputs.ending_scenes ?? 0;
  if (endingScenes >= inputs.scenes.length) throw ctx.error('bad_input', 'every scene is the end card\'s; the chat has none');
  const chatScenes = inputs.scenes.slice(0, inputs.scenes.length - endingScenes);
  const endScenes = inputs.scenes.slice(inputs.scenes.length - endingScenes);

  let plan;
  try {
    plan = chatThreadFor(inputs.skin, { scenes: chatScenes, products: inputs.products, answers: inputs.answers, brand_name: inputs.brand_name, plate: inputs.plate, pacing: inputs.pacing });
  } catch (e) {
    throw ctx.error('bad_input', e.message);
  }
  const images = {};
  for (const img of plan.images) images[img.key] = await dataUri(img.file);
  const fonts = inputs.fonts || {};
  const text = fonts.text || { path: join(ctx.part.dir, 'assets', 'fonts', 'InterVariable.ttf'), mime: 'font/ttf' };
  // Emoji come from the style's emoji font, else the bundled Noto Color Emoji (SIL Open Font License).
  const emoji = fonts.emoji || { path: join(ctx.part.dir, 'assets', 'fonts', 'NotoColorEmoji.ttf'), mime: 'font/ttf' };
  let fontCss = `@font-face{font-family:KitText;src:url(${await dataUri(text, 'font/ttf')}) format('${fontFormat(text.path)}');font-weight:100 900;font-display:block;}`;
  fontCss += `@font-face{font-family:KitEmoji;src:url(${await dataUri(emoji, 'font/ttf')}) format('${fontFormat(emoji.path)}');font-display:block;}`;
  // Every character the plan puts on screen must be drawn by the bundled or given fonts: a missing
  // glyph would fall back to whatever font the computer has, and the video would differ between computers.
  let textCoverage;
  let emojiCoverage = [];
  try {
    textCoverage = [pcFontCoverage(await readFile(text.path))];
    emojiCoverage = [pcFontCoverage(await readFile(emoji.path))];
  } catch (e) {
    throw ctx.error('bad_input', e.message);
  }
  const a = inputs.answers || {};
  const shown = [...chatScenes.map(chatSceneText), inputs.brand_name, a.group, a.clock].filter((t) => typeof t === 'string');
  const missing = pcFontMissing(shown, textCoverage, emojiCoverage);
  if (missing.length) {
    throw ctx.error('bad_input', `the chat uses ${missing.slice(0, 5).join(' ')}, which the fonts cannot draw; leave ${missing.length > 1 ? 'them' : 'it'} out or give an emoji font`);
  }
  const skinDir = join(ctx.part.dir, 'assets', 'skins', inputs.skin);
  const env = {
    width,
    height,
    fps,
    theme: plan.theme ?? 'dark',
    safe_area: safeArea(width, height),
    assets: await skinAssets(skinDir),
    font_css: fontCss,
    images,
    timing: inputs.skin === 'imessage' || inputs.skin === 'chatgpt' ? inputs.pacing : undefined,
  };
  let built;
  try {
    built = BUILD[inputs.skin](plan.thread, env);
  } catch (e) {
    throw ctx.error('bad_input', e.message);
  }
  const chatDur = built.total_s;
  if (!Number.isFinite(chatDur) || chatDur <= 0 || chatDur > MAX_CHAT_S) {
    throw ctx.error('bad_input', `the chat would run ${chatDur} s; it must be a finite length up to ${MAX_CHAT_S} s`);
  }
  if (inputs.measure_only) {
    // The plan measured by the same code that renders it: nothing drawn, written or ordered.
    return kitCheckOutputs(ctx, manifest, { seconds: chatDur, ...built.stats });
  }
  const silent = await renderPage(ctx, built.html, { width, height, fps, total: chatDur, skin: inputs.skin, events: built.events });
  const sounds = built.cues.length ? await effectsTrack(ctx, join(skinDir, 'sfx'), built.cues, chatDur) : null;

  // Join: the chat with its sounds, crossfaded into the end card, which holds in silence (the bed comes in audio-mix).
  let total = chatDur;
  const args = ['-i', silent];
  const graph = [];
  let vLabel = '0:v:0';
  let ending = null;
  if (inputs.ending) {
    const endLen = (await ctx.tools.probe(inputs.ending.path)).duration_s;
    let joinPlan;
    try {
      joinPlan = chatJoin(chatDur, endLen, inputs.crossfade_ms, fps);
    } catch (e) {
      throw ctx.error('bad_input', e.message);
    }
    args.push('-i', inputs.ending.path);
    const prep =
      `[0:v]fps=${fps},settb=AVTB,setsar=1,format=yuv420p[c];[1:v]fps=${fps},scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},settb=AVTB,setsar=1,format=yuv420p[e];`;
    // A crossfade in whole frames; under one frame is a straight cut, so the card is never dropped.
    graph.push(joinPlan.frames ? `${prep}[c][e]xfade=transition=fade:duration=${kitNum(joinPlan.overlap)}:offset=${kitNum(chatDur - joinPlan.overlap)}[v]` : `${prep}[c][e]concat=n=2:v=1:a=0[v]`);
    vLabel = '[v]';
    total = joinPlan.total;
    ending = joinPlan.ending;
  }
  if (sounds) args.push('-i', sounds);
  else args.push('-f', 'lavfi', '-t', kitNum(total), '-i', 'anullsrc=r=48000:cl=stereo');
  const aIndex = inputs.ending ? 2 : 1;
  graph.push(`[${aIndex}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:${kitNum(total)}[a]`);
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph.join(';'), '-map', vLabel, '-map', '[a]', ...ctx.tools.encodeArgs('h264-master'), ...ctx.tools.encodeArgs('aac'), '-r', String(fps), '-t', kitNum(total), join(ctx.workDir, 'chat.mp4')]);
  const video = await ctx.file('chat.mp4', 'video');

  // Scenes: each chat scene from the moment it shows; the end card scenes over the card.
  const scenes = chatSceneTimes(chatScenes, plan.scene_ids, built.events, chatDur, ending ? ending.start_s : chatDur);
  if (ending) endScenes.forEach((s, i) => scenes.push({ id: s.id == null ? 'end-card' : chatSceneId(s, chatScenes.length + i), start_s: ending.start_s, end_s: ending.end_s }));
  const timeline = { duration_s: +total.toFixed(3), width, height, fps, scenes, speech: [] };
  if (ending) timeline.end_card = ending;
  return kitCheckOutputs(ctx, manifest, { video, seconds: +total.toFixed(3), timeline });
}
