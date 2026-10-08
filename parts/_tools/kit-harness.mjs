// Test harness: a PartContext as the kit core hands it to a part
// (parts/_contract/part-interface.d.ts), backed by the local ffmpeg and,
// when present, a local playwright-core. Tests only; parts never import it.
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PARTS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RETRYABLE = new Set(['provider_failed', 'tool_failed', 'timeout']);
const MIME = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.vtt': 'text/vtt',
  '.html': 'text/html',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};

export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value.kind === 'file' && typeof value.sha256 === 'string') return canonicalJson({ media: value.media, sha256: value.sha256 });
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
}

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

const STDERR_TAIL = 16 * 1024 * 1024;

/**
 * Runs ffmpeg or ffprobe. stdout is kept whole (ffprobe JSON, raw frames); stderr is streamed and only
 * its last 16 MB kept, so a chatty ffmpeg build (Ubuntu's ffmpeg 6 warns per packet) can never overflow a
 * buffer, while the summaries parts read at the end (EBU R128, detect filters) are still there.
 */
export function run(bin, args, { timeoutMs = 300000, signal } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], signal });
    const out = [];
    let err = '';
    child.stdout.on('data', (b) => out.push(b));
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (t) => {
      err += t;
      if (err.length > STDERR_TAIL * 2) err = err.slice(-STDERR_TAIL);
    });
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code, sig) => {
      clearTimeout(timer);
      const stdout = Buffer.concat(out);
      const stderr = err.slice(-STDERR_TAIL);
      if (code === 0) resolvePromise({ stdout: stdout.toString('utf8'), stdoutBuffer: stdout, stderr });
      else {
        const e = new Error(`${bin} exited with ${sig || code}: ${stderr.slice(-2000)}`);
        e.stderr = stderr;
        e.code = code;
        reject(e);
      }
    });
  });
}

let ffmpegChecked;
export async function hasFfmpeg() {
  if (ffmpegChecked === undefined) {
    try {
      await run('ffmpeg', ['-version']);
      await run('ffprobe', ['-version']);
      ffmpegChecked = true;
    } catch {
      ffmpegChecked = false;
    }
  }
  return ffmpegChecked;
}

export async function probe(path) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', path]);
  const info = JSON.parse(stdout);
  const v = (info.streams || []).find((s) => s.codec_type === 'video');
  const a = (info.streams || []).find((s) => s.codec_type === 'audio');
  const rate = v && v.avg_frame_rate && v.avg_frame_rate !== '0/0' ? v.avg_frame_rate : v && v.r_frame_rate;
  let fps;
  if (rate) {
    const [n, d] = rate.split('/').map(Number);
    if (d) fps = n / d;
  }
  const duration = Number(info.format && info.format.duration);
  return {
    duration_s: Number.isFinite(duration) ? duration : undefined,
    width: v ? v.width : undefined,
    height: v ? v.height : undefined,
    fps,
    has_audio: !!a,
    has_video: !!v,
    video_codec: v && v.codec_name,
    audio_codec: a && a.codec_name,
  };
}

/** A FileRef the way the core makes one: hashed and probed. */
export async function fileRef(path, media) {
  const abs = resolve(path);
  const bytes = readFileSync(abs);
  const ref = {
    kind: 'file',
    path: abs,
    sha256: sha256(bytes),
    bytes: bytes.length,
    media,
    mime: MIME[extname(abs).toLowerCase()] || 'application/octet-stream',
  };
  if ((media === 'audio' || media === 'video' || media === 'image') && (await hasFfmpeg())) {
    try {
      const info = await probe(abs);
      if (media !== 'image' && info.duration_s !== undefined) ref.duration_s = info.duration_s;
      if (media !== 'audio' && info.width) {
        ref.width = info.width;
        ref.height = info.height;
      }
      if (media === 'video' && info.fps) ref.fps = info.fps;
    } catch {
      // A file ffprobe cannot read keeps its hash only.
    }
  }
  return ref;
}

