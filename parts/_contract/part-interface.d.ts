/**
 * GooseWorks video kit · part interface 1
 *
 * Contract page: goose-lab plan/2026-10-08-goose-video-merged/contracts/part-interface.md
 * Manifest schema: part-manifest.schema.json (same folder)
 * Owner: C1 (kit core) with S2 (parts and layers). Copied as-is into
 * gooseworks-cli (suggested: src/kit/part-interface.d.ts) and goose-skills
 * (suggested: parts/_contract/part-interface.d.ts). Change it only through C1.
 *
 * Aligned with: style-file.md (A8 for T1), private-line.md (A7), stage-machine.md (A2).
 *
 * Types only. Nothing here runs. The kit core implements PartContext; each part
 * implements PartRun and exports it as `run` from its part.mjs.
 */

// ---------------------------------------------------------------------------
// Basics
// ---------------------------------------------------------------------------

/** The part interface version this file describes. A kit lists the versions it can run. */
export type InterfaceVersion = 1;

/** Exact semver, no ranges, no prerelease: "1.2.0" (same rule as the style file). */
export type SemVer = string;

/** Lowercase kebab id, starting with a letter: "voice-elevenlabs", "html-frames", "sound-layer". Max 64 chars. */
export type PartId = string;

/** How style files, the private line and locks name a part. */
export interface PartRef {
  id: PartId;
  version: SemVer;
}

/** How the frozen plan names a style (style_id, style_version). */
export interface StyleRef {
  id: string;
  version: SemVer;
}

/** npm-style kit range in the only two allowed forms: ">=1.0.0" or ">=1.0.0 <2.0.0". */
export type KitRange = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

/** A JSON Schema (draft 2020-12) object schema. See part-manifest.schema.json $defs/objectSchema. */
export type JsonSchema = JsonObject;

// ---------------------------------------------------------------------------
// Kinds and layers
// ---------------------------------------------------------------------------

export type PartKind =
  | 'generate_voice'
  | 'generate_image'
  | 'generate_video'
  | 'generate_music'
  | 'generate_sfx'
  | 'render_html'
  | 'compose'
  | 'caption'
  | 'mix'
  | 'check'
  | 'end_card';

/** Kinds that order pieces from a provider. They must declare models and network. */
export type GenerateKind = Extract<PartKind, `generate_${string}`>;

/** The four layer slots, run by the core after the style's timeline, always in this order. */
export type LayerSlot = 'brand' | 'captions' | 'sound' | 'check';

export declare const LAYER_ORDER: readonly ['brand', 'captions', 'sound', 'check'];

