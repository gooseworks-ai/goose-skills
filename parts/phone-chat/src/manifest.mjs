import { readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { file, timeline } from '../../_tools/schemas.mjs';

const VERSION = '1.1.2';
const folder = join(dirname(fileURLToPath(import.meta.url)), '..', VERSION);
const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [relative(folder, join(dir, n))]));
const files = walk(folder).filter((f) => f !== 'part.json' && !f.endsWith('.DS_Store')).sort();
const text = (max) => ({ type: ['string', 'null'], maxLength: max });

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'phone-chat',
  version: VERSION,
  kind: 'render_html',
  title: 'Phone chat',
  summary: "Draws a phone conversation from the plan's scenes (iMessage, ChatGPT, Apple Notes or a notification cascade) frame by frame with its original sounds, then crossfades into the end card.",
  runtime: 'node',
  entry: 'part.mjs',
  files,
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: true,
    ffmpeg: { filters: ['volumedetect', 'silenceremove', 'adelay', 'amix', 'alimiter', 'atrim', 'afade', 'apad', 'aresample', 'aformat', 'anullsrc', 'xfade', 'fps', 'settb', 'setsar', 'scale', 'crop', 'format'], encoders: ['libx264', 'aac', 'pcm_s16le'] },
    network: false,
    models: [],
    disk_mb: 800,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['skin', 'scenes'],
    properties: {
      skin: { enum: ['imessage', 'chatgpt', 'apple-notes', 'notification-cascade'] },
      scenes: {
        description: "plan.scenes in order. iMessage and the cascade: one message per scene as \"Name: text\" (Me is the phone's owner). ChatGPT: the question, then the answer. Apple Notes: the title, then one list line per scene. The last ending_scenes scenes are the end card's.",
        type: 'array',
        minItems: 1,
        maxItems: 40,
        items: {
          type: 'object',
          properties: {
            id: { type: ['string', 'integer', 'null'] },
            line: text(2000),
            on_screen: text(2000),
            picture: { anyOf: [{ type: 'null' }, { type: 'string', maxLength: 2000 }, file('image')] },
            image: { description: 'A picture the customer uploaded for this scene; shown before picture.', anyOf: [{ type: 'null' }, file('image')] },
          },
        },
      },
      products: {
        description: "plan.products: a scene's picture names one by id or name (or, with one chosen product, any picture means its photo).",
        type: 'array',
        maxItems: 12,
        items: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', minLength: 1 }, name: text(2000), images: { type: 'array', maxItems: 20, items: file('image') } },
        },
      },
      answers: {
        description: "plan.answers: theme (dark or light, iMessage), clock (the phone's time), group (an iMessage group's name), resolution (the cascade's success message). Others are the end card's.",
        type: ['object', 'null'],
      },
      brand_name: { description: 'brand.name: the handle on every cascade banner.', ...text(120) },
      plate: { description: 'The notification cascade\'s desk photo.', ...file('image', ['image/png', 'image/jpeg', 'image/webp']) },
      pacing: { description: "The skin's named pacing (Apple Notes: chars_per_second, min_type_seconds, first_pause_seconds, between_pause_seconds, last_pause_seconds, hold_seconds; the cascade: first_arrival_seconds, arrival_every_seconds, clear_after_seconds, resolution_hold_seconds, ending_after_seconds).", type: 'object', additionalProperties: { type: 'number', minimum: 0 } },
      ending: { description: 'The end card clip (an html-frames step) the chat crossfades into.', ...file('video') },
      ending_scenes: { description: 'How many of the last scenes are the end card\'s. Default 0.', type: 'integer', minimum: 0, maximum: 3 },
      crossfade_ms: { description: 'Crossfade into the end card, rounded to whole frames; under one frame is a straight cut. Default 300.', type: 'integer', minimum: 0, maximum: 2000 },
      fps: { description: 'Default 30.', type: 'integer', minimum: 10, maximum: 60 },
      measure_only: {
        description: "Measure the plan without drawing it: the chat's length and counts from the same code the render uses. Nothing is drawn, written or ordered. Default false.",
        type: 'boolean',
      },
      aspect: { description: 'Default 9:16. The screen is drawn at 1080 on the short side.', enum: ['9:16', '1:1', '4:5', '16:9'] },
      fonts: {
        description: 'Optional: the UI face (default the bundled Inter) and an emoji face (TTF, OTF or WOFF; default the bundled Noto Color Emoji). A character no font draws is refused.',
        type: 'object',
        additionalProperties: false,
        properties: { text: file('font'), emoji: file('font') },
      },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['seconds'],
    properties: {
      video: { description: 'H.264 with the chat\'s own sounds.', ...file('video') },
      seconds: { description: "The rendered video's length; with measure_only, the chat's length before the end card (the render's end_card.start_s plus the crossfade in whole frames, none under one frame; or its whole length with no ending).", type: 'number', exclusiveMinimum: 0 },
      timeline,
      messages: { description: 'measure_only: the messages, notifications or list lines the chat shows.', type: 'integer', minimum: 0 },
      words: {
        description: "measure_only: ChatGPT, the answers' words exactly as the page streams them (Markdown marks removed, each list bullet streams as one word; the question is not counted, it is timed by its characters); iMessage, the text messages' words; Apple Notes, the title's and lines' words; the cascade, the banner bodies' words. For the other skins words are whitespace-separated tokens.",
        type: 'integer',
        minimum: 0,
      },
      photos: { description: 'measure_only: the photos the chat shows.', type: 'integer', minimum: 0 },
    },
    oneOf: [
      { description: 'A render.', required: ['video', 'timeline'] },
      { description: 'A measure.', required: ['messages', 'words', 'photos'] },
    ],
  },
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 120, timeout_s: 1500 },
  retry: { transient: 1 },
  replaces: [
    'render-imessage-chat',
    'render-imessage-cascade',
    'render-chatgpt-chat',
    'render-apple-notes-chat',
    'create-imessage-mockup',
    'create-chatgpt-mockup',
    'create-apple-notes-mockup',
    'render-ios-keyboard',
  ],
};
