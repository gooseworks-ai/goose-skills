import { interpolate, spring, Easing } from "remotion";

// ---- Motion kit -----------------------------------------------------------
// The reusable spring/interpolate primitives that give this format its
// signature kinetic-typography feel. Ported 1:1 from the worked run — do NOT
// rewrite these; the whole format's rhythm depends on them. Colors/copy are
// injected via props (see props.ts), NOT hardcoded here.

// ---- Beat grid ------------------------------------------------------------
// The big slams land ON the scene-start downbeats so type hits with the kick.
// FPS is fixed at 30; BEAT_FRAMES is derived from bpm at runtime (props.ts).
export const FPS = 30;

export function beatFrames(bpm: number): number {
  // frames per beat @ `bpm`, 30fps.  (60 / bpm) * 30
  return (60 / bpm) * FPS;
}

// ---- Slam-in with motion blur ---------------------------------------------
// Signature kinetic entrance: word punches in oversized with a vertical
// motion-blur smear, overshoots, then settles sharp on the beat.
export interface SlamOpts {
  damping?: number;
  stiffness?: number;
  mass?: number;
  fromScale?: number;
  blurFrames?: number;
  blurAmount?: number;
  fromY?: number;
}

export function slamIn(local: number, fps: number, opts: SlamOpts = {}) {
  const {
    damping = 11,
    stiffness = 220,
    mass = 0.7,
    fromScale = 1.7,
    blurFrames = 6,
    blurAmount = 22,
    fromY = 0,
  } = opts;
  const s = spring({ frame: local, fps, config: { damping, stiffness, mass } });
  const scale = fromScale + (1 - fromScale) * s;
  const opacity = interpolate(local, [0, 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blur = interpolate(local, [0, blurFrames], [blurAmount, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const y = interpolate(local, [0, 8], [fromY, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return {
    transform: `translateY(${y}px) scale(${scale})`,
    opacity,
    filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
  } as React.CSSProperties;
}

// Drop-in from above with settle bounce (the product bottle, drop-style words).
export function dropIn(
  local: number,
  fps: number,
  fromY: number,
  opts: { damping?: number; stiffness?: number; mass?: number; blur?: number } = {}
) {
  const { damping = 13, stiffness = 170, mass = 0.9, blur = 18 } = opts;
  const s = spring({ frame: local, fps, config: { damping, stiffness, mass } });
  const y = fromY * (1 - s);
  const opacity = interpolate(local, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const mb = interpolate(local, [0, 7], [blur, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  return { y, opacity, blur: mb };
}

// Gentle continuous bob (idle float for a settled hero element).
export function bob(local: number, amp = 10, periodFrames = 70) {
  return Math.sin((local / periodFrames) * Math.PI * 2) * amp;
}

// Fly-in from a screen edge with overshoot (mechanism prop, columns, chips).
export function flyIn(local: number, fps: number, fromX: number, fromYExtra = 0) {
  const s = spring({ frame: local, fps, config: { damping: 16, stiffness: 200, mass: 0.7 } });
  const x = fromX * (1 - s);
  const y = fromYExtra * (1 - s);
  const opacity = interpolate(local, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { x, y, opacity };
}

// Sticker-pop: scale-bounce from tiny with overshoot, for chips/pills.
export function popIn(
  local: number,
  fps: number,
  opts: { damping?: number; stiffness?: number; mass?: number; rotate?: number } = {}
) {
  const { damping = 9, stiffness = 240, mass = 0.6, rotate = 0 } = opts;
  const s = spring({ frame: local, fps, config: { damping, stiffness, mass } });
  const scale = interpolate(s, [0, 1], [0, 1]);
  const opacity = interpolate(local, [0, 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rot = rotate * (1 - s);
  return { scale, opacity, rot };
}

// Horizontal wipe progress 0->1 over `len` frames (strike-through reveal).
export function wipe(local: number, startAt: number, len: number) {
  return interpolate(local, [startAt, startAt + len], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
}

// Quick exit smear: scales up + blurs out right before a hard cut.
export function exitSmear(local: number, outAt: number, len = 5) {
  const t = interpolate(local, [outAt - len, outAt], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  return { opacity: 1 - t, blur: t * 16, scaleAdd: t * 0.25 };
}

export const SNAP = Easing.bezier(0.16, 1, 0.3, 1);
