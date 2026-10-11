// Built from splice/src/part.mjs by parts/_tools/bundle.mjs. Do not edit: change the source and publish a new version.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open, readFile, stat, writeFile } from 'node:fs/promises';
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

// ---- splice/src/source.mjs ----
// What splice reads from a media file before it touches anything, and the
// source rules it refuses on. A port of preflight_source and probe from the
// render-hook-replacement atom (replace_hook.py): the body must be a clean,
// constant-frame-rate, square-pixel 8-bit yuv420p file whose streams start at
// zero and whose sound does not run past its last frame, or the kept body
// could not be proven untouched.

/** A frame rate fraction ("30000/1001") as a number, or 0. */
function spliceRate(text) {
  const [n, d] = String(text || '').split('/').map(Number);
  if (!Number.isFinite(n) || !(d || d === undefined)) return 0;
  const v = d === undefined ? n : n / d;
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function spliceRotation(stream) {
  for (const s of stream.side_data_list || []) if (s && s.rotation !== undefined) return Number(s.rotation) || 0;
  return Number(stream.tags && stream.tags.rotate) || 0;
}

/** ffprobe's streams and format, reduced to what splice needs. */
async function spliceProbe(ctx, path) {
  const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', path]);
  const data = JSON.parse(stdout || '{}');
  const streams = data.streams || [];
  const v = streams.find((s) => s.codec_type === 'video');
  const a = streams.find((s) => s.codec_type === 'audio');
  const format = data.format || {};
  const fpsText = v && (v.avg_frame_rate && v.avg_frame_rate !== '0/0' ? v.avg_frame_rate : v.r_frame_rate);
  return {
    format_name: String(format.format_name || ''),
    duration_s: Number(format.duration) || 0,
    video: v
      ? {
          codec: v.codec_name,
          width: v.width,
          height: v.height,
          pix_fmt: v.pix_fmt,
          sar: v.sample_aspect_ratio,
          rotation: spliceRotation(v),
          fps_text: fpsText,
          fps: spliceRate(fpsText),
          start_s: Number(v.start_time) || 0,
          color: { range: v.color_range, primaries: v.color_primaries, trc: v.color_transfer, space: v.color_space },
        }
      : null,
    audio: a
      ? {
          codec: a.codec_name,
          sample_rate: Number(a.sample_rate) || 0,
          channels: Number(a.channels) || 0,
          layout: a.channel_layout || { 1: 'mono', 2: 'stereo' }[Number(a.channels)] || null,
          start_s: Number(a.start_time) || 0,
          duration_s: Number(a.duration) || Number(format.duration) || 0,
        }
      : null,
  };
}

const SPLICE_COLOR_NAMES = /^(tv|pc|bt709|bt470m|bt470bg|smpte170m|smpte240m|bt2020|bt2020nc|bt2020c|smpte2084|arib-std-b67|iec61966-2-1)$/;

/**
 * The setparams filter that tags a picture with the body's colour properties (range, primaries,
 * transfer, matrix), or '' when the body names none. Tags only: no pixel is converted. Without it a
 * hook and body with different tags make ffmpeg rebuild its filters mid-stream, and the output
 * would carry two sets of colour tags.
 */
function spliceColorTags(color) {
  const c = color || {};
  const pick = (v) => (typeof v === 'string' && SPLICE_COLOR_NAMES.test(v) ? v : null);
  const parts = [];
  if (pick(c.range)) parts.push(`range=${c.range}`);
  if (pick(c.primaries)) parts.push(`color_primaries=${c.primaries}`);
  if (pick(c.trc)) parts.push(`color_trc=${c.trc}`);
  if (pick(c.space)) parts.push(`colorspace=${c.space}`);
  return parts.length ? `setparams=${parts.join(':')}` : '';
}

/** The first video stream's packets in presentation order: [{t, key, size}]. Discarded packets are left out. */
async function splicePackets(ctx, path) {
  const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time,flags,size', '-print_format', 'json', path]);
  const packets = (JSON.parse(stdout || '{}').packets || [])
    .filter((p) => p.pts_time !== undefined && p.pts_time !== 'N/A' && !String(p.flags || '').includes('D'))
    .map((p) => ({ t: Number(p.pts_time), key: String(p.flags || '').startsWith('K'), size: Number(p.size) || 0 }))
    .filter((p) => Number.isFinite(p.t));
  packets.sort((x, y) => x.t - y.t);
  return packets;
}

/** True when the file is a Git LFS pointer, not media. */
async function spliceIsLfsPointer(path) {
  const handle = await open(path, 'r');
  try {
    const buf = Buffer.alloc(80);
    const { bytesRead } = await handle.read(buf, 0, 80, 0);
    return buf.subarray(0, bytesRead).toString('latin1').startsWith('version https://git-lfs.github.com/spec/');
  } finally {
    await handle.close();
  }
}

/** The file's sha256, streamed. */
function spliceSha256(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    createReadStream(path)
      .on('data', (b) => hash.update(b))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * The source rules (replace_hook.py preflight_source), on a probe and its packets. Returns
 * {problem} in plain words, or the body facts: fps, the kept frames (from index k, the first
 * frame at or after cut_s), where the picture ends, whether the cut lands on a keyframe and
 * how many bytes the kept picture holds.
 */
function spliceSourceFacts(info, packets, { cut_s, end_s = null }) {
  const v = info.video;
  if (!v) return { problem: 'the original ad has no picture' };
  if (v.pix_fmt !== 'yuv420p') return { problem: `the original ad is ${v.pix_fmt || 'an unknown pixel format'}, not 8-bit yuv420p; make a normalised copy of it first` };
  if (v.sar && !['1:1', '0:1', 'N/A'].includes(v.sar)) return { problem: `the original ad has non-square pixels (${v.sar}); make a normalised copy of it first` };
  if (Math.round(v.rotation) % 360 !== 0) return { problem: `the original ad is stored rotated (${v.rotation} degrees); make a normalised copy of it first` };
  if (v.width % 2 || v.height % 2) return { problem: `the original ad is ${v.width}x${v.height}; its width and height must be even` };
  if (!(v.fps > 0)) return { problem: 'the original ad has no frame rate' };
  const audio = info.audio;
  if (Math.abs(v.start_s) > 0.001 || (audio && Math.abs(audio.start_s) > 0.025)) {
    return { problem: 'the original ad\'s picture or sound does not start at zero; make a normalised copy of it first' };
  }
  if (audio && !audio.layout) return { problem: 'the original ad\'s sound has no channel layout' };
  if (audio && !(audio.sample_rate > 0)) return { problem: 'the original ad\'s sound has no sample rate' };
  const times = packets.map((p) => p.t);
  if (times.length < 2) return { problem: 'the original ad has fewer than two frames' };
  const frame_s = 1 / v.fps;
  for (let i = 1; i < times.length; i++) {
    if (Math.abs(times[i] - times[i - 1] - frame_s) > 0.001) {
      return { problem: `the original ad has a variable frame rate (a ${((times[i] - times[i - 1]) * 1000).toFixed(1)} ms frame at ${times[i - 1].toFixed(3)}s); make a constant-frame-rate copy of it first` };
    }
  }
  const video_end_s = times.at(-1) + frame_s;
  // An AAC encoder pads its last frame, so up to one AAC frame (1024 samples) past the picture is padding, not sound to keep.
  const pad_s = audio && audio.codec === 'aac' ? 1024 / audio.sample_rate : 0;
  const audio_end_s = audio ? audio.start_s + audio.duration_s : video_end_s;
  if (Math.max(audio_end_s, info.duration_s) > video_end_s + 0.002 + pad_s) {
    return { problem: `the original ad's sound runs ${(Math.max(audio_end_s, info.duration_s) - video_end_s).toFixed(3)}s past its last frame; make a copy that holds the last frame to the end of its sound first` };
  }
  if (!(cut_s >= 0)) return { problem: 'the cut must be at or after 0' };
  if (cut_s >= times.at(-1)) return { problem: `the cut at ${cut_s.toFixed(3)}s leaves no complete frame of the original ad (its last frame starts at ${times.at(-1).toFixed(3)}s)` };
  if (end_s !== null && end_s < video_end_s - frame_s - 0.002) {
    return { problem: `the original ad is kept to its end, but its window ends at ${end_s.toFixed(3)}s, before its last frame at ${times.at(-1).toFixed(3)}s` };
  }
  const k = times.findIndex((t) => t >= cut_s - 1e-7);
  const kept = packets.slice(k);
  return {
    fps: v.fps,
    fps_text: v.fps_text,
    color: v.color,
    width: v.width,
    height: v.height,
    k,
    t0: times[k],
    frames: kept.length,
    body_s: kept.length / v.fps,
    video_end_s,
    key_at_cut: packets[k].key,
    kept_bytes: kept.reduce((sum, p) => sum + p.size, 0),
    copyable: v.codec === 'h264' && /\b(mov|mp4)\b/.test(info.format_name.replace(/,/g, ' ')) && packets[k].key,
  };
}

// ---- splice/src/checks.mjs ----
// The preservation checks, ported from replace_hook.py compare_video and
// compare_audio: every kept frame is decoded from the original and from the
// output and compared one by one in order (an exact hash match, else PSNR),
// and the kept sound is compared at the same sample positions (normalised RMS
// error and correlation; a silent original must stay silent).

/**
 * One md5 per decoded frame of `path`'s picture, from frame `from` on. No filter runs (frames are
 * skipped here, not by trim), so a mid-stream change of colour tags cannot restart a frame count.
 */
async function spliceFrameHashes(ctx, path, from) {
  const { stdout } = await kitFfmpeg(ctx, ['-v', 'error', '-i', path, '-map', '0:v:0', '-an', '-fps_mode', 'passthrough', '-f', 'framemd5', '-']);
  return String(stdout || '')
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => line.split(',').at(-1).trim())
    .slice(from);
}

/** Per-frame PSNR (dB, identical frames as 100) of output frames from `outFrom` against source frames from `srcFrom`, paired by index. */
async function splicePsnr(ctx, src, srcFrom, out, outFrom) {
  const index = 'setpts=N/(30*TB)';
  const graph = `[0:v]trim=start_frame=${srcFrom},${index}[s];[1:v]trim=start_frame=${outFrom},${index}[o];[s][o]psnr=stats_file=-:shortest=1[v]`;
  const { stdout } = await kitFfmpeg(ctx, ['-v', 'error', '-reinit_filter', '0', '-i', src, '-reinit_filter', '0', '-i', out, '-filter_complex', graph, '-map', '[v]', '-an', '-f', 'null', '-']);
  const scores = [];
  for (const m of String(stdout || '').matchAll(/psnr_avg:(\S+)/g)) {
    const v = Number(m[1]);
    scores.push(Number.isFinite(v) ? Math.min(v, 100) : 100);
  }
  return scores;
}

/** Compares the kept picture. Returns {frames, output_frames, exact, psnr_min, passed}. */
async function spliceCompareVideo(ctx, { src, k, out, n, expected, psnr_min }) {
  const want = await spliceFrameHashes(ctx, src, k);
  const got = await spliceFrameHashes(ctx, out, n);
  let exact = 0;
  for (let i = 0; i < Math.min(want.length, got.length); i++) if (want[i] === got[i]) exact++;
  const counts = want.length === expected && got.length === expected;
  let low = exact === expected && counts ? 100 : 0;
  if (counts && exact < expected) {
    const scores = await splicePsnr(ctx, src, k, out, n);
    low = scores.length === expected ? Math.min(...scores) : 0;
  }
  return { frames: want.length, output_frames: got.length, exact, psnr_min: +low.toFixed(3), passed: counts && low >= psnr_min };
}

/** Normalised RMS error and correlation of two equal-length sample runs; `quiet` when the original is (nearly) silent. */
function spliceAudioStats(x, y) {
  if (x.length !== y.length) return { samples: 0, nrmse: Infinity, corr: 0, quiet: false, error: 'the kept sound has a different number of samples' };
  let xx = 0;
  let yy = 0;
  let xy = 0;
  let err = 0;
  for (let i = 0; i < x.length; i++) {
    const u = x[i];
    const v = y[i];
    xx += u * u;
    yy += v * v;
    xy += u * v;
    err += (u - v) * (u - v);
  }
  const count = x.length;
  if (!count) return { samples: 0, nrmse: Infinity, corr: 0, quiet: false, error: 'the kept sound is empty' };
  const quiet = xx <= count * 1e-8;
  const nrmse = Math.sqrt(err / Math.max(xx, 1e-12));
  const corr = xx > 1e-12 && yy > 1e-12 ? xy / Math.sqrt(xx * yy) : err < count * 1e-8 ? 1 : 0;
  return { samples: count, nrmse, corr, quiet, mean_square_error: err / count };
}

/** Root mean square of a sample run. */
function spliceRms(x) {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(x.length, 1));
}

