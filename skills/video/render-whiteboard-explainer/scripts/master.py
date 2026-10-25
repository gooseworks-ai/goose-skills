#!/usr/bin/env python3
"""Lay the voiceover onto the render and master it. Free, local.

    python master.py --project <dir> [--slug <name>]

This is `create-sketchbook-explainer-video/scripts/assemble.py`'s audio chain, which is the one
that produced every shipped master in this repo at -14.1 LUFS and -1.5 dBTP. It is reproduced
here rather than referenced because inventing a variant of it has gone wrong twice:

  - a single dynamic loudnorm landed -15.4 LUFS on this voice
  - a corrective gain into a limiter at the same ceiling just squashed: +2.77 dB moved the
    measurement 0.6 dB
  - `alimiter`'s `limit` is a SAMPLE-peak ceiling and does not bound the true peak. A limiter
    at -2 dBFS passed +0.4 dBTP

The order is what matters: gentle compression BEFORE a measured linear two-pass loudnorm, then
any remainder through the limiter.

`apad` and `-shortest` go together. `apad` alone never ends - it once wrote a 38 MB file and
kept going. `-shortest` alone cuts the video at the last word and throws away the payoff hold.
"""
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

PRE = "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2"


def measure(p):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(p), "-af",
                        "loudnorm=print_format=summary", "-f", "null", "-"],
                       capture_output=True, text=True)
    out = r.stderr + r.stdout
    # [-+]: a true peak above 0 dBTP prints as "+0.1", and a minus-only pattern crashes on
    # exactly the file that most needs catching.
    g = lambda k: float(re.search(k + r":\s*([-+]?\d+\.?\d*)", out).group(1))
    return g("Input Integrated"), g("Input True Peak")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, type=Path)
    ap.add_argument("--slug", default=None)
    ap.add_argument("--video", default="working/w3.mp4")
    A = ap.parse_args()
    P = A.project.resolve()
    V, VO = P / A.video, P / "voice" / "vo.mp3"
    if not V.exists():
        sys.exit(f"no render at {V}")
    out = P / "output" / f"{A.slug or P.name}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)

    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(VO), "-af",
                        PRE + ",loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    m = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    LN = ("loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:"
          "measured_thresh=%s:offset=%s:linear=true"
          % (m["input_i"], m["input_tp"], m["input_lra"], m["input_thresh"],
             m["target_offset"]))

    tmp = P / "working" / "_master.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(V), "-i", str(VO),
                    "-map", "0:v", "-map", "1:a", "-shortest", "-c:v", "copy",
                    "-af", PRE + "," + LN + ",aresample=48000,apad",
                    "-c:a", "aac", "-b:a", "192k", str(tmp)], check=True)
    I, TP = measure(tmp)
    gain = round(-14.0 - I, 2)
    if abs(gain) >= 0.15:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-af",
                        "volume=%+.2fdB,alimiter=limit=0.79:level=false" % gain,
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", str(out)], check=True)
        print("corrective gain %+.2f dB (measured %.1f LUFS)" % (gain, I))
    else:
        os.replace(tmp, out)
    tmp.unlink(missing_ok=True)

    I2, TP2 = measure(out)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                              "-of", "csv=p=0", str(out)],
                             capture_output=True, text=True).stdout)
    w = json.loads((P / "voice" / "words.json").read_text(encoding="utf-8"))
    w = w["words"] if isinstance(w, dict) else w
    w = [x for x in w if x["w"].strip()]
    hold = d - w[-1]["e"]
    print(f"wrote {out}")
    print(f"  {d:.2f}s   {I2:.1f} LUFS   {TP2:.1f} dBTP   hold {hold:.2f}s")
    bad = []
    if abs(I2 + 14.0) > 0.7:
        bad.append("loudness")
    if TP2 > -1.0:
        bad.append("true peak")
    if hold < 1.2:
        bad.append("hold")
    print("  GATE:", "PASS" if not bad else "FAIL " + ", ".join(bad))
    if bad:
        sys.exit(1)


if __name__ == "__main__":
    main()
