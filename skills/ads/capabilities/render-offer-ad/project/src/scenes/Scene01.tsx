import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { slamIn } from "../lib/anim";
import { resolveFont } from "../fonts";
import { OfferAdProps } from "../props";

// BEAT 1 — HEADLINE. Primary-color radial ground. headline_words slam in
// word-by-word (slamIn, ~7-frame stagger, scale-overshoot + motion-blur smear,
// settling on the downbeat). Then the subline + an animated bobbing down-arrow
// drop in. All copy/palette/fonts from props — nothing hardcoded.
export const Scene01: React.FC<{ p: OfferAdProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const display = resolveFont(p.fonts.display, "display");
  const body = resolveFont(p.fonts.body, "body");
  const { primary_ground, light_ground } = p.palette;

  const stagger = 7; // word stagger frames
  const words = p.copy.headline_words;

  // subline drops in at ~1.6s (frame 48).
  const subStart = 48;
  const sub = slamIn(frame - subStart, fps, {
    fromScale: 1.4,
    fromY: 28,
    blurAmount: 12,
    damping: 14,
    stiffness: 190,
  });

  // animated down-arrow: bounces after it appears.
  const arrowStart = 54;
  const arrowIn = spring({
    frame: frame - arrowStart,
    fps,
    config: { damping: 11, stiffness: 200, mass: 0.6 },
  });
  const arrowBounce =
    frame > arrowStart ? Math.abs(Math.sin(((frame - arrowStart) / 22) * Math.PI)) * 18 : 0;

  // headline auto-sizes down as word count grows so overshoot fits ~82% width.
  const headlineSize = words.length >= 4 ? 108 : words.length === 3 ? 132 : 148;

  return (
    <AbsoluteFill style={{ background: primary_ground, overflow: "hidden" }}>
      {/* radial warmth so the flat ground reads less like a solid block */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 38%, ${lighten(primary_ground, 18)} 0%, ${primary_ground} 55%, ${darken(primary_ground, 14)} 100%)`,
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: "0 9%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {words.map((w, i) => {
            const s = slamIn(frame - i * stagger, fps, {
              fromScale: 1.85,
              blurAmount: 24,
              damping: 10,
              stiffness: 230,
              mass: 0.7,
            });
            return (
              <div
                key={i}
                style={{
                  ...s,
                  fontFamily: display,
                  fontSize: headlineSize,
                  color: light_ground,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.95,
                  textAlign: "center",
                  textShadow: "0 6px 30px rgba(0,0,0,0.28)",
                  whiteSpace: "nowrap",
                }}
              >
                {w}
              </div>
            );
          })}
        </div>

        <div
          style={{
            ...sub,
            marginTop: 70,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              fontFamily: body,
              fontWeight: 600,
              fontSize: 46,
              color: lighten(light_ground, 0),
              letterSpacing: "0.06em",
              textTransform: "lowercase",
            }}
          >
            {p.copy.subline}
          </div>
          <div
            style={{
              fontSize: 78,
              color: light_ground,
              lineHeight: 1,
              opacity: interpolate(frame, [arrowStart, arrowStart + 5], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              transform: `translateY(${arrowBounce}px) scale(${interpolate(arrowIn, [0, 1], [0.4, 1])})`,
            }}
          >
            ↓
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---- tiny hex helpers (lighten/darken a ground for the radial vignette) ----
function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("");
}
export function lighten(hex: string, pct: number) {
  const [r, g, b] = hexToRgb(hex);
  const f = pct / 100;
  return rgbToHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
}
export function darken(hex: string, pct: number) {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - pct / 100;
  return rgbToHex(r * f, g * f, b * f);
}
