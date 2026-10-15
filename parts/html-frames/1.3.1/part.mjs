// html-frames 1.3.1: built by scripts/build-kit-parts.ts from src/kit/maker. Do not edit by hand.

// src/kit/maker/make.ts
import { createHash as createHash2 } from "node:crypto";
import { mkdir as mkdir2, readFile as readFile4, rm as rm3, stat as stat2, writeFile as writeFile2 } from "node:fs/promises";
import * as path3 from "node:path";
import { pathToFileURL } from "node:url";

// src/kit/maker/cues.ts
var CUE_SOUNDS = ["tick", "tap", "pop", "chime", "whoosh", "swoosh", "notify", "click"];
var CUE_RATE = 48e3;
var CUE_CEILING = 0.891;
var CUT_FADE_S = 5e-3;
var SILENCE = 1 / 2048;
function isSound(value) {
  return typeof value === "string" && CUE_SOUNDS.includes(value);
}
function cuesOf(report) {
  const raw = report && typeof report === "object" ? report.cues : void 0;
  if (!Array.isArray(raw)) return [];
  const cues = [];
  for (const item of raw.slice(0, 500)) {
    if (!item || typeof item !== "object") continue;
    const { sound, at_s, gain, max_s } = item;
    if (!isSound(sound) || typeof at_s !== "number" || !Number.isFinite(at_s) || at_s < 0) continue;
    cues.push({
      sound,
      at_s,
      gain: typeof gain === "number" && Number.isFinite(gain) && gain >= 0 && gain <= 4 ? gain : 1,
      max_s: typeof max_s === "number" && Number.isFinite(max_s) && max_s > 0 && max_s <= 10 ? max_s : null
    });
  }
  return cues;
}
function readWav(data) {
  if (data.length < 12) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const tag = (at) => String.fromCharCode(data[at], data[at + 1], data[at + 2], data[at + 3]);
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") return null;
  let format = null;
  let body = null;
  for (let at = 12; at + 8 <= data.length; ) {
    const id = tag(at);
    const size = view.getUint32(at + 4, true);
    if (id === "fmt " && size >= 16) {
      format = { code: view.getUint16(at + 8, true), channels: view.getUint16(at + 10, true), rate: view.getUint32(at + 12, true), bits: view.getUint16(at + 22, true) };
    } else if (id === "data") {
      body = { at: at + 8, size: Math.min(size, data.length - at - 8) };
    }
    at += 8 + size + size % 2;
  }
  if (!format || !body || format.code !== 1 && format.code !== 65534 || format.bits !== 16 || format.channels < 1 || format.channels > 2) return null;
  const frames = Math.floor(body.size / (2 * format.channels));
  const channels = Array.from({ length: format.channels }, () => new Float32Array(frames));
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < format.channels; c++) channels[c][i] = view.getInt16(body.at + (i * format.channels + c) * 2, true) / 32768;
  }
  return { rate: format.rate, channels };
}
function bankSound(pcm) {
  const length = pcm.channels[0].length;
  const mono = new Float32Array(length);
  for (const channel of pcm.channels) for (let i = 0; i < length; i++) mono[i] += channel[i] / pcm.channels.length;
  let start = 0;
  while (start < length && Math.abs(mono[start]) <= SILENCE) start++;
  return mono.subarray(start);
}
function frameSample(frame, fps) {
  return Math.round(frame * CUE_RATE / fps);
}
function mixCues(opts) {
  const length = frameSample(opts.frames, opts.fps);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  if (opts.bed && opts.bed.length) {
    const l = opts.bed[0];
    const r = opts.bed[1] ?? opts.bed[0];
    left.set(l.subarray(0, Math.min(length, l.length)));
    right.set(r.subarray(0, Math.min(length, r.length)));
  }
  const placed = [];
  const fade = Math.max(1, Math.round(CUT_FADE_S * CUE_RATE));
  for (const cue of opts.cues) {
    const sound = opts.bank.get(cue.sound);
    if (!sound || !sound.length) continue;
    const frame = Math.min(opts.frames - 1, Math.max(0, Math.ceil(cue.at_s * opts.fps - 1e-6)));
    const sample = frameSample(frame, opts.fps);
    let take = Math.min(sound.length, length - sample);
    const cut = cue.max_s !== null && Math.round(cue.max_s * CUE_RATE) < take;
    if (cut) take = Math.round(cue.max_s * CUE_RATE);
    for (let i = 0; i < take; i++) {
      const tail = take - i;
      const v = sound[i] * cue.gain * (cut && tail <= fade ? tail / fade : 1);
      left[sample + i] += v;
      right[sample + i] += v;
    }
    placed.push({ ...cue, frame, sample });
  }
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const gain = peak > CUE_CEILING ? CUE_CEILING / peak : 1;
  if (gain !== 1) {
    for (let i = 0; i < length; i++) {
      left[i] *= gain;
      right[i] *= gain;
    }
  }
  return { channels: [left, right], placed, gain };
}
function wavBytes(channels, rate = CUE_RATE) {
  const frames = channels[0]?.length ?? 0;
  const count = channels.length;
  const size = frames * count * 2;
  const data = new Uint8Array(44 + size);
  const view = new DataView(data.buffer);
  const put = (at, text2) => {
    for (let i = 0; i < 4; i++) data[at + i] = text2.charCodeAt(i);
  };
  put(0, "RIFF");
  view.setUint32(4, 36 + size, true);
  put(8, "WAVE");
  put(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, count, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * count * 2, true);
  view.setUint16(32, count * 2, true);
  view.setUint16(34, 16, true);
  put(36, "data");
  view.setUint32(40, size, true);
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < count; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(44 + (i * count + c) * 2, Math.round(v * 32767), true);
    }
  }
  return data;
}
function bedArgs(opts) {
  return [
    "-hide_banner",
    "-nostdin",
    "-loglevel",
    "error",
    "-y",
    "-i",
    opts.under,
    "-map",
    "0:a:0",
    "-vn",
    "-t",
    opts.seconds.toFixed(6),
    "-ac",
    "2",
    "-ar",
    String(CUE_RATE),
    "-c:a",
    "pcm_s16le",
    "-fflags",
    "+bitexact",
    "-flags",
    "+bitexact",
    "-map_metadata",
    "-1",
    opts.out
  ];
}
function muxArgs(opts) {
  return [
    "-hide_banner",
    "-nostdin",
    "-loglevel",
    "error",
    "-y",
    "-i",
    opts.picture,
    "-i",
    opts.audio,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    ...opts.tools.encodeArgs("aac"),
    "-ac",
    "2",
    "-t",
    opts.seconds.toFixed(6),
    "-movflags",
    "+faststart",
    opts.out
  ];
}

// src/kit/maker/encode.ts
var SEGMENT_FRAMES = 60;
var FRAME_PATTERN = "f%06d.png";
var MASTER_RATE_CAP = ["-maxrate", "16M", "-bufsize", "32M"];
function frameName(index) {
  return `f${String(index).padStart(6, "0")}.png`;
}
function segmentArgs(opts) {
  return [
    "-hide_banner",
    "-nostdin",
    "-loglevel",
    "error",
    "-y",
    "-framerate",
    String(opts.fps),
    "-start_number",
    String(opts.start),
    "-i",
    `${opts.framesDir}/${FRAME_PATTERN}`,
    "-frames:v",
    String(opts.count),
    "-vf",
    "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    ...opts.tools.encodeArgs("h264-master"),
    ...MASTER_RATE_CAP,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-color_range",
    "tv",
    "-an",
    "-r",
    String(opts.fps),
    opts.out
  ];
}
function concatList(segments) {
  return segments.map((file) => `file '${file.replace(/'/g, `'\\''`)}'
`).join("");
}
function concatArgs(listFile, out) {
  return [
    "-hide_banner",
    "-nostdin",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFile,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    "-fflags",
    "+bitexact",
    "-map_metadata",
    "-1",
    out
  ];
}
function pngSize(data) {
  if (data.length < 24 || data[0] !== 137 || data[1] !== 80 || data[2] !== 78 || data[3] !== 71) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

// src/kit/maker/images.ts
function gifFrames(data) {
  if (data.length < 13) return 0;
  let at = 13;
  if (data[10] & 128) at += 3 * (1 << (data[10] & 7) + 1);
  let frames = 0;
  const skipBlocks = () => {
    while (at < data.length && data[at] !== 0) at += data[at] + 1;
    at++;
  };
  while (at < data.length) {
    const block = data[at];
    if (block === 59) break;
    if (block === 33) {
      at += 2;
      skipBlocks();
    } else if (block === 44) {
      frames++;
      if (frames > 1) return frames;
      const packed = data[at + 9];
      at += 10;
      if (packed & 128) at += 3 * (1 << (packed & 7) + 1);
      at++;
      skipBlocks();
    } else break;
  }
  return frames;
}
function pngIsAnimated(data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let at = 8;
  while (at + 8 <= data.length) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(data[at + 4], data[at + 5], data[at + 6], data[at + 7]);
    if (type === "acTL") return at + 12 <= data.length && view.getUint32(at + 8) > 1;
    if (type === "IDAT" || type === "IEND") return false;
    at += 12 + length;
  }
  return false;
}
function text(data, start, n) {
  return String.fromCharCode(...data.subarray(start, start + n));
}
function webpIsAnimated(data) {
  let at = 12;
  while (at + 8 <= data.length) {
    const type = text(data, at, 4);
    const size = data[at + 4] | data[at + 5] << 8 | data[at + 6] << 16 | data[at + 7] << 24;
    if (type === "VP8X" && data[at + 8] & 2) return true;
    if (type === "ANIM" || type === "ANMF") return true;
    at += 8 + size + (size & 1);
  }
  return false;
}
function svgText(data) {
  if (data[0] === 255 && data[1] === 254) return new TextDecoder("utf-16le").decode(data);
  if (data[0] === 254 && data[1] === 255) return new TextDecoder("utf-16be").decode(data);
  return new TextDecoder("utf-8").decode(data);
}
var SVG_MOTION = /<([A-Za-z_][\w.-]*:)?(animate|animateTransform|animateMotion|animateColor|set)\b|@keyframes|\banimation(-name)?\s*:/i;
function isAnimatedImage(data) {
  if (data.length >= 6 && /^GIF8[79]a$/.test(text(data, 0, 6))) return gifFrames(data) > 1;
  if (data.length >= 8 && data[0] === 137 && text(data, 1, 3) === "PNG") return pngIsAnimated(data);
  if (data.length >= 12 && text(data, 0, 4) === "RIFF" && text(data, 8, 4) === "WEBP") return webpIsAnimated(data);
  if (data.length >= 12 && text(data, 4, 4) === "ftyp") return /avis|msf1/.test(text(data, 8, Math.min(56, data.length - 8)));
  const bom = data[0] === 239 && data[1] === 187 && data[2] === 191 || data[0] === 255 && data[1] === 254 || data[0] === 254 && data[1] === 255;
  if (!bom && data[0] !== 60 && !/\s/.test(String.fromCharCode(data[0] ?? 0))) return false;
  const svg = svgText(data);
  return isSvgDocument(svg) && SVG_MOTION.test(svg);
}
function isSvgDocument(textOf) {
  let at = textOf.charCodeAt(0) === 65279 ? 1 : 0;
  for (; ; ) {
    while (at < textOf.length && /\s/.test(textOf[at])) at++;
    if (textOf.startsWith("<!--", at)) {
      const end = textOf.indexOf("-->", at + 4);
      if (end < 0) return false;
      at = end + 3;
    } else if (textOf.startsWith("<?", at)) {
      const end = textOf.indexOf("?>", at + 2);
      if (end < 0) return false;
      at = end + 2;
    } else if (/^<!doctype/i.test(textOf.slice(at, at + 9))) {
      const bracket = textOf.indexOf("[", at);
      const close = textOf.indexOf(">", at);
      if (close < 0) return false;
      at = bracket >= 0 && bracket < close ? textOf.indexOf("]>", bracket) + 2 : close + 1;
      if (at < 2) return false;
    } else break;
  }
  return /^<([A-Za-z_][\w.-]*:)?svg[\s>/]/i.test(textOf.slice(at, at + 80));
}
function dataUrlBytes(url) {
  const match = /^data:([^,]*),([\s\S]*)$/i.exec(url.trim());
  if (!match) return null;
  const head = match[1];
  const body = match[2];
  const mime = (head.split(";")[0] || "text/plain").trim().toLowerCase();
  if (/;\s*base64\s*$/i.test(head)) return { mime, bytes: Buffer.from(body.replace(/\s+/g, ""), "base64") };
  const out = [];
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "%" && /^[0-9a-f]{2}$/i.test(body.slice(i + 1, i + 3))) {
      out.push(parseInt(body.slice(i + 1, i + 3), 16));
      i += 2;
    } else out.push(...Buffer.from(body[i], "utf8"));
  }
  return { mime, bytes: Buffer.from(out) };
}
function cssDataUrls(css, depth = 0) {
  const found = [];
  const token = /url\(\s*(['"]?)(data:[^'")]*)\1\s*\)|@import\s+(['"])(data:[^'"]*)\3/gi;
  let match;
  while (match = token.exec(css)) {
    const url = match[2] ?? match[4];
    const decoded = dataUrlBytes(url);
    if (!decoded) continue;
    found.push({ url, ...decoded });
    if (decoded.mime === "text/css" && depth < 4) found.push(...cssDataUrls(decoded.bytes.toString("utf8"), depth + 1));
  }
  return found;
}
function tiffOrientation(tiff) {
  if (tiff.length < 8) return 1;
  const little = tiff[0] === 73 && tiff[1] === 73;
  if (!little && !(tiff[0] === 77 && tiff[1] === 77)) return 1;
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const u16 = (at) => view.getUint16(at, little);
  if (u16(2) !== 42) return 1;
  const ifd = view.getUint32(4, little);
  if (ifd + 2 > tiff.length) return 1;
  const count = u16(ifd);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > tiff.length) break;
    if (u16(entry) === 274 && u16(entry + 2) === 3) {
      const value = u16(entry + 8);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}
function jpegGeometry(data) {
  let at = 2;
  let orientation = 1;
  let exifSeen = false;
  while (at + 4 <= data.length) {
    if (data[at] !== 255) return null;
    const marker = data[at + 1];
    if (marker === 255) {
      at++;
      continue;
    }
    if (marker === 1 || marker >= 208 && marker <= 215) {
      at += 2;
      continue;
    }
    if (marker === 217 || marker === 218) return null;
    const length = data[at + 2] << 8 | data[at + 3];
    if (length < 2) return null;
    const body = at + 4;
    if (marker === 225 && !exifSeen && text(data, body, 6) === "Exif\0\0") {
      exifSeen = true;
      orientation = tiffOrientation(data.subarray(body + 6, at + 2 + length));
    }
    const sof = marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204;
    if (sof && body + 5 <= data.length) {
      const height = data[body + 1] << 8 | data[body + 2];
      const width = data[body + 3] << 8 | data[body + 4];
      return width && height ? { format: "jpeg", width, height, orientation } : null;
    }
    at += 2 + length;
  }
  return null;
}
function webpGeometry(data) {
  if (data.length < 30) return null;
  const chunk = text(data, 12, 4);
  const p = 20;
  const u24 = (at) => data[at] | data[at + 1] << 8 | data[at + 2] << 16;
  if (chunk === "VP8X") return { format: "webp", width: 1 + u24(p + 4), height: 1 + u24(p + 7), orientation: 1 };
  if (chunk === "VP8 " && data[p + 3] === 157 && data[p + 4] === 1 && data[p + 5] === 42) {
    return { format: "webp", width: (data[p + 6] | data[p + 7] << 8) & 16383, height: (data[p + 8] | data[p + 9] << 8) & 16383, orientation: 1 };
  }
  if (chunk === "VP8L" && data[p] === 47) {
    const [b1, b2, b3, b4] = [data[p + 1], data[p + 2], data[p + 3], data[p + 4]];
    return { format: "webp", width: 1 + (b1 | (b2 & 63) << 8), height: 1 + (b2 >> 6 | b3 << 2 | (b4 & 15) << 10), orientation: 1 };
  }
  return null;
}
function pictureGeometry(data) {
  if (data.length >= 24 && data[0] === 137 && text(data, 1, 3) === "PNG" && text(data, 12, 4) === "IHDR") {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    let orientation = 1;
    for (let at = 8; at + 12 <= data.length; ) {
      const length = view.getUint32(at);
      const type = text(data, at + 4, 4);
      if (type === "IEND") break;
      if (type === "eXIf") {
        orientation = tiffOrientation(data.subarray(at + 8, at + 8 + length));
        break;
      }
      at += 12 + length;
    }
    return width && height ? { format: "png", width, height, orientation } : null;
  }
  if (data.length >= 4 && data[0] === 255 && data[1] === 216) return jpegGeometry(data);
  if (data.length >= 12 && text(data, 0, 4) === "RIFF" && text(data, 8, 4) === "WEBP") return webpGeometry(data);
  return null;
}

// src/kit/core/canonical.ts
function isFileRef(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value;
  return v.kind === "file" && typeof v.sha256 === "string" && typeof v.media === "string" && typeof v.path === "string";
}

// src/kit/core/schema.ts
var NOTES = /* @__PURE__ */ new Set(["$schema", "$id", "$comment", "title", "description", "default", "examples", "deprecated", "readOnly", "writeOnly", "format", "$defs", "definitions", "contentMediaType"]);
var CHECKED = /* @__PURE__ */ new Set([
  "type",
  "enum",
  "const",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minLength",
  "maxLength",
  "pattern",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "anyOf",
  "oneOf",
  "allOf",
  "not",
  "$ref",
  "minProperties",
  "maxProperties",
  "x-kit-file"
]);
function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}
function typeMatches(value, type) {
  const actual = typeOf(value);
  return actual === type || type === "number" && actual === "integer";
}
function equal(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function resolveRef(root, ref) {
  if (!ref.startsWith("#/")) throw new Error(`a schema $ref outside the part (${ref})`);
  let node = root;
  for (const raw of ref.slice(2).split("/")) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    node = node && typeof node === "object" ? node[key] : void 0;
  }
  if (!node || typeof node !== "object") throw new Error(`a schema $ref that points nowhere (${ref})`);
  return node;
}
function check(root, schema, value, at, errors, depth) {
  if (depth > 64) throw new Error("a schema nested too deeply");
  if (schema === true || schema === void 0) return;
  if (schema === false) {
    errors.push(`${at} is not allowed`);
    return;
  }
  if (!schema || typeof schema !== "object") throw new Error(`a schema at ${at} that is not an object`);
  const s = schema;
  for (const key of Object.keys(s)) {
    if (!CHECKED.has(key) && !NOTES.has(key) && !key.startsWith("x-")) throw new Error(`the schema keyword "${key}" at ${at}, which this kit can't check`);
  }
  if (typeof s.$ref === "string") check(root, resolveRef(root, s.$ref), value, at, errors, depth + 1);
  if (s.type !== void 0) {
    const types = Array.isArray(s.type) ? s.type : [s.type];
    if (!types.some((t) => typeMatches(value, t))) {
      errors.push(`${at} should be ${types.join(" or ")}`);
      return;
    }
  }
  if (s.enum !== void 0 && !s.enum.some((v) => equal(v, value))) errors.push(`${at} is not one of the allowed values`);
  if (s.const !== void 0 && !equal(s.const, value)) errors.push(`${at} is not the required value`);
  const file = s["x-kit-file"];
  if (file) {
    if (!isFileRef(value)) errors.push(`${at} should be a file`);
    else {
      if (file.media && value.media !== file.media) errors.push(`${at} should be ${file.media}, not ${value.media}`);
      if (file.mime && !file.mime.includes(value.mime)) errors.push(`${at} has the wrong file type (${value.mime})`);
    }
  }
  if (typeof value === "string") {
    if (typeof s.minLength === "number" && [...value].length < s.minLength) errors.push(`${at} is too short`);
    if (typeof s.maxLength === "number" && [...value].length > s.maxLength) errors.push(`${at} is too long`);
    if (typeof s.pattern === "string" && !new RegExp(s.pattern, "u").test(value)) errors.push(`${at} does not match its pattern`);
  }
  if (typeof value === "number") {
    if (typeof s.minimum === "number" && value < s.minimum) errors.push(`${at} is below ${s.minimum}`);
    if (typeof s.maximum === "number" && value > s.maximum) errors.push(`${at} is above ${s.maximum}`);
    if (typeof s.exclusiveMinimum === "number" && value <= s.exclusiveMinimum) errors.push(`${at} must be above ${s.exclusiveMinimum}`);
    if (typeof s.exclusiveMaximum === "number" && value >= s.exclusiveMaximum) errors.push(`${at} must be below ${s.exclusiveMaximum}`);
    if (typeof s.multipleOf === "number" && Math.abs(value / s.multipleOf - Math.round(value / s.multipleOf)) > 1e-9) errors.push(`${at} is not a multiple of ${s.multipleOf}`);
  }
  if (Array.isArray(value)) {
    if (typeof s.minItems === "number" && value.length < s.minItems) errors.push(`${at} has too few items`);
    if (typeof s.maxItems === "number" && value.length > s.maxItems) errors.push(`${at} has too many items`);
    if (s.uniqueItems === true && new Set(value.map((v) => JSON.stringify(v))).size !== value.length) errors.push(`${at} lists an item twice`);
    if (s.items !== void 0) value.forEach((item, i) => check(root, s.items, item, `${at}[${i}]`, errors, depth + 1));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value;
    const keys = Object.keys(obj);
    if (typeof s.minProperties === "number" && keys.length < s.minProperties) errors.push(`${at} has too few fields`);
    if (typeof s.maxProperties === "number" && keys.length > s.maxProperties) errors.push(`${at} has too many fields`);
    const props = s.properties ?? {};
    for (const name of s.required ?? []) if (obj[name] === void 0) errors.push(`${at}.${name} is missing`);
    for (const key of keys) {
      if (obj[key] === void 0) continue;
      if (key in props) check(root, props[key], obj[key], `${at}.${key}`, errors, depth + 1);
      else if (s.additionalProperties === false) errors.push(`${at}.${key} is not a known field`);
      else if (s.additionalProperties !== void 0) check(root, s.additionalProperties, obj[key], `${at}.${key}`, errors, depth + 1);
    }
  }
  const branch = (option) => {
    const inner = [];
    check(root, option, value, at, inner, depth + 1);
    return inner.length === 0;
  };
  if (Array.isArray(s.allOf)) for (const option of s.allOf) check(root, option, value, at, errors, depth + 1);
  if (Array.isArray(s.anyOf) && !s.anyOf.some(branch)) errors.push(`${at} matches none of its allowed shapes`);
  if (Array.isArray(s.oneOf) && s.oneOf.filter(branch).length !== 1) errors.push(`${at} must match exactly one allowed shape`);
  if (s.not !== void 0 && branch(s.not)) errors.push(`${at} is a shape that is not allowed`);
}
function schemaErrors(schema, value, at = "inputs") {
  const errors = [];
  check(schema, schema, value, at, errors, 0);
  return errors.slice(0, 20);
}

