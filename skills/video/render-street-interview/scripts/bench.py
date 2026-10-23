#!/usr/bin/env python3
"""THE BENCHMARK. One piece of code measures OUR takes and the REAL references on the same axes.

    python bench.py                         # everything, prints the table
    python bench.py --set refs              # references only
    python bench.py --set ours-raw          # raw generations only
    python bench.py --only 4815,sts,bare    # substring filter on the label
    python bench.py --json bench.json       # machine-readable, for a later diff
    python bench.py --quick                 # skip audio (fast, video axes only)

WHY THIS FILE EXISTS. Every realism number this format has ever quoted was measured by a
different ad-hoc command on a different subset of files, and two of the bands were derived from
ONE frame of each reference compared against our RAW take -- finished re-uploaded references
against a raw 720p generation, which is not like-for-like (SKILL.md Critical knowledge 5 says so
in writing). A band you cannot reproduce is an assertion. This script is the reproduction.

METHOD, and the three places it deliberately differs from `check-cut.py`:

 1. DETAIL IS MEASURED AT A FIXED WIDTH. `check_realism()` runs the laplacian on the frame at its
    NATIVE resolution, so the same footage scores differently at 720p and at 1080p: upscaling a
    720p generation to 1080x1920 spreads every edge over more pixels and LOWERS the number
    without touching the picture. Measured here: the same take scores ~1.6x higher raw than
    finished, purely from the scale. So `detail` below is computed after resizing every frame to
    720 px wide, and `detail_native` is kept beside it to show the size of that artifact. Compare
    `detail` across rows; `detail_native` is only comparable between files of equal resolution.
 2. CUTS ARE COUNTED AT TWO THRESHOLDS. 0.30 is what `check-cut.py` and REFERENCES.md use. This
    format's prompt also pins the subject's position, size and background across its own internal
    cuts ("EVERY PERSON STANDS IN THE SAME PLACE IN THE FRAME ... so cutting from one to the next
    does not move them"), which is exactly the frame-to-frame difference a scene detector
    measures. A prompt engineered to make consecutive shots look alike will under-report its own
    cuts. 0.12 is the falsifier for that, and it is applied to the references too so the
    comparison stays like-for-like.
 3. FACE-REGION SATURATION is new here. Crop x in [0.25,0.75], y in [0.10,0.45] -- the upper
    centre, where a head-to-hips vertical framing puts the face -- and average per-pixel
    S = (max-min)/max over RGB. Mean over the sampled frames.

Everything else follows `check-cut.py`'s definitions on purpose: black point is the 1st percentile
of grey, the per-shot ambience floor is the 20th-percentile short-window RMS INSIDE each shot (not
"level either side of a cut", which measured the single take and the assembled cut exactly
backwards), and loudness comes off ebur128.

NO NETWORK, NO SPEND. Reads files that already exist on disk.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

import paths

NORM_W = 720          # every detail measurement is taken at this width. See METHOD 1.
N_FRAMES = 12
FACE_BOX = (0.25, 0.75, 0.10, 0.45)   # x0, x1, y0, y1 as fractions. See METHOD 3.
THRESH = 0.30         # the threshold check-cut.py and REFERENCES.md use
THRESH_LOW = 0.12     # the falsifier for position-pinned cuts. See METHOD 2.

# The real bands this project has quoted, kept here so the table can mark in/out of band.
# face_sat is re-derived by this script rather than inherited: it appears in no file on disk.
BANDS = {
    "detail": (4.76, 9.60),
    "black": (7.0, 10.3),
    "face_sat": (0.140, 0.228),
    "median_shot": (1.54, 1.62),
    "floor": (-52.0, -32.0),
}


# -- the inventory --------------------------------------------------------------------------
# Labelled and grouped so a row in the printed table can be traced back to a file. Anything
# missing from disk is reported as missing rather than skipped silently: `projects/` is
# gitignored, so a fresh checkout has none of this.
def inventory(run: Path):
    T, O, R = run / "working" / "takes", run / "output", run / "refs"
    inv = []

    def add(group, label, p):
        inv.append({"group": group, "label": label, "path": Path(p)})

    for name, f in [("sts", "sts.webm"), ("klemens", "klemens.webm"), ("subway", "subway.webm")]:
        add("ref-real", name, R / f)
    # Arcads = real LICENSED actors, which is why it is usable as a real-footage target at all.
    add("ref-real", "arcads-1", R / "tools" / "arcads-1.mp4")
    add("ref-real", "arcads-2", R / "tools" / "arcads-2.mp4")

    # Every single-generation take, in seed order. DISCOVERED, never a hardcoded range:
    # this was `range(4801, 4816)` and it silently omitted seed 4816 the moment it existed,
    # so the one take the benchmark was built to judge was the one row missing from the table.
    # A benchmark that cannot see the newest take is worse than no benchmark.
    for p in sorted(T.glob("ld-single-seed*.mp4")):
        seed = p.stem.replace("ld-single-seed", "")
        add("ours-raw", f"g{seed}", p)
    # the pre-single-generation era, kept because the stitching rejections are the baseline
    for s in (4501, 4502, 4503):
        add("ours-raw-old", f"ms{s}", T / f"ld-multishot-t2v-seed{s}.mp4")
    add("ours-raw-old", "long4601", T / "ld-long-seed4601.mp4")
    add("ours-raw-old", "broll4701", T / "ld-broll-seed4701.mp4")

    for look in ("bare", "subway", "clean", "karaoke", "doc"):
        add("ours-final", f"look-{look}", O / "looks" / f"street-ld-{look}.mp4")
    add("ours-final", "4812-final", O / "looks" / "street-4812-final.mp4")
    add("ours-final", "4814-final", O / "looks" / "street-seed4814-final.mp4")
    add("ours-final", "LD-FINAL", O / "street-interview-liquid-death-FINAL.mp4")
    # the REJECTED assembled cut. It is in the table on purpose: it is the only row where a
    # measured axis (ambience floor -13 dB) matches a rejection the operator actually gave.
    add("ours-rejected", "assembled", O / "street-liquid-death.mp4")
    return inv


# -- primitives -----------------------------------------------------------------------------
def sh(cmd):
    return subprocess.run([str(c) for c in cmd], capture_output=True, text=True,
                          encoding="utf-8", errors="replace")


def probe(p):
    r = sh(["ffprobe", "-v", "error", "-show_entries",
            "stream=width,height,r_frame_rate,codec_type", "-show_entries", "format=duration",
            "-of", "json", p])
    try:
        d = json.loads(r.stdout)
    except json.JSONDecodeError:
        return None
    v = next((s for s in d.get("streams", []) if s.get("codec_type") == "video"), None)
    if not v:
        return None
    num, den = (v["r_frame_rate"].split("/") + ["1"])[:2]
    has_a = any(s.get("codec_type") == "audio" for s in d.get("streams", []))
    return {"w": v["width"], "h": v["height"],
            "fps": float(num) / float(den or 1),
            "dur": float(d["format"]["duration"]), "audio": has_a}


def cuts(p, thresh):
    r = sh(["ffmpeg", "-v", "error", "-i", p, "-vf",
            f"select='gt(scene,{thresh})',metadata=print:file=-", "-fps_mode", "vfr",
            "-f", "null", "-"])
    if r.returncode:
        raise RuntimeError("scene detect failed: " + r.stderr[-300:])
    return [float(ln.split("pts_time:")[1].split()[0])
            for ln in r.stdout.splitlines() if "pts_time:" in ln]


def shot_lengths(cut_times, dur):
    """Shot lengths from cut times, with the file's own start and end as boundaries."""
    b = [0.0] + [c for c in cut_times if 0.05 < c < dur - 0.05] + [dur]
    return [b[i + 1] - b[i] for i in range(len(b) - 1)]


