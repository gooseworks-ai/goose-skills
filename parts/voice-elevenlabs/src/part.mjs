// voice-elevenlabs: each scene's line, spoken by one ElevenLabs voice with
// character timings, joined into one voice track. Replaces the
// create-vo-elevenlabs atom: the same request (POST
// /v1/text-to-speech/<voice>/with-timestamps with text, model_id and the
// optional voice_settings), the same one-pass pronunciation swap, and the same
// refusal to go on without usable timings, ordered through ctx.line only.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { kitApplySayAs, kitWordsFromAlignment } from '../../_lib/speech-map.mjs';

const MODEL = 'eleven_v3';

function usableAlignment(json) {
  const a = (json && (json.normalized_alignment || json.alignment)) || null;
  if (!a) return null;
  const keys = ['characters', 'character_start_times_seconds', 'character_end_times_seconds'];
  const counts = keys.map((k) => (Array.isArray(a[k]) ? a[k].length : 0));
  if (!counts[0] || new Set(counts).size !== 1) return null;
  return a;
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const gap = inputs.gap_s ?? 0.25;
  const lines = inputs.scenes
    .map((scene, index) => ({ scene, index, text: String(scene.line || '').trim() }))
    .filter((l) => l.text);
  if (!lines.length) throw ctx.error('bad_input', 'no scene has a line to speak');

  const used = new Set();
  const spoken = [];
  for (const [n, l] of lines.entries()) {
    kitStopIfAborted(ctx);
    const sayAs = kitApplySayAs(l.text, inputs.pronunciations);
    const body = { text: sayAs.spoken, model_id: MODEL };
    if (inputs.voice_settings) body.voice_settings = inputs.voice_settings;
    const piece = kitPieceName('line', l.scene.id, l.index, used);
    const result = await ctx.line.order({
      piece,
      provider: 'elevenlabs',
      path: `/v1/text-to-speech/${inputs.voice_id}/with-timestamps`,
      body,
      results: [{ pointer: '/file_url', name: `${piece}.mp3`, media: 'audio' }],
    });
    const alignment = usableAlignment(result.json);
    if (!alignment) throw ctx.error('provider_failed', `no usable character timings for ${piece}; captions are never timed from guesses`);
    const file = result.files[`${piece}.mp3`];
    if (!file) throw ctx.error('provider_failed', `no audio for ${piece}`);
    spoken.push({ ...l, piece, sayAs, alignment, file, seconds: await kitDuration(ctx, file) });
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
    const id = s.scene.id == null ? String(s.index + 1) : String(s.scene.id);
    const entry = {
      scene_id: id,
      text: s.text,
      start_s: +at.toFixed(3),
      end_s: +(at + s.seconds).toFixed(3),
      words: kitWordsFromAlignment(s.text, s.sayAs, s.alignment, at),
    };
    if (s.sayAs.spoken !== s.text) entry.spoken = s.sayAs.spoken;
    speech.push(entry);
    scenes.push({ id, start_s: +at.toFixed(3), end_s: +(at + s.seconds + hold).toFixed(3) });
    at += s.seconds + hold;
  });
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
