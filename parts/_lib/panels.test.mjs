import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  KitPanelError,
  kitPanelCover,
  kitPanelCrop,
  kitPanelDim,
  kitPanelDivider,
  kitPanelEnable,
  kitPanelEven,
  kitPanelFit,
  kitPanelJoin,
  kitPanelJoinLengths,
  kitPanelRect,
  kitPanelSeamRows,
  kitPanelSplit,
  kitPanelVstack,
} from './panels.mjs';
import { framePixels, hasFfmpeg, probe, run } from '../_tools/kit-harness.mjs';

const refused = (fn, re) =>
  assert.throws(fn, (e) => e instanceof KitPanelError && e.code === 'bad_input' && (!re || re.test(e.message)));

test('every top-level name is kitPanel-prefixed, so bundled parts never clash', async () => {
  const mod = await import('./panels.mjs');
  for (const name of Object.keys(mod)) assert.match(name, /^(kitPanel|KitPanel)/, name);
  // bundle.mjs inlines _lib files into one scope: private top-level names count too.
  const src = readFileSync(new URL('./panels.mjs', import.meta.url), 'utf8');
  const names = [...src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  assert.ok(names.length > 20, `found ${names.length} top-level names`);
  for (const name of names) assert.match(name, /^(kitPanel|KitPanel)/, name);
});

test('even sizes round to the nearest even number and never go below 2', () => {
  assert.equal(kitPanelEven(767), 768);
  assert.equal(kitPanelEven(765), 766);
  assert.equal(kitPanelEven(0.4), 2);
  assert.equal(kitPanelEven(1242.0), 1242);
});

test('a ratio seam splits the usable height; the gap sits under the top panel', () => {
  assert.deepEqual(kitPanelSeamRows(1920, 0.5), { top_h: 960, gap_px: 0, bottom_h: 960, seam_y: 960 });
  // The podcast's seams: usable = H - gap, top = even(usable * seam).
  assert.deepEqual(kitPanelSeamRows(1920, 0.62, { gap_px: 6 }), { top_h: 1186, gap_px: 6, bottom_h: 728, seam_y: 1189 });
  const r = kitPanelSeamRows(1920, 0.37, { gap_px: 6 });
  assert.equal(r.top_h + r.gap_px + r.bottom_h, 1920);
  assert.equal(r.top_h % 2, 0);
  assert.equal(r.bottom_h % 2, 0);
});

test('a pixel seam puts the seam on that row (split-screen seam 768)', () => {
  assert.deepEqual(kitPanelSeamRows(1920, 768), { top_h: 768, gap_px: 0, bottom_h: 1152, seam_y: 768 });
  assert.deepEqual(kitPanelSeamRows(1920, 768, { gap_px: 4 }), { top_h: 766, gap_px: 4, bottom_h: 1150, seam_y: 768 });
  assert.deepEqual(kitPanelSeamRows(1920, 769, { gap_px: 2 }), { top_h: 768, gap_px: 2, bottom_h: 1150, seam_y: 769 });
});

test('a pixel seam is honoured exactly or refused, never moved to a nearby row', () => {
  refused(() => kitPanelSeamRows(1920, 769), /odd top panel/);
  refused(() => kitPanelSeamRows(1920, 768, { gap_px: 2 }), /odd top panel/);
  refused(() => kitPanelSeamRows(1920, 1), /odd top panel/);
  refused(() => kitPanelSeamRows(1920, 2, { gap_px: 4 }), /under 2 px/);
});

test('a seam that leaves no panel, a fractional pixel seam or an odd gap is refused', () => {
  refused(() => kitPanelSeamRows(1920, 0), /seam/);
  refused(() => kitPanelSeamRows(1920, -0.2), /seam/);
  refused(() => kitPanelSeamRows(1920, 0.0005), /under 2 px/);
  refused(() => kitPanelSeamRows(1920, 1920), /outside/);
  refused(() => kitPanelSeamRows(1920, 768.5), /whole number/);
  refused(() => kitPanelSeamRows(1920, 0.5, { gap_px: 3 }), /gap_px/);
  refused(() => kitPanelSeamRows(1919, 0.5), /height/);
  refused(() => kitPanelSeamRows(1920, Number.NaN), /seam/);
});

test('a crop rect reads {x,y,w,h} or a box, and is refused when it leaves the frame', () => {
  assert.deepEqual(kitPanelRect([0.1, 0.2, 0.6, 0.9]), { x: 0.1, y: 0.2, w: 0.5, h: 0.7 });
  assert.deepEqual(kitPanelRect({ x: 0.25, w: 0.5 }), { x: 0.25, y: 0, w: 0.5, h: 1 });
  refused(() => kitPanelRect({ x: 0.6, y: 0, w: 0.5, h: 1 }), /leaves the frame/);
  refused(() => kitPanelRect([0.5, 0.5, 0.4, 0.9]), /empty/);
  refused(() => kitPanelRect([0, 0, 1]), /x0, y0, x1, y1/);
  refused(() => kitPanelRect({ x: '0.1' }), /crop x/);
  refused(() => kitPanelRect('wide'), /crop rect/);
});

test('a crop filter has even terms, and a whole-frame rect is no filter at all', () => {
  assert.equal(kitPanelCrop(null), '');
  assert.equal(kitPanelCrop({ x: 0, y: 0, w: 1, h: 1 }), '');
  assert.equal(kitPanelCrop({ x: 0.18, y: 0.05, w: 0.5, h: 0.62 }), 'crop=2*floor(iw*0.5/2):2*floor(ih*0.62/2):2*floor(iw*0.18/2):2*floor(ih*0.05/2)');
});

test('a cover crop keeps the head at its row and reads the real source size', () => {
  const [chain] = kitPanelCover({ src: '1:v', out: 'cz', w: 1080, h: 1152, head: 0.3, zoom: 1.15 });
  // compose-creator-layer compose.py: scale to cover w*zoom x h*zoom, crop w x h, crop top at head.
  assert.equal(chain, '[1:v]scale=1242:1324:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1152:(iw-1080)*0.5:(ih-1152)*0.3,setsar=1[cz]');
  const [reframed] = kitPanelCover({ src: 'r0', out: 'top0', w: 1080, h: 1186, head: 0.25, crop: { x: 0.2, y: 0, w: 0.5, h: 1 } });
  assert.match(reframed, /^\[r0\]crop=2\*floor\(iw\*0\.5\/2\):2\*floor\(ih\*1\/2\):2\*floor\(iw\*0\.2\/2\):2\*floor\(ih\*0\/2\),scale=1080:1186:/);
});

test('cover refuses a zoom outside 1-2, a head outside 0-1, odd sizes and bad labels', () => {
  refused(() => kitPanelCover({ src: 'a', out: 'b', w: 1080, h: 960, zoom: 2.5 }), /zoom/);
  refused(() => kitPanelCover({ src: 'a', out: 'b', w: 1080, h: 960, zoom: 0.9 }), /zoom/);
  refused(() => kitPanelCover({ src: 'a', out: 'b', w: 1080, h: 960, head: 1.2 }), /head/);
  refused(() => kitPanelCover({ src: 'a', out: 'b', w: 1081, h: 960 }), /^w must be/);
  refused(() => kitPanelCover({ src: 'a];[evil', out: 'b', w: 1080, h: 960 }), /pad label/);
});

test('fit keeps the whole picture on a colour or a blurred letterbox', () => {
  const [hex] = kitPanelFit({ src: '2:v', out: 'prod', w: 1080, h: 768, bg: '#1a1a1a' });
  assert.equal(hex, '[2:v]scale=1080:768:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos,pad=1080:768:(ow-iw)/2:(oh-ih)/2:0x1A1A1A,setsar=1[prod]');
  const blur = kitPanelFit({ src: '2:v', out: 'prod', w: 1080, h: 768, bg: 'blur', crop: [0, 0.1, 1, 0.9] });
  assert.equal(blur.length, 4);
  assert.match(blur[0], /^\[2:v\]crop=.*,split=2\[prod_bgsrc\]\[prod_fgsrc\]$/);
  assert.match(blur[1], /gblur=sigma=30/);
  assert.match(blur[3], /overlay=\(W-w\)\/2:\(H-h\)\/2,setsar=1\[prod\]$/);
  refused(() => kitPanelFit({ src: 'a', out: 'b', w: 1080, h: 768, bg: 'auto' }), /#RRGGBB/);
});

test('the listener dim pulls saturation and brightness down; 1 leaves the picture alone', () => {
  assert.deepEqual(kitPanelDim({ src: 'b0', out: 'b1', dim: 0.62 }), ['[b0]eq=saturation=0.62:brightness=-0.095[b1]']);
  assert.deepEqual(kitPanelDim({ src: 'b0', out: 'b1', dim: 1 }), ['[b0]null[b1]']);
  refused(() => kitPanelDim({ src: 'b0', out: 'b1', dim: 1.4 }), /dim/);
});

test('vstack pads the gap under the top panel and pins the frame size', () => {
  const chains = kitPanelVstack({ top: 't', bottom: 'b', out: 'v0', width: 1080, height: 1920, top_h: 1186, gap_px: 6, gap_color: '#ffffff' });
  assert.deepEqual(chains, [
    '[t]pad=1080:1192:0:0:0xFFFFFF[v0_topg]',
    "[v0_topg][b]vstack=inputs=2:shortest=1,pad=w=1080:h='max(ih,1920)':x=0:y=0:color=black,crop=1080:1920:0:0,setsar=1[v0]",
  ]);
  assert.equal(kitPanelVstack({ top: 't', bottom: 'b', out: 'v0', width: 1080, height: 1920, top_h: 960 }).length, 1);
  refused(() => kitPanelVstack({ top: 't', bottom: 'b', out: 'v0', width: 1080, height: 1920, top_h: 1918, gap_px: 2 }), /no bottom panel/);
});

test('a split sizes each source by its own look and returns the seam rows', () => {
  const { filters, rows } = kitPanelSplit({
    top: 'spk',
    bottom: 'lst',
    out: 'cut3',
    width: 1080,
    height: 1920,
    seam: 0.62,
    gap_px: 6,
    top_look: { head: 0.22 },
    bottom_look: { head: 0.3, dim: 0.62 },
  });
  assert.deepEqual(rows, { top_h: 1186, gap_px: 6, bottom_h: 728, seam_y: 1189 });
  assert.match(filters[0], /^\[spk\]scale=1080:1186:.*crop=1080:1186:\(iw-1080\)\*0\.5:\(ih-1186\)\*0\.22,setsar=1\[cut3_top\]$/);
  assert.match(filters[1], /^\[lst\]scale=1080:728:.*\[cut3_bottom_s\]$/);
  assert.equal(filters[2], '[cut3_bottom_s]eq=saturation=0.62:brightness=-0.095[cut3_bottom]');
  assert.match(filters.at(-1), /^\[cut3_topg\]\[cut3_bottom\]vstack=inputs=2:shortest=1,/);
  // A product photo in the lower panel: contained, not dimmed.
  const prod = kitPanelSplit({ top: 'spk', bottom: 'p', out: 'c', width: 1080, height: 1920, seam: 768, bottom_look: { fit: 'contain', bg: '#000000' } });
  assert.match(prod.filters[1], /force_original_aspect_ratio=decrease/);
  refused(() => kitPanelSplit({ top: 'a', bottom: 'b', out: 'c', width: 1080, height: 1920, seam: 0.5, top_look: { fit: 'stretch' } }), /cover or contain/);
});

test('a divider bar centres on the seam and shows only in its windows', () => {
  const enable = kitPanelEnable([
    [2.5, 6],
    [9, 12.25],
  ]);
  assert.equal(enable, 'between(t,2.5,5.999)+between(t,9,12.249)');
  assert.equal(kitPanelDivider({ seam_y: 768, px: 4, color: '#3366ff', enable }), "drawbox=x=0:y=766:w=iw:h=4:color=0x3366FF@1:t=fill:enable='between(t,2.5,5.999)+between(t,9,12.249)'");
  assert.equal(kitPanelDivider({ seam_y: 960, color: '#000000' }), 'drawbox=x=0:y=958:w=iw:h=4:color=0x000000@1:t=fill');
  assert.equal(kitPanelEnable([]), '0');
  refused(() => kitPanelDivider({ seam_y: 768, px: 3, color: '#3366ff' }), /even/);
  refused(() => kitPanelDivider({ seam_y: 768, color: 'blue' }), /#RRGGBB/);
  refused(() => kitPanelEnable([[3, 2]]), /ends before/);
});

test('join lengths are frame exact from the running total, so rounding never drifts', () => {
  const spans = [1.01, 1.01, 1.01, 1.01, 1.01, 1.01];
  const cut = kitPanelJoinLengths(spans, { fps: 30 });
  assert.deepEqual(cut.frames, [30, 31, 30, 30, 31, 30]);
  assert.equal(cut.total_s, 182 / 30);
  assert.equal(cut.dissolve_s, 0);
  // A dissolve rides on the outgoing tail: same starts, same total, non-last segments one dissolve longer.
  const dis = kitPanelJoinLengths(spans, { fps: 30, transition: 'dissolve', dissolve_s: 0.1 });
  assert.deepEqual(dis.starts, cut.starts);
  assert.equal(dis.total_s, cut.total_s);
  assert.deepEqual(dis.lengths.map((s) => Math.round(s * 30)), [33, 34, 33, 33, 34, 30]);
});

test('a join is refused with no spans, a span under one frame or a dissolve longer than a span', () => {
  refused(() => kitPanelJoinLengths([]), /at least one span/);
  refused(() => kitPanelJoinLengths([1, 0.01], { fps: 30 }), /one frame/);
  refused(() => kitPanelJoinLengths([1, -1]), /positive/);
  refused(() => kitPanelJoinLengths([1, 0.05], { transition: 'dissolve', dissolve_s: 0.2 }), /shorter than the 6-frame dissolve/);
  refused(() => kitPanelJoinLengths([1, 1], { transition: 'dissolve', dissolve_s: 0 }), /dissolve_s/);
  refused(() => kitPanelJoinLengths([1, 1], { transition: 'wipe' }), /cut or dissolve/);
  refused(() => kitPanelJoin({ inputs: ['a', 'b'], out: 'o', spans: [1] }), /one span per input/);
});

test('a hard cut is one concat; a dissolve is an xfade chain starting on each span edge', () => {
  const cut = kitPanelJoin({ inputs: ['v0', 'v1', 'v2'], out: 'vcat', spans: [1, 2, 1.5], fps: 30 });
  assert.equal(cut.filters.length, 4);
  assert.equal(cut.filters[0], '[v0]setpts=PTS-STARTPTS,fps=30,trim=end_frame=30,setpts=PTS-STARTPTS,settb=AVTB,format=yuv420p,setsar=1[vcat_j0]');
  assert.equal(cut.filters[3], '[vcat_j0][vcat_j1][vcat_j2]concat=n=3:v=1:a=0[vcat]');
  const dis = kitPanelJoin({ inputs: ['v0', 'v1', 'v2'], out: 'vcat', spans: [1, 2, 1.5], fps: 30, transition: 'dissolve', dissolve_s: 0.1 });
  assert.equal(dis.filters[0], '[v0]setpts=PTS-STARTPTS,fps=30,trim=end_frame=33,setpts=PTS-STARTPTS,settb=AVTB,format=yuv420p,setsar=1[vcat_j0]');
  assert.equal(dis.filters[3], '[vcat_j0][vcat_j1]xfade=transition=fade:duration=0.1:offset=1[vcat_x1]');
  assert.equal(dis.filters[4], '[vcat_x1][vcat_j2]xfade=transition=fade:duration=0.1:offset=3[vcat]');
  assert.equal(dis.total_s, 4.5);
  const one = kitPanelJoin({ inputs: ['v0'], out: 'o', spans: [2], transition: 'dissolve', dissolve_s: 0.1 });
  assert.equal(one.filters.at(-1), '[o_j0]null[o]');
});

// ---- the graphs run: a real ffmpeg renders them (skipped when none is installed)

const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const pixel = (frame, x, y) => {
  const i = (y * frame.width + x) * 3;
  return [frame.data[i], frame.data[i + 1], frame.data[i + 2]];
};
const near = (got, want, tol = 24) => got.every((v, i) => Math.abs(v - want[i]) <= tol);

test('a split with a divider renders at the frame size, speaker over dimmed listener', { skip }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-panels-'));
  const out = join(dir, 'split.mp4');
  const W = 360;
  const H = 640;
  const { filters, rows } = kitPanelSplit({ top: '0:v', bottom: '1:v', out: 's', width: W, height: H, seam: 0.62, gap_px: 6, top_look: { head: 0.3, zoom: 1.15 }, bottom_look: { head: 0.3, dim: 0.62 } });
  const graph = [...filters.slice(0, -1), `${filters.at(-1).replace(/\[s\]$/, '[s0]')}`, `[s0]${kitPanelDivider({ seam_y: rows.seam_y, px: 4, color: '#FF0000', enable: kitPanelEnable([[0, 1]]) })}[v]`].join(';');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0x00FF00:s=1280x720:r=30:d=2', '-f', 'lavfi', '-i', 'color=c=0x0000FF:s=720x1280:r=30:d=3', '-filter_complex', graph, '-map', '[v]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out]);
  const info = await probe(out);
  assert.equal(info.width, W);
  assert.equal(info.height, H);
  assert.ok(Math.abs(info.duration_s - 2) < 0.05, `the stack ends with the shorter panel (${info.duration_s} s)`);
  const f = await framePixels(out, 0.5, W, H);
  assert.ok(near(pixel(f, 180, 100), [0, 255, 0]), `top is the speaker: ${pixel(f, 180, 100)}`);
  assert.ok(near(pixel(f, 180, rows.seam_y), [255, 0, 0], 60), `divider on the seam: ${pixel(f, 180, rows.seam_y)}`);
  const bottom = pixel(f, 180, 600);
  assert.ok(bottom[2] > 80 && bottom[2] < 230 && bottom[0] < 60, `bottom is the dimmed listener: ${bottom}`);
  const later = await framePixels(out, 1.5, W, H);
  assert.ok(!near(pixel(later, 180, rows.seam_y), [255, 0, 0], 60), 'no divider outside its window');
});

