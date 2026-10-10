// music-elevenlabs: an instrumental bed from ElevenLabs Music. Replaces the
// create-music-elevenlabs atom: the same request (POST /v1/music with prompt,
// music_length_ms and force_instrumental, plus the model_id the line checks),
// the same finish (skip any sparse intro, loudnorm to -16 LUFS / -1.5 dBTP, a
// 0.5 s fade at the tail, saved as 48 kHz stereo), ordered through ctx.line. The prompt is the style's
// fixed music brief plus the plan's mood; a plan with no mood gets no bed and
// orders nothing.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitNum } from '../../_lib/part.mjs';

const MODEL = 'music_v1';

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const mood = inputs.mood == null ? '' : String(inputs.mood).replace(/[-_]+/g, ' ').trim();
  if (!mood) {
    ctx.log.info('no music mood in the plan: no bed');
    return kitCheckOutputs(ctx, manifest, {});
  }
  const seconds = inputs.seconds;
  const trim = inputs.trim_intro_s ?? 0;
  if (trim >= seconds - 0.5) throw ctx.error('bad_input', 'trim_intro_s leaves less than half a second of music');
  const prompt = `${inputs.brief.trim()} Mood: ${mood}.`;
  const result = await ctx.line.order({
    piece: 'bed',
    provider: 'elevenlabs',
    path: '/v1/music',
    body: { prompt, music_length_ms: Math.round(seconds * 1000), force_instrumental: inputs.force_instrumental ?? true, model_id: MODEL },
    results: [{ pointer: '/file_url', name: 'bed-raw.mp3', media: 'audio' }],
  });
  const raw = result.files['bed-raw.mp3'];
  if (!raw) throw ctx.error('provider_failed', 'no music file came back');
  ctx.progress({ done: 1, total: 1 });
  const length = seconds - trim;
  const target = inputs.loudnorm_i ?? -16;
  await kitFfmpeg(ctx, [
    '-ss',
    kitNum(trim),
    '-i',
    raw.path,
    '-af',
    // loudnorm resamples to 192 kHz; without a resample the bed was saved at 96 kHz with no named layout.
    `loudnorm=I=${target}:TP=-1.5:LRA=11,aresample=48000,aformat=channel_layouts=stereo,afade=t=out:st=${kitNum(Math.max(0, length - 0.5))}:d=0.5`,
    '-t',
    kitNum(length),
    ...ctx.tools.encodeArgs('aac'),
    join(ctx.workDir, 'music.m4a'),
  ]);
  const audio = await ctx.file('music.m4a', 'audio');
  return kitCheckOutputs(ctx, manifest, { audio, seconds: +length.toFixed(3) });
}
