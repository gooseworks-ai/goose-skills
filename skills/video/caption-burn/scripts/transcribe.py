#!/usr/bin/env python3
"""Word-level transcript of a video or audio file, through the GooseWorks proxy (fal
Whisper, bills the Ads agent; a few cents a minute).

    transcribe.py --media reel.mp4 --out reel.words.json [--offset 0] [--language en]

Writes [{"text", "start", "end"}, ...] in the media's own time (+ --offset). Captions and
line alignment are timed from THIS, measured on the finished audio, never from the
script's estimate: a generated voice never speaks at the estimated pace.
"""
import argparse
import json
import pathlib
import subprocess
import tempfile

from media_proxy import fal_upload, fal_whisper


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--media", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--offset", type=float, default=0.0)
    ap.add_argument("--language", default="en")
    a = ap.parse_args()
    with tempfile.TemporaryDirectory() as td:
        mp3 = pathlib.Path(td) / "audio.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.media, "-vn", "-ac", "1", "-ar", "16000",
                        "-b:a", "64k", str(mp3)], check=True)
        url = fal_upload(mp3, "audio/mpeg")
        words = fal_whisper(url, language=a.language, timeout_s=900)
    out = []
    for w in words:
        if w.get("start") is None or w.get("end") is None or not w.get("text"):
            continue
        out.append({"text": w["text"], "start": round(w["start"] + a.offset, 3),
                    "end": round(w["end"] + a.offset, 3)})
    pathlib.Path(a.out).write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print("[transcribe] %d words, %.2f-%.2fs -> %s" % (len(out), out[0]["start"] if out else 0,
                                                     out[-1]["end"] if out else 0, a.out))
    print("  " + " ".join(w["text"] for w in out)[:300])


if __name__ == "__main__":
    main()
