// Scene spans from what was heard (the old create-creator-takes-h3
// align_beats.py): a scene's span is set by its line's heard words, so a cut
// placed on the spans lands on the words the creator actually says, not on the
// script's estimate. Each boundary between two spoken scenes goes midway
// between the last word of one and the first word of the next; scenes still
// tile 0 to the end of the cut, and the last scene runs to the end.
//
// The heard words are found by one alignment of the whole script on the whole
// transcript (a longest common subsequence), after both are spelled the same
// way: numbers as words ("200" and "two hundred"), contractions opened ("don't"
// and "do not"), hyphens split, punctuation dropped. A line's anchors are its
// first and last heard words, never a guessed time for a word that was not
// heard.
//
// Scenes without a line (silent scenes) share the gap they sit in: a gap with
// k silent scenes is cut into k + 2 equal slots, so the spoken scene before it
// holds for one slot, each silent scene gets one, and the next spoken scene
// leads in for one. Silent scenes at the start split the time before the first
// word; silent scenes at the end follow a short hold after the last word.

/** How long the last spoken scene holds after its final word when silent scenes follow it. */
export const RETIME_HOLD_S = 0.45;
/** Under this share of the script's words heard, the cut does not say the script. */
export const RETIME_MIN_HEARD = 0.7;

const r3 = (n) => +Number(n).toFixed(3);

const RETIME_ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const RETIME_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const RETIME_SCALES = [
  [1e9, 'billion'],
  [1e6, 'million'],
  [1e3, 'thousand'],
];

/** A whole number under a trillion as words: 250 → ['two', 'hundred', 'fifty']. */
export function retimeNumberWords(n) {
  if (n < 20) return [RETIME_ONES[n]];
  if (n < 100) return [RETIME_TENS[Math.floor(n / 10)], ...(n % 10 ? [RETIME_ONES[n % 10]] : [])];
  if (n < 1000) return [RETIME_ONES[Math.floor(n / 100)], 'hundred', ...(n % 100 ? retimeNumberWords(n % 100) : [])];
  for (const [size, name] of RETIME_SCALES) {
    if (n >= size) return [...retimeNumberWords(Math.floor(n / size)), name, ...(n % size ? retimeNumberWords(n % size) : [])];
  }
  return [String(n)];
}

