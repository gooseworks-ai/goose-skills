// Built from creator-h3/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
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

// ---- creator-h3/src/prompt.mjs ----
// The H3 take prompt, copied word for word from create-creator-takes-h3's
// plan_takes.py (TEMPLATE, MANNERISM and DEFAULT_DELIVERY): the prompt that held
// identity and eyeline across the reference builds. {identity}, {environment},
// {mannerism}, {delivery} and {dialogue} are filled per take.

const H3_TEMPLATE = "A single continuous locked-off medium shot of <Subject 1>, with a natural front-camera recording look. The recording device and its support stay outside the frame.\n\n[Shot 1] The viewpoint is fixed at eye level, with the person facing the lens. No phone, camera, tripod or stand is visible. Chest-up framing, both shoulders in frame, head roughly centred with a little headroom, shot straight on. The hands are FREE and gesture while talking, one coming up and settling. Nobody holds the phone, there is no arm extended toward the camera. THE CAMERA DOES NOT MOVE: locked off, no handheld drift, no pan, no zoom, no reframing. One continuous unbroken shot.\n\nEYES STAY ON THE CAMERA LENS FOR THE WHOLE CLIP, from the very first frame to the very last, including the final word. Never glancing away, never looking down, never letting the gaze drift off the lens at the end of a sentence.\n\nTHE SUBJECT AND THE SET, unchanged from the first frame to the last, exactly as <Picture 1>: {identity}\n{environment}\nSKIN matches <Picture 1> exactly: visible pores, no smoothing, no plastic gloss, no over-sharpened edges. The light is the light in <Picture 1> and it does not change.\n{mannerism}\nHOW THEY SPEAK: {delivery}\nDIEGETIC SOUND: the voice and quiet room tone only.\nAUDIO RESTRICTIONS: no music, no beat, no sound design, no second voice, and no robotic, synthetic, text-to-speech, monotone or announcer-like delivery. The spoken audio contains ONLY the words inside the dialogue block. No stage directions and no markup is ever spoken aloud.\n\n<Subject 1> (S1) says, <d>[English] <inhale> {dialogue}</d>\n\nQuiet room around the voice. No music, no sound design, no second voice.\n";

const H3_MANNERISM = "\n<Video 1> is a filmed reference person recorded the same way. Take from it ONLY the rhythm of natural speech, where the pauses fall and where the pace speeds up, and the small involuntary movement while talking: the head settling, the blink rate, the eyebrow lifts, the hands coming up and dropping back. Do NOT take the face, hair, clothes, room, lighting, framing or eyeline. The person is <Subject 1> from <Picture 1> and nobody else.\n";

const H3_DEFAULT_DELIVERY = "natural and conversational, speaking directly to one viewer. Not presenting, not announcing, not reading. Sentences run together with almost no gap. Pitch falls on the last word of each sentence. Consonants relaxed, volume varying word to word.";

// ---- creator-h3/src/part.mjs ----
// creator-h3: an AI creator talking to camera, saying the approved lines, as
// one continuous track (D6: the default for scripted lines). The
// create-creator-takes-h3 atom in JavaScript: takes split between lines under
// H3's 15 s cap, each 0.6 s past its last word; the atom's prompt word for word
// with the person and room from the approved character; every take sent to
// fal's minimax/h3-max/reference-to-video with the atom's payload
// (prompt_expansion_mode disabled, so the dialogue stays verbatim); the first
// take ordered alone and its own voice handed to every later take as reference
// audio, so the takes sound like one recording; then joined with 0.10 s
// dissolves. A policy refusal is final for that take (the line says so).

const MODEL = 'minimax/h3-max/reference-to-video';
const MAX_TAKE = 15;
const MIN_TAKE = 5;
const MAX_SPEECH = 14.2;
const TAIL = 0.6;
const XF = 0.1;
const LEAD = 0.11;
const PAD = 0.03;
const VOICE_CLIP = ['-vn', '-t', '12', '-ac', '1', '-ar', '24000'];