const ENCODE = {
  'h264-master': ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-threads', '1', '-movflags', '+faststart'],
  'h264-intermediate': ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p', '-threads', '1'],
  aac: ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000'],
};

/**
 * playwright-core for the browser tests: PLAYWRIGHT_CORE_PATH (a package folder), else one this repo can
 * require. Null when neither exists, and the browser tests then skip and say why.
 */
function findPlaywright() {
  const dir = process.env.PLAYWRIGHT_CORE_PATH;
  if (dir) {
    if (!existsSync(join(dir, 'package.json'))) throw new Error(`PLAYWRIGHT_CORE_PATH is ${dir}, which is not a playwright-core package folder`);
    return createRequire(join(dir, 'package.json'))(dir);
  }
  try {
    return createRequire(import.meta.url)('playwright-core');
  } catch {
    return null;
  }
}

/** Why browser tests skip on this machine, or null when they run. */
export function browserMissing() {
  return browserProviderOrNull() ? null : 'no browser here: set PLAYWRIGHT_CORE_PATH to a playwright-core folder (and KIT_CHROMIUM or a cached Playwright Chromium)';
}

function findChromium() {
  if (process.env.KIT_CHROMIUM) return process.env.KIT_CHROMIUM;
  const roots = [join(homedir(), 'Library/Caches/ms-playwright'), join(homedir(), '.cache/ms-playwright')];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const d of readdirSync(root).filter((x) => /^chromium-\d/.test(x)).sort().reverse()) {
      for (const rel of [
        'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
        'chrome-linux64/chrome',
        'chrome-linux/chrome',
      ]) {
        const p = join(root, d, rel);
        if (existsSync(p)) return p;
      }
    }
  }
  return undefined;
}

let browserProvider;
/** The kit's browser as a Playwright-shaped provider, or null when this machine has none. */
export function browserProviderOrNull() {
  if (browserProvider !== undefined) return browserProvider;
  const pw = findPlaywright();
  browserProvider = pw
    ? {
        async launch() {
          const executablePath = findChromium();
          const browser = await pw.chromium.launch({ executablePath, args: ['--force-color-profile=srgb'] });
          return {
            async newPage(options = {}) {
              return browser.newPage({ viewport: options.viewport, deviceScaleFactor: options.deviceScaleFactor || 1 });
            },
            close: () => browser.close(),
          };
        },
      }
    : null;
  return browserProvider;
}

/** A PartContext for one step. `line` is a fake private line: (order) => result. */
export function makeCtx({ partDir, manifest, workDir, stepId = 'step', line, browser, seed = null, attempt = 1 } = {}) {
  const man = manifest || JSON.parse(readFileSync(join(partDir, 'part.json'), 'utf8'));
  const work = workDir || mkdtempSync(join(tmpdir(), `kit-${man.id}-`));
  const tmp = join(work, 'tmp');
  mkdirSync(tmp, { recursive: true });
  const controller = new AbortController();
  const orders = [];
  const logs = [];
  const progress = [];
  const ctx = {
    interface: 1,
    video: { id: 'video-test', style: { id: 'style-test', version: '1.0.0' }, env: 'local' },
    step: { id: stepId, attempt },
    part: { id: man.id, version: man.version, dir: resolve(partDir) },
    workDir: work,
    tmpDir: tmp,
    seed(piece) {
      const digest = createHash('sha256').update(canonicalJson({ step: stepId, part: man.id, piece, seed })).digest();
      return digest.readUInt32BE(0);
    },
    tools: {
      ffmpeg: 'ffmpeg',
      ffprobe: 'ffprobe',
      toolchain: 'test-local',
      exec: (bin, args, options = {}) => {
        if (bin !== 'ffmpeg' && bin !== 'ffprobe') throw new Error(`exec refuses ${bin}`);
        return run(bin, args, { timeoutMs: options.timeoutMs, signal: controller.signal });
      },
      probe,
      encodeArgs: (preset) => {
        if (!ENCODE[preset]) throw new Error(`unknown preset ${preset}`);
        return [...ENCODE[preset]];
      },
    },
    log: {
      debug: (m, f) => logs.push(['debug', m, f]),
      info: (m, f) => logs.push(['info', m, f]),
      warn: (m, f) => logs.push(['warn', m, f]),
      error: (m, f) => logs.push(['error', m, f]),
    },
    progress: (u) => progress.push(u),
    async file(relativePath, media) {
      const abs = resolve(work, relativePath);
      if (!abs.startsWith(resolve(work))) throw new Error('file outside workDir');
      if (!statSync(abs).size) throw new Error(`empty file ${relativePath}`);
      return fileRef(abs, media);
    },
    error(code, detail) {
      const e = new Error(detail ? `${code}: ${detail}` : code);
      e.code = code;
      e.retryable = RETRYABLE.has(code);
      e.detail = detail;
      return e;
    },
    signal: controller.signal,
  };
  if (man.needs && man.needs.network) {
    ctx.line = {
      async order(request) {
        orders.push(structuredClone(request));
        if (!line) throw ctx.error('provider_failed', 'no fake line in this test');
        return line(request, ctx);
      },
    };
  }
  if (man.needs && man.needs.browser) {
    const provider = browser === undefined ? browserProviderOrNull() : browser;
    if (provider) ctx.browser = provider;
  }
  return { ctx, orders, logs, progress, abort: () => controller.abort() };
}

