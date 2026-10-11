// cut-footage: lays the brand's own footage into a video, the cut from
// footage-cutlist's render (cut.py, filmed.py), compose-creator-layer's split
// and render-logo-equation-card's compose. Four modes:
//   band     (the 1.0.2 behaviour, the default without scenes): the plan's first
//            footage window, cover-fitted (or fitted by width) into one band of
//            the video, sped so the window fills it (speed "fill", refused
//            outside min_speed to max_speed) or played at a fixed speed.
//   scenes   one beat per plan scene, full frame: the scene's footage window
//            (footage entries matched by scene_id), else its image or image
//            footage held still, else (scene 1 only) the lead clip. Each window
//            is sped to fit scene_seconds; beats join with dissolves; output
//            timeline scenes carry the plan's scene ids at their real times.
//   inserts  a talking track (video + timeline) with full-frame inserts at the
//            times of the scenes that have footage or an image; the track's
//            sound runs under them. Every take join (joins) must sit under an
//            insert; an insert that ends just before one is stretched over it.
//            A scene tagged extra.shot "grid" (with `grid`) plays four entries
//            as a 2x2 grid.
//   split    the talking track with, per scene, its footage window (or its
//            image, slowly pushed in) in one zone and the creator cover-cropped
//            into the other (_lib/panels.mjs); a scene with neither shows the
//            creator full frame. The output timeline names the creator zone
//            as the caption zone.
// inserts and split: push_in zooms slowly into every full-frame creator
// stretch of min_hold_s or more; first_scene_look blurs the first scene or
// covers it with a card.
// look "screen" frames every footage beat as a screen filmed by a phone
// (_lib/screen-look.mjs); "plain" fits it (cover, width or height). Crop and
// mask boxes from the footage entry apply in the source before the look.
// Every final encode caps its bitrate and a file over 180 MB is refused (§4.12).
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { kitMediaLength } from '../../_lib/length.mjs';
import { kitScreenBoxProblems, kitScreenGraph, kitScreenProblems } from '../../_lib/screen-look.mjs';
import { kitPanelCover, kitPanelDivider, kitPanelFit, kitPanelSeamRows, kitPanelVstack } from '../../_lib/panels.mjs';
import { CUT_MAX_BYTES, CutRefusal, cutCheckMode, cutCheckOrder, cutCheckProjectedSize, cutCreatorRuns, cutEntryFile, cutEntryIsStill, cutGridCellSpeed, cutModeOf, cutPlaceInserts, cutPlanScenes, cutSceneSources, cutSplitSlots, cutSpeedFor, cutWindow } from './plan.mjs';

/** atempo steps whose product is `speed`: ffmpeg 6.0's atempo takes 0.5 to 2 at a time. */
function cutTempoChain(speed) {
  const steps = [];
  let left = speed;
  while (left > 2) {
    steps.push(2);
    left /= 2;
  }
  while (left < 0.5) {
    steps.push(0.5);
    left /= 0.5;
  }
  steps.push(left);
  return steps.map((f) => `atempo=${kitNum(f, 6)}`).join(',');
}

/** The final encode: the kit's master preset with the §4.12 bitrate cap. */
function cutMasterArgs(ctx) {
  return [...ctx.tools.encodeArgs('h264-master'), '-maxrate', '16M', '-bufsize', '32M'];
}

/** Refuses a finished file over the size limit, before it is registered or uploaded. */
function cutCheckSize(ctx, path) {
  const bytes = statSync(path).size;
  if (bytes > CUT_MAX_BYTES) throw ctx.error('output_invalid', `the cut is ${Math.round(bytes / 1048576)} MB, over the ${CUT_MAX_BYTES / 1048576} MB limit`);
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  try {
    const mode = cutModeOf(inputs);
    cutCheckMode(mode, inputs);
    if (inputs.screen != null) {
      const problems = kitScreenProblems(inputs.screen);
      if (problems.length) throw new CutRefusal(`the screen look is refused: ${problems.join('; ')}`);
    }
    if (mode === 'band') return await cutBand(inputs, ctx, manifest);
    if (mode === 'scenes') return await cutScenes(inputs, ctx, manifest);
    if (mode === 'split') return await cutSplit(inputs, ctx, manifest);
    return await cutInserts(inputs, ctx, manifest);
  } catch (err) {
    if (err instanceof CutRefusal || (err && (err.name === 'KitScreenRefusal' || err.name === 'KitPanelError'))) throw ctx.error('bad_input', err.message);
    throw err;
  }
}

// ---- band (1.0.2) ----