def rgb_frame(p, t):
    """One frame at t, native resolution, as float32 RGB. Returns None past the end."""
    r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", str(p),
                        "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"],
                       capture_output=True)
    if not r.stdout:
        return None
    import io
    try:
        im = Image.open(io.BytesIO(r.stdout)).convert("RGB")
    except Exception:
        return None
    return im


def lap(gray):
    """The same forward-difference laplacian check-cut.py uses, so the numbers are comparable."""
    g = gray
    return float((abs(g[1:, :-1] - g[:-1, :-1]) + abs(g[:-1, 1:] - g[:-1, :-1])).mean())


def video_axes(p, dur, n=N_FRAMES):
    det, det_nat, blk, sat = [], [], [], []
    got = 0
    for i in range(n):
        t = dur * (i + 1) / (n + 1)
        im = rgb_frame(p, t)
        if im is None:
            continue
        got += 1
        a = np.asarray(im).astype(np.float32)
        gnat = a.mean(2)
        det_nat.append(lap(gnat))
        blk.append(float(np.percentile(gnat, 1)))
        # face-region saturation, on the NATIVE frame (a crop fraction is resolution-free)
        H, W = gnat.shape
        x0, x1, y0, y1 = FACE_BOX
        c = a[int(H * y0):int(H * y1), int(W * x0):int(W * x1), :]
        mx, mn = c.max(2), c.min(2)
        sat.append(float(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0.0).mean()))
        # detail at a FIXED width. See METHOD 1: this is the only detail number that is
        # comparable between a raw 720p take and a 1080p finished render.
        nh = max(1, round(im.height * NORM_W / im.width))
        gn = np.asarray(im.resize((NORM_W, nh), Image.BILINEAR)).astype(np.float32).mean(2)
        det.append(lap(gn))
    if not got:
        return None
    return {"detail": float(np.mean(det)), "detail_native": float(np.mean(det_nat)),
            "black": float(np.mean(blk)), "face_sat": float(np.mean(sat)), "frames": got}


