// Written lines placed on heard words (caption-burn's matching): each written
// word is looked for among the next five heard words; a line is placed when at
// least two thirds of its words are found, and a word the transcript writes
// differently ("200" for "two hundred") sits between its found neighbours.
// Shared by the captions layer and the transcribe part.
// Every top-level name starts with `kitHeard`.

/** A word reduced for matching: letters, digits and apostrophes, lower case. */
export function kitHeardKey(w) {
  return String(w).replace(/[^\p{L}\p{N}']/gu, '').toLowerCase();
}

/** fal Whisper's word chunks as [{text, start, end, key}], dropping untimed ones. */
export function kitHeardWords(json) {
  const chunks = (json && json.chunks) || [];
  return chunks
    .map((c) => ({ text: String(c.text || '').trim(), start: c.timestamp && c.timestamp[0], end: c.timestamp && c.timestamp[1] }))
    .filter((w) => w.text && Number.isFinite(w.start) && Number.isFinite(w.end))
    .map((w) => ({ ...w, key: kitHeardKey(w.text) }));
}

/**
 * `text`'s written words with times from `heard`, searching from index `from`;
 * `start`/`end` bound the words found at neither edge. Returns
 * { words: [{text, start_s, end_s}], next } or null when too few words match.
 */
export function kitHeardPlace(text, start, end, heard, from) {
  const words = String(text).split(/\s+/).filter(Boolean);
  let j = from;
  const spans = words.map((w) => {
    const k = kitHeardKey(w);
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
  if (!words.length || known.length < Math.max(1, Math.floor((words.length * 2) / 3))) return null;
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
