#!/usr/bin/env python3
"""Measure the FRAMING in a rendered master.  FREE, no network, no generation.

`gates.gate_framing_variety` measures the PLAN, which is the point: it fails
before a paid call. This script is the other half, and it measures the file.

Two things are measured, both from pixels:

  seam        for every split cut, the row where the gap band sits. The gap is
              drawn in `edit.split_screen.gap_hex`, so it is the only run of
              near-black full-width rows in the frame. If the plan moved the
              seam (reference technique 2, dod-blender 0.62 -> 0.37) and the
              render did not, this is where that shows up.
  grid pitch  the spacing of the stand-in clips' drawgrid, in output pixels. A
              tighter crop magnifies the grid, so the pitch is a direct readout
              of the crop SCALE, and the phase is a readout of its offset. This
              only works on a `--no-paid` preview, because real footage has no
              grid in it. On real footage read the seam column and watch the
              file.

Usage: check_framing_render.py --config config.json --run-dir <run>
                              [--master master-preview.mp4]
"""
from __future__ import annotations

import argparse
import json
import pathlib
import statistics
import subprocess
import tempfile

from PIL import Image
import sys as _sys, pathlib as _pl
_sys.path.insert(0, str(_pl.Path(__file__).resolve().parent))
import config_io  # noqa: E402


def frame_at(src: pathlib.Path, t: float, out: pathlib.Path) -> Image.Image:
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.3f}",
                    "-i", str(src), "-frames:v", "1", str(out)],
                   check=True, capture_output=True)
    return Image.open(out).convert("L")


