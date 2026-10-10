// Rule tests for the chatgpt phone-chat skin. Run: node --test chatgpt.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHATGPT_THREAD_SCHEMA, chatgptBuild } from '../src/skins/chatgpt.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = fs.readFileSync(path.join(HERE, '../src/skins/chatgpt.mjs'), 'utf8');
const ASSETS = path.join(HERE, '../1.0.0/assets/skins/chatgpt');
const assets = {
  'chat.css': fs.readFileSync(path.join(ASSETS, 'chat.css'), 'utf8'),
  'icons.js': fs.readFileSync(path.join(ASSETS, 'icons.js'), 'utf8'),
};
const PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function env(extra = {}) {
  return { width: 1080, height: 1920, fps: 30, theme: 'light', safe_area: null, assets, font_css: '', images: { photo1: PHOTO }, ...extra };
}

function sample() {
  return {
    status_bar: { time: '9:41' },
    header: { style: 'plain-title', title: 'ChatGPT', right_icons: ['personPlus', 'dottedCircle'], right_icons_alt: ['edit', 'more'] },
    keyboard: { suggestions: ['I', 'The', "I'm"] },
    messages: [
      { type: 'user-text', id: 'u1', text: "what's the easiest way to plan a week of meals?" },
      { type: 'loading-dot', id: 'dot1' },
      {
        type: 'assistant',
        id: 'a1',
        feedback: false,
        text: 'The simplest approach:\n\n* Pick 3-4 dinners you like\n* Batch one protein on Sunday\n* Let an app build the list [[cite:Example +1]]\n\n---\n\nExampleBrand does all three in one tap — you pick the meals, it plans the week and orders the ingredients.',
      },
      { type: 'user-image', id: 'img1', image: 'photo1', aspect: 'square' },
      { type: 'user-text', id: 'u2', text: 'can it do this one too? 🥗' },
      { type: 'assistant', id: 'a2', title: 'Yes, easily', text: 'Yes — snap it and **ExampleBrand** builds the list.' },
    ],
    composer: { placeholder: 'Ask ChatGPT' },
  };
}

function withMessages(messages, extra = {}) {
  return { ...sample(), messages, ...extra };
}

function planOf(html) {
  const m = /<script type="application\/json" id="cg-plan">([\s\S]*?)<\/script>/.exec(html);
  assert.ok(m, 'page embeds its plan');
  return JSON.parse(m[1]);
}

const onFrame = (t, fps) => Math.abs(t * fps - Math.round(t * fps)) < 1e-6;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

test('thread schema uses only the allowed JSON Schema subset, closed objects and snake_case names', () => {
  const allowed = new Set(['type', 'properties', 'required', 'additionalProperties', 'enum', 'const', 'items', 'minItems', 'maxItems', 'minLength', 'maxLength', 'pattern', 'minimum', 'maximum', 'oneOf']);
  const walk = (node, at) => {
    for (const key of Object.keys(node)) assert.ok(allowed.has(key), `${at}: keyword ${key} is outside the subset`);
    if (node.type === 'object') {
      assert.equal(node.additionalProperties, false, `${at}: objects must set additionalProperties:false`);
      for (const [name, sub] of Object.entries(node.properties || {})) {
        assert.match(name, /^[a-z][a-z0-9_]*$/, `${at}.${name} is not lower_snake_case`);
        walk(sub, `${at}.${name}`);
      }
    }
    if (node.items) walk(node.items, `${at}[]`);
    (node.oneOf || []).forEach((sub, i) => walk(sub, `${at}.oneOf[${i}]`));
  };
  walk(CHATGPT_THREAD_SCHEMA, '$');
});

test('the sample thread fits the schema and a stray field does not', async (t) => {
  let kitSchemaErrors;
  try {
    ({ kitSchemaErrors } = await import('../../_lib/schema.mjs'));
  } catch {
    t.skip('parts/_lib/schema.mjs is not available');
    return;
  }
  assert.deepEqual(kitSchemaErrors(CHATGPT_THREAD_SCHEMA, sample()), []);
  const bad = sample();
  bad.messages[0].popState = 'pending';
  assert.ok(kitSchemaErrors(CHATGPT_THREAD_SCHEMA, bad).length > 0);
});

// ---------------------------------------------------------------------------
// Cross-field refusals: each bad thread throws, the nearest good one builds.
// ---------------------------------------------------------------------------

