// lipsync-veed: approved audio drives a face, with Veed Fabric 1.0 on fal
// (veed/fabric-1.0). The create-lipsync-veed-fal atom and the podcast skit's
// gen_paid.py clips and idle steps in JavaScript: every spoken scene's own
// line audio (from the voice step) is sent with its speaker's still (from the
// plate step's singles) as {image_url, audio_url, resolution}, one piece per
// line, named by scene id so a fix can reuse the lines it did not touch. With
// idle_seconds > 0, each face is also driven by that much silence: the mouth
// stays shut and the head and eyes keep their own motion, which is the
// "listening" clip a split screen loops under the other speaker. Everything
// is checked and priced before the first piece is ordered: a spoken scene
// with no face or no audio is refused, and so is more lipsync than
// max_seconds.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';

const MODEL = 'veed/fabric-1.0';
// Veed returns clips a few milliseconds short; a clip far from its audio is broken.
const DRIFT_S = 0.5;
const DRIFT_SHARE = 0.2;

function sceneId(scene, index) {
  return scene.id == null ? String(index + 1) : String(scene.id);
}

function lineText(scene) {
  return String(scene.line == null ? '' : scene.line).replace(/\s+/g, ' ').trim();
}

/** Spoken scenes with their face and audio, or a plain reason to refuse. */
function planLines(inputs) {
  const faces = new Map();
  for (const f of inputs.faces) {
    if (faces.has(f.key)) return { problem: `two faces have the key "${f.key}"` };
    faces.set(f.key, f);
  }
  const audio = new Map();
  for (const l of inputs.lines) {
    if (audio.has(l.scene_id)) return { problem: `two lines are for scene ${l.scene_id}` };
    audio.set(l.scene_id, l.audio);
  }
  const only = inputs.faces.length === 1 ? inputs.faces[0] : null;
  const spoken = [];
  for (const [index, scene] of inputs.scenes.entries()) {
    if (!lineText(scene)) continue;
    const id = sceneId(scene, index);
    const speaker = scene.speaker == null || scene.speaker === '' ? null : String(scene.speaker);
    const face = speaker ? faces.get(speaker) : only;
    if (!face) return { problem: speaker ? `scene ${id} is spoken by "${speaker}", who has no face` : `scene ${id} has a line but no speaker, and there is more than one face` };
    const file = audio.get(id);
    if (!file) return { problem: `scene ${id} has a line but no audio in lines` };
    spoken.push({ id, index, face, audio: file });
  }
  return { spoken };
}

/** A silent WAV of `seconds` in the work folder (bit-exact, so its hash and its piece stay stable). */
async function silence(ctx, seconds) {
  const name = `idle-silence-${kitNum(seconds, 3)}s.wav`;
  await kitFfmpeg(ctx, ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', kitNum(seconds, 3), '-c:a', 'pcm_s16le', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', join(ctx.workDir, name)]);
  return ctx.file(name, 'audio');
}

/** One Veed piece: the face, the audio, and a check that a picture came back about as long as the audio. */
async function lipsync(ctx, piece, face, audio, seconds, resolution) {
  kitStopIfAborted(ctx);
  const body = { image_url: face.image, audio_url: audio, resolution };
  const name = `${piece}.mp4`;
  const result = await ctx.line.order({ piece, provider: 'fal', path: MODEL, body, results: [{ pointer: '/json/video/url', name, media: 'video' }] });
  const video = result && result.files && result.files[name];
  if (!video) throw ctx.error('provider_failed', `no video for ${piece}`);
  const info = await ctx.tools.probe(video.path);
  if (!info.has_video) throw ctx.error('provider_failed', `${piece} came back with no picture`);
  const got = Number.isFinite(video.duration_s) && video.duration_s > 0 ? video.duration_s : info.duration_s;
  if (!Number.isFinite(got) || got <= 0) throw ctx.error('provider_failed', `${piece} came back with no length`);
  if (Math.abs(got - seconds) > Math.max(DRIFT_S, DRIFT_SHARE * seconds)) {
    throw ctx.error('provider_failed', `${piece} is ${got.toFixed(2)}s for ${seconds.toFixed(2)}s of audio`);
  }
  return { video, seconds: +got.toFixed(3) };
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { spoken, problem } = planLines(inputs);
  if (problem) throw ctx.error('bad_input', problem);
  const idleSeconds = inputs.idle_seconds ?? 0;
  if (!spoken.length && !idleSeconds) throw ctx.error('bad_input', 'no scene has a line to lipsync and idle_seconds is 0');
  for (const s of spoken) s.seconds = await kitDuration(ctx, s.audio);
  const lineSeconds = spoken.reduce((a, s) => a + s.seconds, 0);
  const total = lineSeconds + idleSeconds * inputs.faces.length;
  if (total > inputs.max_seconds + 1e-6) {
    throw ctx.error('bad_input', `the lines and idle clips need ${total.toFixed(2)}s of lipsync, more than max_seconds ${inputs.max_seconds}`);
  }

  const resolution = inputs.resolution ?? '720p';
  const jobs = spoken.length + (idleSeconds ? inputs.faces.length : 0);
  const used = new Set();
  const clips = [];
  for (const s of spoken) {
    const piece = kitPieceName('clip', s.id, s.index, used);
    const made = await lipsync(ctx, piece, s.face, s.audio, s.seconds, resolution);
    clips.push({ id: s.id, ...made });
    ctx.progress({ done: clips.length, total: jobs });
  }
  const idle = [];
  if (idleSeconds) {
    const quiet = await silence(ctx, idleSeconds);
    for (const [i, face] of inputs.faces.entries()) {
      const piece = kitPieceName('idle', face.key, i, used);
      const made = await lipsync(ctx, piece, face, quiet, idleSeconds, resolution);
      idle.push({ key: face.key, ...made });
      ctx.progress({ done: clips.length + idle.length, total: jobs });
    }
  }
  return kitCheckOutputs(ctx, manifest, { clips, idle });
}
