"""Shared assembly-timeline constants, helpers and the cross-segment rules (see assembly_timeline.py)."""
import hashlib
import json
import math
import re

FORMAT = "gooseworks-assembly-timeline/1"
SPEECH_MODES = {"native_dialogue", "audio_driven_lipsync", "narration", "singing", "mixed", "none"}
SOUNDTRACK_MODES = {"source_ambience", "music", "sfx", "intentional_silence"}
SPEECH_ROLES = SPEECH_MODES - {"mixed", "none"}
AUDIO_ROLES = SPEECH_ROLES | (SOUNDTRACK_MODES - {"intentional_silence"})

# Caps shared with gooseworks-final-measure/1 (the final file checks).
MAX_PAUSE_MS = 1500          # one planned pause
MAX_PAUSE_SHARE = 0.10       # all planned pauses together, share of the duration
MAX_FREEZE_MS = 1500         # one planned freeze override
MAX_END_FREEZE_MS = 3000     # a planned freeze that ends the video (end card hold)
MAX_ZOOM = 1.5               # largest zoom: crop fit-scale / full-frame fit-scale
MAX_UPSCALE = MAX_ZOOM       # read-time alias for one release; resolution scaling itself is not capped
MAX_UPSCALED_ZOOM = 1.1      # crop zoom on a source below the output's resolution: it multiplies with the upscale
MAX_STRETCH = 0.02           # largest |scale_x / scale_y - 1|
CALLBACK_PREFIX = "callback:"  # intent "callback: <earlier segment id> <reason>" marks a planned repeat
CALLBACK_EVERY_MS = 15000      # at most one callback per 15 s (one in a shorter video)
INTEGER_KEYS = {"x", "y", "w", "h"}


def freeze_cap_ms(end_ms, duration_ms):
    """A freeze that ends at duration_ms (the last shot) may hold up to 3 s; any other freeze 1.5 s."""
    return MAX_END_FREEZE_MS if end_ms == duration_ms else MAX_FREEZE_MS


def names_callback(later, earlier):
    """The later segment's intent is a callback that names the earlier segment's id."""
    intent = str(later.get("intent", ""))
    return intent.startswith(CALLBACK_PREFIX) and str(earlier.get("id")) in re.findall(r"[\w.-]+", intent[len(CALLBACK_PREFIX):])


def zoom_factor(crop, source_w, source_h, out_w, out_h):
    """How far a crop zooms in: the crop's fill scale divided by the full source frame's fill scale.

    Scaling a whole small frame up to the output (H3's 432x768 to 1080x1920) is zoom 1.0.
    """
    full = max(out_w / source_w, out_h / source_h)
    return max(out_w / crop["w"], out_h / crop["h"]) / full


def is_ms(value):
    return isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 9_007_199_254_740_991


def is_px(value):
    return isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 100_000


def non_integers(value, where="timeline"):
    """Milliseconds and pixels must be integers so the revision survives a database round trip."""
    found = []
    if isinstance(value, dict):
        for key, item in value.items():
            if (key.endswith("_ms") or key in INTEGER_KEYS) and isinstance(item, float):
                found.append(f"{where}.{key}")
            found += non_integers(item, f"{where}.{key}")
    elif isinstance(value, list):
        for index, item in enumerate(value):
            found += non_integers(item, f"{where}[{index}]")
    return found


def union_ms(intervals):
    total, end = 0, None
    for start, stop in sorted((i["start_ms"], i["end_ms"]) for i in intervals):
        if end is None or start > end:
            total += stop - start
            end = stop
        elif stop > end:
            total += stop - end
            end = stop
    return total


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def is_text(value):
    return isinstance(value, str) and bool(value.strip())


def is_hash(value):
    return isinstance(value, str) and bool(re.fullmatch(r"[a-f0-9]{64}", value))