// src/kit/maker/parts/html-frames/1.3.1/part.json
var inputs = {
  type: "object",
  additionalProperties: false,
  required: [
    "template",
    "scenes",
    "aspect",
    "max_words"
  ],
  oneOf: [
    {
      required: [
        "duration_s"
      ]
    },
    {
      required: [
        "scene_s"
      ]
    },
    {
      required: [
        "pace"
      ]
    },
    {
      required: [
        "speech"
      ]
    },
    {
      required: [
        "under"
      ]
    }
  ],
  properties: {
    template: {
      description: "The style's frame page. The maker puts the kit runtime first in its head; the page reads window.kit and draws each frame from kit.render(fn), renderAt(t), seek(ms), or CSS and Web Animations.",
      type: "object",
      "x-kit-file": {
        media: "html"
      }
    },
    frames: {
      description: "Every other file the page uses (css, js, json, svg, png, jpg, webp), kept at the same places relative to the template. The page can load nothing else.",
      type: "array",
      maxItems: 200,
      items: {
        anyOf: [
          {
            type: "object",
            "x-kit-file": {
              media: "html"
            }
          },
          {
            type: "object",
            "x-kit-file": {
              media: "text"
            }
          },
          {
            type: "object",
            "x-kit-file": {
              media: "json"
            }
          },
          {
            type: "object",
            "x-kit-file": {
              media: "image"
            }
          }
        ]
      }
    },
    fonts: {
      description: "The style's fonts (ttf, otf, woff, woff2). CSS uses each by its file name without the extension.",
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        "x-kit-file": {
          media: "font"
        }
      }
    },
    scenes: {
      description: "plan.scenes, in order. Each scene's time comes from duration_s or scene_s (shared evenly), pace (by word count), speech (from its first spoken entry) or under_timeline (the video drawn over). kit.scenes carries each one's start_s and end_s, and picture and image as URLs when they are files.",
      type: "array",
      minItems: 1,
      maxItems: 30,
      items: {
        type: "object",
        properties: {
          id: {
            type: [
              "string",
              "null"
            ],
            maxLength: 64
          },
          line: {
            type: [
              "string",
              "null"
            ],
            maxLength: 2e3
          },
          on_screen: {
            type: [
              "string",
              "null"
            ],
            maxLength: 2e3
          },
          picture: {
            anyOf: [
              {
                type: "null"
              },
              {
                type: "string",
                maxLength: 2e3
              },
              {
                type: "object",
                "x-kit-file": {
                  media: "image"
                }
              }
            ]
          },
          image: {
            description: "A picture the customer uploaded for this scene, as kit.scenes[i].image (a URL the page can load).",
            anyOf: [
              {
                type: "null"
              },
              {
                type: "object",
                "x-kit-file": {
                  media: "image"
                }
              }
            ]
          },
          speaker: {
            description: "The cast key of who says this scene, as kit.scenes[i].speaker.",
            type: [
              "string",
              "null"
            ],
            maxLength: 64
          },
          extra: {
            description: "The style's own scene fields (plan.scenes[].extra), as kit.scenes[i].extra.",
            type: [
              "object",
              "null"
            ]
          }
        }
      }
    },
    max_words: {
      description: "The style's scenes.max_words. A scene whose line or on-screen text has more words is refused.",
      type: "integer",
      minimum: 1,
      maximum: 200
    },
    products: {
      description: "plan.products, in the customer's order. A PNG, JPEG or WebP photo over 2048 px on its long side, as shown after its EXIF orientation, reaches the page turned upright and scaled down to 2048 px (a PNG or WebP as PNG, keeping its transparency).",
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        required: [
          "id"
        ],
        properties: {
          id: {
            type: "string",
            minLength: 1
          },
          name: {
            type: [
              "string",
              "null"
            ],
            maxLength: 2e3
          },
          images: {
            type: "array",
            maxItems: 20,
            items: {
              type: "object",
              "x-kit-file": {
                media: "image"
              }
            }
          }
        }
      }
    },
    brand: {
      description: 'The brand frozen at the yes ({"from": "brand"}): name, logo, colors, fonts (heading, body), cta. Colours become CSS variables (--brand-primary, ...); fonts are brand-heading and brand-body.',
      type: [
        "object",
        "null"
      ],
      properties: {
        name: {
          type: [
            "string",
            "null"
          ],
          maxLength: 2e3
        },
        logo: {
          anyOf: [
            {
              type: "null"
            },
            {
              type: "object",
              "x-kit-file": {
                media: "image"
              }
            }
          ]
        },
        colors: {
          type: [
            "object",
            "null"
          ]
        },
        fonts: {
          type: [
            "object",
            "null"
          ],
          properties: {
            heading: {
              anyOf: [
                {
                  type: "null"
                },
                {
                  type: "object",
                  "x-kit-file": {
                    media: "font"
                  }
                }
              ]
            },
            body: {
              anyOf: [
                {
                  type: "null"
                },
                {
                  type: "object",
                  "x-kit-file": {
                    media: "font"
                  }
                }
              ]
            }
          }
        },
        cta: {
          type: [
            "object",
            "null"
          ]
        }
      }
    },
    aspect: {
      enum: [
        "9:16",
        "1:1",
        "4:5",
        "16:9"
      ]
    },
    duration_s: {
      description: "Length of the whole video, in seconds. Give this or scene_s.",
      type: "number",
      minimum: 0.5,
      maximum: 180
    },
    scene_s: {
      description: "Seconds per scene; the video is this times the number of scenes. Give this or duration_s.",
      type: "number",
      exclusiveMinimum: 0,
      maximum: 60
    },
    fps: {
      description: "Frames per second. Default 30; drawn over a video (under), that video's own rate, rounded and kept to 1-60.",
      type: "integer",
      minimum: 1,
      maximum: 60,
      default: 30
    },
    short_side: {
      description: "Pixels on the short side of the video. The page is always laid out at 1080 and scaled.",
      enum: [
        720,
        1080
      ],
      default: 1080
    },
    values: {
      description: "The style's own plain values for its page (labels, look choices), as kit.values.",
      type: "object"
    },
    under: {
      description: "A video to draw over (another step's video). The page is drawn transparent and laid over it; its sound is kept, the video is as long as it, and the page's size and fps follow the aspect and fps inputs. Needs under_timeline.",
      type: "object",
      "x-kit-file": {
        media: "video"
      }
    },
    under_timeline: {
      description: "The timeline of the video drawn over. kit.scenes take its scene start times by id (in order when no id matches and the counts match); each runs to the next one's start, so a gap between its scenes belongs to the scene before it on the page. When it is one scene (one clip, say) and the plan has several, the plan's scenes share it evenly on whole frames and become this step's scenes; any other count mismatch is refused. Its speech, end_card and safe_zones pass through to this step's timeline. kit.under.quiet_band[i] is the emptiest band of scene i's middle frame.",
      type: "object",
      additionalProperties: false,
      required: [
        "duration_s",
        "width",
        "height",
        "fps",
        "scenes",
        "speech"
      ],
      properties: {
        duration_s: {
          type: "number",
          exclusiveMinimum: 0
        },
        width: {
          type: "integer",
          minimum: 1
        },
        height: {
          type: "integer",
          minimum: 1
        },
        fps: {
          type: "number",
          exclusiveMinimum: 0
        },
        scenes: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "id",
              "start_s",
              "end_s"
            ],
            properties: {
              id: {
                type: "string"
              },
              start_s: {
                type: "number",
                minimum: 0
              },
              end_s: {
                type: "number",
                minimum: 0
              }
            }
          }
        },
        speech: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "text",
              "start_s",
              "end_s"
            ],
            properties: {
              scene_id: {
                type: "string"
              },
              text: {
                type: "string"
              },
              spoken: {
                type: "string"
              },
              start_s: {
                type: "number",
                minimum: 0
              },
              end_s: {
                type: "number",
                minimum: 0
              },
              words: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "text",
                    "start_s",
                    "end_s"
                  ],
                  properties: {
                    text: {
                      type: "string"
                    },
                    start_s: {
                      type: "number",
                      minimum: 0
                    },
                    end_s: {
                      type: "number",
                      minimum: 0
                    }
                  }
                }
              }
            }
          }
        },
        end_card: {
          type: "object",
          additionalProperties: false,
          required: [
            "start_s",
            "end_s"
          ],
          properties: {
            start_s: {
              type: "number",
              minimum: 0
            },
            end_s: {
              type: "number",
              minimum: 0
            }
          }
        },
        safe_zones: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "use",
              "x",
              "y",
              "w",
              "h"
            ],
            properties: {
              use: {
                enum: [
                  "captions",
                  "logo"
                ]
              },
              x: {
                type: "number"
              },
              y: {
                type: "number"
              },
              w: {
                type: "number",
                minimum: 0
              },
              h: {
                type: "number",
                minimum: 0
              }
            }
          }
        },
        assembly_timeline: {
          type: "object",
          description: "gooseworks-assembly-timeline/1, validated by the current kit; source clocks and revision are preserved only when actually unchanged."
        }
      }
    },
    speech: {
      description: "A voice track timeline's speech (step.<voice>.timeline.speech). Entries pair with scenes by scene_id, or in order when no entry has one and the counts match. Scene 1 starts at 0 and every other scene at its first speech entry; scenes with no speech share the gap before the next scene evenly. The video ends tail_s after the last entry. Passed through to the output timeline and to kit.speech; kit.scenes[i].words lists the words that start in scene i.",
      type: "array",
      minItems: 1,
      maxItems: 400,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "text",
          "start_s",
          "end_s"
        ],
        properties: {
          scene_id: {
            type: "string"
          },
          text: {
            type: "string"
          },
          spoken: {
            type: "string"
          },
          start_s: {
            type: "number",
            minimum: 0
          },
          end_s: {
            type: "number",
            minimum: 0
          },
          words: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "text",
                "start_s",
                "end_s"
              ],
              properties: {
                text: {
                  type: "string"
                },
                start_s: {
                  type: "number",
                  minimum: 0
                },
                end_s: {
                  type: "number",
                  minimum: 0
                }
              }
            }
          }
        }
      }
    },
    tail_s: {
      description: "Seconds held after the last spoken entry, when scenes are timed by speech. Default 0.",
      type: "number",
      minimum: 0,
      maximum: 10
    },
    pace: {
      description: "Each scene holds base_s + per_word_s for each word of its on_screen text (or its line when it has none), kept between min_s and max_s; the last scene holds at least last_min_s. The video is the sum of the holds.",
      type: "object",
      additionalProperties: false,
      required: [
        "base_s",
        "per_word_s"
      ],
      properties: {
        base_s: {
          type: "number",
          minimum: 0,
          maximum: 30
        },
        per_word_s: {
          type: "number",
          minimum: 0,
          maximum: 5
        },
        min_s: {
          type: "number",
          exclusiveMinimum: 0,
          maximum: 60
        },
        max_s: {
          type: "number",
          exclusiveMinimum: 0,
          maximum: 60
        },
        last_min_s: {
          type: "number",
          minimum: 0,
          maximum: 60
        }
      }
    },
    caption_zone: {
      description: "Where captions may go, in the page's CSS pixels (1080 on the short side), kept to the page. Reported in the video's pixels (rounded inward) as timeline.safe_zones[use=captions], which the captions layer keeps to; it replaces any caption zone of the video drawn over.",
      type: "object",
      additionalProperties: false,
      required: [
        "x",
        "y",
        "w",
        "h"
      ],
      properties: {
        x: {
          type: "number",
          minimum: 0
        },
        y: {
          type: "number",
          minimum: 0
        },
        w: {
          type: "number",
          exclusiveMinimum: 0
        },
        h: {
          type: "number",
          exclusiveMinimum: 0
        }
      }
    },
    end_card_scenes: {
      description: "The last this many scenes are the end card: timeline.end_card spans them to the end, so no caption is drawn over them. Drawn over a video, it replaces that video's end card. 0 adds none.",
      type: "integer",
      minimum: 0,
      maximum: 30
    },
    skip_blank: {
      description: "When no scene has on_screen text or a line, the step makes nothing (no video, no timeline) instead of a blank video; the kit then leaves out every reference to its outputs.",
      type: "boolean"
    },
    media: {
      description: "Extra pictures by id (a cast still, a screen), as kit.media [{id, url}].",
      type: "array",
      maxItems: 24,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "image"
        ],
        properties: {
          id: {
            type: "string",
            minLength: 1,
            maxLength: 64
          },
          image: {
            type: "object",
            "x-kit-file": {
              media: "image"
            }
          }
        }
      }
    },
    footage: {
      description: "plan.footage, for its windows only: kit.scenes[i].footage lists the scene's entries as {kind, start_s, end_s, crop, fit}. The files are never put in the page (a frame page cannot play video).",
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        properties: {
          scene_id: {
            type: [
              "string",
              "null"
            ],
            maxLength: 64
          },
          kind: {
            type: [
              "string",
              "null"
            ],
            maxLength: 32
          },
          start_ms: {
            type: [
              "number",
              "null"
            ],
            minimum: 0
          },
          end_ms: {
            type: [
              "number",
              "null"
            ],
            minimum: 0
          },
          crop: {
            description: "A source box [x0, y0, x1, y1] in 0..1 of the source, as plan.footage gives it.",
            anyOf: [
              {
                type: "null"
              },
              {
                type: "array",
                minItems: 4,
                maxItems: 4,
                items: {
                  type: "number",
                  minimum: 0,
                  maximum: 1
                }
              },
              {
                type: "object"
              }
            ]
          },
          fit: {
            type: [
              "string",
              "null"
            ],
            maxLength: 32
          },
          mask: {
            type: [
              "array",
              "null"
            ],
            maxItems: 8
          },
          file: {
            anyOf: [
              {
                type: "null"
              },
              {
                type: "object",
                "x-kit-file": {
                  media: "video"
                }
              },
              {
                type: "object",
                "x-kit-file": {
                  media: "image"
                }
              }
            ]
          }
        }
      }
    },
    facts: {
      description: "Measure every PNG, JPEG and WebP picture the page gets into kit.facts[url]: {alpha, plate, accent, luminance, width, height, subject {x, y, w, h, top_cx}} (sizes as 0..1 fractions). An SVG, GIF or AVIF picture gets no entry. Default false.",
      type: "boolean"
    }
  },
  allOf: [
    {
      anyOf: [
        {
          not: {
            required: [
              "under"
            ]
          }
        },
        {
          required: [
            "under_timeline"
          ]
        }
      ]
    },
    {
      anyOf: [
        {
          not: {
            required: [
              "under_timeline"
            ]
          }
        },
        {
          required: [
            "under"
          ]
        }
      ]
    },
    {
      anyOf: [
        {
          not: {
            required: [
              "tail_s"
            ]
          }
        },
        {
          required: [
            "speech"
          ]
        }
      ]
    }
  ]
};

