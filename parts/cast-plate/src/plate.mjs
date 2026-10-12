// cast-plate helpers: the seats, the size rule, the crop table and the plate
// prompt. Pure functions, no I/O. Bundled into part.mjs; every top-level name
// starts with `plate` (parts/_tools/bundle.mjs needs unique names).
import { kitPromptFill, kitPromptJoin, kitPromptTidy } from '../../_lib/prompt.mjs';
import { kitWholeWordsRe } from '../../_lib/scene-match.mjs';

/**
 * Where each person sits, left to right, as the centre of their face in
 * fractions of the plate's width. The prompt asks for these places and the
 * singles are cut at them, so no face detector is needed (the recipe's three
 * detectors found furniture). two_shot is fixed by MASTER-PLAN-v2 §4.4.
 */
export const PLATE_SEATS = {
  two_shot: [
    { side: 'LEFT', at: 0.3 },
    { side: 'RIGHT', at: 0.7 },
  ],
  three_shot: [
    { side: 'LEFT', at: 0.2 },
    { side: 'CENTRE', at: 0.5 },
    { side: 'RIGHT', at: 0.8 },
  ],
};

export const PLATE_DEFAULT_SIZE = '2304x1296';

/** {width, height} for "WxH", or {problem} when gpt-image-2 or a full-height single cannot use it. */
export function plateSize(text) {
  const m = /^(\d{3,4})x(\d{3,4})$/.exec(String(text || ''));
  if (!m) return { problem: `size "${text}" is not WIDTHxHEIGHT` };
  const width = Number(m[1]);
  const height = Number(m[2]);
  if (width % 16 || height % 16) return { problem: `size ${text}: both sides must be multiples of 16` };
  if (Math.max(width, height) > 3840) return { problem: `size ${text}: the longest side may be at most 3840` };
  const pixels = width * height;
  if (pixels < 655360 || pixels > 8294400) return { problem: `size ${text}: the picture must hold 655,360 to 8,294,400 pixels` };
  if (width / height > 3) return { problem: `size ${text}: the aspect may be at most 3:1` };
  if (width <= height) return { problem: `size ${text}: a plate is landscape, so each single is a full-height slice` };
  return { width, height };
}

/**
 * One full-height 9:16 slice per seat, in pixels: centred on the seat,
 * moved inside the picture when it would cross an edge. The width is even.
 */
export function plateCrops(width, height, layout) {
  const seats = PLATE_SEATS[layout];
  const w = Math.min(width - (width % 2), 2 * Math.floor((height * 9) / 32));
  return seats.map((seat) => {
    const x = Math.max(0, Math.min(width - w, Math.round(seat.at * width - w / 2)));
    return { x, y: 0, w, h: height };
  });
}

/**
 * The problem with cutting `layout`'s singles from a width x height plate, or
 * null. Every slice must fit around its seat without moving: three_shot needs
 * a plate at least 1.40625 times as wide as it is high (a 9:16 slice centred
 * at 20% would otherwise be pushed off its seat).
 */
export function plateCropProblem(width, height, layout) {
  const crops = plateCrops(width, height, layout);
  for (const [i, seat] of PLATE_SEATS[layout].entries()) {
    const c = crops[i];
    if (Math.abs(c.x + c.w / 2 - seat.at * width) > 1) {
      return `size ${width}x${height} is too narrow for ${layout}: the ${seat.side} single cannot be centred on its seat at ${Math.round(seat.at * 100)}%`;
    }
  }
  return null;
}

