// dialogue-cut: the free, seeded picture edit over a two-host dialogue whose
// audio is already made. A port of the podcast recipe's plan_cuts.py (the
// planner, ./plan.mjs) and compose_master.py (this file and ./render.mjs):
// one lipsync clip per line, re-cut over the fixed voice track as plain (one
// picture per line), split (the speaker over the idle listener, with a
// full-frame payoff) or dynamic (cuts inside a line, listener reactions,
// reframes, splits with moving seams and a product panel). Then an optional
// grade, the end card, and the size rule.
//
// The edit is checked twice: the plan's self-checks before anything is drawn
// (tiling, cut floor and ceiling, the speaker full frame only from its own
// clip, two hosts per split, split balance, the framing band), and drift on
// the rendered file (every speaker change within 0.10 s of the plan).
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { kitMediaLength } from '../../_lib/length.mjs';
import { dialogueBeats } from './plan.mjs';
import { DCUT_DRIFT_S, DCUT_MAX_BYTES, dcutChoosePlan, dcutClampSpeech, dcutClipRatio, dcutDrift, dcutGraph, dcutMapZone, dcutProjectedBytes, dcutRateCap, dcutSceneTimes, dcutSpeakerChanges } from './render.mjs';

const dcutMb = (n) => Math.round(n / (1024 * 1024));

/** A scene's id the way the voice and lipsync parts name it. */
function dcutSceneId(scene, index) {
  return scene.id == null ? String(index + 1) : String(scene.id);
}

