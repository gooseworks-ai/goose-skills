// transcribe-whisper: what is actually said in a cut, from fal Whisper with
// word timings (caption-burn's transcription), as a timeline step that runs
// before the layers. Each approved scene line is placed on the heard words:
// a speech entry keeps the written line as `text` (so captions show the
// approved words), carries what was heard for it as `spoken`, and its written
// words timed by the heard ones. The check layer compares `spoken` with the
// approved script; the captions layer uses the timings and never transcribes
// again. The cut passes through unchanged.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg } from '../../_lib/part.mjs';
import { kitHeardPlace, kitHeardWords } from '../../_lib/heard.mjs';

const MODEL = 'fal-ai/whisper';

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const info = await ctx.tools.probe(inputs.video.path);
  if (!info.has_audio) throw ctx.error('bad_input', 'the cut has no sound to transcribe');
  const duration = await kitDuration(ctx, inputs.video);
  await kitFfmpeg(ctx, ['-i', inputs.video.path, '-map', '0:a:0', '-ac', '1', ...ctx.tools.encodeArgs('aac'), join(ctx.tmpDir, 'speech.m4a')]);
  const audio = await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/speech.m4a`, 'audio');
  const result = await ctx.line.order({
    piece: 'transcribe',
    provider: 'fal',
    path: MODEL,
    body: { audio_url: audio, task: 'transcribe', language: inputs.language ?? 'en', chunk_level: 'word' },
    results: [],
  });
  const heard = kitHeardWords(result.json);
  ctx.progress({ done: 1, total: 1 });
  const transcript = heard.map((w) => w.text).join(' ');
  const lines = (inputs.scenes || [])
    .map((s, i) => ({ scene_id: s.id == null ? String(i + 1) : String(s.id), text: String(s.line || '').replace(/\s+/g, ' ').trim() }))
    .filter((l) => l.text);

  // Every heard word belongs to exactly one line, in order: a line's share runs from where the last
  // placed line ended to where this one ends; words before the first or after the last go to the edges.
  const speech = [];
  if (!lines.length) {
    if (heard.length) {
      speech.push({ text: transcript, spoken: transcript, start_s: heard[0].start, end_s: heard.at(-1).end, words: heard.map((w) => ({ text: w.text, start_s: w.start, end_s: w.end })) });
    }
  } else {
    let from = 0;
    lines.forEach((l, k) => {
      const last = k === lines.length - 1;
      const span0 = from < heard.length ? heard[from].start : duration;
      const placed = kitHeardPlace(l.text, span0, last || from >= heard.length ? duration : heard.at(-1).end, heard, from);
      const until = last ? heard.length : placed ? placed.next : from;
      const share = heard.slice(from, until);
      const entry = { scene_id: l.scene_id, text: l.text, spoken: share.map((w) => w.text).join(' ') };
      if (placed) {
        entry.words = placed.words.map((w) => ({ text: w.text, start_s: +Math.max(0, w.start_s).toFixed(3), end_s: +Math.max(0, w.end_s).toFixed(3) }));
        entry.start_s = entry.words[0].start_s;
        entry.end_s = Math.max(entry.words.at(-1).end_s, entry.start_s);
      } else {
        entry.start_s = share.length ? share[0].start : span0;
        entry.end_s = share.length ? share.at(-1).end : span0;
        ctx.log.warn('a line could not be placed on what was heard', { scene_id: l.scene_id });
      }
      entry.start_s = +Math.min(entry.start_s, duration).toFixed(3);
      entry.end_s = +Math.min(Math.max(entry.end_s, entry.start_s), duration).toFixed(3);
      speech.push(entry);
      from = until;
    });
  }
  const base = inputs.timeline || { duration_s: duration, width: info.width, height: info.height, fps: info.fps || 30, scenes: [] };
  const timeline = { ...base, duration_s: +duration.toFixed(3), speech };
  return kitCheckOutputs(ctx, manifest, { video: inputs.video, timeline, transcript });
}