/** The atom's identity guards: a person nobody was asked about reads as an AI composite. */
function checkCharacter(ch) {
  const ident = String(ch.identity || '').trim();
  const low = ident.toLowerCase();
  if (!ident) return 'the character needs an identity: the person, in the words that made the image';
  if (ident.includes('...') || low.startsWith('<') || low.includes('ask the user') || low.includes('user chose')) return 'the character identity is still a placeholder; there is no default person';
  if (!/\b(\d{2}s?|teen|twenties|thirties|forties|fifties|sixties|year[- ]old)\b/.test(low)) return 'the character identity states no age';
  if (!/\b(man|woman|male|female|non[- ]binary|guy|girl|boy|lady)\b/.test(low)) return 'the character identity states no gender';
  return null;
}

/** Lines with estimated spans (words at `wps`, a short pause between lines), split greedily into takes under MAX_SPEECH. */
function planTakes(lines, wps) {
  let t = 0;
  const timed = lines.map((l) => {
    const words = l.text.split(/\s+/).filter(Boolean).length;
    const span = { ...l, start: t, end: t + words / wps };
    t = span.end + 0.3;
    return span;
  });
  const takes = [];
  let cur = [];
  for (const l of timed) {
    if (cur.length && l.end - cur[0].start > MAX_SPEECH) {
      takes.push(cur);
      cur = [];
    }
    cur.push(l);
  }
  if (cur.length) takes.push(cur);
  return takes.map((group, i) => {
    const start = group[0].start;
    const end = group.at(-1).end;
    return { id: `t${i + 1}`, lines: group, covers: [start, end], dur: Math.max(MIN_TAKE, Math.min(MAX_TAKE, Math.ceil(end - start + TAIL))) };
  });
}

function prompt(character, mannerism, dialogue) {
  return H3_TEMPLATE.replace('{identity}', character.identity.trim())
    .replace('{environment}', String(character.environment || '').trim())
    .replace('{mannerism}', mannerism ? H3_MANNERISM : '')
    .replace('{delivery}', String(character.delivery || H3_DEFAULT_DELIVERY).trim())
    .replace('{dialogue}', dialogue);
}

/** Where speech starts in a take (silence before the first word), from ffmpeg's silence detector. */
async function onset(ctx, path) {
  const { stderr } = await kitFfmpeg(ctx, ['-v', 'info', '-t', '3', '-i', path, '-af', 'silencedetect=noise=-35dB:d=0.03', '-f', 'null', '-']);
  const m = /silence_start: (-?[0-9.]+)[\s\S]*?silence_end: ([0-9.]+)/.exec(stderr);
  return m && Number(m[1]) <= 0.02 ? Number(m[2]) : 0;
}

/** join_takes.py's estimated schedule: each take placed at its planned start, joined with 0.10 s dissolves. */
function schedule(takes, end, fps) {
  const xf = Math.round(XF * fps) / fps;
  const out = takes.map((t, k) => {
    const first = t.onset || LEAD;
    const pad = k ? Math.max(0, xf + PAD - first) : 0;
    const desired = k ? Math.max(0, t.start - first - pad) : 0;
    return { ...t, start: Math.ceil((desired - 1e-8) * fps) / fps, head_pad: pad };
  });
  // With no requested end, the reel runs to the end of the last take.
  const lastTake = out.at(-1);
  let actualEnd = end == null ? Math.floor((lastTake.start + lastTake.head_pad + lastTake.duration + 1e-8) * fps) / fps : Math.ceil((end - 1e-8) * fps) / fps;
  if (out.length === 1) actualEnd = Math.min(actualEnd, Math.floor((takes[0].duration + 1e-8) * fps) / fps);
  out.forEach((t, k) => {
    t.body_end = (k + 1 < out.length ? out[k + 1].start : actualEnd) - t.start;
    t.need = t.body_end + (k + 1 < out.length ? xf : 0);
    if (t.body_end <= (k ? xf : 0)) throw new Error('takes overlap too closely to join');
    const short = t.need - t.duration - t.head_pad;
    if (short > 0.02) throw new Error(`take ${t.id} is ${t.duration.toFixed(2)}s but must run ${(t.need - t.head_pad).toFixed(2)}s to reach its join`);
    t.tail_pad = Math.max(0, short);
  });
  return { fps, xf, duration: actualEnd, takes: out };
}