/** The newest published version of a part, imported (tests follow the version the source builds). */
export async function loadNewest(id) {
  const versions = readdirSync(join(PARTS_ROOT, id)).filter((v) => /^\d+\.\d+\.\d+$/.test(v));
  versions.sort((a, b) => {
    const [x, y] = [a, b].map((v) => v.split('.').map(Number));
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  });
  return loadPart(id, versions.at(-1));
}

/** Imports a published part.mjs and its manifest. */
export async function loadPart(id, version) {
  const dir = join(PARTS_ROOT, id, version);
  const manifest = JSON.parse(readFileSync(join(dir, 'part.json'), 'utf8'));
  const mod = await import(pathToFileURL(join(dir, 'part.mjs')).href);
  return { dir, manifest, mod };
}

/** The model a piece order names: the fal model path, or ElevenLabs' body.model_id. */
export function orderedModel(order) {
  if (order.provider === 'fal') return order.path;
  if (order.provider === 'elevenlabs') return order.body && order.body.model_id;
  return undefined;
}

/** Writes a test tone (or silence when freq is 0) with the local ffmpeg. Tests only. */
export async function makeTone(path, seconds, { freq = 440, codec = [], volume = 1 } = {}) {
  const src = freq ? `sine=frequency=${freq}:duration=${seconds}:sample_rate=48000` : `anullsrc=r=48000:cl=mono`;
  const args = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', src, '-t', String(seconds), '-af', `volume=${volume}`, ...codec, path];
  await run('ffmpeg', args);
  return path;
}

/** Writes a test video: a moving test pattern, optional tone. Tests only. */
export async function makeVideo(path, seconds, { width = 1080, height = 1920, fps = 30, tone = 440, pattern = 'testsrc2' } = {}) {
  const args = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `${pattern}${pattern.includes('=') ? ':' : '='}size=${width}x${height}:rate=${fps}:duration=${seconds}`];
  if (tone) args.push('-f', 'lavfi', '-i', `sine=frequency=${tone}:duration=${seconds}:sample_rate=48000`);
  args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p');
  if (tone) args.push('-c:a', 'aac', '-shortest');
  args.push(path);
  await run('ffmpeg', args);
  return path;
}

/** A character alignment for `text` spread evenly over `seconds`. Tests only. */
export function fakeAlignment(text, seconds) {
  const chars = [...text];
  const step = seconds / chars.length;
  return {
    characters: chars,
    character_start_times_seconds: chars.map((_, i) => +(i * step).toFixed(3)),
    character_end_times_seconds: chars.map((_, i) => +((i + 1) * step).toFixed(3)),
  };
}

