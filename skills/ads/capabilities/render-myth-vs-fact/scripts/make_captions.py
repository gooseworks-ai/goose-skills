#!/usr/bin/env python3
"""make_captions.py — emit a libass .ass karaoke caption file from Whisper words.

Ports the validated caption recipe from the Clinikally run (build_master.build_ass):
  - <=3 words per cue; close a chunk on a >0.4s word gap, a beat-window edge, OR a
    sentence-ending punctuation mark (. ? !) so the last word of one beat never merges
    with the first of the next.
  - Captions are burned ONLY during caption-allowed beat windows. SUPPRESS_BEATS (the
    proof/footnote beat + the end card) carry their own low-area text — two text layers at
    one spot both go unreadable.
  - The ASS `Format:` line MUST carry the `Name` field or every cue gets a leading-comma
    artifact.

Reads the SAME beat-manifest.json + words-flat.json that compose.py reads, so windows stay
in lockstep with the cut. Suppressed beats come from config.suppress_beats (default: the
proof beat + the end card).

Usage:
  make_captions.py --manifest beat-manifest.json --words words-flat.json --out captions.ass
                   [--config config.json]
"""
import argparse, json
from pathlib import Path


def sec_to_ass(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def caption_windows(beats, suppress):
    return [(b["start"], b["end"]) for b in beats if b["n"] not in suppress]


def in_windows(t, wins):
    return any(s <= t < e for s, e in wins)


def build_ass(beats, words, suppress, style):
    wins = caption_windows(beats, suppress)
    kept = [w for w in words
            if w.get("start") is not None and w.get("end") is not None
            and in_windows((w["start"] + w["end"]) / 2, wins)]

    chunks, cur = [], []
    for w in kept:
        if cur:
            gap = w["start"] - cur[-1]["end"]
            cross = not in_windows((cur[-1]["end"] + w["start"]) / 2, wins)
            sent_end = cur[-1]["text"].rstrip().endswith((".", "?", "!"))
            if gap > 0.4 or len(cur) >= 3 or cross or sent_end:
                chunks.append(cur); cur = []
        cur.append(w)
    if cur:
        chunks.append(cur)

    font = style.get("font", "Inter")
    size = style.get("size", 58)
    prim = style.get("primary", "&H00FFFFFF")     # BGR + alpha; default white
    outline = style.get("outline_colour", "&H00141414")
    back = style.get("back_colour", "&H66000000")
    border = style.get("border_style", 3)          # 3 = opaque box
    outline_w = style.get("outline", 10)
    marginv = style.get("marginv", 150)

    L = []
    L += ["[Script Info]", "ScriptType: v4.00+", "PlayResX: 1080", "PlayResY: 1920",
          "WrapStyle: 2", "ScaledBorderAndShadow: yes", ""]
    L += ["[V4+ Styles]",
          ("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, "
           "OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, "
           "ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
           "MarginR, MarginV, Encoding"),
          (f"Style: Cap,{font},{size},{prim},{prim},{outline},{back},1,0,0,0,100,100,0,0,"
           f"{border},{outline_w},0,2,90,90,{marginv},1"), ""]
    # NOTE: the Events Format line MUST include `Name` (empty field after Style) or every
    # burned cue gets a leading-comma artifact.
    L += ["[Events]",
          "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    for ch in chunks:
        txt = " ".join(w["text"] for w in ch).strip()
        L.append(f"Dialogue: 0,{sec_to_ass(ch[0]['start'])},{sec_to_ass(ch[-1]['end'])},"
                 f"Cap,,0,0,0,,{txt}")
    return "\n".join(L) + "\n", len(chunks), len(kept)


def main():
    ap = argparse.ArgumentParser(description="Emit karaoke .ass from Whisper words.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--words", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--config", help="optional config.json (for suppress_beats + caption_style)")
    a = ap.parse_args()

    manifest = json.load(open(a.manifest))
    beats = manifest["beats"]
    words = json.load(open(a.words))
    cfg = json.load(open(a.config)) if a.config else {}
    # Default suppression: any beat flagged captions:false, plus explicit config list.
    suppress = set(cfg.get("suppress_beats", []))
    suppress |= {b["n"] for b in beats if b.get("captions") is False or b.get("role") == "end-card"}
    style = cfg.get("caption_style", {})

    text, nchunks, nwords = build_ass(beats, words, suppress, style)
    Path(a.out).write_text(text)
    print(f"captions.ass written — {nchunks} chunks from {nwords} words "
          f"(suppressed beats {sorted(suppress)}) -> {a.out}")


if __name__ == "__main__":
    main()
