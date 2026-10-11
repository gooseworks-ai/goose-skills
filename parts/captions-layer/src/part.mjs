// captions-layer: burns word-timed captions onto the cut and returns a WebVTT
// of exactly what it drew. The look comes from the style's caption look
// (expect.caption_look, copied there by the kit from style.traits.caption_look):
//   plate    caption-burn's rule: one or two words on a dark rounded plate
//            (the default, and what an unknown preset falls back to);
//   stroke   white bold type with a black outline, no plate, up to 5 words;
//   karaoke  groups of up to 5 outlined words, the spoken word in the
//            highlight colour;
//   pill     about 3 lower-case words on a cream rounded pill in a bold rounded
//            face, the words said so far dark and the ones still to come grey;
//   serif-word  one word at a time in a heavy serif, white with a black
//            outline, a brand name kept whole and, when highlighted, quoted;
//   sentence one sentence per caption in a serif, each word appearing as it
//            is said and staying, the last line on a fixed low baseline and a
//            longer sentence growing upward.
// A look is never refused: an unknown preset (one a later version draws) or a
// bad parameter is dropped with a warning and the rest is drawn. Captions
// stop where the timeline's end card starts and are never drawn inside it;
// the last caption otherwise holds to the final frame (it is the call to
// action). Captions stay inside the 4:5 feed crop (y 0.148 to 0.852), the
// TikTok/Reels bands and the timeline's caption safe zone. Timings come from
// the timeline's speech words; only when there are none is the cut's own
// audio transcribed (fal Whisper, the layer's one paid call), and a spoken
// word the transcript writes differently is placed between its neighbours.
// Captions are drawn in the kit's Chromium with the brand's font (or the
// bundled one) and overlaid with ffmpeg, so no libass or system font is
// needed. The final encode is capped at 16 Mbit/s, and a result over 180 MB
// is refused before upload.
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { kitHeardPlace, kitHeardWords } from '../../_lib/heard.mjs';

const CAP = 0.019;
const SAFE_TOP = 285 / 1920;
const SAFE_BOTTOM = 1635 / 1920;
const PLATE = 'rgba(58,58,60,0.839)';
const MAX_BYTES = 180 * 1000 * 1000;
const PRESETS = new Set(['plate', 'stroke', 'karaoke', 'pill', 'serif-word', 'sentence']);
// The presets new in 1.3.0 (plate, stroke and karaoke group words exactly as in 1.2.0).
const NEW_PRESETS = new Set(['pill', 'serif-word', 'sentence']);
// A sentence caption longer than this (with no max_words in the look) is split into near-equal parts.
const DEFAULT_WORDS = { plate: 2, stroke: 5, karaoke: 5, pill: 3, 'serif-word': 1, sentence: 12 };
// Caption centre as a share of the height; for `sentence` it is the centre of the last line.
const DEFAULT_Y = { plate: 0.62, stroke: 0.62, karaoke: 0.62, pill: 0.7, 'serif-word': 0.75, sentence: 0.77 };
// Stroke, karaoke and pill show at most five words at a time; a larger max_words is cut to five.
const MAX_OUTLINED = 5;
const CAPPED = new Set(['stroke', 'karaoke', 'pill']);
// Presets that draw one image per spoken word.
const WORD_STATES = new Set(['karaoke', 'pill', 'sentence']);
// Font size as a share of the height for the 1.3.0 presets (serif-word: cap 0.0367 H, measured off the
// reference; sentence: 62 px at 1920).
const SIZE = { pill: 0.0297, 'serif-word': 0.0506, sentence: 0.0323 };
// The bundled faces (all SIL Open Font License; the license texts ship beside them).
const FACES = { sans_bold: 'Montserrat-Bold.ttf', serif: 'PTSerif-Bold.ttf', rounded: 'TitanOne-Regular.ttf' };
const PRESET_FACE = { pill: 'rounded', 'serif-word': 'serif', sentence: 'serif' };
const PILL = '#FBF3E2';
const PILL_INK = '#1C1A17';
const PILL_UPCOMING = '#A39D92';
const SENTENCE_INK = 'rgb(255,253,248)';
const SENTENCE_STROKE = 'rgb(18,14,10)';
const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * The caption look to draw, read from expect.caption_look. Never throws: every
 * value this version cannot use is dropped with a warning.
 */
