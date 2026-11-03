// The composition plan song-elevenlabs sends to ElevenLabs `POST /v1/music/detailed`
// (model music_v1, the `sections` shape). Two ways to lay the song out:
//
// - `sections`: the style names each section, its length and which scenes it sings
//   ([from, to], 1-based scene numbers, in order). A section's lines are its
//   scenes' lines, split after each sentence.
// - `form`: the lyric is split into `groups` sections of whole sentences, each
//   `words x ms_per_word + 500 ms` long (at least `min_section_s`), between an
//   instrumental intro and outro.
//
// Everything here is checked before anything is paid for. Pure: no I/O.
// Every top-level name starts with `song`.
import { songFail, songNorm, songSplitLines, songCountWords, songWordPlan } from './lyric.mjs';

export const SONG_MODEL = 'music_v1';
export const SONG_SECTION_MIN_MS = 3000;
export const SONG_SECTION_MAX_MS = 120000;
export const SONG_MAX_SECTIONS = 30;
export const SONG_MAX_LINES = 30;
export const SONG_MAX_LINE_CHARS = 200;
export const SONG_MAX_STYLES = 50;
export const SONG_FORM_DEFAULTS = { intro_s: 3, outro_s: 3, groups: 3, ms_per_word: 330, min_section_s: 3 };
// Faster than this and the singer rushes the words (the old recipe planned 330 ms a word).
const songRushMsPerWord = 250;
const songInstrumentalAvoid = ['vocals', 'singing', 'humming'];

/**
 * Style phrases from strings and lists. A string is split at commas, semicolons
 * and new lines ("warm folk, soft piano; 100 bpm"); a list keeps its items.
 * Trimmed, empty ones dropped, repeats dropped (any case), at most 50.
 */
export function songStyles(...sources) {
  const out = [];
  const seen = new Set();
  const add = (phrase) => {
    const p = String(phrase).replace(/\s+/gu, ' ').trim();
    if (!p || seen.has(p.toLowerCase())) return;
    seen.add(p.toLowerCase());
    out.push(p);
  };
  for (const s of sources) {
    if (s == null) continue;
    if (Array.isArray(s)) s.forEach((x) => x != null && add(x));
    else String(s).split(/[,;\n]/u).forEach(add);
  }
  return out.slice(0, SONG_MAX_STYLES);
}

function songMs(seconds, what) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) throw songFail('bad_input', `${what} needs a length in seconds`);
  const ms = Math.round(seconds * 1000);
  if (ms < SONG_SECTION_MIN_MS || ms > SONG_SECTION_MAX_MS) {
    throw songFail('bad_input', `${what} is ${seconds} s; a song section must last 3 to 120 s`);
  }
  return ms;
}

function songSectionName(name, where) {
  const n = typeof name === 'string' ? name.trim() : '';
  if (!n || n.length > 100) throw songFail('bad_input', `${where} needs a name of 1 to 100 characters`);
  return n;
}

/** The sent-word range [first, last] covered by some sung scenes, or null. */
function songSentRange(sungScenes) {
  if (!sungScenes.length) return null;
  return [sungScenes[0].sent[0], sungScenes.at(-1).sent[1]];
}

function songSectionsFromStyle(sections, words, sceneCount) {
  if (!Array.isArray(sections) || !sections.length) throw songFail('bad_input', 'sections must list at least one section');
  const out = [];
  let after = 0; // the last scene number a section has claimed
  sections.forEach((sec, k) => {
    const where = `section ${k + 1}`;
    const name = songSectionName(sec && sec.name, where);
    const durationMs = songMs(sec.seconds, `section "${name}"`);
    let range = null;
    if (sec.scenes != null) {
      const [from, to] = Array.isArray(sec.scenes) ? sec.scenes : [];
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
        throw songFail('bad_input', `section "${name}" scenes must be [from, to], scene numbers from 1`);
      }
      if (from <= after) throw songFail('bad_input', `section "${name}" starts at scene ${from}, which an earlier section already sings`);
      if (to > sceneCount) throw songFail('bad_input', `section "${name}" ends at scene ${to}, but the plan has ${sceneCount} scenes`);
      range = [from - 1, to - 1];
      after = to;
    }
    const sung = range ? words.sung.filter((s) => s.index >= range[0] && s.index <= range[1]) : [];
    const lines = songSplitLines(sung.map((s) => s.spoken).join(' '), SONG_MAX_LINE_CHARS);
    out.push({ name, duration_ms: durationMs, styles: songStyles(sec.styles), avoid: songStyles(sec.avoid), scenes: range, lines, sent: songSentRange(sung) });
  });
  const covered = new Set();
  for (const s of out) if (s.scenes) for (let i = s.scenes[0]; i <= s.scenes[1]; i++) covered.add(i);
  const loose = words.sung.find((s) => !covered.has(s.index));
  if (loose) throw songFail('bad_input', `scene ${loose.index + 1} has a line to sing but no section sings it`);
  return out;
}

