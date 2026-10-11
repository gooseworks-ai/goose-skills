// cast-plate: one wide picture of the whole cast in one room (a "plate"), and
// one full-height single per person cut out of it for free. From the podcast
// recipe (create-podcast-skit-video-from-refs gen_paid.py plate +
// crop_singles.py): a set description holds a room only inside one
// generation, so a still per person puts them in different rooms; one plate is
// the only way the set holds. The model is openai/gpt-image-2 on fal (the
// recipe rejects Nano Banana faces as stock); cast members with an image go to
// /edit as references, in seat order. The model takes no seed, so a re-roll is
// a new cast: the kit's piece reuse is what keeps a plate.
//
// Seats are fixed (src/plate.mjs PLATE_SEATS): the prompt asks for each face
// at its seat and the singles are cut there, so no face detector is needed.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitStopIfAborted } from '../../_lib/part.mjs';
import { kitLoadTemplate } from '../../_lib/prompt.mjs';
import { PLATE_DEFAULT_SIZE, PLATE_SEATS, plateCastProblem, plateCrops, platePrompt, plateSize } from './plate.mjs';

const TEXT = 'openai/gpt-image-2';
const EDIT = 'openai/gpt-image-2/edit';

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const cast = inputs.cast;
  const layout = inputs.layout ?? (cast.length === 3 ? 'three_shot' : 'two_shot');
  const castProblem = plateCastProblem(cast, layout);
  if (castProblem) throw ctx.error('bad_input', castProblem);
  if (!String(inputs.room).trim()) throw ctx.error('bad_input', 'room is empty: the plate needs the room the cast sits in');
  const size = plateSize(inputs.size ?? PLATE_DEFAULT_SIZE);
  if (size.problem) throw ctx.error('bad_input', size.problem);

  const refs = cast.filter((m) => m.image).map((m) => m.image);
  const model = inputs.model ?? (refs.length ? EDIT : TEXT);
  if (model === TEXT && refs.length) throw ctx.error('bad_input', `${TEXT} cannot take the cast's images; use ${EDIT}`);
  if (model === EDIT && !refs.length) throw ctx.error('bad_input', `${EDIT} needs at least one cast member with an image`);

  let template = null;
  if (inputs.template) {
    try {
      template = await kitLoadTemplate(inputs.template);
    } catch (err) {
      throw ctx.error('bad_input', err.message);
    }
  }
  let prompt;
  try {
    prompt = platePrompt({ cast, layout, room: inputs.room, template, answers: inputs.answers, brand: inputs.brand });
  } catch (err) {
    // A placeholder with no value (KitPromptGap) or a banned phrase: refused before anything is ordered.
    throw ctx.error('bad_input', err.message);
  }
  if (prompt.length > 32000) throw ctx.error('bad_input', `the plate prompt is ${prompt.length} characters; the model takes 32,000`);

  kitStopIfAborted(ctx);
  const piece = 'plate';
  const body = {
    prompt,
    image_size: { width: size.width, height: size.height },
    quality: inputs.quality ?? 'high',
    num_images: 1,
    output_format: 'png',
  };
  if (model === EDIT) body.image_urls = refs;
  const result = await ctx.line.order({
    piece,
    provider: 'fal',
    path: model === EDIT ? EDIT : TEXT,
    body,
    results: [{ pointer: '/json/images/0/url', name: `${piece}.png`, media: 'image' }],
  });
  const got = result.files[`${piece}.png`];
  if (!got) throw ctx.error('provider_failed', 'the plate came back with no picture');
  ctx.progress({ done: 1, total: 2 });

  const plate = await plateAtSize(ctx, got, size);
  const crops = plateCrops(size.width, size.height, layout);
  const singles = [];
  const seen = new Map();
  for (const [i, member] of cast.entries()) {
    kitStopIfAborted(ctx);
    const c = crops[i];
    const name = `single-${i + 1}.png`;
    await kitFfmpeg(ctx, ['-i', plate.path, '-vf', `crop=${c.w}:${c.h}:${c.x}:${c.y}`, '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, name)]);
    const image = await ctx.file(name, 'image');
    if (seen.has(image.sha256)) {
      throw ctx.error('output_invalid', `the ${PLATE_SEATS[layout][i].side} and ${seen.get(image.sha256)} seats of the plate are the same picture`);
    }
    seen.set(image.sha256, PLATE_SEATS[layout][i].side);
    singles.push({ key: member.key, image });
  }
  ctx.progress({ done: 2, total: 2 });
  return kitCheckOutputs(ctx, manifest, {
    plate,
    singles,
    crops: cast.map((m, i) => ({
      key: m.key,
      x: crops[i].x / size.width,
      y: 0,
      w: crops[i].w / size.width,
      h: 1,
    })),
    layout,
    prompt,
  });
}

/** The plate at exactly the asked size: as returned when it matches, else scaled to cover and centre-cropped. */
async function plateAtSize(ctx, file, size) {
  let { width, height } = file;
  if (!width || !height) ({ width, height } = await ctx.tools.probe(file.path));
  if (width === size.width && height === size.height) return file;
  if (!width || !height) throw ctx.error('provider_failed', 'the plate is not a readable picture');
  ctx.log.warn('the plate came back at another size; scaled to cover', { width, height, want: size });
  const name = `plate-${size.width}x${size.height}.png`;
  await kitFfmpeg(ctx, [
    '-i',
    file.path,
    '-vf',
    `scale=${size.width}:${size.height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${size.width}:${size.height},setsar=1`,
    '-frames:v',
    '1',
    '-c:v',
    'png',
    join(ctx.workDir, name),
  ]);
  return ctx.file(name, 'image');
}