const longText = 'w'.repeat(10) + ' ' + 'plan my meals for the week please '.repeat(8);
const refusals = [
  ['a message id used twice', () => [sample(), env()], () => {
    const t = sample();
    t.messages[4].id = 'u1';
    return [t, env()];
  }, /used twice/],
  ['a chat that opens with the assistant', () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }, { type: 'assistant', id: 'a', text: 'Hello' }]), env()],
    () => [withMessages([{ type: 'assistant', id: 'a', text: 'Hello' }, { type: 'user-text', id: 'u', text: 'hi' }]), env()], /open with the user/],
  ['an image not followed by its user text', () => [withMessages([{ type: 'user-image', id: 'i', image: 'photo1' }, { type: 'user-text', id: 'u', text: 'this?' }]), env()],
    () => [withMessages([{ type: 'user-text', id: 'u', text: 'this?' }, { type: 'assistant', id: 'a', text: 'Yes' }, { type: 'user-image', id: 'i', image: 'photo1' }]), env()], /must be followed by the user-text/],
  ['an image key missing from env.images', () => [sample(), env()], () => [sample(), env({ images: {} })], /missing from env\.images/],
  ['a loading dot not right before an answer', () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }, { type: 'loading-dot', id: 'd' }, { type: 'assistant', id: 'a', text: 'Hello' }]), env()],
    () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }, { type: 'loading-dot', id: 'd' }]), env()], /right before the assistant/],
  ['an assistant message that answers no user text', () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }, { type: 'assistant', id: 'a', text: 'Hello' }]), env()],
    () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }, { type: 'assistant', id: 'a', text: 'Hello' }, { type: 'assistant', id: 'b', text: 'Again' }]), env()], /must answer a user-text/],
  ['a user message sent again before an answer', () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }, { type: 'assistant', id: 'a', text: 'Hello' }, { type: 'user-text', id: 'v', text: 'and?' }]), env()],
    () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }, { type: 'user-text', id: 'v', text: 'and?' }, { type: 'assistant', id: 'a', text: 'Hello' }]), env()], /must be answered before/],
  ['a user message with no visible text', () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }]), env()], () => [withMessages([{ type: 'user-text', id: 'u', text: '   ' }]), env()], /no visible text/],
  ['a header title too long for the header', () => [{ ...sample(), header: { style: 'model-tag', title: 'ChatGPT', model: '5.1', right_icons: ['personPlus', 'dottedCircle', 'more'] } }, env()],
    () => [{ ...sample(), header: { style: 'model-tag', title: 'W'.repeat(32), model: 'MMMMMMMM', right_icons: ['personPlus', 'dottedCircle', 'more'] } }, env()], /header\.title is too long/],
  ['a question too long for the composer on this canvas', () => [withMessages([{ type: 'user-text', id: 'u', text: longText }]), env()],
    () => [withMessages([{ type: 'user-text', id: 'u', text: longText }]), env({ width: 1080, height: 1080 })], /too long to type in the composer/],
  ['an answer with no words', () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }, { type: 'assistant', id: 'a', text: 'Hi' }]), env()],
    () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }, { type: 'assistant', id: 'a', text: '---' }]), env()], /no words/],
  ['a chat longer than two minutes', () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }, { type: 'assistant', id: 'a', text: 'word '.repeat(300) }]), env()],
    () => [withMessages([{ type: 'user-text', id: 'u', text: 'hi' }, { type: 'assistant', id: 'a', text: 'word '.repeat(300) }]), env({ timing: { stream_wps: 2 } })], /keep it under 120 s/],
  ['safe-area bands that leave the chat too narrow', () => [sample(), env({ safe_area: { top: 220, bottom: 400, left: 0, right: 140 } })],
    () => [sample(), env({ safe_area: { top: 220, bottom: 400, left: 0, right: 600 } })], /too narrow/],
  ['an unknown timing value', () => [sample(), env({ timing: { tail_hold: 0.5 } })], () => [sample(), env({ timing: { tail_hld: 0.5 } })], /not a chatgpt pacing value/],
  ['a negative timing value', () => [sample(), env({ timing: { dot_hold: 0 } })], () => [sample(), env({ timing: { dot_hold: -1 } })], /zero or more/],
  ['an ending hold under half a second', () => [sample(), env({ timing: { tail_hold: 0.5 } })], () => [sample(), env({ timing: { tail_hold: 0.4 } })], /at least 0\.5/],
  ['an odd canvas size', () => [sample(), env({ width: 1080 })], () => [sample(), env({ width: 1081 })], /even whole numbers/],
  ['a missing icons asset', () => [sample(), env()], () => [sample(), env({ assets: { 'chat.css': assets['chat.css'] } })], /icons\.js asset/],
];

for (const [name, good, bad, message] of refusals) {
  test(`refuses ${name}`, () => {
    const [okThread, okEnv] = good();
    assert.doesNotThrow(() => chatgptBuild(okThread, okEnv));
    const [badThread, badEnv] = bad();
    assert.throws(() => chatgptBuild(badThread, badEnv), message);
  });
}

