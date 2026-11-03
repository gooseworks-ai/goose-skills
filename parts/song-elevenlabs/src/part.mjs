// song-elevenlabs: the plan's scene lines, sung as one song by ElevenLabs Music,
// with every scene's picture and caption timed to the sung words.
//
// 1. Plan (pure, before any spend): the lyric from the scene lines, the
//    composition plan from the style's `sections` or `form`, the hook check
//    (src/plan.mjs). A plan it will not sing is refused here, for free.
// 2. One paid piece, `song`: POST /v1/music/detailed through ctx.line with
//    {composition_plan, model_id: music_v1, with_timestamps: true,
//    respect_sections_durations: true} (and `seed` when the style gives one).
//    The line answers {json, file_url}: the reply's JSON part verbatim and the
//    audio. Words are read from json.words_timestamps ([{word, start_ms, end_ms}]).
// 3. The piece fails (provider_failed) on empty word timings, a word with no
//    numeric times, a sung-word count that differs from the lyric, or a word
//    that starts after the track ends: captions are never timed from guesses.
// 4. Hook gate: with hook_scene, its first sung word must land within 0.35 s of
//    its section's start. A miss orders one more song (`song-reroll`, a new
//    seed); a second miss fails the step (output_invalid).
// 5. Scene spans, captions and the end card's place from the words
//    (src/snap.mjs); the audio is trimmed or padded at the head to match.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum, kitStopIfAborted } from '../../_lib/part.mjs';
import { songCompositionPlan, SONG_MODEL } from './plan.mjs';
import { songAlignWords, songTimeline, SONG_HOOK_TOLERANCE_S } from './snap.mjs';

const SONG_PATH = '/v1/music/detailed';
// ElevenLabs seeds are 32-bit signed integers; keep a derived seed inside that range.
const songSeedRange = 2147483647;

/** A songFail from the pure modules as a ctx error; anything else unchanged. */
function songCtxError(ctx, e) {
  return e && e.song ? ctx.error(e.code, e.message) : e;
}

/** The word timings in the line's answer: result.json.words_timestamps. */
export function songReplyWords(json) {
  const words = json && typeof json === 'object' ? json.words_timestamps : null;
  return Array.isArray(words) ? words : null;
}

/** The seed for the re-roll: the style's seed + 1, else one derived from the step. Never the first seed. */
function songRerollSeed(ctx, first) {
  if (first != null) return (first + 1) % songSeedRange;
  return ctx.seed('song-reroll') % songSeedRange;
}

async function songOrder(ctx, plan, piece, seed) {
  const body = { composition_plan: plan.composition_plan, model_id: SONG_MODEL, with_timestamps: true, respect_sections_durations: true };
  if (seed != null) body.seed = seed;
  const result = await ctx.line.order({
    piece,
    provider: 'elevenlabs',
    path: SONG_PATH,
    body,
    results: [{ pointer: '/file_url', name: `${piece}.mp3`, media: 'audio' }],
  });
  const file = result.files[`${piece}.mp3`];
  if (!file) throw ctx.error('provider_failed', `no audio for ${piece}`);
  const duration_s = await kitDuration(ctx, file);
  let aligned;
  try {
    aligned = songAlignWords(plan.words, songReplyWords(result.json), duration_s);
  } catch (e) {
    throw songCtxError(ctx, e);
  }
  for (const m of aligned.mismatches) ctx.log.warn(`${piece}: sung word ${m.index + 1} reads "${m.sung}", the lyric says "${m.lyric}"`);
  return { piece, file, aligned, duration_s };
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  let plan;
  try {
    plan = songCompositionPlan(inputs);
  } catch (e) {
    throw songCtxError(ctx, e);
  }
  if (!plan.composition_plan.positive_global_styles.length) {
    throw ctx.error('bad_input', 'the song needs a mood, a singer or a brief to sing in');
  }
  for (const w of plan.warnings) ctx.log.warn(w);

  const timeOf = (sung) => {
    try {
      return songTimeline({ scenes: inputs.scenes, plan, aligned: sung.aligned, duration_s: sung.duration_s, windows: inputs.windows, max_ending_s: inputs.max_ending_s });
    } catch (e) {
      throw songCtxError(ctx, e);
    }
  };
  const total = plan.hook ? 2 : 1;
  let sung = await songOrder(ctx, plan, 'song', inputs.seed);
  let timeline = timeOf(sung);
  ctx.progress({ done: 1, total });
  if (timeline.hook && !timeline.hook.ok) {
    ctx.log.warn(`the hook is sung ${timeline.hook.off_s} s off its section's start (gate ${SONG_HOOK_TOLERANCE_S} s): making the song once more`);
    kitStopIfAborted(ctx);
    sung = await songOrder(ctx, plan, 'song-reroll', songRerollSeed(ctx, inputs.seed));
    timeline = timeOf(sung);
    ctx.progress({ done: 2, total });
    if (!timeline.hook.ok) {
      throw ctx.error('output_invalid', `the hook was sung ${timeline.hook.off_s} s off its section's start twice; the gate is ${SONG_HOOK_TOLERANCE_S} s`);
    }
  }
  for (const w of timeline.warnings) ctx.log.warn(w);

  // The track, trimmed or padded at the head so the words land where the spans say.
  const filters = [];
  if (timeline.pad_s > 0) filters.push(`adelay=${Math.round(timeline.pad_s * 1000)}:all=1`);
  filters.push('aresample=48000', 'aformat=sample_fmts=fltp:channel_layouts=stereo', `apad=whole_dur=${kitNum(timeline.seconds)}`);
  await kitFfmpeg(ctx, [
    ...(timeline.trim_s > 0 ? ['-ss', kitNum(timeline.trim_s)] : []),
    '-i',
    sung.file.path,
    '-af',
    filters.join(','),
    '-t',
    kitNum(timeline.seconds),
    ...ctx.tools.encodeArgs('aac'),
    join(ctx.workDir, 'song.m4a'),
  ]);
  const audio = await ctx.file('song.m4a', 'audio');
  const out = {
    audio,
    seconds: timeline.seconds,
    words: timeline.words,
    scenes: timeline.scenes,
    speech: timeline.speech,
    ending_seconds: timeline.ending_seconds,
  };
  if (timeline.hook_s != null) out.hook_s = timeline.hook_s;
  return kitCheckOutputs(ctx, manifest, out);
}
