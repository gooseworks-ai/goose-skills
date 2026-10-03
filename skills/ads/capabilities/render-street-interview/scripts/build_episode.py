#!/usr/bin/env python3
"""Assemble a MULTI-TAKE episode from generations that already exist. Free, ffmpeg only.

    python build_episode.py --episode liquid-death-ep1 --dry-run   # no ffmpeg, no network
    python build_episode.py --episode liquid-death-ep1             # the whole episode
    python build_episode.py --episode liquid-death-ep1 --black-lift 0.024

THIS FILE BREAKS THE RULE `SKILL.md` OPENS WITH, AND THAT IS DELIBERATE.

Critical knowledge 1 is "ONE generation for the whole video. Never assemble separate ones", and
it is not wrong -- it was paid for by five rejections whose causes were all *caused by
stitching*: six strangers on six different streets, two seasons in one video, a room-tone jump
at every cut, a hook that walked up to one man and cut to another, a dubbed interviewer who
never sat in the scene. What that rule is, precisely, is a rule about a SINGLE-TAKE cut, and it
still holds for one: nothing here weakens it for a one-take video.

An episode is a different object, approved explicitly for this run, and it re-earns the same
guarantees a different way:

  location   every take's prompt must carry the IDENTICAL location clause, compared byte for
             byte across the manifests (check-cut.py check C). Not "the same corner" in the
             author's head: the same string in the payloads that were paid for.
  provenance every take must have its own generation manifest on disk, and every manifest must
             name the same model. A cut with a missing manifest still FAILS -- that is the whole
             point of C and it is not relaxed, only generalised from one manifest to N.
  room tone  the joins are levelled the way recut.py levels them WITHIN one take: each segment's
             ambient floor is measured and gained to a common target, and a bed is mixed under
             the whole cut when the segments still disagree. Measured on the render afterwards,
             per join, and printed -- the number, not the intention.
  one grade  ONE colour pass over the whole concatenation, not one per take. Three curves across
             three joins is a visible step, and it is the single easiest way to make an assembled
             cut look assembled.

WHAT THIS CANNOT DO, and nothing in this file pretends otherwise: it cannot make three
generations be the same street. Measured by eye on seeds 4817/4818/4819 they share the grammar
(flat grey overcast, red brick, green scaffolding, a bus shelter, parked cars, one mic from the
lower right) and they are not the same corner. That is the cost of the format, it is visible,
and it is what Critical knowledge 1 was about. Watch it before shipping it.

THE CAPTIONS ARE DERIVED, NEVER AUTHORED. Every span comes from Whisper WORD timings measured on
this render, grouped by one rule applied to the whole episode, clamped inside the shot it belongs
to, and ended 0.15s before any cut it would otherwise cross. Caption bleed printed "Beer.
Obviously." over the nurse once, inside a single take. A hand-written schedule cannot survive a
re-plan and a schedule measured on the take rather than the render is measured on the wrong file.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import brandkit
import build_looks
import format_spec
import paths
import recut

HERE = paths.HERE
EPISODES = paths.SKILL / "episodes"
W, H = build_looks.W, build_looks.H
SAFE_TOP, SAFE_BOT = build_looks.SAFE_TOP, build_looks.SAFE_BOT
END_CARD_S = 2.2

# ── the one caption grammar ────────────────────────────────────────────────────────────────
# The operator's note was "the captions should be of the same style, placed in the safe zone".
# On the seed-4816 clean look they WERE in the safe zone (measured y=416..1440 against
# 285..1635) and they were inconsistent: splitting a line at the new fast cuts produced one
# speaker with two fragments, one with a 0.29s fragment followed by a full line, and one with a
# single line. That is three grammars in one video, and it happened because the schedule was
# authored per line and then clamped, so the clamping decided the grammar.
#
# So the grammar is the primary thing and the clamping is a constraint inside it. ONE rule, over
# every spoken word in the episode including the interviewer's question:
# The standing rule for captions on this account is "every word, about four changes a second".
# Four a second is a RATE OVER SPEECH, not over the file: these three takes carry 48 words in
# about 14 seconds of actual talking inside a 28-second episode, so a card per word is already
# about 3.4 changes per second of speech and nothing on screen during the silences. Grouping by
# WORD COUNT alone cannot hit it -- three words to a card measured 0.78 changes/s over the file
# and read as a slow subtitle. So a card is filled by DURATION and capped by word count, which
# gives one word for a slow word and two for a pair of quick ones.
CAP_MAX_WORDS = 2        # never more than two words on screen at once
CAP_MAX_S = 0.38         # ...and a card stops taking words at this length. This sets the rate.
CAP_MIN_S = 0.16         # ...and never a flash shorter than this; merged into its neighbour
CAP_HOLD_S = 0.55        # a card holds until the next one rather than blinking off between
                         # words; a longer gap than this is a pause and the frame goes clean
CAP_CUT_GUARD = 0.15     # a card ends at least this long before the cut it would cross
# ...and the SCHEDULE is built against cuts detected on the graded pre-caption file, while the
# GATE re-detects them on the finished render. Those two lists disagree by ~0.03s, because the
# render goes through another encode at a different timescale. That is smaller than anything
# anyone would notice and it is bigger than zero, which is all it takes: on episode 3 two cards
# were scheduled to end exactly CAP_CUT_GUARD before a cut and the gate measured them 0.01s
# ACROSS it -- check E, correctly, refused the file. The builder therefore aims at the guard
# PLUS this slack, so the constraint holds on the file the gate actually measures.
CAP_CUT_SLACK = 0.10
CAP_SIZE = 104         # the CEILING; episode_cap_size() picks one size for every card
CAP_MAX_ROWS = 2         # a card wraps to two rows at FULL size rather than shrinking
CAP_Y = 1420             # the card's CENTRE. Low enough to clear the can, which these takes hold
                         # at chest height around y=1000..1300, and far inside 285..1635.
CAP_COLOUR = build_looks.CREAM   # ONE colour. The old looks coloured the payoff gold, which is a
                                 # second style in the same video; gold is the end card's job.


def sh(cmd, **k):
    return subprocess.run([str(x) for x in cmd], capture_output=True, text=True,
                          encoding="utf-8", errors="replace", **k)


def run(cmd, **k):
    r = sh(cmd, **k)
    if r.returncode:
        raise RuntimeError(f"{Path(str(cmd[0])).name} failed:\n{(r.stderr or r.stdout)[-1200:]}")
    return r


def duration(p):
    r = sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p])
    try:
        return float(r.stdout.strip())
    except ValueError:
        sys.exit(f"ffprobe could not read a duration from {p}: {(r.stderr or '')[:200]}")


def scene_cuts(p, thresh=0.30):
    """The file's own picture cuts. Same detector and threshold as check-cut.py and
    measure-pace.py, so the three agree by construction rather than by coincidence."""
    r = sh(["ffmpeg", "-v", "error", "-i", p, "-vf",
            f"select='gt(scene,{thresh})',metadata=print:file=-", "-fps_mode", "vfr",
            "-f", "null", "-"])
    if r.returncode:
        raise RuntimeError("scene detect failed: " + (r.stderr or "")[-300:])
    return [float(ln.split("pts_time:")[1].split()[0])
            for ln in r.stdout.splitlines() if "pts_time:" in ln]


# ── the per-take plan ──────────────────────────────────────────────────────────────────────
# A RE-CUT BOUNDARY MAY ONLY FALL ON ONE OF THE TAKE'S OWN INTERNAL CUTS. This is the fault the
# operator saw as "there are still abrupt cuts", and it is NOT the joins between takes: it was
# this planner slicing MID-SHOT. On episode 3 it dropped 0.7s and 0.5s out of the middle of
# take A and 1.5s and 2.4s out of the middle of take B, and cutting out of a shot and back into
# the SAME shot, same framing, same person, is a jump rather than an edit. It showed up in the
# finished cut list as two cuts 0.13s apart at 11.2s and two 0.23s apart at 15.0s -- a splice
# landing beside a real cut, which is the signature.
#
# The fix is structural rather than a tolerance. The planner no longer chooses arbitrary times
# and then tries to tidy them: it works in SHOTS. The take is divided by its own measured cuts,
# each shot is kept or dropped whole, and adjacent kept shots are merged. Every boundary is then
# a picture change by construction, dead air disappears on a shot change, and there is no
# tolerance to get wrong. `check-cut.py`'s check S re-derives the cuts from the file and fails
# if any boundary is off one, and falsify-all plants a mid-shot boundary to prove S can fire.
SPLICE_TOL = 0.12        # a boundary this far from a measured cut is a mid-shot splice

# THE MINIMUM SHOT, and where the number comes from. Episode 3b still had one three-frame
# shot: it cut from the woman to the man WIDE, then 0.10s later to the man CLOSER. The second
# cut is the pace grammar's deliberate within-person reframe doing exactly what it is asked to
# do, but it fired immediately after a person change, so the wide beat lasted three frames and
# read as a stutter rather than an edit.
#
# Measured shortest shots in the three real references (references/REFERENCES.md, same
# detector and threshold): Salary Transparent Street 0.43s, Chris Klemens 0.77s, SubwayTakes
# 0.04s. The floor is NOT the minimum across all three. SubwayTakes' 0.04s is one frame at
# 23.98fps and is the detector firing twice on a single transition -- it is the same artefact
# class as the thing being removed here, so taking it as a lower bound would license the
# defect by citing it. The defensible bound is the tightest real EDIT in the set, Salary
# Transparent Street's 0.43s, and the floor sits just under it so the format never cuts
# tighter than the tightest reference while still allowing a shot as fast as that one.
MIN_SHOT_S = 0.40


def shot_plan(src, cuts, max_gap=0.70, min_speech=0.45, min_shot=0.40, drop=()):
    """Keep/drop whole SHOTS. Returns segments in source seconds, every edge on a cut.

    A shot is dropped only when it holds no speech AND runs longer than `max_gap`, i.e. it is
    dead air rather than a beat. That distinction is what preserves the thing plan_take's
    original docstring was protecting: the silent handover is part of the rhythm and on seed
    4817 it was the only stretch where the can's label squarely faced the camera. A silent
    shot shorter than `max_gap` is rhythm and is kept; a long one is a hole and goes.
    """
    dur = duration(src)
    edges = [0.0] + [c for c in cuts if 0.05 < c < dur - 0.05] + [dur]
    shots = [(edges[i], edges[i + 1]) for i in range(len(edges) - 1)]
    speech = [(a, b) for a, b in recut.speech_spans(src) if b - a >= min_speech]

    def talks(a, b):
        return any(min(b, y) - max(a, x) > 0.05 for x, y in speech)

    # THE SHORT-FRAGMENT RULE, applied here so it cannot fight the shot alignment: a fragment
    # is a whole shot bounded by two real cuts, so dropping it leaves both neighbours' edges on
    # cuts and the previous shot runs straight into the next. The longer side is never
    # shortened to make room and nothing is cross-faded.
    # The one exception is audio: a fragment lying strictly inside a spoken span would take
    # 0.1-0.4s out of the middle of a word. A shot that short cannot hold a whole line
    # (min_speech is 0.45s), so this only ever protects a syllable, and a click in the dialogue
    # is a worse defect than a fast cut. Such a fragment is kept and reported.
    dropped_short = []
    def flash(a, b):
        if (b - a) >= MIN_SHOT_S:
            return False
        if any(x < a and b < y for x, y in speech):      # strictly inside a spoken span
            dropped_short.append((a, b, "kept: inside a spoken word"))
            return False
        dropped_short.append((a, b, "dropped"))
        return True

    # AN EXPLICIT EDITORIAL CUT, named in the episode config. Everything else in this planner
    # drops only dead air, and on episode 4 that left nothing to drop: takes A and C rendered
    # four shots each and every one of them carries a line, so the episode came to 38.4s
    # against a 28-32s target. The shot-aligned rule cannot trim inside a shot, so the only
    # remaining lever is to cut a WHOLE beat -- a person and their guess -- and that is an
    # editorial decision, not something a planner should make quietly. It is therefore written
    # down in the episode config, printed here, recorded in the sidecar, and the lines it
    # removes are listed so check I can tell a deliberate cut from a line that failed to land.
    def cut_by_hand(a, b):
        return any(abs(a - x) < 0.05 and abs(b - y) < 0.05 for x, y in drop)

    keep = [(a, b) for a, b in shots
            if not cut_by_hand(a, b) and not flash(a, b)
            and (talks(a, b) or (b - a) <= max_gap or (b - a) < min_shot)]
    if not keep:
        sys.exit(f"every shot in {Path(src).name} would be dropped. A take with no measurable "
                 f"speech is a broken generation, not a pacing choice.")
    segs = []
    for a, b in keep:
        if segs and abs(a - segs[-1][1]) < 1e-6:
            segs[-1] = (segs[-1][0], b)
        else:
            segs.append((a, b))
    return [(round(a, 3), round(b, 3)) for a, b in segs], dropped_short, [
        (a, b) for a, b in shots if cut_by_hand(a, b)]


def short_shot_faults(cuts, dur, floor=MIN_SHOT_S, head=0.0):
    """Shots in a FINISHED render that are under the floor. Check T, and the builder's own
    assertion, from one function so they cannot disagree.

    `head` ignores the first N seconds, which is where a title or a fade can legitimately
    produce a detector hit that is not an edit."""
    edges = [0.0] + sorted(c for c in cuts) + [dur]
    out = []
    for i in range(len(edges) - 1):
        a, b = edges[i], edges[i + 1]
        if b <= head:
            continue
        if b - a < floor:
            out.append(f"a {b - a:.2f}s shot at {a:.2f}-{b:.2f}s, under the {floor:.2f}s floor "
                       f"(tightest real reference edit is 0.43s): that is a flash, not a cut")
    return out


def drop_flashes(src, td, floor=MIN_SHOT_S):
    """Remove shots shorter than `floor` from a cut file. Returns (path, [(a, b), ...]).

    Every boundary used here is one of `src`'s OWN detected cuts, so the two edit rules cannot
    fight: dropping a flash merges its neighbours and both of their outer edges are still
    picture changes. Kept spans that are contiguous in the source are concatenated, which
    reproduces the original picture exactly across that join -- no new cut is introduced.
    """
    dur = duration(src)
    cuts = [c for c in scene_cuts(src) if 0.05 < c < dur - 0.05]
    edges = [0.0] + cuts + [dur]
    shots = list(zip(edges, edges[1:]))
    keep = [(a, b) for a, b in shots if b - a >= floor]
    dropped = [(a, b) for a, b in shots if b - a < floor]
    if not dropped or not keep:
        return src, []
    segs = []
    for a, b in keep:
        if segs and abs(a - segs[-1][1]) < 1e-6:
            segs[-1] = (segs[-1][0], b)
        else:
            segs.append((a, b))
    parts = []
    for i, (a, b) in enumerate(segs):
        q = Path(td) / f"deflash{i}.mp4"
        recut.cut(str(src), a, b, str(q))
        parts.append(q)
    lst = Path(td) / "deflash.txt"
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    out = Path(td) / "deflashed.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
         "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p",
         "-af", "aresample=48000", "-c:a", "aac", "-b:a", "192k",
         "-video_track_timescale", "30000", str(out)])
    return out, dropped


def trim_silent_edges(src, segs, lead=0.25, min_speech=0.45):
    """Trim silence off the FIRST segment's head and the LAST segment's tail only.

    Why this is allowed when a mid-shot splice is not. Every other boundary in a plan sits
    between two kept stretches of the SAME take, so cutting there means leaving a shot and
    re-entering the same shot -- a jump. A take's outermost edges are different: they are where
    one take hands over to the next, or the start and end of the episode, and the picture
    changes completely there whatever the timecode. So trimming into the silence at those edges
    removes dead air without inventing a cut, which is exactly the lever the operator asked for
    ("dead-air removal at the head and tail of long shots").

    It never trims into speech: the head stops `lead` before the first spoken word and the tail
    `lead` after the last, so no word is clipped and each take still opens and closes on air.
    """
    if not segs:
        return segs, 0.0
    sp = [(a, b) for a, b in recut.speech_spans(str(src)) if b - a >= min_speech]
    if not sp:
        return segs, 0.0
    segs = [list(s) for s in segs]
    before = sum(b - a for a, b in segs)
    head = max(segs[0][0], min(sp[0][0] - lead, segs[0][1] - 0.5))
    if head > segs[0][0]:
        segs[0][0] = round(head, 3)
    tail = min(segs[-1][1], max(sp[-1][1] + lead, segs[-1][0] + 0.5))
    if tail < segs[-1][1]:
        segs[-1][1] = round(tail, 3)
    return [tuple(s) for s in segs], before - sum(b - a for a, b in segs)


def splice_faults(segs, cuts, dur, tol=SPLICE_TOL, edges_free=False):
    """Boundaries that are NOT on a picture cut. The check behind the fix above.

    The take's own start and end are legal boundaries; everything else has to be a cut. Used by
    build_episode as an assertion on its own output and by check-cut.py as check S, from the
    same function, so the builder cannot satisfy a rule the gate reads differently.
    """
    legal = [0.0, dur] + list(cuts)
    out = []
    for i, (a, b) in enumerate(segs):
        for t, side in ((a, "start"), (b, "end")):
            # `edges_free`: the first segment's head and the last segment's tail land on a
            # take HANDOVER or on the episode's own start/end, where the picture changes
            # completely regardless of the timecode. Those are not mid-shot splices and
            # trim_silent_edges is allowed to move them into silence. Every other boundary,
            # including every boundary between two kept stretches of the same take, still has
            # to be a picture cut -- which is the rule that removed the jumps.
            if edges_free and ((i == 0 and side == "start")
                               or (i == len(segs) - 1 and side == "end")):
                continue
            d = min(abs(t - c) for c in legal)
            if d > tol:
                out.append(f"segment {side} {t:.2f}s is {d:.2f}s from the nearest picture cut "
                           f"(tolerance {tol:.2f}s): that is a splice inside a shot, which cuts "
                           f"out of a shot and back into the same shot and reads as a jump")
    return out


def plan_take(src, lead=0.30, tail=0.30, max_gap=1.60, min_speech=0.45):
    """Segments to keep from ONE take, in source seconds.

    recut.py's `auto_plan` keeps each spoken line and drops EVERYTHING else, which is right for a
    12s single-take cut and wrong here for a measured reason: on seed 4817 the silent handover to
    the second person is the only stretch in the take where the can's label squarely faces the
    camera, and dropping it throws the brand off screen to save 4s. So this keeps the run-up to
    each line as well, up to `max_gap` seconds of it, and drops only the hole in the middle.

    The two rules recut.py's docstring calls non-optional are kept, because both were paid for:
    segments may not overlap (a 0.3s blip padded into the next line's segment spliced 0.4s of
    audio in twice, and Whisper reported it as the question repeated three times), and a span
    shorter than `min_speech` is a breath, not a line.
    """
    dur = recut.probe(src)
    segs = []
    prev_end = 0.0
    for a0, b0 in recut.speech_spans(src):
        if b0 - a0 < min_speech:
            continue
        # Keep up to `max_gap` seconds of silent run-up before the lead-in, and never reach back
        # past where the previous segment ended -- that is the non-overlap rule, and it is the
        # one recut.py's docstring calls non-optional because breaking it splices audio in twice.
        s0 = max(0.0, prev_end, a0 - lead - max_gap)
        e0 = min(dur, b0 + tail)
        if e0 - s0 < 0.30:
            continue
        if segs and s0 <= segs[-1][1] + 0.001:      # contiguous: one segment, not two
            segs[-1] = (segs[-1][0], e0)
        else:
            segs.append((round(s0, 3), round(e0, 3)))
        prev_end = e0
    for (s1, e1), (s2, e2) in zip(segs, segs[1:]):
        if s2 < e1 - 0.001:
            raise RuntimeError(f"plan_take produced overlapping segments {s1}-{e1} and {s2}-{e2}"
                               f" in {Path(src).name}: that splices the same audio in twice")
    if not segs:
        sys.exit(f"no speech found in {src}. Refusing to fall back to a whole-take segment: a "
                 f"take with no measurable speech is a broken generation, not a pacing choice.")
    return segs


# ── captions, derived from the render ──────────────────────────────────────────────────────
def word_times(path):
    """Whisper WORD timings on the finished picture. Not on the take: the episode is a different
    edit from any take, so a span measured on a take is measured on the wrong file."""
    try:
        import whisper
    except ImportError:
        sys.exit("whisper is not installed and the caption schedule is DERIVED from its word "
                 "timings, not authored. `pip install openai-whisper`. There is no fallback on "
                 "purpose: a hand-written schedule is how a caption ends up over the next "
                 "person's face.")
    r = whisper.load_model("base").transcribe(str(path), word_timestamps=True)
    out = []
    for seg in r["segments"]:
        for w in seg.get("words") or []:
            t = w["word"].strip()
            if t:
                out.append((float(w["start"]), float(w["end"]), t))
    return out, r["text"].strip()


_NORM_RE = re.compile(r"[^a-z0-9']+")


def _norm(w):
    return _NORM_RE.sub("", w.lower())


def spell_from_script(words, scripted):
    """Take the TIMINGS from Whisper and the SPELLING and PUNCTUATION from the script.

    Episode 2 shipped a payoff caption reading "WATER?" because Whisper heard the line as a
    question. The caption grammar was right and the transcription was what put the question
    mark there -- a reveal undercut by a punctuation mark nobody wrote. The script is the
    source of truth for WHAT WAS SAID; Whisper is the source of truth for WHEN, and only for
    when, because a hand-authored schedule is how a caption ends up over the next person's face
    (see word_times).

    Aligns the two token streams on their letters-only forms and rewrites every matched token
    to the scripted one. Tokens that do not align are LEFT ALONE and REPORTED, because a
    mismatch is not a spelling problem: it means Whisper heard a word that is not in the script
    (invented speech, which seed 4808 produced 4.5 seconds of) or missed one that is. Either
    way the operator should see it rather than have it silently papered over.

    Returns (words, [complaint, ...]).
    """
    import difflib
    a = [_norm(t) for _s, _e, t in words]
    b_tokens = scripted.split()
    b = [_norm(t) for t in b_tokens]
    out = [list(w) for w in words]
    matched = [False] * len(words)
    used = [False] * len(b_tokens)
    ops = difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_opcodes()
    for tag, i1, i2, j1, j2 in ops:
        if tag == "equal":
            for k in range(i2 - i1):
                out[i1 + k][2] = b_tokens[j1 + k]
                matched[i1 + k] = True
                used[j1 + k] = True
        elif tag == "replace":
            # A MISHEARD WORD IS STILL A SCRIPTED WORD. Whisper returned "Sider" for the
            # scripted "Cider," and "Cold brew?" for "Cold brew." -- close enough that an
            # exact-token match misses it and the caption ships the mistake. Inside a replace
            # block the two streams are the same run of speech, so pair them up in order and
            # take the scripted token whenever the pair is nearly the same word. The threshold
            # is deliberately not 1.0 and deliberately not 0: a pairing that is not close is
            # left alone and reported below, because that is a different problem.
            # A SHORT RUN WITH THE SAME WORD COUNT ON BOTH SIDES is the same speech heard
            # badly, so the bar drops: Whisper heard "this can" as "the scan" on the staging
            # sample, and "the"/"this" scores 0.57, just under 0.6, so "this" vanished from the
            # opening caption. Longer or uneven runs keep the strict bar.
            bar = 0.4 if (i2 - i1) == (j2 - j1) <= 3 else 0.6
            for k in range(min(i2 - i1, j2 - j1)):
                wa, wb = a[i1 + k], b[j1 + k]
                if difflib.SequenceMatcher(a=wa, b=wb).ratio() >= bar:
                    out[i1 + k][2] = b_tokens[j1 + k]
                    matched[i1 + k] = True
                    used[j1 + k] = True
    # A SCRIPTED WORD WHISPER SKIPPED INSIDE A SENTENCE IS STILL SAID. The staging sample of
    # episode 2 opened on "WHAT'S / IN CAN?" because base Whisper never returned "this" for
    # "What's in this can?": the word was spoken, the timing just wasn't reported. A run of at
    # most two scripted tokens that sits strictly inside a sentence (it does not end one) and
    # has a heard neighbour on each side is put back, timed in the space between those
    # neighbours, or by splitting the earlier word when they touch. Whole lines are never
    # restored this way: a cut line ends in a full stop, so it can't qualify.
    restored = []
    for tag, i1, i2, j1, j2 in ops:
        if tag != "insert" or not (0 < i1 < len(words)) or j2 - j1 > 2:
            continue
        run_tokens = b_tokens[j1:j2]
        if any(t.rstrip('"”’)').endswith((".", "?", "!")) for t in run_tokens):
            continue
        if not (matched[i1 - 1] and matched[i1]):
            continue
        ps, pe, _pt = out[i1 - 1]
        ns, _ne, _nt = out[i1]
        if ns - pe > 0.6:
            continue
        if ns - pe >= 0.08 * len(run_tokens):
            a0, a1 = pe, ns
        else:
            a0 = ps + (pe - ps) * 0.55
            a1 = pe
            out[i1 - 1][1] = a0
        step = (a1 - a0) / len(run_tokens)
        for k, tok in enumerate(run_tokens):
            restored.append((i1, [a0 + k * step, a0 + (k + 1) * step, tok]))
            used[j1 + k] = True
    heard_extra = [(i, words[i][2]) for i, m in enumerate(matched) if not m]
    missed = [b_tokens[j] for j, u in enumerate(used) if not u]
    problems = []
    if heard_extra:
        # NOT CAPTIONED. A token that matches nothing in the script is either invented speech
        # (seed 4808 produced 4.5 seconds of it) or a hallucinated transcript, and putting a
        # nonsense word on screen in 104px type is worse than leaving that moment uncaptioned.
        # The script is the source of truth for what was said, so a word that is not in it does
        # not get a card. It is reported here instead, loudly, because it means something is
        # wrong with the TAKE and the operator has to hear about it.
        problems.append(f"NOT CAPTIONED -- Whisper heard {len(heard_extra)} word(s) that are "
                        f"not in the script: {[t for _i, t in heard_extra]}. That is invented "
                        f"speech or a bad transcript; check the take.")
    if missed:
        problems.append(f"{len(missed)} scripted word(s) were not heard on the render, so they "
                        f"are not captioned: {missed}")
    if restored:
        problems.append(f"restored {len(restored)} scripted word(s) Whisper skipped inside a "
                        f"sentence: {[w[2] for _i, w in restored]}")
    drop = {i for i, _t in heard_extra}
    by_pos = {}
    for i, w in restored:
        by_pos.setdefault(i, []).append(w)
    final = []
    for i, w in enumerate(out):
        final.extend(by_pos.get(i, []))
        if i not in drop:
            final.append(w)
    return [tuple(w) for w in final], problems


def caption_cards(words, cuts, dur):
    """ONE rule, over every spoken word in the episode. Returns [(start, end, text), ...].

    The rule, in full, because "the same style" is a property of the rule and not of the font:
      * at most CAP_MAX_WORDS words on a card and at most CAP_MAX_S seconds;
      * a card NEVER crosses a picture cut -- it is broken there, and it ends CAP_CUT_GUARD
        before the cut rather than at it, because a card that ends exactly on a cut is still on
        screen for the first frame of the next person (caption bleed put "Beer. Obviously." over
        the nurse);
      * a card shorter than CAP_MIN_S is not a card. It is merged back into the one before it,
        which is what stops the 0.29s fragment the seed-4816 build produced;
      * a card HOLDS until the next one starts, up to CAP_HOLD_S. Ending each card on its last
        word makes the text blink off between words, which is a different fault that looks like
        the same one; a gap longer than CAP_HOLD_S is a real pause and the frame goes clean;
      * every word appears exactly once, in order. Nothing is dropped to make the timing tidy.
    """
    cards = []
    cur = []           # [(s, e, text), ...]

    def shot_of(t):
        """The (start, end) of the shot containing t. A card lives inside ONE shot, and saying
        so once here is what stops three separate branches below each having to remember it."""
        lo = max([0.0] + [c for c in cuts if c <= t])
        hi = min([dur] + [c for c in cuts if c > t])
        return lo, hi

    def flush():
        if not cur:
            return
        s = cur[0][0]
        e = cur[-1][1]
        # A WORD THAT STARTS ON A CUT BELONGS TO THE SHOT AFTER IT. Whisper's word starts run a
        # few tens of ms early, so the first word of a new speaker can be timestamped just
        # before the picture changes. The old code clamped the END against the cut and left the
        # START where it was, which for such a word produced an end EARLIER than its start --
        # and the minimum-length branch below then re-extended it straight back across the cut.
        # That is not hypothetical: it raised "caption 'SIDER' spans the cut at 16.67s" on this
        # episode, from the gate's own assertion. Moving the start is the fix, and it is also
        # the right reading of the picture: the word is the next person's.
        lo, hi = shot_of(s)
        if hi - s < CAP_CUT_GUARD + CAP_CUT_SLACK + 0.08 and hi < dur:
            s = min(hi + 0.02, dur - 0.10)
            lo, hi = shot_of(s)
        # ...and the SAME slack on the leading edge, which the first fix forgot. A card that
        # starts 0.02s after a build-time cut starts 0.02s BEFORE that cut on the render, where
        # the detector puts it ~0.03s later -- and check E then reports it spanning the cut,
        # which it does. Both edges of a card have to clear the cut by more than the drift.
        if lo > 0 and s - lo < CAP_CUT_SLACK:
            s = lo + CAP_CUT_SLACK
        e = min(e, hi - CAP_CUT_GUARD - CAP_CUT_SLACK if hi < dur else dur - 0.02)
        e = min(e, s + CAP_MAX_S, dur - 0.02)
        text = " ".join(t for _s, _e, t in cur).upper()
        if (e - s < CAP_MIN_S and cards and cards[-1][1] >= s - 0.6
                and len(cards[-1][2].split()) + len(text.split()) <= CAP_MAX_WORDS
                and shot_of(cards[-1][0])[1] == hi):
            # Too short to read on its own: fold it into the card before it rather than flash it.
            # The word cap is checked HERE too, which the first version did not do: the merge
            # produced "THAT'S A BEER." next to two-word cards, i.e. the merge was quietly
            # exempt from the one rule that makes every card the same shape.
            ps, pe, pt = cards[-1]
            cards[-1] = (ps, max(pe, e), (pt + " " + text))
        elif e - s < CAP_MIN_S and cards:
            # cannot merge without breaking the word cap, so give it its own minimum length
            # instead of dropping it; every word appears exactly once. The extension is capped
            # by the SHOT, not just by CAP_MIN_S -- extending a short card to its minimum used
            # to push it back over the cut it had just been clamped off.
            room = (hi - CAP_CUT_GUARD - CAP_CUT_SLACK if hi < dur else dur - 0.02)
            e2 = min(max(s + CAP_MIN_S, e), room)
            if e2 - s >= 0.08:
                cards.append((s, e2, text))
        elif e - s >= 0.08:
            cards.append((s, e, text))
        cur.clear()

    for s, e, t in words:
        if cur:
            span_s = cur[0][0]
            crosses = any(span_s < c <= e for c in cuts)
            if (len(cur) >= CAP_MAX_WORDS or e - span_s > CAP_MAX_S or crosses):
                flush()
        cur.append((s, e, t))
    flush()
    # HOLD each card to the next one. Done after the fact rather than inside flush(), because a
    # card cannot know where the next one starts until it exists.
    held = []
    for i, (s, e, t) in enumerate(cards):
        nxt = cards[i + 1][0] if i + 1 < len(cards) else None
        if nxt is not None and nxt - e <= CAP_HOLD_S:
            e = nxt
        else:
            e = min(e + 0.12, dur - 0.02)
        # The guard is against the NEXT cut, not only against a cut the card would cross. A card
        # that ends 0.10s before a cut does not cross it and is still on screen for the last
        # frames of the shot it is leaving, which is the same picture as bleed; and the gate
        # checks the distance, so the builder has to produce it rather than nearly produce it.
        nxt_cut = next((c for c in cuts if c > s), None)
        if nxt_cut is not None and nxt_cut - e < CAP_CUT_GUARD + CAP_CUT_SLACK:
            e = max(s + 0.08, nxt_cut - CAP_CUT_GUARD - CAP_CUT_SLACK)
        held.append((s, e, t))
    cards = held
    # the clamp has to have held, and an assertion is cheaper than another round of "fixes"
    for (s1, e1, _t1), (s2, _e2, _t2) in zip(cards, cards[1:]):
        if e1 > s2 + 0.001:
            raise RuntimeError(f"caption cards overlap: {s1:.2f}-{e1:.2f} into {s2:.2f}")
    for s, e, t in cards:
        inside = [c for c in cuts if s < c < e]
        if inside:
            raise RuntimeError(f"caption {t!r} spans the cut at {inside[0]:.2f}s")
    return cards


_WIDTH_CACHE = {}


def drawn_width(text, size):
    """The width of the PIXELS a row actually paints.

    NOT `ImageDraw.textlength`, and not `heavy().width` either. `build_looks.heavy` pads its
    canvas by `outline*2 + size` on each side and then shears it for the italic, so its `.width`
    is ~250px wider than the ink at 104px and a width test against it rejected rows that fit
    perfectly well. Measure the bbox: it is the only number that corresponds to what a viewer
    sees, which is the same rule as measuring the render rather than the inputs.
    """
    k = (text, size)
    if k not in _WIDTH_CACHE:
        b = build_looks.heavy(text, size, CAP_COLOUR, outline=7).getbbox()
        _WIDTH_CACHE[k] = 0 if b is None else b[2] - b[0]
    return _WIDTH_CACHE[k]


def wrap_rows(text, size, max_w):
    """Greedy word wrap at `size`. Returns the rows, or None when a single word will not fit."""
    rows, cur = [], ""
    for w in text.split():
        if drawn_width(w, size) > max_w:
            return None
        t = (cur + " " + w).strip()
        if drawn_width(t, size) <= max_w or not cur:
            cur = t
        else:
            rows.append(cur)
            cur = w
    if cur:
        rows.append(cur)
    return rows if len(rows) <= CAP_MAX_ROWS else None


def episode_cap_size(texts, max_w=None):
    """ONE type size for every card in the episode.

    This is the actual fix for "the captions should be of the same style". The first version drew
    every card at a nominal 96px and let `build_looks.fit` shrink whichever ones were too wide,
    which is what that helper is for -- and the result, measured on the render, was "ANY" at 96px
    next to "SOMETHING'S" at about 60px and "QUESTION. WHAT / DO" smaller again. Three sizes in
    one video is the same defect the operator flagged on seed 4816, arriving through the layout
    instead of through the schedule. Same style means the same SIZE, so the size is a property of
    the EPISODE: the largest one at which every card in it fits.
    """
    max_w = max_w or (W - 90)
    for size in range(CAP_SIZE, 39, -2):
        laid = [wrap_rows(t, size, max_w) for t in texts]
        if all(r is not None for r in laid):
            return size, laid
    raise RuntimeError("no size from %d down to 40 fits every caption; a card is too long. "
                       "Lower CAP_MAX_WORDS or raise CAP_MAX_ROWS." % CAP_SIZE)


def caption_png(text, path, size, rows=None):
    """One card, drawn with PIL. No model renders a letter, ever.

    Returns the tight bounding box of the drawn pixels, which is what the safe zone is asserted
    against -- the RENDERED PNG, not the y number that was passed in. build_looks.place() asserts
    on the intended y; that is an assertion about arithmetic, and the shadow and the italic shear
    both happen after it.
    """
    rows = rows or wrap_rows(text, size, W - 90)
    if rows is None:
        raise RuntimeError(f"caption {text!r} does not fit at {size}px")
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    imgs = [build_looks.heavy(r, size, CAP_COLOUR, outline=7) for r in rows]
    step = int(size * 1.18)
    y = CAP_Y - (len(imgs) - 1) * step // 2 - imgs[0].height // 2
    for i, img in enumerate(imgs):
        c.alpha_composite(img, ((W - img.width) // 2, y + i * step))
    bbox = c.getbbox()
    if bbox is None:
        raise RuntimeError(f"caption {text!r} drew nothing at all")
    if bbox[1] < SAFE_TOP or bbox[3] > SAFE_BOT:
        raise RuntimeError(f"caption {text!r} drew pixels at y={bbox[1]}..{bbox[3]}, outside the "
                           f"safe zone {SAFE_TOP}..{SAFE_BOT}")
    if bbox[0] < 25 or bbox[2] > W - 25:
        raise RuntimeError(f"caption {text!r} drew pixels at x={bbox[0]}..{bbox[2]}, off the edge")
    c.save(path)
    return bbox


# ── the build ──────────────────────────────────────────────────────────────────────────────
def load_episode(arg):
    p = Path(arg).expanduser()
    if p.suffix != ".json":
        p = EPISODES / f"{arg}.json"
    if not p.exists():
        have = ", ".join(sorted(q.stem for q in EPISODES.glob("*.json"))) or "(none)"
        sys.exit(f"no episode config at {p}. Have: {have}")
    ep = json.loads(p.read_text(encoding="utf-8"))
    ep["_path"] = str(p)
    for k in ("takes", "output", "brand_layer"):
        if k not in ep:
            sys.exit(f"{p}: the episode config is missing {k!r}")
    if len(ep["takes"]) < 2:
        sys.exit(f"{p}: an 'episode' of one take is a single-take cut. Use build_looks.py, which "
                 f"is the pipeline the one-generation rule was written for.")
    build_looks.configure_brand_layer(ep["brand_layer"])
    global CAP_COLOUR
    CAP_COLOUR = build_looks.CREAM
    return ep


def check_roles(cfgs, ep):
    """Exactly one payoff take, and it is last. brandkit.validate() moved the payoff rule to the
    take's own role; this is the other half of it, and without this half the rule would have been
    RELAXED rather than moved: three 'opening' takes would have passed every per-take check and
    produced an episode that never pays off."""
    roles = [c.get("episode_role") for c in cfgs]
    if any(r is None for r in roles):
        sys.exit(f"{ep['_path']}: take(s) {[c['_path'] for c, r in zip(cfgs, roles) if r is None]}"
                 f" have no episode_role. A config with no role is a standalone video, and an "
                 f"episode built from standalone videos pays off once per take.")
    if roles.count("payoff") != 1:
        sys.exit(f"the episode has {roles.count('payoff')} payoff takes ({roles}). The reveal "
                 f"lands exactly once: zero and there is no joke, two and the second one is a "
                 f"repeat of a joke the viewer has already had.")
    if roles[-1] != "payoff":
        sys.exit(f"the payoff take is #{roles.index('payoff') + 1} of {len(roles)}, not last "
                 f"({roles}). The joke would land mid-episode and the rest is an epilogue.")


def find_gap(path, need=0.60, margin=0.20):
    """A speech-free window of `need` seconds in THIS file, measured on THIS file.

    It is NOT a stored constant, and this format has paid for that twice: the ambience bed's
    window was 8.0s/7.6s measured on seed 4802 and, on seed 4815, 7.6s is the middle of
    "something that's gonna kill me" (Critical knowledge 13); recut.py's was (0.05, 1.90) and on
    seed 4815 that window IS the interviewer's question, so the "room tone" bed was that line
    looped under the whole edit (21a). Both looked like a bed of random background noise.
    """
    dur = duration(path)
    spans = recut.speech_spans(path)
    edges = [(0.0, spans[0][0] if spans else dur)]
    edges += [(a[1], b[0]) for a, b in zip(spans, spans[1:])]
    if spans:
        edges.append((spans[-1][1], dur))
    best = None
    for a, b in edges:
        a, b = a + margin, b - margin
        if b - a >= need and (best is None or b - a > best[1] - best[0]):
            best = (a, b)
    if best is None:
        return None
    # The window is LOOPED to fill whatever needs filling (the bed already was; the end card's
    # room tone now is too). Looking for a 2.2s hole failed outright on this episode -- 28s of
    # three interviews back to back has no 2.2s of silence in it anywhere -- and the honest fix
    # is to loop the real gap, not to widen the search until it lands on a word.
    return round(best[0], 3), round(best[1] - best[0], 3)


def main():
    ap = paths.add_run_arg(argparse.ArgumentParser())
    ap.add_argument("--episode", default="liquid-death-ep1")
    ap.add_argument("--black-lift", type=float, default=None,
                    help="the grade, SOLVED on the concatenated cut by fit_grade.py. Omit and "
                         "this solves it here, which costs two extra probe renders and nothing "
                         "else. A constant measured on another take is how the black point ends "
                         "up quietly out of band (Critical knowledge 19).")
    ap.add_argument("--max-gap", type=float, default=1.60,
                    help="seconds of silent run-up kept before each spoken line. Everything "
                         "longer is dead air and is dropped.")
    ap.add_argument("--dry-run", action="store_true",
                    help="resolve everything, check the roles, the manifests and the location "
                         "clause, and draw every caption layer that can be drawn without ffmpeg")
    A = ap.parse_args()

    ep = load_episode(A.episode)
    L = paths.layout(A.run)
    cfgs = [brandkit.load(t) for t in ep["takes"]]
    check_roles(cfgs, ep)

    takes, manifests = [], []
    for c in cfgs:
        t = L["takes"] / f"{brandkit.take_name(c)}.mp4"
        m = t.with_suffix(".json")
        if not t.exists():
            sys.exit(f"no take at {t}. Generate it with single_gen.py --brand "
                     f"{Path(c['_path']).stem} --yes (PAID ~$3.64).")
        if not m.exists():
            sys.exit(f"no generation manifest at {m}. A take with no manifest has no recorded "
                     f"seed, model or payload, and an unrecorded seed is an unreproducible "
                     f"video. check-cut.py check C fails on this too, and it is not relaxed for "
                     f"an episode.")
        takes.append(t)
        manifests.append(json.loads(m.read_text(encoding="utf-8")))

    # THE LOCATION CLAUSE, compared across the payloads that were actually paid for. This is the
    # guard that replaces "one generation" for an episode, so it runs before any work and it
    # compares the string, not the author's intention.
    locs = [format_spec.location_clause(m.get("prompt") or "") for m in manifests]
    if any(x is None for x in locs):
        sys.exit("at least one manifest has no readable location clause, so the takes cannot be "
                 "shown to be the same shoot. Every fault the one-generation rule exists to stop "
                 "is a location fault.")
    coupled = ep.get("coupled_by_scene_ref")
    if len(set(locs)) != 1:
        detail = "\n  ".join(f"{t.name}: {x[:90]}..." for t, x in zip(takes, locs))
        if not coupled:
            sys.exit("the takes do not share ONE location clause:\n  " + detail
                     + "\nThree corners in one episode is the exact fault five assembled cuts "
                       "were rejected for. Fix the brand configs and re-generate; no post pass "
                       "fixes it.\nIf the takes are instead coupled by a SHARED SCENE REFERENCE, "
                       "which is a stronger guarantee than matching text, declare it in the "
                       "episode config as \"coupled_by_scene_ref\" and the differing clauses "
                       "will be reported rather than refused.")
        # A SHARED SCENE REFERENCE IS A STRONGER COUPLING THAN MATCHING TEXT, and it is the one
        # case a string comparison cannot express. The episode-2 repair keeps the approved seed
        # 4820 and generates its two replacements FROM A CROP OF 4820 ITSELF, so they inherit
        # that take's actual street rather than a description of one -- which is the whole
        # finding of Critical knowledge 27 and 30. 4820 predates the "name the city" change, so
        # its clause differs by two words from takes that carry it, and this check would refuse
        # an episode whose takes are coupled more tightly than any that has ever passed it.
        # It is never silent: the clauses are printed here, check C reports them, and the
        # episode config has to name the reference and say why.
        print("  location   clauses DIFFER across the takes; the episode declares them coupled "
              "by a shared scene reference instead:")
        print("  " + detail)
        print(f"  coupled by {coupled}")
    models = {m.get("model") for m in manifests}
    if len(models) != 1:
        sys.exit(f"the takes come from different models {models}. Two engines in one cut do not "
                 f"match on grain, motion cadence or face rendering.")

    out_dir = L["looks"]
    ctrl_dir = L["graded"]
    OUT = out_dir / f"{ep['output']}.mp4"
    CTRL = ctrl_dir / f"{ep['output']}.control.mp4"
    SIDE = out_dir / f"{ep['output']}.episode.json"

    print(f"episode    {ep['_path']}")
    print(f"takes      {', '.join(t.name for t in takes)}")
    print(f"model      {models.pop()}")
    print(f"seeds      {[m.get('seed') for m in manifests]}")
    print(f"location   {'one clause, identical in all' if len(set(locs)) == 1 else 'DIFFERING clauses across'}"
          f" {len(takes)} payloads: {locs[0][:60]}...")
    print(f"output     {OUT}")
    print(f"control    {CTRL}")

    # SHOT-ALIGNED, measured on the file in hand. Every boundary is one of this take's own
    # picture cuts, so a dropped stretch disappears on a shot change instead of jumping.
    take_cuts = [scene_cuts(t) for t in takes]
    drops = {k: [tuple(v) for v in vs] for k, vs in (ep.get("drop_shots") or {}).items()}
    planned = [shot_plan(t, c, max_gap=A.max_gap, drop=drops.get(t.name, ()))
               for t, c in zip(takes, take_cuts)]
    plans = [p for p, _d, _h in planned]
    # Dead air off each take's outer edges. Those edges are joins, not mid-shot splices; see
    # trim_silent_edges. This is the free half of the pace fix.
    trimmed = []
    for tk, pl in zip(takes, plans):
        pl2, saved = trim_silent_edges(tk, pl)
        if saved > 0.01:
            print(f"  {tk.name}: trimmed {saved:.2f}s of silence off the take's outer edges "
                  f"(a join, not a mid-shot splice)")
        trimmed.append(pl2)
    plans = trimmed
    cut_lines = []
    for t, cfg_i, (_p, d, hand) in zip(takes, cfgs, planned):
        for a, b, why in d:
            print(f"  {t.name}: {b - a:.2f}s fragment at {a:.2f}-{b:.2f} -- {why} "
                  f"(floor {MIN_SHOT_S:.2f}s)")
        if hand:
            # Which scripted line each hand-cut beat was carrying. The Nth spoken span in a
            # take is its Nth scripted line -- the prompt forbids invented speech and check I
            # verifies that independently -- with the opening take's first span being the
            # interviewer's question.
            spans = [(x, y) for x, y in recut.speech_spans(str(t)) if y - x >= 0.45]
            lines = brandkit.spoken_lines(cfg_i)
            off = 1 if cfg_i.get("episode_role") == "opening" else 0
            for a, b in hand:
                for i, (x, y) in enumerate(spans):
                    if min(b, y) - max(a, x) > 0.05 and off <= i < len(lines) + off:
                        cut_lines.append(lines[i - off])
                print(f"  {t.name}: CUT BY HAND {a:.2f}-{b:.2f} ({b - a:.2f}s), an editorial "
                      f"trim named in the episode config")
    if cut_lines:
        print(f"  lines cut  {cut_lines} -- deliberate, recorded, and excluded from check I")
    # ...asserted here as well as gated, because the builder must not be able to emit a plan
    # the gate would reject. If this fires the planner is wrong, not the file.
    for t, p, c in zip(takes, plans, take_cuts):
        bad = splice_faults(p, c, duration(t), edges_free=True)
        if bad:
            sys.exit(f"{t.name}: the plan contains a mid-shot splice, which is the exact fault "
                     f"shot_plan exists to make impossible:\n  " + "\n  ".join(bad))
    kept = sum(e - s for p in plans for s, e in p)
    raw = sum(duration(t) for t in takes)
    for t, p, c in zip(takes, plans, take_cuts):
        print(f"  {t.name}: {len(p)} segment(s) "
              + ", ".join(f"{s:.2f}-{e:.2f}" for s, e in p)
              + f"   [{len(c) + 1} shots; every boundary on a cut]")
    print(f"  keeping {kept:.2f}s of {raw:.2f}s generated")

    if A.dry_run:
        # Everything that can fail with no ffmpeg: the roles, the manifests, the location clause,
        # the plan, and the caption geometry for a worst-case card.
        with tempfile.TemporaryDirectory() as td:
            probes = ["SOMETHING ILLEGAL.", "WAIT. THAT'S", "W"]
            size, laid = episode_cap_size(probes)
            print(f"  type {size}px would fit every probe card")
            for probe_text, rows in zip(probes, laid):
                b = caption_png(probe_text, Path(td) / "c.png", size, rows)
                print(f"  caption {probe_text!r} -> {rows} drew y={b[1]}..{b[3]} "
                      f"x={b[0]}..{b[2]} (safe {SAFE_TOP}..{SAFE_BOT})")
        raise SystemExit("\ndry run. No ffmpeg, no network, nothing written.")

    out_dir.mkdir(parents=True, exist_ok=True)
    ctrl_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        # -- 1. cut every segment, measure its ambient floor, level them all to one target -----
        # This is recut.py's method, applied ACROSS takes instead of within one. Measured there:
        # the street tone stepped 2.2 to 6.4 dB at every join and that step is what reads as an
        # abrupt cut, more than the picture does. Three takes recorded as three separate
        # generations disagree by more than three segments of one take ever did.
        flat, floors = [], []
        for i, (t, plan) in enumerate(zip(takes, plans)):
            for j, (s, e) in enumerate(plan):
                q = td / f"raw{i}{j:02d}.mp4"
                recut.cut(t, s, e, q)
                f = recut.ambient_floor(q)
                if f is None:
                    sys.exit(f"could not measure an ambient floor for {t.name} {s:.2f}-{e:.2f}. "
                             f"It cannot be levelled, and an unlevelled join is the step that "
                             f"reads as an abrupt cut. Do not ship an unmeasured segment.")
                flat.append((i, t, s, e))
                floors.append(f)
        target = sum(floors) / len(floors)
        parts = []
        for k, ((i, t, s, e), f) in enumerate(zip(flat, floors)):
            g = max(-6.0, min(6.0, target - f))
            p = td / f"p{k:03d}.mp4"
            recut.cut(t, s, e, p, gain_db=g)
            parts.append(p)
            print(f"  seg {k + 1:>2}  {t.name[-12:]}  floor {f:6.1f} dB  gain {g:+5.2f} dB")
        spread = max(floors) - min(floors)
        print(f"  floors spread {spread:.1f} dB, levelled to {target:.1f} dB")

        # -- 2. concat with the concat FILTER, never the demuxer -------------------------------
        # recut.py: the demuxer with -c copy REPEATED earlier segments on seed 4814, confirmed
        # with two Whisper models, while each segment on its own was correct.
        ins = []
        for q in parts:
            ins += ["-i", str(q)]
        n = len(parts)
        fc = "".join(f"[{k}:v][{k}:a]" for k in range(n)) + f"concat=n={n}:v=1:a=1[v][a]"
        joined = td / "joined.mp4"
        run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", fc, "-map", "[v]",
             "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
             "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", joined])

        # -- 3. ONE grade over the whole episode ----------------------------------------------
        lift = A.black_lift
        if lift is None:
            print("  solving the grade on the concatenated cut (fit_grade.py)...")
            r = run([sys.executable, HERE / "fit_grade.py", "--take", joined, "--run", L["run"]])
            for ln in r.stdout.splitlines():
                if "solved" in ln and "lift" in ln:
                    lift = float(ln.split("lift")[1].split()[0])
            if lift is None:
                sys.exit("fit_grade.py printed no solved lift:\n" + r.stdout[-800:])
        print(f"  grade      black lift {lift:.4f}, saturation 1.0 over the whole episode")
        graded = td / "graded.mp4"
        run([sys.executable, HERE / "phone_look_video.py", joined, graded, "--run", L["run"],
             "--black-lift", f"{lift:.4f}", "--saturation", "1.0"])

        # -- 3b. DROP FLASH SHOTS, measured on the graded cut ---------------------------------
        # This pass exists because the planner CANNOT see the defect it fixes. On episode 3b a
        # person change landed on a WIDE beat and the within-person reframe fired 0.10s later,
        # giving a three-frame shot that reads as a stutter. Both cuts are the model's own, so
        # check S (every boundary on a cut) passed -- and the reframe is not in the TAKE's cut
        # list at ANY threshold down to 0.10, because it is a reframe of the same person and
        # only becomes detectable after the grade lifts the contrast. Measured, not assumed:
        # take 4830 reports the same nine cuts at thresholds 0.30 through 0.12.
        # So the de-flash runs HERE, on the file where the defect is actually measurable, and
        # it stays shot-aligned by construction: a flash is a whole shot bounded by two of this
        # file's own cuts, so dropping it leaves the previous shot running straight into the
        # next one and cannot create a mid-shot splice. The longer side is never trimmed and
        # nothing is cross-faded.
        graded, dropped = drop_flashes(graded, td)
        for a, b in dropped:
            print(f"  flash      dropped a {b - a:.2f}s shot at {a:.2f}-{b:.2f} of the graded "
                  f"cut (floor {MIN_SHOT_S:.2f}s)")

        gdur = duration(graded)
        cuts = [c for c in scene_cuts(graded) if 0.25 < c < gdur - 0.1]
        left = short_shot_faults(scene_cuts(graded), gdur, head=0.25)
        if left:
            print("  flash      STILL SHORT after the de-flash pass:")
            for m in left:
                print("    " + m)
        print(f"  {len(cuts) + 1} shots in {gdur:.2f}s; cuts at "
              + ", ".join(f"{c:.2f}" for c in cuts)
              + f"   tightest gap {min([b - a for a, b in zip([0.0] + cuts, cuts + [gdur])]):.2f}s")

        # -- 4. the caption schedule, DERIVED from this render --------------------------------
        words, heard = word_times(graded)
        if not words:
            sys.exit("whisper returned no word timings for the concatenated cut, so no caption "
                     "schedule can be derived. An episode with no captions is not the "
                     "deliverable; fix the audio before drawing anything.")
        # PUNCTUATION AND SPELLING COME FROM THE SCRIPT, timings from Whisper. The scripted
        # text is the episode's own: the question exactly once, from the take whose role is
        # `opening`, then every spoken line in take order. See spell_from_script.
        opening = next((c for c in cfgs if c.get("episode_role") == "opening"), cfgs[0])
        # A line whose shots were dropped (episode `cut_lines`) is no longer said, so it leaves
        # the caption script too; otherwise it would be "missed" and could be put back.
        excluded = set(cut_lines) | set(ep.get("cut_lines") or [])
        scripted = " ".join([opening["question"]]
                            + [ln for c in cfgs for ln in brandkit.spoken_lines(c)
                               if ln not in excluded])
        words, cap_problems = spell_from_script(words, scripted)
        for pb in cap_problems:
            print(f"  CAPTION    {pb}")
        cards = caption_cards(words, cuts, gdur)
        # The rate that means anything is cards per second OF CAPTION, not per second of file:
        # a 28s episode with 14s of talking in it scores half as much on the second measure for
        # reasons that have nothing to do with the captions. Both are printed.
        capt_s = sum(e - s for s, e, _t in cards)
        changes = len(cards) / max(capt_s, 1e-6)
        print(f"  captions   {len(cards)} cards, {len(words)} words, max {CAP_MAX_WORDS} on "
              f"screen; {changes:.2f} changes/s of caption ({capt_s:.1f}s captioned), "
              f"{len(cards) / gdur:.2f}/s of file")
        print(f"  heard      {heard[:150]}")

        # -- 5. draw them, assert the safe zone on the PNG ------------------------------------
        size, laid = episode_cap_size([t for _s, _e, t in cards])
        print(f"  type       {size}px for every card, "
              f"{max(len(r) for r in laid)} row(s) max, one size for the whole episode")
        drawn = []
        span = None
        for i, ((s, e, text), rows) in enumerate(zip(cards, laid)):
            p = td / f"cap{i:03d}.png"
            b = caption_png(text, p, size, rows)
            span = (min(span[0], b[1]), max(span[1], b[3])) if span else (b[1], b[3])
            drawn.append((s, e, p))
        print(f"  drawn      every card inside y={span[0]}..{span[1]} "
              f"(safe {SAFE_TOP}..{SAFE_BOT}), measured on the PNGs")

        # -- 6. the two renders, through the IDENTICAL chain ----------------------------------
        gap = find_gap(graded)
        if gap is None:
            sys.exit(f"no speech-free window of {END_CARD_S}s anywhere in the episode, so there "
                     f"is no room tone to cut a bed or an end card from. A bed cut over speech "
                     f"loops that speech under the whole video, which is what 'random background "
                     f"noises' turned out to be twice on this format.")
        print(f"  room tone  {gap[0]:.2f}s +{gap[1]:.2f}s, measured speech-free in THIS cut")

        for captions, dest in ((True, OUT), (False, CTRL)):
            _finish(td, graded, drawn if captions else [], gap, ep, dest, spread)

        SIDE.write_text(json.dumps({
            "episode": ep.get("episode"), "config": ep["_path"],
            "takes": [{"take": str(t), "manifest": str(t.with_suffix(".json")),
                       "seed": m.get("seed"), "model": m.get("model"),
                       "brand_config": m.get("brand_config"),
                       "episode_role": m.get("episode_role"),
                       "pace_grammar": m.get("pace_grammar"),
                       "guard_grammar": m.get("guard_grammar"),
                       "can_grammar": m.get("can_grammar"),
                       "mic_ref_grammar": m.get("mic_ref_grammar"),
                       "can_size_grammar": m.get("can_size_grammar"),
                       "can_sealed_grammar": m.get("can_sealed_grammar"),
                       "upright_grammar": m.get("upright_grammar"),
                       "one_mic_grammar": m.get("one_mic_grammar"),
                       "est_cost": m.get("est_cost"), "plan": p}
                      for t, m, p in zip(takes, manifests, plans)],
            "location_clause": locs[0],
            "render": str(OUT), "control": str(CTRL),
            "cuts": [round(c, 3) for c in cuts],
            "captions": [[round(s, 3), round(e, 3), t] for s, e, t in cards],
            "caption_grammar": {"max_words": CAP_MAX_WORDS, "max_s": CAP_MAX_S,
                                "min_s": CAP_MIN_S, "cut_guard": CAP_CUT_GUARD,
                                "hold_s": CAP_HOLD_S, "max_rows": CAP_MAX_ROWS,
                                "y_centre": CAP_Y, "size": size,
                                "changes_per_caption_s": round(changes, 3),
                                "captioned_s": round(capt_s, 3)},
            "ambience_gap": list(gap), "black_lift": lift,
            "end_card_s": END_CARD_S, "graded_s": round(gdur, 3),
            # THE PLAN, so check S can re-derive each take's cuts from the take itself and
            # verify every boundary sits on one. Recording the plan is what makes the mid-shot
            # splice gateable at all: before this the sidecar said which takes were used and
            # not where they were cut, so the one fault the operator could see was the one
            # thing the gate had no way to look at.
            "plan": {t.name: [[round(s, 3), round(e, 3)] for s, e in p]
                     for t, p in zip(takes, plans)},
            "splice_tol": SPLICE_TOL,
            # Deliberately cut beats and the lines they carried. check I reads `dropped_lines`
            # so it can tell an editorial trim from a line that failed to land -- it still
            # fails on any OTHER scripted line being inaudible, which is the whole point of it.
            # Carried into the sidecar because the GATE reads the sidecar, not the episode
            # config. Declaring the coupling only in the config let the builder proceed while
            # check C still refused the file -- the declaration has to travel with the render.
            "coupled_by_scene_ref": ep.get("coupled_by_scene_ref"),
            "dropped_lines": cut_lines,
            "drop_shots": {k: [list(v) for v in vs] for k, vs in drops.items()},
        }, indent=1), encoding="utf-8")
        print(f"  sidecar    {SIDE}")

    join_report(OUT, [sum(e - s for s, e in plans[k]) for k in range(len(plans))])
    return 0


def _finish(td, graded, cards, gap, ep, dest, spread):
    """Overlay, bed, end card, master. The CONTROL is this same function with `cards` empty:
    the identical encode chain with the overlays left out, which is the only kind of control
    check-cut.py's F can difference against. A control encoded any other way differs in every
    pixel, because the concat pass is bitrate-capped, and then the whole frame reads as a
    caption -- measured, and it once read as 'graphics span y=0..1920'."""
    gap_s, gap_d = gap
    ins, filt, last = ["-i", str(graded)], [], "0:v"
    for i, (s, e, p) in enumerate(cards, start=1):
        ins += ["-i", str(p)]
        filt.append(f"[{last}][{i}:v]overlay=0:0:enable='between(t,{s:.3f},{e:.3f})'[v{i}]")
        last = f"v{i}"
    capped = td / f"capped{'C' if cards else 'X'}.mp4"
    run(["ffmpeg", "-v", "error", "-y", *ins,
         *(["-filter_complex", ";".join(filt), "-map", f"[{last}]"] if filt else ["-map", "0:v"]),
         "-map", "0:a", "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p",
         "-af", "aresample=48000", "-c:a", "aac", "-b:a", "192k",
         "-video_track_timescale", "30000", capped])

    # the bed, only when the segments still disagree. recut.py: below ~4 dB there is no step to
    # mask and a bed only raises the noise floor for nothing.
    bedded = capped
    if spread >= 4.0:
        room = td / "room.wav"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{gap_s:.3f}", "-t", f"{gap_d:.3f}",
             "-i", str(graded), "-vn", "-ac", "1", "-ar", "48000", room])
        if duration(room) < 0.25:
            sys.exit(f"the measured room-tone window is only {duration(room):.2f}s. Looping "
                     f"something that short is a tone, not a street.")
        bedded = td / f"bed{'C' if cards else 'X'}.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-i", str(capped), "-stream_loop", "-1",
             "-i", str(room), "-filter_complex",
             "[1:a]volume=0.35,aformat=channel_layouts=stereo:sample_rates=48000[b];"
             "[0:a][b]amix=inputs=2:duration=first:normalize=0,"
             "alimiter=limit=0.72:level=disabled[a]",
             "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
             bedded])

    epng = td / "end.png"
    _end_card(ep, epng)
    amb = td / "amb.m4a"
    # LOOPED, and extracted to a wav first. recut.py: "-stream_loop -1 -ss A -to B -i video.mp4"
    # silently contributes nothing and the mix then measures identical to no bed at all, which is
    # how this looked fixed once when it was not.
    room_end = td / "roomend.wav"
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{gap_s:.3f}", "-t", f"{gap_d:.3f}",
         "-i", str(graded), "-vn", "-ac", "2", "-ar", "48000", room_end])
    run(["ffmpeg", "-v", "error", "-y", "-stream_loop", "-1", "-i", str(room_end),
         "-t", f"{END_CARD_S}",
         # THE END CARD DOES NOT CARRY THE STREET. This bed used to hold a lowpassed room tone
         # at -10 dB for the whole card, fading only in the last 0.25s, and it measured -40 dB
         # RMS flat across all 2.2s -- audible street hiss under the brand card, which is what
         # the operator heard. A hard cut from 28s of traffic to digital silence reads as a
         # dropout, so the bed is kept only as a DECAY: it starts where the street left off and
         # falls to nothing over 0.8s, then the card is silent. The street drops away behind the
         # card instead of running under it.
         "-af", "aresample=48000,lowpass=f=2200,volume=-10dB,"
                "afade=t=out:st=0:d=0.8",
         "-c:a", "aac", "-b:a", "160k", amb])
    # A SILENT END CARD READ AS A DROPOUT (operator, Oct 1: the staging sample ended on 1.9s of
    # nothing). When the episode names `brand_layer.end_card_music`, a short sting plays under
    # the card: it enters as the street decays and fades out by the last frame.
    sting = ep["brand_layer"].get("end_card_music")
    if sting:
        sting = paths.ROOT / sting if not Path(sting).is_absolute() else Path(sting)
        if not sting.exists():
            sys.exit(f"end_card_music {sting} does not exist")
        mixed = td / "ambmix.m4a"
        run(["ffmpeg", "-v", "error", "-y", "-i", str(amb), "-i", str(sting),
             "-filter_complex",
             f"[1:a]aresample=48000,atrim=0:{END_CARD_S},asetpts=PTS-STARTPTS,volume=-6dB,"
             f"afade=t=in:st=0:d=0.12,afade=t=out:st={END_CARD_S - 0.7:.2f}:d=0.7[m];"
             f"[0:a][m]amix=inputs=2:duration=first:normalize=0[a]",
             "-map", "[a]", "-c:a", "aac", "-b:a", "160k", mixed])
        amb = mixed
    endclip = td / "end.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", f"{END_CARD_S}", "-i", str(epng),
         "-i", str(amb), "-vf", f"scale={W}:{H},gblur=sigma=0.7,noise=c0s=4:c0f=t+u,"
         "format=yuv420p", "-c:v", "libx264", "-crf", "17", "-c:a", "aac", "-b:a", "192k",
         "-video_track_timescale", "30000", "-shortest", endclip])

    lst = td / f"l{'C' if cards else 'X'}.txt"
    lst.write_text(f"file '{Path(bedded).as_posix()}'\nfile '{endclip.as_posix()}'",
                   encoding="utf-8")
    pre = td / f"pre{'C' if cards else 'X'}.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
         "-c:v", "libx264", "-b:v", "3400k", "-maxrate", "3800k", "-bufsize", "6800k",
         "-pix_fmt", "yuv420p", "-preset", "medium",
         "-af", "bass=g=3:f=110,treble=g=3:f=3200,alimiter=limit=0.9:level=false",
         "-c:a", "aac", "-b:a", "192k", pre])
    # loudness: two passes, because linear loudnorm undershoots ~0.4 LU on this stack every time
    # and a set of videos watched back to back must not step. The limiter goes AFTER loudnorm.
    stage = td / f"st{'C' if cards else 'X'}.mp4"
    ln = _loudnorm_filter(pre)
    # LIMIT 0.72, NOT 0.79. build_looks.py masters a 12s single take at 0.79 and clears the
    # -1.5 dBTP gate; this episode mixes a room-tone bed under three levelled takes and measured
    # -1.1 dBTP at 0.79, which check-cut.py's H correctly failed. recut.py has the number and the
    # reason: TRUE peak runs above sample peak, 0.72 (about -2.9 dBFS) leaves headroom and 0.82
    # measured -0.98 and still failed. Measured on the render, not assumed from the setting.
    run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-c:v", "copy",
         "-af", ln + ",aresample=48000,alimiter=limit=0.72:level=false",
         "-c:a", "aac", "-b:a", "160k", stage])
    m2 = _loudness(stage)
    run(["ffmpeg", "-v", "error", "-y", "-i", stage, "-c:v", "copy",
         "-af", f"volume={-14.0 - m2['input_i']:.2f}dB,alimiter=limit=0.72:level=false",
         "-c:a", "aac", "-b:a", "160k", dest])
    print(f"  {'RENDER ' if cards else 'control'}  {dest.name}  {duration(dest):.2f}s  "
          f"{dest.stat().st_size // 1024} KB")


def _loudness(p):
    r = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", p, "-af",
            "loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json", "-f", "null", "-"])
    try:
        m = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    except ValueError:
        raise RuntimeError(f"loudnorm printed nothing parseable for {p}: {r.stderr[-400:]}")
    return {k: float(v) for k, v in m.items() if k.startswith(("input", "target"))}


def _loudnorm_filter(p):
    m = _loudness(p)
    return ("loudnorm=I=-14:TP=-2.0:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s"
            ":measured_thresh=%s:offset=%s:linear=true"
            % (m["input_i"], m["input_tp"], m["input_lra"], m["input_thresh"],
               m["target_offset"]))


def _end_card(ep, path):
    build_looks.configure_brand_layer(ep["brand_layer"])
    build_looks.end_card(path, brand_layer=ep["brand_layer"])


def join_report(render, take_lengths):
    """The level step at each join between takes, measured ON THE RENDER.

    CLAUDE.md: measure the render, not the inputs. Every dB printed during the build was measured
    before the master, and per-source normalisation is exactly the thing a later bus gain undoes.

    IT ONLY MEASURES SPEECH-FREE AIR, and that is not a detail. The first version took a flat
    0.75s window either side of each join and reported a -13.6 dB step at 19.17s, where take B
    ends on "Motor oil." and take C opens on "Quick question." -- so one side of that window was
    a voice and the "floor" was the talking. recut.py has the identical warning about the metric
    it replaced: a level measured across a boundary "catches SPEECH on one side of the boundary",
    came out 18 dB for the single take and 5 dB for the assembled one, i.e. exactly backwards,
    and a metric that conflates two signals is worse than no metric. So a join with no quiet air
    within reach is reported as UNMEASURED, not as a number.
    """
    spans = recut.speech_spans(render)

    def quiet(a, b):
        """The largest speech-free slice of [a, b], or None."""
        free = [(a, b)]
        for s0, e0 in spans:
            nxt = []
            for x, y in free:
                if e0 <= x or s0 >= y:
                    nxt.append((x, y))
                    continue
                if s0 > x:
                    nxt.append((x, min(y, s0)))
                if e0 < y:
                    nxt.append((max(x, e0), y))
            free = [(x, y) for x, y in nxt if y - x > 0.001]
        free = [f for f in free if f[1] - f[0] >= 0.20]
        return max(free, key=lambda f: f[1] - f[0]) if free else None

    bounds, acc = [], 0.0
    for x in take_lengths[:-1]:
        acc += x
        bounds.append(acc)
    print()
    print("joins between takes, measured on the finished render (speech-free air only):")
    steps = []
    for b in bounds:
        qa, qb = quiet(max(0.0, b - 1.6), b - 0.02), quiet(b + 0.02, b + 1.6)
        fa = _win_floor(render, *qa) if qa else None
        fb = _win_floor(render, *qb) if qb else None
        if fa is None or fb is None:
            print(f"  {b:6.2f}s  UNMEASURED: no speech-free air within 1.6s on "
                  f"{'both sides' if not qa and not qb else 'one side'}. An unmeasured join is "
                  f"not a levelled one, and a number taken across a voice is worse than none.")
            continue
        steps.append(abs(fb - fa))
        print(f"  {b:6.2f}s  {fa:6.1f} dB ({qa[1] - qa[0]:.2f}s of air) -> {fb:6.1f} dB "
              f"({qb[1] - qb[0]:.2f}s)   step {fb - fa:+5.1f} dB")
    if steps:
        print(f"  worst step {max(steps):.1f} dB   (recut.py measured 2.2-6.4 dB unlevelled "
              f"within one take, 1.6 dB with a bed)")
    return steps


def _win_floor(path, a, b):
    import numpy as np
    if b - a < 0.15:
        return None
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a:.3f}", "-to", f"{b:.3f}",
                          "-i", str(path), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True).stdout
    x = np.frombuffer(raw, dtype="<i2").astype("float32") / 32768.0
    if x.size < 1600:
        return None
    w = 800
    e = [20 * np.log10(max(1e-6, float(np.sqrt((x[i * w:(i + 1) * w] ** 2).mean()))))
         for i in range(x.size // w)]
    return float(np.percentile(e, 20))


if __name__ == "__main__":
    sys.exit(main())