test('a dissolve join keeps the hard-cut length and lands each cut on its span edge', { skip }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-panels-'));
  const out = join(dir, 'join.mp4');
  const spans = [1, 1, 1];
  const { filters, total_s } = kitPanelJoin({ inputs: ['0:v', '1:v', '2:v'], out: 'v', spans, fps: 30, transition: 'dissolve', dissolve_s: 0.2 });
  const colors = ['0xFF0000', '0x00FF00', '0x0000FF'];
  const inputs = colors.flatMap((c) => ['-f', 'lavfi', '-i', `color=c=${c}:s=160x284:r=25:d=2`]);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', filters.join(';'), '-map', '[v]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out]);
  const info = await probe(out);
  assert.ok(Math.abs(info.duration_s - total_s) < 0.05, `${info.duration_s} s against ${total_s} s`);
  assert.equal(info.fps, 30);
  const at = async (t) => pixel(await framePixels(out, t, 160, 284), 80, 140);
  assert.ok(near(await at(0.95), [255, 0, 0]), 'segment 1 holds until its edge');
  assert.ok(near(await at(1.5), [0, 255, 0]), 'segment 2 after its dissolve');
  assert.ok(near(await at(2.5), [0, 0, 255]), 'segment 3 after its dissolve');
  const mid = await at(1.1);
  assert.ok(mid[0] > 60 && mid[1] > 60, `mid-dissolve mixes both: ${mid}`);
});

test('a join is frame exact even when the sources run at another rate', { skip }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-panels-'));
  const spans = [0.7, 1.3, 0.45, 2.1];
  for (const [rate, transition] of [
    [25, 'cut'],
    [25, 'dissolve'],
    [24, 'dissolve'],
  ]) {
    const out = join(dir, `join-${rate}-${transition}.mp4`);
    const { filters, total_s } = kitPanelJoin({ inputs: spans.map((_, i) => `${i}:v`), out: 'v', spans, fps: 30, transition, dissolve_s: 0.2 });
    const inputs = spans.flatMap(() => ['-f', 'lavfi', '-i', `testsrc2=s=160x284:r=${rate}:d=3`]);
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', filters.join(';'), '-map', '[v]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out]);
    const { stdout } = await run('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out]);
    assert.equal(Number(String(stdout).trim()), Math.round(total_s * 30), `${rate} fps ${transition}`);
  }
});