def shot_floor(p, start, end):
    """20th-percentile short-window RMS inside one shot. check-cut.py's definition, verbatim."""
    r = sh(["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{max(end - start, 0.2):.3f}",
            "-i", p, "-af",
            "aresample=16000,asetnsamples=1600,astats=metadata=1:reset=1,"
            "ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-", "-f", "null", "-"])
    vals = [float(ln.split("=")[1]) for ln in (r.stdout + r.stderr).splitlines()
            if "lavfi.astats.Overall.RMS_level=" in ln]
    vals = [v for v in vals if v > -120]
    return float(np.percentile(vals, 20)) if vals else None


def loudness(p):
    r = sh(["ffmpeg", "-v", "info", "-i", p, "-af", "ebur128=peak=true", "-f", "null", "-"])
    txt = r.stderr
    lufs = tp = None
    if "Summary:" in txt:
        tail = txt.split("Summary:")[-1]
        for ln in tail.splitlines():
            s = ln.strip()
            if s.startswith("I:") and "LUFS" in s:
                lufs = float(s.split()[1])
            if s.startswith("Peak:") and "dBFS" in s:
                tp = float(s.split()[1])
    return lufs, tp


def floors(p, cut_times, dur, max_shots=12):
    """Per-shot floor for the first `max_shots` shots. A 122s reference has 64 of them and the
    point of the number is the SPREAD, not an exhaustive list."""
    b = [0.0] + [c for c in cut_times if 0.05 < c < dur - 0.05] + [dur]
    segs = [(b[i], b[i + 1]) for i in range(len(b) - 1)][:max_shots]
    vals = [v for v in (shot_floor(p, s, e) for s, e in segs if e - s > 0.25) if v is not None]
    return vals


# -- one row --------------------------------------------------------------------------------
def measure(item, quick=False):
    p = item["path"]
    row = dict(item)
    row["path"] = str(p)
    if not p.exists():
        row["error"] = "MISSING on disk (projects/ is gitignored; re-fetch before trusting a row)"
        return row
    if p.stat().st_size < 4096:
        row["error"] = f"{p.stat().st_size} bytes -- git-lfs pointer, not a video"
        return row
    pr = probe(p)
    if not pr:
        row["error"] = "ffprobe found no video stream"
        return row
    row.update(pr)
    try:
        c30 = cuts(p, THRESH)
        c12 = cuts(p, THRESH_LOW)
    except RuntimeError as e:
        row["error"] = str(e)
        return row
    sl30 = shot_lengths(c30, pr["dur"])
    sl12 = shot_lengths(c12, pr["dur"])
    row.update({
        "cuts30": len(c30), "cuts12": len(c12), "cut_times30": [round(c, 2) for c in c30],
        "shots30": len(sl30), "shots12": len(sl12),
        "median_shot": float(np.median(sl30)), "mean_shot": float(np.mean(sl30)),
        "longest_shot": float(max(sl30)), "shortest_shot": float(min(sl30)),
        "cuts_per_s": len(c30) / pr["dur"],
        "median_shot_low": float(np.median(sl12)),
        "cuts_per_s_low": len(c12) / pr["dur"],
    })
    va = video_axes(p, pr["dur"])
    if va:
        row.update(va)
    else:
        row["error_video"] = "no frames decoded (it did NOT pass)"
    if not quick and pr["audio"]:
        fl = floors(p, c30, pr["dur"])
        if fl:
            row["floor_min"], row["floor_max"] = min(fl), max(fl)
            row["floor_median"] = float(np.median(fl))
            row["floor_n"] = len(fl)
        lufs, tp = loudness(p)
        row["lufs"], row["true_peak"] = lufs, tp
    elif not pr["audio"]:
        row["no_audio"] = True
    return row


def band_mark(v, key):
    if v is None:
        return " "
    lo, hi = BANDS[key]
    return "." if lo <= v <= hi else ("-" if v < lo else "+")