async function spliceReadF32(path) {
  const buf = await readFile(path);
  return new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length - (buf.length % 4)));
}

async function spliceSamples(ctx, path, start_s, seconds, rate, channels, name) {
  const file = join(ctx.tmpDir, name);
  await kitFfmpeg(ctx, [
    '-v', 'error', '-i', path, '-map', '0:a:0', '-vn',
    '-af', `atrim=start=${kitNum(start_s, 9)}:end=${kitNum(start_s + seconds, 9)},asetpts=PTS-STARTPTS,apad,atrim=duration=${kitNum(seconds, 9)}`,
    '-ar', String(rate), '-ac', String(channels), '-f', 'f32le', file,
  ]);
  return spliceReadF32(file);
}

/**
 * Compares the kept sound: the original from t0 against the output from start_s, both `seconds` long.
 * A silent original (no audio stream) needs the output's kept span to stay silent (RMS <= 0.0001).
 */
async function spliceCompareAudio(ctx, { src, t0, out, start_s, seconds, source_audio, output_has_audio, nrmse_max, corr_min }) {
  if (!source_audio) {
    if (!output_has_audio) return { nrmse: null, corr: null, passed: true };
    const kept = await spliceSamples(ctx, out, start_s, seconds, 48000, 1, 'output-body-silence.f32');
    const rms = spliceRms(kept);
    return { nrmse: null, corr: null, rms, passed: rms <= 0.0001 };
  }
  const { sample_rate: rate, channels } = source_audio;
  const x = await spliceSamples(ctx, src, t0, seconds, rate, channels, 'source-body.f32');
  const y = await spliceSamples(ctx, out, start_s, seconds, rate, channels, 'output-body.f32');
  const s = spliceAudioStats(x, y);
  if (s.error) return { nrmse: null, corr: null, passed: false, error: s.error };
  // A (nearly) silent original has no level to normalise by: it passes when the output stays as quiet.
  const passed = s.quiet ? s.mean_square_error <= 1e-8 : s.nrmse <= nrmse_max && s.corr >= corr_min;
  const nrmse = s.quiet ? (passed ? 0 : 1) : Math.min(s.nrmse, 1e6);
  const corr = Number.isFinite(s.corr) ? s.corr : 0;
  return { nrmse: +nrmse.toFixed(6), corr: +corr.toFixed(6), passed };
}

