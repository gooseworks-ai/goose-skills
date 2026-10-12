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
//
// 1.1.0: a given `plate` (a preview approved before the yes) is used as is and
// nothing is ordered; its singles are cut at the given `crops`, else at the seats.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitStopIfAborted } from '../../_lib/part.mjs';
import { kitLoadTemplate } from '../../_lib/prompt.mjs';
import { PLATE_DEFAULT_SIZE, PLATE_SEATS, plateCastProblem, plateCropProblem, plateCrops, platePrompt, plateSize } from './plate.mjs';

const TEXT = 'openai/gpt-image-2';
const EDIT = 'openai/gpt-image-2/edit';
const PLATE_REF_MIME = ['image/png', 'image/jpeg', 'image/webp'];

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const cast = inputs.cast;
  const layout = inputs.layout ?? (cast.length === 3 ? 'three_shot' : 'two_shot');
  if (inputs.crops && !inputs.plate) throw ctx.error('bad_input', 'crops need the plate they were measured on');
  if (inputs.plate) return plateGiven(inputs, ctx, manifest, layout);
  const castProblem = plateCastProblem(cast, layout);
  if (castProblem) throw ctx.error('bad_input', castProblem);
  if (!String(inputs.room).trim()) throw ctx.error('bad_input', 'room is empty: the plate needs the room the cast sits in');
  const size = plateSize(inputs.size ?? PLATE_DEFAULT_SIZE);
  if (size.problem) throw ctx.error('bad_input', size.problem);
  const cropProblem = plateCropProblem(size.width, size.height, layout);
  if (cropProblem) throw ctx.error('bad_input', cropProblem);

  const given = cast.filter((m) => m.image).map((m) => m.image);
  const model = inputs.model ?? (given.length ? EDIT : TEXT);
  if (model === TEXT && given.length) throw ctx.error('bad_input', `${TEXT} cannot take the cast's images; use ${EDIT}`);
  if (model === EDIT && !given.length) throw ctx.error('bad_input', `${EDIT} needs at least one cast member with an image`);

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
  // gpt-image-2/edit reads PNG, JPEG and WebP; any other picture (AVIF, HEIC,
  // GIF from a brand library) is turned into a PNG first, for free.
  const refs = [];
  for (const [i, ref] of given.entries()) refs.push(PLATE_REF_MIME.includes(ref.mime) ? ref : await plateRefAsPng(ctx, ref, i));
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
  const singles = await plateSingles(ctx, plate, cast, crops, layout);
  ctx.progress({ done: 2, total: 2 });
  return kitCheckOutputs(ctx, manifest, {
    plate,
    singles,
    crops: plateSeatFractions(cast, crops, size.width),
    layout,
    prompt,
  });
}

/** The given plate as is, nothing ordered: singles cut at `crops` (0..1 of the plate) when given, else at the seats. */
async function plateGiven(inputs, ctx, manifest, layout) {
  const cast = inputs.cast;
  const seats = PLATE_SEATS[layout];
  if (cast.length !== seats.length) throw ctx.error('bad_input', `${layout} seats ${seats.length} people; the cast has ${cast.length}`);
  if (new Set(cast.map((m) => m.key)).size !== cast.length) throw ctx.error('bad_input', 'the cast names one key twice');
  const plate = inputs.plate;
  let { width, height } = plate;
  if (!width || !height) ({ width, height } = await ctx.tools.probe(plate.path));
  if (!width || !height) throw ctx.error('bad_input', 'the given plate is not a readable picture');
  let crops;
  if (inputs.crops) {
    if (inputs.crops.length !== cast.length) throw ctx.error('bad_input', `crops has ${inputs.crops.length} entries; the cast has ${cast.length}`);
    crops = inputs.crops.map((c, i) => {
      if (c.key !== cast[i].key) throw ctx.error('bad_input', `crops[${i}] is for ${c.key}, but seat ${i + 1} is ${cast[i].key}`);
      if (c.x + c.w > 1 + 1e-6 || c.y + c.h > 1 + 1e-6) throw ctx.error('bad_input', `the crop for ${c.key} runs off the plate`);
      const x = Math.round(c.x * width);
      const y = Math.round(c.y * height);
      const w = Math.min(width - x, Math.round(c.w * width));
      const h = Math.min(height - y, Math.round(c.h * height));
      if (w < 16 || h < 16) throw ctx.error('bad_input', `the crop for ${c.key} is too small to cut`);
      return { x, y, w, h };
    });
  } else {
    if (width <= height) throw ctx.error('bad_input', `the given plate is ${width}x${height}; a plate is landscape, so each single is a full-height slice`);
    const cropProblem = plateCropProblem(width, height, layout);
    if (cropProblem) throw ctx.error('bad_input', cropProblem);
    crops = plateCrops(width, height, layout);
  }
  const singles = await plateSingles(ctx, plate, cast, crops, layout);
  ctx.progress({ done: 1, total: 1 });
  return kitCheckOutputs(ctx, manifest, {
    plate,
    singles,
    crops: inputs.crops ? inputs.crops.map((c) => ({ key: c.key, x: c.x, y: c.y, w: c.w, h: c.h })) : plateSeatFractions(cast, crops, width),
    layout,
    prompt: '',
  });
}

/** One single per member, cut from the plate at its crop (pixels); two identical singles fail the step. */
async function plateSingles(ctx, plate, cast, crops, layout) {
  const singles = [];
  const seen = new Map();
  for (const [i, member] of cast.entries()) {
    kitStopIfAborted(ctx);
    const c = crops[i];
    const name = `single-${i + 1}.png`;
    // exact=1: a subsampled picture (most JPEGs) would otherwise round the crop to its chroma grid.
    await kitFfmpeg(ctx, ['-i', plate.path, '-vf', `crop=${c.w}:${c.h}:${c.x}:${c.y}:exact=1`, '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, name)]);
    const image = await ctx.file(name, 'image');
    if (seen.has(image.sha256)) {
      throw ctx.error('output_invalid', `the ${PLATE_SEATS[layout][i].side} and ${seen.get(image.sha256)} seats of the plate are the same picture`);
    }
    seen.set(image.sha256, PLATE_SEATS[layout][i].side);
    singles.push({ key: member.key, image });
  }
  return singles;
}

/** The seat crops as the `crops` output: full-height slices in 0..1 of the plate. */
function plateSeatFractions(cast, crops, width) {
  return cast.map((m, i) => ({ key: m.key, x: crops[i].x / width, y: 0, w: crops[i].w / width, h: 1 }));
}

/** A cast picture the model cannot read, as a PNG (first frame only). */
async function plateRefAsPng(ctx, file, i) {
  const name = `ref-${i + 1}.png`;
  await kitFfmpeg(ctx, ['-i', file.path, '-frames:v', '1', '-c:v', 'png', join(ctx.workDir, name)]);
  return ctx.file(name, 'image');
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
