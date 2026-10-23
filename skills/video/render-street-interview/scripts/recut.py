#!/usr/bin/env python3
"""Re-cut ONE generated take into a fast interleaved edit. Free, no network, no re-generation.

    python recut.py <in.mp4> <out.mp4> [--plan a,b a,b ...]

WHY THIS EXISTS

Seed 4812 was correct in every respect the operator had asked for -- right microphone, one
location, clean dialogue, four distinct people -- and still did not read like the references.
Measured, the reason was structure, not realism:

  * the first man held 5.50s of a 12.10s clip and was never seen again
  * only ~5.0s of the 12.10s carried any speech at all; the other ~7s was dead air
    (2.0s before the question, 2.4s after it, 2.6s while the last person drank)
  * four sequential blocks, median shot 2.57s, against 1.54-1.62s across three real references

None of that is fixable by generating again: fourteen takes produced four sequential blocks
regardless of prompt wording or length. It is an EDIT problem, and editing is what turns
interview rushes into an interview. This cuts the dead air and interleaves the speakers, using
footage already paid for, so it costs nothing.

Audio and video are always cut TOGETHER, so lip sync survives. A cut-back to an earlier speaker
uses a stretch where they are silent, which is what a reaction shot is.

The result stays ONE generation, so check-cut.py's provenance rule still holds: this is not
stitching separate renders, which is the thing that failed at seeds 4501-4701.
"""
import argparse
import json
import pathlib
import subprocess
import sys
import tempfile

import brandkit
import edit_timeline


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(path)],
                         capture_output=True, text=True).stdout.strip()
    return float(out)


