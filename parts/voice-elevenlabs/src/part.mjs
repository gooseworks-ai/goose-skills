// voice-elevenlabs: each scene's line, spoken by an ElevenLabs voice with
// character timings, joined into one voice track. Replaces the
// create-vo-elevenlabs atom: the same request (POST
// /v1/text-to-speech/<voice>/with-timestamps with text, model_id and the
// optional voice_settings), the same one-pass pronunciation swap, and the same
// refusal to go on without usable timings, ordered through ctx.line only.
//
// 1.1.0: a scene whose line is null or empty is skipped and leaves no span.
// With a `cast`, each scene's `speaker` picks that member's voice; a speaker
// the cast does not hold is refused. `model` picks eleven_v3 (default) or
// eleven_multilingual_v2. `[tag]` audio tags are sent to eleven_v3 (`tags:
// keep`) or taken out (`tags: strip`); captions never show them, and v2 never
// receives them. `max_seconds` refuses a read that runs too long before any
// later step is paid for. Every refusal of the inputs happens before the first
// piece is ordered.
//
// `join` picks how lines are sent: `line` (default) one request per line, as
// in 1.0.x; `sentence` one request per run of lines until a line ends in
// . ! or ?; `one` a single request for the whole read. A joined request's
// character timings are split back per scene, each scene running from its
// first word to the next scene's first word, so cuts land between words and
// there is no gap inside a sentence. `pace` plays the read faster or slower
// with atempo (eleven_v3 ignores voice_settings.speed) and scales every
// timing by the same factor; `words_per_second` and `tempo` report the result.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { kitApplySayAs, kitWordsFromAlignment } from '../../_lib/speech-map.mjs';

const V3 = 'eleven_v3';
const V2 = 'eleven_multilingual_v2';
const TAG_RE = /\[[^\[\]\n]{1,40}\]/gu;
const TAG_TAIL_RE = /^\s*($|[.,!?;:…])/u;
// join: sentence ends a request at a line whose written text ends in . ! or ? (closing quotes and brackets allowed).
const SENTENCE_END_RE = /[.!?]["'”’)\]]*$/u;
// The most characters one request sends: eleven_v3 takes 3,000 per request, eleven_multilingual_v2 10,000.
const CALL_MAX_CHARS = { eleven_v3: 3000, eleven_multilingual_v2: 10000 };
const TEMPO_MIN = 0.8;
const DEFAULT_MAX_TEMPO = 1.25;

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
  const out = [];
  inputs.scenes.forEach((scene, index) => {
    const line = typeof scene.line === 'string' ? scene.line.trim() : '';
    if (!line) return;
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
    if (cast && speaker) {
      const member = cast.get(speaker);
      if (!member) throw ctx.error('bad_input', `scene ${id} is spoken by "${speaker}", who is not in the cast`);
      if (member.voice_id) voiceId = member.voice_id;
      else if (!voiceId) throw ctx.error('bad_input', `cast member "${speaker}" (scene ${id}) has no voice_id, and there is no default voice_id`);
      if (member.voice_settings) settings = { ...(settings || {}), ...member.voice_settings };
    }
    if (!voiceId) throw ctx.error('bad_input', `scene ${id} has no speaker with a voice and there is no default voice_id`);
    out.push({
      scene,
      index,
      id,
      written: tagged.text,
      sent,
      voiceId,
      settings,
      sayAs: sayAsFor(sent, sent === line && tagged.tags ? tagged : null, inputs.pronunciations),
    });
  });
  return out;
}

/** Two lines can share one request only when they have the same voice and the same settings. */
function sameVoice(a, b) {
  return a.voiceId === b.voiceId && JSON.stringify(a.settings || null) === JSON.stringify(b.settings || null);
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
      const tooLong = cur.chars + 1 + l.sayAs.spoken.length > limit;
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
    cur.chars += 1 + l.sayAs.spoken.length;
    cur.lines.push(l);
    if (joinMode === 'sentence' && SENTENCE_END_RE.test(l.written)) {
      calls.push(cur);
      cur = null;
    }
  }
  if (cur) calls.push(cur);
  return calls;
}

