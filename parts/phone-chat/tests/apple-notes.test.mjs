// Rule tests for the apple-notes phone-chat skin. Run: node --test parts/phone-chat/tests/apple-notes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOTES_THREAD_SCHEMA, notesBuild } from '../src/skins/apple-notes.mjs';
import { kitSchemaErrors } from '../../_lib/schema.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, '../1.0.0/assets/skins/apple-notes');
const MODULE_SOURCE = readFileSync(join(HERE, '../src/skins/apple-notes.mjs'), 'utf8');
const PNG_1X1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const SYSTEM_FONTS = /-apple-system|BlinkMacSystemFont|system-ui|SF Pro|San Francisco|Segoe UI|Helvetica|Arial|Roboto|Ubuntu|Cantarell|Noto Sans|Menlo|Monaco|Consolas|Courier|Times New Roman|Georgia|Verdana/i;
const CLOCKS = /\bDate\b|Math\s*\.\s*random|\bsetTimeout\b|\bsetInterval\b|\brequestAnimationFrame\b|\bperformance\b/;

// Today's render-apple-notes-chat config.example.json note, unchanged.
const TODAY = {
  title: 'Oat milk for every coffee.',
  lines: [
    { text: 'flat white → Barista Blend.', type_seconds: 1.6, pre_pause_seconds: 1.0 },
    { text: 'iced latte → Original. stays creamy cold.', type_seconds: 2.3, pre_pause_seconds: 0.55 },
    { text: 'cutting sugar → Unsweetened.', type_seconds: 1.7, pre_pause_seconds: 0.55 },
    { text: 'cold brew → the Vanilla one. trust me.', type_seconds: 2.1, pre_pause_seconds: 0.55 },
    { text: 'one carton. every drink sorted.', type_seconds: 1.8, pre_pause_seconds: 0.9 },
  ],
  post_hold_seconds: 1.4,
  status_bar: { time: '8:12', battery_pct: 64 },
  keyboard_state: { suggestions: ['I', 'The', 'My'], shift: 'lower' },
};

// Every block kind the mockup draws: paragraph, checklist rows, an image, a divider.
const MIXED = {
  title: 'Packing list',
  lines: [
    { text: "Don't forget \"the\" basics.", type_seconds: 1.2 },
    { type: 'check', text: 'Sunscreen', type_seconds: 0.6, checked: true },
    { type: 'check', text: 'Hat', type_seconds: 0.4 },
    { type: 'image', image: 'beach', caption: 'last year' },
    { type: 'check', text: 'Snacks 🍪', type_seconds: 0.5 },
    { type: 'divider' },
    { text: 'Leave at 9.', type_seconds: 0.7 },
  ],
};

function env(over = {}) {
  return {
    width: 1080,
    height: 1920,
    fps: 30,
    theme: 'light',
    safe_area: null,
    assets: { 'note.css': readFileSync(join(ASSETS, 'note.css'), 'utf8'), 'icons.js': readFileSync(join(ASSETS, 'icons.js'), 'utf8') },
    font_css: '@font-face { font-family: KitText; src: url(data:font/ttf;base64,AAAA); }',
    images: { beach: PNG_1X1 },
    ...over,
  };
}

const pageData = (html) => JSON.parse(/<script type="application\/json" id="notes-data">([\s\S]*?)<\/script>/.exec(html)[1]);
const onFrame = (t, fps) => Math.abs(t * fps - Math.round(t * fps)) < 1e-6;

test('the schema keeps to the kit subset: closed objects, snake_case names', () => {
  const allowed = new Set(['type', 'properties', 'required', 'additionalProperties', 'enum', 'const', 'items', 'minItems', 'maxItems', 'minLength', 'maxLength', 'pattern', 'minimum', 'maximum', 'oneOf']);
  const walk = (node, at) => {
    for (const key of Object.keys(node)) assert.ok(allowed.has(key), `${at} uses ${key}`);
    if (node.type === 'object') {
      assert.equal(node.additionalProperties, false, `${at} is not closed`);
      for (const [name, sub] of Object.entries(node.properties)) {
        assert.match(name, /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/, `${at}.${name}`);
        walk(sub, `${at}.${name}`);
      }
    }
    if (node.items) walk(node.items, `${at}[]`);
    for (const [i, sub] of (node.oneOf || []).entries()) walk(sub, `${at}|${i}`);
  };
  walk(NOTES_THREAD_SCHEMA, '$');
});

