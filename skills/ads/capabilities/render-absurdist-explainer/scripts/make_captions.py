#!/usr/bin/env python3
"""make_captions.py — emit a libass .ass, one caption pill per scene (v1).

Ports the validated caption recipe from the Soteri run (production/make_captions.py).
Reads the SAME config.json compose.py reads, so the per-scene target seconds are the
single source of truth — the caption windows are derived from the compose scene table,
guaranteeing they stay in lockstep with the cut.

Caption style (validated on both reference runs):
  Arial 64px, white #FFFFFF, 6px outline #141414, 3px shadow, bottom-third MarginV=330.

Rules:
  - Dialogue start = scene_start + 0.08s (avoids the caption flashing a frame before the
    cut — see the molecule's Failure Modes).
  - A scene with no `caption` (e.g. the end card) is suppressed — its own typeset copy
    carries the message, and two text layers at the same spot are both unreadable.
"""
import argparse, json, os

HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{font},{size},&H00FFFFFF,&H000000FF,&H00141414,&H00000000,-1,0,0,0,100,100,0,0,1,{outline},{shadow},2,90,90,{marginv},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def ts(s):
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = s % 60
    return f"{h}:{m:02d}:{sec:05.2f}"


def main():
    ap = argparse.ArgumentParser(description="Emit the per-scene caption .ass.")
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", help="output .ass path (defaults to config.captions_ass)")
    a = ap.parse_args()

    cfg = json.load(open(a.config))
    scenes = cfg["scenes"]
    cap_cfg = cfg.get("caption_style", {})
    header = HEADER.format(
        font=cap_cfg.get("font", "Arial"),
        size=cap_cfg.get("size", 64),
        outline=cap_cfg.get("outline", 6),
        shadow=cap_cfg.get("shadow", 3),
        marginv=cap_cfg.get("marginv", 330),
    )

    lines, t = [], 0.0
    for s in scenes:
        dur = float(s["target_sec"])
        cap = s.get("caption")
        if cap:
            lines.append(f"Dialogue: 0,{ts(t + 0.08)},{ts(t + dur)},Cap,,0,0,0,,{cap}")
        t += dur
    # end card window has no caption (its typeset copy carries it)

    out = a.out or cfg.get("captions_ass")
    if not out:
        raise SystemExit("no --out and no config.captions_ass set")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w") as f:
        f.write(header + "\n".join(lines) + "\n")
    print(f"captions.ass written — {len(lines)} cues, total {t:.2f}s -> {out}")


if __name__ == "__main__":
    main()
