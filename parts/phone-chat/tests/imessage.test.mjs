// Rule tests for the iMessage phone-chat skin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMESSAGE_THREAD_SCHEMA, imessageBuild } from '../src/skins/imessage.mjs';
import { kitSchemaErrors } from '../../_lib/schema.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, '../1.0.0/assets/skins/imessage');
const PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const env = (extra = {}) => ({
  width: 1080, height: 1920, fps: 30, theme: 'dark', safe_area: { top: 220, bottom: 400, right: 140, left: 0 },
  assets: { 'chat.css': readFileSync(join(ASSETS, 'chat.css'), 'utf8'), 'icons.js': readFileSync(join(ASSETS, 'icons.js'), 'utf8') },
  font_css: '', images: { tote: PHOTO }, ...extra,
});
const thread = () => ({
  mode: 'dm',
  clock: '10:24',
  participants: [{ id: 'me', name: 'Me', self: true }, { id: 'maya', name: 'Maya' }],
  messages: [
    { id: 'm1', type: 'text', from: 'maya', text: 'where did you find that tote?' },
    { id: 'm2', type: 'text', from: 'me', text: 'sample goods \u{1F604}' },
    { id: 'm3', type: 'typing', from: 'maya' },
    { id: 'm4', type: 'text', from: 'maya', text: 'send me the link pls' },
    { id: 'm5', type: 'attachment', from: 'me', image: 'tote', presentation: 'rich-link', title: 'The tote', subtitle: 'samplegoods.example' },
    { id: 'r1', type: 'tapback', from: 'maya', target: 'm5', emoji: '\u{2764}\u{FE0F}' },
  ],
});

test('a valid thread fits the schema and builds', () => {
  assert.deepEqual(kitSchemaErrors(IMESSAGE_THREAD_SCHEMA, thread()), []);
  const out = imessageBuild(thread(), env());
  assert.ok(out.html.includes('window.seek'));
});

for (const [name, change, pattern] of [
  ['two self participants', (t) => { t.participants[1].self = true; }, /exactly one self/],
  ['a nameless contact', (t) => { t.participants[1].name = ' '; }, /no demo-name fallback/],
  ['typing before my own message', (t) => { t.messages[2].from = 'me'; }, /Typing m3/],
  ['a reaction to a later message', (t) => { t.messages.splice(1, 0, { id: 'r0', type: 'tapback', from: 'maya', target: 'm4', emoji: 'x' }); }, /Tapback r0/],
  ['an image that was not supplied', (t) => { t.messages[4].image = 'missing'; }, /not supplied/],
  ['a group with no title', (t) => { t.mode = 'group'; }, /group needs a title/],
  ['a repeated id', (t) => { t.messages[3].id = 'm1'; }, /unique id/],
]) {
  test(`refuses ${name}`, () => {
    const t = thread();
    change(t);
    assert.throws(() => imessageBuild(t, env()), pattern);
  });
}

test('refuses unknown or negative pacing and a phone too large for the canvas', () => {
  assert.throws(() => imessageBuild(thread(), env({ timing: { start: -1 } })), /finite number/);
  assert.throws(() => imessageBuild(thread(), env({ timing: { warp: 2 } })), /Unknown iMessage timing/);
  assert.throws(() => imessageBuild({ ...thread(), zoom: 3 }, env()), /does not fit/);
});

test('events run forward on frame boundaries and the movie holds after the last one', () => {
  const { events, total_s } = imessageBuild(thread(), env());
  for (let i = 0; i < events.length; i++) {
    assert.ok(Math.abs(events[i].t * 30 - Math.round(events[i].t * 30)) < 1e-6, `${events[i].kind} at ${events[i].t}`);
    if (i) assert.ok(events[i].t >= events[i - 1].t);
  }
  assert.ok(total_s >= events.at(-1).t + 0.5);
  assert.ok(Math.abs(total_s * 30 - Math.round(total_s * 30)) < 1e-6);
  const composer = events.find((e) => e.kind === 'composer');
  assert.equal(composer.text, 'sample goods \u{1F604}', 'the composer types exactly the sent text');
  const send = events.find((e) => e.kind === 'pop' && e.id === 'm2');
  assert.ok(send.t >= composer.t + composer.dur, 'the message sends after it is typed');
});

test('one cue per real message and reaction, on the frame after its reveal, with the original sounds only', () => {
  const { events, cues } = imessageBuild(thread(), env());
  const reveals = events.filter((e) => ['pop', 'typing-swap', 'tapback'].includes(e.kind));
  assert.equal(cues.length, reveals.length);
  cues.forEach((c, i) => {
    assert.ok(Math.abs(c.t - (reveals[i].t + 1 / 30)) < 1e-6, `cue ${i} at ${c.t}`);
    assert.ok(existsSync(join(ASSETS, 'sfx', c.sound)), `${c.sound} is shipped`);
  });
  assert.deepEqual(cues.map((c) => c.sound), ['imessage-receive.mp3', 'imessage-send.mp3', 'imessage-receive.mp3', 'imessage-send.mp3', 'imessage-receive.mp3']);
  assert.equal(cues.at(-1).gain, 0.47, 'a reaction is the soft cue');
  // A receive chime with the next message close behind is cut short so it cannot mask it.
  const quick = cues.find((c, i) => c.sound === 'imessage-receive.mp3' && i + 1 < cues.length && cues[i + 1].t - c.t < 1.3);
  assert.ok(quick && quick.max_s <= 0.2, JSON.stringify(quick));
});

test('the page is self-contained and deterministic', () => {
  const a = imessageBuild(thread(), env()).html;
  const b = imessageBuild(thread(), env()).html;
  assert.equal(a, b);
  assert.doesNotMatch(a, /https?:\/\//);
  assert.doesNotMatch(a, /-apple-system|SF Pro|Helvetica|Arial|system-ui/);
  assert.doesNotMatch(a, /Date\.now|new Date\(|Math\.random|setTimeout|setInterval|requestAnimationFrame/);
});
