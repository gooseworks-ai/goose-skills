import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { browserMissing, browserProviderOrNull, loadNewest, countColor, fileRef, framePixels, hasFfmpeg, levelDb, loadPart, makeCtx, makeVideo, probe } from '../../_tools/kit-harness.mjs';
import { chatJoin, chatSceneTimes, chatThreadFor } from '../src/threads.mjs';

const { dir, mod } = await loadNewest('phone-chat');
const ready = (await hasFfmpeg()) && browserProviderOrNull();
const skip = !ready && (browserMissing() || 'ffmpeg is not installed');

const imessageScenes = () => [
  { id: 's1', line: null, on_screen: 'Maya: where did you find that tote?', picture: null },
  { id: 's2', line: null, on_screen: 'Me: sample goods', picture: null },
  { id: 's3', line: null, on_screen: 'Maya: ok ordering', picture: null },
  { id: 's4', line: null, on_screen: 'Shop the tote', picture: null },
];

test('the plan\'s "Name: text" scenes become the thread: Me is the owner, typing before each received message', () => {
  const { thread } = chatThreadFor('imessage', { scenes: imessageScenes().slice(0, 3), answers: { clock: 'It is 10:24 AM', theme: 'light' } });
  assert.equal(thread.mode, 'dm');
  assert.deepEqual(thread.participants.map((p) => [p.id, !!p.self]), [['me', true], ['maya', false]]);
  assert.deepEqual(thread.messages.map((m) => `${m.type}:${m.from}`), ['typing:maya', 'text:maya', 'text:me', 'typing:maya', 'text:maya']);
  assert.equal(thread.clock, '10:24');
});

test("a scene's uploaded image is the photo it shows, before its picture", () => {
  const image = { kind: 'file', path: '/plan/upload.png', sha256: 'b'.repeat(64), bytes: 9, media: 'image', mime: 'image/png' };
  const productPhoto = { kind: 'file', path: '/plan/product.png', sha256: 'c'.repeat(64), bytes: 9, media: 'image', mime: 'image/png' };
  const { thread, images } = chatThreadFor('imessage', {
    scenes: [{ id: 'a', on_screen: 'Maya: look at this', image, picture: 'Tote' }],
    products: [{ id: 'p1', name: 'Tote', images: [productPhoto] }],
  });
  assert.deepEqual(images.map((i) => i.file.path), ['/plan/upload.png']);
  assert.ok(thread.messages.some((m) => m.type === 'attachment'));
  const onlyPicture = chatThreadFor('imessage', { scenes: [{ id: 'a', on_screen: 'Maya: look', picture: 'Tote' }], products: [{ id: 'p1', name: 'Tote', images: [productPhoto] }] });
  assert.deepEqual(onlyPicture.images.map((i) => i.file.path), ['/plan/product.png']);
});

test('refuses a message with no sender, a group with no name, and a picture no chosen product matches', () => {
  assert.throws(() => chatThreadFor('imessage', { scenes: [{ id: 'a', on_screen: 'where did you find it?' }] }), /who sends it/);
  const group = [{ id: 'a', on_screen: 'Maya: hi' }, { id: 'b', on_screen: 'Sam: hey' }];
  assert.throws(() => chatThreadFor('imessage', { scenes: group }), /group/);
  assert.equal(chatThreadFor('imessage', { scenes: group, answers: { group: 'Weekend plans' } }).thread.title, 'Weekend plans');
  const products = [{ id: 'p1', name: 'Tote', images: [] }, { id: 'p2', name: 'Mug', images: [] }];
  assert.throws(() => chatThreadFor('imessage', { scenes: [{ id: 'a', on_screen: 'Maya: look', picture: 'the tote' }], products }), /no chosen product/);
});

test('Apple Notes: the title, then one line per scene, typed at the style\'s pace', () => {
  const { thread } = chatThreadFor('apple-notes', {
    scenes: [{ on_screen: 'Oat milk cheat sheet' }, { on_screen: 'flat white → Barista Blend' }, { on_screen: 'matcha → Original' }],
    pacing: { chars_per_second: 18, min_type_seconds: 1.4, first_pause_seconds: 1.0, between_pause_seconds: 0.55, last_pause_seconds: 0.9, hold_seconds: 1.4 },
  });
  assert.equal(thread.title, 'Oat milk cheat sheet');
  assert.deepEqual(thread.lines.map((l) => [l.pre_pause_seconds, l.type_seconds]), [[1.0, 1.444], [0.9, 1.4]]);
  assert.equal(thread.post_hold_seconds, 1.4);
});

