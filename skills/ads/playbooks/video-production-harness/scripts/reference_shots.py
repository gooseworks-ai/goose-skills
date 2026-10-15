#!/usr/bin/env python3
"""The reference's cut list, its shot table, and the plan checked against it.

  reference_shots.py study REFERENCE.mp4 OUT_DIR [--fps 4] [--cut 0.15]
      Detects every cut, saves one full-resolution keyframe per shot and frames at
      4 fps or more across the whole reference (full resolution), estimates setups by
      clustering the keyframes, and writes OUT_DIR/shot-table.json. Fill each row's
      people, action, hand_on_product, camera and objects from the frames.
  reference_shots.py compare SHOT_TABLE.json PLAN.json
      Checks the plan's per-shot table against the reference and prints the shot and
      setup counts for the script approval. Exit 1 on any problem.

PLAN.json: {"creative_contract_revision", "shots": [{"shot", "ref_shot" (number or
list), "start_s", "end_s", "setup", "people", "action", "hand_on_product", "camera",
"objects", "segments", "overlays", "callback_of"}], "changes_from_reference": [...]}.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

FORMAT = "gooseworks-reference-shots/1"
CUT_THRESHOLD = 0.15     # ffmpeg scene score that counts as a cut
MIN_SHOT_S = 0.4         # cuts closer than this merge into one
SETUP_MAX_HAMMING = 10   # keyframes this close (of 64 bits) are one setup (as check-layer 1.8.0)
SETUP_MIN_SHOT_S = 0.5   # shots shorter than this give no setup keyframe
FLAT_STDDEV = 4          # a keyframe this flat (a black or one-colour card) is skipped
TOLERANCE = 0.30         # plan shot and setup counts within 30% of the reference
CALLBACK_EVERY_S = 15    # at most one callback per 15 s
FILLED = ("people", "action", "hand_on_product", "camera", "objects")


def scene_cuts(video, duration, threshold=CUT_THRESHOLD, min_shot_s=MIN_SHOT_S):
    """Cut times (s) inside the video, from ffmpeg's scene score; near-duplicates merge."""
    log = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(video), "-map", "0:v:0",
                          "-vf", f"select='gt(scene,{threshold})',showinfo", "-f", "null", "-"],
                         check=True, capture_output=True, text=True, timeout=600).stderr
    cuts = []
    for t in sorted({float(m[1]) for m in re.finditer(r"pts_time:\s*([0-9.]+)", log)}):
        if min_shot_s <= t <= duration - min_shot_s and (not cuts or t - cuts[-1] >= min_shot_s):
            cuts.append(t)
    return cuts


def keyframe(video, at_s):
    """(64-bit difference hash, grey standard deviation) of the frame at at_s (9x8 grey), or (None, 0)."""
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{at_s:.3f}", "-i", str(video), "-frames:v", "1",
                          "-vf", "scale=9:8:flags=area,format=gray", "-f", "rawvideo", "-"],
                         check=True, capture_output=True, timeout=60).stdout
    if len(raw) < 72:
        return None, 0.0
    value = 0
    for row in range(8):
        for col in range(8):
            value = (value << 1) | (raw[row * 9 + col] > raw[row * 9 + col + 1])
    mean = sum(raw[:72]) / 72
    return value, (sum((v - mean) ** 2 for v in raw[:72]) / 72) ** 0.5


def dhash(video, at_s):
    return keyframe(video, at_s)[0]


def setup_count(video, duration, spans):
    """Distinct setups the way check-layer 1.8.0 counts them: one keyframe at the middle of each
    span of at least 0.5 s, flat cards skipped, keyframes within 10 bits joined (single linkage)."""
    bits = []
    for a, b in spans:
        if b - a >= SETUP_MIN_SHOT_S:
            value, sd = keyframe(video, min(duration - 0.05, (a + b) / 2))
            if value is not None and sd >= FLAT_STDDEV:
                bits.append(value)
    return len(set(cluster_setups(bits)))


def hamming(a, b):
    return bin(a ^ b).count("1")