function songSectionsFromForm(form, words) {
  const f = { ...SONG_FORM_DEFAULTS, ...(form || {}) };
  for (const key of ['intro_s', 'outro_s', 'ms_per_word', 'min_section_s']) {
    if (typeof f[key] !== 'number' || !Number.isFinite(f[key]) || f[key] < 0) throw songFail('bad_input', `form.${key} must be a number of 0 or more`);
  }
  if (!Number.isInteger(f.groups) || f.groups < 1) throw songFail('bad_input', 'form.groups must be a whole number of 1 or more');
  if (f.min_section_s * 1000 < SONG_SECTION_MIN_MS) throw songFail('bad_input', 'form.min_section_s must be at least 3');
  const sentences = songSplitLines(words.sung.map((s) => s.spoken).join(' '), SONG_MAX_LINE_CHARS);
  const g = Math.min(f.groups, sentences.length);
  const size = Math.max(1, Math.round(sentences.length / g));
  const groups = [];
  for (let k = 0; k < g; k++) {
    const part = k < g - 1 ? sentences.slice(k * size, (k + 1) * size) : sentences.slice(k * size);
    if (part.length) groups.push(part);
  }
  const out = [];
  if (f.intro_s > 0) {
    out.push({ name: 'Intro', duration_ms: songMs(f.intro_s, 'form.intro_s'), styles: ['instrumental intro, no vocals'], avoid: songInstrumentalAvoid, scenes: null, lines: [], sent: null });
  }
  let next = 0; // the next sent word
  groups.forEach((lines, k) => {
    const count = lines.reduce((n, l) => n + songCountWords(l), 0);
    const ms = Math.max(Math.round(f.min_section_s * 1000), Math.round(count * f.ms_per_word + 500));
    const last = k === groups.length - 1;
    const name = groups.length === 1 ? 'Verse' : last ? 'Close' : `Verse ${k + 1}`;
    if (ms > SONG_SECTION_MAX_MS) throw songFail('bad_input', `section "${name}" would last ${ms / 1000} s; a song section lasts at most 120 s`);
    const styles = k === 0 ? ['voice enters, closely miked'] : last ? ['the last line sung clearly', 'gentle resolve'] : ['same voice, steady'];
    out.push({ name, duration_ms: ms, styles, avoid: ['tempo increase'], scenes: null, lines, sent: [next, next + count - 1] });
    next += count;
  });
  if (f.outro_s > 0) {
    out.push({ name: 'Outro', duration_ms: songMs(f.outro_s, 'form.outro_s'), styles: ['instrumental outro', 'final chord rings out'], avoid: songInstrumentalAvoid, scenes: null, lines: [], sent: null });
  }
  return out;
}

/**
 * Everything song-elevenlabs decides before it pays: the request's
 * `composition_plan`, the sections with their start times, the lyric's words,
 * and where the hook must land.
 *
 * `inputs`: {scenes, mood?, singer?, brief?, avoid?, sections? | form?, hook?,
 * hook_scene?, ending_scenes?, pronunciations?, max_seconds?}.
 *
 * Returns {composition_plan, sections: [{name, start_ms, duration_ms, scenes, lines, sent}],
 * words (songWordPlan), lyric_words, total_ms, hook: {scene_index, section, target_ms} | null,
 * ending_scenes, warnings}. Throws songFail('bad_input', ...) for a plan it will not sing.
 */