test('draws the chat with its message sounds and crossfades into the end card', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const ending = await fileRef(await makeVideo(join(ctx.workDir, 'end.mp4'), 2.5, { width: 1080, height: 1920, tone: 0, pattern: 'color=c=0xff0000' }), 'video');
  const out = await mod.run({ skin: 'imessage', scenes: imessageScenes(), answers: { theme: 'dark' }, ending, ending_scenes: 1, crossfade_ms: 300, fps: 30 }, ctx);
  const info = await probe(out.video.path);
  assert.deepEqual([info.width, info.height, info.has_audio], [1080, 1920, true]);
  assert.ok(Math.abs(info.duration_s - out.seconds) < 0.1);
  const card = out.timeline.end_card;
  assert.ok(card && Math.abs(card.end_s - out.seconds) < 0.01 && Math.abs(card.end_s - card.start_s - 2.5) < 0.01, JSON.stringify(card));
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['s1', 's2', 's3', 's4']);
  // Each message makes its sound when it appears; the end card holds in silence; the card is the ending clip.
  for (const s of out.timeline.scenes.slice(0, 3)) assert.ok((await levelDb(out.video.path, s.start_s + 0.03, s.start_s + 0.2)) > -45, `a sound at ${s.start_s}s`);
  assert.equal(await levelDb(out.video.path, card.start_s + 0.6, card.end_s - 0.1), -Infinity);
  assert.ok(countColor(await framePixels(out.video.path, card.end_s - 0.5), [255, 0, 0], 40) > 100000, 'the end card clip shows at the end');
});

test('refuses a character the bundled font cannot draw, instead of falling back to a system font', async () => {
  const { ctx } = makeCtx({ partDir: dir, browser: null });
  const scenes = [{ id: 'a', on_screen: 'Maya: love it \u{1F60D}' }, { id: 'b', on_screen: 'Me: me too' }];
  await assert.rejects(mod.run({ skin: 'imessage', scenes }, ctx), (e) => e.code === 'bad_input' && /cannot draw/.test(e.message) && e.message.includes('\u{1F60D}'));
  const { pcFontCoverage, pcFontMissing } = await import('../src/fonts.mjs');
  const inter = pcFontCoverage(readFileSync(join(dir, 'assets', 'fonts', 'InterVariable.ttf')));
  assert.deepEqual(pcFontMissing(['flat white \u{2192} Barista Blend', 'caf\u{E9} \u{2014} na\u{EF}ve \u{2764}'], [inter]), [], 'Latin, arrows, dashes and a text-style heart are drawn by Inter');
  assert.deepEqual(pcFontMissing(['\u{2764}\u{FE0F}', 'ok \u{1F44D}\u{1F3FD}'], [inter]), ['\u{2764}\u{FE0F}', '\u{1F44D}\u{1F3FD}'], 'emoji need an emoji font');
  assert.deepEqual(pcFontMissing(['\u{2764}\u{FE0F}'], [inter], [[[0x2764, 0x2764]]]), [], 'an emoji font that covers it draws it');
});

test('refuses a plan whose scenes are all the end card\'s', async () => {
  const { ctx } = makeCtx({ partDir: dir, browser: null });
  await assert.rejects(mod.run({ skin: 'imessage', scenes: [{ id: 'e', on_screen: 'Shop now' }], ending_scenes: 1 }, ctx), (e) => e.code === 'bad_input');
});

