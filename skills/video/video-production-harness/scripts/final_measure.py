"""gooseworks-final-measure/1: measured checks on a finished video file.

The GooseWorks server runs the same checks on an uploaded final and reports
each fail as a graded finding; only a broken file is refused. This copy gives the
agent the same answer before upload (graded in final_grade.py). Every
check returns pass, fail or not_applicable with the time ranges it found.
These are measurements, not a creative verdict.
"""
import json
import math
from pathlib import Path
import re
import subprocess
import sys

# Load sibling helpers from this file's own folder. `python3 -I` (isolated
# mode) leaves the script folder off sys.path, so add it explicitly.
_SCRIPTS = str(Path(__file__).resolve().parent)
if _SCRIPTS not in sys.path:
    sys.path.insert(0, _SCRIPTS)
from assembly_timeline import (CALLBACK_PREFIX, MAX_END_FREEZE_MS, MAX_FREEZE_MS, MAX_PAUSE_MS,  # noqa: E402
                                MAX_PAUSE_SHARE, freeze_cap_ms, normalize_timeline)
# script_lines is re-exported for qc_evidence.py.
from final_measure_parts import (THRESHOLDS, beyond_edges, check, covered, runs, script_lines,  # noqa: E402,F401
                                 sound_checks, word_checks)
from reference_shots import as_list, callback_cap, dhash, listed, scene_cuts, setup_count, totals  # noqa: E402

FINAL_MEASURE_FORMAT = "gooseworks-final-measure/1"


def detected_intervals(log, start_key, end_key, duration):
    intervals, opened = [], None
    for match in re.finditer(rf'({re.escape(start_key)}|{re.escape(end_key)}):\s*([0-9.]+)', log):
        point = min(duration, float(match[2]))
        if match[1] == start_key:
            opened = point
        elif opened is not None:
            intervals.append((opened, point))
            opened = None
    if opened is not None:
        intervals.append((opened, duration))
    return intervals


def frozen_intervals(video, duration):
    """(start_s, end_s) of every ffmpeg freezedetect run (noise 0.003, at least 1.0 s)."""
    log = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(video), "-map", "0:v:0",
                          "-vf", f"freezedetect=n={THRESHOLDS['freeze_noise']}:d={THRESHOLDS['freeze_min_s']}", "-f", "null", "-"],
                         check=True, capture_output=True, text=True, timeout=600).stderr
    return detected_intervals(log, "lavfi.freezedetect.freeze_start", "lavfi.freezedetect.freeze_end", duration)


def frozen_share(intervals, duration):
    return sum(b - a for a, b in intervals) / duration if duration else 0.0


def reference_frozen_share(path):
    """Frozen share of the reference: from its final_measure JSON, or measured from the video itself."""
    path = Path(path)
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text())
        data = data.get("final_measure", data)
        share = (data.get("measures") or {}).get("frozen_share")
        if not isinstance(share, (int, float)) or not 0 <= share <= 1:
            raise ValueError("Reference measure has no measures.frozen_share; pass the reference video instead")
        return float(share)
    probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_format", "-of", "json", str(path)],
                                      check=True, capture_output=True, text=True, timeout=60).stdout)
    duration = float(probe.get("format", {}).get("duration", 0))
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError("Reference duration is unknown")
    return frozen_share(frozen_intervals(path, duration), duration)


def silent_by_choice(raw_timeline):
    """The approved plan is silent on purpose: no speech and only intentional_silence.

    The plan needs the owner's request or a silent reference; GooseWorks checks that
    against the stored reference. Here the timeline must also be valid.
    """
    return (isinstance(raw_timeline, dict) and raw_timeline.get("speech_mode") == "none"
            and raw_timeline.get("soundtrack_modes") == ["intentional_silence"]
            and normalize_timeline(raw_timeline)["status"] == "complete")


