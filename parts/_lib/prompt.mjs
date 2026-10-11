// Prompt templates for generation parts. A style ships a template as a frame
// file (frames/<name>.prompt.json); a part loads it with kitLoadTemplate and
// fills one prompt per scene with kitScenePrompts, which refuses the whole step
// before any piece is ordered when a scene lacks a placeholder's value.
// Bundled into parts; every top-level name starts with `kit`.
//
// Template (version 1; unknown keys are refused):
//   prefix, suffix         text put before and after every prompt
//   scene                  the per-scene text (default "{picture}")
//   motion                 the per-scene motion text for video parts
//   anchor                 a cast member's portrait text ({name}, {look} = the member's look)
//   negative               the negative prompt
//   looks                  {key: text}: the art styles; {look} is looks[ctx.look]
//   templates              {key: text}: more named texts a part may use ("hook", "take1", "later")
//   by_tag                 {Tag: {scene?, motion?, negative?, prefix?, suffix?, refs?}}: per-tag overrides
//   refs                   which references a scene sends, in order: "anchor" | "product" | "scene_image"
//   max_refs               the most references per scene (1-10, default 10)
//   banned                 phrases a filled prompt may not contain (case-insensitive, whole words)
//
// Placeholders: {picture} {line} {on_screen} {look} {style} {cast_looks}
//   {brand.FIELD} {product.name} {speaker.name} {speaker.look} {answers.KEY}
//   and, in `anchor` only, {name}. A trailing ? ({answers.mood?}) lets the value be empty;
//   without it an empty value refuses the scene ("scene s3 needs {answers.mood}").
//   {cast_looks} ("Maya: look; Theo: look" for the members the scene names) may always be empty.
import { readFile } from 'node:fs/promises';
import { kitNamedCast, kitNamedProducts, kitPictureWithoutTag, kitSceneTag, kitTagKey, kitWholeWordsRe } from './scene-match.mjs';