async function cutBand(inputs, ctx, manifest) {
  const first = inputs.footage[0];
  const clip = { ...first, video: cutEntryFile(first) };
  if (!clip.video) throw ctx.error('bad_input', 'the first footage entry has no clip file');
  if (clip.video.media !== 'video') throw ctx.error('bad_input', 'band mode lays a video clip; the first footage entry is a still');
  const info = await ctx.tools.probe(inputs.video.path);
  const W = info.width;
  const H = info.height;
  const fps = info.fps || 30;
  const dur = await kitDuration(ctx, inputs.video);
  const band = inputs.band;
  if (band.x + band.width > W || band.y + band.height > H) throw ctx.error('bad_input', `the band ${band.width}x${band.height} at ${band.x},${band.y} is outside the ${W}x${H} video`);
  if (inputs.fit === 'height') throw ctx.error('bad_input', 'band mode fits cover or width');
  cutCheckProjectedSize(dur);
  const length = await kitMediaLength(ctx, clip.video);
  const from = (clip.start_ms ?? 0) / 1000;
  const to = clip.end_ms == null ? length : clip.end_ms / 1000;
  if (!(to > from) || to > length + 0.05) throw ctx.error('bad_input', `the footage window ${kitNum(from, 2)}-${kitNum(to, 2)}s is not inside the ${kitNum(length, 2)}s clip`);
  let speed;
  if (inputs.speed === 'fill' || inputs.speed === undefined) {
    speed = (to - from) / dur;
    const min = inputs.min_speed ?? 1;
    const max = inputs.max_speed ?? 8;
    if (speed < min - 1e-6 || speed > max + 1e-6) {
      throw ctx.error('bad_input', `filling ${kitNum(dur, 2)}s from a ${kitNum(to - from, 2)}s window needs ${kitNum(speed, 2)}x, outside ${min}x to ${max}x`);
    }
  } else {
    speed = inputs.speed;
    if ((to - from) / speed + 0.05 < dur) throw ctx.error('bad_input', `at ${speed}x the ${kitNum(to - from, 2)}s window lasts ${kitNum((to - from) / speed, 2)}s, less than the ${kitNum(dur, 2)}s video`);
  }
  const fit =
    inputs.fit === 'width'
      ? `scale=${band.width}:-2:flags=lanczos,crop=${band.width}:min(ih\\,${band.height}):0:(ih-min(ih\\,${band.height}))/2,pad=${band.width}:${band.height}:0:(oh-ih)/2:color=black`
      : `scale=${band.width}:${band.height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${band.width}:${band.height}`;
  const need = dur * speed + 0.3;
  const graph = [
    `[1:v]setpts=(PTS-STARTPTS)/${kitNum(speed, 6)},fps=${fps},${fit},setsar=1,tpad=stop_mode=clone:stop_duration=0.2,trim=duration=${kitNum(dur)}[band]`,
    `[0:v][band]overlay=${band.x}:${band.y}:eof_action=pass,format=yuv420p[v]`,
  ];
  const map = ['-map', '[v]'];
  if (inputs.audio) {
    const fInfo = await ctx.tools.probe(clip.video.path);
    if (!fInfo.has_audio) throw ctx.error('bad_input', 'audio is on but the footage has no sound');
    graph.push(`[1:a]${cutTempoChain(speed)},atrim=0:${kitNum(dur)},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a]`);
    map.push('-map', '[a]', ...ctx.tools.encodeArgs('aac'));
  } else if (info.has_audio) map.push('-map', '0:a', '-c:a', 'copy');
  const out = join(ctx.workDir, 'footage.mp4');
  await kitFfmpeg(ctx, [
    '-i',
    inputs.video.path,
    '-ss',
    kitNum(from),
    '-t',
    kitNum(Math.min(need, to - from + 0.3)),
    '-i',
    clip.video.path,
    '-filter_complex',
    graph.join(';'),
    ...map,
    ...cutMasterArgs(ctx),
    '-t',
    kitNum(dur),
    out,
  ]);
  cutCheckSize(ctx, out);
  const video = await ctx.file('footage.mp4', 'video');
  ctx.log.info('footage laid into the band', { speed: +speed.toFixed(3), window_s: +(to - from).toFixed(3) });
  return kitCheckOutputs(ctx, manifest, { video, seconds: +dur.toFixed(3), speed: +speed.toFixed(4) });
}

// ---- one beat, rendered full frame ----

/** The plain look's fit of a w x h page into W x H: cover, width (black above and below) or height (black at the sides). */
function cutPlainFit(fit, W, H) {
  if (fit === 'width') return `scale=${W}:-2:flags=lanczos,crop=${W}:min(ih\\,${H}):0:(ih-min(ih\\,${H}))/2,pad=${W}:${H}:0:(oh-ih)/2:color=black`;
  if (fit === 'height') return `scale=-2:${H}:flags=lanczos,crop=min(iw\\,${W}):${H}:(iw-min(iw\\,${W}))/2:0,pad=${W}:${H}:(ow-iw)/2:0:color=black`;
  return `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H}`;
}