def ambient_floor(path):
    """The 10th-percentile short-window level, in dB. That is the room tone under the speech."""
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "16000",
                          "-f", "s16le", "-"], capture_output=True).stdout
    a = np.frombuffer(raw, dtype="<i2").astype("float32") / 32768.0
    if a.size < 1600:
        return None
    w = 800
    e = [20 * np.log10(max(1e-6, float(np.sqrt((a[i * w:(i + 1) * w] ** 2).mean()))))
         for i in range(a.size // w)]
    return float(np.percentile(e, 10))


def cut(src, a, b, dst, gain_db=0.0):
    """One segment, re-encoded so the joins are frame accurate. Stream copy would snap to
    keyframes and land the cut in the wrong place."""
    af = [] if abs(gain_db) < 0.05 else ["-af", f"volume={gain_db:.2f}dB"]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}",
                    "-i", str(src), *af, "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
                    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", str(dst)], check=True)



def speech_spans(path, drop_db=18.0, win=0.1):
    """Where speech actually is, in seconds, from the audio envelope. No network, no Whisper."""
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "16000",
                          "-f", "s16le", "-"], capture_output=True).stdout
    a = np.frombuffer(raw, dtype="<i2").astype("float32") / 32768.0
    w = int(16000 * win)
    if a.size < w * 4:
        return []
    e = np.array([20 * np.log10(max(1e-6, float(np.sqrt((a[i * w:(i + 1) * w] ** 2).mean()))))
                  for i in range(a.size // w)])
    on = e > (e.max() - drop_db)
    spans, cur = [], None
    for i, v in enumerate(on):
        if v and cur is None:
            cur = i
        if not v and cur is not None:
            if i - cur >= 2:
                spans.append((cur * win, i * win))
            cur = None
    if cur is not None:
        spans.append((cur * win, len(on) * win))
    # join spans separated by less than 0.35s: that is a breath inside one line, not a new line
    merged = []
    for a0, b0 in spans:
        if merged and a0 - merged[-1][1] < 0.35:
            merged[-1] = (merged[-1][0], b0)
        else:
            merged.append((a0, b0))
    return merged


REF_BAND = (1.54, 1.62)     # the three real references' median SHOT, measured. refs/REFERENCES.md
# Kept as one named constant because the plan map records it, and because the distinction it
# turns on is the whole of the DEAD END note below: a segment in the plan is not a shot on the
# screen, and only the second one is what the references were measured on.


def _median(xs):
    s = sorted(xs)
    n = len(s)
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2


# A MEASURED DEAD END, kept as a comment because it looks obviously right and is not.
#
# The first version of this file split any shot over 2.0s in half, to add shots and pull the
# median down. The plan then REPORTED a 1.05s median on seed 4815 and the finished file measured
# 1.87s, because the two halves of a split are CONTIGUOUS SOURCE: there is no picture change at
# the join, so there is no cut, and a scene detector correctly counts one shot where the plan
# counted two. Measured three ways on seed 4815, all at scene threshold 0.30 on the render:
#
#   4 segments, no split                 4 shots, median 1.87s, final 1.55s
#   6 segments, contiguous splits        4 shots, median 1.87s, final 1.55s   (identical)
#   7 segments, 0.25s gap at each split  4 shots, median 1.71s, final 1.55s   (still 4 shots)
#
# Even a 0.25s pose jump inside one person does not cross the detector's threshold, and the
# improvement in the third row comes entirely from the file being shorter, not from a new cut.
#
# THE CONCLUSION, which is what SKILL.md item 15 was actually asking: the number of VISIBLE
# shots in a single-generation take is the number of distinct people the model put in it, and
# re-cutting cannot change it. Re-cutting controls shot LENGTH. So the median can be pulled from
# 2.69s down to about 1.70s by trimming dead air off each shot, and the last 0.1-0.15s to the
# 1.54-1.62s band needs a take with MORE internal shots, which is a paid generation.


def auto_plan(path, lead=0.30, tail=0.25, min_speech=0.45):
    """Build the cut plan from THIS take's own speech, not from a previous take's timings.

    The plan used to be hardcoded to seed 4812's speech positions. Seed 4814 put its lines
    somewhere else, the fixed plan cut the dialogue out, and the gate correctly reported two
    scripted lines as inaudible. A recipe cannot carry one take's timings.

    Each line gets ONE shot: a little lead-in, the line, a little tail. Everything between
    lines is dead air and is dropped, and that is the whole of what closes the pace gap -- see
    the MEASURED DEAD END note above for why splitting a shot does not add one. `lead` and
    `tail` are therefore the only pace controls here, and they trade pace against clipping a
    word: at 0.30/0.25 seed 4815 lands at a 1.70s median and all four scripted lines still
    clear check-cut.py's Whisper check.

    TWO RULES THAT ARE NOT OPTIONAL, both paid for on seed 4815:

    1. SEGMENTS MAY NOT OVERLAP. The padded spans did. A 0.3s envelope blip at 4.80-5.10 became
       a 4.35-5.45 shot, the next real line's shot started at 5.05, and 0.4s of audio was
       therefore spliced into the edit TWICE. Whisper then heard "quick question, what's in this
       can" several times over and reported two scripted lines as inaudible -- the same symptom
       the concat demuxer produced, from a completely different cause, which is exactly why this
       had to be falsified rather than reasoned about.
    2. A SPAN SHORTER THAN `min_speech` IS NOT A LINE. It is a breath, a door, or a bus. Padding
       it by 0.8s manufactures a shot of nothing and it was the blip above that caused (1).
    """
    dur = probe(path)
    plan = []
    prev_end = 0.0
    for a0, b0 in speech_spans(path):
        if b0 - a0 < min_speech:
            continue
        s0, e0 = max(0.0, prev_end, a0 - lead), min(dur, b0 + tail)
        if e0 - s0 < 0.30:
            continue
        plan.append((round(s0, 2), round(e0, 2)))
        prev_end = e0
    # Belt and braces. The clamp above is the fix; this is the assertion that it held, because
    # a duplicated segment is silent in the picture and only shows up in a transcript.
    for (s1, e1), (s2, _e2) in zip(plan, plan[1:]):
        if s2 < e1 - 0.001:
            raise RuntimeError(f"auto_plan produced overlapping segments {s1}-{e1} and "
                               f"{s2}-{_e2}: that splices the same audio in twice")
    return plan


# A FALLBACK plan only. Each pair is (start, end) in the SOURCE take.
# Derived from the measured speech spans, not from eyeballing: speech sits at 2.00-3.40,
# 5.80-7.10, 7.60-8.60 and 11.20-12.00, so everything else is trimmable dead air.
# A 0.6s cut BACK to an earlier speaker was tried and removed. It read as a flash rather than a
# reaction: we left the last speaker, saw him for 0.6s, and returned. It also caused the two worst
# joins of the five, because cutting between two people moves the subject across the frame, and
# these four stand in different parts of it (man 1 left of centre, man 2 centre, the nurse centre
# left, the last person centre right).
#
# Giving man 1 TWO shots of himself instead is smooth, because a jump cut within one person does
# not move the subject, and it is what the references actually do. He appears twice without any
# cut back.
DEFAULT_PLAN = [
    (0.80, 2.20),   # man 1, taking the can
    (2.20, 3.60),   # man 1 again, jump cut, over the question
    (5.40, 7.30),   # man 2, "Beer. Obviously."
    (7.30, 8.80),   # the nurse, "Something that's gonna kill me."
    (8.80, 9.60),   # the last person raising the can
    (10.90, 12.10),  # "Wait, that's water."
]


def _loudness(path):
    """Integrated LUFS and true peak off loudnorm's JSON, or a loud exit."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af",
                        "loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    try:
        return json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
    except (ValueError, json.JSONDecodeError):
        sys.exit(f"loudnorm printed no parseable JSON for {path}; the loudness pass cannot run. "
                 f"ffmpeg said: {(r.stderr or '').strip()[-300:]}")


def _master(dst: pathlib.Path):
    """Normalise the finished re-cut to -14 LUFS with the limiter AFTER loudnorm. Returns the
    measured integrated loudness of the result, which is MEASURED and not assumed: linear
    loudnorm undershoots about 0.4 LU on this stack every time."""
    m = _loudness(dst)
    ln = ("loudnorm=I=-14:TP=-2.0:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s"
          ":measured_thresh=%s:offset=%s:linear=true"
          % (m["input_i"], m["input_tp"], m["input_lra"], m["input_thresh"],
             m["target_offset"]))
    stage = dst.with_suffix(".ln.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(dst), "-c:v", "copy",
                    "-af", ln + ",aresample=48000,alimiter=limit=0.79:level=false",
                    "-c:a", "aac", "-b:a", "160k", str(stage)], check=True)
    m2 = _loudness(stage)
    gain = -14.0 - float(m2["input_i"])
    final = dst.with_suffix(".mst.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(stage), "-c:v", "copy",
                    "-af", f"volume={gain:.2f}dB,alimiter=limit=0.79:level=false",
                    "-c:a", "aac", "-b:a", "160k", str(final)], check=True)
    stage.unlink()
    final.replace(dst)
    return float(_loudness(dst)["input_i"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src", type=pathlib.Path)
    ap.add_argument("dst", type=pathlib.Path)
    ap.add_argument("--ambient", nargs=2, type=float, default=None,
                    metavar=("START", "END"),
                    help="a speech-free stretch of the SOURCE to loop as room tone under the "
                         "whole edit, masking the level step at every join; 0 0 disables it. "
                         "The default comes from brand_layer.ambience_gap, which is MEASURED "
                         "per take.")
    ap.add_argument("--brand", default=None,
                    help="brand slug in brands/ (default liquid-death). Supplies the measured "
                         "ambience window; there is no safe fallback for it.")
    ap.add_argument("--no-auto", dest="auto", action="store_false",
                    help="use the stored plan instead of deriving one from this take")
    ap.add_argument("--bed", type=float, default=3.0,
                    help="gain on the looped room tone; 3.0 measured mean join step 4.6 -> 1.6 dB")
    ap.add_argument("--plan", nargs="*", default=None,
                    help="segments as start,end pairs; default is the Liquid Death plan")
    ap.add_argument("--lead", type=float, default=0.30,
                    help="seconds kept before each line. The only pace control here, with "
                         "--tail: shot COUNT is fixed by the generation. Lower is faster and "
                         "risks clipping a word; check-cut.py's I check is the test.")
    ap.add_argument("--tail", type=float, default=0.25, help="seconds kept after each line")
    ap.add_argument("--no-loudness", action="store_true",
                    help="skip the -14 LUFS corrective pass on the finished re-cut. Dropping "
                         "dead air raises integrated loudness, so without it the re-cut fails "
                         "check-cut.py's H; only use this when a later pass will master it.")
    a = ap.parse_args()

    # -- the ambience window belongs to a TAKE, not to this file ----------------------------
    # It was `default=(0.05, 1.90)`: a hardcoded window measured on some earlier take. On the
    # approved seed 4815, 0.05-1.90 IS the interviewer's question ("Quick question. What's in
    # this can?", speech measured at 0.10-1.70), so the "room tone" bed was that line, looped
    # under the whole edit. MEASURED on the output: Whisper then heard "quick question, what's
    # in this can" three times over and reported the three answers as inaudible, which reads
    # exactly like a duplicated segment and is not one. This is the documented "random
    # background noises" fault, and build_looks.py had already been fixed for it once (its two
    # constants 8.0s and 7.6s landed on speech on 4815 too). The same bug, in a second file.
    if a.ambient is not None and tuple(a.ambient) == (0.0, 0.0):
        a.ambient = None
    elif a.ambient is None:
        cfg = brandkit.load(a.brand)
        gap = cfg.get("brand_layer", {}).get("ambience_gap")
        if not gap:
            sys.exit(f"{cfg['brand']} has no measured brand_layer.ambience_gap, and there is no "
                     f"safe default: a window guessed for one take lands on a spoken line in "
                     f"the next, and a bed cut over speech loops that speech under the whole "
                     f"video. Measure a speech-free window in THIS take and record it, pass "
                     f"--ambient START END, or pass --ambient 0 0 to run with no bed.")
        a.ambient = (float(gap[0]), float(gap[0]) + float(gap[1]))
        print("  ambience window %.2f-%.2fs from brand_layer.ambience_gap" % a.ambient)
    if a.ambient:
        # And verify it on THIS file rather than trusting the config, because the config's
        # window was measured on the take and this script is usually handed the graded copy.
        aa, ab = a.ambient
        clash = [(s, e) for s, e in speech_spans(a.src) if s < ab and e > aa]
        if clash:
            sys.exit(f"the ambience window {aa:.2f}-{ab:.2f}s overlaps speech at "
                     f"{[(round(s, 2), round(e, 2)) for s in [clash[0][0]] for e in [clash[0][1]]]}"
                     f" in {a.src.name}. A bed cut over a spoken line loops that line under the "
                     f"whole video: on seed 4815 the transcript came back with the interviewer's "
                     f"question three times and all three answers missing. Measure a real gap.")
    plan = ([tuple(float(x) for x in p.split(",")) for p in a.plan] if a.plan
            else auto_plan(a.src, lead=a.lead, tail=a.tail) if a.auto else DEFAULT_PLAN)
    if not plan:
        # NOT a silent fallback. DEFAULT_PLAN is seed 4815's own speech positions; applying it
        # to a take whose speech is somewhere else cuts the dialogue out, which is the failure
        # this function was written to stop. If no speech was found, the input is wrong or the
        # envelope detector is, and either way a different take's timings are not the answer.
        sys.exit(f"no speech found in {a.src}. Refusing to fall back to the stored plan: those "
                 f"are ANOTHER take's timings and applying them cuts the dialogue out (seed "
                 f"4814). Check the file has audio, or pass --plan explicitly, or --no-auto if "
                 f"you really mean the stored plan.")
    ambient_window = a.ambient
    dur = probe(a.src)
    for s, e in plan:
        if not (0 <= s < e <= dur + 0.01):
            sys.exit(f"segment {s}-{e} is outside the source (0-{dur:.2f})")

    a.dst.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        # AMBIENT MATCHING. Measured on the first recut: the street tone stepped 2.2 to 6.4 dB at
        # every join, because each segment carries the ambience of its own moment and splicing
        # puts them end to end. That step is what reads as an abrupt cut, more than the picture.
        # Masking it with a looped room-tone bed did nothing at any level. Levelling each segment
        # to a common floor removes it at source.
        raw_parts, floors = [], []
        for i, (ss, ee) in enumerate(plan):
            q = pathlib.Path(td) / f"r{i:02d}.mp4"
            cut(a.src, ss, ee, q)
            raw_parts.append(q)
            floors.append(ambient_floor(q))
        good = [f for f in floors if f is not None]
        if len(good) != len(floors):
            # A segment whose floor cannot be measured cannot be levelled, and levelling the
            # segments is the whole point of this pass. It used to print "floor 0.0 dB, gain
            # +0.00" and carry on, which looks like a measurement and is not one.
            bad = [i + 1 for i, f in enumerate(floors) if f is None]
            sys.exit(f"could not measure an ambient floor for segment(s) {bad} of {len(floors)}. "
                     f"They cannot be levelled to a common floor, and an unlevelled join is the "
                     f"2.2-6.4 dB step that reads as an abrupt cut. Widen the plan or fix the "
                     f"audio; do not ship an unmeasured segment.")
        target = sum(good) / len(good) if good else 0.0

        parts = []
        for i, (ss, ee) in enumerate(plan):
            g = 0.0 if floors[i] is None else max(-6.0, min(6.0, target - floors[i]))
            p = pathlib.Path(td) / f"p{i:02d}.mp4"
            cut(a.src, ss, ee, p, gain_db=g)
            parts.append(p)
            print("  seg %d  floor %6.1f dB  gain %+5.2f dB" % (i + 1, floors[i] or 0.0, g))
        # The concat FILTER, not the concat demuxer with -c copy. The demuxer repeated earlier
        # segments: seed 4814's re-cut came back saying "quick question, what's in this can"
        # several times over, confirmed with two Whisper models, while each segment cut on its
        # own was correct. Re-encoding once at the join is cheap and deterministic.
        ins = []
        for q in parts:
            ins += ["-i", str(q)]
        encoded_lengths = [probe(part) for part in parts]
        n = len(parts)
        fc = "".join("[%d:v][%d:a]" % (i, i) for i in range(n)) + "concat=n=%d:v=1:a=1[v][a]" % n
        subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", fc,
                        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast",
                        "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
                        str(a.dst)], check=True)

    # -- the continuous ambience bed --------------------------------------------------------
    # Splicing puts each segment's own moment of room tone end to end, so the street steps at
    # every join: measured 2.2 to 6.4 dB, mean 4.6, and THAT is what reads as an abrupt cut, more
    # than the picture does. Real footage has one ambience running under every cut. Levelling the
    # segments first was not enough, because a segment's average floor does not control the level
    # at its boundary. A looped bed of real room tone does: mean step drops to 1.6 dB.
    #
    # It MUST be extracted to a wav first. "-stream_loop -1 -ss A -to B -i video.mp4" silently
    # contributes nothing, and the mix then measures identical to no bed at all at any volume,
    # which is how this looked fixed when it was not.
    # THE BED IS SCALED TO THE MATERIAL, not hardcoded. A fixed gain of 3.0 was tuned on a take
    # whose segment floors sat near -45 dB. Seed 4814's floors were -31 to -35, so the same 3.0
    # drowned the dialogue: the envelope read one continuous 10.5s span, loudness hit -10 LUFS
    # against a -14 target, and two Whisper models garbled the lines into repeats. Same failure
    # class as the hardcoded cut plan: a constant measured on one take is not a recipe.
    #
    # And the bed is only worth adding when the segments actually disagree. If their floors are
    # already within a few dB there is no step to mask, and adding one only raises the noise.
    spread = (max(good) - min(good)) if len(good) > 1 else 0.0
    if a.ambient and spread < 4.0:
        print("  segment floors within %.1f dB; no bed needed" % spread)
        a.ambient = None
    if a.ambient:
        aa, ab = a.ambient
        # put the bed about 8 dB under the mean segment floor: audible enough to bridge, quiet
        # enough to stay out of the way
        bed_gain = min(3.0, max(0.15, 10 ** ((target - 8.0 - (-45.0)) / 20.0)))
        room = a.dst.with_suffix(".room.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{aa:.3f}", "-to", f"{ab:.3f}",
                        "-i", str(a.src), "-vn", "-ac", "1", "-ar", "48000", str(room)],
                       check=True)
        tmp = a.dst.with_suffix(".pre.mp4")
        a.dst.replace(tmp)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp),
                        "-stream_loop", "-1", "-i", str(room),
                        "-filter_complex",
                        f"[1:a]volume={bed_gain:.3f},aformat=channel_layouts=stereo[bed];"
                        # A LIMITER, and it is not optional. amix sums the bed onto dialogue that was already
                        # normalised to -14 LUFS, which pushed the result to 0.00 dBFS with samples at full
                        # scale. Three cuts were sent to the operator clipping before check-cut.py caught it
                        # on true peak. The gate wants under -1.5 dBTP and TRUE peak runs above sample peak, so 0.72 (about -2.9 dBFS) leaves headroom; 0.82 measured -0.98 and still failed.
                        "[0:a][bed]amix=inputs=2:duration=first:normalize=0,"
                        "alimiter=limit=0.72:level=disabled[a]",
                        "-map", "0:v", "-map", "[a]", "-c:v", "copy",
                        "-c:a", "aac", "-b:a", "128k", str(a.dst)], check=True)
        tmp.unlink(); room.unlink()

    # -- loudness, measured on the FINISHED re-cut ------------------------------------------
    # Dropping dead air raises the integrated loudness (there is less quiet in the file), and
    # mixing a bed raises it again. Measured: seed 4815's graded take sits at -13.6 LUFS and its
    # re-cut came out at -12.6, which check-cut.py's H correctly failed at a -14 +/- 0.7 target.
    # The re-cut is the file that gets gated, so the re-cut is the file that has to be right;
    # leaving it to a later pass is how per-source normalisation gets silently undone.
    # Two passes, because linear loudnorm undershoots on this stack, and the limiter goes AFTER.
    if not a.no_loudness:
        lufs = _master(a.dst)
        print("  loudness  %.1f LUFS after a measured corrective pass (target -14)" % lufs)

    total = sum(e - s for s, e in plan)
    lens = sorted(e - s for s, e in plan)
    med = _median(lens)
    print(f"{a.dst}  {len(plan)} segments, {total:.2f}s, median SEGMENT {med:.2f}s "
          f"(real references cut at a 1.54-1.62s median SHOT), from {dur:.2f}s")
    print("  a segment is not a shot. Measure the render: `measure-pace.py "
          f"{a.dst.name}`")

    # -- the common timeline map -----------------------------------------------------------
    # Encoder frame rounding belongs in output offsets, never in source word times.
    # Use measured segment lengths, then check against the finished output.
    actual_duration = probe(a.dst)
    if abs(sum(encoded_lengths) - actual_duration) > 0.1:
        sys.exit("encoded segment durations do not match the recut; no trustworthy edit map can be written")
    out_t, segs = 0.0, []
    for i, ((s, e), length) in enumerate(zip(plan, encoded_lengths)):
        end = actual_duration if i == len(plan) - 1 else out_t + length
        segs.append({"src_start": round(s, 6), "src_end": round(e, 6),
                     "out_start": round(out_t, 6), "out_end": round(end, 6)})
        out_t = end
    a.dst.with_suffix(".plan.json").write_text(json.dumps(
        {"version": 1, "source": str(a.src.resolve()), "output": str(a.dst.resolve()),
         "source_sha256": edit_timeline.file_hash(a.src),
         "output_sha256": edit_timeline.file_hash(a.dst),
         "source_duration": round(dur, 6), "output_duration": round(actual_duration, 6),
         "shots": len(plan), "median_shot": round(med, 3),
         "final_shot": round(plan[-1][1] - plan[-1][0], 3),
         "reference_median_band": list(REF_BAND),
         "ambience": {"source": str(a.src.resolve()),
                      "start": ambient_window[0] if ambient_window else None,
                      "duration": ambient_window[1] - ambient_window[0] if ambient_window else None,
                      "bed_applied": bool(a.ambient)},
         "_note": "median_shot/final_shot are source SEGMENT lengths, not shots measured on the render. "
                  "Output offsets use encoded durations. build_looks.py consumes this map; word times "
                  "and the ambience window remain in original SOURCE seconds.",
         "segments": segs}, indent=1), encoding="utf-8")
    print(f"  edit map  {a.dst.with_suffix('.plan.json').name}  (shared source spans -> output timeline)")


if __name__ == "__main__":
    main()
