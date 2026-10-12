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

const fiveLines = 'We loved the demo and want to roll it out across all of our sales teams next quarter, so can you send the pricing for fifty seats and the onboarding plan by Friday afternoon?';
for (const [name, change, pattern, extra] of [
  ['a repeated id', (t) => { t.resolution.id = 'n2'; }, /unique id; n2/],
  ['a plate that was not supplied', (t) => { t.plate = 'kitchen'; }, /plate image kitchen was not supplied/],
  ['a body longer than four lines, saying how much to cut', (t) => { t.notifications[2].body = fiveLines; }, /body of n3 needs [5-9] lines; a banner shows at most 4\. Cut about \d+ characters/],
  ['a body of keycaps measured at the emoji width, not the digit\'s', (t) => { t.notifications[2].body = '1️⃣'.repeat(80); }, /body of n3 needs 7 lines; a banner shows at most 4/],
  ['a stack that cannot fit even folded, saying what to shorten', (t) => { t.notifications[3].body = 'We loved the demo and want to roll it out across all of our sales teams next quarter'; }, /body of n4 takes 3 lines, .* even with the older banners folded into a stack; shorten it to 2 lines/, { safe_area: { ...SAFE, top: 1042 } }],
  ['a canvas with no room for any banner', () => {}, /No notification banner fits above the phone below the safe area's top band/, { safe_area: { ...SAFE, top: 1300 } }],
  ['pacing given through env.timing', () => {}, /leave env\.timing empty/, { timing: { start: 1 } }],
]) {
  test(`refuses ${name}`, () => {
    const t = thread();
    change(t);
    assert.throws(() => ncBuild(t, env(extra)), (e) => e.constructor === Error && pattern.test(e.message));
  });
}

const page = (built) => JSON.parse(/const NC_PAGE=(.*);\n/.exec(built.html)[1]);
const twoLines = (i) => `Message ${i}: we loved the demo and want to roll it out next quarter`;

test('three to five notifications with two-line bodies and a success message always render, the oldest folding when the pile is full', () => {
  for (let n = 3; n <= 5; n++) {
    const t = { ...thread(), notifications: Array.from({ length: n }, (_, i) => ({ id: `n${i + 1}`, title: 'New lead', body: twoLines(i + 1) })) };
    const built = ncBuild(t, env({ font_css: interCss() }));
    const rows = page(built).rows;
    assert.ok(rows.every((r) => close(r.h, 220)), 'each banner is two lines tall');
    const folds = rows.filter((r) => r.s !== null);
    if (n < 5) assert.deepEqual([folds.length, built.warnings], [0, []], `${n} two-line banners fit open`);
    else {
      assert.deepEqual(rows.map((r) => r.s), [rows[4].a, null, null, null, null], 'the oldest folds as the fifth arrives, with its push');
      assert.deepEqual(built.warnings, ['When n5 arrives, n1 folds into a stack behind the newer banners, so the pile fits above the phone.']);
    }
  }
  const six = { ...thread(), notifications: Array.from({ length: 6 }, (_, i) => ({ id: `n${i + 1}`, title: 'New lead', body: twoLines(i + 1) })) };
  assert.deepEqual(page(ncBuild(six, env({ font_css: interCss() }))).rows.map((r) => r.s !== null), [true, true, false, false, false, false], 'one more folds for each banner past five');
  const ones = { ...thread(), notifications: Array.from({ length: 6 }, (_, i) => ({ id: `n${i + 1}`, title: 'New lead', body: 'hi' })) };
  assert.deepEqual(ncBuild(ones, env({ safe_area: null })).warnings, [], 'six one-line banners fit open without the platform bands');
  assert.equal(ncBuild(ones, env()).warnings.length, 1, 'and fold one under them');
  assert.doesNotThrow(() => ncBuild(thread(), env({ timing: {} })));
});

test('each banner is as tall as its own body; the stack and the pill follow the arrivals', () => {
  const t = thread();
  t.notifications[1].body = 'We loved the demo and want to roll it out across all of our sales teams next quarter';
  const built = ncBuild(t, env({ font_css: interCss() }));
  const p = page(built);
  assert.deepEqual(p.rows.map((r) => Math.round(r.h)), [176, 264, 176, 176], 'one, three, one and one lines');
  assert.equal(p.res_h, 176);
  assert.match(built.warnings[0], /body of n2 wraps to 3 lines/);
  assert.equal((built.html.match(/data-nc="n2" style="height:264px"/g) || []).length, 1);
});

test('a word wider than the banner breaks between its characters, and a long name or brand is cut with an ellipsis', () => {
  const t = thread();
  t.notifications[0].body = 'Pneumonoultramicroscopicsilicovolcanoconiosis good';
  t.notifications[1].title = 'Your new inbound lead from the website';
  t.handle = 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW';
  const built = ncBuild(t, env({ font_css: interCss() }));
  assert.deepEqual(built.warnings.slice(0, 3).map((w) => w.split(' ').slice(0, 4).join(' ')), ['The brand name on', 'The word "Pneumonoultramicroscopic…" in', 'The name on n2']);
  const banner = /data-nc="n1"[\s\S]*?<\/div><\/div><\/div>/.exec(built.html)[0];
  const lines = [...banner.matchAll(/nc-line"[^>]*>([^<]*)</g)].map((m) => m[1]);
  assert.ok(lines.length === 2 && lines.join('').replace(/ /g, '') === 'Pneumonoultramicroscopicsilicovolcanoconiosisgood', lines.join('|'));
  assert.match(built.html, /nc-title">Your new inbound lead[^<]*…</);
  assert.match(built.html, /nc-handle">W+…</);
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
  const lines = (e) => Math.round(page(ncBuild(t, e)).rows[0].h);
  t.notifications[0].body = 'Saw your post and loved it. Do you have time for a call this week?';
  assert.equal(lines(env()), 264);
  assert.equal(lines(env({ font_css: interCss() })), 220);
  t.notifications[0].body = 'Saw the post, loved it. Do you have time for a quick call with our whole team this week?';
  assert.equal(lines(env({ font_css: interCss() })), 264);
  t.notifications[0].body = '1️⃣'.repeat(14);
  assert.equal(lines(env({ font_css: interCss() })), 220, 'thirteen keycaps to a line, at the emoji width');
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
