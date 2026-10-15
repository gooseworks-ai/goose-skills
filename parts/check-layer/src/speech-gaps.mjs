// check-layer 1.9.0: speech the script does not have (GOOSE-4034). Two ways a generated take says more
// than its lines, both passed by speech_matches_script, whose similarity bar a few extra words barely move:
//   speech_extra_words     the transcript has words the script does not: a line or word said twice, or
//                          made-up words the transcriber wrote down. Fillers (um, uh) and Whisper's own
//                          "thank you" at the very end of a clip do not count.
//   no_unscripted_speech   (a style flag) a voice where no scripted word is timed. Whisper drops sounds
//                          that are not words, so babble never reaches the transcript; it is heard here as
//                          voice-band loudness (300 Hz to 3.4 kHz, 50 ms windows) between the timed words
//                          that rises 3 dB over the median inside them for at least 0.15 s of one gap.
// Calibrated on the Graza stand-in take (ugc-product, H3, 15 Oct): its second "glugging" sits in the gap
// between lines 2 and 3 with 6 windows over the bar, alone and under three real music beds mixed by
// audio-mix 1.0.1 and levelled by the sound layer; the beds alone reach +0.3 dB at most. Six clean H3
// takes had no gap over the bar (one 50 ms spike, below the 0.15 s needed).
// Every top-level name starts with `chk` (bundled modules share one namespace).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitFfmpeg } from '../../_lib/part.mjs';

export const CHK_GAP_RATE = 16000;
export const CHK_GAP_WINDOW_S = 0.05;
// A window this close to a timed word belongs to the word (Whisper's word edges are loose).
export const CHK_GAP_GUARD_S = 0.15;
// Louder than the median inside the words by this much counts as a voice.
export const CHK_GAP_RISE_DB = 3;
// This many such windows in one gap (0.15 s) fail it; a single click or plosive does not.
export const CHK_GAP_MIN_WINDOWS = 3;
// Fewer timed-word windows than this give no reliable voice level.
export const CHK_GAP_MIN_WORD_WINDOWS = 5;
export const CHK_GAP_BAND = 'highpass=f=300,lowpass=f=3400';

// Heard words that are never a defect on their own.
export const CHK_FILLERS = new Set(['um', 'umm', 'uh', 'uhm', 'er', 'erm', 'ah', 'hmm', 'mm', 'mhm']);
// What Whisper writes over the quiet or music at the end of a clip when nobody speaks.
export const CHK_TAIL_HALLUCINATIONS = ['thank you', 'thanks for watching', 'thank you for watching', 'you'];

/** The cut's voice-band level in dB, one value per CHK_GAP_WINDOW_S window up to `untilS`. */
export async function chkVoiceBandLevels(ctx, video, untilS) {
  const path = join(ctx.tmpDir, 'voice-band.f32');
  await kitFfmpeg(ctx, ['-nostats', '-i', video, '-map', '0:a:0', '-t', String(untilS), '-ac', '1', '-ar', String(CHK_GAP_RATE), '-af', CHK_GAP_BAND, '-c:a', 'pcm_f32le', '-f', 'f32le', path]);
  const buf = await readFile(path);
  const samples = new Float32Array(new Uint8Array(buf).buffer, 0, Math.floor(buf.length / 4));
  const step = Math.round(CHK_GAP_WINDOW_S * CHK_GAP_RATE);
  const levels = [];
  for (let from = 0; from + step <= samples.length; from += step) {
    let sum = 0;
    for (let i = from; i < from + step; i++) sum += samples[i] * samples[i];
    const rms = Math.sqrt(sum / step);
    levels.push(rms > 0 ? 20 * Math.log10(rms) : -Infinity);
  }
  return levels;
}

function chkMedian(values) {
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/**
 * Voice outside the timed words. `levels` are dB per `step` seconds from 0, `words` the timed scripted
 * words ({start_s, end_s}), `untilS` where the speech may end (the end card's start). Returns null when
 * there is too little timed speech to set a voice level, else {voice_db, gaps, loud}: every gap
 * ({start_s, end_s, loud_windows}) and the ones with at least CHK_GAP_MIN_WINDOWS loud windows.
 */
export function chkUnscriptedVoice(levels, step, words, untilS) {
  const spans = (words || []).filter((w) => w && Number.isFinite(w.start_s) && Number.isFinite(w.end_s) && w.end_s > w.start_s);
  if (!spans.length) return null;
  const centre = (i) => (i + 0.5) * step;
  const inside = (t, guard) => spans.some((w) => t >= w.start_s - guard && t <= w.end_s + guard);
  const voiced = [];
  for (let i = 0; i < levels.length; i++) if (Number.isFinite(levels[i]) && inside(centre(i), 0)) voiced.push(levels[i]);
  if (voiced.length < CHK_GAP_MIN_WORD_WINDOWS) return null;
  const voice = chkMedian(voiced);
  const bar = voice + CHK_GAP_RISE_DB;
  const gaps = [];
  let open = null;
  for (let i = 0; i <= levels.length; i++) {
    const t = centre(i);
    const gap = i < levels.length && t < untilS && !inside(t, CHK_GAP_GUARD_S);
    if (gap) {
      if (!open) open = { start_s: i * step, end_s: (i + 1) * step, loud_windows: 0 };
      open.end_s = (i + 1) * step;
      if (levels[i] >= bar) open.loud_windows += 1;
    } else if (open) {
      gaps.push(open);
      open = null;
    }
  }
  const round = (g) => ({ start_s: +g.start_s.toFixed(2), end_s: +g.end_s.toFixed(2), loud_windows: g.loud_windows });
  return { voice_db: +voice.toFixed(1), gaps: gaps.map(round), loud: gaps.filter((g) => g.loud_windows >= CHK_GAP_MIN_WINDOWS).map(round) };
}

function chkHasRunIn(words, run) {
  for (let i = 0; i + run.length <= words.length; i++) if (run.every((t, k) => words[i + k] === t)) return true;
  return false;
}

/**
 * The first run of heard words the script does not have: {words, text, repeat} or null. `verdict` is
 * speechReview(script, heard); `scriptWords` and `heardWords` the same texts tokenized. A run that is
 * part of the script is a repeat. Fillers alone, and a Whisper sign-off that ends the transcript, are
 * not counted.
 */
export function chkExtraWords(verdict, scriptWords, heardWords) {
  for (const issue of verdict.issues || []) {
    const grew = issue.kind === 'substitution' && issue.heard_words.length - issue.script_words.length >= 2;
    if (issue.kind !== 'inserted' && !grew) continue;
    const extra = issue.heard_words;
    if (!extra.some((w) => !CHK_FILLERS.has(w))) continue;
    const said = extra.join(' ');
    const endsWith = (words) => extra.length <= words.length && extra.every((t, k) => words[words.length - extra.length + k] === t);
    // Whisper's sign-off is forgiven only when the script does not itself end with those words: a script
    // ending "...love you." said as "...love you you." is a repeat, not a sign-off.
    if (issue.kind === 'inserted' && endsWith(heardWords) && !endsWith(scriptWords) && CHK_TAIL_HALLUCINATIONS.includes(said)) continue;
    return { words: extra, text: issue.heard_text || said, repeat: issue.kind === 'inserted' && chkHasRunIn(scriptWords, extra) };
  }
  return null;
}