def fmt(rows):
    """One table. `.` = inside the real band, `-` = below it, `+` = above it."""
    hdr = (f"{'label':<13}{'group':<15}{'res':>10}{'fps':>6}{'dur':>7}"
           f"{'shots':>6}{'med':>7}{'long':>7}{'c/s':>6}"
           f"{'det':>8}{'detNat':>8}{'blk':>7}{'sat':>8}"
           f"{'floor':>14}{'LUFS':>7}{'TP':>7}")
    out = [hdr, "-" * len(hdr)]
    for r in rows:
        if r.get("error"):
            out.append(f"{r['label']:<13}{r['group']:<15}  {r['error']}")
            continue
        fl = (f"{r['floor_min']:.0f}..{r['floor_max']:.0f}"
              if r.get("floor_min") is not None else ("-" if r.get("no_audio") else "?"))
        flm = band_mark(r.get("floor_min"), "floor")
        out.append(
            f"{r['label']:<13}{r['group']:<15}{r['w']}x{r['h']:<5}{r['fps']:>6.2f}"
            f"{r['dur']:>7.1f}{r['shots30']:>6}"
            f"{r['median_shot']:>6.2f}{band_mark(r['median_shot'], 'median_shot')}"
            f"{r['longest_shot']:>7.2f}{r['cuts_per_s']:>6.2f}"
            f"{r.get('detail', float('nan')):>7.2f}{band_mark(r.get('detail'), 'detail')}"
            f"{r.get('detail_native', float('nan')):>8.2f}"
            f"{r.get('black', float('nan')):>6.1f}{band_mark(r.get('black'), 'black')}"
            f"{r.get('face_sat', float('nan')):>7.3f}{band_mark(r.get('face_sat'), 'face_sat')}"
            f"{fl:>13}{flm}{(r.get('lufs') if r.get('lufs') is not None else float('nan')):>7.1f}"
            f"{(r.get('true_peak') if r.get('true_peak') is not None else float('nan')):>7.1f}")
    out.append("")
    out.append("band marks: . inside the real band, - below, + above.  Bands: "
               + ", ".join(f"{k} {v[0]}..{v[1]}" for k, v in BANDS.items()))
    # A band this project INHERITED is an assertion until it is re-derived. Print the spread the
    # real-reference rows in THIS run actually produce, beside the band being marked against, so a
    # disagreement is visible rather than silently applied. `face_sat` is the one that does not
    # reproduce: the inherited 0.140-0.228 contains only one of the five real references.
    real = [r for r in rows if r.get("group") == "ref-real" and not r.get("error")]
    if len(real) >= 2:
        out.append("")
        out.append(f"re-derived from the {len(real)} ref-real rows in THIS run "
                   f"({', '.join(r['label'] for r in real)}):")
        for k in ("detail", "black", "face_sat", "median_shot"):
            v = [r[k] for r in real if r.get(k) is not None]
            if v:
                agree = "agrees" if all(BANDS[k][0] <= x <= BANDS[k][1] for x in v) else \
                    f"DISAGREES: {sum(1 for x in v if not BANDS[k][0] <= x <= BANDS[k][1])}/" \
                    f"{len(v)} real references fall outside the band above"
                out.append(f"  {k:<13} {min(v):.3f} .. {max(v):.3f}   {agree}")
        fl = [r["floor_max"] for r in real if r.get("floor_max") is not None]
        if fl:
            out.append(f"  floor (max)   {min(fl):.0f} .. {max(fl):.0f}   "
                       f"check-cut.py check G fails above -28 dB")
    out.append(f"det = mean abs laplacian at a FIXED {NORM_W}px width (comparable across rows). "
               f"detNat = same at native resolution (comparable only within one resolution).")
    out.append(f"med/long/c-s from scene threshold {THRESH}. A second pass at {THRESH_LOW} is in "
               f"the --json output as median_shot_low / cuts_per_s_low.")
    return "\n".join(out)


def main():
    ap = paths.add_run_arg(argparse.ArgumentParser())
    ap.add_argument("--set", default="all",
                    help="all | refs | ours-raw | ours-raw-old | ours-final | ours-rejected")
    ap.add_argument("--only", default=None, help="comma-separated substrings of the label")
    ap.add_argument("--json", default=None, help="write the raw measurements here")
    ap.add_argument("--quick", action="store_true", help="video axes only, skip audio")
    A = ap.parse_args()

    L = paths.layout(A.run)
    inv = inventory(Path(L["run"]))
    if A.set != "all":
        want = "ref-real" if A.set == "refs" else A.set
        inv = [i for i in inv if i["group"] == want]
    if A.only:
        keys = [k.strip().lower() for k in A.only.split(",")]
        inv = [i for i in inv if any(k in i["label"].lower() for k in keys)]
    if not inv:
        sys.exit("nothing selected")

    rows = []
    for i, item in enumerate(inv, 1):
        print(f"[{i}/{len(inv)}] {item['label']} ...", file=sys.stderr, flush=True)
        rows.append(measure(item, quick=A.quick))
    print()
    print(fmt(rows))
    if A.json:
        Path(A.json).write_text(json.dumps(rows, indent=1), encoding="utf-8")
        print(f"\nwrote {A.json}")


if __name__ == "__main__":
    main()