// An edge-case plan: a scene photo, bold markup around punctuation, and accents written as a letter
// plus a combining mark (one grapheme, two code points), which the composer types as one key.
async function edgePlan(work) {
  const { run } = await import('../../_tools/kit-harness.mjs');
  const png = join(work, 'upload.png');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=400x300:duration=1', '-frames:v', '1', png]);
  const image = await fileRef(png, 'image');
  return {
    imessage: [
      { id: 's1', on_screen: 'Maya: did you see **this!?**', image },
      { id: 's2', on_screen: 'Me: cafe\u{301} run? **now!**' },
      { id: 's3', on_screen: 'Maya: **yes!!** ok' },
      { id: 'end', on_screen: 'Shop the tote' },
    ],
    chatgpt: [
      { id: 'q', on_screen: 'is cafe\u{301} coffee **bitter?**' },
      { id: 'a', on_screen: '**Over-extraction!** Water too hot, so na\u{EF}ve brews taste harsh.\n\n- grind *finer*?\n- brew **less**, not longer.' },
      { id: 'end', on_screen: 'Brew it right' },
    ],
  };
}

test('measure_only gives the chat length and counts from the plan, drawing, writing and ordering nothing', async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, browser: null });
  const plans = await edgePlan(ctx.workDir);
  const m = await mod.run({ skin: 'imessage', scenes: plans.imessage, ending_scenes: 1, measure_only: true }, ctx);
  assert.deepEqual(Object.keys(m).sort(), ['messages', 'photos', 'seconds', 'words']);
  assert.deepEqual([m.messages, m.photos, m.words], [4, 1, 9], 'three texts and the photo; words as a reader counts them');
  assert.ok(Math.abs(m.seconds * 30 - Math.round(m.seconds * 30)) < 1e-6, 'on a frame');
  assert.equal(orders.length, 0);
  // ChatGPT counts only the answer's streamed words: the question's words never change the count.
  const cg = await mod.run({ skin: 'chatgpt', scenes: plans.chatgpt, ending_scenes: 1, measure_only: true }, ctx);
  const longer = plans.chatgpt.map((s, i) => (i === 0 ? { ...s, on_screen: `${s.on_screen} and why is it so harsh at home` } : s));
  const cg2 = await mod.run({ skin: 'chatgpt', scenes: longer, ending_scenes: 1, measure_only: true }, ctx);
  assert.equal(cg.words, cg2.words);
  assert.ok(cg.words >= 13, `answer words ${cg.words}`);
  assert.deepEqual([cg.messages, cg.photos], [2, 0]);
  const { readdirSync } = await import('node:fs');
  assert.deepEqual(readdirSync(ctx.workDir).filter((f) => !['tmp', 'upload.png'].includes(f)), [], 'nothing is written');
  assert.deepEqual(readdirSync(ctx.tmpDir), []);
});

test('measured seconds equal the rendered chat length, for photos, bold punctuation and combining accents', { skip }, async () => {
  for (const [skin, crossfade] of [['imessage', 300], ['chatgpt', null]]) {
    const { ctx } = makeCtx({ partDir: dir });
    const scenes = (await edgePlan(ctx.workDir))[skin];
    const measure = await mod.run({ skin, scenes, ending_scenes: 1, measure_only: true }, ctx);
    const inputs = { skin, scenes, ending_scenes: 1 };
    if (crossfade !== null) {
      inputs.ending = await fileRef(await makeVideo(join(ctx.workDir, 'end.mp4'), 2.5, { width: 1080, height: 1920, tone: 0, pattern: 'color=c=0x2244aa' }), 'video');
      inputs.crossfade_ms = crossfade;
    }
    const render = await mod.run(inputs, ctx);
    const chat = render.timeline.end_card ? render.timeline.end_card.start_s + crossfade / 1000 : render.timeline.duration_s;
    assert.ok(Math.abs(measure.seconds - chat) < 0.002, `${skin}: measured ${measure.seconds}s, rendered chat ${chat}s`);
    if (!render.timeline.end_card) assert.ok(Math.abs((await probe(render.video.path)).duration_s - measure.seconds) < 0.05);
  }
});

test('a crossfade under one frame is a straight cut; longer ones are whole frames', () => {
  assert.deepEqual(chatJoin(10, 2.5, 10, 30), { frames: 0, overlap: 0, total: 12.5, ending: { start_s: 10, end_s: 12.5 } });
  const j = chatJoin(10, 2.5, 310, 30);
  assert.equal(j.frames, 9);
  assert.ok(Math.abs(j.overlap - 0.3) < 1e-9 && Math.abs(j.total - 12.2) < 1e-9);
  assert.throws(() => chatJoin(10, 0.2, 300, 30), /shorter than the crossfade/);
});