def cluster_setups(hashes, max_hamming=SETUP_MAX_HAMMING):
    """Setup index per shot: single linkage of keyframes within max_hamming bits."""
    parent = list(range(len(hashes)))

    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for j in range(len(hashes)):
        for i in range(j):
            if hashes[i] is not None and hashes[j] is not None and hamming(hashes[i], hashes[j]) <= max_hamming:
                parent[root(j)] = root(i)
    labels, out = {}, []
    for i in range(len(hashes)):
        out.append(labels.setdefault(root(i), len(labels)))
    return out


def probe(video):
    data = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(video)],
                                     check=True, capture_output=True, text=True, timeout=60).stdout)
    stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), None)
    if stream is None:
        raise ValueError("The reference has no video stream")
    return float(data.get("format", {}).get("duration", 0)), int(stream["width"]), int(stream["height"])


def measure_setups(video):
    """(shots, setups) measured from a video alone, the way the final is measured."""
    duration = probe(video)[0]
    edges = [0.0] + scene_cuts(video, duration) + [duration]
    spans = list(zip(edges, edges[1:]))
    return len(spans), setup_count(video, duration, spans)


def reference_setup_count(path):
    """Distinct setups of the reference: its shot table (the agent's labels), a final_measure
    JSON, or measured from the reference video itself."""
    path = Path(path)
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text())
        if data.get("format") == FORMAT:  # the measured count (what check-layer gets), else the labels
            return (data.get("totals") or {}).get("measured_setups") or totals(data.get("shots", []))["setups"]
        setups = (data.get("final_measure", data).get("measures") or {}).get("setups")
        return setups if isinstance(setups, int) and setups > 0 else None
    return measure_setups(path)[1]


def study(video, out_dir, fps=4, threshold=CUT_THRESHOLD):
    if fps < 4:
        raise ValueError("Sample the reference at 4 fps or more")
    video, out_dir = Path(video).resolve(), Path(out_dir).resolve()
    duration, width, height = probe(video)
    (out_dir / "keyframes").mkdir(parents=True, exist_ok=True)
    (out_dir / "frames").mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(video), "-an", "-vf", f"fps={fps}", "-q:v", "2",
                    str(out_dir / "frames" / "%05d.jpg")], check=True, timeout=900)
    frames = [{"t": round((i + 0.5) / fps, 3), "path": str(p)} for i, p in enumerate(sorted((out_dir / "frames").glob("*.jpg")))]
    edges = [0.0] + scene_cuts(video, duration, threshold) + [duration]
    edges_spans = list(zip(edges, edges[1:]))
    shots, hashes = [], []
    for index, (a, b) in enumerate(zip(edges, edges[1:]), 1):
        key = out_dir / "keyframes" / f"shot-{index:03d}.jpg"
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{(a + b) / 2:.3f}", "-i", str(video),
                        "-frames:v", "1", "-q:v", "2", str(key)], check=True, timeout=60)
        hashes.append(dhash(video, (a + b) / 2))
        shots.append({"shot": index, "start_s": round(a, 3), "end_s": round(b, 3), "keyframe": str(key),
                      "frames": [f["path"] for f in frames if a <= f["t"] < b],
                      **{k: None for k in FILLED}})
    for shot, label, value in zip(shots, cluster_setups(hashes), hashes):
        shot["setup"], shot["dhash"] = f"S{label + 1}", None if value is None else f"{value:016x}"
    table = {"format": FORMAT, "source": {"path": str(video), "sha256": hashlib.sha256(video.read_bytes()).hexdigest(),
                                          "duration_s": duration, "width": width, "height": height},
             "cut_threshold": threshold, "frame_fps": fps,
             "note": "setup is an estimate from keyframe similarity; correct it from the frames. Fill people (ids), action (verb or 'none'), hand_on_product, camera and objects for every shot.",
             "shots": shots, "totals": {**totals(shots, duration), "measured_setups": setup_count(video, duration, edges_spans)}}
    (out_dir / "shot-table.json").write_text(json.dumps(table, indent=2) + "\n")
    return table


def totals(shots, duration=None):
    people = {p for s in shots for p in (s.get("people") or [])}
    end = duration or max((s.get("end_s") or 0 for s in shots), default=0)
    return {"shots": len(shots), "setups": len({s.get("setup") for s in shots if s.get("setup")}),
            "people": len(people), "hands_on_product": sum(1 for s in shots if s.get("hand_on_product")),
            "mean_shot_s": round(end / len(shots), 2) if shots else None}