/** The two hosts: the cast's keys when a cast is given, else the speakers in the order they first speak. */
function dcutHosts(inputs, scenes, ctx) {
  if (inputs.cast && inputs.cast.length) {
    if (inputs.cast.length !== 2) throw ctx.error('bad_input', `dialogue-cut cuts between exactly two hosts; the cast has ${inputs.cast.length}`);
    return inputs.cast.map((m) => m.key);
  }
  const seen = [];
  for (const s of scenes) if (typeof s.line === 'string' && s.line.trim() && s.speaker != null && !seen.includes(String(s.speaker))) seen.push(String(s.speaker));
  if (seen.length !== 2) throw ctx.error('bad_input', `dialogue-cut cuts between exactly two hosts; the lines have ${seen.length} speaker${seen.length === 1 ? '' : 's'} (${seen.join(', ') || 'none'}). Pass the cast to name a host who does not speak.`);
  return seen;
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const width = inputs.width ?? 1080;
  const height = inputs.height ?? 1920;
  const fps = inputs.fps ?? 30;
  const head = inputs.head ?? 0.25;
  const grade = inputs.grade ?? 'none';
  const mode = inputs.mode ?? 'plain';
  if (width % 2 || height % 2) throw ctx.error('bad_input', 'width and height must be even');

  const scenes = inputs.scenes.map((s, i) => ({ ...s, id: dcutSceneId(s, i), speaker: s.speaker == null ? s.speaker : String(s.speaker) }));
  const hosts = dcutHosts(inputs, scenes, ctx);
  const voiceS = await kitMediaLength(ctx, inputs.voice);

  let beats;
  try {
    ({ beats } = dialogueBeats(scenes, inputs.spans, hosts, { seconds: voiceS }));
  } catch (e) {
    if (e.code === 'bad_input') throw ctx.error('bad_input', e.message);
    throw e;
  }

  // Every spoken line needs its own lipsync clip.
  const clipById = new Map(inputs.clips.map((c) => [c.id, c]));
  for (const b of beats) if (!clipById.has(b.id)) throw ctx.error('bad_input', `scene ${b.id} has a line but no clip in clips (the lipsync step's clips, matched by scene id)`);
  const idleByKey = new Map((inputs.idle || []).map((c) => [c.key, c]));
  const castByKey = new Map((inputs.cast || []).map((m) => [m.key, m]));
  const products = (inputs.products || []).filter((p) => p.images && p.images.length);

  // Planner settings from the inputs a style may pass; the rest are the mode's.
  const overrides = {};
  for (const k of ['seed', 'seams', 'bottom_sources', 'payoff', 'listener_source']) if (inputs[k] !== undefined) overrides[k] = inputs[k];
  if (inputs.crops) overrides.crops = inputs.crops;
  const idleLengths = [];
  for (const h of hosts) {
    const c = idleByKey.get(h);
    if (c) idleLengths.push(await kitMediaLength(ctx, c.video));
  }
  if (idleLengths.length) overrides.idle_seconds = Math.min(...idleLengths);

  // The end card's length counts in the runtime the framing rate is measured over.
  const ending = inputs.ending || null;
  let endingFrames = 0;
  let endingAudio = false;
  if (ending) {
    endingFrames = Math.round((await kitMediaLength(ctx, ending)) * fps);
    if (endingFrames < 1) throw ctx.error('bad_input', 'the end card is shorter than one frame');
    endingAudio = !!(await ctx.tools.probe(ending.path)).has_audio;
  }

  let chosen;
  try {
    chosen = dcutChoosePlan(beats, hosts, mode, overrides, { products: products.length, end_card_s: endingFrames / fps });
  } catch (e) {
    if (e.code === 'bad_input') throw ctx.error('bad_input', e.message);
    throw e;
  }
  if (chosen.problems.length) {
    const list = chosen.problems.slice(0, 4).join('; ');
    if (chosen.input) throw ctx.error('bad_input', `the ${mode} edit needs a picture it was not given: ${list}`);
    throw ctx.error('output_invalid', `no ${mode} edit of these lines passes the cut checks (seeds ${chosen.seed} to ${chosen.seed + chosen.tried - 1}): ${list}`);
  }
  const { plan, seed } = chosen;
  if (chosen.tried > 1) ctx.log.info('the first seed missed a cut check; a later seed passed', { seed, tried: chosen.tried });

  // What each cut needs, refused before anything is drawn.
  for (const c of plan.cuts) {
    const lonely = (c.mode === 'reaction' && !c.clip_scene) || (c.mode === 'split' && c.bottom !== 'product' && c.listener_source === 'idle');
    const who = c.mode === 'split' ? c.listener : c.show;
    if (lonely && !idleByKey.has(who) && !(c.mode === 'reaction' && castByKey.get(who)?.image)) {
      throw ctx.error(
        'bad_input',
        c.mode === 'split'
          ? `the ${mode} edit shows ${who} listening under the speaker, which needs ${who}'s idle clip (the lipsync step's idle, idle_seconds > 0) or listener_source clip`
          : `the ${mode} edit cuts to ${who} listening, and ${who} speaks no line: pass ${who}'s idle clip or a cast picture`,
      );
    }
  }

  // Clips placed on the voice: each stretched to its line when it is a hair off, never more than 5%.
  const lineOf = new Map((inputs.speech || []).filter((e) => e.scene_id != null).map((e) => [e.scene_id, e]));
  const spanOf = new Map(inputs.spans.map((s) => [s.id, s]));
  const clips = new Map();
  for (const b of beats) {
    const c = clipById.get(b.id);
    const length = await kitMediaLength(ctx, c.video);
    const line = lineOf.get(b.id);
    const lineStart = line ? line.start_s : spanOf.get(b.id).start_s;
    const { ratio, stretched } = dcutClipRatio(length, line ? line.end_s - line.start_s : length);
    if (line && !stretched && ratio === 1 && Math.abs(length - (line.end_s - line.start_s)) > 0.05 * length) {
      ctx.log.warn('a lipsync clip is too far from its line to retime; it plays at its own speed', { scene: b.id, clip_s: length, line_s: line.end_s - line.start_s });
    }
    clips.set(b.id, { path: c.video.path, length_s: length, ratio, line_start_s: lineStart });
  }
  const idle = new Map();
  for (const [k, c] of idleByKey) idle.set(k, { path: c.video.path, length_s: await kitMediaLength(ctx, c.video) });
  const stills = new Map([...castByKey].filter(([, m]) => m.image).map(([k, m]) => [k, { path: m.image.path }]));

  const job = dcutGraph(
    plan,
    {
      clips,
      beats: new Map(beats.map((b) => [b.id, b])),
      idle,
      stills,
      products: products.map((p) => ({ path: p.images[0].path })),
      voice: { path: inputs.voice.path },
      ending: ending ? { path: ending.path, frames: endingFrames, has_audio: endingAudio } : null,
    },
    { width, height, fps, head, grade },
  );
  // The rate cap bounds the file, but CRF usually lands far under it: only the encoded size decides (below).
  if (dcutProjectedBytes(job.total_s, grade) > DCUT_MAX_BYTES) {
    ctx.log.warn('at the rate cap this cut could pass the size limit; the encoded file is checked', { seconds: kitNum(job.total_s, 1), cap_mb: dcutMb(dcutProjectedBytes(job.total_s, grade)), limit_mb: dcutMb(DCUT_MAX_BYTES) });
  }

  await kitFfmpeg(ctx, [
    ...job.args,
    '-filter_complex',
    job.graph.join(';'),
    '-map',
    '[vout]',
    '-map',
    '[aout]',
    ...ctx.tools.encodeArgs('aac'),
    ...ctx.tools.encodeArgs('h264-master'),
    ...dcutRateCap(grade),
    '-r',
    String(fps),
    join(ctx.workDir, 'dialogue.mp4'),
  ]);
  const video = await ctx.file('dialogue.mp4', 'video');
  if (video.bytes > DCUT_MAX_BYTES) {
    throw ctx.error('output_invalid', `the cut is ${dcutMb(video.bytes)} MB, over the ${dcutMb(DCUT_MAX_BYTES)} MB a finished video may be; shorten the dialogue or drop the grain look`);
  }

  // Drift: the file is as long as the plan, and every speaker change lands where the plan put it.
  const got = await ctx.tools.probe(video.path);
  if (!Number.isFinite(got.duration_s) || Math.abs(got.duration_s - job.total_s) > DCUT_DRIFT_S) {
    throw ctx.error('output_invalid', `the cut is ${got.duration_s} s, the plan ${kitNum(job.total_s, 3)} s`);
  }
  const planned = dcutSpeakerChanges(plan.cuts, job.times.starts);
  if (planned.length) {
    const { stdout, stderr } = await kitFfmpeg(ctx, ['-i', video.path, '-t', kitNum(job.dialogue_s), '-an', '-vf', "scale=180:320,select='gt(scene,0.2)',metadata=print:file=-", '-f', 'null', '-']);
    const drift = dcutDrift(planned, dcutSceneTimes(`${stdout || ''}\n${stderr || ''}`));
    ctx.log.info('speaker changes checked against the render', { planned: planned.length, judged: drift.judged, unseen: drift.unseen, worst_s: drift.worst_s });
    if (drift.bad.length) throw ctx.error('output_invalid', `the picture does not land where the plan put it: ${drift.bad.slice(0, 4).join('; ')}`);
  }

  // The timeline: one scene per spoken line on its real cut times, the speech, the end card and its logo box.
  const seconds = +job.total_s.toFixed(3);
  const dlg = +job.dialogue_s.toFixed(3);
  const firstCut = new Map();
  plan.cuts.forEach((c, k) => {
    if (!firstCut.has(c.scene_id)) firstCut.set(c.scene_id, k);
  });
  const sceneRows = beats.map((b, i) => ({
    id: b.id,
    start_s: +job.times.starts[firstCut.get(b.id)].toFixed(3),
    end_s: i + 1 < beats.length ? +job.times.starts[firstCut.get(beats[i + 1].id)].toFixed(3) : dlg,
  }));
  // Speech of a scene that was skipped (no line) has no picture and no place in the timeline.
  const spokenIds = new Set(beats.map((b) => b.id));
  const speech = (inputs.speech || []).filter((e) => e.scene_id == null || spokenIds.has(String(e.scene_id)));
  const timeline = { duration_s: seconds, width, height, fps, scenes: sceneRows, speech: dcutClampSpeech(speech, dlg) };
  if (ending) {
    timeline.end_card = { start_s: dlg, end_s: seconds };
    const et = inputs.ending_timeline;
    const logo = et && (et.safe_zones || []).find((z) => z.use === 'logo');
    const moved = logo ? dcutMapZone(logo, et.width, et.height, width, height) : null;
    if (moved) timeline.safe_zones = [moved];
  }
  const cuts = plan.cuts.map((c, k) => ({
    scene_id: c.scene_id,
    start_s: +job.times.starts[k].toFixed(3),
    end_s: +(job.times.starts[k] + job.times.lengths[k]).toFixed(3),
    mode: c.mode,
    show: c.show,
    framing: c.framing ?? null,
  }));
  return kitCheckOutputs(ctx, manifest, { video, seconds, timeline, cuts, seed });
}
