// check-layer 1.9.0: speech the script does not have (GOOSE-4034).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, layerInputsFor, loadNewest, makeCtx, makeVideo, run } from '../../_tools/kit-harness.mjs';
import { speechReview, speechTokenize } from '../../_lib/speech.mjs';
import { CHK_GAP_WINDOW_S, chkExtraWords, chkUnscriptedVoice } from '../src/speech-gaps.mjs';

const { dir, mod } = await loadNewest('check-layer');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const status = (out) => Object.fromEntries(out.verdict.checks.map((c) => [c.code, c.status]));

const GRAZA_SCRIPT = ["Okay, this is the oil I cook with now.", "It's a squeeze bottle, so no more glugging.", "Extra virgin, but made for high heat. I'm not going back."];
const extra = (script, heard) => {
  const s = script.join(' ');
  return chkExtraWords(speechReview(s, heard, {}), speechTokenize(s), speechTokenize(heard));
};

test('speech_extra_words: the Graza take said "glugging" twice and passed the similarity bar at 0.984', () => {
  const heard = "Okay, this is the oil I cook with now. It's a squeeze bottle, so no more glugging, glugging, extra virgin, but made for high heat. I'm not going back.";
  assert.equal(speechReview(GRAZA_SCRIPT.join(' '), heard, {}).passed, true, 'the bar alone lets it through');
  assert.deepEqual(extra(GRAZA_SCRIPT, heard), { words: ['glugging'], text: 'glugging', repeat: true });
});

test('speech_extra_words: made-up words and a repeated line fail; the script as written passes', () => {
  const script = ['I love this tea.', 'It tastes like fresh cut grass, and I drink it every single morning.'];
  assert.equal(extra(script, script.join(' ')), null);
  const babble = extra(script, 'I love this tea, Popiclin Xiao Fistazin. It tastes like fresh cut grass, and I drink it every single morning.');
  assert.deepEqual([babble.words, babble.repeat], [['popiclin', 'xiao', 'fistazin'], false]);
  const again = extra(script, 'I love this tea. It tastes like fresh cut grass, and I drink it every single morning. I love this tea.');
  assert.deepEqual([again.words, again.repeat], [['i', 'love', 'this', 'tea'], true]);
});

test('speech_extra_words controls: fillers, a Whisper sign-off at the end and a misheard word do not count', () => {
  const script = ['I love this tea.', 'It tastes like fresh cut grass.'];
  assert.equal(extra(script, 'I love this tea. Um, it tastes like fresh cut grass.'), null, 'a filler');
  assert.equal(extra(script, 'I love this tea. It tastes like fresh cut grass. Thank you.'), null, "Whisper's sign-off over the quiet tail");
  assert.notEqual(extra(script, 'I love this tea. Thank you. It tastes like fresh cut grass.'), null, 'the same words mid-speech are speech');
  assert.equal(extra(script, 'I love the tea. It tastes like fresh cut grass.'), null, 'a changed word is speech_matches_script, not an extra word');
});

// Levels in dB per 50 ms window: the voice at -20 inside the words, quiet at -60 in the gaps.
function levels(seconds, spans, gapDb = -60) {
  const n = Math.round(seconds / CHK_GAP_WINDOW_S);
  const out = Array(n).fill(gapDb);
  for (const [from, to, db] of spans) for (let i = Math.round(from / CHK_GAP_WINDOW_S); i < Math.round(to / CHK_GAP_WINDOW_S); i++) out[i] = db;
  return out;
}
const WORDS = [{ start_s: 0.5, end_s: 2.5 }, { start_s: 3.5, end_s: 6 }];

test('no_unscripted_speech: a voice between the lines fails; the measured Graza gap had 6 windows over the bar', () => {
  // The Graza stand-in: the second "glugging" peaked 6 to 11 dB over the voice's median in the gap.
  const babble = chkUnscriptedVoice(levels(7, [[0.5, 2.5, -20], [3.5, 6, -20], [2.85, 3.15, -12]]), CHK_GAP_WINDOW_S, WORDS, 7);
  assert.equal(babble.voice_db, -20);
  assert.deepEqual(babble.loud, [{ start_s: 2.65, end_s: 3.35, loud_windows: 6 }]);
  const clean = chkUnscriptedVoice(levels(7, [[0.5, 2.5, -20], [3.5, 6, -20]]), CHK_GAP_WINDOW_S, WORDS, 7);
  assert.deepEqual(clean.loud, []);
});

