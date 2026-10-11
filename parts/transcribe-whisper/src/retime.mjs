// Scene spans from what was heard (the old create-creator-takes-h3
// align_beats.py): a scene's span is set by its line's heard words, so a cut
// placed on the spans lands on the words the creator actually says, not on the
// script's estimate. Each boundary between two spoken scenes goes midway
// between the last word of one and the first word of the next; scenes still
// tile 0 to the end of the cut, and the last scene runs to the end.
//
// Scenes without a line (silent scenes) share the gap they sit in: a gap with
// k silent scenes is cut into k + 2 equal slots, so the spoken scene before it
// holds for one slot, each silent scene gets one, and the next spoken scene
// leads in for one. Silent scenes at the start split the time before the first
// word; silent scenes at the end follow a short hold after the last word.
import { kitHeardKey } from '../../_lib/heard.mjs';

/** How long the last spoken scene holds after its final word when silent scenes follow it. */
export const RETIME_HOLD_S = 0.45;
/** Under this share of the script's words heard, the cut does not say the script. */
export const RETIME_MIN_HEARD = 0.7;

const r3 = (n) => +Number(n).toFixed(3);

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
 * The share (0 to 1) of the written lines' words found, in order, among the
 * heard words: a longest common subsequence on matching keys, so one misheard
 * or dropped word cannot shift everything after it.
 */
export function retimeHeardShare(lines, heard) {
  const written = lines.flatMap((l) => String(l.text).split(/\s+/).map(kitHeardKey)).filter(Boolean);
  if (!written.length) return 1;
  const said = heard.map((w) => w.key).filter(Boolean);
  let prev = new Array(said.length + 1).fill(0);
  for (const w of written) {
    const row = new Array(said.length + 1).fill(0);
    for (let j = 1; j <= said.length; j++) row[j] = w === said[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], row[j - 1]);
    prev = row;
  }
  return prev[said.length] / written.length;
}

/**
 * Scene spans [{id, start_s, end_s}] for `ids` (every scene, in plan order),
 * from `speech` (entries with scene_id, start_s, end_s for the spoken scenes)
 * and the cut's `duration`. Spans tile 0 to `duration` with no gaps.
 */
export function retimeSceneSpans(ids, speech, duration) {
  const said = new Map(speech.filter((e) => e.scene_id != null).map((e) => [String(e.scene_id), e]));
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
