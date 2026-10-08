// check-layer: checks the finished cut and never changes it. One quality
// path for every video (review-finished-ad and review-ugc-render in
// JavaScript). The five checks our server runs on upload, with the same
// limits, so a local pass predicts the server's: plays (decodes end to end),
// length (inside the style's range, 0.5 s slack), size (the plan's aspect
// within 2 %, at least 720 px on the short side), sound (-14 LUFS within 2,
// when the cut must have sound) and captions (at least one timed caption with
// text inside the video). Then the local ones: black frames (over 0.3 s),
// frozen frames (an opening still over 1.5 s, or a held picture over 4 s
// before the end card), the end card the style ends on, and speech that
// matches the approved script (the cut's audio transcribed by fal Whisper
// for on-camera speech, the spoken lines compared for a voiceover).
// It returns the server's reasons shape too, for the one local fix.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg } from '../../_lib/part.mjs';
import { speechBuildAliases, speechReview } from '../../_lib/speech.mjs';

const TARGET_LUFS = -14;
const LUFS_TOLERANCE = 2;
const LENGTH_SLACK_S = 0.5;
const ASPECT_TOLERANCE = 0.02;
const MIN_SHORT_SIDE_PX = 720;
const BLACK_MAX_S = 0.3;
const OPENING_STILL_MAX_S = 1.5;
const HELD_PICTURE_MAX_S = 4.0;
const SERVER = new Set(['plays', 'length', 'size', 'sound', 'captions']);
const NUM = '-?\\d+(?:\\.\\d+)?(?:e-?\\d+)?';

function ratioOf(aspect) {
  const [w, h] = aspect.split(':').map(Number);
  return w / h;
}

function spans(log, key, duration) {
  const out = [];
  let start = null;
  for (const line of log.split('\n')) {
    const s = new RegExp(`${key}_start:\\s*(${NUM})`).exec(line);
    if (s) start = Number(s[1]);
    const e = new RegExp(`${key}_end:\\s*(${NUM})`).exec(line);
    if (e && start !== null) {
      out.push([start, Number(e[1])]);
      start = null;
    }
  }
  if (start !== null) out.push([start, duration]);
  return out;
}

async function measure(ctx, path) {
  let info;
  try {
    const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', path]);
    info = JSON.parse(stdout);
  } catch {
    return { plays: false, duration_s: null, width: null, height: null, has_audio: false };
  }
  const video = (info.streams || []).find((s) => s.codec_type === 'video');
  const hasAudio = (info.streams || []).some((s) => s.codec_type === 'audio');
  const duration = Number(info.format && info.format.duration);
  let plays = !!video;
  if (plays) {
    try {
      const { stderr } = await ctx.tools.exec('ffmpeg', ['-v', 'error', '-nostdin', '-i', path, '-f', 'null', '-']);
      plays = !stderr.trim();
    } catch {
      plays = false;
    }
  }
  return {
    plays,
    duration_s: Number.isFinite(duration) ? duration : null,
    width: video ? video.width : null,
    height: video ? video.height : null,
    has_audio: hasAudio,
  };
}