// ---------------------------------------------------------------------------
// Timeline, typing, cues
// ---------------------------------------------------------------------------

test('events are sorted, on frame boundaries, and the movie holds the last state', () => {
  for (const fps of [24, 30, 60]) {
    const out = chatgptBuild(sample(), env({ fps }));
    assert.ok(out.events.length > 0);
    for (let i = 1; i < out.events.length; i++) assert.ok(out.events[i].t >= out.events[i - 1].t, 'sorted');
    for (const e of out.events) {
      assert.ok(onFrame(e.t, fps), `${e.kind} at ${e.t} is off the ${fps} fps grid`);
      assert.deepEqual(Object.keys(e).filter((k) => !['t', 'kind', 'id'].includes(k)), []);
    }
    assert.ok(onFrame(out.total_s, fps));
    assert.ok(out.total_s >= out.events.at(-1).t + 0.5 - 1e-9);
  }
});

test('the composer types exactly the text that is sent, finishing before the send tap', () => {
  const thread = sample();
  const out = chatgptBuild(thread, env());
  const plan = planOf(out.html);
  const src = /function cgTypedCount\([^)]*\) \{[\s\S]*?\n\}/.exec(out.html);
  assert.ok(src, 'page carries the typing rule');
  const typedCount = new Function(`return (${src[0]})`)();
  const users = thread.messages.filter((m) => m.type === 'user-text');
  const types = plan.items.filter((it) => it.k === 'type');
  const sends = plan.items.filter((it) => it.k === 'send');
  assert.equal(types.length, users.length);
  users.forEach((m, i) => {
    const typing = types[i];
    const send = sends[i];
    assert.equal(send.id, m.id);
    assert.equal(typing.g.join(''), m.text);
    const n = typing.g.length;
    assert.equal(typedCount(n, typing.dur, 0), 0, 'composer starts empty');
    const lastFrame = send.t - 1 / 30;
    assert.equal(typing.g.slice(0, typedCount(n, typing.dur, lastFrame - typing.t)).join(''), m.text, 'full text shows the frame before the tap');
    assert.ok(out.html.includes(`data-anim-id="${m.id}"><div class="bubble">`), 'the sent bubble exists');
  });
});

test('the send tap is one beat: bubble, keyboard down and header swap share its frame', () => {
  const out = chatgptBuild(sample(), env());
  const sends = out.events.filter((e) => e.kind === 'send');
  assert.equal(sends.length, 2);
  for (const s of sends) {
    assert.ok(out.events.some((e) => e.kind === 'pop' && e.id === s.id && e.t === s.t));
    assert.ok(out.events.some((e) => e.kind === 'keyboard-hide' && e.t === s.t));
  }
  const swaps = out.events.filter((e) => e.kind === 'header-swap');
  assert.equal(swaps.length, 1);
  assert.equal(swaps[0].t, sends[0].t);
  assert.ok(out.events.some((e) => e.kind === 'pop' && e.id === 'img1' && e.t === sends[1].t), 'the image is sent with its text');
  const plain = sample();
  delete plain.header.right_icons_alt;
  assert.equal(chatgptBuild(plain, env()).events.filter((e) => e.kind === 'header-swap').length, 0);
});

test('cues sit on their events, at their gains, and use only shipped sounds', () => {
  const thread = sample();
  const out = chatgptBuild(thread, env());
  const files = new Set(fs.readdirSync(path.join(ASSETS, 'sfx')));
  const rule = { key: ['key-tap.wav', 1.33], send: ['send-tap.wav', 5], 'answer-show': ['response-done.wav', 4.5], 'stream-tick': ['stream-tick.wav', 1.6], 'stream-done': ['response-done.wav', 1.4] };
  for (let i = 1; i < out.cues.length; i++) assert.ok(out.cues[i].t >= out.cues[i - 1].t, 'sorted');
  for (const c of out.cues) {
    assert.ok(files.has(c.sound), `${c.sound} is not in assets/skins/chatgpt/sfx`);
    const kinds = Object.keys(rule).filter((k) => rule[k][0] === c.sound && rule[k][1] === c.gain);
    assert.ok(kinds.length, `${c.sound} at gain ${c.gain} has no cue rule`);
    assert.ok(out.events.some((e) => kinds.includes(e.kind) && e.t === c.t), `${c.sound} at ${c.t} has no ${kinds.join(' or ')} event`);
  }
  const answers = thread.messages.filter((m) => m.type === 'assistant');
  for (const a of answers) {
    const pop = out.events.find((e) => e.kind === 'pop' && e.id === a.id);
    assert.ok(out.cues.some((c) => c.t === pop.t && c.sound === 'response-done.wav' && c.gain === 4.5), `no sound when the answer ${a.id} appears`);
  }
  const words = thread.messages.filter((m) => m.type === 'user-text').reduce((n, m) => n + m.text.split(/\s+/).filter(Boolean).length, 0);
  assert.equal(out.cues.filter((c) => c.sound === 'key-tap.wav').length, words, 'one key-tap per typed word');
  assert.equal(out.cues.filter((c) => c.sound === 'send-tap.wav').length, 2);
  const dotTimes = out.events.filter((e) => e.kind === 'dot-show').map((e) => e.t);
  assert.ok(!out.cues.some((c) => dotTimes.includes(c.t)), 'never a cue when the loading dot shows');
  assert.deepEqual(chatgptBuild({ ...thread, sfx: false }, env()).cues, []);
});

