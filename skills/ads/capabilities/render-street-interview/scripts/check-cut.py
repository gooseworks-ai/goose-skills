#!/usr/bin/env python3
"""The ship gate for a street-interview cut. Free. Fails loudly; prints nothing reassuring.

    python check-cut.py                                  # the default look in the default run
    python check-cut.py --look subway
    python check-cut.py --render <file.mp4> --control <graded.mp4>
    python check-cut.py --falsify                        # prove the gate can FAIL before trusting it

TEN checks, A to I plus R. Every one of them corresponds to something that has actually been
rejected on this format, and the rejection is named in the check so nobody "simplifies" it away.
See TAKES.md.

  A. FORMAT            1080x1920, 30fps, and a payoff hold that was not cut off.
  B. LENGTH            the generation fits the 15s single-call cap, and the whole file fits the
                       feed. A longer file means someone went back to stitching.
  C. PROVENANCE        every frame is accounted for by a generation whose manifest is on disk.
                       For a single-take cut that means exactly ONE manifest, unchanged, because
                       stitching separate generations is the documented root cause of five
                       rejections. For an approved multi-take EPISODE (--episode) it means N
                       manifests, ALL present, ALL the same model, and ALL carrying the
                       IDENTICAL location clause -- the three properties the one-generation rule
                       was buying. A missing manifest still fails, and so does a render longer
                       than the takes account for.
  D. PROMPT LINT       the payload that made the take still contains the clauses that were paid
                       for, and none of the vocabulary that was rejected. Checked on the
                       manifest, not on pixels, and it says so.
  E. CAPTION / CUT     a caption that outlives its shot prints one person's words over the next
                       person's face. Checked against the SCHEDULE, which is the source of
                       truth: in pixels, a permanent title bar and an overrunning caption are
                       indistinguishable, and a detector that cannot tell them apart failed
                       every correct file.
  F. SAFE ZONE         every burned-in pixel inside y=285..1635, measured on the caption LAYER
                       by differencing against a control built through the IDENTICAL encode
                       chain with the overlays left out.
  G. AMBIENCE FLOOR    per-shot noise floor inside the real reference's band. The assembled cut
                       sat at -13..-27 dB against -32..-52 for real footage: a 15-20 dB drone
                       holding the stitch together, which is what "random background noises"
                       turned out to be.
  H. LOUDNESS          -14 LUFS +/- 0.7, true peak under -1.5 dBTP, measured on the render.
  I. SPEECH            every scripted line actually audible, checked with Whisper. The only
                       valid answer to "is this line in the video" on a stack where nobody has
                       ever heard it.
  R. REALISM PROXY     detail and black point on the RENDER against real street footage. Two
                       numbers, not a verdict: they catch a frame that is sharper or more
                       crushed than any real reference. See NOT ASSESSED below for what they
                       cannot do.

NOT A PASS IS NOT A PASS. A check that cannot run prints "NOT RUN" and the gate exits NON-ZERO,
because every hole this gate has ever had was a missing dependency or an empty sample being
read as a clearance: the frame sampler once ran past the end of a file, got nothing, and PASSED
a file it had never looked at. There is `--allow-unrun` for a deliberately partial check, and it
prints the holes either way.

WHAT THIS GATE DOES NOT ASSESS. Printed on every run, pass or fail, because a PASS here has
been mistaken for "this is good" before:
  * whether the faces read as AI. Four rounds were rejected for exactly that and no automated
    check caught any of them. Seed 4813 passed every check in this file while rendering
    visibly soft and plasticky with malformed hands. R is a two-number proxy for the GRADE, not
    a judgement of a face, a hand or a body. See READINESS.md.
  * whether a viewer can follow the video. Every metric in an earlier scorecard passed while the
    cut was incomprehensible, because the can was not shown until 19s in. D checks that the can
    is in the opening and the payoff shot; a human still has to watch it (`/watch`).
  * how it SOUNDS. Nobody on this stack has ever listened to one of these cuts. G, H and I are
    measurements, not listening.
  * whether the pace reads right. Shot lengths are measured by `measure-pace.py`, not here.

Before believing a FAILURE, run --falsify. Five detectors written for this format were
themselves the bug, and two of them wasted a round of "fixes" on files that were already
correct. A gate that has never failed is not a gate.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

import brandkit
import build_looks
import format_spec
import paths

SAFE_TOP, SAFE_BOT = 285, 1635
GEN_CAP_S = format_spec.GEN_CAP_S   # Seedance single-call ceiling, owned by the format layer
FILE_CAP_S = 20.0         # ONE generation + end card. For an episode, check B
                          # computes the cap from the takes instead; see B.
END_CARD_S = 2.2          # what build_looks.py and build_episode.py both append
# MEASURED on refs/sts.webm, refs/klemens.webm, refs/subway.webm: real street footage sits at
# -32 to -52 dB between phrases. Anything louder is a bed, not a street.
AMB_FLOOR_MAX = -28.0     # louder than this = an audible drone
AMB_FLOOR_MIN = -60.0     # quieter than this = digital silence, the H3 failure mode

# The prompt lint's clause list is NOT here any more. It lives in `format_spec.REQUIRED_CLAUSES`
# / `REQUIRED_PER_SHOT` / `BANNED_VOCAB`, next to the scaffold that writes the clauses, and this
# gate calls `format_spec.lint()` so the gate and the generator apply the SAME rule to the same
# text. It used to be a second copy living here, which is how a gate ends up confirming that a
# brand said what the brand said: a clause list maintained beside one brand's payload cannot tell
# format knowledge from that brand's creative choices. Rewritten 2026-09-30 with the
# format/brand split.

fails, notes, warns = [], [], []
# A check that could not run. NOT a warning and NOT a pass: `report()` exits non-zero on a
# non-empty `skips` unless --allow-unrun. `warns` is kept only for things that are genuinely
# advisory and no check writes to it any more; if one ever does, report() still refuses to call
# the run clean.
skips = []


def record_prompt_advice(prompt, tag=""):
    """Length is informational; warns/skips would make report() block the ship gate."""
    notes.extend(f"D ADVISORY {tag}{advice}"
                 for advice in format_spec.prompt_warnings(prompt))


def skip(check, why):
    """Record a check that could not run. Loud, and it prevents a PASS."""
    skips.append(f"{check} NOT RUN: {why}")


def _norm(t):
    """Lowercase, strip punctuation and apostrophes, collapse whitespace.

    Whisper hears "Beer, obviously." where the script says "Beer. Obviously." and ends
    "gonna kill me?" with a question mark. Comparing raw strings failed a line that was clearly
    audible, so the comparison is on words, not on typography.
    """
    import re as _re
    return " ".join(_re.sub(r"[^a-z0-9 ]+", " ", t.lower()).split())


def sh(cmd, **k):
    return subprocess.run([str(x) for x in cmd], capture_output=True, text=True, **k)


def probe(path):
    r = sh(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
            "stream=width,height,r_frame_rate", "-of", "json", path])
    try:
        return json.loads(r.stdout)["streams"][0]
    except (KeyError, json.JSONDecodeError, IndexError):
        sys.exit(f"ffprobe could not read {path}: {r.stderr.strip()[:300]}")


def duration(path):
    """Seconds, or a loud exit. An unparseable duration used to surface as a bare ValueError
    traceback, and in check_realism it was caught and turned into a note, i.e. a pass."""
    r = sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])
    try:
        return float(r.stdout.strip())
    except ValueError:
        sys.exit(f"ffprobe could not read a duration from {path}: "
                 f"{(r.stderr or r.stdout).strip()[:300]}")


def has_audio(path):
    r = sh(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
            "stream=codec_type", "-of", "csv=p=0", path])
    return "audio" in r.stdout


def cuts(path, thresh=0.30):
    """A file's own internal cuts, read off the file."""
    r = sh(["ffmpeg", "-v", "error", "-i", path, "-vf",
            f"select='gt(scene,{thresh})',metadata=print:file=-", "-fps_mode", "vfr",
            "-f", "null", "-"])
    if r.returncode:
        raise RuntimeError("ffmpeg scene detect failed: " + r.stderr[-400:])
    return [float(ln.split("pts_time:")[1].split()[0])
            for ln in r.stdout.splitlines() if "pts_time:" in ln]


