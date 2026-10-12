// Local fixtures only. H3 always returns native sound; silent mode is handled
// by the part after generation. No fal credentials or paid calls are used.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, run } from '../../_tools/kit-harness.mjs';

export async function photo(workDir, name = 'product.png') {
  const path = join(workDir, name);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=160x160:duration=1', '-frames:v', '1', path]);
  return fileRef(path, 'image');
}

export async function template(workDir, value, name = 'scene.prompt.json') {
  const path = join(workDir, name);
  writeFileSync(path, JSON.stringify(value));
  return fileRef(path, 'json');
}

export function nativeLine({ audio = true, overrun = 0, size = '192x192' } = {}) {
  return async (order, ctx) => {
    assert.equal(order.path, 'minimax/h3-max/reference-to-video');
    assert.equal(order.results[0].pointer, '/json/video/url');
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    const seconds = order.body.duration + overrun;
    const args = ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=${size}:rate=24:duration=${seconds}`];
    if (audio) args.push('-f', 'lavfi', '-i', `sine=frequency=300:duration=${seconds}`, '-c:a', 'aac');
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-shortest', path);
    await run('ffmpeg', args);
    return {
      json: { video: { url: 'https://fal.media/h3-fixture.mp4', content_type: 'video/mp4' }, seed: order.body.seed, expanded_prompt: null },
      files: { [name]: await fileRef(path, 'video') },
      reused: false,
    };
  };
}

export const sample = {
  async inputs(workDir) {
    return { clips: [{ id: 'hook', prompt: 'Image 1 is the creator. She holds the cup and says "It fits my morning."', references: [await photo(workDir)], seconds: 5 }], resolution: '768P' };
  },
  line: nativeLine(),
};

export async function ugcInputs(workDir, extra = {}) {
  return {
    mode: 'take',
    template: await template(workDir, {
      version: 1,
      prefix: 'Vertical phone video for {product.name}, in {answers.setting}.',
      templates: { take: 'Use @Image1 as Maya and @Image2 as the exact product.' },
      scene: '{picture}',
      suffix: 'Native spoken audio with lip-sync on front-camera beats. Same creator and product across cuts.',
      negative: 'invented text, product redesign',
      refs: ['anchor', 'product'],
      banned: ['one continuous breath'],
    }, 'ugc.prompt.json'),
    scenes: [
      { id: 's1', line: 'Okay, Glowpop just arrived and I love it.', picture: 'Selfie: Maya holds the can beside her face', speaker: 'maya' },
      { id: 's2', line: null, picture: 'Rear camera, face off-screen: she turns the can toward the lens' },
      { id: 's3', line: 'It tastes like real fruit.', picture: 'Selfie: she sips and smiles', speaker: 'maya' },
      { id: 's4', line: 'Yeah, this is the one.', picture: 'Selfie: the can beside her face', speaker: 'maya' },
      { id: 'end', line: null, on_screen: 'Try Glowpop', picture: null },
    ],
    skip_last: 1,
    cast: [{ key: 'maya', name: 'Maya', image: await photo(workDir, 'maya.png') }],
    products: [{ id: 'glow', name: 'Glowpop', images: [await photo(workDir, 'glow.png')] }],
    answers: { setting: 'a sunny kitchen' },
    pronunciations: [{ term: 'Glowpop', say_as: 'Glow pop' }],
    seconds: 15,
    max_words: 28,
    resolution: '768P',
    generate_audio: true,
    ...extra,
  };
}

export async function streetInputs(workDir, extra = {}) {
  return {
    mode: 'takes',
    takes: { count: 3, first: 'first', later: 'later' },
    chain: { crop: 'bottom_45' },
    template: await template(workDir, {
      version: 1,
      prefix: 'A raw street interview on {answers.corner}.',
      templates: { first: 'The interviewer asks the question once, off camera.', later: 'ANSWERS ONLY: nobody repeats the question. Same microphone as @Image2.' },
      scene: '{picture}',
      suffix: 'Distinct voices, one street ambience, no music.',
      refs: ['product'],
    }, 'street.prompt.json'),
    scenes: [
      { id: 'q', line: 'What do you think this is?', picture: 'Handover: a man takes the can', speaker: 'interviewer', extra: { take: 1 } },
      { id: 'a1', line: 'Some kind of paint?', picture: 'He turns it over, puzzled', speaker: 'man', extra: { take: 1 } },
      { id: 'a2', line: 'Is it a candle?', picture: 'A woman with a gym bag squints at it', speaker: 'woman', extra: { take: 2 } },
      { id: 'a3', line: null, picture: 'She shrugs and hands it back', extra: { take: 2 } },
      { id: 'a4', line: 'Oh, it is sparkling water.', picture: 'An older man reads the side and laughs', speaker: 'older_man', extra: { take: 3 } },
    ],
    products: [{ id: 'can', name: 'the can', images: [await photo(workDir, 'can.png')] }],
    answers: { corner: 'a busy corner in Lower Manhattan' },
    seconds: 5,
    resolution: '768P',
    generate_audio: true,
    ...extra,
  };
}