// src/kit/maker/timing.ts
function countWords(text2) {
  if (!text2) return 0;
  return text2.split(/\s+/u).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}
function isBlankScene(scene) {
  return !scene.on_screen?.trim() && !scene.line?.trim();
}
function speechByScene(ids, speech) {
  const byScene = ids.map(() => []);
  if (speech.some((entry) => typeof entry.scene_id === "string")) {
    const index = new Map(ids.map((id, i) => [id, i]));
    for (const entry of speech) {
      if (typeof entry.scene_id !== "string") continue;
      const i = index.get(entry.scene_id);
      if (i === void 0) return `speech names scene "${entry.scene_id}", which is not one of the scenes`;
      byScene[i].push(entry);
    }
    return byScene;
  }
  if (speech.length !== ids.length) {
    return `speech has ${speech.length} entries without scene ids, so they cannot be paired with ${ids.length} scenes`;
  }
  speech.forEach((entry, i) => byScene[i].push(entry));
  return byScene;
}
function speechTimes(ids, speech, tailS) {
  for (const [k, entry] of speech.entries()) {
    if (entry.end_s < entry.start_s) return `speech entry ${k + 1} ends (${entry.end_s} s) before it starts (${entry.start_s} s)`;
  }
  const byScene = speechByScene(ids, speech);
  if (typeof byScene === "string") return byScene;
  const seconds = Math.max(...speech.map((entry) => entry.end_s)) + tailS;
  const first = byScene.map((entries) => entries.length ? Math.min(...entries.map((e) => e.start_s)) : null);
  const last = byScene.map((entries) => entries.length ? Math.max(...entries.map((e) => e.end_s)) : null);
  const starts = ids.map((_, i) => i === 0 ? 0 : first[i]);
  for (let a = 1; a < ids.length; a++) {
    if (starts[a] !== null) continue;
    let b = a;
    while (b + 1 < ids.length && starts[b + 1] === null) b++;
    const to = b + 1 < ids.length ? starts[b + 1] : seconds;
    const spoken = last.slice(0, a).filter((v) => v !== null);
    const from = Math.min(to, Math.max(starts[a - 1], ...spoken));
    const count = b - a + 1;
    for (let k = 0; k < count; k++) starts[a + k] = from + (to - from) * k / count;
    a = b;
  }
  return { starts, seconds };
}
function paceHolds(scenes, pace) {
  const min = pace.min_s ?? 0;
  const max = pace.max_s ?? Infinity;
  if (min > max) return `pace.min_s (${min}) is more than pace.max_s (${max})`;
  const holds = scenes.map((scene) => {
    const words = countWords(scene.on_screen) || countWords(scene.line);
    return Math.min(max, Math.max(min, pace.base_s + pace.per_word_s * words));
  });
  holds[holds.length - 1] = Math.max(holds[holds.length - 1], pace.last_min_s ?? 0);
  return holds;
}
function startsOfHolds(holds) {
  const starts = [];
  let at = 0;
  for (const hold of holds) {
    starts.push(at);
    at += hold;
  }
  return { starts, seconds: at };
}
function framesOfStarts(starts, fps, frameCount) {
  const frames = starts.map((s, i) => i === 0 ? 0 : Math.min(frameCount, Math.max(0, Math.round(s * fps))));
  frames.push(frameCount);
  for (let i = 0; i + 1 < frames.length; i++) if (frames[i + 1] <= frames[i]) return { empty: i };
  return frames;
}
function wordsByScene(speech, sceneFrames, fps) {
  const scenes = sceneFrames.length - 1;
  const out = Array.from({ length: scenes }, () => []);
  const words = speech.flatMap((entry) => entry.words ?? []).slice().sort((a, b) => a.start_s - b.start_s);
  for (const word of words) {
    const frame = Math.round(word.start_s * fps);
    let i = scenes - 1;
    while (i > 0 && frame < sceneFrames[i]) i--;
    out[i].push({ text: word.text, start_s: word.start_s, end_s: word.end_s });
  }
  return out;
}
function clipZone(zone, page) {
  const x0 = Math.max(0, zone.x);
  const y0 = Math.max(0, zone.y);
  const x1 = Math.min(page.width, zone.x + zone.w);
  const y1 = Math.min(page.height, zone.y + zone.h);
  if (x1 - x0 < 1 || y1 - y0 < 1) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
function zoneOnVideo(zone, scale, size) {
  const x0 = Math.max(0, Math.ceil(zone.x * scale - 1e-6));
  const y0 = Math.max(0, Math.ceil(zone.y * scale - 1e-6));
  const x1 = Math.min(size.width, Math.floor((zone.x + zone.w) * scale + 1e-6));
  const y1 = Math.min(size.height, Math.floor((zone.y + zone.h) * scale + 1e-6));
  if (x1 - x0 < 1 || y1 - y0 < 1) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// src/kit/maker/under.ts
import { readFile, rm } from "node:fs/promises";
import * as path from "node:path";
var QUIET_SAFE = { top: 0.15, bottom: 0.85, height: 0.15 };
var MEASURE_WIDTH = 96;
function numberOf(value) {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : void 0;
}
function rateOf(value) {
  if (typeof value !== "string") return null;
  const [a, b] = value.split("/").map(Number);
  const rate = b ? a / b : a;
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}
async function probeUnder(tools, file) {
  let parsed;
  try {
    const { stdout } = await tools.exec("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_type,width,height,duration,avg_frame_rate,r_frame_rate:format=duration",
      "-of",
      "json",
      file
    ]);
    parsed = JSON.parse(stdout);
  } catch {
    return null;
  }
  const streams = parsed.streams ?? [];
  const video = streams.find((s) => s.codec_type === "video");
  if (!video) return null;
  const width = numberOf(video.width);
  const height = numberOf(video.height);
  const seconds = numberOf(video.duration) ?? numberOf(parsed.format?.duration);
  if (!width || !height || !seconds || seconds <= 0) return null;
  return {
    seconds,
    width,
    height,
    fps: rateOf(video.avg_frame_rate) ?? rateOf(video.r_frame_rate),
    hasAudio: streams.some((s) => s.codec_type === "audio")
  };
}
function coverFit(from, to) {
  const scale = Math.max(to.width / from.width, to.height / from.height);
  return { scale, offsetX: (from.width * scale - to.width) / 2, offsetY: (from.height * scale - to.height) / 2 };
}
function coverFilter(size) {
  return `scale=${size.width}:${size.height}:force_original_aspect_ratio=increase:flags=bicubic,crop=${size.width}:${size.height},setsar=1`;
}
function quietBandOf(gray, width, height) {
  const rows = new Float64Array(height);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const v = gray[row + x];
      if (x + 1 < width) sum += Math.abs(gray[row + x + 1] - v);
      if (y + 1 < height) sum += Math.abs(gray[row + width + x] - v);
    }
    rows[y] = sum / width;
  }
  const band = Math.max(1, Math.round(QUIET_SAFE.height * height));
  const first = Math.ceil(QUIET_SAFE.top * height);
  const last = Math.max(first, Math.floor(QUIET_SAFE.bottom * height) - band);
  let best = first;
  let bestScore = Infinity;
  for (let y0 = first; y0 <= last; y0++) {
    let score = 0;
    for (let y = y0; y < y0 + band && y < height; y++) score += rows[y];
    if (score <= bestScore + 1e-9) {
      best = y0;
      bestScore = score;
    }
  }
  const round2 = (n) => Math.round(n * 1e4) / 1e4;
  return { y0: round2(best / height), y1: round2(Math.min(height, best + band) / height) };
}
async function quietBands(tools, file, info, times, dir, page) {
  const width = MEASURE_WIDTH;
  const height = Math.max(2, Math.round(page.height / page.width * width));
  const bands = [];
  for (let i = 0; i < times.length; i++) {
    const middle = Math.min(Math.max(0, (times[i].start_s + times[i].end_s) / 2), Math.max(0, info.seconds - 0.05));
    const out = path.join(dir, `quiet-${i}.gray`);
    await tools.exec("ffmpeg", [
      "-hide_banner",
      "-nostdin",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      middle.toFixed(3),
      "-i",
      file,
      "-frames:v",
      "1",
      "-an",
      "-vf",
      `${coverFilter({ width, height })},format=gray`,
      "-f",
      "rawvideo",
      "-pix_fmt",
      "gray",
      out
    ]);
    const gray = await readFile(out);
    await rm(out, { force: true });
    bands.push(gray.length >= width * height ? quietBandOf(gray, width, height) : { y0: 0.7, y1: 0.85 });
  }
  return bands;
}
function underIsShared(ids, timeline) {
  return timeline.scenes.length === 1 && ids.length > 1;
}
function underSceneFrames(ids, timeline, fps, frameCount) {
  if (underIsShared(ids, timeline)) {
    if (frameCount < ids.length) return null;
    const shared = ids.map((_, i) => Math.round(i * frameCount / ids.length));
    shared.push(frameCount);
    return shared;
  }
  const byId = new Map(timeline.scenes.map((s) => [s.id, s]));
  const matched = ids.map((id) => byId.get(id) ?? null);
  let spans;
  if (matched.every((s) => s)) spans = matched;
  else if (timeline.scenes.length === ids.length) spans = ids.map((id, i) => byId.get(id) ?? timeline.scenes[i]);
  else return null;
  const frames = spans.map((s) => Math.min(frameCount, Math.max(0, Math.round(s.start_s * fps))));
  for (let i = 1; i < frames.length; i++) if (frames[i] < frames[i - 1]) return null;
  frames.push(frameCount);
  return frames;
}
function alphaSegmentArgs(opts) {
  return [
    "-hide_banner",
    "-nostdin",
    "-loglevel",
    "error",
    "-y",
    "-framerate",
    String(opts.fps),
    "-start_number",
    String(opts.start),
    "-i",
    `${opts.framesDir}/${opts.framePattern}`,
    "-frames:v",
    String(opts.count),
    "-c:v",
    "png",
    "-pix_fmt",
    "rgba",
    "-fflags",
    "+bitexact",
    "-flags",
    "+bitexact",
    "-map_metadata",
    "-1",
    "-an",
    "-r",
    String(opts.fps),
    opts.out
  ];
}
function compositeArgs(opts) {
  const seconds = (opts.frames / opts.fps).toFixed(6);
  const graph = [
    `[0:v]setpts=PTS-STARTPTS,fps=${opts.fps},${coverFilter(opts.size)}[base]`,
    `[1:v]setpts=PTS-STARTPTS,format=rgba[page]`,
    `[base][page]overlay=0:0:format=auto:eof_action=pass:shortest=0,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]`
  ].join(";");
  return [
    "-hide_banner",
    "-nostdin",
    "-loglevel",
    "error",
    "-y",
    "-i",
    opts.under,
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    opts.list,
    "-filter_complex",
    graph,
    "-map",
    "[v]",
    ...opts.hasAudio ? ["-map", "0:a:0"] : [],
    "-frames:v",
    String(opts.frames),
    ...opts.tools.encodeArgs("h264-master"),
    ...MASTER_RATE_CAP,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-color_range",
    "tv",
    ...opts.hasAudio ? [...opts.tools.encodeArgs("aac"), "-t", seconds] : ["-an"],
    "-r",
    String(opts.fps),
    opts.out
  ];
}
function fitZone(zone, fit, size) {
  const x0 = Math.max(0, zone.x * fit.scale - fit.offsetX);
  const y0 = Math.max(0, zone.y * fit.scale - fit.offsetY);
  const x1 = Math.min(size.width, (zone.x + zone.w) * fit.scale - fit.offsetX);
  const y1 = Math.min(size.height, (zone.y + zone.h) * fit.scale - fit.offsetY);
  if (x1 - x0 < 1 || y1 - y0 < 1) return null;
  return { ...zone, x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
}
function linkedLengthTolerance(fps) {
  return Math.max(1e-3, Number.isFinite(fps) && fps > 0 ? 1 / fps : 0);
}
function passThroughTimeline(under, out, scenes) {
  const end = out.duration_s;
  if (under.assembly_timeline && Math.abs(end - under.duration_s) > linkedLengthTolerance(out.fps) + 1e-9) {
    throw new Error("Changing the source-linked picture length requires a revised assembly timeline; speech and source clocks cannot be silently clamped");
  }
  const cut = (items) => items.filter((item) => item.start_s < end).map((item) => item.end_s > end ? { ...item, end_s: end } : item);
  let speech = cut(under.speech);
  if (scenes?.length) {
    const sceneAt = (t) => scenes.find((s) => t < s.end_s) ?? scenes[scenes.length - 1];
    speech = speech.map((entry) => typeof entry.scene_id === "string" ? { ...entry, scene_id: sceneAt(entry.start_s).id } : entry);
  }
  const timeline = {
    duration_s: out.duration_s,
    width: out.width,
    height: out.height,
    fps: out.fps,
    scenes: cut((scenes ?? under.scenes).map((s) => ({ id: s.id, start_s: s.start_s, end_s: s.end_s }))),
    speech,
    ...under.assembly_timeline ? { assembly_timeline: under.assembly_timeline } : {}
    // A new export needs its own exact-byte review even when its source clocks are unchanged.
  };
  if (under.end_card && under.end_card.start_s < end) timeline.end_card = { start_s: under.end_card.start_s, end_s: Math.min(end, under.end_card.end_s) };
  const fit = coverFit({ width: under.width, height: under.height }, out);
  const zones = (under.safe_zones ?? []).map((z) => fitZone(z, fit, out)).filter((z) => !!z).slice(0, 8);
  if (zones.length) timeline.safe_zones = zones;
  return timeline;
}

// src/kit/maker/inputs.ts
var DESIGN_SIZE = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "16:9": { width: 1920, height: 1080 }
};
var SHORT_SIDES = [720, 1080];
var LIMITS = {
  scenes: 30,
  products: 12,
  frames: 200,
  fonts: 20,
  minSeconds: 0.5,
  maxSeconds: 180,
  maxFps: 60,
  maxWords: 200,
  textChars: 2e3
};
var LENGTH_SOURCES = ["duration_s", "scene_s", "pace", "speech", "under"];
function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function isFileRef2(value) {
  return isObject(value) && value.kind === "file" && typeof value.path === "string" && value.path.startsWith("/") && typeof value.sha256 === "string" && /^[a-f0-9]{64}$/.test(value.sha256) && typeof value.media === "string" && typeof value.mime === "string";
}
function fileOf(value, at, media, fail) {
  if (!isFileRef2(value)) fail(`${at} should be a file`);
  if (!media.includes(value.media)) fail(`${at} should be ${media.join(" or ")}, not ${value.media}`);
  return value;
}
function optionalText(value, at, fail) {
  if (value === void 0 || value === null) return null;
  if (typeof value !== "string") fail(`${at} should be text`);
  if (value.length > LIMITS.textChars) fail(`${at} is longer than ${LIMITS.textChars} characters`);
  return value;
}
function scenesOf(value, maxWords, fail) {
  if (!Array.isArray(value) || value.length === 0) fail("scenes should list at least one scene");
  if (value.length > LIMITS.scenes) fail(`scenes lists ${value.length} scenes; at most ${LIMITS.scenes} are allowed`);
  const ids = /* @__PURE__ */ new Set();
  return value.map((raw, index) => {
    const at = `scenes[${index}]`;
    if (!isObject(raw)) fail(`${at} should be an object`);
    const id = raw.id === void 0 || raw.id === null ? `scene-${index + 1}` : raw.id;
    if (typeof id !== "string" || id.length === 0 || id.length > 64) fail(`${at}.id should be text of 1 to 64 characters`);
    if (ids.has(id)) fail(`${at}.id "${id}" is used twice`);
    ids.add(id);
    const line = optionalText(raw.line, `${at}.line`, fail);
    const onScreen = optionalText(raw.on_screen, `${at}.on_screen`, fail);
    for (const [field, text2] of [["line", line], ["on_screen", onScreen]]) {
      const words = countWords(text2);
      if (words > maxWords) {
        fail(`scene ${index + 1} (${id}) has ${words} words in ${field}; this style allows ${maxWords} per scene`);
      }
    }
    let picture = null;
    if (isFileRef2(raw.picture)) picture = fileOf(raw.picture, `${at}.picture`, ["image"], fail);
    else picture = optionalText(raw.picture, `${at}.picture`, fail);
    const image = raw.image === void 0 || raw.image === null ? null : fileOf(raw.image, `${at}.image`, ["image"], fail);
    const speaker = optionalText(raw.speaker, `${at}.speaker`, fail);
    if (raw.extra !== void 0 && raw.extra !== null && !isObject(raw.extra)) fail(`${at}.extra should be an object`);
    const extra = isObject(raw.extra) ? raw.extra : null;
    return { id, index, line, on_screen: onScreen, picture, image, speaker, extra };
  });
}
function productsOf(value, fail) {
  if (value === void 0 || value === null) return [];
  if (!Array.isArray(value)) fail("products should be a list");
  if (value.length > LIMITS.products) fail(`products lists ${value.length}; at most ${LIMITS.products} are allowed`);
  return value.map((raw, i) => {
    const at = `products[${i}]`;
    if (!isObject(raw)) fail(`${at} should be an object`);
    if (typeof raw.id !== "string" || !raw.id) fail(`${at}.id should be text`);
    const name = optionalText(raw.name, `${at}.name`, fail) ?? "";
    const images = raw.images === void 0 || raw.images === null ? [] : raw.images;
    if (!Array.isArray(images) || images.length > 20) fail(`${at}.images should be a list of up to 20 images`);
    return { id: raw.id, name, images: images.map((img, j) => fileOf(img, `${at}.images[${j}]`, ["image"], fail)) };
  });
}
function brandOf(value, fail) {
  if (value === void 0 || value === null) return null;
  if (!isObject(value)) fail("brand should be an object");
  const name = optionalText(value.name, "brand.name", fail) ?? "";
  const logo = value.logo === void 0 || value.logo === null ? null : fileOf(value.logo, "brand.logo", ["image"], fail);
  const colors = {};
  if (value.colors !== void 0 && value.colors !== null) {
    if (!isObject(value.colors)) fail("brand.colors should be an object");
    for (const [key, color] of Object.entries(value.colors)) {
      if (color === null || color === void 0) continue;
      if (typeof color === "string" && color.length <= 64) colors[key] = color;
      else if (Array.isArray(color) && color.length <= 16 && color.every((c) => typeof c === "string" && c.length <= 64)) colors[key] = color;
      else fail(`brand.colors.${key} should be a colour or a list of colours`);
    }
  }
  const fonts = { heading: null, body: null };
  if (value.fonts !== void 0 && value.fonts !== null) {
    if (!isObject(value.fonts)) fail("brand.fonts should be an object");
    for (const slot of ["heading", "body"]) {
      const font = value.fonts[slot];
      if (font !== void 0 && font !== null) fonts[slot] = fileOf(font, `brand.fonts.${slot}`, ["font"], fail);
    }
  }
  let cta = null;
  if (value.cta !== void 0 && value.cta !== null) {
    if (!isObject(value.cta)) fail("brand.cta should be an object");
    const text2 = optionalText(value.cta.text, "brand.cta.text", fail);
    if (text2) cta = { text: text2, url: optionalText(value.cta.url, "brand.cta.url", fail) };
  }
  return { name, logo, colors, fonts, cta };
}
function mediaOf(value, fail) {
  if (value === void 0 || value === null) return [];
  if (!Array.isArray(value)) fail("media should be a list");
  const ids = /* @__PURE__ */ new Set();
  return value.map((raw, i) => {
    const at = `media[${i}]`;
    if (!isObject(raw)) fail(`${at} should be an object`);
    if (typeof raw.id !== "string" || !raw.id) fail(`${at}.id should be text`);
    if (ids.has(raw.id)) fail(`${at}.id "${raw.id}" is used twice`);
    ids.add(raw.id);
    return { id: raw.id, image: fileOf(raw.image, `${at}.image`, ["image"], fail) };
  });
}
function secondsOf(ms) {
  return typeof ms === "number" && Number.isFinite(ms) ? Math.round(ms) / 1e3 : null;
}
function footageOf(value, fail) {
  if (value === void 0 || value === null) return [];
  if (!Array.isArray(value)) fail("footage should be a list");
  return value.map((raw, index) => {
    const at = `footage[${index}]`;
    if (!isObject(raw)) fail(`${at} should be an object`);
    const start = secondsOf(raw.start_ms);
    const end = secondsOf(raw.end_ms);
    if (start !== null && end !== null && end < start) fail(`${at} ends before it starts`);
    return {
      index,
      scene_id: typeof raw.scene_id === "string" && raw.scene_id ? raw.scene_id : null,
      kind: typeof raw.kind === "string" && raw.kind ? raw.kind : "video",
      start_s: start,
      end_s: end,
      crop: raw.crop ?? null,
      fit: typeof raw.fit === "string" && raw.fit ? raw.fit : null
    };
  });
}
function readInputs(raw, ctx, measured = {}) {
  const fail = (detail) => {
    throw ctx.error("bad_input", detail);
  };
  if (!isObject(raw)) fail("inputs should be an object");
  const schemaProblems = schemaErrors(inputs, raw);
  if (schemaProblems.length) fail(schemaProblems.slice(0, 3).join("; "));
  const template = fileOf(raw.template, "template", ["html"], fail);
  const framesRaw = raw.frames ?? [];
  if (!Array.isArray(framesRaw) || framesRaw.length > LIMITS.frames) fail(`frames should be a list of up to ${LIMITS.frames} files`);
  const frames = framesRaw.map((f, i) => fileOf(f, `frames[${i}]`, ["html", "text", "json", "image"], fail));
  const fontsRaw = raw.fonts ?? [];
  if (!Array.isArray(fontsRaw) || fontsRaw.length > LIMITS.fonts) fail(`fonts should be a list of up to ${LIMITS.fonts} files`);
  const fonts = fontsRaw.map((f, i) => fileOf(f, `fonts[${i}]`, ["font"], fail));
  const maxWords = raw.max_words;
  if (typeof maxWords !== "number" || !Number.isInteger(maxWords) || maxWords < 1 || maxWords > LIMITS.maxWords) {
    fail(`max_words should be a whole number from 1 to ${LIMITS.maxWords}`);
  }
  const scenes = scenesOf(raw.scenes, maxWords, fail);
  const aspect = raw.aspect;
  if (typeof aspect !== "string" || !(aspect in DESIGN_SIZE)) fail(`aspect should be one of ${Object.keys(DESIGN_SIZE).join(", ")}`);
  const design = DESIGN_SIZE[aspect];
  const given = LENGTH_SOURCES.filter((key) => raw[key] !== void 0 && raw[key] !== null);
  if (given.length !== 1) fail("give exactly one of duration_s (the whole video), scene_s (each scene), pace, speech or under (a video to draw over)");
  const source = given[0];
  let under = null;
  if (source === "under") {
    const file = fileOf(raw.under, "under", ["video"], fail);
    if (!isObject(raw.under_timeline)) fail("under_timeline should be the timeline of the video to draw over");
    const timeline = raw.under_timeline;
    const info = measured.under === void 0 ? null : measured.under;
    if (measured.under === null) fail("the video to draw over could not be read");
    const seconds2 = info?.seconds ?? (typeof file.duration_s === "number" ? file.duration_s : timeline.duration_s);
    under = {
      file,
      timeline,
      info: info ?? { seconds: seconds2, width: timeline.width, height: timeline.height, fps: timeline.fps, hasAudio: false }
    };
  } else if (raw.under_timeline !== void 0 && raw.under_timeline !== null) fail("under_timeline is given without under");
  const underFps = under?.info.fps ? Math.min(LIMITS.maxFps, Math.max(1, Math.round(under.info.fps))) : null;
  const fps = raw.fps ?? underFps ?? 30;
  if (typeof fps !== "number" || !Number.isInteger(fps) || fps < 1 || fps > LIMITS.maxFps) fail(`fps should be a whole number from 1 to ${LIMITS.maxFps}`);
  const shortSide = raw.short_side ?? 1080;
  if (!SHORT_SIDES.includes(shortSide)) fail(`short_side should be ${SHORT_SIDES.join(" or ")}`);
  const scale = shortSide / 1080;
  const output = { width: Math.round(design.width * scale), height: Math.round(design.height * scale) };
  const speechIn = source === "speech" ? raw.speech : null;
  let timed = null;
  if (speechIn) {
    const times = speechTimes(scenes.map((scene) => scene.id), speechIn, typeof raw.tail_s === "number" ? raw.tail_s : 0);
    if (typeof times === "string") fail(times);
    timed = times;
  } else if (source === "pace") {
    const holds = paceHolds(scenes, raw.pace);
    if (typeof holds === "string") fail(holds);
    timed = startsOfHolds(holds);
  }
  const seconds = under ? under.info.seconds : timed ? timed.seconds : source === "duration_s" ? raw.duration_s : raw.scene_s * scenes.length;
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < LIMITS.minSeconds || seconds > LIMITS.maxSeconds) {
    fail(`the video would be ${String(seconds)} seconds; it must be ${LIMITS.minSeconds} to ${LIMITS.maxSeconds}`);
  }
  const frameCount = Math.round(seconds * fps);
  if (frameCount < scenes.length) fail(`${scenes.length} scenes need at least ${scenes.length} frames; the video has ${frameCount}`);
  let sceneFrames;
  if (timed) {
    const frames2 = framesOfStarts(timed.starts, fps, frameCount);
    if (!Array.isArray(frames2)) {
      const scene = scenes[frames2.empty];
      fail(
        `scene ${frames2.empty + 1} (${scene.id}) gets no time at ${fps} fps: ${source === "speech" ? "the speech gives it none (a scene with no speech needs a gap, or tail_s at the end)" : "its pace hold is too short"}`
      );
    }
    sceneFrames = frames2;
  } else if (under) {
    const fromUnder = underSceneFrames(scenes.map((scene) => scene.id), under.timeline, fps, frameCount);
    if (!fromUnder) {
      fail(`the plan's ${scenes.length} scenes do not match the ${under.timeline.scenes.length} scenes of the video to draw over (by id or in order)`);
    }
    sceneFrames = fromUnder;
  } else {
    sceneFrames = scenes.map((_, i) => Math.round(i * frameCount / scenes.length));
    sceneFrames.push(frameCount);
  }
  const values = raw.values ?? {};
  if (!isObject(values)) fail("values should be an object");
  if (Buffer.byteLength(JSON.stringify(values), "utf8") > 64 * 1024) fail("values is larger than 64 KB");
  let captionZone = null;
  if (raw.caption_zone !== void 0 && raw.caption_zone !== null) {
    captionZone = clipZone(raw.caption_zone, design);
    if (!captionZone) fail(`caption_zone lies outside the ${design.width}x${design.height} page`);
    if (!zoneOnVideo(captionZone, scale, output)) fail(`caption_zone is less than a pixel of the ${output.width}x${output.height} video`);
  }
  const endCardScenes = typeof raw.end_card_scenes === "number" ? raw.end_card_scenes : 0;
  if (endCardScenes > scenes.length) fail(`end_card_scenes is ${endCardScenes}, but there are only ${scenes.length} scenes`);
  const speech = speechIn ?? under?.timeline.speech ?? [];
  return {
    template,
    frames,
    fonts,
    scenes,
    products: productsOf(raw.products, fail),
    brand: brandOf(raw.brand, fail),
    aspect,
    fps,
    frameCount,
    sceneFrames,
    design,
    output,
    scale,
    values,
    under,
    speech,
    words: wordsByScene(speech, sceneFrames, fps),
    captionZone,
    endCardScenes,
    skip: raw.skip_blank === true && scenes.every(isBlankScene),
    media: mediaOf(raw.media, fail),
    footage: footageOf(raw.footage, fail),
    facts: raw.facts === true
  };
}

