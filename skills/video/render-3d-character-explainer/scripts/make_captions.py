#!/usr/bin/env python3
"""make_captions.py — emit a libass .ass, one caption pill per scene (deterministic v1).

Reads the SAME config.json compose.py reads, so the per-scene target seconds are the
single source of truth — caption windows are derived from the compose scene table and
stay in lockstep with the cut. This is the FREE, deterministic caption path.

NOTE the format's recipe (upstream, paid) can instead burn WORD-LEVEL energy-pop captions
from Whisper run on the rendered narration audio (see the format's molecule). That word-
level pass needs a transcription model and is NOT part of this free assembler — point
config.captions_ass at that externally-produced .ass to use it, or use this per-scene
fallback. Either way compose.py just burns whatever .ass it is handed, last.

Caption style (validated on the reference runs):
  Arial 64px, white #FFFFFF, 6px outline #141414, 3px shadow, bottom-third MarginV=330.

Rules:
  - Dialogue start = scene_start + 0.08s (avoids the caption flashing a frame before the
    cut).
  - A scene with no `caption` (e.g. an end-card / product beat carrying its own typeset
    copy) is suppressed — two text layers at one spot are both unreadable.
"""
import argparse, json, os

HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: {resx}
PlayResY: {resy}
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
        resx=int(cfg.get("width", 1080)),
        resy=int(cfg.get("height", 1920)),
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

    out = a.out or cfg.get("captions_ass")
    if not out:
        raise SystemExit("no --out and no config.captions_ass set")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w") as f:
        f.write(header + "\n".join(lines) + "\n")
    print(f"captions.ass written — {len(lines)} cues, total {t:.2f}s -> {out}")


if __name__ == "__main__":
    main()