const KIT_TEMPLATE_TEXT_KEYS = ['prefix', 'suffix', 'scene', 'motion', 'anchor', 'negative'];
const KIT_TEMPLATE_KEYS = new Set([...KIT_TEMPLATE_TEXT_KEYS, 'version', 'looks', 'templates', 'by_tag', 'refs', 'max_refs', 'banned']);
const KIT_BY_TAG_KEYS = new Set(['scene', 'motion', 'negative', 'prefix', 'suffix', 'refs']);
const KIT_REF_KINDS = new Set(['anchor', 'product', 'scene_image']);
const KIT_TEMPLATE_MAX_BYTES = 64 * 1024;
const KIT_TEXT_MAX = 8000;
const KIT_MAX_REFS = 10;
const KIT_MAX_ANCHOR_REFS = 3;
// {name}, {name?}, {a.b}, {answers.some_key?}: a placeholder. Other braces ("{ }", "{1,2}") are plain text.
const KIT_PLACEHOLDER_RE = /\{([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?)(\?)?\}/g;
const KIT_SIMPLE_PLACEHOLDERS = new Set(['picture', 'line', 'on_screen', 'look', 'style', 'cast_looks', 'name']);
const KIT_DOTTED_PLACEHOLDERS = new Set(['product.name', 'speaker.name', 'speaker.look']);

/**
 * A scene the template cannot fill, or a filled prompt with a banned phrase.
 * kind: 'gap' (placeholder has no value), 'look' (the look is not in `looks`)
 * or 'banned' (phrase). Parts turn it into ctx.error('bad_input', err.message).
 */
export class KitPromptGap extends Error {
  constructor(message, { kind = 'gap', placeholder = null, scene_id = null, phrase = null } = {}) {
    super(message);
    this.name = 'KitPromptGap';
    this.kind = kind;
    this.placeholder = placeholder;
    this.scene_id = scene_id;
    this.phrase = phrase;
  }
}

function kitIsPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function kitPlaceholderProblems(text, where, inAnchor) {
  const out = [];
  for (const m of String(text).matchAll(KIT_PLACEHOLDER_RE)) {
    const key = m[1];
    if (key === 'name' && !inAnchor) out.push(`${where}: {name} only works in anchor`);
    else if (KIT_SIMPLE_PLACEHOLDERS.has(key) || KIT_DOTTED_PLACEHOLDERS.has(key)) continue;
    else if (/^(answers|brand)\.[a-z][a-z0-9_]*$/.test(key)) continue;
    else out.push(`${where}: unknown placeholder {${key}${m[2] || ''}}`);
  }
  return out;
}

function kitTextProblems(value, where, inAnchor) {
  if (typeof value !== 'string') return [`${where} must be text`];
  if (value.length > KIT_TEXT_MAX) return [`${where} is over ${KIT_TEXT_MAX} characters`];
  return kitPlaceholderProblems(value, where, inAnchor);
}

function kitRefsProblems(value, where) {
  if (!Array.isArray(value)) return [`${where} must be a list`];
  const bad = value.filter((r) => !KIT_REF_KINDS.has(r));
  return bad.length ? [`${where}: unknown reference ${JSON.stringify(bad[0])} (anchor, product, scene_image)`] : [];
}

/** Every problem with a parsed template object, as text; [] when it is a valid version 1 template. */
export function kitTemplateProblems(tpl) {
  if (!kitIsPlainObject(tpl)) return ['the template must be a JSON object'];
  const out = [];
  if (tpl.version !== 1) out.push(`version must be 1, not ${JSON.stringify(tpl.version)}`);
  for (const key of Object.keys(tpl)) if (!KIT_TEMPLATE_KEYS.has(key)) out.push(`unknown key "${key}"`);
  for (const key of KIT_TEMPLATE_TEXT_KEYS) if (key in tpl) out.push(...kitTextProblems(tpl[key], key, key === 'anchor'));
  for (const key of ['looks', 'templates']) {
    if (!(key in tpl)) continue;
    if (!kitIsPlainObject(tpl[key])) out.push(`${key} must be an object of texts`);
    else for (const [k, v] of Object.entries(tpl[key])) out.push(...kitTextProblems(v, `${key}.${k}`, false));
  }
  if ('looks' in tpl && kitIsPlainObject(tpl.looks)) {
    const seen = new Map();
    for (const k of Object.keys(tpl.looks)) {
      const norm = kitTagKey(k);
      if (!norm) out.push(`looks: "${k}" is not a usable key`);
      else if (seen.has(norm)) out.push(`looks: "${k}" and "${seen.get(norm)}" are the same key`);
      else seen.set(norm, k);
    }
  }
  if ('templates' in tpl && kitIsPlainObject(tpl.templates)) {
    for (const k of Object.keys(tpl.templates)) if (['scene', 'motion', 'anchor'].includes(k)) out.push(`templates.${k}: use the top-level ${k} key`);
  }
  if ('by_tag' in tpl) {
    if (!kitIsPlainObject(tpl.by_tag)) out.push('by_tag must be an object');
    else {
      for (const [tag, rule] of Object.entries(tpl.by_tag)) {
        if (!kitTagKey(tag)) out.push(`by_tag: "${tag}" is not a usable tag`);
        if (!kitIsPlainObject(rule)) {
          out.push(`by_tag.${tag} must be an object`);
          continue;
        }
        for (const key of Object.keys(rule)) {
          if (!KIT_BY_TAG_KEYS.has(key)) out.push(`by_tag.${tag}: unknown key "${key}"`);
          else if (key === 'refs') out.push(...kitRefsProblems(rule.refs, `by_tag.${tag}.refs`));
          else out.push(...kitTextProblems(rule[key], `by_tag.${tag}.${key}`, false));
        }
      }
    }
  }
  if ('refs' in tpl) out.push(...kitRefsProblems(tpl.refs, 'refs'));
  if ('max_refs' in tpl && !(Number.isInteger(tpl.max_refs) && tpl.max_refs >= 0 && tpl.max_refs <= KIT_MAX_REFS)) {
    out.push(`max_refs must be a whole number from 0 to ${KIT_MAX_REFS}`);
  }
  if ('banned' in tpl) {
    if (!Array.isArray(tpl.banned) || tpl.banned.some((b) => typeof b !== 'string' || !b.trim() || b.length > 80)) {
      out.push('banned must be a list of phrases (1-80 characters each)');
    } else if (tpl.banned.length > 50) out.push('banned has more than 50 phrases');
  }
  return out;
}

/** A parsed template object checked and returned as is; throws when it is not a valid version 1 template. */
export function kitTemplateFrom(tpl, where = 'template') {
  const problems = kitTemplateProblems(tpl);
  if (problems.length) throw new Error(`${where}: ${problems.slice(0, 6).join('; ')}`);
  return tpl;
}

/**
 * Reads and checks a template file: a FileRef ({path}) or a path. Throws
 * (with the file's name) when it is unreadable, over 64 KB, not JSON, or not
 * a valid version 1 template.
 */
export async function kitLoadTemplate(file) {
  const path = typeof file === 'string' ? file : file && file.path;
  if (!path) throw new Error('template: no file');
  const name = String(path).split('/').at(-1);
  const text = await readFile(path, 'utf8');
  if (Buffer.byteLength(text) > KIT_TEMPLATE_MAX_BYTES) throw new Error(`template ${name}: over 64 KB`);
  let tpl;
  try {
    tpl = JSON.parse(text);
  } catch (err) {
    throw new Error(`template ${name}: not JSON (${err.message})`);
  }
  return kitTemplateFrom(tpl, `template ${name}`);
}

/** Tidies filled text: one space between words, no doubled punctuation left by empty values, no dangling separators. */
export function kitPromptTidy(text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.,;:!?])(?:\s*[.,;:])+/g, '$1')
    .replace(/^[\s.,;:]+/, '')
    .replace(/[\s,;:]+$/, '')
    .trim();
}

