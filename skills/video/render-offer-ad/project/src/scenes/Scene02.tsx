import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { dropIn, bob, popIn, wipe } from "../lib/anim";
import { resolveFont } from "../fonts";
import { OfferAdProps } from "../props";
import { lighten, darken } from "./Scene01";

// BEAT 2 — PRODUCT. Light radial ground. The REAL product photo drops in from
// the top (dropIn) and idle-bobs (bob), objectFit:contain so aspect is
// preserved (NEVER stretched). The motif_chip pops in (popIn). Optional GENERIC
// competitor shape + horizontal strike-through (wipe) — never a named brand.
export const Scene02: React.FC<{ p: OfferAdProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const display = resolveFont(p.fonts.display, "display");
  const { primary_ground, light_ground, highlight_chip } = p.palette;

  // product photo: drop from above, settle, then gentle idle bob.
  const drop = dropIn(frame, fps, -680, { damping: 13, stiffness: 150, mass: 1.0, blur: 22 });
  const settled = Math.max(0, frame - 22);
  const bobY = bob(settled, 9, 64);
  const tilt = interpolate(frame, [0, 22], [-7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // generic competitor column (left/back) — drawn, then struck through.
  const colStart = 30;
  const colPop = popIn(frame - colStart, fps, { damping: 12, stiffness: 180, mass: 0.8 });
  const strike = wipe(frame, 52, 14);

  // motif chip pops in top-left, slight rotate.
  const chipStart = 64;
  const chip = popIn(frame - chipStart, fps, { rotate: -10, damping: 9, stiffness: 240 });

  return (
    <AbsoluteFill style={{ background: light_ground, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, ${lighten(light_ground, 20)} 0%, ${light_ground} 60%, ${darken(light_ground, 6)} 100%)`,
        }}
      />

      {/* generic competitor column — abstract typeset shape, struck through */}
      {p.show_competitor_strike && (
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 540,
            opacity: colPop.opacity * 0.85,
            transform: `scale(${colPop.scale}) rotate(${colPop.rot}deg)`,
          }}
        >
          <div
            style={{
              width: 240,
              height: 360,
              borderRadius: 22,
              background: "#E6DED3",
              border: "5px solid #CDBFAE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                fontFamily: display,
                fontSize: 40,
                color: "#9A8B76",
                letterSpacing: "0.04em",
                transform: "rotate(-90deg)",
                whiteSpace: "nowrap",
              }}
            >
              OLD WAY
            </div>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: `${strike * 300}px`,
                height: 16,
                background: primary_ground,
                borderRadius: 8,
                transform: "translate(-50%, -50%) rotate(-18deg)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
              }}
            />
          </div>
        </div>
      )}

      {/* REAL product photo, drop + bob, aspect preserved */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 620,
            height: 1100,
            transform: `translateY(${drop.y + bobY}px) rotate(${tilt}deg)`,
            opacity: drop.opacity,
            filter: drop.blur > 0.3 ? `blur(${drop.blur}px)` : undefined,
          }}
        >
          <Img
            src={staticFile(p.product_image)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 38px 50px rgba(120,80,40,0.30))",
            }}
          />
        </div>
      </AbsoluteFill>

      {/* motif sticker-chip, top-left over the product */}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 300,
          transform: `scale(${chip.scale}) rotate(${-6 + chip.rot}deg)`,
          opacity: chip.opacity,
        }}
      >
        <div
          style={{
            background: primary_ground,
            color: light_ground,
            fontFamily: display,
            fontSize: 56,
            letterSpacing: "0.01em",
            padding: "20px 40px",
            borderRadius: 999,
            border: `6px solid ${highlight_chip}`,
            boxShadow: "0 14px 36px rgba(0,0,0,0.22)",
            whiteSpace: "nowrap",
          }}
        >
          {p.copy.motif_chip}
        </div>
      </div>
    </AbsoluteFill>
  );
};