/** The character timings of a joined request, one per character of `text`; null when neither alignment lines up. */
function joinedAlignment(json, text) {
  const n = [...text].length;
  for (const a of [json && json.alignment, json && json.normalized_alignment]) {
    const usable = usableAlignment(a ? { alignment: a } : null);
    if (usable && usable.characters.length === n) return usable;
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
  if (pace.min_wps !== undefined && pace.max_wps !== undefined && pace.min_wps > pace.max_wps) {
    throw ctx.error('bad_input', `pace.min_wps ${pace.min_wps} is above pace.max_wps ${pace.max_wps}`);
  }
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const gap = inputs.gap_s ?? 0.25;
  const model = inputs.model ?? V3;
  const joinMode = inputs.join ?? 'line';
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
    const body = { text, model_id: model === V2 ? V2 : V3 };
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
    const alignment = joined ? joinedAlignment(result.json, text) : usableAlignment(result.json);
    if (!alignment) {
      throw ctx.error(
        'provider_failed',
        joined
          ? `the character timings for ${piece} do not line up with the ${call.lines.length} joined lines, so they cannot be split; captions are never timed from guesses`
          : `no usable character timings for ${piece}; captions are never timed from guesses`,
      );
    }
    if (!file) throw ctx.error('provider_failed', `no audio for ${piece}`);
    spoken.push({ call, joined, piece, alignment, file, seconds: await kitDuration(ctx, file) });
    ctx.progress({ done: n + 1, total: calls.length });
  }

  // One voice track: each request trimmed to its measured length, then a gap. Times here are before pace.
  const args = [];
  const chains = [];
  const speech = [];
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
  const tempo = paceTempo(inputs.pace, rawWps);
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
  const total = at / tempo;
  const wps = words ? +(words / (speakingSeconds(speech) || 1)).toFixed(2) : 0;

  // Checked on the finished, paced read, before the track is joined and before any later step is paid for.
  if (inputs.max_seconds !== undefined && total > inputs.max_seconds) {
    throw ctx.error('bad_input', `the read runs ${total.toFixed(2)} s, longer than max_seconds ${inputs.max_seconds}; shorten the lines`);
  }
  const pace = inputs.pace || {};
  if (words && pace.min_wps !== undefined && wps < pace.min_wps) {
    throw ctx.error('bad_input', `the read runs ${wps} words per second at tempo ${tempo}, slower than pace.min_wps ${pace.min_wps}; add words or allow a higher max_tempo`);
  }
  if (words && pace.max_wps !== undefined && wps > pace.max_wps) {
    throw ctx.error('bad_input', `the read runs ${wps} words per second at tempo ${tempo}, faster than pace.max_wps ${pace.max_wps}; cut words`);
  }

  // Lines that need their own file: every line cut from a joined read, and every line when the pace changed.
  const cuts = [];
  speech.forEach((e, i) => {
    if (tempo === 1 && files[i]) return;
    cuts.push({ i, name: `voice-line-${i + 1}.wav`, start: e.start_s, end: Math.max(e.end_s, e.start_s + 0.01) });
  });
  let graph = `${chains.join(';')};${spoken.map((_, i) => `[l${i}]`).join('')}concat=n=${spoken.length}:v=0:a=1`;
  graph += tempo === 1 ? '[read]' : `[joined];[joined]atempo=${kitNum(tempo)}[read]`;
  const maps = [];
  if (cuts.length) {
    graph += `;[read]asplit=${cuts.length + 1}[out]${cuts.map((_, k) => `[c${k}]`).join('')}`;
    cuts.forEach((c, k) => {
      graph += `;[c${k}]atrim=start=${kitNum(c.start)}:end=${kitNum(c.end)},asetpts=PTS-STARTPTS[o${k}]`;
      maps.push('-map', `[o${k}]`, '-c:a', 'pcm_s16le', '-ar', '48000', join(ctx.workDir, c.name));
    });
  } else {
    graph = graph.replace(/\[read\]$/u, '[out]');
  }
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph, '-map', '[out]', ...ctx.tools.encodeArgs('aac'), join(ctx.workDir, 'voice.m4a'), ...maps]);
  const audio = await ctx.file('voice.m4a', 'audio');
  for (const c of cuts) files[c.i] = await ctx.file(c.name, 'audio');
  return kitCheckOutputs(ctx, manifest, {
    audio,
    seconds: +total.toFixed(3),
    speech,
    scenes,
    lines: speech.map((e, i) => ({ scene_id: e.scene_id, audio: files[i] })),
    words_per_second: wps,
    tempo,
  });
}
