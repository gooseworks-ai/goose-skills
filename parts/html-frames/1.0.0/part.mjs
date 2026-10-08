// html-frames 1.0.0: built by scripts/build-kit-parts.ts from src/kit/maker. Do not edit by hand.

// src/kit/maker/make.ts
import { createHash as createHash2 } from "node:crypto";
import { mkdir as mkdir2, readFile as readFile2, rm, stat, writeFile as writeFile2 } from "node:fs/promises";
import * as path2 from "node:path";
import { pathToFileURL } from "node:url";

// src/kit/maker/encode.ts
var SEGMENT_FRAMES = 60;
var FRAME_PATTERN = "f%06d.png";
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

// src/kit/maker/parts/html-frames/1.0.0/part.json
var inputs = {
  type: "object",
  additionalProperties: false,
  required: ["template", "scenes", "aspect", "max_words"],
  oneOf: [{ required: ["duration_s"] }, { required: ["scene_s"] }],
  properties: {
    template: {
      description: "The style's frame page. The maker puts the kit runtime first in its head; the page reads window.kit and draws each frame from kit.render(fn), renderAt(t), seek(ms), or CSS and Web Animations.",
      type: "object",
      "x-kit-file": { media: "html" }
    },
    frames: {
      description: "Every other file the page uses (css, js, json, svg, png, jpg, webp), kept at the same places relative to the template. The page can load nothing else.",
      type: "array",
      maxItems: 200,
      items: {
        anyOf: [
          { type: "object", "x-kit-file": { media: "html" } },
          { type: "object", "x-kit-file": { media: "text" } },
          { type: "object", "x-kit-file": { media: "json" } },
          { type: "object", "x-kit-file": { media: "image" } }
        ]
      }
    },
    fonts: {
      description: "The style's fonts (ttf, otf, woff, woff2). CSS uses each by its file name without the extension.",
      type: "array",
      maxItems: 20,
      items: { type: "object", "x-kit-file": { media: "font" } }
    },
    scenes: {
      description: "plan.scenes, in order. The scenes share the video evenly; kit.scenes carries each one's start_s and end_s, and picture and image as URLs when they are files.",
      type: "array",
      minItems: 1,
      maxItems: 30,
      items: {
        type: "object",
        properties: {
          id: { type: ["string", "null"], maxLength: 64 },
          line: { type: ["string", "null"], maxLength: 2e3 },
          on_screen: { type: ["string", "null"], maxLength: 2e3 },
          picture: {
            anyOf: [
              { type: "null" },
              { type: "string", maxLength: 2e3 },
              { type: "object", "x-kit-file": { media: "image" } }
            ]
          },
          image: {
            description: "A picture the customer uploaded for this scene, as kit.scenes[i].image (a URL the page can load).",
            anyOf: [{ type: "null" }, { type: "object", "x-kit-file": { media: "image" } }]
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
      description: "plan.products, in the customer's order.",
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", minLength: 1 },
          name: { type: ["string", "null"], maxLength: 2e3 },
          images: {
            type: "array",
            maxItems: 20,
            items: { type: "object", "x-kit-file": { media: "image" } }
          }
        }
      }
    },
    brand: {
      description: 'The brand frozen at the yes ({"from": "brand"}): name, logo, colors, fonts (heading, body), cta. Colours become CSS variables (--brand-primary, ...); fonts are brand-heading and brand-body.',
      type: ["object", "null"],
      properties: {
        name: { type: ["string", "null"], maxLength: 2e3 },
        logo: { anyOf: [{ type: "null" }, { type: "object", "x-kit-file": { media: "image" } }] },
        colors: { type: ["object", "null"] },
        fonts: {
          type: ["object", "null"],
          properties: {
            heading: { anyOf: [{ type: "null" }, { type: "object", "x-kit-file": { media: "font" } }] },
            body: { anyOf: [{ type: "null" }, { type: "object", "x-kit-file": { media: "font" } }] }
          }
        },
        cta: { type: ["object", "null"] }
      }
    },
    aspect: { enum: ["9:16", "1:1", "4:5", "16:9"] },
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
    fps: { type: "integer", minimum: 1, maximum: 60, default: 30 },
    short_side: {
      description: "Pixels on the short side of the video. The page is always laid out at 1080 and scaled.",
      enum: [720, 1080],
      default: 1080
    },
    values: {
      description: "The style's own plain values for its page (labels, look choices), as kit.values.",
      type: "object"
    }
  }
};

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
function countWords(text2) {
  if (!text2) return 0;
  return text2.split(/\s+/u).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
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
    return { id, index, line, on_screen: onScreen, picture, image };
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
function readInputs(raw, ctx) {
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
  const fps = raw.fps ?? 30;
  if (typeof fps !== "number" || !Number.isInteger(fps) || fps < 1 || fps > LIMITS.maxFps) fail(`fps should be a whole number from 1 to ${LIMITS.maxFps}`);
  const shortSide = raw.short_side ?? 1080;
  if (!SHORT_SIDES.includes(shortSide)) fail(`short_side should be ${SHORT_SIDES.join(" or ")}`);
  const scale = shortSide / 1080;
  const output = { width: Math.round(design.width * scale), height: Math.round(design.height * scale) };
  const hasTotal = raw.duration_s !== void 0 && raw.duration_s !== null;
  const hasPerScene = raw.scene_s !== void 0 && raw.scene_s !== null;
  if (hasTotal === hasPerScene) fail("give exactly one of duration_s (the whole video) or scene_s (each scene)");
  const seconds = hasTotal ? raw.duration_s : raw.scene_s * scenes.length;
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < LIMITS.minSeconds || seconds > LIMITS.maxSeconds) {
    fail(`the video would be ${String(seconds)} seconds; it must be ${LIMITS.minSeconds} to ${LIMITS.maxSeconds}`);
  }
  const frameCount = Math.round(seconds * fps);
  if (frameCount < scenes.length) fail(`${scenes.length} scenes need at least ${scenes.length} frames; the video has ${frameCount}`);
  const sceneFrames = scenes.map((_, i) => Math.round(i * frameCount / scenes.length));
  sceneFrames.push(frameCount);
  const values = raw.values ?? {};
  if (!isObject(values)) fail("values should be an object");
  if (JSON.stringify(values).length > 64 * 1024) fail("values is larger than 64 KB");
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
    values
  };
}