test('the schema takes today\'s note and the mockup blocks, and refuses what the recorder refused', () => {
  assert.deepEqual(kitSchemaErrors(NOTES_THREAD_SCHEMA, TODAY), []);
  assert.deepEqual(kitSchemaErrors(NOTES_THREAD_SCHEMA, MIXED), []);
  const withLine = (line) => ({ ...TODAY, lines: [line] });
  assert.notDeepEqual(kitSchemaErrors(NOTES_THREAD_SCHEMA, withLine({ text: 'flat white — Barista', type_seconds: 1 })), []);
  assert.notDeepEqual(kitSchemaErrors(NOTES_THREAD_SCHEMA, withLine({ text: 'x'.repeat(81), type_seconds: 1 })), []);
  assert.deepEqual(kitSchemaErrors(NOTES_THREAD_SCHEMA, withLine({ text: 'x'.repeat(80), type_seconds: 1 })), []);
  assert.notDeepEqual(kitSchemaErrors(NOTES_THREAD_SCHEMA, withLine({ text: 'hi', type_seconds: 0 })), []);
  assert.notDeepEqual(kitSchemaErrors(NOTES_THREAD_SCHEMA, withLine({ type: 'image', text: 'hi' })), []);
  assert.notDeepEqual(kitSchemaErrors(NOTES_THREAD_SCHEMA, { ...TODAY, post_hold_seconds: 0.2 }), []);
});

test('an image key missing from env.images is refused', () => {
  assert.doesNotThrow(() => notesBuild(MIXED, env()));
  assert.throws(() => notesBuild(MIXED, env({ images: {} })), /image beach, which is not among the provided images/);
});

test('an image that is not a base64 PNG, JPEG, GIF or WebP data URI is refused', () => {
  assert.throws(() => notesBuild(MIXED, env({ images: { beach: 'file:///tmp/beach.png' } })), /base64 image data URI/);
  assert.throws(() => notesBuild(MIXED, env({ images: { beach: 'data:image/png;base64,' + btoa('not a picture at all') } })), /PNG, JPEG, GIF or WebP/);
  const jpeg = 'data:image/jpeg;base64,' + btoa('\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xc0\x00\x11\x08\x00\x30\x00\x40\x03\x01\x22\x00\x02\x11\x01\x03\x11\x01');
  const html = notesBuild(MIXED, env({ images: { beach: jpeg } })).html;
  assert.match(html, /width="64" height="48"/);
});

test('timing overrides must be known, finite and not negative', () => {
  const unpaused = { ...TODAY, lines: [{ text: 'hi', type_seconds: 0.5 }] };
  assert.equal(notesBuild(unpaused, env()).events.find((e) => e.kind === 'type').t, 1);
  assert.equal(notesBuild(unpaused, env({ timing: { first_pre_pause_s: 2 } })).events.find((e) => e.kind === 'type').t, 2);
  assert.equal(notesBuild(TODAY, env({ timing: { first_pre_pause_s: 2 } })).events.find((e) => e.kind === 'type').t, 1, 'the line\'s own pre-pause wins');
  assert.throws(() => notesBuild(TODAY, env({ timing: { typing_speed: 1 } })), /no pacing constant named typing_speed/);
  assert.throws(() => notesBuild(TODAY, env({ timing: { blink_s: -1 } })), /finite number, zero or more/);
  assert.throws(() => notesBuild(TODAY, env({ timing: { blink_s: Number.NaN } })), /finite number, zero or more/);
  assert.throws(() => notesBuild(TODAY, env({ timing: [1] })), /object of named pacing constants/);
});