// ---- splice/src/size.mjs ----
// The size rule (critic #38): a finished video over 200 MB is refused on
// upload after everything was paid for, so splice projects its output's size
// before it encodes and measures it after, against a 180 MB ceiling.

const SPLICE_MAX_MB = 180;
/** The final encode's bitrate cap (§4.12): -maxrate 16M -bufsize 32M. */
const SPLICE_MAXRATE_BPS = 16e6;
const SPLICE_AUDIO_BPS = 256e3;

/**
 * The projected output size in bytes. copy: the kept picture's own packet bytes plus the opening at
 * the cap. encode: the whole cut at the lower of the cap and three times the original's picture
 * rate (CRF 12 against a typical CRF 18 master), with at least 4 Mbit/s. Sound and 2 % container
 * overhead on top.
 */
function spliceProjectedBytes({ mode, seconds, hook_s, kept_bytes, body_s }) {
  const audio = (seconds * SPLICE_AUDIO_BPS) / 8;
  let picture;
  if (mode === 'copy') picture = (hook_s * SPLICE_MAXRATE_BPS) / 8 + kept_bytes;
  else {
    const source_bps = body_s > 0 ? (kept_bytes * 8) / body_s : SPLICE_MAXRATE_BPS;
    picture = (seconds * Math.min(SPLICE_MAXRATE_BPS, Math.max(3 * source_bps, 4e6))) / 8;
  }
  return Math.ceil((picture + audio) * 1.02);
}

