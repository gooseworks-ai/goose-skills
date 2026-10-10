// Rule tests for the notification-cascade phone-chat skin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NC_THREAD_SCHEMA, ncBuild } from '../src/skins/notification-cascade.mjs';
import { kitSchemaErrors } from '../../_lib/schema.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, '../1.0.0/assets/skins/notification-cascade');
const SOURCE = join(HERE, '../src/skins/notification-cascade.mjs');
const INTER = join(HERE, '../1.0.0/assets/fonts/InterVariable.ttf');
const PLATE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const SAFE = { top: 220, bottom: 400, right: 140, left: 0 };
const env = (extra = {}) => ({ width: 1080, height: 1920, fps: 30, theme: 'dark', safe_area: SAFE, assets: {}, font_css: '', images: { desk: PLATE }, ...extra });
const interCss = () => `@font-face{font-family:KitText;src:url(data:font/ttf;base64,${readFileSync(INTER).toString('base64')}) format('truetype');font-weight:100 900;}`;
const thread = () => ({
  handle: 'Gooseworks',
  plate: 'desk',
  notifications: [
    { id: 'n1', title: 'New lead', body: 'Hey! Saw your email.' },
    { id: 'n2', title: 'New lead', body: 'Can you send pricing?' },
    { id: 'n3', title: 'New lead', body: "I'm interested." },
    { id: 'n4', title: 'New lead', body: "Let's book a call." },
  ],
  resolution: { id: 'win', title: 'Calendar', body: 'Demo booked for Tuesday.' },
});
const close = (a, b) => Math.abs(a - b) < 1e-6;
const onFrame = (t) => Math.abs(t * 30 - Math.round(t * 30)) < 1e-6;

test('a valid thread fits the schema and builds', () => {
  assert.deepEqual(kitSchemaErrors(NC_THREAD_SCHEMA, thread()), []);
  assert.deepEqual(kitSchemaErrors(NC_THREAD_SCHEMA, { ...thread(), resolution: null, pacing: { first_arrival_seconds: 1, ending_after_seconds: 0.5 } }), []);
  assert.match(ncBuild(thread(), env()).html, /window\.seek = /);
});

for (const [name, change] of [
  ['an unknown thread field', (t) => { t.theme = 'dark'; }],
  ['an unknown notification field', (t) => { t.notifications[0].handle = 'x'; }],
  ['an unknown resolution field', (t) => { t.resolution.at = 9; }],
  ['an unknown pacing field', (t) => { t.pacing = { duration: 14 }; }],
  ['seven notifications', (t) => { for (let i = 5; i <= 7; i++) t.notifications.push({ id: `n${i}`, title: 'New lead', body: 'hi' }); }],
  ['a 31-character handle', (t) => { t.handle = 'x'.repeat(31); }],
  ['a blank body', (t) => { t.notifications[1].body = '   '; }],
  ['a resolution held under 1.5 s', (t) => { t.pacing = { resolution_hold_seconds: 1.4 }; }],
  ['arrivals under 0.7 s apart', (t) => { t.pacing = { arrival_every_seconds: 0.5 }; }],
  ['an ending hold under 0.5 s', (t) => { t.pacing = { ending_after_seconds: 0.2 }; }],
]) {
  test(`the schema refuses ${name}`, () => {
    const t = thread();
    change(t);
    assert.notDeepEqual(kitSchemaErrors(NC_THREAD_SCHEMA, t), []);
  });
}

for (const [name, change, pattern, extra] of [
  ['a repeated id', (t) => { t.resolution.id = 'n2'; }, /unique id; n2/],
  ['a plate that was not supplied', (t) => { t.plate = 'kitchen'; }, /plate image kitchen was not supplied/],
  ['a body that needs three lines', (t) => { t.notifications[2].body = 'We loved the demo and want to roll it out across all of our sales teams next quarter'; }, /body of n3 needs 3 lines/],
  ['a word wider than the banner', (t) => { t.notifications[0].body = 'Supercalifragilisticexpialidociously'; }, /wider than the banner/],
  ['a title too long for one line', (t) => { t.notifications[1].title = 'Your new inbound lead from the website'; }, /title of n2 does not fit/],
  ['a stack too tall for the safe area', (t) => { t.notifications.push({ id: 'n5', title: 'New lead', body: 'hi' }, { id: 'n6', title: 'New lead', body: 'hi' }); }, /6 notifications .* do not fit/],
  ['pacing given through env.timing', () => {}, /leave env\.timing empty/, { timing: { start: 1 } }],
]) {
  test(`refuses ${name}`, () => {
    const t = thread();
    change(t);
    assert.throws(() => ncBuild(t, env(extra)), (e) => e.constructor === Error && pattern.test(e.message));
  });
}

test('the stack-height and env.timing refusals depend on what they check', () => {
  const six = thread();
  six.notifications.push({ id: 'n5', title: 'New lead', body: 'hi' }, { id: 'n6', title: 'New lead', body: 'hi' });
  assert.doesNotThrow(() => ncBuild(six, env({ safe_area: null })), 'six one-line banners fit without the platform bands');
  const twoLine = thread();
  twoLine.notifications[0].body = 'We loved the demo and want to roll it out next quarter';
  assert.throws(() => ncBuild({ ...twoLine, notifications: [...twoLine.notifications, { id: 'n5', title: 'New lead', body: 'hi' }] }, env()), /two-line bodies do not fit/);
  assert.doesNotThrow(() => ncBuild(twoLine, env()), 'four two-line banners fit');
  assert.doesNotThrow(() => ncBuild(thread(), env({ timing: {} })));
});