/** Masks blurred in the source, then the crop: the plain look's head, in source pixels. */
function cutPlainHead(input, sw, sh, crop, masks) {
  const chains = [];
  let head = `[${input}]format=yuv420p`;
  masks.forEach((m, i) => {
    const x = Math.floor(sw * m[0]);
    const y = Math.floor(sh * m[1]);
    const w = Math.max(2, Math.floor(sw * m[2]) - x);
    const h = Math.max(2, Math.floor(sh * m[3]) - y);
    chains.push(`${head},split=2[pm${i}a][pm${i}b]`);
    chains.push(`[pm${i}b]crop=${w}:${h}:${x}:${y},gblur=sigma=14[pm${i}c]`);
    head = `[pm${i}a][pm${i}c]overlay=${x}:${y}`;
  });
  if (crop) {
    const cx = Math.floor(sw * crop[0]);
    const cy = Math.floor(sh * crop[1]);
    head += `,crop=${Math.max(2, Math.floor(sw * crop[2]) - cx)}:${Math.max(2, Math.floor(sh * crop[3]) - cy)}:${cx}:${cy}`;
  }
  return { chains, head };
}

/**
 * Renders one beat to an intermediate W x H clip `seconds` long (plus `extraS`
 * for the dissolve into the next beat). `beat.kind` is window, still or lead.
 */
async function cutRenderBeat(ctx, beat, { W, H, fps, look, screen, fit, lookIndex, seconds, extraS, name, lead }) {
  const len = seconds + extraS;
  const args = [];
  let pre;
  let sourceFile;
  if (beat.kind === 'lead') {
    args.push('-i', lead.path);
    const graph = `[0:v]setpts=PTS-STARTPTS,fps=${fps},${cutPlainFit('cover', W, H)},setsar=1,tpad=stop_mode=clone:stop_duration=${kitNum(len + 0.2)},trim=duration=${kitNum(len)},format=yuv420p[v]`;
    return cutEncodeBeat(ctx, args, graph, name);
  }
  const entry = beat.entry || {};
  if (beat.kind === 'window') {
    sourceFile = cutEntryFile(entry);
    args.push('-ss', kitNum(beat.from), '-t', kitNum(len * beat.speed + 0.5), '-i', sourceFile.path);
    pre = `[0:v]setpts=(PTS-STARTPTS)/${kitNum(beat.speed, 6)},fps=${fps},tpad=stop_mode=clone:stop_duration=${kitNum(len + 0.2)}[src]`;
  } else {
    sourceFile = beat.image || cutEntryFile(entry);
    args.push('-loop', '1', '-framerate', String(fps), '-t', kitNum(len + 0.2), '-i', sourceFile.path);
    pre = `[0:v]setpts=PTS-STARTPTS,fps=${fps}[src]`;
  }
  const info = await ctx.tools.probe(sourceFile.path);
  const sw = info.width;
  const sh = info.height;
  if (!Number.isInteger(sw) || !Number.isInteger(sh)) throw ctx.error('bad_input', `scene "${beat.scene.id}": the footage has no picture size`);
  const crop = entry.crop || null;
  const masks = entry.mask || [];
  const boxProblems = [...(crop ? kitScreenBoxProblems(crop, 'crop') : []), ...masks.flatMap((m, i) => kitScreenBoxProblems(m, `mask[${i}]`))];
  if (boxProblems.length) throw ctx.error('bad_input', `scene "${beat.scene.id}": ${boxProblems.join('; ')}`);
  const entryFit = entry.fit || fit;
  let body;
  if (look === 'screen') {
    const settings = { ...(screen || {}) };
    if (entryFit === 'width' || entryFit === 'height') settings.fit = entryFit;
    const g = kitScreenGraph({ input: 'src', output: 'look', id: 'sl', box: { width: W, height: H, fps }, source: { width: sw, height: sh }, screen: settings, crop, masks, index: lookIndex, seed: lookIndex });
    body = `${g.graph};[look]trim=duration=${kitNum(len)},setpts=PTS-STARTPTS,format=yuv420p,setsar=1[v]`;
  } else {
    const { chains, head } = cutPlainHead('src', sw, sh, crop, masks);
    body = [...chains, `${head},${cutPlainFit(entryFit || 'cover', W, H)},setsar=1,trim=duration=${kitNum(len)},setpts=PTS-STARTPTS,format=yuv420p[v]`].join(';');
  }
  return cutEncodeBeat(ctx, args, `${pre};${body}`, name);
}

async function cutEncodeBeat(ctx, args, graph, name) {
  const path = join(ctx.tmpDir, `${name}.mp4`);
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph, '-map', '[v]', '-an', ...ctx.tools.encodeArgs('h264-intermediate'), path]);
  return path;
}

/** The clip lengths of every window beat, by scene index. */
async function cutWindowLengths(ctx, sources) {
  const lengths = new Map();
  for (const s of sources) if (s.kind === 'window') lengths.set(s.index, await kitMediaLength(ctx, cutEntryFile(s.entry)));
  return lengths;
}

function cutWindowsOut(beats) {
  return beats
    .filter((b) => b.kind === 'window' || b.kind === 'still' || b.kind === 'grid')
    .map((b) => ({ scene_id: b.scene.id, start_s: +b.start_s.toFixed(3), end_s: +b.end_s.toFixed(3), speed: +b.speed.toFixed(4) }));
}