/** A plain refusal when `bytes` passes `max_mb`, else null. */
function spliceSizeProblem(bytes, max_mb, { projected = false } = {}) {
  if (bytes <= max_mb * 1e6) return null;
  const mb = (bytes / 1e6).toFixed(1);
  return projected
    ? `the finished video would be about ${mb} MB, over the ${max_mb} MB limit; use a shorter original or a lower-bitrate copy of it`
    : `the finished video is ${mb} MB, over the ${max_mb} MB limit`;
}

// ---- splice/src/part.mjs ----
// splice: a new opening on a kept body. The last footage entry is a finished
// ad; everything from the cut (its start_ms, snapped to the first frame at or
// after it) to its end is kept: the picture frame for frame, the sound at the
// same sample positions and level. The opening (a hook video, or a first
// footage entry cut to its window) is converted to the body's size, frame
// rate, pixel format and sound format, and hard-cut in front.
//
// The body's picture is stream-copied when it is H.264 in an MP4 and the cut
// lands on a keyframe; otherwise the whole cut is re-encoded at CRF 12 or lower
// under the 16 Mbit/s cap. Either way every kept frame and the kept sound are
// checked against the original (a port of render-hook-replacement's
// replace_hook.py), and a failed check or an output over the size limit is
// refused before anything is uploaded. Captions, loudness and end cards are
// deliberately not touched: the body already has its own.