def final_measure(video, final_sha, duration, has_audio, pcm, activity, raw_timeline, timeline, words, lines,
                  reference_share=None, reference_rate=None, plan=None, reference_setups=None):
    """gooseworks-final-measure/1. A fail is a finding graded in final_grade.py; not_applicable says why.

    reference_share is the reference's frozen-picture share (0-1) when a reference is supplied;
    reference_rate is its measured speaking rate (words/s, from reference_rate.py); plan is the
    approved shot plan (reference_shots.py PLAN.json); reference_setups its distinct setups.
    """
    thresholds = THRESHOLDS
    max_share = thresholds["max_frozen_share"]
    if reference_share is not None:
        max_share = max(max_share, reference_share + thresholds["reference_frozen_margin"])
    pauses = [p for p in (raw_timeline or {}).get("pauses", []) if isinstance(p, dict)
              and isinstance(p.get("start_ms"), int) and isinstance(p.get("end_ms"), int)]
    allowed_pauses = [(p["start_ms"] / 1000, p["end_ms"] / 1000) for p in pauses
                      if p.get("scope") == "all_audio" and p["end_ms"] - p["start_ms"] <= MAX_PAUSE_MS]
    freezes = [v for v in (raw_timeline or {}).get("visual_overrides", []) if isinstance(v, dict) and v.get("kind") == "freeze"
               and isinstance(v.get("start_ms"), int) and isinstance(v.get("end_ms"), int)]
    planned_ms = (raw_timeline or {}).get("duration_ms")
    allowed_freezes = [(v["start_ms"] / 1000, v["end_ms"] / 1000) for v in freezes
                       if v["end_ms"] - v["start_ms"] <= freeze_cap_ms(v["end_ms"], planned_ms)]
    step = thresholds["quiet_window_ms"] / 1000
    silent_plan = silent_by_choice(raw_timeline)
    silent_reason = "The approved plan is silent by choice (speech_mode none, soundtrack_modes [intentional_silence])"

    checks, quiet = sound_checks(has_audio, pcm, activity, duration, silent_plan, silent_reason, allowed_pauses)
    checks += word_checks(words, final_sha, lines, raw_timeline, reference_rate)

    # Timeline plans.
    if raw_timeline is None:
        checks.append(check("planned_pause_too_long", "not_applicable", "No timeline supplied (pass --timeline)"))
        checks.append(check("planned_freeze_too_long", "not_applicable", "No timeline supplied (pass --timeline)"))
    else:
        long_pauses = [(p["start_ms"] / 1000, p["end_ms"] / 1000) for p in pauses if p["end_ms"] - p["start_ms"] > MAX_PAUSE_MS]
        total = sum(b - a for a, b in merge([(p["start_ms"] / 1000, p["end_ms"] / 1000) for p in pauses]))
        too_much = total > MAX_PAUSE_SHARE * duration
        detail = []
        if long_pauses:
            detail.append(f"{len(long_pauses)} pause(s) over {MAX_PAUSE_MS} ms")
        if too_much:
            detail.append(f"pauses total {round(total, 2)} s, over {round(MAX_PAUSE_SHARE * 100)}% of the duration")
        checks.append(check("planned_pause_too_long", "fail" if detail else "pass", "; ".join(detail) or "Planned pauses within the caps", long_pauses))
        long_freezes = [(v["start_ms"] / 1000, v["end_ms"] / 1000) for v in freezes
                        if v["end_ms"] - v["start_ms"] > freeze_cap_ms(v["end_ms"], planned_ms)]
        checks.append(check("planned_freeze_too_long", "fail" if long_freezes else "pass",
                            f"{len(long_freezes)} freeze(s) over {MAX_FREEZE_MS} ms ({MAX_END_FREEZE_MS} ms for a hold that ends the video)" if long_freezes
                            else "Planned freezes within the cap", long_freezes))

    # Picture.
    frozen = frozen_intervals(video, duration)
    unplanned_frozen = beyond_edges([f for f in frozen if not covered(f[0], f[1], allowed_freezes)],
                                    duration, thresholds["unplanned_freeze_s"])
    share = frozen_share(frozen, duration)
    detail = []
    if unplanned_frozen:
        detail.append(f"{len(unplanned_frozen)} frozen stretch(es) over {thresholds['unplanned_freeze_s']} s with no planned freeze")
    if share > max_share + 1e-9:
        basis = "the reference's share plus 15 points" if reference_share is not None and max_share > thresholds["max_frozen_share"] else "the limit"
        detail.append(f"picture is frozen {round(share * 100)}% of the time, over {round(max_share * 100)}% ({basis}); a still-image ad")
    checks.append(check("frozen_picture", "fail" if detail else "pass", "; ".join(detail) or "No unplanned frozen picture", unplanned_frozen or (frozen if detail else [])))

    segments = sorted((timeline or {}).get("segments", []), key=lambda s: s["start_ms"])
    if segments:
        shots = [(s["start_ms"] / 1000, s["end_ms"] / 1000, s) for s in segments]
        basis = "timeline segments"
    else:
        edges = [0.0] + scene_cuts(video, duration, thresholds["scene_cut_threshold"], 0.001) + [duration]
        shots = [(a, b, None) for a, b in zip(edges, edges[1:])]
        basis = "detected scene cuts"
    hashes = [dhash(video, (a + b) / 2) if b - a > thresholds["repeated_shot_min_s"] else None for a, b, _ in shots]
    # A callback counts only through the approved plan: its shot row names the earlier shot it repeats.
    rows = [r for r in (plan or {}).get("shots", []) if isinstance(r, dict)]
    by_segment = {seg: r for r in rows for seg in as_list(r.get("segments"))}
    callbacks = [r for r in rows if r.get("callback_of") is not None]
    plan_bound = bool(rows) and (plan or {}).get("creative_contract_revision") == (raw_timeline or {}).get("creative_contract_revision")
    too_many = len(callbacks) > callback_cap(duration)

    def planned_callback(earlier, later):
        row, first = by_segment.get(later.get("id")), by_segment.get(earlier.get("id"))
        return (plan_bound and not too_many and str(later.get("intent", "")).startswith(CALLBACK_PREFIX)
                and row is not None and first is not None and row is not first and row.get("callback_of") == first.get("shot"))
    repeats, unplanned = [], 0
    for j in range(len(shots)):
        for i in range(j - 1):
            if hashes[i] is None or hashes[j] is None:
                continue
            if bin(hashes[i] ^ hashes[j]).count("1") <= thresholds["repeated_shot_max_hamming"]:
                if not planned_callback(shots[i][2] or {}, shots[j][2] or {}):
                    unplanned += str((shots[j][2] or {}).get("intent", "")).startswith(CALLBACK_PREFIX)
                    repeats.append((shots[i][0], shots[i][1]))
                    repeats.append((shots[j][0], shots[j][1]))
    why = ""
    if unplanned:
        why = (f"; {len(callbacks)} planned callbacks is over one per 15 s" if too_many else
               "; a `callback:` intent counts only with the approved plan (--plan, same creative_contract_revision) whose shot row names the earlier shot in callback_of")
    checks.append(check("repeated_shot", "fail" if repeats else "pass",
                        f"{len(repeats) // 2} repeated shot pair(s) from {basis}{why}; use new coverage" if repeats
                        else f"No repeated shots ({len(shots)} shots from {basis})", repeats))

    # Setups, counted as check-layer 1.8.0 counts them: consecutive segments of one source are one shot.
    if segments:
        spans = []
        for start, end, segment in shots:
            if spans and spans[-1][2] == segment["video"]["asset_id"] and abs(spans[-1][1] - start) < 0.05:
                spans[-1][1] = end
            else:
                spans.append([start, end, segment["video"]["asset_id"]])
        spans = [(a, b) for a, b, _ in spans]
    else:
        edges = [0.0] + scene_cuts(video, duration, thresholds["setup_cut_threshold"]) + [duration]
        spans = list(zip(edges, edges[1:]))
    setups = setup_count(video, duration, spans)
    changed = listed((plan or {}).get("changes_from_reference"), {"shots"}) and rows
    if reference_setups is None:
        checks.append(check("setup_count_vs_reference", "not_applicable",
                            "Needs the reference (--reference video or --reference-shots shot-table.json)"))
    else:
        target, whose = (totals(rows)["setups"], "the plan's (a `shots` change is listed)") if changed else (reference_setups, "the reference's")
        floor = thresholds["setup_min_ratio"] * target
        checks.append(check("setup_count_vs_reference", "fail" if setups < floor - 1e-9 else "pass",
                            f"{setups} distinct setups against {whose} {target}; under {round(floor, 1)} fails"
                            + ("; plan new setups (people, rooms, framings, actions) or list a `shots` change" if setups < floor - 1e-9 else ""),
                            [(0, duration)] if setups < floor - 1e-9 else []))

    if not segments:
        checks.append(check("speech_over_silent_face", "not_applicable", "No valid timeline supplied (pass --timeline)"))
    else:
        found = []
        for segment in segments:
            if not segment.get("depicts_speech"):
                continue
            first, last = segment["start_ms"] / 1000, segment["end_ms"] / 1000
            flags = [q for index, q in enumerate(quiet) if first <= index * step and (index + 1) * step <= last + 1e-9]
            offset = math.ceil(first / step - 1e-9) * step
            found += [(offset + a, offset + b) for a, b in runs(flags, step, thresholds["silent_face_s"])]
        checks.append(check("speech_over_silent_face", "fail" if found else "pass",
                            f"{len(found)} silent stretch(es) over {thresholds['silent_face_s']} s while a face is shown speaking" if found
                            else "Speaking faces have sound", found))

    return {"format": FINAL_MEASURE_FORMAT, "output_sha256": final_sha, "measured_duration_ms": round(duration * 1000),
            "checks": checks, "measures": {"frozen_share": round(share, 4), "shots": len(shots), "setups": setups},
            "thresholds": {**thresholds, "max_frozen_share_applied": round(max_share, 4),
                           "reference_frozen_share": None if reference_share is None else round(reference_share, 4)}}


def merge(intervals):
    merged = []
    for a, b in sorted(intervals):
        if merged and a <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], b))
        else:
            merged.append((a, b))
    return merged
