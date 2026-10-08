// Which characters a font file draws, from its cmap table, so a chat never
// falls back to a system font: text the bundled and given fonts cannot draw
// is refused instead. Reads TrueType/OpenType (sfnt) and WOFF files.
// Every top-level name starts with `pcFont`.
import { inflateSync } from 'node:zlib';

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
export function pcFontCoverage(buf) {
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
export function pcFontMissing(texts, textCoverages, emojiCoverages = []) {
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