function kitValueText(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

/**
 * Fills `text`'s placeholders from `values` ({placeholder key: value}). A key
 * whose value is empty refuses with KitPromptGap ("<who> needs {key}") unless
 * the placeholder ends with ? or the key is in `optional`. `who` is "scene s3"
 * or "cast a". The result is tidied with kitPromptTidy.
 */
export function kitPromptFill(text, values, { who = 'the prompt', scene_id = null, optional = [] } = {}) {
  const soft = new Set(optional);
  const filled = String(text == null ? '' : text).replace(KIT_PLACEHOLDER_RE, (whole, key, q) => {
    const value = kitValueText(values ? values[key] : undefined);
    if (!value && !q && !soft.has(key)) {
      throw new KitPromptGap(`${who} needs {${key}}`, { kind: 'gap', placeholder: `{${key}}`, scene_id });
    }
    return value;
  });
  return kitPromptTidy(filled);
}

/** Joins prompt parts: trimmed, empty ones dropped, a full stop added between parts that lack an ending mark. */
export function kitPromptJoin(parts) {
  const kept = parts.map((p) => kitPromptTidy(p || '')).filter(Boolean);
  let out = '';
  for (const p of kept) out = !out ? p : /[.!?;:,]$/.test(out) ? `${out} ${p}` : `${out}. ${p}`;
  return out;
}

function kitLookText(tpl, look, who, scene_id) {
  const raw = kitValueText(look);
  if (!raw) return '';
  const looks = kitIsPlainObject(tpl.looks) ? tpl.looks : null;
  if (!looks || !Object.keys(looks).length) return raw;
  const want = kitTagKey(raw);
  const hit = Object.keys(looks).find((k) => kitTagKey(k) === want);
  if (hit == null) {
    throw new KitPromptGap(`${who} needs {look}: "${raw}" is not one of ${Object.keys(looks).join(', ')}`, { kind: 'look', placeholder: '{look}', scene_id });
  }
  return looks[hit];
}

function kitTagRule(tpl, tag) {
  if (!tag || !kitIsPlainObject(tpl.by_tag)) return null;
  const want = kitTagKey(tag);
  const key = Object.keys(tpl.by_tag).find((k) => kitTagKey(k) === want);
  return key == null ? null : tpl.by_tag[key];
}

function kitBannedCheck(tpl, prompt, who, scene_id) {
  for (const phrase of Array.isArray(tpl.banned) ? tpl.banned : []) {
    const re = kitWholeWordsRe(phrase);
    if (re && re.test(prompt)) {
      throw new KitPromptGap(`${who} uses the banned phrase "${phrase.trim()}"`, { kind: 'banned', scene_id, phrase: phrase.trim() });
    }
  }
}

function kitBrandValues(brand) {
  const out = {};
  if (kitIsPlainObject(brand)) for (const [k, v] of Object.entries(brand)) out[`brand.${k}`] = v;
  return out;
}

function kitAnswerValues(answers) {
  const out = {};
  if (kitIsPlainObject(answers)) for (const [k, v] of Object.entries(answers)) out[`answers.${k}`] = v;
  return out;
}

function kitIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

/**
 * One scene's prompt. ctx = {scene, index, look, answers, cast, products, brand}.
 * `use` picks the text: 'scene' (default), 'motion', or a key of `templates`.
 * The scene's tag (kitSceneTag) picks a by_tag rule, whose texts and refs win;
 * {picture} then drops the "Tag:" lead. When the scene names no product and the
 * plan has exactly one, that product counts as named if the text uses
 * {product.name} or the refs ask for "product".
 *
 * Returns {prompt, negative, tag, refs: {cast, products, scene_image}}:
 * refs.cast are the named members (speaker first, at most 3) when refs has
 * "anchor"; refs.products the named products with a photo when refs has
 * "product"; refs.scene_image the scene's own picture file (scene.image, else a
 * file picture) when refs has "scene_image". Members and products come as the
 * plan gives them: the part reads member.image and product.images[0]. They are taken in the order of `refs` until max_refs is reached.
 * Throws KitPromptGap when a required placeholder is empty or a banned phrase appears.
 */
export function kitScenePrompt(tpl, ctx, { use = 'scene' } = {}) {
  const scene = (ctx && ctx.scene) || {};
  const index = Number.isInteger(ctx && ctx.index) ? ctx.index : 0;
  const scene_id = scene.id != null && scene.id !== '' ? String(scene.id) : `#${index + 1}`;
  const who = `scene ${scene_id}`;
  const tag = kitSceneTag(scene);
  const rule = kitTagRule(tpl, tag);
  const pick = (key) => (rule && typeof rule[key] === 'string' ? rule[key] : tpl[key]);

  let body;
  if (use === 'scene') body = pick('scene') ?? '{picture}';
  else if (use === 'motion') body = pick('motion');
  else if (use === 'anchor') throw new Error('use kitAnchorPrompt for anchor prompts');
  else body = kitIsPlainObject(tpl.templates) ? tpl.templates[use] : undefined;
  if (typeof body !== 'string') throw new Error(`the template has no "${use}" text`);

  const refKinds = rule && Array.isArray(rule.refs) ? rule.refs : Array.isArray(tpl.refs) ? tpl.refs : ['anchor', 'product', 'scene_image'];
  const cast = kitNamedCast(scene, ctx && ctx.cast);
  const allProducts = Array.isArray(ctx && ctx.products) ? ctx.products.filter(Boolean) : [];
  let products = kitNamedProducts(scene, allProducts);
  const texts = [pick('prefix'), body, pick('suffix'), pick('negative')].filter((t) => typeof t === 'string').join('\n');
  if (!products.length && allProducts.length === 1 && (/\{product\.name\??\}/.test(texts) || refKinds.includes('product'))) products = allProducts;
  const speaker = scene.speaker != null ? cast.find((m) => m.key === scene.speaker) : null;
  const tags = rule ? Object.keys(tpl.by_tag) : [];

  const values = {
    picture: kitPictureWithoutTag(scene, tags),
    line: scene.line,
    on_screen: scene.on_screen,
    look: kitLookText(tpl, ctx && ctx.look, who, scene_id),
    cast_looks: cast.filter((m) => kitValueText(m.name) && kitValueText(m.look)).map((m) => `${kitValueText(m.name)}: ${kitValueText(m.look)}`).join('; '),
    'product.name': products[0] ? products[0].name : '',
    'speaker.name': speaker ? speaker.name : '',
    'speaker.look': speaker ? speaker.look : '',
    ...kitBrandValues(ctx && ctx.brand),
    ...kitAnswerValues(ctx && ctx.answers),
  };
  values.style = values.look;
  const opts = { who, scene_id, optional: ['cast_looks'] };
  const prompt = kitPromptJoin([pick('prefix'), body, pick('suffix')].map((t) => (typeof t === 'string' ? kitPromptFill(t, values, opts) : '')));
  const negative = typeof pick('negative') === 'string' ? kitPromptFill(pick('negative'), values, opts) : '';
  kitBannedCheck(tpl, prompt, who, scene_id);

  const max = Number.isInteger(tpl.max_refs) ? tpl.max_refs : KIT_MAX_REFS;
  const refs = { cast: [], products: [], scene_image: null };
  let room = max;
  for (const kind of refKinds) {
    if (room <= 0) break;
    if (kind === 'anchor') {
      refs.cast = cast.slice(0, Math.min(KIT_MAX_ANCHOR_REFS, room));
      room -= refs.cast.length;
    } else if (kind === 'product') {
      refs.products = products.filter((p) => Array.isArray(p.images) && p.images.length).slice(0, room);
      room -= refs.products.length;
    } else if (kind === 'scene_image' && (kitIsFile(scene.image) || kitIsFile(scene.picture))) {
      refs.scene_image = kitIsFile(scene.image) ? scene.image : scene.picture;
      room -= 1;
    }
  }
  return { prompt, negative, tag, refs };
}

/**
 * Every picked scene's prompt, computed before any piece is ordered so one
 * scene's gap refuses the whole step. `picked` is kitPickScenes' [{scene, index}];
 * `base` = {look, answers, cast, products, brand}. Returns [{id, index, scene, prompt, negative, tag, refs}].
 */
export function kitScenePrompts(tpl, picked, base = {}, options = {}) {
  return (picked || []).map(({ scene, index }) => {
    const out = kitScenePrompt(tpl, { ...base, scene, index }, options);
    const id = scene && scene.id != null && scene.id !== '' ? String(scene.id) : `#${index + 1}`;
    return { id, index, scene, ...out };
  });
}

/**
 * A cast member's portrait prompt from the template's `anchor` text: {name}
 * and {look} are the member's; {style} is looks[ctx.look]; answers and brand
 * fill as in scenes. prefix, suffix and negative are filled as for scenes
 * ({look} there is the art style). ctx = {look, answers, brand}. Returns {prompt, negative}.
 * Throws when the template has no anchor text, or KitPromptGap ("cast <key> needs {look}").
 */
export function kitAnchorPrompt(tpl, member, ctx = {}) {
  if (typeof tpl.anchor !== 'string') throw new Error('the template has no "anchor" text');
  const key = member && member.key != null ? String(member.key) : '?';
  const who = `cast ${key}`;
  const style = kitLookText(tpl, ctx.look, who, null);
  // prefix, suffix and negative are shared with the scenes, so {look} there stays the art style.
  const shared = { style, look: style, ...kitBrandValues(ctx.brand), ...kitAnswerValues(ctx.answers) };
  const own = { ...shared, name: member && member.name, look: member && member.look };
  const opts = { who };
  const fill = (t, values) => (typeof t === 'string' ? kitPromptFill(t, values, opts) : '');
  const prompt = kitPromptJoin([fill(tpl.prefix, shared), fill(tpl.anchor, own), fill(tpl.suffix, shared)]);
  const negative = fill(tpl.negative, shared);
  kitBannedCheck(tpl, prompt, who, null);
  return { prompt, negative };
}