const RETIME_OPEN = [
  [/^won't$/, ['will', 'not']],
  [/^can't$/, ['can', 'not']],
  [/^cannot$/, ['can', 'not']],
  [/^(.+)n't$/, (m) => [m[1], 'not']],
  [/^(.+)'re$/, (m) => [m[1], 'are']],
  [/^(.+)'m$/, (m) => [m[1], 'am']],
  [/^(.+)'ll$/, (m) => [m[1], 'will']],
  [/^(.+)'ve$/, (m) => [m[1], 'have']],
  [/^(.+)'d$/, (m) => [m[1], 'would']],
  [/^(.+)'s$/, (m) => [m[1], 'is']],
];

/**
 * One written or heard word as the keys it is compared by, so the script and
 * Whisper spell it the same way: lower case, contractions opened, numbers,
 * `%`, `$` and `&` as words, hyphens and slashes split, other punctuation
 * dropped. "$200" → ['two', 'hundred', 'dollars']; "Don't" → ['do', 'not'].
 */
export function retimeKeys(word) {
  let w = String(word).toLowerCase().replace(/[‘’ʼ`]/g, "'");
  w = w.replace(/&/g, ' and ').replace(/%/g, ' percent ').replace(/\$(\d[\d,]*(?:\.\d+)?)/g, '$1 dollars ');
  const out = [];
  for (const raw of w.split(/[\s\-‐-―/]+/)) {
    const t = raw.replace(/[^\p{L}\p{N}'.,]/gu, '').replace(/^['.,]+|['.,]+$/g, '');
    if (!t) continue;
    const num = /^\d{1,3}(?:,\d{3})+$|^\d+$/.test(t) ? Number(t.replace(/,/g, '')) : null;
    if (num !== null && Number.isSafeInteger(num) && num < 1e12) {
      out.push(...retimeNumberWords(num));
      continue;
    }
    const dec = /^(\d+)\.(\d+)$/.exec(t);
    if (dec && Number(dec[1]) < 1e12) {
      out.push(...retimeNumberWords(Number(dec[1])), 'point', ...dec[2].split('').map((d) => RETIME_ONES[Number(d)]));
      continue;
    }
    const open = RETIME_OPEN.map(([re, to]) => [re.exec(t), to]).find(([m]) => m);
    const parts = open ? (typeof open[1] === 'function' ? open[1](open[0]) : open[1]) : [t];
    for (const p of parts) {
      const k = p.replace(/[^\p{L}\p{N}]/gu, '');
      if (k) out.push(k);
    }
  }
  return out;
}

/**
 * fal Whisper's chunks with a missing end time closed at the next chunk's
 * start (or the end of the cut), so a word whose end Whisper left null is
 * still heard. Returns a json with the same shape for kitHeardWords.
 */
export function retimeCloseChunks(json, duration) {
  const chunks = (json && Array.isArray(json.chunks) && json.chunks) || [];
  const closed = chunks.map((c, i) => {
    const ts = (c && c.timestamp) || [];
    const start = ts[0];
    let end = ts[1];
    if (Number.isFinite(start) && !Number.isFinite(end)) {
      const next = chunks.slice(i + 1).find((n) => n && n.timestamp && Number.isFinite(n.timestamp[0]));
      end = Math.max(start, next ? next.timestamp[0] : duration);
    }
    return { ...c, timestamp: [start, end] };
  });
  return { ...(json || {}), chunks: closed };
}

/**
 * The script aligned on the transcript. `lines` are [{scene_id, text}] in
 * plan order; `heard` is kitHeardWords' [{text, start, end}]. Returns
 * { share, anchors }: `share` is the part (0 to 1) of the script's keys found,
 * in order, among the heard keys (one misheard or dropped word cannot shift
 * everything after it), and `anchors` is [{scene_id, start_s, end_s}] for each
 * line with at least one heard word, from its first and last heard words.
 * Unmatched heard words between two lines go to whichever line has unmatched
 * written words at that edge, in proportion.
 */
export function retimeAlign(lines, heard) {
  const written = []; // [{line, key}]
  lines.forEach((l, li) => {
    for (const w of String(l.text).split(/\s+/)) for (const key of retimeKeys(w)) written.push({ line: li, key });
  });
  const said = []; // [{word, key}]
  heard.forEach((h, hi) => {
    for (const key of retimeKeys(h.text)) said.push({ word: hi, key });
  });
  if (!written.length) return { share: 1, anchors: [] };
  const n = written.length;
  const m = said.length;
  const table = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      table[i][j] = written[i - 1].key === said[j - 1].key ? table[i - 1][j - 1] + 1 : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  // Walk back for the matched pairs: written key i ↔ heard word said[j].word.
  const match = new Array(n).fill(-1);
  for (let i = n, j = m; i > 0 && j > 0; ) {
    if (written[i - 1].key === said[j - 1].key && table[i][j] === table[i - 1][j - 1] + 1) {
      match[i - 1] = said[j - 1].word;
      i--;
      j--;
    } else if (table[i - 1][j] >= table[i][j - 1]) i--;
    else j--;
  }
  const share = table[n][m] / n;

  // Per line: first and last heard word, and how many written keys at each edge went unheard.
  const found = lines.map(() => ({ first: -1, last: -1, lead: 0, tail: 0, keys: 0 }));
  written.forEach((w, i) => {
    const f = found[w.line];
    f.keys++;
    if (match[i] < 0) {
      if (f.first < 0) f.lead++;
      else f.tail++;
      return;
    }
    if (f.first < 0) f.first = match[i];
    f.last = match[i];
    f.tail = 0;
  });
  const placed = found.map((f, li) => ({ ...f, li })).filter((f) => f.first >= 0);
  if (placed.length) {
    // Heard words before the first line or after the last belong to it only when it has unheard words there.
    const head = placed[0];
    if (head.lead > 0) head.first = Math.max(0, head.first - head.lead);
    const end = placed.at(-1);
    if (end.tail > 0) end.last = Math.min(heard.length - 1, end.last + end.tail);
  }
  for (let p = 0; p + 1 < placed.length; p++) {
    const a = placed[p];
    const b = placed[p + 1];
    const gap = b.first - a.last - 1;
    if (gap <= 0 || a.tail + b.lead === 0) continue;
    const toA = Math.round((gap * a.tail) / (a.tail + b.lead));
    a.last += toA;
    b.first -= gap - toA;
  }
  const anchors = placed.map((f) => ({
    scene_id: lines[f.li].scene_id,
    start_s: r3(Math.max(0, heard[f.first].start)),
    end_s: r3(Math.max(heard[f.first].start, heard[f.last].end)),
  }));
  return { share, anchors };
}

/** The share (0 to 1) of the written lines' keys found, in order, among the heard words. */
export function retimeHeardShare(lines, heard) {
  return retimeAlign(lines, heard).share;
}

/**
 * Scene spans [{id, start_s, end_s}] for `ids` (every scene, in plan order),
 * from `anchors` (entries with scene_id, start_s, end_s for the scenes whose
 * line was heard) and the cut's `duration`. Spans tile 0 to `duration` with no
 * gaps.
 */
export function retimeSceneSpans(ids, anchors, duration) {
  const said = new Map(anchors.filter((e) => e.scene_id != null).map((e) => [String(e.scene_id), e]));
  const spoken = ids.map((id, i) => (said.has(id) ? i : -1)).filter((i) => i >= 0);
  const bounds = new Array(ids.length + 1).fill(null);
  bounds[0] = 0;
  bounds[ids.length] = duration;
  if (!spoken.length) {
    ids.forEach((_, i) => (bounds[i] = (duration * i) / ids.length));
  } else {
    const first = spoken[0];
    const f = Math.max(0, said.get(ids[first]).start_s);
    for (let i = 1; i <= first; i++) bounds[i] = (f * i) / (first + 1);
    for (let n = 0; n + 1 < spoken.length; n++) {
      const a = spoken[n];
      const b = spoken[n + 1];
      const last = said.get(ids[a]).end_s;
      const next = said.get(ids[b]).start_s;
      const k = b - a - 1;
      if (next <= last) {
        for (let i = a + 1; i <= b; i++) bounds[i] = (last + next) / 2;
        continue;
      }
      for (let j = 1; j <= k + 1; j++) bounds[a + j] = last + ((next - last) * j) / (k + 2);
    }
    const lastIdx = spoken.at(-1);
    const k = ids.length - 1 - lastIdx;
    if (k > 0) {
      const l = Math.min(said.get(ids[lastIdx]).end_s, duration);
      const hold = Math.min(RETIME_HOLD_S, (duration - l) / (k + 1));
      const from = l + hold;
      for (let j = 0; j < k; j++) bounds[lastIdx + 1 + j] = from + ((duration - from) * j) / k;
    }
  }
  // Never backwards, never past the cut.
  for (let i = 1; i <= ids.length; i++) bounds[i] = Math.min(duration, Math.max(bounds[i - 1], bounds[i]));
  bounds[ids.length] = duration;
  return ids.map((id, i) => ({ id, start_s: r3(bounds[i]), end_s: r3(bounds[i + 1]) }));
}
