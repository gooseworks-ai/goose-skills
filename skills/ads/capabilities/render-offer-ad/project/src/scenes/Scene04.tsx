import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { popIn, slamIn } from "../lib/anim";
import { resolveFont } from "../fonts";
import { OfferAdProps } from "../props";
import { lighten, darken } from "./Scene01";

// BEAT 4 — CTA. Primary-color radial ground. The brand wordmark slams first
// (slamIn); the CTA pill pops in as the motif-chip handoff resolving (popIn)
// with a small arrow nudge; the URL fades up. All copy from props.
export const Scene04: React.FC<{ p: OfferAdProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const display = resolveFont(p.fonts.display, "display");
  const body = resolveFont(p.fonts.body, "body");
  const { primary_ground, light_ground, highlight_chip } = p.palette;

  const mark = slamIn(frame, fps, {
    fromScale: 1.4,
    fromY: -20,
    blurAmount: 12,
    damping: 13,
    stiffness: 190,
  });

  const pillStart = 14;
  const pill = popIn(frame - pillStart, fps, { damping: 9, stiffness: 230, mass: 0.6 });
  const arrowNudge =
    frame > pillStart + 8 ? Math.sin(((frame - pillStart) / 16) * Math.PI * 2) * 8 : 0;

  const urlStart = 26;
  const url = interpolate(frame, [urlStart, urlStart + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlY = interpolate(frame, [urlStart, urlStart + 10], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: primary_ground, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 44%, ${lighten(primary_ground, 18)} 0%, ${primary_ground} 55%, ${darken(primary_ground, 14)} 100%)`,
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 44,
        }}
      >
        {/* brand wordmark */}
        <div
          style={{
            ...mark,
            fontFamily: display,
            fontSize: 62,
            color: light_ground,
            letterSpacing: "-0.02em",
            textTransform: "lowercase",
            textShadow: "0 4px 22px rgba(0,0,0,0.25)",
          }}
        >
          {p.copy.wordmark}
        </div>

        {/* CTA pill — the chip handoff lands here */}
        <div style={{ transform: `scale(${pill.scale}) rotate(${pill.rot}deg)`, opacity: pill.opacity }}>
          <div
            style={{
              background: light_ground,
              color: primary_ground,
              fontFamily: display,
              fontSize: 84,
              letterSpacing: "-0.01em",
              padding: "30px 64px",
              borderRadius: 999,
              border: `8px solid ${highlight_chip}`,
              boxShadow: "0 20px 48px rgba(0,0,0,0.28)",
              display: "flex",
              alignItems: "center",
              gap: 22,
              whiteSpace: "nowrap",
            }}
          >
            <span>{p.copy.cta_label}</span>
            <span style={{ transform: `translateX(${arrowNudge}px)` }}>→</span>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            opacity: url,
            transform: `translateY(${urlY}px)`,
            fontFamily: body,
            fontWeight: 600,
            fontSize: 46,
            color: light_ground,
            letterSpacing: "0.06em",
          }}
        >
          {p.copy.cta_url}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