// src/kit/maker/page.ts
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

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
    sceneAt: sceneAt,
    render: function (fn) { if (typeof fn === 'function') renderers.push(fn); },
    ready: function (promise) { waits.push(Promise.resolve(promise)); }
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
    return { problems: out, sources: sources };
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
      return take();
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
  return RUNTIME.replace("__KIT_DATA__", () => scriptJson(data)).replace("__KIT_EPOCH__", String(PAGE_EPOCH_MS));
}

// src/kit/maker/page.ts
var KIT_FOLDER = "_kit";
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
    data = await readFile(ref.path);
  } catch {
    return fail(`the file ${path.basename(ref.path)} could not be read`);
  }
  const sha = createHash("sha256").update(data).digest("hex");
  if (sha !== ref.sha256) fail(`the file ${path.basename(ref.path)} changed after it was checked`);
  return data;
}
function commonFolder(files) {
  let common = path.dirname(files[0]);
  for (const file of files.slice(1)) {
    while (path.relative(common, file).startsWith("..")) {
      const up = path.dirname(common);
      if (up === common) break;
      common = up;
    }
  }
  return common;
}
function fontOf(ref, fail) {
  const fromMime = ref.mime.startsWith("font/") ? ref.mime.slice(5) : "";
  const fromName = path.extname(ref.path).slice(1).toLowerCase();
  const kind = FONT_FORMAT[fromMime] ?? FONT_FORMAT[fromName];
  if (!kind) fail(`the font ${path.basename(ref.path)} is not ttf, otf, woff or woff2`);
  return kind;
}
function familyOf(ref) {
  return path.basename(ref.path, path.extname(ref.path)).replace(/[^A-Za-z0-9 _-]/g, "-");
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
  await mkdir(path.join(dir, KIT_FOLDER, "fonts"), { recursive: true });
  await mkdir(path.join(dir, KIT_FOLDER, "media"), { recursive: true });
  let bytes = 0;
  const put = async (target, data2) => {
    const size = Buffer.byteLength(data2);
    reserve(size);
    await writeFile(target, data2);
    bytes += size;
  };
  const still = (ref, data2) => {
    if (isAnimatedImage(data2)) fail(`the picture ${path.basename(ref.path)} moves on its own; frame pages take still pictures and draw any motion themselves`);
  };
  const openTrees = (ref, data2) => {
    if (/\bshadowroot(mode)?\s*=\s*["']?closed/i.test(data2.toString("utf8"))) {
      fail(`the frame ${path.basename(ref.path)} declares a closed shadow root; use an open one`);
    }
  };
  const pageFiles = [spec.template, ...spec.frames];
  const base = commonFolder(pageFiles.map((f) => f.path));
  const entry = path.join(dir, path.relative(base, spec.template.path));
  const url = (relFromDir) => path.relative(path.dirname(entry), path.join(dir, ...relFromDir.split("/"))).split(path.sep).join("/");
  const placed = /* @__PURE__ */ new Map();
  const preload = [];
  for (const ref of pageFiles) {
    const rel = path.relative(base, ref.path).split(path.sep).join("/");
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
    const target = path.join(dir, ...rel.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    if (ref === spec.template) continue;
    if (ref.media === "image") still(ref, data2);
    await put(target, data2);
    if (ref.media === "image") preload.push(url(rel));
  }
  const faces = [];
  const families = [];
  const addFont = async (ref, family) => {
    if (families.includes(family)) fail(`two fonts are both called ${family}`);
    const kind = fontOf(ref, fail);
    const name = `${ref.sha256.slice(0, 16)}.${kind.ext}`;
    await put(path.join(dir, KIT_FOLDER, "fonts", name), await readChecked(ref, fail));
    faces.push(`@font-face{font-family:${cssString(family)};src:url(${cssString(url(`${KIT_FOLDER}/fonts/${name}`))}) format(${cssString(kind.format)});font-display:block;}`);
    families.push(family);
  };
  for (const font of spec.fonts) await addFont(font, familyOf(font));
  if (spec.brand?.fonts.heading) await addFont(spec.brand.fonts.heading, "brand-heading");
  if (spec.brand?.fonts.body) await addFont(spec.brand.fonts.body, "brand-body");
  const media = async (ref) => {
    const ext = IMAGE_EXT[ref.mime];
    if (!ext) fail(`the picture ${path.basename(ref.path)} is not png, jpg, webp, gif, avif or svg`);
    const rel = `${KIT_FOLDER}/media/${ref.sha256.slice(0, 16)}.${ext}`;
    if (!preload.includes(url(rel))) {
      const data2 = await readChecked(ref, fail);
      still(ref, data2);
      await put(path.join(dir, ...rel.split("/")), data2);
      preload.push(url(rel));
    }
    return url(rel);
  };
  const products = [];
  for (const product of spec.products) {
    const images = [];
    for (const image of product.images) images.push(await media(image));
    products.push({ id: product.id, name: product.name, images });
  }
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
    preload
  };
  const head = `<meta charset="utf-8"><style id="kit-fonts">${faces.join("")}:root{${variables.join(";")}}</style><script>${runtimeScript(data)}</script>`;
  const template = (await readChecked(spec.template, fail)).toString("utf8");
  await put(entry, injectFirst(template, head));
  return { entry, families, bytes };
}

// src/kit/maker/make.ts
var FRAME_TIMEOUT_MS = 6e4;
function timelineOf(spec) {
  return {
    duration_s: spec.frameCount / spec.fps,
    width: spec.output.width,
    height: spec.output.height,
    fps: spec.fps,
    scenes: spec.scenes.map((scene) => ({
      id: scene.id,
      start_s: spec.sceneFrames[scene.index] / spec.fps,
      end_s: spec.sceneFrames[scene.index + 1] / spec.fps
    })),
    speech: []
  };
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
  return { problems, sources };
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
async function makeVideo(rawInputs, ctx, options = {}) {
  const spec = readInputs(rawInputs, ctx);
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
    const size = (await stat(file)).size;
    if (size >= room) throw overLimit();
    reserve(size);
  };
  const pageDir = path2.join(ctx.tmpDir, "page");
  const framesDir = path2.join(ctx.tmpDir, "frames");
  const segmentsDir = path2.join(ctx.tmpDir, "segments");
  const scratch = [pageDir, framesDir, segmentsDir];
  const total = spec.frameCount;
  const frameHashes = [];
  const segments = [];
  const name = "video.mp4";
  const out = path2.join(ctx.workDir, name);
  let finished = false;
  try {
    for (const dir of scratch) {
      await rm(dir, { recursive: true, force: true });
      await mkdir2(dir, { recursive: true });
    }
    const built = await buildPage(spec, pageDir, ctx, reserve);
    const refusePage = (problems) => {
      throw ctx.error("bad_input", problems.slice(0, 3).join(" "));
    };
    const encodeSegment = async (start, count, frameBytes) => {
      const segment = path2.join(segmentsDir, `seg-${String(segments.length + 1).padStart(5, "0")}.mp4`);
      await encodeInto(segmentArgs({ tools: ctx.tools, framesDir, start, count, fps: spec.fps, out: segment }), segment);
      segments.push(segment);
      for (let i = start; i < start + count; i++) await rm(path2.join(framesDir, frameName(i)), { force: true });
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
    };
    const frameBound = pngBound(spec.output.width, spec.output.height);
    const browser = await ctx.browser.launch();
    try {
      const page = await browser.newPage({ viewport: spec.design, deviceScaleFactor: spec.scale });
      await page.goto(pathToFileURL(built.entry).href);
      const started = await withTimeout(
        page.evaluate("window.__kitDriver ? window.__kitDriver.start() : null"),
        FRAME_TIMEOUT_MS,
        () => ctx.error("bad_input", "the frame page did not get ready within a minute")
      );
      if (started === null) throw ctx.error("tool_failed", "the frame page lost the kit runtime");
      checked(started);
      let segmentStart = 0;
      let segmentBytes = 0;
      for (let index = 0; index < total; index++) {
        stopIfAsked();
        checked(
          await withTimeout(
            page.evaluate(`window.__kitDriver.frame(${index})`),
            FRAME_TIMEOUT_MS,
            () => ctx.error("bad_input", `the frame page took more than a minute to draw frame ${index}`)
          )
        );
        const file = path2.join(framesDir, frameName(index));
        reserve(frameBound);
        await page.screenshot({ path: file, type: "png" });
        const png = await readFile2(file);
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
    const list = path2.join(segmentsDir, "segments.txt");
    const listText = concatList(segments);
    reserve(Buffer.byteLength(listText));
    await writeFile2(list, listText);
    await mkdir2(ctx.workDir, { recursive: true });
    await encodeInto(concatArgs(list, out), out);
    const seconds = total / spec.fps;
    const info = await ctx.tools.probe(out);
    const streams = await ctx.tools.exec("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=pix_fmt,nb_frames", "-of", "json", out]);
    const stream = JSON.parse(streams.stdout).streams?.[0];
    const wrong = [];
    if (!info.has_video || info.video_codec !== "h264") wrong.push(`codec ${info.video_codec ?? "none"}`);
    if (info.width !== spec.output.width || info.height !== spec.output.height) wrong.push(`size ${info.width}x${info.height}`);
    if (info.duration_s === void 0 || Math.abs(info.duration_s - seconds) > 1.5 / spec.fps + 0.01) wrong.push(`length ${info.duration_s}s`);
    if (stream?.pix_fmt !== "yuv420p") wrong.push(`pixels ${stream?.pix_fmt ?? "unknown"}`);
    if (stream?.nb_frames !== void 0 && Number(stream.nb_frames) !== total) wrong.push(`${stream.nb_frames} frames`);
    if (wrong.length) throw ctx.error("output_invalid", `the encoded video is wrong: ${wrong.join(", ")}`);
    const video = await ctx.file(name, "video");
    ctx.log.info("frames rendered", { frames: total, seconds, width: spec.output.width, height: spec.output.height });
    finished = true;
    return { video, seconds, timeline: timelineOf(spec), frameHashes };
  } finally {
    for (const dir of scratch) await rm(dir, { recursive: true, force: true }).catch(() => void 0);
    if (!finished) await rm(out, { force: true }).catch(() => void 0);
  }
}

// src/kit/maker/parts/html-frames/src/part.ts
var run = async (inputs2, ctx) => {
  const made = await makeVideo(inputs2, ctx);
  return { video: made.video, seconds: made.seconds, timeline: made.timeline };
};
export {
  run
};
