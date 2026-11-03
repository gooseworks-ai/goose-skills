// The lyric of a sung song, from the plan's scenes. A scene's `line` is the
// words sung while its picture holds; a scene with no line (null, missing or
// blank) is a silent picture. The lines, joined in scene order, are the lyric.
// Brand names the singer gets wrong are sent as their `say_as` spelling, and
// every sung word maps back to the written word captions show (the same swap
// voice-elevenlabs uses). Pure: no I/O. Every top-level name starts with `song`.
import { kitApplySayAs } from '../../_lib/speech-map.mjs';

/** An error the part turns into ctx.error(code, message). */
export function songFail(code, message) {
  const err = new Error(message);
  err.code = code;
  err.song = true;
  return err;
}

/** A scene's sung line with its whitespace collapsed, or '' for a silent scene. */
export function songLineOf(scene) {
  if (!scene || typeof scene.line !== 'string') return '';
  return scene.line.replace(/\s+/gu, ' ').trim();
}

/** A word compared without case, accents or punctuation ("Jacket," = "jacket"). */
export function songNorm(word) {
  return String(word || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * The words of every sung scene.
 *
 * - `sung`: one entry per scene with a line, in order: `{index, id, text, spoken,
 *   written: [first, last], sent: [first, last]}` (indexes into the two lists below).
 * - `sent`: every word the singer is asked to sing (after `say_as`), in order:
 *   `{text, scene_index, written: [indexes of the written words it stands for]}`.
 * - `written`: every written word, in order: `{text, scene_index, sent: [indexes]}`.
 *
 * The lyric's word count is `sent.length`; the reply's word timings are matched to it.
 */
export function songWordPlan(scenes, pronunciations) {
  const sung = [];
  const sent = [];
  const written = [];
  (scenes || []).forEach((scene, index) => {
    const text = songLineOf(scene);
    if (!text) return;
    const say = kitApplySayAs(text, pronunciations);
    const writtenSpans = [...text.matchAll(/\S+/gu)].map((m) => ({ text: m[0], from: m.index, to: m.index + m[0].length }));
    // Spoken words by code point, because say.map has one entry per code point of say.spoken.
    const sentSpans = [];
    let current = null;
    Array.from(say.spoken).forEach((c, i) => {
      if (/\s/u.test(c)) {
        current = null;
        return;
      }
      if (!current) {
        current = { text: '', from: i, to: i };
        sentSpans.push(current);
      }
      current.text += c;
      current.to = i + 1;
    });
    const firstWritten = written.length;
    for (const w of writtenSpans) written.push({ text: w.text, scene_index: index, sent: [] });
    const firstSent = sent.length;
    let lastHit = 0;
    for (const s of sentSpans) {
      const hits = new Set();
      for (let i = s.from; i < s.to; i++) {
        const range = say.map[i];
        if (!range) continue;
        writtenSpans.forEach((w, k) => {
          if (range[0] < w.to && range[1] > w.from) hits.add(k);
        });
      }
      // Every spoken character maps into a written word; the fallback only guards odd input.
      const local = hits.size ? [...hits].sort((a, b) => a - b) : [lastHit];
      lastHit = local.at(-1);
      const indexes = local.map((k) => firstWritten + k);
      sent.push({ text: s.text, scene_index: index, written: indexes });
      for (const k of indexes) written[k].sent.push(sent.length - 1);
    }
    sung.push({
      index,
      id: scene.id,
      text,
      spoken: say.spoken,
      written: [firstWritten, written.length - 1],
      sent: [firstSent, sent.length - 1],
    });
  });
  return { sung, sent, written };
}

/**
 * Lyric lines for one section: `text` split after each sentence end (. ! ? …,
 * with any closing quote or bracket), and any line longer than `maxChars` split
 * again at a comma, semicolon or space. Words are never changed or dropped, so
 * the lines hold exactly the words of `text`, in order.
 */
export function songSplitLines(text, maxChars = 200) {
  const out = [];
  const clean = String(text || '').replace(/\s+/gu, ' ').trim();
  if (!clean) return out;
  for (const sentence of clean.split(/(?<=[.!?…]["'”’)\]]*) /u)) {
    let rest = sentence.trim();
    while (rest.length > maxChars) {
      let cut = rest.lastIndexOf(' ', maxChars);
      const soft = Math.max(rest.lastIndexOf(', ', maxChars - 1), rest.lastIndexOf('; ', maxChars - 1));
      if (soft >= Math.floor(maxChars / 3)) cut = soft + 1;
      if (cut <= 0) throw songFail('bad_input', `a sung word is longer than ${maxChars} characters: "${rest.slice(0, 40)}..."`);
      out.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) out.push(rest);
  }
  return out;
}

/** How many words a lyric text holds, counted the way the reply's timings are matched. */
export function songCountWords(text) {
  return (String(text || '').match(/\S+/gu) || []).length;
}
