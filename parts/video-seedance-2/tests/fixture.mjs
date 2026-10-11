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

// ---- 1.2.0 ----
// Recorded from fal's OpenAPI (W0-62, 2026-10-12): the reference-to-video request fields. The answer has the
// same shape as image-to-video's (falAnswer), with the video URL at /json/video/url.
export const REF_FIELDS = ['prompt', 'image_urls', 'video_urls', 'audio_urls', 'duration', 'resolution', 'aspect_ratio', 'generate_audio', 'codec', 'bitrate_mode', 'end_user_id'];

/** A ugc-product-like take template: the selfie look, beats from {picture}, the identity and product lines around them. */
export const ugcTemplate = {
  version: 1,
  prefix: 'Vertical 9:16 selfie-style UGC review of {product.name}, shot on a phone in {answers.setting}, {answers.tone} tone.',
  templates: { take: 'Use @Image1 as the exact creator identity and @Image2 as the exact single {product.name}.' },
  scene: '{picture}',
  suffix: 'Native spoken audio with lip-sync on the front-camera beats. Across all jump cuts: same creator, same single product, no morph.',
  negative: 'invented text, product redesign',
  refs: ['anchor', 'product'],
  banned: ['one continuous breath'],
};

/** A street-interview-like takes template: take 1 asks the question, later takes answer only. */
export const streetTemplate = {
  version: 1,
  prefix: 'Raw vertical street-interview footage on one corner: {answers.corner}. Only the interviewer holds the microphone.',
  templates: {
    first: 'The interviewer hands {product.name} over and asks the question once, off camera.',
    later: 'ANSWERS ONLY: nobody asks the question again. Same microphone as @Image2.',
  },
  scene: 'Same street corner. {picture}',
  suffix: 'Close voices and one street ambience, no music.',
  refs: ['product'],
};

export function ugcScenes() {
  return [
    { id: 's1', line: 'Okay, Glowpop just arrived and I love it.', on_screen: null, picture: 'Selfie: Maya holds the can beside her face', speaker: 'maya' },
    { id: 's2', line: null, on_screen: null, picture: 'Rear camera, face off-screen: she turns the can toward the lens' },
    { id: 's3', line: 'It tastes like real fruit.', picture: 'Selfie: she sips and smiles', speaker: 'maya' },
    { id: 's4', line: 'Yeah, this is the one.', picture: 'Selfie: the can held up beside her face', speaker: 'maya' },
    { id: 'end', line: null, on_screen: 'Try Glowpop', picture: null },
  ];
}

/** The ugc-product take step: one 15 s take of four beats, the end card scene left out. */
export async function ugcInputs(workDir, extra = {}) {
  return {
    mode: 'take',
    template: await writeTemplate(workDir, ugcTemplate, 'ugc-take.prompt.json'),
    scenes: ugcScenes(),
    skip_last: 1,
    cast: [{ key: 'maya', name: 'Maya', look: 'late-20s woman, curly hair', image: await photo(workDir, 'maya.png') }],
    products: [{ id: 'glow', name: 'Glowpop', images: [await photo(workDir, 'glow.png')] }],
    answers: { setting: 'a sunny kitchen', tone: 'warm' },
    pronunciations: [{ term: 'Glowpop', say_as: 'Glow pop' }],
    seconds: 15,
    max_words: 28,
    resolution: '720p',
    generate_audio: true,
    ...extra,
  };
}

/** The street-interview step: takes with scenes split by extra.take. */
export async function streetInputs(workDir, extra = {}) {
  return {
    mode: 'takes',
    takes: { count: 3, first: 'first', later: 'later' },
    chain: { crop: 'bottom_45' },
    template: await writeTemplate(workDir, streetTemplate, 'street.prompt.json'),
    scenes: [
      { id: 'q', line: 'What do you think this is?', picture: 'Handover: a man in a grey coat takes the can', speaker: 'interviewer', extra: { take: 1 } },
      { id: 'a1', line: 'Some kind of paint?', picture: 'He turns it over, puzzled', speaker: 'man', extra: { take: 1 } },
      { id: 'a2', line: 'Is it a candle?', picture: 'A woman with a gym bag squints at it', speaker: 'woman', extra: { take: 2 } },
      { id: 'a3', line: null, picture: 'She shrugs and hands it back', extra: { take: 2 } },
      { id: 'a4', line: 'Oh, it is sparkling water.', picture: 'An older man reads the side and laughs', speaker: 'older_man', extra: { take: 3 } },
    ],
    products: [{ id: 'can', name: 'the can', images: [await photo(workDir, 'can.png')] }],
    answers: { corner: 'a busy corner in Lower Manhattan' },
    seconds: 5,
    resolution: '720p',
    generate_audio: true,
    ...extra,
  };
}
