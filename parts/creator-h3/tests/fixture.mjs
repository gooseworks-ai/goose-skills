// A fake private line for creator-h3: each take comes back as a moving
// picture with a tone for the voice, starting after a short silence.
import { join } from 'node:path';
import { fileRef, run } from '../../_tools/kit-harness.mjs';

export async function still(dir) {
  const path = join(dir, 'creator.png');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=360x640:duration=1', '-frames:v', '1', path]);
  return fileRef(path, 'image');
}

export const sample = {
  // `version` (parts/_tools/parts.test.mjs passes it): 1.3.0 and newer need the approved contract's revision.
  async inputs(workDir, version) {
    const [major, minor] = (version || '0.0.0').split('.').map(Number);
    const reviewed = major > 1 || (major === 1 && minor >= 3);
    return {
      ...(reviewed ? { creative_contract_revision: REVISION, capture: 'phone_counter' } : {}),
      scenes: [
        { id: 's1', line: 'I tried this for a month and here is what happened to my sleep.' },
        { id: 's2', line: 'The first week felt the same, honestly nothing changed at all for me.' },
        { id: 's3', line: 'Then the second week I started waking up before my alarm.' },
        { id: 's4', line: 'Now I would not go back. Link below if you want to try it.' },
      ],
      character: { image: await still(workDir), identity: 'a woman in her early 30s, shoulder-length black hair, grey t-shirt', environment: 'a lived-in home office with a bookshelf' },
      resolution: '768P',
      max_seconds: 40,
    };
  },
  async line(order, ctx) {
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    const d = order.body.duration;
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=360x640:rate=24:duration=${d}`, '-f', 'lavfi', '-i', `sine=frequency=300:duration=${d - 0.4}:sample_rate=48000`, '-filter_complex', '[1:a]adelay=200:all=1,apad[a]', '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ac', '1', '-t', String(d), path]);
    return { json: { video: { url: 'https://fal.media/x.mp4' } }, files: { [name]: await fileRef(path, 'video') }, reused: false };
  },
};

// 1.1.0: fal's recorded answer for minimax/h3-max/reference-to-video
// (H3MaxReferenceToVideoOutput, from the private-line contract recorded on
// 2026-10-12): the kit hands the part {json, files}; the video is read at
// /json/video/url. And the request fields fal accepts.
export const H3_REPLY = {
  pointer: '/json/video/url',
  answer: { json: { video: { url: 'https://v3b.fal.media/files/b/fixture/clip.mp4', content_type: 'video/mp4', file_name: 'clip.mp4', file_size: 4404019 }, seed: 1234567, timings: null, expanded_prompt: null } },
  request: {
    required: ['prompt', 'prompt_expansion_mode'],
    prompt_expansion_mode: ['disabled', 'balanced', 'quality'],
    duration: [0.92, 15],
    resolution: ['480P', '768P', '1080P'],
    aspect_ratio: ['adaptive', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
    max_references: 12,
    fields: ['prompt', 'prompt_expansion_mode', 'image_url', 'duration', 'resolution', 'aspect_ratio', 'seed', 'reference_image_urls', 'reference_video_urls', 'reference_audio_urls', 'reference_conditions', 'start_image_url', 'end_image_url', 'middle_image_url', 'middle_frame_time', 'enable_safety_checker'],
  },
};

/** The fake line, answering with the recorded reply's json (the moving picture as in sample.line). */
export async function recordedLine(order, ctx) {
  const done = await sample.line(order, ctx);
  return { ...done, json: structuredClone(H3_REPLY.answer.json) };
}

/** Words: n filler words, so a line's estimated length is n / words_per_second. */
export function words(n, lead = 'so') {
  return [lead, ...Array.from({ length: n - 1 }, (_, i) => ['this', 'really', 'changed', 'how', 'my', 'mornings', 'go', 'now'][i % 8])].join(' ');
}

/** A plan with a cast: Maya (with a picture) speaks every line; Theo has none. */
export async function castInputs(workDir, extra = {}) {
  const image = await still(workDir);
  return {
    scenes: [
      { id: 's1', line: 'I switched to Fernhill for my mornings.', on_screen: null, picture: null, speaker: 'maya' },
      { id: 's2', line: 'Fernhill tastes like a walk in the rain.', on_screen: 'rain', picture: null, speaker: 'maya' },
      { id: 'end', line: null, on_screen: 'Shop now', picture: null, speaker: null },
    ],
    cast: [
      { key: 'theo', name: 'Theo', look: 'close-cropped grey beard, navy crewneck', gender: 'male', age: 41, image: null },
      { key: 'maya', name: 'Maya', look: 'curly dark hair, olive overshirt', gender: 'female', age: 34, environment: 'a bright kitchen with a kettle', delivery: 'calm and dry', image },
    ],
    pronunciations: [{ term: 'Fernhill', say_as: 'Fern hill' }],
    resolution: '768P',
    max_seconds: 40,
    ...extra,
  };
}

/** 1.3.0+: the approved creative contract's checksum every reviewed run names. */
export const REVISION = 'c'.repeat(64);

/** sample.inputs for 1.3.0 and newer: the reviewed pipeline needs the contract revision (and, before 1.4.0, a capture). */
export async function reviewedInputs(workDir, extra = {}) {
  return { ...(await sample.inputs(workDir)), creative_contract_revision: REVISION, capture: 'phone_counter', ...extra };
}

/**
 * A passing, hash-bound review of one returned take (what a listener who watched and heard the whole take
 * records), with reviewed word timings: each line's words spread over the fixture's tone (0.2 s to the end less 0.4 s).
 */
export async function acceptedSource(source, { product_action = 'not_applicable', probe } = {}) {
  const duration = (await probe(source.video.path)).duration_s;
  const lines = source.expected_lines;
  const all = lines.flatMap((line) => line.spoken.split(/\s+/).filter(Boolean).map((text) => ({ scene_id: line.scene_id, text })));
  const from = 0.2;
  const step = (duration - 0.6) / all.length;
  const words = all.map((w, i) => ({ ...w, start_s: +(from + i * step).toFixed(3), end_s: +(from + (i + 0.8) * step).toFixed(3) }));
  return {
    id: source.id,
    video: source.video,
    review: {
      source_sha256: source.source_sha256, script_sha256: source.script_sha256, status: 'pass', reviewer: 'test reviewer',
      coverage: { video_watched: true, audio_listened: true, start_s: 0, end_s: duration },
      checks: { script: 'pass', voice: 'pass', lipsync: 'pass', identity: 'pass', framing: 'pass', performance: 'pass', product_action },
      evidence: ['watched and listened to the whole take'],
    },
    timing_method: 'forced_alignment',
    words,
  };
}

/** The qualification a reviewed first take earns for the exact configuration the part reported. */
export function qualificationFor(firstTakeOut) {
  return {
    provider: 'fal', model: 'minimax/h3-max/reference-to-video', shot_type: 'talking_creator', status: 'qualified',
    configuration_sha256: firstTakeOut.configuration_sha256, accepted_source_sha256: firstTakeOut.review_request.sources[0].source_sha256,
    reviewer: 'test reviewer', audio_listened: true, video_watched: true,
  };
}