function readLook(raw, brand, log) {
  const look = { preset: 'plate', max_words: null, max_words_set: false, y: null, font: null, highlight: [], highlight_color: null, case: null, skip_first_scene: false };
  if (raw === undefined || raw === null) return finishLook(look, brand, log);
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    log.warn('caption look is not an object; drawing plate captions', { caption_look: raw });
    return finishLook(look, brand, log);
  }
  const drop = (key, why) => log.warn(`caption look ${key} ignored: ${why}`, { [key]: raw[key] });
  if (raw.preset !== undefined) {
    if (PRESETS.has(raw.preset)) look.preset = raw.preset;
    else log.warn(`unknown caption look preset ${JSON.stringify(raw.preset)}; drawing plate captions`, { preset: raw.preset });
  }
  if (raw.max_words !== undefined) {
    if (Number.isInteger(raw.max_words) && raw.max_words >= 1 && raw.max_words <= 8) {
      look.max_words = raw.max_words;
      look.max_words_set = true;
    }
    else drop('max_words', 'not a whole number from 1 to 8');
  }
  if (raw.y !== undefined) {
    if (typeof raw.y === 'number' && Number.isFinite(raw.y)) {
      look.y = Math.min(0.82, Math.max(0.4, raw.y));
      if (look.y !== raw.y) log.warn('caption look y clamped to 0.40-0.82', { y: raw.y, used: look.y });
    } else drop('y', 'not a number');
  }
  if (raw.font !== undefined) {
    if (['sans_bold', 'serif', 'rounded', 'brand'].includes(raw.font)) look.font = raw.font;
    else drop('font', 'not sans_bold, serif, rounded or brand');
  }
  if (raw.highlight !== undefined) {
    if (Array.isArray(raw.highlight)) {
      for (const h of raw.highlight) {
        if ((h === 'brand' || h === 'cta') && !look.highlight.includes(h)) look.highlight.push(h);
        else if (h !== 'brand' && h !== 'cta') drop('highlight', `${JSON.stringify(h)} is not brand or cta`);
      }
    } else drop('highlight', 'not a list');
  }
  if (raw.highlight_color !== undefined) {
    if (typeof raw.highlight_color === 'string' && HEX.test(raw.highlight_color)) look.highlight_color = raw.highlight_color;
    else drop('highlight_color', 'not a #RRGGBB colour');
  }
  if (raw.case !== undefined) {
    if (['as_written', 'lower', 'upper'].includes(raw.case)) look.case = raw.case;
    else drop('case', 'not as_written, lower or upper');
  }
  if (raw.skip_first_scene !== undefined) {
    if (typeof raw.skip_first_scene === 'boolean') look.skip_first_scene = raw.skip_first_scene;
    else drop('skip_first_scene', 'not true or false');
  }
  return finishLook(look, brand, log);
}

function finishLook(look, brand, log) {
  if (look.y === null) look.y = DEFAULT_Y[look.preset];
  if (look.case === null) look.case = look.preset === 'pill' ? 'lower' : 'as_written';
  if (look.preset === 'serif-word' && look.max_words_set && look.max_words !== 1) {
    if (log) log.warn('caption look max_words ignored: serif-word shows one word at a time', { max_words: look.max_words });
    look.max_words = 1;
  }
  if (!look.max_words) look.max_words = DEFAULT_WORDS[look.preset];
  if (CAPPED.has(look.preset) && look.max_words > MAX_OUTLINED) {
    if (log) log.warn(`caption look max_words cut to ${MAX_OUTLINED} for ${look.preset} captions`, { max_words: look.max_words });
    look.max_words = MAX_OUTLINED;
  }
  if (!look.highlight_color) {
    const primary = brand && brand.colors && brand.colors.primary;
    look.highlight_color = typeof primary === 'string' && HEX.test(primary) ? primary : '#FFD400';
  }
  return look;
}

function syllables(w) {
  const s = String(w).toLowerCase().replace(/[^a-z]/g, '');
  const n = s ? (s.match(/[aeiouy]+/g) || []).length : 1;
  return Math.max(1, n - (s.endsWith('e') && n > 1 ? 1 : 0));
}

/** Plate groups of 1 to `per` words, the way caption-burn groups them for a line spanning `span` seconds. */
function plateGroups(words, span, per, strict) {
  const n = Math.max(1, Math.min(per, Math.round(words.length / Math.max(1, span / 0.6))));
  const groups = [];
  for (let i = 0; i < words.length; i += n) groups.push(words.slice(i, i + n));
  // A lone last word joins the group before it (caption-burn's rule); with a max_words the look set, only
  // while that group stays within it.
  if (groups.length > 1 && groups.at(-1).length === 1 && groups.at(-2).length < (strict ? per : per + 1)) {
    const tail = groups.pop();
    groups[groups.length - 1] = groups.at(-1).concat(tail);
  }
  return groups;
}