/** RMS level in dB of `path`'s audio between from_s and to_s, optionally band-passed at `freq` Hz. Tests only. */
export async function levelDb(path, fromS, toS, freq) {
  const band = freq ? `bandpass=f=${freq}:width_type=h:w=${Math.max(20, freq * 0.1)},` : '';
  const { stderr } = await run('ffmpeg', [
    '-hide_banner', '-nostdin', '-ss', String(fromS), '-t', String(toS - fromS), '-i', path, '-vn',
    '-af', `${band}astats=metadata=0:reset=0`, '-f', 'null', '-',
  ]);
  const m = /Overall[\s\S]*?RMS level dB:\s*(-?inf|-?\d+(?:\.\d+)?)/.exec(stderr);
  if (!m) throw new Error('astats printed no RMS level');
  return m[1].includes('inf') ? -Infinity : Number(m[1]);
}

/** The RGB pixels of one frame at `atS`, scaled to w x h: { width, height, data }. Tests only. */
export async function framePixels(path, atS, w = 270, h = 480) {
  const { stdoutBuffer } = await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-ss', String(atS), '-i', path, '-frames:v', '1', '-vf', `scale=${w}:${h}:flags=neighbor`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  return { width: w, height: h, data: stdoutBuffer };
}

/** How many pixels are within `tol` of rgb [r, g, b]. Tests only. */
export function countColor(pixels, [r, g, b], tol = 12) {
  let n = 0;
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 3) if (Math.abs(d[i] - r) <= tol && Math.abs(d[i + 1] - g) <= tol && Math.abs(d[i + 2] - b) <= tol) n++;
  return n;
}

/** A solid-colour PNG logo with a transparent border. Tests only. */
export async function makeLogo(path, color, w = 400, h = 160) {
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${color}:s=${w}x${h}:d=1`, '-vf', `format=rgba,pad=${w + 40}:${h + 40}:20:20:color=0x00000000`, '-frames:v', '1', path]);
  return path;
}

/** A brand kit for tests: a logo file and the bundled font as heading. Tests only. */
export async function sampleBrand(workDir, { logoColor = '#e01020', background = '#ffffff' } = {}) {
  const logo = await fileRef(await makeLogo(join(workDir, 'logo.png'), logoColor), 'image');
  return {
    name: 'Sample Goods',
    logo,
    colors: { primary: '#1a1a1d', background, text: '#1a1a1d' },
    fonts: {},
    pronunciations: [],
    cta: { text: 'Shop the collection', url: 'samplegoods.example' },
  };
}

/** Integrated loudness (LUFS) and true peak (dBTP) by ffmpeg's EBU R128 meter, measured independently of any part. Tests only. */
export async function measureR128(path) {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostdin', '-nostats', '-i', path, '-map', '0:a:0', '-af', 'ebur128=peak=true:framelog=verbose', '-f', 'null', '-']);
  const summary = stderr.slice(stderr.lastIndexOf('Summary:'));
  const i = /I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/.exec(summary);
  const tp = /True peak:\s*Peak:\s*(-?\d+(?:\.\d+)?|-inf)\s*dBFS/.exec(summary);
  return { lufs: i ? Number(i[1]) : null, true_peak_db: tp ? (tp[1] === '-inf' ? -Infinity : Number(tp[1])) : null };
}

/** The layer inputs the core hands a layer for `video`: a bare timeline from the file, a brand and an expectation. Tests only. */
export async function layerInputsFor(video, { brand, expect = {}, timeline = {} } = {}) {
  const info = await probe(video.path);
  return {
    video,
    timeline: { duration_s: info.duration_s, width: info.width, height: info.height, fps: info.fps || 30, scenes: [], speech: [], ...timeline },
    brand: brand || { name: 'Sample Goods', colors: {}, fonts: {}, pronunciations: [], cta: { text: 'Shop now' } },
    expect: {
      aspect: '9:16', width: info.width, height: info.height, duration_s: { min: 1, max: 60 },
      speech: 'none', captions: false, end_card: false, qc_flags: [], ...expect,
    },
  };
}