def frames(path, times, w=270):
    out = []
    for t in times:
        r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", str(path),
                            "-frames:v", "1", "-vf", f"scale={w}:-1", "-f", "image2pipe",
                            "-vcodec", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True)
        a = np.frombuffer(r.stdout, dtype=np.uint8)
        h = len(a) // w
        # A seek past the end returns nothing, and an empty frame differs from nothing, so a
        # silent PASS is exactly what that produced: this gate once passed a file it never
        # looked at. Never let an empty sample be interpreted.
        if h == 0:
            raise RuntimeError(f"no frame at {t:.2f}s in {Path(path).name}; the sample window "
                               f"runs past the end of the file")
        out.append(a[:h * w].reshape(h, w).astype(np.float32))
    return out


def shot_floor(path, start, end):
    """20th-percentile short-window RMS inside one shot: the honest noise floor.

    NOT 'level 0.25s either side of a cut', which is what was measured first. That number came
    out 18 dB for the single take and 5 dB for the assembled one, i.e. exactly backwards, because
    it catches SPEECH on one side of the boundary. A metric that conflates two signals is worse
    than no metric.
    """
    r = sh(["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{max(end - start, 0.2):.3f}",
            "-i", path, "-af",
            # astats writes to FRAME METADATA; without ametadata=print nothing is emitted at all
            # and the floor silently reads as unmeasurable, which is a hole dressed as a warning.
            "aresample=16000,asetnsamples=1600,astats=metadata=1:reset=1,"
            "ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-",
            "-f", "null", "-"])
    vals = [float(ln.split("=")[1]) for ln in (r.stdout + r.stderr).splitlines()
            if "lavfi.astats.Overall.RMS_level=" in ln]
    vals = [v for v in vals if v > -120]
    return float(np.percentile(vals, 20)) if vals else None


def find_manifest(take: Path):
    """The generation manifest single_gen.py / variants_gen.py writes beside the take."""
    j = take.with_suffix(".json")
    return j if j.exists() else None



# ---------------------------------------------------------------- realism, MEASURED ON THE RENDER
# Every other clause in this gate is a PROMPT lint: it checks that the prompt contains the words
# that were paid for. That is not the same as checking the picture, and CLAUDE.md's rule is to
# measure the render. The 4802 take passed every prompt clause and was still rejected on sight
# with "the characters, and the location is also giving that ai feeling to it".
#
# These two numbers are what separated it from the references, measured 2026-09-30 on one frame
# from each at matched size:
#
#   detail (mean abs laplacian)   ours 15.92   real 9.60 / 9.39 / 4.76
#   black point (1st percentile)  ours  0.70   real 7.0 / 10.0 / 10.3
#
# Over-detail is the big one: everything in frame rendered equally micro-sharp, which no phone
# camera produces. Crushed blacks are the second: real footage never reaches true black.
# Bands are set from the real spread with headroom, not from our own output.
DETAIL_MAX = 12.0      # above this, the frame is sharper than any real reference
DETAIL_MIN_NOTE = 3.0  # printed only. A blurred frame is a different fault and R does not own it
BLACK_MIN = 4.0        # below this, the blacks are crushed harder than any real reference
# And a CEILING, which the first version of this check was missing. Real footage sits in a BAND,
# 7.0 to 10.3; too lifted is as wrong as too crushed, it just reads as washed out rather than
# rendered. phone_look_video.py colour-matched to the Klemens reference pushed a take to 16.1 and
# this check passed it, because it only had a floor.
BLACK_MAX = 14.0


NORM_W = 720           # detail is measured at this width. See the note in check_realism().


def check_realism(path, n_frames=5):
    """Sample frames and compare detail and black point against real street footage.

    Returns (fails, notes, skips). A missing dependency or an empty sample goes in `skips`,
    which the caller may NOT count as a pass: this function used to return those as notes, and
    notes are printed above a PASS.

    DETAIL IS MEASURED AT A FIXED 720px WIDTH. It used to run the laplacian at the frame's
    native resolution, which makes the same footage score differently at 720p and 1080p:
    upscaling a 720p generation to 1080x1920 spreads every edge over more pixels and LOWERS the
    number without touching the picture. Measured with scripts/bench.py on 2026-09-30, the
    approved render scores 9.06 normalised against 6.96 native, and the raw 720p take it came
    from scores 11.95. A ceiling applied to whichever number the file happens to produce is not
    a ceiling. The bands below come from raw 720p frames, so 720px is the width that makes the
    comparison like-for-like.
    """
    import subprocess, tempfile, os
    try:
        import numpy as np
        from PIL import Image
    except ImportError:
        return [], [], ["numpy/Pillow not installed, so detail and black point were not "
                        "measured. `pip install numpy pillow`."]
    dur = duration(path)
    det, blk = [], []
    with tempfile.TemporaryDirectory() as td:
        for i in range(n_frames):
            t = dur * (i + 1) / (n_frames + 1)
            f = os.path.join(td, "f%d.png" % i)
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "%.3f" % t, "-i", str(path),
                            "-frames:v", "1", f], check=False)
            if not os.path.exists(f):
                continue
            im = Image.open(f).convert("RGB")
            nh = max(1, round(im.height * NORM_W / im.width))
            a = np.asarray(im.resize((NORM_W, nh), Image.BILINEAR)).astype("float32")
            g = a.mean(2)
            lap = abs(g[1:, :-1] - g[:-1, :-1]) + abs(g[:-1, 1:] - g[:-1, :-1])
            det.append(float(lap.mean()))
            blk.append(float(np.percentile(g, 1)))
    if not det:
        return [], [], [f"no frames could be extracted from {Path(path).name}, so detail and "
                        f"black point were not measured. An empty sample is not a clearance: "
                        f"this gate once passed a file it had never looked at that way."]
    if len(det) < n_frames:
        return [], [], [f"only {len(det)} of {n_frames} frames decoded from "
                        f"{Path(path).name}; a partial sample is not a measurement"]
    d, b = sum(det) / len(det), sum(blk) / len(blk)
    fails, notes = [], ["R  detail %.2f (band %.1f..%.1f at %dpx), black point %.1f "
                        "(band %.1f..%.1f), %d frames"
                        % (d, DETAIL_MIN_NOTE, DETAIL_MAX, NORM_W, b, BLACK_MIN, BLACK_MAX,
                           len(det))]
    if d > DETAIL_MAX:
        fails.append("R over-detailed: %.2f against a %.1f ceiling. Real street footage measures "
                     "4.76 to 9.60. Everything in frame is equally micro-sharp, which is the "
                     "single biggest thing that reads as rendered." % (d, DETAIL_MAX))
    if b > BLACK_MAX:
        fails.append("R blacks washed out: 1st percentile %.1f against a %.1f ceiling. Real footage "
                     "sits at 7.0 to 10.3. Over-lifting is as wrong as crushing; check whether the "
                     "colour-match reference is darker than the clip being graded." % (b, BLACK_MAX))
    if b < BLACK_MIN:
        fails.append("R blacks crushed: 1st percentile %.1f against a %.1f floor. Real footage "
                     "sits at 7.0 to 10.3 and never reaches true black." % (b, BLACK_MIN))
    return fails, notes, []


