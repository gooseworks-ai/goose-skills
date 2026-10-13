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

/** Whether `run` sits in `words` as a contiguous run of whole tokens. */
function chkHasRun(words, run) {
  for (let i = 0; i + run.length <= words.length; i++) {
    if (run.every((t, k) => words[i + k] === t)) return true;
  }
  return false;
}

function chkStartsWith(words, run) {
  return run.length <= words.length && run.every((t, k) => words[k] === t);
}

function chkEndsWith(words, run) {
  return run.length <= words.length && run.every((t, k) => words[words.length - run.length + k] === t);
}

/** The run of a review's issues that lost words: {words, text} for each, in order. */
function chkLostRuns(verdict, scriptWords, min) {
  const out = [];
  const withScript = verdict.issues.filter((i) => i.script_words.length);
  const last = withScript.at(-1);
  for (const i of withScript) {
    if (i.kind === 'dropped' && i.script_words.length >= min) out.push({ words: i.script_words, text: i.script_text });
    else if (i === last && i.kind === 'substitution' && i.script_words.length - i.heard_words.length >= min && chkEndsWith(scriptWords, i.script_words)) {
      // The line's end was said as fewer, different words: its last words are lost.
      out.push({ words: i.script_words, text: i.script_text });
    }
  }
  return out;
}

/**
 * The first spoken line that lost words: {index, scene_id, line, text, occurrence} or null, `index` its place
 * among the lines that name a scene and `occurrence` how many lines before it have the same words. A line is compared with what was heard for it (`spoken`) when it names its scene
 * and words were placed with it; a line with none placed (the transcriber could not match it, so its words
 * went to a later line) is left to the whole-script checks. A run lost from a line's start that the nearest
 * heard line before it ends with, or from its end that the nearest heard line after it starts with, was only
 * placed with the wrong line, so it does not count; a run lost from the middle always counts.
 */
export function chkLineLoss(speech, aliases) {
  const named = (speech || []).filter((s) => s && s.scene_id != null && String(s.text || '').trim());
  const heard = named.map((s) => (typeof s.spoken === 'string' ? speechTokenize(s.spoken, aliases) : null));
  const near = (n, step) => {
    for (let k = n + step; k >= 0 && k < named.length; k += step) if (heard[k] && heard[k].length) return heard[k];
    return [];
  };
  for (const [n, e] of named.entries()) {
    if (!heard[n] || !heard[n].length) continue;
    const words = speechTokenize(e.text, aliases);
    const verdict = speechReview(e.text, e.spoken, { aliases });
    for (const lost of chkLostRuns(verdict, words, CHK_LINE_LOST_WORDS)) {
      const reach = lost.words.length + 2;
      if (chkStartsWith(words, lost.words) && chkHasRun(near(n, -1).slice(-reach), lost.words)) continue;
      if (chkEndsWith(words, lost.words) && chkHasRun(near(n, 1).slice(0, reach), lost.words)) continue;
      // Which of the lines with these same words it is, so a repeated line is numbered as the one that lost them.
      const occurrence = named.slice(0, n).filter((o) => speechTokenize(o.text, aliases).join(' ') === words.join(' ')).length;
      return { index: n, scene_id: String(e.scene_id), line: String(e.text), text: lost.text, occurrence };
    }
  }
  return null;
}

/**
 * The first phrase the whole script lost (CHK_SCRIPT_LOST_WORDS words or more in a row): {text} or null.
 * `scriptWords` is the reviewed script, tokenized: its end said as fewer words counts as lost.
 */
export function chkScriptLoss(verdict, scriptWords) {
  const lost = chkLostRuns(verdict, scriptWords, CHK_SCRIPT_LOST_WORDS).find((r) => r.words.length >= CHK_SCRIPT_LOST_WORDS);
  return lost ? { text: lost.text } : null;
}
