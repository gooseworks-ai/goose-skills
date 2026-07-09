import { FPS, beatFrames } from "./lib/anim";

// ---------------------------------------------------------------------------
// OfferAdProps — the entire ad is data. Everything the four beat-scenes render
// (copy strings, palette, fonts, product photo, mechanism prop, bpm, beat
// split, music) arrives here via Remotion input props (`--props config.json`).
// NOTHING is hardcoded in the scenes. See scripts/config.example.json for a
// worked, brand-neutral example.
// ---------------------------------------------------------------------------

export interface Palette {
  primary_ground: string; // beats 1 & 4 ground (the "rust" role in the source run)
  light_ground: string; // beats 2 & 3 ground (the "cream" role)
  ink: string; // dark type on light grounds
  highlight_chip: string; // chip/pill border accent (the "soft pink" role)
}

export interface Copy {
  headline_words: string[]; // beat 1 — slams in word-by-word (e.g. ["COLLAGEN","POWDER","IS DEAD."])
  subline: string; // beat 1 — the smaller line under the headline (e.g. "the new way")
  motif_chip: string; // beat 2 — the sticker-chip over the product (e.g. "DRINKABLE")
  claim_lines: { big: string; small: string }[]; // beat 3 — 3 proof rows (e.g. {big:"10g",small:"collagen"})
  cta_label: string; // beat 4 — CTA pill text (e.g. "Try E27")
  cta_url: string; // beat 4 — URL under the pill (e.g. "spoiledchild.com")
  wordmark: string; // beat 4 — brand wordmark that slams first
}

// The mechanism prop for beat 3 (the claim beat). MUST enter from a frame edge
// (flyIn) so the claim beat has motion AND shows the mechanism. "spoon" is the
// bundled worked default (a metal tablespoon w/ amber liquid, for "drinkable").
// "accent" is the neutral edge-entry fallback shape when no specific prop fits.
export type MechanismProp = "spoon" | "accent";

export interface Music {
  src: string | null; // public/ filename of the bed, or null to render silent
  fade_out_frames: number; // ramp volume to 0 over the last N frames (default 18)
}

export interface OfferAdProps {
  palette: Palette;
  copy: Copy;
  product_image: string; // public/ filename of the REAL product photo (objectFit:contain)
  mechanism_prop: MechanismProp;
  bpm: number; // drives the beat-locked cut frames (default 115)
  beat_split_sec: [number, number, number, number]; // [headline, product, claim, cta] seconds
  fonts: { display: string; body: string }; // @remotion/google-fonts family ids resolved in fonts.ts
  music: Music;
  // strike-through generic competitor shape on beat 2 (never a named brand).
  show_competitor_strike: boolean;
}

// ---- Beat-frame math ------------------------------------------------------
// The four hard cuts land on the beat_split boundaries, rounded to whole frames.
// Returns { starts, durs, total } in frames.
export function beatLayout(beat_split_sec: [number, number, number, number]) {
  const durs = beat_split_sec.map((s) => Math.round(s * FPS));
  const starts: number[] = [];
  let acc = 0;
  for (const d of durs) {
    starts.push(acc);
    acc += d;
  }
  return { starts, durs, total: acc };
}

// Re-exported so scenes can pull the beat grid off the current bpm if needed.
export { FPS, beatFrames };

// Safe fallback used when no input props are supplied (Remotion Studio preview
// with an empty --props). Mirrors config.example.json (brand-neutral).
export const DEFAULT_PROPS: OfferAdProps = {
  palette: {
    primary_ground: "#C96E2F",
    light_ground: "#FAFAFA",
    ink: "#0A0B0D",
    highlight_chip: "#F2C9C2",
  },
  copy: {
    headline_words: ["POWDER", "IS", "OVER."],
    subline: "the new way",
    motif_chip: "DRINKABLE",
    claim_lines: [
      { big: "10g", small: "protein" },
      { big: "1", small: "spoon" },
      { big: "0", small: "mess" },
    ],
    cta_label: "Try it",
    cta_url: "yourbrand.com",
    wordmark: "your brand",
  },
  product_image: "product.png",
  mechanism_prop: "spoon",
  bpm: 115,
  beat_split_sec: [3.0, 3.5, 3.0, 2.5],
  fonts: { display: "ArchivoBlack", body: "Inter" },
  music: { src: null, fade_out_frames: 18 },
  show_competitor_strike: true,
};
