// voice-elevenlabs 1.4.0: an optional lead_s puts that much silence before the first
// line and moves every speech, word and scene timing later by the same amount, so a
// picture can open clean before the voice starts and the captions still sit on it.
// lead_s 0 or absent is 1.3.0 exactly.
// 1.3.0: Eleven v4 is the default model. Every line reports its
// measured words per second from the provider (or reviewed) timestamps, and an
// optional pace.target_wps speeds a narration that reads more than 10 % below the
// target, by at most 1.25x, before any lip-sync step. That tempo is applied only to
// the new narration this part makes; a lip-synced or native talking clip never
// enters this part. 1.2.1: connected narration, Eleven v4 and v4 Turbo as plain
// generally available models, model-specific performance cues, and source/timing
// provenance. Tagged alignments remain pending until independently reviewed;
// metadata never stands in for listening. A pending tagged read still returns the
// whole read as one track, never only its first request.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { kitApplySayAs, kitWordsFromAlignment } from '../../_lib/speech-map.mjs';

const V3 = 'eleven_v3';
const V2 = 'eleven_multilingual_v2';
const V4 = 'eleven_v4';
const V4_TURBO = 'eleven_v4_turbo';
const TAG_RE = /\[[^\[\]\n]{1,200}\]/gu;
const TAG_TAIL_RE = /^\s*($|[.,!?;:…])/u;
// join: sentence ends a request at a line whose written text ends in . ! or ? (closing quotes and brackets allowed).
const SENTENCE_END_RE = /[.!?]["'”’)\]]*$/u;
// The most characters one request sends: eleven_v3 takes 3,000 per request, eleven_multilingual_v2 10,000.
const CALL_MAX_CHARS = { eleven_v3: 3000, eleven_multilingual_v2: 10000, eleven_v4: 10000, eleven_v4_turbo: 10000 };
const TEMPO_MIN = 0.8;
const DEFAULT_MAX_TEMPO = 1.25;
// pace.target_wps: a read more than this share below the target is sped up, never past TARGET_MAX_TEMPO.
const TARGET_SLACK = 0.1;
const TARGET_MAX_TEMPO = 1.25;
const DEFAULT_MODEL = V4;
// lead_s: the most silence put before the first line, and the track's sample rate it is counted in.
const LEAD_MAX = 2;
const LEAD_RATE = 48000;

/** The lead-in in seconds (0 when absent); refuses one outside 0 to 2 s before anything is ordered. */
function leadSeconds(inputs, ctx) {
  const lead = inputs.lead_s ?? 0;
  if (typeof lead !== 'number' || !Number.isFinite(lead) || lead < 0 || lead > LEAD_MAX) {
    throw ctx.error('bad_input', `lead_s must be a number of seconds from 0 to ${LEAD_MAX}`);
  }
  return lead;
}

/** The filter that puts `lead` seconds of silence before a track, counted in whole samples so it is exact. */
function leadFilter(lead) {
  return `adelay=delays=${Math.round(lead * LEAD_RATE)}S:all=1`;
}

/** A time moved later by the lead, kept to the millisecond like every other timing here. */
function leadLater(t, lead) {
  return +(t + lead).toFixed(3);
}

/** The request's model_id, always one of the listed model constants (the input schema allows only these). */
function modelBody(model) {
  if (model === V2) return { model_id: V2 };
  if (model === V4) return { model_id: V4 };
  if (model === V4_TURBO) return { model_id: V4_TURBO };
  return { model_id: V3 };
}

function usableAlignment(json) {
  const a = (json && (json.normalized_alignment || json.alignment)) || null;
  if (!a) return null;
  const keys = ['characters', 'character_start_times_seconds', 'character_end_times_seconds'];
  const counts = keys.map((k) => (Array.isArray(a[k]) ? a[k].length : 0));
  if (!counts[0] || new Set(counts).size !== 1) return null;
  return a;
}

/**
 * The line without its `[tag]` audio tags, and `pos`: for every UTF-16 index
 * of `text` (and its end), the index in the tag-free text it falls at. A tag
 * takes the spaces after it, and the spaces before it too when it opens or
 * closes the line or sits before punctuation. A line with no tag comes back
 * unchanged.
 */
export function voiceWithoutTags(text) {
  const tags = [...text.matchAll(TAG_RE)];
  const pos = new Array(text.length + 1);
  if (!tags.length) {
    for (let i = 0; i <= text.length; i++) pos[i] = i;
    return { text, pos, tags: 0 };
  }
  const drop = new Array(text.length).fill(false);
  for (const m of tags) {
    const from = m.index;
    let to = from + m[0].length;
    for (let i = from; i < to; i++) drop[i] = true;
    const tail = TAG_TAIL_RE.test(text.slice(to));
    while (to < text.length && /\s/u.test(text[to])) drop[to++] = true;
    if (tail || !text.slice(0, from).trim()) {
      for (let i = from - 1; i >= 0 && /\s/u.test(text[i]); i--) drop[i] = true;
    }
  }
  // No space at the start, none doubled.
  let clean = '';
  for (let i = 0; i < text.length; i++) {
    pos[i] = clean.length;
    if (drop[i]) continue;
    if (/\s/u.test(text[i]) && (!clean || /\s$/u.test(clean))) continue;
    clean += text[i];
  }
  pos[text.length] = clean.length;
  const trimmed = clean.replace(/\s+$/u, '');
  for (let i = 0; i <= text.length; i++) pos[i] = Math.min(pos[i], trimmed.length);
  return { text: trimmed, pos, tags: tags.length };
}

/** The pronunciation swap for what is sent, mapped back onto the tag-free words the captions show. */
function sayAsFor(sent, tagged, pairs) {
  const sayAs = kitApplySayAs(sent, pairs);
  if (!tagged) return sayAs;
  return { spoken: sayAs.spoken, map: sayAs.map.map(([a, b]) => [tagged.pos[a], tagged.pos[b]]) };
}

function sceneId(scene, index) {
  return scene.id == null ? String(index + 1) : String(scene.id);
}

/** Every scene that has something to say, with its voice, settings and the text sent; refuses before any order. */
function plannedLines(inputs, ctx, model, tags) {
  let cast = null;
  if (Array.isArray(inputs.cast)) {
    cast = new Map();
    for (const member of inputs.cast) {
      if (cast.has(member.key)) throw ctx.error('bad_input', `the cast has two members with key "${member.key}"`);
      cast.set(member.key, member);
    }
  }
  const offScreen = new Set(Array.isArray(inputs.off_screen) ? inputs.off_screen : []);
  for (const key of offScreen) {
    if (cast && cast.has(key)) throw ctx.error('bad_input', `"${key}" is both a cast key and an off-screen speaker`);
  }
  const limit = CALL_MAX_CHARS[model];
  const out = [];
  inputs.scenes.forEach((scene, index) => {
    let line = typeof scene.line === 'string' ? scene.line.trim() : '';
    if (!line) return;
    const performanceTags = Array.isArray(scene.performance_tags) ? scene.performance_tags : [];
    if (performanceTags.length && model === V2) throw ctx.error('bad_input', 'performance_tags require Eleven v3 or v4; they are not portable speech syntax');
    if (performanceTags.some((tag) => !String(tag).trim() || /[\[\]<>\n]/u.test(tag))) throw ctx.error('bad_input', 'performance_tags are plain delivery cues without markup');
    if (performanceTags.length) line = `${performanceTags.map((tag) => `[${tag}]`).join(' ')} ${line}`;
    if (model !== V2 && /<\/?[a-z][^>]*>/iu.test(line)) throw ctx.error('bad_input', `${model} does not support SSML; use audio tags and punctuation, and keep wanted filler words in the approved copy`);
    const id = sceneId(scene, index);
    const tagged = voiceWithoutTags(line);
    if (tagged.tags && model === V2 && tags === 'keep') {
      throw ctx.error('bad_input', `scene ${id} has an audio tag, and ${V2} cannot read tags; use tags: strip or ${V3}`);
    }
    const sent = tagged.tags && tags === 'strip' ? tagged.text : line;
    if (!sent) return;
    let voiceId = inputs.voice_id || null;
    let settings = inputs.voice_settings || null;
    const speaker = typeof scene.speaker === 'string' && scene.speaker ? scene.speaker : null;
    if (cast && speaker && !offScreen.has(speaker)) {
      const member = cast.get(speaker);
      if (!member) throw ctx.error('bad_input', `scene ${id} is spoken by "${speaker}", who is not in the cast`);
      if (member.voice_id) voiceId = member.voice_id;
      else if (!voiceId) throw ctx.error('bad_input', `cast member "${speaker}" (scene ${id}) has no voice_id, and there is no default voice_id`);
      if (member.voice_settings) settings = { ...(settings || {}), ...member.voice_settings };
    }
    if (!voiceId) throw ctx.error('bad_input', `scene ${id} has no speaker with a voice and there is no default voice_id`);
    if ([V4, V4_TURBO].includes(model) && settings) {
      const unsupported = Object.keys(settings).filter((key) => !['stability', 'similarity_boost'].includes(key));
      if (unsupported.length) throw ctx.error('bad_input', `${model} does not support these voice settings: ${unsupported.join(', ')}; use Stability, Similarity and delivery tags`);
    }
    if (model === V3 && settings?.speed !== undefined) throw ctx.error('bad_input', 'Eleven v3 has no supported Speed control; direct the performance and review the actual pace');
    const sayAs = sayAsFor(sent, sent === line && tagged.tags ? tagged : null, inputs.pronunciations);
    const chars = [...sayAs.spoken].length;
    if (chars > limit) {
      throw ctx.error('bad_input', `scene ${id} sends ${chars} characters (after pronunciations), more than ${model} takes in one request (${limit}); shorten the line`);
    }
    out.push({
      scene,
      index,
      id,
      written: tagged.text,
      sent,
      voiceId,
      settings,
      sayAs,
      chars,
      hasPerformanceTags: sent === line && tagged.tags > 0,
    });
  });
  return out;
}

/** The voice settings as a string that does not depend on key order; '' for none. */
function settingsKey(settings) {
  if (!settings) return '';
  return JSON.stringify(Object.keys(settings).sort().filter((k) => settings[k] !== undefined).map((k) => [k, settings[k]]));
}

/** Two lines can share one request only when they have the same voice and the same settings. */
function sameVoice(a, b) {
  return a.voiceId === b.voiceId && settingsKey(a.settings) === settingsKey(b.settings);
}

/**
 * The requests to make: each one a run of lines read in one go. `line` sends every line alone (1.0.x);
 * `sentence` joins lines until one ends a sentence; `one` joins them all. A run also ends where the voice
 * changes or the text would pass the model's per-request limit. Refuses `one` when that cannot be one request.
 */
function plannedCalls(lines, joinMode, model, ctx) {
  const limit = CALL_MAX_CHARS[model];
  const calls = [];
  let cur = null;
  for (const l of lines) {
    if (cur) {
      const voiceChanges = !sameVoice(cur.lines[0], l);
      const tooLong = cur.chars + 1 + l.chars > limit;
      if (joinMode === 'one' && voiceChanges) {
        throw ctx.error('bad_input', `join: one reads every line in one request, so every line needs the same voice; scene ${l.id} has another voice (use join: sentence or line)`);
      }
      if (joinMode === 'one' && tooLong) {
        throw ctx.error('bad_input', `join: one would send more than ${limit} characters in one request to ${model}; use join: sentence`);
      }
      if (joinMode === 'line' || voiceChanges || tooLong) {
        calls.push(cur);
        cur = null;
      }
    }
    if (!cur) cur = { lines: [], chars: -1 };
    cur.chars += 1 + l.chars;
    cur.lines.push(l);
    if (joinMode === 'sentence' && SENTENCE_END_RE.test(l.written)) {
      calls.push(cur);
      cur = null;
    }
  }
  if (cur) calls.push(cur);
  return calls;
}

/**
 * The character timings of a joined request, one per character of `text`: the first alignment whose characters
 * spell `text` exactly. Null when neither does, since slicing a mismatched alignment by fixed offsets would hand
 * one scene's timings to another.
 */
function joinedAlignment(json, text) {
  const n = [...text].length;
  for (const a of [json && json.alignment, json && json.normalized_alignment]) {
    const usable = usableAlignment(a ? { alignment: a } : null);
    if (usable && usable.characters.length === n && usable.characters.join('') === text) return usable;
  }
  return null;
}

/** One line's slice of a joined request's alignment, from code point `from` for `count` code points. */
function sliceAlignment(a, from, count) {
  const pick = (k) => a[k].slice(from, from + count);
  return {
    characters: pick('characters'),
    character_start_times_seconds: pick('character_start_times_seconds'),
    character_end_times_seconds: pick('character_end_times_seconds'),
  };
}

/** Start of the first and end of the last character that is not a space. */
function voicedEdges(a) {
  let first = null;
  let last = null;
  a.characters.forEach((c, i) => {
    if (/^\s*$/u.test(c)) return;
    if (first === null) first = a.character_start_times_seconds[i];
    last = a.character_end_times_seconds[i];
  });
  return { first, last };
}

/**
 * Splits one joined request back into its lines. A line's span runs from the start of its first word to the
 * start of the next line's first word (the last line runs to the end of the request), so every cut falls
 * between words. Times are seconds into the request.
 */
function splitCall(call, alignment, seconds) {
  let from = 0;
  const parts = call.lines.map((l) => {
    const count = [...l.sayAs.spoken].length;
    const slice = sliceAlignment(alignment, from, count);
    from += count + 1; // the joining space
    return { line: l, slice, edges: voicedEdges(slice) };
  });
  const cuts = [0];
  for (let k = 1; k < parts.length; k++) {
    const start = parts[k].edges.first ?? cuts[k - 1];
    cuts.push(Math.min(seconds, Math.max(cuts[k - 1], start)));
  }
  return parts.map((p, k) => {
    const start = cuts[k];
    const next = k + 1 < parts.length ? cuts[k + 1] : seconds;
    const end = k + 1 < parts.length ? Math.min(next, Math.max(start, p.edges.last ?? start)) : seconds;
    return { ...p, start, end, next };
  });
}

function countWords(speech) {
  return speech.reduce((n, s) => n + s.words.length, 0);
}

function speakingSeconds(speech) {
  return speech.reduce((t, s) => t + Math.max(0, s.end_s - s.start_s), 0);
}

/**
 * The tempo to play the read at. A fixed `tempo` is used as given; otherwise a read slower than `min_wps`
 * is sped up (no faster than `max_tempo`) and one faster than `max_wps` is slowed down (no slower than 0.8).
 * Rounded to 3 decimals in the direction that keeps the band.
 */
function paceTempo(pace, wps) {
  if (!pace) return 1;
  if (pace.tempo !== undefined) return pace.tempo;
  if (!(wps > 0)) return 1;
  const maxTempo = pace.max_tempo ?? DEFAULT_MAX_TEMPO;
  if (pace.min_wps !== undefined && wps < pace.min_wps) return Math.min(maxTempo, Math.ceil((pace.min_wps / wps) * 1000) / 1000);
  if (pace.max_wps !== undefined && wps > pace.max_wps) return Math.max(TEMPO_MIN, Math.floor((pace.max_wps / wps) * 1000) / 1000);
  return 1;
}

/** Refuses a pace that cannot be met, before anything is ordered. */
function checkPace(pace, ctx) {
  if (!pace) return;
  if (pace.tempo !== undefined && pace.max_tempo !== undefined && pace.tempo > pace.max_tempo) {
    throw ctx.error('bad_input', `pace.tempo ${pace.tempo} is above pace.max_tempo ${pace.max_tempo}`);
  }
  if (pace.tempo !== undefined && pace.target_wps !== undefined) {
    throw ctx.error('bad_input', 'give pace.tempo or pace.target_wps, not both: target_wps measures the read and picks the tempo');
  }
  if (pace.min_wps !== undefined && pace.max_wps !== undefined && pace.min_wps > pace.max_wps) {
    throw ctx.error('bad_input', `pace.min_wps ${pace.min_wps} is above pace.max_wps ${pace.max_wps}`);
  }
}

/**
 * The tempo pace.target_wps asks for: 1 unless the measured read is more than 10 % below the target,
 * else target / measured, rounded up to 3 decimals and capped at 1.25 (or a lower pace.max_tempo).
 */
export function targetTempo(pace, measuredWps) {
  if (!pace || pace.target_wps === undefined || !(measuredWps > 0)) return 1;
  if (measuredWps >= pace.target_wps * (1 - TARGET_SLACK) - 1e-9) return 1;
  const cap = Math.min(TARGET_MAX_TEMPO, pace.max_tempo ?? TARGET_MAX_TEMPO);
  return Math.min(cap, Math.ceil((pace.target_wps / measuredWps) * 1000) / 1000);
}

/** What the pace did, in plain fields: the target, the measured and delivered rates, and the tempo. */
function paceReport(pace, measuredWps, deliveredWps, tempo) {
  const target = pace?.target_wps ?? null;
  const report = { target_wps: target, measured_wps: measuredWps, delivered_wps: deliveredWps, tempo, tempo_applied: tempo !== 1, tempo_applied_before_lipsync: true };
  if (pace?.tempo !== undefined) report.note = `explicit pace.tempo ${tempo}`;
  else if (target === null) report.note = 'no pace.target_wps: the read is left as performed';
  else if (tempo === 1) report.note = `the read measures ${measuredWps} words a second, within 10 % of the target ${target}: left as performed`;
  else if (deliveredWps < target * (1 - TARGET_SLACK) - 1e-9) report.note = `the read measured ${measuredWps} words a second, more than 10 % below the target ${target}; sped up ${tempo}x (the 1.25x cap), it now runs ${deliveredWps}. Still slow: direct a faster read or cut words`;
  else report.note = `the read measured ${measuredWps} words a second, more than 10 % below the target ${target}; sped up ${tempo}x to ${deliveredWps}`;
  return report;
}

const COUNTED_RE = /[\p{L}\p{N}_]/u;

/**
 * The words heard in one character alignment, measured the way goose-studio's reference_rate.py measures
 * an ElevenLabs alignment, so a target taken from the reference compares like for like: a word is a run of
 * characters between spaces that holds a letter or digit (a lone dash or full stop is not a word), and it
 * ends at its last letter or digit, not its punctuation. Returns { words, span_s }: the count, and the
 * first word's start to the last word's end.
 */
export function heardRate(alignment) {
  const found = [];
  let current = null;
  const chars = (alignment && alignment.characters) || [];
  chars.forEach((c, i) => {
    const start = alignment.character_start_times_seconds[i];
    const end = alignment.character_end_times_seconds[i];
    if (/^\s+$/u.test(c)) current = null;
    else if (!current) {
      current = { text: c, start, end };
      found.push(current);
    } else {
      current.text += c;
      if (COUNTED_RE.test(c)) current.end = end;
    }
  });
  const words = found.filter((w) => COUNTED_RE.test(w.text));
  if (!words.length) return { words: 0, span_s: 0 };
  return { words: words.length, span_s: Math.max(0, words.at(-1).end - words[0].start) };
}

/** Words per second for a heard rate at a tempo (2 decimals); 0 for fewer than two words or no span. */
function rateOf(heard, tempo = 1) {
  return heard.words >= 2 && heard.span_s > 0 ? +((heard.words * tempo) / heard.span_s).toFixed(2) : 0;
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const gap = inputs.gap_s ?? 0.08;
  // Silence before the first line; every timing returned moves later by it. 0 leaves 1.3.0's read as it was.
  const lead = leadSeconds(inputs, ctx);
  const model = inputs.model ?? DEFAULT_MODEL;
  const joinMode = inputs.join ?? 'sentence';
  // Eleven v4 and v4 Turbo are generally available: no model_support gate (an old
  // model_support input is still accepted and ignored). Tagged reads still need a
  // reviewed alignment below.
  // eleven_v3 performs [tag]s; eleven_multilingual_v2 would read them aloud, so v2 strips them by default.
  const tags = inputs.tags ?? (model === V2 ? 'strip' : 'keep');
  checkPace(inputs.pace, ctx);
  const lines = plannedLines(inputs, ctx, model, tags);
  if (!lines.length) throw ctx.error('bad_input', 'no scene has a line to speak');
  const calls = plannedCalls(lines, joinMode, model, ctx);

  const used = new Set();
  const spoken = [];
  for (const [n, call] of calls.entries()) {
    kitStopIfAborted(ctx);
    const first = call.lines[0];
    const text = call.lines.map((l) => l.sayAs.spoken).join(' ');
    const body = { text, ...modelBody(model) };
    if (first.settings) body.voice_settings = first.settings;
    // A joined request is named after its first scene, so a line-mode plan keeps its 1.0.x piece names.
    const piece = kitPieceName('line', first.scene.id, first.index, used);
    const result = await ctx.line.order({
      piece,
      provider: 'elevenlabs',
      path: `/v1/text-to-speech/${first.voiceId}/with-timestamps`,
      body,
      results: [{ pointer: '/file_url', name: `${piece}.mp3`, media: 'audio' }],
    });
    const file = result.files[`${piece}.mp3`];
    const joined = call.lines.length > 1;
    const tagged = call.lines.some((line) => line.hasPerformanceTags);
    const reviewed = (inputs.reviewed_alignments || []).find((entry) => entry.piece === piece && entry.source_sha256 === file?.sha256);
    if (reviewed && (reviewed.status !== 'pass' || reviewed.audio_listened !== true || !reviewed.reviewer || !['forced_alignment', 'reviewed_transcription'].includes(reviewed.method))) throw ctx.error('bad_input', `reviewed alignment for ${piece} lacks actual listening and timing provenance`);
    const timingCall = reviewed ? { ...call, lines: call.lines.map((line) => ({ ...line, sayAs: kitApplySayAs(line.written, inputs.pronunciations) })) } : call;
    const timingText = timingCall.lines.map((line) => line.sayAs.spoken).join(' ');
    const alignment = reviewed ? joinedAlignment({ alignment: reviewed.alignment }, timingText) : tagged ? null : joinedAlignment(result.json, text);
    if (tagged && !reviewed) {
      if (!file) throw ctx.error('provider_failed', `no audio for ${piece}`);
      spoken.push({ call: timingCall, joined, piece, alignment: null, file, seconds: await kitDuration(ctx, file), timing_method: 'requires_reviewed_alignment' });
      ctx.progress({ done: n + 1, total: calls.length });
      continue;
    }
    if (!alignment) {
      throw ctx.error(
        'provider_failed',
        joined
          ? `the character timings for ${piece} do not line up with the ${call.lines.length} joined lines, so they cannot be split; captions are never timed from guesses`
          : `no usable character timings for ${piece}; captions are never timed from guesses`,
      );
    }
    if (!file) throw ctx.error('provider_failed', `no audio for ${piece}`);
    const seconds = await kitDuration(ctx, file);
    if (reviewed && !(reviewed.coverage?.start_s <= 0 && reviewed.coverage?.end_s >= seconds - 0.02)) throw ctx.error('bad_input', `reviewed alignment for ${piece} does not cover the complete audio`);
    spoken.push({ call: timingCall, joined, piece, alignment, file, seconds, timing_method: reviewed ? reviewed.method : 'provider_character_alignment' });
    ctx.progress({ done: n + 1, total: calls.length });
  }
  if (spoken.some((source) => !source.alignment)) {
    // 1.2.0 returned spoken[0].file here: one sentence passed off as the whole voice.
    // The pending preview is the whole read, every request in order with the same
    // gap as a timed read, so nothing downstream can mistake a fragment for the track.
    // It stays untimed and pending until reviewed alignments are supplied.
    const args = [];
    const chains = [];
    let at = 0;
    spoken.forEach((s, i) => {
      args.push('-i', s.file.path);
      const hold = i + 1 < spoken.length ? gap : 0;
      chains.push(
        `[${i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=mono,atrim=0:${kitNum(s.seconds)},` +
          `asetpts=PTS-STARTPTS,apad=whole_dur=${kitNum(s.seconds + hold)}[l${i}]`,
      );
      at += s.seconds + hold;
    });
    let graph = `${chains.join(';')};${spoken.map((_, i) => `[l${i}]`).join('')}concat=n=${spoken.length}:v=0:a=1`;
    // The pending preview gets the same lead-in as the timed read will, so it runs as long.
    graph += lead > 0 ? `[cat];[cat]${leadFilter(lead)}[out]` : '[out]';
    at += lead;
    await kitFfmpeg(ctx, [...args, '-filter_complex', graph, '-map', '[out]', ...ctx.tools.encodeArgs('aac'), join(ctx.workDir, 'voice-pending.m4a')]);
    const preview = await ctx.file('voice-pending.m4a', 'audio');
    if (inputs.max_seconds !== undefined && at > inputs.max_seconds) {
      throw ctx.error('bad_input', `the read runs ${at.toFixed(2)} s, longer than max_seconds ${inputs.max_seconds}; shorten the lines`);
    }
    return kitCheckOutputs(ctx, manifest, {
      audio: preview, seconds: +at.toFixed(3), speech: [], scenes: [], lines: [], words_per_second: 0, measured_words_per_second: 0, tempo: 1,
      pace_report: { target_wps: inputs.pace?.target_wps ?? null, measured_wps: null, tempo: 1, tempo_applied: false, tempo_applied_before_lipsync: true, note: 'not measured: a tagged read is timed only from a reviewed alignment; run again with reviewed_alignments to measure and pace it' },
      content_review_status: 'pending', timing_status: 'requires_reviewed_alignment',
      source_files: spoken.map((source) => source.file),
      sources: spoken.map((source) => ({ piece: source.piece, audio: source.file, timing_method: source.timing_method, scene_ids: source.call.lines.map((line) => line.id), spoken_text: source.call.lines.map((line) => voiceWithoutTags(line.sayAs.spoken).text).join(' ') })),
      provenance: { speech_mode: 'narration', model, voice_ids: [...new Set(lines.map((line) => line.voiceId))], content_review: 'pending', timing_is_content_review: false, tempo: 1, tempo_applied_before_lipsync: true, pending_reason: 'tagged_read_needs_reviewed_alignment', ...(lead > 0 ? { lead_s: lead } : {}) },
    });
  }

  // One voice track: each request trimmed to its measured length, then a gap. Times here are before pace.
  const args = [];
  const chains = [];
  const speech = [];
  const heard = [];
  const scenes = [];
  const files = [];
  let at = 0;
  spoken.forEach((s, i) => {
    args.push('-i', s.file.path);
    const hold = i + 1 < spoken.length ? gap : 0;
    chains.push(
      `[${i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=mono,atrim=0:${kitNum(s.seconds)},` +
        `asetpts=PTS-STARTPTS,apad=whole_dur=${kitNum(s.seconds + hold)}[l${i}]`,
    );
    const parts = s.joined
      ? splitCall(s.call, s.alignment, s.seconds)
      : [{ line: s.call.lines[0], slice: s.alignment, start: 0, end: s.seconds, next: s.seconds }];
    for (const p of parts) {
      const l = p.line;
      const entry = {
        scene_id: l.id,
        text: l.written,
        start_s: at + p.start,
        end_s: at + p.end,
        words: kitWordsFromAlignment(l.written, l.sayAs, p.slice, at),
      };
      if (l.sayAs.spoken !== l.written) entry.spoken = l.sayAs.spoken;
      speech.push(entry);
      heard.push(heardRate(p.slice));
      const last = p === parts[parts.length - 1];
      scenes.push({ id: l.id, start_s: at + p.start, end_s: at + (last ? s.seconds + hold : p.next) });
      // A line read alone keeps the provider's own file; a line cut from a joined read gets its own file.
      files.push(s.joined ? null : s.file);
    }
    at += s.seconds + hold;
  });

  // Pace: measured on the read as spoken, then every timing is scaled by the tempo.
  const words = countWords(speech);
  const rawWps = words / (speakingSeconds(speech) || 1);
  // Measured from the timestamps, before any tempo: per line and for the whole read.
  // Heard words (reference_rate.py's count) over each line's first-word start to last-word end, summed.
  const heardTotal = heard.reduce((t, h) => ({ words: t.words + h.words, span_s: t.span_s + (h.words >= 2 ? h.span_s : 0) }), { words: 0, span_s: 0 });
  const heardWps = heardTotal.span_s > 0 ? heardTotal.words / heardTotal.span_s : 0;
  const measuredWps = +heardWps.toFixed(2);
  // An explicit pace.tempo, or the tempo pace.target_wps picks (a read more than 10 % below the target,
  // at most 1.25x). Either changes only this new narration, before any lip-sync job; a lip-synced or
  // native talking clip never enters this part. Rate bounds alone (min_wps/max_wps) never stretch a read.
  const tempo = inputs.pace?.tempo ?? targetTempo(inputs.pace, heardWps);
  const scale = (t) => +(t / tempo).toFixed(3);
  for (const e of speech) {
    e.start_s = scale(e.start_s);
    e.end_s = scale(e.end_s);
    e.words = e.words.map((w) => ({ ...w, start_s: scale(w.start_s), end_s: scale(w.end_s) }));
  }
  for (const sc of scenes) {
    sc.start_s = scale(sc.start_s);
    sc.end_s = scale(sc.end_s);
  }
  // The track runs the lead-in plus the paced read.
  const total = at / tempo + lead;
  const wps = words ? +(words / (speakingSeconds(speech) || 1)).toFixed(2) : 0;
  // The band is checked on the exact paced rate (every span divided by tempo), not the rounded report, so a
  // tempo fitted to the band is never refused for a rounding step after the voice was paid for.
  const pacedWps = rawWps * tempo;
  const EPS = 1e-9;

  // Checked on the finished, paced read, before the track is joined and before any later step is paid for.
  if (inputs.max_seconds !== undefined && total > inputs.max_seconds) {
    throw ctx.error('bad_input', `the read runs ${total.toFixed(2)} s, longer than max_seconds ${inputs.max_seconds}; shorten the lines`);
  }
  const pace = inputs.pace || {};
  if (words && pace.min_wps !== undefined && pacedWps < pace.min_wps - EPS) {
    throw ctx.error('bad_input', `the read runs ${wps} words per second at tempo ${tempo}, slower than pace.min_wps ${pace.min_wps}; add words or allow a higher max_tempo`);
  }
  if (words && pace.max_wps !== undefined && pacedWps > pace.max_wps + EPS) {
    throw ctx.error('bad_input', `the read runs ${wps} words per second at tempo ${tempo}, faster than pace.max_wps ${pace.max_wps}; cut words`);
  }

  // Lines that need their own file: every line cut from a joined read, and every line when the pace changed.
  const cuts = [];
  speech.forEach((e, i) => {
    if (tempo === 1 && files[i]) return;
    cuts.push({ i, name: `voice-line-${i + 1}.wav`, start: e.start_s, end: Math.max(e.end_s, e.start_s + 0.01) });
  });
  // The lead-in: every timing moves later by it. The line files above are cut from the read before the
  // lead, so each one still holds just its line. The first scene keeps starting at 0, so the scenes
  // still tile the whole track and a picture step covers the lead-in with its first shot.
  if (lead > 0) {
    for (const e of speech) {
      e.start_s = leadLater(e.start_s, lead);
      e.end_s = leadLater(e.end_s, lead);
      e.words = e.words.map((w) => ({ ...w, start_s: leadLater(w.start_s, lead), end_s: leadLater(w.end_s, lead) }));
    }
    for (const sc of scenes) {
      sc.start_s = sc === scenes[0] ? 0 : leadLater(sc.start_s, lead);
      sc.end_s = leadLater(sc.end_s, lead);
    }
  }
  // The joined track goes to [out], through the lead-in when there is one.
  const trackLabel = lead > 0 ? '[pre]' : '[out]';
  let graph = `${chains.join(';')};${spoken.map((_, i) => `[l${i}]`).join('')}concat=n=${spoken.length}:v=0:a=1`;
  graph += tempo === 1 ? '[read]' : `[joined];[joined]atempo=${kitNum(tempo)}[read]`;
  const maps = [];
  if (cuts.length) {
    graph += `;[read]asplit=${cuts.length + 1}${trackLabel}${cuts.map((_, k) => `[c${k}]`).join('')}`;
    cuts.forEach((c, k) => {
      graph += `;[c${k}]atrim=start=${kitNum(c.start)}:end=${kitNum(c.end)},asetpts=PTS-STARTPTS[o${k}]`;
      maps.push('-map', `[o${k}]`, '-c:a', 'pcm_s16le', '-ar', '48000', join(ctx.workDir, c.name));
    });
  } else {
    graph = graph.replace(/\[read\]$/u, trackLabel);
  }
  if (lead > 0) graph += `;[pre]${leadFilter(lead)}[out]`;
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph, '-map', '[out]', ...ctx.tools.encodeArgs('aac'), join(ctx.workDir, 'voice.m4a'), ...maps]);
  const audio = await ctx.file('voice.m4a', 'audio');
  for (const c of cuts) files[c.i] = await ctx.file(c.name, 'audio');
  return kitCheckOutputs(ctx, manifest, {
    audio,
    seconds: +total.toFixed(3),
    speech,
    scenes,
    lines: speech.map((e, i) => ({ scene_id: e.scene_id, audio: files[i], words_per_second: rateOf(heard[i], tempo), measured_words_per_second: rateOf(heard[i]) })),
    words_per_second: wps,
    measured_words_per_second: measuredWps,
    tempo,
    pace_report: paceReport(inputs.pace, measuredWps, +(heardWps * tempo).toFixed(2), tempo),
    content_review_status: 'pending', timing_status: 'provider_or_reviewed_alignment',
    source_files: spoken.map((source) => source.file),
    sources: spoken.map((source) => ({ piece: source.piece, audio: source.file, timing_method: source.timing_method, scene_ids: source.call.lines.map((line) => line.id), spoken_text: source.call.lines.map((line) => voiceWithoutTags(line.sayAs.spoken).text).join(' ') })),
    provenance: { speech_mode: 'narration', model, voice_ids: [...new Set(lines.map((line) => line.voiceId))], content_review: 'pending', timing_is_content_review: false, tempo, tempo_applied_before_lipsync: true, tempo_scope: 'new_narration_only', target_wps: inputs.pace?.target_wps ?? null, ...(lead > 0 ? { lead_s: lead } : {}) },
  });
}