// ---- scenes ----

async function cutScenes(inputs, ctx, manifest) {
  const W = inputs.width ?? 1080;
  const H = inputs.height ?? 1920;
  const fps = inputs.fps ?? 30;
  if (W % 2 || H % 2) throw ctx.error('bad_input', `the frame ${W}x${H} must have even sides`);
  if (inputs.audio) throw ctx.error('bad_input', 'scenes mode makes a silent cut');
  const lead = inputs.lead ? inputs.lead.video : null;
  const sources = cutSceneSources(inputs.scenes, inputs.footage, { lead, need: 'all' });
  if (lead && !sources.some((s) => s.kind === 'lead')) ctx.log.warn('the lead clip is not used: the first scene has its own footage or image');
  const dissolve = inputs.transition?.dissolve_frames ?? 0;
  const { beats, seconds } = cutPlanScenes(sources, {
    lengths: await cutWindowLengths(ctx, sources),
    leadS: lead ? await kitDuration(ctx, lead) : 0,
    fps,
    scene_seconds: inputs.scene_seconds,
    still_seconds: inputs.still_seconds,
    speed: inputs.speed ?? 'fill',
    min_speed: inputs.min_speed ?? 0.5,
    max_speed: inputs.max_speed ?? 2,
    dissolve_frames: dissolve,
  });
  cutCheckOrder(beats, inputs.order ?? 'forward');
  cutCheckProjectedSize(seconds);
  const extraS = dissolve / fps;
  const paths = [];
  let lookIndex = 0;
  for (const [i, b] of beats.entries()) {
    const usesLook = b.kind !== 'lead';
    paths.push(
      await cutRenderBeat(ctx, b, {
        W,
        H,
        fps,
        look: inputs.look ?? 'plain',
        screen: inputs.screen,
        fit: inputs.fit,
        lookIndex: usesLook ? lookIndex : 0,
        seconds: b.seconds,
        extraS: i + 1 < beats.length ? extraS : 0,
        name: `beat-${i + 1}`,
        lead,
      }),
    );
    if (usesLook) lookIndex++;
    ctx.progress({ done: i + 1, total: beats.length + 1 });
  }
  const args = paths.flatMap((p) => ['-i', p]);
  const norm = paths.map((_, i) => `[${i}:v]fps=${fps},settb=AVTB,setsar=1,format=yuv420p[n${i}]`);
  let graph;
  if (paths.length === 1) graph = [...norm, `[n0]null[v]`];
  else if (dissolve > 0) {
    graph = [...norm];
    let prev = 'n0';
    for (let i = 1; i < paths.length; i++) {
      const outLabel = i + 1 < paths.length ? `x${i}` : 'v';
      graph.push(`[${prev}][n${i}]xfade=transition=fade:duration=${kitNum(extraS)}:offset=${kitNum(beats[i].start_s)}[${outLabel}]`);
      prev = outLabel;
    }
  } else graph = [...norm, `${paths.map((_, i) => `[n${i}]`).join('')}concat=n=${paths.length}:v=1:a=0[v]`];
  const out = join(ctx.workDir, 'scenes.mp4');
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph.join(';'), '-map', '[v]', '-an', ...cutMasterArgs(ctx), '-t', kitNum(seconds), out]);
  cutCheckSize(ctx, out);
  const video = await ctx.file('scenes.mp4', 'video');
  const timeline = {
    duration_s: +seconds.toFixed(3),
    width: W,
    height: H,
    fps,
    scenes: beats.map((b) => ({ id: String(b.scene.id), start_s: +b.start_s.toFixed(3), end_s: +b.end_s.toFixed(3) })),
    speech: [],
  };
  ctx.log.info('scenes cut', { beats: beats.length, seconds: +seconds.toFixed(3), dissolve_frames: dissolve });
  return kitCheckOutputs(ctx, manifest, { video, seconds: +seconds.toFixed(3), timeline, windows: cutWindowsOut(beats) });
}

// ---- inserts ----

