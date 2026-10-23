#!/usr/bin/env python3
"""SOLVE the grade for a take instead of inheriting a constant. Free, no network.

    python fit_grade.py --take <take.mp4>                       # solve, print the numbers
    python fit_grade.py --take <take.mp4> --write-brand         # store them in brands/<slug>.json

WHY. `phone_look_video.py`'s black lift is a CONSTANT, 0.030, and its docstring says what it was
measured on: "seed 4806 sat at a 1st-percentile of 3.1 ... a 0.030 lift puts it at 9.7". Seed 4806
is not the shipped take. This format has already been bitten once by exactly this shape -- the
ambience bed's speech-free window was two constants measured on seed 4802 that, on seed 4815,
landed in the middle of a spoken line (SKILL.md Critical knowledge 13). A grade constant measured
on one generation has the same failure mode: it outlives the take it was measured on, and the
only symptom is a number quietly out of band.

So this solves it, per take, by rendering through the IDENTICAL chain and measuring the RENDER --
not by predicting what a curve will do. Two probe renders bracket the black lift, one linear
solve lands it, one verification render confirms it. Saturation is solved the same way, from the
face-region measurement, because a scalar `eq=saturation=` moves it near-linearly.

Measured with `bench.py`'s functions, imported rather than copied, so the number this prints and
the number the benchmark table prints are the same number by construction.
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import bench
import brandkit
import paths

HERE = paths.HERE
# Targets: the middle of the real-footage bands. Black 7.0-10.3 -> 8.6. Face saturation is
# re-derived by bench.py from the five real references rather than inherited; --target-sat
# overrides. Do not aim at a band EDGE: a take that lands on the edge falls out of band on the
# next encode.
TARGET_BLACK = 8.6
PROBE_LIFTS = (0.030, 0.065)


def render(src, dst, lift, sat, extra=(), run=None):
    cmd = [sys.executable, str(HERE / "phone_look_video.py"), str(src), str(dst),
           "--black-lift", f"{lift:.4f}", "--saturation", f"{sat:.4f}", "--run", str(paths.run_dir(run)), *extra]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode:
        sys.exit(f"phone_look_video.py failed:\n{r.stdout}\n{r.stderr}")
    return dst


def measure(p):
    pr = bench.probe(p)
    if not pr:
        sys.exit(f"ffprobe found no video stream in {p}")
    va = bench.video_axes(p, pr["dur"])
    if not va:
        sys.exit(f"no frames decoded from {p} -- it did NOT pass")
    return va


def main():
    ap = paths.add_run_arg(argparse.ArgumentParser())
    ap.add_argument("--brand", default=None)
    ap.add_argument("--take", default=None, help="the raw generation to solve for")
    ap.add_argument("--target-black", type=float, default=TARGET_BLACK)
    ap.add_argument("--target-sat", type=float, default=None,
                    help="a face_sat VALUE to hit (not a multiplier); default the midpoint of "
                         "bench.BANDS['face_sat']")
    # The default. `face_sat` is the one inherited band that does NOT reproduce: measured on the
    # five real references it spans 0.168 to 0.311 and only one of them falls inside the quoted
    # 0.140-0.228. A band that four of five real references fail is not a target, and grading
    # toward it desaturates the render away from real footage. So saturation is left alone unless
    # someone asks for a specific value, and the number is reported either way.
    ap.add_argument("--keep-sat", action="store_true", default=True,
                    help="leave saturation at 1.0 and only report it. THE DEFAULT; see above")
    ap.add_argument("--solve-sat", dest="keep_sat", action="store_false",
                    help="solve saturation toward --target-sat as well")
    ap.add_argument("--write-brand", action="store_true",
                    help="store the solved values in the brand config's brand_layer.grade")
    A = ap.parse_args()

    cfg = brandkit.load(A.brand)
    L = paths.layout(A.run)
    take = Path(A.take) if A.take else (
        L["takes"] / f"{brandkit.take_name(cfg, cfg['generation']['seed'])}.mp4")
    if not take.exists():
        sys.exit(f"no take at {take}. projects/ is gitignored; re-fetch it (READINESS.md).")
    lo, hi = bench.BANDS["face_sat"]
    tsat = A.target_sat if A.target_sat is not None else (lo + hi) / 2

    raw = measure(take)
    print(f"raw take   {take.name}")
    print(f"  black {raw['black']:.2f}  face_sat {raw['face_sat']:.3f}  "
          f"detail {raw['detail']:.2f} (at {bench.NORM_W}px)  detail_native {raw['detail_native']:.2f}")
    print(f"targets    black {A.target_black:.2f}  face_sat {tsat:.3f}")

    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        probes = []
        for i, lift in enumerate(PROBE_LIFTS):
            m = measure(render(take, td / f"p{i}.mp4", lift, 1.0, run=A.run))
            probes.append((lift, m))
            print(f"  probe lift {lift:.3f} sat 1.000 -> black {m['black']:.2f}  "
                  f"face_sat {m['face_sat']:.3f}  detail {m['detail']:.2f}")
        (l0, m0), (l1, m1) = probes
        db = m1["black"] - m0["black"]
        if abs(db) < 0.05:
            sys.exit("the two probe lifts produced the same black point; the chain is not "
                     "responding to --black-lift and the solve would be meaningless")
        lift = l0 + (A.target_black - m0["black"]) * (l1 - l0) / db
        lift = max(0.0, min(0.20, lift))
        # Saturation scales near-linearly, so solve it off the sat=1.0 probe at the nearer lift.
        base = m0 if abs(l0 - lift) < abs(l1 - lift) else m1
        sat = 1.0 if A.keep_sat else max(0.2, min(2.0, tsat / max(base["face_sat"], 1e-6)))
        print(f"  solved     lift {lift:.4f}  saturation {sat:.4f}")
        fin = measure(render(take, td / "fit.mp4", lift, sat, run=A.run))
        print(f"  verify     black {fin['black']:.2f}  face_sat {fin['face_sat']:.3f}  "
              f"detail {fin['detail']:.2f}  detail_native {fin['detail_native']:.2f}")

    ok = True
    for key, v in (("black", fin["black"]), ("face_sat", fin["face_sat"]),
                   ("detail", fin["detail"])):
        b = bench.BANDS[key]
        mark = "IN BAND" if b[0] <= v <= b[1] else "OUT OF BAND"
        if mark != "IN BAND":
            ok = False
        print(f"  {key:<10} {v:.3f}  {b[0]}..{b[1]}  {mark}")
    if not ok:
        print("\nNOT every axis landed in band. detail is not a grade parameter -- it is a "
              "property of the generation and of the scale it is measured at; see bench.py "
              "METHOD 1. Record the miss, do not chase it with a sharpen or a blur: an 0.4 "
              "unsharp added for 'phone ISP halo' once pushed a finished cut to 695 laplacian "
              "against 530 for the reference, i.e. the finishing pass was adding the tell.")

    if A.write_brand:
        p = Path(cfg["_path"])
        d = json.loads(p.read_text(encoding="utf-8"))
        d.setdefault("brand_layer", {})["grade"] = {
            "black_lift": round(lift, 4), "saturation": round(sat, 4),
            "_comment": f"SOLVED against {take.name} by fit_grade.py, not a constant. Per-take: "
                        f"re-solve after any new generation. Verified black "
                        f"{fin['black']:.2f} (band 7.0-10.3), face_sat {fin['face_sat']:.3f} "
                        f"(band {bench.BANDS['face_sat'][0]}-{bench.BANDS['face_sat'][1]})."}
        p.write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")
        print(f"\nwrote brand_layer.grade into {p}")


if __name__ == "__main__":
    main()