async function joinTakes(ctx, plan, out) {
  const { fps, xf } = plan;
  const fc = [];
  const pieces = [];
  const audio = [];
  const n = plan.takes.length;
  const args = [];
  for (const [k, t] of plan.takes.entries()) {
    args.push('-i', t.path);
    const video = (i, start, end, label) =>
      `[${i}:v]tpad=start_duration=${kitNum(t.head_pad)}:start_mode=clone:stop_duration=${kitNum(t.tail_pad + 0.05)}:stop_mode=clone,` +
      `trim=start=${kitNum(start)}:end=${kitNum(end)},setpts=PTS-STARTPTS,fps=${fps},settb=AVTB,setsar=1,format=yuv420p[${label}]`;
    fc.push(video(k, k ? xf : 0, t.body_end, `body${k}`));
    pieces.push(`[body${k}]`);
    if (k + 1 < n) {
      fc.push(video(k, t.body_end, t.body_end + xf, `xa${k}`));
      const next = plan.takes[k + 1];
      fc.push(`[${k + 1}:v]tpad=start_duration=${kitNum(next.head_pad)}:start_mode=clone,trim=0:${kitNum(xf)},setpts=PTS-STARTPTS,fps=${fps},settb=AVTB,setsar=1,format=yuv420p[xb${k}]`);
      fc.push(`[xa${k}][xb${k}]xfade=duration=${kitNum(xf)}:offset=0[x${k}]`);
      pieces.push(`[x${k}]`);
    }
    const stereo = t.channels === 1 ? 'pan=stereo|c0=c0|c1=c0' : 'aformat=channel_layouts=stereo';
    fc.push(`[${k}:a]aresample=48000,${stereo},adelay=${kitNum(t.head_pad * 1000)}:all=1,apad,atrim=0:${kitNum(t.need)},asetpts=PTS-STARTPTS[a${k}]`);
    audio.push(`[a${k}]`);
  }
  fc.push(`${pieces.join('')}concat=n=${pieces.length}:v=1:a=0,fps=${fps},trim=duration=${kitNum(plan.duration)},setpts=PTS-STARTPTS[v]`);
  let prev = audio[0];
  for (let k = 1; k < n; k++) {
    fc.push(`${prev}${audio[k]}acrossfade=d=${kitNum(xf)}:c1=tri:c2=tri[ac${k}]`);
    prev = `[ac${k}]`;
  }
  await kitFfmpeg(ctx, [...args, '-filter_complex', fc.join(';'), '-map', '[v]', '-map', prev, '-t', kitNum(plan.duration), ...ctx.tools.encodeArgs('h264-master'), ...ctx.tools.encodeArgs('aac'), out]);
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const problem = checkCharacter(inputs.character);
  if (problem) throw ctx.error('bad_input', problem);
  const lines = inputs.scenes
    .map((s, i) => ({ scene_id: s.id == null ? String(i + 1) : String(s.id), text: String(s.line || '').replace(/\s+/g, ' ').trim() }))
    .filter((l) => l.text);
  if (!lines.length) throw ctx.error('bad_input', 'no scene has a line to say');
  for (const l of lines) if (/\[[^\]]*\]/.test(l.text)) throw ctx.error('bad_input', `scene ${l.scene_id} has square brackets, which H3 speaks aloud`);
  const takes = planTakes(lines, inputs.words_per_second ?? 2.6);
  for (const t of takes) if (t.covers[1] - t.covers[0] > MAX_SPEECH) throw ctx.error('bad_input', `scene ${t.lines[0].scene_id} alone runs past one take; shorten it`);
  const seconds = takes.reduce((a, t) => a + t.dur, 0);
  if (seconds > inputs.max_seconds) throw ctx.error('bad_input', `the lines need ${seconds}s of takes, more than max_seconds ${inputs.max_seconds}`);

  const resolution = inputs.resolution ?? '1080P';
  const aspect = inputs.aspect_ratio ?? '9:16';
  let voice = null;
  const made = [];
  for (const [k, t] of takes.entries()) {
    kitStopIfAborted(ctx);
    const piece = `take-${t.id}`;
    const dialogue = t.lines.map((l) => l.text).join(' <pause> ');
    const body = {
      prompt: prompt(inputs.character, !!inputs.mannerism, dialogue),
      duration: t.dur,
      resolution,
      aspect_ratio: aspect,
      seed: 300000 + (ctx.seed(piece) % 600000),
      prompt_expansion_mode: 'disabled',
      reference_image_urls: [inputs.character.image],
    };
    if (inputs.mannerism) body.reference_video_urls = [inputs.mannerism];
    if (voice) body.reference_audio_urls = [voice];
    const result = await ctx.line.order({ piece, provider: 'fal', path: MODEL, body, results: [{ pointer: '/json/video/url', name: `${t.id}.mp4`, media: 'video' }] });
    const file = result.files[`${t.id}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    const info = await ctx.tools.probe(file.path);
    if (!info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its voice`);
    made.push({ ...t, file, path: file.path, duration: await kitDuration(ctx, file), start: t.covers[0], onset: await onset(ctx, file.path) });
    if (k === 0 && takes.length > 1) {
      // The first take's own voice, handed to every later take (our generated voice, never a real person's).
      await kitFfmpeg(ctx, ['-i', file.path, ...VOICE_CLIP, join(ctx.tmpDir, 't1-voice.wav')]);
      voice = await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/t1-voice.wav`, 'audio');
    }
    ctx.progress({ done: k + 1, total: takes.length });
  }
  for (const t of made) {
    const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'csv=p=0', t.path]);
    t.channels = Number(String(stdout).trim().split(',')[0]) || 2;
  }
  let plan;
  try {
    plan = schedule(made, null, 30);
  } catch (e) {
    throw ctx.error('output_invalid', e.message);
  }
  await joinTakes(ctx, plan, join(ctx.workDir, 'creator.mp4'));
  const video = await ctx.file('creator.mp4', 'video');
  const info = await ctx.tools.probe(video.path);
  // Estimated line spans on the reel (captions and the check transcribe the real speech).
  const speech = [];
  for (const t of plan.takes) {
    const shift = t.start + t.head_pad + (t.onset || LEAD) - t.covers[0];
    for (const l of t.lines) speech.push({ scene_id: l.scene_id, text: l.text, start_s: +Math.max(0, l.start + shift).toFixed(3), end_s: +Math.min(plan.duration, l.end + shift).toFixed(3) });
  }
  const timeline = {
    duration_s: +plan.duration.toFixed(3),
    width: info.width,
    height: info.height,
    fps: 30,
    scenes: speech.map((s, i) => ({ id: s.scene_id, start_s: s.start_s, end_s: i + 1 < speech.length ? speech[i + 1].start_s : +plan.duration.toFixed(3) })),
    speech,
  };
  return kitCheckOutputs(ctx, manifest, {
    video,
    seconds: timeline.duration_s,
    timeline,
    takes: plan.takes.map((t) => ({ id: t.id, video: t.file, start_s: +t.start.toFixed(3), scene_ids: t.lines.map((l) => l.scene_id) })),
  });
}