const SPLICE_MAX_HOOK_S = 60;

/** The final picture encode: the kit's master preset at CRF 12 or lower, High profile, under the §4.12 cap. */
export function spliceVideoArgs(ctx) {
  const args = ctx.tools.encodeArgs('h264-master');
  const i = args.indexOf('-crf');
  if (i >= 0) args[i + 1] = String(Math.min(Number(args[i + 1]), 12));
  else args.push('-crf', '12');
  return [...args, '-profile:v', 'high', '-maxrate', '16M', '-bufsize', '32M'];
}

/** The final sound encode: the kit's AAC preset at 256k and the target's own sample rate. */
export function spliceAudioArgs(ctx, rate) {
  const args = ctx.tools.encodeArgs('aac');
  const set = (flag, value) => {
    const i = args.indexOf(flag);
    if (i >= 0) args[i + 1] = value;
    else args.push(flag, value);
  };
  set('-b:a', '256k');
  set('-ar', String(rate));
  return args;
}

function spliceHookChain(facts, frames) {
  const { width: w, height: h } = facts;
  const square = "scale='trunc(iw*sar/2)*2':'trunc(ih/2)*2'";
  const tags = spliceColorTags(facts.color);
  return (
    `fps=${facts.fps_text},${square},scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p,${tags ? `${tags},` : ''}` +
    `tpad=stop_mode=clone:stop_duration=${kitNum(0.1 + 2 / facts.fps, 4)},trim=end_frame=${frames},setpts=PTS-STARTPTS`
  );
}

function spliceHookInput(hook, hook_s) {
  const args = [];
  if (hook.start_s > 0) args.push('-ss', kitNum(hook.start_s));
  args.push('-t', kitNum(hook_s + 0.5), '-i', hook.file.path);
  return args;
}

/** The sound graph: the opening's own sound (or silence), then the body's from t0, both in the target format. */
function spliceAudioGraph({ hookIn, hookAudio, srcIn, srcAudio, target, hook_s, t0, body_s }) {
  const fmt = `aformat=sample_fmts=fltp:sample_rates=${target.sample_rate}:channel_layouts=${target.layout}`;
  const silence = (d) => `anullsrc=r=${target.sample_rate}:cl=${target.layout},atrim=duration=${kitNum(d, 9)},${fmt}`;
  const ha = hookAudio
    ? `[${hookIn}:a]aresample=${target.sample_rate},${fmt},asetpts=PTS-STARTPTS,apad,atrim=duration=${kitNum(hook_s, 9)}[ha]`
    : `${silence(hook_s)}[ha]`;
  const ba = srcAudio
    ? `[${srcIn}:a]atrim=start=${kitNum(t0, 9)}:end=${kitNum(t0 + body_s, 9)},asetpts=PTS-STARTPTS,${fmt},apad,atrim=duration=${kitNum(body_s, 9)}[ba]`
    : `${silence(body_s)}[ba]`;
  return `${ha};${ba};[ha][ba]concat=n=2:v=0:a=1[a]`;
}