async function cutInserts(inputs, ctx, manifest) {
  const info = await ctx.tools.probe(inputs.video.path);
  const W = info.width;
  const H = info.height;
  const fps = info.fps || inputs.timeline.fps || 30;
  if (W % 2 || H % 2) throw ctx.error('bad_input', `the talking track ${W}x${H} must have even sides`);
  const dur = await kitDuration(ctx, inputs.video);
  cutCheckProjectedSize(dur);
  const gridLayout = inputs.grid ? inputs.grid.layout ?? '2x2' : null;
  const sources = cutSceneSources(inputs.scenes, inputs.footage, { need: 'any', grid: gridLayout }).filter((s) => s.kind === 'window' || s.kind === 'still' || s.kind === 'grid');
  if (!sources.length) throw ctx.error('bad_input', 'no scene has footage or an image to insert');
  if (gridLayout && !sources.some((s) => s.kind === 'grid')) ctx.log.info('grid is set but no scene is tagged extra.shot "grid"');
  const spans = new Map(inputs.timeline.scenes.map((s) => [String(s.id), s]));
  const joins = (inputs.joins || []).map((t) => t.start_s).filter((s) => s > 0.05);
  const slots = cutPlaceInserts(sources, spans, { joins, duration: dur, fps });
  const lengths = await cutWindowLengths(ctx, slots);
  const opts = { speed: inputs.speed ?? 'fill', min_speed: inputs.min_speed ?? 0.5, max_speed: inputs.max_speed ?? 2 };
  const beats = [];
  for (const s of slots) {
    const seconds = s.end_s - s.start_s;
    if (s.kind === 'grid') beats.push({ ...s, seconds, speed: 1, cells: await cutGridCells(ctx, s, seconds, opts.min_speed) });
    else if (s.kind !== 'window') beats.push({ ...s, seconds, speed: 1 });
    else {
      const { from, to } = cutWindow(s.entry, lengths.get(s.index));
      const speed = cutSpeedFor(to - from, seconds, opts, `the insert for scene "${s.scene.id}"`);
      beats.push({ ...s, seconds, speed, from, to: from + seconds * speed });
    }
  }
  cutCheckOrder(cutOrderBeats(beats), inputs.order ?? 'forward');
  const paths = [];
  for (const [i, b] of beats.entries()) {
    const name = `insert-${i + 1}`;
    if (b.kind === 'grid') paths.push(await cutRenderGrid(ctx, b, { W, H, fps, still_zoom: inputs.grid.still_zoom ?? 0.04, name }));
    else paths.push(await cutRenderBeat(ctx, b, { W, H, fps, look: inputs.look ?? 'plain', screen: inputs.screen, fit: inputs.fit, lookIndex: i, seconds: b.seconds, extraS: 0, name }));
    if (b.stretched_s > 0) ctx.log.info('insert stretched over a take join', { scene_id: b.scene.id, stretched_s: +b.stretched_s.toFixed(3) });
    ctx.progress({ done: i + 1, total: beats.length + 1 });
  }
  const video = await cutOverlayCompose(ctx, inputs, { info, W, H, fps, dur, beats, paths, name: 'inserts.mp4' });
  const timeline = { ...inputs.timeline };
  ctx.log.info('inserts laid over the talking track', { inserts: beats.length, joins: joins.length });
  return kitCheckOutputs(ctx, manifest, { video, seconds: +dur.toFixed(3), timeline, windows: cutWindowsOut(beats) });
}

/** Window beats (and every clip cell of a grid) for the reuse and order checks. */
function cutOrderBeats(beats) {
  const out = [];
  for (const b of beats) {
    if (b.kind === 'grid') for (const c of b.cells) if (c.kind === 'window') out.push({ kind: 'window', entry: c.entry, from: c.from, to: c.to, scene: b.scene });
    if (b.kind === 'window') out.push(b);
  }
  return out;
}

/** A grid beat's cells: each clip's window and speed (1x, or slowed to fill), each picture held. */
async function cutGridCells(ctx, beat, seconds, minSpeed) {
  const cells = [];
  for (const [i, entry] of beat.entries.entries()) {
    if (cutEntryIsStill(entry)) {
      cells.push({ kind: 'still', entry });
      continue;
    }
    const { from, to } = cutWindow(entry, await kitMediaLength(ctx, cutEntryFile(entry)));
    const speed = cutGridCellSpeed(to - from, seconds, minSpeed, `grid scene "${beat.scene.id}" cell ${i + 1}`);
    cells.push({ kind: 'window', entry, from, to: Math.min(to, from + seconds * speed), speed });
  }
  return cells;
}

/**
 * A 2x2 grid beat rendered to W x H: each cell cover-cropped (after the
 * entry's mask and crop), clips from their window start, pictures pushed in by
 * still_zoom across the beat, joined with xstack.
 */
