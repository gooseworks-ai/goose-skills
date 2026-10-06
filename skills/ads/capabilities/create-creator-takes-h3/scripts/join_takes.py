#!/usr/bin/env python3
"""Join normalized creator takes, preserving measured speech before dissolving.

Use --spec takes.json or repeated --take file:reel_start. Supply per-take word
sidecars with --words (same order), or takes.json's `words` fields. When none of
takes.json's planned word files exist (legacy recipes that never transcribe takes),
the join falls back to estimated timing with a warning; some-but-not-all is an error.
--require-words rejects estimated timing. Writes OUT.timeline.json with the actual
reel mapping.

Prints the same summary line main always printed; recipes read the join times from it
(e.g. "Note the 'joins at' time it prints"):
    [join] 2 takes, joins at 4.70, 9.50s -> creator.mp4  (measured 9.50s)
    [join] one take, trimmed to 6.00s -> creator.mp4
Each "joins at" value is the reel time where the dissolve into that take begins
(timeline.json takes[k].start). The durations are the actual reel length, which a measured
join may extend past --end.
"""
import argparse
import json
import math
import pathlib
import re
import subprocess

XF = 0.10
LEAD = 0.11
PAD = 0.03


def onset(path):
    err = subprocess.run(["ffmpeg", "-v", "info", "-t", "3", "-i", path, "-af",
                          "silencedetect=noise=-35dB:d=0.03", "-f", "null", "-"],
                         capture_output=True, text=True, check=True).stderr
    m = re.search(r"silence_start: (-?[0-9.]+)[\s\S]*?silence_end: ([0-9.]+)", err)
    return float(m.group(2)) if m and float(m.group(1)) <= .02 else 0.0


def length(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", path], capture_output=True, text=True,
                                check=True).stdout)


def channels(path):
    """Audio channel count of the first audio stream (0 when there is none)."""
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
                          "stream=channels", "-of", "csv=p=0", path], capture_output=True,
                         text=True, check=True).stdout.strip()
    return int(out.split(",")[0]) if out else 0


def to_stereo(path):
    """Filter that brings a take to stereo at its original level. ffmpeg's automatic
    mono->stereo upmix applies a -3 dB pan law, so duplicate a mono channel instead."""
    if channels(path) == 1:
        return "pan=stereo|c0=c0|c1=c0"
    return "aformat=channel_layouts=stereo"


def read_words(path, duration):
    words = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    if isinstance(words, dict):
        words = words.get("words")
    if not isinstance(words, list) or not words:
        raise ValueError("word sidecar must contain a nonempty words array")
    previous = -1.0
    for w in words:
        start, end = float(w["start"]), float(w["end"])
        if not w.get("text", w.get("word", "")).strip() or not all(map(math.isfinite, (start, end))):
            raise ValueError("invalid measured word")
        if not 0 <= start < end <= duration + .02 or start < previous:
            raise ValueError("words must be ordered and inside their source take")
        w["start"], w["end"] = start, end
        previous = end
    return words


def schedule(takes, end, fps):
    """Pure scheduling: late speech shifts later takes; incoming speech gets silent lead."""
    if not takes or not math.isfinite(end) or end <= 0 or not 10 <= fps <= 120:
        raise ValueError("need takes, a positive finite end and fps between 10 and 120")
    measured = [bool(t.get("words")) for t in takes]
    if any(measured) and not all(measured):
        raise ValueError("supply measured words for EVERY take, or none")
    xf = round(XF * fps) / fps
    out = []
    for k, t in enumerate(takes):
        words = t.get("words")
        first = float(words[0]["start"]) if words else (t.get("onset") or LEAD)
        pad = max(0.0, xf + PAD - first) if k else 0.0
        desired = max(0.0, t["start"] - first - pad) if k else 0.0
        safe = out[-1]["speech_end"] + PAD if k and words else desired
        start = math.ceil((max(desired, safe) - 1e-8) * fps) / fps
        last = float(words[-1]["end"]) if words else None
        out.append({"path": t["path"], "start": start, "head_pad": pad,
                    "speech_end": start + pad + last if words else None,
                    "source_duration": t["duration"], "words": words})
    actual_end = max(end, out[-1]["speech_end"] + PAD) if all(measured) else end
    actual_end = math.ceil((actual_end - 1e-8) * fps) / fps
    if len(out) == 1 and not all(measured):
        # A lone take is trimmed to --end, never padded past its own last frame (main's behavior).
        actual_end = min(actual_end, math.floor((takes[0]["duration"] + 1e-8) * fps) / fps)
    for k, t in enumerate(out):
        t["body_end"] = (out[k + 1]["start"] if k + 1 < len(out) else actual_end) - t["start"]
        t["need"] = t["body_end"] + (xf if k + 1 < len(out) else 0)
        if t["body_end"] <= (xf if k else 0):
            raise ValueError("takes overlap too closely to join")
        short = t["need"] - t["source_duration"] - t["head_pad"]
        if short > .02 and (not all(measured) or short > 2):
            raise ValueError("%s is %.2fs but must run %.2fs to reach its join; plan a longer take"
                             % (t["path"], t["source_duration"], t["need"] - t["head_pad"]))
        t["tail_pad"] = max(0, short)
    return {"timing": "measured" if all(measured) else "estimated", "fps": fps,
            "dissolve_s": xf, "requested_end": end, "duration": actual_end, "takes": out}