/** Re-encodes the whole cut in one pass. */
async function spliceByEncode(ctx, { hook, body, facts, frames, hook_s, hookAudio, srcAudio, target, out }) {
  const args = [...spliceHookInput(hook, hook_s), '-i', body.path];
  const graph = [`[0:v]${spliceHookChain(facts, frames)}[hv]`, `[1:v]trim=start_frame=${facts.k},setpts=PTS-STARTPTS[bv]`, '[hv][bv]concat=n=2:v=1:a=0[v]'];
  if (target) graph.push(spliceAudioGraph({ hookIn: 0, hookAudio, srcIn: 1, srcAudio, target, hook_s, t0: facts.t0, body_s: facts.body_s }));
  args.push('-filter_complex', graph.join(';'), '-map', '[v]', ...spliceVideoArgs(ctx), '-fps_mode', 'passthrough');
  if (target) args.push('-map', '[a]', ...spliceAudioArgs(ctx, target.sample_rate));
  args.push('-movflags', '+faststart', out);
  await kitFfmpeg(ctx, args);
}

/**
 * Encodes only the opening and stream-copies the body's picture after it: both go through MPEG-TS
 * (in-band parameter sets) and the concat demuxer, with the opening's exact length as its duration.
 * The sound is laid in a second pass, re-encoded, because AAC frames never land on the cut.
 */
async function spliceByCopy(ctx, { hook, body, facts, frames, hook_s, hookAudio, srcAudio, target, out }) {
  const t = (name) => join(ctx.tmpDir, name);
  await kitFfmpeg(ctx, [...spliceHookInput(hook, hook_s), '-map', '0:v:0', '-an', '-vf', spliceHookChain(facts, frames), ...spliceVideoArgs(ctx), t('hook.mp4')]);
  await kitFfmpeg(ctx, ['-i', t('hook.mp4'), '-map', '0:v:0', '-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts', t('hook.ts')]);
  // Seeking a stream copy lands on the keyframe at or before the time asked; the cut is a keyframe, so ask a quarter frame past it.
  await kitFfmpeg(ctx, ['-ss', kitNum(facts.t0 + 0.25 / facts.fps, 9), '-i', body.path, '-map', '0:v:0', '-an', '-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts', t('body.ts')]);
  await writeFile(t('list.txt'), `ffconcat version 1.0\nfile 'hook.ts'\nduration ${kitNum(hook_s, 9)}\nfile 'body.ts'\n`);
  await kitFfmpeg(ctx, ['-f', 'concat', '-i', t('list.txt'), '-map', '0:v:0', '-c', 'copy', t('picture.mp4')]);
  const args = ['-i', t('picture.mp4')];
  let next = 1;
  let hookIn = -1;
  let srcIn = -1;
  if (target && hookAudio) {
    args.push(...spliceHookInput(hook, hook_s));
    hookIn = next++;
  }
  if (target && srcAudio) {
    args.push('-i', body.path);
    srcIn = next++;
  }
  if (target) args.push('-filter_complex', spliceAudioGraph({ hookIn, hookAudio, srcIn, srcAudio, target, hook_s, t0: facts.t0, body_s: facts.body_s }));
  args.push('-map', '0:v:0', '-c:v', 'copy');
  if (target) args.push('-map', '[a]', ...spliceAudioArgs(ctx, target.sample_rate));
  args.push('-movflags', '+faststart', out);
  await kitFfmpeg(ctx, args);
}

