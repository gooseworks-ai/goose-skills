// check-layer 1.8.0: setup_count_vs_reference. Distinct setups are shot keyframes clustered by
// dHash (within 10 bits); the check fails when the final has more than 30 % fewer than the
// reference's count, and is not_applicable without it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, layerInputsFor, loadNewest, loadPart, makeCtx, run } from '../../_tools/kit-harness.mjs';
import { chkSetupClusters, chkSetupVerdict } from '../src/setups.mjs';

const { dir, mod } = await loadNewest('check-layer');
const v170 = await loadPart('check-layer', '1.7.0');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const NOISE = 'anoisesrc=color=pink:amplitude=0.25:sample_rate=48000:seed=7';

/** A cut from pictures [[lavfi source, seconds]], 30 fps, with pink-noise sound. */
async function cut(workDir, name, pictures) {
  const args = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y'];
  const chains = [];
  pictures.forEach(([video, seconds], i) => {
    args.push('-f', 'lavfi', '-t', String(seconds), '-i', `${video}=size=720x1280:rate=30`, '-f', 'lavfi', '-t', String(seconds), '-i', NOISE);
    chains.push(`[${2 * i}:v]format=yuv420p,setsar=1[v${i}];[${2 * i + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo[a${i}]`);
  });
  const out = join(workDir, `${name}.mp4`);
  const joined = pictures.map((_, i) => `[v${i}][a${i}]`).join('');
  await run('ffmpeg', [...args, '-filter_complex', `${chains.join(';')};${joined}concat=n=${pictures.length}:v=1:a=1[v][a]`, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', out]);
  return fileRef(out, 'video');
}

/** A linked timeline whose segments follow the pictures, one source per lavfi source. */
function linked(pictures) {
  let at = 0;
  const segments = pictures.map(([video, seconds], i) => {
    const seg = { id: `s${i}`, scene_id: `s${i}`, start_ms: at, end_ms: at + seconds * 1000, video: { asset_id: video, sha256: 'a'.repeat(64), in_ms: 0, out_ms: seconds * 1000, speed: 1 }, speech_mode: 'none', depicts_speech: false, native_audio: 'muted' };
    at += seconds * 1000;
    return seg;
  });
  return { format: 'gooseworks-assembly-timeline/1', duration_ms: at, speech_mode: 'narration', soundtrack_modes: ['music'], segments, audio_cues: [], pauses: [], required_cue_ids: [], visual_overrides: [] };
}

async function setups(part, pictures, expect = {}) {
  const { ctx } = makeCtx({ partDir: part.dir });
  const video = await cut(ctx.workDir, 'cut', pictures);
  const inputs = await layerInputsFor(video, { expect: { duration_s: { min: 1, max: 60 }, speech: 'none', captions: false, end_card: false, music: true, ...expect }, timeline: { assembly_timeline: linked(pictures) } });
  const out = await part.mod.run(inputs, ctx);
  return out.verdict.checks.find((c) => c.code === 'setup_count_vs_reference');
}

test('clusters: keyframes within 10 bits are one setup (single linkage); the verdict allows 30 % fewer', () => {
  const a = '0'.repeat(64);
  const near = '1'.repeat(8) + '0'.repeat(56);
  const chain = '1'.repeat(16) + '0'.repeat(48);
  const far = '1'.repeat(40) + '0'.repeat(24);
  assert.equal(chkSetupClusters([a, near]), 1);
  assert.equal(chkSetupClusters([a, near, chain]), 1, 'joined through the middle one');
  assert.equal(chkSetupClusters([a, far]), 2);
  assert.equal(chkSetupClusters([]), 0);
  // The Clearday test video: 4 setups against about 10.
  assert.equal(chkSetupVerdict(4, 10, 17).status, 'fail');
  assert.match(chkSetupVerdict(4, 10, 17).message, /4 distinct setups against the reference's 10/);
  assert.equal(chkSetupVerdict(7, 10, 12).status, 'pass', '30 % fewer is the limit');
  assert.equal(chkSetupVerdict(6, 10, 12).status, 'fail');
});

test('two pictures cut back and forth are 2 setups and fail against 4; four pictures pass', { skip }, async () => {
  const pingPong = await setups({ dir, mod }, [['smptebars', 1.5], ['testsrc2', 1.5], ['smptebars', 1.5], ['testsrc2', 1.5]], { reference_setups: 4 });
  assert.equal(pingPong.status, 'fail', pingPong.found);
  assert.match(pingPong.found, /^2 setups from 4 shots$/);
  const four = await setups({ dir, mod }, [['smptebars', 1.5], ['testsrc2', 1.5], ['mandelbrot', 1.5], ['rgbtestsrc', 1.5]], { reference_setups: 4 });
  assert.equal(four.status, 'pass', four.found);
});

test('not_applicable without expect.reference_setups; 1.7.0 has no such check', { skip }, async () => {
  const none = await setups({ dir, mod }, [['smptebars', 1.5], ['testsrc2', 1.5]]);
  assert.equal(none.status, 'not_applicable');
  assert.equal(await setups(v170, [['smptebars', 1.5], ['testsrc2', 1.5]]), undefined);
});