test('streamed answers tick every 12 words and finish after their last word', () => {
  const out = chatgptBuild(sample(), env());
  const plan = planOf(out.html);
  for (const a of plan.items.filter((it) => it.k === 'answer')) {
    assert.ok(a.stream);
    const ticks = out.events.filter((e) => e.kind === 'stream-tick' && e.id === a.id);
    assert.equal(ticks.length, Math.floor((a.n - 1) / 12));
    const done = out.events.find((e) => e.kind === 'stream-done' && e.id === a.id);
    assert.ok(done.t >= a.s + (a.n - 1) / a.wps);
    assert.ok(Math.abs(a.n / a.wps - (done.t - a.s)) < 0.1, 'about 7 words a second');
  }
  const still = sample();
  still.messages[2].stream = false;
  const quiet = chatgptBuild(still, env());
  assert.equal(quiet.events.filter((e) => e.id === 'a1' && e.kind.startsWith('stream')).length, 0);
  assert.ok(quiet.events.some((e) => e.kind === 'answer-done' && e.id === 'a1'), 'an unstreamed answer still holds its reading time');
});

test('timing overrides change the pacing', () => {
  const slow = chatgptBuild(sample(), env());
  const fast = chatgptBuild(sample(), env({ timing: { stream_wps: 14, tail_hold: 0.5 } }));
  assert.ok(fast.total_s < slow.total_s);
});

// ---------------------------------------------------------------------------
// Page and module hygiene
// ---------------------------------------------------------------------------

const SYSTEM_FONTS = /-apple-system|BlinkMacSystemFont|SF Pro|Helvetica|Arial|system-ui|Segoe UI|Roboto|Menlo|Courier|Times New Roman/i;
const FORBIDDEN = /\bDate\b|Math\.random|\bsetTimeout\b|\bsetInterval\b|\brequestAnimationFrame\b|\bperformance\b|\bfetch\b|\brequire\b|\bprocess\b/;

test('the page names no system font or web URL, uses no clock, and defines seek', () => {
  const out = chatgptBuild(sample(), env({ safe_area: { top: 220, bottom: 400, left: 0, right: 140 } }));
  assert.doesNotMatch(out.html, SYSTEM_FONTS);
  assert.doesNotMatch(out.html, /https?:\/\//);
  assert.doesNotMatch(out.html, FORBIDDEN);
  assert.match(out.html, /window\.seek = function \(ms\)/);
  assert.match(out.html, /window\.seek\(0\)/);
  assert.match(out.html, /font-family: KitText, KitEmoji, sans-serif/);
  assert.match(out.html, /overflow: hidden/);
});

test('building twice gives the identical page', () => {
  const a = chatgptBuild(sample(), env());
  const b = chatgptBuild(sample(), env());
  assert.equal(a.html, b.html);
  assert.deepEqual(a.events, b.events);
  assert.deepEqual(a.cues, b.cues);
});

test('the module source has no imports, no clocks, no URLs and prefixed top-level names', () => {
  assert.doesNotMatch(SOURCE, /^\s*import\s/m);
  assert.doesNotMatch(SOURCE, /\bimport\s*\(/);
  assert.doesNotMatch(SOURCE, FORBIDDEN);
  assert.doesNotMatch(SOURCE, /https?:\/\//);
  assert.doesNotMatch(SOURCE, SYSTEM_FONTS);
  assert.doesNotMatch(SOURCE, /export\s+default|export\s*\{/);
  const names = [...SOURCE.matchAll(/^(?:export\s+)?(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  assert.ok(names.length > 10);
  for (const name of names) assert.match(name, /^(cg|CG_|chatgpt|CHATGPT_)/, `${name} is not prefixed`);
});