async function spliceVerify(ctx, { out, body, facts, frames, hook_s, srcAudio, checks }) {
  const got = await ctx.tools.probe(out);
  const total = hook_s + facts.body_s;
  const duration_ok = Number.isFinite(got.duration_s) && Math.abs(got.duration_s - total) <= 1 / facts.fps + 0.002;
  const video = await spliceCompareVideo(ctx, { src: body.path, k: facts.k, out, n: frames, expected: facts.frames, psnr_min: checks.psnr_min });
  const audio = await spliceCompareAudio(ctx, {
    src: body.path, t0: facts.t0, out, start_s: hook_s, seconds: facts.body_s, source_audio: srcAudio,
    output_has_audio: !!got.has_audio, nrmse_max: checks.audio_nrmse_max, corr_min: checks.audio_corr_min,
  });
  const why = [];
  if (!duration_ok) why.push(`the cut is ${kitNum(got.duration_s || 0, 3)}s, expected ${kitNum(total, 3)}s`);
  if (!video.passed) {
    why.push(
      video.frames !== facts.frames || video.output_frames !== facts.frames
        ? `the kept picture has ${video.output_frames} frames, the original ${video.frames} from the cut (expected ${facts.frames})`
        : `a kept frame is ${video.psnr_min} dB from the original, under ${checks.psnr_min} dB`,
    );
  }
  if (!audio.passed) {
    why.push(
      audio.error ||
        (srcAudio ? `the kept sound differs from the original (error ${audio.nrmse}, correlation ${audio.corr})` : 'the original is silent after the cut, but the output is not'),
    );
  }
  return { video, audio, passed: !why.length, why };
}