/**
 * Stroke and karaoke groups: phrases end at punctuation or a pause over 0.6 s, and each phrase is cut into
 * the fewest groups of at most `per` words, of near-equal size.
 */
function phraseGroups(words, per) {
  const phrases = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    if (!next || /[.!?,;:]["')\]]*$/.test(w.text) || next.start_s - w.end_s > 0.6) {
      phrases.push(cur);
      cur = [];
    }
  });
  const groups = [];
  for (const p of phrases) {
    const n = Math.ceil(p.length / per);
    let at = 0;
    for (let g = 0; g < n; g++) {
      const size = Math.ceil((p.length - at) / (n - g));
      groups.push(p.slice(at, at + size));
      at += size;
    }
  }
  return groups;
}

/**
 * Sentence groups: the words of every line in time order, cut after each word that ends a sentence
 * (. ! ?), so a sentence sung across several lines is one caption; a sentence longer than `per` words is
 * cut into the fewest near-equal parts.
 */
function sentenceGroups(words, per) {
  const sentences = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(w);
    if (i === words.length - 1 || /[.!?]["'’”)\]]*$/.test(w.text)) {
      sentences.push(cur);
      cur = [];
    }
  });
  const groups = [];
  for (const p of sentences) {
    const n = Math.ceil(p.length / per);
    let at = 0;
    for (let g = 0; g < n; g++) {
      const size = Math.ceil((p.length - at) / (n - g));
      groups.push(p.slice(at, at + size));
      at += size;
    }
  }
  return groups;
}

