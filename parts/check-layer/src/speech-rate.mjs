// speech_rate_vs_reference (check-layer 1.7.0): the final cut's speaking rate against the
// reference's, from two timed word lists. Words are counted as goose-studio's reference_rate.py
// counts them: whisper's sub-word tokens joined (a token not starting with a space belongs to the
// word before it, as " black" + "head"), markers such as [_BEG_] dropped, and a word with no letter
// or digit (a lone full stop or dash) not counted. A list's rate is its words over the first word's
// start to the last word's end. Every top-level name starts with `chkRate`.

export const CHK_RATE_MIN_RATIO = 0.85;
const chkRateCounted = /[\p{L}\p{N}_]/u;
const chkRateMarker = /^\s*\[.*\]\s*$/u;

function chkRateNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** The real words of a timed list: [{text, start_s, end_s}], tokens joined, markers and punctuation dropped. */
export function chkRateWords(list) {
  const items = (Array.isArray(list) ? list : []).map((w) => ({
    text: String((w && (w.text ?? w.word)) ?? ''),
    start: chkRateNum(w && (w.start_s ?? w.start)),
    end: chkRateNum(w && (w.end_s ?? w.end)),
  })).filter((w) => w.start !== null && w.end !== null && w.text.trim() && !chkRateMarker.test(w.text));
  // A token stream (whisper.cpp tokens keep their leading space) joins a token without one onto the word before.
  const tokens = items.some((w) => /^\s/u.test(w.text));
  const found = [];
  for (const w of items) {
    const pieces = w.text.split(/\s+/u).filter(Boolean);
    if (tokens && found.length && !/^\s/u.test(w.text) && pieces.length) {
      const last = found.at(-1);
      last.text += pieces.shift();
      last.end = w.end;
    }
    for (const p of pieces) found.push({ text: p, start: w.start, end: w.end });
  }
  return found.filter((w) => chkRateCounted.test(w.text));
}

/** {words, span_s, wps} for one list; wps is null under two words or with no span. */
export function chkRate(list) {
  const words = chkRateWords(list);
  if (words.length < 2) return { words: words.length, span_s: 0, wps: null };
  const span = words.at(-1).end - words[0].start;
  return { words: words.length, span_s: +span.toFixed(3), wps: span > 0 ? +(words.length / span).toFixed(3) : null };
}

/** The check: not_applicable unless both lists measure; fail when the final is more than 15 % slower. */
export function chkSpeechRateVsReference(reference, final) {
  if (!Array.isArray(reference) || !Array.isArray(final)) return { status: 'not_applicable', found: 'needs both the reference and the final word lists' };
  const ref = chkRate(reference);
  const fin = chkRate(final);
  if (!ref.wps || !fin.wps) return { status: 'not_applicable', found: 'fewer than two timed words in a list' };
  const ratio = fin.wps / ref.wps;
  const expected = `at least ${Math.round(CHK_RATE_MIN_RATIO * 100)} % of the reference's ${ref.wps.toFixed(2)} words a second`;
  const found = `${fin.wps.toFixed(2)} words a second (${(ratio * 100).toFixed(0)} % of the reference)`;
  if (ratio < CHK_RATE_MIN_RATIO - 1e-9) {
    return { status: 'fail', expected, found, message: `The voice speaks at ${fin.wps.toFixed(2)} words a second, more than 15 % slower than the reference's ${ref.wps.toFixed(2)}.` };
  }
  return { status: 'pass', expected, found };
}
