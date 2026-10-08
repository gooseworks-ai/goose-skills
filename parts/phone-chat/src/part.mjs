// phone-chat: one phone screen with skins (iMessage, ChatGPT, Apple Notes,
// the iMessage notification cascade), folded from the render-*-chat,
// render-imessage-cascade and create-*-mockup atoms. The plan's scenes become
// the skin's thread; the skin writes one frame page whose window.seek(ms) draws
// the screen at any movie time; the part steps it frame by frame in the kit's
// Chromium (fixed output frames, so browser start-up or machine speed never
// changes a frame), lays the skin's original sounds on their reveal frames,
// and crossfades into the style's end card clip.
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitNum, kitStopIfAborted } from '../../_lib/part.mjs';
import { imessageBuild } from './skins/imessage.mjs';
import { chatgptBuild } from './skins/chatgpt.mjs';
import { notesBuild } from './skins/apple-notes.mjs';
import { ncBuild } from './skins/notification-cascade.mjs';
import { chatSceneText, chatThreadFor } from './threads.mjs';
import { pcFontCoverage, pcFontMissing } from './fonts.mjs';

const BUILD = { imessage: imessageBuild, chatgpt: chatgptBuild, 'apple-notes': notesBuild, 'notification-cascade': ncBuild };
const SIZE = { '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350], '16:9': [1920, 1080] };
// The TikTok/Reels bands at 1080x1920 (review-finished-ad's), scaled to the canvas.
const SAFE_BANDS = { top: 220, bottom: 400, right: 140, left: 0 };
const CHUNK_FRAMES = 150;

function safeArea(width, height) {
  if (width * 16 !== height * 9) return null;
  return { top: (SAFE_BANDS.top * height) / 1920, bottom: (SAFE_BANDS.bottom * height) / 1920, right: (SAFE_BANDS.right * width) / 1080, left: SAFE_BANDS.left };
}

async function dataUri(file, mime) {
  return `data:${mime || file.mime};base64,${(await readFile(file.path)).toString('base64')}`;
}

function fontFormat(path) {
  const m = /\.(ttf|otf|woff2?)$/i.exec(path || '');
  return { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' }[(m ? m[1] : 'ttf').toLowerCase()];
}

async function skinAssets(dir) {
  const out = {};
  for (const name of (await readdir(dir)).sort()) if (/\.(css|js)$/.test(name)) out[name] = await readFile(join(dir, name), 'utf8');
  return out;
}

async function peakDb(ctx, path) {
  const { stderr } = await kitFfmpeg(ctx, ['-i', path, '-af', 'volumedetect', '-f', 'null', '-']);
  const m = [...stderr.matchAll(/max_volume:\s*(-?inf|-?\d+(?:\.\d+)?) dB/g)].at(-1);
  return m && !m[1].includes('inf') ? Number(m[1]) : null;
}

/**
 * The skin's sounds as one track the length of the chat: every cue at its time
 * and gain, its leading silence stripped (the audible onset lands on the reveal
 * frame), cut to max_s with a short fade, summed without normalising, limited.
 */
async function effectsTrack(ctx, soundDir, cues, total) {
  const peaks = new Map();
  for (const c of cues) {
    if (!peaks.has(c.sound)) {
      const peak = await peakDb(ctx, join(soundDir, c.sound));
      if (peak === null || peak < -60) throw ctx.error('output_invalid', `the sound ${c.sound} is silent`);
      peaks.set(c.sound, peak);
    }
  }
  const args = ['-f', 'lavfi', '-t', kitNum(total), '-i', 'anullsrc=r=48000:cl=stereo'];
  const graph = [];
  const labels = ['[0:a]'];
  cues.forEach((c, i) => {
    if (!(c.t >= 0 && c.t < total)) throw ctx.error('output_invalid', `a sound cue at ${c.t}s is outside the ${total}s chat`);
    args.push('-i', join(soundDir, c.sound));
    const threshold = (peaks.get(c.sound) + 20 * Math.log10(0.05)).toFixed(2);
    const cut = c.max_s ? `atrim=duration=${kitNum(c.max_s, 3)},afade=t=out:st=${kitNum(Math.max(0, c.max_s - 0.06), 3)}:d=0.06,` : '';
    const ms = Math.round(c.t * 1000);
    graph.push(
      `[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,silenceremove=start_periods=1:start_threshold=${threshold}dB:start_mode=any,asetpts=PTS-STARTPTS,` +
        `${cut}adelay=${ms}|${ms},volume=${c.gain}[s${i}]`,
    );
    labels.push(`[s${i}]`);
  });
  graph.push(`${labels.join('')}amix=inputs=${labels.length}:duration=first:dropout_transition=0:normalize=0,aresample=176400,alimiter=limit=0.794:level=0,aresample=48000[out]`);
  const out = join(ctx.tmpDir, 'sounds.wav');
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph.join(';'), '-map', '[out]', '-t', kitNum(total), '-c:a', 'pcm_s16le', out]);
  return out;
}

