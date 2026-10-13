// The speech check line by line (1.4.3). The whole script can clear its 0.90 bar with a clause lost
// where two takes join (about one word in ten), because a dropped run of words only counts through the
// ratio. So each spoken line is also compared with its own written words, and a phrase the whole script
// lost fails however long the script is. Pure: no I/O. Every top-level name starts with `chk` (bundled
// modules share one namespace).
import { speechReview, speechTokenize } from '../../_lib/speech.mjs';

// A line that loses this many words in a row, or this many more than it heard at its end, fails.
export const CHK_LINE_LOST_WORDS = 2;
// The whole script losing this many words in a row fails, whatever its ratio.
export const CHK_SCRIPT_LOST_WORDS = 3;

function chkJoined(words) {
  return words.join('');
}

/** The run of a review's issues that lost words: {words, text} for each, in order. */
function chkLostRuns(verdict, scriptWords, min) {
  const out = [];
  const withScript = verdict.issues.filter((i) => i.script_words.length);
  const last = withScript.at(-1);
  for (const i of withScript) {
    if (i.kind === 'dropped' && i.script_words.length >= min) out.push({ words: i.script_words, text: i.script_text });
    else if (i === last && i.kind === 'substitution' && i.script_words.length - i.heard_words.length >= min && chkJoined(scriptWords).endsWith(chkJoined(i.script_words))) {
      // The line's end was said as fewer, different words: its last words are lost.
      out.push({ words: i.script_words, text: i.script_text });
    }
  }
  return out;
}

/**
 * The first spoken line that lost words: {index, scene_id, text} or null. A line is compared with what was
 * heard for it (`spoken`) when it names its scene and was heard; lost words heard at the edge of the line
 * before or after it were only placed with the wrong line, so they do not count.
 */
export function chkLineLoss(speech, aliases) {
  const lines = (speech || []).filter((s) => s && s.scene_id != null && typeof s.spoken === 'string' && String(s.text || '').trim());
  for (const [n, e] of lines.entries()) {
    const verdict = speechReview(e.text, e.spoken, { aliases });
    for (const lost of chkLostRuns(verdict, speechTokenize(e.text, aliases), CHK_LINE_LOST_WORDS)) {
      const reach = lost.words.length + 2;
      const before = n > 0 ? speechTokenize(lines[n - 1].spoken, aliases).slice(-reach) : [];
      const after = n + 1 < lines.length ? speechTokenize(lines[n + 1].spoken, aliases).slice(0, reach) : [];
      const want = chkJoined(lost.words);
      if (chkJoined(before).includes(want) || chkJoined(after).includes(want)) continue;
      return { index: n, scene_id: String(e.scene_id), text: lost.text };
    }
  }
  return null;
}

/** The first phrase the whole script lost (CHK_SCRIPT_LOST_WORDS words or more in a row): {text} or null. */
export function chkScriptLoss(verdict) {
  const lost = chkLostRuns(verdict, [], CHK_SCRIPT_LOST_WORDS).find((r) => r.words.length >= CHK_SCRIPT_LOST_WORDS);
  return lost ? { text: lost.text } : null;
}
