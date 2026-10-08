// sfx-elevenlabs: short sound effects from ElevenLabs text-to-sound, one paid
// piece per effect, each cut to its requested length. The request is
// ElevenLabs' sound generation call (POST /v1/sound-generation with text,
// duration_seconds, prompt_influence and model_id), ordered through ctx.line.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitNum, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';

const MODEL = 'eleven_text_to_sound_v2';

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const used = new Set();
  const effects = [];
  for (const [i, fx] of inputs.effects.entries()) {
    kitStopIfAborted(ctx);
    const piece = kitPieceName('sfx', fx.id, i, used);
    const body = { text: fx.prompt, duration_seconds: fx.seconds, model_id: MODEL };
    if (fx.prompt_influence !== undefined) body.prompt_influence = fx.prompt_influence;
    const result = await ctx.line.order({
      piece,
      provider: 'elevenlabs',
      path: '/v1/sound-generation',
      body,
      results: [{ pointer: '/file_url', name: `${piece}-raw.mp3`, media: 'audio' }],
    });
    const raw = result.files[`${piece}-raw.mp3`];
    if (!raw) throw ctx.error('provider_failed', `no audio for ${piece}`);
    // Cut to the asked length with a short tail fade, so a cue never runs past its slot.
    await kitFfmpeg(ctx, [
      '-i',
      raw.path,
      '-af',
      `afade=t=out:st=${kitNum(Math.max(0, fx.seconds - 0.05))}:d=0.05`,
      '-t',
      kitNum(fx.seconds),
      ...ctx.tools.encodeArgs('aac'),
      join(ctx.workDir, `${piece}.m4a`),
    ]);
    effects.push({ id: String(fx.id ?? i + 1), audio: await ctx.file(`${piece}.m4a`, 'audio'), seconds: fx.seconds });
    ctx.progress({ done: i + 1, total: inputs.effects.length });
  }
  return kitCheckOutputs(ctx, manifest, { effects });
}
