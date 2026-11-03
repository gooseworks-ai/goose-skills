// A fake private line for video-kling. Each answer is the shape the line hands
// the kit for fal-ai/kling-video/*/image-to-video (recorded in the W0-62
// contracts, replies/fal-ai--kling-video--v3--standard--image-to-video.json):
// {json: {video: {url, content_type, file_name, file_size}}}, pointer /json/video/url.
// The clip itself is a silent test pattern as long as the requested duration.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, run } from '../../_tools/kit-harness.mjs';

/** fal's Kling reply, as recorded (only the url names this clip). */
export function falReply(name) {
  return { video: { url: `https://v3b.fal.media/files/b/fixture/${name}`, content_type: 'video/mp4', file_name: 'clip.mp4', file_size: 4404019 } };
}

export async function makeStill(path) {
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=90x160:duration=1', '-frames:v', '1', '-c:v', 'png', path]);
  return fileRef(path, 'image');
}

/** Answers every order with a silent clip of the requested length, as the kit hands a done piece to a part. */
export async function clipLine(order, ctx) {
  const name = order.results[0].name;
  const path = join(ctx.workDir, name);
  const seconds = Number(order.body.duration);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=90x160:rate=12:duration=${seconds}`, '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', path]);
  return { json: falReply(name), files: { [name]: await fileRef(path, 'video') }, reused: false };
}

/** A template like a 3D explainer's frames/stills.prompt.json, with a motion text and a hook text. */
export const template = {
  version: 1,
  prefix: 'stylised 3D, soft light',
  looks: { 'pixar-3d': 'glossy 3D, subsurface skin', claymation: 'hand-made clay, thumbprints' },
  scene: '{look}. {picture}. {cast_looks}',
  motion: '{look}. {picture}. Subtle motion, no zoom, no morph',
  templates: { hook: '{speaker.name} reacts: {answers.reaction}. Phone selfie, slight handheld sway' },
  negative: 'text, watermark, extra fingers',
};

export async function writeTemplate(workDir, tpl = template, name = 'stills.prompt.json') {
  const path = join(workDir, name);
  writeFileSync(path, JSON.stringify(tpl));
  return fileRef(path, 'json');
}

/**
 * A 3D-explainer plan: s2 has no line (it shares s1's time), s4 is the end
 * card (skipped). Voice spans: s1 0-2.1, s3 2.6-6.9, s4 7.3-9.0.
 */
export async function scenesInputs(workDir, extra = {}) {
  const stills = [];
  for (const id of ['s1', 's2', 's3']) stills.push({ id, image: await makeStill(join(workDir, `${id}.png`)) });
  return {
    model: 'fal-ai/kling-video/v3/standard/image-to-video',
    mode: 'scenes',
    stills,
    template: await writeTemplate(workDir),
    look: 'pixar-3d',
    cast: [{ key: 'a', name: 'Maya', look: 'woman, 34, curly dark hair' }],
    scenes: [
      { id: 's1', line: 'So I stopped cooking on weeknights.', on_screen: null, picture: 'Maya at the stove, tired', speaker: 'a' },
      { id: 's2', line: null, on_screen: null, picture: 'Maya and the empty fridge' },
      { id: 's3', line: 'Then this showed up.', on_screen: null, picture: 'A green tea pouch on the counter' },
      { id: 's4', line: 'Brew yours.', on_screen: 'Brew yours', picture: null },
    ],
    spans: [
      { id: 's1', start_s: 0, end_s: 2.1 },
      { id: 's3', start_s: 2.6, end_s: 6.9 },
      { id: 's4', start_s: 7.3, end_s: 9.0 },
    ],
    skip_last: 1,
    min_s: 3,
    max_s: 10,
    ...extra,
  };
}

export const sample = {
  inputs: (workDir) => scenesInputs(workDir),
  line: clipLine,
};
