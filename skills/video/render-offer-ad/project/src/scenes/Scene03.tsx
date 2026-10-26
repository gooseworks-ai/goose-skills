import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { slamIn, flyIn, bob } from "../lib/anim";
import { resolveFont } from "../fonts";
import { OfferAdProps, MechanismProp } from "../props";
import { lighten, darken } from "./Scene01";

// BEAT 3 — CLAIM. Light radial ground. The MECHANISM PROP slides in from a
// frame edge (flyIn overshoot, ~20% from the bottom) to add motion AND show the
// mechanism. The 3-line claim drops in staggered; product held bottom-right.
// The prop is inline SVG ($0), selected by props.mechanism_prop.

// A metal tablespoon with amber liquid (default prop for "drinkable" liquids).
const Spoon: React.FC<{ tilt: number; accent: string }> = ({ tilt }) => (
  <svg width="640" height="300" viewBox="0 0 640 300" style={{ overflow: "visible" }}>
    <defs>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F2F4F7" />
        <stop offset="45%" stopColor="#C7CDD6" />
        <stop offset="70%" stopColor="#9AA3AF" />
        <stop offset="100%" stopColor="#D6DBE2" />
      </linearGradient>
      <linearGradient id="metalHandle" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#B7BEC8" />
        <stop offset="50%" stopColor="#EDEFF3" />
        <stop offset="100%" stopColor="#A7AEB9" />
      </linearGradient>
      <radialGradient id="amber" cx="50%" cy="38%" r="70%">
        <stop offset="0%" stopColor="#F7B24A" />
        <stop offset="60%" stopColor="#E08A26" />
        <stop offset="100%" stopColor="#B8651A" />
      </radialGradient>
    </defs>
    <g transform={`rotate(${tilt} 470 150)`}>
      <rect x="0" y="132" width="360" height="34" rx="17" fill="url(#metalHandle)" />
      <ellipse cx="470" cy="150" rx="150" ry="108" fill="url(#metal)" />
      <ellipse cx="470" cy="150" rx="150" ry="108" fill="none" stroke="#8A929E" strokeWidth="3" />
      <ellipse cx="470" cy="150" rx="118" ry="80" fill="url(#amber)" />
      <ellipse cx="430" cy="118" rx="42" ry="22" fill="#FFD68A" opacity="0.7" />
      <ellipse cx="470" cy="150" rx="118" ry="80" fill="none" stroke="#FFE3A8" strokeWidth="2" opacity="0.5" />
    </g>
  </svg>
);

// Neutral edge-entry accent shape — a rounded brand-colored swoosh/bar, used
// when no specific mechanism prop fits. Still supplies the required edge motion.
const AccentBar: React.FC<{ tilt: number; accent: string }> = ({ tilt, accent }) => (
  <svg width="640" height="300" viewBox="0 0 640 300" style={{ overflow: "visible" }}>
    <g transform={`rotate(${tilt} 320 150)`}>
      <rect x="20" y="118" width="600" height="64" rx="32" fill={accent} opacity="0.95" />
      <rect x="20" y="118" width="600" height="20" rx="10" fill="#ffffff" opacity="0.25" />
    </g>
  </svg>
);

const PROPS: Record<MechanismProp, React.FC<{ tilt: number; accent: string }>> = {
  spoon: Spoon,
  accent: AccentBar,
};

export const Scene03: React.FC<{ p: OfferAdProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const display = resolveFont(p.fonts.display, "display");
  const body = resolveFont(p.fonts.body, "body");
  const { primary_ground, light_ground, ink } = p.palette;
  const Prop = PROPS[p.mechanism_prop] ?? PROPS.accent;

  // prop slides in from left edge, settles, slight tip + tiny bob.
  const propFly = flyIn(frame, fps, -780, 0);
  const propSettled = Math.max(0, frame - 20);
  const propTilt = interpolate(frame, [0, 24], [16, 7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const propBobY = bob(propSettled, 5, 56);

  // product held bottom-right (small anchor).
  const prod = flyIn(frame - 6, fps, 220, 0);
  const prodBob = bob(Math.max(0, frame - 26), 6, 60);

  const claimStart = 22;
  const stagger = 9;

  return (
    <AbsoluteFill style={{ background: light_ground, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 56% 44%, ${lighten(light_ground, 20)} 0%, ${light_ground} 62%, ${darken(light_ground, 6)} 100%)`,
        }}
      />

      {/* mechanism prop entering from left, ~20% up from the bottom */}
      <div
        style={{
          position: "absolute",
          left: -40,
          top: 1450,
          transform: `translateX(${propFly.x}px) translateY(${propBobY}px)`,
          opacity: propFly.opacity,
          filter: "drop-shadow(0 26px 30px rgba(120,80,40,0.22))",
        }}
      >
        <Prop tilt={propTilt} accent={primary_ground} />
      </div>

      {/* product, bottom-right anchor */}
      <div
        style={{
          position: "absolute",
          right: 40,
          bottom: -60,
          width: 360,
          height: 720,
          transform: `translateX(${prod.x}px) translateY(${prodBob}px)`,
          opacity: prod.opacity,
        }}
      >
        <Img
          src={staticFile(p.product_image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 30px 40px rgba(120,80,40,0.28))",
          }}
        />
      </div>

      {/* 3-line claim, center-left */}
      <AbsoluteFill
        style={{
          alignItems: "flex-start",
          justifyContent: "center",
          paddingLeft: 110,
          paddingBottom: 120,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          {p.copy.claim_lines.map((c, i) => {
            const s = slamIn(frame - (claimStart + i * stagger), fps, {
              fromScale: 1.35,
              fromY: 40,
              blurAmount: 12,
              damping: 13,
              stiffness: 195,
            });
            return (
              <div key={i} style={{ ...s, display: "flex", alignItems: "baseline", gap: 18 }}>
                <span
                  style={{
                    fontFamily: display,
                    fontSize: 118,
                    color: primary_ground,
                    letterSpacing: "-0.04em",
                    lineHeight: 0.9,
                  }}
                >
                  {c.big}
                </span>
                <span
                  style={{
                    fontFamily: body,
                    fontWeight: 700,
                    fontSize: 52,
                    color: ink,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {c.small}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