test("a scene starts at its message's first reveal, never at a later event of the same id", () => {
  const events = [{ t: 0.5, kind: 'pop', id: 'q' }, { t: 2.0, kind: 'pop', id: 'a' }, { t: 2.1, kind: 'stream-start', id: 'a' }, { t: 6.4, kind: 'stream-done', id: 'a' }];
  const scenes = chatSceneTimes([{ id: 'q' }, { id: 'a' }], [{ scene: 'q', event: 'q' }, { scene: 'a', event: 'a' }], events, 8, 8);
  assert.deepEqual(scenes, [{ id: 'q', start_s: 0.5, end_s: 2 }, { id: 'a', start_s: 2, end_s: 8 }]);
});

test('refuses a typing rate of zero, and pacing that is not finite, before anything is drawn', async () => {
  const notes = [{ on_screen: 'list' }, { on_screen: 'flat white' }];
  assert.throws(() => chatThreadFor('apple-notes', { scenes: notes, pacing: { chars_per_second: 0 } }), /above 0/);
  const { ctx } = makeCtx({ partDir: dir, browser: null });
  await assert.rejects(mod.run({ skin: 'apple-notes', scenes: notes, pacing: { chars_per_second: 0 }, measure_only: true }, ctx), (e) => e.code === 'bad_input');
  await assert.rejects(mod.run({ skin: 'apple-notes', scenes: notes, pacing: { chars_per_second: 0 } }, ctx), (e) => e.code === 'bad_input');
});

test('every character a skin draws itself (keyboard, header, status bar) is in the bundled font', async () => {
  const { pcFontCoverage, pcFontMissing } = await import('../src/fonts.mjs');
  const inter = pcFontCoverage(readFileSync(join(dir, 'assets', 'fonts', 'InterVariable.ttf')));
  const { readdirSync } = await import('node:fs');
  const plans = {
    imessage: [{ id: 'a', on_screen: 'Maya: hi' }, { id: 'b', on_screen: 'Me: hello' }],
    chatgpt: [{ id: 'q', on_screen: 'why?' }, { id: 'a', on_screen: 'Because.\n\n- one\n- two' }],
    'apple-notes': [{ on_screen: 'list' }, { on_screen: 'flat white' }],
  };
  for (const [skin, scenes] of Object.entries(plans)) {
    const build = (await import(`../src/skins/${skin}.mjs`))[{ imessage: 'imessageBuild', chatgpt: 'chatgptBuild', 'apple-notes': 'notesBuild' }[skin]];
    const assetDir = join(dir, 'assets', 'skins', skin);
    const assets = Object.fromEntries(readdirSync(assetDir).filter((n) => /\.(css|js)$/.test(n)).map((n) => [n, readFileSync(join(assetDir, n), 'utf8')]));
    const { thread } = chatThreadFor(skin, { scenes });
    const { html } = build(thread, { width: 1080, height: 1920, fps: 30, theme: 'dark', safe_area: null, assets, font_css: '', images: {} });
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;|&#\d+;/g, ' ');
    assert.deepEqual(pcFontMissing([text], [inter]), [], `${skin} draws characters Inter does not have`);
  }
});

test('with a crossfade under one frame the end card still plays, straight after the chat', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const ending = await fileRef(await makeVideo(join(ctx.workDir, 'end.mp4'), 2, { width: 1080, height: 1920, tone: 0, pattern: 'color=c=0xff0000' }), 'video');
  const out = await mod.run({ skin: 'apple-notes', scenes: [{ on_screen: 'list' }, { on_screen: 'oat milk' }, { on_screen: 'Shop now' }], ending, ending_scenes: 1, crossfade_ms: 10 }, ctx);
  const card = out.timeline.end_card;
  assert.ok(Math.abs(card.end_s - card.start_s - 2) < 0.01, JSON.stringify(card));
  const info = await probe(out.video.path);
  assert.ok(Math.abs(info.duration_s - out.seconds) < 0.05, `video ${info.duration_s}s, timeline ${out.seconds}s`);
  assert.ok(countColor(await framePixels(out.video.path, card.end_s - 0.3), [255, 0, 0], 40) > 100000, 'the end card is there at the end');
});