def render(plan, out):
    fps, xf = plan["fps"], plan["dissolve_s"]
    fc, pieces, audio = [], [], []
    n = len(plan["takes"])
    for k, t in enumerate(plan["takes"]):
        # Normalize before every xfade, including differing input frame rates/time bases.
        def video(start, end, label):
            return (f"[{k}:v]tpad=start_duration={t['head_pad']:.6f}:start_mode=clone:"
                    f"stop_duration={t['tail_pad'] + .05:.6f}:stop_mode=clone,"
                    f"trim=start={start:.6f}:end={end:.6f},setpts=PTS-STARTPTS,"
                    f"fps={fps},settb=AVTB,setsar=1,format=yuv420p[{label}]")
        e = t["body_end"]
        fc.append(video(xf if k else 0, e, f"body{k}"))
        pieces.append(f"[body{k}]")
        if k + 1 < n:
            fc.append(video(e, e + xf, f"xa{k}"))
            nxt = plan["takes"][k + 1]
            fc.append(f"[{k+1}:v]tpad=start_duration={nxt['head_pad']:.6f}:start_mode=clone,"
                      f"trim=0:{xf:.6f},setpts=PTS-STARTPTS,fps={fps},settb=AVTB,"
                      f"setsar=1,format=yuv420p[xb{k}]")
            fc.append(f"[xa{k}][xb{k}]xfade=duration={xf:.6f}:offset=0[x{k}]")
            pieces.append(f"[x{k}]")
        fc.append(f"[{k}:a]aresample=48000,{to_stereo(t['path'])},"
                  f"adelay={t['head_pad']*1000:.6f}:all=1,apad,atrim=0:{t['need']:.6f},"
                  f"asetpts=PTS-STARTPTS[a{k}]")
        audio.append(f"[a{k}]")
    fc.append(f"{''.join(pieces)}concat=n={len(pieces)}:v=1:a=0,"
              f"fps={fps},trim=duration={plan['duration']:.6f},setpts=PTS-STARTPTS[v]")
    prev = audio[0]
    for k in range(1, n):
        lab = f"[ac{k}]"
        fc.append(f"{prev}{audio[k]}acrossfade=d={xf:.6f}:c1=tri:c2=tri{lab}")
        prev = lab
    cmd = ["ffmpeg", "-v", "error", "-y"]
    for t in plan["takes"]:
        cmd += ["-i", t["path"]]
    cmd += ["-filter_complex", ";".join(fc), "-map", "[v]", "-map", prev,
            "-t", str(plan["duration"]), "-c:v", "libx264", "-crf", "10", "-c:a", "aac",
            "-b:a", "192k", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    if abs(length(out) - plan["duration"]) > 1 / fps + .02:
        raise RuntimeError("joined duration differs from the measured timeline")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--take", action="append")
    ap.add_argument("--spec")
    ap.add_argument("--words", action="append")
    ap.add_argument("--require-words", action="store_true")
    ap.add_argument("--end", type=float, required=True)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    entries = []
    if a.spec:
        sp = json.loads(pathlib.Path(a.spec).read_text(encoding="utf-8"))
        for t in sp["takes"]:
            entries.append((str(pathlib.Path(sp["out"]) / f"{t['id']}-seed{t['seed']}.mp4"),
                            float(t["covers"][0]), t.get("words")))
    elif a.take:
        entries = [(t.rsplit(":", 1)[0], float(t.rsplit(":", 1)[1]), None) for t in a.take]
    else:
        ap.error("give --spec or --take")
    for p, _, _ in entries:
        if not pathlib.Path(p).is_file():
            raise SystemExit(f"take missing: {p} (run run_takes.py)")
    if a.words:
        if len(a.words) != len(entries):
            ap.error("--words count must match takes")
        entries = [(p, s, w) for (p, s, _), w in zip(entries, a.words)]
    if a.spec and not a.words and not a.require_words:
        planned = [w for _, _, w in entries if w]
        if planned and not any(pathlib.Path(w).is_file() for w in planned):
            # plan_takes.py names a word file for every take, but recipes written before
            # measured joins never transcribe takes. Keep those joins working (estimated,
            # with the warning below); a partial set still stops.
            print("WARNING: no per-take word files exist yet; falling back to estimated timing. "
                  "Pass --require-words to make this an error.")
            entries = [(p, s, None) for p, s, _ in entries]
    takes = []
    for p, s, w in sorted(entries, key=lambda t: t[1]):
        d = length(p)
        if w and not pathlib.Path(w).is_file():
            raise SystemExit(f"missing measured words: {w}; transcribe and inspect this take first")
        takes.append({"path": p, "start": s, "duration": d,
                      "words": read_words(w, d) if w else None, "onset": onset(p) if not w else None})
    if a.require_words and not all(t["words"] for t in takes):
        raise SystemExit("measured words are required before joining")
    try:
        plan = schedule(takes, a.end, a.fps)
    except ValueError as e:
        raise SystemExit(str(e))
    if plan["timing"] == "estimated":
        print("WARNING: estimated speech timing; this join cannot certify complete words")
    render(plan, a.out)
    joined = []
    for t in plan["takes"]:
        for w in t["words"] or []:
            joined.append({**w, "start": w["start"] + t["start"] + t["head_pad"],
                           "end": w["end"] + t["start"] + t["head_pad"]})
    plan["words"] = joined
    pathlib.Path(a.out + ".timeline.json").write_text(json.dumps(plan, indent=2), encoding="utf-8")
    n = len(plan["takes"])
    if n == 1:
        print("[join] one take, trimmed to %.2fs -> %s" % (plan["duration"], a.out))
    else:
        print("[join] %d takes, joins at %s, %.2fs -> %s  (measured %.2fs)"
              % (n, ", ".join("%.2f" % t["start"] for t in plan["takes"][1:]),
                 plan["duration"], a.out, length(a.out)))
    print(f"[join] timing {plan['timing']}; reel mapping -> {a.out}.timeline.json")


if __name__ == "__main__":
    main()