async function cutRenderGrid(ctx, beat, { W, H, fps, still_zoom, name }) {
  const cw = 2 * Math.floor(W / 4);
  const ch = 2 * Math.floor(H / 4);
  const len = beat.seconds;
  const args = [];
  const graph = [];
  for (const [i, c] of beat.cells.entries()) {
    const f = cutEntryFile(c.entry);
    if (c.kind === 'window') {
      args.push('-ss', kitNum(c.from), '-t', kitNum(len * c.speed + 0.5), '-i', f.path);
      graph.push(`[${i}:v]setpts=(PTS-STARTPTS)/${kitNum(c.speed, 6)},fps=${fps},tpad=stop_mode=clone:stop_duration=${kitNum(len + 0.2)}[g${i}s]`);
    } else {
      args.push('-loop', '1', '-framerate', String(fps), '-t', kitNum(len + 0.2), '-i', f.path);
      graph.push(`[${i}:v]setpts=PTS-STARTPTS,fps=${fps}[g${i}s]`);
    }
    const sz = await ctx.tools.probe(f.path);
    if (!Number.isInteger(sz.width) || !Number.isInteger(sz.height)) throw ctx.error('bad_input', `grid scene "${beat.scene.id}" cell ${i + 1} has no picture size`);
    const crop = c.entry.crop || null;
    const masks = c.entry.mask || [];
    const problems = [...(crop ? kitScreenBoxProblems(crop, 'crop') : []), ...masks.flatMap((m, k) => kitScreenBoxProblems(m, `mask[${k}]`))];
    if (problems.length) throw ctx.error('bad_input', `grid scene "${beat.scene.id}" cell ${i + 1}: ${problems.join('; ')}`);
    const { chains, head } = cutPlainHead(`g${i}s`, sz.width, sz.height, crop, masks);
    graph.push(...chains, `${head}[g${i}h]`);
    graph.push(...kitPanelCover({ src: `g${i}h`, out: `g${i}c`, w: cw, h: ch, head: 0.5 }));
    if (c.kind === 'still' && still_zoom > 0) graph.push(`[g${i}c]${cutZoomIn(still_zoom, len, cw, ch, fps)}[g${i}z]`);
    else graph.push(`[g${i}c]null[g${i}z]`);
    graph.push(`[g${i}z]trim=duration=${kitNum(len)},setpts=PTS-STARTPTS,format=yuv420p,setsar=1[g${i}]`);
  }
  graph.push(`[g0][g1][g2][g3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p[v]`);
  return cutEncodeBeat(ctx, args, graph.join(';'), name);
}

/** A slow push from 1x to 1 + amount over `len` seconds, centred, at w x h (zoompan, one frame out per frame in). */
function cutZoomIn(amount, len, w, h, fps) {
  return `zoompan=z='1+${kitNum(amount)}*min(1,in_time/${kitNum(Math.max(len, 1 / fps))})':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=${w}x${h}:fps=${fps}`;
}

/**
 * The talking track's own chain, ending in [b0]: the push-in on every
 * full-frame creator stretch of push_in.min_hold_s or more, then the first
 * scene's look (a blur that fades out over its last 0.3 s, or a flat card).
 * Without either it is the 1.1.0 chain.
 */
function cutBaseChain(ctx, inputs, { W, H, fps, dur, beats }) {
  let chain = `[0:v]fps=${fps},setsar=1`;
  if (inputs.push_in) {
    const minHold = inputs.push_in.min_hold_s ?? 3;
    const amount = inputs.push_in.amount ?? 0.05;
    const runs = cutCreatorRuns(beats, dur, fps).filter((r) => r.end_s - r.start_s >= minHold - 1e-6);
    if (runs.length) {
      const terms = runs.map((r) => `between(in_time,${kitNum(r.start_s, 4)},${kitNum(r.end_s, 4)})*(in_time-${kitNum(r.start_s, 4)})/${kitNum(r.end_s - r.start_s, 4)}`);
      chain += `,zoompan=z='1+${kitNum(amount)}*(${terms.join('+')})':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=${W}x${H}:fps=${fps}`;
    }
  }
  const look = inputs.first_scene_look ?? 'none';
  if (look === 'none') return [`${chain},format=yuv420p[b0]`];
  const first = inputs.scenes[0];
  const span = inputs.timeline.scenes.find((s) => String(s.id) === String(first.id));
  const end = span ? Math.min(dur, span.end_s) : 0;
  if (!(end >= 1 / fps)) {
    ctx.log.warn('first_scene_look is skipped: the first scene has no time in the talking track', { scene_id: String(first.id), look });
    return [`${chain},format=yuv420p[b0]`];
  }
  if (beats.some((b) => String(b.scene.id) === String(first.id))) {
    ctx.log.warn('first_scene_look is not seen: the first scene shows footage', { scene_id: String(first.id), look });
    return [`${chain},format=yuv420p[b0]`];
  }
  if (look === 'card') {
    const hex = (inputs.card_color ?? '#111111').slice(1).toUpperCase();
    return [`${chain},drawbox=x=0:y=0:w=iw:h=ih:color=0x${hex}@1:t=fill:enable='lt(t,${kitNum(end, 4)})',format=yuv420p[b0]`];
  }
  const r = Math.max(1, Math.round((20 * Math.min(W, H)) / 1080));
  const fade = Math.min(0.3, end);
  return [
    `${chain},format=yuv420p,split=2[hk_a][hk_b]`,
    `[hk_b]trim=end=${kitNum(end, 4)},setpts=PTS-STARTPTS,boxblur=${r}:2,eq=brightness=-0.10:saturation=0.85,format=yuva420p,fade=t=out:st=${kitNum(end - fade, 4)}:d=${kitNum(fade, 4)}:alpha=1[hk_g]`,
    `[hk_a][hk_g]overlay=0:0:eof_action=pass,format=yuv420p[b0]`,
  ];
}

/**
 * The final encode for inserts and split: the talking track (with its push-in
 * and first-scene look) and each rendered beat laid over it at its slot, the
 * track's sound copied.
 */