test('no_unscripted_speech controls: a music bed near the voice level, one click, the end card and a word edge pass', () => {
  // Three real beds under the Graza take, after audio-mix and the sound layer, reached +0.3 dB over the voice.
  const bed = chkUnscriptedVoice(levels(7, [[0.5, 2.5, -20], [3.5, 6, -20]], -19.7), CHK_GAP_WINDOW_S, WORDS, 7);
  assert.deepEqual(bed.loud, [], 'a bed at the voice level is not a voice');
  // One clean H3 take (Arcads g1-seed61601) had a single 50 ms spike 16.7 dB over the voice in a gap.
  const click = chkUnscriptedVoice(levels(7, [[0.5, 2.5, -20], [3.5, 6, -20], [3, 3.05, -3.3]]), CHK_GAP_WINDOW_S, WORDS, 7);
  assert.deepEqual(click.loud, [], 'one window is a click');
  const card = chkUnscriptedVoice(levels(9, [[0.5, 2.5, -20], [3.5, 6, -20], [7, 8.5, -10]]), CHK_GAP_WINDOW_S, WORDS, 7);
  assert.deepEqual(card.loud, [], 'sound on the end card is not judged');
  const edge = chkUnscriptedVoice(levels(7, [[0.5, 2.6, -20], [3.5, 6, -20]]), CHK_GAP_WINDOW_S, WORDS, 7);
  assert.deepEqual(edge.loud, [], 'a word running 0.1 s past its timing belongs to the word');
  assert.equal(chkUnscriptedVoice(levels(7, []), CHK_GAP_WINDOW_S, [], 7), null, 'no words, no voice level');
});

test('no_unscripted_speech on a real cut: a voice-band burst between the lines fails, the same cut without it passes', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  const pic = join(w, 'pic.mp4');
  await makeVideo(pic, 7, { width: 720, height: 1280, tone: 0 });
  // The lines hold a steady tone; the burst is 10 dB over it, as the Graza take's babble peaked 6 to 11 dB
  // over its speech's median (a steady tone has no peaks over its own median, real speech does).
  const lines = [[0.5, 2.5], [3.5, 6]];
  const cut = async (name, burst) => {
    const out = join(w, `${name}.mp4`);
    const said = lines.map(([a, b]) => `between(t,${a},${b})`).join('+');
    const gain = burst ? `if(between(t,${burst[0]},${burst[1]}),1,if(${said},0.32,0.01))` : `if(${said},0.32,0.01)`;
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', pic, '-f', 'lavfi', '-t', '7', '-i', 'sine=frequency=1000:sample_rate=48000', '-filter_complex', `[1:a]volume='${gain}':eval=frame[a]`, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-t', '7', out]);
    return fileRef(out, 'video');
  };
  const script = ['I love this tea.', 'It tastes like fresh cut grass.'];
  const timeline = {
    speech: [
      { scene_id: 's1', text: script[0], spoken: script[0], start_s: 0.5, end_s: 2.5, words: [{ text: 'tea', start_s: 0.5, end_s: 2.5 }] },
      { scene_id: 's2', text: script[1], spoken: script[1], start_s: 3.5, end_s: 6, words: [{ text: 'grass', start_s: 3.5, end_s: 6 }] },
    ],
  };
  const expect = { speech: 'on_camera', script, qc_flags: ['no_unscripted_speech'], duration_s: { min: 2, max: 10 } };
  const babble = await mod.run(await layerInputsFor(await cut('babble', [2.8, 3.2]), { expect, timeline }), ctx);
  const failed = babble.verdict.checks.find((c) => c.code === 'flag:no_unscripted_speech');
  assert.equal(failed.status, 'fail', JSON.stringify(failed));
  assert.match(failed.message, /from 2\.\d to 3\.\d seconds/);
  const clean = await mod.run(await layerInputsFor(await cut('clean', null), { expect, timeline }), ctx);
  assert.equal(status(clean)['flag:no_unscripted_speech'], 'pass');
  const voiceover = await mod.run(await layerInputsFor(await cut('vo', [2.8, 3.2]), { expect: { ...expect, speech: 'voiceover' }, timeline }), ctx);
  assert.equal(status(voiceover)['flag:no_unscripted_speech'], 'not_applicable', 'only generated on-camera speech is judged');
});
