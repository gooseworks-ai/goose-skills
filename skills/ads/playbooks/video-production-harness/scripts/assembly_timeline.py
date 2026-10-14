"""Portable assembly intent and clock checks; never an audiovisual verdict."""
import hashlib
import json
import math
import re

FORMAT = "gooseworks-assembly-timeline/1"
SPEECH_MODES = {"native_dialogue", "audio_driven_lipsync", "narration", "singing", "mixed", "none"}
SOUNDTRACK_MODES = {"source_ambience", "music", "sfx", "intentional_silence"}
SPEECH_ROLES = SPEECH_MODES - {"mixed", "none"}
AUDIO_ROLES = SPEECH_ROLES | (SOUNDTRACK_MODES - {"intentional_silence"})


def is_ms(value):
    return isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 9_007_199_254_740_991


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


def normalize_timeline(raw, legacy=None):
    if not isinstance(raw, dict):
        return {"status": "incomplete", "timeline": None, "revision": None,
                "issues": ["Source-linked assembly timeline is missing; legacy sound intent requires review"],
                **({"legacy": legacy} if legacy is not None else {})}
    issues = []
    if raw.get("format") != FORMAT:
        issues.append(f"assembly format must be {FORMAT}")
    if not is_hash(raw.get("creative_contract_revision")):
        issues.append("creative_contract_revision must identify approved bytes")
    duration = raw.get("duration_ms")
    if not is_ms(duration) or not 0 < duration <= 180_000:
        issues.append("duration_ms must be 1–180000")
    if not is_text(raw.get("speech_mode")) or raw.get("speech_mode") not in SPEECH_MODES:
        issues.append("speech_mode is missing or unknown")
    modes = raw.get("soundtrack_modes")
    if not isinstance(modes, list) or any(not isinstance(m, str) or m not in SOUNDTRACK_MODES for m in modes) or len(set(modes)) != len(modes):
        issues.append("soundtrack_modes must be explicit and unique; [] means no extra soundtrack")
    for key, limit in (("segments", 300), ("audio_cues", 500), ("pauses", 500), ("required_cue_ids", 500)):
        values = raw.get(key)
        if not isinstance(values, list) or len(values) > limit or (key == "segments" and not values):
            issues.append(f"{key} must be an explicit list within its limit")
    if "visual_overrides" in raw and (not isinstance(raw["visual_overrides"], list) or len(raw["visual_overrides"]) > 500):
        issues.append("visual_overrides must be a bounded explicit list")
    if issues:
        return {"status": "invalid", "timeline": None, "revision": None, "issues": issues}

    def source_ok(source, name):
        valid = (isinstance(source, dict) and is_text(source.get("asset_id")) and is_hash(source.get("sha256"))
                 and is_ms(source.get("in_ms")) and is_ms(source.get("out_ms"))
                 and source["out_ms"] > source["in_ms"] and is_number(source.get("speed"))
                 and 0.25 <= source["speed"] <= 4)
        if not valid:
            issues.append(f"{name}: exact asset, hash, bounds and supported speed required")
        return valid

    def range_ok(item, name):
        valid = (isinstance(item, dict) and is_ms(item.get("start_ms")) and is_ms(item.get("end_ms"))
                 and 0 <= item["start_ms"] < item["end_ms"] <= duration)
        if not valid:
            issues.append(f"{name}: invalid final bounds")
        return valid

    identifiers = set()
    for segment in raw["segments"]:
        if not isinstance(segment, dict):
            issues.append("segment must be an object")
            continue
        name = segment.get("id")
        if not is_text(name) or name in identifiers or not is_text(segment.get("scene_id")):
            issues.append("segment ids must be unique and scene_id required")
        if is_text(name):
            identifiers.add(name)
        if not is_text(segment.get("speech_mode")) or segment.get("speech_mode") not in SPEECH_MODES or not isinstance(segment.get("depicts_speech"), bool) or segment.get("native_audio") not in ("preserve", "muted"):
            issues.append(f"{name}: explicit speech and native audio decisions required")
        if range_ok(segment, name) and source_ok(segment.get("video"), name):
            source = segment["video"]
            if abs((source["out_ms"] - source["in_ms"]) / source["speed"] - (segment["end_ms"] - segment["start_ms"])) > 1:
                issues.append(f"{name}: picture source duration/rate differs from final interval")
            if source["speed"] != 1 and not is_text(segment.get("intent")):
                issues.append(f"{name}: speed change needs intent")
        if segment.get("depicts_speech"):
            if segment.get("speech_mode") not in ("native_dialogue", "audio_driven_lipsync", "singing"):
                issues.append(f"{name}: speaking face cannot use narration-only or no-speech routing")
            if segment.get("speech_mode") == "native_dialogue" and segment.get("native_audio") != "preserve":
                issues.append(f"{name}: native dialogue may not be muted")
            if segment.get("speech_mode") == "audio_driven_lipsync" and (not source_ok(segment.get("speech_driver"), f"{name} driver") or segment["speech_driver"].get("task") != "exact_audio"):
                issues.append(f"{name}: exact driver required; voice reference is not a driver")
            elif segment.get("speech_mode") == "audio_driven_lipsync" and is_ms(segment.get("start_ms")) and is_ms(segment.get("end_ms")):
                driver = segment["speech_driver"]
                if abs((driver["out_ms"] - driver["in_ms"]) / driver["speed"] - (segment["end_ms"] - segment["start_ms"])) > 1:
                    issues.append(f"{name}: driver window/rate differs from speaking picture")
    identifiers.clear()
    for cue in raw["audio_cues"]:
        if not isinstance(cue, dict):
            issues.append("audio cue must be an object")
            continue
        name = cue.get("id")
        if not is_text(name) or name in identifiers:
            issues.append("cue ids must be unique")
        if is_text(name):
            identifiers.add(name)
        if not is_text(cue.get("role")) or cue.get("role") not in AUDIO_ROLES:
            issues.append(f"{name}: unknown audio role")
        if not is_number(cue.get("gain_db")) or not -80 <= cue["gain_db"] <= 24 or not isinstance(cue.get("loop"), bool):
            issues.append(f"{name}: explicit supported gain and loop decision required")
        if range_ok(cue, name) and source_ok(cue.get("source"), name):
            source = cue["source"]
            if not cue.get("loop") and abs((source["out_ms"] - source["in_ms"]) / source["speed"] - (cue["end_ms"] - cue["start_ms"])) > 1:
                issues.append(f"{name}: audio source clock differs from final interval")
            if (cue.get("loop") or source["speed"] != 1) and not is_text(cue.get("intent")):
                issues.append(f"{name}: looping/retiming needs intent")
            if cue.get("loop") and is_text(cue.get("role")) and cue.get("role") in SPEECH_ROLES:
                issues.append(f"{name}: speech cannot loop to fill a scene")
    for cue_id in raw["required_cue_ids"]:
        if not is_text(cue_id) or cue_id not in identifiers:
            issues.append("a required cue is missing or invalid")
    for pause in raw["pauses"]:
        if not range_ok(pause, "pause") or not is_text(pause.get("reason")) or pause.get("scope") not in ("speech", "all_audio"):
            issues.append("every pause needs its range, scope and reason")
    for override in raw.get("visual_overrides", []):
        if not range_ok(override, "visual override") or not is_text(override.get("reason")) or override.get("kind") not in ("freeze", "transition"):
            issues.append("visual overrides need bounds, kind and reason")
        elif override["kind"] == "freeze" and not source_ok(override.get("source"), "freeze frame"):
            issues.append("freeze requires its exact source")
        elif override["kind"] == "transition" and (not isinstance(override.get("segment_ids"), list) or len(override["segment_ids"]) < 2 or any(not any(s.get("id") == name for s in raw["segments"] if isinstance(s, dict)) for name in override["segment_ids"])):
            issues.append("transition must name its source segments")
    if issues:
        return {"status": "invalid", "timeline": None, "revision": None, "issues": issues}
    if gaps(raw["segments"] + raw.get("visual_overrides", []), duration):
        issues.append("Picture has undeclared padding or missing source coverage")
    for index, left in enumerate(raw["segments"]):
        for right in raw["segments"][index + 1:]:
            start, end = max(left["start_ms"], right["start_ms"]), min(left["end_ms"], right["end_ms"])
            if end > start + 1 and not any(v["kind"] == "transition" and v["start_ms"] <= start and v["end_ms"] >= end and left["id"] in v.get("segment_ids", []) and right["id"] in v.get("segment_ids", []) for v in raw.get("visual_overrides", [])):
                issues.append(f"{left['id']}/{right['id']}: picture overlap needs a declared transition")
    for segment in raw["segments"]:
        if not segment["depicts_speech"]:
            continue
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
        speech_coverage = [c for c in raw["audio_cues"] if c["role"] in SPEECH_ROLES] + raw["pauses"]
        for gap in gaps(speech_coverage, duration):
            issues.append(f"unplanned speech gap {gap['start_ms']}–{gap['end_ms']}ms; music does not replace speech intent")
    return {"status": "invalid" if issues else "complete", "timeline": raw,
            "revision": timeline_revision(raw), "issues": issues}