async function cutOverlayCompose(ctx, inputs, { info, W, H, fps, dur, beats, paths, name }) {
  const args = ['-i', inputs.video.path, ...paths.flatMap((p) => ['-i', p])];
  const graph = cutBaseChain(ctx, inputs, { W, H, fps, dur, beats });
  beats.forEach((b, i) => {
    graph.push(`[${i + 1}:v]fps=${fps},setsar=1,format=yuv420p,setpts=PTS-STARTPTS+${kitNum(b.start_s)}/TB[i${i}]`);
    const outLabel = i + 1 < beats.length ? `b${i + 1}` : 'v';
    graph.push(`[b${i}][i${i}]overlay=0:0:eof_action=pass:enable='between(t,${kitNum(b.start_s)},${kitNum(b.end_s - 0.5 / fps)})'[${outLabel}]`);
  });
  if (!beats.length) graph.push('[b0]null[v]');
  const map = ['-map', '[v]'];
  if (info.has_audio) map.push('-map', '0:a', '-c:a', 'copy');
  const out = join(ctx.workDir, name);
  await kitFfmpeg(ctx, [...args, '-filter_complex', graph.join(';'), ...map, ...cutMasterArgs(ctx), '-t', kitNum(dur), out]);
  cutCheckSize(ctx, out);
  return ctx.file(name, 'video');
}

// ---- split ----

async function cutSplit(inputs, ctx, manifest) {
  const info = await ctx.tools.probe(inputs.video.path);
  const W = info.width;
  const H = info.height;
  const fps = info.fps || inputs.timeline.fps || 30;
  if (W % 2 || H % 2) throw ctx.error('bad_input', `the talking track ${W}x${H} must have even sides`);
  const dur = await kitDuration(ctx, inputs.video);
  cutCheckProjectedSize(dur);
  const layout = inputs.layout || {};
  const side = layout.side ?? 'bottom';
  const rows = kitPanelSeamRows(H, layout.seam ?? 0.4);
  const zone = side === 'bottom' ? { footage_h: rows.top_h, creator_y: rows.top_h, creator_h: rows.bottom_h } : { footage_h: rows.bottom_h, creator_y: 0, creator_h: rows.top_h };
  const sources = cutSceneSources(inputs.scenes, inputs.footage, { need: 'any' }).filter((s) => s.kind === 'window' || s.kind === 'still');
  const slots = cutSplitSlots(sources, inputs.timeline.scenes, { duration: dur, fps });
  const lengths = await cutWindowLengths(ctx, slots);
  const opts = { speed: inputs.speed ?? 'fill', min_speed: inputs.min_speed ?? 0.5, max_speed: inputs.max_speed ?? 2 };
  const beats = slots.map((s) => {
    const seconds = s.end_s - s.start_s;
    if (s.kind !== 'window') return { ...s, seconds, speed: 1 };
    const { from, to } = cutWindow(s.entry, lengths.get(s.index));
    const speed = cutSpeedFor(to - from, seconds, opts, `the footage for scene "${s.scene.id}"`);
    return { ...s, seconds, speed, from, to: from + seconds * speed };
  });
  cutCheckOrder(beats, inputs.order ?? 'forward');
  const paths = [];
  for (const [i, b] of beats.entries()) {
    paths.push(await cutRenderSplit(ctx, b, { W, H, fps, rows, side, zone, layout, look: inputs.look ?? 'plain', screen: inputs.screen, fit: inputs.fit, lookIndex: i, track: inputs.video, name: `split-${i + 1}` }));
    ctx.progress({ done: i + 1, total: beats.length + 1 });
  }
  const video = await cutOverlayCompose(ctx, inputs, { info, W, H, fps, dur, beats, paths, name: 'split.mp4' });
  const captions = { use: 'captions', x: 0, y: zone.creator_y, w: W, h: zone.creator_h };
  const timeline = { ...inputs.timeline, safe_zones: [...(inputs.timeline.safe_zones || []).filter((z) => z.use !== 'captions'), captions] };
  ctx.log.info('split cut over the talking track', { split_beats: beats.length, seam_y: rows.seam_y, side });
  return kitCheckOutputs(ctx, manifest, { video, seconds: +dur.toFixed(3), timeline, windows: cutWindowsOut(beats) });
}