test('a safe area is honoured, and one that leaves no room is refused', () => {
  const tiktok = { top: 220, bottom: 400, left: 0, right: 140 };
  const safe = notesBuild(TODAY, env({ safe_area: tiktok })).html;
  const plain = notesBuild(TODAY, env()).html;
  const right = (html) => Number(/\.note \{ top: [\d.]+px; left: [\d.]+px; right: ([\d.]+)px;/.exec(html)[1]);
  assert.equal(right(plain), 66);
  assert.ok((1080 - 140) / (1080 / 1180) >= 1180 - right(safe), 'the text column ends left of the right band');
  assert.doesNotThrow(() => notesBuild(TODAY, env({ safe_area: { top: 220, bottom: 1400, left: 0, right: 0 } })));
  assert.throws(() => notesBuild(TODAY, env({ safe_area: { top: 220, bottom: 1650, left: 0, right: 0 } })), /no room for the newest note line/);
  assert.throws(() => notesBuild(TODAY, env({ safe_area: { top: 0, bottom: 0, left: 300, right: 300 } })), /too narrow a column/);
  assert.throws(() => notesBuild(TODAY, env({ safe_area: { middle: 4 } })), /unknown band middle/);
});

test('missing skin assets are refused', () => {
  assert.throws(() => notesBuild(TODAY, env({ assets: {} })), /icons\.js asset/);
  const a = env().assets;
  assert.throws(() => notesBuild(TODAY, env({ assets: { 'icons.js': a['icons.js'] } })), /note\.css asset/);
  assert.throws(() => notesBuild(TODAY, env({ assets: { ...a, 'icons.js': 'module.exports = {};' } })), /no backChevron icon/);
});

test('events are sorted, on frame boundaries, and the movie holds the last state', () => {
  for (const [thread, e] of [[TODAY, env()], [MIXED, env()], [TODAY, env({ fps: 24 })]]) {
    const { events, total_s } = notesBuild(thread, e);
    for (let i = 1; i < events.length; i++) assert.ok(events[i - 1].t <= events[i].t, `event ${i} out of order`);
    for (const ev of events) assert.ok(onFrame(ev.t, e.fps), `${ev.kind} at ${ev.t} is off a frame`);
    assert.ok(onFrame(total_s, e.fps));
    assert.ok(total_s >= events.at(-1).t + 0.5 - 1e-9, 'ending hold under 0.5 s');
    const data = pageData(notesBuild(thread, e).html);
    const times = [...data.presses.flatMap((p) => [p.t, p.end]), ...data.blocks.flatMap((b) => [b.show, ...b.times])];
    for (const t of times) assert.ok(onFrame(t, e.fps), `page time ${t} is off a frame`);
  }
});

test('the typed text equals each line, in order, between its type and typed events', () => {
  const { html, events } = notesBuild(MIXED, env());
  const data = pageData(html);
  const typed = data.blocks.filter((b) => b.chars.length).map((b) => b.chars.join(''));
  assert.deepEqual(typed, MIXED.lines.filter((l) => l.text).map((l) => l.text));
  for (const b of data.blocks) {
    for (let i = 1; i < b.times.length; i++) assert.ok(b.times[i - 1] <= b.times[i]);
  }
  const ids = MIXED.lines.map((l, i) => (l.text ? `line-${i + 1}` : null)).filter(Boolean);
  ids.forEach((id, k) => {
    const block = data.blocks.filter((b) => b.chars.length)[k];
    assert.equal(block.times[0], events.find((e) => e.kind === 'type' && e.id === id).t);
    assert.equal(block.times.at(-1), events.find((e) => e.kind === 'typed' && e.id === id).t);
  });
  const tick = events.find((e) => e.kind === 'tick');
  assert.equal(tick.id, 'line-2');
  assert.ok(tick.t >= events.find((e) => e.kind === 'typed' && e.id === 'line-2').t);
  assert.equal(events.filter((e) => e.kind === 'tick').length, 1, 'only the checked row ticks');
  assert.equal(events.filter((e) => e.kind === 'insert').length, 2);
});

test('the skin is silent: every cue names a shipped sound', () => {
  for (const thread of [TODAY, MIXED]) {
    const { cues, events } = notesBuild(thread, env());
    assert.deepEqual(cues, []);
    for (const c of cues) {
      assert.ok(existsSync(join(ASSETS, 'sfx', c.sound)));
      assert.ok(events.some((e) => e.t === c.t));
    }
  }
});

test('the page is self-contained, deterministic and names no system font, URL or clock', () => {
  for (const thread of [TODAY, MIXED]) {
    const { html } = notesBuild(thread, env());
    assert.equal(notesBuild(thread, env()).html, html, 'two builds differ');
    assert.doesNotMatch(html, SYSTEM_FONTS);
    assert.doesNotMatch(html, /https?:\/\//);
    assert.doesNotMatch(html, CLOCKS);
    assert.match(html, /window\.seek = /);
    assert.match(html, /overflow: hidden !important/);
  }
});

test('the module source has no imports, no clocks and only notes-prefixed top-level names', () => {
  assert.doesNotMatch(MODULE_SOURCE, /^\s*import\b/m);
  assert.doesNotMatch(MODULE_SOURCE, CLOCKS);
  assert.doesNotMatch(MODULE_SOURCE, /https?:\/\/|\bfetch\s*\(|\brequire\s*\(|\bprocess\s*\./);
  assert.doesNotMatch(MODULE_SOURCE.replace(/^\s*\/\/.*$/gm, ''), SYSTEM_FONTS);
  assert.doesNotMatch(MODULE_SOURCE, /^export\s+(default|\{|\*)/m);
  const names = [...MODULE_SOURCE.matchAll(/^(?:export\s+)?(?:const|let|function)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  assert.ok(names.length > 5);
  for (const n of names) assert.match(n, /^(notes|NOTES_)/, n);
});
