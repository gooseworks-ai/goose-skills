// transcribe-whisper: what is actually said in a cut, from fal Whisper with
// word timings (caption-burn's transcription), as a timeline step that runs
// before the layers. Each approved scene line is placed on the heard words:
// a speech entry keeps the written line as `text` (so captions show the
// approved words), carries what was heard for it as `spoken`, and its written
// words timed by the heard ones. The check layer compares `spoken` with the
// approved script; the captions layer uses the timings and never transcribes
// again. Heard words no line has (a repeated line, a filler) come out as their
// own entries with no scene_id and empty text (1.1.2), so a cut can drop them
// and the captions never show them; the check layer still hears them. The cut passes through unchanged. With `retime_scenes`, the
// timeline's scene spans are set from each line's heard words as well (see
// retime.mjs), so a later cut lands on what was said.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg } from '../../_lib/part.mjs';
import { kitHeardWords } from '../../_lib/heard.mjs';
import { placeLines, placeTimes } from './place.mjs';
import { RETIME_MIN_HEARD, retimeAlign, retimeCloseChunks, retimeSceneSpans } from './retime.mjs';

const MODEL = 'fal-ai/whisper';

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const sceneIds = (inputs.scenes || []).map((s, i) => (s.id == null ? String(i + 1) : String(s.id)));
  const lines = (inputs.scenes || [])
    .map((s, i) => ({ scene_id: sceneIds[i], text: String(s.line || '').replace(/\s+/g, ' ').trim() }))
    .filter((l) => l.text);
  if (inputs.retime_scenes && !lines.length) throw ctx.error('bad_input', 'retime_scenes needs scenes with at least one line to place');
  if (inputs.retime_scenes) {
    // Later steps key the re-timed spans by scene id, so two scenes may not share one (a scene with no id
    // is named by its position, which may collide with another scene's id).
    const twice = sceneIds.filter((id, i) => sceneIds.indexOf(id) !== i);
    if (twice.length) throw ctx.error('bad_input', `retime_scenes needs a different id for every scene; repeated: ${[...new Set(twice)].join(', ')}`);
  }
  const info = await ctx.tools.probe(inputs.video.path);
  if (!info.has_audio) throw ctx.error('bad_input', 'the cut has no sound to transcribe');
  const duration = await kitDuration(ctx, inputs.video);
  // The speech goes out as 16 kHz mono 16-bit WAV (audio/wav): a type the kit and the server host for the
  // line (audio/mp4 is not), at the rate Whisper listens at.
  await kitFfmpeg(ctx, ['-i', inputs.video.path, '-map', '0:a:0', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', join(ctx.tmpDir, 'speech.wav')]);
  const audio = await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/speech.wav`, 'audio');
  const result = await ctx.line.order({
    piece: 'transcribe',
    provider: 'fal',
    path: MODEL,
    body: { audio_url: audio, task: 'transcribe', language: inputs.language ?? 'en', chunk_level: 'word' },
    results: [],
  });
  const heard = kitHeardWords(retimeCloseChunks(result.json, duration));
  ctx.progress({ done: 1, total: 1 });
  const transcript = heard.map((w) => w.text).join(' ');

  // Each line is placed by one alignment of the whole script on the whole transcript (place.mjs): heard
  // words between lines that no line has (a repeated line, a filler) are skipped and come back as entries
  // with no scene and no written text, so a cut can drop them and captions never show them.
  const speech = [];
  if (!lines.length) {
    if (heard.length) {
      speech.push({ text: transcript, spoken: transcript, start_s: heard[0].start, end_s: heard.at(-1).end, words: heard.map((w) => ({ text: w.text, start_s: w.start, end_s: w.end })) });
    }
  } else {
    const r3 = (t) => +Math.min(Math.max(0, t), duration).toFixed(3);
    const placed = placeLines(lines, heard);
    const extras = placed.extras.map(([f, t]) => {
      const run = heard.slice(f, t + 1);
      const spoken = run.map((w) => w.text).join(' ');
      ctx.log.info('heard speech that is in no line', { spoken, start_s: r3(run[0].start), end_s: r3(run.at(-1).end) });
      return { at: f, entry: { text: '', spoken, start_s: r3(run[0].start), end_s: r3(Math.max(run.at(-1).end, run[0].start)), words: run.map((w) => ({ text: w.text, start_s: r3(w.start), end_s: r3(Math.max(w.end, w.start)) })) } };
    });
    let prevEnd = 0;
    placed.lines.forEach((p, k) => {
      const l = lines[k];
      if (p.own) while (extras.length && extras[0].at < p.own[0]) speech.push(extras.shift().entry);
      const share = p.own ? heard.slice(p.own[0], p.own[1] + 1) : [];
      const entry = { scene_id: l.scene_id, text: l.text, spoken: share.map((w) => w.text).join(' ') };
      if (p.placed) {
        entry.words = placeTimes(p, heard).map((w) => ({ text: w.text, start_s: r3(w.start_s), end_s: r3(Math.max(w.end_s, w.start_s)) }));
      } else {
        // A line the transcript does not match keeps word timings, spread evenly across what was heard for
        // it (or a short slot where nothing was), so the captions layer never has to buy a transcript again.
        const start = share.length ? share[0].start : Math.min(prevEnd, duration);
        const end = share.length ? Math.max(share.at(-1).end, start) : Math.min(duration, start + 0.4 * l.text.split(/\s+/).length);
        const written = l.text.split(/\s+/).filter(Boolean);
        const step = (end - start) / written.length;
        entry.words = written.map((text, i) => ({ text, start_s: r3(start + step * i), end_s: r3(start + step * (i + 1)) }));
        ctx.log.warn('a line could not be placed on what was heard; its words are spread evenly', { scene_id: l.scene_id });
      }
      entry.start_s = entry.words[0].start_s;
      entry.end_s = Math.max(entry.words.at(-1).end_s, entry.start_s);
      prevEnd = Math.max(prevEnd, entry.end_s);
      speech.push(entry);
    });
    for (const x of extras) speech.push(x.entry);
  }
  const base = inputs.timeline || { duration_s: duration, width: info.width, height: info.height, fps: info.fps || 30, scenes: [] };
  const timeline = { ...base, duration_s: +duration.toFixed(3), speech };
  if (inputs.retime_scenes) {
    // Scene spans only move onto heard words when the cut says the script; otherwise a later cut would
    // land on the wrong words, so stop here (the transcription is reused on a retry).
    // The anchors are each line's first and last heard words, never a guessed time for an unheard word.
    const { share, anchors } = retimeAlign(lines, heard);
    ctx.log.info('script words heard', { share: +share.toFixed(3) });
    if (share < RETIME_MIN_HEARD) {
      throw ctx.error('bad_input', `only ${Math.round(share * 100)}% of the script was heard (at least ${RETIME_MIN_HEARD * 100}% needed): the cut does not say the script`);
    }
    timeline.scenes = retimeSceneSpans(sceneIds, anchors, timeline.duration_s);
    const empty = timeline.scenes.filter((s) => s.end_s <= s.start_s).map((s) => s.id);
    if (empty.length) ctx.log.warn('scenes left with no time between the heard words', { scene_ids: empty });
  }
  return kitCheckOutputs(ctx, manifest, { video: inputs.video, timeline, transcript });
}