/** The average colour of a footage picture's top-left corner (inside its crop), as #RRGGBB: layout.bg "auto". */
async function cutCornerColor(ctx, file, { at, still, crop, name }) {
  const [x0, y0, x1, y1] = crop || [0, 0, 1, 1];
  const out = join(ctx.tmpDir, `${name}-corner.rgb`);
  const vf = `crop=trunc(iw*${kitNum((x1 - x0) / 16, 6)})+2:trunc(ih*${kitNum((y1 - y0) / 16, 6)})+2:trunc(iw*${kitNum(x0, 6)}):trunc(ih*${kitNum(y0, 6)}),scale=1:1:flags=area,format=rgb24`;
  await kitFfmpeg(ctx, [...(still ? [] : ['-ss', kitNum(at)]), '-i', file.path, '-frames:v', '1', '-vf', vf, '-f', 'rawvideo', out]);
  const px = readFileSync(out);
  if (px.length < 3) {
    ctx.log.warn('could not sample the footage corner; using black behind it', { file: name });
    return '#000000';
  }
  return `#${[px[0], px[1], px[2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/**
 * One split beat rendered to W x H: the scene's footage window (or image,
 * pushed in by layout.photo_zoom) in the footage zone, the talking track's
 * same seconds cover-cropped into the creator zone (head, zoom), stacked on
 * the seam, with the divider bar when one is set.
 */
async function cutRenderSplit(ctx, beat, { W, H, fps, rows, side, zone, layout, look, screen, fit, lookIndex, track, name }) {
  const len = beat.seconds;
  const entry = beat.entry || {};
  const source = beat.kind === 'window' ? cutEntryFile(entry) : beat.image || cutEntryFile(entry);
  const args = [];
  const graph = [];
  if (beat.kind === 'window') {
    args.push('-ss', kitNum(beat.from), '-t', kitNum(len * beat.speed + 0.5), '-i', source.path);
    graph.push(`[0:v]setpts=(PTS-STARTPTS)/${kitNum(beat.speed, 6)},fps=${fps},tpad=stop_mode=clone:stop_duration=${kitNum(len + 0.2)}[src]`);
  } else {
    args.push('-loop', '1', '-framerate', String(fps), '-t', kitNum(len + 0.2), '-i', source.path);
    graph.push(`[0:v]setpts=PTS-STARTPTS,fps=${fps}[src]`);
  }
  args.push('-ss', kitNum(beat.start_s), '-t', kitNum(len + 0.5), '-i', track.path);
  const info = await ctx.tools.probe(source.path);
  const sw = info.width;
  const sh = info.height;
  if (!Number.isInteger(sw) || !Number.isInteger(sh)) throw ctx.error('bad_input', `scene "${beat.scene.id}": the footage has no picture size`);
  const crop = entry.crop || null;
  const masks = entry.mask || [];
  const boxProblems = [...(crop ? kitScreenBoxProblems(crop, 'crop') : []), ...masks.flatMap((m, i) => kitScreenBoxProblems(m, `mask[${i}]`))];
  if (boxProblems.length) throw ctx.error('bad_input', `scene "${beat.scene.id}": ${boxProblems.join('; ')}`);
  const fh = zone.footage_h;
  const entryFit = entry.fit || fit || 'width';
  if (look === 'screen') {
    const settings = { ...(screen || {}) };
    if (entryFit === 'width' || entryFit === 'height') settings.fit = entryFit;
    const g = kitScreenGraph({ input: 'src', output: 'fz', id: 'sl', box: { width: W, height: fh, fps }, source: { width: sw, height: sh }, screen: settings, crop, masks, index: lookIndex, seed: lookIndex });
    graph.push(g.graph);
  } else {
    const { chains, head } = cutPlainHead('src', sw, sh, crop, masks);
    graph.push(...chains, `${head}[ph]`);
    if (entryFit === 'cover') graph.push(...kitPanelCover({ src: 'ph', out: 'fz', w: W, h: fh, head: 0.5 }));
    else {
      let bg = layout.bg ?? 'auto';
      if (bg === 'auto') bg = await cutCornerColor(ctx, source, { at: beat.from ?? 0, still: beat.kind !== 'window', crop, name });
      graph.push(...kitPanelFit({ src: 'ph', out: 'fz', w: W, h: fh, bg }));
    }
  }
  const photoZoom = layout.photo_zoom ?? 0.06;
  if (beat.kind === 'still' && photoZoom > 0) graph.push(`[fz]${cutZoomIn(photoZoom, len, W, fh, fps)}[fk]`);
  else graph.push('[fz]null[fk]');
  graph.push(`[fk]trim=duration=${kitNum(len)},setpts=PTS-STARTPTS,format=yuv420p,setsar=1[fp]`);
  graph.push(`[1:v]setpts=PTS-STARTPTS,fps=${fps},tpad=stop_mode=clone:stop_duration=${kitNum(len + 0.5)}[ct]`);
  graph.push(...kitPanelCover({ src: 'ct', out: 'cp', w: W, h: zone.creator_h, head: layout.head ?? 0.3, zoom: layout.zoom ?? 1 }));
  graph.push(...kitPanelVstack({ top: side === 'bottom' ? 'fp' : 'cp', bottom: side === 'bottom' ? 'cp' : 'fp', out: 'st', width: W, height: H, top_h: rows.top_h }));
  const divider = layout.divider ? `${kitPanelDivider({ seam_y: rows.seam_y, px: layout.divider_px ?? 4, color: layout.divider })},` : '';
  graph.push(`[st]${divider}trim=duration=${kitNum(len)},setpts=PTS-STARTPTS,format=yuv420p[v]`);
  return cutEncodeBeat(ctx, args, graph.join(';'), name);
}
