#!/usr/bin/env python3
"""Measure the internal shot lengths of a finished file. Free, ffmpeg only.

    python measure-pace.py <file.mp4> [<file2.mp4> ...] [--thresh 0.30] [--trim 2.2]

The pace gap in SKILL.md item 15 is a MEASUREMENT, and it has to be re-measurable or it is an
anecdote. This reads the cuts off the file with the same ffmpeg scene detector check-cut.py
uses, at the same threshold, and prints shot lengths, the median and the final shot.

--trim drops that many seconds off the end before measuring, so a render that carries a 2.2s
end card is not counted as having one very long final shot. Measure the RENDER, per CLAUDE.md,
but do not count the brand layer as pace.

Reference bar, measured on three real references (refs/REFERENCES.md):
    Salary Transparent Street 1.60s   Chris Klemens 1.62s   SubwayTakes 1.54s
"""
import argparse
import subprocess
import sys


def sh(cmd):
    return subprocess.run([str(x) for x in cmd], capture_output=True, text=True)


def duration(path):
    r = sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])
    try:
        return float(r.stdout.strip())
    except ValueError:
        sys.exit(f"ffprobe could not read a duration from {path}: {r.stderr.strip()[:200]}")


def cuts(path, thresh):
    r = sh(["ffmpeg", "-v", "error", "-i", path, "-vf",
            f"select='gt(scene,{thresh})',metadata=print:file=-", "-fps_mode", "vfr",
            "-f", "null", "-"])
    if r.returncode:
        sys.exit(f"ffmpeg scene detect failed on {path}: {r.stderr[-300:]}")
    return [float(ln.split("pts_time:")[1].split()[0])
            for ln in r.stdout.splitlines() if "pts_time:" in ln]


def median(xs):
    s = sorted(xs)
    n = len(s)
    if not n:
        return None
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--thresh", type=float, default=0.30,
                    help="scene-change threshold; 0.30 is what check-cut.py uses")
    ap.add_argument("--trim", type=float, default=0.0,
                    help="seconds of end card to exclude from the measurement")
    A = ap.parse_args()
    for f in A.files:
        dur = duration(f) - A.trim
        cs = [c for c in cuts(f, A.thresh) if 0.4 < c < dur]
        bounds = [0.0] + cs + [dur]
        lens = [b - a for a, b in zip(bounds, bounds[1:])]
        print(f"{f}")
        print(f"  measured over {dur:.2f}s (trimmed {A.trim:.2f}s), {len(lens)} shots")
        print("  cuts   " + (", ".join(f"{c:.2f}" for c in cs) or "(none)"))
        print("  shots  " + ", ".join(f"{x:.2f}" for x in lens))
        print(f"  MEDIAN {median(lens):.2f}s   FINAL {lens[-1]:.2f}s   "
              f"(real references 1.54-1.62s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