export function songCompositionPlan(inputs) {
  const scenes = Array.isArray(inputs && inputs.scenes) ? inputs.scenes : [];
  if (!scenes.length) throw songFail('bad_input', 'the plan has no scenes');
  const words = songWordPlan(scenes, inputs.pronunciations);
  if (!words.sent.length) throw songFail('bad_input', 'no scene has a line to sing');
  const hasSections = inputs.sections != null;
  const hasForm = inputs.form != null;
  if (hasSections === hasForm) throw songFail('bad_input', 'give the song either sections or form, not both and not neither');
  const laid = hasSections ? songSectionsFromStyle(inputs.sections, words, scenes.length) : songSectionsFromForm(inputs.form, words);
  if (laid.length > SONG_MAX_SECTIONS) throw songFail('bad_input', `the song has ${laid.length} sections; ElevenLabs takes at most ${SONG_MAX_SECTIONS}`);
  const warnings = [];
  let at = 0;
  const sections = laid.map((s) => {
    if (s.lines.length > SONG_MAX_LINES) throw songFail('bad_input', `section "${s.name}" has ${s.lines.length} lines; a section takes at most ${SONG_MAX_LINES}`);
    const count = s.sent ? s.sent[1] - s.sent[0] + 1 : 0;
    if (count && s.duration_ms < count * songRushMsPerWord) {
      warnings.push(`section "${s.name}" sings ${count} words in ${s.duration_ms / 1000} s; the singer will rush`);
    }
    const out = { ...s, start_ms: at };
    at += s.duration_ms;
    return out;
  });
  const totalMs = at;
  if (inputs.max_seconds != null && totalMs > inputs.max_seconds * 1000) {
    throw songFail('bad_input', `the song is planned at ${totalMs / 1000} s, longer than max_seconds ${inputs.max_seconds}`);
  }

  const endingScenes = inputs.ending_scenes == null ? 0 : inputs.ending_scenes;
  if (!Number.isInteger(endingScenes) || endingScenes < 0 || endingScenes >= scenes.length) {
    throw songFail('bad_input', `ending_scenes must be a whole number from 0 to ${scenes.length - 1}`);
  }

  let hook = null;
  if (inputs.hook != null && inputs.hook_scene == null) throw songFail('bad_input', 'hook needs hook_scene: the scene whose first sung word is the hook');
  if (inputs.hook_scene != null) {
    const n = inputs.hook_scene;
    if (!Number.isInteger(n) || n < 1 || n > scenes.length) throw songFail('bad_input', `hook_scene must be a scene number from 1 to ${scenes.length}`);
    const sung = words.sung.find((s) => s.index === n - 1);
    if (!sung) throw songFail('bad_input', `hook_scene ${n} has no line, so it cannot open on the hook`);
    if (inputs.hook != null) {
      const want = String(inputs.hook).match(/\S+/gu) || [];
      const have = words.written.slice(sung.written[0], sung.written[0] + want.length).map((w) => songNorm(w.text));
      if (!want.length || want.map(songNorm).join(' ') !== have.join(' ')) {
        throw songFail('bad_input', `scene ${n} must start with the hook "${inputs.hook}"; its line is "${sung.text}"`);
      }
    }
    const first = sung.sent[0];
    const section = sections.findIndex((s) => s.sent && first >= s.sent[0] && first <= s.sent[1]);
    if (section < 0 || sections[section].sent[0] !== first) {
      throw songFail('bad_input', `scene ${n} holds the hook, so its first word must open a section; move the section boundary to scene ${n}`);
    }
    hook = { scene_index: n - 1, section, target_ms: sections[section].start_ms };
  }

  const compositionPlan = {
    positive_global_styles: songStyles(inputs.mood, inputs.singer, inputs.brief),
    negative_global_styles: songStyles(inputs.avoid),
    sections: sections.map((s) => ({
      section_name: s.name,
      positive_local_styles: s.styles,
      negative_local_styles: s.avoid,
      duration_ms: s.duration_ms,
      lines: s.lines,
    })),
  };
  return { composition_plan: compositionPlan, sections, words, lyric_words: words.sent.length, total_ms: totalMs, hook, ending_scenes: endingScenes, warnings };
}
