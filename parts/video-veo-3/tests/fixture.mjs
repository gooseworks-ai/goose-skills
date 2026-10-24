// A fake private line for video-veo-3. Each answer is the shape the line hands
// the kit for fal-ai/veo3.1/image-to-video (recorded in the W0-62 contracts,
// replies/fal-ai--veo3.1--image-to-video.json): {json: {video: {url,
// content_type, file_name, file_size}}}, pointer /json/video/url.
// The clip itself is a silent test pattern as long as the requested duration
// ("4s" -> 4 s).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, run } from '../../_tools/kit-harness.mjs';

/** fal's Veo reply, as recorded (only the url names this clip). */
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
  const seconds = Number(String(order.body.duration).replace(/s$/, ''));
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=90x160:rate=12:duration=${seconds}`, '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', path]);
  return { json: falReply(name), files: { [name]: await fileRef(path, 'video') }, reused: false };
}

/** A template like the wardrobe stitch's frames/stitch-motion.prompt.json: verb-led motion per tag, a banned list. */
export const template = {
  version: 1,
  prefix: 'Vertical 9:16 UGC phone footage, natural daylight',
  motion: '{picture}. Handheld phone camera drifts in a small arc',
  by_tag: {
    Product: { motion: '{picture}. A hand turns {product.name} toward the lens, the label sharp' },
    Cutaway: { motion: '{picture}. Black and white, the camera pushes in 4 inches over 2 seconds' },
  },
  negative: 'text, captions, watermark, extra fingers, extra limbs',
  banned: ['reveal'],
};

export async function writeTemplate(workDir, tpl = template, name = 'stitch-motion.prompt.json') {
  const path = join(workDir, name);
  writeFileSync(path, JSON.stringify(tpl));
  return fileRef(path, 'json');
}

/**
 * A wardrobe-stitch plan: s2 has no line (it shares s1's time), s5 is the end
 * card (skipped). Voice spans: s1 0-1.1, s3 1.3-2.4, s4 2.6-9.1, s5 9.4-11.0.
 */
export async function scenesInputs(workDir, extra = {}) {
  const stills = [];
  for (const id of ['s1', 's2', 's3', 's4']) stills.push({ id, image: await makeStill(join(workDir, `${id}.png`)) });
  return {
    model: 'fal-ai/veo3.1/image-to-video',
    mode: 'scenes',
    stills,
    template: await writeTemplate(workDir),
    products: [{ id: 'p1', name: 'Gutleaf Probiotic' }],
    scenes: [
      { id: 's1', line: 'Do not buy this.', on_screen: null, picture: 'Look 1: MCU, she lifts the jar and squints at it' },
      { id: 's2', line: null, on_screen: null, picture: 'Cutaway: a crowded supplement aisle' },
      { id: 's3', line: 'Unless you hate bloating.', on_screen: null, picture: 'Product: Gutleaf Probiotic on a bathroom shelf' },
      { id: 's4', line: 'Three weeks in and I feel lighter every single morning.', on_screen: null, picture: 'Look 2: MS, she laughs and spins toward the window' },
      { id: 's5', line: 'Link below.', on_screen: 'Link below', picture: null },
    ],
    spans: [
      { id: 's1', start_s: 0, end_s: 1.1 },
      { id: 's3', start_s: 1.3, end_s: 2.4 },
      { id: 's4', start_s: 2.6, end_s: 9.1 },
      { id: 's5', start_s: 9.4, end_s: 11.0 },
    ],
    skip_last: 1,
    resolution: '1080p',
    generate_audio: false,
    seed: 40,
    ...extra,
  };
}

export const sample = {
  inputs: (workDir) => scenesInputs(workDir),
  line: clipLine,
};
