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
// matches the approved script (as the timeline's speech carries it: a transcribe step's heard words for
// on-camera speech, the voice's spoken lines for a voiceover). It orders nothing.
// It returns the server's reasons shape too, for the one local fix.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg } from '../../_lib/part.mjs';
import { speechBuildAliases, speechReview } from '../../_lib/speech.mjs';
import { kitLogoScore, kitLogoScoreInBox, kitMotion, kitWindowLevels } from '../../_lib/frames.mjs';

const TARGET_LUFS = -14;
const LUFS_TOLERANCE = 2;
const LENGTH_SLACK_S = 0.5;
const ASPECT_TOLERANCE = 0.02;
const MIN_SHORT_SIDE_PX = 720;
const BLACK_MAX_S = 0.3;
const OPENING_STILL_MAX_S = 1.5;
const HELD_PICTURE_MAX_S = 4.0;
// A held picture inside one scene is that scene's own still; one that runs this far past a scene start
// means the next scene never showed.
const SCENE_EDGE_S = 0.2;
// sound-layer's line: at or below this a cut is silent (it passes such a cut through unlevelled).
const SILENT_LUFS = -50;
const SERVER = new Set(['plays', 'length', 'size', 'sound', 'captions']);
// review-finished-ad: the platform bands at 1080x1920, the logo match floors and the favicon guard.
const PLATFORM_TOP = 220;
const PLATFORM_BOTTOM = 400;
const PLATFORM_RIGHT = 140;
const LOGO_MARK_MIN = 0.75;
const LOGO_IMAGE_MIN = 0.7;
const MIN_LOGO_LONG_SIDE = 256;
const MIN_LOGO_AREA = 40000;
// logo-equation-card's measure_motion gate, and the rise a message's sound makes over the moment before it.
const FOOTAGE_MIN_MOTION = 1.5;
const SOUND_RISE_DB = 4;
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
    const { stderr } = await ctx.tools.exec('ffmpeg', ['-hide_banner', '-nostats', '-nostdin', '-i', path, '-map', '0:a:0', '-af', 'ebur128=framelog=verbose', '-f', 'null', '-']);
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

async function wordsRecord(words) {
  if (!words) return null;
  try {
    return JSON.parse(await readFile(words.path, 'utf8'));
  } catch {
    return null;
  }
}

/** Where captions may be: the timeline's caption zone, clear of the platform bands (scaled from 1080x1920). */
function safeZone(timeline, W, H) {
  const zone = { left: 0, top: (PLATFORM_TOP * H) / 1920, right: W - (PLATFORM_RIGHT * W) / 1080, bottom: H - (PLATFORM_BOTTOM * H) / 1920 };
  const c = (timeline.safe_zones || []).find((z) => z.use === 'captions');
  if (c) {
    zone.left = Math.max(zone.left, c.x);
    zone.top = Math.max(zone.top, c.y);
    zone.right = Math.min(zone.right, c.x + c.w);
    zone.bottom = Math.min(zone.bottom, c.y + c.h);
  }
  return zone;
}