/** Which part kind may fill which slot. */
export interface LayerSlotKind {
  brand: 'compose';
  captions: 'caption';
  sound: 'mix';
  check: 'check';
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export type MediaKind = 'video' | 'audio' | 'image' | 'json' | 'text' | 'subtitles' | 'font' | 'html';

/**
 * How every file moves between the core and parts. Made only by the core
 * (inputs, assets, piece results) or by ctx.file() (outputs). In every hash a
 * FileRef counts only as { media, sha256 }, never its path, so hashes match
 * across computers and runs. Parts pass files to providers as FileRefs, never
 * as URLs; the core hosts them.
 */
export interface FileRef {
  kind: 'file';
  /** Absolute path inside this video's run folder or a part's own version folder. */
  path: string;
  /** Lowercase hex sha256 of the bytes. */
  sha256: string;
  bytes: number;
  media: MediaKind;
  mime: string;
  /** Filled by the core's probe for audio and video. */
  duration_s?: number;
  /** Filled by the core's probe for images and video. */
  width?: number;
  height?: number;
  fps?: number;
}

/** A provider payload: JSON that may hold FileRefs anywhere. The core hosts each FileRef and swaps in its URL. */
export type PayloadValue = JsonPrimitive | FileRef | PayloadValue[] | { [key: string]: PayloadValue };

/** Marker a part's input or output schema puts on a property that holds a FileRef. */
export interface KitFileAnnotation {
  'x-kit-file': { media: MediaKind; mime?: string[] };
}

// ---------------------------------------------------------------------------
// The manifest (part.json)
// ---------------------------------------------------------------------------

/** Providers the private line accepts (private-line.md, call.provider). */
export type LineProvider = 'fal' | 'elevenlabs' | 'higgsfield' | 'openai' | 'whisper';

export interface ModelNeed {
  provider: LineProvider;
  /** The model id the call uses and the price is looked up by: "fal-ai/kling-video/v2.1/standard/image-to-video", "eleven_v3". */
  model: string;
}

export interface FfmpegNeed {
  filters?: string[];
  encoders?: string[];
}

/** What the part needs from the computer. `video check` reports the same things in the device report. */
export interface PartNeeds {
  /** Needs the kit's bundled Chromium (ctx.browser). Always true for render_html. */
  browser: boolean;
  /** Needs ffmpeg and ffprobe, optionally with named filters or encoders. */
  ffmpeg: boolean | FfmpegNeed;
  /** Needs the private line. True exactly when `models` is not empty. */
  network: boolean;
  /** Every provider model this part may order. */
  models: ModelNeed[];
  /** Scratch space per run, in MB, for the disk check. */
  disk_mb?: number;
}

export type CostUnit = 'call' | 'second' | '1k_chars' | 'image';

/**
 * How many units one run uses, read from the part's bound inputs before
 * anything runs. The pointer may use a "*" segment for every element of a
 * list. Examples (pointer, as):
 *   "/lines/STAR/text", "length"   total characters of every line (STAR = *)
 *   "/scenes/STAR/seconds", "sum"  total seconds of every scene
 *   "/scenes", "count"             one unit per scene
 */
export interface CostMeasure {
  from: string;
  /** value: the number; sum: add the numbers; length: add string lengths (÷1000 for 1k_chars); count: count the matches. */
  as: 'value' | 'sum' | 'length' | 'count';
}

export type CostBasis =
  | { basis: 'free' }
  | {
      basis: 'per_unit';
      unit: CostUnit;
      /** Omitted means one unit per run (use with unit "call"). */
      measure?: CostMeasure;
      /** Provider list price in USD per unit, keyed by model id from needs.models. Upper bound, no markup. */
      rates_usd: Record<string, number>;
      /** JSON pointer to the input that picks the model, when needs.models has more than one. */
      model_from?: string;
      /** Charge only when this input equals this value. */
      only_if?: { from: string; equals: JsonPrimitive };
    };

/**
 * pure: same inputs + same version + same kit toolchain gives the same bytes.
 * seeded: as pure, with randomness only from ctx.seed().
 * provider: output comes from a paid model and may differ per call. The part
 *   sends ctx.seed(piece) when the model takes a seed; the kit never pays for
 *   the same piece twice (the line replays it by inputs_hash).
 */
export type Determinism = 'pure' | 'seeded' | 'provider';

export interface PartManifest {
  $schema?: string;
  interface: InterfaceVersion;
  id: PartId;
  version: SemVer;
  kind: PartKind;
  /** Set only on layer parts. The slot must match the kind (LayerSlotKind). */
  layer?: LayerSlot;
  /** Internal name, never shown to customers. */
  title: string;
  /** One internal line: what the part does. No prices, no customer copy. */
  summary: string;
  runtime: 'node';
  entry: 'part.mjs';
  /** Every file in the published version folder, relative, including part.mjs. part.json is implied. */
  files: string[];
  /** Kit versions that can run this part. */
  kit: KitRange;
  needs: PartNeeds;
  /** Object schema; additionalProperties must be false; names lower_snake_case. File properties carry x-kit-file. */
  inputs: JsonSchema;
  /** Object schema; additionalProperties must be false. A part that makes the cut outputs `video`. */
  outputs: JsonSchema;
  cost: CostBasis;
  determinism: Determinism;
  timing: {
    /** Typical seconds per run. Drives "about N min left". */
    typical_s: number;
    /** Hard limit per run. The core aborts ctx.signal at this point. */
    timeout_s: number;
  };
  /** Retries the core may make for a retryable error. Default 1. */
  retry?: { transient: 0 | 1 };
  /** Today's atom slugs this part replaces, for the retire list. */
  replaces?: string[];
  /** Extension fields are allowed only with an x- prefix. */
  [extension: `x-${string}`]: JsonValue | undefined;
}

// ---------------------------------------------------------------------------
// The run contract (part.mjs)
// ---------------------------------------------------------------------------

/**
 * The only thing a part exports. Inputs are already validated against
 * manifest.inputs; outputs are validated against manifest.outputs after the
 * promise resolves. Throw ctx.error(...) to fail.
 */
export type PartRun<I extends object = Record<string, unknown>, O extends object = Record<string, unknown>> = (
  inputs: I,
  ctx: PartContext,
) => Promise<O>;

/** Shape of part.mjs: `export async function run(inputs, ctx) { ... }`. */
export interface PartModuleExports<I extends object = Record<string, unknown>, O extends object = Record<string, unknown>> {
  run: PartRun<I, O>;
}

export interface PartContext {
  readonly interface: InterfaceVersion;
  readonly video: { id: string; style: StyleRef; env: 'production' | 'staging' | 'local' };
  readonly step: {
    /** The style's timeline step id, or "layer-<slot>" for layers. */
    id: string;
    /** 1 on the first run, 2 on the core's one retry. */
    attempt: 1 | 2;
  };
  readonly part: PartRef & {
    /** Read-only folder of this part version (its assets: fonts, frames, sounds). */
    dir: string;
  };
  /** Absolute folder this step owns. The only place the part may write. */
  readonly workDir: string;
  /** Scratch folder inside workDir, deleted after a successful run. */
  readonly tmpDir: string;
  /**
   * A stable 32-bit seed for one piece: the first 4 bytes of
   * sha256(canonical { step, part: id, piece, seed }), where `seed` is the
   * step's bound `seed` input or null. It never depends on the kit version,
   * the toolchain or other pieces, so changing one scene never changes the
   * seed (or the price) of another.
   */
  seed(piece: string): number;
  /** Present only when needs.network is true. The only way to order a paid piece. */
  readonly line?: LineClient;
  /** ffmpeg and ffprobe from the kit, plus a supervised exec. */
  readonly tools: KitTools;
  /** Present only when needs.browser is true. */
  readonly browser?: KitBrowserProvider;
  readonly log: PartLogger;
  /** Counts only. The card's words come from the core's kind table, never from part text. */
  progress(update: PartProgress): void;
  /** Registers a file the part wrote under workDir and returns its FileRef (hash and probe by the core). */
  file(relativePath: string, media: MediaKind): Promise<FileRef>;
  /** Builds the error to throw. */
  error(code: PartErrorCode, detail?: string): PartError;
  /** Aborted on Stop, on timeout_s, or when the kit is shutting down. Stop at the next safe point. */
  readonly signal: AbortSignal;
}

export interface PartProgress {
  done?: number;
  total?: number;
  /** 0 to 1, for parts without natural counts. */
  fraction?: number;
}

export interface PartLogger {
  debug(message: string, fields?: JsonObject): void;
  info(message: string, fields?: JsonObject): void;
  warn(message: string, fields?: JsonObject): void;
  error(message: string, fields?: JsonObject): void;
}

// ---------------------------------------------------------------------------
// Private line client (paid pieces). Wire format: private-line.md (b).
// ---------------------------------------------------------------------------

export interface LineClient {
  /**
   * Orders one paid piece and resolves when its result files are downloaded.
   * The core builds piece_key = "<step id>.<piece>", inputs_hash = the piece
   * hash, idempotency_key = "<piece_key>:<inputs_hash>:<attempt>", hosts any
   * FileRef inside the body, asks again while the line says "running", keeps
   * reporting progress while it waits, and downloads the results. A piece the
   * line has already made comes back with reused: true and costs nothing.
   */
  order(request: PieceOrder): Promise<PieceResult>;
}

export interface PieceOrder {
  /** Stable name of this piece inside the step: "scene-3", "take-2", "main". ^[a-z0-9][a-z0-9_-]{0,47}$ */
  piece: string;
  /** Must match a provider in manifest.needs.models. */
  provider: LineProvider;
  /** The provider path, as today's media proxy takes it: a fal model path, "/v1/text-to-speech/<voice>/with-timestamps". */
  path: string;
  /** Provider payload. Pass files as FileRefs, never URLs: the core hosts them and swaps in URLs after hashing. */
  body: PayloadValue;
  /** Which files to download from the line's result, and what to call them in workDir. */
  results: PieceResultFile[];
}

export interface PieceResultFile {
  /** JSON pointer into the line's result { json, file_url }: "/file_url", "/json/video/url", "/json/images/0/url". */
  pointer: string;
  /** File name to save under workDir: "scene-3.mp4". */
  name: string;
  media: MediaKind;
}

export interface PieceResult {
  /** The provider reply (the line's result.json), with signed URLs removed. */
  json: JsonValue;
  /** Downloaded files keyed by PieceResultFile.name. */
  files: Record<string, FileRef>;
  /** True when the line replayed a piece it had already made: nothing new started or charged. */
  reused: boolean;
}

// ---------------------------------------------------------------------------
// Tools the kit lends to parts
// ---------------------------------------------------------------------------

export interface KitTools {
  readonly ffmpeg: string;
  readonly ffprobe: string;
  /** Pinned versions of the bundled ffmpeg and Chromium, for example "ffmpeg-7.1/chromium-131". Part of the step hash. */
  readonly toolchain: string;
  /** Runs ffmpeg or ffprobe only. Killed on ctx.signal. No shell. */
  exec(
    bin: 'ffmpeg' | 'ffprobe',
    args: string[],
    options?: { cwd?: string; timeoutMs?: number; stdin?: Uint8Array },
  ): Promise<{ stdout: string; stderr: string }>;
  probe(path: string): Promise<MediaInfo>;
  /** Encoder flags that fix every setting that changes output bytes (threads included). */
  encodeArgs(preset: 'h264-master' | 'h264-intermediate' | 'aac'): string[];
}

export interface MediaInfo {
  duration_s?: number;
  width?: number;
  height?: number;
  fps?: number;
  has_audio: boolean;
  has_video: boolean;
  video_codec?: string;
  audio_codec?: string;
}

/**
 * A Playwright-shaped subset, so the kit can hand over real playwright-core
 * objects. Pages can load only file:// URLs under the part folder and
 * workDir; all other network is blocked.
 */
export interface KitBrowserProvider {
  launch(): Promise<KitBrowser>;
}

export interface KitBrowser {
  newPage(options?: { viewport?: { width: number; height: number }; deviceScaleFactor?: number }): Promise<KitPage>;
  close(): Promise<void>;
}

export interface KitPage {
  goto(url: string): Promise<unknown>;
  setContent(html: string): Promise<void>;
  evaluate<R, A = unknown>(pageFunction: string | ((arg: A) => R | Promise<R>), arg?: A): Promise<R>;
  screenshot(options: { path: string; type?: 'png' | 'jpeg'; omitBackground?: boolean }): Promise<unknown>;
  close(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Retried once by the core (attempt 2, a new idempotency key): provider_failed,
 * tool_failed, timeout. Never retried: bad_input, provider_rejected (a policy
 * refusal is final for that exact piece), over_quote, stopped, output_invalid,
 * needs_missing. Customer wording comes from the line's message or the
 * rulebook, never from `detail`.
 */
export type PartErrorCode =
  | 'bad_input'
  | 'provider_rejected'
  | 'provider_failed'
  | 'over_quote'
  | 'stopped'
  | 'timeout'
  | 'tool_failed'
  | 'output_invalid'
  | 'needs_missing';

export interface PartError extends Error {
  readonly code: PartErrorCode;
  readonly retryable: boolean;
  /** For logs only. */
  readonly detail?: string;
}

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

/** One layer as the core runs it: the style switches it on, the video's lock pins its part. */
export interface LayerHook {
  slot: LayerSlot;
  /** brand 1, captions 2, sound 3, check 4. */
  order: 1 | 2 | 3 | 4;
  kind: LayerSlotKind[LayerSlot];
  part: PartRef;
  /** From the style file's layers block. */
  on: boolean;
  /** Only the check layer is required; it cannot be switched off. */
  required: boolean;
}

/** What the core passes to every layer part. A layer's input schema must accept exactly this shape. */
export interface LayerInputs {
  /** The cut so far: the last timeline step's `video`, then each layer's output. */
  video: FileRef;
  timeline: Timeline;
  brand: BrandKit;
  expect: OutputExpectation;
  /** Word timings from the captions layer, when it ran. */
  words?: FileRef;
}

/** brand, captions and sound layers return a new cut and the (possibly updated) timeline. */
export interface LayerOutputs {
  video: FileRef;
  timeline: Timeline;
  /** captions layer: word timings it used. */
  words?: FileRef;
  /** captions layer: WebVTT of exactly what it drew. The core sends it as the upload's captions_vtt. */
  captions?: FileRef;
}

/** The check layer never changes the video. */
export interface CheckLayerOutputs {
  verdict: CheckVerdict;
}

/** The checks our server also runs on upload (private-line.md (d) reasons[].check). */
export type ServerCheckCode = 'plays' | 'length' | 'size' | 'sound' | 'captions';

/** Extra checks only the kit runs, before upload. Style qc_flags arrive as "flag:<name>". */
export type LocalCheckCode =
  | 'black_frames'
  | 'frozen_frames'
  | 'captions_safe_zone'
  | 'speech_matches_script'
  | 'end_card'
  | 'logo'
  | `flag:${string}`;

export type CheckCode = ServerCheckCode | LocalCheckCode;

export interface CheckVerdict {
  pass: boolean;
  checks: Array<{
    code: CheckCode;
    status: 'pass' | 'fail' | 'not_applicable';
    found?: JsonPrimitive;
    expected?: string;
    /** What the one fix should re-run. */
    fix?: FixHint;
  }>;
}

/** Names a layer or a timeline step to re-run. A paid re-run must fit the quote. */
export interface FixHint {
  slot?: LayerSlot;
  step?: string;
  /** Extra inputs for that one re-run, validated against the part's input schema. */
  inputs?: JsonObject;
}

/**
 * Timing of the cut. Layers get it from the latest timeline step that outputs
 * `timeline`; if none does, the core makes a bare one from the video (length,
 * size, fps; no scenes or speech).
 */
export interface Timeline {
  duration_s: number;
  width: number;
  height: number;
  fps: number;
  scenes: Array<{ id: string; start_s: number; end_s: number }>;
  speech: Array<{
    scene_id?: string;
    /** Written text, as captions show it. */
    text: string;
    /** Spoken text after pronunciation swaps, when it differs. */
    spoken?: string;
    start_s: number;
    end_s: number;
    words?: Array<{ text: string; start_s: number; end_s: number }>;
  }>;
  end_card?: { start_s: number; end_s: number };
  /** Areas captions and logos must stay inside, in pixels. */
  safe_zones?: Array<{ use: 'captions' | 'logo'; x: number; y: number; w: number; h: number }>;
}

/** What the finished video must be: from the style file (duration, traits) and the frozen plan (aspect). */
export interface OutputExpectation {
  aspect: '9:16' | '1:1' | '4:5' | '16:9';
  width: number;
  height: number;
  duration_s: { min: number; max: number };
  /** style traits.speech */
  speech: 'none' | 'voiceover' | 'on_camera';
  /** style traits.captions */
  captions: boolean;
  /** style traits.end_card: the video ends on the brand end card. */
  end_card: boolean;
  /** style traits.qc_flags */
  qc_flags: string[];
  /** Approved lines from plan.scenes[].line, for speech_matches_script. */
  script?: string[];
}

/**
 * The kit's view of the brand, frozen at the yes with the plan (the kit reads
 * nothing from the brand while it makes the video). Shape owned with A2 and A8;
 * this is what `brand.<field>` references and the brand layer read.
 */
export interface BrandKit {
  name: string;
  logo?: FileRef;
  colors: { primary?: string; secondary?: string; background?: string; text?: string; palette?: string[] };
  fonts: { heading?: FileRef; body?: FileRef };
  pronunciations: Array<{ term: string; say_as: string }>;
  cta?: { text: string; url?: string };
}

// ---------------------------------------------------------------------------
// The style file's timeline, as the kit reads it. style-file.md owns the shape.
// ---------------------------------------------------------------------------

/**
 * A plain value, or a reference the core resolves before the step runs:
 *   { from: "plan.<field>" }            the plan frozen at the yes (ApprovedPlan.body)
 *   { from: "brand.<field>" }           the brand kit frozen with it
 *   { from: "step.<step-id>.<output>" } an output of an earlier step (dot path allowed)
 *   { asset: "<path>" }                 a file listed in the style's assets, as a FileRef
 * An object with a `from` or `asset` key is always a reference.
 */
export type Binding = JsonValue | { from: string } | { asset: string };

export interface StyleStep {
  /** Kebab id, unique in the timeline: ^[a-z0-9]+(?:-[a-z0-9]+)*$ */
  id: string;
  part: PartRef;
  /** By the part's input names (lower_snake_case). */
  inputs?: Record<string, Binding>;
}

/** The style file's layers block. check must be true (asked of T1). */
export interface StyleLayers {
  brand: boolean;
  captions: boolean;
  sound: boolean;
  check: boolean;
}

// ---------------------------------------------------------------------------
// The per-video lock, handed over by the private line at the yes
// ---------------------------------------------------------------------------

/**
 * Every part this video runs, with a sha256 for every file. Built by the
 * server from the synced goose-skills parts index: the style version's
 * timeline parts plus the layer set current at the yes. Saved in the run
 * folder; it never changes for this video.
 */
export interface PartsLock {
  lock: 1;
  interface: InterfaceVersion;
  video_id: string;
  style: StyleRef;
  /** Highest minimum kit version among the locked parts. */
  kit_min: SemVer;
  /** One version per part id. Includes the layer parts. */
  parts: Record<PartId, LockedPart>;
  /** Which locked part fills each slot. */
  layers: Record<LayerSlot, PartRef>;
}

export interface LockedPart {
  version: SemVer;
  /** sha256 of every file in the version folder, part.json included. */
  files: Record<string, string>;
  /**
   * The models this part may order over the private line, copied from
   * part.json needs.models at lock time (the fal model path, or ElevenLabs'
   * model_id). The line refuses any piece whose model is not listed here;
   * a part with no models is a free part and may order nothing.
   */
  models: ModelNeed[];
  /** The part's kit range, copied from part.json. */
  kit: string;
}

// ---------------------------------------------------------------------------
// Save and resume records (inside ~/.gooseworks/videos/<video_id>/)
// ---------------------------------------------------------------------------

export type StepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed' | 'stopped';

export interface RunRecord {
  record: 1;
  video_id: string;
  quote_id: string;
  plan_revision: number;
  style: StyleRef;
  /** sha256 of the frozen plan as handed over, and of the lock. */
  plan_sha256: string;
  lock_sha256: string;
  device_id: string;
  kit: { version: SemVer; toolchain: string; parts_source: 'published' | 'dev' };
  status: 'running' | 'stopped' | 'failed' | 'uploading' | 'checking' | 'done';
  /** Keyed by timeline step id, or "layer-<slot>". */
  steps: Record<string, { status: StepStatus; step_hash?: string; finished_at?: string }>;
  /** Local fix used before the first upload; server fixes come from the line's fixes_left. */
  local_fix_used: boolean;
  upload_attempt: 0 | 1 | 2;
  started_at: string;
  updated_at: string;
}

export interface StepRecord {
  record: 1;
  step: string;
  part: PartRef;
  /** Local cache key: sha256 of canonical { interface, part, toolchain, inputs }, FileRefs as { media, sha256 }. */
  step_hash: string;
  status: StepStatus;
  inputs: JsonObject;
  outputs?: JsonObject;
  /** One entry per paid piece. Core-only data; parts never see it. */
  pieces: Array<{
    piece: string;
    /** "<step id>.<piece>" */
    piece_key: string;
    /** sha256 of canonical { part, provider, path, body }, FileRefs as { media, sha256 }. */
    inputs_hash: string;
    /** "<piece_key>:<inputs_hash>:<attempt>" */
    idempotency_key: string;
    attempt: 1 | 2;
    reused: boolean;
    /** From the line's answer (piece_credits); our ledger is the truth. */
    credits?: number;
  }>;
  error?: { code: PartErrorCode; detail?: string };
  started_at: string;
  finished_at?: string;
}
