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
// 1.3.0 adds the style flags text_led (blank frames judged instead of dark
// ones), read_rate, cuts_between_words, cut_rate and retained_body (the
// content checks run only inside the first scene, a new opening spliced onto
// a kept body; the rest is not checked).
// 1.4.0 adds per-shot flags (a shot runs from one scene start to the next):
// captions_cross_cuts, min_shot, ambience_floor, cut_contrast and
// distinct_adjacent_shots. 1.4.2 hears a message's sound by its loudest
// 50 ms over the bed before it, so a levelled cut's short pops still count,
// and a measured taste check outside its range (length, loudness, pacing,
// stills, shots, cuts, captions across cuts, room tone, motion, a sparse
// text-led cut) warns instead of failing. What could not be measured, and
// what is broken or missing, still fails.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg } from '../../_lib/part.mjs';
import { speechBuildAliases, speechReview } from '../../_lib/speech.mjs';
import { kitLogoScore, kitLogoScoreInBox, kitMotion, kitWindowLevels } from '../../_lib/frames.mjs';
import { CHK_BLANK_MAX_SHARE, CHK_CUT_MAX_RATE, CHK_CUT_MIN_RATE, CHK_MSG_RISE_DB, CHK_READ_MAX_WPS, CHK_READ_MIN_WPS, chkBlankFrames, chkBlankSpans, chkClipSpans, chkCutInsideWord, chkCuts, chkJudgeBlank, chkMessageRise, chkMessageWindows, chkReadRate, chkSpeechBefore } from './flags.mjs';
import { CHK_CONTRAST_MIN, CHK_CONTRAST_OFFSET_S, CHK_CONTRAST_WARN, CHK_CUE_GUARD_S, CHK_DISTINCT_MIN, CHK_FLOOR_MAX_DB, CHK_FLOOR_MIN_DB, CHK_FLOOR_SPEECH_GAP_DB, CHK_MIN_SHOT_S, chkAdjacentDiffs, chkCueAcrossCut, chkCutContrast, chkFloorWindows, chkJudgeAmbience, chkSceneOpenings, chkShortShot, chkShotSound, chkShots, chkSpeechSpans } from './shots.mjs';

