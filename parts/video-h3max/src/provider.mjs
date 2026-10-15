// H3 Max's fal contract, recorded from the official queue OpenAPI on 2026-10-12.
// A scene part uses image references only. Native sound is kept by default;
// generate_audio: false drops that sound locally because H3 has no such flag.
import { kitFfmpeg } from '../../_lib/part.mjs';
import { join } from 'node:path';

export const H3SCENE_MODEL = 'minimax/h3-max/reference-to-video';
// 1.2.0: the light lock, on every clip that starts on a first frame (modes stills and
// image_to_video). H3 added gloss, HDR contrast and sharpening halos to clean stills in two
// 15 Oct test videos. The same words as creator-h3 1.6.0's H3_LIGHT_LOCK.
export const H3SCENE_LIGHT_LOCK = "Keep the first frame's light and exposure, matte skin, no added shine or sharpening halos.";

/** The prompt with the light lock added once, before any "Avoid:" list. */
export function h3SceneWithLightLock(prompt) {
  const text = String(prompt || '');
  if (text.includes(H3SCENE_LIGHT_LOCK)) return text;
  const at = text.lastIndexOf('Avoid:');
  if (at < 0) return text ? `${text.replace(/\s+$/, '')}${/[.!?]$/.test(text.trim()) ? '' : '.'} ${H3SCENE_LIGHT_LOCK}` : H3SCENE_LIGHT_LOCK;
  const head = text.slice(0, at).replace(/\s+$/, '');
  return `${head}${head && !/[.!?]$/.test(head) ? '.' : ''}${head ? ' ' : ''}${H3SCENE_LIGHT_LOCK} ${text.slice(at)}`;
}

// 1.2.0: silent creator B-roll (mode stills, broll: true). Every picked scene names one
// physical action that changes the picture; "nobody speaks, lips closed" goes with that action,
// never with still hands. A 15 Oct test video's B-roll asked for "minimal body movement" and
// "no hand touches the face", and got faces that only turned and blinked.
export const H3BROLL_HEAD_ONLY = /\b(look(s|ed|ing)?|glanc\w*|blink\w*|smil\w*|nod(s|ded|ding)?|star(e|es|ed|ing)|breath\w*|gaz\w*|turn(s|ed|ing)? (her|his|their) (head|face)|tilt\w* (her|his|their) head|stand(s|ing)?|sit(s|ting)?|wait\w*|paus\w*|listen\w*|think\w*)\b/i;
export const H3BROLL_PHYSICAL = /\b(appl\w*|peel\w*|press\w*|lift\w*|pick\w*|put\w*|plac\w*|set(s|ting)? down|hold(s|ing)? up|open\w*|clos\w*|pour\w*|stir\w*|cut(s|ting)?|squeez\w*|smooth\w*|rub\w*|wip\w*|spray\w*|tear\w*|unwrap\w*|scoop\w*|pull\w*|push\w*|tak(e|es|ing)|drop\w*|wash\w*|brush\w*|dab\w*|pat(s|ted|ting)?|stick\w*|stretch\w*|reach\w*|hand(s|ed|ing)? (it|the|over)|shak\w*|tap(s|ped|ping)?|twist\w*|fold\w*|grab\w*|eat\w*|drink\w*|sip\w*|walk\w*|turn(s|ed|ing)? to)\b/i;
export const H3BROLL_STILL_HANDS = /\b(keep(s|ing)? (the |her |his |their |both )?hands? still|hands? (stay|stays|remain|remains|are kept|kept|held) still|hands? still|no hand touches|hands? (do|does) not move|minimal (body )?movement|stationary (person|subject|body))\b/i;

/** Why a B-roll action is not a physical action, or null when it is one. */
export function h3BrollActionProblem(action) {
  const text = typeof action === 'string' ? action.replace(/\s+/g, ' ').trim() : '';
  if (!text) return 'needs extra.action: one physical action that changes the picture (apply, peel, press, lift, pour, put down, turn to the mirror)';
  if (H3BROLL_STILL_HANDS.test(text)) return `extra.action "${text}" asks for still hands; name the action the hands do`;
  if (H3BROLL_HEAD_ONLY.test(text) && !H3BROLL_PHYSICAL.test(text)) return `extra.action "${text}" only moves the head or eyes; a clip where only the head turns or the eyes blink is a still, not B-roll`;
  return null;
}

/** The B-roll sentence: nobody speaks while the named action happens. */
export function h3BrollLine(action) {
  return `Nobody speaks, lips closed, while ${action.replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '')}.`;
}
const H3SCENE_PROVIDER_PROMPT_MAX = 12000;

/** Translate a Seedance-style image token without changing ordinary handles or dialogue. */
export function h3SceneProviderPrompt(prompt, refs, who) {
  const check = (n) => {
    const index = Number(n);
    if (!Number.isInteger(index) || index < 1 || index > refs) {
      throw new Error(`${who} names Image ${n}, but has ${refs} reference image${refs === 1 ? '' : 's'}`);
    }
    return `Image ${index}`;
  };
  const out = prompt.replace(/(?<![\w@])@(Image|Video|Audio)([A-Za-z0-9_-]*)(?![\w])/gi, (token, kind, n) => {
    if (kind.toLowerCase() !== 'image') throw new Error(`${who} names ${token}; this part accepts image references only`);
    if (!/^[0-9]+$/.test(n)) throw new Error(`${who} has an unknown image reference ${token}; use Image N with a supplied reference image`);
    return check(n);
  });
  for (const m of out.matchAll(/(?<![\w@])Image\s+([0-9]+)(?![\w])/gi)) check(m[1]);
  const unsupported = /(?<![\w@])@?(Video|Audio)\s*([0-9]+)(?![\w])/i.exec(out);
  if (unsupported) throw new Error(`${who} names ${unsupported[1]} ${unsupported[2]}; this part accepts image references only`);
  if (out.length > H3SCENE_PROVIDER_PROMPT_MAX) throw new Error(`${who}'s prompt is ${out.length} characters, over ${H3SCENE_PROVIDER_PROMPT_MAX}`);
  return out;
}

/** H3 has one endpoint for reference clips and first/last-frame clips. */
export function h3SceneProviderBody(inputs, job, refs, seed) {
  return {
    prompt: job.prompt,
    reference_image_urls: refs,
    ...(job.start ? { image_url: job.start } : {}),
    ...(job.end ? { end_image_url: job.end } : {}),
    duration: job.seconds,
    resolution: inputs.resolution ?? '1080P',
    aspect_ratio: inputs.aspect_ratio ?? '9:16',
    prompt_expansion_mode: 'disabled',
    seed,
  };
}

/** Keep a native dialogue clip; a requested silent clip gets a distinct audio-free file. */
export async function h3SceneProviderVideo(ctx, file, piece, audio) {
  const info = await ctx.tools.probe(file.path);
  if (!info.width || !info.height) throw ctx.error('provider_failed', `${piece} came back without a picture`);
  if (audio && !info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its native audio`);
  if (audio || !info.has_audio) return { file, info };
  const name = `${piece}-silent.mp4`;
  await kitFfmpeg(ctx, ['-i', file.path, '-map', '0:v:0', '-c:v', 'copy', '-an', join(ctx.workDir, name)]);
  const silent = await ctx.file(name, 'video');
  return { file: silent, info: await ctx.tools.probe(silent.path) };
}