def main(argv=None):
    ap = paths.add_run_arg(argparse.ArgumentParser())
    ap.add_argument("--brand", default=None,
                    help="brand slug in brands/ (default liquid-death). Supplies the scripted "
                         "lines check I listens for and the take/render names.")
    ap.add_argument("--look", default="subway", help="which of the five treatments to gate")
    ap.add_argument("--take", default=None,
                    help="the generation this render came from; its .json manifest carries the "
                         "prompt and seed the D and C checks need")
    ap.add_argument("--render", default=None, help="override: the finished file")
    ap.add_argument("--control", default=None, help="override: its caption-free control")
    ap.add_argument("--episode", default=None,
                    help="gate a MULTI-TAKE episode: the <output>.episode.json sidecar that "
                         "build_episode.py writes. It names every take, the caption schedule "
                         "derived from the render, and the control. Check C then requires every "
                         "take's manifest, one model and one location clause across them all.")
    ap.add_argument("--falsify", action="store_true",
                    help="plant an out-of-zone caption on the control and assert F FAILS, then "
                         "plant an over-sharpened frame and assert R FAILS")
    ap.add_argument("--no-brand-layer", action="store_true",
                    help="this render carries no captions, title or end card (build.py's "
                         "intermediate). F and E cannot run on it and are reported NOT RUN.")
    ap.add_argument("--allow-unrun", action="store_true",
                    help="exit 0 even when a check could not run. The holes are printed either "
                         "way. Only for a deliberately partial check, never for a ship decision.")
    A = ap.parse_args(argv)
    L = build_looks.resolve(A.run, A.brand)
    cfg = build_looks.CFG

    # An EPISODE replaces three of this gate's inputs -- the render, the control and the list of
    # takes -- and nothing else. Every check below still runs, and the ones that used to look at
    # "the take" now look at all of them. The sidecar is written by build_episode.py from the
    # files it actually produced, so the gate is not re-deriving what it is meant to be checking.
    ep = None
    ep_takes = []
    if A.episode:
        epp = Path(A.episode)
        if not epp.exists():
            sys.exit(f"no episode sidecar at {epp}. build_episode.py writes it beside the render.")
        ep = json.loads(epp.read_text(encoding="utf-8"))
        ep_takes = [Path(t["take"]) for t in ep["takes"]]
        if len(ep_takes) < 2:
            sys.exit(f"{epp} lists {len(ep_takes)} take(s). An episode of one take IS a "
                     f"single-take cut and must be gated as one, with the one-generation rule "
                     f"intact. Drop --episode.")
        A.render = A.render or ep["render"]
        A.control = A.control or ep["control"]

    render = (Path(A.render) if A.render
              else L["looks"] / f"street-{cfg['slug']}-{A.look}.mp4")
    control = Path(A.control) if A.control else build_looks.control_path(A.look)
    # --take, added because --render alone left the gate with no manifest to read, so every
    # prompt clause reported as "missing" when the real problem was that it had no prompt at
    # all. build.py gates a file it just produced, which is not one of the stored looks.
    take = Path(A.take) if getattr(A, "take", None) else build_looks.SRC
    takes = ep_takes or [take]
    need = [(render, "render", "build_looks.py"),
            (control, "caption-free control", "build_looks.py, which writes it")]
    need += [(t, f"source take {t.name}", "single_gen.py (PAID ~$3.64)") for t in takes]
    for p, what, how in need:
        if not p.exists():
            sys.exit(f"no {what} at {p}. Produce it with {how}.")

    if A.falsify:
        return falsify(render, control, L, ep=ep, ep_takes=ep_takes)

    # -- A. format -------------------------------------------------------------------------
    v = probe(render)
    # NOT eval(). An r_frame_rate ffprobe could not report used to reach eval() and raise
    # NameError, which is a traceback rather than a result.
    try:
        num, den = (str(v["r_frame_rate"]).split("/") + ["1"])[:2]
        fps = float(num) / float(den or 1)
    except (ValueError, ZeroDivisionError, KeyError):
        sys.exit(f"A could not read a frame rate from {render}: "
                 f"r_frame_rate={v.get('r_frame_rate')!r}")
    dur = duration(render)
    if (v["width"], v["height"]) != (1080, 1920):
        fails.append(f"A frame is {v['width']}x{v['height']}, not 1080x1920")
    if abs(fps - 30) > 0.01:
        fails.append(f"A {fps:.3f} fps, not 30")
    notes.append(f"A  {v['width']}x{v['height']} @ {fps:.0f}fps, {dur:.2f}s")

    # -- B. length -------------------------------------------------------------------------
    # The single-call cap is a property of a GENERATION and is unchanged: every take, one at a
    # time, must fit inside it. What generalises is the file cap, and it generalises by
    # arithmetic rather than by being raised: a finished file may be as long as the generations
    # it is made of plus one end card. FILE_CAP_S stays the ceiling for a one-take cut, which is
    # the shape it was measured for; a 30s episode is not "over the feed cap", it is three takes.
    tdurs = [duration(t) for t in takes]
    tdur = tdurs[0]
    over = [(t.name, d) for t, d in zip(takes, tdurs) if d > GEN_CAP_S + 0.5]
    for name, d in over:
        fails.append(f"B {name} is {d:.2f}s, over the {GEN_CAP_S:.0f}s single-call cap: it "
                     f"cannot be one generation")
    file_cap = FILE_CAP_S if len(takes) == 1 else sum(tdurs) + END_CARD_S + 0.6
    notes.append(f"B  {len(takes)} take(s) " + ", ".join(f"{d:.2f}s" for d in tdurs)
                 + f" (each cap {GEN_CAP_S:.0f}s), finished {dur:.2f}s (cap {file_cap:.1f}s)")
    if dur > file_cap:
        fails.append(f"B the finished file is {dur:.2f}s, over {file_cap:.1f}s. For an episode "
                     f"that cap IS the sum of its takes plus one end card, so exceeding it means "
                     f"footage that no generation accounts for.")

    # -- C. provenance -----------------------------------------------------------------------
    # WHAT THIS CHECK IS FOR, restated, because it was generalised on 2026-09-30 and a
    # generalised check is one edit away from being a weakened one.
    #
    # The one-generation rule (SKILL.md Critical knowledge 1) was never about the number 1. It
    # was about three properties that five rejected assembled cuts did not have: ONE LOCATION
    # (six strangers on six streets), ONE ENGINE (nothing mixed), and EVERY FRAME ACCOUNTED FOR
    # BY A RECORDED, REPRODUCIBLE PAYLOAD. For a single take, "exactly one manifest" buys all
    # three for free and that is still exactly what is required of one.
    #
    # An episode was approved for this run, so C asks for the three properties directly instead
    # of through the proxy: every take has its manifest, every manifest names the same model,
    # every prompt carries the IDENTICAL location clause, and the render is no longer than the
    # takes plus one end card. NOT ONE OF THOSE IS OPTIONAL. A cut with a missing manifest fails
    # exactly as it did before -- that is the property that makes the render reproducible at all,
    # and it is the one an "assemble whatever is on disk" pipeline loses first.
    #
    # What C still cannot do: it cannot tell whether three generations that all SAY the same
    # corner actually rendered the same corner. Measured by eye on seeds 4817/4818/4819 they did
    # not, quite. That is a NOT ASSESSED item and it is printed as one.
    payloads, missing = [], []
    for t in takes:
        man = find_manifest(t)
        if man is None:
            missing.append(t)
            payloads.append({})
            continue
        try:
            pl = json.loads(man.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as e:
            sys.exit(f"C the generation manifest {man} could not be read: {e}. Without a "
                     f"readable payload the provenance and prompt checks cannot run, and a "
                     f"video whose payload cannot be read is not reproducible.")
        if not isinstance(pl, dict):
            sys.exit(f"C the generation manifest {man} is a {type(pl).__name__}, not an "
                     f"object; nothing in it can be read and D would pass vacuously.")
        payloads.append(pl)
    for t in missing:
        fails.append(f"C no generation manifest beside {t.name} ({t.with_suffix('.json').name}). "
                     f"Without it nothing records which seed, model or payload produced this "
                     f"footage, and an unrecorded seed is an unreproducible video. This is not "
                     f"relaxed for an episode: it is the check an episode needs MOST.")
    payload = payloads[0]
    if not missing:
        notes.append(f"C  {len(takes)} take(s): " + ", ".join(
            f"seed {pl.get('seed', '?')} ${pl.get('est_cost', 0):.2f}" for pl in payloads))
        models = {pl.get("model") for pl in payloads}
        if len(models) != 1:
            fails.append(f"C the takes come from different models {sorted(map(str, models))}. "
                         f"Two engines in one cut do not match on grain, motion cadence or face "
                         f"rendering, and no post pass reconciles them.")
        else:
            notes.append(f"C  one model, {payloads[0].get('model')}")
        if len(takes) > 1:
            locs = [format_spec.location_clause(pl.get("prompt") or "") for pl in payloads]
            if any(x is None for x in locs):
                fails.append("C at least one take's payload has no readable location clause, so "
                             "the takes cannot be shown to be one shoot. Every fault the "
                             "one-generation rule exists to stop is a location fault.")
            elif len(set(locs)) != 1 and (ep or {}).get("coupled_by_scene_ref"):
                # Declared in the episode config: the takes are coupled by a SHARED SCENE
                # REFERENCE, which binds the actual street rather than a description of it and
                # is the stronger of the two (Critical knowledge 27, 30). Reported, never
                # silent, and the declaration has to name the reference. An episode that does
                # NOT declare one still fails below, which is every episode before this one.
                notes.append("C  location clauses DIFFER and the episode declares the takes "
                             "coupled by the shared scene reference "
                             f"{(ep or {}).get('coupled_by_scene_ref')}: "
                             + " | ".join(f"{t.name}: {x[:50]}..." for t, x in zip(takes, locs))
                             + "  -- VERIFY THE STREET BY EYE; this check reads strings.")
            elif len(set(locs)) != 1:
                fails.append("C the takes do not share ONE location clause: "
                             + " | ".join(f"{t.name}: {x[:60]}..." for t, x in zip(takes, locs))
                             + ". Six strangers on six different streets is the fault five "
                               "assembled cuts were rejected for.")
            else:
                notes.append(f"C  one location clause in all {len(takes)} payloads: "
                             f"{locs[0][:64]}...")
        # The arithmetic. A render built from these takes is those takes plus the end card; more
        # than that and footage came from somewhere with no manifest at all.
        slack = dur - sum(tdurs)
        # A NEGATIVE slack is fine and says so: the build dropped dead air, which is an edit
        # decision recorded in the sidecar's plan. C is asymmetric on purpose -- footage that
        # appears from nowhere is a provenance fault, footage that was left out is not.
        notes.append(f"C  render - takes = {slack:.2f}s (one end card is {END_CARD_S}s"
                     + ("; negative = dead air dropped by the plan, not a second source)"
                        if slack < 0 else ")"))
        if slack > END_CARD_S + 0.6:
            fails.append(f"C the render is {slack:.2f}s longer than the take(s) it names, more "
                         f"than the {END_CARD_S}s end card accounts for: footage came from a "
                         f"source with no manifest. Stitching unrecorded footage is the "
                         f"documented root cause of five rejections and no post pass fixes it.")

    # -- D. prompt lint -------------------------------------------------------------------
    # Every take's payload, not just the first. An episode whose middle take quietly lost a
    # clause is an episode with one third of a defect in it, and the clause lists are per-prompt.
    for t, pl in zip(takes, payloads):
        tag = "" if len(takes) == 1 else f"[{t.name}] "
        pr = pl.get("prompt") or ""
        if not pr:
            fails.append(f"D {tag}the manifest records no prompt, so none of the clauses that "
                         f"were paid for can be confirmed")
            continue
        # ONE lint, imported from the format layer, shared with single_gen.py's dry run -- and
        # run with the grammars THIS payload recorded. Linting a --pace/--guards prompt with the
        # flags off passes while the clauses those grammars paid for go unchecked, which is
        # exactly how PACE_BLOCK was deleted at seed 4812 and nothing noticed for four seeds.
        for problem in format_spec.lint(pr, pace=bool(pl.get("pace_grammar")),
                                        guards=bool(pl.get("guard_grammar")),
                                        mic=bool(pl.get("mic_grammar")),
                                        plain=bool(pl.get("plain_grammar")),
                                        answers_only=bool(pl.get("answers_only")),
                                        can=bool(pl.get("can_grammar")),
                                        mic_ref=bool(pl.get("mic_ref_grammar")),
                                        can_size=bool(pl.get("can_size_grammar")),
                                        can_sealed=bool(pl.get("can_sealed_grammar")),
                                        upright=bool(pl.get("upright_grammar")),
                                        one_mic=bool(pl.get("one_mic_grammar")),
                                        prompt_version=pl.get("prompt_version", 1)):
            fails.append(f"D {tag}" + problem)
        record_prompt_advice(pr, tag)
        # Comprehension, as far as the payload can carry it: the product has to be in the opening
        # AND in the payoff, or there is no setup and no joke. This is what "couldn't understand
        # what it's about" was: the can was banned from every shot and first appeared at 19s.
        #
        # This check was DEAD until 2026-09-30. It split the prompt on "shot " and looked for
        # "Shot N:" labels, which this format has never written -- the shot list is numbered
        # "1. ", "2. " -- so it found ZERO shots on every take ever gated and reported a warning
        # instead of a result. It also looked for the literal "@image1", which appears once in the
        # product paragraph and in no shot description at all, so even with the labels fixed it
        # would have failed a correct prompt. It now reads the shot list the way the format writes
        # it and looks for the product's own noun.
        shots = format_spec.split_shots(pr)
        noun = pl.get("product_noun") or format_spec.product_noun(pr)
        if not shots:
            fails.append(f"D {tag}the prompt has no numbered shot list, so the model has nothing "
                         f"to cut on and the product-in-the-opening check cannot run")
        elif not noun:
            fails.append(f"D {tag}cannot tell what the product is: the manifest records no "
                         f"`product_noun` and the no-opening clause is missing, so the "
                         f"comprehension check would pass vacuously")
        else:
            if noun not in shots[0].lower():
                fails.append(f"D {tag}shot 1 does not show the {noun}: no setup, no joke. The "
                             f"product was once banned from every shot to stop its label "
                             f"garbling, and the video became incomprehensible.")
            if noun not in shots[-1].lower():
                fails.append(f"D {tag}the final shot does not show the {noun}, so there is no "
                             f"payoff")
            grammars = ",".join(n for n, k in (("pace", "pace_grammar"),
                                               ("guards", "guard_grammar"),
                                               ("mic", "mic_grammar"),
                                               ("plain", "plain_grammar"),
                                               ("answers", "answers_only"),
                                               ("can", "can_grammar"),
                                               ("mic_ref", "mic_ref_grammar"),
                                               ("can_size", "can_size_grammar"),
                                               ("can_sealed", "can_sealed_grammar"),
                                               ("upright", "upright_grammar"),
                                               ("one_mic", "one_mic_grammar")) if pl.get(k)) or "-"
            notes.append(f"D  {tag}{len(pr.split())} words, {len(shots)} shots, {noun} in shot 1 "
                         f"and shot {len(shots)}, grammars {grammars}")

    # -- S. no re-cut boundary inside a shot -----------------------------------------------
    # The operator watched episode 3 and said there were still abrupt cuts. It was not the
    # joins between takes: the planner was slicing MID-SHOT, dropping dead air out of the
    # middle of a continuous shot and cutting straight back into the same shot, same framing,
    # same person. That is a jump, not an edit, and it read in the cut list as two cuts 0.13s
    # apart. Nothing in this gate could see it, because the sidecar recorded WHICH takes were
    # used and not WHERE they were cut.
    # The cuts are re-derived from each TAKE here rather than read from the sidecar: a planner
    # that recorded its own idea of where the cuts were would be marking its own homework.
    if ep:
        plan = ep.get("plan")
        if not plan:
            fails.append("S the episode sidecar records no plan, so where the takes were cut "
                         "cannot be checked. That is the hole the mid-shot splice hid in; "
                         "rebuild with a build_episode that records it.")
        else:
            import build_episode as _be
            n_bad = 0
            for tp in ep_takes:
                segs = [tuple(x) for x in plan.get(tp.name, [])]
                if not segs:
                    fails.append(f"S no plan recorded for {tp.name}")
                    continue
                tc = _be.scene_cuts(str(tp))
                for msg in _be.splice_faults(segs, tc, _be.duration(str(tp)),
                                             tol=float(ep.get("splice_tol", 0.12)),
                                             edges_free=True):
                    fails.append(f"S [{tp.name}] {msg}")
                    n_bad += 1
            if not n_bad:
                notes.append(f"S  every re-cut boundary in {len(ep_takes)} take(s) sits on one "
                             f"of that take's own picture cuts, so nothing is spliced "
                             f"mid-shot")

    # -- T. no flash shot in the FINISHED render -------------------------------------------
    # Episode 3b passed S -- every boundary was on a real cut -- and still had a three-frame
    # shot in it: a person change landed on a WIDE beat and the pace grammar's within-person
    # reframe fired 0.10s later, so the wide beat was three frames and read as a stutter. S
    # cannot see this, because neither cut is ours: both are the model's own. So this is
    # measured on the RENDER, which is the only file where the finished rhythm exists.
    if ep:
        import build_episode as _be
        tfail = _be.short_shot_faults(cuts(render), _be.duration(str(render)),
                                      floor=_be.MIN_SHOT_S)
        for m in tfail:
            fails.append("T " + m)
        if not tfail:
            notes.append(f"T  no shot under the {_be.MIN_SHOT_S:.2f}s floor in the finished "
                         f"render")

    # -- E. caption across a cut, against the schedule ------------------------------------
    # For an EPISODE the cuts are read off the RENDER, not off a take, and that is not a
    # convenience: the episode is a different edit from any take (dead air dropped, takes joined),
    # so a cut measured on a take is measured at the wrong timestamp. CLAUDE.md's rule again --
    # measure the render. For a single-take cut nothing changes: the cuts still come from the
    # take, which is the file the schedule in the brand config was measured against.
    if ep:
        src_cuts = [c for c in cuts(render) if 0.4 < c < ep["graded_s"] - 0.1]
        notes.append("E  render's cuts at " + ", ".join(f"{c:.2f}" for c in src_cuts))
        sched = [(float(a), float(b), t) for a, b, t in ep["captions"]]
        if not sched:
            fails.append("E the episode sidecar carries no caption schedule, so there is "
                         "nothing to clamp and this check cannot say anything. A render with "
                         "captions in it and no schedule beside it is unverifiable.")
        recorded = [float(c) for c in ep.get("cuts") or []]
        if len(recorded) != len(src_cuts) or any(
                abs(x - y) > 0.15 for x, y in zip(sorted(recorded), sorted(src_cuts))):
            fails.append(f"E the render's cuts {[round(c, 2) for c in src_cuts]} are not the ones "
                         f"the build clamped to, {[round(c, 2) for c in recorded]}. A caption "
                         f"clamped to the wrong cut is not clamped, and cuts belong to a RENDER: "
                         f"rebuild rather than edit the sidecar.")
        for st, en, text in sched:
            inside = [c for c in src_cuts if st < c < en]
            if inside:
                fails.append(f'E "{text}" runs {st:.2f}-{en:.2f}s, across the cut at '
                             f"{inside[0]:.2f}s: it would print over the next person's face")
            gap = min((c - en for c in src_cuts if c >= en), default=None)
            if gap is not None and gap < 0.15 - 1e-6:
                fails.append(f'E "{text}" ends {gap:.3f}s before the cut at {en + gap:.2f}s, '
                             f"inside the 0.15s guard. A card that ends on a cut is still on "
                             f"screen for the first frame of the next person.")
        if sched:
            notes.append(f"E  {len(sched)} cards, none across a cut, each clear of the next cut "
                         f"by at least 0.15s")
    elif A.no_brand_layer:
        src_cuts = [c for c in cuts(take) if 0.4 < c < tdur]
        notes.append("E  take's internal cuts at " + ", ".join(f"{c:.2f}" for c in src_cuts))
        skip("E", "--no-brand-layer: this render has no caption schedule to check. The clamping "
                  "rule is only meaningful on a file that build_looks.py has drawn captions on.")
    elif not ep and not build_looks.LINES:
        # A brand with no caption schedule used to walk straight through E: the loop below ran
        # zero times and E reported nothing at all, which printed above a PASS.
        fails.append(f"E {cfg['brand']} has no brand_layer.captions, so there is no schedule to "
                     f"clamp and this check cannot say anything. A render with captions in it "
                     f"and no schedule beside it is unverifiable.")
    elif not ep:
        src_cuts = [c for c in cuts(take) if 0.4 < c < tdur]
        notes.append("E  take's internal cuts at " + ", ".join(f"{c:.2f}" for c in src_cuts))
        if not build_looks.CUTS:
            fails.append(f"E {cfg['brand']} has no measured brand_layer.cuts. Without them every "
                         f"caption is clamped to its own end time, i.e. not clamped.")
        if len(src_cuts) != len(build_looks.CUTS) or any(
                abs(x - y) > 0.15 for x, y in zip(sorted(src_cuts), sorted(build_looks.CUTS))):
            fails.append(f"E the take's cuts {[round(c, 2) for c in src_cuts]} are not the ones "
                         f"the build clamps to, {build_looks.CUTS}. Re-measure and update "
                         f"brand_layer.cuts in {cfg['_path']}; a caption clamped to the wrong cut "
                         f"is not clamped. Cuts belong to a TAKE, so a new seed needs new cuts.")
        for st, en, text, style, _job, _sent in build_looks.LINES:
            inside = [c for c in src_cuts if st < c < en]
            if inside and style != "title":
                fails.append(f'E "{text}" runs {st:.2f}-{en:.2f}s, across the cut at '
                             f"{inside[0]:.2f}s: it would print over the next person's face")

    # -- F. safe zone, on the caption layer -----------------------------------------------
    cdur = duration(control)
    if A.no_brand_layer:
        skip("F", "--no-brand-layer: there are no burned-in graphics to place, so the safe zone "
                  "cannot be measured. This render is an intermediate, not a deliverable.")
    elif abs(dur - cdur) > 2.4:
        # The control has to be the SAME EDIT with the overlays left out. build.py once handed
        # the gate a 12.1s graded take as the control for an 8.9s re-cut, and the difference
        # between two different edits flagged every row: F reported "graphics span y=0..1920",
        # a failure caused entirely by the gate being wired to the wrong file.
        fails.append(f"F the control is not this render's caption-free twin: the render is "
                     f"{dur:.2f}s and the control is {cdur:.2f}s. F differences the two, so a "
                     f"control from a different EDIT differs in every pixel and the whole frame "
                     f"reads as a caption. Build the control through the identical chain with "
                     f"the overlays left out (build_looks.py does), or pass --no-brand-layer if "
                     f"this render genuinely has none.")
    else:
        span = graphics_span(render, control)
        if span is None:
            fails.append("F no burned-in graphics found at all. Either the render has none or "
                         "this check is broken; run --falsify before believing it.")
        else:
            notes.append(f"F  burned-in graphics span y={span[0]:.0f}..{span[1]:.0f}")
            if span[0] < SAFE_TOP - 12 or span[1] > SAFE_BOT + 12:
                fails.append(f"F graphics span y={span[0]:.0f}..{span[1]:.0f}, outside "
                             f"{SAFE_TOP}..{SAFE_BOT}")

    # -- G. per-shot ambience floor -------------------------------------------------------
    # Measured on the TAKES, one at a time, for an episode as for a single cut. Deliberately not
    # on the episode render: the render has been levelled, bedded and loudness-normalised, so its
    # floor is a property of the master and the -28 dB ceiling was derived against raw takes.
    # Gating the master against a threshold measured on takes would be comparing two different
    # things, which is the same error as the inherited face-saturation band (SKILL.md 22).
    # The drone this check exists to catch lives in a take, and every take is checked.
    floors = []
    unmeasured = 0
    n_shots = 0
    for t, td_ in zip(takes, tdurs):
        tcuts = [c for c in cuts(t) if 0.4 < c < td_]
        bounds = [0.0] + tcuts + [td_]
        n_shots += len(bounds) - 1
        for a, b in zip(bounds, bounds[1:]):
            f = shot_floor(t, a, b)
            if f is None:
                unmeasured += 1
            else:
                floors.append(f)
    if not all(has_audio(t) for t in takes):
        # A street interview with no audio stream is broken, not unmeasurable.
        silent = [t.name for t in takes if not has_audio(t)]
        fails.append(f"G {', '.join(silent)} has no audio stream at all, so there is no room "
                     f"tone, no dialogue and nothing for G, H or I to measure.")
    elif not floors:
        # This was a WARN, and report() printed PASS above it. astats returning nothing on a
        # file that HAS audio means the measurement is broken, and a broken measurement is not
        # a clearance: the assembled cut's -13 dB drone is the fault this check exists to catch.
        fails.append(f"G could not measure a noise floor on any of {n_shots} shots, "
                     f"although every take has audio. astats returned nothing, so the check "
                     f"that catches the stitching drone did not run.")
    elif unmeasured:
        fails.append(f"G {unmeasured} of {n_shots} shots returned no noise floor. A "
                     f"partial measurement cannot clear a file: the drone only has to be in one "
                     f"shot to be audible.")
    else:
        notes.append(f"G  {n_shots} shots across {len(takes)} take(s), per-shot floor "
                     + ", ".join(f"{f:.0f}" for f in floors) + " dB (real reference -32..-52)")
        if max(floors) > AMB_FLOOR_MAX:
            fails.append(f"G loudest per-shot floor {max(floors):.0f} dB, over "
                         f"{AMB_FLOOR_MAX:.0f}: that is an audible bed, not a street. The "
                         f"assembled cut sat at -13..-27 dB and the drone is very likely part "
                         f"of what kept sounding wrong.")
        if min(floors) < AMB_FLOOR_MIN:
            fails.append(f"G quietest per-shot floor {min(floors):.0f} dB, under "
                         f"{AMB_FLOOR_MIN:.0f}: digital silence between phrases reads as dubbed")

    # -- H. loudness ----------------------------------------------------------------------
    r = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", render, "-af",
            "loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json", "-f", "null", "-"])
    try:
        m = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
        I, TP = float(m["input_i"]), float(m["input_tp"])
    except (ValueError, KeyError, json.JSONDecodeError):
        # loudnorm printing nothing parseable used to be a bare ValueError traceback from
        # rindex. It is a failure of the loudness check, and it says so.
        sys.exit(f"H loudnorm printed no parseable JSON for {render}. The loudness check did "
                 f"not run; ffmpeg said: {r.stderr.strip()[-300:]}")
    notes.append(f"H  {I:.1f} LUFS, true peak {TP:.1f} dBTP")
    if abs(I + 14) > 0.7:
        fails.append(f"H {I:.1f} LUFS, target -14 +/- 0.7. Videos watched back to back must not "
                     f"step in level.")
    if TP > -1.5:
        fails.append(f"H true peak {TP:.1f} dBTP, must be under -1.5")

    # -- I. speech ------------------------------------------------------------------------
    try:
        import whisper
        txt = whisper.load_model("base").transcribe(str(render))["text"].lower()
        notes.append("I  heard: " + txt.strip()[:160])
        # The scripted lines come from the BRAND CONFIG, not from a constant in this file. A gate
        # carrying one brand's dialogue passes every other brand's video by listening for the
        # wrong words, and fails the right video for the right words.
        # EVERY take's scripted lines, from EVERY take's own brand config. An episode gated
        # against one take's dialogue is a gate listening for a third of the video: the other
        # two takes could be silent and I would pass. The config path is read from the manifest,
        # which single_gen.py records, so the gate never has to guess which brand made a take.
        if ep:
            expected = []
            for pl in payloads:
                bc = pl.get("brand_config")
                if not bc:
                    fails.append("I a take's manifest records no brand_config, so the lines it "
                                 "was supposed to contain are unknown and I would pass "
                                 "vacuously on that third of the episode.")
                    continue
                c2 = brandkit.load(bc)
                expected += [c2["question"]] + brandkit.spoken_lines(c2)
        else:
            expected = [cfg["question"]] + brandkit.spoken_lines(cfg)
        # A NEAR MISS IS A LINE THAT WAS SAID. This was an exact substring test, and on episode
        # 3 it failed "cider maybe" because Whisper transcribed the spoken line as "sider
        # maybe": one letter, on a word the model said correctly. The question this check asks
        # is "was the scripted line said", and Whisper's SPELLING is not the ground truth for
        # that -- the same reasoning that moved caption spelling to the script in
        # build_episode.spell_from_script. So the line is looked for at 0.85 similarity over a
        # sliding window of the transcript, which is tight enough that a different line does
        # not satisfy it and loose enough that a transcription slip does not fail it.
        # FALSIFIED by falsify-all.py, which mutes a scripted line and asserts I still fires.
        import difflib
        heard_n = _norm(txt)
        # Lines the EDIT deliberately removed are not expected to be audible. They are named
        # in the sidecar by build_episode, which is the only place that knows what the plan
        # cut, and every other scripted line is still required -- so this distinguishes an
        # editorial trim from a line that did not land, instead of blurring the two.
        cut = {_norm(x) for x in ((ep or {}).get("dropped_lines") or [])}
        if cut:
            notes.append(f"I  {len(cut)} line(s) were cut by the edit and are not expected: "
                         + "; ".join(sorted(cut)))
        for raw, ln in ((x, _norm(x)) for x in expected if _norm(x) not in cut):
            if ln in heard_n:
                continue
            best = 0.0
            step = max(1, len(ln) // 4)
            for i in range(0, max(1, len(heard_n) - len(ln) + 1), step):
                best = max(best, difflib.SequenceMatcher(
                    a=ln, b=heard_n[i:i + len(ln)], autojunk=False).ratio())
            if best >= 0.85:
                notes.append(f'I  scripted line "{ln}" heard at {best:.2f} similarity, not '
                             f'verbatim -- Whisper spelled it differently')
            else:
                fails.append(f'I scripted line "{ln}" is not audible in the render '
                             f'(best match {best:.2f}, needs 0.85)')
    except ImportError:
        # Was a WARN, printed above a PASS. Whisper is the ONLY thing on this stack that answers
        # "is this line in the video", so its absence is a hole in the gate, not a formality,
        # and the run is not clean without it.
        skip("I", "whisper is not installed, so no scripted line was confirmed audible. "
                  "`pip install openai-whisper`. Nobody on this stack has ever HEARD one of "
                  "these cuts; an unchecked I is the largest hole this gate has.")
    except Exception as e:                                      # noqa: BLE001
        fails.append(f"I whisper failed on {Path(render).name}: {type(e).__name__}: {e}. The "
                     f"speech check did not run and a transcription error is not a clearance.")

    # -- R. realism proxy, MEASURED ON THE RENDER -----------------------------------------
    # This function existed, was documented in SKILL.md as "the first check in this gate that
    # measures the render", was named in build.py's docstring as part of what the gate measures,
    # and was NEVER CALLED from main(). It could not fail on any input. Wired in 2026-09-30.
    rfails, rnotes, rskips = check_realism(render)
    # .extend(), not `+=`: `fails += x` inside a function rebinds the NAME, which made every
    # module-level append above it an UnboundLocalError.
    fails.extend(rfails)
    notes.extend(rnotes)
    for s in rskips:
        skip("R", s)

    return report(A.allow_unrun)


def graphics_span(render, control):
    """Rows where the render differs from its caption-free control. Returns (y0, y1) or None.

    A row counts as graphics only when MANY of its pixels differ, not when its worst one does:
    the render is re-encoded at a capped bitrate, so one noisy pixel per row is everywhere and a
    max-based test called the whole frame a caption. Rejected alternatives, all of them my own
    bug rather than a video fault: a brightness threshold (flagged sky, a white can and a sheet
    of paper); differencing against the RAW take (the grade and the handheld motion differ too,
    so all 480 rows flag); differencing against a `-c copy` control (the concat pass is
    bitrate-capped, so the whole frame is re-quantised).
    """
    dur, cdur = duration(render), duration(control)
    ts = [float(t) for t in np.arange(0.2, min(dur, cdur) - 0.15, 1 / 6)]
    a, b = frames(render, ts), frames(control, ts)
    n = min(min(x.shape[0] for x in a), min(x.shape[0] for x in b))
    worst = None
    for fa, fb in zip(a, b):
        d = np.abs(fa[:n] - fb[:n])
        rows = np.where((d > 60).sum(axis=1) >= 8)[0]
        if rows.size:
            y0, y1 = rows.min() / n * 1920, (rows.max() + 1) / n * 1920
            worst = (min(worst[0], y0), max(worst[1], y1)) if worst else (y0, y1)
    return worst


NOT_ASSESSED = (
    "NOT ASSESSED by this gate, on a PASS as much as on a FAIL:",
    "  * whether the faces, hands or bodies read as AI. Seed 4813 passed every check here and",
    "    rendered visibly soft and plasticky with malformed hands. Four earlier rounds were",
    "    rejected for exactly this and no automated check caught one of them. R measures the",
    "    GRADE (detail, black point) and says nothing about a face.",
    "  * whether a viewer can follow the video. D only checks that the product is named in the",
    "    opening and the payoff shot of the PROMPT.",
    "  * how it sounds. G, H and I are measurements; nobody on this stack has listened to one",
    "    of these cuts.",
    "  * whether the pace reads right. Shot lengths are measured by measure-pace.py.",
    "  * for a MULTI-TAKE episode, whether the takes actually rendered the same corner. C",
    "    compares the location CLAUSE in the three payloads, which is a string, not a street.",
    "    Measured by eye on seeds 4817/4818/4819 the three share the grammar and are not the",
    "    same corner. Nothing automated on this format has ever caught that; watch it.",
    "  A PASS here means: the file is the right shape, it came from one paid generation whose",
    "  payload still carries the clauses that were paid for, its graphics are in the safe zone,",
    "  and its levels measure right. WATCH IT END TO END (/watch) before it ships.",
)


def falsify(render, control, L, ep=None, ep_takes=()):
    """Prove F and R can fail.

    F: plants a white box at y=1700..1792 -- below the safe zone -- on a copy of the CONTROL, so
    the difference against the real control is an out-of-zone graphic, and asserts the gate
    reports it.
    R: plants a heavy unsharp on a copy of the RENDER and asserts the detail ceiling catches it.
    R is in here because it spent its whole life defined and never called, which is the same
    thing as a check that cannot fail. If either passes silently the gate is decoration."""
    import tempfile
    bad = 0
    n_falsify = 0
    n_falsify += 1
    print("falsifying F (safe zone) with a planted caption at y=1700..1792, outside "
          f"{SAFE_TOP}..{SAFE_BOT}")
    with tempfile.TemporaryDirectory() as td:
        planted = Path(td) / "planted.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(control), "-vf",
                        "drawbox=x=300:y=1700:w=480:h=92:color=white@1.0:t=fill",
                        "-c:v", "libx264", "-b:v", "3400k", "-maxrate", "3800k",
                        "-bufsize", "6800k", "-pix_fmt", "yuv420p", "-c:a", "copy",
                        str(planted)], check=True)
        span = graphics_span(planted, control)
        if span is None:
            print("  FAIL: the gate saw nothing. It cannot detect a caption, so every PASS it "
                  "has ever printed is meaningless.")
            bad += 1
        else:
            print(f"  gate reports graphics span y={span[0]:.0f}..{span[1]:.0f}")
            if span[1] <= SAFE_BOT + 12:
                print(f"  FAIL: {span[1]:.0f} is inside the safe zone, so the planted "
                      f"out-of-zone box would have PASSED. Not sensitive enough to trust.")
                bad += 1
            else:
                print("  F falsified.")

        n_falsify += 1
        print(f"\nfalsifying R (realism proxy) with a planted unsharp, ceiling {DETAIL_MAX}")
        sharp = Path(td) / "sharp.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(render), "-vf",
                        "unsharp=5:5:2.5:5:5:0.0", "-c:v", "libx264", "-crf", "16",
                        "-pix_fmt", "yuv420p", "-c:a", "copy", str(sharp)], check=True)
        rf, rn, rs = check_realism(sharp)
        for ln in rn:
            print("  " + ln)
        if rs:
            print("  FAIL: R could not run at all: " + "; ".join(rs))
            bad += 1
        elif not any(f.startswith("R over-detailed") for f in rf):
            print("  FAIL: an over-sharpened render did NOT trip the detail ceiling. R cannot "
                  "fail, which is what it was before it was wired in at all.")
            bad += 1
        else:
            print("  R falsified: " + rf[0].split(".")[0])

        # S, the mid-shot splice. Planted by moving one real boundary off its cut by more than
        # the tolerance, which is EXACTLY the fault the operator saw: a boundary that is not a
        # picture change. Measure the plant -- falsify-all's lesson is that a plant which does
        # not actually violate the rule proves nothing -- so the shifted boundary is asserted
        # to be further from every cut than the tolerance before the check is asked about it.

        n_falsify += 1
        print("\nfalsifying S (mid-shot splice) by moving one boundary off its cut")
        if not ep or not ep.get("plan"):
            print("  S SKIPPED: not an episode, or no plan recorded. S cannot be falsified "
                  "here and is therefore unproven on this run.")
            bad += 1
        else:
            import build_episode as _be
            tol = float(ep.get("splice_tol", 0.12))
            tp = ep_takes[0]
            segs = [list(x) for x in ep["plan"][tp.name]]
            tc = _be.scene_cuts(str(tp))
            tdur = _be.duration(str(tp))
            legal = [0.0, tdur] + list(tc)
            # shift the END of the first segment well off any cut
            target, shift = segs[0][1], 0.0
            for cand in [target + d for d in (0.45, 0.60, 0.80, 1.00, -0.45, -0.60)]:
                if 0.2 < cand < tdur - 0.2 and min(abs(cand - c) for c in legal) > tol * 2:
                    shift = cand
                    break
            if not shift:
                print("  S SKIPPED: could not find a point far enough from every cut to be a "
                      "convincing plant. Unproven on this run.")
                bad += 1
            else:
                gap = min(abs(shift - c) for c in legal)
                print(f"  planted boundary at {shift:.2f}s, {gap:.2f}s from the nearest cut "
                      f"(tolerance {tol:.2f}s)")
                segs[0][1] = shift
                got = _be.splice_faults([tuple(s) for s in segs], tc, tdur, tol=tol)
                if not got:
                    print("  FAIL: a boundary planted inside a shot did NOT trip S. The one "
                          "check that can see the fault the operator reported cannot fail.")
                    bad += 1
                else:
                    print("  S falsified: " + got[0][:90])

        # T, the flash shot. This block went MISSING once: it was written through a bash
        # heredoc, the backslash escapes in its anchor were corrupted, the replacement silently
        # did not apply, and `n_falsify` was left saying 4 while only 3 ran -- a gate claiming
        # coverage it did not have, which is the exact shape of the two dead checks in
        # Critical knowledge 12 and 17. Count what actually runs.
        n_falsify += 1
        print("\nfalsifying T (flash shot) by planting a cut just after a real one")
        import build_episode as _be2
        rc = sorted(cuts(render))
        rdur = _be2.duration(str(render))
        if not rc:
            print("  T SKIPPED: the render has no cuts to plant beside. Unproven on this run.")
            bad += 1
        else:
            planted = sorted(rc + [rc[0] + 0.10])
            print(f"  planted an extra cut at {rc[0] + 0.10:.2f}s, 0.10s after the real one at "
                  f"{rc[0]:.2f}s, making a 0.10s shot against a {_be2.MIN_SHOT_S:.2f}s floor")
            got = _be2.short_shot_faults(planted, rdur, floor=_be2.MIN_SHOT_S)
            if not got:
                print("  FAIL: a 0.10s shot did NOT trip T. The check that owns the defect the "
                      "operator reported cannot fail.")
                bad += 1
            else:
                print("  T falsified: " + got[0][:90])

    if bad:
        print(f"\nFAIL: {bad} of {n_falsify} falsifications did not catch their planted fault.")
        return 1
    print("\nFALSIFIED: the gate fails on known-bad files, so its PASS means something.")
    return 0


def report(allow_unrun=False):
    for ln in notes:
        print("  " + ln)
    for ln in warns:
        print("  WARN " + ln)
    for ln in skips:
        print("  " + ln)
    for ln in NOT_ASSESSED:
        print("  " + ln)
    if fails:
        print("\nFAIL")
        for f in fails:
            print("  - " + f)
        if skips:
            print(f"  and {len(skips)} check(s) did not run at all, listed above.")
        return 1
    if skips or warns:
        # A check that could not run is NOT a pass. Every hole this gate has had was an empty
        # sample or a missing dependency read as a clearance, so the exit code says so.
        print("\nNOT CLEAN: every check that RAN passed, but "
              f"{len(skips)} did not run and {len(warns)} warned. That is not a PASS.")
        for ln in skips:
            print("  - " + ln)
        if allow_unrun:
            print("  --allow-unrun: exiting 0 anyway. This is not a ship decision.")
            return 0
        return 1
    print("\nPASS  (see NOT ASSESSED above -- this is not the same as 'it is good')")
    return 0


if __name__ == "__main__":
    sys.exit(main())