// src/kit/maker/page.ts
import { createHash } from "node:crypto";
import { mkdir, readFile as readFile3, stat, writeFile } from "node:fs/promises";
import * as path2 from "node:path";

// src/kit/maker/facts.ts
import { readFile as readFile2, rm as rm2 } from "node:fs/promises";
var FACTS_SIZE = 128;
var BORDER = Math.max(1, Math.round(3 / 96 * FACTS_SIZE));
var ORIENT = {
  1: [],
  2: ["hflip"],
  3: ["hflip", "vflip"],
  4: ["vflip"],
  5: ["transpose=0"],
  6: ["transpose=1"],
  7: ["transpose=3"],
  8: ["transpose=2"]
};
function hex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
var round = (value, places = 4) => Math.round(value * 10 ** places) / 10 ** places;
function pictureFacts(rgba, n, size) {
  const at = (x, y) => (y * n + x) * 4;
  let seeThrough = 0;
  let lumSum = 0;
  let lumCount = 0;
  const border = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = at(x, y);
      const a = rgba[i + 3];
      if (a < 200) seeThrough++;
      if (a >= 128) {
        lumSum += 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
        lumCount++;
      }
      if (x < BORDER || y < BORDER || x >= n - BORDER || y >= n - BORDER) border.push([rgba[i], rgba[i + 1], rgba[i + 2], a]);
    }
  }
  const alpha = seeThrough / (n * n) > 0.04;
  const opaque = border.filter((p) => p[3] >= 200);
  const avg = [0, 1, 2].map((k) => opaque.reduce((s, p) => s + p[k], 0) / Math.max(1, opaque.length));
  const spread = Math.max(...[0, 1, 2].map((k) => Math.sqrt(opaque.reduce((s, p) => s + (p[k] - avg[k]) ** 2, 0) / Math.max(1, opaque.length))));
  const even = !alpha && opaque.length > border.length * 0.9 && spread < 14;
  const plate = even ? hex(avg[0], avg[1], avg[2]) : null;
  const near = (i) => even && Math.abs(rgba[i] - avg[0]) + Math.abs(rgba[i + 1] - avg[1]) + Math.abs(rgba[i + 2] - avg[2]) < 40;
  const buckets = /* @__PURE__ */ new Map();
  for (let i = 0; i < rgba.length; i += 4) {
    const [r, g, b, a] = [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]];
    if (a < 200 || near(i)) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 238 && min > 225 || max < 22) continue;
    const key = r >> 5 << 6 | g >> 5 << 3 | b >> 5;
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }
  const top = [...buckets.entries()].sort((a, b) => b[1].n - a[1].n || a[0] - b[0])[0]?.[1];
  const accent = top && top.n >= n * n * 5e-3 ? hex(top.r / top.n, top.g / top.n, top.b / top.n) : null;
  return {
    alpha,
    plate,
    accent,
    luminance: round(lumCount ? lumSum / lumCount / 255 : 0, 3),
    width: size.width,
    height: size.height,
    subject: alpha || even ? subjectOf(rgba, n, alpha ? (i) => rgba[i + 3] >= 128 : (i) => rgba[i + 3] >= 128 && !near(i)) : null
  };
}
function subjectOf(rgba, n, inSubject) {
  const mask = new Uint8Array(n * n);
  for (let p = 0; p < n * n; p++) mask[p] = inSubject(p * 4) ? 1 : 0;
  const kept = (x, y) => {
    const p = y * n + x;
    if (!mask[p]) return false;
    return x > 0 && mask[p - 1] === 1 || x < n - 1 && mask[p + 1] === 1 || y > 0 && mask[p - n] === 1 || y < n - 1 && mask[p + n] === 1;
  };
  let [x0, y0, x1, y1] = [n, n, -1, -1];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!kept(x, y)) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  if (x1 < 0) return null;
  const half = y0 + Math.max(1, Math.ceil((y1 - y0 + 1) / 2));
  let [tx0, tx1] = [n, -1];
  for (let y = y0; y < half; y++) {
    for (let x = 0; x < n; x++) {
      if (!kept(x, y)) continue;
      tx0 = Math.min(tx0, x);
      tx1 = Math.max(tx1, x);
    }
  }
  return {
    x: round(x0 / n),
    y: round(y0 / n),
    w: round((x1 + 1 - x0) / n),
    h: round((y1 + 1 - y0) / n),
    top_cx: round(tx1 < 0 ? (x0 + x1 + 1) / 2 / n : (tx0 + tx1 + 1) / 2 / n)
  };
}
async function measurePicture(tools, data, shape, size, scratch) {
  const filters = [...ORIENT[shape.orientation], "format=rgba", `scale=${FACTS_SIZE}:${FACTS_SIZE}:flags=area`, "setsar=1", "format=rgba"];
  try {
    await tools.exec(
      "ffmpeg",
      ["-hide_banner", "-y", "-loglevel", "error", "-noautorotate", "-f", `${shape.format}_pipe`, "-i", "pipe:0", "-frames:v", "1", "-vf", filters.join(","), "-f", "rawvideo", "-pix_fmt", "rgba", "-threads", "1", scratch],
      { stdin: data }
    );
    const rgba = await readFile2(scratch);
    if (rgba.length !== FACTS_SIZE * FACTS_SIZE * 4) return null;
    return pictureFacts(rgba, FACTS_SIZE, size);
  } catch {
    return null;
  } finally {
    await rm2(scratch, { force: true }).catch(() => void 0);
  }
}

