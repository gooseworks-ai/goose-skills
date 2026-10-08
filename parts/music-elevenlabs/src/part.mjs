// music-elevenlabs: an instrumental bed from ElevenLabs Music, cut to the
// video's length. Replaces the create-music-elevenlabs atom: the same request
// (POST /v1/music with prompt, music_length_ms and force_instrumental, plus the
// model_id the line checks), the same finish (skip any sparse intro, loudnorm
// to -16 LUFS / -1.5 dBTP, a 0.5 s fade at the tail), ordered through ctx.line.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitNum } from '../../_lib/part.mjs';

const MODEL = 'music_v1';

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const seconds = inputs.seconds;
  const trim = inputs.trim_intro_s ?? 0;
  const ordered = seconds + trim + 0.5;
  if (ordered > inputs.max_seconds + 1e-9) {
    throw ctx.error('bad_input', `a ${kitNum(seconds, 2)} s bed needs ${kitNum(ordered, 2)} s of music, more than max_seconds ${inputs.max_seconds}`);
  }
  const result = await ctx.line.order({
    piece: 'bed',
    provider: 'elevenlabs',
    path: '/v1/music',
    body: {
      prompt: inputs.prompt,
      music_length_ms: Math.round(ordered * 1000),
      force_instrumental: inputs.force_instrumental ?? true,
      model_id: MODEL,
    },
    results: [{ pointer: '/file_url', name: 'bed-raw.mp3', media: 'audio' }],
  });
  const raw = result.files['bed-raw.mp3'];
  if (!raw) throw ctx.error('provider_failed', 'no music file came back');
  ctx.progress({ done: 1, total: 1 });
  const target = inputs.loudnorm_i ?? -16;
  await kitFfmpeg(ctx, [
    '-ss',
    kitNum(trim),
    '-i',
    raw.path,
    '-af',
    `loudnorm=I=${target}:TP=-1.5:LRA=11,afade=t=out:st=${kitNum(Math.max(0, seconds - 0.5))}:d=0.5`,
    '-t',
    kitNum(seconds),
    ...ctx.tools.encodeArgs('aac'),
    join(ctx.workDir, 'music.m4a'),
  ]);
  const audio = await ctx.file('music.m4a', 'audio');
  return kitCheckOutputs(ctx, manifest, { audio, seconds });
}