function plateText(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/** The problem with a cast for `layout`, or null. Members sit in cast order, left to right. */
export function plateCastProblem(cast, layout) {
  const seats = PLATE_SEATS[layout];
  if (cast.length !== seats.length) return `${layout} seats ${seats.length} people; the cast has ${cast.length}`;
  const keys = new Set();
  for (const m of cast) {
    if (keys.has(m.key)) return `the cast names ${m.key} twice`;
    keys.add(m.key);
    if (!m.image && !plateText(m.look)) return `cast ${m.key} needs a look (age, gender, hair, clothes) or an image: the plate cannot tell the people apart without it`;
  }
  const drawn = cast.filter((m) => !m.image).map((m) => plateText(m.look).toLowerCase().replace(/\s+/g, ' '));
  if (new Set(drawn).size !== drawn.length) return 'two cast members have the same look, so the plate would come back as twins';
  return null;
}

/** The text that places each member: "LEFT, face about 30% in from the left edge: Maya, the person in reference image 1, woman, 34". */
export function plateSeating(cast, layout) {
  const seats = PLATE_SEATS[layout];
  let ref = 0;
  return cast
    .map((m, i) => {
      const seat = seats[i];
      const where = `${seat.side}, face centred about ${Math.round(seat.at * 100)}% of the way across from the left edge`;
      const who = [plateText(m.name)];
      if (m.image) {
        ref += 1;
        who.push(`the person in reference image ${ref}, with the same face, hair and clothes`);
      }
      who.push(plateText(m.look));
      return `${where}: ${who.filter(Boolean).join(', ')}.`;
    })
    .join(' ');
}

const PLATE_COUNT_WORD = { 2: 'two', 3: 'three' };

/** The recipe's two-shot plate prompt (create-podcast-skit-video-from-refs plate_rules and realism_suffix), for 2 or 3 people. */
export function plateDefaultBody(cast, layout, room) {
  const n = PLATE_COUNT_WORD[cast.length] || String(cast.length);
  const all = cast.length === 2 ? 'Both people' : `All ${n} people`;
  return kitPromptJoin([
    `Candid documentary photograph of ${n} podcast hosts recording together in ONE room, one wide landscape frame.`,
    `Shot on a phone in available light, not lit and not styled. ${all} seated well apart side by side, facing the camera and turned slightly toward each other, mid-conversation.`,
    'Each wears over-ear headphones and speaks into a broadcast microphone on its own boom arm.',
    'Camera at seated eye level, every person framed from the chest up and in sharp focus, generous space above every head, nobody cut by the frame edge.',
    'All mouths closed and neutral.',
    `Seating, left to right: ${plateSeating(cast, layout)}`,
    `The room: ${plateText(room)}. One room with one continuous back wall a metre or two behind them, in focus.`,
    'No manufacturer names, model names, maker decals or sponsor logos anywhere: not on the equipment, the furniture, the tools, the packaging or their clothes. Every object is unbranded and plain. No printed text, no signage.',
    'Real candid documentary photograph of real people, visible skin texture and pores, slight facial asymmetry, one coherent hairstyle each with no stray long lock, natural hands with five fingers, unmodified ears. Lips closed naturally, no open mouth, no teeth.',
  ]);
}

function plateValues(cast, layout, room, answers, brand) {
  const values = { picture: '', line: '', on_screen: '', look: '', style: '', 'product.name': '', 'speaker.name': '', 'speaker.look': '' };
  if (brand && typeof brand === 'object') for (const [k, v] of Object.entries(brand)) values[`brand.${k}`] = v;
  if (answers && typeof answers === 'object') for (const [k, v] of Object.entries(answers)) values[`answers.${k}`] = v;
  values['answers.room'] = plateText(room);
  values.cast_looks = plateSeating(cast, layout);
  return values;
}

/**
 * The plate prompt. Without a template it is the recipe's. With one (a style
 * frame, version 1), `templates.plate` replaces the body; prefix and suffix
 * wrap it; `negative` becomes an "Avoid:" sentence (gpt-image-2 has no
 * negative prompt); `banned` phrases refuse. Placeholders: {cast_looks} is the
 * seating text, {answers.room} the room, {answers.KEY} and {brand.FIELD} as in
 * scenes. Throws KitPromptGap (from kitPromptFill) or an Error naming the problem.
 */
export function platePrompt({ cast, layout, room, template, answers, brand }) {
  if (!template) return plateDefaultBody(cast, layout, room);
  const values = plateValues(cast, layout, room, answers, brand);
  const opts = { who: 'the plate' };
  const fill = (t) => (typeof t === 'string' ? kitPromptFill(t, values, opts) : '');
  const own = template.templates && typeof template.templates.plate === 'string' ? template.templates.plate : null;
  const body = own != null ? fill(own) : plateDefaultBody(cast, layout, room);
  const negative = fill(template.negative);
  const prompt = kitPromptJoin([fill(template.prefix), body, fill(template.suffix), negative ? `Avoid: ${negative}` : '']);
  for (const phrase of Array.isArray(template.banned) ? template.banned : []) {
    const re = kitWholeWordsRe(phrase);
    if (re && re.test(prompt)) throw new Error(`the plate prompt uses the banned phrase "${kitPromptTidy(phrase)}"`);
  }
  return prompt;
}