test('the banners stay clear of the right-hand platform band, and refuse bands that leave no room', () => {
  const left = (e) => Number(/\.nc-row, \.nc-pill-row \{ position: absolute; left: ([\d.]+)px/.exec(ncBuild(thread(), e).html)[1]);
  assert.equal(left(env({ safe_area: null })), 135, 'centred at SIDE 135 without bands');
  assert.ok(left(env()) + 810 <= 1080 - SAFE.right, 'moved left of the 140 px right band');
  assert.throws(() => ncBuild(thread(), env({ safe_area: { ...SAFE, left: 200, right: 200 } })), /side bands/);
});

test('copy is measured with the supplied KitText font', () => {
  // Wraps to three lines with the fallback widths (the widest faces) but fits two in Inter.
  const t = thread();
  t.notifications[0].body = 'Saw your post and loved it. Do you have time for a call this week?';
  assert.throws(() => ncBuild(t, env()), /needs 3 lines/);
  assert.doesNotThrow(() => ncBuild(t, env({ font_css: interCss() })));
  t.notifications[0].body = 'Saw the post, loved it. Do you have time for a quick call with our whole team this week?';
  assert.throws(() => ncBuild(t, env({ font_css: interCss() })), /needs 3 lines/);
});

test('events run forward on frame boundaries with the atom\'s default pacing', () => {
  const { events, total_s } = ncBuild(thread(), env());
  for (let i = 0; i < events.length; i++) {
    assert.ok(onFrame(events[i].t), `${events[i].kind} at ${events[i].t}`);
    if (i) assert.ok(events[i].t > events[i - 1].t);
  }
  assert.deepEqual(events.map((e) => `${e.kind}:${e.id ?? ''}`), ['arrive:n1', 'arrive:n2', 'arrive:n3', 'arrive:n4', 'clear:', 'resolve:win']);
  assert.deepEqual(events.slice(0, 4).map((e) => e.t), [1.6, 3.6, 5.6, 7.6]);
  assert.ok(close(events[4].t, 9.2), 'the X clears 1.6 s after the last arrival');
  assert.ok(close(events[5].t, 9.9), 'the resolution comes 0.7 s after the clear');
  assert.ok(close(total_s, 9.9 + 1.5 + 0.7) && onFrame(total_s), 'the resolution holds, then the ending');
  const plain = ncBuild({ ...thread(), resolution: null, pacing: { ending_after_seconds: 0.5 } }, env());
  assert.ok(close(plain.total_s, 9.7) && plain.total_s >= plain.events.at(-1).t + 0.5, 'no resolution: the movie ends after the clear');
  const odd = ncBuild({ ...thread(), pacing: { first_arrival_seconds: 0.51, arrival_every_seconds: 0.77 } }, env({ fps: 24 }));
  for (const e of odd.events) assert.ok(Math.abs(e.t * 24 - Math.round(e.t * 24)) < 1e-6, `${e.kind} at ${e.t} on a 24 fps frame`);
});

test('a pop on each banner\'s first visible frame, a swoosh on the clear, the shipped sounds only', () => {
  const { events, cues, total_s } = ncBuild(thread(), env());
  assert.equal(cues.length, events.length);
  cues.forEach((c, i) => {
    assert.ok(close(c.t, events[i].t + 1 / 30), `cue ${i} at ${c.t}`);
    assert.ok(c.t < total_s);
    assert.ok(existsSync(join(ASSETS, 'sfx', c.sound)), `${c.sound} is shipped`);
  });
  assert.deepEqual(cues.map((c) => `${c.sound}@${c.gain}`), ['pop.wav@4', 'pop.wav@4', 'pop.wav@4', 'pop.wav@4', 'swoosh.wav@0.8', 'pop.wav@4']);
  assert.deepEqual(readdirSync(join(ASSETS, 'sfx')).sort(), ['pop.wav', 'swoosh.wav']);
});

test('the page is self-contained and deterministic, and the module bundles cleanly', () => {
  const a = ncBuild(thread(), env({ font_css: interCss() })).html;
  assert.equal(a, ncBuild(thread(), env({ font_css: interCss() })).html);
  const page = a.replace(/data:[^"')]+/g, '');
  assert.doesNotMatch(page, /https?:\/\//);
  assert.doesNotMatch(page, /-apple-system|BlinkMacSystemFont|SF Pro|Helvetica|Arial|system-ui|Segoe UI/);
  assert.doesNotMatch(page, /Date\.now|new Date\(|Math\.random|setTimeout|setInterval|requestAnimationFrame|performance\./);
  const src = readFileSync(SOURCE, 'utf8');
  assert.doesNotMatch(src, /^\s*import\s|\brequire\s*\(|\bfetch\s*\(|\bprocess\b|\bDate\b|Math\.random|setTimeout|setInterval|requestAnimationFrame|\bperformance\b|https?:\/\/|export default/m);
  const names = [...src.matchAll(/^(?:export\s+)?(?:const|let|function)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  assert.ok(names.length > 5 && names.every((n) => /^(nc|NC_)/.test(n)), names.join(', '));
});