const DASH = /^[-\u2013\u2014]+$/;
const OPENING = /^[\u201c\u2018([{]+$/;

/**
 * The 1.3.0 presets' words with no letter or digit (a dash, a lone quote or full stop) folded into the word
 * before them, so no caption or word state is only punctuation; an opening quote or bracket (a straight quote
 * when its quotes so far are balanced) and marks before the first word go on the word after. Marks after the
 * last word stay on it, so no character is lost. Empty words are dropped.
 */
function foldMarks(words) {
  const out = [];
  let lead = null;
  let doubles = 0;
  let single = false;
  const back = (text, end_s) => {
    const prev = out.at(-1);
    prev.text = DASH.test(text) ? `${prev.text} ${text}` : `${prev.text}${text}`;
    prev.end_s = Math.max(prev.end_s, end_s);
  };
  for (const w of words) {
    const text = String(w.text || '').trim();
    if (!text) continue;
    if (/[\p{L}\p{N}]/u.test(text)) {
      const word = { ...w, text: lead ? `${lead.text}${DASH.test(lead.text) ? ' ' : ''}${text}` : text, start_s: lead ? Math.min(lead.start_s, w.start_s) : w.start_s };
      lead = null;
      doubles += (text.match(/"/g) || []).length;
      if (/^['\u2018]/.test(word.text) && !/['\u2019]$/.test(word.text)) single = true;
      else if (/['\u2019]$/.test(word.text)) single = false;
      out.push(word);
      continue;
    }
    const opens = OPENING.test(text) || (text === '"' && doubles % 2 === 0) || (text === "'" && !single);
    doubles += (text.match(/"/g) || []).length;
    if (text === "'") single = opens;
    if (out.length && !opens) back(text, w.end_s);
    else lead = { text: lead ? `${lead.text}${text}` : text, start_s: lead ? lead.start_s : w.start_s };
  }
  if (lead && out.length) back(lead.text, out.at(-1).end_s);
  return out;
}

/** Serif-word groups: one word each, except that the words of one brand name stay together. */
function serifGroups(words) {
  const groups = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const same = prev && w.brand !== undefined && w.brand === prev.brand;
    if (same) groups.at(-1).push(w);
    else groups.push([w]);
  });
  return groups;
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
  return kitHeardWords(result.json);
}

/** A word reduced to what a highlight phrase is matched on. */
function matchKey(text) {
  return String(text)
    .toLowerCase()
    .replace(/['’]s$/, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

/** The phrases a look highlights: the brand name and the call to action, as match keys joined. */
function highlightPhrases(look, brand) {
  const out = [];
  if (look.highlight.includes('brand') && brand.name) out.push(brand.name);
  if (look.highlight.includes('cta') && brand.cta && brand.cta.text) out.push(brand.cta.text);
  return out.map((p) => p.split(/\s+/).map(matchKey).join('')).filter(Boolean);
}

/**
 * Marks words (in order) that spell one of `phrases`, however many words it takes ("Drink AG1" or
 * "DrinkAG1"): `mark(word, index of the run's first word)`.
 */
function markPhrases(words, phrases, mark) {
  if (!phrases.length) return;
  const keys = words.map((w) => matchKey(w.text));
  for (let i = 0; i < words.length; i++) {
    if (!keys[i]) continue;
    let joined = '';
    for (let j = i; j < words.length; j++) {
      joined += keys[j];
      if (phrases.includes(joined)) for (let k = i; k <= j; k++) mark(words[k], i);
      if (!phrases.some((p) => p.startsWith(joined))) break;
    }
  }
}

/** The span the layer must leave clear: the timeline's end card, when it has one. */
function endCardOf(timeline, duration) {
  const ec = timeline.end_card;
  if (!ec || !Number.isFinite(ec.start_s) || !Number.isFinite(ec.end_s) || ec.end_s <= ec.start_s) return null;
  return { start_s: Math.max(0, ec.start_s), end_s: Math.min(duration, ec.end_s) };
}

/** The timed lines to caption, before grouping: [{start, end, words, scene_id}]. */
async function timedLines(ctx, inputs) {
  const speech = (inputs.timeline.speech || []).filter((s) => String(s.text || '').trim());
  if (speech.length && speech.every((s) => (s.words || []).length)) {
    return speech.map((s) => ({ start: s.start_s, end: s.end_s, words: s.words, scene_id: s.scene_id }));
  }
  const heard = await transcribe(ctx, inputs.video);
  if (speech.length) {
    let from = 0;
    return speech.map((s) => {
      const placed = (s.words || []).length ? { words: s.words, next: from } : kitHeardPlace(s.text, s.start_s, s.end_s, heard, from);
      if (placed) {
        from = placed.next;
        return { start: s.start_s, end: s.end_s, words: placed.words, scene_id: s.scene_id };
      }
      ctx.log.warn('caption line timed from syllables', { scene_id: s.scene_id || null });
      return { start: s.start_s, end: s.end_s, words: estimateWords(s.text, s.start_s, s.end_s), scene_id: s.scene_id };
    });
  }
  if (!heard.length) throw ctx.error('bad_input', 'nothing was said to caption');
  return [{ start: heard[0].start, end: heard.at(-1).end, words: heard.map((w) => ({ text: w.text, start_s: w.start, end_s: w.end })) }];
}

/**
 * Drops the first scene's words when the look asks: every line tagged with the first scene's id and, when the
 * scene has an end time, every word mostly inside it. Returns the lines left and the time no caption may start
 * before (the first scene's end, else 0).
 */
function skipFirstScene(lines, timeline) {
  const first = (timeline.scenes || [])[0];
  if (!first) return { lines: lines.slice(1), floor: 0 };
  let left = lines.filter((l) => l.scene_id === undefined || l.scene_id === null || l.scene_id !== first.id);
  const end = Number.isFinite(first.end_s) ? first.end_s : null;
  if (end !== null) {
    left = left.map((l) => ({ ...l, words: l.words.filter((w) => (w.start_s + w.end_s) / 2 >= end) })).filter((l) => l.words.length);
  }
  return { lines: left, floor: end || 0 };
}

/**
 * Every caption cue [{words, start_s, end_s, states}] for the cut. A cue's states are the images it shows:
 * one for plate and stroke, one per spoken word for karaoke. No cue reaches into the end card; the last
 * one before it holds to its start, else to the end of the cut.
 */
async function buildCues(ctx, inputs, duration, look) {
  let lines = await timedLines(ctx, inputs);
  const endCard = endCardOf(inputs.timeline, duration);
  const said = lines.some((l) => l.words.length);
  let floor = 0;
  if (look.skip_first_scene) ({ lines, floor } = skipFirstScene(lines, inputs.timeline));
  // The caption track stops for good where the end card starts: nothing is captioned from there on.
  const inCard = (t) => endCard && t >= endCard.start_s - 1e-6;
  const phrases = highlightPhrases(look, inputs.brand);
  const brandName = inputs.brand.name ? [inputs.brand.name.split(/\s+/).map(matchKey).join('')].filter(Boolean) : [];
  const cues = [];
  const kept = [];
  const sentenceLines = [];
  for (const line of lines) {
    let words = line.words.filter((w) => !inCard(w.start_s)).map((w) => ({ text: w.text, start_s: w.start_s, end_s: w.end_s, hi: false }));
    if (NEW_PRESETS.has(look.preset)) words = foldMarks(words);
    if (!words.length) continue;
    markPhrases(words, phrases, (w) => {
      w.hi = true;
    });
    if (look.preset === 'pill' || look.preset === 'serif-word') {
      markPhrases(words, brandName, (w, at) => {
        w.brand = at;
      });
    }
    kept.push(...words);
    if (look.preset === 'sentence') {
      sentenceLines.push({ start: words[0].start_s, words });
      continue;
    }
    let groups;
    if (look.preset === 'plate') groups = plateGroups(words, line.end - line.start, look.max_words, look.max_words_set);
    else if (look.preset === 'serif-word') groups = serifGroups(words);
    else groups = phraseGroups(words, look.max_words);
    for (const g of groups) cues.push({ words: g, start_s: g[0].start_s, end_s: g.at(-1).end_s });
  }
  if (look.preset === 'sentence') {
    // Lines in time order, each line's words in its own order: lines that overlap are never interleaved.
    const ordered = sentenceLines.sort((a, b) => a.start - b.start).flatMap((l) => l.words);
    for (const g of sentenceGroups(ordered, look.max_words)) cues.push({ words: g, start_s: g[0].start_s, end_s: g.at(-1).end_s });
  }
  if (!cues.length) {
    if (!said) throw ctx.error('bad_input', 'nothing was said to caption');
    // Every word fell on the end card or the skipped first scene: the cut is returned with no captions.
    ctx.log.warn('nothing to caption outside the end card and the skipped first scene; no captions drawn');
    return { cues: [], words: kept };
  }
  cues.sort((a, b) => a.start_s - b.start_s);
  for (let i = 0; i < cues.length - 1; i++) {
    // A sentence stays up until the next one starts.
    if (look.preset === 'sentence') {
      cues[i].end_s = Math.max(cues[i].start_s, cues[i + 1].start_s);
      continue;
    }
    // Close small gaps so captions do not flicker off, never overlapping the next.
    cues[i].end_s = Math.max(cues[i].end_s, Math.min(cues[i + 1].start_s, cues[i].end_s + 0.5));
    cues[i].end_s = Math.min(cues[i].end_s, cues[i + 1].start_s);
  }
  cues.at(-1).end_s = Math.max(cues.at(-1).end_s, duration);
  for (const c of cues) {
    c.start_s = Math.max(0, floor, Math.min(c.start_s, duration));
    c.end_s = Math.max(c.start_s, Math.min(c.end_s, duration));
    // The held caption (or any cue running on) stops where the end card starts.
    if (endCard) c.end_s = Math.max(c.start_s, Math.min(c.end_s, endCard.start_s));
  }
  const live = cues.filter((c) => c.end_s - c.start_s > 1e-3);
  for (const c of live) {
    if (!WORD_STATES.has(look.preset)) {
      c.states = [{ start_s: c.start_s, end_s: c.end_s, active: -1 }];
      continue;
    }
    c.states = [];
    let t = c.start_s;
    c.words.forEach((w, k) => {
      const next = k + 1 < c.words.length ? Math.max(t, Math.min(c.end_s, c.words[k + 1].start_s)) : c.end_s;
      if (next - t > 1e-3) c.states.push({ start_s: t, end_s: next, active: k });
      t = next;
    });
  }
  return { cues: live, words: kept };
}

function fontFormat(path) {
  const m = /\.(ttf|otf|woff2?)$/i.exec(path || '');
  return { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' }[(m ? m[1] : 'ttf').toLowerCase()];
}

/**
 * The font file to draw with. `sans_bold`, `serif` and `rounded` are the bundled faces; `brand` is the brand's
 * body or heading face. With no font named, pill, serif-word and sentence use their own bundled face, and the
 * other presets the brand's face, else the bundled sans.
 */
function fontFile(look, brand, partDir, log) {
  const face = (name) => ({ path: join(partDir, 'assets', 'fonts', FACES[name]) });
  if (FACES[look.font]) return face(look.font);
  const bundled = face(PRESET_FACE[look.preset] || 'sans_bold');
  const fonts = brand.fonts || {};
  const own = fonts.body || fonts.heading;
  if (!own && look.font === 'brand') log.warn('caption look asks for the brand font but the brand has none; using the bundled font');
  if (look.font !== 'brand' && PRESET_FACE[look.preset]) return bundled;
  return own || bundled;
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

function caseOf(text, look) {
  if (look.case === 'upper') return text.toUpperCase();
  if (look.case === 'lower') return text.toLowerCase();
  return text;
}

/**
 * The words of a cue as drawn (and written to the WebVTT): in the look's case, except that a lower-case pill
 * keeps the brand name as written; a serif-word caption that is a highlighted brand name is quoted.
 */
function cueTexts(c, look) {
  const texts = c.words.map((w) => (look.preset === 'pill' && look.case === 'lower' && w.brand !== undefined ? w.text : caseOf(w.text, look)));
  if (look.preset === 'serif-word' && c.words.every((w) => w.hi && w.brand !== undefined)) {
    texts[0] = `\u201c${texts[0].replace(/^["'\u201c\u2018(]+/, '')}`;
    const last = texts.length - 1;
    texts[last] = `${texts[last].replace(/[.,!?;:"'\u201d\u2019)]+$/, '')}\u201d`;
  }
  return texts;
}

/** The box style of each preset's caption. */
function boxCss(W, H, px, look) {
  if (look.preset === 'plate') {
    return `white-space:nowrap;width:max-content;background:${PLATE};padding:${Math.round(px * 0.22)}px ${Math.round(px * 0.46)}px;border-radius:${Math.round(px * 0.3)}px;`;
  }
  if (look.preset === 'pill') {
    return `white-space:nowrap;width:max-content;color:${PILL_INK};background:${PILL};padding:${Math.round(px * 0.24)}px ${Math.round(px * 0.6)}px;border-radius:${px * 2}px;box-shadow:0 ${Math.round(px * 0.08)}px ${Math.round(px * 0.35)}px rgba(0,0,0,0.28);font-synthesis:none;`;
  }
  if (look.preset === 'serif-word') {
    // A black outline 0.0047 of the height outside the letters (measured off the reference).
    const o = Math.max(2, Math.round(0.0047 * H));
    return `white-space:nowrap;width:max-content;padding:${o}px ${o}px;-webkit-text-stroke:${o * 2}px #000;paint-order:stroke fill;font-synthesis:none;`;
  }
  if (look.preset === 'sentence') {
    // A 5 px dark outline at 1920 high.
    const o = Math.max(2, Math.round(0.0026 * H));
    return `white-space:normal;width:max-content;text-align:center;text-wrap:balance;line-height:1.3;color:${SENTENCE_INK};padding:${o}px ${o * 2}px;-webkit-text-stroke:${o * 2}px ${SENTENCE_STROKE};paint-order:stroke fill;font-synthesis:none;`;
  }
  const outline = Math.max(2, Math.round(px * 0.12));
  return `white-space:normal;width:max-content;text-align:center;text-wrap:balance;padding:${outline}px ${outline * 2}px;-webkit-text-stroke:${outline * 2}px #000;paint-order:stroke fill;`;
}

/**
 * The caption page: one #cap box of word spans. .hi words and the .on (spoken karaoke) word take the
 * highlight colour; .up (a pill word still to come) is grey; .hide (a sentence word not yet said) keeps its
 * place but is not drawn.
 */
function pageHtml(W, H, px, look, fontUri, fontPath) {
  const box = boxCss(W, H, px, look);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:KitCaption;src:url(${fontUri}) format('${fontFormat(fontPath)}');font-display:block;}
html,body{margin:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden;}
#cap{position:absolute;left:0;top:0;display:inline-block;box-sizing:border-box;font-family:KitCaption;font-weight:700;font-size:${px}px;line-height:1.15;color:#fff;${box}}
#cap.off{display:none;}
#cap .hi,#cap .on{color:${look.highlight_color};}
#cap .up{color:${PILL_UPCOMING};}
#cap .hide{visibility:hidden;}
</style></head><body><div id="cap" class="off"></div></body></html>`;
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  if (!ctx.browser) throw ctx.error('needs_missing', 'captions are drawn in the kit browser');
  const look = readLook(inputs.expect.caption_look, inputs.brand, ctx.log);
  const info = await ctx.tools.probe(inputs.video.path);
  const W = info.width;
  const H = info.height;
  const fps = info.fps || inputs.timeline.fps || 30;
  const duration = await kitDuration(ctx, inputs.video);
  const { cues, words } = await buildCues(ctx, inputs, duration, look);
  // Outlined captions have no plate to carry them, so they are set 15 % larger; the 1.3.0 presets have their own sizes.
  const px = SIZE[look.preset] ? Math.round(SIZE[look.preset] * H) : Math.round(CAP * H * 1.38 * (look.preset === 'plate' ? 1 : 1.15));
  // How a caption is set: plate as in 1.1.0; pill and serif-word on one line; stroke and karaoke on up to two
  // lines; sentence on up to three, its last line centred on y and growing upward.
  const fit = look.preset === 'plate' ? 'plate' : look.preset === 'pill' || look.preset === 'serif-word' ? 'line' : 'wrap';
  const lines = look.preset === 'sentence' ? 3 : 2;
  const lh = look.preset === 'sentence' ? 1.3 : 1.15;
  const zone = band(inputs.timeline, W, H);
  if (zone.bottom - zone.top < px * 1.5) throw ctx.error('bad_input', 'the caption safe zone is too small for a caption');
  const font = fontFile(look, inputs.brand, ctx.part.dir, ctx.log);
  const fontUri = `data:font/ttf;base64,${(await readFile(font.path)).toString('base64')}`;
  const page = pageHtml(W, H, px, look, fontUri, font.path);

  const browser = await ctx.browser.launch();
  const drawn = new Map();
  const blank = join(ctx.tmpDir, 'blank.png');
  const keyOf = (c, active) => JSON.stringify([cueTexts(c, look), c.words.map((w) => w.hi), active]);
  try {
    const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await p.setContent(page);
    // Fonts load only when text uses them, so load the caption face before anything is measured.
    const loaded = await p.evaluate(async (size) => {
      const faces = await document.fonts.load(`700 ${size}px KitCaption`);
      await document.fonts.ready;
      return faces.length;
    }, px);
    if (!loaded) throw ctx.error('tool_failed', 'the caption font did not load');
    await p.screenshot({ path: blank, type: 'png', omitBackground: true });
    for (const c of cues) {
      if (c.states.every((s) => drawn.has(keyOf(c, s.active)))) continue;
      const placed = await p.evaluate(
        async ({ words, fit, lines, lh, bottomAnchor, px, top, bottom, y, left, right }) => {
          const el = document.getElementById('cap');
          await document.fonts.load(`700 ${px}px KitCaption`, words.map((w) => w.text).join(' '));
          el.replaceChildren();
          words.forEach((w, i) => {
            if (i) el.appendChild(document.createTextNode(' '));
            const s = document.createElement('span');
            s.textContent = w.text;
            if (w.hi) s.className = 'hi';
            el.appendChild(s);
          });
          el.classList.remove('off');
          const room = right - left;
          el.style.fontSize = '';
          el.style.padding = '';
          el.style.borderRadius = '';
          el.style.maxWidth = '';
          el.style.webkitTextStrokeWidth = '';
          const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
          const padY = parseFloat(getComputedStyle(el).paddingTop) || 0;
          const stroke = parseFloat(getComputedStyle(el).webkitTextStrokeWidth) || 0;
          const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
          let r = el.getBoundingClientRect();
          if (fit === 'plate') {
            // A plate caption is one line; one wider than the band is set smaller to fit rather than
            // wrapping or leaving the frame. Its natural width is measured and it is resized, not
            // transformed, so the drawn plate is exactly the measured box.
            if (r.width > room) {
              const k = Math.floor((room / r.width) * 1000) / 1000;
              el.style.fontSize = `${px * k}px`;
              el.style.padding = `${Math.round(padY * k)}px ${Math.round(pad * k)}px`;
              el.style.borderRadius = `${Math.round(radius * k)}px`;
              r = el.getBoundingClientRect();
            }
          } else if (fit === 'line') {
            // Pill and serif-word captions are one line; a caption wider than the band is set smaller, its
            // padding, corners and outline with it.
            if (r.width > room) {
              const k = Math.floor((room / r.width) * 1000) / 1000;
              el.style.fontSize = `${px * k}px`;
              el.style.padding = `${Math.round(padY * k)}px ${Math.round(pad * k)}px`;
              el.style.borderRadius = `${Math.round(radius * k)}px`;
              if (stroke) el.style.webkitTextStrokeWidth = `${Math.max(1, stroke * k)}px`;
              r = el.getBoundingClientRect();
            }
          } else {
            // Outlined captions wrap to at most `lines` lines inside the band, then shrink until they fit.
            el.style.maxWidth = `${room}px`;
            let size = px;
            const fits = () => {
              const lineH = size * lh;
              const h = el.getBoundingClientRect().height;
              // At most `lines` lines, and never taller than the band (a short band shrinks the words further).
              return el.scrollWidth <= room + 0.5 && h <= lineH * lines + padY * 2 + 1 && h <= bottom - top + 0.5;
            };
            for (let i = 0; i < 40 && !fits(); i++) {
              size *= 0.94;
              const k = size / px;
              el.style.fontSize = `${size}px`;
              el.style.padding = `${Math.round(padY * k)}px ${Math.round(pad * k)}px`;
              el.style.webkitTextStrokeWidth = `${Math.max(1, stroke * k)}px`;
            }
            r = el.getBoundingClientRect();
          }
          const w = r.width;
          const h = r.height;
          let t = Math.min(Math.max(y - h / 2, top), bottom - h);
          if (bottomAnchor) {
            // The last line's centre sits on y; a longer caption grows upward.
            const cs = getComputedStyle(el);
            const last = parseFloat(cs.fontSize) * lh;
            t = Math.min(Math.max(y + last / 2 + (parseFloat(cs.paddingBottom) || 0) - h, top), bottom - h);
          }
          const l = left + (right - left - w) / 2;
          el.style.left = `${l}px`;
          el.style.top = `${t}px`;
          return { x: l, y: t, w, h };
        },
        {
          words: cueTexts(c, look).map((text, i) => ({ text, hi: c.words[i].hi })),
          fit,
          lines,
          lh,
          bottomAnchor: look.preset === 'sentence',
          px,
          top: zone.top,
          bottom: zone.bottom,
          y: look.y * H,
          left: zone.left,
          right: zone.right,
        },
      );
      c.box = placed;
      for (const s of c.states) {
        const key = keyOf(c, s.active);
        if (drawn.has(key)) continue;
        await p.evaluate(
          ({ active, preset }) => {
            [...document.querySelectorAll('#cap span')].forEach((el, i) => {
              el.classList.toggle('on', preset === 'karaoke' && i === active);
              el.classList.toggle('up', preset === 'pill' && i > active);
              el.classList.toggle('hide', preset === 'sentence' && i > active);
            });
          },
          { active: s.active, preset: look.preset },
        );
        const file = join(ctx.tmpDir, `cap-${drawn.size}.png`);
        await p.screenshot({ path: file, type: 'png', omitBackground: true });
        drawn.set(key, { file, box: placed });
      }
    }
  } finally {
    await browser.close();
  }
  for (const c of cues) if (!c.box) c.box = drawn.get(keyOf(c, c.states[0].active)).box;

  // One image per interval between state edges, each held for its own length.
  const states = cues.flatMap((c) => c.states.map((s) => ({ ...s, file: drawn.get(keyOf(c, s.active)).file })));
  const edges = [...new Set([0, duration, ...states.flatMap((s) => [s.start_s, s.end_s])])].filter((t) => t >= 0 && t <= duration).sort((a, b) => a - b);
  const list = [];
  for (let i = 0; i + 1 < edges.length; i++) {
    const [t0, t1] = [edges[i], edges[i + 1]];
    if (t1 - t0 < 1e-3) continue;
    const mid = (t0 + t1) / 2;
    const state = states.find((s) => s.start_s <= mid && mid < s.end_s);
    const file = state ? state.file : blank;
    list.push(`file '${file.replace(/'/g, "'\\''")}'`, `duration ${kitNum(t1 - t0, 4)}`);
  }
  list.push(list.at(-2));
  await writeFile(join(ctx.tmpDir, 'cues.txt'), `${list.join('\n')}\n`);
  const out = join(ctx.workDir, 'captioned.mp4');
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
    '-maxrate',
    '16M',
    '-bufsize',
    '32M',
    '-c:a',
    'copy',
    out,
  ]);
  const bytes = (await stat(out)).size;
  if (bytes > MAX_BYTES) {
    throw ctx.error('output_invalid', `the captioned video is ${Math.round(bytes / 1e6)} MB, over the 180 MB limit for an upload`);
  }

  const shown = (c) => cueTexts(c, look).join(' ');
  const vtt = ['WEBVTT', ''];
  cues.forEach((c, i) => vtt.push(String(i + 1), `${vttTime(c.start_s)} --> ${vttTime(c.end_s)}`, shown(c), ''));
  await writeFile(join(ctx.workDir, 'captions.vtt'), vtt.join('\n'));
  const record = {
    look: { preset: look.preset, max_words: look.max_words, y: look.y, case: look.case, highlight_color: look.highlight_color },
    words: words.map((w) => ({ text: w.text, start_s: +w.start_s.toFixed(3), end_s: +w.end_s.toFixed(3) })),
    cues: cues.map((c) => ({ text: shown(c), start_s: +c.start_s.toFixed(3), end_s: +c.end_s.toFixed(3), box: c.box })),
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