/** Steps the page frame by frame and encodes it, in chunks so the frames never pile up on disk. */
async function renderPage(ctx, html, { width, height, fps, total, skin, events }) {
  if (!ctx.browser) throw ctx.error('needs_missing', 'the phone chat is drawn in the kit browser');
  const frames = Math.round(total * fps);
  const chunks = [];
  const browser = await ctx.browser.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(html);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode()));
    });
    if (skin === 'imessage') {
      // render-imessage-chat's guards: typed text equals sent text, the newest row stays in the safe zone.
      for (const ev of events) {
        const at = ev.t + (ev.kind === 'composer' ? ev.dur * 0.95 : 0.3);
        const state = await page.evaluate((ms) => {
          window.seek(ms);
          return { typed: window.__composerText(), report: window.__safeAreaReport() };
        }, at * 1000);
        if (ev.kind === 'composer' && state.typed !== ev.text) throw ctx.error('output_invalid', `typed "${state.typed}" but sends "${ev.text}"`);
        if (state.report.violations.length) throw ctx.error('output_invalid', `the newest message leaves the platform safe area at ${at.toFixed(2)}s`);
      }
    }
    for (let start = 0; start < frames; start += CHUNK_FRAMES) {
      kitStopIfAborted(ctx);
      const count = Math.min(CHUNK_FRAMES, frames - start);
      for (let k = 0; k < count; k++) {
        const f = start + k;
        await page.evaluate((ms) => window.seek(ms), (f * 1000) / fps);
        await page.screenshot({ path: join(ctx.tmpDir, `f${String(k).padStart(5, '0')}.png`), type: 'png' });
      }
      const chunk = join(ctx.tmpDir, `chunk-${String(chunks.length).padStart(4, '0')}.mp4`);
      await kitFfmpeg(ctx, ['-framerate', String(fps), '-i', join(ctx.tmpDir, 'f%05d.png'), '-frames:v', String(count), '-vf', 'format=yuv420p', ...ctx.tools.encodeArgs('h264-intermediate'), '-r', String(fps), chunk]);
      for (let k = 0; k < count; k++) await rm(join(ctx.tmpDir, `f${String(k).padStart(5, '0')}.png`), { force: true });
      chunks.push(chunk);
      ctx.progress({ done: start + count, total: frames });
    }
  } finally {
    await browser.close();
  }
  const list = join(ctx.tmpDir, 'chunks.txt');
  await writeFile(list, `${chunks.map((c) => `file '${c.replace(/'/g, "'\\''")}'`).join('\n')}\n`);
  const silent = join(ctx.tmpDir, 'chat.mp4');
  await kitFfmpeg(ctx, ['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);
  return silent;
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const [width, height] = SIZE[inputs.aspect ?? '9:16'];
  const fps = inputs.fps ?? 30;
  const xfade = (inputs.crossfade_ms ?? 300) / 1000;
  const endingScenes = inputs.ending_scenes ?? 0;
  if (endingScenes >= inputs.scenes.length) throw ctx.error('bad_input', 'every scene is the end card\'s; the chat has none');
  const chatScenes = inputs.scenes.slice(0, inputs.scenes.length - endingScenes);
  const endScenes = inputs.scenes.slice(inputs.scenes.length - endingScenes);

  let plan;
  try {
    plan = chatThreadFor(inputs.skin, { scenes: chatScenes, products: inputs.products, answers: inputs.answers, brand_name: inputs.brand_name, plate: inputs.plate, pacing: inputs.pacing });
  } catch (e) {
    throw ctx.error('bad_input', e.message);
  }
  const images = {};
  for (const img of plan.images) images[img.key] = await dataUri(img.file);
  const fonts = inputs.fonts || {};
  const text = fonts.text || { path: join(ctx.part.dir, 'assets', 'fonts', 'InterVariable.ttf'), mime: 'font/ttf' };
  let fontCss = `@font-face{font-family:KitText;src:url(${await dataUri(text, 'font/ttf')}) format('${fontFormat(text.path)}');font-weight:100 900;font-display:block;}`;
  if (fonts.emoji) fontCss += `@font-face{font-family:KitEmoji;src:url(${await dataUri(fonts.emoji, 'font/ttf')}) format('${fontFormat(fonts.emoji.path)}');font-display:block;}`;
  // Every character the plan puts on screen must be drawn by the bundled or given fonts: a missing
  // glyph would fall back to whatever font the computer has, and the video would differ between computers.
  let textCoverage;
  let emojiCoverage = [];
  try {
    textCoverage = [pcFontCoverage(await readFile(text.path))];
    if (fonts.emoji) emojiCoverage = [pcFontCoverage(await readFile(fonts.emoji.path))];
  } catch (e) {
    throw ctx.error('bad_input', e.message);
  }
  const a = inputs.answers || {};
  const shown = [...chatScenes.map(chatSceneText), inputs.brand_name, a.group, a.clock].filter((t) => typeof t === 'string');
  const missing = pcFontMissing(shown, textCoverage, emojiCoverage);
  if (missing.length) {
    throw ctx.error('bad_input', `the chat uses ${missing.slice(0, 5).join(' ')}, which the fonts cannot draw; leave ${missing.length > 1 ? 'them' : 'it'} out or give an emoji font`);
  }
  const skinDir = join(ctx.part.dir, 'assets', 'skins', inputs.skin);
  const env = {
    width,
    height,
    fps,
    theme: plan.theme ?? 'dark',
    safe_area: safeArea(width, height),
    assets: await skinAssets(skinDir),
    font_css: fontCss,
    images,
    timing: inputs.skin === 'imessage' || inputs.skin === 'chatgpt' ? inputs.pacing : undefined,
  };
  let built;
  try {
    built = BUILD[inputs.skin](plan.thread, env);
  } catch (e) {
    throw ctx.error('bad_input', e.message);
  }
  const chatDur = built.total_s;
  const silent = await renderPage(ctx, built.html, { width, height, fps, total: chatDur, skin: inputs.skin, events: built.events });
  const sounds = built.cues.length ? await effectsTrack(ctx, join(skinDir, 'sfx'), built.cues, chatDur) : null;

  // Join: the chat with its sounds, crossfaded into the end card, which holds in silence (the bed comes in audio-mix).
  let total = chatDur;
  const args = ['-i', silent];
  const graph = [];
  let vLabel = '[0:v]';
  let ending = null;
  if (inputs.ending) {
    const endLen = (await ctx.tools.probe(inputs.ending.path)).duration_s;
    if (!(endLen > xfade)) throw ctx.error('bad_input', 'the end card clip is shorter than the crossfade');
    if (!(chatDur > xfade)) throw ctx.error('bad_input', 'the chat is shorter than the crossfade');
    args.push('-i', inputs.ending.path);
    graph.push(
      `[0:v]fps=${fps},settb=AVTB,setsar=1,format=yuv420p[c];[1:v]fps=${fps},scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},settb=AVTB,setsar=1,format=yuv420p[e];` +
        `[c][e]xfade=transition=fade:duration=${kitNum(xfade, 3)}:offset=${kitNum(chatDur - xfade)}[v]`,
    );
    vLabel = '[v]';
    total = chatDur + endLen - xfade;
    ending = { start_s: +(chatDur - xfade).toFixed(3), end_s: +total.toFixed(3) };
  }
  if (sounds) args.push('-i', sounds);
  else args.push('-f', 'lavfi', '-t', kitNum(total), '-i', 'anullsrc=r=48000:cl=stereo');
  const aIndex = inputs.ending ? 2 : 1;
  graph.push(`[${aIndex}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:${kitNum(total)}[a]`);
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph.join(';'), '-map', vLabel, '-map', '[a]', ...ctx.tools.encodeArgs('h264-master'), ...ctx.tools.encodeArgs('aac'), '-r', String(fps), '-t', kitNum(total), join(ctx.workDir, 'chat.mp4')]);
  const video = await ctx.file('chat.mp4', 'video');

  // Scenes: each chat scene from the moment it shows; the end card scenes over the card.
  const reveal = new Map(built.events.filter((e) => e.id).map((e) => [String(e.id), e.t]));
  const starts = chatScenes.map((s, i) => {
    const id = s.id == null ? `s${i + 1}` : String(s.id);
    const hit = plan.scene_ids.find((x) => x.scene === id);
    return { id, start_s: hit && reveal.has(hit.event) ? reveal.get(hit.event) : (chatDur * i) / chatScenes.length };
  });
  starts.sort((a, b) => a.start_s - b.start_s);
  const scenes = starts.map((s, i) => ({ id: s.id, start_s: +s.start_s.toFixed(3), end_s: +(i + 1 < starts.length ? starts[i + 1].start_s : ending ? ending.start_s : chatDur).toFixed(3) }));
  if (ending) for (const s of endScenes) scenes.push({ id: s.id == null ? 'end-card' : String(s.id), start_s: ending.start_s, end_s: ending.end_s });
  const timeline = { duration_s: +total.toFixed(3), width, height, fps, scenes, speech: [] };
  if (ending) timeline.end_card = ending;
  return kitCheckOutputs(ctx, manifest, { video, seconds: +total.toFixed(3), timeline });
}