async function cueCount(ctx, words, duration) {
  const record = await wordsRecord(words);
  if (!record) return 0;
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

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { video, timeline, expect } = inputs;
  const checks = [];
  const reasons = [];
  const add = (code, status, { message, expected, found, fix } = {}) => {
    const c = { code, status };
    // A failed or warned check carries its own plain words: the kit reports the first failed check's message.
    if (status === 'fail' || status === 'warn') c.message = message || 'The video did not pass one of the final checks.';
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

  // Sound: a cut with speech must have it at -14 LUFS within 2. A silent cut with no speech planned is a
  // style whose music is optional with none chosen (audio-mix gives it a silent track): nothing to measure.
  const lufs = m.has_audio ? await loudness(ctx, video.path) : null;
  const silent = lufs === null || !Number.isFinite(lufs) || lufs <= SILENT_LUFS;
  if (silent && expect.speech === 'none') add('sound', 'not_applicable', { found: m.has_audio ? 'silent' : 'no sound track' });
  else if (silent) {
    add('sound', 'fail', { message: 'The video has no sound.', expected: `${TARGET_LUFS} LUFS`, found: 'no sound', fix: { slot: 'sound' } });
  } else if (Math.abs(lufs - TARGET_LUFS) > LUFS_TOLERANCE) {
    add('sound', 'fail', {
      message: lufs < TARGET_LUFS ? 'The sound is too quiet.' : 'The sound is too loud.',
      expected: `${TARGET_LUFS} LUFS`,
      found: `${lufs.toFixed(1)} LUFS`,
      fix: { slot: 'sound' },
    });
  } else add('sound', 'pass', { found: `${lufs.toFixed(1)} LUFS` });

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
  // A still scene may hold as long as it lasts, unless the style asks for moving footage or the timeline
  // names no scenes: then any hold over the limit fails, as does one that runs on past a scene start.
  const strictHold = (expect.qc_flags || []).includes('footage_moves') || !(timeline.scenes || []).length;
  const sceneStarts = (timeline.scenes || []).map((sc) => sc.start_s);
  const held = freezes.find(([s, e]) => {
    const end = Math.min(e, bodyEnd);
    if (!(s < bodyEnd && end - s > HELD_PICTURE_MAX_S)) return false;
    return strictHold || sceneStarts.some((t) => s < t - SCENE_EDGE_S && end > t + SCENE_EDGE_S);
  });
  if (opening) add('frozen_frames', 'fail', { message: `The opening picture is still for ${(opening[1] - opening[0]).toFixed(1)} seconds.`, expected: `the opening moves within ${OPENING_STILL_MAX_S} s`, found: +(opening[1] - opening[0]).toFixed(2) });
  else if (held) add('frozen_frames', 'fail', { message: `The picture is frozen from ${held[0].toFixed(1)} to ${held[1].toFixed(1)} seconds.`, expected: `no held picture over ${HELD_PICTURE_MAX_S} s before the end card`, found: +(Math.min(held[1], bodyEnd) - held[0]).toFixed(2) });
  else add('frozen_frames', 'pass');

  // The brand layer and the end-card and phone-chat parts mark the card they add; a frame page that
  // draws its own ending does not, and then there is nothing to measure here.
  const card = timeline.end_card;
  if (!expect.end_card) add('end_card', 'not_applicable');
  else if (!card) {
    // The style ends on an end card, but no step marked one in the timeline: it cannot be shown to be there.
    add('end_card', 'fail', { message: 'The video does not end on the brand end card.', expected: 'an end card marked in the timeline', found: 'not marked by any step', fix: { slot: 'brand' } });
  } else if (card.end_s - card.start_s >= 0.5 && Math.abs(card.end_s - d) <= 0.2) add('end_card', 'pass');
  else add('end_card', 'fail', { message: 'The video does not end on the brand end card.', expected: 'an end card of at least 0.5 s at the end', found: `${card.start_s}-${card.end_s} s`, fix: { slot: 'brand' } });

  // Captions inside the caption safe zone and clear of the platform controls (TikTok/Reels bands).
  const record = await wordsRecord(inputs.words);
  const boxes = record ? (record.cues || []).filter((c) => c.box) : [];
  if (!boxes.length) add('captions_safe_zone', 'not_applicable');
  else {
    const zone = safeZone(timeline, m.width, m.height);
    const out = boxes.find((c) => c.box.x < zone.left - 0.5 || c.box.y < zone.top - 0.5 || c.box.x + c.box.w > zone.right + 0.5 || c.box.y + c.box.h > zone.bottom + 0.5);
    if (out) add('captions_safe_zone', 'fail', { message: `The caption "${out.text}" leaves the safe zone.`, expected: `inside x ${Math.round(zone.left)}-${Math.round(zone.right)}, y ${Math.round(zone.top)}-${Math.round(zone.bottom)}`, found: `${Math.round(out.box.x)},${Math.round(out.box.y)} ${Math.round(out.box.w)}x${Math.round(out.box.h)}`, fix: { slot: 'captions' } });
    else add('captions_safe_zone', 'pass');
  }

  // The brand's real logo file (review-finished-ad's logo and favicon checks), measured two ways that never
  // share an answer: `logo` on the end card when the style ends on one, and `flag:logo_visible` anywhere in
  // the video (the card included) when the style asks for it. When a step declared the box it drew the logo
  // in, the match runs in that box at full resolution. Without one the whole frame is searched at low
  // resolution, which misses a small, badged or tilted logo: then a miss is a warning unless the brand layer,
  // the one fix it could name, is on (the kit does not say yet, so expect.layers is read when it comes).
  const wantsLogo = (expect.qc_flags || []).includes('logo_visible');
  const logo = inputs.brand.logo;
  const logoZone = (timeline.safe_zones || []).find((z) => z.use === 'logo' && z.w > 0 && z.h > 0);
  const brandSlotOn = !!(expect.layers && typeof expect.layers === 'object' && expect.layers.brand === true);
  let logoSize = null;
  const logoCheck = async (times) => {
    if (!logo) return { status: 'fail', message: 'The style asks for the logo, but the brand has no logo file.', expected: 'a logo file', found: 'none' };
    logoSize = logoSize || (logo.width && logo.height ? logo : await ctx.tools.probe(logo.path));
    const long = Math.max(logoSize.width || 0, logoSize.height || 0);
    if (long < MIN_LOGO_LONG_SIDE || (logoSize.width || 0) * (logoSize.height || 0) < MIN_LOGO_AREA) {
      return { status: 'fail', message: 'The logo file is favicon-sized and will be blurry.', expected: `at least ${MIN_LOGO_LONG_SIDE} px on the long side`, found: `${logoSize.width}x${logoSize.height}` };
    }
    const at = times.filter((t) => t > 0 && t < d);
    if (logoZone) {
      const z = logoZone;
      const match = await kitLogoScoreInBox(ctx, video.path, logo, at, m.width, m.height, z);
      const floor = match.mode === 'mark' ? LOGO_MARK_MIN : LOGO_IMAGE_MIN;
      if (match.score < floor) {
        return { status: 'fail', message: "The brand's logo is not clear where the video draws it.", expected: `a match of at least ${floor} inside x ${z.x}-${z.x + z.w}, y ${z.y}-${z.y + z.h}`, found: match.score };
      }
      return { status: 'pass', found: match.score };
    }
    const match = await kitLogoScore(ctx, video.path, logo, at, m.width, m.height);
    const floor = match.mode === 'mark' ? LOGO_MARK_MIN : LOGO_IMAGE_MIN;
    if (match.score < floor) {
      return { status: brandSlotOn ? 'fail' : 'warn', message: "The brand's logo is not found.", expected: `a match of at least ${floor}`, found: match.score };
    }
    return { status: 'pass', found: match.score };
  };
  const logoAdd = (code, result) => {
    const { status, ...rest } = result;
    if (status === 'fail') return add(code, status, { ...rest, fix: { slot: 'brand' } });
    if (status === 'warn') return add(code, status, rest);
    return add(code, status, { found: rest.found });
  };
  if (expect.end_card && logo) {
    const card = timeline.end_card;
    logoAdd('logo', await logoCheck(card ? [card.start_s + (card.end_s - card.start_s) * 0.5, card.end_s - 0.2] : [d - 1.2, d - 0.6, d - 0.2]));
  } else add('logo', 'not_applicable');
  // Spread over the whole video, and the end card's middle when there is one.
  const visibleTimes = [0.05, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 0.98].map((f) => f * d);
  if (timeline.end_card) visibleTimes.push((timeline.end_card.start_s + timeline.end_card.end_s) / 2);
  const logoVisible = wantsLogo ? await logoCheck(visibleTimes) : null;

  // The style's own checks (qc_flags). The ones a machine can measure are measured and count toward the
  // verdict; the rest (text legible, products visible) need eyes and are reported as not checked here.
  for (const flag of expect.qc_flags || []) {
    const code = `flag:${flag}`;
    if (flag === 'logo_visible') logoAdd(code, logoVisible);
    else if (flag === 'footage_moves') {
      const motion = await kitMotion(ctx, video.path, timeline.end_card ? timeline.end_card.start_s : d);
      if (motion === null) add(code, 'fail', { message: 'The footage could not be measured.', expected: `motion of at least ${FOOTAGE_MIN_MOTION}`, found: 'no frames' });
      else if (motion >= FOOTAGE_MIN_MOTION) add(code, 'pass', { found: motion });
      else add(code, 'fail', { message: 'The footage reads as a still photo.', expected: `motion of at least ${FOOTAGE_MIN_MOTION}`, found: motion });
    } else if (flag === 'sounds_match_messages') {
      const cardStart = timeline.end_card ? timeline.end_card.start_s : Infinity;
      const starts = (timeline.scenes || []).map((sc) => sc.start_s).filter((t) => t > 0.4 && t < cardStart - 0.1);
      if (!starts.length) add(code, 'not_applicable');
      else {
        const levels = await kitWindowLevels(ctx, video.path, starts.flatMap((t) => [[t, t + 0.25], [t - 0.35, t - 0.05]]));
        const silentAt = starts.find((t, i) => !(levels[2 * i] > -50 && levels[2 * i] - levels[2 * i + 1] >= SOUND_RISE_DB));
        if (silentAt === undefined) add(code, 'pass', { found: starts.length });
        else add(code, 'fail', { message: `No sound when the message at ${silentAt.toFixed(2)} s appears.`, expected: 'a sound with every message', found: `${silentAt.toFixed(2)} s` });
      }
    } else add(code, 'not_applicable', { found: 'needs eyes; not checked by machine' });
  }

  const script = (expect.script || []).map((s) => String(s).trim()).filter(Boolean);
  // What was said: each speech entry's `spoken` (a transcribe step's heard words, or the voice's spoken
  // form), else its text for a voice that said exactly its line. On-camera speech must have been
  // transcribed by a step before the layers: this layer orders nothing.
  const speech = timeline.speech || [];
  const untranscribed = expect.speech === 'on_camera' && (!speech.length || speech.some((s) => typeof s.spoken !== 'string'));
  if (!script.length || expect.speech === 'none') add('speech_matches_script', 'not_applicable');
  else if (untranscribed) {
    add('speech_matches_script', 'fail', { message: 'The on-camera speech was not transcribed, so it cannot be checked against the script.', expected: 'a transcribe step before the layers', found: 'no transcript' });
  } else {
    const heard = speech.map((s) => (typeof s.spoken === 'string' ? s.spoken : s.text)).join(' ');
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
  ctx.log.info('check layer verdict', {
    pass,
    failed: checks.filter((c) => c.status === 'fail').map((c) => c.code),
    warned: checks.filter((c) => c.status === 'warn').map((c) => c.code),
    server_failed: reasons.filter((r) => SERVER.has(r.check)).length,
  });
  return kitCheckOutputs(ctx, manifest, { verdict: { pass, checks, reasons } });
}