def portable(value):
    if isinstance(value, dict):
        return {key: portable(item) for key, item in value.items() if key != "path"}
    if isinstance(value, list):
        return [portable(item) for item in value]
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def timeline_revision(timeline):
    encoded = json.dumps(portable(timeline), ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def gaps(intervals, duration):
    missing, end = [], 0
    for item in sorted(intervals, key=lambda item: item["start_ms"]):
        if item["start_ms"] > end + 1:
            missing.append({"start_ms": end, "end_ms": item["start_ms"]})
        end = max(end, item["end_ms"])
    if end < duration - 1:
        missing.append({"start_ms": end, "end_ms": duration})
    return missing



def relation_issues(raw, duration, modes):
    """Issues across segments and cues of a timeline whose fields are already valid."""
    issues = []
    if gaps(raw["segments"] + raw.get("visual_overrides", []), duration):
        issues.append("Picture has undeclared padding or missing source coverage")
    for index, left in enumerate(raw["segments"]):
        for right in raw["segments"][index + 1:]:
            start, end = max(left["start_ms"], right["start_ms"]), min(left["end_ms"], right["end_ms"])
            if end > start + 1 and not any(v["kind"] == "transition" and v["start_ms"] <= start and v["end_ms"] >= end and left["id"] in v.get("segment_ids", []) and right["id"] in v.get("segment_ids", []) for v in raw.get("visual_overrides", [])):
                issues.append(f"{left['id']}/{right['id']}: picture overlap needs a declared transition")
    ordered = sorted(raw["segments"], key=lambda s: (s["start_ms"], s["end_ms"]))
    for index, later in enumerate(ordered):
        for earlier in ordered[:max(0, index - 1)]:
            a, b = earlier["video"], later["video"]
            if (a["sha256"] == b["sha256"] and min(a["out_ms"], b["out_ms"]) > max(a["in_ms"], b["in_ms"])
                    and earlier["end_ms"] - earlier["start_ms"] > 1000 and later["end_ms"] - later["start_ms"] > 1000
                    and not names_callback(later, earlier)):
                issues.append(f"{later['id']}: repeats {earlier['id']}'s source picture; use new coverage, or for a planned callback set intent \"{CALLBACK_PREFIX} {earlier['id']} <reason>\"")
    callbacks = [s["id"] for s in raw["segments"] if str(s.get("intent", "")).startswith(CALLBACK_PREFIX)]
    if len(callbacks) > max(1, duration // CALLBACK_EVERY_MS):
        issues.append(f"{len(callbacks)} callback segments in {duration} ms; at most one per 15 s")
    for segment in raw["segments"]:
        if not segment["depicts_speech"]:
            continue
        if segment["speech_mode"] == "native_dialogue":
            video = segment["video"]
            for cue in raw["audio_cues"]:
                if (cue["role"] in SPEECH_ROLES and cue["source"]["sha256"] == video["sha256"]
                        and cue["start_ms"] < segment["end_ms"] and cue["end_ms"] > segment["start_ms"]
                        and cue["source"]["speed"] != video["speed"]):
                    issues.append(f"{segment['id']}: a speaking segment may change speed only when its picture and audio change together")
                    break
        driver = segment["speech_driver"] if segment["speech_mode"] == "audio_driven_lipsync" else segment["video"]
        matching = []
        for cue in raw["audio_cues"]:
            source = cue["source"]
            if (cue["role"] in SPEECH_ROLES and source["sha256"] == driver["sha256"]
                    and source["asset_id"] == driver["asset_id"] and source["speed"] == driver["speed"] and not cue["loop"]
                    and abs(source["in_ms"] + (segment["start_ms"] - cue["start_ms"]) * source["speed"] - driver["in_ms"]) <= 1):
                start = max(segment["start_ms"], cue["start_ms"]) - segment["start_ms"]
                end = min(segment["end_ms"], cue["end_ms"]) - segment["start_ms"]
                if end > start:
                    matching.append({"start_ms": start, "end_ms": end})
        if gaps(matching, segment["end_ms"] - segment["start_ms"]):
            issues.append(f"{segment['id']}: driver audio does not cover the speaking picture on its source clock")
    silence = "intentional_silence" in modes
    for index, left in enumerate(raw["audio_cues"]):
        for right in raw["audio_cues"][index + 1:]:
            if left["role"] not in SPEECH_ROLES or right["role"] not in SPEECH_ROLES:
                continue
            start, end = max(left["start_ms"], right["start_ms"]), min(left["end_ms"], right["end_ms"])
            if end <= start + 1:
                continue
            same_source = all(left["source"][key] == right["source"][key] for key in ("sha256", "in_ms", "out_ms", "speed"))
            if same_source and left["start_ms"] == right["start_ms"] and left["end_ms"] == right["end_ms"]:
                issues.append(f"{left['id']}/{right['id']}: duplicated speech bus")
            elif not (is_text(left.get("intent")) and is_text(right.get("intent"))) and not any(v["kind"] == "transition" and v["start_ms"] <= start and v["end_ms"] >= end for v in raw.get("visual_overrides", [])):
                issues.append(f"{left['id']}/{right['id']}: overlapping speech needs intent")
    if silence and (len(modes) != 1 or raw["audio_cues"] or raw["speech_mode"] != "none"):
        issues.append("total intentional silence conflicts with sound or speech")
    for role in ("source_ambience", "music", "sfx"):
        if role in modes and not any(cue["role"] == role for cue in raw["audio_cues"]):
            issues.append(f"planned {role} has no cue")
    if not silence:
        coverage = raw["audio_cues"] + [p for p in raw["pauses"] if p["scope"] == "all_audio"]
        for gap in gaps(coverage, duration):
            issues.append(f"unplanned audio gap {gap['start_ms']}–{gap['end_ms']}ms")
    if raw["speech_mode"] == "none" and any(c["role"] in SPEECH_ROLES for c in raw["audio_cues"]):
        issues.append("No-speech intent conflicts with speech cues")
    if raw["speech_mode"] != "none":
        # Speech must cover every segment that plans speech; segments planned
        # as speech_mode none (B-roll under music, an end card) need none.
        speech_coverage = [c for c in raw["audio_cues"] if c["role"] in SPEECH_ROLES] + raw["pauses"]
        for segment in ordered:
            if segment["speech_mode"] == "none":
                continue
            inside = [{"start_ms": max(i["start_ms"], segment["start_ms"]) - segment["start_ms"],
                       "end_ms": min(i["end_ms"], segment["end_ms"]) - segment["start_ms"]}
                      for i in speech_coverage if i["end_ms"] > segment["start_ms"] and i["start_ms"] < segment["end_ms"]]
            for gap in gaps(inside, segment["end_ms"] - segment["start_ms"]):
                issues.append(f"unplanned speech gap {gap['start_ms'] + segment['start_ms']}–{gap['end_ms'] + segment['start_ms']}ms in {segment['id']}; music does not replace speech intent")
    return issues