const TARGET_LUFS = -14;
const LUFS_TOLERANCE = 2;
const LENGTH_SLACK_S = 0.5;
// The server's limits for any finished video, with no slack: outside them the length fails, whatever the style.
const ANY_MIN_S = 1;
const ANY_MAX_S = 600;
const ASPECT_TOLERANCE = 0.02;
const MIN_SHORT_SIDE_PX = 720;
const BLACK_MAX_S = 0.3;
const OPENING_STILL_MAX_S = 1.5;
const HELD_PICTURE_MAX_S = 4.0;
// A held picture inside one scene is that scene's own still; one that runs this far past a scene start
// means the next scene never showed.
const SCENE_EDGE_S = 0.2;
// The server's line: at or below this a track is silence (ffmpeg reads digital silence as -70 LUFS).
const SILENT_LUFS = -60;
const SERVER = new Set(['plays', 'length', 'size', 'sound', 'captions']);
// review-finished-ad: the platform bands at 1080x1920, the logo match floors and the favicon guard.
const PLATFORM_TOP = 220;
const PLATFORM_BOTTOM = 400;
const PLATFORM_RIGHT = 140;
const LOGO_MARK_MIN = 0.75;
const LOGO_IMAGE_MIN = 0.7;
const MIN_LOGO_LONG_SIDE = 256;
// logo-equation-card's measure_motion gate.
const FOOTAGE_MIN_MOTION = 1.5;
const NUM = '-?\\d+(?:\\.\\d+)?(?:e-?\\d+)?';
// Flags a machine measures here; any other flag is reported not_applicable (one that needs eyes, or one a
// later check layer measures: a style may declare a flag before its layer version is pinned).
const MEASURED_FLAGS = new Set(['logo_visible', 'footage_moves', 'sounds_match_messages', 'text_led', 'read_rate', 'cuts_between_words', 'cut_rate', 'retained_body', 'captions_cross_cuts', 'min_shot', 'ambience_floor', 'cut_contrast', 'distinct_adjacent_shots']);
const EYES_FLAGS = new Set(['text_legible', 'products_visible']);
// retained_body: the new opening starts the video (within this) and leaves at least this much kept body.
const RETAINED_START_MAX_S = 0.05;
const RETAINED_BODY_MIN_S = 0.05;

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
  if (d === null) add('length', 'fail', { message: "The video's length could not be measured.", expected: `${min} to ${max} seconds`, found: 'unknown' });
  else if (d < ANY_MIN_S || d > ANY_MAX_S) {
    add('length', 'fail', { message: d < ANY_MIN_S ? 'The video is too short.' : 'The video is too long.', expected: `${ANY_MIN_S} to ${ANY_MAX_S} seconds`, found: `${d.toFixed(1)} seconds` });
  } else if (d < min - LENGTH_SLACK_S || d > max + LENGTH_SLACK_S) {
    add('length', 'warn', { message: d < min ? 'The video is too short.' : 'The video is too long.', expected: `${min} to ${max} seconds`, found: `${d.toFixed(1)} seconds` });
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

  // Sound, as the server judges it: silence (no track, or one at or below -60 LUFS) passes only when nothing
  // is planned to sound: no speech, and no music or voice in the plan (expect.music and expect.voice, read when
  // the kit passes them). A track whose loudness cannot be read fails.
  const soundPlanned = expect.speech !== 'none' || expect.music === true || expect.voice === true;
  const read = m.has_audio ? await loudness(ctx, video.path) : null;
  const lufs = read !== null && Number.isFinite(read) ? read : null;
  const silent = !m.has_audio || (lufs !== null && lufs <= SILENT_LUFS);
  if (silent && !soundPlanned) add('sound', 'not_applicable', { found: m.has_audio ? 'silent' : 'no sound track' });
  else if (silent) {
    add('sound', 'fail', { message: 'The video has no sound.', expected: `${TARGET_LUFS} LUFS`, found: 'no sound', fix: { slot: 'sound' } });
  } else if (lufs === null) {
    add('sound', 'fail', { message: "The sound's loudness could not be measured.", expected: `${TARGET_LUFS} LUFS`, found: 'no reading', fix: { slot: 'sound' } });
  } else if (Math.abs(lufs - TARGET_LUFS) > LUFS_TOLERANCE) {
    add('sound', 'warn', { message: lufs < TARGET_LUFS ? 'The sound is too quiet.' : 'The sound is too loud.', expected: `${TARGET_LUFS} LUFS`, found: `${lufs.toFixed(1)} LUFS` });
  } else add('sound', 'pass', { found: `${lufs.toFixed(1)} LUFS` });

  if (!expect.captions) add('captions', 'not_applicable');
  else if ((await cueCount(ctx, inputs.words, d)) === 0) {
    add('captions', 'fail', { message: 'The captions are missing.', expected: 'captions for the spoken lines', found: 'none', fix: { slot: 'captions' } });
  } else add('captions', 'pass');

  const flags = expect.qc_flags || [];
  // retained_body: a new opening (the first scene) spliced onto a body kept as it was. The content checks
  // (black and frozen frames, captions placement, logo, speech against the script, the measured flags) run
  // only inside the opening; the kept body is not judged. With no first scene marked, nothing is checked
  // and the flag fails: the opening cannot be told from the body.
  // The opening counts as marked only when the first scene starts the video and ends inside it, with a
  // kept body after it; anything else (no scene, one that starts later or covers the whole cut) fails the flag.
  const retained = flags.includes('retained_body');
  const hook = retained ? (timeline.scenes || [])[0] : null;
  const hookMarked = !!hook && hook.start_s <= RETAINED_START_MAX_S && hook.end_s > hook.start_s && hook.end_s < d - RETAINED_BODY_MIN_S;
  const contentEnd = !retained ? d : hookMarked ? hook.end_s : 0;
  const notChecked = 'kept body; only the new opening is checked';

  const { freezes: allFreezes, blacks: allBlacks } = await analyse(ctx, video.path, d);
  const freezes = retained ? chkClipSpans(allFreezes, contentEnd) : allFreezes;
  const blacks = retained ? chkClipSpans(allBlacks, contentEnd) : allBlacks;
  // text_led: a text-on-colour style (kinetic text) judges blank frames (black or one flat colour, no
  // text) instead of dark ones, so a dark beat with a little text on it is not black.
  const textLed = flags.includes('text_led');
  let blank = null;
  if (textLed && contentEnd > 0) {
    const samples = await chkBlankFrames(ctx, video.path, m.width, m.height, contentEnd);
    blank = { samples: samples.length, ...chkJudgeBlank(chkBlankSpans(samples), samples.length) };
  }
  if (retained && contentEnd <= 0) add('black_frames', 'not_applicable', { found: notChecked });
  else if (blank) {
    const s = blank.span;
    if (s) add('black_frames', 'fail', { message: `Blank frames from ${s.start_s.toFixed(1)} to ${s.end_s.toFixed(1)} seconds ${s.where}.`, expected: `no blank stretch over ${s.limit} s ${s.where}`, found: +(s.end_s - s.start_s).toFixed(2) });
    else add('black_frames', 'pass', { found: +blank.total_s.toFixed(2) });
  } else {
    const black = blacks.find(([s, e]) => e - s > BLACK_MAX_S);
    if (black) add('black_frames', 'fail', { message: `Black frames from ${black[0].toFixed(1)} to ${black[1].toFixed(1)} seconds.`, expected: `no black stretch over ${BLACK_MAX_S} s`, found: +(black[1] - black[0]).toFixed(2) });
    else add('black_frames', 'pass');
  }

  const bodyEnd = Math.min(timeline.end_card ? timeline.end_card.start_s : d, contentEnd);
  const opening = freezes.find(([s, e]) => s <= 0.3 && e - s > OPENING_STILL_MAX_S);
  // A still scene may hold as long as it lasts, unless the style asks for moving footage or the timeline
  // names no scenes: then any hold over the limit fails, as does one that runs on past a scene start.
  const strictHold = flags.includes('footage_moves') || !(timeline.scenes || []).length;
  const sceneStarts = (timeline.scenes || []).map((sc) => sc.start_s).filter((t) => t < contentEnd);
  const held = freezes.find(([s, e]) => {
    const end = Math.min(e, bodyEnd);
    if (!(s < bodyEnd && end - s > HELD_PICTURE_MAX_S)) return false;
    return strictHold || sceneStarts.some((t) => s < t - SCENE_EDGE_S && end > t + SCENE_EDGE_S);
  });
  if (retained && contentEnd <= 0) add('frozen_frames', 'not_applicable', { found: notChecked });
  else if (opening) add('frozen_frames', 'warn', { message: `The opening picture is still for ${(opening[1] - opening[0]).toFixed(1)} seconds.`, expected: `the opening moves within ${OPENING_STILL_MAX_S} s`, found: +(opening[1] - opening[0]).toFixed(2) });
  else if (held) add('frozen_frames', 'warn', { message: `The picture is frozen from ${held[0].toFixed(1)} to ${held[1].toFixed(1)} seconds.`, expected: `no held picture over ${HELD_PICTURE_MAX_S} s before the end card`, found: +(Math.min(held[1], bodyEnd) - held[0]).toFixed(2) });
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
  const boxes = record ? (record.cues || []).filter((c) => c.box && (!retained || c.start_s < contentEnd)) : [];
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
  const wantsLogo = flags.includes('logo_visible');
  const logo = inputs.brand.logo;
  const logoZone = (timeline.safe_zones || []).find((z) => z.use === 'logo' && z.w > 0 && z.h > 0);
  const brandSlotOn = !!(expect.layers && typeof expect.layers === 'object' && expect.layers.brand === true);
  let logoSize = null;
  let logoResolutionChecked = false;
  const logoCheck = async (times) => {
    const at = times.filter((t) => t > 0 && t < d && (!retained || t < contentEnd));
    // retained_body: the logo is looked for only inside the new opening.
    if (retained && !at.length) return { status: 'not_applicable', found: notChecked };
    if (!logo) return { status: 'fail', message: 'The style asks for the logo, but the brand has no logo file.', expected: 'a logo file', found: 'none' };
    logoSize = logoSize || (logo.width && logo.height ? logo : await ctx.tools.probe(logo.path));
    const long = Math.max(logoSize.width || 0, logoSize.height || 0);
    // Resolution is advice, never a reason to repair or block a visible logo.
    // Wide wordmarks can have a small area while meeting the long-side recommendation.
    if (!logoResolutionChecked && long < MIN_LOGO_LONG_SIDE) {
      add('logo_resolution', 'warn', { message: 'The logo file is small and may look blurry.', expected: `at least ${MIN_LOGO_LONG_SIDE} px on the long side recommended`, found: `${logoSize.width}x${logoSize.height}` });
    }
    logoResolutionChecked = true;
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
  // Spread over the whole video (the new opening only, for retained_body), and the end card's middle when
  // there is one.
  const visibleTimes = [0.05, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 0.98].map((f) => f * contentEnd);
  if (timeline.end_card) visibleTimes.push((timeline.end_card.start_s + timeline.end_card.end_s) / 2);
  const logoVisible = wantsLogo ? await logoCheck(visibleTimes) : null;

  // The speech the content checks see: every entry, or for retained_body what was said inside the opening
  // (an entry running on into the kept body is cut to its timed words; one with no word timings cannot be
  // cut, so the speech checks are not run).
  const hookSpeech = retained ? chkSpeechBefore(timeline.speech, contentEnd) : null;
  const speech = hookSpeech ? hookSpeech.speech : timeline.speech || [];
  const speechCrosses = !!hookSpeech && hookSpeech.crossing;
  const crossNote = 'speech runs on past the new opening with no word timings';

  // The style's own checks (qc_flags). The ones a machine can measure are measured and count toward the
  // verdict; the rest (text legible, products visible, or a flag a later check layer measures) are reported
  // as not checked here.
  for (const flag of flags) {
    const code = `flag:${flag}`;
    if (!MEASURED_FLAGS.has(flag)) add(code, 'not_applicable', { found: EYES_FLAGS.has(flag) ? 'needs eyes; not checked by machine' : 'not measured by this check layer' });
    else if (flag === 'logo_visible') logoAdd(code, logoVisible);
    else if (retained && contentEnd <= 0 && flag !== 'retained_body') add(code, 'not_applicable', { found: notChecked });
    else if (flag === 'footage_moves') {
      const motion = await kitMotion(ctx, video.path, bodyEnd);
      if (motion === null) add(code, 'fail', { message: 'The footage could not be measured.', expected: `motion of at least ${FOOTAGE_MIN_MOTION}`, found: 'no frames' });
      else if (motion >= FOOTAGE_MIN_MOTION) add(code, 'pass', { found: motion });
      else add(code, 'warn', { message: 'The footage reads as a still photo.', expected: `motion of at least ${FOOTAGE_MIN_MOTION}`, found: motion });
    } else if (flag === 'sounds_match_messages') {
      const cardStart = timeline.end_card ? timeline.end_card.start_s : Infinity;
      const starts = (timeline.scenes || []).map((sc) => sc.start_s).filter((t) => t > 0.4 && t < cardStart - 0.1 && (!retained || t < contentEnd - 0.1));
      if (!starts.length) add(code, 'not_applicable');
      else {
        const windows = starts.map((t, i) => chkMessageWindows(t, i + 1 < starts.length ? starts[i + 1] : Infinity));
        const levels = await kitWindowLevels(ctx, video.path, windows.flatMap((w) => [...w.cue, ...w.bed]));
        let at = 0;
        const rises = windows.map((w) => chkMessageRise(levels.slice(at, (at += w.cue.length)), levels.slice(at, (at += w.bed.length))));
        const silentAt = starts.find((t, i) => !(rises[i].cue > -50 && rises[i].rise >= CHK_MSG_RISE_DB));
        if (silentAt === undefined) add(code, 'pass', { found: starts.length });
        else add(code, 'fail', { message: `No sound when the message at ${silentAt.toFixed(2)} s appears.`, expected: 'a sound with every message', found: `${silentAt.toFixed(2)} s` });
      }
    } else if (flag === 'text_led') {
      // The blank stretches themselves are judged in black_frames; here, how much of the video is blank.
      if (!blank) {
        add(code, 'not_applicable', { found: 'no picture to sample' });
        continue;
      }
      const share = `under ${Math.round(CHK_BLANK_MAX_SHARE * 100)} % of the video blank, with text on screen`;
      if (blank.whole) add(code, 'fail', { message: 'The whole video is blank: no text on screen.', expected: share, found: 1 });
      else if (blank.share >= CHK_BLANK_MAX_SHARE - 1e-9) add(code, 'warn', { message: `The video is blank for ${blank.total_s.toFixed(1)} of ${blank.picture_s.toFixed(1)} seconds.`, expected: share, found: +blank.share.toFixed(3) });
      else add(code, 'pass', { found: +blank.share.toFixed(3) });
    } else if (flag === 'read_rate') {
      const rate = chkReadRate(speech, contentEnd);
      const expected = `${CHK_READ_MIN_WPS} to ${CHK_READ_MAX_WPS} words a second`;
      if (speechCrosses) add(code, 'not_applicable', { found: crossNote });
      else if (!rate) add(code, 'not_applicable', { found: 'no speech' });
      else if (rate.wps < CHK_READ_MIN_WPS - 1e-9) add(code, 'warn', { message: `The voice reads too slowly: ${rate.wps.toFixed(2)} words a second.`, expected, found: +rate.wps.toFixed(3) });
      else if (rate.wps > CHK_READ_MAX_WPS + 1e-9) add(code, 'warn', { message: `The voice reads too fast: ${rate.wps.toFixed(2)} words a second.`, expected, found: +rate.wps.toFixed(3) });
      else add(code, 'pass', { found: +rate.wps.toFixed(3) });
    } else if (flag === 'cuts_between_words') {
      // Word timings from the speech entries, else the captions layer's words.
      // Word timings from the speech entries when every entry has them, else the captions layer's words
      // (a full record of what was said), else whatever partial timings the speech carries.
      const spoken = speech.filter((s) => (s.words || []).length || /[\p{L}\p{N}]/u.test(typeof s.spoken === 'string' ? s.spoken : s.text || ''));
      const fromSpeech = spoken.flatMap((s) => s.words || []);
      const fromCaptions = record && Array.isArray(record.words) ? record.words.filter((w) => w && Number.isFinite(w.start_s) && Number.isFinite(w.end_s) && (!retained || w.start_s < contentEnd)) : [];
      const words = !speechCrosses && spoken.every((s) => (s.words || []).length) && fromSpeech.length ? fromSpeech : fromCaptions.length ? fromCaptions : fromSpeech;
      const cuts = chkCuts(timeline.scenes, contentEnd);
      if (timeline.end_card && timeline.end_card.start_s < contentEnd && !cuts.some((t) => Math.abs(t - timeline.end_card.start_s) < 1e-3)) cuts.push(timeline.end_card.start_s);
      if (!words.length) add(code, 'not_applicable', { found: 'no word timings' });
      else if (!cuts.length) add(code, 'not_applicable', { found: 'no cuts' });
      else {
        const inside = chkCutInsideWord(cuts, words);
        if (inside) add(code, 'warn', { message: `A cut at ${inside.t.toFixed(2)} seconds falls inside the word "${inside.word.text}".`, expected: 'every cut between two words', found: `${inside.t.toFixed(2)} s` });
        else add(code, 'pass', { found: cuts.length });
      }
    } else if (flag === 'cut_rate') {
      // Cuts per second of the body: the end card is not counted.
      const expected = `${CHK_CUT_MIN_RATE} to ${CHK_CUT_MAX_RATE} cuts a second, the end card not counted`;
      if (!(timeline.scenes || []).length) add(code, 'not_applicable', { found: 'no scenes in the timeline' });
      else if (!(bodyEnd > 0)) add(code, 'not_applicable', { found: 'no body before the end card' });
      else {
        const rate = chkCuts(timeline.scenes, bodyEnd).length / bodyEnd;
        if (rate < CHK_CUT_MIN_RATE - 1e-9) add(code, 'warn', { message: `The cuts come too slowly: ${rate.toFixed(2)} a second.`, expected, found: +rate.toFixed(3) });
        else if (rate > CHK_CUT_MAX_RATE + 1e-9) add(code, 'warn', { message: `The cuts come too fast: ${rate.toFixed(2)} a second.`, expected, found: +rate.toFixed(3) });
        else add(code, 'pass', { found: +rate.toFixed(3) });
      }
    } else if (flag === 'retained_body') {
      if (contentEnd <= 0) {
        const found = !hook ? 'no first scene' : `first scene ${hook.start_s.toFixed(2)}-${hook.end_s.toFixed(2)} s in a ${d.toFixed(2)} s video`;
        add(code, 'fail', { message: 'The new opening is not marked, so it cannot be told from the kept video.', expected: 'the new opening as the first scene, starting the video and followed by the kept video', found });
      }
      else add(code, 'pass', { found: `checked 0-${contentEnd.toFixed(2)} s; ${contentEnd.toFixed(2)}-${d.toFixed(2)} s kept, not checked` });
    } else if (flag === 'captions_cross_cuts') {
      // A cue may run 0.15 s past a cut either side; one that runs further on both sides spans the cut. The
      // end card's start counts as a cut (no caption runs on into the card), and for retained_body so does
      // the join between the new opening and the kept video.
      const cues = record ? (record.cues || []).filter((c) => String(c.text || '').trim() && Number.isFinite(c.start_s) && Number.isFinite(c.end_s) && c.end_s > c.start_s && c.start_s < contentEnd) : [];
      const cuts = chkCuts(timeline.scenes, d).filter((t) => t <= contentEnd + 1e-6);
      const joins = [timeline.end_card && timeline.end_card.start_s > 0 && timeline.end_card.start_s < contentEnd ? timeline.end_card.start_s : null, retained && contentEnd < d ? contentEnd : null];
      for (const u of joins) if (u !== null && !cuts.some((t) => Math.abs(t - u) < 1e-3)) cuts.push(u);
      if (!cues.length) add(code, 'not_applicable', { found: 'no captions' });
      else if (!cuts.length) add(code, 'not_applicable', { found: 'no cuts' });
      else {
        const across = chkCueAcrossCut(cues, cuts);
        if (across) add(code, 'warn', { message: `The caption "${across.cue.text}" runs on across the cut at ${across.t.toFixed(2)} seconds.`, expected: `every caption inside one shot (${CHK_CUE_GUARD_S} s allowed either side of a cut)`, found: `${across.cue.start_s.toFixed(2)}-${across.cue.end_s.toFixed(2)} s` });
        else add(code, 'pass', { found: cues.length });
      }
    } else if (flag === 'min_shot') {
      const shots = chkShots(timeline.scenes, bodyEnd);
      if (!(timeline.scenes || []).length) add(code, 'not_applicable', { found: 'no scenes in the timeline' });
      else if (!shots.length) add(code, 'not_applicable', { found: 'no body before the end card' });
      else {
        const short = chkShortShot(shots);
        if (short) add(code, 'warn', { message: `A shot from ${short.start_s.toFixed(2)} to ${short.end_s.toFixed(2)} seconds is too short to read.`, expected: `every shot at least ${CHK_MIN_SHOT_S} s`, found: +short.seconds.toFixed(3) });
        else add(code, 'pass', { found: +Math.min(...shots.map(([a, b]) => b - a)).toFixed(3) });
      }
    } else if (flag === 'ambience_floor') {
      // The room tone under each shot (its quietest windows) sits in the band, and the speech over it stays
      // clear of it. No scenes: the body is one shot.
      const shots = chkShots(timeline.scenes, bodyEnd);
      const windows = shots.map(chkFloorWindows);
      if (!windows.some((w) => w.length)) add(code, 'not_applicable', { found: 'no shot long enough to measure' });
      else {
        const levels = m.has_audio ? await kitWindowLevels(ctx, video.path, windows.flat()) : windows.flat().map(() => -Infinity);
        const spoken = chkSpeechSpans(speech);
        let k = 0;
        const sounds = windows.map((w) => {
          const own = levels.slice(k, k + w.length);
          k += w.length;
          return w.length ? chkShotSound(w, own, spoken) : { floor: null, speech: null };
        });
        const bad = chkJudgeAmbience(shots, sounds);
        const band = `room tone from ${CHK_FLOOR_MIN_DB} to ${CHK_FLOOR_MAX_DB} dB under every shot, speech at least ${CHK_FLOOR_SPEECH_GAP_DB} dB above it`;
        const where = bad ? `from ${bad.shot[0].toFixed(1)} to ${bad.shot[1].toFixed(1)} seconds` : '';
        if (!bad) add(code, 'pass', { found: +Math.min(...sounds.filter((x) => x.floor !== null).map((x) => x.floor)).toFixed(1) });
        else if (bad.problem === 'silent') add(code, 'warn', { message: `There is no room tone ${where}: the sound drops to silence.`, expected: band, found: 'silent' });
        else if (bad.problem === 'low') add(code, 'warn', { message: `The room tone is too quiet ${where}.`, expected: band, found: +bad.floor.toFixed(1) });
        else if (bad.problem === 'high') add(code, 'warn', { message: `The background noise is too loud ${where}.`, expected: band, found: +bad.floor.toFixed(1) });
        else add(code, 'warn', { message: `The speech does not stand out from the background noise ${where}.`, expected: band, found: +(bad.speech - bad.floor).toFixed(1) });
      }
    } else if (flag === 'cut_contrast') {
      // Each cut must read as a cut: the frames 80 ms either side differ enough (a reframe of the same
      // shot, or two dark shots, reads as a jump). The end card's start is not judged.
      const cuts = chkCuts(timeline.scenes, bodyEnd);
      if (!cuts.length) add(code, 'not_applicable', { found: 'no cuts' });
      else {
        const all = await chkCutContrast(ctx, video.path, cuts, m.width, m.height, d);
        const measured = all.filter((c) => c.diff !== null);
        const unread = all.find((c) => c.diff === null);
        const worst = measured.reduce((a, c) => (!a || c.diff < a.diff ? c : a), null);
        const expected = `a frame difference of at least ${CHK_CONTRAST_MIN} (${CHK_CONTRAST_WARN} to be safe) ${CHK_CONTRAST_OFFSET_S} s either side of every cut`;
        if (!worst) add(code, 'fail', { message: 'The frames either side of the cuts could not be read.', expected, found: 'no frames' });
        else if (worst.diff < CHK_CONTRAST_MIN - 1e-9) add(code, 'warn', { message: `The cut at ${worst.t.toFixed(2)} seconds barely changes the picture, so it reads as a jump.`, expected, found: +worst.diff.toFixed(2) });
        else if (worst.diff < CHK_CONTRAST_WARN - 1e-9) add(code, 'warn', { message: `The cut at ${worst.t.toFixed(2)} seconds changes the picture only a little.`, expected, found: +worst.diff.toFixed(2) });
        // Every cut must be judged before the flag passes; a cut whose frames could not be read is a warning.
        else if (unread) add(code, 'warn', { message: `The frames either side of the cut at ${unread.t.toFixed(2)} seconds could not be read, so it was not checked.`, expected, found: `${measured.length} of ${all.length} cuts checked` });
        else add(code, 'pass', { found: +worst.diff.toFixed(2) });
      }
    } else if (flag === 'distinct_adjacent_shots') {
      // Two scenes in a row must not open on the same picture (the same clip shown twice).
      const openings = chkSceneOpenings(timeline.scenes, bodyEnd);
      if (openings.length < 2) add(code, 'not_applicable', { found: 'fewer than two scenes' });
      else {
        const all = await chkAdjacentDiffs(ctx, video.path, openings, m.width, m.height);
        const diffs = all.filter((p) => p.diff !== null);
        const unread = all.find((p) => p.diff === null);
        const same = diffs.find((p) => p.diff < CHK_DISTINCT_MIN - 1e-9);
        const expected = `the opening frames of two scenes in a row differ by at least ${CHK_DISTINCT_MIN}`;
        if (!diffs.length) add(code, 'fail', { message: 'The opening frames of the scenes could not be read.', expected, found: 'no frames' });
        else if (same) add(code, 'warn', { message: `Scenes ${same.a} and ${same.b} open on the same picture.`, expected, found: +same.diff.toFixed(2) });
        // Every pair must be judged before the flag passes; a pair whose frames could not be read is a warning.
        else if (unread) add(code, 'warn', { message: `The opening frames of scenes ${unread.a} and ${unread.b} could not be read, so they were not compared.`, expected, found: `${diffs.length} of ${all.length} pairs checked` });
        else add(code, 'pass', { found: +Math.min(...diffs.map((p) => p.diff)).toFixed(2) });
      }
    }
  }

  const script = (expect.script || []).map((s) => String(s).trim()).filter(Boolean);
  // What was said: each speech entry's `spoken` (a transcribe step's heard words, or the voice's spoken
  // form), else its text for a voice that said exactly its line. On-camera speech must have been
  // transcribed by a step before the layers: this layer orders nothing.
  const untranscribed = expect.speech === 'on_camera' && (!speech.length || speech.some((s) => typeof s.spoken !== 'string'));
  if (!script.length || expect.speech === 'none') add('speech_matches_script', 'not_applicable');
  else if (speechCrosses) add('speech_matches_script', 'not_applicable', { found: crossNote });
  else if (retained && !speech.length) add('speech_matches_script', 'not_applicable', { found: notChecked });
  else if (untranscribed) {
    add('speech_matches_script', 'fail', { message: 'The on-camera speech was not transcribed, so it cannot be checked against the script.', expected: 'a transcribe step before the layers', found: 'no transcript' });
  } else {
    const heard = speech.map((s) => (typeof s.spoken === 'string' ? s.spoken : s.text)).join(' ');
    // retained_body: only the opening is heard here, so only its line (the plan's first) is compared.
    const verdict = speechReview((retained ? script.slice(0, 1) : script).join(' '), heard, { aliases: usableAliases(ctx, inputs.brand.pronunciations) });
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