// src/kit/maker/runtime.ts
var PAGE_EPOCH_MS = 17672256e5;
var RUNTIME = String.raw`(function () {
  'use strict';
  var DATA = __KIT_DATA__;
  var EPOCH = __KIT_EPOCH__;
  var now = 0;
  var problems = [];
  var said = Object.create(null);
  function report(message) {
    message = String(message).slice(0, 400);
    if (said[message] || problems.length >= 40) return;
    said[message] = 1;
    problems.push(message);
  }
  function isLocal(url) {
    return /^(file|data|blob|about):/i.test(String(url));
  }
  function reach(url, how) {
    report('The frame page tries to reach ' + String(url).slice(0, 200) + ' (' + how + '). Frame pages may load only their own files.');
  }
  function define(target, name, value) {
    try { Object.defineProperty(target, name, { value: value, writable: true, configurable: true }); } catch (e) {}
  }
  function getter(target, name, get) {
    try { Object.defineProperty(target, name, { get: get, configurable: true }); } catch (e) {}
  }

  // The few natives the runtime itself needs, kept in this closure only.
  var nativeRaf = window.requestAnimationFrame.bind(window);
  var nativeSetTimeout = window.setTimeout.bind(window);
  var NativeChannel = window.MessageChannel;
  var nativeFetch = window.fetch.bind(window);
  var nativeAttachShadow = Element.prototype.attachShadow;
  var nativeEntries = Performance.prototype.getEntriesByType;
  var nativeMark = Performance.prototype.mark;
  var nativeMeasure = Performance.prototype.measure;

  // Randomness: one fixed seed, so a page that shuffles shuffles the same way every run.
  var seed = 0x2f6b3a1d;
  function random() {
    seed = (seed + 0x6d2b79f5) >>> 0;
    var t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  define(Math, 'random', random);
  if (window.Crypto) {
    define(Crypto.prototype, 'getRandomValues', function getRandomValues(array) {
      var bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(random() * 256);
      return array;
    });
    define(Crypto.prototype, 'randomUUID', function randomUUID() {
      var hex = '';
      for (var i = 0; i < 32; i++) hex += Math.floor(random() * 16).toString(16);
      return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-4' + hex.slice(13, 16) + '-' + '89ab'.charAt(Math.floor(random() * 4)) + hex.slice(17, 20) + '-' + hex.slice(20, 32);
    });
  }
  if (window.SubtleCrypto) {
    define(SubtleCrypto.prototype, 'generateKey', function generateKey() {
      report('The frame page makes a random key. Frame pages draw the same way every time.');
      return Promise.reject(new DOMException('generateKey is not available', 'NotSupportedError'));
    });
  }

  // Dates. The global Date becomes a stand-in that builds real dates at the
  // virtual time; the native constructor is reachable from nowhere else.
  var RealDate = Date;
  function virtualNow() { return EPOCH + now; }
  var KitDate = new Proxy(RealDate, {
    apply: function () { return new RealDate(EPOCH + now).toString(); },
    construct: function (target, args, newTarget) { return Reflect.construct(target, args.length ? args : [EPOCH + now], newTarget); }
  });
  define(RealDate, 'now', virtualNow);
  define(RealDate.prototype, 'constructor', KitDate);
  define(window, 'Date', KitDate);
  var formatOf = Object.getOwnPropertyDescriptor(Intl.DateTimeFormat.prototype, 'format');
  if (formatOf && formatOf.get) {
    var nativeFormat = formatOf.get;
    getter(Intl.DateTimeFormat.prototype, 'format', function () {
      var bound = nativeFormat.call(this);
      return function (date) { return bound(date === undefined ? EPOCH + now : date); };
    });
  }
  var nativeToParts = Intl.DateTimeFormat.prototype.formatToParts;
  define(Intl.DateTimeFormat.prototype, 'formatToParts', function formatToParts(date) {
    return nativeToParts.call(this, date === undefined ? EPOCH + now : date);
  });
  if (typeof Temporal === 'object' && Temporal && Temporal.Now) {
    var instant = function () { return Temporal.Instant.fromEpochMilliseconds(EPOCH + now); };
    var zoned = function (zone) { return instant().toZonedDateTimeISO(zone === undefined ? 'UTC' : zone); };
    var replacements = {
      instant: instant,
      timeZoneId: function () { return 'UTC'; },
      zonedDateTimeISO: zoned,
      plainDateTimeISO: function (zone) { return zoned(zone).toPlainDateTime(); },
      plainDateISO: function (zone) { return zoned(zone).toPlainDate(); },
      plainTimeISO: function (zone) { return zoned(zone).toPlainTime(); }
    };
    Object.getOwnPropertyNames(Temporal.Now).forEach(function (name) {
      if (typeof Temporal.Now[name] !== 'function') return;
      define(Temporal.Now, name, replacements[name] || function () { throw new Error('Temporal.Now.' + name + ' is not available'); });
    });
  }
  var nativeFile = window.File;
  if (typeof nativeFile === 'function') {
    var KitFile = new Proxy(nativeFile, {
      construct: function (target, args, newTarget) {
        var options = {};
        if (args[2]) Object.keys(args[2]).forEach(function (key) { options[key] = args[2][key]; });
        if (options.lastModified === undefined) options.lastModified = EPOCH + now;
        return Reflect.construct(target, [args[0], args[1], options], newTarget);
      }
    });
    define(nativeFile.prototype, 'constructor', KitFile);
    define(window, 'File', KitFile);
  }
  getter(Document.prototype, 'lastModified', function () { return '01/01/2026 00:00:00'; });

  // The performance clock and everything that carries its times.
  define(Performance.prototype, 'now', function now_() { return now; });
  getter(Performance.prototype, 'timeOrigin', function () { return EPOCH; });
  define(Performance.prototype, 'mark', function mark(name, options) {
    var copy = {};
    if (options) Object.keys(options).forEach(function (key) { copy[key] = options[key]; });
    if (copy.startTime === undefined) copy.startTime = now;
    return nativeMark.call(this, name, copy);
  });
  define(Performance.prototype, 'measure', function measure(name, start, end) {
    var options = {};
    if (start && typeof start === 'object') Object.keys(start).forEach(function (key) { options[key] = start[key]; });
    else {
      options.start = start === undefined ? 0 : start;
      if (end !== undefined) options.end = end;
    }
    if (options.end === undefined && options.duration === undefined) options.end = now;
    return nativeMeasure.call(this, name, options);
  });
  ['getEntries', 'getEntriesByType', 'getEntriesByName'].forEach(function (name) {
    define(Performance.prototype, name, function () { return []; });
  });
  define(Performance.prototype, 'toJSON', function toJSON() { return { timeOrigin: EPOCH }; });
  var fixedTiming = {};
  ['navigationStart', 'fetchStart', 'domainLookupStart', 'domainLookupEnd', 'connectStart', 'connectEnd', 'requestStart', 'responseStart', 'responseEnd', 'domLoading', 'domInteractive', 'domContentLoadedEventStart', 'domContentLoadedEventEnd', 'domComplete', 'loadEventStart', 'loadEventEnd'].forEach(function (key) { fixedTiming[key] = EPOCH; });
  Object.freeze(fixedTiming);
  getter(Performance.prototype, 'timing', function () { return fixedTiming; });
  var fixedMemory = Object.freeze({ jsHeapSizeLimit: 0, totalJSHeapSize: 0, usedJSHeapSize: 0 });
  getter(Performance.prototype, 'memory', function () { return fixedMemory; });
  if (window.PerformanceObserver) define(PerformanceObserver.prototype, 'observe', function observe() {});
  getter(Event.prototype, 'timeStamp', function () { return now; });
  if (window.AnimationTimeline) getter(AnimationTimeline.prototype, 'currentTime', function () { return now; });

  // Timers, frame callbacks and scheduled tasks run only when the maker moves the clock.
  var timers = new Map();
  var frameCallbacks = new Map();
  var nextId = 1;
  function addTimer(fn, ms, args, repeat) {
    if (typeof fn !== 'function') {
      report('The frame page gives a timer code as text; give it a function.');
      return 0;
    }
    var delay = Number(ms) || 0;
    if (delay < 0) delay = 0;
    var id = nextId++;
    timers.set(id, { id: id, at: now + delay, fn: fn, args: args, every: repeat ? Math.max(1, delay) : 0 });
    return id;
  }
  define(window, 'setTimeout', function setTimeout(fn, ms) { return addTimer(fn, ms, Array.prototype.slice.call(arguments, 2), false); });
  define(window, 'setInterval', function setInterval(fn, ms) { return addTimer(fn, ms, Array.prototype.slice.call(arguments, 2), true); });
  define(window, 'clearTimeout', function clearTimeout(id) { timers.delete(id); });
  define(window, 'clearInterval', function clearInterval(id) { timers.delete(id); });
  define(window, 'requestAnimationFrame', function requestAnimationFrame(fn) { var id = nextId++; frameCallbacks.set(id, fn); return id; });
  define(window, 'cancelAnimationFrame', function cancelAnimationFrame(id) { frameCallbacks.delete(id); });
  define(window, 'requestIdleCallback', function requestIdleCallback(fn) {
    return addTimer(function () { fn({ didTimeout: false, timeRemaining: function () { return 0; } }); }, 0, [], false);
  });
  define(window, 'cancelIdleCallback', function cancelIdleCallback(id) { timers.delete(id); });
  if (window.Scheduler && window.scheduler) {
    define(Scheduler.prototype, 'postTask', function postTask(callback, options) {
      return new Promise(function (resolve, reject) {
        addTimer(function () { try { resolve(callback()); } catch (e) { reject(e); } }, options && options.delay, [], false);
      });
    });
    define(Scheduler.prototype, 'yield', function yield_() { return Promise.resolve(); });
  }

  // What a frame page must not do: fetch, play video or sound.
  define(window, 'fetch', function fetch(input) {
    report('The frame page fetches ' + String(input && input.url ? input.url : input).slice(0, 200) + '. Frame pages get their data from the kit and load only their own files.');
    return Promise.reject(new TypeError('fetch is not available in frame pages'));
  });
  define(XMLHttpRequest.prototype, 'open', function open(method, url) {
    report('The frame page fetches ' + String(url).slice(0, 200) + '. Frame pages get their data from the kit and load only their own files.');
    throw new DOMException('XMLHttpRequest is not available in frame pages', 'NotSupportedError');
  });
  ['open', 'write', 'writeln'].forEach(function (name) {
    define(Document.prototype, name, function () {
      report('The frame page rewrites its document (document.' + name + '). Frame pages change the page they are on.');
      throw new DOMException('document.' + name + ' is not available in frame pages', 'NotSupportedError');
    });
  });
  define(Navigator.prototype, 'sendBeacon', function sendBeacon(url) { reach(url, 'beacon'); return false; });
  if (window.EventSource) define(window, 'EventSource', function EventSource(url) { reach(url, 'EventSource'); throw new DOMException('EventSource is not available', 'SecurityError'); });
  function noMedia() { report('The frame page plays video or sound. Frame pages show pictures and text only.'); }
  define(HTMLMediaElement.prototype, 'play', function play() {
    noMedia();
    return Promise.reject(new DOMException('Media is not available in frame pages', 'NotAllowedError'));
  });
  ['ScrollTimeline', 'ViewTimeline'].forEach(function (name) {
    if (window[name]) define(window, name, function () { report('The frame page uses a scroll timeline. Frame pages move with time only.'); throw new DOMException('Scroll timelines are not available in frame pages', 'NotSupportedError'); });
  });
  ['AudioContext', 'webkitAudioContext', 'OfflineAudioContext'].forEach(function (name) {
    if (window[name]) define(window, name, function () { noMedia(); throw new DOMException(name + ' is not available', 'NotSupportedError'); });
  });
  // Every tree the page draws in: the document and each shadow root, open,
  // closed (recorded when made) or declarative (found by walking).
  var roots = [document];
  var mediaWatch = new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var added = records[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var node = added[j];
        if (node.nodeType !== 1) continue;
        if (/^(VIDEO|AUDIO)$/.test(node.tagName) || node.querySelector('video, audio')) noMedia();
      }
    }
  });
  function addRoot(root) {
    if (roots.indexOf(root) >= 0) return;
    roots.push(root);
    mediaWatch.observe(root, { childList: true, subtree: true });
  }
  mediaWatch.observe(document, { childList: true, subtree: true });
  define(Element.prototype, 'attachShadow', function attachShadow(init) {
    var root = nativeAttachShadow.call(this, init);
    addRoot(root);
    return root;
  });
  function findRoots() {
    for (var r = 0; r < roots.length; r++) {
      var all = roots[r].querySelectorAll('*');
      for (var i = 0; i < all.length; i++) if (all[i].shadowRoot) addRoot(all[i].shadowRoot);
    }
    for (var k = 0; k < roots.length; k++) if (roots[k].querySelector('video, audio')) noMedia();
  }
  window.addEventListener('error', function (event) {
    var target = event.target;
    if (target && target !== window && target.tagName) {
      var url = target.currentSrc || target.src || target.href || '';
      if (url && !isLocal(url)) reach(url, target.tagName.toLowerCase());
      else report('The frame page could not load ' + String(url || target.tagName).slice(0, 200) + '. List every file the page uses in its frames.');
      return;
    }
    report('The frame page threw an error: ' + String(event.message || 'unknown').slice(0, 300));
  }, true);
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    report('The frame page threw an error: ' + String(reason && reason.message ? reason.message : reason).slice(0, 300));
  });
  var resourcesSeen = 0;
  function scanResources() {
    var list = nativeEntries.call(performance, 'resource');
    for (; resourcesSeen < list.length; resourcesSeen++) {
      var name = list[resourcesSeen].name;
      if (!isLocal(name)) reach(name, list[resourcesSeen].initiatorType || 'request');
    }
  }

  // Animations: every CSS or Web Animation is paused when it appears and set
  // to its age on the virtual clock. SVG animations follow the same clock.
  var born = new WeakMap();
  function syncAnimations() {
    var seen = new Set();
    for (var r = 0; r < roots.length; r++) {
      var list = roots[r].getAnimations ? roots[r].getAnimations() : [];
      for (var i = 0; i < list.length; i++) {
        var animation = list[i];
        if (seen.has(animation)) continue;
        seen.add(animation);
        if (animation.timeline && animation.timeline !== document.timeline) report('The frame page uses a scroll timeline. Frame pages move with time only.');
        if (!born.has(animation)) born.set(animation, now);
        // Paused every time: a page that calls play() never gets a moment on the computer's clock.
        try { if (animation.playState !== 'paused') animation.pause(); } catch (e) {}
        try { animation.currentTime = Math.max(0, now - born.get(animation)); } catch (e) {}
      }
      var svgs = roots[r].querySelectorAll('svg');
      for (var j = 0; j < svgs.length; j++) {
        var svg = svgs[j];
        if (svg.ownerSVGElement || typeof svg.pauseAnimations !== 'function') continue;
        try { svg.pauseAnimations(); svg.setCurrentTime(now / 1000); } catch (e) {}
      }
    }
  }

  function call(fn, args, what) {
    try { return fn.apply(window, args); } catch (e) {
      report('The frame page threw an error in ' + what + ': ' + String(e && e.message ? e.message : e).slice(0, 300));
      return undefined;
    }
  }

  function runTimers(until) {
    var runs = 0;
    for (;;) {
      var next = null;
      timers.forEach(function (timer) {
        if (timer.at <= until && (!next || timer.at < next.at || (timer.at === next.at && timer.id < next.id))) next = timer;
      });
      if (!next) return;
      if (++runs > 20000) {
        report('The frame page sets timers without end.');
        timers.clear();
        return;
      }
      if (next.at > now) now = next.at;
      if (next.every) next.at += next.every;
      else timers.delete(next.id);
      call(next.fn, next.args, 'a timer');
      syncAnimations();
    }
  }

  // Frame data for the page.
  var renderers = [];
  var waits = [];
  // 1.2.0 sound cues: marked before the page is ready, mixed by the maker at their frames.
  var SOUNDS = __KIT_SOUNDS__;
  var cues = [];
  var cuesClosed = false;
  function cue(name, at_s, options) {
    if (cuesClosed) {
      report('The frame page marks a sound cue after it got ready. Mark every cue before kit.ready settles.');
      return;
    }
    if (typeof name !== 'string' || SOUNDS.indexOf(name) < 0) {
      report('The frame page asks for the sound "' + String(name).slice(0, 40) + '"; the sounds are ' + SOUNDS.join(', ') + '.');
      return;
    }
    if (typeof at_s !== 'number' || !isFinite(at_s) || at_s < 0 || at_s >= DATA.duration_s) {
      report('The frame page marks a sound cue at ' + String(at_s).slice(0, 40) + ' s, outside the video (0 to ' + DATA.duration_s + ' s).');
      return;
    }
    var gain = 1;
    var max_s = null;
    if (options !== undefined && options !== null) {
      if (typeof options !== 'object') { report('The frame page gives sound cue options that are not an object.'); return; }
      if (options.gain !== undefined) {
        if (typeof options.gain !== 'number' || !isFinite(options.gain) || options.gain < 0 || options.gain > 4) { report('The frame page gives a sound cue a gain outside 0 to 4.'); return; }
        gain = options.gain;
      }
      if (options.max_s !== undefined && options.max_s !== null) {
        if (typeof options.max_s !== 'number' || !isFinite(options.max_s) || options.max_s <= 0 || options.max_s > 10) { report('The frame page gives a sound cue a max_s outside 0 to 10 seconds.'); return; }
        max_s = options.max_s;
      }
    }
    if (cues.length >= 500) { report('The frame page marks more than 500 sound cues.'); return; }
    cues.push({ sound: name, at_s: at_s, gain: gain, max_s: max_s });
  }
  function sceneAt(t) {
    var scenes = DATA.scenes;
    for (var i = scenes.length - 1; i >= 0; i--) {
      if (t >= scenes[i].start_s) {
        var length = scenes[i].end_s - scenes[i].start_s;
        return { index: i, scene: scenes[i], progress: length > 0 ? Math.min(1, (t - scenes[i].start_s) / length) : 1 };
      }
    }
    return { index: 0, scene: scenes[0], progress: 0 };
  }
  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.keys(value).forEach(function (key) { freeze(value[key]); });
      Object.freeze(value);
    }
    return value;
  }
  var kit = freeze({
    version: 1,
    aspect: DATA.aspect,
    width: DATA.width,
    height: DATA.height,
    fps: DATA.fps,
    frames: DATA.frames,
    duration_s: DATA.duration_s,
    scenes: DATA.scenes,
    products: DATA.products,
    brand: DATA.brand,
    fonts: DATA.fonts,
    values: DATA.values,
    // 1.2.0: the video drawn over (quiet bands), the voice track, extra pictures and picture facts.
    under: DATA.under || null,
    speech: DATA.speech || [],
    media: DATA.media || [],
    facts: DATA.facts || {},
    footage: DATA.footage || [],
    sceneAt: sceneAt,
    render: function (fn) { if (typeof fn === 'function') renderers.push(fn); },
    ready: function (promise) { waits.push(Promise.resolve(promise)); },
    cue: cue
  });
  window.kit = kit;

  // Lets the browser finish what the frame started (layout, fonts, pictures,
  // observers, queued tasks) before the maker takes the picture.
  function task() {
    return new Promise(function (resolve) {
      var channel = new NativeChannel();
      channel.port1.onmessage = function () { resolve(); };
      channel.port2.postMessage(0);
    });
  }
  async function settle() {
    // Reading the layout makes the browser start any font the new frame needs.
    if (document.body) void document.body.offsetHeight;
    try { await document.fonts.ready; } catch (e) {}
    var pending = [];
    var images = document.images;
    for (var i = 0; i < images.length; i++) {
      if (!images[i].complete) pending.push(images[i].decode().catch(function () {}));
    }
    if (pending.length) await Promise.all(pending);
    await task();
    await new Promise(function (resolve) { nativeRaf(function () { nativeRaf(resolve); }); });
    await new Promise(function (resolve) { nativeSetTimeout(resolve, 0); });
    await task();
  }

  // Pictures the page makes from data: and blob: URLs, in HTML, SVG or CSS.
  // Each is read once and handed to the maker, which refuses one that moves.
  var sourcesSeen = Object.create(null);
  var URL_IN_CSS = /url\(\s*(['"]?)((?:data|blob):[^'")]*)\1\s*\)/gi;
  function inlineSources() {
    var found = [];
    var add = function (url) {
      if (url && /^(data|blob):/i.test(url) && !sourcesSeen[url]) { sourcesSeen[url] = 1; found.push(url); }
    };
    var css = function (text) {
      var match;
      URL_IN_CSS.lastIndex = 0;
      while ((match = URL_IN_CSS.exec(text))) add(match[2]);
    };
    for (var r = 0; r < roots.length; r++) {
      var root = roots[r];
      // The picture each element really shows (its currentSrc), never the candidates in srcset.
      root.querySelectorAll('img, input[type=image]').forEach(function (el) { add(el.currentSrc || el.src); });
      root.querySelectorAll('image, feImage, use').forEach(function (el) { add(el.getAttribute('href') || el.getAttribute('xlink:href')); });
      root.querySelectorAll('[style]').forEach(function (el) { css(el.getAttribute('style') || ''); });
      var sheets = Array.prototype.slice.call(root.styleSheets || []).concat(Array.prototype.slice.call(root.adoptedStyleSheets || []));
      var read = [];
      var walk = function (sheet) {
        if (!sheet || read.indexOf(sheet) >= 0) return;
        read.push(sheet);
        var rules;
        try { rules = sheet.cssRules; } catch (e) { return; }
        for (var i = 0; i < rules.length; i++) {
          // An @import rule's text is only its own line; its rules live in its sheet.
          if (rules[i].styleSheet) walk(rules[i].styleSheet);
          else css(rules[i].cssText);
        }
      };
      sheets.forEach(walk);
    }
    return found;
  }
  function toBase64(bytes) {
    var text = '';
    for (var i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(text);
  }
  async function readSource(url) {
    try {
      // The browser decodes the URL as it would to draw it (base64 or percent-encoded bytes).
      var response = await nativeFetch(url);
      if (!response.ok) throw new Error('not readable');
      return toBase64(new Uint8Array(await response.arrayBuffer()));
    } catch (e) {
      report('The picture ' + url.slice(0, 80) + ' could not be read.');
      return null;
    }
  }
  // Where the brand's logo shows, in the page's CSS pixels: the largest visible picture of it, as drawn
  // inside its element (object-fit) and cut by whatever clips it, so the final check can look for the logo where it is.
  var LOGO = DATA.brand && DATA.brand.logo ? new URL(DATA.brand.logo, document.baseURI).href : null;
  function shownOpacity(el) {
    var opacity = 1;
    for (var node = el; node; node = node.parentNode || node.host) {
      if (node.nodeType !== 1) continue;
      var style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return 0;
      opacity *= Number(style.opacity);
    }
    return opacity;
  }
  // object-position along one axis: a percentage of the free room, else a length from the start.
  function fitOffset(value, free) {
    var text = String(value || '50%');
    var number = parseFloat(text);
    if (!isFinite(number)) return free / 2;
    return /%$/.test(text) ? (number / 100) * free : number;
  }
  function length(value) {
    var number = parseFloat(value);
    return isFinite(number) ? number : 0;
  }
  // The element's box in viewport pixels, inside its borders and, with padding, inside its padding too.
  // A transform scales the insets with the element; a rotated one leaves the box as its bounding rect.
  function innerBox(el, style, padding) {
    var rect = el.getBoundingClientRect();
    var kx = el.offsetWidth > 0 ? rect.width / el.offsetWidth : 1;
    var ky = el.offsetHeight > 0 ? rect.height / el.offsetHeight : 1;
    var p = padding ? 1 : 0;
    return {
      x0: rect.left + (length(style.borderLeftWidth) + p * length(style.paddingLeft)) * kx,
      y0: rect.top + (length(style.borderTopWidth) + p * length(style.paddingTop)) * ky,
      x1: rect.right - (length(style.borderRightWidth) + p * length(style.paddingRight)) * kx,
      y1: rect.bottom - (length(style.borderBottomWidth) + p * length(style.paddingBottom)) * ky,
      kx: kx,
      ky: ky
    };
  }
  function cut(box, clip, x, y) {
    if (x) { box.x0 = Math.max(box.x0, clip.x0); box.x1 = Math.min(box.x1, clip.x1); }
    if (y) { box.y0 = Math.max(box.y0, clip.y0); box.y1 = Math.min(box.y1, clip.y1); }
  }
  function area(box) {
    return Math.max(0, box.x1 - box.x0) * Math.max(0, box.y1 - box.y0);
  }
  function clips(value) {
    return value !== 'visible';
  }
  // An element a fixed-position box is laid out in rather than the viewport.
  function holdsFixed(style) {
    return style.transform !== 'none' || style.perspective !== 'none' || style.filter !== 'none' ||
      (style.backdropFilter && style.backdropFilter !== 'none') || /paint|layout|strict|content/.test(style.contain || '') ||
      /transform|perspective|filter/.test(style.willChange || '');
  }
  function flatParent(node) {
    if (node.assignedSlot) return node.assignedSlot;
    var parent = node.parentNode;
    return parent && parent.nodeType === 11 ? parent.host || null : parent;
  }
  // Cuts the box by every ancestor that clips its overflow (border-radius ignored). An absolutely or fixed
  // positioned box escapes the clips of ancestors outside its containing block, so those are skipped.
  function cutByAncestors(el, box) {
    var html = document.documentElement;
    var body = document.body;
    // The root's (or else body's) overflow belongs to the viewport, which cuts the box anyway.
    var bodyPropagates = !clips(getComputedStyle(html).overflowX) && !clips(getComputedStyle(html).overflowY);
    var escape = getComputedStyle(el).position;
    for (var node = flatParent(el); node; node = flatParent(node)) {
      if (node.nodeType !== 1) continue;
      var style = getComputedStyle(node);
      if (escape === 'absolute' || escape === 'fixed') {
        var holds = escape === 'fixed' ? holdsFixed(style) : style.position !== 'static' || holdsFixed(style);
        if (!holds) continue;
      }
      escape = style.position;
      if (node === html || (node === body && bodyPropagates) || style.display === 'contents') continue;
      var x = clips(style.overflowX);
      var y = clips(style.overflowY);
      if (/paint|strict|content/.test(style.contain || '')) x = y = true;
      if (x || y) cut(box, innerBox(node, style, false), x, y);
    }
  }
  function logoBox() {
    if (!LOGO) return null;
    var best = null;
    for (var r = 0; r < roots.length; r++) {
      var images = roots[r].querySelectorAll('img');
      for (var i = 0; i < images.length; i++) {
        var img = images[i];
        if ((img.currentSrc || img.src) !== LOGO || shownOpacity(img) < 0.5) continue;
        var style = getComputedStyle(img);
        var content = innerBox(img, style, true);
        // The content box in the element's own pixels, where object-fit places the picture.
        var w = (content.x1 - content.x0) / content.kx;
        var h = (content.y1 - content.y0) / content.ky;
        if (!(w > 0 && h > 0)) continue;
        var drawn = { x0: content.x0, y0: content.y0, x1: content.x1, y1: content.y1 };
        var nw = img.naturalWidth;
        var nh = img.naturalHeight;
        var fit = style.objectFit;
        if (nw > 0 && nh > 0 && fit && fit !== 'fill') {
          var s = fit === 'contain' ? Math.min(w / nw, h / nh) : fit === 'cover' ? Math.max(w / nw, h / nh) : fit === 'none' ? 1 : Math.min(1, w / nw, h / nh);
          var position = String(style.objectPosition || '50% 50%').split(/\s+/);
          drawn.x0 = content.x0 + fitOffset(position[0], w - nw * s) * content.kx;
          drawn.y0 = content.y0 + fitOffset(position[1], h - nh * s) * content.ky;
          drawn.x1 = drawn.x0 + nw * s * content.kx;
          drawn.y1 = drawn.y0 + nh * s * content.ky;
        }
        // A picture is cut to its content box (cover crops it there) unless the page lets it overflow.
        cut(drawn, content, clips(style.overflowX), clips(style.overflowY));
        var whole = area(drawn);
        if (!(whole > 0)) continue;
        var seen = { x0: drawn.x0, y0: drawn.y0, x1: drawn.x1, y1: drawn.y1 };
        cutByAncestors(img, seen);
        cut(seen, { x0: 0, y0: 0, x1: innerWidth, y1: innerHeight }, true, true);
        // Only a picture at least half visible counts.
        var shown = area(seen);
        if (shown < whole * 0.5 || (best && shown <= best.area)) continue;
        best = { area: shown, x: seen.x0, y: seen.y0, w: seen.x1 - seen.x0, h: seen.y1 - seen.y0 };
      }
    }
    return best ? { x: best.x, y: best.y, w: best.w, h: best.h } : null;
  }
  async function take() {
    scanResources();
    var sources = [];
    var urls = inlineSources();
    for (var i = 0; i < urls.length; i++) {
      var data = await readSource(urls[i]);
      if (data !== null) sources.push({ url: urls[i].slice(0, 120), data: data });
    }
    var out = problems.slice();
    problems.length = 0;
    return { problems: out, sources: sources, logo: logoBox() };
  }

  var driver = {
    start: async function () {
      if (document.readyState !== 'complete') {
        await new Promise(function (resolve) { window.addEventListener('load', resolve, { once: true }); });
      }
      try { await Promise.all(waits); } catch (e) { report('The frame page did not get ready: ' + String(e && e.message ? e.message : e).slice(0, 300)); }
      // Load every font and picture up front, so no frame is drawn while one is still loading.
      var faces = [];
      document.fonts.forEach(function (face) { faces.push(face); });
      await Promise.all(faces.map(function (face) { return face.load().catch(function () {}); }));
      faces.forEach(function (face) {
        if (face.status === 'error') report('The font "' + face.family + '" could not be read.');
      });
      await Promise.all(DATA.preload.map(function (url) {
        var image = new Image();
        image.src = url;
        return image.decode().catch(function () { report('The picture ' + url + ' could not be read.'); });
      }));
      findRoots();
      syncAnimations();
      await settle();
      syncAnimations();
      // Cues are a pure function of the page's data: none may be marked once it is ready.
      cuesClosed = true;
      var started = await take();
      started.cues = cues.slice();
      return started;
    },
    frame: async function (index) {
      findRoots();
      var target = (index * 1000) / DATA.fps;
      runTimers(target);
      now = target;
      var callbacks = Array.from(frameCallbacks.values());
      frameCallbacks.clear();
      for (var i = 0; i < callbacks.length; i++) call(callbacks[i], [now], 'a frame callback');
      syncAnimations();
      var t = target / 1000;
      try {
        if (renderers.length) {
          for (var r = 0; r < renderers.length; r++) await renderers[r](t, { index: index, scene: sceneAt(t) });
        } else if (typeof window.renderAt === 'function') {
          await window.renderAt(t);
        } else if (typeof window.__renderAt === 'function') {
          await window.__renderAt(t);
        } else if (typeof window.seek === 'function') {
          await window.seek(target);
        }
      } catch (e) {
        report('The frame page threw an error while drawing: ' + String(e && e.message ? e.message : e).slice(0, 300));
      }
      findRoots();
      syncAnimations();
      await settle();
      // Anything the page did while the browser settled is set back to the frame's time.
      syncAnimations();
      return take();
    },
    finish: async function () {
      await settle();
      findRoots();
      return take();
    }
  };
  Object.defineProperty(window, '__kitDriver', { value: Object.freeze(driver), writable: false, configurable: false });
})();`;
function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").split(String.fromCharCode(8232)).join("\\u2028").split(String.fromCharCode(8233)).join("\\u2029");
}
function runtimeScript(data) {
  return RUNTIME.replace("__KIT_DATA__", () => scriptJson(data)).replace("__KIT_EPOCH__", String(PAGE_EPOCH_MS)).replace("__KIT_SOUNDS__", () => scriptJson(CUE_SOUNDS));
}

