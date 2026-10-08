// brand-layer: ends the video on the brand. When the style says the video
// ends on an end card (expect.end_card) and no timeline step drew one
// (timeline.end_card), it appends the brand end card: the same renderer as
// the end-card part (logo as-is, brand colours and fonts, the call to
// action), crossfaded in over 0.3 s. The cut's own sound plays to its end and
// fades out over that crossfade; the card holds in silence (a style that wants
// the music under the card draws it with end-card before audio-mix).
// Otherwise the cut passes through untouched.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { kitRenderEndCard } from '../../_lib/end-card.mjs';

const CARD_S = 2.5;
const XFADE_S = 0.3;

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { video, timeline, expect } = inputs;
  if (!expect.end_card || timeline.end_card) {
    ctx.log.info('brand layer passes the cut through', { end_card_expected: expect.end_card, drawn_by_step: !!timeline.end_card });
    return kitCheckOutputs(ctx, manifest, { video, timeline });
  }
  const info = await ctx.tools.probe(video.path);
  const fps = info.fps || timeline.fps || 30;
  const dur = await kitDuration(ctx, video);
  if (dur <= XFADE_S) throw ctx.error('bad_input', 'the cut is too short to end on a card');
  const card = await kitRenderEndCard(ctx, { brand: inputs.brand, card: {}, width: info.width, height: info.height, fps, seconds: CARD_S });
  const offset = dur - XFADE_S;
  const total = dur + CARD_S - XFADE_S;
  const audio = info.has_audio
    ? `[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,afade=t=out:st=${kitNum(offset)}:d=${XFADE_S},apad,atrim=0:${kitNum(total)}[a]`
    : `anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${kitNum(total)}[a]`;
  await kitFfmpeg(ctx, [
    '-i',
    video.path,
    '-i',
    card.path,
    '-filter_complex',
    `[0:v]fps=${fps},settb=AVTB,setsar=1,format=yuv420p[c];[1:v]fps=${fps},settb=AVTB,setsar=1,format=yuv420p[e];` +
      `[c][e]xfade=transition=fade:duration=${XFADE_S}:offset=${kitNum(offset)}[v];${audio}`,
    '-map',
    '[v]',
    '-map',
    '[a]',
    ...ctx.tools.encodeArgs('h264-master'),
    ...ctx.tools.encodeArgs('aac'),
    '-t',
    kitNum(total),
    join(ctx.workDir, 'branded.mp4'),
  ]);
  const out = await ctx.file('branded.mp4', 'video');
  const next = {
    ...timeline,
    duration_s: +total.toFixed(3),
    scenes: [...timeline.scenes, { id: 'end-card', start_s: +offset.toFixed(3), end_s: +total.toFixed(3) }],
    end_card: { start_s: +offset.toFixed(3), end_s: +total.toFixed(3) },
  };
  return kitCheckOutputs(ctx, manifest, { video: out, timeline: next });
}