def unfilled(table):
    return [f"reference shot {s.get('shot')}: fill {', '.join(k for k in FILLED if s.get(k) is None)}"
            for s in table.get("shots", []) if any(s.get(k) is None for k in FILLED)]


def listed(changes, aspects, text=None):
    """True when changes_from_reference has an entry of one of these aspects (naming text, if given)."""
    for change in changes or []:
        if isinstance(change, dict) and change.get("aspect") in aspects:
            if text is None or text.lower() in f"{change.get('from', '')} {change.get('to', '')}".lower():
                return True
    return False


def as_list(value):
    return [] if value is None else value if isinstance(value, list) else [value]


def callback_cap(duration_s):
    return max(1, int(duration_s // CALLBACK_EVERY_S))


def compare(table, plan):
    """Problems with the plan against the reference shot table, and the counts line."""
    problems = unfilled(table)
    ref_shots, plan_shots = table.get("shots", []), plan.get("shots", [])
    changes = plan.get("changes_from_reference", [])
    ref, mine = totals(ref_shots), totals(plan_shots)
    known = {s.get("shot") for s in ref_shots}
    by_shot = {s.get("shot"): s for s in ref_shots}
    if not plan_shots:
        problems.append("The plan has no per-shot table (plan.shots)")
    covered, ids = set(), []
    for row in plan_shots:
        refs = as_list(row.get("ref_shot"))
        ids.append(row.get("shot"))
        if not refs and not listed(changes, {"shots"}):
            problems.append(f"plan shot {row.get('shot')}: no ref_shot and no `shots` entry in changes_from_reference")
        for number in refs:
            if number not in known:
                problems.append(f"plan shot {row.get('shot')}: ref_shot {number} is not in the reference")
                continue
            covered.add(number)
            for thing in by_shot[number].get("objects") or []:
                if not any(str(thing).lower() in str(o).lower() for o in row.get("objects") or []) \
                        and not listed(changes, {"action", "shots", "people"}, str(thing)):
                    problems.append(f"plan shot {row.get('shot')}: the reference shows '{thing}' (shot {number}); "
                                    "keep it or list the substitution in changes_from_reference")
    missing = sorted(n for n in known - covered if n is not None)
    if missing and not listed(changes, {"shots"}):
        problems.append(f"reference shot(s) {missing} have no plan row and no `shots` entry in changes_from_reference")
    for key in ("shots", "setups"):
        if ref[key] and abs(mine[key] - ref[key]) > TOLERANCE * ref[key] and not listed(changes, {"shots"}):
            problems.append(f"plan has {mine[key]} {key} against the reference's {ref[key]} (over 30% apart); "
                            "plan more or list a `shots` change")
    callbacks = [r for r in plan_shots if r.get("callback_of") is not None]
    for row in callbacks:
        if row["callback_of"] not in ids[:ids.index(row.get("shot"))]:
            problems.append(f"plan shot {row.get('shot')}: callback_of must name an earlier plan shot")
    duration = max((r.get("end_s") or 0 for r in plan_shots), default=0)
    if len(callbacks) > callback_cap(duration):
        problems.append(f"{len(callbacks)} callbacks in {round(duration, 1)} s; at most one per {CALLBACK_EVERY_S} s")
    line = (f"Shots: plan {mine['shots']} / reference {ref['shots']}; setups: plan {mine['setups']} / reference "
            f"{ref['setups']}; people: plan {mine['people']} / reference {ref['people']}; hands on product: plan "
            f"{mine['hands_on_product']} / reference {ref['hands_on_product']}")
    return problems, line


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    s = sub.add_parser("study")
    s.add_argument("reference")
    s.add_argument("out_dir")
    s.add_argument("--fps", type=float, default=4)
    s.add_argument("--cut", type=float, default=CUT_THRESHOLD)
    c = sub.add_parser("compare")
    c.add_argument("shot_table")
    c.add_argument("plan")
    args = parser.parse_args()
    if args.command == "study":
        table = study(args.reference, args.out_dir, args.fps, args.cut)
        print(json.dumps(table["totals"]))
        return 0
    problems, line = compare(json.loads(Path(args.shot_table).read_text()), json.loads(Path(args.plan).read_text()))
    print(line)
    for problem in problems:
        print(f"FAIL {problem}", file=sys.stderr)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
