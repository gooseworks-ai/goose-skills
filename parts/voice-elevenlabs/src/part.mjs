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
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { kitApplySayAs, kitWordsFromAlignment } from '../../_lib/speech-map.mjs';

const V3 = 'eleven_v3';
const V2 = 'eleven_multilingual_v2';
const TAG_RE = /\[[^\[\]\n]{1,40}\]/gu;
const TAG_TAIL_RE = /^\s*($|[.,!?;:…])/u;

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

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const gap = inputs.gap_s ?? 0.25;
  const model = inputs.model ?? V3;
  // eleven_v3 performs [tag]s; eleven_multilingual_v2 would read them aloud, so v2 strips them by default.
  const tags = inputs.tags ?? (model === V2 ? 'strip' : 'keep');
  const lines = plannedLines(inputs, ctx, model, tags);
  if (!lines.length) throw ctx.error('bad_input', 'no scene has a line to speak');

  const used = new Set();
  const spoken = [];
  for (const [n, l] of lines.entries()) {
    kitStopIfAborted(ctx);
    const body = { text: l.sayAs.spoken, model_id: model === V2 ? V2 : V3 };
    if (l.settings) body.voice_settings = l.settings;
    const piece = kitPieceName('line', l.scene.id, l.index, used);
    const result = await ctx.line.order({
      piece,
      provider: 'elevenlabs',
      path: `/v1/text-to-speech/${l.voiceId}/with-timestamps`,
      body,
      results: [{ pointer: '/file_url', name: `${piece}.mp3`, media: 'audio' }],
    });
    const alignment = usableAlignment(result.json);
    if (!alignment) throw ctx.error('provider_failed', `no usable character timings for ${piece}; captions are never timed from guesses`);
    const file = result.files[`${piece}.mp3`];
    if (!file) throw ctx.error('provider_failed', `no audio for ${piece}`);
    spoken.push({ ...l, piece, alignment, file, seconds: await kitDuration(ctx, file) });
    ctx.progress({ done: n + 1, total: lines.length });
  }

  // One voice track: each line trimmed to its measured length, then a gap.
  const args = [];
  const chains = [];
  let at = 0;
  const speech = [];
  const scenes = [];
  spoken.forEach((s, i) => {
    args.push('-i', s.file.path);
    const hold = i + 1 < spoken.length ? gap : 0;
    chains.push(
      `[${i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=mono,atrim=0:${kitNum(s.seconds)},` +
        `asetpts=PTS-STARTPTS,apad=whole_dur=${kitNum(s.seconds + hold)}[l${i}]`,
    );
    const entry = {
      scene_id: s.id,
      text: s.written,
      start_s: +at.toFixed(3),
      end_s: +(at + s.seconds).toFixed(3),
      words: kitWordsFromAlignment(s.written, s.sayAs, s.alignment, at),
    };
    if (s.sayAs.spoken !== s.written) entry.spoken = s.sayAs.spoken;
    speech.push(entry);
    scenes.push({ id: s.id, start_s: +at.toFixed(3), end_s: +(at + s.seconds + hold).toFixed(3) });
    at += s.seconds + hold;
  });

  // Checked on the finished read, before the track is joined and before any later step is paid for.
  if (inputs.max_seconds !== undefined && at > inputs.max_seconds) {
    throw ctx.error('bad_input', `the read runs ${at.toFixed(2)} s, longer than max_seconds ${inputs.max_seconds}; shorten the lines`);
  }

  const graph = `${chains.join(';')};${spoken.map((_, i) => `[l${i}]`).join('')}concat=n=${spoken.length}:v=0:a=1[out]`;
  await kitFfmpeg(ctx, [
    ...args,
    '-filter_complex',
    graph,
    '-map',
    '[out]',
    ...ctx.tools.encodeArgs('aac'),
    join(ctx.workDir, 'voice.m4a'),
  ]);
  const audio = await ctx.file('voice.m4a', 'audio');
  return kitCheckOutputs(ctx, manifest, {
    audio,
    seconds: +at.toFixed(3),
    speech,
    scenes,
    lines: spoken.map((s, i) => ({ scene_id: speech[i].scene_id, audio: s.file })),
  });
}
