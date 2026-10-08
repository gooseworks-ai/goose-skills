import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { browserProviderOrNull, countColor, fileRef, framePixels, hasFfmpeg, levelDb, loadPart, makeCtx, makeVideo, probe } from '../../_tools/kit-harness.mjs';
import { chatThreadFor } from '../src/threads.mjs';

const { dir, mod } = await loadPart('phone-chat', '1.0.0');
const ready = (await hasFfmpeg()) && browserProviderOrNull();
const skip = !ready && 'ffmpeg or the browser is not installed';

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