async function loudness(ctx, path) {
  try {
    const { stderr } = await ctx.tools.exec('ffmpeg', ['-hide_banner', '-nostats', '-nostdin', '-i', path, '-map', '0:a:0', '-af', 'ebur128', '-f', 'null', '-']);
    const m = /I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/.exec(stderr.slice(stderr.lastIndexOf('Summary:')));
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

/** Freeze and black spans from one decode of a small copy of the picture. */
async function analyse(ctx, path, duration) {
  const { stderr } = await kitFfmpeg(ctx, ['-nostats', '-i', path, '-an', '-vf', 'scale=270:-2,freezedetect=n=-60dB:d=1.0,blackdetect=d=0.2:pix_th=0.10', '-f', 'null', '-']);
  return { freezes: spans(stderr, 'freeze', duration), blacks: spans(stderr, 'black', duration) };
}

async function cueCount(ctx, words, duration) {
  if (!words) return 0;
  let record;
  try {
    record = JSON.parse(await readFile(words.path, 'utf8'));
  } catch {
    return 0;
  }
  return (record.cues || []).filter(
    (c) => String(c.text || '').trim() && Number.isFinite(c.start_s) && Number.isFinite(c.end_s) && c.end_s > c.start_s && c.start_s < duration && c.end_s > 0,
  ).length;
}

function usableAliases(ctx, pronunciations) {
  const out = [];
  for (const p of pronunciations || []) {
    try {
      speechBuildAliases([[p.term, p.say_as]]);
      out.push([p.term, p.say_as]);
    } catch (e) {
      ctx.log.warn('pronunciation not used by the speech check', { term: p.term, reason: e.message });
    }
  }
  return out;
}

async function heardSpeech(ctx, video) {
  if (!ctx.line) throw ctx.error('needs_missing', 'the speech check needs the private line');
  await kitFfmpeg(ctx, ['-i', video.path, '-map', '0:a:0', '-ac', '1', ...ctx.tools.encodeArgs('aac'), join(ctx.tmpDir, 'speech.m4a')]);
  const audio = await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/speech.m4a`, 'audio');
  const result = await ctx.line.order({
    piece: 'transcribe',
    provider: 'fal',
    path: '/fal-ai/whisper',
    body: { audio_url: audio, task: 'transcribe', language: 'en', chunk_level: 'word' },
    results: [],
  });
  const json = result.json || {};
  if (typeof json.text === 'string' && json.text.trim()) return json.text;
  return (json.chunks || []).map((c) => String(c.text || '').trim()).filter(Boolean).join(' ');
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { video, timeline, expect } = inputs;
  const checks = [];
  const reasons = [];
  const add = (code, status, { message, expected, found, fix } = {}) => {
    const c = { code, status };
    if (found !== undefined) c.found = found;
    if (expected !== undefined) c.expected = expected;
    if (fix) c.fix = fix;
    checks.push(c);
    if (status === 'fail') {
      const r = { check: code, message };
      if (expected !== undefined) r.expected = expected;
      if (found !== undefined) r.found = String(found);
      reasons.push(r);
    }
  };

  const m = await measure(ctx, video.path);
  if (!m.plays) {
    add('plays', 'fail', { message: "The video doesn't play all the way through." });
    return kitCheckOutputs(ctx, manifest, { verdict: { pass: false, checks, reasons } });
  }
  add('plays', 'pass');
  const d = m.duration_s;

  const { min, max } = expect.duration_s;
  if (d === null || d < min - LENGTH_SLACK_S || d > max + LENGTH_SLACK_S) {
    add('length', 'fail', {
      message: d !== null && d < min ? 'The video is too short.' : 'The video is too long.',
      expected: `${min} to ${max} seconds`,
      found: d === null ? 'unknown' : `${d.toFixed(1)} seconds`,
    });
  } else add('length', 'pass', { found: `${d.toFixed(1)} seconds` });

  const ratio = ratioOf(expect.aspect);
  const shapeOk = m.width && m.height && Math.min(m.width, m.height) >= MIN_SHORT_SIDE_PX && Math.abs(m.width / m.height - ratio) / ratio <= ASPECT_TOLERANCE;
  if (!shapeOk) {
    add('size', 'fail', {
      message: "The picture isn't the shape or size this style makes.",
      expected: `${expect.aspect}, at least ${MIN_SHORT_SIDE_PX} pixels on the short side`,
      found: m.width && m.height ? `${m.width}x${m.height}` : 'no picture',
    });
  } else add('size', 'pass', { found: `${m.width}x${m.height}` });

  // Sound: required when the style levels sound (expect.sound), else when the cut has a track or speech.
  const needSound = expect.sound !== undefined ? expect.sound : m.has_audio || expect.speech !== 'none';
  if (!needSound) add('sound', 'not_applicable');
  else {
    const lufs = m.has_audio ? await loudness(ctx, video.path) : null;
    if (lufs === null || lufs <= -70) {
      add('sound', 'fail', { message: 'The video has no sound.', expected: `${TARGET_LUFS} LUFS`, found: 'no sound', fix: { slot: 'sound' } });
    } else if (Math.abs(lufs - TARGET_LUFS) > LUFS_TOLERANCE) {
      add('sound', 'fail', {
        message: lufs < TARGET_LUFS ? 'The sound is too quiet.' : 'The sound is too loud.',
        expected: `${TARGET_LUFS} LUFS`,
        found: `${lufs.toFixed(1)} LUFS`,
        fix: { slot: 'sound' },
      });
    } else add('sound', 'pass', { found: `${lufs.toFixed(1)} LUFS` });
  }

  if (!expect.captions) add('captions', 'not_applicable');
  else if ((await cueCount(ctx, inputs.words, d)) === 0) {
    add('captions', 'fail', { message: 'The captions are missing.', expected: 'captions for the spoken lines', found: 'none', fix: { slot: 'captions' } });
  } else add('captions', 'pass');

  const { freezes, blacks } = await analyse(ctx, video.path, d);
  const black = blacks.find(([s, e]) => e - s > BLACK_MAX_S);
  if (black) add('black_frames', 'fail', { message: `Black frames from ${black[0].toFixed(1)} to ${black[1].toFixed(1)} seconds.`, expected: `no black stretch over ${BLACK_MAX_S} s`, found: +(black[1] - black[0]).toFixed(2) });
  else add('black_frames', 'pass');

  const bodyEnd = timeline.end_card ? timeline.end_card.start_s : d;
  const opening = freezes.find(([s, e]) => s <= 0.3 && e - s > OPENING_STILL_MAX_S);
  const held = freezes.find(([s, e]) => s < bodyEnd && Math.min(e, bodyEnd) - s > HELD_PICTURE_MAX_S);
  if (opening) add('frozen_frames', 'fail', { message: `The opening picture is still for ${(opening[1] - opening[0]).toFixed(1)} seconds.`, expected: `the opening moves within ${OPENING_STILL_MAX_S} s`, found: +(opening[1] - opening[0]).toFixed(2) });
  else if (held) add('frozen_frames', 'fail', { message: `The picture is frozen from ${held[0].toFixed(1)} to ${held[1].toFixed(1)} seconds.`, expected: `no held picture over ${HELD_PICTURE_MAX_S} s before the end card`, found: +(Math.min(held[1], bodyEnd) - held[0]).toFixed(2) });
  else add('frozen_frames', 'pass');

  if (!expect.end_card) add('end_card', 'not_applicable');
  else {
    const card = timeline.end_card;
    const ok = card && card.end_s - card.start_s >= 0.5 && Math.abs(card.end_s - d) <= 0.2;
    if (ok) add('end_card', 'pass');
    else add('end_card', 'fail', { message: 'The video does not end on the brand end card.', expected: 'an end card of at least 0.5 s at the end', found: card ? `${card.start_s}-${card.end_s} s` : 'none', fix: { slot: 'brand' } });
  }

  const script = (expect.script || []).map((s) => String(s).trim()).filter(Boolean);
  if (!script.length || expect.speech === 'none') add('speech_matches_script', 'not_applicable');
  else {
    const heard = expect.speech === 'on_camera' ? await heardSpeech(ctx, video) : (timeline.speech || []).map((s) => s.text).join(' ');
    const verdict = speechReview(script.join(' '), heard, { aliases: usableAliases(ctx, inputs.brand.pronunciations) });
    const worst = verdict.issues.find((i) => i.severity === 'high') || verdict.issues.find((i) => i.severity !== 'low');
    if (verdict.passed) add('speech_matches_script', 'pass', { found: +verdict.ratio.toFixed(3) });
    else {
      add('speech_matches_script', 'fail', {
        message: worst ? `The speech differs from the approved script: ${worst.note}` : 'The speech differs from the approved script.',
        expected: 'the approved lines, as written',
        found: +verdict.ratio.toFixed(3),
      });
    }
  }

  const pass = checks.every((c) => c.status !== 'fail');
  ctx.log.info('check layer verdict', { pass, failed: checks.filter((c) => c.status === 'fail').map((c) => c.code), server_failed: reasons.filter((r) => SERVER.has(r.check)).length });
  return kitCheckOutputs(ctx, manifest, { verdict: { pass, checks, reasons } });
}
