// A fake private line for video-seedance-2: each clip comes back with a tone for its native voice.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, run } from '../../_tools/kit-harness.mjs';
import { still } from '../../creator-h3/tests/fixture.mjs';

export const sample = {
  async inputs(workDir) {
    const person = await still(workDir);
    return { clips: [{ id: 'hook', prompt: 'SCENE 1 (0-4s) WIDE HOOK: she holds the bottle and says "this changed my mornings".', references: [person], seconds: 5 }], resolution: '720p' };
  },
  async line(order, ctx) {
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    const d = order.body.duration;
    const args = ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=360x640:rate=24:duration=${d}`];
    if (order.body.generate_audio) args.push('-f', 'lavfi', '-i', `sine=frequency=300:duration=${d}`, '-c:a', 'aac');
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-shortest', path);
    await run('ffmpeg', args);
    return { json: { video: { url: 'https://fal.media/c.mp4' }, seed: 1 }, files: { [name]: await fileRef(path, 'video') }, reused: false };
  },
};

// ---- 1.1.0 ----
// Recorded from fal's OpenAPI (W0-62, 2026-10-12): the image-to-video request
// fields and the answer the kit gets ({json: <fal's output verbatim>}), whose
// video URL is at /json/video/url.
export const I2V_FIELDS = ['prompt', 'image_url', 'end_image_url', 'duration', 'resolution', 'aspect_ratio', 'generate_audio', 'codec', 'bitrate_mode', 'end_user_id'];
export const I2V_DURATIONS = ['auto', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
export const falAnswer = {
  json: {
    video: { url: 'https://v3b.fal.media/files/b/fixture/clip.mp4', content_type: 'video/mp4', file_name: 'clip.mp4', file_size: 4404019 },
    seed: 12345,
  },
};

/** A fake line that answers like fal: the recorded answer, plus the clip the kit downloaded from /json/video/url. */
export async function falLine(order, ctx) {
  const name = order.results[0].name;
  assert.equal(order.results[0].pointer, '/json/video/url');
  const path = join(ctx.workDir, name);
  const d = Number(order.body.duration);
  const args = ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=192x192:rate=24:duration=${d}`];
  if (order.body.generate_audio) args.push('-f', 'lavfi', '-i', `sine=frequency=300:duration=${d}`, '-c:a', 'aac');
  args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-shortest', path);
  await run('ffmpeg', args);
  return { ...structuredClone(falAnswer), files: { [name]: await fileRef(path, 'video') }, reused: false };
}

export async function photo(workDir, name) {
  const path = join(workDir, name);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=160x160:duration=1', '-frames:v', '1', path]);
  return fileRef(path, 'image');
}

export async function writeTemplate(workDir, tpl, name = 'clip.prompt.json') {
  const path = join(workDir, name);
  writeFileSync(path, JSON.stringify(tpl));
  return fileRef(path, 'json');
}

/** A hypermotion-like template: the hero clip's text lives in templates.hero. */
export const heroTemplate = {
  version: 1,
  prefix: 'STYLE ANCHOR: hypermotion product film',
  templates: { hero: 'SUBJECT: {product.name} in {answers.environment}, {answers.energy} energy, {answers.lighting}. 0-3s crash-zoom; 3-6s 180 degree orbit; 6-10s slow-motion {answers.physics} in the air; 10-13s pull back; 13-15s stillness.' },
  suffix: 'no text overlays, no hands',
  negative: 'morphing label, extra products',
};

/** The product-hypermotion step: one 15 s image-to-video clip that starts and ends on the product photo. */
export async function heroInputs(workDir, extra = {}) {
  return {
    mode: 'image_to_video',
    template: await writeTemplate(workDir, heroTemplate),
    products: [{ id: 'mist', name: 'Morning Mist Green Tea', images: [await photo(workDir, 'mist.png')] }],
    answers: { energy: 'explosive', environment: 'a misty bamboo forest', lighting: 'golden backlight', physics: 'tea leaves', take: 1 },
    seed: 1,
    clips: [{ id: 'hero', seconds: 15, start_image: 'product', end_image: 'start' }],
    resolution: '1080p',
    aspect_ratio: '1:1',
    generate_audio: false,
    ...extra,
  };
}