def seam_rows(img: Image.Image, gap_px: int,
              dark_max: int = None) -> list[tuple[int, int]]:
    """Runs of near-black full-width rows, as (start, length).

    `dark_max` is the brightest a row may be and still count as the gap. It
    used to be a hard 8, which assumed the gap is drawn pure black and STAYS
    pure black. It does not: a grade applied after the vstack lifts the whole
    picture, the gap with it, so an approved grade that lifts blacks off zero
    made every seam undetectable and this check reported mismatches for a
    render that was correct. The caller passes the floor measured off the
    frame instead.
    """
    W, H = img.size
    px = img.load()
    step = max(1, W // 64)
    runs, start = [], None
    for y in range(H):
        dark = max(px[x, y] for x in range(0, W, step)) <= (
            8 if dark_max is None else dark_max)
        if dark and start is None:
            start = y
        elif not dark and start is not None:
            runs.append((start, y - start))
            start = None
    if start is not None:
        runs.append((start, H - start))
    # the gap is a thin band, not the end card and not a letterbox
    return [r for r in runs if 1 <= r[1] <= max(gap_px * 3, 12)
            and 8 < r[0] < H - 8]


def grid_pitch(img: Image.Image, y0: int) -> tuple[float | None, int | None]:
    """Spacing and phase of the bright vertical gridlines.

    Several scanlines are tried, because a single one can land exactly ON a
    horizontal gridline, where the whole row is bright and no columns stand out.
    That is a property of the sampler, not of the render, and reading one
    scanline reported the full-frame framings as unmeasurable.
    """
    for dy in (0, 37, -53, 71, -97):
        p = _pitch_on(img, y0 + dy)
        if p[0] is not None:
            return p
    return None, None


def _pitch_on(img: Image.Image, y: int) -> tuple[float | None, int | None]:
    W, H = img.size
    if not (0 <= y < H):
        return None, None
    px = img.load()
    row = [px[x, y] for x in range(W)]
    base = statistics.median(row)
    cols, run = [], []
    for x, v in enumerate(row):
        if v > base + 14:
            run.append(x)
        elif run:
            cols.append(sum(run) // len(run))
            run = []
    if run:
        cols.append(sum(run) // len(run))
    if len(cols) < 3:
        return None, None
    diffs = [b - a for a, b in zip(cols, cols[1:])]
    return round(statistics.median(diffs), 1), cols[0]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--master", default=None)
    a = ap.parse_args()

    cfg = config_io.load(a.config, a.preset)
    run = pathlib.Path(a.run_dir)
    plan = json.loads((run / "cutplan.json").read_text(encoding="utf-8"))
    master = pathlib.Path(a.master) if a.master else run / "master-preview.mp4"
    if not master.exists():
        raise SystemExit(f"[err] {master} is missing; render it first")

    ss = cfg["edit"]["split_screen"]
    gap = int(ss.get("gap_px", 6))
    usable = cfg["height"] - gap
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="skit-framing-"))

    print(f"[render] {master.name}")
    print()
    print("SPLIT SEAMS, measured in the render")
    print(f"  {'cut':<8} {'planned':<22} {'top_h want':>10} "
          f"{'gap row got':>12} {'verdict':>8}")
    seen_seams = set()
    bad = 0
    for k, c in enumerate(plan["cuts"]):
        if c["mode"] != "split":
            continue
        t = (c["start"] + c["end"]) / 2.0
        img = frame_at(master, t, tmp / f"s{k}.png")
        want = int(round(usable * float(c["seam"]) / 2)) * 2
        # The gap's own level, read off this frame: the darkest row present
        # plus a little headroom. Survives any grade that lifts blacks.
        _px = img.convert("L").load()
        _W, _H = img.size
        _floor = min(max(_px[x, y] for x in range(0, _W, max(1, _W // 64)))
                     for y in range(_H))
        if gap > 0:
            runs = seam_rows(img, gap, dark_max=max(8, _floor + 6))
            got = min(runs, key=lambda r: abs(r[0] - want))[0] if runs else None
        else:
            # With no gap band there is nothing dark to find, and SEARCHING for
            # the strongest edge is the wrong test: the panel below brings its
            # own content, and in the $0 stand-in its grid starts three rows
            # under the seam and outscores the boundary itself.
            #
            # The seam's row is not in doubt when gap is 0 -- it is arithmetic.
            # What has to be proven is that a boundary is actually THERE, so
            # this asserts a discontinuity at the planned row instead of
            # hunting for one: the jump across it must stand out against the
            # ordinary row-to-row jumps around it.
            # In COLOUR, not luma. The two panels can differ strongly in hue
            # and barely at all in brightness: the $0 preview puts a blue
            # panel above a green one, whose grey levels are within 1.4 of
            # each other, and a luma-only read called a correctly placed seam
            # a mismatch while latching onto a grid line 24 rows away.
            g = img.convert("RGB").load()
            Wd, Hd = img.size
            step = max(1, Wd // 64)
            xs = list(range(0, Wd, step))
            jump = lambda y: sum(sum(abs(a - b) for a, b in zip(g[x, y], g[x, y - 1]))
                                 for x in xs) / len(xs)
            lo, hi = max(1, want - 24), min(Hd - 1, want + 24)
            near = sorted(jump(y) for y in range(lo, hi) if y != want)
            typical = near[len(near) // 2] if near else 0.0
            here = jump(want) if 0 < want < Hd else 0.0
            # Can a boundary be seen here AT ALL? Compare a band of the top
            # panel against a band of the bottom one. If the two panels are
            # near-identical the seam is invisible by definition, and no
            # threshold on a single row can recover it. That happens in the $0
            # preview, where two stand-ins can land on the same flat colour,
            # and it is not a defect in the render.
            band = lambda a, b: [tuple(sum(g[x, y][ch] for y in range(a, b)) / (b - a)
                                       for ch in (0, 1, 2)) for x in xs]
            above, below = band(max(1, want - 40), want - 4), band(want + 4, min(Hd, want + 40))
            contrast = sum(sum(abs(a - b) for a, b in zip(u, v))
                           for u, v in zip(above, below)) / len(xs)
            if contrast < 3.0:
                got = "n/a"
            elif here >= max(2.0, typical * 1.8):
                got = want
            else:
                got = None
        if got == "n/a":
            ok = None            # not assessed, not counted against the run
        else:
            ok = got is not None and abs(got - want) <= 2
        bad += 0 if ok is not False else 1
        seen_seams.add(c["seam"])
        print(f"  {c['beat']}.{c['idx']:<6} {c['framing']:<22} {want:>10} "
              f"{str(got):>12} "
              f"{('ok' if ok else 'MISMATCH') if ok is not None else 'n/a':>8}")
    print(f"  {len(seen_seams)} distinct seam ratio(s) on screen: "
          f"{sorted(seen_seams)}")
    print()

    print("FRAMING CROPS, read off the stand-in grid (preview only)")
    print(f"  {'framing':<22} {'crop w':>7} {'pitch px':>9} {'phase':>6}")
    per_framing: dict[str, tuple] = {}
    for k, c in enumerate(plan["cuts"]):
        if c["mode"] == "split" or c["framing"] in per_framing:
            continue
        t = (c["start"] + c["end"]) / 2.0
        img = frame_at(master, t, tmp / f"c{k}.png")
        pitch, phase = grid_pitch(img, cfg["height"] // 2)
        per_framing[c["framing"]] = (c["crop"]["w"], pitch, phase)
    for name, (w, pitch, phase) in sorted(per_framing.items()):
        print(f"  {name:<22} {w:>7} {str(pitch):>9} {str(phase):>6}")
    pitches = {p for _, p, _ in per_framing.values() if p}
    print(f"  {len(per_framing)} single framing(s) sampled, "
          f"{len(pitches)} distinct grid pitch(es): {sorted(pitches)}")
    print()
    st = plan["framing_stats"]
    print(f"[plan]   {st['n_framings']} distinct framings, "
          f"{st['per_10s']} per 10s, biggest share "
          f"{st['biggest_share'] * 100:.1f}%")
    print(f"[render] {bad} seam mismatch(es)")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
