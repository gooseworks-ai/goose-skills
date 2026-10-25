#!/usr/bin/env python3
"""Measure b-roll liveliness, and verify the CTA reveal, on a FINISHED file.

Both checks read the rendered video, never the inputs. That is deliberate: the
reference build shipped a dead b-roll twice because the clip "looked like the
reference" in a contact sheet while measuring 18x less motion than the source.

Motion is the mean absolute frame-to-frame difference inside the b-roll window,
on a 160x160 greyscale downscale.

  mean  overall liveliness
  p90   typical busy moments  <- the useful one
  max   biggest single jump (a subject entering or leaving frame)

Usage:
    python measure_motion.py final.mp4 --reference source.mp4
    python measure_motion.py final.mp4 --cta-at 2.0
"""
import argparse, subprocess, sys
import numpy as np

BROLL_CROP = "1080:1073:0:672"      # the b-roll window inside a 1080x1920 frame
CTA_CROP = "760:40:160:632"         # the CTA line's strip on the card
MIN_MEAN = 1.5                      # below this the b-roll reads as a still photo


def motion(path, crop=BROLL_CROP, size=160):
    cmd = ["ffmpeg", "-v", "error", "-i", str(path),
           "-vf", f"crop={crop},scale={size}:{size},format=gray", "-f", "rawvideo", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    px = size * size
    n = len(raw) // px
    if n < 2:
        sys.exit(f"ERROR: could not read frames from {path}")
    a = np.frombuffer(raw[:n * px], dtype=np.uint8).reshape(n, size, size).astype(int)
    d = np.abs(np.diff(a, axis=0)).mean(axis=(1, 2))
    return d.mean(), np.percentile(d, 90), d.max()


def strip_brightness(path, t, crop=CTA_CROP):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(t), "-i", str(path), "-frames:v", "1",
           "-vf", f"crop={crop},format=gray", "-f", "rawvideo", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    return sum(raw) / len(raw) if raw else 0.0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--reference", help="source ad to compare motion against")
    ap.add_argument("--cta-at", type=float, help="expected CTA reveal time in seconds")
    args = ap.parse_args()

    m, p90, mx = motion(args.video)
    print(f"b-roll motion  mean={m:.2f}  p90={p90:.2f}  max={mx:.2f}")

    failed = False
    if m < MIN_MEAN:
        print(f"  FAIL: mean {m:.2f} < {MIN_MEAN} -- this b-roll reads as a still photograph.")
        failed = True

    if args.reference:
        rm, rp, rx = motion(args.reference)
        print(f"reference      mean={rm:.2f}  p90={rp:.2f}  max={rx:.2f}")
        print(f"  ratio mean={rm/m:.2f}x  p90={rp/p90:.2f}x")
        if not 0.6 <= m / rm <= 1.8:
            print("  FAIL: motion is outside 0.6x-1.8x of the reference.")
            failed = True

    if args.cta_at is not None:
        before = strip_brightness(args.video, args.cta_at - 0.1)
        after = strip_brightness(args.video, args.cta_at)
        print(f"CTA strip  t-0.1s={before:.2f}  t={args.cta_at}s={after:.2f}")
        if not (before < 1.0 and after > 5.0):
            print(f"  FAIL: CTA does not hard-cut in at {args.cta_at}s.")
            failed = True

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