const r3 = (x) => +x.toFixed(3);

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const checks = { psnr_min: 45, audio_nrmse_max: 0.08, audio_corr_min: 0.99, ...(inputs.checks || {}) };
  const max_mb = inputs.max_mb ?? SPLICE_MAX_MB;
  const footage = inputs.footage;
  if (footage.length > 2) throw ctx.error('bad_input', `footage has ${footage.length} entries; splice takes the original ad last and at most one opening clip before it`);
  const bodyEntry = footage.at(-1);
  if ((bodyEntry.kind ?? 'video') === 'image') throw ctx.error('bad_input', 'the last footage entry is the original ad; it must be a video or a finished render, not an image');
  const body = bodyEntry.file || bodyEntry.video;

  let hook;
  if (inputs.hook) {
    if (footage.length === 2) throw ctx.error('bad_input', 'there is a hook video and an opening clip in footage; give only one opening');
    hook = { file: inputs.hook, start_s: 0, end_s: null, audio: true };
  } else if (footage.length === 2) {
    const e = footage[0];
    if ((e.kind ?? 'video') === 'image') throw ctx.error('bad_input', 'the opening clip (footage[0]) is an image; splice needs a video opening');
    hook = { file: e.file || e.video, start_s: (e.start_ms ?? 0) / 1000, end_s: e.end_ms == null ? null : e.end_ms / 1000, audio: e.audio !== false };
  } else {
    throw ctx.error('bad_input', 'splice needs a new opening: a hook video, or the opening clip as the first footage entry');
  }
  for (const [what, f] of [['original ad', body], ['opening', hook.file]]) {
    if (await spliceIsLfsPointer(f.path)) throw ctx.error('bad_input', `the ${what} is a Git LFS pointer, not media; fetch the real file`);
  }

  const info = await spliceProbe(ctx, body.path);
  const packets = await splicePackets(ctx, body.path);
  const facts = spliceSourceFacts(info, packets, {
    cut_s: (bodyEntry.start_ms ?? 0) / 1000,
    end_s: bodyEntry.end_ms == null ? null : bodyEntry.end_ms / 1000,
  });
  if (facts.problem) throw ctx.error('bad_input', facts.problem);

  const hookInfo = await spliceProbe(ctx, hook.file.path);
  if (!hookInfo.video) throw ctx.error('bad_input', 'the new opening has no picture');
  const hookLength = await kitMediaLength(ctx, hook.file);
  const hookEnd = hook.end_s ?? hookLength;
  if (!(hookEnd > hook.start_s)) throw ctx.error('bad_input', 'the opening clip\'s window is empty');
  if (hookEnd > hookLength + 0.1) throw ctx.error('bad_input', `the opening clip's window ends at ${kitNum(hookEnd, 2)}s of a ${kitNum(hookLength, 2)}s clip`);
  const frames = Math.round((hookEnd - hook.start_s) * facts.fps);
  if (frames < 1) throw ctx.error('bad_input', 'the opening is shorter than one frame');
  const hook_s = frames / facts.fps;
  if (hook_s > SPLICE_MAX_HOOK_S) throw ctx.error('bad_input', `the opening is ${kitNum(hook_s, 1)}s; at most ${SPLICE_MAX_HOOK_S}s`);

  const srcAudio = info.audio;
  const hookAudio = hook.audio && hookInfo.audio && hookInfo.audio.layout && hookInfo.audio.sample_rate ? hookInfo.audio : null;
  const target = srcAudio || hookAudio;
  const total = hook_s + facts.body_s;
  const plan = { hook, body, facts, frames, hook_s, hookAudio, srcAudio, target, out: join(ctx.workDir, 'spliced.mp4') };

  const projected = {
    copy: spliceProjectedBytes({ mode: 'copy', seconds: total, hook_s, kept_bytes: facts.kept_bytes, body_s: facts.body_s }),
    encode: spliceProjectedBytes({ mode: 'encode', seconds: total, hook_s, kept_bytes: facts.kept_bytes, body_s: facts.body_s }),
  };
  let copied = false;
  let verdict = null;
  if (facts.copyable && !spliceSizeProblem(projected.copy, max_mb)) {
    ctx.progress({ fraction: 0.1 });
    await spliceByCopy(ctx, plan);
    verdict = await spliceVerify(ctx, { ...plan, checks });
    if (verdict.passed) copied = true;
    else ctx.log.warn('the stream-copied body failed its checks; re-encoding the cut', { why: verdict.why });
  } else if (!facts.key_at_cut) {
    ctx.log.info('the cut is not on a keyframe, so the cut is re-encoded', { cut_s: facts.t0 });
  }
  if (!copied) {
    const problem = spliceSizeProblem(projected.encode, max_mb, { projected: true });
    if (problem) throw ctx.error('output_invalid', problem);
    ctx.progress({ fraction: 0.5 });
    await spliceByEncode(ctx, plan);
    verdict = await spliceVerify(ctx, { ...plan, checks });
    if (!verdict.passed) throw ctx.error('output_invalid', `the kept body does not match the original: ${verdict.why.join('; ')}`);
  }

  const bytes = (await stat(plan.out)).size;
  const tooBig = spliceSizeProblem(bytes, max_mb);
  if (tooBig) throw ctx.error('output_invalid', tooBig);
  const source_sha256 = await spliceSha256(body.path);
  if (body.sha256 && body.sha256 !== source_sha256) throw ctx.error('output_invalid', 'the original ad changed while it was being spliced');
  if (hook.file.sha256 && hook.file.sha256 !== (await spliceSha256(hook.file.path))) throw ctx.error('output_invalid', 'the opening changed while it was being spliced');

  ctx.progress({ fraction: 1 });
  const video = await ctx.file('spliced.mp4', 'video');
  const timeline = {
    duration_s: r3(total),
    width: facts.width,
    height: facts.height,
    fps: facts.fps,
    scenes: [
      { id: 'hook', start_s: 0, end_s: r3(hook_s) },
      { id: 'body', start_s: r3(hook_s), end_s: r3(total) },
    ],
    speech: ((inputs.hook_timeline && inputs.hook_timeline.speech) || [])
      .filter((s) => s.start_s < hook_s)
      .map((s) => ({ ...s, end_s: Math.min(s.end_s, r3(hook_s)) })),
  };
  const card = inputs.body_timeline && inputs.body_timeline.end_card;
  if (card) {
    const shift = hook_s - facts.t0;
    const start_s = Math.max(hook_s, card.start_s + shift);
    const end_s = Math.min(total, card.end_s + shift);
    if (end_s > start_s + 0.01) timeline.end_card = { start_s: r3(start_s), end_s: r3(end_s) };
  }
  const retained = {
    start_s: r3(hook_s),
    end_s: r3(total),
    cut_s: r3(facts.t0),
    frames: facts.frames,
    exact_frames: verdict.video.exact,
    psnr_min: verdict.video.psnr_min,
    audio_nrmse: verdict.audio.nrmse,
    audio_corr: verdict.audio.corr,
    copied,
    source_sha256,
  };
  ctx.log.info('spliced', { copied, frames: facts.frames, exact_frames: retained.exact_frames, psnr_min: retained.psnr_min, audio_corr: retained.audio_corr, bytes });
  return kitCheckOutputs(ctx, manifest, { video, seconds: r3(total), timeline, retained });
}