// src/kit/maker/page.ts
var KIT_FOLDER = "_kit";
var MAX_PICTURE_PX = 2048;
var RESIZABLE = /* @__PURE__ */ new Set(["image/png", "image/webp", "image/jpeg"]);
var ORIENT2 = {
  1: [],
  2: ["hflip"],
  3: ["hflip", "vflip"],
  4: ["vflip"],
  5: ["transpose=0"],
  6: ["transpose=1"],
  7: ["transpose=3"],
  8: ["transpose=2"]
};
var IMAGE_EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg"
};
var FONT_FORMAT = {
  ttf: { ext: "ttf", format: "truetype" },
  otf: { ext: "otf", format: "opentype" },
  woff: { ext: "woff", format: "woff" },
  woff2: { ext: "woff2", format: "woff2" }
};
var COLOR = /^(#[0-9a-fA-F]{3,8}|(rgb|rgba|hsl|hsla)\([0-9.,%\s/]+\))$/;
async function readChecked(ref, fail) {
  let data;
  try {
    data = await readFile3(ref.path);
  } catch {
    return fail(`the file ${path2.basename(ref.path)} could not be read`);
  }
  const sha = createHash("sha256").update(data).digest("hex");
  if (sha !== ref.sha256) fail(`the file ${path2.basename(ref.path)} changed after it was checked`);
  return data;
}
function commonFolder(files) {
  let common = path2.dirname(files[0]);
  for (const file of files.slice(1)) {
    while (path2.relative(common, file).startsWith("..")) {
      const up = path2.dirname(common);
      if (up === common) break;
      common = up;
    }
  }
  return common;
}
function fontOf(ref, fail) {
  const fromMime = ref.mime.startsWith("font/") ? ref.mime.slice(5) : "";
  const fromName = path2.extname(ref.path).slice(1).toLowerCase();
  const kind = FONT_FORMAT[fromMime] ?? FONT_FORMAT[fromName];
  if (!kind) fail(`the font ${path2.basename(ref.path)} is not ttf, otf, woff or woff2`);
  return kind;
}
function familyOf(ref) {
  return path2.basename(ref.path, path2.extname(ref.path)).replace(/[^A-Za-z0-9 _-]/g, "-");
}
function loadedSize(shape, capped) {
  const turned = shape.orientation >= 5;
  const [width, height] = turned ? [shape.height, shape.width] : [shape.width, shape.height];
  if (!capped || Math.max(width, height) <= MAX_PICTURE_PX) return { width, height };
  const k = MAX_PICTURE_PX / Math.max(width, height);
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}
function injectFirst(html, head) {
  const text2 = html.replace(/^\uFEFF/, "");
  const doctype = /^\s*<!doctype[^>]*>/i.exec(text2);
  if (doctype) return doctype[0] + head + text2.slice(doctype[0].length);
  return "<!doctype html>" + head + text2;
}
function cssString(value) {
  return JSON.stringify(value);
}
async function buildPage(spec, dir, ctx, reserve = () => void 0) {
  const fail = (detail) => {
    throw ctx.error("bad_input", detail);
  };
  await mkdir(path2.join(dir, KIT_FOLDER, "fonts"), { recursive: true });
  await mkdir(path2.join(dir, KIT_FOLDER, "media"), { recursive: true });
  let bytes = 0;
  const put = async (target, data2) => {
    const size = Buffer.byteLength(data2);
    reserve(size);
    await writeFile(target, data2);
    bytes += size;
  };
  const still = (ref, data2) => {
    if (isAnimatedImage(data2)) fail(`the picture ${path2.basename(ref.path)} moves on its own; frame pages take still pictures and draw any motion themselves`);
  };
  const openTrees = (ref, data2) => {
    if (/\bshadowroot(mode)?\s*=\s*["']?closed/i.test(data2.toString("utf8"))) {
      fail(`the frame ${path2.basename(ref.path)} declares a closed shadow root; use an open one`);
    }
  };
  const pageFiles = [spec.template, ...spec.frames];
  const base = commonFolder(pageFiles.map((f) => f.path));
  const entry = path2.join(dir, path2.relative(base, spec.template.path));
  const url = (relFromDir) => path2.relative(path2.dirname(entry), path2.join(dir, ...relFromDir.split("/"))).split(path2.sep).join("/");
  const placed = /* @__PURE__ */ new Map();
  const preload = [];
  const facts = {};
  const measure = async (pageUrl, data2, capped) => {
    if (!spec.facts || !ctx.tools || facts[pageUrl]) return;
    const shape = pictureGeometry(data2);
    if (!shape) return;
    const got = await measurePicture(ctx.tools, data2, shape, loadedSize(shape, capped), path2.join(dir, KIT_FOLDER, "facts.rgba"));
    if (got) facts[pageUrl] = got;
    else ctx.log.warn("a picture could not be measured for the page", { file: pageUrl });
  };
  const staging = /* @__PURE__ */ new Map();
  for (const ref of pageFiles) {
    const rel = path2.relative(base, ref.path).split(path2.sep).join("/");
    if (rel.split("/")[0] === KIT_FOLDER) fail(`the frame ${rel} uses the folder name ${KIT_FOLDER}, which the kit keeps for itself`);
    const known = placed.get(rel);
    if (known !== void 0) {
      if (known !== ref.sha256) fail(`two different frames are both called ${rel}`);
      continue;
    }
    placed.set(rel, ref.sha256);
    const data2 = await readChecked(ref, fail);
    if (ref.media === "html") openTrees(ref, data2);
    if (ref.mime === "text/css" || /\.css$/i.test(ref.path)) {
      for (const inline of cssDataUrls(data2.toString("utf8"))) {
        if (isAnimatedImage(inline.bytes)) fail(`the stylesheet ${rel} names a picture that moves on its own; frame pages take still pictures and draw any motion themselves`);
      }
    }
    const target = path2.join(dir, ...rel.split("/"));
    await mkdir(path2.dirname(target), { recursive: true });
    if (ref === spec.template) continue;
    if (ref.media === "image") still(ref, data2);
    await put(target, data2);
    if (ref.media === "image") {
      preload.push(url(rel));
      await measure(url(rel), data2, false);
    }
  }
  const faces = [];
  const families = [];
  const addFont = async (ref, family) => {
    if (families.includes(family)) fail(`two fonts are both called ${family}`);
    const kind = fontOf(ref, fail);
    const name = `${ref.sha256.slice(0, 16)}.${kind.ext}`;
    await put(path2.join(dir, KIT_FOLDER, "fonts", name), await readChecked(ref, fail));
    faces.push(`@font-face{font-family:${cssString(family)};src:url(${cssString(url(`${KIT_FOLDER}/fonts/${name}`))}) format(${cssString(kind.format)});font-display:block;}`);
    families.push(family);
  };
  for (const font of spec.fonts) await addFont(font, familyOf(font));
  if (spec.brand?.fonts.heading) await addFont(spec.brand.fonts.heading, "brand-heading");
  if (spec.brand?.fonts.body) await addFont(spec.brand.fonts.body, "brand-body");
  const smaller = async (ref, data2) => {
    const shape = pictureGeometry(data2);
    if (!shape || !ctx.tools) return null;
    const turned = shape.orientation >= 5;
    const [width, height] = turned ? [shape.height, shape.width] : [shape.width, shape.height];
    if (Math.max(width, height) <= MAX_PICTURE_PX) return null;
    const k = MAX_PICTURE_PX / Math.max(width, height);
    const [w, h] = [Math.max(1, Math.round(width * k)), Math.max(1, Math.round(height * k))];
    const to = shape.format === "jpeg" ? "jpg" : "png";
    const rel = `${KIT_FOLDER}/media/${ref.sha256.slice(0, 16)}-${MAX_PICTURE_PX}.${to}`;
    const target = path2.join(dir, ...rel.split("/"));
    const filters = [...ORIENT2[shape.orientation], `scale=${w}:${h}:flags=lanczos`, "setsar=1", ...to === "png" ? ["format=rgba"] : []];
    const quality = to === "jpg" ? ["-q:v", "2"] : [];
    const exact = ["-fflags", "+bitexact", "-flags", "+bitexact", "-map_metadata", "-1", "-threads", "1"];
    try {
      await ctx.tools.exec(
        "ffmpeg",
        ["-hide_banner", "-y", "-loglevel", "error", "-noautorotate", "-f", `${shape.format}_pipe`, "-i", "pipe:0", "-frames:v", "1", "-vf", filters.join(","), ...quality, ...exact, target],
        { stdin: data2 }
      );
    } catch (error) {
      ctx.log.warn("a picture could not be scaled down for the page", {
        file: path2.basename(ref.path),
        size: `${width}x${height}`,
        error: String(error?.stderr ?? error?.message ?? error).slice(-300)
      });
      return fail(`a ${width}x${height} picture could not be made smaller for the video; use a PNG or JPEG at most ${MAX_PICTURE_PX} px on its long side`);
    }
    return rel;
  };
  const media = async (ref) => {
    const ext = IMAGE_EXT[ref.mime];
    if (!ext) fail(`the picture ${path2.basename(ref.path)} is not png, jpg, webp, gif, avif or svg`);
    let rel = `${KIT_FOLDER}/media/${ref.sha256.slice(0, 16)}.${ext}`;
    const staged = staging.get(ref.sha256);
    if (staged) return staged;
    const data2 = await readChecked(ref, fail);
    still(ref, data2);
    const resized = RESIZABLE.has(ref.mime) ? await smaller(ref, data2) : null;
    if (resized) {
      rel = resized;
      const size = (await stat(path2.join(dir, ...rel.split("/")))).size;
      reserve(size);
      bytes += size;
    } else await put(path2.join(dir, ...rel.split("/")), data2);
    preload.push(url(rel));
    staging.set(ref.sha256, url(rel));
    await measure(url(rel), data2, RESIZABLE.has(ref.mime));
    return url(rel);
  };
  const products = [];
  for (const product of spec.products) {
    const images = [];
    for (const image of product.images) images.push(await media(image));
    products.push({ id: product.id, name: product.name, images });
  }
  const extraMedia = [];
  for (const item of spec.media) extraMedia.push({ id: item.id, url: await media(item.image) });
  const footage = spec.footage.map((f) => ({ scene_id: f.scene_id, kind: f.kind, start_s: f.start_s, end_s: f.end_s, crop: f.crop, fit: f.fit }));
  const scenes = [];
  for (const scene of spec.scenes) {
    const picture = scene.picture && typeof scene.picture === "object" ? await media(scene.picture) : scene.picture;
    const image = scene.image ? await media(scene.image) : null;
    scenes.push({
      id: scene.id,
      index: scene.index,
      line: scene.line,
      on_screen: scene.on_screen,
      picture,
      image,
      speaker: scene.speaker,
      extra: scene.extra,
      words: spec.words[scene.index] ?? [],
      footage: footage.filter((f) => f.scene_id === scene.id),
      start_s: spec.sceneFrames[scene.index] / spec.fps,
      end_s: spec.sceneFrames[scene.index + 1] / spec.fps
    });
  }
  const brand = spec.brand ? {
    name: spec.brand.name,
    colors: spec.brand.colors,
    logo: spec.brand.logo ? await media(spec.brand.logo) : null,
    fonts: { heading: spec.brand.fonts.heading ? "brand-heading" : null, body: spec.brand.fonts.body ? "brand-body" : null },
    cta: spec.brand.cta
  } : null;
  const variables = [`--kit-width:${spec.design.width}px`, `--kit-height:${spec.design.height}px`];
  for (const [key, value] of Object.entries(spec.brand?.colors ?? {})) {
    if (typeof value === "string" && /^[a-z0-9_]+$/i.test(key) && COLOR.test(value.trim())) {
      variables.push(`--brand-${key.replace(/_/g, "-")}:${value.trim()}`);
    }
  }
  const data = {
    aspect: spec.aspect,
    width: spec.design.width,
    height: spec.design.height,
    fps: spec.fps,
    frames: spec.frameCount,
    duration_s: spec.frameCount / spec.fps,
    scenes,
    products,
    brand,
    fonts: families,
    values: spec.values,
    speech: spec.speech,
    under: spec.under ? { duration_s: spec.frameCount / spec.fps, has_audio: spec.under.info.hasAudio, quiet_band: spec.under.quietBands ?? [] } : null,
    media: extraMedia,
    facts,
    footage,
    preload
  };
  const head = `<meta charset="utf-8"><style id="kit-fonts">${faces.join("")}:root{${variables.join(";")}}</style><script>${runtimeScript(data)}</script>`;
  const template = (await readChecked(spec.template, fail)).toString("utf8");
  await put(entry, injectFirst(template, head));
  return { entry, families, bytes };
}

// src/kit/maker/make.ts
var FRAME_TIMEOUT_MS = 6e4;
function timelineOf(spec, logo) {
  const size = { duration_s: spec.frameCount / spec.fps, width: spec.output.width, height: spec.output.height, fps: spec.fps };
  const scenes = spec.scenes.map((scene) => ({
    id: scene.id,
    start_s: spec.sceneFrames[scene.index] / spec.fps,
    end_s: spec.sceneFrames[scene.index + 1] / spec.fps
  }));
  const shared = spec.under && underIsShared(spec.scenes.map((scene) => scene.id), spec.under.timeline);
  const timeline = spec.under ? passThroughTimeline(spec.under.timeline, size, shared ? scenes : void 0) : { ...size, scenes, speech: spec.speech };
  if (spec.endCardScenes > 0) {
    timeline.end_card = { start_s: spec.sceneFrames[spec.scenes.length - spec.endCardScenes] / spec.fps, end_s: size.duration_s };
  }
  const zones = [];
  if (logo) {
    const k = spec.scale;
    const x0 = Math.max(0, Math.floor(logo.x * k));
    const y0 = Math.max(0, Math.floor(logo.y * k));
    const x1 = Math.min(spec.output.width, Math.ceil((logo.x + logo.w) * k));
    const y1 = Math.min(spec.output.height, Math.ceil((logo.y + logo.h) * k));
    if (x1 - x0 >= 4 && y1 - y0 >= 4) zones.push({ use: "logo", x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }
  const captions = spec.captionZone ? zoneOnVideo(spec.captionZone, spec.scale, spec.output) : null;
  if (captions) zones.push({ use: "captions", ...captions });
  const carried = (timeline.safe_zones ?? []).filter((zone) => !spec.captionZone || zone.use !== "captions");
  const all = [...zones, ...carried].slice(0, 8);
  if (all.length) timeline.safe_zones = all;
  else delete timeline.safe_zones;
  return timeline;
}
async function withTimeout(work, ms, onTimeout) {
  let timer;
  try {
    return await Promise.race([
      work,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(onTimeout()), ms);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function reportOf(value) {
  const raw = value ?? {};
  const problems = Array.isArray(raw.problems) ? raw.problems.filter((v) => typeof v === "string") : [];
  const sources = Array.isArray(raw.sources) ? raw.sources.filter((v) => !!v && typeof v.url === "string" && typeof v.data === "string") : [];
  const box = raw.logo;
  const logo = box && [box.x, box.y, box.w, box.h].every((v) => typeof v === "number" && Number.isFinite(v)) && box.w > 0 && box.h > 0 ? box : null;
  return { problems, sources, logo };
}
function pngBound(width, height) {
  const raw = (width * 4 + 1) * height;
  return raw + Math.ceil(raw / 16e3) * 5 + 64 * 1024;
}
var FS_MARGIN = 4 * 1024 * 1024;
var DISK_LIMIT_MB = 1024;
function pageError(error) {
  const shape = error;
  if (!shape || shape.code !== "bad_input" && shape.code !== "tool_failed") return null;
  return { code: shape.code, detail: String(shape.detail ?? shape.message ?? "") };
}
function pageSoundRefusal(pageCues, underAssembly) {
  const segments = underAssembly && typeof underAssembly === "object" ? underAssembly.segments : void 0;
  const sourceLinked = Array.isArray(segments) && segments.length > 0;
  if (!pageCues || !sourceLinked) return null;
  return "Page sound cues would change a source-linked soundtrack. Remove kit.cue from the page and add the sound through the sound layer, which declares its cues in the timeline; an old audio intent or review cannot certify this mix.";
}
async function makeOrSkip(rawInputs, ctx, options = {}) {
  const underRef = rawInputs && typeof rawInputs === "object" ? rawInputs.under : void 0;
  let underInfo;
  if (isFileRef2(underRef) && underRef.media === "video") underInfo = await probeUnder(ctx.tools, underRef.path);
  const spec = readInputs(rawInputs, ctx, { under: underInfo });
  if (spec.skip) {
    ctx.log.info("no scene has text; skip_blank makes nothing", { scenes: spec.scenes.length });
    return null;
  }
  if (!ctx.browser) throw ctx.error("needs_missing", "the kit browser");
  const stopIfAsked = () => {
    if (ctx.signal.aborted) throw ctx.error("stopped");
  };
  stopIfAsked();
  const limit = options.diskLimitBytes ?? DISK_LIMIT_MB * 1024 * 1024;
  let used = 0;
  const overLimit = () => ctx.error("bad_input", `the video needs more than ${Math.round(limit / (1024 * 1024))} MB of working space; make it shorter or simpler`);
  const reserve = (bytes) => {
    if (used + bytes > limit) throw overLimit();
    used += bytes;
  };
  const release = (bytes) => {
    used = Math.max(0, used - bytes);
  };
  const encodeInto = async (args, file) => {
    const room = limit - used - FS_MARGIN;
    if (room <= 0) throw overLimit();
    await ctx.tools.exec("ffmpeg", [...args.slice(0, -1), "-fs", String(room), args[args.length - 1]]);
    const size = (await stat2(file)).size;
    if (size >= room) throw overLimit();
    reserve(size);
  };
  const pageDir = path3.join(ctx.tmpDir, "page");
  const framesDir = path3.join(ctx.tmpDir, "frames");
  const segmentsDir = path3.join(ctx.tmpDir, "segments");
  const scratch = [pageDir, framesDir, segmentsDir];
  const total = spec.frameCount;
  const frameHashes = [];
  let logo = null;
  let cues = [];
  const segments = [];
  const name = "video.mp4";
  const out = path3.join(ctx.workDir, name);
  let finished = false;
  try {
    for (const dir of scratch) {
      await rm3(dir, { recursive: true, force: true });
      await mkdir2(dir, { recursive: true });
    }
    if (spec.under) {
      const times = spec.scenes.map((scene) => ({ start_s: spec.sceneFrames[scene.index] / spec.fps, end_s: spec.sceneFrames[scene.index + 1] / spec.fps }));
      spec.under.quietBands = await quietBands(ctx.tools, spec.under.file.path, spec.under.info, times, framesDir, spec.output);
    }
    const built = await buildPage(spec, pageDir, ctx, reserve);
    const refusePage = (problems) => {
      throw ctx.error("bad_input", problems.slice(0, 3).join(" "));
    };
    const encodeSegment = async (start, count, frameBytes) => {
      const segment = path3.join(segmentsDir, `seg-${String(segments.length + 1).padStart(5, "0")}.${spec.under ? "mov" : "mp4"}`);
      const args = spec.under ? alphaSegmentArgs({ framesDir, framePattern: FRAME_PATTERN, start, count, fps: spec.fps, out: segment }) : segmentArgs({ tools: ctx.tools, framesDir, start, count, fps: spec.fps, out: segment });
      await encodeInto(args, segment);
      segments.push(segment);
      for (let i = start; i < start + count; i++) await rm3(path3.join(framesDir, frameName(i)), { force: true });
      release(frameBytes);
    };
    const checked = (value) => {
      const report = reportOf(value);
      if (report.problems.length) refusePage(report.problems);
      for (const source of report.sources) {
        if (isAnimatedImage(Buffer.from(source.data, "base64"))) {
          refusePage([`The picture ${source.url} moves on its own; frame pages take still pictures and draw any motion themselves.`]);
        }
      }
      return report;
    };
    const frameBound = pngBound(spec.output.width, spec.output.height);
    const browser = await ctx.browser.launch();
    try {
      const page = await browser.newPage({ viewport: spec.design, deviceScaleFactor: spec.scale });
      await page.goto(pathToFileURL(built.entry).href);
      const started = await withTimeout(
        page.evaluate("window.__kitDriver ? window.__kitDriver.start() : null"),
        FRAME_TIMEOUT_MS,
        // A page that runs out of time is slow on this computer, not a bad plan: the kit tries the step again.
        () => ctx.error("timeout", "the frame page did not get ready within a minute")
      );
      if (started === null) throw ctx.error("tool_failed", "the frame page lost the kit runtime");
      checked(started);
      cues = cuesOf(started);
      const refused = pageSoundRefusal(cues.length, spec.under?.timeline.assembly_timeline);
      if (refused) throw ctx.error("bad_input", refused);
      let segmentStart = 0;
      let segmentBytes = 0;
      for (let index = 0; index < total; index++) {
        stopIfAsked();
        const drawn = checked(
          await withTimeout(
            page.evaluate(`window.__kitDriver.frame(${index})`),
            FRAME_TIMEOUT_MS,
            () => ctx.error("timeout", `the frame page took more than a minute to draw frame ${index}`)
          )
        );
        if (drawn.logo) logo = drawn.logo;
        const file = path3.join(framesDir, frameName(index));
        reserve(frameBound);
        await page.screenshot({ path: file, type: "png", omitBackground: !!spec.under });
        const png = await readFile4(file);
        release(frameBound - Math.min(frameBound, png.length));
        if (png.length > frameBound) reserve(png.length - frameBound);
        segmentBytes += png.length;
        if (index === 0) {
          const size = pngSize(png);
          if (!size || size.width !== spec.output.width || size.height !== spec.output.height) {
            throw ctx.error("tool_failed", `the browser drew ${size ? `${size.width}x${size.height}` : "no picture"}, not ${spec.output.width}x${spec.output.height}`);
          }
        }
        frameHashes.push(createHash2("sha256").update(png).digest("hex"));
        if (index + 1 - segmentStart === SEGMENT_FRAMES || index + 1 === total) {
          await encodeSegment(segmentStart, index + 1 - segmentStart, segmentBytes);
          segmentStart = index + 1;
          segmentBytes = 0;
        }
        if ((index + 1) % spec.fps === 0 || index + 1 === total) ctx.progress({ done: index + 1, total });
      }
      checked(await page.evaluate("window.__kitDriver.finish()"));
      await page.close();
    } catch (error) {
      if (ctx.signal.aborted) throw ctx.error("stopped");
      const fromPage = pageError(error);
      if (fromPage) throw ctx.error(fromPage.code, fromPage.detail);
      throw error;
    } finally {
      await browser.close().catch(() => void 0);
    }
    stopIfAsked();
    const list = path3.join(segmentsDir, "segments.txt");
    const listText = concatList(segments);
    reserve(Buffer.byteLength(listText));
    await writeFile2(list, listText);
    await mkdir2(ctx.workDir, { recursive: true });
    const seconds = total / spec.fps;
    const picture = cues.length ? path3.join(segmentsDir, "picture.mp4") : out;
    const underSound = !!spec.under?.info.hasAudio;
    if (spec.under) {
      const args = compositeArgs({
        tools: ctx.tools,
        under: spec.under.file.path,
        list,
        size: spec.output,
        fps: spec.fps,
        frames: total,
        // With cues, the video's sound is the bed of the cue mix instead.
        hasAudio: underSound && !cues.length,
        out: picture
      });
      await encodeInto(args, picture);
    } else await encodeInto(concatArgs(list, picture), picture);
    if (cues.length) {
      stopIfAsked();
      const partDir = ctx.part?.dir;
      if (!partDir) throw ctx.error("tool_failed", "the part's sound bank is missing");
      const bank = /* @__PURE__ */ new Map();
      for (const sound of new Set(cues.map((cue) => cue.sound))) {
        let pcm;
        try {
          pcm = readWav(await readFile4(path3.join(partDir, "assets", "sfx", `${sound}.wav`)));
        } catch {
          pcm = null;
        }
        if (!pcm || pcm.rate !== 48e3) throw ctx.error("tool_failed", `the part's sound "${sound}" could not be read`);
        bank.set(sound, bankSound(pcm));
      }
      let bed = null;
      if (spec.under && underSound) {
        const bedFile = path3.join(segmentsDir, "bed.wav");
        await encodeInto(bedArgs({ under: spec.under.file.path, seconds, out: bedFile }), bedFile);
        const pcm = readWav(await readFile4(bedFile));
        if (!pcm) throw ctx.error("tool_failed", "the sound of the video drawn over could not be read");
        bed = pcm.channels;
      }
      const mix = mixCues({ cues, bank, fps: spec.fps, frames: total, bed });
      const mixFile = path3.join(segmentsDir, "cues.wav");
      const bytes = wavBytes(mix.channels);
      reserve(bytes.length);
      await writeFile2(mixFile, bytes);
      await encodeInto(muxArgs({ tools: ctx.tools, picture, audio: mixFile, seconds, out }), out);
      ctx.log.info("sound cues mixed", { cues: mix.placed.length, gain: mix.gain, sounds: CUE_SOUNDS.filter((s) => bank.has(s)) });
    }
    const info = await ctx.tools.probe(out);
    const streams = await ctx.tools.exec("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=pix_fmt,nb_frames", "-of", "json", out]);
    const stream = JSON.parse(streams.stdout).streams?.[0];
    const wrong = [];
    if (!info.has_video || info.video_codec !== "h264") wrong.push(`codec ${info.video_codec ?? "none"}`);
    if (info.width !== spec.output.width || info.height !== spec.output.height) wrong.push(`size ${info.width}x${info.height}`);
    if (info.duration_s === void 0 || Math.abs(info.duration_s - seconds) > 1.5 / spec.fps + 0.01) wrong.push(`length ${info.duration_s}s`);
    if (stream?.pix_fmt !== "yuv420p") wrong.push(`pixels ${stream?.pix_fmt ?? "unknown"}`);
    if (stream?.nb_frames !== void 0 && Number(stream.nb_frames) !== total) wrong.push(`${stream.nb_frames} frames`);
    if (cues.length && !info.has_audio) wrong.push("no sound for its cues");
    if (underSound && !info.has_audio) wrong.push("retained source sound was lost");
    if (wrong.length) throw ctx.error("output_invalid", `the encoded video is wrong: ${wrong.join(", ")}`);
    const video = await ctx.file(name, "video");
    ctx.log.info("assembly source clocks", {
      ...spec.under ? { source_sha256: spec.under.file.sha256, source_in_ms: 0, source_out_ms: Math.round(seconds * 1e3), picture_speed: 1, audio_speed: 1, native_audio: underSound ? "preserve" : "absent" } : {},
      cues: cues.map((cue) => ({ sound: cue.sound, requested_s: cue.at_s, gain: cue.gain, max_s: cue.max_s })),
      content_review_status: "incomplete"
    });
    ctx.log.info("frames rendered", { frames: total, seconds, width: spec.output.width, height: spec.output.height });
    finished = true;
    return {
      video,
      seconds,
      timeline: timelineOf(spec, logo),
      frameHashes,
      sourceFiles: spec.under ? [spec.under.file] : [],
      provenance: {
        renderer_version: "html-frames@1.3.1",
        content_review_status: "pending",
        ...spec.under ? { source_sha256: spec.under.file.sha256, picture_speed: 1, audio_speed: 1, native_audio: underSound ? "preserve" : "absent" } : {},
        audio_intent_status: spec.under?.timeline.assembly_timeline && !cues.length ? "source_clocks_preserved" : "requires_authored_timeline",
        page_sound_cues: cues.map((cue) => ({ sound: cue.sound, requested_s: cue.at_s, gain: cue.gain, max_s: cue.max_s })),
        exact_final_review: "pending"
      }
    };
  } finally {
    for (const dir of scratch) await rm3(dir, { recursive: true, force: true }).catch(() => void 0);
    if (!finished) await rm3(out, { force: true }).catch(() => void 0);
  }
}

// src/kit/maker/parts/html-frames/src/part.ts
var run = async (inputs2, ctx) => {
  const made = await makeOrSkip(inputs2, ctx);
  if (!made) return {};
  return {
    video: made.video,
    seconds: made.seconds,
    timeline: made.timeline,
    ...made.timeline.assembly_timeline ? { assembly_timeline: made.timeline.assembly_timeline } : {},
    source_files: made.sourceFiles,
    provenance: made.provenance,
    content_review_status: "pending"
  };
};
export {
  run
};
